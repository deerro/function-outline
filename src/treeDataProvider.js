const vscode = require('vscode')

class OutlineNode extends vscode.TreeItem {
  constructor({ label, type, collapsibleState, command } = {}) {
    super(label, collapsibleState)
    this.type = type
    // 设置跳转命令
    this.command = command
    this.iconPath = this.getIcon()
  }

  getIcon() {
    switch (this.type) {
      case 'root':
        return new vscode.ThemeIcon('symbol-namespace')
      case 'function':
        return new vscode.ThemeIcon('symbol-function')
      case 'class':
        return new vscode.ThemeIcon('symbol-class')
      case 'variable':
        return new vscode.ThemeIcon('symbol-variable')
      default:
        return new vscode.ThemeIcon('symbol-key')
    }
  }
}

class TreeDataProvider {
  constructor(rootPath, functions) {
    this.rootPath = rootPath
    this._onDidChangeTreeData = new vscode.EventEmitter()
    this.onDidChangeTreeData = this._onDidChangeTreeData.event
    this.functions = functions
  }
  // 直接返回 element，因为它已经是 TreeItem 类型
  getTreeItem(element) {
    return element
  }

  // 返回多个根节点及其子节点
  getChildren(element) {
    // 根节点情况：返回多个顶级分类
    if (element) return

    const list = []
    for (const item of this.functions) {
      const command = {
        command: 'functionOutline.click',
        title: 'Go to Line',
        arguments: [
          {
            data: item,
            uri: vscode.window.activeTextEditor.document.uri,
            position: new vscode.Position(item.line - 1, item.column)
          }
        ]
      }
      const options = {
        label: item.name,
        type: 'function',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        command
      }
      const node = new OutlineNode(options)
      list.push(node)
    }
    return Promise.resolve(list)
  }

  refresh(functions) {
    if (functions) {
      this.functions = functions // 更新函数列表
    }
    this._onDidChangeTreeData.fire()
  }
}

module.exports = TreeDataProvider
