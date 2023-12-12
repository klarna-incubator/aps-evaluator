import { isDate, format as formatDate } from 'date-fns'

import {
  ComparisonFn,
  compareDates,
  fullOrNoMatchComparison,
  compareStrings,
  ComparisonOptions,
  compareNumerics,
  compareOrderStatus,
} from './comparators'
import { APS_FIELDS, LEEWAY, MatchKey } from './constants'
import { calculateOrderTotal } from './orderTotalCalculator'
import {
  ComparisonInput,
  ComparisonResult,
  FieldResult,
  LineItem,
  LineItemFieldResults,
  LineItemWithMultiPossibleValues,
} from './types'

type ComparisonResultWithoutAPS = Omit<ComparisonResult, 'APS'>

export const createMismatchComment = (
  match: MatchKey,
  parsed: unknown,
  expected: unknown,
  prefix?: string
): string => {
  if (match === MatchKey.FULL) {
    return ''
  }

  const formatValue = (value: unknown) => {
    if (isDate(value)) {
      return formatDate(value as Date, 'yyyy-MM-dd')
    }
    return `${value}`
  }

  return `${prefix ?? ''} expected "${formatValue(expected)}" but got${
    match === MatchKey.PARTIAL ? ' partial match ' : ' '
  }"${formatValue(parsed)}"`.trim()
}

export const evaluateField = (
  field: keyof ComparisonInput,
  parsed: ComparisonInput,
  labeled: ComparisonInput<LineItemWithMultiPossibleValues>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comparator: ComparisonFn<any>,
  comparatorOptions?: ComparisonOptions
): FieldResult => {
  const parsedValue = parsed[field]
  const labeledValue = labeled[field]

  if (parsedValue === null && labeledValue === null) {
    return {
      match: null,
    }
  }

  const comments = []
  const match = comparator(parsedValue, labeledValue, comparatorOptions)
  if (match === MatchKey.NO || match === MatchKey.PARTIAL) {
    comments.push(createMismatchComment(match, parsedValue, labeledValue))
  }

  return {
    match,
    comments: comments.length ? comments : null,
  }
}

export const evaluateArray = <T = unknown>(
  fieldName: string,
  parsed: T[] | null,
  labeled: T[] | null,
  comparator: ComparisonFn<T>,
  comparatorOptions?: ComparisonOptions
): FieldResult => {
  if (!parsed && !labeled) {
    return { match: null }
  }

  const parsedLength = parsed?.length ?? 0
  const labeledLength = labeled?.length ?? 0

  if (parsedLength !== labeledLength) {
    return {
      match: MatchKey.NO,
      comments: [`expected ${labeledLength} results but got ${parsedLength}`],
    }
  }

  let resultingMatchKey = MatchKey.FULL
  const comments: string[] = []
  for (let i = 0; i < Math.max(parsedLength, labeledLength); i++) {
    const parsedValue = (parsed ?? [])[i]
    const labeledValue = (labeled ?? [])[i]
    const match = comparator(parsedValue, labeledValue, comparatorOptions)

    if (match === MatchKey.PARTIAL) {
      comments.push(createMismatchComment(match, parsedValue, labeledValue, `${fieldName}[${i}]`))
      if (resultingMatchKey === MatchKey.FULL) {
        resultingMatchKey = match
      }
    }

    if (match === MatchKey.NO) {
      comments.push(createMismatchComment(match, parsedValue, labeledValue, `${fieldName}[${i}]`))
      resultingMatchKey = match
    }
  }

  return {
    match: resultingMatchKey,
    comments: comments.length ? comments : null,
  }
}

export const evaluateCostsAddUp = (
  parsed: ComparisonInput,
  labeled: ComparisonInput<LineItemWithMultiPossibleValues>
): FieldResult => {
  const expectedTotal = labeled?.totalAmount
  if (!expectedTotal) return { match: null, comments: ['missing labeled total amount'] }

  const calculatedTotalParsed = calculateOrderTotal(parsed)
  const calculatedTotalLabeled = calculateOrderTotal(labeled as ComparisonInput)

  const comparisonOptions: ComparisonOptions = {
    allowPartialMatch: true,
    leeway: LEEWAY.costsAddUp,
  }

  // We also account for leniency when comparing computed total against the labeled total
  const computedCostsMatchExpectedTotal = compareNumerics(
    calculatedTotalLabeled,
    expectedTotal,
    comparisonOptions
  )

  // If the total amounts don't add up in the labeled data we shouldn't expect it to do so
  // in the parsed data either
  if (computedCostsMatchExpectedTotal === MatchKey.NO) {
    return {
      match: null,
      comments: ['labeled order total does not add up'],
    }
  }

  const match = compareNumerics(calculatedTotalParsed, expectedTotal, comparisonOptions)
  if (match === MatchKey.PARTIAL || match === MatchKey.NO) {
    return {
      match,
      comments: [createMismatchComment(match, calculatedTotalParsed, expectedTotal)],
    }
  }

  return { match }
}

