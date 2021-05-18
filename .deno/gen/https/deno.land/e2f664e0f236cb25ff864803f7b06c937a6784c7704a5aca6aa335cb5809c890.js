export class Tokenizer {
    rules;
    constructor(rules = []){
        this.rules = rules;
    }
    addRule(test, fn) {
        this.rules.push({
            test,
            fn
        });
        return this;
    }
    tokenize(string, receiver = (token)=>token
    ) {
        function* generator(rules) {
            let index = 0;
            for (const rule of rules){
                const result = rule.test(string);
                if (result) {
                    const { value , length  } = result;
                    index += length;
                    string = string.slice(length);
                    const token = {
                        ...rule.fn(value),
                        index
                    };
                    yield receiver(token);
                    yield* generator(rules);
                }
            }
        }
        const tokenGenerator = generator(this.rules);
        const tokens = [];
        for (const token of tokenGenerator){
            tokens.push(token);
        }
        if (string.length) {
            throw new Error(`parser error: string not fully parsed! ${string.slice(0, 25)}`);
        }
        return tokens;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC42OS4wL2RhdGV0aW1lL3Rva2VuaXplci50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IHR5cGUgVG9rZW4gPSB7XG4gIHR5cGU6IHN0cmluZztcbiAgdmFsdWU6IHN0cmluZyB8IG51bWJlcjtcbiAgaW5kZXg6IG51bWJlcjtcbn07XG5cbmludGVyZmFjZSBSZWNlaXZlclJlc3VsdCB7XG4gIFtuYW1lOiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXI7XG59XG5leHBvcnQgdHlwZSBDYWxsYmFja1Jlc3VsdCA9IHsgdHlwZTogc3RyaW5nOyB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIH07XG50eXBlIENhbGxiYWNrRnVuY3Rpb24gPSAodmFsdWU6IHVua25vd24pID0+IENhbGxiYWNrUmVzdWx0O1xuXG5leHBvcnQgdHlwZSBUZXN0UmVzdWx0ID0geyB2YWx1ZTogdW5rbm93bjsgbGVuZ3RoOiBudW1iZXIgfSB8IHVuZGVmaW5lZDtcbmV4cG9ydCB0eXBlIFRlc3RGdW5jdGlvbiA9IChcbiAgc3RyaW5nOiBzdHJpbmcsXG4pID0+IFRlc3RSZXN1bHQgfCB1bmRlZmluZWQ7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUnVsZSB7XG4gIHRlc3Q6IFRlc3RGdW5jdGlvbjtcbiAgZm46IENhbGxiYWNrRnVuY3Rpb247XG59XG5cbmV4cG9ydCBjbGFzcyBUb2tlbml6ZXIge1xuICBydWxlczogUnVsZVtdO1xuXG4gIGNvbnN0cnVjdG9yKHJ1bGVzOiBSdWxlW10gPSBbXSkge1xuICAgIHRoaXMucnVsZXMgPSBydWxlcztcbiAgfVxuXG4gIGFkZFJ1bGUodGVzdDogVGVzdEZ1bmN0aW9uLCBmbjogQ2FsbGJhY2tGdW5jdGlvbik6IFRva2VuaXplciB7XG4gICAgdGhpcy5ydWxlcy5wdXNoKHsgdGVzdCwgZm4gfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB0b2tlbml6ZShcbiAgICBzdHJpbmc6IHN0cmluZyxcbiAgICByZWNlaXZlciA9ICh0b2tlbjogVG9rZW4pOiBSZWNlaXZlclJlc3VsdCA9PiB0b2tlbixcbiAgKTogUmVjZWl2ZXJSZXN1bHRbXSB7XG4gICAgZnVuY3Rpb24qIGdlbmVyYXRvcihydWxlczogUnVsZVtdKTogSXRlcmFibGVJdGVyYXRvcjxSZWNlaXZlclJlc3VsdD4ge1xuICAgICAgbGV0IGluZGV4ID0gMDtcbiAgICAgIGZvciAoY29uc3QgcnVsZSBvZiBydWxlcykge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBydWxlLnRlc3Qoc3RyaW5nKTtcbiAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgIGNvbnN0IHsgdmFsdWUsIGxlbmd0aCB9ID0gcmVzdWx0O1xuICAgICAgICAgIGluZGV4ICs9IGxlbmd0aDtcbiAgICAgICAgICBzdHJpbmcgPSBzdHJpbmcuc2xpY2UobGVuZ3RoKTtcbiAgICAgICAgICBjb25zdCB0b2tlbiA9IHsgLi4ucnVsZS5mbih2YWx1ZSksIGluZGV4IH07XG4gICAgICAgICAgeWllbGQgcmVjZWl2ZXIodG9rZW4pO1xuICAgICAgICAgIHlpZWxkKiBnZW5lcmF0b3IocnVsZXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHRva2VuR2VuZXJhdG9yID0gZ2VuZXJhdG9yKHRoaXMucnVsZXMpO1xuXG4gICAgY29uc3QgdG9rZW5zOiBSZWNlaXZlclJlc3VsdFtdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHRva2VuIG9mIHRva2VuR2VuZXJhdG9yKSB7XG4gICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgfVxuXG4gICAgaWYgKHN0cmluZy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYHBhcnNlciBlcnJvcjogc3RyaW5nIG5vdCBmdWxseSBwYXJzZWQhICR7c3RyaW5nLnNsaWNlKDAsIDI1KX1gLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdG9rZW5zO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6ImFBc0JhLFNBQVM7SUFDcEIsS0FBSztnQkFFTyxLQUFhO2FBQ2xCLEtBQUssR0FBRyxLQUFLOztJQUdwQixPQUFPLENBQUMsSUFBa0IsRUFBRSxFQUFvQjthQUN6QyxLQUFLLENBQUMsSUFBSTtZQUFHLElBQUk7WUFBRSxFQUFFOzs7O0lBSTVCLFFBQVEsQ0FDTixNQUFjLEVBQ2QsUUFBUSxJQUFJLEtBQVksR0FBcUIsS0FBSzs7a0JBRXhDLFNBQVMsQ0FBQyxLQUFhO2dCQUMzQixLQUFLLEdBQUcsQ0FBQzt1QkFDRixJQUFJLElBQUksS0FBSztzQkFDaEIsTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTTtvQkFDM0IsTUFBTTs0QkFDQSxLQUFLLEdBQUUsTUFBTSxNQUFLLE1BQU07b0JBQ2hDLEtBQUssSUFBSSxNQUFNO29CQUNmLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU07MEJBQ3RCLEtBQUs7MkJBQVEsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLO3dCQUFHLEtBQUs7OzBCQUNsQyxRQUFRLENBQUMsS0FBSzsyQkFDYixTQUFTLENBQUMsS0FBSzs7OztjQUl0QixjQUFjLEdBQUcsU0FBUyxNQUFNLEtBQUs7Y0FFckMsTUFBTTttQkFFRCxLQUFLLElBQUksY0FBYztZQUNoQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUs7O1lBR2YsTUFBTSxDQUFDLE1BQU07c0JBQ0wsS0FBSyxFQUNaLHVDQUF1QyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUU7O2VBSXpELE1BQU0ifQ==