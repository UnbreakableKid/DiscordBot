import { Command, CommandMessage } from '@typeit/discord';
import { MessageAttachment } from 'discord.js';

// export const name = 'leave';
// export const description = 'leave the channel';

export abstract class Leave {
    @Command('leave')
    async leave(message: CommandMessage) {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel)
            return message.channel.send(
                'You need to be in a voice channel sir'
            );

        voiceChannel.leave();
        await message.channel.send('Im leaving');
    }
}
