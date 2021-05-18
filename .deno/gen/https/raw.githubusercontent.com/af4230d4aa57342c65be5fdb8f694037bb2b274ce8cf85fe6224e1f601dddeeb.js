import { validateLength } from "../../util/validate_length.ts";
import { Errors } from "../../types/discordeno/errors.ts";
import { rest } from "../../rest/rest.ts";
import { endpoints } from "../../util/constants.ts";
import { cacheHandlers } from "../../cache.ts";
import { ChannelTypes } from "../../types/channels/channel_types.ts";
import { requireBotChannelPermissions } from "../../util/permissions.ts";
/** Creates a new Stage instance associated to a Stage channel. Requires the user to be a moderator of the Stage channel. */ export async function createStageInstance(channelId, topic) {
    const channel = await cacheHandlers.get("channels", channelId);
    if (channel) {
        if (channel.type !== ChannelTypes.GuildStageVoice) {
            throw new Error(Errors.CHANNEL_NOT_STAGE_VOICE);
        }
        await requireBotChannelPermissions(channel, [
            "MANAGE_CHANNELS",
            "MUTE_MEMBERS",
            "MOVE_MEMBERS", 
        ]);
    }
    if (!validateLength(topic, {
        max: 120,
        min: 1
    })) {
        throw new Error(Errors.INVALID_TOPIC_LENGTH);
    }
    return await rest.runMethod("post", endpoints.STAGE_INSTANCES, {
        "channel_id": channelId,
        topic
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvY2hhbm5lbHMvY3JlYXRlX3N0YWdlX2luc3RhbmNlLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB2YWxpZGF0ZUxlbmd0aCB9IGZyb20gXCIuLi8uLi91dGlsL3ZhbGlkYXRlX2xlbmd0aC50c1wiO1xuaW1wb3J0IHsgRXJyb3JzIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2Rpc2NvcmRlbm8vZXJyb3JzLnRzXCI7XG5pbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHsgZW5kcG9pbnRzIH0gZnJvbSBcIi4uLy4uL3V0aWwvY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFN0YWdlSW5zdGFuY2UgfSBmcm9tIFwiLi4vLi4vdHlwZXMvY2hhbm5lbHMvc3RhZ2VfaW5zdGFuY2UudHNcIjtcbmltcG9ydCB7IGNhY2hlSGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vY2FjaGUudHNcIjtcbmltcG9ydCB7IENoYW5uZWxUeXBlcyB9IGZyb20gXCIuLi8uLi90eXBlcy9jaGFubmVscy9jaGFubmVsX3R5cGVzLnRzXCI7XG5pbXBvcnQgeyByZXF1aXJlQm90Q2hhbm5lbFBlcm1pc3Npb25zIH0gZnJvbSBcIi4uLy4uL3V0aWwvcGVybWlzc2lvbnMudHNcIjtcblxuLyoqIENyZWF0ZXMgYSBuZXcgU3RhZ2UgaW5zdGFuY2UgYXNzb2NpYXRlZCB0byBhIFN0YWdlIGNoYW5uZWwuIFJlcXVpcmVzIHRoZSB1c2VyIHRvIGJlIGEgbW9kZXJhdG9yIG9mIHRoZSBTdGFnZSBjaGFubmVsLiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVN0YWdlSW5zdGFuY2UoY2hhbm5lbElkOiBiaWdpbnQsIHRvcGljOiBzdHJpbmcpIHtcbiAgY29uc3QgY2hhbm5lbCA9IGF3YWl0IGNhY2hlSGFuZGxlcnMuZ2V0KFwiY2hhbm5lbHNcIiwgY2hhbm5lbElkKTtcblxuICBpZiAoY2hhbm5lbCkge1xuICAgIGlmIChjaGFubmVsLnR5cGUgIT09IENoYW5uZWxUeXBlcy5HdWlsZFN0YWdlVm9pY2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihFcnJvcnMuQ0hBTk5FTF9OT1RfU1RBR0VfVk9JQ0UpO1xuICAgIH1cblxuICAgIGF3YWl0IHJlcXVpcmVCb3RDaGFubmVsUGVybWlzc2lvbnMoY2hhbm5lbCwgW1xuICAgICAgXCJNQU5BR0VfQ0hBTk5FTFNcIixcbiAgICAgIFwiTVVURV9NRU1CRVJTXCIsXG4gICAgICBcIk1PVkVfTUVNQkVSU1wiLFxuICAgIF0pO1xuICB9XG5cbiAgaWYgKFxuICAgICF2YWxpZGF0ZUxlbmd0aCh0b3BpYywgeyBtYXg6IDEyMCwgbWluOiAxIH0pXG4gICkge1xuICAgIHRocm93IG5ldyBFcnJvcihFcnJvcnMuSU5WQUxJRF9UT1BJQ19MRU5HVEgpO1xuICB9XG5cbiAgcmV0dXJuIGF3YWl0IHJlc3QucnVuTWV0aG9kPFN0YWdlSW5zdGFuY2U+KFxuICAgIFwicG9zdFwiLFxuICAgIGVuZHBvaW50cy5TVEFHRV9JTlNUQU5DRVMsXG4gICAge1xuICAgICAgXCJjaGFubmVsX2lkXCI6IGNoYW5uZWxJZCxcbiAgICAgIHRvcGljLFxuICAgIH0sXG4gICk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsY0FBYyxTQUFRLDZCQUErQjtTQUNyRCxNQUFNLFNBQVEsZ0NBQWtDO1NBQ2hELElBQUksU0FBUSxrQkFBb0I7U0FDaEMsU0FBUyxTQUFRLHVCQUF5QjtTQUUxQyxhQUFhLFNBQVEsY0FBZ0I7U0FDckMsWUFBWSxTQUFRLHFDQUF1QztTQUMzRCw0QkFBNEIsU0FBUSx5QkFBMkI7QUFFeEUsRUFBNEgsQUFBNUgsd0hBQTRILEFBQTVILEVBQTRILHVCQUN0RyxtQkFBbUIsQ0FBQyxTQUFpQixFQUFFLEtBQWE7VUFDbEUsT0FBTyxTQUFTLGFBQWEsQ0FBQyxHQUFHLEVBQUMsUUFBVSxHQUFFLFNBQVM7UUFFekQsT0FBTztZQUNMLE9BQU8sQ0FBQyxJQUFJLEtBQUssWUFBWSxDQUFDLGVBQWU7c0JBQ3JDLEtBQUssQ0FBQyxNQUFNLENBQUMsdUJBQXVCOztjQUcxQyw0QkFBNEIsQ0FBQyxPQUFPO2FBQ3hDLGVBQWlCO2FBQ2pCLFlBQWM7YUFDZCxZQUFjOzs7U0FLZixjQUFjLENBQUMsS0FBSztRQUFJLEdBQUcsRUFBRSxHQUFHO1FBQUUsR0FBRyxFQUFFLENBQUM7O2tCQUUvQixLQUFLLENBQUMsTUFBTSxDQUFDLG9CQUFvQjs7aUJBR2hDLElBQUksQ0FBQyxTQUFTLEVBQ3pCLElBQU0sR0FDTixTQUFTLENBQUMsZUFBZTtTQUV2QixVQUFZLEdBQUUsU0FBUztRQUN2QixLQUFLIn0=