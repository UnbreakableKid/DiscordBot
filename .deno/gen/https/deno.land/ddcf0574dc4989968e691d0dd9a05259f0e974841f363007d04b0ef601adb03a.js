export async function readMsg(reader) {
    const arr = [];
    const n = 100;
    let readed;
    while(true){
        const p = new Uint8Array(n);
        readed = await reader.read(p);
        if (readed === null) break;
        if (readed < n) {
            arr.push(p.subarray(0, readed));
            break;
        } else {
            arr.push(p);
        }
    }
    if (readed === null) return readed;
    const result = concatUint8Array(arr);
    return result;
}
export function concatUint8Array(arr) {
    const length = arr.reduce((pre, next)=>pre + next.length
    , 0);
    const result = new Uint8Array(length);
    let offset = 0;
    for (const v of arr){
        result.set(v, offset);
        offset += v.length;
    }
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2NvbXByZXNzQHYwLjMuNi91dGlscy91aW50OC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRNc2cocmVhZGVyOiBEZW5vLlJlYWRlcik6IFByb21pc2U8VWludDhBcnJheSB8IG51bGw+IHtcbiAgY29uc3QgYXJyOiBVaW50OEFycmF5W10gPSBbXTtcbiAgY29uc3QgbiA9IDEwMDtcbiAgbGV0IHJlYWRlZDogbnVtYmVyIHwgbnVsbDtcbiAgd2hpbGUgKHRydWUpIHtcbiAgICBjb25zdCBwOiBVaW50OEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkobik7XG4gICAgcmVhZGVkID0gYXdhaXQgcmVhZGVyLnJlYWQocCk7XG4gICAgaWYgKHJlYWRlZCA9PT0gbnVsbCkgYnJlYWs7XG4gICAgaWYgKHJlYWRlZCA8IG4pIHtcbiAgICAgIGFyci5wdXNoKHAuc3ViYXJyYXkoMCwgcmVhZGVkKSk7XG4gICAgICBicmVhaztcbiAgICB9IGVsc2Uge1xuICAgICAgYXJyLnB1c2gocCk7XG4gICAgfVxuICB9XG4gIGlmIChyZWFkZWQgPT09IG51bGwpIHJldHVybiByZWFkZWQ7XG4gIGNvbnN0IHJlc3VsdCA9IGNvbmNhdFVpbnQ4QXJyYXkoYXJyKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbmNhdFVpbnQ4QXJyYXkoYXJyOiBVaW50OEFycmF5W10pOiBVaW50OEFycmF5IHtcbiAgY29uc3QgbGVuZ3RoID0gYXJyLnJlZHVjZSgocHJlLCBuZXh0KSA9PiBwcmUgKyBuZXh0Lmxlbmd0aCwgMCk7XG4gIGNvbnN0IHJlc3VsdCA9IG5ldyBVaW50OEFycmF5KGxlbmd0aCk7XG4gIGxldCBvZmZzZXQgPSAwO1xuICBmb3IgKGNvbnN0IHYgb2YgYXJyKSB7XG4gICAgcmVzdWx0LnNldCh2LCBvZmZzZXQpO1xuICAgIG9mZnNldCArPSB2Lmxlbmd0aDtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJzQkFBc0IsT0FBTyxDQUFDLE1BQW1CO1VBQ3pDLEdBQUc7VUFDSCxDQUFDLEdBQUcsR0FBRztRQUNULE1BQU07VUFDSCxJQUFJO2NBQ0gsQ0FBQyxPQUFtQixVQUFVLENBQUMsQ0FBQztRQUN0QyxNQUFNLFNBQVMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hCLE1BQU0sS0FBSyxJQUFJO1lBQ2YsTUFBTSxHQUFHLENBQUM7WUFDWixHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLE1BQU07OztZQUc3QixHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7OztRQUdWLE1BQU0sS0FBSyxJQUFJLFNBQVMsTUFBTTtVQUM1QixNQUFNLEdBQUcsZ0JBQWdCLENBQUMsR0FBRztXQUM1QixNQUFNOztnQkFHQyxnQkFBZ0IsQ0FBQyxHQUFpQjtVQUMxQyxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxHQUFLLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTTtNQUFFLENBQUM7VUFDdkQsTUFBTSxPQUFPLFVBQVUsQ0FBQyxNQUFNO1FBQ2hDLE1BQU0sR0FBRyxDQUFDO2VBQ0gsQ0FBQyxJQUFJLEdBQUc7UUFDakIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsTUFBTTtRQUNwQixNQUFNLElBQUksQ0FBQyxDQUFDLE1BQU07O1dBRWIsTUFBTSJ9