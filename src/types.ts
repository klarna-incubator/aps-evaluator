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
