'use strict';

const isObject = (target) => typeof target === "object" && target !== null;
const extend = Object.assign;
const isArray = Array.isArray;
const isIntegerKey = (value) => parseInt(value) + "" === value;
let hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (target, value) => hasOwnProperty.call(target, value);
const hasChange = (oldValue, value) => oldValue !== value;

/*
 * @Author: xuranXYS
 * @LastEditTime: 2024-03-04 22:40:00
 * @GitHub: www.github.com/xiaoxustudio
 * @WebSite: www.xiaoxustudio.top
 * @Description: By xuranXYS
 */
function effect(fn, options = {}) {
    // 需要将fn变成响应式
    // 当数据变化时就重新执行
    const effect = createReactiveEffect(fn, options);
    if (!options.lazy) {
        effect(); // 默认会执行一次
    }
    return effect;
}
let uid = 0;
let activeEffect; // 存储当前的effect
const effectStack = []; // effect栈
function createReactiveEffect(fn, options) {
    const effect = function reactiveEffect() {
        // 判断当前的函数是否在栈中，在栈中则不入栈，防止死循环
        if (!effectStack.includes(effect)) {
            // 如果函数异常，finally也会正常出栈
            try {
                effectStack.push(effect); // 入栈
                activeEffect = effect;
                return fn(); // 取值时会执行get
            }
            finally {
                effectStack.pop(); // 出栈（抛弃）
                activeEffect = effectStack[effectStack.length - 1]; // 重定向当前effect
            }
        }
    };
    effect.id = uid++; // 制作标识，用于排序先后顺序，和区分effect
    effect._isEffect = true; // 用于标识这个是一个响应式effect
    effect.raw = fn; // 保留原函数
    effect.options = options; // 保存属性选项
    return effect;
}
let targetMap = new WeakMap();
function track(target, type, key) {
    if (activeEffect == void 0) {
        return; /* 此属性不用收集依赖，因为他没有在effect中使用 */
    }
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map));
    }
    let dep = depsMap.get(key);
    if (!dep) {
        depsMap.set(key, (dep = new Set));
    }
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect);
    }
}
// 找属性对应的effect 让其执行 （数组、对象）
function trigger(target, type, key, newValue, oldValue) {
    // 如果该属性没有收集过effect ，就不做任何处理
    let depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    const add = (effectsToAdd) => {
        if (effectsToAdd) {
            effectsToAdd.forEach(effect => {
                effects.add(effect);
            });
        }
    };
    // 我们将所有的effect 集中到一起执行
    const effects = new Set();
    // 看修改的是否是长度，因为修改长度，影响比较大，所以优先级比较高
    if (key === "length" && isArray(target)) {
        // 如果对应的长度有依赖收集，需要更新
        depsMap.forEach((dep, key) => {
            if (key === "length" || key > newValue) { // 如果更改的长度小于收集的索引（数组会重新排序，所以原长度必定会大于新值）
                add(dep);
            }
        });
    }
    else {
        // 可能是对象，触发就ok
        if (key !== undefined) { // 修改，且有effect
            add(depsMap.get(key));
        }
        // 特殊处理
        switch (type) {
            case 0 /* TriggerOrTypes.ADD */:
                if (isArray(target) && isIntegerKey(key)) { // 是数组，且增加了索引
                    add(depsMap.get("length")); // 触发长度更新
                }
                break;
        }
    }
    effects.forEach((ef) => ef());
}

/*
 * @Author: xuranXYS
 * @LastEditTime: 2024-03-04 21:50:00
 * @GitHub: www.github.com/xiaoxustudio
 * @WebSite: www.xiaoxustudio.top
 * @Description: By xuranXYS
 */
