import { cacheHandlers } from "../../cache.ts";
import { rest } from "../../rest/rest.ts";
import { Errors } from "../../types/discordeno/errors.ts";
import { ChannelTypes } from "../../types/mod.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotGuildPermissions } from "../../util/permissions.ts";
/** Delete a channel in your server. Bot needs MANAGE_CHANNEL permissions in the server. */ export async function deleteChannel(
  channelId,
  reason,
) {
  const channel = await cacheHandlers.get("channels", channelId);
  if (channel?.guildId) {
    const guild = await cacheHandlers.get("guilds", channel.guildId);
    if (!guild) throw new Error(Errors.GUILD_NOT_FOUND);
    // TODO(threads): check if this requires guild perms or channel is enough
    await requireBotGuildPermissions(
      guild,
      [
          ChannelTypes.GuildNewsThread,
          ChannelTypes.GuildPivateThread,
          ChannelTypes.GuildPublicThread,
        ].includes(channel.type)
        ? [
          "MANAGE_THREADS",
        ]
        : [
          "MANAGE_CHANNELS",
        ],
    );
    if (guild.rulesChannelId === channelId) {
      throw new Error(Errors.RULES_CHANNEL_CANNOT_BE_DELETED);
    }
    if (guild.publicUpdatesChannelId === channelId) {
      throw new Error(Errors.UPDATES_CHANNEL_CANNOT_BE_DELETED);
    }
  }
  return await rest.runMethod("delete", endpoints.CHANNEL_BASE(channelId), {
    reason,
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvY2hhbm5lbHMvZGVsZXRlX2NoYW5uZWwudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNhY2hlSGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vY2FjaGUudHNcIjtcbmltcG9ydCB7IHJlc3QgfSBmcm9tIFwiLi4vLi4vcmVzdC9yZXN0LnRzXCI7XG5pbXBvcnQgeyBFcnJvcnMgfSBmcm9tIFwiLi4vLi4vdHlwZXMvZGlzY29yZGVuby9lcnJvcnMudHNcIjtcbmltcG9ydCB7IENoYW5uZWxUeXBlcyB9IGZyb20gXCIuLi8uLi90eXBlcy9tb2QudHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHsgcmVxdWlyZUJvdEd1aWxkUGVybWlzc2lvbnMgfSBmcm9tIFwiLi4vLi4vdXRpbC9wZXJtaXNzaW9ucy50c1wiO1xuXG4vKiogRGVsZXRlIGEgY2hhbm5lbCBpbiB5b3VyIHNlcnZlci4gQm90IG5lZWRzIE1BTkFHRV9DSEFOTkVMIHBlcm1pc3Npb25zIGluIHRoZSBzZXJ2ZXIuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVsZXRlQ2hhbm5lbChcbiAgY2hhbm5lbElkOiBiaWdpbnQsXG4gIHJlYXNvbj86IHN0cmluZyxcbikge1xuICBjb25zdCBjaGFubmVsID0gYXdhaXQgY2FjaGVIYW5kbGVycy5nZXQoXCJjaGFubmVsc1wiLCBjaGFubmVsSWQpO1xuXG4gIGlmIChjaGFubmVsPy5ndWlsZElkKSB7XG4gICAgY29uc3QgZ3VpbGQgPSBhd2FpdCBjYWNoZUhhbmRsZXJzLmdldChcImd1aWxkc1wiLCBjaGFubmVsLmd1aWxkSWQpO1xuICAgIGlmICghZ3VpbGQpIHRocm93IG5ldyBFcnJvcihFcnJvcnMuR1VJTERfTk9UX0ZPVU5EKTtcblxuICAgIC8vIFRPRE8odGhyZWFkcyk6IGNoZWNrIGlmIHRoaXMgcmVxdWlyZXMgZ3VpbGQgcGVybXMgb3IgY2hhbm5lbCBpcyBlbm91Z2hcbiAgICBhd2FpdCByZXF1aXJlQm90R3VpbGRQZXJtaXNzaW9ucyhcbiAgICAgIGd1aWxkLFxuICAgICAgW1xuICAgICAgICAgIENoYW5uZWxUeXBlcy5HdWlsZE5ld3NUaHJlYWQsXG4gICAgICAgICAgQ2hhbm5lbFR5cGVzLkd1aWxkUGl2YXRlVGhyZWFkLFxuICAgICAgICAgIENoYW5uZWxUeXBlcy5HdWlsZFB1YmxpY1RocmVhZCxcbiAgICAgICAgXS5pbmNsdWRlcyhjaGFubmVsLnR5cGUpXG4gICAgICAgID8gW1wiTUFOQUdFX1RIUkVBRFNcIl1cbiAgICAgICAgOiBbXCJNQU5BR0VfQ0hBTk5FTFNcIl0sXG4gICAgKTtcbiAgICBpZiAoZ3VpbGQucnVsZXNDaGFubmVsSWQgPT09IGNoYW5uZWxJZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKEVycm9ycy5SVUxFU19DSEFOTkVMX0NBTk5PVF9CRV9ERUxFVEVEKTtcbiAgICB9XG5cbiAgICBpZiAoZ3VpbGQucHVibGljVXBkYXRlc0NoYW5uZWxJZCA9PT0gY2hhbm5lbElkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLlVQREFURVNfQ0hBTk5FTF9DQU5OT1RfQkVfREVMRVRFRCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF3YWl0IHJlc3QucnVuTWV0aG9kPHVuZGVmaW5lZD4oXG4gICAgXCJkZWxldGVcIixcbiAgICBlbmRwb2ludHMuQ0hBTk5FTF9CQVNFKGNoYW5uZWxJZCksXG4gICAgeyByZWFzb24gfSxcbiAgKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxhQUFhLFNBQVEsY0FBZ0I7U0FDckMsSUFBSSxTQUFRLGtCQUFvQjtTQUNoQyxNQUFNLFNBQVEsZ0NBQWtDO1NBQ2hELFlBQVksU0FBUSxrQkFBb0I7U0FDeEMsU0FBUyxTQUFRLHVCQUF5QjtTQUMxQywwQkFBMEIsU0FBUSx5QkFBMkI7QUFFdEUsRUFBMkYsQUFBM0YsdUZBQTJGLEFBQTNGLEVBQTJGLHVCQUNyRSxhQUFhLENBQ2pDLFNBQWlCLEVBQ2pCLE1BQWU7VUFFVCxPQUFPLFNBQVMsYUFBYSxDQUFDLEdBQUcsRUFBQyxRQUFVLEdBQUUsU0FBUztRQUV6RCxPQUFPLEVBQUUsT0FBTztjQUNaLEtBQUssU0FBUyxhQUFhLENBQUMsR0FBRyxFQUFDLE1BQVEsR0FBRSxPQUFPLENBQUMsT0FBTzthQUMxRCxLQUFLLFlBQVksS0FBSyxDQUFDLE1BQU0sQ0FBQyxlQUFlO1FBRWxELEVBQXlFLEFBQXpFLHVFQUF5RTtjQUNuRSwwQkFBMEIsQ0FDOUIsS0FBSztZQUVELFlBQVksQ0FBQyxlQUFlO1lBQzVCLFlBQVksQ0FBQyxpQkFBaUI7WUFDOUIsWUFBWSxDQUFDLGlCQUFpQjtVQUM5QixRQUFRLENBQUMsT0FBTyxDQUFDLElBQUk7YUFDcEIsY0FBZ0I7O2FBQ2hCLGVBQWlCOztZQUVwQixLQUFLLENBQUMsY0FBYyxLQUFLLFNBQVM7c0JBQzFCLEtBQUssQ0FBQyxNQUFNLENBQUMsK0JBQStCOztZQUdwRCxLQUFLLENBQUMsc0JBQXNCLEtBQUssU0FBUztzQkFDbEMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxpQ0FBaUM7OztpQkFJL0MsSUFBSSxDQUFDLFNBQVMsRUFDekIsTUFBUSxHQUNSLFNBQVMsQ0FBQyxZQUFZLENBQUMsU0FBUztRQUM5QixNQUFNIn0=
