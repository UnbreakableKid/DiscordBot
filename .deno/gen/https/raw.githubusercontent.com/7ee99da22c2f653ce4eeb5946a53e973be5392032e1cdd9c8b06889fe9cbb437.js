import { eventHandlers } from "../../bot.ts";
import { addReaction } from "./add_reaction.ts";
/** Adds multiple reactions to a message. If `ordered` is true(default is false), it will add the reactions one at a time in the order provided. Note: Reaction takes the form of **name:id** for custom guild emoji, or Unicode characters. Requires READ_MESSAGE_HISTORY and ADD_REACTIONS */ export async function addReactions(
  channelId,
  messageId,
  reactions,
  ordered = false,
) {
  if (!ordered) {
    await Promise.all(
      reactions.map((reaction) => addReaction(channelId, messageId, reaction)),
    );
  } else {
    for (const reaction of reactions) {
      eventHandlers.debug?.(
        "loop",
        "Running for of loop in addReactions function.",
      );
      await addReaction(channelId, messageId, reaction);
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL2hlbHBlcnMvbWVzc2FnZXMvYWRkX3JlYWN0aW9ucy50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXZlbnRIYW5kbGVycyB9IGZyb20gXCIuLi8uLi9ib3QudHNcIjtcbmltcG9ydCB7IGFkZFJlYWN0aW9uIH0gZnJvbSBcIi4vYWRkX3JlYWN0aW9uLnRzXCI7XG5cbi8qKiBBZGRzIG11bHRpcGxlIHJlYWN0aW9ucyB0byBhIG1lc3NhZ2UuIElmIGBvcmRlcmVkYCBpcyB0cnVlKGRlZmF1bHQgaXMgZmFsc2UpLCBpdCB3aWxsIGFkZCB0aGUgcmVhY3Rpb25zIG9uZSBhdCBhIHRpbWUgaW4gdGhlIG9yZGVyIHByb3ZpZGVkLiBOb3RlOiBSZWFjdGlvbiB0YWtlcyB0aGUgZm9ybSBvZiAqKm5hbWU6aWQqKiBmb3IgY3VzdG9tIGd1aWxkIGVtb2ppLCBvciBVbmljb2RlIGNoYXJhY3RlcnMuIFJlcXVpcmVzIFJFQURfTUVTU0FHRV9ISVNUT1JZIGFuZCBBRERfUkVBQ1RJT05TICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYWRkUmVhY3Rpb25zKFxuICBjaGFubmVsSWQ6IGJpZ2ludCxcbiAgbWVzc2FnZUlkOiBiaWdpbnQsXG4gIHJlYWN0aW9uczogc3RyaW5nW10sXG4gIG9yZGVyZWQgPSBmYWxzZSxcbikge1xuICBpZiAoIW9yZGVyZWQpIHtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgIHJlYWN0aW9ucy5tYXAoKHJlYWN0aW9uKSA9PiBhZGRSZWFjdGlvbihjaGFubmVsSWQsIG1lc3NhZ2VJZCwgcmVhY3Rpb24pKSxcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIGZvciAoY29uc3QgcmVhY3Rpb24gb2YgcmVhY3Rpb25zKSB7XG4gICAgICBldmVudEhhbmRsZXJzLmRlYnVnPy4oXG4gICAgICAgIFwibG9vcFwiLFxuICAgICAgICBcIlJ1bm5pbmcgZm9yIG9mIGxvb3AgaW4gYWRkUmVhY3Rpb25zIGZ1bmN0aW9uLlwiLFxuICAgICAgKTtcbiAgICAgIGF3YWl0IGFkZFJlYWN0aW9uKGNoYW5uZWxJZCwgbWVzc2FnZUlkLCByZWFjdGlvbik7XG4gICAgfVxuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsYUFBYSxTQUFRLFlBQWM7U0FDbkMsV0FBVyxTQUFRLGlCQUFtQjtBQUUvQyxFQUErUixBQUEvUiwyUkFBK1IsQUFBL1IsRUFBK1IsdUJBQ3pRLFlBQVksQ0FDaEMsU0FBaUIsRUFDakIsU0FBaUIsRUFDakIsU0FBbUIsRUFDbkIsT0FBTyxHQUFHLEtBQUs7U0FFVixPQUFPO2NBQ0osT0FBTyxDQUFDLEdBQUcsQ0FDZixTQUFTLENBQUMsR0FBRyxFQUFFLFFBQVEsR0FBSyxXQUFXLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxRQUFROzs7bUJBRzdELFFBQVEsSUFBSSxTQUFTO1lBQzlCLGFBQWEsQ0FBQyxLQUFLLElBQ2pCLElBQU0sSUFDTiw2Q0FBK0M7a0JBRTNDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLFFBQVEifQ==
