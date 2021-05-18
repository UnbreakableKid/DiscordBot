import { eventHandlers } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { structures } from "../../structures/mod.ts";
import { snowflakeToBigint } from "../../util/bigint.ts";
export async function handleGuildUpdate(data, shardId) {
    const payload = data.d;
    const oldGuild = await cacheHandlers.get("guilds", snowflakeToBigint(payload.id));
    if (!oldGuild) return;
    const keysToSkip = [
        "id",
        "roles",
        "guildHashes",
        "guildId",
        "maxMembers",
        "emojis", 
    ];
    const newGuild = await structures.createDiscordenoGuild(payload, shardId);
    const changes = Object.entries(newGuild).map(([key, value])=>{
        if (keysToSkip.includes(key)) return;
        // @ts-ignore index signature
        const cachedValue = oldGuild[key];
        if (cachedValue === value) return;
        // Guild create sends undefined and update sends false.
        if (!cachedValue && !value) return;
        if (Array.isArray(cachedValue) && Array.isArray(value)) {
            const different = cachedValue.length !== value.length || cachedValue.find((val)=>!value.includes(val)
            ) || value.find((val)=>!cachedValue.includes(val)
            );
            if (!different) return;
        }
        return {
            key,
            oldValue: cachedValue,
            value
        };
    }).filter((change)=>change
    );
    await cacheHandlers.set("guilds", newGuild.id, newGuild);
    eventHandlers.guildUpdate?.(newGuild, changes);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hhbmRsZXJzL2d1aWxkcy9HVUlMRF9VUERBVEUudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV2ZW50SGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vYm90LnRzXCI7XG5pbXBvcnQgeyBjYWNoZUhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyBzdHJ1Y3R1cmVzIH0gZnJvbSBcIi4uLy4uL3N0cnVjdHVyZXMvbW9kLnRzXCI7XG5pbXBvcnQgdHlwZSB7IEd1aWxkVXBkYXRlQ2hhbmdlIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2Rpc2NvcmRlbm8vZ3VpbGRfdXBkYXRlX2NoYW5nZS50c1wiO1xuaW1wb3J0IHR5cGUgeyBEaXNjb3JkR2F0ZXdheVBheWxvYWQgfSBmcm9tIFwiLi4vLi4vdHlwZXMvZ2F0ZXdheS9nYXRld2F5X3BheWxvYWQudHNcIjtcbmltcG9ydCB0eXBlIHsgR3VpbGQgfSBmcm9tIFwiLi4vLi4vdHlwZXMvZ3VpbGRzL2d1aWxkLnRzXCI7XG5pbXBvcnQgeyBzbm93Zmxha2VUb0JpZ2ludCB9IGZyb20gXCIuLi8uLi91dGlsL2JpZ2ludC50c1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlR3VpbGRVcGRhdGUoXG4gIGRhdGE6IERpc2NvcmRHYXRld2F5UGF5bG9hZCxcbiAgc2hhcmRJZDogbnVtYmVyLFxuKSB7XG4gIGNvbnN0IHBheWxvYWQgPSBkYXRhLmQgYXMgR3VpbGQ7XG4gIGNvbnN0IG9sZEd1aWxkID0gYXdhaXQgY2FjaGVIYW5kbGVycy5nZXQoXG4gICAgXCJndWlsZHNcIixcbiAgICBzbm93Zmxha2VUb0JpZ2ludChwYXlsb2FkLmlkKSxcbiAgKTtcbiAgaWYgKCFvbGRHdWlsZCkgcmV0dXJuO1xuXG4gIGNvbnN0IGtleXNUb1NraXAgPSBbXG4gICAgXCJpZFwiLFxuICAgIFwicm9sZXNcIixcbiAgICBcImd1aWxkSGFzaGVzXCIsXG4gICAgXCJndWlsZElkXCIsXG4gICAgXCJtYXhNZW1iZXJzXCIsXG4gICAgXCJlbW9qaXNcIixcbiAgXTtcblxuICBjb25zdCBuZXdHdWlsZCA9IGF3YWl0IHN0cnVjdHVyZXMuY3JlYXRlRGlzY29yZGVub0d1aWxkKHBheWxvYWQsIHNoYXJkSWQpO1xuXG4gIGNvbnN0IGNoYW5nZXMgPSBPYmplY3QuZW50cmllcyhuZXdHdWlsZClcbiAgICAubWFwKChba2V5LCB2YWx1ZV0pID0+IHtcbiAgICAgIGlmIChrZXlzVG9Ta2lwLmluY2x1ZGVzKGtleSkpIHJldHVybjtcblxuICAgICAgLy8gQHRzLWlnbm9yZSBpbmRleCBzaWduYXR1cmVcbiAgICAgIGNvbnN0IGNhY2hlZFZhbHVlID0gb2xkR3VpbGRba2V5XTtcblxuICAgICAgaWYgKGNhY2hlZFZhbHVlID09PSB2YWx1ZSkgcmV0dXJuO1xuICAgICAgLy8gR3VpbGQgY3JlYXRlIHNlbmRzIHVuZGVmaW5lZCBhbmQgdXBkYXRlIHNlbmRzIGZhbHNlLlxuICAgICAgaWYgKCFjYWNoZWRWYWx1ZSAmJiAhdmFsdWUpIHJldHVybjtcblxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY2FjaGVkVmFsdWUpICYmIEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIGNvbnN0IGRpZmZlcmVudCA9IGNhY2hlZFZhbHVlLmxlbmd0aCAhPT0gdmFsdWUubGVuZ3RoIHx8XG4gICAgICAgICAgY2FjaGVkVmFsdWUuZmluZCgodmFsKSA9PiAhdmFsdWUuaW5jbHVkZXModmFsKSkgfHxcbiAgICAgICAgICB2YWx1ZS5maW5kKCh2YWwpID0+ICFjYWNoZWRWYWx1ZS5pbmNsdWRlcyh2YWwpKTtcbiAgICAgICAgaWYgKCFkaWZmZXJlbnQpIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHsga2V5LCBvbGRWYWx1ZTogY2FjaGVkVmFsdWUsIHZhbHVlIH07XG4gICAgfSlcbiAgICAuZmlsdGVyKChjaGFuZ2UpID0+IGNoYW5nZSkgYXMgR3VpbGRVcGRhdGVDaGFuZ2VbXTtcblxuICBhd2FpdCBjYWNoZUhhbmRsZXJzLnNldChcImd1aWxkc1wiLCBuZXdHdWlsZC5pZCwgbmV3R3VpbGQpO1xuXG4gIGV2ZW50SGFuZGxlcnMuZ3VpbGRVcGRhdGU/LihuZXdHdWlsZCwgY2hhbmdlcyk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsYUFBYSxTQUFRLFlBQWM7U0FDbkMsYUFBYSxTQUFRLGNBQWdCO1NBQ3JDLFVBQVUsU0FBUSx1QkFBeUI7U0FJM0MsaUJBQWlCLFNBQVEsb0JBQXNCO3NCQUVsQyxpQkFBaUIsQ0FDckMsSUFBMkIsRUFDM0IsT0FBZTtVQUVULE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQztVQUNoQixRQUFRLFNBQVMsYUFBYSxDQUFDLEdBQUcsRUFDdEMsTUFBUSxHQUNSLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxFQUFFO1NBRXpCLFFBQVE7VUFFUCxVQUFVO1NBQ2QsRUFBSTtTQUNKLEtBQU87U0FDUCxXQUFhO1NBQ2IsT0FBUztTQUNULFVBQVk7U0FDWixNQUFROztVQUdKLFFBQVEsU0FBUyxVQUFVLENBQUMscUJBQXFCLENBQUMsT0FBTyxFQUFFLE9BQU87VUFFbEUsT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUNwQyxHQUFHLEdBQUcsR0FBRyxFQUFFLEtBQUs7WUFDWCxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUc7UUFFM0IsRUFBNkIsQUFBN0IsMkJBQTZCO2NBQ3ZCLFdBQVcsR0FBRyxRQUFRLENBQUMsR0FBRztZQUU1QixXQUFXLEtBQUssS0FBSztRQUN6QixFQUF1RCxBQUF2RCxxREFBdUQ7YUFDbEQsV0FBVyxLQUFLLEtBQUs7WUFFdEIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEtBQUssS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLO2tCQUM3QyxTQUFTLEdBQUcsV0FBVyxDQUFDLE1BQU0sS0FBSyxLQUFLLENBQUMsTUFBTSxJQUNuRCxXQUFXLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBTSxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUc7aUJBQzdDLEtBQUssQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFNLFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRzs7aUJBQzFDLFNBQVM7OztZQUdQLEdBQUc7WUFBRSxRQUFRLEVBQUUsV0FBVztZQUFFLEtBQUs7O09BRTNDLE1BQU0sRUFBRSxNQUFNLEdBQUssTUFBTTs7VUFFdEIsYUFBYSxDQUFDLEdBQUcsRUFBQyxNQUFRLEdBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxRQUFRO0lBRXZELGFBQWEsQ0FBQyxXQUFXLEdBQUcsUUFBUSxFQUFFLE9BQU8ifQ==