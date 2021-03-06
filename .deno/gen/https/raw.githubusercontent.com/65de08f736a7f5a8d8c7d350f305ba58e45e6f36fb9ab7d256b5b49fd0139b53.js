import { rest } from "../../rest/rest.ts";
import { Errors } from "../../types/discordeno/errors.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotGuildPermissions } from "../../util/permissions.ts";
import { snakelize } from "../../util/utils.ts";
/** Check how many members would be removed from the server in a prune operation. Requires the KICK_MEMBERS permission */ export async function getPruneCount(
  guildId,
  options,
) {
  if (options?.days && options.days < 1) throw new Error(Errors.PRUNE_MIN_DAYS);
  if (options?.days && options.days > 30) {
    throw new Error(Errors.PRUNE_MAX_DAYS);
  }
  await requireBotGuildPermissions(guildId, [
    "KICK_MEMBERS",
  ]);
  const result = await rest.runMethod(
    "get",
    endpoints.GUILD_PRUNE(guildId),
    snakelize(options ?? {}),
  );
  return result.pruned;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvZ3VpbGRzL2dldF9wcnVuZV9jb3VudC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVzdCB9IGZyb20gXCIuLi8uLi9yZXN0L3Jlc3QudHNcIjtcbmltcG9ydCB7IEVycm9ycyB9IGZyb20gXCIuLi8uLi90eXBlcy9kaXNjb3JkZW5vL2Vycm9ycy50c1wiO1xuaW1wb3J0IHR5cGUgeyBHZXRHdWlsZFBydW5lQ291bnRRdWVyeSB9IGZyb20gXCIuLi8uLi90eXBlcy9ndWlsZHMvZ2V0X2d1aWxkX3BydW5lX2NvdW50LnRzXCI7XG5pbXBvcnQgeyBlbmRwb2ludHMgfSBmcm9tIFwiLi4vLi4vdXRpbC9jb25zdGFudHMudHNcIjtcbmltcG9ydCB7IHJlcXVpcmVCb3RHdWlsZFBlcm1pc3Npb25zIH0gZnJvbSBcIi4uLy4uL3V0aWwvcGVybWlzc2lvbnMudHNcIjtcbmltcG9ydCB7IHNuYWtlbGl6ZSB9IGZyb20gXCIuLi8uLi91dGlsL3V0aWxzLnRzXCI7XG5cbi8qKiBDaGVjayBob3cgbWFueSBtZW1iZXJzIHdvdWxkIGJlIHJlbW92ZWQgZnJvbSB0aGUgc2VydmVyIGluIGEgcHJ1bmUgb3BlcmF0aW9uLiBSZXF1aXJlcyB0aGUgS0lDS19NRU1CRVJTIHBlcm1pc3Npb24gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRQcnVuZUNvdW50KFxuICBndWlsZElkOiBiaWdpbnQsXG4gIG9wdGlvbnM/OiBHZXRHdWlsZFBydW5lQ291bnRRdWVyeSxcbikge1xuICBpZiAob3B0aW9ucz8uZGF5cyAmJiBvcHRpb25zLmRheXMgPCAxKSB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLlBSVU5FX01JTl9EQVlTKTtcbiAgaWYgKG9wdGlvbnM/LmRheXMgJiYgb3B0aW9ucy5kYXlzID4gMzApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLlBSVU5FX01BWF9EQVlTKTtcbiAgfVxuXG4gIGF3YWl0IHJlcXVpcmVCb3RHdWlsZFBlcm1pc3Npb25zKGd1aWxkSWQsIFtcIktJQ0tfTUVNQkVSU1wiXSk7XG5cbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzdC5ydW5NZXRob2QoXG4gICAgXCJnZXRcIixcbiAgICBlbmRwb2ludHMuR1VJTERfUFJVTkUoZ3VpbGRJZCksXG4gICAgc25ha2VsaXplKG9wdGlvbnMgPz8ge30pLFxuICApO1xuXG4gIHJldHVybiByZXN1bHQucHJ1bmVkIGFzIG51bWJlcjtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxJQUFJLFNBQVEsa0JBQW9CO1NBQ2hDLE1BQU0sU0FBUSxnQ0FBa0M7U0FFaEQsU0FBUyxTQUFRLHVCQUF5QjtTQUMxQywwQkFBMEIsU0FBUSx5QkFBMkI7U0FDN0QsU0FBUyxTQUFRLG1CQUFxQjtBQUUvQyxFQUF5SCxBQUF6SCxxSEFBeUgsQUFBekgsRUFBeUgsdUJBQ25HLGFBQWEsQ0FDakMsT0FBZSxFQUNmLE9BQWlDO1FBRTdCLE9BQU8sRUFBRSxJQUFJLElBQUksT0FBTyxDQUFDLElBQUksR0FBRyxDQUFDLFlBQVksS0FBSyxDQUFDLE1BQU0sQ0FBQyxjQUFjO1FBQ3hFLE9BQU8sRUFBRSxJQUFJLElBQUksT0FBTyxDQUFDLElBQUksR0FBRyxFQUFFO2tCQUMxQixLQUFLLENBQUMsTUFBTSxDQUFDLGNBQWM7O1VBR2pDLDBCQUEwQixDQUFDLE9BQU87U0FBRyxZQUFjOztVQUVuRCxNQUFNLFNBQVMsSUFBSSxDQUFDLFNBQVMsRUFDakMsR0FBSyxHQUNMLFNBQVMsQ0FBQyxXQUFXLENBQUMsT0FBTyxHQUM3QixTQUFTLENBQUMsT0FBTzs7V0FHWixNQUFNLENBQUMsTUFBTSJ9
