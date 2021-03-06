import { bot } from "../../cache.ts";
const SNOWFLAKE_REGEX = /[0-9]{17,19}/;
bot.arguments.set("snowflake", {
  name: "snowflake",
  execute: function (_argument, parameters) {
    let [text] = parameters;
    if (!text) return;
    // If its a nickname mention or role mention
    if (text.startsWith("<@!") || text.startsWith("<@&")) {
      text = text.substring(3, text.length - 1);
    }
    // If it's a user mention or channel mention
    if (text.startsWith("<@") || text.startsWith("<#")) {
      text = text.substring(2, text.length - 1);
    }
    if (text.length < 17 || text.length > 19) return;
    return SNOWFLAKE_REGEX.test(text) ? text : undefined;
  },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2FyZ3VtZW50cy9zbm93Zmxha2VzLnRzIzM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvdCB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuXG5jb25zdCBTTk9XRkxBS0VfUkVHRVggPSAvWzAtOV17MTcsMTl9LztcblxuYm90LmFyZ3VtZW50cy5zZXQoXCJzbm93Zmxha2VcIiwge1xuICBuYW1lOiBcInNub3dmbGFrZVwiLFxuICBleGVjdXRlOiBmdW5jdGlvbiAoX2FyZ3VtZW50LCBwYXJhbWV0ZXJzKSB7XG4gICAgbGV0IFt0ZXh0XSA9IHBhcmFtZXRlcnM7XG4gICAgaWYgKCF0ZXh0KSByZXR1cm47XG4gICAgLy8gSWYgaXRzIGEgbmlja25hbWUgbWVudGlvbiBvciByb2xlIG1lbnRpb25cbiAgICBpZiAodGV4dC5zdGFydHNXaXRoKFwiPEAhXCIpIHx8IHRleHQuc3RhcnRzV2l0aChcIjxAJlwiKSkge1xuICAgICAgdGV4dCA9IHRleHQuc3Vic3RyaW5nKDMsIHRleHQubGVuZ3RoIC0gMSk7XG4gICAgfVxuICAgIC8vIElmIGl0J3MgYSB1c2VyIG1lbnRpb24gb3IgY2hhbm5lbCBtZW50aW9uXG4gICAgaWYgKHRleHQuc3RhcnRzV2l0aChcIjxAXCIpIHx8IHRleHQuc3RhcnRzV2l0aChcIjwjXCIpKSB7XG4gICAgICB0ZXh0ID0gdGV4dC5zdWJzdHJpbmcoMiwgdGV4dC5sZW5ndGggLSAxKTtcbiAgICB9XG5cbiAgICBpZiAodGV4dC5sZW5ndGggPCAxNyB8fCB0ZXh0Lmxlbmd0aCA+IDE5KSByZXR1cm47XG5cbiAgICByZXR1cm4gU05PV0ZMQUtFX1JFR0VYLnRlc3QodGV4dCkgPyB0ZXh0IDogdW5kZWZpbmVkO1xuICB9LFxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsR0FBRyxTQUFRLGNBQWdCO01BRTlCLGVBQWU7QUFFckIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUMsU0FBVztJQUMzQixJQUFJLEdBQUUsU0FBVztJQUNqQixPQUFPLFdBQVksU0FBUyxFQUFFLFVBQVU7YUFDakMsSUFBSSxJQUFJLFVBQVU7YUFDbEIsSUFBSTtRQUNULEVBQTRDLEFBQTVDLDBDQUE0QztZQUN4QyxJQUFJLENBQUMsVUFBVSxFQUFDLEdBQUssTUFBSyxJQUFJLENBQUMsVUFBVSxFQUFDLEdBQUs7WUFDakQsSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQzs7UUFFMUMsRUFBNEMsQUFBNUMsMENBQTRDO1lBQ3hDLElBQUksQ0FBQyxVQUFVLEVBQUMsRUFBSSxNQUFLLElBQUksQ0FBQyxVQUFVLEVBQUMsRUFBSTtZQUMvQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDOztZQUd0QyxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUU7ZUFFakMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxHQUFHLFNBQVMifQ==
