export var DiscordUserFlags;
(function(DiscordUserFlags) {
    DiscordUserFlags[DiscordUserFlags["None"] = 0] = "None";
    DiscordUserFlags[DiscordUserFlags["DiscordEmployee"] = 1] = "DiscordEmployee";
    DiscordUserFlags[DiscordUserFlags["ParteneredServerOwner"] = 2] = "ParteneredServerOwner";
    DiscordUserFlags[DiscordUserFlags["HypeSquadEvents"] = 4] = "HypeSquadEvents";
    DiscordUserFlags[DiscordUserFlags["BugHunterLevel1"] = 8] = "BugHunterLevel1";
    DiscordUserFlags[DiscordUserFlags["HouseBravery"] = 64] = "HouseBravery";
    DiscordUserFlags[DiscordUserFlags["HouseBrilliance"] = 128] = "HouseBrilliance";
    DiscordUserFlags[DiscordUserFlags["HouseBalance"] = 256] = "HouseBalance";
    DiscordUserFlags[DiscordUserFlags["EarlySupporter"] = 512] = "EarlySupporter";
    DiscordUserFlags[DiscordUserFlags["TeamUser"] = 1024] = "TeamUser";
    DiscordUserFlags[DiscordUserFlags["BugHunterLevel2"] = 16384] = "BugHunterLevel2";
    DiscordUserFlags[DiscordUserFlags["VerifiedBot"] = 65536] = "VerifiedBot";
    DiscordUserFlags[DiscordUserFlags["EarlyVerifiedBotDeveloper"] = 131072] = "EarlyVerifiedBotDeveloper";
})(DiscordUserFlags || (DiscordUserFlags = {
}));
export const UserFlags = DiscordUserFlags;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3R5cGVzL3VzZXJzL3VzZXJfZmxhZ3MudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8qKiBodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy9yZXNvdXJjZXMvdXNlciN1c2VyLW9iamVjdC11c2VyLWZsYWdzICovXG5leHBvcnQgZW51bSBEaXNjb3JkVXNlckZsYWdzIHtcbiAgTm9uZSxcbiAgRGlzY29yZEVtcGxveWVlID0gMSA8PCAwLFxuICBQYXJ0ZW5lcmVkU2VydmVyT3duZXIgPSAxIDw8IDEsXG4gIEh5cGVTcXVhZEV2ZW50cyA9IDEgPDwgMixcbiAgQnVnSHVudGVyTGV2ZWwxID0gMSA8PCAzLFxuICBIb3VzZUJyYXZlcnkgPSAxIDw8IDYsXG4gIEhvdXNlQnJpbGxpYW5jZSA9IDEgPDwgNyxcbiAgSG91c2VCYWxhbmNlID0gMSA8PCA4LFxuICBFYXJseVN1cHBvcnRlciA9IDEgPDwgOSxcbiAgVGVhbVVzZXIgPSAxIDw8IDEwLFxuICBCdWdIdW50ZXJMZXZlbDIgPSAxIDw8IDE0LFxuICBWZXJpZmllZEJvdCA9IDEgPDwgMTYsXG4gIEVhcmx5VmVyaWZpZWRCb3REZXZlbG9wZXIgPSAxIDw8IDE3LFxufVxuXG5leHBvcnQgdHlwZSBVc2VyRmxhZ3MgPSBEaXNjb3JkVXNlckZsYWdzO1xuZXhwb3J0IGNvbnN0IFVzZXJGbGFncyA9IERpc2NvcmRVc2VyRmxhZ3M7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtVQUNZLGdCQUFnQjtJQUFoQixnQkFBZ0IsQ0FBaEIsZ0JBQWdCLEVBQzFCLElBQUksS0FBSixDQUFJLEtBQUosSUFBSTtJQURNLGdCQUFnQixDQUFoQixnQkFBZ0IsRUFFMUIsZUFBZSxLQUFmLENBQWUsS0FBZixlQUFlO0lBRkwsZ0JBQWdCLENBQWhCLGdCQUFnQixFQUcxQixxQkFBcUIsS0FBckIsQ0FBcUIsS0FBckIscUJBQXFCO0lBSFgsZ0JBQWdCLENBQWhCLGdCQUFnQixFQUkxQixlQUFlLEtBQWYsQ0FBZSxLQUFmLGVBQWU7SUFKTCxnQkFBZ0IsQ0FBaEIsZ0JBQWdCLEVBSzFCLGVBQWUsS0FBZixDQUFlLEtBQWYsZUFBZTtJQUxMLGdCQUFnQixDQUFoQixnQkFBZ0IsRUFNMUIsWUFBWSxLQUFaLEVBQVksS0FBWixZQUFZO0lBTkYsZ0JBQWdCLENBQWhCLGdCQUFnQixFQU8xQixlQUFlLEtBQWYsR0FBZSxLQUFmLGVBQWU7SUFQTCxnQkFBZ0IsQ0FBaEIsZ0JBQWdCLEVBUTFCLFlBQVksS0FBWixHQUFZLEtBQVosWUFBWTtJQVJGLGdCQUFnQixDQUFoQixnQkFBZ0IsRUFTMUIsY0FBYyxLQUFkLEdBQWMsS0FBZCxjQUFjO0lBVEosZ0JBQWdCLENBQWhCLGdCQUFnQixFQVUxQixRQUFRLEtBQVIsSUFBUSxLQUFSLFFBQVE7SUFWRSxnQkFBZ0IsQ0FBaEIsZ0JBQWdCLEVBVzFCLGVBQWUsS0FBZixLQUFlLEtBQWYsZUFBZTtJQVhMLGdCQUFnQixDQUFoQixnQkFBZ0IsRUFZMUIsV0FBVyxLQUFYLEtBQVcsS0FBWCxXQUFXO0lBWkQsZ0JBQWdCLENBQWhCLGdCQUFnQixFQWExQix5QkFBeUIsS0FBekIsTUFBeUIsS0FBekIseUJBQXlCO0dBYmYsZ0JBQWdCLEtBQWhCLGdCQUFnQjs7YUFpQmYsU0FBUyxHQUFHLGdCQUFnQiJ9