import {Discount} from "./Discount"
import {Product} from "./Product"
import {ReceiptItem} from "./ReceiptItem"
import * as _ from "lodash"

export class Receipt {
    // added readonly
    private readonly items: ReceiptItem[] = [];
    private readonly discounts: Discount[] = [];

    // used reduce instead of for loop (cleaner)
    public getTotalPrice(): number {
        const itemsTotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
        const discountsTotal = this.discounts.reduce((sum, d) => sum + d.discountAmount, 0);
        return itemsTotal - discountsTotal;
    }

    public addProduct(p: Product, quantity: number, price: number, totalPrice: number): void {
        this.items.push(new ReceiptItem(p, quantity, price, totalPrice));
    }

    public getItems(): ReceiptItem[] {
        return _.clone(this.items);
    }

    public addDiscount(discount: Discount): void {
        this.discounts.push(discount);
    }

    // fixed: now clones like getItems (was inconsistent)
    public getDiscounts(): Discount[] {
        return _.clone(this.discounts);
    }
}
