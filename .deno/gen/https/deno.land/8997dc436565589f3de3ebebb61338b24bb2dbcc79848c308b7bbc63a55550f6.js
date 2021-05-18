export const hexTable = new Array(256);
for(let i = 0; i < 256; ++i){
    hexTable[i] = "%" + ((i < 16 ? "0" : "") + i.toString(16)).toUpperCase();
}
/**
 * Parses a URL query string into a collection of key and value pairs.
 * @param str The URL query string to parse
 * @param sep The substring used to delimit key and value pairs in the query string. Default: '&'.
 * @param eq The substring used to delimit keys and values in the query string. Default: '='.
 * @param options The parse options
 */ export function parse(str, sep = "&", eq = "=", { decodeURIComponent =unescape , maxKeys =1000  } = {
}) {
    const entries = str.split(sep).map((entry)=>entry.split(eq).map(decodeURIComponent)
    );
    const final = {
    };
    let i = 0;
    while(true){
        if (Object.keys(final).length === maxKeys && !!maxKeys || !entries[i]) {
            break;
        }
        const [key, val] = entries[i];
        if (final[key]) {
            if (Array.isArray(final[key])) {
                final[key].push(val);
            } else {
                final[key] = [
                    final[key],
                    val
                ];
            }
        } else {
            final[key] = val;
        }
        i++;
    }
    return final;
}
export function encodeStr(str, noEscapeTable, hexTable) {
    const len = str.length;
    if (len === 0) return "";
    let out = "";
    let lastPos = 0;
    for(let i = 0; i < len; i++){
        let c = str.charCodeAt(i);
        // ASCII
        if (c < 128) {
            if (noEscapeTable[c] === 1) continue;
            if (lastPos < i) out += str.slice(lastPos, i);
            lastPos = i + 1;
            out += hexTable[c];
            continue;
        }
        if (lastPos < i) out += str.slice(lastPos, i);
        // Multi-byte characters ...
        if (c < 2048) {
            lastPos = i + 1;
            out += hexTable[192 | c >> 6] + hexTable[128 | c & 63];
            continue;
        }
        if (c < 55296 || c >= 57344) {
            lastPos = i + 1;
            out += hexTable[224 | c >> 12] + hexTable[128 | c >> 6 & 63] + hexTable[128 | c & 63];
            continue;
        }
        // Surrogate pair
        ++i;
        // This branch should never happen because all URLSearchParams entries
        // should already be converted to USVString. But, included for
        // completion's sake anyway.
        if (i >= len) throw new Deno.errors.InvalidData("invalid URI");
        const c2 = str.charCodeAt(i) & 1023;
        lastPos = i + 1;
        c = 65536 + ((c & 1023) << 10 | c2);
        out += hexTable[240 | c >> 18] + hexTable[128 | c >> 12 & 63] + hexTable[128 | c >> 6 & 63] + hexTable[128 | c & 63];
    }
    if (lastPos === 0) return str;
    if (lastPos < len) return out + str.slice(lastPos);
    return out;
}
/**
 * Produces a URL query string from a given obj by iterating through the object's "own properties".
 * @param obj The object to serialize into a URL query string.
 * @param sep The substring used to delimit key and value pairs in the query string. Default: '&'.
 * @param eq The substring used to delimit keys and values in the query string. Default: '='.
 * @param options The stringify options
 */ export function stringify(// deno-lint-ignore no-explicit-any
obj, sep = "&", eq = "=", { encodeURIComponent =escape  } = {
}) {
    const final = [];
    for (const entry of Object.entries(obj)){
        if (Array.isArray(entry[1])) {
            for (const val of entry[1]){
                final.push(encodeURIComponent(entry[0]) + eq + encodeURIComponent(val));
            }
        } else if (typeof entry[1] !== "object" && entry[1] !== undefined) {
            final.push(entry.map(encodeURIComponent).join(eq));
        } else {
            final.push(encodeURIComponent(entry[0]) + eq);
        }
    }
    return final.join(sep);
}
/** Alias of querystring.parse() */ export const decode = parse;
/** Alias of querystring.stringify() */ export const encode = stringify;
export const unescape = decodeURIComponent;
export const escape = encodeURIComponent;
export default {
    parse,
    encodeStr,
    stringify,
    hexTable,
    decode,
    encode,
    unescape,
    escape
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NS4wL25vZGUvcXVlcnlzdHJpbmcudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjEgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbmludGVyZmFjZSBQYXJzZU9wdGlvbnMge1xuICAvKiogVGhlIGZ1bmN0aW9uIHRvIHVzZSB3aGVuIGRlY29kaW5nIHBlcmNlbnQtZW5jb2RlZCBjaGFyYWN0ZXJzIGluIHRoZSBxdWVyeSBzdHJpbmcuICovXG4gIGRlY29kZVVSSUNvbXBvbmVudD86IChzdHJpbmc6IHN0cmluZykgPT4gc3RyaW5nO1xuICAvKiogU3BlY2lmaWVzIHRoZSBtYXhpbXVtIG51bWJlciBvZiBrZXlzIHRvIHBhcnNlLiAqL1xuICBtYXhLZXlzPzogbnVtYmVyO1xufVxuXG5leHBvcnQgY29uc3QgaGV4VGFibGUgPSBuZXcgQXJyYXkoMjU2KTtcbmZvciAobGV0IGkgPSAwOyBpIDwgMjU2OyArK2kpIHtcbiAgaGV4VGFibGVbaV0gPSBcIiVcIiArICgoaSA8IDE2ID8gXCIwXCIgOiBcIlwiKSArIGkudG9TdHJpbmcoMTYpKS50b1VwcGVyQ2FzZSgpO1xufVxuXG4vKipcbiAqIFBhcnNlcyBhIFVSTCBxdWVyeSBzdHJpbmcgaW50byBhIGNvbGxlY3Rpb24gb2Yga2V5IGFuZCB2YWx1ZSBwYWlycy5cbiAqIEBwYXJhbSBzdHIgVGhlIFVSTCBxdWVyeSBzdHJpbmcgdG8gcGFyc2VcbiAqIEBwYXJhbSBzZXAgVGhlIHN1YnN0cmluZyB1c2VkIHRvIGRlbGltaXQga2V5IGFuZCB2YWx1ZSBwYWlycyBpbiB0aGUgcXVlcnkgc3RyaW5nLiBEZWZhdWx0OiAnJicuXG4gKiBAcGFyYW0gZXEgVGhlIHN1YnN0cmluZyB1c2VkIHRvIGRlbGltaXQga2V5cyBhbmQgdmFsdWVzIGluIHRoZSBxdWVyeSBzdHJpbmcuIERlZmF1bHQ6ICc9Jy5cbiAqIEBwYXJhbSBvcHRpb25zIFRoZSBwYXJzZSBvcHRpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShcbiAgc3RyOiBzdHJpbmcsXG4gIHNlcCA9IFwiJlwiLFxuICBlcSA9IFwiPVwiLFxuICB7IGRlY29kZVVSSUNvbXBvbmVudCA9IHVuZXNjYXBlLCBtYXhLZXlzID0gMTAwMCB9OiBQYXJzZU9wdGlvbnMgPSB7fSxcbik6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nW10gfCBzdHJpbmcgfSB7XG4gIGNvbnN0IGVudHJpZXMgPSBzdHJcbiAgICAuc3BsaXQoc2VwKVxuICAgIC5tYXAoKGVudHJ5KSA9PiBlbnRyeS5zcGxpdChlcSkubWFwKGRlY29kZVVSSUNvbXBvbmVudCkpO1xuICBjb25zdCBmaW5hbDogeyBba2V5OiBzdHJpbmddOiBzdHJpbmdbXSB8IHN0cmluZyB9ID0ge307XG5cbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAodHJ1ZSkge1xuICAgIGlmICgoT2JqZWN0LmtleXMoZmluYWwpLmxlbmd0aCA9PT0gbWF4S2V5cyAmJiAhIW1heEtleXMpIHx8ICFlbnRyaWVzW2ldKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjb25zdCBba2V5LCB2YWxdID0gZW50cmllc1tpXTtcbiAgICBpZiAoZmluYWxba2V5XSkge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZmluYWxba2V5XSkpIHtcbiAgICAgICAgKGZpbmFsW2tleV0gYXMgc3RyaW5nW10pLnB1c2godmFsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZpbmFsW2tleV0gPSBbZmluYWxba2V5XSBhcyBzdHJpbmcsIHZhbF07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZpbmFsW2tleV0gPSB2YWw7XG4gICAgfVxuXG4gICAgaSsrO1xuICB9XG5cbiAgcmV0dXJuIGZpbmFsO1xufVxuXG5pbnRlcmZhY2UgU3RyaW5naWZ5T3B0aW9ucyB7XG4gIC8qKiBUaGUgZnVuY3Rpb24gdG8gdXNlIHdoZW4gY29udmVydGluZyBVUkwtdW5zYWZlIGNoYXJhY3RlcnMgdG8gcGVyY2VudC1lbmNvZGluZyBpbiB0aGUgcXVlcnkgc3RyaW5nLiAqL1xuICBlbmNvZGVVUklDb21wb25lbnQ/OiAoc3RyaW5nOiBzdHJpbmcpID0+IHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZVN0cihcbiAgc3RyOiBzdHJpbmcsXG4gIG5vRXNjYXBlVGFibGU6IG51bWJlcltdLFxuICBoZXhUYWJsZTogc3RyaW5nW10sXG4pOiBzdHJpbmcge1xuICBjb25zdCBsZW4gPSBzdHIubGVuZ3RoO1xuICBpZiAobGVuID09PSAwKSByZXR1cm4gXCJcIjtcblxuICBsZXQgb3V0ID0gXCJcIjtcbiAgbGV0IGxhc3RQb3MgPSAwO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBsZXQgYyA9IHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgIC8vIEFTQ0lJXG4gICAgaWYgKGMgPCAweDgwKSB7XG4gICAgICBpZiAobm9Fc2NhcGVUYWJsZVtjXSA9PT0gMSkgY29udGludWU7XG4gICAgICBpZiAobGFzdFBvcyA8IGkpIG91dCArPSBzdHIuc2xpY2UobGFzdFBvcywgaSk7XG4gICAgICBsYXN0UG9zID0gaSArIDE7XG4gICAgICBvdXQgKz0gaGV4VGFibGVbY107XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAobGFzdFBvcyA8IGkpIG91dCArPSBzdHIuc2xpY2UobGFzdFBvcywgaSk7XG5cbiAgICAvLyBNdWx0aS1ieXRlIGNoYXJhY3RlcnMgLi4uXG4gICAgaWYgKGMgPCAweDgwMCkge1xuICAgICAgbGFzdFBvcyA9IGkgKyAxO1xuICAgICAgb3V0ICs9IGhleFRhYmxlWzB4YzAgfCAoYyA+PiA2KV0gKyBoZXhUYWJsZVsweDgwIHwgKGMgJiAweDNmKV07XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGMgPCAweGQ4MDAgfHwgYyA+PSAweGUwMDApIHtcbiAgICAgIGxhc3RQb3MgPSBpICsgMTtcbiAgICAgIG91dCArPSBoZXhUYWJsZVsweGUwIHwgKGMgPj4gMTIpXSArXG4gICAgICAgIGhleFRhYmxlWzB4ODAgfCAoKGMgPj4gNikgJiAweDNmKV0gK1xuICAgICAgICBoZXhUYWJsZVsweDgwIHwgKGMgJiAweDNmKV07XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgLy8gU3Vycm9nYXRlIHBhaXJcbiAgICArK2k7XG5cbiAgICAvLyBUaGlzIGJyYW5jaCBzaG91bGQgbmV2ZXIgaGFwcGVuIGJlY2F1c2UgYWxsIFVSTFNlYXJjaFBhcmFtcyBlbnRyaWVzXG4gICAgLy8gc2hvdWxkIGFscmVhZHkgYmUgY29udmVydGVkIHRvIFVTVlN0cmluZy4gQnV0LCBpbmNsdWRlZCBmb3JcbiAgICAvLyBjb21wbGV0aW9uJ3Mgc2FrZSBhbnl3YXkuXG4gICAgaWYgKGkgPj0gbGVuKSB0aHJvdyBuZXcgRGVuby5lcnJvcnMuSW52YWxpZERhdGEoXCJpbnZhbGlkIFVSSVwiKTtcblxuICAgIGNvbnN0IGMyID0gc3RyLmNoYXJDb2RlQXQoaSkgJiAweDNmZjtcblxuICAgIGxhc3RQb3MgPSBpICsgMTtcbiAgICBjID0gMHgxMDAwMCArICgoKGMgJiAweDNmZikgPDwgMTApIHwgYzIpO1xuICAgIG91dCArPSBoZXhUYWJsZVsweGYwIHwgKGMgPj4gMTgpXSArXG4gICAgICBoZXhUYWJsZVsweDgwIHwgKChjID4+IDEyKSAmIDB4M2YpXSArXG4gICAgICBoZXhUYWJsZVsweDgwIHwgKChjID4+IDYpICYgMHgzZildICtcbiAgICAgIGhleFRhYmxlWzB4ODAgfCAoYyAmIDB4M2YpXTtcbiAgfVxuICBpZiAobGFzdFBvcyA9PT0gMCkgcmV0dXJuIHN0cjtcbiAgaWYgKGxhc3RQb3MgPCBsZW4pIHJldHVybiBvdXQgKyBzdHIuc2xpY2UobGFzdFBvcyk7XG4gIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogUHJvZHVjZXMgYSBVUkwgcXVlcnkgc3RyaW5nIGZyb20gYSBnaXZlbiBvYmogYnkgaXRlcmF0aW5nIHRocm91Z2ggdGhlIG9iamVjdCdzIFwib3duIHByb3BlcnRpZXNcIi5cbiAqIEBwYXJhbSBvYmogVGhlIG9iamVjdCB0byBzZXJpYWxpemUgaW50byBhIFVSTCBxdWVyeSBzdHJpbmcuXG4gKiBAcGFyYW0gc2VwIFRoZSBzdWJzdHJpbmcgdXNlZCB0byBkZWxpbWl0IGtleSBhbmQgdmFsdWUgcGFpcnMgaW4gdGhlIHF1ZXJ5IHN0cmluZy4gRGVmYXVsdDogJyYnLlxuICogQHBhcmFtIGVxIFRoZSBzdWJzdHJpbmcgdXNlZCB0byBkZWxpbWl0IGtleXMgYW5kIHZhbHVlcyBpbiB0aGUgcXVlcnkgc3RyaW5nLiBEZWZhdWx0OiAnPScuXG4gKiBAcGFyYW0gb3B0aW9ucyBUaGUgc3RyaW5naWZ5IG9wdGlvbnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ2lmeShcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgb2JqOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LFxuICBzZXAgPSBcIiZcIixcbiAgZXEgPSBcIj1cIixcbiAgeyBlbmNvZGVVUklDb21wb25lbnQgPSBlc2NhcGUgfTogU3RyaW5naWZ5T3B0aW9ucyA9IHt9LFxuKTogc3RyaW5nIHtcbiAgY29uc3QgZmluYWwgPSBbXTtcblxuICBmb3IgKGNvbnN0IGVudHJ5IG9mIE9iamVjdC5lbnRyaWVzKG9iaikpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShlbnRyeVsxXSkpIHtcbiAgICAgIGZvciAoY29uc3QgdmFsIG9mIGVudHJ5WzFdKSB7XG4gICAgICAgIGZpbmFsLnB1c2goZW5jb2RlVVJJQ29tcG9uZW50KGVudHJ5WzBdKSArIGVxICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbCkpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGVudHJ5WzFdICE9PSBcIm9iamVjdFwiICYmIGVudHJ5WzFdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGZpbmFsLnB1c2goZW50cnkubWFwKGVuY29kZVVSSUNvbXBvbmVudCkuam9pbihlcSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmaW5hbC5wdXNoKGVuY29kZVVSSUNvbXBvbmVudChlbnRyeVswXSkgKyBlcSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZpbmFsLmpvaW4oc2VwKTtcbn1cblxuLyoqIEFsaWFzIG9mIHF1ZXJ5c3RyaW5nLnBhcnNlKCkgKi9cbmV4cG9ydCBjb25zdCBkZWNvZGUgPSBwYXJzZTtcbi8qKiBBbGlhcyBvZiBxdWVyeXN0cmluZy5zdHJpbmdpZnkoKSAqL1xuZXhwb3J0IGNvbnN0IGVuY29kZSA9IHN0cmluZ2lmeTtcbmV4cG9ydCBjb25zdCB1bmVzY2FwZSA9IGRlY29kZVVSSUNvbXBvbmVudDtcbmV4cG9ydCBjb25zdCBlc2NhcGUgPSBlbmNvZGVVUklDb21wb25lbnQ7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgcGFyc2UsXG4gIGVuY29kZVN0cixcbiAgc3RyaW5naWZ5LFxuICBoZXhUYWJsZSxcbiAgZGVjb2RlLFxuICBlbmNvZGUsXG4gIHVuZXNjYXBlLFxuICBlc2NhcGUsXG59O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJhQVNhLFFBQVEsT0FBTyxLQUFLLENBQUMsR0FBRztRQUM1QixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQztJQUMxQixRQUFRLENBQUMsQ0FBQyxLQUFJLENBQUcsTUFBSyxDQUFDLEdBQUcsRUFBRSxJQUFHLENBQUcsVUFBUyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsR0FBRyxXQUFXOztBQUd4RSxFQU1HLEFBTkg7Ozs7OztDQU1HLEFBTkgsRUFNRyxpQkFDYSxLQUFLLENBQ25CLEdBQVcsRUFDWCxHQUFHLElBQUcsQ0FBRyxHQUNULEVBQUUsSUFBRyxDQUFHLEtBQ04sa0JBQWtCLEVBQUcsUUFBUSxHQUFFLE9BQU8sRUFBRyxJQUFJOztVQUV6QyxPQUFPLEdBQUcsR0FBRyxDQUNoQixLQUFLLENBQUMsR0FBRyxFQUNULEdBQUcsRUFBRSxL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