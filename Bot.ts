import { Client, Collection, Intents, WebhookClient } from "discord.js";
import { readdirSync } from "fs";
import { ICommand } from "./interfaces/ICommands";
import { IEvent } from "./interfaces/IEvents";
import cron from "cron";

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
      "693295402555801611",
      "GFZ0XiChiDX5aIcT8oeWFioguAJQghviDAo5e8lrjvJPfcwdLAdGKvtx6iKQ_CSH2l-W"
    );

    let scheduledMessage = new cron.CronJob("00 00 11 * * 5", () => {
      const fridays = [
        "https://www.youtube.com/watch?v=kL62pCZ4I3k", //yakuza
        " https://www.youtube.com/watch?v=1AnG04qnLqI", //mufasa
        "https://cdn.discordapp.com/attachments/381520882608373761/824981469591634020/friday.mp4", //big boi tommy
        "https://www.youtube.com/watch?v=UjJY8X7d9ZY",
      ];
      // This runs every day at 10:30:00, you can do anything you want

      mufasa
        .send(
          `It's friday! ${fridays[Math.floor(Math.random() * fridays.length)]}`
        )
        .catch(console.error);
    });

    scheduledMessage.start();
  };
}
export { Bot };
