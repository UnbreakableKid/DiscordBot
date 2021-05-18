import { bot } from "../../../cache.ts";
import { createCommand } from "../../utils/helpers.ts";
import { checkIfUserInMusicChannel } from "../../utils/voice.ts";
createCommand({
    name: "pause",
    guildOnly: true,
    slash: {
        enabled: true,
        guild: true,
        execute: (message)=>{
            return "Pong";
        }
    },
    async execute (message) {
        const player = bot.lavadenoManager.players.get(message.guildId.toString());
        if (!player || !await checkIfUserInMusicChannel(message, player)) {
            return message.reply(`The bot is not playing right now`);
        }
        await player.pause();
        return message.reply(`The music has now been paused.`);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2NvbW1hbmRzL3ZvaWNlL3BhdXNlLnRzIzg+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvdCB9IGZyb20gXCIuLi8uLi8uLi9jYWNoZS50c1wiO1xuaW1wb3J0IHsgY3JlYXRlQ29tbWFuZCB9IGZyb20gXCIuLi8uLi91dGlscy9oZWxwZXJzLnRzXCI7XG5pbXBvcnQgeyBjaGVja0lmVXNlckluTXVzaWNDaGFubmVsIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3ZvaWNlLnRzXCI7XG5cbmNyZWF0ZUNvbW1hbmQoe1xuICBuYW1lOiBcInBhdXNlXCIsXG4gIGd1aWxkT25seTogdHJ1ZSxcbiAgc2xhc2g6IHtcbiAgICBlbmFibGVkOiB0cnVlLFxuICAgIGd1aWxkOiB0cnVlLFxuICAgIGV4ZWN1dGU6IChtZXNzYWdlKSA9PiB7XG4gICAgICByZXR1cm4gXCJQb25nXCI7XG4gICAgfSxcbiAgfSxcbiAgYXN5bmMgZXhlY3V0ZShtZXNzYWdlKSB7XG4gICAgY29uc3QgcGxheWVyID0gYm90LmxhdmFkZW5vTWFuYWdlci5wbGF5ZXJzLmdldChtZXNzYWdlLmd1aWxkSWQudG9TdHJpbmcoKSk7XG5cbiAgICBpZiAoIXBsYXllciB8fCAhKGF3YWl0IGNoZWNrSWZVc2VySW5NdXNpY0NoYW5uZWwobWVzc2FnZSwgcGxheWVyKSkpIHtcbiAgICAgIHJldHVybiBtZXNzYWdlLnJlcGx5KGBUaGUgYm90IGlzIG5vdCBwbGF5aW5nIHJpZ2h0IG5vd2ApO1xuICAgIH1cblxuICAgIGF3YWl0IHBsYXllci5wYXVzZSgpO1xuXG4gICAgcmV0dXJuIG1lc3NhZ2UucmVwbHkoYFRoZSBtdXNpYyBoYXMgbm93IGJlZW4gcGF1c2VkLmApO1xuICB9LFxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsR0FBRyxTQUFRLGlCQUFtQjtTQUM5QixhQUFhLFNBQVEsc0JBQXdCO1NBQzdDLHlCQUF5QixTQUFRLG9CQUFzQjtBQUVoRSxhQUFhO0lBQ1gsSUFBSSxHQUFFLEtBQU87SUFDYixTQUFTLEVBQUUsSUFBSTtJQUNmLEtBQUs7UUFDSCxPQUFPLEVBQUUsSUFBSTtRQUNiLEtBQUssRUFBRSxJQUFJO1FBQ1gsT0FBTyxHQUFHLE9BQU87b0JBQ1IsSUFBTTs7O1VBR1gsT0FBTyxFQUFDLE9BQU87Y0FDYixNQUFNLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUTthQUVsRSxNQUFNLFdBQVkseUJBQXlCLENBQUMsT0FBTyxFQUFFLE1BQU07bUJBQ3ZELE9BQU8sQ0FBQyxLQUFLLEVBQUUsZ0NBQWdDOztjQUdsRCxNQUFNLENBQUMsS0FBSztlQUVYLE9BQU8sQ0FBQyxLQUFLLEVBQUUsOEJBQThCIn0=