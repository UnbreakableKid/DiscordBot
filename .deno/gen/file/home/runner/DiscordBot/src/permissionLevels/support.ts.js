import { configs } from "../../configs.ts";
import { bot } from "../../cache.ts";
import { PermissionLevels } from "../types/commands.ts";
// The member using the command must be one of the bots support team
bot.permissionLevels.set(
  PermissionLevels.BOT_SUPPORT,
  (message) =>
    configs.userIds.botSupporters.includes(message.authorId.toString()),
);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL3Blcm1pc3Npb25MZXZlbHMvc3VwcG9ydC50cyM2PiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjb25maWdzIH0gZnJvbSBcIi4uLy4uL2NvbmZpZ3MudHNcIjtcbmltcG9ydCB7IGJvdCB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuaW1wb3J0IHsgUGVybWlzc2lvbkxldmVscyB9IGZyb20gXCIuLi90eXBlcy9jb21tYW5kcy50c1wiO1xuXG4vLyBUaGUgbWVtYmVyIHVzaW5nIHRoZSBjb21tYW5kIG11c3QgYmUgb25lIG9mIHRoZSBib3RzIHN1cHBvcnQgdGVhbVxuYm90LnBlcm1pc3Npb25MZXZlbHMuc2V0KFxuICBQZXJtaXNzaW9uTGV2ZWxzLkJPVF9TVVBQT1JULFxuICAobWVzc2FnZSkgPT5cbiAgICBjb25maWdzLnVzZXJJZHMuYm90U3VwcG9ydGVycy5pbmNsdWRlcyhtZXNzYWdlLmF1dGhvcklkLnRvU3RyaW5nKCkpLFxuKTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxPQUFPLFNBQVEsZ0JBQWtCO1NBQ2pDLEdBQUcsU0FBUSxjQUFnQjtTQUMzQixnQkFBZ0IsU0FBUSxvQkFBc0I7QUFFdkQsRUFBb0UsQUFBcEUsa0VBQW9FO0FBQ3BFLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQ3RCLGdCQUFnQixDQUFDLFdBQVcsR0FDM0IsT0FBTyxHQUNOLE9BQU8sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEifQ==