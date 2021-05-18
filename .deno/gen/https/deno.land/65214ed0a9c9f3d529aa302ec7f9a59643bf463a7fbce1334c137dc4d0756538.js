import { difference, removeEmptyValues } from "./util.ts";
export function parse(rawDotenv) {
    const env = {
    };
    for (const line of rawDotenv.split("\n")){
        if (!isVariableStart(line)) continue;
        const key = line.slice(0, line.indexOf("=")).trim();
        let value = line.slice(line.indexOf("=") + 1).trim();
        if (hasSingleQuotes(value)) {
            value = value.slice(1, -1);
        } else if (hasDoubleQuotes(value)) {
            value = value.slice(1, -1);
            value = expandNewlines(value);
        } else value = value.trim();
        env[key] = value;
    }
    return env;
}
export function config(options = {
}) {
    const o = Object.assign({
        path: `.env`,
        export: false,
        safe: false,
        example: `.env.example`,
        allowEmptyValues: false,
        defaults: `.env.defaults`
    }, options);
    const conf = parseFile(o.path);
    if (o.safe) {
        const confExample = parseFile(o.example);
        assertSafe(conf, confExample, o.allowEmptyValues);
    }
    if (o.defaults) {
        const confDefaults = parseFile(o.defaults);
        for(const key in confDefaults){
            if (!(key in conf)) {
                conf[key] = confDefaults[key];
            }
        }
    }
    if (o.export) {
        for(const key in conf){
            if (Deno.env.get(key) !== undefined) continue;
            Deno.env.set(key, conf[key]);
        }
    }
    return conf;
}
function parseFile(filepath) {
    try {
        return parse(new TextDecoder("utf-8").decode(Deno.readFileSync(filepath)));
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) return {
        };
        throw e;
    }
}
function isVariableStart(str) {
    return /^\s*[a-zA-Z_][a-zA-Z_0-9 ]*\s*=/.test(str);
}
function hasSingleQuotes(str) {
    return /^'([\s\S]*)'$/.test(str);
}
function hasDoubleQuotes(str) {
    return /^"([\s\S]*)"$/.test(str);
}
function expandNewlines(str) {
    return str.replaceAll("\\n", "\n");
}
function assertSafe(conf, confExample, allowEmptyValues) {
    const currentEnv = Deno.env.toObject();
    // Not all the variables have to be defined in .env, they can be supplied externally
    const confWithEnv = Object.assign({
    }, currentEnv, conf);
    const missing = difference(Object.keys(confExample), // If allowEmptyValues is false, filter out empty values from configuration
    Object.keys(allowEmptyValues ? confWithEnv : removeEmptyValues(confWithEnv)));
    if (missing.length > 0) {
        const errorMessages = [
            `The following variables were defined in the example file but are not present in the environment:\n  ${missing.join(", ")}`,
            `Make sure to add them to your env file.`,
            !allowEmptyValues && `If you expect any of these variables to be empty, you can set the allowEmptyValues option to true.`, 
        ];
        throw new MissingEnvVarsError(errorMessages.filter(Boolean).join("\n\n"));
    }
}
export class MissingEnvVarsError extends Error {
    constructor(message){
        super(message);
        this.name = "MissingEnvVarsError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2RvdGVudkB2Mi4wLjAvbW9kLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkaWZmZXJlbmNlLCByZW1vdmVFbXB0eVZhbHVlcyB9IGZyb20gXCIuL3V0aWwudHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBEb3RlbnZDb25maWcge1xuICBba2V5OiBzdHJpbmddOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29uZmlnT3B0aW9ucyB7XG4gIHBhdGg/OiBzdHJpbmc7XG4gIGV4cG9ydD86IGJvb2xlYW47XG4gIHNhZmU/OiBib29sZWFuO1xuICBleGFtcGxlPzogc3RyaW5nO1xuICBhbGxvd0VtcHR5VmFsdWVzPzogYm9vbGVhbjtcbiAgZGVmYXVsdHM/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShyYXdEb3RlbnY6IHN0cmluZyk6IERvdGVudkNvbmZpZyB7XG4gIGNvbnN0IGVudjogRG90ZW52Q29uZmlnID0ge307XG5cbiAgZm9yIChjb25zdCBsaW5lIG9mIHJhd0RvdGVudi5zcGxpdChcIlxcblwiKSkge1xuICAgIGlmICghaXNWYXJpYWJsZVN0YXJ0KGxpbmUpKSBjb250aW51ZTtcbiAgICBjb25zdCBrZXkgPSBsaW5lLnNsaWNlKDAsIGxpbmUuaW5kZXhPZihcIj1cIikpLnRyaW0oKTtcbiAgICBsZXQgdmFsdWUgPSBsaW5lLnNsaWNlKGxpbmUuaW5kZXhPZihcIj1cIikgKyAxKS50cmltKCk7XG4gICAgaWYgKGhhc1NpbmdsZVF1b3Rlcyh2YWx1ZSkpIHtcbiAgICAgIHZhbHVlID0gdmFsdWUuc2xpY2UoMSwgLTEpO1xuICAgIH0gZWxzZSBpZiAoaGFzRG91YmxlUXVvdGVzKHZhbHVlKSkge1xuICAgICAgdmFsdWUgPSB2YWx1ZS5zbGljZSgxLCAtMSk7XG4gICAgICB2YWx1ZSA9IGV4cGFuZE5ld2xpbmVzKHZhbHVlKTtcbiAgICB9IGVsc2UgdmFsdWUgPSB2YWx1ZS50cmltKCk7XG4gICAgZW52W2tleV0gPSB2YWx1ZTtcbiAgfVxuXG4gIHJldHVybiBlbnY7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25maWcob3B0aW9uczogQ29uZmlnT3B0aW9ucyA9IHt9KTogRG90ZW52Q29uZmlnIHtcbiAgY29uc3QgbzogUmVxdWlyZWQ8Q29uZmlnT3B0aW9ucz4gPSBPYmplY3QuYXNzaWduKFxuICAgIHtcbiAgICAgIHBhdGg6IGAuZW52YCxcbiAgICAgIGV4cG9ydDogZmFsc2UsXG4gICAgICBzYWZlOiBmYWxzZSxcbiAgICAgIGV4YW1wbGU6IGAuZW52LmV4YW1wbGVgLFxuICAgICAgYWxsb3dFbXB0eVZhbHVlczogZmFsc2UsXG4gICAgICBkZWZhdWx0czogYC5lbnYuZGVmYXVsdHNgLFxuICAgIH0sXG4gICAgb3B0aW9ucyxcbiAgKTtcblxuICBjb25zdCBjb25mID0gcGFyc2VGaWxlKG8ucGF0aCk7XG5cbiAgaWYgKG8uc2FmZSkge1xuICAgIGNvbnN0IGNvbmZFeGFtcGxlID0gcGFyc2VGaWxlKG8uZXhhbXBsZSk7XG4gICAgYXNzZXJ0U2FmZShjb25mLCBjb25mRXhhbXBsZSwgby5hbGxvd0VtcHR5VmFsdWVzKTtcbiAgfVxuXG4gIGlmIChvLmRlZmF1bHRzKSB7XG4gICAgY29uc3QgY29uZkRlZmF1bHRzID0gcGFyc2VGaWxlKG8uZGVmYXVsdHMpO1xuICAgIGZvciAoY29uc3Qga2V5IGluIGNvbmZEZWZhdWx0cykge1xuICAgICAgaWYgKCEoa2V5IGluIGNvbmYpKSB7XG4gICAgICAgIGNvbmZba2V5XSA9IGNvbmZEZWZhdWx0c1trZXldO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChvLmV4cG9ydCkge1xuICAgIGZvciAoY29uc3Qga2V5IGluIGNvbmYpIHtcbiAgICAgIGlmIChEZW5vLmVudi5nZXQoa2V5KSAhPT0gdW5kZWZpbmVkKSBjb250aW51ZTtcbiAgICAgIERlbm8uZW52LnNldChrZXksIGNvbmZba2V5XSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvbmY7XG59XG5cbmZ1bmN0aW9uIHBhcnNlRmlsZShmaWxlcGF0aDogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHBhcnNlKG5ldyBUZXh0RGVjb2RlcihcInV0Zi04XCIpLmRlY29kZShEZW5vLnJlYWRGaWxlU3luYyhmaWxlcGF0aCkpKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChlIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuTm90Rm91bmQpIHJldHVybiB7fTtcbiAgICB0aHJvdyBlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzVmFyaWFibGVTdGFydChzdHI6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gL15cXHMqW2EtekEtWl9dW2EtekEtWl8wLTkgXSpcXHMqPS8udGVzdChzdHIpO1xufVxuXG5mdW5jdGlvbiBoYXNTaW5nbGVRdW90ZXMoc3RyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIC9eJyhbXFxzXFxTXSopJyQvLnRlc3Qoc3RyKTtcbn1cblxuZnVuY3Rpb24gaGFzRG91YmxlUXVvdGVzKHN0cjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiAvXlwiKFtcXHNcXFNdKilcIiQvLnRlc3Qoc3RyKTtcbn1cblxuZnVuY3Rpb24gZXhwYW5kTmV3bGluZXMoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gc3RyLnJlcGxhY2VBbGwoXCJcXFxcblwiLCBcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0U2FmZShcbiAgY29uZjogRG90ZW52Q29uZmlnLFxuICBjb25mRXhhbXBsZTogRG90ZW52Q29uZmlnLFxuICBhbGxvd0VtcHR5VmFsdWVzOiBib29sZWFuLFxuKSB7XG4gIGNvbnN0IGN1cnJlbnRFbnYgPSBEZW5vLmVudi50b09iamVjdCgpO1xuXG4gIC8vIE5vdCBhbGwgdGhlIHZhcmlhYmxlcyBoYXZlIHRvIGJlIGRlZmluZWQgaW4gLmVudiwgdGhleSBjYW4gYmUgc3VwcGxpZWQgZXh0ZXJuYWxseVxuICBjb25zdCBjb25mV2l0aEVudiA9IE9iamVjdC5hc3NpZ24oe30sIGN1cnJlbnRFbnYsIGNvbmYpO1xuXG4gIGNvbnN0IG1pc3NpbmcgPSBkaWZmZXJlbmNlKFxuICAgIE9iamVjdC5rZXlzKGNvbmZFeGFtcGxlKSxcbiAgICAvLyBJZiBhbGxvd0VtcHR5VmFsdWVzIGlzIGZhbHNlLCBmaWx0ZXIgb3V0IGVtcHR5IHZhbHVlcyBmcm9tIGNvbmZpZ3VyYXRpb25cbiAgICBPYmplY3Qua2V5cyhcbiAgICAgIGFsbG93RW1wdHlWYWx1ZXMgPyBjb25mV2l0aEVudiA6IHJlbW92ZUVtcHR5VmFsdWVzKGNvbmZXaXRoRW52KSxcbiAgICApLFxuICApO1xuXG4gIGlmIChtaXNzaW5nLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBlcnJvck1lc3NhZ2VzID0gW1xuICAgICAgYFRoZSBmb2xsb3dpbmcgdmFyaWFibGVzIHdlcmUgZGVmaW5lZCBpbiB0aGUgZXhhbXBsZSBmaWxlIGJ1dCBhcmUgbm90IHByZXNlbnQgaW4gdGhlIGVudmlyb25tZW50OlxcbiAgJHtcbiAgICAgICAgbWlzc2luZy5qb2luKFxuICAgICAgICAgIFwiLCBcIixcbiAgICAgICAgKVxuICAgICAgfWAsXG4gICAgICBgTWFrZSBzdXJlIHRvIGFkZCB0aGVtIHRvIHlvdXIgZW52IGZpbGUuYCxcbiAgICAgICFhbGxvd0VtcHR5VmFsdWVzICYmXG4gICAgICBgSWYgeW91IGV4cGVjdCBhbnkgb2YgdGhlc2UgdmFyaWFibGVzIHRvIGJlIGVtcHR5LCB5b3UgY2FuIHNldCB0aGUgYWxsb3dFbXB0eVZhbHVlcyBvcHRpb24gdG8gdHJ1ZS5gLFxuICAgIF07XG5cbiAgICB0aHJvdyBuZXcgTWlzc2luZ0VudlZhcnNFcnJvcihlcnJvck1lc3NhZ2VzLmZpbHRlcihCb29sZWFuKS5qb2luKFwiXFxuXFxuXCIpKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTWlzc2luZ0VudlZhcnNFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZT86IHN0cmluZykge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMubmFtZSA9IFwiTWlzc2luZ0VudlZhcnNFcnJvclwiO1xuICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZih0aGlzLCBuZXcudGFyZ2V0LnByb3RvdHlwZSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxVQUFVLEVBQUUsaUJBQWlCLFNBQVEsU0FBVztnQkFlekMsS0FBSyxDQUFDLFNBQWlCO1VBQy9CLEdBQUc7O2VBRUUsSUFBSSxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUMsRUFBSTthQUNoQyxlQUFlLENBQUMsSUFBSTtjQUNuQixHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBQyxDQUFHLElBQUcsSUFBSTtZQUM3QyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFDLENBQUcsS0FBSSxDQUFDLEVBQUUsSUFBSTtZQUM5QyxlQUFlLENBQUMsS0FBSztZQUN2QixLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQzttQkFDaEIsZUFBZSxDQUFDLEtBQUs7WUFDOUIsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUM7WUFDekIsS0FBSyxHQUFHLGNBQWMsQ0FBQyxLQUFLO2VBQ3ZCLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSTtRQUN6QixHQUFHLENBQUMsR0FBRyxJQUFJLEtBQUs7O1dBR1gsR0FBRzs7Z0JBR0ksTUFBTSxDQUFDLE9BQXNCOztVQUNyQyxDQUFDLEdBQTRCLE1BQU0sQ0FBQyxNQUFNO1FBRTVDLElBQUksR0FBRyxJQUFJO1FBQ1gsTUFBTSxFQUFFLEtBQUs7UUFDYixJQUFJLEVBQUUsS0FBSztRQUNYLE9BQU8sR0FBRyxZQUFZO1FBQ3RCLGdCQUFnQixFQUFFLEtBQUs7UUFDdkIsUUFBUSxHQUFHLGFBQWE7T0FFMUIsT0FBTztVQUdILElBQUksR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUk7UUFFekIsQ0FBQyxDQUFDLElBQUk7Y0FDRixXQUFXLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPO1FBQ3ZDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxnQkFBZ0I7O1FBRzlDLENBQUMsQ0FBQyxRQUFRO2NBQ04sWUFBWSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUTtrQkFDOUIsR0FBRyxJQUFJLFlBQVk7a0JBQ3RCLEdBQUcsSUFBSSxJQUFJO2dCQUNmLElBQUksQ0FBQyxHQUFHLElBQUksWUFBWSxDQUFDLEdBQUc7Ozs7UUFLOUIsQ0FBQyxDQUFDLE1BQU07a0JBQ0MsR0FBRyxJQUFJLElBQUk7Z0JBQ2hCLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxTQUFTO1lBQ25DLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRzs7O1dBSXZCLElBQUk7O1NBR0osU0FBUyxDQUFDLFFBQWdCOztlQUV4QixLQUFLLEtBQUssV0FBVyxFQUFDLEtBQU8sR0FBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRO2FBQ2hFLENBQUM7WUFDSixDQUFDLFlBQVksSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFROztjQUMvQixDQUFDOzs7U0FJRixlQUFlLENBQUMsR0FBVzs2Q0FDTyxJQUFJLENBQUMsR0FBRzs7U0FHMUMsZUFBZSxDQUFDLEdBQVc7MkJBQ1gsSUFBSSxDQUFDLEdBQUc7O1NBR3hCLGVBQWUsQ0FBQyxHQUFXOzJCQUNYLElBQUksQ0FBQyxHQUFHOztTQUd4QixjQUFjLENBQUMsR0FBVztXQUMxQixHQUFHLENBQUMsVUFBVSxFQUFDLEdBQUssSUFBRSxFQUFJOztTQUcxQixVQUFVLENBQ2pCLElBQWtCLEVBQ2xCLFdBQXlCLEVBQ3pCLGdCQUF5QjtVQUVuQixVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRO0lBRXBDLEVBQW9GLEFBQXBGLGtGQUFvRjtVQUM5RSxXQUFXLEdBQUcsTUFBTSxDQUFDLE1BQU07T0FBSyxVQUFVLEVBQUUsSUFBSTtVQUVoRCxPQUFPLEdBQUcsVUFBVSxDQUN4QixNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsR0FDdkIsRUFBMkUsQUFBM0UseUVBQTJFO0lBQzNFLE1BQU0sQ0FBQyxJQUFJLENBQ1QsZ0JBQWdCLEdBQUcsV0FBVyxHQUFHLGlCQUFpQixDQUFDLFdBQVc7UUFJOUQsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDO2NBQ2QsYUFBYTthQUNoQixvR0FBb0csRUFDbkcsT0FBTyxDQUFDLElBQUksRUFDVixFQUFJO2FBR1AsdUNBQXVDO2FBQ3ZDLGdCQUFnQixLQUNoQixrR0FBa0c7O2tCQUczRixtQkFBbUIsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsSUFBTTs7O2FBSTlELG1CQUFtQixTQUFTLEtBQUs7Z0JBQ2hDLE9BQWdCO1FBQzFCLEtBQUssQ0FBQyxPQUFPO2FBQ1IsSUFBSSxJQUFHLG1CQUFxQjtRQUNqQyxNQUFNLENBQUMsY0FBYyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyJ9