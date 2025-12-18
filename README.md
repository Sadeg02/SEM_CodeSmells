# Supermarket Receipt - Refactoring Kata

## Project Description

This project is a **Supermarket Receipt Refactoring Kata** - a TypeScript implementation of a supermarket checkout system. The goal was to:

1. **Identify and fix code smells** in the existing codebase
2. **Add comprehensive test coverage** to enable safe refactoring
3. **Implement new features** following TDD (Test-Driven Development)

## Project Structure

```
SEM_CodeSmells/
├── src/
│   ├── ReceiptPrinter.ts          # Formats receipt for printing
│   └── model/
│       ├── Product.ts             # Product entity (name, unit)
│       ├── ProductUnit.ts         # Enum: Kilo, Each
│       ├── ProductQuantity.ts     # Product + quantity pair
│       ├── ShoppingCart.ts        # Cart with items + discount logic
│       ├── Teller.ts              # Checkout process controller
│       ├── Receipt.ts             # Receipt with items, discounts, points
│       ├── ReceiptItem.ts         # Single item on receipt
│       ├── Discount.ts            # Discount entity
│       ├── Offer.ts               # Special offer definition
│       ├── SpecialOfferType.ts    # Enum: ThreeForTwo, TenPercentDiscount, etc.
│       ├── SupermarketCatalog.ts  # Interface for product catalog
│       ├── Bundle.ts              # NEW: Bundle of products for discount
│       ├── Coupon.ts              # NEW: Time-limited coupon
│       └── LoyaltyCard.ts         # NEW: Loyalty points system
├── test/
│   ├── FakeCatalog.ts             # Test double for catalog
│   ├── ShoppingCart.test.ts       # Cart tests (12 tests)
│   ├── SpecialOffers.test.ts      # Offer tests (19 tests)
│   ├── Teller.test.ts             # Teller tests (18 tests)
│   ├── Supermarket.test.ts        # Integration tests (15 tests)
│   ├── ReceiptPrinter.test.ts     # Printer tests (22 tests)
│   ├── Bundle.test.ts             # NEW: Bundle tests (11 tests)
│   ├── Coupon.test.ts             # NEW: Coupon tests (15 tests)
│   └── Loyalty.test.ts            # NEW: Loyalty tests (18 tests)
└── package.json
```

## Code Smells Identified

| Code Smell | Location | Description |
|------------|----------|-------------|
| **Long Method** | `ShoppingCart.handleOffers()` | 42 lines with nested if/else checking offer types |
| **Feature Envy** | `ShoppingCart.handleOffers()` | Accesses Receipt, Offer, Catalog extensively |
| **Switch Statements** | `ShoppingCart.handleOffers()` | Multiple if/else checking `offer.offerType` |
| **Missing else (BUG!)** | `ShoppingCart.ts:70` | `} if` instead of `} else if` - logic error |
| **Misleading Name** | `quantityAsInt` | Variable is NOT an int, it's a float |
| **Poor Variable Names** | `x`, `pq`, `p` | Single-letter meaningless names |
| **Magic Numbers** | `2, 3, 5, 100.0` | Numbers without named constants |
| **Redundant Code** | `ProductQuantity` constructor | Assignments duplicated (public readonly + explicit) |
| **Redundant Getter** | `Offer.getProduct()` | Getter for already public readonly field |
| **Inconsistent Cloning** | `Receipt.getDiscounts()` | `getItems()` clones but `getDiscounts()` didn't |
| **Inconsistent Readonly** | `ReceiptItem.totalPrice` | Other fields readonly, this one wasn't |
| **TODO in Production** | `ReceiptPrinter.ts:61` | TODO comment left in code |
| **String Concatenation** | `ReceiptPrinter` | Multiple `+=` instead of template literals |
| **let vs const** | Multiple files | `let` used where `const` should be |
| **== vs ===** | Multiple files | Loose equality instead of strict |

---

## Refactoring History (Commit by Commit)

### Commit 1: `805c5dd` - Add comprehensive test coverage

**What I did:** Added 87 tests across 5 test files covering all existing functionality.

**Why:** Need good test coverage before refactoring to catch any regressions. Tests cover:
- ShoppingCart: adding items, quantity tracking, edge cases
- SpecialOffers: all 4 offer types (3-for-2, 2-for-amount, 5-for-amount, percent discount)
- Teller: checkout process, offer management, receipt generation
- Supermarket: end-to-end integration tests
- ReceiptPrinter: formatting, alignment, edge cases

---

### Commit 2: `84def4a` - Fix ReceiptPrinter code smells

**What I did:**
- Extracted `formatReceiptItem()`, `formatDiscount()`, `formatTotal()` methods
- Changed string concatenation (`+=`) to template literals
- Removed TODO comment from production code
- Changed `let` to `const` where values don't change
- Changed `!=` to `!==` (strict equality)
- Added missing return type to `format2Decimals()`

**Why:** Long Method smell - `printReceipt()` was doing too much. Template literals are cleaner and easier to read. TODO comments shouldn't be in production code.

**Before:**
```typescript
result += description;
result += "(";
result += productPresentation;
result += ")";
// ... 7 separate concatenations
```

**After:**
```typescript
return `${description}(${productName})${whitespace}-${pricePresentation}${this.EOL}`;
```

---

### Commit 3: `8d314ae` - Fix ShoppingCart code smells

**What I did:**
- Split `handleOffers()` into 5 smaller methods
- Fixed **BUG**: missing `else` at line 70 (`} if` → `} else if`)
- Deleted useless variables: `quantityAsInt`, `x`, `numberOfXs`
- Made `_productQuantities` properly private
- Changed `let` to `const`, `==` to `===`
- Added return type to `increaseQuantity()`

