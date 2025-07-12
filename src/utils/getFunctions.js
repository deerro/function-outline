const vscode = require('vscode')
const parser = require('./parser')

function getFunctions() {
  // 1. 获取当前活动编辑器的内容
  const editor = vscode.window.activeTextEditor
  if (!editor) return []
  const code = editor.document.getText()
  return parser(code)
}

module.exports = getFunctions
