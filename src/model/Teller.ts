import {SupermarketCatalog} from "./SupermarketCatalog"
import {OffersByProduct, ShoppingCart} from "./ShoppingCart"
import {Product} from "./Product"
import {Receipt} from "./Receipt"
import {Offer} from "./Offer"
import {SpecialOfferType} from "./SpecialOfferType"
import {Bundle} from "./Bundle"
import {Coupon} from "./Coupon"

// store coupon with its application date
type AppliedCoupon = { coupon: Coupon, date: Date };

export class Teller {
    // added readonly
    private readonly offers: OffersByProduct = {};
    private readonly bundles: Bundle[] = [];
    private readonly coupons: AppliedCoupon[] = [];

    public constructor(private readonly catalog: SupermarketCatalog) {
    }

    public addSpecialOffer(offerType: SpecialOfferType, product: Product, argument: number): void {
        this.offers[product.name] = new Offer(offerType, product, argument);
    }

    // new method for bundle offers
    public addBundleOffer(products: Product[]): void {
        this.bundles.push(new Bundle(products));
    }

    // apply coupon with current date
    public applyCoupon(coupon: Coupon, currentDate: Date): void {
        this.coupons.push({ coupon, date: currentDate });
    }

    public checksOutArticlesFrom(theCart: ShoppingCart): Receipt {
        const receipt = new Receipt();
        const productQuantities = theCart.getItems();
        // renamed pq -> productQuantity, p -> product (bad names)
        // changed let to const
        for (const productQuantity of productQuantities) {
            const product = productQuantity.product;
            const quantity = productQuantity.quantity;
            const unitPrice = this.catalog.getUnitPrice(product);
            const totalPrice = quantity * unitPrice;
            receipt.addProduct(product, quantity, unitPrice, totalPrice);
        }
        theCart.handleOffers(receipt, this.offers, this.catalog);
        theCart.handleBundles(receipt, this.bundles, this.catalog);
        theCart.handleCoupons(receipt, this.coupons, this.catalog);

        return receipt;
    }
}
