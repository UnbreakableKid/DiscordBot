import { rest } from "../../rest/rest.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotGuildPermissions } from "../../util/permissions.ts";
/** Modify a guild widget object for the guild. Requires the MANAGE_GUILD permission. */ export async function editWidget(
  guildId,
  enabled,
  channelId,
) {
  await requireBotGuildPermissions(guildId, [
    "MANAGE_GUILD",
  ]);
  return await rest.runMethod("patch", endpoints.GUILD_WIDGET(guildId), {
    enabled,
    channel_id: channelId,
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvZ3VpbGRzL2VkaXRfd2lkZ2V0LnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHR5cGUgeyBHdWlsZFdpZGdldCB9IGZyb20gXCIuLi8uLi90eXBlcy9ndWlsZHMvZ3VpbGRfd2lkZ2V0LnRzXCI7XG5pbXBvcnQgeyBlbmRwb2ludHMgfSBmcm9tIFwiLi4vLi4vdXRpbC9jb25zdGFudHMudHNcIjtcbmltcG9ydCB7IHJlcXVpcmVCb3RHdWlsZFBlcm1pc3Npb25zIH0gZnJvbSBcIi4uLy4uL3V0aWwvcGVybWlzc2lvbnMudHNcIjtcblxuLyoqIE1vZGlmeSBhIGd1aWxkIHdpZGdldCBvYmplY3QgZm9yIHRoZSBndWlsZC4gUmVxdWlyZXMgdGhlIE1BTkFHRV9HVUlMRCBwZXJtaXNzaW9uLiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVkaXRXaWRnZXQoXG4gIGd1aWxkSWQ6IGJpZ2ludCxcbiAgZW5hYmxlZDogYm9vbGVhbixcbiAgY2hhbm5lbElkPzogc3RyaW5nIHwgbnVsbCxcbikge1xuICBhd2FpdCByZXF1aXJlQm90R3VpbGRQZXJtaXNzaW9ucyhndWlsZElkLCBbXCJNQU5BR0VfR1VJTERcIl0pO1xuXG4gIHJldHVybiBhd2FpdCByZXN0LnJ1bk1ldGhvZDxHdWlsZFdpZGdldD4oXG4gICAgXCJwYXRjaFwiLFxuICAgIGVuZHBvaW50cy5HVUlMRF9XSURHRVQoZ3VpbGRJZCksXG4gICAge1xuICAgICAgZW5hYmxlZCxcbiAgICAgIGNoYW5uZWxfaWQ6IGNoYW5uZWxJZCxcbiAgICB9LFxuICApO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLElBQUksU0FBUSxrQkFBb0I7U0FFaEMsU0FBUyxTQUFRLHVCQUF5QjtTQUMxQywwQkFBMEIsU0FBUSx5QkFBMkI7QUFFdEUsRUFBd0YsQUFBeEYsb0ZBQXdGLEFBQXhGLEVBQXdGLHVCQUNsRSxVQUFVLENBQzlCLE9BQWUsRUFDZixPQUFnQixFQUNoQixTQUF5QjtVQUVuQiwwQkFBMEIsQ0FBQyxPQUFPO1NBQUcsWUFBYzs7aUJBRTVDLElBQUksQ0FBQyxTQUFTLEVBQ3pCLEtBQU8sR0FDUCxTQUFTLENBQUMsWUFBWSxDQUFDLE9BQU87UUFFNUIsT0FBTztRQUNQLFVBQVUsRUFBRSxTQUFTIn0=
