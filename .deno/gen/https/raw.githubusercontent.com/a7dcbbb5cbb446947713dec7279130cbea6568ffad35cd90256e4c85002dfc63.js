import { applicationId } from "../../../bot.ts";
import { rest } from "../../../rest/rest.ts";
import { endpoints } from "../../../util/constants.ts";
import { validateSlashCommands } from "../../../util/utils.ts";
/**
 * Bulk edit existing slash commands. If a command does not exist, it will create it.
 *
 * **NOTE:** Any slash commands that are not specified in this function will be **deleted**. If you don't provide the commandId and rename your command, the command gets a new Id.
 */ export async function upsertSlashCommands(options, guildId) {
  validateSlashCommands(options);
  return await rest.runMethod(
    "put",
    guildId
      ? endpoints.COMMANDS_GUILD(applicationId, guildId)
      : endpoints.COMMANDS(applicationId),
    options,
  );
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvaW50ZXJhY3Rpb25zL2NvbW1hbmRzL3Vwc2VydF9zbGFzaF9jb21tYW5kcy50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYXBwbGljYXRpb25JZCB9IGZyb20gXCIuLi8uLi8uLi9ib3QudHNcIjtcbmltcG9ydCB7IHJlc3QgfSBmcm9tIFwiLi4vLi4vLi4vcmVzdC9yZXN0LnRzXCI7XG5pbXBvcnQgdHlwZSB7IEFwcGxpY2F0aW9uQ29tbWFuZCB9IGZyb20gXCIuLi8uLi8uLi90eXBlcy9pbnRlcmFjdGlvbnMvY29tbWFuZHMvYXBwbGljYXRpb25fY29tbWFuZC50c1wiO1xuaW1wb3J0IHR5cGUgeyBFZGl0R2xvYmFsQXBwbGljYXRpb25Db21tYW5kIH0gZnJvbSBcIi4uLy4uLy4uL3R5cGVzL2ludGVyYWN0aW9ucy9jb21tYW5kcy9lZGl0X2dsb2JhbF9hcHBsaWNhdGlvbl9jb21tYW5kLnRzXCI7XG5pbXBvcnQgeyBlbmRwb2ludHMgfSBmcm9tIFwiLi4vLi4vLi4vdXRpbC9jb25zdGFudHMudHNcIjtcbmltcG9ydCB7IHZhbGlkYXRlU2xhc2hDb21tYW5kcyB9IGZyb20gXCIuLi8uLi8uLi91dGlsL3V0aWxzLnRzXCI7XG5cbi8qKlxuICogQnVsayBlZGl0IGV4aXN0aW5nIHNsYXNoIGNvbW1hbmRzLiBJZiBhIGNvbW1hbmQgZG9lcyBub3QgZXhpc3QsIGl0IHdpbGwgY3JlYXRlIGl0LlxuICpcbiAqICoqTk9URToqKiBBbnkgc2xhc2ggY29tbWFuZHMgdGhhdCBhcmUgbm90IHNwZWNpZmllZCBpbiB0aGlzIGZ1bmN0aW9uIHdpbGwgYmUgKipkZWxldGVkKiouIElmIHlvdSBkb24ndCBwcm92aWRlIHRoZSBjb21tYW5kSWQgYW5kIHJlbmFtZSB5b3VyIGNvbW1hbmQsIHRoZSBjb21tYW5kIGdldHMgYSBuZXcgSWQuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cHNlcnRTbGFzaENvbW1hbmRzKFxuICBvcHRpb25zOiBFZGl0R2xvYmFsQXBwbGljYXRpb25Db21tYW5kW10sXG4gIGd1aWxkSWQ/OiBiaWdpbnQsXG4pIHtcbiAgdmFsaWRhdGVTbGFzaENvbW1hbmRzKG9wdGlvbnMpO1xuXG4gIHJldHVybiBhd2FpdCByZXN0LnJ1bk1ldGhvZDxBcHBsaWNhdGlvbkNvbW1hbmRbXT4oXG4gICAgXCJwdXRcIixcbiAgICBndWlsZElkXG4gICAgICA/IGVuZHBvaW50cy5DT01NQU5EU19HVUlMRChhcHBsaWNhdGlvbklkLCBndWlsZElkKVxuICAgICAgOiBlbmRwb2ludHMuQ09NTUFORFMoYXBwbGljYXRpb25JZCksXG4gICAgb3B0aW9ucyxcbiAgKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxhQUFhLFNBQVEsZUFBaUI7U0FDdEMsSUFBSSxTQUFRLHFCQUF1QjtTQUduQyxTQUFTLFNBQVEsMEJBQTRCO1NBQzdDLHFCQUFxQixTQUFRLHNCQUF3QjtBQUU5RCxFQUlHLEFBSkg7Ozs7Q0FJRyxBQUpILEVBSUcsdUJBQ21CLG1CQUFtQixDQUN2QyxPQUF1QyxFQUN2QyxPQUFnQjtJQUVoQixxQkFBcUIsQ0FBQyxPQUFPO2lCQUVoQixJQUFJLENBQUMsU0FBUyxFQUN6QixHQUFLLEdBQ0wsT0FBTyxHQUNILFNBQVMsQ0FBQyxjQUFjLENBQUMsYUFBYSxFQUFFLE9BQU8sSUFDL0MsU0FBUyxDQUFDLFFBQVEsQ0FBQyxhQUFhLEdBQ3BDLE9BQU8ifQ==