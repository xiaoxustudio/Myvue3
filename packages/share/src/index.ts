export const isObject = (target) => typeof target === "object" && target !== null
export const extend = Object.assign
export const isArray = Array.isArray
export const isFunction = (value) => typeof value === "function"
export const isNumber = (value) => typeof value === "number"
export const isString = (value) => typeof value === "string"
export const isIntegerKey = (value) => parseInt(value) + "" === value

let hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (target , value) => hasOwnProperty.call(target,value)
export const hasChange = (oldValue,value) => oldValue !== value

