import { eventHandlers } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { DiscordChannelTypes } from "../../types/channels/channel_types.ts";
import { snowflakeToBigint } from "../../util/bigint.ts";
export async function handleChannelDelete(data) {
    const payload = data.d;
    const cachedChannel = await cacheHandlers.get("channels", snowflakeToBigint(payload.id));
    if (!cachedChannel) return;
    if (cachedChannel.type === DiscordChannelTypes.GuildVoice && payload.guildId) {
        const guild = await cacheHandlers.get("guilds", cachedChannel.guildId);
        if (guild) {
            return Promise.all(guild.voiceStates.map(async (vs, key)=>{
                if (vs.channelId !== cachedChannel.id) return;
                // Since this channel was deleted all voice states for this channel should be deleted
                guild.voiceStates.delete(key);
                const member = await cacheHandlers.get("members", vs.userId);
                if (!member) return;
                eventHandlers.voiceChannelLeave?.(member, vs.channelId);
            }));
        }
    }
    if ([
        DiscordChannelTypes.GuildText,
        DiscordChannelTypes.DM,
        DiscordChannelTypes.GroupDm,
        DiscordChannelTypes.GuildNews, 
    ].includes(payload.type)) {
        await cacheHandlers.delete("channels", snowflakeToBigint(payload.id));
        cacheHandlers.forEach("messages", (message)=>{
            eventHandlers.debug?.("loop", `Running forEach messages loop in CHANNEL_DELTE file.`);
            if (message.channelId === snowflakeToBigint(payload.id)) {
                cacheHandlers.delete("messages", message.id);
            }
        });
    }
    await cacheHandlers.delete("channels", snowflakeToBigint(payload.id));
    eventHandlers.channelDelete?.(cachedChannel);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hhbmRsZXJzL2NoYW5uZWxzL0NIQU5ORUxfREVMRVRFLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBldmVudEhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2JvdC50c1wiO1xuaW1wb3J0IHsgY2FjaGVIYW5kbGVycyB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuaW1wb3J0IHR5cGUgeyBDaGFubmVsIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2NoYW5uZWxzL2NoYW5uZWwudHNcIjtcbmltcG9ydCB7IERpc2NvcmRDaGFubmVsVHlwZXMgfSBmcm9tIFwiLi4vLi4vdHlwZXMvY2hhbm5lbHMvY2hhbm5lbF90eXBlcy50c1wiO1xuaW1wb3J0IHR5cGUgeyBEaXNjb3JkR2F0ZXdheVBheWxvYWQgfSBmcm9tIFwiLi4vLi4vdHlwZXMvZ2F0ZXdheS9nYXRld2F5X3BheWxvYWQudHNcIjtcbmltcG9ydCB7IHNub3dmbGFrZVRvQmlnaW50IH0gZnJvbSBcIi4uLy4uL3V0aWwvYmlnaW50LnRzXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVDaGFubmVsRGVsZXRlKGRhdGE6IERpc2NvcmRHYXRld2F5UGF5bG9hZCkge1xuICBjb25zdCBwYXlsb2FkID0gZGF0YS5kIGFzIENoYW5uZWw7XG5cbiAgY29uc3QgY2FjaGVkQ2hhbm5lbCA9IGF3YWl0IGNhY2hlSGFuZGxlcnMuZ2V0KFxuICAgIFwiY2hhbm5lbHNcIixcbiAgICBzbm93Zmxha2VUb0JpZ2ludChwYXlsb2FkLmlkKSxcbiAgKTtcbiAgaWYgKCFjYWNoZWRDaGFubmVsKSByZXR1cm47XG5cbiAgaWYgKFxuICAgIGNhY2hlZENoYW5uZWwudHlwZSA9PT0gRGlzY29yZENoYW5uZWxUeXBlcy5HdWlsZFZvaWNlICYmIHBheWxvYWQuZ3VpbGRJZFxuICApIHtcbiAgICBjb25zdCBndWlsZCA9IGF3YWl0IGNhY2hlSGFuZGxlcnMuZ2V0KFwiZ3VpbGRzXCIsIGNhY2hlZENoYW5uZWwuZ3VpbGRJZCk7XG5cbiAgICBpZiAoZ3VpbGQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChndWlsZC52b2ljZVN0YXRlcy5tYXAoYXN5bmMgKHZzLCBrZXkpID0+IHtcbiAgICAgICAgaWYgKHZzLmNoYW5uZWxJZCAhPT0gY2FjaGVkQ2hhbm5lbC5pZCkgcmV0dXJuO1xuXG4gICAgICAgIC8vIFNpbmNlIHRoaXMgY2hhbm5lbCB3YXMgZGVsZXRlZCBhbGwgdm9pY2Ugc3RhdGVzIGZvciB0aGlzIGNoYW5uZWwgc2hvdWxkIGJlIGRlbGV0ZWRcbiAgICAgICAgZ3VpbGQudm9pY2VTdGF0ZXMuZGVsZXRlKGtleSk7XG5cbiAgICAgICAgY29uc3QgbWVtYmVyID0gYXdhaXQgY2FjaGVIYW5kbGVycy5nZXQoXCJtZW1iZXJzXCIsIHZzLnVzZXJJZCk7XG4gICAgICAgIGlmICghbWVtYmVyKSByZXR1cm47XG5cbiAgICAgICAgZXZlbnRIYW5kbGVycy52b2ljZUNoYW5uZWxMZWF2ZT8uKG1lbWJlciwgdnMuY2hhbm5lbElkKTtcbiAgICAgIH0pKTtcbiAgICB9XG4gIH1cblxuICBpZiAoXG4gICAgW1xuICAgICAgRGlzY29yZENoYW5uZWxUeXBlcy5HdWlsZFRleHQsXG4gICAgICBEaXNjb3JkQ2hhbm5lbFR5cGVzLkRNLFxuICAgICAgRGlzY29yZENoYW5uZWxUeXBlcy5Hcm91cERtLFxuICAgICAgRGlzY29yZENoYW5uZWxUeXBlcy5HdWlsZE5ld3MsXG4gICAgXS5pbmNsdWRlcyhwYXlsb2FkLnR5cGUpXG4gICkge1xuICAgIGF3YWl0IGNhY2hlSGFuZGxlcnMuZGVsZXRlKFwiY2hhbm5lbHNcIiwgc25vd2ZsYWtlVG9CaWdpbnQocGF5bG9hZC5pZCkpO1xuICAgIGNhY2hlSGFuZGxlcnMuZm9yRWFjaChcIm1lc3NhZ2VzXCIsIChtZXNzYWdlKSA9PiB7XG4gICAgICBldmVudEhhbmRsZXJzLmRlYnVnPy4oXG4gICAgICAgIFwibG9vcFwiLFxuICAgICAgICBgUnVubmluZyBmb3JFYWNoIG1lc3NhZ2VzIGxvb3AgaW4gQ0hBTk5FTF9ERUxURSBmaWxlLmAsXG4gICAgICApO1xuICAgICAgaWYgKG1lc3NhZ2UuY2hhbm5lbElkID09PSBzbm93Zmxha2VUb0JpZ2ludChwYXlsb2FkLmlkKSkge1xuICAgICAgICBjYWNoZUhhbmRsZXJzLmRlbGV0ZShcIm1lc3NhZ2VzXCIsIG1lc3NhZ2UuaWQpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgYXdhaXQgY2FjaGVIYW5kbGVycy5kZWxldGUoXCJjaGFubmVsc1wiLCBzbm93Zmxha2VUb0JpZ2ludChwYXlsb2FkLmlkKSk7XG5cbiAgZXZlbnRIYW5kbGVycy5jaGFubmVsRGVsZXRlPy4oY2FjaGVkQ2hhbm5lbCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsYUFBYSxTQUFRLFlBQWM7U0FDbkMsYUFBYSxTQUFRLGNBQWdCO1NBRXJDLG1CQUFtQixTQUFRLHFDQUF1QztTQUVsRSxpQkFBaUIsU0FBUSxvQkFBc0I7c0JBRWxDLG1CQUFtQixDQUFDLElBQTJCO1VBQzdELE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQztVQUVoQixhQUFhLFNBQVMsYUFBYSxDQUFDLEdBQUcsRUFDM0MsUUFBVSxHQUNWLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxFQUFFO1NBRXpCLGFBQWE7UUFHaEIsYUFBYSxDQUFDLElBQUksS0FBSyxtQkFBbUIsQ0FBQyxVQUFVLElBQUksT0FBTyxDQUFDLE9BQU87Y0FFbEUsS0FBSyxTQUFTLGFBQWEsQ0FBQyxHQUFHLEVBQUMsTUFBUSxHQUFFLGFBQWEsQ0FBQyxPQUFPO1lBRWpFLEtBQUs7bUJBQ0EsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsUUFBUSxFQUFFLEVBQUUsR0FBRztvQkFDakQsRUFBRSxDQUFDLFNBQVMsS0FBSyxhQUFhLENBQUMsRUFBRTtnQkFFckMsRUFBcUYsQUFBckYsbUZBQXFGO2dCQUNyRixLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxHQUFHO3NCQUV0QixNQUFNLFNBQVMsYUFBYSxDQUFDLEdBQUcsRUFBQyxPQUFTLEdBQUUsRUFBRSxDQUFDLE1BQU07cUJBQ3RELE1BQU07Z0JBRVgsYUFBYSxDQUFDLGlCQUFpQixHQUFHLE1BQU0sRUFBRSxFQUFFLENBQUMsU0FBUzs7Ozs7UUFPeEQsbUJBQW1CLENBQUMsU0FBUztRQUM3QixtQkFBbUIsQ0FBQyxFQUFFO1FBQ3RCLG1CQUFtQixDQUFDLE9BQU87UUFDM0IsbUJBQW1CLENBQUMsU0FBUztNQUM3QixRQUFRLENBQUMsT0FBTyxDQUFDLElBQUk7Y0FFakIsYUFBYSxDQUFDLE1BQU0sRUFBQyxRQUFVLEdBQUUsaUJBQWlCLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDbkUsYUFBYSxDQUFDLE9BQU8sRUFBQyxRQUFVLElBQUcsT0FBTztZQUN4QyxhQUFhLENBQUMsS0FBSyxJQUNqQixJQUFNLElBQ0wsb0RBQW9EO2dCQUVuRCxPQUFPLENBQUMsU0FBUyxLQUFLLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNwRCxhQUFhLENBQUMsTUFBTSxFQUFDLFFBQVUsR0FBRSxPQUFPLENBQUMsRUFBRTs7OztVQUszQyxhQUFhLENBQUMsTUFBTSxFQUFDLFFBQVUsR0FBRSxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsRUFBRTtJQUVuRSxhQUFhLENBQUMsYUFBYSxHQUFHLGFBQWEifQ==