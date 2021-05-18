/*!
 * Port of fresh (https://github.com/jshttp/fresh) for Deno.
 *
 * Licensed as follows:
 *
 * (The MIT License)
 * 
 * Copyright (c) 2012 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright (c) 2016-2017 Douglas Christopher Wilson <doug@somethingdoug.com>
 * 
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * 
 */ const CACHE_CONTROL_NO_CACHE_REGEXP = /(?:^|,)\s*?no-cache\s*?(?:,|$)/;
/**
 * Check freshness of the response using request and response headers.
 *
 * @param {object} reqHeaders
 * @param {object} resHeaders
 * @return {boolean}
 * @public
 */ export function fresh(reqHeaders, resHeaders) {
    const modifiedSince = reqHeaders["if-modified-since"];
    const noneMatch = reqHeaders["if-none-match"];
    // unconditional request
    if (!modifiedSince && !noneMatch) {
        return false;
    }
    // Always return stale when Cache-Control: no-cache
    // to support end-to-end reload requests
    // https://tools.ietf.org/html/rfc2616#section-14.9.4
    const cacheControl = reqHeaders["cache-control"];
    if (cacheControl && CACHE_CONTROL_NO_CACHE_REGEXP.test(cacheControl)) {
        return false;
    }
    // if-none-match
    if (noneMatch && noneMatch !== "*") {
        const etag = resHeaders["etag"];
        if (!etag) {
            return false;
        }
        let etagStale = true;
        const matches = parseTokenList(noneMatch);
        for(let i = 0; i < matches.length; i++){
            const match = matches[i];
            if (match === etag || match === "W/" + etag || "W/" + match === etag) {
                etagStale = false;
                break;
            }
        }
        if (etagStale) {
            return false;
        }
    }
    // if-modified-since
    if (modifiedSince) {
        const lastModified = resHeaders["last-modified"];
        const modifiedStale = !lastModified || !(parseHttpDate(lastModified) <= parseHttpDate(modifiedSince));
        if (modifiedStale) {
            return false;
        }
    }
    return true;
}
/**
 * Parse an HTTP Date into a number.
 *
 * @param {string} date
 * @returns {number}
 * @private
 */ export function parseHttpDate(date) {
    const timestamp = date && Date.parse(date);
    return typeof timestamp === "number" ? timestamp : NaN;
}
/**
 * Parse a HTTP token list.
 *
 * @param {string} str
 * @private
 */ export function parseTokenList(str) {
    const list = [];
    let start = 0;
    let end = 0;
    // gather tokens
    for(let i = 0, len = str.length; i < len; i++){
        switch(str.charCodeAt(i)){
            case 32:
                /*   */ if (start === end) {
                    start = end = i + 1;
                }
                break;
            case 44:
                /* , */ list.push(str.substring(start, end));
                start = end = i + 1;
                break;
            default:
                end = i + 1;
                break;
        }
    }
    // final token
    list.push(str.substring(start, end));
    return list;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy91dGlscy9mcmVzaC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiBQb3J0IG9mIGZyZXNoIChodHRwczovL2dpdGh1Yi5jb20vanNodHRwL2ZyZXNoKSBmb3IgRGVuby5cbiAqXG4gKiBMaWNlbnNlZCBhcyBmb2xsb3dzOlxuICpcbiAqIChUaGUgTUlUIExpY2Vuc2UpXG4gKiBcbiAqIENvcHlyaWdodCAoYykgMjAxMiBUSiBIb2xvd2F5Y2h1ayA8dGpAdmlzaW9uLW1lZGlhLmNhPlxuICogQ29weXJpZ2h0IChjKSAyMDE2LTIwMTcgRG91Z2xhcyBDaHJpc3RvcGhlciBXaWxzb24gPGRvdWdAc29tZXRoaW5nZG91Zy5jb20+XG4gKiBcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZ1xuICogYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4gKiAnU29mdHdhcmUnKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4gKiB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4gKiBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbiAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0b1xuICogdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICogXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxuICogaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKiBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICogRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4gKiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuXG4gKiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWVxuICogQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCxcbiAqIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFXG4gKiBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqIFxuICovXG5cbmNvbnN0IENBQ0hFX0NPTlRST0xfTk9fQ0FDSEVfUkVHRVhQID0gLyg/Ol58LClcXHMqP25vLWNhY2hlXFxzKj8oPzosfCQpLztcblxuLyoqXG4gKiBDaGVjayBmcmVzaG5lc3Mgb2YgdGhlIHJlc3BvbnNlIHVzaW5nIHJlcXVlc3QgYW5kIHJlc3BvbnNlIGhlYWRlcnMuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IHJlcUhlYWRlcnNcbiAqIEBwYXJhbSB7b2JqZWN0fSByZXNIZWFkZXJzXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICogQHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZnJlc2gocmVxSGVhZGVyczogYW55LCByZXNIZWFkZXJzOiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgbW9kaWZpZWRTaW5jZSA9IHJlcUhlYWRlcnNbXCJpZi1tb2RpZmllZC1zaW5jZVwiXTtcbiAgY29uc3Qgbm9uZU1hdGNoID0gcmVxSGVhZGVyc1tcImlmLW5vbmUtbWF0Y2hcIl07XG5cbiAgLy8gdW5jb25kaXRpb25hbCByZXF1ZXN0XG4gIGlmICghbW9kaWZpZWRTaW5jZSAmJiAhbm9uZU1hdGNoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gQWx3YXlzIHJldHVybiBzdGFsZSB3aGVuIENhY2hlLUNvbnRyb2w6IG5vLWNhY2hlXG4gIC8vIHRvIHN1cHBvcnQgZW5kLXRvLWVuZCByZWxvYWQgcmVxdWVzdHNcbiAgLy8gaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzI2MTYjc2VjdGlvbi0xNC45LjRcbiAgY29uc3QgY2FjaGVDb250cm9sID0gcmVxSGVhZGVyc1tcImNhY2hlLWNvbnRyb2xcIl07XG4gIGlmIChjYWNoZUNvbnRyb2wgJiYgQ0FDSEVfQ09OVFJPTF9OT19DQUNIRV9SRUdFWFAudGVzdChjYWNoZUNvbnRyb2wpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gaWYtbm9uZS1tYXRjaFxuICBpZiAobm9uZU1hdGNoICYmIG5vbmVNYXRjaCAhPT0gXCIqXCIpIHtcbiAgICBjb25zdCBldGFnID0gcmVzSGVhZGVyc1tcImV0YWdcIl07XG5cbiAgICBpZiAoIWV0YWcpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBsZXQgZXRhZ1N0YWxlID0gdHJ1ZTtcbiAgICBjb25zdCBtYXRjaGVzID0gcGFyc2VUb2tlbkxpc3Qobm9uZU1hdGNoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1hdGNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG1hdGNoID0gbWF0Y2hlc1tpXTtcbiAgICAgIGlmIChtYXRjaCA9PT0gZXRhZyB8fCBtYXRjaCA9PT0gXCJXL1wiICsgZXRhZyB8fCBcIlcvXCIgKyBtYXRjaCA9PT0gZXRhZykge1xuICAgICAgICBldGFnU3RhbGUgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGV0YWdTdGFsZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8vIGlmLW1vZGlmaWVkLXNpbmNlXG4gIGlmIChtb2RpZmllZFNpbmNlKSB7XG4gICAgY29uc3QgbGFzdE1vZGlmaWVkID0gcmVzSGVhZGVyc1tcImxhc3QtbW9kaWZpZWRcIl07XG4gICAgY29uc3QgbW9kaWZpZWRTdGFsZSA9ICFsYXN0TW9kaWZpZWQgfHxcbiAgICAgICEocGFyc2VIdHRwRGF0ZShsYXN0TW9kaWZpZWQpIDw9IHBhcnNlSHR0cERhdGUobW9kaWZpZWRTaW5jZSkpO1xuXG4gICAgaWYgKG1vZGlmaWVkU3RhbGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBQYXJzZSBhbiBIVFRQIERhdGUgaW50byBhIG51bWJlci5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gZGF0ZVxuICogQHJldHVybnMge251bWJlcn1cbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUh0dHBEYXRlKGRhdGU6IGFueSk6IG51bWJlciB7XG4gIGNvbnN0IHRpbWVzdGFtcCA9IGRhdGUgJiYgRGF0ZS5wYXJzZShkYXRlKTtcblxuICByZXR1cm4gdHlwZW9mIHRpbWVzdGFtcCA9PT0gXCJudW1iZXJcIiA/IHRpbWVzdGFtcCA6IE5hTjtcbn1cblxuLyoqXG4gKiBQYXJzZSBhIEhUVFAgdG9rZW4gbGlzdC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VUb2tlbkxpc3Qoc3RyOiBzdHJpbmcpOiBhbnlbXSB7XG4gIGNvbnN0IGxpc3QgPSBbXTtcbiAgbGV0IHN0YXJ0ID0gMDtcbiAgbGV0IGVuZCA9IDA7XG5cbiAgLy8gZ2F0aGVyIHRva2Vuc1xuICBmb3IgKGxldCBpID0gMCwgbGVuID0gc3RyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgc3dpdGNoIChzdHIuY2hhckNvZGVBdChpKSkge1xuICAgICAgY2FzZSAweDIwOi8qICAgKi9cbiAgICAgICAgaWYgKHN0YXJ0ID09PSBlbmQpIHtcbiAgICAgICAgICBzdGFydCA9IGVuZCA9IGkgKyAxO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAweDJjOi8qICwgKi9cbiAgICAgICAgbGlzdC5wdXNoKHN0ci5zdWJzdHJpbmcoc3RhcnQsIGVuZCkpO1xuICAgICAgICBzdGFydCA9IGVuZCA9IGkgKyAxO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGVuZCA9IGkgKyAxO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvLyBmaW5hbCB0b2tlblxuICBsaXN0LnB1c2goc3RyLnN1YnN0cmluZyhzdGFydCwgZW5kKSk7XG5cbiAgcmV0dXJuIGxpc3Q7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUE2QkcsQUE3Qkg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBNkJHLEFBN0JILEVBNkJHLE9BRUcsNkJBQTZCO0FBRW5DLEVBT0csQUFQSDs7Ozs7OztDQU9HLEFBUEgsRUFPRyxpQkFDYSxLQUFLLENBQUMsVUFBZSxFQUFFLFVBQWU7VUFDOUMsYUFBYSxHQUFHLFVBQVUsRUFBQyxpQkFBbUI7VUFDOUMsU0FBUyxHQUFHLFVBQVUsRUFBQyxhQUFlO0lBRTVDLEVBQXdCLEFBQXhCLHNCQUF3QjtTQUNuQixhQUFhLEtBQUssU0FBUztlQUN2QixLQUFLOztJQUdkLEVBQW1ELEFBQW5ELGlEQUFtRDtJQUNuRCxFQUF3QyxBQUF4QyxzQ0FBd0M7SUFDeEMsRUFBcUQsQUFBckQsbURBQXFEO1VBQy9DLFlBQVksR0FBRyxVQUFVLEVBQUMsYUFBZTtRQUMzQyxZQUFZLElBQUksNkJBQTZCLENBQUMsSUFBSSxDQUFDLFlBQVk7ZUFDMUQsS0FBSzs7SUFHZCxFQUFnQixBQUFoQixjQUFnQjtRQUNaLFNBQVMsSUFBSSxTQUFTLE1BQUssQ0FBRztjQUMxQixJQUFJLEdBQUcsVUFBVSxFQUFDLElBQU07YUFFekIsSUFBSTttQkFDQSxLQUFLOztZQUdWLFNBQVMsR0FBRyxJQUFJO2NBQ2QsT0FBTyxHQUFHLGNBQWMsQ0FBQyxTQUFTO2dCQUMvQixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7a0JBQzdCLEtBQUssR0FBRyxPQUFPLENBQUMsQ0FBQztnQkFDbkIsS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLE1BQUssRUFBSSxJQUFHLElBQUksS0FBSSxFQUFJLElBQUcsS0FBSyxLQUFLLElBQUk7Z0JBQ2xFLFNBQVMsR0FBRyxLQUFLOzs7O1lBS2pCLFNBQVM7bUJBQ0osS0FBSzs7O0lBSWhCLEVBQW9CLEFBQXBCLGtCQUFvQjtRQUNoQixhQUFhO2NBQ1QsWUFBWSxHQUFHLFVBQVUsRUFBQyxhQUFlO2NBQ3pDLGFBQWEsSUFBSSxZQUFZLE1BQy9CLGFBQWEsQ0FBQyxZQUFZLEtBQUssYUFBYSxDQUFDLGFBQWE7WUFFMUQsYUFBYTttQkFDUixLQUFLOzs7V0FJVCxJQUFJOztBQUdiLEVBTUcsQUFOSDs7Ozs7O0NBTUcsQUFOSCxFQU1HLGlCQUNhLGFBQWEsQ0FBQyxJQUFTO1VBQy9CLFNBQVMsR0FBRyxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJO2tCQUUzQixTQUFTLE1BQUssTUFBUSxJQUFHLFNBQVMsR0FBRyxHQUFHOztBQUd4RCxFQUtHLEFBTEg7Ozs7O0NBS0csQUFMSCxFQUtHLGlCQUNhLGNBQWMsQ0FBQyxHQUFXO1VBQ2xDLElBQUk7UUFDTixLQUFLLEdBQUcsQ0FBQztRQUNULEdBQUcsR0FBRyxDQUFDO0lBRVgsRUFBZ0IsQUFBaEIsY0FBZ0I7WUFDUCxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQztlQUNsQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7aUJBQ2pCLEVBQUk7Z0JBQUMsRUFBTyxBQUFQLEdBQU8sQUFBUCxFQUFPLEtBQ1gsS0FBSyxLQUFLLEdBQUc7b0JBQ2YsS0FBSyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQzs7O2lCQUdsQixFQUFJO2dCQUFDLEVBQU8sQUFBUCxHQUFPLEFBQVAsRUFBTyxDQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsR0FBRztnQkFDbEMsS0FBSyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQzs7O2dCQUduQixHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUM7Ozs7SUFLakIsRUFBYyxBQUFkLFlBQWM7SUFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLEdBQUc7V0FFM0IsSUFBSSJ9