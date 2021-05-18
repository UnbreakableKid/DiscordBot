import { rest } from "../../rest/rest.ts";
import { endpoints } from "../../util/constants.ts";
/** Edit a webhook. Returns the updated webhook object on success. */ export async function editWebhookWithToken(
  webhookId,
  webhookToken,
  options,
) {
  return await rest.runMethod(
    "patch",
    endpoints.WEBHOOK(webhookId, webhookToken),
    options,
  );
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvd2ViaG9va3MvZWRpdF93ZWJob29rX3dpdGhfdG9rZW4udHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHJlc3QgfSBmcm9tIFwiLi4vLi4vcmVzdC9yZXN0LnRzXCI7XG5pbXBvcnQgdHlwZSB7IE1vZGlmeVdlYmhvb2sgfSBmcm9tIFwiLi4vLi4vdHlwZXMvd2ViaG9va3MvbW9kaWZ5X3dlYmhvb2sudHNcIjtcbmltcG9ydCB0eXBlIHsgV2ViaG9vayB9IGZyb20gXCIuLi8uLi90eXBlcy93ZWJob29rcy93ZWJob29rLnRzXCI7XG5pbXBvcnQgeyBlbmRwb2ludHMgfSBmcm9tIFwiLi4vLi4vdXRpbC9jb25zdGFudHMudHNcIjtcblxuLyoqIEVkaXQgYSB3ZWJob29rLiBSZXR1cm5zIHRoZSB1cGRhdGVkIHdlYmhvb2sgb2JqZWN0IG9uIHN1Y2Nlc3MuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZWRpdFdlYmhvb2tXaXRoVG9rZW4oXG4gIHdlYmhvb2tJZDogYmlnaW50LFxuICB3ZWJob29rVG9rZW46IHN0cmluZyxcbiAgb3B0aW9uczogT21pdDxNb2RpZnlXZWJob29rLCBcImNoYW5uZWxJZFwiPixcbikge1xuICByZXR1cm4gYXdhaXQgcmVzdC5ydW5NZXRob2Q8V2ViaG9vaz4oXG4gICAgXCJwYXRjaFwiLFxuICAgIGVuZHBvaW50cy5XRUJIT09LKHdlYmhvb2tJZCwgd2ViaG9va1Rva2VuKSxcbiAgICBvcHRpb25zLFxuICApO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLElBQUksU0FBUSxrQkFBb0I7U0FHaEMsU0FBUyxTQUFRLHVCQUF5QjtBQUVuRCxFQUFxRSxBQUFyRSxpRUFBcUUsQUFBckUsRUFBcUUsdUJBQy9DLG9CQUFvQixDQUN4QyxTQUFpQixFQUNqQixZQUFvQixFQUNwQixPQUF5QztpQkFFNUIsSUFBSSxDQUFDLFNBQVMsRUFDekIsS0FBTyxHQUNQLFNBQVMsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFlBQVksR0FDekMsT0FBTyJ9
