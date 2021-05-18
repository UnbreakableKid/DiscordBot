import { eventHandlers } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { snowflakeToBigint } from "../../util/bigint.ts";
export async function handleGuildMemberRemove(data) {
    const payload = data.d;
    const guild = await cacheHandlers.get("guilds", snowflakeToBigint(payload.guildId));
    if (!guild) return;
    guild.memberCount--;
    const member = await cacheHandlers.get("members", snowflakeToBigint(payload.user.id));
    eventHandlers.guildMemberRemove?.(guild, payload.user, member);
    member?.guilds.delete(guild.id);
    if (member && !member.guilds.size) {
        await cacheHandlers.delete("members", member.id);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hhbmRsZXJzL21lbWJlcnMvR1VJTERfTUVNQkVSX1JFTU9WRS50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXZlbnRIYW5kbGVycyB9IGZyb20gXCIuLi8uLi9ib3QudHNcIjtcbmltcG9ydCB7IGNhY2hlSGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vY2FjaGUudHNcIjtcbmltcG9ydCB0eXBlIHsgRGlzY29yZEdhdGV3YXlQYXlsb2FkIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2dhdGV3YXkvZ2F0ZXdheV9wYXlsb2FkLnRzXCI7XG5pbXBvcnQgdHlwZSB7IEd1aWxkTWVtYmVyUmVtb3ZlIH0gZnJvbSBcIi4uLy4uL3R5cGVzL21lbWJlcnMvZ3VpbGRfbWVtYmVyX3JlbW92ZS50c1wiO1xuaW1wb3J0IHsgc25vd2ZsYWtlVG9CaWdpbnQgfSBmcm9tIFwiLi4vLi4vdXRpbC9iaWdpbnQudHNcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZUd1aWxkTWVtYmVyUmVtb3ZlKGRhdGE6IERpc2NvcmRHYXRld2F5UGF5bG9hZCkge1xuICBjb25zdCBwYXlsb2FkID0gZGF0YS5kIGFzIEd1aWxkTWVtYmVyUmVtb3ZlO1xuICBjb25zdCBndWlsZCA9IGF3YWl0IGNhY2hlSGFuZGxlcnMuZ2V0KFxuICAgIFwiZ3VpbGRzXCIsXG4gICAgc25vd2ZsYWtlVG9CaWdpbnQocGF5bG9hZC5ndWlsZElkKSxcbiAgKTtcbiAgaWYgKCFndWlsZCkgcmV0dXJuO1xuXG4gIGd1aWxkLm1lbWJlckNvdW50LS07XG4gIGNvbnN0IG1lbWJlciA9IGF3YWl0IGNhY2hlSGFuZGxlcnMuZ2V0KFxuICAgIFwibWVtYmVyc1wiLFxuICAgIHNub3dmbGFrZVRvQmlnaW50KHBheWxvYWQudXNlci5pZCksXG4gICk7XG4gIGV2ZW50SGFuZGxlcnMuZ3VpbGRNZW1iZXJSZW1vdmU/LihndWlsZCwgcGF5bG9hZC51c2VyLCBtZW1iZXIpO1xuXG4gIG1lbWJlcj8uZ3VpbGRzLmRlbGV0ZShndWlsZC5pZCk7XG4gIGlmIChtZW1iZXIgJiYgIW1lbWJlci5ndWlsZHMuc2l6ZSkge1xuICAgIGF3YWl0IGNhY2hlSGFuZGxlcnMuZGVsZXRlKFwibWVtYmVyc1wiLCBtZW1iZXIuaWQpO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsYUFBYSxTQUFRLFlBQWM7U0FDbkMsYUFBYSxTQUFRLGNBQWdCO1NBR3JDLGlCQUFpQixTQUFRLG9CQUFzQjtzQkFFbEMsdUJBQXVCLENBQUMsSUFBMkI7VUFDakUsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDO1VBQ2hCLEtBQUssU0FBUyxhQUFhLENBQUMsR0FBRyxFQUNuQyxNQUFRLEdBQ1IsaUJBQWlCLENBQUMsT0FBTyxDQUFDLE9BQU87U0FFOUIsS0FBSztJQUVWLEtBQUssQ0FBQyxXQUFXO1VBQ1gsTUFBTSxTQUFTLGFBQWEsQ0FBQyxHQUFHLEVBQ3BDLE9BQVMsR0FDVCxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7SUFFbkMsYUFBYSxDQUFDLGlCQUFpQixHQUFHLEtBQUssRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU07SUFFN0QsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDMUIsTUFBTSxLQUFLLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSTtjQUN6QixhQUFhLENBQUMsTUFBTSxFQUFDLE9BQVMsR0FBRSxNQUFNLENBQUMsRUFBRSJ9