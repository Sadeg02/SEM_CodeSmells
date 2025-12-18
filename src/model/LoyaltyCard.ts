// loyalty card - tracks points earned from purchases
// 1 point = 1 euro spent, can be used as payment
export class LoyaltyCard {
    private _points: number = 0;

    getPoints(): number {
        return this._points;
    }

    addPoints(points: number): void {
        if (points > 0) {
            this._points += points;
        }
    }

    // deduct points, returns actual amount deducted
    deductPoints(points: number): number {
        const toDeduct = Math.min(points, this._points);
        this._points -= toDeduct;
        return toDeduct;
    }
}
