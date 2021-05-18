import { eventHandlers } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { snowflakeToBigint } from "../../util/bigint.ts";
import { ws } from "../../ws/ws.ts";
export async function handleGuildDelete(data, shardId) {
    const payload = data.d;
    const guild = await cacheHandlers.get("guilds", snowflakeToBigint(payload.id));
    if (!guild) return;
    await cacheHandlers.delete("guilds", guild.id);
    if (payload.unavailable) {
        const shard = ws.shards.get(shardId);
        if (shard) shard.unavailableGuildIds.add(guild.id);
        await cacheHandlers.set("unavailableGuilds", guild.id, Date.now());
        eventHandlers.guildUnavailable?.(guild);
    } else {
        eventHandlers.guildDelete?.(guild);
    }
    cacheHandlers.forEach("messages", (message)=>{
        eventHandlers.debug?.("loop", `1. Running forEach messages loop in CHANNEL_DELTE file.`);
        if (message.guildId === guild.id) {
            cacheHandlers.delete("messages", message.id);
        }
    });
    cacheHandlers.forEach("channels", (channel)=>{
        eventHandlers.debug?.("loop", `2. Running forEach channels loop in CHANNEL_DELTE file.`);
        if (channel.guildId === guild.id) {
            cacheHandlers.delete("channels", channel.id);
        }
    });
    cacheHandlers.forEach("members", (member)=>{
        eventHandlers.debug?.("loop", `3. Running forEach members loop in CHANNEL_DELTE file.`);
        if (!member.guilds.has(guild.id)) return;
        member.guilds.delete(guild.id);
        if (!member.guilds.size) {
            return cacheHandlers.delete("members", member.id);
        }
        cacheHandlers.set("members", member.id, member);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hhbmRsZXJzL2d1aWxkcy9HVUlMRF9ERUxFVEUudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV2ZW50SGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vYm90LnRzXCI7XG5pbXBvcnQgeyBjYWNoZUhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgdHlwZSB7IERpc2NvcmRHYXRld2F5UGF5bG9hZCB9IGZyb20gXCIuLi8uLi90eXBlcy9nYXRld2F5L2dhdGV3YXlfcGF5bG9hZC50c1wiO1xuaW1wb3J0IHR5cGUgeyBVbmF2YWlsYWJsZUd1aWxkIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2d1aWxkcy91bmF2YWlsYWJsZV9ndWlsZC50c1wiO1xuaW1wb3J0IHsgc25vd2ZsYWtlVG9CaWdpbnQgfSBmcm9tIFwiLi4vLi4vdXRpbC9iaWdpbnQudHNcIjtcbmltcG9ydCB7IHdzIH0gZnJvbSBcIi4uLy4uL3dzL3dzLnRzXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVHdWlsZERlbGV0ZShcbiAgZGF0YTogRGlzY29yZEdhdGV3YXlQYXlsb2FkLFxuICBzaGFyZElkOiBudW1iZXIsXG4pIHtcbiAgY29uc3QgcGF5bG9hZCA9IGRhdGEuZCBhcyBVbmF2YWlsYWJsZUd1aWxkO1xuXG4gIGNvbnN0IGd1aWxkID0gYXdhaXQgY2FjaGVIYW5kbGVycy5nZXQoXG4gICAgXCJndWlsZHNcIixcbiAgICBzbm93Zmxha2VUb0JpZ2ludChwYXlsb2FkLmlkKSxcbiAgKTtcbiAgaWYgKCFndWlsZCkgcmV0dXJuO1xuXG4gIGF3YWl0IGNhY2hlSGFuZGxlcnMuZGVsZXRlKFwiZ3VpbGRzXCIsIGd1aWxkLmlkKTtcblxuICBpZiAocGF5bG9hZC51bmF2YWlsYWJsZSkge1xuICAgIGNvbnN0IHNoYXJkID0gd3Muc2hhcmRzLmdldChzaGFyZElkKTtcbiAgICBpZiAoc2hhcmQpIHNoYXJkLnVuYXZhaWxhYmxlR3VpbGRJZHMuYWRkKGd1aWxkLmlkKTtcbiAgICBhd2FpdCBjYWNoZUhhbmRsZXJzLnNldChcInVuYXZhaWxhYmxlR3VpbGRzXCIsIGd1aWxkLmlkLCBEYXRlLm5vdygpKTtcblxuICAgIGV2ZW50SGFuZGxlcnMuZ3VpbGRVbmF2YWlsYWJsZT8uKGd1aWxkKTtcbiAgfSBlbHNlIHtcbiAgICBldmVudEhhbmRsZXJzLmd1aWxkRGVsZXRlPy4oZ3VpbGQpO1xuICB9XG5cbiAgY2FjaGVIYW5kbGVycy5mb3JFYWNoKFwibWVzc2FnZXNcIiwgKG1lc3NhZ2UpID0+IHtcbiAgICBldmVudEhhbmRsZXJzLmRlYnVnPy4oXG4gICAgICBcImxvb3BcIixcbiAgICAgIGAxLiBSdW5uaW5nIGZvckVhY2ggbWVzc2FnZXMgbG9vcCBpbiBDSEFOTkVMX0RFTFRFIGZpbGUuYCxcbiAgICApO1xuICAgIGlmIChtZXNzYWdlLmd1aWxkSWQgPT09IGd1aWxkLmlkKSB7XG4gICAgICBjYWNoZUhhbmRsZXJzLmRlbGV0ZShcIm1lc3NhZ2VzXCIsIG1lc3NhZ2UuaWQpO1xuICAgIH1cbiAgfSk7XG5cbiAgY2FjaGVIYW5kbGVycy5mb3JFYWNoKFwiY2hhbm5lbHNcIiwgKGNoYW5uZWwpID0+IHtcbiAgICBldmVudEhhbmRsZXJzLmRlYnVnPy4oXG4gICAgICBcImxvb3BcIixcbiAgICAgIGAyLiBSdW5uaW5nIGZvckVhY2ggY2hhbm5lbHMgbG9vcCBpbiBDSEFOTkVMX0RFTFRFIGZpbGUuYCxcbiAgICApO1xuICAgIGlmIChjaGFubmVsLmd1aWxkSWQgPT09IGd1aWxkLmlkKSB7XG4gICAgICBjYWNoZUhhbmRsZXJzLmRlbGV0ZShcImNoYW5uZWxzXCIsIGNoYW5uZWwuaWQpO1xuICAgIH1cbiAgfSk7XG5cbiAgY2FjaGVIYW5kbGVycy5mb3JFYWNoKFwibWVtYmVyc1wiLCAobWVtYmVyKSA9PiB7XG4gICAgZXZlbnRIYW5kbGVycy5kZWJ1Zz8uKFxuICAgICAgXCJsb29wXCIsXG4gICAgICBgMy4gUnVubmluZyBmb3JFYWNoIG1lbWJlcnMgbG9vcCBpbiBDSEFOTkVMX0RFTFRFIGZpbGUuYCxcbiAgICApO1xuICAgIGlmICghbWVtYmVyLmd1aWxkcy5oYXMoZ3VpbGQuaWQpKSByZXR1cm47XG5cbiAgICBtZW1iZXIuZ3VpbGRzLmRlbGV0ZShndWlsZC5pZCk7XG5cbiAgICBpZiAoIW1lbWJlci5ndWlsZHMuc2l6ZSkge1xuICAgICAgcmV0dXJuIGNhY2hlSGFuZGxlcnMuZGVsZXRlKFwibWVtYmVyc1wiLCBtZW1iZXIuaWQpO1xuICAgIH1cblxuICAgIGNhY2hlSGFuZGxlcnMuc2V0KFwibWVtYmVyc1wiLCBtZW1iZXIuaWQsIG1lbWJlcik7XG4gIH0pO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLGFBQWEsU0FBUSxZQUFjO1NBQ25DLGFBQWEsU0FBUSxjQUFnQjtTQUdyQyxpQkFBaUIsU0FBUSxvQkFBc0I7U0FDL0MsRUFBRSxTQUFRLGNBQWdCO3NCQUViLGlCQUFpQixDQUNyQyxJQUEyQixFQUMzQixPQUFlO1VBRVQsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDO1VBRWhCLEtBQUssU0FBUyxhQUFhLENBQUMsR0FBRyxFQUNuQyxNQUFRLEdBQ1IsaUJBQWlCLENBQUMsT0FBTyxDQUFDLEVBQUU7U0FFekIsS0FBSztVQUVKLGFBQWEsQ0FBQyxNQUFNLEVBQUMsTUFBUSxHQUFFLEtBQUssQ0FBQyxFQUFFO1FBRXpDLE9BQU8sQ0FBQyxXQUFXO2NBQ2YsS0FBSyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU87WUFDL0IsS0FBSyxFQUFFLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7Y0FDM0MsYUFBYSxDQUFDLEdBQUcsRUFBQyxpQkFBbUIsR0FBRSxLQUFLLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxHQUFHO1FBRS9ELGFBQWEsQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLOztRQUV0QyxhQUFhLENBQUMsV0FBVyxHQUFHLEtBQUs7O0lBR25DLGFBQWEsQ0FBQyxPQUFPLEVBQUMsUUFBVSxJQUFHLE9BQU87UUFDeEMsYUFBYSxDQUFDLEtBQUssSUFDakIsSUFBTSxJQUNMLHVEQUF1RDtZQUV0RCxPQUFPLENBQUMsT0FBTyxLQUFLLEtBQUssQ0FBQyxFQUFFO1lBQzlCLGFBQWEsQ0FBQyxNQUFNLEVBQUMsUUFBVSxHQUFFLE9BQU8sQ0FBQyxFQUFFOzs7SUFJL0MsYUFBYSxDQUFDLE9BQU8sRUFBQyxRQUFVLElBQUcsT0FBTztRQUN4QyxhQUFhLENBQUMsS0FBSyxJQUNqQixJQUFNLElBQ0wsdURBQXVEO1lBRXRELE9BQU8sQ0FBQyxPQUFPLEtBQUssS0FBSyxDQUFDLEVBQUU7WUFDOUIsYUFBYSxDQUFDLE1BQU0sRUFBQyxRQUFVLEdBQUUsT0FBTyxDQUFDLEVBQUU7OztJQUkvQyxhQUFhLENBQUMsT0FBTyxFQUFDLE9BQVMsSUFBRyxNQUFNO1FBQ3RDLGFBQWEsQ0FBQyxLQUFLLElBQ2pCLElBQU0sSUFDTCxzREFBc0Q7YUFFcEQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFFL0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUU7YUFFeEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJO21CQUNkLGFBQWEsQ0FBQyxNQUFNLEVBQUMsT0FBUyxHQUFFLE1BQU0sQ0FBQyxFQUFFOztRQUdsRCxhQUFhLENBQUMsR0FBRyxFQUFDLE9BQVMsR0FBRSxNQUFNLENBQUMsRUFBRSxFQUFFLE1BQU0ifQ==