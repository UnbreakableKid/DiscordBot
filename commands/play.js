const ytdl = require("ytdl-core");

module.exports = {
  name: "play",
  description: "play stuff",
  async execute(client, message, args) {
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel)
      return message.channel.send("Join a voice channel you dweeb");
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!args.length) return message.channel.send("Wrong number of args");

    const connection = await voiceChannel.join();
  },
};