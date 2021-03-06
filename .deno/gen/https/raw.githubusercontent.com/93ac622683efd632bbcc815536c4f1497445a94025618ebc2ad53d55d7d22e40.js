import { eventHandlers } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { snowflakeToBigint } from "../../util/bigint.ts";
export async function handleVoiceServerUpdate(data) {
  const payload = data.d;
  const guild = await cacheHandlers.get(
    "guilds",
    snowflakeToBigint(payload.guildId),
  );
  if (!guild) return;
  eventHandlers.voiceServerUpdate?.(payload, guild);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hhbmRsZXJzL3ZvaWNlL1ZPSUNFX1NFUlZFUl9VUERBVEUudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV2ZW50SGFuZGxlcnMgfSBmcm9tIFwiLi4vLi4vYm90LnRzXCI7XG5pbXBvcnQgeyBjYWNoZUhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5pbXBvcnQgdHlwZSB7IERpc2NvcmRHYXRld2F5UGF5bG9hZCB9IGZyb20gXCIuLi8uLi90eXBlcy9nYXRld2F5L2dhdGV3YXlfcGF5bG9hZC50c1wiO1xuaW1wb3J0IHR5cGUgeyBWb2ljZVNlcnZlclVwZGF0ZSB9IGZyb20gXCIuLi8uLi90eXBlcy92b2ljZS92b2ljZV9zZXJ2ZXJfdXBkYXRlLnRzXCI7XG5pbXBvcnQgeyBzbm93Zmxha2VUb0JpZ2ludCB9IGZyb20gXCIuLi8uLi91dGlsL2JpZ2ludC50c1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlVm9pY2VTZXJ2ZXJVcGRhdGUoZGF0YTogRGlzY29yZEdhdGV3YXlQYXlsb2FkKSB7XG4gIGNvbnN0IHBheWxvYWQgPSBkYXRhLmQgYXMgVm9pY2VTZXJ2ZXJVcGRhdGU7XG5cbiAgY29uc3QgZ3VpbGQgPSBhd2FpdCBjYWNoZUhhbmRsZXJzLmdldChcbiAgICBcImd1aWxkc1wiLFxuICAgIHNub3dmbGFrZVRvQmlnaW50KHBheWxvYWQuZ3VpbGRJZCksXG4gICk7XG4gIGlmICghZ3VpbGQpIHJldHVybjtcblxuICBldmVudEhhbmRsZXJzLnZvaWNlU2VydmVyVXBkYXRlPy4ocGF5bG9hZCwgZ3VpbGQpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLGFBQWEsU0FBUSxZQUFjO1NBQ25DLGFBQWEsU0FBUSxjQUFnQjtTQUdyQyxpQkFBaUIsU0FBUSxvQkFBc0I7c0JBRWxDLHVCQUF1QixDQUFDLElBQTJCO1VBQ2pFLE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQztVQUVoQixLQUFLLFNBQVMsYUFBYSxDQUFDLEdBQUcsRUFDbkMsTUFBUSxHQUNSLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxPQUFPO1NBRTlCLEtBQUs7SUFFVixhQUFhLENBQUMsaUJBQWlCLEdBQUcsT0FBTyxFQUFFLEtBQUsifQ==
