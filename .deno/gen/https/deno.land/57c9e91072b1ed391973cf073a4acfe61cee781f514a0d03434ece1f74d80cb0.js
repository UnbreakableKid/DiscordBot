export class Tokenizer {
  rules;
  constructor(rules = []) {
    this.rules = rules;
  }
  addRule(test, fn) {
    this.rules.push({
      test,
      fn,
    });
    return this;
  }
  tokenize(string, receiver = (token) => token) {
    function* generator(rules) {
      let index = 0;
      for (const rule of rules) {
        const result = rule.test(string);
        if (result) {
          const { value, length } = result;
          index += length;
          string = string.slice(length);
          const token = {
            ...rule.fn(value),
            index,
          };
          yield receiver(token);
          yield* generator(rules);
        }
      }
    }
    const tokenGenerator = generator(this.rules);
    const tokens = [];
    for (const token of tokenGenerator) {
      tokens.push(token);
    }
    if (string.length) {
      throw new Error(
        `parser error: string not fully parsed! ${string.slice(0, 25)}`,
      );
    }
    return tokens;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NS4wL2RhdGV0aW1lL3Rva2VuaXplci50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMSB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuZXhwb3J0IHR5cGUgVG9rZW4gPSB7XG4gIHR5cGU6IHN0cmluZztcbiAgdmFsdWU6IHN0cmluZyB8IG51bWJlcjtcbiAgaW5kZXg6IG51bWJlcjtcbiAgW2tleTogc3RyaW5nXTogdW5rbm93bjtcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVjZWl2ZXJSZXN1bHQge1xuICBbbmFtZTogc3RyaW5nXTogc3RyaW5nIHwgbnVtYmVyIHwgdW5rbm93bjtcbn1cbmV4cG9ydCB0eXBlIENhbGxiYWNrUmVzdWx0ID0ge1xuICB0eXBlOiBzdHJpbmc7XG4gIHZhbHVlOiBzdHJpbmcgfCBudW1iZXI7XG4gIFtrZXk6IHN0cmluZ106IHVua25vd247XG59O1xudHlwZSBDYWxsYmFja0Z1bmN0aW9uID0gKHZhbHVlOiB1bmtub3duKSA9PiBDYWxsYmFja1Jlc3VsdDtcblxuZXhwb3J0IHR5cGUgVGVzdFJlc3VsdCA9IHsgdmFsdWU6IHVua25vd247IGxlbmd0aDogbnVtYmVyIH0gfCB1bmRlZmluZWQ7XG5leHBvcnQgdHlwZSBUZXN0RnVuY3Rpb24gPSAoXG4gIHN0cmluZzogc3RyaW5nLFxuKSA9PiBUZXN0UmVzdWx0IHwgdW5kZWZpbmVkO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJ1bGUge1xuICB0ZXN0OiBUZXN0RnVuY3Rpb247XG4gIGZuOiBDYWxsYmFja0Z1bmN0aW9uO1xufVxuXG5leHBvcnQgY2xhc3MgVG9rZW5pemVyIHtcbiAgcnVsZXM6IFJ1bGVbXTtcblxuICBjb25zdHJ1Y3RvcihydWxlczogUnVsZVtdID0gW10pIHtcbiAgICB0aGlzLnJ1bGVzID0gcnVsZXM7XG4gIH1cblxuICBhZGRSdWxlKHRlc3Q6IFRlc3RGdW5jdGlvbiwgZm46IENhbGxiYWNrRnVuY3Rpb24pOiBUb2tlbml6ZXIge1xuICAgIHRoaXMucnVsZXMucHVzaCh7IHRlc3QsIGZuIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdG9rZW5pemUoXG4gICAgc3RyaW5nOiBzdHJpbmcsXG4gICAgcmVjZWl2ZXIgPSAodG9rZW46IFRva2VuKTogUmVjZWl2ZXJSZXN1bHQgPT4gdG9rZW4sXG4gICk6IFJlY2VpdmVyUmVzdWx0W10ge1xuICAgIGZ1bmN0aW9uKiBnZW5lcmF0b3IocnVsZXM6IFJ1bGVbXSk6IEl0ZXJhYmxlSXRlcmF0b3I8UmVjZWl2ZXJSZXN1bHQ+IHtcbiAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICBmb3IgKGNvbnN0IHJ1bGUgb2YgcnVsZXMpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gcnVsZS50ZXN0KHN0cmluZyk7XG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICBjb25zdCB7IHZhbHVlLCBsZW5ndGggfSA9IHJlc3VsdDtcbiAgICAgICAgICBpbmRleCArPSBsZW5ndGg7XG4gICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnNsaWNlKGxlbmd0aCk7XG4gICAgICAgICAgY29uc3QgdG9rZW4gPSB7IC4uLnJ1bGUuZm4odmFsdWUpLCBpbmRleCB9O1xuICAgICAgICAgIHlpZWxkIHJlY2VpdmVyKHRva2VuKTtcbiAgICAgICAgICB5aWVsZCogZ2VuZXJhdG9yKHJ1bGVzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCB0b2tlbkdlbmVyYXRvciA9IGdlbmVyYXRvcih0aGlzLnJ1bGVzKTtcblxuICAgIGNvbnN0IHRva2VuczogUmVjZWl2ZXJSZXN1bHRbXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCB0b2tlbiBvZiB0b2tlbkdlbmVyYXRvcikge1xuICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgIH1cblxuICAgIGlmIChzdHJpbmcubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBwYXJzZXIgZXJyb3I6IHN0cmluZyBub3QgZnVsbHkgcGFyc2VkISAke3N0cmluZy5zbGljZSgwLCAyNSl9YCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRva2VucztcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJhQTZCYSxTQUFTO0lBQ3BCLEtBQUs7Z0JBRU8sS0FBYTthQUNsQixLQUFLLEdBQUcsS0FBSzs7SUFHcEIsT0FBTyxDQUFDLElBQWtCLEVBQUUsRUFBb0I7YUFDekMsS0FBSyxDQUFDLElBQUk7WUFBRyxJQUFJO1lBQUUsRUFBRTs7OztJQUk1QixRQUFRLENBQ04sTUFBYyxFQUNkLFFBQVEsSUFBSSxLQUFZLEdBQXFCLEtBQUs7O2tCQUV4QyxTQUFTLENBQUMsS0FBYTtnQkFDM0IsS0FBSyxHQUFHLENBQUM7dUJBQ0YsSUFBSSxJQUFJLEtBQUs7c0JBQ2hCLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU07b0JBQzNCLE1BQU07NEJBQ0EsS0FBSyxHQUFFLE1BQU0sTUFBSyxNQUFNO29CQUNoQyxLQUFLLElBQUksTUFBTTtvQkFDZixNQUFNLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNOzBCQUN0QixLQUFLOzJCQUFRLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSzt3QkFBRyxLQUFLOzswQkFDbEMsUUFBUSxDQUFDLEtBQUs7MkJBQ2IsU0FBUyxDQUFDLEtBQUs7Ozs7Y0FJdEIsY0FBYyxHQUFHLFNBQVMsTUFBTSxLQUFLO2NBRXJDLE1BQU07bUJBRUQsS0FBSyxJQUFJLGNBQWM7WUFDaEMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLOztZQUdmLE1BQU0sQ0FBQyxNQUFNO3NCQUNMLEtBQUssRUFDWix1Q0FBdUMsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFOztlQUl6RCxNQUFNIn0=
