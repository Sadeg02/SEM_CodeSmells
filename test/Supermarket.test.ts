import { FakeCatalog } from "./FakeCatalog";
import { Product } from "../src/model/Product";
import { SupermarketCatalog } from "../src/model/SupermarketCatalog";
import { Receipt } from "../src/model/Receipt";
import { ShoppingCart } from "../src/model/ShoppingCart";
import { Teller } from "../src/model/Teller";
import { SpecialOfferType } from "../src/model/SpecialOfferType";
import { ProductUnit } from "../src/model/ProductUnit";
import { ReceiptPrinter } from "../src/ReceiptPrinter";
import { assert } from "chai";

describe('Supermarket - Integration Tests', () => {
    let catalog: SupermarketCatalog;
    let teller: Teller;
    let cart: ShoppingCart;

    beforeEach(() => {
        catalog = new FakeCatalog();
        teller = new Teller(catalog);
        cart = new ShoppingCart();
    });

    describe('Original test', () => {
        it('Ten percent discount - should not apply to product without offer', () => {
            // ARRANGE
            const toothbrush: Product = new Product("toothbrush", ProductUnit.Each);
            catalog.addProduct(toothbrush, 0.99);
            const apples: Product = new Product("apples", ProductUnit.Kilo);
            catalog.addProduct(apples, 1.99);

            teller.addSpecialOffer(SpecialOfferType.TenPercentDiscount, toothbrush, 10.0);
            cart.addItemQuantity(apples, 2.5);

            // ACT
            const receipt: Receipt = teller.checksOutArticlesFrom(cart);

            // ASSERT
            assert.approximately(receipt.getTotalPrice(), 4.975, 0.01);
            assert.isEmpty(receipt.getDiscounts());
            assert.equal(receipt.getItems().length, 1);
            const receiptItem = receipt.getItems()[0];
            assert.equal(receiptItem.product, apples);
            assert.equal(receiptItem.price, 1.99);
            assert.approximately(receiptItem.totalPrice, 2.5 * 1.99, 0.01);
            assert.equal(receiptItem.quantity, 2.5);
        });
    });

    describe('End-to-end shopping scenarios', () => {
        it('should handle complete shopping trip with mixed items and offers', () => {
            // Setup products
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            const apples = new Product("apples", ProductUnit.Kilo);
            const rice = new Product("rice", ProductUnit.Each);
            const milk = new Product("milk", ProductUnit.Each);

            catalog.addProduct(toothbrush, 0.99);
            catalog.addProduct(apples, 1.99);
            catalog.addProduct(rice, 2.49);
            catalog.addProduct(milk, 1.30);

            // Setup offers
            teller.addSpecialOffer(SpecialOfferType.ThreeForTwo, toothbrush, 0);
            teller.addSpecialOffer(SpecialOfferType.TenPercentDiscount, rice, 10.0);

            // Shopping
            cart.addItemQuantity(toothbrush, 3);
            cart.addItemQuantity(apples, 1.5);
            cart.addItem(rice);
            cart.addItemQuantity(milk, 2);

            // Checkout
            const receipt = teller.checksOutArticlesFrom(cart);

            // Verify
            assert.equal(receipt.getItems().length, 4);
            assert.equal(receipt.getDiscounts().length, 2);

            // Calculate expected total
            // toothbrush: 3 * 0.99 = 2.97, discount: 0.99, final: 1.98
            // apples: 1.5 * 1.99 = 2.985
            // rice: 1 * 2.49 = 2.49, discount: 0.249, final: 2.241
            // milk: 2 * 1.30 = 2.60
            // Total: 1.98 + 2.985 + 2.241 + 2.60 = 9.806
            assert.approximately(receipt.getTotalPrice(), 9.81, 0.02);
        });

        it('should handle bulk shopping with multiple quantity-based offers', () => {
            const toothpaste = new Product("toothpaste", ProductUnit.Each);
            const cherries = new Product("cherries", ProductUnit.Each);

            catalog.addProduct(toothpaste, 1.79);
            catalog.addProduct(cherries, 0.69);

            teller.addSpecialOffer(SpecialOfferType.FiveForAmount, toothpaste, 7.49);
            teller.addSpecialOffer(SpecialOfferType.TwoForAmount, cherries, 0.99);

            cart.addItemQuantity(toothpaste, 10);
            cart.addItemQuantity(cherries, 6);

            const receipt = teller.checksOutArticlesFrom(cart);

            // toothpaste: 10 items, 2 sets of 5 for 7.49 each = 14.98
            // cherries: 6 items, 3 pairs of 2 for 0.99 each = 2.97
            assert.approximately(receipt.getTotalPrice(), 17.95, 0.01);
            assert.equal(receipt.getDiscounts().length, 2);
        });

        it('should handle shopping cart with only discounted items', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            catalog.addProduct(toothbrush, 1.00);
            teller.addSpecialOffer(SpecialOfferType.ThreeForTwo, toothbrush, 0);

            cart.addItemQuantity(toothbrush, 6);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getTotalPrice(), 4.00);
            assert.equal(receipt.getDiscounts().length, 1);
        });

        it('should handle mixed unit types in single transaction', () => {
            const bread = new Product("bread", ProductUnit.Each);
            const cheese = new Product("cheese", ProductUnit.Kilo);
            const ham = new Product("ham", ProductUnit.Kilo);
            const butter = new Product("butter", ProductUnit.Each);

            catalog.addProduct(bread, 2.50);
            catalog.addProduct(cheese, 12.99);
            catalog.addProduct(ham, 8.50);
            catalog.addProduct(butter, 3.20);

            cart.addItemQuantity(bread, 2);
            cart.addItemQuantity(cheese, 0.3);
            cart.addItemQuantity(ham, 0.5);
            cart.addItem(butter);

            const receipt = teller.checksOutArticlesFrom(cart);

            // bread: 2 * 2.50 = 5.00
            // cheese: 0.3 * 12.99 = 3.897
            // ham: 0.5 * 8.50 = 4.25
            // butter: 1 * 3.20 = 3.20
            // Total: 16.347
            assert.approximately(receipt.getTotalPrice(), 16.35, 0.02);
        });
    });

    describe('Integration with ReceiptPrinter', () => {
        it('should print formatted receipt for complete transaction', () => {
            const printer = new ReceiptPrinter();
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            const apples = new Product("apples", ProductUnit.Kilo);

            catalog.addProduct(toothbrush, 0.99);
            catalog.addProduct(apples, 1.99);

            teller.addSpecialOffer(SpecialOfferType.ThreeForTwo, toothbrush, 0);

            cart.addItemQuantity(toothbrush, 3);
            cart.addItemQuantity(apples, 2.5);

            const receipt = teller.checksOutArticlesFrom(cart);
            const printedReceipt = printer.printReceipt(receipt);

            // Verify printed receipt contains expected information
            assert.include(printedReceipt, "toothbrush");
            assert.include(printedReceipt, "apples");
            assert.include(printedReceipt, "3 for 2");
            assert.include(printedReceipt, "Total:");
            assert.include(printedReceipt, "6.96");
        });

        it('should print receipt with multiple discounts correctly', () => {
            const printer = new ReceiptPrinter(50);
            const item1 = new Product("item1", ProductUnit.Each);
            const item2 = new Product("item2", ProductUnit.Each);

            catalog.addProduct(item1, 1.00);
            catalog.addProduct(item2, 2.00);

            teller.addSpecialOffer(SpecialOfferType.TenPercentDiscount, item1, 10.0);
            teller.addSpecialOffer(SpecialOfferType.TwoForAmount, item2, 3.00);

            cart.addItemQuantity(item1, 5);
            cart.addItemQuantity(item2, 4);

            const receipt = teller.checksOutArticlesFrom(cart);
            const printedReceipt = printer.printReceipt(receipt);

            assert.include(printedReceipt, "10% off");
            assert.include(printedReceipt, "2 for 3");
            assert.include(printedReceipt, "Total:");
        });
    });

    describe('Real-world shopping scenarios', () => {
        it('should handle weekly grocery shopping', () => {
            // Setup typical grocery items
            const products = [
                { name: "milk", unit: ProductUnit.Each, price: 1.30 },
                { name: "bread", unit: ProductUnit.Each, price: 2.50 },
                { name: "eggs", unit: ProductUnit.Each, price: 3.20 },
                { name: "apples", unit: ProductUnit.Kilo, price: 1.99 },
                { name: "chicken", unit: ProductUnit.Kilo, price: 5.99 },
                { name: "pasta", unit: ProductUnit.Each, price: 1.20 },
                { name: "tomatoes", unit: ProductUnit.Kilo, price: 2.50 },
            ];

            const productObjects: { [key: string]: Product } = {};
            products.forEach(p => {
                const product = new Product(p.name, p.unit);
                catalog.addProduct(product, p.price);
                productObjects[p.name] = product;
            });

            // Add some offers
            teller.addSpecialOffer(SpecialOfferType.TwoForAmount, productObjects["milk"], 2.00);
            teller.addSpecialOffer(SpecialOfferType.TenPercentDiscount, productObjects["chicken"], 15.0);

            // Shopping
            cart.addItemQuantity(productObjects["milk"], 2);
            cart.addItem(productObjects["bread"]);
            cart.addItem(productObjects["eggs"]);
            cart.addItemQuantity(productObjects["apples"], 1.5);
            cart.addItemQuantity(productObjects["chicken"], 0.8);
            cart.addItemQuantity(productObjects["pasta"], 3);
            cart.addItemQuantity(productObjects["tomatoes"], 0.5);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.isAtLeast(receipt.getItems().length, 7);
            assert.equal(receipt.getDiscounts().length, 2);
            assert.isAbove(receipt.getTotalPrice(), 0);
        });

        it('should handle pharmacy shopping with multiple same-product offers', () => {
            const vitamins = new Product("vitamins", ProductUnit.Each);
            const bandages = new Product("bandages", ProductUnit.Each);
            const painkillers = new Product("painkillers", ProductUnit.Each);

            catalog.addProduct(vitamins, 8.99);
            catalog.addProduct(bandages, 3.50);
            catalog.addProduct(painkillers, 5.99);

            teller.addSpecialOffer(SpecialOfferType.ThreeForTwo, vitamins, 0);
            teller.addSpecialOffer(SpecialOfferType.TwoForAmount, painkillers, 9.99);

            cart.addItemQuantity(vitamins, 6);
            cart.addItemQuantity(bandages, 4);
            cart.addItemQuantity(painkillers, 4);

            const receipt = teller.checksOutArticlesFrom(cart);

            // vitamins: 6 items, 2 sets of 3-for-2 = pay for 4 = 35.96
            // bandages: 4 * 3.50 = 14.00 (no offer)
            // painkillers: 4 items, 2 pairs of 2-for-9.99 = 19.98
            // Total: 35.96 + 14.00 + 19.98 = 69.94
            assert.approximately(receipt.getTotalPrice(), 69.94, 0.01);
            assert.equal(receipt.getDiscounts().length, 2);
        });

        it('should handle empty cart checkout gracefully', () => {
            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getTotalPrice(), 0);
            assert.isEmpty(receipt.getItems());
            assert.isEmpty(receipt.getDiscounts());
        });

        it('should handle single expensive item purchase', () => {
            const laptop = new Product("laptop", ProductUnit.Each);
            catalog.addProduct(laptop, 999.99);

            cart.addItem(laptop);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.approximately(receipt.getTotalPrice(), 999.99, 0.01);
            assert.equal(receipt.getItems().length, 1);
        });
    });

    describe('Edge cases in integrated system', () => {
        it('should handle adding same item multiple times to cart', () => {
            const apple = new Product("apple", ProductUnit.Each);
            catalog.addProduct(apple, 0.50);

            cart.addItem(apple);
            cart.addItem(apple);
            cart.addItem(apple);

            const receipt = teller.checksOutArticlesFrom(cart);

            // Each add creates separate receipt item
            assert.equal(receipt.getItems().length, 3);
            assert.approximately(receipt.getTotalPrice(), 1.50, 0.01);
        });

        it('should handle offer that reduces price to zero', () => {
            const item = new Product("free-gift", ProductUnit.Each);
            catalog.addProduct(item, 10.00);
            teller.addSpecialOffer(SpecialOfferType.TenPercentDiscount, item, 100.0);

            cart.addItem(item);

            const receipt = teller.checksOutArticlesFrom(cart);

            assert.equal(receipt.getTotalPrice(), 0);
            assert.equal(receipt.getDiscounts().length, 1);
            assert.equal(receipt.getDiscounts()[0].discountAmount, 10.00);
        });

        it('should correctly accumulate quantities from multiple adds', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            catalog.addProduct(toothbrush, 1.00);
            teller.addSpecialOffer(SpecialOfferType.ThreeForTwo, toothbrush, 0);

            // Add items separately to reach threshold
            cart.addItem(toothbrush);
            cart.addItem(toothbrush);
            cart.addItem(toothbrush);

            const receipt = teller.checksOutArticlesFrom(cart);

            // Should still get 3-for-2 discount
            assert.equal(receipt.getTotalPrice(), 2.00);
            assert.equal(receipt.getDiscounts().length, 1);
        });
    });
});
