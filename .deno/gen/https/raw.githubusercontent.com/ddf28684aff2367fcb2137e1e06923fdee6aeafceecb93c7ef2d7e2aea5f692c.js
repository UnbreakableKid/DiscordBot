import { cacheHandlers } from "../../cache.ts";
import { rest } from "../../rest/rest.ts";
import { structures } from "../../structures/mod.ts";
import { Collection } from "../../util/collection.ts";
import { endpoints } from "../../util/constants.ts";
/** Returns a list of guild channel objects.
 *
 * ⚠️ **If you need this, you are probably doing something wrong. This is not intended for use. Your channels will be cached in your guild.**
 */ export async function getChannels(guildId, addToCache = true) {
  const result = await rest.runMethod("get", endpoints.GUILD_CHANNELS(guildId));
  return new Collection((await Promise.all(result.map(async (res) => {
    const discordenoChannel = await structures.createDiscordenoChannel(
      res,
      guildId,
    );
    if (addToCache) {
      await cacheHandlers.set(
        "channels",
        discordenoChannel.id,
        discordenoChannel,
      );
    }
    return discordenoChannel;
  }))).map((c) => [
    c.id,
    c,
  ]));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvY2hhbm5lbHMvZ2V0X2NoYW5uZWxzLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjYWNoZUhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHsgc3RydWN0dXJlcyB9IGZyb20gXCIuLi8uLi9zdHJ1Y3R1cmVzL21vZC50c1wiO1xuaW1wb3J0IHR5cGUgeyBDaGFubmVsIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2NoYW5uZWxzL2NoYW5uZWwudHNcIjtcbmltcG9ydCB7IENvbGxlY3Rpb24gfSBmcm9tIFwiLi4vLi4vdXRpbC9jb2xsZWN0aW9uLnRzXCI7XG5pbXBvcnQgeyBlbmRwb2ludHMgfSBmcm9tIFwiLi4vLi4vdXRpbC9jb25zdGFudHMudHNcIjtcblxuLyoqIFJldHVybnMgYSBsaXN0IG9mIGd1aWxkIGNoYW5uZWwgb2JqZWN0cy5cbiAqXG4gKiDimqDvuI8gKipJZiB5b3UgbmVlZCB0aGlzLCB5b3UgYXJlIHByb2JhYmx5IGRvaW5nIHNvbWV0aGluZyB3cm9uZy4gVGhpcyBpcyBub3QgaW50ZW5kZWQgZm9yIHVzZS4gWW91ciBjaGFubmVscyB3aWxsIGJlIGNhY2hlZCBpbiB5b3VyIGd1aWxkLioqXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDaGFubmVscyhndWlsZElkOiBiaWdpbnQsIGFkZFRvQ2FjaGUgPSB0cnVlKSB7XG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlc3QucnVuTWV0aG9kPENoYW5uZWxbXT4oXG4gICAgXCJnZXRcIixcbiAgICBlbmRwb2ludHMuR1VJTERfQ0hBTk5FTFMoZ3VpbGRJZCksXG4gICk7XG5cbiAgcmV0dXJuIG5ldyBDb2xsZWN0aW9uKFxuICAgIChcbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICByZXN1bHQubWFwKGFzeW5jIChyZXMpID0+IHtcbiAgICAgICAgICBjb25zdCBkaXNjb3JkZW5vQ2hhbm5lbCA9IGF3YWl0IHN0cnVjdHVyZXMuY3JlYXRlRGlzY29yZGVub0NoYW5uZWwoXG4gICAgICAgICAgICByZXMsXG4gICAgICAgICAgICBndWlsZElkLFxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKGFkZFRvQ2FjaGUpIHtcbiAgICAgICAgICAgIGF3YWl0IGNhY2hlSGFuZGxlcnMuc2V0KFxuICAgICAgICAgICAgICBcImNoYW5uZWxzXCIsXG4gICAgICAgICAgICAgIGRpc2NvcmRlbm9DaGFubmVsLmlkLFxuICAgICAgICAgICAgICBkaXNjb3JkZW5vQ2hhbm5lbCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGRpc2NvcmRlbm9DaGFubmVsO1xuICAgICAgICB9KSxcbiAgICAgIClcbiAgICApLm1hcCgoYykgPT4gW2MuaWQsIGNdKSxcbiAgKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxhQUFhLFNBQVEsY0FBZ0I7U0FDckMsSUFBSSxTQUFRLGtCQUFvQjtTQUNoQyxVQUFVLFNBQVEsdUJBQXlCO1NBRTNDLFVBQVUsU0FBUSx3QkFBMEI7U0FDNUMsU0FBUyxTQUFRLHVCQUF5QjtBQUVuRCxFQUdHLEFBSEg7OztDQUdHLEFBSEgsRUFHRyx1QkFDbUIsV0FBVyxDQUFDLE9BQWUsRUFBRSxVQUFVLEdBQUcsSUFBSTtVQUM1RCxNQUFNLFNBQVMsSUFBSSxDQUFDLFNBQVMsRUFDakMsR0FBSyxHQUNMLFNBQVMsQ0FBQyxjQUFjLENBQUMsT0FBTztlQUd2QixVQUFVLFFBRVgsT0FBTyxDQUFDLEdBQUcsQ0FDZixNQUFNLENBQUMsR0FBRyxRQUFRLEdBQUc7Y0FDYixpQkFBaUIsU0FBUyxVQUFVLENBQUMsdUJBQXVCLENBQ2hFLEdBQUcsRUFDSCxPQUFPO1lBRUwsVUFBVTtrQkFDTixhQUFhLENBQUMsR0FBRyxFQUNyQixRQUFVLEdBQ1YsaUJBQWlCLENBQUMsRUFBRSxFQUNwQixpQkFBaUI7O2VBSWQsaUJBQWlCO1NBRzVCLEdBQUcsRUFBRSxDQUFDO1lBQU0sQ0FBQyxDQUFDLEVBQUU7WUFBRSxDQUFDIn0=
