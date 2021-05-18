import { cache, snowflakeToBigint } from "../../deps.ts";
import { bot } from "../../cache.ts";
import { fetchMember } from "../utils/helpers.ts";
import { log } from "../utils/logger.ts";
bot.arguments.set("member", {
  name: "member",
  execute: async function (_argument, parameters, message) {
    const [id] = parameters;
    if (!id) return;
    const guild = cache.guilds.get(message.guildId);
    if (!guild) return;
    const userId = id.startsWith("<@")
      ? id.substring(id.startsWith("<@!") ? 3 : 2, id.length - 1)
      : id;
    if (/^[\d+]{17,}$/.test(userId)) {
      const cachedMember = cache.members.get(snowflakeToBigint(userId));
      if (cachedMember?.guilds.has(message.guildId)) return cachedMember;
    }
    const cached = cache.members.find((member) =>
      member.guilds.has(message.guildId) &&
      member.tag.toLowerCase().startsWith(userId.toLowerCase())
    );
    if (cached) return cached;
    if (!/^[\d+]{17,}$/.test(userId)) return;
    log.debug("Fetching a member with Id from gateway", userId);
    const member = await fetchMember(guild.id, userId);
    return member;
  },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2FyZ3VtZW50cy9tZW1iZXIudHMjMz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY2FjaGUsIHNub3dmbGFrZVRvQmlnaW50IH0gZnJvbSBcIi4uLy4uL2RlcHMudHNcIjtcbmltcG9ydCB7IGJvdCB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuaW1wb3J0IHsgZmV0Y2hNZW1iZXIgfSBmcm9tIFwiLi4vdXRpbHMvaGVscGVycy50c1wiO1xuaW1wb3J0IHsgbG9nIH0gZnJvbSBcIi4uL3V0aWxzL2xvZ2dlci50c1wiO1xuXG5ib3QuYXJndW1lbnRzLnNldChcIm1lbWJlclwiLCB7XG4gIG5hbWU6IFwibWVtYmVyXCIsXG4gIGV4ZWN1dGU6IGFzeW5jIGZ1bmN0aW9uIChfYXJndW1lbnQsIHBhcmFtZXRlcnMsIG1lc3NhZ2UpIHtcbiAgICBjb25zdCBbaWRdID0gcGFyYW1ldGVycztcbiAgICBpZiAoIWlkKSByZXR1cm47XG5cbiAgICBjb25zdCBndWlsZCA9IGNhY2hlLmd1aWxkcy5nZXQobWVzc2FnZS5ndWlsZElkKTtcbiAgICBpZiAoIWd1aWxkKSByZXR1cm47XG5cbiAgICBjb25zdCB1c2VySWQgPSBpZC5zdGFydHNXaXRoKFwiPEBcIilcbiAgICAgID8gaWQuc3Vic3RyaW5nKGlkLnN0YXJ0c1dpdGgoXCI8QCFcIikgPyAzIDogMiwgaWQubGVuZ3RoIC0gMSlcbiAgICAgIDogaWQ7XG5cbiAgICBpZiAoL15bXFxkK117MTcsfSQvLnRlc3QodXNlcklkKSkge1xuICAgICAgY29uc3QgY2FjaGVkTWVtYmVyID0gY2FjaGUubWVtYmVycy5nZXQoc25vd2ZsYWtlVG9CaWdpbnQodXNlcklkKSk7XG4gICAgICBpZiAoY2FjaGVkTWVtYmVyPy5ndWlsZHMuaGFzKG1lc3NhZ2UuZ3VpbGRJZCkpIHJldHVybiBjYWNoZWRNZW1iZXI7XG4gICAgfVxuXG4gICAgY29uc3QgY2FjaGVkID0gY2FjaGUubWVtYmVycy5maW5kKFxuICAgICAgKG1lbWJlcikgPT5cbiAgICAgICAgbWVtYmVyLmd1aWxkcy5oYXMobWVzc2FnZS5ndWlsZElkKSAmJlxuICAgICAgICBtZW1iZXIudGFnLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCh1c2VySWQudG9Mb3dlckNhc2UoKSksXG4gICAgKTtcbiAgICBpZiAoY2FjaGVkKSByZXR1cm4gY2FjaGVkO1xuXG4gICAgaWYgKCEvXltcXGQrXXsxNyx9JC8udGVzdCh1c2VySWQpKSByZXR1cm47XG5cbiAgICBsb2cuZGVidWcoXCJGZXRjaGluZyBhIG1lbWJlciB3aXRoIElkIGZyb20gZ2F0ZXdheVwiLCB1c2VySWQpO1xuXG4gICAgY29uc3QgbWVtYmVyID0gYXdhaXQgZmV0Y2hNZW1iZXIoZ3VpbGQuaWQsIHVzZXJJZCk7XG5cbiAgICByZXR1cm4gbWVtYmVyO1xuICB9LFxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsS0FBSyxFQUFFLGlCQUFpQixTQUFRLGFBQWU7U0FDL0MsR0FBRyxTQUFRLGNBQWdCO1NBQzNCLFdBQVcsU0FBUSxtQkFBcUI7U0FDeEMsR0FBRyxTQUFRLGtCQUFvQjtBQUV4QyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBQyxNQUFRO0lBQ3hCLElBQUksR0FBRSxNQUFRO0lBQ2QsT0FBTyxpQkFBa0IsU0FBUyxFQUFFLFVBQVUsRUFBRSxPQUFPO2VBQzlDLEVBQUUsSUFBSSxVQUFVO2FBQ2xCLEVBQUU7Y0FFRCxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU87YUFDekMsS0FBSztjQUVKLE1BQU0sR0FBRyxFQUFFLENBQUMsVUFBVSxFQUFDLEVBQUksS0FDN0IsRUFBRSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFDLEdBQUssS0FBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUN4RCxFQUFFOzJCQUVhLElBQUksQ0FBQyxNQUFNO2tCQUN0QixZQUFZLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsTUFBTTtnQkFDM0QsWUFBWSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sVUFBVSxZQUFZOztjQUc5RCxNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQzlCLE1BQU0sR0FDTCxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxLQUNqQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLFdBQVc7O1lBRXRELE1BQU0sU0FBUyxNQUFNOzRCQUVMLElBQUksQ0FBQyxNQUFNO1FBRS9CLEdBQUcsQ0FBQyxLQUFLLEVBQUMsc0NBQXdDLEdBQUUsTUFBTTtjQUVwRCxNQUFNLFNBQVMsV0FBVyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsTUFBTTtlQUUxQyxNQUFNIn0=
