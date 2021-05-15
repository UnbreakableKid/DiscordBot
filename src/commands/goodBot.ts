import { Command, CommandMessage } from '@typeit/discord';
import { MessageAttachment } from 'discord.js';

export abstract class GoodBot {
    @Command('goodbot')
    async goodbot(message: CommandMessage) {
        const attachment = new MessageAttachment('./images/bot_icon.gif');
        message.channel.send('', attachment);
    }
}
