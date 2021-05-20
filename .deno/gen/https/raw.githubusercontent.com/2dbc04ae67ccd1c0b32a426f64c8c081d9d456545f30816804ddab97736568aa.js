import { cacheHandlers } from "../../cache.ts";
import { Errors } from "../../types/discordeno/errors.ts";
import { endpoints } from "../../util/constants.ts";
/** Returns the widget image URL for the guild. */ export async function getWidgetImageURL(
  guildId,
  options,
) {
  if (!options?.force) {
    const guild = await cacheHandlers.get("guilds", guildId);
    if (!guild) throw new Error(Errors.GUILD_NOT_FOUND);
    if (!guild.widgetEnabled) throw new Error(Errors.GUILD_WIDGET_NOT_ENABLED);
  }
  return `${endpoints.GUILD_WIDGET(guildId)}.png?style=${options?.style ??
    "shield"}`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvZ3VpbGRzL2dldF93aWRnZXRfaW1hZ2VfdXJsLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjYWNoZUhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgdHlwZSB7IEdldEd1aWxkV2lkZ2V0SW1hZ2VRdWVyeSB9IGZyb20gXCIuLi8uLi90eXBlcy9ndWlsZHMvZ2V0X2d1aWxkX3dpZGdldF9pbWFnZS50c1wiO1xuaW1wb3J0IHsgRXJyb3JzIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2Rpc2NvcmRlbm8vZXJyb3JzLnRzXCI7XG5pbXBvcnQgeyBlbmRwb2ludHMgfSBmcm9tIFwiLi4vLi4vdXRpbC9jb25zdGFudHMudHNcIjtcblxuLyoqIFJldHVybnMgdGhlIHdpZGdldCBpbWFnZSBVUkwgZm9yIHRoZSBndWlsZC4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRXaWRnZXRJbWFnZVVSTChcbiAgZ3VpbGRJZDogYmlnaW50LFxuICBvcHRpb25zPzogR2V0R3VpbGRXaWRnZXRJbWFnZVF1ZXJ5ICYgeyBmb3JjZT86IGJvb2xlYW4gfSxcbikge1xuICBpZiAoIW9wdGlvbnM/LmZvcmNlKSB7XG4gICAgY29uc3QgZ3VpbGQgPSBhd2FpdCBjYWNoZUhhbmRsZXJzLmdldChcImd1aWxkc1wiLCBndWlsZElkKTtcbiAgICBpZiAoIWd1aWxkKSB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLkdVSUxEX05PVF9GT1VORCk7XG4gICAgaWYgKCFndWlsZC53aWRnZXRFbmFibGVkKSB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLkdVSUxEX1dJREdFVF9OT1RfRU5BQkxFRCk7XG4gIH1cblxuICByZXR1cm4gYCR7ZW5kcG9pbnRzLkdVSUxEX1dJREdFVChndWlsZElkKX0ucG5nP3N0eWxlPSR7b3B0aW9ucz8uc3R5bGUgPz9cbiAgICBcInNoaWVsZFwifWA7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsYUFBYSxTQUFRLGNBQWdCO1NBRXJDLE1BQU0sU0FBUSxnQ0FBa0M7U0FDaEQsU0FBUyxTQUFRLHVCQUF5QjtBQUVuRCxFQUFrRCxBQUFsRCw4Q0FBa0QsQUFBbEQsRUFBa0QsdUJBQzVCLGlCQUFpQixDQUNyQyxPQUFlLEVBQ2YsT0FBd0Q7U0FFbkQsT0FBTyxFQUFFLEtBQUs7Y0FDWCxLQUFLLFNBQVMsYUFBYSxDQUFDLEdBQUcsRUFBQyxNQUFRLEdBQUUsT0FBTzthQUNsRCxLQUFLLFlBQVksS0FBSyxDQUFDLE1BQU0sQ0FBQyxlQUFlO2FBQzdDLEtBQUssQ0FBQyxhQUFhLFlBQVksS0FBSyxDQUFDLE1BQU0sQ0FBQyx3QkFBd0I7O2NBR2pFLFNBQVMsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsS0FBSyxLQUNuRSxNQUFRIn0=