/*!
 * Ported from: https://github.com/jshttp/mime-types and licensed as:
 *
 * (The MIT License)
 *
 * Copyright (c) 2014 Jonathan Ong <me@jongleberry.com>
 * Copyright (c) 2015 Douglas Christopher Wilson <doug@somethingdoug.com>
 * Copyright (c) 2020 the Deno authors
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
 */ import { db } from "./db.ts";
import { extname } from "./deps.ts";
const EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/;
const TEXT_TYPE_REGEXP = /^text\//i;
/** A map of extensions for a given media type */ export const extensions = new Map();
/** A map of the media type for a given extension */ export const types = new Map();
/** Internal function to populate the maps based on the Mime DB */ function populateMaps(extensions, types) {
    const preference = [
        "nginx",
        "apache",
        undefined,
        "iana"
    ];
    for (const type of Object.keys(db)){
        const mime = db[type];
        const exts = mime.extensions;
        if (!exts || !exts.length) {
            continue;
        }
        extensions.set(type, exts);
        for (const ext of exts){
            const current = types.get(ext);
            if (current) {
                const from = preference.indexOf(db[current].source);
                const to = preference.indexOf(mime.source);
                if (current !== "application/octet-stream" && (from > to || from === to && current.substr(0, 12) === "application/")) {
                    continue;
                }
            }
            types.set(ext, type);
        }
    }
}
// Populate the maps upon module load
populateMaps(extensions, types);
/** Given a media type return any default charset string.  Returns `undefined`
 * if not resolvable.
 */ export function charset(type) {
    const m = EXTRACT_TYPE_REGEXP.exec(type);
    if (!m) {
        return;
    }
    const [match] = m;
    const mime = db[match.toLowerCase()];
    if (mime && mime.charset) {
        return mime.charset;
    }
    if (TEXT_TYPE_REGEXP.test(match)) {
        return "UTF-8";
    }
}
/** Given an extension, lookup the appropriate media type for that extension.
 * Likely you should be using `contentType()` though instead.
 */ export function lookup(path) {
    const extension = extname("x." + path).toLowerCase().substr(1);
    return types.get(extension);
}
/** Given an extension or media type, return the full `Content-Type` header
 * string.  Returns `undefined` if not resolvable.
 */ export function contentType(str) {
    let mime = str.includes("/") ? str : lookup(str);
    if (!mime) {
        return;
    }
    if (!mime.includes("charset")) {
        const cs = charset(mime);
        if (cs) {
            mime += `; charset=${cs.toLowerCase()}`;
        }
    }
    return mime;
}
/** Given a media type, return the most appropriate extension or return
 * `undefined` if there is none.
 */ export function extension(type) {
    const match = EXTRACT_TYPE_REGEXP.exec(type);
    if (!match) {
        return;
    }
    const exts = extensions.get(match[1].toLowerCase());
    if (!exts || !exts.length) {
        return;
    }
    return exts[0];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L21lZGlhX3R5cGVzQHYyLjQuNy9tb2QudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogUG9ydGVkIGZyb206IGh0dHBzOi8vZ2l0aHViLmNvbS9qc2h0dHAvbWltZS10eXBlcyBhbmQgbGljZW5zZWQgYXM6XG4gKlxuICogKFRoZSBNSVQgTGljZW5zZSlcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQgSm9uYXRoYW4gT25nIDxtZUBqb25nbGViZXJyeS5jb20+XG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRG91Z2xhcyBDaHJpc3RvcGhlciBXaWxzb24gPGRvdWdAc29tZXRoaW5nZG91Zy5jb20+XG4gKiBDb3B5cmlnaHQgKGMpIDIwMjAgdGhlIERlbm8gYXV0aG9yc1xuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZ1xuICogYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4gKiAnU29mdHdhcmUnKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4gKiB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4gKiBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbiAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0b1xuICogdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG4gKiBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbiAqIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuICogTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULlxuICogSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTllcbiAqIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsXG4gKiBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRVxuICogU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKi9cblxuaW1wb3J0IHsgZGIgfSBmcm9tIFwiLi9kYi50c1wiO1xuaW1wb3J0IHsgZXh0bmFtZSB9IGZyb20gXCIuL2RlcHMudHNcIjtcblxuY29uc3QgRVhUUkFDVF9UWVBFX1JFR0VYUCA9IC9eXFxzKihbXjtcXHNdKikoPzo7fFxcc3wkKS87XG5jb25zdCBURVhUX1RZUEVfUkVHRVhQID0gL150ZXh0XFwvL2k7XG5cbi8qKiBBIG1hcCBvZiBleHRlbnNpb25zIGZvciBhIGdpdmVuIG1lZGlhIHR5cGUgKi9cbmV4cG9ydCBjb25zdCBleHRlbnNpb25zID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZ1tdPigpO1xuXG4vKiogQSBtYXAgb2YgdGhlIG1lZGlhIHR5cGUgZm9yIGEgZ2l2ZW4gZXh0ZW5zaW9uICovXG5leHBvcnQgY29uc3QgdHlwZXMgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuXG4vKiogSW50ZXJuYWwgZnVuY3Rpb24gdG8gcG9wdWxhdGUgdGhlIG1hcHMgYmFzZWQgb24gdGhlIE1pbWUgREIgKi9cbmZ1bmN0aW9uIHBvcHVsYXRlTWFwcyhcbiAgZXh0ZW5zaW9uczogTWFwPHN0cmluZywgc3RyaW5nW10+LFxuICB0eXBlczogTWFwPHN0cmluZywgc3RyaW5nPixcbik6IHZvaWQge1xuICBjb25zdCBwcmVmZXJlbmNlID0gW1wibmdpbnhcIiwgXCJhcGFjaGVcIiwgdW5kZWZpbmVkLCBcImlhbmFcIl07XG5cbiAgZm9yIChjb25zdCB0eXBlIG9mIE9iamVjdC5rZXlzKGRiKSkge1xuICAgIGNvbnN0IG1pbWUgPSBkYlt0eXBlXTtcbiAgICBjb25zdCBleHRzID0gbWltZS5leHRlbnNpb25zO1xuXG4gICAgaWYgKCFleHRzIHx8ICFleHRzLmxlbmd0aCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgZXh0ZW5zaW9ucy5zZXQodHlwZSwgZXh0cyk7XG5cbiAgICBmb3IgKGNvbnN0IGV4dCBvZiBleHRzKSB7XG4gICAgICBjb25zdCBjdXJyZW50ID0gdHlwZXMuZ2V0KGV4dCk7XG4gICAgICBpZiAoY3VycmVudCkge1xuICAgICAgICBjb25zdCBmcm9tID0gcHJlZmVyZW5jZS5pbmRleE9mKGRiW2N1cnJlbnRdLnNvdXJjZSk7XG4gICAgICAgIGNvbnN0IHRvID0gcHJlZmVyZW5jZS5pbmRleE9mKG1pbWUuc291cmNlKTtcblxuICAgICAgICBpZiAoXG4gICAgICAgICAgY3VycmVudCAhPT0gXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIiAmJlxuICAgICAgICAgIChmcm9tID4gdG8gfHxcbiAgICAgICAgICAgIChmcm9tID09PSB0byAmJiBjdXJyZW50LnN1YnN0cigwLCAxMikgPT09IFwiYXBwbGljYXRpb24vXCIpKVxuICAgICAgICApIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0eXBlcy5zZXQoZXh0LCB0eXBlKTtcbiAgICB9XG4gIH1cbn1cblxuLy8gUG9wdWxhdGUgdGhlIG1hcHMgdXBvbiBtb2R1bGUgbG9hZFxucG9wdWxhdGVNYXBzKGV4dGVuc2lvbnMsIHR5cGVzKTtcblxuLyoqIEdpdmVuIGEgbWVkaWEgdHlwZSByZXR1cm4gYW55IGRlZmF1bHQgY2hhcnNldCBzdHJpbmcuICBSZXR1cm5zIGB1bmRlZmluZWRgXG4gKiBpZiBub3QgcmVzb2x2YWJsZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoYXJzZXQodHlwZTogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgY29uc3QgbSA9IEVYVFJBQ1RfVFlQRV9SRUdFWFAuZXhlYyh0eXBlKTtcbiAgaWYgKCFtKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IFttYXRjaF0gPSBtO1xuICBjb25zdCBtaW1lID0gZGJbbWF0Y2gudG9Mb3dlckNhc2UoKV07XG5cbiAgaWYgKG1pbWUgJiYgbWltZS5jaGFyc2V0KSB7XG4gICAgcmV0dXJuIG1pbWUuY2hhcnNldDtcbiAgfVxuXG4gIGlmIChURVhUX1RZUEVfUkVHRVhQLnRlc3QobWF0Y2gpKSB7XG4gICAgcmV0dXJuIFwiVVRGLThcIjtcbiAgfVxufVxuXG4vKiogR2l2ZW4gYW4gZXh0ZW5zaW9uLCBsb29rdXAgdGhlIGFwcHJvcHJpYXRlIG1lZGlhIHR5cGUgZm9yIHRoYXQgZXh0ZW5zaW9uLlxuICogTGlrZWx5IHlvdSBzaG91bGQgYmUgdXNpbmcgYGNvbnRlbnRUeXBlKClgIHRob3VnaCBpbnN0ZWFkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9va3VwKHBhdGg6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIGNvbnN0IGV4dGVuc2lvbiA9IGV4dG5hbWUoXCJ4LlwiICsgcGF0aClcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5zdWJzdHIoMSk7XG5cbiAgcmV0dXJuIHR5cGVzLmdldChleHRlbnNpb24pO1xufVxuXG4vKiogR2l2ZW4gYW4gZXh0ZW5zaW9uIG9yIG1lZGlhIHR5cGUsIHJldHVybiB0aGUgZnVsbCBgQ29udGVudC1UeXBlYCBoZWFkZXJcbiAqIHN0cmluZy4gIFJldHVybnMgYHVuZGVmaW5lZGAgaWYgbm90IHJlc29sdmFibGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250ZW50VHlwZShzdHI6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIGxldCBtaW1lID0gc3RyLmluY2x1ZGVzKFwiL1wiKSA/IHN0ciA6IGxvb2t1cChzdHIpO1xuXG4gIGlmICghbWltZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICghbWltZS5pbmNsdWRlcyhcImNoYXJzZXRcIikpIHtcbiAgICBjb25zdCBjcyA9IGNoYXJzZXQobWltZSk7XG4gICAgaWYgKGNzKSB7XG4gICAgICBtaW1lICs9IGA7IGNoYXJzZXQ9JHtjcy50b0xvd2VyQ2FzZSgpfWA7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG1pbWU7XG59XG5cbi8qKiBHaXZlbiBhIG1lZGlhIHR5cGUsIHJldHVybiB0aGUgbW9zdCBhcHByb3ByaWF0ZSBleHRlbnNpb24gb3IgcmV0dXJuXG4gKiBgdW5kZWZpbmVkYCBpZiB0aGVyZSBpcyBub25lLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0ZW5zaW9uKHR5cGU6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIGNvbnN0IG1hdGNoID0gRVhUUkFDVF9UWVBFX1JFR0VYUC5leGVjKHR5cGUpO1xuXG4gIGlmICghbWF0Y2gpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBleHRzID0gZXh0ZW5zaW9ucy5nZXQobWF0Y2hbMV0udG9Mb3dlckNhc2UoKSk7XG5cbiAgaWYgKCFleHRzIHx8ICFleHRzLmxlbmd0aCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHJldHVybiBleHRzWzBdO1xufVxuIl0sIm5hbWVzIjpb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