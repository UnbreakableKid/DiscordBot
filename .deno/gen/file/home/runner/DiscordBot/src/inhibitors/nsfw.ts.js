import { bot } from "../../cache.ts";
bot.inhibitors.set("nsfw", function (message, command) {
  // If this command does not need nsfw the inhibitor returns false so the command can run
  if (!command.nsfw) return false;
  // DMs are not considered NSFW channels by Discord so we return true to cancel nsfw commands on dms
  if (!message.guildId) return true;
  // Checks if this channel is nsfw on or off if it is a nsfw channel return false so the command runs otherwise return true to inhibit the command
  return !message.channel?.nsfw;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2luaGliaXRvcnMvbnNmdy50cyMxPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBib3QgfSBmcm9tIFwiLi4vLi4vY2FjaGUudHNcIjtcblxuYm90LmluaGliaXRvcnMuc2V0KFwibnNmd1wiLCBmdW5jdGlvbiAobWVzc2FnZSwgY29tbWFuZCkge1xuICAvLyBJZiB0aGlzIGNvbW1hbmQgZG9lcyBub3QgbmVlZCBuc2Z3IHRoZSBpbmhpYml0b3IgcmV0dXJucyBmYWxzZSBzbyB0aGUgY29tbWFuZCBjYW4gcnVuXG4gIGlmICghY29tbWFuZC5uc2Z3KSByZXR1cm4gZmFsc2U7XG5cbiAgLy8gRE1zIGFyZSBub3QgY29uc2lkZXJlZCBOU0ZXIGNoYW5uZWxzIGJ5IERpc2NvcmQgc28gd2UgcmV0dXJuIHRydWUgdG8gY2FuY2VsIG5zZncgY29tbWFuZHMgb24gZG1zXG4gIGlmICghbWVzc2FnZS5ndWlsZElkKSByZXR1cm4gdHJ1ZTtcblxuICAvLyBDaGVja3MgaWYgdGhpcyBjaGFubmVsIGlzIG5zZncgb24gb3Igb2ZmIGlmIGl0IGlzIGEgbnNmdyBjaGFubmVsIHJldHVybiBmYWxzZSBzbyB0aGUgY29tbWFuZCBydW5zIG90aGVyd2lzZSByZXR1cm4gdHJ1ZSB0byBpbmhpYml0IHRoZSBjb21tYW5kXG4gIHJldHVybiAhbWVzc2FnZS5jaGFubmVsPy5uc2Z3O1xufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsR0FBRyxTQUFRLGNBQWdCO0FBRXBDLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFDLElBQU0sWUFBWSxPQUFPLEVBQUUsT0FBTztJQUNuRCxFQUF3RixBQUF4RixzRkFBd0Y7U0FDbkYsT0FBTyxDQUFDLElBQUksU0FBUyxLQUFLO0lBRS9CLEVBQW1HLEFBQW5HLGlHQUFtRztTQUM5RixPQUFPLENBQUMsT0FBTyxTQUFTLElBQUk7SUFFakMsRUFBaUosQUFBakosK0lBQWlKO1lBQ3pJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSJ9