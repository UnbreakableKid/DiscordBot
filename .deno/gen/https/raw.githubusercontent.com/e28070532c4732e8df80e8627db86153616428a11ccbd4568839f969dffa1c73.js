import { handleChannelCreate } from "./channels/CHANNEL_CREATE.ts";
import { handleChannelDelete } from "./channels/CHANNEL_DELETE.ts";
import { handleChannelPinsUpdate } from "./channels/CHANNEL_PINS_UPDATE.ts";
import { handleChannelUpdate } from "./channels/CHANNEL_UPDATE.ts";
import { handleThreadCreate } from "./channels/THREAD_CREATE.ts";
import { handleThreadDelete } from "./channels/THREAD_DELETE.ts";
import { handleThreadListSync } from "./channels/THREAD_LIST_SYNC.ts";
import { handleThreadMembersUpdate } from "./channels/THREAD_MEMBERS_UPDATE.ts";
import { handleThreadMemberUpdate } from "./channels/THREAD_MEMBER_UPDATE.ts";
import { handleThreadUpdate } from "./channels/THREAD_UPDATE.ts";
import { handleApplicationCommandCreate } from "./commands/APPLICATION_COMMAND_CREATE.ts";
import { handleApplicationCommandDelete } from "./commands/APPLICATION_COMMAND_DELETE.ts";
import { handleApplicationCommandUpdate } from "./commands/APPLICATION_COMMAND_UPDATE.ts";
import { handleGuildEmojisUpdate } from "./emojis/GUILD_EMOJIS_UPDATE.ts";
import { handleGuildBanAdd } from "./guilds/GUILD_BAN_ADD.ts";
import { handleGuildBanRemove } from "./guilds/GUILD_BAN_REMOVE.ts";
import { handleGuildCreate } from "./guilds/GUILD_CREATE.ts";
import { handleGuildDelete } from "./guilds/GUILD_DELETE.ts";
import { handleGuildIntegrationsUpdate } from "./guilds/GUILD_INTEGRATIONS_UPDATE.ts";
import { handleGuildUpdate } from "./guilds/GUILD_UPDATE.ts";
import { handleIntegrationCreate } from "./integrations/INTEGRATION_CREATE.ts";
import { handleIntegrationDelete } from "./integrations/INTEGRATION_DELETE.ts";
import { handleIntegrationUpdate } from "./integrations/INTEGRATION_UPDATE.ts";
import { handleInteractionCreate } from "./interactions/INTERACTION_CREATE.ts";
import { handleInviteCreate } from "./invites/INVITE_CREATE.ts";
import { handleGuildMembersChunk } from "./members/GUILD_MEMBERS_CHUNK.ts";
import { handleGuildMemberAdd } from "./members/GUILD_MEMBER_ADD.ts";
import { handleGuildMemberRemove } from "./members/GUILD_MEMBER_REMOVE.ts";
import { handleGuildMemberUpdate } from "./members/GUILD_MEMBER_UPDATE.ts";
import { handleMessageCreate } from "./messages/MESSAGE_CREATE.ts";
import { handleMessageDelete } from "./messages/MESSAGE_DELETE.ts";
import { handleMessageDeleteBulk } from "./messages/MESSAGE_DELETE_BULK.ts";
import { handleMessageReactionAdd } from "./messages/MESSAGE_REACTION_ADD.ts";
import { handleMessageReactionRemove } from "./messages/MESSAGE_REACTION_REMOVE.ts";
import { handleMessageReactionRemoveAll } from "./messages/MESSAGE_REACTION_REMOVE_ALL.ts";
import { handleMessageReactionRemoveEmoji } from "./messages/MESSAGE_REACTION_REMOVE_EMOJI.ts";
import { handleMessageUpdate } from "./messages/MESSAGE_UPDATE.ts";
import { handlePresenceUpdate } from "./misc/PRESENCE_UPDATE.ts";
import { handleReady } from "./misc/READY.ts";
import { handleTypingStart } from "./misc/TYPING_START.ts";
import { handleUserUpdate } from "./misc/USER_UPDATE.ts";
import { handleGuildRoleCreate } from "./roles/GUILD_ROLE_CREATE.ts";
import { handleGuildRoleDelete } from "./roles/GUILD_ROLE_DELETE.ts";
import { handleGuildRoleUpdate } from "./roles/GUILD_ROLE_UPDATE.ts";
import { handleVoiceServerUpdate } from "./voice/VOICE_SERVER_UPDATE.ts";
import { handleVoiceStateUpdate } from "./voice/VOICE_STATE_UPDATE.ts";
import { handleWebhooksUpdate } from "./webhooks/WEBHOOKS_UPDATE.ts";
export {
  handleApplicationCommandCreate,
  handleApplicationCommandDelete,
  handleApplicationCommandUpdate,
  handleChannelCreate,
  handleChannelDelete,
  handleChannelPinsUpdate,
  handleChannelUpdate,
  handleGuildBanAdd,
  handleGuildBanRemove,
  handleGuildCreate,
  handleGuildDelete,
  handleGuildEmojisUpdate,
  handleGuildIntegrationsUpdate,
  handleGuildMemberAdd,
  handleGuildMemberRemove,
  handleGuildMembersChunk,
  handleGuildMemberUpdate,
  handleGuildRoleCreate,
  handleGuildRoleDelete,
  handleGuildRoleUpdate,
  handleGuildUpdate,
  handleIntegrationCreate,
  handleIntegrationDelete,
  handleIntegrationUpdate,
  handleInteractionCreate,
  handleInviteCreate,
  handleMessageCreate,
  handleMessageDelete,
  handleMessageDeleteBulk,
  handleMessageReactionAdd,
  handleMessageReactionRemove,
  handleMessageReactionRemoveAll,
  handleMessageReactionRemoveEmoji,
  handleMessageUpdate,
  handlePresenceUpdate,
  handleReady,
  handleThreadCreate,
  handleThreadDelete,
  handleThreadListSync,
  handleThreadMembersUpdate,
  handleThreadMemberUpdate,
  handleThreadUpdate,
  handleTypingStart,
  handleUserUpdate,
  handleVoiceServerUpdate,
  handleVoiceStateUpdate,
  handleWebhooksUpdate,
};
export let handlers = {
  // misc
  READY: handleReady,
  // channels
  CHANNEL_CREATE: handleChannelCreate,
  CHANNEL_DELETE: handleChannelDelete,
  CHANNEL_PINS_UPDATE: handleChannelPinsUpdate,
  CHANNEL_UPDATE: handleChannelUpdate,
  THREAD_CREATE: handleThreadCreate,
  THREAD_UPDATE: handleThreadUpdate,
  THREAD_DELETE: handleThreadDelete,
  THREAD_LIST_SYNC: handleThreadListSync,
  THREAD_MEMBER_UPDATE: handleThreadMemberUpdate,
  THREAD_MEMBERS_UPDATE: handleThreadMembersUpdate,
  // commands
  APPLICATION_COMMAND_CREATE: handleApplicationCommandCreate,
  APPLICATION_COMMAND_DELETE: handleApplicationCommandDelete,
  APPLICATION_COMMAND_UPDATE: handleApplicationCommandUpdate,
  // guilds
  GUILD_BAN_ADD: handleGuildBanAdd,
  GUILD_BAN_REMOVE: handleGuildBanRemove,
  GUILD_CREATE: handleGuildCreate,
  GUILD_DELETE: handleGuildDelete,
  GUILD_EMOJIS_UPDATE: handleGuildEmojisUpdate,
  GUILD_INTEGRATIONS_UPDATE: handleGuildIntegrationsUpdate,
  GUILD_MEMBER_ADD: handleGuildMemberAdd,
  GUILD_MEMBER_REMOVE: handleGuildMemberRemove,
  GUILD_MEMBER_UPDATE: handleGuildMemberUpdate,
  GUILD_MEMBERS_CHUNK: handleGuildMembersChunk,
  GUILD_ROLE_CREATE: handleGuildRoleCreate,
  GUILD_ROLE_DELETE: handleGuildRoleDelete,
  GUILD_ROLE_UPDATE: handleGuildRoleUpdate,
  GUILD_UPDATE: handleGuildUpdate,
  // interactions
  INTERACTION_CREATE: handleInteractionCreate,
  // invites
  INVITE_CREATE: handleInviteCreate,
  INVITE_DELETE: handleInviteCreate,
  // messages
  MESSAGE_CREATE: handleMessageCreate,
  MESSAGE_DELETE_BULK: handleMessageDeleteBulk,
  MESSAGE_DELETE: handleMessageDelete,
  MESSAGE_REACTION_ADD: handleMessageReactionAdd,
  MESSAGE_REACTION_REMOVE_ALL: handleMessageReactionRemoveAll,
  MESSAGE_REACTION_REMOVE_EMOJI: handleMessageReactionRemoveEmoji,
  MESSAGE_REACTION_REMOVE: handleMessageReactionRemove,
  MESSAGE_UPDATE: handleMessageUpdate,
  // presence
  PRESENCE_UPDATE: handlePresenceUpdate,
  TYPING_START: handleTypingStart,
  USER_UPDATE: handleUserUpdate,
  // voice
  VOICE_SERVER_UPDATE: handleVoiceServerUpdate,
  VOICE_STATE_UPDATE: handleVoiceStateUpdate,
  // webhooks
  WEBHOOKS_UPDATE: handleWebhooksUpdate,
  // integrations
  INTEGRATION_CREATE: handleIntegrationCreate,
  INTEGRATION_UPDATE: handleIntegrationUpdate,
  INTEGRATION_DELETE: handleIntegrationDelete,
};
export function updateHandlers(newHandlers) {
  handlers = {
    ...handlers,
    ...newHandlers,
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hhbmRsZXJzL21vZC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaGFuZGxlQ2hhbm5lbENyZWF0ZSB9IGZyb20gXCIuL2NoYW5uZWxzL0NIQU5ORUxfQ1JFQVRFLnRzXCI7XG5pbXBvcnQgeyBoYW5kbGVDaGFubmVsRGVsZXRlIH0gZnJvbSBcIi4vY2hhbm5lbHMvQ0hBTk5FTF9ERUxFVEUudHNcIjtcbmltcG9ydCB7IGhhbmRsZUNoYW5uZWxQaW5zVXBkYXRlIH0gZnJvbSBcIi4vY2hhbm5lbHMvQ0hBTk5FTF9QSU5TX1VQREFURS50c1wiO1xuaW1wb3J0IHsgaGFuZGxlQ2hhbm5lbFVwZGF0ZSB9IGZyb20gXCIuL2NoYW5uZWxzL0NIQU5ORUxfVVBEQVRFLnRzXCI7XG5pbXBvcnQgeyBoYW5kbGVUaHJlYWRDcmVhdGUgfSBmcm9tIFwiLi9jaGFubmVscy9USFJFQURfQ1JFQVRFLnRzXCI7XG5pbXBvcnQgeyBoYW5kbGVUaHJlYWREZWxldGUgfSBmcm9tIFwiLi9jaGFubmVscy9USFJFQURfREVMRVRFLnRzXCI7XG5pbXBvcnQgeyBoYW5kbGVUaHJlYWRMaXN0U3luYyB9IGZyb20gXCIuL2NoYW5uZWxzL1RIUkVBRF9MSVNUX1NZTkMudHNcIjtcbmltcG9ydCB7IGhhbmRsZVRocmVhZE1lbWJlcnNVcGRhdGUgfSBmcm9tIFwiLi9jaGFubmVscy9USFJFQURfTUVNQkVSU19VUERBVEUudHNcIjtcbmltcG9ydCB7IGhhbmRsZVRocmVhZE1lbWJlclVwZGF0ZSB9IGZyb20gXCIuL2NoYW5uZWxzL1RIUkVBRF9NRU1CRVJfVVBEQVRFLnRzXCI7XG5pbXBvcnQgeyBoYW5kbGVUaHJlYWRVcGRhdGUgfSBmcm9tIFwiLi9jaGFubmVscy9USFJFQURfVVBEQVRFLnRzXCI7XG5pbXBvcnQgeyBoYW5kbGVBcHBsaWNhdGlvbkNvbW1hbmRDcmVhdGUgfSBmcm9tIFwiLi9jb21tYW5kcy9BUFBMSUNBVElPTl9DT01NQU5EX0NSRUFURS50c1wiO1xuaW1wb3J0IHsgaGFuZGxlQXBwbGljYXRpb25Db21tYW5kRGVsZXRlIH0gZnJvbSBcIi4vY29tbWFuZHMvQVBQTElDQVRJT05fQ09NTUFORF9ERUxFVEUudHNcIjtcbmltcG9ydCB7IGhhbmRsZUFwcGxpY2F0aW9uQ29tbWFuZFVwZGF0ZSB9IGZyb20gXCIuL2NvbW1hbmRzL0FQUExJQ0FUSU9OX0NPTU1BTkRfVVBEQVRFLnRzXCI7XG5pbXBvcnQgeyBoYW5kbGVHdWlsZEVtb2ppc1VwZGF0ZSB9IGZyb20gXCIuL2Vtb2ppcy9HVUlMRF9FTU9KSVNfVVBEQVRFLnRzXCI7XG5pbXBvcnQgeyBoYW5kbGVHdWlsZEJhbkFkZCB9IGZyb20gXCIuL2d1aWxkcy9HVUlMRF9CQU5fQURELnRzXCI7XG5pbXBvcnQgeyBoYW5kbGVHdWlsZEJhblJlbW92ZSB9IGZyb20gXCIuL2d1aWxkcy9HVUlMRF9CQU5fUkVNT1ZFLnRzXCI7XG5pbXBvcnQgeyBoYW5kbGVHdWlsZENyZWF0ZSB9IGZyb20gXCIuL2d1aWxkcy9HVUlMRF9DUkVBVEUudHNcIjtcbmltcG9ydCB7IGhhbmRsZUd1aWxkRGVsZXRlIH0gZnJvbSBcIi4vZ3VpbGRzL0dVSUxEX0RFTEVURS50c1wiO1xuaW1wb3J0IHsgaGFuZGxlR3VpbGRJbnRlZ3JhdGlvbnNVcGRhdGUgfSBmcm9tIFwiLi9ndWlsZHMvR1VJTERfSU5URUdSQVRJT05TX1VQREFURS50c1wiO1xuaW1wb3J0IHsgaGFuZGxlR3VpbGRVcGRhdGUgfSBmcm9tIFwiLi9ndWlsZHMvR1VJTERfVVBEQVRFLnRzXCI7XG5pbXBvcnQgeyBoYW5kbGVJbnRlZ3JhdGlvbkNyZWF0ZSB9IGZyb20gXCIuL2ludGVncmF0aW9ucy9JTlRFR1JBVElPTl9DUkVBVEUudHNcIjtcbmltcG9ydCB7IGhhbmRsZUludGVncmF0aW9uRGVsZXRlIH0gZnJvbSBcIi4vaW50ZWdyYXRpb25zL0lOVEVHUkFUSU9OX0RFTEVURS50c1wiO1xuaW1wb3J0IHsgaGFuZGxlSW50ZWdyYXRpb25VcGRhdGUgfSBmcm9tIFwiLi9pbnRlZ3JhdGlvbnMvSU5URUdSQVRJT05fVVBEQVRFLnRzXCI7XG5pbXBvcnQgeyBoYW5kbGVJbnRlcmFjdGlvbkNyZWF0ZSB9IGZyb20gXCIuL2ludGVyYWN0aW9ucy9JTlRFUkFDVElPTl9DUkVBVEUudHNcIjtcbmltcG9ydCB7IGhhbmRsZUludml0ZUNyZWF0ZSB9IGZyb20gXCIuL2ludml0ZXMvSU5WSVRFX0NSRUFURS50c1wiO1xuaW1wb3J0IHsgaGFuZGxlR3VpbGRNZW1iZXJzQ2h1bmsgfSBmcm9tIFwiLi9tZW1iZXJzL0dVSUxEX01FTUJFUlNfQ0hVTksudHNcIjtcbmltcG9ydCB7IGhhbmRsZUd1aWxkTWVtYmVyQWRkIH0gZnJvbSBcIi4vbWVtYmVycy9HVUlMRF9NRU1CRVJfQURELnRzXCI7XG5pbXBvcnQgeyBoYW5kbGVHdWlsZE1lbWJlclJlbW92ZSB9IGZyb20gXCIuL21lbWJlcnMvR1VJTERfTUVNQkVSX1JFTU9WRS50c1wiO1xuaW1wb3J0IHsgaGFuZGxlR3VpbGRNZW1iZXJVcGRhdGUgfSBmcm9tIFwiLi9tZW1iZXJzL0dVSUxEX01FTUJFUl9VUERBVEUudHNcIjtcbmltcG9ydCB7IGhhbmRsZU1lc3NhZ2VDcmVhdGUgfSBmcm9tIFwiLi9tZXNzYWdlcy9NRVNTQUdFX0NSRUFURS50c1wiO1xuaW1wb3J0IHsgaGFuZGxlTWVzc2FnZURlbGV0ZSB9IGZyb20gXCIuL21lc3NhZ2VzL01FU1NBR0VfREVMRVRFLnRzXCI7XG5pbXBvcnQgeyBoYW5kbGVNZXNzYWdlRGVsZXRlQnVsayB9IGZyb20gXCIuL21lc3NhZ2VzL01FU1NBR0VfREVMRVRFX0JVTEsudHNcIjtcbmltcG9ydCB7IGhhbmRsZU1lc3NhZ2VSZWFjdGlvbkFkZCB9IGZyb20gXCIuL21lc3NhZ2VzL01FU1NBR0VfUkVBQ1RJT05fQURELnRzXCI7XG5pbXBvcnQgeyBoYW5kbGVNZXNzYWdlUmVhY3Rpb25SZW1vdmUgfSBmcm9tIFwiLi9tZXNzYWdlcy9NRVNTQUdFX1JFQUNUSU9OX1JFTU9WRS50c1wiO1xuaW1wb3J0IHsgaGFuZGxlTWVzc2FnZVJlYWN0aW9uUmVtb3ZlQWxsIH0gZnJvbSBcIi4vbWVzc2FnZXMvTUVTU0FHRV9SRUFDVElPTl9SRU1PVkVfQUxMLnRzXCI7XG5pbXBvcnQgeyBoYW5kbGVNZXNzYWdlUmVhY3Rpb25SZW1vdmVFbW9qaSB9IGZyb20gXCIuL21lc3NhZ2VzL01FU1NBR0VfUkVBQ1RJT05fUkVNT1ZFX0VNT0pJLnRzXCI7XG5pbXBvcnQgeyBoYW5kbGVNZXNzYWdlVXBkYXRlIH0gZnJvbSBcIi4vbWVzc2FnZXMvTUVTU0FHRV9VUERBVEUudHNcIjtcbmltcG9ydCB7IGhhbmRsZVByZXNlbmNlVXBkYXRlIH0gZnJvbSBcIi4vbWlzYy9QUkVTRU5DRV9VUERBVEUudHNcIjtcbmltcG9ydCB7IGhhbmRsZVJlYWR5IH0gZnJvbSBcIi4vbWlzYy9SRUFEWS50c1wiO1xuaW1wb3J0IHsgaGFuZGxlVHlwaW5nU3RhcnQgfSBmcm9tIFwiLi9taXNjL1RZUElOR19TVEFSVC50c1wiO1xuaW1wb3J0IHsgaGFuZGxlVXNlclVwZGF0ZSB9IGZyb20gXCIuL21pc2MvVVNFUl9VUERBVEUudHNcIjtcbmltcG9ydCB7IGhhbmRsZUd1aWxkUm9sZUNyZWF0ZSB9IGZyb20gXCIuL3JvbGVzL0dVSUxEX1JPTEVfQ1JFQVRFLnRzXCI7XG5pbXBvcnQgeyBoYW5kbGVHdWlsZFJvbGVEZWxldGUgfSBmcm9tIFwiLi9yb2xlcy9HVUlMRF9ST0xFX0RFTEVURS50c1wiO1xuaW1wb3J0IHsgaGFuZGxlR3VpbGRSb2xlVXBkYXRlIH0gZnJvbSBcIi4vcm9sZXMvR1VJTERfUk9MRV9VUERBVEUudHNcIjtcbmltcG9ydCB7IGhhbmRsZVZvaWNlU2VydmVyVXBkYXRlIH0gZnJvbSBcIi4vdm9pY2UvVk9JQ0VfU0VSVkVSX1VQREFURS50c1wiO1xuaW1wb3J0IHsgaGFuZGxlVm9pY2VTdGF0ZVVwZGF0ZSB9IGZyb20gXCIuL3ZvaWNlL1ZPSUNFX1NUQVRFX1VQREFURS50c1wiO1xuaW1wb3J0IHsgaGFuZGxlV2ViaG9va3NVcGRhdGUgfSBmcm9tIFwiLi93ZWJob29rcy9XRUJIT09LU19VUERBVEUudHNcIjtcblxuZXhwb3J0IHtcbiAgaGFuZGxlQXBwbGljYXRpb25Db21tYW5kQ3JlYXRlLFxuICBoYW5kbGVBcHBsaWNhdGlvbkNvbW1hbmREZWxldGUsXG4gIGhhbmRsZUFwcGxpY2F0aW9uQ29tbWFuZFVwZGF0ZSxcbiAgaGFuZGxlQ2hhbm5lbENyZWF0ZSxcbiAgaGFuZGxlQ2hhbm5lbERlbGV0ZSxcbiAgaGFuZGxlQ2hhbm5lbFBpbnNVcGRhdGUsXG4gIGhhbmRsZUNoYW5uZWxVcGRhdGUsXG4gIGhhbmRsZUd1aWxkQmFuQWRkLFxuICBoYW5kbGVHdWlsZEJhblJlbW92ZSxcbiAgaGFuZGxlR3VpbGRDcmVhdGUsXG4gIGhhbmRsZUd1aWxkRGVsZXRlLFxuICBoYW5kbGVHdWlsZEVtb2ppc1VwZGF0ZSxcbiAgaGFuZGxlR3VpbGRJbnRlZ3JhdGlvbnNVcGRhdGUsXG4gIGhhbmRsZUd1aWxkTWVtYmVyQWRkLFxuICBoYW5kbGVHdWlsZE1lbWJlclJlbW92ZSxcbiAgaGFuZGxlR3VpbGRNZW1iZXJzQ2h1bmssXG4gIGhhbmRsZUd1aWxkTWVtYmVyVXBkYXRlLFxuICBoYW5kbGVHdWlsZFJvbGVDcmVhdGUsXG4gIGhhbmRsZUd1aWxkUm9sZURlbGV0ZSxcbiAgaGFuZGxlR3VpbGRSb2xlVXBkYXRlLFxuICBoYW5kbGVHdWlsZFVwZGF0ZSxcbiAgaGFuZGxlSW50ZWdyYXRpb25DcmVhdGUsXG4gIGhhbmRsZUludGVncmF0aW9uRGVsZXRlLFxuICBoYW5kbGVJbnRlZ3JhdGlvblVwZGF0ZSxcbiAgaGFuZGxlSW50ZXJhY3Rpb25DcmVhdGUsXG4gIGhhbmRsZUludml0ZUNyZWF0ZSxcbiAgaGFuZGxlTWVzc2FnZUNyZWF0ZSxcbiAgaGFuZGxlTWVzc2FnZURlbGV0ZSxcbiAgaGFuZGxlTWVzc2FnZURlbGV0ZUJ1bGssXG4gIGhhbmRsZU1lc3NhZ2VSZWFjdGlvbkFkZCxcbiAgaGFuZGxlTWVzc2FnZVJlYWN0aW9uUmVtb3ZlLFxuICBoYW5kbGVNZXNzYWdlUmVhY3Rpb25SZW1vdmVBbGwsXG4gIGhhbmRsZU1lc3NhZ2VSZWFjdGlvblJlbW92ZUVtb2ppLFxuICBoYW5kbGVNZXNzYWdlVXBkYXRlLFxuICBoYW5kbGVQcmVzZW5jZVVwZGF0ZSxcbiAgaGFuZGxlUmVhZHksXG4gIGhhbmRsZVRocmVhZENyZWF0ZSxcbiAgaGFuZGxlVGhyZWFkRGVsZXRlLFxuICBoYW5kbGVUaHJlYWRMaXN0U3luYyxcbiAgaGFuZGxlVGhyZWFkTWVtYmVyc1VwZGF0ZSxcbiAgaGFuZGxlVGhyZWFkTWVtYmVyVXBkYXRlLFxuICBoYW5kbGVUaHJlYWRVcGRhdGUsXG4gIGhhbmRsZVR5cGluZ1N0YXJ0LFxuICBoYW5kbGVVc2VyVXBkYXRlLFxuICBoYW5kbGVWb2ljZVNlcnZlclVwZGF0ZSxcbiAgaGFuZGxlVm9pY2VTdGF0ZVVwZGF0ZSxcbiAgaGFuZGxlV2ViaG9va3NVcGRhdGUsXG59O1xuXG5leHBvcnQgbGV0IGhhbmRsZXJzID0ge1xuICAvLyBtaXNjXG4gIFJFQURZOiBoYW5kbGVSZWFkeSxcbiAgLy8gY2hhbm5lbHNcbiAgQ0hBTk5FTF9DUkVBVEU6IGhhbmRsZUNoYW5uZWxDcmVhdGUsXG4gIENIQU5ORUxfREVMRVRFOiBoYW5kbGVDaGFubmVsRGVsZXRlLFxuICBDSEFOTkVMX1BJTlNfVVBEQVRFOiBoYW5kbGVDaGFubmVsUGluc1VwZGF0ZSxcbiAgQ0hBTk5FTF9VUERBVEU6IGhhbmRsZUNoYW5uZWxVcGRhdGUsXG4gIFRIUkVBRF9DUkVBVEU6IGhhbmRsZVRocmVhZENyZWF0ZSxcbiAgVEhSRUFEX1VQREFURTogaGFuZGxlVGhyZWFkVXBkYXRlLFxuICBUSFJFQURfREVMRVRFOiBoYW5kbGVUaHJlYWREZWxldGUsXG4gIFRIUkVBRF9MSVNUX1NZTkM6IGhhbmRsZVRocmVhZExpc3RTeW5jLFxuICBUSFJFQURfTUVNQkVSX1VQREFURTogaGFuZGxlVGhyZWFkTWVtYmVyVXBkYXRlLFxuICBUSFJFQURfTUVNQkVSU19VUERBVEU6IGhhbmRsZVRocmVhZE1lbWJlcnNVcGRhdGUsXG4gIC8vIGNvbW1hbmRzXG4gIEFQUExJQ0FUSU9OX0NPTU1BTkRfQ1JFQVRFOiBoYW5kbGVBcHBsaWNhdGlvbkNvbW1hbmRDcmVhdGUsXG4gIEFQUExJQ0FUSU9OX0NPTU1BTkRfREVMRVRFOiBoYW5kbGVBcHBsaWNhdGlvbkNvbW1hbmREZWxldGUsXG4gIEFQUExJQ0FUSU9OX0NPTU1BTkRfVVBEQVRFOiBoYW5kbGVBcHBsaWNhdGlvbkNvbW1hbmRVcGRhdGUsXG4gIC8vIGd1aWxkc1xuICBHVUlMRF9CQU5fQUREOiBoYW5kbGVHdWlsZEJhbkFkZCxcbiAgR1VJTERfQkFOX1JFTU9WRTogaGFuZGxlR3VpbGRCYW5SZW1vdmUsXG4gIEdVSUxEX0NSRUFURTogaGFuZGxlR3VpbGRDcmVhdGUsXG4gIEdVSUxEX0RFTEVURTogaGFuZGxlR3VpbGREZWxldGUsXG4gIEdVSUxEX0VNT0pJU19VUERBVEU6IGhhbmRsZUd1aWxkRW1vamlzVXBkYXRlLFxuICBHVUlMRF9JTlRFR1JBVElPTlNfVVBEQVRFOiBoYW5kbGVHdWlsZEludGVncmF0aW9uc1VwZGF0ZSxcbiAgR1VJTERfTUVNQkVSX0FERDogaGFuZGxlR3VpbGRNZW1iZXJBZGQsXG4gIEdVSUxEX01FTUJFUl9SRU1PVkU6IGhhbmRsZUd1aWxkTWVtYmVyUmVtb3ZlLFxuICBHVUlMRF9NRU1CRVJfVVBEQVRFOiBoYW5kbGVHdWlsZE1lbWJlclVwZGF0ZSxcbiAgR1VJTERfTUVNQkVSU19DSFVOSzogaGFuZGxlR3VpbGRNZW1iZXJzQ2h1bmssXG4gIEdVSUxEX1JPTEVfQ1JFQVRFOiBoYW5kbGVHdWlsZFJvbGVDcmVhdGUsXG4gIEdVSUxEX1JPTEVfREVMRVRFOiBoYW5kbGVHdWlsZFJvbGVEZWxldGUsXG4gIEdVSUxEX1JPTEVfVVBEQVRFOiBoYW5kbGVHdWlsZFJvbGVVcGRhdGUsXG4gIEdVSUxEX1VQREFURTogaGFuZGxlR3VpbGRVcGRhdGUsXG4gIC8vIGludGVyYWN0aW9uc1xuICBJTlRFUkFDVElPTl9DUkVBVEU6IGhhbmRsZUludGVyYWN0aW9uQ3JlYXRlLFxuICAvLyBpbnZpdGVzXG4gIElOVklURV9DUkVBVEU6IGhhbmRsZUludml0ZUNyZWF0ZSxcbiAgSU5WSVRFX0RFTEVURTogaGFuZGxlSW52aXRlQ3JlYXRlLFxuICAvLyBtZXNzYWdlc1xuICBNRVNTQUdFX0NSRUFURTogaGFuZGxlTWVzc2FnZUNyZWF0ZSxcbiAgTUVTU0FHRV9ERUxFVEVfQlVMSzogaGFuZGxlTWVzc2FnZURlbGV0ZUJ1bGssXG4gIE1FU1NBR0VfREVMRVRFOiBoYW5kbGVNZXNzYWdlRGVsZXRlLFxuICBNRVNTQUdFX1JFQUNUSU9OX0FERDogaGFuZGxlTWVzc2FnZVJlYWN0aW9uQWRkLFxuICBNRVNTQUdFX1JFQUNUSU9OX1JFTU9WRV9BTEw6IGhhbmRsZU1lc3NhZ2VSZWFjdGlvblJlbW92ZUFsbCxcbiAgTUVTU0FHRV9SRUFDVElPTl9SRU1PVkVfRU1PSkk6IGhhbmRsZU1lc3NhZ2VSZWFjdGlvblJlbW92ZUVtb2ppLFxuICBNRVNTQUdFX1JFQUNUSU9OX1JFTU9WRTogaGFuZGxlTWVzc2FnZVJlYWN0aW9uUmVtb3ZlLFxuICBNRVNTQUdFX1VQREFURTogaGFuZGxlTWVzc2FnZVVwZGF0ZSxcbiAgLy8gcHJlc2VuY2VcbiAgUFJFU0VOQ0VfVVBEQVRFOiBoYW5kbGVQcmVzZW5jZVVwZGF0ZSxcbiAgVFlQSU5HX1NUQVJUOiBoYW5kbGVUeXBpbmdTdGFydCxcbiAgVVNFUl9VUERBVEU6IGhhbmRsZVVzZXJVcGRhdGUsXG4gIC8vIHZvaWNlXG4gIFZPSUNFX1NFUlZFUl9VUERBVEU6IGhhbmRsZVZvaWNlU2VydmVyVXBkYXRlLFxuICBWT0lDRV9TVEFURV9VUERBVEU6IGhhbmRsZVZvaWNlU3RhdGVVcGRhdGUsXG4gIC8vIHdlYmhvb2tzXG4gIFdFQkhPT0tTX1VQREFURTogaGFuZGxlV2ViaG9va3NVcGRhdGUsXG4gIC8vIGludGVncmF0aW9uc1xuICBJTlRFR1JBVElPTl9DUkVBVEU6IGhhbmRsZUludGVncmF0aW9uQ3JlYXRlLFxuICBJTlRFR1JBVElPTl9VUERBVEU6IGhhbmRsZUludGVncmF0aW9uVXBkYXRlLFxuICBJTlRFR1JBVElPTl9ERUxFVEU6IGhhbmRsZUludGVncmF0aW9uRGVsZXRlLFxufTtcblxuZXhwb3J0IHR5cGUgSGFuZGxlcnMgPSB0eXBlb2YgaGFuZGxlcnM7XG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVIYW5kbGVycyhuZXdIYW5kbGVyczogSGFuZGxlcnMpIHtcbiAgaGFuZGxlcnMgPSB7XG4gICAgLi4uaGFuZGxlcnMsXG4gICAgLi4ubmV3SGFuZGxlcnMsXG4gIH07XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsbUJBQW1CLFNBQVEsNEJBQThCO1NBQ3pELG1CQUFtQixTQUFRLDRCQUE4QjtTQUN6RCx1QkFBdUIsU0FBUSxpQ0FBbUM7U0FDbEUsbUJBQW1CLFNBQVEsNEJBQThCO1NBQ3pELGtCQUFrQixTQUFRLDJCQUE2QjtTQUN2RCxrQkFBa0IsU0FBUSwyQkFBNkI7U0FDdkQsb0JBQW9CLFNBQVEsOEJBQWdDO1NBQzVELHlCQUF5QixTQUFRLG1DQUFxQztTQUN0RSx3QkFBd0IsU0FBUSxrQ0FBb0M7U0FDcEUsa0JBQWtCLFNBQVEsMkJBQTZCO1NBQ3ZELDhCQUE4QixTQUFRLHdDQUEwQztTQUNoRiw4QkFBOEIsU0FBUSx3Q0FBMEM7U0FDaEYsOEJBQThCLFNBQVEsd0NBQTBDO1NBQ2hGLHVCQUF1QixTQUFRLCtCQUFpQztTQUNoRSxpQkFBaUIsU0FBUSx5QkFBMkI7U0FDcEQsb0JBQW9CLFNBQVEsNEJBQThCO1NBQzFELGlCQUFpQixTQUFRLHdCQUEwQjtTQUNuRCxpQkFBaUIsU0FBUSx3QkFBMEI7U0FDbkQsNkJBQTZCLFNBQVEscUNBQXVDO1NBQzVFLGlCQUFpQixTQUFRLHdCQUEwQjtTQUNuRCx1QkFBdUIsU0FBUSxvQ0FBc0M7U0FDckUsdUJBQXVCLFNBQVEsb0NBQXND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
