//const Z_FILTERED          = 1;
//const Z_HUFFMAN_ONLY      = 2;
//const Z_RLE               = 3;
const Z_FIXED = 4;
//const Z_DEFAULT_STRATEGY  = 0;
/* Possible values of the data_type field (though see inflate()) */ const Z_BINARY =
  0;
const Z_TEXT = 1;
//const Z_ASCII             = 1; // = Z_TEXT
const Z_UNKNOWN = 2;
function zero(buf) {
  buf.fill(0, 0, buf.length);
}
// From zutil.h
const STORED_BLOCK = 0;
const STATIC_TREES = 1;
const DYN_TREES = 2;
/* The three kinds of block type */ const MIN_MATCH = 3;
const MAX_MATCH = 258;
/* The minimum and maximum match lengths */
// From deflate.h
/* ===========================================================================
 * Internal compression state.
 */ const LENGTH_CODES = 29;
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
/* All codes must not exceed MAX_BITS bits */ const Buf_size = 16;
/* size of bit buffer in bi_buf */
/* ===========================================================================
 * Constants
 */ const MAX_BL_BITS = 7;
/* Bit length codes must not exceed MAX_BL_BITS bits */ const END_BLOCK = 256;
/* end of block literal code */ const REP_3_6 = 16;
/* repeat previous bit length 3-6 times (2 bits of repeat count) */ const REPZ_3_10 =
  17;
/* repeat a zero length 3-10 times  (3 bits of repeat count) */ const REPZ_11_138 =
  18;
/* repeat a zero length 11-138 times  (7 bits of repeat count) */ /* eslint-disable comma-spacing,array-bracket-spacing */ const extra_lbits =
  /* extra bits for each length code */ [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    0,
  ];
const extra_dbits = /* extra bits for each distance code */ [
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
];
const extra_blbits = /* extra bits for each bit length code */ [
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
  2,
  3,
  7,
];
const bl_order = [
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
  15,
];
/* eslint-enable comma-spacing,array-bracket-spacing */
/* The lengths of the bit length codes are sent in order of decreasing
 * probability, to avoid transmitting the lengths for unused bit length codes.
 */
/* ===========================================================================
 * Local data. These are initialized only once.
 */
// We pre-fill arrays with 0 to avoid uninitialized gaps
const DIST_CODE_LEN = 512; /* see definition of array dist_code below */
// !!!! Use flat array instead of structure, Freq = i*2, Len = i*2+1
const static_ltree = new Array((L_CODES + 2) * 2);
zero(static_ltree);
/* The static literal tree. Since the bit lengths are imposed, there is no
 * need for the L_CODES extra codes used during heap construction. However
 * The codes 286 and 287 are needed to build a canonical tree (see _tr_init
 * below).
 */ const static_dtree = new Array(D_CODES * 2);
zero(static_dtree);
/* The static distance tree. (Actually a trivial tree since all codes use
 * 5 bits.)
 */ const _dist_code = new Array(DIST_CODE_LEN);
zero(_dist_code);
/* Distance codes. The first 256 values correspond to the distances
 * 3 .. 258, the last 256 values correspond to the top 8 bits of
 * the 15 bit distances.
 */ const _length_code = new Array(MAX_MATCH - MIN_MATCH + 1);
zero(_length_code);
/* length code for each normalized match length (0 == MIN_MATCH) */ const base_length =
  new Array(LENGTH_CODES);
zero(base_length);
/* First normalized length for each code (0 = MIN_MATCH) */ const base_dist =
  new Array(D_CODES);
zero(base_dist);
/* First normalized distance for each code (0 = distance of 1) */ class StaticTreeDesc {
  static_tree;
  extra_bits;
  extra_base;
  elems;
  max_length;
  // show if `static_tree` has data or dummy - needed for monomorphic objects
  has_stree;
  constructor(static_tree, extra_bits, extra_base, elems, max_length) {
    this.static_tree = static_tree; /* static tree or NULL */
    this.extra_bits = extra_bits; /* extra bits for each code or NULL */
    this.extra_base = extra_base; /* base index for extra_bits */
    this.elems = elems; /* max number of elements in the tree */
    this.max_length = max_length; /* max bit length for the codes */
    // show if `static_tree` has data or dummy - needed for monomorphic objects
    this.has_stree = static_tree && static_tree.length;
  }
}
let static_l_desc;
let static_d_desc;
let static_bl_desc;
class TreeDesc {
  dyn_tree;
  max_code;
  stat_desc;
  constructor(dyn_tree, stat_desc) {
    this.dyn_tree = dyn_tree; /* the dynamic tree */
    this.max_code = 0; /* largest code with non zero frequency */
    this.stat_desc = stat_desc; /* the corresponding static tree */
  }
}
function d_code(dist) {
  return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
}
/* ===========================================================================
 * Output a short LSB first on the stream.
 * IN assertion: there is enough room in pendingBuf.
 */ function put_short(s, w) {
  //    put_byte(s, (uch)((w) & 0xff));
  //    put_byte(s, (uch)((ush)(w) >> 8));
  s.pending_buf[s.pending++] = w & 255;
  s.pending_buf[s.pending++] = w >>> 8 & 255;
}
/* ===========================================================================
 * Send a value on a given number of bits.
 * IN assertion: length <= 16 and value fits in length bits.
 */ function send_bits(s, value, length) {
  if (s.bi_valid > Buf_size - length) {
    s.bi_buf |= value << s.bi_valid & 65535;
    put_short(s, s.bi_buf);
    s.bi_buf = value >> Buf_size - s.bi_valid;
    s.bi_valid += length - Buf_size;
  } else {
    s.bi_buf |= value << s.bi_valid & 65535;
    s.bi_valid += length;
  }
}
function send_code(s, c, tree) {
  send_bits(s, tree[c * 2], /*.Code*/ tree[c * 2 + 1]);
}
/* ===========================================================================
 * Reverse the first len bits of a code, using straightforward code (a faster
 * method would use a table)
 * IN assertion: 1 <= len <= 15
 */ function bi_reverse(code, len) {
  let res = 0;
  do {
    res |= code & 1;
    code >>>= 1;
    res <<= 1;
  } while ((--len) > 0);
  return res >>> 1;
}
/* ===========================================================================
 * Flush the bit buffer, keeping at most 7 bits in it.
 */ function bi_flush(s) {
  if (s.bi_valid === 16) {
    put_short(s, s.bi_buf);
    s.bi_buf = 0;
    s.bi_valid = 0;
  } else if (s.bi_valid >= 8) {
    s.pending_buf[s.pending++] = s.bi_buf & 255;
    s.bi_buf >>= 8;
    s.bi_valid -= 8;
  }
}
/* ===========================================================================
 * Compute the optimal bit lengths for a tree and update the total bit length
 * for the current block.
 * IN assertion: the fields freq and dad are set, heap[heap_max] and
 *    above are the tree nodes sorted by increasing frequency.
 * OUT assertions: the field len is set to the optimal bit length, the
 *     array bl_count contains the frequencies for each bit length.
 *     The length opt_len is updated; static_len is also updated if stree is
 *     not null.
 */ function gen_bitlen(s, desc) {
  let tree = desc.dyn_tree;
  let max_code = desc.max_code;
  let stree = desc.stat_desc.static_tree;
  let has_stree = desc.stat_desc.has_stree;
  let extra = desc.stat_desc.extra_bits;
  let base = desc.stat_desc.extra_base;
  let max_length = desc.stat_desc.max_length;
  let h; /* heap index */
  let n, m; /* iterate over the tree elements */
  let bits; /* bit length */
  let xbits; /* extra bits */
  let f; /* frequency */
  let overflow = 0; /* number of elements with bit length too large */
  for (bits = 0; bits <= MAX_BITS; bits++) {
    s.bl_count[bits] = 0;
  }
  /* In a first pass, compute the optimal bit lengths (which may
   * overflow in the case of the bit length tree).
   */ tree[s.heap[s.heap_max] * 2 + 1] = 0; /* root of the heap */
  for (h = s.heap_max + 1; h < HEAP_SIZE; h++) {
    n = s.heap[h];
    bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
    if (bits > max_length) {
      bits = max_length;
      overflow++;
    }
    tree[n * 2 + 1] = bits;
    /* We overwrite tree[n].Dad which is no longer needed */ if (n > max_code) {
      continue; /* not a leaf node */
    }
    s.bl_count[bits]++;
    xbits = 0;
    if (n >= base) {
      xbits = extra[n - base];
    }
    f = tree[n * 2];
    s.opt_len += f * (bits + xbits);
    if (has_stree) {
      s.static_len += f * (stree[n * 2 + 1] + xbits);
    }
  }
  if (overflow === 0) return;
  // Trace((stderr,"\nbit length overflow\n"));
  /* This happens for example on obj2 and pic of the Calgary corpus */ /* Find the first bit length which could increase: */ do {
    bits = max_length - 1;
    while (s.bl_count[bits] === 0) bits--;
    s.bl_count[bits]--; /* move one leaf down the tree */
    s.bl_count[bits + 1] += 2; /* move one overflow item as its brother */
    s.bl_count[max_length]--;
    /* The brother of the overflow item also moves one step up,
     * but this does not affect bl_count[max_length]
     */ overflow -= 2;
  } while (overflow > 0);
  /* Now recompute all bit lengths, scanning in increasing frequency.
   * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
   * lengths instead of fixing only the wrong ones. This idea is taken
   * from 'ar' written by Haruhiko Okumura.)
   */ for (bits = max_length; bits !== 0; bits--) {
    n = s.bl_count[bits];
    while (n !== 0) {
      m = s.heap[--h];
      if (m > max_code) continue;
      if (tree[m * 2 + 1] !== bits) {
        // Trace((stderr,"code %d bits %d->%d\n", m, tree[m].Len, bits));
        s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
        tree[m * 2 + 1] = bits;
      }
      n--;
    }
  }
}
/* ===========================================================================
 * Generate the codes for a given tree and bit counts (which need not be
 * optimal).
 * IN assertion: the array bl_count contains the bit length statistics for
 * the given tree and the field len is set for all tree elements.
 * OUT assertion: the field code is set for all tree elements of non
 *     zero code length.
 */ function gen_codes(tree, max_code, bl_count) {
  let next_code = new Array(
    MAX_BITS + 1,
  ); /* next code value for each bit length */
  let code = 0; /* running code value */
  let bits; /* bit index */
  let n; /* code index */
  /* The distribution counts are first used to generate the code values
   * without bit reversal.
   */ for (bits = 1; bits <= MAX_BITS; bits++) {
    next_code[bits] = code = code + bl_count[bits - 1] << 1;
  }
  /* Check that the bit counts in bl_count are consistent. The last code
   * must be all ones.
   */
  //Assert (code + bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,
  //        "inconsistent bit counts");
  //Tracev((stderr,"\ngen_codes: max_code %d ", max_code));
  for (n = 0; n <= max_code; n++) {
    let len = tree[n * 2 + 1];
    if (len === 0) continue;
    /* Now reverse the bits */ tree[n * 2] = bi_reverse(next_code[len]++, len);
    //Tracecv(tree != static_ltree, (stderr,"\nn %3d %c l %2d c %4x (%x) ",
    //     n, (isgraph(n) ? n : ' '), len, tree[n].Code, next_code[len]-1));
  }
}
/* ===========================================================================
 * Initialize the various 'constant' tables.
 */ function tr_static_init() {
  let n; /* iterates over tree elements */
  let bits; /* bit counter */
  let length; /* length value */
  let code; /* code value */
  let dist; /* distance index */
  let bl_count = new Array(MAX_BITS + 1);
  /* number of codes at each bit length for an optimal tree */
  // do check in _tr_init()
  //if (static_init_done) return;
  /* For some embedded targets, global variables are not initialized: */
  /*#ifdef NO_INIT_GLOBAL_POINTERS
  static_l_desc.static_tree = static_ltree;
  static_l_desc.extra_bits = extra_lbits;
  static_d_desc.static_tree = static_dtree;
  static_d_desc.extra_bits = extra_dbits;
  static_bl_desc.extra_bits = extra_blbits;
#endif*/ /* Initialize the mapping length (0..255) -> length code (0..28) */ length =
    0;
  for (code = 0; code < LENGTH_CODES - 1; code++) {
    base_length[code] = length;
    for (n = 0; n < 1 << extra_lbits[code]; n++) {
      _length_code[length++] = code;
    }
  }
  //Assert (length == 256, "tr_static_init: length != 256");
  /* Note that the length 255 (match length 258) can be represented
   * in two different ways: code 284 + 5 bits or code 285, so we
   * overwrite length_code[255] to use the best encoding:
   */ _length_code[length - 1] = code;
  /* Initialize the mapping dist (0..32K) -> dist code (0..29) */ dist = 0;
  for (code = 0; code < 16; code++) {
    base_dist[code] = dist;
    for (n = 0; n < 1 << extra_dbits[code]; n++) {
      _dist_code[dist++] = code;
    }
  }
  //Assert (dist == 256, "tr_static_init: dist != 256");
  dist >>= 7; /* from now on, all distances are divided by 128 */
  for (; code < D_CODES; code++) {
    base_dist[code] = dist << 7;
    for (n = 0; n < 1 << extra_dbits[code] - 7; n++) {
      _dist_code[256 + dist++] = code;
    }
  }
  //Assert (dist == 256, "tr_static_init: 256+dist != 512");
  /* Construct the codes of the static literal tree */ for (
    bits = 0; bits <= MAX_BITS; bits++
  ) {
    bl_count[bits] = 0;
  }
  n = 0;
  while (n <= 143) {
    static_ltree[n * 2 + 1] = 8;
    n++;
    bl_count[8]++;
  }
  while (n <= 255) {
    static_ltree[n * 2 + 1] = 9;
    n++;
    bl_count[9]++;
  }
  while (n <= 279) {
    static_ltree[n * 2 + 1] = 7;
    n++;
    bl_count[7]++;
  }
  while (n <= 287) {
    static_ltree[n * 2 + 1] = 8;
    n++;
    bl_count[8]++;
  }
  /* Codes 286 and 287 do not exist, but we must include them in the
   * tree construction to get a canonical Huffman tree (longest code
   * all ones)
   */ gen_codes(static_ltree, L_CODES + 1, bl_count);
  /* The static distance tree is trivial: */ for (n = 0; n < D_CODES; n++) {
    static_dtree[n * 2 + 1] = 5;
    static_dtree[n * 2] = bi_reverse(n, 5);
  }
  // Now data ready and we can init static trees
  static_l_desc = new StaticTreeDesc(
    static_ltree,
    extra_lbits,
    LITERALS + 1,
    L_CODES,
    MAX_BITS,
  );
  static_d_desc = new StaticTreeDesc(
    static_dtree,
    extra_dbits,
    0,
    D_CODES,
    MAX_BITS,
  );
  static_bl_desc = new StaticTreeDesc(
    new Array(0),
    extra_blbits,
    0,
    BL_CODES,
    MAX_BL_BITS,
  );
  //static_init_done = true;
}
/* ===========================================================================
 * Initialize a new block.
 */ function init_block(s) {
  let n; /* iterates over tree elements */
  /* Initialize the trees. */ for (n = 0; n < L_CODES; n++) {
    s.dyn_ltree[n * 2] = 0;
  }
  for (n = 0; n < D_CODES; n++) s.dyn_dtree[n * 2] = 0;
  for (n = 0; n < BL_CODES; n++) s.bl_tree[n * 2] = 0;
  s.dyn_ltree[END_BLOCK * 2] = 1;
  s.opt_len = s.static_len = 0;
  s.last_lit = s.matches = 0;
}
/* ===========================================================================
 * Flush the bit buffer and align the output on a byte boundary
 */ function bi_windup(s) {
  if (s.bi_valid > 8) {
    put_short(s, s.bi_buf);
  } else if (s.bi_valid > 0) {
    //put_byte(s, (Byte)s->bi_buf);
    s.pending_buf[s.pending++] = s.bi_buf;
  }
  s.bi_buf = 0;
  s.bi_valid = 0;
}
/* ===========================================================================
 * Copy a stored block, storing first the length and its
 * one's complement if requested.
 */ function copy_block(s, buf, len, header) {
  bi_windup(s); /* align on byte boundary */
  if (header) {
    put_short(s, len);
    put_short(s, ~len);
  }
  //  while (len--) {
  //    put_byte(s, *buf++);
  //  }
  s.pending_buf.set(s.window.subarray(buf, buf + len), s.pending);
  s.pending += len;
}
/* ===========================================================================
 * Compares to subtrees, using the tree depth as tie breaker when
 * the subtrees have equal frequency. This minimizes the worst case length.
 */ function smaller(tree, n, m, depth) {
  let _n2 = n * 2;
  let _m2 = m * 2;
  return tree[_n2] < tree[_m2] ||
    tree[_n2] === tree[_m2] && depth[n] <= depth[m];
}
/* ===========================================================================
 * Restore the heap property by moving down the tree starting at node k,
 * exchanging a node with the smallest of its two sons if necessary, stopping
 * when the heap property is re-established (each father smaller than its
 * two sons).
 */ function pqdownheap(s, tree, k) //    ct_data *tree;  /* the tree to restore */
