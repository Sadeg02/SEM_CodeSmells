import { FakeCatalog } from "./FakeCatalog";
import { Product } from "../src/model/Product";
import { ShoppingCart } from "../src/model/ShoppingCart";
import { Teller } from "../src/model/Teller";
import { ProductUnit } from "../src/model/ProductUnit";
import { assert } from "chai";

describe('Bundle Offers', () => {
    let catalog: FakeCatalog;
    let teller: Teller;
    let cart: ShoppingCart;
    let toothbrush: Product;
    let toothpaste: Product;

    beforeEach(() => {
        catalog = new FakeCatalog();
        teller = new Teller(catalog);
        cart = new ShoppingCart();

        toothbrush = new Product("toothbrush", ProductUnit.Each);
        toothpaste = new Product("toothpaste", ProductUnit.Each);

        catalog.addProduct(toothbrush, 0.99);
        catalog.addProduct(toothpaste, 1.79);
    });

    describe('Basic bundle discount', () => {
        it('should apply 10% discount when buying complete bundle', () => {
            // bundle: toothbrush + toothpaste
            teller.addBundleOffer([toothbrush, toothpaste]);

            cart.addItem(toothbrush);
            cart.addItem(toothpaste);

            const receipt = teller.checksOutArticlesFrom(cart);

            // total without discount: 0.99 + 1.79 = 2.78
            // discount: 10% of 2.78 = 0.278
            // final: 2.78 - 0.278 = 2.502
            assert.approximately(receipt.getTotalPrice(), 2.502, 0.01);
            assert.equal(receipt.getDiscounts().length, 1);
            assert.include(receipt.getDiscounts()[0].description, "bundle");
        });

        it('should not apply discount when bundle is incomplete - missing one item', () => {
            teller.addBundleOffer([toothbrush, toothpaste]);

            cart.addItem(toothbrush);
            // no toothpaste

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getTotalPrice(), 0.99);
            assert.isEmpty(receipt.getDiscounts());
        });

        it('should not apply discount when bundle is incomplete - missing other item', () => {
            teller.addBundleOffer([toothbrush, toothpaste]);

            cart.addItem(toothpaste);
            // no toothbrush

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getTotalPrice(), 1.79);
            assert.isEmpty(receipt.getDiscounts());
        });
    });

    describe('Multiple bundles', () => {
        it('should apply discount for each complete bundle', () => {
            teller.addBundleOffer([toothbrush, toothpaste]);

            // 2 of each = 2 complete bundles
            cart.addItemQuantity(toothbrush, 2);
            cart.addItemQuantity(toothpaste, 2);

            const receipt = teller.checksOutArticlesFrom(cart);

            // total without discount: (0.99 + 1.79) * 2 = 5.56
            // discount: 10% of 5.56 = 0.556
            // final: 5.56 - 0.556 = 5.004
            assert.approximately(receipt.getTotalPrice(), 5.004, 0.01);
            assert.equal(receipt.getDiscounts().length, 1);
        });

        it('should only discount complete bundles - extra items not discounted', () => {
            teller.addBundleOffer([toothbrush, toothpaste]);

            // 2 toothbrush + 1 toothpaste = only 1 complete bundle
            cart.addItemQuantity(toothbrush, 2);
            cart.addItem(toothpaste);

            const receipt = teller.checksOutArticlesFrom(cart);

            // 1 complete bundle: 0.99 + 1.79 = 2.78, 10% off = 2.502
            // 1 extra toothbrush: 0.99 (no discount)
            // total: 2.502 + 0.99 = 3.492
            assert.approximately(receipt.getTotalPrice(), 3.492, 0.01);
            assert.equal(receipt.getDiscounts().length, 1);
        });

        it('should handle 3 items with only 1 complete bundle', () => {
            teller.addBundleOffer([toothbrush, toothpaste]);

            // 1 toothbrush + 3 toothpaste = only 1 complete bundle
            cart.addItem(toothbrush);
            cart.addItemQuantity(toothpaste, 3);

            const receipt = teller.checksOutArticlesFrom(cart);

            // 1 bundle: 0.99 + 1.79 = 2.78, 10% off = 2.502
            // 2 extra toothpaste: 1.79 * 2 = 3.58
            // total: 2.502 + 3.58 = 6.082
            assert.approximately(receipt.getTotalPrice(), 6.082, 0.01);
        });
    });

    describe('Bundle with 3+ items', () => {
        it('should work with bundle of 3 products', () => {
            const mouthwash = new Product("mouthwash", ProductUnit.Each);
            catalog.addProduct(mouthwash, 2.50);

            teller.addBundleOffer([toothbrush, toothpaste, mouthwash]);

            cart.addItem(toothbrush);
            cart.addItem(toothpaste);
            cart.addItem(mouthwash);

            const receipt = teller.checksOutArticlesFrom(cart);

            // total: 0.99 + 1.79 + 2.50 = 5.28
            // discount: 10% = 0.528
            // final: 4.752
            assert.approximately(receipt.getTotalPrice(), 4.752, 0.01);
            assert.equal(receipt.getDiscounts().length, 1);
        });
    });

    describe('Multiple different bundles', () => {
        it('should handle multiple different bundle offers', () => {
            const soap = new Product("soap", ProductUnit.Each);
            const shampoo = new Product("shampoo", ProductUnit.Each);
            catalog.addProduct(soap, 1.00);
            catalog.addProduct(shampoo, 3.00);

            // dental bundle
            teller.addBundleOffer([toothbrush, toothpaste]);
            // bath bundle
            teller.addBundleOffer([soap, shampoo]);

            cart.addItem(toothbrush);
            cart.addItem(toothpaste);
            cart.addItem(soap);
            cart.addItem(shampoo);

            const receipt = teller.checksOutArticlesFrom(cart);

            // dental: 0.99 + 1.79 = 2.78, 10% off = 2.502
            // bath: 1.00 + 3.00 = 4.00, 10% off = 3.60
            // total: 2.502 + 3.60 = 6.102
            assert.approximately(receipt.getTotalPrice(), 6.102, 0.01);
            assert.equal(receipt.getDiscounts().length, 2);
        });
    });

    describe('Bundle with other offers', () => {
        it('should work alongside regular special offers', () => {
            const rice = new Product("rice", ProductUnit.Each);
            catalog.addProduct(rice, 2.00);

            teller.addBundleOffer([toothbrush, toothpaste]);
            teller.addSpecialOffer(require("../src/model/SpecialOfferType").SpecialOfferType.TenPercentDiscount, rice, 20);

            cart.addItem(toothbrush);
            cart.addItem(toothpaste);
            cart.addItem(rice);

            const receipt = teller.checksOutArticlesFrom(cart);

            // bundle: 2.78 - 10% = 2.502
            // rice: 2.00 - 20% = 1.60
            // total: 4.102
            assert.approximately(receipt.getTotalPrice(), 4.102, 0.01);
            assert.equal(receipt.getDiscounts().length, 2);
        });
    });

    describe('Edge cases', () => {
        it('should handle empty cart with bundle offer', () => {
            teller.addBundleOffer([toothbrush, toothpaste]);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getTotalPrice(), 0);
            assert.isEmpty(receipt.getDiscounts());
        });

        it('should handle bundle with items sold by weight', () => {
            const cheese = new Product("cheese", ProductUnit.Kilo);
            const crackers = new Product("crackers", ProductUnit.Each);
            catalog.addProduct(cheese, 10.00); // per kilo
            catalog.addProduct(crackers, 2.00);

            teller.addBundleOffer([cheese, crackers]);

            cart.addItemQuantity(cheese, 0.5); // 0.5 kg
            cart.addItem(crackers);

            const receipt = teller.checksOutArticlesFrom(cart);

            // cheese: 0.5 * 10 = 5.00
            // crackers: 2.00
            // total: 7.00, 10% off = 6.30
            assert.approximately(receipt.getTotalPrice(), 6.30, 0.01);
        });
    });
});
