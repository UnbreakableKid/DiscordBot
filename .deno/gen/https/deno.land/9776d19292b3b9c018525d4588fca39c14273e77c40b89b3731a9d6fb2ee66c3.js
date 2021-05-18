/*!
 * encodeurl
 * Copyright(c) 2016 Douglas Christopher Wilson
 * Copyright (c) 2020 Henry Zhuang
 * MIT Licensed
 */ /**
 * RegExp to match non-URL code points, *after* encoding (i.e. not including "%")
 * and including invalid escape sequences.
 * @private
 */ const ENCODE_CHARS_REGEXP = /(?:[^\x21\x25\x26-\x3B\x3D\x3F-\x5B\x5D\x5F\x61-\x7A\x7E]|%(?:[^0-9A-Fa-f]|[0-9A-Fa-f][^0-9A-Fa-f]|$))+/g;
/**
 * RegExp to match unmatched surrogate pair.
 * @private
 */ const UNMATCHED_SURROGATE_PAIR_REGEXP = /(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]|[\uD800-\uDBFF]([^\uDC00-\uDFFF]|$)/g;
/**
 * String to replace unmatched surrogate pair with.
 * @private
 */ const UNMATCHED_SURROGATE_PAIR_REPLACE = "$1\uFFFD$2";
/**
 * Encode a URL to a percent-encoded form, excluding already-encoded sequences.
 *
 * This function will take an already-encoded URL and encode all the non-URL
 * code points. This function will not encode the "%" character unless it is
 * not part of a valid sequence (`%20` will be left as-is, but `%foo` will
 * be encoded as `%25foo`).
 *
 * This encode is meant to be "safe" and does not throw errors. It will try as
 * hard as it can to properly encode the given URL, including replacing any raw,
 * unpaired surrogate pairs with the Unicode replacement character prior to
 * encoding.
 *
 * @param {string} url
 * @return {string}
 * @public
 */ export function encodeUrl(url) {
    return String(url).replace(UNMATCHED_SURROGATE_PAIR_REGEXP, UNMATCHED_SURROGATE_PAIR_REPLACE).replace(ENCODE_CHARS_REGEXP, encodeURI);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2VuY29kZXVybEAxLjAuMC9tb2QudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogZW5jb2RldXJsXG4gKiBDb3B5cmlnaHQoYykgMjAxNiBEb3VnbGFzIENocmlzdG9waGVyIFdpbHNvblxuICogQ29weXJpZ2h0IChjKSAyMDIwIEhlbnJ5IFpodWFuZ1xuICogTUlUIExpY2Vuc2VkXG4gKi9cblxuLyoqXG4gKiBSZWdFeHAgdG8gbWF0Y2ggbm9uLVVSTCBjb2RlIHBvaW50cywgKmFmdGVyKiBlbmNvZGluZyAoaS5lLiBub3QgaW5jbHVkaW5nIFwiJVwiKVxuICogYW5kIGluY2x1ZGluZyBpbnZhbGlkIGVzY2FwZSBzZXF1ZW5jZXMuXG4gKiBAcHJpdmF0ZVxuICovXG5cbmNvbnN0IEVOQ09ERV9DSEFSU19SRUdFWFAgPVxuICAvKD86W15cXHgyMVxceDI1XFx4MjYtXFx4M0JcXHgzRFxceDNGLVxceDVCXFx4NURcXHg1RlxceDYxLVxceDdBXFx4N0VdfCUoPzpbXjAtOUEtRmEtZl18WzAtOUEtRmEtZl1bXjAtOUEtRmEtZl18JCkpKy9nO1xuXG4vKipcbiAqIFJlZ0V4cCB0byBtYXRjaCB1bm1hdGNoZWQgc3Vycm9nYXRlIHBhaXIuXG4gKiBAcHJpdmF0ZVxuICovXG5cbmNvbnN0IFVOTUFUQ0hFRF9TVVJST0dBVEVfUEFJUl9SRUdFWFAgPVxuICAvKF58W15cXHVEODAwLVxcdURCRkZdKVtcXHVEQzAwLVxcdURGRkZdfFtcXHVEODAwLVxcdURCRkZdKFteXFx1REMwMC1cXHVERkZGXXwkKS9nO1xuXG4vKipcbiAqIFN0cmluZyB0byByZXBsYWNlIHVubWF0Y2hlZCBzdXJyb2dhdGUgcGFpciB3aXRoLlxuICogQHByaXZhdGVcbiAqL1xuXG5jb25zdCBVTk1BVENIRURfU1VSUk9HQVRFX1BBSVJfUkVQTEFDRSA9IFwiJDFcXHVGRkZEJDJcIjtcblxuLyoqXG4gKiBFbmNvZGUgYSBVUkwgdG8gYSBwZXJjZW50LWVuY29kZWQgZm9ybSwgZXhjbHVkaW5nIGFscmVhZHktZW5jb2RlZCBzZXF1ZW5jZXMuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIHRha2UgYW4gYWxyZWFkeS1lbmNvZGVkIFVSTCBhbmQgZW5jb2RlIGFsbCB0aGUgbm9uLVVSTFxuICogY29kZSBwb2ludHMuIFRoaXMgZnVuY3Rpb24gd2lsbCBub3QgZW5jb2RlIHRoZSBcIiVcIiBjaGFyYWN0ZXIgdW5sZXNzIGl0IGlzXG4gKiBub3QgcGFydCBvZiBhIHZhbGlkIHNlcXVlbmNlIChgJTIwYCB3aWxsIGJlIGxlZnQgYXMtaXMsIGJ1dCBgJWZvb2Agd2lsbFxuICogYmUgZW5jb2RlZCBhcyBgJTI1Zm9vYCkuXG4gKlxuICogVGhpcyBlbmNvZGUgaXMgbWVhbnQgdG8gYmUgXCJzYWZlXCIgYW5kIGRvZXMgbm90IHRocm93IGVycm9ycy4gSXQgd2lsbCB0cnkgYXNcbiAqIGhhcmQgYXMgaXQgY2FuIHRvIHByb3Blcmx5IGVuY29kZSB0aGUgZ2l2ZW4gVVJMLCBpbmNsdWRpbmcgcmVwbGFjaW5nIGFueSByYXcsXG4gKiB1bnBhaXJlZCBzdXJyb2dhdGUgcGFpcnMgd2l0aCB0aGUgVW5pY29kZSByZXBsYWNlbWVudCBjaGFyYWN0ZXIgcHJpb3IgdG9cbiAqIGVuY29kaW5nLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqIEBwdWJsaWNcbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlVXJsKHVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIFN0cmluZyh1cmwpXG4gICAgLnJlcGxhY2UoVU5NQVRDSEVEX1NVUlJPR0FURV9QQUlSX1JFR0VYUCwgVU5NQVRDSEVEX1NVUlJPR0FURV9QQUlSX1JFUExBQ0UpXG4gICAgLnJlcGxhY2UoRU5DT0RFX0NIQVJTX1JFR0VYUCwgZW5jb2RlVVJJKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUtHLEFBTEg7Ozs7O0NBS0csQUFMSCxFQUtHLENBRUgsRUFJRyxBQUpIOzs7O0NBSUcsQUFKSCxFQUlHLE9BRUcsbUJBQW1CO0FBR3pCLEVBR0csQUFISDs7O0NBR0csQUFISCxFQUdHLE9BRUcsK0JBQStCO0FBR3JDLEVBR0csQUFISDs7O0NBR0csQUFISCxFQUdHLE9BRUcsZ0NBQWdDLElBQUcsVUFBWTtBQUVyRCxFQWdCRyxBQWhCSDs7Ozs7Ozs7Ozs7Ozs7OztDQWdCRyxBQWhCSCxFQWdCRyxpQkFFYSxTQUFTLENBQUMsR0FBVztXQUM1QixNQUFNLENBQUMsR0FBRyxFQUNkLE9BQU8sQ0FBQywrQkFBK0IsRUFBRSxnQ0FBZ0MsRUFDekUsT0FBTyxDQUFDLG1CQUFtQixFQUFFLFNBQVMifQ==