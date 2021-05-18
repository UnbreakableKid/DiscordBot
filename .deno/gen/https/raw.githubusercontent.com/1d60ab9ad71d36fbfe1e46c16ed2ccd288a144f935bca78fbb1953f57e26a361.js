import { getGatewayBot } from "../helpers/misc/get_gateway_bot.ts";
import { ws } from "./ws.ts";
/** The handler to automatically reshard when necessary. */ export async function resharder() {
    ws.botGatewayData = await getGatewayBot();
    const percentage = (ws.botGatewayData.shards - ws.maxShards) / ws.maxShards * 100;
    // Less than necessary% being used so do nothing
    if (percentage < ws.reshardPercentage) return;
    // Don't have enough identify rate limits to reshard
    if (ws.botGatewayData.sessionStartLimit.remaining < ws.botGatewayData.shards) {
        return;
    }
    // Begin resharding
    ws.maxShards = ws.botGatewayData.shards;
    // If more than 100K servers, begin switching to 16x sharding
    if (ws.maxShards && ws.useOptimalLargeBotSharding) {
        ws.maxShards = Math.ceil(ws.maxShards / (ws.botGatewayData.sessionStartLimit.maxConcurrency === 1 ? 16 : ws.botGatewayData.sessionStartLimit.maxConcurrency));
    }
    ws.spawnShards(ws.firstShardId);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3dzL3Jlc2hhcmRlci50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZ2V0R2F0ZXdheUJvdCB9IGZyb20gXCIuLi9oZWxwZXJzL21pc2MvZ2V0X2dhdGV3YXlfYm90LnRzXCI7XG5pbXBvcnQgeyB3cyB9IGZyb20gXCIuL3dzLnRzXCI7XG5cbi8qKiBUaGUgaGFuZGxlciB0byBhdXRvbWF0aWNhbGx5IHJlc2hhcmQgd2hlbiBuZWNlc3NhcnkuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzaGFyZGVyKCkge1xuICB3cy5ib3RHYXRld2F5RGF0YSA9IGF3YWl0IGdldEdhdGV3YXlCb3QoKTtcblxuICBjb25zdCBwZXJjZW50YWdlID1cbiAgICAoKHdzLmJvdEdhdGV3YXlEYXRhLnNoYXJkcyAtIHdzLm1heFNoYXJkcykgLyB3cy5tYXhTaGFyZHMpICogMTAwO1xuICAvLyBMZXNzIHRoYW4gbmVjZXNzYXJ5JSBiZWluZyB1c2VkIHNvIGRvIG5vdGhpbmdcbiAgaWYgKHBlcmNlbnRhZ2UgPCB3cy5yZXNoYXJkUGVyY2VudGFnZSkgcmV0dXJuO1xuXG4gIC8vIERvbid0IGhhdmUgZW5vdWdoIGlkZW50aWZ5IHJhdGUgbGltaXRzIHRvIHJlc2hhcmRcbiAgaWYgKFxuICAgIHdzLmJvdEdhdGV3YXlEYXRhLnNlc3Npb25TdGFydExpbWl0LnJlbWFpbmluZyA8IHdzLmJvdEdhdGV3YXlEYXRhLnNoYXJkc1xuICApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBCZWdpbiByZXNoYXJkaW5nXG4gIHdzLm1heFNoYXJkcyA9IHdzLmJvdEdhdGV3YXlEYXRhLnNoYXJkcztcbiAgLy8gSWYgbW9yZSB0aGFuIDEwMEsgc2VydmVycywgYmVnaW4gc3dpdGNoaW5nIHRvIDE2eCBzaGFyZGluZ1xuICBpZiAod3MubWF4U2hhcmRzICYmIHdzLnVzZU9wdGltYWxMYXJnZUJvdFNoYXJkaW5nKSB7XG4gICAgd3MubWF4U2hhcmRzID0gTWF0aC5jZWlsKFxuICAgICAgd3MubWF4U2hhcmRzIC9cbiAgICAgICAgKHdzLmJvdEdhdGV3YXlEYXRhLnNlc3Npb25TdGFydExpbWl0Lm1heENvbmN1cnJlbmN5ID09PSAxXG4gICAgICAgICAgPyAxNlxuICAgICAgICAgIDogd3MuYm90R2F0ZXdheURhdGEuc2Vzc2lvblN0YXJ0TGltaXQubWF4Q29uY3VycmVuY3kpLFxuICAgICk7XG4gIH1cblxuICB3cy5zcGF3blNoYXJkcyh3cy5maXJzdFNoYXJkSWQpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLGFBQWEsU0FBUSxrQ0FBb0M7U0FDekQsRUFBRSxTQUFRLE9BQVM7QUFFNUIsRUFBMkQsQUFBM0QsdURBQTJELEFBQTNELEVBQTJELHVCQUNyQyxTQUFTO0lBQzdCLEVBQUUsQ0FBQyxjQUFjLFNBQVMsYUFBYTtVQUVqQyxVQUFVLElBQ1osRUFBRSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUMsU0FBUyxHQUFJLEdBQUc7SUFDbEUsRUFBZ0QsQUFBaEQsOENBQWdEO1FBQzVDLFVBQVUsR0FBRyxFQUFFLENBQUMsaUJBQWlCO0lBRXJDLEVBQW9ELEFBQXBELGtEQUFvRDtRQUVsRCxFQUFFLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsY0FBYyxDQUFDLE1BQU07OztJQUsxRSxFQUFtQixBQUFuQixpQkFBbUI7SUFDbkIsRUFBRSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsY0FBYyxDQUFDLE1BQU07SUFDdkMsRUFBNkQsQUFBN0QsMkRBQTZEO1FBQ3pELEVBQUUsQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDLDBCQUEwQjtRQUMvQyxFQUFFLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQ3RCLEVBQUUsQ0FBQyxTQUFTLElBQ1QsRUFBRSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLEtBQUssQ0FBQyxHQUNyRCxFQUFFLEdBQ0YsRUFBRSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjOztJQUk1RCxFQUFFLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxZQUFZIn0=