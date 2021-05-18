/*!
 * escape-html
 * Copyright(c) 2012-2013 TJ Holowaychuk
 * Copyright(c) 2015 Andreas Lubbe
 * Copyright(c) 2015 Tiancheng "Timothy" Gu
 * Copyright (c) 2020 Henry Zhuang
 * MIT Licensed
 */ const matchHtmlRegExp = /["'&<>]/;
/**
 * Escape special characters in the given string of text.
 *
 * @param  {string} string The string to escape for inserting into HTML
 * @return {string}
 * @public
 */ export function escapeHtml(string) {
  const str = "" + string;
  const match = matchHtmlRegExp.exec(str);
  if (!match) {
    return str;
  }
  let escape;
  let html = "";
  let index = 0;
  let lastIndex = 0;
  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34:
        escape = "&quot;";
        break;
      case 38:
        escape = "&amp;";
        break;
      case 39:
        escape = "&#39;";
        break;
      case 60:
        escape = "&lt;";
        break;
      case 62:
        escape = "&gt;";
        break;
      default:
        continue;
    }
    if (lastIndex !== index) {
      html += str.substring(lastIndex, index);
    }
    lastIndex = index + 1;
    html += escape;
  }
  return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2VzY2FwZV9odG1sQDEuMC4wL21vZC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiBlc2NhcGUtaHRtbFxuICogQ29weXJpZ2h0KGMpIDIwMTItMjAxMyBUSiBIb2xvd2F5Y2h1a1xuICogQ29weXJpZ2h0KGMpIDIwMTUgQW5kcmVhcyBMdWJiZVxuICogQ29weXJpZ2h0KGMpIDIwMTUgVGlhbmNoZW5nIFwiVGltb3RoeVwiIEd1XG4gKiBDb3B5cmlnaHQgKGMpIDIwMjAgSGVucnkgWmh1YW5nXG4gKiBNSVQgTGljZW5zZWRcbiAqL1xuXG5jb25zdCBtYXRjaEh0bWxSZWdFeHAgPSAvW1wiJyY8Pl0vO1xuXG4vKipcbiAqIEVzY2FwZSBzcGVjaWFsIGNoYXJhY3RlcnMgaW4gdGhlIGdpdmVuIHN0cmluZyBvZiB0ZXh0LlxuICpcbiAqIEBwYXJhbSAge3N0cmluZ30gc3RyaW5nIFRoZSBzdHJpbmcgdG8gZXNjYXBlIGZvciBpbnNlcnRpbmcgaW50byBIVE1MXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKiBAcHVibGljXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGVzY2FwZUh0bWwoc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBzdHIgPSBcIlwiICsgc3RyaW5nO1xuICBjb25zdCBtYXRjaCA9IG1hdGNoSHRtbFJlZ0V4cC5leGVjKHN0cik7XG5cbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVybiBzdHI7XG4gIH1cblxuICBsZXQgZXNjYXBlO1xuICBsZXQgaHRtbCA9IFwiXCI7XG4gIGxldCBpbmRleCA9IDA7XG4gIGxldCBsYXN0SW5kZXggPSAwO1xuXG4gIGZvciAoaW5kZXggPSBtYXRjaC5pbmRleDsgaW5kZXggPCBzdHIubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgc3dpdGNoIChzdHIuY2hhckNvZGVBdChpbmRleCkpIHtcbiAgICAgIGNhc2UgMzQ6IC8vIFwiXG4gICAgICAgIGVzY2FwZSA9IFwiJnF1b3Q7XCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzODogLy8gJlxuICAgICAgICBlc2NhcGUgPSBcIiZhbXA7XCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOTogLy8gJ1xuICAgICAgICBlc2NhcGUgPSBcIiYjMzk7XCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA2MDogLy8gPFxuICAgICAgICBlc2NhcGUgPSBcIiZsdDtcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDYyOiAvLyA+XG4gICAgICAgIGVzY2FwZSA9IFwiJmd0O1wiO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChsYXN0SW5kZXggIT09IGluZGV4KSB7XG4gICAgICBodG1sICs9IHN0ci5zdWJzdHJpbmcobGFzdEluZGV4LCBpbmRleCk7XG4gICAgfVxuXG4gICAgbGFzdEluZGV4ID0gaW5kZXggKyAxO1xuICAgIGh0bWwgKz0gZXNjYXBlO1xuICB9XG5cbiAgcmV0dXJuIGxhc3RJbmRleCAhPT0gaW5kZXggPyBodG1sICsgc3RyLnN1YnN0cmluZyhsYXN0SW5kZXgsIGluZGV4KSA6IGh0bWw7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFPRyxBQVBIOzs7Ozs7O0NBT0csQUFQSCxFQU9HLE9BRUcsZUFBZTtBQUVyQixFQU1HLEFBTkg7Ozs7OztDQU1HLEFBTkgsRUFNRyxpQkFFYSxVQUFVLENBQUMsTUFBYztVQUNqQyxHQUFHLFFBQVEsTUFBTTtVQUNqQixLQUFLLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHO1NBRWpDLEtBQUs7ZUFDRCxHQUFHOztRQUdSLE1BQU07UUFDTixJQUFJO1FBQ0osS0FBSyxHQUFHLENBQUM7UUFDVCxTQUFTLEdBQUcsQ0FBQztRQUVaLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLEtBQUs7ZUFDekMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLO2lCQUNyQixFQUFFO2dCQUNMLE1BQU0sSUFBRyxNQUFROztpQkFFZCxFQUFFO2dCQUNMLE1BQU0sSUFBRyxLQUFPOztpQkFFYixFQUFFO2dCQUNMLE1BQU0sSUFBRyxLQUFPOztpQkFFYixFQUFFO2dCQUNMLE1BQU0sSUFBRyxJQUFNOztpQkFFWixFQUFFO2dCQUNMLE1BQU0sSUFBRyxJQUFNOzs7OztZQU1mLFNBQVMsS0FBSyxLQUFLO1lBQ3JCLElBQUksSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxLQUFLOztRQUd4QyxTQUFTLEdBQUcsS0FBSyxHQUFHLENBQUM7UUFDckIsSUFBSSxJQUFJLE1BQU07O1dBR1QsU0FBUyxLQUFLLEtBQUssR0FBRyxJQUFJLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsS0FBSyxJQUFJLElBQUkifQ==
