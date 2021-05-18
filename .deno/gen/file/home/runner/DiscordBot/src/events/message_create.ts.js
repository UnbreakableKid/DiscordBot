import {
  botHasChannelPermissions,
  botHasGuildPermissions,
  botId,
  DiscordChannelTypes,
  hasChannelPermissions,
  hasGuildPermissions,
} from "../../deps.ts";
import { bot } from "../../cache.ts";
import { fetchMember } from "../utils/helpers.ts";
// deno-lint-ignore require-await
bot.eventHandlers.messageCreate = async function (message) {
  bot.memberLastActive.set(message.authorId, message.timestamp);
  bot.monitors.forEach(async (monitor) => {
    // The !== false is important because when not provided we default to true
    if (monitor.ignoreBots !== false && message.isBot) return;
    if (
      monitor.ignoreDM !== false &&
      message.channel?.type === DiscordChannelTypes.DM
    ) {
      return;
    }
    if (monitor.ignoreEdits && message.editedTimestamp) return;
    if (monitor.ignoreOthers && message.authorId !== botId) return;
    // Permission checks
    // No permissions are required
    if (
      !monitor.botChannelPermissions?.length &&
      !monitor.botServerPermissions?.length &&
      !monitor.userChannelPermissions?.length &&
      !monitor.userServerPermissions?.length
    ) {
      return monitor.execute(message);
    }
    // If some permissions is required it must be in a guild
    if (!message.guildId) return;
    // Fetch the member if not in cache in rare rare edge cases it can be undefined
    const member = await fetchMember(message.guildId, message.authorId);
    if (!member) return;
    const permissionCheckResults = await Promise.all([
      // Check if the message author has the necessary channel permissions to run this monitor
      monitor.userChannelPermissions
        ? hasChannelPermissions(
          message.channelId,
          member,
          monitor.userChannelPermissions,
        )
        : undefined,
      // Check if the message author has the necessary guild permissions to run this monitor
      monitor.userServerPermissions
        ? hasGuildPermissions(
          message.guildId,
          member,
          monitor.userServerPermissions,
        )
        : undefined,
      // Check if the bot has the necessary channel permissions to run this monitor in this channel.
      monitor.botChannelPermissions
        ? botHasChannelPermissions(
          message.channelId,
          monitor.botChannelPermissions,
        )
        : undefined,
      // Check if the bot has the necessary guild permissions to run this monitor
      monitor.botServerPermissions
        ? botHasGuildPermissions(message.guildId, monitor.botServerPermissions)
        : undefined,
    ]);
    if (permissionCheckResults.includes(false)) return;
    return monitor.execute(message);
  });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2V2ZW50cy9tZXNzYWdlX2NyZWF0ZS50cyMyPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBib3RIYXNDaGFubmVsUGVybWlzc2lvbnMsXG4gIGJvdEhhc0d1aWxkUGVybWlzc2lvbnMsXG4gIGJvdElkLFxuICBEaXNjb3JkQ2hhbm5lbFR5cGVzLFxuICBoYXNDaGFubmVsUGVybWlzc2lvbnMsXG4gIGhhc0d1aWxkUGVybWlzc2lvbnMsXG59IGZyb20gXCIuLi8uLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyBib3QgfSBmcm9tIFwiLi4vLi4vY2FjaGUudHNcIjtcbmltcG9ydCB7IGZldGNoTWVtYmVyIH0gZnJvbSBcIi4uL3V0aWxzL2hlbHBlcnMudHNcIjtcblxuLy8gZGVuby1saW50LWlnbm9yZSByZXF1aXJlLWF3YWl0XG5ib3QuZXZlbnRIYW5kbGVycy5tZXNzYWdlQ3JlYXRlID0gYXN5bmMgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgYm90Lm1lbWJlckxhc3RBY3RpdmUuc2V0KG1lc3NhZ2UuYXV0aG9ySWQsIG1lc3NhZ2UudGltZXN0YW1wKTtcblxuICBib3QubW9uaXRvcnMuZm9yRWFjaChhc3luYyAobW9uaXRvcikgPT4ge1xuICAgIC8vIFRoZSAhPT0gZmFsc2UgaXMgaW1wb3J0YW50IGJlY2F1c2Ugd2hlbiBub3QgcHJvdmlkZWQgd2UgZGVmYXVsdCB0byB0cnVlXG4gICAgaWYgKG1vbml0b3IuaWdub3JlQm90cyAhPT0gZmFsc2UgJiYgbWVzc2FnZS5pc0JvdCkgcmV0dXJuO1xuXG4gICAgaWYgKFxuICAgICAgbW9uaXRvci5pZ25vcmVETSAhPT0gZmFsc2UgJiZcbiAgICAgIG1lc3NhZ2UuY2hhbm5lbD8udHlwZSA9PT0gRGlzY29yZENoYW5uZWxUeXBlcy5ETVxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChtb25pdG9yLmlnbm9yZUVkaXRzICYmIG1lc3NhZ2UuZWRpdGVkVGltZXN0YW1wKSByZXR1cm47XG4gICAgaWYgKG1vbml0b3IuaWdub3JlT3RoZXJzICYmIG1lc3NhZ2UuYXV0aG9ySWQgIT09IGJvdElkKSByZXR1cm47XG5cbiAgICAvLyBQZXJtaXNzaW9uIGNoZWNrc1xuXG4gICAgLy8gTm8gcGVybWlzc2lvbnMgYXJlIHJlcXVpcmVkXG4gICAgaWYgKFxuICAgICAgIW1vbml0b3IuYm90Q2hhbm5lbFBlcm1pc3Npb25zPy5sZW5ndGggJiZcbiAgICAgICFtb25pdG9yLmJvdFNlcnZlclBlcm1pc3Npb25zPy5sZW5ndGggJiZcbiAgICAgICFtb25pdG9yLnVzZXJDaGFubmVsUGVybWlzc2lvbnM/Lmxlbmd0aCAmJlxuICAgICAgIW1vbml0b3IudXNlclNlcnZlclBlcm1pc3Npb25zPy5sZW5ndGhcbiAgICApIHtcbiAgICAgIHJldHVybiBtb25pdG9yLmV4ZWN1dGUobWVzc2FnZSk7XG4gICAgfVxuXG4gICAgLy8gSWYgc29tZSBwZXJtaXNzaW9ucyBpcyByZXF1aXJlZCBpdCBtdXN0IGJlIGluIGEgZ3VpbGRcbiAgICBpZiAoIW1lc3NhZ2UuZ3VpbGRJZCkgcmV0dXJuO1xuXG4gICAgLy8gRmV0Y2ggdGhlIG1lbWJlciBpZiBub3QgaW4gY2FjaGUgaW4gcmFyZSByYXJlIGVkZ2UgY2FzZXMgaXQgY2FuIGJlIHVuZGVmaW5lZFxuICAgIGNvbnN0IG1lbWJlciA9IGF3YWl0IGZldGNoTWVtYmVyKG1lc3NhZ2UuZ3VpbGRJZCwgbWVzc2FnZS5hdXRob3JJZCk7XG4gICAgaWYgKCFtZW1iZXIpIHJldHVybjtcblxuICAgIGNvbnN0IHBlcm1pc3Npb25DaGVja1Jlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAvLyBDaGVjayBpZiB0aGUgbWVzc2FnZSBhdXRob3IgaGFzIHRoZSBuZWNlc3NhcnkgY2hhbm5lbCBwZXJtaXNzaW9ucyB0byBydW4gdGhpcyBtb25pdG9yXG4gICAgICBtb25pdG9yLnVzZXJDaGFubmVsUGVybWlzc2lvbnNcbiAgICAgICAgPyBoYXNDaGFubmVsUGVybWlzc2lvbnMoXG4gICAgICAgICAgbWVzc2FnZS5jaGFubmVsSWQsXG4gICAgICAgICAgbWVtYmVyLFxuICAgICAgICAgIG1vbml0b3IudXNlckNoYW5uZWxQZXJtaXNzaW9ucyxcbiAgICAgICAgKVxuICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgIC8vIENoZWNrIGlmIHRoZSBtZXNzYWdlIGF1dGhvciBoYXMgdGhlIG5lY2Vzc2FyeSBndWlsZCBwZXJtaXNzaW9ucyB0byBydW4gdGhpcyBtb25pdG9yXG4gICAgICBtb25pdG9yLnVzZXJTZXJ2ZXJQZXJtaXNzaW9uc1xuICAgICAgICA/IGhhc0d1aWxkUGVybWlzc2lvbnMoXG4gICAgICAgICAgbWVzc2FnZS5ndWlsZElkLFxuICAgICAgICAgIG1lbWJlcixcbiAgICAgICAgICBtb25pdG9yLnVzZXJTZXJ2ZXJQZXJtaXNzaW9ucyxcbiAgICAgICAgKVxuICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgIC8vIENoZWNrIGlmIHRoZSBib3QgaGFzIHRoZSBuZWNlc3NhcnkgY2hhbm5lbCBwZXJtaXNzaW9ucyB0byBydW4gdGhpcyBtb25pdG9yIGluIHRoaXMgY2hhbm5lbC5cbiAgICAgIG1vbml0b3IuYm90Q2hhbm5lbFBlcm1pc3Npb25zXG4gICAgICAgID8gYm90SGFzQ2hhbm5lbFBlcm1pc3Npb25zKFxuICAgICAgICAgIG1lc3NhZ2UuY2hhbm5lbElkLFxuICAgICAgICAgIG1vbml0b3IuYm90Q2hhbm5lbFBlcm1pc3Npb25zLFxuICAgICAgICApXG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgLy8gQ2hlY2sgaWYgdGhlIGJvdCBoYXMgdGhlIG5lY2Vzc2FyeSBndWlsZCBwZXJtaXNzaW9ucyB0byBydW4gdGhpcyBtb25pdG9yXG4gICAgICBtb25pdG9yLmJvdFNlcnZlclBlcm1pc3Npb25zXG4gICAgICAgID8gYm90SGFzR3VpbGRQZXJtaXNzaW9ucyhtZXNzYWdlLmd1aWxkSWQsIG1vbml0b3IuYm90U2VydmVyUGVybWlzc2lvbnMpXG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgIF0pO1xuXG4gICAgaWYgKHBlcm1pc3Npb25DaGVja1Jlc3VsdHMuaW5jbHVkZXMoZmFsc2UpKSByZXR1cm47XG5cbiAgICByZXR1cm4gbW9uaXRvci5leGVjdXRlKG1lc3NhZ2UpO1xuICB9KTtcbn07XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQ0Usd0JBQXdCLEVBQ3hCLHNCQUFzQixFQUN0QixLQUFLLEVBQ0wsbUJBQW1CLEVBQ25CLHFCQUFxQixFQUNyQixtQkFBbUIsU0FDZCxhQUFlO1NBQ2IsR0FBRyxTQUFRLGNBQWdCO1NBQzNCLFdBQVcsU0FBUSxtQkFBcUI7QUFFakQsRUFBaUMsQUFBakMsK0JBQWlDO0FBQ2pDLEdBQUcsQ0FBQyxhQUFhLENBQUMsYUFBYSxrQkFBbUIsT0FBTztJQUN2RCxHQUFHLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLFNBQVM7SUFFNUQsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLFFBQVEsT0FBTztRQUNqQyxFQUEwRSxBQUExRSx3RUFBMEU7WUFDdEUsT0FBTyxDQUFDLFVBQVUsS0FBSyxLQUFLLElBQUksT0FBTyxDQUFDLEtBQUs7WUFHL0MsT0FBTyxDQUFDLFFBQVEsS0FBSyxLQUFLLElBQzFCLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxLQUFLLG1CQUFtQixDQUFDLEVBQUU7OztZQUs5QyxPQUFPLENBQUMsV0FBVyxJQUFJLE9BQU8sQ0FBQyxlQUFlO1lBQzlDLE9BQU8sQ0FBQyxZQUFZLElBQUksT0FBTyxDQUFDLFFBQVEsS0FBSyxLQUFLO1FBRXRELEVBQW9CLEFBQXBCLGtCQUFvQjtRQUVwQixFQUE4QixBQUE5Qiw0QkFBOEI7YUFFM0IsT0FBTyxDQUFDLHFCQUFxQixFQUFFLE1BQU0sS0FDckMsT0FBTyxDQUFDLG9CQUFvQixFQUFFLE1BQU0sS0FDcEMsT0FBTyxDQUFDLHNCQUFzQixFQUFFLE1BQU0sS0FDdEMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLE1BQU07bUJBRS9CLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTzs7UUFHaEMsRUFBd0QsQUFBeEQsc0RBQXdEO2FBQ25ELE9BQU8sQ0FBQyxPQUFPO1FBRXBCLEVBQStFLEFBQS9FLDZFQUErRTtjQUN6RSxNQUFNLFNBQVMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLFFBQVE7YUFDN0QsTUFBTTtjQUVMLHNCQUFzQixTQUFTLE9BQU8sQ0FBQyxHQUFHO1lBQzlDLEVBQXdGLEFBQXhGLHNGQUF3RjtZQUN4RixPQUFPLENBQUMsc0JBQXNCLEdBQzFCLHFCQUFxQixDQUNyQixPQUFPLENBQUMsU0FBUyxFQUNqQixNQUFNLEVBQ04sT0FBTyxDQUFDLHNCQUFzQixJQUU5QixTQUFTO1lBQ2IsRUFBc0YsQUFBdEYsb0ZBQXNGO1lBQ3RGLE9BQU8sQ0FBQyxxQkFBcUIsR0FDekIsbUJBQW1CLENBQ25CLE9BQU8sQ0FBQyxPQUFPLEVBQ2YsTUFBTSxFQUNOLE9BQU8sQ0FBQyxxQkFBcUIsSUFFN0IsU0FBUztZQUNiLEVBQThGLEFBQTlGLDRGQUE4RjtZQUM5RixPQUFPLENBQUMscUJBQXFCLEdBQ3pCLHdCQUF3QixDQUN4QixPQUFPLENBQUMsU0FBUyxFQUNqQixPQUFPLENBQUMscUJBQXFCLElBRTdCLFNBQVM7WUFDYixFQUEyRSxBQUEzRSx5RUFBMkU7WUFDM0UsT0FBTyxDQUFDLG9CQUFvQixHQUN4QixzQkFBc0IsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxvQkFBb0IsSUFDcEUsU0FBUzs7WUFHWCxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsS0FBSztlQUVsQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8ifQ==
