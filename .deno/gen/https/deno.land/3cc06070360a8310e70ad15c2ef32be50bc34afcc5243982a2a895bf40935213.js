import {
  basename,
  dirname,
  extname,
  fromFileUrl,
  join,
  resolve,
} from "../deps.ts";
/**
 * Return a stat, maybe.
 *
 * @param {string} path
 * @return {Deno.FileInfo}
 * @private
 */ function tryStat(path) {
  try {
    return Deno.statSync(path);
  } catch (e) {
    return undefined;
  }
}
function toPath(pathLike) {
  return pathLike.startsWith("file:") ? fromFileUrl(pathLike) : pathLike;
}
export class View {
  defaultEngine;
  ext;
  name;
  root;
  engine;
  path;
  /**
   * Initialize a new `View` with the given `name`.
   *
   * Options:
   *
   *   - `defaultEngine` the default template engine name
   *   - `engines` template engine require() cache
   *   - `root` root path for view lookup
   *
   * @param {string} name
   * @param {object} options
   */ constructor(fileName, options = {}) {
    this.defaultEngine = options.defaultEngine;
    this.ext = extname(fileName);
    this.name = fileName;
    if (Array.isArray(options.root)) {
      this.root = options.root.map(toPath);
    } else {
      this.root = toPath(options.root);
    }
    if (!this.ext && !this.defaultEngine) {
      throw new Error(
        "No default engine was specified and no extension was provided.",
      );
    }
    if (!this.ext) {
      // get extension from default engine name
      this.ext = this.defaultEngine[0] !== "."
        ? `.${this.defaultEngine}`
        : this.defaultEngine;
      fileName += this.ext;
    }
    if (!options.engines[this.ext]) {
      throw new Error(
        `Could not find a view engine for extension "${this.ext}"`,
      );
    }
    // store loaded engine
    this.engine = options.engines[this.ext];
    // lookup path
    this.path = this.lookup(fileName);
  }
  /**
   * Resolve the file within the given directory.
   *
   * @param {string} dir
   * @param {string} file
   * @private
   */ resolve(dir, file) {
    let path = join(dir, file);
    let stat = tryStat(path);
    if (stat && stat.isFile) {
      return path;
    }
    // <path>/index.<ext>
    const ext = this.ext;
    path = join(dir, basename(file, ext), `index${ext}`);
    stat = tryStat(path);
    if (stat && stat.isFile) {
      return path;
    }
  }
  /**
   * Lookup view by the given `name`
   *
   * @param {string} name
   * @private
   */ lookup(name) {
    const roots = [].concat(this.root);
    let path;
    for (let i = 0; i < roots.length && !path; i++) {
      const root = roots[i];
      const loc = resolve(root, name);
      const dir = dirname(loc);
      const file = basename(loc);
      path = this.resolve(dir, file);
    }
    return path;
  }
  /**
   * Render with the given options.
   *
   * @param {object} options
   * @param {Function} callback
   * @private
   */ async render(options, callback) {
    const out = await this.engine(this.path, options);
    callback(undefined, out);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy92aWV3LnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBiYXNlbmFtZSxcbiAgZGlybmFtZSxcbiAgZXh0bmFtZSxcbiAgZnJvbUZpbGVVcmwsXG4gIGpvaW4sXG4gIHJlc29sdmUsXG59IGZyb20gXCIuLi9kZXBzLnRzXCI7XG5cbi8qKlxuICogUmV0dXJuIGEgc3RhdCwgbWF5YmUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcbiAqIEByZXR1cm4ge0Rlbm8uRmlsZUluZm99XG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiB0cnlTdGF0KHBhdGg6IHN0cmluZykge1xuICB0cnkge1xuICAgIHJldHVybiBEZW5vLnN0YXRTeW5jKHBhdGgpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG5mdW5jdGlvbiB0b1BhdGgocGF0aExpa2U6IHN0cmluZykge1xuICByZXR1cm4gcGF0aExpa2Uuc3RhcnRzV2l0aChcImZpbGU6XCIpID8gZnJvbUZpbGVVcmwocGF0aExpa2UpIDogcGF0aExpa2U7XG59XG5cbmV4cG9ydCBjbGFzcyBWaWV3IHtcbiAgZGVmYXVsdEVuZ2luZSE6IGFueTtcbiAgZXh0ITogYW55O1xuICBuYW1lITogYW55O1xuICByb290ITogYW55O1xuICBlbmdpbmUhOiBhbnk7XG4gIHBhdGghOiBhbnk7XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgYSBuZXcgYFZpZXdgIHdpdGggdGhlIGdpdmVuIGBuYW1lYC5cbiAgICpcbiAgICogT3B0aW9uczpcbiAgICpcbiAgICogICAtIGBkZWZhdWx0RW5naW5lYCB0aGUgZGVmYXVsdCB0ZW1wbGF0ZSBlbmdpbmUgbmFtZVxuICAgKiAgIC0gYGVuZ2luZXNgIHRlbXBsYXRlIGVuZ2luZSByZXF1aXJlKCkgY2FjaGVcbiAgICogICAtIGByb290YCByb290IHBhdGggZm9yIHZpZXcgbG9va3VwXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gICAqL1xuICBjb25zdHJ1Y3RvcihmaWxlTmFtZTogc3RyaW5nLCBvcHRpb25zOiBhbnkgPSB7fSkge1xuICAgIHRoaXMuZGVmYXVsdEVuZ2luZSA9IG9wdGlvbnMuZGVmYXVsdEVuZ2luZTtcbiAgICB0aGlzLmV4dCA9IGV4dG5hbWUoZmlsZU5hbWUpO1xuICAgIHRoaXMubmFtZSA9IGZpbGVOYW1lO1xuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5yb290KSkge1xuICAgICAgdGhpcy5yb290ID0gb3B0aW9ucy5yb290Lm1hcCh0b1BhdGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJvb3QgPSB0b1BhdGgob3B0aW9ucy5yb290KTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuZXh0ICYmICF0aGlzLmRlZmF1bHRFbmdpbmUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJObyBkZWZhdWx0IGVuZ2luZSB3YXMgc3BlY2lmaWVkIGFuZCBubyBleHRlbnNpb24gd2FzIHByb3ZpZGVkLlwiLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuZXh0KSB7XG4gICAgICAvLyBnZXQgZXh0ZW5zaW9uIGZyb20gZGVmYXVsdCBlbmdpbmUgbmFtZVxuICAgICAgdGhpcy5leHQgPSB0aGlzLmRlZmF1bHRFbmdpbmVbMF0gIT09IFwiLlwiXG4gICAgICAgID8gYC4ke3RoaXMuZGVmYXVsdEVuZ2luZX1gXG4gICAgICAgIDogdGhpcy5kZWZhdWx0RW5naW5lO1xuXG4gICAgICBmaWxlTmFtZSArPSB0aGlzLmV4dDtcbiAgICB9XG5cbiAgICBpZiAoIW9wdGlvbnMuZW5naW5lc1t0aGlzLmV4dF0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYENvdWxkIG5vdCBmaW5kIGEgdmlldyBlbmdpbmUgZm9yIGV4dGVuc2lvbiBcIiR7dGhpcy5leHR9XCJgLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBzdG9yZSBsb2FkZWQgZW5naW5lXG4gICAgdGhpcy5lbmdpbmUgPSBvcHRpb25zLmVuZ2luZXNbdGhpcy5leHRdO1xuXG4gICAgLy8gbG9va3VwIHBhdGhcbiAgICB0aGlzLnBhdGggPSB0aGlzLmxvb2t1cChmaWxlTmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzb2x2ZSB0aGUgZmlsZSB3aXRoaW4gdGhlIGdpdmVuIGRpcmVjdG9yeS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGRpclxuICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcmVzb2x2ZShkaXI6IHN0cmluZywgZmlsZTogc3RyaW5nKSB7XG4gICAgbGV0IHBhdGggPSBqb2luKGRpciwgZmlsZSk7XG4gICAgbGV0IHN0YXQgPSB0cnlTdGF0KHBhdGgpO1xuXG4gICAgaWYgKHN0YXQgJiYgc3RhdC5pc0ZpbGUpIHtcbiAgICAgIHJldHVybiBwYXRoO1xuICAgIH1cblxuICAgIC8vIDxwYXRoPi9pbmRleC48ZXh0PlxuICAgIGNvbnN0IGV4dCA9IHRoaXMuZXh0O1xuICAgIHBhdGggPSBqb2luKGRpciwgYmFzZW5hbWUoZmlsZSwgZXh0KSwgYGluZGV4JHtleHR9YCk7XG4gICAgc3RhdCA9IHRyeVN0YXQocGF0aCk7XG5cbiAgICBpZiAoc3RhdCAmJiBzdGF0LmlzRmlsZSkge1xuICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIExvb2t1cCB2aWV3IGJ5IHRoZSBnaXZlbiBgbmFtZWBcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGxvb2t1cChuYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCByb290cyA9IFtdLmNvbmNhdCh0aGlzLnJvb3QpO1xuICAgIGxldCBwYXRoO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb290cy5sZW5ndGggJiYgIXBhdGg7IGkrKykge1xuICAgICAgY29uc3Qgcm9vdCA9IHJvb3RzW2ldO1xuICAgICAgY29uc3QgbG9jID0gcmVzb2x2ZShyb290LCBuYW1lKTtcbiAgICAgIGNvbnN0IGRpciA9IGRpcm5hbWUobG9jKTtcbiAgICAgIGNvbnN0IGZpbGUgPSBiYXNlbmFtZShsb2MpO1xuICAgICAgcGF0aCA9IHRoaXMucmVzb2x2ZShkaXIsIGZpbGUpO1xuICAgIH1cblxuICAgIHJldHVybiBwYXRoO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbmRlciB3aXRoIHRoZSBnaXZlbiBvcHRpb25zLlxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgYXN5bmMgcmVuZGVyKG9wdGlvbnM6IG9iamVjdCwgY2FsbGJhY2s6IEZ1bmN0aW9uKSB7XG4gICAgY29uc3Qgb3V0ID0gYXdhaXQgdGhpcy5lbmdpbmUodGhpcy5wYXRoLCBvcHRpb25zKTtcbiAgICBjYWxsYmFjayh1bmRlZmluZWQsIG91dCk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FDRSxRQUFRLEVBQ1IsT0FBTyxFQUNQLE9BQU8sRUFDUCxXQUFXLEVBQ1gsSUFBSSxFQUNKLE9BQU8sU0FDRixVQUFZO0FBRW5CLEVBTUcsQUFOSDs7Ozs7O0NBTUcsQUFOSCxFQU1HLFVBQ00sT0FBTyxDQUFDLElBQVk7O2VBRWxCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSTthQUNsQixDQUFDO2VBQ0QsU0FBUzs7O1NBSVgsTUFBTSxDQUFDLFFBQWdCO1dBQ3ZCLFFBQVEsQ0FBQyxVQUFVLEVBQUMsS0FBTyxLQUFJLFdBQVcsQ0FBQyxRQUFRLElBQUksUUFBUTs7YUFHM0QsSUFBSTtJQUNmLGFBQWE7SUFDYixHQUFHO0lBQ0gsSUFBSTtJQUNKLElBQUk7SUFDSixNQUFNO0lBQ04sSUFB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
