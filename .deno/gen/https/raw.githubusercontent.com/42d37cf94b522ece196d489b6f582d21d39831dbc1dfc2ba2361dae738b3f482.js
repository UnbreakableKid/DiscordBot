import { DiscordBitwisePermissionFlags } from "../../types/permissions/bitwise_permission_flags.ts";
/** Checks if a channel overwrite for a user id or a role id has permission in this channel */ export function channelOverwriteHasPermission(
  guildId,
  id,
  overwrites,
  permissions,
) {
  const overwrite = overwrites.find((perm) => perm.id === id) ||
    overwrites.find((perm) => perm.id === guildId);
  if (!overwrite) return false;
  return permissions.every((perm) => {
    const allowBits = overwrite.allow;
    const denyBits = overwrite.deny;
    if (BigInt(denyBits) & BigInt(DiscordBitwisePermissionFlags[perm])) {
      return false;
    }
    if (BigInt(allowBits) & BigInt(DiscordBitwisePermissionFlags[perm])) {
      return true;
    }
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvY2hhbm5lbHMvY2hhbm5lbF9vdmVyd3JpdGVfaGFzX3Blcm1pc3Npb24udHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgRGlzY29yZE92ZXJ3cml0ZSB9IGZyb20gXCIuLi8uLi90eXBlcy9jaGFubmVscy9vdmVyd3JpdGUudHNcIjtcbmltcG9ydCB7IERpc2NvcmRCaXR3aXNlUGVybWlzc2lvbkZsYWdzIH0gZnJvbSBcIi4uLy4uL3R5cGVzL3Blcm1pc3Npb25zL2JpdHdpc2VfcGVybWlzc2lvbl9mbGFncy50c1wiO1xuaW1wb3J0IHR5cGUgeyBQZXJtaXNzaW9uU3RyaW5ncyB9IGZyb20gXCIuLi8uLi90eXBlcy9wZXJtaXNzaW9ucy9wZXJtaXNzaW9uX3N0cmluZ3MudHNcIjtcblxuLyoqIENoZWNrcyBpZiBhIGNoYW5uZWwgb3ZlcndyaXRlIGZvciBhIHVzZXIgaWQgb3IgYSByb2xlIGlkIGhhcyBwZXJtaXNzaW9uIGluIHRoaXMgY2hhbm5lbCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoYW5uZWxPdmVyd3JpdGVIYXNQZXJtaXNzaW9uKFxuICBndWlsZElkOiBiaWdpbnQsXG4gIGlkOiBiaWdpbnQsXG4gIG92ZXJ3cml0ZXM6IChPbWl0PERpc2NvcmRPdmVyd3JpdGUsIFwiaWRcIiB8IFwiYWxsb3dcIiB8IFwiZGVueVwiPiAmIHtcbiAgICBpZDogYmlnaW50O1xuICAgIGFsbG93OiBiaWdpbnQ7XG4gICAgZGVueTogYmlnaW50O1xuICB9KVtdLFxuICBwZXJtaXNzaW9uczogUGVybWlzc2lvblN0cmluZ3NbXSxcbikge1xuICBjb25zdCBvdmVyd3JpdGUgPSBvdmVyd3JpdGVzLmZpbmQoKHBlcm0pID0+IHBlcm0uaWQgPT09IGlkKSB8fFxuICAgIG92ZXJ3cml0ZXMuZmluZCgocGVybSkgPT4gcGVybS5pZCA9PT0gZ3VpbGRJZCk7XG5cbiAgaWYgKCFvdmVyd3JpdGUpIHJldHVybiBmYWxzZTtcblxuICByZXR1cm4gcGVybWlzc2lvbnMuZXZlcnkoKHBlcm0pID0+IHtcbiAgICBjb25zdCBhbGxvd0JpdHMgPSBvdmVyd3JpdGUuYWxsb3c7XG4gICAgY29uc3QgZGVueUJpdHMgPSBvdmVyd3JpdGUuZGVueTtcbiAgICBpZiAoXG4gICAgICBCaWdJbnQoZGVueUJpdHMpICYgQmlnSW50KERpc2NvcmRCaXR3aXNlUGVybWlzc2lvbkZsYWdzW3Blcm1dKVxuICAgICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICBCaWdJbnQoYWxsb3dCaXRzKSAmIEJpZ0ludChEaXNjb3JkQml0d2lzZVBlcm1pc3Npb25GbGFnc1twZXJtXSlcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQ1MsNkJBQTZCLFNBQVEsbURBQXFEO0FBR25HLEVBQThGLEFBQTlGLDBGQUE4RixBQUE5RixFQUE4RixpQkFDOUUsNkJBQTZCLENBQzNDLE9BQWUsRUFDZixFQUFVLEVBQ1YsVUFJSSxFQUNKLFdBQWdDO1VBRTFCLFNBQVMsR0FBRyxVQUFVLENBQUMsSUFBSSxFQUFFLElBQUksR0FBSyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUU7U0FDeEQsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLEdBQUssSUFBSSxDQUFDLEVBQUUsS0FBSyxPQUFPOztTQUUxQyxTQUFTLFNBQVMsS0FBSztXQUVyQixXQUFXLENBQUMsS0FBSyxFQUFFLElBQUk7Y0FDdEIsU0FBUyxHQUFHLFNBQVMsQ0FBQyxLQUFLO2NBQzNCLFFBQVEsR0FBRyxTQUFTLENBQUMsSUFBSTtZQUU3QixNQUFNLENBQUMsUUFBUSxJQUFJLE1BQU0sQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJO21CQUVyRCxLQUFLOztZQUdaLE1BQU0sQ0FBQyxTQUFTLElBQUksTUFBTSxDQUFDLDZCQUE2QixDQUFDLElBQUk7bUJBRXRELElBQUkifQ==
