/*
 * @Author: xuranXYS
 * @LastEditTime: 2024-03-04 17:21:37
 * @GitHub: www.github.com/xiaoxustudio
 * @WebSite: www.xiaoxustudio.top
 * @Description: By xuranXYS
 */
// 把packages目录下的模块全部打包


const fs = require("fs")
const targets = fs.readdirSync("packages").filter(f => { if (!fs.statSync(`packages/${f}`).isDirectory()) { return false } return true })
const execa = require("execa") // 开子进程打包，最终还是用rollup打包

async function build(target) {
    // --bundleConfigAsCjs 使用旧版打包
    await execa("rollup", ["-c", "--environment",  `TARGET:${target}` ,"--bundleConfigAsCjs"],{
        stdio : "inherit"}) // 子进程打包的信息共享父进程
}
async function runParallel(targets, iteratorFn) {
    const results = []
    for (const item of targets) {
        const p = iteratorFn(item) // 加了await 就是同步打包了，我希望他是并行打包
        results.push(p)
    }
    return Promise.all(results)
}
// 对目标模块进行并行打包
const time = Date.now()
runParallel(targets, build)