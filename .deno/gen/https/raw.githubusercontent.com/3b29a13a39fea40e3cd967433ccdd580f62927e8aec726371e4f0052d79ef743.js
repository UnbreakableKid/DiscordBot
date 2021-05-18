import { applicationId } from "../../../bot.ts";
import { rest } from "../../../rest/rest.ts";
import { endpoints } from "../../../util/constants.ts";
/** Deletes a slash command. */ export async function deleteSlashCommand(
  id,
  guildId,
) {
  return await rest.runMethod(
    "delete",
    guildId
      ? endpoints.COMMANDS_GUILD_ID(applicationId, guildId, id)
      : endpoints.COMMANDS_ID(applicationId, id),
  );
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvaW50ZXJhY3Rpb25zL2NvbW1hbmRzL2RlbGV0ZV9zbGFzaF9jb21tYW5kLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBhcHBsaWNhdGlvbklkIH0gZnJvbSBcIi4uLy4uLy4uL2JvdC50c1wiO1xuaW1wb3J0IHsgcmVzdCB9IGZyb20gXCIuLi8uLi8uLi9yZXN0L3Jlc3QudHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuXG4vKiogRGVsZXRlcyBhIHNsYXNoIGNvbW1hbmQuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVsZXRlU2xhc2hDb21tYW5kKFxuICBpZDogYmlnaW50LFxuICBndWlsZElkPzogYmlnaW50LFxuKSB7XG4gIHJldHVybiBhd2FpdCByZXN0LnJ1bk1ldGhvZDx1bmRlZmluZWQ+KFxuICAgIFwiZGVsZXRlXCIsXG4gICAgZ3VpbGRJZFxuICAgICAgPyBlbmRwb2ludHMuQ09NTUFORFNfR1VJTERfSUQoYXBwbGljYXRpb25JZCwgZ3VpbGRJZCwgaWQpXG4gICAgICA6IGVuZHBvaW50cy5DT01NQU5EU19JRChhcHBsaWNhdGlvbklkLCBpZCksXG4gICk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsYUFBYSxTQUFRLGVBQWlCO1NBQ3RDLElBQUksU0FBUSxxQkFBdUI7U0FDbkMsU0FBUyxTQUFRLDBCQUE0QjtBQUV0RCxFQUErQixBQUEvQiwyQkFBK0IsQUFBL0IsRUFBK0IsdUJBQ1Qsa0JBQWtCLENBQ3RDLEVBQVUsRUFDVixPQUFnQjtpQkFFSCxJQUFJLENBQUMsU0FBUyxFQUN6QixNQUFRLEdBQ1IsT0FBTyxHQUNILFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLEVBQUUsT0FBTyxFQUFFLEVBQUUsSUFDdEQsU0FBUyxDQUFDLFdBQVcsQ0FBQyxhQUFhLEVBQUUsRUFBRSJ9
