export var DiscordChannelTypes;
(function (DiscordChannelTypes) {
  DiscordChannelTypes[
    DiscordChannelTypes[/** A text channel within a server */ "GuildText"] = 0
  ] = "GuildText";
  DiscordChannelTypes[
    DiscordChannelTypes[/** A direct message between users */ "DM"] = 1
  ] = "DM";
  DiscordChannelTypes[
    DiscordChannelTypes[/** A voice channel within a server */ "GuildVoice"] = 2
  ] = "GuildVoice";
  DiscordChannelTypes[
    DiscordChannelTypes[
      /** A direct message between multiple users */ "GroupDm"
    ] = 3
  ] = "GroupDm";
  DiscordChannelTypes[
    DiscordChannelTypes[
      /** An organizational category that contains up to 50 channels */ "GuildCategory"
    ] = 4
  ] = "GuildCategory";
  DiscordChannelTypes[
    DiscordChannelTypes[
      /** A channel that users can follow and crosspost into their own server */ "GuildNews"
    ] = 5
  ] = "GuildNews";
  DiscordChannelTypes[
    DiscordChannelTypes[
      /** A channel in which game developers can sell their game on Discord */ "GuildStore"
    ] = 6
  ] = "GuildStore";
  DiscordChannelTypes[
    DiscordChannelTypes[
      /** A temporary sub-channel within a GUILD_NEWS channel */ "GuildNewsThread"
    ] = 10
  ] = "GuildNewsThread";
  DiscordChannelTypes[
    DiscordChannelTypes[
      /** A temporary sub-channel within a GUILD_TEXT channel */ "GuildPublicThread"
    ] = 11
  ] = "GuildPublicThread";
  DiscordChannelTypes[
    DiscordChannelTypes[
      /** A temporary sub-channel within a GUILD_TEXT channel that is only viewable by those invited and those with the MANAGE_THREADS permission */ "GuildPivateThread"
    ] = 12
  ] = "GuildPivateThread";
  DiscordChannelTypes[
    DiscordChannelTypes[
      /** A voice channel for hosting events with an audience */ "GuildStageVoice"
    ] = 13
  ] = "GuildStageVoice";
})(DiscordChannelTypes || (DiscordChannelTypes = {}));
export const ChannelTypes = DiscordChannelTypes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3R5cGVzL2NoYW5uZWxzL2NoYW5uZWxfdHlwZXMudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8qKiBodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy9yZXNvdXJjZXMvY2hhbm5lbCNjaGFubmVsLW9iamVjdC1jaGFubmVsLXR5cGVzICovXG5leHBvcnQgZW51bSBEaXNjb3JkQ2hhbm5lbFR5cGVzIHtcbiAgLyoqIEEgdGV4dCBjaGFubmVsIHdpdGhpbiBhIHNlcnZlciAqL1xuICBHdWlsZFRleHQsXG4gIC8qKiBBIGRpcmVjdCBtZXNzYWdlIGJldHdlZW4gdXNlcnMgKi9cbiAgRE0sXG4gIC8qKiBBIHZvaWNlIGNoYW5uZWwgd2l0aGluIGEgc2VydmVyICovXG4gIEd1aWxkVm9pY2UsXG4gIC8qKiBBIGRpcmVjdCBtZXNzYWdlIGJldHdlZW4gbXVsdGlwbGUgdXNlcnMgKi9cbiAgR3JvdXBEbSxcbiAgLyoqIEFuIG9yZ2FuaXphdGlvbmFsIGNhdGVnb3J5IHRoYXQgY29udGFpbnMgdXAgdG8gNTAgY2hhbm5lbHMgKi9cbiAgR3VpbGRDYXRlZ29yeSxcbiAgLyoqIEEgY2hhbm5lbCB0aGF0IHVzZXJzIGNhbiBmb2xsb3cgYW5kIGNyb3NzcG9zdCBpbnRvIHRoZWlyIG93biBzZXJ2ZXIgKi9cbiAgR3VpbGROZXdzLFxuICAvKiogQSBjaGFubmVsIGluIHdoaWNoIGdhbWUgZGV2ZWxvcGVycyBjYW4gc2VsbCB0aGVpciBnYW1lIG9uIERpc2NvcmQgKi9cbiAgR3VpbGRTdG9yZSxcbiAgLyoqIEEgdGVtcG9yYXJ5IHN1Yi1jaGFubmVsIHdpdGhpbiBhIEdVSUxEX05FV1MgY2hhbm5lbCAqL1xuICBHdWlsZE5ld3NUaHJlYWQgPSAxMCxcbiAgLyoqIEEgdGVtcG9yYXJ5IHN1Yi1jaGFubmVsIHdpdGhpbiBhIEdVSUxEX1RFWFQgY2hhbm5lbCAqL1xuICBHdWlsZFB1YmxpY1RocmVhZCxcbiAgLyoqIEEgdGVtcG9yYXJ5IHN1Yi1jaGFubmVsIHdpdGhpbiBhIEdVSUxEX1RFWFQgY2hhbm5lbCB0aGF0IGlzIG9ubHkgdmlld2FibGUgYnkgdGhvc2UgaW52aXRlZCBhbmQgdGhvc2Ugd2l0aCB0aGUgTUFOQUdFX1RIUkVBRFMgcGVybWlzc2lvbiAqL1xuICBHdWlsZFBpdmF0ZVRocmVhZCxcbiAgLyoqIEEgdm9pY2UgY2hhbm5lbCBmb3IgaG9zdGluZyBldmVudHMgd2l0aCBhbiBhdWRpZW5jZSAqL1xuICBHdWlsZFN0YWdlVm9pY2UgPSAxMyxcbn1cblxuZXhwb3J0IHR5cGUgQ2hhbm5lbFR5cGVzID0gRGlzY29yZENoYW5uZWxUeXBlcztcbmV4cG9ydCBjb25zdCBDaGFubmVsVHlwZXMgPSBEaXNjb3JkQ2hhbm5lbFR5cGVzO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7VUFDWSxtQkFBbUI7SUFBbkIsbUJBQW1CLENBQW5CLG1CQUFtQixDQUM3QixFQUFxQyxBQUFyQyxpQ0FBcUMsQUFBckMsRUFBcUMsRUFDckMsU0FBUyxLQUFULENBQVMsS0FBVCxTQUFTO0lBRkMsbUJBQW1CLENBQW5CLG1CQUFtQixDQUc3QixFQUFxQyxBQUFyQyxpQ0FBcUMsQUFBckMsRUFBcUMsRUFDckMsRUFBRSxLQUFGLENBQUUsS0FBRixFQUFFO0lBSlEsbUJBQW1CLENBQW5CLG1CQUFtQixDQUs3QixFQUFzQyxBQUF0QyxrQ0FBc0MsQUFBdEMsRUFBc0MsRUFDdEMsVUFBVSxLQUFWLENBQVUsS0FBVixVQUFVO0lBTkEsbUJBQW1CLENBQW5CLG1CQUFtQixDQU83QixFQUE4QyxBQUE5QywwQ0FBOEMsQUFBOUMsRUFBOEMsRUFDOUMsT0FBTyxLQUFQLENBQU8sS0FBUCxPQUFPO0lBUkcsbUJBQW1CLENBQW5CLG1CQUFtQixDQVM3QixFQUFpRSxBQUFqRSw2REFBaUUsQUFBakUsRUFBaUUsRUFDakUsYUFBYSxLQUFiLENBQWEsS0FBYixhQUFhO0lBVkgsbUJBQW1CLENBQW5CLG1CQUFtQixDQVc3QixFQUEwRSxBQUExRSxzRUFBMEUsQUFBMUUsRUFBMEUsRUFDMUUsU0FBUyxLQUFULENBQVMsS0FBVCxTQUFTO0lBWkMsbUJBQW1CLENBQW5CLG1CQUFtQixDQWE3QixFQUF3RSxBQUF4RSxvRUFBd0UsQUFBeEUsRUFBd0UsRUFDeEUsVUFBVSxLQUFWLENBQVUsS0FBVixVQUFVO0lBZEEsbUJBQW1CLENBQW5CLG1CQUFtQixDQWU3QixFQUEwRCxBQUExRCxzREFBMEQsQUFBMUQsRUFBMEQsRUFDMUQsZUFBZSxLQUFHLEVBQUUsS0FBcEIsZUFBZTtJQWhCTCxtQkFBbUIsQ0FBbkIsbUJBQW1CLENBaUI3QixFQUEwRCxBQUExRCxzREFBMEQsQUFBMUQsRUFBMEQsRUFDMUQsaUJBQWlCLEtBQWpCLEVBQWlCLEtBQWpCLGlCQUFpQjtJQWxCUCxtQkFBbUIsQ0FBbkIsbUJBQW1CLENBbUI3QixFQUE4SSxBQUE5SSwwSUFBOEksQUFBOUksRUFBOEksRUFDOUksaUJBQWlCLEtBQWpCLEVBQWlCLEtBQWpCLGlCQUFpQjtJQXBCUCxtQkFBbUIsQ0FBbkIsbUJBQW1CLENBcUI3QixFQUEwRCxBQUExRCxzREFBMEQsQUFBMUQsRUFBMEQsRUFDMUQsZUFBZSxLQUFHLEVBQUUsS0FBcEIsZUFBZTtHQXRCTCxtQkFBbUIsS0FBbkIsbUJBQW1COzthQTBCbEIsWUFBWSxHQUFHLG1CQUFtQiJ9
