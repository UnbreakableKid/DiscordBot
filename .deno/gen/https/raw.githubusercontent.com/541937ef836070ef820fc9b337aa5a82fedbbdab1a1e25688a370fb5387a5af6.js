import { eventHandlers } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { rest } from "../../rest/rest.ts";
import { structures } from "../../structures/mod.ts";
import { Errors } from "../../types/discordeno/errors.ts";
import { DiscordGatewayIntents } from "../../types/gateway/gateway_intents.ts";
import { bigintToSnowflake } from "../../util/bigint.ts";
import { Collection } from "../../util/collection.ts";
import { endpoints } from "../../util/constants.ts";
import { ws } from "../../ws/ws.ts";
/**
 * ⚠️ BEGINNER DEVS!! YOU SHOULD ALMOST NEVER NEED THIS AND YOU CAN GET FROM cache.members.get()
 *
 * ADVANCED:
 * Highly recommended to **NOT** use this function to get members instead use fetchMembers().
 * REST(this function): 50/s global(across all shards) rate limit with ALL requests this included
 * GW(fetchMembers): 120/m(PER shard) rate limit. Meaning if you have 8 shards your limit is 960/m.
 */ export async function getMembers(guildId, options) {
    if (!(ws.identifyPayload.intents && DiscordGatewayIntents.GuildMembers)) {
        throw new Error(Errors.MISSING_INTENT_GUILD_MEMBERS);
    }
    const guild = await cacheHandlers.get("guilds", guildId);
    if (!guild) throw new Error(Errors.GUILD_NOT_FOUND);
    const members = new Collection();
    let membersLeft = options?.limit ?? guild.memberCount;
    let loops = 1;
    while((options?.limit ?? guild.memberCount) > members.size && membersLeft > 0){
        eventHandlers.debug?.("loop", "Running while loop in getMembers function.");
        if (options?.limit && options.limit > 1000) {
            console.log(`Paginating get members from REST. #${loops} / ${Math.ceil((options?.limit ?? 1) / 1000)}`);
        }
        const result = await rest.runMethod("get", `${endpoints.GUILD_MEMBERS(guildId)}?limit=${membersLeft > 1000 ? 1000 : membersLeft}${options?.after ? `&after=${options.after}` : ""}`);
        const discordenoMembers = await Promise.all(result.map(async (member)=>{
            const discordenoMember = await structures.createDiscordenoMember(member, guildId);
            if (options?.addToCache !== false) {
                await cacheHandlers.set("members", discordenoMember.id, discordenoMember);
            }
            return discordenoMember;
        }));
        if (!discordenoMembers.length) break;
        discordenoMembers.forEach((member)=>{
            eventHandlers.debug?.("loop", `Running forEach loop in get_members file.`);
            members.set(member.id, member);
        });
        options = {
            limit: options?.limit,
            after: bigintToSnowflake(discordenoMembers[discordenoMembers.length - 1].id)
        };
        membersLeft -= 1000;
        loops++;
    }
    return members;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvbWVtYmVycy9nZXRfbWVtYmVycy50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXZlbnRIYW5kbGVycyB9IGZyb20gXCIuLi8uLi9ib3QudHNcIjtcbmltcG9ydCB7IGNhY2hlSGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vY2FjaGUudHNcIjtcbmltcG9ydCB7IHJlc3QgfSBmcm9tIFwiLi4vLi4vcmVzdC9yZXN0LnRzXCI7XG5pbXBvcnQgeyBEaXNjb3JkZW5vTWVtYmVyIH0gZnJvbSBcIi4uLy4uL3N0cnVjdHVyZXMvbWVtYmVyLnRzXCI7XG5pbXBvcnQgeyBzdHJ1Y3R1cmVzIH0gZnJvbSBcIi4uLy4uL3N0cnVjdHVyZXMvbW9kLnRzXCI7XG5pbXBvcnQgeyBFcnJvcnMgfSBmcm9tIFwiLi4vLi4vdHlwZXMvZGlzY29yZGVuby9lcnJvcnMudHNcIjtcbmltcG9ydCB7IERpc2NvcmRHYXRld2F5SW50ZW50cyB9IGZyb20gXCIuLi8uLi90eXBlcy9nYXRld2F5L2dhdGV3YXlfaW50ZW50cy50c1wiO1xuaW1wb3J0IHR5cGUgeyBHdWlsZE1lbWJlcldpdGhVc2VyIH0gZnJvbSBcIi4uLy4uL3R5cGVzL21lbWJlcnMvZ3VpbGRfbWVtYmVyLnRzXCI7XG5pbXBvcnQgdHlwZSB7IExpc3RHdWlsZE1lbWJlcnMgfSBmcm9tIFwiLi4vLi4vdHlwZXMvbWVtYmVycy9saXN0X2d1aWxkX21lbWJlcnMudHNcIjtcbmltcG9ydCB7IGJpZ2ludFRvU25vd2ZsYWtlIH0gZnJvbSBcIi4uLy4uL3V0aWwvYmlnaW50LnRzXCI7XG5pbXBvcnQgeyBDb2xsZWN0aW9uIH0gZnJvbSBcIi4uLy4uL3V0aWwvY29sbGVjdGlvbi50c1wiO1xuaW1wb3J0IHsgZW5kcG9pbnRzIH0gZnJvbSBcIi4uLy4uL3V0aWwvY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyB3cyB9IGZyb20gXCIuLi8uLi93cy93cy50c1wiO1xuXG4vKipcbiAqIOKaoO+4jyBCRUdJTk5FUiBERVZTISEgWU9VIFNIT1VMRCBBTE1PU1QgTkVWRVIgTkVFRCBUSElTIEFORCBZT1UgQ0FOIEdFVCBGUk9NIGNhY2hlLm1lbWJlcnMuZ2V0KClcbiAqXG4gKiBBRFZBTkNFRDpcbiAqIEhpZ2hseSByZWNvbW1lbmRlZCB0byAqKk5PVCoqIHVzZSB0aGlzIGZ1bmN0aW9uIHRvIGdldCBtZW1iZXJzIGluc3RlYWQgdXNlIGZldGNoTWVtYmVycygpLlxuICogUkVTVCh0aGlzIGZ1bmN0aW9uKTogNTAvcyBnbG9iYWwoYWNyb3NzIGFsbCBzaGFyZHMpIHJhdGUgbGltaXQgd2l0aCBBTEwgcmVxdWVzdHMgdGhpcyBpbmNsdWRlZFxuICogR1coZmV0Y2hNZW1iZXJzKTogMTIwL20oUEVSIHNoYXJkKSByYXRlIGxpbWl0LiBNZWFuaW5nIGlmIHlvdSBoYXZlIDggc2hhcmRzIHlvdXIgbGltaXQgaXMgOTYwL20uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRNZW1iZXJzKFxuICBndWlsZElkOiBiaWdpbnQsXG4gIG9wdGlvbnM/OiBMaXN0R3VpbGRNZW1iZXJzICYgeyBhZGRUb0NhY2hlPzogYm9vbGVhbiB9LFxuKSB7XG4gIGlmICghKHdzLmlkZW50aWZ5UGF5bG9hZC5pbnRlbnRzICYmIERpc2NvcmRHYXRld2F5SW50ZW50cy5HdWlsZE1lbWJlcnMpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKEVycm9ycy5NSVNTSU5HX0lOVEVOVF9HVUlMRF9NRU1CRVJTKTtcbiAgfVxuXG4gIGNvbnN0IGd1aWxkID0gYXdhaXQgY2FjaGVIYW5kbGVycy5nZXQoXCJndWlsZHNcIiwgZ3VpbGRJZCk7XG4gIGlmICghZ3VpbGQpIHRocm93IG5ldyBFcnJvcihFcnJvcnMuR1VJTERfTk9UX0ZPVU5EKTtcblxuICBjb25zdCBtZW1iZXJzID0gbmV3IENvbGxlY3Rpb248YmlnaW50LCBEaXNjb3JkZW5vTWVtYmVyPigpO1xuXG4gIGxldCBtZW1iZXJzTGVmdCA9IG9wdGlvbnM/LmxpbWl0ID8/IGd1aWxkLm1lbWJlckNvdW50O1xuICBsZXQgbG9vcHMgPSAxO1xuICB3aGlsZSAoXG4gICAgKG9wdGlvbnM/LmxpbWl0ID8/IGd1aWxkLm1lbWJlckNvdW50KSA+IG1lbWJlcnMuc2l6ZSAmJlxuICAgIG1lbWJlcnNMZWZ0ID4gMFxuICApIHtcbiAgICBldmVudEhhbmRsZXJzLmRlYnVnPy4oXCJsb29wXCIsIFwiUnVubmluZyB3aGlsZSBsb29wIGluIGdldE1lbWJlcnMgZnVuY3Rpb24uXCIpO1xuXG4gICAgaWYgKG9wdGlvbnM/LmxpbWl0ICYmIG9wdGlvbnMubGltaXQgPiAxMDAwKSB7XG4gICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgYFBhZ2luYXRpbmcgZ2V0IG1lbWJlcnMgZnJvbSBSRVNULiAjJHtsb29wc30gLyAke1xuICAgICAgICAgIE1hdGguY2VpbChcbiAgICAgICAgICAgIChvcHRpb25zPy5saW1pdCA/PyAxKSAvIDEwMDAsXG4gICAgICAgICAgKVxuICAgICAgICB9YCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gKGF3YWl0IHJlc3QucnVuTWV0aG9kPEd1aWxkTWVtYmVyV2l0aFVzZXJbXT4oXG4gICAgICBcImdldFwiLFxuICAgICAgYCR7ZW5kcG9pbnRzLkdVSUxEX01FTUJFUlMoZ3VpbGRJZCl9P2xpbWl0PSR7XG4gICAgICAgIG1lbWJlcnNMZWZ0ID4gMTAwMCA/IDEwMDAgOiBtZW1iZXJzTGVmdFxuICAgICAgfSR7b3B0aW9ucz8uYWZ0ZXIgPyBgJmFmdGVyPSR7b3B0aW9ucy5hZnRlcn1gIDogXCJcIn1gLFxuICAgICkpO1xuXG4gICAgY29uc3QgZGlzY29yZGVub01lbWJlcnMgPSBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgIHJlc3VsdC5tYXAoYXN5bmMgKG1lbWJlcikgPT4ge1xuICAgICAgICBjb25zdCBkaXNjb3JkZW5vTWVtYmVyID0gYXdhaXQgc3RydWN0dXJlcy5jcmVhdGVEaXNjb3JkZW5vTWVtYmVyKFxuICAgICAgICAgIG1lbWJlcixcbiAgICAgICAgICBndWlsZElkLFxuICAgICAgICApO1xuXG4gICAgICAgIGlmIChvcHRpb25zPy5hZGRUb0NhY2hlICE9PSBmYWxzZSkge1xuICAgICAgICAgIGF3YWl0IGNhY2hlSGFuZGxlcnMuc2V0KFxuICAgICAgICAgICAgXCJtZW1iZXJzXCIsXG4gICAgICAgICAgICBkaXNjb3JkZW5vTWVtYmVyLmlkLFxuICAgICAgICAgICAgZGlzY29yZGVub01lbWJlcixcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRpc2NvcmRlbm9NZW1iZXI7XG4gICAgICB9KSxcbiAgICApO1xuXG4gICAgaWYgKCFkaXNjb3JkZW5vTWVtYmVycy5sZW5ndGgpIGJyZWFrO1xuXG4gICAgZGlzY29yZGVub01lbWJlcnMuZm9yRWFjaCgobWVtYmVyKSA9PiB7XG4gICAgICBldmVudEhhbmRsZXJzLmRlYnVnPy4oXG4gICAgICAgIFwibG9vcFwiLFxuICAgICAgICBgUnVubmluZyBmb3JFYWNoIGxvb3AgaW4gZ2V0X21lbWJlcnMgZmlsZS5gLFxuICAgICAgKTtcbiAgICAgIG1lbWJlcnMuc2V0KG1lbWJlci5pZCwgbWVtYmVyKTtcbiAgICB9KTtcblxuICAgIG9wdGlvbnMgPSB7XG4gICAgICBsaW1pdDogb3B0aW9ucz8ubGltaXQsXG4gICAgICBhZnRlcjogYmlnaW50VG9Tbm93Zmxha2UoXG4gICAgICAgIGRpc2NvcmRlbm9NZW1iZXJzW2Rpc2NvcmRlbm9NZW1iZXJzLmxlbmd0aCAtIDFdLmlkLFxuICAgICAgKSxcbiAgICB9O1xuXG4gICAgbWVtYmVyc0xlZnQgLT0gMTAwMDtcblxuICAgIGxvb3BzKys7XG4gIH1cblxuICByZXR1cm4gbWVtYmVycztcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxhQUFhLFNBQVEsWUFBYztTQUNuQyxhQUFhLFNBQVEsY0FBZ0I7U0FDckMsSUFBSSxTQUFRLGtCQUFvQjtTQUVoQyxVQUFVLFNBQVEsdUJBQXlCO1NBQzNDLE1BQU0sU0FBUSxnQ0FBa0M7U0FDaEQscUJBQXFCLFNBQVEsc0NBQXdDO1NBR3JFLGlCQUFpQixTQUFRLG9CQUFzQjtTQUMvQyxVQUFVLFNBQVEsd0JBQTBCO1NBQzVDLFNBQVMsU0FBUSx1QkFBeUI7U0FDMUMsRUFBRSxTQUFRLGNBQWdCO0FBRW5DLEVBT0csQUFQSDs7Ozs7OztDQU9HLEFBUEgsRUFPRyx1QkFDbUIsVUFBVSxDQUM5QixPQUFlLEVBQ2YsT0FBcUQ7VUFFL0MsRUFBRSxDQUFDLGVBQWUsQ0FBQyxPQUFPLElBQUkscUJBQXFCLENBQUMsWUFBWTtrQkFDMUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyw0QkFBNEI7O1VBRy9DLEtBQUssU0FBUyxhQUFhLENBQUMsR0FBRyxFQUFDLE1BQVEsR0FBRSxPQUFPO1NBQ2xELEtBQUssWUFBWSxLQUFLLENBQUMsTUFBTSxDQUFDLGVBQWU7VUFFNUMsT0FBTyxPQUFPLFVBQVU7UUFFMUIsV0FBVyxHQUFHLE9BQU8sRUFBRSxLQUFLLElBQUksS0FBSyxDQUFDLFdBQVc7UUFDakQsS0FBSyxHQUFHLENBQUM7V0FFVixPQUFPLEVBQUUsS0FBSyxJQUFJLEtBQUssQ0FBQyxXQUFXLElBQUksT0FBTyxDQUFDLElBQUksSUFDcEQsV0FBVyxHQUFHLENBQUM7UUFFZixhQUFhLENBQUMsS0FBSyxJQUFHLElBQU0sSUFBRSwwQ0FBNEM7WUFFdEUsT0FBTyxFQUFFLEtBQUssSUFBSSxPQUFPLENBQUMsS0FBSyxHQUFHLElBQUk7WUFDeEMsT0FBTyxDQUFDLEdBQUcsRUFDUixtQ0FBbUMsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUM3QyxJQUFJLENBQUMsSUFBSSxFQUNOLE9BQU8sRUFBRSxLQUFLLElBQUksQ0FBQyxJQUFJLElBQUk7O2NBTTlCLE1BQU0sU0FBVSxJQUFJLENBQUMsU0FBUyxFQUNsQyxHQUFLLE1BQ0YsU0FBUyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUN6QyxXQUFXLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxXQUFXLEdBQ3RDLE9BQU8sRUFBRSxLQUFLLElBQUksT0FBTyxFQUFFLE9BQU8sQ0FBQyxLQUFLO2NBR3ZDLGlCQUFpQixTQUFTLE9BQU8sQ0FBQyxHQUFHLENBQ3pDLE1BQU0sQ0FBQyxHQUFHLFFBQVEsTUFBTTtrQkFDaEIsZ0JBQWdCLFNBQVMsVUFBVSxDQUFDLHNCQUFzQixDQUM5RCxNQUFNLEVBQ04sT0FBTztnQkFHTCxPQUFPLEVBQUUsVUFBVSxLQUFLLEtBQUs7c0JBQ3pCLGFBQWEsQ0FBQyxHQUFHLEVBQ3JCLE9BQVMsR0FDVCxnQkFBZ0IsQ0FBQyxFQUFFLEVBQ25CLGdCQUFnQjs7bUJBSWIsZ0JBQWdCOzthQUl0QixpQkFBaUIsQ0FBQyxNQUFNO1FBRTdCLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxNQUFNO1lBQy9CLGFBQWEsQ0FBQyxLQUFLLElBQ2pCLElBQU0sSUFDTCx5Q0FBeUM7WUFFNUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLE1BQU07O1FBRy9CLE9BQU87WUFDTCxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUs7WUFDckIsS0FBSyxFQUFFLGlCQUFpQixDQUN0QixpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLEVBQUU7O1FBSXRELFdBQVcsSUFBSSxJQUFJO1FBRW5CLEtBQUs7O1dBR0EsT0FBTyJ9