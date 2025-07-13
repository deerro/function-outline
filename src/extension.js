const vscode = require('vscode')
const TreeDataProvider = require('./treeDataProvider')
const getFunctions = require('./utils/getFunctions')

const handleClick = require('./commands/HandleClick')

function activate(context) {
  console.log('插件已激活')
  const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
  // 注册命令
  // const gotoCommand = useGotoCommand()

  // 获取函数数组
  const functions = getFunctions()

  // 创建视图
  //   const treeView = vscode.window.createTreeView('function-outline-tree', {
  //     treeDataProvider: new TreeDataProvider(functions)
  //   })
  const treeDataProvider = new TreeDataProvider(rootPath, functions)
  const treeView = vscode.window.registerTreeDataProvider(
    'function-outline-tree',
    treeDataProvider
  )

  const clickCmd = vscode.commands.registerCommand(
    'functionOutline.click',
    handleClick
  )

  // 监听活动编辑器变化（切换标签）
  const activeEditorChangeListener = vscode.window.onDidChangeActiveTextEditor(
    editor => {
      if (editor) {
        console.log('活动编辑器已切换，刷新大纲视图')
        const functions = getFunctions()
        treeDataProvider.refresh(functions)
      }
    }
  )

  // 监听新文档打开
  const documentOpenListener = vscode.workspace.onDidOpenTextDocument(
    document => {
      console.log('新文档已打开，刷新大纲视图')
      const functions = getFunctions()
      treeDataProvider.refresh(functions)
    }
  )

  // 新增：监听文件保存事件
  const documentSaveListener = vscode.workspace.onDidSaveTextDocument(
    document => {
      // 检查保存的文件是否为当前活动编辑器的文件
      const activeEditor = vscode.window.activeTextEditor
      if (
        activeEditor &&
        document.uri.toString() === activeEditor.document.uri.toString()
      ) {
        console.log('文件已保存，刷新大纲视图')
        const functions = getFunctions()
        treeDataProvider.refresh(functions)
      }
    }
  )

  // 将新的监听器添加到订阅中
  context.subscriptions.push(
    // gotoCommand,
    treeView,
    clickCmd,
    activeEditorChangeListener,
    documentOpenListener,
    documentSaveListener // 新增订阅
  )
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
}
