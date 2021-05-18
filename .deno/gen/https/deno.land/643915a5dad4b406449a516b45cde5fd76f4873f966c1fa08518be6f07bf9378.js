// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { BufWriter } from "../io/bufio.ts";
import { TextProtoReader } from "../textproto/mod.ts";
import { assert } from "../_util/assert.ts";
import { ServerRequest } from "./server.ts";
import { STATUS_TEXT } from "./http_status.ts";
import { iter } from "../io/util.ts";
const encoder = new TextEncoder();
export function emptyReader() {
    return {
        read (_) {
            return Promise.resolve(null);
        }
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
        read
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
            for(let i = 0; i < readLength; i++){
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
        // TODO(bartlomieju): handle chunk extension
        const [chunkSizeString] = line.split(";");
        const chunkSize = parseInt(chunkSizeString, 16);
        if (Number.isNaN(chunkSize) || chunkSize < 0) {
            throw new Deno.errors.InvalidData("Invalid chunk size");
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
                        data: restChunk
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
        read
    };
}
function isProhibidedForTrailer(key) {
    const s = new Set([
        "transfer-encoding",
        "content-length",
        "trailer"
    ]);
    return s.has(key.toLowerCase());
}
/** Read trailer headers from reader and append values to headers. "trailer"
 * field will be deleted. */ export async function readTrailers(headers, r) {
    const trailers = parseTrailer(headers.get("trailer"));
    if (trailers == null) return;
    const trailerNames = [
        ...trailers.keys()
    ];
    const tp = new TextProtoReader(r);
    const result = await tp.readMIMEHeader();
    if (result == null) {
        throw new Deno.errors.InvalidData("Missing trailer header.");
    }
    const undeclared = [
        ...result.keys()
    ].filter((k)=>!trailerNames.includes(k)
    );
    if (undeclared.length > 0) {
        throw new Deno.errors.InvalidData(`Undeclared trailers: ${Deno.inspect(undeclared)}.`);
    }
    for (const [k, v] of result){
        headers.append(k, v);
    }
    const missingTrailers = trailerNames.filter((k)=>!result.has(k)
    );
    if (missingTrailers.length > 0) {
        throw new Deno.errors.InvalidData(`Missing trailers: ${Deno.inspect(missingTrailers)}.`);
    }
    headers.delete("trailer");
}
function parseTrailer(field) {
    if (field == null) {
        return undefined;
    }
    const trailerNames = field.split(",").map((v)=>v.trim().toLowerCase()
    );
    if (trailerNames.length === 0) {
        throw new Deno.errors.InvalidData("Empty trailer header.");
    }
    const prohibited = trailerNames.filter((k)=>isProhibidedForTrailer(k)
    );
    if (prohibited.length > 0) {
        throw new Deno.errors.InvalidData(`Prohibited trailer names: ${Deno.inspect(prohibited)}.`);
    }
    return new Headers(trailerNames.map((key)=>[
            key,
            ""
        ]
    ));
}
export async function writeChunkedBody(w, r) {
    for await (const chunk of iter(r)){
        if (chunk.byteLength <= 0) continue;
        const start = encoder.encode(`${chunk.byteLength.toString(16)}\r\n`);
        const end = encoder.encode("\r\n");
        await w.write(start);
        await w.write(chunk);
        await w.write(end);
        await w.flush();
    }
    const endChunk = encoder.encode("0\r\n\r\n");
    await w.write(endChunk);
}
/** Write trailer headers to writer. It should mostly should be called after
 * `writeResponse()`. */ export async function writeTrailers(w, headers, trailers) {
    const trailer = headers.get("trailer");
    if (trailer === null) {
        throw new TypeError("Missing trailer header.");
    }
    const transferEncoding = headers.get("transfer-encoding");
    if (transferEncoding === null || !transferEncoding.match(/^chunked/)) {
        throw new TypeError(`Trailers are only allowed for "transfer-encoding: chunked", got "transfer-encoding: ${transferEncoding}".`);
    }
    const writer = BufWriter.create(w);
    const trailerNames = trailer.split(",").map((s)=>s.trim().toLowerCase()
    );
    const prohibitedTrailers = trailerNames.filter((k)=>isProhibidedForTrailer(k)
    );
    if (prohibitedTrailers.length > 0) {
        throw new TypeError(`Prohibited trailer names: ${Deno.inspect(prohibitedTrailers)}.`);
    }
    const undeclared = [
        ...trailers.keys()
    ].filter((k)=>!trailerNames.includes(k)
    );
    if (undeclared.length > 0) {
        throw new TypeError(`Undeclared trailers: ${Deno.inspect(undeclared)}.`);
    }
    for (const [key, value] of trailers){
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
    for (const [key, value] of headers){
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
    switch(vers){
        case "HTTP/1.1":
            return [
                1,
                1
            ];
        case "HTTP/1.0":
            return [
                1,
                0
            ];
        default:
            {
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
                    minor
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
    [req.protoMajor, req.protoMinor] = parseHTTPVersion(req.proto);
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
                ...new Set(arrClen.map((e)=>e.trim()
                ))
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
            throw new Error("http: Transfer-Encoding and Content-Length cannot be send together");
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NS4wL2h0dHAvX2lvLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHsgQnVmUmVhZGVyLCBCdWZXcml0ZXIgfSBmcm9tIFwiLi4vaW8vYnVmaW8udHNcIjtcbmltcG9ydCB7IFRleHRQcm90b1JlYWRlciB9IGZyb20gXCIuLi90ZXh0cHJvdG8vbW9kLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vX3V0aWwvYXNzZXJ0LnRzXCI7XG5pbXBvcnQgeyBSZXNwb25zZSwgU2VydmVyUmVxdWVzdCB9IGZyb20gXCIuL3NlcnZlci50c1wiO1xuaW1wb3J0IHsgU1RBVFVTX1RFWFQgfSBmcm9tIFwiLi9odHRwX3N0YXR1cy50c1wiO1xuaW1wb3J0IHsgaXRlciB9IGZyb20gXCIuLi9pby91dGlsLnRzXCI7XG5cbmNvbnN0IGVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGVtcHR5UmVhZGVyKCk6IERlbm8uUmVhZGVyIHtcbiAgcmV0dXJuIHtcbiAgICByZWFkKF86IFVpbnQ4QXJyYXkpOiBQcm9taXNlPG51bWJlciB8IG51bGw+IHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgfSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJvZHlSZWFkZXIoY29udGVudExlbmd0aDogbnVtYmVyLCByOiBCdWZSZWFkZXIpOiBEZW5vLlJlYWRlciB7XG4gIGxldCB0b3RhbFJlYWQgPSAwO1xuICBsZXQgZmluaXNoZWQgPSBmYWxzZTtcbiAgYXN5bmMgZnVuY3Rpb24gcmVhZChidWY6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPG51bWJlciB8IG51bGw+IHtcbiAgICBpZiAoZmluaXNoZWQpIHJldHVybiBudWxsO1xuICAgIGxldCByZXN1bHQ6IG51bWJlciB8IG51bGw7XG4gICAgY29uc3QgcmVtYWluaW5nID0gY29udGVudExlbmd0aCAtIHRvdGFsUmVhZDtcbiAgICBpZiAocmVtYWluaW5nID49IGJ1Zi5ieXRlTGVuZ3RoKSB7XG4gICAgICByZXN1bHQgPSBhd2FpdCByLnJlYWQoYnVmKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVhZEJ1ZiA9IGJ1Zi5zdWJhcnJheSgwLCByZW1haW5pbmcpO1xuICAgICAgcmVzdWx0ID0gYXdhaXQgci5yZWFkKHJlYWRCdWYpO1xuICAgIH1cbiAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICB0b3RhbFJlYWQgKz0gcmVzdWx0O1xuICAgIH1cbiAgICBmaW5pc2hlZCA9IHRvdGFsUmVhZCA9PT0gY29udGVudExlbmd0aDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIHJldHVybiB7IHJlYWQgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNodW5rZWRCb2R5UmVhZGVyKGg6IEhlYWRlcnMsIHI6IEJ1ZlJlYWRlcik6IERlbm8uUmVhZGVyIHtcbiAgLy8gQmFzZWQgb24gaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzI2MTYjc2VjdGlvbi0xOS40LjZcbiAgY29uc3QgdHAgPSBuZXcgVGV4dFByb3RvUmVhZGVyKHIpO1xuICBsZXQgZmluaXNoZWQgPSBmYWxzZTtcbiAgY29uc3QgY2h1bmtzOiBBcnJheTx7XG4gICAgb2Zmc2V0OiBudW1iZXI7XG4gICAgZGF0YTogVWludDhBcnJheTtcbiAgfT4gPSBbXTtcbiAgYXN5bmMgZnVuY3Rpb24gcmVhZChidWY6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPG51bWJlciB8IG51bGw+IHtcbiAgICBpZiAoZmluaXNoZWQpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IFtjaHVua10gPSBjaHVua3M7XG4gICAgaWYgKGNodW5rKSB7XG4gICAgICBjb25zdCBjaHVua1JlbWFpbmluZyA9IGNodW5rLmRhdGEuYnl0ZUxlbmd0aCAtIGNodW5rLm9mZnNldDtcbiAgICAgIGNvbnN0IHJlYWRMZW5ndGggPSBNYXRoLm1pbihjaHVua1JlbWFpbmluZywgYnVmLmJ5dGVMZW5ndGgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWFkTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYnVmW2ldID0gY2h1bmsuZGF0YVtjaHVuay5vZmZzZXQgKyBpXTtcbiAgICAgIH1cbiAgICAgIGNodW5rLm9mZnNldCArPSByZWFkTGVuZ3RoO1xuICAgICAgaWYgKGNodW5rLm9mZnNldCA9PT0gY2h1bmsuZGF0YS5ieXRlTGVuZ3RoKSB7XG4gICAgICAgIGNodW5rcy5zaGlmdCgpO1xuICAgICAgICAvLyBDb25zdW1lIFxcclxcbjtcbiAgICAgICAgaWYgKChhd2FpdCB0cC5yZWFkTGluZSgpKSA9PT0gbnVsbCkge1xuICAgICAgICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5VbmV4cGVjdGVkRW9mKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZWFkTGVuZ3RoO1xuICAgIH1cbiAgICBjb25zdCBsaW5lID0gYXdhaXQgdHAucmVhZExpbmUoKTtcbiAgICBpZiAobGluZSA9PT0gbnVsbCkgdGhyb3cgbmV3IERlbm8uZXJyb3JzLlVuZXhwZWN0ZWRFb2YoKTtcbiAgICAvLyBUT0RPKGJhcnRsb21pZWp1KTogaGFuZGxlIGNodW5rIGV4dGVuc2lvblxuICAgIGNvbnN0IFtjaHVua1NpemVTdHJpbmddID0gbGluZS5zcGxpdChcIjtcIik7XG4gICAgY29uc3QgY2h1bmtTaXplID0gcGFyc2VJbnQoY2h1bmtTaXplU3RyaW5nLCAxNik7XG4gICAgaWYgKE51bWJlci5pc05hTihjaHVua1NpemUpIHx8IGNodW5rU2l6ZSA8IDApIHtcbiAgICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5JbnZhbGlkRGF0YShcIkludmFsaWQgY2h1bmsgc2l6ZVwiKTtcbiAgICB9XG4gICAgaWYgKGNodW5rU2l6ZSA+IDApIHtcbiAgICAgIGlmIChjaHVua1NpemUgPiBidWYuYnl0ZUxlbmd0aCkge1xuICAgICAgICBsZXQgZW9mID0gYXdhaXQgci5yZWFkRnVsbChidWYpO1xuICAgICAgICBpZiAoZW9mID09PSBudWxsKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IERlbm8uZXJyb3JzLlVuZXhwZWN0ZWRFb2YoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXN0Q2h1bmsgPSBuZXcgVWludDhBcnJheShjaHVua1NpemUgLSBidWYuYnl0ZUxlbmd0aCk7XG4gICAgICAgIGVvZiA9IGF3YWl0IHIucmVhZEZ1bGwocmVzdENodW5rKTtcbiAgICAgICAgaWYgKGVvZiA9PT0gbnVsbCkge1xuICAgICAgICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5VbmV4cGVjdGVkRW9mKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2h1bmtzLnB1c2goe1xuICAgICAgICAgICAgb2Zmc2V0OiAwLFxuICAgICAgICAgICAgZGF0YTogcmVzdENodW5rLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBidWYuYnl0ZUxlbmd0aDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGJ1ZlRvRmlsbCA9IGJ1Zi5zdWJhcnJheSgwLCBjaHVua1NpemUpO1xuICAgICAgICBjb25zdCBlb2YgPSBhd2FpdCByLnJlYWRGdWxsKGJ1ZlRvRmlsbCk7XG4gICAgICAgIGlmIChlb2YgPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRGVuby5lcnJvcnMuVW5leHBlY3RlZEVvZigpO1xuICAgICAgICB9XG4gICAgICAgIC8vIENvbnN1bWUgXFxyXFxuXG4gICAgICAgIGlmICgoYXdhaXQgdHAucmVhZExpbmUoKSkgPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRGVuby5lcnJvcnMuVW5leHBlY3RlZEVvZigpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjaHVua1NpemU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGFzc2VydChjaHVua1NpemUgPT09IDApO1xuICAgICAgLy8gQ29uc3VtZSBcXHJcXG5cbiAgICAgIGlmICgoYXdhaXQgci5yZWFkTGluZSgpKSA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRGVuby5lcnJvcnMuVW5leHBlY3RlZEVvZigpO1xuICAgICAgfVxuICAgICAgYXdhaXQgcmVhZFRyYWlsZXJzKGgsIHIpO1xuICAgICAgZmluaXNoZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIHJldHVybiB7IHJlYWQgfTtcbn1cblxuZnVuY3Rpb24gaXNQcm9oaWJpZGVkRm9yVHJhaWxlcihrZXk6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBzID0gbmV3IFNldChbXCJ0cmFuc2Zlci1lbmNvZGluZ1wiLCBcImNvbnRlbnQtbGVuZ3RoXCIsIFwidHJhaWxlclwiXSk7XG4gIHJldHVybiBzLmhhcyhrZXkudG9Mb3dlckNhc2UoKSk7XG59XG5cbi8qKiBSZWFkIHRyYWlsZXIgaGVhZGVycyBmcm9tIHJlYWRlciBhbmQgYXBwZW5kIHZhbHVlcyB0byBoZWFkZXJzLiBcInRyYWlsZXJcIlxuICogZmllbGQgd2lsbCBiZSBkZWxldGVkLiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRUcmFpbGVycyhcbiAgaGVhZGVyczogSGVhZGVycyxcbiAgcjogQnVmUmVhZGVyLFxuKSB7XG4gIGNvbnN0IHRyYWlsZXJzID0gcGFyc2VUcmFpbGVyKGhlYWRlcnMuZ2V0KFwidHJhaWxlclwiKSk7XG4gIGlmICh0cmFpbGVycyA9PSBudWxsKSByZXR1cm47XG4gIGNvbnN0IHRyYWlsZXJOYW1lcyA9IFsuLi50cmFpbGVycy5rZXlzKCldO1xuICBjb25zdCB0cCA9IG5ldyBUZXh0UHJvdG9SZWFkZXIocik7XG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRwLnJlYWRNSU1FSGVhZGVyKCk7XG4gIGlmIChyZXN1bHQgPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5JbnZhbGlkRGF0YShcIk1pc3NpbmcgdHJhaWxlciBoZWFkZXIuXCIpO1xuICB9XG4gIGNvbnN0IHVuZGVjbGFyZWQgPSBbLi4ucmVzdWx0LmtleXMoKV0uZmlsdGVyKFxuICAgIChrKSA9PiAhdHJhaWxlck5hbWVzLmluY2x1ZGVzKGspLFxuICApO1xuICBpZiAodW5kZWNsYXJlZC5sZW5ndGggPiAwKSB7XG4gICAgdGhyb3cgbmV3IERlbm8uZXJyb3JzLkludmFsaWREYXRhKFxuICAgICAgYFVuZGVjbGFyZWQgdHJhaWxlcnM6ICR7RGVuby5pbnNwZWN0KHVuZGVjbGFyZWQpfS5gLFxuICAgICk7XG4gIH1cbiAgZm9yIChjb25zdCBbaywgdl0gb2YgcmVzdWx0KSB7XG4gICAgaGVhZGVycy5hcHBlbmQoaywgdik7XG4gIH1cbiAgY29uc3QgbWlzc2luZ1RyYWlsZXJzID0gdHJhaWxlck5hbWVzLmZpbHRlcigoaykgPT4gIXJlc3VsdC5oYXMoaykpO1xuICBpZiAobWlzc2luZ1RyYWlsZXJzLmxlbmd0aCA+IDApIHtcbiAgICB0aHJvdyBuZXcgRGVuby5lcnJvcnMuSW52YWxpZERhdGEoXG4gICAgICBgTWlzc2luZyB0cmFpbGVyczogJHtEZW5vLmluc3BlY3QobWlzc2luZ1RyYWlsZXJzKX0uYCxcbiAgICApO1xuICB9XG4gIGhlYWRlcnMuZGVsZXRlKFwidHJhaWxlclwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VUcmFpbGVyKGZpZWxkOiBzdHJpbmcgfCBudWxsKTogSGVhZGVycyB8IHVuZGVmaW5lZCB7XG4gIGlmIChmaWVsZCA9PSBudWxsKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICBjb25zdCB0cmFpbGVyTmFtZXMgPSBmaWVsZC5zcGxpdChcIixcIikubWFwKCh2KSA9PiB2LnRyaW0oKS50b0xvd2VyQ2FzZSgpKTtcbiAgaWYgKHRyYWlsZXJOYW1lcy5sZW5ndGggPT09IDApIHtcbiAgICB0aHJvdyBuZXcgRGVuby5lcnJvcnMuSW52YWxpZERhdGEoXCJFbXB0eSB0cmFpbGVyIGhlYWRlci5cIik7XG4gIH1cbiAgY29uc3QgcHJvaGliaXRlZCA9IHRyYWlsZXJOYW1lcy5maWx0ZXIoKGspID0+IGlzUHJvaGliaWRlZEZvclRyYWlsZXIoaykpO1xuICBpZiAocHJvaGliaXRlZC5sZW5ndGggPiAwKSB7XG4gICAgdGhyb3cgbmV3IERlbm8uZXJyb3JzLkludmFsaWREYXRhKFxuICAgICAgYFByb2hpYml0ZWQgdHJhaWxlciBuYW1lczogJHtEZW5vLmluc3BlY3QocHJvaGliaXRlZCl9LmAsXG4gICAgKTtcbiAgfVxuICByZXR1cm4gbmV3IEhlYWRlcnModHJhaWxlck5hbWVzLm1hcCgoa2V5KSA9PiBba2V5LCBcIlwiXSkpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3JpdGVDaHVua2VkQm9keShcbiAgdzogQnVmV3JpdGVyLFxuICByOiBEZW5vLlJlYWRlcixcbikge1xuICBmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIGl0ZXIocikpIHtcbiAgICBpZiAoY2h1bmsuYnl0ZUxlbmd0aCA8PSAwKSBjb250aW51ZTtcbiAgICBjb25zdCBzdGFydCA9IGVuY29kZXIuZW5jb2RlKGAke2NodW5rLmJ5dGVMZW5ndGgudG9TdHJpbmcoMTYpfVxcclxcbmApO1xuICAgIGNvbnN0IGVuZCA9IGVuY29kZXIuZW5jb2RlKFwiXFxyXFxuXCIpO1xuICAgIGF3YWl0IHcud3JpdGUoc3RhcnQpO1xuICAgIGF3YWl0IHcud3JpdGUoY2h1bmspO1xuICAgIGF3YWl0IHcud3JpdGUoZW5kKTtcbiAgICBhd2FpdCB3LmZsdXNoKCk7XG4gIH1cblxuICBjb25zdCBlbmRDaHVuayA9IGVuY29kZXIuZW5jb2RlKFwiMFxcclxcblxcclxcblwiKTtcbiAgYXdhaXQgdy53cml0ZShlbmRDaHVuayk7XG59XG5cbi8qKiBXcml0ZSB0cmFpbGVyIGhlYWRlcnMgdG8gd3JpdGVyLiBJdCBzaG91bGQgbW9zdGx5IHNob3VsZCBiZSBjYWxsZWQgYWZ0ZXJcbiAqIGB3cml0ZVJlc3BvbnNlKClgLiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyaXRlVHJhaWxlcnMoXG4gIHc6IERlbm8uV3JpdGVyLFxuICBoZWFkZXJzOiBIZWFkZXJzLFxuICB0cmFpbGVyczogSGVhZGVycyxcbikge1xuICBjb25zdCB0cmFpbGVyID0gaGVhZGVycy5nZXQoXCJ0cmFpbGVyXCIpO1xuICBpZiAodHJhaWxlciA9PT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJNaXNzaW5nIHRyYWlsZXIgaGVhZGVyLlwiKTtcbiAgfVxuICBjb25zdCB0cmFuc2ZlckVuY29kaW5nID0gaGVhZGVycy5nZXQoXCJ0cmFuc2Zlci1lbmNvZGluZ1wiKTtcbiAgaWYgKHRyYW5zZmVyRW5jb2RpbmcgPT09IG51bGwgfHwgIXRyYW5zZmVyRW5jb2RpbmcubWF0Y2goL15jaHVua2VkLykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgYFRyYWlsZXJzIGFyZSBvbmx5IGFsbG93ZWQgZm9yIFwidHJhbnNmZXItZW5jb2Rpbmc6IGNodW5rZWRcIiwgZ290IFwidHJhbnNmZXItZW5jb2Rpbmc6ICR7dHJhbnNmZXJFbmNvZGluZ31cIi5gLFxuICAgICk7XG4gIH1cbiAgY29uc3Qgd3JpdGVyID0gQnVmV3JpdGVyLmNyZWF0ZSh3KTtcbiAgY29uc3QgdHJhaWxlck5hbWVzID0gdHJhaWxlci5zcGxpdChcIixcIikubWFwKChzKSA9PiBzLnRyaW0oKS50b0xvd2VyQ2FzZSgpKTtcbiAgY29uc3QgcHJvaGliaXRlZFRyYWlsZXJzID0gdHJhaWxlck5hbWVzLmZpbHRlcigoaykgPT5cbiAgICBpc1Byb2hpYmlkZWRGb3JUcmFpbGVyKGspXG4gICk7XG4gIGlmIChwcm9oaWJpdGVkVHJhaWxlcnMubGVuZ3RoID4gMCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICBgUHJvaGliaXRlZCB0cmFpbGVyIG5hbWVzOiAke0Rlbm8uaW5zcGVjdChwcm9oaWJpdGVkVHJhaWxlcnMpfS5gLFxuICAgICk7XG4gIH1cbiAgY29uc3QgdW5kZWNsYXJlZCA9IFsuLi50cmFpbGVycy5rZXlzKCldLmZpbHRlcihcbiAgICAoaykgPT4gIXRyYWlsZXJOYW1lcy5pbmNsdWRlcyhrKSxcbiAgKTtcbiAgaWYgKHVuZGVjbGFyZWQubGVuZ3RoID4gMCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFVuZGVjbGFyZWQgdHJhaWxlcnM6ICR7RGVuby5pbnNwZWN0KHVuZGVjbGFyZWQpfS5gKTtcbiAgfVxuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiB0cmFpbGVycykge1xuICAgIGF3YWl0IHdyaXRlci53cml0ZShlbmNvZGVyLmVuY29kZShgJHtrZXl9OiAke3ZhbHVlfVxcclxcbmApKTtcbiAgfVxuICBhd2FpdCB3cml0ZXIud3JpdGUoZW5jb2Rlci5lbmNvZGUoXCJcXHJcXG5cIikpO1xuICBhd2FpdCB3cml0ZXIuZmx1c2goKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyaXRlUmVzcG9uc2UoXG4gIHc6IERlbm8uV3JpdGVyLFxuICByOiBSZXNwb25zZSxcbikge1xuICBjb25zdCBwcm90b01ham9yID0gMTtcbiAgY29uc3QgcHJvdG9NaW5vciA9IDE7XG4gIGNvbnN0IHN0YXR1c0NvZGUgPSByLnN0YXR1cyB8fCAyMDA7XG4gIGNvbnN0IHN0YXR1c1RleHQgPSBTVEFUVVNfVEVYVC5nZXQoc3RhdHVzQ29kZSk7XG4gIGNvbnN0IHdyaXRlciA9IEJ1ZldyaXRlci5jcmVhdGUodyk7XG4gIGlmICghc3RhdHVzVGV4dCkge1xuICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5JbnZhbGlkRGF0YShcIkJhZCBzdGF0dXMgY29kZVwiKTtcbiAgfVxuICBpZiAoIXIuYm9keSkge1xuICAgIHIuYm9keSA9IG5ldyBVaW50OEFycmF5KCk7XG4gIH1cbiAgaWYgKHR5cGVvZiByLmJvZHkgPT09IFwic3RyaW5nXCIpIHtcbiAgICByLmJvZHkgPSBlbmNvZGVyLmVuY29kZShyLmJvZHkpO1xuICB9XG5cbiAgbGV0IG91dCA9IGBIVFRQLyR7cHJvdG9NYWpvcn0uJHtwcm90b01pbm9yfSAke3N0YXR1c0NvZGV9ICR7c3RhdHVzVGV4dH1cXHJcXG5gO1xuXG4gIGNvbnN0IGhlYWRlcnMgPSByLmhlYWRlcnMgPz8gbmV3IEhlYWRlcnMoKTtcblxuICBpZiAoci5ib2R5ICYmICFoZWFkZXJzLmdldChcImNvbnRlbnQtbGVuZ3RoXCIpKSB7XG4gICAgaWYgKHIuYm9keSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICAgIG91dCArPSBgY29udGVudC1sZW5ndGg6ICR7ci5ib2R5LmJ5dGVMZW5ndGh9XFxyXFxuYDtcbiAgICB9IGVsc2UgaWYgKCFoZWFkZXJzLmdldChcInRyYW5zZmVyLWVuY29kaW5nXCIpKSB7XG4gICAgICBvdXQgKz0gXCJ0cmFuc2Zlci1lbmNvZGluZzogY2h1bmtlZFxcclxcblwiO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIGhlYWRlcnMpIHtcbiAgICBvdXQgKz0gYCR7a2V5fTogJHt2YWx1ZX1cXHJcXG5gO1xuICB9XG5cbiAgb3V0ICs9IGBcXHJcXG5gO1xuXG4gIGNvbnN0IGhlYWRlciA9IGVuY29kZXIuZW5jb2RlKG91dCk7XG4gIGNvbnN0IG4gPSBhd2FpdCB3cml0ZXIud3JpdGUoaGVhZGVyKTtcbiAgYXNzZXJ0KG4gPT09IGhlYWRlci5ieXRlTGVuZ3RoKTtcblxuICBpZiAoci5ib2R5IGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgIGNvbnN0IG4gPSBhd2FpdCB3cml0ZXIud3JpdGUoci5ib2R5KTtcbiAgICBhc3NlcnQobiA9PT0gci5ib2R5LmJ5dGVMZW5ndGgpO1xuICB9IGVsc2UgaWYgKGhlYWRlcnMuaGFzKFwiY29udGVudC1sZW5ndGhcIikpIHtcbiAgICBjb25zdCBjb250ZW50TGVuZ3RoID0gaGVhZGVycy5nZXQoXCJjb250ZW50LWxlbmd0aFwiKTtcbiAgICBhc3NlcnQoY29udGVudExlbmd0aCAhPSBudWxsKTtcbiAgICBjb25zdCBib2R5TGVuZ3RoID0gcGFyc2VJbnQoY29udGVudExlbmd0aCk7XG4gICAgY29uc3QgbiA9IGF3YWl0IERlbm8uY29weShyLmJvZHksIHdyaXRlcik7XG4gICAgYXNzZXJ0KG4gPT09IGJvZHlMZW5ndGgpO1xuICB9IGVsc2Uge1xuICAgIGF3YWl0IHdyaXRlQ2h1bmtlZEJvZHkod3JpdGVyLCByLmJvZHkpO1xuICB9XG4gIGlmIChyLnRyYWlsZXJzKSB7XG4gICAgY29uc3QgdCA9IGF3YWl0IHIudHJhaWxlcnMoKTtcbiAgICBhd2FpdCB3cml0ZVRyYWlsZXJzKHdyaXRlciwgaGVhZGVycywgdCk7XG4gIH1cbiAgYXdhaXQgd3JpdGVyLmZsdXNoKCk7XG59XG5cbi8qKlxuICogUGFyc2VIVFRQVmVyc2lvbiBwYXJzZXMgYSBIVFRQIHZlcnNpb24gc3RyaW5nLlxuICogXCJIVFRQLzEuMFwiIHJldHVybnMgKDEsIDApLlxuICogUG9ydGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2dvbGFuZy9nby9ibG9iL2Y1YzQzYjkvc3JjL25ldC9odHRwL3JlcXVlc3QuZ28jTDc2Ni1MNzkyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUhUVFBWZXJzaW9uKHZlcnM6IHN0cmluZyk6IFtudW1iZXIsIG51bWJlcl0ge1xuICBzd2l0Y2ggKHZlcnMpIHtcbiAgICBjYXNlIFwiSFRUUC8xLjFcIjpcbiAgICAgIHJldHVybiBbMSwgMV07XG5cbiAgICBjYXNlIFwiSFRUUC8xLjBcIjpcbiAgICAgIHJldHVybiBbMSwgMF07XG5cbiAgICBkZWZhdWx0OiB7XG4gICAgICBjb25zdCBCaWcgPSAxMDAwMDAwOyAvLyBhcmJpdHJhcnkgdXBwZXIgYm91bmRcblxuICAgICAgaWYgKCF2ZXJzLnN0YXJ0c1dpdGgoXCJIVFRQL1wiKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY29uc3QgZG90ID0gdmVycy5pbmRleE9mKFwiLlwiKTtcbiAgICAgIGlmIChkb3QgPCAwKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBtYWpvclN0ciA9IHZlcnMuc3Vic3RyaW5nKHZlcnMuaW5kZXhPZihcIi9cIikgKyAxLCBkb3QpO1xuICAgICAgY29uc3QgbWFqb3IgPSBOdW1iZXIobWFqb3JTdHIpO1xuICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKG1ham9yKSB8fCBtYWpvciA8IDAgfHwgbWFqb3IgPiBCaWcpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1pbm9yU3RyID0gdmVycy5zdWJzdHJpbmcoZG90ICsgMSk7XG4gICAgICBjb25zdCBtaW5vciA9IE51bWJlcihtaW5vclN0cik7XG4gICAgICBpZiAoIU51bWJlci5pc0ludGVnZXIobWlub3IpIHx8IG1pbm9yIDwgMCB8fCBtaW5vciA+IEJpZykge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFttYWpvciwgbWlub3JdO1xuICAgIH1cbiAgfVxuXG4gIHRocm93IG5ldyBFcnJvcihgbWFsZm9ybWVkIEhUVFAgdmVyc2lvbiAke3ZlcnN9YCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkUmVxdWVzdChcbiAgY29ubjogRGVuby5Db25uLFxuICBidWZyOiBCdWZSZWFkZXIsXG4pOiBQcm9taXNlPFNlcnZlclJlcXVlc3QgfCBudWxsPiB7XG4gIGNvbnN0IHRwID0gbmV3IFRleHRQcm90b1JlYWRlcihidWZyKTtcbiAgY29uc3QgZmlyc3RMaW5lID0gYXdhaXQgdHAucmVhZExpbmUoKTsgLy8gZS5nLiBHRVQgL2luZGV4Lmh0bWwgSFRUUC8xLjBcbiAgaWYgKGZpcnN0TGluZSA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGhlYWRlcnMgPSBhd2FpdCB0cC5yZWFkTUlNRUhlYWRlcigpO1xuICBpZiAoaGVhZGVycyA9PT0gbnVsbCkgdGhyb3cgbmV3IERlbm8uZXJyb3JzLlVuZXhwZWN0ZWRFb2YoKTtcblxuICBjb25zdCByZXEgPSBuZXcgU2VydmVyUmVxdWVzdCgpO1xuICByZXEuY29ubiA9IGNvbm47XG4gIHJlcS5yID0gYnVmcjtcbiAgW3JlcS5tZXRob2QsIHJlcS51cmwsIHJlcS5wcm90b10gPSBmaXJzdExpbmUuc3BsaXQoXCIgXCIsIDMpO1xuICBbcmVxLnByb3RvTWFqb3IsIHJlcS5wcm90b01pbm9yXSA9IHBhcnNlSFRUUFZlcnNpb24ocmVxLnByb3RvKTtcbiAgcmVxLmhlYWRlcnMgPSBoZWFkZXJzO1xuICBmaXhMZW5ndGgocmVxKTtcbiAgcmV0dXJuIHJlcTtcbn1cblxuZnVuY3Rpb24gZml4TGVuZ3RoKHJlcTogU2VydmVyUmVxdWVzdCk6IHZvaWQge1xuICBjb25zdCBjb250ZW50TGVuZ3RoID0gcmVxLmhlYWRlcnMuZ2V0KFwiQ29udGVudC1MZW5ndGhcIik7XG4gIGlmIChjb250ZW50TGVuZ3RoKSB7XG4gICAgY29uc3QgYXJyQ2xlbiA9IGNvbnRlbnRMZW5ndGguc3BsaXQoXCIsXCIpO1xuICAgIGlmIChhcnJDbGVuLmxlbmd0aCA+IDEpIHtcbiAgICAgIGNvbnN0IGRpc3RpbmN0ID0gWy4uLm5ldyBTZXQoYXJyQ2xlbi5tYXAoKGUpOiBzdHJpbmcgPT4gZS50cmltKCkpKV07XG4gICAgICBpZiAoZGlzdGluY3QubGVuZ3RoID4gMSkge1xuICAgICAgICB0aHJvdyBFcnJvcihcImNhbm5vdCBjb250YWluIG11bHRpcGxlIENvbnRlbnQtTGVuZ3RoIGhlYWRlcnNcIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXEuaGVhZGVycy5zZXQoXCJDb250ZW50LUxlbmd0aFwiLCBkaXN0aW5jdFswXSk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGMgPSByZXEuaGVhZGVycy5nZXQoXCJDb250ZW50LUxlbmd0aFwiKTtcbiAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJIRUFEXCIgJiYgYyAmJiBjICE9PSBcIjBcIikge1xuICAgICAgdGhyb3cgRXJyb3IoXCJodHRwOiBtZXRob2QgY2Fubm90IGNvbnRhaW4gYSBDb250ZW50LUxlbmd0aFwiKTtcbiAgICB9XG4gICAgaWYgKGMgJiYgcmVxLmhlYWRlcnMuaGFzKFwidHJhbnNmZXItZW5jb2RpbmdcIikpIHtcbiAgICAgIC8vIEEgc2VuZGVyIE1VU1QgTk9UIHNlbmQgYSBDb250ZW50LUxlbmd0aCBoZWFkZXIgZmllbGQgaW4gYW55IG1lc3NhZ2VcbiAgICAgIC8vIHRoYXQgY29udGFpbnMgYSBUcmFuc2Zlci1FbmNvZGluZyBoZWFkZXIgZmllbGQuXG4gICAgICAvLyByZmM6IGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM3MjMwI3NlY3Rpb24tMy4zLjJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJodHRwOiBUcmFuc2Zlci1FbmNvZGluZyBhbmQgQ29udGVudC1MZW5ndGggY2Fubm90IGJlIHNlbmQgdG9nZXRoZXJcIixcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFBMEUsQUFBMUUsd0VBQTBFO1NBQ3RELFNBQVMsU0FBUSxjQUFnQjtTQUM1QyxlQUFlLFNBQVEsbUJBQXFCO1NBQzVDLE1BQU0sU0FBUSxrQkFBb0I7U0FDeEIsYUFBYSxTQUFRLFdBQWE7U0FDNUMsV0FBVyxTQUFRLGdCQUFrQjtTQUNyQyxJQUFJLFNBQVEsYUFBZTtNQUU5QixPQUFPLE9BQU8sV0FBVztnQkFFZixXQUFXOztRQUV2QixJQUFJLEVBQUMsQ0FBYTttQkFDVCxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUk7Ozs7Z0JBS2pCLFVBQVUsQ0FBQyxhQUFxQixFQUFFLENBQVk7UUFDeEQsU0FBUyxHQUFHLENBQUM7UUFDYixRQUFRLEdBQUcsS0FBSzttQkFDTCxJQUFJLENBQUMsR0FBZTtZQUM3QixRQUFRLFNBQVMsSUFBSTtZQUNyQixNQUFNO2NBQ0osU0FBUyxHQUFHLGFBQWEsR0FBRyxTQUFTO1lBQ3ZDLFNBQVMsSUFBSSxHQUFH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