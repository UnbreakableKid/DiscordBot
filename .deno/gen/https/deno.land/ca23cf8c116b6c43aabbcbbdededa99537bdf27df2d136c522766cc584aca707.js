import adler32 from "./adler32.ts";
import { crc32 } from "./crc32.ts";
import inflate_fast from "./inffast.ts";
import inflate_table from "./inftrees.ts";
const CODES = 0;
const LENS = 1;
const DISTS = 2;
/* Public constants ==========================================================*/ /* ===========================================================================*/ /* Allowed flush values; see deflate() and inflate() below for details */ //const Z_NO_FLUSH      = 0;
//const Z_PARTIAL_FLUSH = 1;
//const Z_SYNC_FLUSH    = 2;
//const Z_FULL_FLUSH    = 3;
const Z_FINISH = 4;
const Z_BLOCK = 5;
const Z_TREES = 6;
/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */ const Z_OK = 0;
const Z_STREAM_END = 1;
const Z_NEED_DICT = 2;
//const Z_ERRNO         = -1;
const Z_STREAM_ERROR = -2;
const Z_DATA_ERROR = -3;
const Z_MEM_ERROR = -4;
const Z_BUF_ERROR = -5;
//const Z_VERSION_ERROR = -6;
/* The deflate compression method */ const Z_DEFLATED = 8;
/* STATES ====================================================================*/ /* ===========================================================================*/ const HEAD = 1; /* i: waiting for magic header */ 
const FLAGS = 2; /* i: waiting for method and flags (gzip) */ 
const TIME = 3; /* i: waiting for modification time (gzip) */ 
const OS = 4; /* i: waiting for extra flags and operating system (gzip) */ 
const EXLEN = 5; /* i: waiting for extra length (gzip) */ 
const EXTRA = 6; /* i: waiting for extra bytes (gzip) */ 
const NAME = 7; /* i: waiting for end of file name (gzip) */ 
const COMMENT = 8; /* i: waiting for end of comment (gzip) */ 
const HCRC = 9; /* i: waiting for header crc (gzip) */ 
const DICTID = 10; /* i: waiting for dictionary check value */ 
const DICT = 11; /* waiting for inflateSetDictionary() call */ 
const TYPE = 12; /* i: waiting for type bits, including last-flag bit */ 
const TYPEDO = 13; /* i: same, but skip check to exit inflate on new block */ 
const STORED = 14; /* i: waiting for stored size (length and complement) */ 
const COPY_ = 15; /* i/o: same as COPY below, but only first time in */ 
const COPY = 16; /* i/o: waiting for input or output to copy stored block */ 
const TABLE = 17; /* i: waiting for dynamic block table lengths */ 
const LENLENS = 18; /* i: waiting for code length code lengths */ 
const CODELENS = 19; /* i: waiting for length/lit and distance code lengths */ 
const LEN_ = 20; /* i: same as LEN below, but only first time in */ 
const LEN = 21; /* i: waiting for length/lit/eob code */ 
const LENEXT = 22; /* i: waiting for length extra bits */ 
const DIST = 23; /* i: waiting for distance code */ 
const DISTEXT = 24; /* i: waiting for distance extra bits */ 
const MATCH = 25; /* o: waiting for output space to copy string */ 
const LIT = 26; /* o: waiting for output space to write literal */ 
const CHECK = 27; /* i: waiting for 32-bit check value */ 
const LENGTH = 28; /* i: waiting for 32-bit length (gzip) */ 
const DONE = 29; /* finished check, done -- remain here until reset */ 
const BAD = 30; /* got a data error -- remain here until reset */ 
const MEM = 31; /* got an inflate() memory error -- remain here until reset */ 
const SYNC = 32; /* looking for synchronization bytes to restart inflate() */ 
/* ===========================================================================*/ const ENOUGH_LENS = 852;
const ENOUGH_DISTS = 592;
//const ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);
const MAX_WBITS = 15;
/* 32K LZ77 window */ const DEF_WBITS = MAX_WBITS;
function zswap32(q) {
    return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
}
export class InflateState {
    mode = 0;
    last = false;
    wrap = 0;
    havedict = false;
    flags = 0;
    dmax = 0;
    check = 0;
    total = 0;
    // TODO: may be {}
    head = null;
    /* sliding window */ wbits = 0;
    wsize = 0;
    whave = 0;
    wnext = 0;
    window = null;
    /* bit accumulator */ hold = 0;
    bits = 0;
    /* for string and stored block copying */ length = 0;
    offset = 0;
    /* for table and code decoding */ extra = 0;
    /* fixed and dynamic code tables */ lencode = null;
    distcode = null;
    lenbits = 0;
    distbits = 0;
    /* dynamic table building */ ncode = 0;
    nlen = 0;
    ndist = 0;
    have = 0;
    next = null;
    lens = new Uint16Array(320);
    work = new Uint16Array(288);
    /*
   because we don't have pointers in js, we use lencode and distcode directly
   as buffers so we don't need codes
  */ //codes = new Uint32Array(ENOUGH);       /* space for code tables */
    lendyn = null;
    distdyn = null;
    sane = 0;
    back = 0;
    was = 0;
}
export function inflateResetKeep(strm) {
    let state;
    if (!strm || !strm.state) return Z_STREAM_ERROR;
    state = strm.state;
    strm.total_in = strm.total_out = state.total = 0;
    strm.msg = ""; /*Z_NULL*/ 
    if (state.wrap) {
        /* to support ill-conceived Java test suite */ strm.adler = state.wrap & 1;
    }
    state.mode = HEAD;
    state.last = 0;
    state.havedict = 0;
    state.dmax = 32768;
    state.head = null;
    state.hold = 0;
    state.bits = 0;
    //state.lencode = state.distcode = state.next = state.codes;
    state.lencode = state.lendyn = new Uint32Array(ENOUGH_LENS);
    state.distcode = state.distdyn = new Uint32Array(ENOUGH_DISTS);
    state.sane = 1;
    state.back = -1;
    //Tracev((stderr, "inflate: reset\n"));
    return Z_OK;
}
export function inflateReset(strm) {
    let state;
    if (!strm || !strm.state) return Z_STREAM_ERROR;
    state = strm.state;
    state.wsize = 0;
    state.whave = 0;
    state.wnext = 0;
    return inflateResetKeep(strm);
}
export function inflateReset2(strm, windowBits) {
    let wrap;
    let state;
    /* get the state */ if (!strm || !strm.state) return Z_STREAM_ERROR;
    state = strm.state;
    /* extract wrap request from windowBits parameter */ if (windowBits < 0) {
        wrap = 0;
        windowBits = -windowBits;
    } else {
        wrap = (windowBits >> 4) + 1;
        if (windowBits < 48) {
            windowBits &= 15;
        }
    }
    /* set number of window bits, free window if different */ if (windowBits && (windowBits < 8 || windowBits > 15)) {
        return Z_STREAM_ERROR;
    }
    if (state.window !== null && state.wbits !== windowBits) {
        state.window = null;
    }
    /* update state and reset the rest of it */ state.wrap = wrap;
    state.wbits = windowBits;
    return inflateReset(strm);
}
export function inflateInit2(strm, windowBits) {
    let ret;
    let state;
    if (!strm) return Z_STREAM_ERROR;
    //strm.msg = Z_NULL;                 /* in case we return an error */
    state = new InflateState();
    //if (state === Z_NULL) return Z_MEM_ERROR;
    //Tracev((stderr, "inflate: allocated\n"));
    strm.state = state;
    state.window = null;
    ret = inflateReset2(strm, windowBits);
    if (ret !== Z_OK) {
        strm.state = null;
    }
    return ret;
}
export function inflateInit(strm) {
    return inflateInit2(strm, DEF_WBITS);
}
/*
 Return state with length and distance decoding tables and index sizes set to
 fixed code decoding.  Normally this returns fixed tables from inffixed.h.
 If BUILDFIXED is defined, then instead this routine builds the tables the
 first time it's called, and returns those tables the first time and
 thereafter.  This reduces the size of the code by about 2K bytes, in
 exchange for a little execution time.  However, BUILDFIXED should not be
 used for threaded applications, since the rewriting of the tables and virgin
 may not be thread-safe.
 */ let virgin = true;
