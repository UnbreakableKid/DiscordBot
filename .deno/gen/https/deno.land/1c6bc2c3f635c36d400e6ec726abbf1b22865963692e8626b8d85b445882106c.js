/*!
 * Based on https://github.com/jshttp/accepts/blob/master/index.js
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015 Douglas Christopher Wilson
 * Copyright(c) 2020 Henry Zhuang
 * MIT Licensed
 */ import { Negotiator, lookup } from "./deps.ts";
/**
 * Create a new Accepts object for the given headers.
 *
 * @param {Headers} headers
 * @public
 */ export class Accepts {
    headers;
    negotiator;
    constructor(headers){
        this.headers = headers;
        this.negotiator = new Negotiator(headers);
    }
    /**
   * Check if the given `type(s)` is acceptable, returning
   * the best match when true, otherwise `undefined`, in which
   * case you should respond with 406 "Not Acceptable".
   *
   * The `type` value may be a single mime type string
   * such as "application/json", the extension name
   * such as "json" or an array `["json", "html", "text/plain"]`. When a list
   * or array is given the _best_ match, if any is returned.
   *
   * Examples:
   *
   *     // Accept: text/html
   *     this.types(['html']);
   *     // => ["html"]
   *
   *     // Accept: text/*, application/json
   *     this.types(['html']);
   *     // => ["html"]
   *     this.types(['text/html']);
   *     // => ["text/html"]
   *     this.types(['json', 'text']);
   *     // => ["json"]
   *     this.types(['application/json']);
   *     // => ["application/json"]
   *
   *     // Accept: text/*, application/json
   *     this.types(['image/png']);
   *     this.types(['png']);
   *     // => []
   *
   *     // Accept: text/*;q=.5, application/json
   *     this.types(['html', 'json']);
   *     // => ["json"]
   *
   * @param {Array} types...
   * @return {Array|String|False}
   * @public
   */ types(types) {
        // no types, return all requested types
        if (!types || types.length === 0) {
            return this.negotiator.mediaTypes();
        }
        // no accept header, return first given type
        if (!this.headers.get("accept")) {
            return types[0];
        }
        const mimes = types.map(extToMime);
        const accepts = this.negotiator.mediaTypes(mimes.filter((t)=>t && validMime(t)
        ));
        const first = accepts[0];
        return first ? types[mimes.indexOf(first)] : false;
    }
    /**
   * Return accepted encodings or best fit based on `encodings`.
   *
   * Given `Accept-Encoding: gzip, deflate`
   * an array sorted by quality is returned:
   *
   *     ['gzip', 'deflate']
   *
   * @param {Array} encodings...
   * @return {Array|String|False}
   * @public
   */ encodings(encodings) {
        // no encodings, return all requested encodings
        if (!encodings || encodings.length === 0) {
            return this.negotiator.encodings();
        }
        return this.negotiator.encodings(encodings)[0] || false;
    }
    /**
   * Return accepted charsets or best fit based on `charsets`.
   *
   * Given `Accept-Charset: utf-8, iso-8859-1;q=0.2, utf-7;q=0.5`
   * an array sorted by quality is returned:
   *
   *     ['utf-8', 'utf-7', 'iso-8859-1']
   *
   * @param {Array} charsets...
   * @return {Array|String|False}
   * @public
   */ charsets(charsets) {
        // no charsets, return all requested charsets
        if (!charsets || charsets.length === 0) {
            return this.negotiator.charsets();
        }
        return this.negotiator.charsets(charsets)[0] || false;
    }
    /**
   * Return accepted languages or best fit based on `langs`.
   *
   * Given `Accept-Language: en;q=0.8, es, pt`
   * an array sorted by quality is returned:
   *
   *     ['es', 'pt', 'en']
   *
   * @param {Array} langs...
   * @return {Array|String|False}
   * @public
   */ languages(languages) {
        // no languages, return all requested languages
        if (!languages || languages.length === 0) {
            return this.negotiator.languages();
        }
        return this.negotiator.languages(languages)[0] || false;
    }
}
/**
 * Convert extnames to mime.
 *
 * @param {String} type
 * @return {String|undefined}
 * @private
 */ function extToMime(type) {
    return type.indexOf("/") === -1 ? lookup(type) : type;
}
/**
 * Check if mime is valid.
 *
 * @param {String} type
 * @return {String}
 * @private
 */ function validMime(type) {
    return typeof type === "string";
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2FjY2VwdHNAMi4xLjAvbW9kLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIEJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9qc2h0dHAvYWNjZXB0cy9ibG9iL21hc3Rlci9pbmRleC5qc1xuICogQ29weXJpZ2h0KGMpIDIwMTQgSm9uYXRoYW4gT25nXG4gKiBDb3B5cmlnaHQoYykgMjAxNSBEb3VnbGFzIENocmlzdG9waGVyIFdpbHNvblxuICogQ29weXJpZ2h0KGMpIDIwMjAgSGVucnkgWmh1YW5nXG4gKiBNSVQgTGljZW5zZWRcbiAqL1xuXG5pbXBvcnQgeyBOZWdvdGlhdG9yLCBsb29rdXAgfSBmcm9tIFwiLi9kZXBzLnRzXCI7XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IEFjY2VwdHMgb2JqZWN0IGZvciB0aGUgZ2l2ZW4gaGVhZGVycy5cbiAqXG4gKiBAcGFyYW0ge0hlYWRlcnN9IGhlYWRlcnNcbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGNsYXNzIEFjY2VwdHMge1xuICBwcml2YXRlIGhlYWRlcnM6IEhlYWRlcnM7XG4gIHByaXZhdGUgbmVnb3RpYXRvcjogTmVnb3RpYXRvcjtcblxuICBjb25zdHJ1Y3RvcihoZWFkZXJzOiBIZWFkZXJzKSB7XG4gICAgdGhpcy5oZWFkZXJzID0gaGVhZGVycztcbiAgICB0aGlzLm5lZ290aWF0b3IgPSBuZXcgTmVnb3RpYXRvcihoZWFkZXJzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGUgZ2l2ZW4gYHR5cGUocylgIGlzIGFjY2VwdGFibGUsIHJldHVybmluZ1xuICAgKiB0aGUgYmVzdCBtYXRjaCB3aGVuIHRydWUsIG90aGVyd2lzZSBgdW5kZWZpbmVkYCwgaW4gd2hpY2hcbiAgICogY2FzZSB5b3Ugc2hvdWxkIHJlc3BvbmQgd2l0aCA0MDYgXCJOb3QgQWNjZXB0YWJsZVwiLlxuICAgKlxuICAgKiBUaGUgYHR5cGVgIHZhbHVlIG1heSBiZSBhIHNpbmdsZSBtaW1lIHR5cGUgc3RyaW5nXG4gICAqIHN1Y2ggYXMgXCJhcHBsaWNhdGlvbi9qc29uXCIsIHRoZSBleHRlbnNpb24gbmFtZVxuICAgKiBzdWNoIGFzIFwianNvblwiIG9yIGFuIGFycmF5IGBbXCJqc29uXCIsIFwiaHRtbFwiLCBcInRleHQvcGxhaW5cIl1gLiBXaGVuIGEgbGlzdFxuICAgKiBvciBhcnJheSBpcyBnaXZlbiB0aGUgX2Jlc3RfIG1hdGNoLCBpZiBhbnkgaXMgcmV0dXJuZWQuXG4gICAqXG4gICAqIEV4YW1wbGVzOlxuICAgKlxuICAgKiAgICAgLy8gQWNjZXB0OiB0ZXh0L2h0bWxcbiAgICogICAgIHRoaXMudHlwZXMoWydodG1sJ10pO1xuICAgKiAgICAgLy8gPT4gW1wiaHRtbFwiXVxuICAgKlxuICAgKiAgICAgLy8gQWNjZXB0OiB0ZXh0LyosIGFwcGxpY2F0aW9uL2pzb25cbiAgICogICAgIHRoaXMudHlwZXMoWydodG1sJ10pO1xuICAgKiAgICAgLy8gPT4gW1wiaHRtbFwiXVxuICAgKiAgICAgdGhpcy50eXBlcyhbJ3RleHQvaHRtbCddKTtcbiAgICogICAgIC8vID0+IFtcInRleHQvaHRtbFwiXVxuICAgKiAgICAgdGhpcy50eXBlcyhbJ2pzb24nLCAndGV4dCddKTtcbiAgICogICAgIC8vID0+IFtcImpzb25cIl1cbiAgICogICAgIHRoaXMudHlwZXMoWydhcHBsaWNhdGlvbi9qc29uJ10pO1xuICAgKiAgICAgLy8gPT4gW1wiYXBwbGljYXRpb24vanNvblwiXVxuICAgKlxuICAgKiAgICAgLy8gQWNjZXB0OiB0ZXh0LyosIGFwcGxpY2F0aW9uL2pzb25cbiAgICogICAgIHRoaXMudHlwZXMoWydpbWFnZS9wbmcnXSk7XG4gICAqICAgICB0aGlzLnR5cGVzKFsncG5nJ10pO1xuICAgKiAgICAgLy8gPT4gW11cbiAgICpcbiAgICogICAgIC8vIEFjY2VwdDogdGV4dC8qO3E9LjUsIGFwcGxpY2F0aW9uL2pzb25cbiAgICogICAgIHRoaXMudHlwZXMoWydodG1sJywgJ2pzb24nXSk7XG4gICAqICAgICAvLyA9PiBbXCJqc29uXCJdXG4gICAqXG4gICAqIEBwYXJhbSB7QXJyYXl9IHR5cGVzLi4uXG4gICAqIEByZXR1cm4ge0FycmF5fFN0cmluZ3xGYWxzZX1cbiAgICogQHB1YmxpY1xuICAgKi9cbiAgdHlwZXModHlwZXM/OiBzdHJpbmdbXSk6IHN0cmluZ1tdIHwgc3RyaW5nIHwgZmFsc2Uge1xuICAgIC8vIG5vIHR5cGVzLCByZXR1cm4gYWxsIHJlcXVlc3RlZCB0eXBlc1xuICAgIGlmICghdHlwZXMgfHwgdHlwZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5uZWdvdGlhdG9yLm1lZGlhVHlwZXMoKTtcbiAgICB9XG5cbiAgICAvLyBubyBhY2NlcHQgaGVhZGVyLCByZXR1cm4gZmlyc3QgZ2l2ZW4gdHlwZVxuICAgIGlmICghdGhpcy5oZWFkZXJzLmdldChcImFjY2VwdFwiKSkge1xuICAgICAgcmV0dXJuIHR5cGVzWzBdO1xuICAgIH1cblxuICAgIGNvbnN0IG1pbWVzID0gdHlwZXNcbiAgICAgIC5tYXAoZXh0VG9NaW1lKTtcbiAgICBjb25zdCBhY2NlcHRzID0gdGhpcy5uZWdvdGlhdG9yLm1lZGlhVHlwZXMoXG4gICAgICAobWltZXMuZmlsdGVyKCh0KSA9PiB0ICYmIHZhbGlkTWltZSh0KSkpIGFzIHN0cmluZ1tdLFxuICAgICk7XG4gICAgY29uc3QgZmlyc3QgPSBhY2NlcHRzWzBdO1xuICAgIHJldHVybiBmaXJzdCA/IHR5cGVzW21pbWVzLmluZGV4T2YoZmlyc3QpXSA6IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiBhY2NlcHRlZCBlbmNvZGluZ3Mgb3IgYmVzdCBmaXQgYmFzZWQgb24gYGVuY29kaW5nc2AuXG4gICAqXG4gICAqIEdpdmVuIGBBY2NlcHQtRW5jb2Rpbmc6IGd6aXAsIGRlZmxhdGVgXG4gICAqIGFuIGFycmF5IHNvcnRlZCBieSBxdWFsaXR5IGlzIHJldHVybmVkOlxuICAgKlxuICAgKiAgICAgWydnemlwJywgJ2RlZmxhdGUnXVxuICAgKlxuICAgKiBAcGFyYW0ge0FycmF5fSBlbmNvZGluZ3MuLi5cbiAgICogQHJldHVybiB7QXJyYXl8U3RyaW5nfEZhbHNlfVxuICAgKiBAcHVibGljXG4gICAqL1xuICBlbmNvZGluZ3MoZW5jb2RpbmdzPzogc3RyaW5nW10pOiBzdHJpbmdbXSB8IHN0cmluZyB8IGZhbHNlIHtcbiAgICAvLyBubyBlbmNvZGluZ3MsIHJldHVybiBhbGwgcmVxdWVzdGVkIGVuY29kaW5nc1xuICAgIGlmICghZW5jb2RpbmdzIHx8IGVuY29kaW5ncy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB0aGlzLm5lZ290aWF0b3IuZW5jb2RpbmdzKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm5lZ290aWF0b3IuZW5jb2RpbmdzKGVuY29kaW5ncylbMF0gfHwgZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIGFjY2VwdGVkIGNoYXJzZXRzIG9yIGJlc3QgZml0IGJhc2VkIG9uIGBjaGFyc2V0c2AuXG4gICAqXG4gICAqIEdpdmVuIGBBY2NlcHQtQ2hhcnNldDogdXRmLTgsIGlzby04ODU5LTE7cT0wLjIsIHV0Zi03O3E9MC41YFxuICAgKiBhbiBhcnJheSBzb3J0ZWQgYnkgcXVhbGl0eSBpcyByZXR1cm5lZDpcbiAgICpcbiAgICogICAgIFsndXRmLTgnLCAndXRmLTcnLCAnaXNvLTg4NTktMSddXG4gICAqXG4gICAqIEBwYXJhbSB7QXJyYXl9IGNoYXJzZXRzLi4uXG4gICAqIEByZXR1cm4ge0FycmF5fFN0cmluZ3xGYWxzZX1cbiAgICogQHB1YmxpY1xuICAgKi9cbiAgY2hhcnNldHMoY2hhcnNldHM/OiBzdHJpbmdbXSk6IHN0cmluZ1tdIHwgc3RyaW5nIHwgZmFsc2Uge1xuICAgIC8vIG5vIGNoYXJzZXRzLCByZXR1cm4gYWxsIHJlcXVlc3RlZCBjaGFyc2V0c1xuICAgIGlmICghY2hhcnNldHMgfHwgY2hhcnNldHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5uZWdvdGlhdG9yLmNoYXJzZXRzKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm5lZ290aWF0b3IuY2hhcnNldHMoY2hhcnNldHMpWzBdIHx8IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiBhY2NlcHRlZCBsYW5ndWFnZXMgb3IgYmVzdCBmaXQgYmFzZWQgb24gYGxhbmdzYC5cbiAgICpcbiAgICogR2l2ZW4gYEFjY2VwdC1MYW5ndWFnZTogZW47cT0wLjgsIGVzLCBwdGBcbiAgICogYW4gYXJyYXkgc29ydGVkIGJ5IHF1YWxpdHkgaXMgcmV0dXJuZWQ6XG4gICAqXG4gICAqICAgICBbJ2VzJywgJ3B0JywgJ2VuJ11cbiAgICpcbiAgICogQHBhcmFtIHtBcnJheX0gbGFuZ3MuLi5cbiAgICogQHJldHVybiB7QXJyYXl8U3RyaW5nfEZhbHNlfVxuICAgKiBAcHVibGljXG4gICAqL1xuICBsYW5ndWFnZXMobGFuZ3VhZ2VzPzogc3RyaW5nW10pOiBzdHJpbmdbXSB8IHN0cmluZyB8IGZhbHNlIHtcbiAgICAvLyBubyBsYW5ndWFnZXMsIHJldHVybiBhbGwgcmVxdWVzdGVkIGxhbmd1YWdlc1xuICAgIGlmICghbGFuZ3VhZ2VzIHx8IGxhbmd1YWdlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB0aGlzLm5lZ290aWF0b3IubGFuZ3VhZ2VzKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMubmVnb3RpYXRvci5sYW5ndWFnZXMobGFuZ3VhZ2VzKVswXSB8fCBmYWxzZTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnZlcnQgZXh0bmFtZXMgdG8gbWltZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICogQHJldHVybiB7U3RyaW5nfHVuZGVmaW5lZH1cbiAqIEBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZXh0VG9NaW1lKHR5cGU6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiB0eXBlLmluZGV4T2YoXCIvXCIpID09PSAtMSA/IGxvb2t1cCh0eXBlKSA6IHR5cGU7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgbWltZSBpcyB2YWxpZC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICogQHJldHVybiB7U3RyaW5nfVxuICogQHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiB2YWxpZE1pbWUodHlwZT86IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gdHlwZW9mIHR5cGUgPT09IFwic3RyaW5nXCI7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFNRyxBQU5IOzs7Ozs7Q0FNRyxBQU5ILEVBTUcsVUFFTSxVQUFVLEVBQUUsTUFBTSxTQUFRLFNBQVc7QUFFOUMsRUFLRyxBQUxIOzs7OztDQUtHLEFBTEgsRUFLRyxjQUNVLE9BQU87SUFDVixPQUFPO0lBQ1AsVUFBVTtnQkFFTixPQUFnQjthQUNyQixPQUFPLEdBQUcsT0FBTzthQUNqQixVQUFVLE9BQU8sVUFBVSxDQUFDLE9BQU87O0lBRzFDLEVBc0NHLEFBdENIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXNDRyxBQXRDSCxFQXNDRyxDQUNILEtBQUssQ0FBQyxLQUFnQjtRQUNwQixFQUF1QyxBQUF2QyxxQ0FBdUM7YUFDbEMsS0FBSyxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQzt3QkFDbEIsVUFBVSxDQUFDLFVBQVU7O1FBR25DLEVBQTRDLEFBQTVDLDBDQUE0QztrQkFDbEMsT0FBTyxDQUFDLEdBQUcsRUFBQyxNQUFRO21CQUNyQixLQUFLLENBQUMsQ0FBQzs7Y0FHVixLQUFLLEdBQUcsS0FBSyxDQUNoQixHQUFHLENBQUMsU0FBUztjQUNWLE9BQU8sUUFBUSxVQUFVLENBQUMsVUFBVSxDQUN2QyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBSyxDQUFDLElBQUksU0FBUyxDQUFDLENBQUM7O2NBRWpDLEtBQUssR0FBRyxPQUFPLENBQUMsQ0FBQztlQUNoQixLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxLQUFLLEtBQUs7O0lBR3BELEVBV0csQUFYSDs7Ozs7Ozs7Ozs7R0FXRyxBQVhILEVBV0csQ0FDSCxTQUFTLENBQUMsU0FBb0I7UUFDNUIsRUFBK0MsQUFBL0MsNkNBQStDO2FBQzFDLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUM7d0JBQzFCLFVBQVUsQ0FBQyxTQUFTOztvQkFFdEIsVUFBVSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxLQUFLLEtBQUs7O0lBR3pELEVBV0csQUFYSDs7Ozs7Ozs7Ozs7R0FXRyxBQVhILEVBV0csQ0FDSCxRQUFRLENBQUMsUUFBbUI7UUFDMUIsRUFBNkMsQUFBN0MsMkNBQTZDO2FBQ3hDLFFBQVEsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUM7d0JBQ3hCLFVBQVUsQ0FBQyxRQUFROztvQkFFckIsVUFBVSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxLQUFLLEtBQUs7O0lBR3ZELEVBV0csQUFYSDs7Ozs7Ozs7Ozs7R0FXRyxBQVhILEVBV0csQ0FDSCxTQUFTLENBQUMsU0FBb0I7UUFDNUIsRUFBK0MsQUFBL0MsNkNBQStDO2FBQzFDLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUM7d0JBQzFCLFVBQVUsQ0FBQyxTQUFTOztvQkFHdEIsVUFBVSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxLQUFLLEtBQUs7OztBQUkzRCxFQU1HLEFBTkg7Ozs7OztDQU1HLEFBTkgsRUFNRyxVQUVNLFNBQVMsQ0FBQyxJQUFZO1dBQ3RCLElBQUksQ0FBQyxPQUFPLEVBQUMsQ0FBRyxRQUFPLENBQUMsR0FBRyxNQUFNLENBQUMsSUFBSSxJQUFJLElBQUk7O0FBR3ZELEVBTUcsQUFOSDs7Ozs7O0NBTUcsQUFOSCxFQU1HLFVBRU0sU0FBUyxDQUFDLElBQWE7a0JBQ2hCLElBQUksTUFBSyxNQUFRIn0=