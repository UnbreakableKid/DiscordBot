import { configs } from "../../configs.ts";
import { bot } from "../../cache.ts";
import {
  bgBlack,
  bgGreen,
  bgMagenta,
  bgYellow,
  black,
  botId,
  cache,
  deleteMessages,
  green,
  red,
  white,
} from "../../deps.ts";
import { needMessage } from "../utils/collectors.ts";
import { handleError } from "../utils/errors.ts";
import { translate } from "../utils/i18next.ts";
import { log } from "../utils/logger.ts";
export function parsePrefix(guildId) {
  const prefix = guildId ? bot.guildPrefixes.get(guildId) : configs.prefix;
  return prefix || configs.prefix;
}
export function parseCommand(commandName) {
  const command = bot.commands.get(commandName);
  if (command) return command;
  // Check aliases if the command wasn't found
  return bot.commands.find((cmd) =>
    Boolean(cmd.aliases?.includes(commandName))
  );
}
export function logCommand(message, guildName, type, commandName) {
  const command = `[COMMAND: ${bgYellow(black(commandName || "Unknown"))} - ${
    bgBlack(
      [
          "Failure",
          "Slowmode",
          "Missing",
        ].includes(type)
        ? red(type)
        : type === "Success"
        ? green(type)
        : white(type),
    )
  }]`;
  const user = bgGreen(black(`${message.tag}(${message.authorId})`));
  const guild = bgMagenta(
    black(`${guildName}${message.guildId ? `(${message.guildId})` : ""}`),
  );
  log.info(`${command} by ${user} in ${guild} with MessageID: ${message.id}`);
}
async function parseArguments(
  message, // deno-lint-ignore no-explicit-any
  command,
  parameters,
) {
  const args = {};
  if (!command.arguments) return args;
  let missingRequiredArg = false;
  // Clone the parameters so we can modify it without editing original array
  const params = [
    ...parameters,
  ];
  // Loop over each argument and validate
  for (const argument of command.arguments) {
    const resolver = bot.arguments.get(argument.type || "string");
    if (!resolver) continue;
    const result = await resolver.execute(argument, params, message, command);
    if (result !== undefined) {
      // Assign the valid argument
      args[argument.name] = result;
      // This will use up all args so immediately exist the loop.
      if (
        argument.type && [
          "subcommands",
          "...strings",
          "...roles",
          "...emojis",
          "...snowflakes",
        ].includes(argument.type)
      ) {
        break;
      }
      // Remove a param for the next argument
      params.shift();
      continue;
    }
    // Invalid arg provided.
    if (Object.prototype.hasOwnProperty.call(argument, "defaultValue")) {
      args[argument.name] = argument.defaultValue;
    } else if (argument.required !== false) {
      if (argument.missing) {
        missingRequiredArg = true;
        argument.missing?.(message);
        break;
      }
      // A REQUIRED ARG WAS MISSING TRY TO COLLECT IT
      const question = await message.reply(
        translate(message.guildId, "strings:MISSING_REQUIRED_ARG", {
          name: argument.name,
          type: argument.type === "subcommand"
            ? command.subcommands?.map((sub) => sub.name).join(", ") ||
              "subcommand"
            : argument.type,
        }),
      ).catch(log.error);
      if (question) {
        const response = await needMessage(message.authorId, message.channelId)
          .catch(log.error);
        if (response) {
          const responseArg = await resolver.execute(
            argument,
            [
              response.content,
            ],
            message,
            command,
          );
          if (responseArg) {
            args[argument.name] = responseArg;
            params.shift();
            await deleteMessages(message.channelId, [
              question.id,
              response.id,
            ]).catch(log.error);
            continue;
          }
        }
      }
      // log.info("Required Arg Missing: ", message.content, command, argument);
      missingRequiredArg = true;
      argument.missing?.(message);
      break;
    }
  }
  // If an arg was missing then return false so we can error out as an object {} will always be truthy
  return missingRequiredArg ? false : args;
}
/** Runs the inhibitors to see if a command is allowed to run. */ async function commandAllowed(
  message, // deno-lint-ignore no-explicit-any
  command,
) {
  const inhibitorResults = await Promise.all([
    ...bot.inhibitors.values(),
  ].map((inhibitor) => inhibitor(message, command)));
  if (inhibitorResults.includes(true)) {
    logCommand(message, message.guild?.name || "DM", "Inhibit", command.name);
    return false;
  }
  return true;
}
async function executeCommand(
  message, // deno-lint-ignore no-explicit-any
  command,
  parameters,
) {
  try {
    // bot.slowmode.set(message.author.id, message.timestamp);
    // Parsed args and validated
    const args = await parseArguments(message, command, parameters);
    // Some arg that was required was missing and handled already
    if (!args) {
      return logCommand(
        message,
        message.guild?.name || "DM",
        "Missing",
        command.name,
      );
    }
    // If no subcommand execute the command
    const [argument] = command.arguments || [];
    const subcommand = argument ? args[argument.name] : undefined;
    if (!argument || argument.type !== "subcommand" || !subcommand) {
      // Check subcommand permissions and options
      if (!await commandAllowed(message, command)) return;
      // @ts-ignore - a comment to satisfy lint
      await command.execute?.(message, args);
      return logCommand(
        message,
        message.guild?.name || "DM",
        "Success",
        command.name,
      );
    }
    // A subcommand was asked for in this command
    if (
      ![
        subcommand.name,
        ...subcommand.aliases || [],
      ].includes(parameters[0])
    ) {
      executeCommand(message, subcommand, parameters);
    } else {
      const subParameters = parameters.slice(1);
      executeCommand(message, subcommand, subParameters);
    }
  } catch (error) {
    log.error(error);
    logCommand(message, message.guild?.name || "DM", "Failure", command.name);
    handleError(message, error);
  }
}
// The monitor itself for this file. Above is helper functions for this monitor.
bot.monitors.set("commandHandler", {
  name: "commandHandler",
  ignoreDM: false,
  /** The main code that will be run when this monitor is triggered. */
  // deno-lint-ignore require-await
  execute: async function (message) {
    // If the message was sent by a bot we can just ignore it
    if (message.isBot) return;
    let prefix = parsePrefix(message.guildId);
    const botMention = `<@!${botId}>`;
    const botPhoneMention = `<@${botId}>`;
    // If the message is not using the valid prefix or bot mention cancel the command
    if (
      [
        botMention,
        botPhoneMention,
      ].includes(message.content)
    ) {
      return message.reply(parsePrefix(message.guildId));
    } else if (message.content.startsWith(botMention)) prefix = botMention;
    else if (message.content.startsWith(botPhoneMention)) {
      prefix = botPhoneMention;
    } else if (!message.content.startsWith(prefix)) return;
    // Get the first word of the message without the prefix so it is just command name. `!ping testing` becomes `ping`
    const [commandName, ...parameters] = message.content.substring(
      prefix.length,
    ).split(" ");
    // Check if this is a valid command
    const command = parseCommand(commandName);
    if (!command) return;
    const guild = cache.guilds.get(message.guildId);
    logCommand(message, guild?.name || "DM", "Trigger", commandName);
    // const lastUsed = bot.slowmode.get(message.author.id);
    // Check if this user is spamming by checking slowmode
    // if (lastUsed && message.timestamp - lastUsed < 2000) {
    //   if (message.guildId) {
    //     await deleteMessage(
    //       message,
    //       translate(message.guildId, "strings:CLEAR_SPAM"),
    //     ).catch(log.error);
    //   }
    //   return logCommand(message, guild?.name || "DM", "Slowmode", commandName);
    // }
    executeCommand(message, command, parameters);
  },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL21vbml0b3JzL2NvbW1hbmRfaGFuZGxlci50cyM0PiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjb25maWdzIH0gZnJvbSBcIi4uLy4uL2NvbmZpZ3MudHNcIjtcbmltcG9ydCB7IGJvdCB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuaW1wb3J0IHtcbiAgYmdCbGFjayxcbiAgYmdHcmVlbixcbiAgYmdNYWdlbnRhLFxuICBiZ1llbGxvdyxcbiAgYmxhY2ssXG4gIGJvdElkLFxuICBjYWNoZSxcbiAgZGVsZXRlTWVzc2FnZXMsXG4gIERpc2NvcmRlbm9NZXNzYWdlLFxuICBncmVlbixcbiAgcmVkLFxuICB3aGl0ZSxcbn0gZnJvbSBcIi4uLy4uL2RlcHMudHNcIjtcbmltcG9ydCB7IENvbW1hbmQgfSBmcm9tIFwiLi4vdHlwZXMvY29tbWFuZHMudHNcIjtcbmltcG9ydCB7IG5lZWRNZXNzYWdlIH0gZnJvbSBcIi4uL3V0aWxzL2NvbGxlY3RvcnMudHNcIjtcbmltcG9ydCB7IGhhbmRsZUVycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9ycy50c1wiO1xuaW1wb3J0IHsgdHJhbnNsYXRlIH0gZnJvbSBcIi4uL3V0aWxzL2kxOG5leHQudHNcIjtcbmltcG9ydCB7IGxvZyB9IGZyb20gXCIuLi91dGlscy9sb2dnZXIudHNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUHJlZml4KGd1aWxkSWQ6IGJpZ2ludCB8IHVuZGVmaW5lZCkge1xuICBjb25zdCBwcmVmaXggPSBndWlsZElkID8gYm90Lmd1aWxkUHJlZml4ZXMuZ2V0KGd1aWxkSWQpIDogY29uZmlncy5wcmVmaXg7XG4gIHJldHVybiBwcmVmaXggfHwgY29uZmlncy5wcmVmaXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUNvbW1hbmQoY29tbWFuZE5hbWU6IHN0cmluZykge1xuICBjb25zdCBjb21tYW5kID0gYm90LmNvbW1hbmRzLmdldChjb21tYW5kTmFtZSk7XG4gIGlmIChjb21tYW5kKSByZXR1cm4gY29tbWFuZDtcblxuICAvLyBDaGVjayBhbGlhc2VzIGlmIHRoZSBjb21tYW5kIHdhc24ndCBmb3VuZFxuICByZXR1cm4gYm90LmNvbW1hbmRzLmZpbmQoKGNtZCkgPT5cbiAgICBCb29sZWFuKGNtZC5hbGlhc2VzPy5pbmNsdWRlcyhjb21tYW5kTmFtZSkpXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2dDb21tYW5kKFxuICBtZXNzYWdlOiBEaXNjb3JkZW5vTWVzc2FnZSxcbiAgZ3VpbGROYW1lOiBzdHJpbmcsXG4gIHR5cGU6IFwiRmFpbHVyZVwiIHwgXCJTdWNjZXNzXCIgfCBcIlRyaWdnZXJcIiB8IFwiU2xvd21vZGVcIiB8IFwiTWlzc2luZ1wiIHwgXCJJbmhpYml0XCIsXG4gIGNvbW1hbmROYW1lOiBzdHJpbmcsXG4pIHtcbiAgY29uc3QgY29tbWFuZCA9IGBbQ09NTUFORDogJHtiZ1llbGxvdyhibGFjayhjb21tYW5kTmFtZSB8fCBcIlVua25vd25cIikpfSAtICR7XG4gICAgYmdCbGFjayhcbiAgICAgIFtcIkZhaWx1cmVcIiwgXCJTbG93bW9kZVwiLCBcIk1pc3NpbmdcIl0uaW5jbHVkZXModHlwZSlcbiAgICAgICAgPyByZWQodHlwZSlcbiAgICAgICAgOiB0eXBlID09PSBcIlN1Y2Nlc3NcIlxuICAgICAgICA/IGdyZWVuKHR5cGUpXG4gICAgICAgIDogd2hpdGUodHlwZSksXG4gICAgKVxuICB9XWA7XG5cbiAgY29uc3QgdXNlciA9IGJnR3JlZW4oYmxhY2soYCR7bWVzc2FnZS50YWd9KCR7bWVzc2FnZS5hdXRob3JJZH0pYCkpO1xuICBjb25zdCBndWlsZCA9IGJnTWFnZW50YShcbiAgICBibGFjayhgJHtndWlsZE5hbWV9JHttZXNzYWdlLmd1aWxkSWQgPyBgKCR7bWVzc2FnZS5ndWlsZElkfSlgIDogXCJcIn1gKSxcbiAgKTtcblxuICBsb2cuaW5mbyhgJHtjb21tYW5kfSBieSAke3VzZXJ9IGluICR7Z3VpbGR9IHdpdGggTWVzc2FnZUlEOiAke21lc3NhZ2UuaWR9YCk7XG59IC8qKiBQYXJzZXMgYWxsIHRoZSBhcmd1bWVudHMgZm9yIHRoZSBjb21tYW5kIGJhc2VkIG9uIHRoZSBtZXNzYWdlIHNlbnQgYnkgdGhlIHVzZXIuICovXG5cbmFzeW5jIGZ1bmN0aW9uIHBhcnNlQXJndW1lbnRzKFxuICBtZXNzYWdlOiBEaXNjb3JkZW5vTWVzc2FnZSxcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgY29tbWFuZDogQ29tbWFuZDxhbnk+LFxuICBwYXJhbWV0ZXJzOiBzdHJpbmdbXSxcbikge1xuICBjb25zdCBhcmdzOiB7IFtrZXk6IHN0cmluZ106IHVua25vd24gfSA9IHt9O1xuICBpZiAoIWNvbW1hbmQuYXJndW1lbnRzKSByZXR1cm4gYXJncztcblxuICBsZXQgbWlzc2luZ1JlcXVpcmVkQXJnID0gZmFsc2U7XG5cbiAgLy8gQ2xvbmUgdGhlIHBhcmFtZXRlcnMgc28gd2UgY2FuIG1vZGlmeSBpdCB3aXRob3V0IGVkaXRpbmcgb3JpZ2luYWwgYXJyYXlcbiAgY29uc3QgcGFyYW1zID0gWy4uLnBhcmFtZXRlcnNdO1xuXG4gIC8vIExvb3Agb3ZlciBlYWNoIGFyZ3VtZW50IGFuZCB2YWxpZGF0ZVxuICBmb3IgKGNvbnN0IGFyZ3VtZW50IG9mIGNvbW1hbmQuYXJndW1lbnRzKSB7XG4gICAgY29uc3QgcmVzb2x2ZXIgPSBib3QuYXJndW1lbnRzLmdldChhcmd1bWVudC50eXBlIHx8IFwic3RyaW5nXCIpO1xuICAgIGlmICghcmVzb2x2ZXIpIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzb2x2ZXIuZXhlY3V0ZShhcmd1bWVudCwgcGFyYW1zLCBtZXNzYWdlLCBjb21tYW5kKTtcbiAgICBpZiAocmVzdWx0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIEFzc2lnbiB0aGUgdmFsaWQgYXJndW1lbnRcbiAgICAgIGFyZ3NbYXJndW1lbnQubmFtZV0gPSByZXN1bHQ7XG4gICAgICAvLyBUaGlzIHdpbGwgdXNlIHVwIGFsbCBhcmdzIHNvIGltbWVkaWF0ZWx5IGV4aXN0IHRoZSBsb29wLlxuICAgICAgaWYgKFxuICAgICAgICBhcmd1bWVudC50eXBlICYmXG4gICAgICAgIFtcInN1YmNvbW1hbmRzXCIsIFwiLi4uc3RyaW5nc1wiLCBcIi4uLnJvbGVzXCIsIFwiLi4uZW1vamlzXCIsIFwiLi4uc25vd2ZsYWtlc1wiXVxuICAgICAgICAgIC5pbmNsdWRlcyhhcmd1bWVudC50eXBlKVxuICAgICAgKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgLy8gUmVtb3ZlIGEgcGFyYW0gZm9yIHRoZSBuZXh0IGFyZ3VtZW50XG4gICAgICBwYXJhbXMuc2hpZnQoKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIEludmFsaWQgYXJnIHByb3ZpZGVkLlxuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYXJndW1lbnQsIFwiZGVmYXVsdFZhbHVlXCIpKSB7XG4gICAgICBhcmdzW2FyZ3VtZW50Lm5hbWVdID0gYXJndW1lbnQuZGVmYXVsdFZhbHVlO1xuICAgIH0gZWxzZSBpZiAoYXJndW1lbnQucmVxdWlyZWQgIT09IGZhbHNlKSB7XG4gICAgICBpZiAoYXJndW1lbnQubWlzc2luZykge1xuICAgICAgICBtaXNzaW5nUmVxdWlyZWRBcmcgPSB0cnVlO1xuICAgICAgICBhcmd1bWVudC5taXNzaW5nPy4obWVzc2FnZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBBIFJFUVVJUkVEIEFSRyBXQVMgTUlTU0lORyBUUlkgVE8gQ09MTEVDVCBJVFxuICAgICAgY29uc3QgcXVlc3Rpb24gPSBhd2FpdCBtZXNzYWdlXG4gICAgICAgIC5yZXBseShcbiAgICAgICAgICB0cmFuc2xhdGUobWVzc2FnZS5ndWlsZElkLCBcInN0cmluZ3M6TUlTU0lOR19SRVFVSVJFRF9BUkdcIiwge1xuICAgICAgICAgICAgbmFtZTogYXJndW1lbnQubmFtZSxcbiAgICAgICAgICAgIHR5cGU6IGFyZ3VtZW50LnR5cGUgPT09IFwic3ViY29tbWFuZFwiXG4gICAgICAgICAgICAgID8gY29tbWFuZC5zdWJjb21tYW5kcz8ubWFwKChzdWIpID0+IHN1Yi5uYW1lKS5qb2luKFwiLCBcIikgfHxcbiAgICAgICAgICAgICAgICBcInN1YmNvbW1hbmRcIlxuICAgICAgICAgICAgICA6IGFyZ3VtZW50LnR5cGUsXG4gICAgICAgICAgfSksXG4gICAgICAgIClcbiAgICAgICAgLmNhdGNoKGxvZy5lcnJvcik7XG4gICAgICBpZiAocXVlc3Rpb24pIHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBuZWVkTWVzc2FnZShtZXNzYWdlLmF1dGhvcklkLCBtZXNzYWdlLmNoYW5uZWxJZClcbiAgICAgICAgICAuY2F0Y2gobG9nLmVycm9yKTtcbiAgICAgICAgaWYgKHJlc3BvbnNlKSB7XG4gICAgICAgICAgY29uc3QgcmVzcG9uc2VBcmcgPSBhd2FpdCByZXNvbHZlci5leGVjdXRlKFxuICAgICAgICAgICAgYXJndW1lbnQsXG4gICAgICAgICAgICBbcmVzcG9uc2UuY29udGVudF0sXG4gICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgY29tbWFuZCxcbiAgICAgICAgICApO1xuICAgICAgICAgIGlmIChyZXNwb25zZUFyZykge1xuICAgICAgICAgICAgYXJnc1thcmd1bWVudC5uYW1lXSA9IHJlc3BvbnNlQXJnO1xuICAgICAgICAgICAgcGFyYW1zLnNoaWZ0KCk7XG4gICAgICAgICAgICBhd2FpdCBkZWxldGVNZXNzYWdlcyhtZXNzYWdlLmNoYW5uZWxJZCwgW3F1ZXN0aW9uLmlkLCByZXNwb25zZS5pZF0pXG4gICAgICAgICAgICAgIC5jYXRjaChsb2cuZXJyb3IpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIGxvZy5pbmZvKFwiUmVxdWlyZWQgQXJnIE1pc3Npbmc6IFwiLCBtZXNzYWdlLmNvbnRlbnQsIGNvbW1hbmQsIGFyZ3VtZW50KTtcbiAgICAgIG1pc3NpbmdSZXF1aXJlZEFyZyA9IHRydWU7XG4gICAgICBhcmd1bWVudC5taXNzaW5nPy4obWVzc2FnZSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvLyBJZiBhbiBhcmcgd2FzIG1pc3NpbmcgdGhlbiByZXR1cm4gZmFsc2Ugc28gd2UgY2FuIGVycm9yIG91dCBhcyBhbiBvYmplY3Qge30gd2lsbCBhbHdheXMgYmUgdHJ1dGh5XG4gIHJldHVybiBtaXNzaW5nUmVxdWlyZWRBcmcgPyBmYWxzZSA6IGFyZ3M7XG59XG5cbi8qKiBSdW5zIHRoZSBpbmhpYml0b3JzIHRvIHNlZSBpZiBhIGNvbW1hbmQgaXMgYWxsb3dlZCB0byBydW4uICovXG5hc3luYyBmdW5jdGlvbiBjb21tYW5kQWxsb3dlZChcbiAgbWVzc2FnZTogRGlzY29yZGVub01lc3NhZ2UsXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGNvbW1hbmQ6IENvbW1hbmQ8YW55Pixcbikge1xuICBjb25zdCBpbmhpYml0b3JSZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgWy4uLmJvdC5pbmhpYml0b3JzLnZhbHVlcygpXS5tYXAoKGluaGliaXRvcikgPT5cbiAgICAgIGluaGliaXRvcihtZXNzYWdlLCBjb21tYW5kKVxuICAgICksXG4gICk7XG5cbiAgaWYgKGluaGliaXRvclJlc3VsdHMuaW5jbHVkZXModHJ1ZSkpIHtcbiAgICBsb2dDb21tYW5kKG1lc3NhZ2UsIG1lc3NhZ2UuZ3VpbGQ/Lm5hbWUgfHwgXCJETVwiLCBcIkluaGliaXRcIiwgY29tbWFuZC5uYW1lKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZXhlY3V0ZUNvbW1hbmQoXG4gIG1lc3NhZ2U6IERpc2NvcmRlbm9NZXNzYWdlLFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBjb21tYW5kOiBDb21tYW5kPGFueT4sXG4gIHBhcmFtZXRlcnM6IHN0cmluZ1tdLFxuKSB7XG4gIHRyeSB7XG4gICAgLy8gYm90LnNsb3dtb2RlLnNldChtZXNzYWdlLmF1dGhvci5pZCwgbWVzc2FnZS50aW1lc3RhbXApO1xuXG4gICAgLy8gUGFyc2VkIGFyZ3MgYW5kIHZhbGlkYXRlZFxuICAgIGNvbnN0IGFyZ3MgPSBhd2FpdCBwYXJzZUFyZ3VtZW50cyhtZXNzYWdlLCBjb21tYW5kLCBwYXJhbWV0ZXJzKTtcbiAgICAvLyBTb21lIGFyZyB0aGF0IHdhcyByZXF1aXJlZCB3YXMgbWlzc2luZyBhbmQgaGFuZGxlZCBhbHJlYWR5XG4gICAgaWYgKCFhcmdzKSB7XG4gICAgICByZXR1cm4gbG9nQ29tbWFuZChcbiAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgbWVzc2FnZS5ndWlsZD8ubmFtZSB8fCBcIkRNXCIsXG4gICAgICAgIFwiTWlzc2luZ1wiLFxuICAgICAgICBjb21tYW5kLm5hbWUsXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIElmIG5vIHN1YmNvbW1hbmQgZXhlY3V0ZSB0aGUgY29tbWFuZFxuICAgIGNvbnN0IFthcmd1bWVudF0gPSBjb21tYW5kLmFyZ3VtZW50cyB8fCBbXTtcbiAgICBjb25zdCBzdWJjb21tYW5kID0gYXJndW1lbnRcbiAgICAgID8gLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAgICAgKGFyZ3NbYXJndW1lbnQubmFtZV0gYXMgQ29tbWFuZDxhbnk+KVxuICAgICAgOiB1bmRlZmluZWQ7XG5cbiAgICBpZiAoIWFyZ3VtZW50IHx8IGFyZ3VtZW50LnR5cGUgIT09IFwic3ViY29tbWFuZFwiIHx8ICFzdWJjb21tYW5kKSB7XG4gICAgICAvLyBDaGVjayBzdWJjb21tYW5kIHBlcm1pc3Npb25zIGFuZCBvcHRpb25zXG4gICAgICBpZiAoIShhd2FpdCBjb21tYW5kQWxsb3dlZChtZXNzYWdlLCBjb21tYW5kKSkpIHJldHVybjtcblxuICAgICAgLy8gQHRzLWlnbm9yZSAtIGEgY29tbWVudCB0byBzYXRpc2Z5IGxpbnRcbiAgICAgIGF3YWl0IGNvbW1hbmQuZXhlY3V0ZT8uKG1lc3NhZ2UsIGFyZ3MpO1xuICAgICAgcmV0dXJuIGxvZ0NvbW1hbmQoXG4gICAgICAgIG1lc3NhZ2UsXG4gICAgICAgIG1lc3NhZ2UuZ3VpbGQ/Lm5hbWUgfHwgXCJETVwiLFxuICAgICAgICBcIlN1Y2Nlc3NcIixcbiAgICAgICAgY29tbWFuZC5uYW1lLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBBIHN1YmNvbW1hbmQgd2FzIGFza2VkIGZvciBpbiB0aGlzIGNvbW1hbmRcbiAgICBpZiAoXG4gICAgICAhW3N1YmNvbW1hbmQubmFtZSwgLi4uKHN1YmNvbW1hbmQuYWxpYXNlcyB8fCBbXSldLmluY2x1ZGVzKHBhcmFtZXRlcnNbMF0pXG4gICAgKSB7XG4gICAgICBleGVjdXRlQ29tbWFuZChtZXNzYWdlLCBzdWJjb21tYW5kLCBwYXJhbWV0ZXJzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgc3ViUGFyYW1ldGVycyA9IHBhcmFtZXRlcnMuc2xpY2UoMSk7XG4gICAgICBleGVjdXRlQ29tbWFuZChtZXNzYWdlLCBzdWJjb21tYW5kLCBzdWJQYXJhbWV0ZXJzKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgbG9nLmVycm9yKGVycm9yKTtcbiAgICBsb2dDb21tYW5kKG1lc3NhZ2UsIG1lc3NhZ2UuZ3VpbGQ/Lm5hbWUgfHwgXCJETVwiLCBcIkZhaWx1cmVcIiwgY29tbWFuZC5uYW1lKTtcbiAgICBoYW5kbGVFcnJvcihtZXNzYWdlLCBlcnJvcik7XG4gIH1cbn1cblxuLy8gVGhlIG1vbml0b3IgaXRzZWxmIGZvciB0aGlzIGZpbGUuIEFib3ZlIGlzIGhlbHBlciBmdW5jdGlvbnMgZm9yIHRoaXMgbW9uaXRvci5cbmJvdC5tb25pdG9ycy5zZXQoXCJjb21tYW5kSGFuZGxlclwiLCB7XG4gIG5hbWU6IFwiY29tbWFuZEhhbmRsZXJcIixcbiAgaWdub3JlRE06IGZhbHNlLFxuICAvKiogVGhlIG1haW4gY29kZSB0aGF0IHdpbGwgYmUgcnVuIHdoZW4gdGhpcyBtb25pdG9yIGlzIHRyaWdnZXJlZC4gKi9cbiAgLy8gZGVuby1saW50LWlnbm9yZSByZXF1aXJlLWF3YWl0XG4gIGV4ZWN1dGU6IGFzeW5jIGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgLy8gSWYgdGhlIG1lc3NhZ2Ugd2FzIHNlbnQgYnkgYSBib3Qgd2UgY2FuIGp1c3QgaWdub3JlIGl0XG4gICAgaWYgKG1lc3NhZ2UuaXNCb3QpIHJldHVybjtcblxuICAgIGxldCBwcmVmaXggPSBwYXJzZVByZWZpeChtZXNzYWdlLmd1aWxkSWQpO1xuICAgIGNvbnN0IGJvdE1lbnRpb24gPSBgPEAhJHtib3RJZH0+YDtcbiAgICBjb25zdCBib3RQaG9uZU1lbnRpb24gPSBgPEAke2JvdElkfT5gO1xuXG4gICAgLy8gSWYgdGhlIG1lc3NhZ2UgaXMgbm90IHVzaW5nIHRoZSB2YWxpZCBwcmVmaXggb3IgYm90IG1lbnRpb24gY2FuY2VsIHRoZSBjb21tYW5kXG4gICAgaWYgKFtib3RNZW50aW9uLCBib3RQaG9uZU1lbnRpb25dLmluY2x1ZGVzKG1lc3NhZ2UuY29udGVudCkpIHtcbiAgICAgIHJldHVybiBtZXNzYWdlLnJlcGx5KHBhcnNlUHJlZml4KG1lc3NhZ2UuZ3VpbGRJZCkpO1xuICAgIH0gZWxzZSBpZiAobWVzc2FnZS5jb250ZW50LnN0YXJ0c1dpdGgoYm90TWVudGlvbikpIHByZWZpeCA9IGJvdE1lbnRpb247XG4gICAgZWxzZSBpZiAobWVzc2FnZS5jb250ZW50LnN0YXJ0c1dpdGgoYm90UGhvbmVNZW50aW9uKSkge1xuICAgICAgcHJlZml4ID0gYm90UGhvbmVNZW50aW9uO1xuICAgIH0gZWxzZSBpZiAoIW1lc3NhZ2UuY29udGVudC5zdGFydHNXaXRoKHByZWZpeCkpIHJldHVybjtcblxuICAgIC8vIEdldCB0aGUgZmlyc3Qgd29yZCBvZiB0aGUgbWVzc2FnZSB3aXRob3V0IHRoZSBwcmVmaXggc28gaXQgaXMganVzdCBjb21tYW5kIG5hbWUuIGAhcGluZyB0ZXN0aW5nYCBiZWNvbWVzIGBwaW5nYFxuICAgIGNvbnN0IFtjb21tYW5kTmFtZSwgLi4ucGFyYW1ldGVyc10gPSBtZXNzYWdlLmNvbnRlbnQuc3Vic3RyaW5nKFxuICAgICAgcHJlZml4Lmxlbmd0aCxcbiAgICApLnNwbGl0KFwiIFwiKTtcblxuICAgIC8vIENoZWNrIGlmIHRoaXMgaXMgYSB2YWxpZCBjb21tYW5kXG4gICAgY29uc3QgY29tbWFuZCA9IHBhcnNlQ29tbWFuZChjb21tYW5kTmFtZSk7XG4gICAgaWYgKCFjb21tYW5kKSByZXR1cm47XG5cbiAgICBjb25zdCBndWlsZCA9IGNhY2hlLmd1aWxkcy5nZXQobWVzc2FnZS5ndWlsZElkKTtcbiAgICBsb2dDb21tYW5kKG1lc3NhZ2UsIGd1aWxkPy5uYW1lIHx8IFwiRE1cIiwgXCJUcmlnZ2VyXCIsIGNvbW1hbmROYW1lKTtcblxuICAgIC8vIGNvbnN0IGxhc3RVc2VkID0gYm90LnNsb3dtb2RlLmdldChtZXNzYWdlLmF1dGhvci5pZCk7XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyB1c2VyIGlzIHNwYW1taW5nIGJ5IGNoZWNraW5nIHNsb3dtb2RlXG4gICAgLy8gaWYgKGxhc3RVc2VkICYmIG1lc3NhZ2UudGltZXN0YW1wIC0gbGFzdFVzZWQgPCAyMDAwKSB7XG4gICAgLy8gICBpZiAobWVzc2FnZS5ndWlsZElkKSB7XG4gICAgLy8gICAgIGF3YWl0IGRlbGV0ZU1lc3NhZ2UoXG4gICAgLy8gICAgICAgbWVzc2FnZSxcbiAgICAvLyAgICAgICB0cmFuc2xhdGUobWVzc2FnZS5ndWlsZElkLCBcInN0cmluZ3M6Q0xFQVJfU1BBTVwiKSxcbiAgICAvLyAgICAgKS5jYXRjaChsb2cuZXJyb3IpO1xuICAgIC8vICAgfVxuXG4gICAgLy8gICByZXR1cm4gbG9nQ29tbWFuZChtZXNzYWdlLCBndWlsZD8ubmFtZSB8fCBcIkRNXCIsIFwiU2xvd21vZGVcIiwgY29tbWFuZE5hbWUpO1xuICAgIC8vIH1cblxuICAgIGV4ZWN1dGVDb21tYW5kKG1lc3NhZ2UsIGNvbW1hbmQsIHBhcmFtZXRlcnMpO1xuICB9LFxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsT0FBTyxTQUFRLGdCQUFrQjtTQUNqQyxHQUFHLFNBQVEsY0FBZ0I7U0FFbEMsT0FBTyxFQUNQLE9BQU8sRUFDUCxTQUFTLEVBQ1QsUUFBUSxFQUNSLEtBQUssRUFDTCxLQUFLLEVBQ0wsS0FBSyxFQUNMLGNBQWMsRUFFZCxLQUFLLEVBQ0wsR0FBRyxFQUNILEtBQUssU0FDQSxhQUFlO1NBRWIsV0FBVyxTQUFRLHNCQUF3QjtTQUMzQyxXQUFXLFNBQVEsa0JBQW9CO1NBQ3ZDLFNBQVMsU0FBUSxtQkFBcUI7U0FDdEMsR0FBRyxTQUFRLGtCQUFvQjtnQkFFeEIsV0FBVyxDQUFDLE9BQTJCO1VBQy9DLE1BQU0sR0FBRyxPQUFPLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxNQUFNO1dBQ2pFLE1BQU0sSUFBSSxPQUFPLENBQUMsTUFBTTs7Z0JBR2pCLFlBQVksQ0FBQyxXQUFtQjtVQUN4QyxPQUFPLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsV0FBVztRQUN4QyxPQUFPLFNBQVMsT0FBTztJQUUzQixFQUE0QyxBQUE1QywwQ0FBNEM7V0FDckMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxHQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsV0FBVzs7O2dCQUk3QixVQUFVLENBQ3hCLE9BQTBCLEVBQzFCLFNBQWlCLEVBQ2pCLElBQTRFLEVBQzVFLFdBQW1CO1VBRWIsT0FBTyxJQUFJLFVBQVUsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLFdBQVcsS0FBSSxPQUFTLElBQUcsR0FB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
