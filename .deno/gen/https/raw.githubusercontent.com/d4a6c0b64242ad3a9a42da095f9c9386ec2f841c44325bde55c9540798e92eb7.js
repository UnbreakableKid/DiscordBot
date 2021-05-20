import { eventHandlers } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { structures } from "../../structures/mod.ts";
export async function handleThreadCreate(data) {
  const payload = data.d;
  const discordenoChannel = await structures.createDiscordenoChannel(payload);
  await cacheHandlers.set("channels", discordenoChannel.id, discordenoChannel);
  eventHandlers.threadCreate?.(discordenoChannel);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hhbmRsZXJzL2NoYW5uZWxzL1RIUkVBRF9DUkVBVEUudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV2ZW50SGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vYm90LnRzXCI7XG5pbXBvcnQgeyBjYWNoZUhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyBzdHJ1Y3R1cmVzIH0gZnJvbSBcIi4uLy4uL3N0cnVjdHVyZXMvbW9kLnRzXCI7XG5pbXBvcnQgeyBDaGFubmVsIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2NoYW5uZWxzL2NoYW5uZWwudHNcIjtcbmltcG9ydCB7IERpc2NvcmRHYXRld2F5UGF5bG9hZCB9IGZyb20gXCIuLi8uLi90eXBlcy9nYXRld2F5L2dhdGV3YXlfcGF5bG9hZC50c1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlVGhyZWFkQ3JlYXRlKGRhdGE6IERpc2NvcmRHYXRld2F5UGF5bG9hZCkge1xuICBjb25zdCBwYXlsb2FkID0gZGF0YS5kIGFzIENoYW5uZWw7XG5cbiAgY29uc3QgZGlzY29yZGVub0NoYW5uZWwgPSBhd2FpdCBzdHJ1Y3R1cmVzLmNyZWF0ZURpc2NvcmRlbm9DaGFubmVsKHBheWxvYWQpO1xuICBhd2FpdCBjYWNoZUhhbmRsZXJzLnNldChcImNoYW5uZWxzXCIsIGRpc2NvcmRlbm9DaGFubmVsLmlkLCBkaXNjb3JkZW5vQ2hhbm5lbCk7XG5cbiAgZXZlbnRIYW5kbGVycy50aHJlYWRDcmVhdGU/LihkaXNjb3JkZW5vQ2hhbm5lbCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsYUFBYSxTQUFRLFlBQWM7U0FDbkMsYUFBYSxTQUFRLGNBQWdCO1NBQ3JDLFVBQVUsU0FBUSx1QkFBeUI7c0JBSTlCLGtCQUFrQixDQUFDLElBQTJCO1VBQzVELE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQztVQUVoQixpQkFBaUIsU0FBUyxVQUFVLENBQUMsdUJBQXVCLENBQUMsT0FBTztVQUNwRSxhQUFhLENBQUMsR0FBRyxFQUFDLFFBQVUsR0FBRSxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsaUJBQWlCO0lBRTNFLGFBQWEsQ0FBQyxZQUFZLEdBQUcsaUJBQWlCIn0=