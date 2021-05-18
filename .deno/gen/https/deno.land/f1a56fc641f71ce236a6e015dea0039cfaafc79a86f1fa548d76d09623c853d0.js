// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
/**
 * pooledMap transforms values from an (async) iterable into another async
 * iterable. The transforms are done concurrently, with a max concurrency
 * defined by the poolLimit.
 *
 * If an error is thrown from `iterableFn`, no new transformations will begin.
 * All currently executing transformations are allowed to finish and still
 * yielded on success. After that, the rejections among them are gathered and
 * thrown by the iterator in an `AggregateError`.
 *
 * @param poolLimit The maximum count of items being processed concurrently.
 * @param array The input array for mapping.
 * @param iteratorFn The function to call for every item of the array.
 */ export function pooledMap(poolLimit, array, iteratorFn) {
    // Create the async iterable that is returned from this function.
    const res = new TransformStream({
        async transform (p, controller) {
            controller.enqueue(await p);
        }
    });
    // Start processing items from the iterator
    (async ()=>{
        const writer = res.writable.getWriter();
        const executing = [];
        try {
            for await (const item of array){
                const p = Promise.resolve().then(()=>iteratorFn(item)
                );
                // Only write on success. If we `writer.write()` a rejected promise,
                // that will end the iteration. We don't want that yet. Instead let it
                // fail the race, taking us to the catch block where all currently
                // executing jobs are allowed to finish and all rejections among them
                // can be reported together.
                p.then((v)=>writer.write(Promise.resolve(v))
                ).catch(()=>{
                });
                const e = p.then(()=>executing.splice(executing.indexOf(e), 1)
                );
                executing.push(e);
                if (executing.length >= poolLimit) {
                    await Promise.race(executing);
                }
            }
            // Wait until all ongoing events have processed, then close the writer.
            await Promise.all(executing);
            writer.close();
        } catch  {
            const errors = [];
            for (const result of await Promise.allSettled(executing)){
                if (result.status == "rejected") {
                    errors.push(result.reason);
                }
            }
            writer.write(Promise.reject(new AggregateError(errors, "Threw while mapping."))).catch(()=>{
            });
        }
    })();
    return res.readable[Symbol.asyncIterator]();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NS4wL2FzeW5jL3Bvb2wudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjEgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbi8qKlxuICogcG9vbGVkTWFwIHRyYW5zZm9ybXMgdmFsdWVzIGZyb20gYW4gKGFzeW5jKSBpdGVyYWJsZSBpbnRvIGFub3RoZXIgYXN5bmNcbiAqIGl0ZXJhYmxlLiBUaGUgdHJhbnNmb3JtcyBhcmUgZG9uZSBjb25jdXJyZW50bHksIHdpdGggYSBtYXggY29uY3VycmVuY3lcbiAqIGRlZmluZWQgYnkgdGhlIHBvb2xMaW1pdC5cbiAqXG4gKiBJZiBhbiBlcnJvciBpcyB0aHJvd24gZnJvbSBgaXRlcmFibGVGbmAsIG5vIG5ldyB0cmFuc2Zvcm1hdGlvbnMgd2lsbCBiZWdpbi5cbiAqIEFsbCBjdXJyZW50bHkgZXhlY3V0aW5nIHRyYW5zZm9ybWF0aW9ucyBhcmUgYWxsb3dlZCB0byBmaW5pc2ggYW5kIHN0aWxsXG4gKiB5aWVsZGVkIG9uIHN1Y2Nlc3MuIEFmdGVyIHRoYXQsIHRoZSByZWplY3Rpb25zIGFtb25nIHRoZW0gYXJlIGdhdGhlcmVkIGFuZFxuICogdGhyb3duIGJ5IHRoZSBpdGVyYXRvciBpbiBhbiBgQWdncmVnYXRlRXJyb3JgLlxuICpcbiAqIEBwYXJhbSBwb29sTGltaXQgVGhlIG1heGltdW0gY291bnQgb2YgaXRlbXMgYmVpbmcgcHJvY2Vzc2VkIGNvbmN1cnJlbnRseS5cbiAqIEBwYXJhbSBhcnJheSBUaGUgaW5wdXQgYXJyYXkgZm9yIG1hcHBpbmcuXG4gKiBAcGFyYW0gaXRlcmF0b3JGbiBUaGUgZnVuY3Rpb24gdG8gY2FsbCBmb3IgZXZlcnkgaXRlbSBvZiB0aGUgYXJyYXkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwb29sZWRNYXA8VCwgUj4oXG4gIHBvb2xMaW1pdDogbnVtYmVyLFxuICBhcnJheTogSXRlcmFibGU8VD4gfCBBc3luY0l0ZXJhYmxlPFQ+LFxuICBpdGVyYXRvckZuOiAoZGF0YTogVCkgPT4gUHJvbWlzZTxSPixcbik6IEFzeW5jSXRlcmFibGVJdGVyYXRvcjxSPiB7XG4gIC8vIENyZWF0ZSB0aGUgYXN5bmMgaXRlcmFibGUgdGhhdCBpcyByZXR1cm5lZCBmcm9tIHRoaXMgZnVuY3Rpb24uXG4gIGNvbnN0IHJlcyA9IG5ldyBUcmFuc2Zvcm1TdHJlYW08UHJvbWlzZTxSPiwgUj4oe1xuICAgIGFzeW5jIHRyYW5zZm9ybShcbiAgICAgIHA6IFByb21pc2U8Uj4sXG4gICAgICBjb250cm9sbGVyOiBUcmFuc2Zvcm1TdHJlYW1EZWZhdWx0Q29udHJvbGxlcjxSPixcbiAgICApIHtcbiAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShhd2FpdCBwKTtcbiAgICB9LFxuICB9KTtcbiAgLy8gU3RhcnQgcHJvY2Vzc2luZyBpdGVtcyBmcm9tIHRoZSBpdGVyYXRvclxuICAoYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHdyaXRlciA9IHJlcy53cml0YWJsZS5nZXRXcml0ZXIoKTtcbiAgICBjb25zdCBleGVjdXRpbmc6IEFycmF5PFByb21pc2U8dW5rbm93bj4+ID0gW107XG4gICAgdHJ5IHtcbiAgICAgIGZvciBhd2FpdCAoY29uc3QgaXRlbSBvZiBhcnJheSkge1xuICAgICAgICBjb25zdCBwID0gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiBpdGVyYXRvckZuKGl0ZW0pKTtcbiAgICAgICAgLy8gT25seSB3cml0ZSBvbiBzdWNjZXNzLiBJZiB3ZSBgd3JpdGVyLndyaXRlKClgIGEgcmVqZWN0ZWQgcHJvbWlzZSxcbiAgICAgICAgLy8gdGhhdCB3aWxsIGVuZCB0aGUgaXRlcmF0aW9uLiBXZSBkb24ndCB3YW50IHRoYXQgeWV0LiBJbnN0ZWFkIGxldCBpdFxuICAgICAgICAvLyBmYWlsIHRoZSByYWNlLCB0YWtpbmcgdXMgdG8gdGhlIGNhdGNoIGJsb2NrIHdoZXJlIGFsbCBjdXJyZW50bHlcbiAgICAgICAgLy8gZXhlY3V0aW5nIGpvYnMgYXJlIGFsbG93ZWQgdG8gZmluaXNoIGFuZCBhbGwgcmVqZWN0aW9ucyBhbW9uZyB0aGVtXG4gICAgICAgIC8vIGNhbiBiZSByZXBvcnRlZCB0b2dldGhlci5cbiAgICAgICAgcC50aGVuKCh2KSA9PiB3cml0ZXIud3JpdGUoUHJvbWlzZS5yZXNvbHZlKHYpKSkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICBjb25zdCBlOiBQcm9taXNlPHVua25vd24+ID0gcC50aGVuKCgpID0+XG4gICAgICAgICAgZXhlY3V0aW5nLnNwbGljZShleGVjdXRpbmcuaW5kZXhPZihlKSwgMSlcbiAgICAgICAgKTtcbiAgICAgICAgZXhlY3V0aW5nLnB1c2goZSk7XG4gICAgICAgIGlmIChleGVjdXRpbmcubGVuZ3RoID49IHBvb2xMaW1pdCkge1xuICAgICAgICAgIGF3YWl0IFByb21pc2UucmFjZShleGVjdXRpbmcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBXYWl0IHVudGlsIGFsbCBvbmdvaW5nIGV2ZW50cyBoYXZlIHByb2Nlc3NlZCwgdGhlbiBjbG9zZSB0aGUgd3JpdGVyLlxuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoZXhlY3V0aW5nKTtcbiAgICAgIHdyaXRlci5jbG9zZSgpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgY29uc3QgZXJyb3JzID0gW107XG4gICAgICBmb3IgKGNvbnN0IHJlc3VsdCBvZiBhd2FpdCBQcm9taXNlLmFsbFNldHRsZWQoZXhlY3V0aW5nKSkge1xuICAgICAgICBpZiAocmVzdWx0LnN0YXR1cyA9PSBcInJlamVjdGVkXCIpIHtcbiAgICAgICAgICBlcnJvcnMucHVzaChyZXN1bHQucmVhc29uKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgd3JpdGVyLndyaXRlKFByb21pc2UucmVqZWN0KFxuICAgICAgICBuZXcgQWdncmVnYXRlRXJyb3IoZXJyb3JzLCBcIlRocmV3IHdoaWxlIG1hcHBpbmcuXCIpLFxuICAgICAgKSkuY2F0Y2goKCkgPT4ge30pO1xuICAgIH1cbiAgfSkoKTtcbiAgcmV0dXJuIHJlcy5yZWFkYWJsZVtTeW1ib2wuYXN5bmNJdGVyYXRvcl0oKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUEwRSxBQUExRSx3RUFBMEU7QUFFMUUsRUFhRyxBQWJIOzs7Ozs7Ozs7Ozs7O0NBYUcsQUFiSCxFQWFHLGlCQUNhLFNBQVMsQ0FDdkIsU0FBaUIsRUFDakIsS0FBcUMsRUFDckMsVUFBbUM7SUFFbkMsRUFBaUUsQUFBakUsK0RBQWlFO1VBQzNELEdBQUcsT0FBTyxlQUFlO2NBQ3ZCLFNBQVMsRUFDYixDQUFhLEVBQ2IsVUFBK0M7WUFFL0MsVUFBVSxDQUFDLE9BQU8sT0FBTyxDQUFDOzs7SUFHOUIsRUFBMkMsQUFBM0MseUNBQTJDOztjQUVuQyxNQUFNLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxTQUFTO2NBQy9CLFNBQVM7OzZCQUVJLElBQUksSUFBSSxLQUFLO3NCQUN0QixDQUFDLEdBQUcsT0FBTyxDQUFDLE9BQU8sR0FBRyxJQUFJLEtBQU8sVUFBVSxDQUFDLElBQUk7O2dCQUN0RCxFQUFvRSxBQUFwRSxrRUFBb0U7Z0JBQ3BFLEVBQXNFLEFBQXRFLG9FQUFzRTtnQkFDdEUsRUFBa0UsQUFBbEUsZ0VBQWtFO2dCQUNsRSxFQUFxRSxBQUFyRSxtRUFBcUU7Z0JBQ3JFLEVBQTRCLEFBQTVCLDBCQUE0QjtnQkFDNUIsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUssTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7a0JBQUksS0FBSzs7c0JBQy9DLENBQUMsR0FBcUIsQ0FBQyxDQUFDLElBQUksS0FDaEMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDOztnQkFFMUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNaLFNBQVMsQ0FBQyxNQUFNLElBQUksU0FBUzswQkFDekIsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTOzs7WUFHaEMsRUFBdUUsQUFBdkUscUVBQXVFO2tCQUNqRSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVM7WUFDM0IsTUFBTSxDQUFDLEtBQUs7O2tCQUVOLE1BQU07dUJBQ0QsTUFBTSxVQUFVLE9BQU8sQ0FBQyxVQUFVLENBQUMsU0FBUztvQkFDakQsTUFBTSxDQUFDLE1BQU0sS0FBSSxRQUFVO29CQUM3QixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNOzs7WUFHN0IsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxLQUNyQixjQUFjLENBQUMsTUFBTSxHQUFFLG9CQUFzQixLQUNoRCxLQUFLOzs7O1dBR0wsR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsYUFBYSJ9