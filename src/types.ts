import { MatchKey } from './constants'

export type MultiPossibleValues = string[]

export type LineItem = {
  color: string | null
  imageUrl: string | null
  name: string | null
  productId: string | null
  quantity: number | null
  size: string | null
  unitPrice: number | null
  url: string | null
}

export type LineItemWithMultiPossibleValues = Omit<
  LineItem,
  'imageUrl' | 'name' | 'url' | 'productId'
> & {
  imageUrl: MultiPossibleValues | string | null
  name: MultiPossibleValues | string | null
  url: MultiPossibleValues | string | null
  productId: MultiPossibleValues | string | null
}

export type ComparisonInput = {
  carriers: string[] | null
  coupon: number | null
  currency: string | null
  discount: number | null
  giftCard: number | null
  lineItems: LineItem[] | null
  merchantDomain: string | null
  merchantName: string | null
  orderDate: Date | null
  orderNumbers: string[] | null
  shippingTotal: number | null
  status: string | null
  totalAmount: number | null
  totalTaxAmount: number | null
  trackingLinks: string[] | null
  trackingNumbers: string[] | null
}

export type ComparisonInputWithMultipleValues = Omit<
  ComparisonInput,
  'lineItems' | 'merchantName'
> & {
  lineItems: LineItemWithMultiPossibleValues[] | null
  merchantName: MultiPossibleValues | string | null
}

export type FieldResult = {
  match: MatchKey | null
  comments?: string[] | null
}

export type LineItemFieldResults = {
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

type ApsScore = { APS: number }

export type ComparisonResult = BaseFieldResults &
  LineItemFieldResults &
  CalculatedFieldResults &
  ApsScore
