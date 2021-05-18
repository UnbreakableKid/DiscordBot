import { bot } from "../../cache.ts";
bot.arguments.set("number", {
    name: "number",
    execute: function(argument, parameters) {
        const [number] = parameters;
        const valid = Number(number);
        if (!valid) return;
        if (valid < (argument.minimum || 0)) return;
        if (argument.maximum && valid > argument.maximum) return;
        if (!argument.allowDecimals) return Math.floor(valid);
        if (valid) return valid;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2FyZ3VtZW50cy9udW1iZXIudHMjMz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYm90IH0gZnJvbSBcIi4uLy4uL2NhY2hlLnRzXCI7XG5cbmJvdC5hcmd1bWVudHMuc2V0KFwibnVtYmVyXCIsIHtcbiAgbmFtZTogXCJudW1iZXJcIixcbiAgZXhlY3V0ZTogZnVuY3Rpb24gKGFyZ3VtZW50LCBwYXJhbWV0ZXJzKSB7XG4gICAgY29uc3QgW251bWJlcl0gPSBwYXJhbWV0ZXJzO1xuXG4gICAgY29uc3QgdmFsaWQgPSBOdW1iZXIobnVtYmVyKTtcbiAgICBpZiAoIXZhbGlkKSByZXR1cm47XG5cbiAgICBpZiAodmFsaWQgPCAoYXJndW1lbnQubWluaW11bSB8fCAwKSkgcmV0dXJuO1xuICAgIGlmIChhcmd1bWVudC5tYXhpbXVtICYmIHZhbGlkID4gYXJndW1lbnQubWF4aW11bSkgcmV0dXJuO1xuICAgIGlmICghYXJndW1lbnQuYWxsb3dEZWNpbWFscykgcmV0dXJuIE1hdGguZmxvb3IodmFsaWQpO1xuXG4gICAgaWYgKHZhbGlkKSByZXR1cm4gdmFsaWQ7XG4gIH0sXG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxHQUFHLFNBQVEsY0FBZ0I7QUFFcEMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUMsTUFBUTtJQUN4QixJQUFJLEdBQUUsTUFBUTtJQUNkLE9BQU8sV0FBWSxRQUFRLEVBQUUsVUFBVTtlQUM5QixNQUFNLElBQUksVUFBVTtjQUVyQixLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU07YUFDdEIsS0FBSztZQUVOLEtBQUssSUFBSSxRQUFRLENBQUMsT0FBTyxJQUFJLENBQUM7WUFDOUIsUUFBUSxDQUFDLE9BQU8sSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLE9BQU87YUFDM0MsUUFBUSxDQUFDLGFBQWEsU0FBUyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUs7WUFFaEQsS0FBSyxTQUFTLEtBQUsifQ==