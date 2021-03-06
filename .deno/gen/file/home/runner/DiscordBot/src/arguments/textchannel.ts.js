import { cache, ChannelTypes, snowflakeToBigint } from "../../deps.ts";
import { bot } from "../../cache.ts";
bot.arguments.set("textchannel", {
  name: "textchannel",
  execute: function (_argument, parameters, message) {
    const [id] = parameters;
    if (!id) return;
    const guild = cache.guilds.get(message.guildId);
    if (!guild) return;
    const channelIdOrName = id.startsWith("<#")
      ? id.substring(2, id.length - 1)
      : id.toLowerCase();
    const channel = cache.channels.get(snowflakeToBigint(channelIdOrName)) ||
      cache.channels.find((channel) =>
        channel.name === channelIdOrName && channel.guildId === guild.id
      );
    if (channel?.type !== ChannelTypes.GuildText) return;
    return channel;
  },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2FyZ3VtZW50cy90ZXh0Y2hhbm5lbC50cyMzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjYWNoZSwgQ2hhbm5lbFR5cGVzLCBzbm93Zmxha2VUb0JpZ2ludCB9IGZyb20gXCIuLi8uLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyBib3QgfSBmcm9tIFwiLi4vLi4vY2FjaGUudHNcIjtcblxuYm90LmFyZ3VtZW50cy5zZXQoXCJ0ZXh0Y2hhbm5lbFwiLCB7XG4gIG5hbWU6IFwidGV4dGNoYW5uZWxcIixcbiAgZXhlY3V0ZTogZnVuY3Rpb24gKF9hcmd1bWVudCwgcGFyYW1ldGVycywgbWVzc2FnZSkge1xuICAgIGNvbnN0IFtpZF0gPSBwYXJhbWV0ZXJzO1xuICAgIGlmICghaWQpIHJldHVybjtcblxuICAgIGNvbnN0IGd1aWxkID0gY2FjaGUuZ3VpbGRzLmdldChtZXNzYWdlLmd1aWxkSWQpO1xuICAgIGlmICghZ3VpbGQpIHJldHVybjtcblxuICAgIGNvbnN0IGNoYW5uZWxJZE9yTmFtZSA9IGlkLnN0YXJ0c1dpdGgoXCI8I1wiKVxuICAgICAgPyBpZC5zdWJzdHJpbmcoMiwgaWQubGVuZ3RoIC0gMSlcbiAgICAgIDogaWQudG9Mb3dlckNhc2UoKTtcblxuICAgIGNvbnN0IGNoYW5uZWwgPSBjYWNoZS5jaGFubmVscy5nZXQoc25vd2ZsYWtlVG9CaWdpbnQoY2hhbm5lbElkT3JOYW1lKSkgfHxcbiAgICAgIGNhY2hlLmNoYW5uZWxzLmZpbmQoXG4gICAgICAgIChjaGFubmVsKSA9PlxuICAgICAgICAgIGNoYW5uZWwubmFtZSA9PT0gY2hhbm5lbElkT3JOYW1lICYmIGNoYW5uZWwuZ3VpbGRJZCA9PT0gZ3VpbGQuaWQsXG4gICAgICApO1xuXG4gICAgaWYgKGNoYW5uZWw/LnR5cGUgIT09IENoYW5uZWxUeXBlcy5HdWlsZFRleHQpIHJldHVybjtcblxuICAgIHJldHVybiBjaGFubmVsO1xuICB9LFxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsS0FBSyxFQUFFLFlBQVksRUFBRSxpQkFBaUIsU0FBUSxhQUFlO1NBQzdELEdBQUcsU0FBUSxjQUFnQjtBQUVwQyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBQyxXQUFhO0lBQzdCLElBQUksR0FBRSxXQUFhO0lBQ25CLE9BQU8sV0FBWSxTQUFTLEVBQUUsVUFBVSxFQUFFLE9BQU87ZUFDeEMsRUFBRSxJQUFJLFVBQVU7YUFDbEIsRUFBRTtjQUVELEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTzthQUN6QyxLQUFLO2NBRUosZUFBZSxHQUFHLEVBQUUsQ0FBQyxVQUFVLEVBQUMsRUFBSSxLQUN0QyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsSUFDN0IsRUFBRSxDQUFDLFdBQVc7Y0FFWixPQUFPLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsZUFBZSxNQUNsRSxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksRUFDaEIsT0FBTyxHQUNOLE9BQU8sQ0FBQyxJQUFJLEtBQUssZUFBZSxJQUFJLE9BQU8sQ0FBQyxPQUFPLEtBQUssS0FBSyxDQUFDLEVBQUU7O1lBR2xFLE9BQU8sRUFBRSxJQUFJLEtBQUssWUFBWSxDQUFDLFNBQVM7ZUFFckMsT0FBTyJ9
