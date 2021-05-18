import { rest } from "../../rest/rest.ts";
import { Collection } from "../../util/collection.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotGuildPermissions } from "../../util/permissions.ts";
/**
 * Returns an array of templates.
 * Requires the `MANAGE_GUILD` permission.
 */ export async function getGuildTemplates(guildId) {
    await requireBotGuildPermissions(guildId, [
        "MANAGE_GUILD"
    ]);
    const templates = await rest.runMethod("get", endpoints.GUILD_TEMPLATES(guildId));
    return new Collection(templates.map((template)=>[
            template.code,
            template, 
        ]
    ));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvdGVtcGxhdGVzL2dldF9ndWlsZF90ZW1wbGF0ZXMudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHJlc3QgfSBmcm9tIFwiLi4vLi4vcmVzdC9yZXN0LnRzXCI7XG5pbXBvcnQgdHlwZSB7IFRlbXBsYXRlIH0gZnJvbSBcIi4uLy4uL3R5cGVzL3RlbXBsYXRlcy90ZW1wbGF0ZS50c1wiO1xuaW1wb3J0IHsgQ29sbGVjdGlvbiB9IGZyb20gXCIuLi8uLi91dGlsL2NvbGxlY3Rpb24udHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHsgcmVxdWlyZUJvdEd1aWxkUGVybWlzc2lvbnMgfSBmcm9tIFwiLi4vLi4vdXRpbC9wZXJtaXNzaW9ucy50c1wiO1xuXG4vKipcbiAqIFJldHVybnMgYW4gYXJyYXkgb2YgdGVtcGxhdGVzLlxuICogUmVxdWlyZXMgdGhlIGBNQU5BR0VfR1VJTERgIHBlcm1pc3Npb24uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRHdWlsZFRlbXBsYXRlcyhndWlsZElkOiBiaWdpbnQpIHtcbiAgYXdhaXQgcmVxdWlyZUJvdEd1aWxkUGVybWlzc2lvbnMoZ3VpbGRJZCwgW1wiTUFOQUdFX0dVSUxEXCJdKTtcblxuICBjb25zdCB0ZW1wbGF0ZXMgPSBhd2FpdCByZXN0LnJ1bk1ldGhvZDxUZW1wbGF0ZVtdPihcbiAgICBcImdldFwiLFxuICAgIGVuZHBvaW50cy5HVUlMRF9URU1QTEFURVMoZ3VpbGRJZCksXG4gICk7XG5cbiAgcmV0dXJuIG5ldyBDb2xsZWN0aW9uKFxuICAgIHRlbXBsYXRlcy5tYXAoKHRlbXBsYXRlKSA9PiBbXG4gICAgICB0ZW1wbGF0ZS5jb2RlLFxuICAgICAgdGVtcGxhdGUsXG4gICAgXSksXG4gICk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsSUFBSSxTQUFRLGtCQUFvQjtTQUVoQyxVQUFVLFNBQVEsd0JBQTBCO1NBQzVDLFNBQVMsU0FBUSx1QkFBeUI7U0FDMUMsMEJBQTBCLFNBQVEseUJBQTJCO0FBRXRFLEVBR0csQUFISDs7O0NBR0csQUFISCxFQUdHLHVCQUNtQixpQkFBaUIsQ0FBQyxPQUFlO1VBQy9DLDBCQUEwQixDQUFDLE9BQU87U0FBRyxZQUFjOztVQUVuRCxTQUFTLFNBQVMsSUFBSSxDQUFDLFNBQVMsRUFDcEMsR0FBSyxHQUNMLFNBQVMsQ0FBQyxlQUFlLENBQUMsT0FBTztlQUd4QixVQUFVLENBQ25CLFNBQVMsQ0FBQyxHQUFHLEVBQUUsUUFBUTtZQUNyQixRQUFRLENBQUMsSUFBSTtZQUNiLFFBQVEifQ==