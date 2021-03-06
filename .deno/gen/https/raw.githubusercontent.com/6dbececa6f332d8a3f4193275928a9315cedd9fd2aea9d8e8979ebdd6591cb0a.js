import { rest } from "../../rest/rest.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotGuildPermissions } from "../../util/permissions.ts";
/** Delete the attached integration object for the guild with this id. Requires MANAGE_GUILD permission. */ export async function deleteIntegration(
  guildId,
  id,
) {
  await requireBotGuildPermissions(guildId, [
    "MANAGE_GUILD",
  ]);
  return await rest.runMethod(
    "delete",
    endpoints.GUILD_INTEGRATION(guildId, id),
  );
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvaW50ZWdyYXRpb25zL2RlbGV0ZV9pbnRlZ3JhdGlvbi50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVzdCB9IGZyb20gXCIuLi8uLi9yZXN0L3Jlc3QudHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHsgcmVxdWlyZUJvdEd1aWxkUGVybWlzc2lvbnMgfSBmcm9tIFwiLi4vLi4vdXRpbC9wZXJtaXNzaW9ucy50c1wiO1xuXG4vKiogRGVsZXRlIHRoZSBhdHRhY2hlZCBpbnRlZ3JhdGlvbiBvYmplY3QgZm9yIHRoZSBndWlsZCB3aXRoIHRoaXMgaWQuIFJlcXVpcmVzIE1BTkFHRV9HVUlMRCBwZXJtaXNzaW9uLiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlbGV0ZUludGVncmF0aW9uKGd1aWxkSWQ6IGJpZ2ludCwgaWQ6IGJpZ2ludCkge1xuICBhd2FpdCByZXF1aXJlQm90R3VpbGRQZXJtaXNzaW9ucyhndWlsZElkLCBbXCJNQU5BR0VfR1VJTERcIl0pO1xuXG4gIHJldHVybiBhd2FpdCByZXN0LnJ1bk1ldGhvZDx1bmRlZmluZWQ+KFxuICAgIFwiZGVsZXRlXCIsXG4gICAgZW5kcG9pbnRzLkdVSUxEX0lOVEVHUkFUSU9OKGd1aWxkSWQsIGlkKSxcbiAgKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxJQUFJLFNBQVEsa0JBQW9CO1NBQ2hDLFNBQVMsU0FBUSx1QkFBeUI7U0FDMUMsMEJBQTBCLFNBQVEseUJBQTJCO0FBRXRFLEVBQTJHLEFBQTNHLHVHQUEyRyxBQUEzRyxFQUEyRyx1QkFDckYsaUJBQWlCLENBQUMsT0FBZSxFQUFFLEVBQVU7VUFDM0QsMEJBQTBCLENBQUMsT0FBTztTQUFHLFlBQWM7O2lCQUU1QyxJQUFJLENBQUMsU0FBUyxFQUN6QixNQUFRLEdBQ1IsU0FBUyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxFQUFFIn0=
