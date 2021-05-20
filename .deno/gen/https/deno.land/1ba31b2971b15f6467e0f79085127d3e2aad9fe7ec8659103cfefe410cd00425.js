class ZStream {
  /* next input byte */ input = null;
  next_in = 0;
  /* number of bytes available at input */ avail_in = 0;
  /* total number of input bytes read so far */ total_in = 0;
  /* next output byte should be put there */ output = null;
  next_out = 0;
  /* remaining free space at output */ avail_out = 0;
  /* total number of bytes output so far */ total_out = 0;
  /* last error message, NULL if no error */ msg = "";
  /* not visible by applications */ state = null;
  /* best guess about the data type: binary or text */ data_type = 2;
  /* adler32 value of the uncompressed data */ adler = 0;
}
export { ZStream as default };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2NvbXByZXNzQHYwLjMuNi96bGliL3psaWIvenN0cmVhbS50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGRlZmF1bHQgY2xhc3MgWlN0cmVhbSB7XG4gIC8qIG5leHQgaW5wdXQgYnl0ZSAqL1xuICBpbnB1dDogVWludDhBcnJheSB8IG51bGwgPSBudWxsOyAvLyBKUyBzcGVjaWZpYywgYmVjYXVzZSB3ZSBoYXZlIG5vIHBvaW50ZXJzXG4gIG5leHRfaW4gPSAwO1xuICAvKiBudW1iZXIgb2YgYnl0ZXMgYXZhaWxhYmxlIGF0IGlucHV0ICovXG4gIGF2YWlsX2luID0gMDtcbiAgLyogdG90YWwgbnVtYmVyIG9mIGlucHV0IGJ5dGVzIHJlYWQgc28gZmFyICovXG4gIHRvdGFsX2luID0gMDtcbiAgLyogbmV4dCBvdXRwdXQgYnl0ZSBzaG91bGQgYmUgcHV0IHRoZXJlICovXG4gIG91dHB1dDogVWludDhBcnJheSB8IG51bGwgPSBudWxsOyAvLyBKUyBzcGVjaWZpYywgYmVjYXVzZSB3ZSBoYXZlIG5vIHBvaW50ZXJzXG4gIG5leHRfb3V0ID0gMDtcbiAgLyogcmVtYWluaW5nIGZyZWUgc3BhY2UgYXQgb3V0cHV0ICovXG4gIGF2YWlsX291dCA9IDA7XG4gIC8qIHRvdGFsIG51bWJlciBvZiBieXRlcyBvdXRwdXQgc28gZmFyICovXG4gIHRvdGFsX291dCA9IDA7XG4gIC8qIGxhc3QgZXJyb3IgbWVzc2FnZSwgTlVMTCBpZiBubyBlcnJvciAqL1xuICBtc2cgPSBcIlwiIC8qWl9OVUxMKi87XG4gIC8qIG5vdCB2aXNpYmxlIGJ5IGFwcGxpY2F0aW9ucyAqL1xuICBzdGF0ZTogYW55ID0gbnVsbDtcbiAgLyogYmVzdCBndWVzcyBhYm91dCB0aGUgZGF0YSB0eXBlOiBiaW5hcnkgb3IgdGV4dCAqL1xuICBkYXRhX3R5cGUgPSAyIC8qWl9VTktOT1dOKi87XG4gIC8qIGFkbGVyMzIgdmFsdWUgb2YgdGhlIHVuY29tcHJlc3NlZCBkYXRhICovXG4gIGFkbGVyID0gMDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiTUFBcUIsT0FBTztJQUMxQixFQUFxQixBQUFyQixpQkFBcUIsQUFBckIsRUFBcUIsQ0FDckIsS0FBSyxHQUFzQixJQUFJO0lBQy9CLE9BQU8sR0FBRyxDQUFDO0lBQ1gsRUFBd0MsQUFBeEMsb0NBQXdDLEFBQXhDLEVBQXdDLENBQ3hDLFFBQVEsR0FBRyxDQUFDO0lBQ1osRUFBNkMsQUFBN0MseUNBQTZDLEFBQTdDLEVBQTZDLENBQzdDLFFBQVEsR0FBRyxDQUFDO0lBQ1osRUFBMEMsQUFBMUMsc0NBQTBDLEFBQTFDLEVBQTBDLENBQzFDLE1BQU0sR0FBc0IsSUFBSTtJQUNoQyxRQUFRLEdBQUcsQ0FBQztJQUNaLEVBQW9DLEFBQXBDLGdDQUFvQyxBQUFwQyxFQUFvQyxDQUNwQyxTQUFTLEdBQUcsQ0FBQztJQUNiLEVBQXlDLEFBQXpDLHFDQUF5QyxBQUF6QyxFQUF5QyxDQUN6QyxTQUFTLEdBQUcsQ0FBQztJQUNiLEVBQTBDLEFBQTFDLHNDQUEwQyxBQUExQyxFQUEwQyxDQUMxQyxHQUFHO0lBQ0gsRUFBaUMsQUFBakMsNkJBQWlDLEFBQWpDLEVBQWlDLENBQ2pDLEtBQUssR0FBUSxJQUFJO0lBQ2pCLEVBQW9ELEFBQXBELGdEQUFvRCxBQUFwRCxFQUFvRCxDQUNwRCxTQUFTLEdBQUcsQ0FBQztJQUNiLEVBQTRDLEFBQTVDLHdDQUE0QyxBQUE1QyxFQUE0QyxDQUM1QyxLQUFLLEdBQUcsQ0FBQzs7U0F0QlUsT0FBTyJ9