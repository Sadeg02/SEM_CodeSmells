import {Product} from "./Product"

// coupon for limited time discount
// e.g., buy 6 orange juice, get 6 more at 50% off
export class Coupon {
    private _redeemed: boolean = false;

    constructor(
        public readonly product: Product,
        public readonly requiredQuantity: number,  // buy this many
        public readonly discountPercent: number,   // get same amount at X% off
        public readonly validFrom: Date,
        public readonly validTo: Date
    ) {
    }

    // check if coupon is valid on given date
    isValidOn(date: Date): boolean {
        return date >= this.validFrom && date <= this.validTo;
    }

    isRedeemed(): boolean {
        return this._redeemed;
    }

    redeem(): void {
        this._redeemed = true;
    }

    getDescription(): string {
        return `coupon(buy ${this.requiredQuantity} ${this.product.name}, get ${this.requiredQuantity} at ${this.discountPercent}% off)`;
    }
}
