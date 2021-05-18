import { rest } from "../../rest/rest.ts";
import { endpoints } from "../../util/constants.ts";
/** This function will return the raw user payload in the rare cases you need to fetch a user directly from the API. */ export async function getUser(
  userId,
) {
  return await rest.runMethod("get", endpoints.USER(userId));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvbWlzYy9nZXRfdXNlci50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVzdCB9IGZyb20gXCIuLi8uLi9yZXN0L3Jlc3QudHNcIjtcbmltcG9ydCB0eXBlIHsgVXNlciB9IGZyb20gXCIuLi8uLi90eXBlcy91c2Vycy91c2VyLnRzXCI7XG5pbXBvcnQgeyBlbmRwb2ludHMgfSBmcm9tIFwiLi4vLi4vdXRpbC9jb25zdGFudHMudHNcIjtcblxuLyoqIFRoaXMgZnVuY3Rpb24gd2lsbCByZXR1cm4gdGhlIHJhdyB1c2VyIHBheWxvYWQgaW4gdGhlIHJhcmUgY2FzZXMgeW91IG5lZWQgdG8gZmV0Y2ggYSB1c2VyIGRpcmVjdGx5IGZyb20gdGhlIEFQSS4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRVc2VyKHVzZXJJZDogYmlnaW50KSB7XG4gIHJldHVybiBhd2FpdCByZXN0LnJ1bk1ldGhvZDxVc2VyPihcImdldFwiLCBlbmRwb2ludHMuVVNFUih1c2VySWQpKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxJQUFJLFNBQVEsa0JBQW9CO1NBRWhDLFNBQVMsU0FBUSx1QkFBeUI7QUFFbkQsRUFBdUgsQUFBdkgsbUhBQXVILEFBQXZILEVBQXVILHVCQUNqRyxPQUFPLENBQUMsTUFBYztpQkFDN0IsSUFBSSxDQUFDLFNBQVMsRUFBTyxHQUFLLEdBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNIn0=