export const evaluateLineItemCount = (
  parsed: ComparisonInput['lineItems'],
  labeled: ComparisonInput<LineItemWithMultiPossibleValues>['lineItems']
): FieldResult => {
  if (!parsed && !labeled) {
    return {
      match: null,
    }
  }

  const parsedLineItemCount = parsed?.length ?? 0
  const labeledLineItemCount = labeled?.length ?? 0
  if (parsedLineItemCount === labeledLineItemCount) {
    return {
      match: MatchKey.FULL,
    }
  }

  return {
    match: MatchKey.NO,
    comments: [`expected ${labeledLineItemCount} results but got ${parsedLineItemCount}`],
  }
}

export const evaluateLineItemFields = (
  parsed: ComparisonInput['lineItems'],
  labeled: ComparisonInput<LineItemWithMultiPossibleValues>['lineItems']
): LineItemFieldResults => {
  const result: LineItemFieldResults = {
    lineItemName: { match: null },
    lineItemColor: { match: null },
    lineItemProductId: { match: null },
    lineItemProductImageUrl: { match: null },
    lineItemQuantity: { match: null },
    lineItemSize: { match: null },
    lineItemUnitPrice: { match: null },
    lineItemUrl: { match: null },
  }

  if (!parsed && !labeled) {
    return result
  }

  type LineItemComparators = {
    [K in keyof LineItem]: {
      fieldName: keyof LineItemFieldResults
      comparator: ComparisonFn<NonNullable<LineItem[K]>>
      defaultValue?: NonNullable<LineItem[K]>
      comparatorOptions?: ComparisonOptions
    }
  }

  const lineItemComparators: LineItemComparators = {
    name: {
      fieldName: 'lineItemName',
      comparator: compareStrings,
      comparatorOptions: { allowPartialMatch: true },
    },
    color: {
      fieldName: 'lineItemColor',
      comparator: compareStrings,
      comparatorOptions: { allowPartialMatch: true },
    },
    productId: {
      fieldName: 'lineItemProductId',
      comparator: fullOrNoMatchComparison,
    },
    imageUrl: {
      fieldName: 'lineItemProductImageUrl',
      comparator: compareStrings,
      comparatorOptions: { allowPartialMatch: false },
    },
    quantity: {
      fieldName: 'lineItemQuantity',
      comparator: fullOrNoMatchComparison,
      defaultValue: 1,
    },
    size: {
      fieldName: 'lineItemSize',
      comparator: compareStrings,
      comparatorOptions: { allowPartialMatch: true },
    },
    unitPrice: {
      fieldName: 'lineItemUnitPrice',
      comparator: compareNumerics,
      comparatorOptions: { allowPartialMatch: true, leeway: LEEWAY.lineItemUnitPrice },
    },
    url: {
      fieldName: 'lineItemUrl',
      comparator: compareStrings,
      comparatorOptions: { allowPartialMatch: false },
    },
  }

  const hasNonNullValues = <T = unknown>(array: (T | null)[]): boolean =>
    array.filter((value) => value !== null).length > 0

  for (const [field, { comparator, fieldName, defaultValue, comparatorOptions }] of Object.entries(
    lineItemComparators
  )) {
    const parsedFieldValues = parsed?.map((value) => value[field as keyof LineItem]) ?? []
    const labeledFieldValues = labeled?.map((value) => value[field as keyof LineItem]) ?? []

    if (hasNonNullValues(parsedFieldValues) || hasNonNullValues(labeledFieldValues)) {
      let patchedParsedFieldValues
      if (defaultValue !== undefined) {
        patchedParsedFieldValues = parsedFieldValues.map((value) => value ?? defaultValue)
      }

      let patchedLabeledFieldValues
      if (defaultValue !== undefined) {
        patchedLabeledFieldValues = labeledFieldValues.map((value) => value ?? defaultValue)
      }

      result[fieldName] = evaluateArray(
        fieldName,
        patchedParsedFieldValues ?? parsedFieldValues,
        patchedLabeledFieldValues ?? labeledFieldValues,
        comparator as ComparisonFn,
        comparatorOptions
      )
    }
  }

  return result
}

