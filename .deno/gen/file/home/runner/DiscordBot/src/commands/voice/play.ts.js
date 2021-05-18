import { bot } from "../../../cache.ts";
import { createCommand } from "../../utils/helpers.ts";
import {
  addPlaylistToQueue,
  addSoundToQueue,
  validURL,
} from "../../utils/voice.ts";
createCommand({
  name: "play",
  aliases: [
    "p",
  ],
  guildOnly: true,
  arguments: [
    {
      type: "...strings",
      name: "query",
      required: true,
    },
  ],
  async execute(message, args) {
    const player = bot.lavadenoManager.players.get(message.guildId.toString());
    if (!player || !player.connected) {
      const voiceState = message.guild?.voiceStates.get(message.authorId);
      if (!voiceState?.channelId) {
        return message.reply(`You first need to join a voice channel!`);
      }
      if (player) {
        player.connect(voiceState.channelId.toString(), {
          selfDeaf: true,
        });
      } else {
        const newPlayer = bot.lavadenoManager.create(
          message.guildId.toString(),
        );
        newPlayer.connect(voiceState.channelId.toString(), {
          selfDeaf: true,
        });
      }
      await message.reply(`Successfully joined the channel!`);
    }
    const trackSearch = validURL(args.query)
      ? args.query
      : `ytsearch:${args.query}`;
    const result = await bot.lavadenoManager.search(trackSearch);
    switch (result.loadType) {
      case "TRACK_LOADED":
      case "SEARCH_RESULT": {
        return addSoundToQueue(message, result.tracks[0]);
      }
      case "PLAYLIST_LOADED": {
        return addPlaylistToQueue(
          message,
          result.playlistInfo.name,
          result.tracks,
        );
      }
      default:
        return message.reply(`Could not find any song with that name!`);
    }
  },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2NvbW1hbmRzL3ZvaWNlL3BsYXkudHMjOD4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYm90IH0gZnJvbSBcIi4uLy4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyBjcmVhdGVDb21tYW5kIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2hlbHBlcnMudHNcIjtcbmltcG9ydCB7XG4gIGFkZFBsYXlsaXN0VG9RdWV1ZSxcbiAgYWRkU291bmRUb1F1ZXVlLFxuICB2YWxpZFVSTCxcbn0gZnJvbSBcIi4uLy4uL3V0aWxzL3ZvaWNlLnRzXCI7XG5cbmNyZWF0ZUNvbW1hbmQoe1xuICBuYW1lOiBcInBsYXlcIixcbiAgYWxpYXNlczogW1wicFwiXSxcbiAgZ3VpbGRPbmx5OiB0cnVlLFxuICBhcmd1bWVudHM6IFt7IHR5cGU6IFwiLi4uc3RyaW5nc1wiLCBuYW1lOiBcInF1ZXJ5XCIsIHJlcXVpcmVkOiB0cnVlIH1dLFxuICBhc3luYyBleGVjdXRlKG1lc3NhZ2UsIGFyZ3MpIHtcbiAgICBjb25zdCBwbGF5ZXIgPSBib3QubGF2YWRlbm9NYW5hZ2VyLnBsYXllcnMuZ2V0KFxuICAgICAgbWVzc2FnZS5ndWlsZElkLnRvU3RyaW5nKCksXG4gICAgKTtcblxuICAgIGlmICghcGxheWVyIHx8ICFwbGF5ZXIuY29ubmVjdGVkKSB7XG4gICAgICBjb25zdCB2b2ljZVN0YXRlID0gbWVzc2FnZS5ndWlsZD8udm9pY2VTdGF0ZXMuZ2V0KG1lc3NhZ2UuYXV0aG9ySWQpO1xuICAgICAgaWYgKCF2b2ljZVN0YXRlPy5jaGFubmVsSWQpIHtcbiAgICAgICAgcmV0dXJuIG1lc3NhZ2UucmVwbHkoYFlvdSBmaXJzdCBuZWVkIHRvIGpvaW4gYSB2b2ljZSBjaGFubmVsIWApO1xuICAgICAgfVxuXG4gICAgICBpZiAocGxheWVyKSB7XG4gICAgICAgIHBsYXllci5jb25uZWN0KHZvaWNlU3RhdGUuY2hhbm5lbElkLnRvU3RyaW5nKCksIHtcbiAgICAgICAgICBzZWxmRGVhZjogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBuZXdQbGF5ZXIgPSBib3QubGF2YWRlbm9NYW5hZ2VyLmNyZWF0ZShcbiAgICAgICAgICBtZXNzYWdlLmd1aWxkSWQudG9TdHJpbmcoKSxcbiAgICAgICAgKTtcbiAgICAgICAgbmV3UGxheWVyLmNvbm5lY3Qodm9pY2VTdGF0ZS5jaGFubmVsSWQudG9TdHJpbmcoKSwge1xuICAgICAgICAgIHNlbGZEZWFmOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgbWVzc2FnZS5yZXBseShgU3VjY2Vzc2Z1bGx5IGpvaW5lZCB0aGUgY2hhbm5lbCFgKTtcbiAgICB9XG5cbiAgICBjb25zdCB0cmFja1NlYXJjaCA9IHZhbGlkVVJMKGFyZ3MucXVlcnkpXG4gICAgICA/IGFyZ3MucXVlcnlcbiAgICAgIDogYHl0c2VhcmNoOiR7YXJncy5xdWVyeX1gO1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGJvdC5sYXZhZGVub01hbmFnZXIuc2VhcmNoKHRyYWNrU2VhcmNoKTtcblxuICAgIHN3aXRjaCAocmVzdWx0LmxvYWRUeXBlKSB7XG4gICAgICBjYXNlIFwiVFJBQ0tfTE9BREVEXCI6XG4gICAgICBjYXNlIFwiU0VBUkNIX1JFU1VMVFwiOiB7XG4gICAgICAgIHJldHVybiBhZGRTb3VuZFRvUXVldWUobWVzc2FnZSwgcmVzdWx0LnRyYWNrc1swXSk7XG4gICAgICB9XG4gICAgICBjYXNlIFwiUExBWUxJU1RfTE9BREVEXCI6IHtcbiAgICAgICAgcmV0dXJuIGFkZFBsYXlsaXN0VG9RdWV1ZShcbiAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgIHJlc3VsdC5wbGF5bGlzdEluZm8hLm5hbWUsXG4gICAgICAgICAgcmVzdWx0LnRyYWNrcyxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBtZXNzYWdlLnJlcGx5KGBDb3VsZCBub3QgZmluZCBhbnkgc29uZyB3aXRoIHRoYXQgbmFtZSFgKTtcbiAgICB9XG4gIH0sXG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxHQUFHLFNBQVEsaUJBQW1CO1NBQzlCLGFBQWEsU0FBUSxzQkFBd0I7U0FFcEQsa0JBQWtCLEVBQ2xCLGVBQWUsRUFDZixRQUFRLFNBQ0gsb0JBQXNCO0FBRTdCLGFBQWE7SUFDWCxJQUFJLEdBQUUsSUFBTTtJQUNaLE9BQU87U0FBRyxDQUFHOztJQUNiLFNBQVMsRUFBRSxJQUFJO0lBQ2YsU0FBUzs7WUFBSyxJQUFJLEdBQUUsVUFBWTtZQUFFLElBQUksR0FBRSxLQUFPO1lBQUUsUUFBUSxFQUFFLElBQUk7OztVQUN6RCxPQUFPLEVBQUMsT0FBTyxFQUFFLElBQUk7Y0FDbkIsTUFBTSxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FDNUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRO2FBR3JCLE1BQU0sS0FBSyxNQUFNLENBQUMsU0FBUztrQkFDeEIsVUFBVSxHQUFHLE9BQU8sQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUTtpQkFDN0QsVUFBVSxFQUFFLFNBQVM7dUJBQ2pCLE9BQU8sQ0FBQyxLQUFLLEVBQUUsdUNBQXVDOztnQkFHM0QsTUFBTTtnQkFDUixNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsUUFBUTtvQkFDMUMsUUFBUSxFQUFFLElBQUk7OztzQkFHVixTQUFTLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQzFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUTtnQkFFMUIsU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFFBQVE7b0JBQzdDLFFBQVEsRUFBRSxJQUFJOzs7a0JBSVosT0FBTyxDQUFDLEtBQUssRUFBRSxnQ0FBZ0M7O2NBR2pELFdBQVcsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssSUFDbkMsSUFBSSxDQUFDLEtBQUssSUFDVCxTQUFTLEVBQUUsSUFBSSxDQUFDLEtBQUs7Y0FDcEIsTUFBTSxTQUFTLEdBQUcsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFdBQVc7ZUFFbkQsTUFBTSxDQUFDLFFBQVE7a0JBQ2hCLFlBQWM7a0JBQ2QsYUFBZTs7MkJBQ1gsZUFBZSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7O2tCQUU1QyxlQUFpQjs7MkJBQ2Isa0JBQWtCLENBQ3ZCLE9BQU8sRUFDUCxNQUFNLENBQUMsWUFBWSxDQUFFLElBQUksRUFDekIsTUFBTSxDQUFDLE1BQU07Ozt1QkFJUixPQUFPLENBQUMsS0FBSyxFQUFFLHVDQUF1QyJ9
