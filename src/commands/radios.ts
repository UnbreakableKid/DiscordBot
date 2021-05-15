import { IExecute } from '../interfaces/ICommands';
import { readFile } from 'fs';
import data from '../../radios.json';
import { Command, CommandMessage } from '@typeit/discord';

export interface IRadio {
    name: string;
    id: string;
    link: string;
}
interface IRadios {
    radios: IRadio[];
}

// export const name = 'radios';
// export const description = 'List all radios';

export abstract class Radios {
    @Command('radios')
    async radios(message: CommandMessage) {
        const da = data;
        var str = '';

        for (let radio in da) {
            str += radio + '\n';
        }
        message.channel.send(str);
    }
}
