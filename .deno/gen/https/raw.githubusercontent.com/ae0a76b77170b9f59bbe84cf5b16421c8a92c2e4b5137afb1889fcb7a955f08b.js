import { rest } from "../../rest/rest.ts";
import { Collection } from "../../util/collection.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotChannelPermissions } from "../../util/permissions.ts";
/** Gets the webhooks for this channel. Requires MANAGE_WEBHOOKS */ export async function getChannelWebhooks(
  channelId,
) {
  await requireBotChannelPermissions(channelId, [
    "MANAGE_WEBHOOKS",
  ]);
  const result = await rest.runMethod(
    "get",
    endpoints.CHANNEL_WEBHOOKS(channelId),
  );
  return new Collection(result.map((webhook) => [
    webhook.id,
    webhook,
  ]));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvY2hhbm5lbHMvZ2V0X2NoYW5uZWxfd2ViaG9va3MudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHJlc3QgfSBmcm9tIFwiLi4vLi4vcmVzdC9yZXN0LnRzXCI7XG5pbXBvcnQgdHlwZSB7IFdlYmhvb2sgfSBmcm9tIFwiLi4vLi4vdHlwZXMvd2ViaG9va3Mvd2ViaG9vay50c1wiO1xuaW1wb3J0IHsgQ29sbGVjdGlvbiB9IGZyb20gXCIuLi8uLi91dGlsL2NvbGxlY3Rpb24udHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHsgcmVxdWlyZUJvdENoYW5uZWxQZXJtaXNzaW9ucyB9IGZyb20gXCIuLi8uLi91dGlsL3Blcm1pc3Npb25zLnRzXCI7XG5cbi8qKiBHZXRzIHRoZSB3ZWJob29rcyBmb3IgdGhpcyBjaGFubmVsLiBSZXF1aXJlcyBNQU5BR0VfV0VCSE9PS1MgKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDaGFubmVsV2ViaG9va3MoY2hhbm5lbElkOiBiaWdpbnQpIHtcbiAgYXdhaXQgcmVxdWlyZUJvdENoYW5uZWxQZXJtaXNzaW9ucyhjaGFubmVsSWQsIFtcIk1BTkFHRV9XRUJIT09LU1wiXSk7XG5cbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzdC5ydW5NZXRob2Q8V2ViaG9va1tdPihcbiAgICBcImdldFwiLFxuICAgIGVuZHBvaW50cy5DSEFOTkVMX1dFQkhPT0tTKGNoYW5uZWxJZCksXG4gICk7XG5cbiAgcmV0dXJuIG5ldyBDb2xsZWN0aW9uKFxuICAgIHJlc3VsdC5tYXAoKHdlYmhvb2spID0+IFt3ZWJob29rLmlkLCB3ZWJob29rXSksXG4gICk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsSUFBSSxTQUFRLGtCQUFvQjtTQUVoQyxVQUFVLFNBQVEsd0JBQTBCO1NBQzVDLFNBQVMsU0FBUSx1QkFBeUI7U0FDMUMsNEJBQTRCLFNBQVEseUJBQTJCO0FBRXhFLEVBQW1FLEFBQW5FLCtEQUFtRSxBQUFuRSxFQUFtRSx1QkFDN0Msa0JBQWtCLENBQUMsU0FBaUI7VUFDbEQsNEJBQTRCLENBQUMsU0FBUztTQUFHLGVBQWlCOztVQUUxRCxNQUFNLFNBQVMsSUFBSSxDQUFDLFNBQVMsRUFDakMsR0FBSyxHQUNMLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTO2VBRzNCLFVBQVUsQ0FDbkIsTUFBTSxDQUFDLEdBQUcsRUFBRSxPQUFPO1lBQU0sT0FBTyxDQUFDLEVBQUU7WUFBRSxPQUFPIn0=
