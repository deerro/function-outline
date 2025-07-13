// num:3
// rang:[[1,3],[5,8]]
function isInRange(num, range) {
  let flag = false
  for (const [first, end] of range) {
    if (num >= first && num < end) {
      flag = true
      break
    }
  }
  return flag
}

module.exports = isInRange
