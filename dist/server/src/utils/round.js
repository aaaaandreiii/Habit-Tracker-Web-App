"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundToTwo = roundToTwo;
function roundToTwo(value) {
    if (typeof value !== "number" || Number.isNaN(value))
        return 0;
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
