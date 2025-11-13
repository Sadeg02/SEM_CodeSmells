import { FakeCatalog } from "./FakeCatalog";
import { Product } from "../src/model/Product";
import { ShoppingCart } from "../src/model/ShoppingCart";
import { Teller } from "../src/model/Teller";
import { SpecialOfferType } from "../src/model/SpecialOfferType";
import { ProductUnit } from "../src/model/ProductUnit";
import { Receipt } from "../src/model/Receipt";
import { assert } from "chai";

describe('Special Offers', () => {
    let catalog: FakeCatalog;
    let teller: Teller;
    let cart: ShoppingCart;

    beforeEach(() => {
        catalog = new FakeCatalog();
        teller = new Teller(catalog);
        cart = new ShoppingCart();
    });

    describe('Three For Two Offer', () => {
        let toothbrush: Product;

        beforeEach(() => {
            toothbrush = new Product("toothbrush", ProductUnit.Each);
            catalog.addProduct(toothbrush, 1.00);
            teller.addSpecialOffer(SpecialOfferType.ThreeForTwo, toothbrush, 0);
        });

        it('should not apply discount for 1 item', () => {
            cart.addItem(toothbrush);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getTotalPrice(), 1.00);
            assert.isEmpty(receipt.getDiscounts());
        });

        it('should not apply discount for 2 items', () => {
            cart.addItemQuantity(toothbrush, 2);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getTotalPrice(), 2.00);
            assert.isEmpty(receipt.getDiscounts());
        });

        it('should apply discount for exactly 3 items (pay for 2)', () => {
            cart.addItemQuantity(toothbrush, 3);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getTotalPrice(), 2.00, "Should pay for 2 items only");
            assert.equal(receipt.getDiscounts().length, 1);
            assert.equal(receipt.getDiscounts()[0].description, "3 for 2");
            assert.equal(receipt.getDiscounts()[0].discountAmount, 1.00);
        });

        it('should apply discount for 4 items (pay for 3)', () => {
            cart.addItemQuantity(toothbrush, 4);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getTotalPrice(), 3.00, "3 for 2 deal, plus 1 full price");
            assert.equal(receipt.getDiscounts().length, 1);
            assert.equal(receipt.getDiscounts()[0].discountAmount, 1.00);
        });

        it('should apply discount for 6 items (pay for 4)', () => {
            cart.addItemQuantity(toothbrush, 6);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getTotalPrice(), 4.00, "Two sets of 3 for 2");
            assert.equal(receipt.getDiscounts().length, 1);
            assert.equal(receipt.getDiscounts()[0].discountAmount, 2.00);
        });

        it('should handle 7 items (2 sets + 1 remainder)', () => {
            cart.addItemQuantity(toothbrush, 7);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getTotalPrice(), 5.00);
            assert.equal(receipt.getDiscounts()[0].discountAmount, 2.00);
        });
    });

    describe('Two For Amount Offer', () => {
        let cherries: Product;

        beforeEach(() => {
            cherries = new Product("cherry tomatoes", ProductUnit.Each);
            catalog.addProduct(cherries, 0.69);
            teller.addSpecialOffer(SpecialOfferType.TwoForAmount, cherries, 0.99);
        });

        it('should not apply discount for 1 item', () => {
            cart.addItem(cherries);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getTotalPrice(), 0.69);
            assert.isEmpty(receipt.getDiscounts());
        });

        it('should apply discount for 2 items', () => {
            cart.addItemQuantity(cherries, 2);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 0.99, 0.01);
            assert.equal(receipt.getDiscounts().length, 1);
            assert.equal(receipt.getDiscounts()[0].description, "2 for 0.99");
            assert.approximately(receipt.getDiscounts()[0].discountAmount, 0.39, 0.01);
        });

        it('should apply discount for 3 items (1 pair + 1 full price)', () => {
            cart.addItemQuantity(cherries, 3);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 1.68, 0.01, "0.99 for pair + 0.69 for single");
            assert.equal(receipt.getDiscounts().length, 1);
        });

        it('should apply discount for 4 items (2 pairs)', () => {
            cart.addItemQuantity(cherries, 4);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 1.98, 0.01, "Two pairs at 0.99 each");
            assert.equal(receipt.getDiscounts().length, 1);
            assert.approximately(receipt.getDiscounts()[0].discountAmount, 0.78, 0.01);
        });
    });

    describe('Five For Amount Offer', () => {
        let toothpaste: Product;

        beforeEach(() => {
            toothpaste = new Product("toothpaste", ProductUnit.Each);
            catalog.addProduct(toothpaste, 1.79);
            teller.addSpecialOffer(SpecialOfferType.FiveForAmount, toothpaste, 7.49);
        });

        it('should not apply discount for 4 items', () => {
            cart.addItemQuantity(toothpaste, 4);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 7.16, 0.01);
            assert.isEmpty(receipt.getDiscounts());
        });

        it('should apply discount for exactly 5 items', () => {
            cart.addItemQuantity(toothpaste, 5);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 7.49, 0.01);
            assert.equal(receipt.getDiscounts().length, 1);
            assert.equal(receipt.getDiscounts()[0].description, "5 for 7.49");
            assert.approximately(receipt.getDiscounts()[0].discountAmount, 1.46, 0.01);
        });

        it('should apply discount for 6 items (5 + 1 full price)', () => {
            cart.addItemQuantity(toothpaste, 6);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 9.28, 0.01, "7.49 for 5 + 1.79 for 1");
            assert.equal(receipt.getDiscounts().length, 1);
        });

        it('should apply discount for 10 items (2 sets of 5)', () => {
            cart.addItemQuantity(toothpaste, 10);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 14.98, 0.01, "Two sets at 7.49 each");
            assert.equal(receipt.getDiscounts().length, 1);
            assert.approximately(receipt.getDiscounts()[0].discountAmount, 2.92, 0.01);
        });
    });

    describe('Ten Percent Discount Offer', () => {
        let rice: Product;

        beforeEach(() => {
            rice = new Product("rice", ProductUnit.Each);
            catalog.addProduct(rice, 2.49);
            teller.addSpecialOffer(SpecialOfferType.TenPercentDiscount, rice, 10.0);
        });

        it('should apply 10% discount on single item', () => {
            cart.addItem(rice);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 2.241, 0.01, "2.49 - 10% = 2.241");
            assert.equal(receipt.getDiscounts().length, 1);
            assert.equal(receipt.getDiscounts()[0].description, "10% off");
            assert.approximately(receipt.getDiscounts()[0].discountAmount, 0.249, 0.01);
        });

        it('should apply 10% discount on multiple items', () => {
            cart.addItemQuantity(rice, 3);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 6.723, 0.01);
            assert.equal(receipt.getDiscounts().length, 1);
            assert.approximately(receipt.getDiscounts()[0].discountAmount, 0.747, 0.01);
        });

        it('should work with different percentage values', () => {
            const pasta = new Product("pasta", ProductUnit.Each);
            catalog.addProduct(pasta, 1.00);
            teller.addSpecialOffer(SpecialOfferType.TenPercentDiscount, pasta, 25.0);

            cart.addItemQuantity(pasta, 4);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 3.00, 0.01, "4.00 - 25% = 3.00");
            assert.equal(receipt.getDiscounts().length, 1);
            assert.equal(receipt.getDiscounts()[0].description, "25% off");
            assert.equal(receipt.getDiscounts()[0].discountAmount, 1.00);
        });
    });

    describe('Multiple offers on different products', () => {
        it('should apply different offers to different products correctly', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            const apples = new Product("apples", ProductUnit.Kilo);
            const rice = new Product("rice", ProductUnit.Each);

            catalog.addProduct(toothbrush, 1.00);
            catalog.addProduct(apples, 1.99);
            catalog.addProduct(rice, 2.49);

            teller.addSpecialOffer(SpecialOfferType.ThreeForTwo, toothbrush, 0);
            teller.addSpecialOffer(SpecialOfferType.TenPercentDiscount, rice, 10.0);

            cart.addItemQuantity(toothbrush, 3);
            cart.addItemQuantity(apples, 2);
            cart.addItemQuantity(rice, 1);

            const receipt = teller.checksOutArticlesFrom(cart);

            // toothbrush: 3 for 2 = 2.00
            // apples: 2 * 1.99 = 3.98 (no offer)
            // rice: 2.49 - 10% = 2.241
            assert.approximately(receipt.getTotalPrice(), 8.221, 0.01);
            assert.equal(receipt.getDiscounts().length, 2);
        });
    });

    describe('No offers scenario', () => {
        it('should calculate total without discounts when no offers exist', () => {
            const apple = new Product("apple", ProductUnit.Each);
            const banana = new Product("banana", ProductUnit.Each);

            catalog.addProduct(apple, 0.50);
            catalog.addProduct(banana, 0.30);

            cart.addItemQuantity(apple, 3);
            cart.addItemQuantity(banana, 2);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 2.10, 0.01);
            assert.isEmpty(receipt.getDiscounts());
        });

        it('should not apply offer to products without that offer', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            const apples = new Product("apples", ProductUnit.Kilo);

            catalog.addProduct(toothbrush, 0.99);
            catalog.addProduct(apples, 1.99);

            teller.addSpecialOffer(SpecialOfferType.TenPercentDiscount, toothbrush, 10.0);

            cart.addItemQuantity(apples, 2.5);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 4.975, 0.01);
            assert.isEmpty(receipt.getDiscounts(), "No discounts should apply to apples");
        });
    });
});
