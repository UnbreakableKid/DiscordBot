import { bot } from "../../../cache.ts";
import { createCommand } from "../../utils/helpers.ts";
import { checkIfUserInMusicChannel } from "../../utils/voice.ts";
createCommand({
  name: "resume",
  guildOnly: true,
  async execute(message) {
    const player = bot.lavadenoManager.players.get(message.guildId.toString());
    if (!player) {
      return message.reply(`The bot is not playing right now`);
    }
    if (!await checkIfUserInMusicChannel(message, player)) {
      return message.reply(
        "You must be in a voice channel in order to execute this command",
      );
    }
    await player.resume();
    return message.reply(`The music has now resumed.`);
  },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2NvbW1hbmRzL3ZvaWNlL3Jlc3VtZS50cyM4PiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBib3QgfSBmcm9tIFwiLi4vLi4vLi4vY2FjaGUudHNcIjtcbmltcG9ydCB7IGNyZWF0ZUNvbW1hbmQgfSBmcm9tIFwiLi4vLi4vdXRpbHMvaGVscGVycy50c1wiO1xuaW1wb3J0IHsgY2hlY2tJZlVzZXJJbk11c2ljQ2hhbm5lbCB9IGZyb20gXCIuLi8uLi91dGlscy92b2ljZS50c1wiO1xuXG5jcmVhdGVDb21tYW5kKHtcbiAgbmFtZTogXCJyZXN1bWVcIixcbiAgZ3VpbGRPbmx5OiB0cnVlLFxuICBhc3luYyBleGVjdXRlKG1lc3NhZ2UpIHtcbiAgICBjb25zdCBwbGF5ZXIgPSBib3QubGF2YWRlbm9NYW5hZ2VyLnBsYXllcnMuZ2V0KFxuICAgICAgbWVzc2FnZS5ndWlsZElkLnRvU3RyaW5nKCksXG4gICAgKTtcblxuICAgIGlmICghcGxheWVyKSB7XG4gICAgICByZXR1cm4gbWVzc2FnZS5yZXBseShcbiAgICAgICAgYFRoZSBib3QgaXMgbm90IHBsYXlpbmcgcmlnaHQgbm93YCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKCEoYXdhaXQgY2hlY2tJZlVzZXJJbk11c2ljQ2hhbm5lbChtZXNzYWdlLCBwbGF5ZXIpKSkge1xuICAgICAgcmV0dXJuIG1lc3NhZ2UucmVwbHkoXG4gICAgICAgIFwiWW91IG11c3QgYmUgaW4gYSB2b2ljZSBjaGFubmVsIGluIG9yZGVyIHRvIGV4ZWN1dGUgdGhpcyBjb21tYW5kXCIsXG4gICAgICApO1xuICAgIH1cblxuICAgIGF3YWl0IHBsYXllci5yZXN1bWUoKTtcblxuICAgIHJldHVybiBtZXNzYWdlLnJlcGx5KGBUaGUgbXVzaWMgaGFzIG5vdyByZXN1bWVkLmApO1xuICB9LFxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsR0FBRyxTQUFRLGlCQUFtQjtTQUM5QixhQUFhLFNBQVEsc0JBQXdCO1NBQzdDLHlCQUF5QixTQUFRLG9CQUFzQjtBQUVoRSxhQUFhO0lBQ1gsSUFBSSxHQUFFLE1BQVE7SUFDZCxTQUFTLEVBQUUsSUFBSTtVQUNULE9BQU8sRUFBQyxPQUFPO2NBQ2IsTUFBTSxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FDNUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRO2FBR3JCLE1BQU07bUJBQ0YsT0FBTyxDQUFDLEtBQUssRUFDakIsZ0NBQWdDOzttQkFJekIseUJBQXlCLENBQUMsT0FBTyxFQUFFLE1BQU07bUJBQzVDLE9BQU8sQ0FBQyxLQUFLLEVBQ2xCLCtEQUFpRTs7Y0FJL0QsTUFBTSxDQUFDLE1BQU07ZUFFWixPQUFPLENBQUMsS0FBSyxFQUFFLDBCQUEwQiJ9
