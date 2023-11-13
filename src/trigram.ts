export const trigrams = (val: string) => {
  const trigrams: string[] = []

  if (!val) return trigrams

  let index: number
  const source = val.slice() ? val : String(val)
  index = source.length - 3 + 1
  if (index < 1) {
    return trigrams
  }
  while (index--) {
    trigrams[index] = source.slice(index, index + 3)
  }
  return trigrams
}
