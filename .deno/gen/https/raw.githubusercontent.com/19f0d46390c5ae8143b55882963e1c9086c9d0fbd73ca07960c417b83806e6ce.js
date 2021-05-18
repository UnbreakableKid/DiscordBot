import { rest } from "./rest.ts";
/** Processes the rate limit headers and determines if it needs to be ratelimited and returns the bucket id if available */ export function processRequestHeaders(
  url,
  headers,
) {
  let ratelimited = false;
  // GET ALL NECESSARY HEADERS
  const remaining = headers.get("x-ratelimit-remaining");
  const retryAfter = headers.get("x-ratelimit-reset-after");
  const reset = Date.now() + Number(retryAfter) * 1000;
  const global = headers.get("x-ratelimit-global");
  // undefined override null needed for typings
  const bucketId = headers.get("x-ratelimit-bucket") || undefined;
  // IF THERE IS NO REMAINING RATE LIMIT, MARK IT AS RATE LIMITED
  if (remaining === "0") {
    ratelimited = true;
    // SAVE THE URL AS LIMITED, IMPORTANT FOR NEW REQUESTS BY USER WITHOUT BUCKET
    rest.ratelimitedPaths.set(url, {
      url,
      resetTimestamp: reset,
      bucketId,
    });
    // SAVE THE BUCKET AS LIMITED SINCE DIFFERENT URLS MAY SHARE A BUCKET
    if (bucketId) {
      rest.ratelimitedPaths.set(bucketId, {
        url,
        resetTimestamp: reset,
        bucketId,
      });
    }
  }
  // IF THERE IS NO REMAINING GLOBAL LIMIT, MARK IT RATE LIMITED GLOBALLY
  if (global) {
    const retryAfter = headers.get("retry-after");
    const globalReset = Date.now() + Number(retryAfter) * 1000;
    rest.eventHandlers.globallyRateLimited(url, globalReset);
    rest.globallyRateLimited = true;
    ratelimited = true;
    rest.ratelimitedPaths.set("global", {
      url: "global",
      resetTimestamp: globalReset,
      bucketId,
    });
    if (bucketId) {
      rest.ratelimitedPaths.set(bucketId, {
        url: "global",
        resetTimestamp: globalReset,
        bucketId,
      });
    }
  }
  if (ratelimited && !rest.processingRateLimitedPaths) {
    rest.processRateLimitedPaths();
  }
  return ratelimited ? bucketId : undefined;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3Jlc3QvcHJvY2Vzc19yZXF1ZXN0X2hlYWRlcnMudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHJlc3QgfSBmcm9tIFwiLi9yZXN0LnRzXCI7XG5cbi8qKiBQcm9jZXNzZXMgdGhlIHJhdGUgbGltaXQgaGVhZGVycyBhbmQgZGV0ZXJtaW5lcyBpZiBpdCBuZWVkcyB0byBiZSByYXRlbGltaXRlZCBhbmQgcmV0dXJucyB0aGUgYnVja2V0IGlkIGlmIGF2YWlsYWJsZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2Nlc3NSZXF1ZXN0SGVhZGVycyh1cmw6IHN0cmluZywgaGVhZGVyczogSGVhZGVycykge1xuICBsZXQgcmF0ZWxpbWl0ZWQgPSBmYWxzZTtcblxuICAvLyBHRVQgQUxMIE5FQ0VTU0FSWSBIRUFERVJTXG4gIGNvbnN0IHJlbWFpbmluZyA9IGhlYWRlcnMuZ2V0KFwieC1yYXRlbGltaXQtcmVtYWluaW5nXCIpO1xuICBjb25zdCByZXRyeUFmdGVyID0gaGVhZGVycy5nZXQoXCJ4LXJhdGVsaW1pdC1yZXNldC1hZnRlclwiKTtcbiAgY29uc3QgcmVzZXQgPSBEYXRlLm5vdygpICsgTnVtYmVyKHJldHJ5QWZ0ZXIpICogMTAwMDtcbiAgY29uc3QgZ2xvYmFsID0gaGVhZGVycy5nZXQoXCJ4LXJhdGVsaW1pdC1nbG9iYWxcIik7XG4gIC8vIHVuZGVmaW5lZCBvdmVycmlkZSBudWxsIG5lZWRlZCBmb3IgdHlwaW5nc1xuICBjb25zdCBidWNrZXRJZCA9IGhlYWRlcnMuZ2V0KFwieC1yYXRlbGltaXQtYnVja2V0XCIpIHx8IHVuZGVmaW5lZDtcblxuICAvLyBJRiBUSEVSRSBJUyBOTyBSRU1BSU5JTkcgUkFURSBMSU1JVCwgTUFSSyBJVCBBUyBSQVRFIExJTUlURURcbiAgaWYgKHJlbWFpbmluZyA9PT0gXCIwXCIpIHtcbiAgICByYXRlbGltaXRlZCA9IHRydWU7XG5cbiAgICAvLyBTQVZFIFRIRSBVUkwgQVMgTElNSVRFRCwgSU1QT1JUQU5UIEZPUiBORVcgUkVRVUVTVFMgQlkgVVNFUiBXSVRIT1VUIEJVQ0tFVFxuICAgIHJlc3QucmF0ZWxpbWl0ZWRQYXRocy5zZXQodXJsLCB7XG4gICAgICB1cmwsXG4gICAgICByZXNldFRpbWVzdGFtcDogcmVzZXQsXG4gICAgICBidWNrZXRJZCxcbiAgICB9KTtcblxuICAgIC8vIFNBVkUgVEhFIEJVQ0tFVCBBUyBMSU1JVEVEIFNJTkNFIERJRkZFUkVOVCBVUkxTIE1BWSBTSEFSRSBBIEJVQ0tFVFxuICAgIGlmIChidWNrZXRJZCkge1xuICAgICAgcmVzdC5yYXRlbGltaXRlZFBhdGhzLnNldChidWNrZXRJZCwge1xuICAgICAgICB1cmwsXG4gICAgICAgIHJlc2V0VGltZXN0YW1wOiByZXNldCxcbiAgICAgICAgYnVja2V0SWQsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvLyBJRiBUSEVSRSBJUyBOTyBSRU1BSU5JTkcgR0xPQkFMIExJTUlULCBNQVJLIElUIFJBVEUgTElNSVRFRCBHTE9CQUxMWVxuICBpZiAoZ2xvYmFsKSB7XG4gICAgY29uc3QgcmV0cnlBZnRlciA9IGhlYWRlcnMuZ2V0KFwicmV0cnktYWZ0ZXJcIik7XG4gICAgY29uc3QgZ2xvYmFsUmVzZXQgPSBEYXRlLm5vdygpICsgTnVtYmVyKHJldHJ5QWZ0ZXIpICogMTAwMDtcbiAgICByZXN0LmV2ZW50SGFuZGxlcnMuZ2xvYmFsbHlSYXRlTGltaXRlZCh1cmwsIGdsb2JhbFJlc2V0KTtcbiAgICByZXN0Lmdsb2JhbGx5UmF0ZUxpbWl0ZWQgPSB0cnVlO1xuICAgIHJhdGVsaW1pdGVkID0gdHJ1ZTtcblxuICAgIHJlc3QucmF0ZWxpbWl0ZWRQYXRocy5zZXQoXCJnbG9iYWxcIiwge1xuICAgICAgdXJsOiBcImdsb2JhbFwiLFxuICAgICAgcmVzZXRUaW1lc3RhbXA6IGdsb2JhbFJlc2V0LFxuICAgICAgYnVja2V0SWQsXG4gICAgfSk7XG5cbiAgICBpZiAoYnVja2V0SWQpIHtcbiAgICAgIHJlc3QucmF0ZWxpbWl0ZWRQYXRocy5zZXQoYnVja2V0SWQsIHtcbiAgICAgICAgdXJsOiBcImdsb2JhbFwiLFxuICAgICAgICByZXNldFRpbWVzdGFtcDogZ2xvYmFsUmVzZXQsXG4gICAgICAgIGJ1Y2tldElkLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHJhdGVsaW1pdGVkICYmICFyZXN0LnByb2Nlc3NpbmdSYXRlTGltaXRlZFBhdGhzKSB7XG4gICAgcmVzdC5wcm9jZXNzUmF0ZUxpbWl0ZWRQYXRocygpO1xuICB9XG4gIHJldHVybiByYXRlbGltaXRlZCA/IGJ1Y2tldElkIDogdW5kZWZpbmVkO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLElBQUksU0FBUSxTQUFXO0FBRWhDLEVBQTJILEFBQTNILHVIQUEySCxBQUEzSCxFQUEySCxpQkFDM0cscUJBQXFCLENBQUMsR0FBVyxFQUFFLE9BQWdCO1FBQzdELFdBQVcsR0FBRyxLQUFLO0lBRXZCLEVBQTRCLEFBQTVCLDBCQUE0QjtVQUN0QixTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBQyxxQkFBdUI7VUFDL0MsVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUMsdUJBQXlCO1VBQ2xELEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxLQUFLLE1BQU0sQ0FBQyxVQUFVLElBQUksSUFBSTtVQUM5QyxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBQyxrQkFBb0I7SUFDL0MsRUFBNkMsQUFBN0MsMkNBQTZDO1VBQ3ZDLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFDLGtCQUFvQixNQUFLLFNBQVM7SUFFL0QsRUFBK0QsQUFBL0QsNkRBQStEO1FBQzNELFNBQVMsTUFBSyxDQUFHO1FBQ25CLFdBQVcsR0FBRyxJQUFJO1FBRWxCLEVBQTZFLEFBQTdFLDJFQUE2RTtRQUM3RSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEdBQUc7WUFDM0IsR0FBRztZQUNILGNBQWMsRUFBRSxLQUFLO1lBQ3JCLFFBQVE7O1FBR1YsRUFBcUUsQUFBckUsbUVBQXFFO1lBQ2pFLFFBQVE7WUFDVixJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFFBQVE7Z0JBQ2hDLEdBQUc7Z0JBQ0gsY0FBYyxFQUFFLEtBQUs7Z0JBQ3JCLFFBQVE7Ozs7SUFLZCxFQUF1RSxBQUF2RSxxRUFBdUU7UUFDbkUsTUFBTTtjQUNGLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFDLFdBQWE7Y0FDdEMsV0FBVyxHQUFHLElBQUksQ0FBQyxHQUFHLEtBQUssTUFBTSxDQUFDLFVBQVUsSUFBSSxJQUFJO1FBQzFELElBQUksQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsR0FBRyxFQUFFLFdBQVc7UUFDdkQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUk7UUFDL0IsV0FBVyxHQUFHLElBQUk7UUFFbEIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsRUFBQyxNQUFRO1lBQ2hDLEdBQUcsR0FBRSxNQUFRO1lBQ2IsY0FBYyxFQUFFLFdBQVc7WUFDM0IsUUFBUTs7WUFHTixRQUFRO1lBQ1YsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxRQUFRO2dCQUNoQyxHQUFHLEdBQUUsTUFBUTtnQkFDYixjQUFjLEVBQUUsV0FBVztnQkFDM0IsUUFBUTs7OztRQUtWLFdBQVcsS0FBSyxJQUFJLENBQUMsMEJBQTBCO1FBQ2pELElBQUksQ0FBQyx1QkFBdUI7O1dBRXZCLFdBQVcsR0FBRyxRQUFRLEdBQUcsU0FBUyJ9
