import { rest } from "../../rest/rest.ts";
import { endpoints } from "../../util/constants.ts";
/** Returns the guild preview object for the given id. If the bot is not in the guild, then the guild must be Discoverable. */ export async function getGuildPreview(
  guildId,
) {
  return await rest.runMethod("get", endpoints.GUILD_PREVIEW(guildId));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvZ3VpbGRzL2dldF9ndWlsZF9wcmV2aWV3LnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHR5cGUgeyBHdWlsZFByZXZpZXcgfSBmcm9tIFwiLi4vLi4vdHlwZXMvZ3VpbGRzL2d1aWxkX3ByZXZpZXcudHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuXG4vKiogUmV0dXJucyB0aGUgZ3VpbGQgcHJldmlldyBvYmplY3QgZm9yIHRoZSBnaXZlbiBpZC4gSWYgdGhlIGJvdCBpcyBub3QgaW4gdGhlIGd1aWxkLCB0aGVuIHRoZSBndWlsZCBtdXN0IGJlIERpc2NvdmVyYWJsZS4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRHdWlsZFByZXZpZXcoZ3VpbGRJZDogYmlnaW50KSB7XG4gIHJldHVybiBhd2FpdCByZXN0LnJ1bk1ldGhvZDxHdWlsZFByZXZpZXc+KFxuICAgIFwiZ2V0XCIsXG4gICAgZW5kcG9pbnRzLkdVSUxEX1BSRVZJRVcoZ3VpbGRJZCksXG4gICk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsSUFBSSxTQUFRLGtCQUFvQjtTQUVoQyxTQUFTLFNBQVEsdUJBQXlCO0FBRW5ELEVBQThILEFBQTlILDBIQUE4SCxBQUE5SCxFQUE4SCx1QkFDeEcsZUFBZSxDQUFDLE9BQWU7aUJBQ3RDLElBQUksQ0FBQyxTQUFTLEVBQ3pCLEdBQUssR0FDTCxTQUFTLENBQUMsYUFBYSxDQUFDLE9BQU8ifQ==