import { API_VERSION, BASE_URL, IMAGE_BASE_URL } from "../util/constants.ts";
import { loopObject } from "../util/loop_object.ts";
import { camelize } from "../util/utils.ts";
import { rest } from "./rest.ts";
// deno-lint-ignore no-explicit-any
export async function runMethod(method, url, body, retryCount = 0, bucketId) {
    if (body) {
        body = loopObject(body, (value)=>typeof value === "bigint" ? value.toString() : Array.isArray(value) ? value.map((v)=>typeof v === "bigint" ? v.toString() : v
            ) : value
        , `Running forEach loop in runMethod function for changing bigints to strings.`);
    }
    rest.eventHandlers.debug?.("requestCreate", {
        method,
        url,
        body,
        retryCount,
        bucketId
    });
    const errorStack = new Error("Location:");
    Error.captureStackTrace(errorStack);
    // For proxies we don't need to do any of the legwork so we just forward the request
    if (!url.startsWith(`${BASE_URL}/v${API_VERSION}`) && !url.startsWith(IMAGE_BASE_URL)) {
        const result = await fetch(url, {
            body: JSON.stringify(body || {
            }),
            headers: {
                authorization: rest.authorization
            },
            method: method.toUpperCase()
        }).catch((error)=>{
            console.error(error);
            throw errorStack;
        });
        return result.status !== 204 ? await result.json() : undefined;
    }
    // No proxy so we need to handle all rate limiting and such
    return new Promise((resolve, reject)=>{
        rest.processRequest({
            url,
            method,
            reject: (error)=>{
                console.error(error);
                reject(errorStack);
            },
            respond: (data)=>resolve(data.status !== 204 ? camelize(JSON.parse(data.body ?? "{}")) : undefined)
        }, {
            bucketId,
            body: body,
            retryCount
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3Jlc3QvcnVuX21ldGhvZC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQVBJX1ZFUlNJT04sIEJBU0VfVVJMLCBJTUFHRV9CQVNFX1VSTCB9IGZyb20gXCIuLi91dGlsL2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHsgbG9vcE9iamVjdCB9IGZyb20gXCIuLi91dGlsL2xvb3Bfb2JqZWN0LnRzXCI7XG5pbXBvcnQgeyBjYW1lbGl6ZSB9IGZyb20gXCIuLi91dGlsL3V0aWxzLnRzXCI7XG5pbXBvcnQgeyByZXN0IH0gZnJvbSBcIi4vcmVzdC50c1wiO1xuXG4vLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bk1ldGhvZDxUID0gYW55PihcbiAgbWV0aG9kOiBcImdldFwiIHwgXCJwb3N0XCIgfCBcInB1dFwiIHwgXCJkZWxldGVcIiB8IFwicGF0Y2hcIixcbiAgdXJsOiBzdHJpbmcsXG4gIGJvZHk/OiB1bmtub3duLFxuICByZXRyeUNvdW50ID0gMCxcbiAgYnVja2V0SWQ/OiBzdHJpbmcsXG4pOiBQcm9taXNlPFQ+IHtcbiAgaWYgKGJvZHkpIHtcbiAgICBib2R5ID0gbG9vcE9iamVjdChcbiAgICAgIGJvZHkgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICAgICAodmFsdWUpID0+XG4gICAgICAgIHR5cGVvZiB2YWx1ZSA9PT0gXCJiaWdpbnRcIlxuICAgICAgICAgID8gdmFsdWUudG9TdHJpbmcoKVxuICAgICAgICAgIDogQXJyYXkuaXNBcnJheSh2YWx1ZSlcbiAgICAgICAgICA/IHZhbHVlLm1hcCgodikgPT4gKHR5cGVvZiB2ID09PSBcImJpZ2ludFwiID8gdi50b1N0cmluZygpIDogdikpXG4gICAgICAgICAgOiB2YWx1ZSxcbiAgICAgIGBSdW5uaW5nIGZvckVhY2ggbG9vcCBpbiBydW5NZXRob2QgZnVuY3Rpb24gZm9yIGNoYW5naW5nIGJpZ2ludHMgdG8gc3RyaW5ncy5gLFxuICAgICk7XG4gIH1cblxuICByZXN0LmV2ZW50SGFuZGxlcnMuZGVidWc/LihcInJlcXVlc3RDcmVhdGVcIiwge1xuICAgIG1ldGhvZCxcbiAgICB1cmwsXG4gICAgYm9keSxcbiAgICByZXRyeUNvdW50LFxuICAgIGJ1Y2tldElkLFxuICB9KTtcblxuICBjb25zdCBlcnJvclN0YWNrID0gbmV3IEVycm9yKFwiTG9jYXRpb246XCIpO1xuICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZShlcnJvclN0YWNrKTtcblxuICAvLyBGb3IgcHJveGllcyB3ZSBkb24ndCBuZWVkIHRvIGRvIGFueSBvZiB0aGUgbGVnd29yayBzbyB3ZSBqdXN0IGZvcndhcmQgdGhlIHJlcXVlc3RcbiAgaWYgKFxuICAgICF1cmwuc3RhcnRzV2l0aChgJHtCQVNFX1VSTH0vdiR7QVBJX1ZFUlNJT059YCkgJiZcbiAgICAhdXJsLnN0YXJ0c1dpdGgoSU1BR0VfQkFTRV9VUkwpXG4gICkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSB8fCB7fSksXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIGF1dGhvcml6YXRpb246IHJlc3QuYXV0aG9yaXphdGlvbixcbiAgICAgIH0sXG4gICAgICBtZXRob2Q6IG1ldGhvZC50b1VwcGVyQ2FzZSgpLFxuICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvclN0YWNrO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdC5zdGF0dXMgIT09IDIwNCA/IGF3YWl0IHJlc3VsdC5qc29uKCkgOiB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBObyBwcm94eSBzbyB3ZSBuZWVkIHRvIGhhbmRsZSBhbGwgcmF0ZSBsaW1pdGluZyBhbmQgc3VjaFxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHJlc3QucHJvY2Vzc1JlcXVlc3QoXG4gICAgICB7XG4gICAgICAgIHVybCxcbiAgICAgICAgbWV0aG9kLFxuICAgICAgICByZWplY3Q6IChlcnJvcikgPT4ge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgIHJlamVjdChlcnJvclN0YWNrKTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVzcG9uZDogKGRhdGE6IHsgc3RhdHVzOiBudW1iZXI7IGJvZHk/OiBzdHJpbmcgfSkgPT5cbiAgICAgICAgICByZXNvbHZlKFxuICAgICAgICAgICAgZGF0YS5zdGF0dXMgIT09IDIwNFxuICAgICAgICAgICAgICA/IGNhbWVsaXplPFQ+KEpTT04ucGFyc2UoZGF0YS5ib2R5ID8/IFwie31cIikpXG4gICAgICAgICAgICAgIDogKCh1bmRlZmluZWQgYXMgdW5rbm93bikgYXMgVCksXG4gICAgICAgICAgKSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldElkLFxuICAgICAgICBib2R5OiBib2R5IGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkLFxuICAgICAgICByZXRyeUNvdW50LFxuICAgICAgfSxcbiAgICApO1xuICB9KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxXQUFXLEVBQUUsUUFBUSxFQUFFLGNBQWMsU0FBUSxvQkFBc0I7U0FDbkUsVUFBVSxTQUFRLHNCQUF3QjtTQUMxQyxRQUFRLFNBQVEsZ0JBQWtCO1NBQ2xDLElBQUksU0FBUSxTQUFXO0FBRWhDLEVBQW1DLEFBQW5DLGlDQUFtQztzQkFDYixTQUFTLENBQzdCLE1BQW1ELEVBQ25ELEdBQVcsRUFDWCxJQUFjLEVBQ2QsVUFBVSxHQUFHLENBQUMsRUFDZCxRQUFpQjtRQUViLElBQUk7UUFDTixJQUFJLEdBQUcsVUFBVSxDQUNmLElBQUksR0FDSCxLQUFLLFVBQ0csS0FBSyxNQUFLLE1BQVEsSUFDckIsS0FBSyxDQUFDLFFBQVEsS0FDZCxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssSUFDbkIsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLFVBQWEsQ0FBQyxNQUFLLE1BQVEsSUFBRyxDQUFDLENBQUMsUUFBUSxLQUFLLENBQUM7Z0JBQzFELEtBQUs7V0FDViwyRUFBMkU7O0lBSWhGLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxJQUFHLGFBQWU7UUFDeEMsTUFBTTtRQUNOLEdBQUc7UUFDSCxJQUFJO1FBQ0osVUFBVTtRQUNWLFFBQVE7O1VBR0osVUFBVSxPQUFPLEtBQUssRUFBQyxTQUFXO0lBQ3hDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVO0lBRWxDLEVBQW9GLEFBQXBGLGtGQUFvRjtTQUVqRixHQUFHLENBQUMsVUFBVSxJQUFJLFFBQVEsQ0FBQyxFQUFFLEVBQUUsV0FBVyxRQUMxQyxHQUFHLENBQUMsVUFBVSxDQUFDLGNBQWM7Y0FFeEIsTUFBTSxTQUFTLEtBQUssQ0FBQyxHQUFHO1lBQzVCLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUk7O1lBQ3pCLE9BQU87Z0JBQ0wsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhOztZQUVuQyxNQUFNLEVBQUUsTUFBTSxDQUFDLFdBQVc7V0FDekIsS0FBSyxFQUFFLEtBQUs7WUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUs7a0JBQ2IsVUFBVTs7ZUFHWCxNQUFNLENBQUMsTUFBTSxLQUFLLEdBQUcsU0FBUyxNQUFNLENBQUMsSUFBSSxLQUFLLFNBQVM7O0lBR2hFLEVBQTJELEFBQTNELHlEQUEyRDtlQUNoRCxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU07UUFDakMsSUFBSSxDQUFDLGNBQWM7WUFFZixHQUFHO1lBQ0gsTUFBTTtZQUNOLE1BQU0sR0FBRyxLQUFLO2dCQUNaLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSztnQkFDbkIsTUFBTSxDQUFDLFVBQVU7O1lBRW5CLE9BQU8sR0FBRyxJQUF1QyxHQUMvQyxPQUFPLENBQ0wsSUFBSSxDQUFDLE1BQU0sS0FBSyxHQUFHLEdBQ2YsUUFBUSxDQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSSxFQUFJLE1BQ3RDLFNBQVM7O1lBSW5CLFFBQVE7WUFDUixJQUFJLEVBQUUsSUFBSTtZQUNWLFVBQVUifQ==