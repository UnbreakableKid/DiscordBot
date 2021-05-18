import { eventHandlers } from "../bot.ts";
export function loopObject(obj, handler, log) {
    let res = {
    };
    if (Array.isArray(obj)) {
        res = [];
        for (const o of obj){
            if (typeof o === "object" && !Array.isArray(o) && o !== null) {
                // A nested object
                res.push(loopObject(o, handler, log));
            } else {
                res.push(handler(o, "array"));
            }
        }
    } else {
        for (const [key, value] of Object.entries(obj)){
            eventHandlers.debug?.("loop", log);
            if (typeof value === "object" && !Array.isArray(value) && value !== null && !(value instanceof Blob)) {
                // A nested object
                res[key] = loopObject(value, handler, log);
            } else {
                res[key] = handler(value, key);
            }
        }
    }
    return res;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3V0aWwvbG9vcF9vYmplY3QudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV2ZW50SGFuZGxlcnMgfSBmcm9tIFwiLi4vYm90LnRzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBsb29wT2JqZWN0PFQgPSBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4oXG4gIG9iajogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gIGhhbmRsZXI6ICh2YWx1ZTogdW5rbm93biwga2V5OiBzdHJpbmcpID0+IHVua25vd24sXG4gIGxvZzogc3RyaW5nLFxuKSB7XG4gIGxldCByZXM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5rbm93bltdID0ge307XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkge1xuICAgIHJlcyA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBvIG9mIG9iaikge1xuICAgICAgaWYgKHR5cGVvZiBvID09PSBcIm9iamVjdFwiICYmICFBcnJheS5pc0FycmF5KG8pICYmIG8gIT09IG51bGwpIHtcbiAgICAgICAgLy8gQSBuZXN0ZWQgb2JqZWN0XG4gICAgICAgIHJlcy5wdXNoKGxvb3BPYmplY3QobyBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgaGFuZGxlciwgbG9nKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXMucHVzaChoYW5kbGVyKG8sIFwiYXJyYXlcIikpO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhvYmopKSB7XG4gICAgICBldmVudEhhbmRsZXJzLmRlYnVnPy4oXCJsb29wXCIsIGxvZyk7XG5cbiAgICAgIGlmIChcbiAgICAgICAgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmXG4gICAgICAgICFBcnJheS5pc0FycmF5KHZhbHVlKSAmJlxuICAgICAgICB2YWx1ZSAhPT0gbnVsbCAmJlxuICAgICAgICAhKHZhbHVlIGluc3RhbmNlb2YgQmxvYilcbiAgICAgICkge1xuICAgICAgICAvLyBBIG5lc3RlZCBvYmplY3RcbiAgICAgICAgcmVzW2tleV0gPSBsb29wT2JqZWN0KHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBoYW5kbGVyLCBsb2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzW2tleV0gPSBoYW5kbGVyKHZhbHVlLCBrZXkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXMgYXMgVDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxhQUFhLFNBQVEsU0FBVztnQkFFekIsVUFBVSxDQUN4QixHQUE0QixFQUM1QixPQUFpRCxFQUNqRCxHQUFXO1FBRVAsR0FBRzs7UUFFSCxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUc7UUFDbkIsR0FBRzttQkFFUSxDQUFDLElBQUksR0FBRzt1QkFDTixDQUFDLE1BQUssTUFBUSxNQUFLLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxJQUFJO2dCQUMxRCxFQUFrQixBQUFsQixnQkFBa0I7Z0JBQ2xCLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBNkIsT0FBTyxFQUFFLEdBQUc7O2dCQUU5RCxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUUsS0FBTzs7OztvQkFJbkIsR0FBRyxFQUFFLEtBQUssS0FBSyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUc7WUFDM0MsYUFBYSxDQUFDLEtBQUssSUFBRyxJQUFNLEdBQUUsR0FBRzt1QkFHeEIsS0FBSyxNQUFLLE1BQVEsTUFDeEIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEtBQ3BCLEtBQUssS0FBSyxJQUFJLE1BQ1osS0FBSyxZQUFZLElBQUk7Z0JBRXZCLEVBQWtCLEFBQWxCLGdCQUFrQjtnQkFDbEIsR0FBRyxDQUFDLEdBQUcsSUFBSSxVQUFVLENBQUMsS0FBSyxFQUE2QixPQUFPLEVBQUUsR0FBRzs7Z0JBRXBFLEdBQUcsQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHOzs7O1dBSzVCLEdBQUcifQ==