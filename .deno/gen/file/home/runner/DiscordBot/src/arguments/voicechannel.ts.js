import { cache, ChannelTypes, snowflakeToBigint } from "../../deps.ts";
import { bot } from "../../cache.ts";
bot.arguments.set("voicechannel", {
  name: "voicechannel",
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
    if (
      channel?.type !== ChannelTypes.GuildVoice &&
      channel?.type !== ChannelTypes.GuildStageVoice
    ) {
      return;
    }
    return channel;
  },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2FyZ3VtZW50cy92b2ljZWNoYW5uZWwudHMjMz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY2FjaGUsIENoYW5uZWxUeXBlcywgc25vd2ZsYWtlVG9CaWdpbnQgfSBmcm9tIFwiLi4vLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgYm90IH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5cbmJvdC5hcmd1bWVudHMuc2V0KFwidm9pY2VjaGFubmVsXCIsIHtcbiAgbmFtZTogXCJ2b2ljZWNoYW5uZWxcIixcbiAgZXhlY3V0ZTogZnVuY3Rpb24gKF9hcmd1bWVudCwgcGFyYW1ldGVycywgbWVzc2FnZSkge1xuICAgIGNvbnN0IFtpZF0gPSBwYXJhbWV0ZXJzO1xuICAgIGlmICghaWQpIHJldHVybjtcblxuICAgIGNvbnN0IGd1aWxkID0gY2FjaGUuZ3VpbGRzLmdldChtZXNzYWdlLmd1aWxkSWQpO1xuICAgIGlmICghZ3VpbGQpIHJldHVybjtcblxuICAgIGNvbnN0IGNoYW5uZWxJZE9yTmFtZSA9IGlkLnN0YXJ0c1dpdGgoXCI8I1wiKVxuICAgICAgPyBpZC5zdWJzdHJpbmcoMiwgaWQubGVuZ3RoIC0gMSlcbiAgICAgIDogaWQudG9Mb3dlckNhc2UoKTtcblxuICAgIGNvbnN0IGNoYW5uZWwgPSBjYWNoZS5jaGFubmVscy5nZXQoc25vd2ZsYWtlVG9CaWdpbnQoY2hhbm5lbElkT3JOYW1lKSkgfHxcbiAgICAgIGNhY2hlLmNoYW5uZWxzLmZpbmQoXG4gICAgICAgIChjaGFubmVsKSA9PlxuICAgICAgICAgIGNoYW5uZWwubmFtZSA9PT0gY2hhbm5lbElkT3JOYW1lICYmIGNoYW5uZWwuZ3VpbGRJZCA9PT0gZ3VpbGQuaWQsXG4gICAgICApO1xuXG4gICAgaWYgKFxuICAgICAgY2hhbm5lbD8udHlwZSAhPT0gQ2hhbm5lbFR5cGVzLkd1aWxkVm9pY2UgJiZcbiAgICAgIGNoYW5uZWw/LnR5cGUgIT09IENoYW5uZWxUeXBlcy5HdWlsZFN0YWdlVm9pY2VcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXR1cm4gY2hhbm5lbDtcbiAgfSxcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLEtBQUssRUFBRSxZQUFZLEVBQUUsaUJBQWlCLFNBQVEsYUFBZTtTQUM3RCxHQUFHLFNBQVEsY0FBZ0I7QUFFcEMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUMsWUFBYztJQUM5QixJQUFJLEdBQUUsWUFBYztJQUNwQixPQUFPLFdBQVksU0FBUyxFQUFFLFVBQVUsRUFBRSxPQUFPO2VBQ3hDLEVBQUUsSUFBSSxVQUFVO2FBQ2xCLEVBQUU7Y0FFRCxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU87YUFDekMsS0FBSztjQUVKLGVBQWUsR0FBRyxFQUFFLENBQUMsVUFBVSxFQUFDLEVBQUksS0FDdEMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQzdCLEVBQUUsQ0FBQyxXQUFXO2NBRVosT0FBTyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLGVBQWUsTUFDbEUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQ2hCLE9BQU8sR0FDTixPQUFPLENBQUMsSUFBSSxLQUFLLGVBQWUsSUFBSSxPQUFPLENBQUMsT0FBTyxLQUFLLEtBQUssQ0FBQyxFQUFFOztZQUlwRSxPQUFPLEVBQUUsSUFBSSxLQUFLLFlBQVksQ0FBQyxVQUFVLElBQ3pDLE9BQU8sRUFBRSxJQUFJLEtBQUssWUFBWSxDQUFDLGVBQWU7OztlQUt6QyxPQUFPIn0=
