const gotoLine = require('./gotoLine')
const foldFn = require('./foldFn')

// 用于记录每次点击的时间
let startTime = 0
// 获得两次点击的时间间隔
function getClickDelay() {
  const nowTime = new Date().getTime()
  const delay = nowTime - startTime
  startTime = nowTime
  return delay
}

// 用于记录当前点击项
let currData = null
// 处理点击的函数
function handleClick(options) {
  const { uri, position, data } = options
  const delay = getClickDelay()
  const { line, endLine } = data

  // 如果是双击，执行双击
  if (delay < 400 && currData === data) return foldFn([[line, endLine]])

  // 单击
  gotoLine(uri, position)

  // 赋值
  currData = data
}

module.exports = handleClick
