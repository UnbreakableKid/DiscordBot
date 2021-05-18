import { hasGuildPermissions } from "../../deps.ts";
import { PermissionLevels } from "../types/commands.ts";
import { bot } from "../../cache.ts";
// The member using the command must be an admin. (Required ADMIN server perm.)
bot.permissionLevels.set(
  PermissionLevels.ADMIN,
  (message) =>
    hasGuildPermissions(message.guildId, message.authorId, [
      "ADMINISTRATOR",
    ]),
);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL3Blcm1pc3Npb25MZXZlbHMvYWRtaW4udHMjNj4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaGFzR3VpbGRQZXJtaXNzaW9ucyB9IGZyb20gXCIuLi8uLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyBQZXJtaXNzaW9uTGV2ZWxzIH0gZnJvbSBcIi4uL3R5cGVzL2NvbW1hbmRzLnRzXCI7XG5pbXBvcnQgeyBib3QgfSBmcm9tIFwiLi4vLi4vY2FjaGUudHNcIjtcblxuLy8gVGhlIG1lbWJlciB1c2luZyB0aGUgY29tbWFuZCBtdXN0IGJlIGFuIGFkbWluLiAoUmVxdWlyZWQgQURNSU4gc2VydmVyIHBlcm0uKVxuYm90LnBlcm1pc3Npb25MZXZlbHMuc2V0KFxuICBQZXJtaXNzaW9uTGV2ZWxzLkFETUlOLFxuICAobWVzc2FnZSkgPT5cbiAgICBoYXNHdWlsZFBlcm1pc3Npb25zKG1lc3NhZ2UuZ3VpbGRJZCwgbWVzc2FnZS5hdXRob3JJZCwgW1wiQURNSU5JU1RSQVRPUlwiXSksXG4pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLG1CQUFtQixTQUFRLGFBQWU7U0FDMUMsZ0JBQWdCLFNBQVEsb0JBQXNCO1NBQzlDLEdBQUcsU0FBUSxjQUFnQjtBQUVwQyxFQUErRSxBQUEvRSw2RUFBK0U7QUFDL0UsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FDdEIsZ0JBQWdCLENBQUMsS0FBSyxHQUNyQixPQUFPLEdBQ04sbUJBQW1CLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsUUFBUTtTQUFHLGFBQWUifQ==
