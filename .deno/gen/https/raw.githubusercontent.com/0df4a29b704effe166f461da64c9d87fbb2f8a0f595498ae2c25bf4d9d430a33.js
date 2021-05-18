import { applicationId } from "../../../bot.ts";
import { rest } from "../../../rest/rest.ts";
import { endpoints } from "../../../util/constants.ts";
import { snakelize, validateSlashCommands } from "../../../util/utils.ts";
/**
 * There are two kinds of Slash Commands: global commands and guild commands. Global commands are available for every guild that adds your app; guild commands are specific to the guild you specify when making them. Command names are unique per application within each scope (global and guild). That means:
 *
 * - Your app **cannot** have two global commands with the same name
 * - Your app **cannot** have two guild commands within the same name **on the same guild**
 * - Your app **can** have a global and guild command with the same name
 * - Multiple apps **can** have commands with the same names
 *
 * Global commands are cached for **1 hour**. That means that new global commands will fan out slowly across all guilds, and will be guaranteed to be updated in an hour.
 * Guild commands update **instantly**. We recommend you use guild commands for quick testing, and global commands when they're ready for public use.
 */ export async function createSlashCommand(options, guildId) {
    validateSlashCommands([
        options
    ], true);
    return await rest.runMethod("post", guildId ? endpoints.COMMANDS_GUILD(applicationId, guildId) : endpoints.COMMANDS(applicationId), snakelize(options));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvaW50ZXJhY3Rpb25zL2NvbW1hbmRzL2NyZWF0ZV9zbGFzaF9jb21tYW5kLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBhcHBsaWNhdGlvbklkIH0gZnJvbSBcIi4uLy4uLy4uL2JvdC50c1wiO1xuaW1wb3J0IHsgcmVzdCB9IGZyb20gXCIuLi8uLi8uLi9yZXN0L3Jlc3QudHNcIjtcbmltcG9ydCB0eXBlIHsgQXBwbGljYXRpb25Db21tYW5kIH0gZnJvbSBcIi4uLy4uLy4uL3R5cGVzL2ludGVyYWN0aW9ucy9jb21tYW5kcy9hcHBsaWNhdGlvbl9jb21tYW5kLnRzXCI7XG5pbXBvcnQgdHlwZSB7IENyZWF0ZUdsb2JhbEFwcGxpY2F0aW9uQ29tbWFuZCB9IGZyb20gXCIuLi8uLi8uLi90eXBlcy9pbnRlcmFjdGlvbnMvY29tbWFuZHMvY3JlYXRlX2dsb2JhbF9hcHBsaWNhdGlvbl9jb21tYW5kLnRzXCI7XG5pbXBvcnQgeyBlbmRwb2ludHMgfSBmcm9tIFwiLi4vLi4vLi4vdXRpbC9jb25zdGFudHMudHNcIjtcbmltcG9ydCB7IHNuYWtlbGl6ZSwgdmFsaWRhdGVTbGFzaENvbW1hbmRzIH0gZnJvbSBcIi4uLy4uLy4uL3V0aWwvdXRpbHMudHNcIjtcblxuLyoqXG4gKiBUaGVyZSBhcmUgdHdvIGtpbmRzIG9mIFNsYXNoIENvbW1hbmRzOiBnbG9iYWwgY29tbWFuZHMgYW5kIGd1aWxkIGNvbW1hbmRzLiBHbG9iYWwgY29tbWFuZHMgYXJlIGF2YWlsYWJsZSBmb3IgZXZlcnkgZ3VpbGQgdGhhdCBhZGRzIHlvdXIgYXBwOyBndWlsZCBjb21tYW5kcyBhcmUgc3BlY2lmaWMgdG8gdGhlIGd1aWxkIHlvdSBzcGVjaWZ5IHdoZW4gbWFraW5nIHRoZW0uIENvbW1hbmQgbmFtZXMgYXJlIHVuaXF1ZSBwZXIgYXBwbGljYXRpb24gd2l0aGluIGVhY2ggc2NvcGUgKGdsb2JhbCBhbmQgZ3VpbGQpLiBUaGF0IG1lYW5zOlxuICpcbiAqIC0gWW91ciBhcHAgKipjYW5ub3QqKiBoYXZlIHR3byBnbG9iYWwgY29tbWFuZHMgd2l0aCB0aGUgc2FtZSBuYW1lXG4gKiAtIFlvdXIgYXBwICoqY2Fubm90KiogaGF2ZSB0d28gZ3VpbGQgY29tbWFuZHMgd2l0aGluIHRoZSBzYW1lIG5hbWUgKipvbiB0aGUgc2FtZSBndWlsZCoqXG4gKiAtIFlvdXIgYXBwICoqY2FuKiogaGF2ZSBhIGdsb2JhbCBhbmQgZ3VpbGQgY29tbWFuZCB3aXRoIHRoZSBzYW1lIG5hbWVcbiAqIC0gTXVsdGlwbGUgYXBwcyAqKmNhbioqIGhhdmUgY29tbWFuZHMgd2l0aCB0aGUgc2FtZSBuYW1lc1xuICpcbiAqIEdsb2JhbCBjb21tYW5kcyBhcmUgY2FjaGVkIGZvciAqKjEgaG91cioqLiBUaGF0IG1lYW5zIHRoYXQgbmV3IGdsb2JhbCBjb21tYW5kcyB3aWxsIGZhbiBvdXQgc2xvd2x5IGFjcm9zcyBhbGwgZ3VpbGRzLCBhbmQgd2lsbCBiZSBndWFyYW50ZWVkIHRvIGJlIHVwZGF0ZWQgaW4gYW4gaG91ci5cbiAqIEd1aWxkIGNvbW1hbmRzIHVwZGF0ZSAqKmluc3RhbnRseSoqLiBXZSByZWNvbW1lbmQgeW91IHVzZSBndWlsZCBjb21tYW5kcyBmb3IgcXVpY2sgdGVzdGluZywgYW5kIGdsb2JhbCBjb21tYW5kcyB3aGVuIHRoZXkncmUgcmVhZHkgZm9yIHB1YmxpYyB1c2UuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVTbGFzaENvbW1hbmQoXG4gIG9wdGlvbnM6IENyZWF0ZUdsb2JhbEFwcGxpY2F0aW9uQ29tbWFuZCxcbiAgZ3VpbGRJZD86IGJpZ2ludCxcbikge1xuICB2YWxpZGF0ZVNsYXNoQ29tbWFuZHMoW29wdGlvbnNdLCB0cnVlKTtcblxuICByZXR1cm4gYXdhaXQgcmVzdC5ydW5NZXRob2Q8QXBwbGljYXRpb25Db21tYW5kPihcbiAgICBcInBvc3RcIixcbiAgICBndWlsZElkXG4gICAgICA/IGVuZHBvaW50cy5DT01NQU5EU19HVUlMRChhcHBsaWNhdGlvbklkLCBndWlsZElkKVxuICAgICAgOiBlbmRwb2ludHMuQ09NTUFORFMoYXBwbGljYXRpb25JZCksXG4gICAgc25ha2VsaXplKG9wdGlvbnMpLFxuICApO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLGFBQWEsU0FBUSxlQUFpQjtTQUN0QyxJQUFJLFNBQVEscUJBQXVCO1NBR25DLFNBQVMsU0FBUSwwQkFBNEI7U0FDN0MsU0FBUyxFQUFFLHFCQUFxQixTQUFRLHNCQUF3QjtBQUV6RSxFQVVHLEFBVkg7Ozs7Ozs7Ozs7Q0FVRyxBQVZILEVBVUcsdUJBQ21CLGtCQUFrQixDQUN0QyxPQUF1QyxFQUN2QyxPQUFnQjtJQUVoQixxQkFBcUI7UUFBRSxPQUFPO09BQUcsSUFBSTtpQkFFeEIsSUFBSSxDQUFDLFNBQVMsRUFDekIsSUFBTSxHQUNOLE9BQU8sR0FDSCxTQUFTLENBQUMsY0FBYyxDQUFDLGFBQWEsRUFBRSxPQUFPLElBQy9DLFNBQVMsQ0FBQyxRQUFRLENBQUMsYUFBYSxHQUNwQyxTQUFTLENBQUMsT0FBTyJ9