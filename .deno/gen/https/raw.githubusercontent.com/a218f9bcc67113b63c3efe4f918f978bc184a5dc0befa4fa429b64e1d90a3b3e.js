import { cache } from "../../cache.ts";
import { DiscordGatewayOpcodes } from "../../types/codes/gateway_opcodes.ts";
import { Errors } from "../../types/discordeno/errors.ts";
import { DiscordGatewayIntents } from "../../types/gateway/gateway_intents.ts";
import { ws } from "../../ws/ws.ts";
/**
 * ⚠️ BEGINNER DEVS!! YOU SHOULD ALMOST NEVER NEED THIS AND YOU CAN GET FROM cache.members.get()
 *
 * ADVANCED:
 * Highly recommended to use this function to fetch members instead of getMember from REST.
 * REST: 50/s global(across all shards) rate limit with ALL requests this included
 * GW(this function): 120/m(PER shard) rate limit. Meaning if you have 8 shards your limit is now 960/m.
 */ export function fetchMembers(guildId, shardId, options) {
    // You can request 1 member without the intent
    if ((!options?.limit || options.limit > 1) && !(ws.identifyPayload.intents & DiscordGatewayIntents.GuildMembers)) {
        throw new Error(Errors.MISSING_INTENT_GUILD_MEMBERS);
    }
    if (options?.userIds?.length) {
        options.limit = options.userIds.length;
    }
    return new Promise((resolve)=>{
        const nonce = `${guildId}-${Date.now()}`;
        cache.fetchAllMembersProcessingRequests.set(nonce, resolve);
        ws.sendShardMessage(shardId, {
            op: DiscordGatewayOpcodes.RequestGuildMembers,
            d: {
                guild_id: guildId,
                // If a query is provided use it, OR if a limit is NOT provided use ""
                query: options?.query || (options?.limit ? undefined : ""),
                limit: options?.limit || 0,
                presences: options?.presences || false,
                user_ids: options?.userIds,
                nonce
            }
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvbWVtYmVycy9mZXRjaF9tZW1iZXJzLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjYWNoZSB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuaW1wb3J0IHsgRGlzY29yZGVub01lbWJlciB9IGZyb20gXCIuLi8uLi9zdHJ1Y3R1cmVzL21lbWJlci50c1wiO1xuaW1wb3J0IHsgRGlzY29yZEdhdGV3YXlPcGNvZGVzIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2NvZGVzL2dhdGV3YXlfb3Bjb2Rlcy50c1wiO1xuaW1wb3J0IHsgRXJyb3JzIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2Rpc2NvcmRlbm8vZXJyb3JzLnRzXCI7XG5pbXBvcnQgeyBEaXNjb3JkR2F0ZXdheUludGVudHMgfSBmcm9tIFwiLi4vLi4vdHlwZXMvZ2F0ZXdheS9nYXRld2F5X2ludGVudHMudHNcIjtcbmltcG9ydCB0eXBlIHsgUmVxdWVzdEd1aWxkTWVtYmVycyB9IGZyb20gXCIuLi8uLi90eXBlcy9tZW1iZXJzL3JlcXVlc3RfZ3VpbGRfbWVtYmVycy50c1wiO1xuaW1wb3J0IHsgQ29sbGVjdGlvbiB9IGZyb20gXCIuLi8uLi91dGlsL2NvbGxlY3Rpb24udHNcIjtcbmltcG9ydCB7IHdzIH0gZnJvbSBcIi4uLy4uL3dzL3dzLnRzXCI7XG5cbi8qKlxuICog4pqg77iPIEJFR0lOTkVSIERFVlMhISBZT1UgU0hPVUxEIEFMTU9TVCBORVZFUiBORUVEIFRISVMgQU5EIFlPVSBDQU4gR0VUIEZST00gY2FjaGUubWVtYmVycy5nZXQoKVxuICpcbiAqIEFEVkFOQ0VEOlxuICogSGlnaGx5IHJlY29tbWVuZGVkIHRvIHVzZSB0aGlzIGZ1bmN0aW9uIHRvIGZldGNoIG1lbWJlcnMgaW5zdGVhZCBvZiBnZXRNZW1iZXIgZnJvbSBSRVNULlxuICogUkVTVDogNTAvcyBnbG9iYWwoYWNyb3NzIGFsbCBzaGFyZHMpIHJhdGUgbGltaXQgd2l0aCBBTEwgcmVxdWVzdHMgdGhpcyBpbmNsdWRlZFxuICogR1codGhpcyBmdW5jdGlvbik6IDEyMC9tKFBFUiBzaGFyZCkgcmF0ZSBsaW1pdC4gTWVhbmluZyBpZiB5b3UgaGF2ZSA4IHNoYXJkcyB5b3VyIGxpbWl0IGlzIG5vdyA5NjAvbS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZldGNoTWVtYmVycyhcbiAgZ3VpbGRJZDogYmlnaW50LFxuICBzaGFyZElkOiBudW1iZXIsXG4gIG9wdGlvbnM/OiBPbWl0PFJlcXVlc3RHdWlsZE1lbWJlcnMsIFwiZ3VpbGRJZFwiPixcbikge1xuICAvLyBZb3UgY2FuIHJlcXVlc3QgMSBtZW1iZXIgd2l0aG91dCB0aGUgaW50ZW50XG4gIGlmIChcbiAgICAoIW9wdGlvbnM/LmxpbWl0IHx8IG9wdGlvbnMubGltaXQgPiAxKSAmJlxuICAgICEod3MuaWRlbnRpZnlQYXlsb2FkLmludGVudHMgJiBEaXNjb3JkR2F0ZXdheUludGVudHMuR3VpbGRNZW1iZXJzKVxuICApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLk1JU1NJTkdfSU5URU5UX0dVSUxEX01FTUJFUlMpO1xuICB9XG5cbiAgaWYgKG9wdGlvbnM/LnVzZXJJZHM/Lmxlbmd0aCkge1xuICAgIG9wdGlvbnMubGltaXQgPSBvcHRpb25zLnVzZXJJZHMubGVuZ3RoO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgY29uc3Qgbm9uY2UgPSBgJHtndWlsZElkfS0ke0RhdGUubm93KCl9YDtcbiAgICBjYWNoZS5mZXRjaEFsbE1lbWJlcnNQcm9jZXNzaW5nUmVxdWVzdHMuc2V0KG5vbmNlLCByZXNvbHZlKTtcblxuICAgIHdzLnNlbmRTaGFyZE1lc3NhZ2Uoc2hhcmRJZCwge1xuICAgICAgb3A6IERpc2NvcmRHYXRld2F5T3Bjb2Rlcy5SZXF1ZXN0R3VpbGRNZW1iZXJzLFxuICAgICAgZDoge1xuICAgICAgICBndWlsZF9pZDogZ3VpbGRJZCxcbiAgICAgICAgLy8gSWYgYSBxdWVyeSBpcyBwcm92aWRlZCB1c2UgaXQsIE9SIGlmIGEgbGltaXQgaXMgTk9UIHByb3ZpZGVkIHVzZSBcIlwiXG4gICAgICAgIHF1ZXJ5OiBvcHRpb25zPy5xdWVyeSB8fCAob3B0aW9ucz8ubGltaXQgPyB1bmRlZmluZWQgOiBcIlwiKSxcbiAgICAgICAgbGltaXQ6IG9wdGlvbnM/LmxpbWl0IHx8IDAsXG4gICAgICAgIHByZXNlbmNlczogb3B0aW9ucz8ucHJlc2VuY2VzIHx8IGZhbHNlLFxuICAgICAgICB1c2VyX2lkczogb3B0aW9ucz8udXNlcklkcyxcbiAgICAgICAgbm9uY2UsXG4gICAgICB9LFxuICAgIH0pO1xuICB9KSBhcyBQcm9taXNlPENvbGxlY3Rpb248YmlnaW50LCBEaXNjb3JkZW5vTWVtYmVyPj47XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsS0FBSyxTQUFRLGNBQWdCO1NBRTdCLHFCQUFxQixTQUFRLG9DQUFzQztTQUNuRSxNQUFNLFNBQVEsZ0NBQWtDO1NBQ2hELHFCQUFxQixTQUFRLHNDQUF3QztTQUdyRSxFQUFFLFNBQVEsY0FBZ0I7QUFFbkMsRUFPRyxBQVBIOzs7Ozs7O0NBT0csQUFQSCxFQU9HLGlCQUNhLFlBQVksQ0FDMUIsT0FBZSxFQUNmLE9BQWUsRUFDZixPQUE4QztJQUU5QyxFQUE4QyxBQUE5Qyw0Q0FBOEM7VUFFMUMsT0FBTyxFQUFFLEtBQUssSUFBSSxPQUFPLENBQUMsS0FBSyxHQUFHLENBQUMsT0FDbkMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEdBQUcscUJBQXFCLENBQUMsWUFBWTtrQkFFdkQsS0FBSyxDQUFDLE1BQU0sQ0FBQyw0QkFBNEI7O1FBR2pELE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTTtRQUMxQixPQUFPLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTTs7ZUFHN0IsT0FBTyxFQUFFLE9BQU87Y0FDbkIsS0FBSyxNQUFNLE9BQU8sQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUc7UUFDcEMsS0FBSyxDQUFDLGlDQUFpQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsT0FBTztRQUUxRCxFQUFFLENBQUMsZ0JBQWdCLENBQUMsT0FBTztZQUN6QixFQUFFLEVBQUUscUJBQXFCLENBQUMsbUJBQW1CO1lBQzdDLENBQUM7Z0JBQ0MsUUFBUSxFQUFFLE9BQU87Z0JBQ2pCLEVBQXNFLEFBQXRFLG9FQUFzRTtnQkFDdEUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEtBQUssT0FBTyxFQUFFLEtBQUssR0FBRyxTQUFTO2dCQUNwRCxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssSUFBSSxDQUFDO2dCQUMxQixTQUFTLEVBQUUsT0FBTyxFQUFFLFNBQVMsSUFBSSxLQUFLO2dCQUN0QyxRQUFRLEVBQUUsT0FBTyxFQUFFLE9BQU87Z0JBQzFCLEtBQUsifQ==