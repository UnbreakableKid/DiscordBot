import { rest } from "../../rest/rest.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotGuildPermissions } from "../../util/permissions.ts";
import { snakelize } from "../../util/utils.ts";
/** Returns the audit logs for the guild. Requires VIEW AUDIT LOGS permission */ export async function getAuditLogs(
  guildId,
  options,
) {
  await requireBotGuildPermissions(guildId, [
    "VIEW_AUDIT_LOG",
  ]);
  return await rest.runMethod(
    "get",
    endpoints.GUILD_AUDIT_LOGS(guildId),
    snakelize({
      ...options,
      limit: options.limit && options.limit >= 1 && options.limit <= 100
        ? options.limit
        : 50,
    }),
  );
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvZ3VpbGRzL2dldF9hdWRpdF9sb2dzLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHR5cGUgeyBBdWRpdExvZyB9IGZyb20gXCIuLi8uLi90eXBlcy9hdWRpdF9sb2cvYXVkaXRfbG9nLnRzXCI7XG5pbXBvcnQgdHlwZSB7IEdldEd1aWxkQXVkaXRMb2cgfSBmcm9tIFwiLi4vLi4vdHlwZXMvYXVkaXRfbG9nL2dldF9ndWlsZF9hdWRpdF9sb2cudHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHsgcmVxdWlyZUJvdEd1aWxkUGVybWlzc2lvbnMgfSBmcm9tIFwiLi4vLi4vdXRpbC9wZXJtaXNzaW9ucy50c1wiO1xuaW1wb3J0IHsgc25ha2VsaXplIH0gZnJvbSBcIi4uLy4uL3V0aWwvdXRpbHMudHNcIjtcblxuLyoqIFJldHVybnMgdGhlIGF1ZGl0IGxvZ3MgZm9yIHRoZSBndWlsZC4gUmVxdWlyZXMgVklFVyBBVURJVCBMT0dTIHBlcm1pc3Npb24gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRBdWRpdExvZ3MoXG4gIGd1aWxkSWQ6IGJpZ2ludCxcbiAgb3B0aW9uczogR2V0R3VpbGRBdWRpdExvZyxcbikge1xuICBhd2FpdCByZXF1aXJlQm90R3VpbGRQZXJtaXNzaW9ucyhndWlsZElkLCBbXCJWSUVXX0FVRElUX0xPR1wiXSk7XG5cbiAgcmV0dXJuIGF3YWl0IHJlc3QucnVuTWV0aG9kPEF1ZGl0TG9nPihcbiAgICBcImdldFwiLFxuICAgIGVuZHBvaW50cy5HVUlMRF9BVURJVF9MT0dTKGd1aWxkSWQpLFxuICAgIHNuYWtlbGl6ZSh7XG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgbGltaXQ6IG9wdGlvbnMubGltaXQgJiYgb3B0aW9ucy5saW1pdCA+PSAxICYmIG9wdGlvbnMubGltaXQgPD0gMTAwXG4gICAgICAgID8gb3B0aW9ucy5saW1pdFxuICAgICAgICA6IDUwLFxuICAgIH0pLFxuICApO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLElBQUksU0FBUSxrQkFBb0I7U0FHaEMsU0FBUyxTQUFRLHVCQUF5QjtTQUMxQywwQkFBMEIsU0FBUSx5QkFBMkI7U0FDN0QsU0FBUyxTQUFRLG1CQUFxQjtBQUUvQyxFQUFnRixBQUFoRiw0RUFBZ0YsQUFBaEYsRUFBZ0YsdUJBQzFELFlBQVksQ0FDaEMsT0FBZSxFQUNmLE9BQXlCO1VBRW5CLDBCQUEwQixDQUFDLE9BQU87U0FBRyxjQUFnQjs7aUJBRTlDLElBQUksQ0FBQyxTQUFTLEVBQ3pCLEdBQUssR0FDTCxTQUFTLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxHQUNsQyxTQUFTO1dBQ0osT0FBTztRQUNWLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSyxJQUFJLE9BQU8sQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLE9BQU8sQ0FBQyxLQUFLLElBQUksR0FBRyxHQUM5RCxPQUFPLENBQUMsS0FBSyxHQUNiLEVBQUUifQ==
