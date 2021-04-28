import { bot, DiscordenoMessage } from "../../deps.ts";

bot.monitors.set("messageCollector", {
  name: "messageCollector",
  ignoreDM: true,
  /** The main code that will be run when this monitor is triggered. */
  // deno-lint-ignore require-await
  execute: async function (message: DiscordenoMessage) {
    const collector = bot.messageCollectors.get(message.author.id);
    // This user has no collectors pending or the message is in a different channel
    if (!collector || message.channelId !== collector.channelId) return;
    // This message is a response to a collector. Now running the filter function.
    if (!collector.filter(message)) return;

    // If the necessary amount has been collected
    if (
      collector.amount === 1 ||
      collector.amount === collector.messages.length + 1
    ) {
      // Remove the collector
      bot.messageCollectors.delete(message.author.id);
      // Resolve the collector
      return collector.resolve([...collector.messages, message]);
    }

    // More messages still need to be collected
    collector.messages.push(message);
  },
});
