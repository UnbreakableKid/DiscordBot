// See state defs from inflate.js
const BAD = 30; /* got a data error -- remain here until reset */ 
const TYPE = 12; /* i: waiting for type bits, including last-flag bit */ 
export default function inflate_fast(strm, start) {
    let state;
    let _in; /* local strm.input */ 
    let last; /* have enough input while in < last */ 
    let _out; /* local strm.output */ 
    let beg; /* inflate()'s initial strm.output */ 
    let end; /* while out < end, enough space available */ 
    //#ifdef INFLATE_STRICT
    let dmax; /* maximum distance from zlib header */ 
    //#endif
    let wsize; /* window size or zero if not using window */ 
    let whave; /* valid bytes in the window */ 
    let wnext; /* window write index */ 
    // Use `s_window` instead `window`, avoid conflict with instrumentation tools
    let s_window; /* allocated sliding window, if wsize != 0 */ 
    let hold; /* local strm.hold */ 
    let bits; /* local strm.bits */ 
    let lcode; /* local strm.lencode */ 
    let dcode; /* local strm.distcode */ 
    let lmask; /* mask for first level of length codes */ 
    let dmask; /* mask for first level of distance codes */ 
    let here; /* retrieved table entry */ 
    let op; /* code bits, operation, extra bits, or */ 
    /*  window position, window bytes to copy */ let len; /* match length, unused bytes */ 
    let dist; /* match distance */ 
    let from; /* where to copy match from */ 
    let from_source;
    let input, output; // JS specific, because we have no pointers
    /* copy state to local variables */ state = strm.state;
    //here = state.here;
    _in = strm.next_in;
    input = strm.input;
    last = _in + (strm.avail_in - 5);
    _out = strm.next_out;
    output = strm.output;
    beg = _out - (start - strm.avail_out);
    end = _out + (strm.avail_out - 257);
    //#ifdef INFLATE_STRICT
    dmax = state.dmax;
    //#endif
    wsize = state.wsize;
    whave = state.whave;
    wnext = state.wnext;
    s_window = state.window;
    hold = state.hold;
    bits = state.bits;
    lcode = state.lencode;
    dcode = state.distcode;
    lmask = (1 << state.lenbits) - 1;
    dmask = (1 << state.distbits) - 1;
    /* decode literals and length/distances until end-of-block or not enough
     input data or output space */ top: do {
        if (bits < 15) {
            hold += input[_in++] << bits;
            bits += 8;
            hold += input[_in++] << bits;
            bits += 8;
        }
        here = lcode[hold & lmask];
        dolen: for(;;){
            op = here >>> 24;
            hold >>>= op;
            bits -= op;
            op = here >>> 16 & 255;
            if (op === 0) {
                /* literal */ //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
                //        "inflate:         literal '%c'\n" :
                //        "inflate:         literal 0x%02x\n", here.val));
                output[_out++] = here & 65535;
            } else if (op & 16) {
                /* length base */ len = here & 65535;
                op &= 15; /* number of extra bits */ 
                if (op) {
                    if (bits < op) {
                        hold += input[_in++] << bits;
                        bits += 8;
                    }
                    len += hold & (1 << op) - 1;
                    hold >>>= op;
                    bits -= op;
                }
                //Tracevv((stderr, "inflate:         length %u\n", len));
                if (bits < 15) {
                    hold += input[_in++] << bits;
                    bits += 8;
                    hold += input[_in++] << bits;
                    bits += 8;
                }
                here = dcode[hold & dmask];
                dodist: for(;;){
                    op = here >>> 24;
                    hold >>>= op;
                    bits -= op;
                    op = here >>> 16 & 255;
                    if (op & 16) {
                        /* distance base */ dist = here & 65535;
                        op &= 15; /* number of extra bits */ 
                        if (bits < op) {
                            hold += input[_in++] << bits;
                            bits += 8;
                            if (bits < op) {
                                hold += input[_in++] << bits;
                                bits += 8;
                            }
                        }
                        dist += hold & (1 << op) - 1;
                        //#ifdef INFLATE_STRICT
                        if (dist > dmax) {
                            strm.msg = "invalid distance too far back";
                            state.mode = BAD;
                            break top;
                        }
                        //#endif
                        hold >>>= op;
                        bits -= op;
                        //Tracevv((stderr, "inflate:         distance %u\n", dist));
                        op = _out - beg; /* max distance in output */ 
                        if (dist > op) {
                            /* see if copy from window */ op = dist - op; /* distance back in window */ 
                            if (op > whave) {
                                if (state.sane) {
                                    strm.msg = "invalid distance too far back";
                                    state.mode = BAD;
                                    break top;
                                }
                            // (!) This block is disabled in zlib defaults,
                            // don't enable it for binary compatibility
                            //#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
                            //                if (len <= op - whave) {
                            //                  do {
                            //                    output[_out++] = 0;
                            //                  } while (--len);
                            //                  continue top;
                            //                }
                            //                len -= op - whave;
                            //                do {
                            //                  output[_out++] = 0;
                            //                } while (--op > whave);
                            //                if (op === 0) {
                            //                  from = _out - dist;
                            //                  do {
                            //                    output[_out++] = output[from++];
                            //                  } while (--len);
                            //                  continue top;
                            //                }
                            //#endif
                            }
                            from = 0; // window index
                            from_source = s_window;
                            if (wnext === 0) {
                                /* very common case */ from += wsize - op;
                                if (op < len) {
                                    /* some from window */ len -= op;
                                    do {
                                        output[_out++] = s_window[from++];
                                    }while (--op)
                                    from = _out - dist; /* rest from output */ 
                                    from_source = output;
                                }
                            } else if (wnext < op) {
                                /* wrap around window */ from += wsize + wnext - op;
                                op -= wnext;
                                if (op < len) {
                                    /* some from end of window */ len -= op;
                                    do {
                                        output[_out++] = s_window[from++];
                                    }while (--op)
                                    from = 0;
                                    if (wnext < len) {
                                        /* some from start of window */ op = wnext;
                                        len -= op;
                                        do {
                                            output[_out++] = s_window[from++];
                                        }while (--op)
                                        from = _out - dist; /* rest from output */ 
                                        from_source = output;
                                    }
                                }
                            } else {
                                /* contiguous in window */ from += wnext - op;
                                if (op < len) {
                                    /* some from window */ len -= op;
                                    do {
                                        output[_out++] = s_window[from++];
                                    }while (--op)
                                    from = _out - dist; /* rest from output */ 
                                    from_source = output;
                                }
                            }
                            while(len > 2){
                                output[_out++] = from_source[from++];
                                output[_out++] = from_source[from++];
                                output[_out++] = from_source[from++];
                                len -= 3;
                            }
                            if (len) {
                                output[_out++] = from_source[from++];
                                if (len > 1) {
                                    output[_out++] = from_source[from++];
                                }
                            }
                        } else {
                            from = _out - dist; /* copy direct from output */ 
                            do {
                                /* minimum length is three */ output[_out++] = output[from++];
                                output[_out++] = output[from++];
                                output[_out++] = output[from++];
                                len -= 3;
                            }while (len > 2)
                            if (len) {
                                output[_out++] = output[from++];
                                if (len > 1) {
                                    output[_out++] = output[from++];
                                }
                            }
                        }
                    } else if ((op & 64) === 0) {
                        /* 2nd level distance code */ here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                        continue dodist;
                    } else {
                        strm.msg = "invalid distance code";
                        state.mode = BAD;
                        break top;
                    }
                    break; // need to emulate goto via "continue"
                }
            } else if ((op & 64) === 0) {
                /* 2nd level length code */ here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
                continue dolen;
            } else if (op & 32) {
                /* end-of-block */ //Tracevv((stderr, "inflate:         end of block\n"));
                state.mode = TYPE;
                break top;
            } else {
                strm.msg = "invalid literal/length code";
                state.mode = BAD;
                break top;
            }
            break; // need to emulate goto via "continue"
        }
    }while (_in < last && _out < end)
    /* return unused bytes (on entry, bits < 8, so in won't go too far back) */ len = bits >> 3;
    _in -= len;
    bits -= len << 3;
    hold &= (1 << bits) - 1;
    /* update state and return */ strm.next_in = _in;
    strm.next_out = _out;
    strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
    strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
    state.hold = hold;
    state.bits = bits;
    return;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2NvbXByZXNzQHYwLjMuNi96bGliL3psaWIvaW5mZmFzdC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLy8gU2VlIHN0YXRlIGRlZnMgZnJvbSBpbmZsYXRlLmpzXG5jb25zdCBCQUQgPSAzMDsgLyogZ290IGEgZGF0YSBlcnJvciAtLSByZW1haW4gaGVyZSB1bnRpbCByZXNldCAqL1xuY29uc3QgVFlQRSA9IDEyOyAvKiBpOiB3YWl0aW5nIGZvciB0eXBlIGJpdHMsIGluY2x1ZGluZyBsYXN0LWZsYWcgYml0ICovXG5cbi8qXG4gICBEZWNvZGUgbGl0ZXJhbCwgbGVuZ3RoLCBhbmQgZGlzdGFuY2UgY29kZXMgYW5kIHdyaXRlIG91dCB0aGUgcmVzdWx0aW5nXG4gICBsaXRlcmFsIGFuZCBtYXRjaCBieXRlcyB1bnRpbCBlaXRoZXIgbm90IGVub3VnaCBpbnB1dCBvciBvdXRwdXQgaXNcbiAgIGF2YWlsYWJsZSwgYW4gZW5kLW9mLWJsb2NrIGlzIGVuY291bnRlcmVkLCBvciBhIGRhdGEgZXJyb3IgaXMgZW5jb3VudGVyZWQuXG4gICBXaGVuIGxhcmdlIGVub3VnaCBpbnB1dCBhbmQgb3V0cHV0IGJ1ZmZlcnMgYXJlIHN1cHBsaWVkIHRvIGluZmxhdGUoKSwgZm9yXG4gICBleGFtcGxlLCBhIDE2SyBpbnB1dCBidWZmZXIgYW5kIGEgNjRLIG91dHB1dCBidWZmZXIsIG1vcmUgdGhhbiA5NSUgb2YgdGhlXG4gICBpbmZsYXRlIGV4ZWN1dGlvbiB0aW1lIGlzIHNwZW50IGluIHRoaXMgcm91dGluZS5cblxuICAgRW50cnkgYXNzdW1wdGlvbnM6XG5cbiAgICAgICAgc3RhdGUubW9kZSA9PT0gTEVOXG4gICAgICAgIHN0cm0uYXZhaWxfaW4gPj0gNlxuICAgICAgICBzdHJtLmF2YWlsX291dCA+PSAyNThcbiAgICAgICAgc3RhcnQgPj0gc3RybS5hdmFpbF9vdXRcbiAgICAgICAgc3RhdGUuYml0cyA8IDhcblxuICAgT24gcmV0dXJuLCBzdGF0ZS5tb2RlIGlzIG9uZSBvZjpcblxuICAgICAgICBMRU4gLS0gcmFuIG91dCBvZiBlbm91Z2ggb3V0cHV0IHNwYWNlIG9yIGVub3VnaCBhdmFpbGFibGUgaW5wdXRcbiAgICAgICAgVFlQRSAtLSByZWFjaGVkIGVuZCBvZiBibG9jayBjb2RlLCBpbmZsYXRlKCkgdG8gaW50ZXJwcmV0IG5leHQgYmxvY2tcbiAgICAgICAgQkFEIC0tIGVycm9yIGluIGJsb2NrIGRhdGFcblxuICAgTm90ZXM6XG5cbiAgICAtIFRoZSBtYXhpbXVtIGlucHV0IGJpdHMgdXNlZCBieSBhIGxlbmd0aC9kaXN0YW5jZSBwYWlyIGlzIDE1IGJpdHMgZm9yIHRoZVxuICAgICAgbGVuZ3RoIGNvZGUsIDUgYml0cyBmb3IgdGhlIGxlbmd0aCBleHRyYSwgMTUgYml0cyBmb3IgdGhlIGRpc3RhbmNlIGNvZGUsXG4gICAgICBhbmQgMTMgYml0cyBmb3IgdGhlIGRpc3RhbmNlIGV4dHJhLiAgVGhpcyB0b3RhbHMgNDggYml0cywgb3Igc2l4IGJ5dGVzLlxuICAgICAgVGhlcmVmb3JlIGlmIHN0cm0uYXZhaWxfaW4gPj0gNiwgdGhlbiB0aGVyZSBpcyBlbm91Z2ggaW5wdXQgdG8gYXZvaWRcbiAgICAgIGNoZWNraW5nIGZvciBhdmFpbGFibGUgaW5wdXQgd2hpbGUgZGVjb2RpbmcuXG5cbiAgICAtIFRoZSBtYXhpbXVtIGJ5dGVzIHRoYXQgYSBzaW5nbGUgbGVuZ3RoL2Rpc3RhbmNlIHBhaXIgY2FuIG91dHB1dCBpcyAyNThcbiAgICAgIGJ5dGVzLCB3aGljaCBpcyB0aGUgbWF4aW11bSBsZW5ndGggdGhhdCBjYW4gYmUgY29kZWQuICBpbmZsYXRlX2Zhc3QoKVxuICAgICAgcmVxdWlyZXMgc3RybS5hdmFpbF9vdXQgPj0gMjU4IGZvciBlYWNoIGxvb3AgdG8gYXZvaWQgY2hlY2tpbmcgZm9yXG4gICAgICBvdXRwdXQgc3BhY2UuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGluZmxhdGVfZmFzdChzdHJtOiBhbnksIHN0YXJ0OiBudW1iZXIpIHtcbiAgbGV0IHN0YXRlO1xuICBsZXQgX2luOyAvKiBsb2NhbCBzdHJtLmlucHV0ICovXG4gIGxldCBsYXN0OyAvKiBoYXZlIGVub3VnaCBpbnB1dCB3aGlsZSBpbiA8IGxhc3QgKi9cbiAgbGV0IF9vdXQ7IC8qIGxvY2FsIHN0cm0ub3V0cHV0ICovXG4gIGxldCBiZWc7IC8qIGluZmxhdGUoKSdzIGluaXRpYWwgc3RybS5vdXRwdXQgKi9cbiAgbGV0IGVuZDsgLyogd2hpbGUgb3V0IDwgZW5kLCBlbm91Z2ggc3BhY2UgYXZhaWxhYmxlICovXG4gIC8vI2lmZGVmIElORkxBVEVfU1RSSUNUXG4gIGxldCBkbWF4OyAvKiBtYXhpbXVtIGRpc3RhbmNlIGZyb20gemxpYiBoZWFkZXIgKi9cbiAgLy8jZW5kaWZcbiAgbGV0IHdzaXplOyAvKiB3aW5kb3cgc2l6ZSBvciB6ZXJvIGlmIG5vdCB1c2luZyB3aW5kb3cgKi9cbiAgbGV0IHdoYXZlOyAvKiB2YWxpZCBieXRlcyBpbiB0aGUgd2luZG93ICovXG4gIGxldCB3bmV4dDsgLyogd2luZG93IHdyaXRlIGluZGV4ICovXG4gIC8vIFVzZSBgc193aW5kb3dgIGluc3RlYWQgYHdpbmRvd2AsIGF2b2lkIGNvbmZsaWN0IHdpdGggaW5zdHJ1bWVudGF0aW9uIHRvb2xzXG4gIGxldCBzX3dpbmRvdzsgLyogYWxsb2NhdGVkIHNsaWRpbmcgd2luZG93LCBpZiB3c2l6ZSAhPSAwICovXG4gIGxldCBob2xkOyAvKiBsb2NhbCBzdHJtLmhvbGQgKi9cbiAgbGV0IGJpdHM7IC8qIGxvY2FsIHN0cm0uYml0cyAqL1xuICBsZXQgbGNvZGU7IC8qIGxvY2FsIHN0cm0ubGVuY29kZSAqL1xuICBsZXQgZGNvZGU7IC8qIGxvY2FsIHN0cm0uZGlzdGNvZGUgKi9cbiAgbGV0IGxtYXNrOyAvKiBtYXNrIGZvciBmaXJzdCBsZXZlbCBvZiBsZW5ndGggY29kZXMgKi9cbiAgbGV0IGRtYXNrOyAvKiBtYXNrIGZvciBmaXJzdCBsZXZlbCBvZiBkaXN0YW5jZSBjb2RlcyAqL1xuICBsZXQgaGVyZTsgLyogcmV0cmlldmVkIHRhYmxlIGVudHJ5ICovXG4gIGxldCBvcDsgLyogY29kZSBiaXRzLCBvcGVyYXRpb24sIGV4dHJhIGJpdHMsIG9yICovXG4gIC8qICB3aW5kb3cgcG9zaXRpb24sIHdpbmRvdyBieXRlcyB0byBjb3B5ICovXG4gIGxldCBsZW47IC8qIG1hdGNoIGxlbmd0aCwgdW51c2VkIGJ5dGVzICovXG4gIGxldCBkaXN0OyAvKiBtYXRjaCBkaXN0YW5jZSAqL1xuICBsZXQgZnJvbTsgLyogd2hlcmUgdG8gY29weSBtYXRjaCBmcm9tICovXG4gIGxldCBmcm9tX3NvdXJjZTtcblxuICBsZXQgaW5wdXQsIG91dHB1dDsgLy8gSlMgc3BlY2lmaWMsIGJlY2F1c2Ugd2UgaGF2ZSBubyBwb2ludGVyc1xuXG4gIC8qIGNvcHkgc3RhdGUgdG8gbG9jYWwgdmFyaWFibGVzICovXG4gIHN0YXRlID0gc3RybS5zdGF0ZTtcbiAgLy9oZXJlID0gc3RhdGUuaGVyZTtcbiAgX2luID0gc3RybS5uZXh0X2luO1xuICBpbnB1dCA9IHN0cm0uaW5wdXQ7XG4gIGxhc3QgPSBfaW4gKyAoc3RybS5hdmFpbF9pbiAtIDUpO1xuICBfb3V0ID0gc3RybS5uZXh0X291dDtcbiAgb3V0cHV0ID0gc3RybS5vdXRwdXQ7XG4gIGJlZyA9IF9vdXQgLSAoc3RhcnQgLSBzdHJtLmF2YWlsX291dCk7XG4gIGVuZCA9IF9vdXQgKyAoc3RybS5hdmFpbF9vdXQgLSAyNTcpO1xuICAvLyNpZmRlZiBJTkZMQVRFX1NUUklDVFxuICBkbWF4ID0gc3RhdGUuZG1heDtcbiAgLy8jZW5kaWZcbiAgd3NpemUgPSBzdGF0ZS53c2l6ZTtcbiAgd2hhdmUgPSBzdGF0ZS53aGF2ZTtcbiAgd25leHQgPSBzdGF0ZS53bmV4dDtcbiAgc193aW5kb3cgPSBzdGF0ZS53aW5kb3c7XG4gIGhvbGQgPSBzdGF0ZS5ob2xkO1xuICBiaXRzID0gc3RhdGUuYml0cztcbiAgbGNvZGUgPSBzdGF0ZS5sZW5jb2RlO1xuICBkY29kZSA9IHN0YXRlLmRpc3Rjb2RlO1xuICBsbWFzayA9ICgxIDw8IHN0YXRlLmxlbmJpdHMpIC0gMTtcbiAgZG1hc2sgPSAoMSA8PCBzdGF0ZS5kaXN0Yml0cykgLSAxO1xuXG4gIC8qIGRlY29kZSBsaXRlcmFscyBhbmQgbGVuZ3RoL2Rpc3RhbmNlcyB1bnRpbCBlbmQtb2YtYmxvY2sgb3Igbm90IGVub3VnaFxuICAgICBpbnB1dCBkYXRhIG9yIG91dHB1dCBzcGFjZSAqL1xuXG4gIHRvcDpcbiAgZG8ge1xuICAgIGlmIChiaXRzIDwgMTUpIHtcbiAgICAgIGhvbGQgKz0gaW5wdXRbX2luKytdIDw8IGJpdHM7XG4gICAgICBiaXRzICs9IDg7XG4gICAgICBob2xkICs9IGlucHV0W19pbisrXSA8PCBiaXRzO1xuICAgICAgYml0cyArPSA4O1xuICAgIH1cblxuICAgIGhlcmUgPSBsY29kZVtob2xkICYgbG1hc2tdO1xuXG4gICAgZG9sZW46XG4gICAgZm9yICg7OykgeyAvLyBHb3RvIGVtdWxhdGlvblxuICAgICAgb3AgPSBoZXJlID4+PiAyNCAvKmhlcmUuYml0cyovO1xuICAgICAgaG9sZCA+Pj49IG9wO1xuICAgICAgYml0cyAtPSBvcDtcbiAgICAgIG9wID0gKGhlcmUgPj4+IDE2KSAmIDB4ZmYgLypoZXJlLm9wKi87XG4gICAgICBpZiAob3AgPT09IDApIHtcbiAgICAgICAgLyogbGl0ZXJhbCAqL1xuICAgICAgICAvL1RyYWNldnYoKHN0ZGVyciwgaGVyZS52YWwgPj0gMHgyMCAmJiBoZXJlLnZhbCA8IDB4N2YgP1xuICAgICAgICAvLyAgICAgICAgXCJpbmZsYXRlOiAgICAgICAgIGxpdGVyYWwgJyVjJ1xcblwiIDpcbiAgICAgICAgLy8gICAgICAgIFwiaW5mbGF0ZTogICAgICAgICBsaXRlcmFsIDB4JTAyeFxcblwiLCBoZXJlLnZhbCkpO1xuICAgICAgICBvdXRwdXRbX291dCsrXSA9IGhlcmUgJiAweGZmZmYgLypoZXJlLnZhbCovO1xuICAgICAgfSBlbHNlIGlmIChvcCAmIDE2KSB7XG4gICAgICAgIC8qIGxlbmd0aCBiYXNlICovXG4gICAgICAgIGxlbiA9IGhlcmUgJiAweGZmZmYgLypoZXJlLnZhbCovO1xuICAgICAgICBvcCAmPSAxNTsgLyogbnVtYmVyIG9mIGV4dHJhIGJpdHMgKi9cbiAgICAgICAgaWYgKG9wKSB7XG4gICAgICAgICAgaWYgKGJpdHMgPCBvcCkge1xuICAgICAgICAgICAgaG9sZCArPSBpbnB1dFtfaW4rK10gPDwgYml0cztcbiAgICAgICAgICAgIGJpdHMgKz0gODtcbiAgICAgICAgICB9XG4gICAgICAgICAgbGVuICs9IGhvbGQgJiAoKDEgPDwgb3ApIC0gMSk7XG4gICAgICAgICAgaG9sZCA+Pj49IG9wO1xuICAgICAgICAgIGJpdHMgLT0gb3A7XG4gICAgICAgIH1cbiAgICAgICAgLy9UcmFjZXZ2KChzdGRlcnIsIFwiaW5mbGF0ZTogICAgICAgICBsZW5ndGggJXVcXG5cIiwgbGVuKSk7XG4gICAgICAgIGlmIChiaXRzIDwgMTUpIHtcbiAgICAgICAgICBob2xkICs9IGlucHV0W19pbisrXSA8PCBiaXRzO1xuICAgICAgICAgIGJpdHMgKz0gODtcbiAgICAgICAgICBob2xkICs9IGlucHV0W19pbisrXSA8PCBiaXRzO1xuICAgICAgICAgIGJpdHMgKz0gODtcbiAgICAgICAgfVxuICAgICAgICBoZXJlID0gZGNvZGVbaG9sZCAmIGRtYXNrXTtcblxuICAgICAgICBkb2Rpc3Q6XG4gICAgICAgIGZvciAoOzspIHsgLy8gZ290byBlbXVsYXRpb25cbiAgICAgICAgICBvcCA9IGhlcmUgPj4+IDI0IC8qaGVyZS5iaXRzKi87XG4gICAgICAgICAgaG9sZCA+Pj49IG9wO1xuICAgICAgICAgIGJpdHMgLT0gb3A7XG4gICAgICAgICAgb3AgPSAoaGVyZSA+Pj4gMTYpICYgMHhmZiAvKmhlcmUub3AqLztcblxuICAgICAgICAgIGlmIChvcCAmIDE2KSB7XG4gICAgICAgICAgICAvKiBkaXN0YW5jZSBiYXNlICovXG4gICAgICAgICAgICBkaXN0ID0gaGVyZSAmIDB4ZmZmZiAvKmhlcmUudmFsKi87XG4gICAgICAgICAgICBvcCAmPSAxNTsgLyogbnVtYmVyIG9mIGV4dHJhIGJpdHMgKi9cbiAgICAgICAgICAgIGlmIChiaXRzIDwgb3ApIHtcbiAgICAgICAgICAgICAgaG9sZCArPSBpbnB1dFtfaW4rK10gPDwgYml0cztcbiAgICAgICAgICAgICAgYml0cyArPSA4O1xuICAgICAgICAgICAgICBpZiAoYml0cyA8IG9wKSB7XG4gICAgICAgICAgICAgICAgaG9sZCArPSBpbnB1dFtfaW4rK10gPDwgYml0cztcbiAgICAgICAgICAgICAgICBiaXRzICs9IDg7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRpc3QgKz0gaG9sZCAmICgoMSA8PCBvcCkgLSAxKTtcbiAgICAgICAgICAgIC8vI2lmZGVmIElORkxBVEVfU1RSSUNUXG4gICAgICAgICAgICBpZiAoZGlzdCA+IGRtYXgpIHtcbiAgICAgICAgICAgICAgc3RybS5tc2cgPSBcImludmFsaWQgZGlzdGFuY2UgdG9vIGZhciBiYWNrXCI7XG4gICAgICAgICAgICAgIHN0YXRlLm1vZGUgPSBCQUQ7XG4gICAgICAgICAgICAgIGJyZWFrIHRvcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vI2VuZGlmXG4gICAgICAgICAgICBob2xkID4+Pj0gb3A7XG4gICAgICAgICAgICBiaXRzIC09IG9wO1xuICAgICAgICAgICAgLy9UcmFjZXZ2KChzdGRlcnIsIFwiaW5mbGF0ZTogICAgICAgICBkaXN0YW5jZSAldVxcblwiLCBkaXN0KSk7XG4gICAgICAgICAgICBvcCA9IF9vdXQgLSBiZWc7IC8qIG1heCBkaXN0YW5jZSBpbiBvdXRwdXQgKi9cbiAgICAgICAgICAgIGlmIChkaXN0ID4gb3ApIHtcbiAgICAgICAgICAgICAgLyogc2VlIGlmIGNvcHkgZnJvbSB3aW5kb3cgKi9cbiAgICAgICAgICAgICAgb3AgPSBkaXN0IC0gb3A7IC8qIGRpc3RhbmNlIGJhY2sgaW4gd2luZG93ICovXG4gICAgICAgICAgICAgIGlmIChvcCA+IHdoYXZlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlLnNhbmUpIHtcbiAgICAgICAgICAgICAgICAgIHN0cm0ubXNnID0gXCJpbnZhbGlkIGRpc3RhbmNlIHRvbyBmYXIgYmFja1wiO1xuICAgICAgICAgICAgICAgICAgc3RhdGUubW9kZSA9IEJBRDtcbiAgICAgICAgICAgICAgICAgIGJyZWFrIHRvcDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyAoISkgVGhpcyBibG9jayBpcyBkaXNhYmxlZCBpbiB6bGliIGRlZmF1bHRzLFxuICAgICAgICAgICAgICAgIC8vIGRvbid0IGVuYWJsZSBpdCBmb3IgYmluYXJ5IGNvbXBhdGliaWxpdHlcbiAgICAgICAgICAgICAgICAvLyNpZmRlZiBJTkZMQVRFX0FMTE9XX0lOVkFMSURfRElTVEFOQ0VfVE9PRkFSX0FSUlJcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICBpZiAobGVuIDw9IG9wIC0gd2hhdmUpIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgb3V0cHV0W19vdXQrK10gPSAwO1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgICAgfSB3aGlsZSAoLS1sZW4pO1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgICAgY29udGludWUgdG9wO1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICBsZW4gLT0gb3AgLSB3aGF2ZTtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAgICAgICBvdXRwdXRbX291dCsrXSA9IDA7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAgICAgfSB3aGlsZSAoLS1vcCA+IHdoYXZlKTtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICBpZiAob3AgPT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgIGZyb20gPSBfb3V0IC0gZGlzdDtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgb3V0cHV0W19vdXQrK10gPSBvdXRwdXRbZnJvbSsrXTtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgIH0gd2hpbGUgKC0tbGVuKTtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIHRvcDtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8jZW5kaWZcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBmcm9tID0gMDsgLy8gd2luZG93IGluZGV4XG4gICAgICAgICAgICAgIGZyb21fc291cmNlID0gc193aW5kb3c7XG4gICAgICAgICAgICAgIGlmICh3bmV4dCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIC8qIHZlcnkgY29tbW9uIGNhc2UgKi9cbiAgICAgICAgICAgICAgICBmcm9tICs9IHdzaXplIC0gb3A7XG4gICAgICAgICAgICAgICAgaWYgKG9wIDwgbGVuKSB7XG4gICAgICAgICAgICAgICAgICAvKiBzb21lIGZyb20gd2luZG93ICovXG4gICAgICAgICAgICAgICAgICBsZW4gLT0gb3A7XG4gICAgICAgICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dFtfb3V0KytdID0gc193aW5kb3dbZnJvbSsrXTtcbiAgICAgICAgICAgICAgICAgIH0gd2hpbGUgKC0tb3ApO1xuICAgICAgICAgICAgICAgICAgZnJvbSA9IF9vdXQgLSBkaXN0OyAvKiByZXN0IGZyb20gb3V0cHV0ICovXG4gICAgICAgICAgICAgICAgICBmcm9tX3NvdXJjZSA9IG91dHB1dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAod25leHQgPCBvcCkge1xuICAgICAgICAgICAgICAgIC8qIHdyYXAgYXJvdW5kIHdpbmRvdyAqL1xuICAgICAgICAgICAgICAgIGZyb20gKz0gd3NpemUgKyB3bmV4dCAtIG9wO1xuICAgICAgICAgICAgICAgIG9wIC09IHduZXh0O1xuICAgICAgICAgICAgICAgIGlmIChvcCA8IGxlbikge1xuICAgICAgICAgICAgICAgICAgLyogc29tZSBmcm9tIGVuZCBvZiB3aW5kb3cgKi9cbiAgICAgICAgICAgICAgICAgIGxlbiAtPSBvcDtcbiAgICAgICAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0W19vdXQrK10gPSBzX3dpbmRvd1tmcm9tKytdO1xuICAgICAgICAgICAgICAgICAgfSB3aGlsZSAoLS1vcCk7XG4gICAgICAgICAgICAgICAgICBmcm9tID0gMDtcbiAgICAgICAgICAgICAgICAgIGlmICh3bmV4dCA8IGxlbikge1xuICAgICAgICAgICAgICAgICAgICAvKiBzb21lIGZyb20gc3RhcnQgb2Ygd2luZG93ICovXG4gICAgICAgICAgICAgICAgICAgIG9wID0gd25leHQ7XG4gICAgICAgICAgICAgICAgICAgIGxlbiAtPSBvcDtcbiAgICAgICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICAgIG91dHB1dFtfb3V0KytdID0gc193aW5kb3dbZnJvbSsrXTtcbiAgICAgICAgICAgICAgICAgICAgfSB3aGlsZSAoLS1vcCk7XG4gICAgICAgICAgICAgICAgICAgIGZyb20gPSBfb3V0IC0gZGlzdDsgLyogcmVzdCBmcm9tIG91dHB1dCAqL1xuICAgICAgICAgICAgICAgICAgICBmcm9tX3NvdXJjZSA9IG91dHB1dDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLyogY29udGlndW91cyBpbiB3aW5kb3cgKi9cbiAgICAgICAgICAgICAgICBmcm9tICs9IHduZXh0IC0gb3A7XG4gICAgICAgICAgICAgICAgaWYgKG9wIDwgbGVuKSB7XG4gICAgICAgICAgICAgICAgICAvKiBzb21lIGZyb20gd2luZG93ICovXG4gICAgICAgICAgICAgICAgICBsZW4gLT0gb3A7XG4gICAgICAgICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dFtfb3V0KytdID0gc193aW5kb3dbZnJvbSsrXTtcbiAgICAgICAgICAgICAgICAgIH0gd2hpbGUgKC0tb3ApO1xuICAgICAgICAgICAgICAgICAgZnJvbSA9IF9vdXQgLSBkaXN0OyAvKiByZXN0IGZyb20gb3V0cHV0ICovXG4gICAgICAgICAgICAgICAgICBmcm9tX3NvdXJjZSA9IG91dHB1dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgd2hpbGUgKGxlbiA+IDIpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRbX291dCsrXSA9IGZyb21fc291cmNlW2Zyb20rK107XG4gICAgICAgICAgICAgICAgb3V0cHV0W19vdXQrK10gPSBmcm9tX3NvdXJjZVtmcm9tKytdO1xuICAgICAgICAgICAgICAgIG91dHB1dFtfb3V0KytdID0gZnJvbV9zb3VyY2VbZnJvbSsrXTtcbiAgICAgICAgICAgICAgICBsZW4gLT0gMztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAobGVuKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0W19vdXQrK10gPSBmcm9tX3NvdXJjZVtmcm9tKytdO1xuICAgICAgICAgICAgICAgIGlmIChsZW4gPiAxKSB7XG4gICAgICAgICAgICAgICAgICBvdXRwdXRbX291dCsrXSA9IGZyb21fc291cmNlW2Zyb20rK107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmcm9tID0gX291dCAtIGRpc3Q7IC8qIGNvcHkgZGlyZWN0IGZyb20gb3V0cHV0ICovXG4gICAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICAvKiBtaW5pbXVtIGxlbmd0aCBpcyB0aHJlZSAqL1xuICAgICAgICAgICAgICAgIG91dHB1dFtfb3V0KytdID0gb3V0cHV0W2Zyb20rK107XG4gICAgICAgICAgICAgICAgb3V0cHV0W19vdXQrK10gPSBvdXRwdXRbZnJvbSsrXTtcbiAgICAgICAgICAgICAgICBvdXRwdXRbX291dCsrXSA9IG91dHB1dFtmcm9tKytdO1xuICAgICAgICAgICAgICAgIGxlbiAtPSAzO1xuICAgICAgICAgICAgICB9IHdoaWxlIChsZW4gPiAyKTtcbiAgICAgICAgICAgICAgaWYgKGxlbikge1xuICAgICAgICAgICAgICAgIG91dHB1dFtfb3V0KytdID0gb3V0cHV0W2Zyb20rK107XG4gICAgICAgICAgICAgICAgaWYgKGxlbiA+IDEpIHtcbiAgICAgICAgICAgICAgICAgIG91dHB1dFtfb3V0KytdID0gb3V0cHV0W2Zyb20rK107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmICgob3AgJiA2NCkgPT09IDApIHtcbiAgICAgICAgICAgIC8qIDJuZCBsZXZlbCBkaXN0YW5jZSBjb2RlICovXG4gICAgICAgICAgICBoZXJlID1cbiAgICAgICAgICAgICAgZGNvZGVbKGhlcmUgJiAweGZmZmYpIC8qaGVyZS52YWwqLyArIChob2xkICYgKCgxIDw8IG9wKSAtIDEpKV07XG4gICAgICAgICAgICBjb250aW51ZSBkb2Rpc3Q7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0cm0ubXNnID0gXCJpbnZhbGlkIGRpc3RhbmNlIGNvZGVcIjtcbiAgICAgICAgICAgIHN0YXRlLm1vZGUgPSBCQUQ7XG4gICAgICAgICAgICBicmVhayB0b3A7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYnJlYWs7IC8vIG5lZWQgdG8gZW11bGF0ZSBnb3RvIHZpYSBcImNvbnRpbnVlXCJcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICgob3AgJiA2NCkgPT09IDApIHtcbiAgICAgICAgLyogMm5kIGxldmVsIGxlbmd0aCBjb2RlICovXG4gICAgICAgIGhlcmUgPSBsY29kZVsoaGVyZSAmIDB4ZmZmZikgLypoZXJlLnZhbCovICsgKGhvbGQgJiAoKDEgPDwgb3ApIC0gMSkpXTtcbiAgICAgICAgY29udGludWUgZG9sZW47XG4gICAgICB9IGVsc2UgaWYgKG9wICYgMzIpIHtcbiAgICAgICAgLyogZW5kLW9mLWJsb2NrICovXG4gICAgICAgIC8vVHJhY2V2digoc3RkZXJyLCBcImluZmxhdGU6ICAgICAgICAgZW5kIG9mIGJsb2NrXFxuXCIpKTtcbiAgICAgICAgc3RhdGUubW9kZSA9IFRZUEU7XG4gICAgICAgIGJyZWFrIHRvcDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0cm0ubXNnID0gXCJpbnZhbGlkIGxpdGVyYWwvbGVuZ3RoIGNvZGVcIjtcbiAgICAgICAgc3RhdGUubW9kZSA9IEJBRDtcbiAgICAgICAgYnJlYWsgdG9wO1xuICAgICAgfVxuXG4gICAgICBicmVhazsgLy8gbmVlZCB0byBlbXVsYXRlIGdvdG8gdmlhIFwiY29udGludWVcIlxuICAgIH1cbiAgfSB3aGlsZSAoX2luIDwgbGFzdCAmJiBfb3V0IDwgZW5kKTtcblxuICAvKiByZXR1cm4gdW51c2VkIGJ5dGVzIChvbiBlbnRyeSwgYml0cyA8IDgsIHNvIGluIHdvbid0IGdvIHRvbyBmYXIgYmFjaykgKi9cbiAgbGVuID0gYml0cyA+PiAzO1xuICBfaW4gLT0gbGVuO1xuICBiaXRzIC09IGxlbiA8PCAzO1xuICBob2xkICY9ICgxIDw8IGJpdHMpIC0gMTtcblxuICAvKiB1cGRhdGUgc3RhdGUgYW5kIHJldHVybiAqL1xuICBzdHJtLm5leHRfaW4gPSBfaW47XG4gIHN0cm0ubmV4dF9vdXQgPSBfb3V0O1xuICBzdHJtLmF2YWlsX2luID0gKF9pbiA8IGxhc3QgPyA1ICsgKGxhc3QgLSBfaW4pIDogNSAtIChfaW4gLSBsYXN0KSk7XG4gIHN0cm0uYXZhaWxfb3V0ID0gKF9vdXQgPCBlbmQgPyAyNTcgKyAoZW5kIC0gX291dCkgOiAyNTcgLSAoX291dCAtIGVuZCkpO1xuICBzdGF0ZS5ob2xkID0gaG9sZDtcbiAgc3RhdGUuYml0cyA9IGJpdHM7XG4gIHJldHVybjtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUFpQyxBQUFqQywrQkFBaUM7TUFDM0IsR0FBRyxHQUFHLEVBQUUsQ0FBRSxDQUFpRCxBQUFqRCxFQUFpRCxBQUFqRCw2Q0FBaUQsQUFBakQsRUFBaUQ7TUFDM0QsSUFBSSxHQUFHLEVBQUUsQ0FBRSxDQUF1RCxBQUF2RCxFQUF1RCxBQUF2RCxtREFBdUQsQUFBdkQsRUFBdUQ7d0JBcUNoRCxZQUFZLENBQUMsSUFBUyxFQUFFLEtBQWE7UUFDdkQsS0FBSztRQUNMLEdBQUcsQ0FBRSxDQUFzQixBQUF0QixFQUFzQixBQUF0QixrQkFBc0IsQUFBdEIsRUFBc0I7UUFDM0IsSUFBSSxDQUFFLENBQXVDLEFBQXZDLEVBQXVDLEFBQXZDLG1DQUF1QyxBQUF2QyxFQUF1QztRQUM3QyxJQUFJLENBQUUsQ0FBdUIsQUFBdkIsRUFBdUIsQUFBdkIsbUJBQXVCLEFBQXZCLEVBQXVCO1FBQzdCLEdBQUcsQ0FBRSxDQUFxQyxBQUFyQyxFQUFxQyxBQUFyQyxpQ0FBcUMsQUFBckMsRUFBcUM7UUFDMUMsR0FBRyxDQUFFLENBQTZDLEFBQTdDLEVBQTZDLEFBQTdDLHlDQUE2QyxBQUE3QyxFQUE2QztJQUN0RCxFQUF1QixBQUF2QixxQkFBdUI7UUFDbkIsSUFBSSxDQUFFLENBQXVDLEFBQXZDLEVBQXVDLEFBQXZDLG1DQUF1QyxBQUF2QyxFQUF1QztJQUNqRCxFQUFRLEFBQVIsTUFBUTtR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