import { rest } from "../../rest/rest.ts";
import { Collection } from "../../util/collection.ts";
import { endpoints } from "../../util/constants.ts";
/** Returns an array of discovery category objects that can be used when editing guilds */ export async function getDiscoveryCategories() {
  const result = await rest.runMethod("get", endpoints.DISCOVERY_CATEGORIES);
  return new Collection(result.map((category) => [
    category.id,
    category,
  ]));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvZGlzY292ZXJ5L2dldF9kaXNjb3ZlcnlfY2F0ZWdvcmllcy50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVzdCB9IGZyb20gXCIuLi8uLi9yZXN0L3Jlc3QudHNcIjtcbmltcG9ydCB0eXBlIHsgRGlzY292ZXJ5Q2F0ZWdvcnkgfSBmcm9tIFwiLi4vLi4vdHlwZXMvZGlzY292ZXJ5L2Rpc2NvdmVyeV9jYXRlZ29yeS50c1wiO1xuaW1wb3J0IHsgQ29sbGVjdGlvbiB9IGZyb20gXCIuLi8uLi91dGlsL2NvbGxlY3Rpb24udHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuXG4vKiogUmV0dXJucyBhbiBhcnJheSBvZiBkaXNjb3ZlcnkgY2F0ZWdvcnkgb2JqZWN0cyB0aGF0IGNhbiBiZSB1c2VkIHdoZW4gZWRpdGluZyBndWlsZHMgKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXREaXNjb3ZlcnlDYXRlZ29yaWVzKCkge1xuICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXN0LnJ1bk1ldGhvZDxEaXNjb3ZlcnlDYXRlZ29yeVtdPihcbiAgICBcImdldFwiLFxuICAgIGVuZHBvaW50cy5ESVNDT1ZFUllfQ0FURUdPUklFUyxcbiAgKTtcblxuICByZXR1cm4gbmV3IENvbGxlY3Rpb248bnVtYmVyLCBEaXNjb3ZlcnlDYXRlZ29yeT4oXG4gICAgcmVzdWx0Lm1hcChcbiAgICAgIChjYXRlZ29yeSkgPT4gW2NhdGVnb3J5LmlkLCBjYXRlZ29yeV0sXG4gICAgKSxcbiAgKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxJQUFJLFNBQVEsa0JBQW9CO1NBRWhDLFVBQVUsU0FBUSx3QkFBMEI7U0FDNUMsU0FBUyxTQUFRLHVCQUF5QjtBQUVuRCxFQUEwRixBQUExRixzRkFBMEYsQUFBMUYsRUFBMEYsdUJBQ3BFLHNCQUFzQjtVQUNwQyxNQUFNLFNBQVMsSUFBSSxDQUFDLFNBQVMsRUFDakMsR0FBSyxHQUNMLFNBQVMsQ0FBQyxvQkFBb0I7ZUFHckIsVUFBVSxDQUNuQixNQUFNLENBQUMsR0FBRyxFQUNQLFFBQVE7WUFBTSxRQUFRLENBQUMsRUFBRTtZQUFFLFFBQVEifQ==
