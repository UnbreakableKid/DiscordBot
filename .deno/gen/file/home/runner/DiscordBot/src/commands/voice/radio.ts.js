import { createCommand } from "../../utils/helpers.ts";
import { sortWordByMinDistance } from "https://deno.land/x/damerau_levenshtein@v0.1.0/mod.ts";
import { bot } from "../../../cache.ts";
createCommand({
    name: "radio",
    aliases: [
        "r"
    ],
    guildOnly: true,
    arguments: [
        {
            type: "...strings",
            name: "query",
            required: true
        }
    ],
    userServerPermissions: [
        "SPEAK",
        "CONNECT"
    ],
    async execute (message, args) {
        const voiceState = message.guild?.voiceStates.get(message.authorId);
        const data = JSON.parse(Deno.readTextFileSync("./src/commands/voice/radios.json"));
        if (!voiceState?.channelId) {
            return message.reply("Join a voice channel you dweeb");
        }
        // if (!args.length) return message.reply('Wrong number of args');
        // console.log(video.url);
        let radio = null;
        let closestMatch = args.query.toUpperCase();
        var radiolink;
        var keys = [];
        for(var k in data)keys.push(k);
        closestMatch = sortWordByMinDistance(closestMatch, keys)[0].string;
        radio = data[closestMatch];
        radiolink = radio.link;
        message.reply(radio.id);
        // break;
        // }
        if (radio) {
            // Get player from map (Might not exist)
            const player = bot.lavadenoManager.players.get(message.guildId.toString());
            if (player) {
                player.connect(voiceState.channelId.toString(), {
                    selfDeaf: true
                });
                const results = await player.manager.search("bka");
                const { track , info  } = results.tracks[0];
                player.play("https://www.youtube.com/watch?v=rixsfO9WkbM");
            } else {
                // player doesn't exist, create one and connect
                const newPlayer = bot.lavadenoManager.create(message.guildId.toString());
                newPlayer.connect(voiceState.channelId.toString(), {
                    selfDeaf: true
                });
                (await newPlayer.play(radio.link)).on("error", ()=>message.reply(":(")
                );
            }
        //     const connection = await voiceState?.channelId.;
        //     connection
        //         .play(radiolink, { seek: 0, volume: 1, bitrate: 'auto' })
        //         .on('finish', () => {
        //             voiceState.leave();
        //         });
        //     await message.reply(`Radio ${closestMatch} is playing`);
        // }
        }
    }
});
const isLink = (link)=>{
    var pattern = new RegExp("^(https?:\\/\\/)?" + "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + "((\\d{1,3}\\.){3}\\d{1,3}))" + "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + "(\\?[;&a-z\\d%_.~+=-]*)?" + "(\\#[-a-z\\d_]*)?$", "i"); // fragment locator
    return !!pattern.test(link);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2NvbW1hbmRzL3ZvaWNlL3JhZGlvLnRzIzg+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpc2NvcmRlbm9NZXNzYWdlLCBQbGF5ZXIgfSBmcm9tIFwiLi4vLi4vLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgY3JlYXRlQ29tbWFuZCB9IGZyb20gXCIuLi8uLi91dGlscy9oZWxwZXJzLnRzXCI7XG5pbXBvcnQgeyBzb3J0V29yZEJ5TWluRGlzdGFuY2UgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9kYW1lcmF1X2xldmVuc2h0ZWluQHYwLjEuMC9tb2QudHNcIjtcbmltcG9ydCB7IGJvdCB9IGZyb20gXCIuLi8uLi8uLi9jYWNoZS50c1wiO1xuXG5jcmVhdGVDb21tYW5kKHtcbiAgbmFtZTogXCJyYWRpb1wiLFxuICBhbGlhc2VzOiBbXCJyXCJdLFxuICBndWlsZE9ubHk6IHRydWUsXG4gIGFyZ3VtZW50czogW3sgdHlwZTogXCIuLi5zdHJpbmdzXCIsIG5hbWU6IFwicXVlcnlcIiwgcmVxdWlyZWQ6IHRydWUgfV0sXG4gIHVzZXJTZXJ2ZXJQZXJtaXNzaW9uczogW1wiU1BFQUtcIiwgXCJDT05ORUNUXCJdLFxuXG4gIGFzeW5jIGV4ZWN1dGUobWVzc2FnZTogRGlzY29yZGVub01lc3NhZ2UsIGFyZ3MpIHtcbiAgICBjb25zdCB2b2ljZVN0YXRlID0gbWVzc2FnZS5ndWlsZD8udm9pY2VTdGF0ZXMuZ2V0KG1lc3NhZ2UuYXV0aG9ySWQpO1xuXG4gICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UoXG4gICAgICBEZW5vLnJlYWRUZXh0RmlsZVN5bmMoXCIuL3NyYy9jb21tYW5kcy92b2ljZS9yYWRpb3MuanNvblwiKSxcbiAgICApO1xuXG4gICAgaWYgKCF2b2ljZVN0YXRlPy5jaGFubmVsSWQpIHtcbiAgICAgIHJldHVybiBtZXNzYWdlLnJlcGx5KFwiSm9pbiBhIHZvaWNlIGNoYW5uZWwgeW91IGR3ZWViXCIpO1xuICAgIH1cblxuICAgIC8vIGlmICghYXJncy5sZW5ndGgpIHJldHVybiBtZXNzYWdlLnJlcGx5KCdXcm9uZyBudW1iZXIgb2YgYXJncycpO1xuXG4gICAgLy8gY29uc29sZS5sb2codmlkZW8udXJsKTtcblxuICAgIGxldCByYWRpbzogSVJhZGlvIHwgbnVsbCA9IG51bGw7XG5cbiAgICBsZXQgY2xvc2VzdE1hdGNoOiBzdHJpbmcgPSBhcmdzLnF1ZXJ5LnRvVXBwZXJDYXNlKCk7XG5cbiAgICB2YXIgcmFkaW9saW5rOiBzdHJpbmc7XG5cbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGsgaW4gZGF0YSkga2V5cy5wdXNoKGspO1xuXG4gICAgY2xvc2VzdE1hdGNoID0gc29ydFdvcmRCeU1pbkRpc3RhbmNlKGNsb3Nlc3RNYXRjaCwga2V5cylbMF0uc3RyaW5nO1xuICAgIHJhZGlvID0gZGF0YVtjbG9zZXN0TWF0Y2hdO1xuICAgIHJhZGlvbGluayA9IHJhZGlvIS5saW5rO1xuXG4gICAgbWVzc2FnZS5yZXBseShyYWRpbyEuaWQpO1xuXG4gICAgLy8gYnJlYWs7XG4gICAgLy8gfVxuXG4gICAgaWYgKHJhZGlvKSB7XG4gICAgICAvLyBHZXQgcGxheWVyIGZyb20gbWFwIChNaWdodCBub3QgZXhpc3QpXG4gICAgICBjb25zdCBwbGF5ZXIgPSBib3QubGF2YWRlbm9NYW5hZ2VyLnBsYXllcnMuZ2V0KFxuICAgICAgICBtZXNzYWdlLmd1aWxkSWQudG9TdHJpbmcoKSxcbiAgICAgICk7XG5cbiAgICAgIGlmIChwbGF5ZXIpIHtcbiAgICAgICAgcGxheWVyLmNvbm5lY3Qodm9pY2VTdGF0ZS5jaGFubmVsSWQudG9TdHJpbmcoKSwge1xuICAgICAgICAgIHNlbGZEZWFmOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHBsYXllci5tYW5hZ2VyLnNlYXJjaChcImJrYVwiKTtcbiAgICAgICAgY29uc3QgeyB0cmFjaywgaW5mbyB9ID0gcmVzdWx0cy50cmFja3NbMF07XG4gICAgICAgIHBsYXllci5wbGF5KFwiaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1yaXhzZk85V2tiTVwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHBsYXllciBkb2Vzbid0IGV4aXN0LCBjcmVhdGUgb25lIGFuZCBjb25uZWN0XG4gICAgICAgIGNvbnN0IG5ld1BsYXllciA9IGJvdC5sYXZhZGVub01hbmFnZXIuY3JlYXRlKFxuICAgICAgICAgIG1lc3NhZ2UuZ3VpbGRJZC50b1N0cmluZygpLFxuICAgICAgICApO1xuICAgICAgICBuZXdQbGF5ZXIuY29ubmVjdCh2b2ljZVN0YXRlLmNoYW5uZWxJZC50b1N0cmluZygpLCB7XG4gICAgICAgICAgc2VsZkRlYWY6IHRydWUsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIChhd2FpdCBuZXdQbGF5ZXIucGxheShyYWRpby5saW5rKSkub24oXG4gICAgICAgICAgXCJlcnJvclwiLFxuICAgICAgICAgICgpID0+IG1lc3NhZ2UucmVwbHkoXCI6KFwiKSxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgLy8gICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBhd2FpdCB2b2ljZVN0YXRlPy5jaGFubmVsSWQuO1xuICAgICAgLy8gICAgIGNvbm5lY3Rpb25cbiAgICAgIC8vICAgICAgICAgLnBsYXkocmFkaW9saW5rLCB7IHNlZWs6IDAsIHZvbHVtZTogMSwgYml0cmF0ZTogJ2F1dG8nIH0pXG4gICAgICAvLyAgICAgICAgIC5vbignZmluaXNoJywgKCkgPT4ge1xuICAgICAgLy8gICAgICAgICAgICAgdm9pY2VTdGF0ZS5sZWF2ZSgpO1xuICAgICAgLy8gICAgICAgICB9KTtcblxuICAgICAgLy8gICAgIGF3YWl0IG1lc3NhZ2UucmVwbHkoYFJhZGlvICR7Y2xvc2VzdE1hdGNofSBpcyBwbGF5aW5nYCk7XG4gICAgICAvLyB9XG4gICAgfVxuICB9LFxufSk7XG5cbmNvbnN0IGlzTGluayA9IChsaW5rOiBzdHJpbmcpID0+IHtcbiAgdmFyIHBhdHRlcm4gPSBuZXcgUmVnRXhwKFxuICAgIFwiXihodHRwcz86XFxcXC9cXFxcLyk/XCIgKyAvLyBwcm90b2NvbFxuICAgICAgXCIoKChbYS16XFxcXGRdKFthLXpcXFxcZC1dKlthLXpcXFxcZF0pKilcXFxcLikrW2Etel17Mix9fFwiICsgLy8gZG9tYWluIG5hbWVcbiAgICAgIFwiKChcXFxcZHsxLDN9XFxcXC4pezN9XFxcXGR7MSwzfSkpXCIgKyAvLyBPUiBpcCAodjQpIGFkZHJlc3NcbiAgICAgIFwiKFxcXFw6XFxcXGQrKT8oXFxcXC9bLWEtelxcXFxkJV8ufitdKikqXCIgKyAvLyBwb3J0IGFuZCBwYXRoXG4gICAgICBcIihcXFxcP1s7JmEtelxcXFxkJV8ufis9LV0qKT9cIiArIC8vIHF1ZXJ5IHN0cmluZ1xuICAgICAgXCIoXFxcXCNbLWEtelxcXFxkX10qKT8kXCIsXG4gICAgXCJpXCIsXG4gICk7IC8vIGZyYWdtZW50IGxvY2F0b3JcblxuICByZXR1cm4gISFwYXR0ZXJuLnRlc3QobGluayk7XG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIElSYWRpbyB7XG4gIG5hbWU6IHN0cmluZztcbiAgaWQ6IHN0cmluZztcbiAgbGluazogc3RyaW5nO1xufVxuaW50ZXJmYWNlIElSYWRpb3Mge1xuICByYWRpb3M6IElSYWRpb1tdO1xufVxuXG4vLyBleHBvcnQgYWJzdHJhY3QgY2xhc3MgUmFkaW9zIHtcbi8vICAgICBhc3luYyByYWRpb3MobWVzc2FnZTogQ29tbWFuZE1lc3NhZ2UpIHtcbi8vICAgICAgICAgY29uc3QgZGEgPSBkYXRhO1xuLy8gICAgICAgICB2YXIgc3RyID0gJyc7XG5cbi8vICAgICAgICAgZm9yIChsZXQgcmFkaW8gaW4gZGEpIHtcbi8vICAgICAgICAgICAgIHN0ciArPSByYWRpbyArICdcXG4nO1xuLy8gICAgICAgICB9XG4vLyAgICAgICAgIG1lc3NhZ2UuY2hhbm5lbC5zZW5kKHN0cik7XG4vLyAgICAgfVxu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