export const calculateAPS = (fieldResults: ComparisonResultWithoutAPS): number => {
  const fieldsToCompare = [...APS_FIELDS]

  const isFullOrPartialMatch = (match: MatchKey) =>
    [MatchKey.FULL, MatchKey.PARTIAL].includes(match)

  if (
    isFullOrPartialMatch(fieldResults.trackingNumbers.match as MatchKey) &&
    isFullOrPartialMatch(fieldResults.carriers.match as MatchKey)
  ) {
    // Remove trackingLinks from TRACKING_PARSER_APS_FIELDS as we have valid tracking information in other fields
    fieldsToCompare.splice(fieldsToCompare.indexOf('trackingLinks'), 1)
  }

  let apsScore = 1
  for (const field of fieldsToCompare) {
    const { match } = fieldResults[field]
    if (match === MatchKey.NO) {
      apsScore = 0
    }
  }

  return apsScore
}

export const compareWithLabeled = ({
  parsed,
  labeled,
}: {
  parsed: ComparisonInput
  labeled: ComparisonInput<LineItemWithMultiPossibleValues>
}): ComparisonResult => {
  const fieldResults: ComparisonResultWithoutAPS = {
    status: evaluateField('status', parsed, labeled, compareOrderStatus),
    currency: evaluateField('currency', parsed, labeled, fullOrNoMatchComparison),
    orderDate: evaluateField('orderDate', parsed, labeled, compareDates, {
      allowPartialMatch: true,
    }),
    orderNumbers: evaluateArray(
      'orderNumbers',
      parsed.orderNumbers,
      labeled.orderNumbers,
      fullOrNoMatchComparison
    ),
    coupon: evaluateField('coupon', parsed, labeled, compareNumerics, {
      allowPartialMatch: true,
      leeway: LEEWAY.coupon,
    }),
    discount: evaluateField('discount', parsed, labeled, compareNumerics, {
      allowPartialMatch: true,
      leeway: LEEWAY.discount,
    }),
    giftCard: evaluateField('giftCard', parsed, labeled, compareNumerics, {
      allowPartialMatch: true,
      leeway: LEEWAY.giftCard,
    }),
    shippingTotal: evaluateField('shippingTotal', parsed, labeled, compareNumerics, {
      allowPartialMatch: true,
      leeway: LEEWAY.shippingTotal,
    }),
    totalAmount: evaluateField('totalAmount', parsed, labeled, compareNumerics, {
      allowPartialMatch: true,
      leeway: LEEWAY.totalAmount,
    }),
    totalTaxAmount: evaluateField('totalTaxAmount', parsed, labeled, compareNumerics, {
      allowPartialMatch: true,
      leeway: LEEWAY.totalTaxAmount,
    }),
    merchantName: evaluateField('merchantName', parsed, labeled, compareStrings, {
      allowPartialMatch: true,
    }),
    merchantDomain: evaluateField('merchantDomain', parsed, labeled, compareStrings, {
      allowPartialMatch: true,
    }),
    carriers: evaluateArray('carriers', parsed.carriers, labeled.carriers, compareStrings),
    trackingLinks: evaluateArray(
      'trackingLinks',
      parsed.trackingLinks,
      labeled.trackingLinks,
      compareStrings
    ),
    trackingNumbers: evaluateArray(
      'trackingNumbers',
      parsed.trackingNumbers,
      labeled.trackingNumbers,
      compareStrings
    ),
    costsAddUp: evaluateCostsAddUp(parsed, labeled),
    lineItemCount: evaluateLineItemCount(parsed.lineItems, labeled.lineItems),
    ...evaluateLineItemFields(parsed.lineItems, labeled.lineItems),
  }

  return {
    ...fieldResults,
    APS: calculateAPS(fieldResults),
  }
}
