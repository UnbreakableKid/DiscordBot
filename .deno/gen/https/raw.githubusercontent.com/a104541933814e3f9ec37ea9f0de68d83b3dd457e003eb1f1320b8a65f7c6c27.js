export var DiscordVoiceCloseEventCodes;
(function (DiscordVoiceCloseEventCodes) {
  DiscordVoiceCloseEventCodes[
    DiscordVoiceCloseEventCodes["UnknownOpcode"] = 4001
  ] = "UnknownOpcode";
  DiscordVoiceCloseEventCodes[
    DiscordVoiceCloseEventCodes["FailedToDecodePayload"] = 4002
  ] = "FailedToDecodePayload";
  DiscordVoiceCloseEventCodes[
    DiscordVoiceCloseEventCodes["NotAuthenticated"] = 4003
  ] = "NotAuthenticated";
  DiscordVoiceCloseEventCodes[
    DiscordVoiceCloseEventCodes["AuthenticationFailed"] = 4004
  ] = "AuthenticationFailed";
  DiscordVoiceCloseEventCodes[
    DiscordVoiceCloseEventCodes["AlreadyAuthenticated"] = 4005
  ] = "AlreadyAuthenticated";
  DiscordVoiceCloseEventCodes[
    DiscordVoiceCloseEventCodes["SessionNoLongerValid"] = 4006
  ] = "SessionNoLongerValid";
  DiscordVoiceCloseEventCodes[
    DiscordVoiceCloseEventCodes["SessionTimedOut"] = 4009
  ] = "SessionTimedOut";
  DiscordVoiceCloseEventCodes[
    DiscordVoiceCloseEventCodes["ServerNotFound"] = 4011
  ] = "ServerNotFound";
  DiscordVoiceCloseEventCodes[
    DiscordVoiceCloseEventCodes["UnknownProtocol"] = 4012
  ] = "UnknownProtocol";
  DiscordVoiceCloseEventCodes[
    DiscordVoiceCloseEventCodes["Disconnect"] = 4014
  ] = "Disconnect";
  DiscordVoiceCloseEventCodes[
    DiscordVoiceCloseEventCodes["VoiceServerCrashed"] = 4015
  ] = "VoiceServerCrashed";
  DiscordVoiceCloseEventCodes[
    DiscordVoiceCloseEventCodes["UnknownEncryptionMode"] = 4016
  ] = "UnknownEncryptionMode";
})(DiscordVoiceCloseEventCodes || (DiscordVoiceCloseEventCodes = {}));
export const VoiceCloseEventCodes = DiscordVoiceCloseEventCodes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3R5cGVzL2NvZGVzL3ZvaWNlX2Nsb3NlX2V2ZW50X2NvZGVzLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiogaHR0cHM6Ly9kaXNjb3JkLmNvbS9kZXZlbG9wZXJzL2RvY3MvdG9waWNzL29wY29kZXMtYW5kLXN0YXR1cy1jb2RlcyN2b2ljZSAqL1xuZXhwb3J0IGVudW0gRGlzY29yZFZvaWNlQ2xvc2VFdmVudENvZGVzIHtcbiAgVW5rbm93bk9wY29kZSA9IDQwMDEsXG4gIEZhaWxlZFRvRGVjb2RlUGF5bG9hZCxcbiAgTm90QXV0aGVudGljYXRlZCxcbiAgQXV0aGVudGljYXRpb25GYWlsZWQsXG4gIEFscmVhZHlBdXRoZW50aWNhdGVkLFxuICBTZXNzaW9uTm9Mb25nZXJWYWxpZCxcbiAgU2Vzc2lvblRpbWVkT3V0ID0gNDAwOSxcbiAgU2VydmVyTm90Rm91bmQgPSA0MDExLFxuICBVbmtub3duUHJvdG9jb2wsXG4gIERpc2Nvbm5lY3QgPSA0MDE0LFxuICBWb2ljZVNlcnZlckNyYXNoZWQsXG4gIFVua25vd25FbmNyeXB0aW9uTW9kZSxcbn1cblxuZXhwb3J0IHR5cGUgVm9pY2VDbG9zZUV2ZW50Q29kZXMgPSBEaXNjb3JkVm9pY2VDbG9zZUV2ZW50Q29kZXM7XG5leHBvcnQgY29uc3QgVm9pY2VDbG9zZUV2ZW50Q29kZXMgPSBEaXNjb3JkVm9pY2VDbG9zZUV2ZW50Q29kZXM7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtVQUNZLDJCQUEyQjtJQUEzQiwyQkFBMkIsQ0FBM0IsMkJBQTJCLEVBQ3JDLGFBQWEsS0FBRyxJQUFJLEtBQXBCLGFBQWE7SUFESCwyQkFBMkIsQ0FBM0IsMkJBQTJCLEVBRXJDLHFCQUFxQixLQUFyQixJQUFxQixLQUFyQixxQkFBcUI7SUFGWCwyQkFBMkIsQ0FBM0IsMkJBQTJCLEVBR3JDLGdCQUFnQixLQUFoQixJQUFnQixLQUFoQixnQkFBZ0I7SUFITiwyQkFBMkIsQ0FBM0IsMkJBQTJCLEVBSXJDLG9CQUFvQixLQUFwQixJQUFvQixLQUFwQixvQkFBb0I7SUFKViwyQkFBMkIsQ0FBM0IsMkJBQTJCLEVBS3JDLG9CQUFvQixLQUFwQixJQUFvQixLQUFwQixvQkFBb0I7SUFMViwyQkFBMkIsQ0FBM0IsMkJBQTJCLEVBTXJDLG9CQUFvQixLQUFwQixJQUFvQixLQUFwQixvQkFBb0I7SUFOViwyQkFBMkIsQ0FBM0IsMkJBQTJCLEVBT3JDLGVBQWUsS0FBRyxJQUFJLEtBQXRCLGVBQWU7SUFQTCwyQkFBMkIsQ0FBM0IsMkJBQTJCLEVBUXJDLGNBQWMsS0FBRyxJQUFJLEtBQXJCLGNBQWM7SUFSSiwyQkFBMkIsQ0FBM0IsMkJBQTJCLEVBU3JDLGVBQWUsS0FBZixJQUFlLEtBQWYsZUFBZTtJQVRMLDJCQUEyQixDQUEzQiwyQkFBMkIsRUFVckMsVUFBVSxLQUFHLElBQUksS0FBakIsVUFBVTtJQVZBLDJCQUEyQixDQUEzQiwyQkFBMkIsRUFXckMsa0JBQWtCLEtBQWxCLElBQWtCLEtBQWxCLGtCQUFrQjtJQVhSLDJCQUEyQixDQUEzQiwyQkFBMkIsRUFZckMscUJBQXFCLEtBQXJCLElBQXFCLEtBQXJCLHFCQUFxQjtHQVpYLDJCQUEyQixLQUEzQiwyQkFBMkI7O2FBZ0IxQixvQkFBb0IsR0FBRywyQkFBMkIifQ==
