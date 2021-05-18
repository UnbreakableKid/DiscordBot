import { applicationId, eventHandlers } from "../../bot.ts";
import { cache } from "../../cache.ts";
import { rest } from "../../rest/rest.ts";
import { endpoints } from "../../util/constants.ts";
import { validateComponents } from "../../util/utils.ts";
/**
 * Send a response to a users slash command. The command data will have the id and token necessary to respond.
 * Interaction `tokens` are valid for **15 minutes** and can be used to send followup messages.
 *
 * NOTE: By default we will suppress mentions. To enable mentions, just pass any mentions object.
 */ export async function sendInteractionResponse(id, token, options) {
    // TODO: add more options validations
    if (options.data?.components) validateComponents(options.data?.components);
    // If its already been executed, we need to send a followup response
    if (cache.executedSlashCommands.has(token)) {
        return await rest.runMethod("post", endpoints.WEBHOOK(applicationId, token), {
            ...options
        });
    }
    // Expire in 15 minutes
    cache.executedSlashCommands.add(token);
    setTimeout(()=>{
        eventHandlers.debug?.("loop", `Running setTimeout in send_interaction_response file.`);
        cache.executedSlashCommands.delete(token);
    }, 900000);
    // If the user wants this as a private message mark it ephemeral
    if (options.private) {
        options.data = {
            ...options.data,
            flags: 64
        };
    }
    // If no mentions are provided, force disable mentions
    if (!options.data?.allowedMentions) {
        options.data = {
            ...options.data,
            allowedMentions: {
                parse: []
            }
        };
    }
    return await rest.runMethod("post", endpoints.INTERACTION_ID_TOKEN(id, token), options);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvaW50ZXJhY3Rpb25zL3NlbmRfaW50ZXJhY3Rpb25fcmVzcG9uc2UudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGFwcGxpY2F0aW9uSWQsIGV2ZW50SGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vYm90LnRzXCI7XG5pbXBvcnQgeyBjYWNoZSB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuaW1wb3J0IHsgcmVzdCB9IGZyb20gXCIuLi8uLi9yZXN0L3Jlc3QudHNcIjtcbmltcG9ydCB0eXBlIHsgRGlzY29yZGVub0ludGVyYWN0aW9uUmVzcG9uc2UgfSBmcm9tIFwiLi4vLi4vdHlwZXMvZGlzY29yZGVuby9pbnRlcmFjdGlvbl9yZXNwb25zZS50c1wiO1xuaW1wb3J0IHsgZW5kcG9pbnRzIH0gZnJvbSBcIi4uLy4uL3V0aWwvY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyB2YWxpZGF0ZUNvbXBvbmVudHMgfSBmcm9tIFwiLi4vLi4vdXRpbC91dGlscy50c1wiO1xuXG4vKipcbiAqIFNlbmQgYSByZXNwb25zZSB0byBhIHVzZXJzIHNsYXNoIGNvbW1hbmQuIFRoZSBjb21tYW5kIGRhdGEgd2lsbCBoYXZlIHRoZSBpZCBhbmQgdG9rZW4gbmVjZXNzYXJ5IHRvIHJlc3BvbmQuXG4gKiBJbnRlcmFjdGlvbiBgdG9rZW5zYCBhcmUgdmFsaWQgZm9yICoqMTUgbWludXRlcyoqIGFuZCBjYW4gYmUgdXNlZCB0byBzZW5kIGZvbGxvd3VwIG1lc3NhZ2VzLlxuICpcbiAqIE5PVEU6IEJ5IGRlZmF1bHQgd2Ugd2lsbCBzdXBwcmVzcyBtZW50aW9ucy4gVG8gZW5hYmxlIG1lbnRpb25zLCBqdXN0IHBhc3MgYW55IG1lbnRpb25zIG9iamVjdC5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlbmRJbnRlcmFjdGlvblJlc3BvbnNlKFxuICBpZDogYmlnaW50LFxuICB0b2tlbjogc3RyaW5nLFxuICBvcHRpb25zOiBEaXNjb3JkZW5vSW50ZXJhY3Rpb25SZXNwb25zZSxcbikge1xuICAvLyBUT0RPOiBhZGQgbW9yZSBvcHRpb25zIHZhbGlkYXRpb25zXG4gIGlmIChvcHRpb25zLmRhdGE/LmNvbXBvbmVudHMpIHZhbGlkYXRlQ29tcG9uZW50cyhvcHRpb25zLmRhdGE/LmNvbXBvbmVudHMpO1xuICAvLyBJZiBpdHMgYWxyZWFkeSBiZWVuIGV4ZWN1dGVkLCB3ZSBuZWVkIHRvIHNlbmQgYSBmb2xsb3d1cCByZXNwb25zZVxuICBpZiAoY2FjaGUuZXhlY3V0ZWRTbGFzaENvbW1hbmRzLmhhcyh0b2tlbikpIHtcbiAgICByZXR1cm4gYXdhaXQgcmVzdC5ydW5NZXRob2QoXG4gICAgICBcInBvc3RcIixcbiAgICAgIGVuZHBvaW50cy5XRUJIT09LKGFwcGxpY2F0aW9uSWQsIHRva2VuKSxcbiAgICAgIHtcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIC8vIEV4cGlyZSBpbiAxNSBtaW51dGVzXG4gIGNhY2hlLmV4ZWN1dGVkU2xhc2hDb21tYW5kcy5hZGQodG9rZW4pO1xuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBldmVudEhhbmRsZXJzLmRlYnVnPy4oXG4gICAgICBcImxvb3BcIixcbiAgICAgIGBSdW5uaW5nIHNldFRpbWVvdXQgaW4gc2VuZF9pbnRlcmFjdGlvbl9yZXNwb25zZSBmaWxlLmAsXG4gICAgKTtcbiAgICBjYWNoZS5leGVjdXRlZFNsYXNoQ29tbWFuZHMuZGVsZXRlKHRva2VuKTtcbiAgfSwgOTAwMDAwKTtcblxuICAvLyBJZiB0aGUgdXNlciB3YW50cyB0aGlzIGFzIGEgcHJpdmF0ZSBtZXNzYWdlIG1hcmsgaXQgZXBoZW1lcmFsXG4gIGlmIChvcHRpb25zLnByaXZhdGUpIHtcbiAgICBvcHRpb25zLmRhdGEgPSB7IC4uLm9wdGlvbnMuZGF0YSwgZmxhZ3M6IDY0IH07XG4gIH1cblxuICAvLyBJZiBubyBtZW50aW9ucyBhcmUgcHJvdmlkZWQsIGZvcmNlIGRpc2FibGUgbWVudGlvbnNcbiAgaWYgKCFvcHRpb25zLmRhdGE/LmFsbG93ZWRNZW50aW9ucykge1xuICAgIG9wdGlvbnMuZGF0YSA9IHsgLi4ub3B0aW9ucy5kYXRhLCBhbGxvd2VkTWVudGlvbnM6IHsgcGFyc2U6IFtdIH0gfTtcbiAgfVxuXG4gIHJldHVybiBhd2FpdCByZXN0LnJ1bk1ldGhvZChcbiAgICBcInBvc3RcIixcbiAgICBlbmRwb2ludHMuSU5URVJBQ1RJT05fSURfVE9LRU4oaWQsIHRva2VuKSxcbiAgICBvcHRpb25zLFxuICApO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLGFBQWEsRUFBRSxhQUFhLFNBQVEsWUFBYztTQUNsRCxLQUFLLFNBQVEsY0FBZ0I7U0FDN0IsSUFBSSxTQUFRLGtCQUFvQjtTQUVoQyxTQUFTLFNBQVEsdUJBQXlCO1NBQzFDLGtCQUFrQixTQUFRLG1CQUFxQjtBQUV4RCxFQUtHLEFBTEg7Ozs7O0NBS0csQUFMSCxFQUtHLHVCQUNtQix1QkFBdUIsQ0FDM0MsRUFBVSxFQUNWLEtBQWEsRUFDYixPQUFzQztJQUV0QyxFQUFxQyxBQUFyQyxtQ0FBcUM7UUFDakMsT0FBTyxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsa0JBQWtCLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxVQUFVO0lBQ3pFLEVBQW9FLEFBQXBFLGtFQUFvRTtRQUNoRSxLQUFLLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLEtBQUs7cUJBQzFCLElBQUksQ0FBQyxTQUFTLEVBQ3pCLElBQU0sR0FDTixTQUFTLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxLQUFLO2VBRWpDLE9BQU87OztJQUtoQixFQUF1QixBQUF2QixxQkFBdUI7SUFDdkIsS0FBSyxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxLQUFLO0lBQ3JDLFVBQVU7UUFDUixhQUFhLENBQUMsS0FBSyxJQUNqQixJQUFNLElBQ0wscURBQXFEO1FBRXhELEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsS0FBSztPQUN2QyxNQUFNO0lBRVQsRUFBZ0UsQUFBaEUsOERBQWdFO1FBQzVELE9BQU8sQ0FBQyxPQUFPO1FBQ2pCLE9BQU8sQ0FBQyxJQUFJO2VBQVEsT0FBTyxDQUFDLElBQUk7WUFBRSxLQUFLLEVBQUUsRUFBRTs7O0lBRzdDLEVBQXNELEFBQXRELG9EQUFzRDtTQUNqRCxPQUFPLENBQUMsSUFBSSxFQUFFLGVBQWU7UUFDaEMsT0FBTyxDQUFDLElBQUk7ZUFBUSxPQUFPLENBQUMsSUFBSTtZQUFFLGVBQWU7Z0JBQUksS0FBSzs7OztpQkFHL0MsSUFBSSxDQUFDLFNBQVMsRUFDekIsSUFBTSxHQUNOLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLEVBQUUsS0FBSyxHQUN4QyxPQUFPIn0=