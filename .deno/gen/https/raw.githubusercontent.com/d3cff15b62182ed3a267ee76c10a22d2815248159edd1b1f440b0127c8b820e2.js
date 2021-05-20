import { rest } from "../../rest/rest.ts";
import { structures } from "../../structures/mod.ts";
import { endpoints } from "../../util/constants.ts";
/** Get pinned messages in this channel. */ export async function getPins(
  channelId,
) {
  const result = await rest.runMethod("get", endpoints.CHANNEL_PINS(channelId));
  return Promise.all(
    result.map((res) => structures.createDiscordenoMessage(res)),
  );
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvY2hhbm5lbHMvZ2V0X3BpbnMudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHJlc3QgfSBmcm9tIFwiLi4vLi4vcmVzdC9yZXN0LnRzXCI7XG5pbXBvcnQgeyBzdHJ1Y3R1cmVzIH0gZnJvbSBcIi4uLy4uL3N0cnVjdHVyZXMvbW9kLnRzXCI7XG5pbXBvcnQgdHlwZSB7IE1lc3NhZ2UgfSBmcm9tIFwiLi4vLi4vdHlwZXMvbWVzc2FnZXMvbWVzc2FnZS50c1wiO1xuaW1wb3J0IHsgZW5kcG9pbnRzIH0gZnJvbSBcIi4uLy4uL3V0aWwvY29uc3RhbnRzLnRzXCI7XG5cbi8qKiBHZXQgcGlubmVkIG1lc3NhZ2VzIGluIHRoaXMgY2hhbm5lbC4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRQaW5zKGNoYW5uZWxJZDogYmlnaW50KSB7XG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlc3QucnVuTWV0aG9kPE1lc3NhZ2VbXT4oXG4gICAgXCJnZXRcIixcbiAgICBlbmRwb2ludHMuQ0hBTk5FTF9QSU5TKGNoYW5uZWxJZCksXG4gICk7XG5cbiAgcmV0dXJuIFByb21pc2UuYWxsKFxuICAgIHJlc3VsdC5tYXAoKHJlcykgPT4gc3RydWN0dXJlcy5jcmVhdGVEaXNjb3JkZW5vTWVzc2FnZShyZXMpKSxcbiAgKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxJQUFJLFNBQVEsa0JBQW9CO1NBQ2hDLFVBQVUsU0FBUSx1QkFBeUI7U0FFM0MsU0FBUyxTQUFRLHVCQUF5QjtBQUVuRCxFQUEyQyxBQUEzQyx1Q0FBMkMsQUFBM0MsRUFBMkMsdUJBQ3JCLE9BQU8sQ0FBQyxTQUFpQjtVQUN2QyxNQUFNLFNBQVMsSUFBSSxDQUFDLFNBQVMsRUFDakMsR0FBSyxHQUNMLFNBQVMsQ0FBQyxZQUFZLENBQUMsU0FBUztXQUczQixPQUFPLENBQUMsR0FBRyxDQUNoQixNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsR0FBSyxVQUFVLENBQUMsdUJBQXVCLENBQUMsR0FBRyJ9