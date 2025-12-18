import {SupermarketCatalog} from "./SupermarketCatalog"
import {OffersByProduct, ShoppingCart} from "./ShoppingCart"
import {Product} from "./Product"
import {Receipt} from "./Receipt"
import {Offer} from "./Offer"
import {SpecialOfferType} from "./SpecialOfferType"

export class Teller {
    // added readonly
    private readonly offers: OffersByProduct = {};

    public constructor(private readonly catalog: SupermarketCatalog) {
    }

    public addSpecialOffer(offerType: SpecialOfferType, product: Product, argument: number): void {
        this.offers[product.name] = new Offer(offerType, product, argument);
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

        return receipt;
    }
}
