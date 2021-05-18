import { charset } from "../../../deps.ts";
/**
 * Get the charset of a request.
 *
 * @param {Request} req
 * @returns {string|undefined}
 * @private
 */ export function getCharset(req) {
  try {
    return (charset(req.headers.get("Content-Type") || "") || "").toLowerCase();
  } catch (e) {
    return undefined;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy9taWRkbGV3YXJlL2JvZHlQYXJzZXIvZ2V0Q2hhcnNldC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY2hhcnNldCB9IGZyb20gXCIuLi8uLi8uLi9kZXBzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFJlcXVlc3QgfSBmcm9tIFwiLi4vLi4vdHlwZXMudHNcIjtcblxuLyoqXG4gKiBHZXQgdGhlIGNoYXJzZXQgb2YgYSByZXF1ZXN0LlxuICpcbiAqIEBwYXJhbSB7UmVxdWVzdH0gcmVxXG4gKiBAcmV0dXJucyB7c3RyaW5nfHVuZGVmaW5lZH1cbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDaGFyc2V0KHJlcTogUmVxdWVzdCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIChjaGFyc2V0KHJlcS5oZWFkZXJzLmdldChcIkNvbnRlbnQtVHlwZVwiKSB8fCBcIlwiKSB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLE9BQU8sU0FBUSxnQkFBa0I7QUFHMUMsRUFNRyxBQU5IOzs7Ozs7Q0FNRyxBQU5ILEVBTUcsaUJBQ2EsVUFBVSxDQUFDLEdBQVk7O2dCQUUzQixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUMsWUFBYyxpQkFBZ0IsV0FBVzthQUNsRSxDQUFDO2VBQ0QsU0FBUyJ9
