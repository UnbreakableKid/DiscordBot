// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { BufReader, BufWriter } from "../io/bufio.ts";
import { assert } from "../_util/assert.ts";
import { deferred, MuxAsyncIterator } from "../async/mod.ts";
import { bodyReader, chunkedBodyReader, emptyReader, readRequest, writeResponse } from "./_io.ts";
export class ServerRequest {
    url;
    method;
    proto;
    protoMinor;
    protoMajor;
    headers;
    conn;
    r;
    w;
    #done = deferred();
    #contentLength = undefined;
    #body = undefined;
    #finalized = false;
    get done() {
        return this.#done.then((e)=>e
        );
    }
    /**
   * Value of Content-Length header.
   * If null, then content length is invalid or not given (e.g. chunked encoding).
   */ get contentLength() {
        // undefined means not cached.
        // null means invalid or not provided.
        if (this.#contentLength === undefined) {
            const cl = this.headers.get("content-length");
            if (cl) {
                this.#contentLength = parseInt(cl);
                // Convert NaN to null (as NaN harder to test)
                if (Number.isNaN(this.#contentLength)) {
                    this.#contentLength = null;
                }
            } else {
                this.#contentLength = null;
            }
        }
        return this.#contentLength;
    }
    /**
   * Body of the request.  The easiest way to consume the body is:
   *
   *     const buf: Uint8Array = await readAll(req.body);
   */ get body() {
        if (!this.#body) {
            if (this.contentLength != null) {
                this.#body = bodyReader(this.contentLength, this.r);
            } else {
                const transferEncoding = this.headers.get("transfer-encoding");
                if (transferEncoding != null) {
                    const parts = transferEncoding.split(",").map((e)=>e.trim().toLowerCase()
                    );
                    assert(parts.includes("chunked"), 'transfer-encoding must include "chunked" if content-length is not set');
                    this.#body = chunkedBodyReader(this.headers, this.r);
                } else {
                    // Neither content-length nor transfer-encoding: chunked
                    this.#body = emptyReader();
                }
            }
        }
        return this.#body;
    }
    async respond(r) {
        let err;
        try {
            // Write our response!
            await writeResponse(this.w, r);
        } catch (e) {
            try {
                // Eagerly close on error.
                this.conn.close();
            } catch  {
            // Pass
            }
            err = e;
        }
        // Signal that this request has been processed and the next pipelined
        // request on the same connection can be accepted.
        this.#done.resolve(err);
        if (err) {
            // Error during responding, rethrow.
            throw err;
        }
    }
    async finalize() {
        if (this.#finalized) return;
        // Consume unread body
        const body = this.body;
        const buf = new Uint8Array(1024);
        while(await body.read(buf) !== null){
        // Pass
        }
        this.#finalized = true;
    }
}
export class Server {
    listener;
    #closing = false;
    #connections = [];
    constructor(listener){
        this.listener = listener;
    }
    close() {
        this.#closing = true;
        this.listener.close();
        for (const conn of this.#connections){
            try {
                conn.close();
            } catch (e) {
                // Connection might have been already closed
                if (!(e instanceof Deno.errors.BadResource)) {
                    throw e;
                }
            }
        }
    }
    // Yields all HTTP requests on a single TCP connection.
    async *iterateHttpRequests(conn) {
        const reader = new BufReader(conn);
        const writer = new BufWriter(conn);
        while(!this.#closing){
            let request;
            try {
                request = await readRequest(conn, reader);
            } catch (error) {
                if (error instanceof Deno.errors.InvalidData || error instanceof Deno.errors.UnexpectedEof) {
                    // An error was thrown while parsing request headers.
                    // Try to send the "400 Bad Request" before closing the connection.
                    try {
                        await writeResponse(writer, {
                            status: 400,
                            body: new TextEncoder().encode(`${error.message}\r\n\r\n`)
                        });
                    } catch  {
                    // The connection is broken.
                    }
                }
                break;
            }
            if (request === null) {
                break;
            }
            request.w = writer;
            yield request;
            // Wait for the request to be processed before we accept a new request on
            // this connection.
            const responseError = await request.done;
            if (responseError) {
                // Something bad happened during response.
                // (likely other side closed during pipelined req)
                // req.done implies this connection already closed, so we can just return.
                this.untrackConnection(request.conn);
                return;
            }
            try {
                // Consume unread body and trailers if receiver didn't consume those data
                await request.finalize();
            } catch  {
                break;
            }
        }
        this.untrackConnection(conn);
        try {
            conn.close();
        } catch  {
        // might have been already closed
        }
    }
    trackConnection(conn) {
        this.#connections.push(conn);
    }
    untrackConnection(conn) {
        const index = this.#connections.indexOf(conn);
        if (index !== -1) {
            this.#connections.splice(index, 1);
        }
    }
    // Accepts a new TCP connection and yields all HTTP requests that arrive on
    // it. When a connection is accepted, it also creates a new iterator of the
    // same kind and adds it to the request multiplexer so that another TCP
    // connection can be accepted.
    async *acceptConnAndIterateHttpRequests(mux) {
        if (this.#closing) return;
        // Wait for a new connection.
        let conn;
        try {
            conn = await this.listener.accept();
        } catch (error) {
            if (// The listener is closed:
            error instanceof Deno.errors.BadResource || // TLS handshake errors:
            error instanceof Deno.errors.InvalidData || error instanceof Deno.errors.UnexpectedEof || error instanceof Deno.errors.ConnectionReset) {
                return mux.add(this.acceptConnAndIterateHttpRequests(mux));
            }
            throw error;
        }
        this.trackConnection(conn);
        // Try to accept another connection and add it to the multiplexer.
        mux.add(this.acceptConnAndIterateHttpRequests(mux));
        // Yield the requests that arrive on the just-accepted connection.
        yield* this.iterateHttpRequests(conn);
    }
    [Symbol.asyncIterator]() {
        const mux = new MuxAsyncIterator();
        mux.add(this.acceptConnAndIterateHttpRequests(mux));
        return mux.iterate();
    }
}
/**
 * Parse addr from string
 *
 *     const addr = "::1:8000";
 *     parseAddrFromString(addr);
 *
 * @param addr Address string
 */ export function _parseAddrFromStr(addr) {
    let url;
    try {
        const host = addr.startsWith(":") ? `0.0.0.0${addr}` : addr;
        url = new URL(`http://${host}`);
    } catch  {
        throw new TypeError("Invalid address.");
    }
    if (url.username || url.password || url.pathname != "/" || url.search || url.hash) {
        throw new TypeError("Invalid address.");
    }
    return {
        hostname: url.hostname,
        port: url.port === "" ? 80 : Number(url.port)
    };
}
/**
 * Create a HTTP server
 *
 *     import { serve } from "https://deno.land/std/http/server.ts";
 *     const body = "Hello World\n";
 *     const server = serve({ port: 8000 });
 *     for await (const req of server) {
 *       req.respond({ body });
 *     }
 */ export function serve(addr) {
    if (typeof addr === "string") {
        addr = _parseAddrFromStr(addr);
    }
    const listener = Deno.listen(addr);
    return new Server(listener);
}
/**
 * Start an HTTP server with given options and request handler
 *
 *     const body = "Hello World\n";
 *     const options = { port: 8000 };
 *     listenAndServe(options, (req) => {
 *       req.respond({ body });
 *     });
 *
 * @param options Server configuration
 * @param handler Request handler
 */ export async function listenAndServe(addr, handler) {
    const server = serve(addr);
    for await (const request of server){
        handler(request);
    }
}
/**
 * Create an HTTPS server with given options
 *
 *     const body = "Hello HTTPS";
 *     const options = {
 *       hostname: "localhost",
 *       port: 443,
 *       certFile: "./path/to/localhost.crt",
 *       keyFile: "./path/to/localhost.key",
 *     };
 *     for await (const req of serveTLS(options)) {
 *       req.respond({ body });
 *     }
 *
 * @param options Server configuration
 * @return Async iterable server instance for incoming requests
 */ export function serveTLS(options) {
    const tlsOptions = {
        ...options,
        transport: "tcp"
    };
    const listener = Deno.listenTls(tlsOptions);
    return new Server(listener);
}
/**
 * Start an HTTPS server with given options and request handler
 *
 *     const body = "Hello HTTPS";
 *     const options = {
 *       hostname: "localhost",
 *       port: 443,
 *       certFile: "./path/to/localhost.crt",
 *       keyFile: "./path/to/localhost.key",
 *     };
 *     listenAndServeTLS(options, (req) => {
 *       req.respond({ body });
 *     });
 *
 * @param options Server configuration
 * @param handler Request handler
 */ export async function listenAndServeTLS(options, handler) {
    const server = serveTLS(options);
    for await (const request of server){
        handler(request);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NS4wL2h0dHAvc2VydmVyLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHsgQnVmUmVhZGVyLCBCdWZXcml0ZXIgfSBmcm9tIFwiLi4vaW8vYnVmaW8udHNcIjtcbmltcG9ydCB7IGFzc2VydCB9IGZyb20gXCIuLi9fdXRpbC9hc3NlcnQudHNcIjtcbmltcG9ydCB7IERlZmVycmVkLCBkZWZlcnJlZCwgTXV4QXN5bmNJdGVyYXRvciB9IGZyb20gXCIuLi9hc3luYy9tb2QudHNcIjtcbmltcG9ydCB7XG4gIGJvZHlSZWFkZXIsXG4gIGNodW5rZWRCb2R5UmVhZGVyLFxuICBlbXB0eVJlYWRlcixcbiAgcmVhZFJlcXVlc3QsXG4gIHdyaXRlUmVzcG9uc2UsXG59IGZyb20gXCIuL19pby50c1wiO1xuZXhwb3J0IGNsYXNzIFNlcnZlclJlcXVlc3Qge1xuICB1cmwhOiBzdHJpbmc7XG4gIG1ldGhvZCE6IHN0cmluZztcbiAgcHJvdG8hOiBzdHJpbmc7XG4gIHByb3RvTWlub3IhOiBudW1iZXI7XG4gIHByb3RvTWFqb3IhOiBudW1iZXI7XG4gIGhlYWRlcnMhOiBIZWFkZXJzO1xuICBjb25uITogRGVuby5Db25uO1xuICByITogQnVmUmVhZGVyO1xuICB3ITogQnVmV3JpdGVyO1xuXG4gICNkb25lOiBEZWZlcnJlZDxFcnJvciB8IHVuZGVmaW5lZD4gPSBkZWZlcnJlZCgpO1xuICAjY29udGVudExlbmd0aD86IG51bWJlciB8IG51bGwgPSB1bmRlZmluZWQ7XG4gICNib2R5PzogRGVuby5SZWFkZXIgPSB1bmRlZmluZWQ7XG4gICNmaW5hbGl6ZWQgPSBmYWxzZTtcblxuICBnZXQgZG9uZSgpOiBQcm9taXNlPEVycm9yIHwgdW5kZWZpbmVkPiB7XG4gICAgcmV0dXJuIHRoaXMuI2RvbmUudGhlbigoZSkgPT4gZSk7XG4gIH1cblxuICAvKipcbiAgICogVmFsdWUgb2YgQ29udGVudC1MZW5ndGggaGVhZGVyLlxuICAgKiBJZiBudWxsLCB0aGVuIGNvbnRlbnQgbGVuZ3RoIGlzIGludmFsaWQgb3Igbm90IGdpdmVuIChlLmcuIGNodW5rZWQgZW5jb2RpbmcpLlxuICAgKi9cbiAgZ2V0IGNvbnRlbnRMZW5ndGgoKTogbnVtYmVyIHwgbnVsbCB7XG4gICAgLy8gdW5kZWZpbmVkIG1lYW5zIG5vdCBjYWNoZWQuXG4gICAgLy8gbnVsbCBtZWFucyBpbnZhbGlkIG9yIG5vdCBwcm92aWRlZC5cbiAgICBpZiAodGhpcy4jY29udGVudExlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBjbCA9IHRoaXMuaGVhZGVycy5nZXQoXCJjb250ZW50LWxlbmd0aFwiKTtcbiAgICAgIGlmIChjbCkge1xuICAgICAgICB0aGlzLiNjb250ZW50TGVuZ3RoID0gcGFyc2VJbnQoY2wpO1xuICAgICAgICAvLyBDb252ZXJ0IE5hTiB0byBudWxsIChhcyBOYU4gaGFyZGVyIHRvIHRlc3QpXG4gICAgICAgIGlmIChOdW1iZXIuaXNOYU4odGhpcy4jY29udGVudExlbmd0aCkpIHtcbiAgICAgICAgICB0aGlzLiNjb250ZW50TGVuZ3RoID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy4jY29udGVudExlbmd0aCA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLiNjb250ZW50TGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIEJvZHkgb2YgdGhlIHJlcXVlc3QuICBUaGUgZWFzaWVzdCB3YXkgdG8gY29uc3VtZSB0aGUgYm9keSBpczpcbiAgICpcbiAgICogICAgIGNvbnN0IGJ1ZjogVWludDhBcnJheSA9IGF3YWl0IHJlYWRBbGwocmVxLmJvZHkpO1xuICAgKi9cbiAgZ2V0IGJvZHkoKTogRGVuby5SZWFkZXIge1xuICAgIGlmICghdGhpcy4jYm9keSkge1xuICAgICAgaWYgKHRoaXMuY29udGVudExlbmd0aCAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMuI2JvZHkgPSBib2R5UmVhZGVyKHRoaXMuY29udGVudExlbmd0aCwgdGhpcy5yKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHRyYW5zZmVyRW5jb2RpbmcgPSB0aGlzLmhlYWRlcnMuZ2V0KFwidHJhbnNmZXItZW5jb2RpbmdcIik7XG4gICAgICAgIGlmICh0cmFuc2ZlckVuY29kaW5nICE9IG51bGwpIHtcbiAgICAgICAgICBjb25zdCBwYXJ0cyA9IHRyYW5zZmVyRW5jb2RpbmdcbiAgICAgICAgICAgIC5zcGxpdChcIixcIilcbiAgICAgICAgICAgIC5tYXAoKGUpOiBzdHJpbmcgPT4gZS50cmltKCkudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgICAgYXNzZXJ0KFxuICAgICAgICAgICAgcGFydHMuaW5jbHVkZXMoXCJjaHVua2VkXCIpLFxuICAgICAgICAgICAgJ3RyYW5zZmVyLWVuY29kaW5nIG11c3QgaW5jbHVkZSBcImNodW5rZWRcIiBpZiBjb250ZW50LWxlbmd0aCBpcyBub3Qgc2V0JyxcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMuI2JvZHkgPSBjaHVua2VkQm9keVJlYWRlcih0aGlzLmhlYWRlcnMsIHRoaXMucik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gTmVpdGhlciBjb250ZW50LWxlbmd0aCBub3IgdHJhbnNmZXItZW5jb2Rpbmc6IGNodW5rZWRcbiAgICAgICAgICB0aGlzLiNib2R5ID0gZW1wdHlSZWFkZXIoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy4jYm9keTtcbiAgfVxuXG4gIGFzeW5jIHJlc3BvbmQocjogUmVzcG9uc2UpIHtcbiAgICBsZXQgZXJyOiBFcnJvciB8IHVuZGVmaW5lZDtcbiAgICB0cnkge1xuICAgICAgLy8gV3JpdGUgb3VyIHJlc3BvbnNlIVxuICAgICAgYXdhaXQgd3JpdGVSZXNwb25zZSh0aGlzLncsIHIpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIEVhZ2VybHkgY2xvc2Ugb24gZXJyb3IuXG4gICAgICAgIHRoaXMuY29ubi5jbG9zZSgpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIFBhc3NcbiAgICAgIH1cbiAgICAgIGVyciA9IGU7XG4gICAgfVxuICAgIC8vIFNpZ25hbCB0aGF0IHRoaXMgcmVxdWVzdCBoYXMgYmVlbiBwcm9jZXNzZWQgYW5kIHRoZSBuZXh0IHBpcGVsaW5lZFxuICAgIC8vIHJlcXVlc3Qgb24gdGhlIHNhbWUgY29ubmVjdGlvbiBjYW4gYmUgYWNjZXB0ZWQuXG4gICAgdGhpcy4jZG9uZS5yZXNvbHZlKGVycik7XG4gICAgaWYgKGVycikge1xuICAgICAgLy8gRXJyb3IgZHVyaW5nIHJlc3BvbmRpbmcsIHJldGhyb3cuXG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZmluYWxpemUoKSB7XG4gICAgaWYgKHRoaXMuI2ZpbmFsaXplZCkgcmV0dXJuO1xuICAgIC8vIENvbnN1bWUgdW5yZWFkIGJvZHlcbiAgICBjb25zdCBib2R5ID0gdGhpcy5ib2R5O1xuICAgIGNvbnN0IGJ1ZiA9IG5ldyBVaW50OEFycmF5KDEwMjQpO1xuICAgIHdoaWxlICgoYXdhaXQgYm9keS5yZWFkKGJ1ZikpICE9PSBudWxsKSB7XG4gICAgICAvLyBQYXNzXG4gICAgfVxuICAgIHRoaXMuI2ZpbmFsaXplZCA9IHRydWU7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNlcnZlciBpbXBsZW1lbnRzIEFzeW5jSXRlcmFibGU8U2VydmVyUmVxdWVzdD4ge1xuICAjY2xvc2luZyA9IGZhbHNlO1xuICAjY29ubmVjdGlvbnM6IERlbm8uQ29ubltdID0gW107XG5cbiAgY29uc3RydWN0b3IocHVibGljIGxpc3RlbmVyOiBEZW5vLkxpc3RlbmVyKSB7fVxuXG4gIGNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuI2Nsb3NpbmcgPSB0cnVlO1xuICAgIHRoaXMubGlzdGVuZXIuY2xvc2UoKTtcbiAgICBmb3IgKGNvbnN0IGNvbm4gb2YgdGhpcy4jY29ubmVjdGlvbnMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbm4uY2xvc2UoKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gQ29ubmVjdGlvbiBtaWdodCBoYXZlIGJlZW4gYWxyZWFkeSBjbG9zZWRcbiAgICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLkJhZFJlc291cmNlKSkge1xuICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBZaWVsZHMgYWxsIEhUVFAgcmVxdWVzdHMgb24gYSBzaW5nbGUgVENQIGNvbm5lY3Rpb24uXG4gIHByaXZhdGUgYXN5bmMgKml0ZXJhdGVIdHRwUmVxdWVzdHMoXG4gICAgY29ubjogRGVuby5Db25uLFxuICApOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8U2VydmVyUmVxdWVzdD4ge1xuICAgIGNvbnN0IHJlYWRlciA9IG5ldyBCdWZSZWFkZXIoY29ubik7XG4gICAgY29uc3Qgd3JpdGVyID0gbmV3IEJ1ZldyaXRlcihjb25uKTtcblxuICAgIHdoaWxlICghdGhpcy4jY2xvc2luZykge1xuICAgICAgbGV0IHJlcXVlc3Q6IFNlcnZlclJlcXVlc3QgfCBudWxsO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVxdWVzdCA9IGF3YWl0IHJlYWRSZXF1ZXN0KGNvbm4sIHJlYWRlcik7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5JbnZhbGlkRGF0YSB8fFxuICAgICAgICAgIGVycm9yIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuVW5leHBlY3RlZEVvZlxuICAgICAgICApIHtcbiAgICAgICAgICAvLyBBbiBlcnJvciB3YXMgdGhyb3duIHdoaWxlIHBhcnNpbmcgcmVxdWVzdCBoZWFkZXJzLlxuICAgICAgICAgIC8vIFRyeSB0byBzZW5kIHRoZSBcIjQwMCBCYWQgUmVxdWVzdFwiIGJlZm9yZSBjbG9zaW5nIHRoZSBjb25uZWN0aW9uLlxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB3cml0ZVJlc3BvbnNlKHdyaXRlciwge1xuICAgICAgICAgICAgICBzdGF0dXM6IDQwMCxcbiAgICAgICAgICAgICAgYm9keTogbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKGAke2Vycm9yLm1lc3NhZ2V9XFxyXFxuXFxyXFxuYCksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIC8vIFRoZSBjb25uZWN0aW9uIGlzIGJyb2tlbi5cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAocmVxdWVzdCA9PT0gbnVsbCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgcmVxdWVzdC53ID0gd3JpdGVyO1xuICAgICAgeWllbGQgcmVxdWVzdDtcblxuICAgICAgLy8gV2FpdCBmb3IgdGhlIHJlcXVlc3QgdG8gYmUgcHJvY2Vzc2VkIGJlZm9yZSB3ZSBhY2NlcHQgYSBuZXcgcmVxdWVzdCBvblxuICAgICAgLy8gdGhpcyBjb25uZWN0aW9uLlxuICAgICAgY29uc3QgcmVzcG9uc2VFcnJvciA9IGF3YWl0IHJlcXVlc3QuZG9uZTtcbiAgICAgIGlmIChyZXNwb25zZUVycm9yKSB7XG4gICAgICAgIC8vIFNvbWV0aGluZyBiYWQgaGFwcGVuZWQgZHVyaW5nIHJlc3BvbnNlLlxuICAgICAgICAvLyAobGlrZWx5IG90aGVyIHNpZGUgY2xvc2VkIGR1cmluZyBwaXBlbGluZWQgcmVxKVxuICAgICAgICAvLyByZXEuZG9uZSBpbXBsaWVzIHRoaXMgY29ubmVjdGlvbiBhbHJlYWR5IGNsb3NlZCwgc28gd2UgY2FuIGp1c3QgcmV0dXJuLlxuICAgICAgICB0aGlzLnVudHJhY2tDb25uZWN0aW9uKHJlcXVlc3QuY29ubik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gQ29uc3VtZSB1bnJlYWQgYm9keSBhbmQgdHJhaWxlcnMgaWYgcmVjZWl2ZXIgZGlkbid0IGNvbnN1bWUgdGhvc2UgZGF0YVxuICAgICAgICBhd2FpdCByZXF1ZXN0LmZpbmFsaXplKCk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gSW52YWxpZCBkYXRhIHdhcyByZWNlaXZlZCBvciB0aGUgY29ubmVjdGlvbiB3YXMgY2xvc2VkLlxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnVudHJhY2tDb25uZWN0aW9uKGNvbm4pO1xuICAgIHRyeSB7XG4gICAgICBjb25uLmNsb3NlKCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBtaWdodCBoYXZlIGJlZW4gYWxyZWFkeSBjbG9zZWRcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHRyYWNrQ29ubmVjdGlvbihjb25uOiBEZW5vLkNvbm4pOiB2b2lkIHtcbiAgICB0aGlzLiNjb25uZWN0aW9ucy5wdXNoKGNvbm4pO1xuICB9XG5cbiAgcHJpdmF0ZSB1bnRyYWNrQ29ubmVjdGlvbihjb25uOiBEZW5vLkNvbm4pOiB2b2lkIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMuI2Nvbm5lY3Rpb25zLmluZGV4T2YoY29ubik7XG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgdGhpcy4jY29ubmVjdGlvbnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gIH1cblxuICAvLyBBY2NlcHRzIGEgbmV3IFRDUCBjb25uZWN0aW9uIGFuZCB5aWVsZHMgYWxsIEhUVFAgcmVxdWVzdHMgdGhhdCBhcnJpdmUgb25cbiAgLy8gaXQuIFdoZW4gYSBjb25uZWN0aW9uIGlzIGFjY2VwdGVkLCBpdCBhbHNvIGNyZWF0ZXMgYSBuZXcgaXRlcmF0b3Igb2YgdGhlXG4gIC8vIHNhbWUga2luZCBhbmQgYWRkcyBpdCB0byB0aGUgcmVxdWVzdCBtdWx0aXBsZXhlciBzbyB0aGF0IGFub3RoZXIgVENQXG4gIC8vIGNvbm5lY3Rpb24gY2FuIGJlIGFjY2VwdGVkLlxuICBwcml2YXRlIGFzeW5jICphY2NlcHRDb25uQW5kSXRlcmF0ZUh0dHBSZXF1ZXN0cyhcbiAgICBtdXg6IE11eEFzeW5jSXRlcmF0b3I8U2VydmVyUmVxdWVzdD4sXG4gICk6IEFzeW5jSXRlcmFibGVJdGVyYXRvcjxTZXJ2ZXJSZXF1ZXN0PiB7XG4gICAgaWYgKHRoaXMuI2Nsb3NpbmcpIHJldHVybjtcbiAgICAvLyBXYWl0IGZvciBhIG5ldyBjb25uZWN0aW9uLlxuICAgIGxldCBjb25uOiBEZW5vLkNvbm47XG4gICAgdHJ5IHtcbiAgICAgIGNvbm4gPSBhd2FpdCB0aGlzLmxpc3RlbmVyLmFjY2VwdCgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoXG4gICAgICAgIC8vIFRoZSBsaXN0ZW5lciBpcyBjbG9zZWQ6XG4gICAgICAgIGVycm9yIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuQmFkUmVzb3VyY2UgfHxcbiAgICAgICAgLy8gVExTIGhhbmRzaGFrZSBlcnJvcnM6XG4gICAgICAgIGVycm9yIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuSW52YWxpZERhdGEgfHxcbiAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5VbmV4cGVjdGVkRW9mIHx8XG4gICAgICAgIGVycm9yIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuQ29ubmVjdGlvblJlc2V0XG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIG11eC5hZGQodGhpcy5hY2NlcHRDb25uQW5kSXRlcmF0ZUh0dHBSZXF1ZXN0cyhtdXgpKTtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgICB0aGlzLnRyYWNrQ29ubmVjdGlvbihjb25uKTtcbiAgICAvLyBUcnkgdG8gYWNjZXB0IGFub3RoZXIgY29ubmVjdGlvbiBhbmQgYWRkIGl0IHRvIHRoZSBtdWx0aXBsZXhlci5cbiAgICBtdXguYWRkKHRoaXMuYWNjZXB0Q29ubkFuZEl0ZXJhdGVIdHRwUmVxdWVzdHMobXV4KSk7XG4gICAgLy8gWWllbGQgdGhlIHJlcXVlc3RzIHRoYXQgYXJyaXZlIG9uIHRoZSBqdXN0LWFjY2VwdGVkIGNvbm5lY3Rpb24uXG4gICAgeWllbGQqIHRoaXMuaXRlcmF0ZUh0dHBSZXF1ZXN0cyhjb25uKTtcbiAgfVxuXG4gIFtTeW1ib2wuYXN5bmNJdGVyYXRvcl0oKTogQXN5bmNJdGVyYWJsZUl0ZXJhdG9yPFNlcnZlclJlcXVlc3Q+IHtcbiAgICBjb25zdCBtdXg6IE11eEFzeW5jSXRlcmF0b3I8U2VydmVyUmVxdWVzdD4gPSBuZXcgTXV4QXN5bmNJdGVyYXRvcigpO1xuICAgIG11eC5hZGQodGhpcy5hY2NlcHRDb25uQW5kSXRlcmF0ZUh0dHBSZXF1ZXN0cyhtdXgpKTtcbiAgICByZXR1cm4gbXV4Lml0ZXJhdGUoKTtcbiAgfVxufVxuXG4vKiogT3B0aW9ucyBmb3IgY3JlYXRpbmcgYW4gSFRUUCBzZXJ2ZXIuICovXG5leHBvcnQgdHlwZSBIVFRQT3B0aW9ucyA9IE9taXQ8RGVuby5MaXN0ZW5PcHRpb25zLCBcInRyYW5zcG9ydFwiPjtcblxuLyoqXG4gKiBQYXJzZSBhZGRyIGZyb20gc3RyaW5nXG4gKlxuICogICAgIGNvbnN0IGFkZHIgPSBcIjo6MTo4MDAwXCI7XG4gKiAgICAgcGFyc2VBZGRyRnJvbVN0cmluZyhhZGRyKTtcbiAqXG4gKiBAcGFyYW0gYWRkciBBZGRyZXNzIHN0cmluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gX3BhcnNlQWRkckZyb21TdHIoYWRkcjogc3RyaW5nKTogSFRUUE9wdGlvbnMge1xuICBsZXQgdXJsOiBVUkw7XG4gIHRyeSB7XG4gICAgY29uc3QgaG9zdCA9IGFkZHIuc3RhcnRzV2l0aChcIjpcIikgPyBgMC4wLjAuMCR7YWRkcn1gIDogYWRkcjtcbiAgICB1cmwgPSBuZXcgVVJMKGBodHRwOi8vJHtob3N0fWApO1xuICB9IGNhdGNoIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBhZGRyZXNzLlwiKTtcbiAgfVxuICBpZiAoXG4gICAgdXJsLnVzZXJuYW1lIHx8XG4gICAgdXJsLnBhc3N3b3JkIHx8XG4gICAgdXJsLnBhdGhuYW1lICE9IFwiL1wiIHx8XG4gICAgdXJsLnNlYXJjaCB8fFxuICAgIHVybC5oYXNoXG4gICkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIGFkZHJlc3MuXCIpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBob3N0bmFtZTogdXJsLmhvc3RuYW1lLFxuICAgIHBvcnQ6IHVybC5wb3J0ID09PSBcIlwiID8gODAgOiBOdW1iZXIodXJsLnBvcnQpLFxuICB9O1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIEhUVFAgc2VydmVyXG4gKlxuICogICAgIGltcG9ydCB7IHNlcnZlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZC9odHRwL3NlcnZlci50c1wiO1xuICogICAgIGNvbnN0IGJvZHkgPSBcIkhlbGxvIFdvcmxkXFxuXCI7XG4gKiAgICAgY29uc3Qgc2VydmVyID0gc2VydmUoeyBwb3J0OiA4MDAwIH0pO1xuICogICAgIGZvciBhd2FpdCAoY29uc3QgcmVxIG9mIHNlcnZlcikge1xuICogICAgICAgcmVxLnJlc3BvbmQoeyBib2R5IH0pO1xuICogICAgIH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNlcnZlKGFkZHI6IHN0cmluZyB8IEhUVFBPcHRpb25zKTogU2VydmVyIHtcbiAgaWYgKHR5cGVvZiBhZGRyID09PSBcInN0cmluZ1wiKSB7XG4gICAgYWRkciA9IF9wYXJzZUFkZHJGcm9tU3RyKGFkZHIpO1xuICB9XG5cbiAgY29uc3QgbGlzdGVuZXIgPSBEZW5vLmxpc3RlbihhZGRyKTtcbiAgcmV0dXJuIG5ldyBTZXJ2ZXIobGlzdGVuZXIpO1xufVxuXG4vKipcbiAqIFN0YXJ0IGFuIEhUVFAgc2VydmVyIHdpdGggZ2l2ZW4gb3B0aW9ucyBhbmQgcmVxdWVzdCBoYW5kbGVyXG4gKlxuICogICAgIGNvbnN0IGJvZHkgPSBcIkhlbGxvIFdvcmxkXFxuXCI7XG4gKiAgICAgY29uc3Qgb3B0aW9ucyA9IHsgcG9ydDogODAwMCB9O1xuICogICAgIGxpc3RlbkFuZFNlcnZlKG9wdGlvbnMsIChyZXEpID0+IHtcbiAqICAgICAgIHJlcS5yZXNwb25kKHsgYm9keSB9KTtcbiAqICAgICB9KTtcbiAqXG4gKiBAcGFyYW0gb3B0aW9ucyBTZXJ2ZXIgY29uZmlndXJhdGlvblxuICogQHBhcmFtIGhhbmRsZXIgUmVxdWVzdCBoYW5kbGVyXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsaXN0ZW5BbmRTZXJ2ZShcbiAgYWRkcjogc3RyaW5nIHwgSFRUUE9wdGlvbnMsXG4gIGhhbmRsZXI6IChyZXE6IFNlcnZlclJlcXVlc3QpID0+IHZvaWQsXG4pIHtcbiAgY29uc3Qgc2VydmVyID0gc2VydmUoYWRkcik7XG5cbiAgZm9yIGF3YWl0IChjb25zdCByZXF1ZXN0IG9mIHNlcnZlcikge1xuICAgIGhhbmRsZXIocmVxdWVzdCk7XG4gIH1cbn1cblxuLyoqIE9wdGlvbnMgZm9yIGNyZWF0aW5nIGFuIEhUVFBTIHNlcnZlci4gKi9cbmV4cG9ydCB0eXBlIEhUVFBTT3B0aW9ucyA9IE9taXQ8RGVuby5MaXN0ZW5UbHNPcHRpb25zLCBcInRyYW5zcG9ydFwiPjtcblxuLyoqXG4gKiBDcmVhdGUgYW4gSFRUUFMgc2VydmVyIHdpdGggZ2l2ZW4gb3B0aW9uc1xuICpcbiAqICAgICBjb25zdCBib2R5ID0gXCJIZWxsbyBIVFRQU1wiO1xuICogICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gKiAgICAgICBob3N0bmFtZTogXCJsb2NhbGhvc3RcIixcbiAqICAgICAgIHBvcnQ6IDQ0MyxcbiAqICAgICAgIGNlcnRGaWxlOiBcIi4vcGF0aC90by9sb2NhbGhvc3QuY3J0XCIsXG4gKiAgICAgICBrZXlGaWxlOiBcIi4vcGF0aC90by9sb2NhbGhvc3Qua2V5XCIsXG4gKiAgICAgfTtcbiAqICAgICBmb3IgYXdhaXQgKGNvbnN0IHJlcSBvZiBzZXJ2ZVRMUyhvcHRpb25zKSkge1xuICogICAgICAgcmVxLnJlc3BvbmQoeyBib2R5IH0pO1xuICogICAgIH1cbiAqXG4gKiBAcGFyYW0gb3B0aW9ucyBTZXJ2ZXIgY29uZmlndXJhdGlvblxuICogQHJldHVybiBBc3luYyBpdGVyYWJsZSBzZXJ2ZXIgaW5zdGFuY2UgZm9yIGluY29taW5nIHJlcXVlc3RzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXJ2ZVRMUyhvcHRpb25zOiBIVFRQU09wdGlvbnMpOiBTZXJ2ZXIge1xuICBjb25zdCB0bHNPcHRpb25zOiBEZW5vLkxpc3RlblRsc09wdGlvbnMgPSB7XG4gICAgLi4ub3B0aW9ucyxcbiAgICB0cmFuc3BvcnQ6IFwidGNwXCIsXG4gIH07XG4gIGNvbnN0IGxpc3RlbmVyID0gRGVuby5saXN0ZW5UbHModGxzT3B0aW9ucyk7XG4gIHJldHVybiBuZXcgU2VydmVyKGxpc3RlbmVyKTtcbn1cblxuLyoqXG4gKiBTdGFydCBhbiBIVFRQUyBzZXJ2ZXIgd2l0aCBnaXZlbiBvcHRpb25zIGFuZCByZXF1ZXN0IGhhbmRsZXJcbiAqXG4gKiAgICAgY29uc3QgYm9keSA9IFwiSGVsbG8gSFRUUFNcIjtcbiAqICAgICBjb25zdCBvcHRpb25zID0ge1xuICogICAgICAgaG9zdG5hbWU6IFwibG9jYWxob3N0XCIsXG4gKiAgICAgICBwb3J0OiA0NDMsXG4gKiAgICAgICBjZXJ0RmlsZTogXCIuL3BhdGgvdG8vbG9jYWxob3N0LmNydFwiLFxuICogICAgICAga2V5RmlsZTogXCIuL3BhdGgvdG8vbG9jYWxob3N0LmtleVwiLFxuICogICAgIH07XG4gKiAgICAgbGlzdGVuQW5kU2VydmVUTFMob3B0aW9ucywgKHJlcSkgPT4ge1xuICogICAgICAgcmVxLnJlc3BvbmQoeyBib2R5IH0pO1xuICogICAgIH0pO1xuICpcbiAqIEBwYXJhbSBvcHRpb25zIFNlcnZlciBjb25maWd1cmF0aW9uXG4gKiBAcGFyYW0gaGFuZGxlciBSZXF1ZXN0IGhhbmRsZXJcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxpc3RlbkFuZFNlcnZlVExTKFxuICBvcHRpb25zOiBIVFRQU09wdGlvbnMsXG4gIGhhbmRsZXI6IChyZXE6IFNlcnZlclJlcXVlc3QpID0+IHZvaWQsXG4pIHtcbiAgY29uc3Qgc2VydmVyID0gc2VydmVUTFMob3B0aW9ucyk7XG5cbiAgZm9yIGF3YWl0IChjb25zdCByZXF1ZXN0IG9mIHNlcnZlcikge1xuICAgIGhhbmRsZXIocmVxdWVzdCk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnRlcmZhY2Ugb2YgSFRUUCBzZXJ2ZXIgcmVzcG9uc2UuXG4gKiBJZiBib2R5IGlzIGEgUmVhZGVyLCByZXNwb25zZSB3b3VsZCBiZSBjaHVua2VkLlxuICogSWYgYm9keSBpcyBhIHN0cmluZywgaXQgd291bGQgYmUgVVRGLTggZW5jb2RlZCBieSBkZWZhdWx0LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlc3BvbnNlIHtcbiAgc3RhdHVzPzogbnVtYmVyO1xuICBoZWFkZXJzPzogSGVhZGVycztcbiAgYm9keT86IFVpbnQ4QXJyYXkgfCBEZW5vLlJlYWRlciB8IHN0cmluZztcbiAgdHJhaWxlcnM/OiAoKSA9PiBQcm9taXNlPEhlYWRlcnM+IHwgSGVhZGVycztcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUEwRSxBQUExRSx3RUFBMEU7U0FDakUsU0FBUyxFQUFFLFNBQVMsU0FBUSxjQUFnQjtTQUM1QyxNQUFNLFNBQVEsa0JBQW9CO1NBQ3hCLFFBQVEsRUFBRSxnQkFBZ0IsU0FBUSxlQUFpQjtTQUVwRSxVQUFVLEVBQ1YsaUJBQWlCLEVBQ2pCLFdBQVcsRUFDWCxXQUFXLEVBQ1gsYUFBYSxTQUNSLFFBQVU7YUFDSixhQUFhO0lBQ3hCLEdBQUc7SUFDSCxNQUFNO0lBQ04sS0FBSztJQUNMLFVBQVU7SUFDVixVQUFVO0lBQ1YsT0FBTztJQUNQLElBQUk7SUFDSixDQUFDO0lB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