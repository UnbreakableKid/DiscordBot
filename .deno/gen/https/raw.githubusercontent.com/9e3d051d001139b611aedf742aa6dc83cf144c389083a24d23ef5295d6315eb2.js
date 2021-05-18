import { rest } from "../../rest/rest.ts";
import { structures } from "../../structures/mod.ts";
import { Errors } from "../../types/discordeno/errors.ts";
import { DiscordAllowedMentionsTypes } from "../../types/messages/allowed_mentions_types.ts";
import { endpoints } from "../../util/constants.ts";
import { validateComponents } from "../../util/utils.ts";
export async function editWebhookMessage(webhookId, webhookToken, options) {
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
  if (options.components?.length) {
    validateComponents(options.components);
  }
  const result = await rest.runMethod(
    "patch",
    options.messageId
      ? endpoints.WEBHOOK_MESSAGE(webhookId, webhookToken, options.messageId)
      : endpoints.WEBHOOK_MESSAGE_ORIGINAL(webhookId, webhookToken),
    {
      ...options,
      allowedMentions: options.allowedMentions,
    },
  );
  return await structures.createDiscordenoMessage(result);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvd2ViaG9va3MvZWRpdF93ZWJob29rX21lc3NhZ2UudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHJlc3QgfSBmcm9tIFwiLi4vLi4vcmVzdC9yZXN0LnRzXCI7XG5pbXBvcnQgeyBzdHJ1Y3R1cmVzIH0gZnJvbSBcIi4uLy4uL3N0cnVjdHVyZXMvbW9kLnRzXCI7XG5pbXBvcnQgeyBFcnJvcnMgfSBmcm9tIFwiLi4vLi4vdHlwZXMvZGlzY29yZGVuby9lcnJvcnMudHNcIjtcbmltcG9ydCB7IERpc2NvcmRBbGxvd2VkTWVudGlvbnNUeXBlcyB9IGZyb20gXCIuLi8uLi90eXBlcy9tZXNzYWdlcy9hbGxvd2VkX21lbnRpb25zX3R5cGVzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IE1lc3NhZ2UgfSBmcm9tIFwiLi4vLi4vdHlwZXMvbWVzc2FnZXMvbWVzc2FnZS50c1wiO1xuaW1wb3J0IHR5cGUgeyBFZGl0V2ViaG9va01lc3NhZ2UgfSBmcm9tIFwiLi4vLi4vdHlwZXMvd2ViaG9va3MvZWRpdF93ZWJob29rX21lc3NhZ2UudHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHsgdmFsaWRhdGVDb21wb25lbnRzIH0gZnJvbSBcIi4uLy4uL3V0aWwvdXRpbHMudHNcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVkaXRXZWJob29rTWVzc2FnZShcbiAgd2ViaG9va0lkOiBiaWdpbnQsXG4gIHdlYmhvb2tUb2tlbjogc3RyaW5nLFxuICBvcHRpb25zOiBFZGl0V2ViaG9va01lc3NhZ2UgJiB7IG1lc3NhZ2VJZD86IGJpZ2ludCB9LFxuKSB7XG4gIGlmIChvcHRpb25zLmNvbnRlbnQgJiYgb3B0aW9ucy5jb250ZW50Lmxlbmd0aCA+IDIwMDApIHtcbiAgICB0aHJvdyBFcnJvcihFcnJvcnMuTUVTU0FHRV9NQVhfTEVOR1RIKTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmVtYmVkcyAmJiBvcHRpb25zLmVtYmVkcy5sZW5ndGggPiAxMCkge1xuICAgIG9wdGlvbnMuZW1iZWRzLnNwbGljZSgxMCk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5hbGxvd2VkTWVudGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy5hbGxvd2VkTWVudGlvbnMudXNlcnM/Lmxlbmd0aCkge1xuICAgICAgaWYgKFxuICAgICAgICBvcHRpb25zLmFsbG93ZWRNZW50aW9ucy5wYXJzZT8uaW5jbHVkZXMoXG4gICAgICAgICAgRGlzY29yZEFsbG93ZWRNZW50aW9uc1R5cGVzLlVzZXJNZW50aW9ucyxcbiAgICAgICAgKVxuICAgICAgKSB7XG4gICAgICAgIG9wdGlvbnMuYWxsb3dlZE1lbnRpb25zLnBhcnNlID0gb3B0aW9ucy5hbGxvd2VkTWVudGlvbnMucGFyc2UuZmlsdGVyKFxuICAgICAgICAgIChwKSA9PiBwICE9PSBcInVzZXJzXCIsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLmFsbG93ZWRNZW50aW9ucy51c2Vycy5sZW5ndGggPiAxMDApIHtcbiAgICAgICAgb3B0aW9ucy5hbGxvd2VkTWVudGlvbnMudXNlcnMgPSBvcHRpb25zLmFsbG93ZWRNZW50aW9ucy51c2Vycy5zbGljZShcbiAgICAgICAgICAwLFxuICAgICAgICAgIDEwMCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5hbGxvd2VkTWVudGlvbnMucm9sZXM/Lmxlbmd0aCkge1xuICAgICAgaWYgKFxuICAgICAgICBvcHRpb25zLmFsbG93ZWRNZW50aW9ucy5wYXJzZT8uaW5jbHVkZXMoXG4gICAgICAgICAgRGlzY29yZEFsbG93ZWRNZW50aW9uc1R5cGVzLlJvbGVNZW50aW9ucyxcbiAgICAgICAgKVxuICAgICAgKSB7XG4gICAgICAgIG9wdGlvbnMuYWxsb3dlZE1lbnRpb25zLnBhcnNlID0gb3B0aW9ucy5hbGxvd2VkTWVudGlvbnMucGFyc2UuZmlsdGVyKFxuICAgICAgICAgIChwKSA9PiBwICE9PSBcInJvbGVzXCIsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLmFsbG93ZWRNZW50aW9ucy5yb2xlcy5sZW5ndGggPiAxMDApIHtcbiAgICAgICAgb3B0aW9ucy5hbGxvd2VkTWVudGlvbnMucm9sZXMgPSBvcHRpb25zLmFsbG93ZWRNZW50aW9ucy5yb2xlcy5zbGljZShcbiAgICAgICAgICAwLFxuICAgICAgICAgIDEwMCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAob3B0aW9ucy5jb21wb25lbnRzPy5sZW5ndGgpIHtcbiAgICB2YWxpZGF0ZUNvbXBvbmVudHMob3B0aW9ucy5jb21wb25lbnRzKTtcbiAgfVxuXG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlc3QucnVuTWV0aG9kPE1lc3NhZ2U+KFxuICAgIFwicGF0Y2hcIixcbiAgICBvcHRpb25zLm1lc3NhZ2VJZFxuICAgICAgPyBlbmRwb2ludHMuV0VCSE9PS19NRVNTQUdFKHdlYmhvb2tJZCwgd2ViaG9va1Rva2VuLCBvcHRpb25zLm1lc3NhZ2VJZClcbiAgICAgIDogZW5kcG9pbnRzLldFQkhPT0tfTUVTU0FHRV9PUklHSU5BTCh3ZWJob29rSWQsIHdlYmhvb2tUb2tlbiksXG4gICAgeyAuLi5vcHRpb25zLCBhbGxvd2VkTWVudGlvbnM6IG9wdGlvbnMuYWxsb3dlZE1lbnRpb25zIH0sXG4gICk7XG5cbiAgcmV0dXJuIGF3YWl0IHN0cnVjdHVyZXMuY3JlYXRlRGlzY29yZGVub01lc3NhZ2UocmVzdWx0KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxJQUFJLFNBQVEsa0JBQW9CO1NBQ2hDLFVBQVUsU0FBUSx1QkFBeUI7U0FDM0MsTUFBTSxTQUFRLGdDQUFrQztTQUNoRCwyQkFBMkIsU0FBUSw4Q0FBZ0Q7U0FHbkYsU0FBUyxTQUFRLHVCQUF5QjtTQUMxQyxrQkFBa0IsU0FBUSxtQkFBcUI7c0JBRWxDLGtCQUFrQixDQUN0QyxTQUFpQixFQUNqQixZQUFvQixFQUNwQixPQUFvRDtRQUVoRCxPQUFPLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUk7Y0FDNUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0I7O1FBR25DLE9BQU8sQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsRUFBRTtRQUM5QyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFOztRQUd0QixPQUFPLENBQUMsZUFBZTtZQUNyQixPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxNQUFNO2dCQUVyQyxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQ3JDLDJCQUEyQixDQUFDLFlBQVk7Z0JBRzFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFDakUsQ0FBQyxHQUFLLENBQUMsTUFBSyxLQUFPOzs7Z0JBSXBCLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHO2dCQUM1QyxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQ2pFLENBQUMsRUFDRCxHQUFHOzs7WUFLTCxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxNQUFNO2dCQUVyQyxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQ3JDLDJCQUEyQixDQUFDLFlBQVk7Z0JBRzFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFDakUsQ0FBQyxHQUFLLENBQUMsTUFBSyxLQUFPOzs7Z0JBSXBCLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHO2dCQUM1QyxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQ2pFLENBQUMsRUFDRCxHQUFHOzs7O1FBTVAsT0FBTyxDQUFDLFVBQVUsRUFBRSxNQUFNO1FBQzVCLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxVQUFVOztVQUdqQyxNQUFNLFNBQVMsSUFBSSxDQUFDLFNBQVMsRUFDakMsS0FBTyxHQUNQLE9BQU8sQ0FBQyxTQUFTLEdBQ2IsU0FBUyxDQUFDLGVBQWUsQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLE9BQU8sQ0FBQyxTQUFTLElBQ3BFLFNBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxTQUFTLEVBQUUsWUFBWTtXQUN6RCxPQUFPO1FBQUUsZUFBZSxFQUFFLE9BQU8sQ0FBQyxlQUFlOztpQkFHM0MsVUFBVSxDQUFDLHVCQUF1QixDQUFDLE1BQU0ifQ==
