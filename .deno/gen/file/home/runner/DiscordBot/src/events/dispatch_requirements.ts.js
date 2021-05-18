import { bot } from "../../cache.ts";
import { botId, cache, delay, getChannels, getGuild, getMember, snowflakeToBigint, structures } from "../../deps.ts";
import { log } from "../utils/logger.ts";
const processing = new Set();
bot.eventHandlers.dispatchRequirements = async function(data, shardID) {
    if (!bot.fullyReady) return;
    // DELETE MEANS WE DONT NEED TO FETCH. CREATE SHOULD HAVE DATA TO CACHE
    if (data.t && [
        "GUILD_CREATE",
        "GUILD_DELETE"
    ].includes(data.t)) return;
    const id = snowflakeToBigint((data.t && [
        "GUILD_UPDATE"
    ].includes(data.t) ? data.d?.id : data.d?.guild_id) ?? "");
    if (!id || bot.activeGuildIDs.has(id)) return;
    // If this guild is in cache, it has not been swept and we can cancel
    if (cache.guilds.has(id)) {
        bot.activeGuildIDs.add(id);
        return;
    }
    if (processing.has(id)) {
        log.info(`[DISPATCH] New Guild ID already being processed: ${id} in ${data.t} event`);
        let runs = 0;
        do {
            await delay(500);
            ++runs;
        }while (processing.has(id) && runs < 40)
        if (!processing.has(id)) return;
        return log.info(`[DISPATCH] Already processed guild was not successfully fetched:  ${id} in ${data.t} event`);
    }
    processing.add(id);
    // New guild id has appeared, fetch all relevant data
    log.info(`[DISPATCH] New Guild ID has appeared: ${id} in ${data.t} event`);
    const rawGuild = await getGuild(id, {
        counts: true,
        addToCache: false
    }).catch(log.info);
    if (!rawGuild) {
        processing.delete(id);
        return log.info(`[DISPATCH] Guild ID ${id} failed to fetch.`);
    }
    log.info(`[DISPATCH] Guild ID ${id} has been found. ${rawGuild.name}`);
    const [channels, botMember] = await Promise.all([
        getChannels(id, false),
        getMember(id, botId, {
            force: true
        }), 
    ]).catch((error)=>{
        log.info(error);
        return [];
    });
    if (!botMember || !channels) {
        processing.delete(id);
        return log.info(`[DISPATCH] Guild ID ${id} Name: ${rawGuild.name} failed. Unable to get botMember or channels`);
    }
    const guild = await structures.createDiscordenoGuild(rawGuild, shardID);
    // Add to cache
    cache.guilds.set(id, guild);
    bot.dispatchedGuildIDs.delete(id);
    channels.forEach((channel)=>{
        bot.dispatchedChannelIDs.delete(channel.id);
        cache.channels.set(channel.id, channel);
    });
    processing.delete(id);
    log.info(`[DISPATCH] Guild ID ${id} Name: ${guild.name} completely loaded.`);
};
// Events that have
/**
 * channelCreate
 * channelUpdate
 * channelDelete
 * channelPinsUpdate
 * guildBanAdd
 * guildBanRemove
 * guildEmojisUpdate
 * guildIntegrationsUpdate
 * guildMemberAdd
 * guildMemberRemove
 * guildMemberUpdate
 * guildMembersChunk
 * guildRoleCreate
 * guildRoleUpdate
 * guildRoleDelete
 * inviteCreate
 * inviteDelete
 * messageCreate
 * messageUpdate
 * messageDelete
 * messageDeleteBulk
 * messageReactionAdd
 * messageReactionRemove
 * messageReactionRemoveAll
 * messageReactionRemoveEmoji
 * presenceUpdate
 * typingStart
 * voiceStateUpdate
 * voiceServerUpdate
 * webhooksUpdate
 */ // Events that dont have guild_id
