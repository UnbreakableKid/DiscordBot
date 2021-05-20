import { rest } from "../../rest/rest.ts";
import { Errors } from "../../types/discordeno/errors.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotChannelPermissions } from "../../util/permissions.ts";
import { urlToBase64 } from "../../util/utils.ts";
import { validateLength } from "../../util/validate_length.ts";
/**
 * Create a new webhook. Requires the MANAGE_WEBHOOKS permission. Returns a webhook object on success. Webhook names follow our naming restrictions that can be found in our Usernames and Nicknames documentation, with the following additional stipulations:
 *
 * Webhook names cannot be: 'clyde'
 */ export async function createWebhook(channelId, options) {
  await requireBotChannelPermissions(channelId, [
    "MANAGE_WEBHOOKS",
  ]);
  if (
    // Specific usernames that discord does not allow
    options.name === "clyde" || !validateLength(options.name, {
      min: 2,
      max: 32,
    })
  ) {
    throw new Error(Errors.INVALID_WEBHOOK_NAME);
  }
  return await rest.runMethod("post", endpoints.CHANNEL_WEBHOOKS(channelId), {
    ...options,
    avatar: options.avatar ? await urlToBase64(options.avatar) : undefined,
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvd2ViaG9va3MvY3JlYXRlX3dlYmhvb2sudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHJlc3QgfSBmcm9tIFwiLi4vLi4vcmVzdC9yZXN0LnRzXCI7XG5pbXBvcnQgeyBFcnJvcnMgfSBmcm9tIFwiLi4vLi4vdHlwZXMvZGlzY29yZGVuby9lcnJvcnMudHNcIjtcbmltcG9ydCB0eXBlIHsgQ3JlYXRlV2ViaG9vayB9IGZyb20gXCIuLi8uLi90eXBlcy93ZWJob29rcy9jcmVhdGVfd2ViaG9vay50c1wiO1xuaW1wb3J0IHR5cGUgeyBXZWJob29rIH0gZnJvbSBcIi4uLy4uL3R5cGVzL3dlYmhvb2tzL3dlYmhvb2sudHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHsgcmVxdWlyZUJvdENoYW5uZWxQZXJtaXNzaW9ucyB9IGZyb20gXCIuLi8uLi91dGlsL3Blcm1pc3Npb25zLnRzXCI7XG5pbXBvcnQgeyB1cmxUb0Jhc2U2NCB9IGZyb20gXCIuLi8uLi91dGlsL3V0aWxzLnRzXCI7XG5pbXBvcnQgeyB2YWxpZGF0ZUxlbmd0aCB9IGZyb20gXCIuLi8uLi91dGlsL3ZhbGlkYXRlX2xlbmd0aC50c1wiO1xuXG4vKipcbiAqIENyZWF0ZSBhIG5ldyB3ZWJob29rLiBSZXF1aXJlcyB0aGUgTUFOQUdFX1dFQkhPT0tTIHBlcm1pc3Npb24uIFJldHVybnMgYSB3ZWJob29rIG9iamVjdCBvbiBzdWNjZXNzLiBXZWJob29rIG5hbWVzIGZvbGxvdyBvdXIgbmFtaW5nIHJlc3RyaWN0aW9ucyB0aGF0IGNhbiBiZSBmb3VuZCBpbiBvdXIgVXNlcm5hbWVzIGFuZCBOaWNrbmFtZXMgZG9jdW1lbnRhdGlvbiwgd2l0aCB0aGUgZm9sbG93aW5nIGFkZGl0aW9uYWwgc3RpcHVsYXRpb25zOlxuICpcbiAqIFdlYmhvb2sgbmFtZXMgY2Fubm90IGJlOiAnY2x5ZGUnXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVXZWJob29rKFxuICBjaGFubmVsSWQ6IGJpZ2ludCxcbiAgb3B0aW9uczogQ3JlYXRlV2ViaG9vayxcbikge1xuICBhd2FpdCByZXF1aXJlQm90Q2hhbm5lbFBlcm1pc3Npb25zKGNoYW5uZWxJZCwgW1wiTUFOQUdFX1dFQkhPT0tTXCJdKTtcblxuICBpZiAoXG4gICAgLy8gU3BlY2lmaWMgdXNlcm5hbWVzIHRoYXQgZGlzY29yZCBkb2VzIG5vdCBhbGxvd1xuICAgIG9wdGlvbnMubmFtZSA9PT0gXCJjbHlkZVwiIHx8XG4gICAgIXZhbGlkYXRlTGVuZ3RoKG9wdGlvbnMubmFtZSwgeyBtaW46IDIsIG1heDogMzIgfSlcbiAgKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKEVycm9ycy5JTlZBTElEX1dFQkhPT0tfTkFNRSk7XG4gIH1cblxuICByZXR1cm4gYXdhaXQgcmVzdC5ydW5NZXRob2Q8V2ViaG9vaz4oXG4gICAgXCJwb3N0XCIsXG4gICAgZW5kcG9pbnRzLkNIQU5ORUxfV0VCSE9PS1MoY2hhbm5lbElkKSxcbiAgICB7XG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgYXZhdGFyOiBvcHRpb25zLmF2YXRhciA/IGF3YWl0IHVybFRvQmFzZTY0KG9wdGlvbnMuYXZhdGFyKSA6IHVuZGVmaW5lZCxcbiAgICB9LFxuICApO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLElBQUksU0FBUSxrQkFBb0I7U0FDaEMsTUFBTSxTQUFRLGdDQUFrQztTQUdoRCxTQUFTLFNBQVEsdUJBQXlCO1NBQzFDLDRCQUE0QixTQUFRLHlCQUEyQjtTQUMvRCxXQUFXLFNBQVEsbUJBQXFCO1NBQ3hDLGNBQWMsU0FBUSw2QkFBK0I7QUFFOUQsRUFJRyxBQUpIOzs7O0NBSUcsQUFKSCxFQUlHLHVCQUNtQixhQUFhLENBQ2pDLFNBQWlCLEVBQ2pCLE9BQXNCO1VBRWhCLDRCQUE0QixDQUFDLFNBQVM7U0FBRyxlQUFpQjs7UUFHOUQsRUFBaUQsQUFBakQsK0NBQWlEO0lBQ2pELE9BQU8sQ0FBQyxJQUFJLE1BQUssS0FBTyxNQUN2QixjQUFjLENBQUMsT0FBTyxDQUFDLElBQUk7UUFBSSxHQUFHLEVBQUUsQ0FBQztRQUFFLEdBQUcsRUFBRSxFQUFFOztrQkFFckMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxvQkFBb0I7O2lCQUdoQyxJQUFJLENBQUMsU0FBUyxFQUN6QixJQUFNLEdBQ04sU0FBUyxDQUFDLGdCQUFnQixDQUFDLFNBQVM7V0FFL0IsT0FBTztRQUNWLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTSxTQUFTLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLFNBQVMifQ==