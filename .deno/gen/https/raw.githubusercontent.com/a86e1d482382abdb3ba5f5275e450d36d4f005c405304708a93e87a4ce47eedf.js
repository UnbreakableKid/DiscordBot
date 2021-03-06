import { rest } from "../../rest/rest.ts";
import { endpoints } from "../../util/constants.ts";
import { snakelize } from "../../util/utils.ts";
/** Returns an invite for the given code or throws an error if the invite doesn't exists. */ export async function getInvite(
  inviteCode,
  options,
) {
  return await rest.runMethod(
    "get",
    endpoints.INVITE(inviteCode),
    snakelize(options ?? {}),
  );
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvaW52aXRlcy9nZXRfaW52aXRlLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHsgR2V0SW52aXRlIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2ludml0ZXMvZ2V0X2ludml0ZS50c1wiO1xuaW1wb3J0IHR5cGUgeyBJbnZpdGUgfSBmcm9tIFwiLi4vLi4vdHlwZXMvaW52aXRlcy9pbnZpdGUudHNcIjtcbmltcG9ydCB7IGVuZHBvaW50cyB9IGZyb20gXCIuLi8uLi91dGlsL2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHsgc25ha2VsaXplIH0gZnJvbSBcIi4uLy4uL3V0aWwvdXRpbHMudHNcIjtcblxuLyoqIFJldHVybnMgYW4gaW52aXRlIGZvciB0aGUgZ2l2ZW4gY29kZSBvciB0aHJvd3MgYW4gZXJyb3IgaWYgdGhlIGludml0ZSBkb2Vzbid0IGV4aXN0cy4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRJbnZpdGUoaW52aXRlQ29kZTogc3RyaW5nLCBvcHRpb25zPzogR2V0SW52aXRlKSB7XG4gIHJldHVybiBhd2FpdCByZXN0LnJ1bk1ldGhvZDxJbnZpdGU+KFxuICAgIFwiZ2V0XCIsXG4gICAgZW5kcG9pbnRzLklOVklURShpbnZpdGVDb2RlKSxcbiAgICBzbmFrZWxpemUob3B0aW9ucyA/PyB7fSksXG4gICk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsSUFBSSxTQUFRLGtCQUFvQjtTQUdoQyxTQUFTLFNBQVEsdUJBQXlCO1NBQzFDLFNBQVMsU0FBUSxtQkFBcUI7QUFFL0MsRUFBNEYsQUFBNUYsd0ZBQTRGLEFBQTVGLEVBQTRGLHVCQUN0RSxTQUFTLENBQUMsVUFBa0IsRUFBRSxPQUFtQjtpQkFDeEQsSUFBSSxDQUFDLFNBQVMsRUFDekIsR0FBSyxHQUNMLFNBQVMsQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUMzQixTQUFTLENBQUMsT0FBTyJ9
