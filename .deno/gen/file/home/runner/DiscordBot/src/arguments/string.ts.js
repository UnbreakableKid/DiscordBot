import { bot } from "../../cache.ts";
bot.arguments.set("string", {
    name: "string",
    execute: function(argument, parameters) {
        const [text] = parameters;
        const valid = // If the argument required literals and some string was provided by user
        argument.literals?.length && text ? argument.literals.includes(text.toLowerCase()) ? text : undefined : text;
        if (valid) {
            return argument.lowercase ? valid.toLowerCase() : valid;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2FyZ3VtZW50cy9zdHJpbmcudHMjMz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYm90IH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5cbmJvdC5hcmd1bWVudHMuc2V0KFwic3RyaW5nXCIsIHtcbiAgbmFtZTogXCJzdHJpbmdcIixcbiAgZXhlY3V0ZTogZnVuY3Rpb24gKGFyZ3VtZW50LCBwYXJhbWV0ZXJzKSB7XG4gICAgY29uc3QgW3RleHRdID0gcGFyYW1ldGVycztcblxuICAgIGNvbnN0IHZhbGlkID1cbiAgICAgIC8vIElmIHRoZSBhcmd1bWVudCByZXF1aXJlZCBsaXRlcmFscyBhbmQgc29tZSBzdHJpbmcgd2FzIHByb3ZpZGVkIGJ5IHVzZXJcbiAgICAgIGFyZ3VtZW50LmxpdGVyYWxzPy5sZW5ndGggJiYgdGV4dFxuICAgICAgICA/IGFyZ3VtZW50LmxpdGVyYWxzLmluY2x1ZGVzKHRleHQudG9Mb3dlckNhc2UoKSkgPyB0ZXh0IDogdW5kZWZpbmVkXG4gICAgICAgIDogdGV4dDtcblxuICAgIGlmICh2YWxpZCkge1xuICAgICAgcmV0dXJuIGFyZ3VtZW50Lmxvd2VyY2FzZSA/IHZhbGlkLnRvTG93ZXJDYXNlKCkgOiB2YWxpZDtcbiAgICB9XG4gIH0sXG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxHQUFHLFNBQVEsY0FBZ0I7QUFFcEMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUMsTUFBUTtJQUN4QixJQUFJLEdBQUUsTUFBUTtJQUNkLE9BQU8sV0FBWSxRQUFRLEVBQUUsVUFBVTtlQUM5QixJQUFJLElBQUksVUFBVTtjQUVuQixLQUFLLEdBQ1QsRUFBeUUsQUFBekUsdUVBQXlFO1FBQ3pFLFFBQVEsQ0FBQyxRQUFRLEVBQUUsTUFBTSxJQUFJLElBQUksR0FDN0IsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsTUFBTSxJQUFJLEdBQUcsU0FBUyxHQUNqRSxJQUFJO1lBRU4sS0FBSzttQkFDQSxRQUFRLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxXQUFXLEtBQUssS0FBSyJ9