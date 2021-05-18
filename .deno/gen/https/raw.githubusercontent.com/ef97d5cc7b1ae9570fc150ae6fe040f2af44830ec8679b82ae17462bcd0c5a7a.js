import { rest } from "../../rest/rest.ts";
import { Errors } from "../../types/discordeno/errors.ts";
import { endpoints } from "../../util/constants.ts";
import { validateLength } from "../../util/validate_length.ts";
import { cacheHandlers } from "../../cache.ts";
import { requireBotChannelPermissions } from "../../util/permissions.ts";
import { ChannelTypes } from "../../types/channels/channel_types.ts";
/** Updates fields of an existing Stage instance. Requires the user to be a moderator of the Stage channel. */ export async function updateStageInstance(channelId, topic) {
    const channel = await cacheHandlers.get("channels", channelId);
    if (channel) {
        if (channel.type !== ChannelTypes.GuildStageVoice) {
            throw new Error(Errors.CHANNEL_NOT_STAGE_VOICE);
        }
        await requireBotChannelPermissions(channel, [
            "MOVE_MEMBERS",
            "MUTE_MEMBERS",
            "MANAGE_CHANNELS", 
        ]);
    }
    if (!validateLength(topic, {
        min: 1,
        max: 120
    })) {
        throw new Error(Errors.INVALID_TOPIC_LENGTH);
    }
    return await rest.runMethod("patch", endpoints.STAGE_INSTANCE(channelId), {
        topic
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvY2hhbm5lbHMvdXBkYXRlX3N0YWdlX2luc3RhbmNlLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHsgRXJyb3JzIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2Rpc2NvcmRlbm8vZXJyb3JzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFN0YWdlSW5zdGFuY2UgfSBmcm9tIFwiLi4vLi4vdHlwZXMvY2hhbm5lbHMvc3RhZ2VfaW5zdGFuY2UudHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHsgdmFsaWRhdGVMZW5ndGggfSBmcm9tIFwiLi4vLi4vdXRpbC92YWxpZGF0ZV9sZW5ndGgudHNcIjtcbmltcG9ydCB7IGNhY2hlSGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vY2FjaGUudHNcIjtcbmltcG9ydCB7IHJlcXVpcmVCb3RDaGFubmVsUGVybWlzc2lvbnMgfSBmcm9tIFwiLi4vLi4vdXRpbC9wZXJtaXNzaW9ucy50c1wiO1xuaW1wb3J0IHsgQ2hhbm5lbFR5cGVzIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2NoYW5uZWxzL2NoYW5uZWxfdHlwZXMudHNcIjtcblxuLyoqIFVwZGF0ZXMgZmllbGRzIG9mIGFuIGV4aXN0aW5nIFN0YWdlIGluc3RhbmNlLiBSZXF1aXJlcyB0aGUgdXNlciB0byBiZSBhIG1vZGVyYXRvciBvZiB0aGUgU3RhZ2UgY2hhbm5lbC4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cGRhdGVTdGFnZUluc3RhbmNlKGNoYW5uZWxJZDogYmlnaW50LCB0b3BpYzogc3RyaW5nKSB7XG4gIGNvbnN0IGNoYW5uZWwgPSBhd2FpdCBjYWNoZUhhbmRsZXJzLmdldChcImNoYW5uZWxzXCIsIGNoYW5uZWxJZCk7XG5cbiAgaWYgKGNoYW5uZWwpIHtcbiAgICBpZiAoY2hhbm5lbC50eXBlICE9PSBDaGFubmVsVHlwZXMuR3VpbGRTdGFnZVZvaWNlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLkNIQU5ORUxfTk9UX1NUQUdFX1ZPSUNFKTtcbiAgICB9XG5cbiAgICBhd2FpdCByZXF1aXJlQm90Q2hhbm5lbFBlcm1pc3Npb25zKGNoYW5uZWwsIFtcbiAgICAgIFwiTU9WRV9NRU1CRVJTXCIsXG4gICAgICBcIk1VVEVfTUVNQkVSU1wiLFxuICAgICAgXCJNQU5BR0VfQ0hBTk5FTFNcIixcbiAgICBdKTtcbiAgfVxuXG4gIGlmIChcbiAgICAhdmFsaWRhdGVMZW5ndGgodG9waWMsIHtcbiAgICAgIG1pbjogMSxcbiAgICAgIG1heDogMTIwLFxuICAgIH0pXG4gICkge1xuICAgIHRocm93IG5ldyBFcnJvcihFcnJvcnMuSU5WQUxJRF9UT1BJQ19MRU5HVEgpO1xuICB9XG5cbiAgcmV0dXJuIGF3YWl0IHJlc3QucnVuTWV0aG9kPFN0YWdlSW5zdGFuY2U+KFxuICAgIFwicGF0Y2hcIixcbiAgICBlbmRwb2ludHMuU1RBR0VfSU5TVEFOQ0UoY2hhbm5lbElkKSxcbiAgICB7XG4gICAgICB0b3BpYyxcbiAgICB9LFxuICApO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLElBQUksU0FBUSxrQkFBb0I7U0FDaEMsTUFBTSxTQUFRLGdDQUFrQztTQUVoRCxTQUFTLFNBQVEsdUJBQXlCO1NBQzFDLGNBQWMsU0FBUSw2QkFBK0I7U0FDckQsYUFBYSxTQUFRLGNBQWdCO1NBQ3JDLDRCQUE0QixTQUFRLHlCQUEyQjtTQUMvRCxZQUFZLFNBQVEscUNBQXVDO0FBRXBFLEVBQThHLEFBQTlHLDBHQUE4RyxBQUE5RyxFQUE4Ryx1QkFDeEYsbUJBQW1CLENBQUMsU0FBaUIsRUFBRSxLQUFhO1VBQ2xFLE9BQU8sU0FBUyxhQUFhLENBQUMsR0FBRyxFQUFDLFFBQVUsR0FBRSxTQUFTO1FBRXpELE9BQU87WUFDTCxPQUFPLENBQUMsSUFBSSxLQUFLLFlBQVksQ0FBQyxlQUFlO3NCQUNyQyxLQUFLLENBQUMsTUFBTSxDQUFDLHVCQUF1Qjs7Y0FHMUMsNEJBQTRCLENBQUMsT0FBTzthQUN4QyxZQUFjO2FBQ2QsWUFBYzthQUNkLGVBQWlCOzs7U0FLbEIsY0FBYyxDQUFDLEtBQUs7UUFDbkIsR0FBRyxFQUFFLENBQUM7UUFDTixHQUFHLEVBQUUsR0FBRzs7a0JBR0EsS0FBSyxDQUFDLE1BQU0sQ0FBQyxvQkFBb0I7O2lCQUdoQyxJQUFJLENBQUMsU0FBUyxFQUN6QixLQUFPLEdBQ1AsU0FBUyxDQUFDLGNBQWMsQ0FBQyxTQUFTO1FBRWhDLEtBQUsifQ==