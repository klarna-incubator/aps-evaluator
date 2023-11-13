import { format as formatDate } from 'date-fns'
import { isDate, isNumber, isString } from 'lodash'

const removeDiacritics = (str: string): string => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export const normalizeForMatch = <T = unknown>(value: T): T | string | number => {
  if (isDate(value)) {
    return formatDate(value, 'yyyy-MM-dd')
  }

  if (isString(value)) {
    const whitespaceRegex = /\s+/gm
    let cleanedString = value.replace(whitespaceRegex, ' ')
    cleanedString = cleanedString.trim()
    cleanedString = cleanedString.toLowerCase()
    cleanedString = removeDiacritics(cleanedString)
    return cleanedString
  }

  if (isNumber(value)) {
    const numberWithTwoDecimals = Math.round(value * 100) / 100
    return numberWithTwoDecimals
  }

  return value
}
