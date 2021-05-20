const initMatrix = (a, b) => {
  let d = [];
  for (let i = 0; i <= a.length; i++) {
    d[i] = [];
    d[i][0] = i;
  }
  for (let j = 0; j <= b.length; j++) {
    d[0][j] = j;
  }
  return d;
};
const damerau = (i, j, a, b, d, cost) => {
  if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
    d[i][j] = Math.min.apply(null, [
      d[i][j],
      d[i - 2][j - 2] + cost,
    ]);
  }
};
/** Get the Damerau-Levenshtein distance between 2 strings */ export function distance(
  a,
  b,
) {
  let d = initMatrix(a, b);
  for (var i = 1; i <= a.length; i++) {
    let cost;
    for (let j = 1; j <= b.length; j++) {
      if (a.charAt(i - 1) === b.charAt(j - 1)) {
        cost = 0;
      } else {
        cost = 1;
      }
      d[i][j] = Math.min.apply(null, [
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost,
      ]);
      damerau(i, j, a, b, d, cost);
    }
  }
  return d[a.length][b.length];
}
export function distanceList(target, list) {
  return list.map((string) => {
    return distanceDamerau(target, string);
  });
}
export function distanceDamerau(string, compared) {
  return {
    string: string,
    compared: compared,
    distance: distance(string, compared),
  };
}
/** Compare distance between 2 words (format like StringWithDistance). */ export function compareDistance(
  a,
  b,
) {
  return a.distance > b.distance ? 1 : a.distance < b.distance ? -1 : 0;
}
/**  Get the minimum Damerau-Levenshtein distance between a string and an array of strings*/ export function minDistance(
  string,
  list,
) {
  const arrayStrings = distanceList(string, list);
  return arrayStrings.length === 0
    ? string.length
    : arrayStrings.reduce(
      (min, b) => Math.min(min, b.distance),
      arrayStrings[0].distance,
    );
}
export function sortByMinDistance(list) {
  return list.concat().sort(compareDistance);
}
export function sortWordByMinDistance(target, list) {
  const listWithDistance = distanceList(target, list);
  return sortByMinDistance(listWithDistance);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2RhbWVyYXVfbGV2ZW5zaHRlaW5AdjAuMS4wL21vZC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLyoqIEludGVyZmFjZSBmb3Igc3RyaW5nLCBjb21wYXJlZCBzdHJpbmcgYW5kIGRpc3RhbmNlIGJlZXR3ZWVuICovXG5leHBvcnQgaW50ZXJmYWNlIFN0cmluZ1dpdGhEaXN0YW5jZSB7XG4gIHN0cmluZzogc3RyaW5nO1xuICBjb21wYXJlZDogc3RyaW5nO1xuICBkaXN0YW5jZTogbnVtYmVyO1xufVxuXG5jb25zdCBpbml0TWF0cml4ID0gKGE6IHN0cmluZywgYjogc3RyaW5nKTogbnVtYmVyW11bXSA9PiB7XG4gIGxldCBkOiBudW1iZXJbXVtdID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPD0gYS5sZW5ndGg7IGkrKykge1xuICAgIGRbaV0gPSBbXTtcbiAgICBkW2ldWzBdID0gaTtcbiAgfVxuICBmb3IgKGxldCBqID0gMDsgaiA8PSBiLmxlbmd0aDsgaisrKSB7XG4gICAgZFswXVtqXSA9IGo7XG4gIH1cblxuICByZXR1cm4gZDtcbn07XG5cbmNvbnN0IGRhbWVyYXUgPSAoXG4gIGk6IG51bWJlcixcbiAgajogbnVtYmVyLFxuICBhOiBzdHJpbmcsXG4gIGI6IHN0cmluZyxcbiAgZDogbnVtYmVyW11bXSxcbiAgY29zdDogbnVtYmVyLFxuKSA9PiB7XG4gIGlmIChpID4gMSAmJiBqID4gMSAmJiBhW2kgLSAxXSA9PT0gYltqIC0gMl0gJiYgYVtpIC0gMl0gPT09IGJbaiAtIDFdKSB7XG4gICAgZFtpXVtqXSA9IE1hdGgubWluLmFwcGx5KG51bGwsIFtkW2ldW2pdLCBkW2kgLSAyXVtqIC0gMl0gKyBjb3N0XSk7XG4gIH1cbn07XG5cbi8qKiBHZXQgdGhlIERhbWVyYXUtTGV2ZW5zaHRlaW4gZGlzdGFuY2UgYmV0d2VlbiAyIHN0cmluZ3MgKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXN0YW5jZShhOiBzdHJpbmcsIGI6IHN0cmluZykge1xuICBsZXQgZDogbnVtYmVyW11bXSA9IGluaXRNYXRyaXgoYSwgYik7XG4gIGZvciAodmFyIGkgPSAxOyBpIDw9IGEubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgY29zdDogbnVtYmVyO1xuICAgIGZvciAobGV0IGogPSAxOyBqIDw9IGIubGVuZ3RoOyBqKyspIHtcbiAgICAgIGlmIChhLmNoYXJBdChpIC0gMSkgPT09IGIuY2hhckF0KGogLSAxKSkge1xuICAgICAgICBjb3N0ID0gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvc3QgPSAxO1xuICAgICAgfVxuXG4gICAgICBkW2ldW2pdID0gTWF0aC5taW4uYXBwbHkobnVsbCwgW1xuICAgICAgICBkW2kgLSAxXVtqXSArIDEsXG4gICAgICAgIGRbaV1baiAtIDFdICsgMSxcbiAgICAgICAgZFtpIC0gMV1baiAtIDFdICsgY29zdCxcbiAgICAgIF0pO1xuXG4gICAgICBkYW1lcmF1KGksIGosIGEsIGIsIGQsIGNvc3QpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZFthLmxlbmd0aF1bYi5sZW5ndGhdO1xufS8qKiBSZXR1cm4gYW4gYXJyeSBvZiBTdHJpbmdXaXRoRGlzdGFuY2Ugd2l0aCB0aGUgZGlzdGFuY2UgZnJvbSB0aGUgY29tcGFyZWQgc3RyaW5nKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGRpc3RhbmNlTGlzdChcbiAgdGFyZ2V0OiBzdHJpbmcsXG4gIGxpc3Q6IEFycmF5PHN0cmluZz4sXG4pOiBBcnJheTxTdHJpbmdXaXRoRGlzdGFuY2U+IHtcbiAgcmV0dXJuIGxpc3QubWFwKChzdHJpbmcpID0+IHtcbiAgICByZXR1cm4gZGlzdGFuY2VEYW1lcmF1KHRhcmdldCwgc3RyaW5nKTtcbiAgfSk7XG59LyoqIFJldHVybiBhbiBvYmplY3Qgd2l0aCBzdHJpbmcsIGNvbXBhcmVkIHN0cmluZyBhbmQgZGlzdGFuY2UgYmVldHdlZW4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGRpc3RhbmNlRGFtZXJhdShcbiAgc3RyaW5nOiBzdHJpbmcsXG4gIGNvbXBhcmVkOiBzdHJpbmcsXG4pOiBTdHJpbmdXaXRoRGlzdGFuY2Uge1xuICByZXR1cm4ge1xuICAgIHN0cmluZzogc3RyaW5nLFxuICAgIGNvbXBhcmVkOiBjb21wYXJlZCxcbiAgICBkaXN0YW5jZTogZGlzdGFuY2Uoc3RyaW5nLCBjb21wYXJlZCksXG4gIH07XG59XG5cbi8qKiBDb21wYXJlIGRpc3RhbmNlIGJldHdlZW4gMiB3b3JkcyAoZm9ybWF0IGxpa2UgU3RyaW5nV2l0aERpc3RhbmNlKS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wYXJlRGlzdGFuY2UoXG4gIGE6IFN0cmluZ1dpdGhEaXN0YW5jZSxcbiAgYjogU3RyaW5nV2l0aERpc3RhbmNlLFxuKTogbnVtYmVyIHtcbiAgcmV0dXJuIGEuZGlzdGFuY2UgPiBiLmRpc3RhbmNlID8gMSA6IGEuZGlzdGFuY2UgPCBiLmRpc3RhbmNlID8gLTEgOiAwO1xufVxuXG4vKiogIEdldCB0aGUgbWluaW11bSBEYW1lcmF1LUxldmVuc2h0ZWluIGRpc3RhbmNlIGJldHdlZW4gYSBzdHJpbmcgYW5kIGFuIGFycmF5IG9mIHN0cmluZ3MqL1xuZXhwb3J0IGZ1bmN0aW9uIG1pbkRpc3RhbmNlKFxuICBzdHJpbmc6IHN0cmluZyxcbiAgbGlzdDogQXJyYXk8c3RyaW5nPixcbik6IG51bWJlciB7XG4gIGNvbnN0IGFycmF5U3RyaW5nczogQXJyYXk8U3RyaW5nV2l0aERpc3RhbmNlPiA9IGRpc3RhbmNlTGlzdChzdHJpbmcsIGxpc3QpO1xuICByZXR1cm4gYXJyYXlTdHJpbmdzLmxlbmd0aCA9PT0gMCA/IHN0cmluZy5sZW5ndGggOiBhcnJheVN0cmluZ3MucmVkdWNlKFxuICAgIChtaW4sIGIpID0+IE1hdGgubWluKG1pbiwgYi5kaXN0YW5jZSksXG4gICAgYXJyYXlTdHJpbmdzWzBdLmRpc3RhbmNlLFxuICApO1xufS8qKiBSZXR1cm4gYW4gYXJyeSBvZiBTdHJpbmdXaXRoRGlzdGFuY2Ugc29ydGVkIGJ5IG1pbiBkaXN0YW5jZSAqL1xuXG5leHBvcnQgZnVuY3Rpb24gc29ydEJ5TWluRGlzdGFuY2UoXG4gIGxpc3Q6IEFycmF5PFN0cmluZ1dpdGhEaXN0YW5jZT4sXG4pOiBBcnJheTxTdHJpbmdXaXRoRGlzdGFuY2U+IHtcbiAgcmV0dXJuIGxpc3QuY29uY2F0KCkuc29ydChjb21wYXJlRGlzdGFuY2UpO1xufS8qKiBSZXR1cm4gYW4gYXJyeSBvZiBTdHJpbmdXaXRoRGlzdGFuY2Ugc29ydGVkIGJ5IG1pbiBkaXN0YW5jZSAqL1xuXG5leHBvcnQgZnVuY3Rpb24gc29ydFdvcmRCeU1pbkRpc3RhbmNlKFxuICB0YXJnZXQ6IHN0cmluZyxcbiAgbGlzdDogQXJyYXk8c3RyaW5nPixcbik6IEFycmF5PFN0cmluZ1dpdGhEaXN0YW5jZT4ge1xuICBjb25zdCBsaXN0V2l0aERpc3RhbmNlOiBBcnJheTxTdHJpbmdXaXRoRGlzdGFuY2U+ID0gZGlzdGFuY2VMaXN0KFxuICAgIHRhcmdldCxcbiAgICBsaXN0LFxuICApO1xuICByZXR1cm4gc29ydEJ5TWluRGlzdGFuY2UobGlzdFdpdGhEaXN0YW5jZSk7XG59Ly8gaW50ZXJmYWNlIENvbXBhcmVTdHJpbmdzIHtcbi8vICAgZmlyc3RTdHJpbmc6IHN0cmluZztcbi8vICAgc2Vjb25kU3RyaW5nOiBzdHJpbmc7XG4vLyAgIHRhcmdldDogc3RyaW5nO1xuLy8gfVxuLy9cbi8vIGV4cG9ydCBmdW5jdGlvbiBjb21wYXJlRGlzdGFuY2VCZXR3ZWVuV29yZHMob2JqOiBDb21wYXJlU3RyaW5ncyk6IG51bWJlciB7XG4vLyAgIHJldHVybiBjb21wYXJlRGlzdGFuY2UoXG4vLyAgICAgZGlzdGFuY2VEYW1lcmF1KG9iai5maXJzdFN0cmluZywgb2JqLnRhcmdldCksXG4vLyAgICAgZGlzdGFuY2VEYW1lcmF1KG9iai5zZWNvbmRTdHJpbmcsIG9iai50YXJnZXQpLFxuLy8gICApO1xuLy8gfVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJNQU9NLFVBQVUsSUFBSSxDQUFTLEVBQUUsQ0FB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