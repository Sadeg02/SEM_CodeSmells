import {Product} from "./Product"

export class ReceiptItem {
    // added readonly to totalPrice (was missing, others had it)
    public constructor(public readonly product: Product,
                       public readonly quantity: number,
                       public readonly price: number,
                       public readonly totalPrice: number) {
    }
}
