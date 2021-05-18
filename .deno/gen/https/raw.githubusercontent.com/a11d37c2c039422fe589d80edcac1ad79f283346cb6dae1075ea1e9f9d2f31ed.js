import { eventHandlers } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { snowflakeToBigint } from "../../util/bigint.ts";
export async function handleGuildBanAdd(data) {
    const payload = data.d;
    const guild = await cacheHandlers.get("guilds", snowflakeToBigint(payload.guildId));
    if (!guild) return;
    const member = await cacheHandlers.get("members", snowflakeToBigint(payload.user.id));
    eventHandlers.guildBanAdd?.(guild, payload.user, member);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hhbmRsZXJzL2d1aWxkcy9HVUlMRF9CQU5fQURELnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBldmVudEhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2JvdC50c1wiO1xuaW1wb3J0IHsgY2FjaGVIYW5kbGVycyB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuaW1wb3J0IHR5cGUgeyBEaXNjb3JkR2F0ZXdheVBheWxvYWQgfSBmcm9tIFwiLi4vLi4vdHlwZXMvZ2F0ZXdheS9nYXRld2F5X3BheWxvYWQudHNcIjtcbmltcG9ydCB0eXBlIHsgR3VpbGRCYW5BZGRSZW1vdmUgfSBmcm9tIFwiLi4vLi4vdHlwZXMvZ3VpbGRzL2d1aWxkX2Jhbl9hZGRfcmVtb3ZlLnRzXCI7XG5pbXBvcnQgeyBzbm93Zmxha2VUb0JpZ2ludCB9IGZyb20gXCIuLi8uLi91dGlsL2JpZ2ludC50c1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlR3VpbGRCYW5BZGQoZGF0YTogRGlzY29yZEdhdGV3YXlQYXlsb2FkKSB7XG4gIGNvbnN0IHBheWxvYWQgPSBkYXRhLmQgYXMgR3VpbGRCYW5BZGRSZW1vdmU7XG4gIGNvbnN0IGd1aWxkID0gYXdhaXQgY2FjaGVIYW5kbGVycy5nZXQoXG4gICAgXCJndWlsZHNcIixcbiAgICBzbm93Zmxha2VUb0JpZ2ludChwYXlsb2FkLmd1aWxkSWQpLFxuICApO1xuICBpZiAoIWd1aWxkKSByZXR1cm47XG5cbiAgY29uc3QgbWVtYmVyID0gYXdhaXQgY2FjaGVIYW5kbGVycy5nZXQoXG4gICAgXCJtZW1iZXJzXCIsXG4gICAgc25vd2ZsYWtlVG9CaWdpbnQocGF5bG9hZC51c2VyLmlkKSxcbiAgKTtcbiAgZXZlbnRIYW5kbGVycy5ndWlsZEJhbkFkZD8uKGd1aWxkLCBwYXlsb2FkLnVzZXIsIG1lbWJlcik7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsYUFBYSxTQUFRLFlBQWM7U0FDbkMsYUFBYSxTQUFRLGNBQWdCO1NBR3JDLGlCQUFpQixTQUFRLG9CQUFzQjtzQkFFbEMsaUJBQWlCLENBQUMsSUFBMkI7VUFDM0QsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDO1VBQ2hCLEtBQUssU0FBUyxhQUFhLENBQUMsR0FBRyxFQUNuQyxNQUFRLEdBQ1IsaUJBQWlCLENBQUMsT0FBTyxDQUFDLE9BQU87U0FFOUIsS0FBSztVQUVKLE1BQU0sU0FBUyxhQUFhLENBQUMsR0FBRyxFQUNwQyxPQUFTLEdBQ1QsaUJBQWlCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO0lBRW5DLGFBQWEsQ0FBQyxXQUFXLEdBQUcsS0FBSyxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsTUFBTSJ9