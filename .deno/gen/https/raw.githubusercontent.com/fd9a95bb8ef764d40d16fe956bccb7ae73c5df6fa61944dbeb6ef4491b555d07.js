import { botId } from "../bot.ts";
import { cacheHandlers } from "../cache.ts";
import { Errors } from "../types/discordeno/errors.ts";
import { DiscordBitwisePermissionFlags } from "../types/permissions/bitwise_permission_flags.ts";
async function getCached(table, key) {
  const cached = typeof key === "bigint"
    ? await cacheHandlers.get(table, key)
    : key;
  return typeof cached === "bigint" ? undefined : cached;
}
/** Calculates the permissions this member has in the given guild */ export async function calculateBasePermissions(
  guildOrId,
  memberOrId,
) {
  const guild = await getCached("guilds", guildOrId);
  const member = await getCached("members", memberOrId);
  if (!guild || !member) return "8";
  let permissions = 0n;
  // Calculate the role permissions bits, @everyone role is not in memberRoleIds so we need to pass guildId manualy
  permissions |= [
    ...member.guilds.get(guild.id)?.roles || [],
    guild.id,
  ].map((id) => guild.roles.get(id)?.permissions) // Removes any edge case undefined
    .filter((perm) => perm).reduce((bits, perms) => {
      bits |= BigInt(perms);
      return bits;
    }, 0n);
  // If the memberId is equal to the guild ownerId he automatically has every permission so we add ADMINISTRATOR permission
  if (guild.ownerId === member.id) permissions |= 8n;
  // Return the members permission bits as a string
  return permissions.toString();
}
/** Calculates the permissions this member has for the given Channel */ export async function calculateChannelOverwrites(
  channelOrId,
  memberOrId,
) {
  const channel = await getCached("channels", channelOrId);
  // This is a DM channel so return ADMINISTRATOR permission
  if (!channel?.guildId) return "8";
  const member = await getCached("members", memberOrId);
  if (!channel || !member) return "8";
  // Get all the role permissions this member already has
  let permissions = BigInt(
    await calculateBasePermissions(channel.guildId, member),
  );
  // First calculate @everyone overwrites since these have the lowest priority
  const overwriteEveryone = channel.permissionOverwrites?.find((overwrite) =>
    overwrite.id === channel.guildId
  );
  if (overwriteEveryone) {
    // First remove denied permissions since denied < allowed
    permissions &= ~BigInt(overwriteEveryone.deny);
    permissions |= BigInt(overwriteEveryone.allow);
  }
  const overwrites = channel.permissionOverwrites;
  // In order to calculate the role permissions correctly we need to temporarily save the allowed and denied permissions
  let allow = 0n;
  let deny = 0n;
  const memberRoles = member.guilds.get(channel.guildId)?.roles || [];
  // Second calculate members role overwrites since these have middle priority
  for (const overwrite of overwrites || []) {
    if (!memberRoles.includes(overwrite.id)) continue;
    deny |= BigInt(overwrite.deny);
    allow |= BigInt(overwrite.allow);
  }
  // After role overwrite calculate save allowed permissions first we remove denied permissions since "denied < allowed"
  permissions &= ~deny;
  permissions |= allow;
  // Third calculate member specific overwrites since these have the highest priority
  const overwriteMember = overwrites?.find((overwrite) =>
    overwrite.id === member.id
  );
  if (overwriteMember) {
    permissions &= ~BigInt(overwriteMember.deny);
    permissions |= BigInt(overwriteMember.allow);
  }
  return permissions.toString();
}
/** Checks if the given permission bits are matching the given permissions. `ADMINISTRATOR` always returns `true` */ export function validatePermissions(
  permissionBits,
  permissions,
) {
  if (BigInt(permissionBits) & 8n) return true;
  return permissions.every((permission) =>
    // Check if permission is in permissionBits
    BigInt(permissionBits) & BigInt(DiscordBitwisePermissionFlags[permission])
  );
}
/** Checks if the given member has these permissions in the given guild */ export async function hasGuildPermissions(
  guild,
  member,
  permissions,
) {
  // First we need the role permission bits this member has
  const basePermissions = await calculateBasePermissions(guild, member);
  // Second use the validatePermissions function to check if the member has every permission
  return validatePermissions(basePermissions, permissions);
}
/** Checks if the bot has these permissions in the given guild */ export function botHasGuildPermissions(
  guild,
  permissions,
) {
  // Since Bot is a normal member we can use the hasRolePermissions() function
  return hasGuildPermissions(guild, botId, permissions);
}
/** Checks if the given member has these permissions for the given channel */ export async function hasChannelPermissions(
  channel,
  member,
  permissions,
) {
  // First we need the overwrite bits this member has
  const channelOverwrites = await calculateChannelOverwrites(channel, member);
  // Second use the validatePermissions function to check if the member has every permission
  return validatePermissions(channelOverwrites, permissions);
}
/** Checks if the bot has these permissions f0r the given channel */ export function botHasChannelPermissions(
  channel,
  permissions,
) {
  // Since Bot is a normal member we can use the hasRolePermissions() function
  return hasChannelPermissions(channel, botId, permissions);
}
/** Returns the permissions that are not in the given permissionBits */ export function missingPermissions(
  permissionBits,
  permissions,
) {
  if (BigInt(permissionBits) & 8n) return [];
  return permissions.filter((permission) =>
    !(BigInt(permissionBits) &
      BigInt(DiscordBitwisePermissionFlags[permission]))
  );
}
/** Get the missing Guild permissions this member has */ export async function getMissingGuildPermissions(
  guild,
  member,
  permissions,
) {
  // First we need the role permission bits this member has
  const permissionBits = await calculateBasePermissions(guild, member);
  // Second return the members missing permissions
  return missingPermissions(permissionBits, permissions);
}
/** Get the missing Channel permissions this member has */ export async function getMissingChannelPermissions(
  channel,
  member,
  permissions,
) {
  // First we need the role permissino bits this member has
  const permissionBits = await calculateChannelOverwrites(channel, member);
  // Second returnn the members missing permissions
  return missingPermissions(permissionBits, permissions);
}
/** Throws an error if this member has not all of the given permissions */ export async function requireGuildPermissions(
  guild,
  member,
  permissions,
) {
  const missing = await getMissingGuildPermissions(guild, member, permissions);
  if (missing.length) {
    // If the member is missing a permission throw an Error
    throw new Error(`Missing Permissions: ${missing.join(" & ")}`);
  }
}
/** Throws an error if the bot does not have all permissions */ export function requireBotGuildPermissions(
  guild,
  permissions,
) {
  // Since Bot is a normal member we can use the throwOnMissingGuildPermission() function
  return requireGuildPermissions(guild, botId, permissions);
}
/** Throws an error if this member has not all of the given permissions */ export async function requireChannelPermissions(
  channel,
  member,
  permissions,
) {
  const missing = await getMissingChannelPermissions(
    channel,
    member,
    permissions,
  );
  if (missing.length) {
    // If the member is missing a permission throw an Error
    throw new Error(`Missing Permissions: ${missing.join(" & ")}`);
  }
}
/** Throws an error if the bot has not all of the given channel permissions */ export function requireBotChannelPermissions(
  channel,
  permissions,
) {
  // Since Bot is a normal member we can use the throwOnMissingChannelPermission() function
  return requireChannelPermissions(channel, botId, permissions);
}
/** This function converts a bitwise string to permission strings */ export function calculatePermissions(
  permissionBits,
) {
  return Object.keys(DiscordBitwisePermissionFlags).filter((permission) => {
    // Since Object.keys() not only returns the permission names but also the bit values we need to return false if it is a Number
    if (Number(permission)) return false;
    // Check if permissionBits has this permission
    return BigInt(permissionBits) &
      BigInt(DiscordBitwisePermissionFlags[permission]);
  });
}
/** This function converts an array of permissions into the bitwise string. */ export function calculateBits(
  permissions,
) {
  return permissions.reduce((bits, perm) => {
    bits |= BigInt(DiscordBitwisePermissionFlags[perm]);
    return bits;
  }, 0n).toString();
}
/** Internal function to check if the bot has the permissions to set these overwrites */ export async function requireOverwritePermissions(
  guildOrId,
  overwrites,
) {
  let requiredPerms = new Set([
    "MANAGE_CHANNELS",
  ]);
  overwrites?.forEach((overwrite) => {
    overwrite.allow.forEach(requiredPerms.add, requiredPerms);
    overwrite.deny.forEach(requiredPerms.add, requiredPerms);
  });
  // MANAGE_ROLES permission can only be set by administrators
  if (requiredPerms.has("MANAGE_ROLES")) {
    requiredPerms = new Set([
      "ADMINISTRATOR",
    ]);
  }
  await requireGuildPermissions(guildOrId, botId, [
    ...requiredPerms,
  ]);
}
/** Gets the highest role from the member in this guild */ export async function highestRole(
  guildOrId,
  memberOrId,
) {
  const guild = await getCached("guilds", guildOrId);
  if (!guild) throw new Error(Errors.GUILD_NOT_FOUND);
  // Get the roles from the member
  const memberRoles = (await getCached("members", memberOrId))?.guilds.get(
    guild.id,
  )?.roles;
  // This member has no roles so the highest one is the @everyone role
  if (!memberRoles) return guild.roles.get(guild.id);
  let memberHighestRole;
  for (const roleId of memberRoles) {
    const role = guild.roles.get(roleId);
    // Rare edge case handling if undefined
    if (!role) continue;
    // If memberHighestRole is still undefined we want to assign the role,
    // else we want to check if the current role position is higher than the current memberHighestRole
    if (
      !memberHighestRole || memberHighestRole.position < role.position ||
      memberHighestRole.position === role.position
    ) {
      memberHighestRole = role;
    }
  }
  // The member has at least one role so memberHighestRole must exist
  return memberHighestRole;
}
/** Checks if the first role is higher than the second role */ export async function higherRolePosition(
  guildOrId,
  roleId,
  otherRoleId,
) {
  const guild = await getCached("guilds", guildOrId);
  if (!guild) return true;
  const role = guild.roles.get(roleId);
  const otherRole = guild.roles.get(otherRoleId);
  if (!role || !otherRole) throw new Error(Errors.ROLE_NOT_FOUND);
  // Rare edge case handling
  if (role.position === otherRole.position) {
    return role.id < otherRole.id;
  }
  return role.position > otherRole.position;
}
/** Checks if the member has a higher position than the given role */ export async function isHigherPosition(
  guildOrId,
  memberId,
  compareRoleId,
) {
  const guild = await getCached("guilds", guildOrId);
  if (!guild || guild.ownerId === memberId) return true;
  const memberHighestRole = await highestRole(guild, memberId);
  return higherRolePosition(guild.id, memberHighestRole.id, compareRoleId);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3V0aWwvcGVybWlzc2lvbnMudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvdElkIH0gZnJvbSBcIi4uL2JvdC50c1wiO1xuaW1wb3J0IHsgY2FjaGVIYW5kbGVycyB9IGZyb20gXCIuLi9jYWNoZS50c1wiO1xuaW1wb3J0IHsgRGlzY29yZGVub0NoYW5uZWwgfSBmcm9tIFwiLi4vc3RydWN0dXJlcy9jaGFubmVsLnRzXCI7XG5pbXBvcnQgeyBEaXNjb3JkZW5vR3VpbGQgfSBmcm9tIFwiLi4vc3RydWN0dXJlcy9ndWlsZC50c1wiO1xuaW1wb3J0IHsgRGlzY29yZGVub01lbWJlciB9IGZyb20gXCIuLi9zdHJ1Y3R1cmVzL21lbWJlci50c1wiO1xuaW1wb3J0IHsgRGlzY29yZGVub1JvbGUgfSBmcm9tIFwiLi4vc3RydWN0dXJlcy9yb2xlLnRzXCI7XG5pbXBvcnQgeyBPdmVyd3JpdGUgfSBmcm9tIFwiLi4vdHlwZXMvY2hhbm5lbHMvb3ZlcndyaXRlLnRzXCI7XG5pbXBvcnQgeyBFcnJvcnMgfSBmcm9tIFwiLi4vdHlwZXMvZGlzY29yZGVuby9lcnJvcnMudHNcIjtcbmltcG9ydCB7IERpc2NvcmRCaXR3aXNlUGVybWlzc2lvbkZsYWdzIH0gZnJvbSBcIi4uL3R5cGVzL3Blcm1pc3Npb25zL2JpdHdpc2VfcGVybWlzc2lvbl9mbGFncy50c1wiO1xuaW1wb3J0IHR5cGUgeyBQZXJtaXNzaW9uU3RyaW5ncyB9IGZyb20gXCIuLi90eXBlcy9wZXJtaXNzaW9ucy9wZXJtaXNzaW9uX3N0cmluZ3MudHNcIjtcblxuYXN5bmMgZnVuY3Rpb24gZ2V0Q2FjaGVkKFxuICB0YWJsZTogXCJndWlsZHNcIixcbiAga2V5OiBiaWdpbnQgfCBEaXNjb3JkZW5vR3VpbGQsXG4pOiBQcm9taXNlPERpc2NvcmRlbm9HdWlsZCB8IHVuZGVmaW5lZD47XG5hc3luYyBmdW5jdGlvbiBnZXRDYWNoZWQoXG4gIHRhYmxlOiBcImNoYW5uZWxzXCIsXG4gIGtleTogYmlnaW50IHwgRGlzY29yZGVub0NoYW5uZWwsXG4pOiBQcm9taXNlPERpc2NvcmRlbm9DaGFubmVsIHwgdW5kZWZpbmVkPjtcbmFzeW5jIGZ1bmN0aW9uIGdldENhY2hlZChcbiAgdGFibGU6IFwibWVtYmVyc1wiLFxuICBrZXk6IGJpZ2ludCB8IERpc2NvcmRlbm9NZW1iZXIsXG4pOiBQcm9taXNlPERpc2NvcmRlbm9NZW1iZXIgfCB1bmRlZmluZWQ+O1xuYXN5bmMgZnVuY3Rpb24gZ2V0Q2FjaGVkKFxuICB0YWJsZTogXCJndWlsZHNcIiB8IFwiY2hhbm5lbHNcIiB8IFwibWVtYmVyc1wiLFxuICBrZXk6IGJpZ2ludCB8IERpc2NvcmRlbm9HdWlsZCB8IERpc2NvcmRlbm9DaGFubmVsIHwgRGlzY29yZGVub01lbWJlcixcbikge1xuICBjb25zdCBjYWNoZWQgPSB0eXBlb2Yga2V5ID09PSBcImJpZ2ludFwiXG4gICAgPyAvLyBAdHMtaWdub3JlIFRTIGlzIHdyb25nIGhlcmVcbiAgICAgIGF3YWl0IGNhY2hlSGFuZGxlcnMuZ2V0KHRhYmxlLCBrZXkpXG4gICAgOiBrZXk7XG5cbiAgcmV0dXJuIHR5cGVvZiBjYWNoZWQgPT09IFwiYmlnaW50XCIgPyB1bmRlZmluZWQgOiBjYWNoZWQ7XG59XG5cbi8qKiBDYWxjdWxhdGVzIHRoZSBwZXJtaXNzaW9ucyB0aGlzIG1lbWJlciBoYXMgaW4gdGhlIGdpdmVuIGd1aWxkICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FsY3VsYXRlQmFzZVBlcm1pc3Npb25zKFxuICBndWlsZE9ySWQ6IGJpZ2ludCB8IERpc2NvcmRlbm9HdWlsZCxcbiAgbWVtYmVyT3JJZDogYmlnaW50IHwgRGlzY29yZGVub01lbWJlcixcbikge1xuICBjb25zdCBndWlsZCA9IGF3YWl0IGdldENhY2hlZChcImd1aWxkc1wiLCBndWlsZE9ySWQpO1xuICBjb25zdCBtZW1iZXIgPSBhd2FpdCBnZXRDYWNoZWQoXCJtZW1iZXJzXCIsIG1lbWJlck9ySWQpO1xuXG4gIGlmICghZ3VpbGQgfHwgIW1lbWJlcikgcmV0dXJuIFwiOFwiO1xuXG4gIGxldCBwZXJtaXNzaW9ucyA9IDBuO1xuICAvLyBDYWxjdWxhdGUgdGhlIHJvbGUgcGVybWlzc2lvbnMgYml0cywgQGV2ZXJ5b25lIHJvbGUgaXMgbm90IGluIG1lbWJlclJvbGVJZHMgc28gd2UgbmVlZCB0byBwYXNzIGd1aWxkSWQgbWFudWFseVxuICBwZXJtaXNzaW9ucyB8PSBbLi4uKG1lbWJlci5ndWlsZHMuZ2V0KGd1aWxkLmlkKT8ucm9sZXMgfHwgW10pLCBndWlsZC5pZF1cbiAgICAubWFwKChpZCkgPT4gZ3VpbGQucm9sZXMuZ2V0KGlkKT8ucGVybWlzc2lvbnMpXG4gICAgLy8gUmVtb3ZlcyBhbnkgZWRnZSBjYXNlIHVuZGVmaW5lZFxuICAgIC5maWx0ZXIoKHBlcm0pID0+IHBlcm0pXG4gICAgLnJlZHVjZSgoYml0cywgcGVybXMpID0+IHtcbiAgICAgIGJpdHMgfD0gQmlnSW50KHBlcm1zKTtcbiAgICAgIHJldHVybiBiaXRzO1xuICAgIH0sIDBuKTtcblxuICAvLyBJZiB0aGUgbWVtYmVySWQgaXMgZXF1YWwgdG8gdGhlIGd1aWxkIG93bmVySWQgaGUgYXV0b21hdGljYWxseSBoYXMgZXZlcnkgcGVybWlzc2lvbiBzbyB3ZSBhZGQgQURNSU5JU1RSQVRPUiBwZXJtaXNzaW9uXG4gIGlmIChndWlsZC5vd25lcklkID09PSBtZW1iZXIuaWQpIHBlcm1pc3Npb25zIHw9IDhuO1xuICAvLyBSZXR1cm4gdGhlIG1lbWJlcnMgcGVybWlzc2lvbiBiaXRzIGFzIGEgc3RyaW5nXG4gIHJldHVybiBwZXJtaXNzaW9ucy50b1N0cmluZygpO1xufVxuXG4vKiogQ2FsY3VsYXRlcyB0aGUgcGVybWlzc2lvbnMgdGhpcyBtZW1iZXIgaGFzIGZvciB0aGUgZ2l2ZW4gQ2hhbm5lbCAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhbGN1bGF0ZUNoYW5uZWxPdmVyd3JpdGVzKFxuICBjaGFubmVsT3JJZDogYmlnaW50IHwgRGlzY29yZGVub0NoYW5uZWwsXG4gIG1lbWJlck9ySWQ6IGJpZ2ludCB8IERpc2NvcmRlbm9NZW1iZXIsXG4pIHtcbiAgY29uc3QgY2hhbm5lbCA9IGF3YWl0IGdldENhY2hlZChcImNoYW5uZWxzXCIsIGNoYW5uZWxPcklkKTtcblxuICAvLyBUaGlzIGlzIGEgRE0gY2hhbm5lbCBzbyByZXR1cm4gQURNSU5JU1RSQVRPUiBwZXJtaXNzaW9uXG4gIGlmICghY2hhbm5lbD8uZ3VpbGRJZCkgcmV0dXJuIFwiOFwiO1xuXG4gIGNvbnN0IG1lbWJlciA9IGF3YWl0IGdldENhY2hlZChcIm1lbWJlcnNcIiwgbWVtYmVyT3JJZCk7XG5cbiAgaWYgKCFjaGFubmVsIHx8ICFtZW1iZXIpIHJldHVybiBcIjhcIjtcblxuICAvLyBHZXQgYWxsIHRoZSByb2xlIHBlcm1pc3Npb25zIHRoaXMgbWVtYmVyIGFscmVhZHkgaGFzXG4gIGxldCBwZXJtaXNzaW9ucyA9IEJpZ0ludChcbiAgICBhd2FpdCBjYWxjdWxhdGVCYXNlUGVybWlzc2lvbnMoY2hhbm5lbC5ndWlsZElkLCBtZW1iZXIpLFxuICApO1xuXG4gIC8vIEZpcnN0IGNhbGN1bGF0ZSBAZXZlcnlvbmUgb3ZlcndyaXRlcyBzaW5jZSB0aGVzZSBoYXZlIHRoZSBsb3dlc3QgcHJpb3JpdHlcbiAgY29uc3Qgb3ZlcndyaXRlRXZlcnlvbmUgPSBjaGFubmVsLnBlcm1pc3Npb25PdmVyd3JpdGVzPy5maW5kKFxuICAgIChvdmVyd3JpdGUpID0+IG92ZXJ3cml0ZS5pZCA9PT0gY2hhbm5lbC5ndWlsZElkLFxuICApO1xuICBpZiAob3ZlcndyaXRlRXZlcnlvbmUpIHtcbiAgICAvLyBGaXJzdCByZW1vdmUgZGVuaWVkIHBlcm1pc3Npb25zIHNpbmNlIGRlbmllZCA8IGFsbG93ZWRcbiAgICBwZXJtaXNzaW9ucyAmPSB+QmlnSW50KG92ZXJ3cml0ZUV2ZXJ5b25lLmRlbnkpO1xuICAgIHBlcm1pc3Npb25zIHw9IEJpZ0ludChvdmVyd3JpdGVFdmVyeW9uZS5hbGxvdyk7XG4gIH1cblxuICBjb25zdCBvdmVyd3JpdGVzID0gY2hhbm5lbC5wZXJtaXNzaW9uT3ZlcndyaXRlcztcblxuICAvLyBJbiBvcmRlciB0byBjYWxjdWxhdGUgdGhlIHJvbGUgcGVybWlzc2lvbnMgY29ycmVjdGx5IHdlIG5lZWQgdG8gdGVtcG9yYXJpbHkgc2F2ZSB0aGUgYWxsb3dlZCBhbmQgZGVuaWVkIHBlcm1pc3Npb25zXG4gIGxldCBhbGxvdyA9IDBuO1xuICBsZXQgZGVueSA9IDBuO1xuICBjb25zdCBtZW1iZXJSb2xlcyA9IG1lbWJlci5ndWlsZHMuZ2V0KGNoYW5uZWwuZ3VpbGRJZCk/LnJvbGVzIHx8IFtdO1xuICAvLyBTZWNvbmQgY2FsY3VsYXRlIG1lbWJlcnMgcm9sZSBvdmVyd3JpdGVzIHNpbmNlIHRoZXNlIGhhdmUgbWlkZGxlIHByaW9yaXR5XG4gIGZvciAoY29uc3Qgb3ZlcndyaXRlIG9mIG92ZXJ3cml0ZXMgfHwgW10pIHtcbiAgICBpZiAoIW1lbWJlclJvbGVzLmluY2x1ZGVzKG92ZXJ3cml0ZS5pZCkpIGNvbnRpbnVlO1xuXG4gICAgZGVueSB8PSBCaWdJbnQob3ZlcndyaXRlLmRlbnkpO1xuICAgIGFsbG93IHw9IEJpZ0ludChvdmVyd3JpdGUuYWxsb3cpO1xuICB9XG4gIC8vIEFmdGVyIHJvbGUgb3ZlcndyaXRlIGNhbGN1bGF0ZSBzYXZlIGFsbG93ZWQgcGVybWlzc2lvbnMgZmlyc3Qgd2UgcmVtb3ZlIGRlbmllZCBwZXJtaXNzaW9ucyBzaW5jZSBcImRlbmllZCA8IGFsbG93ZWRcIlxuICBwZXJtaXNzaW9ucyAmPSB+ZGVueTtcbiAgcGVybWlzc2lvbnMgfD0gYWxsb3c7XG5cbiAgLy8gVGhpcmQgY2FsY3VsYXRlIG1lbWJlciBzcGVjaWZpYyBvdmVyd3JpdGVzIHNpbmNlIHRoZXNlIGhhdmUgdGhlIGhpZ2hlc3QgcHJpb3JpdHlcbiAgY29uc3Qgb3ZlcndyaXRlTWVtYmVyID0gb3ZlcndyaXRlcz8uZmluZChcbiAgICAob3ZlcndyaXRlKSA9PiBvdmVyd3JpdGUuaWQgPT09IG1lbWJlci5pZCxcbiAgKTtcbiAgaWYgKG92ZXJ3cml0ZU1lbWJlcikge1xuICAgIHBlcm1pc3Npb25zICY9IH5CaWdJbnQob3ZlcndyaXRlTWVtYmVyLmRlbnkpO1xuICAgIHBlcm1pc3Npb25zIHw9IEJpZ0ludChvdmVyd3JpdGVNZW1iZXIuYWxsb3cpO1xuICB9XG5cbiAgcmV0dXJuIHBlcm1pc3Npb25zLnRvU3RyaW5nKCk7XG59XG5cbi8qKiBDaGVja3MgaWYgdGhlIGdpdmVuIHBlcm1pc3Npb24gYml0cyBhcmUgbWF0Y2hpbmcgdGhlIGdpdmVuIHBlcm1pc3Npb25zLiBgQURNSU5JU1RSQVRPUmAgYWx3YXlzIHJldHVybnMgYHRydWVgICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVQZXJtaXNzaW9ucyhcbiAgcGVybWlzc2lvbkJpdHM6IHN0cmluZyxcbiAgcGVybWlzc2lvbnM6IFBlcm1pc3Npb25TdHJpbmdzW10sXG4pIHtcbiAgaWYgKEJpZ0ludChwZXJtaXNzaW9uQml0cykgJiA4bikgcmV0dXJuIHRydWU7XG5cbiAgcmV0dXJuIHBlcm1pc3Npb25zLmV2ZXJ5KFxuICAgIChwZXJtaXNzaW9uKSA9PlxuICAgICAgLy8gQ2hlY2sgaWYgcGVybWlzc2lvbiBpcyBpbiBwZXJtaXNzaW9uQml0c1xuICAgICAgQmlnSW50KHBlcm1pc3Npb25CaXRzKSAmXG4gICAgICBCaWdJbnQoRGlzY29yZEJpdHdpc2VQZXJtaXNzaW9uRmxhZ3NbcGVybWlzc2lvbl0pLFxuICApO1xufVxuXG4vKiogQ2hlY2tzIGlmIHRoZSBnaXZlbiBtZW1iZXIgaGFzIHRoZXNlIHBlcm1pc3Npb25zIGluIHRoZSBnaXZlbiBndWlsZCAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhc0d1aWxkUGVybWlzc2lvbnMoXG4gIGd1aWxkOiBiaWdpbnQgfCBEaXNjb3JkZW5vR3VpbGQsXG4gIG1lbWJlcjogYmlnaW50IHwgRGlzY29yZGVub01lbWJlcixcbiAgcGVybWlzc2lvbnM6IFBlcm1pc3Npb25TdHJpbmdzW10sXG4pIHtcbiAgLy8gRmlyc3Qgd2UgbmVlZCB0aGUgcm9sZSBwZXJtaXNzaW9uIGJpdHMgdGhpcyBtZW1iZXIgaGFzXG4gIGNvbnN0IGJhc2VQZXJtaXNzaW9ucyA9IGF3YWl0IGNhbGN1bGF0ZUJhc2VQZXJtaXNzaW9ucyhndWlsZCwgbWVtYmVyKTtcbiAgLy8gU2Vjb25kIHVzZSB0aGUgdmFsaWRhdGVQZXJtaXNzaW9ucyBmdW5jdGlvbiB0byBjaGVjayBpZiB0aGUgbWVtYmVyIGhhcyBldmVyeSBwZXJtaXNzaW9uXG4gIHJldHVybiB2YWxpZGF0ZVBlcm1pc3Npb25zKGJhc2VQZXJtaXNzaW9ucywgcGVybWlzc2lvbnMpO1xufVxuXG4vKiogQ2hlY2tzIGlmIHRoZSBib3QgaGFzIHRoZXNlIHBlcm1pc3Npb25zIGluIHRoZSBnaXZlbiBndWlsZCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJvdEhhc0d1aWxkUGVybWlzc2lvbnMoXG4gIGd1aWxkOiBiaWdpbnQgfCBEaXNjb3JkZW5vR3VpbGQsXG4gIHBlcm1pc3Npb25zOiBQZXJtaXNzaW9uU3RyaW5nc1tdLFxuKSB7XG4gIC8vIFNpbmNlIEJvdCBpcyBhIG5vcm1hbCBtZW1iZXIgd2UgY2FuIHVzZSB0aGUgaGFzUm9sZVBlcm1pc3Npb25zKCkgZnVuY3Rpb25cbiAgcmV0dXJuIGhhc0d1aWxkUGVybWlzc2lvbnMoZ3VpbGQsIGJvdElkLCBwZXJtaXNzaW9ucyk7XG59XG5cbi8qKiBDaGVja3MgaWYgdGhlIGdpdmVuIG1lbWJlciBoYXMgdGhlc2UgcGVybWlzc2lvbnMgZm9yIHRoZSBnaXZlbiBjaGFubmVsICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFzQ2hhbm5lbFBlcm1pc3Npb25zKFxuICBjaGFubmVsOiBiaWdpbnQgfCBEaXNjb3JkZW5vQ2hhbm5lbCxcbiAgbWVtYmVyOiBiaWdpbnQgfCBEaXNjb3JkZW5vTWVtYmVyLFxuICBwZXJtaXNzaW9uczogUGVybWlzc2lvblN0cmluZ3NbXSxcbikge1xuICAvLyBGaXJzdCB3ZSBuZWVkIHRoZSBvdmVyd3JpdGUgYml0cyB0aGlzIG1lbWJlciBoYXNcbiAgY29uc3QgY2hhbm5lbE92ZXJ3cml0ZXMgPSBhd2FpdCBjYWxjdWxhdGVDaGFubmVsT3ZlcndyaXRlcyhjaGFubmVsLCBtZW1iZXIpO1xuICAvLyBTZWNvbmQgdXNlIHRoZSB2YWxpZGF0ZVBlcm1pc3Npb25zIGZ1bmN0aW9uIHRvIGNoZWNrIGlmIHRoZSBtZW1iZXIgaGFzIGV2ZXJ5IHBlcm1pc3Npb25cbiAgcmV0dXJuIHZhbGlkYXRlUGVybWlzc2lvbnMoY2hhbm5lbE92ZXJ3cml0ZXMsIHBlcm1pc3Npb25zKTtcbn1cblxuLyoqIENoZWNrcyBpZiB0aGUgYm90IGhhcyB0aGVzZSBwZXJtaXNzaW9ucyBmMHIgdGhlIGdpdmVuIGNoYW5uZWwgKi9cbmV4cG9ydCBmdW5jdGlvbiBib3RIYXNDaGFubmVsUGVybWlzc2lvbnMoXG4gIGNoYW5uZWw6IGJpZ2ludCB8IERpc2NvcmRlbm9DaGFubmVsLFxuICBwZXJtaXNzaW9uczogUGVybWlzc2lvblN0cmluZ3NbXSxcbikge1xuICAvLyBTaW5jZSBCb3QgaXMgYSBub3JtYWwgbWVtYmVyIHdlIGNhbiB1c2UgdGhlIGhhc1JvbGVQZXJtaXNzaW9ucygpIGZ1bmN0aW9uXG4gIHJldHVybiBoYXNDaGFubmVsUGVybWlzc2lvbnMoY2hhbm5lbCwgYm90SWQsIHBlcm1pc3Npb25zKTtcbn1cblxuLyoqIFJldHVybnMgdGhlIHBlcm1pc3Npb25zIHRoYXQgYXJlIG5vdCBpbiB0aGUgZ2l2ZW4gcGVybWlzc2lvbkJpdHMgKi9cbmV4cG9ydCBmdW5jdGlvbiBtaXNzaW5nUGVybWlzc2lvbnMoXG4gIHBlcm1pc3Npb25CaXRzOiBzdHJpbmcsXG4gIHBlcm1pc3Npb25zOiBQZXJtaXNzaW9uU3RyaW5nc1tdLFxuKSB7XG4gIGlmIChCaWdJbnQocGVybWlzc2lvbkJpdHMpICYgOG4pIHJldHVybiBbXTtcblxuICByZXR1cm4gcGVybWlzc2lvbnMuZmlsdGVyKFxuICAgIChwZXJtaXNzaW9uKSA9PlxuICAgICAgIShcbiAgICAgICAgQmlnSW50KHBlcm1pc3Npb25CaXRzKSAmXG4gICAgICAgIEJpZ0ludChEaXNjb3JkQml0d2lzZVBlcm1pc3Npb25GbGFnc1twZXJtaXNzaW9uXSlcbiAgICAgICksXG4gICk7XG59XG5cbi8qKiBHZXQgdGhlIG1pc3NpbmcgR3VpbGQgcGVybWlzc2lvbnMgdGhpcyBtZW1iZXIgaGFzICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TWlzc2luZ0d1aWxkUGVybWlzc2lvbnMoXG4gIGd1aWxkOiBiaWdpbnQgfCBEaXNjb3JkZW5vR3VpbGQsXG4gIG1lbWJlcjogYmlnaW50IHwgRGlzY29yZGVub01lbWJlcixcbiAgcGVybWlzc2lvbnM6IFBlcm1pc3Npb25TdHJpbmdzW10sXG4pIHtcbiAgLy8gRmlyc3Qgd2UgbmVlZCB0aGUgcm9sZSBwZXJtaXNzaW9uIGJpdHMgdGhpcyBtZW1iZXIgaGFzXG4gIGNvbnN0IHBlcm1pc3Npb25CaXRzID0gYXdhaXQgY2FsY3VsYXRlQmFzZVBlcm1pc3Npb25zKGd1aWxkLCBtZW1iZXIpO1xuICAvLyBTZWNvbmQgcmV0dXJuIHRoZSBtZW1iZXJzIG1pc3NpbmcgcGVybWlzc2lvbnNcbiAgcmV0dXJuIG1pc3NpbmdQZXJtaXNzaW9ucyhwZXJtaXNzaW9uQml0cywgcGVybWlzc2lvbnMpO1xufVxuXG4vKiogR2V0IHRoZSBtaXNzaW5nIENoYW5uZWwgcGVybWlzc2lvbnMgdGhpcyBtZW1iZXIgaGFzICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TWlzc2luZ0NoYW5uZWxQZXJtaXNzaW9ucyhcbiAgY2hhbm5lbDogYmlnaW50IHwgRGlzY29yZGVub0NoYW5uZWwsXG4gIG1lbWJlcjogYmlnaW50IHwgRGlzY29yZGVub01lbWJlcixcbiAgcGVybWlzc2lvbnM6IFBlcm1pc3Npb25TdHJpbmdzW10sXG4pIHtcbiAgLy8gRmlyc3Qgd2UgbmVlZCB0aGUgcm9sZSBwZXJtaXNzaW5vIGJpdHMgdGhpcyBtZW1iZXIgaGFzXG4gIGNvbnN0IHBlcm1pc3Npb25CaXRzID0gYXdhaXQgY2FsY3VsYXRlQ2hhbm5lbE92ZXJ3cml0ZXMoY2hhbm5lbCwgbWVtYmVyKTtcbiAgLy8gU2Vjb25kIHJldHVybm4gdGhlIG1lbWJlcnMgbWlzc2luZyBwZXJtaXNzaW9uc1xuICByZXR1cm4gbWlzc2luZ1Blcm1pc3Npb25zKHBlcm1pc3Npb25CaXRzLCBwZXJtaXNzaW9ucyk7XG59XG5cbi8qKiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhpcyBtZW1iZXIgaGFzIG5vdCBhbGwgb2YgdGhlIGdpdmVuIHBlcm1pc3Npb25zICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVxdWlyZUd1aWxkUGVybWlzc2lvbnMoXG4gIGd1aWxkOiBiaWdpbnQgfCBEaXNjb3JkZW5vR3VpbGQsXG4gIG1lbWJlcjogYmlnaW50IHwgRGlzY29yZGVub01lbWJlcixcbiAgcGVybWlzc2lvbnM6IFBlcm1pc3Npb25TdHJpbmdzW10sXG4pIHtcbiAgY29uc3QgbWlzc2luZyA9IGF3YWl0IGdldE1pc3NpbmdHdWlsZFBlcm1pc3Npb25zKGd1aWxkLCBtZW1iZXIsIHBlcm1pc3Npb25zKTtcbiAgaWYgKG1pc3NpbmcubGVuZ3RoKSB7XG4gICAgLy8gSWYgdGhlIG1lbWJlciBpcyBtaXNzaW5nIGEgcGVybWlzc2lvbiB0aHJvdyBhbiBFcnJvclxuICAgIHRocm93IG5ldyBFcnJvcihgTWlzc2luZyBQZXJtaXNzaW9uczogJHttaXNzaW5nLmpvaW4oXCIgJiBcIil9YCk7XG4gIH1cbn1cblxuLyoqIFRocm93cyBhbiBlcnJvciBpZiB0aGUgYm90IGRvZXMgbm90IGhhdmUgYWxsIHBlcm1pc3Npb25zICovXG5leHBvcnQgZnVuY3Rpb24gcmVxdWlyZUJvdEd1aWxkUGVybWlzc2lvbnMoXG4gIGd1aWxkOiBiaWdpbnQgfCBEaXNjb3JkZW5vR3VpbGQsXG4gIHBlcm1pc3Npb25zOiBQZXJtaXNzaW9uU3RyaW5nc1tdLFxuKSB7XG4gIC8vIFNpbmNlIEJvdCBpcyBhIG5vcm1hbCBtZW1iZXIgd2UgY2FuIHVzZSB0aGUgdGhyb3dPbk1pc3NpbmdHdWlsZFBlcm1pc3Npb24oKSBmdW5jdGlvblxuICByZXR1cm4gcmVxdWlyZUd1aWxkUGVybWlzc2lvbnMoZ3VpbGQsIGJvdElkLCBwZXJtaXNzaW9ucyk7XG59XG5cbi8qKiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhpcyBtZW1iZXIgaGFzIG5vdCBhbGwgb2YgdGhlIGdpdmVuIHBlcm1pc3Npb25zICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVxdWlyZUNoYW5uZWxQZXJtaXNzaW9ucyhcbiAgY2hhbm5lbDogYmlnaW50IHwgRGlzY29yZGVub0NoYW5uZWwsXG4gIG1lbWJlcjogYmlnaW50IHwgRGlzY29yZGVub01lbWJlcixcbiAgcGVybWlzc2lvbnM6IFBlcm1pc3Npb25TdHJpbmdzW10sXG4pIHtcbiAgY29uc3QgbWlzc2luZyA9IGF3YWl0IGdldE1pc3NpbmdDaGFubmVsUGVybWlzc2lvbnMoXG4gICAgY2hhbm5lbCxcbiAgICBtZW1iZXIsXG4gICAgcGVybWlzc2lvbnMsXG4gICk7XG4gIGlmIChtaXNzaW5nLmxlbmd0aCkge1xuICAgIC8vIElmIHRoZSBtZW1iZXIgaXMgbWlzc2luZyBhIHBlcm1pc3Npb24gdGhyb3cgYW4gRXJyb3JcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE1pc3NpbmcgUGVybWlzc2lvbnM6ICR7bWlzc2luZy5qb2luKFwiICYgXCIpfWApO1xuICB9XG59XG5cbi8qKiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIGJvdCBoYXMgbm90IGFsbCBvZiB0aGUgZ2l2ZW4gY2hhbm5lbCBwZXJtaXNzaW9ucyAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlcXVpcmVCb3RDaGFubmVsUGVybWlzc2lvbnMoXG4gIGNoYW5uZWw6IGJpZ2ludCB8IERpc2NvcmRlbm9DaGFubmVsLFxuICBwZXJtaXNzaW9uczogUGVybWlzc2lvblN0cmluZ3NbXSxcbikge1xuICAvLyBTaW5jZSBCb3QgaXMgYSBub3JtYWwgbWVtYmVyIHdlIGNhbiB1c2UgdGhlIHRocm93T25NaXNzaW5nQ2hhbm5lbFBlcm1pc3Npb24oKSBmdW5jdGlvblxuICByZXR1cm4gcmVxdWlyZUNoYW5uZWxQZXJtaXNzaW9ucyhjaGFubmVsLCBib3RJZCwgcGVybWlzc2lvbnMpO1xufVxuXG4vKiogVGhpcyBmdW5jdGlvbiBjb252ZXJ0cyBhIGJpdHdpc2Ugc3RyaW5nIHRvIHBlcm1pc3Npb24gc3RyaW5ncyAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbGN1bGF0ZVBlcm1pc3Npb25zKHBlcm1pc3Npb25CaXRzOiBzdHJpbmcpIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKERpc2NvcmRCaXR3aXNlUGVybWlzc2lvbkZsYWdzKS5maWx0ZXIoKHBlcm1pc3Npb24pID0+IHtcbiAgICAvLyBTaW5jZSBPYmplY3Qua2V5cygpIG5vdCBvbmx5IHJldHVybnMgdGhlIHBlcm1pc3Npb24gbmFtZXMgYnV0IGFsc28gdGhlIGJpdCB2YWx1ZXMgd2UgbmVlZCB0byByZXR1cm4gZmFsc2UgaWYgaXQgaXMgYSBOdW1iZXJcbiAgICBpZiAoTnVtYmVyKHBlcm1pc3Npb24pKSByZXR1cm4gZmFsc2U7XG4gICAgLy8gQ2hlY2sgaWYgcGVybWlzc2lvbkJpdHMgaGFzIHRoaXMgcGVybWlzc2lvblxuICAgIHJldHVybiAoXG4gICAgICBCaWdJbnQocGVybWlzc2lvbkJpdHMpICZcbiAgICAgIEJpZ0ludChEaXNjb3JkQml0d2lzZVBlcm1pc3Npb25GbGFnc1twZXJtaXNzaW9uIGFzIFBlcm1pc3Npb25TdHJpbmdzXSlcbiAgICApO1xuICB9KSBhcyBQZXJtaXNzaW9uU3RyaW5nc1tdO1xufVxuXG4vKiogVGhpcyBmdW5jdGlvbiBjb252ZXJ0cyBhbiBhcnJheSBvZiBwZXJtaXNzaW9ucyBpbnRvIHRoZSBiaXR3aXNlIHN0cmluZy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVCaXRzKHBlcm1pc3Npb25zOiBQZXJtaXNzaW9uU3RyaW5nc1tdKSB7XG4gIHJldHVybiBwZXJtaXNzaW9uc1xuICAgIC5yZWR1Y2UoKGJpdHMsIHBlcm0pID0+IHtcbiAgICAgIGJpdHMgfD0gQmlnSW50KERpc2NvcmRCaXR3aXNlUGVybWlzc2lvbkZsYWdzW3Blcm1dKTtcbiAgICAgIHJldHVybiBiaXRzO1xuICAgIH0sIDBuKVxuICAgIC50b1N0cmluZygpO1xufVxuXG4vKiogSW50ZXJuYWwgZnVuY3Rpb24gdG8gY2hlY2sgaWYgdGhlIGJvdCBoYXMgdGhlIHBlcm1pc3Npb25zIHRvIHNldCB0aGVzZSBvdmVyd3JpdGVzICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVxdWlyZU92ZXJ3cml0ZVBlcm1pc3Npb25zKFxuICBndWlsZE9ySWQ6IGJpZ2ludCB8IERpc2NvcmRlbm9HdWlsZCxcbiAgb3ZlcndyaXRlczogT3ZlcndyaXRlW10sXG4pIHtcbiAgbGV0IHJlcXVpcmVkUGVybXM6IFNldDxQZXJtaXNzaW9uU3RyaW5ncz4gPSBuZXcgU2V0KFtcIk1BTkFHRV9DSEFOTkVMU1wiXSk7XG5cbiAgb3ZlcndyaXRlcz8uZm9yRWFjaCgob3ZlcndyaXRlKSA9PiB7XG4gICAgb3ZlcndyaXRlLmFsbG93LmZvckVhY2gocmVxdWlyZWRQZXJtcy5hZGQsIHJlcXVpcmVkUGVybXMpO1xuICAgIG92ZXJ3cml0ZS5kZW55LmZvckVhY2gocmVxdWlyZWRQZXJtcy5hZGQsIHJlcXVpcmVkUGVybXMpO1xuICB9KTtcblxuICAvLyBNQU5BR0VfUk9MRVMgcGVybWlzc2lvbiBjYW4gb25seSBiZSBzZXQgYnkgYWRtaW5pc3RyYXRvcnNcbiAgaWYgKHJlcXVpcmVkUGVybXMuaGFzKFwiTUFOQUdFX1JPTEVTXCIpKSB7XG4gICAgcmVxdWlyZWRQZXJtcyA9IG5ldyBTZXQ8UGVybWlzc2lvblN0cmluZ3M+KFtcIkFETUlOSVNUUkFUT1JcIl0pO1xuICB9XG5cbiAgYXdhaXQgcmVxdWlyZUd1aWxkUGVybWlzc2lvbnMoZ3VpbGRPcklkLCBib3RJZCwgWy4uLnJlcXVpcmVkUGVybXNdKTtcbn1cblxuLyoqIEdldHMgdGhlIGhpZ2hlc3Qgcm9sZSBmcm9tIHRoZSBtZW1iZXIgaW4gdGhpcyBndWlsZCAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhpZ2hlc3RSb2xlKFxuICBndWlsZE9ySWQ6IGJpZ2ludCB8IERpc2NvcmRlbm9HdWlsZCxcbiAgbWVtYmVyT3JJZDogYmlnaW50IHwgRGlzY29yZGVub01lbWJlcixcbikge1xuICBjb25zdCBndWlsZCA9IGF3YWl0IGdldENhY2hlZChcImd1aWxkc1wiLCBndWlsZE9ySWQpO1xuXG4gIGlmICghZ3VpbGQpIHRocm93IG5ldyBFcnJvcihFcnJvcnMuR1VJTERfTk9UX0ZPVU5EKTtcblxuICAvLyBHZXQgdGhlIHJvbGVzIGZyb20gdGhlIG1lbWJlclxuICBjb25zdCBtZW1iZXJSb2xlcyA9IChhd2FpdCBnZXRDYWNoZWQoXCJtZW1iZXJzXCIsIG1lbWJlck9ySWQpKT8uZ3VpbGRzLmdldChcbiAgICBndWlsZC5pZCxcbiAgKVxuICAgID8ucm9sZXM7XG4gIC8vIFRoaXMgbWVtYmVyIGhhcyBubyByb2xlcyBzbyB0aGUgaGlnaGVzdCBvbmUgaXMgdGhlIEBldmVyeW9uZSByb2xlXG4gIGlmICghbWVtYmVyUm9sZXMpIHJldHVybiBndWlsZC5yb2xlcy5nZXQoZ3VpbGQuaWQpITtcblxuICBsZXQgbWVtYmVySGlnaGVzdFJvbGU6IERpc2NvcmRlbm9Sb2xlIHwgdW5kZWZpbmVkO1xuXG4gIGZvciAoY29uc3Qgcm9sZUlkIG9mIG1lbWJlclJvbGVzKSB7XG4gICAgY29uc3Qgcm9sZSA9IGd1aWxkLnJvbGVzLmdldChyb2xlSWQpO1xuICAgIC8vIFJhcmUgZWRnZSBjYXNlIGhhbmRsaW5nIGlmIHVuZGVmaW5lZFxuICAgIGlmICghcm9sZSkgY29udGludWU7XG5cbiAgICAvLyBJZiBtZW1iZXJIaWdoZXN0Um9sZSBpcyBzdGlsbCB1bmRlZmluZWQgd2Ugd2FudCB0byBhc3NpZ24gdGhlIHJvbGUsXG4gICAgLy8gZWxzZSB3ZSB3YW50IHRvIGNoZWNrIGlmIHRoZSBjdXJyZW50IHJvbGUgcG9zaXRpb24gaXMgaGlnaGVyIHRoYW4gdGhlIGN1cnJlbnQgbWVtYmVySGlnaGVzdFJvbGVcbiAgICBpZiAoXG4gICAgICAhbWVtYmVySGlnaGVzdFJvbGUgfHxcbiAgICAgIG1lbWJlckhpZ2hlc3RSb2xlLnBvc2l0aW9uIDwgcm9sZS5wb3NpdGlvbiB8fFxuICAgICAgbWVtYmVySGlnaGVzdFJvbGUucG9zaXRpb24gPT09IHJvbGUucG9zaXRpb25cbiAgICApIHtcbiAgICAgIG1lbWJlckhpZ2hlc3RSb2xlID0gcm9sZTtcbiAgICB9XG4gIH1cblxuICAvLyBUaGUgbWVtYmVyIGhhcyBhdCBsZWFzdCBvbmUgcm9sZSBzbyBtZW1iZXJIaWdoZXN0Um9sZSBtdXN0IGV4aXN0XG4gIHJldHVybiBtZW1iZXJIaWdoZXN0Um9sZSE7XG59XG5cbi8qKiBDaGVja3MgaWYgdGhlIGZpcnN0IHJvbGUgaXMgaGlnaGVyIHRoYW4gdGhlIHNlY29uZCByb2xlICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGlnaGVyUm9sZVBvc2l0aW9uKFxuICBndWlsZE9ySWQ6IGJpZ2ludCB8IERpc2NvcmRlbm9HdWlsZCxcbiAgcm9sZUlkOiBiaWdpbnQsXG4gIG90aGVyUm9sZUlkOiBiaWdpbnQsXG4pIHtcbiAgY29uc3QgZ3VpbGQgPSBhd2FpdCBnZXRDYWNoZWQoXCJndWlsZHNcIiwgZ3VpbGRPcklkKTtcblxuICBpZiAoIWd1aWxkKSByZXR1cm4gdHJ1ZTtcblxuICBjb25zdCByb2xlID0gZ3VpbGQucm9sZXMuZ2V0KHJvbGVJZCk7XG4gIGNvbnN0IG90aGVyUm9sZSA9IGd1aWxkLnJvbGVzLmdldChvdGhlclJvbGVJZCk7XG4gIGlmICghcm9sZSB8fCAhb3RoZXJSb2xlKSB0aHJvdyBuZXcgRXJyb3IoRXJyb3JzLlJPTEVfTk9UX0ZPVU5EKTtcblxuICAvLyBSYXJlIGVkZ2UgY2FzZSBoYW5kbGluZ1xuICBpZiAocm9sZS5wb3NpdGlvbiA9PT0gb3RoZXJSb2xlLnBvc2l0aW9uKSB7XG4gICAgcmV0dXJuIHJvbGUuaWQgPCBvdGhlclJvbGUuaWQ7XG4gIH1cblxuICByZXR1cm4gcm9sZS5wb3NpdGlvbiA+IG90aGVyUm9sZS5wb3NpdGlvbjtcbn1cblxuLyoqIENoZWNrcyBpZiB0aGUgbWVtYmVyIGhhcyBhIGhpZ2hlciBwb3NpdGlvbiB0aGFuIHRoZSBnaXZlbiByb2xlICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaXNIaWdoZXJQb3NpdGlvbihcbiAgZ3VpbGRPcklkOiBiaWdpbnQgfCBEaXNjb3JkZW5vR3VpbGQsXG4gIG1lbWJlcklkOiBiaWdpbnQsXG4gIGNvbXBhcmVSb2xlSWQ6IGJpZ2ludCxcbikge1xuICBjb25zdCBndWlsZCA9IGF3YWl0IGdldENhY2hlZChcImd1aWxkc1wiLCBndWlsZE9ySWQpO1xuXG4gIGlmICghZ3VpbGQgfHwgZ3VpbGQub3duZXJJZCA9PT0gbWVtYmVySWQpIHJldHVybiB0cnVlO1xuXG4gIGNvbnN0IG1lbWJlckhpZ2hlc3RSb2xlID0gYXdhaXQgaGlnaGVzdFJvbGUoZ3VpbGQsIG1lbWJlcklkKTtcbiAgcmV0dXJuIGhpZ2hlclJvbGVQb3NpdGlvbihndWlsZC5pZCwgbWVtYmVySGlnaGVzdFJvbGUuaWQsIGNvbXBhcmVSb2xlSWQpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLEtBQUssU0FBUSxTQUFXO1NBQ3hCLGFBQWEsU0FBUSxXQUFhO1NBTWxDLE1BQU0sU0FBUSw2QkFBK0I7U0FDN0MsNkJBQTZCLFNBQVEsZ0RBQWtEO2VBZWpGLFNBQVMsQ0FDdEIsS0FBd0MsRUFDeEMsR0FBb0U7VUFFOUQsTUFBTSxVQUFVLEdBQUcsTUFBSyxNQUFRLFVBRTVCLGFBQWEsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsSUFDbEMsR0FBRztrQkFFTyxNQUFNLE1BQUssTUFBUSxJQUFHLFNBQVMsR0FBRyxNQUFNOztBQUd4RCxFQUFvRSxBQUFwRSxnRUFBb0UsQUFBcEUsRUFBb0UsdUJBQzlDLHdCQUF3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
