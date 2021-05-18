// deno-lint-ignore-file no-explicit-any
import { bold, cyan, gray, italic, red, yellow } from "../../deps.ts";
export var Loglevels;
(function(Loglevels) {
    Loglevels[Loglevels["Debug"] = 0] = "Debug";
    Loglevels[Loglevels["Info"] = 1] = "Info";
    Loglevels[Loglevels["Warn"] = 2] = "Warn";
    Loglevels[Loglevels["Error"] = 3] = "Error";
    Loglevels[Loglevels["Fatal"] = 4] = "Fatal";
})(Loglevels || (Loglevels = {
}));
const prefixes = new Map([
    [
        Loglevels.Debug,
        "DEBUG"
    ],
    [
        Loglevels.Info,
        "INFO"
    ],
    [
        Loglevels.Warn,
        "WARN"
    ],
    [
        Loglevels.Error,
        "ERROR"
    ],
    [
        Loglevels.Fatal,
        "FATAL"
    ], 
]);
const noColor = (msg)=>msg
;
const colorFunctions = new Map([
    [
        Loglevels.Debug,
        gray
    ],
    [
        Loglevels.Info,
        cyan
    ],
    [
        Loglevels.Warn,
        yellow
    ],
    [
        Loglevels.Error,
        (str)=>red(str)
    ],
    [
        Loglevels.Fatal,
        (str)=>red(bold(italic(str)))
    ], 
]);
export function logger({ logLevel =Loglevels.Info , name  } = {
}) {
    function log(level, ...args) {
        if (level < logLevel) return;
        let color = colorFunctions.get(level);
        if (!color) color = noColor;
        const date = new Date();
        const log = [
            `[${date.toLocaleDateString()} ${date.toLocaleTimeString()}]`,
            color(prefixes.get(level) || "DEBUG"),
            name ? `${name} >` : ">",
            ...args, 
        ];
        switch(level){
            case Loglevels.Debug:
                return console.debug(...log);
            case Loglevels.Info:
                return console.info(...log);
            case Loglevels.Warn:
                return console.warn(...log);
            case Loglevels.Error:
                return console.error(...log);
            case Loglevels.Fatal:
                return console.error(...log);
            default:
                return console.log(...log);
        }
    }
    function setLevel(level) {
        logLevel = level;
    }
    function debug(...args) {
        log(Loglevels.Debug, ...args);
    }
    function info(...args) {
        log(Loglevels.Info, ...args);
    }
    function warn(...args) {
        log(Loglevels.Warn, ...args);
    }
    function error(...args) {
        log(Loglevels.Error, ...args);
    }
    function fatal(...args) {
        log(Loglevels.Fatal, ...args);
    }
    return {
        log,
        setLevel,
        debug,
        info,
        warn,
        error,
        fatal
    };
}
export const log = logger();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxmaWxlOi8vL2hvbWUvcnVubmVyL0Rpc2NvcmRCb3Qvc3JjL3V0aWxzL2xvZ2dlci50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLy8gZGVuby1saW50LWlnbm9yZS1maWxlIG5vLWV4cGxpY2l0LWFueVxuaW1wb3J0IHsgYm9sZCwgY3lhbiwgZ3JheSwgaXRhbGljLCByZWQsIHllbGxvdyB9IGZyb20gXCIuLi8uLi9kZXBzLnRzXCI7XG5cbmV4cG9ydCBlbnVtIExvZ2xldmVscyB7XG4gIERlYnVnLFxuICBJbmZvLFxuICBXYXJuLFxuICBFcnJvcixcbiAgRmF0YWwsXG59XG5cbmNvbnN0IHByZWZpeGVzID0gbmV3IE1hcDxMb2dsZXZlbHMsIHN0cmluZz4oW1xuICBbTG9nbGV2ZWxzLkRlYnVnLCBcIkRFQlVHXCJdLFxuICBbTG9nbGV2ZWxzLkluZm8sIFwiSU5GT1wiXSxcbiAgW0xvZ2xldmVscy5XYXJuLCBcIldBUk5cIl0sXG4gIFtMb2dsZXZlbHMuRXJyb3IsIFwiRVJST1JcIl0sXG4gIFtMb2dsZXZlbHMuRmF0YWwsIFwiRkFUQUxcIl0sXG5dKTtcblxuY29uc3Qgbm9Db2xvcjogKHN0cjogc3RyaW5nKSA9PiBzdHJpbmcgPSAobXNnKSA9PiBtc2c7XG5jb25zdCBjb2xvckZ1bmN0aW9ucyA9IG5ldyBNYXA8TG9nbGV2ZWxzLCAoc3RyOiBzdHJpbmcpID0+IHN0cmluZz4oW1xuICBbTG9nbGV2ZWxzLkRlYnVnLCBncmF5XSxcbiAgW0xvZ2xldmVscy5JbmZvLCBjeWFuXSxcbiAgW0xvZ2xldmVscy5XYXJuLCB5ZWxsb3ddLFxuICBbTG9nbGV2ZWxzLkVycm9yLCAoc3RyOiBzdHJpbmcpID0+IHJlZChzdHIpXSxcbiAgW0xvZ2xldmVscy5GYXRhbCwgKHN0cjogc3RyaW5nKSA9PiByZWQoYm9sZChpdGFsaWMoc3RyKSkpXSxcbl0pO1xuXG5leHBvcnQgZnVuY3Rpb24gbG9nZ2VyKHtcbiAgbG9nTGV2ZWwgPSBMb2dsZXZlbHMuSW5mbyxcbiAgbmFtZSxcbn06IHtcbiAgbG9nTGV2ZWw/OiBMb2dsZXZlbHM7XG4gIG5hbWU/OiBzdHJpbmc7XG59ID0ge30pIHtcbiAgZnVuY3Rpb24gbG9nKGxldmVsOiBMb2dsZXZlbHMsIC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgaWYgKGxldmVsIDwgbG9nTGV2ZWwpIHJldHVybjtcblxuICAgIGxldCBjb2xvciA9IGNvbG9yRnVuY3Rpb25zLmdldChsZXZlbCk7XG4gICAgaWYgKCFjb2xvcikgY29sb3IgPSBub0NvbG9yO1xuXG4gICAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgbG9nID0gW1xuICAgICAgYFske2RhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKCl9ICR7ZGF0ZS50b0xvY2FsZVRpbWVTdHJpbmcoKX1dYCxcbiAgICAgIGNvbG9yKHByZWZpeGVzLmdldChsZXZlbCkgfHwgXCJERUJVR1wiKSxcbiAgICAgIG5hbWUgPyBgJHtuYW1lfSA+YCA6IFwiPlwiLFxuICAgICAgLi4uYXJncyxcbiAgICBdO1xuXG4gICAgc3dpdGNoIChsZXZlbCkge1xuICAgICAgY2FzZSBMb2dsZXZlbHMuRGVidWc6XG4gICAgICAgIHJldHVybiBjb25zb2xlLmRlYnVnKC4uLmxvZyk7XG4gICAgICBjYXNlIExvZ2xldmVscy5JbmZvOlxuICAgICAgICByZXR1cm4gY29uc29sZS5pbmZvKC4uLmxvZyk7XG4gICAgICBjYXNlIExvZ2xldmVscy5XYXJuOlxuICAgICAgICByZXR1cm4gY29uc29sZS53YXJuKC4uLmxvZyk7XG4gICAgICBjYXNlIExvZ2xldmVscy5FcnJvcjpcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoLi4ubG9nKTtcbiAgICAgIGNhc2UgTG9nbGV2ZWxzLkZhdGFsOlxuICAgICAgICByZXR1cm4gY29uc29sZS5lcnJvciguLi5sb2cpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUubG9nKC4uLmxvZyk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0TGV2ZWwobGV2ZWw6IExvZ2xldmVscykge1xuICAgIGxvZ0xldmVsID0gbGV2ZWw7XG4gIH1cblxuICBmdW5jdGlvbiBkZWJ1ZyguLi5hcmdzOiBhbnlbXSkge1xuICAgIGxvZyhMb2dsZXZlbHMuRGVidWcsIC4uLmFyZ3MpO1xuICB9XG5cbiAgZnVuY3Rpb24gaW5mbyguLi5hcmdzOiBhbnlbXSkge1xuICAgIGxvZyhMb2dsZXZlbHMuSW5mbywgLi4uYXJncyk7XG4gIH1cblxuICBmdW5jdGlvbiB3YXJuKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgbG9nKExvZ2xldmVscy5XYXJuLCAuLi5hcmdzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVycm9yKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgbG9nKExvZ2xldmVscy5FcnJvciwgLi4uYXJncyk7XG4gIH1cblxuICBmdW5jdGlvbiBmYXRhbCguLi5hcmdzOiBhbnlbXSkge1xuICAgIGxvZyhMb2dsZXZlbHMuRmF0YWwsIC4uLmFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBsb2csXG4gICAgc2V0TGV2ZWwsXG4gICAgZGVidWcsXG4gICAgaW5mbyxcbiAgICB3YXJuLFxuICAgIGVycm9yLFxuICAgIGZhdGFsLFxuICB9O1xufVxuXG5leHBvcnQgY29uc3QgbG9nID0gbG9nZ2VyKCk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFBd0MsQUFBeEMsc0NBQXdDO1NBQy9CLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxTQUFRLGFBQWU7O1VBRXpELFNBQVM7SUFBVCxTQUFTLENBQVQsU0FBUyxFQUNuQixLQUFLLEtBQUwsQ0FBSyxLQUFMLEtBQUs7SUFESyxTQUFTLENBQVQsU0FBUyxFQUVuQixJQUFJLEtBQUosQ0FBSSxLQUFKLElBQUk7SUFGTSxTQUFTLENBQVQsU0FBUyxFQUduQixJQUFJLEtBQUosQ0FBSSxLQUFKLElBQUk7SUFITSxTQUFTLENBQVQsU0FBUyxFQUluQixLQUFLLEtBQUwsQ0FBSyxLQUFMLEtBQUs7SUFKSyxTQUFTLENBQVQsU0FBUyxFQUtuQixLQUFLLEtBQUwsQ0FBSyxLQUFMLEtBQUs7R0FMSyxTQUFTLEtBQVQsU0FBUzs7TUFRZixRQUFRLE9BQU8sR0FBRzs7UUFDckIsU0FBUyxDQUFDLEtBQUs7U0FBRSxLQUFPOzs7UUFDeEIsU0FBUyxDQUFDLElBQUk7U0FBRSxJQUFNOzs7UUFDdEIsU0FBUyxDQUFDLElBQUk7U0FBRSxJQUFNOzs7UUFDdEIsU0FBUyxDQUFDLEtBQUs7U0FBRSxLQUFPOzs7UUFDeEIsU0FBUyxDQUFDLEtBQUs7U0FBRSxLQUFPOzs7TUFHckIsT0FBTyxJQUE2QixHQUFHLEdBQUssR0FBRzs7TUFDL0MsY0FBYyxPQUFPLEdBQUc7O1FBQzNCLFNBQVMsQ0FBQyxLQUFLO1FBQUUsSUFBSTs7O1FBQ3JCLFNBQVMsQ0FBQyxJQUFJO1FBQUUsSUFBSTs7O1FBQ3BCLFNBQVMsQ0FBQyxJQUFJO1FBQUUsTUFBTTs7O1FBQ3RCLFNBQVMsQ0FBQyxLQUFLO1NBQUcsR0FBVyxHQUFLLEdBQUcsQ0FBQyxHQUFHOzs7UUFDekMsU0FBUyxDQUFDLEtBQUs7U0FBRyxHQUFXLEdBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRzs7O2dCQUd4QyxNQUFNLEdBQ3BCLFFBQVEsRUFBRyxTQUFTLENBQUMsSUFBSSxHQUN6QixJQUFJOzthQUtLLEdBQUcsQ0FBQyxLQUFnQixLQUFLLElBQUk7WUFDaEMsS0FBSyxHQUFHLFFBQVE7WUFFaEIsS0FBSyxHQUFHLGNBQWMsQ0FBQyxHQUFHLENBQUMsS0FBSzthQUMvQixLQUFLLEVBQUUsS0FBSyxHQUFHLE9BQU87Y0FFckIsSUFBSSxPQUFPLElBQUk7Y0FDZixHQUFHO2FBQ04sQ0FBQyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixHQUFHLENBQUM7WUFDNUQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxNQUFLLEtBQU87WUFDcEMsSUFBSSxNQUFNLElBQUksQ0FBQyxFQUFFLEtBQUksQ0FBRztlQUNyQixJQUFJOztlQUdELEtBQUs7aUJBQ04sU0FBUyxDQUFDLEtBQUs7dUJBQ1gsT0FBTyxDQUFDLEtBQUssSUFBSSxHQUFHO2lCQUN4QixTQUFTLENBQUMsSUFBSTt1QkFDVixPQUFPLENBQUMsSUFBSSxJQUFJLEdBQUc7aUJBQ3ZCLFNBQVMsQ0FBQyxJQUFJO3VCQUNWLE9BQU8sQ0FBQyxJQUFJLElBQUksR0FBRztpQkFDdkIsU0FBUyxDQUFDLEtBQUs7dUJBQ1gsT0FBTyxDQUFDLEtBQUssSUFBSSxHQUFHO2lCQUN4QixTQUFTLENBQUMsS0FBSzt1QkFDWCxPQUFPLENBQUMsS0FBSyxJQUFJLEdBQUc7O3VCQUVwQixPQUFPLENBQUMsR0FBRyxJQUFJLEdBQUc7OzthQUl0QixRQUFRLENBQUMsS0FBZ0I7UUFDaEMsUUFBUSxHQUFHLEtBQUs7O2FBR1QsS0FBSyxJQUFJLElBQUk7UUFDcEIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEtBQUssSUFBSTs7YUFHckIsSUFBSSxJQUFJLElBQUk7UUFDbkIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssSUFBSTs7YUFHcEIsSUFBSSxJQUFJLElBQUk7UUFDbkIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssSUFBSTs7YUFHcEIsS0FBSyxJQUFJLElBQUk7UUFDcEIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEtBQUssSUFBSTs7YUFHckIsS0FBSyxJQUFJLElBQUk7UUFDcEIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEtBQUssSUFBSTs7O1FBSTVCLEdBQUc7UUFDSCxRQUFRO1FBQ1IsS0FBSztRQUNMLElBQUk7UUFDSixJQUFJO1FBQ0osS0FBSztRQUNMLEtBQUs7OzthQUlJLEdBQUcsR0FBRyxNQUFNIn0=