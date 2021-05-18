import { cache, snowflakeToBigint } from "../../deps.ts";
import { bot } from "../../cache.ts";
bot.arguments.set("...roles", {
    name: "...roles",
    execute: function(_argument, parameters, message) {
        if (!parameters.length) return;
        const guild = cache.guilds.get(message.guildId);
        if (!guild) return;
        return parameters.map((word)=>{
            const roleId = word.startsWith("<@&") ? word.substring(3, word.length - 1) : word;
            const name = word.toLowerCase();
            const role = guild.roles.get(snowflakeToBigint(roleId)) || guild.roles.find((r)=>r.name.toLowerCase() === name
            );
            if (role) return role;
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2FyZ3VtZW50cy8uLi5yb2xlcy50cyMzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjYWNoZSwgc25vd2ZsYWtlVG9CaWdpbnQgfSBmcm9tIFwiLi4vLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgYm90IH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5cbmJvdC5hcmd1bWVudHMuc2V0KFwiLi4ucm9sZXNcIiwge1xuICBuYW1lOiBcIi4uLnJvbGVzXCIsXG4gIGV4ZWN1dGU6IGZ1bmN0aW9uIChfYXJndW1lbnQsIHBhcmFtZXRlcnMsIG1lc3NhZ2UpIHtcbiAgICBpZiAoIXBhcmFtZXRlcnMubGVuZ3RoKSByZXR1cm47XG5cbiAgICBjb25zdCBndWlsZCA9IGNhY2hlLmd1aWxkcy5nZXQobWVzc2FnZS5ndWlsZElkKTtcbiAgICBpZiAoIWd1aWxkKSByZXR1cm47XG5cbiAgICByZXR1cm4gcGFyYW1ldGVycy5tYXAoKHdvcmQpID0+IHtcbiAgICAgIGNvbnN0IHJvbGVJZCA9IHdvcmQuc3RhcnRzV2l0aChcIjxAJlwiKVxuICAgICAgICA/IHdvcmQuc3Vic3RyaW5nKDMsIHdvcmQubGVuZ3RoIC0gMSlcbiAgICAgICAgOiB3b3JkO1xuXG4gICAgICBjb25zdCBuYW1lID0gd29yZC50b0xvd2VyQ2FzZSgpO1xuICAgICAgY29uc3Qgcm9sZSA9IGd1aWxkLnJvbGVzLmdldChzbm93Zmxha2VUb0JpZ2ludChyb2xlSWQpKSB8fFxuICAgICAgICBndWlsZC5yb2xlcy5maW5kKChyKSA9PiByLm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gbmFtZSk7XG4gICAgICBpZiAocm9sZSkgcmV0dXJuIHJvbGU7XG4gICAgfSk7XG4gIH0sXG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxLQUFLLEVBQUUsaUJBQWlCLFNBQVEsYUFBZTtTQUMvQyxHQUFHLFNBQVEsY0FBZ0I7QUFFcEMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUMsUUFBVTtJQUMxQixJQUFJLEdBQUUsUUFBVTtJQUNoQixPQUFPLFdBQVksU0FBUyxFQUFFLFVBQVUsRUFBRSxPQUFPO2FBQzFDLFVBQVUsQ0FBQyxNQUFNO2NBRWhCLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTzthQUN6QyxLQUFLO2VBRUgsVUFBVSxDQUFDLEdBQUcsRUFBRSxJQUFJO2tCQUNuQixNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBQyxHQUFLLEtBQ2hDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUNqQyxJQUFJO2tCQUVGLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVztrQkFDdkIsSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sTUFDbkQsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxPQUFPLElBQUk7O2dCQUNuRCxJQUFJLFNBQVMsSUFBSSJ9