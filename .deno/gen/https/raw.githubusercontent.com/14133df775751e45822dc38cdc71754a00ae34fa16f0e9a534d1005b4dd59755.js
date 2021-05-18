import { eventHandlers } from "../../bot.ts";
import { cacheHandlers } from "../../cache.ts";
import { snowflakeToBigint } from "../../util/bigint.ts";
export async function handleMessageReactionRemove(data) {
    const payload = data.d;
    const message = await cacheHandlers.get("messages", snowflakeToBigint(payload.messageId));
    if (message) {
        const reaction = message.reactions?.find((reaction)=>// MUST USE == because discord sends null and we use undefined
            reaction.emoji.id == payload.emoji.id && reaction.emoji.name === payload.emoji.name
        );
        if (reaction) {
            reaction.count--;
            if (reaction.count === 0) {
                message.reactions = message.reactions?.filter((r)=>r.count !== 0
                );
            }
            if (!message.reactions?.length) message.reactions = undefined;
            await cacheHandlers.set("messages", message.id, message);
        }
    }
    eventHandlers.reactionRemove?.(payload, message);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hhbmRsZXJzL21lc3NhZ2VzL01FU1NBR0VfUkVBQ1RJT05fUkVNT1ZFLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBldmVudEhhbmRsZXJzIH0gZnJvbSBcIi4uLy4uL2JvdC50c1wiO1xuaW1wb3J0IHsgY2FjaGVIYW5kbGVycyB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuaW1wb3J0IHR5cGUgeyBEaXNjb3JkR2F0ZXdheVBheWxvYWQgfSBmcm9tIFwiLi4vLi4vdHlwZXMvZ2F0ZXdheS9nYXRld2F5X3BheWxvYWQudHNcIjtcbmltcG9ydCB0eXBlIHtcbiAgTWVzc2FnZVJlYWN0aW9uUmVtb3ZlLFxufSBmcm9tIFwiLi4vLi4vdHlwZXMvbWVzc2FnZXMvbWVzc2FnZV9yZWFjdGlvbl9yZW1vdmUudHNcIjtcbmltcG9ydCB7IHNub3dmbGFrZVRvQmlnaW50IH0gZnJvbSBcIi4uLy4uL3V0aWwvYmlnaW50LnRzXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVNZXNzYWdlUmVhY3Rpb25SZW1vdmUoXG4gIGRhdGE6IERpc2NvcmRHYXRld2F5UGF5bG9hZCxcbikge1xuICBjb25zdCBwYXlsb2FkID0gZGF0YS5kIGFzIE1lc3NhZ2VSZWFjdGlvblJlbW92ZTtcbiAgY29uc3QgbWVzc2FnZSA9IGF3YWl0IGNhY2hlSGFuZGxlcnMuZ2V0KFxuICAgIFwibWVzc2FnZXNcIixcbiAgICBzbm93Zmxha2VUb0JpZ2ludChwYXlsb2FkLm1lc3NhZ2VJZCksXG4gICk7XG5cbiAgaWYgKG1lc3NhZ2UpIHtcbiAgICBjb25zdCByZWFjdGlvbiA9IG1lc3NhZ2UucmVhY3Rpb25zPy5maW5kKChyZWFjdGlvbikgPT5cbiAgICAgIC8vIE1VU1QgVVNFID09IGJlY2F1c2UgZGlzY29yZCBzZW5kcyBudWxsIGFuZCB3ZSB1c2UgdW5kZWZpbmVkXG4gICAgICByZWFjdGlvbi5lbW9qaS5pZCA9PSBwYXlsb2FkLmVtb2ppLmlkICYmXG4gICAgICByZWFjdGlvbi5lbW9qaS5uYW1lID09PSBwYXlsb2FkLmVtb2ppLm5hbWVcbiAgICApO1xuXG4gICAgaWYgKHJlYWN0aW9uKSB7XG4gICAgICByZWFjdGlvbi5jb3VudC0tO1xuICAgICAgaWYgKHJlYWN0aW9uLmNvdW50ID09PSAwKSB7XG4gICAgICAgIG1lc3NhZ2UucmVhY3Rpb25zID0gbWVzc2FnZS5yZWFjdGlvbnM/LmZpbHRlcigocikgPT4gci5jb3VudCAhPT0gMCk7XG4gICAgICB9XG4gICAgICBpZiAoIW1lc3NhZ2UucmVhY3Rpb25zPy5sZW5ndGgpIG1lc3NhZ2UucmVhY3Rpb25zID0gdW5kZWZpbmVkO1xuXG4gICAgICBhd2FpdCBjYWNoZUhhbmRsZXJzLnNldChcIm1lc3NhZ2VzXCIsIG1lc3NhZ2UuaWQsIG1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuXG4gIGV2ZW50SGFuZGxlcnMucmVhY3Rpb25SZW1vdmU/LihcbiAgICBwYXlsb2FkLFxuICAgIG1lc3NhZ2UsXG4gICk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsYUFBYSxTQUFRLFlBQWM7U0FDbkMsYUFBYSxTQUFRLGNBQWdCO1NBS3JDLGlCQUFpQixTQUFRLG9CQUFzQjtzQkFFbEMsMkJBQTJCLENBQy9DLElBQTJCO1VBRXJCLE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQztVQUNoQixPQUFPLFNBQVMsYUFBYSxDQUFDLEdBQUcsRUFDckMsUUFBVSxHQUNWLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxTQUFTO1FBR2pDLE9BQU87Y0FDSCxRQUFRLEdBQUcsT0FBTyxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxHQUNoRCxFQUE4RCxBQUE5RCw0REFBOEQ7WUFDOUQsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQ3JDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSTs7WUFHeEMsUUFBUTtZQUNWLFFBQVEsQ0FBQyxLQUFLO2dCQUNWLFFBQVEsQ0FBQyxLQUFLLEtBQUssQ0FBQztnQkFDdEIsT0FBTyxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxDQUFDLEdBQUssQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDOzs7aUJBRS9ELE9BQU8sQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxTQUFTLEdBQUcsU0FBUztrQkFFdkQsYUFBYSxDQUFDLEdBQUcsRUFBQyxRQUFVLEdBQUUsT0FBTyxDQUFDLEVBQUUsRUFBRSxPQUFPOzs7SUFJM0QsYUFBYSxDQUFDLGNBQWMsR0FDMUIsT0FBTyxFQUNQLE9BQU8ifQ==