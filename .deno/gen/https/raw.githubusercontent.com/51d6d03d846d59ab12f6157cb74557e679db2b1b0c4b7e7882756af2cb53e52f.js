import { cacheHandlers } from "../../cache.ts";
import { rest } from "../../rest/rest.ts";
import { structures } from "../../structures/mod.ts";
import { Collection } from "../../util/collection.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotGuildPermissions } from "../../util/permissions.ts";
/** Returns a list of role objects for the guild.
 *
 * ⚠️ **If you need this, you are probably doing something wrong. This is not intended for use. Your roles will be cached in your guild.**
 */ export async function getRoles(guildId, addToCache = true) {
  await requireBotGuildPermissions(guildId, [
    "MANAGE_ROLES",
  ]);
  const result = await rest.runMethod("get", endpoints.GUILD_ROLES(guildId));
  const roleStructures = await Promise.all(
    result.map(async (role) =>
      await structures.createDiscordenoRole({
        role,
        guildId,
      })
    ),
  );
  const roles = new Collection(roleStructures.map((role) => [
    role.id,
    role,
  ]));
  if (addToCache) {
    const guild = await cacheHandlers.get("guilds", guildId);
    if (guild) {
      guild.roles = roles;
      await cacheHandlers.set("guilds", guild.id, guild);
    }
  }
  return roleStructures;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvcm9sZXMvZ2V0X3JvbGVzLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjYWNoZUhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHsgc3RydWN0dXJlcyB9IGZyb20gXCIuLi8uLi9zdHJ1Y3R1cmVzL21vZC50c1wiO1xuaW1wb3J0IHR5cGUgeyBSb2xlIH0gZnJvbSBcIi4uLy4uL3R5cGVzL3Blcm1pc3Npb25zL3JvbGUudHNcIjtcbmltcG9ydCB7IENvbGxlY3Rpb24gfSBmcm9tIFwiLi4vLi4vdXRpbC9jb2xsZWN0aW9uLnRzXCI7XG5pbXBvcnQgeyBlbmRwb2ludHMgfSBmcm9tIFwiLi4vLi4vdXRpbC9jb25zdGFudHMudHNcIjtcbmltcG9ydCB7IHJlcXVpcmVCb3RHdWlsZFBlcm1pc3Npb25zIH0gZnJvbSBcIi4uLy4uL3V0aWwvcGVybWlzc2lvbnMudHNcIjtcblxuLyoqIFJldHVybnMgYSBsaXN0IG9mIHJvbGUgb2JqZWN0cyBmb3IgdGhlIGd1aWxkLlxuICpcbiAqIOKaoO+4jyAqKklmIHlvdSBuZWVkIHRoaXMsIHlvdSBhcmUgcHJvYmFibHkgZG9pbmcgc29tZXRoaW5nIHdyb25nLiBUaGlzIGlzIG5vdCBpbnRlbmRlZCBmb3IgdXNlLiBZb3VyIHJvbGVzIHdpbGwgYmUgY2FjaGVkIGluIHlvdXIgZ3VpbGQuKipcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFJvbGVzKGd1aWxkSWQ6IGJpZ2ludCwgYWRkVG9DYWNoZSA9IHRydWUpIHtcbiAgYXdhaXQgcmVxdWlyZUJvdEd1aWxkUGVybWlzc2lvbnMoZ3VpbGRJZCwgW1wiTUFOQUdFX1JPTEVTXCJdKTtcblxuICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXN0LnJ1bk1ldGhvZDxSb2xlW10+KFxuICAgIFwiZ2V0XCIsXG4gICAgZW5kcG9pbnRzLkdVSUxEX1JPTEVTKGd1aWxkSWQpLFxuICApO1xuXG4gIGNvbnN0IHJvbGVTdHJ1Y3R1cmVzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgcmVzdWx0Lm1hcChhc3luYyAocm9sZSkgPT5cbiAgICAgIGF3YWl0IHN0cnVjdHVyZXMuY3JlYXRlRGlzY29yZGVub1JvbGUoeyByb2xlLCBndWlsZElkIH0pXG4gICAgKSxcbiAgKTtcblxuICBjb25zdCByb2xlcyA9IG5ldyBDb2xsZWN0aW9uKFxuICAgIHJvbGVTdHJ1Y3R1cmVzLm1hcCgocm9sZSkgPT4gW3JvbGUuaWQsIHJvbGVdKSxcbiAgKTtcblxuICBpZiAoYWRkVG9DYWNoZSkge1xuICAgIGNvbnN0IGd1aWxkID0gYXdhaXQgY2FjaGVIYW5kbGVycy5nZXQoXCJndWlsZHNcIiwgZ3VpbGRJZCk7XG4gICAgaWYgKGd1aWxkKSB7XG4gICAgICBndWlsZC5yb2xlcyA9IHJvbGVzO1xuICAgICAgYXdhaXQgY2FjaGVIYW5kbGVycy5zZXQoXCJndWlsZHNcIiwgZ3VpbGQuaWQsIGd1aWxkKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcm9sZVN0cnVjdHVyZXM7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsYUFBYSxTQUFRLGNBQWdCO1NBQ3JDLElBQUksU0FBUSxrQkFBb0I7U0FDaEMsVUFBVSxTQUFRLHVCQUF5QjtTQUUzQyxVQUFVLFNBQVEsd0JBQTBCO1NBQzVDLFNBQVMsU0FBUSx1QkFBeUI7U0FDMUMsMEJBQTBCLFNBQVEseUJBQTJCO0FBRXRFLEVBR0csQUFISDs7O0NBR0csQUFISCxFQUdHLHVCQUNtQixRQUFRLENBQUMsT0FBZSxFQUFFLFVBQVUsR0FBRyxJQUFJO1VBQ3pELDBCQUEwQixDQUFDLE9BQU87U0FBRyxZQUFjOztVQUVuRCxNQUFNLFNBQVMsSUFBSSxDQUFDLFNBQVMsRUFDakMsR0FBSyxHQUNMLFNBQVMsQ0FBQyxXQUFXLENBQUMsT0FBTztVQUd6QixjQUFjLFNBQVMsT0FBTyxDQUFDLEdBQUcsQ0FDdEMsTUFBTSxDQUFDLEdBQUcsUUFBUSxJQUFJLFNBQ2QsVUFBVSxDQUFDLG9CQUFvQjtZQUFHLElBQUk7WUFBRSxPQUFPOzs7VUFJbkQsS0FBSyxPQUFPLFVBQVUsQ0FDMUIsY0FBYyxDQUFDLEdBQUcsRUFBRSxJQUFJO1lBQU0sSUFBSSxDQUFDLEVBQUU7WUFBRSxJQUFJOzs7UUFHekMsVUFBVTtjQUNOLEtBQUssU0FBUyxhQUFhLENBQUMsR0FBRyxFQUFDLE1BQVEsR0FBRSxPQUFPO1lBQ25ELEtBQUs7WUFDUCxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUs7a0JBQ2IsYUFBYSxDQUFDLEdBQUcsRUFBQyxNQUFRLEdBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRSxLQUFLOzs7V0FJOUMsY0FBYyJ9
