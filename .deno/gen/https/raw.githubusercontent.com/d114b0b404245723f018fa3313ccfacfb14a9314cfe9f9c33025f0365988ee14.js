export var DiscordJsonErrorCodes;
(function (DiscordJsonErrorCodes) {
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["GeneralError"] = 0] =
    "GeneralError";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownAccount"] = 10001] =
    "UnknownAccount";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownApplication"] = 10002] =
    "UnknownApplication";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownChannel"] = 10003] =
    "UnknownChannel";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownGuild"] = 10004] =
    "UnknownGuild";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownIntegration"] = 10005] =
    "UnknownIntegration";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownInvite"] = 10006] =
    "UnknownInvite";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownMember"] = 10007] =
    "UnknownMember";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownMessage"] = 10008] =
    "UnknownMessage";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["UnknownPermissionOverwrite"] = 10009
  ] = "UnknownPermissionOverwrite";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownProvider"] = 10010] =
    "UnknownProvider";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownRole"] = 10011] =
    "UnknownRole";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownToken"] = 10012] =
    "UnknownToken";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownUser"] = 10013] =
    "UnknownUser";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownEmoji"] = 10014] =
    "UnknownEmoji";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownWebhook"] = 10015] =
    "UnknownWebhook";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["UnknownWebhookService"] = 10016
  ] = "UnknownWebhookService";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownSession"] = 10020] =
    "UnknownSession";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownBan"] = 10026] =
    "UnknownBan";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownSKU"] = 10027] =
    "UnknownSKU";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownStoreListing"] = 10028] =
    "UnknownStoreListing";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownEntitlement"] = 10029] =
    "UnknownEntitlement";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownBuild"] = 10030] =
    "UnknownBuild";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownLobby"] = 10031] =
    "UnknownLobby";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownBranch"] = 10032] =
    "UnknownBranch";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["UnknownStoreDirectoryLayout"] = 10033
  ] = "UnknownStoreDirectoryLayout";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["UnknownRedistributable"] = 10036
  ] = "UnknownRedistributable";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownGiftCode"] = 10038] =
    "UnknownGiftCode";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownGuildTemplate"] = 10057] =
    "UnknownGuildTemplate";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["UnknownDiscoveryCategory"] = 10059
  ] = "UnknownDiscoveryCategory";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["UnknownInteraction"] = 10062] =
    "UnknownInteraction";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["UnknownApplicationCommand"] = 10063
  ] = "UnknownApplicationCommand";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["UnknownApplicationCommandPermissions"] = 10066
  ] = "UnknownApplicationCommandPermissions";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["BotsCannotUseThisEndpoint"] = 20001
  ] = "BotsCannotUseThisEndpoint";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["OnlyBotsCanUseThisEndpoint"] = 20002
  ] = "OnlyBotsCanUseThisEndpoint";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["ExplicitContentCannotBeSentToTheDesiredRecipient"] =
      20009
  ] = "ExplicitContentCannotBeSentToTheDesiredRecipient";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes[
      "YouAreNotAuthorizedToPerformThisActionOnThisApplication"
    ] = 20012
  ] = "YouAreNotAuthorizedToPerformThisActionOnThisApplication";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["ThisActionCannotBePerformedDueToSlowmodeRateLimit"] =
      20016
  ] = "ThisActionCannotBePerformedDueToSlowmodeRateLimit";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["OnlyTheOwnerOfThisAccountCanPerformThisAction"] =
      20018
  ] = "OnlyTheOwnerOfThisAccountCanPerformThisAction";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes[
      "ThisMessageCannotBeEditedDueToAnnouncementRateLimits"
    ] = 20022
  ] = "ThisMessageCannotBeEditedDueToAnnouncementRateLimits";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["TheChannelYouAreWritingHasHitTheWriteRateLimit"] =
      20028
  ] = "TheChannelYouAreWritingHasHitTheWriteRateLimit";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["MaximumNumberOfGuildsReached"] = 30001
  ] = "MaximumNumberOfGuildsReached";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["MaximumNumberOfFriendsReached"] = 30002
  ] = "MaximumNumberOfFriendsReached";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["MaximumNumberOfPinsReachedForTheChannel"] = 30003
  ] = "MaximumNumberOfPinsReachedForTheChannel";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["MaximumNumberOfRecipientsReached"] = 30004
  ] = "MaximumNumberOfRecipientsReached";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["MaximumNumberOfGuildRolesReached"] = 30005
  ] = "MaximumNumberOfGuildRolesReached";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["MaximumNumberOfWebhooksReached"] = 30007
  ] = "MaximumNumberOfWebhooksReached";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["MaximumNumberOfEmojisReached"] = 30008
  ] = "MaximumNumberOfEmojisReached";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["MaximumNumberOfReactionsReached"] = 30010
  ] = "MaximumNumberOfReactionsReached";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["MaximumNumberOfGuildChannelsReached"] = 30013
  ] = "MaximumNumberOfGuildChannelsReached";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["MaximumNumberOfAttachmentsInAMessageReached"] = 30015
  ] = "MaximumNumberOfAttachmentsInAMessageReached";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["MaximumNumberOfInvitesReached"] = 30016
  ] = "MaximumNumberOfInvitesReached";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes[
      "MaximumNumberOfGuildDiscoverySubcategoriesHasBeenReached"
    ] = 30030
  ] = "MaximumNumberOfGuildDiscoverySubcategoriesHasBeenReached";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["GuildAlreadyHasTemplate"] = 30031
  ] = "GuildAlreadyHasTemplate";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes[
      "MaximumNumberOfBansForNonGuildMembersHaveBeenExceeded"
    ] = 30035
  ] = "MaximumNumberOfBansForNonGuildMembersHaveBeenExceeded";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["MaximumNumberOfBansFetchesHasBeenReached"] = 30037
  ] = "MaximumNumberOfBansFetchesHasBeenReached";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["UnauthorizedProvideAValidTokenAndTryAgain"] = 40001
  ] = "UnauthorizedProvideAValidTokenAndTryAgain";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes[
      "YouNeedToVerifyYourAccountInOrderToPerformThisAction"
    ] = 40002
  ] = "YouNeedToVerifyYourAccountInOrderToPerformThisAction";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["YouAreOpeningDirectMessagesTooFast"] = 40003
  ] = "YouAreOpeningDirectMessagesTooFast";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes[
      "RequestEntityTooLargeTrySendingSomethingSmallerInSize"
    ] = 40005
  ] = "RequestEntityTooLargeTrySendingSomethingSmallerInSize";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["ThisFeatureHasBeenTemporarilyDisabledServerSide"] =
      40006
  ] = "ThisFeatureHasBeenTemporarilyDisabledServerSide";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["ThisUserBannedFromThisGuild"] = 40007
  ] = "ThisUserBannedFromThisGuild";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["TargetUserIsNotConnectedToVoice"] = 40032
  ] = "TargetUserIsNotConnectedToVoice";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["ThisMessageHasAlreadyBeenCrossposted"] = 40033
  ] = "ThisMessageHasAlreadyBeenCrossposted";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["AnApplicationCommandWithThatNameAlreadyExists"] =
      40041
  ] = "AnApplicationCommandWithThatNameAlreadyExists";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["MissingAccess"] = 50001] =
    "MissingAccess";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["InvalidAccountType"] = 50002] =
    "InvalidAccountType";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["CannotExecuteActionOnADMChannel"] = 50003
  ] = "CannotExecuteActionOnADMChannel";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["GuildWidgetDisabled"] = 50004] =
    "GuildWidgetDisabled";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["CannotEditMessageAuthoredByAnotherUser"] = 50005
  ] = "CannotEditMessageAuthoredByAnotherUser";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["CannotSendAnEmptyMessage"] = 50006
  ] = "CannotSendAnEmptyMessage";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["CannotSendMessagesToThisUser"] = 50007
  ] = "CannotSendMessagesToThisUser";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["CannotSendMessagesInAVoiceChannel"] = 50008
  ] = "CannotSendMessagesInAVoiceChannel";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes[
      "ChannelVerificationLevelIsTooHighForYouToGainAccess"
    ] = 50009
  ] = "ChannelVerificationLevelIsTooHighForYouToGainAccess";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["OAuth2ApplicationDoesNotHaveABot"] = 50010
  ] = "OAuth2ApplicationDoesNotHaveABot";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["OAuth2ApplicationLimitReached"] = 50011
  ] = "OAuth2ApplicationLimitReached";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["InvalidOAuth2State"] = 50012] =
    "InvalidOAuth2State";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["YouLackPermissionsToPerformThatAction"] = 50013
  ] = "YouLackPermissionsToPerformThatAction";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["InvalidAuthenticationTokenProvided"] = 50014
  ] = "InvalidAuthenticationTokenProvided";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["NoteWasTooLong"] = 50015] =
    "NoteWasTooLong";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes[
      "ProvidedTooFewOrTooManyMessagesToDeleteMustProvideAtLeast2AndFewerThan100MessagesToDelete"
    ] = 50016
  ] =
    "ProvidedTooFewOrTooManyMessagesToDeleteMustProvideAtLeast2AndFewerThan100MessagesToDelete";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["AMessageCanOnlyBePinnedInTheChannelItWasSentIn"] =
      50019
  ] = "AMessageCanOnlyBePinnedInTheChannelItWasSentIn";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["InviteCodeWasEitherInvalidOrTaken"] = 50020
  ] = "InviteCodeWasEitherInvalidOrTaken";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["CannotExecuteActionOnASystemMessage"] = 50021
  ] = "CannotExecuteActionOnASystemMessage";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["CannotExecuteActionOnThisChannelType"] = 50024
  ] = "CannotExecuteActionOnThisChannelType";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["InvalidOAuth2AccessTokenProvided"] = 50025
  ] = "InvalidOAuth2AccessTokenProvided";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["MissingRequiredOAuth2Scope"] = 50026
  ] = "MissingRequiredOAuth2Scope";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["InvalidWebhookTokenProvided"] = 50027
  ] = "InvalidWebhookTokenProvided";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["InvalidRole"] = 50028] =
    "InvalidRole";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["InvalidRecipients"] = 50033] =
    "InvalidRecipients";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["AMessageProvidedWasTooOldToBulkDelete"] = 50034
  ] = "AMessageProvidedWasTooOldToBulkDelete";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["InvalidFormBodyOrContentTypeProvided"] = 50035
  ] = "InvalidFormBodyOrContentTypeProvided";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes[
      "AnInviteWasAcceptedToAGuildTheApplicationsBotIsNotIn"
    ] = 50036
  ] = "AnInviteWasAcceptedToAGuildTheApplicationsBotIsNotIn";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["InvalidApiVersionProvided"] = 50041
  ] = "InvalidApiVersionProvided";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["CannotSelfRedeemThisGift"] = 50054
  ] = "CannotSelfRedeemThisGift";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["PaymentSourceRequiredToRedeemGift"] = 50070
  ] = "PaymentSourceRequiredToRedeemGift";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["CannotDeleteAChannelRequiredForCommunityGuilds"] =
      50074
  ] = "CannotDeleteAChannelRequiredForCommunityGuilds";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["InvalidStickerSent"] = 50081] =
    "InvalidStickerSent";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes[
      "TriedToPerformAnOperationOnAnArchivedThreadSuchAsEditingAMessageOrAddingAUserToTheThread"
    ] = 50083
  ] =
    "TriedToPerformAnOperationOnAnArchivedThreadSuchAsEditingAMessageOrAddingAUserToTheThread";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["InvalidThreadNotificationSettings"] = 50084
  ] = "InvalidThreadNotificationSettings";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["BeforeValueIsEarlierThanTheThreadCreationDate"] =
      50085
  ] = "BeforeValueIsEarlierThanTheThreadCreationDate";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["TwoFactorIsRequiredForThisOperation"] = 60003
  ] = "TwoFactorIsRequiredForThisOperation";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes["NoUsersWithDiscordTagExist"] = 80004
  ] = "NoUsersWithDiscordTagExist";
  DiscordJsonErrorCodes[DiscordJsonErrorCodes["ReqctionWasBlocked"] = 90001] =
    "ReqctionWasBlocked";
  DiscordJsonErrorCodes[
    DiscordJsonErrorCodes[
      "ApiResourceIsCurrentlyOverloadedTryAgainALittleLater"
    ] = 130000
  ] = "ApiResourceIsCurrentlyOverloadedTryAgainALittleLater";
})(DiscordJsonErrorCodes || (DiscordJsonErrorCodes = {}));
export const JsonErrrorCodes = DiscordJsonErrorCodes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3R5cGVzL2NvZGVzL2pzb25fZXJyb3JfY29kZXMudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8qKiBodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy90b3BpY3Mvb3Bjb2Rlcy1hbmQtc3RhdHVzLWNvZGVzI2pzb24gKi9cbmV4cG9ydCBlbnVtIERpc2NvcmRKc29uRXJyb3JDb2RlcyB7XG4gIEdlbmVyYWxFcnJvcixcbiAgVW5rbm93bkFjY291bnQgPSAxMDAwMSxcbiAgVW5rbm93bkFwcGxpY2F0aW9uLFxuICBVbmtub3duQ2hhbm5lbCxcbiAgVW5rbm93bkd1aWxkLFxuICBVbmtub3duSW50ZWdyYXRpb24sXG4gIFVua25vd25JbnZpdGUsXG4gIFVua25vd25NZW1iZXIsXG4gIFVua25vd25NZXNzYWdlLFxuICBVbmtub3duUGVybWlzc2lvbk92ZXJ3cml0ZSxcbiAgVW5rbm93blByb3ZpZGVyLFxuICBVbmtub3duUm9sZSxcbiAgVW5rbm93blRva2VuLFxuICBVbmtub3duVXNlcixcbiAgVW5rbm93bkVtb2ppLFxuICBVbmtub3duV2ViaG9vayxcbiAgVW5rbm93bldlYmhvb2tTZXJ2aWNlLFxuICBVbmtub3duU2Vzc2lvbiA9IDEwMDIwLFxuICBVbmtub3duQmFuID0gMTAwMjYsXG4gIFVua25vd25TS1UsXG4gIFVua25vd25TdG9yZUxpc3RpbmcsXG4gIFVua25vd25FbnRpdGxlbWVudCxcbiAgVW5rbm93bkJ1aWxkLFxuICBVbmtub3duTG9iYnksXG4gIFVua25vd25CcmFuY2gsXG4gIFVua25vd25TdG9yZURpcmVjdG9yeUxheW91dCxcbiAgVW5rbm93blJlZGlzdHJpYnV0YWJsZSA9IDEwMDM2LFxuICBVbmtub3duR2lmdENvZGUgPSAxMDAzOCxcbiAgVW5rbm93bkd1aWxkVGVtcGxhdGUgPSAxMDA1NyxcbiAgVW5rbm93bkRpc2NvdmVyeUNhdGVnb3J5ID0gMTAwNTksXG4gIFVua25vd25JbnRlcmFjdGlvbiA9IDEwMDYyLFxuICBVbmtub3duQXBwbGljYXRpb25Db21tYW5kID0gMTAwNjMsXG4gIFVua25vd25BcHBsaWNhdGlvbkNvbW1hbmRQZXJtaXNzaW9ucyA9IDEwMDY2LFxuICBCb3RzQ2Fubm90VXNlVGhpc0VuZHBvaW50ID0gMjAwMDEsXG4gIE9ubHlCb3RzQ2FuVXNlVGhpc0VuZHBvaW50LFxuICBFeHBsaWNpdENvbnRlbnRDYW5ub3RCZVNlbnRUb1RoZURlc2lyZWRSZWNpcGllbnQgPSAyMDAwOSxcbiAgWW91QXJlTm90QXV0aG9yaXplZFRvUGVyZm9ybVRoaXNBY3Rpb25PblRoaXNBcHBsaWNhdGlvbiA9IDIwMDEyLFxuICBUaGlzQWN0aW9uQ2Fubm90QmVQZXJmb3JtZWREdWVUb1Nsb3dtb2RlUmF0ZUxpbWl0ID0gMjAwMTYsXG4gIE9ubHlUaGVPd25lck9mVGhpc0FjY291bnRDYW5QZXJmb3JtVGhpc0FjdGlvbiA9IDIwMDE4LFxuICBUaGlzTWVzc2FnZUNhbm5vdEJlRWRpdGVkRHVlVG9Bbm5vdW5jZW1lbnRSYXRlTGltaXRzID0gMjAwMjIsXG4gIFRoZUNoYW5uZWxZb3VBcmVXcml0aW5nSGFzSGl0VGhlV3JpdGVSYXRlTGltaXQgPSAyMDAyOCxcbiAgTWF4aW11bU51bWJlck9mR3VpbGRzUmVhY2hlZCA9IDMwMDAxLFxuICBNYXhpbXVtTnVtYmVyT2ZGcmllbmRzUmVhY2hlZCxcbiAgTWF4aW11bU51bWJlck9mUGluc1JlYWNoZWRGb3JUaGVDaGFubmVsLFxuICBNYXhpbXVtTnVtYmVyT2ZSZWNpcGllbnRzUmVhY2hlZCxcbiAgTWF4aW11bU51bWJlck9mR3VpbGRSb2xlc1JlYWNoZWQsXG4gIE1heGltdW1OdW1iZXJPZldlYmhvb2tzUmVhY2hlZCA9IDMwMDA3LFxuICBNYXhpbXVtTnVtYmVyT2ZFbW9qaXNSZWFjaGVkLFxuICBNYXhpbXVtTnVtYmVyT2ZSZWFjdGlvbnNSZWFjaGVkID0gMzAwMTAsXG4gIE1heGltdW1OdW1iZXJPZkd1aWxkQ2hhbm5lbHNSZWFjaGVkID0gMzAwMTMsXG4gIE1heGltdW1OdW1iZXJPZkF0dGFjaG1lbnRzSW5BTWVzc2FnZVJlYWNoZWQgPSAzMDAxNSxcbiAgTWF4aW11bU51bWJlck9mSW52aXRlc1JlYWNoZWQsXG4gIE1heGltdW1OdW1iZXJPZkd1aWxkRGlzY292ZXJ5U3ViY2F0ZWdvcmllc0hhc0JlZW5SZWFjaGVkID0gMzAwMzAsXG4gIEd1aWxkQWxyZWFkeUhhc1RlbXBsYXRlID0gMzAwMzEsXG4gIE1heGltdW1OdW1iZXJPZkJhbnNGb3JOb25HdWlsZE1lbWJlcnNIYXZlQmVlbkV4Y2VlZGVkID0gMzAwMzUsXG4gIE1heGltdW1OdW1iZXJPZkJhbnNGZXRjaGVzSGFzQmVlblJlYWNoZWQgPSAzMDAzNyxcbiAgVW5hdXRob3JpemVkUHJvdmlkZUFWYWxpZFRva2VuQW5kVHJ5QWdhaW4gPSA0MDAwMSxcbiAgWW91TmVlZFRvVmVyaWZ5WW91ckFjY291bnRJbk9yZGVyVG9QZXJmb3JtVGhpc0FjdGlvbixcbiAgWW91QXJlT3BlbmluZ0RpcmVjdE1lc3NhZ2VzVG9vRmFzdCxcbiAgUmVxdWVzdEVudGl0eVRvb0xhcmdlVHJ5U2VuZGluZ1NvbWV0aGluZ1NtYWxsZXJJblNpemUgPSA0MDAwNSxcbiAgVGhpc0ZlYXR1cmVIYXNCZWVuVGVtcG9yYXJpbHlEaXNhYmxlZFNlcnZlclNpZGUsXG4gIFRoaXNVc2VyQmFubmVkRnJvbVRoaXNHdWlsZCxcbiAgVGFyZ2V0VXNlcklzTm90Q29ubmVjdGVkVG9Wb2ljZSA9IDQwMDMyLFxuICBUaGlzTWVzc2FnZUhhc0FscmVhZHlCZWVuQ3Jvc3Nwb3N0ZWQgPSA0MDAzMyxcbiAgQW5BcHBsaWNhdGlvbkNvbW1hbmRXaXRoVGhhdE5hbWVBbHJlYWR5RXhpc3RzID0gNDAwNDEsXG4gIE1pc3NpbmdBY2Nlc3MgPSA1MDAwMSxcbiAgSW52YWxpZEFjY291bnRUeXBlLFxuICBDYW5ub3RFeGVjdXRlQWN0aW9uT25BRE1DaGFubmVsLFxuICBHdWlsZFdpZGdldERpc2FibGVkLFxuICBDYW5ub3RFZGl0TWVzc2FnZUF1dGhvcmVkQnlBbm90aGVyVXNlcixcbiAgQ2Fubm90U2VuZEFuRW1wdHlNZXNzYWdlLFxuICBDYW5ub3RTZW5kTWVzc2FnZXNUb1RoaXNVc2VyLFxuICBDYW5ub3RTZW5kTWVzc2FnZXNJbkFWb2ljZUNoYW5uZWwsXG4gIENoYW5uZWxWZXJpZmljYXRpb25MZXZlbElzVG9vSGlnaEZvcllvdVRvR2FpbkFjY2VzcyxcbiAgT0F1dGgyQXBwbGljYXRpb25Eb2VzTm90SGF2ZUFCb3QsXG4gIE9BdXRoMkFwcGxpY2F0aW9uTGltaXRSZWFjaGVkLFxuICBJbnZhbGlkT0F1dGgyU3RhdGUsXG4gIFlvdUxhY2tQZXJtaXNzaW9uc1RvUGVyZm9ybVRoYXRBY3Rpb24sXG4gIEludmFsaWRBdXRoZW50aWNhdGlvblRva2VuUHJvdmlkZWQsXG4gIE5vdGVXYXNUb29Mb25nLFxuICBQcm92aWRlZFRvb0Zld09yVG9vTWFueU1lc3NhZ2VzVG9EZWxldGVNdXN0UHJvdmlkZUF0TGVhc3QyQW5kRmV3ZXJUaGFuMTAwTWVzc2FnZXNUb0RlbGV0ZSxcbiAgQU1lc3NhZ2VDYW5Pbmx5QmVQaW5uZWRJblRoZUNoYW5uZWxJdFdhc1NlbnRJbiA9IDUwMDE5LFxuICBJbnZpdGVDb2RlV2FzRWl0aGVySW52YWxpZE9yVGFrZW4sXG4gIENhbm5vdEV4ZWN1dGVBY3Rpb25PbkFTeXN0ZW1NZXNzYWdlLFxuICBDYW5ub3RFeGVjdXRlQWN0aW9uT25UaGlzQ2hhbm5lbFR5cGUgPSA1MDAyNCxcbiAgSW52YWxpZE9BdXRoMkFjY2Vzc1Rva2VuUHJvdmlkZWQsXG4gIE1pc3NpbmdSZXF1aXJlZE9BdXRoMlNjb3BlLFxuICBJbnZhbGlkV2ViaG9va1Rva2VuUHJvdmlkZWQsXG4gIEludmFsaWRSb2xlLFxuICBJbnZhbGlkUmVjaXBpZW50cyA9IDUwMDMzLFxuICBBTWVzc2FnZVByb3ZpZGVkV2FzVG9vT2xkVG9CdWxrRGVsZXRlLFxuICBJbnZhbGlkRm9ybUJvZHlPckNvbnRlbnRUeXBlUHJvdmlkZWQsXG4gIEFuSW52aXRlV2FzQWNjZXB0ZWRUb0FHdWlsZFRoZUFwcGxpY2F0aW9uc0JvdElzTm90SW4sXG4gIEludmFsaWRBcGlWZXJzaW9uUHJvdmlkZWQgPSA1MDA0MSxcbiAgQ2Fubm90U2VsZlJlZGVlbVRoaXNHaWZ0ID0gNTAwNTQsXG4gIFBheW1lbnRTb3VyY2VSZXF1aXJlZFRvUmVkZWVtR2lmdCA9IDUwMDcwLFxuICBDYW5ub3REZWxldGVBQ2hhbm5lbFJlcXVpcmVkRm9yQ29tbXVuaXR5R3VpbGRzID0gNTAwNzQsXG4gIEludmFsaWRTdGlja2VyU2VudCA9IDUwMDgxLFxuICBUcmllZFRvUGVyZm9ybUFuT3BlcmF0aW9uT25BbkFyY2hpdmVkVGhyZWFkU3VjaEFzRWRpdGluZ0FNZXNzYWdlT3JBZGRpbmdBVXNlclRvVGhlVGhyZWFkID1cbiAgICA1MDA4MyxcbiAgSW52YWxpZFRocmVhZE5vdGlmaWNhdGlvblNldHRpbmdzLFxuICBCZWZvcmVWYWx1ZUlzRWFybGllclRoYW5UaGVUaHJlYWRDcmVhdGlvbkRhdGUsXG4gIFR3b0ZhY3RvcklzUmVxdWlyZWRGb3JUaGlzT3BlcmF0aW9uID0gNjAwMDMsXG4gIE5vVXNlcnNXaXRoRGlzY29yZFRhZ0V4aXN0ID0gODAwMDQsXG4gIFJlcWN0aW9uV2FzQmxvY2tlZCA9IDkwMDAxLFxuICBBcGlSZXNvdXJjZUlzQ3VycmVudGx5T3ZlcmxvYWRlZFRyeUFnYWluQUxpdHRsZUxhdGVyID0gMTMwMDAwLFxufVxuXG5leHBvcnQgdHlwZSBKc29uRXJycm9yQ29kZXMgPSBEaXNjb3JkSnNvbkVycm9yQ29kZXM7XG5leHBvcnQgY29uc3QgSnNvbkVycnJvckNvZGVzID0gRGlzY29yZEpzb25FcnJvckNvZGVzO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7VUFDWSxxQkFBcUI7SUFBckIscUJBQXFCLENBQXJCLHFCQUFxQixFQUMvQixZQUFZLEtBQVosQ0FBWSxLQUFaLFlBQVk7SUFERixxQkFBcUIs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
