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
/**
 * Resolves path segments into a `path`
 * @param pathSegments to process to path
 */ export function resolve(...pathSegments) {
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
/**
 * Normalizes a `path`
 * @param path to normalize
 */ export function normalize(path) {
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
/**
 * Verifies whether path is absolute
 * @param path to verify
 */ export function isAbsolute(path) {
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
/**
 * Join all given a sequence of `paths`,then normalizes the resulting path.
 * @param paths to be joined and normalized
 */ export function join(...paths) {
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
/**
 * It will solve the relative path from `from` to `to`, for instance:
 *  from = 'C:\\orandea\\test\\aaa'
 *  to = 'C:\\orandea\\impl\\bbb'
 * The output of the function should be: '..\\..\\impl\\bbb'
 * @param from relative path
 * @param to relative path
 */ export function relative(from, to) {
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
/**
 * Resolves path to a namespace path
 * @param path to resolve to namespace
 */ export function toNamespacedPath(path) {
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
/**
 * Return the directory name of a `path`.
 * @param path to determine name for
 */ export function dirname(path) {
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
/**
 * Return the last portion of a `path`. Trailing directory separators are ignored.
 * @param path to process
 * @param ext of path directory
 */ export function basename(path, ext = "") {
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
/**
 * Return the extension of the `path`.
 * @param path with extension
 */ export function extname(path) {
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
/**
 * Generate a path from `FormatInputPathObject` object.
 * @param pathObject with path
 */ export function format(pathObject) {
  if (pathObject === null || typeof pathObject !== "object") {
    throw new TypeError(
      `The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`,
    );
  }
  return _format("\\", pathObject);
}
/**
 * Return a `ParsedPath` object of the `path`.
 * @param path to process
 */ export function parse(path) {
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
/**
 * Converts a file URL to a path string.
 *
 *      fromFileUrl("file:///home/foo"); // "\\home\\foo"
 *      fromFileUrl("file:///C:/Users/foo"); // "C:\\Users\\foo"
 *      fromFileUrl("file://localhost/home/foo"); // "\\\\localhost\\home\\foo"
 * @param url of a file URL
 */ export function fromFileUrl(url) {
  url = url instanceof URL ? url : new URL(url);
  if (url.protocol != "file:") {
    throw new TypeError("Must be a file URL.");
  }
  let path = decodeURIComponent(
    url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25"),
  ).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
  if (url.hostname != "") {
    // Note: The `URL` implementation guarantees that the drive letter and
    // hostname are mutually exclusive. Otherwise it would not have been valid
    // to append the hostname and path like this.
    path = `\\\\${url.hostname}${path}`;
  }
  return path;
}
/**
 * Converts a path string to a file URL.
 *
 *      toFileUrl("\\home\\foo"); // new URL("file:///home/foo")
 *      toFileUrl("C:\\Users\\foo"); // new URL("file:///C:/Users/foo")
 *      toFileUrl("\\\\localhost\\home\\foo"); // new URL("file://localhost/home/foo")
 * @param path to convert to file URL
 */ export function toFileUrl(path) {
  if (!isAbsolute(path)) {
    throw new TypeError("Must be an absolute path.");
  }
  const [, hostname, pathname] = path.match(
    /^(?:[/\\]{2}([^/\\]+)(?=[/\\][^/\\]))?(.*)/,
  );
  const url = new URL("file:///");
  url.pathname = pathname.replace(/%/g, "%25");
  if (hostname != null) {
    url.hostname = hostname;
    if (!url.hostname) {
      throw new TypeError("Invalid hostname.");
    }
  }
  return url;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC43OS4wL3BhdGgvd2luMzIudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCB0aGUgQnJvd3NlcmlmeSBhdXRob3JzLiBNSVQgTGljZW5zZS5cbi8vIFBvcnRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9icm93c2VyaWZ5L3BhdGgtYnJvd3NlcmlmeS9cbi8qKiBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuICovXG5pbXBvcnQgdHlwZSB7IEZvcm1hdElucHV0UGF0aE9iamVjdCwgUGFyc2VkUGF0aCB9IGZyb20gXCIuL19pbnRlcmZhY2UudHNcIjtcbmltcG9ydCB7XG4gIENIQVJfQkFDS1dBUkRfU0xBU0gsXG4gIENIQVJfQ09MT04sXG4gIENIQVJfRE9ULFxuICBDSEFSX1FVRVNUSU9OX01BUkssXG59IGZyb20gXCIuL19jb25zdGFudHMudHNcIjtcblxuaW1wb3J0IHtcbiAgX2Zvcm1hdCxcbiAgYXNzZXJ0UGF0aCxcbiAgaXNQYXRoU2VwYXJhdG9yLFxuICBpc1dpbmRvd3NEZXZpY2VSb290LFxuICBub3JtYWxpemVTdHJpbmcsXG59IGZyb20gXCIuL191dGlsLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vX3V0aWwvYXNzZXJ0LnRzXCI7XG5cbmV4cG9ydCBjb25zdCBzZXAgPSBcIlxcXFxcIjtcbmV4cG9ydCBjb25zdCBkZWxpbWl0ZXIgPSBcIjtcIjtcblxuLyoqXG4gKiBSZXNvbHZlcyBwYXRoIHNlZ21lbnRzIGludG8gYSBgcGF0aGBcbiAqIEBwYXJhbSBwYXRoU2VnbWVudHMgdG8gcHJvY2VzcyB0byBwYXRoXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlKC4uLnBhdGhTZWdtZW50czogc3RyaW5nW10pOiBzdHJpbmcge1xuICBsZXQgcmVzb2x2ZWREZXZpY2UgPSBcIlwiO1xuICBsZXQgcmVzb2x2ZWRUYWlsID0gXCJcIjtcbiAgbGV0IHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcblxuICBmb3IgKGxldCBpID0gcGF0aFNlZ21lbnRzLmxlbmd0aCAtIDE7IGkgPj0gLTE7IGktLSkge1xuICAgIGxldCBwYXRoOiBzdHJpbmc7XG4gICAgaWYgKGkgPj0gMCkge1xuICAgICAgcGF0aCA9IHBhdGhTZWdtZW50c1tpXTtcbiAgICB9IGVsc2UgaWYgKCFyZXNvbHZlZERldmljZSkge1xuICAgICAgaWYgKGdsb2JhbFRoaXMuRGVubyA9PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJSZXNvbHZlZCBhIGRyaXZlLWxldHRlci1sZXNzIHBhdGggd2l0aG91dCBhIENXRC5cIik7XG4gICAgICB9XG4gICAgICBwYXRoID0gRGVuby5jd2QoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGdsb2JhbFRoaXMuRGVubyA9PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJSZXNvbHZlZCBhIHJlbGF0aXZlIHBhdGggd2l0aG91dCBhIENXRC5cIik7XG4gICAgICB9XG4gICAgICAvLyBXaW5kb3dzIGhhcyB0aGUgY29uY2VwdCBvZiBkcml2ZS1zcGVjaWZpYyBjdXJyZW50IHdvcmtpbmdcbiAgICAgIC8vIGRpcmVjdG9yaWVzLiBJZiB3ZSd2ZSByZXNvbHZlZCBhIGRyaXZlIGxldHRlciBidXQgbm90IHlldCBhblxuICAgICAgLy8gYWJzb2x1dGUgcGF0aCwgZ2V0IGN3ZCBmb3IgdGhhdCBkcml2ZSwgb3IgdGhlIHByb2Nlc3MgY3dkIGlmXG4gICAgICAvLyB0aGUgZHJpdmUgY3dkIGlzIG5vdCBhdmFpbGFibGUuIFdlJ3JlIHN1cmUgdGhlIGRldmljZSBpcyBub3RcbiAgICAgIC8vIGEgVU5DIHBhdGggYXQgdGhpcyBwb2ludHMsIGJlY2F1c2UgVU5DIHBhdGhzIGFyZSBhbHdheXMgYWJzb2x1dGUuXG4gICAgICBwYXRoID0gRGVuby5lbnYuZ2V0KGA9JHtyZXNvbHZlZERldmljZX1gKSB8fCBEZW5vLmN3ZCgpO1xuXG4gICAgICAvLyBWZXJpZnkgdGhhdCBhIGN3ZCB3YXMgZm91bmQgYW5kIHRoYXQgaXQgYWN0dWFsbHkgcG9pbnRzXG4gICAgICAvLyB0byBvdXIgZHJpdmUuIElmIG5vdCwgZGVmYXVsdCB0byB0aGUgZHJpdmUncyByb290LlxuICAgICAgaWYgKFxuICAgICAgICBwYXRoID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgcGF0aC5zbGljZSgwLCAzKS50b0xvd2VyQ2FzZSgpICE9PSBgJHtyZXNvbHZlZERldmljZS50b0xvd2VyQ2FzZSgpfVxcXFxgXG4gICAgICApIHtcbiAgICAgICAgcGF0aCA9IGAke3Jlc29sdmVkRGV2aWNlfVxcXFxgO1xuICAgICAgfVxuICAgIH1cblxuICAgIGFzc2VydFBhdGgocGF0aCk7XG5cbiAgICBjb25zdCBsZW4gPSBwYXRoLmxlbmd0aDtcblxuICAgIC8vIFNraXAgZW1wdHkgZW50cmllc1xuICAgIGlmIChsZW4gPT09IDApIGNvbnRpbnVlO1xuXG4gICAgbGV0IHJvb3RFbmQgPSAwO1xuICAgIGxldCBkZXZpY2UgPSBcIlwiO1xuICAgIGxldCBpc0Fic29sdXRlID0gZmFsc2U7XG4gICAgY29uc3QgY29kZSA9IHBhdGguY2hhckNvZGVBdCgwKTtcblxuICAgIC8vIFRyeSB0byBtYXRjaCBhIHJvb3RcbiAgICBpZiAobGVuID4gMSkge1xuICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihjb2RlKSkge1xuICAgICAgICAvLyBQb3NzaWJsZSBVTkMgcm9vdFxuXG4gICAgICAgIC8vIElmIHdlIHN0YXJ0ZWQgd2l0aCBhIHNlcGFyYXRvciwgd2Uga25vdyB3ZSBhdCBsZWFzdCBoYXZlIGFuXG4gICAgICAgIC8vIGFic29sdXRlIHBhdGggb2Ygc29tZSBraW5kIChVTkMgb3Igb3RoZXJ3aXNlKVxuICAgICAgICBpc0Fic29sdXRlID0gdHJ1ZTtcblxuICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdCgxKSkpIHtcbiAgICAgICAgICAvLyBNYXRjaGVkIGRvdWJsZSBwYXRoIHNlcGFyYXRvciBhdCBiZWdpbm5pbmdcbiAgICAgICAgICBsZXQgaiA9IDI7XG4gICAgICAgICAgbGV0IGxhc3QgPSBqO1xuICAgICAgICAgIC8vIE1hdGNoIDEgb3IgbW9yZSBub24tcGF0aCBzZXBhcmF0b3JzXG4gICAgICAgICAgZm9yICg7IGogPCBsZW47ICsraikge1xuICAgICAgICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoaikpKSBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGogPCBsZW4gJiYgaiAhPT0gbGFzdCkge1xuICAgICAgICAgICAgY29uc3QgZmlyc3RQYXJ0ID0gcGF0aC5zbGljZShsYXN0LCBqKTtcbiAgICAgICAgICAgIC8vIE1hdGNoZWQhXG4gICAgICAgICAgICBsYXN0ID0gajtcbiAgICAgICAgICAgIC8vIE1hdGNoIDEgb3IgbW9yZSBwYXRoIHNlcGFyYXRvcnNcbiAgICAgICAgICAgIGZvciAoOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgICAgICAgaWYgKCFpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KGopKSkgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaiA8IGxlbiAmJiBqICE9PSBsYXN0KSB7XG4gICAgICAgICAgICAgIC8vIE1hdGNoZWQhXG4gICAgICAgICAgICAgIGxhc3QgPSBqO1xuICAgICAgICAgICAgICAvLyBNYXRjaCAxIG9yIG1vcmUgbm9uLXBhdGggc2VwYXJhdG9yc1xuICAgICAgICAgICAgICBmb3IgKDsgaiA8IGxlbjsgKytqKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoaikpKSBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoaiA9PT0gbGVuKSB7XG4gICAgICAgICAgICAgICAgLy8gV2UgbWF0Y2hlZCBhIFVOQyByb290IG9ubHlcbiAgICAgICAgICAgICAgICBkZXZpY2UgPSBgXFxcXFxcXFwke2ZpcnN0UGFydH1cXFxcJHtwYXRoLnNsaWNlKGxhc3QpfWA7XG4gICAgICAgICAgICAgICAgcm9vdEVuZCA9IGo7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoaiAhPT0gbGFzdCkge1xuICAgICAgICAgICAgICAgIC8vIFdlIG1hdGNoZWQgYSBVTkMgcm9vdCB3aXRoIGxlZnRvdmVyc1xuXG4gICAgICAgICAgICAgICAgZGV2aWNlID0gYFxcXFxcXFxcJHtmaXJzdFBhcnR9XFxcXCR7cGF0aC5zbGljZShsYXN0LCBqKX1gO1xuICAgICAgICAgICAgICAgIHJvb3RFbmQgPSBqO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJvb3RFbmQgPSAxO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGlzV2luZG93c0RldmljZVJvb3QoY29kZSkpIHtcbiAgICAgICAgLy8gUG9zc2libGUgZGV2aWNlIHJvb3RcblxuICAgICAgICBpZiAocGF0aC5jaGFyQ29kZUF0KDEpID09PSBDSEFSX0NPTE9OKSB7XG4gICAgICAgICAgZGV2aWNlID0gcGF0aC5zbGljZSgwLCAyKTtcbiAgICAgICAgICByb290RW5kID0gMjtcbiAgICAgICAgICBpZiAobGVuID4gMikge1xuICAgICAgICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoMikpKSB7XG4gICAgICAgICAgICAgIC8vIFRyZWF0IHNlcGFyYXRvciBmb2xsb3dpbmcgZHJpdmUgbmFtZSBhcyBhbiBhYnNvbHV0ZSBwYXRoXG4gICAgICAgICAgICAgIC8vIGluZGljYXRvclxuICAgICAgICAgICAgICBpc0Fic29sdXRlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgcm9vdEVuZCA9IDM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSkpIHtcbiAgICAgIC8vIGBwYXRoYCBjb250YWlucyBqdXN0IGEgcGF0aCBzZXBhcmF0b3JcbiAgICAgIHJvb3RFbmQgPSAxO1xuICAgICAgaXNBYnNvbHV0ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgZGV2aWNlLmxlbmd0aCA+IDAgJiZcbiAgICAgIHJlc29sdmVkRGV2aWNlLmxlbmd0aCA+IDAgJiZcbiAgICAgIGRldmljZS50b0xvd2VyQ2FzZSgpICE9PSByZXNvbHZlZERldmljZS50b0xvd2VyQ2FzZSgpXG4gICAgKSB7XG4gICAgICAvLyBUaGlzIHBhdGggcG9pbnRzIHRvIGFub3RoZXIgZGV2aWNlIHNvIGl0IGlzIG5vdCBhcHBsaWNhYmxlXG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAocmVzb2x2ZWREZXZpY2UubGVuZ3RoID09PSAwICYmIGRldmljZS5sZW5ndGggPiAwKSB7XG4gICAgICByZXNvbHZlZERldmljZSA9IGRldmljZTtcbiAgICB9XG4gICAgaWYgKCFyZXNvbHZlZEFic29sdXRlKSB7XG4gICAgICByZXNvbHZlZFRhaWwgPSBgJHtwYXRoLnNsaWNlKHJvb3RFbmQpfVxcXFwke3Jlc29sdmVkVGFpbH1gO1xuICAgICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGlzQWJzb2x1dGU7XG4gICAgfVxuXG4gICAgaWYgKHJlc29sdmVkQWJzb2x1dGUgJiYgcmVzb2x2ZWREZXZpY2UubGVuZ3RoID4gMCkgYnJlYWs7XG4gIH1cblxuICAvLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCxcbiAgLy8gYnV0IGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBwcm9jZXNzLmN3ZCgpXG4gIC8vIGZhaWxzKVxuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgdGFpbCBwYXRoXG4gIHJlc29sdmVkVGFpbCA9IG5vcm1hbGl6ZVN0cmluZyhcbiAgICByZXNvbHZlZFRhaWwsXG4gICAgIXJlc29sdmVkQWJzb2x1dGUsXG4gICAgXCJcXFxcXCIsXG4gICAgaXNQYXRoU2VwYXJhdG9yLFxuICApO1xuXG4gIHJldHVybiByZXNvbHZlZERldmljZSArIChyZXNvbHZlZEFic29sdXRlID8gXCJcXFxcXCIgOiBcIlwiKSArIHJlc29sdmVkVGFpbCB8fCBcIi5cIjtcbn1cblxuLyoqXG4gKiBOb3JtYWxpemVzIGEgYHBhdGhgXG4gKiBAcGFyYW0gcGF0aCB0byBub3JtYWxpemVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZShwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBhc3NlcnRQYXRoKHBhdGgpO1xuICBjb25zdCBsZW4gPSBwYXRoLmxlbmd0aDtcbiAgaWYgKGxlbiA9PT0gMCkgcmV0dXJuIFwiLlwiO1xuICBsZXQgcm9vdEVuZCA9IDA7XG4gIGxldCBkZXZpY2U6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgbGV0IGlzQWJzb2x1dGUgPSBmYWxzZTtcbiAgY29uc3QgY29kZSA9IHBhdGguY2hhckNvZGVBdCgwKTtcblxuICAvLyBUcnkgdG8gbWF0Y2ggYSByb290XG4gIGlmIChsZW4gPiAxKSB7XG4gICAgaWYgKGlzUGF0aFNlcGFyYXRvcihjb2RlKSkge1xuICAgICAgLy8gUG9zc2libGUgVU5DIHJvb3RcblxuICAgICAgLy8gSWYgd2Ugc3RhcnRlZCB3aXRoIGEgc2VwYXJhdG9yLCB3ZSBrbm93IHdlIGF0IGxlYXN0IGhhdmUgYW4gYWJzb2x1dGVcbiAgICAgIC8vIHBhdGggb2Ygc29tZSBraW5kIChVTkMgb3Igb3RoZXJ3aXNlKVxuICAgICAgaXNBYnNvbHV0ZSA9IHRydWU7XG5cbiAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KDEpKSkge1xuICAgICAgICAvLyBNYXRjaGVkIGRvdWJsZSBwYXRoIHNlcGFyYXRvciBhdCBiZWdpbm5pbmdcbiAgICAgICAgbGV0IGogPSAyO1xuICAgICAgICBsZXQgbGFzdCA9IGo7XG4gICAgICAgIC8vIE1hdGNoIDEgb3IgbW9yZSBub24tcGF0aCBzZXBhcmF0b3JzXG4gICAgICAgIGZvciAoOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChqKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChqIDwgbGVuICYmIGogIT09IGxhc3QpIHtcbiAgICAgICAgICBjb25zdCBmaXJzdFBhcnQgPSBwYXRoLnNsaWNlKGxhc3QsIGopO1xuICAgICAgICAgIC8vIE1hdGNoZWQhXG4gICAgICAgICAgbGFzdCA9IGo7XG4gICAgICAgICAgLy8gTWF0Y2ggMSBvciBtb3JlIHBhdGggc2VwYXJhdG9yc1xuICAgICAgICAgIGZvciAoOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgICAgIGlmICghaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChqKSkpIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaiA8IGxlbiAmJiBqICE9PSBsYXN0KSB7XG4gICAgICAgICAgICAvLyBNYXRjaGVkIVxuICAgICAgICAgICAgbGFzdCA9IGo7XG4gICAgICAgICAgICAvLyBNYXRjaCAxIG9yIG1vcmUgbm9uLXBhdGggc2VwYXJhdG9yc1xuICAgICAgICAgICAgZm9yICg7IGogPCBsZW47ICsraikge1xuICAgICAgICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChqKSkpIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGogPT09IGxlbikge1xuICAgICAgICAgICAgICAvLyBXZSBtYXRjaGVkIGEgVU5DIHJvb3Qgb25seVxuICAgICAgICAgICAgICAvLyBSZXR1cm4gdGhlIG5vcm1hbGl6ZWQgdmVyc2lvbiBvZiB0aGUgVU5DIHJvb3Qgc2luY2UgdGhlcmVcbiAgICAgICAgICAgICAgLy8gaXMgbm90aGluZyBsZWZ0IHRvIHByb2Nlc3NcblxuICAgICAgICAgICAgICByZXR1cm4gYFxcXFxcXFxcJHtmaXJzdFBhcnR9XFxcXCR7cGF0aC5zbGljZShsYXN0KX1cXFxcYDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaiAhPT0gbGFzdCkge1xuICAgICAgICAgICAgICAvLyBXZSBtYXRjaGVkIGEgVU5DIHJvb3Qgd2l0aCBsZWZ0b3ZlcnNcblxuICAgICAgICAgICAgICBkZXZpY2UgPSBgXFxcXFxcXFwke2ZpcnN0UGFydH1cXFxcJHtwYXRoLnNsaWNlKGxhc3QsIGopfWA7XG4gICAgICAgICAgICAgIHJvb3RFbmQgPSBqO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdEVuZCA9IDE7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1dpbmRvd3NEZXZpY2VSb290KGNvZGUpKSB7XG4gICAgICAvLyBQb3NzaWJsZSBkZXZpY2Ugcm9vdFxuXG4gICAgICBpZiAocGF0aC5jaGFyQ29kZUF0KDEpID09PSBDSEFSX0NPTE9OKSB7XG4gICAgICAgIGRldmljZSA9IHBhdGguc2xpY2UoMCwgMik7XG4gICAgICAgIHJvb3RFbmQgPSAyO1xuICAgICAgICBpZiAobGVuID4gMikge1xuICAgICAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KDIpKSkge1xuICAgICAgICAgICAgLy8gVHJlYXQgc2VwYXJhdG9yIGZvbGxvd2luZyBkcml2ZSBuYW1lIGFzIGFuIGFic29sdXRlIHBhdGhcbiAgICAgICAgICAgIC8vIGluZGljYXRvclxuICAgICAgICAgICAgaXNBYnNvbHV0ZSA9IHRydWU7XG4gICAgICAgICAgICByb290RW5kID0gMztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNQYXRoU2VwYXJhdG9yKGNvZGUpKSB7XG4gICAgLy8gYHBhdGhgIGNvbnRhaW5zIGp1c3QgYSBwYXRoIHNlcGFyYXRvciwgZXhpdCBlYXJseSB0byBhdm9pZCB1bm5lY2Vzc2FyeVxuICAgIC8vIHdvcmtcbiAgICByZXR1cm4gXCJcXFxcXCI7XG4gIH1cblxuICBsZXQgdGFpbDogc3RyaW5nO1xuICBpZiAocm9vdEVuZCA8IGxlbikge1xuICAgIHRhaWwgPSBub3JtYWxpemVTdHJpbmcoXG4gICAgICBwYXRoLnNsaWNlKHJvb3RFbmQpLFxuICAgICAgIWlzQWJzb2x1dGUsXG4gICAgICBcIlxcXFxcIixcbiAgICAgIGlzUGF0aFNlcGFyYXRvcixcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIHRhaWwgPSBcIlwiO1xuICB9XG4gIGlmICh0YWlsLmxlbmd0aCA9PT0gMCAmJiAhaXNBYnNvbHV0ZSkgdGFpbCA9IFwiLlwiO1xuICBpZiAodGFpbC5sZW5ndGggPiAwICYmIGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQobGVuIC0gMSkpKSB7XG4gICAgdGFpbCArPSBcIlxcXFxcIjtcbiAgfVxuICBpZiAoZGV2aWNlID09PSB1bmRlZmluZWQpIHtcbiAgICBpZiAoaXNBYnNvbHV0ZSkge1xuICAgICAgaWYgKHRhaWwubGVuZ3RoID4gMCkgcmV0dXJuIGBcXFxcJHt0YWlsfWA7XG4gICAgICBlbHNlIHJldHVybiBcIlxcXFxcIjtcbiAgICB9IGVsc2UgaWYgKHRhaWwubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIHRhaWw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc0Fic29sdXRlKSB7XG4gICAgaWYgKHRhaWwubGVuZ3RoID4gMCkgcmV0dXJuIGAke2RldmljZX1cXFxcJHt0YWlsfWA7XG4gICAgZWxzZSByZXR1cm4gYCR7ZGV2aWNlfVxcXFxgO1xuICB9IGVsc2UgaWYgKHRhaWwubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBkZXZpY2UgKyB0YWlsO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBkZXZpY2U7XG4gIH1cbn1cblxuLyoqXG4gKiBWZXJpZmllcyB3aGV0aGVyIHBhdGggaXMgYWJzb2x1dGVcbiAqIEBwYXJhbSBwYXRoIHRvIHZlcmlmeVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNBYnNvbHV0ZShwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgYXNzZXJ0UGF0aChwYXRoKTtcbiAgY29uc3QgbGVuID0gcGF0aC5sZW5ndGg7XG4gIGlmIChsZW4gPT09IDApIHJldHVybiBmYWxzZTtcblxuICBjb25zdCBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KDApO1xuICBpZiAoaXNQYXRoU2VwYXJhdG9yKGNvZGUpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoaXNXaW5kb3dzRGV2aWNlUm9vdChjb2RlKSkge1xuICAgIC8vIFBvc3NpYmxlIGRldmljZSByb290XG5cbiAgICBpZiAobGVuID4gMiAmJiBwYXRoLmNoYXJDb2RlQXQoMSkgPT09IENIQVJfQ09MT04pIHtcbiAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KDIpKSkgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBKb2luIGFsbCBnaXZlbiBhIHNlcXVlbmNlIG9mIGBwYXRoc2AsdGhlbiBub3JtYWxpemVzIHRoZSByZXN1bHRpbmcgcGF0aC5cbiAqIEBwYXJhbSBwYXRocyB0byBiZSBqb2luZWQgYW5kIG5vcm1hbGl6ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGpvaW4oLi4ucGF0aHM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgY29uc3QgcGF0aHNDb3VudCA9IHBhdGhzLmxlbmd0aDtcbiAgaWYgKHBhdGhzQ291bnQgPT09IDApIHJldHVybiBcIi5cIjtcblxuICBsZXQgam9pbmVkOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIGxldCBmaXJzdFBhcnQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGhzQ291bnQ7ICsraSkge1xuICAgIGNvbnN0IHBhdGggPSBwYXRoc1tpXTtcbiAgICBhc3NlcnRQYXRoKHBhdGgpO1xuICAgIGlmIChwYXRoLmxlbmd0aCA+IDApIHtcbiAgICAgIGlmIChqb2luZWQgPT09IHVuZGVmaW5lZCkgam9pbmVkID0gZmlyc3RQYXJ0ID0gcGF0aDtcbiAgICAgIGVsc2Ugam9pbmVkICs9IGBcXFxcJHtwYXRofWA7XG4gICAgfVxuICB9XG5cbiAgaWYgKGpvaW5lZCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gXCIuXCI7XG5cbiAgLy8gTWFrZSBzdXJlIHRoYXQgdGhlIGpvaW5lZCBwYXRoIGRvZXNuJ3Qgc3RhcnQgd2l0aCB0d28gc2xhc2hlcywgYmVjYXVzZVxuICAvLyBub3JtYWxpemUoKSB3aWxsIG1pc3Rha2UgaXQgZm9yIGFuIFVOQyBwYXRoIHRoZW4uXG4gIC8vXG4gIC8vIFRoaXMgc3RlcCBpcyBza2lwcGVkIHdoZW4gaXQgaXMgdmVyeSBjbGVhciB0aGF0IHRoZSB1c2VyIGFjdHVhbGx5XG4gIC8vIGludGVuZGVkIHRvIHBvaW50IGF0IGFuIFVOQyBwYXRoLiBUaGlzIGlzIGFzc3VtZWQgd2hlbiB0aGUgZmlyc3RcbiAgLy8gbm9uLWVtcHR5IHN0cmluZyBhcmd1bWVudHMgc3RhcnRzIHdpdGggZXhhY3RseSB0d28gc2xhc2hlcyBmb2xsb3dlZCBieVxuICAvLyBhdCBsZWFzdCBvbmUgbW9yZSBub24tc2xhc2ggY2hhcmFjdGVyLlxuICAvL1xuICAvLyBOb3RlIHRoYXQgZm9yIG5vcm1hbGl6ZSgpIHRvIHRyZWF0IGEgcGF0aCBhcyBhbiBVTkMgcGF0aCBpdCBuZWVkcyB0b1xuICAvLyBoYXZlIGF0IGxlYXN0IDIgY29tcG9uZW50cywgc28gd2UgZG9uJ3QgZmlsdGVyIGZvciB0aGF0IGhlcmUuXG4gIC8vIFRoaXMgbWVhbnMgdGhhdCB0aGUgdXNlciBjYW4gdXNlIGpvaW4gdG8gY29uc3RydWN0IFVOQyBwYXRocyBmcm9tXG4gIC8vIGEgc2VydmVyIG5hbWUgYW5kIGEgc2hhcmUgbmFtZTsgZm9yIGV4YW1wbGU6XG4gIC8vICAgcGF0aC5qb2luKCcvL3NlcnZlcicsICdzaGFyZScpIC0+ICdcXFxcXFxcXHNlcnZlclxcXFxzaGFyZVxcXFwnKVxuICBsZXQgbmVlZHNSZXBsYWNlID0gdHJ1ZTtcbiAgbGV0IHNsYXNoQ291bnQgPSAwO1xuICBhc3NlcnQoZmlyc3RQYXJ0ICE9IG51bGwpO1xuICBpZiAoaXNQYXRoU2VwYXJhdG9yKGZpcnN0UGFydC5jaGFyQ29kZUF0KDApKSkge1xuICAgICsrc2xhc2hDb3VudDtcbiAgICBjb25zdCBmaXJzdExlbiA9IGZpcnN0UGFydC5sZW5ndGg7XG4gICAgaWYgKGZpcnN0TGVuID4gMSkge1xuICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihmaXJzdFBhcnQuY2hhckNvZGVBdCgxKSkpIHtcbiAgICAgICAgKytzbGFzaENvdW50O1xuICAgICAgICBpZiAoZmlyc3RMZW4gPiAyKSB7XG4gICAgICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihmaXJzdFBhcnQuY2hhckNvZGVBdCgyKSkpICsrc2xhc2hDb3VudDtcbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIFdlIG1hdGNoZWQgYSBVTkMgcGF0aCBpbiB0aGUgZmlyc3QgcGFydFxuICAgICAgICAgICAgbmVlZHNSZXBsYWNlID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChuZWVkc1JlcGxhY2UpIHtcbiAgICAvLyBGaW5kIGFueSBtb3JlIGNvbnNlY3V0aXZlIHNsYXNoZXMgd2UgbmVlZCB0byByZXBsYWNlXG4gICAgZm9yICg7IHNsYXNoQ291bnQgPCBqb2luZWQubGVuZ3RoOyArK3NsYXNoQ291bnQpIHtcbiAgICAgIGlmICghaXNQYXRoU2VwYXJhdG9yKGpvaW5lZC5jaGFyQ29kZUF0KHNsYXNoQ291bnQpKSkgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gUmVwbGFjZSB0aGUgc2xhc2hlcyBpZiBuZWVkZWRcbiAgICBpZiAoc2xhc2hDb3VudCA+PSAyKSBqb2luZWQgPSBgXFxcXCR7am9pbmVkLnNsaWNlKHNsYXNoQ291bnQpfWA7XG4gIH1cblxuICByZXR1cm4gbm9ybWFsaXplKGpvaW5lZCk7XG59XG5cbi8qKlxuICogSXQgd2lsbCBzb2x2ZSB0aGUgcmVsYXRpdmUgcGF0aCBmcm9tIGBmcm9tYCB0byBgdG9gLCBmb3IgaW5zdGFuY2U6XG4gKiAgZnJvbSA9ICdDOlxcXFxvcmFuZGVhXFxcXHRlc3RcXFxcYWFhJ1xuICogIHRvID0gJ0M6XFxcXG9yYW5kZWFcXFxcaW1wbFxcXFxiYmInXG4gKiBUaGUgb3V0cHV0IG9mIHRoZSBmdW5jdGlvbiBzaG91bGQgYmU6ICcuLlxcXFwuLlxcXFxpbXBsXFxcXGJiYidcbiAqIEBwYXJhbSBmcm9tIHJlbGF0aXZlIHBhdGhcbiAqIEBwYXJhbSB0byByZWxhdGl2ZSBwYXRoXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWxhdGl2ZShmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcpOiBzdHJpbmcge1xuICBhc3NlcnRQYXRoKGZyb20pO1xuICBhc3NlcnRQYXRoKHRvKTtcblxuICBpZiAoZnJvbSA9PT0gdG8pIHJldHVybiBcIlwiO1xuXG4gIGNvbnN0IGZyb21PcmlnID0gcmVzb2x2ZShmcm9tKTtcbiAgY29uc3QgdG9PcmlnID0gcmVzb2x2ZSh0byk7XG5cbiAgaWYgKGZyb21PcmlnID09PSB0b09yaWcpIHJldHVybiBcIlwiO1xuXG4gIGZyb20gPSBmcm9tT3JpZy50b0xvd2VyQ2FzZSgpO1xuICB0byA9IHRvT3JpZy50b0xvd2VyQ2FzZSgpO1xuXG4gIGlmIChmcm9tID09PSB0bykgcmV0dXJuIFwiXCI7XG5cbiAgLy8gVHJpbSBhbnkgbGVhZGluZyBiYWNrc2xhc2hlc1xuICBsZXQgZnJvbVN0YXJ0ID0gMDtcbiAgbGV0IGZyb21FbmQgPSBmcm9tLmxlbmd0aDtcbiAgZm9yICg7IGZyb21TdGFydCA8IGZyb21FbmQ7ICsrZnJvbVN0YXJ0KSB7XG4gICAgaWYgKGZyb20uY2hhckNvZGVBdChmcm9tU3RhcnQpICE9PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSBicmVhaztcbiAgfVxuICAvLyBUcmltIHRyYWlsaW5nIGJhY2tzbGFzaGVzIChhcHBsaWNhYmxlIHRvIFVOQyBwYXRocyBvbmx5KVxuICBmb3IgKDsgZnJvbUVuZCAtIDEgPiBmcm9tU3RhcnQ7IC0tZnJvbUVuZCkge1xuICAgIGlmIChmcm9tLmNoYXJDb2RlQXQoZnJvbUVuZCAtIDEpICE9PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSBicmVhaztcbiAgfVxuICBjb25zdCBmcm9tTGVuID0gZnJvbUVuZCAtIGZyb21TdGFydDtcblxuICAvLyBUcmltIGFueSBsZWFkaW5nIGJhY2tzbGFzaGVzXG4gIGxldCB0b1N0YXJ0ID0gMDtcbiAgbGV0IHRvRW5kID0gdG8ubGVuZ3RoO1xuICBmb3IgKDsgdG9TdGFydCA8IHRvRW5kOyArK3RvU3RhcnQpIHtcbiAgICBpZiAodG8uY2hhckNvZGVBdCh0b1N0YXJ0KSAhPT0gQ0hBUl9CQUNLV0FSRF9TTEFTSCkgYnJlYWs7XG4gIH1cbiAgLy8gVHJpbSB0cmFpbGluZyBiYWNrc2xhc2hlcyAoYXBwbGljYWJsZSB0byBVTkMgcGF0aHMgb25seSlcbiAgZm9yICg7IHRvRW5kIC0gMSA+IHRvU3RhcnQ7IC0tdG9FbmQpIHtcbiAgICBpZiAodG8uY2hhckNvZGVBdCh0b0VuZCAtIDEpICE9PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSBicmVhaztcbiAgfVxuICBjb25zdCB0b0xlbiA9IHRvRW5kIC0gdG9TdGFydDtcblxuICAvLyBDb21wYXJlIHBhdGhzIHRvIGZpbmQgdGhlIGxvbmdlc3QgY29tbW9uIHBhdGggZnJvbSByb290XG4gIGNvbnN0IGxlbmd0aCA9IGZyb21MZW4gPCB0b0xlbiA/IGZyb21MZW4gOiB0b0xlbjtcbiAgbGV0IGxhc3RDb21tb25TZXAgPSAtMTtcbiAgbGV0IGkgPSAwO1xuICBmb3IgKDsgaSA8PSBsZW5ndGg7ICsraSkge1xuICAgIGlmIChpID09PSBsZW5ndGgpIHtcbiAgICAgIGlmICh0b0xlbiA+IGxlbmd0aCkge1xuICAgICAgICBpZiAodG8uY2hhckNvZGVBdCh0b1N0YXJ0ICsgaSkgPT09IENIQVJfQkFDS1dBUkRfU0xBU0gpIHtcbiAgICAgICAgICAvLyBXZSBnZXQgaGVyZSBpZiBgZnJvbWAgaXMgdGhlIGV4YWN0IGJhc2UgcGF0aCBmb3IgYHRvYC5cbiAgICAgICAgICAvLyBGb3IgZXhhbXBsZTogZnJvbT0nQzpcXFxcZm9vXFxcXGJhcic7IHRvPSdDOlxcXFxmb29cXFxcYmFyXFxcXGJheidcbiAgICAgICAgICByZXR1cm4gdG9PcmlnLnNsaWNlKHRvU3RhcnQgKyBpICsgMSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gMikge1xuICAgICAgICAgIC8vIFdlIGdldCBoZXJlIGlmIGBmcm9tYCBpcyB0aGUgZGV2aWNlIHJvb3QuXG4gICAgICAgICAgLy8gRm9yIGV4YW1wbGU6IGZyb209J0M6XFxcXCc7IHRvPSdDOlxcXFxmb28nXG4gICAgICAgICAgcmV0dXJuIHRvT3JpZy5zbGljZSh0b1N0YXJ0ICsgaSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChmcm9tTGVuID4gbGVuZ3RoKSB7XG4gICAgICAgIGlmIChmcm9tLmNoYXJDb2RlQXQoZnJvbVN0YXJ0ICsgaSkgPT09IENIQVJfQkFDS1dBUkRfU0xBU0gpIHtcbiAgICAgICAgICAvLyBXZSBnZXQgaGVyZSBpZiBgdG9gIGlzIHRoZSBleGFjdCBiYXNlIHBhdGggZm9yIGBmcm9tYC5cbiAgICAgICAgICAvLyBGb3IgZXhhbXBsZTogZnJvbT0nQzpcXFxcZm9vXFxcXGJhcic7IHRvPSdDOlxcXFxmb28nXG4gICAgICAgICAgbGFzdENvbW1vblNlcCA9IGk7XG4gICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gMikge1xuICAgICAgICAgIC8vIFdlIGdldCBoZXJlIGlmIGB0b2AgaXMgdGhlIGRldmljZSByb290LlxuICAgICAgICAgIC8vIEZvciBleGFtcGxlOiBmcm9tPSdDOlxcXFxmb29cXFxcYmFyJzsgdG89J0M6XFxcXCdcbiAgICAgICAgICBsYXN0Q29tbW9uU2VwID0gMztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNvbnN0IGZyb21Db2RlID0gZnJvbS5jaGFyQ29kZUF0KGZyb21TdGFydCArIGkpO1xuICAgIGNvbnN0IHRvQ29kZSA9IHRvLmNoYXJDb2RlQXQodG9TdGFydCArIGkpO1xuICAgIGlmIChmcm9tQ29kZSAhPT0gdG9Db2RlKSBicmVhaztcbiAgICBlbHNlIGlmIChmcm9tQ29kZSA9PT0gQ0hBUl9CQUNLV0FSRF9TTEFTSCkgbGFzdENvbW1vblNlcCA9IGk7XG4gIH1cblxuICAvLyBXZSBmb3VuZCBhIG1pc21hdGNoIGJlZm9yZSB0aGUgZmlyc3QgY29tbW9uIHBhdGggc2VwYXJhdG9yIHdhcyBzZWVuLCBzb1xuICAvLyByZXR1cm4gdGhlIG9yaWdpbmFsIGB0b2AuXG4gIGlmIChpICE9PSBsZW5ndGggJiYgbGFzdENvbW1vblNlcCA9PT0gLTEpIHtcbiAgICByZXR1cm4gdG9PcmlnO1xuICB9XG5cbiAgbGV0IG91dCA9IFwiXCI7XG4gIGlmIChsYXN0Q29tbW9uU2VwID09PSAtMSkgbGFzdENvbW1vblNlcCA9IDA7XG4gIC8vIEdlbmVyYXRlIHRoZSByZWxhdGl2ZSBwYXRoIGJhc2VkIG9uIHRoZSBwYXRoIGRpZmZlcmVuY2UgYmV0d2VlbiBgdG9gIGFuZFxuICAvLyBgZnJvbWBcbiAgZm9yIChpID0gZnJvbVN0YXJ0ICsgbGFzdENvbW1vblNlcCArIDE7IGkgPD0gZnJvbUVuZDsgKytpKSB7XG4gICAgaWYgKGkgPT09IGZyb21FbmQgfHwgZnJvbS5jaGFyQ29kZUF0KGkpID09PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSB7XG4gICAgICBpZiAob3V0Lmxlbmd0aCA9PT0gMCkgb3V0ICs9IFwiLi5cIjtcbiAgICAgIGVsc2Ugb3V0ICs9IFwiXFxcXC4uXCI7XG4gICAgfVxuICB9XG5cbiAgLy8gTGFzdGx5LCBhcHBlbmQgdGhlIHJlc3Qgb2YgdGhlIGRlc3RpbmF0aW9uIChgdG9gKSBwYXRoIHRoYXQgY29tZXMgYWZ0ZXJcbiAgLy8gdGhlIGNvbW1vbiBwYXRoIHBhcnRzXG4gIGlmIChvdXQubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBvdXQgKyB0b09yaWcuc2xpY2UodG9TdGFydCArIGxhc3RDb21tb25TZXAsIHRvRW5kKTtcbiAgfSBlbHNlIHtcbiAgICB0b1N0YXJ0ICs9IGxhc3RDb21tb25TZXA7XG4gICAgaWYgKHRvT3JpZy5jaGFyQ29kZUF0KHRvU3RhcnQpID09PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSArK3RvU3RhcnQ7XG4gICAgcmV0dXJuIHRvT3JpZy5zbGljZSh0b1N0YXJ0LCB0b0VuZCk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXNvbHZlcyBwYXRoIHRvIGEgbmFtZXNwYWNlIHBhdGhcbiAqIEBwYXJhbSBwYXRoIHRvIHJlc29sdmUgdG8gbmFtZXNwYWNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b05hbWVzcGFjZWRQYXRoKHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIC8vIE5vdGU6IHRoaXMgd2lsbCAqcHJvYmFibHkqIHRocm93IHNvbWV3aGVyZS5cbiAgaWYgKHR5cGVvZiBwYXRoICE9PSBcInN0cmluZ1wiKSByZXR1cm4gcGF0aDtcbiAgaWYgKHBhdGgubGVuZ3RoID09PSAwKSByZXR1cm4gXCJcIjtcblxuICBjb25zdCByZXNvbHZlZFBhdGggPSByZXNvbHZlKHBhdGgpO1xuXG4gIGlmIChyZXNvbHZlZFBhdGgubGVuZ3RoID49IDMpIHtcbiAgICBpZiAocmVzb2x2ZWRQYXRoLmNoYXJDb2RlQXQoMCkgPT09IENIQVJfQkFDS1dBUkRfU0xBU0gpIHtcbiAgICAgIC8vIFBvc3NpYmxlIFVOQyByb290XG5cbiAgICAgIGlmIChyZXNvbHZlZFBhdGguY2hhckNvZGVBdCgxKSA9PT0gQ0hBUl9CQUNLV0FSRF9TTEFTSCkge1xuICAgICAgICBjb25zdCBjb2RlID0gcmVzb2x2ZWRQYXRoLmNoYXJDb2RlQXQoMik7XG4gICAgICAgIGlmIChjb2RlICE9PSBDSEFSX1FVRVNUSU9OX01BUksgJiYgY29kZSAhPT0gQ0hBUl9ET1QpIHtcbiAgICAgICAgICAvLyBNYXRjaGVkIG5vbi1sb25nIFVOQyByb290LCBjb252ZXJ0IHRoZSBwYXRoIHRvIGEgbG9uZyBVTkMgcGF0aFxuICAgICAgICAgIHJldHVybiBgXFxcXFxcXFw/XFxcXFVOQ1xcXFwke3Jlc29sdmVkUGF0aC5zbGljZSgyKX1gO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1dpbmRvd3NEZXZpY2VSb290KHJlc29sdmVkUGF0aC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgLy8gUG9zc2libGUgZGV2aWNlIHJvb3RcblxuICAgICAgaWYgKFxuICAgICAgICByZXNvbHZlZFBhdGguY2hhckNvZGVBdCgxKSA9PT0gQ0hBUl9DT0xPTiAmJlxuICAgICAgICByZXNvbHZlZFBhdGguY2hhckNvZGVBdCgyKSA9PT0gQ0hBUl9CQUNLV0FSRF9TTEFTSFxuICAgICAgKSB7XG4gICAgICAgIC8vIE1hdGNoZWQgZGV2aWNlIHJvb3QsIGNvbnZlcnQgdGhlIHBhdGggdG8gYSBsb25nIFVOQyBwYXRoXG4gICAgICAgIHJldHVybiBgXFxcXFxcXFw/XFxcXCR7cmVzb2x2ZWRQYXRofWA7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhdGg7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBkaXJlY3RvcnkgbmFtZSBvZiBhIGBwYXRoYC5cbiAqIEBwYXJhbSBwYXRoIHRvIGRldGVybWluZSBuYW1lIGZvclxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlybmFtZShwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBhc3NlcnRQYXRoKHBhdGgpO1xuICBjb25zdCBsZW4gPSBwYXRoLmxlbmd0aDtcbiAgaWYgKGxlbiA9PT0gMCkgcmV0dXJuIFwiLlwiO1xuICBsZXQgcm9vdEVuZCA9IC0xO1xuICBsZXQgZW5kID0gLTE7XG4gIGxldCBtYXRjaGVkU2xhc2ggPSB0cnVlO1xuICBsZXQgb2Zmc2V0ID0gMDtcbiAgY29uc3QgY29kZSA9IHBhdGguY2hhckNvZGVBdCgwKTtcblxuICAvLyBUcnkgdG8gbWF0Y2ggYSByb290XG4gIGlmIChsZW4gPiAxKSB7XG4gICAgaWYgKGlzUGF0aFNlcGFyYXRvcihjb2RlKSkge1xuICAgICAgLy8gUG9zc2libGUgVU5DIHJvb3RcblxuICAgICAgcm9vdEVuZCA9IG9mZnNldCA9IDE7XG5cbiAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KDEpKSkge1xuICAgICAgICAvLyBNYXRjaGVkIGRvdWJsZSBwYXRoIHNlcGFyYXRvciBhdCBiZWdpbm5pbmdcbiAgICAgICAgbGV0IGogPSAyO1xuICAgICAgICBsZXQgbGFzdCA9IGo7XG4gICAgICAgIC8vIE1hdGNoIDEgb3IgbW9yZSBub24tcGF0aCBzZXBhcmF0b3JzXG4gICAgICAgIGZvciAoOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChqKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChqIDwgbGVuICYmIGogIT09IGxhc3QpIHtcbiAgICAgICAgICAvLyBNYXRjaGVkIVxuICAgICAgICAgIGxhc3QgPSBqO1xuICAgICAgICAgIC8vIE1hdGNoIDEgb3IgbW9yZSBwYXRoIHNlcGFyYXRvcnNcbiAgICAgICAgICBmb3IgKDsgaiA8IGxlbjsgKytqKSB7XG4gICAgICAgICAgICBpZiAoIWlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoaikpKSBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGogPCBsZW4gJiYgaiAhPT0gbGFzdCkge1xuICAgICAgICAgICAgLy8gTWF0Y2hlZCFcbiAgICAgICAgICAgIGxhc3QgPSBqO1xuICAgICAgICAgICAgLy8gTWF0Y2ggMSBvciBtb3JlIG5vbi1wYXRoIHNlcGFyYXRvcnNcbiAgICAgICAgICAgIGZvciAoOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoaikpKSBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChqID09PSBsZW4pIHtcbiAgICAgICAgICAgICAgLy8gV2UgbWF0Y2hlZCBhIFVOQyByb290IG9ubHlcbiAgICAgICAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaiAhPT0gbGFzdCkge1xuICAgICAgICAgICAgICAvLyBXZSBtYXRjaGVkIGEgVU5DIHJvb3Qgd2l0aCBsZWZ0b3ZlcnNcblxuICAgICAgICAgICAgICAvLyBPZmZzZXQgYnkgMSB0byBpbmNsdWRlIHRoZSBzZXBhcmF0b3IgYWZ0ZXIgdGhlIFVOQyByb290IHRvXG4gICAgICAgICAgICAgIC8vIHRyZWF0IGl0IGFzIGEgXCJub3JtYWwgcm9vdFwiIG9uIHRvcCBvZiBhIChVTkMpIHJvb3RcbiAgICAgICAgICAgICAgcm9vdEVuZCA9IG9mZnNldCA9IGogKyAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNXaW5kb3dzRGV2aWNlUm9vdChjb2RlKSkge1xuICAgICAgLy8gUG9zc2libGUgZGV2aWNlIHJvb3RcblxuICAgICAgaWYgKHBhdGguY2hhckNvZGVBdCgxKSA9PT0gQ0hBUl9DT0xPTikge1xuICAgICAgICByb290RW5kID0gb2Zmc2V0ID0gMjtcbiAgICAgICAgaWYgKGxlbiA+IDIpIHtcbiAgICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdCgyKSkpIHJvb3RFbmQgPSBvZmZzZXQgPSAzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzUGF0aFNlcGFyYXRvcihjb2RlKSkge1xuICAgIC8vIGBwYXRoYCBjb250YWlucyBqdXN0IGEgcGF0aCBzZXBhcmF0b3IsIGV4aXQgZWFybHkgdG8gYXZvaWRcbiAgICAvLyB1bm5lY2Vzc2FyeSB3b3JrXG4gICAgcmV0dXJuIHBhdGg7XG4gIH1cblxuICBmb3IgKGxldCBpID0gbGVuIC0gMTsgaSA+PSBvZmZzZXQ7IC0taSkge1xuICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KGkpKSkge1xuICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgZW5kID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yXG4gICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBpZiAoZW5kID09PSAtMSkge1xuICAgIGlmIChyb290RW5kID09PSAtMSkgcmV0dXJuIFwiLlwiO1xuICAgIGVsc2UgZW5kID0gcm9vdEVuZDtcbiAgfVxuICByZXR1cm4gcGF0aC5zbGljZSgwLCBlbmQpO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgbGFzdCBwb3J0aW9uIG9mIGEgYHBhdGhgLiBUcmFpbGluZyBkaXJlY3Rvcnkgc2VwYXJhdG9ycyBhcmUgaWdub3JlZC5cbiAqIEBwYXJhbSBwYXRoIHRvIHByb2Nlc3NcbiAqIEBwYXJhbSBleHQgb2YgcGF0aCBkaXJlY3RvcnlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJhc2VuYW1lKHBhdGg6IHN0cmluZywgZXh0ID0gXCJcIik6IHN0cmluZyB7XG4gIGlmIChleHQgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZXh0ICE9PSBcInN0cmluZ1wiKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJleHRcIiBhcmd1bWVudCBtdXN0IGJlIGEgc3RyaW5nJyk7XG4gIH1cblxuICBhc3NlcnRQYXRoKHBhdGgpO1xuXG4gIGxldCBzdGFydCA9IDA7XG4gIGxldCBlbmQgPSAtMTtcbiAgbGV0IG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gIGxldCBpOiBudW1iZXI7XG5cbiAgLy8gQ2hlY2sgZm9yIGEgZHJpdmUgbGV0dGVyIHByZWZpeCBzbyBhcyBub3QgdG8gbWlzdGFrZSB0aGUgZm9sbG93aW5nXG4gIC8vIHBhdGggc2VwYXJhdG9yIGFzIGFuIGV4dHJhIHNlcGFyYXRvciBhdCB0aGUgZW5kIG9mIHRoZSBwYXRoIHRoYXQgY2FuIGJlXG4gIC8vIGRpc3JlZ2FyZGVkXG4gIGlmIChwYXRoLmxlbmd0aCA+PSAyKSB7XG4gICAgY29uc3QgZHJpdmUgPSBwYXRoLmNoYXJDb2RlQXQoMCk7XG4gICAgaWYgKGlzV2luZG93c0RldmljZVJvb3QoZHJpdmUpKSB7XG4gICAgICBpZiAocGF0aC5jaGFyQ29kZUF0KDEpID09PSBDSEFSX0NPTE9OKSBzdGFydCA9IDI7XG4gICAgfVxuICB9XG5cbiAgaWYgKGV4dCAhPT0gdW5kZWZpbmVkICYmIGV4dC5sZW5ndGggPiAwICYmIGV4dC5sZW5ndGggPD0gcGF0aC5sZW5ndGgpIHtcbiAgICBpZiAoZXh0Lmxlbmd0aCA9PT0gcGF0aC5sZW5ndGggJiYgZXh0ID09PSBwYXRoKSByZXR1cm4gXCJcIjtcbiAgICBsZXQgZXh0SWR4ID0gZXh0Lmxlbmd0aCAtIDE7XG4gICAgbGV0IGZpcnN0Tm9uU2xhc2hFbmQgPSAtMTtcbiAgICBmb3IgKGkgPSBwYXRoLmxlbmd0aCAtIDE7IGkgPj0gc3RhcnQ7IC0taSkge1xuICAgICAgY29uc3QgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSkpIHtcbiAgICAgICAgLy8gSWYgd2UgcmVhY2hlZCBhIHBhdGggc2VwYXJhdG9yIHRoYXQgd2FzIG5vdCBwYXJ0IG9mIGEgc2V0IG9mIHBhdGhcbiAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgICAgc3RhcnQgPSBpICsgMTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGZpcnN0Tm9uU2xhc2hFbmQgPT09IC0xKSB7XG4gICAgICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIHJlbWVtYmVyIHRoaXMgaW5kZXggaW4gY2FzZVxuICAgICAgICAgIC8vIHdlIG5lZWQgaXQgaWYgdGhlIGV4dGVuc2lvbiBlbmRzIHVwIG5vdCBtYXRjaGluZ1xuICAgICAgICAgIG1hdGNoZWRTbGFzaCA9IGZhbHNlO1xuICAgICAgICAgIGZpcnN0Tm9uU2xhc2hFbmQgPSBpICsgMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXh0SWR4ID49IDApIHtcbiAgICAgICAgICAvLyBUcnkgdG8gbWF0Y2ggdGhlIGV4cGxpY2l0IGV4dGVuc2lvblxuICAgICAgICAgIGlmIChjb2RlID09PSBleHQuY2hhckNvZGVBdChleHRJZHgpKSB7XG4gICAgICAgICAgICBpZiAoLS1leHRJZHggPT09IC0xKSB7XG4gICAgICAgICAgICAgIC8vIFdlIG1hdGNoZWQgdGhlIGV4dGVuc2lvbiwgc28gbWFyayB0aGlzIGFzIHRoZSBlbmQgb2Ygb3VyIHBhdGhcbiAgICAgICAgICAgICAgLy8gY29tcG9uZW50XG4gICAgICAgICAgICAgIGVuZCA9IGk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEV4dGVuc2lvbiBkb2VzIG5vdCBtYXRjaCwgc28gb3VyIHJlc3VsdCBpcyB0aGUgZW50aXJlIHBhdGhcbiAgICAgICAgICAgIC8vIGNvbXBvbmVudFxuICAgICAgICAgICAgZXh0SWR4ID0gLTE7XG4gICAgICAgICAgICBlbmQgPSBmaXJzdE5vblNsYXNoRW5kO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdGFydCA9PT0gZW5kKSBlbmQgPSBmaXJzdE5vblNsYXNoRW5kO1xuICAgIGVsc2UgaWYgKGVuZCA9PT0gLTEpIGVuZCA9IHBhdGgubGVuZ3RoO1xuICAgIHJldHVybiBwYXRoLnNsaWNlKHN0YXJ0LCBlbmQpO1xuICB9IGVsc2Uge1xuICAgIGZvciAoaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSBzdGFydDsgLS1pKSB7XG4gICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChpKSkpIHtcbiAgICAgICAgLy8gSWYgd2UgcmVhY2hlZCBhIHBhdGggc2VwYXJhdG9yIHRoYXQgd2FzIG5vdCBwYXJ0IG9mIGEgc2V0IG9mIHBhdGhcbiAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgICAgc3RhcnQgPSBpICsgMTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChlbmQgPT09IC0xKSB7XG4gICAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yLCBtYXJrIHRoaXMgYXMgdGhlIGVuZCBvZiBvdXJcbiAgICAgICAgLy8gcGF0aCBjb21wb25lbnRcbiAgICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgICAgIGVuZCA9IGkgKyAxO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlbmQgPT09IC0xKSByZXR1cm4gXCJcIjtcbiAgICByZXR1cm4gcGF0aC5zbGljZShzdGFydCwgZW5kKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybiB0aGUgZXh0ZW5zaW9uIG9mIHRoZSBgcGF0aGAuXG4gKiBAcGFyYW0gcGF0aCB3aXRoIGV4dGVuc2lvblxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0bmFtZShwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBhc3NlcnRQYXRoKHBhdGgpO1xuICBsZXQgc3RhcnQgPSAwO1xuICBsZXQgc3RhcnREb3QgPSAtMTtcbiAgbGV0IHN0YXJ0UGFydCA9IDA7XG4gIGxldCBlbmQgPSAtMTtcbiAgbGV0IG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gIC8vIFRyYWNrIHRoZSBzdGF0ZSBvZiBjaGFyYWN0ZXJzIChpZiBhbnkpIHdlIHNlZSBiZWZvcmUgb3VyIGZpcnN0IGRvdCBhbmRcbiAgLy8gYWZ0ZXIgYW55IHBhdGggc2VwYXJhdG9yIHdlIGZpbmRcbiAgbGV0IHByZURvdFN0YXRlID0gMDtcblxuICAvLyBDaGVjayBmb3IgYSBkcml2ZSBsZXR0ZXIgcHJlZml4IHNvIGFzIG5vdCB0byBtaXN0YWtlIHRoZSBmb2xsb3dpbmdcbiAgLy8gcGF0aCBzZXBhcmF0b3IgYXMgYW4gZXh0cmEgc2VwYXJhdG9yIGF0IHRoZSBlbmQgb2YgdGhlIHBhdGggdGhhdCBjYW4gYmVcbiAgLy8gZGlzcmVnYXJkZWRcblxuICBpZiAoXG4gICAgcGF0aC5sZW5ndGggPj0gMiAmJlxuICAgIHBhdGguY2hhckNvZGVBdCgxKSA9PT0gQ0hBUl9DT0xPTiAmJlxuICAgIGlzV2luZG93c0RldmljZVJvb3QocGF0aC5jaGFyQ29kZUF0KDApKVxuICApIHtcbiAgICBzdGFydCA9IHN0YXJ0UGFydCA9IDI7XG4gIH1cblxuICBmb3IgKGxldCBpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IHN0YXJ0OyAtLWkpIHtcbiAgICBjb25zdCBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KGkpO1xuICAgIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSkpIHtcbiAgICAgIC8vIElmIHdlIHJlYWNoZWQgYSBwYXRoIHNlcGFyYXRvciB0aGF0IHdhcyBub3QgcGFydCBvZiBhIHNldCBvZiBwYXRoXG4gICAgICAvLyBzZXBhcmF0b3JzIGF0IHRoZSBlbmQgb2YgdGhlIHN0cmluZywgc3RvcCBub3dcbiAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgIHN0YXJ0UGFydCA9IGkgKyAxO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoZW5kID09PSAtMSkge1xuICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIG1hcmsgdGhpcyBhcyB0aGUgZW5kIG9mIG91clxuICAgICAgLy8gZXh0ZW5zaW9uXG4gICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgIGVuZCA9IGkgKyAxO1xuICAgIH1cbiAgICBpZiAoY29kZSA9PT0gQ0hBUl9ET1QpIHtcbiAgICAgIC8vIElmIHRoaXMgaXMgb3VyIGZpcnN0IGRvdCwgbWFyayBpdCBhcyB0aGUgc3RhcnQgb2Ygb3VyIGV4dGVuc2lvblxuICAgICAgaWYgKHN0YXJ0RG90ID09PSAtMSkgc3RhcnREb3QgPSBpO1xuICAgICAgZWxzZSBpZiAocHJlRG90U3RhdGUgIT09IDEpIHByZURvdFN0YXRlID0gMTtcbiAgICB9IGVsc2UgaWYgKHN0YXJ0RG90ICE9PSAtMSkge1xuICAgICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBhbmQgbm9uLXBhdGggc2VwYXJhdG9yIGJlZm9yZSBvdXIgZG90LCBzbyB3ZSBzaG91bGRcbiAgICAgIC8vIGhhdmUgYSBnb29kIGNoYW5jZSBhdCBoYXZpbmcgYSBub24tZW1wdHkgZXh0ZW5zaW9uXG4gICAgICBwcmVEb3RTdGF0ZSA9IC0xO1xuICAgIH1cbiAgfVxuXG4gIGlmIChcbiAgICBzdGFydERvdCA9PT0gLTEgfHxcbiAgICBlbmQgPT09IC0xIHx8XG4gICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBjaGFyYWN0ZXIgaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBkb3RcbiAgICBwcmVEb3RTdGF0ZSA9PT0gMCB8fFxuICAgIC8vIFRoZSAocmlnaHQtbW9zdCkgdHJpbW1lZCBwYXRoIGNvbXBvbmVudCBpcyBleGFjdGx5ICcuLidcbiAgICAocHJlRG90U3RhdGUgPT09IDEgJiYgc3RhcnREb3QgPT09IGVuZCAtIDEgJiYgc3RhcnREb3QgPT09IHN0YXJ0UGFydCArIDEpXG4gICkge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG4gIHJldHVybiBwYXRoLnNsaWNlKHN0YXJ0RG90LCBlbmQpO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlIGEgcGF0aCBmcm9tIGBGb3JtYXRJbnB1dFBhdGhPYmplY3RgIG9iamVjdC5cbiAqIEBwYXJhbSBwYXRoT2JqZWN0IHdpdGggcGF0aFxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0KHBhdGhPYmplY3Q6IEZvcm1hdElucHV0UGF0aE9iamVjdCk6IHN0cmluZyB7XG4gIGlmIChwYXRoT2JqZWN0ID09PSBudWxsIHx8IHR5cGVvZiBwYXRoT2JqZWN0ICE9PSBcIm9iamVjdFwiKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgIGBUaGUgXCJwYXRoT2JqZWN0XCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSAke3R5cGVvZiBwYXRoT2JqZWN0fWAsXG4gICAgKTtcbiAgfVxuICByZXR1cm4gX2Zvcm1hdChcIlxcXFxcIiwgcGF0aE9iamVjdCk7XG59XG5cbi8qKlxuICogUmV0dXJuIGEgYFBhcnNlZFBhdGhgIG9iamVjdCBvZiB0aGUgYHBhdGhgLlxuICogQHBhcmFtIHBhdGggdG8gcHJvY2Vzc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2UocGF0aDogc3RyaW5nKTogUGFyc2VkUGF0aCB7XG4gIGFzc2VydFBhdGgocGF0aCk7XG5cbiAgY29uc3QgcmV0OiBQYXJzZWRQYXRoID0geyByb290OiBcIlwiLCBkaXI6IFwiXCIsIGJhc2U6IFwiXCIsIGV4dDogXCJcIiwgbmFtZTogXCJcIiB9O1xuXG4gIGNvbnN0IGxlbiA9IHBhdGgubGVuZ3RoO1xuICBpZiAobGVuID09PSAwKSByZXR1cm4gcmV0O1xuXG4gIGxldCByb290RW5kID0gMDtcbiAgbGV0IGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoMCk7XG5cbiAgLy8gVHJ5IHRvIG1hdGNoIGEgcm9vdFxuICBpZiAobGVuID4gMSkge1xuICAgIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSkpIHtcbiAgICAgIC8vIFBvc3NpYmxlIFVOQyByb290XG5cbiAgICAgIHJvb3RFbmQgPSAxO1xuICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoMSkpKSB7XG4gICAgICAgIC8vIE1hdGNoZWQgZG91YmxlIHBhdGggc2VwYXJhdG9yIGF0IGJlZ2lubmluZ1xuICAgICAgICBsZXQgaiA9IDI7XG4gICAgICAgIGxldCBsYXN0ID0gajtcbiAgICAgICAgLy8gTWF0Y2ggMSBvciBtb3JlIG5vbi1wYXRoIHNlcGFyYXRvcnNcbiAgICAgICAgZm9yICg7IGogPCBsZW47ICsraikge1xuICAgICAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KGopKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGogPCBsZW4gJiYgaiAhPT0gbGFzdCkge1xuICAgICAgICAgIC8vIE1hdGNoZWQhXG4gICAgICAgICAgbGFzdCA9IGo7XG4gICAgICAgICAgLy8gTWF0Y2ggMSBvciBtb3JlIHBhdGggc2VwYXJhdG9yc1xuICAgICAgICAgIGZvciAoOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgICAgIGlmICghaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChqKSkpIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaiA8IGxlbiAmJiBqICE9PSBsYXN0KSB7XG4gICAgICAgICAgICAvLyBNYXRjaGVkIVxuICAgICAgICAgICAgbGFzdCA9IGo7XG4gICAgICAgICAgICAvLyBNYXRjaCAxIG9yIG1vcmUgbm9uLXBhdGggc2VwYXJhdG9yc1xuICAgICAgICAgICAgZm9yICg7IGogPCBsZW47ICsraikge1xuICAgICAgICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChqKSkpIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGogPT09IGxlbikge1xuICAgICAgICAgICAgICAvLyBXZSBtYXRjaGVkIGEgVU5DIHJvb3Qgb25seVxuXG4gICAgICAgICAgICAgIHJvb3RFbmQgPSBqO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChqICE9PSBsYXN0KSB7XG4gICAgICAgICAgICAgIC8vIFdlIG1hdGNoZWQgYSBVTkMgcm9vdCB3aXRoIGxlZnRvdmVyc1xuXG4gICAgICAgICAgICAgIHJvb3RFbmQgPSBqICsgMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzV2luZG93c0RldmljZVJvb3QoY29kZSkpIHtcbiAgICAgIC8vIFBvc3NpYmxlIGRldmljZSByb290XG5cbiAgICAgIGlmIChwYXRoLmNoYXJDb2RlQXQoMSkgPT09IENIQVJfQ09MT04pIHtcbiAgICAgICAgcm9vdEVuZCA9IDI7XG4gICAgICAgIGlmIChsZW4gPiAyKSB7XG4gICAgICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoMikpKSB7XG4gICAgICAgICAgICBpZiAobGVuID09PSAzKSB7XG4gICAgICAgICAgICAgIC8vIGBwYXRoYCBjb250YWlucyBqdXN0IGEgZHJpdmUgcm9vdCwgZXhpdCBlYXJseSB0byBhdm9pZFxuICAgICAgICAgICAgICAvLyB1bm5lY2Vzc2FyeSB3b3JrXG4gICAgICAgICAgICAgIHJldC5yb290ID0gcmV0LmRpciA9IHBhdGg7XG4gICAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByb290RW5kID0gMztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gYHBhdGhgIGNvbnRhaW5zIGp1c3QgYSBkcml2ZSByb290LCBleGl0IGVhcmx5IHRvIGF2b2lkXG4gICAgICAgICAgLy8gdW5uZWNlc3Nhcnkgd29ya1xuICAgICAgICAgIHJldC5yb290ID0gcmV0LmRpciA9IHBhdGg7XG4gICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSkpIHtcbiAgICAvLyBgcGF0aGAgY29udGFpbnMganVzdCBhIHBhdGggc2VwYXJhdG9yLCBleGl0IGVhcmx5IHRvIGF2b2lkXG4gICAgLy8gdW5uZWNlc3Nhcnkgd29ya1xuICAgIHJldC5yb290ID0gcmV0LmRpciA9IHBhdGg7XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIGlmIChyb290RW5kID4gMCkgcmV0LnJvb3QgPSBwYXRoLnNsaWNlKDAsIHJvb3RFbmQpO1xuXG4gIGxldCBzdGFydERvdCA9IC0xO1xuICBsZXQgc3RhcnRQYXJ0ID0gcm9vdEVuZDtcbiAgbGV0IGVuZCA9IC0xO1xuICBsZXQgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgbGV0IGkgPSBwYXRoLmxlbmd0aCAtIDE7XG5cbiAgLy8gVHJhY2sgdGhlIHN0YXRlIG9mIGNoYXJhY3RlcnMgKGlmIGFueSkgd2Ugc2VlIGJlZm9yZSBvdXIgZmlyc3QgZG90IGFuZFxuICAvLyBhZnRlciBhbnkgcGF0aCBzZXBhcmF0b3Igd2UgZmluZFxuICBsZXQgcHJlRG90U3RhdGUgPSAwO1xuXG4gIC8vIEdldCBub24tZGlyIGluZm9cbiAgZm9yICg7IGkgPj0gcm9vdEVuZDsgLS1pKSB7XG4gICAgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKGNvZGUpKSB7XG4gICAgICAvLyBJZiB3ZSByZWFjaGVkIGEgcGF0aCBzZXBhcmF0b3IgdGhhdCB3YXMgbm90IHBhcnQgb2YgYSBzZXQgb2YgcGF0aFxuICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICBpZiAoIW1hdGNoZWRTbGFzaCkge1xuICAgICAgICBzdGFydFBhcnQgPSBpICsgMTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGVuZCA9PT0gLTEpIHtcbiAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yLCBtYXJrIHRoaXMgYXMgdGhlIGVuZCBvZiBvdXJcbiAgICAgIC8vIGV4dGVuc2lvblxuICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgICBlbmQgPSBpICsgMTtcbiAgICB9XG4gICAgaWYgKGNvZGUgPT09IENIQVJfRE9UKSB7XG4gICAgICAvLyBJZiB0aGlzIGlzIG91ciBmaXJzdCBkb3QsIG1hcmsgaXQgYXMgdGhlIHN0YXJ0IG9mIG91ciBleHRlbnNpb25cbiAgICAgIGlmIChzdGFydERvdCA9PT0gLTEpIHN0YXJ0RG90ID0gaTtcbiAgICAgIGVsc2UgaWYgKHByZURvdFN0YXRlICE9PSAxKSBwcmVEb3RTdGF0ZSA9IDE7XG4gICAgfSBlbHNlIGlmIChzdGFydERvdCAhPT0gLTEpIHtcbiAgICAgIC8vIFdlIHNhdyBhIG5vbi1kb3QgYW5kIG5vbi1wYXRoIHNlcGFyYXRvciBiZWZvcmUgb3VyIGRvdCwgc28gd2Ugc2hvdWxkXG4gICAgICAvLyBoYXZlIGEgZ29vZCBjaGFuY2UgYXQgaGF2aW5nIGEgbm9uLWVtcHR5IGV4dGVuc2lvblxuICAgICAgcHJlRG90U3RhdGUgPSAtMTtcbiAgICB9XG4gIH1cblxuICBpZiAoXG4gICAgc3RhcnREb3QgPT09IC0xIHx8XG4gICAgZW5kID09PSAtMSB8fFxuICAgIC8vIFdlIHNhdyBhIG5vbi1kb3QgY2hhcmFjdGVyIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgZG90XG4gICAgcHJlRG90U3RhdGUgPT09IDAgfHxcbiAgICAvLyBUaGUgKHJpZ2h0LW1vc3QpIHRyaW1tZWQgcGF0aCBjb21wb25lbnQgaXMgZXhhY3RseSAnLi4nXG4gICAgKHByZURvdFN0YXRlID09PSAxICYmIHN0YXJ0RG90ID09PSBlbmQgLSAxICYmIHN0YXJ0RG90ID09PSBzdGFydFBhcnQgKyAxKVxuICApIHtcbiAgICBpZiAoZW5kICE9PSAtMSkge1xuICAgICAgcmV0LmJhc2UgPSByZXQubmFtZSA9IHBhdGguc2xpY2Uoc3RhcnRQYXJ0LCBlbmQpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXQubmFtZSA9IHBhdGguc2xpY2Uoc3RhcnRQYXJ0LCBzdGFydERvdCk7XG4gICAgcmV0LmJhc2UgPSBwYXRoLnNsaWNlKHN0YXJ0UGFydCwgZW5kKTtcbiAgICByZXQuZXh0ID0gcGF0aC5zbGljZShzdGFydERvdCwgZW5kKTtcbiAgfVxuXG4gIC8vIElmIHRoZSBkaXJlY3RvcnkgaXMgdGhlIHJvb3QsIHVzZSB0aGUgZW50aXJlIHJvb3QgYXMgdGhlIGBkaXJgIGluY2x1ZGluZ1xuICAvLyB0aGUgdHJhaWxpbmcgc2xhc2ggaWYgYW55IChgQzpcXGFiY2AgLT4gYEM6XFxgKS4gT3RoZXJ3aXNlLCBzdHJpcCBvdXQgdGhlXG4gIC8vIHRyYWlsaW5nIHNsYXNoIChgQzpcXGFiY1xcZGVmYCAtPiBgQzpcXGFiY2ApLlxuICBpZiAoc3RhcnRQYXJ0ID4gMCAmJiBzdGFydFBhcnQgIT09IHJvb3RFbmQpIHtcbiAgICByZXQuZGlyID0gcGF0aC5zbGljZSgwLCBzdGFydFBhcnQgLSAxKTtcbiAgfSBlbHNlIHJldC5kaXIgPSByZXQucm9vdDtcblxuICByZXR1cm4gcmV0O1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGEgZmlsZSBVUkwgdG8gYSBwYXRoIHN0cmluZy5cbiAqXG4gKiAgICAgIGZyb21GaWxlVXJsKFwiZmlsZTovLy9ob21lL2Zvb1wiKTsgLy8gXCJcXFxcaG9tZVxcXFxmb29cIlxuICogICAgICBmcm9tRmlsZVVybChcImZpbGU6Ly8vQzovVXNlcnMvZm9vXCIpOyAvLyBcIkM6XFxcXFVzZXJzXFxcXGZvb1wiXG4gKiAgICAgIGZyb21GaWxlVXJsKFwiZmlsZTovL2xvY2FsaG9zdC9ob21lL2Zvb1wiKTsgLy8gXCJcXFxcXFxcXGxvY2FsaG9zdFxcXFxob21lXFxcXGZvb1wiXG4gKiBAcGFyYW0gdXJsIG9mIGEgZmlsZSBVUkxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZyb21GaWxlVXJsKHVybDogc3RyaW5nIHwgVVJMKTogc3RyaW5nIHtcbiAgdXJsID0gdXJsIGluc3RhbmNlb2YgVVJMID8gdXJsIDogbmV3IFVSTCh1cmwpO1xuICBpZiAodXJsLnByb3RvY29sICE9IFwiZmlsZTpcIikge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJNdXN0IGJlIGEgZmlsZSBVUkwuXCIpO1xuICB9XG4gIGxldCBwYXRoID0gZGVjb2RlVVJJQ29tcG9uZW50KFxuICAgIHVybC5wYXRobmFtZS5yZXBsYWNlKC9cXC8vZywgXCJcXFxcXCIpLnJlcGxhY2UoLyUoPyFbMC05QS1GYS1mXXsyfSkvZywgXCIlMjVcIiksXG4gICkucmVwbGFjZSgvXlxcXFwqKFtBLVphLXpdOikoXFxcXHwkKS8sIFwiJDFcXFxcXCIpO1xuICBpZiAodXJsLmhvc3RuYW1lICE9IFwiXCIpIHtcbiAgICAvLyBOb3RlOiBUaGUgYFVSTGAgaW1wbGVtZW50YXRpb24gZ3VhcmFudGVlcyB0aGF0IHRoZSBkcml2ZSBsZXR0ZXIgYW5kXG4gICAgLy8gaG9zdG5hbWUgYXJlIG11dHVhbGx5IGV4Y2x1c2l2ZS4gT3RoZXJ3aXNlIGl0IHdvdWxkIG5vdCBoYXZlIGJlZW4gdmFsaWRcbiAgICAvLyB0byBhcHBlbmQgdGhlIGhvc3RuYW1lIGFuZCBwYXRoIGxpa2UgdGhpcy5cbiAgICBwYXRoID0gYFxcXFxcXFxcJHt1cmwuaG9zdG5hbWV9JHtwYXRofWA7XG4gIH1cbiAgcmV0dXJuIHBhdGg7XG59XG5cbi8qKlxuICogQ29udmVydHMgYSBwYXRoIHN0cmluZyB0byBhIGZpbGUgVVJMLlxuICpcbiAqICAgICAgdG9GaWxlVXJsKFwiXFxcXGhvbWVcXFxcZm9vXCIpOyAvLyBuZXcgVVJMKFwiZmlsZTovLy9ob21lL2Zvb1wiKVxuICogICAgICB0b0ZpbGVVcmwoXCJDOlxcXFxVc2Vyc1xcXFxmb29cIik7IC8vIG5ldyBVUkwoXCJmaWxlOi8vL0M6L1VzZXJzL2Zvb1wiKVxuICogICAgICB0b0ZpbGVVcmwoXCJcXFxcXFxcXGxvY2FsaG9zdFxcXFxob21lXFxcXGZvb1wiKTsgLy8gbmV3IFVSTChcImZpbGU6Ly9sb2NhbGhvc3QvaG9tZS9mb29cIilcbiAqIEBwYXJhbSBwYXRoIHRvIGNvbnZlcnQgdG8gZmlsZSBVUkxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvRmlsZVVybChwYXRoOiBzdHJpbmcpOiBVUkwge1xuICBpZiAoIWlzQWJzb2x1dGUocGF0aCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiTXVzdCBiZSBhbiBhYnNvbHV0ZSBwYXRoLlwiKTtcbiAgfVxuICBjb25zdCBbLCBob3N0bmFtZSwgcGF0aG5hbWVdID0gcGF0aC5tYXRjaChcbiAgICAvXig/OlsvXFxcXF17Mn0oW14vXFxcXF0rKSg/PVsvXFxcXF1bXi9cXFxcXSkpPyguKikvLFxuICApITtcbiAgY29uc3QgdXJsID0gbmV3IFVSTChcImZpbGU6Ly8vXCIpO1xuICB1cmwucGF0aG5hbWUgPSBwYXRobmFtZS5yZXBsYWNlKC8lL2csIFwiJTI1XCIpO1xuICBpZiAoaG9zdG5hbWUgIT0gbnVsbCkge1xuICAgIHVybC5ob3N0bmFtZSA9IGhvc3RuYW1lO1xuICAgIGlmICghdXJsLmhvc3RuYW1lKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBob3N0bmFtZS5cIik7XG4gICAgfVxuICB9XG4gIHJldHVybiB1cmw7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBS0UsbUJBQW1CLEVBQ25CLFVBQVUsRUFDVixRQUFRLEVBQ1Isa0JBQWtCLFNBQ2IsZUFBaUI7U0FHdEIsT0FBTyxFQUNQLFVBQVUsRUFDVixlQUFlLEVBQ2YsbUJBQW1CLEVBQ25CLGVBQWUsU0FDVixVQUFZO1NBQ1YsTUFBTSxTQUFRLGtCQUFvQjthQUU5QixHQUFHLElBQUcsRUFBSTthQUNWLFNBQVMsSUFBRyxDQUFHO0FBRTVCLEVBR0csQUFISDs7O0NBR0csQUFISCxFQUdHLGlCQUNhLE9BQU8sSUFBSSxZQUFZO1FBQ2pDLGNBQWM7UUFDZCxZQUFZO1FBQ1osZ0JBQWdCLEdBQUcsS0FBSztZQUVuQixDQUFD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
