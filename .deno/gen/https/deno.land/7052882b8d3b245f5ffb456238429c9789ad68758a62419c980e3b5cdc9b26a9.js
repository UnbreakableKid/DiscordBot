// Ported from Go
// https://github.com/golang/go/blob/go1.12.5/src/encoding/hex/hex.go
// Copyright 2009 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.
// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
const hextable = new TextEncoder().encode("0123456789abcdef");
export function errInvalidByte(byte) {
    return new Error("encoding/hex: invalid byte: " + new TextDecoder().decode(new Uint8Array([
        byte
    ])));
}
export function errLength() {
    return new Error("encoding/hex: odd length hex string");
}
// fromHexChar converts a hex character into its value.
function fromHexChar(byte) {
    // '0' <= byte && byte <= '9'
    if (48 <= byte && byte <= 57) return byte - 48;
    // 'a' <= byte && byte <= 'f'
    if (97 <= byte && byte <= 102) return byte - 97 + 10;
    // 'A' <= byte && byte <= 'F'
    if (65 <= byte && byte <= 70) return byte - 65 + 10;
    throw errInvalidByte(byte);
}
/**
 * EncodedLen returns the length of an encoding of n source bytes. Specifically,
 * it returns n * 2.
 * @param n
 */ export function encodedLen(n) {
    return n * 2;
}
/**
 * Encode encodes `src` into `encodedLen(src.length)` bytes.
 * @param src
 */ export function encode(src) {
    const dst = new Uint8Array(encodedLen(src.length));
    for(let i = 0; i < dst.length; i++){
        const v = src[i];
        dst[i * 2] = hextable[v >> 4];
        dst[i * 2 + 1] = hextable[v & 15];
    }
    return dst;
}
/**
 * EncodeToString returns the hexadecimal encoding of `src`.
 * @param src
 */ export function encodeToString(src) {
    return new TextDecoder().decode(encode(src));
}
/**
 * Decode decodes `src` into `decodedLen(src.length)` bytes
 * If the input is malformed an error will be thrown
 * the error.
 * @param src
 */ export function decode(src) {
    const dst = new Uint8Array(decodedLen(src.length));
    for(let i = 0; i < dst.length; i++){
        const a = fromHexChar(src[i * 2]);
        const b = fromHexChar(src[i * 2 + 1]);
        dst[i] = a << 4 | b;
    }
    if (src.length % 2 == 1) {
        // Check for invalid char before reporting bad length,
        // since the invalid char (if present) is an earlier problem.
        fromHexChar(src[dst.length * 2]);
        throw errLength();
    }
    return dst;
}
/**
 * DecodedLen returns the length of decoding `x` source bytes.
 * Specifically, it returns `x / 2`.
 * @param x
 */ export function decodedLen(x) {
    return x >>> 1;
}
/**
 * DecodeString returns the bytes represented by the hexadecimal string `s`.
 * DecodeString expects that src contains only hexadecimal characters and that
 * src has even length.
 * If the input is malformed, DecodeString will throw an error.
 * @param s the `string` to decode to `Uint8Array`
 */ export function decodeString(s) {
    return decode(new TextEncoder().encode(s));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC42Ni4wL2VuY29kaW5nL2hleC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLy8gUG9ydGVkIGZyb20gR29cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nb2xhbmcvZ28vYmxvYi9nbzEuMTIuNS9zcmMvZW5jb2RpbmcvaGV4L2hleC5nb1xuLy8gQ29weXJpZ2h0IDIwMDkgVGhlIEdvIEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIEJTRC1zdHlsZVxuLy8gbGljZW5zZSB0aGF0IGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuLy8gQ29weXJpZ2h0IDIwMTgtMjAyMCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuY29uc3QgaGV4dGFibGUgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCIwMTIzNDU2Nzg5YWJjZGVmXCIpO1xuXG5leHBvcnQgZnVuY3Rpb24gZXJySW52YWxpZEJ5dGUoYnl0ZTogbnVtYmVyKTogRXJyb3Ige1xuICByZXR1cm4gbmV3IEVycm9yKFxuICAgIFwiZW5jb2RpbmcvaGV4OiBpbnZhbGlkIGJ5dGU6IFwiICtcbiAgICAgIG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShuZXcgVWludDhBcnJheShbYnl0ZV0pKSxcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVyckxlbmd0aCgpOiBFcnJvciB7XG4gIHJldHVybiBuZXcgRXJyb3IoXCJlbmNvZGluZy9oZXg6IG9kZCBsZW5ndGggaGV4IHN0cmluZ1wiKTtcbn1cblxuLy8gZnJvbUhleENoYXIgY29udmVydHMgYSBoZXggY2hhcmFjdGVyIGludG8gaXRzIHZhbHVlLlxuZnVuY3Rpb24gZnJvbUhleENoYXIoYnl0ZTogbnVtYmVyKTogbnVtYmVyIHtcbiAgLy8gJzAnIDw9IGJ5dGUgJiYgYnl0ZSA8PSAnOSdcbiAgaWYgKDQ4IDw9IGJ5dGUgJiYgYnl0ZSA8PSA1NykgcmV0dXJuIGJ5dGUgLSA0ODtcbiAgLy8gJ2EnIDw9IGJ5dGUgJiYgYnl0ZSA8PSAnZidcbiAgaWYgKDk3IDw9IGJ5dGUgJiYgYnl0ZSA8PSAxMDIpIHJldHVybiBieXRlIC0gOTcgKyAxMDtcbiAgLy8gJ0EnIDw9IGJ5dGUgJiYgYnl0ZSA8PSAnRidcbiAgaWYgKDY1IDw9IGJ5dGUgJiYgYnl0ZSA8PSA3MCkgcmV0dXJuIGJ5dGUgLSA2NSArIDEwO1xuXG4gIHRocm93IGVyckludmFsaWRCeXRlKGJ5dGUpO1xufVxuXG4vKipcbiAqIEVuY29kZWRMZW4gcmV0dXJucyB0aGUgbGVuZ3RoIG9mIGFuIGVuY29kaW5nIG9mIG4gc291cmNlIGJ5dGVzLiBTcGVjaWZpY2FsbHksXG4gKiBpdCByZXR1cm5zIG4gKiAyLlxuICogQHBhcmFtIG5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZWRMZW4objogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIG4gKiAyO1xufVxuXG4vKipcbiAqIEVuY29kZSBlbmNvZGVzIGBzcmNgIGludG8gYGVuY29kZWRMZW4oc3JjLmxlbmd0aClgIGJ5dGVzLlxuICogQHBhcmFtIHNyY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlKHNyYzogVWludDhBcnJheSk6IFVpbnQ4QXJyYXkge1xuICBjb25zdCBkc3QgPSBuZXcgVWludDhBcnJheShlbmNvZGVkTGVuKHNyYy5sZW5ndGgpKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkc3QubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB2ID0gc3JjW2ldO1xuICAgIGRzdFtpICogMl0gPSBoZXh0YWJsZVt2ID4+IDRdO1xuICAgIGRzdFtpICogMiArIDFdID0gaGV4dGFibGVbdiAmIDB4MGZdO1xuICB9XG4gIHJldHVybiBkc3Q7XG59XG5cbi8qKlxuICogRW5jb2RlVG9TdHJpbmcgcmV0dXJucyB0aGUgaGV4YWRlY2ltYWwgZW5jb2Rpbmcgb2YgYHNyY2AuXG4gKiBAcGFyYW0gc3JjXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGVUb1N0cmluZyhzcmM6IFVpbnQ4QXJyYXkpOiBzdHJpbmcge1xuICByZXR1cm4gbmV3IFRleHREZWNvZGVyKCkuZGVjb2RlKGVuY29kZShzcmMpKTtcbn1cblxuLyoqXG4gKiBEZWNvZGUgZGVjb2RlcyBgc3JjYCBpbnRvIGBkZWNvZGVkTGVuKHNyYy5sZW5ndGgpYCBieXRlc1xuICogSWYgdGhlIGlucHV0IGlzIG1hbGZvcm1lZCBhbiBlcnJvciB3aWxsIGJlIHRocm93blxuICogdGhlIGVycm9yLlxuICogQHBhcmFtIHNyY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlKHNyYzogVWludDhBcnJheSk6IFVpbnQ4QXJyYXkge1xuICBjb25zdCBkc3QgPSBuZXcgVWludDhBcnJheShkZWNvZGVkTGVuKHNyYy5sZW5ndGgpKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkc3QubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhID0gZnJvbUhleENoYXIoc3JjW2kgKiAyXSk7XG4gICAgY29uc3QgYiA9IGZyb21IZXhDaGFyKHNyY1tpICogMiArIDFdKTtcbiAgICBkc3RbaV0gPSAoYSA8PCA0KSB8IGI7XG4gIH1cblxuICBpZiAoc3JjLmxlbmd0aCAlIDIgPT0gMSkge1xuICAgIC8vIENoZWNrIGZvciBpbnZhbGlkIGNoYXIgYmVmb3JlIHJlcG9ydGluZyBiYWQgbGVuZ3RoLFxuICAgIC8vIHNpbmNlIHRoZSBpbnZhbGlkIGNoYXIgKGlmIHByZXNlbnQpIGlzIGFuIGVhcmxpZXIgcHJvYmxlbS5cbiAgICBmcm9tSGV4Q2hhcihzcmNbZHN0Lmxlbmd0aCAqIDJdKTtcbiAgICB0aHJvdyBlcnJMZW5ndGgoKTtcbiAgfVxuXG4gIHJldHVybiBkc3Q7XG59XG5cbi8qKlxuICogRGVjb2RlZExlbiByZXR1cm5zIHRoZSBsZW5ndGggb2YgZGVjb2RpbmcgYHhgIHNvdXJjZSBieXRlcy5cbiAqIFNwZWNpZmljYWxseSwgaXQgcmV0dXJucyBgeCAvIDJgLlxuICogQHBhcmFtIHhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZWRMZW4oeDogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIHggPj4+IDE7XG59XG5cbi8qKlxuICogRGVjb2RlU3RyaW5nIHJldHVybnMgdGhlIGJ5dGVzIHJlcHJlc2VudGVkIGJ5IHRoZSBoZXhhZGVjaW1hbCBzdHJpbmcgYHNgLlxuICogRGVjb2RlU3RyaW5nIGV4cGVjdHMgdGhhdCBzcmMgY29udGFpbnMgb25seSBoZXhhZGVjaW1hbCBjaGFyYWN0ZXJzIGFuZCB0aGF0XG4gKiBzcmMgaGFzIGV2ZW4gbGVuZ3RoLlxuICogSWYgdGhlIGlucHV0IGlzIG1hbGZvcm1lZCwgRGVjb2RlU3RyaW5nIHdpbGwgdGhyb3cgYW4gZXJyb3IuXG4gKiBAcGFyYW0gcyB0aGUgYHN0cmluZ2AgdG8gZGVjb2RlIHRvIGBVaW50OEFycmF5YFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlU3RyaW5nKHM6IHN0cmluZyk6IFVpbnQ4QXJyYXkge1xuICByZXR1cm4gZGVjb2RlKG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShzKSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFBaUIsQUFBakIsZUFBaUI7QUFDakIsRUFBcUUsQUFBckUsbUVBQXFFO0FBQ3JFLEVBQXNELEFBQXRELG9EQUFzRDtBQUN0RCxFQUFxRCxBQUFyRCxtREFBcUQ7QUFDckQsRUFBaUQsQUFBakQsK0NBQWlEO0FBQ2pELEVBQTBFLEFBQTFFLHdFQUEwRTtNQUVwRSxRQUFRLE9BQU8sV0FBVyxHQUFHLE1BQU0sRUFBQyxnQkFBa0I7Z0JBRTVDLGNBQWMsQ0FBQyxJQUFZO2VBQzlCLEtBQUssRUFDZCw0QkFBOEIsUUFDeEIsV0FBVyxHQUFHLE1BQU0sS0FBSyxVQUFVO1FBQUUsSUFBSTs7O2dCQUluQyxTQUFTO2VBQ1osS0FBSyxFQUFDLG1DQUFxQzs7QUFHeEQsRUFBdUQsQUFBdkQscURBQXVEO1NB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