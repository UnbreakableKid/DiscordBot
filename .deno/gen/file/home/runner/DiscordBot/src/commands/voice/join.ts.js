import { bot } from "../../../cache.ts";
import { createCommand } from "../../utils/helpers.ts";
createCommand({
    name: "join",
    guildOnly: true,
    execute (message) {
        const player = bot.lavadenoManager.players.get(message.guildId.toString());
        if (player?.connected) {
            return message.reply(`The bot is already connected to a channel in this guild!`);
        }
        const voiceState = message.guild?.voiceStates.get(message.authorId);
        if (!voiceState?.channelId) {
            return message.reply(`You first need to join a voice channel!`);
        }
        if (player) {
            player.connect(voiceState.channelId.toString(), {
                selfDeaf: true
            });
        } else {
            const newPlayer = bot.lavadenoManager.create(message.guildId.toString());
            newPlayer.connect(voiceState.channelId.toString(), {
                selfDeaf: true
            });
        }
        return message.reply(`Successfully joined the channel!`);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2NvbW1hbmRzL3ZvaWNlL2pvaW4udHMjOD4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYm90IH0gZnJvbSBcIi4uLy4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyBjcmVhdGVDb21tYW5kIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2hlbHBlcnMudHNcIjtcblxuY3JlYXRlQ29tbWFuZCh7XG4gIG5hbWU6IFwiam9pblwiLFxuICBndWlsZE9ubHk6IHRydWUsXG4gIGV4ZWN1dGUobWVzc2FnZSkge1xuICAgIGNvbnN0IHBsYXllciA9IGJvdC5sYXZhZGVub01hbmFnZXIucGxheWVycy5nZXQobWVzc2FnZS5ndWlsZElkLnRvU3RyaW5nKCkpO1xuXG4gICAgaWYgKHBsYXllcj8uY29ubmVjdGVkKSB7XG4gICAgICByZXR1cm4gbWVzc2FnZS5yZXBseShcbiAgICAgICAgYFRoZSBib3QgaXMgYWxyZWFkeSBjb25uZWN0ZWQgdG8gYSBjaGFubmVsIGluIHRoaXMgZ3VpbGQhYCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3Qgdm9pY2VTdGF0ZSA9IG1lc3NhZ2UuZ3VpbGQ/LnZvaWNlU3RhdGVzLmdldChtZXNzYWdlLmF1dGhvcklkKTtcblxuICAgIGlmICghdm9pY2VTdGF0ZT8uY2hhbm5lbElkKSB7XG4gICAgICByZXR1cm4gbWVzc2FnZS5yZXBseShgWW91IGZpcnN0IG5lZWQgdG8gam9pbiBhIHZvaWNlIGNoYW5uZWwhYCk7XG4gICAgfVxuXG4gICAgaWYgKHBsYXllcikge1xuICAgICAgcGxheWVyLmNvbm5lY3Qodm9pY2VTdGF0ZS5jaGFubmVsSWQudG9TdHJpbmcoKSwge1xuICAgICAgICBzZWxmRGVhZjogdHJ1ZSxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBuZXdQbGF5ZXIgPSBib3QubGF2YWRlbm9NYW5hZ2VyLmNyZWF0ZShtZXNzYWdlLmd1aWxkSWQudG9TdHJpbmcoKSk7XG4gICAgICBuZXdQbGF5ZXIuY29ubmVjdCh2b2ljZVN0YXRlLmNoYW5uZWxJZC50b1N0cmluZygpLCB7XG4gICAgICAgIHNlbGZEZWFmOiB0cnVlLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1lc3NhZ2UucmVwbHkoYFN1Y2Nlc3NmdWxseSBqb2luZWQgdGhlIGNoYW5uZWwhYCk7XG4gIH0sXG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxHQUFHLFNBQVEsaUJBQW1CO1NBQzlCLGFBQWEsU0FBUSxzQkFBd0I7QUFFdEQsYUFBYTtJQUNYLElBQUksR0FBRSxJQUFNO0lBQ1osU0FBUyxFQUFFLElBQUk7SUFDZixPQUFPLEVBQUMsT0FBTztjQUNQLE1BQU0sR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRO1lBRW5FLE1BQU0sRUFBRSxTQUFTO21CQUNaLE9BQU8sQ0FBQyxLQUFLLEVBQ2pCLHdEQUF3RDs7Y0FJdkQsVUFBVSxHQUFHLE9BQU8sQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUTthQUU3RCxVQUFVLEVBQUUsU0FBUzttQkFDakIsT0FBTyxDQUFDLEtBQUssRUFBRSx1Q0FBdUM7O1lBRzNELE1BQU07WUFDUixNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsUUFBUTtnQkFDMUMsUUFBUSxFQUFFLElBQUk7OztrQkFHVixTQUFTLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRO1lBQ3JFLFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxRQUFRO2dCQUM3QyxRQUFRLEVBQUUsSUFBSTs7O2VBSVgsT0FBTyxDQUFDLEtBQUssRUFBRSxnQ0FBZ0MifQ==