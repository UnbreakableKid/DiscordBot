import { eventHandlers } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { snowflakeToBigint } from "../../util/bigint.ts";
export async function handleThreadDelete(data) {
  const payload = data.d;
  const cachedChannel = await cacheHandlers.get(
    "channels",
    snowflakeToBigint(payload.id),
  );
  if (!cachedChannel) return;
  await cacheHandlers.delete("channels", snowflakeToBigint(payload.id));
  cacheHandlers.forEach("messages", (message) => {
    eventHandlers.debug?.(
      "loop",
      `Running forEach messages loop in CHANNEL_DELTE file.`,
    );
    if (message.channelId === snowflakeToBigint(payload.id)) {
      cacheHandlers.delete("messages", message.id);
    }
  });
  eventHandlers.threadDelete?.(cachedChannel);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hhbmRsZXJzL2NoYW5uZWxzL1RIUkVBRF9ERUxFVEUudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV2ZW50SGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vYm90LnRzXCI7XG5pbXBvcnQgeyBjYWNoZUhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyBDaGFubmVsIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2NoYW5uZWxzL2NoYW5uZWwudHNcIjtcbmltcG9ydCB7IERpc2NvcmRHYXRld2F5UGF5bG9hZCB9IGZyb20gXCIuLi8uLi90eXBlcy9nYXRld2F5L2dhdGV3YXlfcGF5bG9hZC50c1wiO1xuaW1wb3J0IHsgc25vd2ZsYWtlVG9CaWdpbnQgfSBmcm9tIFwiLi4vLi4vdXRpbC9iaWdpbnQudHNcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVRocmVhZERlbGV0ZShkYXRhOiBEaXNjb3JkR2F0ZXdheVBheWxvYWQpIHtcbiAgY29uc3QgcGF5bG9hZCA9IGRhdGEuZCBhcyBDaGFubmVsO1xuXG4gIGNvbnN0IGNhY2hlZENoYW5uZWwgPSBhd2FpdCBjYWNoZUhhbmRsZXJzLmdldChcbiAgICBcImNoYW5uZWxzXCIsXG4gICAgc25vd2ZsYWtlVG9CaWdpbnQocGF5bG9hZC5pZCksXG4gICk7XG4gIGlmICghY2FjaGVkQ2hhbm5lbCkgcmV0dXJuO1xuXG4gIGF3YWl0IGNhY2hlSGFuZGxlcnMuZGVsZXRlKFwiY2hhbm5lbHNcIiwgc25vd2ZsYWtlVG9CaWdpbnQocGF5bG9hZC5pZCkpO1xuICBjYWNoZUhhbmRsZXJzLmZvckVhY2goXCJtZXNzYWdlc1wiLCAobWVzc2FnZSkgPT4ge1xuICAgIGV2ZW50SGFuZGxlcnMuZGVidWc/LihcbiAgICAgIFwibG9vcFwiLFxuICAgICAgYFJ1bm5pbmcgZm9yRWFjaCBtZXNzYWdlcyBsb29wIGluIENIQU5ORUxfREVMVEUgZmlsZS5gLFxuICAgICk7XG4gICAgaWYgKG1lc3NhZ2UuY2hhbm5lbElkID09PSBzbm93Zmxha2VUb0JpZ2ludChwYXlsb2FkLmlkKSkge1xuICAgICAgY2FjaGVIYW5kbGVycy5kZWxldGUoXCJtZXNzYWdlc1wiLCBtZXNzYWdlLmlkKTtcbiAgICB9XG4gIH0pO1xuXG4gIGV2ZW50SGFuZGxlcnMudGhyZWFkRGVsZXRlPy4oY2FjaGVkQ2hhbm5lbCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsYUFBYSxTQUFRLFlBQWM7U0FDbkMsYUFBYSxTQUFRLGNBQWdCO1NBR3JDLGlCQUFpQixTQUFRLG9CQUFzQjtzQkFFbEMsa0JBQWtCLENBQUMsSUFBMkI7VUFDNUQsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDO1VBRWhCLGFBQWEsU0FBUyxhQUFhLENBQUMsR0FBRyxFQUMzQyxRQUFVLEdBQ1YsaUJBQWlCLENBQUMsT0FBTyxDQUFDLEVBQUU7U0FFekIsYUFBYTtVQUVaLGFBQWEsQ0FBQyxNQUFNLEVBQUMsUUFBVSxHQUFFLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxFQUFFO0lBQ25FLGFBQWEsQ0FBQyxPQUFPLEVBQUMsUUFBVSxJQUFHLE9BQU87UUFDeEMsYUFBYSxDQUFDLEtBQUssSUFDakIsSUFBTSxJQUNMLG9EQUFvRDtZQUVuRCxPQUFPLENBQUMsU0FBUyxLQUFLLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3BELGFBQWEsQ0FBQyxNQUFNLEVBQUMsUUFBVSxHQUFFLE9BQU8sQ0FBQyxFQUFFOzs7SUFJL0MsYUFBYSxDQUFDLFlBQVksR0FBRyxhQUFhIn0=