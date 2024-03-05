const isObject = (target) => typeof target === "object" && target !== null;
const extend = Object.assign;
const isArray = Array.isArray;
const isFunction = (value) => typeof value === "function";
const isNumber = (value) => typeof value === "number";
const isString = (value) => typeof value === "string";
const isIntegerKey = (value) => parseInt(value) + "" === value;
let hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (target, value) => hasOwnProperty.call(target, value);
const hasChange = (oldValue, value) => oldValue !== value;

export { extend, hasChange, hasOwn, isArray, isFunction, isIntegerKey, isNumber, isObject, isString };
//# sourceMappingURL=share.esm-bundler.js.map
