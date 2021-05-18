import { bot } from "../../cache.ts";
bot.monitors.set("messageCollector", {
    name: "messageCollector",
    ignoreDM: true,
    /** The main code that will be run when this monitor is triggered. */ execute: function(message) {
        const collector = bot.messageCollectors.get(message.authorId);
        // This user has no collectors pending or the message is in a different channel
        if (!collector || message.channelId !== collector.channelId) return;
        // This message is a response to a collector. Now running the filter function.
        if (!collector.filter(message)) return;
        // If the necessary amount has been collected
        if (collector.amount === 1 || collector.amount === collector.messages.length + 1) {
            // Remove the collector
            bot.messageCollectors.delete(message.authorId);
            // Resolve the collector
            return collector.resolve([
                ...collector.messages,
                message
            ]);
        }
        // More messages still need to be collected
        collector.messages.push(message);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL21vbml0b3JzL21lc3NhZ2VfY29sbGVjdG9yLnRzIzQ+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpc2NvcmRlbm9NZXNzYWdlIH0gZnJvbSBcIi4uLy4uL2RlcHMudHNcIjtcbmltcG9ydCB7IGJvdCB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuXG5ib3QubW9uaXRvcnMuc2V0KFwibWVzc2FnZUNvbGxlY3RvclwiLCB7XG4gIG5hbWU6IFwibWVzc2FnZUNvbGxlY3RvclwiLFxuICBpZ25vcmVETTogdHJ1ZSxcbiAgLyoqIFRoZSBtYWluIGNvZGUgdGhhdCB3aWxsIGJlIHJ1biB3aGVuIHRoaXMgbW9uaXRvciBpcyB0cmlnZ2VyZWQuICovXG4gIGV4ZWN1dGU6IGZ1bmN0aW9uIChtZXNzYWdlOiBEaXNjb3JkZW5vTWVzc2FnZSkge1xuICAgIGNvbnN0IGNvbGxlY3RvciA9IGJvdC5tZXNzYWdlQ29sbGVjdG9ycy5nZXQobWVzc2FnZS5hdXRob3JJZCk7XG4gICAgLy8gVGhpcyB1c2VyIGhhcyBubyBjb2xsZWN0b3JzIHBlbmRpbmcgb3IgdGhlIG1lc3NhZ2UgaXMgaW4gYSBkaWZmZXJlbnQgY2hhbm5lbFxuICAgIGlmICghY29sbGVjdG9yIHx8IG1lc3NhZ2UuY2hhbm5lbElkICE9PSBjb2xsZWN0b3IuY2hhbm5lbElkKSByZXR1cm47XG4gICAgLy8gVGhpcyBtZXNzYWdlIGlzIGEgcmVzcG9uc2UgdG8gYSBjb2xsZWN0b3IuIE5vdyBydW5uaW5nIHRoZSBmaWx0ZXIgZnVuY3Rpb24uXG4gICAgaWYgKCFjb2xsZWN0b3IuZmlsdGVyKG1lc3NhZ2UpKSByZXR1cm47XG5cbiAgICAvLyBJZiB0aGUgbmVjZXNzYXJ5IGFtb3VudCBoYXMgYmVlbiBjb2xsZWN0ZWRcbiAgICBpZiAoXG4gICAgICBjb2xsZWN0b3IuYW1vdW50ID09PSAxIHx8XG4gICAgICBjb2xsZWN0b3IuYW1vdW50ID09PSBjb2xsZWN0b3IubWVzc2FnZXMubGVuZ3RoICsgMVxuICAgICkge1xuICAgICAgLy8gUmVtb3ZlIHRoZSBjb2xsZWN0b3JcbiAgICAgIGJvdC5tZXNzYWdlQ29sbGVjdG9ycy5kZWxldGUobWVzc2FnZS5hdXRob3JJZCk7XG4gICAgICAvLyBSZXNvbHZlIHRoZSBjb2xsZWN0b3JcbiAgICAgIHJldHVybiBjb2xsZWN0b3IucmVzb2x2ZShbLi4uY29sbGVjdG9yLm1lc3NhZ2VzLCBtZXNzYWdlXSk7XG4gICAgfVxuXG4gICAgLy8gTW9yZSBtZXNzYWdlcyBzdGlsbCBuZWVkIHRvIGJlIGNvbGxlY3RlZFxuICAgIGNvbGxlY3Rvci5tZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xuICB9LFxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQ1MsR0FBRyxTQUFRLGNBQWdCO0FBRXBDLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFDLGdCQUFrQjtJQUNqQyxJQUFJLEdBQUUsZ0JBQWtCO0lBQ3hCLFFBQVEsRUFBRSxJQUFJO0lBQ2QsRUFBcUUsQUFBckUsaUVBQXFFLEFBQXJFLEVBQXFFLENBQ3JFLE9BQU8sV0FBWSxPQUEwQjtjQUNyQyxTQUFTLEdBQUcsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUTtRQUM1RCxFQUErRSxBQUEvRSw2RUFBK0U7YUFDMUUsU0FBUyxJQUFJLE9BQU8sQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDLFNBQVM7UUFDM0QsRUFBOEUsQUFBOUUsNEVBQThFO2FBQ3pFLFNBQVMsQ0FBQyxNQUFNLENBQUMsT0FBTztRQUU3QixFQUE2QyxBQUE3QywyQ0FBNkM7WUFFM0MsU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQ3RCLFNBQVMsQ0FBQyxNQUFNLEtBQUssU0FBUyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQztZQUVsRCxFQUF1QixBQUF2QixxQkFBdUI7WUFDdkIsR0FBRyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUTtZQUM3QyxFQUF3QixBQUF4QixzQkFBd0I7bUJBQ2pCLFNBQVMsQ0FBQyxPQUFPO21CQUFLLFNBQVMsQ0FBQyxRQUFRO2dCQUFFLE9BQU87OztRQUcxRCxFQUEyQyxBQUEzQyx5Q0FBMkM7UUFDM0MsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyJ9