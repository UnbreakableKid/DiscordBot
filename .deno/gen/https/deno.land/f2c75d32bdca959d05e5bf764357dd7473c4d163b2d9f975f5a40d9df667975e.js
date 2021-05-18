/**
 * Port of proxy-addr (https://github.com/pillarjs/proxy-addr/tree/v2.0.6) for Deno.
 * 
 * Licensed as follows:
 * 
 * The MIT License
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
 */ import { ipaddr } from "../../deps.ts";
import { forwarded } from "./forwarded.ts";
const DIGIT_REGEXP = /^[0-9]+$/;
const isip = ipaddr.isValid;
const parseip = ipaddr.parse;
/**
 * Pre-defined IP ranges.
 * @private
 */ const IP_RANGES = {
    linklocal: [
        "169.254.0.0/16",
        "fe80::/10"
    ],
    loopback: [
        "127.0.0.1/8",
        "::1/128"
    ],
    uniquelocal: [
        "10.0.0.0/8",
        "172.16.0.0/12",
        "192.168.0.0/16",
        "fc00::/7"
    ]
};
/**
 * Get all addresses in the request, optionally stopping
 * at the first untrusted.
 *
 * @param {Object} request
 * @param {Function|Array|String} [trust]
 * @public
 */ export function all(req, trust) {
    // get addresses
    const addrs = forwarded(req);
    if (!trust) {
        // Return all addresses
        return addrs;
    }
    if (typeof trust !== "function") {
        trust = compile(trust);
    }
    for(var i = 0; i < addrs.length - 1; i++){
        if (trust(addrs[i], i)) continue;
        addrs.length = i + 1;
    }
    return addrs;
}
/**
 * Compile argument into trust function.
 *
 * @param {Array|String} value
 * @private
 */ export function compile(value) {
    if (!value) {
        throw new TypeError("argument is required");
    }
    let trust;
    if (typeof value === "string") {
        trust = [
            value
        ];
    } else if (Array.isArray(value)) {
        trust = value.slice();
    } else {
        throw new TypeError("unsupported trust argument");
    }
    for(var i = 0; i < trust.length; i++){
        value = trust[i];
        if (!Object.prototype.hasOwnProperty.call(IP_RANGES, value)) {
            continue;
        }
        // Splice in pre-defined range
        value = IP_RANGES[value];
        trust.splice.apply(trust, [
            i,
            1,
            ...value
        ]);
        i += value.length - 1;
    }
    return compileTrust(compileRangeSubnets(trust));
}
/**
 * Compile `arr` elements into range subnets.
 *
 * @param {Array} arr
 * @private
 */ function compileRangeSubnets(arr) {
    const rangeSubnets = new Array(arr.length);
    for(let i = 0; i < arr.length; i++){
        rangeSubnets[i] = parseipNotation(arr[i]);
    }
    return rangeSubnets;
}
/**
 * Compile range subnet array into trust function.
 *
 * @param {Array} rangeSubnets
 * @private
 */ function compileTrust(rangeSubnets) {
    // Return optimized function based on length
    const len = rangeSubnets.length;
    return len === 0 ? trustNone : len === 1 ? trustSingle(rangeSubnets[0]) : trustMulti(rangeSubnets);
}
/**
 * Parse IP notation string into range subnet.
 *
 * @param {String} note
 * @private
 */ function parseipNotation(note) {
    const pos = note.lastIndexOf("/");
    const str = pos !== -1 ? note.substring(0, pos) : note;
    if (!isip(str)) {
        throw new TypeError("invalid IP address: " + str);
    }
    let ip = parseip(str);
    if (pos === -1 && ip.kind() === "ipv6" && ip.isIPv4MappedAddress()) {
        // Store as IPv4
        ip = ip.toIPv4Address();
    }
    const max = ip.kind() === "ipv6" ? 128 : 32;
    let range = pos !== -1 ? note.substring(pos + 1, note.length) : null;
    if (range === null) {
        range = max;
    } else if (DIGIT_REGEXP.test(range)) {
        range = parseInt(range, 10);
    } else if (ip.kind() === "ipv4" && isip(range)) {
        range = parseNetmask(range);
    } else {
        range = null;
    }
    if (range <= 0 || range > max) {
        throw new TypeError("invalid range on address: " + note);
    }
    return [
        ip,
        range
    ];
}
/**
 * Parse netmask string into CIDR range.
 *
 * @param {String} netmask
 * @private
 */ function parseNetmask(netmask) {
    const ip = parseip(netmask);
    const kind = ip.kind();
    return kind === "ipv4" ? ip.prefixLengthFromSubnetMask() : null;
}
/**
 * Determine address of proxied request.
 *
 * @param {Object} request
 * @param {Function|Array|String} trust
 * @public
 */ export function proxyaddr(req, trust) {
    if (!req) {
        throw new TypeError("req argument is required");
    }
    if (!trust) {
        throw new TypeError("trust argument is required");
    }
    const addrs = all(req, trust);
    const addr = addrs[addrs.length - 1];
    return addr;
}
/**
 * Static trust function to trust nothing.
 *
 * @private
 */ function trustNone() {
    return false;
}
/**
 * Compile trust function for multiple subnets.
 *
 * @param {Array} subnets
 * @private
 */ function trustMulti(subnets) {
    return function trust(addr) {
        if (!isip(addr)) return false;
        const ip = parseip(addr);
        let ipconv;
        const kind = ip.kind();
        for(let i = 0; i < subnets.length; i++){
            const subnet = subnets[i];
            const subnetip = subnet[0];
            const subnetkind = subnetip.kind();
            const subnetrange = subnet[1];
            let trusted = ip;
            if (kind !== subnetkind) {
                if (subnetkind === "ipv4" && !ip.isIPv4MappedAddress()) {
                    continue;
                }
                if (!ipconv) {
                    // Convert IP to match subnet IP kind
                    ipconv = subnetkind === "ipv4" ? ip.toIPv4Address() : ip.toIPv4MappedAddress();
                }
                trusted = ipconv;
            }
            if (trusted.match(subnetip, subnetrange)) {
                return true;
            }
        }
        return false;
    };
}
/**
 * Compile trust function for single subnet.
 *
 * @param {Array} subnet
 * @private
 */ function trustSingle(subnet) {
    const subnetip = subnet[0];
    const subnetkind = subnetip.kind();
    const subnetisipv4 = subnetkind === "ipv4";
    const subnetrange = subnet[1];
    return function trust(addr) {
        if (!isip(addr)) return false;
        let ip = parseip(addr);
        const kind = ip.kind();
        if (kind !== subnetkind) {
            if (subnetisipv4 && !ip.isIPv4MappedAddress()) {
                // Incompatible IP addresses
                return false;
            }
            // Convert IP to match subnet IP kind
            ip = subnetisipv4 ? ip.toIPv4Address() : ip.toIPv4MappedAddress();
        }
        return ip.match(subnetip, subnetrange);
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy91dGlscy9wcm94eUFkZHIudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUG9ydCBvZiBwcm94eS1hZGRyIChodHRwczovL2dpdGh1Yi5jb20vcGlsbGFyanMvcHJveHktYWRkci90cmVlL3YyLjAuNikgZm9yIERlbm8uXG4gKiBcbiAqIExpY2Vuc2VkIGFzIGZvbGxvd3M6XG4gKiBcbiAqIFRoZSBNSVQgTGljZW5zZVxuICogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtMjAxNiBEb3VnbGFzIENocmlzdG9waGVyIFdpbHNvblxuICogXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmdcbiAqIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuICogJ1NvZnR3YXJlJyksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuICogd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuICogZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG9cbiAqIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqIFxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbiAqIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICogXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbiAqIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuICogTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULlxuICogSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTllcbiAqIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsXG4gKiBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRVxuICogU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKiBcbiAqL1xuXG5pbXBvcnQgeyBpcGFkZHIgfSBmcm9tIFwiLi4vLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgZm9yd2FyZGVkIH0gZnJvbSBcIi4vZm9yd2FyZGVkLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFNlcnZlclJlcXVlc3QgfSBmcm9tIFwiLi4vLi4vZGVwcy50c1wiO1xuXG5jb25zdCBESUdJVF9SRUdFWFAgPSAvXlswLTldKyQvO1xuY29uc3QgaXNpcCA9IGlwYWRkci5pc1ZhbGlkO1xuY29uc3QgcGFyc2VpcCA9IGlwYWRkci5wYXJzZTtcblxuLyoqXG4gKiBQcmUtZGVmaW5lZCBJUCByYW5nZXMuXG4gKiBAcHJpdmF0ZVxuICovXG5cbmNvbnN0IElQX1JBTkdFUzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmdbXSB9ID0ge1xuICBsaW5rbG9jYWw6IFtcIjE2OS4yNTQuMC4wLzE2XCIsIFwiZmU4MDo6LzEwXCJdLFxuICBsb29wYmFjazogW1wiMTI3LjAuMC4xLzhcIiwgXCI6OjEvMTI4XCJdLFxuICB1bmlxdWVsb2NhbDogW1wiMTAuMC4wLjAvOFwiLCBcIjE3Mi4xNi4wLjAvMTJcIiwgXCIxOTIuMTY4LjAuMC8xNlwiLCBcImZjMDA6Oi83XCJdLFxufTtcblxuLyoqXG4gKiBHZXQgYWxsIGFkZHJlc3NlcyBpbiB0aGUgcmVxdWVzdCwgb3B0aW9uYWxseSBzdG9wcGluZ1xuICogYXQgdGhlIGZpcnN0IHVudHJ1c3RlZC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcmVxdWVzdFxuICogQHBhcmFtIHtGdW5jdGlvbnxBcnJheXxTdHJpbmd9IFt0cnVzdF1cbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbChyZXE6IFNlcnZlclJlcXVlc3QsIHRydXN0OiBGdW5jdGlvbiB8IHN0cmluZ1tdIHwgc3RyaW5nKSB7XG4gIC8vIGdldCBhZGRyZXNzZXNcbiAgY29uc3QgYWRkcnMgPSBmb3J3YXJkZWQocmVxKTtcblxuICBpZiAoIXRydXN0KSB7XG4gICAgLy8gUmV0dXJuIGFsbCBhZGRyZXNzZXNcbiAgICByZXR1cm4gYWRkcnM7XG4gIH1cblxuICBpZiAodHlwZW9mIHRydXN0ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB0cnVzdCA9IGNvbXBpbGUodHJ1c3QpO1xuICB9XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhZGRycy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICBpZiAodHJ1c3QoYWRkcnNbaV0sIGkpKSBjb250aW51ZTtcblxuICAgIGFkZHJzLmxlbmd0aCA9IGkgKyAxO1xuICB9XG5cbiAgcmV0dXJuIGFkZHJzO1xufVxuXG4vKipcbiAqIENvbXBpbGUgYXJndW1lbnQgaW50byB0cnVzdCBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fFN0cmluZ30gdmFsdWVcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlKHZhbHVlOiBzdHJpbmdbXSB8IHN0cmluZykge1xuICBpZiAoIXZhbHVlKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImFyZ3VtZW50IGlzIHJlcXVpcmVkXCIpO1xuICB9XG5cbiAgbGV0IHRydXN0O1xuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICB0cnVzdCA9IFt2YWx1ZV07XG4gIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICB0cnVzdCA9IHZhbHVlLnNsaWNlKCk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInVuc3VwcG9ydGVkIHRydXN0IGFyZ3VtZW50XCIpO1xuICB9XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0cnVzdC5sZW5ndGg7IGkrKykge1xuICAgIHZhbHVlID0gdHJ1c3RbaV07XG5cbiAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChJUF9SQU5HRVMsIHZhbHVlKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gU3BsaWNlIGluIHByZS1kZWZpbmVkIHJhbmdlXG4gICAgdmFsdWUgPSBJUF9SQU5HRVNbdmFsdWVdO1xuICAgIHRydXN0LnNwbGljZS5hcHBseSh0cnVzdCwgW2ksIDEsIC4uLnZhbHVlXSk7XG4gICAgaSArPSB2YWx1ZS5sZW5ndGggLSAxO1xuICB9XG5cbiAgcmV0dXJuIGNvbXBpbGVUcnVzdChjb21waWxlUmFuZ2VTdWJuZXRzKHRydXN0KSk7XG59XG5cbi8qKlxuICogQ29tcGlsZSBgYXJyYCBlbGVtZW50cyBpbnRvIHJhbmdlIHN1Ym5ldHMuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gYXJyXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBjb21waWxlUmFuZ2VTdWJuZXRzKGFycjogc3RyaW5nW10pIHtcbiAgY29uc3QgcmFuZ2VTdWJuZXRzID0gbmV3IEFycmF5KGFyci5sZW5ndGgpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgcmFuZ2VTdWJuZXRzW2ldID0gcGFyc2VpcE5vdGF0aW9uKGFycltpXSk7XG4gIH1cblxuICByZXR1cm4gcmFuZ2VTdWJuZXRzO1xufVxuXG4vKipcbiAqIENvbXBpbGUgcmFuZ2Ugc3VibmV0IGFycmF5IGludG8gdHJ1c3QgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtBcnJheX0gcmFuZ2VTdWJuZXRzXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBjb21waWxlVHJ1c3QocmFuZ2VTdWJuZXRzOiBhbnlbXSkge1xuICAvLyBSZXR1cm4gb3B0aW1pemVkIGZ1bmN0aW9uIGJhc2VkIG9uIGxlbmd0aFxuICBjb25zdCBsZW4gPSByYW5nZVN1Ym5ldHMubGVuZ3RoO1xuXG4gIHJldHVybiBsZW4gPT09IDBcbiAgICA/IHRydXN0Tm9uZVxuICAgIDogbGVuID09PSAxXG4gICAgPyB0cnVzdFNpbmdsZShyYW5nZVN1Ym5ldHNbMF0pXG4gICAgOiB0cnVzdE11bHRpKHJhbmdlU3VibmV0cyk7XG59XG5cbi8qKlxuICogUGFyc2UgSVAgbm90YXRpb24gc3RyaW5nIGludG8gcmFuZ2Ugc3VibmV0LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBub3RlXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBwYXJzZWlwTm90YXRpb24obm90ZTogc3RyaW5nKSB7XG4gIGNvbnN0IHBvcyA9IG5vdGUubGFzdEluZGV4T2YoXCIvXCIpO1xuICBjb25zdCBzdHIgPSBwb3MgIT09IC0xID8gbm90ZS5zdWJzdHJpbmcoMCwgcG9zKSA6IG5vdGU7XG5cbiAgaWYgKCFpc2lwKHN0cikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiaW52YWxpZCBJUCBhZGRyZXNzOiBcIiArIHN0cik7XG4gIH1cblxuICBsZXQgaXAgPSBwYXJzZWlwKHN0cik7XG5cbiAgaWYgKHBvcyA9PT0gLTEgJiYgaXAua2luZCgpID09PSBcImlwdjZcIiAmJiBpcC5pc0lQdjRNYXBwZWRBZGRyZXNzKCkpIHtcbiAgICAvLyBTdG9yZSBhcyBJUHY0XG4gICAgaXAgPSBpcC50b0lQdjRBZGRyZXNzKCk7XG4gIH1cblxuICBjb25zdCBtYXggPSBpcC5raW5kKCkgPT09IFwiaXB2NlwiID8gMTI4IDogMzI7XG5cbiAgbGV0IHJhbmdlOiBzdHJpbmcgfCBudW1iZXIgfCBudWxsID0gcG9zICE9PSAtMVxuICAgID8gbm90ZS5zdWJzdHJpbmcocG9zICsgMSwgbm90ZS5sZW5ndGgpXG4gICAgOiBudWxsO1xuXG4gIGlmIChyYW5nZSA9PT0gbnVsbCkge1xuICAgIHJhbmdlID0gbWF4O1xuICB9IGVsc2UgaWYgKERJR0lUX1JFR0VYUC50ZXN0KHJhbmdlKSkge1xuICAgIHJhbmdlID0gcGFyc2VJbnQocmFuZ2UsIDEwKTtcbiAgfSBlbHNlIGlmIChpcC5raW5kKCkgPT09IFwiaXB2NFwiICYmIGlzaXAocmFuZ2UpKSB7XG4gICAgcmFuZ2UgPSBwYXJzZU5ldG1hc2socmFuZ2UpO1xuICB9IGVsc2Uge1xuICAgIHJhbmdlID0gbnVsbDtcbiAgfVxuXG4gIGlmICgocmFuZ2UgYXMgbnVtYmVyKSA8PSAwIHx8IChyYW5nZSBhcyBudW1iZXIpID4gbWF4KSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImludmFsaWQgcmFuZ2Ugb24gYWRkcmVzczogXCIgKyBub3RlKTtcbiAgfVxuXG4gIHJldHVybiBbaXAsIHJhbmdlXTtcbn1cblxuLyoqXG4gKiBQYXJzZSBuZXRtYXNrIHN0cmluZyBpbnRvIENJRFIgcmFuZ2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5ldG1hc2tcbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIHBhcnNlTmV0bWFzayhuZXRtYXNrOiBzdHJpbmcpIHtcbiAgY29uc3QgaXAgPSBwYXJzZWlwKG5ldG1hc2spO1xuICBjb25zdCBraW5kID0gaXAua2luZCgpO1xuXG4gIHJldHVybiBraW5kID09PSBcImlwdjRcIiA/IGlwLnByZWZpeExlbmd0aEZyb21TdWJuZXRNYXNrKCkgOiBudWxsO1xufVxuXG4vKipcbiAqIERldGVybWluZSBhZGRyZXNzIG9mIHByb3hpZWQgcmVxdWVzdC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcmVxdWVzdFxuICogQHBhcmFtIHtGdW5jdGlvbnxBcnJheXxTdHJpbmd9IHRydXN0XG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm94eWFkZHIoXG4gIHJlcTogU2VydmVyUmVxdWVzdCxcbiAgdHJ1c3Q6IEZ1bmN0aW9uIHwgc3RyaW5nW10gfCBzdHJpbmcsXG4pIHtcbiAgaWYgKCFyZXEpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwicmVxIGFyZ3VtZW50IGlzIHJlcXVpcmVkXCIpO1xuICB9XG5cbiAgaWYgKCF0cnVzdCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJ0cnVzdCBhcmd1bWVudCBpcyByZXF1aXJlZFwiKTtcbiAgfVxuXG4gIGNvbnN0IGFkZHJzID0gYWxsKHJlcSwgdHJ1c3QpO1xuICBjb25zdCBhZGRyID0gYWRkcnNbYWRkcnMubGVuZ3RoIC0gMV07XG5cbiAgcmV0dXJuIGFkZHI7XG59XG5cbi8qKlxuICogU3RhdGljIHRydXN0IGZ1bmN0aW9uIHRvIHRydXN0IG5vdGhpbmcuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gdHJ1c3ROb25lKCkge1xuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ29tcGlsZSB0cnVzdCBmdW5jdGlvbiBmb3IgbXVsdGlwbGUgc3VibmV0cy5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBzdWJuZXRzXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiB0cnVzdE11bHRpKHN1Ym5ldHM6IGFueVtdKSB7XG4gIHJldHVybiBmdW5jdGlvbiB0cnVzdChhZGRyOiBzdHJpbmcpIHtcbiAgICBpZiAoIWlzaXAoYWRkcikpIHJldHVybiBmYWxzZTtcblxuICAgIGNvbnN0IGlwID0gcGFyc2VpcChhZGRyKTtcbiAgICBsZXQgaXBjb252O1xuICAgIGNvbnN0IGtpbmQgPSBpcC5raW5kKCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN1Ym5ldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHN1Ym5ldCA9IHN1Ym5ldHNbaV07XG4gICAgICBjb25zdCBzdWJuZXRpcCA9IHN1Ym5ldFswXTtcbiAgICAgIGNvbnN0IHN1Ym5ldGtpbmQgPSBzdWJuZXRpcC5raW5kKCk7XG4gICAgICBjb25zdCBzdWJuZXRyYW5nZSA9IHN1Ym5ldFsxXTtcbiAgICAgIGxldCB0cnVzdGVkID0gaXA7XG5cbiAgICAgIGlmIChraW5kICE9PSBzdWJuZXRraW5kKSB7XG4gICAgICAgIGlmIChzdWJuZXRraW5kID09PSBcImlwdjRcIiAmJiAhaXAuaXNJUHY0TWFwcGVkQWRkcmVzcygpKSB7XG4gICAgICAgICAgLy8gSW5jb21wYXRpYmxlIElQIGFkZHJlc3Nlc1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFpcGNvbnYpIHtcbiAgICAgICAgICAvLyBDb252ZXJ0IElQIHRvIG1hdGNoIHN1Ym5ldCBJUCBraW5kXG4gICAgICAgICAgaXBjb252ID0gc3VibmV0a2luZCA9PT0gXCJpcHY0XCJcbiAgICAgICAgICAgID8gaXAudG9JUHY0QWRkcmVzcygpXG4gICAgICAgICAgICA6IGlwLnRvSVB2NE1hcHBlZEFkZHJlc3MoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRydXN0ZWQgPSBpcGNvbnY7XG4gICAgICB9XG5cbiAgICAgIGlmICh0cnVzdGVkLm1hdGNoKHN1Ym5ldGlwLCBzdWJuZXRyYW5nZSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xufVxuXG4vKipcbiAqIENvbXBpbGUgdHJ1c3QgZnVuY3Rpb24gZm9yIHNpbmdsZSBzdWJuZXQuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gc3VibmV0XG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiB0cnVzdFNpbmdsZShzdWJuZXQ6IGFueVtdKSB7XG4gIGNvbnN0IHN1Ym5ldGlwID0gc3VibmV0WzBdO1xuICBjb25zdCBzdWJuZXRraW5kID0gc3VibmV0aXAua2luZCgpO1xuICBjb25zdCBzdWJuZXRpc2lwdjQgPSBzdWJuZXRraW5kID09PSBcImlwdjRcIjtcbiAgY29uc3Qgc3VibmV0cmFuZ2UgPSBzdWJuZXRbMV07XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIHRydXN0KGFkZHI6IHN0cmluZykge1xuICAgIGlmICghaXNpcChhZGRyKSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgbGV0IGlwID0gcGFyc2VpcChhZGRyKTtcbiAgICBjb25zdCBraW5kID0gaXAua2luZCgpO1xuXG4gICAgaWYgKGtpbmQgIT09IHN1Ym5ldGtpbmQpIHtcbiAgICAgIGlmIChzdWJuZXRpc2lwdjQgJiYgIWlwLmlzSVB2NE1hcHBlZEFkZHJlc3MoKSkge1xuICAgICAgICAvLyBJbmNvbXBhdGlibGUgSVAgYWRkcmVzc2VzXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gQ29udmVydCBJUCB0byBtYXRjaCBzdWJuZXQgSVAga2luZFxuICAgICAgaXAgPSBzdWJuZXRpc2lwdjQgPyBpcC50b0lQdjRBZGRyZXNzKCkgOiBpcC50b0lQdjRNYXBwZWRBZGRyZXNzKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGlwLm1hdGNoKHN1Ym5ldGlwLCBzdWJuZXRyYW5nZSk7XG4gIH07XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUE0QkcsQUE1Qkg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E0QkcsQUE1QkgsRUE0QkcsVUFFTSxNQUFNLFNBQVEsYUFBZTtTQUM3QixTQUFTLFNBQVEsY0FBZ0I7TUFHcEMsWUFBWTtNQUNaLElBQUksR0FBRyxNQUFNLENBQUMsT0FBTztNQUNyQixPQUFPLEdBQUcsTUFBTSxDQUFDLEtBQUs7QUFFNUIsRUFHRyxBQUhIOzs7Q0FHRyxBQUhILEVBR0csT0FFRyxT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