export * as tar from "./tar/mod.ts";
export * as tgz from "./tgz/mod.ts";
export { gunzipFile, gzipFile, GzipStream } from "./gzip/mod.ts";
/** slow */
// export { deflateRaw, inflateRaw } from "./deflate/mod.ts";
/** fast */ export {
  deflate,
  deflateRaw,
  gunzip,
  gzip,
  inflate,
  inflateRaw,
} from "./zlib/mod.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2NvbXByZXNzQHYwLjMuNi9tb2QudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCAqIGFzIHRhciBmcm9tIFwiLi90YXIvbW9kLnRzXCI7XG5leHBvcnQgKiBhcyB0Z3ogZnJvbSBcIi4vdGd6L21vZC50c1wiO1xuZXhwb3J0IHtcbiAgZ3ppcEZpbGUsXG4gIGd1bnppcEZpbGUsXG4gIEd6aXBTdHJlYW0sXG4gIC8qKiBzbG93ICovXG4gIC8vIGd6aXAsXG4gIC8vIGd1bnppcCxcbn0gZnJvbSBcIi4vZ3ppcC9tb2QudHNcIjtcbi8qKiBzbG93ICovXG4vLyBleHBvcnQgeyBkZWZsYXRlUmF3LCBpbmZsYXRlUmF3IH0gZnJvbSBcIi4vZGVmbGF0ZS9tb2QudHNcIjtcbi8qKiBmYXN0ICovXG5leHBvcnQge1xuICBkZWZsYXRlLFxuICBpbmZsYXRlLFxuICBkZWZsYXRlUmF3LFxuICBpbmZsYXRlUmF3LFxuICBnemlwLFxuICBndW56aXAsXG59IGZyb20gXCIuL3psaWIvbW9kLnRzXCI7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IllBQVksR0FBRyxPQUFNLFlBQWM7WUFDdkIsR0FBRyxPQUFNLFlBQWM7U0FFakMsUUFBUSxFQUNSLFVBQVUsRUFDVixVQUFVLFNBSUwsYUFBZTtBQUN0QixFQUFXLEFBQVgsT0FBVyxBQUFYLEVBQVcsQ0FDWCxFQUE2RCxBQUE3RCwyREFBNkQ7QUFDN0QsRUFBVyxBQUFYLE9BQVcsQUFBWCxFQUFXLFVBRVQsT0FBTyxFQUNQLE9BQU8sRUFDUCxVQUFVLEVBQ1YsVUFBVSxFQUNWLElBQUksRUFDSixNQUFNLFNBQ0QsYUFBZSJ9
