import { Milliseconds } from "../utils/constants/time.ts";
import { botId, cache } from "../../deps.ts";
import { configs } from "../../configs.ts";
import { bot } from "../../cache.ts";
import { log } from "../utils/logger.ts";
bot.tasks.set(`botlists`, {
    name: `botlists`,
    // Runs this function once an hour
    interval: Milliseconds.HOUR,
    execute: function() {
        // Only run when the bot is fully ready. In case guilds are still loading dont want to send wrong stats.
        if (!cache.isReady) return;
        const totalUsers = cache.guilds.map((g)=>g.memberCount
        ).reduce((a, b)=>a + b
        , 0);
        const totalGuilds = cache.guilds.size;
        // Make the variable here to get the guild count accurately
        const botLists = [
            {
                name: "discordbots.co",
                url: `https://api.discordbots.co/v1/public/bot/${botId}/stats`,
                token: configs.botListTokens.DISCORD_BOTS_CO,
                data: {
                    serverCount: totalGuilds
                }
            },
            {
                name: "discordbots.gg",
                url: `https://discordbots.org/api/bots/${botId}/stats`,
                token: configs.botListTokens.DISCORD_BOT_ORG,
                data: {
                    server_count: totalGuilds
                }
            },
            {
                name: "botsondiscord.xzy",
                url: `https://bots.ondiscord.xyz/bot-api/bots/${botId}/guilds`,
                token: configs.botListTokens.BOTS_ON_DISCORD,
                data: {
                    guildCount: totalGuilds
                }
            },
            {
                name: "discordbotlist.com",
                url: `https://discordbotlist.com/api/bots/${botId}/stats`,
                token: configs.botListTokens.DISCORD_BOT_LIST,
                data: {
                    guilds: totalGuilds,
                    users: totalUsers
                }
            },
            {
                name: "botsfordiscord.com",
                url: `https://botsfordiscord.com/api/bot/${botId}`,
                token: configs.botListTokens.BOTS_FOR_DISCORD,
                data: {
                    server_count: totalGuilds
                }
            },
            {
                name: "discordbots.group",
                url: `https://api.discordbots.group/v1/bot/${botId}`,
                token: configs.botListTokens.DISCORD_BOTS_GROUP,
                data: {
                    server_count: totalGuilds
                }
            },
            {
                name: "discord.boats",
                url: `https://discord.boats/api/bot/${botId}`,
                token: configs.botListTokens.DISCORD_BOATS,
                data: {
                    server_count: totalGuilds
                }
            },
            {
                name: "discord.bots.gg",
                url: `https://discord.bots.gg/api/v1/bots/${botId}/stats`,
                token: configs.botListTokens.DISCORD_BOTS_GG,
                data: {
                    guildCount: totalGuilds
                }
            }, 
        ];
        // For each botlist we have we need to post
        for (const list of botLists){
            if (!list.token) continue;
            // Send update request to this bot list
            fetch(list.url, {
                method: "POST",
                headers: {
                    Authorization: list.token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(list.data)
            }).then(()=>{
                log.info(`Update Bot Lists: [${list.name}] ${totalGuilds} Guilds | ${totalUsers} Users`);
            }).catch((err)=>{
                log.error({
                    location: "botlists file",
                    err
                });
            });
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL3Rhc2tzL2JvdGxpc3RzLnRzIzU+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1pbGxpc2Vjb25kcyB9IGZyb20gXCIuLi91dGlscy9jb25zdGFudHMvdGltZS50c1wiO1xuaW1wb3J0IHsgYm90SWQsIGNhY2hlIH0gZnJvbSBcIi4uLy4uL2RlcHMudHNcIjtcbmltcG9ydCB7IGNvbmZpZ3MgfSBmcm9tIFwiLi4vLi4vY29uZmlncy50c1wiO1xuaW1wb3J0IHsgYm90IH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyBsb2cgfSBmcm9tIFwiLi4vdXRpbHMvbG9nZ2VyLnRzXCI7XG5cbmJvdC50YXNrcy5zZXQoYGJvdGxpc3RzYCwge1xuICBuYW1lOiBgYm90bGlzdHNgLFxuICAvLyBSdW5zIHRoaXMgZnVuY3Rpb24gb25jZSBhbiBob3VyXG4gIGludGVydmFsOiBNaWxsaXNlY29uZHMuSE9VUixcbiAgZXhlY3V0ZTogZnVuY3Rpb24gKCkge1xuICAgIC8vIE9ubHkgcnVuIHdoZW4gdGhlIGJvdCBpcyBmdWxseSByZWFkeS4gSW4gY2FzZSBndWlsZHMgYXJlIHN0aWxsIGxvYWRpbmcgZG9udCB3YW50IHRvIHNlbmQgd3Jvbmcgc3RhdHMuXG4gICAgaWYgKCFjYWNoZS5pc1JlYWR5KSByZXR1cm47XG5cbiAgICBjb25zdCB0b3RhbFVzZXJzID0gY2FjaGUuZ3VpbGRzLm1hcCgoZykgPT4gZy5tZW1iZXJDb3VudCkucmVkdWNlKFxuICAgICAgKGEsIGIpID0+IGEgKyBiLFxuICAgICAgMCxcbiAgICApO1xuICAgIGNvbnN0IHRvdGFsR3VpbGRzID0gY2FjaGUuZ3VpbGRzLnNpemU7XG5cbiAgICAvLyBNYWtlIHRoZSB2YXJpYWJsZSBoZXJlIHRvIGdldCB0aGUgZ3VpbGQgY291bnQgYWNjdXJhdGVseVxuICAgIGNvbnN0IGJvdExpc3RzID0gW1xuICAgICAge1xuICAgICAgICBuYW1lOiBcImRpc2NvcmRib3RzLmNvXCIsXG4gICAgICAgIHVybDogYGh0dHBzOi8vYXBpLmRpc2NvcmRib3RzLmNvL3YxL3B1YmxpYy9ib3QvJHtib3RJZH0vc3RhdHNgLFxuICAgICAgICB0b2tlbjogY29uZmlncy5ib3RMaXN0VG9rZW5zLkRJU0NPUkRfQk9UU19DTyxcbiAgICAgICAgZGF0YTogeyBzZXJ2ZXJDb3VudDogdG90YWxHdWlsZHMgfSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG5hbWU6IFwiZGlzY29yZGJvdHMuZ2dcIixcbiAgICAgICAgdXJsOiBgaHR0cHM6Ly9kaXNjb3JkYm90cy5vcmcvYXBpL2JvdHMvJHtib3RJZH0vc3RhdHNgLFxuICAgICAgICB0b2tlbjogY29uZmlncy5ib3RMaXN0VG9rZW5zLkRJU0NPUkRfQk9UX09SRyxcbiAgICAgICAgZGF0YTogeyBzZXJ2ZXJfY291bnQ6IHRvdGFsR3VpbGRzIH0sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBuYW1lOiBcImJvdHNvbmRpc2NvcmQueHp5XCIsXG4gICAgICAgIHVybDogYGh0dHBzOi8vYm90cy5vbmRpc2NvcmQueHl6L2JvdC1hcGkvYm90cy8ke2JvdElkfS9ndWlsZHNgLFxuICAgICAgICB0b2tlbjogY29uZmlncy5ib3RMaXN0VG9rZW5zLkJPVFNfT05fRElTQ09SRCxcbiAgICAgICAgZGF0YTogeyBndWlsZENvdW50OiB0b3RhbEd1aWxkcyB9LFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogXCJkaXNjb3JkYm90bGlzdC5jb21cIixcbiAgICAgICAgdXJsOiBgaHR0cHM6Ly9kaXNjb3JkYm90bGlzdC5jb20vYXBpL2JvdHMvJHtib3RJZH0vc3RhdHNgLFxuICAgICAgICB0b2tlbjogY29uZmlncy5ib3RMaXN0VG9rZW5zLkRJU0NPUkRfQk9UX0xJU1QsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBndWlsZHM6IHRvdGFsR3VpbGRzLFxuICAgICAgICAgIHVzZXJzOiB0b3RhbFVzZXJzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogXCJib3RzZm9yZGlzY29yZC5jb21cIixcbiAgICAgICAgdXJsOiBgaHR0cHM6Ly9ib3RzZm9yZGlzY29yZC5jb20vYXBpL2JvdC8ke2JvdElkfWAsXG4gICAgICAgIHRva2VuOiBjb25maWdzLmJvdExpc3RUb2tlbnMuQk9UU19GT1JfRElTQ09SRCxcbiAgICAgICAgZGF0YTogeyBzZXJ2ZXJfY291bnQ6IHRvdGFsR3VpbGRzIH0sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBuYW1lOiBcImRpc2NvcmRib3RzLmdyb3VwXCIsXG4gICAgICAgIHVybDogYGh0dHBzOi8vYXBpLmRpc2NvcmRib3RzLmdyb3VwL3YxL2JvdC8ke2JvdElkfWAsXG4gICAgICAgIHRva2VuOiBjb25maWdzLmJvdExpc3RUb2tlbnMuRElTQ09SRF9CT1RTX0dST1VQLFxuICAgICAgICBkYXRhOiB7IHNlcnZlcl9jb3VudDogdG90YWxHdWlsZHMgfSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG5hbWU6IFwiZGlzY29yZC5ib2F0c1wiLFxuICAgICAgICB1cmw6IGBodHRwczovL2Rpc2NvcmQuYm9hdHMvYXBpL2JvdC8ke2JvdElkfWAsXG4gICAgICAgIHRva2VuOiBjb25maWdzLmJvdExpc3RUb2tlbnMuRElTQ09SRF9CT0FUUyxcbiAgICAgICAgZGF0YTogeyBzZXJ2ZXJfY291bnQ6IHRvdGFsR3VpbGRzIH0sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBuYW1lOiBcImRpc2NvcmQuYm90cy5nZ1wiLFxuICAgICAgICB1cmw6IGBodHRwczovL2Rpc2NvcmQuYm90cy5nZy9hcGkvdjEvYm90cy8ke2JvdElkfS9zdGF0c2AsXG4gICAgICAgIHRva2VuOiBjb25maWdzLmJvdExpc3RUb2tlbnMuRElTQ09SRF9CT1RTX0dHLFxuICAgICAgICBkYXRhOiB7IGd1aWxkQ291bnQ6IHRvdGFsR3VpbGRzIH0sXG4gICAgICB9LFxuICAgIF07XG5cbiAgICAvLyBGb3IgZWFjaCBib3RsaXN0IHdlIGhhdmUgd2UgbmVlZCB0byBwb3N0XG4gICAgZm9yIChjb25zdCBsaXN0IG9mIGJvdExpc3RzKSB7XG4gICAgICBpZiAoIWxpc3QudG9rZW4pIGNvbnRpbnVlO1xuICAgICAgLy8gU2VuZCB1cGRhdGUgcmVxdWVzdCB0byB0aGlzIGJvdCBsaXN0XG4gICAgICBmZXRjaChsaXN0LnVybCwge1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgQXV0aG9yaXphdGlvbjogbGlzdC50b2tlbixcbiAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkobGlzdC5kYXRhKSxcbiAgICAgIH0pXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICBsb2cuaW5mbyhcbiAgICAgICAgICAgIGBVcGRhdGUgQm90IExpc3RzOiBbJHtsaXN0Lm5hbWV9XSAke3RvdGFsR3VpbGRzfSBHdWlsZHMgfCAke3RvdGFsVXNlcnN9IFVzZXJzYCxcbiAgICAgICAgICApO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgIGxvZy5lcnJvcih7IGxvY2F0aW9uOiBcImJvdGxpc3RzIGZpbGVcIiwgZXJyIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH0sXG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxZQUFZLFNBQVEsMEJBQTRCO1NBQ2hELEtBQUssRUFBRSxLQUFLLFNBQVEsYUFBZTtTQUNuQyxPQUFPLFNBQVEsZ0JBQWtCO1NBQ2pDLEdBQUcsU0FBUSxjQUFnQjtTQUMzQixHQUFHLFNBQVEsa0JBQW9CO0FBRXhDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLFFBQVE7SUFDckIsSUFBSSxHQUFHLFFBQVE7SUFDZixFQUFrQyxBQUFsQyxnQ0FBa0M7SUFDbEMsUUFBUSxFQUFFLFlBQVksQ0FBQyxJQUFJO0lBQzNCLE9BQU87UUFDTCxFQUF3RyxBQUF4RyxzR0FBd0c7YUFDbkcsS0FBSyxDQUFDLE9BQU87Y0FFWixVQUFVLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFLLENBQUMsQ0FBQyxXQUFXO1VBQUUsTUFBTSxFQUM3RCxDQUFDLEVBQUUsQ0FBQyxHQUFLLENBQUMsR0FBRyxDQUFDO1VBQ2YsQ0FBQztjQUVHLFdBQVcsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUk7UUFFckMsRUFBMkQsQUFBM0QseURBQTJEO2NBQ3JELFFBQVE7O2dCQUVWLElBQUksR0FBRSxjQUFnQjtnQkFDdEIsR0FBRyxHQUFHLHlDQUF5QyxFQUFFLEtBQUssQ0FBQyxNQUFNO2dCQUM3RCxLQUFLLEVBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBQyxlQUFlO2dCQUM1QyxJQUFJO29CQUFJLFdBQVcsRUFBRSxXQUFXOzs7O2dCQUdoQyxJQUFJLEdBQUUsY0FBZ0I7Z0JBQ3RCLEdBQUcsR0FBRyxpQ0FBaUMsRUFBRSxLQUFLLENBQUMsTUFBTTtnQkFDckQsS0FBSyxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUMsZUFBZTtnQkFDNUMsSUFBSTtvQkFBSSxZQUFZLEVBQUUsV0FBVzs7OztnQkFHakMsSUFBSSxHQUFFLGlCQUFtQjtnQkFDekIsR0FBRyxHQUFHLHdDQUF3QyxFQUFFLEtBQUssQ0FBQyxPQUFPO2dCQUM3RCxLQUFLLEVBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBQyxlQUFlO2dCQUM1QyxJQUFJO29CQUFJLFVBQVUsRUFBRSxXQUFXOzs7O2dCQUcvQixJQUFJLEdBQUUsa0JBQW9CO2dCQUMxQixHQUFHLEdBQUcsb0NBQW9DLEVBQUUsS0FBSyxDQUFDLE1BQU07Z0JBQ3hELEtBQUssRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLGdCQUFnQjtnQkFDN0MsSUFBSTtvQkFDRixNQUFNLEVBQUUsV0FBVztvQkFDbkIsS0FBSyxFQUFFLFVBQVU7Ozs7Z0JBSW5CLElBQUksR0FBRSxrQkFBb0I7Z0JBQzFCLEdBQUcsR0FBRyxtQ0FBbUMsRUFBRSxLQUFLO2dCQUNoRCxLQUFLLEVBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0I7Z0JBQzdDLElBQUk7b0JBQUksWUFBWSxFQUFFLFdBQVc7Ozs7Z0JBR2pDLElBQUksR0FBRSxpQkFBbUI7Z0JBQ3pCLEdBQUcsR0FBRyxxQ0FBcUMsRUFBRSxLQUFLO2dCQUNsRCxLQUFLLEVBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBQyxrQkFBa0I7Z0JBQy9DLElBQUk7b0JBQUksWUFBWSxFQUFFLFdBQVc7Ozs7Z0JBR2pDLElBQUksR0FBRSxhQUFlO2dCQUNyQixHQUFHLEdBQUcsOEJBQThCLEVBQUUsS0FBSztnQkFDM0MsS0FBSyxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUMsYUFBYTtnQkFDMUMsSUFBSTtvQkFBSSxZQUFZLEVBQUUsV0FBVzs7OztnQkFHakMsSUFBSSxHQUFFLGVBQWlCO2dCQUN2QixHQUFHLEdBQUcsb0NBQW9DLEVBQUUsS0FBSyxDQUFDLE1BQU07Z0JBQ3hELEtBQUssRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLGVBQWU7Z0JBQzVDLElBQUk7b0JBQUksVUFBVSxFQUFFLFdBQVc7Ozs7UUFJbkMsRUFBMkMsQUFBM0MseUNBQTJDO21CQUNoQyxJQUFJLElBQUksUUFBUTtpQkFDcEIsSUFBSSxDQUFDLEtBQUs7WUFDZixFQUF1QyxBQUF2QyxxQ0FBdUM7WUFDdkMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHO2dCQUNaLE1BQU0sR0FBRSxJQUFNO2dCQUNkLE9BQU87b0JBQ0wsYUFBYSxFQUFFLElBQUksQ0FBQyxLQUFLO3FCQUN6QixZQUFjLElBQUUsZ0JBQWtCOztnQkFFcEMsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUk7ZUFFN0IsSUFBSTtnQkFDSCxHQUFHLENBQUMsSUFBSSxFQUNMLG1CQUFtQixFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLFdBQVcsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLE1BQU07ZUFHaEYsS0FBSyxFQUFFLEdBQUc7Z0JBQ1QsR0FBRyxDQUFDLEtBQUs7b0JBQUcsUUFBUSxHQUFFLGFBQWU7b0JBQUUsR0FBRyJ9