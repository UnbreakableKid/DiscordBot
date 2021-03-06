import { rest } from "../../rest/rest.ts";
import { endpoints } from "../../util/constants.ts";
/** Delete a webhook permanently. Returns a undefined on success */ export async function deleteWebhookWithToken(
  webhookId,
  webhookToken,
) {
  return await rest.runMethod(
    "delete",
    endpoints.WEBHOOK(webhookId, webhookToken),
  );
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvd2ViaG9va3MvZGVsZXRlX3dlYmhvb2tfd2l0aF90b2tlbi50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVzdCB9IGZyb20gXCIuLi8uLi9yZXN0L3Jlc3QudHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuXG4vKiogRGVsZXRlIGEgd2ViaG9vayBwZXJtYW5lbnRseS4gUmV0dXJucyBhIHVuZGVmaW5lZCBvbiBzdWNjZXNzICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVsZXRlV2ViaG9va1dpdGhUb2tlbihcbiAgd2ViaG9va0lkOiBiaWdpbnQsXG4gIHdlYmhvb2tUb2tlbjogc3RyaW5nLFxuKSB7XG4gIHJldHVybiBhd2FpdCByZXN0LnJ1bk1ldGhvZDx1bmRlZmluZWQ+KFxuICAgIFwiZGVsZXRlXCIsXG4gICAgZW5kcG9pbnRzLldFQkhPT0sod2ViaG9va0lkLCB3ZWJob29rVG9rZW4pLFxuICApO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLElBQUksU0FBUSxrQkFBb0I7U0FDaEMsU0FBUyxTQUFRLHVCQUF5QjtBQUVuRCxFQUFtRSxBQUFuRSwrREFBbUUsQUFBbkUsRUFBbUUsdUJBQzdDLHNCQUFzQixDQUMxQyxTQUFpQixFQUNqQixZQUFvQjtpQkFFUCxJQUFJLENBQUMsU0FBUyxFQUN6QixNQUFRLEdBQ1IsU0FBUyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsWUFBWSJ9
