import {
    ArgsOf,
    Client,
    CommandMessage,
    CommandNotFound,
    Discord,
    On,
    Once,
} from '@typeit/discord';
import * as Path from 'path';

@Discord('-', {
    import: [
        Path.join(__dirname, 'commands', '*.ts'),
        Path.join(__dirname, 'events', '*.ts'),
    ],
})
export class DiscordApp {
    @On('message')
    onMessage([message]: ArgsOf<'message'>, client: Client) {
        console.log(message);
    }

    @Once('ready')
    onReady() {
        console.log('I am online');
    }

    @CommandNotFound()
    notFoundA(command: CommandMessage) {
        command.reply('Command not found');
    }
}
