import { Command, CommandMessage } from '@typeit/discord';

// export const name = 'pong';
// export const description = 'pong ping';

export abstract class Ping {
    @Command('pong')
    async pong(message: CommandMessage) {
        message.channel.send('ping!');
    }
}
