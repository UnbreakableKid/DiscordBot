import { bot } from "../../cache.ts";
bot.arguments.set("command", {
    name: "command",
    execute: function(_argument, parameters) {
        const [name] = parameters;
        if (!name) return;
        const commandName = name.toLowerCase();
        const command = bot.commands.get(commandName);
        if (command) return command;
        // Check if its an alias
        return bot.commands.find((cmd)=>Boolean(cmd.aliases?.includes(commandName))
        );
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2FyZ3VtZW50cy9jb21tYW5kLnRzIzM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvdCB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuXG5ib3QuYXJndW1lbnRzLnNldChcImNvbW1hbmRcIiwge1xuICBuYW1lOiBcImNvbW1hbmRcIixcbiAgZXhlY3V0ZTogZnVuY3Rpb24gKF9hcmd1bWVudCwgcGFyYW1ldGVycykge1xuICAgIGNvbnN0IFtuYW1lXSA9IHBhcmFtZXRlcnM7XG4gICAgaWYgKCFuYW1lKSByZXR1cm47XG5cbiAgICBjb25zdCBjb21tYW5kTmFtZSA9IG5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCBjb21tYW5kID0gYm90LmNvbW1hbmRzLmdldChjb21tYW5kTmFtZSk7XG4gICAgaWYgKGNvbW1hbmQpIHJldHVybiBjb21tYW5kO1xuXG4gICAgLy8gQ2hlY2sgaWYgaXRzIGFuIGFsaWFzXG4gICAgcmV0dXJuIGJvdC5jb21tYW5kcy5maW5kKChjbWQpID0+XG4gICAgICBCb29sZWFuKGNtZC5hbGlhc2VzPy5pbmNsdWRlcyhjb21tYW5kTmFtZSkpXG4gICAgKTtcbiAgfSxcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLEdBQUcsU0FBUSxjQUFnQjtBQUVwQyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBQyxPQUFTO0lBQ3pCLElBQUksR0FBRSxPQUFTO0lBQ2YsT0FBTyxXQUFZLFNBQVMsRUFBRSxVQUFVO2VBQy9CLElBQUksSUFBSSxVQUFVO2FBQ3BCLElBQUk7Y0FFSCxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVc7Y0FDOUIsT0FBTyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFdBQVc7WUFDeEMsT0FBTyxTQUFTLE9BQU87UUFFM0IsRUFBd0IsQUFBeEIsc0JBQXdCO2VBQ2pCLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEdBQUcsR0FDM0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFdBQVcifQ==