import { message as msg } from "./messages.ts";
import * as trees from "./trees.ts";
import adler32 from "./adler32.ts";
import { crc32 } from "./crc32.ts";
import STATUS from "./status.ts";
/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */ const Z_OK = 0;
const Z_STREAM_END = 1;
//const Z_NEED_DICT     = 2;
//const Z_ERRNO         = -1;
const Z_STREAM_ERROR = -2;
const Z_DATA_ERROR = -3;
//const Z_MEM_ERROR     = -4;
const Z_BUF_ERROR = -5;
//const Z_VERSION_ERROR = -6;
/* compression levels */
//const Z_NO_COMPRESSION      = 0;
//const Z_BEST_SPEED          = 1;
//const Z_BEST_COMPRESSION    = 9;
const Z_DEFAULT_COMPRESSION = -1;
const Z_FILTERED = 1;
const Z_HUFFMAN_ONLY = 2;
const Z_RLE = 3;
const Z_FIXED = 4;
const Z_DEFAULT_STRATEGY = 0;
/* Possible values of the data_type field (though see inflate()) */
//const Z_BINARY              = 0;
//const Z_TEXT                = 1;
//const Z_ASCII               = 1; // = Z_TEXT
const Z_UNKNOWN = 2;
/* The deflate compression method */ const Z_DEFLATED = 8;
const MAX_MEM_LEVEL = 9;
/* Maximum value for memLevel in deflateInit2 */ const MAX_WBITS = 15;
/* 32K LZ77 window */ const DEF_MEM_LEVEL = 8;
const LENGTH_CODES = 29;
/* number of length codes, not counting the special END_BLOCK code */ const LITERALS =
  256;
/* number of literal bytes 0..255 */ const L_CODES = LITERALS + 1 +
  LENGTH_CODES;
/* number of Literal or Length codes, including the END_BLOCK code */ const D_CODES =
  30;
/* number of distance codes */ const BL_CODES = 19;
/* number of codes used to transfer the bit lengths */ const HEAP_SIZE =
  2 * L_CODES + 1;
/* maximum heap size */ const MAX_BITS = 15;
/* All codes must not exceed MAX_BITS bits */ const MIN_MATCH = 3;
const MAX_MATCH = 258;
const MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
const PRESET_DICT = 32;
const INIT_STATE = 42;
const EXTRA_STATE = 69;
const NAME_STATE = 73;
const COMMENT_STATE = 91;
const HCRC_STATE = 103;
const BUSY_STATE = 113;
const FINISH_STATE = 666;
const BS_NEED_MORE =
  1; /* block not completed, need more input or more output */
const BS_BLOCK_DONE = 2; /* block flush performed */
const BS_FINISH_STARTED =
  3; /* finish started, need only more output at next deflate */
const BS_FINISH_DONE = 4; /* finish done, accept no more input or output */
const OS_CODE = 3; // Unix :) . Don't detect, use this default.
function err(strm, errorCode) {
  strm.msg = msg[errorCode];
  return errorCode;
}
function rank(f) {
  return (f << 1) - (f > 4 ? 9 : 0);
}
function zero(buf) {
  buf.fill(0, 0, buf.length);
}
/* =========================================================================
 * Flush as much pending output as possible. All deflate() output goes
 * through this function so some applications may wish to modify it
 * to avoid allocating a large strm->output buffer and copying into it.
 * (See also read_buf()).
 */ function flush_pending(strm) {
  let s = strm.state;
  //_tr_flush_bits(s);
  let len = s.pending;
  if (len > strm.avail_out) {
    len = strm.avail_out;
  }
  if (len === 0) return;
  strm.output.set(
    s.pending_buf.subarray(s.pending_out, s.pending_out + len),
    strm.next_out,
  );
  strm.next_out += len;
  s.pending_out += len;
  strm.total_out += len;
  strm.avail_out -= len;
  s.pending -= len;
  if (s.pending === 0) {
    s.pending_out = 0;
  }
}
function flush_block_only(s, last) {
  trees._tr_flush_block(
    s,
    s.block_start >= 0 ? s.block_start : -1,
    s.strstart - s.block_start,
    last,
  );
  s.block_start = s.strstart;
  flush_pending(s.strm);
}
function put_byte(s, b) {
  s.pending_buf[s.pending++] = b;
}
/* =========================================================================
 * Put a short in the pending buffer. The 16-bit value is put in MSB order.
 * IN assertion: the stream state is correct and there is enough room in
 * pending_buf.
 */ function putShortMSB(s, b) {
  //  put_byte(s, (Byte)(b >> 8));
  //  put_byte(s, (Byte)(b & 0xff));
  s.pending_buf[s.pending++] = b >>> 8 & 255;
  s.pending_buf[s.pending++] = b & 255;
}
/* ===========================================================================
 * Read a new buffer from the current input stream, update the adler32
 * and total number of bytes read.  All deflate() input goes through
 * this function so some applications may wish to modify it to avoid
 * allocating a large strm->input buffer and copying from it.
 * (See also flush_pending()).
 */ function read_buf(strm, buf, start, size) {
  let len = strm.avail_in;
  if (len > size) len = size;
  if (len === 0) return 0;
  strm.avail_in -= len;
  // zmemcpy(buf, strm->next_in, len);
  buf.set(strm.input.subarray(strm.next_in, strm.next_in + len), start);
  if (strm.state.wrap === 1) {
    strm.adler = adler32(strm.adler, buf, len, start);
  } else if (strm.state.wrap === 2) {
    strm.adler = crc32(strm.adler, buf, len, start);
  }
  strm.next_in += len;
  strm.total_in += len;
  return len;
}
/* ===========================================================================
 * Set match_start to the longest match starting at the given string and
 * return its length. Matches shorter or equal to prev_length are discarded,
 * in which case the result is equal to prev_length and match_start is
 * garbage.
 * IN assertions: cur_match is the head of the hash chain for the current
 *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
 * OUT assertion: the match length is not greater than s->lookahead.
 */ function longest_match(s, cur_match) {
  let chain_length = s.max_chain_length; /* max hash chain length */
  let scan = s.strstart; /* current string */
  let match; /* matched string */
  let len; /* length of current match */
  let best_len = s.prev_length; /* best match length so far */
  let nice_match = s.nice_match; /* stop if match long enough */
  let limit = s.strstart > s.w_size - MIN_LOOKAHEAD
    ? s.strstart - (s.w_size - MIN_LOOKAHEAD)
    : 0 /*NIL*/;
  let _win = s.window; // shortcut
  let wmask = s.w_mask;
  let prev = s.prev;
  /* Stop when cur_match becomes <= limit. To simplify the code,
   * we prevent matches with the string of window index 0.
   */ let strend = s.strstart + MAX_MATCH;
  let scan_end1 = _win[scan + best_len - 1];
  let scan_end = _win[scan + best_len];
  /* The code is optimized for HASH_BITS >= 8 and MAX_MATCH-2 multiple of 16.
   * It is easy to get rid of this optimization if necessary.
   */
  // Assert(s->hash_bits >= 8 && MAX_MATCH == 258, "Code too clever");
  /* Do not waste too much time if we already have a good match: */ if (
    s.prev_length >= s.good_match
  ) {
    chain_length >>= 2;
  }
  /* Do not look for matches beyond the end of the input. This is necessary
   * to make deflate deterministic.
   */ if (nice_match > s.lookahead) nice_match = s.lookahead;
  // Assert((ulg)s->strstart <= s->window_size-MIN_LOOKAHEAD, "need lookahead");
  do {
    // Assert(cur_match < s->strstart, "no future");
    match = cur_match;
    /* Skip to next match if the match length cannot increase
     * or if the match length is less than 2.  Note that the checks below
     * for insufficient lookahead only occur occasionally for performance
     * reasons.  Therefore uninitialized memory will be accessed, and
     * conditional jumps will be made that depend on those values.
     * However the length of the match is limited to the lookahead, so
     * the output of deflate is not affected by the uninitialized values.
     */ if (
      _win[match + best_len] !== scan_end ||
      _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] ||
      _win[++match] !== _win[scan + 1]
    ) {
      continue;
    }
    /* The check at best_len-1 can be removed because it will be made
     * again later. (This heuristic is not always a win.)
     * It is not necessary to compare scan[2] and match[2] since they
     * are always equal when the other bytes match, given that
     * the hash keys are equal and that HASH_BITS >= 8.
     */ scan += 2;
    match++;
    // Assert(*scan == *match, "match[2]?");
    /* We check for insufficient lookahead only every 8th comparison;
     * the 256th check will be made at strstart+258.
     */ do {
      /*jshint noempty:false*/
    } while (
      _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
      _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
      _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
      _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
      scan < strend
    );
    // Assert(scan <= s->window+(unsigned)(s->window_size-1), "wild scan");
    len = MAX_MATCH - (strend - scan);
    scan = strend - MAX_MATCH;
    if (len > best_len) {
      s.match_start = cur_match;
      best_len = len;
      if (len >= nice_match) {
        break;
      }
      scan_end1 = _win[scan + best_len - 1];
      scan_end = _win[scan + best_len];
    }
  } while (
    (cur_match = prev[cur_match & wmask]) > limit && (--chain_length) !== 0
  );
  if (best_len <= s.lookahead) {
    return best_len;
  }
  return s.lookahead;
}
/* ===========================================================================
 * Fill the window when the lookahead becomes insufficient.
 * Updates strstart and lookahead.
 *
 * IN assertion: lookahead < MIN_LOOKAHEAD
 * OUT assertions: strstart <= window_size-MIN_LOOKAHEAD
 *    At least one byte has been read, or avail_in == 0; reads are
 *    performed for at least two bytes (required for the zip translate_eol
 *    option -- not supported here).
 */ function fill_window(s) {
  let _w_size = s.w_size;
  let p, n, m, more, str;
  //Assert(s->lookahead < MIN_LOOKAHEAD, "already enough lookahead");
  do {
    more = s.window_size - s.lookahead - s.strstart;
    // JS ints have 32 bit, block below not needed
    /* Deal with !@#$% 64K limit: */
    //if (sizeof(int) <= 2) {
    //    if (more == 0 && s->strstart == 0 && s->lookahead == 0) {
    //        more = wsize;
    //
    //  } else if (more == (unsigned)(-1)) {
    //        /* Very unlikely, but possible on 16 bit machine if
    //         * strstart == 0 && lookahead == 1 (input done a byte at time)
    //         */
    //        more--;
    //    }
    //}
    /* If the window is almost full and there is insufficient lookahead,
     * move the upper half to the lower one to make room in the upper half.
     */ if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
      s.window.set(s.window.subarray(_w_size, _w_size + _w_size), 0);
      s.match_start -= _w_size;
      s.strstart -= _w_size;
      /* we now have strstart >= MAX_DIST */ s.block_start -= _w_size;
      /* Slide the hash table (could be avoided with 32 bit values
       at the expense of memory usage). We slide even when level == 0
       to keep the hash table consistent if we switch back to level > 0
       later. (Using level 0 permanently is not an optimal usage of
       zlib, so we don't care about this pathological case.)
       */ n = s.hash_size;
      p = n;
      do {
        m = s.head[--p];
        s.head[p] = m >= _w_size ? m - _w_size : 0;
      } while (--n);
      n = _w_size;
      p = n;
      do {
        m = s.prev[--p];
        s.prev[p] = m >= _w_size ? m - _w_size : 0;
        /* If n is not on any hash chain, prev[n] is garbage but
         * its value will never be used.
         */
      } while (--n);
      more += _w_size;
    }
    if (s.strm.avail_in === 0) {
      break;
    }
    /* If there was no sliding:
     *    strstart <= WSIZE+MAX_DIST-1 && lookahead <= MIN_LOOKAHEAD - 1 &&
     *    more == window_size - lookahead - strstart
     * => more >= window_size - (MIN_LOOKAHEAD-1 + WSIZE + MAX_DIST-1)
     * => more >= window_size - 2*WSIZE + 2
     * In the BIG_MEM or MMAP case (not yet supported),
     *   window_size == input_size + MIN_LOOKAHEAD  &&
     *   strstart + s->lookahead <= input_size => more >= MIN_LOOKAHEAD.
     * Otherwise, window_size == 2*WSIZE so more >= 2.
     * If there was sliding, more >= WSIZE. So in all cases, more >= 2.
     */
    //Assert(more >= 2, "more < 2");
    n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
    s.lookahead += n;
    /* Initialize the hash value now that we have some input: */ if (
      s.lookahead + s.insert >= MIN_MATCH
    ) {
      str = s.strstart - s.insert;
      s.ins_h = s.window[str];
      /* UPDATE_HASH(s, s->ins_h, s->window[str + 1]); */ s.ins_h =
        (s.ins_h << s.hash_shift ^ s.window[str + 1]) & s.hash_mask;
      //#if MIN_MATCH != 3
      //        Call update_hash() MIN_MATCH-3 more times
      //#endif
      while (s.insert) {
        /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */ s.ins_h =
          (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) &
          s.hash_mask;
        s.prev[str & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = str;
        str++;
        s.insert--;
        if (s.lookahead + s.insert < MIN_MATCH) {
          break;
        }
      }
    }
    /* If the whole input has less than MIN_MATCH bytes, ins_h is garbage,
     * but this is not important since only literal bytes will be emitted.
     */
  } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
  /* If the WIN_INIT bytes after the end of the current data have never been
   * written, then zero those bytes in order to avoid memory check reports of
   * the use of uninitialized (or uninitialised as Julian writes) bytes by
   * the longest match routines.  Update the high water mark for the next
   * time through here.  WIN_INIT is set to MAX_MATCH since the longest match
   * routines allow scanning to strstart + MAX_MATCH, ignoring lookahead.
   */
  //  if (s.high_water < s.window_size) {
  //    let curr = s.strstart + s.lookahead;
  //    let init = 0;
  //
  //    if (s.high_water < curr) {
  //      /* Previous high water mark below current data -- zero WIN_INIT
  //       * bytes or up to end of window, whichever is less.
  //       */
  //      init = s.window_size - curr;
  //      if (init > WIN_INIT)
  //        init = WIN_INIT;
  //      zmemzero(s->window + curr, (unsigned)init);
  //      s->high_water = curr + init;
  //    }
  //    else if (s->high_water < (ulg)curr + WIN_INIT) {
  //      /* High water mark at or above current data, but below current data
  //       * plus WIN_INIT -- zero out to current data plus WIN_INIT, or up
  //       * to end of window, whichever is less.
  //       */
  //      init = (ulg)curr + WIN_INIT - s->high_water;
  //      if (init > s->window_size - s->high_water)
  //        init = s->window_size - s->high_water;
  //      zmemzero(s->window + s->high_water, (unsigned)init);
  //      s->high_water += init;
  //    }
  //  }
  //
  //  Assert((ulg)s->strstart <= s->window_size - MIN_LOOKAHEAD,
  //    "not enough room for search");
}
/* ===========================================================================
 * Copy without compression as much as possible from the input stream, return
 * the current block state.
 * This function does not insert new strings in the dictionary since
 * uncompressible data is probably not useful. This function is used
 * only for the level=0 compression option.
 * NOTE: this function should be optimized to avoid extra copying from
 * window to pending_buf.
 */ function deflate_stored(s, flush) {
  /* Stored blocks are limited to 0xffff bytes, pending_buf is limited
   * to pending_buf_size, and each stored block has a 5 byte header:
   */ let max_block_size = 65535;
  if (max_block_size > s.pending_buf_size - 5) {
    max_block_size = s.pending_buf_size - 5;
  }
  /* Copy as much as possible from input to output: */ for (;;) {
    /* Fill the window as much as possible: */ if (s.lookahead <= 1) {
      //Assert(s->strstart < s->w_size+MAX_DIST(s) ||
      //  s->block_start >= (long)s->w_size, "slide too late");
      //      if (!(s.strstart < s.w_size + (s.w_size - MIN_LOOKAHEAD) ||
      //        s.block_start >= s.w_size)) {
      //        throw  new Error("slide too late");
      //      }
      fill_window(s);
      if (s.lookahead === 0 && flush === STATUS.Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break;
      }
      /* flush the current block */
    }
    //Assert(s->block_start >= 0L, "block gone");
    //    if (s.block_start < 0) throw new Error("block gone");
    s.strstart += s.lookahead;
    s.lookahead = 0;
    /* Emit a stored block if pending_buf will be full: */ let max_start =
      s.block_start + max_block_size;
    if (s.strstart === 0 || s.strstart >= max_start) {
      /* strstart == 0 is possible when wraparound on 16-bit machine */ s
        .lookahead = s.strstart - max_start;
      s.strstart = max_start;
      /*** FLUSH_BLOCK(s, 0); ***/ flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
    /* Flush if we may have to slide, otherwise block_start may become
     * negative and the data will be gone:
     */ if (s.strstart - s.block_start >= s.w_size - MIN_LOOKAHEAD) {
      /*** FLUSH_BLOCK(s, 0); ***/ flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = 0;
  if (flush === STATUS.Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/ flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/ return BS_FINISH_DONE;
  }
  if (s.strstart > s.block_start) {
    /*** FLUSH_BLOCK(s, 0); ***/ flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_NEED_MORE;
}
/* ===========================================================================
 * Compress as much as possible from the input stream, return the current
 * block state.
 * This function does not perform lazy evaluation of matches and inserts
 * new strings in the dictionary only for unmatched strings or for short
 * matches. It is used only for the fast compression options.
 */ function deflate_fast(s, flush) {
  let hash_head; /* head of the hash chain */
  let bflush; /* set if current block must be flushed */
  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */ if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === STATUS.Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break; /* flush the current block */
      }
    }
    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */ hash_head = 0;
    if (s.lookahead >= MIN_MATCH) {
      /*** INSERT_STRING(s, s.strstart, hash_head); ***/ s.ins_h =
        (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) &
        s.hash_mask;
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
      /***/
    }
    /* Find the longest match, discarding those <= prev_length.
     * At this point we have always match_length < MIN_MATCH
     */ if (
      hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD
    ) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */ s.match_length = longest_match(s, hash_head);
      /* longest_match() sets match_start */
    }
    if (s.match_length >= MIN_MATCH) {
      // check_match(s, s.strstart, s.match_start, s.match_length); // for debug only
      /*** _tr_tally_dist(s, s.strstart - s.match_start,
                     s.match_length - MIN_MATCH, bflush); ***/ bflush = trees
        ._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
      s.lookahead -= s.match_length;
      /* Insert new strings in the hash table only if the match length
       * is not too large. This saves time but degrades compression.
       */ if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
        s.match_length--; /* string at strstart already in table */
        do {
          s.strstart++;
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/ s.ins_h =
            (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) &
            s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
          /* strstart never exceeds WSIZE-MAX_MATCH, so there are
           * always MIN_MATCH bytes ahead.
           */
        } while ((--s.match_length) !== 0);
        s.strstart++;
      } else {
        s.strstart += s.match_length;
        s.match_length = 0;
        s.ins_h = s.window[s.strstart];
        /* UPDATE_HASH(s, s.ins_h, s.window[s.strstart+1]); */ s.ins_h =
          (s.ins_h << s.hash_shift ^ s.window[s.strstart + 1]) & s.hash_mask;
        //#if MIN_MATCH != 3
        //                Call UPDATE_HASH() MIN_MATCH-3 more times
        //#endif
        /* If lookahead < MIN_MATCH, ins_h is garbage, but it does not
         * matter since it will be recomputed at next deflate call.
         */
      }
    } else {
      /* No match, output a literal byte */
      //Tracevv((stderr,"%c", s.window[s.strstart]));
      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/ bflush = trees
        ._tr_tally(s, 0, s.window[s.strstart]);
      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/ flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
  if (flush === STATUS.Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/ flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/ return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/ flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}
/* ===========================================================================
 * Same as above, but achieves better compression. We use a lazy
 * evaluation for matches: a match is finally adopted only if there is
 * no better match at the next window position.
 */ function deflate_slow(s, flush) {
  let hash_head; /* head of hash chain */
  let bflush; /* set if current block must be flushed */
  let max_insert;
  /* Process the input block. */ for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */ if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === STATUS.Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) break; /* flush the current block */
    }
    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */ hash_head = 0;
    if (s.lookahead >= MIN_MATCH) {
      /*** INSERT_STRING(s, s.strstart, hash_head); ***/ s.ins_h =
        (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) &
        s.hash_mask;
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
      /***/
    }
    /* Find the longest match, discarding those <= prev_length.
     */ s.prev_length = s.match_length;
    s.prev_match = s.match_start;
    s.match_length = MIN_MATCH - 1;
    if (
      hash_head !== 0 && s.prev_length < s.max_lazy_match &&
      s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD
    ) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */ s.match_length = longest_match(s, hash_head);
      /* longest_match() sets match_start */ if (
        s.match_length <= 5 &&
        (s.strategy === Z_FILTERED ||
          s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)
      ) {
        /* If prev_match is also MIN_MATCH, match_start is garbage
         * but we will ignore the current match anyway.
         */ s.match_length = MIN_MATCH - 1;
      }
    }
    /* If there was a match at the previous step and the current
     * match is not better, output the previous match:
     */ if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
      max_insert = s.strstart + s.lookahead - MIN_MATCH;
      /* Do not insert strings in hash table beyond this. */
      //check_match(s, s.strstart-1, s.prev_match, s.prev_length);
      /***_tr_tally_dist(s, s.strstart - 1 - s.prev_match,
                     s.prev_length - MIN_MATCH, bflush);***/ bflush = trees
        ._tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
      /* Insert in hash table all strings up to the end of the match.
       * strstart-1 and strstart are already inserted. If there is not
       * enough lookahead, the last two strings are not inserted in
       * the hash table.
       */ s.lookahead -= s.prev_length - 1;
      s.prev_length -= 2;
      do {
        if ((++s.strstart) <= max_insert) {
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/ s.ins_h =
            (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) &
            s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
        }
      } while ((--s.prev_length) !== 0);
      s.match_available = 0;
      s.match_length = MIN_MATCH - 1;
      s.strstart++;
      if (bflush) {
        /*** FLUSH_BLOCK(s, 0); ***/ flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/
      }
    } else if (s.match_available) {
      /* If there was no match at the previous position, output a
       * single literal. If there was a match but the current match
       * is longer, truncate the previous match to a single literal.
       */
      //Tracevv((stderr,"%c", s->window[s->strstart-1]));
      /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/ bflush = trees
        ._tr_tally(s, 0, s.window[s.strstart - 1]);
      if (bflush) {
        /*** FLUSH_BLOCK_ONLY(s, 0) ***/ flush_block_only(s, false);
        /***/
      }
      s.strstart++;
      s.lookahead--;
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    } else {
      /* There is no previous match to compare with, wait for
       * the next step to decide.
       */ s.match_available = 1;
      s.strstart++;
      s.lookahead--;
    }
  }
  //Assert (flush != Z_NO_FLUSH, "no flush?");
  if (s.match_available) {
    //Tracevv((stderr,"%c", s->window[s->strstart-1]));
    /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/ bflush = trees
      ._tr_tally(s, 0, s.window[s.strstart - 1]);
    s.match_available = 0;
  }
  s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
  if (flush === STATUS.Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/ flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/ return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/ flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}
