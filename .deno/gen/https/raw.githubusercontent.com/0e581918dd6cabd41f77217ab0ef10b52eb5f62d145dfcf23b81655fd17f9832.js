import { rest } from "../../rest/rest.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotGuildPermissions } from "../../util/permissions.ts";
/** Add a discovery subcategory to the guild. Requires the `MANAGE_GUILD` permission. */ export async function addDiscoverySubcategory(
  guildId,
  categoryId,
) {
  await requireBotGuildPermissions(guildId, [
    "MANAGE_GUILD",
  ]);
  return await rest.runMethod(
    "post",
    endpoints.DISCOVERY_SUBCATEGORY(guildId, categoryId),
  );
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvZGlzY292ZXJ5L2FkZF9kaXNjb3Zlcnlfc3ViY2F0ZWdvcnkudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHJlc3QgfSBmcm9tIFwiLi4vLi4vcmVzdC9yZXN0LnRzXCI7XG5pbXBvcnQgdHlwZSB7XG4gIEFkZEd1aWxkRGlzY292ZXJ5U3ViY2F0ZWdvcnksXG59IGZyb20gXCIuLi8uLi90eXBlcy9kaXNjb3ZlcnkvYWRkX2d1aWxkX2Rpc2NvdmVyeV9zdWJjYXRlZ29yeS50c1wiO1xuaW1wb3J0IHsgZW5kcG9pbnRzIH0gZnJvbSBcIi4uLy4uL3V0aWwvY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyByZXF1aXJlQm90R3VpbGRQZXJtaXNzaW9ucyB9IGZyb20gXCIuLi8uLi91dGlsL3Blcm1pc3Npb25zLnRzXCI7XG5cbi8qKiBBZGQgYSBkaXNjb3Zlcnkgc3ViY2F0ZWdvcnkgdG8gdGhlIGd1aWxkLiBSZXF1aXJlcyB0aGUgYE1BTkFHRV9HVUlMRGAgcGVybWlzc2lvbi4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGREaXNjb3ZlcnlTdWJjYXRlZ29yeShcbiAgZ3VpbGRJZDogYmlnaW50LFxuICBjYXRlZ29yeUlkOiBudW1iZXIsXG4pIHtcbiAgYXdhaXQgcmVxdWlyZUJvdEd1aWxkUGVybWlzc2lvbnMoZ3VpbGRJZCwgW1wiTUFOQUdFX0dVSUxEXCJdKTtcblxuICByZXR1cm4gYXdhaXQgcmVzdC5ydW5NZXRob2Q8QWRkR3VpbGREaXNjb3ZlcnlTdWJjYXRlZ29yeT4oXG4gICAgXCJwb3N0XCIsXG4gICAgZW5kcG9pbnRzLkRJU0NPVkVSWV9TVUJDQVRFR09SWShndWlsZElkLCBjYXRlZ29yeUlkKSxcbiAgKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxJQUFJLFNBQVEsa0JBQW9CO1NBSWhDLFNBQVMsU0FBUSx1QkFBeUI7U0FDMUMsMEJBQTBCLFNBQVEseUJBQTJCO0FBRXRFLEVBQXdGLEFBQXhGLG9GQUF3RixBQUF4RixFQUF3Rix1QkFDbEUsdUJBQXVCLENBQzNDLE9BQWUsRUFDZixVQUFrQjtVQUVaLDBCQUEwQixDQUFDLE9BQU87U0FBRyxZQUFjOztpQkFFNUMsSUFBSSxDQUFDLFNBQVMsRUFDekIsSUFBTSxHQUNOLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsVUFBVSJ9
