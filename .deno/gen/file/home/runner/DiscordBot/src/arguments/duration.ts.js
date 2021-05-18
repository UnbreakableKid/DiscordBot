import { bot } from "../../cache.ts";
import { stringToMilliseconds } from "../utils/helpers.ts";
bot.arguments.set("duration", {
    name: "duration",
    execute: function(_argument, parameters) {
        const [time] = parameters;
        if (!time) return;
        return stringToMilliseconds(time);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL2FyZ3VtZW50cy9kdXJhdGlvbi50cyMzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBib3QgfSBmcm9tIFwiLi4vLi4vY2FjaGUudHNcIjtcbmltcG9ydCB7IHN0cmluZ1RvTWlsbGlzZWNvbmRzIH0gZnJvbSBcIi4uL3V0aWxzL2hlbHBlcnMudHNcIjtcblxuYm90LmFyZ3VtZW50cy5zZXQoXCJkdXJhdGlvblwiLCB7XG4gIG5hbWU6IFwiZHVyYXRpb25cIixcbiAgZXhlY3V0ZTogZnVuY3Rpb24gKF9hcmd1bWVudCwgcGFyYW1ldGVycykge1xuICAgIGNvbnN0IFt0aW1lXSA9IHBhcmFtZXRlcnM7XG4gICAgaWYgKCF0aW1lKSByZXR1cm47XG5cbiAgICByZXR1cm4gc3RyaW5nVG9NaWxsaXNlY29uZHModGltZSk7XG4gIH0sXG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxHQUFHLFNBQVEsY0FBZ0I7U0FDM0Isb0JBQW9CLFNBQVEsbUJBQXFCO0FBRTFELEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFDLFFBQVU7SUFDMUIsSUFBSSxHQUFFLFFBQVU7SUFDaEIsT0FBTyxXQUFZLFNBQVMsRUFBRSxVQUFVO2VBQy9CLElBQUksSUFBSSxVQUFVO2FBQ3BCLElBQUk7ZUFFRixvQkFBb0IsQ0FBQyxJQUFJIn0=