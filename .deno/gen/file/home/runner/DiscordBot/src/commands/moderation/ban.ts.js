import { botId, higherRolePosition, highestRole } from "../../../deps.ts";
import { log } from "../../utils/logger.ts";
import { Embed } from "./../../utils/Embed.ts";
import { createCommand, sendEmbed } from "./../../utils/helpers.ts";
createCommand({
    name: `ban`,
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
            name: "days",
            type: "number",
            maximum: 7,
            minimum: 0,
            defaultValue: 0
        },
        {
            name: "reason",
            type: "...strings",
            defaultValue: "No reason given"
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
            const { guildId , channelId  } = message;
            const authorId = message.authorId;
            const memberId = args.member.id;
            const botHighestRoleId = (await highestRole(guildId, botId)).id;
            const memberHighestRoleId = (await highestRole(guildId, memberId)).id;
            const authorHighestRoleId = (await highestRole(guildId, authorId)).id;
            const canBotBanMember = await higherRolePosition(guildId, botHighestRoleId, memberHighestRoleId);
            const canAuthorBanMember = await higherRolePosition(guildId, authorHighestRoleId, memberHighestRoleId);
            if (!(canBotBanMember && canAuthorBanMember)) {
                const embed = new Embed().setColor("#F04747").setTitle("Could not Ban").setDescription("Cannot ban member with same or higher Roleposition than Author or Bot").setTimestamp();
                return sendEmbed(channelId, embed);
            }
            try {
                const embed = new Embed().setColor("#F04747").setTitle(`Banned from ${message.member?.guild.name}`).addField("Banned By:", `<@${authorId}>`).addField("Reason:", args.reason).setTimestamp();
                await args.member.sendDM({
                    embed
                });
            } catch  {
                log.error(`Could not notify member ${args.member.tag} for ban via DM`);
            }
            const banned = await args.member.ban(guildId, {
                reason: args.reason,
                deleteMessageDays: args.days
            }).catch(log.error);
            if (!banned) return;
            const embed = new Embed().setColor("#F04747").setTitle(`Banned User`).setThumbnail(args.member.avatarURL).addField("User:", args.member.mention, true).addField("Banned By:", `<@${authorId}>`, true).addField("Reason:", args.reason).addField("Deleted DiscordenoMessage History:", `${args.days} Days`).setTimestamp();
            return sendEmbed(channelId, embed);
        } catch  {
            return message.reply("Attempt to ban user has failed!");
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2NvbW1hbmRzL21vZGVyYXRpb24vYmFuLnRzIzA+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvdElkLCBoaWdoZXJSb2xlUG9zaXRpb24sIGhpZ2hlc3RSb2xlIH0gZnJvbSBcIi4uLy4uLy4uL2RlcHMudHNcIjtcbmltcG9ydCB7IGxvZyB9IGZyb20gXCIuLi8uLi91dGlscy9sb2dnZXIudHNcIjtcbmltcG9ydCB7IEVtYmVkIH0gZnJvbSBcIi4vLi4vLi4vdXRpbHMvRW1iZWQudHNcIjtcbmltcG9ydCB7IGNyZWF0ZUNvbW1hbmQsIHNlbmRFbWJlZCB9IGZyb20gXCIuLy4uLy4uL3V0aWxzL2hlbHBlcnMudHNcIjtcblxuY3JlYXRlQ29tbWFuZCh7XG4gIG5hbWU6IGBiYW5gLFxuICBndWlsZE9ubHk6IHRydWUsXG4gIGFyZ3VtZW50czogW1xuICAgIHtcbiAgICAgIG5hbWU6IFwibWVtYmVyXCIsXG4gICAgICB0eXBlOiBcIm1lbWJlclwiLFxuICAgICAgbWlzc2luZzogKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgcmV0dXJuIG1lc3NhZ2UucmVwbHkoXCJVc2VyIG5vdCBmb3VuZCFcIik7XG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogXCJkYXlzXCIsXG4gICAgICB0eXBlOiBcIm51bWJlclwiLFxuICAgICAgbWF4aW11bTogNyxcbiAgICAgIG1pbmltdW06IDAsXG4gICAgICBkZWZhdWx0VmFsdWU6IDAsXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiBcInJlYXNvblwiLFxuICAgICAgdHlwZTogXCIuLi5zdHJpbmdzXCIsXG4gICAgICBkZWZhdWx0VmFsdWU6IFwiTm8gcmVhc29uIGdpdmVuXCIsXG4gICAgfSxcbiAgXSBhcyBjb25zdCxcbiAgdXNlclNlcnZlclBlcm1pc3Npb25zOiBbXCJCQU5fTUVNQkVSU1wiXSxcbiAgYm90U2VydmVyUGVybWlzc2lvbnM6IFtcIkJBTl9NRU1CRVJTXCJdLFxuICBib3RDaGFubmVsUGVybWlzc2lvbnM6IFtcIlZJRVdfQ0hBTk5FTFwiLCBcIlNFTkRfTUVTU0FHRVNcIiwgXCJFTUJFRF9MSU5LU1wiXSxcbiAgZXhlY3V0ZTogYXN5bmMgKG1lc3NhZ2UsIGFyZ3MpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyBndWlsZElkLCBjaGFubmVsSWQgfSA9IG1lc3NhZ2U7XG4gICAgICBjb25zdCBhdXRob3JJZCA9IG1lc3NhZ2UuYXV0aG9ySWQ7XG4gICAgICBjb25zdCBtZW1iZXJJZCA9IGFyZ3MubWVtYmVyLmlkO1xuXG4gICAgICBjb25zdCBib3RIaWdoZXN0Um9sZUlkID0gKGF3YWl0IGhpZ2hlc3RSb2xlKGd1aWxkSWQsIGJvdElkKSkhLmlkO1xuICAgICAgY29uc3QgbWVtYmVySGlnaGVzdFJvbGVJZCA9IChhd2FpdCBoaWdoZXN0Um9sZShndWlsZElkLCBtZW1iZXJJZCkpIS5pZDtcbiAgICAgIGNvbnN0IGF1dGhvckhpZ2hlc3RSb2xlSWQgPSAoYXdhaXQgaGlnaGVzdFJvbGUoZ3VpbGRJZCwgYXV0aG9ySWQpKSEuaWQ7XG5cbiAgICAgIGNvbnN0IGNhbkJvdEJhbk1lbWJlciA9IGF3YWl0IGhpZ2hlclJvbGVQb3NpdGlvbihcbiAgICAgICAgZ3VpbGRJZCxcbiAgICAgICAgYm90SGlnaGVzdFJvbGVJZCxcbiAgICAgICAgbWVtYmVySGlnaGVzdFJvbGVJZCxcbiAgICAgICk7XG4gICAgICBjb25zdCBjYW5BdXRob3JCYW5NZW1iZXIgPSBhd2FpdCBoaWdoZXJSb2xlUG9zaXRpb24oXG4gICAgICAgIGd1aWxkSWQsXG4gICAgICAgIGF1dGhvckhpZ2hlc3RSb2xlSWQsXG4gICAgICAgIG1lbWJlckhpZ2hlc3RSb2xlSWQsXG4gICAgICApO1xuXG4gICAgICBpZiAoIShjYW5Cb3RCYW5NZW1iZXIgJiYgY2FuQXV0aG9yQmFuTWVtYmVyKSkge1xuICAgICAgICBjb25zdCBlbWJlZCA9IG5ldyBFbWJlZCgpXG4gICAgICAgICAgLnNldENvbG9yKFwiI0YwNDc0N1wiKVxuICAgICAgICAgIC5zZXRUaXRsZShcIkNvdWxkIG5vdCBCYW5cIilcbiAgICAgICAgICAuc2V0RGVzY3JpcHRpb24oXG4gICAgICAgICAgICBcIkNhbm5vdCBiYW4gbWVtYmVyIHdpdGggc2FtZSBvciBoaWdoZXIgUm9sZXBvc2l0aW9uIHRoYW4gQXV0aG9yIG9yIEJvdFwiLFxuICAgICAgICAgIClcbiAgICAgICAgICAuc2V0VGltZXN0YW1wKCk7XG4gICAgICAgIHJldHVybiBzZW5kRW1iZWQoY2hhbm5lbElkLCBlbWJlZCk7XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGVtYmVkID0gbmV3IEVtYmVkKClcbiAgICAgICAgICAuc2V0Q29sb3IoXCIjRjA0NzQ3XCIpXG4gICAgICAgICAgLnNldFRpdGxlKGBCYW5uZWQgZnJvbSAke21lc3NhZ2UubWVtYmVyPy5ndWlsZC5uYW1lfWApXG4gICAgICAgICAgLmFkZEZpZWxkKFwiQmFubmVkIEJ5OlwiLCBgPEAke2F1dGhvcklkfT5gKVxuICAgICAgICAgIC5hZGRGaWVsZChcIlJlYXNvbjpcIiwgYXJncy5yZWFzb24pXG4gICAgICAgICAgLnNldFRpbWVzdGFtcCgpO1xuICAgICAgICBhd2FpdCBhcmdzLm1lbWJlci5zZW5kRE0oeyBlbWJlZCB9KTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICBsb2cuZXJyb3IoYENvdWxkIG5vdCBub3RpZnkgbWVtYmVyICR7YXJncy5tZW1iZXIudGFnfSBmb3IgYmFuIHZpYSBETWApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBiYW5uZWQgPSBhd2FpdCBhcmdzLm1lbWJlclxuICAgICAgICAuYmFuKGd1aWxkSWQsIHtcbiAgICAgICAgICByZWFzb246IGFyZ3MucmVhc29uLFxuICAgICAgICAgIGRlbGV0ZU1lc3NhZ2VEYXlzOiBhcmdzLmRheXMgYXMgQmFuRGVsZXRlTWVzc2FnZURheXMsXG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChsb2cuZXJyb3IpO1xuICAgICAgaWYgKCFiYW5uZWQpIHJldHVybjtcblxuICAgICAgY29uc3QgZW1iZWQgPSBuZXcgRW1iZWQoKVxuICAgICAgICAuc2V0Q29sb3IoXCIjRjA0NzQ3XCIpXG4gICAgICAgIC5zZXRUaXRsZShgQmFubmVkIFVzZXJgKVxuICAgICAgICAuc2V0VGh1bWJuYWlsKGFyZ3MubWVtYmVyLmF2YXRhclVSTClcbiAgICAgICAgLmFkZEZpZWxkKFwiVXNlcjpcIiwgYXJncy5tZW1iZXIubWVudGlvbiwgdHJ1ZSlcbiAgICAgICAgLmFkZEZpZWxkKFwiQmFubmVkIEJ5OlwiLCBgPEAke2F1dGhvcklkfT5gLCB0cnVlKVxuICAgICAgICAuYWRkRmllbGQoXCJSZWFzb246XCIsIGFyZ3MucmVhc29uKVxuICAgICAgICAuYWRkRmllbGQoXCJEZWxldGVkIERpc2NvcmRlbm9NZXNzYWdlIEhpc3Rvcnk6XCIsIGAke2FyZ3MuZGF5c30gRGF5c2ApXG4gICAgICAgIC5zZXRUaW1lc3RhbXAoKTtcblxuICAgICAgcmV0dXJuIHNlbmRFbWJlZChjaGFubmVsSWQsIGVtYmVkKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBtZXNzYWdlLnJlcGx5KFwiQXR0ZW1wdCB0byBiYW4gdXNlciBoYXMgZmFpbGVkIVwiKTtcbiAgICB9XG4gIH0sXG59KTtcblxudHlwZSBCYW5EZWxldGVNZXNzYWdlRGF5cyA9IDAgfCAxIHwgMiB8IDMgfCA0IHwgNSB8IDYgfCA3O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLEtBQUssRUFBRSxrQkFBa0IsRUFBRSxXQUFXLFNBQVEsZ0JBQWtCO1NBQ2hFLEdBQUcsU0FBUSxxQkFBdUI7U0FDbEMsS0FBSyxTQUFRLHNCQUF3QjtTQUNyQyxhQUFhLEVBQUUsU0FBUyxTQUFRLHdCQUEwQjtBQUVuRSxhQUFhO0lBQ1gsSUFBSSxHQUFHLEdBQUc7SUFDVixTQUFTLEVBQUUsSUFBSTtJQUNmLFNBQVM7O1lBRUwsSUFBSSxH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