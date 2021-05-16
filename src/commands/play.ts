import ytdl from 'ytdl-core';
import ytSearch from 'yt-search';
import { Command, CommandMessage } from '@typeit/discord';

// export const name = 'play';
// export const description = 'play stuff';
// export const aliases = ['p'];

export abstract class Play {
    @Command('play')
    async play(message: CommandMessage) {
        const voiceChannel = message.member.voice.channel;
        const args = message.commandContent.split(' ').splice(1).join(' ');

        if (!voiceChannel)
            return message.channel.send('Join a voice channel you dweeb');

        const permissions = voiceChannel.permissionsFor(message.client.user);

        if (!permissions.has('CONNECT') || !permissions.has('SPEAK'))
            return message.channel.send("you don't have permissions");

        if (!args.length) return message.channel.send('Wrong number of args');

        const videoFinder = async (query) => {
            const videoResult = await ytSearch(query);
            return videoResult.videos.length > 1 ? videoResult.videos[0] : null;
        };

        const isLink = (link: string) => {
            var pattern = new RegExp(
                '^(https?://)?(www.)?(youtube.com|youtu.?be)/.+$'
            ); // fragment locator

            return !!pattern.test(link);
        };

        const query = args;

        if (isLink(query)) {
            const connection = await voiceChannel.join();
            connection
                .play(ytdl(query, { filter: 'audioonly' }), {
                    seek: 0,
                    volume: 1,
                    bitrate: 'auto',
                })
                .on('finish', () => {
                    voiceChannel.leave();
                });
        } else {
            const video = await videoFinder(query);

            if (video) {
                // console.log(video.url);
                const connection = await voiceChannel.join();
                connection
                    .play(ytdl(video.url, { filter: 'audioonly' }), {
                        seek: 0,
                        volume: 1,
                        bitrate: 'auto',
                    })
                    .on('finish', () => {
                        voiceChannel.leave();
                    });

                await message.reply(`${video.title} is playing`);
            } else message.channel.send("Couldn't play vid");
        }
    }
}
