/*!
 * Port of etag (https://github.com/jshttp/etag) for Deno.
 *
 * Licensed as follows:
 *
 * (The MIT License)
 *
 * Copyright (c) 2014-2016 Douglas Christopher Wilson
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
 */
import { Sha1 } from "../../deps.ts";
const encoder = new TextEncoder();
const decoder = new TextDecoder();
/**s
 * Generate an entity tag.
 *
 * @param {any} entity
 * @return {string}
 * @private
 */ function entitytag(entity) {
  if (entity.length === 0) {
    // fast-path empty
    return '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"';
  }
  if (entity instanceof Uint8Array) {
    entity = decoder.decode(entity);
  }
  // compute hash of entity
  const sha1 = new Sha1();
  sha1.update(entity);
  sha1.digest();
  const hash = sha1.toString().substring(0, 27);
  // compute length of entity
  const len = typeof entity === "string"
    ? encoder.encode(entity).byteLength
    : entity.byteLength;
  return `"${len.toString(16)}-${hash}"`;
}
/**
 * Determine if object is a Stats object.
 *
 * @param {object} obj
 * @return {boolean}
 * @private
 */ function isstats(obj) {
  // quack quack
  return obj && typeof obj === "object" && "atime" in obj && "mtime" in obj &&
    "birthtime" in obj && "size" in obj && typeof obj.size === "number";
}
/**
 * Generate a tag for a stat.
 *
 * @param {object} stat
 * @return {string}
 * @private
 */ function stattag(stat) {
  const mtime = new Date(stat.mtime).getTime().toString(16);
  const size = stat.size.toString(16);
  return '"' + size + "-" + mtime + '"';
}
/**
 * Create a simple ETag.
 *
 * @param {string|Uint8Array|Deno.FileInfo} entity
 * @param {object} [options]
 * @param {boolean} [options.weak]
 * @return {string}
 * @public
 */ export function etag(entity, options) {
  if (entity == null) {
    throw new TypeError("argument entity is required");
  }
  let entityObj = entity;
  if (typeof entity === "string") {
    try {
      // In case have stringify the Deno.FileInfo object.
      entityObj = JSON.parse(entity);
    } catch (_) {
    }
  }
  // support fs.Stats object
  const isStats = isstats(entityObj);
  const weak = options && typeof options.weak === "boolean"
    ? options.weak
    : isStats;
  // validate argument
  if (
    !isStats && typeof entity !== "string" && !(entity instanceof Uint8Array)
  ) {
    throw new TypeError(
      "argument entity must be string, Uint8Array, or Deno.FileInfo",
    );
  }
  // generate entity tag
  const tag = isStats ? stattag(entityObj) : entitytag(entity);
  return weak ? `W/${tag}` : tag;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy91dGlscy9ldGFnLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIFBvcnQgb2YgZXRhZyAoaHR0cHM6Ly9naXRodWIuY29tL2pzaHR0cC9ldGFnKSBmb3IgRGVuby5cbiAqXG4gKiBMaWNlbnNlZCBhcyBmb2xsb3dzOlxuICpcbiAqIChUaGUgTUlUIExpY2Vuc2UpXG4gKiBcbiAqIENvcHlyaWdodCAoYykgMjAxNC0yMDE2IERvdWdsYXMgQ2hyaXN0b3BoZXIgV2lsc29uXG4gKiBcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZ1xuICogYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4gKiAnU29mdHdhcmUnKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4gKiB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4gKiBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbiAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0b1xuICogdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICogXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxuICogaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKiBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICogRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4gKiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuXG4gKiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWVxuICogQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCxcbiAqIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFXG4gKiBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqIFxuICovXG5cbmltcG9ydCB7IFNoYTEgfSBmcm9tIFwiLi4vLi4vZGVwcy50c1wiO1xuXG5jb25zdCBlbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG5jb25zdCBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG5cbi8qKnNcbiAqIEdlbmVyYXRlIGFuIGVudGl0eSB0YWcuXG4gKlxuICogQHBhcmFtIHthbnl9IGVudGl0eVxuICogQHJldHVybiB7c3RyaW5nfVxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gZW50aXR5dGFnKGVudGl0eTogYW55KTogc3RyaW5nIHtcbiAgaWYgKGVudGl0eS5sZW5ndGggPT09IDApIHtcbiAgICAvLyBmYXN0LXBhdGggZW1wdHlcbiAgICByZXR1cm4gJ1wiMC0yam1qN2w1clN3MHlWYi92bFdBWWtLL1lCd2tcIic7XG4gIH1cblxuICBpZiAoZW50aXR5IGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgIGVudGl0eSA9IGRlY29kZXIuZGVjb2RlKGVudGl0eSk7XG4gIH1cblxuICAvLyBjb21wdXRlIGhhc2ggb2YgZW50aXR5XG4gIGNvbnN0IHNoYTEgPSBuZXcgU2hhMSgpO1xuICBzaGExLnVwZGF0ZShlbnRpdHkpO1xuICBzaGExLmRpZ2VzdCgpO1xuICBjb25zdCBoYXNoID0gc2hhMS50b1N0cmluZygpLnN1YnN0cmluZygwLCAyNyk7XG5cbiAgLy8gY29tcHV0ZSBsZW5ndGggb2YgZW50aXR5XG4gIGNvbnN0IGxlbiA9IHR5cGVvZiBlbnRpdHkgPT09IFwic3RyaW5nXCJcbiAgICA/IGVuY29kZXIuZW5jb2RlKGVudGl0eSkuYnl0ZUxlbmd0aFxuICAgIDogZW50aXR5LmJ5dGVMZW5ndGg7XG5cbiAgcmV0dXJuIGBcIiR7bGVuLnRvU3RyaW5nKDE2KX0tJHtoYXNofVwiYDtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmUgaWYgb2JqZWN0IGlzIGEgU3RhdHMgb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBpc3N0YXRzKG9iajogYW55KTogYm9vbGVhbiB7XG4gIC8vIHF1YWNrIHF1YWNrXG4gIHJldHVybiBvYmogJiYgdHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIiAmJlxuICAgIFwiYXRpbWVcIiBpbiBvYmogJiZcbiAgICBcIm10aW1lXCIgaW4gb2JqICYmXG4gICAgXCJiaXJ0aHRpbWVcIiBpbiBvYmogJiZcbiAgICBcInNpemVcIiBpbiBvYmogJiYgdHlwZW9mIG9iai5zaXplID09PSBcIm51bWJlclwiO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlIGEgdGFnIGZvciBhIHN0YXQuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IHN0YXRcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIHN0YXR0YWcoc3RhdDogRGVuby5GaWxlSW5mbykge1xuICBjb25zdCBtdGltZSA9IG5ldyBEYXRlKHN0YXQubXRpbWUgYXMgRGF0ZSkuZ2V0VGltZSgpLnRvU3RyaW5nKDE2KTtcbiAgY29uc3Qgc2l6ZSA9IHN0YXQuc2l6ZS50b1N0cmluZygxNik7XG5cbiAgcmV0dXJuICdcIicgKyBzaXplICsgXCItXCIgKyBtdGltZSArICdcIic7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgc2ltcGxlIEVUYWcuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8VWludDhBcnJheXxEZW5vLkZpbGVJbmZvfSBlbnRpdHlcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMud2Vha11cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV0YWcoXG4gIGVudGl0eTogc3RyaW5nIHwgVWludDhBcnJheSB8IERlbm8uRmlsZUluZm8sXG4gIG9wdGlvbnM6IGFueSxcbikge1xuICBpZiAoZW50aXR5ID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYXJndW1lbnQgZW50aXR5IGlzIHJlcXVpcmVkXCIpO1xuICB9XG5cbiAgbGV0IGVudGl0eU9iaiA9IGVudGl0eTtcbiAgaWYgKHR5cGVvZiBlbnRpdHkgPT09IFwic3RyaW5nXCIpIHtcbiAgICB0cnkge1xuICAgICAgLy8gSW4gY2FzZSBoYXZlIHN0cmluZ2lmeSB0aGUgRGVuby5GaWxlSW5mbyBvYmplY3QuXG4gICAgICBlbnRpdHlPYmogPSBKU09OLnBhcnNlKGVudGl0eSk7XG4gICAgfSBjYXRjaCAoXykge31cbiAgfVxuXG4gIC8vIHN1cHBvcnQgZnMuU3RhdHMgb2JqZWN0XG4gIGNvbnN0IGlzU3RhdHMgPSBpc3N0YXRzKGVudGl0eU9iaik7XG4gIGNvbnN0IHdlYWsgPSBvcHRpb25zICYmIHR5cGVvZiBvcHRpb25zLndlYWsgPT09IFwiYm9vbGVhblwiXG4gICAgPyBvcHRpb25zLndlYWtcbiAgICA6IGlzU3RhdHM7XG5cbiAgLy8gdmFsaWRhdGUgYXJndW1lbnRcbiAgaWYgKFxuICAgICFpc1N0YXRzICYmIHR5cGVvZiBlbnRpdHkgIT09IFwic3RyaW5nXCIgJiYgIShlbnRpdHkgaW5zdGFuY2VvZiBVaW50OEFycmF5KVxuICApIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgXCJhcmd1bWVudCBlbnRpdHkgbXVzdCBiZSBzdHJpbmcsIFVpbnQ4QXJyYXksIG9yIERlbm8uRmlsZUluZm9cIixcbiAgICApO1xuICB9XG5cbiAgLy8gZ2VuZXJhdGUgZW50aXR5IHRhZ1xuICBjb25zdCB0YWcgPSBpc1N0YXRzID8gc3RhdHRhZyhlbnRpdHlPYmogYXMgRGVuby5GaWxlSW5mbykgOiBlbnRpdHl0YWcoZW50aXR5KTtcblxuICByZXR1cm4gd2VhayA/IGBXLyR7dGFnfWAgOiB0YWc7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUE0QkcsQUE1Qkg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E0QkcsQUE1QkgsRUE0QkcsVUFFTSxJQUFJLFNBQVEsYUFBZTtNQUU5QixPQUFPLE9BQU8sV0FBVztNQUN6QixPQUFPLE9BQU8sV0FBVztBQUUvQixFQU1HLEFBTkg7Ozs7OztDQU1HLEFBTkgsRUFNRyxVQUNNLFNBQVMsQ0FBQyxNQUFXO1FBQ3hCLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQztRQUNyQixFQUFrQixBQUFsQixnQkFBa0I7Z0JBQ1gsK0JBQWlDOztRQUd0QyxNQUFNLFlBQVksVUFBVTtRQUM5QixNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNOztJQUdoQyxFQUF5QixBQUF6Qix1QkFBeUI7VUFDbkIsSUFBSSxPQUFPLElBQUk7SUFDckIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNO0lBQ2xCLElBQUksQ0FBQyxNQUFNO1VBQ0wsSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFO0lBRTVDLEVBQTJCLEFBQTNCLHlCQUEyQjtVQUNyQixHQUFHLFVBQVUsTUFBTSxNQUFLLE1BQVEsSUFDbEMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsVUFBVSxHQUNqQyxNQUFNLENBQUMsVUFBVTtZQUViLENBQUMsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7O0FBR3ZDLEVBTUcsQUFOSDs7Ozs7O0NBTUcsQUFOSCxFQU1HLFVBQ00sT0FBTyxDQUFDLEdBQVE7SUFDdkIsRUFBYyxBQUFkLFlBQWM7V0FDUCxHQUFHLFdBQVcsR0FBRyxNQUFLLE1BQVEsTUFDbkMsS0FBTyxLQUFJLEdBQUcsS0FDZCxLQUFPLEtBQUksR0FBRyxLQUNkLFNBQVcsS0FBSSxHQUFHLEtBQ2xCLElBQU0sS0FBSSxHQUFHLFdBQVcsR0FBRyxDQUFDLElBQUksTUFBSyxNQUFROztBQUdqRCxFQU1HLEFBTkg7Ozs7OztDQU1HLEFBTkgsRUFNRyxVQUNNLE9BQU8sQ0FBQyxJQUFtQjtVQUM1QixLQUFLLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQVUsT0FBTyxHQUFHLFFBQVEsQ0FBQyxFQUFFO1VBQzFELElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBRTNCLENBQUcsSUFBRyxJQUFJLElBQUcsQ0FBRyxJQUFHLEtBQUssSUFBRyxDQUFHOztBQUd2QyxFQVFHLEFBUkg7Ozs7Ozs7O0NBUUcsQUFSSCxFQVFHLGlCQUNhLElBQUksQ0FDbEIsTUFBMkMsRUFDM0MsT0FBWTtRQUVSLE1BQU0sSUFBSSxJQUFJO2tCQUNOLFNBQVMsRUFBQywyQkFBNkI7O1FBRy9DLFNBQVMsR0FBRyxNQUFNO2VBQ1gsTUFBTSxNQUFLLE1BQVE7O1lBRTFCLEVBQW1ELEFBQW5ELGlEQUFtRDtZQUNuRCxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNO2lCQUN0QixDQUFDOzs7SUFHWixFQUEwQixBQUExQix3QkFBMEI7VUFDcEIsT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTO1VBQzNCLElBQUksR0FBRyxPQUFPLFdBQVcsT0FBTyxDQUFDLElBQUksTUFBSyxPQUFTLElBQ3JELE9BQU8sQ0FBQyxJQUFJLEdBQ1osT0FBTztJQUVYLEVBQW9CLEFBQXBCLGtCQUFvQjtTQUVqQixPQUFPLFdBQVcsTUFBTSxNQUFLLE1BQVEsT0FBTSxNQUFNLFlBQVksVUFBVTtrQkFFOUQsU0FBUyxFQUNqQiw0REFBOEQ7O0lBSWxFLEVBQXNCLEFBQXRCLG9CQUFzQjtVQUNoQixHQUFHLEdBQUcsT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLElBQXFCLFNBQVMsQ0FBQyxNQUFNO1dBRXJFLElBQUksSUFBSSxFQUFFLEVBQUUsR0FBRyxLQUFLLEdBQUcifQ==
