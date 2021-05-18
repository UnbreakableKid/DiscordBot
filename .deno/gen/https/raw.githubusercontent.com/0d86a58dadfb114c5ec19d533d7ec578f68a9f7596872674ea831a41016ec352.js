import { DiscordGatewayOpcodes } from "../types/codes/gateway_opcodes.ts";
import { ws } from "./ws.ts";
export async function identify(shardId, maxShards) {
    ws.log("IDENTIFYING", {
        shardId,
        maxShards
    });
    // Need to clear the old heartbeat interval
    const oldShard = ws.shards.get(shardId);
    if (oldShard) {
        ws.closeWS(oldShard.ws, 3065, "Reidentifying closure of old shard");
        clearInterval(oldShard.heartbeat.intervalId);
    }
    // CREATE A SHARD
    const socket = await ws.createShard(shardId);
    // Identify can just set/reset the settings for the shard
    ws.shards.set(shardId, {
        id: shardId,
        ws: socket,
        resumeInterval: 0,
        sessionId: "",
        previousSequenceNumber: 0,
        resuming: false,
        ready: false,
        unavailableGuildIds: new Set(),
        lastAvailable: 0,
        heartbeat: {
            lastSentAt: 0,
            lastReceivedAt: 0,
            acknowledged: false,
            keepAlive: false,
            interval: 0,
            intervalId: 0
        },
        queue: [],
        processingQueue: false,
        queueStartedAt: Date.now(),
        queueCounter: 0
    });
    socket.onopen = ()=>{
        ws.sendShardMessage(shardId, {
            op: DiscordGatewayOpcodes.Identify,
            d: {
                ...ws.identifyPayload,
                shard: [
                    shardId,
                    maxShards
                ]
            }
        }, true);
    };
    return new Promise((resolve, reject)=>{
        ws.loadingShards.set(shardId, {
            shardId,
            resolve,
            reject,
            startedAt: Date.now()
        });
        ws.cleanupLoadingShards();
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3dzL2lkZW50aWZ5LnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXNjb3JkR2F0ZXdheU9wY29kZXMgfSBmcm9tIFwiLi4vdHlwZXMvY29kZXMvZ2F0ZXdheV9vcGNvZGVzLnRzXCI7XG5pbXBvcnQgeyB3cyB9IGZyb20gXCIuL3dzLnRzXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpZGVudGlmeShzaGFyZElkOiBudW1iZXIsIG1heFNoYXJkczogbnVtYmVyKSB7XG4gIHdzLmxvZyhcIklERU5USUZZSU5HXCIsIHsgc2hhcmRJZCwgbWF4U2hhcmRzIH0pO1xuXG4gIC8vIE5lZWQgdG8gY2xlYXIgdGhlIG9sZCBoZWFydGJlYXQgaW50ZXJ2YWxcbiAgY29uc3Qgb2xkU2hhcmQgPSB3cy5zaGFyZHMuZ2V0KHNoYXJkSWQpO1xuICBpZiAob2xkU2hhcmQpIHtcbiAgICB3cy5jbG9zZVdTKG9sZFNoYXJkLndzLCAzMDY1LCBcIlJlaWRlbnRpZnlpbmcgY2xvc3VyZSBvZiBvbGQgc2hhcmRcIik7XG4gICAgY2xlYXJJbnRlcnZhbChvbGRTaGFyZC5oZWFydGJlYXQuaW50ZXJ2YWxJZCk7XG4gIH1cblxuICAvLyBDUkVBVEUgQSBTSEFSRFxuICBjb25zdCBzb2NrZXQgPSBhd2FpdCB3cy5jcmVhdGVTaGFyZChzaGFyZElkKTtcblxuICAvLyBJZGVudGlmeSBjYW4ganVzdCBzZXQvcmVzZXQgdGhlIHNldHRpbmdzIGZvciB0aGUgc2hhcmRcbiAgd3Muc2hhcmRzLnNldChzaGFyZElkLCB7XG4gICAgaWQ6IHNoYXJkSWQsXG4gICAgd3M6IHNvY2tldCxcbiAgICByZXN1bWVJbnRlcnZhbDogMCxcbiAgICBzZXNzaW9uSWQ6IFwiXCIsXG4gICAgcHJldmlvdXNTZXF1ZW5jZU51bWJlcjogMCxcbiAgICByZXN1bWluZzogZmFsc2UsXG4gICAgcmVhZHk6IGZhbHNlLFxuICAgIHVuYXZhaWxhYmxlR3VpbGRJZHM6IG5ldyBTZXQoKSxcbiAgICBsYXN0QXZhaWxhYmxlOiAwLFxuICAgIGhlYXJ0YmVhdDoge1xuICAgICAgbGFzdFNlbnRBdDogMCxcbiAgICAgIGxhc3RSZWNlaXZlZEF0OiAwLFxuICAgICAgYWNrbm93bGVkZ2VkOiBmYWxzZSxcbiAgICAgIGtlZXBBbGl2ZTogZmFsc2UsXG4gICAgICBpbnRlcnZhbDogMCxcbiAgICAgIGludGVydmFsSWQ6IDAsXG4gICAgfSxcbiAgICBxdWV1ZTogW10sXG4gICAgcHJvY2Vzc2luZ1F1ZXVlOiBmYWxzZSxcbiAgICBxdWV1ZVN0YXJ0ZWRBdDogRGF0ZS5ub3coKSxcbiAgICBxdWV1ZUNvdW50ZXI6IDAsXG4gIH0pO1xuXG4gIHNvY2tldC5vbm9wZW4gPSAoKSA9PiB7XG4gICAgd3Muc2VuZFNoYXJkTWVzc2FnZShzaGFyZElkLCB7XG4gICAgICBvcDogRGlzY29yZEdhdGV3YXlPcGNvZGVzLklkZW50aWZ5LFxuICAgICAgZDogeyAuLi53cy5pZGVudGlmeVBheWxvYWQsIHNoYXJkOiBbc2hhcmRJZCwgbWF4U2hhcmRzXSB9LFxuICAgIH0sIHRydWUpO1xuICB9O1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgd3MubG9hZGluZ1NoYXJkcy5zZXQoc2hhcmRJZCwge1xuICAgICAgc2hhcmRJZCxcbiAgICAgIHJlc29sdmUsXG4gICAgICByZWplY3QsXG4gICAgICBzdGFydGVkQXQ6IERhdGUubm93KCksXG4gICAgfSk7XG5cbiAgICB3cy5jbGVhbnVwTG9hZGluZ1NoYXJkcygpO1xuICB9KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxxQkFBcUIsU0FBUSxpQ0FBbUM7U0FDaEUsRUFBRSxTQUFRLE9BQVM7c0JBRU4sUUFBUSxDQUFDLE9BQWUsRUFBRSxTQUFpQjtJQUMvRCxFQUFFLENBQUMsR0FBRyxFQUFDLFdBQWE7UUFBSSxPQUFPO1FBQUUsU0FBUzs7SUFFMUMsRUFBMkMsQUFBM0MseUNBQTJDO1VBQ3JDLFFBQVEsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPO1FBQ2xDLFFBQVE7UUFDVixFQUFFLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsSUFBSSxHQUFFLGtDQUFvQztRQUNsRSxhQUFhLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxVQUFVOztJQUc3QyxFQUFpQixBQUFqQixlQUFpQjtVQUNYLE1BQU0sU0FBUyxFQUFFLENBQUMsV0FBVyxDQUFDLE9BQU87SUFFM0MsRUFBeUQsQUFBekQsdURBQXlEO0lBQ3pELEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU87UUFDbkIsRUFBRSxFQUFFLE9BQU87UUFDWCxFQUFFLEVBQUUsTUFBTTtRQUNWLGNBQWMsRUFBRSxDQUFDO1FBQ2pCLFNBQVM7UUFDVCxzQkFBc0IsRUFBRSxDQUFDO1FBQ3pCLFFBQVEsRUFBRSxLQUFLO1FBQ2YsS0FBSyxFQUFFLEtBQUs7UUFDWixtQkFBbUIsTUFBTSxHQUFHO1FBQzVCLGFBQWEsRUFBRSxDQUFDO1FBQ2hCLFNBQVM7WUFDUCxVQUFVLEVBQUUsQ0FBQztZQUNiLGNBQWMsRUFBRSxDQUFDO1lBQ2pCLFlBQVksRUFBRSxLQUFLO1lBQ25CLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLFFBQVEsRUFBRSxDQUFDO1lBQ1gsVUFBVSxFQUFFLENBQUM7O1FBRWYsS0FBSztRQUNMLGVBQWUsRUFBRSxLQUFLO1FBQ3RCLGNBQWMsRUFBRSxJQUFJLENBQUMsR0FBRztRQUN4QixZQUFZLEVBQUUsQ0FBQzs7SUFHakIsTUFBTSxDQUFDLE1BQU07UUFDWCxFQUFFLENBQUMsZ0JBQWdCLENBQUMsT0FBTztZQUN6QixFQUFFLEVBQUUscUJBQXFCLENBQUMsUUFBUTtZQUNsQyxDQUFDO21CQUFPLEVBQUUsQ0FBQyxlQUFlO2dCQUFFLEtBQUs7b0JBQUcsT0FBTztvQkFBRSxTQUFTOzs7V0FDckQsSUFBSTs7ZUFHRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU07UUFDakMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsT0FBTztZQUMxQixPQUFPO1lBQ1AsT0FBTztZQUNQLE1BQU07WUFDTixTQUFTLEVBQUUsSUFBSSxDQUFDLEdBQUc7O1FBR3JCLEVBQUUsQ0FBQyxvQkFBb0IifQ==