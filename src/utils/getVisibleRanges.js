const vscode = require('vscode')

function gitVisbleRanges() {
  const visibleRanges = vscode.window.activeTextEditor?.visibleRanges
  const range = visibleRanges.map(item => {
    console.log(item.c.c, item.e.c)
    return [item.c.c, item.e.c]
  })
  return range
}

module.exports = gitVisbleRanges
