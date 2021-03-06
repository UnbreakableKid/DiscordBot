import { applicationId } from "../../../bot.ts";
import { rest } from "../../../rest/rest.ts";
import { Collection } from "../../../util/collection.ts";
import { endpoints } from "../../../util/constants.ts";
/** Fetch all of the global commands for your application. */ export async function getSlashCommands(
  guildId,
) {
  const result = await rest.runMethod(
    "get",
    guildId
      ? endpoints.COMMANDS_GUILD(applicationId, guildId)
      : endpoints.COMMANDS(applicationId),
  );
  return new Collection(result.map((command) => [
    command.name,
    command,
  ]));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvaW50ZXJhY3Rpb25zL2NvbW1hbmRzL2dldF9zbGFzaF9jb21tYW5kcy50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYXBwbGljYXRpb25JZCB9IGZyb20gXCIuLi8uLi8uLi9ib3QudHNcIjtcbmltcG9ydCB7IHJlc3QgfSBmcm9tIFwiLi4vLi4vLi4vcmVzdC9yZXN0LnRzXCI7XG5pbXBvcnQgdHlwZSB7IEFwcGxpY2F0aW9uQ29tbWFuZCB9IGZyb20gXCIuLi8uLi8uLi90eXBlcy9pbnRlcmFjdGlvbnMvY29tbWFuZHMvYXBwbGljYXRpb25fY29tbWFuZC50c1wiO1xuaW1wb3J0IHsgQ29sbGVjdGlvbiB9IGZyb20gXCIuLi8uLi8uLi91dGlsL2NvbGxlY3Rpb24udHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuXG4vKiogRmV0Y2ggYWxsIG9mIHRoZSBnbG9iYWwgY29tbWFuZHMgZm9yIHlvdXIgYXBwbGljYXRpb24uICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0U2xhc2hDb21tYW5kcyhndWlsZElkPzogYmlnaW50KSB7XG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlc3QucnVuTWV0aG9kPEFwcGxpY2F0aW9uQ29tbWFuZFtdPihcbiAgICBcImdldFwiLFxuICAgIGd1aWxkSWRcbiAgICAgID8gZW5kcG9pbnRzLkNPTU1BTkRTX0dVSUxEKGFwcGxpY2F0aW9uSWQsIGd1aWxkSWQpXG4gICAgICA6IGVuZHBvaW50cy5DT01NQU5EUyhhcHBsaWNhdGlvbklkKSxcbiAgKTtcblxuICByZXR1cm4gbmV3IENvbGxlY3Rpb24ocmVzdWx0Lm1hcCgoY29tbWFuZCkgPT4gW2NvbW1hbmQubmFtZSwgY29tbWFuZF0pKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxhQUFhLFNBQVEsZUFBaUI7U0FDdEMsSUFBSSxTQUFRLHFCQUF1QjtTQUVuQyxVQUFVLFNBQVEsMkJBQTZCO1NBQy9DLFNBQVMsU0FBUSwwQkFBNEI7QUFFdEQsRUFBNkQsQUFBN0QseURBQTZELEFBQTdELEVBQTZELHVCQUN2QyxnQkFBZ0IsQ0FBQyxPQUFnQjtVQUMvQyxNQUFNLFNBQVMsSUFBSSxDQUFDLFNBQVMsRUFDakMsR0FBSyxHQUNMLE9BQU8sR0FDSCxTQUFTLENBQUMsY0FBYyxDQUFDLGFBQWEsRUFBRSxPQUFPLElBQy9DLFNBQVMsQ0FBQyxRQUFRLENBQUMsYUFBYTtlQUczQixVQUFVLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxPQUFPO1lBQU0sT0FBTyxDQUFDLElBQUk7WUFBRSxPQUFPIn0=
