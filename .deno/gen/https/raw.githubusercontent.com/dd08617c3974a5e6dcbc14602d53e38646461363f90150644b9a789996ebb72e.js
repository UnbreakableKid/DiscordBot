import { rest } from "../../rest/rest.ts";
import { Errors } from "../../types/discordeno/errors.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotChannelPermissions } from "../../util/permissions.ts";
/** Delete messages from the channel. 2-100. Requires the MANAGE_MESSAGES permission */ export async function deleteMessages(channelId, ids, reason) {
    await requireBotChannelPermissions(channelId, [
        "MANAGE_MESSAGES"
    ]);
    if (ids.length < 2) {
        throw new Error(Errors.DELETE_MESSAGES_MIN);
    }
    if (ids.length > 100) {
        console.warn(`This endpoint only accepts a maximum of 100 messages. Deleting the first 100 message ids provided.`);
    }
    return await rest.runMethod("post", endpoints.CHANNEL_BULK_DELETE(channelId), {
        messages: ids.splice(0, 100),
        reason
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvbWVzc2FnZXMvZGVsZXRlX21lc3NhZ2VzLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHsgRXJyb3JzIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2Rpc2NvcmRlbm8vZXJyb3JzLnRzXCI7XG5pbXBvcnQgeyBlbmRwb2ludHMgfSBmcm9tIFwiLi4vLi4vdXRpbC9jb25zdGFudHMudHNcIjtcbmltcG9ydCB7IHJlcXVpcmVCb3RDaGFubmVsUGVybWlzc2lvbnMgfSBmcm9tIFwiLi4vLi4vdXRpbC9wZXJtaXNzaW9ucy50c1wiO1xuXG4vKiogRGVsZXRlIG1lc3NhZ2VzIGZyb20gdGhlIGNoYW5uZWwuIDItMTAwLiBSZXF1aXJlcyB0aGUgTUFOQUdFX01FU1NBR0VTIHBlcm1pc3Npb24gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWxldGVNZXNzYWdlcyhcbiAgY2hhbm5lbElkOiBiaWdpbnQsXG4gIGlkczogYmlnaW50W10sXG4gIHJlYXNvbj86IHN0cmluZyxcbikge1xuICBhd2FpdCByZXF1aXJlQm90Q2hhbm5lbFBlcm1pc3Npb25zKGNoYW5uZWxJZCwgW1wiTUFOQUdFX01FU1NBR0VTXCJdKTtcblxuICBpZiAoaWRzLmxlbmd0aCA8IDIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLkRFTEVURV9NRVNTQUdFU19NSU4pO1xuICB9XG5cbiAgaWYgKGlkcy5sZW5ndGggPiAxMDApIHtcbiAgICBjb25zb2xlLndhcm4oXG4gICAgICBgVGhpcyBlbmRwb2ludCBvbmx5IGFjY2VwdHMgYSBtYXhpbXVtIG9mIDEwMCBtZXNzYWdlcy4gRGVsZXRpbmcgdGhlIGZpcnN0IDEwMCBtZXNzYWdlIGlkcyBwcm92aWRlZC5gLFxuICAgICk7XG4gIH1cblxuICByZXR1cm4gYXdhaXQgcmVzdC5ydW5NZXRob2Q8dW5kZWZpbmVkPihcbiAgICBcInBvc3RcIixcbiAgICBlbmRwb2ludHMuQ0hBTk5FTF9CVUxLX0RFTEVURShjaGFubmVsSWQpLFxuICAgIHtcbiAgICAgIG1lc3NhZ2VzOiBpZHMuc3BsaWNlKDAsIDEwMCksXG4gICAgICByZWFzb24sXG4gICAgfSxcbiAgKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxJQUFJLFNBQVEsa0JBQW9CO1NBQ2hDLE1BQU0sU0FBUSxnQ0FBa0M7U0FDaEQsU0FBUyxTQUFRLHVCQUF5QjtTQUMxQyw0QkFBNEIsU0FBUSx5QkFBMkI7QUFFeEUsRUFBdUYsQUFBdkYsbUZBQXVGLEFBQXZGLEVBQXVGLHVCQUNqRSxjQUFjLENBQ2xDLFNBQWlCLEVBQ2pCLEdBQWEsRUFDYixNQUFlO1VBRVQsNEJBQTRCLENBQUMsU0FBUztTQUFHLGVBQWlCOztRQUU1RCxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUM7a0JBQ04sS0FBSyxDQUFDLE1BQU0sQ0FBQyxtQkFBbUI7O1FBR3hDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsR0FBRztRQUNsQixPQUFPLENBQUMsSUFBSSxFQUNULGtHQUFrRzs7aUJBSTFGLElBQUksQ0FBQyxTQUFTLEVBQ3pCLElBQU0sR0FDTixTQUFTLENBQUMsbUJBQW1CLENBQUMsU0FBUztRQUVyQyxRQUFRLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsR0FBRztRQUMzQixNQUFNIn0=