/* ===========================================================================
 * For Z_RLE, simply look for runs of bytes, generate matches only of distance
 * one.  Do not maintain a hash table.  (It will be regenerated if this run of
 * deflate switches away from Z_RLE.)
 */ function deflate_rle(s, flush) {
  let bflush; /* set if current block must be flushed */
  let prev; /* byte at distance one to match */
  let scan, strend; /* scan goes up to strend for length of run */
  let _win = s.window;
  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the longest run, plus one for the unrolled loop.
     */ if (s.lookahead <= MAX_MATCH) {
      fill_window(s);
      if (s.lookahead <= MAX_MATCH && flush === STATUS.Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) break; /* flush the current block */
    }
    /* See how many times the previous byte repeats */ s.match_length = 0;
    if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
      scan = s.strstart - 1;
      prev = _win[scan];
      if (
        prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]
      ) {
        strend = s.strstart + MAX_MATCH;
        do {
          /*jshint noempty:false*/
        } while (
          prev === _win[++scan] && prev === _win[++scan] &&
          prev === _win[++scan] && prev === _win[++scan] &&
          prev === _win[++scan] && prev === _win[++scan] &&
          prev === _win[++scan] && prev === _win[++scan] && scan < strend
        );
        s.match_length = MAX_MATCH - (strend - scan);
        if (s.match_length > s.lookahead) {
          s.match_length = s.lookahead;
        }
      }
      //Assert(scan <= s->window+(uInt)(s->window_size-1), "wild scan");
    }
    /* Emit match if have run of MIN_MATCH or longer, else emit literal */ if (
      s.match_length >= MIN_MATCH
    ) {
      //check_match(s, s.strstart, s.strstart - 1, s.match_length);
      /*** _tr_tally_dist(s, 1, s.match_length - MIN_MATCH, bflush); ***/ bflush =
        trees._tr_tally(s, 1, s.match_length - MIN_MATCH);
      s.lookahead -= s.match_length;
      s.strstart += s.match_length;
      s.match_length = 0;
    } else {
      /* No match, output a literal byte */
      //Tracevv((stderr,"%c", s->window[s->strstart]));
      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/ bflush = trees
        ._tr_tally(s, 0, s.window[s.strstart]);
      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/ flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = 0;
  if (flush === STATUS.Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/ flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/ return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/ flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}
/* ===========================================================================
 * For Z_HUFFMAN_ONLY, do not look for matches.  Do not maintain a hash table.
 * (It will be regenerated if this run of deflate switches away from Huffman.)
 */ function deflate_huff(s, flush) {
  let bflush; /* set if current block must be flushed */
  for (;;) {
    /* Make sure that we have a literal to write. */ if (s.lookahead === 0) {
      fill_window(s);
      if (s.lookahead === 0) {
        if (flush === STATUS.Z_NO_FLUSH) {
          return BS_NEED_MORE;
        }
        break; /* flush the current block */
      }
    }
    /* Output a literal byte */ s.match_length = 0;
    //Tracevv((stderr,"%c", s->window[s->strstart]));
    /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/ bflush = trees
      ._tr_tally(s, 0, s.window[s.strstart]);
    s.lookahead--;
    s.strstart++;
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/ flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = 0;
  if (flush === STATUS.Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/ flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/ return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/ flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}
/* Values for max_lazy_match, good_match and max_chain_length, depending on
 * the desired pack level (0..9). The values given below have been tuned to
 * exclude worst case performance for pathological files. Better values may be
 * found for specific files.
 */ class Config {
  good_length;
  max_lazy;
  nice_length;
  max_chain;
  func;
  constructor(good_length, max_lazy, nice_length, max_chain, func) {
    this.good_length = good_length;
    this.max_lazy = max_lazy;
    this.nice_length = nice_length;
    this.max_chain = max_chain;
    this.func = func;
  }
}
let configuration_table;
configuration_table = [
  /*      good lazy nice chain */ new Config(0, 0, 0, 0, deflate_stored),
  /* 0 store only */ new Config(4, 4, 8, 4, deflate_fast),
  /* 1 max speed, no lazy matches */ new Config(4, 5, 16, 8, deflate_fast),
  /* 2 */ new Config(4, 6, 32, 32, deflate_fast),
  /* 3 */ new Config(4, 4, 16, 16, deflate_slow),
  /* 4 lazy matches */ new Config(8, 16, 32, 32, deflate_slow),
  /* 5 */ new Config(8, 16, 128, 128, deflate_slow),
  /* 6 */ new Config(8, 32, 128, 256, deflate_slow),
  /* 7 */ new Config(32, 128, 258, 1024, deflate_slow),
  /* 8 */ new Config(32, 258, 258, 4096, deflate_slow),
];
/* ===========================================================================
 * Initialize the "longest match" routines for a new zlib stream
 */ function lm_init(s) {
  s.window_size = 2 * s.w_size;
  /*** CLEAR_HASH(s); ***/ zero(s.head); // Fill with NIL (= 0);
  /* Set the default configuration parameters:
   */ s.max_lazy_match = configuration_table[s.level].max_lazy;
  s.good_match = configuration_table[s.level].good_length;
  s.nice_match = configuration_table[s.level].nice_length;
  s.max_chain_length = configuration_table[s.level].max_chain;
  s.strstart = 0;
  s.block_start = 0;
  s.lookahead = 0;
  s.insert = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  s.ins_h = 0;
}
export class DeflateState {
  strm = null;
  status = 0;
  pending_buf = null;
  pending_buf_size = 0;
  pending_out = 0;
  pending = 0;
  wrap = 0;
  gzhead = null;
  gzindex = 0;
  method = Z_DEFLATED;
  last_flush = -1;
  w_size = 0;
  w_bits = 0;
  w_mask = 0;
  window = null;
  /* Sliding window. Input bytes are read into the second half of the window,
   * and move to the first half later to keep a dictionary of at least wSize
   * bytes. With this organization, matches are limited to a distance of
   * wSize-MAX_MATCH bytes, but this ensures that IO is always
   * performed with a length multiple of the block size.
   */ window_size = 0;
  /* Actual size of window: 2*wSize, except when the user input buffer
   * is directly used as sliding window.
   */ prev = null;
  /* Link to older string with same hash index. To limit the size of this
   * array to 64K, this link is maintained only for the last 32K strings.
   * An index in this array is thus a window index modulo 32K.
   */ head = null;
  ins_h = 0;
  hash_size = 0;
  hash_bits = 0;
  hash_mask = 0;
  hash_shift = 0;
  /* Number of bits by which ins_h must be shifted at each input
   * step. It must be such that after MIN_MATCH steps, the oldest
   * byte no longer takes part in the hash key, that is:
   *   hash_shift * MIN_MATCH >= hash_bits
   */ block_start = 0;
  /* Window position at the beginning of the current output block. Gets
   * negative when the window is moved backwards.
   */ match_length = 0;
  prev_match = 0;
  match_available = 0;
  strstart = 0;
  match_start = 0;
  lookahead = 0;
  prev_length = 0;
  /* Length of the best match at previous step. Matches not greater than this
   * are discarded. This is used in the lazy match evaluation.
   */ max_chain_length = 0;
  /* To speed up deflation, hash chains are never searched beyond this
   * length.  A higher limit improves compression ratio but degrades the
   * speed.
   */ max_lazy_match = 0;
  /* Attempt to find a better match only when the current match is strictly
   * smaller than this value. This mechanism is used only for compression
   * levels >= 4.
   */
  // That's alias to max_lazy_match, don't use directly
  //this.max_insert_length = 0;
  /* Insert new strings in the hash table only if the match length is not
   * greater than this length. This saves time but degrades compression.
   * max_insert_length is used only for compression levels <= 3.
   */ level = 0;
  strategy = 0;
  good_match = 0;
  /* Use a faster search when the previous match is longer than this */ nice_match =
    0;
  /* used by trees.c: */
  /* Didn't use ct_data typedef below to suppress compiler warning */
  // struct ct_data_s dyn_ltree[HEAP_SIZE];   /* literal and length tree */
  // struct ct_data_s dyn_dtree[2*D_CODES+1]; /* distance tree */
  // struct ct_data_s bl_tree[2*BL_CODES+1];  /* Huffman tree for bit lengths */
  // Use flat array of DOUBLE size, with interleaved fata,
  // because JS does not support effective
  dyn_ltree = new Uint16Array(HEAP_SIZE * 2);
  dyn_dtree = new Uint16Array((2 * D_CODES + 1) * 2);
  bl_tree = new Uint16Array((2 * BL_CODES + 1) * 2);
  l_desc = null;
  d_desc = null;
  bl_desc = null;
  //ush bl_count[MAX_BITS+1];
  bl_count = new Uint16Array(MAX_BITS + 1);
  /* number of codes at each bit length for an optimal tree */
  //int heap[2*L_CODES+1];      /* heap used to build the Huffman trees */
  heap = new Uint16Array(2 * L_CODES + 1);
  heap_len = 0;
  heap_max = 0;
  /* The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.
   * The same heap array is used to build all trees.
   */ depth = new Uint16Array(2 * L_CODES + 1);
  /* Depth of each subtree used as tie breaker for trees of equal frequency
   */ l_buf = 0;
  lit_bufsize = 0;
  /* Size of match buffer for literals/lengths.  There are 4 reasons for
   * limiting lit_bufsize to 64K:
   *   - frequencies can be kept in 16 bit counters
   *   - if compression is not successful for the first block, all input
   *     data is still in the window so we can still emit a stored block even
   *     when input comes from standard input.  (This can also be done for
   *     all blocks if lit_bufsize is not greater than 32K.)
   *   - if compression is not successful for a file smaller than 64K, we can
   *     even emit a stored file instead of a stored block (saving 5 bytes).
   *     This is applicable only for zip (not gzip or zlib).
   *   - creating new Huffman trees less frequently may not provide fast
   *     adaptation to changes in the input data statistics. (Take for
   *     example a binary file with poorly compressible code followed by
   *     a highly compressible string table.) Smaller buffer sizes give
   *     fast adaptation but have of course the overhead of transmitting
   *     trees more frequently.
   *   - I can't count above 4
   */ last_lit = 0;
  d_buf = 0;
  /* Buffer index for distances. To simplify the code, d_buf and l_buf have
   * the same number of elements. To use different lengths, an extra flag
   * array would be necessary.
   */ opt_len = 0;
  static_len = 0;
  matches = 0;
  insert = 0;
  bi_buf = 0;
  /* Output buffer. bits are inserted starting at the bottom (least
   * significant bits).
   */ bi_valid = 0;
  /* Number of valid bits in bi_buf.  All bits above the last valid bit
   * are always zero.
   */
  // Used for window memory init. We safely ignore it for JS. That makes
  // sense only for pointers and memory check tools.
  //this.high_water = 0;
  /* High water mark offset in window for initialized bytes -- bytes above
   * this are set to zero in order to avoid memory check warnings when
   * longest match routines access bytes past the input.  This is then
   * updated to the new high water mark.
   */ constructor() {
    zero(this.dyn_ltree);
    zero(this.dyn_dtree);
    zero(this.bl_tree);
    zero(this.heap);
    zero(this.depth);
  }
}
function deflateResetKeep(strm) {
  let s;
  if (!strm || !strm.state) {
    return err(strm, STATUS.Z_STREAM_ERROR.toString());
  }
  strm.total_in = strm.total_out = 0;
  strm.data_type = Z_UNKNOWN;
  s = strm.state;
  s.pending = 0;
  s.pending_out = 0;
  if (s.wrap < 0) {
    s.wrap = -s.wrap;
    /* was made negative by deflate(..., Z_FINISH); */
  }
  s.status = s.wrap ? INIT_STATE : BUSY_STATE;
  strm.adler = s.wrap === 2 ? 0 : 1; // adler32(0, Z_NULL, 0)
  s.last_flush = STATUS.Z_NO_FLUSH;
  trees._tr_init(s);
  return Z_OK;
}
function deflateReset(strm) {
  let ret = deflateResetKeep(strm);
  if (ret === Z_OK) {
    lm_init(strm.state);
  }
  return ret;
}
export function deflateSetHeader(strm, head) {
  if (!strm || !strm.state) return Z_STREAM_ERROR;
  if (strm.state.wrap !== 2) return Z_STREAM_ERROR;
  strm.state.gzhead = head;
  return Z_OK;
}
export function deflateInit2(
  strm,
  level,
  method,
  windowBits,
  memLevel,
  strategy,
) {
  if (!strm) {
    return STATUS.Z_STREAM_ERROR;
  }
  let wrap = 1;
  if (level === Z_DEFAULT_COMPRESSION) {
    level = 6;
  }
  if (windowBits < 0) {
    /* suppress zlib wrapper */ wrap = 0;
    windowBits = -windowBits;
  } else if (windowBits > 15) {
    wrap = 2; /* write gzip wrapper instead */
    windowBits -= 16;
  }
  if (
    memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED ||
    windowBits < 8 || windowBits > 15 || level < 0 || level > 9 ||
    strategy < 0 || strategy > Z_FIXED
  ) {
    return err(strm, STATUS.Z_STREAM_ERROR.toString());
  }
  if (windowBits === 8) {
    windowBits = 9;
  }
  /* until 256-byte window bug fixed */ let s = new DeflateState();
  strm.state = s;
  s.strm = strm;
  s.wrap = wrap;
  s.gzhead = null;
  s.w_bits = windowBits;
  s.w_size = 1 << s.w_bits;
  s.w_mask = s.w_size - 1;
  s.hash_bits = memLevel + 7;
  s.hash_size = 1 << s.hash_bits;
  s.hash_mask = s.hash_size - 1;
  s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
  s.window = new Uint8Array(s.w_size * 2);
  s.head = new Uint16Array(s.hash_size);
  s.prev = new Uint16Array(s.w_size);
  // Don't need mem init magic for JS.
  //s.high_water = 0;  /* nothing written to s->window yet */
  s.lit_bufsize = 1 << memLevel + 6; /* 16K elements by default */
  s.pending_buf_size = s.lit_bufsize * 4;
  //overlay = (ushf *) ZALLOC(strm, s->lit_bufsize, sizeof(ush)+2);
  //s->pending_buf = (uchf *) overlay;
  s.pending_buf = new Uint8Array(s.pending_buf_size);
  // It is offset from `s.pending_buf` (size is `s.lit_bufsize * 2`)
  //s->d_buf = overlay + s->lit_bufsize/sizeof(ush);
  s.d_buf = 1 * s.lit_bufsize;
  //s->l_buf = s->pending_buf + (1+sizeof(ush))*s->lit_bufsize;
  s.l_buf = (1 + 2) * s.lit_bufsize;
  s.level = level;
  s.strategy = strategy;
  s.method = method;
  return deflateReset(strm);
}
function deflateInit(strm, level) {
  return deflateInit2(
    strm,
    level,
    Z_DEFLATED,
    MAX_WBITS,
    DEF_MEM_LEVEL,
    Z_DEFAULT_STRATEGY,
  );
}
export function deflate(strm, flush) {
  let old_flush, s;
  let beg, val; // for gzip header write only
  if (!strm || !strm.state || flush > STATUS.Z_BLOCK || flush < 0) {
    return strm ? err(strm, STATUS.Z_STREAM_ERROR) : Z_STREAM_ERROR;
  }
  s = strm.state;
  if (
    !strm.output || !strm.input && strm.avail_in !== 0 ||
    s.status === FINISH_STATE && flush !== STATUS.Z_FINISH
  ) {
    return err(
      strm,
      strm.avail_out === 0 ? STATUS.Z_BUF_ERROR : STATUS.Z_STREAM_ERROR,
    );
  }
  s.strm = strm; /* just in case */
  old_flush = s.last_flush;
  s.last_flush = flush;
  /* Write the header */ if (s.status === INIT_STATE) {
    if (s.wrap === 2) {
      strm.adler = 0; //crc32(0L, Z_NULL, 0);
      put_byte(s, 31);
      put_byte(s, 139);
      put_byte(s, 8);
      if (!s.gzhead) {
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(
          s,
          s.level === 9
            ? 2
            : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2
            ? 4
            : 0,
        );
        put_byte(s, OS_CODE);
        s.status = BUSY_STATE;
      } else {
        put_byte(
          s,
          (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra
            ? 0
            : 4) +
            (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16),
        );
        put_byte(s, s.gzhead.time & 255);
        put_byte(s, s.gzhead.time >> 8 & 255);
        put_byte(s, s.gzhead.time >> 16 & 255);
        put_byte(s, s.gzhead.time >> 24 & 255);
        put_byte(
          s,
          s.level === 9
            ? 2
            : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2
            ? 4
            : 0,
        );
        put_byte(s, s.gzhead.os & 255);
        if (s.gzhead.extra && s.gzhead.extra.length) {
          put_byte(s, s.gzhead.extra.length & 255);
          put_byte(s, s.gzhead.extra.length >> 8 & 255);
        }
        if (s.gzhead.hcrc) {
          strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
        }
        s.gzindex = 0;
        s.status = EXTRA_STATE;
      }
    } else {
      let header = Z_DEFLATED + (s.w_bits - 8 << 4) << 8;
      let level_flags = -1;
      if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
        level_flags = 0;
      } else if (s.level < 6) {
        level_flags = 1;
      } else if (s.level === 6) {
        level_flags = 2;
      } else {
        level_flags = 3;
      }
      header |= level_flags << 6;
      if (s.strstart !== 0) header |= PRESET_DICT;
      header += 31 - header % 31;
      s.status = BUSY_STATE;
      putShortMSB(s, header);
      /* Save the adler32 of the preset dictionary: */ if (s.strstart !== 0) {
        putShortMSB(s, strm.adler >>> 16);
        putShortMSB(s, strm.adler & 65535);
      }
      strm.adler = 1; // adler32(0L, Z_NULL, 0);
    }
  }
  //#ifdef GZIP
  if (s.status === EXTRA_STATE) {
    if (s.gzhead.extra) {
      beg = s.pending; /* start of bytes to update crc */
      while (s.gzindex < (s.gzhead.extra.length & 65535)) {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            break;
          }
        }
        put_byte(s, s.gzhead.extra[s.gzindex] & 255);
        s.gzindex++;
      }
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (s.gzindex === s.gzhead.extra.length) {
        s.gzindex = 0;
        s.status = NAME_STATE;
      }
    } else {
      s.status = NAME_STATE;
    }
  }
  if (s.status === NAME_STATE) {
    if (s.gzhead.name) {
      beg = s.pending; /* start of bytes to update crc */
      //int val;
      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            val = 1;
            break;
          }
        }
        // JS specific: little magic to add zero terminator to end of string
        if (s.gzindex < s.gzhead.name.length) {
          val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) {
        s.gzindex = 0;
        s.status = COMMENT_STATE;
      }
    } else {
      s.status = COMMENT_STATE;
    }
  }
  if (s.status === COMMENT_STATE) {
    if (s.gzhead.comment) {
      beg = s.pending; /* start of bytes to update crc */
      //int val;
      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            val = 1;
            break;
          }
        }
        // JS specific: little magic to add zero terminator to end of string
        if (s.gzindex < s.gzhead.comment.length) {
          val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) {
        s.status = HCRC_STATE;
      }
    } else {
      s.status = HCRC_STATE;
    }
  }
  if (s.status === HCRC_STATE) {
    if (s.gzhead.hcrc) {
      if (s.pending + 2 > s.pending_buf_size) {
        flush_pending(strm);
      }
      if (s.pending + 2 <= s.pending_buf_size) {
        put_byte(s, strm.adler & 255);
        put_byte(s, strm.adler >> 8 & 255);
        strm.adler = 0; //crc32(0L, Z_NULL, 0);
        s.status = BUSY_STATE;
      }
    } else {
      s.status = BUSY_STATE;
    }
  }
  //#endif
  /* Flush as much pending output as possible */ if (s.pending !== 0) {
    flush_pending(strm);
    if (strm.avail_out === 0) {
      /* Since avail_out is 0, deflate will be called again with
       * more output space, but possibly with both pending and
       * avail_in equal to zero. There won't be anything to do,
       * but this is not an error situation so make sure we
       * return OK instead of BUF_ERROR at next call of deflate:
       */ s.last_flush = -1;
      return Z_OK;
    }
    /* Make sure there is something to do and avoid duplicate consecutive
     * flushes. For repeated and useless calls with Z_FINISH, we keep
     * returning Z_STREAM_END instead of Z_BUF_ERROR.
     */
  } else if (
    strm.avail_in === 0 && rank(flush) <= rank(old_flush) &&
    flush !== STATUS.Z_FINISH
  ) {
    return err(strm, STATUS.Z_BUF_ERROR);
  }
  /* User must not provide more input after the first FINISH: */ if (
    s.status === FINISH_STATE && strm.avail_in !== 0
  ) {
    return err(strm, STATUS.Z_BUF_ERROR);
  }
  /* Start a new block or continue the current one.
   */ if (
    strm.avail_in !== 0 || s.lookahead !== 0 ||
    flush !== STATUS.Z_NO_FLUSH && s.status !== FINISH_STATE
  ) {
    let bstate = s.strategy === Z_HUFFMAN_ONLY
      ? deflate_huff(s, flush)
      : s.strategy === Z_RLE
      ? deflate_rle(s, flush)
      : configuration_table[s.level].func(s, flush);
    if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
      s.status = FINISH_STATE;
    }
    if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
      if (strm.avail_out === 0) {
        s.last_flush = -1;
        /* avoid BUF_ERROR next call, see above */
      }
      return STATUS.Z_OK;
      /* If flush != Z_NO_FLUSH && avail_out == 0, the next call
       * of deflate should use the same flush parameter to make sure
       * that the flush is complete. So we don't have to output an
       * empty block here, this will be done at next call. This also
       * ensures that for a very small output buffer, we emit at most
       * one empty block.
       */
    }
    if (bstate === BS_BLOCK_DONE) {
      if (flush === STATUS.Z_PARTIAL_FLUSH) {
        trees._tr_align(s);
      } else if (flush !== STATUS.Z_BLOCK) {
        /* FULL_FLUSH or SYNC_FLUSH */ trees._tr_stored_block(s, 0, 0, false);
        /* For a full flush, this empty block will be recognized
         * as a special marker by inflate_sync().
         */ if (flush === STATUS.Z_FULL_FLUSH) {
          /*** CLEAR_HASH(s); ***/ /* forget history */ zero(s.head); // Fill with NIL (= 0);
          if (s.lookahead === 0) {
            s.strstart = 0;
            s.block_start = 0;
            s.insert = 0;
          }
        }
      }
      flush_pending(strm);
      if (strm.avail_out === 0) {
        s.last_flush = -1; /* avoid BUF_ERROR at next call, see above */
        return STATUS.Z_OK;
      }
    }
  }
  //Assert(strm->avail_out > 0, "bug2");
  //if (strm.avail_out <= 0) { throw new Error("bug2");}
  if (flush !== STATUS.Z_FINISH) return STATUS.Z_OK;
  if (s.wrap <= 0) return STATUS.Z_STREAM_END;
  /* Write the trailer */ if (s.wrap === 2) {
    put_byte(s, strm.adler & 255);
    put_byte(s, strm.adler >> 8 & 255);
    put_byte(s, strm.adler >> 16 & 255);
    put_byte(s, strm.adler >> 24 & 255);
    put_byte(s, strm.total_in & 255);
    put_byte(s, strm.total_in >> 8 & 255);
    put_byte(s, strm.total_in >> 16 & 255);
    put_byte(s, strm.total_in >> 24 & 255);
  } else {
    putShortMSB(s, strm.adler >>> 16);
    putShortMSB(s, strm.adler & 65535);
  }
  flush_pending(strm);
  /* If avail_out is zero, the application will call deflate again
   * to flush the rest.
   */ if (s.wrap > 0) s.wrap = -s.wrap;
  /* write the trailer only once! */ return s.pending !== 0
    ? Z_OK
    : Z_STREAM_END;
}
export function deflateEnd(strm) {
  let status;
  if (!strm || !strm.state) {
    return Z_STREAM_ERROR;
  }
  status = strm.state.status;
  if (
    status !== INIT_STATE && status !== EXTRA_STATE && status !== NAME_STATE &&
    status !== COMMENT_STATE && status !== HCRC_STATE &&
    status !== BUSY_STATE && status !== FINISH_STATE
  ) {
    return err(strm, STATUS.Z_STREAM_ERROR);
  }
  strm.state = null;
  return status === BUSY_STATE ? err(strm, STATUS.Z_DATA_ERROR) : Z_OK;
}
/* =========================================================================
 * Initializes the compression dictionary from the given byte
 * sequence without producing any compressed output.
 */ export function deflateSetDictionary(strm, dictionary) {
  let dictLength = dictionary.length;
  let s;
  let str, n;
  let wrap;
  let avail;
  let next;
  let input;
  let tmpDict;
  if (!strm || !strm.state) {
    return Z_STREAM_ERROR;
  }
  s = strm.state;
  wrap = s.wrap;
  if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) {
    return Z_STREAM_ERROR;
  }
  /* when using zlib wrappers, compute Adler-32 for provided dictionary */ if (
    wrap === 1
  ) {
    /* adler32(strm->adler, dictionary, dictLength); */ strm.adler = adler32(
      strm.adler,
      dictionary,
      dictLength,
      0,
    );
  }
  s.wrap = 0; /* avoid computing Adler-32 in read_buf */
  /* if dictionary would fill window, just replace the history */ if (
    dictLength >= s.w_size
  ) {
    if (wrap === 0) {
      /* already empty otherwise */ /*** CLEAR_HASH(s); ***/ zero(s.head); // Fill with NIL (= 0);
      s.strstart = 0;
      s.block_start = 0;
      s.insert = 0;
    }
    /* use the tail */
    // dictionary = dictionary.slice(dictLength - s.w_size);
    tmpDict = new Uint8Array(s.w_size);
    tmpDict.set(dictionary.subarray(dictLength - s.w_size, dictLength), 0);
    dictionary = tmpDict;
    dictLength = s.w_size;
  }
  /* insert dictionary into window and hash */ avail = strm.avail_in;
  next = strm.next_in;
  input = strm.input;
  strm.avail_in = dictLength;
  strm.next_in = 0;
  strm.input = dictionary;
  fill_window(s);
  while (s.lookahead >= MIN_MATCH) {
    str = s.strstart;
    n = s.lookahead - (MIN_MATCH - 1);
    do {
      /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */ s.ins_h =
        (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
      s.prev[str & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = str;
      str++;
    } while (--n);
    s.strstart = str;
    s.lookahead = MIN_MATCH - 1;
    fill_window(s);
  }
  s.strstart += s.lookahead;
  s.block_start = s.strstart;
  s.insert = s.lookahead;
  s.lookahead = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  strm.next_in = next;
  strm.input = input;
  strm.avail_in = avail;
  s.wrap = wrap;
  return Z_OK;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2NvbXByZXNzQHYwLjMuNi96bGliL3psaWIvZGVmbGF0ZS50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbWVzc2FnZSBhcyBtc2csIENPREUgfSBmcm9tIFwiLi9tZXNzYWdlcy50c1wiO1xuaW1wb3J0IHR5cGUgWlN0cmVhbSBmcm9tIFwiLi96c3RyZWFtLnRzXCI7XG5pbXBvcnQgKiBhcyB0cmVlcyBmcm9tIFwiLi90cmVlcy50c1wiO1xuaW1wb3J0IGFkbGVyMzIgZnJvbSBcIi4vYWRsZXIzMi50c1wiO1xuaW1wb3J0IHsgY3JjMzIgfSBmcm9tIFwiLi9jcmMzMi50c1wiO1xuaW1wb3J0IFNUQVRVUyBmcm9tIFwiLi9zdGF0dXMudHNcIjtcblxuLyogUmV0dXJuIGNvZGVzIGZvciB0aGUgY29tcHJlc3Npb24vZGVjb21wcmVzc2lvbiBmdW5jdGlvbnMuIE5lZ2F0aXZlIHZhbHVlc1xuICogYXJlIGVycm9ycywgcG9zaXRpdmUgdmFsdWVzIGFyZSB1c2VkIGZvciBzcGVjaWFsIGJ1dCBub3JtYWwgZXZlbnRzLlxuICovXG5jb25zdCBaX09LID0gMDtcbmNvbnN0IFpfU1RSRUFNX0VORCA9IDE7XG4vL2NvbnN0IFpfTkVFRF9ESUNUICAgICA9IDI7XG4vL2NvbnN0IFpfRVJSTk8gICAgICAgICA9IC0xO1xuY29uc3QgWl9TVFJFQU1fRVJST1IgPSAtMjtcbmNvbnN0IFpfREFUQV9FUlJPUiA9IC0zO1xuLy9jb25zdCBaX01FTV9FUlJPUiAgICAgPSAtNDtcbmNvbnN0IFpfQlVGX0VSUk9SID0gLTU7XG4vL2NvbnN0IFpfVkVSU0lPTl9FUlJPUiA9IC02O1xuXG4vKiBjb21wcmVzc2lvbiBsZXZlbHMgKi9cbi8vY29uc3QgWl9OT19DT01QUkVTU0lPTiAgICAgID0gMDtcbi8vY29uc3QgWl9CRVNUX1NQRUVEICAgICAgICAgID0gMTtcbi8vY29uc3QgWl9CRVNUX0NPTVBSRVNTSU9OICAgID0gOTtcbmNvbnN0IFpfREVGQVVMVF9DT01QUkVTU0lPTiA9IC0xO1xuXG5jb25zdCBaX0ZJTFRFUkVEID0gMTtcbmNvbnN0IFpfSFVGRk1BTl9PTkxZID0gMjtcbmNvbnN0IFpfUkxFID0gMztcbmNvbnN0IFpfRklYRUQgPSA0O1xuY29uc3QgWl9ERUZBVUxUX1NUUkFURUdZID0gMDtcblxuLyogUG9zc2libGUgdmFsdWVzIG9mIHRoZSBkYXRhX3R5cGUgZmllbGQgKHRob3VnaCBzZWUgaW5mbGF0ZSgpKSAqL1xuLy9jb25zdCBaX0JJTkFSWSAgICAgICAgICAgICAgPSAwO1xuLy9jb25zdCBaX1RFWFQgICAgICAgICAgICAgICAgPSAxO1xuLy9jb25zdCBaX0FTQ0lJICAgICAgICAgICAgICAgPSAxOyAvLyA9IFpfVEVYVFxuY29uc3QgWl9VTktOT1dOID0gMjtcblxuLyogVGhlIGRlZmxhdGUgY29tcHJlc3Npb24gbWV0aG9kICovXG5jb25zdCBaX0RFRkxBVEVEID0gODtcblxuY29uc3QgTUFYX01FTV9MRVZFTCA9IDk7XG4vKiBNYXhpbXVtIHZhbHVlIGZvciBtZW1MZXZlbCBpbiBkZWZsYXRlSW5pdDIgKi9cbmNvbnN0IE1BWF9XQklUUyA9IDE1O1xuLyogMzJLIExaNzcgd2luZG93ICovXG5jb25zdCBERUZfTUVNX0xFVkVMID0gODtcblxuY29uc3QgTEVOR1RIX0NPREVTID0gMjk7XG4vKiBudW1iZXIgb2YgbGVuZ3RoIGNvZGVzLCBub3QgY291bnRpbmcgdGhlIHNwZWNpYWwgRU5EX0JMT0NLIGNvZGUgKi9cbmNvbnN0IExJVEVSQUxTID0gMjU2O1xuLyogbnVtYmVyIG9mIGxpdGVyYWwgYnl0ZXMgMC4uMjU1ICovXG5jb25zdCBMX0NPREVTID0gTElURVJBTFMgKyAxICsgTEVOR1RIX0NPREVTO1xuLyogbnVtYmVyIG9mIExpdGVyYWwgb3IgTGVuZ3RoIGNvZGVzLCBpbmNsdWRpbmcgdGhlIEVORF9CTE9DSyBjb2RlICovXG5jb25zdCBEX0NPREVTID0gMzA7XG4vKiBudW1iZXIgb2YgZGlzdGFuY2UgY29kZXMgKi9cbmNvbnN0IEJMX0NPREVTID0gMTk7XG4vKiBudW1iZXIgb2YgY29kZXMgdXNlZCB0byB0cmFuc2ZlciB0aGUgYml0IGxlbmd0aHMgKi9cbmNvbnN0IEhFQVBfU0laRSA9IDIgKiBMX0NPREVTICsgMTtcbi8qIG1heGltdW0gaGVhcCBzaXplICovXG5jb25zdCBNQVhfQklUUyA9IDE1O1xuLyogQWxsIGNvZGVzIG11c3Qgbm90IGV4Y2VlZCBNQVhfQklUUyBiaXRzICovXG5cbmNvbnN0IE1JTl9NQVRDSCA9IDM7XG5jb25zdCBNQVhfTUFUQ0ggPSAyNTg7XG5jb25zdCBNSU5fTE9PS0FIRUFEID0gKE1BWF9NQVRDSCArIE1JTl9NQVRDSCArIDEpO1xuY29uc3QgUFJFU0VUX0RJQ1QgPSAweDIwO1xuY29uc3QgSU5JVF9TVEFURSA9IDQyO1xuY29uc3QgRVhUUkFfU1RBVEUgPSA2OTtcbmNvbnN0IE5BTUVfU1RBVEUgPSA3MztcbmNvbnN0IENPTU1FTlRfU1RBVEUgPSA5MTtcbmNvbnN0IEhDUkNfU1RBVEUgPSAxMDM7XG5jb25zdCBCVVNZX1NUQVRFID0gMTEzO1xuY29uc3QgRklOSVNIX1NUQVRFID0gNjY2O1xuY29uc3QgQlNfTkVFRF9NT1JFID1cbiAgMTsgLyogYmxvY2sgbm90IGNvbXBsZXRlZCwgbmVlZCBtb3JlIGlucHV0IG9yIG1vcmUgb3V0cHV0ICovXG5jb25zdCBCU19CTE9DS19ET05FID0gMjsgLyogYmxvY2sgZmx1c2ggcGVyZm9ybWVkICovXG5jb25zdCBCU19GSU5JU0hfU1RBUlRFRCA9XG4gIDM7IC8qIGZpbmlzaCBzdGFydGVkLCBuZWVkIG9ubHkgbW9yZSBvdXRwdXQgYXQgbmV4dCBkZWZsYXRlICovXG5jb25zdCBCU19GSU5JU0hfRE9ORSA9IDQ7IC8qIGZpbmlzaCBkb25lLCBhY2NlcHQgbm8gbW9yZSBpbnB1dCBvciBvdXRwdXQgKi9cbmNvbnN0IE9TX0NPREUgPSAweDAzOyAvLyBVbml4IDopIC4gRG9uJ3QgZGV0ZWN0LCB1c2UgdGhpcyBkZWZhdWx0LlxuXG5leHBvcnQgaW50ZXJmYWNlIEhlYWRlciB7XG4gIHRleHQ6IGJvb2xlYW47XG4gIHRpbWU6IG51bWJlcjtcbiAgb3M6IG51bWJlcjtcbiAgZXh0cmE6IHN0cmluZ1tdO1xuICBuYW1lOiBzdHJpbmc7XG4gIGNvbW1lbnQ6IHN0cmluZztcbiAgaGNyYzogYm9vbGVhbjtcbn1cblxuZnVuY3Rpb24gZXJyKHN0cm06IFpTdHJlYW0sIGVycm9yQ29kZTogQ09ERSkge1xuICBzdHJtLm1zZyA9IG1zZ1tlcnJvckNvZGVdO1xuICByZXR1cm4gZXJyb3JDb2RlO1xufVxuXG5mdW5jdGlvbiByYW5rKGY6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAoKGYpIDw8IDEpIC0gKChmKSA+IDQgPyA5IDogMCk7XG59XG5cbmZ1bmN0aW9uIHplcm8oYnVmOiBVaW50OEFycmF5IHwgVWludDE2QXJyYXkpIHtcbiAgYnVmLmZpbGwoMCwgMCwgYnVmLmxlbmd0aCk7XG59XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEZsdXNoIGFzIG11Y2ggcGVuZGluZyBvdXRwdXQgYXMgcG9zc2libGUuIEFsbCBkZWZsYXRlKCkgb3V0cHV0IGdvZXNcbiAqIHRocm91Z2ggdGhpcyBmdW5jdGlvbiBzbyBzb21lIGFwcGxpY2F0aW9ucyBtYXkgd2lzaCB0byBtb2RpZnkgaXRcbiAqIHRvIGF2b2lkIGFsbG9jYXRpbmcgYSBsYXJnZSBzdHJtLT5vdXRwdXQgYnVmZmVyIGFuZCBjb3B5aW5nIGludG8gaXQuXG4gKiAoU2VlIGFsc28gcmVhZF9idWYoKSkuXG4gKi9cbmZ1bmN0aW9uIGZsdXNoX3BlbmRpbmcoc3RybTogWlN0cmVhbSkge1xuICBsZXQgcyA9IHN0cm0uc3RhdGUgYXMgRGVmbGF0ZVN0YXRlO1xuXG4gIC8vX3RyX2ZsdXNoX2JpdHMocyk7XG4gIGxldCBsZW4gPSBzLnBlbmRpbmc7XG4gIGlmIChsZW4gPiBzdHJtLmF2YWlsX291dCkge1xuICAgIGxlbiA9IHN0cm0uYXZhaWxfb3V0O1xuICB9XG4gIGlmIChsZW4gPT09IDApIHJldHVybjtcbiAgc3RybS5vdXRwdXQhLnNldChcbiAgICBzLnBlbmRpbmdfYnVmLnN1YmFycmF5KHMucGVuZGluZ19vdXQsIHMucGVuZGluZ19vdXQgKyBsZW4pLFxuICAgIHN0cm0ubmV4dF9vdXQsXG4gICk7XG4gIHN0cm0ubmV4dF9vdXQgKz0gbGVuO1xuICBzLnBlbmRpbmdfb3V0ICs9IGxlbjtcbiAgc3RybS50b3RhbF9vdXQgKz0gbGVuO1xuICBzdHJtLmF2YWlsX291dCAtPSBsZW47XG4gIHMucGVuZGluZyAtPSBsZW47XG4gIGlmIChzLnBlbmRpbmcgPT09IDApIHtcbiAgICBzLnBlbmRpbmdfb3V0ID0gMDtcbiAgfVxufVxuXG5mdW5jdGlvbiBmbHVzaF9ibG9ja19vbmx5KHM6IERlZmxhdGVTdGF0ZSwgbGFzdDogYW55KSB7XG4gIHRyZWVzLl90cl9mbHVzaF9ibG9jayhcbiAgICBzLFxuICAgIChzLmJsb2NrX3N0YXJ0ID49IDAgPyBzLmJsb2NrX3N0YXJ0IDogLTEpLFxuICAgIHMuc3Ryc3RhcnQgLSBzLmJsb2NrX3N0YXJ0LFxuICAgIGxhc3QsXG4gICk7XG4gIHMuYmxvY2tfc3RhcnQgPSBzLnN0cnN0YXJ0O1xuICBmbHVzaF9wZW5kaW5nKHMuc3RybSEpO1xufVxuXG5mdW5jdGlvbiBwdXRfYnl0ZShzOiBhbnksIGI6IGFueSkge1xuICBzLnBlbmRpbmdfYnVmW3MucGVuZGluZysrXSA9IGI7XG59XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIFB1dCBhIHNob3J0IGluIHRoZSBwZW5kaW5nIGJ1ZmZlci4gVGhlIDE2LWJpdCB2YWx1ZSBpcyBwdXQgaW4gTVNCIG9yZGVyLlxuICogSU4gYXNzZXJ0aW9uOiB0aGUgc3RyZWFtIHN0YXRlIGlzIGNvcnJlY3QgYW5kIHRoZXJlIGlzIGVub3VnaCByb29tIGluXG4gKiBwZW5kaW5nX2J1Zi5cbiAqL1xuZnVuY3Rpb24gcHV0U2hvcnRNU0IoczogYW55LCBiOiBhbnkpIHtcbiAgLy8gIHB1dF9ieXRlKHMsIChCeXRlKShiID4+IDgpKTtcbiAgLy8gIHB1dF9ieXRlKHMsIChCeXRlKShiICYgMHhmZikpO1xuICBzLnBlbmRpbmdfYnVmW3MucGVuZGluZysrXSA9IChiID4+PiA4KSAmIDB4ZmY7XG4gIHMucGVuZGluZ19idWZbcy5wZW5kaW5nKytdID0gYiAmIDB4ZmY7XG59XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogUmVhZCBhIG5ldyBidWZmZXIgZnJvbSB0aGUgY3VycmVudCBpbnB1dCBzdHJlYW0sIHVwZGF0ZSB0aGUgYWRsZXIzMlxuICogYW5kIHRvdGFsIG51bWJlciBvZiBieXRlcyByZWFkLiAgQWxsIGRlZmxhdGUoKSBpbnB1dCBnb2VzIHRocm91Z2hcbiAqIHRoaXMgZnVuY3Rpb24gc28gc29tZSBhcHBsaWNhdGlvbnMgbWF5IHdpc2ggdG8gbW9kaWZ5IGl0IHRvIGF2b2lkXG4gKiBhbGxvY2F0aW5nIGEgbGFyZ2Ugc3RybS0+aW5wdXQgYnVmZmVyIGFuZCBjb3B5aW5nIGZyb20gaXQuXG4gKiAoU2VlIGFsc28gZmx1c2hfcGVuZGluZygpKS5cbiAqL1xuZnVuY3Rpb24gcmVhZF9idWYoc3RybTogYW55LCBidWY6IGFueSwgc3RhcnQ6IGFueSwgc2l6ZTogYW55KSB7XG4gIGxldCBsZW4gPSBzdHJtLmF2YWlsX2luO1xuXG4gIGlmIChsZW4gPiBzaXplKSBsZW4gPSBzaXplO1xuICBpZiAobGVuID09PSAwKSByZXR1cm4gMDtcblxuICBzdHJtLmF2YWlsX2luIC09IGxlbjtcblxuICAvLyB6bWVtY3B5KGJ1Ziwgc3RybS0+bmV4dF9pbiwgbGVuKTtcbiAgYnVmLnNldChzdHJtLmlucHV0LnN1YmFycmF5KHN0cm0ubmV4dF9pbiwgc3RybS5uZXh0X2luICsgbGVuKSwgc3RhcnQpO1xuICBpZiAoc3RybS5zdGF0ZS53cmFwID09PSAxKSB7XG4gICAgc3RybS5hZGxlciA9IGFkbGVyMzIoc3RybS5hZGxlciwgYnVmLCBsZW4sIHN0YXJ0KTtcbiAgfSBlbHNlIGlmIChzdHJtLnN0YXRlLndyYXAgPT09IDIpIHtcbiAgICBzdHJtLmFkbGVyID0gY3JjMzIoc3RybS5hZGxlciwgYnVmLCBsZW4sIHN0YXJ0KTtcbiAgfVxuXG4gIHN0cm0ubmV4dF9pbiArPSBsZW47XG4gIHN0cm0udG90YWxfaW4gKz0gbGVuO1xuXG4gIHJldHVybiBsZW47XG59XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogU2V0IG1hdGNoX3N0YXJ0IHRvIHRoZSBsb25nZXN0IG1hdGNoIHN0YXJ0aW5nIGF0IHRoZSBnaXZlbiBzdHJpbmcgYW5kXG4gKiByZXR1cm4gaXRzIGxlbmd0aC4gTWF0Y2hlcyBzaG9ydGVyIG9yIGVxdWFsIHRvIHByZXZfbGVuZ3RoIGFyZSBkaXNjYXJkZWQsXG4gKiBpbiB3aGljaCBjYXNlIHRoZSByZXN1bHQgaXMgZXF1YWwgdG8gcHJldl9sZW5ndGggYW5kIG1hdGNoX3N0YXJ0IGlzXG4gKiBnYXJiYWdlLlxuICogSU4gYXNzZXJ0aW9uczogY3VyX21hdGNoIGlzIHRoZSBoZWFkIG9mIHRoZSBoYXNoIGNoYWluIGZvciB0aGUgY3VycmVudFxuICogICBzdHJpbmcgKHN0cnN0YXJ0KSBhbmQgaXRzIGRpc3RhbmNlIGlzIDw9IE1BWF9ESVNULCBhbmQgcHJldl9sZW5ndGggPj0gMVxuICogT1VUIGFzc2VydGlvbjogdGhlIG1hdGNoIGxlbmd0aCBpcyBub3QgZ3JlYXRlciB0aGFuIHMtPmxvb2thaGVhZC5cbiAqL1xuZnVuY3Rpb24gbG9uZ2VzdF9tYXRjaChzOiBhbnksIGN1cl9tYXRjaDogYW55KSB7XG4gIGxldCBjaGFpbl9sZW5ndGggPSBzLm1heF9jaGFpbl9sZW5ndGg7IC8qIG1heCBoYXNoIGNoYWluIGxlbmd0aCAqL1xuICBsZXQgc2NhbiA9IHMuc3Ryc3RhcnQ7IC8qIGN1cnJlbnQgc3RyaW5nICovXG4gIGxldCBtYXRjaDsgLyogbWF0Y2hlZCBzdHJpbmcgKi9cbiAgbGV0IGxlbjsgLyogbGVuZ3RoIG9mIGN1cnJlbnQgbWF0Y2ggKi9cbiAgbGV0IGJlc3RfbGVuID0gcy5wcmV2X2xlbmd0aDsgLyogYmVzdCBtYXRjaCBsZW5ndGggc28gZmFyICovXG4gIGxldCBuaWNlX21hdGNoID0gcy5uaWNlX21hdGNoOyAvKiBzdG9wIGlmIG1hdGNoIGxvbmcgZW5vdWdoICovXG4gIGxldCBsaW1pdCA9IChzLnN0cnN0YXJ0ID4gKHMud19zaXplIC0gTUlOX0xPT0tBSEVBRCkpXG4gICAgPyBzLnN0cnN0YXJ0IC0gKHMud19zaXplIC0gTUlOX0xPT0tBSEVBRClcbiAgICA6IDAgLypOSUwqLztcblxuICBsZXQgX3dpbiA9IHMud2luZG93OyAvLyBzaG9ydGN1dFxuXG4gIGxldCB3bWFzayA9IHMud19tYXNrO1xuICBsZXQgcHJldiA9IHMucHJldjtcblxuICAvKiBTdG9wIHdoZW4gY3VyX21hdGNoIGJlY29tZXMgPD0gbGltaXQuIFRvIHNpbXBsaWZ5IHRoZSBjb2RlLFxuICAgKiB3ZSBwcmV2ZW50IG1hdGNoZXMgd2l0aCB0aGUgc3RyaW5nIG9mIHdpbmRvdyBpbmRleCAwLlxuICAgKi9cblxuICBsZXQgc3RyZW5kID0gcy5zdHJzdGFydCArIE1BWF9NQVRDSDtcbiAgbGV0IHNjYW5fZW5kMSA9IF93aW5bc2NhbiArIGJlc3RfbGVuIC0gMV07XG4gIGxldCBzY2FuX2VuZCA9IF93aW5bc2NhbiArIGJlc3RfbGVuXTtcblxuICAvKiBUaGUgY29kZSBpcyBvcHRpbWl6ZWQgZm9yIEhBU0hfQklUUyA+PSA4IGFuZCBNQVhfTUFUQ0gtMiBtdWx0aXBsZSBvZiAxNi5cbiAgICogSXQgaXMgZWFzeSB0byBnZXQgcmlkIG9mIHRoaXMgb3B0aW1pemF0aW9uIGlmIG5lY2Vzc2FyeS5cbiAgICovXG4gIC8vIEFzc2VydChzLT5oYXNoX2JpdHMgPj0gOCAmJiBNQVhfTUFUQ0ggPT0gMjU4LCBcIkNvZGUgdG9vIGNsZXZlclwiKTtcblxuICAvKiBEbyBub3Qgd2FzdGUgdG9vIG11Y2ggdGltZSBpZiB3ZSBhbHJlYWR5IGhhdmUgYSBnb29kIG1hdGNoOiAqL1xuICBpZiAocy5wcmV2X2xlbmd0aCA+PSBzLmdvb2RfbWF0Y2gpIHtcbiAgICBjaGFpbl9sZW5ndGggPj49IDI7XG4gIH1cbiAgLyogRG8gbm90IGxvb2sgZm9yIG1hdGNoZXMgYmV5b25kIHRoZSBlbmQgb2YgdGhlIGlucHV0LiBUaGlzIGlzIG5lY2Vzc2FyeVxuICAgKiB0byBtYWtlIGRlZmxhdGUgZGV0ZXJtaW5pc3RpYy5cbiAgICovXG4gIGlmIChuaWNlX21hdGNoID4gcy5sb29rYWhlYWQpIG5pY2VfbWF0Y2ggPSBzLmxvb2thaGVhZDtcblxuICAvLyBBc3NlcnQoKHVsZylzLT5zdHJzdGFydCA8PSBzLT53aW5kb3dfc2l6ZS1NSU5fTE9PS0FIRUFELCBcIm5lZWQgbG9va2FoZWFkXCIpO1xuXG4gIGRvIHtcbiAgICAvLyBBc3NlcnQoY3VyX21hdGNoIDwgcy0+c3Ryc3RhcnQsIFwibm8gZnV0dXJlXCIpO1xuICAgIG1hdGNoID0gY3VyX21hdGNoO1xuXG4gICAgLyogU2tpcCB0byBuZXh0IG1hdGNoIGlmIHRoZSBtYXRjaCBsZW5ndGggY2Fubm90IGluY3JlYXNlXG4gICAgICogb3IgaWYgdGhlIG1hdGNoIGxlbmd0aCBpcyBsZXNzIHRoYW4gMi4gIE5vdGUgdGhhdCB0aGUgY2hlY2tzIGJlbG93XG4gICAgICogZm9yIGluc3VmZmljaWVudCBsb29rYWhlYWQgb25seSBvY2N1ciBvY2Nhc2lvbmFsbHkgZm9yIHBlcmZvcm1hbmNlXG4gICAgICogcmVhc29ucy4gIFRoZXJlZm9yZSB1bmluaXRpYWxpemVkIG1lbW9yeSB3aWxsIGJlIGFjY2Vzc2VkLCBhbmRcbiAgICAgKiBjb25kaXRpb25hbCBqdW1wcyB3aWxsIGJlIG1hZGUgdGhhdCBkZXBlbmQgb24gdGhvc2UgdmFsdWVzLlxuICAgICAqIEhvd2V2ZXIgdGhlIGxlbmd0aCBvZiB0aGUgbWF0Y2ggaXMgbGltaXRlZCB0byB0aGUgbG9va2FoZWFkLCBzb1xuICAgICAqIHRoZSBvdXRwdXQgb2YgZGVmbGF0ZSBpcyBub3QgYWZmZWN0ZWQgYnkgdGhlIHVuaW5pdGlhbGl6ZWQgdmFsdWVzLlxuICAgICAqL1xuXG4gICAgaWYgKFxuICAgICAgX3dpblttYXRjaCArIGJlc3RfbGVuXSAhPT0gc2Nhbl9lbmQgfHxcbiAgICAgIF93aW5bbWF0Y2ggKyBiZXN0X2xlbiAtIDFdICE9PSBzY2FuX2VuZDEgfHxcbiAgICAgIF93aW5bbWF0Y2hdICE9PSBfd2luW3NjYW5dIHx8XG4gICAgICBfd2luWysrbWF0Y2hdICE9PSBfd2luW3NjYW4gKyAxXVxuICAgICkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLyogVGhlIGNoZWNrIGF0IGJlc3RfbGVuLTEgY2FuIGJlIHJlbW92ZWQgYmVjYXVzZSBpdCB3aWxsIGJlIG1hZGVcbiAgICAgKiBhZ2FpbiBsYXRlci4gKFRoaXMgaGV1cmlzdGljIGlzIG5vdCBhbHdheXMgYSB3aW4uKVxuICAgICAqIEl0IGlzIG5vdCBuZWNlc3NhcnkgdG8gY29tcGFyZSBzY2FuWzJdIGFuZCBtYXRjaFsyXSBzaW5jZSB0aGV5XG4gICAgICogYXJlIGFsd2F5cyBlcXVhbCB3aGVuIHRoZSBvdGhlciBieXRlcyBtYXRjaCwgZ2l2ZW4gdGhhdFxuICAgICAqIHRoZSBoYXNoIGtleXMgYXJlIGVxdWFsIGFuZCB0aGF0IEhBU0hfQklUUyA+PSA4LlxuICAgICAqL1xuICAgIHNjYW4gKz0gMjtcbiAgICBtYXRjaCsrO1xuICAgIC8vIEFzc2VydCgqc2NhbiA9PSAqbWF0Y2gsIFwibWF0Y2hbMl0/XCIpO1xuXG4gICAgLyogV2UgY2hlY2sgZm9yIGluc3VmZmljaWVudCBsb29rYWhlYWQgb25seSBldmVyeSA4dGggY29tcGFyaXNvbjtcbiAgICAgKiB0aGUgMjU2dGggY2hlY2sgd2lsbCBiZSBtYWRlIGF0IHN0cnN0YXJ0KzI1OC5cbiAgICAgKi9cbiAgICBkbyB7XG4gICAgICAvKmpzaGludCBub2VtcHR5OmZhbHNlKi9cbiAgICB9IHdoaWxlIChcbiAgICAgIF93aW5bKytzY2FuXSA9PT0gX3dpblsrK21hdGNoXSAmJiBfd2luWysrc2Nhbl0gPT09IF93aW5bKyttYXRjaF0gJiZcbiAgICAgIF93aW5bKytzY2FuXSA9PT0gX3dpblsrK21hdGNoXSAmJiBfd2luWysrc2Nhbl0gPT09IF93aW5bKyttYXRjaF0gJiZcbiAgICAgIF93aW5bKytzY2FuXSA9PT0gX3dpblsrK21hdGNoXSAmJiBfd2luWysrc2Nhbl0gPT09IF93aW5bKyttYXRjaF0gJiZcbiAgICAgIF93aW5bKytzY2FuXSA9PT0gX3dpblsrK21hdGNoXSAmJiBfd2luWysrc2Nhbl0gPT09IF93aW5bKyttYXRjaF0gJiZcbiAgICAgIHNjYW4gPCBzdHJlbmRcbiAgICApO1xuXG4gICAgLy8gQXNzZXJ0KHNjYW4gPD0gcy0+d2luZG93Kyh1bnNpZ25lZCkocy0+d2luZG93X3NpemUtMSksIFwid2lsZCBzY2FuXCIpO1xuXG4gICAgbGVuID0gTUFYX01BVENIIC0gKHN0cmVuZCAtIHNjYW4pO1xuICAgIHNjYW4gPSBzdHJlbmQgLSBNQVhfTUFUQ0g7XG5cbiAgICBpZiAobGVuID4gYmVzdF9sZW4pIHtcbiAgICAgIHMubWF0Y2hfc3RhcnQgPSBjdXJfbWF0Y2g7XG4gICAgICBiZXN0X2xlbiA9IGxlbjtcbiAgICAgIGlmIChsZW4gPj0gbmljZV9tYXRjaCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHNjYW5fZW5kMSA9IF93aW5bc2NhbiArIGJlc3RfbGVuIC0gMV07XG4gICAgICBzY2FuX2VuZCA9IF93aW5bc2NhbiArIGJlc3RfbGVuXTtcbiAgICB9XG4gIH0gd2hpbGUgKFxuICAgIChjdXJfbWF0Y2ggPSBwcmV2W2N1cl9tYXRjaCAmIHdtYXNrXSkgPiBsaW1pdCAmJiAtLWNoYWluX2xlbmd0aCAhPT0gMFxuICApO1xuXG4gIGlmIChiZXN0X2xlbiA8PSBzLmxvb2thaGVhZCkge1xuICAgIHJldHVybiBiZXN0X2xlbjtcbiAgfVxuICByZXR1cm4gcy5sb29rYWhlYWQ7XG59XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogRmlsbCB0aGUgd2luZG93IHdoZW4gdGhlIGxvb2thaGVhZCBiZWNvbWVzIGluc3VmZmljaWVudC5cbiAqIFVwZGF0ZXMgc3Ryc3RhcnQgYW5kIGxvb2thaGVhZC5cbiAqXG4gKiBJTiBhc3NlcnRpb246IGxvb2thaGVhZCA8IE1JTl9MT09LQUhFQURcbiAqIE9VVCBhc3NlcnRpb25zOiBzdHJzdGFydCA8PSB3aW5kb3dfc2l6ZS1NSU5fTE9PS0FIRUFEXG4gKiAgICBBdCBsZWFzdCBvbmUgYnl0ZSBoYXMgYmVlbiByZWFkLCBvciBhdmFpbF9pbiA9PSAwOyByZWFkcyBhcmVcbiAqICAgIHBlcmZvcm1lZCBmb3IgYXQgbGVhc3QgdHdvIGJ5dGVzIChyZXF1aXJlZCBmb3IgdGhlIHppcCB0cmFuc2xhdGVfZW9sXG4gKiAgICBvcHRpb24gLS0gbm90IHN1cHBvcnRlZCBoZXJlKS5cbiAqL1xuZnVuY3Rpb24gZmlsbF93aW5kb3coczogYW55KSB7XG4gIGxldCBfd19zaXplID0gcy53X3NpemU7XG4gIGxldCBwLCBuLCBtLCBtb3JlLCBzdHI7XG5cbiAgLy9Bc3NlcnQocy0+bG9va2FoZWFkIDwgTUlOX0xPT0tBSEVBRCwgXCJhbHJlYWR5IGVub3VnaCBsb29rYWhlYWRcIik7XG5cbiAgZG8ge1xuICAgIG1vcmUgPSBzLndpbmRvd19zaXplIC0gcy5sb29rYWhlYWQgLSBzLnN0cnN0YXJ0O1xuXG4gICAgLy8gSlMgaW50cyBoYXZlIDMyIGJpdCwgYmxvY2sgYmVsb3cgbm90IG5lZWRlZFxuICAgIC8qIERlYWwgd2l0aCAhQCMkJSA2NEsgbGltaXQ6ICovXG4gICAgLy9pZiAoc2l6ZW9mKGludCkgPD0gMikge1xuICAgIC8vICAgIGlmIChtb3JlID09IDAgJiYgcy0+c3Ryc3RhcnQgPT0gMCAmJiBzLT5sb29rYWhlYWQgPT0gMCkge1xuICAgIC8vICAgICAgICBtb3JlID0gd3NpemU7XG4gICAgLy9cbiAgICAvLyAgfSBlbHNlIGlmIChtb3JlID09ICh1bnNpZ25lZCkoLTEpKSB7XG4gICAgLy8gICAgICAgIC8qIFZlcnkgdW5saWtlbHksIGJ1dCBwb3NzaWJsZSBvbiAxNiBiaXQgbWFjaGluZSBpZlxuICAgIC8vICAgICAgICAgKiBzdHJzdGFydCA9PSAwICYmIGxvb2thaGVhZCA9PSAxIChpbnB1dCBkb25lIGEgYnl0ZSBhdCB0aW1lKVxuICAgIC8vICAgICAgICAgKi9cbiAgICAvLyAgICAgICAgbW9yZS0tO1xuICAgIC8vICAgIH1cbiAgICAvL31cblxuICAgIC8qIElmIHRoZSB3aW5kb3cgaXMgYWxtb3N0IGZ1bGwgYW5kIHRoZXJlIGlzIGluc3VmZmljaWVudCBsb29rYWhlYWQsXG4gICAgICogbW92ZSB0aGUgdXBwZXIgaGFsZiB0byB0aGUgbG93ZXIgb25lIHRvIG1ha2Ugcm9vbSBpbiB0aGUgdXBwZXIgaGFsZi5cbiAgICAgKi9cbiAgICBpZiAocy5zdHJzdGFydCA+PSBfd19zaXplICsgKF93X3NpemUgLSBNSU5fTE9PS0FIRUFEKSkge1xuICAgICAgcy53aW5kb3cuc2V0KHMud2luZG93LnN1YmFycmF5KF93X3NpemUsIF93X3NpemUgKyBfd19zaXplKSwgMCk7XG4gICAgICBzLm1hdGNoX3N0YXJ0IC09IF93X3NpemU7XG4gICAgICBzLnN0cnN0YXJ0IC09IF93X3NpemU7XG4gICAgICAvKiB3ZSBub3cgaGF2ZSBzdHJzdGFydCA+PSBNQVhfRElTVCAqL1xuICAgICAgcy5ibG9ja19zdGFydCAtPSBfd19zaXplO1xuXG4gICAgICAvKiBTbGlkZSB0aGUgaGFzaCB0YWJsZSAoY291bGQgYmUgYXZvaWRlZCB3aXRoIDMyIGJpdCB2YWx1ZXNcbiAgICAgICBhdCB0aGUgZXhwZW5zZSBvZiBtZW1vcnkgdXNhZ2UpLiBXZSBzbGlkZSBldmVuIHdoZW4gbGV2ZWwgPT0gMFxuICAgICAgIHRvIGtlZXAgdGhlIGhhc2ggdGFibGUgY29uc2lzdGVudCBpZiB3ZSBzd2l0Y2ggYmFjayB0byBsZXZlbCA+IDBcbiAgICAgICBsYXRlci4gKFVzaW5nIGxldmVsIDAgcGVybWFuZW50bHkgaXMgbm90IGFuIG9wdGltYWwgdXNhZ2Ugb2ZcbiAgICAgICB6bGliLCBzbyB3ZSBkb24ndCBjYXJlIGFib3V0IHRoaXMgcGF0aG9sb2dpY2FsIGNhc2UuKVxuICAgICAgICovXG5cbiAgICAgIG4gPSBzLmhhc2hfc2l6ZTtcbiAgICAgIHAgPSBuO1xuICAgICAgZG8ge1xuICAgICAgICBtID0gcy5oZWFkWy0tcF07XG4gICAgICAgIHMuaGVhZFtwXSA9IChtID49IF93X3NpemUgPyBtIC0gX3dfc2l6ZSA6IDApO1xuICAgICAgfSB3aGlsZSAoLS1uKTtcblxuICAgICAgbiA9IF93X3NpemU7XG4gICAgICBwID0gbjtcbiAgICAgIGRvIHtcbiAgICAgICAgbSA9IHMucHJldlstLXBdO1xuICAgICAgICBzLnByZXZbcF0gPSAobSA+PSBfd19zaXplID8gbSAtIF93X3NpemUgOiAwKTtcbiAgICAgICAgLyogSWYgbiBpcyBub3Qgb24gYW55IGhhc2ggY2hhaW4sIHByZXZbbl0gaXMgZ2FyYmFnZSBidXRcbiAgICAgICAgICogaXRzIHZhbHVlIHdpbGwgbmV2ZXIgYmUgdXNlZC5cbiAgICAgICAgICovXG4gICAgICB9IHdoaWxlICgtLW4pO1xuXG4gICAgICBtb3JlICs9IF93X3NpemU7XG4gICAgfVxuICAgIGlmIChzLnN0cm0uYXZhaWxfaW4gPT09IDApIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8qIElmIHRoZXJlIHdhcyBubyBzbGlkaW5nOlxuICAgICAqICAgIHN0cnN0YXJ0IDw9IFdTSVpFK01BWF9ESVNULTEgJiYgbG9va2FoZWFkIDw9IE1JTl9MT09LQUhFQUQgLSAxICYmXG4gICAgICogICAgbW9yZSA9PSB3aW5kb3dfc2l6ZSAtIGxvb2thaGVhZCAtIHN0cnN0YXJ0XG4gICAgICogPT4gbW9yZSA+PSB3aW5kb3dfc2l6ZSAtIChNSU5fTE9PS0FIRUFELTEgKyBXU0laRSArIE1BWF9ESVNULTEpXG4gICAgICogPT4gbW9yZSA+PSB3aW5kb3dfc2l6ZSAtIDIqV1NJWkUgKyAyXG4gICAgICogSW4gdGhlIEJJR19NRU0gb3IgTU1BUCBjYXNlIChub3QgeWV0IHN1cHBvcnRlZCksXG4gICAgICogICB3aW5kb3dfc2l6ZSA9PSBpbnB1dF9zaXplICsgTUlOX0xPT0tBSEVBRCAgJiZcbiAgICAgKiAgIHN0cnN0YXJ0ICsgcy0+bG9va2FoZWFkIDw9IGlucHV0X3NpemUgPT4gbW9yZSA+PSBNSU5fTE9PS0FIRUFELlxuICAgICAqIE90aGVyd2lzZSwgd2luZG93X3NpemUgPT0gMipXU0laRSBzbyBtb3JlID49IDIuXG4gICAgICogSWYgdGhlcmUgd2FzIHNsaWRpbmcsIG1vcmUgPj0gV1NJWkUuIFNvIGluIGFsbCBjYXNlcywgbW9yZSA+PSAyLlxuICAgICAqL1xuICAgIC8vQXNzZXJ0KG1vcmUgPj0gMiwgXCJtb3JlIDwgMlwiKTtcbiAgICBuID0gcmVhZF9idWYocy5zdHJtLCBzLndpbmRvdywgcy5zdHJzdGFydCArIHMubG9va2FoZWFkLCBtb3JlKTtcbiAgICBzLmxvb2thaGVhZCArPSBuO1xuXG4gICAgLyogSW5pdGlhbGl6ZSB0aGUgaGFzaCB2YWx1ZSBub3cgdGhhdCB3ZSBoYXZlIHNvbWUgaW5wdXQ6ICovXG4gICAgaWYgKHMubG9va2FoZWFkICsgcy5pbnNlcnQgPj0gTUlOX01BVENIKSB7XG4gICAgICBzdHIgPSBzLnN0cnN0YXJ0IC0gcy5pbnNlcnQ7XG4gICAgICBzLmluc19oID0gcy53aW5kb3dbc3RyXTtcblxuICAgICAgLyogVVBEQVRFX0hBU0gocywgcy0+aW5zX2gsIHMtPndpbmRvd1tzdHIgKyAxXSk7ICovXG4gICAgICBzLmluc19oID0gKChzLmluc19oIDw8IHMuaGFzaF9zaGlmdCkgXiBzLndpbmRvd1tzdHIgKyAxXSkgJiBzLmhhc2hfbWFzaztcbiAgICAgIC8vI2lmIE1JTl9NQVRDSCAhPSAzXG4gICAgICAvLyAgICAgICAgQ2FsbCB1cGRhdGVfaGFzaCgpIE1JTl9NQVRDSC0zIG1vcmUgdGltZXNcbiAgICAgIC8vI2VuZGlmXG4gICAgICB3aGlsZSAocy5pbnNlcnQpIHtcbiAgICAgICAgLyogVVBEQVRFX0hBU0gocywgcy0+aW5zX2gsIHMtPndpbmRvd1tzdHIgKyBNSU5fTUFUQ0gtMV0pOyAqL1xuICAgICAgICBzLmluc19oID0gKChzLmluc19oIDw8IHMuaGFzaF9zaGlmdCkgXiBzLndpbmRvd1tzdHIgKyBNSU5fTUFUQ0ggLSAxXSkgJlxuICAgICAgICAgIHMuaGFzaF9tYXNrO1xuXG4gICAgICAgIHMucHJldltzdHIgJiBzLndfbWFza10gPSBzLmhlYWRbcy5pbnNfaF07XG4gICAgICAgIHMuaGVhZFtzLmluc19oXSA9IHN0cjtcbiAgICAgICAgc3RyKys7XG4gICAgICAgIHMuaW5zZXJ0LS07XG4gICAgICAgIGlmIChzLmxvb2thaGVhZCArIHMuaW5zZXJ0IDwgTUlOX01BVENIKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLyogSWYgdGhlIHdob2xlIGlucHV0IGhhcyBsZXNzIHRoYW4gTUlOX01BVENIIGJ5dGVzLCBpbnNfaCBpcyBnYXJiYWdlLFxuICAgICAqIGJ1dCB0aGlzIGlzIG5vdCBpbXBvcnRhbnQgc2luY2Ugb25seSBsaXRlcmFsIGJ5dGVzIHdpbGwgYmUgZW1pdHRlZC5cbiAgICAgKi9cbiAgfSB3aGlsZSAocy5sb29rYWhlYWQgPCBNSU5fTE9PS0FIRUFEICYmIHMuc3RybS5hdmFpbF9pbiAhPT0gMCk7XG5cbiAgLyogSWYgdGhlIFdJTl9JTklUIGJ5dGVzIGFmdGVyIHRoZSBlbmQgb2YgdGhlIGN1cnJlbnQgZGF0YSBoYXZlIG5ldmVyIGJlZW5cbiAgICogd3JpdHRlbiwgdGhlbiB6ZXJvIHRob3NlIGJ5dGVzIGluIG9yZGVyIHRvIGF2b2lkIG1lbW9yeSBjaGVjayByZXBvcnRzIG9mXG4gICAqIHRoZSB1c2Ugb2YgdW5pbml0aWFsaXplZCAob3IgdW5pbml0aWFsaXNlZCBhcyBKdWxpYW4gd3JpdGVzKSBieXRlcyBieVxuICAgKiB0aGUgbG9uZ2VzdCBtYXRjaCByb3V0aW5lcy4gIFVwZGF0ZSB0aGUgaGlnaCB3YXRlciBtYXJrIGZvciB0aGUgbmV4dFxuICAgKiB0aW1lIHRocm91Z2ggaGVyZS4gIFdJTl9JTklUIGlzIHNldCB0byBNQVhfTUFUQ0ggc2luY2UgdGhlIGxvbmdlc3QgbWF0Y2hcbiAgICogcm91dGluZXMgYWxsb3cgc2Nhbm5pbmcgdG8gc3Ryc3RhcnQgKyBNQVhfTUFUQ0gsIGlnbm9yaW5nIGxvb2thaGVhZC5cbiAgICovXG4gIC8vICBpZiAocy5oaWdoX3dhdGVyIDwgcy53aW5kb3dfc2l6ZSkge1xuICAvLyAgICBsZXQgY3VyciA9IHMuc3Ryc3RhcnQgKyBzLmxvb2thaGVhZDtcbiAgLy8gICAgbGV0IGluaXQgPSAwO1xuICAvL1xuICAvLyAgICBpZiAocy5oaWdoX3dhdGVyIDwgY3Vycikge1xuICAvLyAgICAgIC8qIFByZXZpb3VzIGhpZ2ggd2F0ZXIgbWFyayBiZWxvdyBjdXJyZW50IGRhdGEgLS0gemVybyBXSU5fSU5JVFxuICAvLyAgICAgICAqIGJ5dGVzIG9yIHVwIHRvIGVuZCBvZiB3aW5kb3csIHdoaWNoZXZlciBpcyBsZXNzLlxuICAvLyAgICAgICAqL1xuICAvLyAgICAgIGluaXQgPSBzLndpbmRvd19zaXplIC0gY3VycjtcbiAgLy8gICAgICBpZiAoaW5pdCA+IFdJTl9JTklUKVxuICAvLyAgICAgICAgaW5pdCA9IFdJTl9JTklUO1xuICAvLyAgICAgIHptZW16ZXJvKHMtPndpbmRvdyArIGN1cnIsICh1bnNpZ25lZClpbml0KTtcbiAgLy8gICAgICBzLT5oaWdoX3dhdGVyID0gY3VyciArIGluaXQ7XG4gIC8vICAgIH1cbiAgLy8gICAgZWxzZSBpZiAocy0+aGlnaF93YXRlciA8ICh1bGcpY3VyciArIFdJTl9JTklUKSB7XG4gIC8vICAgICAgLyogSGlnaCB3YXRlciBtYXJrIGF0IG9yIGFib3ZlIGN1cnJlbnQgZGF0YSwgYnV0IGJlbG93IGN1cnJlbnQgZGF0YVxuICAvLyAgICAgICAqIHBsdXMgV0lOX0lOSVQgLS0gemVybyBvdXQgdG8gY3VycmVudCBkYXRhIHBsdXMgV0lOX0lOSVQsIG9yIHVwXG4gIC8vICAgICAgICogdG8gZW5kIG9mIHdpbmRvdywgd2hpY2hldmVyIGlzIGxlc3MuXG4gIC8vICAgICAgICovXG4gIC8vICAgICAgaW5pdCA9ICh1bGcpY3VyciArIFdJTl9JTklUIC0gcy0+aGlnaF93YXRlcjtcbiAgLy8gICAgICBpZiAoaW5pdCA+IHMtPndpbmRvd19zaXplIC0gcy0+aGlnaF93YXRlcilcbiAgLy8gICAgICAgIGluaXQgPSBzLT53aW5kb3dfc2l6ZSAtIHMtPmhpZ2hfd2F0ZXI7XG4gIC8vICAgICAgem1lbXplcm8ocy0+d2luZG93ICsgcy0+aGlnaF93YXRlciwgKHVuc2lnbmVkKWluaXQpO1xuICAvLyAgICAgIHMtPmhpZ2hfd2F0ZXIgKz0gaW5pdDtcbiAgLy8gICAgfVxuICAvLyAgfVxuICAvL1xuICAvLyAgQXNzZXJ0KCh1bGcpcy0+c3Ryc3RhcnQgPD0gcy0+d2luZG93X3NpemUgLSBNSU5fTE9PS0FIRUFELFxuICAvLyAgICBcIm5vdCBlbm91Z2ggcm9vbSBmb3Igc2VhcmNoXCIpO1xufVxuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvcHkgd2l0aG91dCBjb21wcmVzc2lvbiBhcyBtdWNoIGFzIHBvc3NpYmxlIGZyb20gdGhlIGlucHV0IHN0cmVhbSwgcmV0dXJuXG4gKiB0aGUgY3VycmVudCBibG9jayBzdGF0ZS5cbiAqIFRoaXMgZnVuY3Rpb24gZG9lcyBub3QgaW5zZXJ0IG5ldyBzdHJpbmdzIGluIHRoZSBkaWN0aW9uYXJ5IHNpbmNlXG4gKiB1bmNvbXByZXNzaWJsZSBkYXRhIGlzIHByb2JhYmx5IG5vdCB1c2VmdWwuIFRoaXMgZnVuY3Rpb24gaXMgdXNlZFxuICogb25seSBmb3IgdGhlIGxldmVsPTAgY29tcHJlc3Npb24gb3B0aW9uLlxuICogTk9URTogdGhpcyBmdW5jdGlvbiBzaG91bGQgYmUgb3B0aW1pemVkIHRvIGF2b2lkIGV4dHJhIGNvcHlpbmcgZnJvbVxuICogd2luZG93IHRvIHBlbmRpbmdfYnVmLlxuICovXG5mdW5jdGlvbiBkZWZsYXRlX3N0b3JlZChzOiBhbnksIGZsdXNoOiBhbnkpIHtcbiAgLyogU3RvcmVkIGJsb2NrcyBhcmUgbGltaXRlZCB0byAweGZmZmYgYnl0ZXMsIHBlbmRpbmdfYnVmIGlzIGxpbWl0ZWRcbiAgICogdG8gcGVuZGluZ19idWZfc2l6ZSwgYW5kIGVhY2ggc3RvcmVkIGJsb2NrIGhhcyBhIDUgYnl0ZSBoZWFkZXI6XG4gICAqL1xuICBsZXQgbWF4X2Jsb2NrX3NpemUgPSAweGZmZmY7XG5cbiAgaWYgKG1heF9ibG9ja19zaXplID4gcy5wZW5kaW5nX2J1Zl9zaXplIC0gNSkge1xuICAgIG1heF9ibG9ja19zaXplID0gcy5wZW5kaW5nX2J1Zl9zaXplIC0gNTtcbiAgfVxuXG4gIC8qIENvcHkgYXMgbXVjaCBhcyBwb3NzaWJsZSBmcm9tIGlucHV0IHRvIG91dHB1dDogKi9cbiAgZm9yICg7Oykge1xuICAgIC8qIEZpbGwgdGhlIHdpbmRvdyBhcyBtdWNoIGFzIHBvc3NpYmxlOiAqL1xuICAgIGlmIChzLmxvb2thaGVhZCA8PSAxKSB7XG4gICAgICAvL0Fzc2VydChzLT5zdHJzdGFydCA8IHMtPndfc2l6ZStNQVhfRElTVChzKSB8fFxuICAgICAgLy8gIHMtPmJsb2NrX3N0YXJ0ID49IChsb25nKXMtPndfc2l6ZSwgXCJzbGlkZSB0b28gbGF0ZVwiKTtcbiAgICAgIC8vICAgICAgaWYgKCEocy5zdHJzdGFydCA8IHMud19zaXplICsgKHMud19zaXplIC0gTUlOX0xPT0tBSEVBRCkgfHxcbiAgICAgIC8vICAgICAgICBzLmJsb2NrX3N0YXJ0ID49IHMud19zaXplKSkge1xuICAgICAgLy8gICAgICAgIHRocm93ICBuZXcgRXJyb3IoXCJzbGlkZSB0b28gbGF0ZVwiKTtcbiAgICAgIC8vICAgICAgfVxuXG4gICAgICBmaWxsX3dpbmRvdyhzKTtcbiAgICAgIGlmIChzLmxvb2thaGVhZCA9PT0gMCAmJiBmbHVzaCA9PT0gU1RBVFVTLlpfTk9fRkxVU0gpIHtcbiAgICAgICAgcmV0dXJuIEJTX05FRURfTU9SRTtcbiAgICAgIH1cblxuICAgICAgaWYgKHMubG9va2FoZWFkID09PSAwKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgLyogZmx1c2ggdGhlIGN1cnJlbnQgYmxvY2sgKi9cbiAgICB9XG4gICAgLy9Bc3NlcnQocy0+YmxvY2tfc3RhcnQgPj0gMEwsIFwiYmxvY2sgZ29uZVwiKTtcbiAgICAvLyAgICBpZiAocy5ibG9ja19zdGFydCA8IDApIHRocm93IG5ldyBFcnJvcihcImJsb2NrIGdvbmVcIik7XG5cbiAgICBzLnN0cnN0YXJ0ICs9IHMubG9va2FoZWFkO1xuICAgIHMubG9va2FoZWFkID0gMDtcblxuICAgIC8qIEVtaXQgYSBzdG9yZWQgYmxvY2sgaWYgcGVuZGluZ19idWYgd2lsbCBiZSBmdWxsOiAqL1xuICAgIGxldCBtYXhfc3RhcnQgPSBzLmJsb2NrX3N0YXJ0ICsgbWF4X2Jsb2NrX3NpemU7XG5cbiAgICBpZiAocy5zdHJzdGFydCA9PT0gMCB8fCBzLnN0cnN0YXJ0ID49IG1heF9zdGFydCkge1xuICAgICAgLyogc3Ryc3RhcnQgPT0gMCBpcyBwb3NzaWJsZSB3aGVuIHdyYXBhcm91bmQgb24gMTYtYml0IG1hY2hpbmUgKi9cbiAgICAgIHMubG9va2FoZWFkID0gcy5zdHJzdGFydCAtIG1heF9zdGFydDtcbiAgICAgIHMuc3Ryc3RhcnQgPSBtYXhfc3RhcnQ7XG4gICAgICAvKioqIEZMVVNIX0JMT0NLKHMsIDApOyAqKiovXG4gICAgICBmbHVzaF9ibG9ja19vbmx5KHMsIGZhbHNlKTtcbiAgICAgIGlmIChzLnN0cm0uYXZhaWxfb3V0ID09PSAwKSB7XG4gICAgICAgIHJldHVybiBCU19ORUVEX01PUkU7XG4gICAgICB9XG4gICAgICAvKioqL1xuICAgIH1cbiAgICAvKiBGbHVzaCBpZiB3ZSBtYXkgaGF2ZSB0byBzbGlkZSwgb3RoZXJ3aXNlIGJsb2NrX3N0YXJ0IG1heSBiZWNvbWVcbiAgICAgKiBuZWdhdGl2ZSBhbmQgdGhlIGRhdGEgd2lsbCBiZSBnb25lOlxuICAgICAqL1xuICAgIGlmIChzLnN0cnN0YXJ0IC0gcy5ibG9ja19zdGFydCA+PSAocy53X3NpemUgLSBNSU5fTE9PS0FIRUFEKSkge1xuICAgICAgLyoqKiBGTFVTSF9CTE9DSyhzLCAwKTsgKioqL1xuICAgICAgZmx1c2hfYmxvY2tfb25seShzLCBmYWxzZSk7XG4gICAgICBpZiAocy5zdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gQlNfTkVFRF9NT1JFO1xuICAgICAgfVxuICAgICAgLyoqKi9cbiAgICB9XG4gIH1cblxuICBzLmluc2VydCA9IDA7XG5cbiAgaWYgKGZsdXNoID09PSBTVEFUVVMuWl9GSU5JU0gpIHtcbiAgICAvKioqIEZMVVNIX0JMT0NLKHMsIDEpOyAqKiovXG4gICAgZmx1c2hfYmxvY2tfb25seShzLCB0cnVlKTtcbiAgICBpZiAocy5zdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgcmV0dXJuIEJTX0ZJTklTSF9TVEFSVEVEO1xuICAgIH1cbiAgICAvKioqL1xuICAgIHJldHVybiBCU19GSU5JU0hfRE9ORTtcbiAgfVxuXG4gIGlmIChzLnN0cnN0YXJ0ID4gcy5ibG9ja19zdGFydCkge1xuICAgIC8qKiogRkxVU0hfQkxPQ0socywgMCk7ICoqKi9cbiAgICBmbHVzaF9ibG9ja19vbmx5KHMsIGZhbHNlKTtcbiAgICBpZiAocy5zdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgcmV0dXJuIEJTX05FRURfTU9SRTtcbiAgICB9XG4gICAgLyoqKi9cbiAgfVxuXG4gIHJldHVybiBCU19ORUVEX01PUkU7XG59XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29tcHJlc3MgYXMgbXVjaCBhcyBwb3NzaWJsZSBmcm9tIHRoZSBpbnB1dCBzdHJlYW0sIHJldHVybiB0aGUgY3VycmVudFxuICogYmxvY2sgc3RhdGUuXG4gKiBUaGlzIGZ1bmN0aW9uIGRvZXMgbm90IHBlcmZvcm0gbGF6eSBldmFsdWF0aW9uIG9mIG1hdGNoZXMgYW5kIGluc2VydHNcbiAqIG5ldyBzdHJpbmdzIGluIHRoZSBkaWN0aW9uYXJ5IG9ubHkgZm9yIHVubWF0Y2hlZCBzdHJpbmdzIG9yIGZvciBzaG9ydFxuICogbWF0Y2hlcy4gSXQgaXMgdXNlZCBvbmx5IGZvciB0aGUgZmFzdCBjb21wcmVzc2lvbiBvcHRpb25zLlxuICovXG5mdW5jdGlvbiBkZWZsYXRlX2Zhc3QoczogYW55LCBmbHVzaDogYW55KSB7XG4gIGxldCBoYXNoX2hlYWQ7IC8qIGhlYWQgb2YgdGhlIGhhc2ggY2hhaW4gKi9cbiAgbGV0IGJmbHVzaDsgLyogc2V0IGlmIGN1cnJlbnQgYmxvY2sgbXVzdCBiZSBmbHVzaGVkICovXG5cbiAgZm9yICg7Oykge1xuICAgIC8qIE1ha2Ugc3VyZSB0aGF0IHdlIGFsd2F5cyBoYXZlIGVub3VnaCBsb29rYWhlYWQsIGV4Y2VwdFxuICAgICAqIGF0IHRoZSBlbmQgb2YgdGhlIGlucHV0IGZpbGUuIFdlIG5lZWQgTUFYX01BVENIIGJ5dGVzXG4gICAgICogZm9yIHRoZSBuZXh0IG1hdGNoLCBwbHVzIE1JTl9NQVRDSCBieXRlcyB0byBpbnNlcnQgdGhlXG4gICAgICogc3RyaW5nIGZvbGxvd2luZyB0aGUgbmV4dCBtYXRjaC5cbiAgICAgKi9cbiAgICBpZiAocy5sb29rYWhlYWQgPCBNSU5fTE9PS0FIRUFEKSB7XG4gICAgICBmaWxsX3dpbmRvdyhzKTtcbiAgICAgIGlmIChzLmxvb2thaGVhZCA8IE1JTl9MT09LQUhFQUQgJiYgZmx1c2ggPT09IFNUQVRVUy5aX05PX0ZMVVNIKSB7XG4gICAgICAgIHJldHVybiBCU19ORUVEX01PUkU7XG4gICAgICB9XG4gICAgICBpZiAocy5sb29rYWhlYWQgPT09IDApIHtcbiAgICAgICAgYnJlYWs7IC8qIGZsdXNoIHRoZSBjdXJyZW50IGJsb2NrICovXG4gICAgICB9XG4gICAgfVxuXG4gICAgLyogSW5zZXJ0IHRoZSBzdHJpbmcgd2luZG93W3N0cnN0YXJ0IC4uIHN0cnN0YXJ0KzJdIGluIHRoZVxuICAgICAqIGRpY3Rpb25hcnksIGFuZCBzZXQgaGFzaF9oZWFkIHRvIHRoZSBoZWFkIG9mIHRoZSBoYXNoIGNoYWluOlxuICAgICAqL1xuICAgIGhhc2hfaGVhZCA9IDAgLypOSUwqLztcbiAgICBpZiAocy5sb29rYWhlYWQgPj0gTUlOX01BVENIKSB7XG4gICAgICAvKioqIElOU0VSVF9TVFJJTkcocywgcy5zdHJzdGFydCwgaGFzaF9oZWFkKTsgKioqL1xuICAgICAgcy5pbnNfaCA9XG4gICAgICAgICgocy5pbnNfaCA8PCBzLmhhc2hfc2hpZnQpIF4gcy53aW5kb3dbcy5zdHJzdGFydCArIE1JTl9NQVRDSCAtIDFdKSAmXG4gICAgICAgIHMuaGFzaF9tYXNrO1xuICAgICAgaGFzaF9oZWFkID0gcy5wcmV2W3Muc3Ryc3RhcnQgJiBzLndfbWFza10gPSBzLmhlYWRbcy5pbnNfaF07XG4gICAgICBzLmhlYWRbcy5pbnNfaF0gPSBzLnN0cnN0YXJ0O1xuICAgICAgLyoqKi9cbiAgICB9XG5cbiAgICAvKiBGaW5kIHRoZSBsb25nZXN0IG1hdGNoLCBkaXNjYXJkaW5nIHRob3NlIDw9IHByZXZfbGVuZ3RoLlxuICAgICAqIEF0IHRoaXMgcG9pbnQgd2UgaGF2ZSBhbHdheXMgbWF0Y2hfbGVuZ3RoIDwgTUlOX01BVENIXG4gICAgICovXG4gICAgaWYgKFxuICAgICAgaGFzaF9oZWFkICE9PSAwIC8qTklMKi8gJiZcbiAgICAgICgocy5zdHJzdGFydCAtIGhhc2hfaGVhZCkgPD0gKHMud19zaXplIC0gTUlOX0xPT0tBSEVBRCkpXG4gICAgKSB7XG4gICAgICAvKiBUbyBzaW1wbGlmeSB0aGUgY29kZSwgd2UgcHJldmVudCBtYXRjaGVzIHdpdGggdGhlIHN0cmluZ1xuICAgICAgICogb2Ygd2luZG93IGluZGV4IDAgKGluIHBhcnRpY3VsYXIgd2UgaGF2ZSB0byBhdm9pZCBhIG1hdGNoXG4gICAgICAgKiBvZiB0aGUgc3RyaW5nIHdpdGggaXRzZWxmIGF0IHRoZSBzdGFydCBvZiB0aGUgaW5wdXQgZmlsZSkuXG4gICAgICAgKi9cbiAgICAgIHMubWF0Y2hfbGVuZ3RoID0gbG9uZ2VzdF9tYXRjaChzLCBoYXNoX2hlYWQpO1xuICAgICAgLyogbG9uZ2VzdF9tYXRjaCgpIHNldHMgbWF0Y2hfc3RhcnQgKi9cbiAgICB9XG4gICAgaWYgKHMubWF0Y2hfbGVuZ3RoID49IE1JTl9NQVRDSCkge1xuICAgICAgLy8gY2hlY2tfbWF0Y2gocywgcy5zdHJzdGFydCwgcy5tYXRjaF9zdGFydCwgcy5tYXRjaF9sZW5ndGgpOyAvLyBmb3IgZGVidWcgb25seVxuXG4gICAgICAvKioqIF90cl90YWxseV9kaXN0KHMsIHMuc3Ryc3RhcnQgLSBzLm1hdGNoX3N0YXJ0LFxuICAgICAgICAgICAgICAgICAgICAgcy5tYXRjaF9sZW5ndGggLSBNSU5fTUFUQ0gsIGJmbHVzaCk7ICoqKi9cbiAgICAgIGJmbHVzaCA9IHRyZWVzLl90cl90YWxseShcbiAgICAgICAgcyxcbiAgICAgICAgcy5zdHJzdGFydCAtIHMubWF0Y2hfc3RhcnQsXG4gICAgICAgIHMubWF0Y2hfbGVuZ3RoIC0gTUlOX01BVENILFxuICAgICAgKTtcblxuICAgICAgcy5sb29rYWhlYWQgLT0gcy5tYXRjaF9sZW5ndGg7XG5cbiAgICAgIC8qIEluc2VydCBuZXcgc3RyaW5ncyBpbiB0aGUgaGFzaCB0YWJsZSBvbmx5IGlmIHRoZSBtYXRjaCBsZW5ndGhcbiAgICAgICAqIGlzIG5vdCB0b28gbGFyZ2UuIFRoaXMgc2F2ZXMgdGltZSBidXQgZGVncmFkZXMgY29tcHJlc3Npb24uXG4gICAgICAgKi9cbiAgICAgIGlmIChcbiAgICAgICAgcy5tYXRjaF9sZW5ndGggPD0gcy5tYXhfbGF6eV9tYXRjaCAvKm1heF9pbnNlcnRfbGVuZ3RoKi8gJiZcbiAgICAgICAgcy5sb29rYWhlYWQgPj0gTUlOX01BVENIXG4gICAgICApIHtcbiAgICAgICAgcy5tYXRjaF9sZW5ndGgtLTsgLyogc3RyaW5nIGF0IHN0cnN0YXJ0IGFscmVhZHkgaW4gdGFibGUgKi9cbiAgICAgICAgZG8ge1xuICAgICAgICAgIHMuc3Ryc3RhcnQrKztcbiAgICAgICAgICAvKioqIElOU0VSVF9TVFJJTkcocywgcy5zdHJzdGFydCwgaGFzaF9oZWFkKTsgKioqL1xuICAgICAgICAgIHMuaW5zX2ggPVxuICAgICAgICAgICAgKChzLmluc19oIDw8IHMuaGFzaF9zaGlmdCkgXiBzLndpbmRvd1tzLnN0cnN0YXJ0ICsgTUlOX01BVENIIC0gMV0pICZcbiAgICAgICAgICAgIHMuaGFzaF9tYXNrO1xuICAgICAgICAgIGhhc2hfaGVhZCA9IHMucHJldltzLnN0cnN0YXJ0ICYgcy53X21hc2tdID0gcy5oZWFkW3MuaW5zX2hdO1xuICAgICAgICAgIHMuaGVhZFtzLmluc19oXSA9IHMuc3Ryc3RhcnQ7XG4gICAgICAgICAgLyoqKi9cbiAgICAgICAgICAvKiBzdHJzdGFydCBuZXZlciBleGNlZWRzIFdTSVpFLU1BWF9NQVRDSCwgc28gdGhlcmUgYXJlXG4gICAgICAgICAgICogYWx3YXlzIE1JTl9NQVRDSCBieXRlcyBhaGVhZC5cbiAgICAgICAgICAgKi9cbiAgICAgICAgfSB3aGlsZSAoLS1zLm1hdGNoX2xlbmd0aCAhPT0gMCk7XG4gICAgICAgIHMuc3Ryc3RhcnQrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMuc3Ryc3RhcnQgKz0gcy5tYXRjaF9sZW5ndGg7XG4gICAgICAgIHMubWF0Y2hfbGVuZ3RoID0gMDtcbiAgICAgICAgcy5pbnNfaCA9IHMud2luZG93W3Muc3Ryc3RhcnRdO1xuICAgICAgICAvKiBVUERBVEVfSEFTSChzLCBzLmluc19oLCBzLndpbmRvd1tzLnN0cnN0YXJ0KzFdKTsgKi9cbiAgICAgICAgcy5pbnNfaCA9ICgocy5pbnNfaCA8PCBzLmhhc2hfc2hpZnQpIF4gcy53aW5kb3dbcy5zdHJzdGFydCArIDFdKSAmXG4gICAgICAgICAgcy5oYXNoX21hc2s7XG5cbiAgICAgICAgLy8jaWYgTUlOX01BVENIICE9IDNcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgQ2FsbCBVUERBVEVfSEFTSCgpIE1JTl9NQVRDSC0zIG1vcmUgdGltZXNcbiAgICAgICAgLy8jZW5kaWZcbiAgICAgICAgLyogSWYgbG9va2FoZWFkIDwgTUlOX01BVENILCBpbnNfaCBpcyBnYXJiYWdlLCBidXQgaXQgZG9lcyBub3RcbiAgICAgICAgICogbWF0dGVyIHNpbmNlIGl0IHdpbGwgYmUgcmVjb21wdXRlZCBhdCBuZXh0IGRlZmxhdGUgY2FsbC5cbiAgICAgICAgICovXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8qIE5vIG1hdGNoLCBvdXRwdXQgYSBsaXRlcmFsIGJ5dGUgKi9cbiAgICAgIC8vVHJhY2V2digoc3RkZXJyLFwiJWNcIiwgcy53aW5kb3dbcy5zdHJzdGFydF0pKTtcbiAgICAgIC8qKiogX3RyX3RhbGx5X2xpdChzLCBzLndpbmRvd1tzLnN0cnN0YXJ0XSwgYmZsdXNoKTsgKioqL1xuICAgICAgYmZsdXNoID0gdHJlZXMuX3RyX3RhbGx5KHMsIDAsIHMud2luZG93W3Muc3Ryc3RhcnRdKTtcblxuICAgICAgcy5sb29rYWhlYWQtLTtcbiAgICAgIHMuc3Ryc3RhcnQrKztcbiAgICB9XG4gICAgaWYgKGJmbHVzaCkge1xuICAgICAgLyoqKiBGTFVTSF9CTE9DSyhzLCAwKTsgKioqL1xuICAgICAgZmx1c2hfYmxvY2tfb25seShzLCBmYWxzZSk7XG4gICAgICBpZiAocy5zdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gQlNfTkVFRF9NT1JFO1xuICAgICAgfVxuICAgICAgLyoqKi9cbiAgICB9XG4gIH1cbiAgcy5pbnNlcnQgPSAoKHMuc3Ryc3RhcnQgPCAoTUlOX01BVENIIC0gMSkpID8gcy5zdHJzdGFydCA6IE1JTl9NQVRDSCAtIDEpO1xuICBpZiAoZmx1c2ggPT09IFNUQVRVUy5aX0ZJTklTSCkge1xuICAgIC8qKiogRkxVU0hfQkxPQ0socywgMSk7ICoqKi9cbiAgICBmbHVzaF9ibG9ja19vbmx5KHMsIHRydWUpO1xuICAgIGlmIChzLnN0cm0uYXZhaWxfb3V0ID09PSAwKSB7XG4gICAgICByZXR1cm4gQlNfRklOSVNIX1NUQVJURUQ7XG4gICAgfVxuICAgIC8qKiovXG4gICAgcmV0dXJuIEJTX0ZJTklTSF9ET05FO1xuICB9XG4gIGlmIChzLmxhc3RfbGl0KSB7XG4gICAgLyoqKiBGTFVTSF9CTE9DSyhzLCAwKTsgKioqL1xuICAgIGZsdXNoX2Jsb2NrX29ubHkocywgZmFsc2UpO1xuICAgIGlmIChzLnN0cm0uYXZhaWxfb3V0ID09PSAwKSB7XG4gICAgICByZXR1cm4gQlNfTkVFRF9NT1JFO1xuICAgIH1cbiAgICAvKioqL1xuICB9XG4gIHJldHVybiBCU19CTE9DS19ET05FO1xufVxuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIFNhbWUgYXMgYWJvdmUsIGJ1dCBhY2hpZXZlcyBiZXR0ZXIgY29tcHJlc3Npb24uIFdlIHVzZSBhIGxhenlcbiAqIGV2YWx1YXRpb24gZm9yIG1hdGNoZXM6IGEgbWF0Y2ggaXMgZmluYWxseSBhZG9wdGVkIG9ubHkgaWYgdGhlcmUgaXNcbiAqIG5vIGJldHRlciBtYXRjaCBhdCB0aGUgbmV4dCB3aW5kb3cgcG9zaXRpb24uXG4gKi9cbmZ1bmN0aW9uIGRlZmxhdGVfc2xvdyhzOiBhbnksIGZsdXNoOiBhbnkpIHtcbiAgbGV0IGhhc2hfaGVhZDsgLyogaGVhZCBvZiBoYXNoIGNoYWluICovXG4gIGxldCBiZmx1c2g7IC8qIHNldCBpZiBjdXJyZW50IGJsb2NrIG11c3QgYmUgZmx1c2hlZCAqL1xuXG4gIGxldCBtYXhfaW5zZXJ0O1xuXG4gIC8qIFByb2Nlc3MgdGhlIGlucHV0IGJsb2NrLiAqL1xuICBmb3IgKDs7KSB7XG4gICAgLyogTWFrZSBzdXJlIHRoYXQgd2UgYWx3YXlzIGhhdmUgZW5vdWdoIGxvb2thaGVhZCwgZXhjZXB0XG4gICAgICogYXQgdGhlIGVuZCBvZiB0aGUgaW5wdXQgZmlsZS4gV2UgbmVlZCBNQVhfTUFUQ0ggYnl0ZXNcbiAgICAgKiBmb3IgdGhlIG5leHQgbWF0Y2gsIHBsdXMgTUlOX01BVENIIGJ5dGVzIHRvIGluc2VydCB0aGVcbiAgICAgKiBzdHJpbmcgZm9sbG93aW5nIHRoZSBuZXh0IG1hdGNoLlxuICAgICAqL1xuICAgIGlmIChzLmxvb2thaGVhZCA8IE1JTl9MT09LQUhFQUQpIHtcbiAgICAgIGZpbGxfd2luZG93KHMpO1xuICAgICAgaWYgKHMubG9va2FoZWFkIDwgTUlOX0xPT0tBSEVBRCAmJiBmbHVzaCA9PT0gU1RBVFVTLlpfTk9fRkxVU0gpIHtcbiAgICAgICAgcmV0dXJuIEJTX05FRURfTU9SRTtcbiAgICAgIH1cbiAgICAgIGlmIChzLmxvb2thaGVhZCA9PT0gMCkgYnJlYWs7IC8qIGZsdXNoIHRoZSBjdXJyZW50IGJsb2NrICovXG4gICAgfVxuXG4gICAgLyogSW5zZXJ0IHRoZSBzdHJpbmcgd2luZG93W3N0cnN0YXJ0IC4uIHN0cnN0YXJ0KzJdIGluIHRoZVxuICAgICAqIGRpY3Rpb25hcnksIGFuZCBzZXQgaGFzaF9oZWFkIHRvIHRoZSBoZWFkIG9mIHRoZSBoYXNoIGNoYWluOlxuICAgICAqL1xuICAgIGhhc2hfaGVhZCA9IDAgLypOSUwqLztcbiAgICBpZiAocy5sb29rYWhlYWQgPj0gTUlOX01BVENIKSB7XG4gICAgICAvKioqIElOU0VSVF9TVFJJTkcocywgcy5zdHJzdGFydCwgaGFzaF9oZWFkKTsgKioqL1xuICAgICAgcy5pbnNfaCA9XG4gICAgICAgICgocy5pbnNfaCA8PCBzLmhhc2hfc2hpZnQpIF4gcy53aW5kb3dbcy5zdHJzdGFydCArIE1JTl9NQVRDSCAtIDFdKSAmXG4gICAgICAgIHMuaGFzaF9tYXNrO1xuICAgICAgaGFzaF9oZWFkID0gcy5wcmV2W3Muc3Ryc3RhcnQgJiBzLndfbWFza10gPSBzLmhlYWRbcy5pbnNfaF07XG4gICAgICBzLmhlYWRbcy5pbnNfaF0gPSBzLnN0cnN0YXJ0O1xuICAgICAgLyoqKi9cbiAgICB9XG5cbiAgICAvKiBGaW5kIHRoZSBsb25nZXN0IG1hdGNoLCBkaXNjYXJkaW5nIHRob3NlIDw9IHByZXZfbGVuZ3RoLlxuICAgICAqL1xuICAgIHMucHJldl9sZW5ndGggPSBzLm1hdGNoX2xlbmd0aDtcbiAgICBzLnByZXZfbWF0Y2ggPSBzLm1hdGNoX3N0YXJ0O1xuICAgIHMubWF0Y2hfbGVuZ3RoID0gTUlOX01BVENIIC0gMTtcblxuICAgIGlmIChcbiAgICAgIGhhc2hfaGVhZCAhPT0gMCAvKk5JTCovICYmIHMucHJldl9sZW5ndGggPCBzLm1heF9sYXp5X21hdGNoICYmXG4gICAgICBzLnN0cnN0YXJ0IC0gaGFzaF9oZWFkIDw9IChzLndfc2l6ZSAtIE1JTl9MT09LQUhFQUQpIC8qTUFYX0RJU1QocykqL1xuICAgICkge1xuICAgICAgLyogVG8gc2ltcGxpZnkgdGhlIGNvZGUsIHdlIHByZXZlbnQgbWF0Y2hlcyB3aXRoIHRoZSBzdHJpbmdcbiAgICAgICAqIG9mIHdpbmRvdyBpbmRleCAwIChpbiBwYXJ0aWN1bGFyIHdlIGhhdmUgdG8gYXZvaWQgYSBtYXRjaFxuICAgICAgICogb2YgdGhlIHN0cmluZyB3aXRoIGl0c2VsZiBhdCB0aGUgc3RhcnQgb2YgdGhlIGlucHV0IGZpbGUpLlxuICAgICAgICovXG4gICAgICBzLm1hdGNoX2xlbmd0aCA9IGxvbmdlc3RfbWF0Y2gocywgaGFzaF9oZWFkKTtcbiAgICAgIC8qIGxvbmdlc3RfbWF0Y2goKSBzZXRzIG1hdGNoX3N0YXJ0ICovXG5cbiAgICAgIGlmIChcbiAgICAgICAgcy5tYXRjaF9sZW5ndGggPD0gNSAmJlxuICAgICAgICAocy5zdHJhdGVneSA9PT0gWl9GSUxURVJFRCB8fFxuICAgICAgICAgIChzLm1hdGNoX2xlbmd0aCA9PT0gTUlOX01BVENIICYmXG4gICAgICAgICAgICBzLnN0cnN0YXJ0IC0gcy5tYXRjaF9zdGFydCA+IDQwOTYgLypUT09fRkFSKi8pKVxuICAgICAgKSB7XG4gICAgICAgIC8qIElmIHByZXZfbWF0Y2ggaXMgYWxzbyBNSU5fTUFUQ0gsIG1hdGNoX3N0YXJ0IGlzIGdhcmJhZ2VcbiAgICAgICAgICogYnV0IHdlIHdpbGwgaWdub3JlIHRoZSBjdXJyZW50IG1hdGNoIGFueXdheS5cbiAgICAgICAgICovXG4gICAgICAgIHMubWF0Y2hfbGVuZ3RoID0gTUlOX01BVENIIC0gMTtcbiAgICAgIH1cbiAgICB9XG4gICAgLyogSWYgdGhlcmUgd2FzIGEgbWF0Y2ggYXQgdGhlIHByZXZpb3VzIHN0ZXAgYW5kIHRoZSBjdXJyZW50XG4gICAgICogbWF0Y2ggaXMgbm90IGJldHRlciwgb3V0cHV0IHRoZSBwcmV2aW91cyBtYXRjaDpcbiAgICAgKi9cbiAgICBpZiAocy5wcmV2X2xlbmd0aCA+PSBNSU5fTUFUQ0ggJiYgcy5tYXRjaF9sZW5ndGggPD0gcy5wcmV2X2xlbmd0aCkge1xuICAgICAgbWF4X2luc2VydCA9IHMuc3Ryc3RhcnQgKyBzLmxvb2thaGVhZCAtIE1JTl9NQVRDSDtcbiAgICAgIC8qIERvIG5vdCBpbnNlcnQgc3RyaW5ncyBpbiBoYXNoIHRhYmxlIGJleW9uZCB0aGlzLiAqL1xuXG4gICAgICAvL2NoZWNrX21hdGNoKHMsIHMuc3Ryc3RhcnQtMSwgcy5wcmV2X21hdGNoLCBzLnByZXZfbGVuZ3RoKTtcblxuICAgICAgLyoqKl90cl90YWxseV9kaXN0KHMsIHMuc3Ryc3RhcnQgLSAxIC0gcy5wcmV2X21hdGNoLFxuICAgICAgICAgICAgICAgICAgICAgcy5wcmV2X2xlbmd0aCAtIE1JTl9NQVRDSCwgYmZsdXNoKTsqKiovXG4gICAgICBiZmx1c2ggPSB0cmVlcy5fdHJfdGFsbHkoXG4gICAgICAgIHMsXG4gICAgICAgIHMuc3Ryc3RhcnQgLSAxIC0gcy5wcmV2X21hdGNoLFxuICAgICAgICBzLnByZXZfbGVuZ3RoIC0gTUlOX01BVENILFxuICAgICAgKTtcbiAgICAgIC8qIEluc2VydCBpbiBoYXNoIHRhYmxlIGFsbCBzdHJpbmdzIHVwIHRvIHRoZSBlbmQgb2YgdGhlIG1hdGNoLlxuICAgICAgICogc3Ryc3RhcnQtMSBhbmQgc3Ryc3RhcnQgYXJlIGFscmVhZHkgaW5zZXJ0ZWQuIElmIHRoZXJlIGlzIG5vdFxuICAgICAgICogZW5vdWdoIGxvb2thaGVhZCwgdGhlIGxhc3QgdHdvIHN0cmluZ3MgYXJlIG5vdCBpbnNlcnRlZCBpblxuICAgICAgICogdGhlIGhhc2ggdGFibGUuXG4gICAgICAgKi9cbiAgICAgIHMubG9va2FoZWFkIC09IHMucHJldl9sZW5ndGggLSAxO1xuICAgICAgcy5wcmV2X2xlbmd0aCAtPSAyO1xuICAgICAgZG8ge1xuICAgICAgICBpZiAoKytzLnN0cnN0YXJ0IDw9IG1heF9pbnNlcnQpIHtcbiAgICAgICAgICAvKioqIElOU0VSVF9TVFJJTkcocywgcy5zdHJzdGFydCwgaGFzaF9oZWFkKTsgKioqL1xuICAgICAgICAgIHMuaW5zX2ggPVxuICAgICAgICAgICAgKChzLmluc19oIDw8IHMuaGFzaF9zaGlmdCkgXiBzLndpbmRvd1tzLnN0cnN0YXJ0ICsgTUlOX01BVENIIC0gMV0pICZcbiAgICAgICAgICAgIHMuaGFzaF9tYXNrO1xuICAgICAgICAgIGhhc2hfaGVhZCA9IHMucHJldltzLnN0cnN0YXJ0ICYgcy53X21hc2tdID0gcy5oZWFkW3MuaW5zX2hdO1xuICAgICAgICAgIHMuaGVhZFtzLmluc19oXSA9IHMuc3Ryc3RhcnQ7XG4gICAgICAgICAgLyoqKi9cbiAgICAgICAgfVxuICAgICAgfSB3aGlsZSAoLS1zLnByZXZfbGVuZ3RoICE9PSAwKTtcbiAgICAgIHMubWF0Y2hfYXZhaWxhYmxlID0gMDtcbiAgICAgIHMubWF0Y2hfbGVuZ3RoID0gTUlOX01BVENIIC0gMTtcbiAgICAgIHMuc3Ryc3RhcnQrKztcblxuICAgICAgaWYgKGJmbHVzaCkge1xuICAgICAgICAvKioqIEZMVVNIX0JMT0NLKHMsIDApOyAqKiovXG4gICAgICAgIGZsdXNoX2Jsb2NrX29ubHkocywgZmFsc2UpO1xuICAgICAgICBpZiAocy5zdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgICAgIHJldHVybiBCU19ORUVEX01PUkU7XG4gICAgICAgIH1cbiAgICAgICAgLyoqKi9cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHMubWF0Y2hfYXZhaWxhYmxlKSB7XG4gICAgICAvKiBJZiB0aGVyZSB3YXMgbm8gbWF0Y2ggYXQgdGhlIHByZXZpb3VzIHBvc2l0aW9uLCBvdXRwdXQgYVxuICAgICAgICogc2luZ2xlIGxpdGVyYWwuIElmIHRoZXJlIHdhcyBhIG1hdGNoIGJ1dCB0aGUgY3VycmVudCBtYXRjaFxuICAgICAgICogaXMgbG9uZ2VyLCB0cnVuY2F0ZSB0aGUgcHJldmlvdXMgbWF0Y2ggdG8gYSBzaW5nbGUgbGl0ZXJhbC5cbiAgICAgICAqL1xuICAgICAgLy9UcmFjZXZ2KChzdGRlcnIsXCIlY1wiLCBzLT53aW5kb3dbcy0+c3Ryc3RhcnQtMV0pKTtcbiAgICAgIC8qKiogX3RyX3RhbGx5X2xpdChzLCBzLndpbmRvd1tzLnN0cnN0YXJ0LTFdLCBiZmx1c2gpOyAqKiovXG4gICAgICBiZmx1c2ggPSB0cmVlcy5fdHJfdGFsbHkocywgMCwgcy53aW5kb3dbcy5zdHJzdGFydCAtIDFdKTtcblxuICAgICAgaWYgKGJmbHVzaCkge1xuICAgICAgICAvKioqIEZMVVNIX0JMT0NLX09OTFkocywgMCkgKioqL1xuICAgICAgICBmbHVzaF9ibG9ja19vbmx5KHMsIGZhbHNlKTtcbiAgICAgICAgLyoqKi9cbiAgICAgIH1cbiAgICAgIHMuc3Ryc3RhcnQrKztcbiAgICAgIHMubG9va2FoZWFkLS07XG4gICAgICBpZiAocy5zdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gQlNfTkVFRF9NT1JFO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvKiBUaGVyZSBpcyBubyBwcmV2aW91cyBtYXRjaCB0byBjb21wYXJlIHdpdGgsIHdhaXQgZm9yXG4gICAgICAgKiB0aGUgbmV4dCBzdGVwIHRvIGRlY2lkZS5cbiAgICAgICAqL1xuICAgICAgcy5tYXRjaF9hdmFpbGFibGUgPSAxO1xuICAgICAgcy5zdHJzdGFydCsrO1xuICAgICAgcy5sb29rYWhlYWQtLTtcbiAgICB9XG4gIH1cbiAgLy9Bc3NlcnQgKGZsdXNoICE9IFpfTk9fRkxVU0gsIFwibm8gZmx1c2g/XCIpO1xuICBpZiAocy5tYXRjaF9hdmFpbGFibGUpIHtcbiAgICAvL1RyYWNldnYoKHN0ZGVycixcIiVjXCIsIHMtPndpbmRvd1tzLT5zdHJzdGFydC0xXSkpO1xuICAgIC8qKiogX3RyX3RhbGx5X2xpdChzLCBzLndpbmRvd1tzLnN0cnN0YXJ0LTFdLCBiZmx1c2gpOyAqKiovXG4gICAgYmZsdXNoID0gdHJlZXMuX3RyX3RhbGx5KHMsIDAsIHMud2luZG93W3Muc3Ryc3RhcnQgLSAxXSk7XG5cbiAgICBzLm1hdGNoX2F2YWlsYWJsZSA9IDA7XG4gIH1cbiAgcy5pbnNlcnQgPSBzLnN0cnN0YXJ0IDwgTUlOX01BVENIIC0gMSA/IHMuc3Ryc3RhcnQgOiBNSU5fTUFUQ0ggLSAxO1xuICBpZiAoZmx1c2ggPT09IFNUQVRVUy5aX0ZJTklTSCkge1xuICAgIC8qKiogRkxVU0hfQkxPQ0socywgMSk7ICoqKi9cbiAgICBmbHVzaF9ibG9ja19vbmx5KHMsIHRydWUpO1xuICAgIGlmIChzLnN0cm0uYXZhaWxfb3V0ID09PSAwKSB7XG4gICAgICByZXR1cm4gQlNfRklOSVNIX1NUQVJURUQ7XG4gICAgfVxuICAgIC8qKiovXG4gICAgcmV0dXJuIEJTX0ZJTklTSF9ET05FO1xuICB9XG4gIGlmIChzLmxhc3RfbGl0KSB7XG4gICAgLyoqKiBGTFVTSF9CTE9DSyhzLCAwKTsgKioqL1xuICAgIGZsdXNoX2Jsb2NrX29ubHkocywgZmFsc2UpO1xuICAgIGlmIChzLnN0cm0uYXZhaWxfb3V0ID09PSAwKSB7XG4gICAgICByZXR1cm4gQlNfTkVFRF9NT1JFO1xuICAgIH1cbiAgICAvKioqL1xuICB9XG5cbiAgcmV0dXJuIEJTX0JMT0NLX0RPTkU7XG59XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogRm9yIFpfUkxFLCBzaW1wbHkgbG9vayBmb3IgcnVucyBvZiBieXRlcywgZ2VuZXJhdGUgbWF0Y2hlcyBvbmx5IG9mIGRpc3RhbmNlXG4gKiBvbmUuICBEbyBub3QgbWFpbnRhaW4gYSBoYXNoIHRhYmxlLiAgKEl0IHdpbGwgYmUgcmVnZW5lcmF0ZWQgaWYgdGhpcyBydW4gb2ZcbiAqIGRlZmxhdGUgc3dpdGNoZXMgYXdheSBmcm9tIFpfUkxFLilcbiAqL1xuZnVuY3Rpb24gZGVmbGF0ZV9ybGUoczogYW55LCBmbHVzaDogYW55KSB7XG4gIGxldCBiZmx1c2g7IC8qIHNldCBpZiBjdXJyZW50IGJsb2NrIG11c3QgYmUgZmx1c2hlZCAqL1xuICBsZXQgcHJldjsgLyogYnl0ZSBhdCBkaXN0YW5jZSBvbmUgdG8gbWF0Y2ggKi9cbiAgbGV0IHNjYW4sIHN0cmVuZDsgLyogc2NhbiBnb2VzIHVwIHRvIHN0cmVuZCBmb3IgbGVuZ3RoIG9mIHJ1biAqL1xuXG4gIGxldCBfd2luID0gcy53aW5kb3c7XG5cbiAgZm9yICg7Oykge1xuICAgIC8qIE1ha2Ugc3VyZSB0aGF0IHdlIGFsd2F5cyBoYXZlIGVub3VnaCBsb29rYWhlYWQsIGV4Y2VwdFxuICAgICAqIGF0IHRoZSBlbmQgb2YgdGhlIGlucHV0IGZpbGUuIFdlIG5lZWQgTUFYX01BVENIIGJ5dGVzXG4gICAgICogZm9yIHRoZSBsb25nZXN0IHJ1biwgcGx1cyBvbmUgZm9yIHRoZSB1bnJvbGxlZCBsb29wLlxuICAgICAqL1xuICAgIGlmIChzLmxvb2thaGVhZCA8PSBNQVhfTUFUQ0gpIHtcbiAgICAgIGZpbGxfd2luZG93KHMpO1xuICAgICAgaWYgKHMubG9va2FoZWFkIDw9IE1BWF9NQVRDSCAmJiBmbHVzaCA9PT0gU1RBVFVTLlpfTk9fRkxVU0gpIHtcbiAgICAgICAgcmV0dXJuIEJTX05FRURfTU9SRTtcbiAgICAgIH1cbiAgICAgIGlmIChzLmxvb2thaGVhZCA9PT0gMCkgYnJlYWs7IC8qIGZsdXNoIHRoZSBjdXJyZW50IGJsb2NrICovXG4gICAgfVxuXG4gICAgLyogU2VlIGhvdyBtYW55IHRpbWVzIHRoZSBwcmV2aW91cyBieXRlIHJlcGVhdHMgKi9cbiAgICBzLm1hdGNoX2xlbmd0aCA9IDA7XG4gICAgaWYgKHMubG9va2FoZWFkID49IE1JTl9NQVRDSCAmJiBzLnN0cnN0YXJ0ID4gMCkge1xuICAgICAgc2NhbiA9IHMuc3Ryc3RhcnQgLSAxO1xuICAgICAgcHJldiA9IF93aW5bc2Nhbl07XG4gICAgICBpZiAoXG4gICAgICAgIHByZXYgPT09IF93aW5bKytzY2FuXSAmJiBwcmV2ID09PSBfd2luWysrc2Nhbl0gJiZcbiAgICAgICAgcHJldiA9PT0gX3dpblsrK3NjYW5dXG4gICAgICApIHtcbiAgICAgICAgc3RyZW5kID0gcy5zdHJzdGFydCArIE1BWF9NQVRDSDtcbiAgICAgICAgZG8ge1xuICAgICAgICAgIC8qanNoaW50IG5vZW1wdHk6ZmFsc2UqL1xuICAgICAgICB9IHdoaWxlIChcbiAgICAgICAgICBwcmV2ID09PSBfd2luWysrc2Nhbl0gJiYgcHJldiA9PT0gX3dpblsrK3NjYW5dICYmXG4gICAgICAgICAgcHJldiA9PT0gX3dpblsrK3NjYW5dICYmIHByZXYgPT09IF93aW5bKytzY2FuXSAmJlxuICAgICAgICAgIHByZXYgPT09IF93aW5bKytzY2FuXSAmJiBwcmV2ID09PSBfd2luWysrc2Nhbl0gJiZcbiAgICAgICAgICBwcmV2ID09PSBfd2luWysrc2Nhbl0gJiYgcHJldiA9PT0gX3dpblsrK3NjYW5dICYmXG4gICAgICAgICAgc2NhbiA8IHN0cmVuZFxuICAgICAgICApO1xuICAgICAgICBzLm1hdGNoX2xlbmd0aCA9IE1BWF9NQVRDSCAtIChzdHJlbmQgLSBzY2FuKTtcbiAgICAgICAgaWYgKHMubWF0Y2hfbGVuZ3RoID4gcy5sb29rYWhlYWQpIHtcbiAgICAgICAgICBzLm1hdGNoX2xlbmd0aCA9IHMubG9va2FoZWFkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvL0Fzc2VydChzY2FuIDw9IHMtPndpbmRvdysodUludCkocy0+d2luZG93X3NpemUtMSksIFwid2lsZCBzY2FuXCIpO1xuICAgIH1cblxuICAgIC8qIEVtaXQgbWF0Y2ggaWYgaGF2ZSBydW4gb2YgTUlOX01BVENIIG9yIGxvbmdlciwgZWxzZSBlbWl0IGxpdGVyYWwgKi9cbiAgICBpZiAocy5tYXRjaF9sZW5ndGggPj0gTUlOX01BVENIKSB7XG4gICAgICAvL2NoZWNrX21hdGNoKHMsIHMuc3Ryc3RhcnQsIHMuc3Ryc3RhcnQgLSAxLCBzLm1hdGNoX2xlbmd0aCk7XG5cbiAgICAgIC8qKiogX3RyX3RhbGx5X2Rpc3QocywgMSwgcy5tYXRjaF9sZW5ndGggLSBNSU5fTUFUQ0gsIGJmbHVzaCk7ICoqKi9cbiAgICAgIGJmbHVzaCA9IHRyZWVzLl90cl90YWxseShzLCAxLCBzLm1hdGNoX2xlbmd0aCAtIE1JTl9NQVRDSCk7XG5cbiAgICAgIHMubG9va2FoZWFkIC09IHMubWF0Y2hfbGVuZ3RoO1xuICAgICAgcy5zdHJzdGFydCArPSBzLm1hdGNoX2xlbmd0aDtcbiAgICAgIHMubWF0Y2hfbGVuZ3RoID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgLyogTm8gbWF0Y2gsIG91dHB1dCBhIGxpdGVyYWwgYnl0ZSAqL1xuICAgICAgLy9UcmFjZXZ2KChzdGRlcnIsXCIlY1wiLCBzLT53aW5kb3dbcy0+c3Ryc3RhcnRdKSk7XG4gICAgICAvKioqIF90cl90YWxseV9saXQocywgcy53aW5kb3dbcy5zdHJzdGFydF0sIGJmbHVzaCk7ICoqKi9cbiAgICAgIGJmbHVzaCA9IHRyZWVzLl90cl90YWxseShzLCAwLCBzLndpbmRvd1tzLnN0cnN0YXJ0XSk7XG5cbiAgICAgIHMubG9va2FoZWFkLS07XG4gICAgICBzLnN0cnN0YXJ0Kys7XG4gICAgfVxuICAgIGlmIChiZmx1c2gpIHtcbiAgICAgIC8qKiogRkxVU0hfQkxPQ0socywgMCk7ICoqKi9cbiAgICAgIGZsdXNoX2Jsb2NrX29ubHkocywgZmFsc2UpO1xuICAgICAgaWYgKHMuc3RybS5hdmFpbF9vdXQgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIEJTX05FRURfTU9SRTtcbiAgICAgIH1cbiAgICAgIC8qKiovXG4gICAgfVxuICB9XG4gIHMuaW5zZXJ0ID0gMDtcbiAgaWYgKGZsdXNoID09PSBTVEFUVVMuWl9GSU5JU0gpIHtcbiAgICAvKioqIEZMVVNIX0JMT0NLKHMsIDEpOyAqKiovXG4gICAgZmx1c2hfYmxvY2tfb25seShzLCB0cnVlKTtcbiAgICBpZiAocy5zdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgcmV0dXJuIEJTX0ZJTklTSF9TVEFSVEVEO1xuICAgIH1cbiAgICAvKioqL1xuICAgIHJldHVybiBCU19GSU5JU0hfRE9ORTtcbiAgfVxuICBpZiAocy5sYXN0X2xpdCkge1xuICAgIC8qKiogRkxVU0hfQkxPQ0socywgMCk7ICoqKi9cbiAgICBmbHVzaF9ibG9ja19vbmx5KHMsIGZhbHNlKTtcbiAgICBpZiAocy5zdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgcmV0dXJuIEJTX05FRURfTU9SRTtcbiAgICB9XG4gICAgLyoqKi9cbiAgfVxuICByZXR1cm4gQlNfQkxPQ0tfRE9ORTtcbn1cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBGb3IgWl9IVUZGTUFOX09OTFksIGRvIG5vdCBsb29rIGZvciBtYXRjaGVzLiAgRG8gbm90IG1haW50YWluIGEgaGFzaCB0YWJsZS5cbiAqIChJdCB3aWxsIGJlIHJlZ2VuZXJhdGVkIGlmIHRoaXMgcnVuIG9mIGRlZmxhdGUgc3dpdGNoZXMgYXdheSBmcm9tIEh1ZmZtYW4uKVxuICovXG5mdW5jdGlvbiBkZWZsYXRlX2h1ZmYoczogYW55LCBmbHVzaDogYW55KSB7XG4gIGxldCBiZmx1c2g7IC8qIHNldCBpZiBjdXJyZW50IGJsb2NrIG11c3QgYmUgZmx1c2hlZCAqL1xuXG4gIGZvciAoOzspIHtcbiAgICAvKiBNYWtlIHN1cmUgdGhhdCB3ZSBoYXZlIGEgbGl0ZXJhbCB0byB3cml0ZS4gKi9cbiAgICBpZiAocy5sb29rYWhlYWQgPT09IDApIHtcbiAgICAgIGZpbGxfd2luZG93KHMpO1xuICAgICAgaWYgKHMubG9va2FoZWFkID09PSAwKSB7XG4gICAgICAgIGlmIChmbHVzaCA9PT0gU1RBVFVTLlpfTk9fRkxVU0gpIHtcbiAgICAgICAgICByZXR1cm4gQlNfTkVFRF9NT1JFO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrOyAvKiBmbHVzaCB0aGUgY3VycmVudCBibG9jayAqL1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qIE91dHB1dCBhIGxpdGVyYWwgYnl0ZSAqL1xuICAgIHMubWF0Y2hfbGVuZ3RoID0gMDtcbiAgICAvL1RyYWNldnYoKHN0ZGVycixcIiVjXCIsIHMtPndpbmRvd1tzLT5zdHJzdGFydF0pKTtcbiAgICAvKioqIF90cl90YWxseV9saXQocywgcy53aW5kb3dbcy5zdHJzdGFydF0sIGJmbHVzaCk7ICoqKi9cbiAgICBiZmx1c2ggPSB0cmVlcy5fdHJfdGFsbHkocywgMCwgcy53aW5kb3dbcy5zdHJzdGFydF0pO1xuICAgIHMubG9va2FoZWFkLS07XG4gICAgcy5zdHJzdGFydCsrO1xuICAgIGlmIChiZmx1c2gpIHtcbiAgICAgIC8qKiogRkxVU0hfQkxPQ0socywgMCk7ICoqKi9cbiAgICAgIGZsdXNoX2Jsb2NrX29ubHkocywgZmFsc2UpO1xuICAgICAgaWYgKHMuc3RybS5hdmFpbF9vdXQgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIEJTX05FRURfTU9SRTtcbiAgICAgIH1cbiAgICAgIC8qKiovXG4gICAgfVxuICB9XG4gIHMuaW5zZXJ0ID0gMDtcbiAgaWYgKGZsdXNoID09PSBTVEFUVVMuWl9GSU5JU0gpIHtcbiAgICAvKioqIEZMVVNIX0JMT0NLKHMsIDEpOyAqKiovXG4gICAgZmx1c2hfYmxvY2tfb25seShzLCB0cnVlKTtcbiAgICBpZiAocy5zdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgcmV0dXJuIEJTX0ZJTklTSF9TVEFSVEVEO1xuICAgIH1cbiAgICAvKioqL1xuICAgIHJldHVybiBCU19GSU5JU0hfRE9ORTtcbiAgfVxuICBpZiAocy5sYXN0X2xpdCkge1xuICAgIC8qKiogRkxVU0hfQkxPQ0socywgMCk7ICoqKi9cbiAgICBmbHVzaF9ibG9ja19vbmx5KHMsIGZhbHNlKTtcbiAgICBpZiAocy5zdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgcmV0dXJuIEJTX05FRURfTU9SRTtcbiAgICB9XG4gICAgLyoqKi9cbiAgfVxuICByZXR1cm4gQlNfQkxPQ0tfRE9ORTtcbn1cblxuLyogVmFsdWVzIGZvciBtYXhfbGF6eV9tYXRjaCwgZ29vZF9tYXRjaCBhbmQgbWF4X2NoYWluX2xlbmd0aCwgZGVwZW5kaW5nIG9uXG4gKiB0aGUgZGVzaXJlZCBwYWNrIGxldmVsICgwLi45KS4gVGhlIHZhbHVlcyBnaXZlbiBiZWxvdyBoYXZlIGJlZW4gdHVuZWQgdG9cbiAqIGV4Y2x1ZGUgd29yc3QgY2FzZSBwZXJmb3JtYW5jZSBmb3IgcGF0aG9sb2dpY2FsIGZpbGVzLiBCZXR0ZXIgdmFsdWVzIG1heSBiZVxuICogZm91bmQgZm9yIHNwZWNpZmljIGZpbGVzLlxuICovXG5jbGFzcyBDb25maWcge1xuICBnb29kX2xlbmd0aDogYW55O1xuICBtYXhfbGF6eTogYW55O1xuICBuaWNlX2xlbmd0aDogYW55O1xuICBtYXhfY2hhaW46IGFueTtcbiAgZnVuYzogYW55O1xuICBjb25zdHJ1Y3RvcihcbiAgICBnb29kX2xlbmd0aDogYW55LFxuICAgIG1heF9sYXp5OiBhbnksXG4gICAgbmljZV9sZW5ndGg6IGFueSxcbiAgICBtYXhfY2hhaW46IGFueSxcbiAgICBmdW5jOiBhbnksXG4gICkge1xuICAgIHRoaXMuZ29vZF9sZW5ndGggPSBnb29kX2xlbmd0aDtcbiAgICB0aGlzLm1heF9sYXp5ID0gbWF4X2xhenk7XG4gICAgdGhpcy5uaWNlX2xlbmd0aCA9IG5pY2VfbGVuZ3RoO1xuICAgIHRoaXMubWF4X2NoYWluID0gbWF4X2NoYWluO1xuICAgIHRoaXMuZnVuYyA9IGZ1bmM7XG4gIH1cbn1cblxubGV0IGNvbmZpZ3VyYXRpb25fdGFibGU6IGFueTtcblxuY29uZmlndXJhdGlvbl90YWJsZSA9IFtcbiAgLyogICAgICBnb29kIGxhenkgbmljZSBjaGFpbiAqL1xuICBuZXcgQ29uZmlnKDAsIDAsIDAsIDAsIGRlZmxhdGVfc3RvcmVkKSwgLyogMCBzdG9yZSBvbmx5ICovXG4gIG5ldyBDb25maWcoNCwgNCwgOCwgNCwgZGVmbGF0ZV9mYXN0KSwgLyogMSBtYXggc3BlZWQsIG5vIGxhenkgbWF0Y2hlcyAqL1xuICBuZXcgQ29uZmlnKDQsIDUsIDE2LCA4LCBkZWZsYXRlX2Zhc3QpLCAvKiAyICovXG4gIG5ldyBDb25maWcoNCwgNiwgMzIsIDMyLCBkZWZsYXRlX2Zhc3QpLCAvKiAzICovXG5cbiAgbmV3IENvbmZpZyg0LCA0LCAxNiwgMTYsIGRlZmxhdGVfc2xvdyksIC8qIDQgbGF6eSBtYXRjaGVzICovXG4gIG5ldyBDb25maWcoOCwgMTYsIDMyLCAzMiwgZGVmbGF0ZV9zbG93KSwgLyogNSAqL1xuICBuZXcgQ29uZmlnKDgsIDE2LCAxMjgsIDEyOCwgZGVmbGF0ZV9zbG93KSwgLyogNiAqL1xuICBuZXcgQ29uZmlnKDgsIDMyLCAxMjgsIDI1NiwgZGVmbGF0ZV9zbG93KSwgLyogNyAqL1xuICBuZXcgQ29uZmlnKDMyLCAxMjgsIDI1OCwgMTAyNCwgZGVmbGF0ZV9zbG93KSwgLyogOCAqL1xuICBuZXcgQ29uZmlnKDMyLCAyNTgsIDI1OCwgNDA5NiwgZGVmbGF0ZV9zbG93KSwgLyogOSBtYXggY29tcHJlc3Npb24gKi9cbl07XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogSW5pdGlhbGl6ZSB0aGUgXCJsb25nZXN0IG1hdGNoXCIgcm91dGluZXMgZm9yIGEgbmV3IHpsaWIgc3RyZWFtXG4gKi9cbmZ1bmN0aW9uIGxtX2luaXQoczogYW55KSB7XG4gIHMud2luZG93X3NpemUgPSAyICogcy53X3NpemU7XG5cbiAgLyoqKiBDTEVBUl9IQVNIKHMpOyAqKiovXG4gIHplcm8ocy5oZWFkKTsgLy8gRmlsbCB3aXRoIE5JTCAoPSAwKTtcblxuICAvKiBTZXQgdGhlIGRlZmF1bHQgY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzOlxuICAgKi9cbiAgcy5tYXhfbGF6eV9tYXRjaCA9IGNvbmZpZ3VyYXRpb25fdGFibGVbcy5sZXZlbF0ubWF4X2xhenk7XG4gIHMuZ29vZF9tYXRjaCA9IGNvbmZpZ3VyYXRpb25fdGFibGVbcy5sZXZlbF0uZ29vZF9sZW5ndGg7XG4gIHMubmljZV9tYXRjaCA9IGNvbmZpZ3VyYXRpb25fdGFibGVbcy5sZXZlbF0ubmljZV9sZW5ndGg7XG4gIHMubWF4X2NoYWluX2xlbmd0aCA9IGNvbmZpZ3VyYXRpb25fdGFibGVbcy5sZXZlbF0ubWF4X2NoYWluO1xuXG4gIHMuc3Ryc3RhcnQgPSAwO1xuICBzLmJsb2NrX3N0YXJ0ID0gMDtcbiAgcy5sb29rYWhlYWQgPSAwO1xuICBzLmluc2VydCA9IDA7XG4gIHMubWF0Y2hfbGVuZ3RoID0gcy5wcmV2X2xlbmd0aCA9IE1JTl9NQVRDSCAtIDE7XG4gIHMubWF0Y2hfYXZhaWxhYmxlID0gMDtcbiAgcy5pbnNfaCA9IDA7XG59XG5cbmV4cG9ydCBjbGFzcyBEZWZsYXRlU3RhdGUge1xuICBzdHJtOiBaU3RyZWFtIHwgbnVsbCA9IG51bGw7IC8qIHBvaW50ZXIgYmFjayB0byB0aGlzIHpsaWIgc3RyZWFtICovXG4gIHN0YXR1cyA9IDA7IC8qIGFzIHRoZSBuYW1lIGltcGxpZXMgKi9cbiAgcGVuZGluZ19idWY6IGFueSA9IG51bGw7IC8qIG91dHB1dCBzdGlsbCBwZW5kaW5nICovXG4gIHBlbmRpbmdfYnVmX3NpemUgPSAwOyAvKiBzaXplIG9mIHBlbmRpbmdfYnVmICovXG4gIHBlbmRpbmdfb3V0ID0gMDsgLyogbmV4dCBwZW5kaW5nIGJ5dGUgdG8gb3V0cHV0IHRvIHRoZSBzdHJlYW0gKi9cbiAgcGVuZGluZyA9IDA7IC8qIG5iIG9mIGJ5dGVzIGluIHRoZSBwZW5kaW5nIGJ1ZmZlciAqL1xuICB3cmFwID0gMDsgLyogYml0IDAgdHJ1ZSBmb3IgemxpYiwgYml0IDEgdHJ1ZSBmb3IgZ3ppcCAqL1xuICBnemhlYWQ6IEhlYWRlciB8IG51bGwgPSBudWxsOyAvKiBnemlwIGhlYWRlciBpbmZvcm1hdGlvbiB0byB3cml0ZSAqL1xuICBnemluZGV4ID0gMDsgLyogd2hlcmUgaW4gZXh0cmEsIG5hbWUsIG9yIGNvbW1lbnQgKi9cbiAgbWV0aG9kID0gWl9ERUZMQVRFRDsgLyogY2FuIG9ubHkgYmUgREVGTEFURUQgKi9cbiAgbGFzdF9mbHVzaCA9IC0xOyAvKiB2YWx1ZSBvZiBmbHVzaCBwYXJhbSBmb3IgcHJldmlvdXMgZGVmbGF0ZSBjYWxsICovXG5cbiAgd19zaXplID0gMDsgLyogTFo3NyB3aW5kb3cgc2l6ZSAoMzJLIGJ5IGRlZmF1bHQpICovXG4gIHdfYml0cyA9IDA7IC8qIGxvZzIod19zaXplKSAgKDguLjE2KSAqL1xuICB3X21hc2sgPSAwOyAvKiB3X3NpemUgLSAxICovXG5cbiAgd2luZG93OiBhbnkgPSBudWxsO1xuICAvKiBTbGlkaW5nIHdpbmRvdy4gSW5wdXQgYnl0ZXMgYXJlIHJlYWQgaW50byB0aGUgc2Vjb25kIGhhbGYgb2YgdGhlIHdpbmRvdyxcbiAgICogYW5kIG1vdmUgdG8gdGhlIGZpcnN0IGhhbGYgbGF0ZXIgdG8ga2VlcCBhIGRpY3Rpb25hcnkgb2YgYXQgbGVhc3Qgd1NpemVcbiAgICogYnl0ZXMuIFdpdGggdGhpcyBvcmdhbml6YXRpb24sIG1hdGNoZXMgYXJlIGxpbWl0ZWQgdG8gYSBkaXN0YW5jZSBvZlxuICAgKiB3U2l6ZS1NQVhfTUFUQ0ggYnl0ZXMsIGJ1dCB0aGlzIGVuc3VyZXMgdGhhdCBJTyBpcyBhbHdheXNcbiAgICogcGVyZm9ybWVkIHdpdGggYSBsZW5ndGggbXVsdGlwbGUgb2YgdGhlIGJsb2NrIHNpemUuXG4gICAqL1xuXG4gIHdpbmRvd19zaXplID0gMDtcbiAgLyogQWN0dWFsIHNpemUgb2Ygd2luZG93OiAyKndTaXplLCBleGNlcHQgd2hlbiB0aGUgdXNlciBpbnB1dCBidWZmZXJcbiAgICogaXMgZGlyZWN0bHkgdXNlZCBhcyBzbGlkaW5nIHdpbmRvdy5cbiAgICovXG5cbiAgcHJldjogYW55ID0gbnVsbDtcbiAgLyogTGluayB0byBvbGRlciBzdHJpbmcgd2l0aCBzYW1lIGhhc2ggaW5kZXguIFRvIGxpbWl0IHRoZSBzaXplIG9mIHRoaXNcbiAgICogYXJyYXkgdG8gNjRLLCB0aGlzIGxpbmsgaXMgbWFpbnRhaW5lZCBvbmx5IGZvciB0aGUgbGFzdCAzMksgc3RyaW5ncy5cbiAgICogQW4gaW5kZXggaW4gdGhpcyBhcnJheSBpcyB0aHVzIGEgd2luZG93IGluZGV4IG1vZHVsbyAzMksuXG4gICAqL1xuXG4gIGhlYWQ6IGFueSA9IG51bGw7IC8qIEhlYWRzIG9mIHRoZSBoYXNoIGNoYWlucyBvciBOSUwuICovXG5cbiAgaW5zX2ggPSAwOyAvKiBoYXNoIGluZGV4IG9mIHN0cmluZyB0byBiZSBpbnNlcnRlZCAqL1xuICBoYXNoX3NpemUgPSAwOyAvKiBudW1iZXIgb2YgZWxlbWVudHMgaW4gaGFzaCB0YWJsZSAqL1xuICBoYXNoX2JpdHMgPSAwOyAvKiBsb2cyKGhhc2hfc2l6ZSkgKi9cbiAgaGFzaF9tYXNrID0gMDsgLyogaGFzaF9zaXplLTEgKi9cblxuICBoYXNoX3NoaWZ0ID0gMDtcbiAgLyogTnVtYmVyIG9mIGJpdHMgYnkgd2hpY2ggaW5zX2ggbXVzdCBiZSBzaGlmdGVkIGF0IGVhY2ggaW5wdXRcbiAgICogc3RlcC4gSXQgbXVzdCBiZSBzdWNoIHRoYXQgYWZ0ZXIgTUlOX01BVENIIHN0ZXBzLCB0aGUgb2xkZXN0XG4gICAqIGJ5dGUgbm8gbG9uZ2VyIHRha2VzIHBhcnQgaW4gdGhlIGhhc2gga2V5LCB0aGF0IGlzOlxuICAgKiAgIGhhc2hfc2hpZnQgKiBNSU5fTUFUQ0ggPj0gaGFzaF9iaXRzXG4gICAqL1xuXG4gIGJsb2NrX3N0YXJ0ID0gMDtcbiAgLyogV2luZG93IHBvc2l0aW9uIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGN1cnJlbnQgb3V0cHV0IGJsb2NrLiBHZXRzXG4gICAqIG5lZ2F0aXZlIHdoZW4gdGhlIHdpbmRvdyBpcyBtb3ZlZCBiYWNrd2FyZHMuXG4gICAqL1xuXG4gIG1hdGNoX2xlbmd0aCA9IDA7IC8qIGxlbmd0aCBvZiBiZXN0IG1hdGNoICovXG4gIHByZXZfbWF0Y2ggPSAwOyAvKiBwcmV2aW91cyBtYXRjaCAqL1xuICBtYXRjaF9hdmFpbGFibGUgPSAwOyAvKiBzZXQgaWYgcHJldmlvdXMgbWF0Y2ggZXhpc3RzICovXG4gIHN0cnN0YXJ0ID0gMDsgLyogc3RhcnQgb2Ygc3RyaW5nIHRvIGluc2VydCAqL1xuICBtYXRjaF9zdGFydCA9IDA7IC8qIHN0YXJ0IG9mIG1hdGNoaW5nIHN0cmluZyAqL1xuICBsb29rYWhlYWQgPSAwOyAvKiBudW1iZXIgb2YgdmFsaWQgYnl0ZXMgYWhlYWQgaW4gd2luZG93ICovXG5cbiAgcHJldl9sZW5ndGggPSAwO1xuICAvKiBMZW5ndGggb2YgdGhlIGJlc3QgbWF0Y2ggYXQgcHJldmlvdXMgc3RlcC4gTWF0Y2hlcyBub3QgZ3JlYXRlciB0aGFuIHRoaXNcbiAgICogYXJlIGRpc2NhcmRlZC4gVGhpcyBpcyB1c2VkIGluIHRoZSBsYXp5IG1hdGNoIGV2YWx1YXRpb24uXG4gICAqL1xuXG4gIG1heF9jaGFpbl9sZW5ndGggPSAwO1xuICAvKiBUbyBzcGVlZCB1cCBkZWZsYXRpb24sIGhhc2ggY2hhaW5zIGFyZSBuZXZlciBzZWFyY2hlZCBiZXlvbmQgdGhpc1xuICAgKiBsZW5ndGguICBBIGhpZ2hlciBsaW1pdCBpbXByb3ZlcyBjb21wcmVzc2lvbiByYXRpbyBidXQgZGVncmFkZXMgdGhlXG4gICAqIHNwZWVkLlxuICAgKi9cblxuICBtYXhfbGF6eV9tYXRjaCA9IDA7XG4gIC8qIEF0dGVtcHQgdG8gZmluZCBhIGJldHRlciBtYXRjaCBvbmx5IHdoZW4gdGhlIGN1cnJlbnQgbWF0Y2ggaXMgc3RyaWN0bHlcbiAgICogc21hbGxlciB0aGFuIHRoaXMgdmFsdWUuIFRoaXMgbWVjaGFuaXNtIGlzIHVzZWQgb25seSBmb3IgY29tcHJlc3Npb25cbiAgICogbGV2ZWxzID49IDQuXG4gICAqL1xuICAvLyBUaGF0J3MgYWxpYXMgdG8gbWF4X2xhenlfbWF0Y2gsIGRvbid0IHVzZSBkaXJlY3RseVxuICAvL3RoaXMubWF4X2luc2VydF9sZW5ndGggPSAwO1xuICAvKiBJbnNlcnQgbmV3IHN0cmluZ3MgaW4gdGhlIGhhc2ggdGFibGUgb25seSBpZiB0aGUgbWF0Y2ggbGVuZ3RoIGlzIG5vdFxuICAgKiBncmVhdGVyIHRoYW4gdGhpcyBsZW5ndGguIFRoaXMgc2F2ZXMgdGltZSBidXQgZGVncmFkZXMgY29tcHJlc3Npb24uXG4gICAqIG1heF9pbnNlcnRfbGVuZ3RoIGlzIHVzZWQgb25seSBmb3IgY29tcHJlc3Npb24gbGV2ZWxzIDw9IDMuXG4gICAqL1xuXG4gIGxldmVsID0gMDsgLyogY29tcHJlc3Npb24gbGV2ZWwgKDEuLjkpICovXG4gIHN0cmF0ZWd5ID0gMDsgLyogZmF2b3Igb3IgZm9yY2UgSHVmZm1hbiBjb2RpbmcqL1xuXG4gIGdvb2RfbWF0Y2ggPSAwO1xuICAvKiBVc2UgYSBmYXN0ZXIgc2VhcmNoIHdoZW4gdGhlIHByZXZpb3VzIG1hdGNoIGlzIGxvbmdlciB0aGFuIHRoaXMgKi9cblxuICBuaWNlX21hdGNoID0gMDsgLyogU3RvcCBzZWFyY2hpbmcgd2hlbiBjdXJyZW50IG1hdGNoIGV4Y2VlZHMgdGhpcyAqL1xuXG4gIC8qIHVzZWQgYnkgdHJlZXMuYzogKi9cblxuICAvKiBEaWRuJ3QgdXNlIGN0X2RhdGEgdHlwZWRlZiBiZWxvdyB0byBzdXBwcmVzcyBjb21waWxlciB3YXJuaW5nICovXG5cbiAgLy8gc3RydWN0IGN0X2RhdGFfcyBkeW5fbHRyZWVbSEVBUF9TSVpFXTsgICAvKiBsaXRlcmFsIGFuZCBsZW5ndGggdHJlZSAqL1xuICAvLyBzdHJ1Y3QgY3RfZGF0YV9zIGR5bl9kdHJlZVsyKkRfQ09ERVMrMV07IC8qIGRpc3RhbmNlIHRyZWUgKi9cbiAgLy8gc3RydWN0IGN0X2RhdGFfcyBibF90cmVlWzIqQkxfQ09ERVMrMV07ICAvKiBIdWZmbWFuIHRyZWUgZm9yIGJpdCBsZW5ndGhzICovXG5cbiAgLy8gVXNlIGZsYXQgYXJyYXkgb2YgRE9VQkxFIHNpemUsIHdpdGggaW50ZXJsZWF2ZWQgZmF0YSxcbiAgLy8gYmVjYXVzZSBKUyBkb2VzIG5vdCBzdXBwb3J0IGVmZmVjdGl2ZVxuICBkeW5fbHRyZWUgPSBuZXcgVWludDE2QXJyYXkoSEVBUF9TSVpFICogMik7XG4gIGR5bl9kdHJlZSA9IG5ldyBVaW50MTZBcnJheSgoMiAqIERfQ09ERVMgKyAxKSAqIDIpO1xuICBibF90cmVlID0gbmV3IFVpbnQxNkFycmF5KCgyICogQkxfQ09ERVMgKyAxKSAqIDIpO1xuXG4gIGxfZGVzYyA9IG51bGw7IC8qIGRlc2MuIGZvciBsaXRlcmFsIHRyZWUgKi9cbiAgZF9kZXNjID0gbnVsbDsgLyogZGVzYy4gZm9yIGRpc3RhbmNlIHRyZWUgKi9cbiAgYmxfZGVzYyA9IG51bGw7IC8qIGRlc2MuIGZvciBiaXQgbGVuZ3RoIHRyZWUgKi9cblxuICAvL3VzaCBibF9jb3VudFtNQVhfQklUUysxXTtcbiAgYmxfY291bnQgPSBuZXcgVWludDE2QXJyYXkoTUFYX0JJVFMgKyAxKTtcbiAgLyogbnVtYmVyIG9mIGNvZGVzIGF0IGVhY2ggYml0IGxlbmd0aCBmb3IgYW4gb3B0aW1hbCB0cmVlICovXG5cbiAgLy9pbnQgaGVhcFsyKkxfQ09ERVMrMV07ICAgICAgLyogaGVhcCB1c2VkIHRvIGJ1aWxkIHRoZSBIdWZmbWFuIHRyZWVzICovXG4gIGhlYXAgPSBuZXcgVWludDE2QXJyYXkoXG4gICAgMiAqIExfQ09ERVMgKyAxLFxuICApOyAvKiBoZWFwIHVzZWQgdG8gYnVpbGQgdGhlIEh1ZmZtYW4gdHJlZXMgKi9cblxuICBoZWFwX2xlbiA9IDA7IC8qIG51bWJlciBvZiBlbGVtZW50cyBpbiB0aGUgaGVhcCAqL1xuICBoZWFwX21heCA9IDA7IC8qIGVsZW1lbnQgb2YgbGFyZ2VzdCBmcmVxdWVuY3kgKi9cbiAgLyogVGhlIHNvbnMgb2YgaGVhcFtuXSBhcmUgaGVhcFsyKm5dIGFuZCBoZWFwWzIqbisxXS4gaGVhcFswXSBpcyBub3QgdXNlZC5cbiAgICogVGhlIHNhbWUgaGVhcCBhcnJheSBpcyB1c2VkIHRvIGJ1aWxkIGFsbCB0cmVlcy5cbiAgICovXG5cbiAgZGVwdGggPSBuZXcgVWludDE2QXJyYXkoMiAqIExfQ09ERVMgKyAxKTsgLy91Y2ggZGVwdGhbMipMX0NPREVTKzFdO1xuXG4gIC8qIERlcHRoIG9mIGVhY2ggc3VidHJlZSB1c2VkIGFzIHRpZSBicmVha2VyIGZvciB0cmVlcyBvZiBlcXVhbCBmcmVxdWVuY3lcbiAgICovXG5cbiAgbF9idWYgPSAwOyAvKiBidWZmZXIgaW5kZXggZm9yIGxpdGVyYWxzIG9yIGxlbmd0aHMgKi9cblxuICBsaXRfYnVmc2l6ZSA9IDA7XG4gIC8qIFNpemUgb2YgbWF0Y2ggYnVmZmVyIGZvciBsaXRlcmFscy9sZW5ndGhzLiAgVGhlcmUgYXJlIDQgcmVhc29ucyBmb3JcbiAgICogbGltaXRpbmcgbGl0X2J1ZnNpemUgdG8gNjRLOlxuICAgKiAgIC0gZnJlcXVlbmNpZXMgY2FuIGJlIGtlcHQgaW4gMTYgYml0IGNvdW50ZXJzXG4gICAqICAgLSBpZiBjb21wcmVzc2lvbiBpcyBub3Qgc3VjY2Vzc2Z1bCBmb3IgdGhlIGZpcnN0IGJsb2NrLCBhbGwgaW5wdXRcbiAgICogICAgIGRhdGEgaXMgc3RpbGwgaW4gdGhlIHdpbmRvdyBzbyB3ZSBjYW4gc3RpbGwgZW1pdCBhIHN0b3JlZCBibG9jayBldmVuXG4gICAqICAgICB3aGVuIGlucHV0IGNvbWVzIGZyb20gc3RhbmRhcmQgaW5wdXQuICAoVGhpcyBjYW4gYWxzbyBiZSBkb25lIGZvclxuICAgKiAgICAgYWxsIGJsb2NrcyBpZiBsaXRfYnVmc2l6ZSBpcyBub3QgZ3JlYXRlciB0aGFuIDMySy4pXG4gICAqICAgLSBpZiBjb21wcmVzc2lvbiBpcyBub3Qgc3VjY2Vzc2Z1bCBmb3IgYSBmaWxlIHNtYWxsZXIgdGhhbiA2NEssIHdlIGNhblxuICAgKiAgICAgZXZlbiBlbWl0IGEgc3RvcmVkIGZpbGUgaW5zdGVhZCBvZiBhIHN0b3JlZCBibG9jayAoc2F2aW5nIDUgYnl0ZXMpLlxuICAgKiAgICAgVGhpcyBpcyBhcHBsaWNhYmxlIG9ubHkgZm9yIHppcCAobm90IGd6aXAgb3IgemxpYikuXG4gICAqICAgLSBjcmVhdGluZyBuZXcgSHVmZm1hbiB0cmVlcyBsZXNzIGZyZXF1ZW50bHkgbWF5IG5vdCBwcm92aWRlIGZhc3RcbiAgICogICAgIGFkYXB0YXRpb24gdG8gY2hhbmdlcyBpbiB0aGUgaW5wdXQgZGF0YSBzdGF0aXN0aWNzLiAoVGFrZSBmb3JcbiAgICogICAgIGV4YW1wbGUgYSBiaW5hcnkgZmlsZSB3aXRoIHBvb3JseSBjb21wcmVzc2libGUgY29kZSBmb2xsb3dlZCBieVxuICAgKiAgICAgYSBoaWdobHkgY29tcHJlc3NpYmxlIHN0cmluZyB0YWJsZS4pIFNtYWxsZXIgYnVmZmVyIHNpemVzIGdpdmVcbiAgICogICAgIGZhc3QgYWRhcHRhdGlvbiBidXQgaGF2ZSBvZiBjb3Vyc2UgdGhlIG92ZXJoZWFkIG9mIHRyYW5zbWl0dGluZ1xuICAgKiAgICAgdHJlZXMgbW9yZSBmcmVxdWVudGx5LlxuICAgKiAgIC0gSSBjYW4ndCBjb3VudCBhYm92ZSA0XG4gICAqL1xuXG4gIGxhc3RfbGl0ID0gMDsgLyogcnVubmluZyBpbmRleCBpbiBsX2J1ZiAqL1xuXG4gIGRfYnVmID0gMDtcbiAgLyogQnVmZmVyIGluZGV4IGZvciBkaXN0YW5jZXMuIFRvIHNpbXBsaWZ5IHRoZSBjb2RlLCBkX2J1ZiBhbmQgbF9idWYgaGF2ZVxuICAgKiB0aGUgc2FtZSBudW1iZXIgb2YgZWxlbWVudHMuIFRvIHVzZSBkaWZmZXJlbnQgbGVuZ3RocywgYW4gZXh0cmEgZmxhZ1xuICAgKiBhcnJheSB3b3VsZCBiZSBuZWNlc3NhcnkuXG4gICAqL1xuXG4gIG9wdF9sZW4gPSAwOyAvKiBiaXQgbGVuZ3RoIG9mIGN1cnJlbnQgYmxvY2sgd2l0aCBvcHRpbWFsIHRyZWVzICovXG4gIHN0YXRpY19sZW4gPSAwOyAvKiBiaXQgbGVuZ3RoIG9mIGN1cnJlbnQgYmxvY2sgd2l0aCBzdGF0aWMgdHJlZXMgKi9cbiAgbWF0Y2hlcyA9IDA7IC8qIG51bWJlciBvZiBzdHJpbmcgbWF0Y2hlcyBpbiBjdXJyZW50IGJsb2NrICovXG4gIGluc2VydCA9IDA7IC8qIGJ5dGVzIGF0IGVuZCBvZiB3aW5kb3cgbGVmdCB0byBpbnNlcnQgKi9cblxuICBiaV9idWYgPSAwO1xuICAvKiBPdXRwdXQgYnVmZmVyLiBiaXRzIGFyZSBpbnNlcnRlZCBzdGFydGluZyBhdCB0aGUgYm90dG9tIChsZWFzdFxuICAgKiBzaWduaWZpY2FudCBiaXRzKS5cbiAgICovXG4gIGJpX3ZhbGlkID0gMDtcbiAgLyogTnVtYmVyIG9mIHZhbGlkIGJpdHMgaW4gYmlfYnVmLiAgQWxsIGJpdHMgYWJvdmUgdGhlIGxhc3QgdmFsaWQgYml0XG4gICAqIGFyZSBhbHdheXMgemVyby5cbiAgICovXG5cbiAgLy8gVXNlZCBmb3Igd2luZG93IG1lbW9yeSBpbml0LiBXZSBzYWZlbHkgaWdub3JlIGl0IGZvciBKUy4gVGhhdCBtYWtlc1xuICAvLyBzZW5zZSBvbmx5IGZvciBwb2ludGVycyBhbmQgbWVtb3J5IGNoZWNrIHRvb2xzLlxuICAvL3RoaXMuaGlnaF93YXRlciA9IDA7XG4gIC8qIEhpZ2ggd2F0ZXIgbWFyayBvZmZzZXQgaW4gd2luZG93IGZvciBpbml0aWFsaXplZCBieXRlcyAtLSBieXRlcyBhYm92ZVxuICAgKiB0aGlzIGFyZSBzZXQgdG8gemVybyBpbiBvcmRlciB0byBhdm9pZCBtZW1vcnkgY2hlY2sgd2FybmluZ3Mgd2hlblxuICAgKiBsb25nZXN0IG1hdGNoIHJvdXRpbmVzIGFjY2VzcyBieXRlcyBwYXN0IHRoZSBpbnB1dC4gIFRoaXMgaXMgdGhlblxuICAgKiB1cGRhdGVkIHRvIHRoZSBuZXcgaGlnaCB3YXRlciBtYXJrLlxuICAgKi9cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgemVybyh0aGlzLmR5bl9sdHJlZSk7XG4gICAgemVybyh0aGlzLmR5bl9kdHJlZSk7XG4gICAgemVybyh0aGlzLmJsX3RyZWUpO1xuICAgIHplcm8odGhpcy5oZWFwKTtcbiAgICB6ZXJvKHRoaXMuZGVwdGgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRlZmxhdGVSZXNldEtlZXAoc3RybTogWlN0cmVhbSkge1xuICBsZXQgcztcblxuICBpZiAoIXN0cm0gfHwgIXN0cm0uc3RhdGUpIHtcbiAgICByZXR1cm4gZXJyKHN0cm0sIFNUQVRVUy5aX1NUUkVBTV9FUlJPUi50b1N0cmluZygpIGFzIENPREUpO1xuICB9XG5cbiAgc3RybS50b3RhbF9pbiA9IHN0cm0udG90YWxfb3V0ID0gMDtcbiAgc3RybS5kYXRhX3R5cGUgPSBaX1VOS05PV047XG5cbiAgcyA9IHN0cm0uc3RhdGU7XG4gIHMucGVuZGluZyA9IDA7XG4gIHMucGVuZGluZ19vdXQgPSAwO1xuXG4gIGlmIChzLndyYXAgPCAwKSB7XG4gICAgcy53cmFwID0gLXMud3JhcDtcbiAgICAvKiB3YXMgbWFkZSBuZWdhdGl2ZSBieSBkZWZsYXRlKC4uLiwgWl9GSU5JU0gpOyAqL1xuICB9XG4gIHMuc3RhdHVzID0gKHMud3JhcCA/IElOSVRfU1RBVEUgOiBCVVNZX1NUQVRFKTtcbiAgc3RybS5hZGxlciA9IChzLndyYXAgPT09IDIpXG4gICAgPyAwIC8vIGNyYzMyKDAsIFpfTlVMTCwgMClcbiAgICA6IDE7IC8vIGFkbGVyMzIoMCwgWl9OVUxMLCAwKVxuICBzLmxhc3RfZmx1c2ggPSBTVEFUVVMuWl9OT19GTFVTSDtcbiAgdHJlZXMuX3RyX2luaXQocyk7XG4gIHJldHVybiBaX09LO1xufVxuXG5mdW5jdGlvbiBkZWZsYXRlUmVzZXQoc3RybTogWlN0cmVhbSkge1xuICBsZXQgcmV0ID0gZGVmbGF0ZVJlc2V0S2VlcChzdHJtKTtcbiAgaWYgKHJldCA9PT0gWl9PSykge1xuICAgIGxtX2luaXQoc3RybS5zdGF0ZSk7XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlZmxhdGVTZXRIZWFkZXIoc3RybTogWlN0cmVhbSwgaGVhZDogSGVhZGVyKSB7XG4gIGlmICghc3RybSB8fCAhc3RybS5zdGF0ZSkgcmV0dXJuIFpfU1RSRUFNX0VSUk9SO1xuICBpZiAoc3RybS5zdGF0ZS53cmFwICE9PSAyKSByZXR1cm4gWl9TVFJFQU1fRVJST1I7XG4gIHN0cm0uc3RhdGUuZ3poZWFkID0gaGVhZDtcbiAgcmV0dXJuIFpfT0s7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWZsYXRlSW5pdDIoXG4gIHN0cm06IFpTdHJlYW0sXG4gIGxldmVsOiBudW1iZXIsXG4gIG1ldGhvZDogbnVtYmVyLFxuICB3aW5kb3dCaXRzOiBudW1iZXIsXG4gIG1lbUxldmVsOiBudW1iZXIsXG4gIHN0cmF0ZWd5OiBudW1iZXIsXG4pOiBDT0RFIHtcbiAgaWYgKCFzdHJtKSB7IC8vID09PSBaX05VTExcbiAgICByZXR1cm4gU1RBVFVTLlpfU1RSRUFNX0VSUk9SIGFzIENPREU7XG4gIH1cbiAgbGV0IHdyYXAgPSAxO1xuXG4gIGlmIChsZXZlbCA9PT0gWl9ERUZBVUxUX0NPTVBSRVNTSU9OKSB7XG4gICAgbGV2ZWwgPSA2O1xuICB9XG5cbiAgaWYgKHdpbmRvd0JpdHMgPCAwKSB7XG4gICAgLyogc3VwcHJlc3MgemxpYiB3cmFwcGVyICovXG4gICAgd3JhcCA9IDA7XG4gICAgd2luZG93Qml0cyA9IC13aW5kb3dCaXRzO1xuICB9IGVsc2UgaWYgKHdpbmRvd0JpdHMgPiAxNSkge1xuICAgIHdyYXAgPSAyOyAvKiB3cml0ZSBnemlwIHdyYXBwZXIgaW5zdGVhZCAqL1xuICAgIHdpbmRvd0JpdHMgLT0gMTY7XG4gIH1cblxuICBpZiAoXG4gICAgbWVtTGV2ZWwgPCAxIHx8IG1lbUxldmVsID4gTUFYX01FTV9MRVZFTCB8fCBtZXRob2QgIT09IFpfREVGTEFURUQgfHxcbiAgICB3aW5kb3dCaXRzIDwgOCB8fCB3aW5kb3dCaXRzID4gMTUgfHwgbGV2ZWwgPCAwIHx8IGxldmVsID4gOSB8fFxuICAgIHN0cmF0ZWd5IDwgMCB8fCBzdHJhdGVneSA+IFpfRklYRURcbiAgKSB7XG4gICAgcmV0dXJuIGVycihzdHJtLCBTVEFUVVMuWl9TVFJFQU1fRVJST1IudG9TdHJpbmcoKSBhcyBDT0RFKTtcbiAgfVxuXG4gIGlmICh3aW5kb3dCaXRzID09PSA4KSB7XG4gICAgd2luZG93Qml0cyA9IDk7XG4gIH1cbiAgLyogdW50aWwgMjU2LWJ5dGUgd2luZG93IGJ1ZyBmaXhlZCAqL1xuXG4gIGxldCBzID0gbmV3IERlZmxhdGVTdGF0ZSgpO1xuXG4gIHN0cm0uc3RhdGUgPSBzO1xuICBzLnN0cm0gPSBzdHJtO1xuXG4gIHMud3JhcCA9IHdyYXA7XG4gIHMuZ3poZWFkID0gbnVsbDtcbiAgcy53X2JpdHMgPSB3aW5kb3dCaXRzO1xuICBzLndfc2l6ZSA9IDEgPDwgcy53X2JpdHM7XG4gIHMud19tYXNrID0gcy53X3NpemUgLSAxO1xuXG4gIHMuaGFzaF9iaXRzID0gbWVtTGV2ZWwgKyA3O1xuICBzLmhhc2hfc2l6ZSA9IDEgPDwgcy5oYXNoX2JpdHM7XG4gIHMuaGFzaF9tYXNrID0gcy5oYXNoX3NpemUgLSAxO1xuICBzLmhhc2hfc2hpZnQgPSB+figocy5oYXNoX2JpdHMgKyBNSU5fTUFUQ0ggLSAxKSAvIE1JTl9NQVRDSCk7XG5cbiAgcy53aW5kb3cgPSBuZXcgVWludDhBcnJheShzLndfc2l6ZSAqIDIpO1xuICBzLmhlYWQgPSBuZXcgVWludDE2QXJyYXkocy5oYXNoX3NpemUpO1xuICBzLnByZXYgPSBuZXcgVWludDE2QXJyYXkocy53X3NpemUpO1xuXG4gIC8vIERvbid0IG5lZWQgbWVtIGluaXQgbWFnaWMgZm9yIEpTLlxuICAvL3MuaGlnaF93YXRlciA9IDA7ICAvKiBub3RoaW5nIHdyaXR0ZW4gdG8gcy0+d2luZG93IHlldCAqL1xuXG4gIHMubGl0X2J1ZnNpemUgPSAxIDw8IChtZW1MZXZlbCArIDYpOyAvKiAxNksgZWxlbWVudHMgYnkgZGVmYXVsdCAqL1xuXG4gIHMucGVuZGluZ19idWZfc2l6ZSA9IHMubGl0X2J1ZnNpemUgKiA0O1xuXG4gIC8vb3ZlcmxheSA9ICh1c2hmICopIFpBTExPQyhzdHJtLCBzLT5saXRfYnVmc2l6ZSwgc2l6ZW9mKHVzaCkrMik7XG4gIC8vcy0+cGVuZGluZ19idWYgPSAodWNoZiAqKSBvdmVybGF5O1xuICBzLnBlbmRpbmdfYnVmID0gbmV3IFVpbnQ4QXJyYXkocy5wZW5kaW5nX2J1Zl9zaXplKTtcblxuICAvLyBJdCBpcyBvZmZzZXQgZnJvbSBgcy5wZW5kaW5nX2J1ZmAgKHNpemUgaXMgYHMubGl0X2J1ZnNpemUgKiAyYClcbiAgLy9zLT5kX2J1ZiA9IG92ZXJsYXkgKyBzLT5saXRfYnVmc2l6ZS9zaXplb2YodXNoKTtcbiAgcy5kX2J1ZiA9IDEgKiBzLmxpdF9idWZzaXplO1xuXG4gIC8vcy0+bF9idWYgPSBzLT5wZW5kaW5nX2J1ZiArICgxK3NpemVvZih1c2gpKSpzLT5saXRfYnVmc2l6ZTtcbiAgcy5sX2J1ZiA9ICgxICsgMikgKiBzLmxpdF9idWZzaXplO1xuXG4gIHMubGV2ZWwgPSBsZXZlbDtcbiAgcy5zdHJhdGVneSA9IHN0cmF0ZWd5O1xuICBzLm1ldGhvZCA9IG1ldGhvZDtcblxuICByZXR1cm4gZGVmbGF0ZVJlc2V0KHN0cm0pO1xufVxuXG5mdW5jdGlvbiBkZWZsYXRlSW5pdChzdHJtOiBaU3RyZWFtLCBsZXZlbDogbnVtYmVyKSB7XG4gIHJldHVybiBkZWZsYXRlSW5pdDIoXG4gICAgc3RybSxcbiAgICBsZXZlbCxcbiAgICBaX0RFRkxBVEVELFxuICAgIE1BWF9XQklUUyxcbiAgICBERUZfTUVNX0xFVkVMLFxuICAgIFpfREVGQVVMVF9TVFJBVEVHWSxcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlZmxhdGUoc3RybTogWlN0cmVhbSwgZmx1c2g6IG51bWJlcikge1xuICBsZXQgb2xkX2ZsdXNoLCBzO1xuICBsZXQgYmVnLCB2YWw7IC8vIGZvciBnemlwIGhlYWRlciB3cml0ZSBvbmx5XG5cbiAgaWYgKFxuICAgICFzdHJtIHx8ICFzdHJtLnN0YXRlIHx8XG4gICAgZmx1c2ggPiBTVEFUVVMuWl9CTE9DSyB8fCBmbHVzaCA8IDBcbiAgKSB7XG4gICAgcmV0dXJuIHN0cm0gPyBlcnIoc3RybSwgU1RBVFVTLlpfU1RSRUFNX0VSUk9SIGFzIENPREUpIDogWl9TVFJFQU1fRVJST1I7XG4gIH1cblxuICBzID0gc3RybS5zdGF0ZTtcblxuICBpZiAoXG4gICAgIXN0cm0ub3V0cHV0IHx8XG4gICAgKCFzdHJtLmlucHV0ICYmIHN0cm0uYXZhaWxfaW4gIT09IDApIHx8XG4gICAgKHMuc3RhdHVzID09PSBGSU5JU0hfU1RBVEUgJiYgZmx1c2ggIT09IFNUQVRVUy5aX0ZJTklTSClcbiAgKSB7XG4gICAgcmV0dXJuIGVycihcbiAgICAgIHN0cm0sXG4gICAgICAoc3RybS5hdmFpbF9vdXQgPT09IDBcbiAgICAgICAgPyBTVEFUVVMuWl9CVUZfRVJST1JcbiAgICAgICAgOiBTVEFUVVMuWl9TVFJFQU1fRVJST1IpIGFzIENPREUsXG4gICAgKTtcbiAgfVxuXG4gIHMuc3RybSA9IHN0cm07IC8qIGp1c3QgaW4gY2FzZSAqL1xuICBvbGRfZmx1c2ggPSBzLmxhc3RfZmx1c2g7XG4gIHMubGFzdF9mbHVzaCA9IGZsdXNoO1xuXG4gIC8qIFdyaXRlIHRoZSBoZWFkZXIgKi9cbiAgaWYgKHMuc3RhdHVzID09PSBJTklUX1NUQVRFKSB7XG4gICAgaWYgKHMud3JhcCA9PT0gMikgeyAvLyBHWklQIGhlYWRlclxuICAgICAgc3RybS5hZGxlciA9IDA7IC8vY3JjMzIoMEwsIFpfTlVMTCwgMCk7XG4gICAgICBwdXRfYnl0ZShzLCAzMSk7XG4gICAgICBwdXRfYnl0ZShzLCAxMzkpO1xuICAgICAgcHV0X2J5dGUocywgOCk7XG4gICAgICBpZiAoIXMuZ3poZWFkKSB7IC8vIHMtPmd6aGVhZCA9PSBaX05VTExcbiAgICAgICAgcHV0X2J5dGUocywgMCk7XG4gICAgICAgIHB1dF9ieXRlKHMsIDApO1xuICAgICAgICBwdXRfYnl0ZShzLCAwKTtcbiAgICAgICAgcHV0X2J5dGUocywgMCk7XG4gICAgICAgIHB1dF9ieXRlKHMsIDApO1xuICAgICAgICBwdXRfYnl0ZShcbiAgICAgICAgICBzLFxuICAgICAgICAgIHMubGV2ZWwgPT09IDlcbiAgICAgICAgICAgID8gMlxuICAgICAgICAgICAgOiAocy5zdHJhdGVneSA+PSBaX0hVRkZNQU5fT05MWSB8fCBzLmxldmVsIDwgMiA/IDQgOiAwKSxcbiAgICAgICAgKTtcbiAgICAgICAgcHV0X2J5dGUocywgT1NfQ09ERSk7XG4gICAgICAgIHMuc3RhdHVzID0gQlVTWV9TVEFURTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHB1dF9ieXRlKFxuICAgICAgICAgIHMsXG4gICAgICAgICAgKHMuZ3poZWFkLnRleHQgPyAxIDogMCkgK1xuICAgICAgICAgICAgKHMuZ3poZWFkLmhjcmMgPyAyIDogMCkgK1xuICAgICAgICAgICAgKCFzLmd6aGVhZC5leHRyYSA/IDAgOiA0KSArXG4gICAgICAgICAgICAoIXMuZ3poZWFkLm5hbWUgPyAwIDogOCkgK1xuICAgICAgICAgICAgKCFzLmd6aGVhZC5jb21tZW50ID8gMCA6IDE2KSxcbiAgICAgICAgKTtcbiAgICAgICAgcHV0X2J5dGUocywgcy5nemhlYWQudGltZSAmIDB4ZmYpO1xuICAgICAgICBwdXRfYnl0ZShzLCAocy5nemhlYWQudGltZSA+PiA4KSAmIDB4ZmYpO1xuICAgICAgICBwdXRfYnl0ZShzLCAocy5nemhlYWQudGltZSA+PiAxNikgJiAweGZmKTtcbiAgICAgICAgcHV0X2J5dGUocywgKHMuZ3poZWFkLnRpbWUgPj4gMjQpICYgMHhmZik7XG4gICAgICAgIHB1dF9ieXRlKFxuICAgICAgICAgIHMsXG4gICAgICAgICAgcy5sZXZlbCA9PT0gOVxuICAgICAgICAgICAgPyAyXG4gICAgICAgICAgICA6IChzLnN0cmF0ZWd5ID49IFpfSFVGRk1BTl9PTkxZIHx8IHMubGV2ZWwgPCAyID8gNCA6IDApLFxuICAgICAgICApO1xuICAgICAgICBwdXRfYnl0ZShzLCBzLmd6aGVhZC5vcyAmIDB4ZmYpO1xuICAgICAgICBpZiAocy5nemhlYWQuZXh0cmEgJiYgcy5nemhlYWQuZXh0cmEubGVuZ3RoKSB7XG4gICAgICAgICAgcHV0X2J5dGUocywgcy5nemhlYWQuZXh0cmEubGVuZ3RoICYgMHhmZik7XG4gICAgICAgICAgcHV0X2J5dGUocywgKHMuZ3poZWFkLmV4dHJhLmxlbmd0aCA+PiA4KSAmIDB4ZmYpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzLmd6aGVhZC5oY3JjKSB7XG4gICAgICAgICAgc3RybS5hZGxlciA9IGNyYzMyKHN0cm0uYWRsZXIsIHMucGVuZGluZ19idWYsIHMucGVuZGluZywgMCk7XG4gICAgICAgIH1cbiAgICAgICAgcy5nemluZGV4ID0gMDtcbiAgICAgICAgcy5zdGF0dXMgPSBFWFRSQV9TVEFURTtcbiAgICAgIH1cbiAgICB9IC8vIERFRkxBVEUgaGVhZGVyXG4gICAgZWxzZSB7XG4gICAgICBsZXQgaGVhZGVyID0gKFpfREVGTEFURUQgKyAoKHMud19iaXRzIC0gOCkgPDwgNCkpIDw8IDg7XG4gICAgICBsZXQgbGV2ZWxfZmxhZ3MgPSAtMTtcblxuICAgICAgaWYgKHMuc3RyYXRlZ3kgPj0gWl9IVUZGTUFOX09OTFkgfHwgcy5sZXZlbCA8IDIpIHtcbiAgICAgICAgbGV2ZWxfZmxhZ3MgPSAwO1xuICAgICAgfSBlbHNlIGlmIChzLmxldmVsIDwgNikge1xuICAgICAgICBsZXZlbF9mbGFncyA9IDE7XG4gICAgICB9IGVsc2UgaWYgKHMubGV2ZWwgPT09IDYpIHtcbiAgICAgICAgbGV2ZWxfZmxhZ3MgPSAyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV2ZWxfZmxhZ3MgPSAzO1xuICAgICAgfVxuICAgICAgaGVhZGVyIHw9IChsZXZlbF9mbGFncyA8PCA2KTtcbiAgICAgIGlmIChzLnN0cnN0YXJ0ICE9PSAwKSBoZWFkZXIgfD0gUFJFU0VUX0RJQ1Q7XG4gICAgICBoZWFkZXIgKz0gMzEgLSAoaGVhZGVyICUgMzEpO1xuXG4gICAgICBzLnN0YXR1cyA9IEJVU1lfU1RBVEU7XG4gICAgICBwdXRTaG9ydE1TQihzLCBoZWFkZXIpO1xuXG4gICAgICAvKiBTYXZlIHRoZSBhZGxlcjMyIG9mIHRoZSBwcmVzZXQgZGljdGlvbmFyeTogKi9cbiAgICAgIGlmIChzLnN0cnN0YXJ0ICE9PSAwKSB7XG4gICAgICAgIHB1dFNob3J0TVNCKHMsIHN0cm0uYWRsZXIgPj4+IDE2KTtcbiAgICAgICAgcHV0U2hvcnRNU0Iocywgc3RybS5hZGxlciAmIDB4ZmZmZik7XG4gICAgICB9XG4gICAgICBzdHJtLmFkbGVyID0gMTsgLy8gYWRsZXIzMigwTCwgWl9OVUxMLCAwKTtcbiAgICB9XG4gIH1cblxuICAvLyNpZmRlZiBHWklQXG4gIGlmIChzLnN0YXR1cyA9PT0gRVhUUkFfU1RBVEUpIHtcbiAgICBpZiAocy5nemhlYWQhLmV4dHJhIC8qICE9IFpfTlVMTCovKSB7XG4gICAgICBiZWcgPSBzLnBlbmRpbmc7IC8qIHN0YXJ0IG9mIGJ5dGVzIHRvIHVwZGF0ZSBjcmMgKi9cblxuICAgICAgd2hpbGUgKHMuZ3ppbmRleCA8IChzLmd6aGVhZCEuZXh0cmEubGVuZ3RoICYgMHhmZmZmKSkge1xuICAgICAgICBpZiAocy5wZW5kaW5nID09PSBzLnBlbmRpbmdfYnVmX3NpemUpIHtcbiAgICAgICAgICBpZiAocy5nemhlYWQhLmhjcmMgJiYgcy5wZW5kaW5nID4gYmVnKSB7XG4gICAgICAgICAgICBzdHJtLmFkbGVyID0gY3JjMzIoc3RybS5hZGxlciwgcy5wZW5kaW5nX2J1Ziwgcy5wZW5kaW5nIC0gYmVnLCBiZWcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmbHVzaF9wZW5kaW5nKHN0cm0pO1xuICAgICAgICAgIGJlZyA9IHMucGVuZGluZztcbiAgICAgICAgICBpZiAocy5wZW5kaW5nID09PSBzLnBlbmRpbmdfYnVmX3NpemUpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBwdXRfYnl0ZShzLCBzLmd6aGVhZCEuZXh0cmFbcy5nemluZGV4XSAmIDB4ZmYpO1xuICAgICAgICBzLmd6aW5kZXgrKztcbiAgICAgIH1cbiAgICAgIGlmIChzLmd6aGVhZCEuaGNyYyAmJiBzLnBlbmRpbmcgPiBiZWcpIHtcbiAgICAgICAgc3RybS5hZGxlciA9IGNyYzMyKHN0cm0uYWRsZXIsIHMucGVuZGluZ19idWYsIHMucGVuZGluZyAtIGJlZywgYmVnKTtcbiAgICAgIH1cbiAgICAgIGlmIChzLmd6aW5kZXggPT09IHMuZ3poZWFkIS5leHRyYS5sZW5ndGgpIHtcbiAgICAgICAgcy5nemluZGV4ID0gMDtcbiAgICAgICAgcy5zdGF0dXMgPSBOQU1FX1NUQVRFO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzLnN0YXR1cyA9IE5BTUVfU1RBVEU7XG4gICAgfVxuICB9XG4gIGlmIChzLnN0YXR1cyA9PT0gTkFNRV9TVEFURSkge1xuICAgIGlmIChzLmd6aGVhZCEubmFtZSAvKiAhPSBaX05VTEwqLykge1xuICAgICAgYmVnID0gcy5wZW5kaW5nOyAvKiBzdGFydCBvZiBieXRlcyB0byB1cGRhdGUgY3JjICovXG4gICAgICAvL2ludCB2YWw7XG5cbiAgICAgIGRvIHtcbiAgICAgICAgaWYgKHMucGVuZGluZyA9PT0gcy5wZW5kaW5nX2J1Zl9zaXplKSB7XG4gICAgICAgICAgaWYgKHMuZ3poZWFkIS5oY3JjICYmIHMucGVuZGluZyA+IGJlZykge1xuICAgICAgICAgICAgc3RybS5hZGxlciA9IGNyYzMyKHN0cm0uYWRsZXIsIHMucGVuZGluZ19idWYsIHMucGVuZGluZyAtIGJlZywgYmVnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZmx1c2hfcGVuZGluZyhzdHJtKTtcbiAgICAgICAgICBiZWcgPSBzLnBlbmRpbmc7XG4gICAgICAgICAgaWYgKHMucGVuZGluZyA9PT0gcy5wZW5kaW5nX2J1Zl9zaXplKSB7XG4gICAgICAgICAgICB2YWwgPSAxO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIEpTIHNwZWNpZmljOiBsaXR0bGUgbWFnaWMgdG8gYWRkIHplcm8gdGVybWluYXRvciB0byBlbmQgb2Ygc3RyaW5nXG4gICAgICAgIGlmIChzLmd6aW5kZXggPCBzLmd6aGVhZCEubmFtZS5sZW5ndGgpIHtcbiAgICAgICAgICB2YWwgPSBzLmd6aGVhZCEubmFtZS5jaGFyQ29kZUF0KHMuZ3ppbmRleCsrKSAmIDB4ZmY7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsID0gMDtcbiAgICAgICAgfVxuICAgICAgICBwdXRfYnl0ZShzLCB2YWwpO1xuICAgICAgfSB3aGlsZSAodmFsICE9PSAwKTtcblxuICAgICAgaWYgKHMuZ3poZWFkIS5oY3JjICYmIHMucGVuZGluZyA+IGJlZykge1xuICAgICAgICBzdHJtLmFkbGVyID0gY3JjMzIoc3RybS5hZGxlciwgcy5wZW5kaW5nX2J1Ziwgcy5wZW5kaW5nIC0gYmVnLCBiZWcpO1xuICAgICAgfVxuICAgICAgaWYgKHZhbCA9PT0gMCkge1xuICAgICAgICBzLmd6aW5kZXggPSAwO1xuICAgICAgICBzLnN0YXR1cyA9IENPTU1FTlRfU1RBVEU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHMuc3RhdHVzID0gQ09NTUVOVF9TVEFURTtcbiAgICB9XG4gIH1cbiAgaWYgKHMuc3RhdHVzID09PSBDT01NRU5UX1NUQVRFKSB7XG4gICAgaWYgKHMuZ3poZWFkIS5jb21tZW50IC8qICE9IFpfTlVMTCovKSB7XG4gICAgICBiZWcgPSBzLnBlbmRpbmc7IC8qIHN0YXJ0IG9mIGJ5dGVzIHRvIHVwZGF0ZSBjcmMgKi9cbiAgICAgIC8vaW50IHZhbDtcblxuICAgICAgZG8ge1xuICAgICAgICBpZiAocy5wZW5kaW5nID09PSBzLnBlbmRpbmdfYnVmX3NpemUpIHtcbiAgICAgICAgICBpZiAocy5nemhlYWQhLmhjcmMgJiYgcy5wZW5kaW5nID4gYmVnKSB7XG4gICAgICAgICAgICBzdHJtLmFkbGVyID0gY3JjMzIoc3RybS5hZGxlciwgcy5wZW5kaW5nX2J1Ziwgcy5wZW5kaW5nIC0gYmVnLCBiZWcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmbHVzaF9wZW5kaW5nKHN0cm0pO1xuICAgICAgICAgIGJlZyA9IHMucGVuZGluZztcbiAgICAgICAgICBpZiAocy5wZW5kaW5nID09PSBzLnBlbmRpbmdfYnVmX3NpemUpIHtcbiAgICAgICAgICAgIHZhbCA9IDE7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gSlMgc3BlY2lmaWM6IGxpdHRsZSBtYWdpYyB0byBhZGQgemVybyB0ZXJtaW5hdG9yIHRvIGVuZCBvZiBzdHJpbmdcbiAgICAgICAgaWYgKHMuZ3ppbmRleCA8IHMuZ3poZWFkIS5jb21tZW50Lmxlbmd0aCkge1xuICAgICAgICAgIHZhbCA9IHMuZ3poZWFkIS5jb21tZW50LmNoYXJDb2RlQXQocy5nemluZGV4KyspICYgMHhmZjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWwgPSAwO1xuICAgICAgICB9XG4gICAgICAgIHB1dF9ieXRlKHMsIHZhbCk7XG4gICAgICB9IHdoaWxlICh2YWwgIT09IDApO1xuXG4gICAgICBpZiAocy5nemhlYWQhLmhjcmMgJiYgcy5wZW5kaW5nID4gYmVnKSB7XG4gICAgICAgIHN0cm0uYWRsZXIgPSBjcmMzMihzdHJtLmFkbGVyLCBzLnBlbmRpbmdfYnVmLCBzLnBlbmRpbmcgLSBiZWcsIGJlZyk7XG4gICAgICB9XG4gICAgICBpZiAodmFsID09PSAwKSB7XG4gICAgICAgIHMuc3RhdHVzID0gSENSQ19TVEFURTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcy5zdGF0dXMgPSBIQ1JDX1NUQVRFO1xuICAgIH1cbiAgfVxuICBpZiAocy5zdGF0dXMgPT09IEhDUkNfU1RBVEUpIHtcbiAgICBpZiAocy5nemhlYWQhLmhjcmMpIHtcbiAgICAgIGlmIChzLnBlbmRpbmcgKyAyID4gcy5wZW5kaW5nX2J1Zl9zaXplKSB7XG4gICAgICAgIGZsdXNoX3BlbmRpbmcoc3RybSk7XG4gICAgICB9XG4gICAgICBpZiAocy5wZW5kaW5nICsgMiA8PSBzLnBlbmRpbmdfYnVmX3NpemUpIHtcbiAgICAgICAgcHV0X2J5dGUocywgc3RybS5hZGxlciAmIDB4ZmYpO1xuICAgICAgICBwdXRfYnl0ZShzLCAoc3RybS5hZGxlciA+PiA4KSAmIDB4ZmYpO1xuICAgICAgICBzdHJtLmFkbGVyID0gMDsgLy9jcmMzMigwTCwgWl9OVUxMLCAwKTtcbiAgICAgICAgcy5zdGF0dXMgPSBCVVNZX1NUQVRFO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzLnN0YXR1cyA9IEJVU1lfU1RBVEU7XG4gICAgfVxuICB9XG4gIC8vI2VuZGlmXG5cbiAgLyogRmx1c2ggYXMgbXVjaCBwZW5kaW5nIG91dHB1dCBhcyBwb3NzaWJsZSAqL1xuICBpZiAocy5wZW5kaW5nICE9PSAwKSB7XG4gICAgZmx1c2hfcGVuZGluZyhzdHJtKTtcbiAgICBpZiAoc3RybS5hdmFpbF9vdXQgPT09IDApIHtcbiAgICAgIC8qIFNpbmNlIGF2YWlsX291dCBpcyAwLCBkZWZsYXRlIHdpbGwgYmUgY2FsbGVkIGFnYWluIHdpdGhcbiAgICAgICAqIG1vcmUgb3V0cHV0IHNwYWNlLCBidXQgcG9zc2libHkgd2l0aCBib3RoIHBlbmRpbmcgYW5kXG4gICAgICAgKiBhdmFpbF9pbiBlcXVhbCB0byB6ZXJvLiBUaGVyZSB3b24ndCBiZSBhbnl0aGluZyB0byBkbyxcbiAgICAgICAqIGJ1dCB0aGlzIGlzIG5vdCBhbiBlcnJvciBzaXR1YXRpb24gc28gbWFrZSBzdXJlIHdlXG4gICAgICAgKiByZXR1cm4gT0sgaW5zdGVhZCBvZiBCVUZfRVJST1IgYXQgbmV4dCBjYWxsIG9mIGRlZmxhdGU6XG4gICAgICAgKi9cbiAgICAgIHMubGFzdF9mbHVzaCA9IC0xO1xuICAgICAgcmV0dXJuIFpfT0s7XG4gICAgfVxuXG4gICAgLyogTWFrZSBzdXJlIHRoZXJlIGlzIHNvbWV0aGluZyB0byBkbyBhbmQgYXZvaWQgZHVwbGljYXRlIGNvbnNlY3V0aXZlXG4gICAgICogZmx1c2hlcy4gRm9yIHJlcGVhdGVkIGFuZCB1c2VsZXNzIGNhbGxzIHdpdGggWl9GSU5JU0gsIHdlIGtlZXBcbiAgICAgKiByZXR1cm5pbmcgWl9TVFJFQU1fRU5EIGluc3RlYWQgb2YgWl9CVUZfRVJST1IuXG4gICAgICovXG4gIH0gZWxzZSBpZiAoXG4gICAgc3RybS5hdmFpbF9pbiA9PT0gMCAmJiByYW5rKGZsdXNoKSA8PSByYW5rKG9sZF9mbHVzaCkgJiZcbiAgICBmbHVzaCAhPT0gU1RBVFVTLlpfRklOSVNIXG4gICkge1xuICAgIHJldHVybiBlcnIoc3RybSwgU1RBVFVTLlpfQlVGX0VSUk9SIGFzIENPREUpO1xuICB9XG5cbiAgLyogVXNlciBtdXN0IG5vdCBwcm92aWRlIG1vcmUgaW5wdXQgYWZ0ZXIgdGhlIGZpcnN0IEZJTklTSDogKi9cbiAgaWYgKHMuc3RhdHVzID09PSBGSU5JU0hfU1RBVEUgJiYgc3RybS5hdmFpbF9pbiAhPT0gMCkge1xuICAgIHJldHVybiBlcnIoc3RybSwgU1RBVFVTLlpfQlVGX0VSUk9SIGFzIENPREUpO1xuICB9XG5cbiAgLyogU3RhcnQgYSBuZXcgYmxvY2sgb3IgY29udGludWUgdGhlIGN1cnJlbnQgb25lLlxuICAgKi9cbiAgaWYgKFxuICAgIHN0cm0uYXZhaWxfaW4gIT09IDAgfHwgcy5sb29rYWhlYWQgIT09IDAgfHxcbiAgICAoZmx1c2ggIT09IFNUQVRVUy5aX05PX0ZMVVNIICYmIHMuc3RhdHVzICE9PSBGSU5JU0hfU1RBVEUpXG4gICkge1xuICAgIGxldCBic3RhdGUgPSAocy5zdHJhdGVneSA9PT0gWl9IVUZGTUFOX09OTFkpXG4gICAgICA/IGRlZmxhdGVfaHVmZihzLCBmbHVzaClcbiAgICAgIDogKHMuc3RyYXRlZ3kgPT09IFpfUkxFXG4gICAgICAgID8gZGVmbGF0ZV9ybGUocywgZmx1c2gpXG4gICAgICAgIDogY29uZmlndXJhdGlvbl90YWJsZVtzLmxldmVsXS5mdW5jKHMsIGZsdXNoKSk7XG5cbiAgICBpZiAoYnN0YXRlID09PSBCU19GSU5JU0hfU1RBUlRFRCB8fCBic3RhdGUgPT09IEJTX0ZJTklTSF9ET05FKSB7XG4gICAgICBzLnN0YXR1cyA9IEZJTklTSF9TVEFURTtcbiAgICB9XG4gICAgaWYgKGJzdGF0ZSA9PT0gQlNfTkVFRF9NT1JFIHx8IGJzdGF0ZSA9PT0gQlNfRklOSVNIX1NUQVJURUQpIHtcbiAgICAgIGlmIChzdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgICBzLmxhc3RfZmx1c2ggPSAtMTtcbiAgICAgICAgLyogYXZvaWQgQlVGX0VSUk9SIG5leHQgY2FsbCwgc2VlIGFib3ZlICovXG4gICAgICB9XG4gICAgICByZXR1cm4gU1RBVFVTLlpfT0s7XG4gICAgICAvKiBJZiBmbHVzaCAhPSBaX05PX0ZMVVNIICYmIGF2YWlsX291dCA9PSAwLCB0aGUgbmV4dCBjYWxsXG4gICAgICAgKiBvZiBkZWZsYXRlIHNob3VsZCB1c2UgdGhlIHNhbWUgZmx1c2ggcGFyYW1ldGVyIHRvIG1ha2Ugc3VyZVxuICAgICAgICogdGhhdCB0aGUgZmx1c2ggaXMgY29tcGxldGUuIFNvIHdlIGRvbid0IGhhdmUgdG8gb3V0cHV0IGFuXG4gICAgICAgKiBlbXB0eSBibG9jayBoZXJlLCB0aGlzIHdpbGwgYmUgZG9uZSBhdCBuZXh0IGNhbGwuIFRoaXMgYWxzb1xuICAgICAgICogZW5zdXJlcyB0aGF0IGZvciBhIHZlcnkgc21hbGwgb3V0cHV0IGJ1ZmZlciwgd2UgZW1pdCBhdCBtb3N0XG4gICAgICAgKiBvbmUgZW1wdHkgYmxvY2suXG4gICAgICAgKi9cbiAgICB9XG4gICAgaWYgKGJzdGF0ZSA9PT0gQlNfQkxPQ0tfRE9ORSkge1xuICAgICAgaWYgKGZsdXNoID09PSBTVEFUVVMuWl9QQVJUSUFMX0ZMVVNIKSB7XG4gICAgICAgIHRyZWVzLl90cl9hbGlnbihzKTtcbiAgICAgIH0gZWxzZSBpZiAoZmx1c2ggIT09IFNUQVRVUy5aX0JMT0NLKSB7XG4gICAgICAgIC8qIEZVTExfRkxVU0ggb3IgU1lOQ19GTFVTSCAqL1xuXG4gICAgICAgIHRyZWVzLl90cl9zdG9yZWRfYmxvY2socywgMCwgMCwgZmFsc2UpO1xuICAgICAgICAvKiBGb3IgYSBmdWxsIGZsdXNoLCB0aGlzIGVtcHR5IGJsb2NrIHdpbGwgYmUgcmVjb2duaXplZFxuICAgICAgICAgKiBhcyBhIHNwZWNpYWwgbWFya2VyIGJ5IGluZmxhdGVfc3luYygpLlxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKGZsdXNoID09PSBTVEFUVVMuWl9GVUxMX0ZMVVNIKSB7XG4gICAgICAgICAgLyoqKiBDTEVBUl9IQVNIKHMpOyAqKiovXG4gICAgICAgICAgLyogZm9yZ2V0IGhpc3RvcnkgKi9cbiAgICAgICAgICB6ZXJvKHMuaGVhZCEpOyAvLyBGaWxsIHdpdGggTklMICg9IDApO1xuXG4gICAgICAgICAgaWYgKHMubG9va2FoZWFkID09PSAwKSB7XG4gICAgICAgICAgICBzLnN0cnN0YXJ0ID0gMDtcbiAgICAgICAgICAgIHMuYmxvY2tfc3RhcnQgPSAwO1xuICAgICAgICAgICAgcy5pbnNlcnQgPSAwO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZmx1c2hfcGVuZGluZyhzdHJtKTtcbiAgICAgIGlmIChzdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgICBzLmxhc3RfZmx1c2ggPSAtMTsgLyogYXZvaWQgQlVGX0VSUk9SIGF0IG5leHQgY2FsbCwgc2VlIGFib3ZlICovXG4gICAgICAgIHJldHVybiBTVEFUVVMuWl9PSztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLy9Bc3NlcnQoc3RybS0+YXZhaWxfb3V0ID4gMCwgXCJidWcyXCIpO1xuICAvL2lmIChzdHJtLmF2YWlsX291dCA8PSAwKSB7IHRocm93IG5ldyBFcnJvcihcImJ1ZzJcIik7fVxuXG4gIGlmIChmbHVzaCAhPT0gU1RBVFVTLlpfRklOSVNIKSByZXR1cm4gU1RBVFVTLlpfT0s7XG4gIGlmIChzLndyYXAgPD0gMCkgcmV0dXJuIFNUQVRVUy5aX1NUUkVBTV9FTkQ7XG5cbiAgLyogV3JpdGUgdGhlIHRyYWlsZXIgKi9cbiAgaWYgKHMud3JhcCA9PT0gMikge1xuICAgIHB1dF9ieXRlKHMsIHN0cm0uYWRsZXIgJiAweGZmKTtcbiAgICBwdXRfYnl0ZShzLCAoc3RybS5hZGxlciA+PiA4KSAmIDB4ZmYpO1xuICAgIHB1dF9ieXRlKHMsIChzdHJtLmFkbGVyID4+IDE2KSAmIDB4ZmYpO1xuICAgIHB1dF9ieXRlKHMsIChzdHJtLmFkbGVyID4+IDI0KSAmIDB4ZmYpO1xuICAgIHB1dF9ieXRlKHMsIHN0cm0udG90YWxfaW4gJiAweGZmKTtcbiAgICBwdXRfYnl0ZShzLCAoc3RybS50b3RhbF9pbiA+PiA4KSAmIDB4ZmYpO1xuICAgIHB1dF9ieXRlKHMsIChzdHJtLnRvdGFsX2luID4+IDE2KSAmIDB4ZmYpO1xuICAgIHB1dF9ieXRlKHMsIChzdHJtLnRvdGFsX2luID4+IDI0KSAmIDB4ZmYpO1xuICB9IGVsc2Uge1xuICAgIHB1dFNob3J0TVNCKHMsIHN0cm0uYWRsZXIgPj4+IDE2KTtcbiAgICBwdXRTaG9ydE1TQihzLCBzdHJtLmFkbGVyICYgMHhmZmZmKTtcbiAgfVxuXG4gIGZsdXNoX3BlbmRpbmcoc3RybSk7XG4gIC8qIElmIGF2YWlsX291dCBpcyB6ZXJvLCB0aGUgYXBwbGljYXRpb24gd2lsbCBjYWxsIGRlZmxhdGUgYWdhaW5cbiAgICogdG8gZmx1c2ggdGhlIHJlc3QuXG4gICAqL1xuICBpZiAocy53cmFwID4gMCkgcy53cmFwID0gLXMud3JhcDtcbiAgLyogd3JpdGUgdGhlIHRyYWlsZXIgb25seSBvbmNlISAqL1xuICByZXR1cm4gcy5wZW5kaW5nICE9PSAwID8gWl9PSyA6IFpfU1RSRUFNX0VORDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlZmxhdGVFbmQoc3RybTogWlN0cmVhbSk6IGFueSB7XG4gIGxldCBzdGF0dXM7XG5cbiAgaWYgKCFzdHJtIC8qPT0gWl9OVUxMKi8gfHwgIXN0cm0uc3RhdGUgLyo9PSBaX05VTEwqLykge1xuICAgIHJldHVybiBaX1NUUkVBTV9FUlJPUjtcbiAgfVxuXG4gIHN0YXR1cyA9IHN0cm0uc3RhdGUuc3RhdHVzO1xuICBpZiAoXG4gICAgc3RhdHVzICE9PSBJTklUX1NUQVRFICYmXG4gICAgc3RhdHVzICE9PSBFWFRSQV9TVEFURSAmJlxuICAgIHN0YXR1cyAhPT0gTkFNRV9TVEFURSAmJlxuICAgIHN0YXR1cyAhPT0gQ09NTUVOVF9TVEFURSAmJlxuICAgIHN0YXR1cyAhPT0gSENSQ19TVEFURSAmJlxuICAgIHN0YXR1cyAhPT0gQlVTWV9TVEFURSAmJlxuICAgIHN0YXR1cyAhPT0gRklOSVNIX1NUQVRFXG4gICkge1xuICAgIHJldHVybiBlcnIoc3RybSwgU1RBVFVTLlpfU1RSRUFNX0VSUk9SIGFzIENPREUpO1xuICB9XG5cbiAgc3RybS5zdGF0ZSA9IG51bGw7XG5cbiAgcmV0dXJuIHN0YXR1cyA9PT0gQlVTWV9TVEFURSA/IGVycihzdHJtLCBTVEFUVVMuWl9EQVRBX0VSUk9SIGFzIENPREUpIDogWl9PSztcbn1cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogSW5pdGlhbGl6ZXMgdGhlIGNvbXByZXNzaW9uIGRpY3Rpb25hcnkgZnJvbSB0aGUgZ2l2ZW4gYnl0ZVxuICogc2VxdWVuY2Ugd2l0aG91dCBwcm9kdWNpbmcgYW55IGNvbXByZXNzZWQgb3V0cHV0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVmbGF0ZVNldERpY3Rpb25hcnkoXG4gIHN0cm06IFpTdHJlYW0sXG4gIGRpY3Rpb25hcnk6IFVpbnQ4QXJyYXksXG4pOiBhbnkge1xuICBsZXQgZGljdExlbmd0aCA9IGRpY3Rpb25hcnkubGVuZ3RoO1xuXG4gIGxldCBzO1xuICBsZXQgc3RyLCBuO1xuICBsZXQgd3JhcDtcbiAgbGV0IGF2YWlsO1xuICBsZXQgbmV4dDtcbiAgbGV0IGlucHV0O1xuICBsZXQgdG1wRGljdDtcblxuICBpZiAoIXN0cm0gLyo9PSBaX05VTEwqLyB8fCAhc3RybS5zdGF0ZSAvKj09IFpfTlVMTCovKSB7XG4gICAgcmV0dXJuIFpfU1RSRUFNX0VSUk9SO1xuICB9XG5cbiAgcyA9IHN0cm0uc3RhdGU7XG4gIHdyYXAgPSBzLndyYXA7XG5cbiAgaWYgKHdyYXAgPT09IDIgfHwgKHdyYXAgPT09IDEgJiYgcy5zdGF0dXMgIT09IElOSVRfU1RBVEUpIHx8IHMubG9va2FoZWFkKSB7XG4gICAgcmV0dXJuIFpfU1RSRUFNX0VSUk9SO1xuICB9XG5cbiAgLyogd2hlbiB1c2luZyB6bGliIHdyYXBwZXJzLCBjb21wdXRlIEFkbGVyLTMyIGZvciBwcm92aWRlZCBkaWN0aW9uYXJ5ICovXG4gIGlmICh3cmFwID09PSAxKSB7XG4gICAgLyogYWRsZXIzMihzdHJtLT5hZGxlciwgZGljdGlvbmFyeSwgZGljdExlbmd0aCk7ICovXG4gICAgc3RybS5hZGxlciA9IGFkbGVyMzIoc3RybS5hZGxlciwgZGljdGlvbmFyeSwgZGljdExlbmd0aCwgMCk7XG4gIH1cblxuICBzLndyYXAgPSAwOyAvKiBhdm9pZCBjb21wdXRpbmcgQWRsZXItMzIgaW4gcmVhZF9idWYgKi9cblxuICAvKiBpZiBkaWN0aW9uYXJ5IHdvdWxkIGZpbGwgd2luZG93LCBqdXN0IHJlcGxhY2UgdGhlIGhpc3RvcnkgKi9cbiAgaWYgKGRpY3RMZW5ndGggPj0gcy53X3NpemUpIHtcbiAgICBpZiAod3JhcCA9PT0gMCkge1xuICAgICAgLyogYWxyZWFkeSBlbXB0eSBvdGhlcndpc2UgKi9cbiAgICAgIC8qKiogQ0xFQVJfSEFTSChzKTsgKioqL1xuICAgICAgemVybyhzLmhlYWQhKTsgLy8gRmlsbCB3aXRoIE5JTCAoPSAwKTtcbiAgICAgIHMuc3Ryc3RhcnQgPSAwO1xuICAgICAgcy5ibG9ja19zdGFydCA9IDA7XG4gICAgICBzLmluc2VydCA9IDA7XG4gICAgfVxuICAgIC8qIHVzZSB0aGUgdGFpbCAqL1xuICAgIC8vIGRpY3Rpb25hcnkgPSBkaWN0aW9uYXJ5LnNsaWNlKGRpY3RMZW5ndGggLSBzLndfc2l6ZSk7XG4gICAgdG1wRGljdCA9IG5ldyBVaW50OEFycmF5KHMud19zaXplKTtcbiAgICB0bXBEaWN0LnNldChkaWN0aW9uYXJ5LnN1YmFycmF5KGRpY3RMZW5ndGggLSBzLndfc2l6ZSwgZGljdExlbmd0aCksIDApO1xuICAgIGRpY3Rpb25hcnkgPSB0bXBEaWN0O1xuICAgIGRpY3RMZW5ndGggPSBzLndfc2l6ZTtcbiAgfVxuICAvKiBpbnNlcnQgZGljdGlvbmFyeSBpbnRvIHdpbmRvdyBhbmQgaGFzaCAqL1xuICBhdmFpbCA9IHN0cm0uYXZhaWxfaW47XG4gIG5leHQgPSBzdHJtLm5leHRfaW47XG4gIGlucHV0ID0gc3RybS5pbnB1dDtcbiAgc3RybS5hdmFpbF9pbiA9IGRpY3RMZW5ndGg7XG4gIHN0cm0ubmV4dF9pbiA9IDA7XG4gIHN0cm0uaW5wdXQgPSBkaWN0aW9uYXJ5O1xuICBmaWxsX3dpbmRvdyhzKTtcbiAgd2hpbGUgKHMubG9va2FoZWFkID49IE1JTl9NQVRDSCkge1xuICAgIHN0ciA9IHMuc3Ryc3RhcnQ7XG4gICAgbiA9IHMubG9va2FoZWFkIC0gKE1JTl9NQVRDSCAtIDEpO1xuICAgIGRvIHtcbiAgICAgIC8qIFVQREFURV9IQVNIKHMsIHMtPmluc19oLCBzLT53aW5kb3dbc3RyICsgTUlOX01BVENILTFdKTsgKi9cbiAgICAgIHMuaW5zX2ggPSAoKHMuaW5zX2ggPDwgcy5oYXNoX3NoaWZ0KSBeIHMud2luZG93IVtzdHIgKyBNSU5fTUFUQ0ggLSAxXSkgJlxuICAgICAgICBzLmhhc2hfbWFzaztcblxuICAgICAgcy5wcmV2IVtzdHIgJiBzLndfbWFza10gPSBzLmhlYWQhW3MuaW5zX2hdO1xuXG4gICAgICBzLmhlYWQhW3MuaW5zX2hdID0gc3RyO1xuICAgICAgc3RyKys7XG4gICAgfSB3aGlsZSAoLS1uKTtcbiAgICBzLnN0cnN0YXJ0ID0gc3RyO1xuICAgIHMubG9va2FoZWFkID0gTUlOX01BVENIIC0gMTtcbiAgICBmaWxsX3dpbmRvdyhzKTtcbiAgfVxuICBzLnN0cnN0YXJ0ICs9IHMubG9va2FoZWFkO1xuICBzLmJsb2NrX3N0YXJ0ID0gcy5zdHJzdGFydDtcbiAgcy5pbnNlcnQgPSBzLmxvb2thaGVhZDtcbiAgcy5sb29rYWhlYWQgPSAwO1xuICBzLm1hdGNoX2xlbmd0aCA9IHMucHJldl9sZW5ndGggPSBNSU5fTUFUQ0ggLSAxO1xuICBzLm1hdGNoX2F2YWlsYWJsZSA9IDA7XG4gIHN0cm0ubmV4dF9pbiA9IG5leHQ7XG4gIHN0cm0uaW5wdXQgPSBpbnB1dDtcbiAgc3RybS5hdmFpbF9pbiA9IGF2YWlsO1xuICBzLndyYXAgPSB3cmFwO1xuICByZXR1cm4gWl9PSztcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxPQUFPLElBQUksR0FBRyxTQUFjLGFBQWU7WUFFeEMsS0FBSyxPQUFNLFVBQVk7T0FDNUIsT0FBTyxPQUFN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
