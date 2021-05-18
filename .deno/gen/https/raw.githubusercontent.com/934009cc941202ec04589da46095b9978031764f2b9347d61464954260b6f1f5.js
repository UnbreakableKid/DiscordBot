import { eventHandlers } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { structures } from "../../structures/mod.ts";
import { bigintToSnowflake, snowflakeToBigint } from "../../util/bigint.ts";
export async function handleGuildMemberUpdate(data) {
  const payload = data.d;
  const guild = await cacheHandlers.get(
    "guilds",
    snowflakeToBigint(payload.guildId),
  );
  if (!guild) return;
  const cachedMember = await cacheHandlers.get(
    "members",
    snowflakeToBigint(payload.user.id),
  );
  const guildMember = cachedMember?.guilds.get(guild.id);
  const newMemberData = {
    ...payload,
    premiumSince: payload.premiumSince || undefined,
    joinedAt: new Date(guildMember?.joinedAt || Date.now()).toISOString(),
    deaf: guildMember?.deaf || false,
    mute: guildMember?.mute || false,
    roles: payload.roles,
  };
  const discordenoMember = await structures.createDiscordenoMember(
    newMemberData,
    guild.id,
  );
  await cacheHandlers.set("members", discordenoMember.id, discordenoMember);
  if (guildMember) {
    if (guildMember.nick !== payload.nick) {
      eventHandlers.nicknameUpdate?.(
        guild,
        discordenoMember,
        payload.nick,
        guildMember.nick ?? undefined,
      );
    }
    if (payload.pending === false && guildMember.pending === true) {
      eventHandlers.membershipScreeningPassed?.(guild, discordenoMember);
    }
    const roleIds = guildMember.roles || [];
    roleIds.forEach((id) => {
      eventHandlers.debug?.(
        "loop",
        `1. Running forEach loop in GUILD_MEMBER_UPDATE file.`,
      );
      if (!payload.roles.includes(bigintToSnowflake(id))) {
        eventHandlers.roleLost?.(guild, discordenoMember, id);
      }
    });
    payload.roles.forEach((id) => {
      eventHandlers.debug?.(
        "loop",
        `2. Running forEach loop in GUILD_MEMBER_UPDATE file.`,
      );
      if (!roleIds.includes(snowflakeToBigint(id))) {
        eventHandlers.roleGained?.(
          guild,
          discordenoMember,
          snowflakeToBigint(id),
        );
      }
    });
  }
  eventHandlers.guildMemberUpdate?.(guild, discordenoMember, cachedMember);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hhbmRsZXJzL21lbWJlcnMvR1VJTERfTUVNQkVSX1VQREFURS50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXZlbnRIYW5kbGVycyB9IGZyb20gXCIuLi8uLi9ib3QudHNcIjtcbmltcG9ydCB7IGNhY2hlSGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vY2FjaGUudHNcIjtcbmltcG9ydCB7IHN0cnVjdHVyZXMgfSBmcm9tIFwiLi4vLi4vc3RydWN0dXJlcy9tb2QudHNcIjtcbmltcG9ydCB0eXBlIHsgRGlzY29yZEdhdGV3YXlQYXlsb2FkIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2dhdGV3YXkvZ2F0ZXdheV9wYXlsb2FkLnRzXCI7XG5pbXBvcnQgdHlwZSB7IEd1aWxkTWVtYmVyVXBkYXRlIH0gZnJvbSBcIi4uLy4uL3R5cGVzL21lbWJlcnMvZ3VpbGRfbWVtYmVyX3VwZGF0ZS50c1wiO1xuaW1wb3J0IHsgYmlnaW50VG9Tbm93Zmxha2UsIHNub3dmbGFrZVRvQmlnaW50IH0gZnJvbSBcIi4uLy4uL3V0aWwvYmlnaW50LnRzXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVHdWlsZE1lbWJlclVwZGF0ZShkYXRhOiBEaXNjb3JkR2F0ZXdheVBheWxvYWQpIHtcbiAgY29uc3QgcGF5bG9hZCA9IGRhdGEuZCBhcyBHdWlsZE1lbWJlclVwZGF0ZTtcbiAgY29uc3QgZ3VpbGQgPSBhd2FpdCBjYWNoZUhhbmRsZXJzLmdldChcbiAgICBcImd1aWxkc1wiLFxuICAgIHNub3dmbGFrZVRvQmlnaW50KHBheWxvYWQuZ3VpbGRJZCksXG4gICk7XG4gIGlmICghZ3VpbGQpIHJldHVybjtcblxuICBjb25zdCBjYWNoZWRNZW1iZXIgPSBhd2FpdCBjYWNoZUhhbmRsZXJzLmdldChcbiAgICBcIm1lbWJlcnNcIixcbiAgICBzbm93Zmxha2VUb0JpZ2ludChwYXlsb2FkLnVzZXIuaWQpLFxuICApO1xuICBjb25zdCBndWlsZE1lbWJlciA9IGNhY2hlZE1lbWJlcj8uZ3VpbGRzLmdldChndWlsZC5pZCk7XG5cbiAgY29uc3QgbmV3TWVtYmVyRGF0YSA9IHtcbiAgICAuLi5wYXlsb2FkLFxuICAgIHByZW1pdW1TaW5jZTogcGF5bG9hZC5wcmVtaXVtU2luY2UgfHwgdW5kZWZpbmVkLFxuICAgIGpvaW5lZEF0OiBuZXcgRGF0ZShndWlsZE1lbWJlcj8uam9pbmVkQXQgfHwgRGF0ZS5ub3coKSlcbiAgICAgIC50b0lTT1N0cmluZygpLFxuICAgIGRlYWY6IGd1aWxkTWVtYmVyPy5kZWFmIHx8IGZhbHNlLFxuICAgIG11dGU6IGd1aWxkTWVtYmVyPy5tdXRlIHx8IGZhbHNlLFxuICAgIHJvbGVzOiBwYXlsb2FkLnJvbGVzLFxuICB9O1xuICBjb25zdCBkaXNjb3JkZW5vTWVtYmVyID0gYXdhaXQgc3RydWN0dXJlcy5jcmVhdGVEaXNjb3JkZW5vTWVtYmVyKFxuICAgIG5ld01lbWJlckRhdGEsXG4gICAgZ3VpbGQuaWQsXG4gICk7XG4gIGF3YWl0IGNhY2hlSGFuZGxlcnMuc2V0KFwibWVtYmVyc1wiLCBkaXNjb3JkZW5vTWVtYmVyLmlkLCBkaXNjb3JkZW5vTWVtYmVyKTtcblxuICBpZiAoZ3VpbGRNZW1iZXIpIHtcbiAgICBpZiAoZ3VpbGRNZW1iZXIubmljayAhPT0gcGF5bG9hZC5uaWNrKSB7XG4gICAgICBldmVudEhhbmRsZXJzLm5pY2tuYW1lVXBkYXRlPy4oXG4gICAgICAgIGd1aWxkLFxuICAgICAgICBkaXNjb3JkZW5vTWVtYmVyLFxuICAgICAgICBwYXlsb2FkLm5pY2shLFxuICAgICAgICBndWlsZE1lbWJlci5uaWNrID8/IHVuZGVmaW5lZCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHBheWxvYWQucGVuZGluZyA9PT0gZmFsc2UgJiYgZ3VpbGRNZW1iZXIucGVuZGluZyA9PT0gdHJ1ZSkge1xuICAgICAgZXZlbnRIYW5kbGVycy5tZW1iZXJzaGlwU2NyZWVuaW5nUGFzc2VkPy4oZ3VpbGQsIGRpc2NvcmRlbm9NZW1iZXIpO1xuICAgIH1cblxuICAgIGNvbnN0IHJvbGVJZHMgPSBndWlsZE1lbWJlci5yb2xlcyB8fCBbXTtcblxuICAgIHJvbGVJZHMuZm9yRWFjaCgoaWQpID0+IHtcbiAgICAgIGV2ZW50SGFuZGxlcnMuZGVidWc/LihcbiAgICAgICAgXCJsb29wXCIsXG4gICAgICAgIGAxLiBSdW5uaW5nIGZvckVhY2ggbG9vcCBpbiBHVUlMRF9NRU1CRVJfVVBEQVRFIGZpbGUuYCxcbiAgICAgICk7XG4gICAgICBpZiAoIXBheWxvYWQucm9sZXMuaW5jbHVkZXMoYmlnaW50VG9Tbm93Zmxha2UoaWQpKSkge1xuICAgICAgICBldmVudEhhbmRsZXJzLnJvbGVMb3N0Py4oZ3VpbGQsIGRpc2NvcmRlbm9NZW1iZXIsIGlkKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHBheWxvYWQucm9sZXMuZm9yRWFjaCgoaWQpID0+IHtcbiAgICAgIGV2ZW50SGFuZGxlcnMuZGVidWc/LihcbiAgICAgICAgXCJsb29wXCIsXG4gICAgICAgIGAyLiBSdW5uaW5nIGZvckVhY2ggbG9vcCBpbiBHVUlMRF9NRU1CRVJfVVBEQVRFIGZpbGUuYCxcbiAgICAgICk7XG4gICAgICBpZiAoIXJvbGVJZHMuaW5jbHVkZXMoc25vd2ZsYWtlVG9CaWdpbnQoaWQpKSkge1xuICAgICAgICBldmVudEhhbmRsZXJzLnJvbGVHYWluZWQ/LihcbiAgICAgICAgICBndWlsZCxcbiAgICAgICAgICBkaXNjb3JkZW5vTWVtYmVyLFxuICAgICAgICAgIHNub3dmbGFrZVRvQmlnaW50KGlkKSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGV2ZW50SGFuZGxlcnMuZ3VpbGRNZW1iZXJVcGRhdGU/LihndWlsZCwgZGlzY29yZGVub01lbWJlciwgY2FjaGVkTWVtYmVyKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxhQUFhLFNBQVEsWUFBYztTQUNuQyxhQUFhLFNBQVEsY0FBZ0I7U0FDckMsVUFBVSxTQUFRLHVCQUF5QjtTQUczQyxpQkFBaUIsRUFBRSxpQkFBaUIsU0FBUSxvQkFBc0I7c0JBRXJELHVCQUF1QixDQUFDLElBQTJCO1VBQ2pFLE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQztVQUNoQixLQUFLLFNBQVMsYUFBYSxDQUFDLEdBQUcsRUFDbkMsTUFBUSxHQUNSLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxPQUFPO1NBRTlCLEtBQUs7VUFFSixZQUFZLFNBQVMsYUFBYSxDQUFDLEdBQUcsRUFDMUMsT0FBUyxHQUNULGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtVQUU3QixXQUFXLEdBQUcsWUFBWSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7VUFFL0MsYUFBYTtXQUNkLE9BQU87UUFDVixZQUFZLEVBQUUsT0FBTyxDQUFDLFlBQVksSUFBSSxTQUFTO1FBQy9DLFFBQVEsTUFBTSxJQUFJLENBQUMsV0FBVyxFQUFFLFFBQVEsSUFBSSxJQUFJLENBQUMsR0FBRyxJQUNqRCxXQUFXO1FBQ2QsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLElBQUksS0FBSztRQUNoQyxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksSUFBSSxLQUFLO1FBQ2hDLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSzs7VUFFaEIsZ0JBQWdCLFNBQVMsVUFBVSxDQUFDLHNCQUFzQixDQUM5RCxhQUFhLEVBQ2IsS0FBSyxDQUFDLEVBQUU7VUFFSixhQUFhLENBQUMsR0FBRyxFQUFDLE9BQVMsR0FBRSxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsZ0JBQWdCO1FBRXBFLFdBQVc7WUFDVCxXQUFXLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQyxJQUFJO1lBQ25DLGFBQWEsQ0FBQyxjQUFjLEdBQzFCLEtBQUssRUFDTCxnQkFBZ0IsRUFDaEIsT0FBTyxDQUFDLElBQUksRUFDWixXQUFXLENBQUMsSUFBSSxJQUFJLFNBQVM7O1lBSTdCLE9BQU8sQ0FBQyxPQUFPLEtBQUssS0FBSyxJQUFJLFdBQVcsQ0FBQyxPQUFPLEtBQUssSUFBSTtZQUMzRCxhQUFhLENBQUMseUJBQXlCLEdBQUcsS0FBSyxFQUFFLGdCQUFnQjs7Y0FHN0QsT0FBTyxHQUFHLFdBQVcsQ0FBQyxLQUFLO1FBRWpDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRTtZQUNqQixhQUFhLENBQUMsS0FBSyxJQUNqQixJQUFNLElBQ0wsb0RBQW9EO2lCQUVsRCxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFO2dCQUM5QyxhQUFhLENBQUMsUUFBUSxHQUFHLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxFQUFFOzs7UUFJeEQsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRTtZQUN2QixhQUFhLENBQUMsS0FBSyxJQUNqQixJQUFNLElBQ0wsb0RBQW9EO2lCQUVsRCxPQUFPLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLEVBQUU7Z0JBQ3hDLGFBQWEsQ0FBQyxVQUFVLEdBQ3RCLEtBQUssRUFDTCxnQkFBZ0IsRUFDaEIsaUJBQWlCLENBQUMsRUFBRTs7OztJQU01QixhQUFhLENBQUMsaUJBQWlCLEdBQUcsS0FBSyxFQUFFLGdCQUFnQixFQUFFLFlBQVkifQ==
