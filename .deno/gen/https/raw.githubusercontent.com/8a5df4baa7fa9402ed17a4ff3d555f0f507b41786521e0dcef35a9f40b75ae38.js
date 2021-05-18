import { rest } from "../../rest/rest.ts";
import { endpoints } from "../../util/constants.ts";
/** Returns the code and uses of the vanity url for this server if it is enabled else `code` will be null. Requires the `MANAGE_GUILD` permission. */ export async function getVanityURL(guildId) {
    return await rest.runMethod("get", endpoints.GUILD_VANITY_URL(guildId));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvZ3VpbGRzL2dldF92YWludHlfdXJsLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4uLy4uL3Jlc3QvcmVzdC50c1wiO1xuaW1wb3J0IHR5cGUgeyBJbnZpdGVNZXRhZGF0YSB9IGZyb20gXCIuLi8uLi90eXBlcy9pbnZpdGVzL2ludml0ZV9tZXRhZGF0YS50c1wiO1xuaW1wb3J0IHsgZW5kcG9pbnRzIH0gZnJvbSBcIi4uLy4uL3V0aWwvY29uc3RhbnRzLnRzXCI7XG5cbi8qKiBSZXR1cm5zIHRoZSBjb2RlIGFuZCB1c2VzIG9mIHRoZSB2YW5pdHkgdXJsIGZvciB0aGlzIHNlcnZlciBpZiBpdCBpcyBlbmFibGVkIGVsc2UgYGNvZGVgIHdpbGwgYmUgbnVsbC4gUmVxdWlyZXMgdGhlIGBNQU5BR0VfR1VJTERgIHBlcm1pc3Npb24uICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0VmFuaXR5VVJMKGd1aWxkSWQ6IGJpZ2ludCkge1xuICByZXR1cm4gYXdhaXQgcmVzdC5ydW5NZXRob2Q8XG4gICAgKFBhcnRpYWw8SW52aXRlTWV0YWRhdGE+ICYgUGljazxJbnZpdGVNZXRhZGF0YSwgXCJ1c2VzXCIgfCBcImNvZGVcIj4pIHwge1xuICAgICAgY29kZTogbnVsbDtcbiAgICB9XG4gID4oXG4gICAgXCJnZXRcIixcbiAgICBlbmRwb2ludHMuR1VJTERfVkFOSVRZX1VSTChndWlsZElkKSxcbiAgKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxJQUFJLFNBQVEsa0JBQW9CO1NBRWhDLFNBQVMsU0FBUSx1QkFBeUI7QUFFbkQsRUFBcUosQUFBckosaUpBQXFKLEFBQXJKLEVBQXFKLHVCQUMvSCxZQUFZLENBQUMsT0FBZTtpQkFDbkMsSUFBSSxDQUFDLFNBQVMsRUFLekIsR0FBSyxHQUNMLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPIn0=