/**
 * guildCreate id
 * guildUpdate id
 * guildDelete id
 */ export function sweepInactiveGuildsCache() {
    for (const guild of cache.guilds.values()){
        if (bot.activeGuildIDs.has(guild.id)) continue;
        // This is inactive guild. Not a single thing has happened for atleast 30 minutes.
        // Not a reaction, not a message, not any event!
        cache.guilds.delete(guild.id);
        bot.dispatchedGuildIDs.add(guild.id);
    }
    // Remove all channel if they were dispatched
    cache.channels.forEach((channel)=>{
        if (!bot.dispatchedGuildIDs.has(channel.guildId)) return;
        cache.channels.delete(channel.id);
        bot.dispatchedChannelIDs.add(channel.id);
    });
    // Reset activity for next interval
    bot.activeGuildIDs.clear();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2V2ZW50cy9kaXNwYXRjaF9yZXF1aXJlbWVudHMudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvdCB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuaW1wb3J0IHtcbiAgYm90SWQsXG4gIGNhY2hlLFxuICBkZWxheSxcbiAgZ2V0Q2hhbm5lbHMsXG4gIGdldEd1aWxkLFxuICBnZXRNZW1iZXIsXG4gIEd1aWxkLFxuICBzbm93Zmxha2VUb0JpZ2ludCxcbiAgc3RydWN0dXJlcyxcbn0gZnJvbSBcIi4uLy4uL2RlcHMudHNcIjtcbmltcG9ydCB7IGxvZyB9IGZyb20gXCIuLi91dGlscy9sb2dnZXIudHNcIjtcblxuY29uc3QgcHJvY2Vzc2luZyA9IG5ldyBTZXQ8YmlnaW50PigpO1xuXG5ib3QuZXZlbnRIYW5kbGVycy5kaXNwYXRjaFJlcXVpcmVtZW50cyA9IGFzeW5jIGZ1bmN0aW9uIChkYXRhLCBzaGFyZElEKSB7XG4gIGlmICghYm90LmZ1bGx5UmVhZHkpIHJldHVybjtcblxuICAvLyBERUxFVEUgTUVBTlMgV0UgRE9OVCBORUVEIFRPIEZFVENILiBDUkVBVEUgU0hPVUxEIEhBVkUgREFUQSBUTyBDQUNIRVxuICBpZiAoZGF0YS50ICYmIFtcIkdVSUxEX0NSRUFURVwiLCBcIkdVSUxEX0RFTEVURVwiXS5pbmNsdWRlcyhkYXRhLnQpKSByZXR1cm47XG5cbiAgY29uc3QgaWQgPSBzbm93Zmxha2VUb0JpZ2ludChcbiAgICAoZGF0YS50ICYmIFtcIkdVSUxEX1VQREFURVwiXS5pbmNsdWRlcyhkYXRhLnQpXG4gICAgICA/IC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICAgIChkYXRhLmQgYXMgYW55KT8uaWRcbiAgICAgIDogLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAgICAgKGRhdGEuZCBhcyBhbnkpPy5ndWlsZF9pZCkgPz8gXCJcIixcbiAgKTtcblxuICBpZiAoIWlkIHx8IGJvdC5hY3RpdmVHdWlsZElEcy5oYXMoaWQpKSByZXR1cm47XG5cbiAgLy8gSWYgdGhpcyBndWlsZCBpcyBpbiBjYWNoZSwgaXQgaGFzIG5vdCBiZWVuIHN3ZXB0IGFuZCB3ZSBjYW4gY2FuY2VsXG4gIGlmIChjYWNoZS5ndWlsZHMuaGFzKGlkKSkge1xuICAgIGJvdC5hY3RpdmVHdWlsZElEcy5hZGQoaWQpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChwcm9jZXNzaW5nLmhhcyhpZCkpIHtcbiAgICBsb2cuaW5mbyhcbiAgICAgIGBbRElTUEFUQ0hdIE5ldyBHdWlsZCBJRCBhbHJlYWR5IGJlaW5nIHByb2Nlc3NlZDogJHtpZH0gaW4gJHtkYXRhLnR9IGV2ZW50YCxcbiAgICApO1xuXG4gICAgbGV0IHJ1bnMgPSAwO1xuICAgIGRvIHtcbiAgICAgIGF3YWl0IGRlbGF5KDUwMCk7XG4gICAgICArK3J1bnM7XG4gICAgfSB3aGlsZSAocHJvY2Vzc2luZy5oYXMoaWQpICYmIHJ1bnMgPCA0MCk7XG5cbiAgICBpZiAoIXByb2Nlc3NpbmcuaGFzKGlkKSkgcmV0dXJuO1xuXG4gICAgcmV0dXJuIGxvZy5pbmZvKFxuICAgICAgYFtESVNQQVRDSF0gQWxyZWFkeSBwcm9jZXNzZWQgZ3VpbGQgd2FzIG5vdCBzdWNjZXNzZnVsbHkgZmV0Y2hlZDogICR7aWR9IGluICR7ZGF0YS50fSBldmVudGAsXG4gICAgKTtcbiAgfVxuXG4gIHByb2Nlc3NpbmcuYWRkKGlkKTtcblxuICAvLyBOZXcgZ3VpbGQgaWQgaGFzIGFwcGVhcmVkLCBmZXRjaCBhbGwgcmVsZXZhbnQgZGF0YVxuICBsb2cuaW5mbyhgW0RJU1BBVENIXSBOZXcgR3VpbGQgSUQgaGFzIGFwcGVhcmVkOiAke2lkfSBpbiAke2RhdGEudH0gZXZlbnRgKTtcblxuICBjb25zdCByYXdHdWlsZCA9IChhd2FpdCBnZXRHdWlsZChpZCwge1xuICAgIGNvdW50czogdHJ1ZSxcbiAgICBhZGRUb0NhY2hlOiBmYWxzZSxcbiAgfSkuY2F0Y2gobG9nLmluZm8pKSBhcyBHdWlsZCB8IHVuZGVmaW5lZDtcblxuICBpZiAoIXJhd0d1aWxkKSB7XG4gICAgcHJvY2Vzc2luZy5kZWxldGUoaWQpO1xuICAgIHJldHVybiBsb2cuaW5mbyhgW0RJU1BBVENIXSBHdWlsZCBJRCAke2lkfSBmYWlsZWQgdG8gZmV0Y2guYCk7XG4gIH1cblxuICBsb2cuaW5mbyhgW0RJU1BBVENIXSBHdWlsZCBJRCAke2lkfSBoYXMgYmVlbiBmb3VuZC4gJHtyYXdHdWlsZC5uYW1lfWApO1xuXG4gIGNvbnN0IFtjaGFubmVscywgYm90TWVtYmVyXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICBnZXRDaGFubmVscyhpZCwgZmFsc2UpLFxuICAgIGdldE1lbWJlcihpZCwgYm90SWQsIHsgZm9yY2U6IHRydWUgfSksXG4gIF0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgIGxvZy5pbmZvKGVycm9yKTtcbiAgICByZXR1cm4gW107XG4gIH0pO1xuXG4gIGlmICghYm90TWVtYmVyIHx8ICFjaGFubmVscykge1xuICAgIHByb2Nlc3NpbmcuZGVsZXRlKGlkKTtcbiAgICByZXR1cm4gbG9nLmluZm8oXG4gICAgICBgW0RJU1BBVENIXSBHdWlsZCBJRCAke2lkfSBOYW1lOiAke3Jhd0d1aWxkLm5hbWV9IGZhaWxlZC4gVW5hYmxlIHRvIGdldCBib3RNZW1iZXIgb3IgY2hhbm5lbHNgLFxuICAgICk7XG4gIH1cblxuICBjb25zdCBndWlsZCA9IGF3YWl0IHN0cnVjdHVyZXMuY3JlYXRlRGlzY29yZGVub0d1aWxkKHJhd0d1aWxkLCBzaGFyZElEKTtcblxuICAvLyBBZGQgdG8gY2FjaGVcbiAgY2FjaGUuZ3VpbGRzLnNldChpZCwgZ3VpbGQpO1xuICBib3QuZGlzcGF0Y2hlZEd1aWxkSURzLmRlbGV0ZShpZCk7XG4gIGNoYW5uZWxzLmZvckVhY2goKGNoYW5uZWwpID0+IHtcbiAgICBib3QuZGlzcGF0Y2hlZENoYW5uZWxJRHMuZGVsZXRlKGNoYW5uZWwuaWQpO1xuICAgIGNhY2hlLmNoYW5uZWxzLnNldChjaGFubmVsLmlkLCBjaGFubmVsKTtcbiAgfSk7XG5cbiAgcHJvY2Vzc2luZy5kZWxldGUoaWQpO1xuXG4gIGxvZy5pbmZvKGBbRElTUEFUQ0hdIEd1aWxkIElEICR7aWR9IE5hbWU6ICR7Z3VpbGQubmFtZX0gY29tcGxldGVseSBsb2FkZWQuYCk7XG59O1xuXG4vLyBFdmVudHMgdGhhdCBoYXZlXG4vKipcbiAqIGNoYW5uZWxDcmVhdGVcbiAqIGNoYW5uZWxVcGRhdGVcbiAqIGNoYW5uZWxEZWxldGVcbiAqIGNoYW5uZWxQaW5zVXBkYXRlXG4gKiBndWlsZEJhbkFkZFxuICogZ3VpbGRCYW5SZW1vdmVcbiAqIGd1aWxkRW1vamlzVXBkYXRlXG4gKiBndWlsZEludGVncmF0aW9uc1VwZGF0ZVxuICogZ3VpbGRNZW1iZXJBZGRcbiAqIGd1aWxkTWVtYmVyUmVtb3ZlXG4gKiBndWlsZE1lbWJlclVwZGF0ZVxuICogZ3VpbGRNZW1iZXJzQ2h1bmtcbiAqIGd1aWxkUm9sZUNyZWF0ZVxuICogZ3VpbGRSb2xlVXBkYXRlXG4gKiBndWlsZFJvbGVEZWxldGVcbiAqIGludml0ZUNyZWF0ZVxuICogaW52aXRlRGVsZXRlXG4gKiBtZXNzYWdlQ3JlYXRlXG4gKiBtZXNzYWdlVXBkYXRlXG4gKiBtZXNzYWdlRGVsZXRlXG4gKiBtZXNzYWdlRGVsZXRlQnVsa1xuICogbWVzc2FnZVJlYWN0aW9uQWRkXG4gKiBtZXNzYWdlUmVhY3Rpb25SZW1vdmVcbiAqIG1lc3NhZ2VSZWFjdGlvblJlbW92ZUFsbFxuICogbWVzc2FnZVJlYWN0aW9uUmVtb3ZlRW1vamlcbiAqIHByZXNlbmNlVXBkYXRlXG4gKiB0eXBpbmdTdGFydFxuICogdm9pY2VTdGF0ZVVwZGF0ZVxuICogdm9pY2VTZXJ2ZXJVcGRhdGVcbiAqIHdlYmhvb2tzVXBkYXRlXG4gKi9cblxuLy8gRXZlbnRzIHRoYXQgZG9udCBoYXZlIGd1aWxkX2lkXG4vKipcbiAqIGd1aWxkQ3JlYXRlIGlkXG4gKiBndWlsZFVwZGF0ZSBpZFxuICogZ3VpbGREZWxldGUgaWRcbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gc3dlZXBJbmFjdGl2ZUd1aWxkc0NhY2hlKCkge1xuICBmb3IgKGNvbnN0IGd1aWxkIG9mIGNhY2hlLmd1aWxkcy52YWx1ZXMoKSkge1xuICAgIGlmIChib3QuYWN0aXZlR3VpbGRJRHMuaGFzKGd1aWxkLmlkKSkgY29udGludWU7XG5cbiAgICAvLyBUaGlzIGlzIGluYWN0aXZlIGd1aWxkLiBOb3QgYSBzaW5nbGUgdGhpbmcgaGFzIGhhcHBlbmVkIGZvciBhdGxlYXN0IDMwIG1pbnV0ZXMuXG4gICAgLy8gTm90IGEgcmVhY3Rpb24sIG5vdCBhIG1lc3NhZ2UsIG5vdCBhbnkgZXZlbnQhXG4gICAgY2FjaGUuZ3VpbGRzLmRlbGV0ZShndWlsZC5pZCk7XG4gICAgYm90LmRpc3BhdGNoZWRHdWlsZElEcy5hZGQoZ3VpbGQuaWQpO1xuICB9XG5cbiAgLy8gUmVtb3ZlIGFsbCBjaGFubmVsIGlmIHRoZXkgd2VyZSBkaXNwYXRjaGVkXG4gIGNhY2hlLmNoYW5uZWxzLmZvckVhY2goKGNoYW5uZWwpID0+IHtcbiAgICBpZiAoIWJvdC5kaXNwYXRjaGVkR3VpbGRJRHMuaGFzKGNoYW5uZWwuZ3VpbGRJZCkpIHJldHVybjtcblxuICAgIGNhY2hlLmNoYW5uZWxzLmRlbGV0ZShjaGFubmVsLmlkKTtcbiAgICBib3QuZGlzcGF0Y2hlZENoYW5uZWxJRHMuYWRkKGNoYW5uZWwuaWQpO1xuICB9KTtcblxuICAvLyBSZXNldCBhY3Rpdml0eSBmb3IgbmV4dCBpbnRlcnZhbFxuICBib3QuYWN0aXZlR3VpbGRJRHMuY2xlYXIoKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxHQUFHLFNBQVEsY0FBZ0I7U0FFbEMsS0FBSyxFQUNMLEtBQUssRUFDTCxLQUFLLEVBQ0wsV0FBVyxFQUNYLFFBQVEsRUFDUixTQUFTLEVBRVQsaUJBQWlCLEVBQ2pCLFVBQVUsU0FDTCxhQUFlO1NBQ2IsR0FBRyxTQUFR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