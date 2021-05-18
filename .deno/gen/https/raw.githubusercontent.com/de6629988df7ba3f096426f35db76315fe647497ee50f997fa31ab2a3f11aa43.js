import { rest } from "../../rest/rest.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotGuildPermissions } from "../../util/permissions.ts";
/** Modify the given emoji. Requires the MANAGE_EMOJIS permission. */ export async function editEmoji(
  guildId,
  id,
  options,
) {
  await requireBotGuildPermissions(guildId, [
    "MANAGE_EMOJIS",
  ]);
  return await rest.runMethod("patch", endpoints.GUILD_EMOJI(guildId, id), {
    name: options.name,
    roles: options.roles,
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvZW1vamlzL2VkaXRfZW1vamkudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHJlc3QgfSBmcm9tIFwiLi4vLi4vcmVzdC9yZXN0LnRzXCI7XG5pbXBvcnQgdHlwZSB7IEVtb2ppIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2Vtb2ppcy9lbW9qaS50c1wiO1xuaW1wb3J0IHR5cGUgeyBNb2RpZnlHdWlsZEVtb2ppIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2Vtb2ppcy9tb2RpZnlfZ3VpbGRfZW1vamkudHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHsgcmVxdWlyZUJvdEd1aWxkUGVybWlzc2lvbnMgfSBmcm9tIFwiLi4vLi4vdXRpbC9wZXJtaXNzaW9ucy50c1wiO1xuXG4vKiogTW9kaWZ5IHRoZSBnaXZlbiBlbW9qaS4gUmVxdWlyZXMgdGhlIE1BTkFHRV9FTU9KSVMgcGVybWlzc2lvbi4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlZGl0RW1vamkoXG4gIGd1aWxkSWQ6IGJpZ2ludCxcbiAgaWQ6IGJpZ2ludCxcbiAgb3B0aW9uczogTW9kaWZ5R3VpbGRFbW9qaSxcbikge1xuICBhd2FpdCByZXF1aXJlQm90R3VpbGRQZXJtaXNzaW9ucyhndWlsZElkLCBbXCJNQU5BR0VfRU1PSklTXCJdKTtcblxuICByZXR1cm4gYXdhaXQgcmVzdC5ydW5NZXRob2Q8RW1vamk+KFxuICAgIFwicGF0Y2hcIixcbiAgICBlbmRwb2ludHMuR1VJTERfRU1PSkkoZ3VpbGRJZCwgaWQpLFxuICAgIHtcbiAgICAgIG5hbWU6IG9wdGlvbnMubmFtZSxcbiAgICAgIHJvbGVzOiBvcHRpb25zLnJvbGVzLFxuICAgIH0sXG4gICk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsSUFBSSxTQUFRLGtCQUFvQjtTQUdoQyxTQUFTLFNBQVEsdUJBQXlCO1NBQzFDLDBCQUEwQixTQUFRLHlCQUEyQjtBQUV0RSxFQUFxRSxBQUFyRSxpRUFBcUUsQUFBckUsRUFBcUUsdUJBQy9DLFNBQVMsQ0FDN0IsT0FBZSxFQUNmLEVBQVUsRUFDVixPQUF5QjtVQUVuQiwwQkFBMEIsQ0FBQyxPQUFPO1NBQUcsYUFBZTs7aUJBRTdDLElBQUksQ0FBQyxTQUFTLEVBQ3pCLEtBQU8sR0FDUCxTQUFTLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxFQUFFO1FBRS9CLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTtRQUNsQixLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUsifQ==