//    int k;               /* node to move down */
{
  let v = s.heap[k];
  let j = k << 1; /* left son of k */
  while (j <= s.heap_len) {
    /* Set j to the smallest of the two sons: */ if (
      j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)
    ) {
      j++;
    }
    /* Exit if v is smaller than both sons */ if (
      smaller(tree, v, s.heap[j], s.depth)
    ) {
      break;
    }
    /* Exchange v with the smallest son */ s.heap[k] = s.heap[j];
    k = j;
    /* And continue down the tree, setting j to the left son of k */ j <<= 1;
  }
  s.heap[k] = v;
}
// inlined manually
// let SMALLEST = 1;
/* ===========================================================================
 * Send the block data compressed using the given Huffman trees
 */ function compress_block(s, ltree, dtree) {
  let dist; /* distance of matched string */
  let lc; /* match length or unmatched char (if dist == 0) */
  let lx = 0; /* running index in l_buf */
  let code; /* the code to send */
  let extra; /* number of extra bits to send */
  if (s.last_lit !== 0) {
    do {
      dist = s.pending_buf[s.d_buf + lx * 2] << 8 |
        s.pending_buf[s.d_buf + lx * 2 + 1];
      lc = s.pending_buf[s.l_buf + lx];
      lx++;
      if (dist === 0) {
        send_code(s, lc, ltree); /* send a literal byte */
        //Tracecv(isgraph(lc), (stderr," '%c' ", lc));
      } else {
        /* Here, lc is the match length - MIN_MATCH */ code = _length_code[lc];
        send_code(s, code + LITERALS + 1, ltree); /* send the length code */
        extra = extra_lbits[code];
        if (extra !== 0) {
          lc -= base_length[code];
          send_bits(s, lc, extra); /* send the extra length bits */
        }
        dist--; /* dist is now the match distance - 1 */
        code = d_code(dist);
        //Assert (code < D_CODES, "bad d_code");
        send_code(s, code, dtree); /* send the distance code */
        extra = extra_dbits[code];
        if (extra !== 0) {
          dist -= base_dist[code];
          send_bits(s, dist, extra); /* send the extra distance bits */
        }
      } /* literal or match pair ? */
      /* Check that the overlay between pending_buf and d_buf+l_buf is ok: */
      //Assert((uInt)(s->pending) < s->lit_bufsize + 2*lx,
      //       "pendingBuf overflow");
    } while (lx < s.last_lit);
  }
  send_code(s, END_BLOCK, ltree);
}
/* ===========================================================================
 * Construct one Huffman tree and assigns the code bit strings and lengths.
 * Update the total bit length for the current block.
 * IN assertion: the field freq is set for all tree elements.
 * OUT assertions: the fields len and code are set to the optimal bit length
 *     and corresponding code. The length opt_len is updated; static_len is
 *     also updated if stree is not null. The field max_code is set.
 */ function build_tree(s, desc) {
  let tree = desc.dyn_tree;
  let stree = desc.stat_desc.static_tree;
  let has_stree = desc.stat_desc.has_stree;
  let elems = desc.stat_desc.elems;
  let n, m; /* iterate over heap elements */
  let max_code = -1; /* largest code with non zero frequency */
  let node; /* new node being created */
  /* Construct the initial heap, with least frequent element in
   * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
   * heap[0] is not used.
   */ s.heap_len = 0;
  s.heap_max = HEAP_SIZE;
  for (n = 0; n < elems; n++) {
    if (tree[n * 2] !== 0) {
      s.heap[++s.heap_len] = max_code = n;
      s.depth[n] = 0;
    } else {
      tree[n * 2 + 1] = 0;
    }
  }
  /* The pkzip format requires that at least one distance code exists,
   * and that at least one bit should be sent even if there is only one
   * possible code. So to avoid special checks later on we force at least
   * two codes of non zero frequency.
   */ while (s.heap_len < 2) {
    node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
    tree[node * 2] = 1;
    s.depth[node] = 0;
    s.opt_len--;
    if (has_stree) {
      s.static_len -= stree[node * 2 + 1];
    }
    /* node is 0 or 1 so it does not have extra bits */
  }
  desc.max_code = max_code;
  /* The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
   * establish sub-heaps of increasing lengths:
   */ for (n = s.heap_len >> 1; n >= 1; n--) pqdownheap(s, tree, n);
  /* Construct the Huffman tree by repeatedly combining the least two
   * frequent nodes.
   */ node = elems; /* next internal node of the tree */
  do {
    //pqremove(s, tree, n);  /* n = node of least frequency */
    /*** pqremove ***/ n = s.heap[1];
    s.heap[1] = s.heap[s.heap_len--];
    pqdownheap(s, tree, 1 /*SMALLEST*/);
    /***/ m = s.heap[1]; /* m = node of next least frequency */
    s.heap[--s.heap_max] = n; /* keep the nodes sorted by frequency */
    s.heap[--s.heap_max] = m;
    /* Create a new node father of n and m */ tree[node * 2] = tree[n * 2] +
      tree[m * 2];
    s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
    tree[n * 2 + 1] = tree[m * 2 + 1] = node;
    /* and insert the new node in the heap */ s.heap[1] = node++;
    pqdownheap(s, tree, 1 /*SMALLEST*/);
  } while (s.heap_len >= 2);
  s.heap[--s.heap_max] = s.heap[1];
  /* At this point, the fields freq and dad are set. We can now
   * generate the bit lengths.
   */ gen_bitlen(s, desc);
  /* The field len is now set, we can generate the bit codes */ gen_codes(
    tree,
    max_code,
    s.bl_count,
  );
}
/* ===========================================================================
 * Scan a literal or distance tree to determine the frequencies of the codes
 * in the bit length tree.
 */ function scan_tree(s, tree, max_code) {
  let n; /* iterates over all tree elements */
  let prevlen = -1; /* last emitted length */
  let curlen; /* length of current code */
  let nextlen = tree[0 * 2 + 1]; /* length of next code */
  let count = 0; /* repeat count of the current code */
  let max_count = 7; /* max repeat count */
  let min_count = 4; /* min repeat count */
  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  tree[(max_code + 1) * 2 + 1] = 65535; /* guard */
  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n + 1) * 2 + 1];
    if ((++count) < max_count && curlen === nextlen) {
      continue;
    } else if (count < min_count) {
      s.bl_tree[curlen * 2] += count;
    } else if (curlen !== 0) {
      if (curlen !== prevlen) s.bl_tree[curlen * 2]++;
      s.bl_tree[REP_3_6 * 2]++;
    } else if (count <= 10) {
      s.bl_tree[REPZ_3_10 * 2]++;
    } else {
      s.bl_tree[REPZ_11_138 * 2]++;
    }
    count = 0;
    prevlen = curlen;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;
    } else {
      max_count = 7;
      min_count = 4;
    }
  }
}
/* ===========================================================================
 * Send a literal or distance tree in compressed form, using the codes in
 * bl_tree.
 */ function send_tree(s, tree, max_code) {
  let n; /* iterates over all tree elements */
  let prevlen = -1; /* last emitted length */
  let curlen; /* length of current code */
  let nextlen = tree[0 * 2 + 1]; /* length of next code */
  let count = 0; /* repeat count of the current code */
  let max_count = 7; /* max repeat count */
  let min_count = 4; /* min repeat count */
  /* tree[max_code+1].Len = -1; */ /* guard already set */ if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n + 1) * 2 + 1];
    if ((++count) < max_count && curlen === nextlen) {
      continue;
    } else if (count < min_count) {
      do {
        send_code(s, curlen, s.bl_tree);
      } while ((--count) !== 0);
    } else if (curlen !== 0) {
      if (curlen !== prevlen) {
        send_code(s, curlen, s.bl_tree);
        count--;
      }
      //Assert(count >= 3 && count <= 6, " 3_6?");
      send_code(s, REP_3_6, s.bl_tree);
      send_bits(s, count - 3, 2);
    } else if (count <= 10) {
      send_code(s, REPZ_3_10, s.bl_tree);
      send_bits(s, count - 3, 3);
    } else {
      send_code(s, REPZ_11_138, s.bl_tree);
      send_bits(s, count - 11, 7);
    }
    count = 0;
    prevlen = curlen;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;
    } else {
      max_count = 7;
      min_count = 4;
    }
  }
}
/* ===========================================================================
 * Construct the Huffman tree for the bit lengths and return the index in
 * bl_order of the last bit length code to send.
 */ function build_bl_tree(s) {
  let max_blindex; /* index of last bit length code of non zero freq */
  /* Determine the bit length frequencies for literal and distance trees */ scan_tree(
    s,
    s.dyn_ltree,
    s.l_desc.max_code,
  );
  scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
  /* Build the bit length tree: */ build_tree(s, s.bl_desc);
  /* opt_len now includes the length of the tree representations, except
   * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
   */
  /* Determine the number of bit length codes to send. The pkzip format
   * requires that at least 4 bit length codes be sent. (appnote.txt says
   * 3 but the actual value used is 4.)
   */ for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) {
    if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) {
      break;
    }
  }
  /* Update opt_len to include the bit length tree and counts */ s.opt_len +=
    3 * (max_blindex + 1) + 5 + 5 + 4;
  //Tracev((stderr, "\ndyn trees: dyn %ld, stat %ld",
  //        s->opt_len, s->static_len));
  return max_blindex;
}
/* ===========================================================================
 * Send the header for a block using dynamic Huffman trees: the counts, the
 * lengths of the bit length codes, the literal tree and the distance tree.
 * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
 */ function send_all_trees(s, lcodes, dcodes, blcodes) {
  let rank; /* index in bl_order */
  //Assert (lcodes >= 257 && dcodes >= 1 && blcodes >= 4, "not enough codes");
  //Assert (lcodes <= L_CODES && dcodes <= D_CODES && blcodes <= BL_CODES,
  //        "too many codes");
  //Tracev((stderr, "\nbl counts: "));
  send_bits(s, lcodes - 257, 5); /* not +255 as stated in appnote.txt */
  send_bits(s, dcodes - 1, 5);
  send_bits(s, blcodes - 4, 4); /* not -3 as stated in appnote.txt */
  for (rank = 0; rank < blcodes; rank++) {
    //Tracev((stderr, "\nbl code %2d ", bl_order[rank]));
    send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1], /*.Len*/ 3);
  }
  //Tracev((stderr, "\nbl tree: sent %ld", s->bits_sent));
  send_tree(s, s.dyn_ltree, lcodes - 1); /* literal tree */
  //Tracev((stderr, "\nlit tree: sent %ld", s->bits_sent));
  send_tree(s, s.dyn_dtree, dcodes - 1); /* distance tree */
  //Tracev((stderr, "\ndist tree: sent %ld", s->bits_sent));
}
/* ===========================================================================
 * Check if the data type is TEXT or BINARY, using the following algorithm:
 * - TEXT if the two conditions below are satisfied:
 *    a) There are no non-portable control characters belonging to the
 *       "black list" (0..6, 14..25, 28..31).
 *    b) There is at least one printable character belonging to the
 *       "white list" (9 {TAB}, 10 {LF}, 13 {CR}, 32..255).
 * - BINARY otherwise.
 * - The following partially-portable control characters form a
 *   "gray list" that is ignored in this detection algorithm:
 *   (7 {BEL}, 8 {BS}, 11 {VT}, 12 {FF}, 26 {SUB}, 27 {ESC}).
 * IN assertion: the fields Freq of dyn_ltree are set.
 */ function detect_data_type(s) {
  /* black_mask is the bit mask of black-listed bytes
   * set bits 0..6, 14..25, and 28..31
   * 0xf3ffc07f = binary 11110011111111111100000001111111
   */ let black_mask = 4093624447;
  let n;
  /* Check for non-textual ("black-listed") bytes. */ for (
    n = 0; n <= 31; n++, black_mask >>>= 1
  ) {
    if (black_mask & 1 && s.dyn_ltree[n * 2] !== 0) {
      return Z_BINARY;
    }
  }
  /* Check for textual ("white-listed") bytes. */ if (
    s.dyn_ltree[9 * 2] !== 0 || s.dyn_ltree[10 * 2] !== 0 ||
    s.dyn_ltree[13 * 2] !== 0
  ) {
    return Z_TEXT;
  }
  for (n = 32; n < LITERALS; n++) {
    if (s.dyn_ltree[n * 2] !== 0) {
      return Z_TEXT;
    }
  }
  /* There are no "black-listed" or "white-listed" bytes:
   * this stream either is empty or has tolerated ("gray-listed") bytes only.
   */ return Z_BINARY;
}
let static_init_done = false;
/* ===========================================================================
 * Initialize the tree data structures for a new zlib stream.
 */ export function _tr_init(s) {
  if (!static_init_done) {
    tr_static_init();
    static_init_done = true;
  }
  s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
  s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
  s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
  s.bi_buf = 0;
  s.bi_valid = 0;
  /* Initialize the first block of the first file: */ init_block(s);
}
/* ===========================================================================
 * Send a stored block
 */ export function _tr_stored_block(s, buf, stored_len, last) //charf *buf;       /* input block */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
{
  send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3); /* send block type */
  copy_block(s, buf, stored_len, true); /* with header */
}
/* ===========================================================================
 * Send one empty static block to give enough lookahead for inflate.
 * This takes 10 bits, of which 7 may remain in the bit buffer.
 */ export function _tr_align(s) {
  send_bits(s, STATIC_TREES << 1, 3);
  send_code(s, END_BLOCK, static_ltree);
  bi_flush(s);
}
/* ===========================================================================
 * Determine the best encoding for the current block: dynamic trees, static
 * trees or store, and output the encoded block to the zip file.
 */ export function _tr_flush_block(s, buf, stored_len, last) {
  let opt_lenb, static_lenb; /* opt_len and static_len in bytes */
  let max_blindex = 0; /* index of last bit length code of non zero freq */
  /* Build the Huffman trees unless a stored block is forced */ if (
    s.level > 0
  ) {
    /* Check if the file is binary or text */ if (
      s.strm.data_type === Z_UNKNOWN
    ) {
      s.strm.data_type = detect_data_type(s);
    }
    /* Construct the literal and distance trees */ build_tree(s, s.l_desc);
    // Tracev((stderr, "\nlit data: dyn %ld, stat %ld", s->opt_len,
    //        s->static_len));
    build_tree(s, s.d_desc);
    // Tracev((stderr, "\ndist data: dyn %ld, stat %ld", s->opt_len,
    //        s->static_len));
    /* At this point, opt_len and static_len are the total bit lengths of
     * the compressed block data, excluding the tree representations.
     */
    /* Build the bit length tree for the above two trees, and get the index
     * in bl_order of the last bit length code to send.
     */ max_blindex = build_bl_tree(s);
    /* Determine the best encoding. Compute the block lengths in bytes. */ opt_lenb =
      s.opt_len + 3 + 7 >>> 3;
    static_lenb = s.static_len + 3 + 7 >>> 3;
    // Tracev((stderr, "\nopt %lu(%lu) stat %lu(%lu) stored %lu lit %u ",
    //        opt_lenb, s->opt_len, static_lenb, s->static_len, stored_len,
    //        s->last_lit));
    if (static_lenb <= opt_lenb) opt_lenb = static_lenb;
  } else {
    // Assert(buf != (char*)0, "lost buf");
    opt_lenb = static_lenb = stored_len + 5; /* force a stored block */
  }
  if (stored_len + 4 <= opt_lenb && buf !== -1) {
    /* 4: two words for the lengths */
    /* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
     * Otherwise we can't have processed more than WSIZE input bytes since
     * the last block flush, because compression would have been
     * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
     * transform a block into a stored block.
     */ _tr_stored_block(s, buf, stored_len, last);
  } else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {
    send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
    compress_block(s, static_ltree, static_dtree);
  } else {
    send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
    send_all_trees(
      s,
      s.l_desc.max_code + 1,
      s.d_desc.max_code + 1,
      max_blindex + 1,
    );
    compress_block(s, s.dyn_ltree, s.dyn_dtree);
  }
  // Assert (s->compressed_len == s->bits_sent, "bad compressed size");
  /* The above check is made mod 2^32, for files larger than 512 MB
   * and uLong implemented on 32 bits.
   */ init_block(s);
  if (last) {
    bi_windup(s);
  }
  // Tracev((stderr,"\ncomprlen %lu(%lu) ", s->compressed_len>>3,
  //       s->compressed_len-7*last));
}
/* ===========================================================================
 * Save the match info and tally the frequency counts. Return true if
 * the current block must be flushed.
 */ export function _tr_tally(s, dist, lc) {
  //let out_length, in_length, dcode;
  s.pending_buf[s.d_buf + s.last_lit * 2] = dist >>> 8 & 255;
  s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 255;
  s.pending_buf[s.l_buf + s.last_lit] = lc & 255;
  s.last_lit++;
  if (dist === 0) {
    /* lc is the unmatched char */ s.dyn_ltree[lc * 2]++;
  } else {
    s.matches++;
    /* Here, lc is the match length - MIN_MATCH */ dist--; /* dist = match distance - 1 */
    //Assert((ush)dist < (ush)MAX_DIST(s) &&
    //       (ush)lc <= (ush)(MAX_MATCH-MIN_MATCH) &&
    //       (ush)d_code(dist) < (ush)D_CODES,  "_tr_tally: bad match");
    s.dyn_ltree[(_length_code[lc] + LITERALS + 1) * 2]++;
    s.dyn_dtree[d_code(dist) * 2]++;
  }
  // (!) This block is disabled in zlib defaults,
  // don't enable it for binary compatibility
  //#ifdef TRUNCATE_BLOCK
  //  /* Try to guess if it is profitable to stop the current block here */
  //  if ((s.last_lit & 0x1fff) === 0 && s.level > 2) {
  //    /* Compute an upper bound for the compressed length */
  //    out_length = s.last_lit*8;
  //    in_length = s.strstart - s.block_start;
  //
  //    for (dcode = 0; dcode < D_CODES; dcode++) {
  //      out_length += s.dyn_dtree[dcode*2]/*.Freq*/ * (5 + extra_dbits[dcode]);
  //    }
  //    out_length >>>= 3;
  //    //Tracev((stderr,"\nlast_lit %u, in %ld, out ~%ld(%ld%%) ",
  //    //       s->last_lit, in_length, out_length,
  //    //       100L - out_length*100L/in_length));
  //    if (s.matches < (s.last_lit>>1)/*int /2*/ && out_length < (in_length>>1)/*int /2*/) {
  //      return true;
  //    }
  //  }
  //#endif
  return s.last_lit === s.lit_bufsize - 1;
  /* We avoid equality with lit_bufsize because of wraparound at 64K
   * on 16 bit machines and because stored blocks are restricted to
   * 64K-1 bytes.
   */
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2NvbXByZXNzQHYwLjMuNi96bGliL3psaWIvdHJlZXMudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8vY29uc3QgWl9GSUxURVJFRCAgICAgICAgICA9IDE7XG4vL2NvbnN0IFpfSFVGRk1BTl9PTkxZICAgICAgPSAyO1xuLy9jb25zdCBaX1JMRSAgICAgICAgICAgICAgID0gMztcbmNvbnN0IFpfRklYRUQgPSA0O1xuLy9jb25zdCBaX0RFRkFVTFRfU1RSQVRFR1kgID0gMDtcblxuLyogUG9zc2libGUgdmFsdWVzIG9mIHRoZSBkYXRhX3R5cGUgZmllbGQgKHRob3VnaCBzZWUgaW5mbGF0ZSgpKSAqL1xuY29uc3QgWl9CSU5BUlkgPSAwO1xuY29uc3QgWl9URVhUID0gMTtcbi8vY29uc3QgWl9BU0NJSSAgICAgICAgICAgICA9IDE7IC8vID0gWl9URVhUXG5jb25zdCBaX1VOS05PV04gPSAyO1xuXG5mdW5jdGlvbiB6ZXJvKGJ1ZjogYW55KSB7XG4gIGJ1Zi5maWxsKDAsIDAsIGJ1Zi5sZW5ndGgpO1xufVxuXG4vLyBGcm9tIHp1dGlsLmhcblxuY29uc3QgU1RPUkVEX0JMT0NLID0gMDtcbmNvbnN0IFNUQVRJQ19UUkVFUyA9IDE7XG5jb25zdCBEWU5fVFJFRVMgPSAyO1xuLyogVGhlIHRocmVlIGtpbmRzIG9mIGJsb2NrIHR5cGUgKi9cblxuY29uc3QgTUlOX01BVENIID0gMztcbmNvbnN0IE1BWF9NQVRDSCA9IDI1ODtcbi8qIFRoZSBtaW5pbXVtIGFuZCBtYXhpbXVtIG1hdGNoIGxlbmd0aHMgKi9cblxuLy8gRnJvbSBkZWZsYXRlLmhcbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogSW50ZXJuYWwgY29tcHJlc3Npb24gc3RhdGUuXG4gKi9cblxuY29uc3QgTEVOR1RIX0NPREVTID0gMjk7XG4vKiBudW1iZXIgb2YgbGVuZ3RoIGNvZGVzLCBub3QgY291bnRpbmcgdGhlIHNwZWNpYWwgRU5EX0JMT0NLIGNvZGUgKi9cblxuY29uc3QgTElURVJBTFMgPSAyNTY7XG4vKiBudW1iZXIgb2YgbGl0ZXJhbCBieXRlcyAwLi4yNTUgKi9cblxuY29uc3QgTF9DT0RFUyA9IExJVEVSQUxTICsgMSArIExFTkdUSF9DT0RFUztcbi8qIG51bWJlciBvZiBMaXRlcmFsIG9yIExlbmd0aCBjb2RlcywgaW5jbHVkaW5nIHRoZSBFTkRfQkxPQ0sgY29kZSAqL1xuXG5jb25zdCBEX0NPREVTID0gMzA7XG4vKiBudW1iZXIgb2YgZGlzdGFuY2UgY29kZXMgKi9cblxuY29uc3QgQkxfQ09ERVMgPSAxOTtcbi8qIG51bWJlciBvZiBjb2RlcyB1c2VkIHRvIHRyYW5zZmVyIHRoZSBiaXQgbGVuZ3RocyAqL1xuXG5jb25zdCBIRUFQX1NJWkUgPSAyICogTF9DT0RFUyArIDE7XG4vKiBtYXhpbXVtIGhlYXAgc2l6ZSAqL1xuXG5jb25zdCBNQVhfQklUUyA9IDE1O1xuLyogQWxsIGNvZGVzIG11c3Qgbm90IGV4Y2VlZCBNQVhfQklUUyBiaXRzICovXG5cbmNvbnN0IEJ1Zl9zaXplID0gMTY7XG4vKiBzaXplIG9mIGJpdCBidWZmZXIgaW4gYmlfYnVmICovXG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29uc3RhbnRzXG4gKi9cblxuY29uc3QgTUFYX0JMX0JJVFMgPSA3O1xuLyogQml0IGxlbmd0aCBjb2RlcyBtdXN0IG5vdCBleGNlZWQgTUFYX0JMX0JJVFMgYml0cyAqL1xuXG5jb25zdCBFTkRfQkxPQ0sgPSAyNTY7XG4vKiBlbmQgb2YgYmxvY2sgbGl0ZXJhbCBjb2RlICovXG5cbmNvbnN0IFJFUF8zXzYgPSAxNjtcbi8qIHJlcGVhdCBwcmV2aW91cyBiaXQgbGVuZ3RoIDMtNiB0aW1lcyAoMiBiaXRzIG9mIHJlcGVhdCBjb3VudCkgKi9cblxuY29uc3QgUkVQWl8zXzEwID0gMTc7XG4vKiByZXBlYXQgYSB6ZXJvIGxlbmd0aCAzLTEwIHRpbWVzICAoMyBiaXRzIG9mIHJlcGVhdCBjb3VudCkgKi9cblxuY29uc3QgUkVQWl8xMV8xMzggPSAxODtcbi8qIHJlcGVhdCBhIHplcm8gbGVuZ3RoIDExLTEzOCB0aW1lcyAgKDcgYml0cyBvZiByZXBlYXQgY291bnQpICovXG5cbi8qIGVzbGludC1kaXNhYmxlIGNvbW1hLXNwYWNpbmcsYXJyYXktYnJhY2tldC1zcGFjaW5nICovXG5jb25zdCBleHRyYV9sYml0cyA9IC8qIGV4dHJhIGJpdHMgZm9yIGVhY2ggbGVuZ3RoIGNvZGUgKi9cbiAgW1xuICAgIDAsXG4gICAgMCxcbiAgICAwLFxuICAgIDAsXG4gICAgMCxcbiAgICAwLFxuICAgIDAsXG4gICAgMCxcbiAgICAxLFxuICAgIDEsXG4gICAgMSxcbiAgICAxLFxuICAgIDIsXG4gICAgMixcbiAgICAyLFxuICAgIDIsXG4gICAgMyxcbiAgICAzLFxuICAgIDMsXG4gICAgMyxcbiAgICA0LFxuICAgIDQsXG4gICAgNCxcbiAgICA0LFxuICAgIDUsXG4gICAgNSxcbiAgICA1LFxuICAgIDUsXG4gICAgMCxcbiAgXTtcblxuY29uc3QgZXh0cmFfZGJpdHMgPSAvKiBleHRyYSBiaXRzIGZvciBlYWNoIGRpc3RhbmNlIGNvZGUgKi9cbiAgW1xuICAgIDAsXG4gICAgMCxcbiAgICAwLFxuICAgIDAsXG4gICAgMSxcbiAgICAxLFxuICAgIDIsXG4gICAgMixcbiAgICAzLFxuICAgIDMsXG4gICAgNCxcbiAgICA0LFxuICAgIDUsXG4gICAgNSxcbiAgICA2LFxuICAgIDYsXG4gICAgNyxcbiAgICA3LFxuICAgIDgsXG4gICAgOCxcbiAgICA5LFxuICAgIDksXG4gICAgMTAsXG4gICAgMTAsXG4gICAgMTEsXG4gICAgMTEsXG4gICAgMTIsXG4gICAgMTIsXG4gICAgMTMsXG4gICAgMTMsXG4gIF07XG5cbmNvbnN0IGV4dHJhX2JsYml0cyA9IC8qIGV4dHJhIGJpdHMgZm9yIGVhY2ggYml0IGxlbmd0aCBjb2RlICovXG4gIFswLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAyLCAzLCA3XTtcblxuY29uc3QgYmxfb3JkZXIgPSBbXG4gIDE2LFxuICAxNyxcbiAgMTgsXG4gIDAsXG4gIDgsXG4gIDcsXG4gIDksXG4gIDYsXG4gIDEwLFxuICA1LFxuICAxMSxcbiAgNCxcbiAgMTIsXG4gIDMsXG4gIDEzLFxuICAyLFxuICAxNCxcbiAgMSxcbiAgMTUsXG5dO1xuLyogZXNsaW50LWVuYWJsZSBjb21tYS1zcGFjaW5nLGFycmF5LWJyYWNrZXQtc3BhY2luZyAqL1xuXG4vKiBUaGUgbGVuZ3RocyBvZiB0aGUgYml0IGxlbmd0aCBjb2RlcyBhcmUgc2VudCBpbiBvcmRlciBvZiBkZWNyZWFzaW5nXG4gKiBwcm9iYWJpbGl0eSwgdG8gYXZvaWQgdHJhbnNtaXR0aW5nIHRoZSBsZW5ndGhzIGZvciB1bnVzZWQgYml0IGxlbmd0aCBjb2Rlcy5cbiAqL1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIExvY2FsIGRhdGEuIFRoZXNlIGFyZSBpbml0aWFsaXplZCBvbmx5IG9uY2UuXG4gKi9cblxuLy8gV2UgcHJlLWZpbGwgYXJyYXlzIHdpdGggMCB0byBhdm9pZCB1bmluaXRpYWxpemVkIGdhcHNcblxuY29uc3QgRElTVF9DT0RFX0xFTiA9IDUxMjsgLyogc2VlIGRlZmluaXRpb24gb2YgYXJyYXkgZGlzdF9jb2RlIGJlbG93ICovXG5cbi8vICEhISEgVXNlIGZsYXQgYXJyYXkgaW5zdGVhZCBvZiBzdHJ1Y3R1cmUsIEZyZXEgPSBpKjIsIExlbiA9IGkqMisxXG5jb25zdCBzdGF0aWNfbHRyZWUgPSBuZXcgQXJyYXkoKExfQ09ERVMgKyAyKSAqIDIpO1xuemVybyhzdGF0aWNfbHRyZWUpO1xuLyogVGhlIHN0YXRpYyBsaXRlcmFsIHRyZWUuIFNpbmNlIHRoZSBiaXQgbGVuZ3RocyBhcmUgaW1wb3NlZCwgdGhlcmUgaXMgbm9cbiAqIG5lZWQgZm9yIHRoZSBMX0NPREVTIGV4dHJhIGNvZGVzIHVzZWQgZHVyaW5nIGhlYXAgY29uc3RydWN0aW9uLiBIb3dldmVyXG4gKiBUaGUgY29kZXMgMjg2IGFuZCAyODcgYXJlIG5lZWRlZCB0byBidWlsZCBhIGNhbm9uaWNhbCB0cmVlIChzZWUgX3RyX2luaXRcbiAqIGJlbG93KS5cbiAqL1xuXG5jb25zdCBzdGF0aWNfZHRyZWUgPSBuZXcgQXJyYXkoRF9DT0RFUyAqIDIpO1xuemVybyhzdGF0aWNfZHRyZWUpO1xuLyogVGhlIHN0YXRpYyBkaXN0YW5jZSB0cmVlLiAoQWN0dWFsbHkgYSB0cml2aWFsIHRyZWUgc2luY2UgYWxsIGNvZGVzIHVzZVxuICogNSBiaXRzLilcbiAqL1xuXG5jb25zdCBfZGlzdF9jb2RlID0gbmV3IEFycmF5KERJU1RfQ09ERV9MRU4pO1xuemVybyhfZGlzdF9jb2RlKTtcbi8qIERpc3RhbmNlIGNvZGVzLiBUaGUgZmlyc3QgMjU2IHZhbHVlcyBjb3JyZXNwb25kIHRvIHRoZSBkaXN0YW5jZXNcbiAqIDMgLi4gMjU4LCB0aGUgbGFzdCAyNTYgdmFsdWVzIGNvcnJlc3BvbmQgdG8gdGhlIHRvcCA4IGJpdHMgb2ZcbiAqIHRoZSAxNSBiaXQgZGlzdGFuY2VzLlxuICovXG5cbmNvbnN0IF9sZW5ndGhfY29kZSA9IG5ldyBBcnJheShNQVhfTUFUQ0ggLSBNSU5fTUFUQ0ggKyAxKTtcbnplcm8oX2xlbmd0aF9jb2RlKTtcbi8qIGxlbmd0aCBjb2RlIGZvciBlYWNoIG5vcm1hbGl6ZWQgbWF0Y2ggbGVuZ3RoICgwID09IE1JTl9NQVRDSCkgKi9cblxuY29uc3QgYmFzZV9sZW5ndGggPSBuZXcgQXJyYXkoTEVOR1RIX0NPREVTKTtcbnplcm8oYmFzZV9sZW5ndGgpO1xuLyogRmlyc3Qgbm9ybWFsaXplZCBsZW5ndGggZm9yIGVhY2ggY29kZSAoMCA9IE1JTl9NQVRDSCkgKi9cblxuY29uc3QgYmFzZV9kaXN0ID0gbmV3IEFycmF5KERfQ09ERVMpO1xuemVybyhiYXNlX2Rpc3QpO1xuLyogRmlyc3Qgbm9ybWFsaXplZCBkaXN0YW5jZSBmb3IgZWFjaCBjb2RlICgwID0gZGlzdGFuY2Ugb2YgMSkgKi9cblxuY2xhc3MgU3RhdGljVHJlZURlc2Mge1xuICBzdGF0aWNfdHJlZTogYW55OyAvKiBzdGF0aWMgdHJlZSBvciBOVUxMICovXG4gIGV4dHJhX2JpdHM6IGFueTsgLyogZXh0cmEgYml0cyBmb3IgZWFjaCBjb2RlIG9yIE5VTEwgKi9cbiAgZXh0cmFfYmFzZTogYW55OyAvKiBiYXNlIGluZGV4IGZvciBleHRyYV9iaXRzICovXG4gIGVsZW1zOiBhbnk7IC8qIG1heCBudW1iZXIgb2YgZWxlbWVudHMgaW4gdGhlIHRyZWUgKi9cbiAgbWF4X2xlbmd0aDogYW55OyAvKiBtYXggYml0IGxlbmd0aCBmb3IgdGhlIGNvZGVzICovXG5cbiAgLy8gc2hvdyBpZiBgc3RhdGljX3RyZWVgIGhhcyBkYXRhIG9yIGR1bW15IC0gbmVlZGVkIGZvciBtb25vbW9ycGhpYyBvYmplY3RzXG4gIGhhc19zdHJlZTogYW55O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHN0YXRpY190cmVlOiBhbnksXG4gICAgZXh0cmFfYml0czogYW55LFxuICAgIGV4dHJhX2Jhc2U6IGFueSxcbiAgICBlbGVtczogYW55LFxuICAgIG1heF9sZW5ndGg6IGFueSxcbiAgKSB7XG4gICAgdGhpcy5zdGF0aWNfdHJlZSA9IHN0YXRpY190cmVlOyAvKiBzdGF0aWMgdHJlZSBvciBOVUxMICovXG4gICAgdGhpcy5leHRyYV9iaXRzID0gZXh0cmFfYml0czsgLyogZXh0cmEgYml0cyBmb3IgZWFjaCBjb2RlIG9yIE5VTEwgKi9cbiAgICB0aGlzLmV4dHJhX2Jhc2UgPSBleHRyYV9iYXNlOyAvKiBiYXNlIGluZGV4IGZvciBleHRyYV9iaXRzICovXG4gICAgdGhpcy5lbGVtcyA9IGVsZW1zOyAvKiBtYXggbnVtYmVyIG9mIGVsZW1lbnRzIGluIHRoZSB0cmVlICovXG4gICAgdGhpcy5tYXhfbGVuZ3RoID0gbWF4X2xlbmd0aDsgLyogbWF4IGJpdCBsZW5ndGggZm9yIHRoZSBjb2RlcyAqL1xuXG4gICAgLy8gc2hvdyBpZiBgc3RhdGljX3RyZWVgIGhhcyBkYXRhIG9yIGR1bW15IC0gbmVlZGVkIGZvciBtb25vbW9ycGhpYyBvYmplY3RzXG4gICAgdGhpcy5oYXNfc3RyZWUgPSBzdGF0aWNfdHJlZSAmJiBzdGF0aWNfdHJlZS5sZW5ndGg7XG4gIH1cbn1cblxubGV0IHN0YXRpY19sX2Rlc2M6IGFueTtcbmxldCBzdGF0aWNfZF9kZXNjOiBhbnk7XG5sZXQgc3RhdGljX2JsX2Rlc2M6IGFueTtcblxuY2xhc3MgVHJlZURlc2Mge1xuICBkeW5fdHJlZTogYW55OyAvKiB0aGUgZHluYW1pYyB0cmVlICovXG4gIG1heF9jb2RlOiBhbnk7IC8qIGxhcmdlc3QgY29kZSB3aXRoIG5vbiB6ZXJvIGZyZXF1ZW5jeSAqL1xuICBzdGF0X2Rlc2M6IGFueTsgLyogdGhlIGNvcnJlc3BvbmRpbmcgc3RhdGljIHRyZWUgKi9cblxuICBjb25zdHJ1Y3RvcihkeW5fdHJlZTogYW55LCBzdGF0X2Rlc2M6IGFueSkge1xuICAgIHRoaXMuZHluX3RyZWUgPSBkeW5fdHJlZTsgLyogdGhlIGR5bmFtaWMgdHJlZSAqL1xuICAgIHRoaXMubWF4X2NvZGUgPSAwOyAvKiBsYXJnZXN0IGNvZGUgd2l0aCBub24gemVybyBmcmVxdWVuY3kgKi9cbiAgICB0aGlzLnN0YXRfZGVzYyA9IHN0YXRfZGVzYzsgLyogdGhlIGNvcnJlc3BvbmRpbmcgc3RhdGljIHRyZWUgKi9cbiAgfVxufVxuXG5mdW5jdGlvbiBkX2NvZGUoZGlzdDogYW55KSB7XG4gIHJldHVybiBkaXN0IDwgMjU2ID8gX2Rpc3RfY29kZVtkaXN0XSA6IF9kaXN0X2NvZGVbMjU2ICsgKGRpc3QgPj4+IDcpXTtcbn1cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBPdXRwdXQgYSBzaG9ydCBMU0IgZmlyc3Qgb24gdGhlIHN0cmVhbS5cbiAqIElOIGFzc2VydGlvbjogdGhlcmUgaXMgZW5vdWdoIHJvb20gaW4gcGVuZGluZ0J1Zi5cbiAqL1xuZnVuY3Rpb24gcHV0X3Nob3J0KHM6IGFueSwgdzogYW55KSB7XG4gIC8vICAgIHB1dF9ieXRlKHMsICh1Y2gpKCh3KSAmIDB4ZmYpKTtcbiAgLy8gICAgcHV0X2J5dGUocywgKHVjaCkoKHVzaCkodykgPj4gOCkpO1xuICBzLnBlbmRpbmdfYnVmW3MucGVuZGluZysrXSA9ICh3KSAmIDB4ZmY7XG4gIHMucGVuZGluZ19idWZbcy5wZW5kaW5nKytdID0gKHcgPj4+IDgpICYgMHhmZjtcbn1cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBTZW5kIGEgdmFsdWUgb24gYSBnaXZlbiBudW1iZXIgb2YgYml0cy5cbiAqIElOIGFzc2VydGlvbjogbGVuZ3RoIDw9IDE2IGFuZCB2YWx1ZSBmaXRzIGluIGxlbmd0aCBiaXRzLlxuICovXG5mdW5jdGlvbiBzZW5kX2JpdHMoczogYW55LCB2YWx1ZTogYW55LCBsZW5ndGg6IGFueSkge1xuICBpZiAocy5iaV92YWxpZCA+IChCdWZfc2l6ZSAtIGxlbmd0aCkpIHtcbiAgICBzLmJpX2J1ZiB8PSAodmFsdWUgPDwgcy5iaV92YWxpZCkgJiAweGZmZmY7XG4gICAgcHV0X3Nob3J0KHMsIHMuYmlfYnVmKTtcbiAgICBzLmJpX2J1ZiA9IHZhbHVlID4+IChCdWZfc2l6ZSAtIHMuYmlfdmFsaWQpO1xuICAgIHMuYmlfdmFsaWQgKz0gbGVuZ3RoIC0gQnVmX3NpemU7XG4gIH0gZWxzZSB7XG4gICAgcy5iaV9idWYgfD0gKHZhbHVlIDw8IHMuYmlfdmFsaWQpICYgMHhmZmZmO1xuICAgIHMuYmlfdmFsaWQgKz0gbGVuZ3RoO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNlbmRfY29kZShzOiBhbnksIGM6IGFueSwgdHJlZTogYW55KSB7XG4gIHNlbmRfYml0cyhzLCB0cmVlW2MgKiAyXSwgLyouQ29kZSovIHRyZWVbYyAqIDIgKyAxXSAvKi5MZW4qLyk7XG59XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogUmV2ZXJzZSB0aGUgZmlyc3QgbGVuIGJpdHMgb2YgYSBjb2RlLCB1c2luZyBzdHJhaWdodGZvcndhcmQgY29kZSAoYSBmYXN0ZXJcbiAqIG1ldGhvZCB3b3VsZCB1c2UgYSB0YWJsZSlcbiAqIElOIGFzc2VydGlvbjogMSA8PSBsZW4gPD0gMTVcbiAqL1xuZnVuY3Rpb24gYmlfcmV2ZXJzZShjb2RlOiBhbnksIGxlbjogYW55KSB7XG4gIGxldCByZXMgPSAwO1xuICBkbyB7XG4gICAgcmVzIHw9IGNvZGUgJiAxO1xuICAgIGNvZGUgPj4+PSAxO1xuICAgIHJlcyA8PD0gMTtcbiAgfSB3aGlsZSAoLS1sZW4gPiAwKTtcbiAgcmV0dXJuIHJlcyA+Pj4gMTtcbn1cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBGbHVzaCB0aGUgYml0IGJ1ZmZlciwga2VlcGluZyBhdCBtb3N0IDcgYml0cyBpbiBpdC5cbiAqL1xuZnVuY3Rpb24gYmlfZmx1c2goczogYW55KSB7XG4gIGlmIChzLmJpX3ZhbGlkID09PSAxNikge1xuICAgIHB1dF9zaG9ydChzLCBzLmJpX2J1Zik7XG4gICAgcy5iaV9idWYgPSAwO1xuICAgIHMuYmlfdmFsaWQgPSAwO1xuICB9IGVsc2UgaWYgKHMuYmlfdmFsaWQgPj0gOCkge1xuICAgIHMucGVuZGluZ19idWZbcy5wZW5kaW5nKytdID0gcy5iaV9idWYgJiAweGZmO1xuICAgIHMuYmlfYnVmID4+PSA4O1xuICAgIHMuYmlfdmFsaWQgLT0gODtcbiAgfVxufVxuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvbXB1dGUgdGhlIG9wdGltYWwgYml0IGxlbmd0aHMgZm9yIGEgdHJlZSBhbmQgdXBkYXRlIHRoZSB0b3RhbCBiaXQgbGVuZ3RoXG4gKiBmb3IgdGhlIGN1cnJlbnQgYmxvY2suXG4gKiBJTiBhc3NlcnRpb246IHRoZSBmaWVsZHMgZnJlcSBhbmQgZGFkIGFyZSBzZXQsIGhlYXBbaGVhcF9tYXhdIGFuZFxuICogICAgYWJvdmUgYXJlIHRoZSB0cmVlIG5vZGVzIHNvcnRlZCBieSBpbmNyZWFzaW5nIGZyZXF1ZW5jeS5cbiAqIE9VVCBhc3NlcnRpb25zOiB0aGUgZmllbGQgbGVuIGlzIHNldCB0byB0aGUgb3B0aW1hbCBiaXQgbGVuZ3RoLCB0aGVcbiAqICAgICBhcnJheSBibF9jb3VudCBjb250YWlucyB0aGUgZnJlcXVlbmNpZXMgZm9yIGVhY2ggYml0IGxlbmd0aC5cbiAqICAgICBUaGUgbGVuZ3RoIG9wdF9sZW4gaXMgdXBkYXRlZDsgc3RhdGljX2xlbiBpcyBhbHNvIHVwZGF0ZWQgaWYgc3RyZWUgaXNcbiAqICAgICBub3QgbnVsbC5cbiAqL1xuZnVuY3Rpb24gZ2VuX2JpdGxlbihzOiBhbnksIGRlc2M6IGFueSkge1xuICBsZXQgdHJlZSA9IGRlc2MuZHluX3RyZWU7XG4gIGxldCBtYXhfY29kZSA9IGRlc2MubWF4X2NvZGU7XG4gIGxldCBzdHJlZSA9IGRlc2Muc3RhdF9kZXNjLnN0YXRpY190cmVlO1xuICBsZXQgaGFzX3N0cmVlID0gZGVzYy5zdGF0X2Rlc2MuaGFzX3N0cmVlO1xuICBsZXQgZXh0cmEgPSBkZXNjLnN0YXRfZGVzYy5leHRyYV9iaXRzO1xuICBsZXQgYmFzZSA9IGRlc2Muc3RhdF9kZXNjLmV4dHJhX2Jhc2U7XG4gIGxldCBtYXhfbGVuZ3RoID0gZGVzYy5zdGF0X2Rlc2MubWF4X2xlbmd0aDtcbiAgbGV0IGg7IC8qIGhlYXAgaW5kZXggKi9cbiAgbGV0IG4sIG07IC8qIGl0ZXJhdGUgb3ZlciB0aGUgdHJlZSBlbGVtZW50cyAqL1xuICBsZXQgYml0czsgLyogYml0IGxlbmd0aCAqL1xuICBsZXQgeGJpdHM7IC8qIGV4dHJhIGJpdHMgKi9cbiAgbGV0IGY7IC8qIGZyZXF1ZW5jeSAqL1xuICBsZXQgb3ZlcmZsb3cgPSAwOyAvKiBudW1iZXIgb2YgZWxlbWVudHMgd2l0aCBiaXQgbGVuZ3RoIHRvbyBsYXJnZSAqL1xuXG4gIGZvciAoYml0cyA9IDA7IGJpdHMgPD0gTUFYX0JJVFM7IGJpdHMrKykge1xuICAgIHMuYmxfY291bnRbYml0c10gPSAwO1xuICB9XG5cbiAgLyogSW4gYSBmaXJzdCBwYXNzLCBjb21wdXRlIHRoZSBvcHRpbWFsIGJpdCBsZW5ndGhzICh3aGljaCBtYXlcbiAgICogb3ZlcmZsb3cgaW4gdGhlIGNhc2Ugb2YgdGhlIGJpdCBsZW5ndGggdHJlZSkuXG4gICAqL1xuICB0cmVlW3MuaGVhcFtzLmhlYXBfbWF4XSAqIDIgKyAxXSAvKi5MZW4qLyA9IDA7IC8qIHJvb3Qgb2YgdGhlIGhlYXAgKi9cblxuICBmb3IgKGggPSBzLmhlYXBfbWF4ICsgMTsgaCA8IEhFQVBfU0laRTsgaCsrKSB7XG4gICAgbiA9IHMuaGVhcFtoXTtcbiAgICBiaXRzID0gdHJlZVt0cmVlW24gKiAyICsgMV0gLyouRGFkKi8gKiAyICsgMV0gLyouTGVuKi8gKyAxO1xuICAgIGlmIChiaXRzID4gbWF4X2xlbmd0aCkge1xuICAgICAgYml0cyA9IG1heF9sZW5ndGg7XG4gICAgICBvdmVyZmxvdysrO1xuICAgIH1cbiAgICB0cmVlW24gKiAyICsgMV0gLyouTGVuKi8gPSBiaXRzO1xuICAgIC8qIFdlIG92ZXJ3cml0ZSB0cmVlW25dLkRhZCB3aGljaCBpcyBubyBsb25nZXIgbmVlZGVkICovXG5cbiAgICBpZiAobiA+IG1heF9jb2RlKSBjb250aW51ZTsgLyogbm90IGEgbGVhZiBub2RlICovXG5cbiAgICBzLmJsX2NvdW50W2JpdHNdKys7XG4gICAgeGJpdHMgPSAwO1xuICAgIGlmIChuID49IGJhc2UpIHtcbiAgICAgIHhiaXRzID0gZXh0cmFbbiAtIGJhc2VdO1xuICAgIH1cbiAgICBmID0gdHJlZVtuICogMl0gLyouRnJlcSovO1xuICAgIHMub3B0X2xlbiArPSBmICogKGJpdHMgKyB4Yml0cyk7XG4gICAgaWYgKGhhc19zdHJlZSkge1xuICAgICAgcy5zdGF0aWNfbGVuICs9IGYgKiAoc3RyZWVbbiAqIDIgKyAxXSAvKi5MZW4qLyArIHhiaXRzKTtcbiAgICB9XG4gIH1cbiAgaWYgKG92ZXJmbG93ID09PSAwKSByZXR1cm47XG5cbiAgLy8gVHJhY2UoKHN0ZGVycixcIlxcbmJpdCBsZW5ndGggb3ZlcmZsb3dcXG5cIikpO1xuICAvKiBUaGlzIGhhcHBlbnMgZm9yIGV4YW1wbGUgb24gb2JqMiBhbmQgcGljIG9mIHRoZSBDYWxnYXJ5IGNvcnB1cyAqL1xuXG4gIC8qIEZpbmQgdGhlIGZpcnN0IGJpdCBsZW5ndGggd2hpY2ggY291bGQgaW5jcmVhc2U6ICovXG4gIGRvIHtcbiAgICBiaXRzID0gbWF4X2xlbmd0aCAtIDE7XG4gICAgd2hpbGUgKHMuYmxfY291bnRbYml0c10gPT09IDApIGJpdHMtLTtcbiAgICBzLmJsX2NvdW50W2JpdHNdLS07IC8qIG1vdmUgb25lIGxlYWYgZG93biB0aGUgdHJlZSAqL1xuICAgIHMuYmxfY291bnRbYml0cyArIDFdICs9IDI7IC8qIG1vdmUgb25lIG92ZXJmbG93IGl0ZW0gYXMgaXRzIGJyb3RoZXIgKi9cbiAgICBzLmJsX2NvdW50W21heF9sZW5ndGhdLS07XG4gICAgLyogVGhlIGJyb3RoZXIgb2YgdGhlIG92ZXJmbG93IGl0ZW0gYWxzbyBtb3ZlcyBvbmUgc3RlcCB1cCxcbiAgICAgKiBidXQgdGhpcyBkb2VzIG5vdCBhZmZlY3QgYmxfY291bnRbbWF4X2xlbmd0aF1cbiAgICAgKi9cbiAgICBvdmVyZmxvdyAtPSAyO1xuICB9IHdoaWxlIChvdmVyZmxvdyA+IDApO1xuXG4gIC8qIE5vdyByZWNvbXB1dGUgYWxsIGJpdCBsZW5ndGhzLCBzY2FubmluZyBpbiBpbmNyZWFzaW5nIGZyZXF1ZW5jeS5cbiAgICogaCBpcyBzdGlsbCBlcXVhbCB0byBIRUFQX1NJWkUuIChJdCBpcyBzaW1wbGVyIHRvIHJlY29uc3RydWN0IGFsbFxuICAgKiBsZW5ndGhzIGluc3RlYWQgb2YgZml4aW5nIG9ubHkgdGhlIHdyb25nIG9uZXMuIFRoaXMgaWRlYSBpcyB0YWtlblxuICAgKiBmcm9tICdhcicgd3JpdHRlbiBieSBIYXJ1aGlrbyBPa3VtdXJhLilcbiAgICovXG4gIGZvciAoYml0cyA9IG1heF9sZW5ndGg7IGJpdHMgIT09IDA7IGJpdHMtLSkge1xuICAgIG4gPSBzLmJsX2NvdW50W2JpdHNdO1xuICAgIHdoaWxlIChuICE9PSAwKSB7XG4gICAgICBtID0gcy5oZWFwWy0taF07XG4gICAgICBpZiAobSA+IG1heF9jb2RlKSBjb250aW51ZTtcbiAgICAgIGlmICh0cmVlW20gKiAyICsgMV0gLyouTGVuKi8gIT09IGJpdHMpIHtcbiAgICAgICAgLy8gVHJhY2UoKHN0ZGVycixcImNvZGUgJWQgYml0cyAlZC0+JWRcXG5cIiwgbSwgdHJlZVttXS5MZW4sIGJpdHMpKTtcbiAgICAgICAgcy5vcHRfbGVuICs9IChiaXRzIC0gdHJlZVttICogMiArIDFdIC8qLkxlbiovKSAqIHRyZWVbbSAqIDJdIC8qLkZyZXEqLztcbiAgICAgICAgdHJlZVttICogMiArIDFdIC8qLkxlbiovID0gYml0cztcbiAgICAgIH1cbiAgICAgIG4tLTtcbiAgICB9XG4gIH1cbn1cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBHZW5lcmF0ZSB0aGUgY29kZXMgZm9yIGEgZ2l2ZW4gdHJlZSBhbmQgYml0IGNvdW50cyAod2hpY2ggbmVlZCBub3QgYmVcbiAqIG9wdGltYWwpLlxuICogSU4gYXNzZXJ0aW9uOiB0aGUgYXJyYXkgYmxfY291bnQgY29udGFpbnMgdGhlIGJpdCBsZW5ndGggc3RhdGlzdGljcyBmb3JcbiAqIHRoZSBnaXZlbiB0cmVlIGFuZCB0aGUgZmllbGQgbGVuIGlzIHNldCBmb3IgYWxsIHRyZWUgZWxlbWVudHMuXG4gKiBPVVQgYXNzZXJ0aW9uOiB0aGUgZmllbGQgY29kZSBpcyBzZXQgZm9yIGFsbCB0cmVlIGVsZW1lbnRzIG9mIG5vblxuICogICAgIHplcm8gY29kZSBsZW5ndGguXG4gKi9cbmZ1bmN0aW9uIGdlbl9jb2Rlcyh0cmVlOiBhbnksIG1heF9jb2RlOiBhbnksIGJsX2NvdW50OiBhbnkpIHtcbiAgbGV0IG5leHRfY29kZSA9IG5ldyBBcnJheShcbiAgICBNQVhfQklUUyArIDEsXG4gICk7IC8qIG5leHQgY29kZSB2YWx1ZSBmb3IgZWFjaCBiaXQgbGVuZ3RoICovXG4gIGxldCBjb2RlID0gMDsgLyogcnVubmluZyBjb2RlIHZhbHVlICovXG4gIGxldCBiaXRzOyAvKiBiaXQgaW5kZXggKi9cbiAgbGV0IG47IC8qIGNvZGUgaW5kZXggKi9cblxuICAvKiBUaGUgZGlzdHJpYnV0aW9uIGNvdW50cyBhcmUgZmlyc3QgdXNlZCB0byBnZW5lcmF0ZSB0aGUgY29kZSB2YWx1ZXNcbiAgICogd2l0aG91dCBiaXQgcmV2ZXJzYWwuXG4gICAqL1xuICBmb3IgKGJpdHMgPSAxOyBiaXRzIDw9IE1BWF9CSVRTOyBiaXRzKyspIHtcbiAgICBuZXh0X2NvZGVbYml0c10gPSBjb2RlID0gKGNvZGUgKyBibF9jb3VudFtiaXRzIC0gMV0pIDw8IDE7XG4gIH1cbiAgLyogQ2hlY2sgdGhhdCB0aGUgYml0IGNvdW50cyBpbiBibF9jb3VudCBhcmUgY29uc2lzdGVudC4gVGhlIGxhc3QgY29kZVxuICAgKiBtdXN0IGJlIGFsbCBvbmVzLlxuICAgKi9cbiAgLy9Bc3NlcnQgKGNvZGUgKyBibF9jb3VudFtNQVhfQklUU10tMSA9PSAoMTw8TUFYX0JJVFMpLTEsXG4gIC8vICAgICAgICBcImluY29uc2lzdGVudCBiaXQgY291bnRzXCIpO1xuICAvL1RyYWNldigoc3RkZXJyLFwiXFxuZ2VuX2NvZGVzOiBtYXhfY29kZSAlZCBcIiwgbWF4X2NvZGUpKTtcblxuICBmb3IgKG4gPSAwOyBuIDw9IG1heF9jb2RlOyBuKyspIHtcbiAgICBsZXQgbGVuID0gdHJlZVtuICogMiArIDFdIC8qLkxlbiovO1xuICAgIGlmIChsZW4gPT09IDApIGNvbnRpbnVlO1xuICAgIC8qIE5vdyByZXZlcnNlIHRoZSBiaXRzICovXG4gICAgdHJlZVtuICogMl0gLyouQ29kZSovID0gYmlfcmV2ZXJzZShuZXh0X2NvZGVbbGVuXSsrLCBsZW4pO1xuXG4gICAgLy9UcmFjZWN2KHRyZWUgIT0gc3RhdGljX2x0cmVlLCAoc3RkZXJyLFwiXFxubiAlM2QgJWMgbCAlMmQgYyAlNHggKCV4KSBcIixcbiAgICAvLyAgICAgbiwgKGlzZ3JhcGgobikgPyBuIDogJyAnKSwgbGVuLCB0cmVlW25dLkNvZGUsIG5leHRfY29kZVtsZW5dLTEpKTtcbiAgfVxufVxuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEluaXRpYWxpemUgdGhlIHZhcmlvdXMgJ2NvbnN0YW50JyB0YWJsZXMuXG4gKi9cbmZ1bmN0aW9uIHRyX3N0YXRpY19pbml0KCkge1xuICBsZXQgbjsgLyogaXRlcmF0ZXMgb3ZlciB0cmVlIGVsZW1lbnRzICovXG4gIGxldCBiaXRzOyAvKiBiaXQgY291bnRlciAqL1xuICBsZXQgbGVuZ3RoOyAvKiBsZW5ndGggdmFsdWUgKi9cbiAgbGV0IGNvZGU7IC8qIGNvZGUgdmFsdWUgKi9cbiAgbGV0IGRpc3Q7IC8qIGRpc3RhbmNlIGluZGV4ICovXG4gIGxldCBibF9jb3VudCA9IG5ldyBBcnJheShNQVhfQklUUyArIDEpO1xuICAvKiBudW1iZXIgb2YgY29kZXMgYXQgZWFjaCBiaXQgbGVuZ3RoIGZvciBhbiBvcHRpbWFsIHRyZWUgKi9cblxuICAvLyBkbyBjaGVjayBpbiBfdHJfaW5pdCgpXG4gIC8vaWYgKHN0YXRpY19pbml0X2RvbmUpIHJldHVybjtcblxuICAvKiBGb3Igc29tZSBlbWJlZGRlZCB0YXJnZXRzLCBnbG9iYWwgdmFyaWFibGVzIGFyZSBub3QgaW5pdGlhbGl6ZWQ6ICovXG4gIC8qI2lmZGVmIE5PX0lOSVRfR0xPQkFMX1BPSU5URVJTXG4gIHN0YXRpY19sX2Rlc2Muc3RhdGljX3RyZWUgPSBzdGF0aWNfbHRyZWU7XG4gIHN0YXRpY19sX2Rlc2MuZXh0cmFfYml0cyA9IGV4dHJhX2xiaXRzO1xuICBzdGF0aWNfZF9kZXNjLnN0YXRpY190cmVlID0gc3RhdGljX2R0cmVlO1xuICBzdGF0aWNfZF9kZXNjLmV4dHJhX2JpdHMgPSBleHRyYV9kYml0cztcbiAgc3RhdGljX2JsX2Rlc2MuZXh0cmFfYml0cyA9IGV4dHJhX2JsYml0cztcbiNlbmRpZiovXG5cbiAgLyogSW5pdGlhbGl6ZSB0aGUgbWFwcGluZyBsZW5ndGggKDAuLjI1NSkgLT4gbGVuZ3RoIGNvZGUgKDAuLjI4KSAqL1xuICBsZW5ndGggPSAwO1xuICBmb3IgKGNvZGUgPSAwOyBjb2RlIDwgTEVOR1RIX0NPREVTIC0gMTsgY29kZSsrKSB7XG4gICAgYmFzZV9sZW5ndGhbY29kZV0gPSBsZW5ndGg7XG4gICAgZm9yIChuID0gMDsgbiA8ICgxIDw8IGV4dHJhX2xiaXRzW2NvZGVdKTsgbisrKSB7XG4gICAgICBfbGVuZ3RoX2NvZGVbbGVuZ3RoKytdID0gY29kZTtcbiAgICB9XG4gIH1cbiAgLy9Bc3NlcnQgKGxlbmd0aCA9PSAyNTYsIFwidHJfc3RhdGljX2luaXQ6IGxlbmd0aCAhPSAyNTZcIik7XG4gIC8qIE5vdGUgdGhhdCB0aGUgbGVuZ3RoIDI1NSAobWF0Y2ggbGVuZ3RoIDI1OCkgY2FuIGJlIHJlcHJlc2VudGVkXG4gICAqIGluIHR3byBkaWZmZXJlbnQgd2F5czogY29kZSAyODQgKyA1IGJpdHMgb3IgY29kZSAyODUsIHNvIHdlXG4gICAqIG92ZXJ3cml0ZSBsZW5ndGhfY29kZVsyNTVdIHRvIHVzZSB0aGUgYmVzdCBlbmNvZGluZzpcbiAgICovXG4gIF9sZW5ndGhfY29kZVtsZW5ndGggLSAxXSA9IGNvZGU7XG5cbiAgLyogSW5pdGlhbGl6ZSB0aGUgbWFwcGluZyBkaXN0ICgwLi4zMkspIC0+IGRpc3QgY29kZSAoMC4uMjkpICovXG4gIGRpc3QgPSAwO1xuICBmb3IgKGNvZGUgPSAwOyBjb2RlIDwgMTY7IGNvZGUrKykge1xuICAgIGJhc2VfZGlzdFtjb2RlXSA9IGRpc3Q7XG4gICAgZm9yIChuID0gMDsgbiA8ICgxIDw8IGV4dHJhX2RiaXRzW2NvZGVdKTsgbisrKSB7XG4gICAgICBfZGlzdF9jb2RlW2Rpc3QrK10gPSBjb2RlO1xuICAgIH1cbiAgfVxuICAvL0Fzc2VydCAoZGlzdCA9PSAyNTYsIFwidHJfc3RhdGljX2luaXQ6IGRpc3QgIT0gMjU2XCIpO1xuICBkaXN0ID4+PSA3OyAvKiBmcm9tIG5vdyBvbiwgYWxsIGRpc3RhbmNlcyBhcmUgZGl2aWRlZCBieSAxMjggKi9cbiAgZm9yICg7IGNvZGUgPCBEX0NPREVTOyBjb2RlKyspIHtcbiAgICBiYXNlX2Rpc3RbY29kZV0gPSBkaXN0IDw8IDc7XG4gICAgZm9yIChuID0gMDsgbiA8ICgxIDw8IChleHRyYV9kYml0c1tjb2RlXSAtIDcpKTsgbisrKSB7XG4gICAgICBfZGlzdF9jb2RlWzI1NiArIGRpc3QrK10gPSBjb2RlO1xuICAgIH1cbiAgfVxuICAvL0Fzc2VydCAoZGlzdCA9PSAyNTYsIFwidHJfc3RhdGljX2luaXQ6IDI1NitkaXN0ICE9IDUxMlwiKTtcblxuICAvKiBDb25zdHJ1Y3QgdGhlIGNvZGVzIG9mIHRoZSBzdGF0aWMgbGl0ZXJhbCB0cmVlICovXG4gIGZvciAoYml0cyA9IDA7IGJpdHMgPD0gTUFYX0JJVFM7IGJpdHMrKykge1xuICAgIGJsX2NvdW50W2JpdHNdID0gMDtcbiAgfVxuXG4gIG4gPSAwO1xuICB3aGlsZSAobiA8PSAxNDMpIHtcbiAgICBzdGF0aWNfbHRyZWVbbiAqIDIgKyAxXSAvKi5MZW4qLyA9IDg7XG4gICAgbisrO1xuICAgIGJsX2NvdW50WzhdKys7XG4gIH1cbiAgd2hpbGUgKG4gPD0gMjU1KSB7XG4gICAgc3RhdGljX2x0cmVlW24gKiAyICsgMV0gLyouTGVuKi8gPSA5O1xuICAgIG4rKztcbiAgICBibF9jb3VudFs5XSsrO1xuICB9XG4gIHdoaWxlIChuIDw9IDI3OSkge1xuICAgIHN0YXRpY19sdHJlZVtuICogMiArIDFdIC8qLkxlbiovID0gNztcbiAgICBuKys7XG4gICAgYmxfY291bnRbN10rKztcbiAgfVxuICB3aGlsZSAobiA8PSAyODcpIHtcbiAgICBzdGF0aWNfbHRyZWVbbiAqIDIgKyAxXSAvKi5MZW4qLyA9IDg7XG4gICAgbisrO1xuICAgIGJsX2NvdW50WzhdKys7XG4gIH1cbiAgLyogQ29kZXMgMjg2IGFuZCAyODcgZG8gbm90IGV4aXN0LCBidXQgd2UgbXVzdCBpbmNsdWRlIHRoZW0gaW4gdGhlXG4gICAqIHRyZWUgY29uc3RydWN0aW9uIHRvIGdldCBhIGNhbm9uaWNhbCBIdWZmbWFuIHRyZWUgKGxvbmdlc3QgY29kZVxuICAgKiBhbGwgb25lcylcbiAgICovXG4gIGdlbl9jb2RlcyhzdGF0aWNfbHRyZWUsIExfQ09ERVMgKyAxLCBibF9jb3VudCk7XG5cbiAgLyogVGhlIHN0YXRpYyBkaXN0YW5jZSB0cmVlIGlzIHRyaXZpYWw6ICovXG4gIGZvciAobiA9IDA7IG4gPCBEX0NPREVTOyBuKyspIHtcbiAgICBzdGF0aWNfZHRyZWVbbiAqIDIgKyAxXSAvKi5MZW4qLyA9IDU7XG4gICAgc3RhdGljX2R0cmVlW24gKiAyXSAvKi5Db2RlKi8gPSBiaV9yZXZlcnNlKG4sIDUpO1xuICB9XG5cbiAgLy8gTm93IGRhdGEgcmVhZHkgYW5kIHdlIGNhbiBpbml0IHN0YXRpYyB0cmVlc1xuICBzdGF0aWNfbF9kZXNjID0gbmV3IFN0YXRpY1RyZWVEZXNjKFxuICAgIHN0YXRpY19sdHJlZSxcbiAgICBleHRyYV9sYml0cyxcbiAgICBMSVRFUkFMUyArIDEsXG4gICAgTF9DT0RFUyxcbiAgICBNQVhfQklUUyxcbiAgKTtcbiAgc3RhdGljX2RfZGVzYyA9IG5ldyBTdGF0aWNUcmVlRGVzYyhcbiAgICBzdGF0aWNfZHRyZWUsXG4gICAgZXh0cmFfZGJpdHMsXG4gICAgMCxcbiAgICBEX0NPREVTLFxuICAgIE1BWF9CSVRTLFxuICApO1xuICBzdGF0aWNfYmxfZGVzYyA9IG5ldyBTdGF0aWNUcmVlRGVzYyhcbiAgICBuZXcgQXJyYXkoMCksXG4gICAgZXh0cmFfYmxiaXRzLFxuICAgIDAsXG4gICAgQkxfQ09ERVMsXG4gICAgTUFYX0JMX0JJVFMsXG4gICk7XG5cbiAgLy9zdGF0aWNfaW5pdF9kb25lID0gdHJ1ZTtcbn1cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBJbml0aWFsaXplIGEgbmV3IGJsb2NrLlxuICovXG5mdW5jdGlvbiBpbml0X2Jsb2NrKHM6IGFueSkge1xuICBsZXQgbjsgLyogaXRlcmF0ZXMgb3ZlciB0cmVlIGVsZW1lbnRzICovXG5cbiAgLyogSW5pdGlhbGl6ZSB0aGUgdHJlZXMuICovXG4gIGZvciAobiA9IDA7IG4gPCBMX0NPREVTOyBuKyspIHMuZHluX2x0cmVlW24gKiAyXSAvKi5GcmVxKi8gPSAwO1xuICBmb3IgKG4gPSAwOyBuIDwgRF9DT0RFUzsgbisrKSBzLmR5bl9kdHJlZVtuICogMl0gLyouRnJlcSovID0gMDtcbiAgZm9yIChuID0gMDsgbiA8IEJMX0NPREVTOyBuKyspIHMuYmxfdHJlZVtuICogMl0gLyouRnJlcSovID0gMDtcblxuICBzLmR5bl9sdHJlZVtFTkRfQkxPQ0sgKiAyXSAvKi5GcmVxKi8gPSAxO1xuICBzLm9wdF9sZW4gPSBzLnN0YXRpY19sZW4gPSAwO1xuICBzLmxhc3RfbGl0ID0gcy5tYXRjaGVzID0gMDtcbn1cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBGbHVzaCB0aGUgYml0IGJ1ZmZlciBhbmQgYWxpZ24gdGhlIG91dHB1dCBvbiBhIGJ5dGUgYm91bmRhcnlcbiAqL1xuZnVuY3Rpb24gYmlfd2luZHVwKHM6IGFueSkge1xuICBpZiAocy5iaV92YWxpZCA+IDgpIHtcbiAgICBwdXRfc2hvcnQocywgcy5iaV9idWYpO1xuICB9IGVsc2UgaWYgKHMuYmlfdmFsaWQgPiAwKSB7XG4gICAgLy9wdXRfYnl0ZShzLCAoQnl0ZSlzLT5iaV9idWYpO1xuICAgIHMucGVuZGluZ19idWZbcy5wZW5kaW5nKytdID0gcy5iaV9idWY7XG4gIH1cbiAgcy5iaV9idWYgPSAwO1xuICBzLmJpX3ZhbGlkID0gMDtcbn1cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDb3B5IGEgc3RvcmVkIGJsb2NrLCBzdG9yaW5nIGZpcnN0IHRoZSBsZW5ndGggYW5kIGl0c1xuICogb25lJ3MgY29tcGxlbWVudCBpZiByZXF1ZXN0ZWQuXG4gKi9cbmZ1bmN0aW9uIGNvcHlfYmxvY2soczogYW55LCBidWY6IGFueSwgbGVuOiBhbnksIGhlYWRlcjogYW55KSB7XG4gIGJpX3dpbmR1cChzKTsgLyogYWxpZ24gb24gYnl0ZSBib3VuZGFyeSAqL1xuXG4gIGlmIChoZWFkZXIpIHtcbiAgICBwdXRfc2hvcnQocywgbGVuKTtcbiAgICBwdXRfc2hvcnQocywgfmxlbik7XG4gIH1cbiAgLy8gIHdoaWxlIChsZW4tLSkge1xuICAvLyAgICBwdXRfYnl0ZShzLCAqYnVmKyspO1xuICAvLyAgfVxuICBzLnBlbmRpbmdfYnVmLnNldChzLndpbmRvdy5zdWJhcnJheShidWYsIGJ1ZiArIGxlbiksIHMucGVuZGluZyk7XG4gIHMucGVuZGluZyArPSBsZW47XG59XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29tcGFyZXMgdG8gc3VidHJlZXMsIHVzaW5nIHRoZSB0cmVlIGRlcHRoIGFzIHRpZSBicmVha2VyIHdoZW5cbiAqIHRoZSBzdWJ0cmVlcyBoYXZlIGVxdWFsIGZyZXF1ZW5jeS4gVGhpcyBtaW5pbWl6ZXMgdGhlIHdvcnN0IGNhc2UgbGVuZ3RoLlxuICovXG5mdW5jdGlvbiBzbWFsbGVyKHRyZWU6IGFueSwgbjogYW55LCBtOiBhbnksIGRlcHRoOiBhbnkpIHtcbiAgbGV0IF9uMiA9IG4gKiAyO1xuICBsZXQgX20yID0gbSAqIDI7XG4gIHJldHVybiAodHJlZVtfbjJdIC8qLkZyZXEqLyA8IHRyZWVbX20yXSAvKi5GcmVxKi8gIHx8XG4gICAgKHRyZWVbX24yXSAvKi5GcmVxKi8gPT09IHRyZWVbX20yXSAvKi5GcmVxKi8gJiYgZGVwdGhbbl0gPD0gZGVwdGhbbV0pKTtcbn1cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBSZXN0b3JlIHRoZSBoZWFwIHByb3BlcnR5IGJ5IG1vdmluZyBkb3duIHRoZSB0cmVlIHN0YXJ0aW5nIGF0IG5vZGUgayxcbiAqIGV4Y2hhbmdpbmcgYSBub2RlIHdpdGggdGhlIHNtYWxsZXN0IG9mIGl0cyB0d28gc29ucyBpZiBuZWNlc3NhcnksIHN0b3BwaW5nXG4gKiB3aGVuIHRoZSBoZWFwIHByb3BlcnR5IGlzIHJlLWVzdGFibGlzaGVkIChlYWNoIGZhdGhlciBzbWFsbGVyIHRoYW4gaXRzXG4gKiB0d28gc29ucykuXG4gKi9cbmZ1bmN0aW9uIHBxZG93bmhlYXAoczogYW55LCB0cmVlOiBhbnksIGs6IGFueSkgLy8gICAgZGVmbGF0ZV9zdGF0ZSAqcztcbi8vICAgIGN0X2RhdGEgKnRyZWU7ICAvKiB0aGUgdHJlZSB0byByZXN0b3JlICovXG4vLyAgICBpbnQgazsgICAgICAgICAgICAgICAvKiBub2RlIHRvIG1vdmUgZG93biAqL1xue1xuICBsZXQgdiA9IHMuaGVhcFtrXTtcbiAgbGV0IGogPSBrIDw8IDE7IC8qIGxlZnQgc29uIG9mIGsgKi9cbiAgd2hpbGUgKGogPD0gcy5oZWFwX2xlbikge1xuICAgIC8qIFNldCBqIHRvIHRoZSBzbWFsbGVzdCBvZiB0aGUgdHdvIHNvbnM6ICovXG4gICAgaWYgKFxuICAgICAgaiA8IHMuaGVhcF9sZW4gJiZcbiAgICAgIHNtYWxsZXIodHJlZSwgcy5oZWFwW2ogKyAxXSwgcy5oZWFwW2pdLCBzLmRlcHRoKVxuICAgICkge1xuICAgICAgaisrO1xuICAgIH1cbiAgICAvKiBFeGl0IGlmIHYgaXMgc21hbGxlciB0aGFuIGJvdGggc29ucyAqL1xuICAgIGlmIChzbWFsbGVyKHRyZWUsIHYsIHMuaGVhcFtqXSwgcy5kZXB0aCkpIGJyZWFrO1xuXG4gICAgLyogRXhjaGFuZ2UgdiB3aXRoIHRoZSBzbWFsbGVzdCBzb24gKi9cbiAgICBzLmhlYXBba10gPSBzLmhlYXBbal07XG4gICAgayA9IGo7XG5cbiAgICAvKiBBbmQgY29udGludWUgZG93biB0aGUgdHJlZSwgc2V0dGluZyBqIHRvIHRoZSBsZWZ0IHNvbiBvZiBrICovXG4gICAgaiA8PD0gMTtcbiAgfVxuICBzLmhlYXBba10gPSB2O1xufVxuXG4vLyBpbmxpbmVkIG1hbnVhbGx5XG4vLyBsZXQgU01BTExFU1QgPSAxO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIFNlbmQgdGhlIGJsb2NrIGRhdGEgY29tcHJlc3NlZCB1c2luZyB0aGUgZ2l2ZW4gSHVmZm1hbiB0cmVlc1xuICovXG5mdW5jdGlvbiBjb21wcmVzc19ibG9jayhzOiBhbnksIGx0cmVlOiBhbnksIGR0cmVlOiBhbnkpIHtcbiAgbGV0IGRpc3Q7IC8qIGRpc3RhbmNlIG9mIG1hdGNoZWQgc3RyaW5nICovXG4gIGxldCBsYzsgLyogbWF0Y2ggbGVuZ3RoIG9yIHVubWF0Y2hlZCBjaGFyIChpZiBkaXN0ID09IDApICovXG4gIGxldCBseCA9IDA7IC8qIHJ1bm5pbmcgaW5kZXggaW4gbF9idWYgKi9cbiAgbGV0IGNvZGU7IC8qIHRoZSBjb2RlIHRvIHNlbmQgKi9cbiAgbGV0IGV4dHJhOyAvKiBudW1iZXIgb2YgZXh0cmEgYml0cyB0byBzZW5kICovXG5cbiAgaWYgKHMubGFzdF9saXQgIT09IDApIHtcbiAgICBkbyB7XG4gICAgICBkaXN0ID0gKHMucGVuZGluZ19idWZbcy5kX2J1ZiArIGx4ICogMl0gPDwgOCkgfFxuICAgICAgICAocy5wZW5kaW5nX2J1ZltzLmRfYnVmICsgbHggKiAyICsgMV0pO1xuICAgICAgbGMgPSBzLnBlbmRpbmdfYnVmW3MubF9idWYgKyBseF07XG4gICAgICBseCsrO1xuXG4gICAgICBpZiAoZGlzdCA9PT0gMCkge1xuICAgICAgICBzZW5kX2NvZGUocywgbGMsIGx0cmVlKTsgLyogc2VuZCBhIGxpdGVyYWwgYnl0ZSAqL1xuICAgICAgICAvL1RyYWNlY3YoaXNncmFwaChsYyksIChzdGRlcnIsXCIgJyVjJyBcIiwgbGMpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8qIEhlcmUsIGxjIGlzIHRoZSBtYXRjaCBsZW5ndGggLSBNSU5fTUFUQ0ggKi9cbiAgICAgICAgY29kZSA9IF9sZW5ndGhfY29kZVtsY107XG4gICAgICAgIHNlbmRfY29kZShzLCBjb2RlICsgTElURVJBTFMgKyAxLCBsdHJlZSk7IC8qIHNlbmQgdGhlIGxlbmd0aCBjb2RlICovXG4gICAgICAgIGV4dHJhID0gZXh0cmFfbGJpdHNbY29kZV07XG4gICAgICAgIGlmIChleHRyYSAhPT0gMCkge1xuICAgICAgICAgIGxjIC09IGJhc2VfbGVuZ3RoW2NvZGVdO1xuICAgICAgICAgIHNlbmRfYml0cyhzLCBsYywgZXh0cmEpOyAvKiBzZW5kIHRoZSBleHRyYSBsZW5ndGggYml0cyAqL1xuICAgICAgICB9XG4gICAgICAgIGRpc3QtLTsgLyogZGlzdCBpcyBub3cgdGhlIG1hdGNoIGRpc3RhbmNlIC0gMSAqL1xuICAgICAgICBjb2RlID0gZF9jb2RlKGRpc3QpO1xuICAgICAgICAvL0Fzc2VydCAoY29kZSA8IERfQ09ERVMsIFwiYmFkIGRfY29kZVwiKTtcblxuICAgICAgICBzZW5kX2NvZGUocywgY29kZSwgZHRyZWUpOyAvKiBzZW5kIHRoZSBkaXN0YW5jZSBjb2RlICovXG4gICAgICAgIGV4dHJhID0gZXh0cmFfZGJpdHNbY29kZV07XG4gICAgICAgIGlmIChleHRyYSAhPT0gMCkge1xuICAgICAgICAgIGRpc3QgLT0gYmFzZV9kaXN0W2NvZGVdO1xuICAgICAgICAgIHNlbmRfYml0cyhzLCBkaXN0LCBleHRyYSk7IC8qIHNlbmQgdGhlIGV4dHJhIGRpc3RhbmNlIGJpdHMgKi9cbiAgICAgICAgfVxuICAgICAgfSAvKiBsaXRlcmFsIG9yIG1hdGNoIHBhaXIgPyAqL1xuXG4gICAgICAvKiBDaGVjayB0aGF0IHRoZSBvdmVybGF5IGJldHdlZW4gcGVuZGluZ19idWYgYW5kIGRfYnVmK2xfYnVmIGlzIG9rOiAqL1xuICAgICAgLy9Bc3NlcnQoKHVJbnQpKHMtPnBlbmRpbmcpIDwgcy0+bGl0X2J1ZnNpemUgKyAyKmx4LFxuICAgICAgLy8gICAgICAgXCJwZW5kaW5nQnVmIG92ZXJmbG93XCIpO1xuICAgIH0gd2hpbGUgKGx4IDwgcy5sYXN0X2xpdCk7XG4gIH1cblxuICBzZW5kX2NvZGUocywgRU5EX0JMT0NLLCBsdHJlZSk7XG59XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogQ29uc3RydWN0IG9uZSBIdWZmbWFuIHRyZWUgYW5kIGFzc2lnbnMgdGhlIGNvZGUgYml0IHN0cmluZ3MgYW5kIGxlbmd0aHMuXG4gKiBVcGRhdGUgdGhlIHRvdGFsIGJpdCBsZW5ndGggZm9yIHRoZSBjdXJyZW50IGJsb2NrLlxuICogSU4gYXNzZXJ0aW9uOiB0aGUgZmllbGQgZnJlcSBpcyBzZXQgZm9yIGFsbCB0cmVlIGVsZW1lbnRzLlxuICogT1VUIGFzc2VydGlvbnM6IHRoZSBmaWVsZHMgbGVuIGFuZCBjb2RlIGFyZSBzZXQgdG8gdGhlIG9wdGltYWwgYml0IGxlbmd0aFxuICogICAgIGFuZCBjb3JyZXNwb25kaW5nIGNvZGUuIFRoZSBsZW5ndGggb3B0X2xlbiBpcyB1cGRhdGVkOyBzdGF0aWNfbGVuIGlzXG4gKiAgICAgYWxzbyB1cGRhdGVkIGlmIHN0cmVlIGlzIG5vdCBudWxsLiBUaGUgZmllbGQgbWF4X2NvZGUgaXMgc2V0LlxuICovXG5mdW5jdGlvbiBidWlsZF90cmVlKHM6IGFueSwgZGVzYzogYW55KSB7XG4gIGxldCB0cmVlID0gZGVzYy5keW5fdHJlZTtcbiAgbGV0IHN0cmVlID0gZGVzYy5zdGF0X2Rlc2Muc3RhdGljX3RyZWU7XG4gIGxldCBoYXNfc3RyZWUgPSBkZXNjLnN0YXRfZGVzYy5oYXNfc3RyZWU7XG4gIGxldCBlbGVtcyA9IGRlc2Muc3RhdF9kZXNjLmVsZW1zO1xuICBsZXQgbiwgbTsgLyogaXRlcmF0ZSBvdmVyIGhlYXAgZWxlbWVudHMgKi9cbiAgbGV0IG1heF9jb2RlID0gLTE7IC8qIGxhcmdlc3QgY29kZSB3aXRoIG5vbiB6ZXJvIGZyZXF1ZW5jeSAqL1xuICBsZXQgbm9kZTsgLyogbmV3IG5vZGUgYmVpbmcgY3JlYXRlZCAqL1xuXG4gIC8qIENvbnN0cnVjdCB0aGUgaW5pdGlhbCBoZWFwLCB3aXRoIGxlYXN0IGZyZXF1ZW50IGVsZW1lbnQgaW5cbiAgICogaGVhcFtTTUFMTEVTVF0uIFRoZSBzb25zIG9mIGhlYXBbbl0gYXJlIGhlYXBbMipuXSBhbmQgaGVhcFsyKm4rMV0uXG4gICAqIGhlYXBbMF0gaXMgbm90IHVzZWQuXG4gICAqL1xuICBzLmhlYXBfbGVuID0gMDtcbiAgcy5oZWFwX21heCA9IEhFQVBfU0laRTtcblxuICBmb3IgKG4gPSAwOyBuIDwgZWxlbXM7IG4rKykge1xuICAgIGlmICh0cmVlW24gKiAyXSAvKi5GcmVxKi8gIT09IDApIHtcbiAgICAgIHMuaGVhcFsrK3MuaGVhcF9sZW5dID0gbWF4X2NvZGUgPSBuO1xuICAgICAgcy5kZXB0aFtuXSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyZWVbbiAqIDIgKyAxXSAvKi5MZW4qLyA9IDA7XG4gICAgfVxuICB9XG5cbiAgLyogVGhlIHBremlwIGZvcm1hdCByZXF1aXJlcyB0aGF0IGF0IGxlYXN0IG9uZSBkaXN0YW5jZSBjb2RlIGV4aXN0cyxcbiAgICogYW5kIHRoYXQgYXQgbGVhc3Qgb25lIGJpdCBzaG91bGQgYmUgc2VudCBldmVuIGlmIHRoZXJlIGlzIG9ubHkgb25lXG4gICAqIHBvc3NpYmxlIGNvZGUuIFNvIHRvIGF2b2lkIHNwZWNpYWwgY2hlY2tzIGxhdGVyIG9uIHdlIGZvcmNlIGF0IGxlYXN0XG4gICAqIHR3byBjb2RlcyBvZiBub24gemVybyBmcmVxdWVuY3kuXG4gICAqL1xuICB3aGlsZSAocy5oZWFwX2xlbiA8IDIpIHtcbiAgICBub2RlID0gcy5oZWFwWysrcy5oZWFwX2xlbl0gPSAobWF4X2NvZGUgPCAyID8gKyttYXhfY29kZSA6IDApO1xuICAgIHRyZWVbbm9kZSAqIDJdIC8qLkZyZXEqLyA9IDE7XG4gICAgcy5kZXB0aFtub2RlXSA9IDA7XG4gICAgcy5vcHRfbGVuLS07XG5cbiAgICBpZiAoaGFzX3N0cmVlKSB7XG4gICAgICBzLnN0YXRpY19sZW4gLT0gc3RyZWVbbm9kZSAqIDIgKyAxXSAvKi5MZW4qLztcbiAgICB9XG4gICAgLyogbm9kZSBpcyAwIG9yIDEgc28gaXQgZG9lcyBub3QgaGF2ZSBleHRyYSBiaXRzICovXG4gIH1cbiAgZGVzYy5tYXhfY29kZSA9IG1heF9jb2RlO1xuXG4gIC8qIFRoZSBlbGVtZW50cyBoZWFwW2hlYXBfbGVuLzIrMSAuLiBoZWFwX2xlbl0gYXJlIGxlYXZlcyBvZiB0aGUgdHJlZSxcbiAgICogZXN0YWJsaXNoIHN1Yi1oZWFwcyBvZiBpbmNyZWFzaW5nIGxlbmd0aHM6XG4gICAqL1xuICBmb3IgKG4gPSAocy5oZWFwX2xlbiA+PiAxIC8qaW50IC8yKi8pOyBuID49IDE7IG4tLSkgcHFkb3duaGVhcChzLCB0cmVlLCBuKTtcblxuICAvKiBDb25zdHJ1Y3QgdGhlIEh1ZmZtYW4gdHJlZSBieSByZXBlYXRlZGx5IGNvbWJpbmluZyB0aGUgbGVhc3QgdHdvXG4gICAqIGZyZXF1ZW50IG5vZGVzLlxuICAgKi9cbiAgbm9kZSA9IGVsZW1zOyAvKiBuZXh0IGludGVybmFsIG5vZGUgb2YgdGhlIHRyZWUgKi9cbiAgZG8ge1xuICAgIC8vcHFyZW1vdmUocywgdHJlZSwgbik7ICAvKiBuID0gbm9kZSBvZiBsZWFzdCBmcmVxdWVuY3kgKi9cbiAgICAvKioqIHBxcmVtb3ZlICoqKi9cbiAgICBuID0gcy5oZWFwWzEvKlNNQUxMRVNUKi9cbiAgICBdO1xuICAgIHMuaGVhcFsxLypTTUFMTEVTVCovXG4gICAgXSA9IHMuaGVhcFtzLmhlYXBfbGVuLS1dO1xuICAgIHBxZG93bmhlYXAocywgdHJlZSwgMSAvKlNNQUxMRVNUKi8pO1xuICAgIC8qKiovXG5cbiAgICBtID0gcy5oZWFwWzEvKlNNQUxMRVNUKi9cbiAgICBdOyAvKiBtID0gbm9kZSBvZiBuZXh0IGxlYXN0IGZyZXF1ZW5jeSAqL1xuXG4gICAgcy5oZWFwWy0tcy5oZWFwX21heF0gPSBuOyAvKiBrZWVwIHRoZSBub2RlcyBzb3J0ZWQgYnkgZnJlcXVlbmN5ICovXG4gICAgcy5oZWFwWy0tcy5oZWFwX21heF0gPSBtO1xuXG4gICAgLyogQ3JlYXRlIGEgbmV3IG5vZGUgZmF0aGVyIG9mIG4gYW5kIG0gKi9cbiAgICB0cmVlW25vZGUgKiAyXSAvKi5GcmVxKi8gPSB0cmVlW24gKiAyXSAvKi5GcmVxKi8gKyB0cmVlW20gKiAyXSAvKi5GcmVxKi87XG4gICAgcy5kZXB0aFtub2RlXSA9IChzLmRlcHRoW25dID49IHMuZGVwdGhbbV0gPyBzLmRlcHRoW25dIDogcy5kZXB0aFttXSkgKyAxO1xuICAgIHRyZWVbbiAqIDIgKyAxXSAvKi5EYWQqLyA9IHRyZWVbbSAqIDIgKyAxXSAvKi5EYWQqLyA9IG5vZGU7XG5cbiAgICAvKiBhbmQgaW5zZXJ0IHRoZSBuZXcgbm9kZSBpbiB0aGUgaGVhcCAqL1xuICAgIHMuaGVhcFsxLypTTUFMTEVTVCovXG4gICAgXSA9IG5vZGUrKztcbiAgICBwcWRvd25oZWFwKHMsIHRyZWUsIDEgLypTTUFMTEVTVCovKTtcbiAgfSB3aGlsZSAocy5oZWFwX2xlbiA+PSAyKTtcblxuICBzLmhlYXBbLS1zLmhlYXBfbWF4XSA9IHMuaGVhcFsxLypTTUFMTEVTVCovXG4gIF07XG5cbiAgLyogQXQgdGhpcyBwb2ludCwgdGhlIGZpZWxkcyBmcmVxIGFuZCBkYWQgYXJlIHNldC4gV2UgY2FuIG5vd1xuICAgKiBnZW5lcmF0ZSB0aGUgYml0IGxlbmd0aHMuXG4gICAqL1xuICBnZW5fYml0bGVuKHMsIGRlc2MpO1xuXG4gIC8qIFRoZSBmaWVsZCBsZW4gaXMgbm93IHNldCwgd2UgY2FuIGdlbmVyYXRlIHRoZSBiaXQgY29kZXMgKi9cbiAgZ2VuX2NvZGVzKHRyZWUsIG1heF9jb2RlLCBzLmJsX2NvdW50KTtcbn1cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBTY2FuIGEgbGl0ZXJhbCBvciBkaXN0YW5jZSB0cmVlIHRvIGRldGVybWluZSB0aGUgZnJlcXVlbmNpZXMgb2YgdGhlIGNvZGVzXG4gKiBpbiB0aGUgYml0IGxlbmd0aCB0cmVlLlxuICovXG5mdW5jdGlvbiBzY2FuX3RyZWUoczogYW55LCB0cmVlOiBhbnksIG1heF9jb2RlOiBhbnkpIHtcbiAgbGV0IG47IC8qIGl0ZXJhdGVzIG92ZXIgYWxsIHRyZWUgZWxlbWVudHMgKi9cbiAgbGV0IHByZXZsZW4gPSAtMTsgLyogbGFzdCBlbWl0dGVkIGxlbmd0aCAqL1xuICBsZXQgY3VybGVuOyAvKiBsZW5ndGggb2YgY3VycmVudCBjb2RlICovXG5cbiAgbGV0IG5leHRsZW4gPSB0cmVlWzAgKiAyICsgMV0gLyouTGVuKi87IC8qIGxlbmd0aCBvZiBuZXh0IGNvZGUgKi9cblxuICBsZXQgY291bnQgPSAwOyAvKiByZXBlYXQgY291bnQgb2YgdGhlIGN1cnJlbnQgY29kZSAqL1xuICBsZXQgbWF4X2NvdW50ID0gNzsgLyogbWF4IHJlcGVhdCBjb3VudCAqL1xuICBsZXQgbWluX2NvdW50ID0gNDsgLyogbWluIHJlcGVhdCBjb3VudCAqL1xuXG4gIGlmIChuZXh0bGVuID09PSAwKSB7XG4gICAgbWF4X2NvdW50ID0gMTM4O1xuICAgIG1pbl9jb3VudCA9IDM7XG4gIH1cbiAgdHJlZVsobWF4X2NvZGUgKyAxKSAqIDIgKyAxXSAvKi5MZW4qLyA9IDB4ZmZmZjsgLyogZ3VhcmQgKi9cblxuICBmb3IgKG4gPSAwOyBuIDw9IG1heF9jb2RlOyBuKyspIHtcbiAgICBjdXJsZW4gPSBuZXh0bGVuO1xuICAgIG5leHRsZW4gPSB0cmVlWyhuICsgMSkgKiAyICsgMV0gLyouTGVuKi87XG5cbiAgICBpZiAoKytjb3VudCA8IG1heF9jb3VudCAmJiBjdXJsZW4gPT09IG5leHRsZW4pIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH0gZWxzZSBpZiAoY291bnQgPCBtaW5fY291bnQpIHtcbiAgICAgIHMuYmxfdHJlZVtjdXJsZW4gKiAyXSAvKi5GcmVxKi8gKz0gY291bnQ7XG4gICAgfSBlbHNlIGlmIChjdXJsZW4gIT09IDApIHtcbiAgICAgIGlmIChjdXJsZW4gIT09IHByZXZsZW4pIHMuYmxfdHJlZVtjdXJsZW4gKiAyXSAvKi5GcmVxKi8rKztcbiAgICAgIHMuYmxfdHJlZVtSRVBfM182ICogMl0gLyouRnJlcSovKys7XG4gICAgfSBlbHNlIGlmIChjb3VudCA8PSAxMCkge1xuICAgICAgcy5ibF90cmVlW1JFUFpfM18xMCAqIDJdIC8qLkZyZXEqLysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBzLmJsX3RyZWVbUkVQWl8xMV8xMzggKiAyXSAvKi5GcmVxKi8rKztcbiAgICB9XG5cbiAgICBjb3VudCA9IDA7XG4gICAgcHJldmxlbiA9IGN1cmxlbjtcblxuICAgIGlmIChuZXh0bGVuID09PSAwKSB7XG4gICAgICBtYXhfY291bnQgPSAxMzg7XG4gICAgICBtaW5fY291bnQgPSAzO1xuICAgIH0gZWxzZSBpZiAoY3VybGVuID09PSBuZXh0bGVuKSB7XG4gICAgICBtYXhfY291bnQgPSA2O1xuICAgICAgbWluX2NvdW50ID0gMztcbiAgICB9IGVsc2Uge1xuICAgICAgbWF4X2NvdW50ID0gNztcbiAgICAgIG1pbl9jb3VudCA9IDQ7XG4gICAgfVxuICB9XG59XG5cbi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogU2VuZCBhIGxpdGVyYWwgb3IgZGlzdGFuY2UgdHJlZSBpbiBjb21wcmVzc2VkIGZvcm0sIHVzaW5nIHRoZSBjb2RlcyBpblxuICogYmxfdHJlZS5cbiAqL1xuZnVuY3Rpb24gc2VuZF90cmVlKHM6IGFueSwgdHJlZTogYW55LCBtYXhfY29kZTogYW55KSB7XG4gIGxldCBuOyAvKiBpdGVyYXRlcyBvdmVyIGFsbCB0cmVlIGVsZW1lbnRzICovXG4gIGxldCBwcmV2bGVuID0gLTE7IC8qIGxhc3QgZW1pdHRlZCBsZW5ndGggKi9cbiAgbGV0IGN1cmxlbjsgLyogbGVuZ3RoIG9mIGN1cnJlbnQgY29kZSAqL1xuXG4gIGxldCBuZXh0bGVuID0gdHJlZVswICogMiArIDFdIC8qLkxlbiovOyAvKiBsZW5ndGggb2YgbmV4dCBjb2RlICovXG5cbiAgbGV0IGNvdW50ID0gMDsgLyogcmVwZWF0IGNvdW50IG9mIHRoZSBjdXJyZW50IGNvZGUgKi9cbiAgbGV0IG1heF9jb3VudCA9IDc7IC8qIG1heCByZXBlYXQgY291bnQgKi9cbiAgbGV0IG1pbl9jb3VudCA9IDQ7IC8qIG1pbiByZXBlYXQgY291bnQgKi9cblxuICAvKiB0cmVlW21heF9jb2RlKzFdLkxlbiA9IC0xOyAqL1xuICAvKiBndWFyZCBhbHJlYWR5IHNldCAqL1xuICBpZiAobmV4dGxlbiA9PT0gMCkge1xuICAgIG1heF9jb3VudCA9IDEzODtcbiAgICBtaW5fY291bnQgPSAzO1xuICB9XG5cbiAgZm9yIChuID0gMDsgbiA8PSBtYXhfY29kZTsgbisrKSB7XG4gICAgY3VybGVuID0gbmV4dGxlbjtcbiAgICBuZXh0bGVuID0gdHJlZVsobiArIDEpICogMiArIDFdIC8qLkxlbiovO1xuXG4gICAgaWYgKCsrY291bnQgPCBtYXhfY291bnQgJiYgY3VybGVuID09PSBuZXh0bGVuKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9IGVsc2UgaWYgKGNvdW50IDwgbWluX2NvdW50KSB7XG4gICAgICBkbyB7XG4gICAgICAgIHNlbmRfY29kZShzLCBjdXJsZW4sIHMuYmxfdHJlZSk7XG4gICAgICB9IHdoaWxlICgtLWNvdW50ICE9PSAwKTtcbiAgICB9IGVsc2UgaWYgKGN1cmxlbiAhPT0gMCkge1xuICAgICAgaWYgKGN1cmxlbiAhPT0gcHJldmxlbikge1xuICAgICAgICBzZW5kX2NvZGUocywgY3VybGVuLCBzLmJsX3RyZWUpO1xuICAgICAgICBjb3VudC0tO1xuICAgICAgfVxuICAgICAgLy9Bc3NlcnQoY291bnQgPj0gMyAmJiBjb3VudCA8PSA2LCBcIiAzXzY/XCIpO1xuICAgICAgc2VuZF9jb2RlKHMsIFJFUF8zXzYsIHMuYmxfdHJlZSk7XG4gICAgICBzZW5kX2JpdHMocywgY291bnQgLSAzLCAyKTtcbiAgICB9IGVsc2UgaWYgKGNvdW50IDw9IDEwKSB7XG4gICAgICBzZW5kX2NvZGUocywgUkVQWl8zXzEwLCBzLmJsX3RyZWUpO1xuICAgICAgc2VuZF9iaXRzKHMsIGNvdW50IC0gMywgMyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbmRfY29kZShzLCBSRVBaXzExXzEzOCwgcy5ibF90cmVlKTtcbiAgICAgIHNlbmRfYml0cyhzLCBjb3VudCAtIDExLCA3KTtcbiAgICB9XG5cbiAgICBjb3VudCA9IDA7XG4gICAgcHJldmxlbiA9IGN1cmxlbjtcbiAgICBpZiAobmV4dGxlbiA9PT0gMCkge1xuICAgICAgbWF4X2NvdW50ID0gMTM4O1xuICAgICAgbWluX2NvdW50ID0gMztcbiAgICB9IGVsc2UgaWYgKGN1cmxlbiA9PT0gbmV4dGxlbikge1xuICAgICAgbWF4X2NvdW50ID0gNjtcbiAgICAgIG1pbl9jb3VudCA9IDM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1heF9jb3VudCA9IDc7XG4gICAgICBtaW5fY291bnQgPSA0O1xuICAgIH1cbiAgfVxufVxuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIENvbnN0cnVjdCB0aGUgSHVmZm1hbiB0cmVlIGZvciB0aGUgYml0IGxlbmd0aHMgYW5kIHJldHVybiB0aGUgaW5kZXggaW5cbiAqIGJsX29yZGVyIG9mIHRoZSBsYXN0IGJpdCBsZW5ndGggY29kZSB0byBzZW5kLlxuICovXG5mdW5jdGlvbiBidWlsZF9ibF90cmVlKHM6IGFueSkge1xuICBsZXQgbWF4X2JsaW5kZXg7IC8qIGluZGV4IG9mIGxhc3QgYml0IGxlbmd0aCBjb2RlIG9mIG5vbiB6ZXJvIGZyZXEgKi9cblxuICAvKiBEZXRlcm1pbmUgdGhlIGJpdCBsZW5ndGggZnJlcXVlbmNpZXMgZm9yIGxpdGVyYWwgYW5kIGRpc3RhbmNlIHRyZWVzICovXG4gIHNjYW5fdHJlZShzLCBzLmR5bl9sdHJlZSwgcy5sX2Rlc2MubWF4X2NvZGUpO1xuICBzY2FuX3RyZWUocywgcy5keW5fZHRyZWUsIHMuZF9kZXNjLm1heF9jb2RlKTtcblxuICAvKiBCdWlsZCB0aGUgYml0IGxlbmd0aCB0cmVlOiAqL1xuICBidWlsZF90cmVlKHMsIHMuYmxfZGVzYyk7XG4gIC8qIG9wdF9sZW4gbm93IGluY2x1ZGVzIHRoZSBsZW5ndGggb2YgdGhlIHRyZWUgcmVwcmVzZW50YXRpb25zLCBleGNlcHRcbiAgICogdGhlIGxlbmd0aHMgb2YgdGhlIGJpdCBsZW5ndGhzIGNvZGVzIGFuZCB0aGUgNSs1KzQgYml0cyBmb3IgdGhlIGNvdW50cy5cbiAgICovXG5cbiAgLyogRGV0ZXJtaW5lIHRoZSBudW1iZXIgb2YgYml0IGxlbmd0aCBjb2RlcyB0byBzZW5kLiBUaGUgcGt6aXAgZm9ybWF0XG4gICAqIHJlcXVpcmVzIHRoYXQgYXQgbGVhc3QgNCBiaXQgbGVuZ3RoIGNvZGVzIGJlIHNlbnQuIChhcHBub3RlLnR4dCBzYXlzXG4gICAqIDMgYnV0IHRoZSBhY3R1YWwgdmFsdWUgdXNlZCBpcyA0LilcbiAgICovXG4gIGZvciAobWF4X2JsaW5kZXggPSBCTF9DT0RFUyAtIDE7IG1heF9ibGluZGV4ID49IDM7IG1heF9ibGluZGV4LS0pIHtcbiAgICBpZiAocy5ibF90cmVlW2JsX29yZGVyW21heF9ibGluZGV4XSAqIDIgKyAxXSAvKi5MZW4qLyAhPT0gMCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIC8qIFVwZGF0ZSBvcHRfbGVuIHRvIGluY2x1ZGUgdGhlIGJpdCBsZW5ndGggdHJlZSBhbmQgY291bnRzICovXG4gIHMub3B0X2xlbiArPSAzICogKG1heF9ibGluZGV4ICsgMSkgKyA1ICsgNSArIDQ7XG4gIC8vVHJhY2V2KChzdGRlcnIsIFwiXFxuZHluIHRyZWVzOiBkeW4gJWxkLCBzdGF0ICVsZFwiLFxuICAvLyAgICAgICAgcy0+b3B0X2xlbiwgcy0+c3RhdGljX2xlbikpO1xuXG4gIHJldHVybiBtYXhfYmxpbmRleDtcbn1cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBTZW5kIHRoZSBoZWFkZXIgZm9yIGEgYmxvY2sgdXNpbmcgZHluYW1pYyBIdWZmbWFuIHRyZWVzOiB0aGUgY291bnRzLCB0aGVcbiAqIGxlbmd0aHMgb2YgdGhlIGJpdCBsZW5ndGggY29kZXMsIHRoZSBsaXRlcmFsIHRyZWUgYW5kIHRoZSBkaXN0YW5jZSB0cmVlLlxuICogSU4gYXNzZXJ0aW9uOiBsY29kZXMgPj0gMjU3LCBkY29kZXMgPj0gMSwgYmxjb2RlcyA+PSA0LlxuICovXG5mdW5jdGlvbiBzZW5kX2FsbF90cmVlcyhzOiBhbnksIGxjb2RlczogYW55LCBkY29kZXM6IGFueSwgYmxjb2RlczogYW55KSB7XG4gIGxldCByYW5rOyAvKiBpbmRleCBpbiBibF9vcmRlciAqL1xuXG4gIC8vQXNzZXJ0IChsY29kZXMgPj0gMjU3ICYmIGRjb2RlcyA+PSAxICYmIGJsY29kZXMgPj0gNCwgXCJub3QgZW5vdWdoIGNvZGVzXCIpO1xuICAvL0Fzc2VydCAobGNvZGVzIDw9IExfQ09ERVMgJiYgZGNvZGVzIDw9IERfQ09ERVMgJiYgYmxjb2RlcyA8PSBCTF9DT0RFUyxcbiAgLy8gICAgICAgIFwidG9vIG1hbnkgY29kZXNcIik7XG4gIC8vVHJhY2V2KChzdGRlcnIsIFwiXFxuYmwgY291bnRzOiBcIikpO1xuICBzZW5kX2JpdHMocywgbGNvZGVzIC0gMjU3LCA1KTsgLyogbm90ICsyNTUgYXMgc3RhdGVkIGluIGFwcG5vdGUudHh0ICovXG4gIHNlbmRfYml0cyhzLCBkY29kZXMgLSAxLCA1KTtcbiAgc2VuZF9iaXRzKHMsIGJsY29kZXMgLSA0LCA0KTsgLyogbm90IC0zIGFzIHN0YXRlZCBpbiBhcHBub3RlLnR4dCAqL1xuICBmb3IgKHJhbmsgPSAwOyByYW5rIDwgYmxjb2RlczsgcmFuaysrKSB7XG4gICAgLy9UcmFjZXYoKHN0ZGVyciwgXCJcXG5ibCBjb2RlICUyZCBcIiwgYmxfb3JkZXJbcmFua10pKTtcbiAgICBzZW5kX2JpdHMocywgcy5ibF90cmVlW2JsX29yZGVyW3JhbmtdICogMiArIDFdLCAvKi5MZW4qLyAzKTtcbiAgfVxuICAvL1RyYWNldigoc3RkZXJyLCBcIlxcbmJsIHRyZWU6IHNlbnQgJWxkXCIsIHMtPmJpdHNfc2VudCkpO1xuXG4gIHNlbmRfdHJlZShzLCBzLmR5bl9sdHJlZSwgbGNvZGVzIC0gMSk7IC8qIGxpdGVyYWwgdHJlZSAqL1xuICAvL1RyYWNldigoc3RkZXJyLCBcIlxcbmxpdCB0cmVlOiBzZW50ICVsZFwiLCBzLT5iaXRzX3NlbnQpKTtcblxuICBzZW5kX3RyZWUocywgcy5keW5fZHRyZWUsIGRjb2RlcyAtIDEpOyAvKiBkaXN0YW5jZSB0cmVlICovXG4gIC8vVHJhY2V2KChzdGRlcnIsIFwiXFxuZGlzdCB0cmVlOiBzZW50ICVsZFwiLCBzLT5iaXRzX3NlbnQpKTtcbn1cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBDaGVjayBpZiB0aGUgZGF0YSB0eXBlIGlzIFRFWFQgb3IgQklOQVJZLCB1c2luZyB0aGUgZm9sbG93aW5nIGFsZ29yaXRobTpcbiAqIC0gVEVYVCBpZiB0aGUgdHdvIGNvbmRpdGlvbnMgYmVsb3cgYXJlIHNhdGlzZmllZDpcbiAqICAgIGEpIFRoZXJlIGFyZSBubyBub24tcG9ydGFibGUgY29udHJvbCBjaGFyYWN0ZXJzIGJlbG9uZ2luZyB0byB0aGVcbiAqICAgICAgIFwiYmxhY2sgbGlzdFwiICgwLi42LCAxNC4uMjUsIDI4Li4zMSkuXG4gKiAgICBiKSBUaGVyZSBpcyBhdCBsZWFzdCBvbmUgcHJpbnRhYmxlIGNoYXJhY3RlciBiZWxvbmdpbmcgdG8gdGhlXG4gKiAgICAgICBcIndoaXRlIGxpc3RcIiAoOSB7VEFCfSwgMTAge0xGfSwgMTMge0NSfSwgMzIuLjI1NSkuXG4gKiAtIEJJTkFSWSBvdGhlcndpc2UuXG4gKiAtIFRoZSBmb2xsb3dpbmcgcGFydGlhbGx5LXBvcnRhYmxlIGNvbnRyb2wgY2hhcmFjdGVycyBmb3JtIGFcbiAqICAgXCJncmF5IGxpc3RcIiB0aGF0IGlzIGlnbm9yZWQgaW4gdGhpcyBkZXRlY3Rpb24gYWxnb3JpdGhtOlxuICogICAoNyB7QkVMfSwgOCB7QlN9LCAxMSB7VlR9LCAxMiB7RkZ9LCAyNiB7U1VCfSwgMjcge0VTQ30pLlxuICogSU4gYXNzZXJ0aW9uOiB0aGUgZmllbGRzIEZyZXEgb2YgZHluX2x0cmVlIGFyZSBzZXQuXG4gKi9cbmZ1bmN0aW9uIGRldGVjdF9kYXRhX3R5cGUoczogYW55KSB7XG4gIC8qIGJsYWNrX21hc2sgaXMgdGhlIGJpdCBtYXNrIG9mIGJsYWNrLWxpc3RlZCBieXRlc1xuICAgKiBzZXQgYml0cyAwLi42LCAxNC4uMjUsIGFuZCAyOC4uMzFcbiAgICogMHhmM2ZmYzA3ZiA9IGJpbmFyeSAxMTExMDAxMTExMTExMTExMTEwMDAwMDAwMTExMTExMVxuICAgKi9cbiAgbGV0IGJsYWNrX21hc2sgPSAweGYzZmZjMDdmO1xuICBsZXQgbjtcblxuICAvKiBDaGVjayBmb3Igbm9uLXRleHR1YWwgKFwiYmxhY2stbGlzdGVkXCIpIGJ5dGVzLiAqL1xuICBmb3IgKG4gPSAwOyBuIDw9IDMxOyBuKyssIGJsYWNrX21hc2sgPj4+PSAxKSB7XG4gICAgaWYgKChibGFja19tYXNrICYgMSkgJiYgKHMuZHluX2x0cmVlW24gKiAyXSAvKi5GcmVxKi8gIT09IDApKSB7XG4gICAgICByZXR1cm4gWl9CSU5BUlk7XG4gICAgfVxuICB9XG5cbiAgLyogQ2hlY2sgZm9yIHRleHR1YWwgKFwid2hpdGUtbGlzdGVkXCIpIGJ5dGVzLiAqL1xuICBpZiAoXG4gICAgcy5keW5fbHRyZWVbOSAqIDJdIC8qLkZyZXEqLyAhPT0gMCB8fFxuICAgIHMuZHluX2x0cmVlWzEwICogMl0gLyouRnJlcSovICE9PSAwIHx8XG4gICAgcy5keW5fbHRyZWVbMTMgKiAyXSAvKi5GcmVxKi8gIT09IDBcbiAgKSB7XG4gICAgcmV0dXJuIFpfVEVYVDtcbiAgfVxuICBmb3IgKG4gPSAzMjsgbiA8IExJVEVSQUxTOyBuKyspIHtcbiAgICBpZiAocy5keW5fbHRyZWVbbiAqIDJdIC8qLkZyZXEqLyAhPT0gMCkge1xuICAgICAgcmV0dXJuIFpfVEVYVDtcbiAgICB9XG4gIH1cblxuICAvKiBUaGVyZSBhcmUgbm8gXCJibGFjay1saXN0ZWRcIiBvciBcIndoaXRlLWxpc3RlZFwiIGJ5dGVzOlxuICAgKiB0aGlzIHN0cmVhbSBlaXRoZXIgaXMgZW1wdHkgb3IgaGFzIHRvbGVyYXRlZCAoXCJncmF5LWxpc3RlZFwiKSBieXRlcyBvbmx5LlxuICAgKi9cbiAgcmV0dXJuIFpfQklOQVJZO1xufVxuXG5sZXQgc3RhdGljX2luaXRfZG9uZSA9IGZhbHNlO1xuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIEluaXRpYWxpemUgdGhlIHRyZWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciBhIG5ldyB6bGliIHN0cmVhbS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF90cl9pbml0KHM6IGFueSkge1xuICBpZiAoIXN0YXRpY19pbml0X2RvbmUpIHtcbiAgICB0cl9zdGF0aWNfaW5pdCgpO1xuICAgIHN0YXRpY19pbml0X2RvbmUgPSB0cnVlO1xuICB9XG5cbiAgcy5sX2Rlc2MgPSBuZXcgVHJlZURlc2Mocy5keW5fbHRyZWUsIHN0YXRpY19sX2Rlc2MpO1xuICBzLmRfZGVzYyA9IG5ldyBUcmVlRGVzYyhzLmR5bl9kdHJlZSwgc3RhdGljX2RfZGVzYyk7XG4gIHMuYmxfZGVzYyA9IG5ldyBUcmVlRGVzYyhzLmJsX3RyZWUsIHN0YXRpY19ibF9kZXNjKTtcblxuICBzLmJpX2J1ZiA9IDA7XG4gIHMuYmlfdmFsaWQgPSAwO1xuXG4gIC8qIEluaXRpYWxpemUgdGhlIGZpcnN0IGJsb2NrIG9mIHRoZSBmaXJzdCBmaWxlOiAqL1xuICBpbml0X2Jsb2NrKHMpO1xufVxuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIFNlbmQgYSBzdG9yZWQgYmxvY2tcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF90cl9zdG9yZWRfYmxvY2soczogYW55LCBidWY6IGFueSwgc3RvcmVkX2xlbjogYW55LCBsYXN0OiBhbnkpIC8vRGVmbGF0ZVN0YXRlICpzO1xuLy9jaGFyZiAqYnVmOyAgICAgICAvKiBpbnB1dCBibG9jayAqL1xuLy91bGcgc3RvcmVkX2xlbjsgICAvKiBsZW5ndGggb2YgaW5wdXQgYmxvY2sgKi9cbi8vaW50IGxhc3Q7ICAgICAgICAgLyogb25lIGlmIHRoaXMgaXMgdGhlIGxhc3QgYmxvY2sgZm9yIGEgZmlsZSAqL1xue1xuICBzZW5kX2JpdHMocywgKFNUT1JFRF9CTE9DSyA8PCAxKSArIChsYXN0ID8gMSA6IDApLCAzKTsgLyogc2VuZCBibG9jayB0eXBlICovXG4gIGNvcHlfYmxvY2socywgYnVmLCBzdG9yZWRfbGVuLCB0cnVlKTsgLyogd2l0aCBoZWFkZXIgKi9cbn1cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBTZW5kIG9uZSBlbXB0eSBzdGF0aWMgYmxvY2sgdG8gZ2l2ZSBlbm91Z2ggbG9va2FoZWFkIGZvciBpbmZsYXRlLlxuICogVGhpcyB0YWtlcyAxMCBiaXRzLCBvZiB3aGljaCA3IG1heSByZW1haW4gaW4gdGhlIGJpdCBidWZmZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfdHJfYWxpZ24oczogYW55KSB7XG4gIHNlbmRfYml0cyhzLCBTVEFUSUNfVFJFRVMgPDwgMSwgMyk7XG4gIHNlbmRfY29kZShzLCBFTkRfQkxPQ0ssIHN0YXRpY19sdHJlZSk7XG4gIGJpX2ZsdXNoKHMpO1xufVxuXG4vKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIERldGVybWluZSB0aGUgYmVzdCBlbmNvZGluZyBmb3IgdGhlIGN1cnJlbnQgYmxvY2s6IGR5bmFtaWMgdHJlZXMsIHN0YXRpY1xuICogdHJlZXMgb3Igc3RvcmUsIGFuZCBvdXRwdXQgdGhlIGVuY29kZWQgYmxvY2sgdG8gdGhlIHppcCBmaWxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gX3RyX2ZsdXNoX2Jsb2NrKHM6IGFueSwgYnVmOiBhbnksIHN0b3JlZF9sZW46IGFueSwgbGFzdDogYW55KSB7XG4gIGxldCBvcHRfbGVuYiwgc3RhdGljX2xlbmI7IC8qIG9wdF9sZW4gYW5kIHN0YXRpY19sZW4gaW4gYnl0ZXMgKi9cbiAgbGV0IG1heF9ibGluZGV4ID0gMDsgLyogaW5kZXggb2YgbGFzdCBiaXQgbGVuZ3RoIGNvZGUgb2Ygbm9uIHplcm8gZnJlcSAqL1xuXG4gIC8qIEJ1aWxkIHRoZSBIdWZmbWFuIHRyZWVzIHVubGVzcyBhIHN0b3JlZCBibG9jayBpcyBmb3JjZWQgKi9cbiAgaWYgKHMubGV2ZWwgPiAwKSB7XG4gICAgLyogQ2hlY2sgaWYgdGhlIGZpbGUgaXMgYmluYXJ5IG9yIHRleHQgKi9cbiAgICBpZiAocy5zdHJtLmRhdGFfdHlwZSA9PT0gWl9VTktOT1dOKSB7XG4gICAgICBzLnN0cm0uZGF0YV90eXBlID0gZGV0ZWN0X2RhdGFfdHlwZShzKTtcbiAgICB9XG5cbiAgICAvKiBDb25zdHJ1Y3QgdGhlIGxpdGVyYWwgYW5kIGRpc3RhbmNlIHRyZWVzICovXG4gICAgYnVpbGRfdHJlZShzLCBzLmxfZGVzYyk7XG4gICAgLy8gVHJhY2V2KChzdGRlcnIsIFwiXFxubGl0IGRhdGE6IGR5biAlbGQsIHN0YXQgJWxkXCIsIHMtPm9wdF9sZW4sXG4gICAgLy8gICAgICAgIHMtPnN0YXRpY19sZW4pKTtcblxuICAgIGJ1aWxkX3RyZWUocywgcy5kX2Rlc2MpO1xuICAgIC8vIFRyYWNldigoc3RkZXJyLCBcIlxcbmRpc3QgZGF0YTogZHluICVsZCwgc3RhdCAlbGRcIiwgcy0+b3B0X2xlbixcbiAgICAvLyAgICAgICAgcy0+c3RhdGljX2xlbikpO1xuICAgIC8qIEF0IHRoaXMgcG9pbnQsIG9wdF9sZW4gYW5kIHN0YXRpY19sZW4gYXJlIHRoZSB0b3RhbCBiaXQgbGVuZ3RocyBvZlxuICAgICAqIHRoZSBjb21wcmVzc2VkIGJsb2NrIGRhdGEsIGV4Y2x1ZGluZyB0aGUgdHJlZSByZXByZXNlbnRhdGlvbnMuXG4gICAgICovXG5cbiAgICAvKiBCdWlsZCB0aGUgYml0IGxlbmd0aCB0cmVlIGZvciB0aGUgYWJvdmUgdHdvIHRyZWVzLCBhbmQgZ2V0IHRoZSBpbmRleFxuICAgICAqIGluIGJsX29yZGVyIG9mIHRoZSBsYXN0IGJpdCBsZW5ndGggY29kZSB0byBzZW5kLlxuICAgICAqL1xuICAgIG1heF9ibGluZGV4ID0gYnVpbGRfYmxfdHJlZShzKTtcblxuICAgIC8qIERldGVybWluZSB0aGUgYmVzdCBlbmNvZGluZy4gQ29tcHV0ZSB0aGUgYmxvY2sgbGVuZ3RocyBpbiBieXRlcy4gKi9cbiAgICBvcHRfbGVuYiA9IChzLm9wdF9sZW4gKyAzICsgNykgPj4+IDM7XG4gICAgc3RhdGljX2xlbmIgPSAocy5zdGF0aWNfbGVuICsgMyArIDcpID4+PiAzO1xuXG4gICAgLy8gVHJhY2V2KChzdGRlcnIsIFwiXFxub3B0ICVsdSglbHUpIHN0YXQgJWx1KCVsdSkgc3RvcmVkICVsdSBsaXQgJXUgXCIsXG4gICAgLy8gICAgICAgIG9wdF9sZW5iLCBzLT5vcHRfbGVuLCBzdGF0aWNfbGVuYiwgcy0+c3RhdGljX2xlbiwgc3RvcmVkX2xlbixcbiAgICAvLyAgICAgICAgcy0+bGFzdF9saXQpKTtcblxuICAgIGlmIChzdGF0aWNfbGVuYiA8PSBvcHRfbGVuYikgb3B0X2xlbmIgPSBzdGF0aWNfbGVuYjtcbiAgfSBlbHNlIHtcbiAgICAvLyBBc3NlcnQoYnVmICE9IChjaGFyKikwLCBcImxvc3QgYnVmXCIpO1xuICAgIG9wdF9sZW5iID0gc3RhdGljX2xlbmIgPSBzdG9yZWRfbGVuICsgNTsgLyogZm9yY2UgYSBzdG9yZWQgYmxvY2sgKi9cbiAgfVxuXG4gIGlmICgoc3RvcmVkX2xlbiArIDQgPD0gb3B0X2xlbmIpICYmIChidWYgIT09IC0xKSkge1xuICAgIC8qIDQ6IHR3byB3b3JkcyBmb3IgdGhlIGxlbmd0aHMgKi9cblxuICAgIC8qIFRoZSB0ZXN0IGJ1ZiAhPSBOVUxMIGlzIG9ubHkgbmVjZXNzYXJ5IGlmIExJVF9CVUZTSVpFID4gV1NJWkUuXG4gICAgICogT3RoZXJ3aXNlIHdlIGNhbid0IGhhdmUgcHJvY2Vzc2VkIG1vcmUgdGhhbiBXU0laRSBpbnB1dCBieXRlcyBzaW5jZVxuICAgICAqIHRoZSBsYXN0IGJsb2NrIGZsdXNoLCBiZWNhdXNlIGNvbXByZXNzaW9uIHdvdWxkIGhhdmUgYmVlblxuICAgICAqIHN1Y2Nlc3NmdWwuIElmIExJVF9CVUZTSVpFIDw9IFdTSVpFLCBpdCBpcyBuZXZlciB0b28gbGF0ZSB0b1xuICAgICAqIHRyYW5zZm9ybSBhIGJsb2NrIGludG8gYSBzdG9yZWQgYmxvY2suXG4gICAgICovXG4gICAgX3RyX3N0b3JlZF9ibG9jayhzLCBidWYsIHN0b3JlZF9sZW4sIGxhc3QpO1xuICB9IGVsc2UgaWYgKHMuc3RyYXRlZ3kgPT09IFpfRklYRUQgfHwgc3RhdGljX2xlbmIgPT09IG9wdF9sZW5iKSB7XG4gICAgc2VuZF9iaXRzKHMsIChTVEFUSUNfVFJFRVMgPDwgMSkgKyAobGFzdCA/IDEgOiAwKSwgMyk7XG4gICAgY29tcHJlc3NfYmxvY2socywgc3RhdGljX2x0cmVlLCBzdGF0aWNfZHRyZWUpO1xuICB9IGVsc2Uge1xuICAgIHNlbmRfYml0cyhzLCAoRFlOX1RSRUVTIDw8IDEpICsgKGxhc3QgPyAxIDogMCksIDMpO1xuICAgIHNlbmRfYWxsX3RyZWVzKFxuICAgICAgcyxcbiAgICAgIHMubF9kZXNjLm1heF9jb2RlICsgMSxcbiAgICAgIHMuZF9kZXNjLm1heF9jb2RlICsgMSxcbiAgICAgIG1heF9ibGluZGV4ICsgMSxcbiAgICApO1xuICAgIGNvbXByZXNzX2Jsb2NrKHMsIHMuZHluX2x0cmVlLCBzLmR5bl9kdHJlZSk7XG4gIH1cbiAgLy8gQXNzZXJ0IChzLT5jb21wcmVzc2VkX2xlbiA9PSBzLT5iaXRzX3NlbnQsIFwiYmFkIGNvbXByZXNzZWQgc2l6ZVwiKTtcbiAgLyogVGhlIGFib3ZlIGNoZWNrIGlzIG1hZGUgbW9kIDJeMzIsIGZvciBmaWxlcyBsYXJnZXIgdGhhbiA1MTIgTUJcbiAgICogYW5kIHVMb25nIGltcGxlbWVudGVkIG9uIDMyIGJpdHMuXG4gICAqL1xuICBpbml0X2Jsb2NrKHMpO1xuXG4gIGlmIChsYXN0KSB7XG4gICAgYmlfd2luZHVwKHMpO1xuICB9XG4gIC8vIFRyYWNldigoc3RkZXJyLFwiXFxuY29tcHJsZW4gJWx1KCVsdSkgXCIsIHMtPmNvbXByZXNzZWRfbGVuPj4zLFxuICAvLyAgICAgICBzLT5jb21wcmVzc2VkX2xlbi03Kmxhc3QpKTtcbn1cblxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBTYXZlIHRoZSBtYXRjaCBpbmZvIGFuZCB0YWxseSB0aGUgZnJlcXVlbmN5IGNvdW50cy4gUmV0dXJuIHRydWUgaWZcbiAqIHRoZSBjdXJyZW50IGJsb2NrIG11c3QgYmUgZmx1c2hlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF90cl90YWxseShzOiBhbnksIGRpc3Q6IGFueSwgbGM6IGFueSkge1xuICAvL2xldCBvdXRfbGVuZ3RoLCBpbl9sZW5ndGgsIGRjb2RlO1xuXG4gIHMucGVuZGluZ19idWZbcy5kX2J1ZiArIHMubGFzdF9saXQgKiAyXSA9IChkaXN0ID4+PiA4KSAmIDB4ZmY7XG4gIHMucGVuZGluZ19idWZbcy5kX2J1ZiArIHMubGFzdF9saXQgKiAyICsgMV0gPSBkaXN0ICYgMHhmZjtcblxuICBzLnBlbmRpbmdfYnVmW3MubF9idWYgKyBzLmxhc3RfbGl0XSA9IGxjICYgMHhmZjtcbiAgcy5sYXN0X2xpdCsrO1xuXG4gIGlmIChkaXN0ID09PSAwKSB7XG4gICAgLyogbGMgaXMgdGhlIHVubWF0Y2hlZCBjaGFyICovXG4gICAgcy5keW5fbHRyZWVbbGMgKiAyXSAvKi5GcmVxKi8rKztcbiAgfSBlbHNlIHtcbiAgICBzLm1hdGNoZXMrKztcbiAgICAvKiBIZXJlLCBsYyBpcyB0aGUgbWF0Y2ggbGVuZ3RoIC0gTUlOX01BVENIICovXG4gICAgZGlzdC0tOyAvKiBkaXN0ID0gbWF0Y2ggZGlzdGFuY2UgLSAxICovXG4gICAgLy9Bc3NlcnQoKHVzaClkaXN0IDwgKHVzaClNQVhfRElTVChzKSAmJlxuICAgIC8vICAgICAgICh1c2gpbGMgPD0gKHVzaCkoTUFYX01BVENILU1JTl9NQVRDSCkgJiZcbiAgICAvLyAgICAgICAodXNoKWRfY29kZShkaXN0KSA8ICh1c2gpRF9DT0RFUywgIFwiX3RyX3RhbGx5OiBiYWQgbWF0Y2hcIik7XG5cbiAgICBzLmR5bl9sdHJlZVsoX2xlbmd0aF9jb2RlW2xjXSArIExJVEVSQUxTICsgMSkgKiAyXSAvKi5GcmVxKi8rKztcbiAgICBzLmR5bl9kdHJlZVtkX2NvZGUoZGlzdCkgKiAyXSAvKi5GcmVxKi8rKztcbiAgfVxuXG4gIC8vICghKSBUaGlzIGJsb2NrIGlzIGRpc2FibGVkIGluIHpsaWIgZGVmYXVsdHMsXG4gIC8vIGRvbid0IGVuYWJsZSBpdCBmb3IgYmluYXJ5IGNvbXBhdGliaWxpdHlcblxuICAvLyNpZmRlZiBUUlVOQ0FURV9CTE9DS1xuICAvLyAgLyogVHJ5IHRvIGd1ZXNzIGlmIGl0IGlzIHByb2ZpdGFibGUgdG8gc3RvcCB0aGUgY3VycmVudCBibG9jayBoZXJlICovXG4gIC8vICBpZiAoKHMubGFzdF9saXQgJiAweDFmZmYpID09PSAwICYmIHMubGV2ZWwgPiAyKSB7XG4gIC8vICAgIC8qIENvbXB1dGUgYW4gdXBwZXIgYm91bmQgZm9yIHRoZSBjb21wcmVzc2VkIGxlbmd0aCAqL1xuICAvLyAgICBvdXRfbGVuZ3RoID0gcy5sYXN0X2xpdCo4O1xuICAvLyAgICBpbl9sZW5ndGggPSBzLnN0cnN0YXJ0IC0gcy5ibG9ja19zdGFydDtcbiAgLy9cbiAgLy8gICAgZm9yIChkY29kZSA9IDA7IGRjb2RlIDwgRF9DT0RFUzsgZGNvZGUrKykge1xuICAvLyAgICAgIG91dF9sZW5ndGggKz0gcy5keW5fZHRyZWVbZGNvZGUqMl0vKi5GcmVxKi8gKiAoNSArIGV4dHJhX2RiaXRzW2Rjb2RlXSk7XG4gIC8vICAgIH1cbiAgLy8gICAgb3V0X2xlbmd0aCA+Pj49IDM7XG4gIC8vICAgIC8vVHJhY2V2KChzdGRlcnIsXCJcXG5sYXN0X2xpdCAldSwgaW4gJWxkLCBvdXQgfiVsZCglbGQlJSkgXCIsXG4gIC8vICAgIC8vICAgICAgIHMtPmxhc3RfbGl0LCBpbl9sZW5ndGgsIG91dF9sZW5ndGgsXG4gIC8vICAgIC8vICAgICAgIDEwMEwgLSBvdXRfbGVuZ3RoKjEwMEwvaW5fbGVuZ3RoKSk7XG4gIC8vICAgIGlmIChzLm1hdGNoZXMgPCAocy5sYXN0X2xpdD4+MSkvKmludCAvMiovICYmIG91dF9sZW5ndGggPCAoaW5fbGVuZ3RoPj4xKS8qaW50IC8yKi8pIHtcbiAgLy8gICAgICByZXR1cm4gdHJ1ZTtcbiAgLy8gICAgfVxuICAvLyAgfVxuICAvLyNlbmRpZlxuXG4gIHJldHVybiAocy5sYXN0X2xpdCA9PT0gcy5saXRfYnVmc2l6ZSAtIDEpO1xuICAvKiBXZSBhdm9pZCBlcXVhbGl0eSB3aXRoIGxpdF9idWZzaXplIGJlY2F1c2Ugb2Ygd3JhcGFyb3VuZCBhdCA2NEtcbiAgICogb24gMTYgYml0IG1hY2hpbmVzIGFuZCBiZWNhdXNlIHN0b3JlZCBibG9ja3MgYXJlIHJlc3RyaWN0ZWQgdG9cbiAgICogNjRLLTEgYnl0ZXMuXG4gICAqL1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEVBQWdDLEFBQWhDLDhCQUFnQztBQUNoQyxFQUFnQyxBQUFoQyw4QkFBZ0M7QUFDaEMsRUFBZ0MsQUFBaEMsOEJBQWdDO01BQzFCLE9BQU8sR0FBRyxDQUFDO0FBQ2pCLEVBQWdDLEFBQWhDLDhCQUFnQztBQUVoQyxFQUFtRSxBQUFuRSwrREFBbUUsQUFBbkUsRUFBbUUsT0FDN0QsUUFBUSxHQUFHLENBQUM7TUFDWixNQUFNLEdBQUcsQ0FBQztBQUNoQixFQUE0QyxBQUE1QywwQ0FBNEM7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
