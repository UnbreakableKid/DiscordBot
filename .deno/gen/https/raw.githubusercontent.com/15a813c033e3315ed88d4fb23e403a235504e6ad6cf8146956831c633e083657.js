export var DiscordGatewayIntents;
(function (DiscordGatewayIntents) {
  DiscordGatewayIntents[
    DiscordGatewayIntents[
      /**
   * - GUILD_CREATE
   * - GUILD_DELETE
   * - GUILD_ROLE_CREATE
   * - GUILD_ROLE_UPDATE
   * - GUILD_ROLE_DELETE
   * - CHANNEL_CREATE
   * - CHANNEL_UPDATE
   * - CHANNEL_DELETE
   * - CHANNEL_PINS_UPDATE
   */ "Guilds"
    ] = 1
  ] = "Guilds";
  DiscordGatewayIntents[
    DiscordGatewayIntents[
      /**
   * - GUILD_MEMBER_ADD
   * - GUILD_MEMBER_UPDATE
   * - GUILD_MEMBER_REMOVE
   */ "GuildMembers"
    ] = 2
  ] = "GuildMembers";
  DiscordGatewayIntents[
    DiscordGatewayIntents[
      /**
   * - GUILD_BAN_ADD
   * - GUILD_BAN_REMOVE
   */ "GuildBans"
    ] = 4
  ] = "GuildBans";
  DiscordGatewayIntents[
    DiscordGatewayIntents[
      /**
   * - GUILD_EMOJIS_UPDATE
   */ "GuildEmojis"
    ] = 8
  ] = "GuildEmojis";
  DiscordGatewayIntents[
    DiscordGatewayIntents[
      /**
   * - GUILD_INTEGRATIONS_UPDATE
   * - INTEGRATION_CREATE
   * - INTEGRATION_UPDATE
   * - INTEGRATION_DELETE
   */ "GuildIntegrations"
    ] = 16
  ] = "GuildIntegrations";
  DiscordGatewayIntents[
    DiscordGatewayIntents[
      /** Enables the following events:
   * - WEBHOOKS_UPDATE
   */ "GuildWebhooks"
    ] = 32
  ] = "GuildWebhooks";
  DiscordGatewayIntents[
    DiscordGatewayIntents[
      /**
   * - INVITE_CREATE
   * - INVITE_DELETE
   */ "GuildInvites"
    ] = 64
  ] = "GuildInvites";
  DiscordGatewayIntents[
    DiscordGatewayIntents[
      /**
   * - VOICE_STATE_UPDATE
   */ "GuildVoiceStates"
    ] = 128
  ] = "GuildVoiceStates";
  DiscordGatewayIntents[
    DiscordGatewayIntents[
      /**
   * - PRESENCE_UPDATE
   */ "GuildPresences"
    ] = 256
  ] = "GuildPresences";
  DiscordGatewayIntents[
    DiscordGatewayIntents[
      /**
   * - MESSAGE_CREATE
   * - MESSAGE_UPDATE
   * - MESSAGE_DELETE
   */ "GuildMessages"
    ] = 512
  ] = "GuildMessages";
  DiscordGatewayIntents[
    DiscordGatewayIntents[
      /**
   * - MESSAGE_REACTION_ADD
   * - MESSAGE_REACTION_REMOVE
   * - MESSAGE_REACTION_REMOVE_ALL
   * - MESSAGE_REACTION_REMOVE_EMOJI
   */ "GuildMessageReactions"
    ] = 1024
  ] = "GuildMessageReactions";
  DiscordGatewayIntents[
    DiscordGatewayIntents[
      /**
   * - TYPING_START
   */ "GuildMessageTyping"
    ] = 2048
  ] = "GuildMessageTyping";
  DiscordGatewayIntents[
    DiscordGatewayIntents[
      /**
   * - CHANNEL_CREATE
   * - MESSAGE_CREATE
   * - MESSAGE_UPDATE
   * - MESSAGE_DELETE
   * - CHANNEL_PINS_UPDATE
   */ "DirectMessages"
    ] = 4096
  ] = "DirectMessages";
  DiscordGatewayIntents[
    DiscordGatewayIntents[
      /**
   * - MESSAGE_REACTION_ADD
   * - MESSAGE_REACTION_REMOVE
   * - MESSAGE_REACTION_REMOVE_ALL
   * - MESSAGE_REACTION_REMOVE_EMOJI
   */ "DirectMessageReactions"
    ] = 8192
  ] = "DirectMessageReactions";
  DiscordGatewayIntents[
    DiscordGatewayIntents[
      /**
   * - TYPING_START
   */ "DirectMessageTyping"
    ] = 16384
  ] = "DirectMessageTyping";
})(DiscordGatewayIntents || (DiscordGatewayIntents = {}));
export const Intents = DiscordGatewayIntents;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3R5cGVzL2dhdGV3YXkvZ2F0ZXdheV9pbnRlbnRzLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiogaHR0cHM6Ly9kaXNjb3JkLmNvbS9kZXZlbG9wZXJzL2RvY3MvdG9waWNzL2dhdGV3YXkjbGlzdC1vZi1pbnRlbnRzICovXG5leHBvcnQgZW51bSBEaXNjb3JkR2F0ZXdheUludGVudHMge1xuICAvKipcbiAgICogLSBHVUlMRF9DUkVBVEVcbiAgICogLSBHVUlMRF9ERUxFVEVcbiAgICogLSBHVUlMRF9ST0xFX0NSRUFURVxuICAgKiAtIEdVSUxEX1JPTEVfVVBEQVRFXG4gICAqIC0gR1VJTERfUk9MRV9ERUxFVEVcbiAgICogLSBDSEFOTkVMX0NSRUFURVxuICAgKiAtIENIQU5ORUxfVVBEQVRFXG4gICAqIC0gQ0hBTk5FTF9ERUxFVEVcbiAgICogLSBDSEFOTkVMX1BJTlNfVVBEQVRFXG4gICAqL1xuICBHdWlsZHMgPSAxIDw8IDAsXG4gIC8qKlxuICAgKiAtIEdVSUxEX01FTUJFUl9BRERcbiAgICogLSBHVUlMRF9NRU1CRVJfVVBEQVRFXG4gICAqIC0gR1VJTERfTUVNQkVSX1JFTU9WRVxuICAgKi9cbiAgR3VpbGRNZW1iZXJzID0gMSA8PCAxLFxuICAvKipcbiAgICogLSBHVUlMRF9CQU5fQUREXG4gICAqIC0gR1VJTERfQkFOX1JFTU9WRVxuICAgKi9cbiAgR3VpbGRCYW5zID0gMSA8PCAyLFxuICAvKipcbiAgICogLSBHVUlMRF9FTU9KSVNfVVBEQVRFXG4gICAqL1xuICBHdWlsZEVtb2ppcyA9IDEgPDwgMyxcbiAgLyoqXG4gICAqIC0gR1VJTERfSU5URUdSQVRJT05TX1VQREFURVxuICAgKiAtIElOVEVHUkFUSU9OX0NSRUFURVxuICAgKiAtIElOVEVHUkFUSU9OX1VQREFURVxuICAgKiAtIElOVEVHUkFUSU9OX0RFTEVURVxuICAgKi9cbiAgR3VpbGRJbnRlZ3JhdGlvbnMgPSAxIDw8IDQsXG4gIC8qKiBFbmFibGVzIHRoZSBmb2xsb3dpbmcgZXZlbnRzOlxuICAgKiAtIFdFQkhPT0tTX1VQREFURVxuICAgKi9cbiAgR3VpbGRXZWJob29rcyA9IDEgPDwgNSxcbiAgLyoqXG4gICAqIC0gSU5WSVRFX0NSRUFURVxuICAgKiAtIElOVklURV9ERUxFVEVcbiAgICovXG4gIEd1aWxkSW52aXRlcyA9IDEgPDwgNixcbiAgLyoqXG4gICAqIC0gVk9JQ0VfU1RBVEVfVVBEQVRFXG4gICAqL1xuICBHdWlsZFZvaWNlU3RhdGVzID0gMSA8PCA3LFxuICAvKipcbiAgICogLSBQUkVTRU5DRV9VUERBVEVcbiAgICovXG4gIEd1aWxkUHJlc2VuY2VzID0gMSA8PCA4LFxuICAvKipcbiAgICogLSBNRVNTQUdFX0NSRUFURVxuICAgKiAtIE1FU1NBR0VfVVBEQVRFXG4gICAqIC0gTUVTU0FHRV9ERUxFVEVcbiAgICovXG4gIEd1aWxkTWVzc2FnZXMgPSAxIDw8IDksXG4gIC8qKlxuICAgKiAtIE1FU1NBR0VfUkVBQ1RJT05fQUREXG4gICAqIC0gTUVTU0FHRV9SRUFDVElPTl9SRU1PVkVcbiAgICogLSBNRVNTQUdFX1JFQUNUSU9OX1JFTU9WRV9BTExcbiAgICogLSBNRVNTQUdFX1JFQUNUSU9OX1JFTU9WRV9FTU9KSVxuICAgKi9cbiAgR3VpbGRNZXNzYWdlUmVhY3Rpb25zID0gMSA8PCAxMCxcbiAgLyoqXG4gICAqIC0gVFlQSU5HX1NUQVJUXG4gICAqL1xuICBHdWlsZE1lc3NhZ2VUeXBpbmcgPSAxIDw8IDExLFxuICAvKipcbiAgICogLSBDSEFOTkVMX0NSRUFURVxuICAgKiAtIE1FU1NBR0VfQ1JFQVRFXG4gICAqIC0gTUVTU0FHRV9VUERBVEVcbiAgICogLSBNRVNTQUdFX0RFTEVURVxuICAgKiAtIENIQU5ORUxfUElOU19VUERBVEVcbiAgICovXG4gIERpcmVjdE1lc3NhZ2VzID0gMSA8PCAxMixcbiAgLyoqXG4gICAqIC0gTUVTU0FHRV9SRUFDVElPTl9BRERcbiAgICogLSBNRVNTQUdFX1JFQUNUSU9OX1JFTU9WRVxuICAgKiAtIE1FU1NBR0VfUkVBQ1RJT05fUkVNT1ZFX0FMTFxuICAgKiAtIE1FU1NBR0VfUkVBQ1RJT05fUkVNT1ZFX0VNT0pJXG4gICAqL1xuICBEaXJlY3RNZXNzYWdlUmVhY3Rpb25zID0gMSA8PCAxMyxcbiAgLyoqXG4gICAqIC0gVFlQSU5HX1NUQVJUXG4gICAqL1xuICBEaXJlY3RNZXNzYWdlVHlwaW5nID0gMSA8PCAxNCxcbn1cblxuZXhwb3J0IHR5cGUgSW50ZW50cyA9IERpc2NvcmRHYXRld2F5SW50ZW50cztcbmV4cG9ydCBjb25zdCBJbnRlbnRzID0gRGlzY29yZEdhdGV3YXlJbnRlbnRzO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7VUFDWSxxQkFBcUI7SUFBckIscUJBQXFCLENBQXJCLHFCQUFxQixDQUMvQixFQVVHLEFBVkg7Ozs7Ozs7Ozs7R0FVRyxBQVZILEVBVUcsRUFDSCxNQUFNLEtBQU4sQ0FBTSxLQUFOLE1BQU07SUFaSSxxQkFBcUIsQ0FBckIscUJBQXFCLENBYS9CLEVBSUcsQUFKSDs7OztHQUlHLEFBSkgsRUFJRyxFQUNILFlBQVksS0FBWixDQUFZLEtBQVosWUFBWTtJQWxCRixxQkFBcUIsQ0FBckIscUJBQXFCLENBbUIvQixFQUdHLEFBSEg7OztHQUdHLEFBSEgsRUFHRyxFQUNILFNBQVMsS0FBVCxDQUFTLEtBQVQsU0FBUztJQXZCQyxxQkFBcUIsQ0FBckIscUJBQXFCLENBd0IvQixFQUVHLEFBRkg7O0dBRUcsQUFGSCxFQUVHLEVBQ0gsV0FBVyxLQUFYLENBQVcsS0FBWCxXQUFXO0lBM0JELHFCQUFxQixDQUFyQixxQkFBcUIsQ0E0Qi9CLEVBS0csQUFMSDs7Ozs7R0FLRyxBQUxILEVBS0csRUFDSCxpQkFBaUIsS0FBakIsRUFBaUIsS0FBakIsaUJBQWlCO0lBbENQLHFCQUFxQixDQUFyQixxQkFBcUIsQ0FtQy9CLEVBRUcsQUFGSDs7R0FFRyxBQUZILEVBRUcsRUFDSCxhQUFhLEtBQWIsRUFBYSxLQUFiLGFBQWE7SUF0Q0gscUJBQXFCLENBQXJCLHFCQUFxQixDQXVDL0IsRUFHRyxBQUhIOzs7R0FHRyxBQUhILEVBR0csRUFDSCxZQUFZLEtBQVosRUFBWSxLQUFaLFlBQVk7SUEzQ0YscUJBQXFCLENBQXJCLHFCQUFxQixDQTRDL0IsRUFFRyxBQUZIOztHQUVHLEFBRkgsRUFFRyxFQUNILGdCQUFnQixLQUFoQixHQUFnQixLQUFoQixnQkFBZ0I7SUEvQ04scUJBQXFCLENBQXJCLHFCQUFxQixDQWdEL0IsRUFFRyxBQUZIOztHQUVHLEFBRkgsRUFFRyxFQUNILGNBQWMsS0FBZCxHQUFjLEtBQWQsY0FBYztJQW5ESixxQkFBcUIsQ0FBckIscUJBQXFCLENBb0QvQixFQUlHLEFBSkg7Ozs7R0FJRyxBQUpILEVBSUcsRUFDSCxhQUFhLEtBQWIsR0FBYSxLQUFiLGFBQWE7SUF6REgscUJBQXFCLENBQXJCLHFCQUFxQixDQTBEL0IsRUFLRyxBQUxIOzs7OztHQUtHLEFBTEgsRUFLRyxFQUNILHFCQUFxQixLQUFyQixJQUFxQixLQUFyQixxQkFBcUI7SUFoRVgscUJBQXFCLENBQXJCLHFCQUFxQixDQWlFL0IsRUFFRyxBQUZIOztHQUVHLEFBRkgsRUFFRyxFQUNILGtCQUFrQixLQUFsQixJQUFrQixLQUFsQixrQkFBa0I7SUFwRVIscUJBQXFCLENBQXJCLHFCQUFxQixDQXFFL0IsRUFNRyxBQU5IOzs7Ozs7R0FNRyxBQU5ILEVBTUcsRUFDSCxjQUFjLEtBQWQsSUFBYyxLQUFkLGNBQWM7SUE1RUoscUJBQXFCLENBQXJCLHFCQUFxQixDQTZFL0IsRUFLRyxBQUxIOzs7OztHQUtHLEFBTEgsRUFLRyxFQUNILHNCQUFzQixLQUF0QixJQUFzQixLQUF0QixzQkFBc0I7SUFuRloscUJBQXFCLENBQXJCLHFCQUFxQixDQW9GL0IsRUFFRyxBQUZIOztHQUVHLEFBRkgsRUFFRyxFQUNILG1CQUFtQixLQUFuQixLQUFtQixLQUFuQixtQkFBbUI7R0F2RlQscUJBQXFCLEtBQXJCLHFCQUFxQjs7YUEyRnBCLE9BQU8sR0FBRyxxQkFBcUIifQ==
