import { DiscordenoMessage } from "../../../deps.ts";
import { createCommand } from "../../utils/helpers.ts";
import { sortWordByMinDistance } from "https://deno.land/x/damerau_levenshtein@v0.1.0/mod.ts";
import { bot } from "../../../cache.ts";
import { addSoundToQueue } from "../../utils/voice.ts";
import { addPlaylistToQueue } from "../../utils/voice.ts";

createCommand({
  name: "radio",
  aliases: ["r"],
  guildOnly: true,
  arguments: [{ type: "...strings", name: "query", required: true }],
  userServerPermissions: ["SPEAK", "CONNECT"],

  async execute(message: DiscordenoMessage, args) {
    const voiceState = message.guild?.voiceStates.get(message.authorId);

    const data = JSON.parse(
      Deno.readTextFileSync("./src/commands/voice/radios.json"),
    );

    if (!voiceState?.channelId) {
      return message.reply("Join a voice channel you dweeb");
    }

    let radio: IRadio | null = null;

    let closestMatch: string = args.query.toUpperCase();

    var radiolink: string;

    var keys = [];
    for (var k in data) keys.push(k);

    closestMatch = sortWordByMinDistance(closestMatch, keys)[0].string;
    radio = data[closestMatch];
    radiolink = radio!.link;

    message.reply(radiolink);

    // break;
    // }

    if (radio) {
      // Get player from map (Might not exist)
      const player = bot.lavadenoManager.players.get(
        message.guildId.toString(),
      );

      if (player) {
        player.connect(voiceState.channelId.toString(), {
          selfDeaf: true,
        });
      } else {
        const newPlayer = bot.lavadenoManager.create(
          message.guildId.toString(),
        );
        newPlayer.connect(voiceState.channelId.toString(), {
          selfDeaf: true,
        });
      }

      await message.reply(`Successfully joined the channel!`);
    }

    const result = await bot.lavadenoManager.search(radiolink);

    switch (result.loadType) {
      case "TRACK_LOADED":
      case "SEARCH_RESULT": {
        return addSoundToQueue(message, result.tracks[0]);
      }
      case "PLAYLIST_LOADED": {
        return addPlaylistToQueue(
          message,
          result.playlistInfo!.name,
          result.tracks,
        );
      }
      default:
        return message.reply(`Could not find any song with that name!`);
    }
  },
});

export interface IRadio {
  name: string;
  id: string;
  link: string;
}
interface IRadios {
  radios: IRadio[];
}
