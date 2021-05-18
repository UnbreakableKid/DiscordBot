import { bot } from "../../cache.ts";
import { cache, Collection, deleteMessage, deleteMessages, DiscordButtonStyles, DiscordMessageComponentTypes, editMessage, editWebhookMessage, fetchMembers, getMember, removeReaction, sendInteractionResponse, sendMessage, snowflakeToBigint, ws } from "../../deps.ts";
import { needButton, needMessage, needReaction } from "./collectors.ts";
import { Milliseconds } from "./constants/time.ts";
import { log } from "./logger.ts";
/** This function should be used when you want to convert milliseconds to a human readable format like 1d5h. */ export function humanizeMilliseconds(milliseconds) {
    // Gets ms into seconds
    const time = milliseconds / 1000;
    if (time < 1) return "1s";
    const days = Math.floor(time / 86400);
    const hours = Math.floor(time % 86400 / 3600);
    const minutes = Math.floor(time % 86400 % 3600 / 60);
    const seconds = Math.floor(time % 86400 % 3600 % 60);
    const dayString = days ? `${days}d ` : "";
    const hourString = hours ? `${hours}h ` : "";
    const minuteString = minutes ? `${minutes}m ` : "";
    const secondString = seconds ? `${seconds}s ` : "";
    return `${dayString}${hourString}${minuteString}${secondString}`;
}
/** This function helps convert a string like 1d5h to milliseconds. */ export function stringToMilliseconds(text) {
    const matches = text.match(/(\d+[w|d|h|m|s]{1})/g);
    if (!matches) return;
    let total = 0;
    for (const match of matches){
        // Finds the first of these letters
        const validMatch = /(w|d|h|m|s)/.exec(match);
        // if none of them were found cancel
        if (!validMatch) return;
        // Get the number which should be before the index of that match
        const number = match.substring(0, validMatch.index);
        // Get the letter that was found
        const [letter] = validMatch;
        if (!number || !letter) return;
        let multiplier = Milliseconds.SECOND;
        switch(letter.toLowerCase()){
            case `w`:
                multiplier = Milliseconds.WEEK;
                break;
            case `d`:
                multiplier = Milliseconds.DAY;
                break;
            case `h`:
                multiplier = Milliseconds.HOUR;
                break;
            case `m`:
                multiplier = Milliseconds.MINUTE;
                break;
        }
        const amount = number ? parseInt(number, 10) : undefined;
        if (!amount) return;
        total += amount * multiplier;
    }
    return total;
}
export function createCommand(command) {
    command.botChannelPermissions = [
        "ADD_REACTIONS",
        "USE_EXTERNAL_EMOJIS",
        "READ_MESSAGE_HISTORY",
        "VIEW_CHANNEL",
        "SEND_MESSAGES",
        "EMBED_LINKS",
        ...command.botChannelPermissions ?? [], 
    ], bot.commands.set(command.name, command);
}
export function createSubcommand(commandName, subcommand, retries = 0) {
    const names = commandName.split("-");
    let command = bot.commands.get(commandName);
    if (names.length > 1) {
        for (const name of names){
            const validCommand = command ? command.subcommands?.get(name) : bot.commands.get(name);
            if (!validCommand) {
                if (retries === 20) break;
                setTimeout(()=>createSubcommand(commandName, subcommand, retries++)
                , Milliseconds.SECOND * 10);
                return;
            }
            command = validCommand;
        }
    }
    if (!command) {
        // If 10 minutes have passed something must have been wrong
        if (retries === 20) {
            return log.warn(`Subcommand ${subcommand} unable to be created for ${commandName}`);
        }
        // Try again in 10 seconds in case this command file just has not been loaded yet.
        setTimeout(()=>createSubcommand(commandName, subcommand, retries++)
        , Milliseconds.SECOND * 10);
        return;
    }
    if (!command.subcommands) {
        command.subcommands = new Collection();
    }
    // log.debug("Creating subcommand", command.name, subcommand.name);
    command.subcommands.set(subcommand.name, subcommand);
}
// export function createSubcommand(
//   commandName: string,
//   subcommand: Command,
//   retries = 0,
// ) {
//   const names = commandName.split("-");
//   let command = bot.commands.get(commandName);
//   if (names.length > 1) {
//     for (const name of names) {
//       const validCommand = command
//         ? command.subcommands?.get(name)
//         : bot.commands.get(name);
//       if (!validCommand) break;
//       command = validCommand;
//     }
//   }
//   if (!command) {
//     // If 10 minutes have passed something must have been wrong
//     if (retries === 600) {
//       return log.error(
//         `Subcommand ${subcommand} unable to be created for ${commandName}`,
//       );
//     }
//     // Try again in 3 seconds in case this command file just has not been loaded yet.
//     setTimeout(
//       () => createSubcommand(commandName, subcommand, retries++),
//       1000,
//     );
//     return;
//   }
//   if (!command.subcommands) {
//     command.subcommands = new Collection();
//   }
//   command.subcommands.set(subcommand.name, subcommand);
// }
/** Use this function to send an embed with ease. */ export function sendEmbed(channelId, embed, content) {
    return sendMessage(channelId, {
        content,
        embed
    });
}
/** Use this function to edit an embed with ease. */ export function editEmbed(message, embed, content) {
    return editMessage(message, {
        content,
        embed
    });
}
// Very important to make sure files are reloaded properly
let uniqueFilePathCounter = 0;
let paths = [];
/** This function allows reading all files in a folder. Useful for loading/reloading commands, monitors etc */ export async function importDirectory(path) {
    path = path.replaceAll("\\", "/");
    const files = Deno.readDirSync(Deno.realPathSync(path));
    const folder = path.substring(path.indexOf("/src/") + 5);
    if (!folder.includes("/")) log.info(`Loading ${folder}...`);
    for (const file of files){
        if (!file.name) continue;
        const currentPath = `${path}/${file.name}`;
        if (file.isFile) {
            if (!currentPath.endsWith(".ts")) continue;
            paths.push(`import "${Deno.mainModule.substring(0, Deno.mainModule.lastIndexOf("/"))}/${currentPath.substring(currentPath.indexOf("src/"))}#${uniqueFilePathCounter}";`);
            continue;
        }
        await importDirectory(currentPath);
    }
    uniqueFilePathCounter++;
}
/** Imports all everything in fileloader.ts */ export async function fileLoader() {
    await Deno.writeTextFile("fileloader.ts", paths.join("\n").replaceAll("\\", "/"));
    await import(`${Deno.mainModule.substring(0, Deno.mainModule.lastIndexOf("/"))}/fileloader.ts#${uniqueFilePathCounter}`);
    paths = [];
}
export function getTime() {
    const now = new Date();
    const hours = now.getHours();
    const minute = now.getMinutes();
    let hour = hours;
    let amOrPm = `AM`;
    if (hour > 12) {
        amOrPm = `PM`;
        hour = hour - 12;
    }
    return `${hour >= 10 ? hour : `0${hour}`}:${minute >= 10 ? minute : `0${minute}`} ${amOrPm}`;
}
export function getCurrentLanguage(guildId) {
    return bot.guildLanguages.get(guildId) || cache.guilds.get(guildId)?.preferredLocale || "en_US";
}
/** This function allows to create a pagination using embeds and reactions Requires GUILD_MESSAGE_REACTIONS intent **/ export async function createEmbedsPagination(channelId, authorId, embeds, defaultPage = 1, reactionTimeout = Milliseconds.SECOND * 30, reactions = {
    // deno-lint-ignore require-await
    "◀️": async (setPage, currentPage)=>setPage(Math.max(currentPage - 1, 1))
    ,
    "↗️": async (setPage)=>{
        const question = await sendMessage(channelId, "To what page would you like to jump? Say `cancel` or `0` to cancel the prompt.");
        const answer = await needMessage(authorId, channelId);
        await deleteMessages(channelId, [
            question.id,
            answer.id
        ]).catch(log.error);
        const newPageNumber = Math.ceil(Number(answer.content));
        if (isNaN(newPageNumber)) {
            return await sendMessage(channelId, "This is not a valid number!");
        }
        if (newPageNumber < 1 || newPageNumber > embeds.length) {
            return await sendMessage(channelId, `This is not a valid page!`);
        }
        setPage(newPageNumber);
    },
    // deno-lint-ignore require-await
    "▶️": async (setPage, currentPage, pageCount)=>setPage(Math.min(currentPage + 1, pageCount))
    ,
    // deno-lint-ignore require-await
    "🗑️": async (_setPage, _currentPage, _pageCount, deletePagination)=>deletePagination()
}) {
    if (embeds.length === 0) return;
    let currentPage = defaultPage;
    const embedMessage = await sendEmbed(channelId, embeds[currentPage - 1]);
    if (!embedMessage) return;
    if (embeds.length <= 1) return;
    await embedMessage.addReactions(Object.keys(reactions), true).catch(log.error);
    let isEnded = false;
    while(!isEnded){
        if (!embedMessage) return;
        const reaction = await needReaction(authorId, embedMessage.id, {
            duration: reactionTimeout
        });
        if (!reaction) return;
        if (embedMessage.guildId) {
            await removeReaction(embedMessage.channelId, embedMessage.id, reaction, {
                userId: authorId
            }).catch(log.error);
        }
        if (reactions[reaction]) {
            await reactions[reaction]((newPage)=>{
                currentPage = newPage;
            }, currentPage, embeds.length, async ()=>{
                isEnded = true;
                await embedMessage.delete().catch(log.error);
            });
        }
        if (isEnded || !embedMessage || !await editEmbed(embedMessage, embeds[currentPage - 1]).catch(log.error)) {
            return;
        }
    }
}
/** This function allows to create a pagination using embeds and buttons. **/ export async function createEmbedsButtonsPagination(messageId, channelId, authorId, embeds, defaultPage = 1, buttonTimeout = Milliseconds.SECOND * 30) {
    if (embeds.length === 0) return;
    let currentPage = defaultPage;
    const createComponents = ()=>[
            {
                type: DiscordMessageComponentTypes.ActionRow,
                components: [
                    {
                        type: DiscordMessageComponentTypes.Button,
                        label: "Previous",
                        customId: `${messageId}-Previous`,
                        style: DiscordButtonStyles.Primary,
                        disabled: currentPage === 1,
                        emoji: {
                            name: "⬅️"
                        }
                    },
                    {
                        type: DiscordMessageComponentTypes.Button,
                        label: "Jump",
                        customId: `${messageId}-Jump`,
                        style: DiscordButtonStyles.Primary,
                        disabled: embeds.length <= 2,
                        emoji: {
                            name: "↗️"
                        }
                    },
                    {
                        type: DiscordMessageComponentTypes.Button,
                        label: "Next",
                        customId: `${messageId}-Next`,
                        style: DiscordButtonStyles.Primary,
                        disabled: currentPage >= embeds.length,
                        emoji: {
                            name: "➡️"
                        }
                    },
                    {
                        type: DiscordMessageComponentTypes.Button,
                        label: "Delete",
                        customId: `${messageId}-Delete`,
                        style: DiscordButtonStyles.Danger,
                        emoji: {
                            name: "🗑️"
                        }
                    }, 
                ]
            }, 
        ]
    ;
    const embedMessage = await sendMessage(channelId, {
        embed: embeds[currentPage - 1],
        components: createComponents()
    });
    if (!embedMessage) return;
    if (embeds.length <= 1) return;
    let isEnded = false;
    while(!isEnded){
        if (!embedMessage) {
            isEnded = true;
            break;
        }
        const collectedButton = await needButton(authorId, embedMessage.channelId, {
            duration: buttonTimeout
        });
        console.log(collectedButton);
        if (!collectedButton || !collectedButton.customId.startsWith(messageId.toString())) {
            return;
        }
        const action = collectedButton.customId.split("-")[1];
        switch(action){
            case "Next":
                currentPage += 1;
                break;
            // deno-lint-ignore no-case-declarations
            case "Jump":
                await sendInteractionResponse(snowflakeToBigint(collectedButton.interaction.id), collectedButton.interaction.token, {
                    type: 6
                });
                const question = await sendMessage(channelId, "To what page would you like to jump? Say `cancel` or `0` to cancel the prompt.");
                const answer = await needMessage(authorId, channelId);
                await deleteMessages(channelId, [
                    question.id,
                    answer.id
                ]).catch(log.error);
                const newPageNumber = Math.ceil(Number(answer.content));
                if (isNaN(newPageNumber) || newPageNumber < 1 || newPageNumber > embeds.length) {
                    await sendMessage(channelId, "This is not a valid number!");
                    continue;
                }
                currentPage = newPageNumber;
                editWebhookMessage(snowflakeToBigint(collectedButton.interaction.applicationId), collectedButton.interaction.token, {
                    messageId: embedMessage.id,
                    embeds: [
                        embeds[currentPage - 1]
                    ],
                    components: createComponents()
                });
                continue;
            case "Previous":
                currentPage -= 1;
                break;
            case "Delete":
                deleteMessage(channelId, embedMessage.id);
                isEnded = true;
                break;
        }
        if (isEnded || !embedMessage || !await sendInteractionResponse(snowflakeToBigint(collectedButton.interaction.id), collectedButton.interaction.token, {
            type: 7,
            data: {
                embeds: [
                    embeds[currentPage - 1]
                ],
                components: createComponents()
            }
        }).catch(log.error)) {
            return;
        }
    }
}
export function emojiUnicode(emoji) {
    return emoji.animated || emoji.id ? `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>` : emoji.name || "";
}
export async function fetchMember(guildId, id) {
    const userId = typeof id === "string" ? id.startsWith("<@") ? BigInt(id.substring(id.startsWith("<@!") ? 3 : 2, id.length - 1)) : BigInt(id) : id;
    const guild = cache.guilds.get(guildId);
    if (!guild) return;
    const cachedMember = cache.members.get(userId);
    if (cachedMember) return cachedMember;
    const shardId = calculateShardId(guildId);
    const shard = ws.shards.get(shardId);
    // When gateway is dying
    if (shard?.queueCounter && shard.queueCounter > 110) {
        return getMember(guildId, userId).catch(()=>undefined
        );
    }
    // Fetch from gateway as it is much better than wasting limited HTTP calls.
    const member = await fetchMembers(guildId, shardId, {
        userIds: [
            userId
        ],
        limit: 1
    }).catch(()=>undefined
    );
    return member?.first();
}
export function calculateShardId(guildId) {
    if (ws.maxShards === 1) return 0;
    return Number((guildId >> 22n) % BigInt(ws.maxShards - 1));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL3V0aWxzL2hlbHBlcnMudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvdCB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuaW1wb3J0IHtcbiAgY2FjaGUsXG4gIENvbGxlY3Rpb24sXG4gIGRlbGV0ZU1lc3NhZ2UsXG4gIGRlbGV0ZU1lc3NhZ2VzLFxuICBEaXNjb3JkQnV0dG9uU3R5bGVzLFxuICBEaXNjb3JkZW5vTWVzc2FnZSxcbiAgRGlzY29yZE1lc3NhZ2VDb21wb25lbnRUeXBlcyxcbiAgZWRpdE1lc3NhZ2UsXG4gIGVkaXRXZWJob29rTWVzc2FnZSxcbiAgRW1vamksXG4gIGZldGNoTWVtYmVycyxcbiAgZ2V0TWVtYmVyLFxuICBNZXNzYWdlQ29tcG9uZW50cyxcbiAgcmVtb3ZlUmVhY3Rpb24sXG4gIHNlbmRJbnRlcmFjdGlvblJlc3BvbnNlLFxuICBzZW5kTWVzc2FnZSxcbiAgc25vd2ZsYWtlVG9CaWdpbnQsXG4gIHdzLFxufSBmcm9tIFwiLi4vLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgQXJndW1lbnREZWZpbml0aW9uLCBDb21tYW5kIH0gZnJvbSBcIi4uL3R5cGVzL2NvbW1hbmRzLnRzXCI7XG5pbXBvcnQgeyBuZWVkQnV0dG9uLCBuZWVkTWVzc2FnZSwgbmVlZFJlYWN0aW9uIH0gZnJvbSBcIi4vY29sbGVjdG9ycy50c1wiO1xuaW1wb3J0IHsgTWlsbGlzZWNvbmRzIH0gZnJvbSBcIi4vY29uc3RhbnRzL3RpbWUudHNcIjtcbmltcG9ydCB7IEVtYmVkIH0gZnJvbSBcIi4vRW1iZWQudHNcIjtcbmltcG9ydCB7IGxvZyB9IGZyb20gXCIuL2xvZ2dlci50c1wiO1xuXG4vKiogVGhpcyBmdW5jdGlvbiBzaG91bGQgYmUgdXNlZCB3aGVuIHlvdSB3YW50IHRvIGNvbnZlcnQgbWlsbGlzZWNvbmRzIHRvIGEgaHVtYW4gcmVhZGFibGUgZm9ybWF0IGxpa2UgMWQ1aC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBodW1hbml6ZU1pbGxpc2Vjb25kcyhtaWxsaXNlY29uZHM6IG51bWJlcikge1xuICAvLyBHZXRzIG1zIGludG8gc2Vjb25kc1xuICBjb25zdCB0aW1lID0gbWlsbGlzZWNvbmRzIC8gMTAwMDtcbiAgaWYgKHRpbWUgPCAxKSByZXR1cm4gXCIxc1wiO1xuXG4gIGNvbnN0IGRheXMgPSBNYXRoLmZsb29yKHRpbWUgLyA4NjQwMCk7XG4gIGNvbnN0IGhvdXJzID0gTWF0aC5mbG9vcigodGltZSAlIDg2NDAwKSAvIDM2MDApO1xuICBjb25zdCBtaW51dGVzID0gTWF0aC5mbG9vcigoKHRpbWUgJSA4NjQwMCkgJSAzNjAwKSAvIDYwKTtcbiAgY29uc3Qgc2Vjb25kcyA9IE1hdGguZmxvb3IoKCh0aW1lICUgODY0MDApICUgMzYwMCkgJSA2MCk7XG5cbiAgY29uc3QgZGF5U3RyaW5nID0gZGF5cyA/IGAke2RheXN9ZCBgIDogXCJcIjtcbiAgY29uc3QgaG91clN0cmluZyA9IGhvdXJzID8gYCR7aG91cnN9aCBgIDogXCJcIjtcbiAgY29uc3QgbWludXRlU3RyaW5nID0gbWludXRlcyA/IGAke21pbnV0ZXN9bSBgIDogXCJcIjtcbiAgY29uc3Qgc2Vjb25kU3RyaW5nID0gc2Vjb25kcyA/IGAke3NlY29uZHN9cyBgIDogXCJcIjtcblxuICByZXR1cm4gYCR7ZGF5U3RyaW5nfSR7aG91clN0cmluZ30ke21pbnV0ZVN0cmluZ30ke3NlY29uZFN0cmluZ31gO1xufVxuXG4vKiogVGhpcyBmdW5jdGlvbiBoZWxwcyBjb252ZXJ0IGEgc3RyaW5nIGxpa2UgMWQ1aCB0byBtaWxsaXNlY29uZHMuICovXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9NaWxsaXNlY29uZHModGV4dDogc3RyaW5nKSB7XG4gIGNvbnN0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKC8oXFxkK1t3fGR8aHxtfHNdezF9KS9nKTtcbiAgaWYgKCFtYXRjaGVzKSByZXR1cm47XG5cbiAgbGV0IHRvdGFsID0gMDtcblxuICBmb3IgKGNvbnN0IG1hdGNoIG9mIG1hdGNoZXMpIHtcbiAgICAvLyBGaW5kcyB0aGUgZmlyc3Qgb2YgdGhlc2UgbGV0dGVyc1xuICAgIGNvbnN0IHZhbGlkTWF0Y2ggPSAvKHd8ZHxofG18cykvLmV4ZWMobWF0Y2gpO1xuICAgIC8vIGlmIG5vbmUgb2YgdGhlbSB3ZXJlIGZvdW5kIGNhbmNlbFxuICAgIGlmICghdmFsaWRNYXRjaCkgcmV0dXJuO1xuICAgIC8vIEdldCB0aGUgbnVtYmVyIHdoaWNoIHNob3VsZCBiZSBiZWZvcmUgdGhlIGluZGV4IG9mIHRoYXQgbWF0Y2hcbiAgICBjb25zdCBudW1iZXIgPSBtYXRjaC5zdWJzdHJpbmcoMCwgdmFsaWRNYXRjaC5pbmRleCk7XG4gICAgLy8gR2V0IHRoZSBsZXR0ZXIgdGhhdCB3YXMgZm91bmRcbiAgICBjb25zdCBbbGV0dGVyXSA9IHZhbGlkTWF0Y2g7XG4gICAgaWYgKCFudW1iZXIgfHwgIWxldHRlcikgcmV0dXJuO1xuXG4gICAgbGV0IG11bHRpcGxpZXIgPSBNaWxsaXNlY29uZHMuU0VDT05EO1xuICAgIHN3aXRjaCAobGV0dGVyLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgIGNhc2UgYHdgOlxuICAgICAgICBtdWx0aXBsaWVyID0gTWlsbGlzZWNvbmRzLldFRUs7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBgZGA6XG4gICAgICAgIG11bHRpcGxpZXIgPSBNaWxsaXNlY29uZHMuREFZO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgYGhgOlxuICAgICAgICBtdWx0aXBsaWVyID0gTWlsbGlzZWNvbmRzLkhPVVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBgbWA6XG4gICAgICAgIG11bHRpcGxpZXIgPSBNaWxsaXNlY29uZHMuTUlOVVRFO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjb25zdCBhbW91bnQgPSBudW1iZXIgPyBwYXJzZUludChudW1iZXIsIDEwKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAoIWFtb3VudCkgcmV0dXJuO1xuXG4gICAgdG90YWwgKz0gYW1vdW50ICogbXVsdGlwbGllcjtcbiAgfVxuXG4gIHJldHVybiB0b3RhbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbW1hbmQ8VCBleHRlbmRzIHJlYWRvbmx5IEFyZ3VtZW50RGVmaW5pdGlvbltdPihcbiAgY29tbWFuZDogQ29tbWFuZDxUPixcbikge1xuICAoY29tbWFuZC5ib3RDaGFubmVsUGVybWlzc2lvbnMgPSBbXG4gICAgXCJBRERfUkVBQ1RJT05TXCIsXG4gICAgXCJVU0VfRVhURVJOQUxfRU1PSklTXCIsXG4gICAgXCJSRUFEX01FU1NBR0VfSElTVE9SWVwiLFxuICAgIFwiVklFV19DSEFOTkVMXCIsXG4gICAgXCJTRU5EX01FU1NBR0VTXCIsXG4gICAgXCJFTUJFRF9MSU5LU1wiLFxuICAgIC4uLihjb21tYW5kLmJvdENoYW5uZWxQZXJtaXNzaW9ucyA/PyBbXSksXG4gIF0pLCBib3QuY29tbWFuZHMuc2V0KGNvbW1hbmQubmFtZSwgY29tbWFuZCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTdWJjb21tYW5kPFQgZXh0ZW5kcyByZWFkb25seSBBcmd1bWVudERlZmluaXRpb25bXT4oXG4gIGNvbW1hbmROYW1lOiBzdHJpbmcsXG4gIHN1YmNvbW1hbmQ6IENvbW1hbmQ8VD4sXG4gIHJldHJpZXMgPSAwLFxuKSB7XG4gIGNvbnN0IG5hbWVzID0gY29tbWFuZE5hbWUuc3BsaXQoXCItXCIpO1xuXG4gIGxldCBjb21tYW5kOiBDb21tYW5kPFQ+ID0gYm90LmNvbW1hbmRzLmdldChjb21tYW5kTmFtZSkhO1xuXG4gIGlmIChuYW1lcy5sZW5ndGggPiAxKSB7XG4gICAgZm9yIChjb25zdCBuYW1lIG9mIG5hbWVzKSB7XG4gICAgICBjb25zdCB2YWxpZENvbW1hbmQgPSBjb21tYW5kXG4gICAgICAgID8gY29tbWFuZC5zdWJjb21tYW5kcz8uZ2V0KG5hbWUpXG4gICAgICAgIDogYm90LmNvbW1hbmRzLmdldChuYW1lKTtcblxuICAgICAgaWYgKCF2YWxpZENvbW1hbmQpIHtcbiAgICAgICAgaWYgKHJldHJpZXMgPT09IDIwKSBicmVhaztcbiAgICAgICAgc2V0VGltZW91dChcbiAgICAgICAgICAoKSA9PiBjcmVhdGVTdWJjb21tYW5kKGNvbW1hbmROYW1lLCBzdWJjb21tYW5kLCByZXRyaWVzKyspLFxuICAgICAgICAgIE1pbGxpc2Vjb25kcy5TRUNPTkQgKiAxMCxcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb21tYW5kID0gdmFsaWRDb21tYW5kO1xuICAgIH1cbiAgfVxuXG4gIGlmICghY29tbWFuZCkge1xuICAgIC8vIElmIDEwIG1pbnV0ZXMgaGF2ZSBwYXNzZWQgc29tZXRoaW5nIG11c3QgaGF2ZSBiZWVuIHdyb25nXG4gICAgaWYgKHJldHJpZXMgPT09IDIwKSB7XG4gICAgICByZXR1cm4gbG9nLndhcm4oXG4gICAgICAgIGBTdWJjb21tYW5kICR7c3ViY29tbWFuZH0gdW5hYmxlIHRvIGJlIGNyZWF0ZWQgZm9yICR7Y29tbWFuZE5hbWV9YCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gVHJ5IGFnYWluIGluIDEwIHNlY29uZHMgaW4gY2FzZSB0aGlzIGNvbW1hbmQgZmlsZSBqdXN0IGhhcyBub3QgYmVlbiBsb2FkZWQgeWV0LlxuICAgIHNldFRpbWVvdXQoXG4gICAgICAoKSA9PiBjcmVhdGVTdWJjb21tYW5kKGNvbW1hbmROYW1lLCBzdWJjb21tYW5kLCByZXRyaWVzKyspLFxuICAgICAgTWlsbGlzZWNvbmRzLlNFQ09ORCAqIDEwLFxuICAgICk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKCFjb21tYW5kLnN1YmNvbW1hbmRzKSB7XG4gICAgY29tbWFuZC5zdWJjb21tYW5kcyA9IG5ldyBDb2xsZWN0aW9uKCk7XG4gIH1cblxuICAvLyBsb2cuZGVidWcoXCJDcmVhdGluZyBzdWJjb21tYW5kXCIsIGNvbW1hbmQubmFtZSwgc3ViY29tbWFuZC5uYW1lKTtcbiAgY29tbWFuZC5zdWJjb21tYW5kcy5zZXQoc3ViY29tbWFuZC5uYW1lLCBzdWJjb21tYW5kKTtcbn1cblxuLy8gZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVN1YmNvbW1hbmQoXG4vLyAgIGNvbW1hbmROYW1lOiBzdHJpbmcsXG4vLyAgIHN1YmNvbW1hbmQ6IENvbW1hbmQsXG4vLyAgIHJldHJpZXMgPSAwLFxuLy8gKSB7XG4vLyAgIGNvbnN0IG5hbWVzID0gY29tbWFuZE5hbWUuc3BsaXQoXCItXCIpO1xuXG4vLyAgIGxldCBjb21tYW5kID0gYm90LmNvbW1hbmRzLmdldChjb21tYW5kTmFtZSk7XG5cbi8vICAgaWYgKG5hbWVzLmxlbmd0aCA+IDEpIHtcbi8vICAgICBmb3IgKGNvbnN0IG5hbWUgb2YgbmFtZXMpIHtcbi8vICAgICAgIGNvbnN0IHZhbGlkQ29tbWFuZCA9IGNvbW1hbmRcbi8vICAgICAgICAgPyBjb21tYW5kLnN1YmNvbW1hbmRzPy5nZXQobmFtZSlcbi8vICAgICAgICAgOiBib3QuY29tbWFuZHMuZ2V0KG5hbWUpO1xuLy8gICAgICAgaWYgKCF2YWxpZENvbW1hbmQpIGJyZWFrO1xuXG4vLyAgICAgICBjb21tYW5kID0gdmFsaWRDb21tYW5kO1xuLy8gICAgIH1cbi8vICAgfVxuXG4vLyAgIGlmICghY29tbWFuZCkge1xuLy8gICAgIC8vIElmIDEwIG1pbnV0ZXMgaGF2ZSBwYXNzZWQgc29tZXRoaW5nIG11c3QgaGF2ZSBiZWVuIHdyb25nXG4vLyAgICAgaWYgKHJldHJpZXMgPT09IDYwMCkge1xuLy8gICAgICAgcmV0dXJuIGxvZy5lcnJvcihcbi8vICAgICAgICAgYFN1YmNvbW1hbmQgJHtzdWJjb21tYW5kfSB1bmFibGUgdG8gYmUgY3JlYXRlZCBmb3IgJHtjb21tYW5kTmFtZX1gLFxuLy8gICAgICAgKTtcbi8vICAgICB9XG5cbi8vICAgICAvLyBUcnkgYWdhaW4gaW4gMyBzZWNvbmRzIGluIGNhc2UgdGhpcyBjb21tYW5kIGZpbGUganVzdCBoYXMgbm90IGJlZW4gbG9hZGVkIHlldC5cbi8vICAgICBzZXRUaW1lb3V0KFxuLy8gICAgICAgKCkgPT4gY3JlYXRlU3ViY29tbWFuZChjb21tYW5kTmFtZSwgc3ViY29tbWFuZCwgcmV0cmllcysrKSxcbi8vICAgICAgIDEwMDAsXG4vLyAgICAgKTtcbi8vICAgICByZXR1cm47XG4vLyAgIH1cblxuLy8gICBpZiAoIWNvbW1hbmQuc3ViY29tbWFuZHMpIHtcbi8vICAgICBjb21tYW5kLnN1YmNvbW1hbmRzID0gbmV3IENvbGxlY3Rpb24oKTtcbi8vICAgfVxuXG4vLyAgIGNvbW1hbmQuc3ViY29tbWFuZHMuc2V0KHN1YmNvbW1hbmQubmFtZSwgc3ViY29tbWFuZCk7XG4vLyB9XG5cbi8qKiBVc2UgdGhpcyBmdW5jdGlvbiB0byBzZW5kIGFuIGVtYmVkIHdpdGggZWFzZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZW5kRW1iZWQoY2hhbm5lbElkOiBiaWdpbnQsIGVtYmVkOiBFbWJlZCwgY29udGVudD86IHN0cmluZykge1xuICByZXR1cm4gc2VuZE1lc3NhZ2UoY2hhbm5lbElkLCB7IGNvbnRlbnQsIGVtYmVkIH0pO1xufVxuXG4vKiogVXNlIHRoaXMgZnVuY3Rpb24gdG8gZWRpdCBhbiBlbWJlZCB3aXRoIGVhc2UuICovXG5leHBvcnQgZnVuY3Rpb24gZWRpdEVtYmVkKFxuICBtZXNzYWdlOiBEaXNjb3JkZW5vTWVzc2FnZSxcbiAgZW1iZWQ6IEVtYmVkLFxuICBjb250ZW50Pzogc3RyaW5nLFxuKSB7XG4gIHJldHVybiBlZGl0TWVzc2FnZShtZXNzYWdlLCB7IGNvbnRlbnQsIGVtYmVkIH0pO1xufVxuXG4vLyBWZXJ5IGltcG9ydGFudCB0byBtYWtlIHN1cmUgZmlsZXMgYXJlIHJlbG9hZGVkIHByb3Blcmx5XG5sZXQgdW5pcXVlRmlsZVBhdGhDb3VudGVyID0gMDtcbmxldCBwYXRoczogc3RyaW5nW10gPSBbXTtcblxuLyoqIFRoaXMgZnVuY3Rpb24gYWxsb3dzIHJlYWRpbmcgYWxsIGZpbGVzIGluIGEgZm9sZGVyLiBVc2VmdWwgZm9yIGxvYWRpbmcvcmVsb2FkaW5nIGNvbW1hbmRzLCBtb25pdG9ycyBldGMgKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbXBvcnREaXJlY3RvcnkocGF0aDogc3RyaW5nKSB7XG4gIHBhdGggPSBwYXRoLnJlcGxhY2VBbGwoXCJcXFxcXCIsIFwiL1wiKTtcbiAgY29uc3QgZmlsZXMgPSBEZW5vLnJlYWREaXJTeW5jKERlbm8ucmVhbFBhdGhTeW5jKHBhdGgpKTtcbiAgY29uc3QgZm9sZGVyID0gcGF0aC5zdWJzdHJpbmcocGF0aC5pbmRleE9mKFwiL3NyYy9cIikgKyA1KTtcblxuICBpZiAoIWZvbGRlci5pbmNsdWRlcyhcIi9cIikpIGxvZy5pbmZvKGBMb2FkaW5nICR7Zm9sZGVyfS4uLmApO1xuXG4gIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgIGlmICghZmlsZS5uYW1lKSBjb250aW51ZTtcblxuICAgIGNvbnN0IGN1cnJlbnRQYXRoID0gYCR7cGF0aH0vJHtmaWxlLm5hbWV9YDtcbiAgICBpZiAoZmlsZS5pc0ZpbGUpIHtcbiAgICAgIGlmICghY3VycmVudFBhdGguZW5kc1dpdGgoXCIudHNcIikpIGNvbnRpbnVlO1xuICAgICAgcGF0aHMucHVzaChcbiAgICAgICAgYGltcG9ydCBcIiR7XG4gICAgICAgICAgRGVuby5tYWluTW9kdWxlLnN1YnN0cmluZygwLCBEZW5vLm1haW5Nb2R1bGUubGFzdEluZGV4T2YoXCIvXCIpKVxuICAgICAgICB9LyR7XG4gICAgICAgICAgY3VycmVudFBhdGguc3Vic3RyaW5nKFxuICAgICAgICAgICAgY3VycmVudFBhdGguaW5kZXhPZihcInNyYy9cIiksXG4gICAgICAgICAgKVxuICAgICAgICB9IyR7dW5pcXVlRmlsZVBhdGhDb3VudGVyfVwiO2AsXG4gICAgICApO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgYXdhaXQgaW1wb3J0RGlyZWN0b3J5KGN1cnJlbnRQYXRoKTtcbiAgfVxuXG4gIHVuaXF1ZUZpbGVQYXRoQ291bnRlcisrO1xufVxuXG4vKiogSW1wb3J0cyBhbGwgZXZlcnl0aGluZyBpbiBmaWxlbG9hZGVyLnRzICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmlsZUxvYWRlcigpIHtcbiAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKFxuICAgIFwiZmlsZWxvYWRlci50c1wiLFxuICAgIHBhdGhzLmpvaW4oXCJcXG5cIikucmVwbGFjZUFsbChcIlxcXFxcIiwgXCIvXCIpLFxuICApO1xuICBhd2FpdCBpbXBvcnQoXG4gICAgYCR7XG4gICAgICBEZW5vLm1haW5Nb2R1bGUuc3Vic3RyaW5nKDAsIERlbm8ubWFpbk1vZHVsZS5sYXN0SW5kZXhPZihcIi9cIikpXG4gICAgfS9maWxlbG9hZGVyLnRzIyR7dW5pcXVlRmlsZVBhdGhDb3VudGVyfWBcbiAgKTtcbiAgcGF0aHMgPSBbXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRpbWUoKSB7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IGhvdXJzID0gbm93LmdldEhvdXJzKCk7XG4gIGNvbnN0IG1pbnV0ZSA9IG5vdy5nZXRNaW51dGVzKCk7XG5cbiAgbGV0IGhvdXIgPSBob3VycztcbiAgbGV0IGFtT3JQbSA9IGBBTWA7XG4gIGlmIChob3VyID4gMTIpIHtcbiAgICBhbU9yUG0gPSBgUE1gO1xuICAgIGhvdXIgPSBob3VyIC0gMTI7XG4gIH1cblxuICByZXR1cm4gYCR7aG91ciA+PSAxMCA/IGhvdXIgOiBgMCR7aG91cn1gfToke1xuICAgIG1pbnV0ZSA+PSAxMCA/IG1pbnV0ZSA6IGAwJHttaW51dGV9YFxuICB9ICR7YW1PclBtfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50TGFuZ3VhZ2UoZ3VpbGRJZDogYmlnaW50KSB7XG4gIHJldHVybiBib3QuZ3VpbGRMYW5ndWFnZXMuZ2V0KGd1aWxkSWQpIHx8XG4gICAgY2FjaGUuZ3VpbGRzLmdldChndWlsZElkKT8ucHJlZmVycmVkTG9jYWxlIHx8IFwiZW5fVVNcIjtcbn1cblxuLyoqIFRoaXMgZnVuY3Rpb24gYWxsb3dzIHRvIGNyZWF0ZSBhIHBhZ2luYXRpb24gdXNpbmcgZW1iZWRzIGFuZCByZWFjdGlvbnMgUmVxdWlyZXMgR1VJTERfTUVTU0FHRV9SRUFDVElPTlMgaW50ZW50ICoqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUVtYmVkc1BhZ2luYXRpb24oXG4gIGNoYW5uZWxJZDogYmlnaW50LFxuICBhdXRob3JJZDogYmlnaW50LFxuICBlbWJlZHM6IEVtYmVkW10sXG4gIGRlZmF1bHRQYWdlID0gMSxcbiAgcmVhY3Rpb25UaW1lb3V0ID0gTWlsbGlzZWNvbmRzLlNFQ09ORCAqIDMwLFxuICByZWFjdGlvbnM6IHtcbiAgICBbZW1vamk6IHN0cmluZ106IChcbiAgICAgIHNldFBhZ2U6IChuZXdQYWdlOiBudW1iZXIpID0+IHZvaWQsXG4gICAgICBjdXJyZW50UGFnZTogbnVtYmVyLFxuICAgICAgcGFnZUNvdW50OiBudW1iZXIsXG4gICAgICBkZWxldGVQYWdpbmF0aW9uOiAoKSA9PiB2b2lkLFxuICAgICkgPT4gUHJvbWlzZTx1bmtub3duPjtcbiAgfSA9IHtcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIHJlcXVpcmUtYXdhaXRcbiAgICBcIuKXgO+4j1wiOiBhc3luYyAoc2V0UGFnZSwgY3VycmVudFBhZ2UpID0+IHNldFBhZ2UoTWF0aC5tYXgoY3VycmVudFBhZ2UgLSAxLCAxKSksXG4gICAgXCLihpfvuI9cIjogYXN5bmMgKHNldFBhZ2UpID0+IHtcbiAgICAgIGNvbnN0IHF1ZXN0aW9uID0gYXdhaXQgc2VuZE1lc3NhZ2UoXG4gICAgICAgIGNoYW5uZWxJZCxcbiAgICAgICAgXCJUbyB3aGF0IHBhZ2Ugd291bGQgeW91IGxpa2UgdG8ganVtcD8gU2F5IGBjYW5jZWxgIG9yIGAwYCB0byBjYW5jZWwgdGhlIHByb21wdC5cIixcbiAgICAgICk7XG4gICAgICBjb25zdCBhbnN3ZXIgPSBhd2FpdCBuZWVkTWVzc2FnZShhdXRob3JJZCwgY2hhbm5lbElkKTtcbiAgICAgIGF3YWl0IGRlbGV0ZU1lc3NhZ2VzKGNoYW5uZWxJZCwgW3F1ZXN0aW9uLmlkLCBhbnN3ZXIuaWRdKS5jYXRjaChcbiAgICAgICAgbG9nLmVycm9yLFxuICAgICAgKTtcblxuICAgICAgY29uc3QgbmV3UGFnZU51bWJlciA9IE1hdGguY2VpbChOdW1iZXIoYW5zd2VyLmNvbnRlbnQpKTtcblxuICAgICAgaWYgKGlzTmFOKG5ld1BhZ2VOdW1iZXIpKSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBzZW5kTWVzc2FnZShjaGFubmVsSWQsIFwiVGhpcyBpcyBub3QgYSB2YWxpZCBudW1iZXIhXCIpO1xuICAgICAgfVxuXG4gICAgICBpZiAobmV3UGFnZU51bWJlciA8IDEgfHwgbmV3UGFnZU51bWJlciA+IGVtYmVkcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHNlbmRNZXNzYWdlKGNoYW5uZWxJZCwgYFRoaXMgaXMgbm90IGEgdmFsaWQgcGFnZSFgKTtcbiAgICAgIH1cblxuICAgICAgc2V0UGFnZShuZXdQYWdlTnVtYmVyKTtcbiAgICB9LFxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgcmVxdWlyZS1hd2FpdFxuICAgIFwi4pa277iPXCI6IGFzeW5jIChzZXRQYWdlLCBjdXJyZW50UGFnZSwgcGFnZUNvdW50KSA9PlxuICAgICAgc2V0UGFnZShNYXRoLm1pbihjdXJyZW50UGFnZSArIDEsIHBhZ2VDb3VudCkpLFxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgcmVxdWlyZS1hd2FpdFxuICAgIFwi8J+Xke+4j1wiOiBhc3luYyAoX3NldFBhZ2UsIF9jdXJyZW50UGFnZSwgX3BhZ2VDb3VudCwgZGVsZXRlUGFnaW5hdGlvbikgPT5cbiAgICAgIGRlbGV0ZVBhZ2luYXRpb24oKSxcbiAgfSxcbikge1xuICBpZiAoZW1iZWRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gIGxldCBjdXJyZW50UGFnZSA9IGRlZmF1bHRQYWdlO1xuICBjb25zdCBlbWJlZE1lc3NhZ2UgPSBhd2FpdCBzZW5kRW1iZWQoY2hhbm5lbElkLCBlbWJlZHNbY3VycmVudFBhZ2UgLSAxXSk7XG5cbiAgaWYgKCFlbWJlZE1lc3NhZ2UpIHJldHVybjtcblxuICBpZiAoZW1iZWRzLmxlbmd0aCA8PSAxKSByZXR1cm47XG5cbiAgYXdhaXQgZW1iZWRNZXNzYWdlLmFkZFJlYWN0aW9ucyhPYmplY3Qua2V5cyhyZWFjdGlvbnMpLCB0cnVlKS5jYXRjaChcbiAgICBsb2cuZXJyb3IsXG4gICk7XG5cbiAgbGV0IGlzRW5kZWQgPSBmYWxzZTtcblxuICB3aGlsZSAoIWlzRW5kZWQpIHtcbiAgICBpZiAoIWVtYmVkTWVzc2FnZSkgcmV0dXJuO1xuXG4gICAgY29uc3QgcmVhY3Rpb24gPSBhd2FpdCBuZWVkUmVhY3Rpb24oYXV0aG9ySWQsIGVtYmVkTWVzc2FnZS5pZCwge1xuICAgICAgZHVyYXRpb246IHJlYWN0aW9uVGltZW91dCxcbiAgICB9KTtcbiAgICBpZiAoIXJlYWN0aW9uKSByZXR1cm47XG5cbiAgICBpZiAoZW1iZWRNZXNzYWdlLmd1aWxkSWQpIHtcbiAgICAgIGF3YWl0IHJlbW92ZVJlYWN0aW9uKGVtYmVkTWVzc2FnZS5jaGFubmVsSWQsIGVtYmVkTWVzc2FnZS5pZCwgcmVhY3Rpb24sIHtcbiAgICAgICAgdXNlcklkOiBhdXRob3JJZCxcbiAgICAgIH0pLmNhdGNoKGxvZy5lcnJvcik7XG4gICAgfVxuXG4gICAgaWYgKHJlYWN0aW9uc1tyZWFjdGlvbl0pIHtcbiAgICAgIGF3YWl0IHJlYWN0aW9uc1tyZWFjdGlvbl0oXG4gICAgICAgIChuZXdQYWdlKSA9PiB7XG4gICAgICAgICAgY3VycmVudFBhZ2UgPSBuZXdQYWdlO1xuICAgICAgICB9LFxuICAgICAgICBjdXJyZW50UGFnZSxcbiAgICAgICAgZW1iZWRzLmxlbmd0aCxcbiAgICAgICAgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGlzRW5kZWQgPSB0cnVlO1xuICAgICAgICAgIGF3YWl0IGVtYmVkTWVzc2FnZS5kZWxldGUoKS5jYXRjaChsb2cuZXJyb3IpO1xuICAgICAgICB9LFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBpc0VuZGVkIHx8ICFlbWJlZE1lc3NhZ2UgfHxcbiAgICAgICEoYXdhaXQgZWRpdEVtYmVkKGVtYmVkTWVzc2FnZSwgZW1iZWRzW2N1cnJlbnRQYWdlIC0gMV0pLmNhdGNoKGxvZy5lcnJvcikpXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG59XG5cbi8qKiBUaGlzIGZ1bmN0aW9uIGFsbG93cyB0byBjcmVhdGUgYSBwYWdpbmF0aW9uIHVzaW5nIGVtYmVkcyBhbmQgYnV0dG9ucy4gKiovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlRW1iZWRzQnV0dG9uc1BhZ2luYXRpb24oXG4gIG1lc3NhZ2VJZDogYmlnaW50LFxuICBjaGFubmVsSWQ6IGJpZ2ludCxcbiAgYXV0aG9ySWQ6IGJpZ2ludCxcbiAgZW1iZWRzOiBFbWJlZFtdLFxuICBkZWZhdWx0UGFnZSA9IDEsXG4gIGJ1dHRvblRpbWVvdXQgPSBNaWxsaXNlY29uZHMuU0VDT05EICogMzAsXG4pIHtcbiAgaWYgKGVtYmVkcy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICBsZXQgY3VycmVudFBhZ2UgPSBkZWZhdWx0UGFnZTtcblxuICBjb25zdCBjcmVhdGVDb21wb25lbnRzID0gKCk6IE1lc3NhZ2VDb21wb25lbnRzID0+IFtcbiAgICB7XG4gICAgICB0eXBlOiBEaXNjb3JkTWVzc2FnZUNvbXBvbmVudFR5cGVzLkFjdGlvblJvdyxcbiAgICAgIGNvbXBvbmVudHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6IERpc2NvcmRNZXNzYWdlQ29tcG9uZW50VHlwZXMuQnV0dG9uLFxuICAgICAgICAgIGxhYmVsOiBcIlByZXZpb3VzXCIsXG4gICAgICAgICAgY3VzdG9tSWQ6IGAke21lc3NhZ2VJZH0tUHJldmlvdXNgLFxuICAgICAgICAgIHN0eWxlOiBEaXNjb3JkQnV0dG9uU3R5bGVzLlByaW1hcnksXG4gICAgICAgICAgZGlzYWJsZWQ6IGN1cnJlbnRQYWdlID09PSAxLFxuICAgICAgICAgIGVtb2ppOiB7IG5hbWU6IFwi4qyF77iPXCIgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6IERpc2NvcmRNZXNzYWdlQ29tcG9uZW50VHlwZXMuQnV0dG9uLFxuICAgICAgICAgIGxhYmVsOiBcIkp1bXBcIixcbiAgICAgICAgICBjdXN0b21JZDogYCR7bWVzc2FnZUlkfS1KdW1wYCxcbiAgICAgICAgICBzdHlsZTogRGlzY29yZEJ1dHRvblN0eWxlcy5QcmltYXJ5LFxuICAgICAgICAgIGRpc2FibGVkOiBlbWJlZHMubGVuZ3RoIDw9IDIsXG4gICAgICAgICAgZW1vamk6IHsgbmFtZTogXCLihpfvuI9cIiB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogRGlzY29yZE1lc3NhZ2VDb21wb25lbnRUeXBlcy5CdXR0b24sXG4gICAgICAgICAgbGFiZWw6IFwiTmV4dFwiLFxuICAgICAgICAgIGN1c3RvbUlkOiBgJHttZXNzYWdlSWR9LU5leHRgLFxuICAgICAgICAgIHN0eWxlOiBEaXNjb3JkQnV0dG9uU3R5bGVzLlByaW1hcnksXG4gICAgICAgICAgZGlzYWJsZWQ6IGN1cnJlbnRQYWdlID49IGVtYmVkcy5sZW5ndGgsXG4gICAgICAgICAgZW1vamk6IHsgbmFtZTogXCLinqHvuI9cIiB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogRGlzY29yZE1lc3NhZ2VDb21wb25lbnRUeXBlcy5CdXR0b24sXG4gICAgICAgICAgbGFiZWw6IFwiRGVsZXRlXCIsXG4gICAgICAgICAgY3VzdG9tSWQ6IGAke21lc3NhZ2VJZH0tRGVsZXRlYCxcbiAgICAgICAgICBzdHlsZTogRGlzY29yZEJ1dHRvblN0eWxlcy5EYW5nZXIsXG4gICAgICAgICAgZW1vamk6IHsgbmFtZTogXCLwn5eR77iPXCIgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgXTtcblxuICBjb25zdCBlbWJlZE1lc3NhZ2UgPSBhd2FpdCBzZW5kTWVzc2FnZShjaGFubmVsSWQsIHtcbiAgICBlbWJlZDogZW1iZWRzW2N1cnJlbnRQYWdlIC0gMV0sXG4gICAgY29tcG9uZW50czogY3JlYXRlQ29tcG9uZW50cygpLFxuICB9KTtcblxuICBpZiAoIWVtYmVkTWVzc2FnZSkgcmV0dXJuO1xuXG4gIGlmIChlbWJlZHMubGVuZ3RoIDw9IDEpIHJldHVybjtcblxuICBsZXQgaXNFbmRlZCA9IGZhbHNlO1xuXG4gIHdoaWxlICghaXNFbmRlZCkge1xuICAgIGlmICghZW1iZWRNZXNzYWdlKSB7XG4gICAgICBpc0VuZGVkID0gdHJ1ZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbGxlY3RlZEJ1dHRvbiA9IGF3YWl0IG5lZWRCdXR0b24oYXV0aG9ySWQsIGVtYmVkTWVzc2FnZS5jaGFubmVsSWQsIHtcbiAgICAgIGR1cmF0aW9uOiBidXR0b25UaW1lb3V0LFxuICAgIH0pO1xuXG4gICAgY29uc29sZS5sb2coY29sbGVjdGVkQnV0dG9uKTtcblxuICAgIGlmIChcbiAgICAgICFjb2xsZWN0ZWRCdXR0b24gfHxcbiAgICAgICFjb2xsZWN0ZWRCdXR0b24uY3VzdG9tSWQuc3RhcnRzV2l0aChtZXNzYWdlSWQudG9TdHJpbmcoKSlcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBhY3Rpb24gPSBjb2xsZWN0ZWRCdXR0b24uY3VzdG9tSWQuc3BsaXQoXCItXCIpWzFdO1xuXG4gICAgc3dpdGNoIChhY3Rpb24pIHtcbiAgICAgIGNhc2UgXCJOZXh0XCI6XG4gICAgICAgIGN1cnJlbnRQYWdlICs9IDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1jYXNlLWRlY2xhcmF0aW9uc1xuICAgICAgY2FzZSBcIkp1bXBcIjpcbiAgICAgICAgYXdhaXQgc2VuZEludGVyYWN0aW9uUmVzcG9uc2UoXG4gICAgICAgICAgc25vd2ZsYWtlVG9CaWdpbnQoY29sbGVjdGVkQnV0dG9uLmludGVyYWN0aW9uLmlkKSxcbiAgICAgICAgICBjb2xsZWN0ZWRCdXR0b24uaW50ZXJhY3Rpb24udG9rZW4sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogNixcbiAgICAgICAgICB9LFxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IHF1ZXN0aW9uID0gYXdhaXQgc2VuZE1lc3NhZ2UoXG4gICAgICAgICAgY2hhbm5lbElkLFxuICAgICAgICAgIFwiVG8gd2hhdCBwYWdlIHdvdWxkIHlvdSBsaWtlIHRvIGp1bXA/IFNheSBgY2FuY2VsYCBvciBgMGAgdG8gY2FuY2VsIHRoZSBwcm9tcHQuXCIsXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IGFuc3dlciA9IGF3YWl0IG5lZWRNZXNzYWdlKGF1dGhvcklkLCBjaGFubmVsSWQpO1xuICAgICAgICBhd2FpdCBkZWxldGVNZXNzYWdlcyhjaGFubmVsSWQsIFtxdWVzdGlvbi5pZCwgYW5zd2VyLmlkXSkuY2F0Y2goXG4gICAgICAgICAgbG9nLmVycm9yLFxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IG5ld1BhZ2VOdW1iZXIgPSBNYXRoLmNlaWwoTnVtYmVyKGFuc3dlci5jb250ZW50KSk7XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIGlzTmFOKG5ld1BhZ2VOdW1iZXIpIHx8IG5ld1BhZ2VOdW1iZXIgPCAxIHx8XG4gICAgICAgICAgbmV3UGFnZU51bWJlciA+IGVtYmVkcy5sZW5ndGhcbiAgICAgICAgKSB7XG4gICAgICAgICAgYXdhaXQgc2VuZE1lc3NhZ2UoY2hhbm5lbElkLCBcIlRoaXMgaXMgbm90IGEgdmFsaWQgbnVtYmVyIVwiKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGN1cnJlbnRQYWdlID0gbmV3UGFnZU51bWJlcjtcblxuICAgICAgICBlZGl0V2ViaG9va01lc3NhZ2UoXG4gICAgICAgICAgc25vd2ZsYWtlVG9CaWdpbnQoY29sbGVjdGVkQnV0dG9uLmludGVyYWN0aW9uLmFwcGxpY2F0aW9uSWQpLFxuICAgICAgICAgIGNvbGxlY3RlZEJ1dHRvbi5pbnRlcmFjdGlvbi50b2tlbixcbiAgICAgICAgICB7XG4gICAgICAgICAgICBtZXNzYWdlSWQ6IGVtYmVkTWVzc2FnZS5pZCxcbiAgICAgICAgICAgIGVtYmVkczogW2VtYmVkc1tjdXJyZW50UGFnZSAtIDFdXSxcbiAgICAgICAgICAgIGNvbXBvbmVudHM6IGNyZWF0ZUNvbXBvbmVudHMoKSxcbiAgICAgICAgICB9LFxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgY2FzZSBcIlByZXZpb3VzXCI6XG4gICAgICAgIGN1cnJlbnRQYWdlIC09IDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkRlbGV0ZVwiOlxuICAgICAgICBkZWxldGVNZXNzYWdlKGNoYW5uZWxJZCwgZW1iZWRNZXNzYWdlLmlkKTtcbiAgICAgICAgaXNFbmRlZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIGlzRW5kZWQgfHxcbiAgICAgICFlbWJlZE1lc3NhZ2UgfHxcbiAgICAgICEoYXdhaXQgc2VuZEludGVyYWN0aW9uUmVzcG9uc2UoXG4gICAgICAgIHNub3dmbGFrZVRvQmlnaW50KGNvbGxlY3RlZEJ1dHRvbi5pbnRlcmFjdGlvbi5pZCksXG4gICAgICAgIGNvbGxlY3RlZEJ1dHRvbi5pbnRlcmFjdGlvbi50b2tlbixcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6IDcsXG4gICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgZW1iZWRzOiBbZW1iZWRzW2N1cnJlbnRQYWdlIC0gMV1dLFxuICAgICAgICAgICAgY29tcG9uZW50czogY3JlYXRlQ29tcG9uZW50cygpLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICApLmNhdGNoKGxvZy5lcnJvcikpXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbW9qaVVuaWNvZGUoZW1vamk6IEVtb2ppKSB7XG4gIHJldHVybiBlbW9qaS5hbmltYXRlZCB8fCBlbW9qaS5pZFxuICAgID8gYDwke2Vtb2ppLmFuaW1hdGVkID8gXCJhXCIgOiBcIlwifToke2Vtb2ppLm5hbWV9OiR7ZW1vamkuaWR9PmBcbiAgICA6IGVtb2ppLm5hbWUgfHwgXCJcIjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoTWVtYmVyKGd1aWxkSWQ6IGJpZ2ludCwgaWQ6IGJpZ2ludCB8IHN0cmluZykge1xuICBjb25zdCB1c2VySWQgPSB0eXBlb2YgaWQgPT09IFwic3RyaW5nXCJcbiAgICA/IGlkLnN0YXJ0c1dpdGgoXCI8QFwiKVxuICAgICAgPyBCaWdJbnQoaWQuc3Vic3RyaW5nKGlkLnN0YXJ0c1dpdGgoXCI8QCFcIikgPyAzIDogMiwgaWQubGVuZ3RoIC0gMSkpXG4gICAgICA6IEJpZ0ludChpZClcbiAgICA6IGlkO1xuXG4gIGNvbnN0IGd1aWxkID0gY2FjaGUuZ3VpbGRzLmdldChndWlsZElkKTtcbiAgaWYgKCFndWlsZCkgcmV0dXJuO1xuXG4gIGNvbnN0IGNhY2hlZE1lbWJlciA9IGNhY2hlLm1lbWJlcnMuZ2V0KHVzZXJJZCk7XG4gIGlmIChjYWNoZWRNZW1iZXIpIHJldHVybiBjYWNoZWRNZW1iZXI7XG5cbiAgY29uc3Qgc2hhcmRJZCA9IGNhbGN1bGF0ZVNoYXJkSWQoZ3VpbGRJZCk7XG5cbiAgY29uc3Qgc2hhcmQgPSB3cy5zaGFyZHMuZ2V0KHNoYXJkSWQpO1xuICAvLyBXaGVuIGdhdGV3YXkgaXMgZHlpbmdcbiAgaWYgKHNoYXJkPy5xdWV1ZUNvdW50ZXIgJiYgc2hhcmQucXVldWVDb3VudGVyID4gMTEwKSB7XG4gICAgcmV0dXJuIGdldE1lbWJlcihndWlsZElkLCB1c2VySWQpLmNhdGNoKCgpID0+IHVuZGVmaW5lZCk7XG4gIH1cblxuICAvLyBGZXRjaCBmcm9tIGdhdGV3YXkgYXMgaXQgaXMgbXVjaCBiZXR0ZXIgdGhhbiB3YXN0aW5nIGxpbWl0ZWQgSFRUUCBjYWxscy5cbiAgY29uc3QgbWVtYmVyID0gYXdhaXQgZmV0Y2hNZW1iZXJzKGd1aWxkSWQsIHNoYXJkSWQsIHtcbiAgICB1c2VySWRzOiBbdXNlcklkXSxcbiAgICBsaW1pdDogMSxcbiAgfSkuY2F0Y2goKCkgPT4gdW5kZWZpbmVkKTtcblxuICByZXR1cm4gbWVtYmVyPy5maXJzdCgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FsY3VsYXRlU2hhcmRJZChndWlsZElkOiBiaWdpbnQpIHtcbiAgaWYgKHdzLm1heFNoYXJkcyA9PT0gMSkgcmV0dXJuIDA7XG5cbiAgcmV0dXJuIE51bWJlcigoZ3VpbGRJZCA+PiAyMm4pICUgQmlnSW50KHdzLm1heFNoYXJkcyAtIDEpKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxHQUFHLFNBQVEsY0FBZ0I7U0FFbEMsS0FBSyxFQUNMLFVBQVUsRUFDVixhQUFhLEVBQ2IsY0FBYyxFQUNkLG1CQUFtQixFQUVuQiw0QkFBNEIsRUFDNUIsV0FBVyxFQUNYLGtCQUFrQixFQUVsQixZQUFZLEVBQ1osU0FBUyxFQUVULGNBQWMsRUFDZCx1QkFBdUIsRUFDdkIsV0FBVyxFQUNYLGlCQUFpQixFQUNqQixFQUFFLFNBQ0csYUFBZTtTQUViLFVBQVUsRUFBRSxXQUFXLEVBQUUsWUFBWSxTQUFRLGVBQWlCO1NBQzlELFlBQVksU0FBUSxtQkFBcUI7U0FFekMsR0FBRyxTQUFRLFdBQWE7QUFFakMsRUFBK0csQUFBL0csMkdBQStHLEFBQS9HLEVBQStHLGlCQUMvRixvQkFBb0IsQ0FBQyxZQUFvQjtJQUN2RCxFQUF1QixBQUF2QixxQkFBdUI7VUFDakIsSUFBSSxHQUFHLFlBQVksR0FBRyxJQUFJO1FBQzVCLElBQUksR0FBRyxDQUFDLFVBQVMsRUFBSTtVQUVuQixJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsS0FBSztVQUM5QixLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxJQUFJLEdBQUcsS0FBSyxHQUFJLElBQUk7VUFDeEMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUcsSUFBSSxHQUFHLEtBQUssR0FBSSxJQUFJLEdBQUksRUFBRTtVQUNqRCxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRyxJQUFJLEdBQUcsS0FBSyxHQUFJLElBQUksR0FBSSxFQUFFO1VBRWpELFNBQVMsR0FBRyxJQUFJLE1BQU0sSUFBSSxDQUFDLEVBQUU7VUFDN0IsVUFBVSxHQUFHLEtBQUssTUFBTSxLQUFLLENBQUMsRUFBRTtVQUNoQyxZQUFZLEdBQUcsT0FBTyxNQUFNLE9BQU8sQ0FBQyxFQUFFO1VBQ3RDLFlBQVksR0FBRyxPQUFPLE1BQU0sT0FBTyxDQUFDLEVBQUU7Y0FFbEMsU0FBUyxHQUFHLFVBQVUsR0FBRyxZQUFZLEdBQUcsWUFBWTs7QUFHaEUsRUFBc0UsQUFBdEUsa0VBQXNFLEFBQXRFLEVBQXNFLGlCQUN0RCxvQkFBb0IsQ0FBQyxJQUFZO1VBQ3pDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSztTQUNyQixPQUFPO1FBRVIsS0FBSyxHQUFHLENBQUM7ZUFFRixLQUFLLElBQUksT0FBTztRQUN6QixFQUFtQyxBQUFuQyxpQ0FBbUM7Y0FDN0IsVUFBVSxpQkFBaUIsSUFBSSxDQUFDLEtBQUs7UUFDM0MsRUFBb0MsQUFBcEMsa0NBQW9DO2FBQy9CLFVBQVU7UUFDZixFQUFnRSxBQUFoRSw4REFBZ0U7Y0FDMUQsTUFBTSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxLQUFLO1FBQ2xELEVBQWdDLEFBQWhDLDhCQUFnQztlQUN6QixNQUFNLElBQUksVUFBVTthQUN0QixNQUFNLEtBQUssTUFBTTtZQUVsQixVQUFVLEdBQUcsWUFBWSxDQUFDLE1BQU07ZUFDNUIsTUFBTSxDQUFDLFdBQVc7a0JBQ2xCLENBQUM7Z0JBQ0wsVUFBVSxHQUFHLFlBQVksQ0FBQyxJQUFJOztrQkFFMUIsQ0FBQztnQkFDTCxVQUFVLEdBQUcsWUFBWSxDQUFDLEdBQUc7O2tCQUV6QixDQUFDO2dCQUNMLFVBQVUsR0FBRyxZQUFZLENBQUMsSUFBSTs7a0JBRTFCLENBQUM7Z0JBQ0wsVUFBVSxHQUFHLFlBQVksQ0FBQyxNQUFNOzs7Y0FJOUIsTUFBTSxHQUFHLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsSUFBSSxTQUFTO2FBQ25ELE1BQU07UUFFWCxLQUFLLElBQUksTUFBTSxHQUFHLFVBQVU7O1dBR3ZCLEtBQUs7O2dCQUdFLGFBQWEsQ0FDM0IsT0FBbUI7SUFFbEIsT0FBTyxDQUFDLHFCQUFxQjtTQUM1QixhQUFlO1NBQ2YsbUJBQXFCO1NBQ3JCLG9CQUFzQjtTQUN0QixZQUFjO1NBQ2QsYUFBZTtTQUNmLFdBQWE7V0FDVCxPQUFPLENBQUMscUJBQXFCO09BQy9CLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTzs7Z0JBRzVCLGdCQUFnQixDQUM5QixXQUFtQixFQUNuQixVQUFzQixFQUN0QixPQUFPLEdBQUcsQ0FBQztVQUVMLEtBQUssR0FBRyxXQUFXLENBQUMsS0FBSyxFQUFDLENBQUc7UUFFL0IsT0FBTyxHQUFlLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFdBQVc7UUFFbEQsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDO21CQUNQLElBQUksSUFBSSxLQUFLO2tCQUNoQixZQUFZLEdBQUcsT0FBTyxHQUN4QixPQUFPLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxJQUFJLElBQzdCLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUk7aUJBRXBCLFlBQVk7b0JBQ1gsT0FBTyxLQUFLLEVBQUU7Z0JBQ2xCLFVBQVUsS0FDRixnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsVUFBVSxFQUFFLE9BQU87a0JBQ3ZELFlBQVksQ0FBQyxNQUFNLEdBQUcsRUFBRTs7O1lBSzVCLE9BQU8sR0FBRyxZQUFZOzs7U0FJckIsT0FBTztRQUNWLEVBQTJELEFBQTNELHlEQUEyRDtZQUN2RCxPQUFPLEtBQUssRUFBRTttQkFDVCxHQUFHLENBQUMsSUFBSSxFQUNaLFdBQVcsRUFBRSxVQUFVLENBQUMsMEJBQTBCLEVBQUUsV0FBVzs7UUFJcEUsRUFBa0YsQUFBbEYsZ0ZBQWtGO1FBQ2xGLFVBQVUsS0FDRixnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsVUFBVSxFQUFFLE9BQU87VUFDdkQsWUFBWSxDQUFDLE1BQU0sR0FBRyxFQUFFOzs7U0FLdkIsT0FBTyxDQUFDLFdBQVc7UUFDdEIsT0FBTyxDQUFDLFdBQVcsT0FBTyxVQUFVOztJQUd0QyxFQUFtRSxBQUFuRSxpRUFBbUU7SUFDbkUsT0FBTyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxVQUFVOztBQUdyRCxFQUFvQyxBQUFwQyxrQ0FBb0M7QUFDcEMsRUFBeUIsQUFBekIsdUJBQXlCO0FBQ3pCLEVBQXlCLEFBQXpCLHVCQUF5QjtBQUN6QixFQUFpQixBQUFqQixlQUFpQjtBQUNqQixFQUFNLEFBQU4sSUFBTTtBQUNOLEVBQTBDLEFBQTFDLHdDQUEwQztBQUUxQyxFQUFpRCxBQUFqRCwrQ0FBaUQ7QUFFakQsRUFBNEIsQUFBNUIsMEJBQTRCO0FBQzVCLEVBQWtDLEFBQWxDLGdDQUFrQztBQUNsQyxFQUFxQyxBQUFyQyxtQ0FBcUM7QUFDckMsRUFBMkMsQUFBM0MseUNBQTJDO0FBQzNDLEVBQW9DLEFBQXBDLGtDQUFvQztBQUNwQyxFQUFrQyxBQUFsQyxnQ0FBa0M7QUFFbEMsRUFBZ0MsQUFBaEMsOEJBQWdDO0FBQ2hDLEVBQVEsQUFBUixNQUFRO0FBQ1IsRUFBTSxBQUFOLElBQU07QUFFTixFQUFvQixBQUFwQixrQkFBb0I7QUFDcEIsRUFBa0UsQUFBbEUsZ0VBQWtFO0FBQ2xFLEVBQTZCLEFBQTdCLDJCQUE2QjtBQUM3QixFQUEwQixBQUExQix3QkFBMEI7QUFDMUIsRUFBOEUsQUFBOUUsNEVBQThFO0FBQzlFLEVBQVcsQUFBWCxTQUFXO0FBQ1gsRUFBUSxBQUFSLE1BQVE7QUFFUixFQUF3RixBQUF4RixzRkFBd0Y7QUFDeEYsRUFBa0IsQUFBbEIsZ0JBQWtCO0FBQ2xCLEVBQW9FLEFBQXBFLGtFQUFvRTtBQUNwRSxFQUFjLEFBQWQsWUFBYztBQUNkLEVBQVMsQUFBVCxPQUFTO0FBQ1QsRUFBYyxBQUFkLFlBQWM7QUFDZCxFQUFNLEFBQU4sSUFBTTtBQUVOLEVBQWdDLEFBQWhDLDhCQUFnQztBQUNoQyxFQUE4QyxBQUE5Qyw0Q0FBOEM7QUFDOUMsRUFBTSxBQUFOLElBQU07QUFFTixFQUEwRCxBQUExRCx3REFBMEQ7QUFDMUQsRUFBSSxBQUFKLEVBQUk7QUFFSixFQUFvRCxBQUFwRCxnREFBb0QsQUFBcEQsRUFBb0QsaUJBQ3BDLFNBQVMsQ0FBQyxTQUFpQixFQUFFLEtBQVksRUFBRSxPQUFnQjtXQUNsRSxXQUFXLENBQUMsU0FBUztRQUFJLE9BQU87UUFBRSxLQUFLOzs7QUFHaEQsRUFBb0QsQUFBcEQsZ0RBQW9ELEFBQXBELEVBQW9ELGlCQUNwQyxTQUFTLENBQ3ZCLE9BQTBCLEVBQzFCLEtBQVksRUFDWixPQUFnQjtXQUVULFdBQVcsQ0FBQyxPQUFPO1FBQUksT0FBTztRQUFFLEtBQUs7OztBQUc5QyxFQUEwRCxBQUExRCx3REFBMEQ7SUFDdEQscUJBQXFCLEdBQUcsQ0FBQztJQUN6QixLQUFLO0FBRVQsRUFBOEcsQUFBOUcsMEdBQThHLEFBQTlHLEVBQThHLHVCQUN4RixlQUFlLENBQUMsSUFBWTtJQUNoRCxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBQyxFQUFJLElBQUUsQ0FBRztVQUMxQixLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUk7VUFDL0MsTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBQyxLQUFPLEtBQUksQ0FBQztTQUVsRCxNQUFNLENBQUMsUUFBUSxFQUFDLENBQUcsSUFBRyxHQUFHLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsR0FBRztlQUU5QyxJQUFJLElBQUksS0FBSzthQUNqQixJQUFJLENBQUMsSUFBSTtjQUVSLFdBQVcsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ3BDLElBQUksQ0FBQyxNQUFNO2lCQUNSLFdBQVcsQ0FBQyxRQUFRLEVBQUMsR0FBSztZQUMvQixLQUFLLENBQUMsSUFBSSxFQUNQLFFBQVEsRUFDUCxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLEVBQUMsQ0FBRyxJQUM3RCxDQUFDLEVBQ0EsV0FBVyxDQUFDLFNBQVMsQ0FDbkIsV0FBVyxDQUFDLE9BQU8sRUFBQyxJQUFNLElBRTdCLENBQUMsRUFBRSxxQkFBcUIsQ0FBQyxFQUFFOzs7Y0FLMUIsZUFBZSxDQUFDLFdBQVc7O0lBR25DLHFCQUFxQjs7QUFHdkIsRUFBOEMsQUFBOUMsMENBQThDLEFBQTlDLEVBQThDLHVCQUN4QixVQUFVO1VBQ3hCLElBQUksQ0FBQyxhQUFhLEVBQ3RCLGFBQWUsR0FDZixLQUFLLENBQUMsSUFBSSxFQUFDLEVBQUksR0FBRSxVQUFVLEVBQUMsRUFBSSxJQUFFLENBQUc7VUFFakMsTUFBTSxJQUVSLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsRUFBQyxDQUFHLElBQzdELGVBQWUsRUFBRSxxQkFBcUI7SUFFekMsS0FBSzs7Z0JBR1MsT0FBTztVQUNmLEdBQUcsT0FBTyxJQUFJO1VBQ2QsS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRO1VBQ3BCLE1BQU0sR0FBRyxHQUFHLENBQUMsVUFBVTtRQUV6QixJQUFJLEdBQUcsS0FBSztRQUNaLE1BQU0sSUFBSSxFQUFFO1FBQ1osSUFBSSxHQUFHLEVBQUU7UUFDWCxNQUFNLElBQUksRUFBRTtRQUNaLElBQUksR0FBRyxJQUFJLEdBQUcsRUFBRTs7Y0FHUixJQUFJLElBQUksRUFBRSxHQUFHLElBQUksSUFBSSxDQUFDLEVBQUUsSUFBSSxHQUFHLENBQUMsRUFDeEMsTUFBTSxJQUFJLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxFQUFFLE1BQU0sR0FDbkMsQ0FBQyxFQUFFLE1BQU07O2dCQUdJLGtCQUFrQixDQUFDLE9BQWU7V0FDekMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsT0FBTyxLQUNuQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEdBQUcsZUFBZSxLQUFJLEtBQU87O0FBR3pELEVBQXNILEFBQXRILGtIQUFzSCxBQUF0SCxFQUFzSCx1QkFDaEcsc0JBQXNCLENBQzFDLFNBQWlCLEVBQ2pCLFFBQWdCLEVBQ2hCLE1BQWUsRUFDZixXQUFXLEdBQUcsQ0FBQyxFQUNmLGVBQWUsR0FBRyxZQUFZLENBQUMsTUFBTSxHQUFHLEVBQUUsRUFDMUMsU0FPQztJQUNDLEVBQWlDLEFBQWpDLCtCQUFpQztLQUNqQyxNQUFJLFVBQWEsT0FBTyxFQUFFLFdBQVcsR0FBSyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxFQUFFLENBQUM7O0tBQ3pFLE1BQUEsVUFBYSxPQUFPO2NBQ1osUUFBSSxTQUFTLFdBQVcsQ0FDaEMsU0FBUyxHQUNULDhFQUFnRjtjQUU1RSxNQUFNLFNBQVMsV0FBVyxDQUFDLFFBQVEsRUFBRSxTQUFTO2NBQzlDLGNBQWMsQ0FBQyxTQUFTO1lBQUcsUUFBUSxDQUFDLEVBQUU7WUFBRSxNQUFNLENBQUMsRUFBRTtXQUFHLEtBQUssQ0FDN0QsR0FBRyxDQUFDLEtBQUs7Y0FHTCxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU87WUFFakQsS0FBSyxDQUFDLGFBQWE7eUJBQ1IsV0FBVyxDQUFDLFNBQVMsR0FBRSwyQkFBNkI7O1lBRy9ELGFBQWEsR0FBRyxDQUFDLElBQUksYUFBYSxHQUFHLE1BQU0sQ0FBQyxNQUFNO3lCQUN2QyxXQUFXLENBQUMsU0FBUyxHQUFHLHlCQUF5Qjs7UUFHaEUsT0FBTyxDQUFDLGFBQWE7O0lBRXZCLEVBQWlDLEFBQWpDLCtCQUFpQztLQUNqQyxNQUFJLFVBQWEsT0FBTyxFQUFFLFdBQVcsRUFBRSxTQUFTLEdBQzFDLE9BQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsR0FBRyxDQUFDLEVBQUUsU0FBUzs7SUFDN0MsRUFBaUMsQUFBakMsK0JBQWlDO0tBQ2pDLE9BQUksVUFBYyxRQUFRLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxnQkFBZ0IsR0FDL0QsZ0JBQVc7O1FBR2hCLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQztRQUVuQixXQUFXLEdBQUcsV0FBVztVQUN2QixZQUFZLFNBQVMsU0FBUyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsV0FBVyxHQUFHLENBQUM7U0FFakUsWUFBWTtRQUViLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQztVQUVoQixZQUFZLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksRUFBRSxLQUFLLENBQ2pFLEdBQUcsQ0FBQyxLQUFLO1FBR1AsT0FBTyxHQUFHLEtBQUs7V0FFWCxPQUFPO2FBQ1IsWUFBWTtjQUVYLFFBQVEsU0FBUyxZQUFZLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxFQUFFO1lBQzNELFFBQVEsRUFBRSxlQUFlOzthQUV0QixRQUFRO1lBRVQsWUFBWSxDQUFDLE9BQU87a0JBQ2hCLGNBQWMsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxFQUFFLEVBQUUsUUFBUTtnQkFDcEUsTUFBTSxFQUFFLFFBQVE7ZUFDZixLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUs7O1lBR2hCLFNBQVMsQ0FBQyxRQUFRO2tCQUNkLFNBQVMsQ0FBQyxRQUFRLEdBQ3JCLE9BQU87Z0JBQ04sV0FBVyxHQUFHLE9BQU87ZUFFdkIsV0FBVyxFQUNYLE1BQU0sQ0FBQyxNQUFNO2dCQUVYLE9BQU8sR0FBRyxJQUFJO3NCQUNSLFlBQVksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLOzs7WUFNL0MsT0FBTyxLQUFLLFlBQVksV0FDaEIsU0FBUyxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsV0FBVyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUs7Ozs7O0FBTzlFLEVBQTZFLEFBQTdFLHlFQUE2RSxBQUE3RSxFQUE2RSx1QkFDdkQsNkJBQTZCLENBQ2pELFNBQWlCLEVBQ2pCLFNBQWlCLEVBQ2pCLFFBQWdCLEVBQ2hCLE1BQWUsRUFDZixXQUFXLEdBQUcsQ0FBQyxFQUNmLGFBQWEsR0FBRyxZQUFZLENBQUMsTUFBTSxHQUFHLEVBQUU7UUFFcEMsTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDO1FBRW5CLFdBQVcsR0FBRyxXQUFXO1VBRXZCLGdCQUFnQjs7Z0JBRWxCLElBQUksRUFBRSw0QkFBNEIsQ0FBQyxTQUFTO2dCQUM1QyxVQUFVOzt3QkFFTixJQUFJLEVBQUUsNEJBQTRCLENBQUMsTUFBTTt3QkFDekMsS0FBSyxHQUFFLFFBQVU7d0JBQ2pCLFFBQVEsS0FBSyxTQUFTLENBQUMsU0FBUzt3QkFDaEMsS0FBSyxFQUFFLG1CQUFtQixDQUFDLE9BQU87d0JBQ2xDLFFBQVEsRUFBRSxXQUFXLEtBQUssQ0FBQzt3QkFDM0IsS0FBSzs0QkFBSSxJQUFJLEdBQUUsTUFBSTs7Ozt3QkFHZixJQUFBLEVBQUUsNEJBQTRCLENBQUMsTUFBTTt3QkFDekMsS0FBSyxHQUFFLElBQU07d0JBQ2IsUUFBUSxLQUFLLFNBQVMsQ0FBQyxLQUFLO3dCQUM1QixLQUFLLEVBQUUsbUJBQW1CLENBQUMsT0FBTzt3QkFDbEMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQzt3QkFDNUIsS0FBSzs0QkFBSSxJQUFJLEdBQUUsTUFBSTs7Ozt3QkFHZixJQUFBLEVBQUUsNEJBQTRCLENBQUMsTUFBTTt3QkFDekMsS0FBSyxHQUFFLElBQU07d0JBQ2IsUUFBUSxLQUFLLFNBQVMsQ0FBQyxLQUFLO3dCQUM1QixLQUFLLEVBQUUsbUJBQW1CLENBQUMsT0FBTzt3QkFDbEMsUUFBUSxFQUFFLFdBQVcsSUFBSSxNQUFNLENBQUMsTUFBTTt3QkFDdEMsS0FBSzs0QkFBSSxJQUFJLEdBQUUsTUFBSTs7Ozt3QkFHZixJQUFBLEVBQUUsNEJBQTRCLENBQUMsTUFBTTt3QkFDekMsS0FBSyxHQUFFLE1BQVE7d0JBQ2YsUUFBUSxLQUFLLFNBQVMsQ0FBQyxPQUFPO3dCQUM5QixLQUFLLEVBQUUsbUJBQW1CLENBQUMsTUFBTTt3QkFDakMsS0FBSzs0QkFBSSxJQUFJLEdBQUUsT0FBSTs7Ozs7OztVQU1yQixZQUFZLFNBQVMsV0FBVyxDQUFDLFNBQVM7UUFDOUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxXQUFXLEdBQUcsQ0FBQztRQUM3QixVQUFVLEVBQUUsZ0JBQWdCOztTQUd6QixZQUFZO1FBRWIsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDO1FBRWxCLE9BQU8sR0FBRyxLQUFLO1dBRVgsT0FBTzthQUNSLFlBQVk7WUFDZixPQUFPLEdBQUcsSUFBSTs7O2NBSVYsZUFBZSxTQUFTLFVBQVUsQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLFNBQVM7WUFDdkUsUUFBUSxFQUFFLGFBQWE7O1FBR3pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZTthQUd4QixlQUFlLEtBQ2YsZUFBZSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFFBQVE7OztjQUtuRCxNQUFNLEdBQUcsZUFBZSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUMsQ0FBRyxHQUFFLENBQUM7ZUFFNUMsTUFBTTtrQkFDUCxJQUFNO2dCQUNULFdBQVcsSUFBSSxDQUFDOztZQUVsQixFQUF3QyxBQUF4QyxzQ0FBd0M7a0JBQ25DLElBQU07c0JBQ0gsdUJBQXVCLENBQzNCLGlCQUFpQixDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsRUFBRSxHQUNoRCxlQUFlLENBQUMsV0FBVyxDQUFDLEtBQUs7b0JBRS9CLElBQUksRUFBRSxDQUFDOztzQkFJTCxRQUFRLFNBQVMsV0FBVyxDQUNoQyxTQUFTLEdBQ1QsOEVBQWdGO3NCQUU1RSxNQUFNLFNBQVMsV0FBVyxDQUFDLFFBQVEsRUFBRSxTQUFTO3NCQUM5QyxjQUFjLENBQUMsU0FBUztvQkFBRyxRQUFRLENBQUMsRUFBRTtvQkFBRSxNQUFNLENBQUMsRUFBRTttQkFBRyxLQUFLLENBQzdELEdBQUcsQ0FBQyxLQUFLO3NCQUdMLGFBQWEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTztvQkFHbkQsS0FBSyxDQUFDLGFBQWEsS0FBSyxhQUFhLEdBQUcsQ0FBQyxJQUN6QyxhQUFhLEdBQUcsTUFBTSxDQUFDLE1BQU07MEJBRXZCLFdBQVcsQ0FBQyxTQUFTLEdBQUUsMkJBQTZCOzs7Z0JBSTVELFdBQVcsR0FBRyxhQUFhO2dCQUUzQixrQkFBa0IsQ0FDaEIsaUJBQWlCLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxhQUFhLEdBQzNELGVBQWUsQ0FBQyxXQUFXLENBQUMsS0FBSztvQkFFL0IsU0FBUyxFQUFFLFlBQVksQ0FBQyxFQUFFO29CQUMxQixNQUFNO3dCQUFHLE1BQU0sQ0FBQyxXQUFXLEdBQUcsQ0FBQzs7b0JBQy9CLFVBQVUsRUFBRSxnQkFBZ0I7OztrQkFLN0IsUUFBVTtnQkFDYixXQUFXLElBQUksQ0FBQzs7a0JBRWIsTUFBUTtnQkFDWCxhQUFhLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxFQUFFO2dCQUN4QyxPQUFPLEdBQUcsSUFBSTs7O1lBS2hCLE9BQU8sS0FDTixZQUFZLFdBQ0wsdUJBQXVCLENBQzdCLGlCQUFpQixDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsRUFBRSxHQUNoRCxlQUFlLENBQUMsV0FBVyxDQUFDLEtBQUs7WUFFL0IsSUFBSSxFQUFFLENBQUM7WUFDUCxJQUFJO2dCQUNGLE1BQU07b0JBQUcsTUFBTSxDQUFDLFdBQVcsR0FBRyxDQUFDOztnQkFDL0IsVUFBVSxFQUFFLGdCQUFnQjs7V0FHaEMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLOzs7OztnQkFPUCxZQUFZLENBQUMsS0FBWTtXQUNoQyxLQUFLLENBQUMsUUFBUSxJQUFJLEtBQUssQ0FBQyxFQUFFLElBQzVCLENBQUMsRUFBRSxLQUFLLENBQUMsUUFBUSxJQUFHLENBQUcsT0FBTSxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQ3pELEtBQUssQ0FBQyxJQUFJOztzQkFHTSxXQUFXLENBQUMsT0FBZSxFQUFFLEVBQW1CO1VBQzlELE1BQU0sVUFBVSxFQUFFLE1BQUssTUFBUSxJQUNqQyxFQUFFLENBQUMsVUFBVSxFQUFDLEVBQUksS0FDaEIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBQyxHQUFLLEtBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsS0FDL0QsTUFBTSxDQUFDLEVBQUUsSUFDWCxFQUFFO1VBRUEsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU87U0FDakMsS0FBSztVQUVKLFlBQVksR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNO1FBQ3pDLFlBQVksU0FBUyxZQUFZO1VBRS9CLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPO1VBRWxDLEtBQUssR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPO0lBQ25DLEVBQXdCLEFBQXhCLHNCQUF3QjtRQUNwQixLQUFLLEVBQUUsWUFBWSxJQUFJLEtBQUssQ0FBQyxZQUFZLEdBQUcsR0FBRztlQUMxQyxTQUFTLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxLQUFLLEtBQU8sU0FBUzs7O0lBR3pELEVBQTJFLEFBQTNFLHlFQUEyRTtVQUNyRSxNQUFNLFNBQVMsWUFBWSxDQUFDLE9BQU8sRUFBRSxPQUFPO1FBQ2hELE9BQU87WUFBRyxNQUFNOztRQUNoQixLQUFLLEVBQUUsQ0FBQztPQUNQLEtBQUssS0FBTyxTQUFTOztXQUVqQixNQUFNLEVBQUUsS0FBSzs7Z0JBR04sZ0JBQWdCLENBQUMsT0FBZTtRQUMxQyxFQUFFLENBQUMsU0FBUyxLQUFLLENBQUMsU0FBUyxDQUFDO1dBRXpCLE1BQU0sRUFBRSxPQUFPLElBQUksRUFBRyxBQUFILENBQUcsSUFBSSxNQUFNLENBQUMsRUFBRSxDQUFDLFNBQVMsR0FBRyxDQUFDIn0=