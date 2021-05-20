import { eventHandlers } from "../bot.ts";
import { cache } from "../cache.ts";
import { deleteRole } from "../helpers/roles/delete_role.ts";
import { editRole } from "../helpers/roles/edit_role.ts";
import { Errors } from "../types/discordeno/errors.ts";
import { snowflakeToBigint } from "../util/bigint.ts";
import { highestRole } from "../util/permissions.ts";
import { createNewProp } from "../util/utils.ts";
const ROLE_SNOWFLAKES = [
  "id",
  "botId",
  "integrationId",
  "guildId",
];
const roleToggles = {
  /** If this role is showed seperately in the user listing */ hoist: 1n,
  /** Whether this role is managed by an integration */ managed: 2n,
  /** Whether this role is mentionable */ mentionable: 4n,
  /** If this role is the nitro boost role. */ isNitroBoostRole: 8n,
};
const baseRole = {
  get guild() {
    return cache.guilds.get(this.guildId);
  },
  get hexColor() {
    return this.color.toString(16);
  },
  get members() {
    return cache.members.filter((m) =>
      m.guilds.some((g) => g.roles.includes(this.id))
    );
  },
  get mention() {
    return `<@&${this.id}>`;
  },
  // METHODS
  delete() {
    return deleteRole(this.guildId, this.id);
  },
  edit(options) {
    return editRole(this.guildId, this.id, options);
  },
  higherThanRole(roleId, position) {
    // If no position try and find one from cache
    if (!position) position = this.guild?.roles.get(roleId)?.position;
    // If still none error out.
    if (!position) {
      throw new Error(
        "role.higherThanRoleId() did not have a position provided and the role or guild was not found in cache. Please provide a position like role.higherThanRoleId(roleId, position)",
      );
    }
    // Rare edge case handling
    if (this.position === position) {
      return this.id < roleId;
    }
    return this.position > position;
  },
  async higherThanMember(memberId) {
    const guild = this.guild;
    if (!guild) throw new Error(Errors.GUILD_NOT_FOUND);
    if (guild.ownerId === memberId) return false;
    const memberHighestRole = await highestRole(guild, memberId);
    return this.higherThanRole(
      memberHighestRole.id,
      memberHighestRole.position,
    );
  },
  get hoist() {
    return Boolean(this.bitfield & roleToggles.hoist);
  },
  get managed() {
    return Boolean(this.bitfield & roleToggles.managed);
  },
  get mentionable() {
    return Boolean(this.bitfield & roleToggles.mentionable);
  },
  get isNitroBoostRole() {
    return Boolean(this.bitfield & roleToggles.isNitroBoostRole);
  },
};
// deno-lint-ignore require-await
export async function createDiscordenoRole(data) {
  const { tags = {}, ...rest } = {
    guildId: data.guildId,
    ...data.role,
  };
  let bitfield = 0n;
  const props = {};
  for (const [key, value] of Object.entries(rest)) {
    eventHandlers.debug?.(
      "loop",
      `Running for of loop in createDiscordenoRole function.`,
    );
    const toggleBits = roleToggles[key];
    if (toggleBits) {
      bitfield |= value ? toggleBits : 0n;
      continue;
    }
    props[key] = createNewProp(
      ROLE_SNOWFLAKES.includes(key)
        ? value ? snowflakeToBigint(value) : undefined
        : value,
    );
  }
  const role = Object.create(baseRole, {
    ...props,
    botId: createNewProp(
      tags.botId ? snowflakeToBigint(tags.botId) : undefined,
    ),
    isNitroBoostRole: createNewProp("premiumSubscriber" in tags),
    integrationId: createNewProp(
      tags.integrationId ? snowflakeToBigint(tags.integrationId) : undefined,
    ),
    bitfield: createNewProp(bitfield),
  });
  return role;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3N0cnVjdHVyZXMvcm9sZS50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXZlbnRIYW5kbGVycyB9IGZyb20gXCIuLi9ib3QudHNcIjtcbmltcG9ydCB7IGNhY2hlIH0gZnJvbSBcIi4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgeyBkZWxldGVSb2xlIH0gZnJvbSBcIi4uL2hlbHBlcnMvcm9sZXMvZGVsZXRlX3JvbGUudHNcIjtcbmltcG9ydCB7IGVkaXRSb2xlIH0gZnJvbSBcIi4uL2hlbHBlcnMvcm9sZXMvZWRpdF9yb2xlLnRzXCI7XG5pbXBvcnQgeyBDcmVhdGVHdWlsZFJvbGUgfSBmcm9tIFwiLi4vdHlwZXMvZ3VpbGRzL2NyZWF0ZV9ndWlsZF9yb2xlLnRzXCI7XG5pbXBvcnQgeyBFcnJvcnMgfSBmcm9tIFwiLi4vdHlwZXMvZGlzY29yZGVuby9lcnJvcnMudHNcIjtcbmltcG9ydCB0eXBlIHsgUm9sZSB9IGZyb20gXCIuLi90eXBlcy9wZXJtaXNzaW9ucy9yb2xlLnRzXCI7XG5pbXBvcnQgeyBzbm93Zmxha2VUb0JpZ2ludCB9IGZyb20gXCIuLi91dGlsL2JpZ2ludC50c1wiO1xuaW1wb3J0IHsgQ29sbGVjdGlvbiB9IGZyb20gXCIuLi91dGlsL2NvbGxlY3Rpb24udHNcIjtcbmltcG9ydCB7IGhpZ2hlc3RSb2xlIH0gZnJvbSBcIi4uL3V0aWwvcGVybWlzc2lvbnMudHNcIjtcbmltcG9ydCB7IGNyZWF0ZU5ld1Byb3AgfSBmcm9tIFwiLi4vdXRpbC91dGlscy50c1wiO1xuaW1wb3J0IHsgRGlzY29yZGVub0d1aWxkIH0gZnJvbSBcIi4vZ3VpbGQudHNcIjtcbmltcG9ydCB7IERpc2NvcmRlbm9NZW1iZXIgfSBmcm9tIFwiLi9tZW1iZXIudHNcIjtcblxuY29uc3QgUk9MRV9TTk9XRkxBS0VTID0gW1xuICBcImlkXCIsXG4gIFwiYm90SWRcIixcbiAgXCJpbnRlZ3JhdGlvbklkXCIsXG4gIFwiZ3VpbGRJZFwiLFxuXTtcblxuY29uc3Qgcm9sZVRvZ2dsZXMgPSB7XG4gIC8qKiBJZiB0aGlzIHJvbGUgaXMgc2hvd2VkIHNlcGVyYXRlbHkgaW4gdGhlIHVzZXIgbGlzdGluZyAqL1xuICBob2lzdDogMW4sXG4gIC8qKiBXaGV0aGVyIHRoaXMgcm9sZSBpcyBtYW5hZ2VkIGJ5IGFuIGludGVncmF0aW9uICovXG4gIG1hbmFnZWQ6IDJuLFxuICAvKiogV2hldGhlciB0aGlzIHJvbGUgaXMgbWVudGlvbmFibGUgKi9cbiAgbWVudGlvbmFibGU6IDRuLFxuICAvKiogSWYgdGhpcyByb2xlIGlzIHRoZSBuaXRybyBib29zdCByb2xlLiAqL1xuICBpc05pdHJvQm9vc3RSb2xlOiA4bixcbn07XG5cbmNvbnN0IGJhc2VSb2xlOiBQYXJ0aWFsPERpc2NvcmRlbm9Sb2xlPiA9IHtcbiAgZ2V0IGd1aWxkKCkge1xuICAgIHJldHVybiBjYWNoZS5ndWlsZHMuZ2V0KHRoaXMuZ3VpbGRJZCEpO1xuICB9LFxuICBnZXQgaGV4Q29sb3IoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29sb3IhLnRvU3RyaW5nKDE2KTtcbiAgfSxcbiAgZ2V0IG1lbWJlcnMoKSB7XG4gICAgcmV0dXJuIGNhY2hlLm1lbWJlcnMuZmlsdGVyKChtKSA9PlxuICAgICAgbS5ndWlsZHMuc29tZSgoZykgPT4gZy5yb2xlcy5pbmNsdWRlcyh0aGlzLmlkISkpXG4gICAgKTtcbiAgfSxcbiAgZ2V0IG1lbnRpb24oKSB7XG4gICAgcmV0dXJuIGA8QCYke3RoaXMuaWR9PmA7XG4gIH0sXG5cbiAgLy8gTUVUSE9EU1xuICBkZWxldGUoKSB7XG4gICAgcmV0dXJuIGRlbGV0ZVJvbGUodGhpcy5ndWlsZElkISwgdGhpcy5pZCEpO1xuICB9LFxuICBlZGl0KG9wdGlvbnMpIHtcbiAgICByZXR1cm4gZWRpdFJvbGUodGhpcy5ndWlsZElkISwgdGhpcy5pZCEsIG9wdGlvbnMpO1xuICB9LFxuICBoaWdoZXJUaGFuUm9sZShyb2xlSWQ6IGJpZ2ludCwgcG9zaXRpb24/OiBudW1iZXIpIHtcbiAgICAvLyBJZiBubyBwb3NpdGlvbiB0cnkgYW5kIGZpbmQgb25lIGZyb20gY2FjaGVcbiAgICBpZiAoIXBvc2l0aW9uKSBwb3NpdGlvbiA9IHRoaXMuZ3VpbGQ/LnJvbGVzLmdldChyb2xlSWQpPy5wb3NpdGlvbjtcbiAgICAvLyBJZiBzdGlsbCBub25lIGVycm9yIG91dC5cbiAgICBpZiAoIXBvc2l0aW9uKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwicm9sZS5oaWdoZXJUaGFuUm9sZUlkKCkgZGlkIG5vdCBoYXZlIGEgcG9zaXRpb24gcHJvdmlkZWQgYW5kIHRoZSByb2xlIG9yIGd1aWxkIHdhcyBub3QgZm91bmQgaW4gY2FjaGUuIFBsZWFzZSBwcm92aWRlIGEgcG9zaXRpb24gbGlrZSByb2xlLmhpZ2hlclRoYW5Sb2xlSWQocm9sZUlkLCBwb3NpdGlvbilcIixcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gUmFyZSBlZGdlIGNhc2UgaGFuZGxpbmdcbiAgICBpZiAodGhpcy5wb3NpdGlvbiA9PT0gcG9zaXRpb24pIHtcbiAgICAgIHJldHVybiB0aGlzLmlkISA8IHJvbGVJZDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5wb3NpdGlvbiEgPiBwb3NpdGlvbjtcbiAgfSxcbiAgYXN5bmMgaGlnaGVyVGhhbk1lbWJlcihtZW1iZXJJZDogYmlnaW50KSB7XG4gICAgY29uc3QgZ3VpbGQgPSB0aGlzLmd1aWxkO1xuICAgIGlmICghZ3VpbGQpIHRocm93IG5ldyBFcnJvcihFcnJvcnMuR1VJTERfTk9UX0ZPVU5EKTtcblxuICAgIGlmIChndWlsZC5vd25lcklkID09PSBtZW1iZXJJZCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgY29uc3QgbWVtYmVySGlnaGVzdFJvbGUgPSBhd2FpdCBoaWdoZXN0Um9sZShndWlsZCwgbWVtYmVySWQpO1xuICAgIHJldHVybiB0aGlzLmhpZ2hlclRoYW5Sb2xlIShcbiAgICAgIG1lbWJlckhpZ2hlc3RSb2xlLmlkLFxuICAgICAgbWVtYmVySGlnaGVzdFJvbGUucG9zaXRpb24sXG4gICAgKTtcbiAgfSxcbiAgZ2V0IGhvaXN0KCkge1xuICAgIHJldHVybiBCb29sZWFuKHRoaXMuYml0ZmllbGQhICYgcm9sZVRvZ2dsZXMuaG9pc3QpO1xuICB9LFxuICBnZXQgbWFuYWdlZCgpIHtcbiAgICByZXR1cm4gQm9vbGVhbih0aGlzLmJpdGZpZWxkISAmIHJvbGVUb2dnbGVzLm1hbmFnZWQpO1xuICB9LFxuICBnZXQgbWVudGlvbmFibGUoKSB7XG4gICAgcmV0dXJuIEJvb2xlYW4odGhpcy5iaXRmaWVsZCEgJiByb2xlVG9nZ2xlcy5tZW50aW9uYWJsZSk7XG4gIH0sXG4gIGdldCBpc05pdHJvQm9vc3RSb2xlKCkge1xuICAgIHJldHVybiBCb29sZWFuKHRoaXMuYml0ZmllbGQhICYgcm9sZVRvZ2dsZXMuaXNOaXRyb0Jvb3N0Um9sZSk7XG4gIH0sXG59O1xuXG4vLyBkZW5vLWxpbnQtaWdub3JlIHJlcXVpcmUtYXdhaXRcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVEaXNjb3JkZW5vUm9sZShcbiAgZGF0YTogeyByb2xlOiBSb2xlIH0gJiB7XG4gICAgZ3VpbGRJZDogYmlnaW50O1xuICB9LFxuKSB7XG4gIGNvbnN0IHtcbiAgICB0YWdzID0ge30sXG4gICAgLi4ucmVzdFxuICB9ID0gKHsgZ3VpbGRJZDogZGF0YS5ndWlsZElkLCAuLi5kYXRhLnJvbGUgfSk7XG5cbiAgbGV0IGJpdGZpZWxkID0gMG47XG5cbiAgY29uc3QgcHJvcHM6IFJlY29yZDxzdHJpbmcsIFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZU5ld1Byb3A+PiA9IHt9O1xuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhyZXN0KSkge1xuICAgIGV2ZW50SGFuZGxlcnMuZGVidWc/LihcbiAgICAgIFwibG9vcFwiLFxuICAgICAgYFJ1bm5pbmcgZm9yIG9mIGxvb3AgaW4gY3JlYXRlRGlzY29yZGVub1JvbGUgZnVuY3Rpb24uYCxcbiAgICApO1xuXG4gICAgY29uc3QgdG9nZ2xlQml0cyA9IHJvbGVUb2dnbGVzW2tleSBhcyBrZXlvZiB0eXBlb2Ygcm9sZVRvZ2dsZXNdO1xuICAgIGlmICh0b2dnbGVCaXRzKSB7XG4gICAgICBiaXRmaWVsZCB8PSB2YWx1ZSA/IHRvZ2dsZUJpdHMgOiAwbjtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHByb3BzW2tleV0gPSBjcmVhdGVOZXdQcm9wKFxuICAgICAgUk9MRV9TTk9XRkxBS0VTLmluY2x1ZGVzKGtleSlcbiAgICAgICAgPyB2YWx1ZSA/IHNub3dmbGFrZVRvQmlnaW50KHZhbHVlKSA6IHVuZGVmaW5lZFxuICAgICAgICA6IHZhbHVlLFxuICAgICk7XG4gIH1cblxuICBjb25zdCByb2xlOiBEaXNjb3JkZW5vUm9sZSA9IE9iamVjdC5jcmVhdGUoYmFzZVJvbGUsIHtcbiAgICAuLi5wcm9wcyxcbiAgICBib3RJZDogY3JlYXRlTmV3UHJvcChcbiAgICAgIHRhZ3MuYm90SWQgPyBzbm93Zmxha2VUb0JpZ2ludCh0YWdzLmJvdElkKSA6IHVuZGVmaW5lZCxcbiAgICApLFxuICAgIGlzTml0cm9Cb29zdFJvbGU6IGNyZWF0ZU5ld1Byb3AoXCJwcmVtaXVtU3Vic2NyaWJlclwiIGluIHRhZ3MpLFxuICAgIGludGVncmF0aW9uSWQ6IGNyZWF0ZU5ld1Byb3AoXG4gICAgICB0YWdzLmludGVncmF0aW9uSWQgPyBzbm93Zmxha2VUb0JpZ2ludCh0YWdzLmludGVncmF0aW9uSWQpIDogdW5kZWZpbmVkLFxuICAgICksXG4gICAgYml0ZmllbGQ6IGNyZWF0ZU5ld1Byb3AoYml0ZmllbGQpLFxuICB9KTtcblxuICByZXR1cm4gcm9sZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEaXNjb3JkZW5vUm9sZSBleHRlbmRzIE9taXQ8Um9sZSwgXCJ0YWdzXCIgfCBcImlkXCI+IHtcbiAgLyoqIFRoZSByb2xlIGlkICovXG4gIGlkOiBiaWdpbnQ7XG4gIC8qKiBUaGUgYm90IGlkIHRoYXQgaXMgYXNzb2NpYXRlZCB3aXRoIHRoaXMgcm9sZS4gKi9cbiAgYm90SWQ/OiBiaWdpbnQ7XG4gIC8qKiBJZiB0aGlzIHJvbGUgaXMgdGhlIG5pdHJvIGJvb3N0IHJvbGUuICovXG4gIGlzTml0cm9Cb29zdFJvbGU6IGJvb2xlYW47XG4gIC8qKiBUaGUgaW50ZWdyYXRpb24gaWQgdGhhdCBpcyBhc3NvY2lhdGVkIHdpdGggdGhpcyByb2xlICovXG4gIGludGVncmF0aW9uSWQ6IGJpZ2ludDtcbiAgLyoqIFRoZSByb2xlcyBndWlsZElkICovXG4gIGd1aWxkSWQ6IGJpZ2ludDtcbiAgLyoqIEhvbGRzIGFsbCB0aGUgYm9vbGVhbiB0b2dnbGVzLiAqL1xuICBiaXRmaWVsZDogYmlnaW50O1xuXG4gIC8vIEdFVFRFUlNcblxuICAvKiogVGhlIGd1aWxkIHdoZXJlIHRoaXMgcm9sZSBpcy4gSWYgdW5kZWZpbmVkLCB0aGUgZ3VpbGQgaXMgbm90IGNhY2hlZCAqL1xuICBndWlsZD86IERpc2NvcmRlbm9HdWlsZDtcbiAgLyoqIFRoZSBoZXggY29sb3IgZm9yIHRoaXMgcm9sZS4gKi9cbiAgaGV4Q29sb3I6IHN0cmluZztcbiAgLyoqIFRoZSBjYWNoZWQgbWVtYmVycyB0aGF0IGhhdmUgdGhpcyByb2xlICovXG4gIG1lbWJlcnM6IENvbGxlY3Rpb248YmlnaW50LCBEaXNjb3JkZW5vTWVtYmVyPjtcbiAgLyoqIFRoZSBAIG1lbnRpb24gb2YgdGhlIHJvbGUgaW4gYSBzdHJpbmcuICovXG4gIG1lbnRpb246IHN0cmluZztcblxuICAvLyBNRVRIT0RTXG5cbiAgLyoqIERlbGV0ZSB0aGUgcm9sZSAqL1xuICBkZWxldGUoKTogUmV0dXJuVHlwZTx0eXBlb2YgZGVsZXRlUm9sZT47XG4gIC8qKiBFZGl0cyB0aGUgcm9sZSAqL1xuICBlZGl0KG9wdGlvbnM6IENyZWF0ZUd1aWxkUm9sZSk6IFJldHVyblR5cGU8dHlwZW9mIGVkaXRSb2xlPjtcbiAgLyoqIENoZWNrcyBpZiB0aGlzIHJvbGUgaXMgaGlnaGVyIHRoYW4gYW5vdGhlciByb2xlLiAqL1xuICBoaWdoZXJUaGFuUm9sZShyb2xlSWQ6IGJpZ2ludCwgcG9zaXRpb24/OiBudW1iZXIpOiBib29sZWFuO1xuICAvKiogQ2hlY2tzIGlmIHRoZSByb2xlIGhhcyBhIGhpZ2hlciBwb3NpdGlvbiB0aGFuIHRoZSBnaXZlbiBtZW1iZXIgKi9cbiAgaGlnaGVyVGhhbk1lbWJlcihtZW1iZXJJZDogYmlnaW50KTogUHJvbWlzZTxib29sZWFuPjtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxhQUFhLFNBQVEsU0FBVztTQUNoQyxLQUFLLFNBQVEsV0FBYTtTQUMxQixVQUFVLFNBQVEsK0JBQWlDO1NBQ25ELFFBQVEsU0FBUSw2QkFBK0I7U0FFL0MsTUFBTSxTQUFRLDZCQUErQjtTQUU3QyxpQkFBaUIsU0FBUSxpQkFBbUI7U0FFNUMsV0FBVyxTQUFRLHNCQUF3QjtTQUMzQyxhQUFhLFNBQVEsZ0JBQWtCO01BSTFDLGVBQWU7S0FDbkIsRUFBSTtLQUNKLEtBQU87S0FDUCxhQUFlO0tBQ2YsT0FBUzs7TUFHTCxXQUFXO0lBQ2YsRUFBNEQsQUFBNUQsd0RBQTRELEFBQTVELEVBQTRELENBQzVELEtBQUssRUFBRSxDQUFFLEFBQUYsQ0FBRTtJQUNULEVBQXFELEFBQXJELGlEQUFxRCxBQUFyRCxFQUFxRCxDQUNyRCxPQUFPLEVBQUUsQ0FBRSxBQUFGLENBQUU7SUFDWCxFQUF1QyxBQUF2QyxtQ0FBdUMsQUFBdkMsRUFBdUMsQ0FDdkMsV0FBVyxFQUFFLENBQUUsQUFBRixDQUFFO0lBQ2YsRUFBNEMsQUFBNUMsd0NBQTRDLEFBQTVDLEVBQTRDLENBQzVDLGdCQUFnQixFQUFFLENBQUUsQUFBRixDQUFFOztNQUdoQixRQUFRO1FBQ1IsS0FBSztlQUNBLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxNQUFNLE9BQU87O1FBRWxDLFFBQVE7b0JBQ0UsS0FBSyxDQUFFLFFBQVEsQ0FBQyxF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