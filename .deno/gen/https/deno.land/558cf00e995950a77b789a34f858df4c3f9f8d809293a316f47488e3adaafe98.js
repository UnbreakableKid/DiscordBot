import {
  CHAR_BACKWARD_SLASH,
  CHAR_DOT,
  CHAR_FORWARD_SLASH,
  CHAR_LOWERCASE_A,
  CHAR_LOWERCASE_Z,
  CHAR_UPPERCASE_A,
  CHAR_UPPERCASE_Z,
} from "./_constants.ts";
export function assertPath(path) {
  if (typeof path !== "string") {
    throw new TypeError(
      `Path must be a string. Received ${JSON.stringify(path)}`,
    );
  }
}
export function isPosixPathSeparator(code) {
  return code === CHAR_FORWARD_SLASH;
}
export function isPathSeparator(code) {
  return isPosixPathSeparator(code) || code === CHAR_BACKWARD_SLASH;
}
export function isWindowsDeviceRoot(code) {
  return code >= CHAR_LOWERCASE_A && code <= CHAR_LOWERCASE_Z ||
    code >= CHAR_UPPERCASE_A && code <= CHAR_UPPERCASE_Z;
}
// Resolves . and .. elements in a path with directory names
export function normalizeString(
  path,
  allowAboveRoot,
  separator,
  isPathSeparator,
) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let code;
  for (let i = 0, len = path.length; i <= len; ++i) {
    if (i < len) code = path.charCodeAt(i);
    else if (isPathSeparator(code)) break;
    else code = CHAR_FORWARD_SLASH;
    if (isPathSeparator(code)) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (
          res.length < 2 || lastSegmentLength !== 2 ||
          res.charCodeAt(res.length - 1) !== CHAR_DOT ||
          res.charCodeAt(res.length - 2) !== CHAR_DOT
        ) {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf(separator);
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
            }
            lastSlash = i;
            dots = 0;
            continue;
          } else if (res.length === 2 || res.length === 1) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0) res += `${separator}..`;
          else res = "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) res += separator + path.slice(lastSlash + 1, i);
        else res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === CHAR_DOT && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
export function _format(sep, pathObject) {
  const dir = pathObject.dir || pathObject.root;
  const base = pathObject.base ||
    (pathObject.name || "") + (pathObject.ext || "");
  if (!dir) return base;
  if (dir === pathObject.root) return dir + base;
  return dir + sep + base;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC42OS4wL3BhdGgvX3V0aWwudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCB0aGUgQnJvd3NlcmlmeSBhdXRob3JzLiBNSVQgTGljZW5zZS5cbi8vIFBvcnRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9icm93c2VyaWZ5L3BhdGgtYnJvd3NlcmlmeS9cbi8qKiBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuICovXG5cbmltcG9ydCB0eXBlIHsgRm9ybWF0SW5wdXRQYXRoT2JqZWN0IH0gZnJvbSBcIi4vX2ludGVyZmFjZS50c1wiO1xuaW1wb3J0IHtcbiAgQ0hBUl9VUFBFUkNBU0VfQSxcbiAgQ0hBUl9MT1dFUkNBU0VfQSxcbiAgQ0hBUl9VUFBFUkNBU0VfWixcbiAgQ0hBUl9MT1dFUkNBU0VfWixcbiAgQ0hBUl9ET1QsXG4gIENIQVJfRk9SV0FSRF9TTEFTSCxcbiAgQ0hBUl9CQUNLV0FSRF9TTEFTSCxcbn0gZnJvbSBcIi4vX2NvbnN0YW50cy50c1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0UGF0aChwYXRoOiBzdHJpbmcpOiB2b2lkIHtcbiAgaWYgKHR5cGVvZiBwYXRoICE9PSBcInN0cmluZ1wiKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgIGBQYXRoIG11c3QgYmUgYSBzdHJpbmcuIFJlY2VpdmVkICR7SlNPTi5zdHJpbmdpZnkocGF0aCl9YCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1Bvc2l4UGF0aFNlcGFyYXRvcihjb2RlOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIGNvZGUgPT09IENIQVJfRk9SV0FSRF9TTEFTSDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUGF0aFNlcGFyYXRvcihjb2RlOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzUG9zaXhQYXRoU2VwYXJhdG9yKGNvZGUpIHx8IGNvZGUgPT09IENIQVJfQkFDS1dBUkRfU0xBU0g7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1dpbmRvd3NEZXZpY2VSb290KGNvZGU6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIChjb2RlID49IENIQVJfTE9XRVJDQVNFX0EgJiYgY29kZSA8PSBDSEFSX0xPV0VSQ0FTRV9aKSB8fFxuICAgIChjb2RlID49IENIQVJfVVBQRVJDQVNFX0EgJiYgY29kZSA8PSBDSEFSX1VQUEVSQ0FTRV9aKVxuICApO1xufVxuXG4vLyBSZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggd2l0aCBkaXJlY3RvcnkgbmFtZXNcbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVTdHJpbmcoXG4gIHBhdGg6IHN0cmluZyxcbiAgYWxsb3dBYm92ZVJvb3Q6IGJvb2xlYW4sXG4gIHNlcGFyYXRvcjogc3RyaW5nLFxuICBpc1BhdGhTZXBhcmF0b3I6IChjb2RlOiBudW1iZXIpID0+IGJvb2xlYW4sXG4pOiBzdHJpbmcge1xuICBsZXQgcmVzID0gXCJcIjtcbiAgbGV0IGxhc3RTZWdtZW50TGVuZ3RoID0gMDtcbiAgbGV0IGxhc3RTbGFzaCA9IC0xO1xuICBsZXQgZG90cyA9IDA7XG4gIGxldCBjb2RlOiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gIGZvciAobGV0IGkgPSAwLCBsZW4gPSBwYXRoLmxlbmd0aDsgaSA8PSBsZW47ICsraSkge1xuICAgIGlmIChpIDwgbGVuKSBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KGkpO1xuICAgIGVsc2UgaWYgKGlzUGF0aFNlcGFyYXRvcihjb2RlISkpIGJyZWFrO1xuICAgIGVsc2UgY29kZSA9IENIQVJfRk9SV0FSRF9TTEFTSDtcblxuICAgIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSEpKSB7XG4gICAgICBpZiAobGFzdFNsYXNoID09PSBpIC0gMSB8fCBkb3RzID09PSAxKSB7XG4gICAgICAgIC8vIE5PT1BcbiAgICAgIH0gZWxzZSBpZiAobGFzdFNsYXNoICE9PSBpIC0gMSAmJiBkb3RzID09PSAyKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICByZXMubGVuZ3RoIDwgMiB8fFxuICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoICE9PSAyIHx8XG4gICAgICAgICAgcmVzLmNoYXJDb2RlQXQocmVzLmxlbmd0aCAtIDEpICE9PSBDSEFSX0RPVCB8fFxuICAgICAgICAgIHJlcy5jaGFyQ29kZUF0KHJlcy5sZW5ndGggLSAyKSAhPT0gQ0hBUl9ET1RcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKHJlcy5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICBjb25zdCBsYXN0U2xhc2hJbmRleCA9IHJlcy5sYXN0SW5kZXhPZihzZXBhcmF0b3IpO1xuICAgICAgICAgICAgaWYgKGxhc3RTbGFzaEluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICByZXMgPSBcIlwiO1xuICAgICAgICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IDA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXMgPSByZXMuc2xpY2UoMCwgbGFzdFNsYXNoSW5kZXgpO1xuICAgICAgICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IHJlcy5sZW5ndGggLSAxIC0gcmVzLmxhc3RJbmRleE9mKHNlcGFyYXRvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYXN0U2xhc2ggPSBpO1xuICAgICAgICAgICAgZG90cyA9IDA7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHJlcy5sZW5ndGggPT09IDIgfHwgcmVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmVzID0gXCJcIjtcbiAgICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gMDtcbiAgICAgICAgICAgIGxhc3RTbGFzaCA9IGk7XG4gICAgICAgICAgICBkb3RzID0gMDtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcbiAgICAgICAgICBpZiAocmVzLmxlbmd0aCA+IDApIHJlcyArPSBgJHtzZXBhcmF0b3J9Li5gO1xuICAgICAgICAgIGVsc2UgcmVzID0gXCIuLlwiO1xuICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gMjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHJlcy5sZW5ndGggPiAwKSByZXMgKz0gc2VwYXJhdG9yICsgcGF0aC5zbGljZShsYXN0U2xhc2ggKyAxLCBpKTtcbiAgICAgICAgZWxzZSByZXMgPSBwYXRoLnNsaWNlKGxhc3RTbGFzaCArIDEsIGkpO1xuICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IGkgLSBsYXN0U2xhc2ggLSAxO1xuICAgICAgfVxuICAgICAgbGFzdFNsYXNoID0gaTtcbiAgICAgIGRvdHMgPSAwO1xuICAgIH0gZWxzZSBpZiAoY29kZSA9PT0gQ0hBUl9ET1QgJiYgZG90cyAhPT0gLTEpIHtcbiAgICAgICsrZG90cztcbiAgICB9IGVsc2Uge1xuICAgICAgZG90cyA9IC0xO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX2Zvcm1hdChcbiAgc2VwOiBzdHJpbmcsXG4gIHBhdGhPYmplY3Q6IEZvcm1hdElucHV0UGF0aE9iamVjdCxcbik6IHN0cmluZyB7XG4gIGNvbnN0IGRpcjogc3RyaW5nIHwgdW5kZWZpbmVkID0gcGF0aE9iamVjdC5kaXIgfHwgcGF0aE9iamVjdC5yb290O1xuICBjb25zdCBiYXNlOiBzdHJpbmcgPSBwYXRoT2JqZWN0LmJhc2UgfHxcbiAgICAocGF0aE9iamVjdC5uYW1lIHx8IFwiXCIpICsgKHBhdGhPYmplY3QuZXh0IHx8IFwiXCIpO1xuICBpZiAoIWRpcikgcmV0dXJuIGJhc2U7XG4gIGlmIChkaXIgPT09IHBhdGhPYmplY3Qucm9vdCkgcmV0dXJuIGRpciArIGJhc2U7XG4gIHJldHVybiBkaXIgKyBzZXAgKyBi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
