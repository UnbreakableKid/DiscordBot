import { eventHandlers } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { rest } from "../../rest/rest.ts";
import { structures } from "../../structures/mod.ts";
import { DiscordChannelTypes } from "../../types/channels/channel_types.ts";
import { endpoints } from "../../util/constants.ts";
import { calculateBits, requireBotChannelPermissions, requireOverwritePermissions } from "../../util/permissions.ts";
import { hasOwnProperty, snakelize } from "../../util/utils.ts";
//TODO: implement DM group channel edit
//TODO(threads): check thread perms
/** Update a channel's settings. Requires the `MANAGE_CHANNELS` permission for the guild. */ export async function editChannel(channelId, options, reason) {
    const channel = await cacheHandlers.get("channels", channelId);
    if (channel) {
        if ([
            DiscordChannelTypes.GuildNewsThread,
            DiscordChannelTypes.GuildPivateThread,
            DiscordChannelTypes.GuildPublicThread, 
        ].includes(channel.type)) {
            const permissions = new Set();
            if (hasOwnProperty(options, "archive") && options.archive === false) {
                permissions.add("SEND_MESSAGES");
            }
            // TODO(threads): change this to a better check
            // hacky way of checking if more is being modified
            if (Object.keys(options).length > 1) {
                permissions.add("MANAGE_THREADS");
            }
            await requireBotChannelPermissions(channel.parentId ?? 0n, [
                ...permissions, 
            ]);
        }
        if (hasOwnProperty(options, "permissionOverwrites") && Array.isArray(options.permissionOverwrites)) {
            await requireOverwritePermissions(channel.guildId, options.permissionOverwrites);
        }
    }
    if (options.name || options.topic) {
        const request = editChannelNameTopicQueue.get(channelId);
        if (!request) {
            // If this hasnt been done before simply add 1 for it
            editChannelNameTopicQueue.set(channelId, {
                channelId: channelId,
                amount: 1,
                // 10 minutes from now
                timestamp: Date.now() + 600000,
                items: []
            });
        } else if (request.amount === 1) {
            // Start queuing future requests to this channel
            request.amount = 2;
            request.timestamp = Date.now() + 600000;
        } else {
            return new Promise((resolve, reject)=>{
                // 2 have already been used add to queue
                request.items.push({
                    channelId,
                    options,
                    resolve,
                    reject
                });
                if (editChannelProcessing) return;
                editChannelProcessing = true;
                processEditChannelQueue();
            });
        }
    }
    const payload = {
        ...snakelize(options),
        // deno-lint-ignore camelcase
        permission_overwrites: hasOwnProperty(options, "permissionOverwrites") ? options.permissionOverwrites?.map((overwrite)=>{
            return {
                ...overwrite,
                allow: calculateBits(overwrite.allow),
                deny: calculateBits(overwrite.deny)
            };
        }) : undefined
    };
    const result = await rest.runMethod("patch", endpoints.CHANNEL_BASE(channelId), {
        ...payload,
        reason
    });
    return await structures.createDiscordenoChannel(result);
}
const editChannelNameTopicQueue = new Map();
let editChannelProcessing = false;
function processEditChannelQueue() {
    if (!editChannelProcessing) return;
    const now = Date.now();
    editChannelNameTopicQueue.forEach(async (request)=>{
        eventHandlers.debug?.("loop", `Running forEach loop in edit_channel file.`);
        if (now < request.timestamp) return;
        // 10 minutes have passed so we can reset this channel again
        if (!request.items.length) {
            return editChannelNameTopicQueue.delete(request.channelId);
        }
        request.amount = 0;
        // There are items to process for this request
        const details = request.items.shift();
        if (!details) return;
        await editChannel(details.channelId, details.options).then((result)=>details.resolve(result)
        ).catch(details.reject);
        const secondDetails = request.items.shift();
        if (!secondDetails) return;
        await editChannel(secondDetails.channelId, secondDetails.options).then((result)=>secondDetails.resolve(result)
        ).catch(secondDetails.reject);
        return;
    });
    if (editChannelNameTopicQueue.size) {
        setTimeout(()=>{
            eventHandlers.debug?.("loop", `Running setTimeout in EDIT_CHANNEL file.`);
            processEditChannelQueue();
        }, 60000);
    } else {
        editChannelProcessing = false;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvY2hhbm5lbHMvZWRpdF9jaGFubmVsLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBldmVudEhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2JvdC50c1wiO1xuaW1wb3J0IHsgY2FjaGVIYW5kbGVycyB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuaW1wb3J0IHsgcmVzdCB9IGZyb20gXCIuLi8uLi9yZXN0L3Jlc3QudHNcIjtcbmltcG9ydCB0eXBlIHsgRGlzY29yZGVub0NoYW5uZWwgfSBmcm9tIFwiLi4vLi4vc3RydWN0dXJlcy9jaGFubmVsLnRzXCI7XG5pbXBvcnQgeyBzdHJ1Y3R1cmVzIH0gZnJvbSBcIi4uLy4uL3N0cnVjdHVyZXMvbW9kLnRzXCI7XG5pbXBvcnQgdHlwZSB7IENoYW5uZWwgfSBmcm9tIFwiLi4vLi4vdHlwZXMvY2hhbm5lbHMvY2hhbm5lbC50c1wiO1xuaW1wb3J0IHsgRGlzY29yZENoYW5uZWxUeXBlcyB9IGZyb20gXCIuLi8uLi90eXBlcy9jaGFubmVscy9jaGFubmVsX3R5cGVzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IE1vZGlmeUNoYW5uZWwgfSBmcm9tIFwiLi4vLi4vdHlwZXMvY2hhbm5lbHMvbW9kaWZ5X2NoYW5uZWwudHNcIjtcbmltcG9ydCB0eXBlIHsgTW9kaWZ5VGhyZWFkIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2NoYW5uZWxzL3RocmVhZHMvbW9kaWZ5X3RocmVhZC50c1wiO1xuaW1wb3J0IHR5cGUgeyBQZXJtaXNzaW9uU3RyaW5ncyB9IGZyb20gXCIuLi8uLi90eXBlcy9wZXJtaXNzaW9ucy9wZXJtaXNzaW9uX3N0cmluZ3MudHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHtcbiAgY2FsY3VsYXRlQml0cyxcbiAgcmVxdWlyZUJvdENoYW5uZWxQZXJtaXNzaW9ucyxcbiAgcmVxdWlyZU92ZXJ3cml0ZVBlcm1pc3Npb25zLFxufSBmcm9tIFwiLi4vLi4vdXRpbC9wZXJtaXNzaW9ucy50c1wiO1xuaW1wb3J0IHsgaGFzT3duUHJvcGVydHksIHNuYWtlbGl6ZSB9IGZyb20gXCIuLi8uLi91dGlsL3V0aWxzLnRzXCI7XG5cbi8vVE9ETzogaW1wbGVtZW50IERNIGdyb3VwIGNoYW5uZWwgZWRpdFxuLy9UT0RPKHRocmVhZHMpOiBjaGVjayB0aHJlYWQgcGVybXNcbi8qKiBVcGRhdGUgYSBjaGFubmVsJ3Mgc2V0dGluZ3MuIFJlcXVpcmVzIHRoZSBgTUFOQUdFX0NIQU5ORUxTYCBwZXJtaXNzaW9uIGZvciB0aGUgZ3VpbGQuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZWRpdENoYW5uZWwoXG4gIGNoYW5uZWxJZDogYmlnaW50LFxuICBvcHRpb25zOiBNb2RpZnlDaGFubmVsIHwgTW9kaWZ5VGhyZWFkLFxuICByZWFzb24/OiBzdHJpbmcsXG4pIHtcbiAgY29uc3QgY2hhbm5lbCA9IGF3YWl0IGNhY2hlSGFuZGxlcnMuZ2V0KFwiY2hhbm5lbHNcIiwgY2hhbm5lbElkKTtcblxuICBpZiAoY2hhbm5lbCkge1xuICAgIGlmIChcbiAgICAgIFtcbiAgICAgICAgRGlzY29yZENoYW5uZWxUeXBlcy5HdWlsZE5ld3NUaHJlYWQsXG4gICAgICAgIERpc2NvcmRDaGFubmVsVHlwZXMuR3VpbGRQaXZhdGVUaHJlYWQsXG4gICAgICAgIERpc2NvcmRDaGFubmVsVHlwZXMuR3VpbGRQdWJsaWNUaHJlYWQsXG4gICAgICBdLmluY2x1ZGVzKGNoYW5uZWwudHlwZSlcbiAgICApIHtcbiAgICAgIGNvbnN0IHBlcm1pc3Npb25zID0gbmV3IFNldDxQZXJtaXNzaW9uU3RyaW5ncz4oKTtcblxuICAgICAgaWYgKGhhc093blByb3BlcnR5KG9wdGlvbnMsIFwiYXJjaGl2ZVwiKSAmJiBvcHRpb25zLmFyY2hpdmUgPT09IGZhbHNlKSB7XG4gICAgICAgIHBlcm1pc3Npb25zLmFkZChcIlNFTkRfTUVTU0FHRVNcIik7XG4gICAgICB9XG5cbiAgICAgIC8vIFRPRE8odGhyZWFkcyk6IGNoYW5nZSB0aGlzIHRvIGEgYmV0dGVyIGNoZWNrXG4gICAgICAvLyBoYWNreSB3YXkgb2YgY2hlY2tpbmcgaWYgbW9yZSBpcyBiZWluZyBtb2RpZmllZFxuICAgICAgaWYgKE9iamVjdC5rZXlzKG9wdGlvbnMpLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgcGVybWlzc2lvbnMuYWRkKFwiTUFOQUdFX1RIUkVBRFNcIik7XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHJlcXVpcmVCb3RDaGFubmVsUGVybWlzc2lvbnMoY2hhbm5lbC5wYXJlbnRJZCA/PyAwbiwgW1xuICAgICAgICAuLi5wZXJtaXNzaW9ucyxcbiAgICAgIF0pO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIGhhc093blByb3BlcnR5PE1vZGlmeUNoYW5uZWw+KG9wdGlvbnMsIFwicGVybWlzc2lvbk92ZXJ3cml0ZXNcIikgJiZcbiAgICAgIEFycmF5LmlzQXJyYXkob3B0aW9ucy5wZXJtaXNzaW9uT3ZlcndyaXRlcylcbiAgICApIHtcbiAgICAgIGF3YWl0IHJlcXVpcmVPdmVyd3JpdGVQZXJtaXNzaW9ucyhcbiAgICAgICAgY2hhbm5lbC5ndWlsZElkLFxuICAgICAgICBvcHRpb25zLnBlcm1pc3Npb25PdmVyd3JpdGVzLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBpZiAob3B0aW9ucy5uYW1lIHx8IChvcHRpb25zIGFzIE1vZGlmeUNoYW5uZWwpLnRvcGljKSB7XG4gICAgY29uc3QgcmVxdWVzdCA9IGVkaXRDaGFubmVsTmFtZVRvcGljUXVldWUuZ2V0KGNoYW5uZWxJZCk7XG4gICAgaWYgKCFyZXF1ZXN0KSB7XG4gICAgICAvLyBJZiB0aGlzIGhhc250IGJlZW4gZG9uZSBiZWZvcmUgc2ltcGx5IGFkZCAxIGZvciBpdFxuICAgICAgZWRpdENoYW5uZWxOYW1lVG9waWNRdWV1ZS5zZXQoY2hhbm5lbElkLCB7XG4gICAgICAgIGNoYW5uZWxJZDogY2hhbm5lbElkLFxuICAgICAgICBhbW91bnQ6IDEsXG4gICAgICAgIC8vIDEwIG1pbnV0ZXMgZnJvbSBub3dcbiAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpICsgNjAwMDAwLFxuICAgICAgICBpdGVtczogW10sXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHJlcXVlc3QuYW1vdW50ID09PSAxKSB7XG4gICAgICAvLyBTdGFydCBxdWV1aW5nIGZ1dHVyZSByZXF1ZXN0cyB0byB0aGlzIGNoYW5uZWxcbiAgICAgIHJlcXVlc3QuYW1vdW50ID0gMjtcbiAgICAgIHJlcXVlc3QudGltZXN0YW1wID0gRGF0ZS5ub3coKSArIDYwMDAwMDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPERpc2NvcmRlbm9DaGFubmVsPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIC8vIDIgaGF2ZSBhbHJlYWR5IGJlZW4gdXNlZCBhZGQgdG8gcXVldWVcbiAgICAgICAgcmVxdWVzdC5pdGVtcy5wdXNoKHsgY2hhbm5lbElkLCBvcHRpb25zLCByZXNvbHZlLCByZWplY3QgfSk7XG4gICAgICAgIGlmIChlZGl0Q2hhbm5lbFByb2Nlc3NpbmcpIHJldHVybjtcbiAgICAgICAgZWRpdENoYW5uZWxQcm9jZXNzaW5nID0gdHJ1ZTtcbiAgICAgICAgcHJvY2Vzc0VkaXRDaGFubmVsUXVldWUoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgLi4uc25ha2VsaXplPFJlY29yZDxzdHJpbmcsIHVua25vd24+PihvcHRpb25zKSxcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIGNhbWVsY2FzZVxuICAgIHBlcm1pc3Npb25fb3ZlcndyaXRlczogaGFzT3duUHJvcGVydHk8TW9kaWZ5Q2hhbm5lbD4oXG4gICAgICAgIG9wdGlvbnMsXG4gICAgICAgIFwicGVybWlzc2lvbk92ZXJ3cml0ZXNcIixcbiAgICAgIClcbiAgICAgID8gb3B0aW9ucy5wZXJtaXNzaW9uT3ZlcndyaXRlcz8ubWFwKChvdmVyd3JpdGUpID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAuLi5vdmVyd3JpdGUsXG4gICAgICAgICAgYWxsb3c6IGNhbGN1bGF0ZUJpdHMob3ZlcndyaXRlLmFsbG93KSxcbiAgICAgICAgICBkZW55OiBjYWxjdWxhdGVCaXRzKG92ZXJ3cml0ZS5kZW55KSxcbiAgICAgICAgfTtcbiAgICAgIH0pXG4gICAgICA6IHVuZGVmaW5lZCxcbiAgfTtcblxuICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXN0LnJ1bk1ldGhvZDxDaGFubmVsPihcbiAgICBcInBhdGNoXCIsXG4gICAgZW5kcG9pbnRzLkNIQU5ORUxfQkFTRShjaGFubmVsSWQpLFxuICAgIHtcbiAgICAgIC4uLnBheWxvYWQsXG4gICAgICByZWFzb24sXG4gICAgfSxcbiAgKTtcblxuICByZXR1cm4gYXdhaXQgc3RydWN0dXJlcy5jcmVhdGVEaXNjb3JkZW5vQ2hhbm5lbChyZXN1bHQpO1xufVxuXG5pbnRlcmZhY2UgRWRpdENoYW5uZWxSZXF1ZXN0IHtcbiAgYW1vdW50OiBudW1iZXI7XG4gIHRpbWVzdGFtcDogbnVtYmVyO1xuICBjaGFubmVsSWQ6IGJpZ2ludDtcbiAgaXRlbXM6IHtcbiAgICBjaGFubmVsSWQ6IGJpZ2ludDtcbiAgICBvcHRpb25zOiBNb2RpZnlDaGFubmVsO1xuICAgIHJlc29sdmU6IChjaGFubmVsOiBEaXNjb3JkZW5vQ2hhbm5lbCkgPT4gdm9pZDtcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIHJlamVjdDogKGVycm9yOiBhbnkpID0+IHZvaWQ7XG4gIH1bXTtcbn1cblxuY29uc3QgZWRpdENoYW5uZWxOYW1lVG9waWNRdWV1ZSA9IG5ldyBNYXA8YmlnaW50LCBFZGl0Q2hhbm5lbFJlcXVlc3Q+KCk7XG5sZXQgZWRpdENoYW5uZWxQcm9jZXNzaW5nID0gZmFsc2U7XG5cbmZ1bmN0aW9uIHByb2Nlc3NFZGl0Q2hhbm5lbFF1ZXVlKCkge1xuICBpZiAoIWVkaXRDaGFubmVsUHJvY2Vzc2luZykgcmV0dXJuO1xuXG4gIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gIGVkaXRDaGFubmVsTmFtZVRvcGljUXVldWUuZm9yRWFjaChhc3luYyAocmVxdWVzdCkgPT4ge1xuICAgIGV2ZW50SGFuZGxlcnMuZGVidWc/LihcImxvb3BcIiwgYFJ1bm5pbmcgZm9yRWFjaCBsb29wIGluIGVkaXRfY2hhbm5lbCBmaWxlLmApO1xuICAgIGlmIChub3cgPCByZXF1ZXN0LnRpbWVzdGFtcCkgcmV0dXJuO1xuICAgIC8vIDEwIG1pbnV0ZXMgaGF2ZSBwYXNzZWQgc28gd2UgY2FuIHJlc2V0IHRoaXMgY2hhbm5lbCBhZ2FpblxuICAgIGlmICghcmVxdWVzdC5pdGVtcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBlZGl0Q2hhbm5lbE5hbWVUb3BpY1F1ZXVlLmRlbGV0ZShyZXF1ZXN0LmNoYW5uZWxJZCk7XG4gICAgfVxuICAgIHJlcXVlc3QuYW1vdW50ID0gMDtcbiAgICAvLyBUaGVyZSBhcmUgaXRlbXMgdG8gcHJvY2VzcyBmb3IgdGhpcyByZXF1ZXN0XG4gICAgY29uc3QgZGV0YWlscyA9IHJlcXVlc3QuaXRlbXMuc2hpZnQoKTtcblxuICAgIGlmICghZGV0YWlscykgcmV0dXJuO1xuXG4gICAgYXdhaXQgZWRpdENoYW5uZWwoZGV0YWlscy5jaGFubmVsSWQsIGRldGFpbHMub3B0aW9ucylcbiAgICAgIC50aGVuKChyZXN1bHQpID0+IGRldGFpbHMucmVzb2x2ZShyZXN1bHQpKVxuICAgICAgLmNhdGNoKGRldGFpbHMucmVqZWN0KTtcbiAgICBjb25zdCBzZWNvbmREZXRhaWxzID0gcmVxdWVzdC5pdGVtcy5zaGlmdCgpO1xuICAgIGlmICghc2Vjb25kRGV0YWlscykgcmV0dXJuO1xuXG4gICAgYXdhaXQgZWRpdENoYW5uZWwoc2Vjb25kRGV0YWlscy5jaGFubmVsSWQsIHNlY29uZERldGFpbHMub3B0aW9ucylcbiAgICAgIC50aGVuKChyZXN1bHQpID0+IHNlY29uZERldGFpbHMucmVzb2x2ZShyZXN1bHQpKVxuICAgICAgLmNhdGNoKHNlY29uZERldGFpbHMucmVqZWN0KTtcbiAgICByZXR1cm47XG4gIH0pO1xuXG4gIGlmIChlZGl0Q2hhbm5lbE5hbWVUb3BpY1F1ZXVlLnNpemUpIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGV2ZW50SGFuZGxlcnMuZGVidWc/LihcImxvb3BcIiwgYFJ1bm5pbmcgc2V0VGltZW91dCBpbiBFRElUX0NIQU5ORUwgZmlsZS5gKTtcbiAgICAgIHByb2Nlc3NFZGl0Q2hhbm5lbFF1ZXVlKCk7XG4gICAgfSwgNjAwMDApO1xuICB9IGVsc2Uge1xuICAgIGVkaXRDaGFubmVsUHJvY2Vzc2luZyA9IGZhbHNlO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsYUFBYSxTQUFRLFlBQWM7U0FDbkMsYUFBYSxTQUFRLGNBQWdCO1NBQ3JDLElBQUksU0FBUSxrQkFBb0I7U0FFaEMsVUFBVSxTQUFRLHVCQUF5QjtTQUUzQyxtQkFBbUIsU0FBUSxxQ0FBdUM7U0FJbEUsU0FBUyxTQUFRLHVCQUF5QjtTQUVqRCxhQUFhLEVBQ2IsNEJBQTRCLEVBQzVCLDJCQUEyQixTQUN0Qix5QkFBMkI7U0FDekIsY0FBYyxFQUFFLFNBQVMsU0FBUSxtQkFBcUI7QUFFL0QsRUFBdUMsQUFBdkMscUNBQXVDO0FBQ3ZDLEVBQW1DLEFBQW5DLGlDQUFtQztBQUNuQyxFQUE0RixBQUE1Rix3RkFBNEYsQUFBNUYsRUFBNEYsdUJBQ3RFLFdBQVcsQ0FDL0IsU0FBaUIsRUFDakIsT0FBcUMsRUFDckMsTUFBZTtVQUVULE9BQU8sU0FBUyxhQUFhLENBQUMsR0FBRyxFQUFDLFFBQVUsR0FBRSxTQUFTO1FBRXpELE9BQU87O1lBR0wsbUJBQW1CLENBQUMsZUFBZTtZQUNuQyxtQkFBbUIsQ0FBQyxpQkFBaUI7WUFDckMsbUJBQW1C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