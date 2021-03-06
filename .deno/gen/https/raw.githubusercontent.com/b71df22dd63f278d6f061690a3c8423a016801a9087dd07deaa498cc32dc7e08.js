import { rest } from "../../rest/rest.ts";
import { Collection } from "../../util/collection.ts";
import { endpoints } from "../../util/constants.ts";
/** Returns a list of voice region objects for the guild. Unlike the similar /voice route, this returns VIP servers when the guild is VIP-enabled. */ export async function getVoiceRegions(
  guildId,
) {
  const result = await rest.runMethod("get", endpoints.GUILD_REGIONS(guildId));
  return new Collection(result.map((region) => [
    region.id,
    region,
  ]));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvZ3VpbGRzL2dldF92b2ljZV9yZWdpb25zLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHR5cGUgeyBWb2ljZVJlZ2lvbiB9IGZyb20gXCIuLi8uLi90eXBlcy92b2ljZS92b2ljZV9yZWdpb24udHNcIjtcbmltcG9ydCB7IENvbGxlY3Rpb24gfSBmcm9tIFwiLi4vLi4vdXRpbC9jb2xsZWN0aW9uLnRzXCI7XG5pbXBvcnQgeyBlbmRwb2ludHMgfSBmcm9tIFwiLi4vLi4vdXRpbC9jb25zdGFudHMudHNcIjtcblxuLyoqIFJldHVybnMgYSBsaXN0IG9mIHZvaWNlIHJlZ2lvbiBvYmplY3RzIGZvciB0aGUgZ3VpbGQuIFVubGlrZSB0aGUgc2ltaWxhciAvdm9pY2Ugcm91dGUsIHRoaXMgcmV0dXJucyBWSVAgc2VydmVycyB3aGVuIHRoZSBndWlsZCBpcyBWSVAtZW5hYmxlZC4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRWb2ljZVJlZ2lvbnMoZ3VpbGRJZDogYmlnaW50KSB7XG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlc3QucnVuTWV0aG9kPFZvaWNlUmVnaW9uW10+KFxuICAgIFwiZ2V0XCIsXG4gICAgZW5kcG9pbnRzLkdVSUxEX1JFR0lPTlMoZ3VpbGRJZCksXG4gICk7XG5cbiAgcmV0dXJuIG5ldyBDb2xsZWN0aW9uPHN0cmluZywgVm9pY2VSZWdpb24+KFxuICAgIHJlc3VsdC5tYXAoKHJlZ2lvbikgPT4gW3JlZ2lvbi5pZCwgcmVnaW9uXSksXG4gICk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsSUFBSSxTQUFRLGtCQUFvQjtTQUVoQyxVQUFVLFNBQVEsd0JBQTBCO1NBQzVDLFNBQVMsU0FBUSx1QkFBeUI7QUFFbkQsRUFBcUosQUFBckosaUpBQXFKLEFBQXJKLEVBQXFKLHVCQUMvSCxlQUFlLENBQUMsT0FBZTtVQUM3QyxNQUFNLFNBQVMsSUFBSSxDQUFDLFNBQVMsRUFDakMsR0FBSyxHQUNMLFNBQVMsQ0FBQyxhQUFhLENBQUMsT0FBTztlQUd0QixVQUFVLENBQ25CLE1BQU0sQ0FBQyxHQUFHLEVBQUUsTUFBTTtZQUFNLE1BQU0sQ0FBQyxFQUFFO1lBQUUsTUFBTSJ9
