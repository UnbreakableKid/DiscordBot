// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { Tokenizer } from "./tokenizer.ts";
function digits(value, count = 2) {
  return String(value).padStart(count, "0");
}
function createLiteralTestFunction(value) {
  return (string) => {
    return string.startsWith(value)
      ? {
        value,
        length: value.length,
      }
      : undefined;
  };
}
function createMatchTestFunction(match) {
  return (string) => {
    const result = match.exec(string);
    if (result) {
      return {
        value: result,
        length: result[0].length,
      };
    }
  };
}
// according to unicode symbols (http://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table)
const defaultRules = [
  {
    test: createLiteralTestFunction("yyyy"),
    fn: () => ({
      type: "year",
      value: "numeric",
    }),
  },
  {
    test: createLiteralTestFunction("yy"),
    fn: () => ({
      type: "year",
      value: "2-digit",
    }),
  },
  {
    test: createLiteralTestFunction("MM"),
    fn: () => ({
      type: "month",
      value: "2-digit",
    }),
  },
  {
    test: createLiteralTestFunction("M"),
    fn: () => ({
      type: "month",
      value: "numeric",
    }),
  },
  {
    test: createLiteralTestFunction("dd"),
    fn: () => ({
      type: "day",
      value: "2-digit",
    }),
  },
  {
    test: createLiteralTestFunction("d"),
    fn: () => ({
      type: "day",
      value: "numeric",
    }),
  },
  {
    test: createLiteralTestFunction("HH"),
    fn: () => ({
      type: "hour",
      value: "2-digit",
    }),
  },
  {
    test: createLiteralTestFunction("H"),
    fn: () => ({
      type: "hour",
      value: "numeric",
    }),
  },
  {
    test: createLiteralTestFunction("hh"),
    fn: () => ({
      type: "hour",
      value: "2-digit",
      hour12: true,
    }),
  },
  {
    test: createLiteralTestFunction("h"),
    fn: () => ({
      type: "hour",
      value: "numeric",
      hour12: true,
    }),
  },
  {
    test: createLiteralTestFunction("mm"),
    fn: () => ({
      type: "minute",
      value: "2-digit",
    }),
  },
  {
    test: createLiteralTestFunction("m"),
    fn: () => ({
      type: "minute",
      value: "numeric",
    }),
  },
  {
    test: createLiteralTestFunction("ss"),
    fn: () => ({
      type: "second",
      value: "2-digit",
    }),
  },
  {
    test: createLiteralTestFunction("s"),
    fn: () => ({
      type: "second",
      value: "numeric",
    }),
  },
  {
    test: createLiteralTestFunction("SSS"),
    fn: () => ({
      type: "fractionalSecond",
      value: 3,
    }),
  },
  {
    test: createLiteralTestFunction("SS"),
    fn: () => ({
      type: "fractionalSecond",
      value: 2,
    }),
  },
  {
    test: createLiteralTestFunction("S"),
    fn: () => ({
      type: "fractionalSecond",
      value: 1,
    }),
  },
  {
    test: createLiteralTestFunction("a"),
    fn: (value) => ({
      type: "dayPeriod",
      value: value,
    }),
  },
  // quoted literal
  {
    test: createMatchTestFunction(/^(')(?<value>\\.|[^\']*)\1/),
    fn: (match) => ({
      type: "literal",
      value: match.groups.value,
    }),
  },
  // literal
  {
    test: createMatchTestFunction(/^.+?\s*/),
    fn: (match) => ({
      type: "literal",
      value: match[0],
    }),
  },
];
export class DateTimeFormatter {
  #format;
  constructor(formatString, rules = defaultRules) {
    const tokenizer = new Tokenizer(rules);
    this.#format = tokenizer.tokenize(
      formatString,
      ({ type, value, hour12 }) => {
        const result = {
          type,
          value,
        };
        if (hour12) result.hour12 = hour12;
        return result;
      },
    );
  }
  format(date, options = {}) {
    let string = "";
    const utc = options.timeZone === "UTC";
    for (const token of this.#format) {
      const type = token.type;
      switch (type) {
        case "year": {
          const value = utc ? date.getUTCFullYear() : date.getFullYear();
          switch (token.value) {
            case "numeric": {
              string += value;
              break;
            }
            case "2-digit": {
              string += digits(value, 2).slice(-2);
              break;
            }
            default:
              throw Error(
                `FormatterError: value "${token.value}" is not supported`,
              );
          }
          break;
        }
        case "month": {
          const value = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
          switch (token.value) {
            case "numeric": {
              string += value;
              break;
            }
            case "2-digit": {
              string += digits(value, 2);
              break;
            }
            default:
              throw Error(
                `FormatterError: value "${token.value}" is not supported`,
              );
          }
          break;
        }
        case "day": {
          const value = utc ? date.getUTCDate() : date.getDate();
          switch (token.value) {
            case "numeric": {
              string += value;
              break;
            }
            case "2-digit": {
              string += digits(value, 2);
              break;
            }
            default:
              throw Error(
                `FormatterError: value "${token.value}" is not supported`,
              );
          }
          break;
        }
        case "hour": {
          let value = utc ? date.getUTCHours() : date.getHours();
          value -= token.hour12 && date.getHours() > 12 ? 12 : 0;
          switch (token.value) {
            case "numeric": {
              string += value;
              break;
            }
            case "2-digit": {
              string += digits(value, 2);
              break;
            }
            default:
              throw Error(
                `FormatterError: value "${token.value}" is not supported`,
              );
          }
          break;
        }
        case "minute": {
          const value = utc ? date.getUTCMinutes() : date.getMinutes();
          switch (token.value) {
            case "numeric": {
              string += value;
              break;
            }
            case "2-digit": {
              string += digits(value, 2);
              break;
            }
            default:
              throw Error(
                `FormatterError: value "${token.value}" is not supported`,
              );
          }
          break;
        }
        case "second": {
          const value = utc ? date.getUTCSeconds() : date.getSeconds();
          switch (token.value) {
            case "numeric": {
              string += value;
              break;
            }
            case "2-digit": {
              string += digits(value, 2);
              break;
            }
            default:
              throw Error(
                `FormatterError: value "${token.value}" is not supported`,
              );
          }
          break;
        }
        case "fractionalSecond": {
          const value = utc
            ? date.getUTCMilliseconds()
            : date.getMilliseconds();
          string += digits(value, Number(token.value));
          break;
        }
        // FIXME(bartlomieju)
        case "timeZoneName": {
          break;
        }
        case "dayPeriod": {
          string += token.value ? date.getHours() >= 12 ? "PM" : "AM" : "";
          break;
        }
        case "literal": {
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
    for (const token of this.#format) {
      const type = token.type;
      let value = "";
      switch (token.type) {
        case "year": {
          switch (token.value) {
            case "numeric": {
              value = /^\d{1,4}/.exec(string)?.[0];
              break;
            }
            case "2-digit": {
              value = /^\d{1,2}/.exec(string)?.[0];
              break;
            }
          }
          break;
        }
        case "month": {
          switch (token.value) {
            case "numeric": {
              value = /^\d{1,2}/.exec(string)?.[0];
              break;
            }
            case "2-digit": {
              value = /^\d{2}/.exec(string)?.[0];
              break;
            }
            case "narrow": {
              value = /^[a-zA-Z]+/.exec(string)?.[0];
              break;
            }
            case "short": {
              value = /^[a-zA-Z]+/.exec(string)?.[0];
              break;
            }
            case "long": {
              value = /^[a-zA-Z]+/.exec(string)?.[0];
              break;
            }
            default:
              throw Error(
                `ParserError: value "${token.value}" is not supported`,
              );
          }
          break;
        }
        case "day": {
          switch (token.value) {
            case "numeric": {
              value = /^\d{1,2}/.exec(string)?.[0];
              break;
            }
            case "2-digit": {
              value = /^\d{2}/.exec(string)?.[0];
              break;
            }
            default:
              throw Error(
                `ParserError: value "${token.value}" is not supported`,
              );
          }
          break;
        }
        case "hour": {
          switch (token.value) {
            case "numeric": {
              value = /^\d{1,2}/.exec(string)?.[0];
              if (token.hour12 && parseInt(value) > 12) {
                console.error(
                  `Trying to parse hour greater than 12. Use 'H' instead of 'h'.`,
                );
              }
              break;
            }
            case "2-digit": {
              value = /^\d{2}/.exec(string)?.[0];
              if (token.hour12 && parseInt(value) > 12) {
                console.error(
                  `Trying to parse hour greater than 12. Use 'HH' instead of 'hh'.`,
                );
              }
              break;
            }
            default:
              throw Error(
                `ParserError: value "${token.value}" is not supported`,
              );
          }
          break;
        }
        case "minute": {
          switch (token.value) {
            case "numeric": {
              value = /^\d{1,2}/.exec(string)?.[0];
              break;
            }
            case "2-digit": {
              value = /^\d{2}/.exec(string)?.[0];
              break;
            }
            default:
              throw Error(
                `ParserError: value "${token.value}" is not supported`,
              );
          }
          break;
        }
        case "second": {
          switch (token.value) {
            case "numeric": {
              value = /^\d{1,2}/.exec(string)?.[0];
              break;
            }
            case "2-digit": {
              value = /^\d{2}/.exec(string)?.[0];
              break;
            }
            default:
              throw Error(
                `ParserError: value "${token.value}" is not supported`,
              );
          }
          break;
        }
        case "fractionalSecond": {
          value = new RegExp(`^\\d{${token.value}}`).exec(string)?.[0];
          break;
        }
        case "timeZoneName": {
          value = token.value;
          break;
        }
        case "dayPeriod": {
          value = /^(A|P)M/.exec(string)?.[0];
          break;
        }
        case "literal": {
          if (!string.startsWith(token.value)) {
            throw Error(
              `Literal "${token.value}" not found "${string.slice(0, 25)}"`,
            );
          }
          value = token.value;
          break;
        }
        default:
          throw Error(`${token.type} ${token.value}`);
      }
      if (!value) {
        throw Error(
          `value not valid for token { ${type} ${value} } ${
            string.slice(0, 25)
          }`,
        );
      }
      parts.push({
        type,
        value,
      });
      string = string.slice(value.length);
    }
    if (string.length) {
      throw Error(
        `datetime string was not fully parsed! ${string.slice(0, 25)}`,
      );
    }
    return parts;
  }
  /** sort & filter dateTimeFormatPart */ sortDateTimeFormatPart(parts) {
    let result = [];
    const typeArray = [
      "year",
      "month",
      "day",
      "hour",
      "minute",
      "second",
      "fractionalSecond",
    ];
    for (const type of typeArray) {
      const current = parts.findIndex((el) => el.type === type);
      if (current !== -1) {
        result = result.concat(parts.splice(current, 1));
      }
    }
    result = result.concat(parts);
    return result;
  }
  partsToDate(parts) {
    const date = new Date();
    const utc = parts.find((part) =>
      part.type === "timeZoneName" && part.value === "UTC"
    );
    utc ? date.setUTCHours(0, 0, 0, 0) : date.setHours(0, 0, 0, 0);
    for (const part of parts) {
      switch (part.type) {
        case "year": {
          const value = Number(part.value.padStart(4, "20"));
          utc ? date.setUTCFullYear(value) : date.setFullYear(value);
          break;
        }
        case "month": {
          const value = Number(part.value) - 1;
          utc ? date.setUTCMonth(value) : date.setMonth(value);
          break;
        }
        case "day": {
          const value = Number(part.value);
          utc ? date.setUTCDate(value) : date.setDate(value);
          break;
        }
        case "hour": {
          let value = Number(part.value);
          const dayPeriod = parts.find((part) => part.type === "dayPeriod");
          if (dayPeriod?.value === "PM") value += 12;
          utc ? date.setUTCHours(value) : date.setHours(value);
          break;
        }
        case "minute": {
          const value = Number(part.value);
          utc ? date.setUTCMinutes(value) : date.setMinutes(value);
          break;
        }
        case "second": {
          const value = Number(part.value);
          utc ? date.setUTCSeconds(value) : date.setSeconds(value);
          break;
        }
        case "fractionalSecond": {
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
    const sortParts = this.sortDateTimeFormatPart(parts);
    return this.partsToDate(sortParts);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NS4wL2RhdGV0aW1lL2Zvcm1hdHRlci50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMSB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmltcG9ydCB7XG4gIENhbGxiYWNrUmVzdWx0LFxuICBSZWNlaXZlclJlc3VsdCxcbiAgUnVsZSxcbiAgVGVzdEZ1bmN0aW9uLFxuICBUZXN0UmVzdWx0LFxuICBUb2tlbml6ZXIsXG59IGZyb20gXCIuL3Rva2VuaXplci50c1wiO1xuXG5mdW5jdGlvbiBkaWdpdHModmFsdWU6IHN0cmluZyB8IG51bWJlciwgY291bnQgPSAyKTogc3RyaW5nIHtcbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSkucGFkU3RhcnQoY291bnQsIFwiMFwiKTtcbn1cblxuLy8gYXMgZGVjbGFyZWQgYXMgaW4gbmFtZXNwYWNlIEludGxcbnR5cGUgRGF0ZVRpbWVGb3JtYXRQYXJ0VHlwZXMgPVxuICB8IFwiZGF5XCJcbiAgfCBcImRheVBlcmlvZFwiXG4gIC8vIHwgXCJlcmFcIlxuICB8IFwiaG91clwiXG4gIHwgXCJsaXRlcmFsXCJcbiAgfCBcIm1pbnV0ZVwiXG4gIHwgXCJtb250aFwiXG4gIHwgXCJzZWNvbmRcIlxuICB8IFwidGltZVpvbmVOYW1lXCJcbiAgLy8gfCBcIndlZWtkYXlcIlxuICB8IFwieWVhclwiXG4gIHwgXCJmcmFjdGlvbmFsU2Vjb25kXCI7XG5cbmludGVyZmFjZSBEYXRlVGltZUZvcm1hdFBhcnQge1xuICB0eXBlOiBEYXRlVGltZUZvcm1hdFBhcnRUeXBlcztcbiAgdmFsdWU6IHN0cmluZztcbn1cblxudHlwZSBUaW1lWm9uZSA9IFwiVVRDXCI7XG5cbmludGVyZmFjZSBPcHRpb25zIHtcbiAgdGltZVpvbmU/OiBUaW1lWm9uZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbih2YWx1ZTogc3RyaW5nKTogVGVzdEZ1bmN0aW9uIHtcbiAgcmV0dXJuIChzdHJpbmc6IHN0cmluZyk6IFRlc3RSZXN1bHQgPT4ge1xuICAgIHJldHVybiBzdHJpbmcuc3RhcnRzV2l0aCh2YWx1ZSlcbiAgICAgID8geyB2YWx1ZSwgbGVuZ3RoOiB2YWx1ZS5sZW5ndGggfVxuICAgICAgOiB1bmRlZmluZWQ7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU1hdGNoVGVzdEZ1bmN0aW9uKG1hdGNoOiBSZWdFeHApOiBUZXN0RnVuY3Rpb24ge1xuICByZXR1cm4gKHN0cmluZzogc3RyaW5nKTogVGVzdFJlc3VsdCA9PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gbWF0Y2guZXhlYyhzdHJpbmcpO1xuICAgIGlmIChyZXN1bHQpIHJldHVybiB7IHZhbHVlOiByZXN1bHQsIGxlbmd0aDogcmVzdWx0WzBdLmxlbmd0aCB9O1xuICB9O1xufVxuXG4vLyBhY2NvcmRpbmcgdG8gdW5pY29kZSBzeW1ib2xzIChodHRwOi8vd3d3LnVuaWNvZGUub3JnL3JlcG9ydHMvdHIzNS90cjM1LWRhdGVzLmh0bWwjRGF0ZV9GaWVsZF9TeW1ib2xfVGFibGUpXG5jb25zdCBkZWZhdWx0UnVsZXMgPSBbXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwieXl5eVwiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwieWVhclwiLCB2YWx1ZTogXCJudW1lcmljXCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwieXlcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcInllYXJcIiwgdmFsdWU6IFwiMi1kaWdpdFwiIH0pLFxuICB9LFxuXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiTU1cIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcIm1vbnRoXCIsIHZhbHVlOiBcIjItZGlnaXRcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJNXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJtb250aFwiLCB2YWx1ZTogXCJudW1lcmljXCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiZGRcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcImRheVwiLCB2YWx1ZTogXCIyLWRpZ2l0XCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiZFwiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwiZGF5XCIsIHZhbHVlOiBcIm51bWVyaWNcIiB9KSxcbiAgfSxcblxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcIkhIXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJob3VyXCIsIHZhbHVlOiBcIjItZGlnaXRcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJIXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJob3VyXCIsIHZhbHVlOiBcIm51bWVyaWNcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJoaFwiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7XG4gICAgICB0eXBlOiBcImhvdXJcIixcbiAgICAgIHZhbHVlOiBcIjItZGlnaXRcIixcbiAgICAgIGhvdXIxMjogdHJ1ZSxcbiAgICB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJoXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHtcbiAgICAgIHR5cGU6IFwiaG91clwiLFxuICAgICAgdmFsdWU6IFwibnVtZXJpY1wiLFxuICAgICAgaG91cjEyOiB0cnVlLFxuICAgIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcIm1tXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJtaW51dGVcIiwgdmFsdWU6IFwiMi1kaWdpdFwiIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcIm1cIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcIm1pbnV0ZVwiLCB2YWx1ZTogXCJudW1lcmljXCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwic3NcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcInNlY29uZFwiLCB2YWx1ZTogXCIyLWRpZ2l0XCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwic1wiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwic2Vjb25kXCIsIHZhbHVlOiBcIm51bWVyaWNcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJTU1NcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcImZyYWN0aW9uYWxTZWNvbmRcIiwgdmFsdWU6IDMgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiU1NcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcImZyYWN0aW9uYWxTZWNvbmRcIiwgdmFsdWU6IDIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiU1wiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwiZnJhY3Rpb25hbFNlY29uZFwiLCB2YWx1ZTogMSB9KSxcbiAgfSxcblxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcImFcIiksXG4gICAgZm46ICh2YWx1ZTogdW5rbm93bik6IENhbGxiYWNrUmVzdWx0ID0+ICh7XG4gICAgICB0eXBlOiBcImRheVBlcmlvZFwiLFxuICAgICAgdmFsdWU6IHZhbHVlIGFzIHN0cmluZyxcbiAgICB9KSxcbiAgfSxcblxuICAvLyBxdW90ZWQgbGl0ZXJhbFxuICB7XG4gICAgdGVzdDogY3JlYXRlTWF0Y2hUZXN0RnVuY3Rpb24oL14oJykoPzx2YWx1ZT5cXFxcLnxbXlxcJ10qKVxcMS8pLFxuICAgIGZuOiAobWF0Y2g6IHVua25vd24pOiBDYWxsYmFja1Jlc3VsdCA9PiAoe1xuICAgICAgdHlwZTogXCJsaXRlcmFsXCIsXG4gICAgICB2YWx1ZTogKG1hdGNoIGFzIFJlZ0V4cEV4ZWNBcnJheSkuZ3JvdXBzIS52YWx1ZSBhcyBzdHJpbmcsXG4gICAgfSksXG4gIH0sXG4gIC8vIGxpdGVyYWxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZU1hdGNoVGVzdEZ1bmN0aW9uKC9eLis/XFxzKi8pLFxuICAgIGZuOiAobWF0Y2g6IHVua25vd24pOiBDYWxsYmFja1Jlc3VsdCA9PiAoe1xuICAgICAgdHlwZTogXCJsaXRlcmFsXCIsXG4gICAgICB2YWx1ZTogKG1hdGNoIGFzIFJlZ0V4cEV4ZWNBcnJheSlbMF0sXG4gICAgfSksXG4gIH0sXG5dO1xuXG50eXBlIEZvcm1hdFBhcnQgPSB7XG4gIHR5cGU6IERhdGVUaW1lRm9ybWF0UGFydFR5cGVzO1xuICB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyO1xuICBob3VyMTI/OiBib29sZWFuO1xufTtcbnR5cGUgRm9ybWF0ID0gRm9ybWF0UGFydFtdO1xuXG5leHBvcnQgY2xhc3MgRGF0ZVRpbWVGb3JtYXR0ZXIge1xuICAjZm9ybWF0OiBGb3JtYXQ7XG5cbiAgY29uc3RydWN0b3IoZm9ybWF0U3RyaW5nOiBzdHJpbmcsIHJ1bGVzOiBSdWxlW10gPSBkZWZhdWx0UnVsZXMpIHtcbiAgICBjb25zdCB0b2tlbml6ZXIgPSBuZXcgVG9rZW5pemVyKHJ1bGVzKTtcbiAgICB0aGlzLiNmb3JtYXQgPSB0b2tlbml6ZXIudG9rZW5pemUoXG4gICAgICBmb3JtYXRTdHJpbmcsXG4gICAgICAoeyB0eXBlLCB2YWx1ZSwgaG91cjEyIH0pID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgdmFsdWUsXG4gICAgICAgIH0gYXMgdW5rbm93biBhcyBSZWNlaXZlclJlc3VsdDtcbiAgICAgICAgaWYgKGhvdXIxMikgcmVzdWx0LmhvdXIxMiA9IGhvdXIxMiBhcyBib29sZWFuO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSxcbiAgICApIGFzIEZvcm1hdDtcbiAgfVxuXG4gIGZvcm1hdChkYXRlOiBEYXRlLCBvcHRpb25zOiBPcHRpb25zID0ge30pOiBzdHJpbmcge1xuICAgIGxldCBzdHJpbmcgPSBcIlwiO1xuXG4gICAgY29uc3QgdXRjID0gb3B0aW9ucy50aW1lWm9uZSA9PT0gXCJVVENcIjtcblxuICAgIGZvciAoY29uc3QgdG9rZW4gb2YgdGhpcy4jZm9ybWF0KSB7XG4gICAgICBjb25zdCB0eXBlID0gdG9rZW4udHlwZTtcblxuICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgIGNhc2UgXCJ5ZWFyXCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IHV0YyA/IGRhdGUuZ2V0VVRDRnVsbFllYXIoKSA6IGRhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSB2YWx1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSBkaWdpdHModmFsdWUsIDIpLnNsaWNlKC0yKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgRm9ybWF0dGVyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcIm1vbnRoXCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9ICh1dGMgPyBkYXRlLmdldFVUQ01vbnRoKCkgOiBkYXRlLmdldE1vbnRoKCkpICsgMTtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSB2YWx1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSBkaWdpdHModmFsdWUsIDIpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBGb3JtYXR0ZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZGF5XCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IHV0YyA/IGRhdGUuZ2V0VVRDRGF0ZSgpIDogZGF0ZS5nZXREYXRlKCk7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gdmFsdWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIjItZGlnaXRcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gZGlnaXRzKHZhbHVlLCAyKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgRm9ybWF0dGVyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImhvdXJcIjoge1xuICAgICAgICAgIGxldCB2YWx1ZSA9IHV0YyA/IGRhdGUuZ2V0VVRDSG91cnMoKSA6IGRhdGUuZ2V0SG91cnMoKTtcbiAgICAgICAgICB2YWx1ZSAtPSB0b2tlbi5ob3VyMTIgJiYgZGF0ZS5nZXRIb3VycygpID4gMTIgPyAxMiA6IDA7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gdmFsdWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIjItZGlnaXRcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gZGlnaXRzKHZhbHVlLCAyKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgRm9ybWF0dGVyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcIm1pbnV0ZVwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSB1dGMgPyBkYXRlLmdldFVUQ01pbnV0ZXMoKSA6IGRhdGUuZ2V0TWludXRlcygpO1xuICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IHZhbHVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IGRpZ2l0cyh2YWx1ZSwgMik7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICAgICAgYEZvcm1hdHRlckVycm9yOiB2YWx1ZSBcIiR7dG9rZW4udmFsdWV9XCIgaXMgbm90IHN1cHBvcnRlZGAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJzZWNvbmRcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gdXRjID8gZGF0ZS5nZXRVVENTZWNvbmRzKCkgOiBkYXRlLmdldFNlY29uZHMoKTtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSB2YWx1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSBkaWdpdHModmFsdWUsIDIpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBGb3JtYXR0ZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZnJhY3Rpb25hbFNlY29uZFwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSB1dGNcbiAgICAgICAgICAgID8gZGF0ZS5nZXRVVENNaWxsaXNlY29uZHMoKVxuICAgICAgICAgICAgOiBkYXRlLmdldE1pbGxpc2Vjb25kcygpO1xuICAgICAgICAgIHN0cmluZyArPSBkaWdpdHModmFsdWUsIE51bWJlcih0b2tlbi52YWx1ZSkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIC8vIEZJWE1FKGJhcnRsb21pZWp1KVxuICAgICAgICBjYXNlIFwidGltZVpvbmVOYW1lXCI6IHtcbiAgICAgICAgICAvLyBzdHJpbmcgKz0gdXRjID8gXCJaXCIgOiB0b2tlbi52YWx1ZVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJkYXlQZXJpb2RcIjoge1xuICAgICAgICAgIHN0cmluZyArPSB0b2tlbi52YWx1ZSA/IChkYXRlLmdldEhvdXJzKCkgPj0gMTIgPyBcIlBNXCIgOiBcIkFNXCIpIDogXCJcIjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibGl0ZXJhbFwiOiB7XG4gICAgICAgICAgc3RyaW5nICs9IHRva2VuLnZhbHVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBFcnJvcihgRm9ybWF0dGVyRXJyb3I6IHsgJHt0b2tlbi50eXBlfSAke3Rva2VuLnZhbHVlfSB9YCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZztcbiAgfVxuXG4gIHBhcnNlVG9QYXJ0cyhzdHJpbmc6IHN0cmluZyk6IERhdGVUaW1lRm9ybWF0UGFydFtdIHtcbiAgICBjb25zdCBwYXJ0czogRGF0ZVRpbWVGb3JtYXRQYXJ0W10gPSBbXTtcblxuICAgIGZvciAoY29uc3QgdG9rZW4gb2YgdGhpcy4jZm9ybWF0KSB7XG4gICAgICBjb25zdCB0eXBlID0gdG9rZW4udHlwZTtcblxuICAgICAgbGV0IHZhbHVlID0gXCJcIjtcbiAgICAgIHN3aXRjaCAodG9rZW4udHlwZSkge1xuICAgICAgICBjYXNlIFwieWVhclwiOiB7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezEsNH0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7MSwyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcIm1vbnRoXCI6IHtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7MSwyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCJuYXJyb3dcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eW2EtekEtWl0rLy5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcInNob3J0XCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlthLXpBLVpdKy8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCJsb25nXCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlthLXpBLVpdKy8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBQYXJzZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZGF5XCI6IHtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7MSwyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBQYXJzZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiaG91clwiOiB7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezEsMn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgaWYgKHRva2VuLmhvdXIxMiAmJiBwYXJzZUludCh2YWx1ZSkgPiAxMikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgICAgICBgVHJ5aW5nIHRvIHBhcnNlIGhvdXIgZ3JlYXRlciB0aGFuIDEyLiBVc2UgJ0gnIGluc3RlYWQgb2YgJ2gnLmAsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBpZiAodG9rZW4uaG91cjEyICYmIHBhcnNlSW50KHZhbHVlKSA+IDEyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgICAgICAgIGBUcnlpbmcgdG8gcGFyc2UgaG91ciBncmVhdGVyIHRoYW4gMTIuIFVzZSAnSEgnIGluc3RlYWQgb2YgJ2hoJy5gLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgUGFyc2VyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcIm1pbnV0ZVwiOiB7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezEsMn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7Mn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgUGFyc2VyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInNlY29uZFwiOiB7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezEsMn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7Mn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgUGFyc2VyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImZyYWN0aW9uYWxTZWNvbmRcIjoge1xuICAgICAgICAgIHZhbHVlID0gbmV3IFJlZ0V4cChgXlxcXFxkeyR7dG9rZW4udmFsdWV9fWApLmV4ZWMoc3RyaW5nKVxuICAgICAgICAgICAgPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJ0aW1lWm9uZU5hbWVcIjoge1xuICAgICAgICAgIHZhbHVlID0gdG9rZW4udmFsdWUgYXMgc3RyaW5nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJkYXlQZXJpb2RcIjoge1xuICAgICAgICAgIHZhbHVlID0gL14oQXxQKU0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibGl0ZXJhbFwiOiB7XG4gICAgICAgICAgaWYgKCFzdHJpbmcuc3RhcnRzV2l0aCh0b2tlbi52YWx1ZSBhcyBzdHJpbmcpKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgYExpdGVyYWwgXCIke3Rva2VuLnZhbHVlfVwiIG5vdCBmb3VuZCBcIiR7c3RyaW5nLnNsaWNlKDAsIDI1KX1cImAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YWx1ZSA9IHRva2VuLnZhbHVlIGFzIHN0cmluZztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgRXJyb3IoYCR7dG9rZW4udHlwZX0gJHt0b2tlbi52YWx1ZX1gKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICBgdmFsdWUgbm90IHZhbGlkIGZvciB0b2tlbiB7ICR7dHlwZX0gJHt2YWx1ZX0gfSAke1xuICAgICAgICAgICAgc3RyaW5nLnNsaWNlKFxuICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAyNSxcbiAgICAgICAgICAgIClcbiAgICAgICAgICB9YCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHBhcnRzLnB1c2goeyB0eXBlLCB2YWx1ZSB9KTtcblxuICAgICAgc3RyaW5nID0gc3RyaW5nLnNsaWNlKHZhbHVlLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgaWYgKHN0cmluZy5sZW5ndGgpIHtcbiAgICAgIHRocm93IEVycm9yKFxuICAgICAgICBgZGF0ZXRpbWUgc3RyaW5nIHdhcyBub3QgZnVsbHkgcGFyc2VkISAke3N0cmluZy5zbGljZSgwLCAyNSl9YCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcnRzO1xuICB9XG5cbiAgLyoqIHNvcnQgJiBmaWx0ZXIgZGF0ZVRpbWVGb3JtYXRQYXJ0ICovXG4gIHNvcnREYXRlVGltZUZvcm1hdFBhcnQocGFydHM6IERhdGVUaW1lRm9ybWF0UGFydFtdKTogRGF0ZVRpbWVGb3JtYXRQYXJ0W10ge1xuICAgIGxldCByZXN1bHQ6IERhdGVUaW1lRm9ybWF0UGFydFtdID0gW107XG4gICAgY29uc3QgdHlwZUFycmF5ID0gW1xuICAgICAgXCJ5ZWFyXCIsXG4gICAgICBcIm1vbnRoXCIsXG4gICAgICBcImRheVwiLFxuICAgICAgXCJob3VyXCIsXG4gICAgICBcIm1pbnV0ZVwiLFxuICAgICAgXCJzZWNvbmRcIixcbiAgICAgIFwiZnJhY3Rpb25hbFNlY29uZFwiLFxuICAgIF07XG4gICAgZm9yIChjb25zdCB0eXBlIG9mIHR5cGVBcnJheSkge1xuICAgICAgY29uc3QgY3VycmVudCA9IHBhcnRzLmZpbmRJbmRleCgoZWwpID0+IGVsLnR5cGUgPT09IHR5cGUpO1xuICAgICAgaWYgKGN1cnJlbnQgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQocGFydHMuc3BsaWNlKGN1cnJlbnQsIDEpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChwYXJ0cyk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnRzVG9EYXRlKHBhcnRzOiBEYXRlVGltZUZvcm1hdFBhcnRbXSk6IERhdGUge1xuICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IHV0YyA9IHBhcnRzLmZpbmQoXG4gICAgICAocGFydCkgPT4gcGFydC50eXBlID09PSBcInRpbWVab25lTmFtZVwiICYmIHBhcnQudmFsdWUgPT09IFwiVVRDXCIsXG4gICAgKTtcblxuICAgIHV0YyA/IGRhdGUuc2V0VVRDSG91cnMoMCwgMCwgMCwgMCkgOiBkYXRlLnNldEhvdXJzKDAsIDAsIDAsIDApO1xuICAgIGZvciAoY29uc3QgcGFydCBvZiBwYXJ0cykge1xuICAgICAgc3dpdGNoIChwYXJ0LnR5cGUpIHtcbiAgICAgICAgY2FzZSBcInllYXJcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gTnVtYmVyKHBhcnQudmFsdWUucGFkU3RhcnQoNCwgXCIyMFwiKSk7XG4gICAgICAgICAgdXRjID8gZGF0ZS5zZXRVVENGdWxsWWVhcih2YWx1ZSkgOiBkYXRlLnNldEZ1bGxZZWFyKHZhbHVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibW9udGhcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gTnVtYmVyKHBhcnQudmFsdWUpIC0gMTtcbiAgICAgICAgICB1dGMgPyBkYXRlLnNldFVUQ01vbnRoKHZhbHVlKSA6IGRhdGUuc2V0TW9udGgodmFsdWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJkYXlcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gTnVtYmVyKHBhcnQudmFsdWUpO1xuICAgICAgICAgIHV0YyA/IGRhdGUuc2V0VVRDRGF0ZSh2YWx1ZSkgOiBkYXRlLnNldERhdGUodmFsdWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJob3VyXCI6IHtcbiAgICAgICAgICBsZXQgdmFsdWUgPSBOdW1iZXIocGFydC52YWx1ZSk7XG4gICAgICAgICAgY29uc3QgZGF5UGVyaW9kID0gcGFydHMuZmluZChcbiAgICAgICAgICAgIChwYXJ0OiBEYXRlVGltZUZvcm1hdFBhcnQpID0+IHBhcnQudHlwZSA9PT0gXCJkYXlQZXJpb2RcIixcbiAgICAgICAgICApO1xuICAgICAgICAgIGlmIChkYXlQZXJpb2Q/LnZhbHVlID09PSBcIlBNXCIpIHZhbHVlICs9IDEyO1xuICAgICAgICAgIHV0YyA/IGRhdGUuc2V0VVRDSG91cnModmFsdWUpIDogZGF0ZS5zZXRIb3Vycyh2YWx1ZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcIm1pbnV0ZVwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBOdW1iZXIocGFydC52YWx1ZSk7XG4gICAgICAgICAgdXRjID8gZGF0ZS5zZXRVVENNaW51dGVzKHZhbHVlKSA6IGRhdGUuc2V0TWludXRlcyh2YWx1ZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInNlY29uZFwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBOdW1iZXIocGFydC52YWx1ZSk7XG4gICAgICAgICAgdXRjID8gZGF0ZS5zZXRVVENTZWNvbmRzKHZhbHVlKSA6IGRhdGUuc2V0U2Vjb25kcyh2YWx1ZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImZyYWN0aW9uYWxTZWNvbmRcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gTnVtYmVyKHBhcnQudmFsdWUpO1xuICAgICAgICAgIHV0YyA/IGRhdGUuc2V0VVRDTWlsbGlzZWNvbmRzKHZhbHVlKSA6IGRhdGUuc2V0TWlsbGlzZWNvbmRzKHZhbHVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGF0ZTtcbiAgfVxuXG4gIHBhcnNlKHN0cmluZzogc3RyaW5nKTogRGF0ZSB7XG4gICAgY29uc3QgcGFydHMgPSB0aGlzLnBhcnNlVG9QYXJ0cyhzdHJpbmcpO1xuICAgIGNvbnN0IHNvcnRQYXJ0cyA9IHRoaXMuc29ydERhdGVUaW1lRm9ybWF0UGFydChwYXJ0cyk7XG4gICAgcmV0dXJuIHRoaXMucGFydHNUb0RhdGUoc29ydFBhcnRzKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwi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
