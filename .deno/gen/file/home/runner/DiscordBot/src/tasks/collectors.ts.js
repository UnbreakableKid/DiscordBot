// This task will help remove un-used collectors to help keep our cache optimized.
import { bot } from "../../cache.ts";
import { Milliseconds } from "../utils/constants/time.ts";
bot.tasks.set(`collectors`, {
    name: `collectors`,
    // Runs this function once a minute
    interval: Milliseconds.MINUTE,
    execute: function() {
        const now = Date.now();
        bot.messageCollectors.forEach((collector, key)=>{
            // This collector has not finished yet.
            if (collector.createdAt + collector.duration > now) return;
            // Remove the collector
            bot.messageCollectors.delete(key);
            // Reject the promise so code can continue in commands.
            return collector.reject();
        });
        bot.reactionCollectors.forEach((collector, key)=>{
            // This collector has not finished yet.
            if (collector.createdAt + collector.duration > now) return;
            // Remove the collector
            bot.reactionCollectors.delete(key);
            // Reject the promise so code can continue in commands.
            return collector.reject();
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL3Rhc2tzL2NvbGxlY3RvcnMudHMjNT4iXSwic291cmNlc0NvbnRlbnQiOlsiLy8gVGhpcyB0YXNrIHdpbGwgaGVscCByZW1vdmUgdW4tdXNlZCBjb2xsZWN0b3JzIHRvIGhlbHAga2VlcCBvdXIgY2FjaGUgb3B0aW1pemVkLlxuaW1wb3J0IHsgYm90IH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyBNaWxsaXNlY29uZHMgfSBmcm9tIFwiLi4vdXRpbHMvY29uc3RhbnRzL3RpbWUudHNcIjtcblxuYm90LnRhc2tzLnNldChgY29sbGVjdG9yc2AsIHtcbiAgbmFtZTogYGNvbGxlY3RvcnNgLFxuICAvLyBSdW5zIHRoaXMgZnVuY3Rpb24gb25jZSBhIG1pbnV0ZVxuICBpbnRlcnZhbDogTWlsbGlzZWNvbmRzLk1JTlVURSxcbiAgZXhlY3V0ZTogZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG5cbiAgICBib3QubWVzc2FnZUNvbGxlY3RvcnMuZm9yRWFjaCgoY29sbGVjdG9yLCBrZXkpID0+IHtcbiAgICAgIC8vIFRoaXMgY29sbGVjdG9yIGhhcyBub3QgZmluaXNoZWQgeWV0LlxuICAgICAgaWYgKGNvbGxlY3Rvci5jcmVhdGVkQXQgKyBjb2xsZWN0b3IuZHVyYXRpb24gPiBub3cpIHJldHVybjtcblxuICAgICAgLy8gUmVtb3ZlIHRoZSBjb2xsZWN0b3JcbiAgICAgIGJvdC5tZXNzYWdlQ29sbGVjdG9ycy5kZWxldGUoa2V5KTtcbiAgICAgIC8vIFJlamVjdCB0aGUgcHJvbWlzZSBzbyBjb2RlIGNhbiBjb250aW51ZSBpbiBjb21tYW5kcy5cbiAgICAgIHJldHVybiBjb2xsZWN0b3IucmVqZWN0KCk7XG4gICAgfSk7XG5cbiAgICBib3QucmVhY3Rpb25Db2xsZWN0b3JzLmZvckVhY2goKGNvbGxlY3Rvciwga2V5KSA9PiB7XG4gICAgICAvLyBUaGlzIGNvbGxlY3RvciBoYXMgbm90IGZpbmlzaGVkIHlldC5cbiAgICAgIGlmIChjb2xsZWN0b3IuY3JlYXRlZEF0ICsgY29sbGVjdG9yLmR1cmF0aW9uID4gbm93KSByZXR1cm47XG5cbiAgICAgIC8vIFJlbW92ZSB0aGUgY29sbGVjdG9yXG4gICAgICBib3QucmVhY3Rpb25Db2xsZWN0b3JzLmRlbGV0ZShrZXkpO1xuICAgICAgLy8gUmVqZWN0IHRoZSBwcm9taXNlIHNvIGNvZGUgY2FuIGNvbnRpbnVlIGluIGNvbW1hbmRzLlxuICAgICAgcmV0dXJuIGNvbGxlY3Rvci5yZWplY3QoKTtcbiAgICB9KTtcbiAgfSxcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEVBQWtGLEFBQWxGLGdGQUFrRjtTQUN6RSxHQUFHLFNBQVEsY0FBZ0I7U0FDM0IsWUFBWSxTQUFRLDBCQUE0QjtBQUV6RCxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxVQUFVO0lBQ3ZCLElBQUksR0FBRyxVQUFVO0lBQ2pCLEVBQW1DLEFBQW5DLGlDQUFtQztJQUNuQyxRQUFRLEVBQUUsWUFBWSxDQUFDLE1BQU07SUFDN0IsT0FBTztjQUNDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRztRQUVwQixHQUFHLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxHQUFHO1lBQzNDLEVBQXVDLEFBQXZDLHFDQUF1QztnQkFDbkMsU0FBUyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsUUFBUSxHQUFHLEdBQUc7WUFFbEQsRUFBdUIsQUFBdkIscUJBQXVCO1lBQ3ZCLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsR0FBRztZQUNoQyxFQUF1RCxBQUF2RCxxREFBdUQ7bUJBQ2hELFNBQVMsQ0FBQyxNQUFNOztRQUd6QixHQUFHLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxHQUFHO1lBQzVDLEVBQXVDLEFBQXZDLHFDQUF1QztnQkFDbkMsU0FBUyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsUUFBUSxHQUFHLEdBQUc7WUFFbEQsRUFBdUIsQUFBdkIscUJBQXVCO1lBQ3ZCLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsR0FBRztZQUNqQyxFQUF1RCxBQUF2RCxxREFBdUQ7bUJBQ2hELFNBQVMsQ0FBQyxNQUFNIn0=