import { bot } from "../../../cache.ts";
import { Embed } from "../../utils/Embed.ts";
import { createCommand } from "../../utils/helpers.ts";
import { getMusicLength } from "../../utils/voice.ts";
createCommand({
  name: "playing",
  aliases: [
    "np",
    "nowplaying",
  ],
  guildOnly: true,
  execute(message) {
    const player = bot.lavadenoManager.players.get(message.guildId.toString());
    const queue = bot.musicQueues.get(message.guildId);
    if (!player || !queue) {
      return message.reply(`The bot is not currently playing music`);
    }
    const embed = new Embed().setAuthor(
      `${message.tag}`,
      message.member?.avatarURL,
    ).setTitle(
      player.playing && queue
        ? `Now Playing - ${queue[0].info.title}`
        : `Not playing anything`,
      player.playing && queue ? queue[0].info.uri : "",
    ).setDescription(
      player.playing && queue
        ? `**Progress:** ${getMusicLength(player.position)}/${
          getMusicLength(queue[0].info.length)
        }`
        : `You're not playing any music, add a music using im!play (music)`,
    ).setTimestamp(player.timestamp);
    return message.send({
      embed,
    });
  },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2NvbW1hbmRzL3ZvaWNlL3BsYXlpbmcudHMjOD4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYm90IH0gZnJvbSBcIi4uLy4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyBFbWJlZCB9IGZyb20gXCIuLi8uLi91dGlscy9FbWJlZC50c1wiO1xuaW1wb3J0IHsgY3JlYXRlQ29tbWFuZCB9IGZyb20gXCIuLi8uLi91dGlscy9oZWxwZXJzLnRzXCI7XG5pbXBvcnQgeyBnZXRNdXNpY0xlbmd0aCB9IGZyb20gXCIuLi8uLi91dGlscy92b2ljZS50c1wiO1xuXG5jcmVhdGVDb21tYW5kKHtcbiAgbmFtZTogXCJwbGF5aW5nXCIsXG4gIGFsaWFzZXM6IFtcIm5wXCIsIFwibm93cGxheWluZ1wiXSxcbiAgZ3VpbGRPbmx5OiB0cnVlLFxuICBleGVjdXRlKG1lc3NhZ2UpIHtcbiAgICBjb25zdCBwbGF5ZXIgPSBib3QubGF2YWRlbm9NYW5hZ2VyLnBsYXllcnMuZ2V0KG1lc3NhZ2UuZ3VpbGRJZC50b1N0cmluZygpKTtcbiAgICBjb25zdCBxdWV1ZSA9IGJvdC5tdXNpY1F1ZXVlcy5nZXQobWVzc2FnZS5ndWlsZElkKTtcblxuICAgIGlmICghcGxheWVyIHx8ICFxdWV1ZSkge1xuICAgICAgcmV0dXJuIG1lc3NhZ2UucmVwbHkoYFRoZSBib3QgaXMgbm90IGN1cnJlbnRseSBwbGF5aW5nIG11c2ljYCk7XG4gICAgfVxuXG4gICAgY29uc3QgZW1iZWQgPSBuZXcgRW1iZWQoKVxuICAgICAgLnNldEF1dGhvcihcbiAgICAgICAgYCR7bWVzc2FnZS50YWd9YCxcbiAgICAgICAgbWVzc2FnZS5tZW1iZXI/LmF2YXRhclVSTCxcbiAgICAgIClcbiAgICAgIC5zZXRUaXRsZShcbiAgICAgICAgcGxheWVyLnBsYXlpbmcgJiYgcXVldWVcbiAgICAgICAgICA/IGBOb3cgUGxheWluZyAtICR7cXVldWVbMF0uaW5mby50aXRsZX1gXG4gICAgICAgICAgOiBgTm90IHBsYXlpbmcgYW55dGhpbmdgLFxuICAgICAgICBwbGF5ZXIucGxheWluZyAmJiBxdWV1ZSA/IHF1ZXVlWzBdLmluZm8udXJpIDogXCJcIixcbiAgICAgIClcbiAgICAgIC5zZXREZXNjcmlwdGlvbihcbiAgICAgICAgcGxheWVyLnBsYXlpbmcgJiYgcXVldWVcbiAgICAgICAgICA/IGAqKlByb2dyZXNzOioqICR7Z2V0TXVzaWNMZW5ndGgocGxheWVyLnBvc2l0aW9uKX0vJHtcbiAgICAgICAgICAgIGdldE11c2ljTGVuZ3RoKFxuICAgICAgICAgICAgICBxdWV1ZVswXS5pbmZvLmxlbmd0aCxcbiAgICAgICAgICAgIClcbiAgICAgICAgICB9YFxuICAgICAgICAgIDogYFlvdSdyZSBub3QgcGxheWluZyBhbnkgbXVzaWMsIGFkZCBhIG11c2ljIHVzaW5nIGltIXBsYXkgKG11c2ljKWAsXG4gICAgICApXG4gICAgICAuc2V0VGltZXN0YW1wKHBsYXllci50aW1lc3RhbXApO1xuXG4gICAgcmV0dXJuIG1lc3NhZ2Uuc2VuZCh7IGVtYmVkIH0pO1xuICB9LFxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsR0FBRyxTQUFRLGlCQUFtQjtTQUM5QixLQUFLLFNBQVEsb0JBQXNCO1NBQ25DLGFBQWEsU0FBUSxzQkFBd0I7U0FDN0MsY0FBYyxTQUFRLG9CQUFzQjtBQUVyRCxhQUFhO0lBQ1gsSUFBSSxHQUFFLE9BQVM7SUFDZixPQUFPO1NBQUcsRUFBSTtTQUFFLFVBQVk7O0lBQzVCLFNBQVMsRUFBRSxJQUFJO0lBQ2YsT0FBTyxFQUFDLE9BQU87Y0FDUCxNQUFNLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUTtjQUNqRSxLQUFLLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU87YUFFNUMsTUFBTSxLQUFLLEtBQUs7bUJBQ1osT0FBTyxDQUFDLEtBQUssRUFBRSxzQ0FBc0M7O2NBR3hELEtBQUssT0FBTyxLQUFLLEdBQ3BCLFNBQVMsSUFDTCxPQUFPLENBQUMsR0FBRyxJQUNkLE9BQU8sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUUxQixRQUFRLENBQ1AsTUFBTSxDQUFDLE9BQU8sSUFBSSxLQUFLLElBQ2xCLGNBQWMsRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLE1BQ25DLG9CQUFvQixHQUN6QixNQUFNLENBQUMsT0FBTyxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLE9BRTVDLGNBQWMsQ0FDYixNQUFNLENBQUMsT0FBTyxJQUFJLEtBQUssSUFDbEIsY0FBYyxFQUFFLGNBQWMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsRUFDbEQsY0FBYyxDQUNaLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sT0FHckIsK0RBQStELEdBRXJFLFlBQVksQ0FBQyxNQUFNLENBQUMsU0FBUztlQUV6QixPQUFPLENBQUMsSUFBSTtZQUFHLEtBQUsifQ==
