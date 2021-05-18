import { concat } from "../bytes/mod.ts";
import { decode } from "../encoding/utf8.ts";
// FROM https://github.com/denoland/deno/blob/b34628a26ab0187a827aa4ebe256e23178e25d39/cli/js/web/headers.ts#L9
const invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/g;
function str(buf) {
    if (buf == null) {
        return "";
    } else {
        return decode(buf);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC42Ni4wL3RleHRwcm90by9tb2QudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIEJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9nb2xhbmcvZ28vdHJlZS9tYXN0ZXIvc3JjL25ldC90ZXh0cHJvdG9cbi8vIENvcHlyaWdodCAyMDA5IFRoZSBHbyBBdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBCU0Qtc3R5bGVcbi8vIGxpY2Vuc2UgdGhhdCBjYW4gYmUgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZS5cblxuaW1wb3J0IHR5cGUgeyBCdWZSZWFkZXIgfSBmcm9tIFwiLi4vaW8vYnVmaW8udHNcIjtcbmltcG9ydCB7IGNvbmNhdCB9IGZyb20gXCIuLi9ieXRlcy9tb2QudHNcIjtcbmltcG9ydCB7IGRlY29kZSB9IGZyb20gXCIuLi9lbmNvZGluZy91dGY4LnRzXCI7XG5cbi8vIEZST00gaHR0cHM6Ly9naXRodWIuY29tL2Rlbm9sYW5kL2Rlbm8vYmxvYi9iMzQ2MjhhMjZhYjAxODdhODI3YWE0ZWJlMjU2ZTIzMTc4ZTI1ZDM5L2NsaS9qcy93ZWIvaGVhZGVycy50cyNMOVxuY29uc3QgaW52YWxpZEhlYWRlckNoYXJSZWdleCA9IC9bXlxcdFxceDIwLVxceDdlXFx4ODAtXFx4ZmZdL2c7XG5cbmZ1bmN0aW9uIHN0cihidWY6IFVpbnQ4QXJyYXkgfCBudWxsIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgaWYgKGJ1ZiA9PSBudWxsKSB7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGRlY29kZShidWYpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNoYXJDb2RlKHM6IHN0cmluZyk6IG51bWJlciB7XG4gIHJldHVybiBzLmNoYXJDb2RlQXQoMCk7XG59XG5cbmV4cG9ydCBjbGFzcyBUZXh0UHJvdG9SZWFkZXIge1xuICBjb25zdHJ1Y3RvcihyZWFkb25seSByOiBCdWZSZWFkZXIpIHt9XG5cbiAgLyoqIHJlYWRMaW5lKCkgcmVhZHMgYSBzaW5nbGUgbGluZSBmcm9tIHRoZSBUZXh0UHJvdG9SZWFkZXIsXG4gICAqIGVsaWRpbmcgdGhlIGZpbmFsIFxcbiBvciBcXHJcXG4gZnJvbSB0aGUgcmV0dXJuZWQgc3RyaW5nLlxuICAgKi9cbiAgYXN5bmMgcmVhZExpbmUoKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gICAgY29uc3QgcyA9IGF3YWl0IHRoaXMucmVhZExpbmVTbGljZSgpO1xuICAgIGlmIChzID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gc3RyKHMpO1xuICB9XG5cbiAgLyoqIFJlYWRNSU1FSGVhZGVyIHJlYWRzIGEgTUlNRS1zdHlsZSBoZWFkZXIgZnJvbSByLlxuICAgKiBUaGUgaGVhZGVyIGlzIGEgc2VxdWVuY2Ugb2YgcG9zc2libHkgY29udGludWVkIEtleTogVmFsdWUgbGluZXNcbiAgICogZW5kaW5nIGluIGEgYmxhbmsgbGluZS5cbiAgICogVGhlIHJldHVybmVkIG1hcCBtIG1hcHMgQ2Fub25pY2FsTUlNRUhlYWRlcktleShrZXkpIHRvIGFcbiAgICogc2VxdWVuY2Ugb2YgdmFsdWVzIGluIHRoZSBzYW1lIG9yZGVyIGVuY291bnRlcmVkIGluIHRoZSBpbnB1dC5cbiAgICpcbiAgICogRm9yIGV4YW1wbGUsIGNvbnNpZGVyIHRoaXMgaW5wdXQ6XG4gICAqXG4gICAqXHRNeS1LZXk6IFZhbHVlIDFcbiAgICpcdExvbmctS2V5OiBFdmVuXG4gICAqXHQgICAgICAgTG9uZ2VyIFZhbHVlXG4gICAqXHRNeS1LZXk6IFZhbHVlIDJcbiAgICpcbiAgICogR2l2ZW4gdGhhdCBpbnB1dCwgUmVhZE1JTUVIZWFkZXIgcmV0dXJucyB0aGUgbWFwOlxuICAgKlxuICAgKlx0bWFwW3N0cmluZ11bXXN0cmluZ3tcbiAgICpcdFx0XCJNeS1LZXlcIjoge1wiVmFsdWUgMVwiLCBcIlZhbHVlIDJcIn0sXG4gICAqXHRcdFwiTG9uZy1LZXlcIjoge1wiRXZlbiBMb25nZXIgVmFsdWVcIn0sXG4gICAqXHR9XG4gICAqL1xuICBhc3luYyByZWFkTUlNRUhlYWRlcigpOiBQcm9taXNlPEhlYWRlcnMgfCBudWxsPiB7XG4gICAgY29uc3QgbSA9IG5ldyBIZWFkZXJzKCk7XG4gICAgbGV0IGxpbmU6IFVpbnQ4QXJyYXkgfCB1bmRlZmluZWQ7XG5cbiAgICAvLyBUaGUgZmlyc3QgbGluZSBjYW5ub3Qgc3RhcnQgd2l0aCBhIGxlYWRpbmcgc3BhY2UuXG4gICAgbGV0IGJ1ZiA9IGF3YWl0IHRoaXMuci5wZWVrKDEpO1xuICAgIGlmIChidWYgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0gZWxzZSBpZiAoYnVmWzBdID09IGNoYXJDb2RlKFwiIFwiKSB8fCBidWZbMF0gPT0gY2hhckNvZGUoXCJcXHRcIikpIHtcbiAgICAgIGxpbmUgPSAoYXdhaXQgdGhpcy5yZWFkTGluZVNsaWNlKCkpIGFzIFVpbnQ4QXJyYXk7XG4gICAgfVxuXG4gICAgYnVmID0gYXdhaXQgdGhpcy5yLnBlZWsoMSk7XG4gICAgaWYgKGJ1ZiA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IERlbm8uZXJyb3JzLlVuZXhwZWN0ZWRFb2YoKTtcbiAgICB9IGVsc2UgaWYgKGJ1ZlswXSA9PSBjaGFyQ29kZShcIiBcIikgfHwgYnVmWzBdID09IGNoYXJDb2RlKFwiXFx0XCIpKSB7XG4gICAgICB0aHJvdyBuZXcgRGVuby5lcnJvcnMuSW52YWxpZERhdGEoXG4gICAgICAgIGBtYWxmb3JtZWQgTUlNRSBoZWFkZXIgaW5pdGlhbCBsaW5lOiAke3N0cihsaW5lKX1gLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3Qga3YgPSBhd2FpdCB0aGlzLnJlYWRMaW5lU2xpY2UoKTsgLy8gcmVhZENvbnRpbnVlZExpbmVTbGljZVxuICAgICAgaWYgKGt2ID09PSBudWxsKSB0aHJvdyBuZXcgRGVuby5lcnJvcnMuVW5leHBlY3RlZEVvZigpO1xuICAgICAgaWYgKGt2LmJ5dGVMZW5ndGggPT09IDApIHJldHVybiBtO1xuXG4gICAgICAvLyBLZXkgZW5kcyBhdCBmaXJzdCBjb2xvblxuICAgICAgbGV0IGkgPSBrdi5pbmRleE9mKGNoYXJDb2RlKFwiOlwiKSk7XG4gICAgICBpZiAoaSA8IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IERlbm8uZXJyb3JzLkludmFsaWREYXRhKFxuICAgICAgICAgIGBtYWxmb3JtZWQgTUlNRSBoZWFkZXIgbGluZTogJHtzdHIoa3YpfWAsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIC8vbGV0IGtleSA9IGNhbm9uaWNhbE1JTUVIZWFkZXJLZXkoa3Yuc3ViYXJyYXkoMCwgZW5kS2V5KSk7XG4gICAgICBjb25zdCBrZXkgPSBzdHIoa3Yuc3ViYXJyYXkoMCwgaSkpO1xuXG4gICAgICAvLyBBcyBwZXIgUkZDIDcyMzAgZmllbGQtbmFtZSBpcyBhIHRva2VuLFxuICAgICAgLy8gdG9rZW5zIGNvbnNpc3Qgb2Ygb25lIG9yIG1vcmUgY2hhcnMuXG4gICAgICAvLyBXZSBjb3VsZCB0aHJvdyBgRGVuby5lcnJvcnMuSW52YWxpZERhdGFgIGhlcmUsXG4gICAgICAvLyBidXQgYmV0dGVyIHRvIGJlIGxpYmVyYWwgaW4gd2hhdCB3ZVxuICAgICAgLy8gYWNjZXB0LCBzbyBpZiB3ZSBnZXQgYW4gZW1wdHkga2V5LCBza2lwIGl0LlxuICAgICAgaWYgKGtleSA9PSBcIlwiKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBTa2lwIGluaXRpYWwgc3BhY2VzIGluIHZhbHVlLlxuICAgICAgaSsrOyAvLyBza2lwIGNvbG9uXG4gICAgICB3aGlsZSAoXG4gICAgICAgIGkgPCBrdi5ieXRlTGVuZ3RoICYmXG4gICAgICAgIChrdltpXSA9PSBjaGFyQ29kZShcIiBcIikgfHwga3ZbaV0gPT0gY2hhckNvZGUoXCJcXHRcIikpXG4gICAgICApIHtcbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgICAgY29uc3QgdmFsdWUgPSBzdHIoa3Yuc3ViYXJyYXkoaSkpLnJlcGxhY2UoXG4gICAgICAgIGludmFsaWRIZWFkZXJDaGFyUmVnZXgsXG4gICAgICAgIGVuY29kZVVSSSxcbiAgICAgICk7XG5cbiAgICAgIC8vIEluIGNhc2Ugb2YgaW52YWxpZCBoZWFkZXIgd2Ugc3dhbGxvdyB0aGUgZXJyb3JcbiAgICAgIC8vIGV4YW1wbGU6IFwiQXVkaW8gTW9kZVwiID0+IGludmFsaWQgZHVlIHRvIHNwYWNlIGluIHRoZSBrZXlcbiAgICAgIHRyeSB7XG4gICAgICAgIG0uYXBwZW5kKGtleSwgdmFsdWUpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIFBhc3NcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBhc3luYyByZWFkTGluZVNsaWNlKCk6IFByb21pc2U8VWludDhBcnJheSB8IG51bGw+IHtcbiAgICAvLyB0aGlzLmNsb3NlRG90KCk7XG4gICAgbGV0IGxpbmU6IFVpbnQ4QXJyYXkgfCB1bmRlZmluZWQ7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGNvbnN0IHIgPSBhd2FpdCB0aGlzLnIucmVhZExpbmUoKTtcbiAgICAgIGlmIChyID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgICAgIGNvbnN0IHsgbGluZTogbCwgbW9yZSB9ID0gcjtcblxuICAgICAgLy8gQXZvaWQgdGhlIGNvcHkgaWYgdGhlIGZpcnN0IGNhbGwgcHJvZHVjZWQgYSBmdWxsIGxpbmUuXG4gICAgICBpZiAoIWxpbmUgJiYgIW1vcmUpIHtcbiAgICAgICAgLy8gVE9ETyhyeSk6XG4gICAgICAgIC8vIFRoaXMgc2tpcFNwYWNlKCkgaXMgZGVmaW5pdGVseSBtaXNwbGFjZWQsIGJ1dCBJIGRvbid0IGtub3cgd2hlcmUgaXRcbiAgICAgICAgLy8gY29tZXMgZnJvbSBub3IgaG93IHRvIGZpeCBpdC5cbiAgICAgICAgaWYgKHRoaXMuc2tpcFNwYWNlKGwpID09PSAwKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KDApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsO1xuICAgICAgfVxuICAgICAgbGluZSA9IGxpbmUgPyBjb25jYXQobGluZSwgbCkgOiBsO1xuICAgICAgaWYgKCFtb3JlKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbGluZTtcbiAgfVxuXG4gIHNraXBTcGFjZShsOiBVaW50OEFycmF5KTogbnVtYmVyIHtcbiAgICBsZXQgbiA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAobFtpXSA9PT0gY2hhckNvZGUoXCIgXCIpIHx8IGxbaV0gPT09IGNoYXJDb2RlKFwiXFx0XCIpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgbisrO1xuICAgIH1cbiAgICByZXR1cm4gbjtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQU1TLE1BQU0sU0FBUSxlQUFpQjtTQUMvQixNQUFNLFNBQVEsbUJBQXFCO0FBRTVDLEVBQStHLEFBQS9HLDZHQUErRztNQUN6RyxzQkFBc0I7U0FFbkIsR0FBRyxDQUFDLEdBQWtDO1FBQ3pDLEdBQUcsSUFBSSxJQUFJOzs7ZUFHTixNQUFNLENBQUMsR0FBRzs7O1NBSVosUUFBUSxDQUFDLENBQVM7V0FDbEIsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDOzthQUdWLGVBQWU7SUFDTCxDQUFZO2dCQUFaLENBQVk7YUFBWixDQUFZLEdBQVosQ0FBWTs7SUFFakMsRUFFRyxBQUZIOztHQUVHLEFBRkgsRUFFRyxPQUNHLFFBQVE7Y0FDTixDQUFDLGNBQWMsYUFBYTtZQUM5QixDQUFDLEtBQUssSUFBSSxTQUFTLElBQUk7ZUFDcEIsR0FBRyxDQUFDLENBQUM7O0lBR2QsRUFtQkcsQUFuQkg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkcsQUFuQkgsRUFtQkcsT0FDRyxjQUFj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