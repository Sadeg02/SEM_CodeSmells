import {ProductUnit} from "./model/ProductUnit"
import {ReceiptItem} from "./model/ReceiptItem"
import {Receipt} from "./model/Receipt"

export class ReceiptPrinter {

    private readonly EOL = process.platform === "win32" ? "\r\n" : "\n";

    public constructor(private readonly columns: number = 40) {
    }

    // refactored - extracted methods to make printReceipt shorter (Long Method smell)
    public printReceipt(receipt: Receipt): string {
        let result = "";

        for (const item of receipt.getItems()) {
            result += this.formatReceiptItem(item);
        }

        for (const discount of receipt.getDiscounts()) {
            result += this.formatDiscount(discount);
        }

        result += this.formatTotal(receipt.getTotalPrice());

        return result;
    }

    // extracted from printReceipt - item formatting logic
    private formatReceiptItem(item: ReceiptItem): string {
        // changed let -> const (these dont change so const is safer)
        const price = this.format2Decimals(item.totalPrice);
        const quantity = ReceiptPrinter.presentQuantity(item);
        const name = item.product.name;
        const unitPrice = this.format2Decimals(item.price);

        const whitespaceSize = this.columns - name.length - price.length;

        // template literal instead of + concat (cleaner to read)
        let line = `${name}${ReceiptPrinter.getWhitespace(whitespaceSize)}${price}${this.EOL}`;

        // !== instead of != (strict equality - no type coercion bugs)
        if (item.quantity !== 1) {
            line += `  ${unitPrice} * ${quantity}${this.EOL}`;
        }

        return line;
    }

    // extracted discount formatting
    // before: 7 separate += operations, now: 1 template literal
    private formatDiscount(discount: { product: { name: string }, description: string, discountAmount: number }): string {
        const productName = discount.product.name;
        const pricePresentation = this.format2Decimals(discount.discountAmount);
        const description = discount.description;

        // -3 for: ( ) - chars
        const whitespaceSize = this.columns - 3 - productName.length - description.length - pricePresentation.length;
        const whitespace = ReceiptPrinter.getWhitespace(whitespaceSize);

        return `${description}(${productName})${whitespace}-${pricePresentation}${this.EOL}`;
    }

    // extracted total formatting
    private formatTotal(totalPrice: number): string {
        const pricePresentation = this.format2Decimals(totalPrice);
        const totalLabel = "Total: ";
        const whitespace = ReceiptPrinter.getWhitespace(
            this.columns - totalLabel.length - pricePresentation.length
        );

        return `${this.EOL}${totalLabel}${whitespace}${pricePresentation}`;
    }

    // added return type : string (was missing - code smell)
    private format2Decimals(number: number): string {
        return new Intl.NumberFormat('en-UK', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(number);
    }

    // removed TODO comment (shouldnt be in prod code)
    // also == changed to === for strict comparison
    private static presentQuantity(item: ReceiptItem): string {
        return ProductUnit.Each === item.product.unit
            ? new Intl.NumberFormat('en-UK', {maximumFractionDigits: 0}).format(item.quantity)
            : new Intl.NumberFormat('en-UK', {minimumFractionDigits: 3}).format(item.quantity);
    }

    private static getWhitespace(whitespaceSize: number): string {
        return " ".repeat(whitespaceSize);
    }
}
