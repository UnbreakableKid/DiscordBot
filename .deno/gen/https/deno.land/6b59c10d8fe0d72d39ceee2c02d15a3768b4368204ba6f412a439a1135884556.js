const HEX_CHARS = "0123456789abcdef".split("");
const EXTRA = [
    -2147483648,
    8388608,
    32768,
    128
];
const SHIFT = [
    24,
    16,
    8,
    0
];
const blocks = [];
export class Sha1 {
    #blocks;
    #block;
    #start;
    #bytes;
    #hBytes;
    #finalized;
    #hashed;
    #h0 = 1732584193;
    #h1 = 4023233417;
    #h2 = 2562383102;
    #h3 = 271733878;
    #h4 = 3285377520;
    #lastByteIndex = 0;
    constructor(sharedMemory = false){
        this.init(sharedMemory);
    }
    init(sharedMemory) {
        if (sharedMemory) {
            // deno-fmt-ignore
            blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
            this.#blocks = blocks;
        } else {
            this.#blocks = [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ];
        }
        this.#h0 = 1732584193;
        this.#h1 = 4023233417;
        this.#h2 = 2562383102;
        this.#h3 = 271733878;
        this.#h4 = 3285377520;
        this.#block = this.#start = this.#bytes = this.#hBytes = 0;
        this.#finalized = this.#hashed = false;
    }
    update(message) {
        if (this.#finalized) {
            return this;
        }
        let msg;
        if (message instanceof ArrayBuffer) {
            msg = new Uint8Array(message);
        } else {
            msg = message;
        }
        let index = 0;
        const length = msg.length;
        const blocks = this.#blocks;
        while(index < length){
            let i;
            if (this.#hashed) {
                this.#hashed = false;
                blocks[0] = this.#block;
                // deno-fmt-ignore
                blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
            }
            if (typeof msg !== "string") {
                for(i = this.#start; index < length && i < 64; ++index){
                    blocks[i >> 2] |= msg[index] << SHIFT[(i++) & 3];
                }
            } else {
                for(i = this.#start; index < length && i < 64; ++index){
                    let code = msg.charCodeAt(index);
                    if (code < 128) {
                        blocks[i >> 2] |= code << SHIFT[(i++) & 3];
                    } else if (code < 2048) {
                        blocks[i >> 2] |= (192 | code >> 6) << SHIFT[(i++) & 3];
                        blocks[i >> 2] |= (128 | code & 63) << SHIFT[(i++) & 3];
                    } else if (code < 55296 || code >= 57344) {
                        blocks[i >> 2] |= (224 | code >> 12) << SHIFT[(i++) & 3];
                        blocks[i >> 2] |= (128 | code >> 6 & 63) << SHIFT[(i++) & 3];
                        blocks[i >> 2] |= (128 | code & 63) << SHIFT[(i++) & 3];
                    } else {
                        code = 65536 + ((code & 1023) << 10 | msg.charCodeAt(++index) & 1023);
                        blocks[i >> 2] |= (240 | code >> 18) << SHIFT[(i++) & 3];
                        blocks[i >> 2] |= (128 | code >> 12 & 63) << SHIFT[(i++) & 3];
                        blocks[i >> 2] |= (128 | code >> 6 & 63) << SHIFT[(i++) & 3];
                        blocks[i >> 2] |= (128 | code & 63) << SHIFT[(i++) & 3];
                    }
                }
            }
            this.#lastByteIndex = i;
            this.#bytes += i - this.#start;
            if (i >= 64) {
                this.#block = blocks[16];
                this.#start = i - 64;
                this.hash();
                this.#hashed = true;
            } else {
                this.#start = i;
            }
        }
        if (this.#bytes > 4294967295) {
            this.#hBytes += this.#bytes / 4294967296 >>> 0;
            this.#bytes = this.#bytes >>> 0;
        }
        return this;
    }
    finalize() {
        if (this.#finalized) {
            return;
        }
        this.#finalized = true;
        const blocks = this.#blocks;
        const i = this.#lastByteIndex;
        blocks[16] = this.#block;
        blocks[i >> 2] |= EXTRA[i & 3];
        this.#block = blocks[16];
        if (i >= 56) {
            if (!this.#hashed) {
                this.hash();
            }
            blocks[0] = this.#block;
            // deno-fmt-ignore
            blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
        }
        blocks[14] = this.#hBytes << 3 | this.#bytes >>> 29;
        blocks[15] = this.#bytes << 3;
        this.hash();
    }
    hash() {
        let a = this.#h0;
        let b = this.#h1;
        let c = this.#h2;
        let d = this.#h3;
        let e = this.#h4;
        let f;
        let j;
        let t;
        const blocks = this.#blocks;
        for(j = 16; j < 80; ++j){
            t = blocks[j - 3] ^ blocks[j - 8] ^ blocks[j - 14] ^ blocks[j - 16];
            blocks[j] = t << 1 | t >>> 31;
        }
        for(j = 0; j < 20; j += 5){
            f = b & c | ~b & d;
            t = a << 5 | a >>> 27;
            e = t + f + e + 1518500249 + blocks[j] >>> 0;
            b = b << 30 | b >>> 2;
            f = a & b | ~a & c;
            t = e << 5 | e >>> 27;
            d = t + f + d + 1518500249 + blocks[j + 1] >>> 0;
            a = a << 30 | a >>> 2;
            f = e & a | ~e & b;
            t = d << 5 | d >>> 27;
            c = t + f + c + 1518500249 + blocks[j + 2] >>> 0;
            e = e << 30 | e >>> 2;
            f = d & e | ~d & a;
            t = c << 5 | c >>> 27;
            b = t + f + b + 1518500249 + blocks[j + 3] >>> 0;
            d = d << 30 | d >>> 2;
            f = c & d | ~c & e;
            t = b << 5 | b >>> 27;
            a = t + f + a + 1518500249 + blocks[j + 4] >>> 0;
            c = c << 30 | c >>> 2;
        }
        for(; j < 40; j += 5){
            f = b ^ c ^ d;
            t = a << 5 | a >>> 27;
            e = t + f + e + 1859775393 + blocks[j] >>> 0;
            b = b << 30 | b >>> 2;
            f = a ^ b ^ c;
            t = e << 5 | e >>> 27;
            d = t + f + d + 1859775393 + blocks[j + 1] >>> 0;
            a = a << 30 | a >>> 2;
            f = e ^ a ^ b;
            t = d << 5 | d >>> 27;
            c = t + f + c + 1859775393 + blocks[j + 2] >>> 0;
            e = e << 30 | e >>> 2;
            f = d ^ e ^ a;
            t = c << 5 | c >>> 27;
            b = t + f + b + 1859775393 + blocks[j + 3] >>> 0;
            d = d << 30 | d >>> 2;
            f = c ^ d ^ e;
            t = b << 5 | b >>> 27;
            a = t + f + a + 1859775393 + blocks[j + 4] >>> 0;
            c = c << 30 | c >>> 2;
        }
        for(; j < 60; j += 5){
            f = b & c | b & d | c & d;
            t = a << 5 | a >>> 27;
            e = t + f + e - 1894007588 + blocks[j] >>> 0;
            b = b << 30 | b >>> 2;
            f = a & b | a & c | b & c;
            t = e << 5 | e >>> 27;
            d = t + f + d - 1894007588 + blocks[j + 1] >>> 0;
            a = a << 30 | a >>> 2;
            f = e & a | e & b | a & b;
            t = d << 5 | d >>> 27;
            c = t + f + c - 1894007588 + blocks[j + 2] >>> 0;
            e = e << 30 | e >>> 2;
            f = d & e | d & a | e & a;
            t = c << 5 | c >>> 27;
            b = t + f + b - 1894007588 + blocks[j + 3] >>> 0;
            d = d << 30 | d >>> 2;
            f = c & d | c & e | d & e;
            t = b << 5 | b >>> 27;
            a = t + f + a - 1894007588 + blocks[j + 4] >>> 0;
            c = c << 30 | c >>> 2;
        }
        for(; j < 80; j += 5){
            f = b ^ c ^ d;
            t = a << 5 | a >>> 27;
            e = t + f + e - 899497514 + blocks[j] >>> 0;
            b = b << 30 | b >>> 2;
            f = a ^ b ^ c;
            t = e << 5 | e >>> 27;
            d = t + f + d - 899497514 + blocks[j + 1] >>> 0;
            a = a << 30 | a >>> 2;
            f = e ^ a ^ b;
            t = d << 5 | d >>> 27;
            c = t + f + c - 899497514 + blocks[j + 2] >>> 0;
            e = e << 30 | e >>> 2;
            f = d ^ e ^ a;
            t = c << 5 | c >>> 27;
            b = t + f + b - 899497514 + blocks[j + 3] >>> 0;
            d = d << 30 | d >>> 2;
            f = c ^ d ^ e;
            t = b << 5 | b >>> 27;
            a = t + f + a - 899497514 + blocks[j + 4] >>> 0;
            c = c << 30 | c >>> 2;
        }
        this.#h0 = this.#h0 + a >>> 0;
        this.#h1 = this.#h1 + b >>> 0;
        this.#h2 = this.#h2 + c >>> 0;
        this.#h3 = this.#h3 + d >>> 0;
        this.#h4 = this.#h4 + e >>> 0;
    }
    hex() {
        this.finalize();
        const h0 = this.#h0;
        const h1 = this.#h1;
        const h2 = this.#h2;
        const h3 = this.#h3;
        const h4 = this.#h4;
        return HEX_CHARS[h0 >> 28 & 15] + HEX_CHARS[h0 >> 24 & 15] + HEX_CHARS[h0 >> 20 & 15] + HEX_CHARS[h0 >> 16 & 15] + HEX_CHARS[h0 >> 12 & 15] + HEX_CHARS[h0 >> 8 & 15] + HEX_CHARS[h0 >> 4 & 15] + HEX_CHARS[h0 & 15] + HEX_CHARS[h1 >> 28 & 15] + HEX_CHARS[h1 >> 24 & 15] + HEX_CHARS[h1 >> 20 & 15] + HEX_CHARS[h1 >> 16 & 15] + HEX_CHARS[h1 >> 12 & 15] + HEX_CHARS[h1 >> 8 & 15] + HEX_CHARS[h1 >> 4 & 15] + HEX_CHARS[h1 & 15] + HEX_CHARS[h2 >> 28 & 15] + HEX_CHARS[h2 >> 24 & 15] + HEX_CHARS[h2 >> 20 & 15] + HEX_CHARS[h2 >> 16 & 15] + HEX_CHARS[h2 >> 12 & 15] + HEX_CHARS[h2 >> 8 & 15] + HEX_CHARS[h2 >> 4 & 15] + HEX_CHARS[h2 & 15] + HEX_CHARS[h3 >> 28 & 15] + HEX_CHARS[h3 >> 24 & 15] + HEX_CHARS[h3 >> 20 & 15] + HEX_CHARS[h3 >> 16 & 15] + HEX_CHARS[h3 >> 12 & 15] + HEX_CHARS[h3 >> 8 & 15] + HEX_CHARS[h3 >> 4 & 15] + HEX_CHARS[h3 & 15] + HEX_CHARS[h4 >> 28 & 15] + HEX_CHARS[h4 >> 24 & 15] + HEX_CHARS[h4 >> 20 & 15] + HEX_CHARS[h4 >> 16 & 15] + HEX_CHARS[h4 >> 12 & 15] + HEX_CHARS[h4 >> 8 & 15] + HEX_CHARS[h4 >> 4 & 15] + HEX_CHARS[h4 & 15];
    }
    toString() {
        return this.hex();
    }
    digest() {
        this.finalize();
        const h0 = this.#h0;
        const h1 = this.#h1;
        const h2 = this.#h2;
        const h3 = this.#h3;
        const h4 = this.#h4;
        return [
            h0 >> 24 & 255,
            h0 >> 16 & 255,
            h0 >> 8 & 255,
            h0 & 255,
            h1 >> 24 & 255,
            h1 >> 16 & 255,
            h1 >> 8 & 255,
            h1 & 255,
            h2 >> 24 & 255,
            h2 >> 16 & 255,
            h2 >> 8 & 255,
            h2 & 255,
            h3 >> 24 & 255,
            h3 >> 16 & 255,
            h3 >> 8 & 255,
            h3 & 255,
            h4 >> 24 & 255,
            h4 >> 16 & 255,
            h4 >> 8 & 255,
            h4 & 255, 
        ];
    }
    array() {
        return this.digest();
    }
    arrayBuffer() {
        this.finalize();
        const buffer = new ArrayBuffer(20);
        const dataView = new DataView(buffer);
        dataView.setUint32(0, this.#h0);
        dataView.setUint32(4, this.#h1);
        dataView.setUint32(8, this.#h2);
        dataView.setUint32(12, this.#h3);
        dataView.setUint32(16, this.#h4);
        return buffer;
    }
}
export class HmacSha1 extends Sha1 {
    #sharedMemory;
    #inner;
    #oKeyPad;
    constructor(secretKey, sharedMemory = false){
        super(sharedMemory);
        let key;
        if (typeof secretKey === "string") {
            const bytes = [];
            const length = secretKey.length;
            let index = 0;
            for(let i = 0; i < length; i++){
                let code = secretKey.charCodeAt(i);
                if (code < 128) {
                    bytes[index++] = code;
                } else if (code < 2048) {
                    bytes[index++] = 192 | code >> 6;
                    bytes[index++] = 128 | code & 63;
                } else if (code < 55296 || code >= 57344) {
                    bytes[index++] = 224 | code >> 12;
                    bytes[index++] = 128 | code >> 6 & 63;
                    bytes[index++] = 128 | code & 63;
                } else {
                    code = 65536 + ((code & 1023) << 10 | secretKey.charCodeAt(++i) & 1023);
                    bytes[index++] = 240 | code >> 18;
                    bytes[index++] = 128 | code >> 12 & 63;
                    bytes[index++] = 128 | code >> 6 & 63;
                    bytes[index++] = 128 | code & 63;
                }
            }
            key = bytes;
        } else {
            if (secretKey instanceof ArrayBuffer) {
                key = new Uint8Array(secretKey);
            } else {
                key = secretKey;
            }
        }
        if (key.length > 64) {
            key = new Sha1(true).update(key).array();
        }
        const oKeyPad = [];
        const iKeyPad = [];
        for(let i = 0; i < 64; i++){
            const b = key[i] || 0;
            oKeyPad[i] = 92 ^ b;
            iKeyPad[i] = 54 ^ b;
        }
        this.update(iKeyPad);
        this.#oKeyPad = oKeyPad;
        this.#inner = true;
        this.#sharedMemory = sharedMemory;
    }
    finalize() {
        super.finalize();
        if (this.#inner) {
            this.#inner = false;
            const innerHash = this.array();
            super.init(this.#sharedMemory);
            this.update(this.#oKeyPad);
            this.update(innerHash);
            super.finalize();
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NS4wL2hhc2gvc2hhMS50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMSB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8qXG4gKiBbanMtc2hhMV17QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2VtbjE3OC9qcy1zaGExfVxuICpcbiAqIEB2ZXJzaW9uIDAuNi4wXG4gKiBAYXV0aG9yIENoZW4sIFlpLUN5dWFuIFtlbW4xNzhAZ21haWwuY29tXVxuICogQGNvcHlyaWdodCBDaGVuLCBZaS1DeXVhbiAyMDE0LTIwMTdcbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbmV4cG9ydCB0eXBlIE1lc3NhZ2UgPSBzdHJpbmcgfCBudW1iZXJbXSB8IEFycmF5QnVmZmVyO1xuXG5jb25zdCBIRVhfQ0hBUlMgPSBcIjAxMjM0NTY3ODlhYmNkZWZcIi5zcGxpdChcIlwiKTtcbmNvbnN0IEVYVFJBID0gWy0yMTQ3NDgzNjQ4LCA4Mzg4NjA4LCAzMjc2OCwgMTI4XSBhcyBjb25zdDtcbmNvbnN0IFNISUZUID0gWzI0LCAxNiwgOCwgMF0gYXMgY29uc3Q7XG5cbmNvbnN0IGJsb2NrczogbnVtYmVyW10gPSBbXTtcblxuZXhwb3J0IGNsYXNzIFNoYTEge1xuICAjYmxvY2tzITogbnVtYmVyW107XG4gICNibG9jayE6IG51bWJlcjtcbiAgI3N0YXJ0ITogbnVtYmVyO1xuICAjYnl0ZXMhOiBudW1iZXI7XG4gICNoQnl0ZXMhOiBudW1iZXI7XG4gICNmaW5hbGl6ZWQhOiBib29sZWFuO1xuICAjaGFzaGVkITogYm9vbGVhbjtcblxuICAjaDAgPSAweDY3NDUyMzAxO1xuICAjaDEgPSAweGVmY2RhYjg5O1xuICAjaDIgPSAweDk4YmFkY2ZlO1xuICAjaDMgPSAweDEwMzI1NDc2O1xuICAjaDQgPSAweGMzZDJlMWYwO1xuICAjbGFzdEJ5dGVJbmRleCA9IDA7XG5cbiAgY29uc3RydWN0b3Ioc2hhcmVkTWVtb3J5ID0gZmFsc2UpIHtcbiAgICB0aGlzLmluaXQoc2hhcmVkTWVtb3J5KTtcbiAgfVxuICBwcm90ZWN0ZWQgaW5pdChzaGFyZWRNZW1vcnk6IGJvb2xlYW4pIHtcbiAgICBpZiAoc2hhcmVkTWVtb3J5KSB7XG4gICAgICAvLyBkZW5vLWZtdC1pZ25vcmVcbiAgICAgIGJsb2Nrc1swXSA9IGJsb2Nrc1sxNl0gPSBibG9ja3NbMV0gPSBibG9ja3NbMl0gPSBibG9ja3NbM10gPSBibG9ja3NbNF0gPSBibG9ja3NbNV0gPSBibG9ja3NbNl0gPSBibG9ja3NbN10gPSBibG9ja3NbOF0gPSBibG9ja3NbOV0gPSBibG9ja3NbMTBdID0gYmxvY2tzWzExXSA9IGJsb2Nrc1sxMl0gPSBibG9ja3NbMTNdID0gYmxvY2tzWzE0XSA9IGJsb2Nrc1sxNV0gPSAwO1xuICAgICAgdGhpcy4jYmxvY2tzID0gYmxvY2tzO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiNibG9ja3MgPSBbMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF07XG4gICAgfVxuXG4gICAgdGhpcy4jaDAgPSAweDY3NDUyMzAxO1xuICAgIHRoaXMuI2gxID0gMHhlZmNkYWI4OTtcbiAgICB0aGlzLiNoMiA9IDB4OThiYWRjZmU7XG4gICAgdGhpcy4jaDMgPSAweDEwMzI1NDc2O1xuICAgIHRoaXMuI2g0ID0gMHhjM2QyZTFmMDtcblxuICAgIHRoaXMuI2Jsb2NrID0gdGhpcy4jc3RhcnQgPSB0aGlzLiNieXRlcyA9IHRoaXMuI2hCeXRlcyA9IDA7XG4gICAgdGhpcy4jZmluYWxpemVkID0gdGhpcy4jaGFzaGVkID0gZmFsc2U7XG4gIH1cbiAgdXBkYXRlKG1lc3NhZ2U6IE1lc3NhZ2UpOiB0aGlzIHtcbiAgICBpZiAodGhpcy4jZmluYWxpemVkKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBsZXQgbXNnOiBzdHJpbmcgfCBudW1iZXJbXSB8IFVpbnQ4QXJyYXkgfCB1bmRlZmluZWQ7XG4gICAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgbXNnID0gbmV3IFVpbnQ4QXJyYXkobWVzc2FnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1zZyA9IG1lc3NhZ2U7XG4gICAgfVxuXG4gICAgbGV0IGluZGV4ID0gMDtcbiAgICBjb25zdCBsZW5ndGggPSBtc2cubGVuZ3RoO1xuICAgIGNvbnN0IGJsb2NrcyA9IHRoaXMuI2Jsb2NrcztcblxuICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgbGV0IGk6IG51bWJlcjtcbiAgICAgIGlmICh0aGlzLiNoYXNoZWQpIHtcbiAgICAgICAgdGhpcy4jaGFzaGVkID0gZmFsc2U7XG4gICAgICAgIGJsb2Nrc1swXSA9IHRoaXMuI2Jsb2NrO1xuICAgICAgICAvLyBkZW5vLWZtdC1pZ25vcmVcbiAgICAgICAgYmxvY2tzWzE2XSA9IGJsb2Nrc1sxXSA9IGJsb2Nrc1syXSA9IGJsb2Nrc1szXSA9IGJsb2Nrc1s0XSA9IGJsb2Nrc1s1XSA9IGJsb2Nrc1s2XSA9IGJsb2Nrc1s3XSA9IGJsb2Nrc1s4XSA9IGJsb2Nrc1s5XSA9IGJsb2Nrc1sxMF0gPSBibG9ja3NbMTFdID0gYmxvY2tzWzEyXSA9IGJsb2Nrc1sxM10gPSBibG9ja3NbMTRdID0gYmxvY2tzWzE1XSA9IDA7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgbXNnICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGZvciAoaSA9IHRoaXMuI3N0YXJ0OyBpbmRleCA8IGxlbmd0aCAmJiBpIDwgNjQ7ICsraW5kZXgpIHtcbiAgICAgICAgICBibG9ja3NbaSA+PiAyXSB8PSBtc2dbaW5kZXhdIDw8IFNISUZUW2krKyAmIDNdO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGkgPSB0aGlzLiNzdGFydDsgaW5kZXggPCBsZW5ndGggJiYgaSA8IDY0OyArK2luZGV4KSB7XG4gICAgICAgICAgbGV0IGNvZGUgPSBtc2cuY2hhckNvZGVBdChpbmRleCk7XG4gICAgICAgICAgaWYgKGNvZGUgPCAweDgwKSB7XG4gICAgICAgICAgICBibG9ja3NbaSA+PiAyXSB8PSBjb2RlIDw8IFNISUZUW2krKyAmIDNdO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY29kZSA8IDB4ODAwKSB7XG4gICAgICAgICAgICBibG9ja3NbaSA+PiAyXSB8PSAoMHhjMCB8IChjb2RlID4+IDYpKSA8PCBTSElGVFtpKysgJiAzXTtcbiAgICAgICAgICAgIGJsb2Nrc1tpID4+IDJdIHw9ICgweDgwIHwgKGNvZGUgJiAweDNmKSkgPDwgU0hJRlRbaSsrICYgM107XG4gICAgICAgICAgfSBlbHNlIGlmIChjb2RlIDwgMHhkODAwIHx8IGNvZGUgPj0gMHhlMDAwKSB7XG4gICAgICAgICAgICBibG9ja3NbaSA+PiAyXSB8PSAoMHhlMCB8IChjb2RlID4+IDEyKSkgPDwgU0hJRlRbaSsrICYgM107XG4gICAgICAgICAgICBibG9ja3NbaSA+PiAyXSB8PSAoMHg4MCB8ICgoY29kZSA+PiA2KSAmIDB4M2YpKSA8PCBTSElGVFtpKysgJiAzXTtcbiAgICAgICAgICAgIGJsb2Nrc1tpID4+IDJdIHw9ICgweDgwIHwgKGNvZGUgJiAweDNmKSkgPDwgU0hJRlRbaSsrICYgM107XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvZGUgPSAweDEwMDAwICtcbiAgICAgICAgICAgICAgKCgoY29kZSAmIDB4M2ZmKSA8PCAxMCkgfCAobXNnLmNoYXJDb2RlQXQoKytpbmRleCkgJiAweDNmZikpO1xuICAgICAgICAgICAgYmxvY2tzW2kgPj4gMl0gfD0gKDB4ZjAgfCAoY29kZSA+PiAxOCkpIDw8IFNISUZUW2krKyAmIDNdO1xuICAgICAgICAgICAgYmxvY2tzW2kgPj4gMl0gfD0gKDB4ODAgfCAoKGNvZGUgPj4gMTIpICYgMHgzZikpIDw8IFNISUZUW2krKyAmIDNdO1xuICAgICAgICAgICAgYmxvY2tzW2kgPj4gMl0gfD0gKDB4ODAgfCAoKGNvZGUgPj4gNikgJiAweDNmKSkgPDwgU0hJRlRbaSsrICYgM107XG4gICAgICAgICAgICBibG9ja3NbaSA+PiAyXSB8PSAoMHg4MCB8IChjb2RlICYgMHgzZikpIDw8IFNISUZUW2krKyAmIDNdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLiNsYXN0Qnl0ZUluZGV4ID0gaTtcbiAgICAgIHRoaXMuI2J5dGVzICs9IGkgLSB0aGlzLiNzdGFydDtcbiAgICAgIGlmIChpID49IDY0KSB7XG4gICAgICAgIHRoaXMuI2Jsb2NrID0gYmxvY2tzWzE2XTtcbiAgICAgICAgdGhpcy4jc3RhcnQgPSBpIC0gNjQ7XG4gICAgICAgIHRoaXMuaGFzaCgpO1xuICAgICAgICB0aGlzLiNoYXNoZWQgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy4jc3RhcnQgPSBpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy4jYnl0ZXMgPiA0Mjk0OTY3Mjk1KSB7XG4gICAgICB0aGlzLiNoQnl0ZXMgKz0gKHRoaXMuI2J5dGVzIC8gNDI5NDk2NzI5NikgPj4+IDA7XG4gICAgICB0aGlzLiNieXRlcyA9IHRoaXMuI2J5dGVzID4+PiAwO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHByb3RlY3RlZCBmaW5hbGl6ZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy4jZmluYWxpemVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuI2ZpbmFsaXplZCA9IHRydWU7XG4gICAgY29uc3QgYmxvY2tzID0gdGhpcy4jYmxvY2tzO1xuICAgIGNvbnN0IGkgPSB0aGlzLiNsYXN0Qnl0ZUluZGV4O1xuICAgIGJsb2Nrc1sxNl0gPSB0aGlzLiNibG9jaztcbiAgICBibG9ja3NbaSA+PiAyXSB8PSBFWFRSQVtpICYgM107XG4gICAgdGhpcy4jYmxvY2sgPSBibG9ja3NbMTZdO1xuICAgIGlmIChpID49IDU2KSB7XG4gICAgICBpZiAoIXRoaXMuI2hhc2hlZCkge1xuICAgICAgICB0aGlzLmhhc2goKTtcbiAgICAgIH1cbiAgICAgIGJsb2Nrc1swXSA9IHRoaXMuI2Jsb2NrO1xuICAgICAgLy8gZGVuby1mbXQtaWdub3JlXG4gICAgICBibG9ja3NbMTZdID0gYmxvY2tzWzFdID0gYmxvY2tzWzJdID0gYmxvY2tzWzNdID0gYmxvY2tzWzRdID0gYmxvY2tzWzVdID0gYmxvY2tzWzZdID0gYmxvY2tzWzddID0gYmxvY2tzWzhdID0gYmxvY2tzWzldID0gYmxvY2tzWzEwXSA9IGJsb2Nrc1sxMV0gPSBibG9ja3NbMTJdID0gYmxvY2tzWzEzXSA9IGJsb2Nrc1sxNF0gPSBibG9ja3NbMTVdID0gMDtcbiAgICB9XG4gICAgYmxvY2tzWzE0XSA9ICh0aGlzLiNoQnl0ZXMgPDwgMykgfCAodGhpcy4jYnl0ZXMgPj4+IDI5KTtcbiAgICBibG9ja3NbMTVdID0gdGhpcy4jYnl0ZXMgPDwgMztcbiAgICB0aGlzLmhhc2goKTtcbiAgfVxuXG4gIHByaXZhdGUgaGFzaCgpOiB2b2lkIHtcbiAgICBsZXQgYSA9IHRoaXMuI2gwO1xuICAgIGxldCBiID0gdGhpcy4jaDE7XG4gICAgbGV0IGMgPSB0aGlzLiNoMjtcbiAgICBsZXQgZCA9IHRoaXMuI2gzO1xuICAgIGxldCBlID0gdGhpcy4jaDQ7XG4gICAgbGV0IGY6IG51bWJlcjtcbiAgICBsZXQgajogbnVtYmVyO1xuICAgIGxldCB0OiBudW1iZXI7XG4gICAgY29uc3QgYmxvY2tzID0gdGhpcy4jYmxvY2tzO1xuXG4gICAgZm9yIChqID0gMTY7IGogPCA4MDsgKytqKSB7XG4gICAgICB0ID0gYmxvY2tzW2ogLSAzXSBeIGJsb2Nrc1tqIC0gOF0gXiBibG9ja3NbaiAtIDE0XSBeIGJsb2Nrc1tqIC0gMTZdO1xuICAgICAgYmxvY2tzW2pdID0gKHQgPDwgMSkgfCAodCA+Pj4gMzEpO1xuICAgIH1cblxuICAgIGZvciAoaiA9IDA7IGogPCAyMDsgaiArPSA1KSB7XG4gICAgICBmID0gKGIgJiBjKSB8ICh+YiAmIGQpO1xuICAgICAgdCA9IChhIDw8IDUpIHwgKGEgPj4+IDI3KTtcbiAgICAgIGUgPSAodCArIGYgKyBlICsgMTUxODUwMDI0OSArIGJsb2Nrc1tqXSkgPj4+IDA7XG4gICAgICBiID0gKGIgPDwgMzApIHwgKGIgPj4+IDIpO1xuXG4gICAgICBmID0gKGEgJiBiKSB8ICh+YSAmIGMpO1xuICAgICAgdCA9IChlIDw8IDUpIHwgKGUgPj4+IDI3KTtcbiAgICAgIGQgPSAodCArIGYgKyBkICsgMTUxODUwMDI0OSArIGJsb2Nrc1tqICsgMV0pID4+PiAwO1xuICAgICAgYSA9IChhIDw8IDMwKSB8IChhID4+PiAyKTtcblxuICAgICAgZiA9IChlICYgYSkgfCAofmUgJiBiKTtcbiAgICAgIHQgPSAoZCA8PCA1KSB8IChkID4+PiAyNyk7XG4gICAgICBjID0gKHQgKyBmICsgYyArIDE1MTg1MDAyNDkgKyBibG9ja3NbaiArIDJdKSA+Pj4gMDtcbiAgICAgIGUgPSAoZSA8PCAzMCkgfCAoZSA+Pj4gMik7XG5cbiAgICAgIGYgPSAoZCAmIGUpIHwgKH5kICYgYSk7XG4gICAgICB0ID0gKGMgPDwgNSkgfCAoYyA+Pj4gMjcpO1xuICAgICAgYiA9ICh0ICsgZiArIGIgKyAxNTE4NTAwMjQ5ICsgYmxvY2tzW2ogKyAzXSkgPj4+IDA7XG4gICAgICBkID0gKGQgPDwgMzApIHwgKGQgPj4+IDIpO1xuXG4gICAgICBmID0gKGMgJiBkKSB8ICh+YyAmIGUpO1xuICAgICAgdCA9IChiIDw8IDUpIHwgKGIgPj4+IDI3KTtcbiAgICAgIGEgPSAodCArIGYgKyBhICsgMTUxODUwMDI0OSArIGJsb2Nrc1tqICsgNF0pID4+PiAwO1xuICAgICAgYyA9IChjIDw8IDMwKSB8IChjID4+PiAyKTtcbiAgICB9XG5cbiAgICBmb3IgKDsgaiA8IDQwOyBqICs9IDUpIHtcbiAgICAgIGYgPSBiIF4gYyBeIGQ7XG4gICAgICB0ID0gKGEgPDwgNSkgfCAoYSA+Pj4gMjcpO1xuICAgICAgZSA9ICh0ICsgZiArIGUgKyAxODU5Nzc1MzkzICsgYmxvY2tzW2pdKSA+Pj4gMDtcbiAgICAgIGIgPSAoYiA8PCAzMCkgfCAoYiA+Pj4gMik7XG5cbiAgICAgIGYgPSBhIF4gYiBeIGM7XG4gICAgICB0ID0gKGUgPDwgNSkgfCAoZSA+Pj4gMjcpO1xuICAgICAgZCA9ICh0ICsgZiArIGQgKyAxODU5Nzc1MzkzICsgYmxvY2tzW2ogKyAxXSkgPj4+IDA7XG4gICAgICBhID0gKGEgPDwgMzApIHwgKGEgPj4+IDIpO1xuXG4gICAgICBmID0gZSBeIGEgXiBiO1xuICAgICAgdCA9IChkIDw8IDUpIHwgKGQgPj4+IDI3KTtcbiAgICAgIGMgPSAodCArIGYgKyBjICsgMTg1OTc3NTM5MyArIGJsb2Nrc1tqICsgMl0pID4+PiAwO1xuICAgICAgZSA9IChlIDw8IDMwKSB8IChlID4+PiAyKTtcblxuICAgICAgZiA9IGQgXiBlIF4gYTtcbiAgICAgIHQgPSAoYyA8PCA1KSB8IChjID4+PiAyNyk7XG4gICAgICBiID0gKHQgKyBmICsgYiArIDE4NTk3NzUzOTMgKyBibG9ja3NbaiArIDNdKSA+Pj4gMDtcbiAgICAgIGQgPSAoZCA8PCAzMCkgfCAoZCA+Pj4gMik7XG5cbiAgICAgIGYgPSBjIF4gZCBeIGU7XG4gICAgICB0ID0gKGIgPDwgNSkgfCAoYiA+Pj4gMjcpO1xuICAgICAgYSA9ICh0ICsgZiArIGEgKyAxODU5Nzc1MzkzICsgYmxvY2tzW2ogKyA0XSkgPj4+IDA7XG4gICAgICBjID0gKGMgPDwgMzApIHwgKGMgPj4+IDIpO1xuICAgIH1cblxuICAgIGZvciAoOyBqIDwgNjA7IGogKz0gNSkge1xuICAgICAgZiA9IChiICYgYykgfCAoYiAmIGQpIHwgKGMgJiBkKTtcbiAgICAgIHQgPSAoYSA8PCA1KSB8IChhID4+PiAyNyk7XG4gICAgICBlID0gKHQgKyBmICsgZSAtIDE4OTQwMDc1ODggKyBibG9ja3Nbal0pID4+PiAwO1xuICAgICAgYiA9IChiIDw8IDMwKSB8IChiID4+PiAyKTtcblxuICAgICAgZiA9IChhICYgYikgfCAoYSAmIGMpIHwgKGIgJiBjKTtcbiAgICAgIHQgPSAoZSA8PCA1KSB8IChlID4+PiAyNyk7XG4gICAgICBkID0gKHQgKyBmICsgZCAtIDE4OTQwMDc1ODggKyBibG9ja3NbaiArIDFdKSA+Pj4gMDtcbiAgICAgIGEgPSAoYSA8PCAzMCkgfCAoYSA+Pj4gMik7XG5cbiAgICAgIGYgPSAoZSAmIGEpIHwgKGUgJiBiKSB8IChhICYgYik7XG4gICAgICB0ID0gKGQgPDwgNSkgfCAoZCA+Pj4gMjcpO1xuICAgICAgYyA9ICh0ICsgZiArIGMgLSAxODk0MDA3NTg4ICsgYmxvY2tzW2ogKyAyXSkgPj4+IDA7XG4gICAgICBlID0gKGUgPDwgMzApIHwgKGUgPj4+IDIpO1xuXG4gICAgICBmID0gKGQgJiBlKSB8IChkICYgYSkgfCAoZSAmIGEpO1xuICAgICAgdCA9IChjIDw8IDUpIHwgKGMgPj4+IDI3KTtcbiAgICAgIGIgPSAodCArIGYgKyBiIC0gMTg5NDAwNzU4OCArIGJsb2Nrc1tqICsgM10pID4+PiAwO1xuICAgICAgZCA9IChkIDw8IDMwKSB8IChkID4+PiAyKTtcblxuICAgICAgZiA9IChjICYgZCkgfCAoYyAmIGUpIHwgKGQgJiBlKTtcbiAgICAgIHQgPSAoYiA8PCA1KSB8IChiID4+PiAyNyk7XG4gICAgICBhID0gKHQgKyBmICsgYSAtIDE4OTQwMDc1ODggKyBibG9ja3NbaiArIDRdKSA+Pj4gMDtcbiAgICAgIGMgPSAoYyA8PCAzMCkgfCAoYyA+Pj4gMik7XG4gICAgfVxuXG4gICAgZm9yICg7IGogPCA4MDsgaiArPSA1KSB7XG4gICAgICBmID0gYiBeIGMgXiBkO1xuICAgICAgdCA9IChhIDw8IDUpIHwgKGEgPj4+IDI3KTtcbiAgICAgIGUgPSAodCArIGYgKyBlIC0gODk5NDk3NTE0ICsgYmxvY2tzW2pdKSA+Pj4gMDtcbiAgICAgIGIgPSAoYiA8PCAzMCkgfCAoYiA+Pj4gMik7XG5cbiAgICAgIGYgPSBhIF4gYiBeIGM7XG4gICAgICB0ID0gKGUgPDwgNSkgfCAoZSA+Pj4gMjcpO1xuICAgICAgZCA9ICh0ICsgZiArIGQgLSA4OTk0OTc1MTQgKyBibG9ja3NbaiArIDFdKSA+Pj4gMDtcbiAgICAgIGEgPSAoYSA8PCAzMCkgfCAoYSA+Pj4gMik7XG5cbiAgICAgIGYgPSBlIF4gYSBeIGI7XG4gICAgICB0ID0gKGQgPDwgNSkgfCAoZCA+Pj4gMjcpO1xuICAgICAgYyA9ICh0ICsgZiArIGMgLSA4OTk0OTc1MTQgKyBibG9ja3NbaiArIDJdKSA+Pj4gMDtcbiAgICAgIGUgPSAoZSA8PCAzMCkgfCAoZSA+Pj4gMik7XG5cbiAgICAgIGYgPSBkIF4gZSBeIGE7XG4gICAgICB0ID0gKGMgPDwgNSkgfCAoYyA+Pj4gMjcpO1xuICAgICAgYiA9ICh0ICsgZiArIGIgLSA4OTk0OTc1MTQgKyBibG9ja3NbaiArIDNdKSA+Pj4gMDtcbiAgICAgIGQgPSAoZCA8PCAzMCkgfCAoZCA+Pj4gMik7XG5cbiAgICAgIGYgPSBjIF4gZCBeIGU7XG4gICAgICB0ID0gKGIgPDwgNSkgfCAoYiA+Pj4gMjcpO1xuICAgICAgYSA9ICh0ICsgZiArIGEgLSA4OTk0OTc1MTQgKyBibG9ja3NbaiArIDRdKSA+Pj4gMDtcbiAgICAgIGMgPSAoYyA8PCAzMCkgfCAoYyA+Pj4gMik7XG4gICAgfVxuXG4gICAgdGhpcy4jaDAgPSAodGhpcy4jaDAgKyBhKSA+Pj4gMDtcbiAgICB0aGlzLiNoMSA9ICh0aGlzLiNoMSArIGIpID4+PiAwO1xuICAgIHRoaXMuI2gyID0gKHRoaXMuI2gyICsgYykgPj4+IDA7XG4gICAgdGhpcy4jaDMgPSAodGhpcy4jaDMgKyBkKSA+Pj4gMDtcbiAgICB0aGlzLiNoNCA9ICh0aGlzLiNoNCArIGUpID4+PiAwO1xuICB9XG5cbiAgaGV4KCk6IHN0cmluZyB7XG4gICAgdGhpcy5maW5hbGl6ZSgpO1xuXG4gICAgY29uc3QgaDAgPSB0aGlzLiNoMDtcbiAgICBjb25zdCBoMSA9IHRoaXMuI2gxO1xuICAgIGNvbnN0IGgyID0gdGhpcy4jaDI7XG4gICAgY29uc3QgaDMgPSB0aGlzLiNoMztcbiAgICBjb25zdCBoNCA9IHRoaXMuI2g0O1xuXG4gICAgcmV0dXJuIChcbiAgICAgIEhFWF9DSEFSU1soaDAgPj4gMjgpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMCA+PiAyNCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgwID4+IDIwKSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDAgPj4gMTYpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMCA+PiAxMikgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgwID4+IDgpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMCA+PiA0KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1toMCAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDEgPj4gMjgpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMSA+PiAyNCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgxID4+IDIwKSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDEgPj4gMTYpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMSA+PiAxMikgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgxID4+IDgpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMSA+PiA0KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1toMSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDIgPj4gMjgpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMiA+PiAyNCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgyID4+IDIwKSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDIgPj4gMTYpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMiA+PiAxMikgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgyID4+IDgpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMiA+PiA0KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1toMiAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDMgPj4gMjgpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMyA+PiAyNCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgzID4+IDIwKSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDMgPj4gMTYpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMyA+PiAxMikgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGgzID4+IDgpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoMyA+PiA0KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1toMyAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDQgPj4gMjgpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoNCA+PiAyNCkgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGg0ID4+IDIwKSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1soaDQgPj4gMTYpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoNCA+PiAxMikgJiAweDBmXSArXG4gICAgICBIRVhfQ0hBUlNbKGg0ID4+IDgpICYgMHgwZl0gK1xuICAgICAgSEVYX0NIQVJTWyhoNCA+PiA0KSAmIDB4MGZdICtcbiAgICAgIEhFWF9DSEFSU1toNCAmIDB4MGZdXG4gICAgKTtcbiAgfVxuXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuaGV4KCk7XG4gIH1cblxuICBkaWdlc3QoKTogbnVtYmVyW10ge1xuICAgIHRoaXMuZmluYWxpemUoKTtcblxuICAgIGNvbnN0IGgwID0gdGhpcy4jaDA7XG4gICAgY29uc3QgaDEgPSB0aGlzLiNoMTtcbiAgICBjb25zdCBoMiA9IHRoaXMuI2gyO1xuICAgIGNvbnN0IGgzID0gdGhpcy4jaDM7XG4gICAgY29uc3QgaDQgPSB0aGlzLiNoNDtcblxuICAgIHJldHVybiBbXG4gICAgICAoaDAgPj4gMjQpICYgMHhmZixcbiAgICAgIChoMCA+PiAxNikgJiAweGZmLFxuICAgICAgKGgwID4+IDgpICYgMHhmZixcbiAgICAgIGgwICYgMHhmZixcbiAgICAgIChoMSA+PiAyNCkgJiAweGZmLFxuICAgICAgKGgxID4+IDE2KSAmIDB4ZmYsXG4gICAgICAoaDEgPj4gOCkgJiAweGZmLFxuICAgICAgaDEgJiAweGZmLFxuICAgICAgKGgyID4+IDI0KSAmIDB4ZmYsXG4gICAgICAoaDIgPj4gMTYpICYgMHhmZixcbiAgICAgIChoMiA+PiA4KSAmIDB4ZmYsXG4gICAgICBoMiAmIDB4ZmYsXG4gICAgICAoaDMgPj4gMjQpICYgMHhmZixcbiAgICAgIChoMyA+PiAxNikgJiAweGZmLFxuICAgICAgKGgzID4+IDgpICYgMHhmZixcbiAgICAgIGgzICYgMHhmZixcbiAgICAgIChoNCA+PiAyNCkgJiAweGZmLFxuICAgICAgKGg0ID4+IDE2KSAmIDB4ZmYsXG4gICAgICAoaDQgPj4gOCkgJiAweGZmLFxuICAgICAgaDQgJiAweGZmLFxuICAgIF07XG4gIH1cblxuICBhcnJheSgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIHRoaXMuZGlnZXN0KCk7XG4gIH1cblxuICBhcnJheUJ1ZmZlcigpOiBBcnJheUJ1ZmZlciB7XG4gICAgdGhpcy5maW5hbGl6ZSgpO1xuXG4gICAgY29uc3QgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKDIwKTtcbiAgICBjb25zdCBkYXRhVmlldyA9IG5ldyBEYXRhVmlldyhidWZmZXIpO1xuICAgIGRhdGFWaWV3LnNldFVpbnQzMigwLCB0aGlzLiNoMCk7XG4gICAgZGF0YVZpZXcuc2V0VWludDMyKDQsIHRoaXMuI2gxKTtcbiAgICBkYXRhVmlldy5zZXRVaW50MzIoOCwgdGhpcy4jaDIpO1xuICAgIGRhdGFWaWV3LnNldFVpbnQzMigxMiwgdGhpcy4jaDMpO1xuICAgIGRhdGFWaWV3LnNldFVpbnQzMigxNiwgdGhpcy4jaDQpO1xuXG4gICAgcmV0dXJuIGJ1ZmZlcjtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEhtYWNTaGExIGV4dGVuZHMgU2hhMSB7XG4gICNzaGFyZWRNZW1vcnk6IGJvb2xlYW47XG4gICNpbm5lcjogYm9vbGVhbjtcbiAgI29LZXlQYWQ6IG51bWJlcltdO1xuICBjb25zdHJ1Y3RvcihzZWNyZXRLZXk6IE1lc3NhZ2UsIHNoYXJlZE1lbW9yeSA9IGZhbHNlKSB7XG4gICAgc3VwZXIoc2hhcmVkTWVtb3J5KTtcbiAgICBsZXQga2V5OiBudW1iZXJbXSB8IFVpbnQ4QXJyYXkgfCB1bmRlZmluZWQ7XG4gICAgaWYgKHR5cGVvZiBzZWNyZXRLZXkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGNvbnN0IGJ5dGVzOiBudW1iZXJbXSA9IFtdO1xuICAgICAgY29uc3QgbGVuZ3RoOiBudW1iZXIgPSBzZWNyZXRLZXkubGVuZ3RoO1xuICAgICAgbGV0IGluZGV4ID0gMDtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IGNvZGUgPSBzZWNyZXRLZXkuY2hhckNvZGVBdChpKTtcbiAgICAgICAgaWYgKGNvZGUgPCAweDgwKSB7XG4gICAgICAgICAgYnl0ZXNbaW5kZXgrK10gPSBjb2RlO1xuICAgICAgICB9IGVsc2UgaWYgKGNvZGUgPCAweDgwMCkge1xuICAgICAgICAgIGJ5dGVzW2luZGV4KytdID0gMHhjMCB8IChjb2RlID4+IDYpO1xuICAgICAgICAgIGJ5dGVzW2luZGV4KytdID0gMHg4MCB8IChjb2RlICYgMHgzZik7XG4gICAgICAgIH0gZWxzZSBpZiAoY29kZSA8IDB4ZDgwMCB8fCBjb2RlID49IDB4ZTAwMCkge1xuICAgICAgICAgIGJ5dGVzW2luZGV4KytdID0gMHhlMCB8IChjb2RlID4+IDEyKTtcbiAgICAgICAgICBieXRlc1tpbmRleCsrXSA9IDB4ODAgfCAoKGNvZGUgPj4gNikgJiAweDNmKTtcbiAgICAgICAgICBieXRlc1tpbmRleCsrXSA9IDB4ODAgfCAoY29kZSAmIDB4M2YpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvZGUgPSAweDEwMDAwICtcbiAgICAgICAgICAgICgoKGNvZGUgJiAweDNmZikgPDwgMTApIHwgKHNlY3JldEtleS5jaGFyQ29kZUF0KCsraSkgJiAweDNmZikpO1xuICAgICAgICAgIGJ5dGVzW2luZGV4KytdID0gMHhmMCB8IChjb2RlID4+IDE4KTtcbiAgICAgICAgICBieXRlc1tpbmRleCsrXSA9IDB4ODAgfCAoKGNvZGUgPj4gMTIpICYgMHgzZik7XG4gICAgICAgICAgYnl0ZXNbaW5kZXgrK10gPSAweDgwIHwgKChjb2RlID4+IDYpICYgMHgzZik7XG4gICAgICAgICAgYnl0ZXNbaW5kZXgrK10gPSAweDgwIHwgKGNvZGUgJiAweDNmKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAga2V5ID0gYnl0ZXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzZWNyZXRLZXkgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgICBrZXkgPSBuZXcgVWludDhBcnJheShzZWNyZXRLZXkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAga2V5ID0gc2VjcmV0S2V5O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoa2V5Lmxlbmd0aCA+IDY0KSB7XG4gICAgICBrZXkgPSBuZXcgU2hhMSh0cnVlKS51cGRhdGUoa2V5KS5hcnJheSgpO1xuICAgIH1cbiAgICBjb25zdCBvS2V5UGFkOiBudW1iZXJbXSA9IFtdO1xuICAgIGNvbnN0IGlLZXlQYWQ6IG51bWJlcltdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCA2NDsgaSsrKSB7XG4gICAgICBjb25zdCBiID0ga2V5W2ldIHx8IDA7XG4gICAgICBvS2V5UGFkW2ldID0gMHg1YyBeIGI7XG4gICAgICBpS2V5UGFkW2ldID0gMHgzNiBeIGI7XG4gICAgfVxuXG4gICAgdGhpcy51cGRhdGUoaUtleVBhZCk7XG4gICAgdGhpcy4jb0tleVBhZCA9IG9LZXlQYWQ7XG4gICAgdGhpcy4jaW5uZXIgPSB0cnVlO1xuICAgIHRoaXMuI3NoYXJlZE1lbW9yeSA9IHNoYXJlZE1lbW9yeTtcbiAgfVxuICBwcm90ZWN0ZWQgZmluYWxpemUoKTogdm9pZCB7XG4gICAgc3VwZXIuZmluYWxpemUoKTtcbiAgICBpZiAodGhpcy4jaW5uZXIpIHtcbiAgICAgIHRoaXMuI2lubmVyID0gZmFsc2U7XG4gICAgICBjb25zdCBpbm5lckhhc2ggPSB0aGlzLmFycmF5KCk7XG4gICAgICBzdXBlci5pbml0KHRoaXMuI3NoYXJlZE1lbW9yeSk7XG4gICAgICB0aGlzLnVwZGF0ZSh0aGlzLiNvS2V5UGFkKTtcbiAgICAgIHRoaXMudXBkYXRlKGlubmVySGFzaCk7XG4gICAgICBzdXBlci5maW5hbGl6ZSgpO1xuICAgIH1cbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJNQVlNLFNBQVMsSUFBRyxnQkFBa0IsRUFBQyxLQUFLO01BQ3BDLEtBQUs7S0FBSyxVQUFVO0lBQUUsT0FBTztJQUFFLEtBQUs7SUFBRSxHQUFHOztNQUN6QyxLQUFLO0lBQUksRUFBRTtJQUFFLEVBQUU7SUFBRSxDQUFDO0lBQUUsQ0FBQzs7TUFFckIsTUFBTTthQUVDLElBQUk7S0FDZCxNQUFNO0tBQ04sS0FBSztLQUNMLEtBQUs7S0FDTCxLQUFLO0tBQ0wsTUFBTTtLQUNOLFNBQVM7S0FDVCxNQUFNO0tBRU4sRUFBRSxHQUFHLFVBQVU7S0FDZixFQUFFLEdBQUcsVUFBVTtLQUNmLEVBQUUsR0FBRyxVQUFVO0tBQ2YsRUFBRSxHQUFHLFNBQVU7S0FDZixFQUFFLEdBQUcsVUFBVTtLQUNmLGFBQWEsR0FBRyxDQUFDO2dCQUVOLFlBQVksR0FBRyxLQUFLO2FBQ3pCLElBQUksQ0FBQyxZQUFZOztJQUVkLElBQUksQ0FBQyxZQUFxQjtZQUM5QixZQUFZO1lBQ2QsRUFBa0IsQUFBbEIsZ0JBQWtCO1lBQ2xCLE1BQU0sQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDLEVBQUUsSUFBSSxNQUFNLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDLENBQUMsSUFBSSxNQUFNLENBQUMsQ0FBQyxJQUFJLE1BQU0s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QyxNQUFNLEdBQUksR0FBSSxJQUFJLEdBQUcsRUFBSSxLQUFNLEtBQUssRUFBQyxDQUFDLE1BQUssQ0FBQzsrQkFDaEQsSUFBSSxHQUFHLEtBQU0sSUFBSSxJQUFJLElBQUksS0FBTTt3QkFDeEMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBSSxHQUFJLElBQUksSUFBSSxFQUFFLEtBQU0sS0FBSyxFQUFDLENBQUMsTUFBSyxDQUFDO3dCQUN4RCxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFJLEdBQUssSUFBSSxJQUFJLENBQUMsR0FBSSxFQUFJLEtBQU0sS0FBSyxFQUFDLENBQUMsTUFBSyxDQUFDO3dCQUNoRSxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFJLEdBQUksSUFBSSxHQUFHLEVBQUksS0FBTSxLQUFLLEVBQUMsQ0FBQyxNQUFLLENBQUM7O3dCQUV6RCxJQUFJLEdBQUcsS0FBTyxLQUNULElBQUksR0FBRyxJQUFLLEtBQUssRUFBRSxHQUFLLEdBQUcsQ0FBQyxVQUFVLEdBQUcsS0FBSyxJQUFJLElBQUs7d0JBQzVELE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUksR0FBSSxJQUFJLElBQUksRUFBRSxLQUFNLEtBQUssRUFBQyxDQUFDLE1BQUssQ0FBQzt3QkFDeEQsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBSSxHQUFLLElBQUksSUFBSSxFQUFFLEdBQUksRUFBSSxLQUFNLEtBQUssRUFBQyxDQUFDLE1BQUssQ0FBQzt3QkFDakUsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBSSxHQUFLLElBQUksSUFBSSxDQUFDLEdBQUksRUFBSSxLQUFNLEtBQUssRUFBQyxDQUFDLE1BQUssQ0FBQzt3QkFDaEUsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBSSxHQUFJLElBQUksR0FBRyxFQUFJLEtBQU0sS0FBSyxFQUFDLENBQUMsTUFBSyxDQUFDOzs7O2tCQUt6RCxhQUFhLEdBQUcsQ0FBQztrQkFD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LEdBQUksRUFBSSxJQUMzQixTQUFTLENBQUUsRUFBRSxJQUFJLEVBQUUsR0FBSSxFQUFJLElBQzNCLFNBQVMsQ0FBRSxFQUFFLElBQUksRUFBRSxHQUFJLEVBQUksSUFDM0IsU0FBUyxDQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUksRUFBSSxJQUMxQixTQUFTLENBQUUsRUFBRSxJQUFJLENBQUMsR0FBSSxFQUFJLElBQzFCLFNBQVMsQ0FBQyxFQUFFLEdBQUcsRUFBSSxJQUNuQixTQUFTLENBQUUsRUFBRSxJQUFJLEVBQUUsR0FBSSxFQUFJLElBQzNCLFNBQVMsQ0FBRSxFQUFFLElBQUksRUFBRSxHQUFJLEVBQUksSUFDM0IsU0FBUyxDQUFFLEVBQUUsSUFBSSxFQUFFLEdBQUksRUFBSSxJQUMzQixTQUFTLENBQUUsRUFBRSxJQUFJLEVBQUUsR0FBSSxFQUFJLElBQzNCLFNBQVMsQ0FBRSxFQUFFLElBQUksRUFBRSxHQUFJLEVBQUksSUFDM0IsU0FBUyxDQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUksRUFBSSxJQUMxQixTQUFTLENBQUUsRUFBRSxJQUFJLENBQUMsR0FBSSxFQUFJLElBQzFCLFNBQVMsQ0FBQyxFQUFFLEdBQUcsRUFBSSxJQUNuQixTQUFTLENBQUUsRUFBRSxJQUFJLEVBQUUsR0FBSSxFQUFJLElBQzNCLFNBQVMsQ0FBRSxFQUFFLElBQUksRUFBRSxHQUFJLEVBQUksSUFDM0IsU0FBUyxDQUFFLEVBQUUsSUFBSSxFQUFFLEdBQUksRUFBSSxJQUMzQixTQUFTLENBQUUsRUFBRSxJQUFJLEVBQUUsR0FBSSxFQUFJLElBQzNCLFNBQVMsQ0FBRSxFQUFFLElBQUksRUFBRSxHQUFJLEVBQUksSUFDM0IsU0FBUyxDQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUksRUFBSSxJQUMxQixTQUFTLENBQUUsRUFBRSxJQUFJLENBQUMsR0FBSSxFQUFJLElBQzFCLFNBQVMsQ0FBQyxFQUFFLEdBQUcsRUFBSSxJQUNuQixTQUFTLENBQUUsRUFBRSxJQUFJLEVBQUUsR0FBSSxFQUFJLElBQzNCLFNBQVMsQ0FBRSxF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