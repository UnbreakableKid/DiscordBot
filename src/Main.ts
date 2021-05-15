import { Client, Rule } from '@typeit/discord';
import axios from 'axios';
import { WebhookClient } from 'discord.js';
import cron from 'cron';
import keepAlive from '../server';

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

export class Main {
    private static _client: Client;

    static get Client(): Client {
        return this._client;
    }

    static start(): void {
        this._client = new Client();

        this._client.login(
            process.env.DISCORD_TOKEN,
            `${__dirname}/*.ts`,
            `${__dirname}/*.js`
        );

        const mufasa = new WebhookClient(
            process.env.MUFASA_ID,
            process.env.MUFASA_TOKEN
        );

        const albumOfTheDayBot = new WebhookClient(
            process.env.AOTD_ID,
            process.env.AOTD_TOKEN
        );

        let scheduledMessage = new cron.CronJob('00 00 11 * * 5', () => {
            const fridays = [
                'https://www.youtube.com/watch?v=kL62pCZ4I3k', //yakuza
                ' https://www.youtube.com/watch?v=1AnG04qnLqI', //mufasa
                'https://www.youtube.com/watch?v=UjJY8X7d9ZY', // mufasa
                'https://cdn.discordapp.com/attachments/381520882608373761/824981469591634020/friday.mp4', //big boi tommy
            ];

            mufasa
                .send(
                    `It's friday! ${
                        fridays[Math.floor(Math.random() * fridays.length)]
                    }`
                )
                .catch(console.error);
        });

        let albumOfTheDay = new cron.CronJob('00 00 8 * * *', async () => {
            const { data } = await axios.get(
                'https://1001albumsgenerator.com/api/v1/groups/pepegas-do-preco-certo'
            );

            let stuff: albumOfTheDay = data.currentAlbum;
            let album: string = `https://open.spotify.com/album/${stuff.spotifyId}`;

            albumOfTheDayBot
                .send(
                    `@here Today's album of the day is ${stuff.name} by ${stuff.artists[0].name}! ${album}`
                )
                .catch(console.error);

            albumOfTheDayBot.send("Don't forget to rate the previous one!");
        });

        albumOfTheDay.start();
        scheduledMessage.start();
    }
}



require('dotenv').config();

Main.start();
keepAlive();
