import { bot } from "../../cache.ts";
bot.arguments.set("boolean", {
  name: "boolean",
  execute: function (_argument, parameters) {
    const [boolean] = parameters;
    if (
      [
        "true",
        "false",
        "on",
        "off",
        "enable",
        "disable",
      ].includes(boolean)
    ) {
      return [
        "true",
        "on",
        "enable",
      ].includes(boolean);
    }
  },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2FyZ3VtZW50cy9ib29sZWFuLnRzIzM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvdCB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuXG5ib3QuYXJndW1lbnRzLnNldChcImJvb2xlYW5cIiwge1xuICBuYW1lOiBcImJvb2xlYW5cIixcbiAgZXhlY3V0ZTogZnVuY3Rpb24gKF9hcmd1bWVudCwgcGFyYW1ldGVycykge1xuICAgIGNvbnN0IFtib29sZWFuXSA9IHBhcmFtZXRlcnM7XG5cbiAgICBpZiAoW1widHJ1ZVwiLCBcImZhbHNlXCIsIFwib25cIiwgXCJvZmZcIiwgXCJlbmFibGVcIiwgXCJkaXNhYmxlXCJdLmluY2x1ZGVzKGJvb2xlYW4pKSB7XG4gICAgICByZXR1cm4gW1widHJ1ZVwiLCBcIm9uXCIsIFwiZW5hYmxlXCJdLmluY2x1ZGVzKGJvb2xlYW4pO1xuICAgIH1cbiAgfSxcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLEdBQUcsU0FBUSxjQUFnQjtBQUVwQyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBQyxPQUFTO0lBQ3pCLElBQUksR0FBRSxPQUFTO0lBQ2YsT0FBTyxXQUFZLFNBQVMsRUFBRSxVQUFVO2VBQy9CLE9BQU8sSUFBSSxVQUFVOzthQUV2QixJQUFNO2FBQUUsS0FBTzthQUFFLEVBQUk7YUFBRSxHQUFLO2FBQUUsTUFBUTthQUFFLE9BQVM7VUFBRSxRQUFRLENBQUMsT0FBTzs7aUJBQzlELElBQU07aUJBQUUsRUFBSTtpQkFBRSxNQUFRO2NBQUUsUUFBUSxDQUFDLE9BQU8ifQ==
