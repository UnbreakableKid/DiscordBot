import { BufWriter } from "../io/bufio.ts";
import { TextProtoReader } from "../textproto/mod.ts";
import { assert } from "../_util/assert.ts";
import { encoder } from "../encoding/utf8.ts";
import { ServerRequest } from "./server.ts";
import { STATUS_TEXT } from "./http_status.ts";
export function emptyReader() {
  return {
    read(_) {
      return Promise.resolve(null);
    },
  };
}
export function bodyReader(contentLength, r) {
  let totalRead = 0;
  let finished = false;
  async function read(buf) {
    if (finished) return null;
    let result;
    const remaining = contentLength - totalRead;
    if (remaining >= buf.byteLength) {
      result = await r.read(buf);
    } else {
      const readBuf = buf.subarray(0, remaining);
      result = await r.read(readBuf);
    }
    if (result !== null) {
      totalRead += result;
    }
    finished = totalRead === contentLength;
    return result;
  }
  return {
    read,
  };
}
export function chunkedBodyReader(h, r) {
  // Based on https://tools.ietf.org/html/rfc2616#section-19.4.6
  const tp = new TextProtoReader(r);
  let finished = false;
  const chunks = [];
  async function read(buf) {
    if (finished) return null;
    const [chunk] = chunks;
    if (chunk) {
      const chunkRemaining = chunk.data.byteLength - chunk.offset;
      const readLength = Math.min(chunkRemaining, buf.byteLength);
      for (let i = 0; i < readLength; i++) {
        buf[i] = chunk.data[chunk.offset + i];
      }
      chunk.offset += readLength;
      if (chunk.offset === chunk.data.byteLength) {
        chunks.shift();
        // Consume \r\n;
        if (await tp.readLine() === null) {
          throw new Deno.errors.UnexpectedEof();
        }
      }
      return readLength;
    }
    const line = await tp.readLine();
    if (line === null) throw new Deno.errors.UnexpectedEof();
    // TODO: handle chunk extension
    const [chunkSizeString] = line.split(";");
    const chunkSize = parseInt(chunkSizeString, 16);
    if (Number.isNaN(chunkSize) || chunkSize < 0) {
      throw new Error("Invalid chunk size");
    }
    if (chunkSize > 0) {
      if (chunkSize > buf.byteLength) {
        let eof = await r.readFull(buf);
        if (eof === null) {
          throw new Deno.errors.UnexpectedEof();
        }
        const restChunk = new Uint8Array(chunkSize - buf.byteLength);
        eof = await r.readFull(restChunk);
        if (eof === null) {
          throw new Deno.errors.UnexpectedEof();
        } else {
          chunks.push({
            offset: 0,
            data: restChunk,
          });
        }
        return buf.byteLength;
      } else {
        const bufToFill = buf.subarray(0, chunkSize);
        const eof = await r.readFull(bufToFill);
        if (eof === null) {
          throw new Deno.errors.UnexpectedEof();
        }
        // Consume \r\n
        if (await tp.readLine() === null) {
          throw new Deno.errors.UnexpectedEof();
        }
        return chunkSize;
      }
    } else {
      assert(chunkSize === 0);
      // Consume \r\n
      if (await r.readLine() === null) {
        throw new Deno.errors.UnexpectedEof();
      }
      await readTrailers(h, r);
      finished = true;
      return null;
    }
  }
  return {
    read,
  };
}
function isProhibidedForTrailer(key) {
  const s = new Set([
    "transfer-encoding",
    "content-length",
    "trailer",
  ]);
  return s.has(key.toLowerCase());
}
/** Read trailer headers from reader and append values to headers. "trailer"
 * field will be deleted. */ export async function readTrailers(headers, r) {
  const trailers = parseTrailer(headers.get("trailer"));
  if (trailers == null) return;
  const trailerNames = [
    ...trailers.keys(),
  ];
  const tp = new TextProtoReader(r);
  const result = await tp.readMIMEHeader();
  if (result == null) {
    throw new Deno.errors.InvalidData("Missing trailer header.");
  }
  const undeclared = [
    ...result.keys(),
  ].filter((k) => !trailerNames.includes(k));
  if (undeclared.length > 0) {
    throw new Deno.errors.InvalidData(
      `Undeclared trailers: ${Deno.inspect(undeclared)}.`,
    );
  }
  for (const [k, v] of result) {
    headers.append(k, v);
  }
  const missingTrailers = trailerNames.filter((k) => !result.has(k));
  if (missingTrailers.length > 0) {
    throw new Deno.errors.InvalidData(
      `Missing trailers: ${Deno.inspect(missingTrailers)}.`,
    );
  }
  headers.delete("trailer");
}
function parseTrailer(field) {
  if (field == null) {
    return undefined;
  }
  const trailerNames = field.split(",").map((v) => v.trim().toLowerCase());
  if (trailerNames.length === 0) {
    throw new Deno.errors.InvalidData("Empty trailer header.");
  }
  const prohibited = trailerNames.filter((k) => isProhibidedForTrailer(k));
  if (prohibited.length > 0) {
    throw new Deno.errors.InvalidData(
      `Prohibited trailer names: ${Deno.inspect(prohibited)}.`,
    );
  }
  return new Headers(trailerNames.map((key) => [
    key,
    "",
  ]));
}
export async function writeChunkedBody(w, r) {
  const writer = BufWriter.create(w);
  for await (const chunk of Deno.iter(r)) {
    if (chunk.byteLength <= 0) continue;
    const start = encoder.encode(`${chunk.byteLength.toString(16)}\r\n`);
    const end = encoder.encode("\r\n");
    await writer.write(start);
    await writer.write(chunk);
    await writer.write(end);
  }
  const endChunk = encoder.encode("0\r\n\r\n");
  await writer.write(endChunk);
}
/** Write trailer headers to writer. It should mostly should be called after
 * `writeResponse()`. */ export async function writeTrailers(
  w,
  headers,
  trailers,
) {
  const trailer = headers.get("trailer");
  if (trailer === null) {
    throw new TypeError("Missing trailer header.");
  }
  const transferEncoding = headers.get("transfer-encoding");
  if (transferEncoding === null || !transferEncoding.match(/^chunked/)) {
    throw new TypeError(
      `Trailers are only allowed for "transfer-encoding: chunked", got "transfer-encoding: ${transferEncoding}".`,
    );
  }
  const writer = BufWriter.create(w);
  const trailerNames = trailer.split(",").map((s) => s.trim().toLowerCase());
  const prohibitedTrailers = trailerNames.filter((k) =>
    isProhibidedForTrailer(k)
  );
  if (prohibitedTrailers.length > 0) {
    throw new TypeError(
      `Prohibited trailer names: ${Deno.inspect(prohibitedTrailers)}.`,
    );
  }
  const undeclared = [
    ...trailers.keys(),
  ].filter((k) => !trailerNames.includes(k));
  if (undeclared.length > 0) {
    throw new TypeError(`Undeclared trailers: ${Deno.inspect(undeclared)}.`);
  }
  for (const [key, value] of trailers) {
    await writer.write(encoder.encode(`${key}: ${value}\r\n`));
  }
  await writer.write(encoder.encode("\r\n"));
  await writer.flush();
}
export async function writeResponse(w, r) {
  const protoMajor = 1;
  const protoMinor = 1;
  const statusCode = r.status || 200;
  const statusText = STATUS_TEXT.get(statusCode);
  const writer = BufWriter.create(w);
  if (!statusText) {
    throw new Deno.errors.InvalidData("Bad status code");
  }
  if (!r.body) {
    r.body = new Uint8Array();
  }
  if (typeof r.body === "string") {
    r.body = encoder.encode(r.body);
  }
  let out = `HTTP/${protoMajor}.${protoMinor} ${statusCode} ${statusText}\r\n`;
  const headers = r.headers ?? new Headers();
  if (r.body && !headers.get("content-length")) {
    if (r.body instanceof Uint8Array) {
      out += `content-length: ${r.body.byteLength}\r\n`;
    } else if (!headers.get("transfer-encoding")) {
      out += "transfer-encoding: chunked\r\n";
    }
  }
  for (const [key, value] of headers) {
    out += `${key}: ${value}\r\n`;
  }
  out += `\r\n`;
  const header = encoder.encode(out);
  const n = await writer.write(header);
  assert(n === header.byteLength);
  if (r.body instanceof Uint8Array) {
    const n = await writer.write(r.body);
    assert(n === r.body.byteLength);
  } else if (headers.has("content-length")) {
    const contentLength = headers.get("content-length");
    assert(contentLength != null);
    const bodyLength = parseInt(contentLength);
    const n = await Deno.copy(r.body, writer);
    assert(n === bodyLength);
  } else {
    await writeChunkedBody(writer, r.body);
  }
  if (r.trailers) {
    const t = await r.trailers();
    await writeTrailers(writer, headers, t);
  }
  await writer.flush();
}
/**
 * ParseHTTPVersion parses a HTTP version string.
 * "HTTP/1.0" returns (1, 0).
 * Ported from https://github.com/golang/go/blob/f5c43b9/src/net/http/request.go#L766-L792
 */ export function parseHTTPVersion(vers) {
  switch (vers) {
    case "HTTP/1.1":
      return [
        1,
        1,
      ];
    case "HTTP/1.0":
      return [
        1,
        0,
      ];
    default: {
      const Big = 1000000; // arbitrary upper bound
      if (!vers.startsWith("HTTP/")) {
        break;
      }
      const dot = vers.indexOf(".");
      if (dot < 0) {
        break;
      }
      const majorStr = vers.substring(vers.indexOf("/") + 1, dot);
      const major = Number(majorStr);
      if (!Number.isInteger(major) || major < 0 || major > Big) {
        break;
      }
      const minorStr = vers.substring(dot + 1);
      const minor = Number(minorStr);
      if (!Number.isInteger(minor) || minor < 0 || minor > Big) {
        break;
      }
      return [
        major,
        minor,
      ];
    }
  }
  throw new Error(`malformed HTTP version ${vers}`);
}
export async function readRequest(conn, bufr) {
  const tp = new TextProtoReader(bufr);
  const firstLine = await tp.readLine(); // e.g. GET /index.html HTTP/1.0
  if (firstLine === null) return null;
  const headers = await tp.readMIMEHeader();
  if (headers === null) throw new Deno.errors.UnexpectedEof();
  const req = new ServerRequest();
  req.conn = conn;
  req.r = bufr;
  [req.method, req.url, req.proto] = firstLine.split(" ", 3);
  [req.protoMinor, req.protoMajor] = parseHTTPVersion(req.proto);
  req.headers = headers;
  fixLength(req);
  return req;
}
function fixLength(req) {
  const contentLength = req.headers.get("Content-Length");
  if (contentLength) {
    const arrClen = contentLength.split(",");
    if (arrClen.length > 1) {
      const distinct = [
        ...new Set(arrClen.map((e) => e.trim())),
      ];
      if (distinct.length > 1) {
        throw Error("cannot contain multiple Content-Length headers");
      } else {
        req.headers.set("Content-Length", distinct[0]);
      }
    }
    const c = req.headers.get("Content-Length");
    if (req.method === "HEAD" && c && c !== "0") {
      throw Error("http: method cannot contain a Content-Length");
    }
    if (c && req.headers.has("transfer-encoding")) {
      // A sender MUST NOT send a Content-Length header field in any message
      // that contains a Transfer-Encoding header field.
      // rfc: https://tools.ietf.org/html/rfc7230#section-3.3.2
      throw new Error(
        "http: Transfer-Encoding and Content-Length cannot be send together",
      );
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC42Ni4wL2h0dHAvX2lvLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCdWZSZWFkZXIsIEJ1ZldyaXRlciB9IGZyb20gXCIuLi9pby9idWZpby50c1wiO1xuaW1wb3J0IHsgVGV4dFByb3RvUmVhZGVyIH0gZnJvbSBcIi4uL3RleHRwcm90by9tb2QudHNcIjtcbmltcG9ydCB7IGFzc2VydCB9IGZyb20gXCIuLi9fdXRpbC9hc3NlcnQudHNcIjtcbmltcG9ydCB7IGVuY29kZXIgfSBmcm9tIFwiLi4vZW5jb2RpbmcvdXRmOC50c1wiO1xuaW1wb3J0IHsgU2VydmVyUmVxdWVzdCwgUmVzcG9uc2UgfSBmcm9tIFwiLi9zZXJ2ZXIudHNcIjtcbmltcG9ydCB7IFNUQVRVU19URVhUIH0gZnJvbSBcIi4vaHR0cF9zdGF0dXMudHNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGVtcHR5UmVhZGVyKCk6IERlbm8uUmVhZGVyIHtcbiAgcmV0dXJuIHtcbiAgICByZWFkKF86IFVpbnQ4QXJyYXkpOiBQcm9taXNlPG51bWJlciB8IG51bGw+IHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgfSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJvZHlSZWFkZXIoY29udGVudExlbmd0aDogbnVtYmVyLCByOiBCdWZSZWFkZXIpOiBEZW5vLlJlYWRlciB7XG4gIGxldCB0b3RhbFJlYWQgPSAwO1xuICBsZXQgZmluaXNoZWQgPSBmYWxzZTtcbiAgYXN5bmMgZnVuY3Rpb24gcmVhZChidWY6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPG51bWJlciB8IG51bGw+IHtcbiAgICBpZiAoZmluaXNoZWQpIHJldHVybiBudWxsO1xuICAgIGxldCByZXN1bHQ6IG51bWJlciB8IG51bGw7XG4gICAgY29uc3QgcmVtYWluaW5nID0gY29udGVudExlbmd0aCAtIHRvdGFsUmVhZDtcbiAgICBpZiAocmVtYWluaW5nID49IGJ1Zi5ieXRlTGVuZ3RoKSB7XG4gICAgICByZXN1bHQgPSBhd2FpdCByLnJlYWQoYnVmKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVhZEJ1ZiA9IGJ1Zi5zdWJhcnJheSgwLCByZW1haW5pbmcpO1xuICAgICAgcmVzdWx0ID0gYXdhaXQgci5yZWFkKHJlYWRCdWYpO1xuICAgIH1cbiAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICB0b3RhbFJlYWQgKz0gcmVzdWx0O1xuICAgIH1cbiAgICBmaW5pc2hlZCA9IHRvdGFsUmVhZCA9PT0gY29udGVudExlbmd0aDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIHJldHVybiB7IHJlYWQgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNodW5rZWRCb2R5UmVhZGVyKGg6IEhlYWRlcnMsIHI6IEJ1ZlJlYWRlcik6IERlbm8uUmVhZGVyIHtcbiAgLy8gQmFzZWQgb24gaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzI2MTYjc2VjdGlvbi0xOS40LjZcbiAgY29uc3QgdHAgPSBuZXcgVGV4dFByb3RvUmVhZGVyKHIpO1xuICBsZXQgZmluaXNoZWQgPSBmYWxzZTtcbiAgY29uc3QgY2h1bmtzOiBBcnJheTx7XG4gICAgb2Zmc2V0OiBudW1iZXI7XG4gICAgZGF0YTogVWludDhBcnJheTtcbiAgfT4gPSBbXTtcbiAgYXN5bmMgZnVuY3Rpb24gcmVhZChidWY6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPG51bWJlciB8IG51bGw+IHtcbiAgICBpZiAoZmluaXNoZWQpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IFtjaHVua10gPSBjaHVua3M7XG4gICAgaWYgKGNodW5rKSB7XG4gICAgICBjb25zdCBjaHVua1JlbWFpbmluZyA9IGNodW5rLmRhdGEuYnl0ZUxlbmd0aCAtIGNodW5rLm9mZnNldDtcbiAgICAgIGNvbnN0IHJlYWRMZW5ndGggPSBNYXRoLm1pbihjaHVua1JlbWFpbmluZywgYnVmLmJ5dGVMZW5ndGgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWFkTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYnVmW2ldID0gY2h1bmsuZGF0YVtjaHVuay5vZmZzZXQgKyBpXTtcbiAgICAgIH1cbiAgICAgIGNodW5rLm9mZnNldCArPSByZWFkTGVuZ3RoO1xuICAgICAgaWYgKGNodW5rLm9mZnNldCA9PT0gY2h1bmsuZGF0YS5ieXRlTGVuZ3RoKSB7XG4gICAgICAgIGNodW5rcy5zaGlmdCgpO1xuICAgICAgICAvLyBDb25zdW1lIFxcclxcbjtcbiAgICAgICAgaWYgKChhd2FpdCB0cC5yZWFkTGluZSgpKSA9PT0gbnVsbCkge1xuICAgICAgICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5VbmV4cGVjdGVkRW9mKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZWFkTGVuZ3RoO1xuICAgIH1cbiAgICBjb25zdCBsaW5lID0gYXdhaXQgdHAucmVhZExpbmUoKTtcbiAgICBpZiAobGluZSA9PT0gbnVsbCkgdGhyb3cgbmV3IERlbm8uZXJyb3JzLlVuZXhwZWN0ZWRFb2YoKTtcbiAgICAvLyBUT0RPOiBoYW5kbGUgY2h1bmsgZXh0ZW5zaW9uXG4gICAgY29uc3QgW2NodW5rU2l6ZVN0cmluZ10gPSBsaW5lLnNwbGl0KFwiO1wiKTtcbiAgICBjb25zdCBjaHVua1NpemUgPSBwYXJzZUludChjaHVua1NpemVTdHJpbmcsIDE2KTtcbiAgICBpZiAoTnVtYmVyLmlzTmFOKGNodW5rU2l6ZSkgfHwgY2h1bmtTaXplIDwgMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBjaHVuayBzaXplXCIpO1xuICAgIH1cbiAgICBpZiAoY2h1bmtTaXplID4gMCkge1xuICAgICAgaWYgKGNodW5rU2l6ZSA+IGJ1Zi5ieXRlTGVuZ3RoKSB7XG4gICAgICAgIGxldCBlb2YgPSBhd2FpdCByLnJlYWRGdWxsKGJ1Zik7XG4gICAgICAgIGlmIChlb2YgPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRGVuby5lcnJvcnMuVW5leHBlY3RlZEVvZigpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlc3RDaHVuayA9IG5ldyBVaW50OEFycmF5KGNodW5rU2l6ZSAtIGJ1Zi5ieXRlTGVuZ3RoKTtcbiAgICAgICAgZW9mID0gYXdhaXQgci5yZWFkRnVsbChyZXN0Q2h1bmspO1xuICAgICAgICBpZiAoZW9mID09PSBudWxsKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IERlbm8uZXJyb3JzLlVuZXhwZWN0ZWRFb2YoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjaHVua3MucHVzaCh7XG4gICAgICAgICAgICBvZmZzZXQ6IDAsXG4gICAgICAgICAgICBkYXRhOiByZXN0Q2h1bmssXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJ1Zi5ieXRlTGVuZ3RoO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgYnVmVG9GaWxsID0gYnVmLnN1YmFycmF5KDAsIGNodW5rU2l6ZSk7XG4gICAgICAgIGNvbnN0IGVvZiA9IGF3YWl0IHIucmVhZEZ1bGwoYnVmVG9GaWxsKTtcbiAgICAgICAgaWYgKGVvZiA9PT0gbnVsbCkge1xuICAgICAgICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5VbmV4cGVjdGVkRW9mKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ29uc3VtZSBcXHJcXG5cbiAgICAgICAgaWYgKChhd2FpdCB0cC5yZWFkTGluZSgpKSA9PT0gbnVsbCkge1xuICAgICAgICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5VbmV4cGVjdGVkRW9mKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNodW5rU2l6ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgYXNzZXJ0KGNodW5rU2l6ZSA9PT0gMCk7XG4gICAgICAvLyBDb25zdW1lIFxcclxcblxuICAgICAgaWYgKChhd2FpdCByLnJlYWRMaW5lKCkpID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5VbmV4cGVjdGVkRW9mKCk7XG4gICAgICB9XG4gICAgICBhd2FpdCByZWFkVHJhaWxlcnMoaCwgcik7XG4gICAgICBmaW5pc2hlZCA9IHRydWU7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHsgcmVhZCB9O1xufVxuXG5mdW5jdGlvbiBpc1Byb2hpYmlkZWRGb3JUcmFpbGVyKGtleTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IHMgPSBuZXcgU2V0KFtcInRyYW5zZmVyLWVuY29kaW5nXCIsIFwiY29udGVudC1sZW5ndGhcIiwgXCJ0cmFpbGVyXCJdKTtcbiAgcmV0dXJuIHMuaGFzKGtleS50b0xvd2VyQ2FzZSgpKTtcbn1cblxuLyoqIFJlYWQgdHJhaWxlciBoZWFkZXJzIGZyb20gcmVhZGVyIGFuZCBhcHBlbmQgdmFsdWVzIHRvIGhlYWRlcnMuIFwidHJhaWxlclwiXG4gKiBmaWVsZCB3aWxsIGJlIGRlbGV0ZWQuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZFRyYWlsZXJzKFxuICBoZWFkZXJzOiBIZWFkZXJzLFxuICByOiBCdWZSZWFkZXIsXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgdHJhaWxlcnMgPSBwYXJzZVRyYWlsZXIoaGVhZGVycy5nZXQoXCJ0cmFpbGVyXCIpKTtcbiAgaWYgKHRyYWlsZXJzID09IG51bGwpIHJldHVybjtcbiAgY29uc3QgdHJhaWxlck5hbWVzID0gWy4uLnRyYWlsZXJzLmtleXMoKV07XG4gIGNvbnN0IHRwID0gbmV3IFRleHRQcm90b1JlYWRlcihyKTtcbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdHAucmVhZE1JTUVIZWFkZXIoKTtcbiAgaWYgKHJlc3VsdCA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IERlbm8uZXJyb3JzLkludmFsaWREYXRhKFwiTWlzc2luZyB0cmFpbGVyIGhlYWRlci5cIik7XG4gIH1cbiAgY29uc3QgdW5kZWNsYXJlZCA9IFsuLi5yZXN1bHQua2V5cygpXS5maWx0ZXIoXG4gICAgKGspID0+ICF0cmFpbGVyTmFtZXMuaW5jbHVkZXMoayksXG4gICk7XG4gIGlmICh1bmRlY2xhcmVkLmxlbmd0aCA+IDApIHtcbiAgICB0aHJvdyBuZXcgRGVuby5lcnJvcnMuSW52YWxpZERhdGEoXG4gICAgICBgVW5kZWNsYXJlZCB0cmFpbGVyczogJHtEZW5vLmluc3BlY3QodW5kZWNsYXJlZCl9LmAsXG4gICAgKTtcbiAgfVxuICBmb3IgKGNvbnN0IFtrLCB2XSBvZiByZXN1bHQpIHtcbiAgICBoZWFkZXJzLmFwcGVuZChrLCB2KTtcbiAgfVxuICBjb25zdCBtaXNzaW5nVHJhaWxlcnMgPSB0cmFpbGVyTmFtZXMuZmlsdGVyKChrKSA9PiAhcmVzdWx0LmhhcyhrKSk7XG4gIGlmIChtaXNzaW5nVHJhaWxlcnMubGVuZ3RoID4gMCkge1xuICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5JbnZhbGlkRGF0YShcbiAgICAgIGBNaXNzaW5nIHRyYWlsZXJzOiAke0Rlbm8uaW5zcGVjdChtaXNzaW5nVHJhaWxlcnMpfS5gLFxuICAgICk7XG4gIH1cbiAgaGVhZGVycy5kZWxldGUoXCJ0cmFpbGVyXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVRyYWlsZXIoZmllbGQ6IHN0cmluZyB8IG51bGwpOiBIZWFkZXJzIHwgdW5kZWZpbmVkIHtcbiAgaWYgKGZpZWxkID09IG51bGwpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIGNvbnN0IHRyYWlsZXJOYW1lcyA9IGZpZWxkLnNwbGl0KFwiLFwiKS5tYXAoKHYpID0+IHYudHJpbSgpLnRvTG93ZXJDYXNlKCkpO1xuICBpZiAodHJhaWxlck5hbWVzLmxlbmd0aCA9PT0gMCkge1xuICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5JbnZhbGlkRGF0YShcIkVtcHR5IHRyYWlsZXIgaGVhZGVyLlwiKTtcbiAgfVxuICBjb25zdCBwcm9oaWJpdGVkID0gdHJhaWxlck5hbWVzLmZpbHRlcigoaykgPT4gaXNQcm9oaWJpZGVkRm9yVHJhaWxlcihrKSk7XG4gIGlmIChwcm9oaWJpdGVkLmxlbmd0aCA+IDApIHtcbiAgICB0aHJvdyBuZXcgRGVuby5lcnJvcnMuSW52YWxpZERhdGEoXG4gICAgICBgUHJvaGliaXRlZCB0cmFpbGVyIG5hbWVzOiAke0Rlbm8uaW5zcGVjdChwcm9oaWJpdGVkKX0uYCxcbiAgICApO1xuICB9XG4gIHJldHVybiBuZXcgSGVhZGVycyh0cmFpbGVyTmFtZXMubWFwKChrZXkpID0+IFtrZXksIFwiXCJdKSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3cml0ZUNodW5rZWRCb2R5KFxuICB3OiBEZW5vLldyaXRlcixcbiAgcjogRGVuby5SZWFkZXIsXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3Qgd3JpdGVyID0gQnVmV3JpdGVyLmNyZWF0ZSh3KTtcbiAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiBEZW5vLml0ZXIocikpIHtcbiAgICBpZiAoY2h1bmsuYnl0ZUxlbmd0aCA8PSAwKSBjb250aW51ZTtcbiAgICBjb25zdCBzdGFydCA9IGVuY29kZXIuZW5jb2RlKGAke2NodW5rLmJ5dGVMZW5ndGgudG9TdHJpbmcoMTYpfVxcclxcbmApO1xuICAgIGNvbnN0IGVuZCA9IGVuY29kZXIuZW5jb2RlKFwiXFxyXFxuXCIpO1xuICAgIGF3YWl0IHdyaXRlci53cml0ZShzdGFydCk7XG4gICAgYXdhaXQgd3JpdGVyLndyaXRlKGNodW5rKTtcbiAgICBhd2FpdCB3cml0ZXIud3JpdGUoZW5kKTtcbiAgfVxuXG4gIGNvbnN0IGVuZENodW5rID0gZW5jb2Rlci5lbmNvZGUoXCIwXFxyXFxuXFxyXFxuXCIpO1xuICBhd2FpdCB3cml0ZXIud3JpdGUoZW5kQ2h1bmspO1xufVxuXG4vKiogV3JpdGUgdHJhaWxlciBoZWFkZXJzIHRvIHdyaXRlci4gSXQgc2hvdWxkIG1vc3RseSBzaG91bGQgYmUgY2FsbGVkIGFmdGVyXG4gKiBgd3JpdGVSZXNwb25zZSgpYC4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3cml0ZVRyYWlsZXJzKFxuICB3OiBEZW5vLldyaXRlcixcbiAgaGVhZGVyczogSGVhZGVycyxcbiAgdHJhaWxlcnM6IEhlYWRlcnMsXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgdHJhaWxlciA9IGhlYWRlcnMuZ2V0KFwidHJhaWxlclwiKTtcbiAgaWYgKHRyYWlsZXIgPT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiTWlzc2luZyB0cmFpbGVyIGhlYWRlci5cIik7XG4gIH1cbiAgY29uc3QgdHJhbnNmZXJFbmNvZGluZyA9IGhlYWRlcnMuZ2V0KFwidHJhbnNmZXItZW5jb2RpbmdcIik7XG4gIGlmICh0cmFuc2ZlckVuY29kaW5nID09PSBudWxsIHx8ICF0cmFuc2ZlckVuY29kaW5nLm1hdGNoKC9eY2h1bmtlZC8pKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgIGBUcmFpbGVycyBhcmUgb25seSBhbGxvd2VkIGZvciBcInRyYW5zZmVyLWVuY29kaW5nOiBjaHVua2VkXCIsIGdvdCBcInRyYW5zZmVyLWVuY29kaW5nOiAke3RyYW5zZmVyRW5jb2Rpbmd9XCIuYCxcbiAgICApO1xuICB9XG4gIGNvbnN0IHdyaXRlciA9IEJ1ZldyaXRlci5jcmVhdGUodyk7XG4gIGNvbnN0IHRyYWlsZXJOYW1lcyA9IHRyYWlsZXIuc3BsaXQoXCIsXCIpLm1hcCgocykgPT4gcy50cmltKCkudG9Mb3dlckNhc2UoKSk7XG4gIGNvbnN0IHByb2hpYml0ZWRUcmFpbGVycyA9IHRyYWlsZXJOYW1lcy5maWx0ZXIoKGspID0+XG4gICAgaXNQcm9oaWJpZGVkRm9yVHJhaWxlcihrKVxuICApO1xuICBpZiAocHJvaGliaXRlZFRyYWlsZXJzLmxlbmd0aCA+IDApIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgYFByb2hpYml0ZWQgdHJhaWxlciBuYW1lczogJHtEZW5vLmluc3BlY3QocHJvaGliaXRlZFRyYWlsZXJzKX0uYCxcbiAgICApO1xuICB9XG4gIGNvbnN0IHVuZGVjbGFyZWQgPSBbLi4udHJhaWxlcnMua2V5cygpXS5maWx0ZXIoXG4gICAgKGspID0+ICF0cmFpbGVyTmFtZXMuaW5jbHVkZXMoayksXG4gICk7XG4gIGlmICh1bmRlY2xhcmVkLmxlbmd0aCA+IDApIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBVbmRlY2xhcmVkIHRyYWlsZXJzOiAke0Rlbm8uaW5zcGVjdCh1bmRlY2xhcmVkKX0uYCk7XG4gIH1cbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgdHJhaWxlcnMpIHtcbiAgICBhd2FpdCB3cml0ZXIud3JpdGUoZW5jb2Rlci5lbmNvZGUoYCR7a2V5fTogJHt2YWx1ZX1cXHJcXG5gKSk7XG4gIH1cbiAgYXdhaXQgd3JpdGVyLndyaXRlKGVuY29kZXIuZW5jb2RlKFwiXFxyXFxuXCIpKTtcbiAgYXdhaXQgd3JpdGVyLmZsdXNoKCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3cml0ZVJlc3BvbnNlKFxuICB3OiBEZW5vLldyaXRlcixcbiAgcjogUmVzcG9uc2UsXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgcHJvdG9NYWpvciA9IDE7XG4gIGNvbnN0IHByb3RvTWlub3IgPSAxO1xuICBjb25zdCBzdGF0dXNDb2RlID0gci5zdGF0dXMgfHwgMjAwO1xuICBjb25zdCBzdGF0dXNUZXh0ID0gU1RBVFVTX1RFWFQuZ2V0KHN0YXR1c0NvZGUpO1xuICBjb25zdCB3cml0ZXIgPSBCdWZXcml0ZXIuY3JlYXRlKHcpO1xuICBpZiAoIXN0YXR1c1RleHQpIHtcbiAgICB0aHJvdyBuZXcgRGVuby5lcnJvcnMuSW52YWxpZERhdGEoXCJCYWQgc3RhdHVzIGNvZGVcIik7XG4gIH1cbiAgaWYgKCFyLmJvZHkpIHtcbiAgICByLmJvZHkgPSBuZXcgVWludDhBcnJheSgpO1xuICB9XG4gIGlmICh0eXBlb2Ygci5ib2R5ID09PSBcInN0cmluZ1wiKSB7XG4gICAgci5ib2R5ID0gZW5jb2Rlci5lbmNvZGUoci5ib2R5KTtcbiAgfVxuXG4gIGxldCBvdXQgPSBgSFRUUC8ke3Byb3RvTWFqb3J9LiR7cHJvdG9NaW5vcn0gJHtzdGF0dXNDb2RlfSAke3N0YXR1c1RleHR9XFxyXFxuYDtcblxuICBjb25zdCBoZWFkZXJzID0gci5oZWFkZXJzID8/IG5ldyBIZWFkZXJzKCk7XG5cbiAgaWYgKHIuYm9keSAmJiAhaGVhZGVycy5nZXQoXCJjb250ZW50LWxlbmd0aFwiKSkge1xuICAgIGlmIChyLmJvZHkgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XG4gICAgICBvdXQgKz0gYGNvbnRlbnQtbGVuZ3RoOiAke3IuYm9keS5ieXRlTGVuZ3RofVxcclxcbmA7XG4gICAgfSBlbHNlIGlmICghaGVhZGVycy5nZXQoXCJ0cmFuc2Zlci1lbmNvZGluZ1wiKSkge1xuICAgICAgb3V0ICs9IFwidHJhbnNmZXItZW5jb2Rpbmc6IGNodW5rZWRcXHJcXG5cIjtcbiAgICB9XG4gIH1cblxuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBoZWFkZXJzKSB7XG4gICAgb3V0ICs9IGAke2tleX06ICR7dmFsdWV9XFxyXFxuYDtcbiAgfVxuXG4gIG91dCArPSBgXFxyXFxuYDtcblxuICBjb25zdCBoZWFkZXIgPSBlbmNvZGVyLmVuY29kZShvdXQpO1xuICBjb25zdCBuID0gYXdhaXQgd3JpdGVyLndyaXRlKGhlYWRlcik7XG4gIGFzc2VydChuID09PSBoZWFkZXIuYnl0ZUxlbmd0aCk7XG5cbiAgaWYgKHIuYm9keSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICBjb25zdCBuID0gYXdhaXQgd3JpdGVyLndyaXRlKHIuYm9keSk7XG4gICAgYXNzZXJ0KG4gPT09IHIuYm9keS5ieXRlTGVuZ3RoKTtcbiAgfSBlbHNlIGlmIChoZWFkZXJzLmhhcyhcImNvbnRlbnQtbGVuZ3RoXCIpKSB7XG4gICAgY29uc3QgY29udGVudExlbmd0aCA9IGhlYWRlcnMuZ2V0KFwiY29udGVudC1sZW5ndGhcIik7XG4gICAgYXNzZXJ0KGNvbnRlbnRMZW5ndGggIT0gbnVsbCk7XG4gICAgY29uc3QgYm9keUxlbmd0aCA9IHBhcnNlSW50KGNvbnRlbnRMZW5ndGgpO1xuICAgIGNvbnN0IG4gPSBhd2FpdCBEZW5vLmNvcHkoci5ib2R5LCB3cml0ZXIpO1xuICAgIGFzc2VydChuID09PSBib2R5TGVuZ3RoKTtcbiAgfSBlbHNlIHtcbiAgICBhd2FpdCB3cml0ZUNodW5rZWRCb2R5KHdyaXRlciwgci5ib2R5KTtcbiAgfVxuICBpZiAoci50cmFpbGVycykge1xuICAgIGNvbnN0IHQgPSBhd2FpdCByLnRyYWlsZXJzKCk7XG4gICAgYXdhaXQgd3JpdGVUcmFpbGVycyh3cml0ZXIsIGhlYWRlcnMsIHQpO1xuICB9XG4gIGF3YWl0IHdyaXRlci5mbHVzaCgpO1xufVxuXG4vKipcbiAqIFBhcnNlSFRUUFZlcnNpb24gcGFyc2VzIGEgSFRUUCB2ZXJzaW9uIHN0cmluZy5cbiAqIFwiSFRUUC8xLjBcIiByZXR1cm5zICgxLCAwKS5cbiAqIFBvcnRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9nb2xhbmcvZ28vYmxvYi9mNWM0M2I5L3NyYy9uZXQvaHR0cC9yZXF1ZXN0LmdvI0w3NjYtTDc5MlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VIVFRQVmVyc2lvbih2ZXJzOiBzdHJpbmcpOiBbbnVtYmVyLCBudW1iZXJdIHtcbiAgc3dpdGNoICh2ZXJzKSB7XG4gICAgY2FzZSBcIkhUVFAvMS4xXCI6XG4gICAgICByZXR1cm4gWzEsIDFdO1xuXG4gICAgY2FzZSBcIkhUVFAvMS4wXCI6XG4gICAgICByZXR1cm4gWzEsIDBdO1xuXG4gICAgZGVmYXVsdDoge1xuICAgICAgY29uc3QgQmlnID0gMTAwMDAwMDsgLy8gYXJiaXRyYXJ5IHVwcGVyIGJvdW5kXG5cbiAgICAgIGlmICghdmVycy5zdGFydHNXaXRoKFwiSFRUUC9cIikpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRvdCA9IHZlcnMuaW5kZXhPZihcIi5cIik7XG4gICAgICBpZiAoZG90IDwgMCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY29uc3QgbWFqb3JTdHIgPSB2ZXJzLnN1YnN0cmluZyh2ZXJzLmluZGV4T2YoXCIvXCIpICsgMSwgZG90KTtcbiAgICAgIGNvbnN0IG1ham9yID0gTnVtYmVyKG1ham9yU3RyKTtcbiAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihtYWpvcikgfHwgbWFqb3IgPCAwIHx8IG1ham9yID4gQmlnKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBtaW5vclN0ciA9IHZlcnMuc3Vic3RyaW5nKGRvdCArIDEpO1xuICAgICAgY29uc3QgbWlub3IgPSBOdW1iZXIobWlub3JTdHIpO1xuICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKG1pbm9yKSB8fCBtaW5vciA8IDAgfHwgbWlub3IgPiBCaWcpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBbbWFqb3IsIG1pbm9yXTtcbiAgICB9XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoYG1hbGZvcm1lZCBIVFRQIHZlcnNpb24gJHt2ZXJzfWApO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZFJlcXVlc3QoXG4gIGNvbm46IERlbm8uQ29ubixcbiAgYnVmcjogQnVmUmVhZGVyLFxuKTogUHJvbWlzZTxTZXJ2ZXJSZXF1ZXN0IHwgbnVsbD4ge1xuICBjb25zdCB0cCA9IG5ldyBUZXh0UHJvdG9SZWFkZXIoYnVmcik7XG4gIGNvbnN0IGZpcnN0TGluZSA9IGF3YWl0IHRwLnJlYWRMaW5lKCk7IC8vIGUuZy4gR0VUIC9pbmRleC5odG1sIEhUVFAvMS4wXG4gIGlmIChmaXJzdExpbmUgPT09IG51bGwpIHJldHVybiBudWxsO1xuICBjb25zdCBoZWFkZXJzID0gYXdhaXQgdHAucmVhZE1JTUVIZWFkZXIoKTtcbiAgaWYgKGhlYWRlcnMgPT09IG51bGwpIHRocm93IG5ldyBEZW5vLmVycm9ycy5VbmV4cGVjdGVkRW9mKCk7XG5cbiAgY29uc3QgcmVxID0gbmV3IFNlcnZlclJlcXVlc3QoKTtcbiAgcmVxLmNvbm4gPSBjb25uO1xuICByZXEuciA9IGJ1ZnI7XG4gIFtyZXEubWV0aG9kLCByZXEudXJsLCByZXEucHJvdG9dID0gZmlyc3RMaW5lLnNwbGl0KFwiIFwiLCAzKTtcbiAgW3JlcS5wcm90b01pbm9yLCByZXEucHJvdG9NYWpvcl0gPSBwYXJzZUhUVFBWZXJzaW9uKHJlcS5wcm90byk7XG4gIHJlcS5oZWFkZXJzID0gaGVhZGVycztcbiAgZml4TGVuZ3RoKHJlcSk7XG4gIHJldHVybiByZXE7XG59XG5cbmZ1bmN0aW9uIGZpeExlbmd0aChyZXE6IFNlcnZlclJlcXVlc3QpOiB2b2lkIHtcbiAgY29uc3QgY29udGVudExlbmd0aCA9IHJlcS5oZWFkZXJzLmdldChcIkNvbnRlbnQtTGVuZ3RoXCIpO1xuICBpZiAoY29udGVudExlbmd0aCkge1xuICAgIGNvbnN0IGFyckNsZW4gPSBjb250ZW50TGVuZ3RoLnNwbGl0KFwiLFwiKTtcbiAgICBpZiAoYXJyQ2xlbi5sZW5ndGggPiAxKSB7XG4gICAgICBjb25zdCBkaXN0aW5jdCA9IFsuLi5uZXcgU2V0KGFyckNsZW4ubWFwKChlKTogc3RyaW5nID0+IGUudHJpbSgpKSldO1xuICAgICAgaWYgKGRpc3RpbmN0Lmxlbmd0aCA+IDEpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoXCJjYW5ub3QgY29udGFpbiBtdWx0aXBsZSBDb250ZW50LUxlbmd0aCBoZWFkZXJzXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVxLmhlYWRlcnMuc2V0KFwiQ29udGVudC1MZW5ndGhcIiwgZGlzdGluY3RbMF0pO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBjID0gcmVxLmhlYWRlcnMuZ2V0KFwiQ29udGVudC1MZW5ndGhcIik7XG4gICAgaWYgKHJlcS5tZXRob2QgPT09IFwiSEVBRFwiICYmIGMgJiYgYyAhPT0gXCIwXCIpIHtcbiAgICAgIHRocm93IEVycm9yKFwiaHR0cDogbWV0aG9kIGNhbm5vdCBjb250YWluIGEgQ29udGVudC1MZW5ndGhcIik7XG4gICAgfVxuICAgIGlmIChjICYmIHJlcS5oZWFkZXJzLmhhcyhcInRyYW5zZmVyLWVuY29kaW5nXCIpKSB7XG4gICAgICAvLyBBIHNlbmRlciBNVVNUIE5PVCBzZW5kIGEgQ29udGVudC1MZW5ndGggaGVhZGVyIGZpZWxkIGluIGFueSBtZXNzYWdlXG4gICAgICAvLyB0aGF0IGNvbnRhaW5zIGEgVHJhbnNmZXItRW5jb2RpbmcgaGVhZGVyIGZpZWxkLlxuICAgICAgLy8gcmZjOiBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNzIzMCNzZWN0aW9uLTMuMy4yXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiaHR0cDogVHJhbnNmZXItRW5jb2RpbmcgYW5kIENvbnRlbnQtTGVuZ3RoIGNhbm5vdCBiZSBzZW5kIHRvZ2V0aGVyXCIsXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFvQixTQUFTLFNBQVEsY0FBZ0I7U0FDNUMsZUFBZSxTQUFRLG1CQUFxQjtTQUM1QyxNQUFNLFNBQVEsa0JBQW9CO1NBQ2xDLE9BQU8sU0FBUSxtQkFBcUI7U0FDcEMsYUFBYSxTQUFrQixXQUFhO1NBQzVDLFdBQVcsU0FBUSxnQkFBa0I7Z0JBRTlCLFdBQVc7O1FBRXZCLElBQUksRUFBQyxDQUFhO21CQUNULE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSTs7OztnQkFLakIsVUFBVSxDQUFDLGFBQXFCLEVBQUUsQ0FBWTtRQUN4RCxTQUFTLEdBQUcsQ0FBQztRQUNiLFFBQVEsR0FBRyxLQUFLO21CQUNMLElBQUksQ0FBQyxHQUFlO1lBQzdCLFFBQVEsU0FBUyxJQUFJO1lBQ3JCLE1BQU07Y0FDSixTQUFTLEdBQUcsYUFBYSxHQUFHLFNBQVM7WUFDdkMsU0FBUyxJQUFJLEdBQUcsQ0FBQyxVQUFVO1lBQzdCLE1BQU0sU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUc7O2tCQUVuQixPQUFPLEdBQUcsR0FB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
