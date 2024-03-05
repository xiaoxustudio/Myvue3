/*
 * @Author: xuranXYS
 * @LastEditTime: 2024-03-04 20:06:30
 * @GitHub: www.github.com/xiaoxustudio
 * @WebSite: www.xiaoxustudio.top
 * @Description: By xuranXYS
 */
// 针对具体的某个模块打包
const execa = require("execa") // 开子进程打包，最终还是用rollup打包

async function build(target) {
    // --bundleConfigAsCjs 使用旧版打包，w动态watcher
    await execa("rollup", ["-cw", "--environment", `TARGET:${target}`, "--bundleConfigAsCjs"], {
        stdio: "inherit"
    }) // 子进程打包的信息共享父进程
}

const target = "reactivity"
build(target)