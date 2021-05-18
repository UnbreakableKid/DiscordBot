import { cacheHandlers } from "../../cache.ts";
import { rest } from "../../rest/rest.ts";
import { structures } from "../../structures/mod.ts";
import { Errors } from "../../types/discordeno/errors.ts";
import { bigintToSnowflake } from "../../util/bigint.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotChannelPermissions, requireBotGuildPermissions } from "../../util/permissions.ts";
import { snakelize } from "../../util/utils.ts";
/** Edit the member */ export async function editMember(guildId, memberId, options) {
    const requiredPerms = new Set();
    if (options.nick) {
        if (options.nick.length > 32) {
            throw new Error(Errors.NICKNAMES_MAX_LENGTH);
        }
        requiredPerms.add("MANAGE_NICKNAMES");
    }
    if (options.roles) requiredPerms.add("MANAGE_ROLES");
    if (typeof options.mute !== "undefined" || typeof options.deaf !== "undefined" || typeof options.channelId !== "undefined" || "null") {
        const memberVoiceState = (await cacheHandlers.get("guilds", guildId))?.voiceStates.get(memberId);
        if (!memberVoiceState?.channelId) {
            throw new Error(Errors.MEMBER_NOT_IN_VOICE_CHANNEL);
        }
        if (typeof options.mute !== "undefined") {
            requiredPerms.add("MUTE_MEMBERS");
        }
        if (typeof options.deaf !== "undefined") {
            requiredPerms.add("DEAFEN_MEMBERS");
        }
        if (options.channelId) {
            const requiredVoicePerms = new Set([
                "CONNECT",
                "MOVE_MEMBERS", 
            ]);
            if (memberVoiceState) {
                await requireBotChannelPermissions(memberVoiceState?.channelId, [
                    ...requiredVoicePerms
                ]);
            }
            await requireBotChannelPermissions(options.channelId, [
                ...requiredVoicePerms
            ]);
        }
    }
    await requireBotGuildPermissions(guildId, [
        ...requiredPerms
    ]);
    const result = await rest.runMethod("patch", endpoints.GUILD_MEMBER(guildId, memberId), snakelize({
        ...options,
        channelId: options.channelId ? bigintToSnowflake(options.channelId) : undefined
    }));
    const member = await structures.createDiscordenoMember(result, guildId);
    return member;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvbWVtYmVycy9lZGl0X21lbWJlci50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY2FjaGVIYW5kbGVycyB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuaW1wb3J0IHsgcmVzdCB9IGZyb20gXCIuLi8uLi9yZXN0L3Jlc3QudHNcIjtcbmltcG9ydCB7IHN0cnVjdHVyZXMgfSBmcm9tIFwiLi4vLi4vc3RydWN0dXJlcy9tb2QudHNcIjtcbmltcG9ydCB7IEVycm9ycyB9IGZyb20gXCIuLi8uLi90eXBlcy9kaXNjb3JkZW5vL2Vycm9ycy50c1wiO1xuaW1wb3J0IHR5cGUgeyBNb2RpZnlHdWlsZE1lbWJlciB9IGZyb20gXCIuLi8uLi90eXBlcy9ndWlsZHMvbW9kaWZ5X2d1aWxkX21lbWJlci50c1wiO1xuaW1wb3J0IHR5cGUgeyBHdWlsZE1lbWJlcldpdGhVc2VyIH0gZnJvbSBcIi4uLy4uL3R5cGVzL21lbWJlcnMvZ3VpbGRfbWVtYmVyLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFBlcm1pc3Npb25TdHJpbmdzIH0gZnJvbSBcIi4uLy4uL3R5cGVzL3Blcm1pc3Npb25zL3Blcm1pc3Npb25fc3RyaW5ncy50c1wiO1xuaW1wb3J0IHsgYmlnaW50VG9Tbm93Zmxha2UgfSBmcm9tIFwiLi4vLi4vdXRpbC9iaWdpbnQudHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHtcbiAgcmVxdWlyZUJvdENoYW5uZWxQZXJtaXNzaW9ucyxcbiAgcmVxdWlyZUJvdEd1aWxkUGVybWlzc2lvbnMsXG59IGZyb20gXCIuLi8uLi91dGlsL3Blcm1pc3Npb25zLnRzXCI7XG5pbXBvcnQgeyBzbmFrZWxpemUgfSBmcm9tIFwiLi4vLi4vdXRpbC91dGlscy50c1wiO1xuXG4vKiogRWRpdCB0aGUgbWVtYmVyICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZWRpdE1lbWJlcihcbiAgZ3VpbGRJZDogYmlnaW50LFxuICBtZW1iZXJJZDogYmlnaW50LFxuICBvcHRpb25zOiBPbWl0PE1vZGlmeUd1aWxkTWVtYmVyLCBcImNoYW5uZWxJZFwiPiAmIHsgY2hhbm5lbElkPzogYmlnaW50IHwgbnVsbCB9LFxuKSB7XG4gIGNvbnN0IHJlcXVpcmVkUGVybXM6IFNldDxQZXJtaXNzaW9uU3RyaW5ncz4gPSBuZXcgU2V0KCk7XG5cbiAgaWYgKG9wdGlvbnMubmljaykge1xuICAgIGlmIChvcHRpb25zLm5pY2subGVuZ3RoID4gMzIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihFcnJvcnMuTklDS05BTUVTX01BWF9MRU5HVEgpO1xuICAgIH1cbiAgICByZXF1aXJlZFBlcm1zLmFkZChcIk1BTkFHRV9OSUNLTkFNRVNcIik7XG4gIH1cblxuICBpZiAob3B0aW9ucy5yb2xlcykgcmVxdWlyZWRQZXJtcy5hZGQoXCJNQU5BR0VfUk9MRVNcIik7XG5cbiAgaWYgKFxuICAgIHR5cGVvZiBvcHRpb25zLm11dGUgIT09IFwidW5kZWZpbmVkXCIgfHxcbiAgICB0eXBlb2Ygb3B0aW9ucy5kZWFmICE9PSBcInVuZGVmaW5lZFwiIHx8XG4gICAgKHR5cGVvZiBvcHRpb25zLmNoYW5uZWxJZCAhPT0gXCJ1bmRlZmluZWRcIiB8fCBcIm51bGxcIilcbiAgKSB7XG4gICAgY29uc3QgbWVtYmVyVm9pY2VTdGF0ZSA9IChhd2FpdCBjYWNoZUhhbmRsZXJzLmdldChcImd1aWxkc1wiLCBndWlsZElkKSlcbiAgICAgID8udm9pY2VTdGF0ZXMuZ2V0KG1lbWJlcklkKTtcblxuICAgIGlmICghbWVtYmVyVm9pY2VTdGF0ZT8uY2hhbm5lbElkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLk1FTUJFUl9OT1RfSU5fVk9JQ0VfQ0hBTk5FTCk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvcHRpb25zLm11dGUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHJlcXVpcmVkUGVybXMuYWRkKFwiTVVURV9NRU1CRVJTXCIpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5kZWFmICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICByZXF1aXJlZFBlcm1zLmFkZChcIkRFQUZFTl9NRU1CRVJTXCIpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLmNoYW5uZWxJZCkge1xuICAgICAgY29uc3QgcmVxdWlyZWRWb2ljZVBlcm1zOiBTZXQ8UGVybWlzc2lvblN0cmluZ3M+ID0gbmV3IFNldChbXG4gICAgICAgIFwiQ09OTkVDVFwiLFxuICAgICAgICBcIk1PVkVfTUVNQkVSU1wiLFxuICAgICAgXSk7XG4gICAgICBpZiAobWVtYmVyVm9pY2VTdGF0ZSkge1xuICAgICAgICBhd2FpdCByZXF1aXJlQm90Q2hhbm5lbFBlcm1pc3Npb25zKFxuICAgICAgICAgIG1lbWJlclZvaWNlU3RhdGU/LmNoYW5uZWxJZCxcbiAgICAgICAgICBbLi4ucmVxdWlyZWRWb2ljZVBlcm1zXSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGF3YWl0IHJlcXVpcmVCb3RDaGFubmVsUGVybWlzc2lvbnMoXG4gICAgICAgIG9wdGlvbnMuY2hhbm5lbElkLFxuICAgICAgICBbLi4ucmVxdWlyZWRWb2ljZVBlcm1zXSxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgYXdhaXQgcmVxdWlyZUJvdEd1aWxkUGVybWlzc2lvbnMoZ3VpbGRJZCwgWy4uLnJlcXVpcmVkUGVybXNdKTtcblxuICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXN0LnJ1bk1ldGhvZDxHdWlsZE1lbWJlcldpdGhVc2VyPihcbiAgICBcInBhdGNoXCIsXG4gICAgZW5kcG9pbnRzLkdVSUxEX01FTUJFUihndWlsZElkLCBtZW1iZXJJZCksXG4gICAgc25ha2VsaXplKHtcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICBjaGFubmVsSWQ6IG9wdGlvbnMuY2hhbm5lbElkXG4gICAgICAgID8gYmlnaW50VG9Tbm93Zmxha2Uob3B0aW9ucy5jaGFubmVsSWQpXG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgIH0pIGFzIE1vZGlmeUd1aWxkTWVtYmVyLFxuICApO1xuXG4gIGNvbnN0IG1lbWJlciA9IGF3YWl0IHN0cnVjdHVyZXMuY3JlYXRlRGlzY29yZGVub01lbWJlcihcbiAgICByZXN1bHQsXG4gICAgZ3VpbGRJZCxcbiAgKTtcblxuICByZXR1cm4gbWVtYmVyO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLGFBQWEsU0FBUSxjQUFnQjtTQUNyQyxJQUFJLFNBQVEsa0JBQW9CO1NBQ2hDLFVBQVUsU0FBUSx1QkFBeUI7U0FDM0MsTUFBTSxTQUFRLGdDQUFrQztTQUloRCxpQkFBaUIsU0FBUSxvQkFBc0I7U0FDL0MsU0FBUyxTQUFRLHVCQUF5QjtTQUVqRCw0QkFBNEIsRUFDNUIsMEJBQTBCLFNBQ3JCLHlCQUEyQjtTQUN6QixTQUFTLFNBQVEsbUJBQXFCO0FBRS9DLEVBQXNCLEFBQXRCLGtCQUFzQixBQUF0QixFQUFzQix1QkFDQSxVQUFVLENBQzlCLE9BQWUsRUFDZixRQUFnQixFQUNoQixPQUE2RTtVQUV2RSxhQUFhLE9BQStCLEdBQUc7UUFFakQsT0FBTyxDQUFDLElBQUk7WUFDVixPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFO3NCQUNoQixLQUFLLENBQUMsTUFBTSxDQUFDLG9CQUFvQjs7UUFFN0MsYUFBYSxDQUFDLEdBQUcsRUFBQyxnQkFBa0I7O1FBR2xDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLEdBQUcsRUFBQyxZQUFjO2VBRzFDLE9BQU8sQ0FBQyxJQUFJLE1BQUssU0FBVyxZQUM1QixPQUFPLENBQUMsSUFBSSxNQUFLLFNBQVcsWUFDM0IsT0FBTyxDQUFDLFNBQVMsTUFBSyxTQUFXLE1BQUksSUFBTTtjQUU3QyxnQkFBZ0IsVUFBVSxhQUFhLENBQUMsR0FBRyxFQUFDLE1BQVEsR0FBRSxPQUFPLElBQy9ELFdBQVcsQ0FBQyxHQUFHLENBQUMsUUFBUTthQUV2QixnQkFBZ0IsRUFBRSxTQUFTO3NCQUNwQixLQUFLLENBQUMsTUFBTSxDQUFDLDJCQUEyQjs7bUJBR3pDLE9BQU8sQ0FBQyxJQUFJLE1BQUssU0FBVztZQUNyQyxhQUFhLENBQUMsR0FBRyxFQUFDLFlBQWM7O21CQUd2QixPQUFPLENBQUMsSUFBSSxNQUFLLFNBQVc7WUFDckMsYUFBYSxDQUFDLEdBQUcsRUFBQyxjQUFnQjs7WUFHaEMsT0FBTyxDQUFDLFNBQVM7a0JBQ2Isa0JBQWtCLE9BQStCLEdBQUc7aUJBQ3hELE9BQVM7aUJBQ1QsWUFBYzs7Z0JBRVosZ0JBQWdCO3NCQUNaLDRCQUE0QixDQUNoQyxnQkFBZ0IsRUFBRSxTQUFTO3VCQUN2QixrQkFBa0I7OztrQkFHcEIsNEJBQTRCLENBQ2hDLE9BQU8sQ0FBQyxTQUFTO21CQUNiLGtCQUFrQjs7OztVQUt0QiwwQkFBMEIsQ0FBQyxPQUFPO1dBQU0sYUFBYTs7VUFFckQsTUFBTSxTQUFTLElBQUksQ0FBQyxTQUFTLEVBQ2pDLEtBQU8sR0FDUCxTQUFTLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxRQUFRLEdBQ3hDLFNBQVM7V0FDSixPQUFPO1FBQ1YsU0FBUyxFQUFFLE9BQU8sQ0FBQyxTQUFTLEdBQ3hCLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxTQUFTLElBQ25DLFNBQVM7O1VBSVgsTUFBTSxTQUFTLFVBQVUsQ0FBQyxzQkFBc0IsQ0FDcEQsTUFBTSxFQUNOLE9BQU87V0FHRixNQUFNIn0=