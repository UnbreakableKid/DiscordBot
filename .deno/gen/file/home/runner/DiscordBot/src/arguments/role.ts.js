import { cache, snowflakeToBigint } from "../../deps.ts";
import { translate } from "../utils/i18next.ts";
import { bot } from "../../cache.ts";
bot.arguments.set("role", {
    name: "role",
    execute: async function(_argument, parameters, message) {
        const [id] = parameters;
        if (!id) return;
        const guild = cache.guilds.get(message.guildId);
        if (!guild) return;
        const roleId = id.startsWith("<@&") ? id.substring(3, id.length - 1) : id;
        const name = id.toLowerCase();
        const role = guild.roles.get(snowflakeToBigint(roleId)) || guild.roles.find((r)=>r.name.toLowerCase() === name
        );
        if (role) return role;
        // No role was found, let's list roles for better user experience.
        const possibleRoles = guild.roles.filter((r)=>r.name.toLowerCase().startsWith(name)
        );
        if (!possibleRoles.size) return;
        await message.reply([
            translate(message.guildId, "strings:NEED_VALID_ROLE", {
                name: id
            }),
            translate(message.guildId, "strings:POSSIBLE_ROLES"),
            "",
            possibleRoles.map((r)=>`**${r.name}** ${r.id}`
            ).join("\n"), 
        ].join("\n"));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2FyZ3VtZW50cy9yb2xlLnRzIzM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNhY2hlLCBzbm93Zmxha2VUb0JpZ2ludCB9IGZyb20gXCIuLi8uLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyB0cmFuc2xhdGUgfSBmcm9tIFwiLi4vdXRpbHMvaTE4bmV4dC50c1wiO1xuaW1wb3J0IHsgYm90IH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5cbmJvdC5hcmd1bWVudHMuc2V0KFwicm9sZVwiLCB7XG4gIG5hbWU6IFwicm9sZVwiLFxuICBleGVjdXRlOiBhc3luYyBmdW5jdGlvbiAoX2FyZ3VtZW50LCBwYXJhbWV0ZXJzLCBtZXNzYWdlKSB7XG4gICAgY29uc3QgW2lkXSA9IHBhcmFtZXRlcnM7XG4gICAgaWYgKCFpZCkgcmV0dXJuO1xuXG4gICAgY29uc3QgZ3VpbGQgPSBjYWNoZS5ndWlsZHMuZ2V0KG1lc3NhZ2UuZ3VpbGRJZCk7XG4gICAgaWYgKCFndWlsZCkgcmV0dXJuO1xuXG4gICAgY29uc3Qgcm9sZUlkID0gaWQuc3RhcnRzV2l0aChcIjxAJlwiKSA/IGlkLnN1YnN0cmluZygzLCBpZC5sZW5ndGggLSAxKSA6IGlkO1xuXG4gICAgY29uc3QgbmFtZSA9IGlkLnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3Qgcm9sZSA9IGd1aWxkLnJvbGVzLmdldChzbm93Zmxha2VUb0JpZ2ludChyb2xlSWQpKSB8fFxuICAgICAgZ3VpbGQucm9sZXMuZmluZCgocikgPT4gci5uYW1lLnRvTG93ZXJDYXNlKCkgPT09IG5hbWUpO1xuICAgIGlmIChyb2xlKSByZXR1cm4gcm9sZTtcblxuICAgIC8vIE5vIHJvbGUgd2FzIGZvdW5kLCBsZXQncyBsaXN0IHJvbGVzIGZvciBiZXR0ZXIgdXNlciBleHBlcmllbmNlLlxuICAgIGNvbnN0IHBvc3NpYmxlUm9sZXMgPSBndWlsZC5yb2xlcy5maWx0ZXIoKHIpID0+XG4gICAgICByLm5hbWUudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKG5hbWUpXG4gICAgKTtcbiAgICBpZiAoIXBvc3NpYmxlUm9sZXMuc2l6ZSkgcmV0dXJuO1xuXG4gICAgYXdhaXQgbWVzc2FnZS5yZXBseShcbiAgICAgIFtcbiAgICAgICAgdHJhbnNsYXRlKG1lc3NhZ2UuZ3VpbGRJZCwgXCJzdHJpbmdzOk5FRURfVkFMSURfUk9MRVwiLCB7IG5hbWU6IGlkIH0pLFxuICAgICAgICB0cmFuc2xhdGUobWVzc2FnZS5ndWlsZElkLCBcInN0cmluZ3M6UE9TU0lCTEVfUk9MRVNcIiksXG4gICAgICAgIFwiXCIsXG4gICAgICAgIHBvc3NpYmxlUm9sZXMubWFwKChyKSA9PiBgKioke3IubmFtZX0qKiAke3IuaWR9YCkuam9pbihcIlxcblwiKSxcbiAgICAgIF0uam9pbihcIlxcblwiKSxcbiAgICApO1xuICB9LFxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsS0FBSyxFQUFFLGlCQUFpQixTQUFRLGFBQWU7U0FDL0MsU0FBUyxTQUFRLG1CQUFxQjtTQUN0QyxHQUFHLFNBQVEsY0FBZ0I7QUFFcEMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUMsSUFBTTtJQUN0QixJQUFJLEdBQUUsSUFBTTtJQUNaLE9BQU8saUJBQWtCLFNBQVMsRUFBRSxVQUFVLEVBQUUsT0FBTztlQUM5QyxFQUFFLElBQUksVUFBVTthQUNsQixFQUFFO2NBRUQsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPO2FBQ3pDLEtBQUs7Y0FFSixNQUFNLEdBQUcsRUFBRSxDQUFDLFVBQVUsRUFBQyxHQUFLLEtBQUksRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksRUFBRTtjQUVuRSxJQUFJLEdBQUcsRUFBRSxDQUFDLFdBQVc7Y0FDckIsSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sTUFDbkQsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxPQUFPLElBQUk7O1lBQ25ELElBQUksU0FBUyxJQUFJO1FBRXJCLEVBQWtFLEFBQWxFLGdFQUFrRTtjQUM1RCxhQUFhLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUN6QyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUMsSUFBSTs7YUFFakMsYUFBYSxDQUFDLElBQUk7Y0FFakIsT0FBTyxDQUFDLEtBQUs7WUFFZixTQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRSx1QkFBeUI7Z0JBQUksSUFBSSxFQUFFLEVBQUU7O1lBQ2hFLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxHQUFFLHNCQUF3Qjs7WUFFbkQsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFO2NBQUksSUFBSSxFQUFDLEVBQUk7VUFDM0QsSUFBSSxFQUFDLEVBQUkifQ==