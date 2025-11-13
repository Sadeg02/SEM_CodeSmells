import { ShoppingCart } from "../src/model/ShoppingCart";
import { Product } from "../src/model/Product";
import { ProductUnit } from "../src/model/ProductUnit";
import { assert } from "chai";

describe('ShoppingCart', () => {
    let cart: ShoppingCart;

    beforeEach(() => {
        cart = new ShoppingCart();
    });

    describe('Adding items', () => {
        it('should add a single item to cart', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);

            cart.addItem(toothbrush);

            const items = cart.getItems();
            assert.equal(items.length, 1);
            assert.equal(items[0].product, toothbrush);
            assert.equal(items[0].quantity, 1.0);
        });

        it('should add item with specific quantity', () => {
            const apples = new Product("apples", ProductUnit.Kilo);

            cart.addItemQuantity(apples, 2.5);

            const items = cart.getItems();
            assert.equal(items.length, 1);
            assert.equal(items[0].quantity, 2.5);
        });

        it('should add multiple different items', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            const apples = new Product("apples", ProductUnit.Kilo);

            cart.addItem(toothbrush);
            cart.addItemQuantity(apples, 2.5);

            const items = cart.getItems();
            assert.equal(items.length, 2);
        });

        it('should accumulate quantities when adding same product multiple times', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);

            cart.addItem(toothbrush);
            cart.addItem(toothbrush);
            cart.addItemQuantity(toothbrush, 3);

            const items = cart.getItems();
            assert.equal(items.length, 3, "Each add creates a separate item entry");

            const productQuantities = cart.productQuantities();
            assert.equal(productQuantities["toothbrush"].quantity, 5, "Total quantity should be accumulated");
        });

        it('should handle decimal quantities correctly', () => {
            const rice = new Product("rice", ProductUnit.Kilo);

            cart.addItemQuantity(rice, 1.75);
            cart.addItemQuantity(rice, 0.25);

            const productQuantities = cart.productQuantities();
            assert.equal(productQuantities["rice"].quantity, 2.0);
        });
    });

    describe('Product quantities tracking', () => {
        it('should track unique products in productQuantities', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            const apples = new Product("apples", ProductUnit.Kilo);

            cart.addItem(toothbrush);
            cart.addItemQuantity(apples, 2.5);

            const productQuantities = cart.productQuantities();
            assert.equal(Object.keys(productQuantities).length, 2);
            assert.isDefined(productQuantities["toothbrush"]);
            assert.isDefined(productQuantities["apples"]);
        });

        it('should return correct quantity for each product', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            const apples = new Product("apples", ProductUnit.Kilo);

            cart.addItemQuantity(toothbrush, 3);
            cart.addItemQuantity(apples, 1.5);
            cart.addItem(toothbrush);

            const productQuantities = cart.productQuantities();
            assert.equal(productQuantities["toothbrush"].quantity, 4);
            assert.equal(productQuantities["apples"].quantity, 1.5);
        });
    });

    describe('Edge cases', () => {
        it('should handle empty cart', () => {
            const items = cart.getItems();
            const productQuantities = cart.productQuantities();

            assert.equal(items.length, 0);
            assert.equal(Object.keys(productQuantities).length, 0);
        });

        it('should handle zero quantity', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);

            cart.addItemQuantity(toothbrush, 0);

            const items = cart.getItems();
            assert.equal(items.length, 1);
            assert.equal(items[0].quantity, 0);
        });

        it('should handle large quantities', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);

            cart.addItemQuantity(toothbrush, 1000);

            const productQuantities = cart.productQuantities();
            assert.equal(productQuantities["toothbrush"].quantity, 1000);
        });

        it('should return cloned items array (immutability)', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            cart.addItem(toothbrush);

            const items1 = cart.getItems();
            const items2 = cart.getItems();

            assert.notStrictEqual(items1, items2, "Should return different array instances");
            assert.equal(items1.length, items2.length, "But with same content");
        });
    });
});
