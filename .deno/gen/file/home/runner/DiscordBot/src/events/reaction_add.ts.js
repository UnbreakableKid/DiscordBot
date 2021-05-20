import { snowflakeToBigint } from "../../deps.ts";
import { processReactionCollectors } from "../utils/collectors.ts";
import { bot } from "../../cache.ts";
bot.eventHandlers.reactionAdd = function (data, message) {
  // Process reaction collectors.
  if (message) {
    processReactionCollectors(
      message,
      data.emoji,
      snowflakeToBigint(data.userId),
    );
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2V2ZW50cy9yZWFjdGlvbl9hZGQudHMjMj4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgc25vd2ZsYWtlVG9CaWdpbnQgfSBmcm9tIFwiLi4vLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgcHJvY2Vzc1JlYWN0aW9uQ29sbGVjdG9ycyB9IGZyb20gXCIuLi91dGlscy9jb2xsZWN0b3JzLnRzXCI7XG5pbXBvcnQgeyBib3QgfSBmcm9tIFwiLi4vLi4vY2FjaGUudHNcIjtcblxuYm90LmV2ZW50SGFuZGxlcnMucmVhY3Rpb25BZGQgPSBmdW5jdGlvbiAoZGF0YSwgbWVzc2FnZSkge1xuICAvLyBQcm9jZXNzIHJlYWN0aW9uIGNvbGxlY3RvcnMuXG4gIGlmIChtZXNzYWdlKSB7XG4gICAgcHJvY2Vzc1JlYWN0aW9uQ29sbGVjdG9ycyhcbiAgICAgIG1lc3NhZ2UsXG4gICAgICBkYXRhLmVtb2ppLFxuICAgICAgc25vd2ZsYWtlVG9CaWdpbnQoZGF0YS51c2VySWQpLFxuICAgICk7XG4gIH1cbn07XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsaUJBQWlCLFNBQVEsYUFBZTtTQUN4Qyx5QkFBeUIsU0FBUSxzQkFBd0I7U0FDekQsR0FBRyxTQUFRLGNBQWdCO0FBRXBDLEdBQUcsQ0FBQyxhQUFhLENBQUMsV0FBVyxZQUFhLElBQUksRUFBRSxPQUFPO0lBQ3JELEVBQStCLEFBQS9CLDZCQUErQjtRQUMzQixPQUFPO1FBQ1QseUJBQXlCLENBQ3ZCLE9BQU8sRUFDUCxJQUFJLENBQUMsS0FBSyxFQUNWLGlCQUFpQixDQUFDLElBQUksQ0FBQyxNQUFNIn0=