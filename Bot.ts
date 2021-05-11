import { Client, Collection, Intents, WebhookClient } from "discord.js";
import { readdirSync } from "fs";
import { ICommand } from "./interfaces/ICommands";
import { IEvent } from "./interfaces/IEvents";
import cron from "cron";
import axios from "axios";

export interface albumOfTheDay {
  artists: artists[];
  name: string;
  releaseDate: string;
  youtubeSearchQuery: string;
  spotifyId: string;
}

interface artists {
  external_urls: external_urls;
  name: string;
}

interface external_urls {
  spotify: string;
}
class Bot extends Client {
  public prefix: string;
  public commands: Collection<string, ICommand> = new Collection();
  public event: Collection<string, IEvent> = new Collection();

  public constructor() {
    super();
  }

  public init = () => {
    this.prefix = process.env.DISCORD_PREFIX;

    this.login(process.env.DISCORD_TOKEN);

    const command_files = readdirSync("./commands/").filter((file) =>
      file.endsWith(".ts")
    );
    command_files.map(async (fileName: string) => {
      const command = (await import(`./commands/${fileName}`)) as ICommand;
      this.commands.set(command.name, command);
    });

    let dirs = ["client", "server"];

    var event_files;
    const load_dir = async (dirs) => {
      event_files = readdirSync(`./events/${dirs}`).filter((file) =>
        file.endsWith(".ts")
      );

      event_files.map(async (filename: string) => {
        const event = (await import(`./events/${dirs}/${filename}`)) as IEvent;

        const event_name = event.name;
        this.on(event_name, event.execute.bind(null, this));
      });
    };
    ["client", "server"].forEach((e) => load_dir(e));

    const mufasa = new WebhookClient(
      process.env.MUFASA_ID,
      process.env.MUFASA_TOKEN
    );

    const albumOfTheDayBot = new WebhookClient(
      process.env.AOTD_ID,
      process.env.AOTD_TOKEN
    );

    let scheduledMessage = new cron.CronJob("00 00 11 * * 5", () => {
      const fridays = [
        "https://www.youtube.com/watch?v=kL62pCZ4I3k", //yakuza
        " https://www.youtube.com/watch?v=1AnG04qnLqI", //mufasa
        "https://www.youtube.com/watch?v=UjJY8X7d9ZY", // mufasa
        "https://cdn.discordapp.com/attachments/381520882608373761/824981469591634020/friday.mp4", //big boi tommy
      ];

      mufasa
        .send(
          `It's friday! ${fridays[Math.floor(Math.random() * fridays.length)]}`
        )
        .catch(console.error);
    });

    let albumOfTheDay = new cron.CronJob("00 00 8 * * *", async () => {
      const { data } = await axios.get(
        "https://1001albumsgenerator.com/api/v1/groups/pepegas-do-preco-certo"
      );

      let stuff: albumOfTheDay = data.currentAlbum;
      let album: string = `https://open.spotify.com/album/${stuff.spotifyId}`;

      albumOfTheDayBot
        .send(
          `@here Today's album of the day is ${stuff.name} by ${stuff.artists[0].name}! ${album}`
        )
        .catch(console.error);
    });

    albumOfTheDay.start();
    scheduledMessage.start();
  };
}
export { Bot };
