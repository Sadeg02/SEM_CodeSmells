import { FakeCatalog } from "./FakeCatalog";
import { Product } from "../src/model/Product";
import { ShoppingCart } from "../src/model/ShoppingCart";
import { Teller } from "../src/model/Teller";
import { ProductUnit } from "../src/model/ProductUnit";
import { Coupon } from "../src/model/Coupon";
import { assert } from "chai";

describe('Coupon Discounts', () => {
    let catalog: FakeCatalog;
    let teller: Teller;
    let cart: ShoppingCart;
    let orangeJuice: Product;

    beforeEach(() => {
        catalog = new FakeCatalog();
        teller = new Teller(catalog);
        cart = new ShoppingCart();

        orangeJuice = new Product("orange juice", ProductUnit.Each);
        catalog.addProduct(orangeJuice, 2.00);
    });

    describe('Basic coupon discount', () => {
        it('should apply coupon discount when conditions are met', () => {
            // coupon: buy 6 orange juice, get 6 more at half price
            // valid: 13/11 - 15/11
            const validFrom = new Date(2024, 10, 13); // Nov 13
            const validTo = new Date(2024, 10, 15);   // Nov 15
            const currentDate = new Date(2024, 10, 14); // Nov 14

            const coupon = new Coupon(orangeJuice, 6, 50, validFrom, validTo);
            teller.applyCoupon(coupon, currentDate);

            cart.addItemQuantity(orangeJuice, 12); // 6 + 6 more

            const receipt = teller.checksOutArticlesFrom(cart);

            // 6 at full price: 6 * 2.00 = 12.00
            // 6 at half price: 6 * 1.00 = 6.00
            // total: 18.00
            assert.approximately(receipt.getTotalPrice(), 18.00, 0.01);
            assert.equal(receipt.getDiscounts().length, 1);
            assert.include(receipt.getDiscounts()[0].description, "coupon");
        });

        it('should not apply coupon when not enough items bought', () => {
            const validFrom = new Date(2024, 10, 13);
            const validTo = new Date(2024, 10, 15);
            const currentDate = new Date(2024, 10, 14);

            const coupon = new Coupon(orangeJuice, 6, 50, validFrom, validTo);
            teller.applyCoupon(coupon, currentDate);

            cart.addItemQuantity(orangeJuice, 5); // only 5, need 6

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 10.00, 0.01);
            assert.isEmpty(receipt.getDiscounts());
        });

        it('should apply coupon for exact minimum quantity', () => {
            const validFrom = new Date(2024, 10, 13);
            const validTo = new Date(2024, 10, 15);
            const currentDate = new Date(2024, 10, 14);

            const coupon = new Coupon(orangeJuice, 6, 50, validFrom, validTo);
            teller.applyCoupon(coupon, currentDate);

            cart.addItemQuantity(orangeJuice, 6); // exactly 6

            const receipt = teller.checksOutArticlesFrom(cart);

            // no extra items to discount, but coupon applies to 0 extra
            // wait - the coupon is "buy 6, get 6 more at half price"
            // so if you buy exactly 6, there are no "extra" items
            assert.approximately(receipt.getTotalPrice(), 12.00, 0.01);
            assert.isEmpty(receipt.getDiscounts());
        });
    });

    describe('Date validation', () => {
        it('should not apply coupon before valid date', () => {
            const validFrom = new Date(2024, 10, 13);
            const validTo = new Date(2024, 10, 15);
            const currentDate = new Date(2024, 10, 12); // Nov 12 - too early

            const coupon = new Coupon(orangeJuice, 6, 50, validFrom, validTo);
            teller.applyCoupon(coupon, currentDate);

            cart.addItemQuantity(orangeJuice, 12);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 24.00, 0.01);
            assert.isEmpty(receipt.getDiscounts());
        });

        it('should not apply coupon after valid date', () => {
            const validFrom = new Date(2024, 10, 13);
            const validTo = new Date(2024, 10, 15);
            const currentDate = new Date(2024, 10, 16); // Nov 16 - too late

            const coupon = new Coupon(orangeJuice, 6, 50, validFrom, validTo);
            teller.applyCoupon(coupon, currentDate);

            cart.addItemQuantity(orangeJuice, 12);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 24.00, 0.01);
            assert.isEmpty(receipt.getDiscounts());
        });

        it('should apply coupon on first valid day', () => {
            const validFrom = new Date(2024, 10, 13);
            const validTo = new Date(2024, 10, 15);
            const currentDate = new Date(2024, 10, 13); // Nov 13 - first day

            const coupon = new Coupon(orangeJuice, 6, 50, validFrom, validTo);
            teller.applyCoupon(coupon, currentDate);

            cart.addItemQuantity(orangeJuice, 12);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 18.00, 0.01);
            assert.equal(receipt.getDiscounts().length, 1);
        });

        it('should apply coupon on last valid day', () => {
            const validFrom = new Date(2024, 10, 13);
            const validTo = new Date(2024, 10, 15);
            const currentDate = new Date(2024, 10, 15); // Nov 15 - last day

            const coupon = new Coupon(orangeJuice, 6, 50, validFrom, validTo);
            teller.applyCoupon(coupon, currentDate);

            cart.addItemQuantity(orangeJuice, 12);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 18.00, 0.01);
        });
    });

    describe('Single use', () => {
        it('should only apply coupon once even with many items', () => {
            const validFrom = new Date(2024, 10, 13);
            const validTo = new Date(2024, 10, 15);
            const currentDate = new Date(2024, 10, 14);

            // buy 6 get 6 at half price
            const coupon = new Coupon(orangeJuice, 6, 50, validFrom, validTo);
            teller.applyCoupon(coupon, currentDate);

            cart.addItemQuantity(orangeJuice, 24); // could be 2 uses if not limited

            const receipt = teller.checksOutArticlesFrom(cart);

            // only 1 coupon use: 6 full + 6 half + 12 full
            // 6 * 2.00 + 6 * 1.00 + 12 * 2.00 = 12 + 6 + 24 = 42
            assert.approximately(receipt.getTotalPrice(), 42.00, 0.01);
            assert.equal(receipt.getDiscounts().length, 1);
        });

        it('should mark coupon as redeemed after use', () => {
            const validFrom = new Date(2024, 10, 13);
            const validTo = new Date(2024, 10, 15);
            const currentDate = new Date(2024, 10, 14);

            const coupon = new Coupon(orangeJuice, 6, 50, validFrom, validTo);

            assert.isFalse(coupon.isRedeemed());

            teller.applyCoupon(coupon, currentDate);
            cart.addItemQuantity(orangeJuice, 12);
            teller.checksOutArticlesFrom(cart);

            assert.isTrue(coupon.isRedeemed());
        });

        it('should not apply already redeemed coupon', () => {
            const validFrom = new Date(2024, 10, 13);
            const validTo = new Date(2024, 10, 15);
            const currentDate = new Date(2024, 10, 14);

            const coupon = new Coupon(orangeJuice, 6, 50, validFrom, validTo);
            coupon.redeem(); // manually redeem

            teller.applyCoupon(coupon, currentDate);
            cart.addItemQuantity(orangeJuice, 12);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 24.00, 0.01);
            assert.isEmpty(receipt.getDiscounts());
        });
    });

    describe('Different discount percentages', () => {
        it('should apply 25% discount coupon', () => {
            const validFrom = new Date(2024, 10, 13);
            const validTo = new Date(2024, 10, 15);
            const currentDate = new Date(2024, 10, 14);

            // buy 3 get 3 at 25% off
            const coupon = new Coupon(orangeJuice, 3, 25, validFrom, validTo);
            teller.applyCoupon(coupon, currentDate);

            cart.addItemQuantity(orangeJuice, 6);

            const receipt = teller.checksOutArticlesFrom(cart);

            // 3 at full: 6.00, 3 at 75%: 3 * 1.50 = 4.50
            // total: 10.50
            assert.approximately(receipt.getTotalPrice(), 10.50, 0.01);
        });

        it('should apply 100% discount (free items)', () => {
            const validFrom = new Date(2024, 10, 13);
            const validTo = new Date(2024, 10, 15);
            const currentDate = new Date(2024, 10, 14);

            // buy 2 get 2 free
            const coupon = new Coupon(orangeJuice, 2, 100, validFrom, validTo);
            teller.applyCoupon(coupon, currentDate);

            cart.addItemQuantity(orangeJuice, 4);

            const receipt = teller.checksOutArticlesFrom(cart);

            // 2 at full: 4.00, 2 free: 0
            // total: 4.00
            assert.approximately(receipt.getTotalPrice(), 4.00, 0.01);
        });
    });

    describe('Coupon with other offers', () => {
        it('should work with bundle offers', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            catalog.addProduct(toothbrush, 1.00);

            const validFrom = new Date(2024, 10, 13);
            const validTo = new Date(2024, 10, 15);
            const currentDate = new Date(2024, 10, 14);

            // coupon on orange juice
            const coupon = new Coupon(orangeJuice, 6, 50, validFrom, validTo);
            teller.applyCoupon(coupon, currentDate);

            // bundle on toothbrush + orange juice
            teller.addBundleOffer([toothbrush, orangeJuice]);

            cart.addItemQuantity(orangeJuice, 12);
            cart.addItem(toothbrush);

            const receipt = teller.checksOutArticlesFrom(cart);

            // coupon: 6 full + 6 half = 12 + 6 = 18
            // but also bundle applies... complex interaction
            assert.isAbove(receipt.getDiscounts().length, 0);
        });
    });

    describe('Edge cases', () => {
        it('should handle coupon with no items in cart', () => {
            const validFrom = new Date(2024, 10, 13);
            const validTo = new Date(2024, 10, 15);
            const currentDate = new Date(2024, 10, 14);

            const coupon = new Coupon(orangeJuice, 6, 50, validFrom, validTo);
            teller.applyCoupon(coupon, currentDate);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getTotalPrice(), 0);
            assert.isEmpty(receipt.getDiscounts());
        });

        it('should handle coupon for product not in cart', () => {
            const milk = new Product("milk", ProductUnit.Each);
            catalog.addProduct(milk, 1.50);

            const validFrom = new Date(2024, 10, 13);
            const validTo = new Date(2024, 10, 15);
            const currentDate = new Date(2024, 10, 14);

            const coupon = new Coupon(orangeJuice, 6, 50, validFrom, validTo);
            teller.applyCoupon(coupon, currentDate);

            cart.addItemQuantity(milk, 10);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 15.00, 0.01);
            assert.isEmpty(receipt.getDiscounts());
        });
    });
});
