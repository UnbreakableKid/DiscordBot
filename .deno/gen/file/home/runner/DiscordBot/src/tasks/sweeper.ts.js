import { Milliseconds } from "../utils/constants/time.ts";
import { botId, cache, cacheHandlers } from "../../deps.ts";
import { bot } from "../../cache.ts";
const MESSAGE_LIFETIME = Milliseconds.MINUTE * 10;
const MEMBER_LIFETIME = Milliseconds.MINUTE * 30;
bot.tasks.set(`sweeper`, {
  name: `sweeper`,
  interval: Milliseconds.MINUTE * 5,
  execute: function () {
    const now = Date.now();
    // Delete presences from the bots cache.
    cacheHandlers.clear("presences");
    // For every guild, we will clean the cache
    cacheHandlers.forEach("guilds", (guild) => {
      // Delete presences from the guild caches.
      guild.presences.clear();
      // Delete any member who has not been active in the last 30 minutes and is not currently in a voice channel
      guild.members.forEach((member) => {
        // Don't purge the bot else bugs will occure
        if (member.id === botId) return;
        // The user is currently active in a voice channel
        if (guild.voiceStates.has(member.id)) return;
        const lastActive = bot.memberLastActive.get(member.id);
        // If the user is active recently
        if (lastActive && now - lastActive < MEMBER_LIFETIME) return;
        cache.members.delete(member.id);
        bot.memberLastActive.delete(member.id);
      });
    });
    // For ever, message we will delete if necessary
    cacheHandlers.forEach("messages", (message) => {
      // Delete any messages over 10 minutes old
      if (now - message.timestamp > MESSAGE_LIFETIME) {
        cache.messages.delete(message.id);
      }
    });
  },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL3Rhc2tzL3N3ZWVwZXIudHMjNT4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWlsbGlzZWNvbmRzIH0gZnJvbSBcIi4uL3V0aWxzL2NvbnN0YW50cy90aW1lLnRzXCI7XG5pbXBvcnQgeyBib3RJZCwgY2FjaGUsIGNhY2hlSGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgYm90IH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5cbmNvbnN0IE1FU1NBR0VfTElGRVRJTUUgPSBNaWxsaXNlY29uZHMuTUlOVVRFICogMTA7XG5jb25zdCBNRU1CRVJfTElGRVRJTUUgPSBNaWxsaXNlY29uZHMuTUlOVVRFICogMzA7XG5cbmJvdC50YXNrcy5zZXQoYHN3ZWVwZXJgLCB7XG4gIG5hbWU6IGBzd2VlcGVyYCxcbiAgaW50ZXJ2YWw6IE1pbGxpc2Vjb25kcy5NSU5VVEUgKiA1LFxuICBleGVjdXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAvLyBEZWxldGUgcHJlc2VuY2VzIGZyb20gdGhlIGJvdHMgY2FjaGUuXG4gICAgY2FjaGVIYW5kbGVycy5jbGVhcihcInByZXNlbmNlc1wiKTtcbiAgICAvLyBGb3IgZXZlcnkgZ3VpbGQsIHdlIHdpbGwgY2xlYW4gdGhlIGNhY2hlXG4gICAgY2FjaGVIYW5kbGVycy5mb3JFYWNoKFwiZ3VpbGRzXCIsIChndWlsZCkgPT4ge1xuICAgICAgLy8gRGVsZXRlIHByZXNlbmNlcyBmcm9tIHRoZSBndWlsZCBjYWNoZXMuXG4gICAgICBndWlsZC5wcmVzZW5jZXMuY2xlYXIoKTtcbiAgICAgIC8vIERlbGV0ZSBhbnkgbWVtYmVyIHdobyBoYXMgbm90IGJlZW4gYWN0aXZlIGluIHRoZSBsYXN0IDMwIG1pbnV0ZXMgYW5kIGlzIG5vdCBjdXJyZW50bHkgaW4gYSB2b2ljZSBjaGFubmVsXG4gICAgICBndWlsZC5tZW1iZXJzLmZvckVhY2goKG1lbWJlcikgPT4ge1xuICAgICAgICAvLyBEb24ndCBwdXJnZSB0aGUgYm90IGVsc2UgYnVncyB3aWxsIG9jY3VyZVxuICAgICAgICBpZiAobWVtYmVyLmlkID09PSBib3RJZCkgcmV0dXJuO1xuICAgICAgICAvLyBUaGUgdXNlciBpcyBjdXJyZW50bHkgYWN0aXZlIGluIGEgdm9pY2UgY2hhbm5lbFxuICAgICAgICBpZiAoZ3VpbGQudm9pY2VTdGF0ZXMuaGFzKG1lbWJlci5pZCkpIHJldHVybjtcbiAgICAgICAgY29uc3QgbGFzdEFjdGl2ZSA9IGJvdC5tZW1iZXJMYXN0QWN0aXZlLmdldChtZW1iZXIuaWQpO1xuICAgICAgICAvLyBJZiB0aGUgdXNlciBpcyBhY3RpdmUgcmVjZW50bHlcbiAgICAgICAgaWYgKGxhc3RBY3RpdmUgJiYgbm93IC0gbGFzdEFjdGl2ZSA8IE1FTUJFUl9MSUZFVElNRSkgcmV0dXJuO1xuICAgICAgICBjYWNoZS5tZW1iZXJzLmRlbGV0ZShtZW1iZXIuaWQpO1xuICAgICAgICBib3QubWVtYmVyTGFzdEFjdGl2ZS5kZWxldGUobWVtYmVyLmlkKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gRm9yIGV2ZXIsIG1lc3NhZ2Ugd2Ugd2lsbCBkZWxldGUgaWYgbmVjZXNzYXJ5XG4gICAgY2FjaGVIYW5kbGVycy5mb3JFYWNoKFwibWVzc2FnZXNcIiwgKG1lc3NhZ2UpID0+IHtcbiAgICAgIC8vIERlbGV0ZSBhbnkgbWVzc2FnZXMgb3ZlciAxMCBtaW51dGVzIG9sZFxuICAgICAgaWYgKG5vdyAtIG1lc3NhZ2UudGltZXN0YW1wID4gTUVTU0FHRV9MSUZFVElNRSkge1xuICAgICAgICBjYWNoZS5tZXNzYWdlcy5kZWxldGUobWVzc2FnZS5pZCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxZQUFZLFNBQVEsMEJBQTRCO1NBQ2hELEtBQUssRUFBRSxLQUFLLEVBQUUsYUFBYSxTQUFRLGFBQWU7U0FDbEQsR0FBRyxTQUFRLGNBQWdCO01BRTlCLGdCQUFnQixHQUFHLFlBQVksQ0FBQyxNQUFNLEdBQUcsRUFBRTtNQUMzQyxlQUFlLEdBQUcsWUFBWSxDQUFDLE1BQU0sR0FBRyxFQUFFO0FBRWhELEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLE9BQU87SUFDcEIsSUFBSSxHQUFHLE9BQU87SUFDZCxRQUFRLEVBQUUsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDO0lBQ2pDLE9BQU87Y0FDQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUc7UUFDcEIsRUFBd0MsQUFBeEMsc0NBQXdDO1FBQ3hDLGFBQWEsQ0FBQyxLQUFLLEVBQUMsU0FBVztRQUMvQixFQUEyQyxBQUEzQyx5Q0FBMkM7UUFDM0MsYUFBYSxDQUFDLE9BQU8sRUFBQyxNQUFRLElBQUcsS0FBSztZQUNwQyxFQUEwQyxBQUExQyx3Q0FBMEM7WUFDMUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLO1lBQ3JCLEVBQTJHLEFBQTNHLHlHQUEyRztZQUMzRyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNO2dCQUMzQixFQUE0QyxBQUE1QywwQ0FBNEM7b0JBQ3hDLE1BQU0sQ0FBQyxFQUFFLEtBQUssS0FBSztnQkFDdkIsRUFBa0QsQUFBbEQsZ0RBQWtEO29CQUM5QyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRTtzQkFDN0IsVUFBVSxHQUFHLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ3JELEVBQWlDLEFBQWpDLCtCQUFpQztvQkFDN0IsVUFBVSxJQUFJLEdBQUcsR0FBRyxVQUFVLEdBQUcsZUFBZTtnQkFDcEQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQzlCLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUU7OztRQUl6QyxFQUFnRCxBQUFoRCw4Q0FBZ0Q7UUFDaEQsYUFBYSxDQUFDLE9BQU8sRUFBQyxRQUFVLElBQUcsT0FBTztZQUN4QyxFQUEwQyxBQUExQyx3Q0FBMEM7Z0JBQ3RDLEdBQUcsR0FBRyxPQUFPLENBQUMsU0FBUyxHQUFHLGdCQUFnQjtnQkFDNUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUifQ==
