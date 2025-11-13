import { FakeCatalog } from "./FakeCatalog";
import { Product } from "../src/model/Product";
import { ShoppingCart } from "../src/model/ShoppingCart";
import { Teller } from "../src/model/Teller";
import { SpecialOfferType } from "../src/model/SpecialOfferType";
import { ProductUnit } from "../src/model/ProductUnit";
import { assert } from "chai";

describe('Teller - Checkout Process', () => {
    let catalog: FakeCatalog;
    let teller: Teller;
    let cart: ShoppingCart;

    beforeEach(() => {
        catalog = new FakeCatalog();
        teller = new Teller(catalog);
        cart = new ShoppingCart();
    });

    describe('Basic checkout functionality', () => {
        it('should process empty cart', () => {
            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getTotalPrice(), 0);
            assert.isEmpty(receipt.getItems());
            assert.isEmpty(receipt.getDiscounts());
        });

        it('should checkout single item correctly', () => {
            const apple = new Product("apple", ProductUnit.Each);
            catalog.addProduct(apple, 0.50);

            cart.addItem(apple);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getTotalPrice(), 0.50);
            assert.equal(receipt.getItems().length, 1);
            assert.equal(receipt.getItems()[0].product, apple);
            assert.equal(receipt.getItems()[0].quantity, 1);
            assert.equal(receipt.getItems()[0].price, 0.50);
            assert.equal(receipt.getItems()[0].totalPrice, 0.50);
        });

        it('should checkout multiple different items', () => {
            const apple = new Product("apple", ProductUnit.Each);
            const banana = new Product("banana", ProductUnit.Each);
            const orange = new Product("orange", ProductUnit.Each);

            catalog.addProduct(apple, 0.50);
            catalog.addProduct(banana, 0.30);
            catalog.addProduct(orange, 0.60);

            cart.addItem(apple);
            cart.addItemQuantity(banana, 2);
            cart.addItemQuantity(orange, 3);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 2.90, 0.01);
            assert.equal(receipt.getItems().length, 3);
        });

        it('should handle items sold by weight (Kilo)', () => {
            const apples = new Product("apples", ProductUnit.Kilo);
            catalog.addProduct(apples, 1.99);

            cart.addItemQuantity(apples, 2.5);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 4.975, 0.01);
            assert.equal(receipt.getItems().length, 1);
            assert.equal(receipt.getItems()[0].quantity, 2.5);
        });

        it('should calculate correct total for multiple quantities of same item', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            catalog.addProduct(toothbrush, 0.99);

            cart.addItem(toothbrush);
            cart.addItemQuantity(toothbrush, 2);

            const receipt = teller.checksOutArticlesFrom(cart);

            // Each add creates a separate receipt item
            assert.equal(receipt.getItems().length, 2);
            // Total should be 3 * 0.99
            assert.approximately(receipt.getTotalPrice(), 2.97, 0.01);
        });
    });

    describe('Managing special offers', () => {
        it('should allow adding special offer for a product', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            catalog.addProduct(toothbrush, 1.00);

            // Should not throw
            teller.addSpecialOffer(SpecialOfferType.ThreeForTwo, toothbrush, 0);

            cart.addItemQuantity(toothbrush, 3);
            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getDiscounts().length, 1);
        });

        it('should allow adding multiple different offers', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            const rice = new Product("rice", ProductUnit.Each);

            catalog.addProduct(toothbrush, 1.00);
            catalog.addProduct(rice, 2.49);

            teller.addSpecialOffer(SpecialOfferType.ThreeForTwo, toothbrush, 0);
            teller.addSpecialOffer(SpecialOfferType.TenPercentDiscount, rice, 10.0);

            cart.addItemQuantity(toothbrush, 3);
            cart.addItemQuantity(rice, 1);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getDiscounts().length, 2);
        });

        it('should override previous offer if same product gets new offer', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            catalog.addProduct(toothbrush, 1.00);

            teller.addSpecialOffer(SpecialOfferType.ThreeForTwo, toothbrush, 0);
            teller.addSpecialOffer(SpecialOfferType.TenPercentDiscount, toothbrush, 10.0);

            cart.addItemQuantity(toothbrush, 3);

            const receipt = teller.checksOutArticlesFrom(cart);

            // Should apply the latest offer (10% discount)
            assert.equal(receipt.getDiscounts().length, 1);
            assert.equal(receipt.getDiscounts()[0].description, "10% off");
        });
    });

    describe('Receipt generation', () => {
        it('should generate receipt with correct item details', () => {
            const milk = new Product("milk", ProductUnit.Each);
            catalog.addProduct(milk, 1.30);

            cart.addItemQuantity(milk, 2);

            const receipt = teller.checksOutArticlesFrom(cart);
            const items = receipt.getItems();

            assert.equal(items.length, 1);
            assert.equal(items[0].product.name, "milk");
            assert.equal(items[0].quantity, 2);
            assert.equal(items[0].price, 1.30);
            assert.approximately(items[0].totalPrice, 2.60, 0.01);
        });

        it('should include all items from cart in receipt', () => {
            const products = [
                { name: "item1", price: 1.00 },
                { name: "item2", price: 2.00 },
                { name: "item3", price: 3.00 },
            ];

            products.forEach(p => {
                const product = new Product(p.name, ProductUnit.Each);
                catalog.addProduct(product, p.price);
                cart.addItem(product);
            });

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getItems().length, 3);
        });

        it('should include discounts in receipt when offers apply', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            catalog.addProduct(toothbrush, 1.00);
            teller.addSpecialOffer(SpecialOfferType.ThreeForTwo, toothbrush, 0);

            cart.addItemQuantity(toothbrush, 3);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getDiscounts().length, 1);
            assert.equal(receipt.getDiscounts()[0].product, toothbrush);
            assert.equal(receipt.getDiscounts()[0].discountAmount, 1.00);
        });

        it('should calculate final total including discounts', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            catalog.addProduct(toothbrush, 1.00);
            teller.addSpecialOffer(SpecialOfferType.ThreeForTwo, toothbrush, 0);

            cart.addItemQuantity(toothbrush, 3);

            const receipt = teller.checksOutArticlesFrom(cart);

            // Original: 3 * 1.00 = 3.00
            // Discount: 1.00
            // Final: 2.00
            assert.equal(receipt.getTotalPrice(), 2.00);
        });
    });

    describe('Integration with catalog', () => {
        it('should retrieve correct prices from catalog', () => {
            const expensiveItem = new Product("caviar", ProductUnit.Each);
            const cheapItem = new Product("gum", ProductUnit.Each);

            catalog.addProduct(expensiveItem, 99.99);
            catalog.addProduct(cheapItem, 0.50);

            cart.addItem(expensiveItem);
            cart.addItem(cheapItem);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 100.49, 0.01);
        });

        it('should handle mixed unit types (Each and Kilo)', () => {
            const bread = new Product("bread", ProductUnit.Each);
            const cheese = new Product("cheese", ProductUnit.Kilo);

            catalog.addProduct(bread, 2.50);
            catalog.addProduct(cheese, 12.99);

            cart.addItemQuantity(bread, 2);
            cart.addItemQuantity(cheese, 0.5);

            const receipt = teller.checksOutArticlesFrom(cart);

            // 2 * 2.50 + 0.5 * 12.99 = 5.00 + 6.495 = 11.495
            assert.approximately(receipt.getTotalPrice(), 11.495, 0.01);
        });
    });

    describe('Edge cases', () => {
        it('should handle very small decimal quantities', () => {
            const spice = new Product("spice", ProductUnit.Kilo);
            catalog.addProduct(spice, 50.00);

            cart.addItemQuantity(spice, 0.001);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 0.05, 0.01);
        });

        it('should handle large quantities', () => {
            const paper = new Product("paper", ProductUnit.Each);
            catalog.addProduct(paper, 0.10);

            cart.addItemQuantity(paper, 1000);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 100.00, 0.01);
        });

        it('should handle zero-priced items', () => {
            const freebie = new Product("free sample", ProductUnit.Each);
            catalog.addProduct(freebie, 0.00);

            cart.addItem(freebie);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getTotalPrice(), 0.00);
            assert.equal(receipt.getItems().length, 1);
        });
    });
});
