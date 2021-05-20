import { eventHandlers } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { structures } from "../../structures/mod.ts";
import { snowflakeToBigint } from "../../util/bigint.ts";
export async function handleChannelUpdate(data) {
  const payload = data.d;
  const cachedChannel = await cacheHandlers.get(
    "channels",
    snowflakeToBigint(payload.id),
  );
  if (!cachedChannel) return;
  const discordenoChannel = await structures.createDiscordenoChannel(payload);
  await cacheHandlers.set("channels", discordenoChannel.id, discordenoChannel);
  eventHandlers.channelUpdate?.(discordenoChannel, cachedChannel);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hhbmRsZXJzL2NoYW5uZWxzL0NIQU5ORUxfVVBEQVRFLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBldmVudEhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2JvdC50c1wiO1xuaW1wb3J0IHsgY2FjaGVIYW5kbGVycyB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuaW1wb3J0IHsgc3RydWN0dXJlcyB9IGZyb20gXCIuLi8uLi9zdHJ1Y3R1cmVzL21vZC50c1wiO1xuaW1wb3J0IHR5cGUgeyBDaGFubmVsIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2NoYW5uZWxzL2NoYW5uZWwudHNcIjtcbmltcG9ydCB0eXBlIHsgRGlzY29yZEdhdGV3YXlQYXlsb2FkIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2dhdGV3YXkvZ2F0ZXdheV9wYXlsb2FkLnRzXCI7XG5pbXBvcnQgeyBzbm93Zmxha2VUb0JpZ2ludCB9IGZyb20gXCIuLi8uLi91dGlsL2JpZ2ludC50c1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlQ2hhbm5lbFVwZGF0ZShkYXRhOiBEaXNjb3JkR2F0ZXdheVBheWxvYWQpIHtcbiAgY29uc3QgcGF5bG9hZCA9IGRhdGEuZCBhcyBDaGFubmVsO1xuICBjb25zdCBjYWNoZWRDaGFubmVsID0gYXdhaXQgY2FjaGVIYW5kbGVycy5nZXQoXG4gICAgXCJjaGFubmVsc1wiLFxuICAgIHNub3dmbGFrZVRvQmlnaW50KHBheWxvYWQuaWQpLFxuICApO1xuICBpZiAoIWNhY2hlZENoYW5uZWwpIHJldHVybjtcblxuICBjb25zdCBkaXNjb3JkZW5vQ2hhbm5lbCA9IGF3YWl0IHN0cnVjdHVyZXMuY3JlYXRlRGlzY29yZGVub0NoYW5uZWwocGF5bG9hZCk7XG4gIGF3YWl0IGNhY2hlSGFuZGxlcnMuc2V0KFwiY2hhbm5lbHNcIiwgZGlzY29yZGVub0NoYW5uZWwuaWQsIGRpc2NvcmRlbm9DaGFubmVsKTtcblxuICBldmVudEhhbmRsZXJzLmNoYW5uZWxVcGRhdGU/LihkaXNjb3JkZW5vQ2hhbm5lbCwgY2FjaGVkQ2hhbm5lbCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsYUFBYSxTQUFRLFlBQWM7U0FDbkMsYUFBYSxTQUFRLGNBQWdCO1NBQ3JDLFVBQVUsU0FBUSx1QkFBeUI7U0FHM0MsaUJBQWlCLFNBQVEsb0JBQXNCO3NCQUVsQyxtQkFBbUIsQ0FBQyxJQUEyQjtVQUM3RCxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUM7VUFDaEIsYUFBYSxTQUFTLGFBQWEsQ0FBQyxHQUFHLEVBQzNDLFFBQVUsR0FDVixpQkFBaUIsQ0FBQyxPQUFPLENBQUMsRUFBRTtTQUV6QixhQUFhO1VBRVosaUJBQWlCLFNBQVMsVUFBVSxDQUFDLHVCQUF1QixDQUFDLE9BQU87VUFDcEUsYUFBYSxDQUFDLEdBQUcsRUFBQyxRQUFVLEdBQUUsaUJBQWlCLENBQUMsRUFBRSxFQUFFLGlCQUFpQjtJQUUzRSxhQUFhLENBQUMsYUFBYSxHQUFHLGlCQUFpQixFQUFFLGFBQWEifQ==