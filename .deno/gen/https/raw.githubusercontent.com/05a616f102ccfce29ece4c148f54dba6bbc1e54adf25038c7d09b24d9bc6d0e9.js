import { eventHandlers } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { snowflakeToBigint } from "../../util/bigint.ts";
export async function handleChannelPinsUpdate(data) {
  const payload = data.d;
  const channel = await cacheHandlers.get(
    "channels",
    snowflakeToBigint(payload.channelId),
  );
  if (!channel) return;
  const guild = payload.guildId
    ? await cacheHandlers.get("guilds", snowflakeToBigint(payload.guildId))
    : undefined;
  eventHandlers.channelPinsUpdate?.(channel, guild, payload.lastPinTimestamp);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hhbmRsZXJzL2NoYW5uZWxzL0NIQU5ORUxfUElOU19VUERBVEUudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV2ZW50SGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vYm90LnRzXCI7XG5pbXBvcnQgeyBjYWNoZUhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgdHlwZSB7IENoYW5uZWxQaW5zVXBkYXRlIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2NoYW5uZWxzL2NoYW5uZWxfcGluc191cGRhdGUudHNcIjtcbmltcG9ydCB0eXBlIHsgRGlzY29yZEdhdGV3YXlQYXlsb2FkIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2dhdGV3YXkvZ2F0ZXdheV9wYXlsb2FkLnRzXCI7XG5pbXBvcnQgeyBzbm93Zmxha2VUb0JpZ2ludCB9IGZyb20gXCIuLi8uLi91dGlsL2JpZ2ludC50c1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlQ2hhbm5lbFBpbnNVcGRhdGUoZGF0YTogRGlzY29yZEdhdGV3YXlQYXlsb2FkKSB7XG4gIGNvbnN0IHBheWxvYWQgPSBkYXRhLmQgYXMgQ2hhbm5lbFBpbnNVcGRhdGU7XG5cbiAgY29uc3QgY2hhbm5lbCA9IGF3YWl0IGNhY2hlSGFuZGxlcnMuZ2V0KFxuICAgIFwiY2hhbm5lbHNcIixcbiAgICBzbm93Zmxha2VUb0JpZ2ludChwYXlsb2FkLmNoYW5uZWxJZCksXG4gICk7XG4gIGlmICghY2hhbm5lbCkgcmV0dXJuO1xuXG4gIGNvbnN0IGd1aWxkID0gcGF5bG9hZC5ndWlsZElkXG4gICAgPyBhd2FpdCBjYWNoZUhhbmRsZXJzLmdldChcImd1aWxkc1wiLCBzbm93Zmxha2VUb0JpZ2ludChwYXlsb2FkLmd1aWxkSWQpKVxuICAgIDogdW5kZWZpbmVkO1xuXG4gIGV2ZW50SGFuZGxlcnMuY2hhbm5lbFBpbnNVcGRhdGU/LihjaGFubmVsLCBndWlsZCwgcGF5bG9hZC5sYXN0UGluVGltZXN0YW1wKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxhQUFhLFNBQVEsWUFBYztTQUNuQyxhQUFhLFNBQVEsY0FBZ0I7U0FHckMsaUJBQWlCLFNBQVEsb0JBQXNCO3NCQUVsQyx1QkFBdUIsQ0FBQyxJQUEyQjtVQUNqRSxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUM7VUFFaEIsT0FBTyxTQUFTLGFBQWEsQ0FBQyxHQUFHLEVBQ3JDLFFBQVUsR0FDVixpQkFBaUIsQ0FBQyxPQUFPLENBQUMsU0FBUztTQUVoQyxPQUFPO1VBRU4sS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLFNBQ25CLGFBQWEsQ0FBQyxHQUFHLEVBQUMsTUFBUSxHQUFFLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxPQUFPLEtBQ25FLFNBQVM7SUFFYixhQUFhLENBQUMsaUJBQWlCLEdBQUcsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsZ0JBQWdCIn0=