// 实现new Proxy(target , handler) 的 get 和 set
// 是不是仅读，仅读set报错
// 是不是深度
let readyonlyObj = {
    set: (target, key, val) => {
        console.warn(`(readonly) connot set attributes : '${key}' , because the object is readonly : \n`, target);
    }
};
function createGetter(isReadyonly = false, shallow = false) {
    return function get(target, key, receiver) {
        // Reflect 方法具有返回值
        const res = Reflect.get(target, key, receiver); // target[key]
        if (!isReadyonly) {
            // 收集依赖，等会数据变化时更新对应的视图
            track(target, 0 /* TrackTypes.GET */, key);
        }
        if (shallow)
            return res;
        // 取值时进行代理 -> vue3 的代理模式：懒代理
        if (isObject(res)) {
            return isReadyonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter(shallow = false) {
    return function set(target, key, value, receiver) {
        const oldValue = target[key]; // 获取旧值：有则是修改操作，没有则是新增操作
        // 是数组则另外判断
        let hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length :
            hasOwn(target, key); // 既是数组，且是数字索引
        // 如果是索引内，则是修改，不是则是新增
        const res = Reflect.set(target, key, value, receiver); // target[key] = value
        // 通知对应属性的effect 重新执行
        if (!hadKey) {
            // 新增
            trigger(target, 0 /* TriggerOrTypes.ADD */, key, value);
        }
        else if (hasChange(oldValue, value)) {
            // 修改
            trigger(target, 1 /* TriggerOrTypes.SET */, key, value); // 传个旧值区分
        }
        // 旧值和新值一样，不需要修改
        return res;
    };
}
const get = createGetter();
const shallowGet = createGetter(false, true);
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
const set = createSetter();
const shallowSet = createSetter(true);
const mutableHandlers = {
    get,
    set
};
const shallowReactiveHandlers = {
    get: shallowGet,
    set: shallowSet
};
const readonlyHandlers = extend({
    get: readonlyGet
}, readyonlyObj);
const shallowReadonlyHandlers = extend({
    get: shallowReadonlyGet,
}, readyonlyObj);

function reactive(target) {
    return CreateReactiveObject(target, false, mutableHandlers);
}
function shallowReactive(target) {
    return CreateReactiveObject(target, false, shallowReactiveHandlers);
}
function readonly(target) {
    return CreateReactiveObject(target, true, readonlyHandlers);
}
function shallowReadonly(target) {
    return CreateReactiveObject(target, true, shallowReadonlyHandlers);
}
const reactiveMap = new WeakMap();
const readyonlyMap = new WeakMap();
// 是不是只读，是不是深度，柯里化：拆解成接收单一参数的函数
// 底层还是proxy
function CreateReactiveObject(target, isReadyonly, baseHandlers) {
    // 这个只能拦截对象，无法拦截不是对象的值
    if (!isObject(target)) {
        return target;
    }
    const proxyMap = isReadyonly ? readyonlyMap : reactiveMap;
    // 如果某个对象已经被代理了就不用被代理了，一个对象被深度代理了，又被仅读代理了
    const existProxy = proxyMap.get(target);
    if (existProxy)
        return existProxy;
    const proxy = new Proxy(target, baseHandlers);
    proxyMap.set(target, proxy); // 将代理的对象存储缓存
    return proxy;
}

/*
 * @Author: xuranXYS
 * @LastEditTime: 2024-03-05 14:09:23
 * @GitHub: www.github.com/xiaoxustudio
 * @WebSite: www.xiaoxustudio.top
 * @Description: By xuranXYS
 */
function ref(value) {
    return createRef(value);
}
// ref和reactive 的区别 ： reactive内部采用proxy，ref中内部采用是defineProperty
function shallowRef(value) {
    return createRef(value, true);
}
const convert = (val) => isObject(val) ? reactive(val) : val;
// 看我们vue3的源码，都用了高阶函数，做了类似柯里化的处理
class RefImpl {
    rawValue;
    shallow;
    _value; // 声明了，没赋值
    __v_isRef = true; // 产生的实例会被添加 __v_isRef，表示是一个ref属性
    constructor(rawValue, shallow) {
        this.rawValue = rawValue;
        this.shallow = shallow;
        this._value = shallow ? rawValue : convert(rawValue); // 如果是浅，则直接放置，不是浅的则全部转换为响应式
    }
    get value() {
        track(this, 0 /* TrackTypes.GET */, "value");
        return this._value;
    }
    set value(val) {
        // 判断旧值和新值是否一致
        if (hasChange(this._value, val)) {
            this.rawValue = val;
            this._value = this.shallow ? val : convert(val);
            trigger(this, 1 /* TriggerOrTypes.SET */, "value", val);
        }
    }
}
// rawValue 可以是对象，但一般用reactive
function createRef(rawValue, shallow = false) {
    return new RefImpl(rawValue, shallow);
}
class ObjectRefImpl {
    target;
    key;
    __v_isRef = true; // 产生的实例会被添加 __v_isRef，表示是一个ref属性
    constructor(target, key) {
        this.target = target;
        this.key = key;
    }
    get value() {
        return this.target[this.key];
    }
    set value(val) {
        this.target[this.key] = val;
    }
}
// 解决解构reactive时没有是响应式
function toRef(target, key) {
    return new ObjectRefImpl(target, key);
}
function toRefs(object) {
    const ref = isArray(object) ? new Array(object.length) : {}; // object 可能是数组或对象
    for (let key in object) {
        ref[key] = toRef(object, key);
    }
    return ref;
}

exports.effect = effect;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.shallowReactive = shallowReactive;
exports.shallowReadonly = shallowReadonly;
exports.shallowRef = shallowRef;
exports.toRef = toRef;
exports.toRefs = toRefs;
//# sourceMappingURL=reactivity.cjs.js.map
