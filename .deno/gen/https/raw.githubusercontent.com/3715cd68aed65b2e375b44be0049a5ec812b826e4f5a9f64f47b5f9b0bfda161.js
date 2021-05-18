import { cache, cacheHandlers } from "../../cache.ts";
import { structures } from "../../structures/mod.ts";
import { snowflakeToBigint } from "../../util/bigint.ts";
import { Collection } from "../../util/collection.ts";
export async function handleGuildMembersChunk(data) {
    const payload = data.d;
    const guildId = snowflakeToBigint(payload.guildId);
    const members = await Promise.all(payload.members.map(async (member)=>{
        const discordenoMember = await structures.createDiscordenoMember(member, guildId);
        await cacheHandlers.set("members", discordenoMember.id, discordenoMember);
        return discordenoMember;
    }));
    // Check if its necessary to resolve the fetchmembers promise for this chunk or if more chunks will be coming
    if (payload.nonce) {
        const resolve = cache.fetchAllMembersProcessingRequests.get(payload.nonce);
        if (!resolve) return;
        if (payload.chunkIndex + 1 === payload.chunkCount) {
            cache.fetchAllMembersProcessingRequests.delete(payload.nonce);
            // Only 1 chunk most likely is all members or users only request a small amount of users
            if (payload.chunkCount === 1) {
                return resolve(new Collection(members.map((m)=>[
                        m.id,
                        m
                    ]
                )));
            }
            return resolve(await cacheHandlers.filter("members", (m)=>m.guilds.has(guildId)
            ));
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hhbmRsZXJzL21lbWJlcnMvR1VJTERfTUVNQkVSU19DSFVOSy50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY2FjaGUsIGNhY2hlSGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vY2FjaGUudHNcIjtcbmltcG9ydCB7IHN0cnVjdHVyZXMgfSBmcm9tIFwiLi4vLi4vc3RydWN0dXJlcy9tb2QudHNcIjtcbmltcG9ydCB0eXBlIHsgRGlzY29yZEdhdGV3YXlQYXlsb2FkIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2dhdGV3YXkvZ2F0ZXdheV9wYXlsb2FkLnRzXCI7XG5pbXBvcnQgdHlwZSB7IEd1aWxkTWVtYmVyc0NodW5rIH0gZnJvbSBcIi4uLy4uL3R5cGVzL21lbWJlcnMvZ3VpbGRfbWVtYmVyc19jaHVuay50c1wiO1xuaW1wb3J0IHsgc25vd2ZsYWtlVG9CaWdpbnQgfSBmcm9tIFwiLi4vLi4vdXRpbC9iaWdpbnQudHNcIjtcbmltcG9ydCB7IENvbGxlY3Rpb24gfSBmcm9tIFwiLi4vLi4vdXRpbC9jb2xsZWN0aW9uLnRzXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVHdWlsZE1lbWJlcnNDaHVuayhkYXRhOiBEaXNjb3JkR2F0ZXdheVBheWxvYWQpIHtcbiAgY29uc3QgcGF5bG9hZCA9IGRhdGEuZCBhcyBHdWlsZE1lbWJlcnNDaHVuaztcblxuICBjb25zdCBndWlsZElkID0gc25vd2ZsYWtlVG9CaWdpbnQocGF5bG9hZC5ndWlsZElkKTtcblxuICBjb25zdCBtZW1iZXJzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgcGF5bG9hZC5tZW1iZXJzLm1hcChhc3luYyAobWVtYmVyKSA9PiB7XG4gICAgICBjb25zdCBkaXNjb3JkZW5vTWVtYmVyID0gYXdhaXQgc3RydWN0dXJlcy5jcmVhdGVEaXNjb3JkZW5vTWVtYmVyKFxuICAgICAgICBtZW1iZXIsXG4gICAgICAgIGd1aWxkSWQsXG4gICAgICApO1xuICAgICAgYXdhaXQgY2FjaGVIYW5kbGVycy5zZXQoXCJtZW1iZXJzXCIsIGRpc2NvcmRlbm9NZW1iZXIuaWQsIGRpc2NvcmRlbm9NZW1iZXIpO1xuXG4gICAgICByZXR1cm4gZGlzY29yZGVub01lbWJlcjtcbiAgICB9KSxcbiAgKTtcblxuICAvLyBDaGVjayBpZiBpdHMgbmVjZXNzYXJ5IHRvIHJlc29sdmUgdGhlIGZldGNobWVtYmVycyBwcm9taXNlIGZvciB0aGlzIGNodW5rIG9yIGlmIG1vcmUgY2h1bmtzIHdpbGwgYmUgY29taW5nXG4gIGlmIChcbiAgICBwYXlsb2FkLm5vbmNlXG4gICkge1xuICAgIGNvbnN0IHJlc29sdmUgPSBjYWNoZS5mZXRjaEFsbE1lbWJlcnNQcm9jZXNzaW5nUmVxdWVzdHMuZ2V0KHBheWxvYWQubm9uY2UpO1xuICAgIGlmICghcmVzb2x2ZSkgcmV0dXJuO1xuXG4gICAgaWYgKHBheWxvYWQuY2h1bmtJbmRleCArIDEgPT09IHBheWxvYWQuY2h1bmtDb3VudCkge1xuICAgICAgY2FjaGUuZmV0Y2hBbGxNZW1iZXJzUHJvY2Vzc2luZ1JlcXVlc3RzLmRlbGV0ZShwYXlsb2FkLm5vbmNlKTtcbiAgICAgIC8vIE9ubHkgMSBjaHVuayBtb3N0IGxpa2VseSBpcyBhbGwgbWVtYmVycyBvciB1c2VycyBvbmx5IHJlcXVlc3QgYSBzbWFsbCBhbW91bnQgb2YgdXNlcnNcbiAgICAgIGlmIChwYXlsb2FkLmNodW5rQ291bnQgPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmUobmV3IENvbGxlY3Rpb24obWVtYmVycy5tYXAoKG0pID0+IFttLmlkLCBtXSkpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc29sdmUoXG4gICAgICAgIGF3YWl0IGNhY2hlSGFuZGxlcnMuZmlsdGVyKFxuICAgICAgICAgIFwibWVtYmVyc1wiLFxuICAgICAgICAgIChtKSA9PiBtLmd1aWxkcy5oYXMoZ3VpbGRJZCksXG4gICAgICAgICksXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLEtBQUssRUFBRSxhQUFhLFNBQVEsY0FBZ0I7U0FDNUMsVUFBVSxTQUFRLHVCQUF5QjtTQUczQyxpQkFBaUIsU0FBUSxvQkFBc0I7U0FDL0MsVUFBVSxTQUFRLHdCQUEwQjtzQkFFL0IsdUJBQXVCLENBQUMsSUFBMkI7VUFDakUsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDO1VBRWhCLE9BQU8sR0FBRyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsT0FBTztVQUUzQyxPQUFPLFNBQVMsT0FBTyxDQUFDLEdBQUcsQ0FDL0IsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLFFBQVEsTUFBTTtjQUN6QixnQkFBZ0IsU0FBUyxVQUFVLENBQUMsc0JBQXNCLENBQzlELE1BQU0sRUFDTixPQUFPO2NBRUgsYUFBYSxDQUFDLEdBQUcsRUFBQyxPQUFTLEdBQUUsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLGdCQUFnQjtlQUVqRSxnQkFBZ0I7O0lBSTNCLEVBQTZHLEFBQTdHLDJHQUE2RztRQUUzRyxPQUFPLENBQUMsS0FBSztjQUVQLE9BQU8sR0FBRyxLQUFLLENBQUMsaUNBQWlDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLO2FBQ3BFLE9BQU87WUFFUixPQUFPLENBQUMsVUFBVSxHQUFHLENBQUMsS0FBSyxPQUFPLENBQUMsVUFBVTtZQUMvQyxLQUFLLENBQUMsaUNBQWlDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLO1lBQzVELEVBQXdGLEFBQXhGLHNGQUF3RjtnQkFDcEYsT0FBTyxDQUFDLFVBQVUsS0FBSyxDQUFDO3VCQUNuQixPQUFPLEtBQUssVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQzt3QkFBTSxDQUFDLENBQUMsRUFBRTt3QkFBRSxDQUFDOzs7O21CQUdwRCxPQUFPLE9BQ04sYUFBYSxDQUFDLE1BQU0sRUFDeEIsT0FBUyxJQUNSLENBQUMsR0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPIn0=