import * as hex from "../encoding/hex.ts";
import * as base64 from "../encoding/base64.ts";
import { notImplemented, normalizeEncoding } from "./_utils.ts";
const notImplementedEncodings = [
    "ascii",
    "binary",
    "latin1",
    "ucs2",
    "utf16le", 
];
function checkEncoding(encoding = "utf8", strict = true) {
    if (typeof encoding !== "string" || strict && encoding === "") {
        if (!strict) return "utf8";
        throw new TypeError(`Unkown encoding: ${encoding}`);
    }
    const normalized = normalizeEncoding(encoding);
    if (normalized === undefined) {
        throw new TypeError(`Unkown encoding: ${encoding}`);
    }
    if (notImplementedEncodings.includes(encoding)) {
        notImplemented(`"${encoding}" encoding`);
    }
    return normalized;
}
// https://github.com/nodejs/node/blob/56dbe466fdbc598baea3bfce289bf52b97b8b8f7/lib/buffer.js#L598
const encodingOps = {
    utf8: {
        byteLength: (string)=>new TextEncoder().encode(string).byteLength
    },
    ucs2: {
        byteLength: (string)=>string.length * 2
    },
    utf16le: {
        byteLength: (string)=>string.length * 2
    },
    latin1: {
        byteLength: (string)=>string.length
    },
    ascii: {
        byteLength: (string)=>string.length
    },
    base64: {
        byteLength: (string)=>base64ByteLength(string, string.length)
    },
    hex: {
        byteLength: (string)=>string.length >>> 1
    }
};
function base64ByteLength(str, bytes) {
    // Handle padding
    if (str.charCodeAt(bytes - 1) === 61) bytes--;
    if (bytes > 1 && str.charCodeAt(bytes - 1) === 61) bytes--;
    // Base64 ratio: 3/4
    return bytes * 3 >>> 2;
}
class Buffer extends Uint8Array {
    /**
   * Allocates a new Buffer of size bytes.
   */ static alloc(size, fill, encoding = "utf8") {
        if (typeof size !== "number") {
            throw new TypeError(`The "size" argument must be of type number. Received type ${typeof size}`);
        }
        const buf = new Buffer(size);
        if (size === 0) return buf;
        let bufFill;
        if (typeof fill === "string") {
            encoding = checkEncoding(encoding);
            if (typeof fill === "string" && fill.length === 1 && encoding === "utf8") {
                buf.fill(fill.charCodeAt(0));
            } else bufFill = Buffer.from(fill, encoding);
        } else if (typeof fill === "number") {
            buf.fill(fill);
        } else if (fill instanceof Uint8Array) {
            if (fill.length === 0) {
                throw new TypeError(`The argument "value" is invalid. Received ${fill.constructor.name} []`);
            }
            bufFill = fill;
        }
        if (bufFill) {
            if (bufFill.length > buf.length) {
                bufFill = bufFill.subarray(0, buf.length);
            }
            let offset = 0;
            while(offset < size){
                buf.set(bufFill, offset);
                offset += bufFill.length;
                if (offset + bufFill.length >= size) break;
            }
            if (offset !== size) {
                buf.set(bufFill.subarray(0, size - offset), offset);
            }
        }
        return buf;
    }
    static allocUnsafe(size) {
        return new Buffer(size);
    }
    /**
   * Returns the byte length of a string when encoded. This is not the same as
   * String.prototype.length, which does not account for the encoding that is
   * used to convert the string into bytes.
   */ static byteLength(string, encoding = "utf8") {
        if (typeof string != "string") return string.byteLength;
        encoding = normalizeEncoding(encoding) || "utf8";
        return encodingOps[encoding].byteLength(string);
    }
    /**
   * Returns a new Buffer which is the result of concatenating all the Buffer
   * instances in the list together.
   */ static concat(list, totalLength) {
        if (totalLength == undefined) {
            totalLength = 0;
            for (const buf of list){
                totalLength += buf.length;
            }
        }
        const buffer = new Buffer(totalLength);
        let pos = 0;
        for (const buf of list){
            buffer.set(buf, pos);
            pos += buf.length;
        }
        return buffer;
    }
    static from(// eslint-disable-next-line @typescript-eslint/no-explicit-any
    value, offsetOrEncoding, length) {
        const offset = typeof offsetOrEncoding === "string" ? undefined : offsetOrEncoding;
        let encoding = typeof offsetOrEncoding === "string" ? offsetOrEncoding : undefined;
        if (typeof value == "string") {
            encoding = checkEncoding(encoding, false);
            if (encoding === "hex") return new Buffer(hex.decodeString(value).buffer);
            if (encoding === "base64") return new Buffer(base64.decode(value));
            return new Buffer(new TextEncoder().encode(value).buffer);
        }
        // workaround for https://github.com/microsoft/TypeScript/issues/38446
        return new Buffer(value, offset, length);
    }
    /**
   * Returns true if obj is a Buffer, false otherwise.
   */ static isBuffer(obj) {
        return obj instanceof Buffer;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static isEncoding(encoding) {
        return typeof encoding === "string" && encoding.length !== 0 && normalizeEncoding(encoding) !== undefined;
    }
    /**
   * Copies data from a region of buf to a region in target, even if the target
   * memory region overlaps with buf.
   */ copy(targetBuffer, targetStart = 0, sourceStart = 0, sourceEnd = this.length) {
        const sourceBuffer = this.subarray(sourceStart, sourceEnd);
        targetBuffer.set(sourceBuffer, targetStart);
        return sourceBuffer.length;
    }
    /*
   * Returns true if both buf and otherBuffer have exactly the same bytes, false otherwise.
   */ equals(otherBuffer) {
        if (!(otherBuffer instanceof Uint8Array)) {
            throw new TypeError(`The "otherBuffer" argument must be an instance of Buffer or Uint8Array. Received type ${typeof otherBuffer}`);
        }
        if (this === otherBuffer) return true;
        if (this.byteLength !== otherBuffer.byteLength) return false;
        for(let i = 0; i < this.length; i++){
            if (this[i] !== otherBuffer[i]) return false;
        }
        return true;
    }
    readBigInt64BE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getBigInt64(offset);
    }
    readBigInt64LE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getBigInt64(offset, true);
    }
    readBigUInt64BE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getBigUint64(offset);
    }
    readBigUInt64LE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getBigUint64(offset, true);
    }
    readDoubleBE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat64(offset);
    }
    readDoubleLE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat64(offset, true);
    }
    readFloatBE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat32(offset);
    }
    readFloatLE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat32(offset, true);
    }
    readInt8(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt8(offset);
    }
    readInt16BE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt16(offset);
    }
    readInt16LE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt16(offset, true);
    }
    readInt32BE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt32(offset);
    }
    readInt32LE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt32(offset, true);
    }
    readUInt8(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint8(offset);
    }
    readUInt16BE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint16(offset);
    }
    readUInt16LE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint16(offset, true);
    }
    readUInt32BE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint32(offset);
    }
    readUInt32LE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint32(offset, true);
    }
    /**
   * Returns a new Buffer that references the same memory as the original, but
   * offset and cropped by the start and end indices.
   */ slice(begin = 0, end = this.length) {
        // workaround for https://github.com/microsoft/TypeScript/issues/38665
        return this.subarray(begin, end);
    }
    /**
   * Returns a JSON representation of buf. JSON.stringify() implicitly calls
   * this function when stringifying a Buffer instance.
   */ toJSON() {
        return {
            type: "Buffer",
            data: Array.from(this)
        };
    }
    /**
   * Decodes buf to a string according to the specified character encoding in
   * encoding. start and end may be passed to decode only a subset of buf.
   */ toString(encoding = "utf8", start = 0, end = this.length) {
        encoding = checkEncoding(encoding);
        const b = this.subarray(start, end);
        if (encoding === "hex") return hex.encodeToString(b);
        if (encoding === "base64") return base64.encode(b.buffer);
        return new TextDecoder(encoding).decode(b);
    }
    /**
   * Writes string to buf at offset according to the character encoding in
   * encoding. The length parameter is the number of bytes to write. If buf did
   * not contain enough space to fit the entire string, only part of string will
   * be written. However, partially encoded characters will not be written.
   */ write(string, offset = 0, length = this.length) {
        return new TextEncoder().encodeInto(string, this.subarray(offset, offset + length)).written;
    }
    writeBigInt64BE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setBigInt64(offset, value);
        return offset + 4;
    }
    writeBigInt64LE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setBigInt64(offset, value, true);
        return offset + 4;
    }
    writeBigUInt64BE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setBigUint64(offset, value);
        return offset + 4;
    }
    writeBigUInt64LE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setBigUint64(offset, value, true);
        return offset + 4;
    }
    writeDoubleBE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat64(offset, value);
        return offset + 8;
    }
    writeDoubleLE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat64(offset, value, true);
        return offset + 8;
    }
    writeFloatBE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat32(offset, value);
        return offset + 4;
    }
    writeFloatLE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat32(offset, value, true);
        return offset + 4;
    }
    writeInt8(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setInt8(offset, value);
        return offset + 1;
    }
    writeInt16BE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setInt16(offset, value);
        return offset + 2;
    }
    writeInt16LE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setInt16(offset, value, true);
        return offset + 2;
    }
    writeInt32BE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setUint32(offset, value);
        return offset + 4;
    }
    writeInt32LE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setInt32(offset, value, true);
        return offset + 4;
    }
    writeUInt8(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setUint8(offset, value);
        return offset + 1;
    }
    writeUInt16BE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setUint16(offset, value);
        return offset + 2;
    }
    writeUInt16LE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setUint16(offset, value, true);
        return offset + 2;
    }
    writeUInt32BE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setUint32(offset, value);
        return offset + 4;
    }
    writeUInt32LE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setUint32(offset, value, true);
        return offset + 4;
    }
}
/**
 * See also https://nodejs.org/api/buffer.html
 */ export { Buffer as default };
