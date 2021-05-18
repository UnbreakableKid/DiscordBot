import { app as application } from "./application.ts";
import { request } from "./request.ts";
import { Response as ServerResponse } from "./response.ts";
import { mergeDescriptors } from "./utils/mergeDescriptors.ts";
import { EventEmitter } from "../deps.ts";
/**
 * Response prototype.
 * 
 * @public
 */ export const response = Object.create(ServerResponse.prototype);
/**
 * Create an Opine application.
 * 
 * @return {Opine}
 * @public
 */ export function opine() {
    const app = function(req, res = new ServerResponse(), next) {
        app.handle(req, res, next);
    };
    const eventEmitter = new EventEmitter();
    app.emit = (event, ...args)=>eventEmitter.emit(event, ...args)
    ;
    app.on = (event, arg)=>eventEmitter.on(event, arg)
    ;
    mergeDescriptors(app, application, false);
    // expose the prototype that will get set on requests
    app.request = Object.create(request, {
        app: {
            configurable: true,
            enumerable: true,
            writable: true,
            value: app
        }
    });
    // expose the prototype that will get set on responses
    app.response = Object.create(response, {
        app: {
            configurable: true,
            enumerable: true,
            writable: true,
            value: app
        }
    });
    app.init();
    return app;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy9vcGluZS50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYXBwIGFzIGFwcGxpY2F0aW9uIH0gZnJvbSBcIi4vYXBwbGljYXRpb24udHNcIjtcbmltcG9ydCB7IHJlcXVlc3QgfSBmcm9tIFwiLi9yZXF1ZXN0LnRzXCI7XG5pbXBvcnQgeyBSZXNwb25zZSBhcyBTZXJ2ZXJSZXNwb25zZSB9IGZyb20gXCIuL3Jlc3BvbnNlLnRzXCI7XG5pbXBvcnQgeyBtZXJnZURlc2NyaXB0b3JzIH0gZnJvbSBcIi4vdXRpbHMvbWVyZ2VEZXNjcmlwdG9ycy50c1wiO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSBcIi4uL2RlcHMudHNcIjtcbmltcG9ydCB0eXBlIHsgTmV4dEZ1bmN0aW9uLCBPcGluZSwgUmVxdWVzdCwgUmVzcG9uc2UgfSBmcm9tIFwiLi90eXBlcy50c1wiO1xuXG4vKipcbiAqIFJlc3BvbnNlIHByb3RvdHlwZS5cbiAqIFxuICogQHB1YmxpY1xuICovXG5leHBvcnQgY29uc3QgcmVzcG9uc2U6IFJlc3BvbnNlID0gT2JqZWN0LmNyZWF0ZShTZXJ2ZXJSZXNwb25zZS5wcm90b3R5cGUpO1xuXG4vKipcbiAqIENyZWF0ZSBhbiBPcGluZSBhcHBsaWNhdGlvbi5cbiAqIFxuICogQHJldHVybiB7T3BpbmV9XG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvcGluZSgpOiBPcGluZSB7XG4gIGNvbnN0IGFwcCA9IGZ1bmN0aW9uIChcbiAgICByZXE6IFJlcXVlc3QsXG4gICAgcmVzOiBSZXNwb25zZSA9IG5ldyBTZXJ2ZXJSZXNwb25zZSgpLFxuICAgIG5leHQ6IE5leHRGdW5jdGlvbixcbiAgKTogdm9pZCB7XG4gICAgYXBwLmhhbmRsZShyZXEsIHJlcywgbmV4dCk7XG4gIH0gYXMgT3BpbmU7XG5cbiAgY29uc3QgZXZlbnRFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gIGFwcC5lbWl0ID0gKGV2ZW50OiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKSA9PlxuICAgIGV2ZW50RW1pdHRlci5lbWl0KGV2ZW50LCAuLi5hcmdzKTtcbiAgYXBwLm9uID0gKGV2ZW50OiBzdHJpbmcsIGFyZzogYW55KSA9PiBldmVudEVtaXR0ZXIub24oZXZlbnQsIGFyZyk7XG5cbiAgbWVyZ2VEZXNjcmlwdG9ycyhhcHAsIGFwcGxpY2F0aW9uLCBmYWxzZSk7XG5cbiAgLy8gZXhwb3NlIHRoZSBwcm90b3R5cGUgdGhhdCB3aWxsIGdldCBzZXQgb24gcmVxdWVzdHNcbiAgYXBwLnJlcXVlc3QgPSBPYmplY3QuY3JlYXRlKHJlcXVlc3QsIHtcbiAgICBhcHA6IHsgY29uZmlndXJhYmxlOiB0cnVlLCBlbnVtZXJhYmxlOiB0cnVlLCB3cml0YWJsZTogdHJ1ZSwgdmFsdWU6IGFwcCB9LFxuICB9KTtcblxuICAvLyBleHBvc2UgdGhlIHByb3RvdHlwZSB0aGF0IHdpbGwgZ2V0IHNldCBvbiByZXNwb25zZXNcbiAgYXBwLnJlc3BvbnNlID0gT2JqZWN0LmNyZWF0ZShyZXNwb25zZSwge1xuICAgIGFwcDogeyBjb25maWd1cmFibGU6IHRydWUsIGVudW1lcmFibGU6IHRydWUsIHdyaXRhYmxlOiB0cnVlLCB2YWx1ZTogYXBwIH0sXG4gIH0pO1xuXG4gIGFwcC5pbml0KCk7XG5cbiAgcmV0dXJuIGFwcDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxHQUFHLElBQUksV0FBVyxTQUFRLGdCQUFrQjtTQUM1QyxPQUFPLFNBQVEsWUFBYztTQUM3QixRQUFRLElBQUksY0FBYyxTQUFRLGFBQWU7U0FDakQsZ0JBQWdCLFNBQVEsMkJBQTZCO1NBQ3JELFlBQVksU0FBUSxVQUFZO0FBR3pDLEVBSUcsQUFKSDs7OztDQUlHLEFBSkgsRUFJRyxjQUNVLFFBQVEsR0FBYSxNQUFNLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTO0FBRXhFLEVBS0csQUFMSDs7Ozs7Q0FLRyxBQUxILEVBS0csaUJBQ2EsS0FBSztVQUNiLEdBQUcsWUFDUCxHQUFZLEVBQ1osR0FBYSxPQUFPLGNBQWMsSUFDbEMsSUFBa0I7UUFFbEIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUk7O1VBR3JCLFlBQVksT0FBTyxZQUFZO0lBRXJDLEdBQUcsQ0FBQyxJQUFJLElBQUksS0FBYSxLQUFLLElBQUksR0FDaEMsWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLEtBQUssSUFBSTs7SUFDbEMsR0FBRyxDQUFDLEVBQUUsSUFBSSxLQUFhLEVBQUUsR0FBUSxHQUFLLFlBQVksQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUc7O0lBRWhFLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxXQUFXLEVBQUUsS0FBSztJQUV4QyxFQUFxRCxBQUFyRCxtREFBcUQ7SUFDckQsR0FBRyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU87UUFDakMsR0FBRztZQUFJLFlBQVksRUFBRSxJQUFJO1lBQUUsVUFBVSxFQUFFLElBQUk7WUFBRSxRQUFRLEVBQUUsSUFBSTtZQUFFLEtBQUssRUFBRSxHQUFHOzs7SUFHekUsRUFBc0QsQUFBdEQsb0RBQXNEO0lBQ3RELEdBQUcsQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRO1FBQ25DLEdBQUc7WUFBSSxZQUFZLEVBQUUsSUFBSTtZQUFFLFVBQVUsRUFBRSxJQUFJO1lBQUUsUUFBUSxFQUFFLElBQUk7WUFBRSxLQUFLLEVBQUUsR0FBRzs7O0lBR3pFLEdBQUcsQ0FBQyxJQUFJO1dBRUQsR0FBRyJ9