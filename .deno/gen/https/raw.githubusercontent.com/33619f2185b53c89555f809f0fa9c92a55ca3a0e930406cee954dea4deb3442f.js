import { rest } from "../../rest/rest.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotChannelPermissions } from "../../util/permissions.ts";
/** Removes a reaction from the given user on this message, defaults to bot. Reaction takes the form of **name:id** for custom guild emoji, or Unicode characters. */ export async function removeReaction(channelId, messageId, reaction, options) {
    if (options?.userId) {
        await requireBotChannelPermissions(channelId, [
            "MANAGE_MESSAGES"
        ]);
    }
    if (reaction.startsWith("<:")) {
        reaction = reaction.substring(2, reaction.length - 1);
    } else if (reaction.startsWith("<a:")) {
        reaction = reaction.substring(3, reaction.length - 1);
    }
    return await rest.runMethod("delete", options?.userId ? endpoints.CHANNEL_MESSAGE_REACTION_USER(channelId, messageId, reaction, options.userId) : endpoints.CHANNEL_MESSAGE_REACTION_ME(channelId, messageId, reaction));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvbWVzc2FnZXMvcmVtb3ZlX3JlYWN0aW9uLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHsgZW5kcG9pbnRzIH0gZnJvbSBcIi4uLy4uL3V0aWwvY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyByZXF1aXJlQm90Q2hhbm5lbFBlcm1pc3Npb25zIH0gZnJvbSBcIi4uLy4uL3V0aWwvcGVybWlzc2lvbnMudHNcIjtcblxuLyoqIFJlbW92ZXMgYSByZWFjdGlvbiBmcm9tIHRoZSBnaXZlbiB1c2VyIG9uIHRoaXMgbWVzc2FnZSwgZGVmYXVsdHMgdG8gYm90LiBSZWFjdGlvbiB0YWtlcyB0aGUgZm9ybSBvZiAqKm5hbWU6aWQqKiBmb3IgY3VzdG9tIGd1aWxkIGVtb2ppLCBvciBVbmljb2RlIGNoYXJhY3RlcnMuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVtb3ZlUmVhY3Rpb24oXG4gIGNoYW5uZWxJZDogYmlnaW50LFxuICBtZXNzYWdlSWQ6IGJpZ2ludCxcbiAgcmVhY3Rpb246IHN0cmluZyxcbiAgb3B0aW9ucz86IHsgdXNlcklkPzogYmlnaW50IH0sXG4pIHtcbiAgaWYgKG9wdGlvbnM/LnVzZXJJZCkge1xuICAgIGF3YWl0IHJlcXVpcmVCb3RDaGFubmVsUGVybWlzc2lvbnMoY2hhbm5lbElkLCBbXCJNQU5BR0VfTUVTU0FHRVNcIl0pO1xuICB9XG5cbiAgaWYgKHJlYWN0aW9uLnN0YXJ0c1dpdGgoXCI8OlwiKSkge1xuICAgIHJlYWN0aW9uID0gcmVhY3Rpb24uc3Vic3RyaW5nKDIsIHJlYWN0aW9uLmxlbmd0aCAtIDEpO1xuICB9IGVsc2UgaWYgKHJlYWN0aW9uLnN0YXJ0c1dpdGgoXCI8YTpcIikpIHtcbiAgICByZWFjdGlvbiA9IHJlYWN0aW9uLnN1YnN0cmluZygzLCByZWFjdGlvbi5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIHJldHVybiBhd2FpdCByZXN0LnJ1bk1ldGhvZDx1bmRlZmluZWQ+KFxuICAgIFwiZGVsZXRlXCIsXG4gICAgb3B0aW9ucz8udXNlcklkXG4gICAgICA/IGVuZHBvaW50cy5DSEFOTkVMX01FU1NBR0VfUkVBQ1RJT05fVVNFUihcbiAgICAgICAgY2hhbm5lbElkLFxuICAgICAgICBtZXNzYWdlSWQsXG4gICAgICAgIHJlYWN0aW9uLFxuICAgICAgICBvcHRpb25zLnVzZXJJZCxcbiAgICAgIClcbiAgICAgIDogZW5kcG9pbnRzLkNIQU5ORUxfTUVTU0FHRV9SRUFDVElPTl9NRShjaGFubmVsSWQsIG1lc3NhZ2VJZCwgcmVhY3Rpb24pLFxuICApO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLElBQUksU0FBUSxrQkFBb0I7U0FDaEMsU0FBUyxTQUFRLHVCQUF5QjtTQUMxQyw0QkFBNEIsU0FBUSx5QkFBMkI7QUFFeEUsRUFBcUssQUFBckssaUtBQXFLLEFBQXJLLEVBQXFLLHVCQUMvSSxjQUFjLENBQ2xDLFNBQWlCLEVBQ2pCLFNBQWlCLEVBQ2pCLFFBQWdCLEVBQ2hCLE9BQTZCO1FBRXpCLE9BQU8sRUFBRSxNQUFNO2NBQ1gsNEJBQTRCLENBQUMsU0FBUzthQUFHLGVBQWlCOzs7UUFHOUQsUUFBUSxDQUFDLFVBQVUsRUFBQyxFQUFJO1FBQzFCLFFBQVEsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUM7ZUFDM0MsUUFBUSxDQUFDLFVBQVUsRUFBQyxHQUFLO1FBQ2xDLFFBQVEsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUM7O2lCQUd6QyxJQUFJLENBQUMsU0FBUyxFQUN6QixNQUFRLEdBQ1IsT0FBTyxFQUFFLE1BQU0sR0FDWCxTQUFTLENBQUMsNkJBQTZCLENBQ3ZDLFNBQVMsRUFDVCxTQUFTLEVBQ1QsUUFBUSxFQUNSLE9BQU8sQ0FBQyxNQUFNLElBRWQsU0FBUyxDQUFDLDJCQUEyQixDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsUUFBUSJ9