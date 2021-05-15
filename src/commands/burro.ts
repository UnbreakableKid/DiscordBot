import { Command, CommandMessage } from '@typeit/discord';

export abstract class burro {
    @Command('burro')
    async burro(message: CommandMessage) {
        message.channel.send('burro és tu!');
    }
}
