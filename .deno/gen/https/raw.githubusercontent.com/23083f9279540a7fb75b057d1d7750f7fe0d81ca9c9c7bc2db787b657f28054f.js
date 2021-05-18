import { botId } from "../../bot.ts";
import { rest } from "../../rest/rest.ts";
import { structures } from "../../structures/mod.ts";
import { Errors } from "../../types/discordeno/errors.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotChannelPermissions } from "../../util/permissions.ts";
import { validateComponents } from "../../util/utils.ts";
/** Edit the message. */ export async function editMessage(message, content) {
  if (message.authorId !== botId) {
    throw "You can only edit a message that was sent by the bot.";
  }
  if (typeof content === "string") {
    content = {
      content,
    };
  }
  if (content.components?.length) {
    validateComponents(content.components);
  }
  const requiredPerms = [
    "SEND_MESSAGES",
  ];
  await requireBotChannelPermissions(message.channelId, requiredPerms);
  if (content.content && content.content.length > 2000) {
    throw new Error(Errors.MESSAGE_MAX_LENGTH);
  }
  const result = await rest.runMethod(
    "patch",
    endpoints.CHANNEL_MESSAGE(message.channelId, message.id),
    content,
  );
  return await structures.createDiscordenoMessage(result);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvbWVzc2FnZXMvZWRpdF9tZXNzYWdlLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBib3RJZCB9IGZyb20gXCIuLi8uLi9ib3QudHNcIjtcbmltcG9ydCB7IHJlc3QgfSBmcm9tIFwiLi4vLi4vcmVzdC9yZXN0LnRzXCI7XG5pbXBvcnQgeyBEaXNjb3JkZW5vTWVzc2FnZSB9IGZyb20gXCIuLi8uLi9zdHJ1Y3R1cmVzL21lc3NhZ2UudHNcIjtcbmltcG9ydCB7IHN0cnVjdHVyZXMgfSBmcm9tIFwiLi4vLi4vc3RydWN0dXJlcy9tb2QudHNcIjtcbmltcG9ydCB7IEVycm9ycyB9IGZyb20gXCIuLi8uLi90eXBlcy9kaXNjb3JkZW5vL2Vycm9ycy50c1wiO1xuaW1wb3J0IHsgRWRpdE1lc3NhZ2UgfSBmcm9tIFwiLi4vLi4vdHlwZXMvbWVzc2FnZXMvZWRpdF9tZXNzYWdlLnRzXCI7XG5pbXBvcnQgdHlwZSB7IE1lc3NhZ2UgfSBmcm9tIFwiLi4vLi4vdHlwZXMvbWVzc2FnZXMvbWVzc2FnZS50c1wiO1xuaW1wb3J0IHR5cGUgeyBQZXJtaXNzaW9uU3RyaW5ncyB9IGZyb20gXCIuLi8uLi90eXBlcy9wZXJtaXNzaW9ucy9wZXJtaXNzaW9uX3N0cmluZ3MudHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHsgcmVxdWlyZUJvdENoYW5uZWxQZXJtaXNzaW9ucyB9IGZyb20gXCIuLi8uLi91dGlsL3Blcm1pc3Npb25zLnRzXCI7XG5pbXBvcnQgeyB2YWxpZGF0ZUNvbXBvbmVudHMgfSBmcm9tIFwiLi4vLi4vdXRpbC91dGlscy50c1wiO1xuXG4vKiogRWRpdCB0aGUgbWVzc2FnZS4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlZGl0TWVzc2FnZShcbiAgbWVzc2FnZTogRGlzY29yZGVub01lc3NhZ2UsXG4gIGNvbnRlbnQ6IHN0cmluZyB8IEVkaXRNZXNzYWdlLFxuKSB7XG4gIGlmIChtZXNzYWdlLmF1dGhvcklkICE9PSBib3RJZCkge1xuICAgIHRocm93IFwiWW91IGNhbiBvbmx5IGVkaXQgYSBtZXNzYWdlIHRoYXQgd2FzIHNlbnQgYnkgdGhlIGJvdC5cIjtcbiAgfVxuXG4gIGlmICh0eXBlb2YgY29udGVudCA9PT0gXCJzdHJpbmdcIikgY29udGVudCA9IHsgY29udGVudCB9O1xuXG4gIGlmIChjb250ZW50LmNvbXBvbmVudHM/Lmxlbmd0aCkge1xuICAgIHZhbGlkYXRlQ29tcG9uZW50cyhjb250ZW50LmNvbXBvbmVudHMpO1xuICB9XG5cbiAgY29uc3QgcmVxdWlyZWRQZXJtczogUGVybWlzc2lvblN0cmluZ3NbXSA9IFtcIlNFTkRfTUVTU0FHRVNcIl07XG5cbiAgYXdhaXQgcmVxdWlyZUJvdENoYW5uZWxQZXJtaXNzaW9ucyhtZXNzYWdlLmNoYW5uZWxJZCwgcmVxdWlyZWRQZXJtcyk7XG5cbiAgaWYgKGNvbnRlbnQuY29udGVudCAmJiBjb250ZW50LmNvbnRlbnQubGVuZ3RoID4gMjAwMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihFcnJvcnMuTUVTU0FHRV9NQVhfTEVOR1RIKTtcbiAgfVxuXG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlc3QucnVuTWV0aG9kPE1lc3NhZ2U+KFxuICAgIFwicGF0Y2hcIixcbiAgICBlbmRwb2ludHMuQ0hBTk5FTF9NRVNTQUdFKG1lc3NhZ2UuY2hhbm5lbElkLCBtZXNzYWdlLmlkKSxcbiAgICBjb250ZW50LFxuICApO1xuXG4gIHJldHVybiBhd2FpdCBzdHJ1Y3R1cmVzLmNyZWF0ZURpc2NvcmRlbm9NZXNzYWdlKHJlc3VsdCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsS0FBSyxTQUFRLFlBQWM7U0FDM0IsSUFBSSxTQUFRLGtCQUFvQjtTQUVoQyxVQUFVLFNBQVEsdUJBQXlCO1NBQzNDLE1BQU0sU0FBUSxnQ0FBa0M7U0FJaEQsU0FBUyxTQUFRLHVCQUF5QjtTQUMxQyw0QkFBNEIsU0FBUSx5QkFBMkI7U0FDL0Qsa0JBQWtCLFNBQVEsbUJBQXFCO0FBRXhELEVBQXdCLEFBQXhCLG9CQUF3QixBQUF4QixFQUF3Qix1QkFDRixXQUFXLENBQy9CLE9BQTBCLEVBQzFCLE9BQTZCO1FBRXpCLE9BQU8sQ0FBQyxRQUFRLEtBQUssS0FBSztlQUN0QixxREFBdUQ7O2VBR3BELE9BQU8sTUFBSyxNQUFRLEdBQUUsT0FBTztRQUFLLE9BQU87O1FBRWhELE9BQU8sQ0FBQyxVQUFVLEVBQUUsTUFBTTtRQUM1QixrQkFBa0IsQ0FBQyxPQUFPLENBQUMsVUFBVTs7VUFHakMsYUFBYTtTQUF5QixhQUFlOztVQUVyRCw0QkFBNEIsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLGFBQWE7UUFFL0QsT0FBTyxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxJQUFJO2tCQUN4QyxLQUFLLENBQUMsTUFBTSxDQUFDLGtCQUFrQjs7VUFHckMsTUFBTSxTQUFTLElBQUksQ0FBQyxTQUFTLEVBQ2pDLEtBQU8sR0FDUCxTQUFTLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLEVBQUUsR0FDdkQsT0FBTztpQkFHSSxVQUFVLENBQUMsdUJBQXVCLENBQUMsTUFBTSJ9
