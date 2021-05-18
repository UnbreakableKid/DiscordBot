// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
import { DateTimeFormatter } from "./formatter.ts";
export const SECOND = 1000;
export const MINUTE = SECOND * 60;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;
export const WEEK = DAY * 7;
const DAYS_PER_WEEK = 7;
var Day;
(function(Day) {
    Day[Day["Sun"] = 0] = "Sun";
    Day[Day["Mon"] = 1] = "Mon";
    Day[Day["Tue"] = 2] = "Tue";
    Day[Day["Wed"] = 3] = "Wed";
    Day[Day["Thu"] = 4] = "Thu";
    Day[Day["Fri"] = 5] = "Fri";
    Day[Day["Sat"] = 6] = "Sat";
})(Day || (Day = {
}));
/**
 * Parse date from string using format string
 * @param dateString Date string
 * @param format Format string
 * @return Parsed date
 */ export function parse(dateString, formatString) {
    const formatter = new DateTimeFormatter(formatString);
    const parts = formatter.parseToParts(dateString);
    return formatter.partsToDate(parts);
}
/**
 * Format date using format string
 * @param date Date
 * @param format Format string
 * @return formatted date string
 */ export function format(date, formatString) {
    const formatter = new DateTimeFormatter(formatString);
    return formatter.format(date);
}
/**
 * Get number of the day in the year
 * @return Number of the day in year
 */ export function dayOfYear(date) {
    // Values from 0 to 99 map to the years 1900 to 1999. All other values are the actual year. (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date)
    // Using setFullYear as a workaround
    const yearStart = new Date(date);
    yearStart.setFullYear(date.getFullYear(), 0, 0);
    const diff = date.getTime() - yearStart.getTime() + (yearStart.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
    return Math.floor(diff / DAY);
}
/**
 * Get number of the week in the year (ISO-8601)
 * @return Number of the week in year
 */ export function weekOfYear(date) {
    const workingDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = workingDate.getUTCDay();
    const nearestThursday = workingDate.getUTCDate() + Day.Thu - (day === Day.Sun ? DAYS_PER_WEEK : day);
    workingDate.setUTCDate(nearestThursday);
    // Get first day of year
    const yearStart = new Date(Date.UTC(workingDate.getUTCFullYear(), 0, 1));
    // return the calculated full weeks to nearest Thursday
    return Math.ceil((workingDate.getTime() - yearStart.getTime() + DAY) / WEEK);
}
/**
 * Parse a date to return a IMF formated string date
 * RFC: https://tools.ietf.org/html/rfc7231#section-7.1.1.1
 * IMF is the time format to use when generating times in HTTP
 * headers. The time being formatted must be in UTC for Format to
 * generate the correct format.
 * @param date Date to parse
 * @return IMF date formated string
 */ export function toIMF(date) {
    function dtPad(v, lPad = 2) {
        return v.padStart(lPad, "0");
    }
    const d = dtPad(date.getUTCDate().toString());
    const h = dtPad(date.getUTCHours().toString());
    const min = dtPad(date.getUTCMinutes().toString());
    const s = dtPad(date.getUTCSeconds().toString());
    const y = date.getUTCFullYear();
    const days = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ];
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec", 
    ];
    return `${days[date.getUTCDay()]}, ${d} ${months[date.getUTCMonth()]} ${y} ${h}:${min}:${s} GMT`;
}
/**
 * Check given year is a leap year or not.
 * based on : https://docs.microsoft.com/en-us/office/troubleshoot/excel/determine-a-leap-year
 * @param year year in number or Date format
 */ export function isLeap(year) {
    const yearNumber = year instanceof Date ? year.getFullYear() : year;
    return yearNumber % 4 === 0 && yearNumber % 100 !== 0 || yearNumber % 400 === 0;
}
/**
 * Calculate difference between two dates.
 * @param from Year to calculate difference
 * @param to Year to calculate difference with
 * @param options Options for determining how to respond
 *
 * example :
 *
 * ```typescript
 * datetime.difference(new Date("2020/1/1"),new Date("2020/2/2"),{ units : ["days","months"] })
 * ```
 */ export function difference(from, to, options) {
    const uniqueUnits = options?.units ? [
        ...new Set(options?.units)
    ] : [
        "miliseconds",
        "seconds",
        "minutes",
        "hours",
        "days",
        "weeks",
        "months",
        "quarters",
        "years", 
    ];
    const bigger = Math.max(from.getTime(), to.getTime());
    const smaller = Math.min(from.getTime(), to.getTime());
    const differenceInMs = bigger - smaller;
    const differences = {
    };
    for (const uniqueUnit of uniqueUnits){
        switch(uniqueUnit){
            case "miliseconds":
                differences.miliseconds = differenceInMs;
                break;
            case "seconds":
                differences.seconds = Math.floor(differenceInMs / SECOND);
                break;
            case "minutes":
                differences.minutes = Math.floor(differenceInMs / MINUTE);
                break;
            case "hours":
                differences.hours = Math.floor(differenceInMs / HOUR);
                break;
            case "days":
                differences.days = Math.floor(differenceInMs / DAY);
                break;
            case "weeks":
                differences.weeks = Math.floor(differenceInMs / WEEK);
                break;
            case "months":
                differences.months = calculateMonthsDifference(bigger, smaller);
                break;
            case "quarters":
                differences.quarters = Math.floor(typeof differences.months !== "undefined" && differences.months / 4 || calculateMonthsDifference(bigger, smaller) / 4);
                break;
            case "years":
                differences.years = Math.floor(typeof differences.months !== "undefined" && differences.months / 12 || calculateMonthsDifference(bigger, smaller) / 12);
                break;
        }
    }
    return differences;
}
function calculateMonthsDifference(bigger, smaller) {
    const biggerDate = new Date(bigger);
    const smallerDate = new Date(smaller);
    const yearsDiff = biggerDate.getFullYear() - smallerDate.getFullYear();
    const monthsDiff = biggerDate.getMonth() - smallerDate.getMonth();
    const calendarDiffrences = Math.abs(yearsDiff * 12 + monthsDiff);
    const compareResult = biggerDate > smallerDate ? 1 : -1;
    biggerDate.setMonth(biggerDate.getMonth() - compareResult * calendarDiffrences);
    const isLastMonthNotFull = biggerDate > smallerDate ? 1 : -1 === -compareResult ? 1 : 0;
    const months = compareResult * (calendarDiffrences - isLastMonthNotFull);
    return months === 0 ? 0 : months;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC42OS4wL2RhdGV0aW1lL21vZC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuaW1wb3J0IHsgRGF0ZVRpbWVGb3JtYXR0ZXIgfSBmcm9tIFwiLi9mb3JtYXR0ZXIudHNcIjtcblxuZXhwb3J0IGNvbnN0IFNFQ09ORCA9IDFlMztcbmV4cG9ydCBjb25zdCBNSU5VVEUgPSBTRUNPTkQgKiA2MDtcbmV4cG9ydCBjb25zdCBIT1VSID0gTUlOVVRFICogNjA7XG5leHBvcnQgY29uc3QgREFZID0gSE9VUiAqIDI0O1xuZXhwb3J0IGNvbnN0IFdFRUsgPSBEQVkgKiA3O1xuY29uc3QgREFZU19QRVJfV0VFSyA9IDc7XG5cbmVudW0gRGF5IHtcbiAgU3VuLFxuICBNb24sXG4gIFR1ZSxcbiAgV2VkLFxuICBUaHUsXG4gIEZyaSxcbiAgU2F0LFxufVxuXG4vKipcbiAqIFBhcnNlIGRhdGUgZnJvbSBzdHJpbmcgdXNpbmcgZm9ybWF0IHN0cmluZ1xuICogQHBhcmFtIGRhdGVTdHJpbmcgRGF0ZSBzdHJpbmdcbiAqIEBwYXJhbSBmb3JtYXQgRm9ybWF0IHN0cmluZ1xuICogQHJldHVybiBQYXJzZWQgZGF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2UoZGF0ZVN0cmluZzogc3RyaW5nLCBmb3JtYXRTdHJpbmc6IHN0cmluZyk6IERhdGUge1xuICBjb25zdCBmb3JtYXR0ZXIgPSBuZXcgRGF0ZVRpbWVGb3JtYXR0ZXIoZm9ybWF0U3RyaW5nKTtcbiAgY29uc3QgcGFydHMgPSBmb3JtYXR0ZXIucGFyc2VUb1BhcnRzKGRhdGVTdHJpbmcpO1xuICByZXR1cm4gZm9ybWF0dGVyLnBhcnRzVG9EYXRlKHBhcnRzKTtcbn1cblxuLyoqXG4gKiBGb3JtYXQgZGF0ZSB1c2luZyBmb3JtYXQgc3RyaW5nXG4gKiBAcGFyYW0gZGF0ZSBEYXRlXG4gKiBAcGFyYW0gZm9ybWF0IEZvcm1hdCBzdHJpbmdcbiAqIEByZXR1cm4gZm9ybWF0dGVkIGRhdGUgc3RyaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXQoZGF0ZTogRGF0ZSwgZm9ybWF0U3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBmb3JtYXR0ZXIgPSBuZXcgRGF0ZVRpbWVGb3JtYXR0ZXIoZm9ybWF0U3RyaW5nKTtcbiAgcmV0dXJuIGZvcm1hdHRlci5mb3JtYXQoZGF0ZSk7XG59XG5cbi8qKlxuICogR2V0IG51bWJlciBvZiB0aGUgZGF5IGluIHRoZSB5ZWFyXG4gKiBAcmV0dXJuIE51bWJlciBvZiB0aGUgZGF5IGluIHllYXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRheU9mWWVhcihkYXRlOiBEYXRlKTogbnVtYmVyIHtcbiAgLy8gVmFsdWVzIGZyb20gMCB0byA5OSBtYXAgdG8gdGhlIHllYXJzIDE5MDAgdG8gMTk5OS4gQWxsIG90aGVyIHZhbHVlcyBhcmUgdGhlIGFjdHVhbCB5ZWFyLiAoaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvRGF0ZS9EYXRlKVxuICAvLyBVc2luZyBzZXRGdWxsWWVhciBhcyBhIHdvcmthcm91bmRcbiAgY29uc3QgeWVhclN0YXJ0ID0gbmV3IERhdGUoZGF0ZSk7XG4gIHllYXJTdGFydC5zZXRGdWxsWWVhcihkYXRlLmdldEZ1bGxZZWFyKCksIDAsIDApO1xuXG4gIGNvbnN0IGRpZmYgPSBkYXRlLmdldFRpbWUoKSAtXG4gICAgeWVhclN0YXJ0LmdldFRpbWUoKSArXG4gICAgKHllYXJTdGFydC5nZXRUaW1lem9uZU9mZnNldCgpIC0gZGF0ZS5nZXRUaW1lem9uZU9mZnNldCgpKSAqIDYwICogMTAwMDtcbiAgcmV0dXJuIE1hdGguZmxvb3IoZGlmZiAvIERBWSk7XG59XG5cbi8qKlxuICogR2V0IG51bWJlciBvZiB0aGUgd2VlayBpbiB0aGUgeWVhciAoSVNPLTg2MDEpXG4gKiBAcmV0dXJuIE51bWJlciBvZiB0aGUgd2VlayBpbiB5ZWFyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3ZWVrT2ZZZWFyKGRhdGU6IERhdGUpOiBudW1iZXIge1xuICBjb25zdCB3b3JraW5nRGF0ZSA9IG5ldyBEYXRlKFxuICAgIERhdGUuVVRDKGRhdGUuZ2V0RnVsbFllYXIoKSwgZGF0ZS5nZXRNb250aCgpLCBkYXRlLmdldERhdGUoKSksXG4gICk7XG5cbiAgY29uc3QgZGF5ID0gd29ya2luZ0RhdGUuZ2V0VVRDRGF5KCk7XG5cbiAgY29uc3QgbmVhcmVzdFRodXJzZGF5ID0gd29ya2luZ0RhdGUuZ2V0VVRDRGF0ZSgpICtcbiAgICBEYXkuVGh1IC1cbiAgICAoZGF5ID09PSBEYXkuU3VuID8gREFZU19QRVJfV0VFSyA6IGRheSk7XG5cbiAgd29ya2luZ0RhdGUuc2V0VVRDRGF0ZShuZWFyZXN0VGh1cnNkYXkpO1xuXG4gIC8vIEdldCBmaXJzdCBkYXkgb2YgeWVhclxuICBjb25zdCB5ZWFyU3RhcnQgPSBuZXcgRGF0ZShEYXRlLlVUQyh3b3JraW5nRGF0ZS5nZXRVVENGdWxsWWVhcigpLCAwLCAxKSk7XG5cbiAgLy8gcmV0dXJuIHRoZSBjYWxjdWxhdGVkIGZ1bGwgd2Vla3MgdG8gbmVhcmVzdCBUaHVyc2RheVxuICByZXR1cm4gTWF0aC5jZWlsKCh3b3JraW5nRGF0ZS5nZXRUaW1lKCkgLSB5ZWFyU3RhcnQuZ2V0VGltZSgpICsgREFZKSAvIFdFRUspO1xufVxuXG4vKipcbiAqIFBhcnNlIGEgZGF0ZSB0byByZXR1cm4gYSBJTUYgZm9ybWF0ZWQgc3RyaW5nIGRhdGVcbiAqIFJGQzogaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzcyMzEjc2VjdGlvbi03LjEuMS4xXG4gKiBJTUYgaXMgdGhlIHRpbWUgZm9ybWF0IHRvIHVzZSB3aGVuIGdlbmVyYXRpbmcgdGltZXMgaW4gSFRUUFxuICogaGVhZGVycy4gVGhlIHRpbWUgYmVpbmcgZm9ybWF0dGVkIG11c3QgYmUgaW4gVVRDIGZvciBGb3JtYXQgdG9cbiAqIGdlbmVyYXRlIHRoZSBjb3JyZWN0IGZvcm1hdC5cbiAqIEBwYXJhbSBkYXRlIERhdGUgdG8gcGFyc2VcbiAqIEByZXR1cm4gSU1GIGRhdGUgZm9ybWF0ZWQgc3RyaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0lNRihkYXRlOiBEYXRlKTogc3RyaW5nIHtcbiAgZnVuY3Rpb24gZHRQYWQodjogc3RyaW5nLCBsUGFkID0gMik6IHN0cmluZyB7XG4gICAgcmV0dXJuIHYucGFkU3RhcnQobFBhZCwgXCIwXCIpO1xuICB9XG4gIGNvbnN0IGQgPSBkdFBhZChkYXRlLmdldFVUQ0RhdGUoKS50b1N0cmluZygpKTtcbiAgY29uc3QgaCA9IGR0UGFkKGRhdGUuZ2V0VVRDSG91cnMoKS50b1N0cmluZygpKTtcbiAgY29uc3QgbWluID0gZHRQYWQoZGF0ZS5nZXRVVENNaW51dGVzKCkudG9TdHJpbmcoKSk7XG4gIGNvbnN0IHMgPSBkdFBhZChkYXRlLmdldFVUQ1NlY29uZHMoKS50b1N0cmluZygpKTtcbiAgY29uc3QgeSA9IGRhdGUuZ2V0VVRDRnVsbFllYXIoKTtcbiAgY29uc3QgZGF5cyA9IFtcIlN1blwiLCBcIk1vblwiLCBcIlR1ZVwiLCBcIldlZFwiLCBcIlRodVwiLCBcIkZyaVwiLCBcIlNhdFwiXTtcbiAgY29uc3QgbW9udGhzID0gW1xuICAgIFwiSmFuXCIsXG4gICAgXCJGZWJcIixcbiAgICBcIk1hclwiLFxuICAgIFwiQXByXCIsXG4gICAgXCJNYXlcIixcbiAgICBcIkp1blwiLFxuICAgIFwiSnVsXCIsXG4gICAgXCJBdWdcIixcbiAgICBcIlNlcFwiLFxuICAgIFwiT2N0XCIsXG4gICAgXCJOb3ZcIixcbiAgICBcIkRlY1wiLFxuICBdO1xuICByZXR1cm4gYCR7ZGF5c1tkYXRlLmdldFVUQ0RheSgpXX0sICR7ZH0gJHtcbiAgICBtb250aHNbZGF0ZS5nZXRVVENNb250aCgpXVxuICB9ICR7eX0gJHtofToke21pbn06JHtzfSBHTVRgO1xufVxuXG4vKipcbiAqIENoZWNrIGdpdmVuIHllYXIgaXMgYSBsZWFwIHllYXIgb3Igbm90LlxuICogYmFzZWQgb24gOiBodHRwczovL2RvY3MubWljcm9zb2Z0LmNvbS9lbi11cy9vZmZpY2UvdHJvdWJsZXNob290L2V4Y2VsL2RldGVybWluZS1hLWxlYXAteWVhclxuICogQHBhcmFtIHllYXIgeWVhciBpbiBudW1iZXIgb3IgRGF0ZSBmb3JtYXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTGVhcCh5ZWFyOiBEYXRlIHwgbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IHllYXJOdW1iZXIgPSB5ZWFyIGluc3RhbmNlb2YgRGF0ZSA/IHllYXIuZ2V0RnVsbFllYXIoKSA6IHllYXI7XG4gIHJldHVybiAoXG4gICAgKHllYXJOdW1iZXIgJSA0ID09PSAwICYmIHllYXJOdW1iZXIgJSAxMDAgIT09IDApIHx8IHllYXJOdW1iZXIgJSA0MDAgPT09IDBcbiAgKTtcbn1cblxuZXhwb3J0IHR5cGUgVW5pdCA9XG4gIHwgXCJtaWxpc2Vjb25kc1wiXG4gIHwgXCJzZWNvbmRzXCJcbiAgfCBcIm1pbnV0ZXNcIlxuICB8IFwiaG91cnNcIlxuICB8IFwiZGF5c1wiXG4gIHwgXCJ3ZWVrc1wiXG4gIHwgXCJtb250aHNcIlxuICB8IFwicXVhcnRlcnNcIlxuICB8IFwieWVhcnNcIjtcblxuZXhwb3J0IHR5cGUgRGlmZmVyZW5jZUZvcm1hdCA9IFBhcnRpYWw8UmVjb3JkPFVuaXQsIG51bWJlcj4+O1xuXG5leHBvcnQgdHlwZSBEaWZmZXJlbmNlT3B0aW9ucyA9IHtcbiAgdW5pdHM/OiBVbml0W107XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZSBkaWZmZXJlbmNlIGJldHdlZW4gdHdvIGRhdGVzLlxuICogQHBhcmFtIGZyb20gWWVhciB0byBjYWxjdWxhdGUgZGlmZmVyZW5jZVxuICogQHBhcmFtIHRvIFllYXIgdG8gY2FsY3VsYXRlIGRpZmZlcmVuY2Ugd2l0aFxuICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyBmb3IgZGV0ZXJtaW5pbmcgaG93IHRvIHJlc3BvbmRcbiAqXG4gKiBleGFtcGxlIDpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBkYXRldGltZS5kaWZmZXJlbmNlKG5ldyBEYXRlKFwiMjAyMC8xLzFcIiksbmV3IERhdGUoXCIyMDIwLzIvMlwiKSx7IHVuaXRzIDogW1wiZGF5c1wiLFwibW9udGhzXCJdIH0pXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpZmZlcmVuY2UoXG4gIGZyb206IERhdGUsXG4gIHRvOiBEYXRlLFxuICBvcHRpb25zPzogRGlmZmVyZW5jZU9wdGlvbnMsXG4pOiBEaWZmZXJlbmNlRm9ybWF0IHtcbiAgY29uc3QgdW5pcXVlVW5pdHMgPSBvcHRpb25zPy51bml0cyA/IFsuLi5uZXcgU2V0KG9wdGlvbnM/LnVuaXRzKV0gOiBbXG4gICAgXCJtaWxpc2Vjb25kc1wiLFxuICAgIFwic2Vjb25kc1wiLFxuICAgIFwibWludXRlc1wiLFxuICAgIFwiaG91cnNcIixcbiAgICBcImRheXNcIixcbiAgICBcIndlZWtzXCIsXG4gICAgXCJtb250aHNcIixcbiAgICBcInF1YXJ0ZXJzXCIsXG4gICAgXCJ5ZWFyc1wiLFxuICBdO1xuXG4gIGNvbnN0IGJpZ2dlciA9IE1hdGgubWF4KGZyb20uZ2V0VGltZSgpLCB0by5nZXRUaW1lKCkpO1xuICBjb25zdCBzbWFsbGVyID0gTWF0aC5taW4oZnJvbS5nZXRUaW1lKCksIHRvLmdldFRpbWUoKSk7XG4gIGNvbnN0IGRpZmZlcmVuY2VJbk1zID0gYmlnZ2VyIC0gc21hbGxlcjtcblxuICBjb25zdCBkaWZmZXJlbmNlczogRGlmZmVyZW5jZUZvcm1hdCA9IHt9O1xuXG4gIGZvciAoY29uc3QgdW5pcXVlVW5pdCBvZiB1bmlxdWVVbml0cykge1xuICAgIHN3aXRjaCAodW5pcXVlVW5pdCkge1xuICAgICAgY2FzZSBcIm1pbGlzZWNvbmRzXCI6XG4gICAgICAgIGRpZmZlcmVuY2VzLm1pbGlzZWNvbmRzID0gZGlmZmVyZW5jZUluTXM7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcInNlY29uZHNcIjpcbiAgICAgICAgZGlmZmVyZW5jZXMuc2Vjb25kcyA9IE1hdGguZmxvb3IoZGlmZmVyZW5jZUluTXMgLyBTRUNPTkQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJtaW51dGVzXCI6XG4gICAgICAgIGRpZmZlcmVuY2VzLm1pbnV0ZXMgPSBNYXRoLmZsb29yKGRpZmZlcmVuY2VJbk1zIC8gTUlOVVRFKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiaG91cnNcIjpcbiAgICAgICAgZGlmZmVyZW5jZXMuaG91cnMgPSBNYXRoLmZsb29yKGRpZmZlcmVuY2VJbk1zIC8gSE9VUik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImRheXNcIjpcbiAgICAgICAgZGlmZmVyZW5jZXMuZGF5cyA9IE1hdGguZmxvb3IoZGlmZmVyZW5jZUluTXMgLyBEQVkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJ3ZWVrc1wiOlxuICAgICAgICBkaWZmZXJlbmNlcy53ZWVrcyA9IE1hdGguZmxvb3IoZGlmZmVyZW5jZUluTXMgLyBXRUVLKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwibW9udGhzXCI6XG4gICAgICAgIGRpZmZlcmVuY2VzLm1vbnRocyA9IGNhbGN1bGF0ZU1vbnRoc0RpZmZlcmVuY2UoYmlnZ2VyLCBzbWFsbGVyKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwicXVhcnRlcnNcIjpcbiAgICAgICAgZGlmZmVyZW5jZXMucXVhcnRlcnMgPSBNYXRoLmZsb29yKFxuICAgICAgICAgICh0eXBlb2YgZGlmZmVyZW5jZXMubW9udGhzICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgICAgICBkaWZmZXJlbmNlcy5tb250aHMgLyA0KSB8fFxuICAgICAgICAgICAgY2FsY3VsYXRlTW9udGhzRGlmZmVyZW5jZShiaWdnZXIsIHNtYWxsZXIpIC8gNCxcbiAgICAgICAgKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwieWVhcnNcIjpcbiAgICAgICAgZGlmZmVyZW5jZXMueWVhcnMgPSBNYXRoLmZsb29yKFxuICAgICAgICAgICh0eXBlb2YgZGlmZmVyZW5jZXMubW9udGhzICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgICAgICBkaWZmZXJlbmNlcy5tb250aHMgLyAxMikgfHxcbiAgICAgICAgICAgIGNhbGN1bGF0ZU1vbnRoc0RpZmZlcmVuY2UoYmlnZ2VyLCBzbWFsbGVyKSAvIDEyLFxuICAgICAgICApO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZGlmZmVyZW5jZXM7XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZU1vbnRoc0RpZmZlcmVuY2UoYmlnZ2VyOiBudW1iZXIsIHNtYWxsZXI6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IGJpZ2dlckRhdGUgPSBuZXcgRGF0ZShiaWdnZXIpO1xuICBjb25zdCBzbWFsbGVyRGF0ZSA9IG5ldyBEYXRlKHNtYWxsZXIpO1xuICBjb25zdCB5ZWFyc0RpZmYgPSBiaWdnZXJEYXRlLmdldEZ1bGxZZWFyKCkgLSBzbWFsbGVyRGF0ZS5nZXRGdWxsWWVhcigpO1xuICBjb25zdCBtb250aHNEaWZmID0gYmlnZ2VyRGF0ZS5nZXRNb250aCgpIC0gc21hbGxlckRhdGUuZ2V0TW9udGgoKTtcbiAgY29uc3QgY2FsZW5kYXJEaWZmcmVuY2VzID0gTWF0aC5hYnMoeWVhcnNEaWZmICogMTIgKyBtb250aHNEaWZmKTtcbiAgY29uc3QgY29tcGFyZVJlc3VsdCA9IGJpZ2dlckRhdGUgPiBzbWFsbGVyRGF0ZSA/IDEgOiAtMTtcbiAgYmlnZ2VyRGF0ZS5zZXRNb250aChcbiAgICBiaWdnZXJEYXRlLmdldE1vbnRoKCkgLSBjb21wYXJlUmVzdWx0ICogY2FsZW5kYXJEaWZmcmVuY2VzLFxuICApO1xuICBjb25zdCBpc0xhc3RNb250aE5vdEZ1bGwgPSBiaWdnZXJEYXRlID4gc21hbGxlckRhdGVcbiAgICA/IDFcbiAgICA6IC0xID09PSAtY29tcGFyZVJlc3VsdFxuICAgID8gMVxuICAgIDogMDtcbiAgY29uc3QgbW9udGhzID0gY29tcGFyZVJlc3VsdCAqIChjYWxlbmRhckRpZmZyZW5jZXMgLSBpc0xhc3RNb250aE5vdEZ1bGwpO1xuICByZXR1cm4gbW9udGhzID09PSAwID8gMCA6IG1vbnRocztcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUEwRSxBQUExRSx3RUFBMEU7U0FFakUsaUJBQWlCLFNBQVEsY0FBZ0I7YUFFckMsTUFBTSxHQUFHLElBQUc7YUFDWixNQUFNLEdBQUcsTUFBTSxHQUFHLEVBQUU7YUFDcEIsSUFBSSxHQUFHLE1BQU0sR0FBRyxFQUFFO2FBQ2xCLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBRTthQUNmLElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQztNQUNyQixhQUFhLEdBQUcsQ0FBQzs7VUFFbEIsR0FBRztJQUFILEdBQUcsQ0FBSCxHQUFHLEVBQ04sR0FBRyxLQUFILENBQUcsS0FBSCxHQUFHO0lBREEsR0FBRyxDQUFILEdBQUcsRUFFTixHQUFHLEtBQUgsQ0FBRyxLQUFILEdBQUc7SUFGQSxHQUFHLENBQUgsR0FBRyxFQUdOLEdBQUcsS0FBSCxDQUFHLEtBQUgsR0FBRztJQUhBLEdBQUcsQ0FBSCxHQUFHLEVBSU4sR0FBRyxLQUFILENBQUcsS0FBSCxHQUFHO0lBSkEsR0FBRyxDQUFILEdBQUcsRUFLTixHQUFHLEtBQUgsQ0FBRyxLQUFILEdBQUc7SUFMQSxHQUFHLENBQUgsR0FBRyxFQU1OLEdBQUcsS0FBSCxDQUFHLEtBQUgsR0FBRztJQU5BLEdBQUcsQ0FBSCxHQUFHLEVBT04sR0FBRyxLQUFILENBQUcsS0FBSCxHQUFHO0dBUEEsR0FBRyxLQUFILEdBQUc7O0FBVVIsRUFLRyxBQUxIOzs7OztDQUtHLEFBTEgsRUFLRyxpQkFDYSxLQUFLLENBQUMsVUFBa0IsRUFBRSxZQUFvQjtVQUN0RCxTQUFTLE9BQU8saUJB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