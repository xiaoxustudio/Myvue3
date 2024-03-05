import { isObject } from "@vue/share"
import { mutableHandlers, readonlyHandlers, shallowReactiveHandlers, shallowReadonlyHandlers } from "./baseHandlers"


export function reactive(target) {
    return CreateReactiveObject(target, false, mutableHandlers)
}
export function shallowReactive(target) {
    return CreateReactiveObject(target, false, shallowReactiveHandlers)
}
export function readonly(target) {
    return CreateReactiveObject(target, true, readonlyHandlers)
}
export function shallowReadonly(target) {
    return CreateReactiveObject(target, true, shallowReadonlyHandlers)
}

const reactiveMap = new WeakMap()
const readyonlyMap = new WeakMap()

// 是不是只读，是不是深度，柯里化：拆解成接收单一参数的函数
// 底层还是proxy
export function CreateReactiveObject(target, isReadyonly, baseHandlers) {
    // 这个只能拦截对象，无法拦截不是对象的值
    if (!isObject(target)) {
        return target
    }
    const proxyMap = isReadyonly ? readyonlyMap : reactiveMap

    // 如果某个对象已经被代理了就不用被代理了，一个对象被深度代理了，又被仅读代理了
    const existProxy = proxyMap.get(target)
    if (existProxy) return existProxy


    const proxy = new Proxy(target, baseHandlers)
    proxyMap.set(target, proxy) // 将代理的对象存储缓存

    return proxy
}