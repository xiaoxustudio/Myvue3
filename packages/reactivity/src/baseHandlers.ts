/*
 * @Author: xuranXYS
 * @LastEditTime: 2024-03-04 21:50:00
 * @GitHub: www.github.com/xiaoxustudio
 * @WebSite: www.xiaoxustudio.top
 * @Description: By xuranXYS
 */

import { extend, hasChange, hasOwn, isArray, isIntegerKey, isObject } from "@vue/share"
import { reactive, readonly } from "./reactive"
import { track, trigger } from "./effect"
import { TrackTypes, TriggerOrTypes } from "./operators"

// 实现new Proxy(target , handler) 的 get 和 set

// 是不是仅读，仅读set报错
// 是不是深度
let readyonlyObj = {
    set: (target, key, val) => {
        console.warn(`(readonly) connot set attributes : '${key}' , because the object is readonly : \n`, target)
    }
}


function createGetter(isReadyonly = false, shallow = false) {
    return function get(target, key, receiver) { // let proxy = reactive()

        // Reflect 方法具有返回值

        const res = Reflect.get(target, key, receiver) // target[key]
        if (!isReadyonly) {
            // 收集依赖，等会数据变化时更新对应的视图
            track(target,TrackTypes.GET,key)
        }
        if (shallow) return res

        // 取值时进行代理 -> vue3 的代理模式：懒代理
        if (isObject(res)) {
            return isReadyonly ? readonly(res) : reactive(res)
        }
        return res
    }
}
function createSetter(shallow = false) { // 拦截set设置
    return function set(target, key, value, receiver) {
        const oldValue = target[key] // 获取旧值：有则是修改操作，没有则是新增操作
        // 是数组则另外判断
        let hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : 
        hasOwn(target,key) // 既是数组，且是数字索引
        // 如果是索引内，则是修改，不是则是新增

        const res = Reflect.set(target, key, value, receiver)  // target[key] = value
        // 通知对应属性的effect 重新执行
        
        if(!hadKey){
            // 新增
            trigger(target,TriggerOrTypes.ADD,key,value)
        }else if(hasChange(oldValue,value)){
            // 修改
            trigger(target,TriggerOrTypes.SET,key,value,oldValue) // 传个旧值区分
        }
        
        // 旧值和新值一样，不需要修改
        return res
    }
}

const get = createGetter()
const shallowGet = createGetter(false, true)
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

const set = createSetter()
const shallowSet = createSetter(true)

export const mutableHandlers = {
    get,
    set
}
export const shallowReactiveHandlers = {
    get: shallowGet,
    set: shallowSet
}


export const readonlyHandlers = extend({
    get: readonlyGet
}, readyonlyObj)

export const shallowReadonlyHandlers = extend({
    get: shallowReadonlyGet,
}, readyonlyObj)

