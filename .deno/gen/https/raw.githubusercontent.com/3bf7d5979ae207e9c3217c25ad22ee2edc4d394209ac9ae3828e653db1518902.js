import { eventHandlers, setApplicationId, setBotId } from "../../bot.ts";
import { cache } from "../../cache.ts";
import { snowflakeToBigint } from "../../util/bigint.ts";
import { ws } from "../../ws/ws.ts";
export function handleReady(data, shardId) {
    // Triggered on each shard
    eventHandlers.shardReady?.(shardId);
    // The bot has already started, the last shard is resumed, however.
    if (cache.isReady) return;
    const shard = ws.shards.get(shardId);
    if (!shard) return;
    const payload = data.d;
    setBotId(payload.user.id);
    setApplicationId(payload.application.id);
    // Set ready to false just to go sure
    shard.ready = false;
    // All guilds are unavailable at first
    shard.unavailableGuildIds = new Set(payload.guilds.map((g)=>snowflakeToBigint(g.id)
    ));
    // Set the last available to now
    shard.lastAvailable = Date.now();
    // Start ready check in 2 seconds
    setTimeout(()=>{
        eventHandlers.debug?.("loop", `1. Running setTimeout in READY file.`);
        checkReady(payload, shard);
    }, 2000);
}
/** This function checks if the shard is fully loaded */ function checkReady(payload, shard) {
    // Check if all guilds were loaded
    if (!shard.unavailableGuildIds.size) return loaded(shard);
    // If the last GUILD_CREATE has been received before 5 seconds if so most likely the remaining guilds are unavailable
    if (shard.lastAvailable + 5000 < Date.now()) {
        eventHandlers.shardFailedToLoad?.(shard.id, shard.unavailableGuildIds);
        // Force execute the loaded function to prevent infinite loop
        return loaded(shard);
    }
    // Not all guilds were loaded but 5 seconds haven't passed so check again
    setTimeout(()=>{
        eventHandlers.debug?.("loop", `2. Running setTimeout in READY file.`);
        checkReady(payload, shard);
    }, 2000);
}
function loaded(shard) {
    shard.ready = true;
    // If it is not the last shard we can't go full ready
    if (shard.id !== ws.lastShardId) return;
    // Still some shards are loading so wait another 2 seconds for them
    if (ws.shards.some((shard)=>!shard.ready
    )) {
        setTimeout(()=>{
            eventHandlers.debug?.("loop", `3. Running setTimeout in READY file.`);
            loaded(shard);
        }, 2000);
        return;
    }
    cache.isReady = true;
    eventHandlers.ready?.();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hhbmRsZXJzL21pc2MvUkVBRFkudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV2ZW50SGFuZGxlcnMsIHNldEFwcGxpY2F0aW9uSWQsIHNldEJvdElkIH0gZnJvbSBcIi4uLy4uL2JvdC50c1wiO1xuaW1wb3J0IHsgY2FjaGUgfSBmcm9tIFwiLi4vLi4vY2FjaGUudHNcIjtcbmltcG9ydCB0eXBlIHsgRGlzY29yZEdhdGV3YXlQYXlsb2FkIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2dhdGV3YXkvZ2F0ZXdheV9wYXlsb2FkLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFJlYWR5IH0gZnJvbSBcIi4uLy4uL3R5cGVzL2dhdGV3YXkvcmVhZHkudHNcIjtcbmltcG9ydCB7IHNub3dmbGFrZVRvQmlnaW50IH0gZnJvbSBcIi4uLy4uL3V0aWwvYmlnaW50LnRzXCI7XG5pbXBvcnQgeyBEaXNjb3JkZW5vU2hhcmQsIHdzIH0gZnJvbSBcIi4uLy4uL3dzL3dzLnRzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVSZWFkeShcbiAgZGF0YTogRGlzY29yZEdhdGV3YXlQYXlsb2FkLFxuICBzaGFyZElkOiBudW1iZXIsXG4pIHtcbiAgLy8gVHJpZ2dlcmVkIG9uIGVhY2ggc2hhcmRcbiAgZXZlbnRIYW5kbGVycy5zaGFyZFJlYWR5Py4oc2hhcmRJZCk7XG5cbiAgLy8gVGhlIGJvdCBoYXMgYWxyZWFkeSBzdGFydGVkLCB0aGUgbGFzdCBzaGFyZCBpcyByZXN1bWVkLCBob3dldmVyLlxuICBpZiAoY2FjaGUuaXNSZWFkeSkgcmV0dXJuO1xuXG4gIGNvbnN0IHNoYXJkID0gd3Muc2hhcmRzLmdldChzaGFyZElkKTtcbiAgaWYgKCFzaGFyZCkgcmV0dXJuO1xuXG4gIGNvbnN0IHBheWxvYWQgPSBkYXRhLmQgYXMgUmVhZHk7XG4gIHNldEJvdElkKHBheWxvYWQudXNlci5pZCk7XG4gIHNldEFwcGxpY2F0aW9uSWQocGF5bG9hZC5hcHBsaWNhdGlvbi5pZCk7XG5cbiAgLy8gU2V0IHJlYWR5IHRvIGZhbHNlIGp1c3QgdG8gZ28gc3VyZVxuICBzaGFyZC5yZWFkeSA9IGZhbHNlO1xuICAvLyBBbGwgZ3VpbGRzIGFyZSB1bmF2YWlsYWJsZSBhdCBmaXJzdFxuICBzaGFyZC51bmF2YWlsYWJsZUd1aWxkSWRzID0gbmV3IFNldChcbiAgICBwYXlsb2FkLmd1aWxkcy5tYXAoKGcpID0+IHNub3dmbGFrZVRvQmlnaW50KGcuaWQpKSxcbiAgKTtcbiAgLy8gU2V0IHRoZSBsYXN0IGF2YWlsYWJsZSB0byBub3dcbiAgc2hhcmQubGFzdEF2YWlsYWJsZSA9IERhdGUubm93KCk7XG5cbiAgLy8gU3RhcnQgcmVhZHkgY2hlY2sgaW4gMiBzZWNvbmRzXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGV2ZW50SGFuZGxlcnMuZGVidWc/LihcbiAgICAgIFwibG9vcFwiLFxuICAgICAgYDEuIFJ1bm5pbmcgc2V0VGltZW91dCBpbiBSRUFEWSBmaWxlLmAsXG4gICAgKTtcbiAgICBjaGVja1JlYWR5KHBheWxvYWQsIHNoYXJkKTtcbiAgfSwgMjAwMCk7XG59XG5cbi8qKiBUaGlzIGZ1bmN0aW9uIGNoZWNrcyBpZiB0aGUgc2hhcmQgaXMgZnVsbHkgbG9hZGVkICovXG5mdW5jdGlvbiBjaGVja1JlYWR5KHBheWxvYWQ6IFJlYWR5LCBzaGFyZDogRGlzY29yZGVub1NoYXJkKSB7XG4gIC8vIENoZWNrIGlmIGFsbCBndWlsZHMgd2VyZSBsb2FkZWRcbiAgaWYgKCFzaGFyZC51bmF2YWlsYWJsZUd1aWxkSWRzLnNpemUpIHJldHVybiBsb2FkZWQoc2hhcmQpO1xuXG4gIC8vIElmIHRoZSBsYXN0IEdVSUxEX0NSRUFURSBoYXMgYmVlbiByZWNlaXZlZCBiZWZvcmUgNSBzZWNvbmRzIGlmIHNvIG1vc3QgbGlrZWx5IHRoZSByZW1haW5pbmcgZ3VpbGRzIGFyZSB1bmF2YWlsYWJsZVxuICBpZiAoc2hhcmQubGFzdEF2YWlsYWJsZSArIDUwMDAgPCBEYXRlLm5vdygpKSB7XG4gICAgZXZlbnRIYW5kbGVycy5zaGFyZEZhaWxlZFRvTG9hZD8uKHNoYXJkLmlkLCBzaGFyZC51bmF2YWlsYWJsZUd1aWxkSWRzKTtcbiAgICAvLyBGb3JjZSBleGVjdXRlIHRoZSBsb2FkZWQgZnVuY3Rpb24gdG8gcHJldmVudCBpbmZpbml0ZSBsb29wXG4gICAgcmV0dXJuIGxvYWRlZChzaGFyZCk7XG4gIH1cblxuICAvLyBOb3QgYWxsIGd1aWxkcyB3ZXJlIGxvYWRlZCBidXQgNSBzZWNvbmRzIGhhdmVuJ3QgcGFzc2VkIHNvIGNoZWNrIGFnYWluXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGV2ZW50SGFuZGxlcnMuZGVidWc/LihcbiAgICAgIFwibG9vcFwiLFxuICAgICAgYDIuIFJ1bm5pbmcgc2V0VGltZW91dCBpbiBSRUFEWSBmaWxlLmAsXG4gICAgKTtcbiAgICBjaGVja1JlYWR5KHBheWxvYWQsIHNoYXJkKTtcbiAgfSwgMjAwMCk7XG59XG5cbmZ1bmN0aW9uIGxvYWRlZChzaGFyZDogRGlzY29yZGVub1NoYXJkKSB7XG4gIHNoYXJkLnJlYWR5ID0gdHJ1ZTtcblxuICAvLyBJZiBpdCBpcyBub3QgdGhlIGxhc3Qgc2hhcmQgd2UgY2FuJ3QgZ28gZnVsbCByZWFkeVxuICBpZiAoc2hhcmQuaWQgIT09IHdzLmxhc3RTaGFyZElkKSByZXR1cm47XG5cbiAgLy8gU3RpbGwgc29tZSBzaGFyZHMgYXJlIGxvYWRpbmcgc28gd2FpdCBhbm90aGVyIDIgc2Vjb25kcyBmb3IgdGhlbVxuICBpZiAod3Muc2hhcmRzLnNvbWUoKHNoYXJkKSA9PiAhc2hhcmQucmVhZHkpKSB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBldmVudEhhbmRsZXJzLmRlYnVnPy4oXG4gICAgICAgIFwibG9vcFwiLFxuICAgICAgICBgMy4gUnVubmluZyBzZXRUaW1lb3V0IGluIFJFQURZIGZpbGUuYCxcbiAgICAgICk7XG4gICAgICBsb2FkZWQoc2hhcmQpO1xuICAgIH0sIDIwMDApO1xuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY2FjaGUuaXNSZWFkeSA9IHRydWU7XG4gIGV2ZW50SGFuZGxlcnMucmVhZHk/LigpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLGFBQWEsRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLFNBQVEsWUFBYztTQUMvRCxLQUFLLFNBQVEsY0FBZ0I7U0FHN0IsaUJBQWlCLFNBQVEsb0JBQXNCO1NBQzlCLEVBQUUsU0FBUSxjQUFnQjtnQkFFcEMsV0FBVyxDQUN6QixJQUEyQixFQUMzQixPQUFlO0lBRWYsRUFBMEIsQUFBMUIsd0JBQTBCO0lBQzFCLGFBQWEsQ0FBQyxVQUFVLEdBQUcsT0FBTztJQUVsQyxFQUFtRSxBQUFuRSxpRUFBbUU7UUFDL0QsS0FBSyxDQUFDLE9BQU87VUFFWCxLQUFLLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTztTQUM5QixLQUFLO1VBRUosT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQ3RCLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7SUFDeEIsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFO0lBRXZDLEVBQXFDLEFBQXJDLG1DQUFxQztJQUNyQyxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUs7SUFDbkIsRUFBc0MsQUFBdEMsb0NBQXNDO0lBQ3RDLEtBQUssQ0FBQyxtQkFBbUIsT0FBTyxHQUFHLENBQ2pDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBSyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsRUFBRTs7SUFFbEQsRUFBZ0MsQUFBaEMsOEJBQWdDO0lBQ2hDLEtBQUssQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLEdBQUc7SUFFOUIsRUFBaUMsQUFBakMsK0JBQWlDO0lBQ2pDLFVBQVU7UUFDUixhQUFhLENBQUMsS0FBSyxJQUNqQixJQUFNLElBQ0wsb0NBQW9DO1FBRXZDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsS0FBSztPQUN4QixJQUFJOztBQUdULEVBQXdELEFBQXhELG9EQUF3RCxBQUF4RCxFQUF3RCxVQUMvQyxVQUFVLENBQUMsT0FBYyxFQUFFLEtBQXNCO0lBQ3hELEVBQWtDLEFBQWxDLGdDQUFrQztTQUM3QixLQUFLLENBQUMsbUJBQW1CLENBQUMsSUFBSSxTQUFTLE1BQU0sQ0FBQyxLQUFLO0lBRXhELEVBQXFILEFBQXJILG1IQUFxSDtRQUNqSCxLQUFLLENBQUMsYUFBYSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRztRQUN2QyxhQUFhLENBQUMsaUJBQWlCLEdBQUcsS0FBSyxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsbUJBQW1CO1FBQ3JFLEVBQTZELEFBQTdELDJEQUE2RDtlQUN0RCxNQUFNLENBQUMsS0FBSzs7SUFHckIsRUFBeUUsQUFBekUsdUVBQXlFO0lBQ3pFLFVBQVU7UUFDUixhQUFhLENBQUMsS0FBSyxJQUNqQixJQUFNLElBQ0wsb0NBQW9DO1FBRXZDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsS0FBSztPQUN4QixJQUFJOztTQUdBLE1BQU0sQ0FBQyxLQUFzQjtJQUNwQyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUk7SUFFbEIsRUFBcUQsQUFBckQsbURBQXFEO1FBQ2pELEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLFdBQVc7SUFFL0IsRUFBbUUsQUFBbkUsaUVBQW1FO1FBQy9ELEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssSUFBTSxLQUFLLENBQUMsS0FBSzs7UUFDeEMsVUFBVTtZQUNSLGFBQWEsQ0FBQyxLQUFLLElBQ2pCLElBQU0sSUFDTCxvQ0FBb0M7WUFFdkMsTUFBTSxDQUFDLEtBQUs7V0FDWCxJQUFJOzs7SUFLVCxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUk7SUFDcEIsYUFBYSxDQUFDLEtBQUsifQ==