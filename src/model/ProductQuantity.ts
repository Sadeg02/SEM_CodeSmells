import {Product} from "./Product"

export class ProductQuantity {
    // deleted redundant assignments (public readonly already assigns them)
    constructor(public readonly product: Product,
                public readonly quantity: number) {
    }
}
