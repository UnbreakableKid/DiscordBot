import { applicationId } from "../../../bot.ts";
import { rest } from "../../../rest/rest.ts";
import { endpoints } from "../../../util/constants.ts";
/** Fetches command permissions for all commands for your application in a guild. Returns an array of GuildApplicationCommandPermissions objects. */ export async function getSlashCommandPermissions(
  guildId,
) {
  return await rest.runMethod(
    "get",
    endpoints.COMMANDS_PERMISSIONS(applicationId, guildId),
  );
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvaW50ZXJhY3Rpb25zL2NvbW1hbmRzL2dldF9zbGFzaF9jb21tYW5kX3Blcm1pc3Npb25zLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBhcHBsaWNhdGlvbklkIH0gZnJvbSBcIi4uLy4uLy4uL2JvdC50c1wiO1xuaW1wb3J0IHsgcmVzdCB9IGZyb20gXCIuLi8uLi8uLi9yZXN0L3Jlc3QudHNcIjtcbmltcG9ydCB0eXBlIHsgR3VpbGRBcHBsaWNhdGlvbkNvbW1hbmRQZXJtaXNzaW9ucyB9IGZyb20gXCIuLi8uLi8uLi90eXBlcy9pbnRlcmFjdGlvbnMvY29tbWFuZHMvZ3VpbGRfYXBwbGljYXRpb25fY29tbWFuZF9wZXJtaXNzaW9ucy50c1wiO1xuaW1wb3J0IHsgZW5kcG9pbnRzIH0gZnJvbSBcIi4uLy4uLy4uL3V0aWwvY29uc3RhbnRzLnRzXCI7XG5cbi8qKiBGZXRjaGVzIGNvbW1hbmQgcGVybWlzc2lvbnMgZm9yIGFsbCBjb21tYW5kcyBmb3IgeW91ciBhcHBsaWNhdGlvbiBpbiBhIGd1aWxkLiBSZXR1cm5zIGFuIGFycmF5IG9mIEd1aWxkQXBwbGljYXRpb25Db21tYW5kUGVybWlzc2lvbnMgb2JqZWN0cy4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRTbGFzaENvbW1hbmRQZXJtaXNzaW9ucyhndWlsZElkOiBiaWdpbnQpIHtcbiAgcmV0dXJuIGF3YWl0IHJlc3QucnVuTWV0aG9kPEd1aWxkQXBwbGljYXRpb25Db21tYW5kUGVybWlzc2lvbnNbXT4oXG4gICAgXCJnZXRcIixcbiAgICBlbmRwb2ludHMuQ09NTUFORFNfUEVSTUlTU0lPTlMoYXBwbGljYXRpb25JZCwgZ3VpbGRJZCksXG4gICk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsYUFBYSxTQUFRLGVBQWlCO1NBQ3RDLElBQUksU0FBUSxxQkFBdUI7U0FFbkMsU0FBUyxTQUFRLDBCQUE0QjtBQUV0RCxFQUFvSixBQUFwSixnSkFBb0osQUFBcEosRUFBb0osdUJBQzlILDBCQUEwQixDQUFDLE9BQWU7aUJBQ2pELElBQUksQ0FBQyxTQUFTLEVBQ3pCLEdBQUssR0FDTCxTQUFTLENBQUMsb0JBQW9CLENBQUMsYUFBYSxFQUFFLE9BQU8ifQ==