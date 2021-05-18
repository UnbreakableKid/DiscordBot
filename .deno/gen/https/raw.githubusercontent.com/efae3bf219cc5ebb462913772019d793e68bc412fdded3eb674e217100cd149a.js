import { eventHandlers } from "../bot.ts";
import { cacheHandlers } from "../cache.ts";
import { structures } from "../structures/mod.ts";
const guildMemberQueue = new Map();
let processingQueue = false;
/** Cache all guild members without need to worry about overwriting something. */ // deno-lint-ignore require-await
export async function cacheMembers(guildId, members) {
    if (!members.length) return;
    return new Promise((resolve)=>{
        guildMemberQueue.set(guildId, {
            members,
            resolve
        });
        startQueue();
    });
}
async function startQueue() {
    if (processingQueue) return;
    processingQueue = true;
    while(guildMemberQueue.size){
        eventHandlers.debug?.("loop", "Running whille loop in cache_members file.");
        const [guildId, queue] = guildMemberQueue.entries().next().value;
        await Promise.allSettled([
            queue.members.map(async (member)=>{
                const discordenoMember = await structures.createDiscordenoMember(member, guildId);
                await cacheHandlers.set("members", discordenoMember.id, discordenoMember);
            }), 
        ]);
        queue.resolve?.();
        guildMemberQueue.delete(guildId);
    }
    processingQueue = false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3V0aWwvY2FjaGVfbWVtYmVycy50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXZlbnRIYW5kbGVycyB9IGZyb20gXCIuLi9ib3QudHNcIjtcbmltcG9ydCB7IGNhY2hlSGFuZGxlcnMgfSBmcm9tIFwiLi4vY2FjaGUudHNcIjtcbmltcG9ydCB7IHN0cnVjdHVyZXMgfSBmcm9tIFwiLi4vc3RydWN0dXJlcy9tb2QudHNcIjtcbmltcG9ydCB7IEd1aWxkTWVtYmVyV2l0aFVzZXIgfSBmcm9tIFwiLi4vdHlwZXMvbWVtYmVycy9ndWlsZF9tZW1iZXIudHNcIjtcblxuY29uc3QgZ3VpbGRNZW1iZXJRdWV1ZSA9IG5ldyBNYXA8XG4gIGJpZ2ludCxcbiAgeyBtZW1iZXJzOiBHdWlsZE1lbWJlcldpdGhVc2VyW107IHJlc29sdmU/OiAodmFsdWU/OiB1bmtub3duKSA9PiB2b2lkIH1cbj4oKTtcbmxldCBwcm9jZXNzaW5nUXVldWUgPSBmYWxzZTtcblxuLyoqIENhY2hlIGFsbCBndWlsZCBtZW1iZXJzIHdpdGhvdXQgbmVlZCB0byB3b3JyeSBhYm91dCBvdmVyd3JpdGluZyBzb21ldGhpbmcuICovXG4vLyBkZW5vLWxpbnQtaWdub3JlIHJlcXVpcmUtYXdhaXRcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWNoZU1lbWJlcnMoXG4gIGd1aWxkSWQ6IGJpZ2ludCxcbiAgbWVtYmVyczogR3VpbGRNZW1iZXJXaXRoVXNlcltdLFxuKSB7XG4gIGlmICghbWVtYmVycy5sZW5ndGgpIHJldHVybjtcblxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICBndWlsZE1lbWJlclF1ZXVlLnNldChndWlsZElkLCB7IG1lbWJlcnMsIHJlc29sdmUgfSk7XG4gICAgc3RhcnRRdWV1ZSgpO1xuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc3RhcnRRdWV1ZSgpIHtcbiAgaWYgKHByb2Nlc3NpbmdRdWV1ZSkgcmV0dXJuO1xuXG4gIHByb2Nlc3NpbmdRdWV1ZSA9IHRydWU7XG5cbiAgd2hpbGUgKGd1aWxkTWVtYmVyUXVldWUuc2l6ZSkge1xuICAgIGV2ZW50SGFuZGxlcnMuZGVidWc/LihcImxvb3BcIiwgXCJSdW5uaW5nIHdoaWxsZSBsb29wIGluIGNhY2hlX21lbWJlcnMgZmlsZS5cIik7XG4gICAgY29uc3QgW2d1aWxkSWQsIHF1ZXVlXTogW1xuICAgICAgYmlnaW50LFxuICAgICAgeyBtZW1iZXJzOiBHdWlsZE1lbWJlcldpdGhVc2VyW107IHJlc29sdmU6ICh2YWx1ZT86IHVua25vd24pID0+IHZvaWQgfSxcbiAgICBdID0gZ3VpbGRNZW1iZXJRdWV1ZS5lbnRyaWVzKCkubmV4dCgpLnZhbHVlO1xuXG4gICAgYXdhaXQgUHJvbWlzZS5hbGxTZXR0bGVkKFtcbiAgICAgIHF1ZXVlLm1lbWJlcnMubWFwKGFzeW5jIChtZW1iZXIpID0+IHtcbiAgICAgICAgY29uc3QgZGlzY29yZGVub01lbWJlciA9IGF3YWl0IHN0cnVjdHVyZXMuY3JlYXRlRGlzY29yZGVub01lbWJlcihcbiAgICAgICAgICBtZW1iZXIsXG4gICAgICAgICAgZ3VpbGRJZCxcbiAgICAgICAgKTtcblxuICAgICAgICBhd2FpdCBjYWNoZUhhbmRsZXJzLnNldChcbiAgICAgICAgICBcIm1lbWJlcnNcIixcbiAgICAgICAgICBkaXNjb3JkZW5vTWVtYmVyLmlkLFxuICAgICAgICAgIGRpc2NvcmRlbm9NZW1iZXIsXG4gICAgICAgICk7XG4gICAgICB9KSxcbiAgICBdKTtcblxuICAgIHF1ZXVlLnJlc29sdmU/LigpO1xuXG4gICAgZ3VpbGRNZW1iZXJRdWV1ZS5kZWxldGUoZ3VpbGRJZCk7XG4gIH1cblxuICBwcm9jZXNzaW5nUXVldWUgPSBmYWxzZTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxhQUFhLFNBQVEsU0FBVztTQUNoQyxhQUFhLFNBQVEsV0FBYTtTQUNsQyxVQUFVLFNBQVEsb0JBQXNCO01BRzNDLGdCQUFnQixPQUFPLEdBQUc7SUFJNUIsZUFBZSxHQUFHLEtBQUs7QUFFM0IsRUFBaUYsQUFBakYsNkVBQWlGLEFBQWpGLEVBQWlGLENBQ2pGLEVBQWlDLEFBQWpDLCtCQUFpQztzQkFDWCxZQUFZLENBQ2hDLE9BQWUsRUFDZixPQUE4QjtTQUV6QixPQUFPLENBQUMsTUFBTTtlQUVSLE9BQU8sRUFBRSxPQUFPO1FBQ3pCLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxPQUFPO1lBQUksT0FBTztZQUFFLE9BQU87O1FBQ2hELFVBQVU7OztlQUlDLFVBQVU7UUFDbkIsZUFBZTtJQUVuQixlQUFlLEdBQUcsSUFBSTtVQUVmLGdCQUFnQixDQUFDLElBQUk7UUFDMUIsYUFBYSxDQUFDLEtBQUssSUFBRyxJQUFNLElBQUUsMENBQTRDO2VBQ25FLE9BQU8sRUFBRSxLQUFLLElBR2pCLGdCQUFnQixDQUFDLE9BQU8sR0FBRyxJQUFJLEdBQUcsS0FBSztjQUVyQyxPQUFPLENBQUMsVUFBVTtZQUN0QixLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsUUFBUSxNQUFNO3NCQUN2QixnQkFBZ0IsU0FBUyxVQUFVLENBQUMsc0JBQXNCLENBQzlELE1BQU0sRUFDTixPQUFPO3NCQUdILGFBQWEsQ0FBQyxHQUFHLEVBQ3JCLE9BQVMsR0FDVCxnQkFBZ0IsQ0FBQyxFQUFFLEVBQ25CLGdCQUFnQjs7O1FBS3RCLEtBQUssQ0FBQyxPQUFPO1FBRWIsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLE9BQU87O0lBR2pDLGVBQWUsR0FBRyxLQUFLIn0=