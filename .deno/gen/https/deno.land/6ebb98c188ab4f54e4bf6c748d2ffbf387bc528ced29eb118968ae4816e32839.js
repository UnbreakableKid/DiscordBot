/**
 * Parse the `req` url with memoization.
 *
 * @param {Request} req
 * @return {ParsedURL}
 * @public
 */ export function parseUrl(req) {
  const url = req.url;
  if (url === undefined) {
    // URL is undefined
    return undefined;
  }
  let parsed = req._parsedUrl;
  if (fresh(url, parsed)) {
    // Return cached URL parse
    return parsed;
  }
  // Parse the URL
  parsed = fastParse(url);
  parsed._raw = url;
  return req._parsedUrl = parsed;
}
/**
 * Parse the `req` original url with fallback and memoization.
 *
 * @param {Request} req
 * @return {Object}
 * @public
 */ export function originalUrl(req) {
  const url = req.originalUrl;
  if (typeof url !== "string") {
    // Fallback
    return parseUrl(req);
  }
  let parsed = req._parsedOriginalUrl;
  if (fresh(url, parsed)) {
    // Return cached URL parse
    return parsed;
  }
  // Parse the URL
  parsed = fastParse(url);
  parsed._raw = url;
  return req._parsedOriginalUrl = parsed;
}
/**
 * Parse the `str` url with fast-path short-cut.
 *
 * @param {string} str
 * @return {ParsedURL}
 * @private
 */ function fastParse(str) {
  if (typeof str !== "string" || str.charCodeAt(0) !== 47) {
    try {
      return new URL(str);
    } catch (_) {
      // Gracefully fallback to pattern matching.
    }
  }
  let pathname = str;
  let query = null;
  let search = null;
  // This takes the regexp from https://github.com/joyent/node/pull/7878
  // Which is /^(\/[^?#\s]*)(\?[^#\s]*)?$/
  // And unrolls it into a for loop
  for (let i = 1; i < str.length; i++) {
    switch (str.charCodeAt(i)) {
      case 63:
        /* ?  */ if (search === null) {
          pathname = str.substring(0, i);
          query = str.substring(i + 1);
          search = str.substring(i);
        }
        break;
      case 9:
      /* \t */
      case 10:
      /* \n */
      case 12:
      /* \f */
      case 13:
      /* \r */
      case 32:
      /*    */
      case 35:
      /* #  */
      case 160:
      case 65279:
        return new URL(str);
    }
  }
  const url = {};
  url.path = str || null;
  url.href = str || null;
  url.pathname = pathname || null;
  url.query = query || null;
  url.search = search || null;
  url.searchParams = new URLSearchParams(search || "");
  return url;
}
/**
 * Determine if parsed is still fresh for url.
 *
 * @param {string} url
 * @param {ParsedURL} parsedUrl
 * @return {boolean}
 * @private
 */ function fresh(url, parsedUrl) {
  return typeof parsedUrl === "object" && parsedUrl !== null &&
    parsedUrl._raw === url;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy91dGlscy9wYXJzZVVybC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiBQb3J0IG9mIHBhcnNlVXJsIChodHRwczovL2dpdGh1Yi5jb20vcGlsbGFyanMvcGFyc2VVcmwpIGZvciBEZW5vLlxuICpcbiAqIExpY2Vuc2VkIGFzIGZvbGxvd3M6XG4gKlxuICogKFRoZSBNSVQgTGljZW5zZSlcbiAqIFxuICogQ29weXJpZ2h0IChjKSAyMDE0IEpvbmF0aGFuIE9uZyA8bWVAam9uZ2xlYmVycnkuY29tPlxuICogQ29weXJpZ2h0IChjKSAyMDE0LTIwMTcgRG91Z2xhcyBDaHJpc3RvcGhlciBXaWxzb24gPGRvdWdAc29tZXRoaW5nZG91Zy5jb20+XG4gKiBcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZ1xuICogYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4gKiAnU29mdHdhcmUnKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4gKiB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4gKiBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbiAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0b1xuICogdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICogXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxuICogaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKiBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICogRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4gKiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuXG4gKiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWVxuICogQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCxcbiAqIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFXG4gKiBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqIFxuICovXG5cbmltcG9ydCB0eXBlIHsgUGFyc2VkVVJMLCBSZXF1ZXN0IH0gZnJvbSBcIi4uL3R5cGVzLnRzXCI7XG5cbi8qKlxuICogUGFyc2UgdGhlIGByZXFgIHVybCB3aXRoIG1lbW9pemF0aW9uLlxuICpcbiAqIEBwYXJhbSB7UmVxdWVzdH0gcmVxXG4gKiBAcmV0dXJuIHtQYXJzZWRVUkx9XG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVVybChyZXE6IFJlcXVlc3QpOiBQYXJzZWRVUkwgfCB1bmRlZmluZWQge1xuICBjb25zdCB1cmwgPSByZXEudXJsO1xuXG4gIGlmICh1cmwgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIFVSTCBpcyB1bmRlZmluZWRcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgbGV0IHBhcnNlZCA9IHJlcS5fcGFyc2VkVXJsO1xuXG4gIGlmIChmcmVzaCh1cmwsIHBhcnNlZCkpIHtcbiAgICAvLyBSZXR1cm4gY2FjaGVkIFVSTCBwYXJzZVxuICAgIHJldHVybiBwYXJzZWQ7XG4gIH1cblxuICAvLyBQYXJzZSB0aGUgVVJMXG4gIHBhcnNlZCA9IGZhc3RQYXJzZSh1cmwpO1xuICBwYXJzZWQuX3JhdyA9IHVybDtcblxuICByZXR1cm4gKHJlcS5fcGFyc2VkVXJsID0gcGFyc2VkKTtcbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgYHJlcWAgb3JpZ2luYWwgdXJsIHdpdGggZmFsbGJhY2sgYW5kIG1lbW9pemF0aW9uLlxuICpcbiAqIEBwYXJhbSB7UmVxdWVzdH0gcmVxXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvcmlnaW5hbFVybChyZXE6IFJlcXVlc3QpOiBQYXJzZWRVUkwgfCB1bmRlZmluZWQge1xuICBjb25zdCB1cmwgPSByZXEub3JpZ2luYWxVcmw7XG5cbiAgaWYgKHR5cGVvZiB1cmwgIT09IFwic3RyaW5nXCIpIHtcbiAgICAvLyBGYWxsYmFja1xuICAgIHJldHVybiBwYXJzZVVybChyZXEpO1xuICB9XG5cbiAgbGV0IHBhcnNlZCA9IHJlcS5fcGFyc2VkT3JpZ2luYWxVcmw7XG5cbiAgaWYgKGZyZXNoKHVybCwgcGFyc2VkKSkge1xuICAgIC8vIFJldHVybiBjYWNoZWQgVVJMIHBhcnNlXG4gICAgcmV0dXJuIHBhcnNlZDtcbiAgfVxuXG4gIC8vIFBhcnNlIHRoZSBVUkxcbiAgcGFyc2VkID0gZmFzdFBhcnNlKHVybCk7XG4gIHBhcnNlZC5fcmF3ID0gdXJsO1xuXG4gIHJldHVybiAocmVxLl9wYXJzZWRPcmlnaW5hbFVybCA9IHBhcnNlZCk7XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGBzdHJgIHVybCB3aXRoIGZhc3QtcGF0aCBzaG9ydC1jdXQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICogQHJldHVybiB7UGFyc2VkVVJMfVxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gZmFzdFBhcnNlKHN0cjogc3RyaW5nKTogUGFyc2VkVVJMIHtcbiAgaWYgKHR5cGVvZiBzdHIgIT09IFwic3RyaW5nXCIgfHwgc3RyLmNoYXJDb2RlQXQoMCkgIT09IDB4MmYgLyogLyAqLykge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gbmV3IFVSTChzdHIpO1xuICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgIC8vIEdyYWNlZnVsbHkgZmFsbGJhY2sgdG8gcGF0dGVybiBtYXRjaGluZy5cbiAgICB9XG4gIH1cblxuICBsZXQgcGF0aG5hbWUgPSBzdHI7XG4gIGxldCBxdWVyeSA9IG51bGw7XG4gIGxldCBzZWFyY2ggPSBudWxsO1xuXG4gIC8vIFRoaXMgdGFrZXMgdGhlIHJlZ2V4cCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9qb3llbnQvbm9kZS9wdWxsLzc4NzhcbiAgLy8gV2hpY2ggaXMgL14oXFwvW14/I1xcc10qKShcXD9bXiNcXHNdKik/JC9cbiAgLy8gQW5kIHVucm9sbHMgaXQgaW50byBhIGZvciBsb29wXG4gIGZvciAobGV0IGkgPSAxOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgc3dpdGNoIChzdHIuY2hhckNvZGVBdChpKSkge1xuICAgICAgY2FzZSAweDNmOi8qID8gICovXG4gICAgICAgIGlmIChzZWFyY2ggPT09IG51bGwpIHtcbiAgICAgICAgICBwYXRobmFtZSA9IHN0ci5zdWJzdHJpbmcoMCwgaSk7XG4gICAgICAgICAgcXVlcnkgPSBzdHIuc3Vic3RyaW5nKGkgKyAxKTtcbiAgICAgICAgICBzZWFyY2ggPSBzdHIuc3Vic3RyaW5nKGkpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAweDA5Oi8qIFxcdCAqL1xuICAgICAgY2FzZSAweDBhOi8qIFxcbiAqL1xuICAgICAgY2FzZSAweDBjOi8qIFxcZiAqL1xuICAgICAgY2FzZSAweDBkOi8qIFxcciAqL1xuICAgICAgY2FzZSAweDIwOi8qICAgICovXG4gICAgICBjYXNlIDB4MjM6LyogIyAgKi9cbiAgICAgIGNhc2UgMHhhMDpcbiAgICAgIGNhc2UgMHhmZWZmOlxuICAgICAgICByZXR1cm4gbmV3IFVSTChzdHIpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHVybCA9IHt9IGFzIFBhcnNlZFVSTDtcblxuICB1cmwucGF0aCA9IHN0ciB8fCBudWxsO1xuICAodXJsIGFzIGFueSkuaHJlZiA9IHN0ciB8fCBudWxsO1xuICAodXJsIGFzIGFueSkucGF0aG5hbWUgPSBwYXRobmFtZSB8fCBudWxsO1xuICAodXJsIGFzIGFueSkucXVlcnkgPSBxdWVyeSB8fCBudWxsO1xuICAodXJsIGFzIGFueSkuc2VhcmNoID0gc2VhcmNoIHx8IG51bGw7XG4gICh1cmwgYXMgYW55KS5zZWFyY2hQYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHNlYXJjaCB8fCBcIlwiKTtcblxuICByZXR1cm4gdXJsO1xufVxuXG4vKipcbiAqIERldGVybWluZSBpZiBwYXJzZWQgaXMgc3RpbGwgZnJlc2ggZm9yIHVybC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsXG4gKiBAcGFyYW0ge1BhcnNlZFVSTH0gcGFyc2VkVXJsXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gZnJlc2godXJsOiBzdHJpbmcsIHBhcnNlZFVybDogUGFyc2VkVVJMIHwgdW5kZWZpbmVkKTogYm9vbGVhbiB7XG4gIHJldHVybiB0eXBlb2YgcGFyc2VkVXJsID09PSBcIm9iamVjdFwiICYmXG4gICAgcGFyc2VkVXJsICE9PSBudWxsICYmXG4gICAgcGFyc2VkVXJsLl9yYXcgPT09IHVybDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFpQ0EsRUFNRyxBQU5IOzs7Ozs7Q0FNRyxBQU5ILEVBTUcsaUJBQ2EsUUFBUSxDQUFDLEdBQVk7VUFD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
