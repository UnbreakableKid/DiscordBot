export { preferredEncodings };
const simpleEncodingRegExp = /^\s*([^\s;]+)\s*(?:;(.*))?$/;
/**
 * Parse the Accept-Encoding header.
 */ function parseAcceptEncoding(accept) {
  const accepts = accept.split(",");
  let hasIdentity = false;
  let minQuality = 1;
  const parsedEncodings = [];
  for (let i = 0; i < accepts.length; i++) {
    const encoding = parseEncoding(accepts[i].trim(), i);
    if (encoding) {
      parsedEncodings.push(encoding);
      hasIdentity = hasIdentity || specify("identity", encoding);
      minQuality = Math.min(minQuality, encoding.q || 1);
    }
  }
  if (!hasIdentity) {
    /*
     * If identity doesn't explicitly appear in the accept-encoding header,
     * it's added to the list of acceptable encoding with the lowest q
     */ parsedEncodings.push({
      encoding: "identity",
      q: minQuality,
      i: accepts.length,
    });
  }
  return parsedEncodings;
}
/**
 * Parse an encoding from the Accept-Encoding header.
 */ function parseEncoding(str, i) {
  const match = simpleEncodingRegExp.exec(str);
  if (!match) return null;
  const encoding = match[1];
  let q = 1;
  if (match[2]) {
    const params = match[2].split(";");
    for (var j = 0; j < params.length; j++) {
      const p = params[j].trim().split("=");
      if (p[0] === "q") {
        q = parseFloat(p[1]);
        break;
      }
    }
  }
  return {
    encoding,
    q: q,
    i: i,
  };
}
/**
 * Get the priority of an encoding.
 */ function getEncodingPriority(encoding, accepted, index) {
  let priority = {
    o: -1,
    q: 0,
    s: 0,
  };
  for (let i = 0; i < accepted.length; i++) {
    const spec = specify(encoding, accepted[i], index);
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
 * Get the specificity of the encoding.
 */ function specify(encoding, spec, index) {
  let s = 0;
  if (spec.encoding.toLowerCase() === encoding.toLowerCase()) {
    s |= 1;
  } else if (spec.encoding !== "*") {
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
 * Get the preferred encodings from an Accept-Encoding header.
 */ function preferredEncodings(accept, provided) {
  const accepts = parseAcceptEncoding(accept || "");
  if (!provided) {
    // sorted list of all encodings
    return accepts.filter(isQuality).sort(compareSpecs).map(getFullEncoding);
  }
  const priorities = provided.map(function getPriority(type, index) {
    return getEncodingPriority(type, accepts, index);
  });
  // sorted list of accepted encodings
  return priorities.filter(isQuality).sort(compareSpecs).map(
    function getEncoding(priority) {
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
 * Get full encoding string.
 */ function getFullEncoding(spec) {
  return spec.encoding;
}
/**
 * Check if a spec has any quality.
 */ function isQuality(spec) {
  return spec.q > 0;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L25lZ290aWF0b3JAMS4wLjEvc3JjL2VuY29kaW5nLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9qc2h0dHAvbmVnb3RpYXRvci9ibG9iL21hc3Rlci9saWIvZW5jb2RpbmcuanNcbiAqIENvcHlyaWdodChjKSAyMDEyIElzYWFjIFouIFNjaGx1ZXRlclxuICogQ29weXJpZ2h0KGMpIDIwMTQgRmVkZXJpY28gUm9tZXJvXG4gKiBDb3B5cmlnaHQoYykgMjAxNC0yMDE1IERvdWdsYXMgQ2hyaXN0b3BoZXIgV2lsc29uXG4gKiBDb3B5cmlnaHQoYykgMjAyMCBIZW5yeSBaaHVhbmdcbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbmltcG9ydCB0eXBlIHsgUHJpb3JpdHkgfSBmcm9tIFwiLi90eXBlcy50c1wiO1xuXG5leHBvcnQgeyBwcmVmZXJyZWRFbmNvZGluZ3MgfTtcblxuY29uc3Qgc2ltcGxlRW5jb2RpbmdSZWdFeHAgPSAvXlxccyooW15cXHM7XSspXFxzKig/OjsoLiopKT8kLztcblxuaW50ZXJmYWNlIEVuY29kaW5nIHtcbiAgZW5jb2Rpbmc6IHN0cmluZztcbiAgcTogbnVtYmVyO1xuICBpOiBudW1iZXI7XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIEFjY2VwdC1FbmNvZGluZyBoZWFkZXIuXG4gKi9cbmZ1bmN0aW9uIHBhcnNlQWNjZXB0RW5jb2RpbmcoYWNjZXB0OiBzdHJpbmcpOiBFbmNvZGluZ1tdIHtcbiAgY29uc3QgYWNjZXB0cyA9IGFjY2VwdC5zcGxpdChcIixcIik7XG4gIGxldCBoYXNJZGVudGl0eTogYm9vbGVhbiB8IFByaW9yaXR5IHwgbnVsbCA9IGZhbHNlO1xuICBsZXQgbWluUXVhbGl0eSA9IDE7XG4gIGNvbnN0IHBhcnNlZEVuY29kaW5nczogRW5jb2RpbmdbXSA9IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYWNjZXB0cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGVuY29kaW5nID0gcGFyc2VFbmNvZGluZyhhY2NlcHRzW2ldLnRyaW0oKSwgaSk7XG5cbiAgICBpZiAoZW5jb2RpbmcpIHtcbiAgICAgIHBhcnNlZEVuY29kaW5ncy5wdXNoKGVuY29kaW5nKTtcbiAgICAgIGhhc0lkZW50aXR5ID0gaGFzSWRlbnRpdHkgfHwgc3BlY2lmeShcImlkZW50aXR5XCIsIGVuY29kaW5nKTtcbiAgICAgIG1pblF1YWxpdHkgPSBNYXRoLm1pbihtaW5RdWFsaXR5LCBlbmNvZGluZy5xIHx8IDEpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghaGFzSWRlbnRpdHkpIHtcbiAgICAvKlxuICAgICAqIElmIGlkZW50aXR5IGRvZXNuJ3QgZXhwbGljaXRseSBhcHBlYXIgaW4gdGhlIGFjY2VwdC1lbmNvZGluZyBoZWFkZXIsXG4gICAgICogaXQncyBhZGRlZCB0byB0aGUgbGlzdCBvZiBhY2NlcHRhYmxlIGVuY29kaW5nIHdpdGggdGhlIGxvd2VzdCBxXG4gICAgICovXG4gICAgcGFyc2VkRW5jb2RpbmdzLnB1c2goe1xuICAgICAgZW5jb2Rpbmc6IFwiaWRlbnRpdHlcIixcbiAgICAgIHE6IG1pblF1YWxpdHksXG4gICAgICBpOiBhY2NlcHRzLmxlbmd0aCxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBwYXJzZWRFbmNvZGluZ3M7XG59XG5cbi8qKlxuICogUGFyc2UgYW4gZW5jb2RpbmcgZnJvbSB0aGUgQWNjZXB0LUVuY29kaW5nIGhlYWRlci5cbiAqL1xuZnVuY3Rpb24gcGFyc2VFbmNvZGluZyhzdHI6IHN0cmluZywgaTogbnVtYmVyKTogRW5jb2RpbmcgfCBudWxsIHtcbiAgY29uc3QgbWF0Y2ggPSBzaW1wbGVFbmNvZGluZ1JlZ0V4cC5leGVjKHN0cik7XG4gIGlmICghbWF0Y2gpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IGVuY29kaW5nID0gbWF0Y2hbMV07XG4gIGxldCBxID0gMTtcbiAgaWYgKG1hdGNoWzJdKSB7XG4gICAgY29uc3QgcGFyYW1zID0gbWF0Y2hbMl0uc3BsaXQoXCI7XCIpO1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgcGFyYW1zLmxlbmd0aDsgaisrKSB7XG4gICAgICBjb25zdCBwID0gcGFyYW1zW2pdLnRyaW0oKS5zcGxpdChcIj1cIik7XG4gICAgICBpZiAocFswXSA9PT0gXCJxXCIpIHtcbiAgICAgICAgcSA9IHBhcnNlRmxvYXQocFsxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZW5jb2RpbmcsXG4gICAgcTogcSxcbiAgICBpOiBpLFxuICB9O1xufVxuXG4vKipcbiAqIEdldCB0aGUgcHJpb3JpdHkgb2YgYW4gZW5jb2RpbmcuXG4gKi9cbmZ1bmN0aW9uIGdldEVuY29kaW5nUHJpb3JpdHkoXG4gIGVuY29kaW5nOiBzdHJpbmcsXG4gIGFjY2VwdGVkOiBFbmNvZGluZ1tdLFxuICBpbmRleDogbnVtYmVyLFxuKTogUHJpb3JpdHkge1xuICBsZXQgcHJpb3JpdHkgPSB7IG86IC0xLCBxOiAwLCBzOiAwIH07XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhY2NlcHRlZC5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHNwZWMgPSBzcGVjaWZ5KGVuY29kaW5nLCBhY2NlcHRlZFtpXSwgaW5kZXgpO1xuXG4gICAgaWYgKFxuICAgICAgc3BlYyAmJlxuICAgICAgKHByaW9yaXR5LnMgLSBzcGVjLnMgfHwgcHJpb3JpdHkucSAtIHNwZWMucSB8fCBwcmlvcml0eS5vIC0gc3BlYy5vKSA8IDBcbiAgICApIHtcbiAgICAgIHByaW9yaXR5ID0gc3BlYztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcHJpb3JpdHk7XG59XG5cbi8qKlxuICogR2V0IHRoZSBzcGVjaWZpY2l0eSBvZiB0aGUgZW5jb2RpbmcuXG4gKi9cbmZ1bmN0aW9uIHNwZWNpZnkoXG4gIGVuY29kaW5nOiBzdHJpbmcsXG4gIHNwZWM6IEVuY29kaW5nLFxuICBpbmRleD86IG51bWJlcixcbik6IFByaW9yaXR5IHwgbnVsbCB7XG4gIGxldCBzID0gMDtcbiAgaWYgKHNwZWMuZW5jb2RpbmcudG9Mb3dlckNhc2UoKSA9PT0gZW5jb2RpbmcudG9Mb3dlckNhc2UoKSkge1xuICAgIHMgfD0gMTtcbiAgfSBlbHNlIGlmIChzcGVjLmVuY29kaW5nICE9PSBcIipcIikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpOiBpbmRleCxcbiAgICBvOiBzcGVjLmksXG4gICAgcTogc3BlYy5xLFxuICAgIHM6IHMsXG4gIH07XG59XG5cbi8qKlxuICogR2V0IHRoZSBwcmVmZXJyZWQgZW5jb2RpbmdzIGZyb20gYW4gQWNjZXB0LUVuY29kaW5nIGhlYWRlci5cbiAqL1xuZnVuY3Rpb24gcHJlZmVycmVkRW5jb2RpbmdzKFxuICBhY2NlcHQ6IHN0cmluZyB8IG51bGwsXG4gIHByb3ZpZGVkPzogc3RyaW5nW10sXG4pOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGFjY2VwdHMgPSBwYXJzZUFjY2VwdEVuY29kaW5nKGFjY2VwdCB8fCBcIlwiKTtcblxuICBpZiAoIXByb3ZpZGVkKSB7XG4gICAgLy8gc29ydGVkIGxpc3Qgb2YgYWxsIGVuY29kaW5nc1xuICAgIHJldHVybiBhY2NlcHRzXG4gICAgICAuZmlsdGVyKGlzUXVhbGl0eSlcbiAgICAgIC5zb3J0KGNvbXBhcmVTcGVjcylcbiAgICAgIC5tYXAoZ2V0RnVsbEVuY29kaW5nKTtcbiAgfVxuXG4gIGNvbnN0IHByaW9yaXRpZXMgPSBwcm92aWRlZC5tYXAoZnVuY3Rpb24gZ2V0UHJpb3JpdHkodHlwZSwgaW5kZXgpIHtcbiAgICByZXR1cm4gZ2V0RW5jb2RpbmdQcmlvcml0eSh0eXBlLCBhY2NlcHRzLCBpbmRleCk7XG4gIH0pO1xuXG4gIC8vIHNvcnRlZCBsaXN0IG9mIGFjY2VwdGVkIGVuY29kaW5nc1xuICByZXR1cm4gcHJpb3JpdGllcy5maWx0ZXIoaXNRdWFsaXR5KS5zb3J0KGNvbXBhcmVTcGVjcykubWFwKFxuICAgIGZ1bmN0aW9uIGdldEVuY29kaW5nKHByaW9yaXR5KSB7XG4gICAgICByZXR1cm4gcHJvdmlkZWRbcHJpb3JpdGllcy5pbmRleE9mKHByaW9yaXR5KV07XG4gICAgfSxcbiAgKTtcbn1cblxuLyoqXG4gKiBDb21wYXJlIHR3byBzcGVjcy5cbiAqL1xuZnVuY3Rpb24gY29tcGFyZVNwZWNzKGE6IGFueSwgYjogYW55KTogbnVtYmVyIHtcbiAgcmV0dXJuIChiLnEgLSBhLnEpIHx8IChiLnMgLSBhLnMpIHx8IChhLm8gLSBiLm8pIHx8IChhLmkgLSBiLmkpIHx8IDA7XG59XG5cbi8qKlxuICogR2V0IGZ1bGwgZW5jb2Rpbmcgc3RyaW5nLlxuICovXG5mdW5jdGlvbiBnZXRGdWxsRW5jb2Rpbmcoc3BlYzogRW5jb2RpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gc3BlYy5lbmNvZGluZztcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhIHNwZWMgaGFzIGFueSBxdWFsaXR5LlxuICovXG5mdW5jdGlvbiBpc1F1YWxpdHkoc3BlYzogRW5jb2RpbmcgfCBQcmlvcml0eSk6IGJvb2xlYW4ge1xuICByZXR1cm4gc3BlYy5xID4gMDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FXUyxrQkFBa0I7TUFFckIsb0JBQW9CO0FBUTFCLEVBRUcsQUFGSDs7Q0FFRyxBQUZILEVBRUcsVUFDTSxtQkFBbUIsQ0FBQyxNQUFjO1VBQ25DLE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxFQUFDLENBQUc7UUFDNUIsV0FBVyxHQUE4QixLQUFLO1FBQzlDLFVBQVUsR0FBRyxDQUFDO1VBQ1osZUFBZTtZQUVaLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztjQUM3QixRQUFRLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsSUFBSSxJQUFJLENBQUM7WUFFL0MsUUFBUTtZQUNWLGVBQWUsQ0FBQyxJQUFJLENBQUMsUUFBUTtZQUM3QixXQUFXLEdBQUcs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
