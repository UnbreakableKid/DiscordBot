/*!
 * Copyright (c) 2020 Henry Zhuang
 * MIT Licensed
 */ import { Status, STATUS_TEXT } from "./deps.ts";
export class HttpError extends Error {
    name;
    message;
    status;
    statusCode;
    expose = false;
    constructor(code, message){
        super(message);
        if (!Status[code]) {
            throw TypeError(`Unknown HTTP Status Code \`${code}\``);
        }
        if (code < 400 || code >= 600) {
            throw TypeError(`Only 4xx or 5xx status codes allowed, but got \`${code}\``);
        }
        if (code >= 400 && code < 500) {
            this.expose = true;
        }
        let className = Status[code];
        if (!className.endsWith("Error")) {
            className += "Error";
        }
        const msg = message != null ? message : STATUS_TEXT.get(code);
        this.message = msg;
        this.status = this.statusCode = code;
        this.name = className;
        Error.captureStackTrace(this, this.constructor);
        Object.setPrototypeOf(this, new.target.prototype);
    }
    toString() {
        return `${this.name} [${this.status}]: ${this.message}`;
    }
    toJSON() {
        return {
            name: this.name,
            status: this.status,
            message: this.message
        };
    }
}
class HttpErrorImpl extends HttpError {
}
export function createError(status, message, props) {
    let err;
    if (status instanceof Error) {
        err = status;
        status = err.status || err.statusCode;
        if (typeof status !== "number" || !Status[status] && (status < 400 || status >= 600)) {
            status = 500;
        }
        props = message;
    } else if (typeof message === "string") {
        err = new HttpErrorImpl(status, message);
        Error.captureStackTrace(err, createError);
    } else {
        props = message;
        err = new HttpErrorImpl(status);
        Error.captureStackTrace(err, createError);
    }
    if (!(err instanceof HttpError) || err.status !== status) {
        // add properties to generic error
        err.expose = status < 500;
        err.status = err.statusCode = status;
    }
    if (props) {
        for(let key in props){
            if (key !== "status") {
                err[key] = props[key];
            }
        }
    }
    return err;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2h0dHBfZXJyb3JzQDMuMC4wL21vZC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMjAgSGVucnkgWmh1YW5nXG4gKiBNSVQgTGljZW5zZWRcbiAqL1xuXG5pbXBvcnQgeyBTdGF0dXMsIFNUQVRVU19URVhUIH0gZnJvbSBcIi4vZGVwcy50c1wiO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgSHR0cEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBuYW1lOiBzdHJpbmc7XG4gIG1lc3NhZ2U6IHN0cmluZztcbiAgc3RhdHVzOiBudW1iZXI7XG4gIHN0YXR1c0NvZGU6IG51bWJlcjtcbiAgZXhwb3NlOiBib29sZWFuID0gZmFsc2U7XG4gIFtrZXk6IHN0cmluZ106IGFueVxuICBjb25zdHJ1Y3Rvcihjb2RlOiBudW1iZXIsIG1lc3NhZ2U/OiBzdHJpbmcpIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICBpZiAoIVN0YXR1c1tjb2RlXSkge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKGBVbmtub3duIEhUVFAgU3RhdHVzIENvZGUgXFxgJHtjb2RlfVxcYGApO1xuICAgIH1cbiAgICBpZiAoY29kZSA8IDQwMCB8fCBjb2RlID49IDYwMCkge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKFxuICAgICAgICBgT25seSA0eHggb3IgNXh4IHN0YXR1cyBjb2RlcyBhbGxvd2VkLCBidXQgZ290IFxcYCR7Y29kZX1cXGBgLFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKGNvZGUgPj0gNDAwICYmIGNvZGUgPCA1MDApIHtcbiAgICAgIHRoaXMuZXhwb3NlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBsZXQgY2xhc3NOYW1lID0gU3RhdHVzW2NvZGVdO1xuICAgIGlmICghY2xhc3NOYW1lLmVuZHNXaXRoKFwiRXJyb3JcIikpIHtcbiAgICAgIGNsYXNzTmFtZSArPSBcIkVycm9yXCI7XG4gICAgfVxuICAgIGNvbnN0IG1zZyA9IG1lc3NhZ2UgIT0gbnVsbCA/IG1lc3NhZ2UgOiBTVEFUVVNfVEVYVC5nZXQoY29kZSkhO1xuICAgIHRoaXMubWVzc2FnZSA9IG1zZztcbiAgICB0aGlzLnN0YXR1cyA9IHRoaXMuc3RhdHVzQ29kZSA9IGNvZGU7XG4gICAgdGhpcy5uYW1lID0gY2xhc3NOYW1lO1xuICAgIChFcnJvciBhcyBhbnkpLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xuICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZih0aGlzLCBuZXcudGFyZ2V0LnByb3RvdHlwZSk7XG4gIH1cblxuICB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gYCR7dGhpcy5uYW1lfSBbJHt0aGlzLnN0YXR1c31dOiAke3RoaXMubWVzc2FnZX1gO1xuICB9XG5cbiAgdG9KU09OKCkge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgICBzdGF0dXM6IHRoaXMuc3RhdHVzLFxuICAgICAgbWVzc2FnZTogdGhpcy5tZXNzYWdlLFxuICAgIH07XG4gIH1cbn1cblxuY2xhc3MgSHR0cEVycm9ySW1wbCBleHRlbmRzIEh0dHBFcnJvciB7fVxuXG5leHBvcnQgaW50ZXJmYWNlIFByb3BzIHtcbiAgW2tleTogc3RyaW5nXTogYW55O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgc3RhdHVzOiBudW1iZXI7XG4gIHN0YXR1c0NvZGU6IG51bWJlcjtcbiAgZXhwb3NlOiBib29sZWFuO1xuICBba2V5OiBzdHJpbmddOiBhbnk7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IEh0dHBFcnJvci5cbiAqXG4gKiBAcmV0dXJucyB7SHR0cEVycm9yfVxuICogQHB1YmxpY1xuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFcnJvcihcbiAgc3RhdHVzOiBudW1iZXIsXG4gIG1lc3NhZ2U/OiBzdHJpbmcsXG4gIHByb3BzPzogUHJvcHMsXG4pOiBIdHRwRXJyb3I7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRXJyb3Ioc3RhdHVzOiBudW1iZXIsIHByb3BzOiBQcm9wcyk6IEh0dHBFcnJvcjtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFcnJvcihlcnI6IEVycm9yLCBwcm9wcz86IFByb3BzKTogSUVycm9yO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVycm9yKFxuICBzdGF0dXM6IGFueSxcbiAgbWVzc2FnZT86IGFueSxcbiAgcHJvcHM/OiBQcm9wcyxcbik6IEh0dHBFcnJvciB8IEVycm9yIHtcbiAgbGV0IGVycjtcbiAgaWYgKHN0YXR1cyBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgZXJyID0gc3RhdHVzIGFzIElFcnJvcjtcbiAgICBzdGF0dXMgPSBlcnIuc3RhdHVzIHx8IGVyci5zdGF0dXNDb2RlO1xuXG4gICAgaWYgKFxuICAgICAgdHlwZW9mIHN0YXR1cyAhPT0gXCJudW1iZXJcIiB8fFxuICAgICAgKCFTdGF0dXNbc3RhdHVzXSAmJiAoc3RhdHVzIDwgNDAwIHx8IHN0YXR1cyA+PSA2MDApKVxuICAgICkge1xuICAgICAgc3RhdHVzID0gNTAwO1xuICAgIH1cblxuICAgIHByb3BzID0gbWVzc2FnZTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgbWVzc2FnZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIGVyciA9IG5ldyBIdHRwRXJyb3JJbXBsKHN0YXR1cywgbWVzc2FnZSk7XG4gICAgKEVycm9yIGFzIGFueSkuY2FwdHVyZVN0YWNrVHJhY2UoZXJyLCBjcmVhdGVFcnJvcik7XG4gIH0gZWxzZSB7XG4gICAgcHJvcHMgPSBtZXNzYWdlO1xuICAgIGVyciA9IG5ldyBIdHRwRXJyb3JJbXBsKHN0YXR1cyk7XG4gICAgKEVycm9yIGFzIGFueSkuY2FwdHVyZVN0YWNrVHJhY2UoZXJyLCBjcmVhdGVFcnJvcik7XG4gIH1cblxuICBpZiAoIShlcnIgaW5zdGFuY2VvZiBIdHRwRXJyb3IpIHx8IGVyci5zdGF0dXMgIT09IHN0YXR1cykge1xuICAgIC8vIGFkZCBwcm9wZXJ0aWVzIHRvIGdlbmVyaWMgZXJyb3JcbiAgICBlcnIuZXhwb3NlID0gc3RhdHVzIDwgNTAwO1xuICAgIGVyci5zdGF0dXMgPSBlcnIuc3RhdHVzQ29kZSA9IHN0YXR1cztcbiAgfVxuXG4gIGlmIChwcm9wcykge1xuICAgIGZvciAobGV0IGtleSBpbiBwcm9wcykge1xuICAgICAgaWYgKGtleSAhPT0gXCJzdGF0dXNcIikge1xuICAgICAgICBlcnJba2V5XSA9IHByb3BzW2tleV07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGVycjtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUdHLEFBSEg7OztDQUdHLEFBSEgsRUFHRyxVQUVNLE1BQU0sRUFBRSxXQUFXLFNBQVEsU0FBVzthQUV6QixTQUFTLFNBQVMsS0FBSztJQUMzQyxJQUFJO0lBQ0osT0FBTztJQUNQLE1BQU07SUFDTixVQUFVO0lBQ1YsTUFBTSxHQUFZLEtBQUs7Z0JBRVgsSUFBWSxFQUFFLE9BQWdCO1FBQ3hDLEtBQUssQ0FBQyxPQUFPO2FBQ1IsTUFBTSxDQUFDLElBQUk7a0JBQ1IsU0FBUyxFQUFFLDJCQUEyQixFQUFFLElBQUksQ0FBQyxFQUFFOztZQUVuRCxJQUFJLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHO2tCQUNyQixTQUFTLEVBQ1osZ0RBQWdELEVBQUUsSUFBSSxDQUFDLEVBQUU7O1lBRzFELElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxHQUFHLEdBQUc7aUJBQ3RCLE1BQU0sR0FBRyxJQUFJOztZQUdoQixTQUFTLEdBQUcsTUFBTSxDQUFDLElBQUk7YUFDdEIsU0FBUyxDQUFDLFFBQVEsRUFBQyxLQUFPO1lBQzdCLFNBQVMsS0FBSSxLQUFPOztjQUVoQixHQUFHLEdBQUcsT0FBTyxJQUFJLElBQUksR0FBRyxPQUFPLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJO2FBQ3ZELE9BQU8sR0FBRyxHQUFHO2FBQ2IsTUFBTSxRQUFRLFVBQVUsR0FBRyxJQUFJO2FBQy9CLElBQUksR0FBRyxTQUFTO1FBQ3BCLEtBQUssQ0FBUyxpQkFBaUIsWUFBWSxXQUFXO1FBQ3ZELE1BQU0sQ0FBQyxjQUFjLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTOztJQUdsRCxRQUFRO3VCQUNTLElBQUksQ0FBQyxFQUFFLE9BQU8sTUFBTSxDQUFDLEdBQUcsT0FBTyxPQUFPOztJQUd2RCxNQUFNOztZQUVGLElBQUksT0FBTyxJQUFJO1lBQ2YsTUFBTSxPQUFPLE1BQU07WUFDbkIsT0FBTyxPQUFPLE9BQU87Ozs7TUFLckIsYUFBYSxTQUFTLFNBQVM7O2dCQTJCckIsV0FBVyxDQUN6QixNQUFXLEVBQ1gsT0FBYSxFQUNiLEtBQWE7UUFFVCxHQUFHO1FBQ0gsTUFBTSxZQUFZLEtBQUs7UUFDekIsR0FBRyxHQUFHLE1BQU07UUFDWixNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sSUFBSSxHQUFHLENBQUMsVUFBVTttQkFHNUIsTUFBTSxNQUFLLE1BQVEsTUFDeEIsTUFBTSxDQUFDLE1BQU0sTUFBTSxNQUFNLEdBQUcsR0FBRyxJQUFJLE1BQU0sSUFBSSxHQUFHO1lBRWxELE1BQU0sR0FBRyxHQUFHOztRQUdkLEtBQUssR0FBRyxPQUFPO3NCQUNDLE9BQU8sTUFBSyxNQUFRO1FBQ3BDLEdBQUcsT0FBTyxhQUFhLENBQUMsTUFBTSxFQUFFLE9BQU87UUFDdEMsS0FBSyxDQUFTLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxXQUFXOztRQUVqRCxLQUFLLEdBQUcsT0FBTztRQUNmLEdBQUcsT0FBTyxhQUFhLENBQUMsTUFBTTtRQUM3QixLQUFLLENBQVMsaUJBQWlCLENBQUMsR0FBRyxFQUFFLFdBQVc7O1VBRzdDLEdBQUcsWUFBWSxTQUFTLEtBQUssR0FBRyxDQUFDLE1BQU0sS0FBSyxNQUFNO1FBQ3RELEVBQWtDLEFBQWxDLGdDQUFrQztRQUNsQyxHQUFHLENBQUMsTUFBTSxHQUFHLE1BQU0sR0FBRyxHQUFHO1FBQ3pCLEdBQUcsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLFVBQVUsR0FBRyxNQUFNOztRQUdsQyxLQUFLO2dCQUNFLEdBQUcsSUFBSSxLQUFLO2dCQUNmLEdBQUcsTUFBSyxNQUFRO2dCQUNsQixHQUFHLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxHQUFHOzs7O1dBS25CLEdBQUcifQ==