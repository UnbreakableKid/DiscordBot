import { bot } from "../../../cache.ts";
import { createCommand } from "../../utils/helpers.ts";
createCommand({
    name: "clear",
    guildOnly: true,
    async execute (message) {
        const player = bot.lavadenoManager.players.get(message.guildId.toString());
        const queue = bot.musicQueues.get(message.guildId);
        if (!player || !queue) {
            return message.reply(`The bot is not playing right now`);
        }
        bot.musicQueues.set(message.guildId, []);
        await player.stop();
        return message.reply("The queue is now empty");
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2NvbW1hbmRzL3ZvaWNlL2NsZWFyLnRzIzg+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvdCB9IGZyb20gXCIuLi8uLi8uLi9jYWNoZS50c1wiO1xuaW1wb3J0IHsgY3JlYXRlQ29tbWFuZCB9IGZyb20gXCIuLi8uLi91dGlscy9oZWxwZXJzLnRzXCI7XG5cbmNyZWF0ZUNvbW1hbmQoe1xuICBuYW1lOiBcImNsZWFyXCIsXG4gIGd1aWxkT25seTogdHJ1ZSxcbiAgYXN5bmMgZXhlY3V0ZShtZXNzYWdlKSB7XG4gICAgY29uc3QgcGxheWVyID0gYm90LmxhdmFkZW5vTWFuYWdlci5wbGF5ZXJzLmdldChtZXNzYWdlLmd1aWxkSWQudG9TdHJpbmcoKSk7XG4gICAgY29uc3QgcXVldWUgPSBib3QubXVzaWNRdWV1ZXMuZ2V0KG1lc3NhZ2UuZ3VpbGRJZCk7XG5cbiAgICBpZiAoIXBsYXllciB8fCAhcXVldWUpIHtcbiAgICAgIHJldHVybiBtZXNzYWdlLnJlcGx5KGBUaGUgYm90IGlzIG5vdCBwbGF5aW5nIHJpZ2h0IG5vd2ApO1xuICAgIH1cblxuICAgIGJvdC5tdXNpY1F1ZXVlcy5zZXQobWVzc2FnZS5ndWlsZElkLCBbXSk7XG4gICAgYXdhaXQgcGxheWVyLnN0b3AoKTtcblxuICAgIHJldHVybiBtZXNzYWdlLnJlcGx5KFwiVGhlIHF1ZXVlIGlzIG5vdyBlbXB0eVwiKTtcbiAgfSxcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLEdBQUcsU0FBUSxpQkFBbUI7U0FDOUIsYUFBYSxTQUFRLHNCQUF3QjtBQUV0RCxhQUFhO0lBQ1gsSUFBSSxHQUFFLEtBQU87SUFDYixTQUFTLEVBQUUsSUFBSTtVQUNULE9BQU8sRUFBQyxPQUFPO2NBQ2IsTUFBTSxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVE7Y0FDakUsS0FBSyxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPO2FBRTVDLE1BQU0sS0FBSyxLQUFLO21CQUNaLE9BQU8sQ0FBQyxLQUFLLEVBQUUsZ0NBQWdDOztRQUd4RCxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTztjQUM3QixNQUFNLENBQUMsSUFBSTtlQUVWLE9BQU8sQ0FBQyxLQUFLLEVBQUMsc0JBQXdCIn0=