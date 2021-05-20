import { cacheHandlers } from "../../cache.ts";
import { rest } from "../../rest/rest.ts";
import { structures } from "../../structures/mod.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotChannelPermissions } from "../../util/permissions.ts";
/** Fetch a single message from the server. Requires VIEW_CHANNEL and READ_MESSAGE_HISTORY */ export async function getMessage(
  channelId,
  id,
) {
  if (await cacheHandlers.has("channels", channelId)) {
    await requireBotChannelPermissions(channelId, [
      "VIEW_CHANNEL",
      "READ_MESSAGE_HISTORY",
    ]);
  }
  const result = await rest.runMethod(
    "get",
    endpoints.CHANNEL_MESSAGE(channelId, id),
  );
  return await structures.createDiscordenoMessage(result);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvbWVzc2FnZXMvZ2V0X21lc3NhZ2UudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNhY2hlSGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vY2FjaGUudHNcIjtcbmltcG9ydCB7IHJlc3QgfSBmcm9tIFwiLi4vLi4vcmVzdC9yZXN0LnRzXCI7XG5pbXBvcnQgeyBzdHJ1Y3R1cmVzIH0gZnJvbSBcIi4uLy4uL3N0cnVjdHVyZXMvbW9kLnRzXCI7XG5pbXBvcnQgdHlwZSB7IE1lc3NhZ2UgfSBmcm9tIFwiLi4vLi4vdHlwZXMvbWVzc2FnZXMvbWVzc2FnZS50c1wiO1xuaW1wb3J0IHsgZW5kcG9pbnRzIH0gZnJvbSBcIi4uLy4uL3V0aWwvY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyByZXF1aXJlQm90Q2hhbm5lbFBlcm1pc3Npb25zIH0gZnJvbSBcIi4uLy4uL3V0aWwvcGVybWlzc2lvbnMudHNcIjtcblxuLyoqIEZldGNoIGEgc2luZ2xlIG1lc3NhZ2UgZnJvbSB0aGUgc2VydmVyLiBSZXF1aXJlcyBWSUVXX0NIQU5ORUwgYW5kIFJFQURfTUVTU0FHRV9ISVNUT1JZICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TWVzc2FnZShjaGFubmVsSWQ6IGJpZ2ludCwgaWQ6IGJpZ2ludCkge1xuICBpZiAoYXdhaXQgY2FjaGVIYW5kbGVycy5oYXMoXCJjaGFubmVsc1wiLCBjaGFubmVsSWQpKSB7XG4gICAgYXdhaXQgcmVxdWlyZUJvdENoYW5uZWxQZXJtaXNzaW9ucyhjaGFubmVsSWQsIFtcbiAgICAgIFwiVklFV19DSEFOTkVMXCIsXG4gICAgICBcIlJFQURfTUVTU0FHRV9ISVNUT1JZXCIsXG4gICAgXSk7XG4gIH1cblxuICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXN0LnJ1bk1ldGhvZDxNZXNzYWdlPihcbiAgICBcImdldFwiLFxuICAgIGVuZHBvaW50cy5DSEFOTkVMX01FU1NBR0UoY2hhbm5lbElkLCBpZCksXG4gICk7XG5cbiAgcmV0dXJuIGF3YWl0IHN0cnVjdHVyZXMuY3JlYXRlRGlzY29yZGVub01lc3NhZ2UocmVzdWx0KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxhQUFhLFNBQVEsY0FBZ0I7U0FDckMsSUFBSSxTQUFRLGtCQUFvQjtTQUNoQyxVQUFVLFNBQVEsdUJBQXlCO1NBRTNDLFNBQVMsU0FBUSx1QkFBeUI7U0FDMUMsNEJBQTRCLFNBQVEseUJBQTJCO0FBRXhFLEVBQTZGLEFBQTdGLHlGQUE2RixBQUE3RixFQUE2Rix1QkFDdkUsVUFBVSxDQUFDLFNBQWlCLEVBQUUsRUFBVTtjQUNsRCxhQUFhLENBQUMsR0FBRyxFQUFDLFFBQVUsR0FBRSxTQUFTO2NBQ3pDLDRCQUE0QixDQUFDLFNBQVM7YUFDMUMsWUFBYzthQUNkLG9CQUFzQjs7O1VBSXBCLE1BQU0sU0FBUyxJQUFJLENBQUMsU0FBUyxFQUNqQyxHQUFLLEdBQ0wsU0FBUyxDQUFDLGVBQWUsQ0FBQyxTQUFTLEVBQUUsRUFBRTtpQkFHNUIsVUFBVSxDQUFDLHVCQUF1QixDQUFDLE1BQU0ifQ==