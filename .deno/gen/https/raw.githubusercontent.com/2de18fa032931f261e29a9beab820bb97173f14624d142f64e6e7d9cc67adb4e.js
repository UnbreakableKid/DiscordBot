import { cacheHandlers } from "../../cache.ts";
import { rest } from "../../rest/rest.ts";
import { DiscordChannelTypes } from "../../types/channels/channel_types.ts";
import { Errors } from "../../types/discordeno/errors.ts";
import { endpoints } from "../../util/constants.ts";
import { botHasChannelPermissions } from "../../util/permissions.ts";
/**
 * Trigger a typing indicator for the specified channel. Generally bots should **NOT** implement this route.
 * However, if a bot is responding to a command and expects the computation to take a few seconds,
 * this endpoint may be called to let the user know that the bot is processing their message.
 */ export async function startTyping(channelId) {
    const channel = await cacheHandlers.get("channels", channelId);
    // If the channel is cached, we can do extra checks/safety
    if (channel) {
        if (![
            DiscordChannelTypes.DM,
            DiscordChannelTypes.GuildNews,
            DiscordChannelTypes.GuildText,
            DiscordChannelTypes.GuildNewsThread,
            DiscordChannelTypes.GuildPivateThread,
            DiscordChannelTypes.GuildPublicThread, 
        ].includes(channel.type)) {
            throw new Error(Errors.CHANNEL_NOT_TEXT_BASED);
        }
        const hasSendMessagesPerm = await botHasChannelPermissions(channelId, [
            "SEND_MESSAGES"
        ]);
        if (!hasSendMessagesPerm) {
            throw new Error(Errors.MISSING_SEND_MESSAGES);
        }
    }
    return await rest.runMethod("post", endpoints.CHANNEL_TYPING(channelId));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvY2hhbm5lbHMvc3RhcnRfdHlwaW5nLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjYWNoZUhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHsgRGlzY29yZENoYW5uZWxUeXBlcyB9IGZyb20gXCIuLi8uLi90eXBlcy9jaGFubmVscy9jaGFubmVsX3R5cGVzLnRzXCI7XG5pbXBvcnQgeyBFcnJvcnMgfSBmcm9tIFwiLi4vLi4vdHlwZXMvZGlzY29yZGVuby9lcnJvcnMudHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHsgYm90SGFzQ2hhbm5lbFBlcm1pc3Npb25zIH0gZnJvbSBcIi4uLy4uL3V0aWwvcGVybWlzc2lvbnMudHNcIjtcblxuLyoqXG4gKiBUcmlnZ2VyIGEgdHlwaW5nIGluZGljYXRvciBmb3IgdGhlIHNwZWNpZmllZCBjaGFubmVsLiBHZW5lcmFsbHkgYm90cyBzaG91bGQgKipOT1QqKiBpbXBsZW1lbnQgdGhpcyByb3V0ZS5cbiAqIEhvd2V2ZXIsIGlmIGEgYm90IGlzIHJlc3BvbmRpbmcgdG8gYSBjb21tYW5kIGFuZCBleHBlY3RzIHRoZSBjb21wdXRhdGlvbiB0byB0YWtlIGEgZmV3IHNlY29uZHMsXG4gKiB0aGlzIGVuZHBvaW50IG1heSBiZSBjYWxsZWQgdG8gbGV0IHRoZSB1c2VyIGtub3cgdGhhdCB0aGUgYm90IGlzIHByb2Nlc3NpbmcgdGhlaXIgbWVzc2FnZS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0YXJ0VHlwaW5nKGNoYW5uZWxJZDogYmlnaW50KSB7XG4gIGNvbnN0IGNoYW5uZWwgPSBhd2FpdCBjYWNoZUhhbmRsZXJzLmdldChcImNoYW5uZWxzXCIsIGNoYW5uZWxJZCk7XG4gIC8vIElmIHRoZSBjaGFubmVsIGlzIGNhY2hlZCwgd2UgY2FuIGRvIGV4dHJhIGNoZWNrcy9zYWZldHlcbiAgaWYgKGNoYW5uZWwpIHtcbiAgICBpZiAoXG4gICAgICAhW1xuICAgICAgICBEaXNjb3JkQ2hhbm5lbFR5cGVzLkRNLFxuICAgICAgICBEaXNjb3JkQ2hhbm5lbFR5cGVzLkd1aWxkTmV3cyxcbiAgICAgICAgRGlzY29yZENoYW5uZWxUeXBlcy5HdWlsZFRleHQsXG4gICAgICAgIERpc2NvcmRDaGFubmVsVHlwZXMuR3VpbGROZXdzVGhyZWFkLFxuICAgICAgICBEaXNjb3JkQ2hhbm5lbFR5cGVzLkd1aWxkUGl2YXRlVGhyZWFkLFxuICAgICAgICBEaXNjb3JkQ2hhbm5lbFR5cGVzLkd1aWxkUHVibGljVGhyZWFkLFxuICAgICAgXS5pbmNsdWRlcyhjaGFubmVsLnR5cGUpXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLkNIQU5ORUxfTk9UX1RFWFRfQkFTRUQpO1xuICAgIH1cblxuICAgIGNvbnN0IGhhc1NlbmRNZXNzYWdlc1Blcm0gPSBhd2FpdCBib3RIYXNDaGFubmVsUGVybWlzc2lvbnMoXG4gICAgICBjaGFubmVsSWQsXG4gICAgICBbXCJTRU5EX01FU1NBR0VTXCJdLFxuICAgICk7XG4gICAgaWYgKFxuICAgICAgIWhhc1NlbmRNZXNzYWdlc1Blcm1cbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihFcnJvcnMuTUlTU0lOR19TRU5EX01FU1NBR0VTKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXdhaXQgcmVzdC5ydW5NZXRob2Q8dW5kZWZpbmVkPihcbiAgICBcInBvc3RcIixcbiAgICBlbmRwb2ludHMuQ0hBTk5FTF9UWVBJTkcoY2hhbm5lbElkKSxcbiAgKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxhQUFhLFNBQVEsY0FBZ0I7U0FDckMsSUFBSSxTQUFRLGtCQUFvQjtTQUNoQyxtQkFBbUIsU0FBUSxxQ0FBdUM7U0FDbEUsTUFBTSxTQUFRLGdDQUFrQztTQUNoRCxTQUFTLFNBQVEsdUJBQXlCO1NBQzFDLHdCQUF3QixTQUFRLHlCQUEyQjtBQUVwRSxFQUlHLEFBSkg7Ozs7Q0FJRyxBQUpILEVBSUcsdUJBQ21CLFdBQVcsQ0FBQyxTQUFpQjtVQUMzQyxPQUFPLFNBQVMsYUFBYSxDQUFDLEdBQUcsRUFBQyxRQUFVLEdBQUUsU0FBUztJQUM3RCxFQUEwRCxBQUExRCx3REFBMEQ7UUFDdEQsT0FBTzs7WUFHTCxtQkFBbUIsQ0FBQyxFQUFFO1lBQ3RCLG1CQUFtQixDQUFDLFNBQVM7WUFDN0IsbUJBQW1CLENBQUMsU0FBUztZQUM3QixtQkFBbUIsQ0FBQyxlQUFlO1lBQ25DLG1CQUFtQixDQUFDLGlCQUFpQjtZQUNyQyxtQkFBbUIsQ0FBQyxpQkFBaUI7VUFDckMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJO3NCQUViLEtBQUssQ0FBQyxNQUFNLENBQUMsc0JBQXNCOztjQUd6QyxtQkFBbUIsU0FBUyx3QkFBd0IsQ0FDeEQsU0FBUzthQUNSLGFBQWU7O2FBR2YsbUJBQW1CO3NCQUVWLEtBQUssQ0FBQyxNQUFNLENBQUMscUJBQXFCOzs7aUJBSW5DLElBQUksQ0FBQyxTQUFTLEVBQ3pCLElBQU0sR0FDTixTQUFTLENBQUMsY0FBYyxDQUFDLFNBQVMifQ==