// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
export const osType = (()=>{
    if (globalThis.Deno != null) {
        return Deno.build.os;
    }
    // deno-lint-ignore no-explicit-any
    const navigator = globalThis.navigator;
    if (navigator?.appVersion?.includes?.("Win") ?? false) {
        return "windows";
    }
    return "linux";
})();
export const isWindows = osType === "windows";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NS4wL191dGlsL29zLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5leHBvcnQgY29uc3Qgb3NUeXBlID0gKCgpID0+IHtcbiAgaWYgKGdsb2JhbFRoaXMuRGVubyAhPSBudWxsKSB7XG4gICAgcmV0dXJuIERlbm8uYnVpbGQub3M7XG4gIH1cblxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBjb25zdCBuYXZpZ2F0b3IgPSAoZ2xvYmFsVGhpcyBhcyBhbnkpLm5hdmlnYXRvcjtcbiAgaWYgKG5hdmlnYXRvcj8uYXBwVmVyc2lvbj8uaW5jbHVkZXM/LihcIldpblwiKSA/PyBmYWxzZSkge1xuICAgIHJldHVybiBcIndpbmRvd3NcIjtcbiAgfVxuXG4gIHJldHVybiBcImxpbnV4XCI7XG59KSgpO1xuXG5leHBvcnQgY29uc3QgaXNXaW5kb3dzID0gb3NUeXBlID09PSBcIndpbmRvd3NcIjtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUEwRSxBQUExRSx3RUFBMEU7QUFDMUUsRUFBcUMsQUFBckMsbUNBQXFDO2FBRXhCLE1BQU07UUFDYixVQUFVLENBQUMsSUFBSSxJQUFJLElBQUk7ZUFDbEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFOztJQUd0QixFQUFtQyxBQUFuQyxpQ0FBbUM7VUFDN0IsU0FBUyxHQUFJLFVBQVUsQ0FBUyxTQUFTO1FBQzNDLFNBQVMsRUFBRSxVQUFVLEVBQUUsUUFBUSxJQUFHLEdBQUssTUFBSyxLQUFLO2dCQUM1QyxPQUFTOztZQUdYLEtBQU87O2FBR0gsU0FBUyxHQUFHLE1BQU0sTUFBSyxPQUFTIn0=