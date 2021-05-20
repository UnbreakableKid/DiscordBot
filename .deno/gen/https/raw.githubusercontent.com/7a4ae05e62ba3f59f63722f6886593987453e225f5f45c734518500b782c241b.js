import { eventHandlers } from "../bot.ts";
import { cache } from "../cache.ts";
import { snowflakeToBigint } from "../util/bigint.ts";
import { createNewProp } from "../util/utils.ts";
const VOICE_STATE_SNOWFLAKES = [
  "userId",
  "channelId",
  "guildId",
];
export const voiceStateToggles = {
  /** Whether this user is deafened by the server */ deaf: 1n,
  /** Whether this user is muted by the server */ mute: 2n,
  /** Whether this user is locally deafened */ selfDeaf: 4n,
  /** Whether this user is locally muted */ selfMute: 8n,
  /** Whether this user is streaming using "Go Live" */ selfStream: 16n,
  /** Whether this user's camera is enabled */ selfVideo: 32n,
  /** Whether this user is muted by the current user */ suppress: 64n,
};
const baseRole = {
  get member() {
    return cache.members.get(this.userId);
  },
  get guildMember() {
    return this.member?.guilds.get(this.guildId);
  },
  get guild() {
    return cache.guilds.get(this.guildId);
  },
  get deaf() {
    return Boolean(this.bitfield & voiceStateToggles.deaf);
  },
  get mute() {
    return Boolean(this.bitfield & voiceStateToggles.mute);
  },
  get selfDeaf() {
    return Boolean(this.bitfield & voiceStateToggles.selfDeaf);
  },
  get selfMute() {
    return Boolean(this.bitfield & voiceStateToggles.selfMute);
  },
  get selfStream() {
    return Boolean(this.bitfield & voiceStateToggles.selfStream);
  },
  get selfVideo() {
    return Boolean(this.bitfield & voiceStateToggles.selfVideo);
  },
  get suppress() {
    return Boolean(this.bitfield & voiceStateToggles.suppress);
  },
};
// deno-lint-ignore require-await
export async function createDiscordenoVoiceState(guildId, data) {
  let bitfield = 0n;
  const props = {};
  for (const [key, value] of Object.entries(data)) {
    eventHandlers.debug?.(
      "loop",
      `Running for of loop in createDiscordenoVoiceState function.`,
    );
    // We don't need to cache member twice. It will be in cache.members
    if (key === "member") continue;
    const toggleBits = voiceStateToggles[key];
    if (toggleBits) {
      bitfield |= value ? toggleBits : 0n;
      continue;
    }
    props[key] = createNewProp(
      VOICE_STATE_SNOWFLAKES.includes(key)
        ? value ? snowflakeToBigint(value) : undefined
        : value,
    );
  }
  const voiceState = Object.create(baseRole, {
    ...props,
    guildId: createNewProp(guildId),
    bitfield: createNewProp(bitfield),
  });
  return voiceState;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3N0cnVjdHVyZXMvdm9pY2Vfc3RhdGUudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV2ZW50SGFuZGxlcnMgfSBmcm9tIFwiLi4vYm90LnRzXCI7XG5pbXBvcnQgeyBjYWNoZSB9IGZyb20gXCIuLi9jYWNoZS50c1wiO1xuaW1wb3J0IHR5cGUgeyBHdWlsZE1lbWJlciB9IGZyb20gXCIuLi90eXBlcy9tZW1iZXJzL2d1aWxkX21lbWJlci50c1wiO1xuaW1wb3J0IHR5cGUgeyBWb2ljZVN0YXRlIH0gZnJvbSBcIi4uL3R5cGVzL3ZvaWNlL3ZvaWNlX3N0YXRlLnRzXCI7XG5pbXBvcnQgeyBzbm93Zmxha2VUb0JpZ2ludCB9IGZyb20gXCIuLi91dGlsL2JpZ2ludC50c1wiO1xuaW1wb3J0IHsgY3JlYXRlTmV3UHJvcCB9IGZyb20gXCIuLi91dGlsL3V0aWxzLnRzXCI7XG5pbXBvcnQgeyBEaXNjb3JkZW5vR3VpbGQgfSBmcm9tIFwiLi9ndWlsZC50c1wiO1xuaW1wb3J0IHsgRGlzY29yZGVub01lbWJlciB9IGZyb20gXCIuL21lbWJlci50c1wiO1xuXG5jb25zdCBWT0lDRV9TVEFURV9TTk9XRkxBS0VTID0gW1xuICBcInVzZXJJZFwiLFxuICBcImNoYW5uZWxJZFwiLFxuICBcImd1aWxkSWRcIixcbl07XG5cbmV4cG9ydCBjb25zdCB2b2ljZVN0YXRlVG9nZ2xlcyA9IHtcbiAgLyoqIFdoZXRoZXIgdGhpcyB1c2VyIGlzIGRlYWZlbmVkIGJ5IHRoZSBzZXJ2ZXIgKi9cbiAgZGVhZjogMW4sXG4gIC8qKiBXaGV0aGVyIHRoaXMgdXNlciBpcyBtdXRlZCBieSB0aGUgc2VydmVyICovXG4gIG11dGU6IDJuLFxuICAvKiogV2hldGhlciB0aGlzIHVzZXIgaXMgbG9jYWxseSBkZWFmZW5lZCAqL1xuICBzZWxmRGVhZjogNG4sXG4gIC8qKiBXaGV0aGVyIHRoaXMgdXNlciBpcyBsb2NhbGx5IG11dGVkICovXG4gIHNlbGZNdXRlOiA4bixcbiAgLyoqIFdoZXRoZXIgdGhpcyB1c2VyIGlzIHN0cmVhbWluZyB1c2luZyBcIkdvIExpdmVcIiAqL1xuICBzZWxmU3RyZWFtOiAxNm4sXG4gIC8qKiBXaGV0aGVyIHRoaXMgdXNlcidzIGNhbWVyYSBpcyBlbmFibGVkICovXG4gIHNlbGZWaWRlbzogMzJuLFxuICAvKiogV2hldGhlciB0aGlzIHVzZXIgaXMgbXV0ZWQgYnkgdGhlIGN1cnJlbnQgdXNlciAqL1xuICBzdXBwcmVzczogNjRuLFxufTtcblxuY29uc3QgYmFzZVJvbGU6IFBhcnRpYWw8RGlzY29yZGVub1ZvaWNlU3RhdGU+ID0ge1xuICBnZXQgbWVtYmVyKCkge1xuICAgIHJldHVybiBjYWNoZS5tZW1iZXJzLmdldCh0aGlzLnVzZXJJZCEpO1xuICB9LFxuICBnZXQgZ3VpbGRNZW1iZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMubWVtYmVyPy5ndWlsZHMuZ2V0KHRoaXMuZ3VpbGRJZCEpO1xuICB9LFxuICBnZXQgZ3VpbGQoKSB7XG4gICAgcmV0dXJuIGNhY2hlLmd1aWxkcy5nZXQodGhpcy5ndWlsZElkISk7XG4gIH0sXG4gIGdldCBkZWFmKCkge1xuICAgIHJldHVybiBCb29sZWFuKHRoaXMuYml0ZmllbGQhICYgdm9pY2VTdGF0ZVRvZ2dsZXMuZGVhZik7XG4gIH0sXG4gIGdldCBtdXRlKCkge1xuICAgIHJldHVybiBCb29sZWFuKHRoaXMuYml0ZmllbGQhICYgdm9pY2VTdGF0ZVRvZ2dsZXMubXV0ZSk7XG4gIH0sXG4gIGdldCBzZWxmRGVhZigpIHtcbiAgICByZXR1cm4gQm9vbGVhbih0aGlzLmJpdGZpZWxkISAmIHZvaWNlU3RhdGVUb2dnbGVzLnNlbGZEZWFmKTtcbiAgfSxcbiAgZ2V0IHNlbGZNdXRlKCkge1xuICAgIHJldHVybiBCb29sZWFuKHRoaXMuYml0ZmllbGQhICYgdm9pY2VTdGF0ZVRvZ2dsZXMuc2VsZk11dGUpO1xuICB9LFxuICBnZXQgc2VsZlN0cmVhbSgpIHtcbiAgICByZXR1cm4gQm9vbGVhbih0aGlzLmJpdGZpZWxkISAmIHZvaWNlU3RhdGVUb2dnbGVzLnNlbGZTdHJlYW0pO1xuICB9LFxuICBnZXQgc2VsZlZpZGVvKCkge1xuICAgIHJldHVybiBCb29sZWFuKHRoaXMuYml0ZmllbGQhICYgdm9pY2VTdGF0ZVRvZ2dsZXMuc2VsZlZpZGVvKTtcbiAgfSxcbiAgZ2V0IHN1cHByZXNzKCkge1xuICAgIHJldHVybiBCb29sZWFuKHRoaXMuYml0ZmllbGQhICYgdm9pY2VTdGF0ZVRvZ2dsZXMuc3VwcHJlc3MpO1xuICB9LFxufTtcblxuLy8gZGVuby1saW50LWlnbm9yZSByZXF1aXJlLWF3YWl0XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlRGlzY29yZGVub1ZvaWNlU3RhdGUoXG4gIGd1aWxkSWQ6IGJpZ2ludCxcbiAgZGF0YTogVm9pY2VTdGF0ZSxcbikge1xuICBsZXQgYml0ZmllbGQgPSAwbjtcblxuICBjb25zdCBwcm9wczogUmVjb3JkPHN0cmluZywgUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlTmV3UHJvcD4+ID0ge307XG4gIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKGRhdGEpKSB7XG4gICAgZXZlbnRIYW5kbGVycy5kZWJ1Zz8uKFxuICAgICAgXCJsb29wXCIsXG4gICAgICBgUnVubmluZyBmb3Igb2YgbG9vcCBpbiBjcmVhdGVEaXNjb3JkZW5vVm9pY2VTdGF0ZSBmdW5jdGlvbi5gLFxuICAgICk7XG5cbiAgICAvLyBXZSBkb24ndCBuZWVkIHRvIGNhY2hlIG1lbWJlciB0d2ljZS4gSXQgd2lsbCBiZSBpbiBjYWNoZS5tZW1iZXJzXG4gICAgaWYgKGtleSA9PT0gXCJtZW1iZXJcIikgY29udGludWU7XG5cbiAgICBjb25zdCB0b2dnbGVCaXRzID0gdm9pY2VTdGF0ZVRvZ2dsZXNba2V5IGFzIGtleW9mIHR5cGVvZiB2b2ljZVN0YXRlVG9nZ2xlc107XG4gICAgaWYgKHRvZ2dsZUJpdHMpIHtcbiAgICAgIGJpdGZpZWxkIHw9IHZhbHVlID8gdG9nZ2xlQml0cyA6IDBuO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcHJvcHNba2V5XSA9IGNyZWF0ZU5ld1Byb3AoXG4gICAgICBWT0lDRV9TVEFURV9TTk9XRkxBS0VTLmluY2x1ZGVzKGtleSlcbiAgICAgICAgPyB2YWx1ZSA/IHNub3dmbGFrZVRvQmlnaW50KHZhbHVlKSA6IHVuZGVmaW5lZFxuICAgICAgICA6IHZhbHVlLFxuICAgICk7XG4gIH1cblxuICBjb25zdCB2b2ljZVN0YXRlOiBEaXNjb3JkZW5vVm9pY2VTdGF0ZSA9IE9iamVjdC5jcmVhdGUoYmFzZVJvbGUsIHtcbiAgICAuLi5wcm9wcyxcbiAgICBndWlsZElkOiBjcmVhdGVOZXdQcm9wKGd1aWxkSWQpLFxuICAgIGJpdGZpZWxkOiBjcmVhdGVOZXdQcm9wKGJpdGZpZWxkKSxcbiAgfSk7XG5cbiAgcmV0dXJuIHZvaWNlU3RhdGU7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGlzY29yZGVub1ZvaWNlU3RhdGVcbiAgZXh0ZW5kcyBPbWl0PFZvaWNlU3RhdGUsIFwiY2hhbm5lbElkXCIgfCBcImd1aWxkSWRcIiB8IFwidXNlcklkXCIgfCBcIm1lbWJlclwiPiB7XG4gIC8qKiBUaGUgZ3VpbGQgaWQgKi9cbiAgZ3VpbGRJZDogYmlnaW50O1xuICAvKiogVGhlIGNoYW5uZWwgaWQgdGhpcyB1c2VyIGlzIGNvbm5lY3RlZCB0byAqL1xuICBjaGFubmVsSWQ/OiBiaWdpbnQ7XG4gIC8qKiBUaGUgdXNlciBpZCB0aGlzIHZvaWNlIHN0YXRlIGlzIGZvciAqL1xuICB1c2VySWQ6IGJpZ2ludDtcbiAgLyoqIEhvbGRzIGFsbCB0aGUgYm9vbGVhbiB0b2dnbGVzLiAqL1xuICBiaXRmaWVsZDogYmlnaW50O1xuXG4gIC8vIEdFVFRFUlNcbiAgbWVtYmVyOiBEaXNjb3JkZW5vTWVtYmVyO1xuICBndWlsZE1lbWJlcj86IE9taXQ8R3VpbGRNZW1iZXIsIFwiam9pbmVkQXRcIiB8IFwicHJlbWl1bVNpbmNlXCIgfCBcInJvbGVzXCI+ICYge1xuICAgIGpvaW5lZEF0PzogbnVtYmVyO1xuICAgIHByZW1pdW1TaW5jZT86IG51bWJlcjtcbiAgICByb2xlczogYmlnaW50W107XG4gIH07XG4gIC8qKiBUaGUgZ3VpbGQgd2hlcmUgdGhpcyByb2xlIGlzLiBJZiB1bmRlZmluZWQsIHRoZSBndWlsZCBpcyBub3QgY2FjaGVkICovXG4gIGd1aWxkPzogRGlzY29yZGVub0d1aWxkO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLGFBQWEsU0FBUSxTQUFXO1NBQ2hDLEtBQUssU0FBUSxXQUFhO1NBRzFCLGlCQUFpQixTQUFRLGlCQUFtQjtTQUM1QyxhQUFhLFNBQVEsZ0JBQWtCO01BSTFDLHNCQUFzQjtLQUMxQixNQUFRO0tBQ1IsU0FBVztLQUNYLE9BQVM7O2FBR0UsaUJBQWlCO0lBQzVCLEVBQWtELEFBQWxELDhDQUFrRCxBQUFsRCxFQUFrRCxDQUNsRCxJQUFJLEVBQUUsQ0FBRSxBQUFGLENBQUU7SUFDUixFQUErQyxBQUEvQywyQ0FBK0MsQUFBL0MsRUFBK0MsQ0FDL0MsSUFBSSxFQUFFLENBQUUsQUFBRixDQUFFO0lBQ1IsRUFBNEMsQUFBNUMsd0NBQTRDLEFBQTVDLEVBQTRDLENBQzVDLFFBQVEsRUFBRSxDQUFFLEFBQUYsQ0FBRTtJQUNaLEVBQXlDLEFBQXpDLHFDQUF5QyxBQUF6QyxFQUF5QyxDQUN6QyxRQUFRLEVBQUUsQ0FBRSxBQUFGLENBQUU7SUFDWixFQUFxRCxBQUFyRCxpREFBcUQsQUFBckQsRUFBcUQsQ0FDckQsVUFBVSxFQUFFLEVBQUcsQUFBSCxDQUFHO0lBQ2YsRUFBNEMsQUFBNUMsd0NBQTRDLEFBQTVDLEVBQTRDLENBQzVDLFNBQVMsRUFBRSxFQUFHLEFBQUgsQ0FBRztJQUNkLEVBQXFELEFBQXJELGlEQUFxRCxBQUFyRCxFQUFxRCxDQUNyRCxRQUFRLEVBQUUsRUFBRyxBQUFILENBQUc7O01BR1QsUUFBUTtRQUNSLE1BQU07ZUFDRCxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsTUFBTSxNQUFNOztRQUVsQyxXQUFXO29CQUNELE1BQU0sRUFBRSxNQUFNLENBQUMsR0FBRyxNQUFNLE9BQU87O1FBRXpDLEtBQUs7ZUFDQSxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsTUFBTSxPQUFPOztRQUVsQyxJQUFJO2VBQ0MsT0FBTyxNQUFNLFFBQVEsR0FBSSxpQkFBaUIsQ0FBQyxJQUFJOztRQUVwRCxJQUFJO2VBQ0MsT0FBTyxNQUFNLFFBQVEsR0FBSSxpQkFBaUIsQ0FBQyxJQUFJOztRQUVwRCxRQUFRO2VBQ0gsT0FBTyxNQUFNLFFBQVEsR0FBSSxpQkFBaUIsQ0FBQyxRQUFROztRQUV4RCxRQUFRO2VBQ0gsT0FBTyxNQUFNLFFBQVEsR0FBSSxpQkFBaUIsQ0FBQyxRQUFROztRQUV4RCxVQUFVO2VBQ0wsT0FBTyxNQUFNLFFBQVEsR0FBSSxpQkFBaUIsQ0FBQyxVQUFVOztRQUUxRCxTQUFTO2VBQ0osT0FBTyxNQUFNLFFBQVEsR0FBSSxpQkFBaUIsQ0FBQyxTQUFTOztRQUV6RCxRQUFRO2VBQ0gsT0FBTyxNQUFNLFFBQVEsR0FBSSxpQkFBaUIsQ0FBQyxRQUFROzs7QUFJOUQsRUFBaUMsQUFBakMsK0JBQWlDO3NCQUNYLDBCQUEwQixDQUM5QyxPQUFlLEVBQ2YsSUFBZ0I7UUFFWixRQUFRLEdBQUcsQ0FBRSxBQUFGLENBQUU7VUFFWCxLQUFLOztnQkFDQyxHQUFHLEVBQUUsS0FBSyxLQUFLLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSTtRQUM1QyxhQUFhLENBQUMsS0FBSyxJQUNqQixJQUFNLElBQ0wsMkRBQTJEO1FBRzlELEVBQW1FLEFBQW5FLGlFQUFtRTtZQUMvRCxHQUFHLE1BQUssTUFBUTtjQUVkLFVBQVUsR0FBRyxpQkFBaUIsQ0FBQyxHQUFHO1lBQ3BDLFVBQVU7WUFDWixRQUFRLElBQUksS0FBSyxHQUFHLFVBQVUsR0FBRyxDQUFFLEFBQUYsQ0FBRTs7O1FBSXJDLEtBQUssQ0FBQyxHQUFHLElBQUksYUFBYSxDQUN4QixzQkFBc0IsQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUMvQixLQUFLLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxJQUFJLFNBQVMsR0FDNUMsS0FBSzs7VUFJUCxVQUFVLEdBQXlCLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUTtXQUMxRCxLQUFLO1FBQ1IsT0FBTyxFQUFFLGFBQWEsQ0FBQyxPQUFPO1FBQzlCLFFBQVEsRUFBRSxhQUFhLENBQUMsUUFBUTs7V0FHM0IsVUFBVSJ9