**Why:** Long Method smell - 42 lines with complex nested logic. The missing `else` was an actual bug that could cause wrong discount calculations.

**Bug fix:**
```typescript
// BEFORE (wrong - missing else)
} else if (offer.offerType == SpecialOfferType.TwoForAmount) {
    // ...
} if (offer.offerType == SpecialOfferType.FiveForAmount) { 

// AFTER (correct)
} else if (offer.offerType === SpecialOfferType.TwoForAmount) {
    // ...
} else if (offer.offerType === SpecialOfferType.FiveForAmount) {
```

---

### Commit 4: `385b1d1` - Fix Receipt code smells

**What I did:**
- Changed `for` loops to `reduce()` for calculating totals
- Made `getDiscounts()` clone like `getItems()` (was inconsistent)
- Added `readonly` to arrays

**Why:** Inconsistent encapsulation - `getItems()` returned a clone but `getDiscounts()` returned the original array (could be mutated from outside).

**Before:**
```typescript
let total = 0.0;
for (let item of this.items) {
    total += item.totalPrice;
}
```

**After:**
```typescript
const itemsTotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
```

---

### Commit 5: `f1135db` - Fix ProductQuantity redundant code

**What I did:** Deleted redundant assignments in constructor.

**Why:** When using `public readonly` in constructor parameters, TypeScript automatically assigns them. Manual assignment is duplicate code.

**Before:**
```typescript
constructor(public readonly product: Product,
            public readonly quantity: number) {
    this.product = product;
    this.quantity = quantity;
}
```

**After:**
```typescript
constructor(public readonly product: Product,
            public readonly quantity: number) {
}
```

---

### Commit 6: `004b3f6` - Fix Offer redundant getter

**What I did:** Deleted `getProduct()` method.

**Why:** The `product` field is already `public readonly`, so the getter is useless - you can access `offer.product` directly.

---

### Commit 7: `8663cca` - Fix ReceiptItem inconsistent readonly

**What I did:** Added `readonly` to `totalPrice` field.

**Why:** Inconsistent - `product`, `quantity`, `price` were readonly but `totalPrice` wasn't.

---

### Commit 8: `ec5dc0b` - Fix Teller code smells

**What I did:**
- Added `readonly` to `offers` field
- Changed `let` to `const` in loop
- Renamed bad variable names: `pq` → `productQuantity`, `p` → `product`
- Fixed `ShoppingCart.productQuantities()` to clone (was inconsistent)

**Why:** Poor variable names make code hard to understand. Inconsistent cloning is a potential bug.

---

## New Features Implementation (TDD)

### Feature 1: Bundle Discounts

**Commits:** `76cd3c8` (tests), `d2b32a9` (implementation)

**Requirement:** When you purchase all items in a product bundle, you receive 10% off the total price of those items. Only complete bundles are discounted.

**Example:**
```typescript
// Bundle: toothbrush + toothpaste
teller.addBundleOffer([toothbrush, toothpaste]);

// Cart: 2 toothbrush + 1 toothpaste = 1 complete bundle
cart.addItemQuantity(toothbrush, 2);
cart.addItem(toothpaste);

// Result: 10% off ONE bundle (0.99 + 1.79), extra toothbrush at full price
```

**New files:**
- `src/model/Bundle.ts` - Bundle class
- `test/Bundle.test.ts` - 11 tests

---

### Feature 2: Coupon Discounts

**Commits:** `45ea941` (tests), `2075717` (implementation)

**Requirement:** Coupons with limited validity period and limited items. Example: valid from 13/11 till 15/11, buy 6 orange juice get 6 more at half price. Single use only.

**Example:**
```typescript
const coupon = new Coupon(orangeJuice, 6, 50, validFrom, validTo);
teller.applyCoupon(coupon, currentDate);

cart.addItemQuantity(orangeJuice, 12); // 6 full price + 6 at 50% off
```

**New files:**
- `src/model/Coupon.ts` - Coupon class with date validation and redemption tracking
- `test/Coupon.test.ts` - 15 tests

---

### Feature 3: Loyalty Program

**Commits:** `eb90b2a` (tests), `3fd91a7` (implementation)

**Requirement:** Money spent converts to credit points (1 point = 1 euro). Points can be used as payment.

**Example:**
```typescript
const loyaltyCard = new LoyaltyCard();
loyaltyCard.addPoints(10); // existing points

teller.setLoyaltyCard(loyaltyCard);
teller.usePoints(5); // use 5 points as payment

cart.addItemQuantity(apple, 5); // 10.00 total
// Final: 10.00 - 5.00 (points) = 5.00 to pay
// Earns: 5 new points
```

**New files:**
- `src/model/LoyaltyCard.ts` - Points tracking
- `test/Loyalty.test.ts` - 18 tests

---

### Commit 15: `ecfb7dd` - Final cleanup

**What I did:** Exported `AppliedCoupon` type from Teller to avoid duplication in ShoppingCart.

**Why:** DRY principle - same type was defined in two places.

---

## Test Coverage

| Test File | Tests | Description |
|-----------|-------|-------------|
| ShoppingCart.test.ts | 12 | Adding items, quantities, edge cases |
| SpecialOffers.test.ts | 19 | All 4 offer types with various quantities |
| Teller.test.ts | 18 | Checkout, offers, receipts |
| Supermarket.test.ts | 15 | End-to-end integration |
| ReceiptPrinter.test.ts | 22 | Formatting, alignment, edge cases |
| Bundle.test.ts | 11 | Bundle discounts |
| Coupon.test.ts | 15 | Time-limited coupons |
| Loyalty.test.ts | 18 | Points earning/spending |
| **Total** | **131** | |