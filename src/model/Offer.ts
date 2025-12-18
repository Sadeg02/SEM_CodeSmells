import {Product} from "./Product"
import {SpecialOfferType} from "./SpecialOfferType"

export class Offer {
    // deleted getProduct() - product is already public readonly so getter is useless
    public constructor(public readonly offerType: SpecialOfferType,
                       public readonly product: Product,
                       public readonly argument: number) {
    }
}
