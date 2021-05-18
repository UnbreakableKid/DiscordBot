import { delay } from "../util/utils.ts";
import { ws } from "./ws.ts";
/** The handler to clean up shards that identified but never received a READY. */ export async function cleanupLoadingShards() {
    while(ws.loadingShards.size){
        ws.log("DEBUG", "Running while loop in cleanupLoadingShards function.");
        const now = Date.now();
        ws.loadingShards.forEach((loadingShard)=>{
            ws.log("DEBUG", `Running forEach loop in cleanupLoadingShards function.`);
            // Not a minute yet. Max should be few seconds but do a minute to be safe.
            if (now < loadingShard.startedAt + 60000) return;
            loadingShard.reject(`[Identify Failure] Shard ${loadingShard.shardId} has not received READY event in over a minute.`);
        });
        await delay(1000);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3dzL2NsZWFudXBfbG9hZGluZ19zaGFyZHMudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRlbGF5IH0gZnJvbSBcIi4uL3V0aWwvdXRpbHMudHNcIjtcbmltcG9ydCB7IHdzIH0gZnJvbSBcIi4vd3MudHNcIjtcblxuLyoqIFRoZSBoYW5kbGVyIHRvIGNsZWFuIHVwIHNoYXJkcyB0aGF0IGlkZW50aWZpZWQgYnV0IG5ldmVyIHJlY2VpdmVkIGEgUkVBRFkuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2xlYW51cExvYWRpbmdTaGFyZHMoKSB7XG4gIHdoaWxlICh3cy5sb2FkaW5nU2hhcmRzLnNpemUpIHtcbiAgICB3cy5sb2coXG4gICAgICBcIkRFQlVHXCIsXG4gICAgICBcIlJ1bm5pbmcgd2hpbGUgbG9vcCBpbiBjbGVhbnVwTG9hZGluZ1NoYXJkcyBmdW5jdGlvbi5cIixcbiAgICApO1xuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgd3MubG9hZGluZ1NoYXJkcy5mb3JFYWNoKChsb2FkaW5nU2hhcmQpID0+IHtcbiAgICAgIHdzLmxvZyhcbiAgICAgICAgXCJERUJVR1wiLFxuICAgICAgICBgUnVubmluZyBmb3JFYWNoIGxvb3AgaW4gY2xlYW51cExvYWRpbmdTaGFyZHMgZnVuY3Rpb24uYCxcbiAgICAgICk7XG4gICAgICAvLyBOb3QgYSBtaW51dGUgeWV0LiBNYXggc2hvdWxkIGJlIGZldyBzZWNvbmRzIGJ1dCBkbyBhIG1pbnV0ZSB0byBiZSBzYWZlLlxuICAgICAgaWYgKG5vdyA8IGxvYWRpbmdTaGFyZC5zdGFydGVkQXQgKyA2MDAwMCkgcmV0dXJuO1xuXG4gICAgICBsb2FkaW5nU2hhcmQucmVqZWN0KFxuICAgICAgICBgW0lkZW50aWZ5IEZhaWx1cmVdIFNoYXJkICR7bG9hZGluZ1NoYXJkLnNoYXJkSWR9IGhhcyBub3QgcmVjZWl2ZWQgUkVBRFkgZXZlbnQgaW4gb3ZlciBhIG1pbnV0ZS5gLFxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGF3YWl0IGRlbGF5KDEwMDApO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsS0FBSyxTQUFRLGdCQUFrQjtTQUMvQixFQUFFLFNBQVEsT0FBUztBQUU1QixFQUFpRixBQUFqRiw2RUFBaUYsQUFBakYsRUFBaUYsdUJBQzNELG9CQUFvQjtVQUNqQyxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUk7UUFDMUIsRUFBRSxDQUFDLEdBQUcsRUFDSixLQUFPLElBQ1Asb0RBQXNEO2NBRWxELEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRztRQUNwQixFQUFFLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxZQUFZO1lBQ3BDLEVBQUUsQ0FBQyxHQUFHLEVBQ0osS0FBTyxJQUNOLHNEQUFzRDtZQUV6RCxFQUEwRSxBQUExRSx3RUFBMEU7Z0JBQ3RFLEdBQUcsR0FBRyxZQUFZLENBQUMsU0FBUyxHQUFHLEtBQUs7WUFFeEMsWUFBWSxDQUFDLE1BQU0sRUFDaEIseUJBQXlCLEVBQUUsWUFBWSxDQUFDLE9BQU8sQ0FBQywrQ0FBK0M7O2NBSTlGLEtBQUssQ0FBQyxJQUFJIn0=