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

      functions.push({
        name: funcName,
        type: 'FunctionDeclaration',
        line,
        column,
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

      functions.push({
        name: funcName,
        type: 'ClassMethod',
        line,
        column,
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

      functions.push({
        name: funcName,
        type: 'ObjectMethod',
        line,
        column,
        context: objectInfo
      })
    }
  })

  // 处理函数表达式和箭头函数的通用方法
  function processFunctionExpression(path, type) {
    const funcName = getFunctionName(path)
    if (!funcName) return

    // 获取函数名的AST节点
    const nameNode = getFunctionNameNode(path)
    if (!nameNode) return

    const { line, column } = getFunctionNameEndLocation(nameNode)
    const context = getFunctionContext(path)

    functions.push({
      name: funcName,
      type,
      line,
      column,
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

    // 处理变量声明 (const fn = function() {})
    if (parent.type === 'VariableDeclarator') {
      return parent.id.name
    }

    // 处理对象字面量中的方法 ({ fn() {} })
    if (parent.type === 'Property' && parent.value === path.node) {
      return parent.key.name
    }

    // 其他情况（如对象属性赋值）不视为命名函数
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

    // 处理类中的方法/属性
    if (parent.type === 'ClassProperty' || parent.type === 'ClassMethod') {
      const className = getClassName(path)
      if (className) {
        return {
          type: 'Class',
          name: className
        }
      }
    }

    // 处理对象字面量中的方法
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

    // 向上查找直到找到变量声明或无法继续
    while (currentPath) {
      const node = currentPath.node

      // 处理对象赋值给变量的情况
      if (currentPath.isVariableDeclarator()) {
        return {
          type: 'Object',
          name: node.id.name
        }
      }

      // 处理嵌套对象字面量
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

  // 获取函数名结束位置
  function getFunctionNameEndLocation(pathOrNode) {
    if (pathOrNode && pathOrNode.node) {
      pathOrNode = pathOrNode.node
    }

    if (!pathOrNode || !pathOrNode.loc) {
      return { line: 0, column: 0 }
    }

    const { end } = pathOrNode.loc

    return {
      line: end.line - 1,
      column: end.column
    }
  }

  functions.sort((a, b) => a.line - b.line)
  return functions
}

module.exports = parser
