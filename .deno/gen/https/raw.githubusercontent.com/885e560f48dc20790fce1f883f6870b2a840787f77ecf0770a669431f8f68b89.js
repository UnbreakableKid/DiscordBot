export function iconHashToBigInt(hash) {
    let animated = false;
    if (hash.startsWith("a_")) {
        animated = true;
        hash = hash.substring(2);
    }
    return {
        animated,
        bigint: BigInt(`0x${hash}`)
    };
}
export function iconBigintToHash(icon, animated = true) {
    const hash = icon.toString(16);
    return `${animated ? "a_" : ""}${hash}`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3V0aWwvaGFzaC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGZ1bmN0aW9uIGljb25IYXNoVG9CaWdJbnQoaGFzaDogc3RyaW5nKSB7XG4gIGxldCBhbmltYXRlZCA9IGZhbHNlO1xuXG4gIGlmIChoYXNoLnN0YXJ0c1dpdGgoXCJhX1wiKSkge1xuICAgIGFuaW1hdGVkID0gdHJ1ZTtcbiAgICBoYXNoID0gaGFzaC5zdWJzdHJpbmcoMik7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFuaW1hdGVkLFxuICAgIGJpZ2ludDogQmlnSW50KGAweCR7aGFzaH1gKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGljb25CaWdpbnRUb0hhc2goaWNvbjogYmlnaW50LCBhbmltYXRlZCA9IHRydWUpIHtcbiAgY29uc3QgaGFzaCA9IGljb24udG9TdHJpbmcoMTYpO1xuICByZXR1cm4gYCR7YW5pbWF0ZWQgPyBcImFfXCIgOiBcIlwifSR7aGFzaH1gO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJnQkFBZ0IsZ0JBQWdCLENBQUMsSUFBWTtRQUN2QyxRQUFRLEdBQUcsS0FBSztRQUVoQixJQUFJLENBQUMsVUFBVSxFQUFDLEVBQUk7UUFDdEIsUUFBUSxHQUFHLElBQUk7UUFDZixJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDOzs7UUFJdkIsUUFBUTtRQUNSLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLElBQUk7OztnQkFJWixnQkFBZ0IsQ0FBQyxJQUFZLEVBQUUsUUFBUSxHQUFHLElBQUk7VUFDdEQsSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtjQUNuQixRQUFRLElBQUcsRUFBSSxTQUFRLElBQUkifQ==