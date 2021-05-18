import { eventHandlers } from "../bot.ts";
import { handlers } from "../handlers/mod.ts";
import { DiscordGatewayOpcodes } from "../types/codes/gateway_opcodes.ts";
import { camelize, delay } from "../util/utils.ts";
import { decompressWith } from "./deps.ts";
import { identify } from "./identify.ts";
import { resume } from "./resume.ts";
import { ws } from "./ws.ts";
/** Handler for handling every message event from websocket. */ // deno-lint-ignore no-explicit-any
export async function handleOnMessage(message, shardId) {
    if (message instanceof ArrayBuffer) {
        message = new Uint8Array(message);
    }
    if (message instanceof Uint8Array) {
        message = decompressWith(message, 0, (slice)=>ws.utf8decoder.decode(slice)
        );
    }
    if (typeof message !== "string") return;
    const shard = ws.shards.get(shardId);
    const messageData = JSON.parse(message);
    ws.log("RAW", {
        shardId,
        payload: messageData
    });
    switch(messageData.op){
        case DiscordGatewayOpcodes.Heartbeat:
            if (shard?.ws.readyState !== WebSocket.OPEN) return;
            shard.heartbeat.lastSentAt = Date.now();
            // Discord randomly sends this requiring an immediate heartbeat back
            ws.sendShardMessage(shard, {
                op: DiscordGatewayOpcodes.Heartbeat,
                d: shard?.previousSequenceNumber
            }, true);
            break;
        case DiscordGatewayOpcodes.Hello:
            ws.heartbeat(shardId, messageData.d.heartbeat_interval);
            break;
        case DiscordGatewayOpcodes.HeartbeatACK:
            if (ws.shards.has(shardId)) {
                ws.shards.get(shardId).heartbeat.acknowledged = true;
            }
            break;
        case DiscordGatewayOpcodes.Reconnect:
            ws.log("RECONNECT", {
                shardId
            });
            if (ws.shards.has(shardId)) {
                ws.shards.get(shardId).resuming = true;
            }
            await resume(shardId);
            break;
        case DiscordGatewayOpcodes.InvalidSession:
            ws.log("INVALID_SESSION", {
                shardId,
                payload: messageData
            });
            // We need to wait for a random amount of time between 1 and 5: https://discord.com/developers/docs/topics/gateway#resuming
            await delay(Math.floor((Math.random() * 4 + 1) * 1000));
            // When d is false we need to reidentify
            if (!messageData.d) {
                await identify(shardId, ws.maxShards);
                break;
            }
            if (ws.shards.has(shardId)) {
                ws.shards.get(shardId).resuming = true;
            }
            await resume(shardId);
            break;
        default:
            if (messageData.t === "RESUMED") {
                ws.log("RESUMED", {
                    shardId
                });
                if (ws.shards.has(shardId)) {
                    ws.shards.get(shardId).resuming = false;
                }
                break;
            }
            // Important for RESUME
            if (messageData.t === "READY") {
                const shard = ws.shards.get(shardId);
                if (shard) {
                    shard.sessionId = messageData.d.session_id;
                }
                ws.loadingShards.get(shardId)?.resolve(true);
                ws.loadingShards.delete(shardId);
                // Wait 5 seconds to spawn next shard
                setTimeout(()=>{
                    const bucket = ws.buckets.get(shardId % ws.botGatewayData.sessionStartLimit.maxConcurrency);
                    if (bucket) bucket.createNextShard = true;
                }, 5000);
            }
            // Update the sequence number if it is present
            if (messageData.s) {
                const shard = ws.shards.get(shardId);
                if (shard) {
                    shard.previousSequenceNumber = messageData.s;
                }
            }
            if (ws.url) await ws.handleDiscordPayload(messageData, shardId);
            else {
                eventHandlers.raw?.(messageData);
                await eventHandlers.dispatchRequirements?.(messageData, shardId);
                if (messageData.op !== DiscordGatewayOpcodes.Dispatch) return;
                if (!messageData.t) return;
                return handlers[messageData.t]?.(camelize(messageData), shardId);
            }
            break;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3dzL2hhbmRsZV9vbl9tZXNzYWdlLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBldmVudEhhbmRsZXJzIH0gZnJvbSBcIi4uL2JvdC50c1wiO1xuaW1wb3J0IHsgaGFuZGxlcnMgfSBmcm9tIFwiLi4vaGFuZGxlcnMvbW9kLnRzXCI7XG5pbXBvcnQgeyBEaXNjb3JkR2F0ZXdheU9wY29kZXMgfSBmcm9tIFwiLi4vdHlwZXMvY29kZXMvZ2F0ZXdheV9vcGNvZGVzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IERpc2NvcmRHYXRld2F5UGF5bG9hZCB9IGZyb20gXCIuLi90eXBlcy9nYXRld2F5L2dhdGV3YXlfcGF5bG9hZC50c1wiO1xuaW1wb3J0IHR5cGUgeyBEaXNjb3JkSGVsbG8gfSBmcm9tIFwiLi4vdHlwZXMvZ2F0ZXdheS9oZWxsby50c1wiO1xuaW1wb3J0IHR5cGUgeyBEaXNjb3JkUmVhZHkgfSBmcm9tIFwiLi4vdHlwZXMvZ2F0ZXdheS9yZWFkeS50c1wiO1xuaW1wb3J0IHsgY2FtZWxpemUsIGRlbGF5IH0gZnJvbSBcIi4uL3V0aWwvdXRpbHMudHNcIjtcbmltcG9ydCB7IGRlY29tcHJlc3NXaXRoIH0gZnJvbSBcIi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgaWRlbnRpZnkgfSBmcm9tIFwiLi9pZGVudGlmeS50c1wiO1xuaW1wb3J0IHsgcmVzdW1lIH0gZnJvbSBcIi4vcmVzdW1lLnRzXCI7XG5pbXBvcnQgeyB3cyB9IGZyb20gXCIuL3dzLnRzXCI7XG5cbi8qKiBIYW5kbGVyIGZvciBoYW5kbGluZyBldmVyeSBtZXNzYWdlIGV2ZW50IGZyb20gd2Vic29ja2V0LiAqL1xuLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVPbk1lc3NhZ2UobWVzc2FnZTogYW55LCBzaGFyZElkOiBudW1iZXIpIHtcbiAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgIG1lc3NhZ2UgPSBuZXcgVWludDhBcnJheShtZXNzYWdlKTtcbiAgfVxuXG4gIGlmIChtZXNzYWdlIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgIG1lc3NhZ2UgPSBkZWNvbXByZXNzV2l0aChcbiAgICAgIG1lc3NhZ2UsXG4gICAgICAwLFxuICAgICAgKHNsaWNlOiBVaW50OEFycmF5KSA9PiB3cy51dGY4ZGVjb2Rlci5kZWNvZGUoc2xpY2UpLFxuICAgICk7XG4gIH1cblxuICBpZiAodHlwZW9mIG1lc3NhZ2UgIT09IFwic3RyaW5nXCIpIHJldHVybjtcblxuICBjb25zdCBzaGFyZCA9IHdzLnNoYXJkcy5nZXQoc2hhcmRJZCk7XG5cbiAgY29uc3QgbWVzc2FnZURhdGEgPSBKU09OLnBhcnNlKG1lc3NhZ2UpIGFzIERpc2NvcmRHYXRld2F5UGF5bG9hZDtcbiAgd3MubG9nKFwiUkFXXCIsIHsgc2hhcmRJZCwgcGF5bG9hZDogbWVzc2FnZURhdGEgfSk7XG5cbiAgc3dpdGNoIChtZXNzYWdlRGF0YS5vcCkge1xuICAgIGNhc2UgRGlzY29yZEdhdGV3YXlPcGNvZGVzLkhlYXJ0YmVhdDpcbiAgICAgIGlmIChzaGFyZD8ud3MucmVhZHlTdGF0ZSAhPT0gV2ViU29ja2V0Lk9QRU4pIHJldHVybjtcblxuICAgICAgc2hhcmQuaGVhcnRiZWF0Lmxhc3RTZW50QXQgPSBEYXRlLm5vdygpO1xuICAgICAgLy8gRGlzY29yZCByYW5kb21seSBzZW5kcyB0aGlzIHJlcXVpcmluZyBhbiBpbW1lZGlhdGUgaGVhcnRiZWF0IGJhY2tcbiAgICAgIHdzLnNlbmRTaGFyZE1lc3NhZ2Uoc2hhcmQsIHtcbiAgICAgICAgb3A6IERpc2NvcmRHYXRld2F5T3Bjb2Rlcy5IZWFydGJlYXQsXG4gICAgICAgIGQ6IHNoYXJkPy5wcmV2aW91c1NlcXVlbmNlTnVtYmVyLFxuICAgICAgfSwgdHJ1ZSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIERpc2NvcmRHYXRld2F5T3Bjb2Rlcy5IZWxsbzpcbiAgICAgIHdzLmhlYXJ0YmVhdChcbiAgICAgICAgc2hhcmRJZCxcbiAgICAgICAgKG1lc3NhZ2VEYXRhLmQgYXMgRGlzY29yZEhlbGxvKS5oZWFydGJlYXRfaW50ZXJ2YWwsXG4gICAgICApO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBEaXNjb3JkR2F0ZXdheU9wY29kZXMuSGVhcnRiZWF0QUNLOlxuICAgICAgaWYgKHdzLnNoYXJkcy5oYXMoc2hhcmRJZCkpIHtcbiAgICAgICAgd3Muc2hhcmRzLmdldChzaGFyZElkKSEuaGVhcnRiZWF0LmFja25vd2xlZGdlZCA9IHRydWU7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIERpc2NvcmRHYXRld2F5T3Bjb2Rlcy5SZWNvbm5lY3Q6XG4gICAgICB3cy5sb2coXCJSRUNPTk5FQ1RcIiwgeyBzaGFyZElkIH0pO1xuXG4gICAgICBpZiAod3Muc2hhcmRzLmhhcyhzaGFyZElkKSkge1xuICAgICAgICB3cy5zaGFyZHMuZ2V0KHNoYXJkSWQpIS5yZXN1bWluZyA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHJlc3VtZShzaGFyZElkKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgRGlzY29yZEdhdGV3YXlPcGNvZGVzLkludmFsaWRTZXNzaW9uOlxuICAgICAgd3MubG9nKFwiSU5WQUxJRF9TRVNTSU9OXCIsIHsgc2hhcmRJZCwgcGF5bG9hZDogbWVzc2FnZURhdGEgfSk7XG5cbiAgICAgIC8vIFdlIG5lZWQgdG8gd2FpdCBmb3IgYSByYW5kb20gYW1vdW50IG9mIHRpbWUgYmV0d2VlbiAxIGFuZCA1OiBodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy90b3BpY3MvZ2F0ZXdheSNyZXN1bWluZ1xuICAgICAgYXdhaXQgZGVsYXkoTWF0aC5mbG9vcigoTWF0aC5yYW5kb20oKSAqIDQgKyAxKSAqIDEwMDApKTtcblxuICAgICAgLy8gV2hlbiBkIGlzIGZhbHNlIHdlIG5lZWQgdG8gcmVpZGVudGlmeVxuICAgICAgaWYgKCFtZXNzYWdlRGF0YS5kKSB7XG4gICAgICAgIGF3YWl0IGlkZW50aWZ5KHNoYXJkSWQsIHdzLm1heFNoYXJkcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZiAod3Muc2hhcmRzLmhhcyhzaGFyZElkKSkge1xuICAgICAgICB3cy5zaGFyZHMuZ2V0KHNoYXJkSWQpIS5yZXN1bWluZyA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHJlc3VtZShzaGFyZElkKTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBpZiAobWVzc2FnZURhdGEudCA9PT0gXCJSRVNVTUVEXCIpIHtcbiAgICAgICAgd3MubG9nKFwiUkVTVU1FRFwiLCB7IHNoYXJkSWQgfSk7XG5cbiAgICAgICAgaWYgKHdzLnNoYXJkcy5oYXMoc2hhcmRJZCkpIHtcbiAgICAgICAgICB3cy5zaGFyZHMuZ2V0KHNoYXJkSWQpIS5yZXN1bWluZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBJbXBvcnRhbnQgZm9yIFJFU1VNRVxuICAgICAgaWYgKG1lc3NhZ2VEYXRhLnQgPT09IFwiUkVBRFlcIikge1xuICAgICAgICBjb25zdCBzaGFyZCA9IHdzLnNoYXJkcy5nZXQoc2hhcmRJZCk7XG4gICAgICAgIGlmIChzaGFyZCkge1xuICAgICAgICAgIHNoYXJkLnNlc3Npb25JZCA9IChtZXNzYWdlRGF0YS5kIGFzIERpc2NvcmRSZWFkeSkuc2Vzc2lvbl9pZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHdzLmxvYWRpbmdTaGFyZHMuZ2V0KHNoYXJkSWQpPy5yZXNvbHZlKHRydWUpO1xuICAgICAgICB3cy5sb2FkaW5nU2hhcmRzLmRlbGV0ZShzaGFyZElkKTtcbiAgICAgICAgLy8gV2FpdCA1IHNlY29uZHMgdG8gc3Bhd24gbmV4dCBzaGFyZFxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICBjb25zdCBidWNrZXQgPSB3cy5idWNrZXRzLmdldChcbiAgICAgICAgICAgIHNoYXJkSWQgJSB3cy5ib3RHYXRld2F5RGF0YS5zZXNzaW9uU3RhcnRMaW1pdC5tYXhDb25jdXJyZW5jeSxcbiAgICAgICAgICApO1xuICAgICAgICAgIGlmIChidWNrZXQpIGJ1Y2tldC5jcmVhdGVOZXh0U2hhcmQgPSB0cnVlO1xuICAgICAgICB9LCA1MDAwKTtcbiAgICAgIH1cblxuICAgICAgLy8gVXBkYXRlIHRoZSBzZXF1ZW5jZSBudW1iZXIgaWYgaXQgaXMgcHJlc2VudFxuICAgICAgaWYgKG1lc3NhZ2VEYXRhLnMpIHtcbiAgICAgICAgY29uc3Qgc2hhcmQgPSB3cy5zaGFyZHMuZ2V0KHNoYXJkSWQpO1xuICAgICAgICBpZiAoc2hhcmQpIHtcbiAgICAgICAgICBzaGFyZC5wcmV2aW91c1NlcXVlbmNlTnVtYmVyID0gbWVzc2FnZURhdGEucztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAod3MudXJsKSBhd2FpdCB3cy5oYW5kbGVEaXNjb3JkUGF5bG9hZChtZXNzYWdlRGF0YSwgc2hhcmRJZCk7XG4gICAgICBlbHNlIHtcbiAgICAgICAgZXZlbnRIYW5kbGVycy5yYXc/LihtZXNzYWdlRGF0YSk7XG4gICAgICAgIGF3YWl0IGV2ZW50SGFuZGxlcnMuZGlzcGF0Y2hSZXF1aXJlbWVudHM/LihtZXNzYWdlRGF0YSwgc2hhcmRJZCk7XG5cbiAgICAgICAgaWYgKG1lc3NhZ2VEYXRhLm9wICE9PSBEaXNjb3JkR2F0ZXdheU9wY29kZXMuRGlzcGF0Y2gpIHJldHVybjtcblxuICAgICAgICBpZiAoIW1lc3NhZ2VEYXRhLnQpIHJldHVybjtcblxuICAgICAgICByZXR1cm4gaGFuZGxlcnNbbWVzc2FnZURhdGEudF0/LihcbiAgICAgICAgICBjYW1lbGl6ZShtZXNzYWdlRGF0YSksXG4gICAgICAgICAgc2hhcmRJZCxcbiAgICAgICAgKTtcbiAg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