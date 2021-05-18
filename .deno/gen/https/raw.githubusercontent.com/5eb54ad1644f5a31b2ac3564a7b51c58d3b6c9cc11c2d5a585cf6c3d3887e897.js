import { eventHandlers } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { structures } from "../../structures/mod.ts";
import { snowflakeToBigint } from "../../util/bigint.ts";
export async function handleInteractionCreate(data) {
  const payload = data.d;
  const discordenoMember = payload.guildId
    ? await structures.createDiscordenoMember(
      payload.member,
      snowflakeToBigint(payload.guildId),
    )
    : undefined;
  if (discordenoMember) {
    await cacheHandlers.set("members", discordenoMember.id, discordenoMember);
    eventHandlers.interactionGuildCreate?.(payload, discordenoMember);
  } else {
    eventHandlers.interactionDMCreate?.(payload);
  }
  eventHandlers.interactionCreate?.(payload, discordenoMember);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hhbmRsZXJzL2ludGVyYWN0aW9ucy9JTlRFUkFDVElPTl9DUkVBVEUudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV2ZW50SGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vYm90LnRzXCI7XG5pbXBvcnQgeyBjYWNoZUhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyBzdHJ1Y3R1cmVzIH0gZnJvbSBcIi4uLy4uL3N0cnVjdHVyZXMvbW9kLnRzXCI7XG5pbXBvcnQgdHlwZSB7IERpc2NvcmRHYXRld2F5UGF5bG9hZCB9IGZyb20gXCIuLi8uLi90eXBlcy9nYXRld2F5L2dhdGV3YXlfcGF5bG9hZC50c1wiO1xuaW1wb3J0IHR5cGUgeyBJbnRlcmFjdGlvbiB9IGZyb20gXCIuLi8uLi90eXBlcy9pbnRlcmFjdGlvbnMvaW50ZXJhY3Rpb24udHNcIjtcbmltcG9ydCB0eXBlIHsgR3VpbGRNZW1iZXJXaXRoVXNlciB9IGZyb20gXCIuLi8uLi90eXBlcy9tZW1iZXJzL2d1aWxkX21lbWJlci50c1wiO1xuaW1wb3J0IHsgc25vd2ZsYWtlVG9CaWdpbnQgfSBmcm9tIFwiLi4vLi4vdXRpbC9iaWdpbnQudHNcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZUludGVyYWN0aW9uQ3JlYXRlKGRhdGE6IERpc2NvcmRHYXRld2F5UGF5bG9hZCkge1xuICBjb25zdCBwYXlsb2FkID0gZGF0YS5kIGFzIEludGVyYWN0aW9uO1xuICBjb25zdCBkaXNjb3JkZW5vTWVtYmVyID0gcGF5bG9hZC5ndWlsZElkXG4gICAgPyBhd2FpdCBzdHJ1Y3R1cmVzLmNyZWF0ZURpc2NvcmRlbm9NZW1iZXIoXG4gICAgICBwYXlsb2FkLm1lbWJlciBhcyBHdWlsZE1lbWJlcldpdGhVc2VyLFxuICAgICAgc25vd2ZsYWtlVG9CaWdpbnQocGF5bG9hZC5ndWlsZElkKSxcbiAgICApXG4gICAgOiB1bmRlZmluZWQ7XG4gIGlmIChkaXNjb3JkZW5vTWVtYmVyKSB7XG4gICAgYXdhaXQgY2FjaGVIYW5kbGVycy5zZXQoXCJtZW1iZXJzXCIsIGRpc2NvcmRlbm9NZW1iZXIuaWQsIGRpc2NvcmRlbm9NZW1iZXIpO1xuICAgIGV2ZW50SGFuZGxlcnMuaW50ZXJhY3Rpb25HdWlsZENyZWF0ZT8uKHBheWxvYWQsIGRpc2NvcmRlbm9NZW1iZXIpO1xuICB9IGVsc2Uge1xuICAgIGV2ZW50SGFuZGxlcnMuaW50ZXJhY3Rpb25ETUNyZWF0ZT8uKHBheWxvYWQpO1xuICB9XG5cbiAgZXZlbnRIYW5kbGVycy5pbnRlcmFjdGlvbkNyZWF0ZT8uKHBheWxvYWQsIGRpc2NvcmRlbm9NZW1iZXIpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLGFBQWEsU0FBUSxZQUFjO1NBQ25DLGFBQWEsU0FBUSxjQUFnQjtTQUNyQyxVQUFVLFNBQVEsdUJBQXlCO1NBSTNDLGlCQUFpQixTQUFRLG9CQUFzQjtzQkFFbEMsdUJBQXVCLENBQUMsSUFBMkI7VUFDakUsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDO1VBQ2hCLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxPQUFPLFNBQzlCLFVBQVUsQ0FBQyxzQkFBc0IsQ0FDdkMsT0FBTyxDQUFDLE1BQU0sRUFDZCxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsT0FBTyxLQUVqQyxTQUFTO1FBQ1QsZ0JBQWdCO2NBQ1osYUFBYSxDQUFDLEdBQUcsRUFBQyxPQUFTLEdBQUUsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLGdCQUFnQjtRQUN4RSxhQUFhLENBQUMsc0JBQXNCLEdBQUcsT0FBTyxFQUFFLGdCQUFnQjs7UUFFaEUsYUFBYSxDQUFDLG1CQUFtQixHQUFHLE9BQU87O0lBRzdDLGFBQWEsQ0FBQyxpQkFBaUIsR0FBRyxPQUFPLEVBQUUsZ0JBQWdCIn0=
