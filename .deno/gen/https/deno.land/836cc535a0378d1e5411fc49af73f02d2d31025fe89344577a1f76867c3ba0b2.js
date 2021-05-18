// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
// Based on https://github.com/golang/go/blob/0452f9460f50f0f0aba18df43dc2b31906fb66cc/src/io/io.go
// Copyright 2009 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.
import { encode } from "../encoding/utf8.ts";
/** Reader utility for strings */ export class StringReader extends Deno.Buffer {
    constructor(s){
        super(encode(s).buffer);
    }
}
/** Reader utility for combining multiple readers */ export class MultiReader {
    readers;
    currentIndex = 0;
    constructor(...readers){
        this.readers = readers;
    }
    async read(p) {
        const r = this.readers[this.currentIndex];
        if (!r) return null;
        const result = await r.read(p);
        if (result === null) {
            this.currentIndex++;
            return 0;
        }
        return result;
    }
}
/**
 * A `LimitedReader` reads from `reader` but limits the amount of data returned to just `limit` bytes.
 * Each call to `read` updates `limit` to reflect the new amount remaining.
 * `read` returns `null` when `limit` <= `0` or
 * when the underlying `reader` returns `null`.
 */ export class LimitedReader {
    reader;
    limit;
    constructor(reader, limit){
        this.reader = reader;
        this.limit = limit;
    }
    async read(p) {
        if (this.limit <= 0) {
            return null;
        }
        if (p.length > this.limit) {
            p = p.subarray(0, this.limit);
        }
        const n = await this.reader.read(p);
        if (n == null) {
            return null;
        }
        this.limit -= n;
        return n;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC43MS4wL2lvL3JlYWRlcnMudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjAgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBCYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vZ29sYW5nL2dvL2Jsb2IvMDQ1MmY5NDYwZjUwZjBmMGFiYTE4ZGY0M2RjMmIzMTkwNmZiNjZjYy9zcmMvaW8vaW8uZ29cbi8vIENvcHlyaWdodCAyMDA5IFRoZSBHbyBBdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBCU0Qtc3R5bGVcbi8vIGxpY2Vuc2UgdGhhdCBjYW4gYmUgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZS5cbmltcG9ydCB7IGVuY29kZSB9IGZyb20gXCIuLi9lbmNvZGluZy91dGY4LnRzXCI7XG5cbi8qKiBSZWFkZXIgdXRpbGl0eSBmb3Igc3RyaW5ncyAqL1xuZXhwb3J0IGNsYXNzIFN0cmluZ1JlYWRlciBleHRlbmRzIERlbm8uQnVmZmVyIHtcbiAgY29uc3RydWN0b3Ioczogc3RyaW5nKSB7XG4gICAgc3VwZXIoZW5jb2RlKHMpLmJ1ZmZlcik7XG4gIH1cbn1cblxuLyoqIFJlYWRlciB1dGlsaXR5IGZvciBjb21iaW5pbmcgbXVsdGlwbGUgcmVhZGVycyAqL1xuZXhwb3J0IGNsYXNzIE11bHRpUmVhZGVyIGltcGxlbWVudHMgRGVuby5SZWFkZXIge1xuICBwcml2YXRlIHJlYWRvbmx5IHJlYWRlcnM6IERlbm8uUmVhZGVyW107XG4gIHByaXZhdGUgY3VycmVudEluZGV4ID0gMDtcblxuICBjb25zdHJ1Y3RvciguLi5yZWFkZXJzOiBEZW5vLlJlYWRlcltdKSB7XG4gICAgdGhpcy5yZWFkZXJzID0gcmVhZGVycztcbiAgfVxuXG4gIGFzeW5jIHJlYWQocDogVWludDhBcnJheSk6IFByb21pc2U8bnVtYmVyIHwgbnVsbD4ge1xuICAgIGNvbnN0IHIgPSB0aGlzLnJlYWRlcnNbdGhpcy5jdXJyZW50SW5kZXhdO1xuICAgIGlmICghcikgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgci5yZWFkKHApO1xuICAgIGlmIChyZXN1bHQgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuY3VycmVudEluZGV4Kys7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufVxuXG4vKipcbiAqIEEgYExpbWl0ZWRSZWFkZXJgIHJlYWRzIGZyb20gYHJlYWRlcmAgYnV0IGxpbWl0cyB0aGUgYW1vdW50IG9mIGRhdGEgcmV0dXJuZWQgdG8ganVzdCBgbGltaXRgIGJ5dGVzLlxuICogRWFjaCBjYWxsIHRvIGByZWFkYCB1cGRhdGVzIGBsaW1pdGAgdG8gcmVmbGVjdCB0aGUgbmV3IGFtb3VudCByZW1haW5pbmcuXG4gKiBgcmVhZGAgcmV0dXJucyBgbnVsbGAgd2hlbiBgbGltaXRgIDw9IGAwYCBvclxuICogd2hlbiB0aGUgdW5kZXJseWluZyBgcmVhZGVyYCByZXR1cm5zIGBudWxsYC5cbiAqL1xuZXhwb3J0IGNsYXNzIExpbWl0ZWRSZWFkZXIgaW1wbGVtZW50cyBEZW5vLlJlYWRlciB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkZXI6IERlbm8uUmVhZGVyLCBwdWJsaWMgbGltaXQ6IG51bWJlcikge31cblxuICBhc3luYyByZWFkKHA6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPG51bWJlciB8IG51bGw+IHtcbiAgICBpZiAodGhpcy5saW1pdCA8PSAwKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAocC5sZW5ndGggPiB0aGlzLmxpbWl0KSB7XG4gICAgICBwID0gcC5zdWJhcnJheSgwLCB0aGlzLmxpbWl0KTtcbiAgICB9XG4gICAgY29uc3QgbiA9IGF3YWl0IHRoaXMucmVhZGVyLnJlYWQocCk7XG4gICAgaWYgKG4gPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5saW1pdCAtPSBuO1xuICAgIHJldHVybiBuO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFBMEUsQUFBMUUsd0VBQTBFO0FBQzFFLEVBQW1HLEFBQW5HLGlHQUFtRztBQUNuRyxFQUFzRCxBQUF0RCxvREFBc0Q7QUFDdEQsRUFBcUQsQUFBckQsbURBQXFEO0FBQ3JELEVBQWlELEFBQWpELCtDQUFpRDtTQUN4QyxNQUFNLFNBQVEsbUJBQXFCO0FBRTVDLEVBQWlDLEFBQWpDLDZCQUFpQyxBQUFqQyxFQUFpQyxjQUNwQixZQUFZLFNBQVMsSUFBSSxDQUFDLE1BQU07Z0JBQy9CLENBQVM7UUFDbkIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsTUFBTTs7O0FBSTFCLEVBQW9ELEFBQXBELGdEQUFvRCxBQUFwRCxFQUFvRCxjQUN2QyxXQUFXO0lBQ0wsT0FBTztJQUNoQixZQUFZLEdBQUcsQ0FBQzttQkFFVCxPQUFPO2FBQ2YsT0FBTyxHQUFHLE9BQU87O1VBR2xCLElBQUksQ0FBQyxDQUFhO2NBQ2hCLENBQUMsUUFBUSxPQUFPLE1BQU0sWUFBWTthQUNuQyxDQUFDLFNBQVMsSUFBSTtjQUNiLE1BQU0sU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDekIsTUFBTSxLQUFLLElBQUk7aUJBQ1osWUFBWTttQkFDVixDQUFDOztlQUVILE1BQU07OztBQUlqQixFQUtHLEFBTEg7Ozs7O0NBS0csQUFMSCxFQUtHLGNBQ1UsYUFBYTtJQUNMLE1BQW1CO0lBQVMsS0FBYTtnQkFBekMsTUFBbUIsRUFBUyxLQUFhO2FBQXpDLE1BQW1CLEdBQW5CLE1BQW1CO2FBQVMsS0FBYSxHQUFiLEtBQWE7O1VBRXRELElBQUksQ0FBQyxDQUFhO2lCQUNiLEtBQUssSUFBSSxDQUFDO21CQUNWLElBQUk7O1lBR1QsQ0FBQyxDQUFDLE1BQU0sUUFBUSxLQUFLO1lBQ3ZCLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsT0FBTyxLQUFLOztjQUV4QixDQUFDLGNBQWMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlCLENBQUMsSUFBSSxJQUFJO21CQUNKLElBQUk7O2FBR1IsS0FBSyxJQUFJLENBQUM7ZUFDUixDQUFDIn0=