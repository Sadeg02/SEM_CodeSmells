import {Product} from "./Product"

// bundle of products - buy all items together, get 10% off
export class Bundle {
    constructor(public readonly products: Product[]) {
    }

    // get product names for discount description
    getDescription(): string {
        const names = this.products.map(p => p.name).join(" + ");
        return `bundle(${names})`;
    }
}
