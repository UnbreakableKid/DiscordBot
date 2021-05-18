import { bot } from "../../cache.ts";
bot.arguments.set("subcommand", {
  name: "subcommand",
  execute: function (argument, parameters, _message, command) {
    const [subcommandName] = parameters;
    const sub = command.subcommands?.find((sub) =>
      sub.name === subcommandName ||
      Boolean(sub.aliases?.includes(subcommandName))
    );
    if (sub) return sub;
    return typeof argument.defaultValue === "string"
      ? command.subcommands?.get(argument.defaultValue)
      : undefined;
  },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2FyZ3VtZW50cy9zdWJjb21tYW5kLnRzIzM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvdCB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuXG5ib3QuYXJndW1lbnRzLnNldChcInN1YmNvbW1hbmRcIiwge1xuICBuYW1lOiBcInN1YmNvbW1hbmRcIixcbiAgZXhlY3V0ZTogZnVuY3Rpb24gKGFyZ3VtZW50LCBwYXJhbWV0ZXJzLCBfbWVzc2FnZSwgY29tbWFuZCkge1xuICAgIGNvbnN0IFtzdWJjb21tYW5kTmFtZV0gPSBwYXJhbWV0ZXJzO1xuXG4gICAgY29uc3Qgc3ViID0gY29tbWFuZC5zdWJjb21tYW5kcz8uZmluZChcbiAgICAgIChzdWIpID0+XG4gICAgICAgIHN1Yi5uYW1lID09PSBzdWJjb21tYW5kTmFtZSB8fFxuICAgICAgICBCb29sZWFuKHN1Yi5hbGlhc2VzPy5pbmNsdWRlcyhzdWJjb21tYW5kTmFtZSkpLFxuICAgICk7XG4gICAgaWYgKHN1YikgcmV0dXJuIHN1YjtcblxuICAgIHJldHVybiB0eXBlb2YgYXJndW1lbnQuZGVmYXVsdFZhbHVlID09PSBcInN0cmluZ1wiXG4gICAgICA/IGNvbW1hbmQuc3ViY29tbWFuZHM/LmdldChhcmd1bWVudC5kZWZhdWx0VmFsdWUpXG4gICAgICA6IHVuZGVmaW5lZDtcbiAgfSxcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLEdBQUcsU0FBUSxjQUFnQjtBQUVwQyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBQyxVQUFZO0lBQzVCLElBQUksR0FBRSxVQUFZO0lBQ2xCLE9BQU8sV0FBWSxRQUFRLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxPQUFPO2VBQ2pELGNBQWMsSUFBSSxVQUFVO2NBRTdCLEdBQUcsR0FBRyxPQUFPLENBQUMsV0FBVyxFQUFFLElBQUksRUFDbEMsR0FBRyxHQUNGLEdBQUcsQ0FBQyxJQUFJLEtBQUssY0FBYyxJQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsY0FBYzs7WUFFNUMsR0FBRyxTQUFTLEdBQUc7c0JBRUwsUUFBUSxDQUFDLFlBQVksTUFBSyxNQUFRLElBQzVDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxZQUFZLElBQzlDLFNBQVMifQ==
