import { rest } from "../../rest/rest.ts";
import { endpoints } from "../../util/constants.ts";
import { hasOwnProperty, snakelize } from "../../util/utils.ts";
/**
 * Updates the a user's voice state, defaults to the current user
 * Caveats:
 *  - `channel_id` must currently point to a stage channel.
 *  - User must already have joined `channel_id`.
 *  - You must have the `MUTE_MEMBERS` permission. But can always suppress yourself.
 *  - When unsuppressed, non-bot users will have their `request_to_speak_timestamp` set to the current time. Bot users will not.
 *  - You must have the `REQUEST_TO_SPEAK` permission to request to speak. You can always clear your own request to speak.
 *  - You are able to set `request_to_speak_timestamp` to any present or future time.
 *  - When suppressed, the user will have their `request_to_speak_timestamp` removed.
 */ export async function updateBotVoiceState(guildId, options) {
  return await rest.runMethod(
    "patch",
    endpoints.UPDATE_VOICE_STATE(
      guildId,
      hasOwnProperty(options, "userId") ? options.userId : undefined,
    ),
    snakelize(options),
  );
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvY2hhbm5lbHMvdXBkYXRlX3ZvaWNlX3N0YXRlLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHsgVXBkYXRlT3RoZXJzVm9pY2VTdGF0ZSB9IGZyb20gXCIuLi8uLi90eXBlcy9ndWlsZHMvdXBkYXRlX290aGVyc192b2ljZV9zdGF0ZS50c1wiO1xuaW1wb3J0IHR5cGUge1xuICBVcGRhdGVTZWxmVm9pY2VTdGF0ZSxcbn0gZnJvbSBcIi4uLy4uL3R5cGVzL2d1aWxkcy91cGRhdGVfc2VsZl92b2ljZV9zdGF0ZS50c1wiO1xuaW1wb3J0IHsgZW5kcG9pbnRzIH0gZnJvbSBcIi4uLy4uL3V0aWwvY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyBoYXNPd25Qcm9wZXJ0eSwgc25ha2VsaXplIH0gZnJvbSBcIi4uLy4uL3V0aWwvdXRpbHMudHNcIjtcblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBhIHVzZXIncyB2b2ljZSBzdGF0ZSwgZGVmYXVsdHMgdG8gdGhlIGN1cnJlbnQgdXNlclxuICogQ2F2ZWF0czpcbiAqICAtIGBjaGFubmVsX2lkYCBtdXN0IGN1cnJlbnRseSBwb2ludCB0byBhIHN0YWdlIGNoYW5uZWwuXG4gKiAgLSBVc2VyIG11c3QgYWxyZWFkeSBoYXZlIGpvaW5lZCBgY2hhbm5lbF9pZGAuXG4gKiAgLSBZb3UgbXVzdCBoYXZlIHRoZSBgTVVURV9NRU1CRVJTYCBwZXJtaXNzaW9uLiBCdXQgY2FuIGFsd2F5cyBzdXBwcmVzcyB5b3Vyc2VsZi5cbiAqICAtIFdoZW4gdW5zdXBwcmVzc2VkLCBub24tYm90IHVzZXJzIHdpbGwgaGF2ZSB0aGVpciBgcmVxdWVzdF90b19zcGVha190aW1lc3RhbXBgIHNldCB0byB0aGUgY3VycmVudCB0aW1lLiBCb3QgdXNlcnMgd2lsbCBub3QuXG4gKiAgLSBZb3UgbXVzdCBoYXZlIHRoZSBgUkVRVUVTVF9UT19TUEVBS2AgcGVybWlzc2lvbiB0byByZXF1ZXN0IHRvIHNwZWFrLiBZb3UgY2FuIGFsd2F5cyBjbGVhciB5b3VyIG93biByZXF1ZXN0IHRvIHNwZWFrLlxuICogIC0gWW91IGFyZSBhYmxlIHRvIHNldCBgcmVxdWVzdF90b19zcGVha190aW1lc3RhbXBgIHRvIGFueSBwcmVzZW50IG9yIGZ1dHVyZSB0aW1lLlxuICogIC0gV2hlbiBzdXBwcmVzc2VkLCB0aGUgdXNlciB3aWxsIGhhdmUgdGhlaXIgYHJlcXVlc3RfdG9fc3BlYWtfdGltZXN0YW1wYCByZW1vdmVkLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBkYXRlQm90Vm9pY2VTdGF0ZShcbiAgZ3VpbGRJZDogYmlnaW50LFxuICBvcHRpb25zOiBVcGRhdGVTZWxmVm9pY2VTdGF0ZSB8IHsgdXNlcklkOiBiaWdpbnQgfSAmIFVwZGF0ZU90aGVyc1ZvaWNlU3RhdGUsXG4pIHtcbiAgcmV0dXJuIGF3YWl0IHJlc3QucnVuTWV0aG9kKFxuICAgIFwicGF0Y2hcIixcbiAgICBlbmRwb2ludHMuVVBEQVRFX1ZPSUNFX1NUQVRFKFxuICAgICAgZ3VpbGRJZCxcbiAgICAgIGhhc093blByb3BlcnR5KG9wdGlvbnMsIFwidXNlcklkXCIpID8gb3B0aW9ucy51c2VySWQgOiB1bmRlZmluZWQsXG4gICAgKSxcbiAgICBzbmFrZWxpemUob3B0aW9ucyksXG4gICk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsSUFBSSxTQUFRLGtCQUFvQjtTQUtoQyxTQUFTLFNBQVEsdUJBQXlCO1NBQzFDLGNBQWMsRUFBRSxTQUFTLFNBQVEsbUJBQXFCO0FBRS9ELEVBVUcsQUFWSDs7Ozs7Ozs7OztDQVVHLEFBVkgsRUFVRyx1QkFDbUIsbUJBQW1CLENBQ3ZDLE9BQWUsRUFDZixPQUEyRTtpQkFFOUQsSUFBSSxDQUFDLFNBQVMsRUFDekIsS0FBTyxHQUNQLFNBQVMsQ0FBQyxrQkFBa0IsQ0FDMUIsT0FBTyxFQUNQLGNBQWMsQ0FBQyxPQUFPLEdBQUUsTUFBUSxLQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsU0FBUyxHQUVoRSxTQUFTLENBQUMsT0FBTyJ9