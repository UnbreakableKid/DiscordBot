import { Tokenizer } from "./tokenizer.ts";
function digits(value, count = 2) {
    return String(value).padStart(count, "0");
}
function createLiteralTestFunction(value) {
    return (string)=>{
        return string.startsWith(value) ? {
            value,
            length: value.length
        } : undefined;
    };
}
function createMatchTestFunction(match) {
    return (string)=>{
        const result = match.exec(string);
        if (result) return {
            value: result,
            length: result[0].length
        };
    };
}
// according to unicode symbols (http://userguide.icu-project.org/formatparse/datetime)
const defaultRules = [
    {
        test: createLiteralTestFunction("yyyy"),
        fn: ()=>({
                type: "year",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("yy"),
        fn: ()=>({
                type: "year",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("MM"),
        fn: ()=>({
                type: "month",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("M"),
        fn: ()=>({
                type: "month",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("dd"),
        fn: ()=>({
                type: "day",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("d"),
        fn: ()=>({
                type: "day",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("hh"),
        fn: ()=>({
                type: "hour",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("h"),
        fn: ()=>({
                type: "hour",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("mm"),
        fn: ()=>({
                type: "minute",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("m"),
        fn: ()=>({
                type: "minute",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("ss"),
        fn: ()=>({
                type: "second",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("s"),
        fn: ()=>({
                type: "second",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("SSS"),
        fn: ()=>({
                type: "fractionalSecond",
                value: 3
            })
    },
    {
        test: createLiteralTestFunction("SS"),
        fn: ()=>({
                type: "fractionalSecond",
                value: 2
            })
    },
    {
        test: createLiteralTestFunction("S"),
        fn: ()=>({
                type: "fractionalSecond",
                value: 1
            })
    },
    {
        test: createLiteralTestFunction("a"),
        fn: (value)=>({
                type: "dayPeriod",
                value: value
            })
    },
    // quoted literal
    {
        test: createMatchTestFunction(/^(')(?<value>\\.|[^\']*)\1/),
        fn: (match)=>({
                type: "literal",
                value: match.groups.value
            })
    },
    // literal
    {
        test: createMatchTestFunction(/^.+?\s*/),
        fn: (match)=>({
                type: "literal",
                value: match[0]
            })
    }, 
];
export class DateTimeFormatter {
    #format;
    constructor(formatString, rules = defaultRules){
        const tokenizer = new Tokenizer(rules);
        this.#format = tokenizer.tokenize(formatString, ({ type , value  })=>({
                type,
                value
            })
        );
    }
    format(date, options = {
    }) {
        let string = "";
        const utc = options.timeZone === "UTC";
        const hour12 = this.#format.find((token)=>token.type === "dayPeriod"
        );
        for (const token of this.#format){
            const type = token.type;
            switch(type){
                case "year":
                    {
                        const value = utc ? date.getUTCFullYear() : date.getFullYear();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2).slice(-2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "month":
                    {
                        const value = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "day":
                    {
                        const value = utc ? date.getUTCDate() : date.getDate();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "hour":
                    {
                        let value = utc ? date.getUTCHours() : date.getHours();
                        value -= hour12 && date.getHours() > 12 ? 12 : 0;
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "minute":
                    {
                        const value = utc ? date.getUTCMinutes() : date.getMinutes();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "second":
                    {
                        const value = utc ? date.getUTCSeconds() : date.getSeconds();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "fractionalSecond":
                    {
                        const value = utc ? date.getUTCMilliseconds() : date.getMilliseconds();
                        string += digits(value, Number(token.value));
                        break;
                    }
                case "timeZoneName":
                    {
                    // string += utc ? "Z" : token.value
                    // break
                    }
                case "dayPeriod":
                    {
                        string += hour12 ? date.getHours() >= 12 ? "PM" : "AM" : "";
                        break;
                    }
                case "literal":
                    {
                        string += token.value;
                        break;
                    }
                default:
                    throw Error(`FormatterError: { ${token.type} ${token.value} }`);
            }
        }
        return string;
    }
    parseToParts(string) {
        const parts = [];
        for (const token of this.#format){
            const type = token.type;
            let value = "";
            switch(token.type){
                case "year":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,4}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                        }
                        break;
                    }
                case "month":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            case "narrow":
                                {
                                    value = /^[a-zA-Z]+/.exec(string)?.[0];
                                    break;
                                }
                            case "short":
                                {
                                    value = /^[a-zA-Z]+/.exec(string)?.[0];
                                    break;
                                }
                            case "long":
                                {
                                    value = /^[a-zA-Z]+/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "day":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "hour":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "minute":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "second":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "fractionalSecond":
                    {
                        value = new RegExp(`^\\d{${token.value}}`).exec(string)?.[0];
                        break;
                    }
                case "timeZoneName":
                    {
                        value = token.value;
                        break;
                    }
                case "dayPeriod":
                    {
                        value = /^(A|P)M/.exec(string)?.[0];
                        break;
                    }
                case "literal":
                    {
                        if (!string.startsWith(token.value)) {
                            throw Error(`Literal "${token.value}" not found "${string.slice(0, 25)}"`);
                        }
                        value = token.value;
                        break;
                    }
                default:
                    throw Error(`${token.type} ${token.value}`);
            }
            if (!value) {
                throw Error(`value not valid for token { ${type} ${value} } ${string.slice(0, 25)}`);
            }
            parts.push({
                type,
                value
            });
            string = string.slice(value.length);
        }
        if (string.length) {
            throw Error(`datetime string was not fully parsed! ${string.slice(0, 25)}`);
        }
        return parts;
    }
    partsToDate(parts) {
        const date = new Date();
        const utc = parts.find((part)=>part.type === "timeZoneName" && part.value === "UTC"
        );
        utc ? date.setUTCHours(0, 0, 0, 0) : date.setHours(0, 0, 0, 0);
        for (const part of parts){
            switch(part.type){
                case "year":
                    {
                        const value = Number(part.value.padStart(4, "20"));
                        utc ? date.setUTCFullYear(value) : date.setFullYear(value);
                        break;
                    }
                case "month":
                    {
                        const value = Number(part.value) - 1;
                        utc ? date.setUTCMonth(value) : date.setMonth(value);
                        break;
                    }
                case "day":
                    {
                        const value = Number(part.value);
                        utc ? date.setUTCDate(value) : date.setDate(value);
                        break;
                    }
                case "hour":
                    {
                        let value = Number(part.value);
                        const dayPeriod = parts.find((part)=>part.type === "dayPeriod"
                        );
                        if (dayPeriod?.value === "PM") value += 12;
                        utc ? date.setUTCHours(value) : date.setHours(value);
                        break;
                    }
                case "minute":
                    {
                        const value = Number(part.value);
                        utc ? date.setUTCMinutes(value) : date.setMinutes(value);
                        break;
                    }
                case "second":
                    {
                        const value = Number(part.value);
                        utc ? date.setUTCSeconds(value) : date.setSeconds(value);
                        break;
                    }
                case "fractionalSecond":
                    {
                        const value = Number(part.value);
                        utc ? date.setUTCMilliseconds(value) : date.setMilliseconds(value);
                        break;
                    }
            }
        }
        return date;
    }
    parse(string) {
        const parts = this.parseToParts(string);
        return this.partsToDate(parts);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC42OS4wL2RhdGV0aW1lL2Zvcm1hdHRlci50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQ2FsbGJhY2tSZXN1bHQsXG4gIFJ1bGUsXG4gIFRlc3RGdW5jdGlvbixcbiAgVGVzdFJlc3VsdCxcbiAgVG9rZW5pemVyLFxufSBmcm9tIFwiLi90b2tlbml6ZXIudHNcIjtcblxuZnVuY3Rpb24gZGlnaXRzKHZhbHVlOiBzdHJpbmcgfCBudW1iZXIsIGNvdW50ID0gMik6IHN0cmluZyB7XG4gIHJldHVybiBTdHJpbmcodmFsdWUpLnBhZFN0YXJ0KGNvdW50LCBcIjBcIik7XG59XG5cbi8vIGFzIGRlY2xhcmVkIGFzIGluIG5hbWVzcGFjZSBJbnRsXG50eXBlIERhdGVUaW1lRm9ybWF0UGFydFR5cGVzID1cbiAgfCBcImRheVwiXG4gIHwgXCJkYXlQZXJpb2RcIlxuICAvLyB8IFwiZXJhXCJcbiAgfCBcImhvdXJcIlxuICB8IFwibGl0ZXJhbFwiXG4gIHwgXCJtaW51dGVcIlxuICB8IFwibW9udGhcIlxuICB8IFwic2Vjb25kXCJcbiAgfCBcInRpbWVab25lTmFtZVwiXG4gIC8vIHwgXCJ3ZWVrZGF5XCJcbiAgfCBcInllYXJcIlxuICB8IFwiZnJhY3Rpb25hbFNlY29uZFwiO1xuXG5pbnRlcmZhY2UgRGF0ZVRpbWVGb3JtYXRQYXJ0IHtcbiAgdHlwZTogRGF0ZVRpbWVGb3JtYXRQYXJ0VHlwZXM7XG4gIHZhbHVlOiBzdHJpbmc7XG59XG5cbnR5cGUgVGltZVpvbmUgPSBcIlVUQ1wiO1xuXG5pbnRlcmZhY2UgT3B0aW9ucyB7XG4gIHRpbWVab25lPzogVGltZVpvbmU7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24odmFsdWU6IHN0cmluZyk6IFRlc3RGdW5jdGlvbiB7XG4gIHJldHVybiAoc3RyaW5nOiBzdHJpbmcpOiBUZXN0UmVzdWx0ID0+IHtcbiAgICByZXR1cm4gc3RyaW5nLnN0YXJ0c1dpdGgodmFsdWUpXG4gICAgICA/IHsgdmFsdWUsIGxlbmd0aDogdmFsdWUubGVuZ3RoIH1cbiAgICAgIDogdW5kZWZpbmVkO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVNYXRjaFRlc3RGdW5jdGlvbihtYXRjaDogUmVnRXhwKTogVGVzdEZ1bmN0aW9uIHtcbiAgcmV0dXJuIChzdHJpbmc6IHN0cmluZyk6IFRlc3RSZXN1bHQgPT4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IG1hdGNoLmV4ZWMoc3RyaW5nKTtcbiAgICBpZiAocmVzdWx0KSByZXR1cm4geyB2YWx1ZTogcmVzdWx0LCBsZW5ndGg6IHJlc3VsdFswXS5sZW5ndGggfTtcbiAgfTtcbn1cblxuLy8gYWNjb3JkaW5nIHRvIHVuaWNvZGUgc3ltYm9scyAoaHR0cDovL3VzZXJndWlkZS5pY3UtcHJvamVjdC5vcmcvZm9ybWF0cGFyc2UvZGF0ZXRpbWUpXG5jb25zdCBkZWZhdWx0UnVsZXMgPSBbXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwieXl5eVwiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwieWVhclwiLCB2YWx1ZTogXCJudW1lcmljXCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwieXlcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcInllYXJcIiwgdmFsdWU6IFwiMi1kaWdpdFwiIH0pLFxuICB9LFxuXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiTU1cIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcIm1vbnRoXCIsIHZhbHVlOiBcIjItZGlnaXRcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJNXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJtb250aFwiLCB2YWx1ZTogXCJudW1lcmljXCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiZGRcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcImRheVwiLCB2YWx1ZTogXCIyLWRpZ2l0XCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiZFwiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwiZGF5XCIsIHZhbHVlOiBcIm51bWVyaWNcIiB9KSxcbiAgfSxcblxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcImhoXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJob3VyXCIsIHZhbHVlOiBcIjItZGlnaXRcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJoXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJob3VyXCIsIHZhbHVlOiBcIm51bWVyaWNcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJtbVwiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwibWludXRlXCIsIHZhbHVlOiBcIjItZGlnaXRcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJtXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJtaW51dGVcIiwgdmFsdWU6IFwibnVtZXJpY1wiIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcInNzXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJzZWNvbmRcIiwgdmFsdWU6IFwiMi1kaWdpdFwiIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcInNcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcInNlY29uZFwiLCB2YWx1ZTogXCJudW1lcmljXCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiU1NTXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJmcmFjdGlvbmFsU2Vjb25kXCIsIHZhbHVlOiAzIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcIlNTXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJmcmFjdGlvbmFsU2Vjb25kXCIsIHZhbHVlOiAyIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcIlNcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcImZyYWN0aW9uYWxTZWNvbmRcIiwgdmFsdWU6IDEgfSksXG4gIH0sXG5cbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJhXCIpLFxuICAgIGZuOiAodmFsdWU6IHVua25vd24pOiBDYWxsYmFja1Jlc3VsdCA9PiAoe1xuICAgICAgdHlwZTogXCJkYXlQZXJpb2RcIixcbiAgICAgIHZhbHVlOiB2YWx1ZSBhcyBzdHJpbmcsXG4gICAgfSksXG4gIH0sXG5cbiAgLy8gcXVvdGVkIGxpdGVyYWxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZU1hdGNoVGVzdEZ1bmN0aW9uKC9eKCcpKD88dmFsdWU+XFxcXC58W15cXCddKilcXDEvKSxcbiAgICBmbjogKG1hdGNoOiB1bmtub3duKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHtcbiAgICAgIHR5cGU6IFwibGl0ZXJhbFwiLFxuICAgICAgdmFsdWU6IChtYXRjaCBhcyBSZWdFeHBFeGVjQXJyYXkpLmdyb3VwcyEudmFsdWUgYXMgc3RyaW5nLFxuICAgIH0pLFxuICB9LFxuICAvLyBsaXRlcmFsXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVNYXRjaFRlc3RGdW5jdGlvbigvXi4rP1xccyovKSxcbiAgICBmbjogKG1hdGNoOiB1bmtub3duKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHtcbiAgICAgIHR5cGU6IFwibGl0ZXJhbFwiLFxuICAgICAgdmFsdWU6IChtYXRjaCBhcyBSZWdFeHBFeGVjQXJyYXkpWzBdLFxuICAgIH0pLFxuICB9LFxuXTtcblxudHlwZSBGb3JtYXRQYXJ0ID0geyB0eXBlOiBEYXRlVGltZUZvcm1hdFBhcnRUeXBlczsgdmFsdWU6IHN0cmluZyB8IG51bWJlciB9O1xudHlwZSBGb3JtYXQgPSBGb3JtYXRQYXJ0W107XG5cbmV4cG9ydCBjbGFzcyBEYXRlVGltZUZvcm1hdHRlciB7XG4gICNmb3JtYXQ6IEZvcm1hdDtcblxuICBjb25zdHJ1Y3Rvcihmb3JtYXRTdHJpbmc6IHN0cmluZywgcnVsZXM6IFJ1bGVbXSA9IGRlZmF1bHRSdWxlcykge1xuICAgIGNvbnN0IHRva2VuaXplciA9IG5ldyBUb2tlbml6ZXIocnVsZXMpO1xuICAgIHRoaXMuI2Zvcm1hdCA9IHRva2VuaXplci50b2tlbml6ZShmb3JtYXRTdHJpbmcsICh7IHR5cGUsIHZhbHVlIH0pID0+ICh7XG4gICAgICB0eXBlLFxuICAgICAgdmFsdWUsXG4gICAgfSkpIGFzIEZvcm1hdDtcbiAgfVxuXG4gIGZvcm1hdChkYXRlOiBEYXRlLCBvcHRpb25zOiBPcHRpb25zID0ge30pOiBzdHJpbmcge1xuICAgIGxldCBzdHJpbmcgPSBcIlwiO1xuXG4gICAgY29uc3QgdXRjID0gb3B0aW9ucy50aW1lWm9uZSA9PT0gXCJVVENcIjtcbiAgICBjb25zdCBob3VyMTIgPSB0aGlzLiNmb3JtYXQuZmluZChcbiAgICAgICh0b2tlbjogRm9ybWF0UGFydCkgPT4gdG9rZW4udHlwZSA9PT0gXCJkYXlQZXJpb2RcIixcbiAgICApO1xuXG4gICAgZm9yIChjb25zdCB0b2tlbiBvZiB0aGlzLiNmb3JtYXQpIHtcbiAgICAgIGNvbnN0IHR5cGUgPSB0b2tlbi50eXBlO1xuXG4gICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSBcInllYXJcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gdXRjID8gZGF0ZS5nZXRVVENGdWxsWWVhcigpIDogZGF0ZS5nZXRGdWxsWWVhcigpO1xuICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IHZhbHVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IGRpZ2l0cyh2YWx1ZSwgMikuc2xpY2UoLTIpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBGb3JtYXR0ZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibW9udGhcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gKHV0YyA/IGRhdGUuZ2V0VVRDTW9udGgoKSA6IGRhdGUuZ2V0TW9udGgoKSkgKyAxO1xuICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IHZhbHVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IGRpZ2l0cyh2YWx1ZSwgMik7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICAgICAgYEZvcm1hdHRlckVycm9yOiB2YWx1ZSBcIiR7dG9rZW4udmFsdWV9XCIgaXMgbm90IHN1cHBvcnRlZGAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJkYXlcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gdXRjID8gZGF0ZS5nZXRVVENEYXRlKCkgOiBkYXRlLmdldERhdGUoKTtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSB2YWx1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSBkaWdpdHModmFsdWUsIDIpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBGb3JtYXR0ZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiaG91clwiOiB7XG4gICAgICAgICAgbGV0IHZhbHVlID0gdXRjID8gZGF0ZS5nZXRVVENIb3VycygpIDogZGF0ZS5nZXRIb3VycygpO1xuICAgICAgICAgIHZhbHVlIC09IGhvdXIxMiAmJiBkYXRlLmdldEhvdXJzKCkgPiAxMiA/IDEyIDogMDtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSB2YWx1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSBkaWdpdHModmFsdWUsIDIpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBGb3JtYXR0ZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibWludXRlXCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IHV0YyA/IGRhdGUuZ2V0VVRDTWludXRlcygpIDogZGF0ZS5nZXRNaW51dGVzKCk7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gdmFsdWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIjItZGlnaXRcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gZGlnaXRzKHZhbHVlLCAyKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgRm9ybWF0dGVyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInNlY29uZFwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSB1dGMgPyBkYXRlLmdldFVUQ1NlY29uZHMoKSA6IGRhdGUuZ2V0U2Vjb25kcygpO1xuICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IHZhbHVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IGRpZ2l0cyh2YWx1ZSwgMik7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICAgICAgYEZvcm1hdHRlckVycm9yOiB2YWx1ZSBcIiR7dG9rZW4udmFsdWV9XCIgaXMgbm90IHN1cHBvcnRlZGAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJmcmFjdGlvbmFsU2Vjb25kXCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IHV0Y1xuICAgICAgICAgICAgPyBkYXRlLmdldFVUQ01pbGxpc2Vjb25kcygpXG4gICAgICAgICAgICA6IGRhdGUuZ2V0TWlsbGlzZWNvbmRzKCk7XG4gICAgICAgICAgc3RyaW5nICs9IGRpZ2l0cyh2YWx1ZSwgTnVtYmVyKHRva2VuLnZhbHVlKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInRpbWVab25lTmFtZVwiOiB7XG4gICAgICAgICAgLy8gc3RyaW5nICs9IHV0YyA/IFwiWlwiIDogdG9rZW4udmFsdWVcbiAgICAgICAgICAvLyBicmVha1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJkYXlQZXJpb2RcIjoge1xuICAgICAgICAgIHN0cmluZyArPSBob3VyMTIgPyAoZGF0ZS5nZXRIb3VycygpID49IDEyID8gXCJQTVwiIDogXCJBTVwiKSA6IFwiXCI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImxpdGVyYWxcIjoge1xuICAgICAgICAgIHN0cmluZyArPSB0b2tlbi52YWx1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgRXJyb3IoYEZvcm1hdHRlckVycm9yOiB7ICR7dG9rZW4udHlwZX0gJHt0b2tlbi52YWx1ZX0gfWApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzdHJpbmc7XG4gIH1cblxuICBwYXJzZVRvUGFydHMoc3RyaW5nOiBzdHJpbmcpOiBEYXRlVGltZUZvcm1hdFBhcnRbXSB7XG4gICAgY29uc3QgcGFydHM6IERhdGVUaW1lRm9ybWF0UGFydFtdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHRva2VuIG9mIHRoaXMuI2Zvcm1hdCkge1xuICAgICAgY29uc3QgdHlwZSA9IHRva2VuLnR5cGU7XG5cbiAgICAgIGxldCB2YWx1ZSA9IFwiXCI7XG4gICAgICBzd2l0Y2ggKHRva2VuLnR5cGUpIHtcbiAgICAgICAgY2FzZSBcInllYXJcIjoge1xuICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsxLDR9Ly5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIjItZGlnaXRcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezEsMn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJtb250aFwiOiB7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezEsMn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7Mn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwibmFycm93XCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlthLXpBLVpdKy8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCJzaG9ydFwiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15bYS16QS1aXSsvLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwibG9uZ1wiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15bYS16QS1aXSsvLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgUGFyc2VyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImRheVwiOiB7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezEsMn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7Mn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgUGFyc2VyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImhvdXJcIjoge1xuICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsxLDJ9Ly5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIjItZGlnaXRcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezJ9Ly5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICAgICAgYFBhcnNlckVycm9yOiB2YWx1ZSBcIiR7dG9rZW4udmFsdWV9XCIgaXMgbm90IHN1cHBvcnRlZGAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJtaW51dGVcIjoge1xuICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsxLDJ9Ly5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIjItZGlnaXRcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezJ9Ly5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICAgICAgYFBhcnNlckVycm9yOiB2YWx1ZSBcIiR7dG9rZW4udmFsdWV9XCIgaXMgbm90IHN1cHBvcnRlZGAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJzZWNvbmRcIjoge1xuICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsxLDJ9Ly5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIjItZGlnaXRcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezJ9Ly5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICAgICAgYFBhcnNlckVycm9yOiB2YWx1ZSBcIiR7dG9rZW4udmFsdWV9XCIgaXMgbm90IHN1cHBvcnRlZGAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJmcmFjdGlvbmFsU2Vjb25kXCI6IHtcbiAgICAgICAgICB2YWx1ZSA9IG5ldyBSZWdFeHAoYF5cXFxcZHske3Rva2VuLnZhbHVlfX1gKS5leGVjKFxuICAgICAgICAgICAgc3RyaW5nLFxuICAgICAgICAgICk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInRpbWVab25lTmFtZVwiOiB7XG4gICAgICAgICAgdmFsdWUgPSB0b2tlbi52YWx1ZSBhcyBzdHJpbmc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImRheVBlcmlvZFwiOiB7XG4gICAgICAgICAgdmFsdWUgPSAvXihBfFApTS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJsaXRlcmFsXCI6IHtcbiAgICAgICAgICBpZiAoIXN0cmluZy5zdGFydHNXaXRoKHRva2VuLnZhbHVlIGFzIHN0cmluZykpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICBgTGl0ZXJhbCBcIiR7dG9rZW4udmFsdWV9XCIgbm90IGZvdW5kIFwiJHtzdHJpbmcuc2xpY2UoMCwgMjUpfVwiYCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhbHVlID0gdG9rZW4udmFsdWUgYXMgc3RyaW5nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBFcnJvcihgJHt0b2tlbi50eXBlfSAke3Rva2VuLnZhbHVlfWApO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgIGB2YWx1ZSBub3QgdmFsaWQgZm9yIHRva2VuIHsgJHt0eXBlfSAke3ZhbHVlfSB9ICR7XG4gICAgICAgICAgICBzdHJpbmcuc2xpY2UoXG4gICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgIDI1LFxuICAgICAgICAgICAgKVxuICAgICAgICAgIH1gLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgcGFydHMucHVzaCh7IHR5cGUsIHZhbHVlIH0pO1xuICAgICAgc3RyaW5nID0gc3RyaW5nLnNsaWNlKHZhbHVlLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgaWYgKHN0cmluZy5sZW5ndGgpIHtcbiAgICAgIHRocm93IEVycm9yKFxuICAgICAgICBgZGF0ZXRpbWUgc3RyaW5nIHdhcyBub3QgZnVsbHkgcGFyc2VkISAke3N0cmluZy5zbGljZSgwLCAyNSl9YCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcnRzO1xuICB9XG5cbiAgcGFydHNUb0RhdGUocGFydHM6IERhdGVUaW1lRm9ybWF0UGFydFtdKTogRGF0ZSB7XG4gICAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgdXRjID0gcGFydHMuZmluZChcbiAgICAgIChwYXJ0KSA9PiBwYXJ0LnR5cGUgPT09IFwidGltZVpvbmVOYW1lXCIgJiYgcGFydC52YWx1ZSA9PT0gXCJVVENcIixcbiAgICApO1xuXG4gICAgdXRjID8gZGF0ZS5zZXRVVENIb3VycygwLCAwLCAwLCAwKSA6IGRhdGUuc2V0SG91cnMoMCwgMCwgMCwgMCk7XG4gICAgZm9yIChjb25zdCBwYXJ0IG9mIHBhcnRzKSB7XG4gICAgICBzd2l0Y2ggKHBhcnQudHlwZSkge1xuICAgICAgICBjYXNlIFwieWVhclwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBOdW1iZXIocGFydC52YWx1ZS5wYWRTdGFydCg0LCBcIjIwXCIpKTtcbiAgICAgICAgICB1dGMgPyBkYXRlLnNldFVUQ0Z1bGxZZWFyKHZhbHVlKSA6IGRhdGUuc2V0RnVsbFllYXIodmFsdWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJtb250aFwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBOdW1iZXIocGFydC52YWx1ZSkgLSAxO1xuICAgICAgICAgIHV0YyA/IGRhdGUuc2V0VVRDTW9udGgodmFsdWUpIDogZGF0ZS5zZXRNb250aCh2YWx1ZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImRheVwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBOdW1iZXIocGFydC52YWx1ZSk7XG4gICAgICAgICAgdXRjID8gZGF0ZS5zZXRVVENEYXRlKHZhbHVlKSA6IGRhdGUuc2V0RGF0ZSh2YWx1ZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImhvdXJcIjoge1xuICAgICAgICAgIGxldCB2YWx1ZSA9IE51bWJlcihwYXJ0LnZhbHVlKTtcbiAgICAgICAgICBjb25zdCBkYXlQZXJpb2QgPSBwYXJ0cy5maW5kKFxuICAgICAgICAgICAgKHBhcnQ6IERhdGVUaW1lRm9ybWF0UGFydCkgPT4gcGFydC50eXBlID09PSBcImRheVBlcmlvZFwiLFxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKGRheVBlcmlvZD8udmFsdWUgPT09IFwiUE1cIikgdmFsdWUgKz0gMTI7XG4gICAgICAgICAgdXRjID8gZGF0ZS5zZXRVVENIb3Vycyh2YWx1ZSkgOiBkYXRlLnNldEhvdXJzKHZhbHVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibWludXRlXCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IE51bWJlcihwYXJ0LnZhbHVlKTtcbiAgICAgICAgICB1dGMgPyBkYXRlLnNldFVUQ01pbnV0ZXModmFsdWUpIDogZGF0ZS5zZXRNaW51dGVzKHZhbHVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwic2Vjb25kXCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IE51bWJlcihwYXJ0LnZhbHVlKTtcbiAgICAgICAgICB1dGMgPyBkYXRlLnNldFVUQ1NlY29uZHModmFsdWUpIDogZGF0ZS5zZXRTZWNvbmRzKHZhbHVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZnJhY3Rpb25hbFNlY29uZFwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBOdW1iZXIocGFydC52YWx1ZSk7XG4gICAgICAgICAgdXRjID8gZGF0ZS5zZXRVVENNaWxsaXNlY29uZHModmFsdWUpIDogZGF0ZS5zZXRNaWxsaXNlY29uZHModmFsdWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkYXRlO1xuICB9XG5cbiAgcGFyc2Uoc3RyaW5nOiBzdHJpbmcpOiBEYXRlIHtcbiAgICBjb25zdCBwYXJ0cyA9IHRoaXMucGFyc2VUb1BhcnRzKHN0cmluZyk7XG4gICAgcmV0dXJuIHRoaXMucGFydHNUb0RhdGUocGFydHMpO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBS0UsU0FBUyxTQUNKLGNBQWdCO1NBRWQsTUFBTSxDQUFDLEtBQXNCLEVBQUUsS0FBSyxHQUFHLENBQUM7V0FDeEMsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSyxHQUFFLENBQUc7O1NBNkJqQyx5QkFBeUIsQ0FBQyxLQUFhO1lBQ3RDLE1BQWM7ZUFDYixNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUs7WUFDeEIsS0FBSztZQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTTtZQUM3QixTQUFTOzs7U0FJUix1QkFBdUIsQ0FBQyxLQUFhO1lBQ3BDLE1BQWM7Y0FDZCxNQUFNLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNO1lBQzVCLE1BQU07WUFBVyxLQUFLLEVBQUUsTUFBTTtZQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFLE1BQU07Ozs7QUFJaEUsRUFBdUYsQUFBdkYscUZBQXVGO01BQ2pGLFlBQVk7O1FBRWQsSUFBSSxFQUFFLHlCQUF5QixFQUFDLElBQU07UUFDdEMsRUFBRTtnQkFBMkIsSUFBSSxHQUFFLElBQU07Z0JBQUUsS0FBSyxHQUFFLE9BQVM7Ozs7UUFHM0QsSUFBSSxFQUFFLHlCQUF5QixFQUFDLEVBQUk7UUFDcEMsRUFBRTtnQkFBMkIsSUFBSSxHQUFFLElBQU07Z0JBQUUsS0FBSyxHQUFFLE9BQVM7Ozs7UUFJM0QsSUFBSSxFQUFFLHlCQUF5QixFQUFDLEVBQUk7UUFDcEMsRUFBRTtnQkFBMkIsSUFBSSxHQUFFLEtBQU87Z0JBQUUsS0FBSyxHQUFFLE9BQVM7Ozs7UUFHNUQsSUFBSSxFQUFFLHlCQUF5QixFQUFDLENBQUc7UUFDbkMsRUFBRTtnQkFBMkIsSUFBSSxHQUFFLEtBQU87Z0JBQUUsS0FBSyxHQUFFLE9BQVM7Ozs7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