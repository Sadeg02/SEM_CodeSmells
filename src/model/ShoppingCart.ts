import {Product} from "./Product"
import {ProductUnit} from "./ProductUnit"
import {SupermarketCatalog} from "./SupermarketCatalog"
import * as _ from "lodash"
import {ProductQuantity} from "./ProductQuantity"
import {Discount} from "./Discount"
import {Receipt} from "./Receipt"
import {Offer} from "./Offer"
import {SpecialOfferType} from "./SpecialOfferType"
import {Bundle} from "./Bundle"

type ProductQuantities = { [productName: string]: ProductQuantity }
export type OffersByProduct = {[productName: string]: Offer};

export class ShoppingCart {

    private readonly items: ProductQuantity[] = [];
    // made it private (was public with underscore)
    private readonly _productQuantities: ProductQuantities = {};

    getItems(): ProductQuantity[] {
        return _.clone(this.items);
    }

    addItem(product: Product): void {
        this.addItemQuantity(product, 1.0);
    }

    // now clones like getItems() (was inconsistent)
    productQuantities(): ProductQuantities {
        return _.clone(this._productQuantities);
    }

    public addItemQuantity(product: Product, quantity: number): void {
        // changed let to const
        const productQuantity = new ProductQuantity(product, quantity);
        this.items.push(productQuantity);

        const currentQuantity = this._productQuantities[product.name];
        if (currentQuantity) {
            this._productQuantities[product.name] = this.increaseQuantity(product, currentQuantity, quantity);
        } else {
            this._productQuantities[product.name] = productQuantity;
        }
    }

    // added return type
    private increaseQuantity(product: Product, productQuantity: ProductQuantity, quantity: number): ProductQuantity {
        return new ProductQuantity(product, productQuantity.quantity + quantity);
    }

    // split long method into smaller ones
    handleOffers(receipt: Receipt, offers: OffersByProduct, catalog: SupermarketCatalog): void {
        for (const productName in this.productQuantities()) {
            const productQuantity = this._productQuantities[productName];
            const product = productQuantity.product;
            const quantity = this._productQuantities[productName].quantity;

            if (offers[productName]) {
                const offer = offers[productName];
                const unitPrice = catalog.getUnitPrice(product);
                // deleted useless variables: quantityAsInt, x, numberOfXs
                const discount = this.calculateDiscount(offer, product, quantity, unitPrice);

                // changed != to !==
                if (discount !== null) {
                    receipt.addDiscount(discount);
                }
            }
        }
    }

    // new method - handles all offer types
    private calculateDiscount(offer: Offer, product: Product, quantity: number, unitPrice: number): Discount | null {
        // fixed missing else if (was just "if" after else if block)
        // changed == to ===
        if (offer.offerType === SpecialOfferType.ThreeForTwo) {
            return this.calculateThreeForTwo(product, quantity, unitPrice);
        } else if (offer.offerType === SpecialOfferType.TwoForAmount) {
            return this.calculateTwoForAmount(product, quantity, unitPrice, offer.argument);
        } else if (offer.offerType === SpecialOfferType.FiveForAmount) {
            return this.calculateFiveForAmount(product, quantity, unitPrice, offer.argument);
        } else if (offer.offerType === SpecialOfferType.TenPercentDiscount) {
            return this.calculatePercentDiscount(product, quantity, unitPrice, offer.argument);
        }
        return null;
    }

    // extracted 3 for 2 logic
    private calculateThreeForTwo(product: Product, quantity: number, unitPrice: number): Discount | null {
        // renamed magic number 3 to const
        const requiredQty = 3;
        if (quantity <= 2) {
            return null;
        }
        const numberOfSets = Math.floor(quantity / requiredQty);
        const remainder = quantity % requiredQty;
        const discountAmount = quantity * unitPrice - ((numberOfSets * 2 * unitPrice) + remainder * unitPrice);
        return new Discount(product, "3 for 2", discountAmount);
    }

    // extracted 2 for amount logic
    private calculateTwoForAmount(product: Product, quantity: number, unitPrice: number, specialPrice: number): Discount | null {
        const requiredQty = 2;
        if (quantity < requiredQty) {
            return null;
        }
        const numberOfPairs = Math.floor(quantity / requiredQty);
        const remainder = quantity % requiredQty;
        const total = specialPrice * numberOfPairs + remainder * unitPrice;
        const discountAmount = unitPrice * quantity - total;
        // used template literal instead of +
        return new Discount(product, `2 for ${specialPrice}`, discountAmount);
    }

    // extracted 5 for amount logic
    private calculateFiveForAmount(product: Product, quantity: number, unitPrice: number, specialPrice: number): Discount | null {
        const requiredQty = 5;
        if (quantity < requiredQty) {
            return null;
        }
        const numberOfSets = Math.floor(quantity / requiredQty);
        const remainder = quantity % requiredQty;
        const total = specialPrice * numberOfSets + remainder * unitPrice;
        const discountAmount = unitPrice * quantity - total;
        return new Discount(product, `${requiredQty} for ${specialPrice}`, discountAmount);
    }

    // extracted percent discount logic
    // renamed argument to percentOff (better name)
    private calculatePercentDiscount(product: Product, quantity: number, unitPrice: number, percentOff: number): Discount {
        const discountAmount = quantity * unitPrice * percentOff / 100.0;
        return new Discount(product, `${percentOff}% off`, discountAmount);
    }

    // handle bundle offers - 10% off when all items in bundle are bought
    handleBundles(receipt: Receipt, bundles: Bundle[], catalog: SupermarketCatalog): void {
        const quantities = this._productQuantities;

        for (const bundle of bundles) {
            const discount = this.calculateBundleDiscount(bundle, quantities, catalog);
            if (discount !== null) {
                receipt.addDiscount(discount);
            }
        }
    }

    // calculate discount for a bundle
    private calculateBundleDiscount(bundle: Bundle, quantities: ProductQuantities, catalog: SupermarketCatalog): Discount | null {
        // find how many complete bundles we can make
        const completeBundles = this.countCompleteBundles(bundle, quantities);

        if (completeBundles === 0) {
            return null;
        }

        // calculate bundle value based on actual cart quantities
        let bundleValue = 0;
        for (const product of bundle.products) {
            const unitPrice = catalog.getUnitPrice(product);
            const qty = quantities[product.name].quantity;
            // for kilo: use actual weight, for each: use 1 per bundle
            const qtyPerBundle = product.unit === ProductUnit.Kilo
                ? qty / completeBundles
                : 1;
            bundleValue += unitPrice * qtyPerBundle;
        }

        // 10% discount on complete bundles
        const discountPercent = 10;
        const discountAmount = completeBundles * bundleValue * discountPercent / 100.0;

        // use first product in bundle for discount (needed for Discount class)
        return new Discount(bundle.products[0], bundle.getDescription(), discountAmount);
    }

    // count how many complete bundles can be made from cart
    private countCompleteBundles(bundle: Bundle, quantities: ProductQuantities): number {
        let minBundles = Infinity;

        for (const product of bundle.products) {
            const productQty = quantities[product.name];
            if (!productQty || productQty.quantity <= 0) {
                return 0; // product not in cart
            }
            // for Kilo items: any qty > 0 counts as 1 bundle item
            // for Each items: use floor to count whole items
            const count = product.unit === ProductUnit.Kilo
                ? Math.floor(productQty.quantity + 0.999) // any qty > 0 = at least 1
                : Math.floor(productQty.quantity);
            minBundles = Math.min(minBundles, count);
        }

        return minBundles === Infinity ? 0 : minBundles;
    }
}
