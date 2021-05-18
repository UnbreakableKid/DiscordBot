import { cache, snowflakeToBigint } from "../../deps.ts";
import { bot } from "../../cache.ts";
bot.arguments.set("guild", {
    name: "guild",
    execute: function(_argument, parameters) {
        const [id] = parameters;
        if (!id) return;
        return cache.guilds.get(snowflakeToBigint(id));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2FyZ3VtZW50cy9ndWlsZC50cyMzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjYWNoZSwgc25vd2ZsYWtlVG9CaWdpbnQgfSBmcm9tIFwiLi4vLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgYm90IH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5cbmJvdC5hcmd1bWVudHMuc2V0KFwiZ3VpbGRcIiwge1xuICBuYW1lOiBcImd1aWxkXCIsXG4gIGV4ZWN1dGU6IGZ1bmN0aW9uIChfYXJndW1lbnQsIHBhcmFtZXRlcnMpIHtcbiAgICBjb25zdCBbaWRdID0gcGFyYW1ldGVycztcbiAgICBpZiAoIWlkKSByZXR1cm47XG5cbiAgICByZXR1cm4gY2FjaGUuZ3VpbGRzLmdldChzbm93Zmxha2VUb0JpZ2ludChpZCkpO1xuICB9LFxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsS0FBSyxFQUFFLGlCQUFpQixTQUFRLGFBQWU7U0FDL0MsR0FBRyxTQUFRLGNBQWdCO0FBRXBDLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFDLEtBQU87SUFDdkIsSUFBSSxHQUFFLEtBQU87SUFDYixPQUFPLFdBQVksU0FBUyxFQUFFLFVBQVU7ZUFDL0IsRUFBRSxJQUFJLFVBQVU7YUFDbEIsRUFBRTtlQUVBLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEVBQUUifQ==