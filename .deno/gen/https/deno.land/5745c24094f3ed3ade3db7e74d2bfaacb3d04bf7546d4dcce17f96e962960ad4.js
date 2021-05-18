/**
 * Merge object b with object a.
 *
 * @param {object} a
 * @param {object} b
 * @return {object}
 * @public
 */ export function merge(a, b) {
  if (a && b) {
    for (let key in b) {
      a[key] = b[key];
    }
  }
  return a;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy91dGlscy9tZXJnZS50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBNZXJnZSBvYmplY3QgYiB3aXRoIG9iamVjdCBhLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBhXG4gKiBAcGFyYW0ge29iamVjdH0gYlxuICogQHJldHVybiB7b2JqZWN0fVxuICogQHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2UoYTogYW55LCBiOiBhbnkpOiBhbnkge1xuICBpZiAoYSAmJiBiKSB7XG4gICAgZm9yIChsZXQga2V5IGluIGIpIHtcbiAgICAgIGFba2V5XSA9IGJba2V5XTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQU9HLEFBUEg7Ozs7Ozs7Q0FPRyxBQVBILEVBT0csaUJBQ2EsS0FBSyxDQUFDLENBQU0sRUFBRSxDQUFNO1FBQzlCLENBQUMsSUFBSSxDQUFDO2dCQUNDLEdBQUcsSUFBSSxDQUFDO1lBQ2YsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRzs7O1dBSVgsQ0FBQyJ9
