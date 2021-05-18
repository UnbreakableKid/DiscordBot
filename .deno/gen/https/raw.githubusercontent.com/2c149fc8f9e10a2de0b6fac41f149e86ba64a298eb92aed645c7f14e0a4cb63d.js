import { cacheHandlers } from "../../cache.ts";
import { rest } from "../../rest/rest.ts";
import { endpoints } from "../../util/constants.ts";
import { botHasChannelPermissions, requireBotGuildPermissions } from "../../util/permissions.ts";
/** Deletes an invite for the given code. Requires `MANAGE_CHANNELS` or `MANAGE_GUILD` permission */ export async function deleteInvite(channelId, inviteCode) {
    const channel = await cacheHandlers.get("channels", channelId);
    if (channel) {
        const hasPerm = await botHasChannelPermissions(channel, [
            "MANAGE_CHANNELS", 
        ]);
        if (!hasPerm) {
            await requireBotGuildPermissions(channel.guildId, [
                "MANAGE_GUILD"
            ]);
        }
    }
    return await rest.runMethod("delete", endpoints.INVITE(inviteCode));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvaW52aXRlcy9kZWxldGVfaW52aXRlLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjYWNoZUhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHR5cGUgeyBJbnZpdGUgfSBmcm9tIFwiLi4vLi4vdHlwZXMvaW52aXRlcy9pbnZpdGUudHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHtcbiAgYm90SGFzQ2hhbm5lbFBlcm1pc3Npb25zLFxuICByZXF1aXJlQm90R3VpbGRQZXJtaXNzaW9ucyxcbn0gZnJvbSBcIi4uLy4uL3V0aWwvcGVybWlzc2lvbnMudHNcIjtcblxuLyoqIERlbGV0ZXMgYW4gaW52aXRlIGZvciB0aGUgZ2l2ZW4gY29kZS4gUmVxdWlyZXMgYE1BTkFHRV9DSEFOTkVMU2Agb3IgYE1BTkFHRV9HVUlMRGAgcGVybWlzc2lvbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlbGV0ZUludml0ZShjaGFubmVsSWQ6IGJpZ2ludCwgaW52aXRlQ29kZTogc3RyaW5nKSB7XG4gIGNvbnN0IGNoYW5uZWwgPSBhd2FpdCBjYWNoZUhhbmRsZXJzLmdldChcImNoYW5uZWxzXCIsIGNoYW5uZWxJZCk7XG4gIGlmIChjaGFubmVsKSB7XG4gICAgY29uc3QgaGFzUGVybSA9IGF3YWl0IGJvdEhhc0NoYW5uZWxQZXJtaXNzaW9ucyhjaGFubmVsLCBbXG4gICAgICBcIk1BTkFHRV9DSEFOTkVMU1wiLFxuICAgIF0pO1xuXG4gICAgaWYgKCFoYXNQZXJtKSB7XG4gICAgICBhd2FpdCByZXF1aXJlQm90R3VpbGRQZXJtaXNzaW9ucyhjaGFubmVsLmd1aWxkSWQsIFtcIk1BTkFHRV9HVUlMRFwiXSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF3YWl0IHJlc3QucnVuTWV0aG9kPEludml0ZT4oXG4gICAgXCJkZWxldGVcIixcbiAgICBlbmRwb2ludHMuSU5WSVRFKGludml0ZUNvZGUpLFxuICApO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLGFBQWEsU0FBUSxjQUFnQjtTQUNyQyxJQUFJLFNBQVEsa0JBQW9CO1NBRWhDLFNBQVMsU0FBUSx1QkFBeUI7U0FFakQsd0JBQXdCLEVBQ3hCLDBCQUEwQixTQUNyQix5QkFBMkI7QUFFbEMsRUFBb0csQUFBcEcsZ0dBQW9HLEFBQXBHLEVBQW9HLHVCQUM5RSxZQUFZLENBQUMsU0FBaUIsRUFBRSxVQUFrQjtVQUNoRSxPQUFPLFNBQVMsYUFBYSxDQUFDLEdBQUcsRUFBQyxRQUFVLEdBQUUsU0FBUztRQUN6RCxPQUFPO2NBQ0gsT0FBTyxTQUFTLHdCQUF3QixDQUFDLE9BQU87YUFDcEQsZUFBaUI7O2FBR2QsT0FBTztrQkFDSiwwQkFBMEIsQ0FBQyxPQUFPLENBQUMsT0FBTztpQkFBRyxZQUFjOzs7O2lCQUl4RCxJQUFJLENBQUMsU0FBUyxFQUN6QixNQUFRLEdBQ1IsU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFVIn0=