export { Buffer };
Object.defineProperty(globalThis, "Buffer", {
    value: Buffer,
    enumerable: false,
    writable: true,
    configurable: true
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC42Ni4wL25vZGUvYnVmZmVyLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBoZXggZnJvbSBcIi4uL2VuY29kaW5nL2hleC50c1wiO1xuaW1wb3J0ICogYXMgYmFzZTY0IGZyb20gXCIuLi9lbmNvZGluZy9iYXNlNjQudHNcIjtcbmltcG9ydCB7IG5vdEltcGxlbWVudGVkLCBub3JtYWxpemVFbmNvZGluZyB9IGZyb20gXCIuL191dGlscy50c1wiO1xuXG5jb25zdCBub3RJbXBsZW1lbnRlZEVuY29kaW5ncyA9IFtcbiAgXCJhc2NpaVwiLFxuICBcImJpbmFyeVwiLFxuICBcImxhdGluMVwiLFxuICBcInVjczJcIixcbiAgXCJ1dGYxNmxlXCIsXG5dO1xuXG5mdW5jdGlvbiBjaGVja0VuY29kaW5nKGVuY29kaW5nID0gXCJ1dGY4XCIsIHN0cmljdCA9IHRydWUpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIGVuY29kaW5nICE9PSBcInN0cmluZ1wiIHx8IChzdHJpY3QgJiYgZW5jb2RpbmcgPT09IFwiXCIpKSB7XG4gICAgaWYgKCFzdHJpY3QpIHJldHVybiBcInV0ZjhcIjtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBVbmtvd24gZW5jb2Rpbmc6ICR7ZW5jb2Rpbmd9YCk7XG4gIH1cblxuICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplRW5jb2RpbmcoZW5jb2RpbmcpO1xuXG4gIGlmIChub3JtYWxpemVkID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBVbmtvd24gZW5jb2Rpbmc6ICR7ZW5jb2Rpbmd9YCk7XG4gIH1cblxuICBpZiAobm90SW1wbGVtZW50ZWRFbmNvZGluZ3MuaW5jbHVkZXMoZW5jb2RpbmcpKSB7XG4gICAgbm90SW1wbGVtZW50ZWQoYFwiJHtlbmNvZGluZ31cIiBlbmNvZGluZ2ApO1xuICB9XG5cbiAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG59XG5cbmludGVyZmFjZSBFbmNvZGluZ09wIHtcbiAgYnl0ZUxlbmd0aChzdHJpbmc6IHN0cmluZyk6IG51bWJlcjtcbn1cblxuLy8gaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlL2Jsb2IvNTZkYmU0NjZmZGJjNTk4YmFlYTNiZmNlMjg5YmY1MmI5N2I4YjhmNy9saWIvYnVmZmVyLmpzI0w1OThcbmNvbnN0IGVuY29kaW5nT3BzOiB7IFtrZXk6IHN0cmluZ106IEVuY29kaW5nT3AgfSA9IHtcbiAgdXRmODoge1xuICAgIGJ5dGVMZW5ndGg6IChzdHJpbmc6IHN0cmluZyk6IG51bWJlciA9PlxuICAgICAgbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHN0cmluZykuYnl0ZUxlbmd0aCxcbiAgfSxcbiAgdWNzMjoge1xuICAgIGJ5dGVMZW5ndGg6IChzdHJpbmc6IHN0cmluZyk6IG51bWJlciA9PiBzdHJpbmcubGVuZ3RoICogMixcbiAgfSxcbiAgdXRmMTZsZToge1xuICAgIGJ5dGVMZW5ndGg6IChzdHJpbmc6IHN0cmluZyk6IG51bWJlciA9PiBzdHJpbmcubGVuZ3RoICogMixcbiAgfSxcbiAgbGF0aW4xOiB7XG4gICAgYnl0ZUxlbmd0aDogKHN0cmluZzogc3RyaW5nKTogbnVtYmVyID0+IHN0cmluZy5sZW5ndGgsXG4gIH0sXG4gIGFzY2lpOiB7XG4gICAgYnl0ZUxlbmd0aDogKHN0cmluZzogc3RyaW5nKTogbnVtYmVyID0+IHN0cmluZy5sZW5ndGgsXG4gIH0sXG4gIGJhc2U2NDoge1xuICAgIGJ5dGVMZW5ndGg6IChzdHJpbmc6IHN0cmluZyk6IG51bWJlciA9PlxuICAgICAgYmFzZTY0Qnl0ZUxlbmd0aChzdHJpbmcsIHN0cmluZy5sZW5ndGgpLFxuICB9LFxuICBoZXg6IHtcbiAgICBieXRlTGVuZ3RoOiAoc3RyaW5nOiBzdHJpbmcpOiBudW1iZXIgPT4gc3RyaW5nLmxlbmd0aCA+Pj4gMSxcbiAgfSxcbn07XG5cbmZ1bmN0aW9uIGJhc2U2NEJ5dGVMZW5ndGgoc3RyOiBzdHJpbmcsIGJ5dGVzOiBudW1iZXIpOiBudW1iZXIge1xuICAvLyBIYW5kbGUgcGFkZGluZ1xuICBpZiAoc3RyLmNoYXJDb2RlQXQoYnl0ZXMgLSAxKSA9PT0gMHgzZCkgYnl0ZXMtLTtcbiAgaWYgKGJ5dGVzID4gMSAmJiBzdHIuY2hhckNvZGVBdChieXRlcyAtIDEpID09PSAweDNkKSBieXRlcy0tO1xuXG4gIC8vIEJhc2U2NCByYXRpbzogMy80XG4gIHJldHVybiAoYnl0ZXMgKiAzKSA+Pj4gMjtcbn1cblxuLyoqXG4gKiBTZWUgYWxzbyBodHRwczovL25vZGVqcy5vcmcvYXBpL2J1ZmZlci5odG1sXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJ1ZmZlciBleHRlbmRzIFVpbnQ4QXJyYXkge1xuICAvKipcbiAgICogQWxsb2NhdGVzIGEgbmV3IEJ1ZmZlciBvZiBzaXplIGJ5dGVzLlxuICAgKi9cbiAgc3RhdGljIGFsbG9jKFxuICAgIHNpemU6IG51bWJlcixcbiAgICBmaWxsPzogbnVtYmVyIHwgc3RyaW5nIHwgVWludDhBcnJheSB8IEJ1ZmZlcixcbiAgICBlbmNvZGluZyA9IFwidXRmOFwiLFxuICApOiBCdWZmZXIge1xuICAgIGlmICh0eXBlb2Ygc2l6ZSAhPT0gXCJudW1iZXJcIikge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgYFRoZSBcInNpemVcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgbnVtYmVyLiBSZWNlaXZlZCB0eXBlICR7dHlwZW9mIHNpemV9YCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgYnVmID0gbmV3IEJ1ZmZlcihzaXplKTtcbiAgICBpZiAoc2l6ZSA9PT0gMCkgcmV0dXJuIGJ1ZjtcblxuICAgIGxldCBidWZGaWxsO1xuICAgIGlmICh0eXBlb2YgZmlsbCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgZW5jb2RpbmcgPSBjaGVja0VuY29kaW5nKGVuY29kaW5nKTtcbiAgICAgIGlmIChcbiAgICAgICAgdHlwZW9mIGZpbGwgPT09IFwic3RyaW5nXCIgJiYgZmlsbC5sZW5ndGggPT09IDEgJiYgZW5jb2RpbmcgPT09IFwidXRmOFwiXG4gICAgICApIHtcbiAgICAgICAgYnVmLmZpbGwoZmlsbC5jaGFyQ29kZUF0KDApKTtcbiAgICAgIH0gZWxzZSBidWZGaWxsID0gQnVmZmVyLmZyb20oZmlsbCwgZW5jb2RpbmcpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGZpbGwgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgIGJ1Zi5maWxsKGZpbGwpO1xuICAgIH0gZWxzZSBpZiAoZmlsbCBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICAgIGlmIChmaWxsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgIGBUaGUgYXJndW1lbnQgXCJ2YWx1ZVwiIGlzIGludmFsaWQuIFJlY2VpdmVkICR7ZmlsbC5jb25zdHJ1Y3Rvci5uYW1lfSBbXWAsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGJ1ZkZpbGwgPSBmaWxsO1xuICAgIH1cblxuICAgIGlmIChidWZGaWxsKSB7XG4gICAgICBpZiAoYnVmRmlsbC5sZW5ndGggPiBidWYubGVuZ3RoKSB7XG4gICAgICAgIGJ1ZkZpbGwgPSBidWZGaWxsLnN1YmFycmF5KDAsIGJ1Zi5sZW5ndGgpO1xuICAgICAgfVxuXG4gICAgICBsZXQgb2Zmc2V0ID0gMDtcbiAgICAgIHdoaWxlIChvZmZzZXQgPCBzaXplKSB7XG4gICAgICAgIGJ1Zi5zZXQoYnVmRmlsbCwgb2Zmc2V0KTtcbiAgICAgICAgb2Zmc2V0ICs9IGJ1ZkZpbGwubGVuZ3RoO1xuICAgICAgICBpZiAob2Zmc2V0ICsgYnVmRmlsbC5sZW5ndGggPj0gc2l6ZSkgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAob2Zmc2V0ICE9PSBzaXplKSB7XG4gICAgICAgIGJ1Zi5zZXQoYnVmRmlsbC5zdWJhcnJheSgwLCBzaXplIC0gb2Zmc2V0KSwgb2Zmc2V0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYnVmO1xuICB9XG5cbiAgc3RhdGljIGFsbG9jVW5zYWZlKHNpemU6IG51bWJlcik6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoc2l6ZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYnl0ZSBsZW5ndGggb2YgYSBzdHJpbmcgd2hlbiBlbmNvZGVkLiBUaGlzIGlzIG5vdCB0aGUgc2FtZSBhc1xuICAgKiBTdHJpbmcucHJvdG90eXBlLmxlbmd0aCwgd2hpY2ggZG9lcyBub3QgYWNjb3VudCBmb3IgdGhlIGVuY29kaW5nIHRoYXQgaXNcbiAgICogdXNlZCB0byBjb252ZXJ0IHRoZSBzdHJpbmcgaW50byBieXRlcy5cbiAgICovXG4gIHN0YXRpYyBieXRlTGVuZ3RoKFxuICAgIHN0cmluZzogc3RyaW5nIHwgQnVmZmVyIHwgQXJyYXlCdWZmZXJWaWV3IHwgQXJyYXlCdWZmZXIgfCBTaGFyZWRBcnJheUJ1ZmZlcixcbiAgICBlbmNvZGluZyA9IFwidXRmOFwiLFxuICApOiBudW1iZXIge1xuICAgIGlmICh0eXBlb2Ygc3RyaW5nICE9IFwic3RyaW5nXCIpIHJldHVybiBzdHJpbmcuYnl0ZUxlbmd0aDtcblxuICAgIGVuY29kaW5nID0gbm9ybWFsaXplRW5jb2RpbmcoZW5jb2RpbmcpIHx8IFwidXRmOFwiO1xuICAgIHJldHVybiBlbmNvZGluZ09wc1tlbmNvZGluZ10uYnl0ZUxlbmd0aChzdHJpbmcpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBuZXcgQnVmZmVyIHdoaWNoIGlzIHRoZSByZXN1bHQgb2YgY29uY2F0ZW5hdGluZyBhbGwgdGhlIEJ1ZmZlclxuICAgKiBpbnN0YW5jZXMgaW4gdGhlIGxpc3QgdG9nZXRoZXIuXG4gICAqL1xuICBzdGF0aWMgY29uY2F0KGxpc3Q6IEJ1ZmZlcltdIHwgVWludDhBcnJheVtdLCB0b3RhbExlbmd0aD86IG51bWJlcik6IEJ1ZmZlciB7XG4gICAgaWYgKHRvdGFsTGVuZ3RoID09IHVuZGVmaW5lZCkge1xuICAgICAgdG90YWxMZW5ndGggPSAwO1xuICAgICAgZm9yIChjb25zdCBidWYgb2YgbGlzdCkge1xuICAgICAgICB0b3RhbExlbmd0aCArPSBidWYubGVuZ3RoO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBCdWZmZXIodG90YWxMZW5ndGgpO1xuICAgIGxldCBwb3MgPSAwO1xuICAgIGZvciAoY29uc3QgYnVmIG9mIGxpc3QpIHtcbiAgICAgIGJ1ZmZlci5zZXQoYnVmLCBwb3MpO1xuICAgICAgcG9zICs9IGJ1Zi5sZW5ndGg7XG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1ZmZlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbGxvY2F0ZXMgYSBuZXcgQnVmZmVyIHVzaW5nIGFuIGFycmF5IG9mIGJ5dGVzIGluIHRoZSByYW5nZSAwIOKAkyAyNTUuIEFycmF5XG4gICAqIGVudHJpZXMgb3V0c2lkZSB0aGF0IHJhbmdlIHdpbGwgYmUgdHJ1bmNhdGVkIHRvIGZpdCBpbnRvIGl0LlxuICAgKi9cbiAgc3RhdGljIGZyb20oYXJyYXk6IG51bWJlcltdKTogQnVmZmVyO1xuICAvKipcbiAgICogVGhpcyBjcmVhdGVzIGEgdmlldyBvZiB0aGUgQXJyYXlCdWZmZXIgd2l0aG91dCBjb3B5aW5nIHRoZSB1bmRlcmx5aW5nXG4gICAqIG1lbW9yeS4gRm9yIGV4YW1wbGUsIHdoZW4gcGFzc2VkIGEgcmVmZXJlbmNlIHRvIHRoZSAuYnVmZmVyIHByb3BlcnR5IG9mIGFcbiAgICogVHlwZWRBcnJheSBpbnN0YW5jZSwgdGhlIG5ld2x5IGNyZWF0ZWQgQnVmZmVyIHdpbGwgc2hhcmUgdGhlIHNhbWUgYWxsb2NhdGVkXG4gICAqIG1lbW9yeSBhcyB0aGUgVHlwZWRBcnJheS5cbiAgICovXG4gIHN0YXRpYyBmcm9tKFxuICAgIGFycmF5QnVmZmVyOiBBcnJheUJ1ZmZlciB8IFNoYXJlZEFycmF5QnVmZmVyLFxuICAgIGJ5dGVPZmZzZXQ/OiBudW1iZXIsXG4gICAgbGVuZ3RoPzogbnVtYmVyLFxuICApOiBCdWZmZXI7XG4gIC8qKlxuICAgKiBDb3BpZXMgdGhlIHBhc3NlZCBidWZmZXIgZGF0YSBvbnRvIGEgbmV3IEJ1ZmZlciBpbnN0YW5jZS5cbiAgICovXG4gIHN0YXRpYyBmcm9tKGJ1ZmZlcjogQnVmZmVyIHwgVWludDhBcnJheSk6IEJ1ZmZlcjtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgQnVmZmVyIGNvbnRhaW5pbmcgc3RyaW5nLlxuICAgKi9cbiAgc3RhdGljIGZyb20oc3RyaW5nOiBzdHJpbmcsIGVuY29kaW5nPzogc3RyaW5nKTogQnVmZmVyO1xuICBzdGF0aWMgZnJvbShcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgIHZhbHVlOiBhbnksXG4gICAgb2Zmc2V0T3JFbmNvZGluZz86IG51bWJlciB8IHN0cmluZyxcbiAgICBsZW5ndGg/OiBudW1iZXIsXG4gICk6IEJ1ZmZlciB7XG4gICAgY29uc3Qgb2Zmc2V0ID0gdHlwZW9mIG9mZnNldE9yRW5jb2RpbmcgPT09IFwic3RyaW5nXCJcbiAgICAgID8gdW5kZWZpbmVkXG4gICAgICA6IG9mZnNldE9yRW5jb2Rpbmc7XG4gICAgbGV0IGVuY29kaW5nID0gdHlwZW9mIG9mZnNldE9yRW5jb2RpbmcgPT09IFwic3RyaW5nXCJcbiAgICAgID8gb2Zmc2V0T3JFbmNvZGluZ1xuICAgICAgOiB1bmRlZmluZWQ7XG5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09IFwic3RyaW5nXCIpIHtcbiAgICAgIGVuY29kaW5nID0gY2hlY2tFbmNvZGluZyhlbmNvZGluZywgZmFsc2UpO1xuICAgICAgaWYgKGVuY29kaW5nID09PSBcImhleFwiKSByZXR1cm4gbmV3IEJ1ZmZlcihoZXguZGVjb2RlU3RyaW5nKHZhbHVlKS5idWZmZXIpO1xuICAgICAgaWYgKGVuY29kaW5nID09PSBcImJhc2U2NFwiKSByZXR1cm4gbmV3IEJ1ZmZlcihiYXNlNjQuZGVjb2RlKHZhbHVlKSk7XG4gICAgICByZXR1cm4gbmV3IEJ1ZmZlcihuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUodmFsdWUpLmJ1ZmZlcik7XG4gICAgfVxuXG4gICAgLy8gd29ya2Fyb3VuZCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8zODQ0NlxuICAgIHJldHVybiBuZXcgQnVmZmVyKHZhbHVlLCBvZmZzZXQhLCBsZW5ndGgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdHJ1ZSBpZiBvYmogaXMgYSBCdWZmZXIsIGZhbHNlIG90aGVyd2lzZS5cbiAgICovXG4gIHN0YXRpYyBpc0J1ZmZlcihvYmo6IG9iamVjdCk6IG9iaiBpcyBCdWZmZXIge1xuICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBCdWZmZXI7XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICBzdGF0aWMgaXNFbmNvZGluZyhlbmNvZGluZzogYW55KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChcbiAgICAgIHR5cGVvZiBlbmNvZGluZyA9PT0gXCJzdHJpbmdcIiAmJlxuICAgICAgZW5jb2RpbmcubGVuZ3RoICE9PSAwICYmXG4gICAgICBub3JtYWxpemVFbmNvZGluZyhlbmNvZGluZykgIT09IHVuZGVmaW5lZFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIGRhdGEgZnJvbSBhIHJlZ2lvbiBvZiBidWYgdG8gYSByZWdpb24gaW4gdGFyZ2V0LCBldmVuIGlmIHRoZSB0YXJnZXRcbiAgICogbWVtb3J5IHJlZ2lvbiBvdmVybGFwcyB3aXRoIGJ1Zi5cbiAgICovXG4gIGNvcHkoXG4gICAgdGFyZ2V0QnVmZmVyOiBCdWZmZXIgfCBVaW50OEFycmF5LFxuICAgIHRhcmdldFN0YXJ0ID0gMCxcbiAgICBzb3VyY2VTdGFydCA9IDAsXG4gICAgc291cmNlRW5kID0gdGhpcy5sZW5ndGgsXG4gICk6IG51bWJlciB7XG4gICAgY29uc3Qgc291cmNlQnVmZmVyID0gdGhpcy5zdWJhcnJheShzb3VyY2VTdGFydCwgc291cmNlRW5kKTtcbiAgICB0YXJnZXRCdWZmZXIuc2V0KHNvdXJjZUJ1ZmZlciwgdGFyZ2V0U3RhcnQpO1xuICAgIHJldHVybiBzb3VyY2VCdWZmZXIubGVuZ3RoO1xuICB9XG5cbiAgLypcbiAgICogUmV0dXJucyB0cnVlIGlmIGJvdGggYnVmIGFuZCBvdGhlckJ1ZmZlciBoYXZlIGV4YWN0bHkgdGhlIHNhbWUgYnl0ZXMsIGZhbHNlIG90aGVyd2lzZS5cbiAgICovXG4gIGVxdWFscyhvdGhlckJ1ZmZlcjogVWludDhBcnJheSB8IEJ1ZmZlcik6IGJvb2xlYW4ge1xuICAgIGlmICghKG90aGVyQnVmZmVyIGluc3RhbmNlb2YgVWludDhBcnJheSkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIGBUaGUgXCJvdGhlckJ1ZmZlclwiIGFyZ3VtZW50IG11c3QgYmUgYW4gaW5zdGFuY2Ugb2YgQnVmZmVyIG9yIFVpbnQ4QXJyYXkuIFJlY2VpdmVkIHR5cGUgJHt0eXBlb2Ygb3RoZXJCdWZmZXJ9YCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMgPT09IG90aGVyQnVmZmVyKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAodGhpcy5ieXRlTGVuZ3RoICE9PSBvdGhlckJ1ZmZlci5ieXRlTGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzW2ldICE9PSBvdGhlckJ1ZmZlcltpXSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmVhZEJpZ0ludDY0QkUob2Zmc2V0ID0gMCk6IGJpZ2ludCB7XG4gICAgcmV0dXJuIG5ldyBEYXRhVmlldyhcbiAgICAgIHRoaXMuYnVmZmVyLFxuICAgICAgdGhpcy5ieXRlT2Zmc2V0LFxuICAgICAgdGhpcy5ieXRlTGVuZ3RoLFxuICAgICkuZ2V0QmlnSW50NjQob2Zmc2V0KTtcbiAgfVxuICByZWFkQmlnSW50NjRMRShvZmZzZXQgPSAwKTogYmlnaW50IHtcbiAgICByZXR1cm4gbmV3IERhdGFWaWV3KFxuICAgICAgdGhpcy5idWZmZXIsXG4gICAgICB0aGlzLmJ5dGVPZmZzZXQsXG4gICAgICB0aGlzLmJ5dGVMZW5ndGgsXG4gICAgKS5nZXRCaWdJbnQ2NChvZmZzZXQsIHRydWUpO1xuICB9XG5cbiAgcmVhZEJpZ1VJbnQ2NEJFKG9mZnNldCA9IDApOiBiaWdpbnQge1xuICAgIHJldHVybiBuZXcgRGF0YVZpZXcoXG4gICAgICB0aGlzLmJ1ZmZlcixcbiAgICAgIHRoaXMuYnl0ZU9mZnNldCxcbiAgICAgIHRoaXMuYnl0ZUxlbmd0aCxcbiAgICApLmdldEJpZ1VpbnQ2NChvZmZzZXQpO1xuICB9XG4gIHJlYWRCaWdVSW50NjRMRShvZmZzZXQgPSAwKTogYmlnaW50IHtcbiAgICByZXR1cm4gbmV3IERhdGFWaWV3KFxuICAgICAgdGhpcy5idWZmZXIsXG4gICAgICB0aGlzLmJ5dGVPZmZzZXQsXG4gICAgICB0aGlzLmJ5dGVMZW5ndGgsXG4gICAgKS5nZXRCaWdVaW50NjQob2Zmc2V0LCB0cnVlKTtcbiAgfVxuXG4gIHJlYWREb3VibGVCRShvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICByZXR1cm4gbmV3IERhdGFWaWV3KFxuICAgICAgdGhpcy5idWZmZXIsXG4gICAgICB0aGlzLmJ5dGVPZmZzZXQsXG4gICAgICB0aGlzLmJ5dGVMZW5ndGgsXG4gICAgKS5nZXRGbG9hdDY0KG9mZnNldCk7XG4gIH1cbiAgcmVhZERvdWJsZUxFKG9mZnNldCA9IDApOiBudW1iZXIge1xuICAgIHJldHVybiBuZXcgRGF0YVZpZXcoXG4gICAgICB0aGlzLmJ1ZmZlcixcbiAgICAgIHRoaXMuYnl0ZU9mZnNldCxcbiAgICAgIHRoaXMuYnl0ZUxlbmd0aCxcbiAgICApLmdldEZsb2F0NjQob2Zmc2V0LCB0cnVlKTtcbiAgfVxuXG4gIHJlYWRGbG9hdEJFKG9mZnNldCA9IDApOiBudW1iZXIge1xuICAgIHJldHVybiBuZXcgRGF0YVZpZXcoXG4gICAgICB0aGlzLmJ1ZmZlcixcbiAgICAgIHRoaXMuYnl0ZU9mZnNldCxcbiAgICAgIHRoaXMuYnl0ZUxlbmd0aCxcbiAgICApLmdldEZsb2F0MzIob2Zmc2V0KTtcbiAgfVxuICByZWFkRmxvYXRMRShvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICByZXR1cm4gbmV3IERhdGFWaWV3KFxuICAgICAgdGhpcy5idWZmZXIsXG4gICAgICB0aGlzLmJ5dGVPZmZzZXQsXG4gICAgICB0aGlzLmJ5dGVMZW5ndGgsXG4gICAgKS5nZXRGbG9hdDMyKG9mZnNldCwgdHJ1ZSk7XG4gIH1cblxuICByZWFkSW50OChvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICByZXR1cm4gbmV3IERhdGFWaWV3KHRoaXMuYnVmZmVyLCB0aGlzLmJ5dGVPZmZzZXQsIHRoaXMuYnl0ZUxlbmd0aCkuZ2V0SW50OChcbiAgICAgIG9mZnNldCxcbiAgICApO1xuICB9XG5cbiAgcmVhZEludDE2QkUob2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgcmV0dXJuIG5ldyBEYXRhVmlldyh0aGlzLmJ1ZmZlciwgdGhpcy5ieXRlT2Zmc2V0LCB0aGlzLmJ5dGVMZW5ndGgpLmdldEludDE2KFxuICAgICAgb2Zmc2V0LFxuICAgICk7XG4gIH1cbiAgcmVhZEludDE2TEUob2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgcmV0dXJuIG5ldyBEYXRhVmlldyh0aGlzLmJ1ZmZlciwgdGhpcy5ieXRlT2Zmc2V0LCB0aGlzLmJ5dGVMZW5ndGgpLmdldEludDE2KFxuICAgICAgb2Zmc2V0LFxuICAgICAgdHJ1ZSxcbiAgICApO1xuICB9XG5cbiAgcmVhZEludDMyQkUob2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgcmV0dXJuIG5ldyBEYXRhVmlldyh0aGlzLmJ1ZmZlciwgdGhpcy5ieXRlT2Zmc2V0LCB0aGlzLmJ5dGVMZW5ndGgpLmdldEludDMyKFxuICAgICAgb2Zmc2V0LFxuICAgICk7XG4gIH1cbiAgcmVhZEludDMyTEUob2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgcmV0dXJuIG5ldyBEYXRhVmlldyh0aGlzLmJ1ZmZlciwgdGhpcy5ieXRlT2Zmc2V0LCB0aGlzLmJ5dGVMZW5ndGgpLmdldEludDMyKFxuICAgICAgb2Zmc2V0LFxuICAgICAgdHJ1ZSxcbiAgICApO1xuICB9XG5cbiAgcmVhZFVJbnQ4KG9mZnNldCA9IDApOiBudW1iZXIge1xuICAgIHJldHVybiBuZXcgRGF0YVZpZXcodGhpcy5idWZmZXIsIHRoaXMuYnl0ZU9mZnNldCwgdGhpcy5ieXRlTGVuZ3RoKS5nZXRVaW50OChcbiAgICAgIG9mZnNldCxcbiAgICApO1xuICB9XG5cbiAgcmVhZFVJbnQxNkJFKG9mZnNldCA9IDApOiBudW1iZXIge1xuICAgIHJldHVybiBuZXcgRGF0YVZpZXcoXG4gICAgICB0aGlzLmJ1ZmZlcixcbiAgICAgIHRoaXMuYnl0ZU9mZnNldCxcbiAgICAgIHRoaXMuYnl0ZUxlbmd0aCxcbiAgICApLmdldFVpbnQxNihvZmZzZXQpO1xuICB9XG4gIHJlYWRVSW50MTZMRShvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICByZXR1cm4gbmV3IERhdGFWaWV3KFxuICAgICAgdGhpcy5idWZmZXIsXG4gICAgICB0aGlzLmJ5dGVPZmZzZXQsXG4gICAgICB0aGlzLmJ5dGVMZW5ndGgsXG4gICAgKS5nZXRVaW50MTYob2Zmc2V0LCB0cnVlKTtcbiAgfVxuXG4gIHJlYWRVSW50MzJCRShvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICByZXR1cm4gbmV3IERhdGFWaWV3KFxuICAgICAgdGhpcy5idWZmZXIsXG4gICAgICB0aGlzLmJ5dGVPZmZzZXQsXG4gICAgICB0aGlzLmJ5dGVMZW5ndGgsXG4gICAgKS5nZXRVaW50MzIob2Zmc2V0KTtcbiAgfVxuICByZWFkVUludDMyTEUob2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgcmV0dXJuIG5ldyBEYXRhVmlldyhcbiAgICAgIHRoaXMuYnVmZmVyLFxuICAgICAgdGhpcy5ieXRlT2Zmc2V0LFxuICAgICAgdGhpcy5ieXRlTGVuZ3RoLFxuICAgICkuZ2V0VWludDMyKG9mZnNldCwgdHJ1ZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIG5ldyBCdWZmZXIgdGhhdCByZWZlcmVuY2VzIHRoZSBzYW1lIG1lbW9yeSBhcyB0aGUgb3JpZ2luYWwsIGJ1dFxuICAgKiBvZmZzZXQgYW5kIGNyb3BwZWQgYnkgdGhlIHN0YXJ0IGFuZCBlbmQgaW5kaWNlcy5cbiAgICovXG4gIHNsaWNlKGJlZ2luID0gMCwgZW5kID0gdGhpcy5sZW5ndGgpOiBCdWZmZXIge1xuICAgIC8vIHdvcmthcm91bmQgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvMzg2NjVcbiAgICByZXR1cm4gdGhpcy5zdWJhcnJheShiZWdpbiwgZW5kKSBhcyBCdWZmZXI7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIEpTT04gcmVwcmVzZW50YXRpb24gb2YgYnVmLiBKU09OLnN0cmluZ2lmeSgpIGltcGxpY2l0bHkgY2FsbHNcbiAgICogdGhpcyBmdW5jdGlvbiB3aGVuIHN0cmluZ2lmeWluZyBhIEJ1ZmZlciBpbnN0YW5jZS5cbiAgICovXG4gIHRvSlNPTigpOiBvYmplY3Qge1xuICAgIHJldHVybiB7IHR5cGU6IFwiQnVmZmVyXCIsIGRhdGE6IEFycmF5LmZyb20odGhpcykgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWNvZGVzIGJ1ZiB0byBhIHN0cmluZyBhY2NvcmRpbmcgdG8gdGhlIHNwZWNpZmllZCBjaGFyYWN0ZXIgZW5jb2RpbmcgaW5cbiAgICogZW5jb2RpbmcuIHN0YXJ0IGFuZCBlbmQgbWF5IGJlIHBhc3NlZCB0byBkZWNvZGUgb25seSBhIHN1YnNldCBvZiBidWYuXG4gICAqL1xuICB0b1N0cmluZyhlbmNvZGluZyA9IFwidXRmOFwiLCBzdGFydCA9IDAsIGVuZCA9IHRoaXMubGVuZ3RoKTogc3RyaW5nIHtcbiAgICBlbmNvZGluZyA9IGNoZWNrRW5jb2RpbmcoZW5jb2RpbmcpO1xuXG4gICAgY29uc3QgYiA9IHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCk7XG4gICAgaWYgKGVuY29kaW5nID09PSBcImhleFwiKSByZXR1cm4gaGV4LmVuY29kZVRvU3RyaW5nKGIpO1xuICAgIGlmIChlbmNvZGluZyA9PT0gXCJiYXNlNjRcIikgcmV0dXJuIGJhc2U2NC5lbmNvZGUoYi5idWZmZXIpO1xuXG4gICAgcmV0dXJuIG5ldyBUZXh0RGVjb2RlcihlbmNvZGluZykuZGVjb2RlKGIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFdyaXRlcyBzdHJpbmcgdG8gYnVmIGF0IG9mZnNldCBhY2NvcmRpbmcgdG8gdGhlIGNoYXJhY3RlciBlbmNvZGluZyBpblxuICAgKiBlbmNvZGluZy4gVGhlIGxlbmd0aCBwYXJhbWV0ZXIgaXMgdGhlIG51bWJlciBvZiBieXRlcyB0byB3cml0ZS4gSWYgYnVmIGRpZFxuICAgKiBub3QgY29udGFpbiBlbm91Z2ggc3BhY2UgdG8gZml0IHRoZSBlbnRpcmUgc3RyaW5nLCBvbmx5IHBhcnQgb2Ygc3RyaW5nIHdpbGxcbiAgICogYmUgd3JpdHRlbi4gSG93ZXZlciwgcGFydGlhbGx5IGVuY29kZWQgY2hhcmFjdGVycyB3aWxsIG5vdCBiZSB3cml0dGVuLlxuICAgKi9cbiAgd3JpdGUoc3RyaW5nOiBzdHJpbmcsIG9mZnNldCA9IDAsIGxlbmd0aCA9IHRoaXMubGVuZ3RoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlSW50byhcbiAgICAgIHN0cmluZyxcbiAgICAgIHRoaXMuc3ViYXJyYXkob2Zmc2V0LCBvZmZzZXQgKyBsZW5ndGgpLFxuICAgICkud3JpdHRlbjtcbiAgfVxuXG4gIHdyaXRlQmlnSW50NjRCRSh2YWx1ZTogYmlnaW50LCBvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICBuZXcgRGF0YVZpZXcodGhpcy5idWZmZXIsIHRoaXMuYnl0ZU9mZnNldCwgdGhpcy5ieXRlTGVuZ3RoKS5zZXRCaWdJbnQ2NChcbiAgICAgIG9mZnNldCxcbiAgICAgIHZhbHVlLFxuICAgICk7XG4gICAgcmV0dXJuIG9mZnNldCArIDQ7XG4gIH1cbiAgd3JpdGVCaWdJbnQ2NExFKHZhbHVlOiBiaWdpbnQsIG9mZnNldCA9IDApOiBudW1iZXIge1xuICAgIG5ldyBEYXRhVmlldyh0aGlzLmJ1ZmZlciwgdGhpcy5ieXRlT2Zmc2V0LCB0aGlzLmJ5dGVMZW5ndGgpLnNldEJpZ0ludDY0KFxuICAgICAgb2Zmc2V0LFxuICAgICAgdmFsdWUsXG4gICAgICB0cnVlLFxuICAgICk7XG4gICAgcmV0dXJuIG9mZnNldCArIDQ7XG4gIH1cblxuICB3cml0ZUJpZ1VJbnQ2NEJFKHZhbHVlOiBiaWdpbnQsIG9mZnNldCA9IDApOiBudW1iZXIge1xuICAgIG5ldyBEYXRhVmlldyh0aGlzLmJ1ZmZlciwgdGhpcy5ieXRlT2Zmc2V0LCB0aGlzLmJ5dGVMZW5ndGgpLnNldEJpZ1VpbnQ2NChcbiAgICAgIG9mZnNldCxcbiAgICAgIHZhbHVlLFxuICAgICk7XG4gICAgcmV0dXJuIG9mZnNldCArIDQ7XG4gIH1cbiAgd3JpdGVCaWdVSW50NjRMRSh2YWx1ZTogYmlnaW50LCBvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICBuZXcgRGF0YVZpZXcodGhpcy5idWZmZXIsIHRoaXMuYnl0ZU9mZnNldCwgdGhpcy5ieXRlTGVuZ3RoKS5zZXRCaWdVaW50NjQoXG4gICAgICBvZmZzZXQsXG4gICAgICB2YWx1ZSxcbiAgICAgIHRydWUsXG4gICAgKTtcbiAgICByZXR1cm4gb2Zmc2V0ICsgNDtcbiAgfVxuXG4gIHdyaXRlRG91YmxlQkUodmFsdWU6IG51bWJlciwgb2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgbmV3IERhdGFWaWV3KHRoaXMuYnVmZmVyLCB0aGlzLmJ5dGVPZmZzZXQsIHRoaXMuYnl0ZUxlbmd0aCkuc2V0RmxvYXQ2NChcbiAgICAgIG9mZnNldCxcbiAgICAgIHZhbHVlLFxuICAgICk7XG4gICAgcmV0dXJuIG9mZnNldCArIDg7XG4gIH1cbiAgd3JpdGVEb3VibGVMRSh2YWx1ZTogbnVtYmVyLCBvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICBuZXcgRGF0YVZpZXcodGhpcy5idWZmZXIsIHRoaXMuYnl0ZU9mZnNldCwgdGhpcy5ieXRlTGVuZ3RoKS5zZXRGbG9hdDY0KFxuICAgICAgb2Zmc2V0LFxuICAgICAgdmFsdWUsXG4gICAgICB0cnVlLFxuICAgICk7XG4gICAgcmV0dXJuIG9mZnNldCArIDg7XG4gIH1cblxuICB3cml0ZUZsb2F0QkUodmFsdWU6IG51bWJlciwgb2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgbmV3IERhdGFWaWV3KHRoaXMuYnVmZmVyLCB0aGlzLmJ5dGVPZmZzZXQsIHRoaXMuYnl0ZUxlbmd0aCkuc2V0RmxvYXQzMihcbiAgICAgIG9mZnNldCxcbiAgICAgIHZhbHVlLFxuICAgICk7XG4gICAgcmV0dXJuIG9mZnNldCArIDQ7XG4gIH1cbiAgd3JpdGVGbG9hdExFKHZhbHVlOiBudW1iZXIsIG9mZnNldCA9IDApOiBudW1iZXIge1xuICAgIG5ldyBEYXRhVmlldyh0aGlzLmJ1ZmZlciwgdGhpcy5ieXRlT2Zmc2V0LCB0aGlzLmJ5dGVMZW5ndGgpLnNldEZsb2F0MzIoXG4gICAgICBvZmZzZXQsXG4gICAgICB2YWx1ZSxcbiAgICAgIHRydWUsXG4gICAgKTtcbiAgICByZXR1cm4gb2Zmc2V0ICsgNDtcbiAgfVxuXG4gIHdyaXRlSW50OCh2YWx1ZTogbnVtYmVyLCBvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICBuZXcgRGF0YVZpZXcodGhpcy5idWZmZXIsIHRoaXMuYnl0ZU9mZnNldCwgdGhpcy5ieXRlTGVuZ3RoKS5zZXRJbnQ4KFxuICAgICAgb2Zmc2V0LFxuICAgICAgdmFsdWUsXG4gICAgKTtcbiAgICByZXR1cm4gb2Zmc2V0ICsgMTtcbiAgfVxuXG4gIHdyaXRlSW50MTZCRSh2YWx1ZTogbnVtYmVyLCBvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICBuZXcgRGF0YVZpZXcodGhpcy5idWZmZXIsIHRoaXMuYnl0ZU9mZnNldCwgdGhpcy5ieXRlTGVuZ3RoKS5zZXRJbnQxNihcbiAgICAgIG9mZnNldCxcbiAgICAgIHZhbHVlLFxuICAgICk7XG4gICAgcmV0dXJuIG9mZnNldCArIDI7XG4gIH1cbiAgd3JpdGVJbnQxNkxFKHZhbHVlOiBudW1iZXIsIG9mZnNldCA9IDApOiBudW1iZXIge1xuICAgIG5ldyBEYXRhVmlldyh0aGlzLmJ1ZmZlciwgdGhpcy5ieXRlT2Zmc2V0LCB0aGlzLmJ5dGVMZW5ndGgpLnNldEludDE2KFxuICAgICAgb2Zmc2V0LFxuICAgICAgdmFsdWUsXG4gICAgICB0cnVlLFxuICAgICk7XG4gICAgcmV0dXJuIG9mZnNldCArIDI7XG4gIH1cblxuICB3cml0ZUludDMyQkUodmFsdWU6IG51bWJlciwgb2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgbmV3IERhdGFWaWV3KHRoaXMuYnVmZmVyLCB0aGlzLmJ5dGVPZmZzZXQsIHRoaXMuYnl0ZUxlbmd0aCkuc2V0VWludDMyKFxuICAgICAgb2Zmc2V0LFxuICAgICAgdmFsdWUsXG4gICAgKTtcbiAgICByZXR1cm4gb2Zmc2V0ICsgNDtcbiAgfVxuICB3cml0ZUludDMyTEUodmFsdWU6IG51bWJlciwgb2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgbmV3IERhdGFWaWV3KHRoaXMuYnVmZmVyLCB0aGlzLmJ5dGVPZmZzZXQsIHRoaXMuYnl0ZUxlbmd0aCkuc2V0SW50MzIoXG4gICAgICBvZmZzZXQsXG4gICAgICB2YWx1ZSxcbiAgICAgIHRydWUsXG4gICAgKTtcbiAgICByZXR1cm4gb2Zmc2V0ICsgNDtcbiAgfVxuXG4gIHdyaXRlVUludDgodmFsdWU6IG51bWJlciwgb2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgbmV3IERhdGFWaWV3KHRoaXMuYnVmZmVyLCB0aGlzLmJ5dGVPZmZzZXQsIHRoaXMuYnl0ZUxlbmd0aCkuc2V0VWludDgoXG4gICAgICBvZmZzZXQsXG4gICAgICB2YWx1ZSxcbiAgICApO1xuICAgIHJldHVybiBvZmZzZXQgKyAxO1xuICB9XG5cbiAgd3JpdGVVSW50MTZCRSh2YWx1ZTogbnVtYmVyLCBvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICBuZXcgRGF0YVZpZXcodGhpcy5idWZmZXIsIHRoaXMuYnl0ZU9mZnNldCwgdGhpcy5ieXRlTGVuZ3RoKS5zZXRVaW50MTYoXG4gICAgICBvZmZzZXQsXG4gICAgICB2YWx1ZSxcbiAgICApO1xuICAgIHJldHVybiBvZmZzZXQgKyAyO1xuICB9XG4gIHdyaXRlVUludDE2TEUodmFsdWU6IG51bWJlciwgb2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgbmV3IERhdGFWaWV3KHRoaXMuYnVmZmVyLCB0aGlzLmJ5dGVPZmZzZXQsIHRoaXMuYnl0ZUxlbmd0aCkuc2V0VWludDE2KFxuICAgICAgb2Zmc2V0LFxuICAgICAgdmFsdWUsXG4gICAgICB0cnVlLFxuICAgICk7XG4gICAgcmV0dXJuIG9mZnNldCArIDI7XG4gIH1cblxuICB3cml0ZVVJbnQzMkJFKHZhbHVlOiBudW1iZXIsIG9mZnNldCA9IDApOiBudW1iZXIge1xuICAgIG5ldyBEYXRhVmlldyh0aGlzLmJ1ZmZlciwgdGhpcy5ieXRlT2Zmc2V0LCB0aGlzLmJ5dGVMZW5ndGgpLnNldFVpbnQzMihcbiAgICAgIG9mZnNldCxcbiAgICAgIHZhbHVlLFxuICAgICk7XG4gICAgcmV0dXJuIG9mZnNldCArIDQ7XG4gIH1cbiAgd3JpdGVVSW50MzJMRSh2YWx1ZTogbnVtYmVyLCBvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICBuZXcgRGF0YVZpZXcodGhpcy5idWZmZXIsIHRoaXMuYnl0ZU9mZnNldCwgdGhpcy5ieXRlTGVuZ3RoKS5zZXRVaW50MzIoXG4gICAgICBvZmZzZXQsXG4gICAgICB2YWx1ZSxcbiAgICAgIHRydWUsXG4gICAgKTtcbiAgICByZXR1cm4gb2Zmc2V0ICsgNDtcbiAgfVxufVxuXG5leHBvcnQgeyBCdWZmZXIgfTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGdsb2JhbFRoaXMsIFwiQnVmZmVyXCIsIHtcbiAgdmFsdWU6IEJ1ZmZlcixcbiAgZW51bWVyYWJsZTogZmFsc2UsXG4gIHdyaXRhYmxlOiB0cnVlLFxuICBjb25maWd1cmFibGU6IHRydWUsXG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiWUFBWSxHQUFHLE9BQU0sa0JBQW9CO1lBQzdCLE1BQU0sT0FBTSxxQkFBdUI7U0FDdEMsY0FBYyxFQUFFLGlCQUFpQixTQUFRLFdBQWE7TUFFekQsdUJBQXVCO0tBQzNCLEtBQU87S0FDUCxNQUFRO0tBQ1IsTUFBUTtLQUNSLElBQU07S0FDTixPQUFTOztTQUdGLGFBQWEsQ0FBQyxRQUFRLElBQUcsSUFBTSxHQUFFLE1BQU0sR0FBRyxJQUFJO2VBQzFDLFFBQVEsTUFBSyxNQUFRLEtBQUssTUFBTSxJQUFJLFFBQVE7YUFDaEQsTUFBTSxVQUFTLElBQU07a0JBQ2hCLFNBQVMsRUFBRSxpQkFBaUIsRUFBRSxRQUFROztVQUc1QyxVQUFVLEdBQUcsaUJBQWlCLENBQUMsUUFBUTtRQUV6QyxVQUFVLEtBQUssU0FBUztrQkFDaEIsU0FBUyxFQUFFLGlCQUFpQixFQUFFLFFBQVE7O1FBRzlDLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxRQUFRO1FBQzNDLGNBQWMsRUFBRSxDQUFDLEVBQUUsUUFBUSxDQUFDLFVBQVU7O1dBR2pDLFVBQVU7O0FBT25CLEVBQWtHLEFBQWxHLGdHQUFrRztNQUM1RixXQUFXO0lBQ2YsSUFBSTtRQUNGLFVBQVUsR0FBRyxNQUFjLE9BQ3JCLFdBQVcsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLFVBQVU7O0lBRS9DLElBQUk7UUFDRixVQUFVLEdBQUcsTUFBYyxHQUFhLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQzs7SUFFM0QsT0FBTztRQUNMLFVBQVUsR0FBRyxNQUFjLEdBQWEsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDOztJQUUzRCxNQUFNO1FBQ0osVUFBVSxHQUFHLE1BQWMsR0FBYSxNQUFNLENBQUMsTUFBTTs7SUFFdkQsS0FBSztRQUNILFVBQVUsR0FBRyxNQUFjLEdBQWEsTUFBTSxDQUFDLE1BQU07O0lBRXZELE1BQU07UUFDSixVQUFVLEdBQUcsTUFBYyxHQUN6QixnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU07O0lBRTFDLEdBQUc7UUFDRCxVQUFVLEdBQUcsTUFBYyxHQUFhLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQzs7O1NBSXRELGdCQUFnQixDQUFDLEdBQVcsRUFBRSxLQUFhO0lBQ2xELEVBQWlCLEFBQWpCLGVBQWlCO1FBQ2IsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxNQUFNLEVBQUksRUFBRSxLQUFLO1FBQ3pDLEtBQUssR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxNQUFNLEVBQUksRUFBRSxLQUFLO0lBRTFELEVBQW9CLEFBQXBCLGtCQUFvQjtXQUNaLEtBQUssR0FBRyxDQUFDLEtBQU0sQ0FBQzs7TUFNTCxNQUFNLFNBQVMsVUFBVTtJQUM1QyxFQUVHLEFBRkg7O0dBRUcsQUFGSCxFQUVHLFFBQ0ksS0FBSyxDQUNWLElBQVksRUFDWixJQUE0QyxFQUM1QyxRQUFRLElBQUcsSUFBTTttQkFFTixJQUFJLE1BQUssTUFBUTtzQkFDaEIsU0FBUyxFQUNoQiwwREFBMEQsU0FBUyxJQUFJOztjQUl0RSxHQUFHLE9BQU8sTUFBTSxDQUFDLElBQUk7WUFDdkIsSUFBSSxLQUFLLENBQUMsU0FBUyxHQUFHO1lBRXRCLE9BQU87bUJBQ0EsSUFBSSxNQUFLLE1BQVE7WUFDMUIsUUFBUSxHQUFHLGFBQWEsQ0FBQyxRQUFRO3VCQUV4QixJQUFJLE1BQUssTUFBUSxLQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLFFBQVEsTUFBSyxJQUFNO2dCQUVwRSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQzttQkFDckIsT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVE7MEJBQzNCLElBQUksTUFBSyxNQUFRO1lBQ2pDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSTttQkFDSixJQUFJLFlBQVksVUFBVTtnQkFDL0IsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDOzBCQUNULFNBQVMsRUFDaEIsMENBQTBDLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRzs7WUFJMUUsT0FBTyxHQUFHLElBQUk7O1lBR1osT0FBTztnQkFDTCxPQUFPLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNO2dCQUM3QixPQUFPLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU07O2dCQUd0QyxNQUFNLEdBQUcsQ0FBQztrQkFDUCxNQUFNLEdBQUcsSUFBSTtnQkFDbEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsTUFBTTtnQkFDdkIsTUFBTSxJQUFJLE9BQU8sQ0FBQyxNQUFNO29CQUNwQixNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sSUFBSSxJQUFJOztnQkFFakMsTUFBTSxLQUFLLElBQUk7Z0JBQ2pCLEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxHQUFHLE1BQU0sR0FBRyxNQUFNOzs7ZUFJL0MsR0FBRzs7V0FHTCxXQUFXLENBQUMsSUFBWTttQkFDbEIsTUFBTSxDQUFDLElBQUk7O0lBR3hCLEVBSUcsQUFKSDs7OztHQUlHLEFBSkgsRUFJRyxRQUNJLFVBQVUsQ0FDZixNQUEyRSxFQUMzRSxRQUFRLElBQUcsSUFBTTttQkFFTixNQUFNLEtBQUksTUFBUSxVQUFTLE1BQU0sQ0FBQyxVQUFVO1FBRXZELFFBQVEsR0FBRyxpQkFBaUIsQ0FBQyxRQUFRLE1BQUssSUFBTTtlQUN6QyxXQUFXLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxNQUFNOztJQUdoRCxFQUdHLEFBSEg7OztHQUdHLEFBSEgsRUFHRyxRQUNJLE1BQU0sQ0FBQyxJQUE2QixFQUFFLFdBQW9CO1lBQzNELFdBQVcsSUFBSSxTQUFTO1lBQzFCLFdBQVcsR0FBRyxDQUFDO3VCQUNKLEdBQUcsSUFBSSxJQUFJO2dCQUNwQixXQUFXLElBQUksR0FBRyxDQUFDLE1BQU07OztjQUl2QixNQUFNLE9BQU8sTUFBTSxDQUFDLFdBQVc7WUFDakMsR0FBRyxHQUFHLENBQUM7bUJBQ0EsR0FBRyxJQUFJLElBQUk7WUFDcEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRztZQUNuQixHQUFHLElBQUksR0FBRyxDQUFDLE1BQU07O2VBR1osTUFBTTs7V0EyQlIsSUFBSSxDQUNULEVBQThELEFBQTlELDREQUE4RDtJQUM5RCxLQUFVLEVBQ1YsZ0JBQWtDLEVBQ2xDLE1BQWU7Y0FFVCxNQUFNLFVBQVUsZ0JBQWdCLE1BQUssTUFBUSxJQUMvQyxTQUFTLEdBQ1QsZ0JBQWdCO1lBQ2hCLFFBQVEsVUFBVSxnQkFBZ0IsTUFBSyxNQUFRLElBQy9DLGdCQUFnQixHQUNoQixTQUFTO21CQUVGLEtBQUssS0FBSSxNQUFRO1lBQzFCLFFBQVEsR0FBRyxhQUFhLENBQUMsUUFBUSxFQUFFLEtBQUs7Z0JBQ3BDLFFBQVEsTUFBSyxHQUFLLGNBQWEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLE1BQU07Z0JBQ3BFLFFBQVEsTUFBSyxNQUFRLGNBQWEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSzt1QkFDckQsTUFBTSxLQUFLLFdBQVcsR0FBRyxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU07O1FBRzFELEVBQXNFLEFBQXRFLG9FQUFzRTttQkFDM0QsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUcsTUFBTTs7SUFHMUMsRUFFRyxBQUZIOztHQUVHLEFBRkgsRUFFRyxRQUNJLFFBQVEsQ0FBQyxHQUFXO2VBQ2xCLEdBQUcsWUFBWSxNQUFNOztJQUc5QixFQUE4RCxBQUE5RCw0REFBOEQ7V0FDdkQsVUFBVSxDQUFDLFFBQWE7c0JBRXBCLFFBQVEsTUFBSyxNQUFRLEtBQzVCLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUNyQixpQkFBaUIsQ0FBQyxRQUFRLE1BQU0sU0FBUzs7SUFJN0MsRUFHRyxBQUhIOzs7R0FHRyxBQUhILEVBR0csQ0FDSCxJQUFJLENBQ0YsWUFBaUMsRUFDakMsV0FBVyxHQUFHLENBQUMsRUFDZixXQUFXLEdBQUcsQ0FBQyxFQUNmLFNBQVMsUUFBUSxNQUFNO2NBRWpCLFlBQVksUUFBUSxRQUFRLENBQUMsV0FBVyxFQUFFLFNBQVM7UUFDekQsWUFBWSxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsV0FBVztlQUNuQyxZQUFZLENBQUMsTUFBTTs7SUFHNUIsRUFFRyxBQUZIOztHQUVHLEFBRkgsRUFFRyxDQUNILE1BQU0sQ0FBQyxXQUFnQztjQUMvQixXQUFXLFlBQVksVUFBVTtzQkFDM0IsU0FBUyxFQUNoQixzRkFBc0YsU0FBUyxXQUFXOztxQkFJbEcsV0FBVyxTQUFTLElBQUk7aUJBQzVCLFVBQVUsS0FBSyxXQUFXLENBQUMsVUFBVSxTQUFTLEtBQUs7Z0JBRW5ELENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxRQUFRLE1BQU0sRUFBRSxDQUFDO3FCQUN2QixDQUFDLE1BQU0sV0FBVyxDQUFDLENBQUMsVUFBVSxLQUFLOztlQUd2QyxJQUFJOztJQUdiLGNBQWMsQ0FBQyxNQUFNLEdBQUcsQ0FBQzttQkFDWixRQUFRLE1BQ1osTUFBTSxPQUNOLFVBQVUsT0FDVixVQUFVLEVBQ2YsV0FBVyxDQUFDLE1BQU07O0lBRXRCLGNBQWMsQ0FBQyxNQUFNLEdBQUcsQ0FBQzttQkFDWixRQUFRLE1BQ1osTUFBTSxPQUNOLFVBQVUsT0FDVixVQUFVLEVBQ2YsV0FBVyxDQUFDLE1BQU0sRUFBRSxJQUFJOztJQUc1QixlQUFlLENBQUMsTUFBTSxHQUFHLENBQUM7bUJBQ2IsUUFBUSxNQUNaLE1BQU0sT0FDTixVQUFVLE9BQ1YsVUFBVSxFQUNmLFlBQVksQ0FBQyxNQUFNOztJQUV2QixlQUFlLENBQUMsTUFBTSxHQUFHLENBQUM7bUJBQ2IsUUFBUSxNQUNaLE1BQU0sT0FDTixVQUFVLE9BQ1YsVUFBVSxFQUNmLFlBQVksQ0FBQyxNQUFNLEVBQUUsSUFBSTs7SUFHN0IsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDO21CQUNWLFFBQVEsTUFDWixNQUFNLE9BQ04sVUFBVSxPQUNWLFVBQVUsRUFDZixVQUFVLENBQUMsTUFBTTs7SUFFckIsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDO21CQUNWLFFBQVEsTUFDWixNQUFNLE9BQ04sVUFBVSxPQUNWLFVBQVUsRUFDZixVQUFVLENBQUMsTUFBTSxFQUFFLElBQUk7O0lBRzNCLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQzttQkFDVCxRQUFRLE1BQ1osTUFBTSxPQUNOLFVBQVUsT0FDVixVQUFVLEVBQ2YsVUFBVSxDQUFDLE1BQU07O0lBRXJCLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQzttQkFDVCxRQUFRLE1BQ1osTUFBTSxPQUNOLFVBQVUsT0FDVixVQUFVLEVBQ2YsVUFBVSxDQUFDLE1BQU0sRUFBRSxJQUFJOztJQUczQixRQUFRLENBQUMsTUFBTSxHQUFHLENBQUM7bUJBQ04sUUFBUSxNQUFNLE1BQU0sT0FBTyxVQUFVLE9BQU8sVUFBVSxFQUFFLE9BQU8sQ0FDeEUsTUFBTTs7SUFJVixXQUFXLENBQUMsTUFBTSxHQUFHLENBQUM7bUJBQ1QsUUFBUSxNQUFNLE1BQU0sT0FBTyxVQUFVLE9BQU8sVUFBVSxFQUFFLFFBQVEsQ0FDekUsTUFBTTs7SUFHVixXQUFXLENBQUMsTUFBTSxHQUFHLENBQUM7bUJBQ1QsUUFBUSxNQUFNLE1BQU0sT0FBTyxVQUFVLE9BQU8sVUFBVSxFQUFFLFFBQVEsQ0FDekUsTUFBTSxFQUNOLElBQUk7O0lBSVIsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDO21CQUNULFFBQVEsTUFBTSxNQUFNLE9BQU8sVUFBVSxPQUFPLFVBQVUsRUFBRSxRQUFRLENBQ3pFLE1BQU07O0lBR1YsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDO21CQUNULFFBQVEsTUFBTSxNQUFNLE9BQU8sVUFBVSxPQUFPLFVBQVUsRUFBRSxRQUFRLENBQ3pFLE1BQU0sRUFDTixJQUFJOztJQUlSLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQzttQkFDUCxRQUFRLE1BQU0sTUFBTSxPQUFPLFVBQVUsT0FBTyxVQUFVLEVBQUUsUUFBUSxDQUN6RSxNQUFNOztJQUlWLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQzttQkFDVixRQUFRLE1BQ1osTUFBTSxPQUNOLFVBQVUsT0FDVixVQUFVLEVBQ2YsU0FBUyxDQUFDLE1BQU07O0lBRXBCLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQzttQkFDVixRQUFRLE1BQ1osTUFBTSxPQUNOLFVBQVUsT0FDVixVQUFVLEVBQ2YsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJOztJQUcxQixZQUFZLENBQUMsTUFBTSxHQUFHLENBQUM7bUJBQ1YsUUFBUSxNQUNaLE1BQU0sT0FDTixVQUFVLE9BQ1YsVUFBVSxFQUNmLFNBQVMsQ0FBQyxNQUFNOztJQUVwQixZQUFZLENBQUMsTUFBTSxHQUFHLENBQUM7bUJBQ1YsUUFBUSxNQUNaLE1BQU0sT0FDTixVQUFVLE9BQ1YsVUFBVSxFQUNmLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSTs7SUFHMUIsRUFHRyxBQUhIOzs7R0FHRyxBQUhILEVBR0csQ0FDSCxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxHQUFHLFFBQVEsTUFBTTtRQUNoQyxFQUFzRSxBQUF0RSxvRUFBc0U7b0JBQzFELFFBQVEsQ0FBQyxLQUFLLEVBQUUsR0FBRzs7SUFHakMsRUFHRyxBQUhIOzs7R0FHRyxBQUhILEVBR0csQ0FDSCxNQUFNOztZQUNLLElBQUksR0FBRSxNQUFRO1lBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJOzs7SUFHM0MsRUFHRyxBQUhIOzs7R0FHRyxBQUhILEVBR0csQ0FDSCxRQUFRLENBQUMsUUFBUSxJQUFHLElBQU0sR0FBRSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEdBQUcsUUFBUSxNQUFNO1FBQ3RELFFBQVEsR0FBRyxhQUFhLENBQUMsUUFBUTtjQUUzQixDQUFDLFFBQVEsUUFBUSxDQUFDLEtBQUssRUFBRSxHQUFHO1lBQzlCLFFBQVEsTUFBSyxHQUFLLFVBQVMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQy9DLFFBQVEsTUFBSyxNQUFRLFVBQVMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTTttQkFFN0MsV0FBVyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQzs7SUFHM0MsRUFLRyxBQUxIOzs7OztHQUtHLEFBTEgsRUFLRyxDQUNILEtBQUssQ0FBQyxNQUFjLEVBQUUsTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLFFBQVEsTUFBTTttQkFDekMsV0FBVyxHQUFHLFVBQVUsQ0FDakMsTUFBTSxPQUNELFFBQVEsQ0FBQyxNQUFNLEVBQUUsTUFBTSxHQUFHLE1BQU0sR0FDckMsT0FBTzs7SUFHWCxlQUFlLENBQUMsS0FBYSxFQUFFLE1BQU0sR0FBRyxDQUFDO1lBQ25DLFFBQVEsTUFBTSxNQUFNLE9BQU8sVUFBVSxPQUFPLFVBQVUsRUFBRSxXQUFXLENBQ3JFLE1BQU0sRUFDTixLQUFLO2VBRUEsTUFBTSxHQUFHLENBQUM7O0lBRW5CLGVBQWUsQ0FBQyxLQUFhLEVBQUUsTUFBTSxHQUFHLENBQUM7WUFDbkMsUUFBUSxNQUFNLE1BQU0sT0FBTyxVQUFVLE9BQU8sVUFBVSxFQUFFLFdBQVcsQ0FDckUsTUFBTSxFQUNOLEtBQUssRUFDTCxJQUFJO2VBRUMsTUFBTSxHQUFHLENBQUM7O0lBR25CLGdCQUFnQixDQUFDLEtBQWEsRUFBRSxNQUFNLEdBQUcsQ0FBQztZQUNwQyxRQUFRLE1BQU0sTUFBTSxPQUFPLFVBQVUsT0FBTyxVQUFVLEVBQUUsWUFBWSxDQUN0RSxNQUFNLEVBQ04sS0FBSztlQUVBLE1BQU0sR0FBRyxDQUFDOztJQUVuQixnQkFBZ0IsQ0FBQyxLQUFhLEVBQUUsTUFBTSxHQUFHLENBQUM7WUFDcEMsUUFBUSxNQUFNLE1BQU0sT0FBTyxVQUFVLE9BQU8sVUFBVSxFQUFFLFlBQVksQ0FDdEUsTUFBTSxFQUNOLEtBQUssRUFDTCxJQUFJO2VBRUMsTUFBTSxHQUFHLENBQUM7O0lBR25CLGFBQWEsQ0FBQyxLQUFhLEVBQUUsTUFBTSxHQUFHLENBQUM7WUFDakMsUUFBUSxNQUFNLE1BQU0sT0FBTyxVQUFVLE9BQU8sVUFBVSxFQUFFLFVBQVUsQ0FDcEUsTUFBTSxFQUNOLEtBQUs7ZUFFQSxNQUFNLEdBQUcsQ0FBQzs7SUFFbkIsYUFBYSxDQUFDLEtBQWEsRUFBRSxNQUFNLEdBQUcsQ0FBQztZQUNqQyxRQUFRLE1BQU0sTUFBTSxPQUFPLFVBQVUsT0FBTyxVQUFVLEVBQUUsVUFBVSxDQUNwRSxNQUFNLEVBQ04sS0FBSyxFQUNMLElBQUk7ZUFFQyxNQUFNLEdBQUcsQ0FBQzs7SUFHbkIsWUFBWSxDQUFDLEtBQWEsRUFBRSxNQUFNLEdBQUcsQ0FBQztZQUNoQyxRQUFRLE1BQU0sTUFBTSxPQUFPLFVBQVUsT0FBTyxVQUFVLEVBQUUsVUFBVSxDQUNwRSxNQUFNLEVBQ04sS0FBSztlQUVBLE1BQU0sR0FBRyxDQUFDOztJQUVuQixZQUFZLENBQUMsS0FBYSxFQUFFLE1BQU0sR0FBRyxDQUFDO1lBQ2hDLFFBQVEsTUFBTSxNQUFNLE9BQU8sVUFBVSxPQUFPLFVBQVUsRUFBRSxVQUFVLENBQ3BFLE1BQU0sRUFDTixLQUFLLEVBQ0wsSUFBSTtlQUVDLE1BQU0sR0FBRyxDQUFDOztJQUduQixTQUFTLENBQUMsS0FBYSxFQUFFLE1BQU0sR0FBRyxDQUFDO1lBQzdCLFFBQVEsTUFBTSxNQUFNLE9BQU8sVUFBVSxPQUFPLFVBQVUsRUFBRSxPQUFPLENBQ2pFLE1BQU0sRUFDTixLQUFLO2VBRUEsTUFBTSxHQUFHLENBQUM7O0lBR25CLFlBQVksQ0FBQyxLQUFhLEVBQUUsTUFBTSxHQUFHLENBQUM7WUFDaEMsUUFBUSxNQUFNLE1BQU0sT0FBTyxVQUFVLE9BQU8sVUFBVSxFQUFFLFFBQVEsQ0FDbEUsTUFBTSxFQUNOLEtBQUs7ZUFFQSxNQUFNLEdBQUcsQ0FBQzs7SUFFbkIsWUFBWSxDQUFDLEtBQWEsRUFBRSxNQUFNLEdBQUcsQ0FBQztZQUNoQyxRQUFRLE1BQU0sTUFBTSxPQUFPLFVBQVUsT0FBTyxVQUFVLEVBQUUsUUFBUSxDQUNsRSxNQUFNLEVBQ04sS0FBSyxFQUNMLElBQUk7ZUFFQyxNQUFNLEdBQUcsQ0FBQzs7SUFHbkIsWUFBWSxDQUFDLEtBQWEsRUFBRSxNQUFNLEdBQUcsQ0FBQztZQUNoQyxRQUFRLE1BQU0sTUFBTSxPQUFPLFVBQVUsT0FBTyxVQUFVLEVBQUUsU0FBUyxDQUNuRSxNQUFNLEVBQ04sS0FBSztlQUVBLE1BQU0sR0FBRyxDQUFDOztJQUVuQixZQUFZLENBQUMsS0FBYSxFQUFFLE1BQU0sR0FBRyxDQUFDO1lBQ2hDLFFBQVEsTUFBTSxNQUFNLE9BQU8sVUFBVSxPQUFPLFVBQVUsRUFBRSxRQUFRLENBQ2xFLE1BQU0sRUFDTixLQUFLLEVBQ0wsSUFBSTtlQUVDLE1BQU0sR0FBRyxDQUFDOztJQUduQixVQUFVLENBQUMsS0FBYSxFQUFFLE1BQU0sR0FBRyxDQUFDO1lBQzlCLFFBQVEsTUFBTSxNQUFNLE9BQU8sVUFBVSxPQUFPLFVBQVUsRUFBRSxRQUFRLENBQ2xFLE1BQU0sRUFDTixLQUFLO2VBRUEsTUFBTSxHQUFHLENBQUM7O0lBR25CLGFBQWEsQ0FBQyxLQUFhLEVBQUUsTUFBTSxHQUFHLENBQUM7WUFDakMsUUFBUSxNQUFNLE1BQU0sT0FBTyxVQUFVLE9BQU8sVUFBVSxFQUFFLFNBQVMsQ0FDbkUsTUFBTSxFQUNOLEtBQUs7ZUFFQSxNQUFNLEdBQUcsQ0FBQzs7SUFFbkIsYUFBYSxDQUFDLEtBQWEsRUFBRSxNQUFNLEdBQUcsQ0FBQztZQUNqQyxRQUFRLE1BQU0sTUFBTSxPQUFPLFVBQVUsT0FBTyxVQUFVLEVBQUUsU0FBUyxDQUNuRSxNQUFNLEVBQ04sS0FBSyxFQUNMLElBQUk7ZUFFQyxNQUFNLEdBQUcsQ0FBQzs7SUFHbkIsYUFBYSxDQUFDLEtBQWEsRUFBRSxNQUFNLEdBQUcsQ0FBQztZQUNqQyxRQUFRLE1BQU0sTUFBTSxPQUFPLFVBQVUsT0FBTyxVQUFVLEVBQUUsU0FBUyxDQUNuRSxNQUFNLEVBQ04sS0FBSztlQUVBLE1BQU0sR0FBRyxDQUFDOztJQUVuQixhQUFhLENBQUMsS0FBYSxFQUFFLE1BQU0sR0FBRyxDQUFDO1lBQ2pDLFFBQVEsTUFBTSxNQUFNLE9BQU8sVUFBVSxPQUFPLFVBQVUsRUFBRSxTQUFTLENBQ25FLE1BQU0sRUFDTixLQUFLLEVBQ0wsSUFBSTtlQUVDLE1BQU0sR0FBRyxDQUFDOzs7QUEvZnJCLEVBRUcsQUFGSDs7Q0FFRyxBQUZILEVBRUcsVUFDa0IsTUFBTTtTQWdnQmxCLE1BQU07QUFFZixNQUFNLENBQUMsY0FBYyxDQUFDLFVBQVUsR0FBRSxNQUFRO0lBQ3hDLEtBQUssRUFBRSxNQUFNO0lBQ2IsVUFBVSxFQUFFLEtBQUs7SUFDakIsUUFBUSxFQUFFLElBQUk7SUFDZCxZQUFZLEVBQUUsSUFBSSJ9