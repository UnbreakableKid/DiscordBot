import { concat } from "../bytes/mod.ts";
const decoder = new TextDecoder();
// FROM https://github.com/denoland/deno/blob/b34628a26ab0187a827aa4ebe256e23178e25d39/cli/js/web/headers.ts#L9
const invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/g;
function str(buf) {
    if (buf == null) {
        return "";
    } else {
        return decoder.decode(buf);
    }
}
function charCode(s) {
    return s.charCodeAt(0);
}
export class TextProtoReader {
    r;
    constructor(r){
        this.r = r;
    }
    /** readLine() reads a single line from the TextProtoReader,
   * eliding the final \n or \r\n from the returned string.
   */ async readLine() {
        const s = await this.readLineSlice();
        if (s === null) return null;
        return str(s);
    }
    /** ReadMIMEHeader reads a MIME-style header from r.
   * The header is a sequence of possibly continued Key: Value lines
   * ending in a blank line.
   * The returned map m maps CanonicalMIMEHeaderKey(key) to a
   * sequence of values in the same order encountered in the input.
   *
   * For example, consider this input:
   *
   *	My-Key: Value 1
   *	Long-Key: Even
   *	       Longer Value
   *	My-Key: Value 2
   *
   * Given that input, ReadMIMEHeader returns the map:
   *
   *	map[string][]string{
   *		"My-Key": {"Value 1", "Value 2"},
   *		"Long-Key": {"Even Longer Value"},
   *	}
   */ async readMIMEHeader() {
        const m = new Headers();
        let line;
        // The first line cannot start with a leading space.
        let buf = await this.r.peek(1);
        if (buf === null) {
            return null;
        } else if (buf[0] == charCode(" ") || buf[0] == charCode("\t")) {
            line = await this.readLineSlice();
        }
        buf = await this.r.peek(1);
        if (buf === null) {
            throw new Deno.errors.UnexpectedEof();
        } else if (buf[0] == charCode(" ") || buf[0] == charCode("\t")) {
            throw new Deno.errors.InvalidData(`malformed MIME header initial line: ${str(line)}`);
        }
        while(true){
            const kv = await this.readLineSlice(); // readContinuedLineSlice
            if (kv === null) throw new Deno.errors.UnexpectedEof();
            if (kv.byteLength === 0) return m;
            // Key ends at first colon
            let i = kv.indexOf(charCode(":"));
            if (i < 0) {
                throw new Deno.errors.InvalidData(`malformed MIME header line: ${str(kv)}`);
            }
            //let key = canonicalMIMEHeaderKey(kv.subarray(0, endKey));
            const key = str(kv.subarray(0, i));
            // As per RFC 7230 field-name is a token,
            // tokens consist of one or more chars.
            // We could throw `Deno.errors.InvalidData` here,
            // but better to be liberal in what we
            // accept, so if we get an empty key, skip it.
            if (key == "") {
                continue;
            }
            // Skip initial spaces in value.
            i++; // skip colon
            while(i < kv.byteLength && (kv[i] == charCode(" ") || kv[i] == charCode("\t"))){
                i++;
            }
            const value = str(kv.subarray(i)).replace(invalidHeaderCharRegex, encodeURI);
            // In case of invalid header we swallow the error
            // example: "Audio Mode" => invalid due to space in the key
            try {
                m.append(key, value);
            } catch  {
            // Pass
            }
        }
    }
    async readLineSlice() {
        // this.closeDot();
        let line;
        while(true){
            const r = await this.r.readLine();
            if (r === null) return null;
            const { line: l , more  } = r;
            // Avoid the copy if the first call produced a full line.
            if (!line && !more) {
                // TODO(ry):
                // This skipSpace() is definitely misplaced, but I don't know where it
                // comes from nor how to fix it.
                if (this.skipSpace(l) === 0) {
                    return new Uint8Array(0);
                }
                return l;
            }
            line = line ? concat(line, l) : l;
            if (!more) {
                break;
            }
        }
        return line;
    }
    skipSpace(l) {
        let n = 0;
        for(let i = 0; i < l.length; i++){
            if (l[i] === charCode(" ") || l[i] === charCode("\t")) {
                continue;
            }
            n++;
        }
        return n;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NS4wL3RleHRwcm90by9tb2QudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjEgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBCYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vZ29sYW5nL2dvL3RyZWUvbWFzdGVyL3NyYy9uZXQvdGV4dHByb3RvXG4vLyBDb3B5cmlnaHQgMjAwOSBUaGUgR28gQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGEgQlNELXN0eWxlXG4vLyBsaWNlbnNlIHRoYXQgY2FuIGJlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuXG5cbmltcG9ydCB0eXBlIHsgQnVmUmVhZGVyIH0gZnJvbSBcIi4uL2lvL2J1ZmlvLnRzXCI7XG5pbXBvcnQgeyBjb25jYXQgfSBmcm9tIFwiLi4vYnl0ZXMvbW9kLnRzXCI7XG5cbmNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcblxuLy8gRlJPTSBodHRwczovL2dpdGh1Yi5jb20vZGVub2xhbmQvZGVuby9ibG9iL2IzNDYyOGEyNmFiMDE4N2E4MjdhYTRlYmUyNTZlMjMxNzhlMjVkMzkvY2xpL2pzL3dlYi9oZWFkZXJzLnRzI0w5XG5jb25zdCBpbnZhbGlkSGVhZGVyQ2hhclJlZ2V4ID0gL1teXFx0XFx4MjAtXFx4N2VcXHg4MC1cXHhmZl0vZztcblxuZnVuY3Rpb24gc3RyKGJ1ZjogVWludDhBcnJheSB8IG51bGwgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICBpZiAoYnVmID09IG51bGwpIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZGVjb2Rlci5kZWNvZGUoYnVmKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjaGFyQ29kZShzOiBzdHJpbmcpOiBudW1iZXIge1xuICByZXR1cm4gcy5jaGFyQ29kZUF0KDApO1xufVxuXG5leHBvcnQgY2xhc3MgVGV4dFByb3RvUmVhZGVyIHtcbiAgY29uc3RydWN0b3IocmVhZG9ubHkgcjogQnVmUmVhZGVyKSB7fVxuXG4gIC8qKiByZWFkTGluZSgpIHJlYWRzIGEgc2luZ2xlIGxpbmUgZnJvbSB0aGUgVGV4dFByb3RvUmVhZGVyLFxuICAgKiBlbGlkaW5nIHRoZSBmaW5hbCBcXG4gb3IgXFxyXFxuIGZyb20gdGhlIHJldHVybmVkIHN0cmluZy5cbiAgICovXG4gIGFzeW5jIHJlYWRMaW5lKCk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAgIGNvbnN0IHMgPSBhd2FpdCB0aGlzLnJlYWRMaW5lU2xpY2UoKTtcbiAgICBpZiAocyA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIHN0cihzKTtcbiAgfVxuXG4gIC8qKiBSZWFkTUlNRUhlYWRlciByZWFkcyBhIE1JTUUtc3R5bGUgaGVhZGVyIGZyb20gci5cbiAgICogVGhlIGhlYWRlciBpcyBhIHNlcXVlbmNlIG9mIHBvc3NpYmx5IGNvbnRpbnVlZCBLZXk6IFZhbHVlIGxpbmVzXG4gICAqIGVuZGluZyBpbiBhIGJsYW5rIGxpbmUuXG4gICAqIFRoZSByZXR1cm5lZCBtYXAgbSBtYXBzIENhbm9uaWNhbE1JTUVIZWFkZXJLZXkoa2V5KSB0byBhXG4gICAqIHNlcXVlbmNlIG9mIHZhbHVlcyBpbiB0aGUgc2FtZSBvcmRlciBlbmNvdW50ZXJlZCBpbiB0aGUgaW5wdXQuXG4gICAqXG4gICAqIEZvciBleGFtcGxlLCBjb25zaWRlciB0aGlzIGlucHV0OlxuICAgKlxuICAgKlx0TXktS2V5OiBWYWx1ZSAxXG4gICAqXHRMb25nLUtleTogRXZlblxuICAgKlx0ICAgICAgIExvbmdlciBWYWx1ZVxuICAgKlx0TXktS2V5OiBWYWx1ZSAyXG4gICAqXG4gICAqIEdpdmVuIHRoYXQgaW5wdXQsIFJlYWRNSU1FSGVhZGVyIHJldHVybnMgdGhlIG1hcDpcbiAgICpcbiAgICpcdG1hcFtzdHJpbmddW11zdHJpbmd7XG4gICAqXHRcdFwiTXktS2V5XCI6IHtcIlZhbHVlIDFcIiwgXCJWYWx1ZSAyXCJ9LFxuICAgKlx0XHRcIkxvbmctS2V5XCI6IHtcIkV2ZW4gTG9uZ2VyIFZhbHVlXCJ9LFxuICAgKlx0fVxuICAgKi9cbiAgYXN5bmMgcmVhZE1JTUVIZWFkZXIoKTogUHJvbWlzZTxIZWFkZXJzIHwgbnVsbD4ge1xuICAgIGNvbnN0IG0gPSBuZXcgSGVhZGVycygpO1xuICAgIGxldCBsaW5lOiBVaW50OEFycmF5IHwgdW5kZWZpbmVkO1xuXG4gICAgLy8gVGhlIGZpcnN0IGxpbmUgY2Fubm90IHN0YXJ0IHdpdGggYSBsZWFkaW5nIHNwYWNlLlxuICAgIGxldCBidWYgPSBhd2FpdCB0aGlzLnIucGVlaygxKTtcbiAgICBpZiAoYnVmID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGVsc2UgaWYgKGJ1ZlswXSA9PSBjaGFyQ29kZShcIiBcIikgfHwgYnVmWzBdID09IGNoYXJDb2RlKFwiXFx0XCIpKSB7XG4gICAgICBsaW5lID0gKGF3YWl0IHRoaXMucmVhZExpbmVTbGljZSgpKSBhcyBVaW50OEFycmF5O1xuICAgIH1cblxuICAgIGJ1ZiA9IGF3YWl0IHRoaXMuci5wZWVrKDEpO1xuICAgIGlmIChidWYgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5VbmV4cGVjdGVkRW9mKCk7XG4gICAgfSBlbHNlIGlmIChidWZbMF0gPT0gY2hhckNvZGUoXCIgXCIpIHx8IGJ1ZlswXSA9PSBjaGFyQ29kZShcIlxcdFwiKSkge1xuICAgICAgdGhyb3cgbmV3IERlbm8uZXJyb3JzLkludmFsaWREYXRhKFxuICAgICAgICBgbWFsZm9ybWVkIE1JTUUgaGVhZGVyIGluaXRpYWwgbGluZTogJHtzdHIobGluZSl9YCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGNvbnN0IGt2ID0gYXdhaXQgdGhpcy5yZWFkTGluZVNsaWNlKCk7IC8vIHJlYWRDb250aW51ZWRMaW5lU2xpY2VcbiAgICAgIGlmIChrdiA9PT0gbnVsbCkgdGhyb3cgbmV3IERlbm8uZXJyb3JzLlVuZXhwZWN0ZWRFb2YoKTtcbiAgICAgIGlmIChrdi5ieXRlTGVuZ3RoID09PSAwKSByZXR1cm4gbTtcblxuICAgICAgLy8gS2V5IGVuZHMgYXQgZmlyc3QgY29sb25cbiAgICAgIGxldCBpID0ga3YuaW5kZXhPZihjaGFyQ29kZShcIjpcIikpO1xuICAgICAgaWYgKGkgPCAwKSB7XG4gICAgICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5JbnZhbGlkRGF0YShcbiAgICAgICAgICBgbWFsZm9ybWVkIE1JTUUgaGVhZGVyIGxpbmU6ICR7c3RyKGt2KX1gLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICAvL2xldCBrZXkgPSBjYW5vbmljYWxNSU1FSGVhZGVyS2V5KGt2LnN1YmFycmF5KDAsIGVuZEtleSkpO1xuICAgICAgY29uc3Qga2V5ID0gc3RyKGt2LnN1YmFycmF5KDAsIGkpKTtcblxuICAgICAgLy8gQXMgcGVyIFJGQyA3MjMwIGZpZWxkLW5hbWUgaXMgYSB0b2tlbixcbiAgICAgIC8vIHRva2VucyBjb25zaXN0IG9mIG9uZSBvciBtb3JlIGNoYXJzLlxuICAgICAgLy8gV2UgY291bGQgdGhyb3cgYERlbm8uZXJyb3JzLkludmFsaWREYXRhYCBoZXJlLFxuICAgICAgLy8gYnV0IGJldHRlciB0byBiZSBsaWJlcmFsIGluIHdoYXQgd2VcbiAgICAgIC8vIGFjY2VwdCwgc28gaWYgd2UgZ2V0IGFuIGVtcHR5IGtleSwgc2tpcCBpdC5cbiAgICAgIGlmIChrZXkgPT0gXCJcIikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gU2tpcCBpbml0aWFsIHNwYWNlcyBpbiB2YWx1ZS5cbiAgICAgIGkrKzsgLy8gc2tpcCBjb2xvblxuICAgICAgd2hpbGUgKFxuICAgICAgICBpIDwga3YuYnl0ZUxlbmd0aCAmJlxuICAgICAgICAoa3ZbaV0gPT0gY2hhckNvZGUoXCIgXCIpIHx8IGt2W2ldID09IGNoYXJDb2RlKFwiXFx0XCIpKVxuICAgICAgKSB7XG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICAgIGNvbnN0IHZhbHVlID0gc3RyKGt2LnN1YmFycmF5KGkpKS5yZXBsYWNlKFxuICAgICAgICBpbnZhbGlkSGVhZGVyQ2hhclJlZ2V4LFxuICAgICAgICBlbmNvZGVVUkksXG4gICAgICApO1xuXG4gICAgICAvLyBJbiBjYXNlIG9mIGludmFsaWQgaGVhZGVyIHdlIHN3YWxsb3cgdGhlIGVycm9yXG4gICAgICAvLyBleGFtcGxlOiBcIkF1ZGlvIE1vZGVcIiA9PiBpbnZhbGlkIGR1ZSB0byBzcGFjZSBpbiB0aGUga2V5XG4gICAgICB0cnkge1xuICAgICAgICBtLmFwcGVuZChrZXksIHZhbHVlKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBQYXNzXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgcmVhZExpbmVTbGljZSgpOiBQcm9taXNlPFVpbnQ4QXJyYXkgfCBudWxsPiB7XG4gICAgLy8gdGhpcy5jbG9zZURvdCgpO1xuICAgIGxldCBsaW5lOiBVaW50OEFycmF5IHwgdW5kZWZpbmVkO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBjb25zdCByID0gYXdhaXQgdGhpcy5yLnJlYWRMaW5lKCk7XG4gICAgICBpZiAociA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gICAgICBjb25zdCB7IGxpbmU6IGwsIG1vcmUgfSA9IHI7XG5cbiAgICAgIC8vIEF2b2lkIHRoZSBjb3B5IGlmIHRoZSBmaXJzdCBjYWxsIHByb2R1Y2VkIGEgZnVsbCBsaW5lLlxuICAgICAgaWYgKCFsaW5lICYmICFtb3JlKSB7XG4gICAgICAgIC8vIFRPRE8ocnkpOlxuICAgICAgICAvLyBUaGlzIHNraXBTcGFjZSgpIGlzIGRlZmluaXRlbHkgbWlzcGxhY2VkLCBidXQgSSBkb24ndCBrbm93IHdoZXJlIGl0XG4gICAgICAgIC8vIGNvbWVzIGZyb20gbm9yIGhvdyB0byBmaXggaXQuXG4gICAgICAgIGlmICh0aGlzLnNraXBTcGFjZShsKSA9PT0gMCkge1xuICAgICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheSgwKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbDtcbiAgICAgIH1cbiAgICAgIGxpbmUgPSBsaW5lID8gY29uY2F0KGxpbmUsIGwpIDogbDtcbiAgICAgIGlmICghbW9yZSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGxpbmU7XG4gIH1cblxuICBza2lwU3BhY2UobDogVWludDhBcnJheSk6IG51bWJlciB7XG4gICAgbGV0IG4gPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbC5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGxbaV0gPT09IGNoYXJDb2RlKFwiIFwiKSB8fCBsW2ldID09PSBjaGFyQ29kZShcIlxcdFwiKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIG4rKztcbiAgICB9XG4gICAgcmV0dXJuIG47XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FPUyxNQUFNLFNBQVEsZUFBaUI7TUFFbEMsT0FBTyxPQUFPLFdBQVc7QUFFL0IsRUFBK0csQUFBL0csNkdBQStHO01BQ3pHLHNCQUFzQjtTQUVuQixHQUFHLENBQUMsR0FBa0M7UUFDekMsR0FBRyxJQUFJLElBQUk7OztlQUdOLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRzs7O1NBSXBCLFFBQVEsQ0FBQyxDQUFTO1dBQ2xCLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQzs7YUFHVixlQUFlO0lBQ0wsQ0FBWTtnQkFBWixDQUFZO2FBQVosQ0FBWSxHQUFaLENBQVk7O0lBRWpDLEVBRUcsQUFGSDs7R0FFRyxBQUZILEVBRUcsT0FDRyxRQUFRO2NBQ04sQ0FBQyxjQUFjLGFBQWE7WUFDOUIsQ0FBQyxLQUFLLElBQUksU0FBUyxJQUFJO2VB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