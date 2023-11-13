import { isDate, format as formatDate } from 'date-fns'

import {
  ComparisonFn,
  MatchKey,
  compareCostsAddUp,
  compareDates,
  fullOrNoMatchComparison,
  compareStrings,
  ComparisonOptions,
  compareNumerics,
} from './comparators'
import { LEEWAY } from './constants'
import type { ComparisonInput, LineItem } from './types'

type FieldResult = {
  match: MatchKey | null
  comments?: string[] | null
}

type LineItemFieldResults = {
  lineItemName: FieldResult
  lineItemUnitPrice: FieldResult
  lineItemQuantity: FieldResult
  lineItemProductImageUrl: FieldResult
  lineItemColor: FieldResult
  lineItemSize: FieldResult
  lineItemProductId: FieldResult
  lineItemUrl: FieldResult
}

type CalculatedFieldResults = {
  costsAddUp: FieldResult
  lineItemCount: FieldResult
}

type BaseFieldResults = Omit<
  {
    [field in keyof ComparisonInput]: FieldResult
  },
  'lineItems'
>

export type ComparisonResult = BaseFieldResults & LineItemFieldResults & CalculatedFieldResults

type ApsScore = { APS: number }

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
  labeled: ComparisonInput,
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

const evaluateCostsAddUp = (parsed: ComparisonInput, labeled: ComparisonInput): FieldResult => {
  const costsAddUp = compareCostsAddUp(parsed, labeled)

  let comments
  if (costsAddUp === MatchKey.NO) {
    comments = ['Calculated cost does not match extracted order total']
  }
  return {
    match: costsAddUp,
    comments,
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

export const evaluateLineItemCount = (
  parsed: ComparisonInput['lineItems'],
  labeled: ComparisonInput['lineItems']
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
  labeled: ComparisonInput['lineItems']
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
      comparator: fullOrNoMatchComparison,
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
      comparator: fullOrNoMatchComparison,
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
        patchedLabeledFieldValues = parsedFieldValues.map((value) => value ?? defaultValue)
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

export const calculateAPS = (fieldResults: ComparisonResult): number => {
  type ApsFields = Array<keyof ComparisonResult>

  const APS_FIELDS: ApsFields = [
    'carriers',
    'costsAddUp',
    'currency',
    'lineItemCount',
    'lineItemName',
    'lineItemProductImageUrl',
    'lineItemUnitPrice',
    'merchantName',
    'orderDate',
    'orderNumbers',
    'status',
    'totalAmount',
    'trackingLinks',
    'trackingNumbers',
  ]

  const isFullOrPartialMatch = (match: MatchKey) =>
    [MatchKey.FULL, MatchKey.PARTIAL].includes(match)

  if (
    isFullOrPartialMatch(fieldResults.trackingNumbers.match as MatchKey) &&
    isFullOrPartialMatch(fieldResults.carriers.match as MatchKey)
  ) {
    // Remove trackingLinks from TRACKING_PARSER_APS_FIELDS as we have valid tracking information in other fields
    APS_FIELDS.splice(APS_FIELDS.indexOf('trackingLinks'), 1)
  }

  let apsScore = 1
  for (const field of APS_FIELDS) {
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
  labeled: ComparisonInput
}): ComparisonResult & ApsScore => {
  const fieldResults = {
    status: evaluateField('status', parsed, labeled, fullOrNoMatchComparison),
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
    costsAddUp: evaluateCostsAddUp(parsed, labeled),
    carriers: evaluateArray('carriers', parsed.carriers, labeled.carriers, compareStrings),
    trackingLinks: evaluateArray(
      'trackingLinks',
      parsed.trackingLinks,
      labeled.trackingLinks,
      fullOrNoMatchComparison
    ),
    trackingNumbers: evaluateArray(
      'trackingNumbers',
      parsed.trackingLinks,
      parsed.trackingNumbers,
      fullOrNoMatchComparison
    ),
    lineItemCount: evaluateLineItemCount(parsed.lineItems, labeled.lineItems),
    ...evaluateLineItemFields(parsed.lineItems, labeled.lineItems),
  }

  return {
    ...fieldResults,
    APS: calculateAPS(fieldResults),
  }
}
