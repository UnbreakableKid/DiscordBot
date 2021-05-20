/*!
 * Port of merge-descriptors (https://github.com/component/merge-descriptors) for Deno.
 *
 * Licensed as follows:
 *
 * (The MIT License)
 *
 * Copyright (c) 2013 Jonathan Ong <me@jongleberry.com>
 * Copyright (c) 2015 Douglas Christopher Wilson <doug@somethingdoug.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */ const hasOwnProperty = Object.prototype.hasOwnProperty;
/**
 * Merge the property descriptors of `src` into `dest`
 *
 * @param {object} dest Object to add descriptors to
 * @param {object} src Object to clone descriptors from
 * @param {boolean} [redefine=true] Redefine `dest` properties with `src` properties
 * @returns {object} Reference to dest
 * @public
 */ export function mergeDescriptors(dest, src, redefine = true) {
  Object.getOwnPropertyNames(src).forEach(
    function forEachOwnPropertyName(name) {
      if (!redefine && hasOwnProperty.call(dest, name)) {
        return;
      }
      const descriptor = Object.getOwnPropertyDescriptor(src, name);
      Object.defineProperty(dest, name, descriptor);
    },
  );
  return dest;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy91dGlscy9tZXJnZURlc2NyaXB0b3JzLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIFBvcnQgb2YgbWVyZ2UtZGVzY3JpcHRvcnMgKGh0dHBzOi8vZ2l0aHViLmNvbS9jb21wb25lbnQvbWVyZ2UtZGVzY3JpcHRvcnMpIGZvciBEZW5vLlxuICpcbiAqIExpY2Vuc2VkIGFzIGZvbGxvd3M6XG4gKiBcbiAqIChUaGUgTUlUIExpY2Vuc2UpXG4gKiBcbiAqIENvcHlyaWdodCAoYykgMjAxMyBKb25hdGhhbiBPbmcgPG1lQGpvbmdsZWJlcnJ5LmNvbT5cbiAqIENvcHlyaWdodCAoYykgMjAxNSBEb3VnbGFzIENocmlzdG9waGVyIFdpbHNvbiA8ZG91Z0Bzb21ldGhpbmdkb3VnLmNvbT5cbiAqIFxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nXG4gKiBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbiAqICdTb2Z0d2FyZScpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbiAqIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbiAqIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuICogcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvXG4gKiB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKiBcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG4gKiBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqIFxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsXG4gKiBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0ZcbiAqIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC5cbiAqIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZXG4gKiBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULFxuICogVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEVcbiAqIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuICpcbiAqL1xuXG5jb25zdCBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogTWVyZ2UgdGhlIHByb3BlcnR5IGRlc2NyaXB0b3JzIG9mIGBzcmNgIGludG8gYGRlc3RgXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IGRlc3QgT2JqZWN0IHRvIGFkZCBkZXNjcmlwdG9ycyB0b1xuICogQHBhcmFtIHtvYmplY3R9IHNyYyBPYmplY3QgdG8gY2xvbmUgZGVzY3JpcHRvcnMgZnJvbVxuICogQHBhcmFtIHtib29sZWFufSBbcmVkZWZpbmU9dHJ1ZV0gUmVkZWZpbmUgYGRlc3RgIHByb3BlcnRpZXMgd2l0aCBgc3JjYCBwcm9wZXJ0aWVzXG4gKiBAcmV0dXJucyB7b2JqZWN0fSBSZWZlcmVuY2UgdG8gZGVzdFxuICogQHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VEZXNjcmlwdG9ycyhcbiAgZGVzdDogb2JqZWN0LFxuICBzcmM6IG9iamVjdCxcbiAgcmVkZWZpbmU6IGJvb2xlYW4gPSB0cnVlLFxuKSB7XG4gIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHNyYykuZm9yRWFjaChcbiAgICBmdW5jdGlvbiBmb3JFYWNoT3duUHJvcGVydHlOYW1lKG5hbWUpIHtcbiAgICAgIGlmICghcmVkZWZpbmUgJiYgaGFzT3duUHJvcGVydHkuY2FsbChkZXN0LCBuYW1lKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHNyYywgbmFtZSk7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZGVzdCwgbmFtZSwgZGVzY3JpcHRvciBhcyBQcm9wZXJ0eURlc2NyaXB0b3IpO1xuICAgIH0sXG4gICk7XG5cbiAgcmV0dXJuIGRlc3Q7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUE2QkcsQUE3Qkg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBNkJHLEFBN0JILEVBNkJHLE9BRUcsY0FBYyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYztBQUV0RCxFQVFHLEFBUkg7Ozs7Ozs7O0NBUUcsQUFSSCxFQVFHLGlCQUNhLGdCQUFnQixDQUM5QixJQUFZLEVBQ1osR0FBVyxFQUNYLFFBQWlCLEdBQUcsSUFBSTtJQUV4QixNQUFNLENBQUMsbUJBQW1CLENBQUMsR0FBRyxFQUFFLE9BQU8sVUFDNUIsc0JBQXNCLENBQUMsSUFBSTthQUM3QixRQUFRLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSTs7O2NBSXpDLFVBQVUsR0FBRyxNQUFNLENBQUMsd0JBQXdCLENBQUMsR0FBRyxFQUFFLElBQUk7UUFDNUQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFVBQVU7O1dBSXpDLElBQUkifQ==