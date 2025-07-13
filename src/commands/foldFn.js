const vscode = require('vscode')
const isInRange = require('../utils/isInRange')
const getVisibleRanges = require('../utils/getVisibleRanges')

async function foldFn(lines) {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    vscode.window.showInformationMessage('没有活动的编辑器')
    return
  }

  try {
    for (const [startLine, endLine] of lines) {
      // 转换为0-based行号
      const start = startLine - 1
      const end = endLine - 1
      console.log('开始行:', start)
      console.log('结束行是：', end)
      if (start === end) return
      const range = await getVisibleRanges()

      console.log(isInRange(start, range))

      console.log('---------------------------------------------------')

      const isUnfold = isInRange(start, range)

      if (isUnfold) {
        await vscode.commands.executeCommand('editor.fold', {
          direction: 'down',
          selectionLines: [start, start]
        })
        continue
      }

      // 展开指定范围（0-based行号）
      await vscode.commands.executeCommand('editor.unfold', {
        direction: 'down',
        selectionLines: [start, start]
      })
    }
  } catch (error) {
    vscode.window.showErrorMessage(`操作失败: ${error.message}`)
  }
}

module.exports = foldFn
