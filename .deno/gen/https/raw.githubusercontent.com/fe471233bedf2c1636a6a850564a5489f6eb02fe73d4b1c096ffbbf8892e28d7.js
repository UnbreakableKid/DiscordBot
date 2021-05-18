import { botId, eventHandlers } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { structures } from "../../structures/mod.ts";
import { snowflakeToBigint } from "../../util/bigint.ts";
export async function handleMessageReactionAdd(data) {
    const payload = data.d;
    const message = await cacheHandlers.get("messages", snowflakeToBigint(payload.messageId));
    if (message) {
        const reactionExisted = message.reactions?.find((reaction)=>reaction.emoji.id === payload.emoji.id && reaction.emoji.name === payload.emoji.name
        );
        if (reactionExisted) reactionExisted.count++;
        else {
            const newReaction = {
                count: 1,
                me: snowflakeToBigint(payload.userId) === botId,
                emoji: {
                    ...payload.emoji,
                    id: payload.emoji.id || undefined
                }
            };
            message.reactions = message.reactions ? [
                ...message.reactions,
                newReaction
            ] : [
                newReaction
            ];
        }
        await cacheHandlers.set("messages", snowflakeToBigint(payload.messageId), message);
    }
    if (payload.member && payload.guildId) {
        const guild = await cacheHandlers.get("guilds", snowflakeToBigint(payload.guildId));
        if (guild) {
            const discordenoMember = await structures.createDiscordenoMember(payload.member, guild.id);
            await cacheHandlers.set("members", discordenoMember.id, discordenoMember);
        }
    }
    eventHandlers.reactionAdd?.(payload, message);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hhbmRsZXJzL21lc3NhZ2VzL01FU1NBR0VfUkVBQ1RJT05fQURELnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBib3RJZCwgZXZlbnRIYW5kbGVycyB9IGZyb20gXCIuLi8uLi9ib3QudHNcIjtcbmltcG9ydCB7IGNhY2hlSGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vY2FjaGUudHNcIjtcbmltcG9ydCB7IHN0cnVjdHVyZXMgfSBmcm9tIFwiLi4vLi4vc3RydWN0dXJlcy9tb2QudHNcIjtcbmltcG9ydCB0eXBlIHsgRGlzY29yZEdhdGV3YXlQYXlsb2FkIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2dhdGV3YXkvZ2F0ZXdheV9wYXlsb2FkLnRzXCI7XG5pbXBvcnQgdHlwZSB7XG4gIE1lc3NhZ2VSZWFjdGlvbkFkZCxcbn0gZnJvbSBcIi4uLy4uL3R5cGVzL21lc3NhZ2VzL21lc3NhZ2VfcmVhY3Rpb25fYWRkLnRzXCI7XG5pbXBvcnQgeyBzbm93Zmxha2VUb0JpZ2ludCB9IGZyb20gXCIuLi8uLi91dGlsL2JpZ2ludC50c1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlTWVzc2FnZVJlYWN0aW9uQWRkKGRhdGE6IERpc2NvcmRHYXRld2F5UGF5bG9hZCkge1xuICBjb25zdCBwYXlsb2FkID0gZGF0YS5kIGFzIE1lc3NhZ2VSZWFjdGlvbkFkZDtcbiAgY29uc3QgbWVzc2FnZSA9IGF3YWl0IGNhY2hlSGFuZGxlcnMuZ2V0KFxuICAgIFwibWVzc2FnZXNcIixcbiAgICBzbm93Zmxha2VUb0JpZ2ludChwYXlsb2FkLm1lc3NhZ2VJZCksXG4gICk7XG5cbiAgaWYgKG1lc3NhZ2UpIHtcbiAgICBjb25zdCByZWFjdGlvbkV4aXN0ZWQgPSBtZXNzYWdlLnJlYWN0aW9ucz8uZmluZChcbiAgICAgIChyZWFjdGlvbikgPT5cbiAgICAgICAgcmVhY3Rpb24uZW1vamkuaWQgPT09IHBheWxvYWQuZW1vamkuaWQgJiZcbiAgICAgICAgcmVhY3Rpb24uZW1vamkubmFtZSA9PT0gcGF5bG9hZC5lbW9qaS5uYW1lLFxuICAgICk7XG5cbiAgICBpZiAocmVhY3Rpb25FeGlzdGVkKSByZWFjdGlvbkV4aXN0ZWQuY291bnQrKztcbiAgICBlbHNlIHtcbiAgICAgIGNvbnN0IG5ld1JlYWN0aW9uID0ge1xuICAgICAgICBjb3VudDogMSxcbiAgICAgICAgbWU6IHNub3dmbGFrZVRvQmlnaW50KHBheWxvYWQudXNlcklkKSA9PT0gYm90SWQsXG4gICAgICAgIGVtb2ppOiB7IC4uLnBheWxvYWQuZW1vamksIGlkOiBwYXlsb2FkLmVtb2ppLmlkIHx8IHVuZGVmaW5lZCB9LFxuICAgICAgfTtcbiAgICAgIG1lc3NhZ2UucmVhY3Rpb25zID0gbWVzc2FnZS5yZWFjdGlvbnNcbiAgICAgICAgPyBbLi4ubWVzc2FnZS5yZWFjdGlvbnMsIG5ld1JlYWN0aW9uXVxuICAgICAgICA6IFtuZXdSZWFjdGlvbl07XG4gICAgfVxuXG4gICAgYXdhaXQgY2FjaGVIYW5kbGVycy5zZXQoXG4gICAgICBcIm1lc3NhZ2VzXCIsXG4gICAgICBzbm93Zmxha2VUb0JpZ2ludChwYXlsb2FkLm1lc3NhZ2VJZCksXG4gICAgICBtZXNzYWdlLFxuICAgICk7XG4gIH1cblxuICBpZiAocGF5bG9hZC5tZW1iZXIgJiYgcGF5bG9hZC5ndWlsZElkKSB7XG4gICAgY29uc3QgZ3VpbGQgPSBhd2FpdCBjYWNoZUhhbmRsZXJzLmdldChcbiAgICAgIFwiZ3VpbGRzXCIsXG4gICAgICBzbm93Zmxha2VUb0JpZ2ludChwYXlsb2FkLmd1aWxkSWQpLFxuICAgICk7XG4gICAgaWYgKGd1aWxkKSB7XG4gICAgICBjb25zdCBkaXNjb3JkZW5vTWVtYmVyID0gYXdhaXQgc3RydWN0dXJlcy5jcmVhdGVEaXNjb3JkZW5vTWVtYmVyKFxuICAgICAgICBwYXlsb2FkLm1lbWJlcixcbiAgICAgICAgZ3VpbGQuaWQsXG4gICAgICApO1xuICAgICAgYXdhaXQgY2FjaGVIYW5kbGVycy5zZXQoXCJtZW1iZXJzXCIsIGRpc2NvcmRlbm9NZW1iZXIuaWQsIGRpc2NvcmRlbm9NZW1iZXIpO1xuICAgIH1cbiAgfVxuXG4gIGV2ZW50SGFuZGxlcnMucmVhY3Rpb25BZGQ/LihcbiAgICBwYXlsb2FkLFxuICAgIG1lc3NhZ2UsXG4gICk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsS0FBSyxFQUFFLGFBQWEsU0FBUSxZQUFjO1NBQzFDLGFBQWEsU0FBUSxjQUFnQjtTQUNyQyxVQUFVLFNBQVEsdUJBQXlCO1NBSzNDLGlCQUFpQixTQUFRLG9CQUFzQjtzQkFFbEMsd0JBQXdCLENBQUMsSUFBMkI7VUFDbEUsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDO1VBQ2hCLE9BQU8sU0FBUyxhQUFhLENBQUMsR0FBRyxFQUNyQyxRQUFVLEdBQ1YsaUJBQWlCLENBQUMsT0FBTyxDQUFDLFNBQVM7UUFHakMsT0FBTztjQUNILGVBQWUsR0FBRyxPQUFPLENBQUMsU0FBUyxFQUFFLElBQUksRUFDNUMsUUFBUSxHQUNQLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUN0QyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUk7O1lBRzFDLGVBQWUsRUFBRSxlQUFlLENBQUMsS0FBSzs7a0JBRWxDLFdBQVc7Z0JBQ2YsS0FBSyxFQUFFLENBQUM7Z0JBQ1IsRUFBRSxFQUFFLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxNQUFNLE1BQU0sS0FBSztnQkFDL0MsS0FBSzt1QkFBTyxPQUFPLENBQUMsS0FBSztvQkFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksU0FBUzs7O1lBRTlELE9BQU8sQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVM7bUJBQzdCLE9BQU8sQ0FBQyxTQUFTO2dCQUFFLFdBQVc7O2dCQUNqQyxXQUFXOzs7Y0FHWixhQUFhLENBQUMsR0FBRyxFQUNyQixRQUFVLEdBQ1YsaUJBQWlCLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FDbkMsT0FBTzs7UUFJUCxPQUFPLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxPQUFPO2NBQzdCLEtBQUssU0FBUyxhQUFhLENBQUMsR0FBRyxFQUNuQyxNQUFRLEdBQ1IsaUJBQWlCLENBQUMsT0FBTyxDQUFDLE9BQU87WUFFL0IsS0FBSztrQkFDRCxnQkFBZ0IsU0FBUyxVQUFVLENBQUMsc0JBQXNCLENBQzlELE9BQU8sQ0FBQyxNQUFNLEVBQ2QsS0FBSyxDQUFDLEVBQUU7a0JBRUosYUFBYSxDQUFDLEdBQUcsRUFBQyxPQUFTLEdBQUUsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLGdCQUFnQjs7O0lBSTVFLGFBQWEsQ0FBQyxXQUFXLEdBQ3ZCLE9BQU8sRUFDUCxPQUFPIn0=