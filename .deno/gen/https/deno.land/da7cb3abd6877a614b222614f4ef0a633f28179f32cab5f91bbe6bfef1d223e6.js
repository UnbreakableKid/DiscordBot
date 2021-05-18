import { lookup } from "../../deps.ts";
/**
 * Parse accept params `str` returning an
 * object with `.value`, `.quality` and `.params`.
 *
 * @param {string} str
 * @return {any}
 * @private
 */ function acceptParams(str) {
  const parts = str.split(/ *; */);
  const ret = {
    value: parts[0],
    quality: 1,
    params: {},
  };
  for (let i = 1; i < parts.length; ++i) {
    const pms = parts[i].split(/ *= */);
    if ("q" === pms[0]) {
      ret.quality = parseFloat(pms[1]);
    } else {
      ret.params[pms[0]] = pms[1];
    }
  }
  return ret;
}
/**
 * Normalize the given `type`, for example "html" becomes "text/html".
 *
 * @param {string} type
 * @return {any}
 * @private
 */ export const normalizeType = function (type) {
  return ~type.indexOf("/") ? acceptParams(type) : {
    value: lookup(type),
    params: {},
  };
};
/**
 * Normalize `types`, for example "html" becomes "text/html".
 *
 * @param {string[]} types
 * @return {any[]}
 * @private
 */ export const normalizeTypes = function (types) {
  const ret = [];
  for (let i = 0; i < types.length; ++i) {
    ret.push(normalizeType(types[i]));
  }
  return ret;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy91dGlscy9ub3JtYWxpemVUeXBlLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBsb29rdXAgfSBmcm9tIFwiLi4vLi4vZGVwcy50c1wiO1xuXG4vKipcbiAqIFBhcnNlIGFjY2VwdCBwYXJhbXMgYHN0cmAgcmV0dXJuaW5nIGFuXG4gKiBvYmplY3Qgd2l0aCBgLnZhbHVlYCwgYC5xdWFsaXR5YCBhbmQgYC5wYXJhbXNgLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge2FueX1cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGFjY2VwdFBhcmFtcyhzdHI6IHN0cmluZykge1xuICBjb25zdCBwYXJ0cyA9IHN0ci5zcGxpdCgvICo7ICovKTtcbiAgY29uc3QgcmV0ID0geyB2YWx1ZTogcGFydHNbMF0sIHF1YWxpdHk6IDEsIHBhcmFtczoge30gYXMgYW55IH07XG5cbiAgZm9yIChsZXQgaSA9IDE7IGkgPCBwYXJ0cy5sZW5ndGg7ICsraSkge1xuICAgIGNvbnN0IHBtcyA9IHBhcnRzW2ldLnNwbGl0KC8gKj0gKi8pO1xuXG4gICAgaWYgKFwicVwiID09PSBwbXNbMF0pIHtcbiAgICAgIHJldC5xdWFsaXR5ID0gcGFyc2VGbG9hdChwbXNbMV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXQucGFyYW1zW3Btc1swXV0gPSBwbXNbMV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJldDtcbn1cblxuLyoqXG4gKiBOb3JtYWxpemUgdGhlIGdpdmVuIGB0eXBlYCwgZm9yIGV4YW1wbGUgXCJodG1sXCIgYmVjb21lcyBcInRleHQvaHRtbFwiLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gKiBAcmV0dXJuIHthbnl9XG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgY29uc3Qgbm9ybWFsaXplVHlwZSA9IGZ1bmN0aW9uICh0eXBlOiBzdHJpbmcpOiBhbnkge1xuICByZXR1cm4gfnR5cGUuaW5kZXhPZihcIi9cIilcbiAgICA/IGFjY2VwdFBhcmFtcyh0eXBlKVxuICAgIDogeyB2YWx1ZTogbG9va3VwKHR5cGUpLCBwYXJhbXM6IHt9IH07XG59O1xuXG4vKipcbiAqIE5vcm1hbGl6ZSBgdHlwZXNgLCBmb3IgZXhhbXBsZSBcImh0bWxcIiBiZWNvbWVzIFwidGV4dC9odG1sXCIuXG4gKlxuICogQHBhcmFtIHtzdHJpbmdbXX0gdHlwZXNcbiAqIEByZXR1cm4ge2FueVtdfVxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0IGNvbnN0IG5vcm1hbGl6ZVR5cGVzID0gZnVuY3Rpb24gKHR5cGVzOiBzdHJpbmdbXSk6IGFueVtdIHtcbiAgY29uc3QgcmV0ID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0eXBlcy5sZW5ndGg7ICsraSkge1xuICAgIHJldC5wdXNoKG5vcm1hbGl6ZVR5cGUodHlwZXNbaV0pKTtcbiAgfVxuXG4gIHJldHVybiByZXQ7XG59O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLE1BQU0sU0FBUSxhQUFlO0FBRXRDLEVBT0csQUFQSDs7Ozs7OztDQU9HLEFBUEgsRUFPRyxVQUNNLFlBQVksQ0FBQyxHQUFXO1VBQ3pCLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSztVQUNqQixHQUFHO1FBQUssS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQUcsT0FBTyxFQUFFLENBQUM7UUFBRSxNQUFNOzs7WUFFeEMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDO2NBQzdCLEdBQUcsR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUs7YUFFdEIsQ0FBRyxNQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ2YsR0FBRyxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7O1lBRTlCLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQzs7O1dBSXZCLEdBQUc7O0FBR1osRUFNRyxBQU5IOzs7Ozs7Q0FNRyxBQU5ILEVBTUcsY0FDVSxhQUFhLFlBQWEsSUFBWTtZQUN6QyxJQUFJLENBQUMsT0FBTyxFQUFDLENBQUcsS0FDcEIsWUFBWSxDQUFDLElBQUk7UUFDZixLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUk7UUFBRyxNQUFNOzs7O0FBR25DLEVBTUcsQUFOSDs7Ozs7O0NBTUcsQUFOSCxFQU1HLGNBQ1UsY0FBYyxZQUFhLEtBQWU7VUFDL0MsR0FBRztZQUVBLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQztRQUNuQyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7V0FHekIsR0FBRyJ9
