import { rest } from "../../rest/rest.ts";
import { endpoints } from "../../util/constants.ts";
export async function deleteWebhookMessage(webhookId, webhookToken, messageId) {
  return await rest.runMethod(
    "delete",
    endpoints.WEBHOOK_MESSAGE(webhookId, webhookToken, messageId),
  );
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvd2ViaG9va3MvZGVsZXRlX3dlYmhvb2tfbWVzc2FnZS50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVzdCB9IGZyb20gXCIuLi8uLi9yZXN0L3Jlc3QudHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVsZXRlV2ViaG9va01lc3NhZ2UoXG4gIHdlYmhvb2tJZDogYmlnaW50LFxuICB3ZWJob29rVG9rZW46IHN0cmluZyxcbiAgbWVzc2FnZUlkOiBiaWdpbnQsXG4pIHtcbiAgcmV0dXJuIGF3YWl0IHJlc3QucnVuTWV0aG9kPHVuZGVmaW5lZD4oXG4gICAgXCJkZWxldGVcIixcbiAgICBlbmRwb2ludHMuV0VCSE9PS19NRVNTQUdFKHdlYmhvb2tJZCwgd2ViaG9va1Rva2VuLCBtZXNzYWdlSWQpLFxuICApO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLElBQUksU0FBUSxrQkFBb0I7U0FDaEMsU0FBUyxTQUFRLHVCQUF5QjtzQkFFN0Isb0JBQW9CLENBQ3hDLFNBQWlCLEVBQ2pCLFlBQW9CLEVBQ3BCLFNBQWlCO2lCQUVKLElBQUksQ0FBQyxTQUFTLEVBQ3pCLE1BQVEsR0FDUixTQUFTLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsU0FBUyJ9
