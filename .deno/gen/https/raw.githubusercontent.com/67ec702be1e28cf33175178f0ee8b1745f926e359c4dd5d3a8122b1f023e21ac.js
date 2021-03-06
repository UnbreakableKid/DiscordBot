import { botId } from "../../bot.ts";
import { rest } from "../../rest/rest.ts";
import { Errors } from "../../types/discordeno/errors.ts";
import { endpoints } from "../../util/constants.ts";
import {
  isHigherPosition,
  requireBotGuildPermissions,
} from "../../util/permissions.ts";
/** Remove a role from the member */ export async function removeRole(
  guildId,
  memberId,
  roleId,
  reason,
) {
  const isHigherRolePosition = await isHigherPosition(guildId, botId, roleId);
  if (!isHigherRolePosition) {
    throw new Error(Errors.BOTS_HIGHEST_ROLE_TOO_LOW);
  }
  await requireBotGuildPermissions(guildId, [
    "MANAGE_ROLES",
  ]);
  return await rest.runMethod(
    "delete",
    endpoints.GUILD_MEMBER_ROLE(guildId, memberId, roleId),
    {
      reason,
    },
  );
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvcm9sZXMvcmVtb3ZlX3JvbGUudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvdElkIH0gZnJvbSBcIi4uLy4uL2JvdC50c1wiO1xuaW1wb3J0IHsgcmVzdCB9IGZyb20gXCIuLi8uLi9yZXN0L3Jlc3QudHNcIjtcbmltcG9ydCB7IEVycm9ycyB9IGZyb20gXCIuLi8uLi90eXBlcy9kaXNjb3JkZW5vL2Vycm9ycy50c1wiO1xuaW1wb3J0IHsgZW5kcG9pbnRzIH0gZnJvbSBcIi4uLy4uL3V0aWwvY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQge1xuICBpc0hpZ2hlclBvc2l0aW9uLFxuICByZXF1aXJlQm90R3VpbGRQZXJtaXNzaW9ucyxcbn0gZnJvbSBcIi4uLy4uL3V0aWwvcGVybWlzc2lvbnMudHNcIjtcblxuLyoqIFJlbW92ZSBhIHJvbGUgZnJvbSB0aGUgbWVtYmVyICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVtb3ZlUm9sZShcbiAgZ3VpbGRJZDogYmlnaW50LFxuICBtZW1iZXJJZDogYmlnaW50LFxuICByb2xlSWQ6IGJpZ2ludCxcbiAgcmVhc29uPzogc3RyaW5nLFxuKSB7XG4gIGNvbnN0IGlzSGlnaGVyUm9sZVBvc2l0aW9uID0gYXdhaXQgaXNIaWdoZXJQb3NpdGlvbihcbiAgICBndWlsZElkLFxuICAgIGJvdElkLFxuICAgIHJvbGVJZCxcbiAgKTtcbiAgaWYgKFxuICAgICFpc0hpZ2hlclJvbGVQb3NpdGlvblxuICApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLkJPVFNfSElHSEVTVF9ST0xFX1RPT19MT1cpO1xuICB9XG5cbiAgYXdhaXQgcmVxdWlyZUJvdEd1aWxkUGVybWlzc2lvbnMoZ3VpbGRJZCwgW1wiTUFOQUdFX1JPTEVTXCJdKTtcblxuICByZXR1cm4gYXdhaXQgcmVzdC5ydW5NZXRob2Q8dW5kZWZpbmVkPihcbiAgICBcImRlbGV0ZVwiLFxuICAgIGVuZHBvaW50cy5HVUlMRF9NRU1CRVJfUk9MRShndWlsZElkLCBtZW1iZXJJZCwgcm9sZUlkKSxcbiAgICB7IHJlYXNvbiB9LFxuICApO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLEtBQUssU0FBUSxZQUFjO1NBQzNCLElBQUksU0FBUSxrQkFBb0I7U0FDaEMsTUFBTSxTQUFRLGdDQUFrQztTQUNoRCxTQUFTLFNBQVEsdUJBQXlCO1NBRWpELGdCQUFnQixFQUNoQiwwQkFBMEIsU0FDckIseUJBQTJCO0FBRWxDLEVBQW9DLEFBQXBDLGdDQUFvQyxBQUFwQyxFQUFvQyx1QkFDZCxVQUFVLENBQzlCLE9BQWUsRUFDZixRQUFnQixFQUNoQixNQUFjLEVBQ2QsTUFBZTtVQUVULG9CQUFvQixTQUFTLGdCQUFnQixDQUNqRCxPQUFPLEVBQ1AsS0FBSyxFQUNMLE1BQU07U0FHTCxvQkFBb0I7a0JBRVgsS0FBSyxDQUFDLE1BQU0sQ0FBQyx5QkFBeUI7O1VBRzVDLDBCQUEwQixDQUFDLE9BQU87U0FBRyxZQUFjOztpQkFFNUMsSUFBSSxDQUFDLFNBQVMsRUFDekIsTUFBUSxHQUNSLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU07UUFDbkQsTUFBTSJ9
