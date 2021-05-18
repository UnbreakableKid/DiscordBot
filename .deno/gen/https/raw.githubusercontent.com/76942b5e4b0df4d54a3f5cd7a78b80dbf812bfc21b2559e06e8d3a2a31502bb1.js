import { applicationId } from "../../../bot.ts";
import { rest } from "../../../rest/rest.ts";
import { structures } from "../../../structures/mod.ts";
import { Errors } from "../../../types/discordeno/errors.ts";
import { DiscordAllowedMentionsTypes } from "../../../types/messages/allowed_mentions_types.ts";
import { endpoints } from "../../../util/constants.ts";
/** To edit your response to a slash command. If a messageId is not provided it will default to editing the original response. */ export async function editSlashResponse(
  token,
  options,
) {
  if (options.content && options.content.length > 2000) {
    throw Error(Errors.MESSAGE_MAX_LENGTH);
  }
  if (options.embeds && options.embeds.length > 10) {
    options.embeds.splice(10);
  }
  if (options.allowedMentions) {
    if (options.allowedMentions.users?.length) {
      if (
        options.allowedMentions.parse?.includes(
          DiscordAllowedMentionsTypes.UserMentions,
        )
      ) {
        options.allowedMentions.parse = options.allowedMentions.parse.filter((
          p,
        ) => p !== "users");
      }
      if (options.allowedMentions.users.length > 100) {
        options.allowedMentions.users = options.allowedMentions.users.slice(
          0,
          100,
        );
      }
    }
    if (options.allowedMentions.roles?.length) {
      if (
        options.allowedMentions.parse?.includes(
          DiscordAllowedMentionsTypes.RoleMentions,
        )
      ) {
        options.allowedMentions.parse = options.allowedMentions.parse.filter((
          p,
        ) => p !== "roles");
      }
      if (options.allowedMentions.roles.length > 100) {
        options.allowedMentions.roles = options.allowedMentions.roles.slice(
          0,
          100,
        );
      }
    }
  }
  const result = await rest.runMethod(
    "patch",
    options.messageId
      ? endpoints.WEBHOOK_MESSAGE(applicationId, token, options.messageId)
      : endpoints.INTERACTION_ORIGINAL_ID_TOKEN(applicationId, token),
    options,
  );
  // If the original message was edited, this will not return a message
  if (!options.messageId) return result;
  const message = await structures.createDiscordenoMessage(result);
  return message;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvaW50ZXJhY3Rpb25zL2NvbW1hbmRzL2VkaXRfc2xhc2hfcmVzcG9uc2UudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGFwcGxpY2F0aW9uSWQgfSBmcm9tIFwiLi4vLi4vLi4vYm90LnRzXCI7XG5pbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHsgc3RydWN0dXJlcyB9IGZyb20gXCIuLi8uLi8uLi9zdHJ1Y3R1cmVzL21vZC50c1wiO1xuaW1wb3J0IHR5cGUgeyBEaXNjb3JkZW5vRWRpdFdlYmhvb2tNZXNzYWdlIH0gZnJvbSBcIi4uLy4uLy4uL3R5cGVzL2Rpc2NvcmRlbm8vZWRpdF93ZWJob29rX21lc3NhZ2UudHNcIjtcbmltcG9ydCB7IEVycm9ycyB9IGZyb20gXCIuLi8uLi8uLi90eXBlcy9kaXNjb3JkZW5vL2Vycm9ycy50c1wiO1xuaW1wb3J0IHsgRGlzY29yZEFsbG93ZWRNZW50aW9uc1R5cGVzIH0gZnJvbSBcIi4uLy4uLy4uL3R5cGVzL21lc3NhZ2VzL2FsbG93ZWRfbWVudGlvbnNfdHlwZXMudHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuXG4vKiogVG8gZWRpdCB5b3VyIHJlc3BvbnNlIHRvIGEgc2xhc2ggY29tbWFuZC4gSWYgYSBtZXNzYWdlSWQgaXMgbm90IHByb3ZpZGVkIGl0IHdpbGwgZGVmYXVsdCB0byBlZGl0aW5nIHRoZSBvcmlnaW5hbCByZXNwb25zZS4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlZGl0U2xhc2hSZXNwb25zZShcbiAgdG9rZW46IHN0cmluZyxcbiAgb3B0aW9uczogRGlzY29yZGVub0VkaXRXZWJob29rTWVzc2FnZSxcbikge1xuICBpZiAob3B0aW9ucy5jb250ZW50ICYmIG9wdGlvbnMuY29udGVudC5sZW5ndGggPiAyMDAwKSB7XG4gICAgdGhyb3cgRXJyb3IoRXJyb3JzLk1FU1NBR0VfTUFYX0xFTkdUSCk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5lbWJlZHMgJiYgb3B0aW9ucy5lbWJlZHMubGVuZ3RoID4gMTApIHtcbiAgICBvcHRpb25zLmVtYmVkcy5zcGxpY2UoMTApO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMuYWxsb3dlZE1lbnRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMuYWxsb3dlZE1lbnRpb25zLnVzZXJzPy5sZW5ndGgpIHtcbiAgICAgIGlmIChcbiAgICAgICAgb3B0aW9ucy5hbGxvd2VkTWVudGlvbnMucGFyc2U/LmluY2x1ZGVzKFxuICAgICAgICAgIERpc2NvcmRBbGxvd2VkTWVudGlvbnNUeXBlcy5Vc2VyTWVudGlvbnMsXG4gICAgICAgIClcbiAgICAgICkge1xuICAgICAgICBvcHRpb25zLmFsbG93ZWRNZW50aW9ucy5wYXJzZSA9IG9wdGlvbnMuYWxsb3dlZE1lbnRpb25zLnBhcnNlLmZpbHRlcihcbiAgICAgICAgICAocCkgPT4gcCAhPT0gXCJ1c2Vyc1wiLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy5hbGxvd2VkTWVudGlvbnMudXNlcnMubGVuZ3RoID4gMTAwKSB7XG4gICAgICAgIG9wdGlvbnMuYWxsb3dlZE1lbnRpb25zLnVzZXJzID0gb3B0aW9ucy5hbGxvd2VkTWVudGlvbnMudXNlcnMuc2xpY2UoXG4gICAgICAgICAgMCxcbiAgICAgICAgICAxMDAsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuYWxsb3dlZE1lbnRpb25zLnJvbGVzPy5sZW5ndGgpIHtcbiAgICAgIGlmIChcbiAgICAgICAgb3B0aW9ucy5hbGxvd2VkTWVudGlvbnMucGFyc2U/LmluY2x1ZGVzKFxuICAgICAgICAgIERpc2NvcmRBbGxvd2VkTWVudGlvbnNUeXBlcy5Sb2xlTWVudGlvbnMsXG4gICAgICAgIClcbiAgICAgICkge1xuICAgICAgICBvcHRpb25zLmFsbG93ZWRNZW50aW9ucy5wYXJzZSA9IG9wdGlvbnMuYWxsb3dlZE1lbnRpb25zLnBhcnNlLmZpbHRlcihcbiAgICAgICAgICAocCkgPT4gcCAhPT0gXCJyb2xlc1wiLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy5hbGxvd2VkTWVudGlvbnMucm9sZXMubGVuZ3RoID4gMTAwKSB7XG4gICAgICAgIG9wdGlvbnMuYWxsb3dlZE1lbnRpb25zLnJvbGVzID0gb3B0aW9ucy5hbGxvd2VkTWVudGlvbnMucm9sZXMuc2xpY2UoXG4gICAgICAgICAgMCxcbiAgICAgICAgICAxMDAsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzdC5ydW5NZXRob2QoXG4gICAgXCJwYXRjaFwiLFxuICAgIG9wdGlvbnMubWVzc2FnZUlkXG4gICAgICA/IGVuZHBvaW50cy5XRUJIT09LX01FU1NBR0UoYXBwbGljYXRpb25JZCwgdG9rZW4sIG9wdGlvbnMubWVzc2FnZUlkKVxuICAgICAgOiBlbmRwb2ludHMuSU5URVJBQ1RJT05fT1JJR0lOQUxfSURfVE9LRU4oYXBwbGljYXRpb25JZCwgdG9rZW4pLFxuICAgIG9wdGlvbnMsXG4gICk7XG5cbiAgLy8gSWYgdGhlIG9yaWdpbmFsIG1lc3NhZ2Ugd2FzIGVkaXRlZCwgdGhpcyB3aWxsIG5vdCByZXR1cm4gYSBtZXNzYWdlXG4gIGlmICghb3B0aW9ucy5tZXNzYWdlSWQpIHJldHVybiByZXN1bHQgYXMgdW5kZWZpbmVkO1xuXG4gIGNvbnN0IG1lc3NhZ2UgPSBhd2FpdCBzdHJ1Y3R1cmVzLmNyZWF0ZURpc2NvcmRlbm9NZXNzYWdlKFxuICAgIHJlc3VsdCxcbiAgKTtcbiAgcmV0dXJuIG1lc3NhZ2U7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsYUFBYSxTQUFRLGVBQWlCO1NBQ3RDLElBQUksU0FBUSxxQkFBdUI7U0FDbkMsVUFBVSxTQUFRLDBCQUE0QjtTQUU5QyxNQUFNLFNBQVEsbUNBQXFDO1NBQ25ELDJCQUEyQixTQUFRLGlEQUFtRDtTQUN0RixTQUFTLFNBQVEsMEJBQTRCO0FBRXRELEVBQWlJLEFBQWpJLDZIQUFpSSxBQUFqSSxFQUFpSSx1QkFDM0csaUJBQWlCLENBQ3JDLEtBQWEsRUFDYixPQUFxQztRQUVqQyxPQUFPLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUk7Y0FDNUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0I7O1FBR25DLE9BQU8sQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsRUFBRTtRQUM5QyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFOztRQUd0QixPQUFPLENBQUMsZUFBZTtZQUNyQixPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxNQUFNO2dCQUVyQyxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQ3JDLDJCQUEyQixDQUFDLFlBQVk7Z0JBRzFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFDakUsQ0FBQyxHQUFLLENBQUMsTUFBSyxLQUFPOzs7Z0JBSXBCLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHO2dCQUM1QyxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQ2pFLENBQUMsRUFDRCxHQUFHOzs7WUFLTCxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxNQUFNO2dCQUVyQyxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQ3JDLDJCQUEyQixDQUFDLFlBQVk7Z0JBRzFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFDakUsQ0FBQyxHQUFLLENBQUMsTUFBSyxLQUFPOzs7Z0JBSXBCLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHO2dCQUM1QyxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQ2pFLENBQUMsRUFDRCxHQUFHOzs7O1VBTUwsTUFBTSxTQUFTLElBQUksQ0FBQyxTQUFTLEVBQ2pDLEtBQU8sR0FDUCxPQUFPLENBQUMsU0FBUyxHQUNiLFNBQVMsQ0FBQyxlQUFlLENBQUMsYUFBYSxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsU0FBUyxJQUNqRSxTQUFTLENBQUMsNkJBQTZCLENBQUMsYUFBYSxFQUFFLEtBQUssR0FDaEUsT0FBTztJQUdULEVBQXFFLEFBQXJFLG1FQUFxRTtTQUNoRSxPQUFPLENBQUMsU0FBUyxTQUFTLE1BQU07VUFFL0IsT0FBTyxTQUFTLFVBQVUsQ0FBQyx1QkFBdUIsQ0FDdEQsTUFBTTtXQUVELE9BQU8ifQ==
