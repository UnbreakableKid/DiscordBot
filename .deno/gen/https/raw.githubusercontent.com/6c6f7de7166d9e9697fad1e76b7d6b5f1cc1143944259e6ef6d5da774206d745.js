import { rest } from "../../rest/rest.ts";
import { Errors } from "../../types/discordeno/errors.ts";
import { endpoints } from "../../util/constants.ts";
import { urlToBase64 } from "../../util/utils.ts";
/** Modifies the bot's username or avatar.
 * NOTE: username: if changed may cause the bot's discriminator to be randomized.
 */ export async function editBotProfile(username, botAvatarURL) {
  // Nothing was edited
  if (!username && !botAvatarURL) return;
  // Check username requirements if username was provided
  if (username) {
    if (username.length > 32) {
      throw new Error(Errors.USERNAME_MAX_LENGTH);
    }
    if (username.length < 2) {
      throw new Error(Errors.USERNAME_MIN_LENGTH);
    }
    if (
      [
        "@",
        "#",
        ":",
        "```",
      ].some((char) => username.includes(char))
    ) {
      throw new Error(Errors.USERNAME_INVALID_CHARACTER);
    }
    if (
      [
        "discordtag",
        "everyone",
        "here",
      ].includes(username)
    ) {
      throw new Error(Errors.USERNAME_INVALID_USERNAME);
    }
  }
  const avatar = botAvatarURL ? await urlToBase64(botAvatarURL) : undefined;
  return await rest.runMethod("patch", endpoints.USER_BOT, {
    username: username?.trim(),
    avatar,
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvbWlzYy9lZGl0X2JvdF9wcm9maWxlLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHsgRXJyb3JzIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2Rpc2NvcmRlbm8vZXJyb3JzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFVzZXIgfSBmcm9tIFwiLi4vLi4vdHlwZXMvdXNlcnMvdXNlci50c1wiO1xuaW1wb3J0IHsgZW5kcG9pbnRzIH0gZnJvbSBcIi4uLy4uL3V0aWwvY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyB1cmxUb0Jhc2U2NCB9IGZyb20gXCIuLi8uLi91dGlsL3V0aWxzLnRzXCI7XG5cbi8qKiBNb2RpZmllcyB0aGUgYm90J3MgdXNlcm5hbWUgb3IgYXZhdGFyLlxuICogTk9URTogdXNlcm5hbWU6IGlmIGNoYW5nZWQgbWF5IGNhdXNlIHRoZSBib3QncyBkaXNjcmltaW5hdG9yIHRvIGJlIHJhbmRvbWl6ZWQuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlZGl0Qm90UHJvZmlsZSh1c2VybmFtZT86IHN0cmluZywgYm90QXZhdGFyVVJMPzogc3RyaW5nKSB7XG4gIC8vIE5vdGhpbmcgd2FzIGVkaXRlZFxuICBpZiAoIXVzZXJuYW1lICYmICFib3RBdmF0YXJVUkwpIHJldHVybjtcbiAgLy8gQ2hlY2sgdXNlcm5hbWUgcmVxdWlyZW1lbnRzIGlmIHVzZXJuYW1lIHdhcyBwcm92aWRlZFxuICBpZiAodXNlcm5hbWUpIHtcbiAgICBpZiAodXNlcm5hbWUubGVuZ3RoID4gMzIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihFcnJvcnMuVVNFUk5BTUVfTUFYX0xFTkdUSCk7XG4gICAgfVxuICAgIGlmICh1c2VybmFtZS5sZW5ndGggPCAyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLlVTRVJOQU1FX01JTl9MRU5HVEgpO1xuICAgIH1cbiAgICBpZiAoW1wiQFwiLCBcIiNcIiwgXCI6XCIsIFwiYGBgXCJdLnNvbWUoKGNoYXIpID0+IHVzZXJuYW1lLmluY2x1ZGVzKGNoYXIpKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKEVycm9ycy5VU0VSTkFNRV9JTlZBTElEX0NIQVJBQ1RFUik7XG4gICAgfVxuICAgIGlmIChbXCJkaXNjb3JkdGFnXCIsIFwiZXZlcnlvbmVcIiwgXCJoZXJlXCJdLmluY2x1ZGVzKHVzZXJuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKEVycm9ycy5VU0VSTkFNRV9JTlZBTElEX1VTRVJOQU1FKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBhdmF0YXIgPSBib3RBdmF0YXJVUkwgPyBhd2FpdCB1cmxUb0Jhc2U2NChib3RBdmF0YXJVUkwpIDogdW5kZWZpbmVkO1xuXG4gIHJldHVybiBhd2FpdCByZXN0LnJ1bk1ldGhvZDxVc2VyPihcInBhdGNoXCIsIGVuZHBvaW50cy5VU0VSX0JPVCwge1xuICAgIHVzZXJuYW1lOiB1c2VybmFtZT8udHJpbSgpLFxuICAgIGF2YXRhcixcbiAgfSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsSUFBSSxTQUFRLGtCQUFvQjtTQUNoQyxNQUFNLFNBQVEsZ0NBQWtDO1NBRWhELFNBQVMsU0FBUSx1QkFBeUI7U0FDMUMsV0FBVyxTQUFRLG1CQUFxQjtBQUVqRCxFQUVHLEFBRkg7O0NBRUcsQUFGSCxFQUVHLHVCQUNtQixjQUFjLENBQUMsUUFBaUIsRUFBRSxZQUFxQjtJQUMzRSxFQUFxQixBQUFyQixtQkFBcUI7U0FDaEIsUUFBUSxLQUFLLFlBQVk7SUFDOUIsRUFBdUQsQUFBdkQscURBQXVEO1FBQ25ELFFBQVE7WUFDTixRQUFRLENBQUMsTUFBTSxHQUFHLEVBQUU7c0JBQ1osS0FBSyxDQUFDLE1BQU0sQ0FBQyxtQkFBbUI7O1lBRXhDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQztzQkFDWCxLQUFLLENBQUMsTUFBTSxDQUFDLG1CQUFtQjs7O2FBRXZDLENBQUc7YUFBRSxDQUFHO2FBQUUsQ0FBRzthQUFFLEdBQUs7VUFBRSxJQUFJLEVBQUUsSUFBSSxHQUFLLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSTs7c0JBQ3BELEtBQUssQ0FBQyxNQUFNLENBQUMsMEJBQTBCOzs7YUFFOUMsVUFBWTthQUFFLFFBQVU7YUFBRSxJQUFNO1VBQUUsUUFBUSxDQUFDLFFBQVE7c0JBQzVDLEtBQUssQ0FBQyxNQUFNLENBQUMseUJBQXlCOzs7VUFJOUMsTUFBTSxHQUFHLFlBQVksU0FBUyxXQUFXLENBQUMsWUFBWSxJQUFJLFNBQVM7aUJBRTVELElBQUksQ0FBQyxTQUFTLEVBQU8sS0FBTyxHQUFFLFNBQVMsQ0FBQyxRQUFRO1FBQzNELFFBQVEsRUFBRSxRQUFRLEVBQUUsSUFBSTtRQUN4QixNQUFNIn0=
