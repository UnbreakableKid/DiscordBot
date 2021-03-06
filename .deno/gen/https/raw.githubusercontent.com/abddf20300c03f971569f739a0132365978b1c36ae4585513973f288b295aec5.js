import { rest } from "../../rest/rest.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotChannelPermissions } from "../../util/permissions.ts";
/** Edit a webhook. Requires the `MANAGE_WEBHOOKS` permission. Returns the updated webhook object on success. */ export async function editWebhook(
  channelId,
  webhookId,
  options,
) {
  await requireBotChannelPermissions(channelId, [
    "MANAGE_WEBHOOKS",
  ]);
  return await rest.runMethod("patch", endpoints.WEBHOOK_ID(webhookId), {
    ...options,
    channel_id: options.channelId,
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvd2ViaG9va3MvZWRpdF93ZWJob29rLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHR5cGUgeyBNb2RpZnlXZWJob29rIH0gZnJvbSBcIi4uLy4uL3R5cGVzL3dlYmhvb2tzL21vZGlmeV93ZWJob29rLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFdlYmhvb2sgfSBmcm9tIFwiLi4vLi4vdHlwZXMvd2ViaG9va3Mvd2ViaG9vay50c1wiO1xuaW1wb3J0IHsgZW5kcG9pbnRzIH0gZnJvbSBcIi4uLy4uL3V0aWwvY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyByZXF1aXJlQm90Q2hhbm5lbFBlcm1pc3Npb25zIH0gZnJvbSBcIi4uLy4uL3V0aWwvcGVybWlzc2lvbnMudHNcIjtcblxuLyoqIEVkaXQgYSB3ZWJob29rLiBSZXF1aXJlcyB0aGUgYE1BTkFHRV9XRUJIT09LU2AgcGVybWlzc2lvbi4gUmV0dXJucyB0aGUgdXBkYXRlZCB3ZWJob29rIG9iamVjdCBvbiBzdWNjZXNzLiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVkaXRXZWJob29rKFxuICBjaGFubmVsSWQ6IGJpZ2ludCxcbiAgd2ViaG9va0lkOiBiaWdpbnQsXG4gIG9wdGlvbnM6IE1vZGlmeVdlYmhvb2ssXG4pIHtcbiAgYXdhaXQgcmVxdWlyZUJvdENoYW5uZWxQZXJtaXNzaW9ucyhjaGFubmVsSWQsIFtcIk1BTkFHRV9XRUJIT09LU1wiXSk7XG5cbiAgcmV0dXJuIGF3YWl0IHJlc3QucnVuTWV0aG9kPFdlYmhvb2s+KFxuICAgIFwicGF0Y2hcIixcbiAgICBlbmRwb2ludHMuV0VCSE9PS19JRCh3ZWJob29rSWQpLFxuICAgIHtcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICBjaGFubmVsX2lkOiBvcHRpb25zLmNoYW5uZWxJZCxcbiAgICB9LFxuICApO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLElBQUksU0FBUSxrQkFBb0I7U0FHaEMsU0FBUyxTQUFRLHVCQUF5QjtTQUMxQyw0QkFBNEIsU0FBUSx5QkFBMkI7QUFFeEUsRUFBZ0gsQUFBaEgsNEdBQWdILEFBQWhILEVBQWdILHVCQUMxRixXQUFXLENBQy9CLFNBQWlCLEVBQ2pCLFNBQWlCLEVBQ2pCLE9BQXNCO1VBRWhCLDRCQUE0QixDQUFDLFNBQVM7U0FBRyxlQUFpQjs7aUJBRW5ELElBQUksQ0FBQyxTQUFTLEVBQ3pCLEtBQU8sR0FDUCxTQUFTLENBQUMsVUFBVSxDQUFDLFNBQVM7V0FFekIsT0FBTztRQUNWLFVBQVUsRUFBRSxPQUFPLENBQUMsU0FBUyJ9
