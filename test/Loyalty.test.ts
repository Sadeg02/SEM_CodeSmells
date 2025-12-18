import { FakeCatalog } from "./FakeCatalog";
import { Product } from "../src/model/Product";
import { ShoppingCart } from "../src/model/ShoppingCart";
import { Teller } from "../src/model/Teller";
import { ProductUnit } from "../src/model/ProductUnit";
import { LoyaltyCard } from "../src/model/LoyaltyCard";
import { assert } from "chai";

describe('Loyalty Program', () => {
    let catalog: FakeCatalog;
    let teller: Teller;
    let cart: ShoppingCart;
    let apple: Product;
    let bread: Product;

    beforeEach(() => {
        catalog = new FakeCatalog();
        teller = new Teller(catalog);
        cart = new ShoppingCart();

        apple = new Product("apple", ProductUnit.Kilo);
        bread = new Product("bread", ProductUnit.Each);

        catalog.addProduct(apple, 2.00);
        catalog.addProduct(bread, 1.00);
    });

    describe('Earning points', () => {
        it('should earn points based on money spent', () => {
            const loyaltyCard = new LoyaltyCard();

            cart.addItemQuantity(apple, 5); // 5 * 2.00 = 10.00
            teller.setLoyaltyCard(loyaltyCard);

            const receipt = teller.checksOutArticlesFrom(cart);

            // 1 point per euro spent
            assert.equal(loyaltyCard.getPoints(), 10);
            assert.approximately(receipt.getTotalPrice(), 10.00, 0.01);
        });

        it('should earn points with decimals rounded down', () => {
            const loyaltyCard = new LoyaltyCard();

            cart.addItemQuantity(apple, 2.5); // 2.5 * 2.00 = 5.00
            cart.addItem(bread); // 1.00
            teller.setLoyaltyCard(loyaltyCard);

            const receipt = teller.checksOutArticlesFrom(cart);

            // 6.00 spent = 6 points
            assert.equal(loyaltyCard.getPoints(), 6);
        });

        it('should accumulate points across multiple purchases', () => {
            const loyaltyCard = new LoyaltyCard();
            teller.setLoyaltyCard(loyaltyCard);

            // first purchase
            cart.addItemQuantity(apple, 5); // 10.00
            teller.checksOutArticlesFrom(cart);

            // second purchase - new cart
            const cart2 = new ShoppingCart();
            cart2.addItem(bread); // 1.00
            teller.checksOutArticlesFrom(cart2);

            assert.equal(loyaltyCard.getPoints(), 11);
        });

        it('should not earn points without loyalty card', () => {
            cart.addItemQuantity(apple, 5);
            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 10.00, 0.01);
            // no card, no points tracking
        });
    });

    describe('Spending points', () => {
        it('should use points as partial payment', () => {
            const loyaltyCard = new LoyaltyCard();
            loyaltyCard.addPoints(5); // 5 points = 5 euro credit

            cart.addItemQuantity(apple, 5); // 10.00
            teller.setLoyaltyCard(loyaltyCard);
            teller.usePoints(5);

            const receipt = teller.checksOutArticlesFrom(cart);

            // 10.00 - 5.00 points = 5.00
            assert.approximately(receipt.getTotalPrice(), 5.00, 0.01);
            assert.equal(loyaltyCard.getPoints(), 5); // earned 5 new points (from 5.00 paid)
        });

        it('should use points as full payment', () => {
            const loyaltyCard = new LoyaltyCard();
            loyaltyCard.addPoints(10);

            cart.addItemQuantity(apple, 5); // 10.00
            teller.setLoyaltyCard(loyaltyCard);
            teller.usePoints(10);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 0.00, 0.01);
            assert.equal(loyaltyCard.getPoints(), 0); // no new points (0 paid)
        });

        it('should not use more points than available', () => {
            const loyaltyCard = new LoyaltyCard();
            loyaltyCard.addPoints(3);

            cart.addItemQuantity(apple, 5); // 10.00
            teller.setLoyaltyCard(loyaltyCard);
            teller.usePoints(5); // try to use 5 but only have 3

            const receipt = teller.checksOutArticlesFrom(cart);

            // only 3 points used
            assert.approximately(receipt.getTotalPrice(), 7.00, 0.01);
            assert.equal(loyaltyCard.getPoints(), 7); // 0 left + 7 earned
        });

        it('should not use more points than purchase value', () => {
            const loyaltyCard = new LoyaltyCard();
            loyaltyCard.addPoints(20);

            cart.addItem(bread); // 1.00
            teller.setLoyaltyCard(loyaltyCard);
            teller.usePoints(20); // try to use 20 but only need 1

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 0.00, 0.01);
            assert.equal(loyaltyCard.getPoints(), 19); // 20 - 1 used = 19 left
        });

        it('should deduct points when used', () => {
            const loyaltyCard = new LoyaltyCard();
            loyaltyCard.addPoints(10);

            cart.addItemQuantity(apple, 2); // 4.00
            teller.setLoyaltyCard(loyaltyCard);
            teller.usePoints(4);

            teller.checksOutArticlesFrom(cart);

            // started with 10, used 4, earned 0 (paid 0) = 6
            assert.equal(loyaltyCard.getPoints(), 6);
        });
    });

    describe('Points with discounts', () => {
        it('should earn points after discounts applied', () => {
            const loyaltyCard = new LoyaltyCard();

            cart.addItemQuantity(apple, 10); // 20.00
            teller.setLoyaltyCard(loyaltyCard);
            teller.addSpecialOffer(
                require("../src/model/SpecialOfferType").SpecialOfferType.TenPercentDiscount,
                apple,
                10
            ); // 10% off

            const receipt = teller.checksOutArticlesFrom(cart);

            // 20.00 - 10% = 18.00
            assert.approximately(receipt.getTotalPrice(), 18.00, 0.01);
            assert.equal(loyaltyCard.getPoints(), 18);
        });

        it('should work with bundles', () => {
            const loyaltyCard = new LoyaltyCard();

            cart.addItem(apple);
            cart.addItem(bread);
            teller.setLoyaltyCard(loyaltyCard);
            teller.addBundleOffer([apple, bread]); // 10% off bundle

            const receipt = teller.checksOutArticlesFrom(cart);

            // 2.00 + 1.00 = 3.00, 10% off = 2.70
            assert.approximately(receipt.getTotalPrice(), 2.70, 0.01);
            assert.equal(loyaltyCard.getPoints(), 2); // floor(2.70)
        });
    });

    describe('LoyaltyCard class', () => {
        it('should start with zero points', () => {
            const card = new LoyaltyCard();
            assert.equal(card.getPoints(), 0);
        });

        it('should add points correctly', () => {
            const card = new LoyaltyCard();
            card.addPoints(10);
            card.addPoints(5);
            assert.equal(card.getPoints(), 15);
        });

        it('should deduct points correctly', () => {
            const card = new LoyaltyCard();
            card.addPoints(10);
            const deducted = card.deductPoints(3);
            assert.equal(deducted, 3);
            assert.equal(card.getPoints(), 7);
        });

        it('should not deduct more points than available', () => {
            const card = new LoyaltyCard();
            card.addPoints(5);
            const deducted = card.deductPoints(10);
            assert.equal(deducted, 5); // only deducted what was available
            assert.equal(card.getPoints(), 0);
        });

        it('should not allow negative points', () => {
            const card = new LoyaltyCard();
            card.addPoints(-5); // should be ignored
            assert.equal(card.getPoints(), 0);
        });
    });

    describe('Edge cases', () => {
        it('should handle empty cart with loyalty card', () => {
            const loyaltyCard = new LoyaltyCard();
            teller.setLoyaltyCard(loyaltyCard);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getTotalPrice(), 0);
            assert.equal(loyaltyCard.getPoints(), 0);
        });

        it('should handle zero points usage', () => {
            const loyaltyCard = new LoyaltyCard();
            loyaltyCard.addPoints(10);

            cart.addItem(bread);
            teller.setLoyaltyCard(loyaltyCard);
            teller.usePoints(0);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 1.00, 0.01);
            assert.equal(loyaltyCard.getPoints(), 11); // 10 + 1 earned
        });
    });
});
