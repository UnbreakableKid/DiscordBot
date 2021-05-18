import { snowflakeToBigint } from "../../../deps.ts";
import { Embed } from "./../../utils/Embed.ts";
import { createCommand, sendEmbed } from "./../../utils/helpers.ts";
createCommand({
    name: `unban`,
    guildOnly: true,
    arguments: [
        {
            name: "memberId",
            type: "snowflake",
            missing: (message)=>{
                return message.reply("User not found!");
            }
        }, 
    ],
    userServerPermissions: [
        "BAN_MEMBERS"
    ],
    botServerPermissions: [
        "BAN_MEMBERS"
    ],
    botChannelPermissions: [
        "VIEW_CHANNEL",
        "SEND_MESSAGES",
        "EMBED_LINKS"
    ],
    execute: async (message, args)=>{
        try {
            await message.guild?.unban(snowflakeToBigint(args.memberId));
            const embed = new Embed().setColor("#43b581").setTitle(`Unbanned User`).setThumbnail(message.member.avatarURL).addField("User ID:", args.memberId, true).addField("Unbanned By:", `<@${message.authorId}>`, true).setTimestamp();
            return sendEmbed(message.channelId, embed);
        } catch  {
            return message.reply("Attempt to unban user has failed!");
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2NvbW1hbmRzL21vZGVyYXRpb24vdW5iYW4udHMjMD4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgc25vd2ZsYWtlVG9CaWdpbnQgfSBmcm9tIFwiLi4vLi4vLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgRW1iZWQgfSBmcm9tIFwiLi8uLi8uLi91dGlscy9FbWJlZC50c1wiO1xuaW1wb3J0IHsgY3JlYXRlQ29tbWFuZCwgc2VuZEVtYmVkIH0gZnJvbSBcIi4vLi4vLi4vdXRpbHMvaGVscGVycy50c1wiO1xuXG5jcmVhdGVDb21tYW5kKHtcbiAgbmFtZTogYHVuYmFuYCxcbiAgZ3VpbGRPbmx5OiB0cnVlLFxuICBhcmd1bWVudHM6IFtcbiAgICB7XG4gICAgICBuYW1lOiBcIm1lbWJlcklkXCIsXG4gICAgICB0eXBlOiBcInNub3dmbGFrZVwiLFxuICAgICAgbWlzc2luZzogKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgcmV0dXJuIG1lc3NhZ2UucmVwbHkoXCJVc2VyIG5vdCBmb3VuZCFcIik7XG4gICAgICB9LFxuICAgIH0sXG4gIF0gYXMgY29uc3QsXG4gIHVzZXJTZXJ2ZXJQZXJtaXNzaW9uczogW1wiQkFOX01FTUJFUlNcIl0sXG4gIGJvdFNlcnZlclBlcm1pc3Npb25zOiBbXCJCQU5fTUVNQkVSU1wiXSxcbiAgYm90Q2hhbm5lbFBlcm1pc3Npb25zOiBbXCJWSUVXX0NIQU5ORUxcIiwgXCJTRU5EX01FU1NBR0VTXCIsIFwiRU1CRURfTElOS1NcIl0sXG4gIGV4ZWN1dGU6IGFzeW5jIChtZXNzYWdlLCBhcmdzKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IG1lc3NhZ2UuZ3VpbGQ/LnVuYmFuKHNub3dmbGFrZVRvQmlnaW50KGFyZ3MubWVtYmVySWQpKTtcblxuICAgICAgY29uc3QgZW1iZWQgPSBuZXcgRW1iZWQoKVxuICAgICAgICAuc2V0Q29sb3IoXCIjNDNiNTgxXCIpXG4gICAgICAgIC5zZXRUaXRsZShgVW5iYW5uZWQgVXNlcmApXG4gICAgICAgIC5zZXRUaHVtYm5haWwobWVzc2FnZS5tZW1iZXIhLmF2YXRhclVSTClcbiAgICAgICAgLmFkZEZpZWxkKFwiVXNlciBJRDpcIiwgYXJncy5tZW1iZXJJZCwgdHJ1ZSlcbiAgICAgICAgLmFkZEZpZWxkKFwiVW5iYW5uZWQgQnk6XCIsIGA8QCR7bWVzc2FnZS5hdXRob3JJZH0+YCwgdHJ1ZSlcbiAgICAgICAgLnNldFRpbWVzdGFtcCgpO1xuXG4gICAgICByZXR1cm4gc2VuZEVtYmVkKG1lc3NhZ2UuY2hhbm5lbElkLCBlbWJlZCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gbWVzc2FnZS5yZXBseShcIkF0dGVtcHQgdG8gdW5iYW4gdXNlciBoYXMgZmFpbGVkIVwiKTtcbiAgICB9XG4gIH0sXG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxpQkFBaUIsU0FBUSxnQkFBa0I7U0FDM0MsS0FBSyxTQUFRLHNCQUF3QjtTQUNyQyxhQUFhLEVBQUUsU0FBUyxTQUFRLHdCQUEwQjtBQUVuRSxhQUFhO0lBQ1gsSUFBSSxHQUFHLEtBQUs7SUFDWixTQUFTLEVBQUUsSUFBSTtJQUNmLFNBQVM7O1lBRUwsSUFBSSxHQUFFLFFBQVU7WUFDaEIsSUFBSSxHQUFFLFNBQVc7WUFDakIsT0FBTyxHQUFHLE9BQU87dUJBQ1IsT0FBTyxDQUFDLEtBQUssRUFBQyxlQUFpQjs7OztJQUk1QyxxQkFBcUI7U0FBRyxXQUFhOztJQUNyQyxvQkFBb0I7U0FBRyxXQUFhOztJQUNwQyxxQkFBcUI7U0FBRyxZQUFjO1NBQUUsYUFBZTtTQUFFLFdBQWE7O0lBQ3RFLE9BQU8sU0FBUyxPQUFPLEVBQUUsSUFBSTs7a0JBRW5CLE9BQU8sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxRQUFRO2tCQUVwRCxLQUFLLE9BQU8sS0FBSyxHQUNwQixRQUFRLEVBQUMsT0FBUyxHQUNsQixRQUFRLEVBQUUsYUFBYSxHQUN2QixZQUFZLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBRSxTQUFTLEVBQ3RDLFFBQVEsRUFBQyxRQUFVLEdBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQ3hDLFFBQVEsRUFBQyxZQUFjLElBQUcsRUFBRSxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksRUFDdkQsWUFBWTttQkFFUixTQUFTLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxLQUFLOzttQkFFbEMsT0FBTyxDQUFDLEtBQUssRUFBQyxpQ0FBbUMifQ==