import { cache } from "../../deps.ts";
import { defaultEmojis } from "../utils/constants/default_emojis.ts";
import { emojiUnicode } from "../utils/helpers.ts";
import { bot } from "../../cache.ts";
bot.arguments.set("emoji", {
  name: "emoji",
  execute: function (_argument, parameters, message) {
    let [id] = parameters;
    if (!id) return;
    if (defaultEmojis.has(id)) return id;
    if (id.startsWith("<:") || id.startsWith("<a:")) {
      id = id.substring(id.lastIndexOf(":") + 1, id.length - 1);
    }
    let emoji = cache.guilds.get(message.guildId)?.emojis.find((e) =>
      e.id === id
    );
    if (!emoji) {
      for (const guild of cache.guilds.values()) {
        const globalemoji = guild.emojis.find((e) => e.id === id);
        if (!globalemoji) continue;
        emoji = globalemoji;
        break;
      }
      if (!emoji) return;
    }
    return emojiUnicode(emoji);
  },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2FyZ3VtZW50cy9lbW9qaS50cyMzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjYWNoZSB9IGZyb20gXCIuLi8uLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyBkZWZhdWx0RW1vamlzIH0gZnJvbSBcIi4uL3V0aWxzL2NvbnN0YW50cy9kZWZhdWx0X2Vtb2ppcy50c1wiO1xuaW1wb3J0IHsgZW1vamlVbmljb2RlIH0gZnJvbSBcIi4uL3V0aWxzL2hlbHBlcnMudHNcIjtcbmltcG9ydCB7IGJvdCB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuXG5ib3QuYXJndW1lbnRzLnNldChcImVtb2ppXCIsIHtcbiAgbmFtZTogXCJlbW9qaVwiLFxuICBleGVjdXRlOiBmdW5jdGlvbiAoX2FyZ3VtZW50LCBwYXJhbWV0ZXJzLCBtZXNzYWdlKSB7XG4gICAgbGV0IFtpZF0gPSBwYXJhbWV0ZXJzO1xuICAgIGlmICghaWQpIHJldHVybjtcblxuICAgIGlmIChkZWZhdWx0RW1vamlzLmhhcyhpZCkpIHJldHVybiBpZDtcblxuICAgIGlmIChpZC5zdGFydHNXaXRoKFwiPDpcIikgfHwgaWQuc3RhcnRzV2l0aChcIjxhOlwiKSkge1xuICAgICAgaWQgPSBpZC5zdWJzdHJpbmcoaWQubGFzdEluZGV4T2YoXCI6XCIpICsgMSwgaWQubGVuZ3RoIC0gMSk7XG4gICAgfVxuXG4gICAgbGV0IGVtb2ppID0gY2FjaGUuZ3VpbGRzXG4gICAgICAuZ2V0KG1lc3NhZ2UuZ3VpbGRJZClcbiAgICAgID8uZW1vamlzLmZpbmQoKGUpID0+IGUuaWQgPT09IGlkKTtcbiAgICBpZiAoIWVtb2ppKSB7XG4gICAgICBmb3IgKGNvbnN0IGd1aWxkIG9mIGNhY2hlLmd1aWxkcy52YWx1ZXMoKSkge1xuICAgICAgICBjb25zdCBnbG9iYWxlbW9qaSA9IGd1aWxkLmVtb2ppcy5maW5kKChlKSA9PiBlLmlkID09PSBpZCk7XG4gICAgICAgIGlmICghZ2xvYmFsZW1vamkpIGNvbnRpbnVlO1xuXG4gICAgICAgIGVtb2ppID0gZ2xvYmFsZW1vamk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWVtb2ppKSByZXR1cm47XG4gICAgfVxuXG4gICAgcmV0dXJuIGVtb2ppVW5pY29kZShlbW9qaSk7XG4gIH0sXG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxLQUFLLFNBQVEsYUFBZTtTQUM1QixhQUFhLFNBQVEsb0NBQXNDO1NBQzNELFlBQVksU0FBUSxtQkFBcUI7U0FDekMsR0FBRyxTQUFRLGNBQWdCO0FBRXBDLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFDLEtBQU87SUFDdkIsSUFBSSxHQUFFLEtBQU87SUFDYixPQUFPLFdBQVksU0FBUyxFQUFFLFVBQVUsRUFBRSxPQUFPO2FBQzFDLEVBQUUsSUFBSSxVQUFVO2FBQ2hCLEVBQUU7WUFFSCxhQUFhLENBQUMsR0FBRyxDQUFDLEVBQUUsVUFBVSxFQUFFO1lBRWhDLEVBQUUsQ0FBQyxVQUFVLEVBQUMsRUFBSSxNQUFLLEVBQUUsQ0FBQyxVQUFVLEVBQUMsR0FBSztZQUM1QyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFDLENBQUcsS0FBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDOztZQUd0RCxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FDckIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEdBQ2xCLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRTs7YUFDN0IsS0FBSzt1QkFDRyxLQUFLLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNO3NCQUMvQixXQUFXLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRTs7cUJBQ25ELFdBQVc7Z0JBRWhCLEtBQUssR0FBRyxXQUFXOzs7aUJBSWhCLEtBQUs7O2VBR0wsWUFBWSxDQUFDLEtBQUsifQ==
