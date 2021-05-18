import { bot } from "../../../cache.ts";
import { createCommand } from "../../utils/helpers.ts";
createCommand({
    name: "loop",
    guildOnly: true,
    execute (message) {
        if (bot.loopingMusics.has(message.guildId)) {
            bot.loopingMusics.delete(message.guildId);
        } else {
            bot.loopingMusics.set(message.guildId, true);
        }
        return message.reply(`The current music will ${bot.loopingMusics.has(message.guildId) ? "now be looped 🔁" : `no longed be looped`}.`);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2NvbW1hbmRzL3ZvaWNlL2xvb3AudHMjOD4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYm90IH0gZnJvbSBcIi4uLy4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyBjcmVhdGVDb21tYW5kIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2hlbHBlcnMudHNcIjtcblxuY3JlYXRlQ29tbWFuZCh7XG4gIG5hbWU6IFwibG9vcFwiLFxuICBndWlsZE9ubHk6IHRydWUsXG4gIGV4ZWN1dGUobWVzc2FnZSkge1xuICAgIGlmIChib3QubG9vcGluZ011c2ljcy5oYXMobWVzc2FnZS5ndWlsZElkKSkge1xuICAgICAgYm90Lmxvb3BpbmdNdXNpY3MuZGVsZXRlKG1lc3NhZ2UuZ3VpbGRJZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJvdC5sb29waW5nTXVzaWNzLnNldChtZXNzYWdlLmd1aWxkSWQsIHRydWUpO1xuICAgIH1cblxuICAgIHJldHVybiBtZXNzYWdlLnJlcGx5KFxuICAgICAgYFRoZSBjdXJyZW50IG11c2ljIHdpbGwgJHtcbiAgICAgICAgYm90Lmxvb3BpbmdNdXNpY3MuaGFzKG1lc3NhZ2UuZ3VpbGRJZClcbiAgICAgICAgICA/IFwibm93IGJlIGxvb3BlZCDwn5SBXCJcbiAgICAgICAgICA6IGBubyBsb25nZWQgYmUgbG9vcGVkYFxuICAgICAgfS5gLFxuICAgICk7XG4gIH0sXG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxHQUFHLFNBQVEsaUJBQW1CO1NBQzlCLGFBQWEsU0FBUSxzQkFBd0I7QUFFdEQsYUFBYTtJQUNYLElBQUksR0FBRSxJQUFNO0lBQ1osU0FBUyxFQUFFLElBQUk7SUFDZixPQUFPLEVBQUMsT0FBTztZQUNULEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPO1lBQ3ZDLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPOztZQUV4QyxHQUFHLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUk7O2VBR3RDLE9BQU8sQ0FBQyxLQUFLLEVBQ2pCLHVCQUF1QixFQUN0QixHQUFHLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxLQUNqQyxrQkFBaUIsS0FDaEIsbUJBQW1CLEVBQ3pCLENBQUMifQ==