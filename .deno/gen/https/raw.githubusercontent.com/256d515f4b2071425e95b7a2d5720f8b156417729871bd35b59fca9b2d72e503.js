import { rest } from "../../rest/rest.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotGuildPermissions } from "../../util/permissions.ts";
/** Returns a list of integrations for the guild. Requires the MANAGE_GUILD permission. */ export async function getIntegrations(
  guildId,
) {
  await requireBotGuildPermissions(guildId, [
    "MANAGE_GUILD",
  ]);
  return await rest.runMethod("get", endpoints.GUILD_INTEGRATIONS(guildId));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvaW50ZWdyYXRpb25zL2dldF9pbnRlZ3JhdGlvbnMudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHJlc3QgfSBmcm9tIFwiLi4vLi4vcmVzdC9yZXN0LnRzXCI7XG5pbXBvcnQgdHlwZSB7IEludGVncmF0aW9uIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2ludGVncmF0aW9ucy9pbnRlZ3JhdGlvbi50c1wiO1xuaW1wb3J0IHsgZW5kcG9pbnRzIH0gZnJvbSBcIi4uLy4uL3V0aWwvY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyByZXF1aXJlQm90R3VpbGRQZXJtaXNzaW9ucyB9IGZyb20gXCIuLi8uLi91dGlsL3Blcm1pc3Npb25zLnRzXCI7XG5cbi8qKiBSZXR1cm5zIGEgbGlzdCBvZiBpbnRlZ3JhdGlvbnMgZm9yIHRoZSBndWlsZC4gUmVxdWlyZXMgdGhlIE1BTkFHRV9HVUlMRCBwZXJtaXNzaW9uLiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEludGVncmF0aW9ucyhndWlsZElkOiBiaWdpbnQpIHtcbiAgYXdhaXQgcmVxdWlyZUJvdEd1aWxkUGVybWlzc2lvbnMoZ3VpbGRJZCwgW1wiTUFOQUdFX0dVSUxEXCJdKTtcblxuICByZXR1cm4gYXdhaXQgcmVzdC5ydW5NZXRob2Q8SW50ZWdyYXRpb24+KFxuICAgIFwiZ2V0XCIsXG4gICAgZW5kcG9pbnRzLkdVSUxEX0lOVEVHUkFUSU9OUyhndWlsZElkKSxcbiAgKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxJQUFJLFNBQVEsa0JBQW9CO1NBRWhDLFNBQVMsU0FBUSx1QkFBeUI7U0FDMUMsMEJBQTBCLFNBQVEseUJBQTJCO0FBRXRFLEVBQTBGLEFBQTFGLHNGQUEwRixBQUExRixFQUEwRix1QkFDcEUsZUFBZSxDQUFDLE9BQWU7VUFDN0MsMEJBQTBCLENBQUMsT0FBTztTQUFHLFlBQWM7O2lCQUU1QyxJQUFJLENBQUMsU0FBUyxFQUN6QixHQUFLLEdBQ0wsU0FBUyxDQUFDLGtCQUFrQixDQUFDLE9BQU8ifQ==