let lenfix, distfix; // We have no pointers in JS, so keep tables separate
function fixedtables(state) {
    /* build fixed huffman tables if first call (may not be thread safe) */ if (virgin) {
        let sym;
        lenfix = new Uint32Array(512);
        distfix = new Uint32Array(32);
        /* literal/length table */ sym = 0;
        while(sym < 144)state.lens[sym++] = 8;
        while(sym < 256)state.lens[sym++] = 9;
        while(sym < 280)state.lens[sym++] = 7;
        while(sym < 288)state.lens[sym++] = 8;
        inflate_table(LENS, state.lens, 0, 288, lenfix, 0, state.work, {
            bits: 9
        });
        /* distance table */ sym = 0;
        while(sym < 32)state.lens[sym++] = 5;
        inflate_table(DISTS, state.lens, 0, 32, distfix, 0, state.work, {
            bits: 5
        });
        /* do this just once */ virgin = false;
    }
    state.lencode = lenfix;
    state.lenbits = 9;
    state.distcode = distfix;
    state.distbits = 5;
}
/*
 Update the window with the last wsize (normally 32K) bytes written before
 returning.  If window does not exist yet, create it.  This is only called
 when a window is already in use, or when output has been written during this
 inflate call, but the end of the deflate stream has not been reached yet.
 It is also called to create a window for dictionary data when a dictionary
 is loaded.

 Providing output buffers larger than 32K to inflate() should provide a speed
 advantage, since only the last 32K of output is copied to the sliding window
 upon return from inflate(), and since all distances after the first 32K of
 output will fall in the output data, making match copies simpler and faster.
 The advantage may be dependent on the size of the processor's data caches.
 */ function updatewindow(strm, src, end, copy) {
    let dist;
    let state = strm.state;
    /* if it hasn't been done already, allocate space for the window */ if (state.window === null) {
        state.wsize = 1 << state.wbits;
        state.wnext = 0;
        state.whave = 0;
        state.window = new Uint8Array(state.wsize);
    }
    /* copy state->wsize or less output bytes into the circular window */ if (copy >= state.wsize) {
        state.window.set(src.subarray(end - state.wsize, end), 0);
        state.wnext = 0;
        state.whave = state.wsize;
    } else {
        dist = state.wsize - state.wnext;
        if (dist > copy) {
            dist = copy;
        }
        //zmemcpy(state->window + state->wnext, end - copy, dist);
        state.window.set(src.subarray(end - copy, end - copy + dist), state.wnext);
        copy -= dist;
        if (copy) {
            //zmemcpy(state->window, end - copy, copy);
            state.window.set(src.subarray(end - copy, end), 0);
            state.wnext = copy;
            state.whave = state.wsize;
        } else {
            state.wnext += dist;
            if (state.wnext === state.wsize) state.wnext = 0;
            if (state.whave < state.wsize) state.whave += dist;
        }
    }
    return 0;
}
export function inflate(strm, flush) {
    let state;
    let input, output; // input/output buffers
    let next; /* next input INDEX */ 
    let put; /* next output INDEX */ 
    let have, left; /* available input and output */ 
    let hold; /* bit buffer */ 
    let bits; /* bits in bit buffer */ 
    let _in, _out; /* save starting available input and output */ 
    let copy; /* number of stored or match bytes to copy */ 
    let from; /* where to copy match bytes from */ 
    let from_source;
    let here = 0; /* current decoding table entry */ 
    let here_bits, here_op, here_val; // paked "here" denormalized (JS specific)
    //let last;                   /* parent table entry */
    let last_bits, last_op, last_val; // paked "last" denormalized (JS specific)
    let len; /* length to copy for repeats, bits to drop */ 
    let ret; /* return code */ 
    let hbuf = new Uint8Array(4); /* buffer for gzip header crc calculation */ 
    let opts;
    let n; // temporary let for NEED_BITS
    let order = /* permutation of code lengths */ [
        16,
        17,
        18,
        0,
        8,
        7,
        9,
        6,
        10,
        5,
        11,
        4,
        12,
        3,
        13,
        2,
        14,
        1,
        15
    ];
    if (!strm || !strm.state || !strm.output || !strm.input && strm.avail_in !== 0) {
        return Z_STREAM_ERROR;
    }
    state = strm.state;
    if (state.mode === TYPE) state.mode = TYPEDO; /* skip check */ 
    //--- LOAD() ---
    put = strm.next_out;
    output = strm.output;
    left = strm.avail_out;
    next = strm.next_in;
    input = strm.input;
    have = strm.avail_in;
    hold = state.hold;
    bits = state.bits;
    //---
    _in = have;
    _out = left;
    ret = Z_OK;
    inf_leave: // goto emulation
    for(;;){
        switch(state.mode){
            case HEAD:
                if (state.wrap === 0) {
                    state.mode = TYPEDO;
                    break;
                }
                //=== NEEDBITS(16);
                while(bits < 16){
                    if (have === 0) break inf_leave;
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                //===//
                if (state.wrap & 2 && hold === 35615) {
                    /* gzip header */ state.check = 0;
                    //=== CRC2(state.check, hold);
                    hbuf[0] = hold & 255;
                    hbuf[1] = hold >>> 8 & 255;
                    state.check = crc32(state.check, hbuf, 2, 0);
                    //===//
                    //=== INITBITS();
                    hold = 0;
                    bits = 0;
                    //===//
                    state.mode = FLAGS;
                    break;
                }
                state.flags = 0; /* expect zlib header */ 
                if (state.head) {
                    state.head.done = false;
                }
                if (!(state.wrap & 1) || /* check if zlib header allowed */ (((hold & 255) << 8) + (hold >> 8)) % 31) {
                    strm.msg = "incorrect header check";
                    state.mode = BAD;
                    break;
                }
                if ((hold & 15) !== Z_DEFLATED) {
                    strm.msg = "unknown compression method";
                    state.mode = BAD;
                    break;
                }
                //--- DROPBITS(4) ---//
                hold >>>= 4;
                bits -= 4;
                //---//
                len = (hold & 15) + 8;
                if (state.wbits === 0) {
                    state.wbits = len;
                } else if (len > state.wbits) {
                    strm.msg = "invalid window size";
                    state.mode = BAD;
                    break;
                }
                state.dmax = 1 << len;
                //Tracev((stderr, "inflate:   zlib header ok\n"));
                strm.adler = state.check = 1;
                state.mode = hold & 512 ? DICTID : TYPE;
                //=== INITBITS();
                hold = 0;
                bits = 0;
                break;
            case FLAGS:
                //=== NEEDBITS(16); */
                while(bits < 16){
                    if (have === 0) break inf_leave;
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                //===//
                state.flags = hold;
                if ((state.flags & 255) !== Z_DEFLATED) {
                    strm.msg = "unknown compression method";
                    state.mode = BAD;
                    break;
                }
                if (state.flags & 57344) {
                    strm.msg = "unknown header flags set";
                    state.mode = BAD;
                    break;
                }
                if (state.head) {
                    state.head.text = hold >> 8 & 1;
                }
                if (state.flags & 512) {
                    //=== CRC2(state.check, hold);
                    hbuf[0] = hold & 255;
                    hbuf[1] = hold >>> 8 & 255;
                    state.check = crc32(state.check, hbuf, 2, 0);
                //===//
                }
                //=== INITBITS();
                hold = 0;
                bits = 0;
                //===//
                state.mode = TIME;
            /* falls through */ case TIME:
                //=== NEEDBITS(32); */
                while(bits < 32){
                    if (have === 0) break inf_leave;
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                //===//
                if (state.head) {
                    state.head.time = hold;
                }
                if (state.flags & 512) {
                    //=== CRC4(state.check, hold)
                    hbuf[0] = hold & 255;
                    hbuf[1] = hold >>> 8 & 255;
                    hbuf[2] = hold >>> 16 & 255;
                    hbuf[3] = hold >>> 24 & 255;
                    state.check = crc32(state.check, hbuf, 4, 0);
                //===
                }
                //=== INITBITS();
                hold = 0;
                bits = 0;
                //===//
                state.mode = OS;
            /* falls through */ case OS:
                //=== NEEDBITS(16); */
                while(bits < 16){
                    if (have === 0) break inf_leave;
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                //===//
                if (state.head) {
                    state.head.xflags = hold & 255;
                    state.head.os = hold >> 8;
                }
                if (state.flags & 512) {
                    //=== CRC2(state.check, hold);
                    hbuf[0] = hold & 255;
                    hbuf[1] = hold >>> 8 & 255;
                    state.check = crc32(state.check, hbuf, 2, 0);
                //===//
                }
                //=== INITBITS();
                hold = 0;
                bits = 0;
                //===//
                state.mode = EXLEN;
            /* falls through */ case EXLEN:
                if (state.flags & 1024) {
                    //=== NEEDBITS(16); */
                    while(bits < 16){
                        if (have === 0) break inf_leave;
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    //===//
                    state.length = hold;
                    if (state.head) {
                        state.head.extra_len = hold;
                    }
                    if (state.flags & 512) {
                        //=== CRC2(state.check, hold);
                        hbuf[0] = hold & 255;
                        hbuf[1] = hold >>> 8 & 255;
                        state.check = crc32(state.check, hbuf, 2, 0);
                    //===//
                    }
                    //=== INITBITS();
                    hold = 0;
                    bits = 0;
                //===//
                } else if (state.head) {
                    state.head.extra = null;
                }
                state.mode = EXTRA;
            /* falls through */ case EXTRA:
                if (state.flags & 1024) {
                    copy = state.length;
                    if (copy > have) copy = have;
                    if (copy) {
                        if (state.head) {
                            len = state.head.extra_len - state.length;
                            if (!state.head.extra) {
                                // Use untyped array for more convenient processing later
                                state.head.extra = new Array(state.head.extra_len);
                            }
                            // extra field is limited to 65536 bytes
                            // - no need for additional size check
                            /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/ state.head.extra.set(input.subarray(next, next + copy), len);
                        //zmemcpy(state.head.extra + len, next,
                        //        len + copy > state.head.extra_max ?
                        //        state.head.extra_max - len : copy);
                        }
                        if (state.flags & 512) {
                            state.check = crc32(state.check, input, copy, next);
                        }
                        have -= copy;
                        next += copy;
                        state.length -= copy;
                    }
                    if (state.length) break inf_leave;
                }
                state.length = 0;
                state.mode = NAME;
            /* falls through */ case NAME:
                if (state.flags & 2048) {
                    if (have === 0) break inf_leave;
                    copy = 0;
                    do {
                        // TODO: 2 or 1 bytes?
                        len = input[next + copy++];
                        /* use constant limit because in js we should not preallocate memory */ if (state.head && len && state.length < 65536) {
                            state.head.name += String.fromCharCode(len);
                        }
                    }while (len && copy < have)
                    if (state.flags & 512) {
                        state.check = crc32(state.check, input, copy, next);
                    }
                    have -= copy;
                    next += copy;
                    if (len) break inf_leave;
                } else if (state.head) {
                    state.head.name = null;
                }
                state.length = 0;
                state.mode = COMMENT;
            /* falls through */ case COMMENT:
                if (state.flags & 4096) {
                    if (have === 0) break inf_leave;
                    copy = 0;
                    do {
                        len = input[next + copy++];
                        /* use constant limit because in js we should not preallocate memory */ if (state.head && len && state.length < 65536) {
                            state.head.comment += String.fromCharCode(len);
                        }
                    }while (len && copy < have)
                    if (state.flags & 512) {
                        state.check = crc32(state.check, input, copy, next);
                    }
                    have -= copy;
                    next += copy;
                    if (len) break inf_leave;
                } else if (state.head) {
                    state.head.comment = null;
                }
                state.mode = HCRC;
            /* falls through */ case HCRC:
                if (state.flags & 512) {
                    //=== NEEDBITS(16); */
                    while(bits < 16){
                        if (have === 0) break inf_leave;
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    //===//
                    if (hold !== (state.check & 65535)) {
                        strm.msg = "header crc mismatch";
                        state.mode = BAD;
                        break;
                    }
                    //=== INITBITS();
                    hold = 0;
                    bits = 0;
                //===//
                }
                if (state.head) {
                    state.head.hcrc = state.flags >> 9 & 1;
                    state.head.done = true;
                }
                strm.adler = state.check = 0;
                state.mode = TYPE;
                break;
            case DICTID:
                //=== NEEDBITS(32); */
                while(bits < 32){
                    if (have === 0) break inf_leave;
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                //===//
                strm.adler = state.check = zswap32(hold);
                //=== INITBITS();
                hold = 0;
                bits = 0;
                //===//
                state.mode = DICT;
            /* falls through */ case DICT:
                if (state.havedict === 0) {
                    //--- RESTORE() ---
                    strm.next_out = put;
                    strm.avail_out = left;
                    strm.next_in = next;
                    strm.avail_in = have;
                    state.hold = hold;
                    state.bits = bits;
                    //---
                    return Z_NEED_DICT;
                }
                strm.adler = state.check = 1;
                state.mode = TYPE;
            /* falls through */ case TYPE:
                if (flush === Z_BLOCK || flush === Z_TREES) break inf_leave;
            /* falls through */ case TYPEDO:
                if (state.last) {
                    //--- BYTEBITS() ---//
                    hold >>>= bits & 7;
                    bits -= bits & 7;
                    //---//
                    state.mode = CHECK;
                    break;
                }
                //=== NEEDBITS(3); */
                while(bits < 3){
                    if (have === 0) break inf_leave;
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                //===//
                state.last = hold & 1;
                //--- DROPBITS(1) ---//
                hold >>>= 1;
                bits -= 1;
                //---//
                switch(hold & 3){
                    case 0:
                        /* stored block */ //Tracev((stderr, "inflate:     stored block%s\n",
                        //        state.last ? " (last)" : ""));
                        state.mode = STORED;
                        break;
                    case 1:
                        /* fixed block */ fixedtables(state);
                        //Tracev((stderr, "inflate:     fixed codes block%s\n",
                        //        state.last ? " (last)" : ""));
                        state.mode = LEN_; /* decode codes */ 
                        if (flush === Z_TREES) {
                            //--- DROPBITS(2) ---//
                            hold >>>= 2;
                            bits -= 2;
                            break inf_leave;
                        }
                        break;
                    case 2:
                        /* dynamic block */ //Tracev((stderr, "inflate:     dynamic codes block%s\n",
                        //        state.last ? " (last)" : ""));
                        state.mode = TABLE;
                        break;
                    case 3:
                        strm.msg = "invalid block type";
                        state.mode = BAD;
                }
                //--- DROPBITS(2) ---//
                hold >>>= 2;
                bits -= 2;
                break;
            case STORED:
                //--- BYTEBITS() ---// /* go to byte boundary */
                hold >>>= bits & 7;
                bits -= bits & 7;
                //---//
                //=== NEEDBITS(32); */
                while(bits < 32){
                    if (have === 0) break inf_leave;
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                //===//
                if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
                    strm.msg = "invalid stored block lengths";
                    state.mode = BAD;
                    break;
                }
                state.length = hold & 65535;
                //Tracev((stderr, "inflate:       stored length %u\n",
                //        state.length));
                //=== INITBITS();
                hold = 0;
                bits = 0;
                //===//
                state.mode = COPY_;
                if (flush === Z_TREES) break inf_leave;
            /* falls through */ case COPY_:
                state.mode = COPY;
            /* falls through */ case COPY:
                copy = state.length;
                if (copy) {
                    if (copy > have) copy = have;
                    if (copy > left) copy = left;
                    if (copy === 0) break inf_leave;
                    //--- zmemcpy(put, next, copy); ---
                    output.set(input.subarray(next, next + copy), put);
                    //---//
                    have -= copy;
                    next += copy;
                    left -= copy;
                    put += copy;
                    state.length -= copy;
                    break;
                }
                //Tracev((stderr, "inflate:       stored end\n"));
                state.mode = TYPE;
                break;
            case TABLE:
                //=== NEEDBITS(14); */
                while(bits < 14){
                    if (have === 0) break inf_leave;
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                //===//
                state.nlen = (hold & 31) + 257;
                //--- DROPBITS(5) ---//
                hold >>>= 5;
                bits -= 5;
                //---//
                state.ndist = (hold & 31) + 1;
                //--- DROPBITS(5) ---//
                hold >>>= 5;
                bits -= 5;
                //---//
                state.ncode = (hold & 15) + 4;
                //--- DROPBITS(4) ---//
                hold >>>= 4;
                bits -= 4;
                //---//
                //#ifndef PKZIP_BUG_WORKAROUND
                if (state.nlen > 286 || state.ndist > 30) {
                    strm.msg = "too many length or distance symbols";
                    state.mode = BAD;
                    break;
                }
                //#endif
                //Tracev((stderr, "inflate:       table sizes ok\n"));
                state.have = 0;
                state.mode = LENLENS;
            /* falls through */ case LENLENS:
                while(state.have < state.ncode){
                    //=== NEEDBITS(3);
                    while(bits < 3){
                        if (have === 0) break inf_leave;
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    //===//
                    state.lens[order[state.have++]] = hold & 7; //BITS(3);
                    //--- DROPBITS(3) ---//
                    hold >>>= 3;
                    bits -= 3;
                //---//
                }
                while(state.have < 19){
                    state.lens[order[state.have++]] = 0;
                }
                // We have separate tables & no pointers. 2 commented lines below not needed.
                //state.next = state.codes;
                //state.lencode = state.next;
                // Switch to use dynamic table
                state.lencode = state.lendyn;
                state.lenbits = 7;
                opts = {
                    bits: state.lenbits
                };
                ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
                state.lenbits = opts.bits;
                if (ret) {
                    strm.msg = "invalid code lengths set";
                    state.mode = BAD;
                    break;
                }
                //Tracev((stderr, "inflate:       code lengths ok\n"));
                state.have = 0;
                state.mode = CODELENS;
            /* falls through */ case CODELENS:
                while(state.have < state.nlen + state.ndist){
                    for(;;){
                        here = state.lencode[hold & (1 << state.lenbits) - 1]; /*BITS(state.lenbits)*/ 
                        here_bits = here >>> 24;
                        here_op = here >>> 16 & 255;
                        here_val = here & 65535;
                        if (here_bits <= bits) break;
                        //--- PULLBYTE() ---//
                        if (have === 0) break inf_leave;
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    //---//
                    }
                    if (here_val < 16) {
                        //--- DROPBITS(here.bits) ---//
                        hold >>>= here_bits;
                        bits -= here_bits;
                        //---//
                        state.lens[state.have++] = here_val;
                    } else {
                        if (here_val === 16) {
                            //=== NEEDBITS(here.bits + 2);
                            n = here_bits + 2;
                            while(bits < n){
                                if (have === 0) break inf_leave;
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            //--- DROPBITS(here.bits) ---//
                            hold >>>= here_bits;
                            bits -= here_bits;
                            //---//
                            if (state.have === 0) {
                                strm.msg = "invalid bit length repeat";
                                state.mode = BAD;
                                break;
                            }
                            len = state.lens[state.have - 1];
                            copy = 3 + (hold & 3); //BITS(2);
                            //--- DROPBITS(2) ---//
                            hold >>>= 2;
                            bits -= 2;
                        //---//
                        } else if (here_val === 17) {
                            //=== NEEDBITS(here.bits + 3);
                            n = here_bits + 3;
                            while(bits < n){
                                if (have === 0) break inf_leave;
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            //--- DROPBITS(here.bits) ---//
                            hold >>>= here_bits;
                            bits -= here_bits;
                            //---//
                            len = 0;
                            copy = 3 + (hold & 7); //BITS(3);
                            //--- DROPBITS(3) ---//
                            hold >>>= 3;
                            bits -= 3;
                        //---//
                        } else {
                            //=== NEEDBITS(here.bits + 7);
                            n = here_bits + 7;
                            while(bits < n){
                                if (have === 0) break inf_leave;
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            //--- DROPBITS(here.bits) ---//
                            hold >>>= here_bits;
                            bits -= here_bits;
                            //---//
                            len = 0;
                            copy = 11 + (hold & 127); //BITS(7);
                            //--- DROPBITS(7) ---//
                            hold >>>= 7;
                            bits -= 7;
                        //---//
                        }
                        if (state.have + copy > state.nlen + state.ndist) {
                            strm.msg = "invalid bit length repeat";
                            state.mode = BAD;
                            break;
                        }
                        while(copy--){
                            state.lens[state.have++] = len;
                        }
                    }
                }
                /* handle error breaks in while */ if (state.mode === BAD) break;
                /* check for end-of-block code (better have one) */ if (state.lens[256] === 0) {
                    strm.msg = "invalid code -- missing end-of-block";
                    state.mode = BAD;
                    break;
                }
                /* build code tables -- note: do not change the lenbits or distbits
           values here (9 and 6) without reading the comments in inftrees.h
           concerning the ENOUGH constants, which depend on those values */ state.lenbits = 9;
                opts = {
                    bits: state.lenbits
                };
                ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
                // We have separate tables & no pointers. 2 commented lines below not needed.
                // state.next_index = opts.table_index;
                state.lenbits = opts.bits;
                // state.lencode = state.next;
                if (ret) {
                    strm.msg = "invalid literal/lengths set";
                    state.mode = BAD;
                    break;
                }
                state.distbits = 6;
                //state.distcode.copy(state.codes);
                // Switch to use dynamic table
                state.distcode = state.distdyn;
                opts = {
                    bits: state.distbits
                };
                ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
                // We have separate tables & no pointers. 2 commented lines below not needed.
                // state.next_index = opts.table_index;
                state.distbits = opts.bits;
                // state.distcode = state.next;
                if (ret) {
                    strm.msg = "invalid distances set";
                    state.mode = BAD;
                    break;
                }
                //Tracev((stderr, 'inflate:       codes ok\n'));
                state.mode = LEN_;
                if (flush === Z_TREES) break inf_leave;
            /* falls through */ case LEN_:
                state.mode = LEN;
            /* falls through */ case LEN:
                if (have >= 6 && left >= 258) {
                    //--- RESTORE() ---
                    strm.next_out = put;
                    strm.avail_out = left;
                    strm.next_in = next;
                    strm.avail_in = have;
                    state.hold = hold;
                    state.bits = bits;
                    //---
                    inflate_fast(strm, _out);
                    //--- LOAD() ---
                    put = strm.next_out;
                    output = strm.output;
                    left = strm.avail_out;
                    next = strm.next_in;
                    input = strm.input;
                    have = strm.avail_in;
                    hold = state.hold;
                    bits = state.bits;
                    //---
                    if (state.mode === TYPE) {
                        state.back = -1;
                    }
                    break;
                }
                state.back = 0;
                for(;;){
                    here = state.lencode[hold & (1 << state.lenbits) - 1]; /*BITS(state.lenbits)*/ 
                    here_bits = here >>> 24;
                    here_op = here >>> 16 & 255;
                    here_val = here & 65535;
                    if (here_bits <= bits) break;
                    //--- PULLBYTE() ---//
                    if (have === 0) break inf_leave;
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                //---//
                }
                if (here_op && (here_op & 240) === 0) {
                    last_bits = here_bits;
                    last_op = here_op;
                    last_val = here_val;
                    for(;;){
                        here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                        here_bits = here >>> 24;
                        here_op = here >>> 16 & 255;
                        here_val = here & 65535;
                        if (last_bits + here_bits <= bits) break;
                        //--- PULLBYTE() ---//
                        if (have === 0) break inf_leave;
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    //---//
                    }
                    //--- DROPBITS(last.bits) ---//
                    hold >>>= last_bits;
                    bits -= last_bits;
                    //---//
                    state.back += last_bits;
                }
                //--- DROPBITS(here.bits) ---//
                hold >>>= here_bits;
                bits -= here_bits;
                //---//
                state.back += here_bits;
                state.length = here_val;
                if (here_op === 0) {
                    //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
                    //        "inflate:         literal '%c'\n" :
                    //        "inflate:         literal 0x%02x\n", here.val));
                    state.mode = LIT;
                    break;
                }
                if (here_op & 32) {
                    //Tracevv((stderr, "inflate:         end of block\n"));
                    state.back = -1;
                    state.mode = TYPE;
                    break;
                }
                if (here_op & 64) {
                    strm.msg = "invalid literal/length code";
                    state.mode = BAD;
                    break;
                }
                state.extra = here_op & 15;
                state.mode = LENEXT;
            /* falls through */ case LENEXT:
                if (state.extra) {
                    //=== NEEDBITS(state.extra);
                    n = state.extra;
                    while(bits < n){
                        if (have === 0) break inf_leave;
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    //===//
                    state.length += hold & (1 << state.extra) - 1;
                    //--- DROPBITS(state.extra) ---//
                    hold >>>= state.extra;
                    bits -= state.extra;
                    //---//
                    state.back += state.extra;
                }
                //Tracevv((stderr, "inflate:         length %u\n", state.length));
                state.was = state.length;
                state.mode = DIST;
            /* falls through */ case DIST:
                for(;;){
                    here = state.distcode[hold & (1 << state.distbits) - 1]; /*BITS(state.distbits)*/ 
                    here_bits = here >>> 24;
                    here_op = here >>> 16 & 255;
                    here_val = here & 65535;
                    if (here_bits <= bits) break;
                    //--- PULLBYTE() ---//
                    if (have === 0) break inf_leave;
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                //---//
                }
                if ((here_op & 240) === 0) {
                    last_bits = here_bits;
                    last_op = here_op;
                    last_val = here_val;
                    for(;;){
                        here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                        here_bits = here >>> 24;
                        here_op = here >>> 16 & 255;
                        here_val = here & 65535;
                        if (last_bits + here_bits <= bits) break;
                        //--- PULLBYTE() ---//
                        if (have === 0) break inf_leave;
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    //---//
                    }
                    //--- DROPBITS(last.bits) ---//
                    hold >>>= last_bits;
                    bits -= last_bits;
                    //---//
                    state.back += last_bits;
                }
                //--- DROPBITS(here.bits) ---//
                hold >>>= here_bits;
                bits -= here_bits;
                //---//
                state.back += here_bits;
                if (here_op & 64) {
                    strm.msg = "invalid distance code";
                    state.mode = BAD;
                    break;
                }
                state.offset = here_val;
                state.extra = here_op & 15;
                state.mode = DISTEXT;
            /* falls through */ case DISTEXT:
                if (state.extra) {
                    //=== NEEDBITS(state.extra);
                    n = state.extra;
                    while(bits < n){
                        if (have === 0) break inf_leave;
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    //===//
                    state.offset += hold & (1 << state.extra) - 1;
                    //--- DROPBITS(state.extra) ---//
                    hold >>>= state.extra;
                    bits -= state.extra;
                    //---//
                    state.back += state.extra;
                }
                //#ifdef INFLATE_STRICT
                if (state.offset > state.dmax) {
                    strm.msg = "invalid distance too far back";
                    state.mode = BAD;
                    break;
                }
                //#endif
                //Tracevv((stderr, "inflate:         distance %u\n", state.offset));
                state.mode = MATCH;
            /* falls through */ case MATCH:
                if (left === 0) break inf_leave;
                copy = _out - left;
                if (state.offset > copy) {
                    /* copy from window */ copy = state.offset - copy;
                    if (copy > state.whave) {
                        if (state.sane) {
                            strm.msg = "invalid distance too far back";
                            state.mode = BAD;
                            break;
                        }
                    // (!) This block is disabled in zlib defaults,
                    // don't enable it for binary compatibility
                    //#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
                    //          Trace((stderr, "inflate.c too far\n"));
                    //          copy -= state.whave;
                    //          if (copy > state.length) { copy = state.length; }
                    //          if (copy > left) { copy = left; }
                    //          left -= copy;
                    //          state.length -= copy;
                    //          do {
                    //            output[put++] = 0;
                    //          } while (--copy);
                    //          if (state.length === 0) { state.mode = LEN; }
                    //          break;
                    //#endif
                    }
                    if (copy > state.wnext) {
                        copy -= state.wnext;
                        from = state.wsize - copy;
                    } else {
                        from = state.wnext - copy;
                    }
                    if (copy > state.length) copy = state.length;
                    from_source = state.window;
                } else {
                    /* copy from output */ from_source = output;
                    from = put - state.offset;
                    copy = state.length;
                }
                if (copy > left) copy = left;
                left -= copy;
                state.length -= copy;
                do {
                    output[put++] = from_source[from++];
                }while (--copy)
                if (state.length === 0) state.mode = LEN;
                break;
            case LIT:
                if (left === 0) break inf_leave;
                output[put++] = state.length;
                left--;
                state.mode = LEN;
                break;
            case CHECK:
                if (state.wrap) {
                    //=== NEEDBITS(32);
                    while(bits < 32){
                        if (have === 0) break inf_leave;
                        have--;
                        // Use '|' instead of '+' to make sure that result is signed
                        hold |= input[next++] << bits;
                        bits += 8;
                    }
                    //===//
                    _out -= left;
                    strm.total_out += _out;
                    state.total += _out;
                    if (_out) {
                        strm.adler = state.check = /*UPDATE(state.check, put - _out, _out);*/ (state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out));
                    }
                    _out = left;
                    // NB: crc32 stored as signed 32-bit int, zswap32 returns signed too
                    if ((state.flags ? hold : zswap32(hold)) !== state.check) {
                        strm.msg = "incorrect data check";
                        state.mode = BAD;
                        break;
                    }
                    //=== INITBITS();
                    hold = 0;
                    bits = 0;
                //===//
                //Tracev((stderr, "inflate:   check matches trailer\n"));
                }
                state.mode = LENGTH;
            /* falls through */ case LENGTH:
                if (state.wrap && state.flags) {
                    //=== NEEDBITS(32);
                    while(bits < 32){
                        if (have === 0) break inf_leave;
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    //===//
                    if (hold !== (state.total & 4294967295)) {
                        strm.msg = "incorrect length check";
                        state.mode = BAD;
                        break;
                    }
                    //=== INITBITS();
                    hold = 0;
                    bits = 0;
                //===//
                //Tracev((stderr, "inflate:   length matches trailer\n"));
                }
                state.mode = DONE;
            /* falls through */ case DONE:
                ret = Z_STREAM_END;
                break inf_leave;
            case BAD:
                ret = Z_DATA_ERROR;
                break inf_leave;
            case MEM:
                return Z_MEM_ERROR;
            case SYNC:
            /* falls through */ default:
                return Z_STREAM_ERROR;
        }
    }
    // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"
    /*
     Return from inflate(), updating the total counts and the check value.
     If there was no progress during the inflate() call, return a buffer
     error.  Call updatewindow() to create and/or update the window state.
     Note: a memory error from inflate() is non-recoverable.
   */ //--- RESTORE() ---
    strm.next_out = put;
    strm.avail_out = left;
    strm.next_in = next;
    strm.avail_in = have;
    state.hold = hold;
    state.bits = bits;
    //---
    if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH)) {
        if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
            state.mode = MEM;
            return Z_MEM_ERROR;
        }
    }
    _in -= strm.avail_in;
    _out -= strm.avail_out;
    strm.total_in += _in;
    strm.total_out += _out;
    state.total += _out;
    if (state.wrap && _out) {
        strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/ (state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out));
    }
    strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
    if ((_in === 0 && _out === 0 || flush === Z_FINISH) && ret === Z_OK) {
        ret = Z_BUF_ERROR;
    }
    return ret;
}
export function inflateEnd(strm) {
    if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
    }
    let state = strm.state;
    if (state.window) {
        state.window = null;
    }
    strm.state = null;
    return Z_OK;
}
export function inflateGetHeader(strm, head) {
    let state;
    /* check state */ if (!strm || !strm.state) return Z_STREAM_ERROR;
    state = strm.state;
    if ((state.wrap & 2) === 0) return Z_STREAM_ERROR;
    /* save header structure */ state.head = head;
    head.done = false;
    return Z_OK;
}
export function inflateSetDictionary(strm, dictionary) {
    let dictLength = dictionary.length;
    let state;
    let dictid;
    let ret;
    /* check state */ if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
    }
    state = strm.state;
    if (state.wrap !== 0 && state.mode !== DICT) {
        return Z_STREAM_ERROR;
    }
    /* check for correct dictionary identifier */ if (state.mode === DICT) {
        dictid = 1; /* adler32(0, null, 0)*/ 
        /* dictid = adler32(dictid, dictionary, dictLength); */ dictid = adler32(dictid, dictionary, dictLength, 0);
        if (dictid !== state.check) {
            return Z_DATA_ERROR;
        }
    }
    /* copy dictionary to window using updatewindow(), which will amend the
   existing dictionary if appropriate */ ret = updatewindow(strm, dictionary, dictLength, dictLength);
    if (ret) {
        state.mode = MEM;
        return Z_MEM_ERROR;
    }
    state.havedict = 1;
    // Tracev((stderr, "inflate:   dictionary set\n"));
    return Z_OK;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2NvbXByZXNzQHYwLjMuNi96bGliL3psaWIvaW5mbGF0ZS50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFkbGVyMzIgZnJvbSBcIi4vYWRsZXIzMi50c1wiO1xuaW1wb3J0IHsgY3JjMzIgfSBmcm9tIFwiLi9jcmMzMi50c1wiO1xuaW1wb3J0IGluZmxhdGVfZmFzdCBmcm9tIFwiLi9pbmZmYXN0LnRzXCI7XG5pbXBvcnQgaW5mbGF0ZV90YWJsZSBmcm9tIFwiLi9pbmZ0cmVlcy50c1wiO1xuaW1wb3J0IHR5cGUgWlN0cmVhbSBmcm9tIFwiLi96c3RyZWFtLnRzXCI7XG5cbmNvbnN0IENPREVTID0gMDtcbmNvbnN0IExFTlMgPSAxO1xuY29uc3QgRElTVFMgPSAyO1xuXG4vKiBQdWJsaWMgY29uc3RhbnRzID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ki9cblxuLyogQWxsb3dlZCBmbHVzaCB2YWx1ZXM7IHNlZSBkZWZsYXRlKCkgYW5kIGluZmxhdGUoKSBiZWxvdyBmb3IgZGV0YWlscyAqL1xuLy9jb25zdCBaX05PX0ZMVVNIICAgICAgPSAwO1xuLy9jb25zdCBaX1BBUlRJQUxfRkxVU0ggPSAxO1xuLy9jb25zdCBaX1NZTkNfRkxVU0ggICAgPSAyO1xuLy9jb25zdCBaX0ZVTExfRkxVU0ggICAgPSAzO1xuY29uc3QgWl9GSU5JU0ggPSA0O1xuY29uc3QgWl9CTE9DSyA9IDU7XG5jb25zdCBaX1RSRUVTID0gNjtcblxuLyogUmV0dXJuIGNvZGVzIGZvciB0aGUgY29tcHJlc3Npb24vZGVjb21wcmVzc2lvbiBmdW5jdGlvbnMuIE5lZ2F0aXZlIHZhbHVlc1xuICogYXJlIGVycm9ycywgcG9zaXRpdmUgdmFsdWVzIGFyZSB1c2VkIGZvciBzcGVjaWFsIGJ1dCBub3JtYWwgZXZlbnRzLlxuICovXG5jb25zdCBaX09LID0gMDtcbmNvbnN0IFpfU1RSRUFNX0VORCA9IDE7XG5jb25zdCBaX05FRURfRElDVCA9IDI7XG4vL2NvbnN0IFpfRVJSTk8gICAgICAgICA9IC0xO1xuY29uc3QgWl9TVFJFQU1fRVJST1IgPSAtMjtcbmNvbnN0IFpfREFUQV9FUlJPUiA9IC0zO1xuY29uc3QgWl9NRU1fRVJST1IgPSAtNDtcbmNvbnN0IFpfQlVGX0VSUk9SID0gLTU7XG4vL2NvbnN0IFpfVkVSU0lPTl9FUlJPUiA9IC02O1xuXG4vKiBUaGUgZGVmbGF0ZSBjb21wcmVzc2lvbiBtZXRob2QgKi9cbmNvbnN0IFpfREVGTEFURUQgPSA4O1xuXG4vKiBTVEFURVMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ki9cblxuY29uc3QgSEVBRCA9IDE7IC8qIGk6IHdhaXRpbmcgZm9yIG1hZ2ljIGhlYWRlciAqL1xuY29uc3QgRkxBR1MgPSAyOyAvKiBpOiB3YWl0aW5nIGZvciBtZXRob2QgYW5kIGZsYWdzIChnemlwKSAqL1xuY29uc3QgVElNRSA9IDM7IC8qIGk6IHdhaXRpbmcgZm9yIG1vZGlmaWNhdGlvbiB0aW1lIChnemlwKSAqL1xuY29uc3QgT1MgPSA0OyAvKiBpOiB3YWl0aW5nIGZvciBleHRyYSBmbGFncyBhbmQgb3BlcmF0aW5nIHN5c3RlbSAoZ3ppcCkgKi9cbmNvbnN0IEVYTEVOID0gNTsgLyogaTogd2FpdGluZyBmb3IgZXh0cmEgbGVuZ3RoIChnemlwKSAqL1xuY29uc3QgRVhUUkEgPSA2OyAvKiBpOiB3YWl0aW5nIGZvciBleHRyYSBieXRlcyAoZ3ppcCkgKi9cbmNvbnN0IE5BTUUgPSA3OyAvKiBpOiB3YWl0aW5nIGZvciBlbmQgb2YgZmlsZSBuYW1lIChnemlwKSAqL1xuY29uc3QgQ09NTUVOVCA9IDg7IC8qIGk6IHdhaXRpbmcgZm9yIGVuZCBvZiBjb21tZW50IChnemlwKSAqL1xuY29uc3QgSENSQyA9IDk7IC8qIGk6IHdhaXRpbmcgZm9yIGhlYWRlciBjcmMgKGd6aXApICovXG5jb25zdCBESUNUSUQgPSAxMDsgLyogaTogd2FpdGluZyBmb3IgZGljdGlvbmFyeSBjaGVjayB2YWx1ZSAqL1xuY29uc3QgRElDVCA9IDExOyAvKiB3YWl0aW5nIGZvciBpbmZsYXRlU2V0RGljdGlvbmFyeSgpIGNhbGwgKi9cbmNvbnN0IFRZUEUgPSAxMjsgLyogaTogd2FpdGluZyBmb3IgdHlwZSBiaXRzLCBpbmNsdWRpbmcgbGFzdC1mbGFnIGJpdCAqL1xuY29uc3QgVFlQRURPID0gMTM7IC8qIGk6IHNhbWUsIGJ1dCBza2lwIGNoZWNrIHRvIGV4aXQgaW5mbGF0ZSBvbiBuZXcgYmxvY2sgKi9cbmNvbnN0IFNUT1JFRCA9IDE0OyAvKiBpOiB3YWl0aW5nIGZvciBzdG9yZWQgc2l6ZSAobGVuZ3RoIGFuZCBjb21wbGVtZW50KSAqL1xuY29uc3QgQ09QWV8gPSAxNTsgLyogaS9vOiBzYW1lIGFzIENPUFkgYmVsb3csIGJ1dCBvbmx5IGZpcnN0IHRpbWUgaW4gKi9cbmNvbnN0IENPUFkgPSAxNjsgLyogaS9vOiB3YWl0aW5nIGZvciBpbnB1dCBvciBvdXRwdXQgdG8gY29weSBzdG9yZWQgYmxvY2sgKi9cbmNvbnN0IFRBQkxFID0gMTc7IC8qIGk6IHdhaXRpbmcgZm9yIGR5bmFtaWMgYmxvY2sgdGFibGUgbGVuZ3RocyAqL1xuY29uc3QgTEVOTEVOUyA9IDE4OyAvKiBpOiB3YWl0aW5nIGZvciBjb2RlIGxlbmd0aCBjb2RlIGxlbmd0aHMgKi9cbmNvbnN0IENPREVMRU5TID0gMTk7IC8qIGk6IHdhaXRpbmcgZm9yIGxlbmd0aC9saXQgYW5kIGRpc3RhbmNlIGNvZGUgbGVuZ3RocyAqL1xuY29uc3QgTEVOXyA9IDIwOyAvKiBpOiBzYW1lIGFzIExFTiBiZWxvdywgYnV0IG9ubHkgZmlyc3QgdGltZSBpbiAqL1xuY29uc3QgTEVOID0gMjE7IC8qIGk6IHdhaXRpbmcgZm9yIGxlbmd0aC9saXQvZW9iIGNvZGUgKi9cbmNvbnN0IExFTkVYVCA9IDIyOyAvKiBpOiB3YWl0aW5nIGZvciBsZW5ndGggZXh0cmEgYml0cyAqL1xuY29uc3QgRElTVCA9IDIzOyAvKiBpOiB3YWl0aW5nIGZvciBkaXN0YW5jZSBjb2RlICovXG5jb25zdCBESVNURVhUID0gMjQ7IC8qIGk6IHdhaXRpbmcgZm9yIGRpc3RhbmNlIGV4dHJhIGJpdHMgKi9cbmNvbnN0IE1BVENIID0gMjU7IC8qIG86IHdhaXRpbmcgZm9yIG91dHB1dCBzcGFjZSB0byBjb3B5IHN0cmluZyAqL1xuY29uc3QgTElUID0gMjY7IC8qIG86IHdhaXRpbmcgZm9yIG91dHB1dCBzcGFjZSB0byB3cml0ZSBsaXRlcmFsICovXG5jb25zdCBDSEVDSyA9IDI3OyAvKiBpOiB3YWl0aW5nIGZvciAzMi1iaXQgY2hlY2sgdmFsdWUgKi9cbmNvbnN0IExFTkdUSCA9IDI4OyAvKiBpOiB3YWl0aW5nIGZvciAzMi1iaXQgbGVuZ3RoIChnemlwKSAqL1xuY29uc3QgRE9ORSA9IDI5OyAvKiBmaW5pc2hlZCBjaGVjaywgZG9uZSAtLSByZW1haW4gaGVyZSB1bnRpbCByZXNldCAqL1xuY29uc3QgQkFEID0gMzA7IC8qIGdvdCBhIGRhdGEgZXJyb3IgLS0gcmVtYWluIGhlcmUgdW50aWwgcmVzZXQgKi9cbmNvbnN0IE1FTSA9IDMxOyAvKiBnb3QgYW4gaW5mbGF0ZSgpIG1lbW9yeSBlcnJvciAtLSByZW1haW4gaGVyZSB1bnRpbCByZXNldCAqL1xuY29uc3QgU1lOQyA9IDMyOyAvKiBsb29raW5nIGZvciBzeW5jaHJvbml6YXRpb24gYnl0ZXMgdG8gcmVzdGFydCBpbmZsYXRlKCkgKi9cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ki9cblxuY29uc3QgRU5PVUdIX0xFTlMgPSA4NTI7XG5jb25zdCBFTk9VR0hfRElTVFMgPSA1OTI7XG4vL2NvbnN0IEVOT1VHSCA9ICAoRU5PVUdIX0xFTlMrRU5PVUdIX0RJU1RTKTtcblxuY29uc3QgTUFYX1dCSVRTID0gMTU7XG4vKiAzMksgTFo3NyB3aW5kb3cgKi9cbmNvbnN0IERFRl9XQklUUyA9IE1BWF9XQklUUztcblxuZnVuY3Rpb24genN3YXAzMihxOiBudW1iZXIpIHtcbiAgcmV0dXJuICgoKHEgPj4+IDI0KSAmIDB4ZmYpICtcbiAgICAoKHEgPj4+IDgpICYgMHhmZjAwKSArXG4gICAgKChxICYgMHhmZjAwKSA8PCA4KSArXG4gICAgKChxICYgMHhmZikgPDwgMjQpKTtcbn1cblxuZXhwb3J0IGNsYXNzIEluZmxhdGVTdGF0ZSB7XG4gIG1vZGUgPSAwOyAvKiBjdXJyZW50IGluZmxhdGUgbW9kZSAqL1xuICBsYXN0ID0gZmFsc2U7IC8qIHRydWUgaWYgcHJvY2Vzc2luZyBsYXN0IGJsb2NrICovXG4gIHdyYXAgPSAwOyAvKiBiaXQgMCB0cnVlIGZvciB6bGliLCBiaXQgMSB0cnVlIGZvciBnemlwICovXG4gIGhhdmVkaWN0ID0gZmFsc2U7IC8qIHRydWUgaWYgZGljdGlvbmFyeSBwcm92aWRlZCAqL1xuICBmbGFncyA9IDA7IC8qIGd6aXAgaGVhZGVyIG1ldGhvZCBhbmQgZmxhZ3MgKDAgaWYgemxpYikgKi9cbiAgZG1heCA9IDA7IC8qIHpsaWIgaGVhZGVyIG1heCBkaXN0YW5jZSAoSU5GTEFURV9TVFJJQ1QpICovXG4gIGNoZWNrID0gMDsgLyogcHJvdGVjdGVkIGNvcHkgb2YgY2hlY2sgdmFsdWUgKi9cbiAgdG90YWwgPSAwOyAvKiBwcm90ZWN0ZWQgY29weSBvZiBvdXRwdXQgY291bnQgKi9cbiAgLy8gVE9ETzogbWF5IGJlIHt9XG4gIGhlYWQgPSBudWxsOyAvKiB3aGVyZSB0byBzYXZlIGd6aXAgaGVhZGVyIGluZm9ybWF0aW9uICovXG5cbiAgLyogc2xpZGluZyB3aW5kb3cgKi9cbiAgd2JpdHMgPSAwOyAvKiBsb2cgYmFzZSAyIG9mIHJlcXVlc3RlZCB3aW5kb3cgc2l6ZSAqL1xuICB3c2l6ZSA9IDA7IC8qIHdpbmRvdyBzaXplIG9yIHplcm8gaWYgbm90IHVzaW5nIHdpbmRvdyAqL1xuICB3aGF2ZSA9IDA7IC8qIHZhbGlkIGJ5dGVzIGluIHRoZSB3aW5kb3cgKi9cbiAgd25leHQgPSAwOyAvKiB3aW5kb3cgd3JpdGUgaW5kZXggKi9cbiAgd2luZG93ID0gbnVsbDsgLyogYWxsb2NhdGVkIHNsaWRpbmcgd2luZG93LCBpZiBuZWVkZWQgKi9cblxuICAvKiBiaXQgYWNjdW11bGF0b3IgKi9cbiAgaG9sZCA9IDA7IC8qIGlucHV0IGJpdCBhY2N1bXVsYXRvciAqL1xuICBiaXRzID0gMDsgLyogbnVtYmVyIG9mIGJpdHMgaW4gXCJpblwiICovXG5cbiAgLyogZm9yIHN0cmluZyBhbmQgc3RvcmVkIGJsb2NrIGNvcHlpbmcgKi9cbiAgbGVuZ3RoID0gMDsgLyogbGl0ZXJhbCBvciBsZW5ndGggb2YgZGF0YSB0byBjb3B5ICovXG4gIG9mZnNldCA9IDA7IC8qIGRpc3RhbmNlIGJhY2sgdG8gY29weSBzdHJpbmcgZnJvbSAqL1xuXG4gIC8qIGZvciB0YWJsZSBhbmQgY29kZSBkZWNvZGluZyAqL1xuICBleHRyYSA9IDA7IC8qIGV4dHJhIGJpdHMgbmVlZGVkICovXG5cbiAgLyogZml4ZWQgYW5kIGR5bmFtaWMgY29kZSB0YWJsZXMgKi9cbiAgbGVuY29kZSA9IG51bGw7IC8qIHN0YXJ0aW5nIHRhYmxlIGZvciBsZW5ndGgvbGl0ZXJhbCBjb2RlcyAqL1xuICBkaXN0Y29kZSA9IG51bGw7IC8qIHN0YXJ0aW5nIHRhYmxlIGZvciBkaXN0YW5jZSBjb2RlcyAqL1xuICBsZW5iaXRzID0gMDsgLyogaW5kZXggYml0cyBmb3IgbGVuY29kZSAqL1xuICBkaXN0Yml0cyA9IDA7IC8qIGluZGV4IGJpdHMgZm9yIGRpc3Rjb2RlICovXG5cbiAgLyogZHluYW1pYyB0YWJsZSBidWlsZGluZyAqL1xuICBuY29kZSA9IDA7IC8qIG51bWJlciBvZiBjb2RlIGxlbmd0aCBjb2RlIGxlbmd0aHMgKi9cbiAgbmxlbiA9IDA7IC8qIG51bWJlciBvZiBsZW5ndGggY29kZSBsZW5ndGhzICovXG4gIG5kaXN0ID0gMDsgLyogbnVtYmVyIG9mIGRpc3RhbmNlIGNvZGUgbGVuZ3RocyAqL1xuICBoYXZlID0gMDsgLyogbnVtYmVyIG9mIGNvZGUgbGVuZ3RocyBpbiBsZW5zW10gKi9cbiAgbmV4dCA9IG51bGw7IC8qIG5leHQgYXZhaWxhYmxlIHNwYWNlIGluIGNvZGVzW10gKi9cblxuICBsZW5zID0gbmV3IFVpbnQxNkFycmF5KDMyMCk7IC8qIHRlbXBvcmFyeSBzdG9yYWdlIGZvciBjb2RlIGxlbmd0aHMgKi9cbiAgd29yayA9IG5ldyBVaW50MTZBcnJheSgyODgpOyAvKiB3b3JrIGFyZWEgZm9yIGNvZGUgdGFibGUgYnVpbGRpbmcgKi9cblxuICAvKlxuICAgYmVjYXVzZSB3ZSBkb24ndCBoYXZlIHBvaW50ZXJzIGluIGpzLCB3ZSB1c2UgbGVuY29kZSBhbmQgZGlzdGNvZGUgZGlyZWN0bHlcbiAgIGFzIGJ1ZmZlcnMgc28gd2UgZG9uJ3QgbmVlZCBjb2Rlc1xuICAqL1xuICAvL2NvZGVzID0gbmV3IFVpbnQzMkFycmF5KEVOT1VHSCk7ICAgICAgIC8qIHNwYWNlIGZvciBjb2RlIHRhYmxlcyAqL1xuICBsZW5keW4gPSBudWxsOyAvKiBkeW5hbWljIHRhYmxlIGZvciBsZW5ndGgvbGl0ZXJhbCBjb2RlcyAoSlMgc3BlY2lmaWMpICovXG4gIGRpc3RkeW4gPSBudWxsOyAvKiBkeW5hbWljIHRhYmxlIGZvciBkaXN0YW5jZSBjb2RlcyAoSlMgc3BlY2lmaWMpICovXG4gIHNhbmUgPSAwOyAvKiBpZiBmYWxzZSwgYWxsb3cgaW52YWxpZCBkaXN0YW5jZSB0b28gZmFyICovXG4gIGJhY2sgPSAwOyAvKiBiaXRzIGJhY2sgb2YgbGFzdCB1bnByb2Nlc3NlZCBsZW5ndGgvbGl0ICovXG4gIHdhcyA9IDA7IC8qIGluaXRpYWwgbGVuZ3RoIG9mIG1hdGNoICovXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmZsYXRlUmVzZXRLZWVwKHN0cm06IFpTdHJlYW0pIHtcbiAgbGV0IHN0YXRlO1xuXG4gIGlmICghc3RybSB8fCAhc3RybS5zdGF0ZSkgcmV0dXJuIFpfU1RSRUFNX0VSUk9SO1xuICBzdGF0ZSA9IHN0cm0uc3RhdGU7XG4gIHN0cm0udG90YWxfaW4gPSBzdHJtLnRvdGFsX291dCA9IHN0YXRlLnRvdGFsID0gMDtcbiAgc3RybS5tc2cgPSBcIlwiOyAvKlpfTlVMTCovXG4gIGlmIChzdGF0ZS53cmFwKSB7XG4gICAgLyogdG8gc3VwcG9ydCBpbGwtY29uY2VpdmVkIEphdmEgdGVzdCBzdWl0ZSAqL1xuICAgIHN0cm0uYWRsZXIgPSBzdGF0ZS53cmFwICYgMTtcbiAgfVxuICBzdGF0ZS5tb2RlID0gSEVBRDtcbiAgc3RhdGUubGFzdCA9IDA7XG4gIHN0YXRlLmhhdmVkaWN0ID0gMDtcbiAgc3RhdGUuZG1heCA9IDMyNzY4O1xuICBzdGF0ZS5oZWFkID0gbnVsbCAvKlpfTlVMTCovO1xuICBzdGF0ZS5ob2xkID0gMDtcbiAgc3RhdGUuYml0cyA9IDA7XG4gIC8vc3RhdGUubGVuY29kZSA9IHN0YXRlLmRpc3Rjb2RlID0gc3RhdGUubmV4dCA9IHN0YXRlLmNvZGVzO1xuICBzdGF0ZS5sZW5jb2RlID0gc3RhdGUubGVuZHluID0gbmV3IFVpbnQzMkFycmF5KEVOT1VHSF9MRU5TKTtcbiAgc3RhdGUuZGlzdGNvZGUgPSBzdGF0ZS5kaXN0ZHluID0gbmV3IFVpbnQzMkFycmF5KEVOT1VHSF9ESVNUUyk7XG5cbiAgc3RhdGUuc2FuZSA9IDE7XG4gIHN0YXRlLmJhY2sgPSAtMTtcbiAgLy9UcmFjZXYoKHN0ZGVyciwgXCJpbmZsYXRlOiByZXNldFxcblwiKSk7XG4gIHJldHVybiBaX09LO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5mbGF0ZVJlc2V0KHN0cm06IFpTdHJlYW0pIHtcbiAgbGV0IHN0YXRlO1xuXG4gIGlmICghc3RybSB8fCAhc3RybS5zdGF0ZSkgcmV0dXJuIFpfU1RSRUFNX0VSUk9SO1xuICBzdGF0ZSA9IHN0cm0uc3RhdGU7XG4gIHN0YXRlLndzaXplID0gMDtcbiAgc3RhdGUud2hhdmUgPSAwO1xuICBzdGF0ZS53bmV4dCA9IDA7XG4gIHJldHVybiBpbmZsYXRlUmVzZXRLZWVwKHN0cm0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5mbGF0ZVJlc2V0MihzdHJtOiBhbnksIHdpbmRvd0JpdHM6IGFueSkge1xuICBsZXQgd3JhcDtcbiAgbGV0IHN0YXRlO1xuXG4gIC8qIGdldCB0aGUgc3RhdGUgKi9cbiAgaWYgKCFzdHJtIHx8ICFzdHJtLnN0YXRlKSByZXR1cm4gWl9TVFJFQU1fRVJST1I7XG4gIHN0YXRlID0gc3RybS5zdGF0ZTtcblxuICAvKiBleHRyYWN0IHdyYXAgcmVxdWVzdCBmcm9tIHdpbmRvd0JpdHMgcGFyYW1ldGVyICovXG4gIGlmICh3aW5kb3dCaXRzIDwgMCkge1xuICAgIHdyYXAgPSAwO1xuICAgIHdpbmRvd0JpdHMgPSAtd2luZG93Qml0cztcbiAgfSBlbHNlIHtcbiAgICB3cmFwID0gKHdpbmRvd0JpdHMgPj4gNCkgKyAxO1xuICAgIGlmICh3aW5kb3dCaXRzIDwgNDgpIHtcbiAgICAgIHdpbmRvd0JpdHMgJj0gMTU7XG4gICAgfVxuICB9XG5cbiAgLyogc2V0IG51bWJlciBvZiB3aW5kb3cgYml0cywgZnJlZSB3aW5kb3cgaWYgZGlmZmVyZW50ICovXG4gIGlmICh3aW5kb3dCaXRzICYmICh3aW5kb3dCaXRzIDwgOCB8fCB3aW5kb3dCaXRzID4gMTUpKSB7XG4gICAgcmV0dXJuIFpfU1RSRUFNX0VSUk9SO1xuICB9XG4gIGlmIChzdGF0ZS53aW5kb3cgIT09IG51bGwgJiYgc3RhdGUud2JpdHMgIT09IHdpbmRvd0JpdHMpIHtcbiAgICBzdGF0ZS53aW5kb3cgPSBudWxsO1xuICB9XG5cbiAgLyogdXBkYXRlIHN0YXRlIGFuZCByZXNldCB0aGUgcmVzdCBvZiBpdCAqL1xuICBzdGF0ZS53cmFwID0gd3JhcDtcbiAgc3RhdGUud2JpdHMgPSB3aW5kb3dCaXRzO1xuICByZXR1cm4gaW5mbGF0ZVJlc2V0KHN0cm0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5mbGF0ZUluaXQyKHN0cm06IFpTdHJlYW0sIHdpbmRvd0JpdHM6IGFueSkge1xuICBsZXQgcmV0O1xuICBsZXQgc3RhdGU7XG5cbiAgaWYgKCFzdHJtKSByZXR1cm4gWl9TVFJFQU1fRVJST1I7XG4gIC8vc3RybS5tc2cgPSBaX05VTEw7ICAgICAgICAgICAgICAgICAvKiBpbiBjYXNlIHdlIHJldHVybiBhbiBlcnJvciAqL1xuXG4gIHN0YXRlID0gbmV3IEluZmxhdGVTdGF0ZSgpO1xuXG4gIC8vaWYgKHN0YXRlID09PSBaX05VTEwpIHJldHVybiBaX01FTV9FUlJPUjtcbiAgLy9UcmFjZXYoKHN0ZGVyciwgXCJpbmZsYXRlOiBhbGxvY2F0ZWRcXG5cIikpO1xuICBzdHJtLnN0YXRlID0gc3RhdGU7XG4gIHN0YXRlLndpbmRvdyA9IG51bGwgLypaX05VTEwqLztcbiAgcmV0ID0gaW5mbGF0ZVJlc2V0MihzdHJtLCB3aW5kb3dCaXRzKTtcbiAgaWYgKHJldCAhPT0gWl9PSykge1xuICAgIHN0cm0uc3RhdGUgPSBudWxsIC8qWl9OVUxMKi87XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluZmxhdGVJbml0KHN0cm06IFpTdHJlYW0pIHtcbiAgcmV0dXJuIGluZmxhdGVJbml0MihzdHJtLCBERUZfV0JJVFMpO1xufVxuXG4vKlxuIFJldHVybiBzdGF0ZSB3aXRoIGxlbmd0aCBhbmQgZGlzdGFuY2UgZGVjb2RpbmcgdGFibGVzIGFuZCBpbmRleCBzaXplcyBzZXQgdG9cbiBmaXhlZCBjb2RlIGRlY29kaW5nLiAgTm9ybWFsbHkgdGhpcyByZXR1cm5zIGZpeGVkIHRhYmxlcyBmcm9tIGluZmZpeGVkLmguXG4gSWYgQlVJTERGSVhFRCBpcyBkZWZpbmVkLCB0aGVuIGluc3RlYWQgdGhpcyByb3V0aW5lIGJ1aWxkcyB0aGUgdGFibGVzIHRoZVxuIGZpcnN0IHRpbWUgaXQncyBjYWxsZWQsIGFuZCByZXR1cm5zIHRob3NlIHRhYmxlcyB0aGUgZmlyc3QgdGltZSBhbmRcbiB0aGVyZWFmdGVyLiAgVGhpcyByZWR1Y2VzIHRoZSBzaXplIG9mIHRoZSBjb2RlIGJ5IGFib3V0IDJLIGJ5dGVzLCBpblxuIGV4Y2hhbmdlIGZvciBhIGxpdHRsZSBleGVjdXRpb24gdGltZS4gIEhvd2V2ZXIsIEJVSUxERklYRUQgc2hvdWxkIG5vdCBiZVxuIHVzZWQgZm9yIHRocmVhZGVkIGFwcGxpY2F0aW9ucywgc2luY2UgdGhlIHJld3JpdGluZyBvZiB0aGUgdGFibGVzIGFuZCB2aXJnaW5cbiBtYXkgbm90IGJlIHRocmVhZC1zYWZlLlxuICovXG5sZXQgdmlyZ2luID0gdHJ1ZTtcblxubGV0IGxlbmZpeDogYW55LCBkaXN0Zml4OiBhbnk7IC8vIFdlIGhhdmUgbm8gcG9pbnRlcnMgaW4gSlMsIHNvIGtlZXAgdGFibGVzIHNlcGFyYXRlXG5cbmZ1bmN0aW9uIGZpeGVkdGFibGVzKHN0YXRlOiBhbnkpIHtcbiAgLyogYnVpbGQgZml4ZWQgaHVmZm1hbiB0YWJsZXMgaWYgZmlyc3QgY2FsbCAobWF5IG5vdCBiZSB0aHJlYWQgc2FmZSkgKi9cbiAgaWYgKHZpcmdpbikge1xuICAgIGxldCBzeW07XG5cbiAgICBsZW5maXggPSBuZXcgVWludDMyQXJyYXkoNTEyKTtcbiAgICBkaXN0Zml4ID0gbmV3IFVpbnQzMkFycmF5KDMyKTtcblxuICAgIC8qIGxpdGVyYWwvbGVuZ3RoIHRhYmxlICovXG4gICAgc3ltID0gMDtcbiAgICB3aGlsZSAoc3ltIDwgMTQ0KSBzdGF0ZS5sZW5zW3N5bSsrXSA9IDg7XG4gICAgd2hpbGUgKHN5bSA8IDI1Nikgc3RhdGUubGVuc1tzeW0rK10gPSA5O1xuICAgIHdoaWxlIChzeW0gPCAyODApIHN0YXRlLmxlbnNbc3ltKytdID0gNztcbiAgICB3aGlsZSAoc3ltIDwgMjg4KSBzdGF0ZS5sZW5zW3N5bSsrXSA9IDg7XG5cbiAgICBpbmZsYXRlX3RhYmxlKExFTlMsIHN0YXRlLmxlbnMsIDAsIDI4OCwgbGVuZml4LCAwLCBzdGF0ZS53b3JrLCB7IGJpdHM6IDkgfSk7XG5cbiAgICAvKiBkaXN0YW5jZSB0YWJsZSAqL1xuICAgIHN5bSA9IDA7XG4gICAgd2hpbGUgKHN5bSA8IDMyKSBzdGF0ZS5sZW5zW3N5bSsrXSA9IDU7XG5cbiAgICBpbmZsYXRlX3RhYmxlKFxuICAgICAgRElTVFMsXG4gICAgICBzdGF0ZS5sZW5zLFxuICAgICAgMCxcbiAgICAgIDMyLFxuICAgICAgZGlzdGZpeCxcbiAgICAgIDAsXG4gICAgICBzdGF0ZS53b3JrLFxuICAgICAgeyBiaXRzOiA1IH0sXG4gICAgKTtcblxuICAgIC8qIGRvIHRoaXMganVzdCBvbmNlICovXG4gICAgdmlyZ2luID0gZmFsc2U7XG4gIH1cblxuICBzdGF0ZS5sZW5jb2RlID0gbGVuZml4O1xuICBzdGF0ZS5sZW5iaXRzID0gOTtcbiAgc3RhdGUuZGlzdGNvZGUgPSBkaXN0Zml4O1xuICBzdGF0ZS5kaXN0Yml0cyA9IDU7XG59XG5cbi8qXG4gVXBkYXRlIHRoZSB3aW5kb3cgd2l0aCB0aGUgbGFzdCB3c2l6ZSAobm9ybWFsbHkgMzJLKSBieXRlcyB3cml0dGVuIGJlZm9yZVxuIHJldHVybmluZy4gIElmIHdpbmRvdyBkb2VzIG5vdCBleGlzdCB5ZXQsIGNyZWF0ZSBpdC4gIFRoaXMgaXMgb25seSBjYWxsZWRcbiB3aGVuIGEgd2luZG93IGlzIGFscmVhZHkgaW4gdXNlLCBvciB3aGVuIG91dHB1dCBoYXMgYmVlbiB3cml0dGVuIGR1cmluZyB0aGlzXG4gaW5mbGF0ZSBjYWxsLCBidXQgdGhlIGVuZCBvZiB0aGUgZGVmbGF0ZSBzdHJlYW0gaGFzIG5vdCBiZWVuIHJlYWNoZWQgeWV0LlxuIEl0IGlzIGFsc28gY2FsbGVkIHRvIGNyZWF0ZSBhIHdpbmRvdyBmb3IgZGljdGlvbmFyeSBkYXRhIHdoZW4gYSBkaWN0aW9uYXJ5XG4gaXMgbG9hZGVkLlxuXG4gUHJvdmlkaW5nIG91dHB1dCBidWZmZXJzIGxhcmdlciB0aGFuIDMySyB0byBpbmZsYXRlKCkgc2hvdWxkIHByb3ZpZGUgYSBzcGVlZFxuIGFkdmFudGFnZSwgc2luY2Ugb25seSB0aGUgbGFzdCAzMksgb2Ygb3V0cHV0IGlzIGNvcGllZCB0byB0aGUgc2xpZGluZyB3aW5kb3dcbiB1cG9uIHJldHVybiBmcm9tIGluZmxhdGUoKSwgYW5kIHNpbmNlIGFsbCBkaXN0YW5jZXMgYWZ0ZXIgdGhlIGZpcnN0IDMySyBvZlxuIG91dHB1dCB3aWxsIGZhbGwgaW4gdGhlIG91dHB1dCBkYXRhLCBtYWtpbmcgbWF0Y2ggY29waWVzIHNpbXBsZXIgYW5kIGZhc3Rlci5cbiBUaGUgYWR2YW50YWdlIG1heSBiZSBkZXBlbmRlbnQgb24gdGhlIHNpemUgb2YgdGhlIHByb2Nlc3NvcidzIGRhdGEgY2FjaGVzLlxuICovXG5mdW5jdGlvbiB1cGRhdGV3aW5kb3coc3RybTogWlN0cmVhbSwgc3JjOiBhbnksIGVuZDogYW55LCBjb3B5OiBhbnkpIHtcbiAgbGV0IGRpc3Q7XG4gIGxldCBzdGF0ZSA9IHN0cm0uc3RhdGU7XG5cbiAgLyogaWYgaXQgaGFzbid0IGJlZW4gZG9uZSBhbHJlYWR5LCBhbGxvY2F0ZSBzcGFjZSBmb3IgdGhlIHdpbmRvdyAqL1xuICBpZiAoc3RhdGUud2luZG93ID09PSBudWxsKSB7XG4gICAgc3RhdGUud3NpemUgPSAxIDw8IHN0YXRlLndiaXRzO1xuICAgIHN0YXRlLnduZXh0ID0gMDtcbiAgICBzdGF0ZS53aGF2ZSA9IDA7XG5cbiAgICBzdGF0ZS53aW5kb3cgPSBuZXcgVWludDhBcnJheShzdGF0ZS53c2l6ZSk7XG4gIH1cblxuICAvKiBjb3B5IHN0YXRlLT53c2l6ZSBvciBsZXNzIG91dHB1dCBieXRlcyBpbnRvIHRoZSBjaXJjdWxhciB3aW5kb3cgKi9cbiAgaWYgKGNvcHkgPj0gc3RhdGUud3NpemUpIHtcbiAgICBzdGF0ZS53aW5kb3cuc2V0KHNyYy5zdWJhcnJheShlbmQgLSBzdGF0ZS53c2l6ZSwgZW5kKSwgMCk7XG4gICAgc3RhdGUud25leHQgPSAwO1xuICAgIHN0YXRlLndoYXZlID0gc3RhdGUud3NpemU7XG4gIH0gZWxzZSB7XG4gICAgZGlzdCA9IHN0YXRlLndzaXplIC0gc3RhdGUud25leHQ7XG4gICAgaWYgKGRpc3QgPiBjb3B5KSB7XG4gICAgICBkaXN0ID0gY29weTtcbiAgICB9XG4gICAgLy96bWVtY3B5KHN0YXRlLT53aW5kb3cgKyBzdGF0ZS0+d25leHQsIGVuZCAtIGNvcHksIGRpc3QpO1xuICAgIHN0YXRlLndpbmRvdy5zZXQoc3JjLnN1YmFycmF5KGVuZCAtIGNvcHksIGVuZCAtIGNvcHkgKyBkaXN0KSwgc3RhdGUud25leHQpO1xuICAgIGNvcHkgLT0gZGlzdDtcbiAgICBpZiAoY29weSkge1xuICAgICAgLy96bWVtY3B5KHN0YXRlLT53aW5kb3csIGVuZCAtIGNvcHksIGNvcHkpO1xuICAgICAgc3RhdGUud2luZG93LnNldChzcmMuc3ViYXJyYXkoZW5kIC0gY29weSwgZW5kKSwgMCk7XG4gICAgICBzdGF0ZS53bmV4dCA9IGNvcHk7XG4gICAgICBzdGF0ZS53aGF2ZSA9IHN0YXRlLndzaXplO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGF0ZS53bmV4dCArPSBkaXN0O1xuICAgICAgaWYgKHN0YXRlLnduZXh0ID09PSBzdGF0ZS53c2l6ZSkgc3RhdGUud25leHQgPSAwO1xuICAgICAgaWYgKHN0YXRlLndoYXZlIDwgc3RhdGUud3NpemUpIHN0YXRlLndoYXZlICs9IGRpc3Q7XG4gICAgfVxuICB9XG4gIHJldHVybiAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5mbGF0ZShzdHJtOiBaU3RyZWFtLCBmbHVzaDogYW55KSB7XG4gIGxldCBzdGF0ZTtcbiAgbGV0IGlucHV0OiBVaW50OEFycmF5LCBvdXRwdXQ6IFVpbnQ4QXJyYXk7IC8vIGlucHV0L291dHB1dCBidWZmZXJzXG4gIGxldCBuZXh0OyAvKiBuZXh0IGlucHV0IElOREVYICovXG4gIGxldCBwdXQ7IC8qIG5leHQgb3V0cHV0IElOREVYICovXG4gIGxldCBoYXZlLCBsZWZ0OyAvKiBhdmFpbGFibGUgaW5wdXQgYW5kIG91dHB1dCAqL1xuICBsZXQgaG9sZDsgLyogYml0IGJ1ZmZlciAqL1xuICBsZXQgYml0czsgLyogYml0cyBpbiBiaXQgYnVmZmVyICovXG4gIGxldCBfaW4sIF9vdXQ7IC8qIHNhdmUgc3RhcnRpbmcgYXZhaWxhYmxlIGlucHV0IGFuZCBvdXRwdXQgKi9cbiAgbGV0IGNvcHk7IC8qIG51bWJlciBvZiBzdG9yZWQgb3IgbWF0Y2ggYnl0ZXMgdG8gY29weSAqL1xuICBsZXQgZnJvbTsgLyogd2hlcmUgdG8gY29weSBtYXRjaCBieXRlcyBmcm9tICovXG4gIGxldCBmcm9tX3NvdXJjZTtcbiAgbGV0IGhlcmUgPSAwOyAvKiBjdXJyZW50IGRlY29kaW5nIHRhYmxlIGVudHJ5ICovXG4gIGxldCBoZXJlX2JpdHMsIGhlcmVfb3AsIGhlcmVfdmFsOyAvLyBwYWtlZCBcImhlcmVcIiBkZW5vcm1hbGl6ZWQgKEpTIHNwZWNpZmljKVxuICAvL2xldCBsYXN0OyAgICAgICAgICAgICAgICAgICAvKiBwYXJlbnQgdGFibGUgZW50cnkgKi9cbiAgbGV0IGxhc3RfYml0cywgbGFzdF9vcCwgbGFzdF92YWw7IC8vIHBha2VkIFwibGFzdFwiIGRlbm9ybWFsaXplZCAoSlMgc3BlY2lmaWMpXG4gIGxldCBsZW47IC8qIGxlbmd0aCB0byBjb3B5IGZvciByZXBlYXRzLCBiaXRzIHRvIGRyb3AgKi9cbiAgbGV0IHJldDsgLyogcmV0dXJuIGNvZGUgKi9cbiAgbGV0IGhidWYgPSBuZXcgVWludDhBcnJheSg0KTsgLyogYnVmZmVyIGZvciBnemlwIGhlYWRlciBjcmMgY2FsY3VsYXRpb24gKi9cbiAgbGV0IG9wdHM7XG5cbiAgbGV0IG47IC8vIHRlbXBvcmFyeSBsZXQgZm9yIE5FRURfQklUU1xuXG4gIGxldCBvcmRlciA9IC8qIHBlcm11dGF0aW9uIG9mIGNvZGUgbGVuZ3RocyAqL1xuICAgIFsxNiwgMTcsIDE4LCAwLCA4LCA3LCA5LCA2LCAxMCwgNSwgMTEsIDQsIDEyLCAzLCAxMywgMiwgMTQsIDEsIDE1XTtcblxuICBpZiAoXG4gICAgIXN0cm0gfHwgIXN0cm0uc3RhdGUgfHwgIXN0cm0ub3V0cHV0IHx8XG4gICAgKCFzdHJtLmlucHV0ICYmIHN0cm0uYXZhaWxfaW4gIT09IDApXG4gICkge1xuICAgIHJldHVybiBaX1NUUkVBTV9FUlJPUjtcbiAgfVxuXG4gIHN0YXRlID0gc3RybS5zdGF0ZTtcbiAgaWYgKHN0YXRlLm1vZGUgPT09IFRZUEUpIHN0YXRlLm1vZGUgPSBUWVBFRE87IC8qIHNraXAgY2hlY2sgKi9cblxuICAvLy0tLSBMT0FEKCkgLS0tXG4gIHB1dCA9IHN0cm0ubmV4dF9vdXQ7XG4gIG91dHB1dCA9IHN0cm0ub3V0cHV0O1xuICBsZWZ0ID0gc3RybS5hdmFpbF9vdXQ7XG4gIG5leHQgPSBzdHJtLm5leHRfaW47XG4gIGlucHV0ID0gc3RybS5pbnB1dCBhcyBVaW50OEFycmF5O1xuICBoYXZlID0gc3RybS5hdmFpbF9pbjtcbiAgaG9sZCA9IHN0YXRlLmhvbGQ7XG4gIGJpdHMgPSBzdGF0ZS5iaXRzO1xuICAvLy0tLVxuXG4gIF9pbiA9IGhhdmU7XG4gIF9vdXQgPSBsZWZ0O1xuICByZXQgPSBaX09LO1xuXG4gIGluZl9sZWF2ZTpcbiAgLy8gZ290byBlbXVsYXRpb25cbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoc3RhdGUubW9kZSkge1xuICAgICAgY2FzZSBIRUFEOlxuICAgICAgICBpZiAoc3RhdGUud3JhcCA9PT0gMCkge1xuICAgICAgICAgIHN0YXRlLm1vZGUgPSBUWVBFRE87XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgLy89PT0gTkVFREJJVFMoMTYpO1xuICAgICAgICB3aGlsZSAoYml0cyA8IDE2KSB7XG4gICAgICAgICAgaWYgKGhhdmUgPT09IDApIGJyZWFrIGluZl9sZWF2ZTtcbiAgICAgICAgICBoYXZlLS07XG4gICAgICAgICAgaG9sZCArPSBpbnB1dFtuZXh0KytdIDw8IGJpdHM7XG4gICAgICAgICAgYml0cyArPSA4O1xuICAgICAgICB9XG4gICAgICAgIC8vPT09Ly9cbiAgICAgICAgaWYgKChzdGF0ZS53cmFwICYgMikgJiYgaG9sZCA9PT0gMHg4YjFmKSB7XG4gICAgICAgICAgLyogZ3ppcCBoZWFkZXIgKi9cbiAgICAgICAgICBzdGF0ZS5jaGVjayA9IDAgLypjcmMzMigwTCwgWl9OVUxMLCAwKSovO1xuICAgICAgICAgIC8vPT09IENSQzIoc3RhdGUuY2hlY2ssIGhvbGQpO1xuICAgICAgICAgIGhidWZbMF0gPSBob2xkICYgMHhmZjtcbiAgICAgICAgICBoYnVmWzFdID0gKGhvbGQgPj4+IDgpICYgMHhmZjtcbiAgICAgICAgICBzdGF0ZS5jaGVjayA9IGNyYzMyKHN0YXRlLmNoZWNrLCBoYnVmLCAyLCAwKTtcbiAgICAgICAgICAvLz09PS8vXG5cbiAgICAgICAgICAvLz09PSBJTklUQklUUygpO1xuICAgICAgICAgIGhvbGQgPSAwO1xuICAgICAgICAgIGJpdHMgPSAwO1xuICAgICAgICAgIC8vPT09Ly9cbiAgICAgICAgICBzdGF0ZS5tb2RlID0gRkxBR1M7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGUuZmxhZ3MgPSAwOyAvKiBleHBlY3QgemxpYiBoZWFkZXIgKi9cbiAgICAgICAgaWYgKHN0YXRlLmhlYWQpIHtcbiAgICAgICAgICBzdGF0ZS5oZWFkLmRvbmUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXG4gICAgICAgICAgIShzdGF0ZS53cmFwICYgMSkgfHwgLyogY2hlY2sgaWYgemxpYiBoZWFkZXIgYWxsb3dlZCAqL1xuICAgICAgICAgICgoKGhvbGQgJiAweGZmKSAvKkJJVFMoOCkqLyA8PCA4KSArIChob2xkID4+IDgpKSAlIDMxXG4gICAgICAgICkge1xuICAgICAgICAgIHN0cm0ubXNnID0gXCJpbmNvcnJlY3QgaGVhZGVyIGNoZWNrXCI7XG4gICAgICAgICAgc3RhdGUubW9kZSA9IEJBRDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoKGhvbGQgJiAweDBmKSAvKkJJVFMoNCkqLyAhPT0gWl9ERUZMQVRFRCkge1xuICAgICAgICAgIHN0cm0ubXNnID0gXCJ1bmtub3duIGNvbXByZXNzaW9uIG1ldGhvZFwiO1xuICAgICAgICAgIHN0YXRlLm1vZGUgPSBCQUQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgLy8tLS0gRFJPUEJJVFMoNCkgLS0tLy9cbiAgICAgICAgaG9sZCA+Pj49IDQ7XG4gICAgICAgIGJpdHMgLT0gNDtcbiAgICAgICAgLy8tLS0vL1xuICAgICAgICBsZW4gPSAoaG9sZCAmIDB4MGYpIC8qQklUUyg0KSovICsgODtcbiAgICAgICAgaWYgKHN0YXRlLndiaXRzID09PSAwKSB7XG4gICAgICAgICAgc3RhdGUud2JpdHMgPSBsZW47XG4gICAgICAgIH0gZWxzZSBpZiAobGVuID4gc3RhdGUud2JpdHMpIHtcbiAgICAgICAgICBzdHJtLm1zZyA9IFwiaW52YWxpZCB3aW5kb3cgc2l6ZVwiO1xuICAgICAgICAgIHN0YXRlLm1vZGUgPSBCQUQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGUuZG1heCA9IDEgPDwgbGVuO1xuICAgICAgICAvL1RyYWNldigoc3RkZXJyLCBcImluZmxhdGU6ICAgemxpYiBoZWFkZXIgb2tcXG5cIikpO1xuICAgICAgICBzdHJtLmFkbGVyID0gc3RhdGUuY2hlY2sgPSAxIC8qYWRsZXIzMigwTCwgWl9OVUxMLCAwKSovO1xuICAgICAgICBzdGF0ZS5tb2RlID0gaG9sZCAmIDB4MjAwID8gRElDVElEIDogVFlQRTtcbiAgICAgICAgLy89PT0gSU5JVEJJVFMoKTtcbiAgICAgICAgaG9sZCA9IDA7XG4gICAgICAgIGJpdHMgPSAwO1xuICAgICAgICAvLz09PS8vXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBGTEFHUzpcbiAgICAgICAgLy89PT0gTkVFREJJVFMoMTYpOyAqL1xuICAgICAgICB3aGlsZSAoYml0cyA8IDE2KSB7XG4gICAgICAgICAgaWYgKGhhdmUgPT09IDApIGJyZWFrIGluZl9sZWF2ZTtcbiAgICAgICAgICBoYXZlLS07XG4gICAgICAgICAgaG9sZCArPSBpbnB1dFtuZXh0KytdIDw8IGJpdHM7XG4gICAgICAgICAgYml0cyArPSA4O1xuICAgICAgICB9XG4gICAgICAgIC8vPT09Ly9cbiAgICAgICAgc3RhdGUuZmxhZ3MgPSBob2xkO1xuICAgICAgICBpZiAoKHN0YXRlLmZsYWdzICYgMHhmZikgIT09IFpfREVGTEFURUQpIHtcbiAgICAgICAgICBzdHJtLm1zZyA9IFwidW5rbm93biBjb21wcmVzc2lvbiBtZXRob2RcIjtcbiAgICAgICAgICBzdGF0ZS5tb2RlID0gQkFEO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGF0ZS5mbGFncyAmIDB4ZTAwMCkge1xuICAgICAgICAgIHN0cm0ubXNnID0gXCJ1bmtub3duIGhlYWRlciBmbGFncyBzZXRcIjtcbiAgICAgICAgICBzdGF0ZS5tb2RlID0gQkFEO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGF0ZS5oZWFkKSB7XG4gICAgICAgICAgc3RhdGUuaGVhZC50ZXh0ID0gKChob2xkID4+IDgpICYgMSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXRlLmZsYWdzICYgMHgwMjAwKSB7XG4gICAgICAgICAgLy89PT0gQ1JDMihzdGF0ZS5jaGVjaywgaG9sZCk7XG4gICAgICAgICAgaGJ1ZlswXSA9IGhvbGQgJiAweGZmO1xuICAgICAgICAgIGhidWZbMV0gPSAoaG9sZCA+Pj4gOCkgJiAweGZmO1xuICAgICAgICAgIHN0YXRlLmNoZWNrID0gY3JjMzIoc3RhdGUuY2hlY2ssIGhidWYsIDIsIDApO1xuICAgICAgICAgIC8vPT09Ly9cbiAgICAgICAgfVxuICAgICAgICAvLz09PSBJTklUQklUUygpO1xuICAgICAgICBob2xkID0gMDtcbiAgICAgICAgYml0cyA9IDA7XG4gICAgICAgIC8vPT09Ly9cbiAgICAgICAgc3RhdGUubW9kZSA9IFRJTUU7XG4gICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgIGNhc2UgVElNRTpcbiAgICAgICAgLy89PT0gTkVFREJJVFMoMzIpOyAqL1xuICAgICAgICB3aGlsZSAoYml0cyA8IDMyKSB7XG4gICAgICAgICAgaWYgKGhhdmUgPT09IDApIGJyZWFrIGluZl9sZWF2ZTtcbiAgICAgICAgICBoYXZlLS07XG4gICAgICAgICAgaG9sZCArPSBpbnB1dFtuZXh0KytdIDw8IGJpdHM7XG4gICAgICAgICAgYml0cyArPSA4O1xuICAgICAgICB9XG4gICAgICAgIC8vPT09Ly9cbiAgICAgICAgaWYgKHN0YXRlLmhlYWQpIHtcbiAgICAgICAgICBzdGF0ZS5oZWFkLnRpbWUgPSBob2xkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGF0ZS5mbGFncyAmIDB4MDIwMCkge1xuICAgICAgICAgIC8vPT09IENSQzQoc3RhdGUuY2hlY2ssIGhvbGQpXG4gICAgICAgICAgaGJ1ZlswXSA9IGhvbGQgJiAweGZmO1xuICAgICAgICAgIGhidWZbMV0gPSAoaG9sZCA+Pj4gOCkgJiAweGZmO1xuICAgICAgICAgIGhidWZbMl0gPSAoaG9sZCA+Pj4gMTYpICYgMHhmZjtcbiAgICAgICAgICBoYnVmWzNdID0gKGhvbGQgPj4+IDI0KSAmIDB4ZmY7XG4gICAgICAgICAgc3RhdGUuY2hlY2sgPSBjcmMzMihzdGF0ZS5jaGVjaywgaGJ1ZiwgNCwgMCk7XG4gICAgICAgICAgLy89PT1cbiAgICAgICAgfVxuICAgICAgICAvLz09PSBJTklUQklUUygpO1xuICAgICAgICBob2xkID0gMDtcbiAgICAgICAgYml0cyA9IDA7XG4gICAgICAgIC8vPT09Ly9cbiAgICAgICAgc3RhdGUubW9kZSA9IE9TO1xuICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICBjYXNlIE9TOlxuICAgICAgICAvLz09PSBORUVEQklUUygxNik7ICovXG4gICAgICAgIHdoaWxlIChiaXRzIDwgMTYpIHtcbiAgICAgICAgICBpZiAoaGF2ZSA9PT0gMCkgYnJlYWsgaW5mX2xlYXZlO1xuICAgICAgICAgIGhhdmUtLTtcbiAgICAgICAgICBob2xkICs9IGlucHV0W25leHQrK10gPDwgYml0cztcbiAgICAgICAgICBiaXRzICs9IDg7XG4gICAgICAgIH1cbiAgICAgICAgLy89PT0vL1xuICAgICAgICBpZiAoc3RhdGUuaGVhZCkge1xuICAgICAgICAgIHN0YXRlLmhlYWQueGZsYWdzID0gKGhvbGQgJiAweGZmKTtcbiAgICAgICAgICBzdGF0ZS5oZWFkLm9zID0gKGhvbGQgPj4gOCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXRlLmZsYWdzICYgMHgwMjAwKSB7XG4gICAgICAgICAgLy89PT0gQ1JDMihzdGF0ZS5jaGVjaywgaG9sZCk7XG4gICAgICAgICAgaGJ1ZlswXSA9IGhvbGQgJiAweGZmO1xuICAgICAgICAgIGhidWZbMV0gPSAoaG9sZCA+Pj4gOCkgJiAweGZmO1xuICAgICAgICAgIHN0YXRlLmNoZWNrID0gY3JjMzIoc3RhdGUuY2hlY2ssIGhidWYsIDIsIDApO1xuICAgICAgICAgIC8vPT09Ly9cbiAgICAgICAgfVxuICAgICAgICAvLz09PSBJTklUQklUUygpO1xuICAgICAgICBob2xkID0gMDtcbiAgICAgICAgYml0cyA9IDA7XG4gICAgICAgIC8vPT09Ly9cbiAgICAgICAgc3RhdGUubW9kZSA9IEVYTEVOO1xuICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICBjYXNlIEVYTEVOOlxuICAgICAgICBpZiAoc3RhdGUuZmxhZ3MgJiAweDA0MDApIHtcbiAgICAgICAgICAvLz09PSBORUVEQklUUygxNik7ICovXG4gICAgICAgICAgd2hpbGUgKGJpdHMgPCAxNikge1xuICAgICAgICAgICAgaWYgKGhhdmUgPT09IDApIGJyZWFrIGluZl9sZWF2ZTtcbiAgICAgICAgICAgIGhhdmUtLTtcbiAgICAgICAgICAgIGhvbGQgKz0gaW5wdXRbbmV4dCsrXSA8PCBiaXRzO1xuICAgICAgICAgICAgYml0cyArPSA4O1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLz09PS8vXG4gICAgICAgICAgc3RhdGUubGVuZ3RoID0gaG9sZDtcbiAgICAgICAgICBpZiAoc3RhdGUuaGVhZCkge1xuICAgICAgICAgICAgc3RhdGUuaGVhZC5leHRyYV9sZW4gPSBob2xkO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc3RhdGUuZmxhZ3MgJiAweDAyMDApIHtcbiAgICAgICAgICAgIC8vPT09IENSQzIoc3RhdGUuY2hlY2ssIGhvbGQpO1xuICAgICAgICAgICAgaGJ1ZlswXSA9IGhvbGQgJiAweGZmO1xuICAgICAgICAgICAgaGJ1ZlsxXSA9IChob2xkID4+PiA4KSAmIDB4ZmY7XG4gICAgICAgICAgICBzdGF0ZS5jaGVjayA9IGNyYzMyKHN0YXRlLmNoZWNrLCBoYnVmLCAyLCAwKTtcbiAgICAgICAgICAgIC8vPT09Ly9cbiAgICAgICAgICB9XG4gICAgICAgICAgLy89PT0gSU5JVEJJVFMoKTtcbiAgICAgICAgICBob2xkID0gMDtcbiAgICAgICAgICBiaXRzID0gMDtcbiAgICAgICAgICAvLz09PS8vXG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUuaGVhZCkge1xuICAgICAgICAgIHN0YXRlLmhlYWQuZXh0cmEgPSBudWxsIC8qWl9OVUxMKi87XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGUubW9kZSA9IEVYVFJBO1xuICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICBjYXNlIEVYVFJBOlxuICAgICAgICBpZiAoc3RhdGUuZmxhZ3MgJiAweDA0MDApIHtcbiAgICAgICAgICBjb3B5ID0gc3RhdGUubGVuZ3RoO1xuICAgICAgICAgIGlmIChjb3B5ID4gaGF2ZSkgY29weSA9IGhhdmU7XG4gICAgICAgICAgaWYgKGNvcHkpIHtcbiAgICAgICAgICAgIGlmIChzdGF0ZS5oZWFkKSB7XG4gICAgICAgICAgICAgIGxlbiA9IHN0YXRlLmhlYWQuZXh0cmFfbGVuIC0gc3RhdGUubGVuZ3RoO1xuICAgICAgICAgICAgICBpZiAoIXN0YXRlLmhlYWQuZXh0cmEpIHtcbiAgICAgICAgICAgICAgICAvLyBVc2UgdW50eXBlZCBhcnJheSBmb3IgbW9yZSBjb252ZW5pZW50IHByb2Nlc3NpbmcgbGF0ZXJcbiAgICAgICAgICAgICAgICBzdGF0ZS5oZWFkLmV4dHJhID0gbmV3IEFycmF5KHN0YXRlLmhlYWQuZXh0cmFfbGVuKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyBleHRyYSBmaWVsZCBpcyBsaW1pdGVkIHRvIDY1NTM2IGJ5dGVzXG4gICAgICAgICAgICAgIC8vIC0gbm8gbmVlZCBmb3IgYWRkaXRpb25hbCBzaXplIGNoZWNrXG4gICAgICAgICAgICAgIC8qbGVuICsgY29weSA+IHN0YXRlLmhlYWQuZXh0cmFfbWF4IC0gbGVuID8gc3RhdGUuaGVhZC5leHRyYV9tYXggOiBjb3B5LCovXG4gICAgICAgICAgICAgIHN0YXRlLmhlYWQuZXh0cmEuc2V0KGlucHV0LnN1YmFycmF5KG5leHQsIG5leHQgKyBjb3B5KSwgbGVuKTtcbiAgICAgICAgICAgICAgLy96bWVtY3B5KHN0YXRlLmhlYWQuZXh0cmEgKyBsZW4sIG5leHQsXG4gICAgICAgICAgICAgIC8vICAgICAgICBsZW4gKyBjb3B5ID4gc3RhdGUuaGVhZC5leHRyYV9tYXggP1xuICAgICAgICAgICAgICAvLyAgICAgICAgc3RhdGUuaGVhZC5leHRyYV9tYXggLSBsZW4gOiBjb3B5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzdGF0ZS5mbGFncyAmIDB4MDIwMCkge1xuICAgICAgICAgICAgICBzdGF0ZS5jaGVjayA9IGNyYzMyKHN0YXRlLmNoZWNrLCBpbnB1dCwgY29weSwgbmV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBoYXZlIC09IGNvcHk7XG4gICAgICAgICAgICBuZXh0ICs9IGNvcHk7XG4gICAgICAgICAgICBzdGF0ZS5sZW5ndGggLT0gY29weTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHN0YXRlLmxlbmd0aCkgYnJlYWsgaW5mX2xlYXZlO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRlLmxlbmd0aCA9IDA7XG4gICAgICAgIHN0YXRlLm1vZGUgPSBOQU1FO1xuICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICBjYXNlIE5BTUU6XG4gICAgICAgIGlmIChzdGF0ZS5mbGFncyAmIDB4MDgwMCkge1xuICAgICAgICAgIGlmIChoYXZlID09PSAwKSBicmVhayBpbmZfbGVhdmU7XG4gICAgICAgICAgY29weSA9IDA7XG4gICAgICAgICAgZG8ge1xuICAgICAgICAgICAgLy8gVE9ETzogMiBvciAxIGJ5dGVzP1xuICAgICAgICAgICAgbGVuID0gaW5wdXRbbmV4dCArIGNvcHkrK107XG4gICAgICAgICAgICAvKiB1c2UgY29uc3RhbnQgbGltaXQgYmVjYXVzZSBpbiBqcyB3ZSBzaG91bGQgbm90IHByZWFsbG9jYXRlIG1lbW9yeSAqL1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBzdGF0ZS5oZWFkICYmIGxlbiAmJlxuICAgICAgICAgICAgICAoc3RhdGUubGVuZ3RoIDwgNjU1MzYgLypzdGF0ZS5oZWFkLm5hbWVfbWF4Ki8pXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgc3RhdGUuaGVhZC5uYW1lICs9IFN0cmluZy5mcm9tQ2hhckNvZGUobGVuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IHdoaWxlIChsZW4gJiYgY29weSA8IGhhdmUpO1xuXG4gICAgICAgICAgaWYgKHN0YXRlLmZsYWdzICYgMHgwMjAwKSB7XG4gICAgICAgICAgICBzdGF0ZS5jaGVjayA9IGNyYzMyKHN0YXRlLmNoZWNrLCBpbnB1dCwgY29weSwgbmV4dCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGhhdmUgLT0gY29weTtcbiAgICAgICAgICBuZXh0ICs9IGNvcHk7XG4gICAgICAgICAgaWYgKGxlbikgYnJlYWsgaW5mX2xlYXZlO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlLmhlYWQpIHtcbiAgICAgICAgICBzdGF0ZS5oZWFkLm5hbWUgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRlLmxlbmd0aCA9IDA7XG4gICAgICAgIHN0YXRlLm1vZGUgPSBDT01NRU5UO1xuICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICBjYXNlIENPTU1FTlQ6XG4gICAgICAgIGlmIChzdGF0ZS5mbGFncyAmIDB4MTAwMCkge1xuICAgICAgICAgIGlmIChoYXZlID09PSAwKSBicmVhayBpbmZfbGVhdmU7XG4gICAgICAgICAgY29weSA9IDA7XG4gICAgICAgICAgZG8ge1xuICAgICAgICAgICAgbGVuID0gaW5wdXRbbmV4dCArIGNvcHkrK107XG4gICAgICAgICAgICAvKiB1c2UgY29uc3RhbnQgbGltaXQgYmVjYXVzZSBpbiBqcyB3ZSBzaG91bGQgbm90IHByZWFsbG9jYXRlIG1lbW9yeSAqL1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBzdGF0ZS5oZWFkICYmIGxlbiAmJlxuICAgICAgICAgICAgICAoc3RhdGUubGVuZ3RoIDwgNjU1MzYgLypzdGF0ZS5oZWFkLmNvbW1fbWF4Ki8pXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgc3RhdGUuaGVhZC5jb21tZW50ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUobGVuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IHdoaWxlIChsZW4gJiYgY29weSA8IGhhdmUpO1xuICAgICAgICAgIGlmIChzdGF0ZS5mbGFncyAmIDB4MDIwMCkge1xuICAgICAgICAgICAgc3RhdGUuY2hlY2sgPSBjcmMzMihzdGF0ZS5jaGVjaywgaW5wdXQsIGNvcHksIG5leHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBoYXZlIC09IGNvcHk7XG4gICAgICAgICAgbmV4dCArPSBjb3B5O1xuICAgICAgICAgIGlmIChsZW4pIGJyZWFrIGluZl9sZWF2ZTtcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZS5oZWFkKSB7XG4gICAgICAgICAgc3RhdGUuaGVhZC5jb21tZW50ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBzdGF0ZS5tb2RlID0gSENSQztcbiAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgY2FzZSBIQ1JDOlxuICAgICAgICBpZiAoc3RhdGUuZmxhZ3MgJiAweDAyMDApIHtcbiAgICAgICAgICAvLz09PSBORUVEQklUUygxNik7ICovXG4gICAgICAgICAgd2hpbGUgKGJpdHMgPCAxNikge1xuICAgICAgICAgICAgaWYgKGhhdmUgPT09IDApIGJyZWFrIGluZl9sZWF2ZTtcbiAgICAgICAgICAgIGhhdmUtLTtcbiAgICAgICAgICAgIGhvbGQgKz0gaW5wdXRbbmV4dCsrXSA8PCBiaXRzO1xuICAgICAgICAgICAgYml0cyArPSA4O1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLz09PS8vXG4gICAgICAgICAgaWYgKGhvbGQgIT09IChzdGF0ZS5jaGVjayAmIDB4ZmZmZikpIHtcbiAgICAgICAgICAgIHN0cm0ubXNnID0gXCJoZWFkZXIgY3JjIG1pc21hdGNoXCI7XG4gICAgICAgICAgICBzdGF0ZS5tb2RlID0gQkFEO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vPT09IElOSVRCSVRTKCk7XG4gICAgICAgICAgaG9sZCA9IDA7XG4gICAgICAgICAgYml0cyA9IDA7XG4gICAgICAgICAgLy89PT0vL1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGF0ZS5oZWFkKSB7XG4gICAgICAgICAgc3RhdGUuaGVhZC5oY3JjID0gKChzdGF0ZS5mbGFncyA+PiA5KSAmIDEpO1xuICAgICAgICAgIHN0YXRlLmhlYWQuZG9uZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgc3RybS5hZGxlciA9IHN0YXRlLmNoZWNrID0gMDtcbiAgICAgICAgc3RhdGUubW9kZSA9IFRZUEU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBESUNUSUQ6XG4gICAgICAgIC8vPT09IE5FRURCSVRTKDMyKTsgKi9cbiAgICAgICAgd2hpbGUgKGJpdHMgPCAzMikge1xuICAgICAgICAgIGlmIChoYXZlID09PSAwKSBicmVhayBpbmZfbGVhdmU7XG4gICAgICAgICAgaGF2ZS0tO1xuICAgICAgICAgIGhvbGQgKz0gaW5wdXRbbmV4dCsrXSA8PCBiaXRzO1xuICAgICAgICAgIGJpdHMgKz0gODtcbiAgICAgICAgfVxuICAgICAgICAvLz09PS8vXG4gICAgICAgIHN0cm0uYWRsZXIgPSBzdGF0ZS5jaGVjayA9IHpzd2FwMzIoaG9sZCk7XG4gICAgICAgIC8vPT09IElOSVRCSVRTKCk7XG4gICAgICAgIGhvbGQgPSAwO1xuICAgICAgICBiaXRzID0gMDtcbiAgICAgICAgLy89PT0vL1xuICAgICAgICBzdGF0ZS5tb2RlID0gRElDVDtcbiAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgY2FzZSBESUNUOlxuICAgICAgICBpZiAoc3RhdGUuaGF2ZWRpY3QgPT09IDApIHtcbiAgICAgICAgICAvLy0tLSBSRVNUT1JFKCkgLS0tXG4gICAgICAgICAgc3RybS5uZXh0X291dCA9IHB1dDtcbiAgICAgICAgICBzdHJtLmF2YWlsX291dCA9IGxlZnQ7XG4gICAgICAgICAgc3RybS5uZXh0X2luID0gbmV4dDtcbiAgICAgICAgICBzdHJtLmF2YWlsX2luID0gaGF2ZTtcbiAgICAgICAgICBzdGF0ZS5ob2xkID0gaG9sZDtcbiAgICAgICAgICBzdGF0ZS5iaXRzID0gYml0cztcbiAgICAgICAgICAvLy0tLVxuICAgICAgICAgIHJldHVybiBaX05FRURfRElDVDtcbiAgICAgICAgfVxuICAgICAgICBzdHJtLmFkbGVyID0gc3RhdGUuY2hlY2sgPSAxIC8qYWRsZXIzMigwTCwgWl9OVUxMLCAwKSovO1xuICAgICAgICBzdGF0ZS5tb2RlID0gVFlQRTtcbiAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgY2FzZSBUWVBFOlxuICAgICAgICBpZiAoZmx1c2ggPT09IFpfQkxPQ0sgfHwgZmx1c2ggPT09IFpfVFJFRVMpIGJyZWFrIGluZl9sZWF2ZTtcbiAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgY2FzZSBUWVBFRE86XG4gICAgICAgIGlmIChzdGF0ZS5sYXN0KSB7XG4gICAgICAgICAgLy8tLS0gQllURUJJVFMoKSAtLS0vL1xuICAgICAgICAgIGhvbGQgPj4+PSBiaXRzICYgNztcbiAgICAgICAgICBiaXRzIC09IGJpdHMgJiA3O1xuICAgICAgICAgIC8vLS0tLy9cbiAgICAgICAgICBzdGF0ZS5tb2RlID0gQ0hFQ0s7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgLy89PT0gTkVFREJJVFMoMyk7ICovXG4gICAgICAgIHdoaWxlIChiaXRzIDwgMykge1xuICAgICAgICAgIGlmIChoYXZlID09PSAwKSBicmVhayBpbmZfbGVhdmU7XG4gICAgICAgICAgaGF2ZS0tO1xuICAgICAgICAgIGhvbGQgKz0gaW5wdXRbbmV4dCsrXSA8PCBiaXRzO1xuICAgICAgICAgIGJpdHMgKz0gODtcbiAgICAgICAgfVxuICAgICAgICAvLz09PS8vXG4gICAgICAgIHN0YXRlLmxhc3QgPSAoaG9sZCAmIDB4MDEpIC8qQklUUygxKSovO1xuICAgICAgICAvLy0tLSBEUk9QQklUUygxKSAtLS0vL1xuICAgICAgICBob2xkID4+Pj0gMTtcbiAgICAgICAgYml0cyAtPSAxO1xuICAgICAgICAvLy0tLS8vXG5cbiAgICAgICAgc3dpdGNoICgoaG9sZCAmIDB4MDMpIC8qQklUUygyKSovKSB7XG4gICAgICAgICAgY2FzZSAwOi8qIHN0b3JlZCBibG9jayAqL1xuICAgICAgICAgICAgLy9UcmFjZXYoKHN0ZGVyciwgXCJpbmZsYXRlOiAgICAgc3RvcmVkIGJsb2NrJXNcXG5cIixcbiAgICAgICAgICAgIC8vICAgICAgICBzdGF0ZS5sYXN0ID8gXCIgKGxhc3QpXCIgOiBcIlwiKSk7XG4gICAgICAgICAgICBzdGF0ZS5tb2RlID0gU1RPUkVEO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAxOi8qIGZpeGVkIGJsb2NrICovXG4gICAgICAgICAgICBmaXhlZHRhYmxlcyhzdGF0ZSk7XG4gICAgICAgICAgICAvL1RyYWNldigoc3RkZXJyLCBcImluZmxhdGU6ICAgICBmaXhlZCBjb2RlcyBibG9jayVzXFxuXCIsXG4gICAgICAgICAgICAvLyAgICAgICAgc3RhdGUubGFzdCA/IFwiIChsYXN0KVwiIDogXCJcIikpO1xuICAgICAgICAgICAgc3RhdGUubW9kZSA9IExFTl87IC8qIGRlY29kZSBjb2RlcyAqL1xuICAgICAgICAgICAgaWYgKGZsdXNoID09PSBaX1RSRUVTKSB7XG4gICAgICAgICAgICAgIC8vLS0tIERST1BCSVRTKDIpIC0tLS8vXG4gICAgICAgICAgICAgIGhvbGQgPj4+PSAyO1xuICAgICAgICAgICAgICBiaXRzIC09IDI7XG4gICAgICAgICAgICAgIC8vLS0tLy9cbiAgICAgICAgICAgICAgYnJlYWsgaW5mX2xlYXZlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAyOi8qIGR5bmFtaWMgYmxvY2sgKi9cbiAgICAgICAgICAgIC8vVHJhY2V2KChzdGRlcnIsIFwiaW5mbGF0ZTogICAgIGR5bmFtaWMgY29kZXMgYmxvY2slc1xcblwiLFxuICAgICAgICAgICAgLy8gICAgICAgIHN0YXRlLmxhc3QgPyBcIiAobGFzdClcIiA6IFwiXCIpKTtcbiAgICAgICAgICAgIHN0YXRlLm1vZGUgPSBUQUJMRTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIHN0cm0ubXNnID0gXCJpbnZhbGlkIGJsb2NrIHR5cGVcIjtcbiAgICAgICAgICAgIHN0YXRlLm1vZGUgPSBCQUQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8tLS0gRFJPUEJJVFMoMikgLS0tLy9cbiAgICAgICAgaG9sZCA+Pj49IDI7XG4gICAgICAgIGJpdHMgLT0gMjtcbiAgICAgICAgLy8tLS0vL1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgU1RPUkVEOlxuICAgICAgICAvLy0tLSBCWVRFQklUUygpIC0tLS8vIC8qIGdvIHRvIGJ5dGUgYm91bmRhcnkgKi9cbiAgICAgICAgaG9sZCA+Pj49IGJpdHMgJiA3O1xuICAgICAgICBiaXRzIC09IGJpdHMgJiA3O1xuICAgICAgICAvLy0tLS8vXG4gICAgICAgIC8vPT09IE5FRURCSVRTKDMyKTsgKi9cbiAgICAgICAgd2hpbGUgKGJpdHMgPCAzMikge1xuICAgICAgICAgIGlmIChoYXZlID09PSAwKSBicmVhayBpbmZfbGVhdmU7XG4gICAgICAgICAgaGF2ZS0tO1xuICAgICAgICAgIGhvbGQgKz0gaW5wdXRbbmV4dCsrXSA8PCBiaXRzO1xuICAgICAgICAgIGJpdHMgKz0gODtcbiAgICAgICAgfVxuICAgICAgICAvLz09PS8vXG4gICAgICAgIGlmICgoaG9sZCAmIDB4ZmZmZikgIT09ICgoaG9sZCA+Pj4gMTYpIF4gMHhmZmZmKSkge1xuICAgICAgICAgIHN0cm0ubXNnID0gXCJpbnZhbGlkIHN0b3JlZCBibG9jayBsZW5ndGhzXCI7XG4gICAgICAgICAgc3RhdGUubW9kZSA9IEJBRDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBzdGF0ZS5sZW5ndGggPSBob2xkICYgMHhmZmZmO1xuICAgICAgICAvL1RyYWNldigoc3RkZXJyLCBcImluZmxhdGU6ICAgICAgIHN0b3JlZCBsZW5ndGggJXVcXG5cIixcbiAgICAgICAgLy8gICAgICAgIHN0YXRlLmxlbmd0aCkpO1xuICAgICAgICAvLz09PSBJTklUQklUUygpO1xuICAgICAgICBob2xkID0gMDtcbiAgICAgICAgYml0cyA9IDA7XG4gICAgICAgIC8vPT09Ly9cbiAgICAgICAgc3RhdGUubW9kZSA9IENPUFlfO1xuICAgICAgICBpZiAoZmx1c2ggPT09IFpfVFJFRVMpIGJyZWFrIGluZl9sZWF2ZTtcbiAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgY2FzZSBDT1BZXzpcbiAgICAgICAgc3RhdGUubW9kZSA9IENPUFk7XG4gICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgIGNhc2UgQ09QWTpcbiAgICAgICAgY29weSA9IHN0YXRlLmxlbmd0aDtcbiAgICAgICAgaWYgKGNvcHkpIHtcbiAgICAgICAgICBpZiAoY29weSA+IGhhdmUpIGNvcHkgPSBoYXZlO1xuICAgICAgICAgIGlmIChjb3B5ID4gbGVmdCkgY29weSA9IGxlZnQ7XG4gICAgICAgICAgaWYgKGNvcHkgPT09IDApIGJyZWFrIGluZl9sZWF2ZTtcbiAgICAgICAgICAvLy0tLSB6bWVtY3B5KHB1dCwgbmV4dCwgY29weSk7IC0tLVxuICAgICAgICAgIG91dHB1dC5zZXQoaW5wdXQuc3ViYXJyYXkobmV4dCwgbmV4dCArIGNvcHkpLCBwdXQpO1xuICAgICAgICAgIC8vLS0tLy9cbiAgICAgICAgICBoYXZlIC09IGNvcHk7XG4gICAgICAgICAgbmV4dCArPSBjb3B5O1xuICAgICAgICAgIGxlZnQgLT0gY29weTtcbiAgICAgICAgICBwdXQgKz0gY29weTtcbiAgICAgICAgICBzdGF0ZS5sZW5ndGggLT0gY29weTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICAvL1RyYWNldigoc3RkZXJyLCBcImluZmxhdGU6ICAgICAgIHN0b3JlZCBlbmRcXG5cIikpO1xuICAgICAgICBzdGF0ZS5tb2RlID0gVFlQRTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFRBQkxFOlxuICAgICAgICAvLz09PSBORUVEQklUUygxNCk7ICovXG4gICAgICAgIHdoaWxlIChiaXRzIDwgMTQpIHtcbiAgICAgICAgICBpZiAoaGF2ZSA9PT0gMCkgYnJlYWsgaW5mX2xlYXZlO1xuICAgICAgICAgIGhhdmUtLTtcbiAgICAgICAgICBob2xkICs9IGlucHV0W25leHQrK10gPDwgYml0cztcbiAgICAgICAgICBiaXRzICs9IDg7XG4gICAgICAgIH1cbiAgICAgICAgLy89PT0vL1xuICAgICAgICBzdGF0ZS5ubGVuID0gKGhvbGQgJiAweDFmKSAvKkJJVFMoNSkqLyArIDI1NztcbiAgICAgICAgLy8tLS0gRFJPUEJJVFMoNSkgLS0tLy9cbiAgICAgICAgaG9sZCA+Pj49IDU7XG4gICAgICAgIGJpdHMgLT0gNTtcbiAgICAgICAgLy8tLS0vL1xuICAgICAgICBzdGF0ZS5uZGlzdCA9IChob2xkICYgMHgxZikgLypCSVRTKDUpKi8gKyAxO1xuICAgICAgICAvLy0tLSBEUk9QQklUUyg1KSAtLS0vL1xuICAgICAgICBob2xkID4+Pj0gNTtcbiAgICAgICAgYml0cyAtPSA1O1xuICAgICAgICAvLy0tLS8vXG4gICAgICAgIHN0YXRlLm5jb2RlID0gKGhvbGQgJiAweDBmKSAvKkJJVFMoNCkqLyArIDQ7XG4gICAgICAgIC8vLS0tIERST1BCSVRTKDQpIC0tLS8vXG4gICAgICAgIGhvbGQgPj4+PSA0O1xuICAgICAgICBiaXRzIC09IDQ7XG4gICAgICAgIC8vLS0tLy9cbiAgICAgICAgLy8jaWZuZGVmIFBLWklQX0JVR19XT1JLQVJPVU5EXG4gICAgICAgIGlmIChzdGF0ZS5ubGVuID4gMjg2IHx8IHN0YXRlLm5kaXN0ID4gMzApIHtcbiAgICAgICAgICBzdHJtLm1zZyA9IFwidG9vIG1hbnkgbGVuZ3RoIG9yIGRpc3RhbmNlIHN5bWJvbHNcIjtcbiAgICAgICAgICBzdGF0ZS5tb2RlID0gQkFEO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIC8vI2VuZGlmXG4gICAgICAgIC8vVHJhY2V2KChzdGRlcnIsIFwiaW5mbGF0ZTogICAgICAgdGFibGUgc2l6ZXMgb2tcXG5cIikpO1xuICAgICAgICBzdGF0ZS5oYXZlID0gMDtcbiAgICAgICAgc3RhdGUubW9kZSA9IExFTkxFTlM7XG4gICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgIGNhc2UgTEVOTEVOUzpcbiAgICAgICAgd2hpbGUgKHN0YXRlLmhhdmUgPCBzdGF0ZS5uY29kZSkge1xuICAgICAgICAgIC8vPT09IE5FRURCSVRTKDMpO1xuICAgICAgICAgIHdoaWxlIChiaXRzIDwgMykge1xuICAgICAgICAgICAgaWYgKGhhdmUgPT09IDApIGJyZWFrIGluZl9sZWF2ZTtcbiAgICAgICAgICAgIGhhdmUtLTtcbiAgICAgICAgICAgIGhvbGQgKz0gaW5wdXRbbmV4dCsrXSA8PCBiaXRzO1xuICAgICAgICAgICAgYml0cyArPSA4O1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLz09PS8vXG4gICAgICAgICAgc3RhdGUubGVuc1tvcmRlcltzdGF0ZS5oYXZlKytdXSA9IChob2xkICYgMHgwNyk7IC8vQklUUygzKTtcbiAgICAgICAgICAvLy0tLSBEUk9QQklUUygzKSAtLS0vL1xuICAgICAgICAgIGhvbGQgPj4+PSAzO1xuICAgICAgICAgIGJpdHMgLT0gMztcbiAgICAgICAgICAvLy0tLS8vXG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKHN0YXRlLmhhdmUgPCAxOSkge1xuICAgICAgICAgIHN0YXRlLmxlbnNbb3JkZXJbc3RhdGUuaGF2ZSsrXV0gPSAwO1xuICAgICAgICB9XG4gICAgICAgIC8vIFdlIGhhdmUgc2VwYXJhdGUgdGFibGVzICYgbm8gcG9pbnRlcnMuIDIgY29tbWVudGVkIGxpbmVzIGJlbG93IG5vdCBuZWVkZWQuXG4gICAgICAgIC8vc3RhdGUubmV4dCA9IHN0YXRlLmNvZGVzO1xuICAgICAgICAvL3N0YXRlLmxlbmNvZGUgPSBzdGF0ZS5uZXh0O1xuICAgICAgICAvLyBTd2l0Y2ggdG8gdXNlIGR5bmFtaWMgdGFibGVcbiAgICAgICAgc3RhdGUubGVuY29kZSA9IHN0YXRlLmxlbmR5bjtcbiAgICAgICAgc3RhdGUubGVuYml0cyA9IDc7XG5cbiAgICAgICAgb3B0cyA9IHsgYml0czogc3RhdGUubGVuYml0cyB9O1xuICAgICAgICByZXQgPSBpbmZsYXRlX3RhYmxlKFxuICAgICAgICAgIENPREVTLFxuICAgICAgICAgIHN0YXRlLmxlbnMsXG4gICAgICAgICAgMCxcbiAgICAgICAgICAxOSxcbiAgICAgICAgICBzdGF0ZS5sZW5jb2RlLFxuICAgICAgICAgIDAsXG4gICAgICAgICAgc3RhdGUud29yayxcbiAgICAgICAgICBvcHRzLFxuICAgICAgICApO1xuICAgICAgICBzdGF0ZS5sZW5iaXRzID0gb3B0cy5iaXRzO1xuXG4gICAgICAgIGlmIChyZXQpIHtcbiAgICAgICAgICBzdHJtLm1zZyA9IFwiaW52YWxpZCBjb2RlIGxlbmd0aHMgc2V0XCI7XG4gICAgICAgICAgc3RhdGUubW9kZSA9IEJBRDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICAvL1RyYWNldigoc3RkZXJyLCBcImluZmxhdGU6ICAgICAgIGNvZGUgbGVuZ3RocyBva1xcblwiKSk7XG4gICAgICAgIHN0YXRlLmhhdmUgPSAwO1xuICAgICAgICBzdGF0ZS5tb2RlID0gQ09ERUxFTlM7XG4gICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgIGNhc2UgQ09ERUxFTlM6XG4gICAgICAgIHdoaWxlIChzdGF0ZS5oYXZlIDwgc3RhdGUubmxlbiArIHN0YXRlLm5kaXN0KSB7XG4gICAgICAgICAgZm9yICg7Oykge1xuICAgICAgICAgICAgaGVyZSA9IHN0YXRlXG4gICAgICAgICAgICAgIC5sZW5jb2RlW1xuICAgICAgICAgICAgICBob2xkICYgKCgxIDw8IHN0YXRlLmxlbmJpdHMpIC0gMSlcbiAgICAgICAgICAgIF07IC8qQklUUyhzdGF0ZS5sZW5iaXRzKSovXG4gICAgICAgICAgICBoZXJlX2JpdHMgPSBoZXJlID4+PiAyNDtcbiAgICAgICAgICAgIGhlcmVfb3AgPSAoaGVyZSA+Pj4gMTYpICYgMHhmZjtcbiAgICAgICAgICAgIGhlcmVfdmFsID0gaGVyZSAmIDB4ZmZmZjtcblxuICAgICAgICAgICAgaWYgKChoZXJlX2JpdHMpIDw9IGJpdHMpIGJyZWFrO1xuICAgICAgICAgICAgLy8tLS0gUFVMTEJZVEUoKSAtLS0vL1xuICAgICAgICAgICAgaWYgKGhhdmUgPT09IDApIGJyZWFrIGluZl9sZWF2ZTtcbiAgICAgICAgICAgIGhhdmUtLTtcbiAgICAgICAgICAgIGhvbGQgKz0gaW5wdXRbbmV4dCsrXSA8PCBiaXRzO1xuICAgICAgICAgICAgYml0cyArPSA4O1xuICAgICAgICAgICAgLy8tLS0vL1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaGVyZV92YWwgPCAxNikge1xuICAgICAgICAgICAgLy8tLS0gRFJPUEJJVFMoaGVyZS5iaXRzKSAtLS0vL1xuICAgICAgICAgICAgaG9sZCA+Pj49IGhlcmVfYml0cztcbiAgICAgICAgICAgIGJpdHMgLT0gaGVyZV9iaXRzO1xuICAgICAgICAgICAgLy8tLS0vL1xuICAgICAgICAgICAgc3RhdGUubGVuc1tzdGF0ZS5oYXZlKytdID0gaGVyZV92YWw7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChoZXJlX3ZhbCA9PT0gMTYpIHtcbiAgICAgICAgICAgICAgLy89PT0gTkVFREJJVFMoaGVyZS5iaXRzICsgMik7XG4gICAgICAgICAgICAgIG4gPSBoZXJlX2JpdHMgKyAyO1xuICAgICAgICAgICAgICB3aGlsZSAoYml0cyA8IG4pIHtcbiAgICAgICAgICAgICAgICBpZiAoaGF2ZSA9PT0gMCkgYnJlYWsgaW5mX2xlYXZlO1xuICAgICAgICAgICAgICAgIGhhdmUtLTtcbiAgICAgICAgICAgICAgICBob2xkICs9IGlucHV0W25leHQrK10gPDwgYml0cztcbiAgICAgICAgICAgICAgICBiaXRzICs9IDg7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy89PT0vL1xuICAgICAgICAgICAgICAvLy0tLSBEUk9QQklUUyhoZXJlLmJpdHMpIC0tLS8vXG4gICAgICAgICAgICAgIGhvbGQgPj4+PSBoZXJlX2JpdHM7XG4gICAgICAgICAgICAgIGJpdHMgLT0gaGVyZV9iaXRzO1xuICAgICAgICAgICAgICAvLy0tLS8vXG4gICAgICAgICAgICAgIGlmIChzdGF0ZS5oYXZlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgc3RybS5tc2cgPSBcImludmFsaWQgYml0IGxlbmd0aCByZXBlYXRcIjtcbiAgICAgICAgICAgICAgICBzdGF0ZS5tb2RlID0gQkFEO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGxlbiA9IHN0YXRlLmxlbnNbc3RhdGUuaGF2ZSAtIDFdO1xuICAgICAgICAgICAgICBjb3B5ID0gMyArIChob2xkICYgMHgwMyk7IC8vQklUUygyKTtcbiAgICAgICAgICAgICAgLy8tLS0gRFJPUEJJVFMoMikgLS0tLy9cbiAgICAgICAgICAgICAgaG9sZCA+Pj49IDI7XG4gICAgICAgICAgICAgIGJpdHMgLT0gMjtcbiAgICAgICAgICAgICAgLy8tLS0vL1xuICAgICAgICAgICAgfSBlbHNlIGlmIChoZXJlX3ZhbCA9PT0gMTcpIHtcbiAgICAgICAgICAgICAgLy89PT0gTkVFREJJVFMoaGVyZS5iaXRzICsgMyk7XG4gICAgICAgICAgICAgIG4gPSBoZXJlX2JpdHMgKyAzO1xuICAgICAgICAgICAgICB3aGlsZSAoYml0cyA8IG4pIHtcbiAgICAgICAgICAgICAgICBpZiAoaGF2ZSA9PT0gMCkgYnJlYWsgaW5mX2xlYXZlO1xuICAgICAgICAgICAgICAgIGhhdmUtLTtcbiAgICAgICAgICAgICAgICBob2xkICs9IGlucHV0W25leHQrK10gPDwgYml0cztcbiAgICAgICAgICAgICAgICBiaXRzICs9IDg7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy89PT0vL1xuICAgICAgICAgICAgICAvLy0tLSBEUk9QQklUUyhoZXJlLmJpdHMpIC0tLS8vXG4gICAgICAgICAgICAgIGhvbGQgPj4+PSBoZXJlX2JpdHM7XG4gICAgICAgICAgICAgIGJpdHMgLT0gaGVyZV9iaXRzO1xuICAgICAgICAgICAgICAvLy0tLS8vXG4gICAgICAgICAgICAgIGxlbiA9IDA7XG4gICAgICAgICAgICAgIGNvcHkgPSAzICsgKGhvbGQgJiAweDA3KTsgLy9CSVRTKDMpO1xuICAgICAgICAgICAgICAvLy0tLSBEUk9QQklUUygzKSAtLS0vL1xuICAgICAgICAgICAgICBob2xkID4+Pj0gMztcbiAgICAgICAgICAgICAgYml0cyAtPSAzO1xuICAgICAgICAgICAgICAvLy0tLS8vXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLz09PSBORUVEQklUUyhoZXJlLmJpdHMgKyA3KTtcbiAgICAgICAgICAgICAgbiA9IGhlcmVfYml0cyArIDc7XG4gICAgICAgICAgICAgIHdoaWxlIChiaXRzIDwgbikge1xuICAgICAgICAgICAgICAgIGlmIChoYXZlID09PSAwKSBicmVhayBpbmZfbGVhdmU7XG4gICAgICAgICAgICAgICAgaGF2ZS0tO1xuICAgICAgICAgICAgICAgIGhvbGQgKz0gaW5wdXRbbmV4dCsrXSA8PCBiaXRzO1xuICAgICAgICAgICAgICAgIGJpdHMgKz0gODtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLz09PS8vXG4gICAgICAgICAgICAgIC8vLS0tIERST1BCSVRTKGhlcmUuYml0cykgLS0tLy9cbiAgICAgICAgICAgICAgaG9sZCA+Pj49IGhlcmVfYml0cztcbiAgICAgICAgICAgICAgYml0cyAtPSBoZXJlX2JpdHM7XG4gICAgICAgICAgICAgIC8vLS0tLy9cbiAgICAgICAgICAgICAgbGVuID0gMDtcbiAgICAgICAgICAgICAgY29weSA9IDExICsgKGhvbGQgJiAweDdmKTsgLy9CSVRTKDcpO1xuICAgICAgICAgICAgICAvLy0tLSBEUk9QQklUUyg3KSAtLS0vL1xuICAgICAgICAgICAgICBob2xkID4+Pj0gNztcbiAgICAgICAgICAgICAgYml0cyAtPSA3O1xuICAgICAgICAgICAgICAvLy0tLS8vXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3RhdGUuaGF2ZSArIGNvcHkgPiBzdGF0ZS5ubGVuICsgc3RhdGUubmRpc3QpIHtcbiAgICAgICAgICAgICAgc3RybS5tc2cgPSBcImludmFsaWQgYml0IGxlbmd0aCByZXBlYXRcIjtcbiAgICAgICAgICAgICAgc3RhdGUubW9kZSA9IEJBRDtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aGlsZSAoY29weS0tKSB7XG4gICAgICAgICAgICAgIHN0YXRlLmxlbnNbc3RhdGUuaGF2ZSsrXSA9IGxlbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKiBoYW5kbGUgZXJyb3IgYnJlYWtzIGluIHdoaWxlICovXG4gICAgICAgIGlmIChzdGF0ZS5tb2RlID09PSBCQUQpIGJyZWFrO1xuXG4gICAgICAgIC8qIGNoZWNrIGZvciBlbmQtb2YtYmxvY2sgY29kZSAoYmV0dGVyIGhhdmUgb25lKSAqL1xuICAgICAgICBpZiAoc3RhdGUubGVuc1syNTZdID09PSAwKSB7XG4gICAgICAgICAgc3RybS5tc2cgPSBcImludmFsaWQgY29kZSAtLSBtaXNzaW5nIGVuZC1vZi1ibG9ja1wiO1xuICAgICAgICAgIHN0YXRlLm1vZGUgPSBCQUQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBidWlsZCBjb2RlIHRhYmxlcyAtLSBub3RlOiBkbyBub3QgY2hhbmdlIHRoZSBsZW5iaXRzIG9yIGRpc3RiaXRzXG4gICAgICAgICAgIHZhbHVlcyBoZXJlICg5IGFuZCA2KSB3aXRob3V0IHJlYWRpbmcgdGhlIGNvbW1lbnRzIGluIGluZnRyZWVzLmhcbiAgICAgICAgICAgY29uY2VybmluZyB0aGUgRU5PVUdIIGNvbnN0YW50cywgd2hpY2ggZGVwZW5kIG9uIHRob3NlIHZhbHVlcyAqL1xuICAgICAgICBzdGF0ZS5sZW5iaXRzID0gOTtcblxuICAgICAgICBvcHRzID0geyBiaXRzOiBzdGF0ZS5sZW5iaXRzIH07XG4gICAgICAgIHJldCA9IGluZmxhdGVfdGFibGUoXG4gICAgICAgICAgTEVOUyxcbiAgICAgICAgICBzdGF0ZS5sZW5zLFxuICAgICAgICAgIDAsXG4gICAgICAgICAgc3RhdGUubmxlbixcbiAgICAgICAgICBzdGF0ZS5sZW5jb2RlLFxuICAgICAgICAgIDAsXG4gICAgICAgICAgc3RhdGUud29yayxcbiAgICAgICAgICBvcHRzLFxuICAgICAgICApO1xuICAgICAgICAvLyBXZSBoYXZlIHNlcGFyYXRlIHRhYmxlcyAmIG5vIHBvaW50ZXJzLiAyIGNvbW1lbnRlZCBsaW5lcyBiZWxvdyBub3QgbmVlZGVkLlxuICAgICAgICAvLyBzdGF0ZS5uZXh0X2luZGV4ID0gb3B0cy50YWJsZV9pbmRleDtcbiAgICAgICAgc3RhdGUubGVuYml0cyA9IG9wdHMuYml0cztcbiAgICAgICAgLy8gc3RhdGUubGVuY29kZSA9IHN0YXRlLm5leHQ7XG5cbiAgICAgICAgaWYgKHJldCkge1xuICAgICAgICAgIHN0cm0ubXNnID0gXCJpbnZhbGlkIGxpdGVyYWwvbGVuZ3RocyBzZXRcIjtcbiAgICAgICAgICBzdGF0ZS5tb2RlID0gQkFEO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RhdGUuZGlzdGJpdHMgPSA2O1xuICAgICAgICAvL3N0YXRlLmRpc3Rjb2RlLmNvcHkoc3RhdGUuY29kZXMpO1xuICAgICAgICAvLyBTd2l0Y2ggdG8gdXNlIGR5bmFtaWMgdGFibGVcbiAgICAgICAgc3RhdGUuZGlzdGNvZGUgPSBzdGF0ZS5kaXN0ZHluO1xuICAgICAgICBvcHRzID0geyBiaXRzOiBzdGF0ZS5kaXN0Yml0cyB9O1xuICAgICAgICByZXQgPSBpbmZsYXRlX3RhYmxlKFxuICAgICAgICAgIERJU1RTLFxuICAgICAgICAgIHN0YXRlLmxlbnMsXG4gICAgICAgICAgc3RhdGUubmxlbixcbiAgICAgICAgICBzdGF0ZS5uZGlzdCxcbiAgICAgICAgICBzdGF0ZS5kaXN0Y29kZSxcbiAgICAgICAgICAwLFxuICAgICAgICAgIHN0YXRlLndvcmssXG4gICAgICAgICAgb3B0cyxcbiAgICAgICAgKTtcbiAgICAgICAgLy8gV2UgaGF2ZSBzZXBhcmF0ZSB0YWJsZXMgJiBubyBwb2ludGVycy4gMiBjb21tZW50ZWQgbGluZXMgYmVsb3cgbm90IG5lZWRlZC5cbiAgICAgICAgLy8gc3RhdGUubmV4dF9pbmRleCA9IG9wdHMudGFibGVfaW5kZXg7XG4gICAgICAgIHN0YXRlLmRpc3RiaXRzID0gb3B0cy5iaXRzO1xuICAgICAgICAvLyBzdGF0ZS5kaXN0Y29kZSA9IHN0YXRlLm5leHQ7XG5cbiAgICAgICAgaWYgKHJldCkge1xuICAgICAgICAgIHN0cm0ubXNnID0gXCJpbnZhbGlkIGRpc3RhbmNlcyBzZXRcIjtcbiAgICAgICAgICBzdGF0ZS5tb2RlID0gQkFEO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIC8vVHJhY2V2KChzdGRlcnIsICdpbmZsYXRlOiAgICAgICBjb2RlcyBva1xcbicpKTtcbiAgICAgICAgc3RhdGUubW9kZSA9IExFTl87XG4gICAgICAgIGlmIChmbHVzaCA9PT0gWl9UUkVFUykgYnJlYWsgaW5mX2xlYXZlO1xuICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICBjYXNlIExFTl86XG4gICAgICAgIHN0YXRlLm1vZGUgPSBMRU47XG4gICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgIGNhc2UgTEVOOlxuICAgICAgICBpZiAoaGF2ZSA+PSA2ICYmIGxlZnQgPj0gMjU4KSB7XG4gICAgICAgICAgLy8tLS0gUkVTVE9SRSgpIC0tLVxuICAgICAgICAgIHN0cm0ubmV4dF9vdXQgPSBwdXQ7XG4gICAgICAgICAgc3RybS5hdmFpbF9vdXQgPSBsZWZ0O1xuICAgICAgICAgIHN0cm0ubmV4dF9pbiA9IG5leHQ7XG4gICAgICAgICAgc3RybS5hdmFpbF9pbiA9IGhhdmU7XG4gICAgICAgICAgc3RhdGUuaG9sZCA9IGhvbGQ7XG4gICAgICAgICAgc3RhdGUuYml0cyA9IGJpdHM7XG4gICAgICAgICAgLy8tLS1cbiAgICAgICAgICBpbmZsYXRlX2Zhc3Qoc3RybSwgX291dCk7XG4gICAgICAgICAgLy8tLS0gTE9BRCgpIC0tLVxuICAgICAgICAgIHB1dCA9IHN0cm0ubmV4dF9vdXQ7XG4gICAgICAgICAgb3V0cHV0ID0gc3RybS5vdXRwdXQ7XG4gICAgICAgICAgbGVmdCA9IHN0cm0uYXZhaWxfb3V0O1xuICAgICAgICAgIG5leHQgPSBzdHJtLm5leHRfaW47XG4gICAgICAgICAgaW5wdXQgPSBzdHJtLmlucHV0IGFzIFVpbnQ4QXJyYXk7XG4gICAgICAgICAgaGF2ZSA9IHN0cm0uYXZhaWxfaW47XG4gICAgICAgICAgaG9sZCA9IHN0YXRlLmhvbGQ7XG4gICAgICAgICAgYml0cyA9IHN0YXRlLmJpdHM7XG4gICAgICAgICAgLy8tLS1cblxuICAgICAgICAgIGlmIChzdGF0ZS5tb2RlID09PSBUWVBFKSB7XG4gICAgICAgICAgICBzdGF0ZS5iYWNrID0gLTE7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRlLmJhY2sgPSAwO1xuICAgICAgICBmb3IgKDs7KSB7XG4gICAgICAgICAgaGVyZSA9IHN0YXRlXG4gICAgICAgICAgICAubGVuY29kZVtcbiAgICAgICAgICAgIGhvbGQgJiAoKDEgPDwgc3RhdGUubGVuYml0cykgLSAxKVxuICAgICAgICAgIF07IC8qQklUUyhzdGF0ZS5sZW5iaXRzKSovXG4gICAgICAgICAgaGVyZV9iaXRzID0gaGVyZSA+Pj4gMjQ7XG4gICAgICAgICAgaGVyZV9vcCA9IChoZXJlID4+PiAxNikgJiAweGZmO1xuICAgICAgICAgIGhlcmVfdmFsID0gaGVyZSAmIDB4ZmZmZjtcblxuICAgICAgICAgIGlmIChoZXJlX2JpdHMgPD0gYml0cykgYnJlYWs7XG4gICAgICAgICAgLy8tLS0gUFVMTEJZVEUoKSAtLS0vL1xuICAgICAgICAgIGlmIChoYXZlID09PSAwKSBicmVhayBpbmZfbGVhdmU7XG4gICAgICAgICAgaGF2ZS0tO1xuICAgICAgICAgIGhvbGQgKz0gaW5wdXRbbmV4dCsrXSA8PCBiaXRzO1xuICAgICAgICAgIGJpdHMgKz0gODtcbiAgICAgICAgICAvLy0tLS8vXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhlcmVfb3AgJiYgKGhlcmVfb3AgJiAweGYwKSA9PT0gMCkge1xuICAgICAgICAgIGxhc3RfYml0cyA9IGhlcmVfYml0cztcbiAgICAgICAgICBsYXN0X29wID0gaGVyZV9vcDtcbiAgICAgICAgICBsYXN0X3ZhbCA9IGhlcmVfdmFsO1xuICAgICAgICAgIGZvciAoOzspIHtcbiAgICAgICAgICAgIGhlcmUgPSBzdGF0ZS5sZW5jb2RlW1xuICAgICAgICAgICAgICBsYXN0X3ZhbCArXG4gICAgICAgICAgICAgICgoaG9sZCAmXG4gICAgICAgICAgICAgICAgKCgxIDw8IChsYXN0X2JpdHMgKyBsYXN0X29wKSkgLVxuICAgICAgICAgICAgICAgICAgMSkpIC8qQklUUyhsYXN0LmJpdHMgKyBsYXN0Lm9wKSovID4+IGxhc3RfYml0cylcbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICBoZXJlX2JpdHMgPSBoZXJlID4+PiAyNDtcbiAgICAgICAgICAgIGhlcmVfb3AgPSAoaGVyZSA+Pj4gMTYpICYgMHhmZjtcbiAgICAgICAgICAgIGhlcmVfdmFsID0gaGVyZSAmIDB4ZmZmZjtcblxuICAgICAgICAgICAgaWYgKChsYXN0X2JpdHMgKyBoZXJlX2JpdHMpIDw9IGJpdHMpIGJyZWFrO1xuICAgICAgICAgICAgLy8tLS0gUFVMTEJZVEUoKSAtLS0vL1xuICAgICAgICAgICAgaWYgKGhhdmUgPT09IDApIGJyZWFrIGluZl9sZWF2ZTtcbiAgICAgICAgICAgIGhhdmUtLTtcbiAgICAgICAgICAgIGhvbGQgKz0gaW5wdXRbbmV4dCsrXSA8PCBiaXRzO1xuICAgICAgICAgICAgYml0cyArPSA4O1xuICAgICAgICAgICAgLy8tLS0vL1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLy0tLSBEUk9QQklUUyhsYXN0LmJpdHMpIC0tLS8vXG4gICAgICAgICAgaG9sZCA+Pj49IGxhc3RfYml0cztcbiAgICAgICAgICBiaXRzIC09IGxhc3RfYml0cztcbiAgICAgICAgICAvLy0tLS8vXG4gICAgICAgICAgc3RhdGUuYmFjayArPSBsYXN0X2JpdHM7XG4gICAgICAgIH1cbiAgICAgICAgLy8tLS0gRFJPUEJJVFMoaGVyZS5iaXRzKSAtLS0vL1xuICAgICAgICBob2xkID4+Pj0gaGVyZV9iaXRzO1xuICAgICAgICBiaXRzIC09IGhlcmVfYml0cztcbiAgICAgICAgLy8tLS0vL1xuICAgICAgICBzdGF0ZS5iYWNrICs9IGhlcmVfYml0cztcbiAgICAgICAgc3RhdGUubGVuZ3RoID0gaGVyZV92YWw7XG4gICAgICAgIGlmIChoZXJlX29wID09PSAwKSB7XG4gICAgICAgICAgLy9UcmFjZXZ2KChzdGRlcnIsIGhlcmUudmFsID49IDB4MjAgJiYgaGVyZS52YWwgPCAweDdmID9cbiAgICAgICAgICAvLyAgICAgICAgXCJpbmZsYXRlOiAgICAgICAgIGxpdGVyYWwgJyVjJ1xcblwiIDpcbiAgICAgICAgICAvLyAgICAgICAgXCJpbmZsYXRlOiAgICAgICAgIGxpdGVyYWwgMHglMDJ4XFxuXCIsIGhlcmUudmFsKSk7XG4gICAgICAgICAgc3RhdGUubW9kZSA9IExJVDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoaGVyZV9vcCAmIDMyKSB7XG4gICAgICAgICAgLy9UcmFjZXZ2KChzdGRlcnIsIFwiaW5mbGF0ZTogICAgICAgICBlbmQgb2YgYmxvY2tcXG5cIikpO1xuICAgICAgICAgIHN0YXRlLmJhY2sgPSAtMTtcbiAgICAgICAgICBzdGF0ZS5tb2RlID0gVFlQRTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoaGVyZV9vcCAmIDY0KSB7XG4gICAgICAgICAgc3RybS5tc2cgPSBcImludmFsaWQgbGl0ZXJhbC9sZW5ndGggY29kZVwiO1xuICAgICAgICAgIHN0YXRlLm1vZGUgPSBCQUQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGUuZXh0cmEgPSBoZXJlX29wICYgMTU7XG4gICAgICAgIHN0YXRlLm1vZGUgPSBMRU5FWFQ7XG4gICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgIGNhc2UgTEVORVhUOlxuICAgICAgICBpZiAoc3RhdGUuZXh0cmEpIHtcbiAgICAgICAgICAvLz09PSBORUVEQklUUyhzdGF0ZS5leHRyYSk7XG4gICAgICAgICAgbiA9IHN0YXRlLmV4dHJhO1xuICAgICAgICAgIHdoaWxlIChiaXRzIDwgbikge1xuICAgICAgICAgICAgaWYgKGhhdmUgPT09IDApIGJyZWFrIGluZl9sZWF2ZTtcbiAgICAgICAgICAgIGhhdmUtLTtcbiAgICAgICAgICAgIGhvbGQgKz0gaW5wdXRbbmV4dCsrXSA8PCBiaXRzO1xuICAgICAgICAgICAgYml0cyArPSA4O1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLz09PS8vXG4gICAgICAgICAgc3RhdGUubGVuZ3RoICs9IGhvbGQgJiAoKDEgPDwgc3RhdGUuZXh0cmEpIC0gMSkgLypCSVRTKHN0YXRlLmV4dHJhKSovO1xuICAgICAgICAgIC8vLS0tIERST1BCSVRTKHN0YXRlLmV4dHJhKSAtLS0vL1xuICAgICAgICAgIGhvbGQgPj4+PSBzdGF0ZS5leHRyYTtcbiAgICAgICAgICBiaXRzIC09IHN0YXRlLmV4dHJhO1xuICAgICAgICAgIC8vLS0tLy9cbiAgICAgICAgICBzdGF0ZS5iYWNrICs9IHN0YXRlLmV4dHJhO1xuICAgICAgICB9XG4gICAgICAgIC8vVHJhY2V2digoc3RkZXJyLCBcImluZmxhdGU6ICAgICAgICAgbGVuZ3RoICV1XFxuXCIsIHN0YXRlLmxlbmd0aCkpO1xuICAgICAgICBzdGF0ZS53YXMgPSBzdGF0ZS5sZW5ndGg7XG4gICAgICAgIHN0YXRlLm1vZGUgPSBESVNUO1xuICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICBjYXNlIERJU1Q6XG4gICAgICAgIGZvciAoOzspIHtcbiAgICAgICAgICBoZXJlID0gc3RhdGVcbiAgICAgICAgICAgIC5kaXN0Y29kZVtcbiAgICAgICAgICAgIGhvbGQgJiAoKDEgPDwgc3RhdGUuZGlzdGJpdHMpIC0gMSlcbiAgICAgICAgICBdOyAvKkJJVFMoc3RhdGUuZGlzdGJpdHMpKi9cbiAgICAgICAgICBoZXJlX2JpdHMgPSBoZXJlID4+PiAyNDtcbiAgICAgICAgICBoZXJlX29wID0gKGhlcmUgPj4+IDE2KSAmIDB4ZmY7XG4gICAgICAgICAgaGVyZV92YWwgPSBoZXJlICYgMHhmZmZmO1xuXG4gICAgICAgICAgaWYgKChoZXJlX2JpdHMpIDw9IGJpdHMpIGJyZWFrO1xuICAgICAgICAgIC8vLS0tIFBVTExCWVRFKCkgLS0tLy9cbiAgICAgICAgICBpZiAoaGF2ZSA9PT0gMCkgYnJlYWsgaW5mX2xlYXZlO1xuICAgICAgICAgIGhhdmUtLTtcbiAgICAgICAgICBob2xkICs9IGlucHV0W25leHQrK10gPDwgYml0cztcbiAgICAgICAgICBiaXRzICs9IDg7XG4gICAgICAgICAgLy8tLS0vL1xuICAgICAgICB9XG4gICAgICAgIGlmICgoaGVyZV9vcCAmIDB4ZjApID09PSAwKSB7XG4gICAgICAgICAgbGFzdF9iaXRzID0gaGVyZV9iaXRzO1xuICAgICAgICAgIGxhc3Rfb3AgPSBoZXJlX29wO1xuICAgICAgICAgIGxhc3RfdmFsID0gaGVyZV92YWw7XG4gICAgICAgICAgZm9yICg7Oykge1xuICAgICAgICAgICAgaGVyZSA9IHN0YXRlLmRpc3Rjb2RlW1xuICAgICAgICAgICAgICBsYXN0X3ZhbCArXG4gICAgICAgICAgICAgICgoaG9sZCAmXG4gICAgICAgICAgICAgICAgKCgxIDw8IChsYXN0X2JpdHMgKyBsYXN0X29wKSkgLVxuICAgICAgICAgICAgICAgICAgMSkpIC8qQklUUyhsYXN0LmJpdHMgKyBsYXN0Lm9wKSovID4+IGxhc3RfYml0cylcbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICBoZXJlX2JpdHMgPSBoZXJlID4+PiAyNDtcbiAgICAgICAgICAgIGhlcmVfb3AgPSAoaGVyZSA+Pj4gMTYpICYgMHhmZjtcbiAgICAgICAgICAgIGhlcmVfdmFsID0gaGVyZSAmIDB4ZmZmZjtcblxuICAgICAgICAgICAgaWYgKChsYXN0X2JpdHMgKyBoZXJlX2JpdHMpIDw9IGJpdHMpIGJyZWFrO1xuICAgICAgICAgICAgLy8tLS0gUFVMTEJZVEUoKSAtLS0vL1xuICAgICAgICAgICAgaWYgKGhhdmUgPT09IDApIGJyZWFrIGluZl9sZWF2ZTtcbiAgICAgICAgICAgIGhhdmUtLTtcbiAgICAgICAgICAgIGhvbGQgKz0gaW5wdXRbbmV4dCsrXSA8PCBiaXRzO1xuICAgICAgICAgICAgYml0cyArPSA4O1xuICAgICAgICAgICAgLy8tLS0vL1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLy0tLSBEUk9QQklUUyhsYXN0LmJpdHMpIC0tLS8vXG4gICAgICAgICAgaG9sZCA+Pj49IGxhc3RfYml0cztcbiAgICAgICAgICBiaXRzIC09IGxhc3RfYml0cztcbiAgICAgICAgICAvLy0tLS8vXG4gICAgICAgICAgc3RhdGUuYmFjayArPSBsYXN0X2JpdHM7XG4gICAgICAgIH1cbiAgICAgICAgLy8tLS0gRFJPUEJJVFMoaGVyZS5iaXRzKSAtLS0vL1xuICAgICAgICBob2xkID4+Pj0gaGVyZV9iaXRzO1xuICAgICAgICBiaXRzIC09IGhlcmVfYml0cztcbiAgICAgICAgLy8tLS0vL1xuICAgICAgICBzdGF0ZS5iYWNrICs9IGhlcmVfYml0cztcbiAgICAgICAgaWYgKGhlcmVfb3AgJiA2NCkge1xuICAgICAgICAgIHN0cm0ubXNnID0gXCJpbnZhbGlkIGRpc3RhbmNlIGNvZGVcIjtcbiAgICAgICAgICBzdGF0ZS5tb2RlID0gQkFEO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRlLm9mZnNldCA9IGhlcmVfdmFsO1xuICAgICAgICBzdGF0ZS5leHRyYSA9IChoZXJlX29wKSAmIDE1O1xuICAgICAgICBzdGF0ZS5tb2RlID0gRElTVEVYVDtcbiAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgY2FzZSBESVNURVhUOlxuICAgICAgICBpZiAoc3RhdGUuZXh0cmEpIHtcbiAgICAgICAgICAvLz09PSBORUVEQklUUyhzdGF0ZS5leHRyYSk7XG4gICAgICAgICAgbiA9IHN0YXRlLmV4dHJhO1xuICAgICAgICAgIHdoaWxlIChiaXRzIDwgbikge1xuICAgICAgICAgICAgaWYgKGhhdmUgPT09IDApIGJyZWFrIGluZl9sZWF2ZTtcbiAgICAgICAgICAgIGhhdmUtLTtcbiAgICAgICAgICAgIGhvbGQgKz0gaW5wdXRbbmV4dCsrXSA8PCBiaXRzO1xuICAgICAgICAgICAgYml0cyArPSA4O1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLz09PS8vXG4gICAgICAgICAgc3RhdGUub2Zmc2V0ICs9IGhvbGQgJiAoKDEgPDwgc3RhdGUuZXh0cmEpIC0gMSkgLypCSVRTKHN0YXRlLmV4dHJhKSovO1xuICAgICAgICAgIC8vLS0tIERST1BCSVRTKHN0YXRlLmV4dHJhKSAtLS0vL1xuICAgICAgICAgIGhvbGQgPj4+PSBzdGF0ZS5leHRyYTtcbiAgICAgICAgICBiaXRzIC09IHN0YXRlLmV4dHJhO1xuICAgICAgICAgIC8vLS0tLy9cbiAgICAgICAgICBzdGF0ZS5iYWNrICs9IHN0YXRlLmV4dHJhO1xuICAgICAgICB9XG4gICAgICAgIC8vI2lmZGVmIElORkxBVEVfU1RSSUNUXG4gICAgICAgIGlmIChzdGF0ZS5vZmZzZXQgPiBzdGF0ZS5kbWF4KSB7XG4gICAgICAgICAgc3RybS5tc2cgPSBcImludmFsaWQgZGlzdGFuY2UgdG9vIGZhciBiYWNrXCI7XG4gICAgICAgICAgc3RhdGUubW9kZSA9IEJBRDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICAvLyNlbmRpZlxuICAgICAgICAvL1RyYWNldnYoKHN0ZGVyciwgXCJpbmZsYXRlOiAgICAgICAgIGRpc3RhbmNlICV1XFxuXCIsIHN0YXRlLm9mZnNldCkpO1xuICAgICAgICBzdGF0ZS5tb2RlID0gTUFUQ0g7XG4gICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgIGNhc2UgTUFUQ0g6XG4gICAgICAgIGlmIChsZWZ0ID09PSAwKSBicmVhayBpbmZfbGVhdmU7XG4gICAgICAgIGNvcHkgPSBfb3V0IC0gbGVmdDtcbiAgICAgICAgaWYgKHN0YXRlLm9mZnNldCA+IGNvcHkpIHtcbiAgICAgICAgICAvKiBjb3B5IGZyb20gd2luZG93ICovXG4gICAgICAgICAgY29weSA9IHN0YXRlLm9mZnNldCAtIGNvcHk7XG4gICAgICAgICAgaWYgKGNvcHkgPiBzdGF0ZS53aGF2ZSkge1xuICAgICAgICAgICAgaWYgKHN0YXRlLnNhbmUpIHtcbiAgICAgICAgICAgICAgc3RybS5tc2cgPSBcImludmFsaWQgZGlzdGFuY2UgdG9vIGZhciBiYWNrXCI7XG4gICAgICAgICAgICAgIHN0YXRlLm1vZGUgPSBCQUQ7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gKCEpIFRoaXMgYmxvY2sgaXMgZGlzYWJsZWQgaW4gemxpYiBkZWZhdWx0cyxcbiAgICAgICAgICAgIC8vIGRvbid0IGVuYWJsZSBpdCBmb3IgYmluYXJ5IGNvbXBhdGliaWxpdHlcbiAgICAgICAgICAgIC8vI2lmZGVmIElORkxBVEVfQUxMT1dfSU5WQUxJRF9ESVNUQU5DRV9UT09GQVJfQVJSUlxuICAgICAgICAgICAgLy8gICAgICAgICAgVHJhY2UoKHN0ZGVyciwgXCJpbmZsYXRlLmMgdG9vIGZhclxcblwiKSk7XG4gICAgICAgICAgICAvLyAgICAgICAgICBjb3B5IC09IHN0YXRlLndoYXZlO1xuICAgICAgICAgICAgLy8gICAgICAgICAgaWYgKGNvcHkgPiBzdGF0ZS5sZW5ndGgpIHsgY29weSA9IHN0YXRlLmxlbmd0aDsgfVxuICAgICAgICAgICAgLy8gICAgICAgICAgaWYgKGNvcHkgPiBsZWZ0KSB7IGNvcHkgPSBsZWZ0OyB9XG4gICAgICAgICAgICAvLyAgICAgICAgICBsZWZ0IC09IGNvcHk7XG4gICAgICAgICAgICAvLyAgICAgICAgICBzdGF0ZS5sZW5ndGggLT0gY29weTtcbiAgICAgICAgICAgIC8vICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgb3V0cHV0W3B1dCsrXSA9IDA7XG4gICAgICAgICAgICAvLyAgICAgICAgICB9IHdoaWxlICgtLWNvcHkpO1xuICAgICAgICAgICAgLy8gICAgICAgICAgaWYgKHN0YXRlLmxlbmd0aCA9PT0gMCkgeyBzdGF0ZS5tb2RlID0gTEVOOyB9XG4gICAgICAgICAgICAvLyAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIC8vI2VuZGlmXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjb3B5ID4gc3RhdGUud25leHQpIHtcbiAgICAgICAgICAgIGNvcHkgLT0gc3RhdGUud25leHQ7XG4gICAgICAgICAgICBmcm9tID0gc3RhdGUud3NpemUgLSBjb3B5O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmcm9tID0gc3RhdGUud25leHQgLSBjb3B5O1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoY29weSA+IHN0YXRlLmxlbmd0aCkgY29weSA9IHN0YXRlLmxlbmd0aDtcbiAgICAgICAgICBmcm9tX3NvdXJjZSA9IHN0YXRlLndpbmRvdztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvKiBjb3B5IGZyb20gb3V0cHV0ICovXG4gICAgICAgICAgZnJvbV9zb3VyY2UgPSBvdXRwdXQ7XG4gICAgICAgICAgZnJvbSA9IHB1dCAtIHN0YXRlLm9mZnNldDtcbiAgICAgICAgICBjb3B5ID0gc3RhdGUubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb3B5ID4gbGVmdCkgY29weSA9IGxlZnQ7XG4gICAgICAgIGxlZnQgLT0gY29weTtcbiAgICAgICAgc3RhdGUubGVuZ3RoIC09IGNvcHk7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICBvdXRwdXRbcHV0KytdID0gZnJvbV9zb3VyY2VbZnJvbSsrXTtcbiAgICAgICAgfSB3aGlsZSAoLS1jb3B5KTtcbiAgICAgICAgaWYgKHN0YXRlLmxlbmd0aCA9PT0gMCkgc3RhdGUubW9kZSA9IExFTjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIExJVDpcbiAgICAgICAgaWYgKGxlZnQgPT09IDApIGJyZWFrIGluZl9sZWF2ZTtcbiAgICAgICAgb3V0cHV0W3B1dCsrXSA9IHN0YXRlLmxlbmd0aDtcbiAgICAgICAgbGVmdC0tO1xuICAgICAgICBzdGF0ZS5tb2RlID0gTEVOO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ0hFQ0s6XG4gICAgICAgIGlmIChzdGF0ZS53cmFwKSB7XG4gICAgICAgICAgLy89PT0gTkVFREJJVFMoMzIpO1xuICAgICAgICAgIHdoaWxlIChiaXRzIDwgMzIpIHtcbiAgICAgICAgICAgIGlmIChoYXZlID09PSAwKSBicmVhayBpbmZfbGVhdmU7XG4gICAgICAgICAgICBoYXZlLS07XG4gICAgICAgICAgICAvLyBVc2UgJ3wnIGluc3RlYWQgb2YgJysnIHRvIG1ha2Ugc3VyZSB0aGF0IHJlc3VsdCBpcyBzaWduZWRcbiAgICAgICAgICAgIGhvbGQgfD0gaW5wdXRbbmV4dCsrXSA8PCBiaXRzO1xuICAgICAgICAgICAgYml0cyArPSA4O1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLz09PS8vXG4gICAgICAgICAgX291dCAtPSBsZWZ0O1xuICAgICAgICAgIHN0cm0udG90YWxfb3V0ICs9IF9vdXQ7XG4gICAgICAgICAgc3RhdGUudG90YWwgKz0gX291dDtcbiAgICAgICAgICBpZiAoX291dCkge1xuICAgICAgICAgICAgc3RybS5hZGxlciA9IHN0YXRlLmNoZWNrID1cbiAgICAgICAgICAgICAgLypVUERBVEUoc3RhdGUuY2hlY2ssIHB1dCAtIF9vdXQsIF9vdXQpOyovXG4gICAgICAgICAgICAgIChzdGF0ZS5mbGFnc1xuICAgICAgICAgICAgICAgID8gY3JjMzIoc3RhdGUuY2hlY2ssIG91dHB1dCwgX291dCwgcHV0IC0gX291dClcbiAgICAgICAgICAgICAgICA6IGFkbGVyMzIoc3RhdGUuY2hlY2ssIG91dHB1dCwgX291dCwgcHV0IC0gX291dCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBfb3V0ID0gbGVmdDtcbiAgICAgICAgICAvLyBOQjogY3JjMzIgc3RvcmVkIGFzIHNpZ25lZCAzMi1iaXQgaW50LCB6c3dhcDMyIHJldHVybnMgc2lnbmVkIHRvb1xuICAgICAgICAgIGlmICgoc3RhdGUuZmxhZ3MgPyBob2xkIDogenN3YXAzMihob2xkKSkgIT09IHN0YXRlLmNoZWNrKSB7XG4gICAgICAgICAgICBzdHJtLm1zZyA9IFwiaW5jb3JyZWN0IGRhdGEgY2hlY2tcIjtcbiAgICAgICAgICAgIHN0YXRlLm1vZGUgPSBCQUQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgLy89PT0gSU5JVEJJVFMoKTtcbiAgICAgICAgICBob2xkID0gMDtcbiAgICAgICAgICBiaXRzID0gMDtcbiAgICAgICAgICAvLz09PS8vXG4gICAgICAgICAgLy9UcmFjZXYoKHN0ZGVyciwgXCJpbmZsYXRlOiAgIGNoZWNrIG1hdGNoZXMgdHJhaWxlclxcblwiKSk7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGUubW9kZSA9IExFTkdUSDtcbiAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgY2FzZSBMRU5HVEg6XG4gICAgICAgIGlmIChzdGF0ZS53cmFwICYmIHN0YXRlLmZsYWdzKSB7XG4gICAgICAgICAgLy89PT0gTkVFREJJVFMoMzIpO1xuICAgICAgICAgIHdoaWxlIChiaXRzIDwgMzIpIHtcbiAgICAgICAgICAgIGlmIChoYXZlID09PSAwKSBicmVhayBpbmZfbGVhdmU7XG4gICAgICAgICAgICBoYXZlLS07XG4gICAgICAgICAgICBob2xkICs9IGlucHV0W25leHQrK10gPDwgYml0cztcbiAgICAgICAgICAgIGJpdHMgKz0gODtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy89PT0vL1xuICAgICAgICAgIGlmIChob2xkICE9PSAoc3RhdGUudG90YWwgJiAweGZmZmZmZmZmKSkge1xuICAgICAgICAgICAgc3RybS5tc2cgPSBcImluY29ycmVjdCBsZW5ndGggY2hlY2tcIjtcbiAgICAgICAgICAgIHN0YXRlLm1vZGUgPSBCQUQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgLy89PT0gSU5JVEJJVFMoKTtcbiAgICAgICAgICBob2xkID0gMDtcbiAgICAgICAgICBiaXRzID0gMDtcbiAgICAgICAgICAvLz09PS8vXG4gICAgICAgICAgLy9UcmFjZXYoKHN0ZGVyciwgXCJpbmZsYXRlOiAgIGxlbmd0aCBtYXRjaGVzIHRyYWlsZXJcXG5cIikpO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRlLm1vZGUgPSBET05FO1xuICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICBjYXNlIERPTkU6XG4gICAgICAgIHJldCA9IFpfU1RSRUFNX0VORDtcbiAgICAgICAgYnJlYWsgaW5mX2xlYXZlO1xuICAgICAgY2FzZSBCQUQ6XG4gICAgICAgIHJldCA9IFpfREFUQV9FUlJPUjtcbiAgICAgICAgYnJlYWsgaW5mX2xlYXZlO1xuICAgICAgY2FzZSBNRU06XG4gICAgICAgIHJldHVybiBaX01FTV9FUlJPUjtcbiAgICAgIGNhc2UgU1lOQzpcbiAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIFpfU1RSRUFNX0VSUk9SO1xuICAgIH1cbiAgfVxuXG4gIC8vIGluZl9sZWF2ZSA8LSBoZXJlIGlzIHJlYWwgcGxhY2UgZm9yIFwiZ290byBpbmZfbGVhdmVcIiwgZW11bGF0ZWQgdmlhIFwiYnJlYWsgaW5mX2xlYXZlXCJcblxuICAvKlxuICAgICBSZXR1cm4gZnJvbSBpbmZsYXRlKCksIHVwZGF0aW5nIHRoZSB0b3RhbCBjb3VudHMgYW5kIHRoZSBjaGVjayB2YWx1ZS5cbiAgICAgSWYgdGhlcmUgd2FzIG5vIHByb2dyZXNzIGR1cmluZyB0aGUgaW5mbGF0ZSgpIGNhbGwsIHJldHVybiBhIGJ1ZmZlclxuICAgICBlcnJvci4gIENhbGwgdXBkYXRld2luZG93KCkgdG8gY3JlYXRlIGFuZC9vciB1cGRhdGUgdGhlIHdpbmRvdyBzdGF0ZS5cbiAgICAgTm90ZTogYSBtZW1vcnkgZXJyb3IgZnJvbSBpbmZsYXRlKCkgaXMgbm9uLXJlY292ZXJhYmxlLlxuICAgKi9cblxuICAvLy0tLSBSRVNUT1JFKCkgLS0tXG4gIHN0cm0ubmV4dF9vdXQgPSBwdXQ7XG4gIHN0cm0uYXZhaWxfb3V0ID0gbGVmdDtcbiAgc3RybS5uZXh0X2luID0gbmV4dDtcbiAgc3RybS5hdmFpbF9pbiA9IGhhdmU7XG4gIHN0YXRlLmhvbGQgPSBob2xkO1xuICBzdGF0ZS5iaXRzID0gYml0cztcbiAgLy8tLS1cblxuICBpZiAoXG4gICAgc3RhdGUud3NpemUgfHwgKF9vdXQgIT09IHN0cm0uYXZhaWxfb3V0ICYmIHN0YXRlLm1vZGUgPCBCQUQgJiZcbiAgICAgIChzdGF0ZS5tb2RlIDwgQ0hFQ0sgfHwgZmx1c2ggIT09IFpfRklOSVNIKSlcbiAgKSB7XG4gICAgaWYgKHVwZGF0ZXdpbmRvdyhzdHJtLCBzdHJtLm91dHB1dCwgc3RybS5uZXh0X291dCwgX291dCAtIHN0cm0uYXZhaWxfb3V0KSkge1xuICAgICAgc3RhdGUubW9kZSA9IE1FTTtcbiAgICAgIHJldHVybiBaX01FTV9FUlJPUjtcbiAgICB9XG4gIH1cbiAgX2luIC09IHN0cm0uYXZhaWxfaW47XG4gIF9vdXQgLT0gc3RybS5hdmFpbF9vdXQ7XG4gIHN0cm0udG90YWxfaW4gKz0gX2luO1xuICBzdHJtLnRvdGFsX291dCArPSBfb3V0O1xuICBzdGF0ZS50b3RhbCArPSBfb3V0O1xuICBpZiAoc3RhdGUud3JhcCAmJiBfb3V0KSB7XG4gICAgc3RybS5hZGxlciA9IHN0YXRlXG4gICAgICAuY2hlY2sgPSAvKlVQREFURShzdGF0ZS5jaGVjaywgc3RybS5uZXh0X291dCAtIF9vdXQsIF9vdXQpOyovXG4gICAgICAoc3RhdGUuZmxhZ3NcbiAgICAgICAgPyBjcmMzMihzdGF0ZS5jaGVjaywgb3V0cHV0LCBfb3V0LCBzdHJtLm5leHRfb3V0IC0gX291dClcbiAgICAgICAgOiBhZGxlcjMyKHN0YXRlLmNoZWNrLCBvdXRwdXQsIF9vdXQsIHN0cm0ubmV4dF9vdXQgLSBfb3V0KSk7XG4gIH1cbiAgc3RybS5kYXRhX3R5cGUgPSBzdGF0ZS5iaXRzICsgKHN0YXRlLmxhc3QgPyA2NCA6IDApICtcbiAgICAoc3RhdGUubW9kZSA9PT0gVFlQRSA/IDEyOCA6IDApICtcbiAgICAoc3RhdGUubW9kZSA9PT0gTEVOXyB8fCBzdGF0ZS5tb2RlID09PSBDT1BZXyA/IDI1NiA6IDApO1xuICBpZiAoKChfaW4gPT09IDAgJiYgX291dCA9PT0gMCkgfHwgZmx1c2ggPT09IFpfRklOSVNIKSAmJiByZXQgPT09IFpfT0spIHtcbiAgICByZXQgPSBaX0JVRl9FUlJPUjtcbiAgfVxuICByZXR1cm4gcmV0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5mbGF0ZUVuZChzdHJtOiBaU3RyZWFtKSB7XG4gIGlmICghc3RybSB8fCAhc3RybS5zdGF0ZSAvKnx8IHN0cm0tPnpmcmVlID09IChmcmVlX2Z1bmMpMCovKSB7XG4gICAgcmV0dXJuIFpfU1RSRUFNX0VSUk9SO1xuICB9XG5cbiAgbGV0IHN0YXRlID0gc3RybS5zdGF0ZTtcbiAgaWYgKHN0YXRlLndpbmRvdykge1xuICAgIHN0YXRlLndpbmRvdyA9IG51bGw7XG4gIH1cbiAgc3RybS5zdGF0ZSA9IG51bGw7XG4gIHJldHVybiBaX09LO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5mbGF0ZUdldEhlYWRlcihzdHJtOiBaU3RyZWFtLCBoZWFkOiBhbnkpIHtcbiAgbGV0IHN0YXRlO1xuXG4gIC8qIGNoZWNrIHN0YXRlICovXG4gIGlmICghc3RybSB8fCAhc3RybS5zdGF0ZSkgcmV0dXJuIFpfU1RSRUFNX0VSUk9SO1xuICBzdGF0ZSA9IHN0cm0uc3RhdGU7XG4gIGlmICgoc3RhdGUud3JhcCAmIDIpID09PSAwKSByZXR1cm4gWl9TVFJFQU1fRVJST1I7XG5cbiAgLyogc2F2ZSBoZWFkZXIgc3RydWN0dXJlICovXG4gIHN0YXRlLmhlYWQgPSBoZWFkO1xuICBoZWFkLmRvbmUgPSBmYWxzZTtcbiAgcmV0dXJuIFpfT0s7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmZsYXRlU2V0RGljdGlvbmFyeShzdHJtOiBaU3RyZWFtLCBkaWN0aW9uYXJ5OiBhbnkpIHtcbiAgbGV0IGRpY3RMZW5ndGggPSBkaWN0aW9uYXJ5Lmxlbmd0aDtcblxuICBsZXQgc3RhdGU7XG4gIGxldCBkaWN0aWQ7XG4gIGxldCByZXQ7XG5cbiAgLyogY2hlY2sgc3RhdGUgKi9cbiAgaWYgKFxuICAgICFzdHJtIC8qID09IFpfTlVMTCAqLyB8fCAhc3RybS5zdGF0ZSAvKiA9PSBaX05VTEwgKi9cbiAgKSB7XG4gICAgcmV0dXJuIFpfU1RSRUFNX0VSUk9SO1xuICB9XG4gIHN0YXRlID0gc3RybS5zdGF0ZTtcblxuICBpZiAoc3RhdGUud3JhcCAhPT0gMCAmJiBzdGF0ZS5tb2RlICE9PSBESUNUKSB7XG4gICAgcmV0dXJuIFpfU1RSRUFNX0VSUk9SO1xuICB9XG5cbiAgLyogY2hlY2sgZm9yIGNvcnJlY3QgZGljdGlvbmFyeSBpZGVudGlmaWVyICovXG4gIGlmIChzdGF0ZS5tb2RlID09PSBESUNUKSB7XG4gICAgZGljdGlkID0gMTsgLyogYWRsZXIzMigwLCBudWxsLCAwKSovXG4gICAgLyogZGljdGlkID0gYWRsZXIzMihkaWN0aWQsIGRpY3Rpb25hcnksIGRpY3RMZW5ndGgpOyAqL1xuICAgIGRpY3RpZCA9IGFkbGVyMzIoZGljdGlkLCBkaWN0aW9uYXJ5LCBkaWN0TGVuZ3RoLCAwKTtcbiAgICBpZiAoZGljdGlkICE9PSBzdGF0ZS5jaGVjaykge1xuICAgICAgcmV0dXJuIFpfREFUQV9FUlJPUjtcbiAgICB9XG4gIH1cbiAgLyogY29weSBkaWN0aW9uYXJ5IHRvIHdpbmRvdyB1c2luZyB1cGRhdGV3aW5kb3coKSwgd2hpY2ggd2lsbCBhbWVuZCB0aGVcbiAgIGV4aXN0aW5nIGRpY3Rpb25hcnkgaWYgYXBwcm9wcmlhdGUgKi9cbiAgcmV0ID0gdXBkYXRld2luZG93KHN0cm0sIGRpY3Rpb25hcnksIGRpY3RMZW5ndGgsIGRpY3RMZW5ndGgpO1xuICBpZiAocmV0KSB7XG4gICAgc3RhdGUubW9kZSA9IE1FTTtcbiAgICByZXR1cm4gWl9NRU1fRVJST1I7XG4gIH1cbiAgc3RhdGUuaGF2ZWRpY3QgPSAxO1xuICAvLyBUcmFjZXYoKHN0ZGVyciwgXCJpbmZsYXRlOiAgIGRpY3Rpb25hcnkgc2V0XFxuXCIpKTtcbiAgcmV0dXJuIFpfT0s7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ik9BQU8sT0FBTyxPQUFNLFlBQWM7U0FDekIsS0FBSyxTQUFRLFVBQVk7T0FDM0IsWUFBWSxPQUFNLFlBQWM7T0FDaEMsYUFBYSxPQUFNLGFBQWU7TUFHbkMsS0FBSyxHQUFHLENBQUM7TUFDVCxJQUFJLEdBQUcsQ0FBQztNQUNSLEtBQUssR0FBRyxDQUFDO0FBRWYsRUFBZ0YsQUFBaEYsNEVBQWdGLEFBQWhGLEVBQWdGLENBQ2hGLEVBQWdGLEFBQWhGLDRFQUFnRixBQUFoRixFQUFnRixDQUVoRixFQUF5RSxBQUF6RSxxRUFBeUUsQUFBekUsRUFBeUUsQ0FDekUsRUFBNEIsQUFBNUIsMEJBQTRCO0FBQzVCLEVBQTRCLEFBQTVCLDBCQUE0QjtBQUM1QixFQUE0QixBQUE1QiwwQkFBNEI7QUFDNUIsRUFBNEIsQUFBNUIsMEJBQTRCO01BQ3RCLFFBQVEsR0FBRyxDQUFDO01BQ1osT0FBTyxHQUFHLENBQUM7TUFDWCxPQUFPLEdBQUcsQ0FBQztBQUVqQixFQUVHLEFBRkg7O0NBRUcsQUFGSCxFQUVHLE9BQ0csSUFBSSxHQUFHLENBQUM7TUFDUixZQUFZLEdBQUcsQ0FBQztNQUNoQixXQUFXLEdBQUcsQ0FBQztBQUNyQixFQUE2QixBQUE3QiwyQkFBNkI7TUFDdkIsY0FBYyxJQUFJLENBQUM7TUFDbkIsWUFBWSxJQUFJLENBQUM7TUFDakIsV0FBVyxJQUFJLENBQUM7TUFDaEIsV0FBVyxJQUFJLENBQUM7QUFDdEIsRUFBNkIsQUFBN0IsMkJBQTZCO0FBRTdCLEVBQW9DLEFBQXBDLGdDQUFvQyxBQUFwQyxFQUFvQyxPQUM5QixVQUFVLEdBQUcsQ0FBQztBQUVwQixFQUFnRixBQUFoRiw0RUFBZ0YsQUFBaEYsRUFBZ0YsQ0FDaEYsRUFBZ0YsQUFBaEYsNEVBQWdGLEFBQWhGLEVBQWdGLE9BRTFFLElBQUksR0FBRyxDQUFDLENBQUUsQ0FBaUMsQUFBakMsRUFBaUMsQUFBakMsNkJBQWlDLEFBQWpDLEVBQWlDO01BQzNDLEtBQUssR0FBRyxDQUFDLENBQUUsQ0FBNEMsQUFBNUMsRUFBNEMsQUFBNUMsd0NBQTRDLEFBQTVDLEVBQTRDO01BQ3ZELElBQUksR0FBRyxDQUFDLENBQUUsQ0FBNkMsQUFBN0MsRUFBNkMsQUFBN0MseUNBQTZDLEFBQTdDLEVBQTZDO01BQ3ZELEVBQUUsR0FBRyxDQUFDLENBQUUsQ0FBNEQsQUFBNUQsRUFBNEQsQUFBNUQsd0RBQTRELEFBQTVELEVBQTREO01BQ3BFLEtBQUssR0FBRyxDQUFDLENBQUUsQ0FBd0MsQUFBeEMsRUFBd0MsQUFBeEMsb0NBQXdDLEFBQXhDLEVBQXdDO01BQ25ELEtBQUssR0FBRyxDQUFDLENBQUUsQ0FBdUMsQUFBdkMsRUFBdUMsQUFBdkMsbUNBQXVDLEFBQXZDLEVBQXVDO01BQ2xELElBQUksR0FBRyxDQUFDLENBQUUsQ0FBNEMsQUFBNUMsRUFBNEMsQUFBNUMsd0NBQTRDLEFBQTVDLEVBQTRDO01BQ3RELE9BQU8sR0FBRyxDQUFDLENBQUUsQ0FBMEMsQUFBMUMsRUFBMEMsQUFBMUMsc0NBQTBDLEFBQTFDLEVBQTBDO01BQ3ZELElBQUksR0FBRyxDQUFDLENBQUUsQ0FBc0MsQUFBdEMsRUFBc0MsQUFBdEMsa0NBQXNDLEFBQXRDLEVBQXNDO01BQ2hELE1BQU0sR0FBRyxFQUFFLENBQUUsQ0FBMkMsQUFBM0MsRUFBMkMsQUFBM0MsdUNBQTJDLEFBQTNDLEVBQTJDO01BQ3hELElBQUksR0FBRyxFQUFFLENBQUUsQ0FBNkMsQUFBN0MsRUFBNkMsQUFBN0MseUNBQTZDLEFBQTdDLEVBQTZDO01BQ3hELElBQUksR0FBRyxFQUFFLENBQUUsQ0FBdUQsQUFBdkQsRUFBdUQsQUFBdkQsbURBQXVELEFBQXZELEVBQXVEO01BQ2xFLE1BQU0sR0FBRyxFQUFFLENBQUUsQ0FBMEQsQUFBMUQsRUFBMEQsQUFBMUQsc0RBQTBELEFBQTFELEVBQTBEO01BQ3ZFLE1BQU0sR0FBRyxFQUFFLENBQUUsQ0FBd0QsQUFBeEQsRUFBd0QsQUFBeEQsb0RBQXdELEFBQXhELEVBQXdEO01BQ3JFLEtBQUssR0FBRyxFQUFFLENBQUUsQ0FBcUQsQUFBckQsRUFBcUQsQUFBckQsaURBQXFELEFBQXJELEVBQXFEO01BQ2pFLElBQUksR0FBRyxFQUFFLENBQUUsQ0FBMkQsQUFBM0QsRUFBMkQsQUFBM0QsdURBQTJELEFBQTNELEVBQTJEO01BQ3RFLEtBQUssR0FBRyxFQUFFLENBQUUsQ0FBZ0QsQUFBaEQsRUFBZ0QsQUFBaEQsNENBQWdELEFBQWhELEVBQWdEO01BQzVELE9BQU8sR0FBRyxFQUFFLENBQUUsQ0FBNkMsQUFBN0MsRUFBNkMsQUFBN0MseUNBQTZDLEFBQTdDLEVBQTZDO01BQzNELFFBQVEsR0FBRyxFQUFFLENBQUUsQ0FBeUQsQUFBekQsRUFBeUQsQUFBekQscURBQXlELEFBQXpELEVBQXlEO01BQ3hFLElBQUksR0FBRyxFQUFFLENBQUUsQ0FBa0QsQUFBbEQsRUFBa0QsQUFBbEQsOENBQWtELEFBQWxELEVBQWtEO01BQzdELEdBQUcsR0FBRyxFQUFFLENBQUUsQ0FBd0MsQUFBeEMsRUFBd0MsQUFBeEMsb0NBQXdDLEFBQXhDLEVBQXdDO01BQ2xELE1BQU0sR0FBRyxFQUFFLENBQUUsQ0FBc0MsQUFBdEMsRUFBc0MsQUFBdEMsa0NBQXND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