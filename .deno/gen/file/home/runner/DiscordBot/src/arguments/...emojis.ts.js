import { bot } from "../../cache.ts";
import { cache } from "../../deps.ts";
import { defaultEmojis } from "../utils/constants/default_emojis.ts";
import { emojiUnicode } from "../utils/helpers.ts";
bot.arguments.set("...emojis", {
    name: "...emojis",
    execute: function(_argument, parameters, message) {
        if (!parameters.length) return;
        const emojis = parameters.map((e)=>e.startsWith("<:") || e.startsWith("<a:") ? e.substring(e.lastIndexOf(":") + 1, e.length - 1) : e
        );
        return emojis.map((emoji)=>{
            if (defaultEmojis.has(emoji)) return emoji;
            let guildEmoji = cache.guilds.get(message.guildId)?.emojis.find((e)=>e.id === emoji
            );
            if (!guildEmoji) {
                for (const guild of cache.guilds.values()){
                    const globalemoji = guild.emojis.find((e)=>e.id === emoji
                    );
                    if (!globalemoji?.id) continue;
                    guildEmoji = globalemoji;
                    break;
                }
            }
            if (!guildEmoji) return;
            return emojiUnicode(guildEmoji);
        }).filter((e)=>e
        );
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2FyZ3VtZW50cy8uLi5lbW9qaXMudHMjMz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYm90IH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyBjYWNoZSB9IGZyb20gXCIuLi8uLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyBkZWZhdWx0RW1vamlzIH0gZnJvbSBcIi4uL3V0aWxzL2NvbnN0YW50cy9kZWZhdWx0X2Vtb2ppcy50c1wiO1xuaW1wb3J0IHsgZW1vamlVbmljb2RlIH0gZnJvbSBcIi4uL3V0aWxzL2hlbHBlcnMudHNcIjtcblxuYm90LmFyZ3VtZW50cy5zZXQoXCIuLi5lbW9qaXNcIiwge1xuICBuYW1lOiBcIi4uLmVtb2ppc1wiLFxuICBleGVjdXRlOiBmdW5jdGlvbiAoX2FyZ3VtZW50LCBwYXJhbWV0ZXJzLCBtZXNzYWdlKSB7XG4gICAgaWYgKCFwYXJhbWV0ZXJzLmxlbmd0aCkgcmV0dXJuO1xuXG4gICAgY29uc3QgZW1vamlzID0gcGFyYW1ldGVycy5tYXAoKGUpID0+XG4gICAgICBlLnN0YXJ0c1dpdGgoXCI8OlwiKSB8fCBlLnN0YXJ0c1dpdGgoXCI8YTpcIilcbiAgICAgICAgPyBlLnN1YnN0cmluZyhlLmxhc3RJbmRleE9mKFwiOlwiKSArIDEsIGUubGVuZ3RoIC0gMSlcbiAgICAgICAgOiBlXG4gICAgKTtcblxuICAgIHJldHVybiBlbW9qaXNcbiAgICAgIC5tYXAoKGVtb2ppKSA9PiB7XG4gICAgICAgIGlmIChkZWZhdWx0RW1vamlzLmhhcyhlbW9qaSkpIHJldHVybiBlbW9qaTtcblxuICAgICAgICBsZXQgZ3VpbGRFbW9qaSA9IGNhY2hlLmd1aWxkc1xuICAgICAgICAgIC5nZXQobWVzc2FnZS5ndWlsZElkKVxuICAgICAgICAgID8uZW1vamlzLmZpbmQoKGUpID0+IGUuaWQgPT09IGVtb2ppKTtcbiAgICAgICAgaWYgKCFndWlsZEVtb2ppKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBndWlsZCBvZiBjYWNoZS5ndWlsZHMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGdsb2JhbGVtb2ppID0gZ3VpbGQuZW1vamlzLmZpbmQoKGUpID0+IGUuaWQgPT09IGVtb2ppKTtcbiAgICAgICAgICAgIGlmICghZ2xvYmFsZW1vamk/LmlkKSBjb250aW51ZTtcblxuICAgICAgICAgICAgZ3VpbGRFbW9qaSA9IGdsb2JhbGVtb2ppO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFndWlsZEVtb2ppKSByZXR1cm47XG5cbiAgICAgICAgcmV0dXJuIGVtb2ppVW5pY29kZShndWlsZEVtb2ppKTtcbiAgICAgIH0pXG4gICAgICAuZmlsdGVyKChlKSA9PiBlKTtcbiAgfSxcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLEdBQUcsU0FBUSxjQUFnQjtTQUMzQixLQUFLLFNBQVEsYUFBZTtTQUM1QixhQUFhLFNBQVEsb0NBQXNDO1NBQzNELFlBQVksU0FBUSxtQkFBcUI7QUFFbEQsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUMsU0FBVztJQUMzQixJQUFJLEdBQUUsU0FBVztJQUNqQixPQUFPLFdBQVksU0FBUyxFQUFFLFVBQVUsRUFBRSxPQUFPO2FBQzFDLFVBQVUsQ0FBQyxNQUFNO2NBRWhCLE1BQU0sR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsR0FDOUIsQ0FBQyxDQUFDLFVBQVUsRUFBQyxFQUFJLE1BQUssQ0FBQyxDQUFDLFVBQVUsRUFBQyxHQUFLLEtBQ3BDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBQyxDQUFHLEtBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUNoRCxDQUFDOztlQUdBLE1BQU0sQ0FDVixHQUFHLEVBQUUsS0FBSztnQkFDTCxhQUFhLENBQUMsR0FBRyxDQUFDLEtBQUssVUFBVSxLQUFLO2dCQUV0QyxVQUFVLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FDMUIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEdBQ2xCLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssS0FBSzs7aUJBQ2hDLFVBQVU7MkJBQ0YsS0FBSyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTTswQkFDL0IsV0FBVyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBSyxDQUFDLENBQUMsRUFBRSxLQUFLLEtBQUs7O3lCQUN0RCxXQUFXLEVBQUUsRUFBRTtvQkFFcEIsVUFBVSxHQUFHLFdBQVc7Ozs7aUJBS3ZCLFVBQVU7bUJBRVIsWUFBWSxDQUFDLFVBQVU7V0FFL0IsTUFBTSxFQUFFLENBQUMsR0FBSyxDQUFDIn0=