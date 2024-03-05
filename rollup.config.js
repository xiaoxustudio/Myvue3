/*
 * @Author: xuranXYS
 * @LastEditTime: 2024-03-04 17:03:48
 * @GitHub: www.github.com/xiaoxustudio
 * @WebSite: www.xiaoxustudio.top
 * @Description: By xuranXYS
 */

// rollup 配置
// 根据环境target ，获取相应的模块中的package.js
const path = require("path")
const json = require("@rollup/plugin-json")
const resolvePlugin = require("@rollup/plugin-node-resolve")
const ts = require("rollup-plugin-typescript2")


const packagesDir = path.resolve(__dirname, "packages") // 找到packages

const packageDir = path.resolve(packagesDir, process.env.TARGET) // 找到包的package.json
console.log(packagesDir)


// 永远针对某个模块
const resolve = (p) => path.resolve(packageDir, p)


const pkg = require(resolve("package.json"))

const pkgName = path.basename(packageDir) // 取文件名
// 对打包类型提供映射表，根据formats 来格式化打包的内容

const outputConfig = {
    "esm-bundler": {
        file: resolve(`dist/${pkgName}.esm-bundler.js`),
        format: "es"
    },
    "cjs": {
        file: resolve(`dist/${pkgName}.cjs.js`),
        format: "cjs"
    },
    "global": {
        file: resolve(`dist/${pkgName}.global.js`),
        format: "iife" // 立即执行函数
    }
}


const ops = pkg.buildOptions

function createConfig(format, output) {
    output.name = ops.name
    output.sourcemap = true // 生成source文件
    // 生成rollup配置文件
    return {
        input: resolve(`src/index.ts`),
        output,
        plugins: [
            json(),
            ts({
                tsconfig: path.resolve(__dirname, "tsconfig.json")
            }), // 解析ts
            resolvePlugin() // 解析第三方
        ]
    }
}

// 最终需要导出配置
export default ops.formats.map(format => createConfig(format, outputConfig[format]))