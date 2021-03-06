import { rest } from "../../rest/rest.ts";
import { snowflakeToBigint } from "../../util/bigint.ts";
import { endpoints } from "../../util/constants.ts";
import { requireBotGuildPermissions } from "../../util/permissions.ts";
import { urlToBase64 } from "../../util/utils.ts";
/** Create an emoji in the server. Emojis and animated emojis have a maximum file size of 256kb. Attempting to upload an emoji larger than this limit will fail and return 400 Bad Request and an error message, but not a JSON status code. If a URL is provided to the image parameter, Discordeno will automatically convert it to a base64 string internally. */ export async function createEmoji(
  guildId,
  name,
  image,
  options,
) {
  await requireBotGuildPermissions(guildId, [
    "MANAGE_EMOJIS",
  ]);
  if (image && !image.startsWith("data:image/")) {
    image = await urlToBase64(image);
  }
  const emoji = await rest.runMethod("post", endpoints.GUILD_EMOJIS(guildId), {
    ...options,
    name,
    image,
  });
  return {
    ...emoji,
    id: snowflakeToBigint(emoji.id),
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvZW1vamlzL2NyZWF0ZV9lbW9qaS50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVzdCB9IGZyb20gXCIuLi8uLi9yZXN0L3Jlc3QudHNcIjtcbmltcG9ydCB7IENyZWF0ZUd1aWxkRW1vamkgfSBmcm9tIFwiLi4vLi4vdHlwZXMvZW1vamlzL2NyZWF0ZV9ndWlsZF9lbW9qaS50c1wiO1xuaW1wb3J0IHR5cGUgeyBFbW9qaSB9IGZyb20gXCIuLi8uLi90eXBlcy9lbW9qaXMvZW1vamkudHNcIjtcbmltcG9ydCB7IHNub3dmbGFrZVRvQmlnaW50IH0gZnJvbSBcIi4uLy4uL3V0aWwvYmlnaW50LnRzXCI7XG5pbXBvcnQgeyBlbmRwb2ludHMgfSBmcm9tIFwiLi4vLi4vdXRpbC9jb25zdGFudHMudHNcIjtcbmltcG9ydCB7IHJlcXVpcmVCb3RHdWlsZFBlcm1pc3Npb25zIH0gZnJvbSBcIi4uLy4uL3V0aWwvcGVybWlzc2lvbnMudHNcIjtcbmltcG9ydCB7IHVybFRvQmFzZTY0IH0gZnJvbSBcIi4uLy4uL3V0aWwvdXRpbHMudHNcIjtcblxuLyoqIENyZWF0ZSBhbiBlbW9qaSBpbiB0aGUgc2VydmVyLiBFbW9qaXMgYW5kIGFuaW1hdGVkIGVtb2ppcyBoYXZlIGEgbWF4aW11bSBmaWxlIHNpemUgb2YgMjU2a2IuIEF0dGVtcHRpbmcgdG8gdXBsb2FkIGFuIGVtb2ppIGxhcmdlciB0aGFuIHRoaXMgbGltaXQgd2lsbCBmYWlsIGFuZCByZXR1cm4gNDAwIEJhZCBSZXF1ZXN0IGFuZCBhbiBlcnJvciBtZXNzYWdlLCBidXQgbm90IGEgSlNPTiBzdGF0dXMgY29kZS4gSWYgYSBVUkwgaXMgcHJvdmlkZWQgdG8gdGhlIGltYWdlIHBhcmFtZXRlciwgRGlzY29yZGVubyB3aWxsIGF1dG9tYXRpY2FsbHkgY29udmVydCBpdCB0byBhIGJhc2U2NCBzdHJpbmcgaW50ZXJuYWxseS4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVFbW9qaShcbiAgZ3VpbGRJZDogYmlnaW50LFxuICBuYW1lOiBzdHJpbmcsXG4gIGltYWdlOiBzdHJpbmcsXG4gIG9wdGlvbnM6IENyZWF0ZUd1aWxkRW1vamksXG4pIHtcbiAgYXdhaXQgcmVxdWlyZUJvdEd1aWxkUGVybWlzc2lvbnMoZ3VpbGRJZCwgW1wiTUFOQUdFX0VNT0pJU1wiXSk7XG5cbiAgaWYgKGltYWdlICYmICFpbWFnZS5zdGFydHNXaXRoKFwiZGF0YTppbWFnZS9cIikpIHtcbiAgICBpbWFnZSA9IGF3YWl0IHVybFRvQmFzZTY0KGltYWdlKTtcbiAgfVxuXG4gIGNvbnN0IGVtb2ppID0gYXdhaXQgcmVzdC5ydW5NZXRob2Q8RW1vamk+KFxuICAgIFwicG9zdFwiLFxuICAgIGVuZHBvaW50cy5HVUlMRF9FTU9KSVMoZ3VpbGRJZCksXG4gICAge1xuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIG5hbWUsXG4gICAgICBpbWFnZSxcbiAgICB9LFxuICApO1xuXG4gIHJldHVybiB7XG4gICAgLi4uZW1vamksXG4gICAgaWQ6IHNub3dmbGFrZVRvQmlnaW50KGVtb2ppLmlkISksXG4gIH07XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsSUFBSSxTQUFRLGtCQUFvQjtTQUdoQyxpQkFBaUIsU0FBUSxvQkFBc0I7U0FDL0MsU0FBUyxTQUFRLHVCQUF5QjtTQUMxQywwQkFBMEIsU0FBUSx5QkFBMkI7U0FDN0QsV0FBVyxTQUFRLG1CQUFxQjtBQUVqRCxFQUFvVyxBQUFwVyxnV0FBb1csQUFBcFcsRUFBb1csdUJBQzlVLFdBQVcsQ0FDL0IsT0FBZSxFQUNmLElBQVksRUFDWixLQUFhLEVBQ2IsT0FBeUI7VUFFbkIsMEJBQTBCLENBQUMsT0FBTztTQUFHLGFBQWU7O1FBRXRELEtBQUssS0FBSyxLQUFLLENBQUMsVUFBVSxFQUFDLFdBQWE7UUFDMUMsS0FBSyxTQUFTLFdBQVcsQ0FBQyxLQUFLOztVQUczQixLQUFLLFNBQVMsSUFBSSxDQUFDLFNBQVMsRUFDaEMsSUFBTSxHQUNOLFNBQVMsQ0FBQyxZQUFZLENBQUMsT0FBTztXQUV6QixPQUFPO1FBQ1YsSUFBSTtRQUNKLEtBQUs7OztXQUtKLEtBQUs7UUFDUixFQUFFLEVBQUUsaUJBQWlCLENBQUMsS0FBSyxDQUFDLEVBQUUifQ==
