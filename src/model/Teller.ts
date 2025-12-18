import {SupermarketCatalog} from "./SupermarketCatalog"
import {OffersByProduct, ShoppingCart} from "./ShoppingCart"
import {Product} from "./Product"
import {Receipt} from "./Receipt"
import {Offer} from "./Offer"
import {SpecialOfferType} from "./SpecialOfferType"
import {Bundle} from "./Bundle"
import {Coupon} from "./Coupon"
import {LoyaltyCard} from "./LoyaltyCard"

// store coupon with its application date (exported for ShoppingCart)
export type AppliedCoupon = { coupon: Coupon, date: Date };

export class Teller {
    // added readonly
    private readonly offers: OffersByProduct = {};
    private readonly bundles: Bundle[] = [];
    private readonly coupons: AppliedCoupon[] = [];
    private loyaltyCard: LoyaltyCard | null = null;
    private pointsToUse: number = 0;

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

    // set loyalty card for earning/spending points
    public setLoyaltyCard(card: LoyaltyCard): void {
        this.loyaltyCard = card;
    }

    // set points to use as payment
    public usePoints(points: number): void {
        this.pointsToUse = points;
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

        // handle loyalty points
        this.handleLoyalty(receipt);

        // reset points to use after checkout
        this.pointsToUse = 0;

        return receipt;
    }

    // handle loyalty card points
    private handleLoyalty(receipt: Receipt): void {
        if (!this.loyaltyCard) {
            return;
        }

        let totalPrice = receipt.getTotalPrice();

        // use points as payment (1 point = 1 euro)
        if (this.pointsToUse > 0) {
            // can't use more points than available or more than total
            const maxPointsToUse = Math.min(this.pointsToUse, this.loyaltyCard.getPoints(), totalPrice);
            const actualDeducted = this.loyaltyCard.deductPoints(maxPointsToUse);

            if (actualDeducted > 0) {
                receipt.applyPointsPayment(actualDeducted);
                totalPrice -= actualDeducted;
            }
        }

        // earn points for money spent (1 point per euro, rounded down)
        const pointsEarned = Math.floor(totalPrice);
        if (pointsEarned > 0) {
            this.loyaltyCard.addPoints(pointsEarned);
        }
    }
}
