import { eventHandlers } from "../bot.ts";
import { rest } from "./rest.ts";
/** This will create a infinite loop running in 1 seconds using tail recursion to keep rate limits clean. When a rate limit resets, this will remove it so the queue can proceed. */ export function processRateLimitedPaths() {
    const now = Date.now();
    for (const [key, value] of rest.ratelimitedPaths.entries()){
        rest.eventHandlers.debug?.("loop", `Running forEach loop in process_rate_limited_paths file.`);
        // IF THE TIME HAS NOT REACHED CANCEL
        if (value.resetTimestamp > now) continue;
        // RATE LIMIT IS OVER, DELETE THE RATE LIMITER
        rest.ratelimitedPaths.delete(key);
        // IF IT WAS GLOBAL ALSO MARK THE GLOBAL VALUE AS FALSE
        if (key === "global") rest.globallyRateLimited = false;
    }
    // ALL PATHS ARE CLEARED CAN CANCEL OUT!
    if (!rest.ratelimitedPaths.size) {
        rest.processingRateLimitedPaths = false;
        return;
    } else {
        rest.processingRateLimitedPaths = true;
        // RECHECK IN 1 SECOND
        setTimeout(()=>{
            eventHandlers.debug?.("loop", `Running setTimeout in processRateLimitedPaths function.`);
            processRateLimitedPaths();
        }, 1000);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3Jlc3QvcHJvY2Vzc19yYXRlX2xpbWl0ZWRfcGF0aHMudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV2ZW50SGFuZGxlcnMgfSBmcm9tIFwiLi4vYm90LnRzXCI7XG5pbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4vcmVzdC50c1wiO1xuXG4vKiogVGhpcyB3aWxsIGNyZWF0ZSBhIGluZmluaXRlIGxvb3AgcnVubmluZyBpbiAxIHNlY29uZHMgdXNpbmcgdGFpbCByZWN1cnNpb24gdG8ga2VlcCByYXRlIGxpbWl0cyBjbGVhbi4gV2hlbiBhIHJhdGUgbGltaXQgcmVzZXRzLCB0aGlzIHdpbGwgcmVtb3ZlIGl0IHNvIHRoZSBxdWV1ZSBjYW4gcHJvY2VlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9jZXNzUmF0ZUxpbWl0ZWRQYXRocygpIHtcbiAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcblxuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiByZXN0LnJhdGVsaW1pdGVkUGF0aHMuZW50cmllcygpKSB7XG4gICAgcmVzdC5ldmVudEhhbmRsZXJzLmRlYnVnPy4oXG4gICAgICBcImxvb3BcIixcbiAgICAgIGBSdW5uaW5nIGZvckVhY2ggbG9vcCBpbiBwcm9jZXNzX3JhdGVfbGltaXRlZF9wYXRocyBmaWxlLmAsXG4gICAgKTtcbiAgICAvLyBJRiBUSEUgVElNRSBIQVMgTk9UIFJFQUNIRUQgQ0FOQ0VMXG4gICAgaWYgKHZhbHVlLnJlc2V0VGltZXN0YW1wID4gbm93KSBjb250aW51ZTtcblxuICAgIC8vIFJBVEUgTElNSVQgSVMgT1ZFUiwgREVMRVRFIFRIRSBSQVRFIExJTUlURVJcbiAgICByZXN0LnJhdGVsaW1pdGVkUGF0aHMuZGVsZXRlKGtleSk7XG4gICAgLy8gSUYgSVQgV0FTIEdMT0JBTCBBTFNPIE1BUksgVEhFIEdMT0JBTCBWQUxVRSBBUyBGQUxTRVxuICAgIGlmIChrZXkgPT09IFwiZ2xvYmFsXCIpIHJlc3QuZ2xvYmFsbHlSYXRlTGltaXRlZCA9IGZhbHNlO1xuICB9XG5cbiAgLy8gQUxMIFBBVEhTIEFSRSBDTEVBUkVEIENBTiBDQU5DRUwgT1VUIVxuICBpZiAoIXJlc3QucmF0ZWxpbWl0ZWRQYXRocy5zaXplKSB7XG4gICAgcmVzdC5wcm9jZXNzaW5nUmF0ZUxpbWl0ZWRQYXRocyA9IGZhbHNlO1xuICAgIHJldHVybjtcbiAgfSBlbHNlIHtcbiAgICByZXN0LnByb2Nlc3NpbmdSYXRlTGltaXRlZFBhdGhzID0gdHJ1ZTtcbiAgICAvLyBSRUNIRUNLIElOIDEgU0VDT05EXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBldmVudEhhbmRsZXJzLmRlYnVnPy4oXG4gICAgICAgIFwibG9vcFwiLFxuICAgICAgICBgUnVubmluZyBzZXRUaW1lb3V0IGluIHByb2Nlc3NSYXRlTGltaXRlZFBhdGhzIGZ1bmN0aW9uLmAsXG4gICAgICApO1xuICAgICAgcHJvY2Vzc1JhdGVMaW1pdGVkUGF0aHMoKTtcbiAgICB9LCAxMDAwKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLGFBQWEsU0FBUSxTQUFXO1NBQ2hDLElBQUksU0FBUSxTQUFXO0FBRWhDLEVBQW9MLEFBQXBMLGdMQUFvTCxBQUFwTCxFQUFvTCxpQkFDcEssdUJBQXVCO1VBQy9CLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRztnQkFFUixHQUFHLEVBQUUsS0FBSyxLQUFLLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPO1FBQ3RELElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxJQUN0QixJQUFNLElBQ0wsd0RBQXdEO1FBRTNELEVBQXFDLEFBQXJDLG1DQUFxQztZQUNqQyxLQUFLLENBQUMsY0FBYyxHQUFHLEdBQUc7UUFFOUIsRUFBOEMsQUFBOUMsNENBQThDO1FBQzlDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsR0FBRztRQUNoQyxFQUF1RCxBQUF2RCxxREFBdUQ7WUFDbkQsR0FBRyxNQUFLLE1BQVEsR0FBRSxJQUFJLENBQUMsbUJBQW1CLEdBQUcsS0FBSzs7SUFHeEQsRUFBd0MsQUFBeEMsc0NBQXdDO1NBQ25DLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJO1FBQzdCLElBQUksQ0FBQywwQkFBMEIsR0FBRyxLQUFLOzs7UUFHdkMsSUFBSSxDQUFDLDBCQUEwQixHQUFHLElBQUk7UUFDdEMsRUFBc0IsQUFBdEIsb0JBQXNCO1FBQ3RCLFVBQVU7WUFDUixhQUFhLENBQUMsS0FBSyxJQUNqQixJQUFNLElBQ0wsdURBQXVEO1lBRTFELHVCQUF1QjtXQUN0QixJQUFJIn0=