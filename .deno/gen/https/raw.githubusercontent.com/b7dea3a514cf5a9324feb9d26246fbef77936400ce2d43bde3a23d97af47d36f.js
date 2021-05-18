import { eventHandlers } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { rest } from "../../rest/rest.ts";
import { Errors } from "../../types/discordeno/errors.ts";
import { snowflakeToBigint } from "../../util/bigint.ts";
import { Collection } from "../../util/collection.ts";
import { endpoints } from "../../util/constants.ts";
/**
 * Returns a list of emojis for the given guild.
 *
 * ⚠️ **If you need this, you are probably doing something wrong. Always use cache.guilds.get()?.emojis
 */ export async function getEmojis(guildId, addToCache = true) {
    const result = await rest.runMethod("get", endpoints.GUILD_EMOJIS(guildId));
    if (addToCache) {
        const guild = await cacheHandlers.get("guilds", guildId);
        if (!guild) throw new Error(Errors.GUILD_NOT_FOUND);
        result.forEach((emoji)=>{
            eventHandlers.debug?.("loop", `Running forEach loop in get_emojis file.`);
            guild.emojis.set(snowflakeToBigint(emoji.id), emoji);
        });
        await cacheHandlers.set("guilds", guildId, guild);
    }
    return new Collection(result.map((e)=>[
            e.id,
            e
        ]
    ));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvZW1vamlzL2dldF9lbW9qaXMudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV2ZW50SGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vYm90LnRzXCI7XG5pbXBvcnQgeyBjYWNoZUhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHR5cGUgeyBFbW9qaSB9IGZyb20gXCIuLi8uLi90eXBlcy9lbW9qaXMvZW1vamkudHNcIjtcbmltcG9ydCB7IEVycm9ycyB9IGZyb20gXCIuLi8uLi90eXBlcy9kaXNjb3JkZW5vL2Vycm9ycy50c1wiO1xuaW1wb3J0IHsgc25vd2ZsYWtlVG9CaWdpbnQgfSBmcm9tIFwiLi4vLi4vdXRpbC9iaWdpbnQudHNcIjtcbmltcG9ydCB7IENvbGxlY3Rpb24gfSBmcm9tIFwiLi4vLi4vdXRpbC9jb2xsZWN0aW9uLnRzXCI7XG5pbXBvcnQgeyBlbmRwb2ludHMgfSBmcm9tIFwiLi4vLi4vdXRpbC9jb25zdGFudHMudHNcIjtcblxuLyoqXG4gKiBSZXR1cm5zIGEgbGlzdCBvZiBlbW9qaXMgZm9yIHRoZSBnaXZlbiBndWlsZC5cbiAqXG4gKiDimqDvuI8gKipJZiB5b3UgbmVlZCB0aGlzLCB5b3UgYXJlIHByb2JhYmx5IGRvaW5nIHNvbWV0aGluZyB3cm9uZy4gQWx3YXlzIHVzZSBjYWNoZS5ndWlsZHMuZ2V0KCk/LmVtb2ppc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0RW1vamlzKGd1aWxkSWQ6IGJpZ2ludCwgYWRkVG9DYWNoZSA9IHRydWUpIHtcbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzdC5ydW5NZXRob2Q8RW1vamlbXT4oXG4gICAgXCJnZXRcIixcbiAgICBlbmRwb2ludHMuR1VJTERfRU1PSklTKGd1aWxkSWQpLFxuICApO1xuXG4gIGlmIChhZGRUb0NhY2hlKSB7XG4gICAgY29uc3QgZ3VpbGQgPSBhd2FpdCBjYWNoZUhhbmRsZXJzLmdldChcImd1aWxkc1wiLCBndWlsZElkKTtcbiAgICBpZiAoIWd1aWxkKSB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLkdVSUxEX05PVF9GT1VORCk7XG5cbiAgICByZXN1bHQuZm9yRWFjaCgoZW1vamkpID0+IHtcbiAgICAgIGV2ZW50SGFuZGxlcnMuZGVidWc/LihcbiAgICAgICAgXCJsb29wXCIsXG4gICAgICAgIGBSdW5uaW5nIGZvckVhY2ggbG9vcCBpbiBnZXRfZW1vamlzIGZpbGUuYCxcbiAgICAgICk7XG4gICAgICBndWlsZC5lbW9qaXMuc2V0KHNub3dmbGFrZVRvQmlnaW50KGVtb2ppLmlkISksIGVtb2ppKTtcbiAgICB9KTtcblxuICAgIGF3YWl0IGNhY2hlSGFuZGxlcnMuc2V0KFwiZ3VpbGRzXCIsIGd1aWxkSWQsIGd1aWxkKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgQ29sbGVjdGlvbihyZXN1bHQubWFwKChlKSA9PiBbZS5pZCEsIGVdKSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsYUFBYSxTQUFRLFlBQWM7U0FDbkMsYUFBYSxTQUFRLGNBQWdCO1NBQ3JDLElBQUksU0FBUSxrQkFBb0I7U0FFaEMsTUFBTSxTQUFRLGdDQUFrQztTQUNoRCxpQkFBaUIsU0FBUSxvQkFBc0I7U0FDL0MsVUFBVSxTQUFRLHdCQUEwQjtTQUM1QyxTQUFTLFNBQVEsdUJBQXlCO0FBRW5ELEVBSUcsQUFKSDs7OztDQUlHLEFBSkgsRUFJRyx1QkFDbUIsU0FBUyxDQUFDLE9BQWUsRUFBRSxVQUFVLEdBQUcsSUFBSTtVQUMxRCxNQUFNLFNBQVMsSUFBSSxDQUFDLFNBQVMsRUFDakMsR0FBSyxHQUNMLFNBQVMsQ0FBQyxZQUFZLENBQUMsT0FBTztRQUc1QixVQUFVO2NBQ04sS0FBSyxTQUFTLGFBQWEsQ0FBQyxHQUFHLEVBQUMsTUFBUSxHQUFFLE9BQU87YUFDbEQsS0FBSyxZQUFZLEtBQUssQ0FBQyxNQUFNLENBQUMsZUFBZTtRQUVsRCxNQUFNLENBQUMsT0FBTyxFQUFFLEtBQUs7WUFDbkIsYUFBYSxDQUFDLEtBQUssSUFDakIsSUFBTSxJQUNMLHdDQUF3QztZQUUzQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFJLEtBQUs7O2NBR2hELGFBQWEsQ0FBQyxHQUFHLEVBQUMsTUFBUSxHQUFFLE9BQU8sRUFBRSxLQUFLOztlQUd2QyxVQUFVLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQU0sQ0FBQyxDQUFDLEVBQUU7WUFBRyxDQUFDIn0=