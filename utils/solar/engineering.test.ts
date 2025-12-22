import { describe, test, expect } from 'vitest';
import { calculateTempVoltage, calculateVoltageDrop } from './engineering';

describe('Solar Engineering Logic', () => {
    test('calculateTempVoltage should correctly adjust voltage based on temperature', () => {
        const baseVoltage = 40;
        const tempCoeff = -0.3; // -0.3%/C
        const targetTemp = 70;
        const expected = baseVoltage * (1 + (-0.3 / 100) * (70 - 25));
        expect(calculateTempVoltage(baseVoltage, tempCoeff, targetTemp)).toBeCloseTo(expected);
    });

    test('calculateVoltageDrop should return 0 if crossSection is 0', () => {
        expect(calculateVoltageDrop(10, 100, 0)).toBe(0);
    });

    test('calculateVoltageDrop should consider material and temperature', () => {
        const current = 10;
        const length = 50;
        const crossSection = 4;

        // Copper at 70C
        const dropCopper = calculateVoltageDrop(current, length, crossSection, 'copper', 70);
        // Aluminum at 70C (should be higher drop than copper)
        const dropAlum = calculateVoltageDrop(current, length, crossSection, 'aluminum', 70);

        expect(dropAlum).toBeGreaterThan(dropCopper);

        // Copper at 20C (should be lower drop than at 70C)
        const dropCopperCold = calculateVoltageDrop(current, length, crossSection, 'copper', 20);
        expect(dropCopper).toBeGreaterThan(dropCopperCold);
    });
});
