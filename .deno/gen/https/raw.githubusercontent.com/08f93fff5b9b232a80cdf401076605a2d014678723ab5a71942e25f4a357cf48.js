import { applicationId } from "../../../bot.ts";
import { rest } from "../../../rest/rest.ts";
import { endpoints } from "../../../util/constants.ts";
/** To delete your response to a slash command. If a message id is not provided, it will default to deleting the original response. */ export async function deleteSlashResponse(
  token,
  messageId,
) {
  return await rest.runMethod(
    "delete",
    messageId
      ? endpoints.INTERACTION_ID_TOKEN_MESSAGE_ID(
        applicationId,
        token,
        messageId,
      )
      : endpoints.INTERACTION_ORIGINAL_ID_TOKEN(applicationId, token),
  );
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvaW50ZXJhY3Rpb25zL2NvbW1hbmRzL2RlbGV0ZV9zbGFzaF9yZXNwb25zZS50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYXBwbGljYXRpb25JZCB9IGZyb20gXCIuLi8uLi8uLi9ib3QudHNcIjtcbmltcG9ydCB7IHJlc3QgfSBmcm9tIFwiLi4vLi4vLi4vcmVzdC9yZXN0LnRzXCI7XG5pbXBvcnQgeyBlbmRwb2ludHMgfSBmcm9tIFwiLi4vLi4vLi4vdXRpbC9jb25zdGFudHMudHNcIjtcblxuLyoqIFRvIGRlbGV0ZSB5b3VyIHJlc3BvbnNlIHRvIGEgc2xhc2ggY29tbWFuZC4gSWYgYSBtZXNzYWdlIGlkIGlzIG5vdCBwcm92aWRlZCwgaXQgd2lsbCBkZWZhdWx0IHRvIGRlbGV0aW5nIHRoZSBvcmlnaW5hbCByZXNwb25zZS4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWxldGVTbGFzaFJlc3BvbnNlKFxuICB0b2tlbjogc3RyaW5nLFxuICBtZXNzYWdlSWQ/OiBiaWdpbnQsXG4pIHtcbiAgcmV0dXJuIGF3YWl0IHJlc3QucnVuTWV0aG9kPHVuZGVmaW5lZD4oXG4gICAgXCJkZWxldGVcIixcbiAgICBtZXNzYWdlSWRcbiAgICAgID8gZW5kcG9pbnRzLklOVEVSQUNUSU9OX0lEX1RPS0VOX01FU1NBR0VfSUQoXG4gICAgICAgIGFwcGxpY2F0aW9uSWQsXG4gICAgICAgIHRva2VuLFxuICAgICAgICBtZXNzYWdlSWQsXG4gICAgICApXG4gICAgICA6IGVuZHBvaW50cy5JTlRFUkFDVElPTl9PUklHSU5BTF9JRF9UT0tFTihhcHBsaWNhdGlvbklkLCB0b2tlbiksXG4gICk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsYUFBYSxTQUFRLGVBQWlCO1NBQ3RDLElBQUksU0FBUSxxQkFBdUI7U0FDbkMsU0FBUyxTQUFRLDBCQUE0QjtBQUV0RCxFQUFzSSxBQUF0SSxrSUFBc0ksQUFBdEksRUFBc0ksdUJBQ2hILG1CQUFtQixDQUN2QyxLQUFhLEVBQ2IsU0FBa0I7aUJBRUwsSUFBSSxDQUFDLFNBQVMsRUFDekIsTUFBUSxHQUNSLFNBQVMsR0FDTCxTQUFTLENBQUMsK0JBQStCLENBQ3pDLGFBQWEsRUFDYixLQUFLLEVBQ0wsU0FBUyxJQUVULFNBQVMsQ0FBQyw2QkFBNkIsQ0FBQyxhQUFhLEVBQUUsS0FBSyJ9
