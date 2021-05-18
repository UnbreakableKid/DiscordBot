import { DiscordInteractionTypes } from "../../deps.ts";
import { processButtonCollectors } from "../utils/collectors.ts";
import { bot } from "../../cache.ts";
bot.eventHandlers.interactionCreate = function(data, member) {
    // A SLASH COMMAND WAS USED
    if (data.type === DiscordInteractionTypes.ApplicationCommand) {
        const command = data.data?.name ? bot.commands.get(data.data.name) : undefined;
        if (!command) return;
        command.slash?.execute(data, member);
    }
    // A BUTTON WAS CLICKED
    if (data.type === DiscordInteractionTypes.Button) {
        processButtonCollectors(data, member);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2V2ZW50cy9pbnRlcmFjdGlvbl9jcmVhdGUudHMjNz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGlzY29yZEludGVyYWN0aW9uVHlwZXMgfSBmcm9tIFwiLi4vLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgcHJvY2Vzc0J1dHRvbkNvbGxlY3RvcnMgfSBmcm9tIFwiLi4vdXRpbHMvY29sbGVjdG9ycy50c1wiO1xuaW1wb3J0IHsgYm90IH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5cbmJvdC5ldmVudEhhbmRsZXJzLmludGVyYWN0aW9uQ3JlYXRlID0gZnVuY3Rpb24gKGRhdGEsIG1lbWJlcikge1xuICAvLyBBIFNMQVNIIENPTU1BTkQgV0FTIFVTRURcbiAgaWYgKGRhdGEudHlwZSA9PT0gRGlzY29yZEludGVyYWN0aW9uVHlwZXMuQXBwbGljYXRpb25Db21tYW5kKSB7XG4gICAgY29uc3QgY29tbWFuZCA9IGRhdGEuZGF0YT8ubmFtZVxuICAgICAgPyBib3QuY29tbWFuZHMuZ2V0KGRhdGEuZGF0YS5uYW1lKVxuICAgICAgOiB1bmRlZmluZWQ7XG4gICAgaWYgKCFjb21tYW5kKSByZXR1cm47XG5cbiAgICBjb21tYW5kLnNsYXNoPy5leGVjdXRlKGRhdGEsIG1lbWJlcik7XG4gIH1cblxuICAvLyBBIEJVVFRPTiBXQVMgQ0xJQ0tFRFxuICBpZiAoZGF0YS50eXBlID09PSBEaXNjb3JkSW50ZXJhY3Rpb25UeXBlcy5CdXR0b24pIHtcbiAgICBwcm9jZXNzQnV0dG9uQ29sbGVjdG9ycyhkYXRhLCBtZW1iZXIpO1xuICB9XG59O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLHVCQUF1QixTQUFRLGFBQWU7U0FDOUMsdUJBQXVCLFNBQVEsc0JBQXdCO1NBQ3ZELEdBQUcsU0FBUSxjQUFnQjtBQUVwQyxHQUFHLENBQUMsYUFBYSxDQUFDLGlCQUFpQixZQUFhLElBQUksRUFBRSxNQUFNO0lBQzFELEVBQTJCLEFBQTNCLHlCQUEyQjtRQUN2QixJQUFJLENBQUMsSUFBSSxLQUFLLHVCQUF1QixDQUFDLGtCQUFrQjtjQUNwRCxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLEdBQzNCLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUMvQixTQUFTO2FBQ1IsT0FBTztRQUVaLE9BQU8sQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxNQUFNOztJQUdyQyxFQUF1QixBQUF2QixxQkFBdUI7UUFDbkIsSUFBSSxDQUFDLElBQUksS0FBSyx1QkFBdUIsQ0FBQyxNQUFNO1FBQzlDLHVCQUF1QixDQUFDLElBQUksRUFBRSxNQUFNIn0=