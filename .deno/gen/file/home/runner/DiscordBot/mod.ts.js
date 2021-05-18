import { bot } from "./cache.ts";
import { startBot } from "./deps.ts";
import { fileLoader, importDirectory } from "./src/utils/helpers.ts";
import { loadLanguages } from "./src/utils/i18next.ts";
import { log } from "./src/utils/logger.ts";
import   "https://deno.land/x/dotenv/load.ts";
import keepAlive from "./server.ts";
log.info("Beginning Bot Startup Process. This can take a little bit depending on your system. Loading now...");
// Forces deno to read all the files which will fill the commands/inhibitors cache etc.
await Promise.all([
    "./src/commands",
    "./src/inhibitors",
    "./src/events",
    "./src/arguments",
    "./src/monitors",
    "./src/tasks",
    "./src/permissionLevels",
    "./src/events", 
].map((path)=>importDirectory(Deno.realPathSync(path))
));
await fileLoader();
// Loads languages
await loadLanguages();
await import("./src/database/database.ts");
startBot({
    token: Deno.env.get("TOKEN"),
    // Pick the intents you wish to have for your bot.
    // For instance, to work with guild message reactions, you will have to pass the "GuildMessageReactions" intent to the array.
    intents: [
        "Guilds",
        "GuildMessages",
        "GuildVoiceStates"
    ],
    // These are all your event handler functions. Imported from the events folder
    eventHandlers: bot.eventHandlers
});
keepAlive(); // const interaction = new DiscordInteractions({
 //   applicationId: "843485383224197140",
 //   authToken: configs.token,
 //   publicKey: "85ba2076bdff89633e62c23ceeaddc24000dcf446bfcdd7d330d6e84b64a88b4",
 // });
 // await interaction
 //   .getApplicationCommands()
 //   .then(console.log)
 //   .catch(console.error);
 // const command = {
 //   name: "avatar",
 //   description: "get a users avatar",
 //   options: [
 //     {
 //       name: "big",
 //       description: "should the image be big",
 //       type: ApplicationCommandOptionType.BOOLEAN,
 //     },
 //   ],
 // };
 // const command = {
 //   name: "ponga",
 //   description: "pong",
 //   options: [
 //     {
 //       name: "echo",
 //       description: "echo this string",
 //       type: ApplicationCommandOptionType.STRING
 //     },
 //   ],
 // };
 // await interaction
 //   .createApplicationCommand(command, "843498760280604682")
 //   .then(console.log)
 //   .catch(console.error);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3QvbW9kLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBib3QgfSBmcm9tIFwiLi9jYWNoZS50c1wiO1xuaW1wb3J0IHsgY29uZmlncyB9IGZyb20gXCIuL2NvbmZpZ3MudHNcIjtcbmltcG9ydCB7IHN0YXJ0Qm90IH0gZnJvbSBcIi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgZmlsZUxvYWRlciwgaW1wb3J0RGlyZWN0b3J5IH0gZnJvbSBcIi4vc3JjL3V0aWxzL2hlbHBlcnMudHNcIjtcbmltcG9ydCB7IGxvYWRMYW5ndWFnZXMgfSBmcm9tIFwiLi9zcmMvdXRpbHMvaTE4bmV4dC50c1wiO1xuaW1wb3J0IHsgbG9nIH0gZnJvbSBcIi4vc3JjL3V0aWxzL2xvZ2dlci50c1wiO1xuaW1wb3J0IHsgY29uZmlnIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3gvZG90ZW52L21vZC50c1wiO1xuaW1wb3J0IFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9kb3RlbnYvbG9hZC50c1wiO1xuaW1wb3J0IGtlZXBBbGl2ZSBmcm9tIFwiLi9zZXJ2ZXIudHNcIjtcblxubG9nLmluZm8oXG4gIFwiQmVnaW5uaW5nIEJvdCBTdGFydHVwIFByb2Nlc3MuIFRoaXMgY2FuIHRha2UgYSBsaXR0bGUgYml0IGRlcGVuZGluZyBvbiB5b3VyIHN5c3RlbS4gTG9hZGluZyBub3cuLi5cIixcbik7XG5cbi8vIEZvcmNlcyBkZW5vIHRvIHJlYWQgYWxsIHRoZSBmaWxlcyB3aGljaCB3aWxsIGZpbGwgdGhlIGNvbW1hbmRzL2luaGliaXRvcnMgY2FjaGUgZXRjLlxuYXdhaXQgUHJvbWlzZS5hbGwoXG4gIFtcbiAgICBcIi4vc3JjL2NvbW1hbmRzXCIsXG4gICAgXCIuL3NyYy9pbmhpYml0b3JzXCIsXG4gICAgXCIuL3NyYy9ldmVudHNcIixcbiAgICBcIi4vc3JjL2FyZ3VtZW50c1wiLFxuICAgIFwiLi9zcmMvbW9uaXRvcnNcIixcbiAgICBcIi4vc3JjL3Rhc2tzXCIsXG4gICAgXCIuL3NyYy9wZXJtaXNzaW9uTGV2ZWxzXCIsXG4gICAgXCIuL3NyYy9ldmVudHNcIixcbiAgXS5tYXAoKHBhdGgpID0+IGltcG9ydERpcmVjdG9yeShEZW5vLnJlYWxQYXRoU3luYyhwYXRoKSkpLFxuKTtcbmF3YWl0IGZpbGVMb2FkZXIoKTtcblxuLy8gTG9hZHMgbGFuZ3VhZ2VzXG5hd2FpdCBsb2FkTGFuZ3VhZ2VzKCk7XG5hd2FpdCBpbXBvcnQoXCIuL3NyYy9kYXRhYmFzZS9kYXRhYmFzZS50c1wiKTtcblxuc3RhcnRCb3Qoe1xuICB0b2tlbjogRGVuby5lbnYuZ2V0KFwiVE9LRU5cIikhLFxuICAvLyBQaWNrIHRoZSBpbnRlbnRzIHlvdSB3aXNoIHRvIGhhdmUgZm9yIHlvdXIgYm90LlxuICAvLyBGb3IgaW5zdGFuY2UsIHRvIHdvcmsgd2l0aCBndWlsZCBtZXNzYWdlIHJlYWN0aW9ucywgeW91IHdpbGwgaGF2ZSB0byBwYXNzIHRoZSBcIkd1aWxkTWVzc2FnZVJlYWN0aW9uc1wiIGludGVudCB0byB0aGUgYXJyYXkuXG4gIGludGVudHM6IFtcIkd1aWxkc1wiLCBcIkd1aWxkTWVzc2FnZXNcIiwgXCJHdWlsZFZvaWNlU3RhdGVzXCJdLFxuICAvLyBUaGVzZSBhcmUgYWxsIHlvdXIgZXZlbnQgaGFuZGxlciBmdW5jdGlvbnMuIEltcG9ydGVkIGZyb20gdGhlIGV2ZW50cyBmb2xkZXJcbiAgZXZlbnRIYW5kbGVyczogYm90LmV2ZW50SGFuZGxlcnMsXG59KTtcblxua2VlcEFsaXZlKCk7XG5cbi8vIGNvbnN0IGludGVyYWN0aW9uID0gbmV3IERpc2NvcmRJbnRlcmFjdGlvbnMoe1xuLy8gICBhcHBsaWNhdGlvbklkOiBcIjg0MzQ4NTM4MzIyNDE5NzE0MFwiLFxuLy8gICBhdXRoVG9rZW46IGNvbmZpZ3MudG9rZW4sXG4vLyAgIHB1YmxpY0tleTogXCI4NWJhMjA3NmJkZmY4OTYzM2U2MmMyM2NlZWFkZGMyNDAwMGRjZjQ0NmJmY2RkN2QzMzBkNmU4NGI2NGE4OGI0XCIsXG4vLyB9KTtcblxuLy8gYXdhaXQgaW50ZXJhY3Rpb25cbi8vICAgLmdldEFwcGxpY2F0aW9uQ29tbWFuZHMoKVxuLy8gICAudGhlbihjb25zb2xlLmxvZylcbi8vICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuXG4vLyBjb25zdCBjb21tYW5kID0ge1xuLy8gICBuYW1lOiBcImF2YXRhclwiLFxuLy8gICBkZXNjcmlwdGlvbjogXCJnZXQgYSB1c2VycyBhdmF0YXJcIixcbi8vICAgb3B0aW9uczogW1xuLy8gICAgIHtcbi8vICAgICAgIG5hbWU6IFwiYmlnXCIsXG4vLyAgICAgICBkZXNjcmlwdGlvbjogXCJzaG91bGQgdGhlIGltYWdlIGJlIGJpZ1wiLFxuLy8gICAgICAgdHlwZTogQXBwbGljYXRpb25Db21tYW5kT3B0aW9uVHlwZS5CT09MRUFOLFxuLy8gICAgIH0sXG4vLyAgIF0sXG4vLyB9O1xuXG4vLyBjb25zdCBjb21tYW5kID0ge1xuLy8gICBuYW1lOiBcInBvbmdhXCIsXG4vLyAgIGRlc2NyaXB0aW9uOiBcInBvbmdcIixcbi8vICAgb3B0aW9uczogW1xuLy8gICAgIHtcbi8vICAgICAgIG5hbWU6IFwiZWNob1wiLFxuLy8gICAgICAgZGVzY3JpcHRpb246IFwiZWNobyB0aGlzIHN0cmluZ1wiLFxuLy8gICAgICAgdHlwZTogQXBwbGljYXRpb25Db21tYW5kT3B0aW9uVHlwZS5TVFJJTkdcbi8vICAgICB9LFxuLy8gICBdLFxuLy8gfTtcblxuLy8gYXdhaXQgaW50ZXJhY3Rpb25cbi8vICAgLmNyZWF0ZUFwcGxpY2F0aW9uQ29tbWFuZChjb21tYW5kLCBcIjg0MzQ5ODc2MDI4MDYwNDY4MlwiKVxuLy8gICAudGhlbihjb25zb2xlLmxvZylcbi8vICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLEdBQUcsU0FBUSxVQUFZO1NBRXZCLFFBQVEsU0FBUSxTQUFXO1NBQzNCLFVBQVUsRUFBRSxlQUFlLFNB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