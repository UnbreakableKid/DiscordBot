import { bot, cache, DiscordChannelTypes } from "../../deps.ts";

bot.arguments.set("categorychannel", {
  name: "categorychannel",
  // deno-lint-ignore require-await
  execute: async function (_argument, parameters, message) {
    const [id] = parameters;
    if (!id) return;

    const guild = cache.guilds.get(message.guildId);
    if (!guild) return;

    const channelIDOrName = id.startsWith("<#")
      ? id.substring(2, id.length - 1)
      : id.toLowerCase();

    const channel = guild.channels.get(channelIDOrName) ||
      guild.channels.find((channel) => channel.name === channelIDOrName);

    if (channel?.type !== DiscordChannelTypes.GUILD_CATEGORY) return;

    return channel;
  },
});
