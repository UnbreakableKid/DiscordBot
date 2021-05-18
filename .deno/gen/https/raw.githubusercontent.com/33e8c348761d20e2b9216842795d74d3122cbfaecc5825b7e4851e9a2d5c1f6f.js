import { cacheHandlers } from "../../cache.ts";
import { rest } from "../../rest/rest.ts";
import { structures } from "../../structures/mod.ts";
import { endpoints } from "../../util/constants.ts";
import { calculateBits, requireBotGuildPermissions } from "../../util/permissions.ts";
/** Create a new role for the guild. Requires the MANAGE_ROLES permission. */ export async function createRole(guildId, options, reason) {
    await requireBotGuildPermissions(guildId, [
        "MANAGE_ROLES"
    ]);
    const result = await rest.runMethod("post", endpoints.GUILD_ROLES(guildId), {
        ...options,
        permissions: calculateBits(options?.permissions || []),
        reason
    });
    const role = await structures.createDiscordenoRole({
        role: result,
        guildId
    });
    const guild = await cacheHandlers.get("guilds", guildId);
    if (guild) {
        guild.roles.set(role.id, role);
        await cacheHandlers.set("guilds", guildId, guild);
    }
    return role;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvcm9sZXMvY3JlYXRlX3JvbGUudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNhY2hlSGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vY2FjaGUudHNcIjtcbmltcG9ydCB7IHJlc3QgfSBmcm9tIFwiLi4vLi4vcmVzdC9yZXN0LnRzXCI7XG5pbXBvcnQgeyBzdHJ1Y3R1cmVzIH0gZnJvbSBcIi4uLy4uL3N0cnVjdHVyZXMvbW9kLnRzXCI7XG5pbXBvcnQgeyBDcmVhdGVHdWlsZFJvbGUgfSBmcm9tIFwiLi4vLi4vdHlwZXMvZ3VpbGRzL2NyZWF0ZV9ndWlsZF9yb2xlLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFJvbGUgfSBmcm9tIFwiLi4vLi4vdHlwZXMvcGVybWlzc2lvbnMvcm9sZS50c1wiO1xuaW1wb3J0IHsgZW5kcG9pbnRzIH0gZnJvbSBcIi4uLy4uL3V0aWwvY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQge1xuICBjYWxjdWxhdGVCaXRzLFxuICByZXF1aXJlQm90R3VpbGRQZXJtaXNzaW9ucyxcbn0gZnJvbSBcIi4uLy4uL3V0aWwvcGVybWlzc2lvbnMudHNcIjtcblxuLyoqIENyZWF0ZSBhIG5ldyByb2xlIGZvciB0aGUgZ3VpbGQuIFJlcXVpcmVzIHRoZSBNQU5BR0VfUk9MRVMgcGVybWlzc2lvbi4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVSb2xlKFxuICBndWlsZElkOiBiaWdpbnQsXG4gIG9wdGlvbnM6IENyZWF0ZUd1aWxkUm9sZSxcbiAgcmVhc29uPzogc3RyaW5nLFxuKSB7XG4gIGF3YWl0IHJlcXVpcmVCb3RHdWlsZFBlcm1pc3Npb25zKGd1aWxkSWQsIFtcIk1BTkFHRV9ST0xFU1wiXSk7XG5cbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzdC5ydW5NZXRob2Q8Um9sZT4oXG4gICAgXCJwb3N0XCIsXG4gICAgZW5kcG9pbnRzLkdVSUxEX1JPTEVTKGd1aWxkSWQpLFxuICAgIHtcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICBwZXJtaXNzaW9uczogY2FsY3VsYXRlQml0cyhvcHRpb25zPy5wZXJtaXNzaW9ucyB8fCBbXSksXG4gICAgICByZWFzb24sXG4gICAgfSxcbiAgKTtcblxuICBjb25zdCByb2xlID0gYXdhaXQgc3RydWN0dXJlcy5jcmVhdGVEaXNjb3JkZW5vUm9sZSh7XG4gICAgcm9sZTogcmVzdWx0LFxuICAgIGd1aWxkSWQsXG4gIH0pO1xuXG4gIGNvbnN0IGd1aWxkID0gYXdhaXQgY2FjaGVIYW5kbGVycy5nZXQoXCJndWlsZHNcIiwgZ3VpbGRJZCk7XG4gIGlmIChndWlsZCkge1xuICAgIGd1aWxkLnJvbGVzLnNldChyb2xlLmlkLCByb2xlKTtcblxuICAgIGF3YWl0IGNhY2hlSGFuZGxlcnMuc2V0KFwiZ3VpbGRzXCIsIGd1aWxkSWQsIGd1aWxkKTtcbiAgfVxuXG4gIHJldHVybiByb2xlO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLGFBQWEsU0FBUSxjQUFnQjtTQUNyQyxJQUFJLFNBQVEsa0JBQW9CO1NBQ2hDLFVBQVUsU0FBUSx1QkFBeUI7U0FHM0MsU0FBUyxTQUFRLHVCQUF5QjtTQUVqRCxhQUFhLEVBQ2IsMEJBQTBCLFNBQ3JCLHlCQUEyQjtBQUVsQyxFQUE2RSxBQUE3RSx5RUFBNkUsQUFBN0UsRUFBNkUsdUJBQ3ZELFVBQVUsQ0FDOUIsT0FBZSxFQUNmLE9BQXdCLEVBQ3hCLE1BQWU7VUFFVCwwQkFBMEIsQ0FBQyxPQUFPO1NBQUcsWUFBYzs7VUFFbkQsTUFBTSxTQUFTLElBQUksQ0FBQyxTQUFTLEVBQ2pDLElBQU0sR0FDTixTQUFTLENBQUMsV0FBVyxDQUFDLE9BQU87V0FFeEIsT0FBTztRQUNWLFdBQVcsRUFBRSxhQUFhLENBQUMsT0FBTyxFQUFFLFdBQVc7UUFDL0MsTUFBTTs7VUFJSixJQUFJLFNBQVMsVUFBVSxDQUFDLG9CQUFvQjtRQUNoRCxJQUFJLEVBQUUsTUFBTTtRQUNaLE9BQU87O1VBR0gsS0FBSyxTQUFTLGFBQWEsQ0FBQyxHQUFHLEVBQUMsTUFBUSxHQUFFLE9BQU87UUFDbkQsS0FBSztRQUNQLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSTtjQUV2QixhQUFhLENBQUMsR0FBRyxFQUFDLE1BQVEsR0FBRSxPQUFPLEVBQUUsS0FBSzs7V0FHM0MsSUFBSSJ9