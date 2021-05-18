import { createError, gunzip as createGunzip, inflate as createInflate } from "../../../deps.ts";
/**
 * Read a request into a buffer and parse.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 * @param {Function} parse
 * @param {object} options
 * @private
 */ export async function read(req, res, next, parse, options) {
    req._parsedBody = true;
    const encoding = options.encoding;
    const verify = options.verify;
    let raw;
    try {
        raw = await decodeContent(req, options.inflate);
    } catch (err) {
        next(err);
        return;
    }
    if (verify) {
        try {
            verify(req, res, raw, encoding);
        } catch (err) {
            next(createError(403, err, {
                body: raw,
                type: err.type ?? "entity.verify.failed"
            }));
            return;
        }
    }
    let str;
    try {
        str = typeof raw !== "string" && encoding !== null ? new TextDecoder(encoding).decode(raw) : raw;
        req.parsedBody = parse(str);
    } catch (err) {
        next(createError(400, err, {
            body: str ?? raw,
            type: err.type ?? "entity.parse.failed"
        }));
        return;
    }
    next();
}
/**
 * Get the decoded content of the request.
 *
 * @param {object} req
 * @param {boolean} [inflate=true]
 * @return {Promise<Uint8Array>}
 * @private
 */ async function decodeContent(req, inflate = true) {
    const encoding = (req.headers.get("content-encoding") || "identity").toLowerCase();
    if (inflate === false && encoding !== "identity") {
        throw createError(415, `unsupported content encoding "${encoding}"`, {
            encoding: encoding,
            type: "encoding.unsupported"
        });
    }
    let raw;
    try {
        raw = await Deno.readAll(req.body);
    } catch (err) {
        throw createError(400, err);
    }
    switch(encoding){
        case "deflate":
            return createInflate(raw);
        case "gzip":
            return createGunzip(raw);
        case "identity":
            return raw;
        default:
            throw createError(415, `unsupported content encoding "${encoding}"`, {
                encoding: encoding,
                type: "encoding.unsupported"
            });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy9taWRkbGV3YXJlL2JvZHlQYXJzZXIvcmVhZC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiBQb3J0IG9mIGJvZHktcGFyc2VyIChodHRwczovL2dpdGh1Yi5jb20vZXhwcmVzc2pzL2JvZHktcGFyc2VyKSBmb3IgRGVuby5cbiAqXG4gKiBMaWNlbnNlZCBhcyBmb2xsb3dzOlxuICpcbiAqIChUaGUgTUlUIExpY2Vuc2UpXG4gKiBcbiAqIENvcHlyaWdodCAoYykgMjAxNCBKb25hdGhhbiBPbmcgPG1lQGpvbmdsZWJlcnJ5LmNvbT5cbiAqIENvcHlyaWdodCAoYykgMjAxNC0yMDE1IERvdWdsYXMgQ2hyaXN0b3BoZXIgV2lsc29uIDxkb3VnQHNvbWV0aGluZ2RvdWcuY29tPlxuICogXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmdcbiAqIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuICogJ1NvZnR3YXJlJyksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuICogd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuICogZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG9cbiAqIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqIFxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbiAqIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICogXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbiAqIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuICogTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULlxuICogSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTllcbiAqIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsXG4gKiBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRVxuICogU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKiBcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IE5leHRGdW5jdGlvbiwgUmVxdWVzdCwgUmVzcG9uc2UgfSBmcm9tIFwiLi4vLi4vdHlwZXMudHNcIjtcbmltcG9ydCB7XG4gIGNyZWF0ZUVycm9yLFxuICBndW56aXAgYXMgY3JlYXRlR3VuemlwLFxuICBpbmZsYXRlIGFzIGNyZWF0ZUluZmxhdGUsXG59IGZyb20gXCIuLi8uLi8uLi9kZXBzLnRzXCI7XG5cbi8qKlxuICogUmVhZCBhIHJlcXVlc3QgaW50byBhIGJ1ZmZlciBhbmQgcGFyc2UuXG4gKlxuICogQHBhcmFtIHtSZXF1ZXN0fSByZXFcbiAqIEBwYXJhbSB7UmVzcG9uc2V9IHJlc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gcGFyc2VcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZChcbiAgcmVxOiBSZXF1ZXN0LFxuICByZXM6IFJlc3BvbnNlLFxuICBuZXh0OiBOZXh0RnVuY3Rpb24sXG4gIHBhcnNlOiBGdW5jdGlvbixcbiAgb3B0aW9uczogYW55LFxuKSB7XG4gIHJlcS5fcGFyc2VkQm9keSA9IHRydWU7XG5cbiAgY29uc3QgZW5jb2Rpbmc6IHN0cmluZyA9IG9wdGlvbnMuZW5jb2Rpbmc7XG4gIGNvbnN0IHZlcmlmeSA9IG9wdGlvbnMudmVyaWZ5O1xuXG4gIGxldCByYXc6IFVpbnQ4QXJyYXk7XG4gIHRyeSB7XG4gICAgcmF3ID0gYXdhaXQgZGVjb2RlQ29udGVudChyZXEsIG9wdGlvbnMuaW5mbGF0ZSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIG5leHQoZXJyKTtcblxuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICh2ZXJpZnkpIHtcbiAgICB0cnkge1xuICAgICAgdmVyaWZ5KHJlcSwgcmVzLCByYXcsIGVuY29kaW5nKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIG5leHQoY3JlYXRlRXJyb3IoNDAzLCBlcnIsIHtcbiAgICAgICAgYm9keTogcmF3LFxuICAgICAgICB0eXBlOiBlcnIudHlwZSA/PyBcImVudGl0eS52ZXJpZnkuZmFpbGVkXCIsXG4gICAgICB9KSk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICBsZXQgc3RyO1xuICB0cnkge1xuICAgIHN0ciA9IHR5cGVvZiByYXcgIT09IFwic3RyaW5nXCIgJiYgZW5jb2RpbmcgIT09IG51bGxcbiAgICAgID8gbmV3IFRleHREZWNvZGVyKGVuY29kaW5nKS5kZWNvZGUocmF3KVxuICAgICAgOiByYXc7XG5cbiAgICByZXEucGFyc2VkQm9keSA9IHBhcnNlKHN0cik7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIG5leHQoY3JlYXRlRXJyb3IoNDAwLCBlcnIsIHtcbiAgICAgIGJvZHk6IHN0ciA/PyByYXcsXG4gICAgICB0eXBlOiBlcnIudHlwZSA/PyBcImVudGl0eS5wYXJzZS5mYWlsZWRcIixcbiAgICB9KSk7XG5cbiAgICByZXR1cm47XG4gIH1cblxuICBuZXh0KCk7XG59XG5cbi8qKlxuICogR2V0IHRoZSBkZWNvZGVkIGNvbnRlbnQgb2YgdGhlIHJlcXVlc3QuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IHJlcVxuICogQHBhcmFtIHtib29sZWFufSBbaW5mbGF0ZT10cnVlXVxuICogQHJldHVybiB7UHJvbWlzZTxVaW50OEFycmF5Pn1cbiAqIEBwcml2YXRlXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGRlY29kZUNvbnRlbnQoXG4gIHJlcTogUmVxdWVzdCxcbiAgaW5mbGF0ZTogYm9vbGVhbiA9IHRydWUsXG4pOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcbiAgY29uc3QgZW5jb2RpbmcgPSAocmVxLmhlYWRlcnMuZ2V0KFwiY29udGVudC1lbmNvZGluZ1wiKSB8fCBcImlkZW50aXR5XCIpXG4gICAgLnRvTG93ZXJDYXNlKCk7XG5cbiAgaWYgKGluZmxhdGUgPT09IGZhbHNlICYmIGVuY29kaW5nICE9PSBcImlkZW50aXR5XCIpIHtcbiAgICB0aHJvdyBjcmVhdGVFcnJvcig0MTUsIGB1bnN1cHBvcnRlZCBjb250ZW50IGVuY29kaW5nIFwiJHtlbmNvZGluZ31cImAsIHtcbiAgICAgIGVuY29kaW5nOiBlbmNvZGluZyxcbiAgICAgIHR5cGU6IFwiZW5jb2RpbmcudW5zdXBwb3J0ZWRcIixcbiAgICB9KTtcbiAgfVxuXG4gIGxldCByYXc7XG4gIHRyeSB7XG4gICAgcmF3ID0gYXdhaXQgRGVuby5yZWFkQWxsKHJlcS5ib2R5KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgY3JlYXRlRXJyb3IoNDAwLCBlcnIpO1xuICB9XG5cbiAgc3dpdGNoIChlbmNvZGluZykge1xuICAgIGNhc2UgXCJkZWZsYXRlXCI6XG4gICAgICByZXR1cm4gY3JlYXRlSW5mbGF0ZShyYXcpO1xuICAgIGNhc2UgXCJnemlwXCI6XG4gICAgICByZXR1cm4gY3JlYXRlR3VuemlwKHJhdyk7XG4gICAgY2FzZSBcImlkZW50aXR5XCI6XG4gICAgICByZXR1cm4gcmF3O1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcig0MTUsIGB1bnN1cHBvcnRlZCBjb250ZW50IGVuY29kaW5nIFwiJHtlbmNvZGluZ31cImAsIHtcbiAgICAgICAgZW5jb2Rpbmc6IGVuY29kaW5nLFxuICAgICAgICB0eXBlOiBcImVuY29kaW5nLnVuc3VwcG9ydGVkXCIsXG4gICAgICB9KTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQWlDRSxXQUFXLEVBQ1gsTUFBTSxJQUFJLFlBQVksRUFDdEIsT0FBTyxJQUFJLGFBQWEsU0FDbkIsZ0JBQWtCO0FBRXpCLEVBU0csQUFUSDs7Ozs7Ozs7O0NBU0csQUFUSCxFQVNHLHVCQUNtQixJQUFJLENBQ3hCLEdBQVksRUFDWixHQUFhLEVBQ2IsSUFBa0IsRUFDbEIsS0FBZSxFQUNmLE9BQVk7SUFFWixHQUFHLENBQUMsV0FBVyxHQUFHLElBQUk7VUFFaEIsUUFBUSxHQUFXLE9BQU8sQ0FBQyxRQUFRO1VBQ25DLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTTtRQUV6QixHQUFHOztRQUVMLEdBQUcsU0FBUyxhQUFhLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxPQUFPO2FBQ3ZDLEdBQUc7UUFDVixJQUFJLENBQUMsR0FBRzs7O1FBS04sTUFBTTs7WUFFTixNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsUUFBUTtpQkFDdkIsR0FBRztZQUNWLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEdBQUc7Z0JBQ3ZCLElBQUksRUFBRSxHQUFHO2dCQUNULElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxLQUFJLG9CQUFzQjs7Ozs7UUFPMUMsR0FBRzs7UUFFTCxHQUFHLFVBQVUsR0FBRyxNQUFLLE1BQVEsS0FBSSxRQUFRLEtBQUssSUFBSSxPQUMxQyxXQUFXLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxHQUFHLElBQ3BDLEdBQUc7UUFFUCxHQUFHLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQyxHQUFHO2FBQ25CLEdBQUc7UUFDVixJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxHQUFHO1lBQ3ZCLElBQUksRUFBRSxHQUFHLElBQUksR0FBRztZQUNoQixJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUksS0FBSSxtQkFBcUI7Ozs7SUFNM0MsSUFBSTs7QUFHTixFQU9HLEFBUEg7Ozs7Ozs7Q0FPRyxBQVBILEVBT0csZ0JBQ1ksYUFBYSxDQUMxQixHQUFZLEVBQ1osT0FBZ0IsR0FBRyxJQUFJO1VBRWpCLFFBQVEsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBQyxnQkFBa0IsT0FBSyxRQUFVLEdBQ2hFLFdBQVc7UUFFVixPQUFPLEtBQUssS0FBSyxJQUFJLFFBQVEsTUFBSyxRQUFVO2NBQ3hDLFdBQVcsQ0FBQyxHQUFHLEdBQUcsOEJBQThCLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDaEUsUUFBUSxFQUFFLFFBQVE7WUFDbEIsSUFBSSxHQUFFLG9CQUFzQjs7O1FBSTVCLEdBQUc7O1FBRUwsR0FBRyxTQUFTLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUk7YUFDMUIsR0FBRztjQUNKLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRzs7V0FHcEIsUUFBUTtjQUNULE9BQVM7bUJBQ0wsYUFBYSxDQUFDLEdBQUc7Y0FDckIsSUFBTTttQkFDRixZQUFZLENBQUMsR0FBRztjQUNwQixRQUFVO21CQUNOLEdBQUc7O2tCQUVKLFdBQVcsQ0FBQyxHQUFHLEdBQUcsOEJBQThCLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ2hFLFFBQVEsRUFBRSxRQUFRO2dCQUNsQixJQUFJLEdBQUUsb0JBQXNCIn0=