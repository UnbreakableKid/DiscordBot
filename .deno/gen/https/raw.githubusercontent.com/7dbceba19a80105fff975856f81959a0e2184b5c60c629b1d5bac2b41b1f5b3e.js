export var DiscordAuditLogEvents;
(function (DiscordAuditLogEvents) {
  DiscordAuditLogEvents[DiscordAuditLogEvents["GuildUpdate"] = 1] =
    "GuildUpdate";
  DiscordAuditLogEvents[DiscordAuditLogEvents["ChannelCreate"] = 10] =
    "ChannelCreate";
  DiscordAuditLogEvents[DiscordAuditLogEvents["ChannelUpdate"] = 11] =
    "ChannelUpdate";
  DiscordAuditLogEvents[DiscordAuditLogEvents["ChannelDelete"] = 12] =
    "ChannelDelete";
  DiscordAuditLogEvents[DiscordAuditLogEvents["ChannelOverwriteCreate"] = 13] =
    "ChannelOverwriteCreate";
  DiscordAuditLogEvents[DiscordAuditLogEvents["ChannelOverwriteUpdate"] = 14] =
    "ChannelOverwriteUpdate";
  DiscordAuditLogEvents[DiscordAuditLogEvents["ChannelOverwriteDelete"] = 15] =
    "ChannelOverwriteDelete";
  DiscordAuditLogEvents[DiscordAuditLogEvents["MemberKick"] = 20] =
    "MemberKick";
  DiscordAuditLogEvents[DiscordAuditLogEvents["MemberPrune"] = 21] =
    "MemberPrune";
  DiscordAuditLogEvents[DiscordAuditLogEvents["MemberBanAdd"] = 22] =
    "MemberBanAdd";
  DiscordAuditLogEvents[DiscordAuditLogEvents["MemberBanRemove"] = 23] =
    "MemberBanRemove";
  DiscordAuditLogEvents[DiscordAuditLogEvents["MemberUpdate"] = 24] =
    "MemberUpdate";
  DiscordAuditLogEvents[DiscordAuditLogEvents["MemberRoleUpdate"] = 25] =
    "MemberRoleUpdate";
  DiscordAuditLogEvents[DiscordAuditLogEvents["MemberMove"] = 26] =
    "MemberMove";
  DiscordAuditLogEvents[DiscordAuditLogEvents["MemberDisconnect"] = 27] =
    "MemberDisconnect";
  DiscordAuditLogEvents[DiscordAuditLogEvents["BotAdd"] = 28] = "BotAdd";
  DiscordAuditLogEvents[DiscordAuditLogEvents["RoleCreate"] = 30] =
    "RoleCreate";
  DiscordAuditLogEvents[DiscordAuditLogEvents["RoleUpdate"] = 31] =
    "RoleUpdate";
  DiscordAuditLogEvents[DiscordAuditLogEvents["RoleDelete"] = 32] =
    "RoleDelete";
  DiscordAuditLogEvents[DiscordAuditLogEvents["InviteCreate"] = 40] =
    "InviteCreate";
  DiscordAuditLogEvents[DiscordAuditLogEvents["InviteUpdate"] = 41] =
    "InviteUpdate";
  DiscordAuditLogEvents[DiscordAuditLogEvents["InviteDelete"] = 42] =
    "InviteDelete";
  DiscordAuditLogEvents[DiscordAuditLogEvents["WebhookCreate"] = 50] =
    "WebhookCreate";
  DiscordAuditLogEvents[DiscordAuditLogEvents["WebhookUpdate"] = 51] =
    "WebhookUpdate";
  DiscordAuditLogEvents[DiscordAuditLogEvents["WebhookDelete"] = 52] =
    "WebhookDelete";
  DiscordAuditLogEvents[DiscordAuditLogEvents["EmojiCreate"] = 60] =
    "EmojiCreate";
  DiscordAuditLogEvents[DiscordAuditLogEvents["EmojiUpdate"] = 61] =
    "EmojiUpdate";
  DiscordAuditLogEvents[DiscordAuditLogEvents["EmojiDelete"] = 62] =
    "EmojiDelete";
  DiscordAuditLogEvents[DiscordAuditLogEvents["MessageDelete"] = 72] =
    "MessageDelete";
  DiscordAuditLogEvents[DiscordAuditLogEvents["MessageBulkDelete"] = 73] =
    "MessageBulkDelete";
  DiscordAuditLogEvents[DiscordAuditLogEvents["MessagePin"] = 74] =
    "MessagePin";
  DiscordAuditLogEvents[DiscordAuditLogEvents["MessageUnpin"] = 75] =
    "MessageUnpin";
  DiscordAuditLogEvents[DiscordAuditLogEvents["IntegrationCreate"] = 80] =
    "IntegrationCreate";
  DiscordAuditLogEvents[DiscordAuditLogEvents["IntegrationUpdate"] = 81] =
    "IntegrationUpdate";
  DiscordAuditLogEvents[DiscordAuditLogEvents["IntegrationDelete"] = 82] =
    "IntegrationDelete";
})(DiscordAuditLogEvents || (DiscordAuditLogEvents = {}));
export const AuditLogEvents = DiscordAuditLogEvents;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3R5cGVzL2F1ZGl0X2xvZy9hdWRpdF9sb2dfZXZlbnRzLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiogaHR0cHM6Ly9kaXNjb3JkLmNvbS9kZXZlbG9wZXJzL2RvY3MvcmVzb3VyY2VzL2F1ZGl0LWxvZyNhdWRpdC1sb2ctZW50cnktb2JqZWN0LWF1ZGl0LWxvZy1ldmVudHMgKi9cbmV4cG9ydCBlbnVtIERpc2NvcmRBdWRpdExvZ0V2ZW50cyB7XG4gIEd1aWxkVXBkYXRlID0gMSxcbiAgQ2hhbm5lbENyZWF0ZSA9IDEwLFxuICBDaGFubmVsVXBkYXRlLFxuICBDaGFubmVsRGVsZXRlLFxuICBDaGFubmVsT3ZlcndyaXRlQ3JlYXRlLFxuICBDaGFubmVsT3ZlcndyaXRlVXBkYXRlLFxuICBDaGFubmVsT3ZlcndyaXRlRGVsZXRlLFxuICBNZW1iZXJLaWNrID0gMjAsXG4gIE1lbWJlclBydW5lLFxuICBNZW1iZXJCYW5BZGQsXG4gIE1lbWJlckJhblJlbW92ZSxcbiAgTWVtYmVyVXBkYXRlLFxuICBNZW1iZXJSb2xlVXBkYXRlLFxuICBNZW1iZXJNb3ZlLFxuICBNZW1iZXJEaXNjb25uZWN0LFxuICBCb3RBZGQsXG4gIFJvbGVDcmVhdGUgPSAzMCxcbiAgUm9sZVVwZGF0ZSxcbiAgUm9sZURlbGV0ZSxcbiAgSW52aXRlQ3JlYXRlID0gNDAsXG4gIEludml0ZVVwZGF0ZSxcbiAgSW52aXRlRGVsZXRlLFxuICBXZWJob29rQ3JlYXRlID0gNTAsXG4gIFdlYmhvb2tVcGRhdGUsXG4gIFdlYmhvb2tEZWxldGUsXG4gIEVtb2ppQ3JlYXRlID0gNjAsXG4gIEVtb2ppVXBkYXRlLFxuICBFbW9qaURlbGV0ZSxcbiAgTWVzc2FnZURlbGV0ZSA9IDcyLFxuICBNZXNzYWdlQnVsa0RlbGV0ZSxcbiAgTWVzc2FnZVBpbixcbiAgTWVzc2FnZVVucGluLFxuICBJbnRlZ3JhdGlvbkNyZWF0ZSA9IDgwLFxuICBJbnRlZ3JhdGlvblVwZGF0ZSxcbiAgSW50ZWdyYXRpb25EZWxldGUsXG59XG5cbmV4cG9ydCB0eXBlIEF1ZGl0TG9nRXZlbnRzID0gRGlzY29yZEF1ZGl0TG9nRXZlbnRzO1xuZXhwb3J0IGNvbnN0IEF1ZGl0TG9nRXZlbnRzID0gRGlzY29yZEF1ZGl0TG9nRXZlbnRzO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7VUFDWSxxQkFBcUI7SUFBckIscUJBQXFCLENBQXJCLHFCQUFxQixFQUMvQixXQUFXLEtBQUcsQ0FBQyxLQUFmLFdBQVc7SUFERCxxQkFBcUIsQ0FBckIscUJBQXFCLEVBRS9CLGFBQWEsS0FBRyxFQUFFLEtBQWxCLGFBQWE7SUFGSCxxQkFBcUIsQ0FBckIscUJBQXFCLEVBRy9CLGFBQWEsS0FBYixFQUFhLEtBQWIsYUFBYTtJQUhILHFCQUFxQixDQUFyQixxQkFBcUIsRUFJL0IsYUFBYSxLQUFiLEVBQWEsS0FBYixhQUFhO0lBSkgscUJBQXFCLENBQXJCLHFCQUFxQixFQUsvQixzQkFBc0IsS0FBdEIsRUFBc0IsS0FBdEIsc0JBQXNCO0lBTFoscUJBQXFCLENBQXJCLHFCQUFxQixFQU0vQixzQkFBc0IsS0FBdEIsRUFBc0IsS0FBdEIsc0JBQXNCO0lBTloscUJBQXFCLENBQXJCLHFCQUFxQixFQU8vQixzQkFBc0IsS0FBdEIsRUFBc0IsS0FBdEIsc0JBQXNCO0lBUFoscUJBQXFCLENBQXJCLHFCQUFxQixFQVEvQixVQUFVLEtBQUcsRUFBRSxLQUFmLFVBQVU7SUFSQSxxQkFBcUIsQ0FBckIscUJBQXFCLEVBUy9CLFdBQVcsS0FBWCxFQUFXLEtBQVgsV0FBVztJQVRELHFCQUFxQixDQUFyQixxQkFBcUIsRUFVL0IsWUFBWSxLQUFaLEVBQVksS0FBWixZQUFZO0lBVkYscUJBQXFCLENBQXJCLHFCQUFxQixFQVcvQixlQUFlLEtBQWYsRUFBZSxLQUFmLGVBQWU7SUFYTCxxQkFBcUIsQ0FBckIscUJBQXFCLEVBWS9CLFlBQVksS0FBWixFQUFZLEtBQVosWUFBWTtJQVpGLHFCQUFxQixDQUFyQixxQkFBcUIsRUFhL0IsZ0JBQWdCLEtBQWhCLEVBQWdCLEtBQWhCLGdCQUFnQjtJQWJOLHFCQUFxQixDQUFyQixxQkFBcUIsRUFjL0IsVUFBVSxLQUFWLEVBQVUsS0FBVixVQUFVO0lBZEEscUJBQXFCLENBQXJCLHFCQUFxQixFQWUvQixnQkFBZ0IsS0FBaEIsRUFBZ0IsS0FBaEIsZ0JBQWdCO0lBZk4scUJBQXFCLENBQXJCLHFCQUFxQixFQWdCL0IsTUFBTSxLQUFOLEVBQU0sS0FBTixNQUFNO0lBaEJJLHFCQUFxQixDQUFyQixxQkFBcUIsRUFpQi9CLFVBQVUsS0FBRyxFQUFFLEtBQWYsVUFBVTtJQWpCQSxxQkFBcUIsQ0FBckIscUJBQXFCLEVBa0IvQixVQUFVLEtBQVYsRUFBVSxLQUFWLFVBQVU7SUFsQkEscUJBQXFCLENBQXJCLHFCQUFxQixFQW1CL0IsVUFBVSxLQUFWLEVBQVUsS0FBVixVQUFVO0lBbkJBLHFCQUFxQixDQUFyQixxQkFBcUIsRUFvQi9CLFlBQVksS0FBRyxFQUFFLEtBQWpCLFlBQVk7SUFwQkYscUJBQXFCLENBQXJCLHFCQUFxQixFQXFCL0IsWUFBWSxLQUFaLEVBQVksS0FBWixZQUFZO0lBckJGLHFCQUFxQixDQUFyQixxQkFBcUIsRUFzQi9CLFlBQVksS0FBWixFQUFZLEtBQVosWUFBWTtJQXRCRixxQkFBcUIsQ0FBckIscUJBQXFCLEVBdUIvQixhQUFhLEtBQUcsRUFBRSxLQUFsQixhQUFhO0lBdkJILHFCQUFxQixDQUFyQixxQkFBcUIsRUF3Qi9CLGFBQWEsS0FBYixFQUFhLEtBQWIsYUFBYTtJQXhCSCxxQkFBcUIsQ0FBckIscUJBQXFCLEVBeUIvQixhQUFhLEtBQWIsRUFBYSxLQUFiLGFBQWE7SUF6QkgscUJBQXFCLENBQXJCLHFCQUFxQixFQTBCL0IsV0FBVyxLQUFHLEVBQUUsS0FBaEIsV0FBVztJQTFCRCxxQkFBcUIsQ0FBckIscUJBQXFCLEVBMkIvQixXQUFXLEtBQVgsRUFBVyxLQUFYLFdBQVc7SUEzQkQscUJBQXFCLENBQXJCLHFCQUFxQixFQTRCL0IsV0FBVyxLQUFYLEVBQVcsS0FBWCxXQUFXO0lBNUJELHFCQUFxQixDQUFyQixxQkFBcUIsRUE2Qi9CLGFBQWEsS0FBRyxFQUFFLEtBQWxCLGFBQWE7SUE3QkgscUJBQXFCLENBQXJCLHFCQUFxQixFQThCL0IsaUJBQWlCLEtBQWpCLEVBQWlCLEtBQWpCLGlCQUFpQjtJQTlCUCxxQkFBcUIsQ0FBckIscUJBQXFCLEVBK0IvQixVQUFVLEtBQVYsRUFBVSxLQUFWLFVBQVU7SUEvQkEscUJBQXFCLENBQXJCLHFCQUFxQixFQWdDL0IsWUFBWSxLQUFaLEVBQVksS0FBWixZQUFZO0lBaENGLHFCQUFxQixDQUFyQixxQkFBcUIsRUFpQy9CLGlCQUFpQixLQUFHLEVBQUUsS0FBdEIsaUJBQWlCO0lBakNQLHFCQUFxQixDQUFyQixxQkFBcUIsRUFrQy9CLGlCQUFpQixLQUFqQixFQUFpQixLQUFqQixpQkFBaUI7SUFsQ1AscUJBQXFCLENBQXJCLHFCQUFxQixFQW1DL0IsaUJBQWlCLEtBQWpCLEVBQWlCLEtBQWpCLGlCQUFpQjtHQW5DUCxxQkFBcUIsS0FBckIscUJBQXFCOzthQXVDcEIsY0FBYyxHQUFHLHFCQUFxQiJ9
