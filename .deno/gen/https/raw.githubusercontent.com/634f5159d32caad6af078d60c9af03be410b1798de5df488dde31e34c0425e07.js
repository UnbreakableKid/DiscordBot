import { eventHandlers } from "../bot.ts";
import { cache, cacheHandlers } from "../cache.ts";
import { sendDirectMessage } from "../helpers/members/send_direct_message.ts";
import { addReaction } from "../helpers/messages/add_reaction.ts";
import { addReactions } from "../helpers/messages/add_reactions.ts";
import { deleteMessage } from "../helpers/messages/delete_message.ts";
import { editMessage } from "../helpers/messages/edit_message.ts";
import { pinMessage } from "../helpers/messages/pin_message.ts";
import { removeAllReactions } from "../helpers/messages/remove_all_reactions.ts";
import { removeReaction } from "../helpers/messages/remove_reaction.ts";
import { removeReactionEmoji } from "../helpers/messages/remove_reaction_emoji.ts";
import { sendMessage } from "../helpers/messages/send_message.ts";
import { bigintToSnowflake, snowflakeToBigint } from "../util/bigint.ts";
import { CHANNEL_MENTION_REGEX } from "../util/constants.ts";
import { createNewProp } from "../util/utils.ts";
const MESSAGE_SNOWFLAKES = [
  "id",
  "channelId",
  "guildId",
  "webhookId",
  "applicationId",
];
const messageToggles = {
  /** Whether this was a TTS message */ tts: 1n,
  /** Whether this message mentions everyone */ mentionEveryone: 2n,
  /** Whether this message is pinned */ pinned: 4n,
};
const baseMessage = {
  get channel() {
    if (this.guildId) return cache.channels.get(this.channelId);
    return cache.channels.get(this.authorId);
  },
  get guild() {
    if (!this.guildId) return undefined;
    return cache.guilds.get(this.guildId);
  },
  get member() {
    if (!this.authorId) return undefined;
    return cache.members.get(this.authorId);
  },
  get guildMember() {
    if (!this.guildId) return undefined;
    return this.member?.guilds.get(this.guildId);
  },
  get link() {
    return `https://discord.com/channels/${this.guildId ||
      "@me"}/${this.channelId}/${this.id}`;
  },
  get mentionedRoles() {
    return this.mentionedRoleIds?.map((id) => this.guild?.roles.get(id)) || [];
  },
  get mentionedChannels() {
    return this.mentionedChannelIds?.map((id) => cache.channels.get(id)) || [];
  },
  get mentionedMembers() {
    return this.mentionedUserIds?.map((id) => cache.members.get(id)) || [];
  },
  // METHODS
  delete(reason, delayMilliseconds) {
    return deleteMessage(this.channelId, this.id, reason, delayMilliseconds);
  },
  edit(content) {
    return editMessage(this, content);
  },
  pin() {
    return pinMessage(this.channelId, this.id);
  },
  addReaction(reaction) {
    return addReaction(this.channelId, this.id, reaction);
  },
  addReactions(reactions, ordered) {
    return addReactions(this.channelId, this.id, reactions, ordered);
  },
  reply(content) {
    const contentWithMention = typeof content === "string"
      ? {
        content,
        allowedMentions: {
          repliedUser: true,
        },
        messageReference: {
          messageId: bigintToSnowflake(this.id),
          failIfNotExists: false,
        },
      }
      : {
        ...content,
        allowedMentions: {
          ...content.allowedMentions || {},
          repliedUser: true,
        },
        messageReference: {
          messageId: bigintToSnowflake(this.id),
          failIfNotExists: content.messageReference?.failIfNotExists === true,
        },
      };
    if (this.guildId) return sendMessage(this.channelId, contentWithMention);
    return sendDirectMessage(this.authorId, contentWithMention);
  },
  send(content) {
    if (this.guildId) return sendMessage(this.channelId, content);
    return sendDirectMessage(this.authorId, content);
  },
  async alert(content, timeout = 10, reason = "") {
    if (this.guildId) {
      return await sendMessage(this.channelId, content).then((response) => {
        response.delete(reason, timeout * 1000).catch(console.error);
      });
    }
    return await sendDirectMessage(this.authorId, content).then((response) => {
      response.delete(reason, timeout * 1000).catch(console.error);
    });
  },
  async alertReply(content, timeout = 10, reason = "") {
    return await this.reply(content).then((response) =>
      response.delete(reason, timeout * 1000).catch(console.error)
    );
  },
  removeAllReactions() {
    return removeAllReactions(this.channelId, this.id);
  },
  removeReactionEmoji(reaction) {
    return removeReactionEmoji(this.channelId, this.id, reaction);
  },
  removeReaction(reaction, userId) {
    return removeReaction(this.channelId, this.id, reaction, {
      userId,
    });
  },
  get tts() {
    return Boolean(this.bitfield & messageToggles.tts);
  },
  get mentionEveryone() {
    return Boolean(this.bitfield & messageToggles.mentionEveryone);
  },
  get pinned() {
    return Boolean(this.bitfield & messageToggles.pinned);
  },
};
export async function createDiscordenoMessage(data) {
  const {
    guildId = "",
    mentionChannels = [],
    mentions = [],
    mentionRoles = [],
    editedTimestamp,
    author,
    messageReference,
    ...rest
  } = data;
  let bitfield = 0n;
  const props = {};
  for (const [key, value] of Object.entries(rest)) {
    eventHandlers.debug?.(
      "loop",
      `Running for of loop in createDiscordenoMessage function.`,
    );
    const toggleBits = messageToggles[key];
    if (toggleBits) {
      bitfield |= value ? toggleBits : 0n;
      continue;
    }
    // Don't add member to props since it would overwrite the message.member getter
    if (key === "member") continue;
    props[key] = createNewProp(
      MESSAGE_SNOWFLAKES.includes(key)
        ? value ? snowflakeToBigint(value) : undefined
        : value,
    );
  }
  props.authorId = createNewProp(snowflakeToBigint(author.id));
  props.isBot = createNewProp(author.bot || false);
  props.tag = createNewProp(`${author.username}#${author.discriminator}`);
  // Discord doesnt give guild id for getMessage() so this will fill it in
  const guildIdFinal = snowflakeToBigint(guildId) ||
    (await cacheHandlers.get("channels", snowflakeToBigint(data.channelId)))
      ?.guildId ||
    0n;
  const message = Object.create(baseMessage, {
    ...props,
    content: createNewProp(data.content || ""),
    guildId: createNewProp(guildIdFinal),
    mentionedUserIds: createNewProp(
      mentions.map((m) => snowflakeToBigint(m.id)),
    ),
    mentionedRoleIds: createNewProp(
      mentionRoles.map((id) => snowflakeToBigint(id)),
    ),
    mentionedChannelIds: createNewProp([
      // Keep any ids that discord sends
      ...mentionChannels.map((m) => snowflakeToBigint(m.id)),
      // Add any other ids that can be validated in a channel mention format
      ...(rest.content?.match(CHANNEL_MENTION_REGEX) || []).map((text) =>
        // converts the <#123> into 123
        snowflakeToBigint(text.substring(2, text.length - 1))
      ),
    ]),
    timestamp: createNewProp(Date.parse(data.timestamp)),
    editedTimestamp: createNewProp(
      editedTimestamp ? Date.parse(editedTimestamp) : undefined,
    ),
    messageReference: createNewProp(
      messageReference
        ? {
          messageId: messageReference.messageId
            ? snowflakeToBigint(messageReference.messageId)
            : undefined,
          channelId: messageReference.channelId
            ? snowflakeToBigint(messageReference.channelId)
            : undefined,
          guildId: messageReference.guildId
            ? snowflakeToBigint(messageReference.guildId)
            : undefined,
        }
        : undefined,
    ),
    bitfield: createNewProp(bitfield),
  });
  return message;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3N0cnVjdHVyZXMvbWVzc2FnZS50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXZlbnRIYW5kbGVycyB9IGZyb20gXCIuLi9ib3QudHNcIjtcbmltcG9ydCB7IGNhY2hlLCBjYWNoZUhhbmRsZXJzIH0gZnJvbSBcIi4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyBzZW5kRGlyZWN0TWVzc2FnZSB9IGZyb20gXCIuLi9oZWxwZXJzL21lbWJlcnMvc2VuZF9kaXJlY3RfbWVzc2FnZS50c1wiO1xuaW1wb3J0IHsgYWRkUmVhY3Rpb24gfSBmcm9tIFwiLi4vaGVscGVycy9tZXNzYWdlcy9hZGRfcmVhY3Rpb24udHNcIjtcbmltcG9ydCB7IGFkZFJlYWN0aW9ucyB9IGZyb20gXCIuLi9oZWxwZXJzL21lc3NhZ2VzL2FkZF9yZWFjdGlvbnMudHNcIjtcbmltcG9ydCB7IGRlbGV0ZU1lc3NhZ2UgfSBmcm9tIFwiLi4vaGVscGVycy9tZXNzYWdlcy9kZWxldGVfbWVzc2FnZS50c1wiO1xuaW1wb3J0IHsgZWRpdE1lc3NhZ2UgfSBmcm9tIFwiLi4vaGVscGVycy9tZXNzYWdlcy9lZGl0X21lc3NhZ2UudHNcIjtcbmltcG9ydCB7IHBpbk1lc3NhZ2UgfSBmcm9tIFwiLi4vaGVscGVycy9tZXNzYWdlcy9waW5fbWVzc2FnZS50c1wiO1xuaW1wb3J0IHsgcmVtb3ZlQWxsUmVhY3Rpb25zIH0gZnJvbSBcIi4uL2hlbHBlcnMvbWVzc2FnZXMvcmVtb3ZlX2FsbF9yZWFjdGlvbnMudHNcIjtcbmltcG9ydCB7IHJlbW92ZVJlYWN0aW9uIH0gZnJvbSBcIi4uL2hlbHBlcnMvbWVzc2FnZXMvcmVtb3ZlX3JlYWN0aW9uLnRzXCI7XG5pbXBvcnQgeyByZW1vdmVSZWFjdGlvbkVtb2ppIH0gZnJvbSBcIi4uL2hlbHBlcnMvbWVzc2FnZXMvcmVtb3ZlX3JlYWN0aW9uX2Vtb2ppLnRzXCI7XG5pbXBvcnQgeyBzZW5kTWVzc2FnZSB9IGZyb20gXCIuLi9oZWxwZXJzL21lc3NhZ2VzL3NlbmRfbWVzc2FnZS50c1wiO1xuaW1wb3J0IHR5cGUgeyBHdWlsZE1lbWJlciB9IGZyb20gXCIuLi90eXBlcy9tZW1iZXJzL2d1aWxkX21lbWJlci50c1wiO1xuaW1wb3J0IHR5cGUgeyBDcmVhdGVNZXNzYWdlIH0gZnJvbSBcIi4uL3R5cGVzL21lc3NhZ2VzL2NyZWF0ZV9tZXNzYWdlLnRzXCI7XG5pbXBvcnQgdHlwZSB7IEVkaXRNZXNzYWdlIH0gZnJvbSBcIi4uL3R5cGVzL21lc3NhZ2VzL2VkaXRfbWVzc2FnZS50c1wiO1xuaW1wb3J0IHR5cGUgeyBNZXNzYWdlIH0gZnJvbSBcIi4uL3R5cGVzL21lc3NhZ2VzL21lc3NhZ2UudHNcIjtcbmltcG9ydCB7IGJpZ2ludFRvU25vd2ZsYWtlLCBzbm93Zmxha2VUb0JpZ2ludCB9IGZyb20gXCIuLi91dGlsL2JpZ2ludC50c1wiO1xuaW1wb3J0IHsgQ0hBTk5FTF9NRU5USU9OX1JFR0VYIH0gZnJvbSBcIi4uL3V0aWwvY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyBjcmVhdGVOZXdQcm9wIH0gZnJvbSBcIi4uL3V0aWwvdXRpbHMudHNcIjtcbmltcG9ydCB7IERpc2NvcmRlbm9DaGFubmVsIH0gZnJvbSBcIi4vY2hhbm5lbC50c1wiO1xuaW1wb3J0IHsgRGlzY29yZGVub0d1aWxkIH0gZnJvbSBcIi4vZ3VpbGQudHNcIjtcbmltcG9ydCB7IERpc2NvcmRlbm9NZW1iZXIgfSBmcm9tIFwiLi9tZW1iZXIudHNcIjtcbmltcG9ydCB7IERpc2NvcmRlbm9Sb2xlIH0gZnJvbSBcIi4vcm9sZS50c1wiO1xuXG5jb25zdCBNRVNTQUdFX1NOT1dGTEFLRVMgPSBbXG4gIFwiaWRcIixcbiAgXCJjaGFubmVsSWRcIixcbiAgXCJndWlsZElkXCIsXG4gIFwid2ViaG9va0lkXCIsXG4gIFwiYXBwbGljYXRpb25JZFwiLFxuXTtcblxuY29uc3QgbWVzc2FnZVRvZ2dsZXMgPSB7XG4gIC8qKiBXaGV0aGVyIHRoaXMgd2FzIGEgVFRTIG1lc3NhZ2UgKi9cbiAgdHRzOiAxbixcbiAgLyoqIFdoZXRoZXIgdGhpcyBtZXNzYWdlIG1lbnRpb25zIGV2ZXJ5b25lICovXG4gIG1lbnRpb25FdmVyeW9uZTogMm4sXG4gIC8qKiBXaGV0aGVyIHRoaXMgbWVzc2FnZSBpcyBwaW5uZWQgKi9cbiAgcGlubmVkOiA0bixcbn07XG5cbmNvbnN0IGJhc2VNZXNzYWdlOiBQYXJ0aWFsPERpc2NvcmRlbm9NZXNzYWdlPiA9IHtcbiAgZ2V0IGNoYW5uZWwoKSB7XG4gICAgaWYgKHRoaXMuZ3VpbGRJZCkgcmV0dXJuIGNhY2hlLmNoYW5uZWxzLmdldCh0aGlzLmNoYW5uZWxJZCEpO1xuICAgIHJldHVybiBjYWNoZS5jaGFubmVscy5nZXQodGhpcy5hdXRob3JJZCEpO1xuICB9LFxuICBnZXQgZ3VpbGQoKSB7XG4gICAgaWYgKCF0aGlzLmd1aWxkSWQpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIGNhY2hlLmd1aWxkcy5nZXQodGhpcy5ndWlsZElkKTtcbiAgfSxcbiAgZ2V0IG1lbWJlcigpIHtcbiAgICBpZiAoIXRoaXMuYXV0aG9ySWQpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIGNhY2hlLm1lbWJlcnMuZ2V0KHRoaXMuYXV0aG9ySWQpO1xuICB9LFxuICBnZXQgZ3VpbGRNZW1iZXIoKSB7XG4gICAgaWYgKCF0aGlzLmd1aWxkSWQpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHRoaXMubWVtYmVyPy5ndWlsZHMuZ2V0KHRoaXMuZ3VpbGRJZCk7XG4gIH0sXG4gIGdldCBsaW5rKCkge1xuICAgIHJldHVybiBgaHR0cHM6Ly9kaXNjb3JkLmNvbS9jaGFubmVscy8ke3RoaXMuZ3VpbGRJZCB8fFxuICAgICAgXCJAbWVcIn0vJHt0aGlzLmNoYW5uZWxJZH0vJHt0aGlzLmlkfWA7XG4gIH0sXG4gIGdldCBtZW50aW9uZWRSb2xlcygpIHtcbiAgICByZXR1cm4gdGhpcy5tZW50aW9uZWRSb2xlSWRzPy5tYXAoKGlkKSA9PiB0aGlzLmd1aWxkPy5yb2xlcy5nZXQoaWQpKSB8fCBbXTtcbiAgfSxcbiAgZ2V0IG1lbnRpb25lZENoYW5uZWxzKCkge1xuICAgIHJldHVybiB0aGlzLm1lbnRpb25lZENoYW5uZWxJZHM/Lm1hcCgoaWQpID0+IGNhY2hlLmNoYW5uZWxzLmdldChpZCkpIHx8IFtdO1xuICB9LFxuICBnZXQgbWVudGlvbmVkTWVtYmVycygpIHtcbiAgICByZXR1cm4gdGhpcy5tZW50aW9uZWRVc2VySWRzPy5tYXAoKGlkKSA9PiBjYWNoZS5tZW1iZXJzLmdldChpZCkpIHx8IFtdO1xuICB9LFxuXG4gIC8vIE1FVEhPRFNcbiAgZGVsZXRlKHJlYXNvbiwgZGVsYXlNaWxsaXNlY29uZHMpIHtcbiAgICByZXR1cm4gZGVsZXRlTWVzc2FnZSh0aGlzLmNoYW5uZWxJZCEsIHRoaXMuaWQhLCByZWFzb24sIGRlbGF5TWlsbGlzZWNvbmRzKTtcbiAgfSxcbiAgZWRpdChjb250ZW50KSB7XG4gICAgcmV0dXJuIGVkaXRNZXNzYWdlKHRoaXMgYXMgRGlzY29yZGVub01lc3NhZ2UsIGNvbnRlbnQpO1xuICB9LFxuICBwaW4oKSB7XG4gICAgcmV0dXJuIHBpbk1lc3NhZ2UodGhpcy5jaGFubmVsSWQhLCB0aGlzLmlkISk7XG4gIH0sXG4gIGFkZFJlYWN0aW9uKHJlYWN0aW9uKSB7XG4gICAgcmV0dXJuIGFkZFJlYWN0aW9uKHRoaXMuY2hhbm5lbElkISwgdGhpcy5pZCEsIHJlYWN0aW9uKTtcbiAgfSxcbiAgYWRkUmVhY3Rpb25zKHJlYWN0aW9ucywgb3JkZXJlZCkge1xuICAgIHJldHVybiBhZGRSZWFjdGlvbnModGhpcy5jaGFubmVsSWQhLCB0aGlzLmlkISwgcmVhY3Rpb25zLCBvcmRlcmVkKTtcbiAgfSxcbiAgcmVwbHkoY29udGVudCkge1xuICAgIGNvbnN0IGNvbnRlbnRXaXRoTWVudGlvbjogQ3JlYXRlTWVzc2FnZSA9IHR5cGVvZiBjb250ZW50ID09PSBcInN0cmluZ1wiXG4gICAgICA/IHtcbiAgICAgICAgY29udGVudCxcbiAgICAgICAgYWxsb3dlZE1lbnRpb25zOiB7XG4gICAgICAgICAgcmVwbGllZFVzZXI6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIG1lc3NhZ2VSZWZlcmVuY2U6IHtcbiAgICAgICAgICBtZXNzYWdlSWQ6IGJpZ2ludFRvU25vd2ZsYWtlKHRoaXMuaWQhKSxcbiAgICAgICAgICBmYWlsSWZOb3RFeGlzdHM6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgfVxuICAgICAgOiB7XG4gICAgICAgIC4uLmNvbnRlbnQsXG4gICAgICAgIGFsbG93ZWRNZW50aW9uczoge1xuICAgICAgICAgIC4uLihjb250ZW50LmFsbG93ZWRNZW50aW9ucyB8fCB7fSksXG4gICAgICAgICAgcmVwbGllZFVzZXI6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIG1lc3NhZ2VSZWZlcmVuY2U6IHtcbiAgICAgICAgICBtZXNzYWdlSWQ6IGJpZ2ludFRvU25vd2ZsYWtlKHRoaXMuaWQhKSxcbiAgICAgICAgICBmYWlsSWZOb3RFeGlzdHM6IGNvbnRlbnQubWVzc2FnZVJlZmVyZW5jZT8uZmFpbElmTm90RXhpc3RzID09PSB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfTtcblxuICAgIGlmICh0aGlzLmd1aWxkSWQpIHJldHVybiBzZW5kTWVzc2FnZSh0aGlzLmNoYW5uZWxJZCEsIGNvbnRlbnRXaXRoTWVudGlvbik7XG4gICAgcmV0dXJuIHNlbmREaXJlY3RNZXNzYWdlKHRoaXMuYXV0aG9ySWQhLCBjb250ZW50V2l0aE1lbnRpb24pO1xuICB9LFxuICBzZW5kKGNvbnRlbnQpIHtcbiAgICBpZiAodGhpcy5ndWlsZElkKSByZXR1cm4gc2VuZE1lc3NhZ2UodGhpcy5jaGFubmVsSWQhLCBjb250ZW50KTtcbiAgICByZXR1cm4gc2VuZERpcmVjdE1lc3NhZ2UodGhpcy5hdXRob3JJZCEsIGNvbnRlbnQpO1xuICB9LFxuICBhc3luYyBhbGVydChjb250ZW50LCB0aW1lb3V0ID0gMTAsIHJlYXNvbiA9IFwiXCIpIHtcbiAgICBpZiAodGhpcy5ndWlsZElkKSB7XG4gICAgICByZXR1cm4gYXdhaXQgc2VuZE1lc3NhZ2UodGhpcy5jaGFubmVsSWQhLCBjb250ZW50KS50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICByZXNwb25zZS5kZWxldGUocmVhc29uLCB0aW1lb3V0ICogMTAwMCkuY2F0Y2goY29uc29sZS5lcnJvcik7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgc2VuZERpcmVjdE1lc3NhZ2UodGhpcy5hdXRob3JJZCEsIGNvbnRlbnQpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICByZXNwb25zZS5kZWxldGUocmVhc29uLCB0aW1lb3V0ICogMTAwMCkuY2F0Y2goY29uc29sZS5lcnJvcik7XG4gICAgfSk7XG4gIH0sXG4gIGFzeW5jIGFsZXJ0UmVwbHkoY29udGVudCwgdGltZW91dCA9IDEwLCByZWFzb24gPSBcIlwiKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucmVwbHkhKGNvbnRlbnQpLnRoZW4oKHJlc3BvbnNlKSA9PlxuICAgICAgcmVzcG9uc2UuZGVsZXRlKHJlYXNvbiwgdGltZW91dCAqIDEwMDApLmNhdGNoKGNvbnNvbGUuZXJyb3IpXG4gICAgKTtcbiAgfSxcbiAgcmVtb3ZlQWxsUmVhY3Rpb25zKCkge1xuICAgIHJldHVybiByZW1vdmVBbGxSZWFjdGlvbnModGhpcy5jaGFubmVsSWQhLCB0aGlzLmlkISk7XG4gIH0sXG4gIHJlbW92ZVJlYWN0aW9uRW1vamkocmVhY3Rpb24pIHtcbiAgICByZXR1cm4gcmVtb3ZlUmVhY3Rpb25FbW9qaSh0aGlzLmNoYW5uZWxJZCEsIHRoaXMuaWQhLCByZWFjdGlvbik7XG4gIH0sXG4gIHJlbW92ZVJlYWN0aW9uKHJlYWN0aW9uLCB1c2VySWQpIHtcbiAgICByZXR1cm4gcmVtb3ZlUmVhY3Rpb24odGhpcy5jaGFubmVsSWQhLCB0aGlzLmlkISwgcmVhY3Rpb24sIHsgdXNlcklkIH0pO1xuICB9LFxuICBnZXQgdHRzKCkge1xuICAgIHJldHVybiBCb29sZWFuKHRoaXMuYml0ZmllbGQhICYgbWVzc2FnZVRvZ2dsZXMudHRzKTtcbiAgfSxcbiAgZ2V0IG1lbnRpb25FdmVyeW9uZSgpIHtcbiAgICByZXR1cm4gQm9vbGVhbih0aGlzLmJpdGZpZWxkISAmIG1lc3NhZ2VUb2dnbGVzLm1lbnRpb25FdmVyeW9uZSk7XG4gIH0sXG4gIGdldCBwaW5uZWQoKSB7XG4gICAgcmV0dXJuIEJvb2xlYW4odGhpcy5iaXRmaWVsZCEgJiBtZXNzYWdlVG9nZ2xlcy5waW5uZWQpO1xuICB9LFxufTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZURpc2NvcmRlbm9NZXNzYWdlKGRhdGE6IE1lc3NhZ2UpIHtcbiAgY29uc3Qge1xuICAgIGd1aWxkSWQgPSBcIlwiLFxuICAgIG1lbnRpb25DaGFubmVscyA9IFtdLFxuICAgIG1lbnRpb25zID0gW10sXG4gICAgbWVudGlvblJvbGVzID0gW10sXG4gICAgZWRpdGVkVGltZXN0YW1wLFxuICAgIGF1dGhvcixcbiAgICBtZXNzYWdlUmVmZXJlbmNlLFxuICAgIC4uLnJlc3RcbiAgfSA9IGRhdGE7XG5cbiAgbGV0IGJpdGZpZWxkID0gMG47XG5cbiAgY29uc3QgcHJvcHM6IFJlY29yZDxzdHJpbmcsIFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZU5ld1Byb3A+PiA9IHt9O1xuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhyZXN0KSkge1xuICAgIGV2ZW50SGFuZGxlcnMuZGVidWc/LihcbiAgICAgIFwibG9vcFwiLFxuICAgICAgYFJ1bm5pbmcgZm9yIG9mIGxvb3AgaW4gY3JlYXRlRGlzY29yZGVub01lc3NhZ2UgZnVuY3Rpb24uYCxcbiAgICApO1xuXG4gICAgY29uc3QgdG9nZ2xlQml0cyA9IG1lc3NhZ2VUb2dnbGVzW2tleSBhcyBrZXlvZiB0eXBlb2YgbWVzc2FnZVRvZ2dsZXNdO1xuICAgIGlmICh0b2dnbGVCaXRzKSB7XG4gICAgICBiaXRmaWVsZCB8PSB2YWx1ZSA/IHRvZ2dsZUJpdHMgOiAwbjtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIERvbid0IGFkZCBtZW1iZXIgdG8gcHJvcHMgc2luY2UgaXQgd291bGQgb3ZlcndyaXRlIHRoZSBtZXNzYWdlLm1lbWJlciBnZXR0ZXJcbiAgICBpZiAoa2V5ID09PSBcIm1lbWJlclwiKSBjb250aW51ZTtcblxuICAgIHByb3BzW2tleV0gPSBjcmVhdGVOZXdQcm9wKFxuICAgICAgTUVTU0FHRV9TTk9XRkxBS0VTLmluY2x1ZGVzKGtleSlcbiAgICAgICAgPyB2YWx1ZSA/IHNub3dmbGFrZVRvQmlnaW50KHZhbHVlKSA6IHVuZGVmaW5lZFxuICAgICAgICA6IHZhbHVlLFxuICAgICk7XG4gIH1cblxuICBwcm9wcy5hdXRob3JJZCA9IGNyZWF0ZU5ld1Byb3Aoc25vd2ZsYWtlVG9CaWdpbnQoYXV0aG9yLmlkKSk7XG4gIHByb3BzLmlzQm90ID0gY3JlYXRlTmV3UHJvcChhdXRob3IuYm90IHx8IGZhbHNlKTtcbiAgcHJvcHMudGFnID0gY3JlYXRlTmV3UHJvcChgJHthdXRob3IudXNlcm5hbWV9IyR7YXV0aG9yLmRpc2NyaW1pbmF0b3J9YCk7XG5cbiAgLy8gRGlzY29yZCBkb2VzbnQgZ2l2ZSBndWlsZCBpZCBmb3IgZ2V0TWVzc2FnZSgpIHNvIHRoaXMgd2lsbCBmaWxsIGl0IGluXG4gIGNvbnN0IGd1aWxkSWRGaW5hbCA9IHNub3dmbGFrZVRvQmlnaW50KGd1aWxkSWQpIHx8XG4gICAgKGF3YWl0IGNhY2hlSGFuZGxlcnMuZ2V0KFwiY2hhbm5lbHNcIiwgc25vd2ZsYWtlVG9CaWdpbnQoZGF0YS5jaGFubmVsSWQpKSlcbiAgICAgID8uZ3VpbGRJZCB8fFxuICAgIDBuO1xuXG4gIGNvbnN0IG1lc3NhZ2U6IERpc2NvcmRlbm9NZXNzYWdlID0gT2JqZWN0LmNyZWF0ZShiYXNlTWVzc2FnZSwge1xuICAgIC4uLnByb3BzLFxuICAgIGNvbnRlbnQ6IGNyZWF0ZU5ld1Byb3AoZGF0YS5jb250ZW50IHx8IFwiXCIpLFxuICAgIGd1aWxkSWQ6IGNyZWF0ZU5ld1Byb3AoZ3VpbGRJZEZpbmFsKSxcbiAgICBtZW50aW9uZWRVc2VySWRzOiBjcmVhdGVOZXdQcm9wKFxuICAgICAgbWVudGlvbnMubWFwKChtKSA9PiBzbm93Zmxha2VUb0JpZ2ludChtLmlkKSksXG4gICAgKSxcbiAgICBtZW50aW9uZWRSb2xlSWRzOiBjcmVhdGVOZXdQcm9wKFxuICAgICAgbWVudGlvblJvbGVzLm1hcCgoaWQpID0+IHNub3dmbGFrZVRvQmlnaW50KGlkKSksXG4gICAgKSxcbiAgICBtZW50aW9uZWRDaGFubmVsSWRzOiBjcmVhdGVOZXdQcm9wKFtcbiAgICAgIC8vIEtlZXAgYW55IGlkcyB0aGF0IGRpc2NvcmQgc2VuZHNcbiAgICAgIC4uLm1lbnRpb25DaGFubmVscy5tYXAoKG0pID0+IHNub3dmbGFrZVRvQmlnaW50KG0uaWQpKSxcbiAgICAgIC8vIEFkZCBhbnkgb3RoZXIgaWRzIHRoYXQgY2FuIGJlIHZhbGlkYXRlZCBpbiBhIGNoYW5uZWwgbWVudGlvbiBmb3JtYXRcbiAgICAgIC4uLihyZXN0LmNvbnRlbnQ/Lm1hdGNoKENIQU5ORUxfTUVOVElPTl9SRUdFWCkgfHwgW10pLm1hcCgodGV4dCkgPT5cbiAgICAgICAgLy8gY29udmVydHMgdGhlIDwjMTIzPiBpbnRvIDEyM1xuICAgICAgICBzbm93Zmxha2VUb0JpZ2ludCh0ZXh0LnN1YnN0cmluZygyLCB0ZXh0Lmxlbmd0aCAtIDEpKVxuICAgICAgKSxcbiAgICBdKSxcbiAgICB0aW1lc3RhbXA6IGNyZWF0ZU5ld1Byb3AoRGF0ZS5wYXJzZShkYXRhLnRpbWVzdGFtcCkpLFxuICAgIGVkaXRlZFRpbWVzdGFtcDogY3JlYXRlTmV3UHJvcChcbiAgICAgIGVkaXRlZFRpbWVzdGFtcCA/IERhdGUucGFyc2UoZWRpdGVkVGltZXN0YW1wKSA6IHVuZGVmaW5lZCxcbiAgICApLFxuICAgIG1lc3NhZ2VSZWZlcmVuY2U6IGNyZWF0ZU5ld1Byb3AoXG4gICAgICBtZXNzYWdlUmVmZXJlbmNlXG4gICAgICAgID8ge1xuICAgICAgICAgIG1lc3NhZ2VJZDogbWVzc2FnZVJlZmVyZW5jZS5tZXNzYWdlSWRcbiAgICAgICAgICAgID8gc25vd2ZsYWtlVG9CaWdpbnQobWVzc2FnZVJlZmVyZW5jZS5tZXNzYWdlSWQpXG4gICAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBjaGFubmVsSWQ6IG1lc3NhZ2VSZWZlcmVuY2UuY2hhbm5lbElkXG4gICAgICAgICAgICA/IHNub3dmbGFrZVRvQmlnaW50KG1lc3NhZ2VSZWZlcmVuY2UuY2hhbm5lbElkKVxuICAgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgZ3VpbGRJZDogbWVzc2FnZVJlZmVyZW5jZS5ndWlsZElkXG4gICAgICAgICAgICA/IHNub3dmbGFrZVRvQmlnaW50KG1lc3NhZ2VSZWZlcmVuY2UuZ3VpbGRJZClcbiAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICB9XG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgICksXG4gICAgYml0ZmllbGQ6IGNyZWF0ZU5ld1Byb3AoYml0ZmllbGQpLFxuICB9KTtcblxuICByZXR1cm4gbWVzc2FnZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEaXNjb3JkZW5vTWVzc2FnZSBleHRlbmRzXG4gIE9taXQ8XG4gICAgTWVzc2FnZSxcbiAgICB8IFwiaWRcIlxuICAgIHwgXCJ3ZWJob29rSWRcIlxuICAgIHwgXCJ0aW1lc3RhbXBcIlxuICAgIHwgXCJlZGl0ZWRUaW1lc3RhbXBcIlxuICAgIHwgXCJndWlsZElkXCJcbiAgICB8IFwiY2hhbm5lbElkXCJcbiAgICB8IFwibWVtYmVyXCJcbiAgICB8IFwiYXV0aG9yXCJcbiAgICB8IFwiYXBwbGljYXRpb25JZFwiXG4gID4ge1xuICBpZDogYmlnaW50O1xuICAvKiogV2hldGhlciBvciBub3QgdGhpcyBtZXNzYWdlIHdhcyBzZW50IGJ5IGEgYm90ICovXG4gIGlzQm90OiBib29sZWFuO1xuICAvKiogVGhlIHVzZXJuYW1lI2Rpc2NyaW1uYXRvciBmb3IgdGhlIHVzZXIgd2hvIHNlbnQgdGhpcyBtZXNzYWdlICovXG4gIHRhZzogc3RyaW5nO1xuICAvKiogSG9sZHMgYWxsIHRoZSBib29sZWFuIHRvZ2dsZXMuICovXG4gIGJpdGZpZWxkOiBiaWdpbnQ7XG5cbiAgLy8gRm9yIGJldHRlciB1c2VyIGV4cGVyaWVuY2VcblxuICAvKiogSWQgb2YgdGhlIGd1aWxkIHdoaWNoIHRoZSBtYXNzYWdlIGhhcyBiZWVuIHNlbmQgaW4uIFwiMG5cIiBpZiBpdCBhIERNICovXG4gIGd1aWxkSWQ6IGJpZ2ludDtcbiAgLyoqIGlkIG9mIHRoZSBjaGFubmVsIHRoZSBtZXNzYWdlIHdhcyBzZW50IGluICovXG4gIGNoYW5uZWxJZDogYmlnaW50O1xuICAvKiogSWYgdGhlIG1lc3NhZ2UgaXMgZ2VuZXJhdGVkIGJ5IGEgd2ViaG9vaywgdGhpcyBpcyB0aGUgd2ViaG9vaydzIGlkICovXG4gIHdlYmhvb2tJZD86IGJpZ2ludDtcbiAgLyoqIFRoZSBpZCBvZiB0aGUgdXNlciB3aG8gc2VudCB0aGlzIG1lc3NhZ2UgKi9cbiAgYXV0aG9ySWQ6IGJpZ2ludDtcbiAgLyoqIElmIHRoZSBtZXNzYWdlIGlzIGEgcmVzcG9uc2UgdG8gYW4gSW50ZXJhY3Rpb24sIHRoaXMgaXMgdGhlIGlkIG9mIHRoZSBpbnRlcmFjdGlvbidzIGFwcGxpY2F0aW9uICovXG4gIGFwcGxpY2F0aW9uSWQ/OiBiaWdpbnQ7XG4gIC8qKiBUaGUgbWVzc2FnZSBjb250ZW50IGZvciB0aGlzIG1lc3NhZ2UuIEVtcHR5IHN0cmluZyBpZiBubyBjb250ZW50IHdhcyBzZW50IGxpa2UgYW4gYXR0YWNobWVudCBvbmx5LiAqL1xuICBjb250ZW50OiBzdHJpbmc7XG4gIC8qKiBJZHMgb2YgdXNlcnMgc3BlY2lmaWNhbGx5IG1lbnRpb25lZCBpbiB0aGUgbWVzc2FnZSAqL1xuICBtZW50aW9uZWRVc2VySWRzOiBiaWdpbnRbXTtcbiAgLyoqIElkcyBvZiByb2xlcyBzcGVjaWZpY2FsbHkgbWVudGlvbmVkIGluIHRoaXMgbWVzc2FnZSAqL1xuICBtZW50aW9uZWRSb2xlSWRzOiBiaWdpbnRbXTtcbiAgLyoqIENoYW5uZWxzIHNwZWNpZmljYWxseSBtZW50aW9uZWQgaW4gdGhpcyBtZXNzYWdlICovXG4gIG1lbnRpb25lZENoYW5uZWxJZHM/OiBiaWdpbnRbXTtcbiAgLyoqIFdoZW4gdGhpcyBtZXNzYWdlIHdhcyBzZW50ICovXG4gIHRpbWVzdGFtcDogbnVtYmVyO1xuICAvKiogV2hlbiB0aGlzIG1lc3NhZ2Ugd2FzIGVkaXRlZCAob3IgdW5kZWZpbmVkIGlmIG5ldmVyKSAqL1xuICBlZGl0ZWRUaW1lc3RhbXA/OiBudW1iZXI7XG5cbiAgLy8gR0VUVEVSU1xuXG4gIC8qKiBUaGUgY2hhbm5lbCB3aGVyZSB0aGlzIG1lc3NhZ2Ugd2FzIHNlbnQuIENhbiBiZSB1bmRlZmluZWQgaWYgdW5jYWNoZWQuICovXG4gIGNoYW5uZWw/OiBEaXNjb3JkZW5vQ2hhbm5lbDtcbiAgLyoqIFRoZSBndWlsZCBvZiB0aGlzIG1lc3NhZ2UuIENhbiBiZSB1bmRlZmluZWQgaWYgbm90IGluIGNhY2hlIG9yIGluIERNICovXG4gIGd1aWxkPzogRGlzY29yZGVub0d1aWxkO1xuICAvKiogVGhlIG1lbWJlciBmb3IgdGhlIHVzZXIgd2hvIHNlbnQgdGhlIG1lc3NhZ2UuIENhbiBiZSB1bmRlZmluZWQgaWYgbm90IGluIGNhY2hlIG9yIGluIGRtLiAqL1xuICBtZW1iZXI/OiBEaXNjb3JkZW5vTWVtYmVyO1xuICAvKiogVGhlIGd1aWxkIG1lbWJlciBkZXRhaWxzIGZvciB0aGlzIGd1aWxkIGFuZCBtZW1iZXIuIENhbiBiZSB1bmRlZmluZWQgaWYgbm90IGluIGNhY2hlIG9yIGluIGRtLiAqL1xuICBndWlsZE1lbWJlcj86IE9taXQ8R3VpbGRNZW1iZXIsIFwiam9pbmVkQXRcIiB8IFwicHJlbWl1bVNpbmNlXCIgfCBcInJvbGVzXCI+ICYge1xuICAgIGpvaW5lZEF0PzogbnVtYmVyO1xuICAgIHByZW1pdW1TaW5jZT86IG51bWJlcjtcbiAgICByb2xlczogYmlnaW50W107XG4gIH07XG4gIC8qKiBUaGUgdXJsIGxpbmsgdG8gdGhpcyBtZXNzYWdlICovXG4gIGxpbms6IHN0cmluZztcbiAgLyoqIFRoZSByb2xlIG9iamVjdHMgZm9yIGFsbCB0aGUgcm9sZXMgdGhhdCB3ZXJlIG1lbnRpb25lZCBpbiB0aGlzIG1lc3NhZ2UgKi9cbiAgbWVudGlvbmVkUm9sZXM6IChEaXNjb3JkZW5vUm9sZSB8IHVuZGVmaW5lZClbXTtcbiAgLyoqIFRoZSBjaGFubmVsIG9iamVjdHMgZm9yIGFsbCB0aGUgY2hhbm5lbHMgdGhhdCB3ZXJlIG1lbnRpb25lZCBpbiB0aGlzIG1lc3NhZ2UuICovXG4gIG1lbnRpb25lZENoYW5uZWxzOiAoRGlzY29yZGVub0NoYW5uZWwgfCB1bmRlZmluZWQpW107XG4gIC8qKiBUaGUgbWVtYmVyIG9iamVjdHMgZm9yIGFsbCB0aGUgbWVtYmVycyB0aGF0IHdlcmUgbWVudGlvbmVkIGluIHRoaXMgbWVzc2FnZS4gKi9cbiAgbWVudGlvbmVkTWVtYmVyczogKERpc2NvcmRlbm9NZW1iZXIgfCB1bmRlZmluZWQpW107XG5cbiAgLy8gTUVUSE9EU1xuXG4gIC8qKiBEZWxldGUgdGhlIG1lc3NhZ2UgKi9cbiAgZGVsZXRlKFxuICAgIHJlYXNvbj86IHN0cmluZyxcbiAgICBkZWxheU1pbGxpc2Vjb25kcz86IG51bWJlcixcbiAgKTogUmV0dXJuVHlwZTx0eXBlb2YgZGVsZXRlTWVzc2FnZT47XG4gIC8qKiBFZGl0IHRoZSBtZXNzYWdlICovXG4gIGVkaXQoY29udGVudDogc3RyaW5nIHwgRWRpdE1lc3NhZ2UpOiBSZXR1cm5UeXBlPHR5cGVvZiBlZGl0TWVzc2FnZT47XG4gIC8qKiBQaW5zIHRoZSBtZXNzYWdlIGluIHRoZSBjaGFubmVsICovXG4gIHBpbigpOiBSZXR1cm5UeXBlPHR5cGVvZiBwaW5NZXNzYWdlPjtcbiAgLyoqIEFkZCBhIHJlYWN0aW9uIHRvIHRoZSBtZXNzYWdlICovXG4gIGFkZFJlYWN0aW9uKHJlYWN0aW9uOiBzdHJpbmcpOiBSZXR1cm5UeXBlPHR5cGVvZiBhZGRSZWFjdGlvbj47XG4gIC8qKiBBZGQgbXVsdGlwbGUgcmVhY3Rpb25zIHRvIHRoZSBtZXNzYWdlIHdpdGhvdXQgb3Igd2l0aG91dCBvcmRlci4gKi9cbiAgYWRkUmVhY3Rpb25zKFxuICAgIHJlYWN0aW9uczogc3RyaW5nW10sXG4gICAgb3JkZXJlZD86IGJvb2xlYW4sXG4gICk6IFJldHVyblR5cGU8dHlwZW9mIGFkZFJlYWN0aW9ucz47XG4gIC8qKiBTZW5kIGEgaW5saW5lIHJlcGx5IHRvIHRoaXMgbWVzc2FnZSAqL1xuICByZXBseShjb250ZW50OiBzdHJpbmcgfCBDcmVhdGVNZXNzYWdlKTogUmV0dXJuVHlwZTx0eXBlb2Ygc2VuZE1lc3NhZ2U+O1xuICAvKiogU2VuZCBhIG1lc3NhZ2UgdG8gdGhpcyBjaGFubmVsIHdoZXJlIHRoaXMgbWVzc2FnZSBpcyAqL1xuICBzZW5kKGNvbnRlbnQ6IHN0cmluZyB8IENyZWF0ZU1lc3NhZ2UpOiBSZXR1cm5UeXBlPHR5cGVvZiBzZW5kTWVzc2FnZT47XG4gIC8qKiBTZW5kIGEgbWVzc2FnZSB0byB0aGlzIGNoYW5uZWwgYW5kIHRoZW4gZGVsZXRlIGl0IGFmdGVyIGEgYml0LiBCeSBkZWZhdWx0IGl0IHdpbGwgZGVsZXRlIGFmdGVyIDEwIHNlY29uZHMgd2l0aCBubyByZWFzb24gcHJvdmlkZWQuICovXG4gIGFsZXJ0KFxuICAgIGNvbnRlbnQ6IHN0cmluZyB8IENyZWF0ZU1lc3NhZ2UsXG4gICAgdGltZW91dD86IG51bWJlcixcbiAgICByZWFzb24/OiBzdHJpbmcsXG4gICk6IFByb21pc2U8dm9pZD47XG4gIC8qKiBTZW5kIGEgaW5saW5lIHJlcGx5IHRvIHRoaXMgbWVzc2FnZSBidXQgdGhlbiBkZWxldGUgaXQgYWZ0ZXIgYSBiaXQuIEJ5IGRlZmF1bHQgaXQgd2lsbCBkZWxldGUgYWZ0ZXIgMTAgc2Vjb25kcyB3aXRoIG5vIHJlYXNvbiBwcm92aWRlZC4gICovXG4gIGFsZXJ0UmVwbHkoXG4gICAgY29udGVudDogc3RyaW5nIHwgQ3JlYXRlTWVzc2FnZSxcbiAgICB0aW1lb3V0PzogbnVtYmVyLFxuICAgIHJlYXNvbj86IHN0cmluZyxcbiAgKTogUHJvbWlzZTx1bmtub3duPjtcbiAgLyoqIFJlbW92ZXMgYWxsIHJlYWN0aW9ucyBmb3IgYWxsIGVtb2ppcyBvbiB0aGlzIG1lc3NhZ2UgKi9cbiAgcmVtb3ZlQWxsUmVhY3Rpb25zKCk6IFJldHVyblR5cGU8dHlwZW9mIHJlbW92ZUFsbFJlYWN0aW9ucz47XG4gIC8qKiBSZW1vdmVzIGFsbCByZWFjdGlvbnMgZm9yIGEgc2luZ2xlIGVtb2ppIG9uIHRoaXMgbWVzc2FnZSAqL1xuICByZW1vdmVSZWFjdGlvbkVtb2ppKHJlYWN0aW9uOiBzdHJpbmcpOiBSZXR1cm5UeXBlPHR5cGVvZiByZW1vdmVSZWFjdGlvbkVtb2ppPjtcbiAgLyoqIFJlbW92ZXMgYSByZWFjdGlvbiBmcm9tIHRoZSBnaXZlbiB1c2VyIG9uIHRoaXMgbWVzc2FnZSwgZGVmYXVsdHMgdG8gYm90ICovXG4gIHJlbW92ZVJlYWN0aW9uKFxuICAgIHJlYWN0aW9uOiBzdHJpbmcsXG4gICAgdXNlcklkPzogYmlnaW50LFxuICApOiBSZXR1cm5UeXBlPHR5cGVvZiByZW1vdmVSZWFjdGlvbj47XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsYUFBYSxTQUFRLFNBQVc7U0FDaEMsS0FBSyxFQUFFLGFBQWEsU0FBUSxXQUFhO1NBQ3pDLGlCQUFpQixTQUFRLHlDQUEyQztTQUNwRSxXQUFXLFNBQVEsbUNBQXFDO1NBQ3hELFlBQVksU0FBUSxvQ0FBc0M7U0FDMUQsYUFBYSxTQUFRLHFDQUF1QztTQUM1RCxXQUFXLFNBQVEsbUNBQXFDO1NBQ3hELFVBQVUsU0FBUSxrQ0FBb0M7U0FDdEQsa0JBQWtCLFNBQVEsMkNBQTZDO1NBQ3ZFLGNBQWMsU0FBUSxzQ0FBd0M7U0FDOUQs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