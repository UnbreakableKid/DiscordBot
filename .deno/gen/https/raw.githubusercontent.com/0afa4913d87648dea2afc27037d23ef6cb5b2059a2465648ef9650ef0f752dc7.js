/**
 * Credits: github.com/abalabahaha/eris lib/rest/RequestHandler.js#L397
 * Modified for our usecase
 */ export function simplifyUrl(url, method) {
  let route = url.replace(
    /\/([a-z-]+)\/(?:[0-9]{17,19})/g,
    function (match, p) {
      return [
          "channels",
          "guilds",
          "webhooks",
        ].includes(p)
        ? match
        : `/${p}/skillzPrefersID`;
    },
  ).replace(/\/reactions\/[^/]+/g, "/reactions/skillzPrefersID").replace(
    /^\/webhooks\/(\d+)\/[A-Za-z0-9-_]{64,}/,
    "/webhooks/$1/:itohIsAHoti",
  );
  // GENERAL /reactions and /reactions/emoji/@me share the buckets
  if (route.includes("/reactions")) {
    route = route.substring(
      0,
      route.indexOf("/reactions") + "/reactions".length,
    );
  }
  // Delete Messsage endpoint has its own ratelimit
  if (method === "DELETE" && route.endsWith("/messages/skillzPrefersID")) {
    route = method + route;
  }
  return route;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3Jlc3Qvc2ltcGxpZnlfdXJsLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWRpdHM6IGdpdGh1Yi5jb20vYWJhbGFiYWhhaGEvZXJpcyBsaWIvcmVzdC9SZXF1ZXN0SGFuZGxlci5qcyNMMzk3XG4gKiBNb2RpZmllZCBmb3Igb3VyIHVzZWNhc2VcbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gc2ltcGxpZnlVcmwodXJsOiBzdHJpbmcsIG1ldGhvZDogc3RyaW5nKSB7XG4gIGxldCByb3V0ZSA9IHVybFxuICAgIC5yZXBsYWNlKC9cXC8oW2Etei1dKylcXC8oPzpbMC05XXsxNywxOX0pL2csIGZ1bmN0aW9uIChtYXRjaCwgcCkge1xuICAgICAgcmV0dXJuIFtcImNoYW5uZWxzXCIsIFwiZ3VpbGRzXCIsIFwid2ViaG9va3NcIl0uaW5jbHVkZXMocClcbiAgICAgICAgPyBtYXRjaFxuICAgICAgICA6IGAvJHtwfS9za2lsbHpQcmVmZXJzSURgO1xuICAgIH0pXG4gICAgLnJlcGxhY2UoL1xcL3JlYWN0aW9uc1xcL1teL10rL2csIFwiL3JlYWN0aW9ucy9za2lsbHpQcmVmZXJzSURcIilcbiAgICAucmVwbGFjZShcbiAgICAgIC9eXFwvd2ViaG9va3NcXC8oXFxkKylcXC9bQS1aYS16MC05LV9dezY0LH0vLFxuICAgICAgXCIvd2ViaG9va3MvJDEvOml0b2hJc0FIb3RpXCIsXG4gICAgKTtcblxuICAvLyBHRU5FUkFMIC9yZWFjdGlvbnMgYW5kIC9yZWFjdGlvbnMvZW1vamkvQG1lIHNoYXJlIHRoZSBidWNrZXRzXG4gIGlmIChyb3V0ZS5pbmNsdWRlcyhcIi9yZWFjdGlvbnNcIikpIHtcbiAgICByb3V0ZSA9IHJvdXRlLnN1YnN0cmluZyhcbiAgICAgIDAsXG4gICAgICByb3V0ZS5pbmRleE9mKFwiL3JlYWN0aW9uc1wiKSArIFwiL3JlYWN0aW9uc1wiLmxlbmd0aCxcbiAgICApO1xuICB9XG5cbiAgLy8gRGVsZXRlIE1lc3NzYWdlIGVuZHBvaW50IGhhcyBpdHMgb3duIHJhdGVsaW1pdFxuICBpZiAobWV0aG9kID09PSBcIkRFTEVURVwiICYmIHJvdXRlLmVuZHNXaXRoKFwiL21lc3NhZ2VzL3NraWxselByZWZlcnNJRFwiKSkge1xuICAgIHJvdXRlID0gbWV0aG9kICsgcm91dGU7XG4gIH1cblxuICByZXR1cm4gcm91dGU7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFHRyxBQUhIOzs7Q0FHRyxBQUhILEVBR0csaUJBRWEsV0FBVyxDQUFDLEdBQVcsRUFBRSxNQUFjO1FBQ2pELEtBQUssR0FBRyxHQUFHLENBQ1osT0FBTyw0Q0FBNkMsS0FBSyxFQUFFLENBQUM7O2FBQ25ELFFBQVU7YUFBRSxNQUFRO2FBQUUsUUFBVTtVQUFFLFFBQVEsQ0FBQyxDQUFDLElBQ2hELEtBQUssSUFDSixDQUFDLEVBQUUsQ0FBQyxDQUFDLGdCQUFnQjtPQUUzQixPQUFPLHlCQUF3QiwwQkFBNEIsR0FDM0QsT0FBTyw0Q0FFTix5QkFBMkI7SUFHL0IsRUFBZ0UsQUFBaEUsOERBQWdFO1FBQzVELEtBQUssQ0FBQyxRQUFRLEVBQUMsVUFBWTtRQUM3QixLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FDckIsQ0FBQyxFQUNELEtBQUssQ0FBQyxPQUFPLEVBQUMsVUFBWSxNQUFJLFVBQVksRUFBQyxNQUFNOztJQUlyRCxFQUFpRCxBQUFqRCwrQ0FBaUQ7UUFDN0MsTUFBTSxNQUFLLE1BQVEsS0FBSSxLQUFLLENBQUMsUUFBUSxFQUFDLHlCQUEyQjtRQUNuRSxLQUFLLEdBQUcsTUFBTSxHQUFHLEtBQUs7O1dBR2pCLEtBQUsifQ==
