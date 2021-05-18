import { cacheHandlers } from "../../cache.ts";
import { rest } from "../../rest/rest.ts";
import { structures } from "../../structures/mod.ts";
import { DiscordChannelTypes } from "../../types/channels/channel_types.ts";
import { Errors } from "../../types/discordeno/errors.ts";
import { DiscordAllowedMentionsTypes } from "../../types/messages/allowed_mentions_types.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotChannelPermissions } from "../../util/permissions.ts";
import { snakelize, validateComponents } from "../../util/utils.ts";
import { validateLength } from "../../util/validate_length.ts";
/** Send a message to the channel. Requires SEND_MESSAGES permission. */ export async function sendMessage(channelId, content) {
    if (typeof content === "string") content = {
        content
    };
    const channel = await cacheHandlers.get("channels", channelId);
    if (channel) {
        if (![
            DiscordChannelTypes.DM,
            DiscordChannelTypes.GuildNews,
            DiscordChannelTypes.GuildText,
            DiscordChannelTypes.GuildPublicThread,
            DiscordChannelTypes.GuildPivateThread,
            DiscordChannelTypes.GuildNewsThread, 
        ].includes(channel.type)) {
            throw new Error(Errors.CHANNEL_NOT_TEXT_BASED);
        }
        const requiredPerms = new Set([
            "SEND_MESSAGES",
            "VIEW_CHANNEL", 
        ]);
        if (content.tts) requiredPerms.add("SEND_TTS_MESSAGES");
        if (content.embed) requiredPerms.add("EMBED_LINKS");
        if (content.messageReference?.messageId || content.allowedMentions?.repliedUser) {
            requiredPerms.add("READ_MESSAGE_HISTORY");
        }
        await requireBotChannelPermissions(channelId, [
            ...requiredPerms
        ]);
    }
    // Use ... for content length due to unicode characters and js .length handling
    if (content.content && !validateLength(content.content, {
        max: 2000
    })) {
        throw new Error(Errors.MESSAGE_MAX_LENGTH);
    }
    if (content.allowedMentions) {
        if (content.allowedMentions.users?.length) {
            if (content.allowedMentions.parse?.includes(DiscordAllowedMentionsTypes.UserMentions)) {
                content.allowedMentions.parse = content.allowedMentions.parse.filter((p)=>p !== "users"
                );
            }
            if (content.allowedMentions.users.length > 100) {
                content.allowedMentions.users = content.allowedMentions.users.slice(0, 100);
            }
        }
        if (content.allowedMentions.roles?.length) {
            if (content.allowedMentions.parse?.includes(DiscordAllowedMentionsTypes.RoleMentions)) {
                content.allowedMentions.parse = content.allowedMentions.parse.filter((p)=>p !== "roles"
                );
            }
            if (content.allowedMentions.roles.length > 100) {
                content.allowedMentions.roles = content.allowedMentions.roles.slice(0, 100);
            }
        }
    }
    if (content.components?.length) {
        validateComponents(content.components);
    }
    const result = await rest.runMethod("post", endpoints.CHANNEL_MESSAGES(channelId), snakelize({
        ...content,
        ...content.messageReference?.messageId ? {
            messageReference: {
                ...content.messageReference,
                failIfNotExists: content.messageReference.failIfNotExists === true
            }
        } : {
        }
    }));
    return structures.createDiscordenoMessage(result);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvbWVzc2FnZXMvc2VuZF9tZXNzYWdlLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjYWNoZUhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHsgc3RydWN0dXJlcyB9IGZyb20gXCIuLi8uLi9zdHJ1Y3R1cmVzL21vZC50c1wiO1xuaW1wb3J0IHsgRGlzY29yZENoYW5uZWxUeXBlcyB9IGZyb20gXCIuLi8uLi90eXBlcy9jaGFubmVscy9jaGFubmVsX3R5cGVzLnRzXCI7XG5pbXBvcnQgeyBFcnJvcnMgfSBmcm9tIFwiLi4vLi4vdHlwZXMvZGlzY29yZGVuby9lcnJvcnMudHNcIjtcbmltcG9ydCB7IERpc2NvcmRBbGxvd2VkTWVudGlvbnNUeXBlcyB9IGZyb20gXCIuLi8uLi90eXBlcy9tZXNzYWdlcy9hbGxvd2VkX21lbnRpb25zX3R5cGVzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IENyZWF0ZU1lc3NhZ2UgfSBmcm9tIFwiLi4vLi4vdHlwZXMvbWVzc2FnZXMvY3JlYXRlX21lc3NhZ2UudHNcIjtcbmltcG9ydCB0eXBlIHsgTWVzc2FnZSB9IGZyb20gXCIuLi8uLi90eXBlcy9tZXNzYWdlcy9tZXNzYWdlLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFBlcm1pc3Npb25TdHJpbmdzIH0gZnJvbSBcIi4uLy4uL3R5cGVzL3Blcm1pc3Npb25zL3Blcm1pc3Npb25fc3RyaW5ncy50c1wiO1xuaW1wb3J0IHsgZW5kcG9pbnRzIH0gZnJvbSBcIi4uLy4uL3V0aWwvY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyByZXF1aXJlQm90Q2hhbm5lbFBlcm1pc3Npb25zIH0gZnJvbSBcIi4uLy4uL3V0aWwvcGVybWlzc2lvbnMudHNcIjtcbmltcG9ydCB7IHNuYWtlbGl6ZSwgdmFsaWRhdGVDb21wb25lbnRzIH0gZnJvbSBcIi4uLy4uL3V0aWwvdXRpbHMudHNcIjtcbmltcG9ydCB7IHZhbGlkYXRlTGVuZ3RoIH0gZnJvbSBcIi4uLy4uL3V0aWwvdmFsaWRhdGVfbGVuZ3RoLnRzXCI7XG5cbi8qKiBTZW5kIGEgbWVzc2FnZSB0byB0aGUgY2hhbm5lbC4gUmVxdWlyZXMgU0VORF9NRVNTQUdFUyBwZXJtaXNzaW9uLiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlbmRNZXNzYWdlKFxuICBjaGFubmVsSWQ6IGJpZ2ludCxcbiAgY29udGVudDogc3RyaW5nIHwgQ3JlYXRlTWVzc2FnZSxcbikge1xuICBpZiAodHlwZW9mIGNvbnRlbnQgPT09IFwic3RyaW5nXCIpIGNvbnRlbnQgPSB7IGNvbnRlbnQgfTtcblxuICBjb25zdCBjaGFubmVsID0gYXdhaXQgY2FjaGVIYW5kbGVycy5nZXQoXCJjaGFubmVsc1wiLCBjaGFubmVsSWQpO1xuICBpZiAoY2hhbm5lbCkge1xuICAgIGlmIChcbiAgICAgICFbXG4gICAgICAgIERpc2NvcmRDaGFubmVsVHlwZXMuRE0sXG4gICAgICAgIERpc2NvcmRDaGFubmVsVHlwZXMuR3VpbGROZXdzLFxuICAgICAgICBEaXNjb3JkQ2hhbm5lbFR5cGVzLkd1aWxkVGV4dCxcbiAgICAgICAgRGlzY29yZENoYW5uZWxUeXBlcy5HdWlsZFB1YmxpY1RocmVhZCxcbiAgICAgICAgRGlzY29yZENoYW5uZWxUeXBlcy5HdWlsZFBpdmF0ZVRocmVhZCxcbiAgICAgICAgRGlzY29yZENoYW5uZWxUeXBlcy5HdWlsZE5ld3NUaHJlYWQsXG4gICAgICBdLmluY2x1ZGVzKGNoYW5uZWwudHlwZSlcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihFcnJvcnMuQ0hBTk5FTF9OT1RfVEVYVF9CQVNFRCk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVxdWlyZWRQZXJtczogU2V0PFBlcm1pc3Npb25TdHJpbmdzPiA9IG5ldyBTZXQoW1xuICAgICAgXCJTRU5EX01FU1NBR0VTXCIsXG4gICAgICBcIlZJRVdfQ0hBTk5FTFwiLFxuICAgIF0pO1xuXG4gICAgaWYgKGNvbnRlbnQudHRzKSByZXF1aXJlZFBlcm1zLmFkZChcIlNFTkRfVFRTX01FU1NBR0VTXCIpO1xuICAgIGlmIChjb250ZW50LmVtYmVkKSByZXF1aXJlZFBlcm1zLmFkZChcIkVNQkVEX0xJTktTXCIpO1xuICAgIGlmIChcbiAgICAgIGNvbnRlbnQubWVzc2FnZVJlZmVyZW5jZT8ubWVzc2FnZUlkIHx8XG4gICAgICBjb250ZW50LmFsbG93ZWRNZW50aW9ucz8ucmVwbGllZFVzZXJcbiAgICApIHtcbiAgICAgIHJlcXVpcmVkUGVybXMuYWRkKFwiUkVBRF9NRVNTQUdFX0hJU1RPUllcIik7XG4gICAgfVxuXG4gICAgYXdhaXQgcmVxdWlyZUJvdENoYW5uZWxQZXJtaXNzaW9ucyhjaGFubmVsSWQsIFsuLi5yZXF1aXJlZFBlcm1zXSk7XG4gIH1cblxuICAvLyBVc2UgLi4uIGZvciBjb250ZW50IGxlbmd0aCBkdWUgdG8gdW5pY29kZSBjaGFyYWN0ZXJzIGFuZCBqcyAubGVuZ3RoIGhhbmRsaW5nXG4gIGlmIChjb250ZW50LmNvbnRlbnQgJiYgIXZhbGlkYXRlTGVuZ3RoKGNvbnRlbnQuY29udGVudCwgeyBtYXg6IDIwMDAgfSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLk1FU1NBR0VfTUFYX0xFTkdUSCk7XG4gIH1cblxuICBpZiAoY29udGVudC5hbGxvd2VkTWVudGlvbnMpIHtcbiAgICBpZiAoY29udGVudC5hbGxvd2VkTWVudGlvbnMudXNlcnM/Lmxlbmd0aCkge1xuICAgICAgaWYgKFxuICAgICAgICBjb250ZW50LmFsbG93ZWRNZW50aW9ucy5wYXJzZT8uaW5jbHVkZXMoXG4gICAgICAgICAgRGlzY29yZEFsbG93ZWRNZW50aW9uc1R5cGVzLlVzZXJNZW50aW9ucyxcbiAgICAgICAgKVxuICAgICAgKSB7XG4gICAgICAgIGNvbnRlbnQuYWxsb3dlZE1lbnRpb25zLnBhcnNlID0gY29udGVudC5hbGxvd2VkTWVudGlvbnMucGFyc2UuZmlsdGVyKFxuICAgICAgICAgIChwKSA9PiBwICE9PSBcInVzZXJzXCIsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb250ZW50LmFsbG93ZWRNZW50aW9ucy51c2Vycy5sZW5ndGggPiAxMDApIHtcbiAgICAgICAgY29udGVudC5hbGxvd2VkTWVudGlvbnMudXNlcnMgPSBjb250ZW50LmFsbG93ZWRNZW50aW9ucy51c2Vycy5zbGljZShcbiAgICAgICAgICAwLFxuICAgICAgICAgIDEwMCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29udGVudC5hbGxvd2VkTWVudGlvbnMucm9sZXM/Lmxlbmd0aCkge1xuICAgICAgaWYgKFxuICAgICAgICBjb250ZW50LmFsbG93ZWRNZW50aW9ucy5wYXJzZT8uaW5jbHVkZXMoXG4gICAgICAgICAgRGlzY29yZEFsbG93ZWRNZW50aW9uc1R5cGVzLlJvbGVNZW50aW9ucyxcbiAgICAgICAgKVxuICAgICAgKSB7XG4gICAgICAgIGNvbnRlbnQuYWxsb3dlZE1lbnRpb25zLnBhcnNlID0gY29udGVudC5hbGxvd2VkTWVudGlvbnMucGFyc2UuZmlsdGVyKFxuICAgICAgICAgIChwKSA9PiBwICE9PSBcInJvbGVzXCIsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb250ZW50LmFsbG93ZWRNZW50aW9ucy5yb2xlcy5sZW5ndGggPiAxMDApIHtcbiAgICAgICAgY29udGVudC5hbGxvd2VkTWVudGlvbnMucm9sZXMgPSBjb250ZW50LmFsbG93ZWRNZW50aW9ucy5yb2xlcy5zbGljZShcbiAgICAgICAgICAwLFxuICAgICAgICAgIDEwMCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoY29udGVudC5jb21wb25lbnRzPy5sZW5ndGgpIHtcbiAgICB2YWxpZGF0ZUNvbXBvbmVudHMoY29udGVudC5jb21wb25lbnRzKTtcbiAgfVxuXG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlc3QucnVuTWV0aG9kPE1lc3NhZ2U+KFxuICAgIFwicG9zdFwiLFxuICAgIGVuZHBvaW50cy5DSEFOTkVMX01FU1NBR0VTKGNoYW5uZWxJZCksXG4gICAgc25ha2VsaXplKHtcbiAgICAgIC4uLmNvbnRlbnQsXG4gICAgICAuLi4oY29udGVudC5tZXNzYWdlUmVmZXJlbmNlPy5tZXNzYWdlSWRcbiAgICAgICAgPyB7XG4gICAgICAgICAgbWVzc2FnZVJlZmVyZW5jZToge1xuICAgICAgICAgICAgLi4uY29udGVudC5tZXNzYWdlUmVmZXJlbmNlLFxuICAgICAgICAgICAgZmFpbElmTm90RXhpc3RzOiBjb250ZW50Lm1lc3NhZ2VSZWZlcmVuY2UuZmFpbElmTm90RXhpc3RzID09PSB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICAgICAgOiB7fSksXG4gICAgfSksXG4gICk7XG5cbiAgcmV0dXJuIHN0cnVjdHVyZXMuY3JlYXRlRGlzY29yZGVub01lc3NhZ2UocmVzdWx0KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxhQUFhLFNBQVEsY0FBZ0I7U0FDckMsSUFBSSxTQUFRLGtCQUFvQjtTQUNoQyxVQUFVLFNBQVEsdUJBQXlCO1NBQzNDLG1CQUFtQixTQUFRLHFDQUF1QztTQUNsRSxNQUFNLFNBQVEsZ0NBQWtDO1NBQ2hELDJCQUEyQixTQUFRLDhDQUFnRDtTQUluRixTQUFTLFNBQVEsdUJBQXlCO1NBQzFDLDRCQUE0QixTQUFRLHlCQUEyQjtTQUMvRCxTQUFTLEVBQUUsa0JBQWtCLFNBQVEsbUJBQXFCO1NBQzFELGNBQWMsU0FBUSw2QkFBK0I7QUFFOUQsRUFBd0UsQUFBeEUsb0VBQXdFLEFBQXhFLEVBQXdFLHVCQUNsRCxXQUFXLENBQy9CLFNBQWlCLEVBQ2pCLE9BQStCO2VBRXBCLE9BQU8sTUFBSyxNQUFRLEdBQUUsT0FBTztRQUFLLE9BQU87O1VBRTlDLE9B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