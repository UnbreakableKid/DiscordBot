import { eventHandlers } from "../../bot.ts";
import { DiscordGatewayOpcodes } from "../../types/codes/gateway_opcodes.ts";
import { ws } from "../../ws/ws.ts";
export function editBotStatus(data) {
    ws.shards.forEach((shard)=>{
        eventHandlers.debug?.("loop", `Running forEach loop in editBotStatus function.`);
        ws.sendShardMessage(shard, {
            op: DiscordGatewayOpcodes.StatusUpdate,
            d: {
                since: null,
                afk: false,
                ...data
            }
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvbWlzYy9lZGl0X2JvdF9zdGF0dXMudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV2ZW50SGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vYm90LnRzXCI7XG5pbXBvcnQgeyBEaXNjb3JkR2F0ZXdheU9wY29kZXMgfSBmcm9tIFwiLi4vLi4vdHlwZXMvY29kZXMvZ2F0ZXdheV9vcGNvZGVzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFN0YXR1c1VwZGF0ZSB9IGZyb20gXCIuLi8uLi90eXBlcy9nYXRld2F5L3N0YXR1c191cGRhdGUudHNcIjtcbmltcG9ydCB7IHdzIH0gZnJvbSBcIi4uLy4uL3dzL3dzLnRzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBlZGl0Qm90U3RhdHVzKGRhdGE6IE9taXQ8U3RhdHVzVXBkYXRlLCBcImFma1wiIHwgXCJzaW5jZVwiPikge1xuICB3cy5zaGFyZHMuZm9yRWFjaCgoc2hhcmQpID0+IHtcbiAgICBldmVudEhhbmRsZXJzLmRlYnVnPy4oXG4gICAgICBcImxvb3BcIixcbiAgICAgIGBSdW5uaW5nIGZvckVhY2ggbG9vcCBpbiBlZGl0Qm90U3RhdHVzIGZ1bmN0aW9uLmAsXG4gICAgKTtcblxuICAgIHdzLnNlbmRTaGFyZE1lc3NhZ2Uoc2hhcmQsIHtcbiAgICAgIG9wOiBEaXNjb3JkR2F0ZXdheU9wY29kZXMuU3RhdHVzVXBkYXRlLFxuICAgICAgZDoge1xuICAgICAgICBzaW5jZTogbnVsbCxcbiAgICAgICAgYWZrOiBmYWxzZSxcbiAgICAgICAgLi4uZGF0YSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0pO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLGFBQWEsU0FBUSxZQUFjO1NBQ25DLHFCQUFxQixTQUFRLG9DQUFzQztTQUVuRSxFQUFFLFNBQVEsY0FBZ0I7Z0JBRW5CLGFBQWEsQ0FBQyxJQUF5QztJQUNyRSxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxLQUFLO1FBQ3RCLGFBQWEsQ0FBQyxLQUFLLElBQ2pCLElBQU0sSUFDTCwrQ0FBK0M7UUFHbEQsRUFBRSxDQUFDLGdCQUFnQixDQUFDLEtBQUs7WUFDdkIsRUFBRSxFQUFFLHFCQUFxQixDQUFDLFlBQVk7WUFDdEMsQ0FBQztnQkFDQyxLQUFLLEVBQUUsSUFBSTtnQkFDWCxHQUFHLEVBQUUsS0FBSzttQkFDUCxJQUFJIn0=