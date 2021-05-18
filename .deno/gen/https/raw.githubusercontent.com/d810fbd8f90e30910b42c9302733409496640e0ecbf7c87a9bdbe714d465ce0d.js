import { DiscordGatewayCloseEventCodes } from "../types/codes/gateway_close_event_codes.ts";
import { identify } from "./identify.ts";
import { resume } from "./resume.ts";
import { ws } from "./ws.ts";
// deno-lint-ignore require-await
export async function createShard(shardId) {
  const socket = new WebSocket(ws.botGatewayData.url);
  socket.binaryType = "arraybuffer";
  socket.onerror = (errorEvent) => {
    ws.log("ERROR", {
      shardId,
      error: errorEvent,
    });
  };
  socket.onmessage = ({ data: message }) =>
    ws.handleOnMessage(message, shardId);
  socket.onclose = (event) => {
    ws.log("CLOSED", {
      shardId,
      payload: event,
    });
    if (
      event.code === 3064 ||
      event.reason === "Discordeno Testing Finished! Do Not RESUME!"
    ) {
      return;
    }
    if (
      event.code === 3065 || [
        "Resharded!",
        "Resuming the shard, closing old shard.",
      ].includes(event.reason)
    ) {
      return ws.log("CLOSED_RECONNECT", {
        shardId,
        payload: event,
      });
    }
    switch (event.code) {
      // Discordeno tests finished
      case 3061:
        return;
      case 3063:
      case 3064:
      case 3065:
      case 3066:
        // Will restart shard manually
        return ws.log("CLOSED_RECONNECT", {
          shardId,
          payload: event,
        });
      case DiscordGatewayCloseEventCodes.UnknownOpcode:
      case DiscordGatewayCloseEventCodes.DecodeError:
      case DiscordGatewayCloseEventCodes.AuthenticationFailed:
      case DiscordGatewayCloseEventCodes.AlreadyAuthenticated:
      case DiscordGatewayCloseEventCodes.InvalidShard:
      case DiscordGatewayCloseEventCodes.ShardingRequired:
      case DiscordGatewayCloseEventCodes.InvalidApiVersion:
      case DiscordGatewayCloseEventCodes.InvalidIntents:
      case DiscordGatewayCloseEventCodes.DisallowedIntents:
        throw new Error(
          event.reason || "Discord gave no reason! GG! You broke Discord!",
        );
      // THESE ERRORS CAN NO BE RESUMED! THEY MUST RE-IDENTIFY!
      case DiscordGatewayCloseEventCodes.NotAuthenticated:
      case DiscordGatewayCloseEventCodes.InvalidSeq:
      case DiscordGatewayCloseEventCodes.RateLimited:
      case DiscordGatewayCloseEventCodes.SessionTimedOut:
        identify(shardId, ws.maxShards);
        break;
      default:
        resume(shardId);
        break;
    }
  };
  return socket;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3dzL2NyZWF0ZV9zaGFyZC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGlzY29yZEdhdGV3YXlDbG9zZUV2ZW50Q29kZXMgfSBmcm9tIFwiLi4vdHlwZXMvY29kZXMvZ2F0ZXdheV9jbG9zZV9ldmVudF9jb2Rlcy50c1wiO1xuaW1wb3J0IHsgaWRlbnRpZnkgfSBmcm9tIFwiLi9pZGVudGlmeS50c1wiO1xuaW1wb3J0IHsgcmVzdW1lIH0gZnJvbSBcIi4vcmVzdW1lLnRzXCI7XG5pbXBvcnQgeyB3cyB9IGZyb20gXCIuL3dzLnRzXCI7XG5cbi8vIGRlbm8tbGludC1pZ25vcmUgcmVxdWlyZS1hd2FpdFxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVNoYXJkKHNoYXJkSWQ6IG51bWJlcikge1xuICBjb25zdCBzb2NrZXQgPSBuZXcgV2ViU29ja2V0KHdzLmJvdEdhdGV3YXlEYXRhLnVybCk7XG4gIHNvY2tldC5iaW5hcnlUeXBlID0gXCJhcnJheWJ1ZmZlclwiO1xuXG4gIHNvY2tldC5vbmVycm9yID0gKGVycm9yRXZlbnQpID0+IHtcbiAgICB3cy5sb2coXCJFUlJPUlwiLCB7IHNoYXJkSWQsIGVycm9yOiBlcnJvckV2ZW50IH0pO1xuICB9O1xuXG4gIHNvY2tldC5vbm1lc3NhZ2UgPSAoeyBkYXRhOiBtZXNzYWdlIH0pID0+XG4gICAgd3MuaGFuZGxlT25NZXNzYWdlKG1lc3NhZ2UsIHNoYXJkSWQpO1xuXG4gIHNvY2tldC5vbmNsb3NlID0gKGV2ZW50KSA9PiB7XG4gICAgd3MubG9nKFwiQ0xPU0VEXCIsIHsgc2hhcmRJZCwgcGF5bG9hZDogZXZlbnQgfSk7XG5cbiAgICBpZiAoXG4gICAgICBldmVudC5jb2RlID09PSAzMDY0IHx8XG4gICAgICBldmVudC5yZWFzb24gPT09IFwiRGlzY29yZGVubyBUZXN0aW5nIEZpbmlzaGVkISBEbyBOb3QgUkVTVU1FIVwiXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgZXZlbnQuY29kZSA9PT0gMzA2NSB8fFxuICAgICAgW1wiUmVzaGFyZGVkIVwiLCBcIlJlc3VtaW5nIHRoZSBzaGFyZCwgY2xvc2luZyBvbGQgc2hhcmQuXCJdLmluY2x1ZGVzKFxuICAgICAgICBldmVudC5yZWFzb24sXG4gICAgICApXG4gICAgKSB7XG4gICAgICByZXR1cm4gd3MubG9nKFwiQ0xPU0VEX1JFQ09OTkVDVFwiLCB7IHNoYXJkSWQsIHBheWxvYWQ6IGV2ZW50IH0pO1xuICAgIH1cblxuICAgIHN3aXRjaCAoZXZlbnQuY29kZSkge1xuICAgICAgLy8gRGlzY29yZGVubyB0ZXN0cyBmaW5pc2hlZFxuICAgICAgY2FzZSAzMDYxOlxuICAgICAgICByZXR1cm47XG4gICAgICBjYXNlIDMwNjM6IC8vIFJlc2hhcmRlZFxuICAgICAgY2FzZSAzMDY0OiAvLyBSZXN1bWluZ1xuICAgICAgY2FzZSAzMDY1OiAvLyBSZWlkZW50aWZ5aW5nXG4gICAgICBjYXNlIDMwNjY6IC8vIE1pc3NpbmcgQUNLXG4gICAgICAgIC8vIFdpbGwgcmVzdGFydCBzaGFyZCBtYW51YWxseVxuICAgICAgICByZXR1cm4gd3MubG9nKFwiQ0xPU0VEX1JFQ09OTkVDVFwiLCB7IHNoYXJkSWQsIHBheWxvYWQ6IGV2ZW50IH0pO1xuICAgICAgY2FzZSBEaXNjb3JkR2F0ZXdheUNsb3NlRXZlbnRDb2Rlcy5Vbmtub3duT3Bjb2RlOlxuICAgICAgY2FzZSBEaXNjb3JkR2F0ZXdheUNsb3NlRXZlbnRDb2Rlcy5EZWNvZGVFcnJvcjpcbiAgICAgIGNhc2UgRGlzY29yZEdhdGV3YXlDbG9zZUV2ZW50Q29kZXMuQXV0aGVudGljYXRpb25GYWlsZWQ6XG4gICAgICBjYXNlIERpc2NvcmRHYXRld2F5Q2xvc2VFdmVudENvZGVzLkFscmVhZHlBdXRoZW50aWNhdGVkOlxuICAgICAgY2FzZSBEaXNjb3JkR2F0ZXdheUNsb3NlRXZlbnRDb2Rlcy5JbnZhbGlkU2hhcmQ6XG4gICAgICBjYXNlIERpc2NvcmRHYXRld2F5Q2xvc2VFdmVudENvZGVzLlNoYXJkaW5nUmVxdWlyZWQ6XG4gICAgICBjYXNlIERpc2NvcmRHYXRld2F5Q2xvc2VFdmVudENvZGVzLkludmFsaWRBcGlWZXJzaW9uOlxuICAgICAgY2FzZSBEaXNjb3JkR2F0ZXdheUNsb3NlRXZlbnRDb2Rlcy5JbnZhbGlkSW50ZW50czpcbiAgICAgIGNhc2UgRGlzY29yZEdhdGV3YXlDbG9zZUV2ZW50Q29kZXMuRGlzYWxsb3dlZEludGVudHM6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBldmVudC5yZWFzb24gfHwgXCJEaXNjb3JkIGdhdmUgbm8gcmVhc29uISBHRyEgWW91IGJyb2tlIERpc2NvcmQhXCIsXG4gICAgICAgICk7XG4gICAgICAvLyBUSEVTRSBFUlJPUlMgQ0FOIE5PIEJFIFJFU1VNRUQhIFRIRVkgTVVTVCBSRS1JREVOVElGWSFcbiAgICAgIGNhc2UgRGlzY29yZEdhdGV3YXlDbG9zZUV2ZW50Q29kZXMuTm90QXV0aGVudGljYXRlZDpcbiAgICAgIGNhc2UgRGlzY29yZEdhdGV3YXlDbG9zZUV2ZW50Q29kZXMuSW52YWxpZFNlcTpcbiAgICAgIGNhc2UgRGlzY29yZEdhdGV3YXlDbG9zZUV2ZW50Q29kZXMuUmF0ZUxpbWl0ZWQ6XG4gICAgICBjYXNlIERpc2NvcmRHYXRld2F5Q2xvc2VFdmVudENvZGVzLlNlc3Npb25UaW1lZE91dDpcbiAgICAgICAgaWRlbnRpZnkoc2hhcmRJZCwgd3MubWF4U2hhcmRzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXN1bWUoc2hhcmRJZCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gc29ja2V0O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLDZCQUE2QixTQUFRLDJDQUE2QztTQUNsRixRQUFRLFNBQVEsYUFBZTtTQUMvQixNQUFNLFNBQVEsV0FBYTtTQUMzQixFQUFFLFNBQVEsT0FBUztBQUU1QixFQUFpQyxBQUFqQywrQkFBaUM7c0JBQ1gsV0FBVyxDQUFDLE9BQWU7VUFDekMsTUFBTSxPQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLEdBQUc7SUFDbEQsTUFBTSxDQUFDLFVBQVUsSUFBRyxXQUFhO0lBRWpDLE1BQU0sQ0FBQyxPQUFPLElBQUksVUFBVTtRQUMxQixFQUFFLENBQUMsR0FBRyxFQUFDLEtBQU87WUFBSSxPQUFPO1lBQUUsS0FBSyxFQUFFLFVBQVU7OztJQUc5QyxNQUFNLENBQUMsU0FBUyxNQUFNLElBQUksRUFBRSxPQUFPLE1BQ2pDLEVBQUUsQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLE9BQU87O0lBRXJDLE1BQU0sQ0FBQyxPQUFPLElBQUksS0FBSztRQUNyQixFQUFFLENBQUMsR0FBRyxFQUFDLE1BQVE7WUFBSSxPQUFPO1lBQUUsT0FBTyxFQUFFLEtBQUs7O1lBR3hDLEtBQUssQ0FBQyxJQUFJLEtBQUssSUFBSSxJQUNuQixLQUFLLENBQUMsTUFBTSxNQUFLLDJDQUE2Qzs7O1lBTTlELEtBQUssQ0FBQyxJQUFJLEtBQUssSUFBSTthQUNsQixVQUFZO2FBQUUsc0NBQXdDO1VBQUUsUUFBUSxDQUMvRCxLQUFLLENBQUMsTUFBTTttQkFHUCxFQUFFLENBQUMsR0FBRyxFQUFDLGdCQUFrQjtnQkFBSSxPQUFPO2dCQUFFLE9BQU8sRUFBRSxLQUFLOzs7ZUFHckQsS0FBSyxDQUFDLElBQUk7WUFDaEIsRUFBNEIsQUFBNUIsMEJBQTRCO2lCQUN2QixJQUFJOztpQkFFSixJQUFJO2lCQUNKLElBQUk7aUJBQ0osSUFBSTtpQkFDSixJQUFJO2dCQUNQLEVBQThCLEFBQTlCLDRCQUE4Qjt1QkFDdkIsRUFBRSxDQUFDLEdBQUcsRUFBQyxnQkFBa0I7b0JBQUksT0FBTztvQkFBRSxPQUFPLEVBQUUsS0FBSzs7aUJBQ3hELDZCQUE2QixDQUFDLGFBQWE7aUJBQzNDLDZCQUE2QixDQUFDLFdBQVc7aUJBQ3pDLDZCQUE2QixDQUFDLG9CQUFvQjtpQkFDbEQsNkJBQTZCLENBQUMsb0JBQW9CO2lCQUNsRCw2QkFBNkIsQ0FBQyxZQUFZO2lCQUMxQyw2QkFBNkIsQ0FBQyxnQkFBZ0I7aUJBQzlDLDZCQUE2QixDQUFDLGlCQUFpQjtpQkFDL0MsNkJBQTZCLENBQUMsY0FBYztpQkFDNUMsNkJBQTZCLENBQUMsaUJBQWlCOzBCQUN4QyxLQUFLLENBQ2IsS0FBSyxDQUFDLE1BQU0sS0FBSSw4Q0FBZ0Q7WUFFcEUsRUFBeUQsQUFBekQsdURBQXlEO2lCQUNwRCw2QkFBNkIsQ0FBQyxnQkFBZ0I7aUJBQzlDLDZCQUE2QixDQUFDLFVBQVU7aUJBQ3hDLDZCQUE2QixDQUFDLFdBQVc7aUJBQ3pDLDZCQUE2QixDQUFDLGVBQWU7Z0JBQ2hELFFBQVEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLFNBQVM7OztnQkFHOUIsTUFBTSxDQUFDLE9BQU87Ozs7V0FLYixNQUFNIn0=
