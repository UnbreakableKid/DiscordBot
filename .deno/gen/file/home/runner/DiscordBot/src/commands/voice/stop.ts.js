import { bot } from "../../../cache.ts";
import { createCommand } from "../../utils/helpers.ts";
createCommand({
    name: "stop",
    aliases: [
        "leave"
    ],
    guildOnly: true,
    async execute (message) {
        const player = bot.lavadenoManager.players.get(message.guildId.toString());
        if (!player) {
            return message.reply(`The bot is not in any channel!`);
        }
        await bot.lavadenoManager.destroy(message.guildId.toString());
        return message.reply(`Successfully left the channel!`);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2NvbW1hbmRzL3ZvaWNlL3N0b3AudHMjOD4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYm90IH0gZnJvbSBcIi4uLy4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyBjcmVhdGVDb21tYW5kIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2hlbHBlcnMudHNcIjtcblxuY3JlYXRlQ29tbWFuZCh7XG4gIG5hbWU6IFwic3RvcFwiLFxuICBhbGlhc2VzOiBbXCJsZWF2ZVwiXSxcbiAgZ3VpbGRPbmx5OiB0cnVlLFxuICBhc3luYyBleGVjdXRlKG1lc3NhZ2UpIHtcbiAgICBjb25zdCBwbGF5ZXIgPSBib3QubGF2YWRlbm9NYW5hZ2VyLnBsYXllcnMuZ2V0KFxuICAgICAgbWVzc2FnZS5ndWlsZElkLnRvU3RyaW5nKCksXG4gICAgKTtcblxuICAgIGlmICghcGxheWVyKSB7XG4gICAgICByZXR1cm4gbWVzc2FnZS5yZXBseShgVGhlIGJvdCBpcyBub3QgaW4gYW55IGNoYW5uZWwhYCk7XG4gICAgfVxuXG4gICAgYXdhaXQgYm90LmxhdmFkZW5vTWFuYWdlci5kZXN0cm95KG1lc3NhZ2UuZ3VpbGRJZC50b1N0cmluZygpKTtcblxuICAgIHJldHVybiBtZXNzYWdlLnJlcGx5KGBTdWNjZXNzZnVsbHkgbGVmdCB0aGUgY2hhbm5lbCFgKTtcbiAgfSxcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLEdBQUcsU0FBUSxpQkFBbUI7U0FDOUIsYUFBYSxTQUFRLHNCQUF3QjtBQUV0RCxhQUFhO0lBQ1gsSUFBSSxHQUFFLElBQU07SUFDWixPQUFPO1NBQUcsS0FBTzs7SUFDakIsU0FBUyxFQUFFLElBQUk7VUFDVCxPQUFPLEVBQUMsT0FBTztjQUNiLE1BQU0sR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQzVDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUTthQUdyQixNQUFNO21CQUNGLE9BQU8sQ0FBQyxLQUFLLEVBQUUsOEJBQThCOztjQUdoRCxHQUFHLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVE7ZUFFbkQsT0FBTyxDQUFDLEtBQUssRUFBRSw4QkFBOEIifQ==