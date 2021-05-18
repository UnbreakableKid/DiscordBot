// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
/**
 * Converts given data with base64 encoding
 * @param data input to encode
 */ export function encode(data) {
    if (typeof data === "string") {
        return btoa(data);
    } else {
        const d = new Uint8Array(data);
        let dataString = "";
        for(let i = 0; i < d.length; ++i){
            dataString += String.fromCharCode(d[i]);
        }
        return btoa(dataString);
    }
}
/**
 * Converts given base64 encoded data back to original
 * @param data input to decode
 */ export function decode(data) {
    const binaryString = decodeString(data);
    const binary = new Uint8Array(binaryString.length);
    for(let i = 0; i < binary.length; ++i){
        binary[i] = binaryString.charCodeAt(i);
    }
    return binary.buffer;
}
/**
 * Decodes data assuming the output is in string type
 * @param data input to decode
 */ export function decodeString(data) {
    return atob(data);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC42Ni4wL2VuY29kaW5nL2Jhc2U2NC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuLyoqXG4gKiBDb252ZXJ0cyBnaXZlbiBkYXRhIHdpdGggYmFzZTY0IGVuY29kaW5nXG4gKiBAcGFyYW0gZGF0YSBpbnB1dCB0byBlbmNvZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZShkYXRhOiBzdHJpbmcgfCBBcnJheUJ1ZmZlcik6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiBidG9hKGRhdGEpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGQgPSBuZXcgVWludDhBcnJheShkYXRhKTtcbiAgICBsZXQgZGF0YVN0cmluZyA9IFwiXCI7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkLmxlbmd0aDsgKytpKSB7XG4gICAgICBkYXRhU3RyaW5nICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoZFtpXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGJ0b2EoZGF0YVN0cmluZyk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBnaXZlbiBiYXNlNjQgZW5jb2RlZCBkYXRhIGJhY2sgdG8gb3JpZ2luYWxcbiAqIEBwYXJhbSBkYXRhIGlucHV0IHRvIGRlY29kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlKGRhdGE6IHN0cmluZyk6IEFycmF5QnVmZmVyIHtcbiAgY29uc3QgYmluYXJ5U3RyaW5nID0gZGVjb2RlU3RyaW5nKGRhdGEpO1xuICBjb25zdCBiaW5hcnkgPSBuZXcgVWludDhBcnJheShiaW5hcnlTdHJpbmcubGVuZ3RoKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBiaW5hcnkubGVuZ3RoOyArK2kpIHtcbiAgICBiaW5hcnlbaV0gPSBiaW5hcnlTdHJpbmcuY2hhckNvZGVBdChpKTtcbiAgfVxuXG4gIHJldHVybiBiaW5hcnkuYnVmZmVyO1xufVxuXG4vKipcbiAqIERlY29kZXMgZGF0YSBhc3N1bWluZyB0aGUgb3V0cHV0IGlzIGluIHN0cmluZyB0eXBlXG4gKiBAcGFyYW0gZGF0YSBpbnB1dCB0byBkZWNvZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZVN0cmluZyhkYXRhOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYXRvYihkYXRhKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUEwRSxBQUExRSx3RUFBMEU7QUFFMUUsRUFHRyxBQUhIOzs7Q0FHRyxBQUhILEVBR0csaUJBQ2EsTUFBTSxDQUFDLElBQTBCO2VBQ3BDLElBQUksTUFBSyxNQUFRO2VBQ25CLElBQUksQ0FBQyxJQUFJOztjQUVWLENBQUMsT0FBTyxVQUFVLENBQUMsSUFBSTtZQUN6QixVQUFVO2dCQUNMLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQztZQUMvQixVQUFVLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQzs7ZUFHaEMsSUFBSSxDQUFDLFVBQVU7OztBQUkxQixFQUdHLEFBSEg7OztDQUdHLEFBSEgsRUFHRyxpQkFDYSxNQUFNLENBQUMsSUFBWTtVQUMzQixZQUFZLEdBQUcsWUFBWSxDQUFDLElBQUk7VUFDaEMsTUFBTSxPQUFPLFVBQVUsQ0FBQyxZQUFZLENBQUMsTUFBTTtZQUN4QyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUM7UUFDcEMsTUFBTSxDQUFDLENBQUMsSUFBSSxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7O1dBR2hDLE1BQU0sQ0FBQyxNQUFNOztBQUd0QixFQUdHLEFBSEg7OztDQUdHLEFBSEgsRUFHRyxpQkFDYSxZQUFZLENBQUMsSUFBWTtXQUNoQyxJQUFJLENBQUMsSUFBSSJ9