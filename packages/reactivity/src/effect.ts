import { isArray, isIntegerKey } from "@vue/share"
import { TrackTypes, TriggerOrTypes } from "./operators"

/*
 * @Author: xuranXYS
 * @LastEditTime: 2024-03-04 22:40:00
 * @GitHub: www.github.com/xiaoxustudio
 * @WebSite: www.xiaoxustudio.top
 * @Description: By xuranXYS
 */
export function effect(fn, options: any = {}) {
    // 需要将fn变成响应式
    // 当数据变化时就重新执行
    const effect = createReactiveEffect(fn, options)
    if (!options.lazy) {
        effect() // 默认会执行一次
    }
    return effect
}

let uid = 0
let activeEffect // 存储当前的effect
const effectStack = [] // effect栈

function createReactiveEffect(fn, options) {
    const effect = function reactiveEffect() {
        // 判断当前的函数是否在栈中，在栈中则不入栈，防止死循环
        if (!effectStack.includes(effect)) {
            // 如果函数异常，finally也会正常出栈
            try {
                effectStack.push(effect) // 入栈
                activeEffect = effect
                return fn() // 取值时会执行get
            } finally {
                effectStack.pop() // 出栈（抛弃）
                activeEffect = effectStack[effectStack.length - 1] // 重定向当前effect
            }
        }
    }
    effect.id = uid++ // 制作标识，用于排序先后顺序，和区分effect
    effect._isEffect = true // 用于标识这个是一个响应式effect
    effect.raw = fn // 保留原函数
    effect.options = options // 保存属性选项
    return effect
}
let targetMap = new WeakMap()
export function track(target, type: TrackTypes, key) { // 可以拿到当前正在运行的effect
    if (activeEffect == void 0) { return /* 此属性不用收集依赖，因为他没有在effect中使用 */ }
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map))
    }
    let dep = depsMap.get(key)
    if (!dep) {
        depsMap.set(key, (dep = new Set))
    }
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect)
    }
}

// 找属性对应的effect 让其执行 （数组、对象）
export function trigger(target, type: TriggerOrTypes, key?, newValue?, oldValue?) {
    // 如果该属性没有收集过effect ，就不做任何处理
    let depsMap = targetMap.get(target)
    if (!depsMap) return
    const add = (effectsToAdd) => {
        if (effectsToAdd) {
            effectsToAdd.forEach(effect => {
                effects.add(effect)
            });
        }
    }
    // 我们将所有的effect 集中到一起执行
    const effects = new Set()
    // 看修改的是否是长度，因为修改长度，影响比较大，所以优先级比较高
    if (key === "length" && isArray(target)) {
        // 如果对应的长度有依赖收集，需要更新
        depsMap.forEach((dep, key) => {
            if (key === "length" || key > newValue) { // 如果更改的长度小于收集的索引（数组会重新排序，所以原长度必定会大于新值）
                add(dep)
            }
        });
    } else {
        // 可能是对象，触发就ok
        if (key !== undefined) { // 修改，且有effect
            add(depsMap.get(key))
        }
        // 特殊处理
        switch (type) {
            case TriggerOrTypes.ADD:
                if (isArray(target) && isIntegerKey(key)) { // 是数组，且增加了索引
                    add(depsMap.get("length")) // 触发长度更新
                }
                break
        }
    }
    effects.forEach((ef: Function) => ef())
}