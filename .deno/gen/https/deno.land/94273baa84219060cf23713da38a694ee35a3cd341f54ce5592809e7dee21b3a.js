export function makeTable() {
  let c;
  const table = [];
  const m = 3988292384;
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? m ^ c >>> 1 : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}
// Create table on load. Just 255 signed longs. Not a problem.
const crcTable = makeTable();
export function crc32(crc, buf, len, pos) {
  let t = crcTable;
  let end = pos + len;
  let f = 255;
  crc ^= -1;
  for (let i = pos; i < end; i++) {
    crc = crc >>> 8 ^ t[(crc ^ buf[i]) & f];
  }
  return crc ^ -1; // >>> 0;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2NvbXByZXNzQHYwLjMuNi96bGliL3psaWIvY3JjMzIudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBmdW5jdGlvbiBtYWtlVGFibGUoKSB7XG4gIGxldCBjOiBudW1iZXI7XG4gIGNvbnN0IHRhYmxlID0gW107XG4gIGNvbnN0IG0gPSAweEVEQjg4MzIwO1xuXG4gIGZvciAobGV0IG4gPSAwOyBuIDwgMjU2OyBuKyspIHtcbiAgICBjID0gbjtcbiAgICBmb3IgKGxldCBrID0gMDsgayA8IDg7IGsrKykge1xuICAgICAgYyA9ICgoYyAmIDEpID8gKG0gXiAoYyA+Pj4gMSkpIDogKGMgPj4+IDEpKTtcbiAgICB9XG4gICAgdGFibGVbbl0gPSBjO1xuICB9XG5cbiAgcmV0dXJuIHRhYmxlO1xufVxuXG4vLyBDcmVhdGUgdGFibGUgb24gbG9hZC4gSnVzdCAyNTUgc2lnbmVkIGxvbmdzLiBOb3QgYSBwcm9ibGVtLlxuY29uc3QgY3JjVGFibGUgPSBtYWtlVGFibGUoKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNyYzMyKGNyYzogYW55LCBidWY6IGFueSwgbGVuOiBhbnksIHBvczogYW55KSB7XG4gIGxldCB0ID0gY3JjVGFibGU7XG4gIGxldCBlbmQgPSBwb3MgKyBsZW47XG4gIGxldCBmID0gMHhGRjtcblxuICBjcmMgXj0gLTE7XG5cbiAgZm9yIChsZXQgaSA9IHBvczsgaSA8IGVuZDsgaSsrKSB7XG4gICAgY3JjID0gKGNyYyA+Pj4gOCkgXiB0WyhjcmMgXiBidWZbaV0pICYgZl07XG4gIH1cblxuICByZXR1cm4gKGNyYyBeICgtMSkpOyAvLyA+Pj4gMDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiZ0JBQWdCLFNBQVM7UUFDbkIsQ0FBQztVQUNDLEtBQUs7VUFDTCxDQUFDLEdBQUcsVUFBVTtZQUVYLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO1FBQ3hCLENBQUMsR0FBRyxDQUFDO2dCQUNJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3RCLENBQUMsR0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFLLENBQUMsR0FBSSxDQUFDLEtBQUssQ0FBQyxHQUFNLENBQUMsS0FBSyxDQUFDOztRQUUzQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUM7O1dBR1AsS0FBSzs7QUFHZCxFQUE4RCxBQUE5RCw0REFBOEQ7TUFDeEQsUUFBUSxHQUFHLFNBQVM7Z0JBRVYsS0FBSyxDQUFDLEdBQVEsRUFBRSxHQUFRLEVBQUUsR0FBUSxFQUFFLEdBQVE7UUFDdEQsQ0FBQyxHQUFHLFFBQVE7UUFDWixHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUc7UUFDZixDQUFDLEdBQUcsR0FBSTtJQUVaLEdBQUcsS0FBSyxDQUFDO1lBRUEsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFDMUIsR0FBRyxHQUFJLEdBQUcsS0FBSyxDQUFDLEdBQUksQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUM7O1dBR2xDLEdBQUcsSUFBSyxDQUFDLENBQUksQ0FBUyxBQUFULEVBQVMsQUFBVCxPQUFTIn0=
