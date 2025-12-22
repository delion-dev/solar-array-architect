import { describe, test, expect } from 'vitest';
import { calculateEnvironmentalImpact, calculateEconomics } from './economics';
import { EconomicConfig } from '../../types';

describe('Solar Economics Logic', () => {
    test('calculateEnvironmentalImpact should return correct values', () => {
        const annualMWh = 100;
        const impact = calculateEnvironmentalImpact(annualMWh);
        expect(impact.co2Reduction).toBeGreaterThan(0);
        expect(impact.pineTreesPlanted).toBeGreaterThan(0);
        expect(impact.oilSubstitution).toBeGreaterThan(0);
    });

    test('calculateEconomics should handle basic simulation', () => {
        const econConfig: EconomicConfig = {
            analysisMode: 'basic',
            dailyInsolation: 3.5,
            systemEfficiency: 80,
            annualDegradation: 0.5,
            smp: 150,
            recPrice: 80,
            recWeight: 1.0,
            installationCostPerKw: 1500000,
            maintenanceCostPerKw: 10000,
            leaseCostPerKw: 0,
            loanInterestRate: 4,
            loanTerm: 10,
            loanGracePeriod: 0,
            equityPercent: 30,
            corporateTaxRate: 10,
            depreciationPeriod: 20,
            inflationRate: 2,
            discountRate: 4.5,
            clippingLoss: 1,
            monthlyInsolation: [],
            vatIncluded: false
        };

        const result = calculateEconomics(100, 1.2, econConfig);

        expect(result.yearlyData.length).toBe(20);
        expect(result.totalConstructionCost).toBe(150000000);
        expect(result.paybackPeriod).toBeGreaterThan(0);
        expect(result.npv).toBeDefined();
        expect(result.clippingLossPercent).toBe(1);
    });
});
