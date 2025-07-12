const vscode = require('vscode')

/**
 * 注册一个跳转到指定位置的命令
 * @returns 已注册的命令的 disposable 对象
 */
function getGotoCommand() {
  return vscode.commands.registerCommand(
    'functionOutline.gotoLine',
    (uri, position) => {
      if (!uri || !position) {
        console.error('缺少必要的参数: uri 或 position')
        return
      }

      console.log('跳转到位置:', uri.path, position.line + 1)

      vscode.workspace.openTextDocument(uri).then(doc => {
        vscode.window.showTextDocument(doc).then(editor => {
          // 设置光标位置
          const selection = new vscode.Selection(position, position)
          editor.selection = selection

          // 滚动视图到指定位置
          const range = new vscode.Range(position, position)
          editor.revealRange(range, vscode.TextEditorRevealType.InCenter)
        })
      })
    }
  )
}

module.exports = getGotoCommand
