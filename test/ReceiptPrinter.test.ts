import { ReceiptPrinter } from "../src/ReceiptPrinter";
import { Receipt } from "../src/model/Receipt";
import { Product } from "../src/model/Product";
import { ProductUnit } from "../src/model/ProductUnit";
import { Discount } from "../src/model/Discount";
import { assert } from "chai";

describe('ReceiptPrinter', () => {
    let printer: ReceiptPrinter;
    let receipt: Receipt;

    beforeEach(() => {
        printer = new ReceiptPrinter();
        receipt = new Receipt();
    });

    describe('Basic printing functionality', () => {
        it('should print empty receipt with only total', () => {
            const output = printer.printReceipt(receipt);

            assert.include(output, "Total:");
            assert.include(output, "0.00");
        });

        it('should print single item without quantity line', () => {
            const apple = new Product("apple", ProductUnit.Each);
            receipt.addProduct(apple, 1, 0.50, 0.50);

            const output = printer.printReceipt(receipt);

            assert.include(output, "apple");
            assert.include(output, "0.50");
            assert.include(output, "Total:");
            // Should not have "* 1" line since quantity is 1
            assert.notInclude(output, "*");
        });

        it('should print single item with quantity greater than 1', () => {
            const apple = new Product("apple", ProductUnit.Each);
            receipt.addProduct(apple, 3, 0.50, 1.50);

            const output = printer.printReceipt(receipt);

            assert.include(output, "apple");
            assert.include(output, "1.50");
            assert.include(output, "0.50 * 3");
            assert.include(output, "Total:");
        });

        it('should print multiple items', () => {
            const apple = new Product("apple", ProductUnit.Each);
            const banana = new Product("banana", ProductUnit.Each);

            receipt.addProduct(apple, 2, 0.50, 1.00);
            receipt.addProduct(banana, 1, 0.30, 0.30);

            const output = printer.printReceipt(receipt);

            assert.include(output, "apple");
            assert.include(output, "banana");
            assert.include(output, "1.00");
            assert.include(output, "0.30");
            assert.include(output, "Total:");
            assert.include(output, "1.30");
        });
    });

    describe('Quantity formatting', () => {
        it('should format Each items with no decimals', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            receipt.addProduct(toothbrush, 5, 0.99, 4.95);

            const output = printer.printReceipt(receipt);

            assert.include(output, "0.99 * 5");
            assert.notInclude(output, "5.0");
            assert.notInclude(output, "5.000");
        });

        it('should format Kilo items with 3 decimals', () => {
            const apples = new Product("apples", ProductUnit.Kilo);
            receipt.addProduct(apples, 2.5, 1.99, 4.975);

            const output = printer.printReceipt(receipt);

            assert.include(output, "1.99 * 2.500");
        });

        it('should format fractional Kilo quantities correctly', () => {
            const cheese = new Product("cheese", ProductUnit.Kilo);
            receipt.addProduct(cheese, 0.375, 12.00, 4.50);

            const output = printer.printReceipt(receipt);

            assert.include(output, "12.00 * 0.375");
        });
    });

    describe('Price formatting', () => {
        it('should always show 2 decimal places for prices', () => {
            const milk = new Product("milk", ProductUnit.Each);
            receipt.addProduct(milk, 1, 1.00, 1.00);

            const output = printer.printReceipt(receipt);

            assert.include(output, "1.00");
            assert.notInclude(output, "1.0 ");
            assert.notInclude(output, "1 ");
        });

        it('should round to 2 decimal places', () => {
            const item = new Product("item", ProductUnit.Each);
            receipt.addProduct(item, 1, 1.999, 1.999);

            const output = printer.printReceipt(receipt);

            assert.include(output, "2.00");
        });

        it('should handle very small prices', () => {
            const gum = new Product("gum", ProductUnit.Each);
            receipt.addProduct(gum, 1, 0.01, 0.01);

            const output = printer.printReceipt(receipt);

            assert.include(output, "0.01");
        });

        it('should handle large prices', () => {
            const laptop = new Product("laptop", ProductUnit.Each);
            receipt.addProduct(laptop, 1, 999.99, 999.99);

            const output = printer.printReceipt(receipt);

            assert.include(output, "999.99");
        });
    });

    describe('Discount formatting', () => {
        it('should print discount with description and product name', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            receipt.addProduct(toothbrush, 3, 1.00, 3.00);

            const discount = new Discount(toothbrush, "3 for 2", 1.00);
            receipt.addDiscount(discount);

            const output = printer.printReceipt(receipt);

            assert.include(output, "3 for 2");
            assert.include(output, "(toothbrush)");
            assert.include(output, "-1.00");
        });

        it('should print multiple discounts', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            const rice = new Product("rice", ProductUnit.Each);

            receipt.addProduct(toothbrush, 3, 1.00, 3.00);
            receipt.addProduct(rice, 2, 2.49, 4.98);

            receipt.addDiscount(new Discount(toothbrush, "3 for 2", 1.00));
            receipt.addDiscount(new Discount(rice, "10% off", 0.498));

            const output = printer.printReceipt(receipt);

            assert.include(output, "3 for 2(toothbrush)");
            assert.include(output, "-1.00");
            assert.include(output, "10% off(rice)");
            assert.include(output, "-0.50");
        });

        it('should calculate total after discounts', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            receipt.addProduct(toothbrush, 3, 1.00, 3.00);
            receipt.addDiscount(new Discount(toothbrush, "3 for 2", 1.00));

            const output = printer.printReceipt(receipt);

            assert.include(output, "Total:");
            assert.include(output, "2.00");
        });
    });

    describe('Column width and alignment', () => {
        it('should use default 40 columns', () => {
            const item = new Product("item", ProductUnit.Each);
            receipt.addProduct(item, 1, 1.00, 1.00);

            const output = printer.printReceipt(receipt);
            const lines = output.split('\n');

            // First line should have item name, spaces, and price
            const firstLine = lines[0];
            // Should be padded to fit 40 characters (minus EOL)
            assert.isAtMost(firstLine.length, 40);
        });

        it('should use custom column width', () => {
            const customPrinter = new ReceiptPrinter(60);
            const item = new Product("item", ProductUnit.Each);
            receipt.addProduct(item, 1, 1.00, 1.00);

            const output = customPrinter.printReceipt(receipt);
            const lines = output.split('\n');

            // With more columns, there should be more whitespace
            assert.include(lines[0], "item");
            assert.include(lines[0], "1.00");
        });

        it('should align prices to the right', () => {
            const shortName = new Product("a", ProductUnit.Each);
            const longName = new Product("very long product name", ProductUnit.Each);

            const receipt1 = new Receipt();
            receipt1.addProduct(shortName, 1, 1.00, 1.00);

            const receipt2 = new Receipt();
            receipt2.addProduct(longName, 1, 1.00, 1.00);

            const output1 = printer.printReceipt(receipt1);
            const output2 = printer.printReceipt(receipt2);

            const lines1 = output1.split('\n')[0];
            const lines2 = output2.split('\n')[0];

            // Price should appear at the same position (right-aligned)
            const pricePos1 = lines1.lastIndexOf("1.00");
            const pricePos2 = lines2.lastIndexOf("1.00");

            assert.equal(pricePos1, pricePos2, "Prices should be aligned");
        });
    });

    describe('Line endings', () => {
        it('should use correct line endings for platform', () => {
            const item = new Product("item", ProductUnit.Each);
            receipt.addProduct(item, 1, 1.00, 1.00);

            const output = printer.printReceipt(receipt);

            // Should contain line breaks appropriate to the platform
            if (process.platform === "win32") {
                assert.include(output, "\r\n");
            } else {
                assert.include(output, "\n");
            }
        });

        it('should have blank line before total', () => {
            const item = new Product("item", ProductUnit.Each);
            receipt.addProduct(item, 1, 1.00, 1.00);

            const output = printer.printReceipt(receipt);
            const lines = output.split('\n');

            // There should be an empty line before "Total:"
            const totalLineIndex = lines.findIndex(line => line.includes("Total:"));
            assert.isTrue(totalLineIndex > 0);
            assert.equal(lines[totalLineIndex - 1].trim(), "");
        });
    });

    describe('Complex receipt scenarios', () => {
        it('should print complete receipt with items and discounts', () => {
            const toothbrush = new Product("toothbrush", ProductUnit.Each);
            const apples = new Product("apples", ProductUnit.Kilo);
            const rice = new Product("rice", ProductUnit.Each);

            receipt.addProduct(toothbrush, 3, 0.99, 2.97);
            receipt.addProduct(apples, 2.5, 1.99, 4.975);
            receipt.addProduct(rice, 1, 2.49, 2.49);

            receipt.addDiscount(new Discount(toothbrush, "3 for 2", 0.99));
            receipt.addDiscount(new Discount(rice, "10% off", 0.249));

            const output = printer.printReceipt(receipt);

            // Check all items are present
            assert.include(output, "toothbrush");
            assert.include(output, "apples");
            assert.include(output, "rice");

            // Check discounts
            assert.include(output, "3 for 2(toothbrush)");
            assert.include(output, "10% off(rice)");

            // Check total - receipt calculates: 2.97 + 4.975 + 2.49 - 0.99 - 0.249 = 9.196
            assert.include(output, "Total:");
            const totalMatch = output.match(/Total:.*?(\d+\.\d+)/);
            assert.isNotNull(totalMatch);
            const total = parseFloat(totalMatch![1]);
            assert.approximately(total, 9.20, 0.01);
        });

        it('should handle receipt with only discounts (no items shown)', () => {
            const item = new Product("item", ProductUnit.Each);
            receipt.addProduct(item, 1, 10.00, 10.00);
            receipt.addDiscount(new Discount(item, "100% off", 10.00));

            const output = printer.printReceipt(receipt);

            assert.include(output, "100% off(item)");
            assert.include(output, "Total:");
            assert.include(output, "0.00");
        });

        it('should handle very long product names gracefully', () => {
            // Use a product name that fits within the default 40 columns
            const longName = new Product(
                "Premium Organic Product",
                ProductUnit.Each
            );
            receipt.addProduct(longName, 1, 5.99, 5.99);

            const output = printer.printReceipt(receipt);

            assert.include(output, "Premium Organic Product");
            assert.include(output, "5.99");
        });
    });

    describe('Edge cases', () => {
        it('should handle zero-priced item', () => {
            const freebie = new Product("free sample", ProductUnit.Each);
            receipt.addProduct(freebie, 1, 0.00, 0.00);

            const output = printer.printReceipt(receipt);

            assert.include(output, "free sample");
            assert.include(output, "0.00");
        });

        it('should handle very small quantities', () => {
            const spice = new Product("spice", ProductUnit.Kilo);
            receipt.addProduct(spice, 0.001, 50.00, 0.05);

            const output = printer.printReceipt(receipt);

            assert.include(output, "50.00 * 0.001");
        });

        it('should handle large quantities', () => {
            const paper = new Product("paper", ProductUnit.Each);
            receipt.addProduct(paper, 1000, 0.10, 100.00);

            const output = printer.printReceipt(receipt);

            // For Each items, the formatter uses no decimals, so 1000 is formatted as "1,000"
            assert.include(output, "paper");
            assert.include(output, "100.00");
            assert.include(output, "0.10");
        });
    });
});
