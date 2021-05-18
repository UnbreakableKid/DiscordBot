import { rest } from "../../rest/rest.ts";
import { Collection } from "../../util/collection.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotGuildPermissions } from "../../util/permissions.ts";
/** Get all the invites for this guild. Requires MANAGE_GUILD permission */ export async function getInvites(guildId) {
    await requireBotGuildPermissions(guildId, [
        "MANAGE_GUILD"
    ]);
    const result = await rest.runMethod("get", endpoints.GUILD_INVITES(guildId));
    return new Collection(result.map((invite)=>[
            invite.code,
            invite
        ]
    ));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvaW52aXRlcy9nZXRfaW52aXRlcy50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVzdCB9IGZyb20gXCIuLi8uLi9yZXN0L3Jlc3QudHNcIjtcbmltcG9ydCB0eXBlIHsgSW52aXRlIH0gZnJvbSBcIi4uLy4uL3R5cGVzL2ludml0ZXMvaW52aXRlLnRzXCI7XG5pbXBvcnQgeyBDb2xsZWN0aW9uIH0gZnJvbSBcIi4uLy4uL3V0aWwvY29sbGVjdGlvbi50c1wiO1xuaW1wb3J0IHsgZW5kcG9pbnRzIH0gZnJvbSBcIi4uLy4uL3V0aWwvY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyByZXF1aXJlQm90R3VpbGRQZXJtaXNzaW9ucyB9IGZyb20gXCIuLi8uLi91dGlsL3Blcm1pc3Npb25zLnRzXCI7XG5cbi8qKiBHZXQgYWxsIHRoZSBpbnZpdGVzIGZvciB0aGlzIGd1aWxkLiBSZXF1aXJlcyBNQU5BR0VfR1VJTEQgcGVybWlzc2lvbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEludml0ZXMoZ3VpbGRJZDogYmlnaW50KSB7XG4gIGF3YWl0IHJlcXVpcmVCb3RHdWlsZFBlcm1pc3Npb25zKGd1aWxkSWQsIFtcIk1BTkFHRV9HVUlMRFwiXSk7XG5cbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzdC5ydW5NZXRob2Q8SW52aXRlW10+KFxuICAgIFwiZ2V0XCIsXG4gICAgZW5kcG9pbnRzLkdVSUxEX0lOVklURVMoZ3VpbGRJZCksXG4gICk7XG5cbiAgcmV0dXJuIG5ldyBDb2xsZWN0aW9uKFxuICAgIHJlc3VsdC5tYXAoKGludml0ZSkgPT4gW2ludml0ZS5jb2RlLCBpbnZpdGVdKSxcbiAgKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxJQUFJLFNBQVEsa0JBQW9CO1NBRWhDLFVBQVUsU0FBUSx3QkFBMEI7U0FDNUMsU0FBUyxTQUFRLHVCQUF5QjtTQUMxQywwQkFBMEIsU0FBUSx5QkFBMkI7QUFFdEUsRUFBMkUsQUFBM0UsdUVBQTJFLEFBQTNFLEVBQTJFLHVCQUNyRCxVQUFVLENBQUMsT0FBZTtVQUN4QywwQkFBMEIsQ0FBQyxPQUFPO1NBQUcsWUFBYzs7VUFFbkQsTUFBTSxTQUFTLElBQUksQ0FBQyxTQUFTLEVBQ2pDLEdBQUssR0FDTCxTQUFTLENBQUMsYUFBYSxDQUFDLE9BQU87ZUFHdEIsVUFBVSxDQUNuQixNQUFNLENBQUMsR0FBRyxFQUFFLE1BQU07WUFBTSxNQUFNLENBQUMsSUFBSTtZQUFFLE1BQU0ifQ==