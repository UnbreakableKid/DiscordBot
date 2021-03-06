import { botId } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { rest } from "../../rest/rest.ts";
import { structures } from "../../structures/mod.ts";
import { endpoints } from "../../util/constants.ts";
import { getMember } from "../members/get_member.ts";
/** Create a new guild. Returns a guild object on success. Fires a Guild Create Gateway event. This endpoint can be used only by bots in less than 10 guilds. */ export async function createGuild(
  options,
) {
  const result = await rest.runMethod("post", endpoints.GUILDS, options);
  const guild = await structures.createDiscordenoGuild(result, 0);
  // MANUALLY CACHE THE GUILD
  await cacheHandlers.set("guilds", guild.id, guild);
  // MANUALLY CACHE THE BOT
  await getMember(guild.id, botId);
  return guild;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvZ3VpbGRzL2NyZWF0ZV9ndWlsZC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYm90SWQgfSBmcm9tIFwiLi4vLi4vYm90LnRzXCI7XG5pbXBvcnQgeyBjYWNoZUhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHsgc3RydWN0dXJlcyB9IGZyb20gXCIuLi8uLi9zdHJ1Y3R1cmVzL21vZC50c1wiO1xuaW1wb3J0IHR5cGUgeyBDcmVhdGVHdWlsZCB9IGZyb20gXCIuLi8uLi90eXBlcy9ndWlsZHMvY3JlYXRlX2d1aWxkLnRzXCI7XG5pbXBvcnQgdHlwZSB7IEd1aWxkIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2d1aWxkcy9ndWlsZC50c1wiO1xuaW1wb3J0IHsgZW5kcG9pbnRzIH0gZnJvbSBcIi4uLy4uL3V0aWwvY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyBnZXRNZW1iZXIgfSBmcm9tIFwiLi4vbWVtYmVycy9nZXRfbWVtYmVyLnRzXCI7XG5cbi8qKiBDcmVhdGUgYSBuZXcgZ3VpbGQuIFJldHVybnMgYSBndWlsZCBvYmplY3Qgb24gc3VjY2Vzcy4gRmlyZXMgYSBHdWlsZCBDcmVhdGUgR2F0ZXdheSBldmVudC4gVGhpcyBlbmRwb2ludCBjYW4gYmUgdXNlZCBvbmx5IGJ5IGJvdHMgaW4gbGVzcyB0aGFuIDEwIGd1aWxkcy4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVHdWlsZChvcHRpb25zOiBDcmVhdGVHdWlsZCkge1xuICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXN0LnJ1bk1ldGhvZDxHdWlsZD4oXG4gICAgXCJwb3N0XCIsXG4gICAgZW5kcG9pbnRzLkdVSUxEUyxcbiAgICBvcHRpb25zLFxuICApO1xuXG4gIGNvbnN0IGd1aWxkID0gYXdhaXQgc3RydWN0dXJlcy5jcmVhdGVEaXNjb3JkZW5vR3VpbGQocmVzdWx0LCAwKTtcbiAgLy8gTUFOVUFMTFkgQ0FDSEUgVEhFIEdVSUxEXG4gIGF3YWl0IGNhY2hlSGFuZGxlcnMuc2V0KFwiZ3VpbGRzXCIsIGd1aWxkLmlkLCBndWlsZCk7XG4gIC8vIE1BTlVBTExZIENBQ0hFIFRIRSBCT1RcbiAgYXdhaXQgZ2V0TWVtYmVyKGd1aWxkLmlkLCBib3RJZCk7XG5cbiAgcmV0dXJuIGd1aWxkO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLEtBQUssU0FBUSxZQUFjO1NBQzNCLGFBQWEsU0FBUSxjQUFnQjtTQUNyQyxJQUFJLFNBQVEsa0JBQW9CO1NBQ2hDLFVBQVUsU0FBUSx1QkFBeUI7U0FHM0MsU0FBUyxTQUFRLHVCQUF5QjtTQUMxQyxTQUFTLFNBQVEsd0JBQTBCO0FBRXBELEVBQWdLLEFBQWhLLDRKQUFnSyxBQUFoSyxFQUFnSyx1QkFDMUksV0FBVyxDQUFDLE9BQW9CO1VBQzlDLE1BQU0sU0FBUyxJQUFJLENBQUMsU0FBUyxFQUNqQyxJQUFNLEdBQ04sU0FBUyxDQUFDLE1BQU0sRUFDaEIsT0FBTztVQUdILEtBQUssU0FBUyxVQUFVLENBQUMscUJBQXFCLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDOUQsRUFBMkIsQUFBM0IseUJBQTJCO1VBQ3JCLGFBQWEsQ0FBQyxHQUFHLEVBQUMsTUFBUSxHQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSztJQUNqRCxFQUF5QixBQUF6Qix1QkFBeUI7VUFDbkIsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSztXQUV4QixLQUFLIn0=
