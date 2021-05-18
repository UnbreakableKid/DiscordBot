// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
import { decode, encode } from "../encoding/utf8.ts";
import { hasOwnProperty } from "../_util/has_own_property.ts";
import { BufReader, BufWriter } from "../io/bufio.ts";
import { readLong, readShort, sliceLongToBytes } from "../io/ioutil.ts";
import { Sha1 } from "../hash/sha1.ts";
import { writeResponse } from "../http/_io.ts";
import { TextProtoReader } from "../textproto/mod.ts";
import { deferred } from "../async/deferred.ts";
import { assert } from "../_util/assert.ts";
import { concat } from "../bytes/mod.ts";
export var OpCode;
(function (OpCode) {
  OpCode[OpCode["Continue"] = 0] = "Continue";
  OpCode[OpCode["TextFrame"] = 1] = "TextFrame";
  OpCode[OpCode["BinaryFrame"] = 2] = "BinaryFrame";
  OpCode[OpCode["Close"] = 8] = "Close";
  OpCode[OpCode["Ping"] = 9] = "Ping";
  OpCode[OpCode["Pong"] = 10] = "Pong";
})(OpCode || (OpCode = {}));
export function isWebSocketCloseEvent(a) {
  return hasOwnProperty(a, "code");
}
export function isWebSocketPingEvent(a) {
  return Array.isArray(a) && a[0] === "ping" && a[1] instanceof Uint8Array;
}
export function isWebSocketPongEvent(a) {
  return Array.isArray(a) && a[0] === "pong" && a[1] instanceof Uint8Array;
}
/** Unmask masked websocket payload */ export function unmask(payload, mask) {
  if (mask) {
    for (let i = 0, len = payload.length; i < len; i++) {
      payload[i] ^= mask[i & 3];
    }
  }
}
/** Write websocket frame to given writer */ export async function writeFrame(
  frame,
  writer,
) {
  const payloadLength = frame.payload.byteLength;
  let header;
  const hasMask = frame.mask ? 128 : 0;
  if (frame.mask && frame.mask.byteLength !== 4) {
    throw new Error(
      "invalid mask. mask must be 4 bytes: length=" + frame.mask.byteLength,
    );
  }
  if (payloadLength < 126) {
    header = new Uint8Array([
      128 | frame.opcode,
      hasMask | payloadLength,
    ]);
  } else if (payloadLength < 65535) {
    header = new Uint8Array([
      128 | frame.opcode,
      hasMask | 126,
      payloadLength >>> 8,
      payloadLength & 255,
    ]);
  } else {
    header = new Uint8Array([
      128 | frame.opcode,
      hasMask | 127,
      ...sliceLongToBytes(payloadLength),
    ]);
  }
  if (frame.mask) {
    header = concat(header, frame.mask);
  }
  unmask(frame.payload, frame.mask);
  header = concat(header, frame.payload);
  const w = BufWriter.create(writer);
  await w.write(header);
  await w.flush();
}
/** Read websocket frame from given BufReader
 * @throws `Deno.errors.UnexpectedEof` When peer closed connection without close frame
 * @throws `Error` Frame is invalid
 */ export async function readFrame(buf) {
  let b = await buf.readByte();
  assert(b !== null);
  let isLastFrame = false;
  switch (b >>> 4) {
    case 8:
      isLastFrame = true;
      break;
    case 0:
      isLastFrame = false;
      break;
    default:
      throw new Error("invalid signature");
  }
  const opcode = b & 15;
  // has_mask & payload
  b = await buf.readByte();
  assert(b !== null);
  const hasMask = b >>> 7;
  let payloadLength = b & 127;
  if (payloadLength === 126) {
    const l = await readShort(buf);
    assert(l !== null);
    payloadLength = l;
  } else if (payloadLength === 127) {
    const l = await readLong(buf);
    assert(l !== null);
    payloadLength = Number(l);
  }
  // mask
  let mask;
  if (hasMask) {
    mask = new Uint8Array(4);
    assert(await buf.readFull(mask) !== null);
  }
  // payload
  const payload = new Uint8Array(payloadLength);
  assert(await buf.readFull(payload) !== null);
  return {
    isLastFrame,
    opcode,
    mask,
    payload,
  };
}
// Create client-to-server mask, random 32bit number
function createMask() {
  return crypto.getRandomValues(new Uint8Array(4));
}
class WebSocketImpl {
  conn;
  mask;
  bufReader;
  bufWriter;
  sendQueue = [];
  constructor({ conn, bufReader, bufWriter, mask }) {
    this.conn = conn;
    this.mask = mask;
    this.bufReader = bufReader || new BufReader(conn);
    this.bufWriter = bufWriter || new BufWriter(conn);
  }
  async *[Symbol.asyncIterator]() {
    let frames = [];
    let payloadsLength = 0;
    while (!this._isClosed) {
      let frame;
      try {
        frame = await readFrame(this.bufReader);
      } catch (e) {
        this.ensureSocketClosed();
        break;
      }
      unmask(frame.payload, frame.mask);
      switch (frame.opcode) {
        case OpCode.TextFrame:
        case OpCode.BinaryFrame:
        case OpCode.Continue:
          frames.push(frame);
          payloadsLength += frame.payload.length;
          if (frame.isLastFrame) {
            const concat = new Uint8Array(payloadsLength);
            let offs = 0;
            for (const frame of frames) {
              concat.set(frame.payload, offs);
              offs += frame.payload.length;
            }
            if (frames[0].opcode === OpCode.TextFrame) {
              // text
              yield decode(concat);
            } else {
              // binary
              yield concat;
            }
            frames = [];
            payloadsLength = 0;
          }
          break;
        case OpCode.Close: {
          // [0x12, 0x34] -> 0x1234
          const code = frame.payload[0] << 8 | frame.payload[1];
          const reason = decode(
            frame.payload.subarray(2, frame.payload.length),
          );
          await this.close(code, reason);
          yield {
            code,
            reason,
          };
          return;
        }
        case OpCode.Ping:
          await this.enqueue({
            opcode: OpCode.Pong,
            payload: frame.payload,
            isLastFrame: true,
          });
          yield [
            "ping",
            frame.payload,
          ];
          break;
        case OpCode.Pong:
          yield [
            "pong",
            frame.payload,
          ];
          break;
        default:
      }
    }
  }
  dequeue() {
    const [entry] = this.sendQueue;
    if (!entry) return;
    if (this._isClosed) return;
    const { d, frame } = entry;
    writeFrame(frame, this.bufWriter).then(() => d.resolve()).catch((e) =>
      d.reject(e)
    ).finally(() => {
      this.sendQueue.shift();
      this.dequeue();
    });
  }
  enqueue(frame) {
    if (this._isClosed) {
      throw new Deno.errors.ConnectionReset("Socket has already been closed");
    }
    const d = deferred();
    this.sendQueue.push({
      d,
      frame,
    });
    if (this.sendQueue.length === 1) {
      this.dequeue();
    }
    return d;
  }
  send(data) {
    const opcode = typeof data === "string"
      ? OpCode.TextFrame
      : OpCode.BinaryFrame;
    const payload = typeof data === "string" ? encode(data) : data;
    const isLastFrame = true;
    const frame = {
      isLastFrame,
      opcode,
      payload,
      mask: this.mask,
    };
    return this.enqueue(frame);
  }
  ping(data = "") {
    const payload = typeof data === "string" ? encode(data) : data;
    const frame = {
      isLastFrame: true,
      opcode: OpCode.Ping,
      mask: this.mask,
      payload,
    };
    return this.enqueue(frame);
  }
  _isClosed = false;
  get isClosed() {
    return this._isClosed;
  }
  async close(code = 1000, reason) {
    try {
      const header = [
        code >>> 8,
        code & 255,
      ];
      let payload;
      if (reason) {
        const reasonBytes = encode(reason);
        payload = new Uint8Array(2 + reasonBytes.byteLength);
        payload.set(header);
        payload.set(reasonBytes, 2);
      } else {
        payload = new Uint8Array(header);
      }
      await this.enqueue({
        isLastFrame: true,
        opcode: OpCode.Close,
        mask: this.mask,
        payload,
      });
    } catch (e) {
      throw e;
    } finally {
      this.ensureSocketClosed();
    }
  }
  closeForce() {
    this.ensureSocketClosed();
  }
  ensureSocketClosed() {
    if (this.isClosed) return;
    try {
      this.conn.close();
    } catch (e) {
      console.error(e);
    } finally {
      this._isClosed = true;
      const rest = this.sendQueue;
      this.sendQueue = [];
      rest.forEach((e) =>
        e.d.reject(
          new Deno.errors.ConnectionReset("Socket has already been closed"),
        )
      );
    }
  }
}
/** Return whether given headers is acceptable for websocket  */ export function acceptable(
  req,
) {
  const upgrade = req.headers.get("upgrade");
  if (!upgrade || upgrade.toLowerCase() !== "websocket") {
    return false;
  }
  const secKey = req.headers.get("sec-websocket-key");
  return req.headers.has("sec-websocket-key") && typeof secKey === "string" &&
    secKey.length > 0;
}
const kGUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
/** Create sec-websocket-accept header value with given nonce */ export function createSecAccept(
  nonce,
) {
  const sha1 = new Sha1();
  sha1.update(nonce + kGUID);
  const bytes = sha1.digest();
  return btoa(String.fromCharCode(...bytes));
}
/** Upgrade given TCP connection into websocket connection */ export async function acceptWebSocket(
  req,
) {
  const { conn, headers, bufReader, bufWriter } = req;
  if (acceptable(req)) {
    const sock = new WebSocketImpl({
      conn,
      bufReader,
      bufWriter,
    });
    const secKey = headers.get("sec-websocket-key");
    if (typeof secKey !== "string") {
      throw new Error("sec-websocket-key is not provided");
    }
    const secAccept = createSecAccept(secKey);
    await writeResponse(bufWriter, {
      status: 101,
      headers: new Headers({
        Upgrade: "websocket",
        Connection: "Upgrade",
        "Sec-WebSocket-Accept": secAccept,
      }),
    });
    return sock;
  }
  throw new Error("request is not acceptable");
}
const kSecChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-.~_";
/** Create WebSocket-Sec-Key. Base64 encoded 16 bytes string */ export function createSecKey() {
  let key = "";
  for (let i = 0; i < 16; i++) {
    const j = Math.floor(Math.random() * kSecChars.length);
    key += kSecChars[j];
  }
  return btoa(key);
}
export async function handshake(url, headers, bufReader, bufWriter) {
  const { hostname, pathname, search } = url;
  const key = createSecKey();
  if (!headers.has("host")) {
    headers.set("host", hostname);
  }
  headers.set("upgrade", "websocket");
  headers.set("connection", "upgrade");
  headers.set("sec-websocket-key", key);
  headers.set("sec-websocket-version", "13");
  let headerStr = `GET ${pathname}${search} HTTP/1.1\r\n`;
  for (const [key, value] of headers) {
    headerStr += `${key}: ${value}\r\n`;
  }
  headerStr += "\r\n";
  await bufWriter.write(encode(headerStr));
  await bufWriter.flush();
  const tpReader = new TextProtoReader(bufReader);
  const statusLine = await tpReader.readLine();
  if (statusLine === null) {
    throw new Deno.errors.UnexpectedEof();
  }
  const m = statusLine.match(/^(?<version>\S+) (?<statusCode>\S+) /);
  if (!m) {
    throw new Error("ws: invalid status line: " + statusLine);
  }
  assert(m.groups);
  const { version, statusCode } = m.groups;
  if (version !== "HTTP/1.1" || statusCode !== "101") {
    throw new Error(
      `ws: server didn't accept handshake: ` +
        `version=${version}, statusCode=${statusCode}`,
    );
  }
  const responseHeaders = await tpReader.readMIMEHeader();
  if (responseHeaders === null) {
    throw new Deno.errors.UnexpectedEof();
  }
  const expectedSecAccept = createSecAccept(key);
  const secAccept = responseHeaders.get("sec-websocket-accept");
  if (secAccept !== expectedSecAccept) {
    throw new Error(
      `ws: unexpected sec-websocket-accept header: ` +
        `expected=${expectedSecAccept}, actual=${secAccept}`,
    );
  }
}
/**
 * Connect to given websocket endpoint url.
 * Endpoint must be acceptable for URL.
 */ export async function connectWebSocket(endpoint, headers = new Headers()) {
  const url = new URL(endpoint);
  const { hostname } = url;
  let conn;
  if (url.protocol === "http:" || url.protocol === "ws:") {
    const port = parseInt(url.port || "80");
    conn = await Deno.connect({
      hostname,
      port,
    });
  } else if (url.protocol === "https:" || url.protocol === "wss:") {
    const port = parseInt(url.port || "443");
    conn = await Deno.connectTls({
      hostname,
      port,
    });
  } else {
    throw new Error("ws: unsupported protocol: " + url.protocol);
  }
  const bufWriter = new BufWriter(conn);
  const bufReader = new BufReader(conn);
  try {
    await handshake(url, headers, bufReader, bufWriter);
  } catch (err) {
    conn.close();
    throw err;
  }
  return new WebSocketImpl({
    conn,
    bufWriter,
    bufReader,
    mask: createMask(),
  });
}
export function createWebSocket(params) {
  return new WebSocketImpl(params);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC42Ni4wL3dzL21vZC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmltcG9ydCB7IGRlY29kZSwgZW5jb2RlIH0gZnJvbSBcIi4uL2VuY29kaW5nL3V0ZjgudHNcIjtcbmltcG9ydCB7IGhhc093blByb3BlcnR5IH0gZnJvbSBcIi4uL191dGlsL2hhc19vd25fcHJvcGVydHkudHNcIjtcbmltcG9ydCB7IEJ1ZlJlYWRlciwgQnVmV3JpdGVyIH0gZnJvbSBcIi4uL2lvL2J1ZmlvLnRzXCI7XG5pbXBvcnQgeyByZWFkTG9uZywgcmVhZFNob3J0LCBzbGljZUxvbmdUb0J5dGVzIH0gZnJvbSBcIi4uL2lvL2lvdXRpbC50c1wiO1xuaW1wb3J0IHsgU2hhMSB9IGZyb20gXCIuLi9oYXNoL3NoYTEudHNcIjtcbmltcG9ydCB7IHdyaXRlUmVzcG9uc2UgfSBmcm9tIFwiLi4vaHR0cC9faW8udHNcIjtcbmltcG9ydCB7IFRleHRQcm90b1JlYWRlciB9IGZyb20gXCIuLi90ZXh0cHJvdG8vbW9kLnRzXCI7XG5pbXBvcnQgeyBEZWZlcnJlZCwgZGVmZXJyZWQgfSBmcm9tIFwiLi4vYXN5bmMvZGVmZXJyZWQudHNcIjtcbmltcG9ydCB7IGFzc2VydCB9IGZyb20gXCIuLi9fdXRpbC9hc3NlcnQudHNcIjtcbmltcG9ydCB7IGNvbmNhdCB9IGZyb20gXCIuLi9ieXRlcy9tb2QudHNcIjtcblxuZXhwb3J0IGVudW0gT3BDb2RlIHtcbiAgQ29udGludWUgPSAweDAsXG4gIFRleHRGcmFtZSA9IDB4MSxcbiAgQmluYXJ5RnJhbWUgPSAweDIsXG4gIENsb3NlID0gMHg4LFxuICBQaW5nID0gMHg5LFxuICBQb25nID0gMHhhLFxufVxuXG5leHBvcnQgdHlwZSBXZWJTb2NrZXRFdmVudCA9XG4gIHwgc3RyaW5nXG4gIHwgVWludDhBcnJheVxuICB8IFdlYlNvY2tldENsb3NlRXZlbnQgLy8gUmVjZWl2ZWQgYWZ0ZXIgY2xvc2luZyBjb25uZWN0aW9uIGZpbmlzaGVkLlxuICB8IFdlYlNvY2tldFBpbmdFdmVudCAvLyBSZWNlaXZlZCBhZnRlciBwb25nIGZyYW1lIHJlc3BvbmRlZC5cbiAgfCBXZWJTb2NrZXRQb25nRXZlbnQ7XG5cbmV4cG9ydCBpbnRlcmZhY2UgV2ViU29ja2V0Q2xvc2VFdmVudCB7XG4gIGNvZGU6IG51bWJlcjtcbiAgcmVhc29uPzogc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNXZWJTb2NrZXRDbG9zZUV2ZW50KFxuICBhOiBXZWJTb2NrZXRFdmVudCxcbik6IGEgaXMgV2ViU29ja2V0Q2xvc2VFdmVudCB7XG4gIHJldHVybiBoYXNPd25Qcm9wZXJ0eShhLCBcImNvZGVcIik7XG59XG5cbmV4cG9ydCB0eXBlIFdlYlNvY2tldFBpbmdFdmVudCA9IFtcInBpbmdcIiwgVWludDhBcnJheV07XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1dlYlNvY2tldFBpbmdFdmVudChcbiAgYTogV2ViU29ja2V0RXZlbnQsXG4pOiBhIGlzIFdlYlNvY2tldFBpbmdFdmVudCB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGEpICYmIGFbMF0gPT09IFwicGluZ1wiICYmIGFbMV0gaW5zdGFuY2VvZiBVaW50OEFycmF5O1xufVxuXG5leHBvcnQgdHlwZSBXZWJTb2NrZXRQb25nRXZlbnQgPSBbXCJwb25nXCIsIFVpbnQ4QXJyYXldO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNXZWJTb2NrZXRQb25nRXZlbnQoXG4gIGE6IFdlYlNvY2tldEV2ZW50LFxuKTogYSBpcyBXZWJTb2NrZXRQb25nRXZlbnQge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhKSAmJiBhWzBdID09PSBcInBvbmdcIiAmJiBhWzFdIGluc3RhbmNlb2YgVWludDhBcnJheTtcbn1cblxuZXhwb3J0IHR5cGUgV2ViU29ja2V0TWVzc2FnZSA9IHN0cmluZyB8IFVpbnQ4QXJyYXk7XG5cbmV4cG9ydCBpbnRlcmZhY2UgV2ViU29ja2V0RnJhbWUge1xuICBpc0xhc3RGcmFtZTogYm9vbGVhbjtcbiAgb3Bjb2RlOiBPcENvZGU7XG4gIG1hc2s/OiBVaW50OEFycmF5O1xuICBwYXlsb2FkOiBVaW50OEFycmF5O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFdlYlNvY2tldCBleHRlbmRzIEFzeW5jSXRlcmFibGU8V2ViU29ja2V0RXZlbnQ+IHtcbiAgcmVhZG9ubHkgY29ubjogRGVuby5Db25uO1xuICByZWFkb25seSBpc0Nsb3NlZDogYm9vbGVhbjtcblxuICBbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCk6IEFzeW5jSXRlcmFibGVJdGVyYXRvcjxXZWJTb2NrZXRFdmVudD47XG5cbiAgLyoqXG4gICAqIEB0aHJvd3MgYERlbm8uZXJyb3JzLkNvbm5lY3Rpb25SZXNldGBcbiAgICovXG4gIHNlbmQoZGF0YTogV2ViU29ja2V0TWVzc2FnZSk6IFByb21pc2U8dm9pZD47XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBkYXRhXG4gICAqIEB0aHJvd3MgYERlbm8uZXJyb3JzLkNvbm5lY3Rpb25SZXNldGBcbiAgICovXG4gIHBpbmcoZGF0YT86IFdlYlNvY2tldE1lc3NhZ2UpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKiBDbG9zZSBjb25uZWN0aW9uIGFmdGVyIHNlbmRpbmcgY2xvc2UgZnJhbWUgdG8gcGVlci5cbiAgICogVGhpcyBpcyBjYW5vbmljYWwgd2F5IG9mIGRpc2Nvbm5lY3Rpb24gYnV0IGl0IG1heSBoYW5nIGJlY2F1c2Ugb2YgcGVlcidzIHJlc3BvbnNlIGRlbGF5LlxuICAgKiBEZWZhdWx0IGNsb3NlIGNvZGUgaXMgMTAwMCAoTm9ybWFsIENsb3N1cmUpXG4gICAqIEB0aHJvd3MgYERlbm8uZXJyb3JzLkNvbm5lY3Rpb25SZXNldGBcbiAgICovXG4gIGNsb3NlKCk6IFByb21pc2U8dm9pZD47XG4gIGNsb3NlKGNvZGU6IG51bWJlcik6IFByb21pc2U8dm9pZD47XG4gIGNsb3NlKGNvZGU6IG51bWJlciwgcmVhc29uOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKiBDbG9zZSBjb25uZWN0aW9uIGZvcmNlbHkgd2l0aG91dCBzZW5kaW5nIGNsb3NlIGZyYW1lIHRvIHBlZXIuXG4gICAqICBUaGlzIGlzIGJhc2ljYWxseSB1bmRlc2lyYWJsZSB3YXkgb2YgZGlzY29ubmVjdGlvbi4gVXNlIGNhcmVmdWxseS4gKi9cbiAgY2xvc2VGb3JjZSgpOiB2b2lkO1xufVxuXG4vKiogVW5tYXNrIG1hc2tlZCB3ZWJzb2NrZXQgcGF5bG9hZCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVubWFzayhwYXlsb2FkOiBVaW50OEFycmF5LCBtYXNrPzogVWludDhBcnJheSk6IHZvaWQge1xuICBpZiAobWFzaykge1xuICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBwYXlsb2FkLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBwYXlsb2FkW2ldIF49IG1hc2tbaSAmIDNdO1xuICAgIH1cbiAgfVxufVxuXG4vKiogV3JpdGUgd2Vic29ja2V0IGZyYW1lIHRvIGdpdmVuIHdyaXRlciAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyaXRlRnJhbWUoXG4gIGZyYW1lOiBXZWJTb2NrZXRGcmFtZSxcbiAgd3JpdGVyOiBEZW5vLldyaXRlcixcbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBwYXlsb2FkTGVuZ3RoID0gZnJhbWUucGF5bG9hZC5ieXRlTGVuZ3RoO1xuICBsZXQgaGVhZGVyOiBVaW50OEFycmF5O1xuICBjb25zdCBoYXNNYXNrID0gZnJhbWUubWFzayA/IDB4ODAgOiAwO1xuICBpZiAoZnJhbWUubWFzayAmJiBmcmFtZS5tYXNrLmJ5dGVMZW5ndGggIT09IDQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBcImludmFsaWQgbWFzay4gbWFzayBtdXN0IGJlIDQgYnl0ZXM6IGxlbmd0aD1cIiArIGZyYW1lLm1hc2suYnl0ZUxlbmd0aCxcbiAgICApO1xuICB9XG4gIGlmIChwYXlsb2FkTGVuZ3RoIDwgMTI2KSB7XG4gICAgaGVhZGVyID0gbmV3IFVpbnQ4QXJyYXkoWzB4ODAgfCBmcmFtZS5vcGNvZGUsIGhhc01hc2sgfCBwYXlsb2FkTGVuZ3RoXSk7XG4gIH0gZWxzZSBpZiAocGF5bG9hZExlbmd0aCA8IDB4ZmZmZikge1xuICAgIGhlYWRlciA9IG5ldyBVaW50OEFycmF5KFtcbiAgICAgIDB4ODAgfCBmcmFtZS5vcGNvZGUsXG4gICAgICBoYXNNYXNrIHwgMGIwMTExMTExMCxcbiAgICAgIHBheWxvYWRMZW5ndGggPj4+IDgsXG4gICAgICBwYXlsb2FkTGVuZ3RoICYgMHgwMGZmLFxuICAgIF0pO1xuICB9IGVsc2Uge1xuICAgIGhlYWRlciA9IG5ldyBVaW50OEFycmF5KFtcbiAgICAgIDB4ODAgfCBmcmFtZS5vcGNvZGUsXG4gICAgICBoYXNNYXNrIHwgMGIwMTExMTExMSxcbiAgICAgIC4uLnNsaWNlTG9uZ1RvQnl0ZXMocGF5bG9hZExlbmd0aCksXG4gICAgXSk7XG4gIH1cbiAgaWYgKGZyYW1lLm1hc2spIHtcbiAgICBoZWFkZXIgPSBjb25jYXQoaGVhZGVyLCBmcmFtZS5tYXNrKTtcbiAgfVxuICB1bm1hc2soZnJhbWUucGF5bG9hZCwgZnJhbWUubWFzayk7XG4gIGhlYWRlciA9IGNvbmNhdChoZWFkZXIsIGZyYW1lLnBheWxvYWQpO1xuICBjb25zdCB3ID0gQnVmV3JpdGVyLmNyZWF0ZSh3cml0ZXIpO1xuICBhd2FpdCB3LndyaXRlKGhlYWRlcik7XG4gIGF3YWl0IHcuZmx1c2goKTtcbn1cblxuLyoqIFJlYWQgd2Vic29ja2V0IGZyYW1lIGZyb20gZ2l2ZW4gQnVmUmVhZGVyXG4gKiBAdGhyb3dzIGBEZW5vLmVycm9ycy5VbmV4cGVjdGVkRW9mYCBXaGVuIHBlZXIgY2xvc2VkIGNvbm5lY3Rpb24gd2l0aG91dCBjbG9zZSBmcmFtZVxuICogQHRocm93cyBgRXJyb3JgIEZyYW1lIGlzIGludmFsaWRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRGcmFtZShidWY6IEJ1ZlJlYWRlcik6IFByb21pc2U8V2ViU29ja2V0RnJhbWU+IHtcbiAgbGV0IGIgPSBhd2FpdCBidWYucmVhZEJ5dGUoKTtcbiAgYXNzZXJ0KGIgIT09IG51bGwpO1xuICBsZXQgaXNMYXN0RnJhbWUgPSBmYWxzZTtcbiAgc3dpdGNoIChiID4+PiA0KSB7XG4gICAgY2FzZSAwYjEwMDA6XG4gICAgICBpc0xhc3RGcmFtZSA9IHRydWU7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDBiMDAwMDpcbiAgICAgIGlzTGFzdEZyYW1lID0gZmFsc2U7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBzaWduYXR1cmVcIik7XG4gIH1cbiAgY29uc3Qgb3Bjb2RlID0gYiAmIDB4MGY7XG4gIC8vIGhhc19tYXNrICYgcGF5bG9hZFxuICBiID0gYXdhaXQgYnVmLnJlYWRCeXRlKCk7XG4gIGFzc2VydChiICE9PSBudWxsKTtcbiAgY29uc3QgaGFzTWFzayA9IGIgPj4+IDc7XG4gIGxldCBwYXlsb2FkTGVuZ3RoID0gYiAmIDBiMDExMTExMTE7XG4gIGlmIChwYXlsb2FkTGVuZ3RoID09PSAxMjYpIHtcbiAgICBjb25zdCBsID0gYXdhaXQgcmVhZFNob3J0KGJ1Zik7XG4gICAgYXNzZXJ0KGwgIT09IG51bGwpO1xuICAgIHBheWxvYWRMZW5ndGggPSBsO1xuICB9IGVsc2UgaWYgKHBheWxvYWRMZW5ndGggPT09IDEyNykge1xuICAgIGNvbnN0IGwgPSBhd2FpdCByZWFkTG9uZyhidWYpO1xuICAgIGFzc2VydChsICE9PSBudWxsKTtcbiAgICBwYXlsb2FkTGVuZ3RoID0gTnVtYmVyKGwpO1xuICB9XG4gIC8vIG1hc2tcbiAgbGV0IG1hc2s6IFVpbnQ4QXJyYXkgfCB1bmRlZmluZWQ7XG4gIGlmIChoYXNNYXNrKSB7XG4gICAgbWFzayA9IG5ldyBVaW50OEFycmF5KDQpO1xuICAgIGFzc2VydCgoYXdhaXQgYnVmLnJlYWRGdWxsKG1hc2spKSAhPT0gbnVsbCk7XG4gIH1cbiAgLy8gcGF5bG9hZFxuICBjb25zdCBwYXlsb2FkID0gbmV3IFVpbnQ4QXJyYXkocGF5bG9hZExlbmd0aCk7XG4gIGFzc2VydCgoYXdhaXQgYnVmLnJlYWRGdWxsKHBheWxvYWQpKSAhPT0gbnVsbCk7XG4gIHJldHVybiB7XG4gICAgaXNMYXN0RnJhbWUsXG4gICAgb3Bjb2RlLFxuICAgIG1hc2ssXG4gICAgcGF5bG9hZCxcbiAgfTtcbn1cblxuLy8gQ3JlYXRlIGNsaWVudC10by1zZXJ2ZXIgbWFzaywgcmFuZG9tIDMyYml0IG51bWJlclxuZnVuY3Rpb24gY3JlYXRlTWFzaygpOiBVaW50OEFycmF5IHtcbiAgcmV0dXJuIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMobmV3IFVpbnQ4QXJyYXkoNCkpO1xufVxuXG5jbGFzcyBXZWJTb2NrZXRJbXBsIGltcGxlbWVudHMgV2ViU29ja2V0IHtcbiAgcmVhZG9ubHkgY29ubjogRGVuby5Db25uO1xuICBwcml2YXRlIHJlYWRvbmx5IG1hc2s/OiBVaW50OEFycmF5O1xuICBwcml2YXRlIHJlYWRvbmx5IGJ1ZlJlYWRlcjogQnVmUmVhZGVyO1xuICBwcml2YXRlIHJlYWRvbmx5IGJ1ZldyaXRlcjogQnVmV3JpdGVyO1xuICBwcml2YXRlIHNlbmRRdWV1ZTogQXJyYXk8e1xuICAgIGZyYW1lOiBXZWJTb2NrZXRGcmFtZTtcbiAgICBkOiBEZWZlcnJlZDx2b2lkPjtcbiAgfT4gPSBbXTtcblxuICBjb25zdHJ1Y3Rvcih7XG4gICAgY29ubixcbiAgICBidWZSZWFkZXIsXG4gICAgYnVmV3JpdGVyLFxuICAgIG1hc2ssXG4gIH06IHtcbiAgICBjb25uOiBEZW5vLkNvbm47XG4gICAgYnVmUmVhZGVyPzogQnVmUmVhZGVyO1xuICAgIGJ1ZldyaXRlcj86IEJ1ZldyaXRlcjtcbiAgICBtYXNrPzogVWludDhBcnJheTtcbiAgfSkge1xuICAgIHRoaXMuY29ubiA9IGNvbm47XG4gICAgdGhpcy5tYXNrID0gbWFzaztcbiAgICB0aGlzLmJ1ZlJlYWRlciA9IGJ1ZlJlYWRlciB8fCBuZXcgQnVmUmVhZGVyKGNvbm4pO1xuICAgIHRoaXMuYnVmV3JpdGVyID0gYnVmV3JpdGVyIHx8IG5ldyBCdWZXcml0ZXIoY29ubik7XG4gIH1cblxuICBhc3luYyAqW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8V2ViU29ja2V0RXZlbnQ+IHtcbiAgICBsZXQgZnJhbWVzOiBXZWJTb2NrZXRGcmFtZVtdID0gW107XG4gICAgbGV0IHBheWxvYWRzTGVuZ3RoID0gMDtcbiAgICB3aGlsZSAoIXRoaXMuX2lzQ2xvc2VkKSB7XG4gICAgICBsZXQgZnJhbWU6IFdlYlNvY2tldEZyYW1lO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZnJhbWUgPSBhd2FpdCByZWFkRnJhbWUodGhpcy5idWZSZWFkZXIpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB0aGlzLmVuc3VyZVNvY2tldENsb3NlZCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHVubWFzayhmcmFtZS5wYXlsb2FkLCBmcmFtZS5tYXNrKTtcbiAgICAgIHN3aXRjaCAoZnJhbWUub3Bjb2RlKSB7XG4gICAgICAgIGNhc2UgT3BDb2RlLlRleHRGcmFtZTpcbiAgICAgICAgY2FzZSBPcENvZGUuQmluYXJ5RnJhbWU6XG4gICAgICAgIGNhc2UgT3BDb2RlLkNvbnRpbnVlOlxuICAgICAgICAgIGZyYW1lcy5wdXNoKGZyYW1lKTtcbiAgICAgICAgICBwYXlsb2Fkc0xlbmd0aCArPSBmcmFtZS5wYXlsb2FkLmxlbmd0aDtcbiAgICAgICAgICBpZiAoZnJhbWUuaXNMYXN0RnJhbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmNhdCA9IG5ldyBVaW50OEFycmF5KHBheWxvYWRzTGVuZ3RoKTtcbiAgICAgICAgICAgIGxldCBvZmZzID0gMDtcbiAgICAgICAgICAgIGZvciAoY29uc3QgZnJhbWUgb2YgZnJhbWVzKSB7XG4gICAgICAgICAgICAgIGNvbmNhdC5zZXQoZnJhbWUucGF5bG9hZCwgb2Zmcyk7XG4gICAgICAgICAgICAgIG9mZnMgKz0gZnJhbWUucGF5bG9hZC5sZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZnJhbWVzWzBdLm9wY29kZSA9PT0gT3BDb2RlLlRleHRGcmFtZSkge1xuICAgICAgICAgICAgICAvLyB0ZXh0XG4gICAgICAgICAgICAgIHlpZWxkIGRlY29kZShjb25jYXQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gYmluYXJ5XG4gICAgICAgICAgICAgIHlpZWxkIGNvbmNhdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZyYW1lcyA9IFtdO1xuICAgICAgICAgICAgcGF5bG9hZHNMZW5ndGggPSAwO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBPcENvZGUuQ2xvc2U6IHtcbiAgICAgICAgICAvLyBbMHgxMiwgMHgzNF0gLT4gMHgxMjM0XG4gICAgICAgICAgY29uc3QgY29kZSA9IChmcmFtZS5wYXlsb2FkWzBdIDw8IDgpIHwgZnJhbWUucGF5bG9hZFsxXTtcbiAgICAgICAgICBjb25zdCByZWFzb24gPSBkZWNvZGUoXG4gICAgICAgICAgICBmcmFtZS5wYXlsb2FkLnN1YmFycmF5KDIsIGZyYW1lLnBheWxvYWQubGVuZ3RoKSxcbiAgICAgICAgICApO1xuICAgICAgICAgIGF3YWl0IHRoaXMuY2xvc2UoY29kZSwgcmVhc29uKTtcbiAgICAgICAgICB5aWVsZCB7IGNvZGUsIHJlYXNvbiB9O1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIE9wQ29kZS5QaW5nOlxuICAgICAgICAgIGF3YWl0IHRoaXMuZW5xdWV1ZSh7XG4gICAgICAgICAgICBvcGNvZGU6IE9wQ29kZS5Qb25nLFxuICAgICAgICAgICAgcGF5bG9hZDogZnJhbWUucGF5bG9hZCxcbiAgICAgICAgICAgIGlzTGFzdEZyYW1lOiB0cnVlLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHlpZWxkIFtcInBpbmdcIiwgZnJhbWUucGF5bG9hZF0gYXMgV2ViU29ja2V0UGluZ0V2ZW50O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIE9wQ29kZS5Qb25nOlxuICAgICAgICAgIHlpZWxkIFtcInBvbmdcIiwgZnJhbWUucGF5bG9hZF0gYXMgV2ViU29ja2V0UG9uZ0V2ZW50O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZGVxdWV1ZSgpOiB2b2lkIHtcbiAgICBjb25zdCBbZW50cnldID0gdGhpcy5zZW5kUXVldWU7XG4gICAgaWYgKCFlbnRyeSkgcmV0dXJuO1xuICAgIGlmICh0aGlzLl9pc0Nsb3NlZCkgcmV0dXJuO1xuICAgIGNvbnN0IHsgZCwgZnJhbWUgfSA9IGVudHJ5O1xuICAgIHdyaXRlRnJhbWUoZnJhbWUsIHRoaXMuYnVmV3JpdGVyKVxuICAgICAgLnRoZW4oKCkgPT4gZC5yZXNvbHZlKCkpXG4gICAgICAuY2F0Y2goKGUpID0+IGQucmVqZWN0KGUpKVxuICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICB0aGlzLnNlbmRRdWV1ZS5zaGlmdCgpO1xuICAgICAgICB0aGlzLmRlcXVldWUoKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBlbnF1ZXVlKGZyYW1lOiBXZWJTb2NrZXRGcmFtZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLl9pc0Nsb3NlZCkge1xuICAgICAgdGhyb3cgbmV3IERlbm8uZXJyb3JzLkNvbm5lY3Rpb25SZXNldChcIlNvY2tldCBoYXMgYWxyZWFkeSBiZWVuIGNsb3NlZFwiKTtcbiAgICB9XG4gICAgY29uc3QgZCA9IGRlZmVycmVkPHZvaWQ+KCk7XG4gICAgdGhpcy5zZW5kUXVldWUucHVzaCh7IGQsIGZyYW1lIH0pO1xuICAgIGlmICh0aGlzLnNlbmRRdWV1ZS5sZW5ndGggPT09IDEpIHtcbiAgICAgIHRoaXMuZGVxdWV1ZSgpO1xuICAgIH1cbiAgICByZXR1cm4gZDtcbiAgfVxuXG4gIHNlbmQoZGF0YTogV2ViU29ja2V0TWVzc2FnZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG9wY29kZSA9IHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiXG4gICAgICA/IE9wQ29kZS5UZXh0RnJhbWVcbiAgICAgIDogT3BDb2RlLkJpbmFyeUZyYW1lO1xuICAgIGNvbnN0IHBheWxvYWQgPSB0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIiA/IGVuY29kZShkYXRhKSA6IGRhdGE7XG4gICAgY29uc3QgaXNMYXN0RnJhbWUgPSB0cnVlO1xuICAgIGNvbnN0IGZyYW1lID0ge1xuICAgICAgaXNMYXN0RnJhbWUsXG4gICAgICBvcGNvZGUsXG4gICAgICBwYXlsb2FkLFxuICAgICAgbWFzazogdGhpcy5tYXNrLFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuZW5xdWV1ZShmcmFtZSk7XG4gIH1cblxuICBwaW5nKGRhdGE6IFdlYlNvY2tldE1lc3NhZ2UgPSBcIlwiKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgcGF5bG9hZCA9IHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiID8gZW5jb2RlKGRhdGEpIDogZGF0YTtcbiAgICBjb25zdCBmcmFtZSA9IHtcbiAgICAgIGlzTGFzdEZyYW1lOiB0cnVlLFxuICAgICAgb3Bjb2RlOiBPcENvZGUuUGluZyxcbiAgICAgIG1hc2s6IHRoaXMubWFzayxcbiAgICAgIHBheWxvYWQsXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5lbnF1ZXVlKGZyYW1lKTtcbiAgfVxuXG4gIHByaXZhdGUgX2lzQ2xvc2VkID0gZmFsc2U7XG4gIGdldCBpc0Nsb3NlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5faXNDbG9zZWQ7XG4gIH1cblxuICBhc3luYyBjbG9zZShjb2RlID0gMTAwMCwgcmVhc29uPzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGhlYWRlciA9IFtjb2RlID4+PiA4LCBjb2RlICYgMHgwMGZmXTtcbiAgICAgIGxldCBwYXlsb2FkOiBVaW50OEFycmF5O1xuICAgICAgaWYgKHJlYXNvbikge1xuICAgICAgICBjb25zdCByZWFzb25CeXRlcyA9IGVuY29kZShyZWFzb24pO1xuICAgICAgICBwYXlsb2FkID0gbmV3IFVpbnQ4QXJyYXkoMiArIHJlYXNvbkJ5dGVzLmJ5dGVMZW5ndGgpO1xuICAgICAgICBwYXlsb2FkLnNldChoZWFkZXIpO1xuICAgICAgICBwYXlsb2FkLnNldChyZWFzb25CeXRlcywgMik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXlsb2FkID0gbmV3IFVpbnQ4QXJyYXkoaGVhZGVyKTtcbiAgICAgIH1cbiAgICAgIGF3YWl0IHRoaXMuZW5xdWV1ZSh7XG4gICAgICAgIGlzTGFzdEZyYW1lOiB0cnVlLFxuICAgICAgICBvcGNvZGU6IE9wQ29kZS5DbG9zZSxcbiAgICAgICAgbWFzazogdGhpcy5tYXNrLFxuICAgICAgICBwYXlsb2FkLFxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgZTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5lbnN1cmVTb2NrZXRDbG9zZWQoKTtcbiAgICB9XG4gIH1cblxuICBjbG9zZUZvcmNlKCk6IHZvaWQge1xuICAgIHRoaXMuZW5zdXJlU29ja2V0Q2xvc2VkKCk7XG4gIH1cblxuICBwcml2YXRlIGVuc3VyZVNvY2tldENsb3NlZCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5pc0Nsb3NlZCkgcmV0dXJuO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLmNvbm4uY2xvc2UoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLl9pc0Nsb3NlZCA9IHRydWU7XG4gICAgICBjb25zdCByZXN0ID0gdGhpcy5zZW5kUXVldWU7XG4gICAgICB0aGlzLnNlbmRRdWV1ZSA9IFtdO1xuICAgICAgcmVzdC5mb3JFYWNoKChlKSA9PlxuICAgICAgICBlLmQucmVqZWN0KFxuICAgICAgICAgIG5ldyBEZW5vLmVycm9ycy5Db25uZWN0aW9uUmVzZXQoXCJTb2NrZXQgaGFzIGFscmVhZHkgYmVlbiBjbG9zZWRcIiksXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZXR1cm4gd2hldGhlciBnaXZlbiBoZWFkZXJzIGlzIGFjY2VwdGFibGUgZm9yIHdlYnNvY2tldCAgKi9cbmV4cG9ydCBmdW5jdGlvbiBhY2NlcHRhYmxlKHJlcTogeyBoZWFkZXJzOiBIZWFkZXJzIH0pOiBib29sZWFuIHtcbiAgY29uc3QgdXBncmFkZSA9IHJlcS5oZWFkZXJzLmdldChcInVwZ3JhZGVcIik7XG4gIGlmICghdXBncmFkZSB8fCB1cGdyYWRlLnRvTG93ZXJDYXNlKCkgIT09IFwid2Vic29ja2V0XCIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3Qgc2VjS2V5ID0gcmVxLmhlYWRlcnMuZ2V0KFwic2VjLXdlYnNvY2tldC1rZXlcIik7XG4gIHJldHVybiAoXG4gICAgcmVxLmhlYWRlcnMuaGFzKFwic2VjLXdlYnNvY2tldC1rZXlcIikgJiZcbiAgICB0eXBlb2Ygc2VjS2V5ID09PSBcInN0cmluZ1wiICYmXG4gICAgc2VjS2V5Lmxlbmd0aCA+IDBcbiAgKTtcbn1cblxuY29uc3Qga0dVSUQgPSBcIjI1OEVBRkE1LUU5MTQtNDdEQS05NUNBLUM1QUIwREM4NUIxMVwiO1xuXG4vKiogQ3JlYXRlIHNlYy13ZWJzb2NrZXQtYWNjZXB0IGhlYWRlciB2YWx1ZSB3aXRoIGdpdmVuIG5vbmNlICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2VjQWNjZXB0KG5vbmNlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBzaGExID0gbmV3IFNoYTEoKTtcbiAgc2hhMS51cGRhdGUobm9uY2UgKyBrR1VJRCk7XG4gIGNvbnN0IGJ5dGVzID0gc2hhMS5kaWdlc3QoKTtcbiAgcmV0dXJuIGJ0b2EoU3RyaW5nLmZyb21DaGFyQ29kZSguLi5ieXRlcykpO1xufVxuXG4vKiogVXBncmFkZSBnaXZlbiBUQ1AgY29ubmVjdGlvbiBpbnRvIHdlYnNvY2tldCBjb25uZWN0aW9uICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYWNjZXB0V2ViU29ja2V0KHJlcToge1xuICBjb25uOiBEZW5vLkNvbm47XG4gIGJ1ZldyaXRlcjogQnVmV3JpdGVyO1xuICBidWZSZWFkZXI6IEJ1ZlJlYWRlcjtcbiAgaGVhZGVyczogSGVhZGVycztcbn0pOiBQcm9taXNlPFdlYlNvY2tldD4ge1xuICBjb25zdCB7IGNvbm4sIGhlYWRlcnMsIGJ1ZlJlYWRlciwgYnVmV3JpdGVyIH0gPSByZXE7XG4gIGlmIChhY2NlcHRhYmxlKHJlcSkpIHtcbiAgICBjb25zdCBzb2NrID0gbmV3IFdlYlNvY2tldEltcGwoeyBjb25uLCBidWZSZWFkZXIsIGJ1ZldyaXRlciB9KTtcbiAgICBjb25zdCBzZWNLZXkgPSBoZWFkZXJzLmdldChcInNlYy13ZWJzb2NrZXQta2V5XCIpO1xuICAgIGlmICh0eXBlb2Ygc2VjS2V5ICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJzZWMtd2Vic29ja2V0LWtleSBpcyBub3QgcHJvdmlkZWRcIik7XG4gICAgfVxuICAgIGNvbnN0IHNlY0FjY2VwdCA9IGNyZWF0ZVNlY0FjY2VwdChzZWNLZXkpO1xuICAgIGF3YWl0IHdyaXRlUmVzcG9uc2UoYnVmV3JpdGVyLCB7XG4gICAgICBzdGF0dXM6IDEwMSxcbiAgICAgIGhlYWRlcnM6IG5ldyBIZWFkZXJzKHtcbiAgICAgICAgVXBncmFkZTogXCJ3ZWJzb2NrZXRcIixcbiAgICAgICAgQ29ubmVjdGlvbjogXCJVcGdyYWRlXCIsXG4gICAgICAgIFwiU2VjLVdlYlNvY2tldC1BY2NlcHRcIjogc2VjQWNjZXB0LFxuICAgICAgfSksXG4gICAgfSk7XG4gICAgcmV0dXJuIHNvY2s7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwicmVxdWVzdCBpcyBub3QgYWNjZXB0YWJsZVwiKTtcbn1cblxuY29uc3Qga1NlY0NoYXJzID0gXCJhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ekFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaLS5+X1wiO1xuXG4vKiogQ3JlYXRlIFdlYlNvY2tldC1TZWMtS2V5LiBCYXNlNjQgZW5jb2RlZCAxNiBieXRlcyBzdHJpbmcgKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTZWNLZXkoKTogc3RyaW5nIHtcbiAgbGV0IGtleSA9IFwiXCI7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMTY7IGkrKykge1xuICAgIGNvbnN0IGogPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBrU2VjQ2hhcnMubGVuZ3RoKTtcbiAgICBrZXkgKz0ga1NlY0NoYXJzW2pdO1xuICB9XG4gIHJldHVybiBidG9hKGtleSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kc2hha2UoXG4gIHVybDogVVJMLFxuICBoZWFkZXJzOiBIZWFkZXJzLFxuICBidWZSZWFkZXI6IEJ1ZlJlYWRlcixcbiAgYnVmV3JpdGVyOiBCdWZXcml0ZXIsXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgeyBob3N0bmFtZSwgcGF0aG5hbWUsIHNlYXJjaCB9ID0gdXJsO1xuICBjb25zdCBrZXkgPSBjcmVhdGVTZWNLZXkoKTtcblxuICBpZiAoIWhlYWRlcnMuaGFzKFwiaG9zdFwiKSkge1xuICAgIGhlYWRlcnMuc2V0KFwiaG9zdFwiLCBob3N0bmFtZSk7XG4gIH1cbiAgaGVhZGVycy5zZXQoXCJ1cGdyYWRlXCIsIFwid2Vic29ja2V0XCIpO1xuICBoZWFkZXJzLnNldChcImNvbm5lY3Rpb25cIiwgXCJ1cGdyYWRlXCIpO1xuICBoZWFkZXJzLnNldChcInNlYy13ZWJzb2NrZXQta2V5XCIsIGtleSk7XG4gIGhlYWRlcnMuc2V0KFwic2VjLXdlYnNvY2tldC12ZXJzaW9uXCIsIFwiMTNcIik7XG5cbiAgbGV0IGhlYWRlclN0ciA9IGBHRVQgJHtwYXRobmFtZX0ke3NlYXJjaH0gSFRUUC8xLjFcXHJcXG5gO1xuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBoZWFkZXJzKSB7XG4gICAgaGVhZGVyU3RyICs9IGAke2tleX06ICR7dmFsdWV9XFxyXFxuYDtcbiAgfVxuICBoZWFkZXJTdHIgKz0gXCJcXHJcXG5cIjtcblxuICBhd2FpdCBidWZXcml0ZXIud3JpdGUoZW5jb2RlKGhlYWRlclN0cikpO1xuICBhd2FpdCBidWZXcml0ZXIuZmx1c2goKTtcblxuICBjb25zdCB0cFJlYWRlciA9IG5ldyBUZXh0UHJvdG9SZWFkZXIoYnVmUmVhZGVyKTtcbiAgY29uc3Qgc3RhdHVzTGluZSA9IGF3YWl0IHRwUmVhZGVyLnJlYWRMaW5lKCk7XG4gIGlmIChzdGF0dXNMaW5lID09PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IERlbm8uZXJyb3JzLlVuZXhwZWN0ZWRFb2YoKTtcbiAgfVxuICBjb25zdCBtID0gc3RhdHVzTGluZS5tYXRjaCgvXig/PHZlcnNpb24+XFxTKykgKD88c3RhdHVzQ29kZT5cXFMrKSAvKTtcbiAgaWYgKCFtKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwid3M6IGludmFsaWQgc3RhdHVzIGxpbmU6IFwiICsgc3RhdHVzTGluZSk7XG4gIH1cblxuICBhc3NlcnQobS5ncm91cHMpO1xuICBjb25zdCB7IHZlcnNpb24sIHN0YXR1c0NvZGUgfSA9IG0uZ3JvdXBzO1xuICBpZiAodmVyc2lvbiAhPT0gXCJIVFRQLzEuMVwiIHx8IHN0YXR1c0NvZGUgIT09IFwiMTAxXCIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgd3M6IHNlcnZlciBkaWRuJ3QgYWNjZXB0IGhhbmRzaGFrZTogYCArXG4gICAgICAgIGB2ZXJzaW9uPSR7dmVyc2lvbn0sIHN0YXR1c0NvZGU9JHtzdGF0dXNDb2RlfWAsXG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IHJlc3BvbnNlSGVhZGVycyA9IGF3YWl0IHRwUmVhZGVyLnJlYWRNSU1FSGVhZGVyKCk7XG4gIGlmIChyZXNwb25zZUhlYWRlcnMgPT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRGVuby5lcnJvcnMuVW5leHBlY3RlZEVvZigpO1xuICB9XG5cbiAgY29uc3QgZXhwZWN0ZWRTZWNBY2NlcHQgPSBjcmVhdGVTZWNBY2NlcHQoa2V5KTtcbiAgY29uc3Qgc2VjQWNjZXB0ID0gcmVzcG9uc2VIZWFkZXJzLmdldChcInNlYy13ZWJzb2NrZXQtYWNjZXB0XCIpO1xuICBpZiAoc2VjQWNjZXB0ICE9PSBleHBlY3RlZFNlY0FjY2VwdCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGB3czogdW5leHBlY3RlZCBzZWMtd2Vic29ja2V0LWFjY2VwdCBoZWFkZXI6IGAgK1xuICAgICAgICBgZXhwZWN0ZWQ9JHtleHBlY3RlZFNlY0FjY2VwdH0sIGFjdHVhbD0ke3NlY0FjY2VwdH1gLFxuICAgICk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb25uZWN0IHRvIGdpdmVuIHdlYnNvY2tldCBlbmRwb2ludCB1cmwuXG4gKiBFbmRwb2ludCBtdXN0IGJlIGFjY2VwdGFibGUgZm9yIFVSTC5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbm5lY3RXZWJTb2NrZXQoXG4gIGVuZHBvaW50OiBzdHJpbmcsXG4gIGhlYWRlcnM6IEhlYWRlcnMgPSBuZXcgSGVhZGVycygpLFxuKTogUHJvbWlzZTxXZWJTb2NrZXQ+IHtcbiAgY29uc3QgdXJsID0gbmV3IFVSTChlbmRwb2ludCk7XG4gIGNvbnN0IHsgaG9zdG5hbWUgfSA9IHVybDtcbiAgbGV0IGNvbm46IERlbm8uQ29ubjtcbiAgaWYgKHVybC5wcm90b2NvbCA9PT0gXCJodHRwOlwiIHx8IHVybC5wcm90b2NvbCA9PT0gXCJ3czpcIikge1xuICAgIGNvbnN0IHBvcnQgPSBwYXJzZUludCh1cmwucG9ydCB8fCBcIjgwXCIpO1xuICAgIGNvbm4gPSBhd2FpdCBEZW5vLmNvbm5lY3QoeyBob3N0bmFtZSwgcG9ydCB9KTtcbiAgfSBlbHNlIGlmICh1cmwucHJvdG9jb2wgPT09IFwiaHR0cHM6XCIgfHwgdXJsLnByb3RvY29sID09PSBcIndzczpcIikge1xuICAgIGNvbnN0IHBvcnQgPSBwYXJzZUludCh1cmwucG9ydCB8fCBcIjQ0M1wiKTtcbiAgICBjb25uID0gYXdhaXQgRGVuby5jb25uZWN0VGxzKHsgaG9zdG5hbWUsIHBvcnQgfSk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwid3M6IHVuc3VwcG9ydGVkIHByb3RvY29sOiBcIiArIHVybC5wcm90b2NvbCk7XG4gIH1cbiAgY29uc3QgYnVmV3JpdGVyID0gbmV3IEJ1ZldyaXRlcihjb25uKTtcbiAgY29uc3QgYnVmUmVhZGVyID0gbmV3IEJ1ZlJlYWRlcihjb25uKTtcbiAgdHJ5IHtcbiAgICBhd2FpdCBoYW5kc2hha2UodXJsLCBoZWFkZXJzLCBidWZSZWFkZXIsIGJ1ZldyaXRlcik7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbm4uY2xvc2UoKTtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbiAgcmV0dXJuIG5ldyBXZWJTb2NrZXRJbXBsKHtcbiAgICBjb25uLFxuICAgIGJ1ZldyaXRlcixcbiAgICBidWZSZWFkZXIsXG4gICAgbWFzazogY3JlYXRlTWFzaygpLFxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVdlYlNvY2tldChwYXJhbXM6IHtcbiAgY29ubjogRGVuby5Db25uO1xuICBidWZXcml0ZXI/OiBCdWZXcml0ZXI7XG4gIGJ1ZlJlYWRlcj86IEJ1ZlJlYWRlcjtcbiAgbWFzaz86IFVpbnQ4QXJyYXk7XG59KTogV2ViU29ja2V0IHtcbiAgcmV0dXJuIG5ldyBXZWJTb2NrZXRJbXBsKHBhcmFtcyk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFBMEUsQUFBMUUsd0VBQTBFO1NBQ2pFLE1BQU0sRUFBRSxNQUFNLFNBQVEsbUJBQXFCO1NBQzND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
