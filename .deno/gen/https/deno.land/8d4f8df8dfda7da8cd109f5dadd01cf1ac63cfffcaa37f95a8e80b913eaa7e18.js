var STATUS;
(function (STATUS) {
  STATUS[
    STATUS[
      /* Allowed flush values; see deflate() and inflate() below for details */ "Z_NO_FLUSH"
    ] = 0
  ] = "Z_NO_FLUSH";
  STATUS[STATUS["Z_PARTIAL_FLUSH"] = 1] = "Z_PARTIAL_FLUSH";
  STATUS[STATUS["Z_SYNC_FLUSH"] = 2] = "Z_SYNC_FLUSH";
  STATUS[STATUS["Z_FULL_FLUSH"] = 3] = "Z_FULL_FLUSH";
  STATUS[STATUS["Z_FINISH"] = 4] = "Z_FINISH";
  STATUS[STATUS["Z_BLOCK"] = 5] = "Z_BLOCK";
  STATUS[STATUS["Z_TREES"] = 6] = "Z_TREES";
  STATUS[
    STATUS[
      /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */ "Z_OK"
    ] = 0
  ] = "Z_OK";
  STATUS[STATUS["Z_STREAM_END"] = 1] = "Z_STREAM_END";
  STATUS[STATUS["Z_NEED_DICT"] = 2] = "Z_NEED_DICT";
  STATUS[STATUS["Z_ERRNO"] = -1] = "Z_ERRNO";
  STATUS[STATUS["Z_STREAM_ERROR"] = -2] = "Z_STREAM_ERROR";
  STATUS[STATUS["Z_DATA_ERROR"] = -3] = "Z_DATA_ERROR";
  STATUS[
    STATUS[ //Z_MEM_ERROR=     -4,
      "Z_BUF_ERROR"
    ] = -5
  ] = "Z_BUF_ERROR";
  STATUS[
    STATUS[ //Z_VERSION_ERROR= -6,
      /* compression levels */ "Z_NO_COMPRESSION"
    ] = 0
  ] = "Z_NO_COMPRESSION";
  STATUS[STATUS["Z_BEST_SPEED"] = 1] = "Z_BEST_SPEED";
  STATUS[STATUS["Z_BEST_COMPRESSION"] = 9] = "Z_BEST_COMPRESSION";
  STATUS[STATUS["Z_DEFAULT_COMPRESSION"] = -1] = "Z_DEFAULT_COMPRESSION";
  STATUS[STATUS["Z_FILTERED"] = 1] = "Z_FILTERED";
  STATUS[STATUS["Z_HUFFMAN_ONLY"] = 2] = "Z_HUFFMAN_ONLY";
  STATUS[STATUS["Z_RLE"] = 3] = "Z_RLE";
  STATUS[STATUS["Z_FIXED"] = 4] = "Z_FIXED";
  STATUS[STATUS["Z_DEFAULT_STRATEGY"] = 0] = "Z_DEFAULT_STRATEGY";
  STATUS[
    STATUS[
      /* Possible values of the data_type field (though see inflate()) */ "Z_BINARY"
    ] = 0
  ] = "Z_BINARY";
  STATUS[STATUS["Z_TEXT"] = 1] = "Z_TEXT";
  STATUS[
    STATUS[ //Z_ASCII=                1, // = Z_TEXT (deprecated)
      "Z_UNKNOWN"
    ] = 2
  ] = "Z_UNKNOWN";
  STATUS[STATUS[/* The deflate compression method */ "Z_DEFLATED"] = 8] =
    "Z_DEFLATED";
})(STATUS || (STATUS = {}));
export default STATUS;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2NvbXByZXNzQHYwLjMuNi96bGliL3psaWIvc3RhdHVzLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJlbnVtIFNUQVRVUyB7XG4gIC8qIEFsbG93ZWQgZmx1c2ggdmFsdWVzOyBzZWUgZGVmbGF0ZSgpIGFuZCBpbmZsYXRlKCkgYmVsb3cgZm9yIGRldGFpbHMgKi9cbiAgWl9OT19GTFVTSCA9IDAsXG4gIFpfUEFSVElBTF9GTFVTSCA9IDEsXG4gIFpfU1lOQ19GTFVTSCA9IDIsXG4gIFpfRlVMTF9GTFVTSCA9IDMsXG4gIFpfRklOSVNIID0gNCxcbiAgWl9CTE9DSyA9IDUsXG4gIFpfVFJFRVMgPSA2LFxuXG4gIC8qIFJldHVybiBjb2RlcyBmb3IgdGhlIGNvbXByZXNzaW9uL2RlY29tcHJlc3Npb24gZnVuY3Rpb25zLiBOZWdhdGl2ZSB2YWx1ZXNcbiAgKiBhcmUgZXJyb3JzLCBwb3NpdGl2ZSB2YWx1ZXMgYXJlIHVzZWQgZm9yIHNwZWNpYWwgYnV0IG5vcm1hbCBldmVudHMuXG4gICovXG4gIFpfT0sgPSAwLFxuICBaX1NUUkVBTV9FTkQgPSAxLFxuICBaX05FRURfRElDVCA9IDIsXG4gIFpfRVJSTk8gPSAtMSxcbiAgWl9TVFJFQU1fRVJST1IgPSAtMixcbiAgWl9EQVRBX0VSUk9SID0gLTMsXG4gIC8vWl9NRU1fRVJST1I9ICAgICAtNCxcbiAgWl9CVUZfRVJST1IgPSAtNSxcbiAgLy9aX1ZFUlNJT05fRVJST1I9IC02LFxuXG4gIC8qIGNvbXByZXNzaW9uIGxldmVscyAqL1xuICBaX05PX0NPTVBSRVNTSU9OID0gMCxcbiAgWl9CRVNUX1NQRUVEID0gMSxcbiAgWl9CRVNUX0NPTVBSRVNTSU9OID0gOSxcbiAgWl9ERUZBVUxUX0NPTVBSRVNTSU9OID0gLTEsXG5cbiAgWl9GSUxURVJFRCA9IDEsXG4gIFpfSFVGRk1BTl9PTkxZID0gMixcbiAgWl9STEUgPSAzLFxuICBaX0ZJWEVEID0gNCxcbiAgWl9ERUZBVUxUX1NUUkFURUdZID0gMCxcblxuICAvKiBQb3NzaWJsZSB2YWx1ZXMgb2YgdGhlIGRhdGFfdHlwZSBmaWVsZCAodGhvdWdoIHNlZSBpbmZsYXRlKCkpICovXG4gIFpfQklOQVJZID0gMCxcbiAgWl9URVhUID0gMSxcbiAgLy9aX0FTQ0lJPSAgICAgICAgICAgICAgICAxLCAvLyA9IFpfVEVYVCAoZGVwcmVjYXRlZClcbiAgWl9VTktOT1dOID0gMixcblxuICAvKiBUaGUgZGVmbGF0ZSBjb21wcmVzc2lvbiBtZXRob2QgKi9cbiAgWl9ERUZMQVRFRCA9IDgsXG4gIC8vWl9OVUxMPSAgICAgICAgICAgICAgICAgbnVsbCAvLyBVc2UgLTEgb3IgbnVsbCBpbmxpbmUsIGRlcGVuZGluZyBvbiB2YXIgdHlwZVxufVxuZXhwb3J0IGRlZmF1bHQgU1RBVFVTO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7VUFBSyxNQUFNO0lBQU4sTUFBTSxDQUFOLE1BQU0sQ0FDVCxFQUF5RSxBQUF6RSxxRUFBeUUsQUFBekUsRUFBeUUsRUFDekUsVUFBVSxLQUFHLENBQUMsS0FBZCxVQUFVO0lBRlAsTUFBTSxDQUFOLE1BQU0sRUFHVCxlQUFlLEtBQUcsQ0FBQyxLQUFuQixlQUFlO0lBSFosTUFBTSxDQUFOLE1BQU0sRUFJVCxZQUFZLEtBQUcsQ0FBQyxLQUFoQixZQUFZO0lBSlQsTUFBTSxDQUFOLE1BQU0sRUFLVCxZQUFZLEtBQUcsQ0FBQyxLQUFoQixZQUFZO0lBTFQsTUFBTSxDQUFOLE1BQU0sRUFNVCxRQUFRLEtBQUcsQ0FBQyxLQUFaLFFBQVE7SUFOTCxNQUFNLENBQU4sTUFBTSxFQU9ULE9BQU8sS0FBRyxDQUFDLEtBQVgsT0FBTztJQVBKLE1BQU0sQ0FBTixNQUFNLEVBUVQsT0FBTyxLQUFHLENBQUMsS0FBWCxPQUFPO0lBUkosTUFBTSxDQUFOLE1BQU0sQ0FVVCxFQUVFLEFBRkY7O0VBRUUsQUFGRixFQUVFLEVBQ0YsSUFBSSxLQUFHLENBQUMsS0FBUixJQUFJO0lBYkQsTUFBTSxDQUFOLE1BQU0sRUFjVCxZQUFZLEtBQUcsQ0FBQyxLQUFoQixZQUFZO0lBZFQsTUFBTSxDQUFOLE1BQU0sRUFlVCxXQUFXLEtBQUcsQ0FBQyxLQUFmLFdBQVc7SUFmUixNQUFNLENBQU4sTUFBTSxFQWdCVCxPQUFPLEtBQVAsRUFBTyxLQUFQLE9BQU87SUFoQkosTUFBTSxDQUFOLE1BQU0sRUFpQlQsY0FBYyxLQUFkLEVBQWMsS0FBZCxjQUFjO0lBakJYLE1BQU0sQ0FBTixNQUFNLEVBa0JULFlBQVksS0FBWixFQUFZLEtBQVosWUFBWTtJQWxCVCxNQUFNLENBQU4sTUFBTSxDQW1CVCxFQUFzQixBQUF0QixvQkFBc0I7S0FDdEIsV0FBVyxLQUFYLEVBQVcsS0FBWCxXQUFXO0lBcEJSLE1BQU0sQ0FBTixNQUFNLENBcUJULEVBQXNCLEFBQXRCLG9CQUFzQjtJQUV0QixFQUF3QixBQUF4QixvQkFBd0IsQUFBeEIsRUFBd0IsRUFDeEIsZ0JBQWdCLEtBQUcsQ0FBQyxLQUFwQixnQkFBZ0I7SUF4QmIsTUFBTSxDQUFOLE1BQU0sRUF5QlQsWUFBWSxLQUFHLENBQUMsS0FBaEIsWUFBWTtJQXpCVCxNQUFNLENBQU4sTUFBTSxFQTBCVCxrQkFBa0IsS0FBRyxDQUFDLEtBQXRCLGtCQUFrQjtJQTFCZixNQUFNLENBQU4sTUFBTSxFQTJCVCxxQkFBcUIsS0FBckIsRUFBcUIsS0FBckIscUJBQXFCO0lBM0JsQixNQUFNLENBQU4sTUFBTSxFQTZCVCxVQUFVLEtBQUcsQ0FBQyxLQUFkLFVBQVU7SUE3QlAsTUFBTSxDQUFOLE1BQU0sRUE4QlQsY0FBYyxLQUFHLENBQUMsS0FBbEIsY0FBYztJQTlCWCxNQUFNLENBQU4sTUFBTSxFQStCVCxLQUFLLEtBQUcsQ0FBQyxLQUFULEtBQUs7SUEvQkYsTUFBTSxDQUFOLE1BQU0sRUFnQ1QsT0FBTyxLQUFHLENBQUMsS0FBWCxPQUFPO0lBaENKLE1BQU0sQ0FBTixNQUFNLEVBaUNULGtCQUFrQixLQUFHLENBQUMsS0FBdEIsa0JBQWtCO0lBakNmLE1BQU0sQ0FBTixNQUFNLENBbUNULEVBQW1FLEFBQW5FLCtEQUFtRSxBQUFuRSxFQUFtRSxFQUNuRSxRQUFRLEtBQUcsQ0FBQyxLQUFaLFFBQVE7SUFwQ0wsTUFBTSxDQUFOLE1BQU0sRUFxQ1QsTUFBTSxLQUFHLENBQUMsS0FBVixNQUFNO0lBckNILE1BQU0sQ0FBTixNQUFNLENBc0NULEVBQXFELEFBQXJELG1EQUFxRDtLQUNyRCxTQUFTLEtBQUcsQ0FBQyxLQUFiLFNBQVM7SUF2Q04sTUFBTSxDQUFOLE1BQU0sQ0F5Q1QsRUFBb0MsQUFBcEMsZ0NBQW9DLEFBQXBDLEVBQW9DLEVBQ3BDLFVBQVUsS0FBRyxDQUFDLEtBQWQsVUFBVTtHQTFDUCxNQUFNLEtBQU4sTUFBTTs7ZUE2Q0ksTUFBTSJ9
