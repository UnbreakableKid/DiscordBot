import { DiscordGatewayOpcodes } from "../types/codes/gateway_opcodes.ts";
import { ws } from "./ws.ts";
export async function resume(shardId) {
  ws.log("RESUMING", {
    shardId,
  });
  // NOW WE HANDLE RESUMING THIS SHARD
  // Get the old data for this shard necessary for resuming
  const oldShard = ws.shards.get(shardId);
  if (oldShard) {
    // HOW TO CLOSE OLD SHARD SOCKET!!!
    ws.closeWS(oldShard.ws, 3064, "Resuming the shard, closing old shard.");
    // STOP OLD HEARTBEAT
    clearInterval(oldShard.heartbeat.intervalId);
  }
  // CREATE A SHARD
  const socket = await ws.createShard(shardId);
  const sessionId = oldShard?.sessionId || "";
  const previousSequenceNumber = oldShard?.previousSequenceNumber || 0;
  ws.shards.set(shardId, {
    id: shardId,
    ws: socket,
    resumeInterval: 0,
    sessionId: sessionId,
    previousSequenceNumber: previousSequenceNumber,
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
      intervalId: 0,
    },
    queue: oldShard?.queue || [],
    processingQueue: false,
    queueStartedAt: Date.now(),
    queueCounter: 0,
  });
  // Resume on open
  socket.onopen = () => {
    ws.sendShardMessage(shardId, {
      op: DiscordGatewayOpcodes.Resume,
      d: {
        token: ws.identifyPayload.token,
        session_id: sessionId,
        seq: previousSequenceNumber,
      },
    }, true);
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3dzL3Jlc3VtZS50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGlzY29yZEdhdGV3YXlPcGNvZGVzIH0gZnJvbSBcIi4uL3R5cGVzL2NvZGVzL2dhdGV3YXlfb3Bjb2Rlcy50c1wiO1xuaW1wb3J0IHsgd3MgfSBmcm9tIFwiLi93cy50c1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzdW1lKHNoYXJkSWQ6IG51bWJlcikge1xuICB3cy5sb2coXCJSRVNVTUlOR1wiLCB7IHNoYXJkSWQgfSk7XG5cbiAgLy8gTk9XIFdFIEhBTkRMRSBSRVNVTUlORyBUSElTIFNIQVJEXG4gIC8vIEdldCB0aGUgb2xkIGRhdGEgZm9yIHRoaXMgc2hhcmQgbmVjZXNzYXJ5IGZvciByZXN1bWluZ1xuICBjb25zdCBvbGRTaGFyZCA9IHdzLnNoYXJkcy5nZXQoc2hhcmRJZCk7XG5cbiAgaWYgKG9sZFNoYXJkKSB7XG4gICAgLy8gSE9XIFRPIENMT1NFIE9MRCBTSEFSRCBTT0NLRVQhISFcbiAgICB3cy5jbG9zZVdTKG9sZFNoYXJkLndzLCAzMDY0LCBcIlJlc3VtaW5nIHRoZSBzaGFyZCwgY2xvc2luZyBvbGQgc2hhcmQuXCIpO1xuICAgIC8vIFNUT1AgT0xEIEhFQVJUQkVBVFxuICAgIGNsZWFySW50ZXJ2YWwob2xkU2hhcmQuaGVhcnRiZWF0LmludGVydmFsSWQpO1xuICB9XG5cbiAgLy8gQ1JFQVRFIEEgU0hBUkRcbiAgY29uc3Qgc29ja2V0ID0gYXdhaXQgd3MuY3JlYXRlU2hhcmQoc2hhcmRJZCk7XG5cbiAgY29uc3Qgc2Vzc2lvbklkID0gb2xkU2hhcmQ/LnNlc3Npb25JZCB8fCBcIlwiO1xuICBjb25zdCBwcmV2aW91c1NlcXVlbmNlTnVtYmVyID0gb2xkU2hhcmQ/LnByZXZpb3VzU2VxdWVuY2VOdW1iZXIgfHwgMDtcblxuICB3cy5zaGFyZHMuc2V0KHNoYXJkSWQsIHtcbiAgICBpZDogc2hhcmRJZCxcbiAgICB3czogc29ja2V0LFxuICAgIHJlc3VtZUludGVydmFsOiAwLFxuICAgIHNlc3Npb25JZDogc2Vzc2lvbklkLFxuICAgIHByZXZpb3VzU2VxdWVuY2VOdW1iZXI6IHByZXZpb3VzU2VxdWVuY2VOdW1iZXIsXG4gICAgcmVzdW1pbmc6IGZhbHNlLFxuICAgIHJlYWR5OiBmYWxzZSxcbiAgICB1bmF2YWlsYWJsZUd1aWxkSWRzOiBuZXcgU2V0KCksXG4gICAgbGFzdEF2YWlsYWJsZTogMCxcbiAgICBoZWFydGJlYXQ6IHtcbiAgICAgIGxhc3RTZW50QXQ6IDAsXG4gICAgICBsYXN0UmVjZWl2ZWRBdDogMCxcbiAgICAgIGFja25vd2xlZGdlZDogZmFsc2UsXG4gICAgICBrZWVwQWxpdmU6IGZhbHNlLFxuICAgICAgaW50ZXJ2YWw6IDAsXG4gICAgICBpbnRlcnZhbElkOiAwLFxuICAgIH0sXG4gICAgcXVldWU6IG9sZFNoYXJkPy5xdWV1ZSB8fCBbXSxcbiAgICBwcm9jZXNzaW5nUXVldWU6IGZhbHNlLFxuICAgIHF1ZXVlU3RhcnRlZEF0OiBEYXRlLm5vdygpLFxuICAgIHF1ZXVlQ291bnRlcjogMCxcbiAgfSk7XG5cbiAgLy8gUmVzdW1lIG9uIG9wZW5cbiAgc29ja2V0Lm9ub3BlbiA9ICgpID0+IHtcbiAgICB3cy5zZW5kU2hhcmRNZXNzYWdlKHNoYXJkSWQsIHtcbiAgICAgIG9wOiBEaXNjb3JkR2F0ZXdheU9wY29kZXMuUmVzdW1lLFxuICAgICAgZDoge1xuICAgICAgICB0b2tlbjogd3MuaWRlbnRpZnlQYXlsb2FkLnRva2VuLFxuICAgICAgICBzZXNzaW9uX2lkOiBzZXNzaW9uSWQsXG4gICAgICAgIHNlcTogcHJldmlvdXNTZXF1ZW5jZU51bWJlcixcbiAgICAgIH0sXG4gICAgfSwgdHJ1ZSk7XG4gIH07XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMscUJBQXFCLFNBQVEsaUNBQW1DO1NBQ2hFLEVBQUUsU0FBUSxPQUFTO3NCQUVOLE1BQU0sQ0FBQyxPQUFlO0lBQzFDLEVBQUUsQ0FBQyxHQUFHLEVBQUMsUUFBVTtRQUFJLE9BQU87O0lBRTVCLEVBQW9DLEFBQXBDLGtDQUFvQztJQUNwQyxFQUF5RCxBQUF6RCx1REFBeUQ7VUFDbkQsUUFBUSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU87UUFFbEMsUUFBUTtRQUNWLEVBQW1DLEFBQW5DLGlDQUFtQztRQUNuQyxFQUFFLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsSUFBSSxHQUFFLHNDQUF3QztRQUN0RSxFQUFxQixBQUFyQixtQkFBcUI7UUFDckIsYUFBYSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsVUFBVTs7SUFHN0MsRUFBaUIsQUFBakIsZUFBaUI7VUFDWCxNQUFNLFNBQVMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxPQUFPO1VBRXJDLFNBQVMsR0FBRyxRQUFRLEVBQUUsU0FBUztVQUMvQixzQkFBc0IsR0FBRyxRQUFRLEVBQUUsc0JBQXNCLElBQUksQ0FBQztJQUVwRSxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPO1FBQ25CLEVBQUUsRUFBRSxPQUFPO1FBQ1gsRUFBRSxFQUFFLE1BQU07UUFDVixjQUFjLEVBQUUsQ0FBQztRQUNqQixTQUFTLEVBQUUsU0FBUztRQUNwQixzQkFBc0IsRUFBRSxzQkFBc0I7UUFDOUMsUUFBUSxFQUFFLEtBQUs7UUFDZixLQUFLLEVBQUUsS0FBSztRQUNaLG1CQUFtQixNQUFNLEdBQUc7UUFDNUIsYUFBYSxFQUFFLENBQUM7UUFDaEIsU0FBUztZQUNQLFVBQVUsRUFBRSxDQUFDO1lBQ2IsY0FBYyxFQUFFLENBQUM7WUFDakIsWUFBWSxFQUFFLEtBQUs7WUFDbkIsU0FBUyxFQUFFLEtBQUs7WUFDaEIsUUFBUSxFQUFFLENBQUM7WUFDWCxVQUFVLEVBQUUsQ0FBQzs7UUFFZixLQUFLLEVBQUUsUUFBUSxFQUFFLEtBQUs7UUFDdEIsZUFBZSxFQUFFLEtBQUs7UUFDdEIsY0FBYyxFQUFFLElBQUksQ0FBQyxHQUFHO1FBQ3hCLFlBQVksRUFBRSxDQUFDOztJQUdqQixFQUFpQixBQUFqQixlQUFpQjtJQUNqQixNQUFNLENBQUMsTUFBTTtRQUNYLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPO1lBQ3pCLEVBQUUsRUFBRSxxQkFBcUIsQ0FBQyxNQUFNO1lBQ2hDLENBQUM7Z0JBQ0MsS0FBSyxFQUFFLEVBQUUsQ0FBQyxlQUFlLENBQUMsS0FBSztnQkFDL0IsVUFBVSxFQUFFLFNBQVM7Z0JBQ3JCLEdBQUcsRUFBRSxzQkFBc0I7O1dBRTVCLElBQUkifQ==
