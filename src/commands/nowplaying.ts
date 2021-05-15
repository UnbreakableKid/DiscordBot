import axios from 'axios';
import stringSimilarity from 'string-similarity';
import data from '../../radios.json';
import { Command, CommandMessage } from '@typeit/discord';

export abstract class NowPlaying {
    @Command('np')
    async np(message: CommandMessage) {
        this.logic(message);
    }

    @Command('nowplaying')
    async nowplaying(message: CommandMessage) {
        this.logic(message);
    }

    async logic(message: CommandMessage) {
        let closestMatch = message.args.join(' ').toUpperCase();

        var keys = [];
        for (var k in data) keys.push(k);

        closestMatch = stringSimilarity.findBestMatch(closestMatch, keys)
            .bestMatch.target;

        let radio = data[closestMatch];
        let radioId = radio.id;

        const url: string = `https://prod.radio-api.net/stations/now-playing?stationIds=${radioId}`;

        try {
            const response = await axios.get(url);
            message.channel.send(
                `Right now on ${closestMatch} it's playing ${response.data[0].title}`
            );
        } catch (exception) {
            process.stderr.write(`ERROR received from ${url}: ${exception}\n`);
        }
    }
}
