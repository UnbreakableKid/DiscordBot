import { bot } from "../../cache.ts";
bot.arguments.set("...strings", {
    name: "...strings",
    execute: function(argument, parameters) {
        if (!parameters.length) return;
        return argument.lowercase ? parameters.join(" ").toLowerCase() : parameters.join(" ");
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2FyZ3VtZW50cy8uLi5zdHJpbmdzLnRzIzM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvdCB9IGZyb20gXCIuLi8uLi9jYWNoZS50c1wiO1xuXG5ib3QuYXJndW1lbnRzLnNldChcIi4uLnN0cmluZ3NcIiwge1xuICBuYW1lOiBcIi4uLnN0cmluZ3NcIixcbiAgZXhlY3V0ZTogZnVuY3Rpb24gKGFyZ3VtZW50LCBwYXJhbWV0ZXJzKSB7XG4gICAgaWYgKCFwYXJhbWV0ZXJzLmxlbmd0aCkgcmV0dXJuO1xuXG4gICAgcmV0dXJuIGFyZ3VtZW50Lmxvd2VyY2FzZVxuICAgICAgPyBwYXJhbWV0ZXJzLmpvaW4oXCIgXCIpLnRvTG93ZXJDYXNlKClcbiAgICAgIDogcGFyYW1ldGVycy5qb2luKFwiIFwiKTtcbiAgfSxcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLEdBQUcsU0FBUSxjQUFnQjtBQUVwQyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBQyxVQUFZO0lBQzVCLElBQUksR0FBRSxVQUFZO0lBQ2xCLE9BQU8sV0FBWSxRQUFRLEVBQUUsVUFBVTthQUNoQyxVQUFVLENBQUMsTUFBTTtlQUVmLFFBQVEsQ0FBQyxTQUFTLEdBQ3JCLFVBQVUsQ0FBQyxJQUFJLEVBQUMsQ0FBRyxHQUFFLFdBQVcsS0FDaEMsVUFBVSxDQUFDLElBQUksRUFBQyxDQUFHIn0=