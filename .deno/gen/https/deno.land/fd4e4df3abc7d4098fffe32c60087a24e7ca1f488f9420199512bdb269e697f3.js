/**
 * Stringify JSON, like JSON.stringify, but v8 optimized, with the
 * ability to escape characters that can trigger HTML sniffing.
 *
 * @param {any} value
 * @param {Function} replaces
 * @param {number} spaces
 * @param {boolean} escape
 * @returns {string}
 * @public
 */ export function stringify(value, replacer, spaces, escape) {
  // v8 checks arguments.length for optimizing simple call
  // https://bugs.chromium.org/p/v8/issues/detail?id=4730
  let json = replacer || spaces
    ? JSON.stringify(value, replacer, spaces)
    : JSON.stringify(value);
  if (escape) {
    json = json.replace(/[<>&]/g, function (c) {
      switch (c.charCodeAt(0)) {
        case 60:
          return "\\u003c";
        case 62:
          return "\\u003e";
        case 38:
          return "\\u0026";
        /* istanbul ignore next: unreachable default */
        default:
          return c;
      }
    });
  }
  return json;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy91dGlscy9zdHJpbmdpZnkudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogU3RyaW5naWZ5IEpTT04sIGxpa2UgSlNPTi5zdHJpbmdpZnksIGJ1dCB2OCBvcHRpbWl6ZWQsIHdpdGggdGhlXG4gKiBhYmlsaXR5IHRvIGVzY2FwZSBjaGFyYWN0ZXJzIHRoYXQgY2FuIHRyaWdnZXIgSFRNTCBzbmlmZmluZy5cbiAqXG4gKiBAcGFyYW0ge2FueX0gdmFsdWVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IHJlcGxhY2VzXG4gKiBAcGFyYW0ge251bWJlcn0gc3BhY2VzXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGVzY2FwZVxuICogQHJldHVybnMge3N0cmluZ31cbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ2lmeShcbiAgdmFsdWU6IGFueSxcbiAgcmVwbGFjZXI6IGFueSxcbiAgc3BhY2VzOiBudW1iZXIsXG4gIGVzY2FwZTogYm9vbGVhbixcbik6IHN0cmluZyB7XG4gIC8vIHY4IGNoZWNrcyBhcmd1bWVudHMubGVuZ3RoIGZvciBvcHRpbWl6aW5nIHNpbXBsZSBjYWxsXG4gIC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTQ3MzBcbiAgbGV0IGpzb24gPSByZXBsYWNlciB8fCBzcGFjZXNcbiAgICA/IEpTT04uc3RyaW5naWZ5KHZhbHVlLCByZXBsYWNlciwgc3BhY2VzKVxuICAgIDogSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xuXG4gIGlmIChlc2NhcGUpIHtcbiAgICBqc29uID0ganNvbi5yZXBsYWNlKC9bPD4mXS9nLCBmdW5jdGlvbiAoYykge1xuICAgICAgc3dpdGNoIChjLmNoYXJDb2RlQXQoMCkpIHtcbiAgICAgICAgY2FzZSAweDNjOlxuICAgICAgICAgIHJldHVybiBcIlxcXFx1MDAzY1wiO1xuICAgICAgICBjYXNlIDB4M2U6XG4gICAgICAgICAgcmV0dXJuIFwiXFxcXHUwMDNlXCI7XG4gICAgICAgIGNhc2UgMHgyNjpcbiAgICAgICAgICByZXR1cm4gXCJcXFxcdTAwMjZcIjtcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQ6IHVucmVhY2hhYmxlIGRlZmF1bHQgKi9cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gYztcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBqc29uO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEVBVUcsQUFWSDs7Ozs7Ozs7OztDQVVHLEFBVkgsRUFVRyxpQkFDYSxTQUFTLENBQ3ZCLEtBQVUsRUFDVixRQUFhLEVBQ2IsTUFBYyxFQUNkLE1BQWU7SUFFZixFQUF3RCxBQUF4RCxzREFBd0Q7SUFDeEQsRUFBdUQsQUFBdkQscURBQXVEO1FBQ25ELElBQUksR0FBRyxRQUFRLElBQUksTUFBTSxHQUN6QixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxJQUN0QyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUs7UUFFcEIsTUFBTTtRQUNSLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxvQkFBcUIsQ0FBQzttQkFDL0IsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO3FCQUNmLEVBQUk7NEJBQ0EsT0FBUztxQkFDYixFQUFJOzRCQUNBLE9BQVM7cUJBQ2IsRUFBSTs0QkFDQSxPQUFTO2dCQUNsQixFQUErQyxBQUEvQywyQ0FBK0MsQUFBL0MsRUFBK0M7MkJBRXRDLENBQUM7Ozs7V0FLVCxJQUFJIn0=
