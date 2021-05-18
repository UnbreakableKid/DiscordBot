import { Embed } from "../../utils/Embed.ts";
import { createCommand, sendEmbed } from "../../utils/helpers.ts";
createCommand({
    name: `kick`,
    guildOnly: true,
    arguments: [
        {
            name: "member",
            type: "member",
            missing: (message)=>{
                return message.reply("User not found!");
            }
        },
        {
            name: "reason",
            type: "...strings",
            defaultValue: "No reason given"
        }, 
    ],
    userServerPermissions: [
        "KICK_MEMBERS", 
    ],
    botServerPermissions: [
        "KICK_MEMBERS", 
    ],
    execute: async (message, args)=>{
        try {
            await args.member.kick(message.guildId, args.reason);
            const embed = new Embed().setColor("#FFA500").setTitle(`Kicked User`).addField("User:", args.member.mention, true).addField("Kicked By:", `<@${message.authorId}>`, true).addField("Reason:", args.reason).setTimestamp();
            return sendEmbed(message.channelId, embed);
        } catch  {
            return message.send("Attempt to kick user has failed!");
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2NvbW1hbmRzL21vZGVyYXRpb24va2ljay50cyMwPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXNjb3JkZW5vTWVtYmVyIH0gZnJvbSBcIi4uLy4uLy4uL2RlcHMudHNcIjtcbmltcG9ydCB7IEVtYmVkIH0gZnJvbSBcIi4uLy4uL3V0aWxzL0VtYmVkLnRzXCI7XG5pbXBvcnQgeyBjcmVhdGVDb21tYW5kLCBzZW5kRW1iZWQgfSBmcm9tIFwiLi4vLi4vdXRpbHMvaGVscGVycy50c1wiO1xuXG5jcmVhdGVDb21tYW5kKHtcbiAgbmFtZTogYGtpY2tgLFxuICBndWlsZE9ubHk6IHRydWUsXG4gIGFyZ3VtZW50czogW1xuICAgIHtcbiAgICAgIG5hbWU6IFwibWVtYmVyXCIsXG4gICAgICB0eXBlOiBcIm1lbWJlclwiLFxuICAgICAgbWlzc2luZzogKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgcmV0dXJuIG1lc3NhZ2UucmVwbHkoXCJVc2VyIG5vdCBmb3VuZCFcIik7XG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogXCJyZWFzb25cIixcbiAgICAgIHR5cGU6IFwiLi4uc3RyaW5nc1wiLFxuICAgICAgZGVmYXVsdFZhbHVlOiBcIk5vIHJlYXNvbiBnaXZlblwiLFxuICAgIH0sXG4gIF0gYXMgY29uc3QsXG4gIHVzZXJTZXJ2ZXJQZXJtaXNzaW9uczogW1xuICAgIFwiS0lDS19NRU1CRVJTXCIsXG4gIF0sXG4gIGJvdFNlcnZlclBlcm1pc3Npb25zOiBbXG4gICAgXCJLSUNLX01FTUJFUlNcIixcbiAgXSxcbiAgZXhlY3V0ZTogYXN5bmMgKG1lc3NhZ2UsIGFyZ3MpID0+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgYXJncy5tZW1iZXIua2ljayhtZXNzYWdlLmd1aWxkSWQsIGFyZ3MucmVhc29uKTtcblxuICAgICAgY29uc3QgZW1iZWQgPSBuZXcgRW1iZWQoKVxuICAgICAgICAuc2V0Q29sb3IoXCIjRkZBNTAwXCIpXG4gICAgICAgIC5zZXRUaXRsZShgS2lja2VkIFVzZXJgKVxuICAgICAgICAuYWRkRmllbGQoXCJVc2VyOlwiLCBhcmdzLm1lbWJlci5tZW50aW9uLCB0cnVlKVxuICAgICAgICAuYWRkRmllbGQoXCJLaWNrZWQgQnk6XCIsIGA8QCR7bWVzc2FnZS5hdXRob3JJZH0+YCwgdHJ1ZSlcbiAgICAgICAgLmFkZEZpZWxkKFwiUmVhc29uOlwiLCBhcmdzLnJlYXNvbilcbiAgICAgICAgLnNldFRpbWVzdGFtcCgpO1xuXG4gICAgICByZXR1cm4gc2VuZEVtYmVkKG1lc3NhZ2UuY2hhbm5lbElkLCBlbWJlZCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gbWVzc2FnZS5zZW5kKFwiQXR0ZW1wdCB0byBraWNrIHVzZXIgaGFzIGZhaWxlZCFcIik7XG4gICAgfVxuICB9LFxufSk7XG5cbmludGVyZmFjZSBLaWNrQXJncyB7XG4gIG1lbWJlcjogRGlzY29yZGVub01lbWJlcjtcbiAgcmVhc29uOiBzdHJpbmc7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQ1MsS0FBSyxTQUFRLG9CQUFzQjtTQUNuQyxhQUFhLEVBQUUsU0FBUyxTQUFRLHNCQUF3QjtBQUVqRSxhQUFhO0lBQ1gsSUFBSSxHQUFHLElBQUk7SUFDWCxTQUFTLEVBQUUsSUFBSTtJQUNmLFNBQVM7O1lBRUwsSUFBSSxHQUFFLE1BQVE7WUFDZCxJQUFJLEdBQUUsTUFBUTtZQUNkLE9BQU8sR0FBRyxPQUFPO3VCQUNSLE9BQU8sQ0FBQyxLQUFLLEVBQUMsZUFBaUI7Ozs7WUFJeEMsSUFBSSxHQUFFLE1BQVE7WUFDZCxJQUFJLEdBQUUsVUFBWTtZQUNsQixZQUFZLEdBQUUsZUFBaUI7OztJQUduQyxxQkFBcUI7U0FDbkIsWUFBYzs7SUFFaEIsb0JBQW9CO1NBQ2xCLFlBQWM7O0lBRWhCLE9BQU8sU0FBUyxPQUFPLEVBQUUsSUFBSTs7a0JBRW5CLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU07a0JBRTdDLEtBQUssT0FBTyxLQUFLLEdBQ3BCLFFBQVEsRUFBQyxPQUFTLEdBQ2xCLFFBQVEsRUFBRSxXQUFXLEdBQ3JCLFFBQVEsRUFBQyxLQUFPLEdBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUMzQyxRQUFRLEVBQUMsVUFBWSxJQUFHLEVBQUUsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLEVBQ3JELFFBQVEsRUFBQyxPQUFTLEdBQUUsSUFBSSxDQUFDLE1BQU0sRUFDL0IsWUFBWTttQkFFUixTQUFTLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxLQUFLOzttQkFFbEMsT0FBTyxDQUFDLElBQUksRUFBQyxnQ0FBa0MifQ==