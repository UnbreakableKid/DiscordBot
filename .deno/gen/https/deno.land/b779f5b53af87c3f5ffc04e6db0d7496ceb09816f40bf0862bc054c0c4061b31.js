export { preferredCharsets };
const simpleCharsetRegExp = /^\s*([^\s;]+)\s*(?:;(.*))?$/;
/**
 * Parse the Accept-Charset header.
 */ function parseAcceptCharset(accept) {
  const accepts = accept.split(",");
  const parsedAccepts = [];
  for (let i = 0; i < accepts.length; i++) {
    const charset = parseCharset(accepts[i].trim(), i);
    if (charset) {
      parsedAccepts.push(charset);
    }
  }
  return parsedAccepts;
}
/**
 * Parse a charset from the Accept-Charset header.
 */ function parseCharset(str, i) {
  const match = simpleCharsetRegExp.exec(str);
  if (!match) return null;
  const charset = match[1];
  let q = 1;
  if (match[2]) {
    const params = match[2].split(";");
    for (let j = 0; j < params.length; j++) {
      const p = params[j].trim().split("=");
      if (p[0] === "q") {
        q = parseFloat(p[1]);
        break;
      }
    }
  }
  return {
    charset,
    q: q,
    i: i,
  };
}
/**
 * Get the priority of a charset.
 */ function getCharsetPriority(charset, accepted, index) {
  let priority = {
    o: -1,
    q: 0,
    s: 0,
  };
  for (let i = 0; i < accepted.length; i++) {
    const spec = specify(charset, accepted[i], index);
    if (
      spec &&
      (priority.s - spec.s || priority.q - spec.q || priority.o - spec.o) < 0
    ) {
      priority = spec;
    }
  }
  return priority;
}
/**
 * Get the specificity of the charset.
 */ function specify(charset, spec, index) {
  let s = 0;
  if (spec.charset.toLowerCase() === charset.toLowerCase()) {
    s |= 1;
  } else if (spec.charset !== "*") {
    return null;
  }
  return {
    i: index,
    o: spec.i,
    q: spec.q,
    s: s,
  };
}
/**
 * Get the preferred charsets from an Accept-Charset header.
 */ function preferredCharsets(accept, provided) {
  // RFC 2616 sec 14.2: no header = *
  const accepts = parseAcceptCharset(accept === null ? "*" : accept || "");
  if (!provided) {
    // sorted list of all charsets
    return accepts.filter(isQuality).sort(compareSpecs).map(getFullCharset);
  }
  const priorities = provided.map(function getPriority(type, index) {
    return getCharsetPriority(type, accepts, index);
  });
  // sorted list of accepted charsets
  return priorities.filter(isQuality).sort(compareSpecs).map(
    function getCharset(priority) {
      return provided[priorities.indexOf(priority)];
    },
  );
}
/**
 * Compare two specs.
 */ function compareSpecs(a, b) {
  return b.q - a.q || b.s - a.s || a.o - b.o || a.i - b.i || 0;
}
/**
 * Get full charset string.
 */ function getFullCharset(spec) {
  return spec.charset;
}
/**
 * Check if a spec has any quality.
 */ function isQuality(spec) {
  return spec.q > 0;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L25lZ290aWF0b3JAMS4wLjEvc3JjL2NoYXJzZXQudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQmFzZWQgb24gaHR0cHM6Ly9naXRodWIuY29tL2pzaHR0cC9uZWdvdGlhdG9yL2Jsb2IvbWFzdGVyL2xpYi9jaGFyc2V0LmpzXG4gKiBDb3B5cmlnaHQoYykgMjAxMiBJc2FhYyBaLiBTY2hsdWV0ZXJcbiAqIENvcHlyaWdodChjKSAyMDE0IEZlZGVyaWNvIFJvbWVyb1xuICogQ29weXJpZ2h0KGMpIDIwMTQtMjAxNSBEb3VnbGFzIENocmlzdG9waGVyIFdpbHNvblxuICogQ29weXJpZ2h0KGMpIDIwMjAgSGVucnkgWmh1YW5nXG4gKiBNSVQgTGljZW5zZWRcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IFByaW9yaXR5IH0gZnJvbSBcIi4vdHlwZXMudHNcIjtcblxuZXhwb3J0IHsgcHJlZmVycmVkQ2hhcnNldHMgfTtcblxuY29uc3Qgc2ltcGxlQ2hhcnNldFJlZ0V4cCA9IC9eXFxzKihbXlxccztdKylcXHMqKD86OyguKikpPyQvO1xuXG4vKipcbiAqIFBhcnNlIHRoZSBBY2NlcHQtQ2hhcnNldCBoZWFkZXIuXG4gKi9cbmZ1bmN0aW9uIHBhcnNlQWNjZXB0Q2hhcnNldChhY2NlcHQ6IHN0cmluZyk6IENoYXJzZXRbXSB7XG4gIGNvbnN0IGFjY2VwdHMgPSBhY2NlcHQuc3BsaXQoXCIsXCIpO1xuICBjb25zdCBwYXJzZWRBY2NlcHRzOiBDaGFyc2V0W10gPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGFjY2VwdHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjaGFyc2V0ID0gcGFyc2VDaGFyc2V0KGFjY2VwdHNbaV0udHJpbSgpLCBpKTtcbiAgICBpZiAoY2hhcnNldCkge1xuICAgICAgcGFyc2VkQWNjZXB0cy5wdXNoKGNoYXJzZXQpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJzZWRBY2NlcHRzO1xufVxuXG5pbnRlcmZhY2UgQ2hhcnNldCB7XG4gIGNoYXJzZXQ6IHN0cmluZztcbiAgcTogbnVtYmVyO1xuICBpOiBudW1iZXI7XG59XG5cbi8qKlxuICogUGFyc2UgYSBjaGFyc2V0IGZyb20gdGhlIEFjY2VwdC1DaGFyc2V0IGhlYWRlci5cbiAqL1xuZnVuY3Rpb24gcGFyc2VDaGFyc2V0KHN0cjogc3RyaW5nLCBpOiBudW1iZXIpOiBDaGFyc2V0IHwgbnVsbCB7XG4gIGNvbnN0IG1hdGNoID0gc2ltcGxlQ2hhcnNldFJlZ0V4cC5leGVjKHN0cik7XG4gIGlmICghbWF0Y2gpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IGNoYXJzZXQgPSBtYXRjaFsxXTtcbiAgbGV0IHEgPSAxO1xuICBpZiAobWF0Y2hbMl0pIHtcbiAgICBjb25zdCBwYXJhbXMgPSBtYXRjaFsyXS5zcGxpdChcIjtcIik7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBwYXJhbXMubGVuZ3RoOyBqKyspIHtcbiAgICAgIGNvbnN0IHAgPSBwYXJhbXNbal0udHJpbSgpLnNwbGl0KFwiPVwiKTtcbiAgICAgIGlmIChwWzBdID09PSBcInFcIikge1xuICAgICAgICBxID0gcGFyc2VGbG9hdChwWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBjaGFyc2V0LFxuICAgIHE6IHEsXG4gICAgaTogaSxcbiAgfTtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIHByaW9yaXR5IG9mIGEgY2hhcnNldC5cbiAqL1xuZnVuY3Rpb24gZ2V0Q2hhcnNldFByaW9yaXR5KFxuICBjaGFyc2V0OiBzdHJpbmcsXG4gIGFjY2VwdGVkOiBDaGFyc2V0W10sXG4gIGluZGV4OiBudW1iZXIsXG4pOiBQcmlvcml0eSB7XG4gIGxldCBwcmlvcml0eSA9IHsgbzogLTEsIHE6IDAsIHM6IDAgfTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGFjY2VwdGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgc3BlYyA9IHNwZWNpZnkoY2hhcnNldCwgYWNjZXB0ZWRbaV0sIGluZGV4KTtcblxuICAgIGlmIChcbiAgICAgIHNwZWMgJiZcbiAgICAgIChwcmlvcml0eS5zIC0gc3BlYy5zIHx8IHByaW9yaXR5LnEgLSBzcGVjLnEgfHwgcHJpb3JpdHkubyAtIHNwZWMubykgPCAwXG4gICAgKSB7XG4gICAgICBwcmlvcml0eSA9IHNwZWM7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHByaW9yaXR5O1xufVxuXG4vKipcbiAqIEdldCB0aGUgc3BlY2lmaWNpdHkgb2YgdGhlIGNoYXJzZXQuXG4gKi9cbmZ1bmN0aW9uIHNwZWNpZnkoXG4gIGNoYXJzZXQ6IHN0cmluZyxcbiAgc3BlYzogQ2hhcnNldCxcbiAgaW5kZXg6IG51bWJlcixcbik6IFByaW9yaXR5IHwgbnVsbCB7XG4gIGxldCBzID0gMDtcbiAgaWYgKHNwZWMuY2hhcnNldC50b0xvd2VyQ2FzZSgpID09PSBjaGFyc2V0LnRvTG93ZXJDYXNlKCkpIHtcbiAgICBzIHw9IDE7XG4gIH0gZWxzZSBpZiAoc3BlYy5jaGFyc2V0ICE9PSBcIipcIikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpOiBpbmRleCxcbiAgICBvOiBzcGVjLmksXG4gICAgcTogc3BlYy5xLFxuICAgIHM6IHMsXG4gIH07XG59XG5cbi8qKlxuICogR2V0IHRoZSBwcmVmZXJyZWQgY2hhcnNldHMgZnJvbSBhbiBBY2NlcHQtQ2hhcnNldCBoZWFkZXIuXG4gKi9cbmZ1bmN0aW9uIHByZWZlcnJlZENoYXJzZXRzKFxuICBhY2NlcHQ6IHN0cmluZyB8IG51bGwsXG4gIHByb3ZpZGVkPzogc3RyaW5nW10sXG4pOiBzdHJpbmdbXSB7XG4gIC8vIFJGQyAyNjE2IHNlYyAxNC4yOiBubyBoZWFkZXIgPSAqXG4gIGNvbnN0IGFjY2VwdHMgPSBwYXJzZUFjY2VwdENoYXJzZXQoYWNjZXB0ID09PSBudWxsID8gXCIqXCIgOiBhY2NlcHQgfHwgXCJcIik7XG5cbiAgaWYgKCFwcm92aWRlZCkge1xuICAgIC8vIHNvcnRlZCBsaXN0IG9mIGFsbCBjaGFyc2V0c1xuICAgIHJldHVybiBhY2NlcHRzXG4gICAgICAuZmlsdGVyKGlzUXVhbGl0eSlcbiAgICAgIC5zb3J0KGNvbXBhcmVTcGVjcylcbiAgICAgIC5tYXAoZ2V0RnVsbENoYXJzZXQpO1xuICB9XG5cbiAgY29uc3QgcHJpb3JpdGllcyA9IHByb3ZpZGVkLm1hcChmdW5jdGlvbiBnZXRQcmlvcml0eSh0eXBlLCBpbmRleCkge1xuICAgIHJldHVybiBnZXRDaGFyc2V0UHJpb3JpdHkodHlwZSwgYWNjZXB0cywgaW5kZXgpO1xuICB9KTtcblxuICAvLyBzb3J0ZWQgbGlzdCBvZiBhY2NlcHRlZCBjaGFyc2V0c1xuICByZXR1cm4gcHJpb3JpdGllcy5maWx0ZXIoaXNRdWFsaXR5KS5zb3J0KGNvbXBhcmVTcGVjcykubWFwKFxuICAgIGZ1bmN0aW9uIGdldENoYXJzZXQocHJpb3JpdHkpIHtcbiAgICAgIHJldHVybiBwcm92aWRlZFtwcmlvcml0aWVzLmluZGV4T2YocHJpb3JpdHkpXTtcbiAgICB9LFxuICApO1xufVxuXG4vKipcbiAqIENvbXBhcmUgdHdvIHNwZWNzLlxuICovXG5mdW5jdGlvbiBjb21wYXJlU3BlY3MoYTogYW55LCBiOiBhbnkpOiBudW1iZXIge1xuICByZXR1cm4gKGIucSAtIGEucSkgfHwgKGIucyAtIGEucyEpIHx8IChhLm8gLSBiLm8pIHx8IChhLmkgLSBiLmkpIHx8IDA7XG59XG5cbi8qKlxuICogR2V0IGZ1bGwgY2hhcnNldCBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIGdldEZ1bGxDaGFyc2V0KHNwZWM6IENoYXJzZXQpOiBzdHJpbmcge1xuICByZXR1cm4gc3BlYy5jaGFyc2V0O1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGEgc3BlYyBoYXMgYW55IHF1YWxpdHkuXG4gKi9cbmZ1bmN0aW9uIGlzUXVhbGl0eShzcGVjOiBDaGFyc2V0IHwgUHJpb3JpdHkpOiBib29sZWFuIHtcbiAgcmV0dXJuIHNw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
