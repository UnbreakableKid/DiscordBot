export var DiscordBitwisePermissionFlags;
(function (DiscordBitwisePermissionFlags) {
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows creation of instant invites */ "CREATE_INSTANT_INVITE"
    ] = 1
  ] = "CREATE_INSTANT_INVITE";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows kicking members */ "KICK_MEMBERS"
    ] = 2
  ] = "KICK_MEMBERS";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[/** Allows banning members */ "BAN_MEMBERS"] =
      4
  ] = "BAN_MEMBERS";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows all permissions and bypasses channel permission overwrites */ "ADMINISTRATOR"
    ] = 8
  ] = "ADMINISTRATOR";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows management and editing of channels */ "MANAGE_CHANNELS"
    ] = 16
  ] = "MANAGE_CHANNELS";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows management and editing of the guild */ "MANAGE_GUILD"
    ] = 32
  ] = "MANAGE_GUILD";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for the addition of reactions to messages */ "ADD_REACTIONS"
    ] = 64
  ] = "ADD_REACTIONS";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for viewing of audit logs */ "VIEW_AUDIT_LOG"
    ] = 128
  ] = "VIEW_AUDIT_LOG";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for using priority speaker in a voice channel */ "PRIORITY_SPEAKER"
    ] = 256
  ] = "PRIORITY_SPEAKER";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[/** Allows the user to go live */ "STREAM"] =
      512
  ] = "STREAM";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows guild members to view a channel, which includes reading messages in text channels */ "VIEW_CHANNEL"
    ] = 1024
  ] = "VIEW_CHANNEL";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for sending messages in a channel */ "SEND_MESSAGES"
    ] = 2048
  ] = "SEND_MESSAGES";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for sending of /tts messages */ "SEND_TTS_MESSAGES"
    ] = 4096
  ] = "SEND_TTS_MESSAGES";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for deletion of other users messages */ "MANAGE_MESSAGES"
    ] = 8192
  ] = "MANAGE_MESSAGES";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Links sent by users with this permission will be auto-embedded */ "EMBED_LINKS"
    ] = 16384
  ] = "EMBED_LINKS";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for uploading images and files */ "ATTACH_FILES"
    ] = 32768
  ] = "ATTACH_FILES";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for reading of message history */ "READ_MESSAGE_HISTORY"
    ] = 65536
  ] = "READ_MESSAGE_HISTORY";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for using the @everyone tag to notify all users in a channel, and the @here tag to notify all online users in a channel */ "MENTION_EVERYONE"
    ] = 131072
  ] = "MENTION_EVERYONE";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows the usage of custom emojis from other servers */ "USE_EXTERNAL_EMOJIS"
    ] = 262144
  ] = "USE_EXTERNAL_EMOJIS";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for viewing guild insights */ "VIEW_GUILD_INSIGHTS"
    ] = 524288
  ] = "VIEW_GUILD_INSIGHTS";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for joining of a voice channel */ "CONNECT"
    ] = 1048576
  ] = "CONNECT";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for speaking in a voice channel */ "SPEAK"
    ] = 2097152
  ] = "SPEAK";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for muting members in a voice channel */ "MUTE_MEMBERS"
    ] = 4194304
  ] = "MUTE_MEMBERS";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for deafening of members in a voice channel */ "DEAFEN_MEMBERS"
    ] = 8388608
  ] = "DEAFEN_MEMBERS";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for moving of members between voice channels */ "MOVE_MEMBERS"
    ] = 16777216
  ] = "MOVE_MEMBERS";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for using voice-activity-detection in a voice channel */ "USE_VAD"
    ] = 33554432
  ] = "USE_VAD";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for modification of own nickname */ "CHANGE_NICKNAME"
    ] = 67108864
  ] = "CHANGE_NICKNAME";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for modification of other users nicknames */ "MANAGE_NICKNAMES"
    ] = 134217728
  ] = "MANAGE_NICKNAMES";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows management and editing of roles */ "MANAGE_ROLES"
    ] = 268435456
  ] = "MANAGE_ROLES";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows management and editing of webhooks */ "MANAGE_WEBHOOKS"
    ] = 536870912
  ] = "MANAGE_WEBHOOKS";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows management and editing of emojis */ "MANAGE_EMOJIS"
    ] = 1073741824
  ] = "MANAGE_EMOJIS";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows members to use slash commands in text channels */ "USE_SLASH_COMMANDS"
    ] = 2147483648
  ] = "USE_SLASH_COMMANDS";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for requesting to speak in stage channels. */ "REQUEST_TO_SPEAK"
    ] = 4294967297
  ] = "REQUEST_TO_SPEAK";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for deleting and archiving threads, and viewing all private threads */ "MANAGE_THREADS"
    ] = 17179869184
  ] = "MANAGE_THREADS";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for creating and participating in threads */ "USE_PUBLIC_THREADS"
    ] = 34359738368
  ] = "USE_PUBLIC_THREADS";
  DiscordBitwisePermissionFlags[
    DiscordBitwisePermissionFlags[
      /** Allows for creating and participating in private threads */ "USE_PRIVATE_THREADS"
    ] = 68719476736
  ] = "USE_PRIVATE_THREADS";
})(DiscordBitwisePermissionFlags || (DiscordBitwisePermissionFlags = {}));
export const BitwisePermissions = DiscordBitwisePermissionFlags;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3R5cGVzL3Blcm1pc3Npb25zL2JpdHdpc2VfcGVybWlzc2lvbl9mbGFncy50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLyoqIGh0dHBzOi8vZGlzY29yZC5jb20vZGV2ZWxvcGVycy9kb2NzL3RvcGljcy9wZXJtaXNzaW9ucyNwZXJtaXNzaW9ucy1iaXR3aXNlLXBlcm1pc3Npb24tZmxhZ3MgKi9cbmV4cG9ydCBlbnVtIERpc2NvcmRCaXR3aXNlUGVybWlzc2lvbkZsYWdzIHtcbiAgLyoqIEFsbG93cyBjcmVhdGlvbiBvZiBpbnN0YW50IGludml0ZXMgKi9cbiAgQ1JFQVRFX0lOU1RBTlRfSU5WSVRFID0gMHgwMDAwMDAwMSxcbiAgLyoqIEFsbG93cyBraWNraW5nIG1lbWJlcnMgKi9cbiAgS0lDS19NRU1CRVJTID0gMHgwMDAwMDAwMixcbiAgLyoqIEFsbG93cyBiYW5uaW5nIG1lbWJlcnMgKi9cbiAgQkFOX01FTUJFUlMgPSAweDAwMDAwMDA0LFxuICAvKiogQWxsb3dzIGFsbCBwZXJtaXNzaW9ucyBhbmQgYnlwYXNzZXMgY2hhbm5lbCBwZXJtaXNzaW9uIG92ZXJ3cml0ZXMgKi9cbiAgQURNSU5JU1RSQVRPUiA9IDB4MDAwMDAwMDgsXG4gIC8qKiBBbGxvd3MgbWFuYWdlbWVudCBhbmQgZWRpdGluZyBvZiBjaGFubmVscyAqL1xuICBNQU5BR0VfQ0hBTk5FTFMgPSAweDAwMDAwMDEwLFxuICAvKiogQWxsb3dzIG1hbmFnZW1lbnQgYW5kIGVkaXRpbmcgb2YgdGhlIGd1aWxkICovXG4gIE1BTkFHRV9HVUlMRCA9IDB4MDAwMDAwMjAsXG4gIC8qKiBBbGxvd3MgZm9yIHRoZSBhZGRpdGlvbiBvZiByZWFjdGlvbnMgdG8gbWVzc2FnZXMgKi9cbiAgQUREX1JFQUNUSU9OUyA9IDB4MDAwMDAwNDAsXG4gIC8qKiBBbGxvd3MgZm9yIHZpZXdpbmcgb2YgYXVkaXQgbG9ncyAqL1xuICBWSUVXX0FVRElUX0xPRyA9IDB4MDAwMDAwODAsXG4gIC8qKiBBbGxvd3MgZm9yIHVzaW5nIHByaW9yaXR5IHNwZWFrZXIgaW4gYSB2b2ljZSBjaGFubmVsICovXG4gIFBSSU9SSVRZX1NQRUFLRVIgPSAweDAwMDAwMTAwLFxuICAvKiogQWxsb3dzIHRoZSB1c2VyIHRvIGdvIGxpdmUgKi9cbiAgU1RSRUFNID0gMHgwMDAwMDIwMCxcbiAgLyoqIEFsbG93cyBndWlsZCBtZW1iZXJzIHRvIHZpZXcgYSBjaGFubmVsLCB3aGljaCBpbmNsdWRlcyByZWFkaW5nIG1lc3NhZ2VzIGluIHRleHQgY2hhbm5lbHMgKi9cbiAgVklFV19DSEFOTkVMID0gMHgwMDAwMDQwMCxcbiAgLyoqIEFsbG93cyBmb3Igc2VuZGluZyBtZXNzYWdlcyBpbiBhIGNoYW5uZWwgKi9cbiAgU0VORF9NRVNTQUdFUyA9IDB4MDAwMDA4MDAsXG4gIC8qKiBBbGxvd3MgZm9yIHNlbmRpbmcgb2YgL3R0cyBtZXNzYWdlcyAqL1xuICBTRU5EX1RUU19NRVNTQUdFUyA9IDB4MDAwMDEwMDAsXG4gIC8qKiBBbGxvd3MgZm9yIGRlbGV0aW9uIG9mIG90aGVyIHVzZXJzIG1lc3NhZ2VzICovXG4gIE1BTkFHRV9NRVNTQUdFUyA9IDB4MDAwMDIwMDAsXG4gIC8qKiBMaW5rcyBzZW50IGJ5IHVzZXJzIHdpdGggdGhpcyBwZXJtaXNzaW9uIHdpbGwgYmUgYXV0by1lbWJlZGRlZCAqL1xuICBFTUJFRF9MSU5LUyA9IDB4MDAwMDQwMDAsXG4gIC8qKiBBbGxvd3MgZm9yIHVwbG9hZGluZyBpbWFnZXMgYW5kIGZpbGVzICovXG4gIEFUVEFDSF9GSUxFUyA9IDB4MDAwMDgwMDAsXG4gIC8qKiBBbGxvd3MgZm9yIHJlYWRpbmcgb2YgbWVzc2FnZSBoaXN0b3J5ICovXG4gIFJFQURfTUVTU0FHRV9ISVNUT1JZID0gMHgwMDAxMDAwMCxcbiAgLyoqIEFsbG93cyBmb3IgdXNpbmcgdGhlIEBldmVyeW9uZSB0YWcgdG8gbm90aWZ5IGFsbCB1c2VycyBpbiBhIGNoYW5uZWwsIGFuZCB0aGUgQGhlcmUgdGFnIHRvIG5vdGlmeSBhbGwgb25saW5lIHVzZXJzIGluIGEgY2hhbm5lbCAqL1xuICBNRU5USU9OX0VWRVJZT05FID0gMHgwMDAyMDAwMCxcbiAgLyoqIEFsbG93cyB0aGUgdXNhZ2Ugb2YgY3VzdG9tIGVtb2ppcyBmcm9tIG90aGVyIHNlcnZlcnMgKi9cbiAgVVNFX0VYVEVSTkFMX0VNT0pJUyA9IDB4MDAwNDAwMDAsXG4gIC8qKiBBbGxvd3MgZm9yIHZpZXdpbmcgZ3VpbGQgaW5zaWdodHMgKi9cbiAgVklFV19HVUlMRF9JTlNJR0hUUyA9IDB4MDAwODAwMDAsXG4gIC8qKiBBbGxvd3MgZm9yIGpvaW5pbmcgb2YgYSB2b2ljZSBjaGFubmVsICovXG4gIENPTk5FQ1QgPSAweDAwMTAwMDAwLFxuICAvKiogQWxsb3dzIGZvciBzcGVha2luZyBpbiBhIHZvaWNlIGNoYW5uZWwgKi9cbiAgU1BFQUsgPSAweDAwMjAwMDAwLFxuICAvKiogQWxsb3dzIGZvciBtdXRpbmcgbWVtYmVycyBpbiBhIHZvaWNlIGNoYW5uZWwgKi9cbiAgTVVURV9NRU1CRVJTID0gMHgwMDQwMDAwMCxcbiAgLyoqIEFsbG93cyBmb3IgZGVhZmVuaW5nIG9mIG1lbWJlcnMgaW4gYSB2b2ljZSBjaGFubmVsICovXG4gIERFQUZFTl9NRU1CRVJTID0gMHgwMDgwMDAwMCxcbiAgLyoqIEFsbG93cyBmb3IgbW92aW5nIG9mIG1lbWJlcnMgYmV0d2VlbiB2b2ljZSBjaGFubmVscyAqL1xuICBNT1ZFX01FTUJFUlMgPSAweDAxMDAwMDAwLFxuICAvKiogQWxsb3dzIGZvciB1c2luZyB2b2ljZS1hY3Rpdml0eS1kZXRlY3Rpb24gaW4gYSB2b2ljZSBjaGFubmVsICovXG4gIFVTRV9WQUQgPSAweDAyMDAwMDAwLFxuICAvKiogQWxsb3dzIGZvciBtb2RpZmljYXRpb24gb2Ygb3duIG5pY2tuYW1lICovXG4gIENIQU5HRV9OSUNLTkFNRSA9IDB4MDQwMDAwMDAsXG4gIC8qKiBBbGxvd3MgZm9yIG1vZGlmaWNhdGlvbiBvZiBvdGhlciB1c2VycyBuaWNrbmFtZXMgKi9cbiAgTUFOQUdFX05JQ0tOQU1FUyA9IDB4MDgwMDAwMDAsXG4gIC8qKiBBbGxvd3MgbWFuYWdlbWVudCBhbmQgZWRpdGluZyBvZiByb2xlcyAqL1xuICBNQU5BR0VfUk9MRVMgPSAweDEwMDAwMDAwLFxuICAvKiogQWxsb3dzIG1hbmFnZW1lbnQgYW5kIGVkaXRpbmcgb2Ygd2ViaG9va3MgKi9cbiAgTUFOQUdFX1dFQkhPT0tTID0gMHgyMDAwMDAwMCxcbiAgLyoqIEFsbG93cyBtYW5hZ2VtZW50IGFuZCBlZGl0aW5nIG9mIGVtb2ppcyAqL1xuICBNQU5BR0VfRU1PSklTID0gMHg0MDAwMDAwMCxcbiAgLyoqIEFsbG93cyBtZW1iZXJzIHRvIHVzZSBzbGFzaCBjb21tYW5kcyBpbiB0ZXh0IGNoYW5uZWxzICovXG4gIFVTRV9TTEFTSF9DT01NQU5EUyA9IDB4ODAwMDAwMDAsXG4gIC8qKiBBbGxvd3MgZm9yIHJlcXVlc3RpbmcgdG8gc3BlYWsgaW4gc3RhZ2UgY2hhbm5lbHMuICovXG4gIFJFUVVFU1RfVE9fU1BFQUsgPSAweDEwMDAwMDAwMSxcbiAgLyoqIEFsbG93cyBmb3IgZGVsZXRpbmcgYW5kIGFyY2hpdmluZyB0aHJlYWRzLCBhbmQgdmlld2luZyBhbGwgcHJpdmF0ZSB0aHJlYWRzICovXG4gIE1BTkFHRV9USFJFQURTID0gMHgwNDAwMDAwMDAwLFxuICAvKiogQWxsb3dzIGZvciBjcmVhdGluZyBhbmQgcGFydGljaXBhdGluZyBpbiB0aHJlYWRzICovXG4gIFVTRV9QVUJMSUNfVEhSRUFEUyA9IDB4MDgwMDAwMDAwMCxcbiAgLyoqIEFsbG93cyBmb3IgY3JlYXRpbmcgYW5kIHBhcnRpY2lwYXRpbmcgaW4gcHJpdmF0ZSB0aHJlYWRzICovXG4gIFVTRV9QUklWQVRFX1RIUkVBRFMgPSAweDEwMDAwMDAwMDAsXG59XG5cbmV4cG9ydCB0eXBlIEJpdHdpc2VQZXJtaXNzaW9ucyA9IERpc2NvcmRCaXR3aXNlUGVybWlzc2lvbkZsYWdzO1xuZXhwb3J0IGNvbnN0IEJpdHdpc2VQZXJtaXNzaW9ucyA9IERpc2NvcmRCaXR3aXNlUGVybWlzc2lvbkZsYWdzO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7VUFDWSw2QkFBNkI7SUFBN0IsNkJBQTZCLENBQTdCLDZCQUE2QixDQUN2QyxFQUF5QyxBQUF6QyxxQ0FBeUMsQUFBekMsRUFBeUMsRUFDekMscUJBQXFCLEtBQUcsQ0FBVSxLQUFsQyxxQkFBcUI7SUFGWCw2QkFBNkIsQ0FBN0IsNkJBQTZCLENBR3ZDLEVBQTZCLEFBQTdCLHlCQUE2QixBQUE3QixFQUE2QixFQUM3QixZQUFZLEtBQUcsQ0FBVSxLQUF6QixZQUFZO0lBSkYsNkJBQTZCLENBQTdCLDZCQUE2QixDQUt2QyxFQUE2QixBQUE3Qix5QkFBNkIsQUFBN0IsRUFBNkIsRUFDN0IsV0FBVyxLQUFHLENBQVUsS0FBeEIsV0FBVztJQU5ELDZCQUE2QixDQUE3Qiw2QkFBNkIsQ0FPdkMsRUFBd0UsQUFBeEUsb0VBQXdFLEFBQXhFLEVBQXdFLEVBQ3hFLGFBQWEsS0FBRyxDQUFVLEtBQTFCLGFBQWE7SUFSSCw2QkFBNkIsQ0FBN0IsNkJBQTZCLENBU3ZDLEVBQWdELEFBQWhELDRDQUFnRCxBQUFoRCxFQUFnRCxFQUNoRCxlQUFlLEtBQUcsRUFBVSxLQUE1QixlQUFlO0lBVkwsNkJBQTZCLENBQTdCLDZCQUE2QixDQVd2QyxFQUFpRCxBQUFqRCw2Q0FBaUQsQUFBakQsRUFBaUQsRUFDakQsWUFBWSxLQUFHLEVBQVUsS0FBekIsWUFBWTtJQVpGLDZCQUE2QixDQUE3Qiw2QkFBNkIsQ0FhdkMsRUFBdUQsQUFBdkQsbURBQXVELEFBQXZELEVBQXVELEVBQ3ZELGFBQWEsS0FBRyxFQUFVLEtBQTFCLGFBQWE7SUFkSCw2QkFBNkIsQ0FBN0IsNkJBQTZCLENBZXZDLEVBQXVDLEFBQXZDLG1DQUF1QyxBQUF2QyxFQUF1QyxFQUN2QyxjQUFjLEtBQUcsR0FBVSxLQUEzQixjQUFjO0lBaEJKLDZCQUE2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
