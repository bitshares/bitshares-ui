const preciseOperation = f => (a, b, decimalDigits = 6) =>
    +f(a, b).toFixed(decimalDigits);

const add = (a, b) => a + b;
const minus = (a, b) => a - b;
const multiply = (a, b) => a * b;
const divide = (a, b) => a / b;
export const preciseAdd = (a, b, decimalDigits) =>
    preciseOperation(add)(a, b, decimalDigits);
export const preciseMinus = (a, b, decimalDigits) =>
    preciseOperation(minus)(a, b, decimalDigits);
export const preciseMultiply = (a, b, decimalDigits) =>
    preciseOperation(multiply)(a, b, decimalDigits);
export const preciseDivide = (a, b, decimalDigits) =>
    preciseOperation(divide)(a, b, decimalDigits);
