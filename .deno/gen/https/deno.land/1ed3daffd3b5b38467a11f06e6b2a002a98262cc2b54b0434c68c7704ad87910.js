// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
/** This module is browser compatible. */
// Alphabet chars.
export const CHAR_UPPERCASE_A = 65;
export const CHAR_LOWERCASE_A = 97;
export const CHAR_UPPERCASE_Z = 90;
export const CHAR_LOWERCASE_Z = 122;
// Non-alphabetic chars.
export const CHAR_DOT = 46;
export const CHAR_FORWARD_SLASH = 47;
export const CHAR_BACKWARD_SLASH = 92;
export const CHAR_VERTICAL_LINE = 124;
export const CHAR_COLON = 58;
export const CHAR_QUESTION_MARK = 63;
export const CHAR_UNDERSCORE = 95;
export const CHAR_LINE_FEED = 10;
export const CHAR_CARRIAGE_RETURN = 13;
export const CHAR_TAB = 9;
export const CHAR_FORM_FEED = 12;
export const CHAR_EXCLAMATION_MARK = 33;
export const CHAR_HASH = 35;
export const CHAR_SPACE = 32;
export const CHAR_NO_BREAK_SPACE = 160;
export const CHAR_ZERO_WIDTH_NOBREAK_SPACE = 65279;
export const CHAR_LEFT_SQUARE_BRACKET = 91;
export const CHAR_RIGHT_SQUARE_BRACKET = 93;
export const CHAR_LEFT_ANGLE_BRACKET = 60;
export const CHAR_RIGHT_ANGLE_BRACKET = 62;
export const CHAR_LEFT_CURLY_BRACKET = 123;
export const CHAR_RIGHT_CURLY_BRACKET = 125;
export const CHAR_HYPHEN_MINUS = 45;
export const CHAR_PLUS = 43;
export const CHAR_DOUBLE_QUOTE = 34;
export const CHAR_SINGLE_QUOTE = 39;
export const CHAR_PERCENT = 37;
export const CHAR_SEMICOLON = 59;
export const CHAR_CIRCUMFLEX_ACCENT = 94;
export const CHAR_GRAVE_ACCENT = 96;
export const CHAR_AT = 64;
export const CHAR_AMPERSAND = 38;
export const CHAR_EQUAL = 61;
// Digits
export const CHAR_0 = 48;
export const CHAR_9 = 57;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC43OS4wL3BhdGgvX2NvbnN0YW50cy50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IHRoZSBCcm93c2VyaWZ5IGF1dGhvcnMuIE1JVCBMaWNlbnNlLlxuLy8gUG9ydGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2Jyb3dzZXJpZnkvcGF0aC1icm93c2VyaWZ5L1xuLyoqIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS4gKi9cblxuLy8gQWxwaGFiZXQgY2hhcnMuXG5leHBvcnQgY29uc3QgQ0hBUl9VUFBFUkNBU0VfQSA9IDY1OyAvKiBBICovXG5leHBvcnQgY29uc3QgQ0hBUl9MT1dFUkNBU0VfQSA9IDk3OyAvKiBhICovXG5leHBvcnQgY29uc3QgQ0hBUl9VUFBFUkNBU0VfWiA9IDkwOyAvKiBaICovXG5leHBvcnQgY29uc3QgQ0hBUl9MT1dFUkNBU0VfWiA9IDEyMjsgLyogeiAqL1xuXG4vLyBOb24tYWxwaGFiZXRpYyBjaGFycy5cbmV4cG9ydCBjb25zdCBDSEFSX0RPVCA9IDQ2OyAvKiAuICovXG5leHBvcnQgY29uc3QgQ0hBUl9GT1JXQVJEX1NMQVNIID0gNDc7IC8qIC8gKi9cbmV4cG9ydCBjb25zdCBDSEFSX0JBQ0tXQVJEX1NMQVNIID0gOTI7IC8qIFxcICovXG5leHBvcnQgY29uc3QgQ0hBUl9WRVJUSUNBTF9MSU5FID0gMTI0OyAvKiB8ICovXG5leHBvcnQgY29uc3QgQ0hBUl9DT0xPTiA9IDU4OyAvKiA6ICovXG5leHBvcnQgY29uc3QgQ0hBUl9RVUVTVElPTl9NQVJLID0gNjM7IC8qID8gKi9cbmV4cG9ydCBjb25zdCBDSEFSX1VOREVSU0NPUkUgPSA5NTsgLyogXyAqL1xuZXhwb3J0IGNvbnN0IENIQVJfTElORV9GRUVEID0gMTA7IC8qIFxcbiAqL1xuZXhwb3J0IGNvbnN0IENIQVJfQ0FSUklBR0VfUkVUVVJOID0gMTM7IC8qIFxcciAqL1xuZXhwb3J0IGNvbnN0IENIQVJfVEFCID0gOTsgLyogXFx0ICovXG5leHBvcnQgY29uc3QgQ0hBUl9GT1JNX0ZFRUQgPSAxMjsgLyogXFxmICovXG5leHBvcnQgY29uc3QgQ0hBUl9FWENMQU1BVElPTl9NQVJLID0gMzM7IC8qICEgKi9cbmV4cG9ydCBjb25zdCBDSEFSX0hBU0ggPSAzNTsgLyogIyAqL1xuZXhwb3J0IGNvbnN0IENIQVJfU1BBQ0UgPSAzMjsgLyogICAqL1xuZXhwb3J0IGNvbnN0IENIQVJfTk9fQlJFQUtfU1BBQ0UgPSAxNjA7IC8qIFxcdTAwQTAgKi9cbmV4cG9ydCBjb25zdCBDSEFSX1pFUk9fV0lEVEhfTk9CUkVBS19TUEFDRSA9IDY1Mjc5OyAvKiBcXHVGRUZGICovXG5leHBvcnQgY29uc3QgQ0hBUl9MRUZUX1NRVUFSRV9CUkFDS0VUID0gOTE7IC8qIFsgKi9cbmV4cG9ydCBjb25zdCBDSEFSX1JJR0hUX1NRVUFSRV9CUkFDS0VUID0gOTM7IC8qIF0gKi9cbmV4cG9ydCBjb25zdCBDSEFSX0xFRlRfQU5HTEVfQlJBQ0tFVCA9IDYwOyAvKiA8ICovXG5leHBvcnQgY29uc3QgQ0hBUl9SSUdIVF9BTkdMRV9CUkFDS0VUID0gNjI7IC8qID4gKi9cbmV4cG9ydCBjb25zdCBDSEFSX0xFRlRfQ1VSTFlfQlJBQ0tFVCA9IDEyMzsgLyogeyAqL1xuZXhwb3J0IGNvbnN0IENIQVJfUklHSFRfQ1VSTFlfQlJBQ0tFVCA9IDEyNTsgLyogfSAqL1xuZXhwb3J0IGNvbnN0IENIQVJfSFlQSEVOX01JTlVTID0gNDU7IC8qIC0gKi9cbmV4cG9ydCBjb25zdCBDSEFSX1BMVVMgPSA0MzsgLyogKyAqL1xuZXhwb3J0IGNvbnN0IENIQVJfRE9VQkxFX1FVT1RFID0gMzQ7IC8qIFwiICovXG5leHBvcnQgY29uc3QgQ0hBUl9TSU5HTEVfUVVPVEUgPSAzOTsgLyogJyAqL1xuZXhwb3J0IGNvbnN0IENIQVJfUEVSQ0VOVCA9IDM3OyAvKiAlICovXG5leHBvcnQgY29uc3QgQ0hBUl9TRU1JQ09MT04gPSA1OTsgLyogOyAqL1xuZXhwb3J0IGNvbnN0IENIQVJfQ0lSQ1VNRkxFWF9BQ0NFTlQgPSA5NDsgLyogXiAqL1xuZXhwb3J0IGNvbnN0IENIQVJfR1JBVkVfQUNDRU5UID0gOTY7IC8qIGAgKi9cbmV4cG9ydCBjb25zdCBDSEFSX0FUID0gNjQ7IC8qIEAgKi9cbmV4cG9ydCBjb25zdCBDSEFSX0FNUEVSU0FORCA9IDM4OyAvKiAmICovXG5leHBvcnQgY29uc3QgQ0hBUl9FUVVBTCA9IDYxOyAvKiA9ICovXG5cbi8vIERpZ2l0c1xuZXhwb3J0IGNvbnN0IENIQVJfMCA9IDQ4OyAvKiAwICovXG5leHBvcnQgY29uc3QgQ0hBUl85ID0gNTc7IC8qIDkgKi9cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUFpRCxBQUFqRCwrQ0FBaUQ7QUFDakQsRUFBNkQsQUFBN0QsMkRBQTZEO0FBQzdELEVBQXlDLEFBQXpDLHFDQUF5QyxBQUF6QyxFQUF5QyxDQUV6QyxFQUFrQixBQUFsQixnQkFBa0I7YUFDTCxnQkFBZ0IsR0FBRyxFQUFFO2FBQ3JCLGdCQUFnQixHQUFHLEVBQUU7YUFDckIsZ0JBQWdCLEdBQUcsRUFBRTthQUNyQixnQkFBZ0IsR0FBRyxHQUFHO0FBRW5DLEVBQXdCLEFBQXhCLHNCQUF3QjthQUNYLFFBQVEsR0FBRyxFQUFFO2FBQ2Isa0JBQWtCLEdBQUcsRUFBRTthQUN2QixtQkFBbUIsR0FBRyxFQUFFO2FBQ3hCLGtCQUFrQixHQUFHLEdBQUc7YUFDeEIsVUFBVSxHQUFHLEVBQUU7YUFDZixrQkFBa0IsR0FBRyxFQUFFO2FBQ3ZCLGVBQWUsR0FBRyxFQUFFO2FBQ3BCLGNBQWMsR0FBRyxFQUFFO2FBQ25CLG9CQUFvQixHQUFHLEVBQUU7YUFDekIsUUFBUSxHQUFHLENBQUM7YUFDWixjQUFjLEdBQUcsRUFBRTthQUNuQixxQkFBcUIsR0FBRyxFQUFFO2FBQzFCLFNBQVMsR0FBRyxFQUFFO2FBQ2QsVUFBVSxHQUFHLEVBQUU7YUFDZixtQkFBbUIsR0FBRyxHQUFHO2FBQ3pCLDZCQUE2QixHQUFHLEtBQUs7YUFDckMsd0JBQXdCLEdBQUcsRUFBRTthQUM3Qix5QkFBeUIsR0FBRyxFQUFFO2FBQzlCLHVCQUF1QixHQUFHLEVBQUU7YUFDNUIsd0JBQXdCLEdBQUcsRUFBRTthQUM3Qix1QkFBdUIsR0FBRyxHQUFHO2FBQzdCLHdCQUF3QixHQUFHLEdBQUc7YUFDOUIsaUJBQWlCLEdBQUcsRUFBRTthQUN0QixTQUFTLEdBQUcsRUFBRTthQUNkLGlCQUFpQixHQUFHLEVBQUU7YUFDdEIsaUJBQWlCLEdBQUcsRUFBRTthQUN0QixZQUFZLEdBQUcsRUFBRTthQUNqQixjQUFjLEdBQUcsRUFBRTthQUNuQixzQkFBc0IsR0FBRyxFQUFFO2FBQzNCLGlCQUFpQixHQUFHLEVBQUU7YUFDdEIsT0FBTyxHQUFHLEVBQUU7YUFDWixjQUFjLEdBQUcsRUFBRTthQUNuQixVQUFVLEdBQUcsRUFBRTtBQUU1QixFQUFTLEFBQVQsT0FBUzthQUNJLE1BQU0sR0FBRyxFQUFFO2FBQ1gsTUFBTSxHQUFHLEVBQUUifQ==
