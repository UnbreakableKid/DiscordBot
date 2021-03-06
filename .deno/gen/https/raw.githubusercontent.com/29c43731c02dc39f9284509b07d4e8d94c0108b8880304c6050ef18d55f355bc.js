import { DiscordGatewayOpcodes } from "../types/codes/gateway_opcodes.ts";
import { delay } from "../util/utils.ts";
import { identify } from "./identify.ts";
import { ws } from "./ws.ts";
export async function heartbeat(shardId, interval) {
  ws.log("HEARTBEATING_STARTED", {
    shardId,
    interval,
  });
  const shard = ws.shards.get(shardId);
  if (!shard) return;
  ws.log("HEARTBEATING_DETAILS", {
    shardId,
    interval,
    shard,
  });
  // The first heartbeat is special so we send it without setInterval: https://discord.com/developers/docs/topics/gateway#heartbeating
  await delay(Math.floor(shard.heartbeat.interval * Math.random()));
  if (shard.ws.readyState !== WebSocket.OPEN) return;
  shard.ws.send(JSON.stringify({
    op: DiscordGatewayOpcodes.Heartbeat,
    d: shard.previousSequenceNumber,
  }));
  shard.heartbeat.keepAlive = true;
  shard.heartbeat.acknowledged = false;
  shard.heartbeat.lastSentAt = Date.now();
  shard.heartbeat.interval = interval;
  shard.heartbeat.intervalId = setInterval(() => {
    ws.log("DEBUG", `Running setInterval in heartbeat file.`);
    const currentShard = ws.shards.get(shardId);
    if (!currentShard) return;
    ws.log("HEARTBEATING", {
      shardId,
      shard: currentShard,
    });
    if (
      currentShard.ws.readyState === WebSocket.CLOSED ||
      !currentShard.heartbeat.keepAlive
    ) {
      ws.log("HEARTBEATING_CLOSED", {
        shardId,
        shard: currentShard,
      });
      // STOP THE HEARTBEAT
      return clearInterval(shard.heartbeat.intervalId);
    }
    if (!currentShard.heartbeat.acknowledged) {
      ws.closeWS(currentShard.ws, 3066, "Did not receive an ACK in time.");
      return identify(shardId, ws.maxShards);
    }
    if (currentShard.ws.readyState !== WebSocket.OPEN) return;
    currentShard.heartbeat.acknowledged = false;
    currentShard.ws.send(JSON.stringify({
      op: DiscordGatewayOpcodes.Heartbeat,
      d: currentShard.previousSequenceNumber,
    }));
  }, shard.heartbeat.interval);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3dzL2hlYXJ0YmVhdC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGlzY29yZEdhdGV3YXlPcGNvZGVzIH0gZnJvbSBcIi4uL3R5cGVzL2NvZGVzL2dhdGV3YXlfb3Bjb2Rlcy50c1wiO1xuaW1wb3J0IHsgZGVsYXkgfSBmcm9tIFwiLi4vdXRpbC91dGlscy50c1wiO1xuaW1wb3J0IHsgaWRlbnRpZnkgfSBmcm9tIFwiLi9pZGVudGlmeS50c1wiO1xuaW1wb3J0IHsgd3MgfSBmcm9tIFwiLi93cy50c1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGVhcnRiZWF0KHNoYXJkSWQ6IG51bWJlciwgaW50ZXJ2YWw6IG51bWJlcikge1xuICB3cy5sb2coXCJIRUFSVEJFQVRJTkdfU1RBUlRFRFwiLCB7IHNoYXJkSWQsIGludGVydmFsIH0pO1xuXG4gIGNvbnN0IHNoYXJkID0gd3Muc2hhcmRzLmdldChzaGFyZElkKTtcbiAgaWYgKCFzaGFyZCkgcmV0dXJuO1xuXG4gIHdzLmxvZyhcIkhFQVJUQkVBVElOR19ERVRBSUxTXCIsIHsgc2hhcmRJZCwgaW50ZXJ2YWwsIHNoYXJkIH0pO1xuXG4gIC8vIFRoZSBmaXJzdCBoZWFydGJlYXQgaXMgc3BlY2lhbCBzbyB3ZSBzZW5kIGl0IHdpdGhvdXQgc2V0SW50ZXJ2YWw6IGh0dHBzOi8vZGlzY29yZC5jb20vZGV2ZWxvcGVycy9kb2NzL3RvcGljcy9nYXRld2F5I2hlYXJ0YmVhdGluZ1xuICBhd2FpdCBkZWxheShNYXRoLmZsb29yKHNoYXJkLmhlYXJ0YmVhdC5pbnRlcnZhbCAqIE1hdGgucmFuZG9tKCkpKTtcblxuICBpZiAoc2hhcmQud3MucmVhZHlTdGF0ZSAhPT0gV2ViU29ja2V0Lk9QRU4pIHJldHVybjtcblxuICBzaGFyZC53cy5zZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICBvcDogRGlzY29yZEdhdGV3YXlPcGNvZGVzLkhlYXJ0YmVhdCxcbiAgICBkOiBzaGFyZC5wcmV2aW91c1NlcXVlbmNlTnVtYmVyLFxuICB9KSk7XG5cbiAgc2hhcmQuaGVhcnRiZWF0LmtlZXBBbGl2ZSA9IHRydWU7XG4gIHNoYXJkLmhlYXJ0YmVhdC5hY2tub3dsZWRnZWQgPSBmYWxzZTtcbiAgc2hhcmQuaGVhcnRiZWF0Lmxhc3RTZW50QXQgPSBEYXRlLm5vdygpO1xuICBzaGFyZC5oZWFydGJlYXQuaW50ZXJ2YWwgPSBpbnRlcnZhbDtcblxuICBzaGFyZC5oZWFydGJlYXQuaW50ZXJ2YWxJZCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICB3cy5sb2coXCJERUJVR1wiLCBgUnVubmluZyBzZXRJbnRlcnZhbCBpbiBoZWFydGJlYXQgZmlsZS5gKTtcbiAgICBjb25zdCBjdXJyZW50U2hhcmQgPSB3cy5zaGFyZHMuZ2V0KHNoYXJkSWQpO1xuICAgIGlmICghY3VycmVudFNoYXJkKSByZXR1cm47XG5cbiAgICB3cy5sb2coXCJIRUFSVEJFQVRJTkdcIiwgeyBzaGFyZElkLCBzaGFyZDogY3VycmVudFNoYXJkIH0pO1xuXG4gICAgaWYgKFxuICAgICAgY3VycmVudFNoYXJkLndzLnJlYWR5U3RhdGUgPT09IFdlYlNvY2tldC5DTE9TRUQgfHxcbiAgICAgICFjdXJyZW50U2hhcmQuaGVhcnRiZWF0LmtlZXBBbGl2ZVxuICAgICkge1xuICAgICAgd3MubG9nKFwiSEVBUlRCRUFUSU5HX0NMT1NFRFwiLCB7IHNoYXJkSWQsIHNoYXJkOiBjdXJyZW50U2hhcmQgfSk7XG5cbiAgICAgIC8vIFNUT1AgVEhFIEhFQVJUQkVBVFxuICAgICAgcmV0dXJuIGNsZWFySW50ZXJ2YWwoc2hhcmQuaGVhcnRiZWF0LmludGVydmFsSWQpO1xuICAgIH1cblxuICAgIGlmICghY3VycmVudFNoYXJkLmhlYXJ0YmVhdC5hY2tub3dsZWRnZWQpIHtcbiAgICAgIHdzLmNsb3NlV1MoY3VycmVudFNoYXJkLndzLCAzMDY2LCBcIkRpZCBub3QgcmVjZWl2ZSBhbiBBQ0sgaW4gdGltZS5cIik7XG4gICAgICByZXR1cm4gaWRlbnRpZnkoc2hhcmRJZCwgd3MubWF4U2hhcmRzKTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNoYXJkLndzLnJlYWR5U3RhdGUgIT09IFdlYlNvY2tldC5PUEVOKSByZXR1cm47XG5cbiAgICBjdXJyZW50U2hhcmQuaGVhcnRiZWF0LmFja25vd2xlZGdlZCA9IGZhbHNlO1xuXG4gICAgY3VycmVudFNoYXJkLndzLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgb3A6IERpc2NvcmRHYXRld2F5T3Bjb2Rlcy5IZWFydGJlYXQsXG4gICAgICBkOiBjdXJyZW50U2hhcmQucHJldmlvdXNTZXF1ZW5jZU51bWJlcixcbiAgICB9KSk7XG4gIH0sIHNoYXJkLmhlYXJ0YmVhdC5pbnRlcnZhbCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMscUJBQXFCLFNBQVEsaUNBQW1DO1NBQ2hFLEtBQUssU0FBUSxnQkFBa0I7U0FDL0IsUUFBUSxTQUFRLGFBQWU7U0FDL0IsRUFBRSxTQUFRLE9BQVM7c0JBRU4sU0FBUyxDQUFDLE9BQWUsRUFBRSxRQUFnQjtJQUMvRCxFQUFFLENBQUMsR0FBRyxFQUFDLG9CQUFzQjtRQUFJLE9BQU87UUFBRSxRQUFROztVQUU1QyxLQUFLLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTztTQUM5QixLQUFLO0lBRVYsRUFBRSxDQUFDLEdBQUcsRUFBQyxvQkFBc0I7UUFBSSxPQUFPO1FBQUUsUUFBUTtRQUFFLEtBQUs7O0lBRXpELEVBQW9JLEFBQXBJLGtJQUFvSTtVQUM5SCxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTTtRQUV6RCxLQUFLLENBQUMsRUFBRSxDQUFDLFVBQVUsS0FBSyxTQUFTLENBQUMsSUFBSTtJQUUxQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUztRQUMxQixFQUFFLEVBQUUscUJBQXFCLENBQUMsU0FBUztRQUNuQyxDQUFDLEVBQUUsS0FBSyxDQUFDLHNCQUFzQjs7SUFHakMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsSUFBSTtJQUNoQyxLQUFLLENBQUMsU0FBUyxDQUFDLFlBQVksR0FBRyxLQUFLO0lBQ3BDLEtBQUssQ0FBQyxTQUFTLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHO0lBQ3JDLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxHQUFHLFFBQVE7SUFFbkMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUcsV0FBVztRQUN0QyxFQUFFLENBQUMsR0FBRyxFQUFDLEtBQU8sSUFBRyxzQ0FBc0M7Y0FDakQsWUFBWSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU87YUFDckMsWUFBWTtRQUVqQixFQUFFLENBQUMsR0FBRyxFQUFDLFlBQWM7WUFBSSxPQUFPO1lBQUUsS0FBSyxFQUFFLFlBQVk7O1lBR25ELFlBQVksQ0FBQyxFQUFFLENBQUMsVUFBVSxLQUFLLFNBQVMsQ0FBQyxNQUFNLEtBQzlDLFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUztZQUVqQyxFQUFFLENBQUMsR0FBRyxFQUFDLG1CQUFxQjtnQkFBSSxPQUFPO2dCQUFFLEtBQUssRUFBRSxZQUFZOztZQUU1RCxFQUFxQixBQUFyQixtQkFBcUI7bUJBQ2QsYUFBYSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsVUFBVTs7YUFHNUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxZQUFZO1lBQ3RDLEVBQUUsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFBRSxJQUFJLEdBQUUsK0JBQWlDO21CQUM1RCxRQUFRLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxTQUFTOztZQUduQyxZQUFZLENBQUMsRUFBRSxDQUFDLFVBQVUsS0FBSyxTQUFTLENBQUMsSUFBSTtRQUVqRCxZQUFZLENBQUMsU0FBUyxDQUFDLFlBQVksR0FBRyxLQUFLO1FBRTNDLFlBQVksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTO1lBQ2pDLEVBQUUsRUFBRSxxQkFBcUIsQ0FBQyxTQUFTO1lBQ25DLENBQUMsRUFBRSxZQUFZLENBQUMsc0JBQXNCOztPQUV2QyxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEifQ==
