'use strict';

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

exports.extend = extend;
exports.hasChange = hasChange;
exports.hasOwn = hasOwn;
exports.isArray = isArray;
exports.isFunction = isFunction;
exports.isIntegerKey = isIntegerKey;
exports.isNumber = isNumber;
exports.isObject = isObject;
exports.isString = isString;
//# sourceMappingURL=share.cjs.js.map
