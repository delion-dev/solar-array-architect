import { EconomicConfig, SimulationResult, YearlyPrediction, EnvironmentalImpact, SensitivityResult, LossFactors, LossChartData, BessConfig, BessResult } from '../../types';
import { DAYS_IN_MONTH, ENVIRONMENTAL_FACTORS, DEFAULT_DISCOUNT_RATE } from './constants';

/**
 * [환경적 기대효과 계산]
 * 태양광 발전을 통해 감축되는 이산화탄소량과 그에 따른 부수적 효과(소나무 식재 등)를 계산합니다.
 * @param annualGenerationMWh 연간 발전량 (MWh)
 * @returns 환경 영향 평가 결과 객체
 */
export const calculateEnvironmentalImpact = (annualGenerationMWh: number): EnvironmentalImpact => {
    const { CO2_FACTOR, PINE_TREE_FACTOR, OIL_TOE_FACTOR } = ENVIRONMENTAL_FACTORS;

    const co2Reduction = annualGenerationMWh * CO2_FACTOR;
    const pineTreesPlanted = co2Reduction / PINE_TREE_FACTOR;
    const oilSubstitution = annualGenerationMWh * OIL_TOE_FACTOR;

    return {
        co2Reduction: parseFloat(co2Reduction.toFixed(2)),
        pineTreesPlanted: Math.round(pineTreesPlanted),
        oilSubstitution: parseFloat(oilSubstitution.toFixed(2))
    };
};

/**
 * [상세 손실 계수(PR) 계산 및 Waterfall 데이터 생성]
 * 시스템의 각종 손실 요인을 반영하여 최종 성능 비율(Performance Ratio)을 산출하고 시각화 데이터를 생성합니다.
 * @param factors 손실 요인 설정 객체
 * @returns 최종 PR 및 차트용 데이터
 */
export const calculateDetailedPR = (factors: LossFactors): { finalPR: number, lossData: LossChartData[] } => {
    let currentVal = 100; // 시작은 100%
    const data: LossChartData[] = [];

    data.push({ name: 'Nominal', value: 100, fill: '#cbd5e1' });

    const applyLoss = (name: string, lossPercent: number) => {
        const lossAmount = currentVal * (lossPercent / 100);
        currentVal -= lossAmount;
        data.push({ name, value: lossAmount, fill: '#ef4444', stepLabel: `-${lossPercent}%` });
    };

    // 주요 손실 요인 적용
    applyLoss('Soiling', factors.soiling);         // 오염 손실
    applyLoss('Shading', factors.shading);         // 음영 손실
    applyLoss('IAM', factors.iamLoss);             // [New] 입사각 수정 계수 손실
    applyLoss('Mismatch', factors.mismatch);       // 미스매치 손실
    applyLoss('LID', factors.lid);                 // 초기 성능 저하(LID)
    applyLoss('DC Wiring', factors.dcWiring);     // DC 배선 손실
    applyLoss('Inverter', 100 - factors.inverterEfficiency); // 인버터 변환 손실
    applyLoss('AC Wiring', factors.acWiring);     // AC 배선 손실
    applyLoss('Availability', factors.availability); // 가동률 손실

    data.push({ name: 'Final PR', value: currentVal, fill: '#22c55e' });

    return { finalPR: currentVal, lossData: data };
};

/**
 * [BESS(Battery Energy Storage System) 시뮬레이션]
 * 태양광 발전량과 배터리 설정을 바탕으로 에너지 저장 및 방전 시뮬레이션을 수행합니다.
 */
export const simulateBess = (
    hourlyGen: number[],
    config: BessConfig
): BessResult => {
    if (!config.enabled || config.capacityKwh <= 0) {
        return {
            storedEnergyTotal20y: 0,
            dischargedEnergyTotal20y: 0,
            selfConsumptionIncrease: 0,
            peakShavingBenefit: 0,
            bessCapex: 0
        };
    }

    const dailyCapacity = config.capacityKwh * (config.dod / 100);
    const efficiency = config.efficiency / 100;

    // 단순화된 일일 사이클 시뮬레이션
    // 낮 시간(10~16시)에 충전, 저녁 시간(18~22시)에 방전 가정
    let dailyStored = 0;
    for (let h = 10; h <= 16; h++) {
        dailyStored += Math.min(hourlyGen[h], config.powerKw);
    }
    dailyStored = Math.min(dailyStored, dailyCapacity);

    const dailyDischarged = dailyStored * efficiency;
    const annualDischargedMWh = (dailyDischarged * 365) / 1000;

    return {
        storedEnergyTotal20y: (dailyStored * 365 * 20) / 1000,
        dischargedEnergyTotal20y: annualDischargedMWh * 20,
        selfConsumptionIncrease: (dailyDischarged / (hourlyGen.reduce((a, b) => a + b, 0) || 1)) * 100,
        peakShavingBenefit: dailyDischarged * 365 * 20 * 100, // kWh당 100원 절감 가정
        bessCapex: config.capacityKwh * config.costPerKwh
    };
};

