import { eventHandlers } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { structures } from "../../structures/mod.ts";
export async function handleChannelCreate(data) {
  const payload = data.d;
  const discordenoChannel = await structures.createDiscordenoChannel(payload);
  await cacheHandlers.set("channels", discordenoChannel.id, discordenoChannel);
  eventHandlers.channelCreate?.(discordenoChannel);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hhbmRsZXJzL2NoYW5uZWxzL0NIQU5ORUxfQ1JFQVRFLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBldmVudEhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2JvdC50c1wiO1xuaW1wb3J0IHsgY2FjaGVIYW5kbGVycyB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuaW1wb3J0IHsgc3RydWN0dXJlcyB9IGZyb20gXCIuLi8uLi9zdHJ1Y3R1cmVzL21vZC50c1wiO1xuaW1wb3J0IHR5cGUgeyBDaGFubmVsIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2NoYW5uZWxzL2NoYW5uZWwudHNcIjtcbmltcG9ydCB0eXBlIHsgRGlzY29yZEdhdGV3YXlQYXlsb2FkIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2dhdGV3YXkvZ2F0ZXdheV9wYXlsb2FkLnRzXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVDaGFubmVsQ3JlYXRlKGRhdGE6IERpc2NvcmRHYXRld2F5UGF5bG9hZCkge1xuICBjb25zdCBwYXlsb2FkID0gZGF0YS5kIGFzIENoYW5uZWw7XG5cbiAgY29uc3QgZGlzY29yZGVub0NoYW5uZWwgPSBhd2FpdCBzdHJ1Y3R1cmVzLmNyZWF0ZURpc2NvcmRlbm9DaGFubmVsKHBheWxvYWQpO1xuICBhd2FpdCBjYWNoZUhhbmRsZXJzLnNldChcImNoYW5uZWxzXCIsIGRpc2NvcmRlbm9DaGFubmVsLmlkLCBkaXNjb3JkZW5vQ2hhbm5lbCk7XG5cbiAgZXZlbnRIYW5kbGVycy5jaGFubmVsQ3JlYXRlPy4oZGlzY29yZGVub0NoYW5uZWwpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLGFBQWEsU0FBUSxZQUFjO1NBQ25DLGFBQWEsU0FBUSxjQUFnQjtTQUNyQyxVQUFVLFNBQVEsdUJBQXlCO3NCQUk5QixtQkFBbUIsQ0FBQyxJQUEyQjtVQUM3RCxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUM7VUFFaEIsaUJBQWlCLFNBQVMsVUFBVSxDQUFDLHVCQUF1QixDQUFDLE9BQU87VUFDcEUsYUFBYSxDQUFDLEdBQUcsRUFBQyxRQUFVLEdBQUUsaUJBQWlCLENBQUMsRUFBRSxFQUFFLGlCQUFpQjtJQUUzRSxhQUFhLENBQUMsYUFBYSxHQUFHLGlCQUFpQiJ9