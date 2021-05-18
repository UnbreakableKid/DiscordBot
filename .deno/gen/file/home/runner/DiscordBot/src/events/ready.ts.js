import { botId, cache, DiscordActivityTypes, editBotStatus, upsertSlashCommands } from "../../deps.ts";
import { Milliseconds } from "../utils/constants/time.ts";
import { translate } from "../utils/i18next.ts";
import { registerTasks } from "./../utils/task_helper.ts";
import { sweepInactiveGuildsCache } from "./dispatch_requirements.ts";
import { bot } from "../../cache.ts";
import { log } from "../utils/logger.ts";
bot.eventHandlers.ready = async function() {
    editBotStatus({
        status: "dnd",
        activities: [
            {
                name: "Discordeno Best Lib",
                type: DiscordActivityTypes.Game,
                createdAt: Date.now()
            }, 
        ]
    });
    log.info(`Loaded ${bot.arguments.size} Argument(s)`);
    log.info(`Loaded ${bot.commands.size} Command(s)`);
    log.info(`Loaded ${Object.keys(bot.eventHandlers).length} Event(s)`);
    log.info(`Loaded ${bot.inhibitors.size} Inhibitor(s)`);
    log.info(`Loaded ${bot.monitors.size} Monitor(s)`);
    log.info(`Loaded ${bot.tasks.size} Task(s)`);
    // Special task which should only run every hour AFTER STARTUP
    setInterval(sweepInactiveGuildsCache, Milliseconds.HOUR);
    registerTasks();
    await bot.lavadenoManager.init(botId.toString());
    bot.fullyReady = true;
    log.info(`[READY] Bot is online and ready in ${cache.guilds.size} guild(s)!`);
    log.info(`Preparing Slash Commands...`);
    const globalCommands = [];
    // deno-lint-ignore no-explicit-any
    const perGuildCommands = [];
    for (const command of bot.commands.values()){
        if (!command.slash?.enabled) continue;
        // THIS COMMAND NEEDS SOME SLASH COMMAND STUFF
        if (command.slash.global) globalCommands.push(command.slash);
        if (command.slash.guild) perGuildCommands.push(command);
    }
    // GLOBAL COMMANDS CAN TAKE 1 HOUR TO UPDATE IN DISCORD
    if (globalCommands.length) {
        log.info(`Updating Global Slash Commands... Any changes will take up to 1 hour to update on discord.`);
        await upsertSlashCommands(globalCommands).catch(log.info);
    }
    // GUILD COMMANDS WILL UPDATE INSTANTLY
    await Promise.all(cache.guilds.map(async (guild)=>{
        await upsertSlashCommands(perGuildCommands.map((cmd)=>{
            // USER OPTED TO USE BASIC VERSION ONLY
            if (cmd.slash?.advanced === false) {
                return {
                    name: cmd.name,
                    description: cmd.description || "No description available.",
                    options: cmd.slash?.options
                };
            }
            // ADVANCED VERSION WILL ALLOW TRANSLATION
            const name = translate(guild.id, `commands/${cmd.name}:SLASH_NAME`);
            const description = translate(guild.id, `commands/${cmd.name}:SLASH_DESCRIPTION`);
            return {
                name: name === "SLASH_NAME" ? cmd.name : name,
                description: description === "SLASH_DESCRIPTION" ? cmd.description || "No description available." : description,
                options: cmd.slash?.options?.map((option)=>{
                    const optionName = translate(guild.id, option.name);
                    const optionDescription = translate(guild.id, option.description);
                    return {
                        ...option,
                        name: optionName,
                        description: optionDescription || "No description available."
                    };
                })
            };
        }), guild.id).catch(log.warn);
        log.info(`Updated Guild ${guild.name} (${guild.id}) Slash Commands...`);
    }));
    log.info(`[READY] Slash Commands loaded successfully!`);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2V2ZW50cy9yZWFkeS50cyM3PiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBib3RJZCxcbiAgY2FjaGUsXG4gIERpc2NvcmRBY3Rpdml0eVR5cGVzLFxuICBlZGl0Qm90U3RhdHVzLFxuICB1cHNlcnRTbGFzaENvbW1hbmRzLFxufSBmcm9tIFwiLi4vLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgQ29tbWFuZCB9IGZyb20gXCIuLi90eXBlcy9jb21tYW5kcy50c1wiO1xuaW1wb3J0IHsgTWlsbGlzZWNvbmRzIH0gZnJvbSBcIi4uL3V0aWxzL2NvbnN0YW50cy90aW1lLnRzXCI7XG5pbXBvcnQgeyB0cmFuc2xhdGUgfSBmcm9tIFwiLi4vdXRpbHMvaTE4bmV4dC50c1wiO1xuaW1wb3J0IHsgcmVnaXN0ZXJUYXNrcyB9IGZyb20gXCIuLy4uL3V0aWxzL3Rhc2tfaGVscGVyLnRzXCI7XG5pbXBvcnQgeyBzd2VlcEluYWN0aXZlR3VpbGRzQ2FjaGUgfSBmcm9tIFwiLi9kaXNwYXRjaF9yZXF1aXJlbWVudHMudHNcIjtcbmltcG9ydCB7IGJvdCB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuaW1wb3J0IHsgbG9nIH0gZnJvbSBcIi4uL3V0aWxzL2xvZ2dlci50c1wiO1xuXG5ib3QuZXZlbnRIYW5kbGVycy5yZWFkeSA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgZWRpdEJvdFN0YXR1cyh7XG4gICAgc3RhdHVzOiBcImRuZFwiLFxuICAgIGFjdGl2aXRpZXM6IFtcbiAgICAgIHtcbiAgICAgICAgbmFtZTogXCJEaXNjb3JkZW5vIEJlc3QgTGliXCIsXG4gICAgICAgIHR5cGU6IERpc2NvcmRBY3Rpdml0eVR5cGVzLkdhbWUsXG4gICAgICAgIGNyZWF0ZWRBdDogRGF0ZS5ub3coKSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSk7XG5cbiAgbG9nLmluZm8oYExvYWRlZCAke2JvdC5hcmd1bWVudHMuc2l6ZX0gQXJndW1lbnQocylgKTtcbiAgbG9nLmluZm8oYExvYWRlZCAke2JvdC5jb21tYW5kcy5zaXplfSBDb21tYW5kKHMpYCk7XG4gIGxvZy5pbmZvKGBMb2FkZWQgJHtPYmplY3Qua2V5cyhib3QuZXZlbnRIYW5kbGVycykubGVuZ3RofSBFdmVudChzKWApO1xuICBsb2cuaW5mbyhgTG9hZGVkICR7Ym90LmluaGliaXRvcnMuc2l6ZX0gSW5oaWJpdG9yKHMpYCk7XG4gIGxvZy5pbmZvKGBMb2FkZWQgJHtib3QubW9uaXRvcnMuc2l6ZX0gTW9uaXRvcihzKWApO1xuICBsb2cuaW5mbyhgTG9hZGVkICR7Ym90LnRhc2tzLnNpemV9IFRhc2socylgKTtcblxuICAvLyBTcGVjaWFsIHRhc2sgd2hpY2ggc2hvdWxkIG9ubHkgcnVuIGV2ZXJ5IGhvdXIgQUZURVIgU1RBUlRVUFxuICBzZXRJbnRlcnZhbChzd2VlcEluYWN0aXZlR3VpbGRzQ2FjaGUsIE1pbGxpc2Vjb25kcy5IT1VSKTtcblxuICByZWdpc3RlclRhc2tzKCk7XG5cbiAgYXdhaXQgYm90LmxhdmFkZW5vTWFuYWdlci5pbml0KGJvdElkLnRvU3RyaW5nKCkpO1xuXG4gIGJvdC5mdWxseVJlYWR5ID0gdHJ1ZTtcblxuICBsb2cuaW5mbyhgW1JFQURZXSBCb3QgaXMgb25saW5lIGFuZCByZWFkeSBpbiAke2NhY2hlLmd1aWxkcy5zaXplfSBndWlsZChzKSFgKTtcblxuICBsb2cuaW5mbyhgUHJlcGFyaW5nIFNsYXNoIENvbW1hbmRzLi4uYCk7XG5cbiAgY29uc3QgZ2xvYmFsQ29tbWFuZHMgPSBbXTtcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgY29uc3QgcGVyR3VpbGRDb21tYW5kczogQ29tbWFuZDxhbnk+W10gPSBbXTtcblxuICBmb3IgKGNvbnN0IGNvbW1hbmQgb2YgYm90LmNvbW1hbmRzLnZhbHVlcygpKSB7XG4gICAgaWYgKCFjb21tYW5kLnNsYXNoPy5lbmFibGVkKSBjb250aW51ZTtcblxuICAgIC8vIFRISVMgQ09NTUFORCBORUVEUyBTT01FIFNMQVNIIENPTU1BTkQgU1RVRkZcbiAgICBpZiAoY29tbWFuZC5zbGFzaC5nbG9iYWwpIGdsb2JhbENvbW1hbmRzLnB1c2goY29tbWFuZC5zbGFzaCk7XG4gICAgaWYgKGNvbW1hbmQuc2xhc2guZ3VpbGQpIHBlckd1aWxkQ29tbWFuZHMucHVzaChjb21tYW5kKTtcbiAgfVxuXG4gIC8vIEdMT0JBTCBDT01NQU5EUyBDQU4gVEFLRSAxIEhPVVIgVE8gVVBEQVRFIElOIERJU0NPUkRcbiAgaWYgKGdsb2JhbENvbW1hbmRzLmxlbmd0aCkge1xuICAgIGxvZy5pbmZvKFxuICAgICAgYFVwZGF0aW5nIEdsb2JhbCBTbGFzaCBDb21tYW5kcy4uLiBBbnkgY2hhbmdlcyB3aWxsIHRha2UgdXAgdG8gMSBob3VyIHRvIHVwZGF0ZSBvbiBkaXNjb3JkLmAsXG4gICAgKTtcbiAgICBhd2FpdCB1cHNlcnRTbGFzaENvbW1hbmRzKGdsb2JhbENvbW1hbmRzKS5jYXRjaChsb2cuaW5mbyk7XG4gIH1cblxuICAvLyBHVUlMRCBDT01NQU5EUyBXSUxMIFVQREFURSBJTlNUQU5UTFlcbiAgYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgY2FjaGUuZ3VpbGRzLm1hcChhc3luYyAoZ3VpbGQpID0+IHtcbiAgICAgIGF3YWl0IHVwc2VydFNsYXNoQ29tbWFuZHMoXG4gICAgICAgIHBlckd1aWxkQ29tbWFuZHMubWFwKChjbWQpID0+IHtcbiAgICAgICAgICAvLyBVU0VSIE9QVEVEIFRPIFVTRSBCQVNJQyBWRVJTSU9OIE9OTFlcbiAgICAgICAgICBpZiAoY21kLnNsYXNoPy5hZHZhbmNlZCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIG5hbWU6IGNtZC5uYW1lLFxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogY21kLmRlc2NyaXB0aW9uIHx8IFwiTm8gZGVzY3JpcHRpb24gYXZhaWxhYmxlLlwiLFxuICAgICAgICAgICAgICBvcHRpb25zOiBjbWQuc2xhc2g/Lm9wdGlvbnMsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEFEVkFOQ0VEIFZFUlNJT04gV0lMTCBBTExPVyBUUkFOU0xBVElPTlxuICAgICAgICAgIGNvbnN0IG5hbWUgPSB0cmFuc2xhdGUoZ3VpbGQuaWQsIGBjb21tYW5kcy8ke2NtZC5uYW1lfTpTTEFTSF9OQU1FYCk7XG4gICAgICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSB0cmFuc2xhdGUoXG4gICAgICAgICAgICBndWlsZC5pZCxcbiAgICAgICAgICAgIGBjb21tYW5kcy8ke2NtZC5uYW1lfTpTTEFTSF9ERVNDUklQVElPTmAsXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuYW1lOiBuYW1lID09PSBcIlNMQVNIX05BTUVcIiA/IGNtZC5uYW1lIDogbmFtZSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbiA9PT0gXCJTTEFTSF9ERVNDUklQVElPTlwiXG4gICAgICAgICAgICAgID8gY21kLmRlc2NyaXB0aW9uIHx8IFwiTm8gZGVzY3JpcHRpb24gYXZhaWxhYmxlLlwiXG4gICAgICAgICAgICAgIDogZGVzY3JpcHRpb24sXG4gICAgICAgICAgICBvcHRpb25zOiBjbWQuc2xhc2g/Lm9wdGlvbnM/Lm1hcCgob3B0aW9uKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IG9wdGlvbk5hbWUgPSB0cmFuc2xhdGUoZ3VpbGQuaWQsIG9wdGlvbi5uYW1lKTtcbiAgICAgICAgICAgICAgY29uc3Qgb3B0aW9uRGVzY3JpcHRpb24gPSB0cmFuc2xhdGUoZ3VpbGQuaWQsIG9wdGlvbi5kZXNjcmlwdGlvbik7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAuLi5vcHRpb24sXG4gICAgICAgICAgICAgICAgbmFtZTogb3B0aW9uTmFtZSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogb3B0aW9uRGVzY3JpcHRpb24gfHwgXCJObyBkZXNjcmlwdGlvbiBhdmFpbGFibGUuXCIsXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICB9O1xuICAgICAgICB9KSxcbiAgICAgICAgZ3VpbGQuaWQsXG4gICAgICApLmNhdGNoKGxvZy53YXJuKTtcbiAgICAgIGxvZy5pbmZvKGBVcGRhdGVkIEd1aWxkICR7Z3VpbGQubmFtZX0gKCR7Z3VpbGQuaWR9KSBTbGFzaCBDb21tYW5kcy4uLmApO1xuICAgIH0pLFxuICApO1xuXG4gIGxvZy5pbmZvKGBbUkVBRFldIFNsYXNoIENvbW1hbmRzIGxvYWRlZCBzdWNjZXNzZnVsbHkhYCk7XG59O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUNFLEtBQUssRUFDTCxLQUFLLEVBQ0wsb0JBQW9CLEVBQ3BCLGFBQWEsRUFDYixtQkFBbUIsU0FDZCxhQUFlO1NBRWIsWUFBWSxTQUFRLDBCQUE0QjtTQUNoRCxTQUFTLFNBQVEsbUJBQXFCO1NBQ3RDLGFBQWEsU0FBUSx5QkFBMkI7U0FDaEQsd0JBQXdCLFNBQVEsMEJBQTRCO1NBQzVELEdBQUcsU0FBUSxjQUFnQjtTQUMzQixHQUFHLFNBQVEsa0JBQW9CO0FBRXhDLEdBQUcsQ0FBQyxhQUFhLENBQUMsS0FBSztJQUNyQixhQUFhO1FBQ1gsTUFBTSxHQUFFLEdBQUs7UUFDYixVQUFVOztnQkFFTixJQUFJLEdBQUUsbUJBQXFCO2dCQUMzQixJQUFJLEVBQUUsb0JBQW9CLENBQUMsSUFBSTtnQkFDL0IsU0FBUyxFQUFFLElBQUksQ0FBQyxHQUFHOzs7O0lBS3pCLEdBQUcsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVk7SUFDbEQsR0FBRyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVztJQUNoRCxHQUFHLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxNQUFNLENB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