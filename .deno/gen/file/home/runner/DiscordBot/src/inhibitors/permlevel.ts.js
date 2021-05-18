import { bot } from "../../cache.ts";
bot.inhibitors.set("permlevel", async function(message, command) {
    // This command doesnt require a perm level so allow the command.
    if (!command.permissionLevels?.length) return false;
    // If a custom function was provided
    if (typeof command.permissionLevels === "function") {
        // The function returns a boolean.
        const allowed = await command.permissionLevels(message, command);
        // We reverse the boolean to allow the command if they meet the perm level.
        return !allowed;
    }
    // If an array of perm levels was provided
    for (const permlevel of command.permissionLevels){
        const hasPermission = bot.permissionLevels.get(permlevel);
        if (!hasPermission) continue;
        const allowed = await hasPermission(message, command);
        // If this user has one of the allowed perm level, the loop is canceled and command is allowed.
        if (allowed) return false;
    }
    // None of the perm levels were met. So cancel the command
    return true;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2luaGliaXRvcnMvcGVybWxldmVsLnRzIzE+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvdCB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuXG5ib3QuaW5oaWJpdG9ycy5zZXQoXCJwZXJtbGV2ZWxcIiwgYXN5bmMgZnVuY3Rpb24gKG1lc3NhZ2UsIGNvbW1hbmQpIHtcbiAgLy8gVGhpcyBjb21tYW5kIGRvZXNudCByZXF1aXJlIGEgcGVybSBsZXZlbCBzbyBhbGxvdyB0aGUgY29tbWFuZC5cbiAgaWYgKCFjb21tYW5kLnBlcm1pc3Npb25MZXZlbHM/Lmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIElmIGEgY3VzdG9tIGZ1bmN0aW9uIHdhcyBwcm92aWRlZFxuICBpZiAodHlwZW9mIGNvbW1hbmQucGVybWlzc2lvbkxldmVscyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgLy8gVGhlIGZ1bmN0aW9uIHJldHVybnMgYSBib29sZWFuLlxuICAgIGNvbnN0IGFsbG93ZWQgPSBhd2FpdCBjb21tYW5kLnBlcm1pc3Npb25MZXZlbHMobWVzc2FnZSwgY29tbWFuZCk7XG4gICAgLy8gV2UgcmV2ZXJzZSB0aGUgYm9vbGVhbiB0byBhbGxvdyB0aGUgY29tbWFuZCBpZiB0aGV5IG1lZXQgdGhlIHBlcm0gbGV2ZWwuXG4gICAgcmV0dXJuICFhbGxvd2VkO1xuICB9XG5cbiAgLy8gSWYgYW4gYXJyYXkgb2YgcGVybSBsZXZlbHMgd2FzIHByb3ZpZGVkXG4gIGZvciAoY29uc3QgcGVybWxldmVsIG9mIGNvbW1hbmQucGVybWlzc2lvbkxldmVscykge1xuICAgIGNvbnN0IGhhc1Blcm1pc3Npb24gPSBib3QucGVybWlzc2lvbkxldmVscy5nZXQocGVybWxldmVsKTtcbiAgICBpZiAoIWhhc1Blcm1pc3Npb24pIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgYWxsb3dlZCA9IGF3YWl0IGhhc1Blcm1pc3Npb24obWVzc2FnZSwgY29tbWFuZCk7XG4gICAgLy8gSWYgdGhpcyB1c2VyIGhhcyBvbmUgb2YgdGhlIGFsbG93ZWQgcGVybSBsZXZlbCwgdGhlIGxvb3AgaXMgY2FuY2VsZWQgYW5kIGNvbW1hbmQgaXMgYWxsb3dlZC5cbiAgICBpZiAoYWxsb3dlZCkgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gTm9uZSBvZiB0aGUgcGVybSBsZXZlbHMgd2VyZSBtZXQuIFNvIGNhbmNlbCB0aGUgY29tbWFuZFxuICByZXR1cm4gdHJ1ZTtcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLEdBQUcsU0FBUSxjQUFnQjtBQUVwQyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBQyxTQUFXLGtCQUFrQixPQUFPLEVBQUUsT0FBTztJQUM5RCxFQUFpRSxBQUFqRSwrREFBaUU7U0FDNUQsT0FBTyxDQUFDLGdCQUFnQixFQUFFLE1BQU0sU0FBUyxLQUFLO0lBRW5ELEVBQW9DLEFBQXBDLGtDQUFvQztlQUN6QixPQUFPLENBQUMsZ0JBQWdCLE1BQUssUUFBVTtRQUNoRCxFQUFrQyxBQUFsQyxnQ0FBa0M7Y0FDNUIsT0FBTyxTQUFTLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsT0FBTztRQUMvRCxFQUEyRSxBQUEzRSx5RUFBMkU7Z0JBQ25FLE9BQU87O0lBR2pCLEVBQTBDLEFBQTFDLHdDQUEwQztlQUMvQixTQUFTLElBQUksT0FBTyxDQUFDLGdCQUFnQjtjQUN4QyxhQUFhLEdBQUcsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxTQUFTO2FBQ25ELGFBQWE7Y0FFWixPQUFPLFNBQVMsYUFBYSxDQUFDLE9BQU8sRUFBRSxPQUFPO1FBQ3BELEVBQStGLEFBQS9GLDZGQUErRjtZQUMzRixPQUFPLFNBQVMsS0FBSzs7SUFHM0IsRUFBMEQsQUFBMUQsd0RBQTBEO1dBQ25ELElBQUkifQ==