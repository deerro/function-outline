const { parse } = require('@babel/parser')
const traverse = require('@babel/traverse').default

function parser(sourceCode) {
  const functions = []

  const ast = parse(sourceCode, {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'typescript'],
    errorRecovery: true
  })

  traverse(ast, {
    // 普通函数声明
    FunctionDeclaration(path) {
      const funcName = path.node.id?.name
      if (!funcName) return // 跳过匿名函数

      const { line, column } = getFunctionNameEndLocation(path.node.id)
      const endLine = path.node.loc.end.line; // 移除-1，保持1-based

      functions.push({
        name: funcName,
        type: 'FunctionDeclaration',
        line,
        column,
        endLine,
        context: null
      })
    },

    // 函数表达式和箭头函数
    FunctionExpression(path) {
      processFunctionExpression(path, 'FunctionExpression')
    },

    ArrowFunctionExpression(path) {
      processFunctionExpression(path, 'ArrowFunctionExpression')
    },

    // 类方法
    ClassMethod(path) {
      const funcName = path.node.key.name
      if (!funcName) return

      const { line, column } = getFunctionNameEndLocation(path.node.key)
      const className = getClassName(path)
      const endLine = path.node.loc.end.line; // 移除-1，保持1-based

      functions.push({
        name: funcName,
        type: 'ClassMethod',
        line,
        column,
        endLine,
        context: {
          type: 'Class',
          name: className
        }
      })
    },

    // 对象方法
    ObjectMethod(path) {
      const funcName = path.node.key.name
      if (!funcName) return

      const { line, column } = getFunctionNameEndLocation(path.node.key)
      const objectInfo = getObjectInfo(path)
      const endLine = path.node.loc.end.line; // 移除-1，保持1-based

      functions.push({
        name: funcName,
        type: 'ObjectMethod',
        line,
        column,
        endLine,
        context: objectInfo
      })
    }
  })

  // 处理函数表达式和箭头函数的通用方法
  function processFunctionExpression(path, type) {
    const funcName = getFunctionName(path)
    if (!funcName) return

    const nameNode = getFunctionNameNode(path)
    if (!nameNode) return

    const { line, column } = getFunctionNameEndLocation(nameNode)
    const context = getFunctionContext(path)
    const endLine = path.node.loc.end.line; // 移除-1，保持1-based

    functions.push({
      name: funcName,
      type,
      line,
      column,
      endLine,
      context
    })
  }

  // 获取函数名节点
  function getFunctionNameNode(path) {
    const parent = path.parent

    if (parent.type === 'VariableDeclarator') {
      return parent.id
    }

    if (parent.type === 'Property' && parent.value === path.node) {
      return parent.key
    }

    return null
  }

  // 获取函数名（处理各种赋值情况）
  function getFunctionName(path) {
    const parent = path.parent

    if (parent.type === 'VariableDeclarator') {
      return parent.id.name
    }

    if (parent.type === 'Property' && parent.value === path.node) {
      return parent.key.name
    }

    return null
  }

  // 获取类名
  function getClassName(path) {
    const classNode = path.findParent(p => p.isClassDeclaration())
    return classNode?.node.id.name
  }

  // 获取函数上下文（类或对象）
  function getFunctionContext(path) {
    const parent = path.parent

    if (parent.type === 'ClassProperty' || parent.type === 'ClassMethod') {
      const className = getClassName(path)
      if (className) {
        return {
          type: 'Class',
          name: className
        }
      }
    }

    if (parent.type === 'Property' && parent.value === path.node) {
      const objectInfo = getObjectInfo(path)
      if (objectInfo && objectInfo.name) {
        return objectInfo
      }
    }

    return null
  }

  // 获取对象信息
  function getObjectInfo(path) {
    let currentPath = path.parentPath

    while (currentPath) {
      const node = currentPath.node

      if (currentPath.isVariableDeclarator()) {
        return {
          type: 'Object',
          name: node.id.name
        }
      }

      if (
        currentPath.isProperty() &&
        currentPath.parentPath.isObjectExpression()
      ) {
        const parentInfo = getObjectInfo(currentPath.parentPath)
        if (parentInfo && parentInfo.name) {
          return {
            type: 'Object',
            name: `${parentInfo.name}.${node.key.name}`
          }
        }
      }

      currentPath = currentPath.parentPath
    }

    return null
  }

  // 获取函数名结束位置（移除-1，保持1-based）
  function getFunctionNameEndLocation(pathOrNode) {
    if (pathOrNode && pathOrNode.node) {
      pathOrNode = pathOrNode.node
    }

    if (!pathOrNode || !pathOrNode.loc) {
      return { line: 0, column: 0 }
    }

    const { end } = pathOrNode.loc

    return {
      line: end.line, // 移除-1，保持1-based
      column: end.column
    }
  }

  functions.sort((a, b) => a.line - b.line)
  return functions
}

module.exports = parser