import { eventHandlers } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { structures } from "../../structures/mod.ts";
import { snowflakeToBigint } from "../../util/bigint.ts";
export async function handleGuildRoleUpdate(data) {
  const payload = data.d;
  const guild = await cacheHandlers.get(
    "guilds",
    snowflakeToBigint(payload.guildId),
  );
  if (!guild) return;
  const cachedRole = guild.roles.get(snowflakeToBigint(payload.role.id));
  if (!cachedRole) return;
  const role = await structures.createDiscordenoRole({
    ...payload,
    guildId: guild.id,
  });
  guild.roles.set(snowflakeToBigint(payload.role.id), role);
  await cacheHandlers.set("guilds", guild.id, guild);
  eventHandlers.roleUpdate?.(guild, role, cachedRole);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hhbmRsZXJzL3JvbGVzL0dVSUxEX1JPTEVfVVBEQVRFLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBldmVudEhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2JvdC50c1wiO1xuaW1wb3J0IHsgY2FjaGVIYW5kbGVycyB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuaW1wb3J0IHsgc3RydWN0dXJlcyB9IGZyb20gXCIuLi8uLi9zdHJ1Y3R1cmVzL21vZC50c1wiO1xuaW1wb3J0IHR5cGUgeyBEaXNjb3JkR2F0ZXdheVBheWxvYWQgfSBmcm9tIFwiLi4vLi4vdHlwZXMvZ2F0ZXdheS9nYXRld2F5X3BheWxvYWQudHNcIjtcbmltcG9ydCB0eXBlIHsgR3VpbGRSb2xlVXBkYXRlIH0gZnJvbSBcIi4uLy4uL3R5cGVzL21vZC50c1wiO1xuaW1wb3J0IHsgc25vd2ZsYWtlVG9CaWdpbnQgfSBmcm9tIFwiLi4vLi4vdXRpbC9iaWdpbnQudHNcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZUd1aWxkUm9sZVVwZGF0ZShkYXRhOiBEaXNjb3JkR2F0ZXdheVBheWxvYWQpIHtcbiAgY29uc3QgcGF5bG9hZCA9IGRhdGEuZCBhcyBHdWlsZFJvbGVVcGRhdGU7XG4gIGNvbnN0IGd1aWxkID0gYXdhaXQgY2FjaGVIYW5kbGVycy5nZXQoXG4gICAgXCJndWlsZHNcIixcbiAgICBzbm93Zmxha2VUb0JpZ2ludChwYXlsb2FkLmd1aWxkSWQpLFxuICApO1xuICBpZiAoIWd1aWxkKSByZXR1cm47XG5cbiAgY29uc3QgY2FjaGVkUm9sZSA9IGd1aWxkLnJvbGVzLmdldChzbm93Zmxha2VUb0JpZ2ludChwYXlsb2FkLnJvbGUuaWQpKTtcbiAgaWYgKCFjYWNoZWRSb2xlKSByZXR1cm47XG5cbiAgY29uc3Qgcm9sZSA9IGF3YWl0IHN0cnVjdHVyZXMuY3JlYXRlRGlzY29yZGVub1JvbGUoe1xuICAgIC4uLnBheWxvYWQsXG4gICAgZ3VpbGRJZDogZ3VpbGQuaWQsXG4gIH0pO1xuICBndWlsZC5yb2xlcy5zZXQoc25vd2ZsYWtlVG9CaWdpbnQocGF5bG9hZC5yb2xlLmlkKSwgcm9sZSk7XG4gIGF3YWl0IGNhY2hlSGFuZGxlcnMuc2V0KFwiZ3VpbGRzXCIsIGd1aWxkLmlkLCBndWlsZCk7XG5cbiAgZXZlbnRIYW5kbGVycy5yb2xlVXBkYXRlPy4oZ3VpbGQsIHJvbGUsIGNhY2hlZFJvbGUpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLGFBQWEsU0FBUSxZQUFjO1NBQ25DLGFBQWEsU0FBUSxjQUFnQjtTQUNyQyxVQUFVLFNBQVEsdUJBQXlCO1NBRzNDLGlCQUFpQixTQUFRLG9CQUFzQjtzQkFFbEMscUJBQXFCLENBQUMsSUFBMkI7VUFDL0QsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDO1VBQ2hCLEtBQUssU0FBUyxhQUFhLENBQUMsR0FBRyxFQUNuQyxNQUFRLEdBQ1IsaUJBQWlCLENBQUMsT0FBTyxDQUFDLE9BQU87U0FFOUIsS0FBSztVQUVKLFVBQVUsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7U0FDL0QsVUFBVTtVQUVULElBQUksU0FBUyxVQUFVLENBQUMsb0JBQW9CO1dBQzdDLE9BQU87UUFDVixPQUFPLEVBQUUsS0FBSyxDQUFDLEVBQUU7O0lBRW5CLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUk7VUFDbEQsYUFBYSxDQUFDLEdBQUcsRUFBQyxNQUFRLEdBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRSxLQUFLO0lBRWpELGFBQWEsQ0FBQyxVQUFVLEdBQUcsS0FBSyxFQUFFLElBQUksRUFBRSxVQUFVIn0=