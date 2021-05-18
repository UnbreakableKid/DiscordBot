import { bot } from "../../cache.ts";
import { cache } from "../../deps.ts";
/** Convert milliseconds to MM:SS */ export function getMusicLength(
  milliseconds,
) {
  return milliseconds > 3600000
    ? new Date(milliseconds).toISOString().substr(11, 8)
    : new Date(milliseconds).toISOString().substr(14, 5);
}
function execQueue(message, player) {
  if (!message.guildId) return;
  const queue = bot.musicQueues.get(message.guildId);
  if (!queue || queue.length === 0) {
    return;
  }
  player.play(queue[0]);
  player.once("end", async () => {
    if (!bot.loopingMusics.has(message.guildId)) {
      bot.musicQueues.get(message.guildId)?.shift();
    }
    if (bot.musicQueues.get(message.guildId).length > 0) {
      setTimeout(() => {
        execQueue(message, player);
      }, 1000);
    } else {
      await bot.lavadenoManager.destroy(message.guildId.toString());
      bot.musicQueues.delete(message.guildId);
      await message.send(`Queue is now empty! Leaving the voice channel.`);
    }
  });
}
export async function addSoundToQueue(message, track) {
  if (!message.guildId) return;
  const player = bot.lavadenoManager.players.get(message.guildId.toString());
  if (bot.musicQueues.has(message.guildId)) {
    bot.musicQueues.get(message.guildId)?.push(track);
    await message.reply(
      `Added ${track.info.title} to the queue! Position in queue: ${bot
        .musicQueues.get(message.guildId).length - 1}`,
    );
  } else {
    bot.musicQueues.set(message.guildId, [
      track,
    ]);
    await message.reply(
      `Added ${track.info.title} to Now playing - ${track.info.title}.`,
    );
  }
  if (player && !player.playing) {
    await execQueue(message, player);
  }
}
export async function addPlaylistToQueue(message, playlistName, tracks) {
  const player = bot.lavadenoManager.players.get(message.guildId.toString());
  if (bot.musicQueues.has(message.guildId)) {
    bot.musicQueues.set(
      message.guildId,
      bot.musicQueues.get(message.guildId).concat(tracks),
    );
  } else {
    bot.musicQueues.set(message.guildId, tracks);
  }
  await message.reply(
    `Added ${tracks.length} songs from the playlist: ${playlistName} to the queue!`,
  );
  if (player && !player.playing) {
    await execQueue(message, player);
  }
}
export function validURL(str) {
  const pattern = new RegExp(
    "^(https?:\\/\\/)?" + "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" +
      "((\\d{1,3}\\.){3}\\d{1,3}))" + "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
      "(\\?[;&a-z\\d%_.~+=-]*)?" + "(\\#[-a-z\\d_]*)?$",
    "i",
  ); // fragment locator
  return !!pattern.test(str);
}
export async function checkIfUserInMusicChannel(message, player) {
  if (!message.guildId || !message.channelId) {
    if (!player) {
      await message.reply(`The bot is not in any channel!`);
      return false;
    }
  }
  if (!cache.guilds.get(message.guildId)?.voiceStates.has(message.authorId)) {
    await message.reply(`You need to been in a voice channel!`);
    return false;
  }
  if (
    player.channel !==
      cache.guilds.get(message.guildId)?.voiceStates.get(message.authorId)
        ?.channelId?.toString()
  ) {
    await message.reply(
      `You need to been in the same voice channel than the bot!`,
    );
    return false;
  }
  return true;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL3V0aWxzL3ZvaWNlLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBib3QgfSBmcm9tIFwiLi4vLi4vY2FjaGUudHNcIjtcbmltcG9ydCB7IGNhY2hlLCBEaXNjb3JkZW5vTWVzc2FnZSwgUGxheWVyLCBUcmFjayB9IGZyb20gXCIuLi8uLi9kZXBzLnRzXCI7XG5cbi8qKiBDb252ZXJ0IG1pbGxpc2Vjb25kcyB0byBNTTpTUyAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE11c2ljTGVuZ3RoKG1pbGxpc2Vjb25kczogbnVtYmVyKSB7XG4gIHJldHVybiBtaWxsaXNlY29uZHMgPiAzNjAwMDAwXG4gICAgPyBuZXcgRGF0ZShtaWxsaXNlY29uZHMpLnRvSVNPU3RyaW5nKCkuc3Vic3RyKDExLCA4KVxuICAgIDogbmV3IERhdGUobWlsbGlzZWNvbmRzKS50b0lTT1N0cmluZygpLnN1YnN0cigxNCwgNSk7XG59XG5cbmZ1bmN0aW9uIGV4ZWNRdWV1ZShtZXNzYWdlOiBEaXNjb3JkZW5vTWVzc2FnZSwgcGxheWVyOiBQbGF5ZXIpIHtcbiAgaWYgKCFtZXNzYWdlLmd1aWxkSWQpIHJldHVybjtcblxuICBjb25zdCBxdWV1ZSA9IGJvdC5tdXNpY1F1ZXVlcy5nZXQobWVzc2FnZS5ndWlsZElkKTtcbiAgaWYgKCFxdWV1ZSB8fCBxdWV1ZS5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBwbGF5ZXIucGxheShxdWV1ZVswXSk7XG5cbiAgcGxheWVyLm9uY2UoXCJlbmRcIiwgYXN5bmMgKCkgPT4ge1xuICAgIGlmICghYm90Lmxvb3BpbmdNdXNpY3MuaGFzKG1lc3NhZ2UuZ3VpbGRJZCkpIHtcbiAgICAgIGJvdC5tdXNpY1F1ZXVlcy5nZXQobWVzc2FnZS5ndWlsZElkKT8uc2hpZnQoKTtcbiAgICB9XG4gICAgaWYgKGJvdC5tdXNpY1F1ZXVlcy5nZXQobWVzc2FnZS5ndWlsZElkKSEubGVuZ3RoID4gMCkge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGV4ZWNRdWV1ZShtZXNzYWdlLCBwbGF5ZXIpO1xuICAgICAgfSwgMTAwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGF3YWl0IGJvdC5sYXZhZGVub01hbmFnZXIuZGVzdHJveShtZXNzYWdlLmd1aWxkSWQudG9TdHJpbmcoKSk7XG4gICAgICBib3QubXVzaWNRdWV1ZXMuZGVsZXRlKG1lc3NhZ2UuZ3VpbGRJZCk7XG4gICAgICBhd2FpdCBtZXNzYWdlLnNlbmQoYFF1ZXVlIGlzIG5vdyBlbXB0eSEgTGVhdmluZyB0aGUgdm9pY2UgY2hhbm5lbC5gKTtcbiAgICB9XG4gIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYWRkU291bmRUb1F1ZXVlKFxuICBtZXNzYWdlOiBEaXNjb3JkZW5vTWVzc2FnZSxcbiAgdHJhY2s6IFRyYWNrLFxuKSB7XG4gIGlmICghbWVzc2FnZS5ndWlsZElkKSByZXR1cm47XG5cbiAgY29uc3QgcGxheWVyID0gYm90LmxhdmFkZW5vTWFuYWdlci5wbGF5ZXJzLmdldChtZXNzYWdlLmd1aWxkSWQudG9TdHJpbmcoKSk7XG4gIGlmIChib3QubXVzaWNRdWV1ZXMuaGFzKG1lc3NhZ2UuZ3VpbGRJZCkpIHtcbiAgICBib3QubXVzaWNRdWV1ZXMuZ2V0KG1lc3NhZ2UuZ3VpbGRJZCk/LnB1c2godHJhY2spO1xuICAgIGF3YWl0IG1lc3NhZ2UucmVwbHkoXG4gICAgICBgQWRkZWQgJHt0cmFjay5pbmZvLnRpdGxlfSB0byB0aGUgcXVldWUhIFBvc2l0aW9uIGluIHF1ZXVlOiAke2JvdFxuICAgICAgICAubXVzaWNRdWV1ZXMuZ2V0KG1lc3NhZ2UuZ3VpbGRJZCkhLmxlbmd0aCAtIDF9YCxcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIGJvdC5tdXNpY1F1ZXVlcy5zZXQobWVzc2FnZS5ndWlsZElkISwgW3RyYWNrXSk7XG4gICAgYXdhaXQgbWVzc2FnZS5yZXBseShcbiAgICAgIGBBZGRlZCAke3RyYWNrLmluZm8udGl0bGV9IHRvIE5vdyBwbGF5aW5nIC0gJHt0cmFjay5pbmZvLnRpdGxlfS5gLFxuICAgICk7XG4gIH1cbiAgaWYgKHBsYXllciAmJiAhcGxheWVyLnBsYXlpbmcpIHtcbiAgICBhd2FpdCBleGVjUXVldWUobWVzc2FnZSwgcGxheWVyKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYWRkUGxheWxpc3RUb1F1ZXVlKFxuICBtZXNzYWdlOiBEaXNjb3JkZW5vTWVzc2FnZSxcbiAgcGxheWxpc3ROYW1lOiBzdHJpbmcsXG4gIHRyYWNrczogVHJhY2tbXSxcbikge1xuICBjb25zdCBwbGF5ZXIgPSBib3QubGF2YWRlbm9NYW5hZ2VyLnBsYXllcnMuZ2V0KG1lc3NhZ2UuZ3VpbGRJZC50b1N0cmluZygpKTtcbiAgaWYgKGJvdC5tdXNpY1F1ZXVlcy5oYXMobWVzc2FnZS5ndWlsZElkKSkge1xuICAgIGJvdC5tdXNpY1F1ZXVlcy5zZXQoXG4gICAgICBtZXNzYWdlLmd1aWxkSWQsXG4gICAgICBib3QubXVzaWNRdWV1ZXMuZ2V0KG1lc3NhZ2UuZ3VpbGRJZCkhLmNvbmNhdCh0cmFja3MpLFxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgYm90Lm11c2ljUXVldWVzLnNldChtZXNzYWdlLmd1aWxkSWQsIHRyYWNrcyk7XG4gIH1cbiAgYXdhaXQgbWVzc2FnZS5yZXBseShcbiAgICBgQWRkZWQgJHt0cmFja3MubGVuZ3RofSBzb25ncyBmcm9tIHRoZSBwbGF5bGlzdDogJHtwbGF5bGlzdE5hbWV9IHRvIHRoZSBxdWV1ZSFgLFxuICApO1xuICBpZiAocGxheWVyICYmICFwbGF5ZXIucGxheWluZykge1xuICAgIGF3YWl0IGV4ZWNRdWV1ZShtZXNzYWdlLCBwbGF5ZXIpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZFVSTChzdHI6IHN0cmluZykge1xuICBjb25zdCBwYXR0ZXJuID0gbmV3IFJlZ0V4cChcbiAgICBcIl4oaHR0cHM/OlxcXFwvXFxcXC8pP1wiICsgLy8gcHJvdG9jb2xcbiAgICAgIFwiKCgoW2EtelxcXFxkXShbYS16XFxcXGQtXSpbYS16XFxcXGRdKSopXFxcXC4pK1thLXpdezIsfXxcIiArIC8vIGRvbWFpbiBuYW1lXG4gICAgICBcIigoXFxcXGR7MSwzfVxcXFwuKXszfVxcXFxkezEsM30pKVwiICsgLy8gT1IgaXAgKHY0KSBhZGRyZXNzXG4gICAgICBcIihcXFxcOlxcXFxkKyk/KFxcXFwvWy1hLXpcXFxcZCVfLn4rXSopKlwiICsgLy8gcG9ydCBhbmQgcGF0aFxuICAgICAgXCIoXFxcXD9bOyZhLXpcXFxcZCVfLn4rPS1dKik/XCIgKyAvLyBxdWVyeSBzdHJpbmdcbiAgICAgIFwiKFxcXFwjWy1hLXpcXFxcZF9dKik/JFwiLFxuICAgIFwiaVwiLFxuICApOyAvLyBmcmFnbWVudCBsb2NhdG9yXG4gIHJldHVybiAhIXBhdHRlcm4udGVzdChzdHIpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2hlY2tJZlVzZXJJbk11c2ljQ2hhbm5lbChcbiAgbWVzc2FnZTogRGlzY29yZGVub01lc3NhZ2UsXG4gIHBsYXllcjogUGxheWVyLFxuKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIGlmICghbWVzc2FnZS5ndWlsZElkIHx8ICFtZXNzYWdlLmNoYW5uZWxJZCkge1xuICAgIGlmICghcGxheWVyKSB7XG4gICAgICBhd2FpdCBtZXNzYWdlLnJlcGx5KGBUaGUgYm90IGlzIG5vdCBpbiBhbnkgY2hhbm5lbCFgKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgaWYgKCFjYWNoZS5ndWlsZHMuZ2V0KG1lc3NhZ2UuZ3VpbGRJZCk/LnZvaWNlU3RhdGVzLmhhcyhtZXNzYWdlLmF1dGhvcklkKSkge1xuICAgIGF3YWl0IG1lc3NhZ2UucmVwbHkoYFlvdSBuZWVkIHRvIGJlZW4gaW4gYSB2b2ljZSBjaGFubmVsIWApO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoXG4gICAgcGxheWVyLmNoYW5uZWwgIT09XG4gICAgICBjYWNoZS5ndWlsZHMuZ2V0KG1lc3NhZ2UuZ3VpbGRJZCk/LnZvaWNlU3RhdGVzLmdldChtZXNzYWdlLmF1dGhvcklkKVxuICAgICAgICA/LmNoYW5uZWxJZD8udG9TdHJpbmcoKVxuICApIHtcbiAgICBhd2FpdCBtZXNzYWdlLnJlcGx5KFxuICAgICAgYFlvdSBuZWVkIHRvIGJlZW4gaW4gdGhlIHNhbWUgdm9pY2UgY2hhbm5lbCB0aGFuIHRoZSBib3QhYCxcbiAgICApO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxHQUFHLFNBQVEsY0FBZ0I7U0FDM0IsS0FBSyxTQUEwQyxhQUFlO0FBRXZFLEVBQW9DLEFBQXBDLGdDQUFvQyxBQUFwQyxFQUFvQyxpQkFDcEIsY0FBYyxDQUFDLFlBQW9CO1dBQzFDLFlBQVksR0FBRyxPQUFPLE9BQ3JCLElBQUksQ0FBQyxZQUFZLEVBQUUsV0FBVyxHQUFHLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxRQUM3QyxJQUFJLENBQUMsWUFBWSxFQUFFLFdBQVcsR0FBRyxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUM7O1NBRzlDLFNBQVMsQ0FBQyxPQUEwQixFQUFFLE1BQWM7U0FDdEQsT0FBTyxDQUFDLE9BQU87VUFFZCxLQUFLLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU87U0FDNUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQzs7O0lBSWhDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFbkIsTUFBTSxDQUFDLElBQUksRUFBQyxHQUFLO2FBQ1YsR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU87WUFDeEMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxLQUFLOztZQUV6QyxHQUFHLENBQUMsV0FBVyxDQUFD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
