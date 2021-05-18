import { cacheHandlers } from "../../cache.ts";
import { rest } from "../../rest/rest.ts";
import { structures } from "../../structures/mod.ts";
import { DiscordChannelTypes } from "../../types/channels/channel_types.ts";
import { endpoints } from "../../util/constants.ts";
import { calculateBits, requireOverwritePermissions } from "../../util/permissions.ts";
import { snakelize } from "../../util/utils.ts";
/** Create a channel in your server. Bot needs MANAGE_CHANNEL permissions in the server. */ export async function createChannel(guildId, options, reason) {
    if (options?.permissionOverwrites) {
        await requireOverwritePermissions(guildId, options.permissionOverwrites);
    }
    // BITRATES ARE IN THOUSANDS SO IF USER PROVIDES 32 WE CONVERT TO 32000
    if (options?.bitrate && options.bitrate < 1000) options.bitrate *= 1000;
    const result = await rest.runMethod("post", endpoints.GUILD_CHANNELS(guildId), {
        ...snakelize(options ?? {
        }),
        permission_overwrites: options?.permissionOverwrites?.map((perm)=>({
                ...perm,
                allow: calculateBits(perm.allow),
                deny: calculateBits(perm.deny)
            })
        ),
        type: options?.type || DiscordChannelTypes.GuildText,
        reason
    });
    const discordenoChannel = await structures.createDiscordenoChannel(result);
    await cacheHandlers.set("channels", discordenoChannel.id, discordenoChannel);
    return discordenoChannel;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvY2hhbm5lbHMvY3JlYXRlX2NoYW5uZWwudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNhY2hlSGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vY2FjaGUudHNcIjtcbmltcG9ydCB7IHJlc3QgfSBmcm9tIFwiLi4vLi4vcmVzdC9yZXN0LnRzXCI7XG5pbXBvcnQgeyBzdHJ1Y3R1cmVzIH0gZnJvbSBcIi4uLy4uL3N0cnVjdHVyZXMvbW9kLnRzXCI7XG5pbXBvcnQgdHlwZSB7IENoYW5uZWwgfSBmcm9tIFwiLi4vLi4vdHlwZXMvY2hhbm5lbHMvY2hhbm5lbC50c1wiO1xuaW1wb3J0IHsgRGlzY29yZENoYW5uZWxUeXBlcyB9IGZyb20gXCIuLi8uLi90eXBlcy9jaGFubmVscy9jaGFubmVsX3R5cGVzLnRzXCI7XG5pbXBvcnQgdHlwZSB7XG4gIENyZWF0ZUd1aWxkQ2hhbm5lbCxcbiAgRGlzY29yZENyZWF0ZUd1aWxkQ2hhbm5lbCxcbn0gZnJvbSBcIi4uLy4uL3R5cGVzL2d1aWxkcy9jcmVhdGVfZ3VpbGRfY2hhbm5lbC50c1wiO1xuaW1wb3J0IHsgZW5kcG9pbnRzIH0gZnJvbSBcIi4uLy4uL3V0aWwvY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQge1xuICBjYWxjdWxhdGVCaXRzLFxuICByZXF1aXJlT3ZlcndyaXRlUGVybWlzc2lvbnMsXG59IGZyb20gXCIuLi8uLi91dGlsL3Blcm1pc3Npb25zLnRzXCI7XG5pbXBvcnQgeyBzbmFrZWxpemUgfSBmcm9tIFwiLi4vLi4vdXRpbC91dGlscy50c1wiO1xuXG4vKiogQ3JlYXRlIGEgY2hhbm5lbCBpbiB5b3VyIHNlcnZlci4gQm90IG5lZWRzIE1BTkFHRV9DSEFOTkVMIHBlcm1pc3Npb25zIGluIHRoZSBzZXJ2ZXIuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlQ2hhbm5lbChcbiAgZ3VpbGRJZDogYmlnaW50LFxuICBvcHRpb25zPzogQ3JlYXRlR3VpbGRDaGFubmVsLFxuICByZWFzb24/OiBzdHJpbmcsXG4pIHtcbiAgaWYgKG9wdGlvbnM/LnBlcm1pc3Npb25PdmVyd3JpdGVzKSB7XG4gICAgYXdhaXQgcmVxdWlyZU92ZXJ3cml0ZVBlcm1pc3Npb25zKFxuICAgICAgZ3VpbGRJZCxcbiAgICAgIG9wdGlvbnMucGVybWlzc2lvbk92ZXJ3cml0ZXMsXG4gICAgKTtcbiAgfVxuXG4gIC8vIEJJVFJBVEVTIEFSRSBJTiBUSE9VU0FORFMgU08gSUYgVVNFUiBQUk9WSURFUyAzMiBXRSBDT05WRVJUIFRPIDMyMDAwXG4gIGlmIChvcHRpb25zPy5iaXRyYXRlICYmIG9wdGlvbnMuYml0cmF0ZSA8IDEwMDApIG9wdGlvbnMuYml0cmF0ZSAqPSAxMDAwO1xuXG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlc3QucnVuTWV0aG9kPENoYW5uZWw+KFxuICAgIFwicG9zdFwiLFxuICAgIGVuZHBvaW50cy5HVUlMRF9DSEFOTkVMUyhndWlsZElkKSxcbiAgICB7XG4gICAgICAuLi5zbmFrZWxpemU8RGlzY29yZENyZWF0ZUd1aWxkQ2hhbm5lbD4ob3B0aW9ucyA/PyB7fSksXG4gICAgICBwZXJtaXNzaW9uX292ZXJ3cml0ZXM6IG9wdGlvbnM/LnBlcm1pc3Npb25PdmVyd3JpdGVzPy5tYXAoKHBlcm0pID0+ICh7XG4gICAgICAgIC4uLnBlcm0sXG4gICAgICAgIGFsbG93OiBjYWxjdWxhdGVCaXRzKHBlcm0uYWxsb3cpLFxuICAgICAgICBkZW55OiBjYWxjdWxhdGVCaXRzKHBlcm0uZGVueSksXG4gICAgICB9KSksXG4gICAgICB0eXBlOiBvcHRpb25zPy50eXBlIHx8IERpc2NvcmRDaGFubmVsVHlwZXMuR3VpbGRUZXh0LFxuICAgICAgcmVhc29uLFxuICAgIH0sXG4gICk7XG5cbiAgY29uc3QgZGlzY29yZGVub0NoYW5uZWwgPSBhd2FpdCBzdHJ1Y3R1cmVzLmNyZWF0ZURpc2NvcmRlbm9DaGFubmVsKHJlc3VsdCk7XG4gIGF3YWl0IGNhY2hlSGFuZGxlcnMuc2V0KFwiY2hhbm5lbHNcIiwgZGlzY29yZGVub0NoYW5uZWwuaWQsIGRpc2NvcmRlbm9DaGFubmVsKTtcblxuICByZXR1cm4gZGlzY29yZGVub0NoYW5uZWw7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsYUFBYSxTQUFRLGNBQWdCO1NBQ3JDLElBQUksU0FBUSxrQkFBb0I7U0FDaEMsVUFBVSxTQUFRLHVCQUF5QjtTQUUzQyxtQkFBbUIsU0FBUSxxQ0FBdUM7U0FLbEUsU0FBUyxTQUFRLHVCQUF5QjtTQUVqRCxhQUFhLEVBQ2IsMkJBQTJCLFNBQ3RCLHlCQUEyQjtTQUN6QixTQUFTLFNBQVEsbUJBQXFCO0FBRS9DLEVBQTJGLEFBQTNGLHVGQUEyRixBQUEzRixFQUEyRix1QkFDckUsYUFBYSxDQUNqQyxPQUFlLEVBQ2YsT0FBNEIsRUFDNUIsTUFBZTtRQUVYLE9BQU8sRUFBRSxvQkFBb0I7Y0FDekIsMkJBQTJCLENBQy9CLE9BQU8sRUFDUCxPQUFPLENBQUMsb0JBQW9COztJQUloQyxFQUF1RSxBQUF2RSxxRUFBdUU7UUFDbkUsT0FBTyxFQUFFLE9BQU8sSUFBSSxPQUFPLENBQUMsT0FBTyxHQUFHLElBQUksRUFBRSxPQUFPLENBQUMsT0FBTyxJQUFJLElBQUk7VUFFakUsTUFBTSxTQUFTLElBQUksQ0FBQyxTQUFTLEVBQ2pDLElBQU0sR0FDTixTQUFTLENBQUMsY0FBYyxDQUFDLE9BQU87V0FFM0IsU0FBUyxDQUE0QixPQUFPOztRQUMvQyxxQkFBcUIsRUFBRSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsR0FBRyxFQUFFLElBQUk7bUJBQzFELElBQUk7Z0JBQ1AsS0FBSyxFQUFFLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSztnQkFDL0IsSUFBSSxFQUFFLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSTs7O1FBRS9CLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxJQUFJLG1CQUFtQixDQUFDLFNBQVM7UUFDcEQsTUFBTTs7VUFJSixpQkFBaUIsU0FBUyxVQUFVLENBQUMsdUJBQXVCLENBQUMsTUFBTTtVQUNuRSxhQUFhLENBQUMsR0FBRyxFQUFDLFFBQVUsR0FBRSxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsaUJBQWlCO1dBRXBFLGlCQUFpQiJ9