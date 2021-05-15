import { Command, CommandMessage } from '@typeit/discord';

// export const name = 'ping';
// export const description = 'ping pong';

export abstract class Ping {
    @Command('ping')
    async ping(message: CommandMessage) {
        message.channel.send('pong!');
    }
}
