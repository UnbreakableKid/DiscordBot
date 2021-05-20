import { bot } from "../../cache.ts";
import { PermissionLevels } from "../types/commands.ts";
// The member using the command must be an server owner.
bot.permissionLevels.set(
  PermissionLevels.SERVER_OWNER,
  (message) => message.guild?.ownerId === message.authorId,
);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL3Blcm1pc3Npb25MZXZlbHMvc2VydmVyX293bmVyLnRzIzY+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvdCB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuaW1wb3J0IHsgUGVybWlzc2lvbkxldmVscyB9IGZyb20gXCIuLi90eXBlcy9jb21tYW5kcy50c1wiO1xuXG4vLyBUaGUgbWVtYmVyIHVzaW5nIHRoZSBjb21tYW5kIG11c3QgYmUgYW4gc2VydmVyIG93bmVyLlxuYm90LnBlcm1pc3Npb25MZXZlbHMuc2V0KFxuICBQZXJtaXNzaW9uTGV2ZWxzLlNFUlZFUl9PV05FUixcbiAgKG1lc3NhZ2UpID0+IG1lc3NhZ2UuZ3VpbGQ/Lm93bmVySWQgPT09IG1lc3NhZ2UuYXV0aG9ySWQsXG4pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLEdBQUcsU0FBUSxjQUFnQjtTQUMzQixnQkFBZ0IsU0FBUSxvQkFBc0I7QUFFdkQsRUFBd0QsQUFBeEQsc0RBQXdEO0FBQ3hELEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQ3RCLGdCQUFnQixDQUFDLFlBQVksR0FDNUIsT0FBTyxHQUFLLE9BQU8sQ0FBQyxLQUFLLEVBQUUsT0FBTyxLQUFLLE9BQU8sQ0FBQyxRQUFRIn0=