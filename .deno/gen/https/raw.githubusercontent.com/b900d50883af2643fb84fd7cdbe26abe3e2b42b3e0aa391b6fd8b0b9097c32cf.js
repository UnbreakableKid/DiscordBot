import { rest } from "../../rest/rest.ts";
import { structures } from "../../structures/mod.ts";
import { DiscordAllowedMentionsTypes } from "../../types/messages/allowed_mentions_types.ts";
import { Errors } from "../../types/discordeno/errors.ts";
import { endpoints } from "../../util/constants.ts";
/** Send a webhook with webhook Id and webhook token */ export async function sendWebhook(webhookId, webhookToken, options) {
    if (!options.content && !options.file && !options.embeds) {
        throw new Error(Errors.INVALID_WEBHOOK_OPTIONS);
    }
    if (options.content && options.content.length > 2000) {
        throw Error(Errors.MESSAGE_MAX_LENGTH);
    }
    if (options.embeds && options.embeds.length > 10) {
        options.embeds.splice(10);
    }
    if (options.allowedMentions) {
        if (options.allowedMentions.users?.length) {
            if (options.allowedMentions.parse?.includes(DiscordAllowedMentionsTypes.UserMentions)) {
                options.allowedMentions.parse = options.allowedMentions.parse.filter((p)=>p !== "users"
                );
            }
            if (options.allowedMentions.users.length > 100) {
                options.allowedMentions.users = options.allowedMentions.users.slice(0, 100);
            }
        }
        if (options.allowedMentions.roles?.length) {
            if (options.allowedMentions.parse?.includes(DiscordAllowedMentionsTypes.RoleMentions)) {
                options.allowedMentions.parse = options.allowedMentions.parse.filter((p)=>p !== "roles"
                );
            }
            if (options.allowedMentions.roles.length > 100) {
                options.allowedMentions.roles = options.allowedMentions.roles.slice(0, 100);
            }
        }
    }
    const result = await rest.runMethod("post", `${endpoints.WEBHOOK(webhookId, webhookToken)}?wait=${options.wait ?? false}${options.threadId ? `&thread_id=${options.threadId}` : ""}`, {
        ...options,
        allowed_mentions: options.allowedMentions,
        avatar_url: options.avatarUrl
    });
    if (!options.wait) return;
    return structures.createDiscordenoMessage(result);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvd2ViaG9va3Mvc2VuZF93ZWJob29rLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHsgc3RydWN0dXJlcyB9IGZyb20gXCIuLi8uLi9zdHJ1Y3R1cmVzL21vZC50c1wiO1xuaW1wb3J0IHsgRGlzY29yZEFsbG93ZWRNZW50aW9uc1R5cGVzIH0gZnJvbSBcIi4uLy4uL3R5cGVzL21lc3NhZ2VzL2FsbG93ZWRfbWVudGlvbnNfdHlwZXMudHNcIjtcbmltcG9ydCB0eXBlIHsgTWVzc2FnZSB9IGZyb20gXCIuLi8uLi90eXBlcy9tZXNzYWdlcy9tZXNzYWdlLnRzXCI7XG5pbXBvcnQgeyBFcnJvcnMgfSBmcm9tIFwiLi4vLi4vdHlwZXMvZGlzY29yZGVuby9lcnJvcnMudHNcIjtcbmltcG9ydCB0eXBlIHsgRXhlY3V0ZVdlYmhvb2sgfSBmcm9tIFwiLi4vLi4vdHlwZXMvd2ViaG9va3MvZXhlY3V0ZV93ZWJob29rLnRzXCI7XG5pbXBvcnQgeyBlbmRwb2ludHMgfSBmcm9tIFwiLi4vLi4vdXRpbC9jb25zdGFudHMudHNcIjtcblxuLyoqIFNlbmQgYSB3ZWJob29rIHdpdGggd2ViaG9vayBJZCBhbmQgd2ViaG9vayB0b2tlbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlbmRXZWJob29rKFxuICB3ZWJob29rSWQ6IGJpZ2ludCxcbiAgd2ViaG9va1Rva2VuOiBzdHJpbmcsXG4gIG9wdGlvbnM6IEV4ZWN1dGVXZWJob29rLFxuKSB7XG4gIGlmICghb3B0aW9ucy5jb250ZW50ICYmICFvcHRpb25zLmZpbGUgJiYgIW9wdGlvbnMuZW1iZWRzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKEVycm9ycy5JTlZBTElEX1dFQkhPT0tfT1BUSU9OUyk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5jb250ZW50ICYmIG9wdGlvbnMuY29udGVudC5sZW5ndGggPiAyMDAwKSB7XG4gICAgdGhyb3cgRXJyb3IoRXJyb3JzLk1FU1NBR0VfTUFYX0xFTkdUSCk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5lbWJlZHMgJiYgb3B0aW9ucy5lbWJlZHMubGVuZ3RoID4gMTApIHtcbiAgICBvcHRpb25zLmVtYmVkcy5zcGxpY2UoMTApO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMuYWxsb3dlZE1lbnRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMuYWxsb3dlZE1lbnRpb25zLnVzZXJzPy5sZW5ndGgpIHtcbiAgICAgIGlmIChcbiAgICAgICAgb3B0aW9ucy5hbGxvd2VkTWVudGlvbnMucGFyc2U/LmluY2x1ZGVzKFxuICAgICAgICAgIERpc2NvcmRBbGxvd2VkTWVudGlvbnNUeXBlcy5Vc2VyTWVudGlvbnMsXG4gICAgICAgIClcbiAgICAgICkge1xuICAgICAgICBvcHRpb25zLmFsbG93ZWRNZW50aW9ucy5wYXJzZSA9IG9wdGlvbnMuYWxsb3dlZE1lbnRpb25zLnBhcnNlLmZpbHRlcihcbiAgICAgICAgICAocCkgPT4gcCAhPT0gXCJ1c2Vyc1wiLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy5hbGxvd2VkTWVudGlvbnMudXNlcnMubGVuZ3RoID4gMTAwKSB7XG4gICAgICAgIG9wdGlvbnMuYWxsb3dlZE1lbnRpb25zLnVzZXJzID0gb3B0aW9ucy5hbGxvd2VkTWVudGlvbnMudXNlcnMuc2xpY2UoXG4gICAgICAgICAgMCxcbiAgICAgICAgICAxMDAsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuYWxsb3dlZE1lbnRpb25zLnJvbGVzPy5sZW5ndGgpIHtcbiAgICAgIGlmIChcbiAgICAgICAgb3B0aW9ucy5hbGxvd2VkTWVudGlvbnMucGFyc2U/LmluY2x1ZGVzKFxuICAgICAgICAgIERpc2NvcmRBbGxvd2VkTWVudGlvbnNUeXBlcy5Sb2xlTWVudGlvbnMsXG4gICAgICAgIClcbiAgICAgICkge1xuICAgICAgICBvcHRpb25zLmFsbG93ZWRNZW50aW9ucy5wYXJzZSA9IG9wdGlvbnMuYWxsb3dlZE1lbnRpb25zLnBhcnNlLmZpbHRlcihcbiAgICAgICAgICAocCkgPT4gcCAhPT0gXCJyb2xlc1wiLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy5hbGxvd2VkTWVudGlvbnMucm9sZXMubGVuZ3RoID4gMTAwKSB7XG4gICAgICAgIG9wdGlvbnMuYWxsb3dlZE1lbnRpb25zLnJvbGVzID0gb3B0aW9ucy5hbGxvd2VkTWVudGlvbnMucm9sZXMuc2xpY2UoXG4gICAgICAgICAgMCxcbiAgICAgICAgICAxMDAsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzdC5ydW5NZXRob2Q8TWVzc2FnZT4oXG4gICAgXCJwb3N0XCIsXG4gICAgYCR7ZW5kcG9pbnRzLldFQkhPT0sod2ViaG9va0lkLCB3ZWJob29rVG9rZW4pfT93YWl0PSR7b3B0aW9ucy53YWl0ID8/XG4gICAgICBmYWxzZX0ke29wdGlvbnMudGhyZWFkSWQgPyBgJnRocmVhZF9pZD0ke29wdGlvbnMudGhyZWFkSWR9YCA6IFwiXCJ9YCxcbiAgICB7XG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgYWxsb3dlZF9tZW50aW9uczogb3B0aW9ucy5hbGxvd2VkTWVudGlvbnMsXG4gICAgICBhdmF0YXJfdXJsOiBvcHRpb25zLmF2YXRhclVybCxcbiAgICB9LFxuICApO1xuICBpZiAoIW9wdGlvbnMud2FpdCkgcmV0dXJuO1xuXG4gIHJldHVybiBzdHJ1Y3R1cmVzLmNyZWF0ZURpc2NvcmRlbm9NZXNzYWdlKHJlc3VsdCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsSUFBSSxTQUFRLGtCQUFvQjtTQUNoQyxVQUFVLFNBQVEsdUJBQXlCO1NBQzNDLDJCQUEyQixTQUFRLDhDQUFnRDtTQUVuRixNQUFNLFNBQVEsZ0NBQWtDO1NBRWhELFNBQVMsU0FBUSx1QkFBeUI7QUFFbkQsRUFBdUQsQUFBdkQsbURBQXVELEFBQXZELEVBQXVELHVCQUNqQyxXQUFXLENBQy9CLFNBQWlCLEVBQ2pCLFlBQW9CLEVBQ3BCLE9BQXVCO1NBRWxCLE9BQU8sQ0FBQyxPQUFPLEtBQUssT0FBTyxDQUFDLElBQUksS0FBSyxPQUFPLENBQUMsTUFBTTtrQkFDNUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyx1QkFBdUI7O1FBRzVDLE9BQU8sQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSTtjQUM1QyxLQUFLLENBQUMsTUFBTSxDQUFDLGtCQUFrQjs7UUFHbkMsT0FBTyxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxFQUFFO1FBQzlDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUU7O1FBR3RCLE9BQU8sQ0FBQyxlQUFlO1lBQ3JCLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLE1BQU07Z0JBRXJDLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FDckMsMkJBQTJCLENBQUMsWUFBWTtnQkFHMUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUNqRSxDQUFDLEdBQUssQ0FBQyxNQUFLLEtBQU87OztnQkFJcEIsT0FBTyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLEdBQUc7Z0JBQzVDLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FDakUsQ0FBQyxFQUNELEdBQUc7OztZQUtMLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLE1BQU07Z0JBRXJDLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FDckMsMkJBQTJCLENBQUMsWUFBWTtnQkFHMUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUNqRSxDQUFDLEdBQUssQ0FBQyxNQUFLLEtBQU87OztnQkFJcEIsT0FBTyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLEdBQUc7Z0JBQzVDLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FDakUsQ0FBQyxFQUNELEdBQUc7Ozs7VUFNTCxNQUFNLFNBQVMsSUFBSSxDQUFDLFNBQVMsRUFDakMsSUFBTSxNQUNILFNBQVMsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLElBQUksSUFDaEUsS0FBSyxHQUFHLE9BQU8sQ0FBQyxRQUFRLElBQUksV0FBVyxFQUFFLE9BQU8sQ0FBQyxRQUFRO1dBRXRELE9BQU87UUFDVixnQkFBZ0IsRUFBRSxPQUFPLENBQUMsZUFBZTtRQUN6QyxVQUFVLEVBQUUsT0FBTyxDQUFDLFNBQVM7O1NBRzVCLE9BQU8sQ0FBQyxJQUFJO1dBRVYsVUFBVSxDQUFDLHVCQUF1QixDQUFDLE1BQU0ifQ==