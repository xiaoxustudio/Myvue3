import { hasChange, isArray, isObject } from "@vue/share"
import { track, trigger } from "./effect"
import { TrackTypes, TriggerOrTypes } from "./operators"
import { reactive } from "./reactive"

/*
 * @Author: xuranXYS
 * @LastEditTime: 2024-03-05 14:09:23
 * @GitHub: www.github.com/xiaoxustudio
 * @WebSite: www.xiaoxustudio.top
 * @Description: By xuranXYS
 */
export function ref(value) { // value 为普通类型，将普通类型转变为对象
    return createRef(value)
}

// ref和reactive 的区别 ： reactive内部采用proxy，ref中内部采用是defineProperty

export function shallowRef(value) { // value 为普通类型，将普通类型转变为对象
    return createRef(value, true)
}

const convert = (val) => isObject(val) ? reactive(val) : val

// 看我们vue3的源码，都用了高阶函数，做了类似柯里化的处理
class RefImpl {
    public _value // 声明了，没赋值
    public __v_isRef = true  // 产生的实例会被添加 __v_isRef，表示是一个ref属性
    constructor(public rawValue,public shallow) {// 参数前面增加修饰符public表示参数放在实例上
        this._value = shallow?  rawValue : convert(rawValue)// 如果是浅，则直接放置，不是浅的则全部转换为响应式
    }
    get value(){
        track(this,TrackTypes.GET,"value")
        return this._value
    }
    set value(val){
        // 判断旧值和新值是否一致
        if(hasChange(this._value,val)){
            this.rawValue = val
            this._value = this.shallow ? val : convert(val)
            trigger(this,TriggerOrTypes.SET,"value",val)
        }
    }
}
// rawValue 可以是对象，但一般用reactive
function createRef(rawValue: any, shallow: boolean = false) {
    return new RefImpl(rawValue, shallow)
}

class ObjectRefImpl{
    public __v_isRef = true  // 产生的实例会被添加 __v_isRef，表示是一个ref属性
    constructor(public target, public key){
    }
    get value(){
        return this.target[this.key]
    }
    set value(val){
        this.target[this.key] = val
    }
}

// 解决解构reactive时没有是响应式

export function toRef(target , key){ // 可以将一个属性转换成ref
    return new ObjectRefImpl(target,key)
}


export function toRefs(object){
    const ref = isArray(object) ? new Array(object.length) : {} // object 可能是数组或对象
    for(let key in object){
        ref[key] = toRef(object,key)
    }
    return ref
}
