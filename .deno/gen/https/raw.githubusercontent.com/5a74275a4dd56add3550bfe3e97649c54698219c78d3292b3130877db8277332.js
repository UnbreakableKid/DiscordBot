import { cacheHandlers } from "../../cache.ts";
import { rest } from "../../rest/rest.ts";
import { ChannelTypes } from "../../types/channels/channel_types.ts";
import { Errors } from "../../types/discordeno/errors.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotChannelPermissions } from "../../util/permissions.ts";
/** Deletes the Stage instance. Requires the user to be a moderator of the Stage channel. */ export async function deleteStageInstance(channelId) {
    const channel = await cacheHandlers.get("channels", channelId);
    if (channel) {
        if (channel.type !== ChannelTypes.GuildStageVoice) {
            throw new Error(Errors.CHANNEL_NOT_STAGE_VOICE);
        }
        await requireBotChannelPermissions(channel, [
            "MUTE_MEMBERS",
            "MANAGE_CHANNELS",
            "MOVE_MEMBERS", 
        ]);
    }
    return await rest.runMethod("delete", endpoints.STAGE_INSTANCE(channelId));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvY2hhbm5lbHMvZGVsZXRlX3N0YWdlX2luc3RhbmNlLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjYWNoZUhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHsgQ2hhbm5lbFR5cGVzIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2NoYW5uZWxzL2NoYW5uZWxfdHlwZXMudHNcIjtcbmltcG9ydCB7IEVycm9ycyB9IGZyb20gXCIuLi8uLi90eXBlcy9kaXNjb3JkZW5vL2Vycm9ycy50c1wiO1xuaW1wb3J0IHsgZW5kcG9pbnRzIH0gZnJvbSBcIi4uLy4uL3V0aWwvY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyByZXF1aXJlQm90Q2hhbm5lbFBlcm1pc3Npb25zIH0gZnJvbSBcIi4uLy4uL3V0aWwvcGVybWlzc2lvbnMudHNcIjtcblxuLyoqIERlbGV0ZXMgdGhlIFN0YWdlIGluc3RhbmNlLiBSZXF1aXJlcyB0aGUgdXNlciB0byBiZSBhIG1vZGVyYXRvciBvZiB0aGUgU3RhZ2UgY2hhbm5lbC4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWxldGVTdGFnZUluc3RhbmNlKGNoYW5uZWxJZDogYmlnaW50KSB7XG4gIGNvbnN0IGNoYW5uZWwgPSBhd2FpdCBjYWNoZUhhbmRsZXJzLmdldChcImNoYW5uZWxzXCIsIGNoYW5uZWxJZCk7XG5cbiAgaWYgKGNoYW5uZWwpIHtcbiAgICBpZiAoY2hhbm5lbC50eXBlICE9PSBDaGFubmVsVHlwZXMuR3VpbGRTdGFnZVZvaWNlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLkNIQU5ORUxfTk9UX1NUQUdFX1ZPSUNFKTtcbiAgICB9XG5cbiAgICBhd2FpdCByZXF1aXJlQm90Q2hhbm5lbFBlcm1pc3Npb25zKGNoYW5uZWwsIFtcbiAgICAgIFwiTVVURV9NRU1CRVJTXCIsXG4gICAgICBcIk1BTkFHRV9DSEFOTkVMU1wiLFxuICAgICAgXCJNT1ZFX01FTUJFUlNcIixcbiAgICBdKTtcbiAgfVxuXG4gIHJldHVybiBhd2FpdCByZXN0LnJ1bk1ldGhvZDx1bmRlZmluZWQ+KFxuICAgIFwiZGVsZXRlXCIsXG4gICAgZW5kcG9pbnRzLlNUQUdFX0lOU1RBTkNFKGNoYW5uZWxJZCksXG4gICk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsYUFBYSxTQUFRLGNBQWdCO1NBQ3JDLElBQUksU0FBUSxrQkFBb0I7U0FDaEMsWUFBWSxTQUFRLHFDQUF1QztTQUMzRCxNQUFNLFNBQVEsZ0NBQWtDO1NBQ2hELFNBQVMsU0FBUSx1QkFBeUI7U0FDMUMsNEJBQTRCLFNBQVEseUJBQTJCO0FBRXhFLEVBQTRGLEFBQTVGLHdGQUE0RixBQUE1RixFQUE0Rix1QkFDdEUsbUJBQW1CLENBQUMsU0FBaUI7VUFDbkQsT0FBTyxTQUFTLGFBQWEsQ0FBQyxHQUFHLEVBQUMsUUFBVSxHQUFFLFNBQVM7UUFFekQsT0FBTztZQUNMLE9BQU8sQ0FBQyxJQUFJLEtBQUssWUFBWSxDQUFDLGVBQWU7c0JBQ3JDLEtBQUssQ0FBQyxNQUFNLENBQUMsdUJBQXVCOztjQUcxQyw0QkFBNEIsQ0FBQyxPQUFPO2FBQ3hDLFlBQWM7YUFDZCxlQUFpQjthQUNqQixZQUFjOzs7aUJBSUwsSUFBSSxDQUFDLFNBQVMsRUFDekIsTUFBUSxHQUNSLFNBQVMsQ0FBQyxjQUFjLENBQUMsU0FBUyJ9