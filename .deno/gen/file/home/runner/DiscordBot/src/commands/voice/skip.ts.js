import { bot } from "../../../cache.ts";
import { createCommand } from "../../utils/helpers.ts";
import { checkIfUserInMusicChannel } from "../../utils/voice.ts";
createCommand({
    name: "skip",
    aliases: [
        "next",
        "s"
    ],
    guildOnly: true,
    async execute (message) {
        const player = bot.lavadenoManager.players.get(message.guildId.toString());
        const queue = bot.musicQueues.get(message.guildId);
        if (!player || !queue) {
            return message.reply(`The bot is not playing right now`);
        }
        if (!await checkIfUserInMusicChannel(message, player)) {
            return message.reply("You must be in a voice channel in order to execute this command");
        }
        await player.stop();
        return message.reply(`${queue[0].info.title} has been skipped!`);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2NvbW1hbmRzL3ZvaWNlL3NraXAudHMjOD4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYm90IH0gZnJvbSBcIi4uLy4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyBjcmVhdGVDb21tYW5kIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2hlbHBlcnMudHNcIjtcbmltcG9ydCB7IGNoZWNrSWZVc2VySW5NdXNpY0NoYW5uZWwgfSBmcm9tIFwiLi4vLi4vdXRpbHMvdm9pY2UudHNcIjtcblxuY3JlYXRlQ29tbWFuZCh7XG4gIG5hbWU6IFwic2tpcFwiLFxuICBhbGlhc2VzOiBbXCJuZXh0XCIsIFwic1wiXSxcbiAgZ3VpbGRPbmx5OiB0cnVlLFxuICBhc3luYyBleGVjdXRlKG1lc3NhZ2UpIHtcbiAgICBjb25zdCBwbGF5ZXIgPSBib3QubGF2YWRlbm9NYW5hZ2VyLnBsYXllcnMuZ2V0KFxuICAgICAgbWVzc2FnZS5ndWlsZElkLnRvU3RyaW5nKCksXG4gICAgKTtcbiAgICBjb25zdCBxdWV1ZSA9IGJvdC5tdXNpY1F1ZXVlcy5nZXQobWVzc2FnZS5ndWlsZElkKTtcblxuICAgIGlmICghcGxheWVyIHx8ICFxdWV1ZSkge1xuICAgICAgcmV0dXJuIG1lc3NhZ2UucmVwbHkoXG4gICAgICAgIGBUaGUgYm90IGlzIG5vdCBwbGF5aW5nIHJpZ2h0IG5vd2AsXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICghKGF3YWl0IGNoZWNrSWZVc2VySW5NdXNpY0NoYW5uZWwobWVzc2FnZSwgcGxheWVyKSkpIHtcbiAgICAgIHJldHVybiBtZXNzYWdlLnJlcGx5KFxuICAgICAgICBcIllvdSBtdXN0IGJlIGluIGEgdm9pY2UgY2hhbm5lbCBpbiBvcmRlciB0byBleGVjdXRlIHRoaXMgY29tbWFuZFwiLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBhd2FpdCBwbGF5ZXIuc3RvcCgpO1xuXG4gICAgcmV0dXJuIG1lc3NhZ2UucmVwbHkoYCR7cXVldWVbMF0uaW5mby50aXRsZX0gaGFzIGJlZW4gc2tpcHBlZCFgKTtcbiAgfSxcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLEdBQUcsU0FBUSxpQkFBbUI7U0FDOUIsYUFBYSxTQUFRLHNCQUF3QjtTQUM3Qyx5QkFBeUIsU0FBUSxvQkFBc0I7QUFFaEUsYUFBYTtJQUNYLElBQUksR0FBRSxJQUFNO0lBQ1osT0FBTztTQUFHLElBQU07U0FBRSxDQUFHOztJQUNyQixTQUFTLEVBQUUsSUFBSTtVQUNULE9BQU8sRUFBQyxPQUFPO2NBQ2IsTUFBTSxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FDNUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRO2NBRXBCLEtBQUssR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTzthQUU1QyxNQUFNLEtBQUssS0FBSzttQkFDWixPQUFPLENBQUMsS0FBSyxFQUNqQixnQ0FBZ0M7O21CQUl6Qix5QkFBeUIsQ0FBQyxPQUFPLEVBQUUsTUFBTTttQkFDNUMsT0FBTyxDQUFDLEtBQUssRUFDbEIsK0RBQWlFOztjQUkvRCxNQUFNLENBQUMsSUFBSTtlQUVWLE9BQU8sQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLGtCQUFrQiJ9