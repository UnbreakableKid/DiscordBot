import {
  CHAR_BACKWARD_SLASH,
  CHAR_COLON,
  CHAR_DOT,
  CHAR_QUESTION_MARK,
} from "./_constants.ts";
import {
  _format,
  assertPath,
  isPathSeparator,
  isWindowsDeviceRoot,
  normalizeString,
} from "./_util.ts";
import { assert } from "../_util/assert.ts";
export const sep = "\\";
export const delimiter = ";";
export function resolve(...pathSegments) {
  let resolvedDevice = "";
  let resolvedTail = "";
  let resolvedAbsolute = false;
  for (let i = pathSegments.length - 1; i >= -1; i--) {
    let path;
    if (i >= 0) {
      path = pathSegments[i];
    } else if (!resolvedDevice) {
      if (globalThis.Deno == null) {
        throw new TypeError("Resolved a drive-letter-less path without a CWD.");
      }
      path = Deno.cwd();
    } else {
      if (globalThis.Deno == null) {
        throw new TypeError("Resolved a relative path without a CWD.");
      }
      // Windows has the concept of drive-specific current working
      // directories. If we've resolved a drive letter but not yet an
      // absolute path, get cwd for that drive, or the process cwd if
      // the drive cwd is not available. We're sure the device is not
      // a UNC path at this points, because UNC paths are always absolute.
      path = Deno.env.get(`=${resolvedDevice}`) || Deno.cwd();
      // Verify that a cwd was found and that it actually points
      // to our drive. If not, default to the drive's root.
      if (
        path === undefined ||
        path.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`
      ) {
        path = `${resolvedDevice}\\`;
      }
    }
    assertPath(path);
    const len = path.length;
    // Skip empty entries
    if (len === 0) continue;
    let rootEnd = 0;
    let device = "";
    let isAbsolute = false;
    const code = path.charCodeAt(0);
    // Try to match a root
    if (len > 1) {
      if (isPathSeparator(code)) {
        // Possible UNC root
        // If we started with a separator, we know we at least have an
        // absolute path of some kind (UNC or otherwise)
        isAbsolute = true;
        if (isPathSeparator(path.charCodeAt(1))) {
          // Matched double path separator at beginning
          let j = 2;
          let last = j;
          // Match 1 or more non-path separators
          for (; j < len; ++j) {
            if (isPathSeparator(path.charCodeAt(j))) break;
          }
          if (j < len && j !== last) {
            const firstPart = path.slice(last, j);
            // Matched!
            last = j;
            // Match 1 or more path separators
            for (; j < len; ++j) {
              if (!isPathSeparator(path.charCodeAt(j))) break;
            }
            if (j < len && j !== last) {
              // Matched!
              last = j;
              // Match 1 or more non-path separators
              for (; j < len; ++j) {
                if (isPathSeparator(path.charCodeAt(j))) break;
              }
              if (j === len) {
                // We matched a UNC root only
                device = `\\\\${firstPart}\\${path.slice(last)}`;
                rootEnd = j;
              } else if (j !== last) {
                // We matched a UNC root with leftovers
                device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                rootEnd = j;
              }
            }
          }
        } else {
          rootEnd = 1;
        }
      } else if (isWindowsDeviceRoot(code)) {
        // Possible device root
        if (path.charCodeAt(1) === CHAR_COLON) {
          device = path.slice(0, 2);
          rootEnd = 2;
          if (len > 2) {
            if (isPathSeparator(path.charCodeAt(2))) {
              // Treat separator following drive name as an absolute path
              // indicator
              isAbsolute = true;
              rootEnd = 3;
            }
          }
        }
      }
    } else if (isPathSeparator(code)) {
      // `path` contains just a path separator
      rootEnd = 1;
      isAbsolute = true;
    }
    if (
      device.length > 0 && resolvedDevice.length > 0 &&
      device.toLowerCase() !== resolvedDevice.toLowerCase()
    ) {
      continue;
    }
    if (resolvedDevice.length === 0 && device.length > 0) {
      resolvedDevice = device;
    }
    if (!resolvedAbsolute) {
      resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
      resolvedAbsolute = isAbsolute;
    }
    if (resolvedAbsolute && resolvedDevice.length > 0) break;
  }
  // At this point the path should be resolved to a full absolute path,
  // but handle relative paths to be safe (might happen when process.cwd()
  // fails)
  // Normalize the tail path
  resolvedTail = normalizeString(
    resolvedTail,
    !resolvedAbsolute,
    "\\",
    isPathSeparator,
  );
  return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
export function normalize(path) {
  assertPath(path);
  const len = path.length;
  if (len === 0) return ".";
  let rootEnd = 0;
  let device;
  let isAbsolute = false;
  const code = path.charCodeAt(0);
  // Try to match a root
  if (len > 1) {
    if (isPathSeparator(code)) {
      // Possible UNC root
      // If we started with a separator, we know we at least have an absolute
      // path of some kind (UNC or otherwise)
      isAbsolute = true;
      if (isPathSeparator(path.charCodeAt(1))) {
        // Matched double path separator at beginning
        let j = 2;
        let last = j;
        // Match 1 or more non-path separators
        for (; j < len; ++j) {
          if (isPathSeparator(path.charCodeAt(j))) break;
        }
        if (j < len && j !== last) {
          const firstPart = path.slice(last, j);
          // Matched!
          last = j;
          // Match 1 or more path separators
          for (; j < len; ++j) {
            if (!isPathSeparator(path.charCodeAt(j))) break;
          }
          if (j < len && j !== last) {
            // Matched!
            last = j;
            // Match 1 or more non-path separators
            for (; j < len; ++j) {
              if (isPathSeparator(path.charCodeAt(j))) break;
            }
            if (j === len) {
              // We matched a UNC root only
              // Return the normalized version of the UNC root since there
              // is nothing left to process
              return `\\\\${firstPart}\\${path.slice(last)}\\`;
            } else if (j !== last) {
              // We matched a UNC root with leftovers
              device = `\\\\${firstPart}\\${path.slice(last, j)}`;
              rootEnd = j;
            }
          }
        }
      } else {
        rootEnd = 1;
      }
    } else if (isWindowsDeviceRoot(code)) {
      // Possible device root
      if (path.charCodeAt(1) === CHAR_COLON) {
        device = path.slice(0, 2);
        rootEnd = 2;
        if (len > 2) {
          if (isPathSeparator(path.charCodeAt(2))) {
            // Treat separator following drive name as an absolute path
            // indicator
            isAbsolute = true;
            rootEnd = 3;
          }
        }
      }
    }
  } else if (isPathSeparator(code)) {
    // `path` contains just a path separator, exit early to avoid unnecessary
    // work
    return "\\";
  }
  let tail;
  if (rootEnd < len) {
    tail = normalizeString(
      path.slice(rootEnd),
      !isAbsolute,
      "\\",
      isPathSeparator,
    );
  } else {
    tail = "";
  }
  if (tail.length === 0 && !isAbsolute) tail = ".";
  if (tail.length > 0 && isPathSeparator(path.charCodeAt(len - 1))) {
    tail += "\\";
  }
  if (device === undefined) {
    if (isAbsolute) {
      if (tail.length > 0) return `\\${tail}`;
      else return "\\";
    } else if (tail.length > 0) {
      return tail;
    } else {
      return "";
    }
  } else if (isAbsolute) {
    if (tail.length > 0) return `${device}\\${tail}`;
    else return `${device}\\`;
  } else if (tail.length > 0) {
    return device + tail;
  } else {
    return device;
  }
}
export function isAbsolute(path) {
  assertPath(path);
  const len = path.length;
  if (len === 0) return false;
  const code = path.charCodeAt(0);
  if (isPathSeparator(code)) {
    return true;
  } else if (isWindowsDeviceRoot(code)) {
    // Possible device root
    if (len > 2 && path.charCodeAt(1) === CHAR_COLON) {
      if (isPathSeparator(path.charCodeAt(2))) return true;
    }
  }
  return false;
}
export function join(...paths) {
  const pathsCount = paths.length;
  if (pathsCount === 0) return ".";
  let joined;
  let firstPart = null;
  for (let i = 0; i < pathsCount; ++i) {
    const path = paths[i];
    assertPath(path);
    if (path.length > 0) {
      if (joined === undefined) joined = firstPart = path;
      else joined += `\\${path}`;
    }
  }
  if (joined === undefined) return ".";
  // Make sure that the joined path doesn't start with two slashes, because
  // normalize() will mistake it for an UNC path then.
  //
  // This step is skipped when it is very clear that the user actually
  // intended to point at an UNC path. This is assumed when the first
  // non-empty string arguments starts with exactly two slashes followed by
  // at least one more non-slash character.
  //
  // Note that for normalize() to treat a path as an UNC path it needs to
  // have at least 2 components, so we don't filter for that here.
  // This means that the user can use join to construct UNC paths from
  // a server name and a share name; for example:
  //   path.join('//server', 'share') -> '\\\\server\\share\\')
  let needsReplace = true;
  let slashCount = 0;
  assert(firstPart != null);
  if (isPathSeparator(firstPart.charCodeAt(0))) {
    ++slashCount;
    const firstLen = firstPart.length;
    if (firstLen > 1) {
      if (isPathSeparator(firstPart.charCodeAt(1))) {
        ++slashCount;
        if (firstLen > 2) {
          if (isPathSeparator(firstPart.charCodeAt(2))) ++slashCount;
          else {
            // We matched a UNC path in the first part
            needsReplace = false;
          }
        }
      }
    }
  }
  if (needsReplace) {
    // Find any more consecutive slashes we need to replace
    for (; slashCount < joined.length; ++slashCount) {
      if (!isPathSeparator(joined.charCodeAt(slashCount))) break;
    }
    // Replace the slashes if needed
    if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
  }
  return normalize(joined);
}
// It will solve the relative path from `from` to `to`, for instance:
//  from = 'C:\\orandea\\test\\aaa'
//  to = 'C:\\orandea\\impl\\bbb'
// The output of the function should be: '..\\..\\impl\\bbb'
export function relative(from, to) {
  assertPath(from);
  assertPath(to);
  if (from === to) return "";
  const fromOrig = resolve(from);
  const toOrig = resolve(to);
  if (fromOrig === toOrig) return "";
  from = fromOrig.toLowerCase();
  to = toOrig.toLowerCase();
  if (from === to) return "";
  // Trim any leading backslashes
  let fromStart = 0;
  let fromEnd = from.length;
  for (; fromStart < fromEnd; ++fromStart) {
    if (from.charCodeAt(fromStart) !== CHAR_BACKWARD_SLASH) break;
  }
  // Trim trailing backslashes (applicable to UNC paths only)
  for (; fromEnd - 1 > fromStart; --fromEnd) {
    if (from.charCodeAt(fromEnd - 1) !== CHAR_BACKWARD_SLASH) break;
  }
  const fromLen = fromEnd - fromStart;
  // Trim any leading backslashes
  let toStart = 0;
  let toEnd = to.length;
  for (; toStart < toEnd; ++toStart) {
    if (to.charCodeAt(toStart) !== CHAR_BACKWARD_SLASH) break;
  }
  // Trim trailing backslashes (applicable to UNC paths only)
  for (; toEnd - 1 > toStart; --toEnd) {
    if (to.charCodeAt(toEnd - 1) !== CHAR_BACKWARD_SLASH) break;
  }
  const toLen = toEnd - toStart;
  // Compare paths to find the longest common path from root
  const length = fromLen < toLen ? fromLen : toLen;
  let lastCommonSep = -1;
  let i = 0;
  for (; i <= length; ++i) {
    if (i === length) {
      if (toLen > length) {
        if (to.charCodeAt(toStart + i) === CHAR_BACKWARD_SLASH) {
          // We get here if `from` is the exact base path for `to`.
          // For example: from='C:\\foo\\bar'; to='C:\\foo\\bar\\baz'
          return toOrig.slice(toStart + i + 1);
        } else if (i === 2) {
          // We get here if `from` is the device root.
          // For example: from='C:\\'; to='C:\\foo'
          return toOrig.slice(toStart + i);
        }
      }
      if (fromLen > length) {
        if (from.charCodeAt(fromStart + i) === CHAR_BACKWARD_SLASH) {
          // We get here if `to` is the exact base path for `from`.
          // For example: from='C:\\foo\\bar'; to='C:\\foo'
          lastCommonSep = i;
        } else if (i === 2) {
          // We get here if `to` is the device root.
          // For example: from='C:\\foo\\bar'; to='C:\\'
          lastCommonSep = 3;
        }
      }
      break;
    }
    const fromCode = from.charCodeAt(fromStart + i);
    const toCode = to.charCodeAt(toStart + i);
    if (fromCode !== toCode) break;
    else if (fromCode === CHAR_BACKWARD_SLASH) lastCommonSep = i;
  }
  // We found a mismatch before the first common path separator was seen, so
  // return the original `to`.
  if (i !== length && lastCommonSep === -1) {
    return toOrig;
  }
  let out = "";
  if (lastCommonSep === -1) lastCommonSep = 0;
  // Generate the relative path based on the path difference between `to` and
  // `from`
  for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
    if (i === fromEnd || from.charCodeAt(i) === CHAR_BACKWARD_SLASH) {
      if (out.length === 0) out += "..";
      else out += "\\..";
    }
  }
  // Lastly, append the rest of the destination (`to`) path that comes after
  // the common path parts
  if (out.length > 0) {
    return out + toOrig.slice(toStart + lastCommonSep, toEnd);
  } else {
    toStart += lastCommonSep;
    if (toOrig.charCodeAt(toStart) === CHAR_BACKWARD_SLASH) ++toStart;
    return toOrig.slice(toStart, toEnd);
  }
}
export function toNamespacedPath(path) {
  // Note: this will *probably* throw somewhere.
  if (typeof path !== "string") return path;
  if (path.length === 0) return "";
  const resolvedPath = resolve(path);
  if (resolvedPath.length >= 3) {
    if (resolvedPath.charCodeAt(0) === CHAR_BACKWARD_SLASH) {
      // Possible UNC root
      if (resolvedPath.charCodeAt(1) === CHAR_BACKWARD_SLASH) {
        const code = resolvedPath.charCodeAt(2);
        if (code !== CHAR_QUESTION_MARK && code !== CHAR_DOT) {
          // Matched non-long UNC root, convert the path to a long UNC path
          return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
        }
      }
    } else if (isWindowsDeviceRoot(resolvedPath.charCodeAt(0))) {
      // Possible device root
      if (
        resolvedPath.charCodeAt(1) === CHAR_COLON &&
        resolvedPath.charCodeAt(2) === CHAR_BACKWARD_SLASH
      ) {
        // Matched device root, convert the path to a long UNC path
        return `\\\\?\\${resolvedPath}`;
      }
    }
  }
  return path;
}
export function dirname(path) {
  assertPath(path);
  const len = path.length;
  if (len === 0) return ".";
  let rootEnd = -1;
  let end = -1;
  let matchedSlash = true;
  let offset = 0;
  const code = path.charCodeAt(0);
  // Try to match a root
  if (len > 1) {
    if (isPathSeparator(code)) {
      // Possible UNC root
      rootEnd = offset = 1;
      if (isPathSeparator(path.charCodeAt(1))) {
        // Matched double path separator at beginning
        let j = 2;
        let last = j;
        // Match 1 or more non-path separators
        for (; j < len; ++j) {
          if (isPathSeparator(path.charCodeAt(j))) break;
        }
        if (j < len && j !== last) {
          // Matched!
          last = j;
          // Match 1 or more path separators
          for (; j < len; ++j) {
            if (!isPathSeparator(path.charCodeAt(j))) break;
          }
          if (j < len && j !== last) {
            // Matched!
            last = j;
            // Match 1 or more non-path separators
            for (; j < len; ++j) {
              if (isPathSeparator(path.charCodeAt(j))) break;
            }
            if (j === len) {
              // We matched a UNC root only
              return path;
            }
            if (j !== last) {
              // We matched a UNC root with leftovers
              // Offset by 1 to include the separator after the UNC root to
              // treat it as a "normal root" on top of a (UNC) root
              rootEnd = offset = j + 1;
            }
          }
        }
      }
    } else if (isWindowsDeviceRoot(code)) {
      // Possible device root
      if (path.charCodeAt(1) === CHAR_COLON) {
        rootEnd = offset = 2;
        if (len > 2) {
          if (isPathSeparator(path.charCodeAt(2))) rootEnd = offset = 3;
        }
      }
    }
  } else if (isPathSeparator(code)) {
    // `path` contains just a path separator, exit early to avoid
    // unnecessary work
    return path;
  }
  for (let i = len - 1; i >= offset; --i) {
    if (isPathSeparator(path.charCodeAt(i))) {
      if (!matchedSlash) {
        end = i;
        break;
      }
    } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }
  if (end === -1) {
    if (rootEnd === -1) return ".";
    else end = rootEnd;
  }
  return path.slice(0, end);
}
export function basename(path, ext = "") {
  if (ext !== undefined && typeof ext !== "string") {
    throw new TypeError('"ext" argument must be a string');
  }
  assertPath(path);
  let start = 0;
  let end = -1;
  let matchedSlash = true;
  let i;
  // Check for a drive letter prefix so as not to mistake the following
  // path separator as an extra separator at the end of the path that can be
  // disregarded
  if (path.length >= 2) {
    const drive = path.charCodeAt(0);
    if (isWindowsDeviceRoot(drive)) {
      if (path.charCodeAt(1) === CHAR_COLON) start = 2;
    }
  }
  if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
    if (ext.length === path.length && ext === path) return "";
    let extIdx = ext.length - 1;
    let firstNonSlashEnd = -1;
    for (i = path.length - 1; i >= start; --i) {
      const code = path.charCodeAt(i);
      if (isPathSeparator(code)) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else {
        if (firstNonSlashEnd === -1) {
          // We saw the first non-path separator, remember this index in case
          // we need it if the extension ends up not matching
          matchedSlash = false;
          firstNonSlashEnd = i + 1;
        }
        if (extIdx >= 0) {
          // Try to match the explicit extension
          if (code === ext.charCodeAt(extIdx)) {
            if ((--extIdx) === -1) {
              // We matched the extension, so mark this as the end of our path
              // component
              end = i;
            }
          } else {
            // Extension does not match, so our result is the entire path
            // component
            extIdx = -1;
            end = firstNonSlashEnd;
          }
        }
      }
    }
    if (start === end) end = firstNonSlashEnd;
    else if (end === -1) end = path.length;
    return path.slice(start, end);
  } else {
    for (i = path.length - 1; i >= start; --i) {
      if (isPathSeparator(path.charCodeAt(i))) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // path component
        matchedSlash = false;
        end = i + 1;
      }
    }
    if (end === -1) return "";
    return path.slice(start, end);
  }
}
export function extname(path) {
  assertPath(path);
  let start = 0;
  let startDot = -1;
  let startPart = 0;
  let end = -1;
  let matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  let preDotState = 0;
  // Check for a drive letter prefix so as not to mistake the following
  // path separator as an extra separator at the end of the path that can be
  // disregarded
  if (
    path.length >= 2 && path.charCodeAt(1) === CHAR_COLON &&
    isWindowsDeviceRoot(path.charCodeAt(0))
  ) {
    start = startPart = 2;
  }
  for (let i = path.length - 1; i >= start; --i) {
    const code = path.charCodeAt(i);
    if (isPathSeparator(code)) {
      // If we reached a path separator that was not part of a set of path
      // separators at the end of the string, stop now
      if (!matchedSlash) {
        startPart = i + 1;
        break;
      }
      continue;
    }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === CHAR_DOT) {
      // If this is our first dot, mark it as the start of our extension
      if (startDot === -1) startDot = i;
      else if (preDotState !== 1) preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }
  if (
    startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
    preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
    (preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)
  ) {
    return "";
  }
  return path.slice(startDot, end);
}
export function format(pathObject) {
  /* eslint-disable max-len */ if (
    pathObject === null || typeof pathObject !== "object"
  ) {
    throw new TypeError(
      `The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`,
    );
  }
  return _format("\\", pathObject);
}
export function parse(path) {
  assertPath(path);
  const ret = {
    root: "",
    dir: "",
    base: "",
    ext: "",
    name: "",
  };
  const len = path.length;
  if (len === 0) return ret;
  let rootEnd = 0;
  let code = path.charCodeAt(0);
  // Try to match a root
  if (len > 1) {
    if (isPathSeparator(code)) {
      // Possible UNC root
      rootEnd = 1;
      if (isPathSeparator(path.charCodeAt(1))) {
        // Matched double path separator at beginning
        let j = 2;
        let last = j;
        // Match 1 or more non-path separators
        for (; j < len; ++j) {
          if (isPathSeparator(path.charCodeAt(j))) break;
        }
        if (j < len && j !== last) {
          // Matched!
          last = j;
          // Match 1 or more path separators
          for (; j < len; ++j) {
            if (!isPathSeparator(path.charCodeAt(j))) break;
          }
          if (j < len && j !== last) {
            // Matched!
            last = j;
            // Match 1 or more non-path separators
            for (; j < len; ++j) {
              if (isPathSeparator(path.charCodeAt(j))) break;
            }
            if (j === len) {
              // We matched a UNC root only
              rootEnd = j;
            } else if (j !== last) {
              // We matched a UNC root with leftovers
              rootEnd = j + 1;
            }
          }
        }
      }
    } else if (isWindowsDeviceRoot(code)) {
      // Possible device root
      if (path.charCodeAt(1) === CHAR_COLON) {
        rootEnd = 2;
        if (len > 2) {
          if (isPathSeparator(path.charCodeAt(2))) {
            if (len === 3) {
              // `path` contains just a drive root, exit early to avoid
              // unnecessary work
              ret.root = ret.dir = path;
              return ret;
            }
            rootEnd = 3;
          }
        } else {
          // `path` contains just a drive root, exit early to avoid
          // unnecessary work
          ret.root = ret.dir = path;
          return ret;
        }
      }
    }
  } else if (isPathSeparator(code)) {
    // `path` contains just a path separator, exit early to avoid
    // unnecessary work
    ret.root = ret.dir = path;
    return ret;
  }
  if (rootEnd > 0) ret.root = path.slice(0, rootEnd);
  let startDot = -1;
  let startPart = rootEnd;
  let end = -1;
  let matchedSlash = true;
  let i = path.length - 1;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  let preDotState = 0;
  // Get non-dir info
  for (; i >= rootEnd; --i) {
    code = path.charCodeAt(i);
    if (isPathSeparator(code)) {
      // If we reached a path separator that was not part of a set of path
      // separators at the end of the string, stop now
      if (!matchedSlash) {
        startPart = i + 1;
        break;
      }
      continue;
    }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === CHAR_DOT) {
      // If this is our first dot, mark it as the start of our extension
      if (startDot === -1) startDot = i;
      else if (preDotState !== 1) preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }
  if (
    startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
    preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
    (preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)
  ) {
    if (end !== -1) {
      ret.base = ret.name = path.slice(startPart, end);
    }
  } else {
    ret.name = path.slice(startPart, startDot);
    ret.base = path.slice(startPart, end);
    ret.ext = path.slice(startDot, end);
  }
  // If the directory is the root, use the entire root as the `dir` including
  // the trailing slash if any (`C:\abc` -> `C:\`). Otherwise, strip out the
  // trailing slash (`C:\abc\def` -> `C:\abc`).
  if (startPart > 0 && startPart !== rootEnd) {
    ret.dir = path.slice(0, startPart - 1);
  } else ret.dir = ret.root;
  return ret;
}
/** Converts a file URL to a path string.
 *
 *      fromFileUrl("file:///home/foo"); // "\\home\\foo"
 *      fromFileUrl("file:///C:/Users/foo"); // "C:\\Users\\foo"
 *      fromFileUrl("file://localhost/home/foo"); // "\\\\localhost\\home\\foo"
 */ export function fromFileUrl(url) {
  url = url instanceof URL ? url : new URL(url);
  if (url.protocol != "file:") {
    throw new TypeError("Must be a file URL.");
  }
  let path = decodeURIComponent(
    url.pathname.replace(/^\/*([A-Za-z]:)(\/|$)/, "$1/").replace(/\//g, "\\")
      .replace(/%(?![0-9A-Fa-f]{2})/g, "%25"),
  );
  if (url.hostname != "") {
    // Note: The `URL` implementation guarantees that the drive letter and
    // hostname are mutually exclusive. Otherwise it would not have been valid
    // to append the hostname and path like this.
    path = `\\\\${url.hostname}${path}`;
  }
  return path;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC43MS4wL3BhdGgvd2luMzIudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCB0aGUgQnJvd3NlcmlmeSBhdXRob3JzLiBNSVQgTGljZW5zZS5cbi8vIFBvcnRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9icm93c2VyaWZ5L3BhdGgtYnJvd3NlcmlmeS9cbi8qKiBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuICovXG5cbmltcG9ydCB0eXBlIHsgRm9ybWF0SW5wdXRQYXRoT2JqZWN0LCBQYXJzZWRQYXRoIH0gZnJvbSBcIi4vX2ludGVyZmFjZS50c1wiO1xuaW1wb3J0IHtcbiAgQ0hBUl9ET1QsXG4gIENIQVJfQkFDS1dBUkRfU0xBU0gsXG4gIENIQVJfQ09MT04sXG4gIENIQVJfUVVFU1RJT05fTUFSSyxcbn0gZnJvbSBcIi4vX2NvbnN0YW50cy50c1wiO1xuXG5pbXBvcnQge1xuICBhc3NlcnRQYXRoLFxuICBpc1BhdGhTZXBhcmF0b3IsXG4gIGlzV2luZG93c0RldmljZVJvb3QsXG4gIG5vcm1hbGl6ZVN0cmluZyxcbiAgX2Zvcm1hdCxcbn0gZnJvbSBcIi4vX3V0aWwudHNcIjtcbmltcG9ydCB7IGFzc2VydCB9IGZyb20gXCIuLi9fdXRpbC9hc3NlcnQudHNcIjtcblxuZXhwb3J0IGNvbnN0IHNlcCA9IFwiXFxcXFwiO1xuZXhwb3J0IGNvbnN0IGRlbGltaXRlciA9IFwiO1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZSguLi5wYXRoU2VnbWVudHM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgbGV0IHJlc29sdmVkRGV2aWNlID0gXCJcIjtcbiAgbGV0IHJlc29sdmVkVGFpbCA9IFwiXCI7XG4gIGxldCByZXNvbHZlZEFic29sdXRlID0gZmFsc2U7XG5cbiAgZm9yIChsZXQgaSA9IHBhdGhTZWdtZW50cy5sZW5ndGggLSAxOyBpID49IC0xOyBpLS0pIHtcbiAgICBsZXQgcGF0aDogc3RyaW5nO1xuICAgIGlmIChpID49IDApIHtcbiAgICAgIHBhdGggPSBwYXRoU2VnbWVudHNbaV07XG4gICAgfSBlbHNlIGlmICghcmVzb2x2ZWREZXZpY2UpIHtcbiAgICAgIGlmIChnbG9iYWxUaGlzLkRlbm8gPT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUmVzb2x2ZWQgYSBkcml2ZS1sZXR0ZXItbGVzcyBwYXRoIHdpdGhvdXQgYSBDV0QuXCIpO1xuICAgICAgfVxuICAgICAgcGF0aCA9IERlbm8uY3dkKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChnbG9iYWxUaGlzLkRlbm8gPT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUmVzb2x2ZWQgYSByZWxhdGl2ZSBwYXRoIHdpdGhvdXQgYSBDV0QuXCIpO1xuICAgICAgfVxuICAgICAgLy8gV2luZG93cyBoYXMgdGhlIGNvbmNlcHQgb2YgZHJpdmUtc3BlY2lmaWMgY3VycmVudCB3b3JraW5nXG4gICAgICAvLyBkaXJlY3Rvcmllcy4gSWYgd2UndmUgcmVzb2x2ZWQgYSBkcml2ZSBsZXR0ZXIgYnV0IG5vdCB5ZXQgYW5cbiAgICAgIC8vIGFic29sdXRlIHBhdGgsIGdldCBjd2QgZm9yIHRoYXQgZHJpdmUsIG9yIHRoZSBwcm9jZXNzIGN3ZCBpZlxuICAgICAgLy8gdGhlIGRyaXZlIGN3ZCBpcyBub3QgYXZhaWxhYmxlLiBXZSdyZSBzdXJlIHRoZSBkZXZpY2UgaXMgbm90XG4gICAgICAvLyBhIFVOQyBwYXRoIGF0IHRoaXMgcG9pbnRzLCBiZWNhdXNlIFVOQyBwYXRocyBhcmUgYWx3YXlzIGFic29sdXRlLlxuICAgICAgcGF0aCA9IERlbm8uZW52LmdldChgPSR7cmVzb2x2ZWREZXZpY2V9YCkgfHwgRGVuby5jd2QoKTtcblxuICAgICAgLy8gVmVyaWZ5IHRoYXQgYSBjd2Qgd2FzIGZvdW5kIGFuZCB0aGF0IGl0IGFjdHVhbGx5IHBvaW50c1xuICAgICAgLy8gdG8gb3VyIGRyaXZlLiBJZiBub3QsIGRlZmF1bHQgdG8gdGhlIGRyaXZlJ3Mgcm9vdC5cbiAgICAgIGlmIChcbiAgICAgICAgcGF0aCA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICAgIHBhdGguc2xpY2UoMCwgMykudG9Mb3dlckNhc2UoKSAhPT0gYCR7cmVzb2x2ZWREZXZpY2UudG9Mb3dlckNhc2UoKX1cXFxcYFxuICAgICAgKSB7XG4gICAgICAgIHBhdGggPSBgJHtyZXNvbHZlZERldmljZX1cXFxcYDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBhc3NlcnRQYXRoKHBhdGgpO1xuXG4gICAgY29uc3QgbGVuID0gcGF0aC5sZW5ndGg7XG5cbiAgICAvLyBTa2lwIGVtcHR5IGVudHJpZXNcbiAgICBpZiAobGVuID09PSAwKSBjb250aW51ZTtcblxuICAgIGxldCByb290RW5kID0gMDtcbiAgICBsZXQgZGV2aWNlID0gXCJcIjtcbiAgICBsZXQgaXNBYnNvbHV0ZSA9IGZhbHNlO1xuICAgIGNvbnN0IGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoMCk7XG5cbiAgICAvLyBUcnkgdG8gbWF0Y2ggYSByb290XG4gICAgaWYgKGxlbiA+IDEpIHtcbiAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSkpIHtcbiAgICAgICAgLy8gUG9zc2libGUgVU5DIHJvb3RcblxuICAgICAgICAvLyBJZiB3ZSBzdGFydGVkIHdpdGggYSBzZXBhcmF0b3IsIHdlIGtub3cgd2UgYXQgbGVhc3QgaGF2ZSBhblxuICAgICAgICAvLyBhYnNvbHV0ZSBwYXRoIG9mIHNvbWUga2luZCAoVU5DIG9yIG90aGVyd2lzZSlcbiAgICAgICAgaXNBYnNvbHV0ZSA9IHRydWU7XG5cbiAgICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoMSkpKSB7XG4gICAgICAgICAgLy8gTWF0Y2hlZCBkb3VibGUgcGF0aCBzZXBhcmF0b3IgYXQgYmVnaW5uaW5nXG4gICAgICAgICAgbGV0IGogPSAyO1xuICAgICAgICAgIGxldCBsYXN0ID0gajtcbiAgICAgICAgICAvLyBNYXRjaCAxIG9yIG1vcmUgbm9uLXBhdGggc2VwYXJhdG9yc1xuICAgICAgICAgIGZvciAoOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KGopKSkgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChqIDwgbGVuICYmIGogIT09IGxhc3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGZpcnN0UGFydCA9IHBhdGguc2xpY2UobGFzdCwgaik7XG4gICAgICAgICAgICAvLyBNYXRjaGVkIVxuICAgICAgICAgICAgbGFzdCA9IGo7XG4gICAgICAgICAgICAvLyBNYXRjaCAxIG9yIG1vcmUgcGF0aCBzZXBhcmF0b3JzXG4gICAgICAgICAgICBmb3IgKDsgaiA8IGxlbjsgKytqKSB7XG4gICAgICAgICAgICAgIGlmICghaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChqKSkpIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGogPCBsZW4gJiYgaiAhPT0gbGFzdCkge1xuICAgICAgICAgICAgICAvLyBNYXRjaGVkIVxuICAgICAgICAgICAgICBsYXN0ID0gajtcbiAgICAgICAgICAgICAgLy8gTWF0Y2ggMSBvciBtb3JlIG5vbi1wYXRoIHNlcGFyYXRvcnNcbiAgICAgICAgICAgICAgZm9yICg7IGogPCBsZW47ICsraikge1xuICAgICAgICAgICAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KGopKSkgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGogPT09IGxlbikge1xuICAgICAgICAgICAgICAgIC8vIFdlIG1hdGNoZWQgYSBVTkMgcm9vdCBvbmx5XG4gICAgICAgICAgICAgICAgZGV2aWNlID0gYFxcXFxcXFxcJHtmaXJzdFBhcnR9XFxcXCR7cGF0aC5zbGljZShsYXN0KX1gO1xuICAgICAgICAgICAgICAgIHJvb3RFbmQgPSBqO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGogIT09IGxhc3QpIHtcbiAgICAgICAgICAgICAgICAvLyBXZSBtYXRjaGVkIGEgVU5DIHJvb3Qgd2l0aCBsZWZ0b3ZlcnNcblxuICAgICAgICAgICAgICAgIGRldmljZSA9IGBcXFxcXFxcXCR7Zmlyc3RQYXJ0fVxcXFwke3BhdGguc2xpY2UobGFzdCwgail9YDtcbiAgICAgICAgICAgICAgICByb290RW5kID0gajtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByb290RW5kID0gMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChpc1dpbmRvd3NEZXZpY2VSb290KGNvZGUpKSB7XG4gICAgICAgIC8vIFBvc3NpYmxlIGRldmljZSByb290XG5cbiAgICAgICAgaWYgKHBhdGguY2hhckNvZGVBdCgxKSA9PT0gQ0hBUl9DT0xPTikge1xuICAgICAgICAgIGRldmljZSA9IHBhdGguc2xpY2UoMCwgMik7XG4gICAgICAgICAgcm9vdEVuZCA9IDI7XG4gICAgICAgICAgaWYgKGxlbiA+IDIpIHtcbiAgICAgICAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KDIpKSkge1xuICAgICAgICAgICAgICAvLyBUcmVhdCBzZXBhcmF0b3IgZm9sbG93aW5nIGRyaXZlIG5hbWUgYXMgYW4gYWJzb2x1dGUgcGF0aFxuICAgICAgICAgICAgICAvLyBpbmRpY2F0b3JcbiAgICAgICAgICAgICAgaXNBYnNvbHV0ZSA9IHRydWU7XG4gICAgICAgICAgICAgIHJvb3RFbmQgPSAzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNQYXRoU2VwYXJhdG9yKGNvZGUpKSB7XG4gICAgICAvLyBgcGF0aGAgY29udGFpbnMganVzdCBhIHBhdGggc2VwYXJhdG9yXG4gICAgICByb290RW5kID0gMTtcbiAgICAgIGlzQWJzb2x1dGUgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIGRldmljZS5sZW5ndGggPiAwICYmXG4gICAgICByZXNvbHZlZERldmljZS5sZW5ndGggPiAwICYmXG4gICAgICBkZXZpY2UudG9Mb3dlckNhc2UoKSAhPT0gcmVzb2x2ZWREZXZpY2UudG9Mb3dlckNhc2UoKVxuICAgICkge1xuICAgICAgLy8gVGhpcyBwYXRoIHBvaW50cyB0byBhbm90aGVyIGRldmljZSBzbyBpdCBpcyBub3QgYXBwbGljYWJsZVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKHJlc29sdmVkRGV2aWNlLmxlbmd0aCA9PT0gMCAmJiBkZXZpY2UubGVuZ3RoID4gMCkge1xuICAgICAgcmVzb2x2ZWREZXZpY2UgPSBkZXZpY2U7XG4gICAgfVxuICAgIGlmICghcmVzb2x2ZWRBYnNvbHV0ZSkge1xuICAgICAgcmVzb2x2ZWRUYWlsID0gYCR7cGF0aC5zbGljZShyb290RW5kKX1cXFxcJHtyZXNvbHZlZFRhaWx9YDtcbiAgICAgIHJlc29sdmVkQWJzb2x1dGUgPSBpc0Fic29sdXRlO1xuICAgIH1cblxuICAgIGlmIChyZXNvbHZlZEFic29sdXRlICYmIHJlc29sdmVkRGV2aWNlLmxlbmd0aCA+IDApIGJyZWFrO1xuICB9XG5cbiAgLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsXG4gIC8vIGJ1dCBoYW5kbGUgcmVsYXRpdmUgcGF0aHMgdG8gYmUgc2FmZSAobWlnaHQgaGFwcGVuIHdoZW4gcHJvY2Vzcy5jd2QoKVxuICAvLyBmYWlscylcblxuICAvLyBOb3JtYWxpemUgdGhlIHRhaWwgcGF0aFxuICByZXNvbHZlZFRhaWwgPSBub3JtYWxpemVTdHJpbmcoXG4gICAgcmVzb2x2ZWRUYWlsLFxuICAgICFyZXNvbHZlZEFic29sdXRlLFxuICAgIFwiXFxcXFwiLFxuICAgIGlzUGF0aFNlcGFyYXRvcixcbiAgKTtcblxuICByZXR1cm4gcmVzb2x2ZWREZXZpY2UgKyAocmVzb2x2ZWRBYnNvbHV0ZSA/IFwiXFxcXFwiIDogXCJcIikgKyByZXNvbHZlZFRhaWwgfHwgXCIuXCI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemUocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgYXNzZXJ0UGF0aChwYXRoKTtcbiAgY29uc3QgbGVuID0gcGF0aC5sZW5ndGg7XG4gIGlmIChsZW4gPT09IDApIHJldHVybiBcIi5cIjtcbiAgbGV0IHJvb3RFbmQgPSAwO1xuICBsZXQgZGV2aWNlOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIGxldCBpc0Fic29sdXRlID0gZmFsc2U7XG4gIGNvbnN0IGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoMCk7XG5cbiAgLy8gVHJ5IHRvIG1hdGNoIGEgcm9vdFxuICBpZiAobGVuID4gMSkge1xuICAgIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSkpIHtcbiAgICAgIC8vIFBvc3NpYmxlIFVOQyByb290XG5cbiAgICAgIC8vIElmIHdlIHN0YXJ0ZWQgd2l0aCBhIHNlcGFyYXRvciwgd2Uga25vdyB3ZSBhdCBsZWFzdCBoYXZlIGFuIGFic29sdXRlXG4gICAgICAvLyBwYXRoIG9mIHNvbWUga2luZCAoVU5DIG9yIG90aGVyd2lzZSlcbiAgICAgIGlzQWJzb2x1dGUgPSB0cnVlO1xuXG4gICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdCgxKSkpIHtcbiAgICAgICAgLy8gTWF0Y2hlZCBkb3VibGUgcGF0aCBzZXBhcmF0b3IgYXQgYmVnaW5uaW5nXG4gICAgICAgIGxldCBqID0gMjtcbiAgICAgICAgbGV0IGxhc3QgPSBqO1xuICAgICAgICAvLyBNYXRjaCAxIG9yIG1vcmUgbm9uLXBhdGggc2VwYXJhdG9yc1xuICAgICAgICBmb3IgKDsgaiA8IGxlbjsgKytqKSB7XG4gICAgICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoaikpKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoaiA8IGxlbiAmJiBqICE9PSBsYXN0KSB7XG4gICAgICAgICAgY29uc3QgZmlyc3RQYXJ0ID0gcGF0aC5zbGljZShsYXN0LCBqKTtcbiAgICAgICAgICAvLyBNYXRjaGVkIVxuICAgICAgICAgIGxhc3QgPSBqO1xuICAgICAgICAgIC8vIE1hdGNoIDEgb3IgbW9yZSBwYXRoIHNlcGFyYXRvcnNcbiAgICAgICAgICBmb3IgKDsgaiA8IGxlbjsgKytqKSB7XG4gICAgICAgICAgICBpZiAoIWlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoaikpKSBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGogPCBsZW4gJiYgaiAhPT0gbGFzdCkge1xuICAgICAgICAgICAgLy8gTWF0Y2hlZCFcbiAgICAgICAgICAgIGxhc3QgPSBqO1xuICAgICAgICAgICAgLy8gTWF0Y2ggMSBvciBtb3JlIG5vbi1wYXRoIHNlcGFyYXRvcnNcbiAgICAgICAgICAgIGZvciAoOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoaikpKSBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChqID09PSBsZW4pIHtcbiAgICAgICAgICAgICAgLy8gV2UgbWF0Y2hlZCBhIFVOQyByb290IG9ubHlcbiAgICAgICAgICAgICAgLy8gUmV0dXJuIHRoZSBub3JtYWxpemVkIHZlcnNpb24gb2YgdGhlIFVOQyByb290IHNpbmNlIHRoZXJlXG4gICAgICAgICAgICAgIC8vIGlzIG5vdGhpbmcgbGVmdCB0byBwcm9jZXNzXG5cbiAgICAgICAgICAgICAgcmV0dXJuIGBcXFxcXFxcXCR7Zmlyc3RQYXJ0fVxcXFwke3BhdGguc2xpY2UobGFzdCl9XFxcXGA7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGogIT09IGxhc3QpIHtcbiAgICAgICAgICAgICAgLy8gV2UgbWF0Y2hlZCBhIFVOQyByb290IHdpdGggbGVmdG92ZXJzXG5cbiAgICAgICAgICAgICAgZGV2aWNlID0gYFxcXFxcXFxcJHtmaXJzdFBhcnR9XFxcXCR7cGF0aC5zbGljZShsYXN0LCBqKX1gO1xuICAgICAgICAgICAgICByb290RW5kID0gajtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3RFbmQgPSAxO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNXaW5kb3dzRGV2aWNlUm9vdChjb2RlKSkge1xuICAgICAgLy8gUG9zc2libGUgZGV2aWNlIHJvb3RcblxuICAgICAgaWYgKHBhdGguY2hhckNvZGVBdCgxKSA9PT0gQ0hBUl9DT0xPTikge1xuICAgICAgICBkZXZpY2UgPSBwYXRoLnNsaWNlKDAsIDIpO1xuICAgICAgICByb290RW5kID0gMjtcbiAgICAgICAgaWYgKGxlbiA+IDIpIHtcbiAgICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdCgyKSkpIHtcbiAgICAgICAgICAgIC8vIFRyZWF0IHNlcGFyYXRvciBmb2xsb3dpbmcgZHJpdmUgbmFtZSBhcyBhbiBhYnNvbHV0ZSBwYXRoXG4gICAgICAgICAgICAvLyBpbmRpY2F0b3JcbiAgICAgICAgICAgIGlzQWJzb2x1dGUgPSB0cnVlO1xuICAgICAgICAgICAgcm9vdEVuZCA9IDM7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzUGF0aFNlcGFyYXRvcihjb2RlKSkge1xuICAgIC8vIGBwYXRoYCBjb250YWlucyBqdXN0IGEgcGF0aCBzZXBhcmF0b3IsIGV4aXQgZWFybHkgdG8gYXZvaWQgdW5uZWNlc3NhcnlcbiAgICAvLyB3b3JrXG4gICAgcmV0dXJuIFwiXFxcXFwiO1xuICB9XG5cbiAgbGV0IHRhaWw6IHN0cmluZztcbiAgaWYgKHJvb3RFbmQgPCBsZW4pIHtcbiAgICB0YWlsID0gbm9ybWFsaXplU3RyaW5nKFxuICAgICAgcGF0aC5zbGljZShyb290RW5kKSxcbiAgICAgICFpc0Fic29sdXRlLFxuICAgICAgXCJcXFxcXCIsXG4gICAgICBpc1BhdGhTZXBhcmF0b3IsXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICB0YWlsID0gXCJcIjtcbiAgfVxuICBpZiAodGFpbC5sZW5ndGggPT09IDAgJiYgIWlzQWJzb2x1dGUpIHRhaWwgPSBcIi5cIjtcbiAgaWYgKHRhaWwubGVuZ3RoID4gMCAmJiBpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KGxlbiAtIDEpKSkge1xuICAgIHRhaWwgKz0gXCJcXFxcXCI7XG4gIH1cbiAgaWYgKGRldmljZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKGlzQWJzb2x1dGUpIHtcbiAgICAgIGlmICh0YWlsLmxlbmd0aCA+IDApIHJldHVybiBgXFxcXCR7dGFpbH1gO1xuICAgICAgZWxzZSByZXR1cm4gXCJcXFxcXCI7XG4gICAgfSBlbHNlIGlmICh0YWlsLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiB0YWlsO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNBYnNvbHV0ZSkge1xuICAgIGlmICh0YWlsLmxlbmd0aCA+IDApIHJldHVybiBgJHtkZXZpY2V9XFxcXCR7dGFpbH1gO1xuICAgIGVsc2UgcmV0dXJuIGAke2RldmljZX1cXFxcYDtcbiAgfSBlbHNlIGlmICh0YWlsLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gZGV2aWNlICsgdGFpbDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZGV2aWNlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Fic29sdXRlKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBhc3NlcnRQYXRoKHBhdGgpO1xuICBjb25zdCBsZW4gPSBwYXRoLmxlbmd0aDtcbiAgaWYgKGxlbiA9PT0gMCkgcmV0dXJuIGZhbHNlO1xuXG4gIGNvbnN0IGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoMCk7XG4gIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSkpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmIChpc1dpbmRvd3NEZXZpY2VSb290KGNvZGUpKSB7XG4gICAgLy8gUG9zc2libGUgZGV2aWNlIHJvb3RcblxuICAgIGlmIChsZW4gPiAyICYmIHBhdGguY2hhckNvZGVBdCgxKSA9PT0gQ0hBUl9DT0xPTikge1xuICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoMikpKSByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gam9pbiguLi5wYXRoczogc3RyaW5nW10pOiBzdHJpbmcge1xuICBjb25zdCBwYXRoc0NvdW50ID0gcGF0aHMubGVuZ3RoO1xuICBpZiAocGF0aHNDb3VudCA9PT0gMCkgcmV0dXJuIFwiLlwiO1xuXG4gIGxldCBqb2luZWQ6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgbGV0IGZpcnN0UGFydDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aHNDb3VudDsgKytpKSB7XG4gICAgY29uc3QgcGF0aCA9IHBhdGhzW2ldO1xuICAgIGFzc2VydFBhdGgocGF0aCk7XG4gICAgaWYgKHBhdGgubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKGpvaW5lZCA9PT0gdW5kZWZpbmVkKSBqb2luZWQgPSBmaXJzdFBhcnQgPSBwYXRoO1xuICAgICAgZWxzZSBqb2luZWQgKz0gYFxcXFwke3BhdGh9YDtcbiAgICB9XG4gIH1cblxuICBpZiAoam9pbmVkID09PSB1bmRlZmluZWQpIHJldHVybiBcIi5cIjtcblxuICAvLyBNYWtlIHN1cmUgdGhhdCB0aGUgam9pbmVkIHBhdGggZG9lc24ndCBzdGFydCB3aXRoIHR3byBzbGFzaGVzLCBiZWNhdXNlXG4gIC8vIG5vcm1hbGl6ZSgpIHdpbGwgbWlzdGFrZSBpdCBmb3IgYW4gVU5DIHBhdGggdGhlbi5cbiAgLy9cbiAgLy8gVGhpcyBzdGVwIGlzIHNraXBwZWQgd2hlbiBpdCBpcyB2ZXJ5IGNsZWFyIHRoYXQgdGhlIHVzZXIgYWN0dWFsbHlcbiAgLy8gaW50ZW5kZWQgdG8gcG9pbnQgYXQgYW4gVU5DIHBhdGguIFRoaXMgaXMgYXNzdW1lZCB3aGVuIHRoZSBmaXJzdFxuICAvLyBub24tZW1wdHkgc3RyaW5nIGFyZ3VtZW50cyBzdGFydHMgd2l0aCBleGFjdGx5IHR3byBzbGFzaGVzIGZvbGxvd2VkIGJ5XG4gIC8vIGF0IGxlYXN0IG9uZSBtb3JlIG5vbi1zbGFzaCBjaGFyYWN0ZXIuXG4gIC8vXG4gIC8vIE5vdGUgdGhhdCBmb3Igbm9ybWFsaXplKCkgdG8gdHJlYXQgYSBwYXRoIGFzIGFuIFVOQyBwYXRoIGl0IG5lZWRzIHRvXG4gIC8vIGhhdmUgYXQgbGVhc3QgMiBjb21wb25lbnRzLCBzbyB3ZSBkb24ndCBmaWx0ZXIgZm9yIHRoYXQgaGVyZS5cbiAgLy8gVGhpcyBtZWFucyB0aGF0IHRoZSB1c2VyIGNhbiB1c2Ugam9pbiB0byBjb25zdHJ1Y3QgVU5DIHBhdGhzIGZyb21cbiAgLy8gYSBzZXJ2ZXIgbmFtZSBhbmQgYSBzaGFyZSBuYW1lOyBmb3IgZXhhbXBsZTpcbiAgLy8gICBwYXRoLmpvaW4oJy8vc2VydmVyJywgJ3NoYXJlJykgLT4gJ1xcXFxcXFxcc2VydmVyXFxcXHNoYXJlXFxcXCcpXG4gIGxldCBuZWVkc1JlcGxhY2UgPSB0cnVlO1xuICBsZXQgc2xhc2hDb3VudCA9IDA7XG4gIGFzc2VydChmaXJzdFBhcnQgIT0gbnVsbCk7XG4gIGlmIChpc1BhdGhTZXBhcmF0b3IoZmlyc3RQYXJ0LmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgKytzbGFzaENvdW50O1xuICAgIGNvbnN0IGZpcnN0TGVuID0gZmlyc3RQYXJ0Lmxlbmd0aDtcbiAgICBpZiAoZmlyc3RMZW4gPiAxKSB7XG4gICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKGZpcnN0UGFydC5jaGFyQ29kZUF0KDEpKSkge1xuICAgICAgICArK3NsYXNoQ291bnQ7XG4gICAgICAgIGlmIChmaXJzdExlbiA+IDIpIHtcbiAgICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKGZpcnN0UGFydC5jaGFyQ29kZUF0KDIpKSkgKytzbGFzaENvdW50O1xuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gV2UgbWF0Y2hlZCBhIFVOQyBwYXRoIGluIHRoZSBmaXJzdCBwYXJ0XG4gICAgICAgICAgICBuZWVkc1JlcGxhY2UgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKG5lZWRzUmVwbGFjZSkge1xuICAgIC8vIEZpbmQgYW55IG1vcmUgY29uc2VjdXRpdmUgc2xhc2hlcyB3ZSBuZWVkIHRvIHJlcGxhY2VcbiAgICBmb3IgKDsgc2xhc2hDb3VudCA8IGpvaW5lZC5sZW5ndGg7ICsrc2xhc2hDb3VudCkge1xuICAgICAgaWYgKCFpc1BhdGhTZXBhcmF0b3Ioam9pbmVkLmNoYXJDb2RlQXQoc2xhc2hDb3VudCkpKSBicmVhaztcbiAgICB9XG5cbiAgICAvLyBSZXBsYWNlIHRoZSBzbGFzaGVzIGlmIG5lZWRlZFxuICAgIGlmIChzbGFzaENvdW50ID49IDIpIGpvaW5lZCA9IGBcXFxcJHtqb2luZWQuc2xpY2Uoc2xhc2hDb3VudCl9YDtcbiAgfVxuXG4gIHJldHVybiBub3JtYWxpemUoam9pbmVkKTtcbn1cblxuLy8gSXQgd2lsbCBzb2x2ZSB0aGUgcmVsYXRpdmUgcGF0aCBmcm9tIGBmcm9tYCB0byBgdG9gLCBmb3IgaW5zdGFuY2U6XG4vLyAgZnJvbSA9ICdDOlxcXFxvcmFuZGVhXFxcXHRlc3RcXFxcYWFhJ1xuLy8gIHRvID0gJ0M6XFxcXG9yYW5kZWFcXFxcaW1wbFxcXFxiYmInXG4vLyBUaGUgb3V0cHV0IG9mIHRoZSBmdW5jdGlvbiBzaG91bGQgYmU6ICcuLlxcXFwuLlxcXFxpbXBsXFxcXGJiYidcbmV4cG9ydCBmdW5jdGlvbiByZWxhdGl2ZShmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcpOiBzdHJpbmcge1xuICBhc3NlcnRQYXRoKGZyb20pO1xuICBhc3NlcnRQYXRoKHRvKTtcblxuICBpZiAoZnJvbSA9PT0gdG8pIHJldHVybiBcIlwiO1xuXG4gIGNvbnN0IGZyb21PcmlnID0gcmVzb2x2ZShmcm9tKTtcbiAgY29uc3QgdG9PcmlnID0gcmVzb2x2ZSh0byk7XG5cbiAgaWYgKGZyb21PcmlnID09PSB0b09yaWcpIHJldHVybiBcIlwiO1xuXG4gIGZyb20gPSBmcm9tT3JpZy50b0xvd2VyQ2FzZSgpO1xuICB0byA9IHRvT3JpZy50b0xvd2VyQ2FzZSgpO1xuXG4gIGlmIChmcm9tID09PSB0bykgcmV0dXJuIFwiXCI7XG5cbiAgLy8gVHJpbSBhbnkgbGVhZGluZyBiYWNrc2xhc2hlc1xuICBsZXQgZnJvbVN0YXJ0ID0gMDtcbiAgbGV0IGZyb21FbmQgPSBmcm9tLmxlbmd0aDtcbiAgZm9yICg7IGZyb21TdGFydCA8IGZyb21FbmQ7ICsrZnJvbVN0YXJ0KSB7XG4gICAgaWYgKGZyb20uY2hhckNvZGVBdChmcm9tU3RhcnQpICE9PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSBicmVhaztcbiAgfVxuICAvLyBUcmltIHRyYWlsaW5nIGJhY2tzbGFzaGVzIChhcHBsaWNhYmxlIHRvIFVOQyBwYXRocyBvbmx5KVxuICBmb3IgKDsgZnJvbUVuZCAtIDEgPiBmcm9tU3RhcnQ7IC0tZnJvbUVuZCkge1xuICAgIGlmIChmcm9tLmNoYXJDb2RlQXQoZnJvbUVuZCAtIDEpICE9PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSBicmVhaztcbiAgfVxuICBjb25zdCBmcm9tTGVuID0gZnJvbUVuZCAtIGZyb21TdGFydDtcblxuICAvLyBUcmltIGFueSBsZWFkaW5nIGJhY2tzbGFzaGVzXG4gIGxldCB0b1N0YXJ0ID0gMDtcbiAgbGV0IHRvRW5kID0gdG8ubGVuZ3RoO1xuICBmb3IgKDsgdG9TdGFydCA8IHRvRW5kOyArK3RvU3RhcnQpIHtcbiAgICBpZiAodG8uY2hhckNvZGVBdCh0b1N0YXJ0KSAhPT0gQ0hBUl9CQUNLV0FSRF9TTEFTSCkgYnJlYWs7XG4gIH1cbiAgLy8gVHJpbSB0cmFpbGluZyBiYWNrc2xhc2hlcyAoYXBwbGljYWJsZSB0byBVTkMgcGF0aHMgb25seSlcbiAgZm9yICg7IHRvRW5kIC0gMSA+IHRvU3RhcnQ7IC0tdG9FbmQpIHtcbiAgICBpZiAodG8uY2hhckNvZGVBdCh0b0VuZCAtIDEpICE9PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSBicmVhaztcbiAgfVxuICBjb25zdCB0b0xlbiA9IHRvRW5kIC0gdG9TdGFydDtcblxuICAvLyBDb21wYXJlIHBhdGhzIHRvIGZpbmQgdGhlIGxvbmdlc3QgY29tbW9uIHBhdGggZnJvbSByb290XG4gIGNvbnN0IGxlbmd0aCA9IGZyb21MZW4gPCB0b0xlbiA/IGZyb21MZW4gOiB0b0xlbjtcbiAgbGV0IGxhc3RDb21tb25TZXAgPSAtMTtcbiAgbGV0IGkgPSAwO1xuICBmb3IgKDsgaSA8PSBsZW5ndGg7ICsraSkge1xuICAgIGlmIChpID09PSBsZW5ndGgpIHtcbiAgICAgIGlmICh0b0xlbiA+IGxlbmd0aCkge1xuICAgICAgICBpZiAodG8uY2hhckNvZGVBdCh0b1N0YXJ0ICsgaSkgPT09IENIQVJfQkFDS1dBUkRfU0xBU0gpIHtcbiAgICAgICAgICAvLyBXZSBnZXQgaGVyZSBpZiBgZnJvbWAgaXMgdGhlIGV4YWN0IGJhc2UgcGF0aCBmb3IgYHRvYC5cbiAgICAgICAgICAvLyBGb3IgZXhhbXBsZTogZnJvbT0nQzpcXFxcZm9vXFxcXGJhcic7IHRvPSdDOlxcXFxmb29cXFxcYmFyXFxcXGJheidcbiAgICAgICAgICByZXR1cm4gdG9PcmlnLnNsaWNlKHRvU3RhcnQgKyBpICsgMSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gMikge1xuICAgICAgICAgIC8vIFdlIGdldCBoZXJlIGlmIGBmcm9tYCBpcyB0aGUgZGV2aWNlIHJvb3QuXG4gICAgICAgICAgLy8gRm9yIGV4YW1wbGU6IGZyb209J0M6XFxcXCc7IHRvPSdDOlxcXFxmb28nXG4gICAgICAgICAgcmV0dXJuIHRvT3JpZy5zbGljZSh0b1N0YXJ0ICsgaSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChmcm9tTGVuID4gbGVuZ3RoKSB7XG4gICAgICAgIGlmIChmcm9tLmNoYXJDb2RlQXQoZnJvbVN0YXJ0ICsgaSkgPT09IENIQVJfQkFDS1dBUkRfU0xBU0gpIHtcbiAgICAgICAgICAvLyBXZSBnZXQgaGVyZSBpZiBgdG9gIGlzIHRoZSBleGFjdCBiYXNlIHBhdGggZm9yIGBmcm9tYC5cbiAgICAgICAgICAvLyBGb3IgZXhhbXBsZTogZnJvbT0nQzpcXFxcZm9vXFxcXGJhcic7IHRvPSdDOlxcXFxmb28nXG4gICAgICAgICAgbGFzdENvbW1vblNlcCA9IGk7XG4gICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gMikge1xuICAgICAgICAgIC8vIFdlIGdldCBoZXJlIGlmIGB0b2AgaXMgdGhlIGRldmljZSByb290LlxuICAgICAgICAgIC8vIEZvciBleGFtcGxlOiBmcm9tPSdDOlxcXFxmb29cXFxcYmFyJzsgdG89J0M6XFxcXCdcbiAgICAgICAgICBsYXN0Q29tbW9uU2VwID0gMztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNvbnN0IGZyb21Db2RlID0gZnJvbS5jaGFyQ29kZUF0KGZyb21TdGFydCArIGkpO1xuICAgIGNvbnN0IHRvQ29kZSA9IHRvLmNoYXJDb2RlQXQodG9TdGFydCArIGkpO1xuICAgIGlmIChmcm9tQ29kZSAhPT0gdG9Db2RlKSBicmVhaztcbiAgICBlbHNlIGlmIChmcm9tQ29kZSA9PT0gQ0hBUl9CQUNLV0FSRF9TTEFTSCkgbGFzdENvbW1vblNlcCA9IGk7XG4gIH1cblxuICAvLyBXZSBmb3VuZCBhIG1pc21hdGNoIGJlZm9yZSB0aGUgZmlyc3QgY29tbW9uIHBhdGggc2VwYXJhdG9yIHdhcyBzZWVuLCBzb1xuICAvLyByZXR1cm4gdGhlIG9yaWdpbmFsIGB0b2AuXG4gIGlmIChpICE9PSBsZW5ndGggJiYgbGFzdENvbW1vblNlcCA9PT0gLTEpIHtcbiAgICByZXR1cm4gdG9PcmlnO1xuICB9XG5cbiAgbGV0IG91dCA9IFwiXCI7XG4gIGlmIChsYXN0Q29tbW9uU2VwID09PSAtMSkgbGFzdENvbW1vblNlcCA9IDA7XG4gIC8vIEdlbmVyYXRlIHRoZSByZWxhdGl2ZSBwYXRoIGJhc2VkIG9uIHRoZSBwYXRoIGRpZmZlcmVuY2UgYmV0d2VlbiBgdG9gIGFuZFxuICAvLyBgZnJvbWBcbiAgZm9yIChpID0gZnJvbVN0YXJ0ICsgbGFzdENvbW1vblNlcCArIDE7IGkgPD0gZnJvbUVuZDsgKytpKSB7XG4gICAgaWYgKGkgPT09IGZyb21FbmQgfHwgZnJvbS5jaGFyQ29kZUF0KGkpID09PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSB7XG4gICAgICBpZiAob3V0Lmxlbmd0aCA9PT0gMCkgb3V0ICs9IFwiLi5cIjtcbiAgICAgIGVsc2Ugb3V0ICs9IFwiXFxcXC4uXCI7XG4gICAgfVxuICB9XG5cbiAgLy8gTGFzdGx5LCBhcHBlbmQgdGhlIHJlc3Qgb2YgdGhlIGRlc3RpbmF0aW9uIChgdG9gKSBwYXRoIHRoYXQgY29tZXMgYWZ0ZXJcbiAgLy8gdGhlIGNvbW1vbiBwYXRoIHBhcnRzXG4gIGlmIChvdXQubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBvdXQgKyB0b09yaWcuc2xpY2UodG9TdGFydCArIGxhc3RDb21tb25TZXAsIHRvRW5kKTtcbiAgfSBlbHNlIHtcbiAgICB0b1N0YXJ0ICs9IGxhc3RDb21tb25TZXA7XG4gICAgaWYgKHRvT3JpZy5jaGFyQ29kZUF0KHRvU3RhcnQpID09PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSArK3RvU3RhcnQ7XG4gICAgcmV0dXJuIHRvT3JpZy5zbGljZSh0b1N0YXJ0LCB0b0VuZCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvTmFtZXNwYWNlZFBhdGgocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgLy8gTm90ZTogdGhpcyB3aWxsICpwcm9iYWJseSogdGhyb3cgc29tZXdoZXJlLlxuICBpZiAodHlwZW9mIHBhdGggIT09IFwic3RyaW5nXCIpIHJldHVybiBwYXRoO1xuICBpZiAocGF0aC5sZW5ndGggPT09IDApIHJldHVybiBcIlwiO1xuXG4gIGNvbnN0IHJlc29sdmVkUGF0aCA9IHJlc29sdmUocGF0aCk7XG5cbiAgaWYgKHJlc29sdmVkUGF0aC5sZW5ndGggPj0gMykge1xuICAgIGlmIChyZXNvbHZlZFBhdGguY2hhckNvZGVBdCgwKSA9PT0gQ0hBUl9CQUNLV0FSRF9TTEFTSCkge1xuICAgICAgLy8gUG9zc2libGUgVU5DIHJvb3RcblxuICAgICAgaWYgKHJlc29sdmVkUGF0aC5jaGFyQ29kZUF0KDEpID09PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSB7XG4gICAgICAgIGNvbnN0IGNvZGUgPSByZXNvbHZlZFBhdGguY2hhckNvZGVBdCgyKTtcbiAgICAgICAgaWYgKGNvZGUgIT09IENIQVJfUVVFU1RJT05fTUFSSyAmJiBjb2RlICE9PSBDSEFSX0RPVCkge1xuICAgICAgICAgIC8vIE1hdGNoZWQgbm9uLWxvbmcgVU5DIHJvb3QsIGNvbnZlcnQgdGhlIHBhdGggdG8gYSBsb25nIFVOQyBwYXRoXG4gICAgICAgICAgcmV0dXJuIGBcXFxcXFxcXD9cXFxcVU5DXFxcXCR7cmVzb2x2ZWRQYXRoLnNsaWNlKDIpfWA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzV2luZG93c0RldmljZVJvb3QocmVzb2x2ZWRQYXRoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAvLyBQb3NzaWJsZSBkZXZpY2Ugcm9vdFxuXG4gICAgICBpZiAoXG4gICAgICAgIHJlc29sdmVkUGF0aC5jaGFyQ29kZUF0KDEpID09PSBDSEFSX0NPTE9OICYmXG4gICAgICAgIHJlc29sdmVkUGF0aC5jaGFyQ29kZUF0KDIpID09PSBDSEFSX0JBQ0tXQVJEX1NMQVNIXG4gICAgICApIHtcbiAgICAgICAgLy8gTWF0Y2hlZCBkZXZpY2Ugcm9vdCwgY29udmVydCB0aGUgcGF0aCB0byBhIGxvbmcgVU5DIHBhdGhcbiAgICAgICAgcmV0dXJuIGBcXFxcXFxcXD9cXFxcJHtyZXNvbHZlZFBhdGh9YDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGF0aDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRpcm5hbWUocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgYXNzZXJ0UGF0aChwYXRoKTtcbiAgY29uc3QgbGVuID0gcGF0aC5sZW5ndGg7XG4gIGlmIChsZW4gPT09IDApIHJldHVybiBcIi5cIjtcbiAgbGV0IHJvb3RFbmQgPSAtMTtcbiAgbGV0IGVuZCA9IC0xO1xuICBsZXQgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgbGV0IG9mZnNldCA9IDA7XG4gIGNvbnN0IGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoMCk7XG5cbiAgLy8gVHJ5IHRvIG1hdGNoIGEgcm9vdFxuICBpZiAobGVuID4gMSkge1xuICAgIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSkpIHtcbiAgICAgIC8vIFBvc3NpYmxlIFVOQyByb290XG5cbiAgICAgIHJvb3RFbmQgPSBvZmZzZXQgPSAxO1xuXG4gICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdCgxKSkpIHtcbiAgICAgICAgLy8gTWF0Y2hlZCBkb3VibGUgcGF0aCBzZXBhcmF0b3IgYXQgYmVnaW5uaW5nXG4gICAgICAgIGxldCBqID0gMjtcbiAgICAgICAgbGV0IGxhc3QgPSBqO1xuICAgICAgICAvLyBNYXRjaCAxIG9yIG1vcmUgbm9uLXBhdGggc2VwYXJhdG9yc1xuICAgICAgICBmb3IgKDsgaiA8IGxlbjsgKytqKSB7XG4gICAgICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoaikpKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoaiA8IGxlbiAmJiBqICE9PSBsYXN0KSB7XG4gICAgICAgICAgLy8gTWF0Y2hlZCFcbiAgICAgICAgICBsYXN0ID0gajtcbiAgICAgICAgICAvLyBNYXRjaCAxIG9yIG1vcmUgcGF0aCBzZXBhcmF0b3JzXG4gICAgICAgICAgZm9yICg7IGogPCBsZW47ICsraikge1xuICAgICAgICAgICAgaWYgKCFpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KGopKSkgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChqIDwgbGVuICYmIGogIT09IGxhc3QpIHtcbiAgICAgICAgICAgIC8vIE1hdGNoZWQhXG4gICAgICAgICAgICBsYXN0ID0gajtcbiAgICAgICAgICAgIC8vIE1hdGNoIDEgb3IgbW9yZSBub24tcGF0aCBzZXBhcmF0b3JzXG4gICAgICAgICAgICBmb3IgKDsgaiA8IGxlbjsgKytqKSB7XG4gICAgICAgICAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KGopKSkgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaiA9PT0gbGVuKSB7XG4gICAgICAgICAgICAgIC8vIFdlIG1hdGNoZWQgYSBVTkMgcm9vdCBvbmx5XG4gICAgICAgICAgICAgIHJldHVybiBwYXRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGogIT09IGxhc3QpIHtcbiAgICAgICAgICAgICAgLy8gV2UgbWF0Y2hlZCBhIFVOQyByb290IHdpdGggbGVmdG92ZXJzXG5cbiAgICAgICAgICAgICAgLy8gT2Zmc2V0IGJ5IDEgdG8gaW5jbHVkZSB0aGUgc2VwYXJhdG9yIGFmdGVyIHRoZSBVTkMgcm9vdCB0b1xuICAgICAgICAgICAgICAvLyB0cmVhdCBpdCBhcyBhIFwibm9ybWFsIHJvb3RcIiBvbiB0b3Agb2YgYSAoVU5DKSByb290XG4gICAgICAgICAgICAgIHJvb3RFbmQgPSBvZmZzZXQgPSBqICsgMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzV2luZG93c0RldmljZVJvb3QoY29kZSkpIHtcbiAgICAgIC8vIFBvc3NpYmxlIGRldmljZSByb290XG5cbiAgICAgIGlmIChwYXRoLmNoYXJDb2RlQXQoMSkgPT09IENIQVJfQ09MT04pIHtcbiAgICAgICAgcm9vdEVuZCA9IG9mZnNldCA9IDI7XG4gICAgICAgIGlmIChsZW4gPiAyKSB7XG4gICAgICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoMikpKSByb290RW5kID0gb2Zmc2V0ID0gMztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSkpIHtcbiAgICAvLyBgcGF0aGAgY29udGFpbnMganVzdCBhIHBhdGggc2VwYXJhdG9yLCBleGl0IGVhcmx5IHRvIGF2b2lkXG4gICAgLy8gdW5uZWNlc3Nhcnkgd29ya1xuICAgIHJldHVybiBwYXRoO1xuICB9XG5cbiAgZm9yIChsZXQgaSA9IGxlbiAtIDE7IGkgPj0gb2Zmc2V0OyAtLWkpIHtcbiAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChpKSkpIHtcbiAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgIGVuZCA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBXZSBzYXcgdGhlIGZpcnN0IG5vbi1wYXRoIHNlcGFyYXRvclxuICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaWYgKGVuZCA9PT0gLTEpIHtcbiAgICBpZiAocm9vdEVuZCA9PT0gLTEpIHJldHVybiBcIi5cIjtcbiAgICBlbHNlIGVuZCA9IHJvb3RFbmQ7XG4gIH1cbiAgcmV0dXJuIHBhdGguc2xpY2UoMCwgZW5kKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJhc2VuYW1lKHBhdGg6IHN0cmluZywgZXh0ID0gXCJcIik6IHN0cmluZyB7XG4gIGlmIChleHQgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZXh0ICE9PSBcInN0cmluZ1wiKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJleHRcIiBhcmd1bWVudCBtdXN0IGJlIGEgc3RyaW5nJyk7XG4gIH1cblxuICBhc3NlcnRQYXRoKHBhdGgpO1xuXG4gIGxldCBzdGFydCA9IDA7XG4gIGxldCBlbmQgPSAtMTtcbiAgbGV0IG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gIGxldCBpOiBudW1iZXI7XG5cbiAgLy8gQ2hlY2sgZm9yIGEgZHJpdmUgbGV0dGVyIHByZWZpeCBzbyBhcyBub3QgdG8gbWlzdGFrZSB0aGUgZm9sbG93aW5nXG4gIC8vIHBhdGggc2VwYXJhdG9yIGFzIGFuIGV4dHJhIHNlcGFyYXRvciBhdCB0aGUgZW5kIG9mIHRoZSBwYXRoIHRoYXQgY2FuIGJlXG4gIC8vIGRpc3JlZ2FyZGVkXG4gIGlmIChwYXRoLmxlbmd0aCA+PSAyKSB7XG4gICAgY29uc3QgZHJpdmUgPSBwYXRoLmNoYXJDb2RlQXQoMCk7XG4gICAgaWYgKGlzV2luZG93c0RldmljZVJvb3QoZHJpdmUpKSB7XG4gICAgICBpZiAocGF0aC5jaGFyQ29kZUF0KDEpID09PSBDSEFSX0NPTE9OKSBzdGFydCA9IDI7XG4gICAgfVxuICB9XG5cbiAgaWYgKGV4dCAhPT0gdW5kZWZpbmVkICYmIGV4dC5sZW5ndGggPiAwICYmIGV4dC5sZW5ndGggPD0gcGF0aC5sZW5ndGgpIHtcbiAgICBpZiAoZXh0Lmxlbmd0aCA9PT0gcGF0aC5sZW5ndGggJiYgZXh0ID09PSBwYXRoKSByZXR1cm4gXCJcIjtcbiAgICBsZXQgZXh0SWR4ID0gZXh0Lmxlbmd0aCAtIDE7XG4gICAgbGV0IGZpcnN0Tm9uU2xhc2hFbmQgPSAtMTtcbiAgICBmb3IgKGkgPSBwYXRoLmxlbmd0aCAtIDE7IGkgPj0gc3RhcnQ7IC0taSkge1xuICAgICAgY29uc3QgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSkpIHtcbiAgICAgICAgLy8gSWYgd2UgcmVhY2hlZCBhIHBhdGggc2VwYXJhdG9yIHRoYXQgd2FzIG5vdCBwYXJ0IG9mIGEgc2V0IG9mIHBhdGhcbiAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgICAgc3RhcnQgPSBpICsgMTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGZpcnN0Tm9uU2xhc2hFbmQgPT09IC0xKSB7XG4gICAgICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIHJlbWVtYmVyIHRoaXMgaW5kZXggaW4gY2FzZVxuICAgICAgICAgIC8vIHdlIG5lZWQgaXQgaWYgdGhlIGV4dGVuc2lvbiBlbmRzIHVwIG5vdCBtYXRjaGluZ1xuICAgICAgICAgIG1hdGNoZWRTbGFzaCA9IGZhbHNlO1xuICAgICAgICAgIGZpcnN0Tm9uU2xhc2hFbmQgPSBpICsgMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXh0SWR4ID49IDApIHtcbiAgICAgICAgICAvLyBUcnkgdG8gbWF0Y2ggdGhlIGV4cGxpY2l0IGV4dGVuc2lvblxuICAgICAgICAgIGlmIChjb2RlID09PSBleHQuY2hhckNvZGVBdChleHRJZHgpKSB7XG4gICAgICAgICAgICBpZiAoLS1leHRJZHggPT09IC0xKSB7XG4gICAgICAgICAgICAgIC8vIFdlIG1hdGNoZWQgdGhlIGV4dGVuc2lvbiwgc28gbWFyayB0aGlzIGFzIHRoZSBlbmQgb2Ygb3VyIHBhdGhcbiAgICAgICAgICAgICAgLy8gY29tcG9uZW50XG4gICAgICAgICAgICAgIGVuZCA9IGk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEV4dGVuc2lvbiBkb2VzIG5vdCBtYXRjaCwgc28gb3VyIHJlc3VsdCBpcyB0aGUgZW50aXJlIHBhdGhcbiAgICAgICAgICAgIC8vIGNvbXBvbmVudFxuICAgICAgICAgICAgZXh0SWR4ID0gLTE7XG4gICAgICAgICAgICBlbmQgPSBmaXJzdE5vblNsYXNoRW5kO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdGFydCA9PT0gZW5kKSBlbmQgPSBmaXJzdE5vblNsYXNoRW5kO1xuICAgIGVsc2UgaWYgKGVuZCA9PT0gLTEpIGVuZCA9IHBhdGgubGVuZ3RoO1xuICAgIHJldHVybiBwYXRoLnNsaWNlKHN0YXJ0LCBlbmQpO1xuICB9IGVsc2Uge1xuICAgIGZvciAoaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSBzdGFydDsgLS1pKSB7XG4gICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChpKSkpIHtcbiAgICAgICAgLy8gSWYgd2UgcmVhY2hlZCBhIHBhdGggc2VwYXJhdG9yIHRoYXQgd2FzIG5vdCBwYXJ0IG9mIGEgc2V0IG9mIHBhdGhcbiAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgICAgc3RhcnQgPSBpICsgMTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChlbmQgPT09IC0xKSB7XG4gICAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yLCBtYXJrIHRoaXMgYXMgdGhlIGVuZCBvZiBvdXJcbiAgICAgICAgLy8gcGF0aCBjb21wb25lbnRcbiAgICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgICAgIGVuZCA9IGkgKyAxO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlbmQgPT09IC0xKSByZXR1cm4gXCJcIjtcbiAgICByZXR1cm4gcGF0aC5zbGljZShzdGFydCwgZW5kKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXh0bmFtZShwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBhc3NlcnRQYXRoKHBhdGgpO1xuICBsZXQgc3RhcnQgPSAwO1xuICBsZXQgc3RhcnREb3QgPSAtMTtcbiAgbGV0IHN0YXJ0UGFydCA9IDA7XG4gIGxldCBlbmQgPSAtMTtcbiAgbGV0IG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gIC8vIFRyYWNrIHRoZSBzdGF0ZSBvZiBjaGFyYWN0ZXJzIChpZiBhbnkpIHdlIHNlZSBiZWZvcmUgb3VyIGZpcnN0IGRvdCBhbmRcbiAgLy8gYWZ0ZXIgYW55IHBhdGggc2VwYXJhdG9yIHdlIGZpbmRcbiAgbGV0IHByZURvdFN0YXRlID0gMDtcblxuICAvLyBDaGVjayBmb3IgYSBkcml2ZSBsZXR0ZXIgcHJlZml4IHNvIGFzIG5vdCB0byBtaXN0YWtlIHRoZSBmb2xsb3dpbmdcbiAgLy8gcGF0aCBzZXBhcmF0b3IgYXMgYW4gZXh0cmEgc2VwYXJhdG9yIGF0IHRoZSBlbmQgb2YgdGhlIHBhdGggdGhhdCBjYW4gYmVcbiAgLy8gZGlzcmVnYXJkZWRcblxuICBpZiAoXG4gICAgcGF0aC5sZW5ndGggPj0gMiAmJlxuICAgIHBhdGguY2hhckNvZGVBdCgxKSA9PT0gQ0hBUl9DT0xPTiAmJlxuICAgIGlzV2luZG93c0RldmljZVJvb3QocGF0aC5jaGFyQ29kZUF0KDApKVxuICApIHtcbiAgICBzdGFydCA9IHN0YXJ0UGFydCA9IDI7XG4gIH1cblxuICBmb3IgKGxldCBpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IHN0YXJ0OyAtLWkpIHtcbiAgICBjb25zdCBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KGkpO1xuICAgIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSkpIHtcbiAgICAgIC8vIElmIHdlIHJlYWNoZWQgYSBwYXRoIHNlcGFyYXRvciB0aGF0IHdhcyBub3QgcGFydCBvZiBhIHNldCBvZiBwYXRoXG4gICAgICAvLyBzZXBhcmF0b3JzIGF0IHRoZSBlbmQgb2YgdGhlIHN0cmluZywgc3RvcCBub3dcbiAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgIHN0YXJ0UGFydCA9IGkgKyAxO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoZW5kID09PSAtMSkge1xuICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIG1hcmsgdGhpcyBhcyB0aGUgZW5kIG9mIG91clxuICAgICAgLy8gZXh0ZW5zaW9uXG4gICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgIGVuZCA9IGkgKyAxO1xuICAgIH1cbiAgICBpZiAoY29kZSA9PT0gQ0hBUl9ET1QpIHtcbiAgICAgIC8vIElmIHRoaXMgaXMgb3VyIGZpcnN0IGRvdCwgbWFyayBpdCBhcyB0aGUgc3RhcnQgb2Ygb3VyIGV4dGVuc2lvblxuICAgICAgaWYgKHN0YXJ0RG90ID09PSAtMSkgc3RhcnREb3QgPSBpO1xuICAgICAgZWxzZSBpZiAocHJlRG90U3RhdGUgIT09IDEpIHByZURvdFN0YXRlID0gMTtcbiAgICB9IGVsc2UgaWYgKHN0YXJ0RG90ICE9PSAtMSkge1xuICAgICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBhbmQgbm9uLXBhdGggc2VwYXJhdG9yIGJlZm9yZSBvdXIgZG90LCBzbyB3ZSBzaG91bGRcbiAgICAgIC8vIGhhdmUgYSBnb29kIGNoYW5jZSBhdCBoYXZpbmcgYSBub24tZW1wdHkgZXh0ZW5zaW9uXG4gICAgICBwcmVEb3RTdGF0ZSA9IC0xO1xuICAgIH1cbiAgfVxuXG4gIGlmIChcbiAgICBzdGFydERvdCA9PT0gLTEgfHxcbiAgICBlbmQgPT09IC0xIHx8XG4gICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBjaGFyYWN0ZXIgaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBkb3RcbiAgICBwcmVEb3RTdGF0ZSA9PT0gMCB8fFxuICAgIC8vIFRoZSAocmlnaHQtbW9zdCkgdHJpbW1lZCBwYXRoIGNvbXBvbmVudCBpcyBleGFjdGx5ICcuLidcbiAgICAocHJlRG90U3RhdGUgPT09IDEgJiYgc3RhcnREb3QgPT09IGVuZCAtIDEgJiYgc3RhcnREb3QgPT09IHN0YXJ0UGFydCArIDEpXG4gICkge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG4gIHJldHVybiBwYXRoLnNsaWNlKHN0YXJ0RG90LCBlbmQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0KHBhdGhPYmplY3Q6IEZvcm1hdElucHV0UGF0aE9iamVjdCk6IHN0cmluZyB7XG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbiAgaWYgKHBhdGhPYmplY3QgPT09IG51bGwgfHwgdHlwZW9mIHBhdGhPYmplY3QgIT09IFwib2JqZWN0XCIpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgYFRoZSBcInBhdGhPYmplY3RcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgT2JqZWN0LiBSZWNlaXZlZCB0eXBlICR7dHlwZW9mIHBhdGhPYmplY3R9YCxcbiAgICApO1xuICB9XG4gIHJldHVybiBfZm9ybWF0KFwiXFxcXFwiLCBwYXRoT2JqZWN0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlKHBhdGg6IHN0cmluZyk6IFBhcnNlZFBhdGgge1xuICBhc3NlcnRQYXRoKHBhdGgpO1xuXG4gIGNvbnN0IHJldDogUGFyc2VkUGF0aCA9IHsgcm9vdDogXCJcIiwgZGlyOiBcIlwiLCBiYXNlOiBcIlwiLCBleHQ6IFwiXCIsIG5hbWU6IFwiXCIgfTtcblxuICBjb25zdCBsZW4gPSBwYXRoLmxlbmd0aDtcbiAgaWYgKGxlbiA9PT0gMCkgcmV0dXJuIHJldDtcblxuICBsZXQgcm9vdEVuZCA9IDA7XG4gIGxldCBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KDApO1xuXG4gIC8vIFRyeSB0byBtYXRjaCBhIHJvb3RcbiAgaWYgKGxlbiA+IDEpIHtcbiAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKGNvZGUpKSB7XG4gICAgICAvLyBQb3NzaWJsZSBVTkMgcm9vdFxuXG4gICAgICByb290RW5kID0gMTtcbiAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KDEpKSkge1xuICAgICAgICAvLyBNYXRjaGVkIGRvdWJsZSBwYXRoIHNlcGFyYXRvciBhdCBiZWdpbm5pbmdcbiAgICAgICAgbGV0IGogPSAyO1xuICAgICAgICBsZXQgbGFzdCA9IGo7XG4gICAgICAgIC8vIE1hdGNoIDEgb3IgbW9yZSBub24tcGF0aCBzZXBhcmF0b3JzXG4gICAgICAgIGZvciAoOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChqKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChqIDwgbGVuICYmIGogIT09IGxhc3QpIHtcbiAgICAgICAgICAvLyBNYXRjaGVkIVxuICAgICAgICAgIGxhc3QgPSBqO1xuICAgICAgICAgIC8vIE1hdGNoIDEgb3IgbW9yZSBwYXRoIHNlcGFyYXRvcnNcbiAgICAgICAgICBmb3IgKDsgaiA8IGxlbjsgKytqKSB7XG4gICAgICAgICAgICBpZiAoIWlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoaikpKSBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGogPCBsZW4gJiYgaiAhPT0gbGFzdCkge1xuICAgICAgICAgICAgLy8gTWF0Y2hlZCFcbiAgICAgICAgICAgIGxhc3QgPSBqO1xuICAgICAgICAgICAgLy8gTWF0Y2ggMSBvciBtb3JlIG5vbi1wYXRoIHNlcGFyYXRvcnNcbiAgICAgICAgICAgIGZvciAoOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoaikpKSBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChqID09PSBsZW4pIHtcbiAgICAgICAgICAgICAgLy8gV2UgbWF0Y2hlZCBhIFVOQyByb290IG9ubHlcblxuICAgICAgICAgICAgICByb290RW5kID0gajtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaiAhPT0gbGFzdCkge1xuICAgICAgICAgICAgICAvLyBXZSBtYXRjaGVkIGEgVU5DIHJvb3Qgd2l0aCBsZWZ0b3ZlcnNcblxuICAgICAgICAgICAgICByb290RW5kID0gaiArIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1dpbmRvd3NEZXZpY2VSb290KGNvZGUpKSB7XG4gICAgICAvLyBQb3NzaWJsZSBkZXZpY2Ugcm9vdFxuXG4gICAgICBpZiAocGF0aC5jaGFyQ29kZUF0KDEpID09PSBDSEFSX0NPTE9OKSB7XG4gICAgICAgIHJvb3RFbmQgPSAyO1xuICAgICAgICBpZiAobGVuID4gMikge1xuICAgICAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KDIpKSkge1xuICAgICAgICAgICAgaWYgKGxlbiA9PT0gMykge1xuICAgICAgICAgICAgICAvLyBgcGF0aGAgY29udGFpbnMganVzdCBhIGRyaXZlIHJvb3QsIGV4aXQgZWFybHkgdG8gYXZvaWRcbiAgICAgICAgICAgICAgLy8gdW5uZWNlc3Nhcnkgd29ya1xuICAgICAgICAgICAgICByZXQucm9vdCA9IHJldC5kaXIgPSBwYXRoO1xuICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcm9vdEVuZCA9IDM7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGBwYXRoYCBjb250YWlucyBqdXN0IGEgZHJpdmUgcm9vdCwgZXhpdCBlYXJseSB0byBhdm9pZFxuICAgICAgICAgIC8vIHVubmVjZXNzYXJ5IHdvcmtcbiAgICAgICAgICByZXQucm9vdCA9IHJldC5kaXIgPSBwYXRoO1xuICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNQYXRoU2VwYXJhdG9yKGNvZGUpKSB7XG4gICAgLy8gYHBhdGhgIGNvbnRhaW5zIGp1c3QgYSBwYXRoIHNlcGFyYXRvciwgZXhpdCBlYXJseSB0byBhdm9pZFxuICAgIC8vIHVubmVjZXNzYXJ5IHdvcmtcbiAgICByZXQucm9vdCA9IHJldC5kaXIgPSBwYXRoO1xuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICBpZiAocm9vdEVuZCA+IDApIHJldC5yb290ID0gcGF0aC5zbGljZSgwLCByb290RW5kKTtcblxuICBsZXQgc3RhcnREb3QgPSAtMTtcbiAgbGV0IHN0YXJ0UGFydCA9IHJvb3RFbmQ7XG4gIGxldCBlbmQgPSAtMTtcbiAgbGV0IG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gIGxldCBpID0gcGF0aC5sZW5ndGggLSAxO1xuXG4gIC8vIFRyYWNrIHRoZSBzdGF0ZSBvZiBjaGFyYWN0ZXJzIChpZiBhbnkpIHdlIHNlZSBiZWZvcmUgb3VyIGZpcnN0IGRvdCBhbmRcbiAgLy8gYWZ0ZXIgYW55IHBhdGggc2VwYXJhdG9yIHdlIGZpbmRcbiAgbGV0IHByZURvdFN0YXRlID0gMDtcblxuICAvLyBHZXQgbm9uLWRpciBpbmZvXG4gIGZvciAoOyBpID49IHJvb3RFbmQ7IC0taSkge1xuICAgIGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoaSk7XG4gICAgaWYgKGlzUGF0aFNlcGFyYXRvcihjb2RlKSkge1xuICAgICAgLy8gSWYgd2UgcmVhY2hlZCBhIHBhdGggc2VwYXJhdG9yIHRoYXQgd2FzIG5vdCBwYXJ0IG9mIGEgc2V0IG9mIHBhdGhcbiAgICAgIC8vIHNlcGFyYXRvcnMgYXQgdGhlIGVuZCBvZiB0aGUgc3RyaW5nLCBzdG9wIG5vd1xuICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgc3RhcnRQYXJ0ID0gaSArIDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChlbmQgPT09IC0xKSB7XG4gICAgICAvLyBXZSBzYXcgdGhlIGZpcnN0IG5vbi1wYXRoIHNlcGFyYXRvciwgbWFyayB0aGlzIGFzIHRoZSBlbmQgb2Ygb3VyXG4gICAgICAvLyBleHRlbnNpb25cbiAgICAgIG1hdGNoZWRTbGFzaCA9IGZhbHNlO1xuICAgICAgZW5kID0gaSArIDE7XG4gICAgfVxuICAgIGlmIChjb2RlID09PSBDSEFSX0RPVCkge1xuICAgICAgLy8gSWYgdGhpcyBpcyBvdXIgZmlyc3QgZG90LCBtYXJrIGl0IGFzIHRoZSBzdGFydCBvZiBvdXIgZXh0ZW5zaW9uXG4gICAgICBpZiAoc3RhcnREb3QgPT09IC0xKSBzdGFydERvdCA9IGk7XG4gICAgICBlbHNlIGlmIChwcmVEb3RTdGF0ZSAhPT0gMSkgcHJlRG90U3RhdGUgPSAxO1xuICAgIH0gZWxzZSBpZiAoc3RhcnREb3QgIT09IC0xKSB7XG4gICAgICAvLyBXZSBzYXcgYSBub24tZG90IGFuZCBub24tcGF0aCBzZXBhcmF0b3IgYmVmb3JlIG91ciBkb3QsIHNvIHdlIHNob3VsZFxuICAgICAgLy8gaGF2ZSBhIGdvb2QgY2hhbmNlIGF0IGhhdmluZyBhIG5vbi1lbXB0eSBleHRlbnNpb25cbiAgICAgIHByZURvdFN0YXRlID0gLTE7XG4gICAgfVxuICB9XG5cbiAgaWYgKFxuICAgIHN0YXJ0RG90ID09PSAtMSB8fFxuICAgIGVuZCA9PT0gLTEgfHxcbiAgICAvLyBXZSBzYXcgYSBub24tZG90IGNoYXJhY3RlciBpbW1lZGlhdGVseSBiZWZvcmUgdGhlIGRvdFxuICAgIHByZURvdFN0YXRlID09PSAwIHx8XG4gICAgLy8gVGhlIChyaWdodC1tb3N0KSB0cmltbWVkIHBhdGggY29tcG9uZW50IGlzIGV4YWN0bHkgJy4uJ1xuICAgIChwcmVEb3RTdGF0ZSA9PT0gMSAmJiBzdGFydERvdCA9PT0gZW5kIC0gMSAmJiBzdGFydERvdCA9PT0gc3RhcnRQYXJ0ICsgMSlcbiAgKSB7XG4gICAgaWYgKGVuZCAhPT0gLTEpIHtcbiAgICAgIHJldC5iYXNlID0gcmV0Lm5hbWUgPSBwYXRoLnNsaWNlKHN0YXJ0UGFydCwgZW5kKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0Lm5hbWUgPSBwYXRoLnNsaWNlKHN0YXJ0UGFydCwgc3RhcnREb3QpO1xuICAgIHJldC5iYXNlID0gcGF0aC5zbGljZShzdGFydFBhcnQsIGVuZCk7XG4gICAgcmV0LmV4dCA9IHBhdGguc2xpY2Uoc3RhcnREb3QsIGVuZCk7XG4gIH1cblxuICAvLyBJZiB0aGUgZGlyZWN0b3J5IGlzIHRoZSByb290LCB1c2UgdGhlIGVudGlyZSByb290IGFzIHRoZSBgZGlyYCBpbmNsdWRpbmdcbiAgLy8gdGhlIHRyYWlsaW5nIHNsYXNoIGlmIGFueSAoYEM6XFxhYmNgIC0+IGBDOlxcYCkuIE90aGVyd2lzZSwgc3RyaXAgb3V0IHRoZVxuICAvLyB0cmFpbGluZyBzbGFzaCAoYEM6XFxhYmNcXGRlZmAgLT4gYEM6XFxhYmNgKS5cbiAgaWYgKHN0YXJ0UGFydCA+IDAgJiYgc3RhcnRQYXJ0ICE9PSByb290RW5kKSB7XG4gICAgcmV0LmRpciA9IHBhdGguc2xpY2UoMCwgc3RhcnRQYXJ0IC0gMSk7XG4gIH0gZWxzZSByZXQuZGlyID0gcmV0LnJvb3Q7XG5cbiAgcmV0dXJuIHJldDtcbn1cblxuLyoqIENvbnZlcnRzIGEgZmlsZSBVUkwgdG8gYSBwYXRoIHN0cmluZy5cbiAqXG4gKiAgICAgIGZyb21GaWxlVXJsKFwiZmlsZTovLy9ob21lL2Zvb1wiKTsgLy8gXCJcXFxcaG9tZVxcXFxmb29cIlxuICogICAgICBmcm9tRmlsZVVybChcImZpbGU6Ly8vQzovVXNlcnMvZm9vXCIpOyAvLyBcIkM6XFxcXFVzZXJzXFxcXGZvb1wiXG4gKiAgICAgIGZyb21GaWxlVXJsKFwiZmlsZTovL2xvY2FsaG9zdC9ob21lL2Zvb1wiKTsgLy8gXCJcXFxcXFxcXGxvY2FsaG9zdFxcXFxob21lXFxcXGZvb1wiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmcm9tRmlsZVVybCh1cmw6IHN0cmluZyB8IFVSTCk6IHN0cmluZyB7XG4gIHVybCA9IHVybCBpbnN0YW5jZW9mIFVSTCA/IHVybCA6IG5ldyBVUkwodXJsKTtcbiAgaWYgKHVybC5wcm90b2NvbCAhPSBcImZpbGU6XCIpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiTXVzdCBiZSBhIGZpbGUgVVJMLlwiKTtcbiAgfVxuICBsZXQgcGF0aCA9IGRlY29kZVVSSUNvbXBvbmVudChcbiAgICB1cmwucGF0aG5hbWVcbiAgICAgIC5yZXBsYWNlKC9eXFwvKihbQS1aYS16XTopKFxcL3wkKS8sIFwiJDEvXCIpXG4gICAgICAucmVwbGFjZSgvXFwvL2csIFwiXFxcXFwiKVxuICAgICAgLnJlcGxhY2UoLyUoPyFbMC05QS1GYS1mXXsyfSkvZywgXCIlMjVcIiksXG4gICk7XG4gIGlmICh1cmwuaG9zdG5hbWUgIT0gXCJcIikge1xuICAgIC8vIE5vdGU6IFRoZSBgVVJMYCBpbXBsZW1lbnRhdGlvbiBndWFyYW50ZWVzIHRoYXQgdGhlIGRyaXZlIGxldHRlciBhbmRcbiAgICAvLyBob3N0bmFtZSBhcmUgbXV0dWFsbHkgZXhjbHVzaXZlLiBPdGhlcndpc2UgaXQgd291bGQgbm90IGhhdmUgYmVlbiB2YWxpZFxuICAgIC8vIHRvIGFwcGVuZCB0aGUgaG9zdG5hbWUgYW5kIHBhdGggbGlrZSB0aGlzLlxuICAgIHBhdGggPSBgXFxcXFxcXFwke3VybC5ob3N0bmFtZX0ke3BhdGh9YDtcbiAgfVxuICByZXR1cm4gcGF0aDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FNRSxRQUFRLEVBQ1IsbUJBQW1CLEVBQ25CLFVBQVUsRUFDVixrQkFBa0IsU0FDYixlQUFpQjtTQUd0QixVQUFVLEVBQ1YsZUFBZSxFQUNmLG1CQUFtQixFQUNuQixlQUFlLEVBQ2YsT0FBTyxTQUNGLFVBQVk7U0FDVixNQUFNLFNBQVEsa0JBQW9CO2FBRTlCLEdBQUcsSUFBRyxFQUFJO2FBQ1YsU0FBUyxJQUFHLENBQUc7Z0JBRVosT0FBTyxJQUFJLFlBQVk7UUFDakMsY0FBYztRQUNkLFlBQVk7UUFDWixnQkFBZ0IsR0FBRyxLQUFLO1lBRW5CLENBQUMsR0FBRyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDMUMsSUFBSTtZQUNKLENBQUMsSUFBSSxDQUFDO1lBQ1Is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
