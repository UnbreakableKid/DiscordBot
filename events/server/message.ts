import {IExecute} from "../../interfaces/IEvents";

export const execute:IExecute = async (client, message) => {
    
}

// module.exports = (client, message) => {
//   const prefix = process.env.DISCORD_PREFIX;
//   if (!message.content.startsWith(prefix) || message.author.bot) return;

//   const args = message.content.slice(prefix.length).split(/ +/);

//   const cmd = args.shift().toLowerCase();

//   const command = client.commands.get(cmd);

//   if (command){
//      command.execute(client, message, args, Discord)
//   } else {
//     message.channel.send('Unknown command! Speak to the developers if you think you found a bug!');
//   };
// };