/**
 * [경제성 분석 시뮬레이션 함수]
 * 20년간의 발전량, 매출, 비용, 세금, 대출 상환 등을 종합적으로 시뮬레이션하여 경제성 지표를 산출합니다.
 */
export const calculateEconomics = (
    systemCapacityKw: number,
    dcAcRatio: number,
    econConfig: EconomicConfig
): SimulationResult => {
    const years = 20; // 표준 분석 기간 20년
    const yearlyData: YearlyPrediction[] = [];

    let totalGeneration = 0;
    let totalGrossRevenue = 0;
    let totalMaintenanceCost = 0;
    let totalLoanInterest = 0;
    let totalTax = 0;

    // 초기 투자비 계산
    const constructionCost = systemCapacityKw * econConfig.installationCostPerKw;
    // [New] ITC(투자세액공제) 반영
    const itcAmount = constructionCost * ((econConfig.itcPercent || 0) / 100);
    const totalConstructionCost = constructionCost - itcAmount;

    const equityRatio = (econConfig.equityPercent ?? 100) / 100;
    const equityAmount = totalConstructionCost * equityRatio;
    const loanAmount = totalConstructionCost * (1 - equityRatio);
    const loanRate = (econConfig.loanInterestRate ?? 0) / 100;
    const loanTerm = econConfig.loanTerm ?? 0;
    const gracePeriod = econConfig.loanGracePeriod ?? 0;

    // 세무 및 회계 설정
    const taxRate = (econConfig.corporateTaxRate ?? 0) / 100;
    const depPeriod = econConfig.depreciationPeriod ?? 20;
    const annualDepreciation = depPeriod > 0 ? totalConstructionCost / depPeriod : 0;
    const inflation = (econConfig.inflationRate ?? 0) / 100;

    // 원리금 균등 상환 계산
    const amortizationPeriod = Math.max(0, loanTerm - gracePeriod);
    let amortizationPayment = 0;
    if (loanAmount > 0 && loanRate > 0 && amortizationPeriod > 0) {
        amortizationPayment = (loanAmount * loanRate) / (1 - Math.pow(1 + loanRate, -amortizationPeriod));
    } else if (loanAmount > 0 && loanRate === 0 && amortizationPeriod > 0) {
        amortizationPayment = loanAmount / amortizationPeriod;
    }

    let cumulativeCashFlow = -equityAmount;
    let paybackPeriod = 0;
    let paybackFound = false;

    // 상세 PR 계산
    const lossFactors = econConfig.lossFactors || {
        soiling: 2, shading: 3, iamLoss: 2, mismatch: 2, lid: 1.5, dcWiring: 1.5, acWiring: 1, inverterEfficiency: 98, availability: 0.5
    };
    const { finalPR, lossData } = calculateDetailedPR(lossFactors);

    const systemEfficiencyFactor = finalPR / 100;
    const baseAnnualMaintenanceCost = systemCapacityKw * econConfig.maintenanceCostPerKw;
    const baseAnnualLeaseCost = systemCapacityKw * econConfig.leaseCostPerKw;

    // Clipping Loss(과설계 손실) 적용
    const clippingLossPercent = econConfig.clippingLoss || 0;
    const clippingFactor = 1 - (clippingLossPercent / 100);

    let baseAnnualGeneration = 0;
    const monthlyGeneration = new Array(12).fill(0);
    const hourlyGeneration = new Array(24).fill(0);
    let monthlyAvgInsolation = new Array(12).fill(0);

    // 발전량 계산 로직
    if (econConfig.analysisMode === 'detailed' && econConfig.tmyData && econConfig.tmyData.length > 8000) {
        const tmy = econConfig.tmyData;
        let hourlyCount = new Array(24).fill(0);
        let monthlyGHISum = new Array(12).fill(0);

        tmy.forEach(record => {
            const genKwh = systemCapacityKw * (record.ghi / 1000) * systemEfficiencyFactor * clippingFactor;
            if (record.month >= 1 && record.month <= 12) {
                monthlyGeneration[record.month - 1] += genKwh;
                monthlyGHISum[record.month - 1] += record.ghi;
            }
            const h = record.hour % 24;
            hourlyGeneration[h] += genKwh;
            hourlyCount[h]++;
        });

        monthlyAvgInsolation = monthlyGHISum.map((sum, i) => (sum / 1000) / DAYS_IN_MONTH[i]);
        for (let h = 0; h < 24; h++) if (hourlyCount[h] > 0) hourlyGeneration[h] = hourlyGeneration[h] / 365;
        baseAnnualGeneration = monthlyGeneration.reduce((a, b) => a + b, 0);

    } else if (econConfig.analysisMode === 'detailed' && econConfig.monthlyInsolation.length === 12) {
        monthlyAvgInsolation = [...econConfig.monthlyInsolation];
        econConfig.monthlyInsolation.forEach((hours, idx) => {
            const monthlyGen = systemCapacityKw * hours * DAYS_IN_MONTH[idx] * systemEfficiencyFactor * clippingFactor;
            monthlyGeneration[idx] = monthlyGen;
        });
        baseAnnualGeneration = monthlyGeneration.reduce((a, b) => a + b, 0);
        for (let h = 6; h <= 19; h++) {
            const bellCurve = Math.sin(((h - 6) / 13) * Math.PI);
            hourlyGeneration[h] = (baseAnnualGeneration / 365) * (bellCurve / 8);
        }
    } else {
        monthlyAvgInsolation = new Array(12).fill(econConfig.dailyInsolation);
        baseAnnualGeneration = systemCapacityKw * econConfig.dailyInsolation * 365 * systemEfficiencyFactor * clippingFactor;
        monthlyGeneration.forEach((_, idx) => {
            monthlyGeneration[idx] = (baseAnnualGeneration / 365) * DAYS_IN_MONTH[idx];
        });
    }

    // [New] BESS 시뮬레이션 실행
    // Note: 실제 구현에서는 store에서 BessConfig를 넘겨받아야 함. 여기서는 econConfig에 포함되어 있다고 가정하거나 기본값 사용.
    // 임시로 비활성화된 기본 설정 사용
    const bessResult = simulateBess(hourlyGeneration, { enabled: false, capacityKwh: 0, powerKw: 0, efficiency: 90, dod: 90, costPerKwh: 500000, cyclesPerYear: 350 });

    let remainingLoanBalance = loanAmount;
    const discountRate = (econConfig.discountRate ?? (loanRate * 100 || DEFAULT_DISCOUNT_RATE * 100)) / 100;
    let totalNPV = -equityAmount;

    // 연도별 현금흐름 시뮬레이션
    for (let year = 1; year <= years; year++) {
        const degradationRate = (econConfig.annualDegradation / 100) * (year - 1);
        const efficiencyRate = 1 - degradationRate;
        const annualGen = baseAnnualGeneration * efficiencyRate;
        const monthlyAvgGen = annualGen / 12;

        // [New] PPA 또는 SMP+REC 매출 계산
        let grossRev = 0;
        if (econConfig.ppaEnabled && econConfig.ppaRate) {
            const currentPpaRate = econConfig.ppaRate * Math.pow(1 + (econConfig.ppaEscalation || 0) / 100, year - 1);
            grossRev = annualGen * currentPpaRate;
        } else {
            const revenueSMP = annualGen * econConfig.smp;
            const revenueREC = (annualGen / 1000) * econConfig.recPrice * econConfig.recWeight;
            grossRev = revenueSMP + revenueREC;
        }

        const inflationFactor = Math.pow(1 + inflation, year - 1);
        const maintenanceCost = (baseAnnualMaintenanceCost + baseAnnualLeaseCost) * inflationFactor;

        let loanPaymentThisYear = 0;
        let interestThisYear = 0;
        let principalPaymentThisYear = 0;

        if (loanAmount > 0 && remainingLoanBalance > 0 && year <= loanTerm) {
            if (year <= gracePeriod) {
                interestThisYear = remainingLoanBalance * loanRate;
                loanPaymentThisYear = interestThisYear;
            } else {
                interestThisYear = remainingLoanBalance * loanRate;
                let payment = amortizationPayment;
                if (remainingLoanBalance + interestThisYear < payment + 1) payment = remainingLoanBalance + interestThisYear;
                loanPaymentThisYear = payment;
                principalPaymentThisYear = loanPaymentThisYear - interestThisYear;
                remainingLoanBalance -= principalPaymentThisYear;
                if (remainingLoanBalance < 1) remainingLoanBalance = 0;
            }
        }

        const depreciationThisYear = year <= depPeriod ? annualDepreciation : 0;
        let taxableIncome = grossRev - maintenanceCost - interestThisYear - depreciationThisYear;
        if (taxableIncome < 0) taxableIncome = 0;

        const corporateTax = taxableIncome * taxRate;
        const netRev = grossRev - maintenanceCost - interestThisYear - principalPaymentThisYear - corporateTax;

        const prevCashFlow = cumulativeCashFlow;
        cumulativeCashFlow += netRev;
        totalNPV += netRev / Math.pow(1 + discountRate, year);

        if (!paybackFound && cumulativeCashFlow >= 0) {
            const remainingCost = -prevCashFlow;
            const fraction = netRev > 0 ? remainingCost / netRev : 0;
            paybackPeriod = (year - 1) + fraction;
            paybackFound = true;
        }

        yearlyData.push({
            year,
            efficiencyRate: efficiencyRate * 100,
            annualGeneration: Math.round(annualGen),
            monthlyAvgGeneration: Math.round(monthlyAvgGen),
            grossRevenue: Math.round(grossRev),
            maintenanceCost: Math.round(maintenanceCost),
            loanPayment: Math.round(loanPaymentThisYear),
            interestPayment: Math.round(interestThisYear),
            principalPayment: Math.round(principalPaymentThisYear),
            remainingPrincipal: Math.round(remainingLoanBalance),
            depreciation: Math.round(depreciationThisYear),
            taxableIncome: Math.round(taxableIncome),
            corporateTax: Math.round(corporateTax),
            netRevenue: Math.round(netRev),
            cumulativeCashFlow: Math.round(cumulativeCashFlow)
        });

        totalGeneration += annualGen;
        totalGrossRevenue += grossRev;
        totalMaintenanceCost += maintenanceCost;
        totalLoanInterest += interestThisYear;
        totalTax += corporateTax;
    }

    const investmentBase = equityAmount > 0 ? equityAmount : totalConstructionCost;
    const roi = investmentBase > 0 ? ((yearlyData[years - 1].cumulativeCashFlow) / investmentBase) * 100 : 0;
    const totalLifeCycleCost = totalConstructionCost + totalMaintenanceCost + totalLoanInterest + totalTax;
    const lcoe = totalGeneration > 0 ? totalLifeCycleCost / totalGeneration : 0;
    const environmentalImpact = calculateEnvironmentalImpact(totalGeneration / 1000 / 20);

    const calculateScenario = (smpMod: number, recMod: number, name: string): SensitivityResult => {
        let scenCumulative = -equityAmount;
        let scenLoanBal = loanAmount;
        for (let y = 1; y <= years; y++) {
            const deg = (econConfig.annualDegradation / 100) * (y - 1);
            const gen = baseAnnualGeneration * (1 - deg);
            const rev = (gen * econConfig.smp * smpMod) + ((gen / 1000) * econConfig.recPrice * econConfig.recWeight * recMod);
            const inf = Math.pow(1 + inflation, y - 1);
            const cost = (baseAnnualMaintenanceCost + baseAnnualLeaseCost) * inf;
            let interest = 0;
            let principal = 0;
            if (loanAmount > 0 && scenLoanBal > 0 && y <= loanTerm) {
                interest = scenLoanBal * loanRate;
                if (y > gracePeriod) {
                    let pay = amortizationPayment;
                    if (scenLoanBal + interest < pay + 1) pay = scenLoanBal + interest;
                    principal = pay - interest;
                    scenLoanBal -= principal;
                }
            }
            const dep = y <= depPeriod ? annualDepreciation : 0;
            let taxInc = rev - cost - interest - dep;
            if (taxInc < 0) taxInc = 0;
            const tax = taxInc * taxRate;
            const net = rev - cost - interest - principal - tax;
            scenCumulative += net;
        }
        return {
            scenarioName: name,
            smpVariation: (smpMod - 1) * 100,
            netProfit: Math.round(scenCumulative + equityAmount),
            roi: parseFloat((investmentBase > 0 ? (scenCumulative / investmentBase) * 100 : 0).toFixed(1)),
            paybackPeriod: 0
        };
    };

    const sensitivityAnalysis: SensitivityResult[] = [
        calculateScenario(0.9, 0.9, "비관적 시나리오 (-10%)"),
        calculateScenario(1.0, 1.0, "기준 시나리오 (Base)"),
        calculateScenario(1.1, 1.1, "낙관적 시나리오 (+10%)")
    ];

    return {
        systemCapacityKw,
        yearlyData,
        totalGeneration20y: totalGeneration / 1000,
        totalGrossRevenue,
        totalNetProfit: yearlyData[years - 1].cumulativeCashFlow,
        totalConstructionCost,
        totalLoanInterest,
        totalTax,
        roi,
        paybackPeriod: paybackFound ? paybackPeriod : 0,
        npv: totalNPV,
        lcoe: lcoe,
        clippingLossPercent: parseFloat(clippingLossPercent.toFixed(2)),
        iamLossPercent: lossFactors.iamLoss,
        monthlyGeneration: monthlyGeneration.map(v => Math.round(v)),
        monthlyAvgInsolation: monthlyAvgInsolation.map(v => parseFloat(v.toFixed(2))),
        hourlyGeneration: hourlyGeneration.map(v => parseFloat(v.toFixed(2))),
        environmentalImpact,
        sensitivityAnalysis,
        lossDiagramData: lossData,
        bessResult: bessResult.storedEnergyTotal20y > 0 ? bessResult : undefined
    };
};
