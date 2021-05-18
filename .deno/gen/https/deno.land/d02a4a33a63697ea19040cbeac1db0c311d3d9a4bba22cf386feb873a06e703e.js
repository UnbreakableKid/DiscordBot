/**
 * Get all addresses in the request, using the `X-Forwarded-For` header.
 *
 * @param {object} req
 * @return {array}
 * @public
 */ export function forwarded(req) {
    if (!req) {
        throw new TypeError("argument req is required");
    }
    // simple header parsing
    const proxyAddrs = parse(req.headers.get("x-forwarded-for") ?? "");
    const { hostname: socketAddr  } = req.conn.remoteAddr;
    const addrs = [
        socketAddr
    ].concat(proxyAddrs);
    // return all addresses
    return addrs;
}
/**
 * Parse the X-Forwarded-For header.
 *
 * @param {string} header
 * @private
 */ function parse(header) {
    const list = [];
    let start = header.length;
    let end = header.length;
    // gather addresses, backwards
    for(let i = header.length - 1; i >= 0; i--){
        switch(header.charCodeAt(i)){
            case 32:
                /*   */ if (start === end) {
                    start = end = i;
                }
                break;
            case 44:
                /* , */ if (start !== end) {
                    list.push(header.substring(start, end));
                }
                start = end = i;
                break;
            default:
                start = i;
                break;
        }
    }
    // final address
    if (start !== end) {
        list.push(header.substring(start, end));
    }
    return list;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy91dGlscy9mb3J3YXJkZWQudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUG9ydCBvZiBmb3J3YXJkZWQgKGh0dHBzOi8vZ2l0aHViLmNvbS9qc2h0dHAvZm9yd2FyZGVkL3RyZWUvdjAuMS4yKSBmb3IgRGVuby5cbiAqIFxuICogTGljZW5zZWQgYXMgZm9sbG93czpcbiAqIFxuICogVGhlIE1JVCBMaWNlbnNlXG4gKiBcbiAqIENvcHlyaWdodCAoYykgMjAxNC0yMDE3IERvdWdsYXMgQ2hyaXN0b3BoZXIgV2lsc29uXG4gKiBcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZ1xuICogYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4gKiAnU29mdHdhcmUnKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4gKiB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4gKiBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbiAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0b1xuICogdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICogXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxuICogaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKiBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICogRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4gKiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuXG4gKiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWVxuICogQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCxcbiAqIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFXG4gKiBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqIFxuICovXG5cbmltcG9ydCB0eXBlIHsgU2VydmVyUmVxdWVzdCB9IGZyb20gXCIuLi8uLi9kZXBzLnRzXCI7XG5cbi8qKlxuICogR2V0IGFsbCBhZGRyZXNzZXMgaW4gdGhlIHJlcXVlc3QsIHVzaW5nIHRoZSBgWC1Gb3J3YXJkZWQtRm9yYCBoZWFkZXIuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IHJlcVxuICogQHJldHVybiB7YXJyYXl9XG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3J3YXJkZWQocmVxOiBTZXJ2ZXJSZXF1ZXN0KSB7XG4gIGlmICghcmVxKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImFyZ3VtZW50IHJlcSBpcyByZXF1aXJlZFwiKTtcbiAgfVxuXG4gIC8vIHNpbXBsZSBoZWFkZXIgcGFyc2luZ1xuICBjb25zdCBwcm94eUFkZHJzID0gcGFyc2UocmVxLmhlYWRlcnMuZ2V0KFwieC1mb3J3YXJkZWQtZm9yXCIpID8/IFwiXCIpO1xuICBjb25zdCB7IGhvc3RuYW1lOiBzb2NrZXRBZGRyIH0gPSByZXEuY29ubi5yZW1vdGVBZGRyIGFzIERlbm8uTmV0QWRkcjtcbiAgY29uc3QgYWRkcnMgPSBbc29ja2V0QWRkcl0uY29uY2F0KHByb3h5QWRkcnMpO1xuXG4gIC8vIHJldHVybiBhbGwgYWRkcmVzc2VzXG4gIHJldHVybiBhZGRycztcbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgWC1Gb3J3YXJkZWQtRm9yIGhlYWRlci5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaGVhZGVyXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBwYXJzZShoZWFkZXI6IHN0cmluZykge1xuICBjb25zdCBsaXN0ID0gW107XG4gIGxldCBzdGFydCA9IGhlYWRlci5sZW5ndGg7XG4gIGxldCBlbmQgPSBoZWFkZXIubGVuZ3RoO1xuXG4gIC8vIGdhdGhlciBhZGRyZXNzZXMsIGJhY2t3YXJkc1xuICBmb3IgKGxldCBpID0gaGVhZGVyLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgc3dpdGNoIChoZWFkZXIuY2hhckNvZGVBdChpKSkge1xuICAgICAgY2FzZSAweDIwOi8qICAgKi9cbiAgICAgICAgaWYgKHN0YXJ0ID09PSBlbmQpIHtcbiAgICAgICAgICBzdGFydCA9IGVuZCA9IGk7XG4gICAgICAgIH1cblxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMHgyYzovKiAsICovXG4gICAgICAgIGlmIChzdGFydCAhPT0gZW5kKSB7XG4gICAgICAgICAgbGlzdC5wdXNoKGhlYWRlci5zdWJzdHJpbmcoc3RhcnQsIGVuZCkpO1xuICAgICAgICB9XG4gICAgICAgIHN0YXJ0ID0gZW5kID0gaTtcblxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHN0YXJ0ID0gaTtcblxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvLyBmaW5hbCBhZGRyZXNzXG4gIGlmIChzdGFydCAhPT0gZW5kKSB7XG4gICAgbGlzdC5wdXNoKGhlYWRlci5zdWJzdHJpbmcoc3RhcnQsIGVuZCkpO1xuICB9XG5cbiAgcmV0dXJuIGxpc3Q7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBZ0NBLEVBTUcsQUFOSDs7Ozs7O0NBTUcsQUFOSCxFQU1HLGlCQUNhLFNBQVMsQ0FBQyxHQUFrQjtTQUNyQyxHQUFHO2tCQUNJLFNBQVMsRUFBQyx3QkFBMEI7O0lBR2hELEVBQXdCLEFBQXhCLHNCQUF3QjtVQUNsQixVQUFVLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFDLGVBQWlCO1lBQ2xELFFBQVEsRUFBRSxVQUFVLE1BQUssR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVO1VBQzlDLEtBQUs7UUFBSSxVQUFVO01BQUUsTUFBTSxDQUFDLFVBQVU7SUFFNUMsRUFBdUIsQUFBdkIscUJBQXVCO1dBQ2hCLEtBQUs7O0FBR2QsRUFLRyxBQUxIOzs7OztDQUtHLEFBTEgsRUFLRyxVQUNNLEtBQUssQ0FBQyxNQUFjO1VBQ3JCLElBQUk7UUFDTixLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU07UUFDckIsR0FBRyxHQUFHLE1BQU0sQ0FBQyxNQUFNO0lBRXZCLEVBQThCLEFBQTlCLDRCQUE4QjtZQUNyQixDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2VBQy9CLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztpQkFDcEIsRUFBSTtnQkFBQyxFQUFPLEFBQVAsR0FBTyxBQUFQLEVBQU8sS0FDWCxLQUFLLEtBQUssR0FBRztvQkFDZixLQUFLLEdBQUcsR0FBRyxHQUFHLENBQUM7OztpQkFJZCxFQUFJO2dCQUFDLEVBQU8sQUFBUCxHQUFPLEFBQVAsRUFBTyxLQUNYLEtBQUssS0FBSyxHQUFHO29CQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsR0FBRzs7Z0JBRXZDLEtBQUssR0FBRyxHQUFHLEdBQUcsQ0FBQzs7O2dCQUlmLEtBQUssR0FBRyxDQUFDOzs7O0lBTWYsRUFBZ0IsQUFBaEIsY0FBZ0I7UUFDWixLQUFLLEtBQUssR0FBRztRQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsR0FBRzs7V0FHaEMsSUFBSSJ9