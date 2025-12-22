import { PVModule, Inverter, SystemConfig, ArrayConfiguration, SafetyCheck, TempCalculatedValues, BOMItem, CalculationResult, InverterGroup } from '../../types';
import { CABLE_RESISTIVITY, TEMP_COEFF_RESISTANCE } from './constants';

/**
 * [온도 보정 전압 계산 함수]
 * 태양광 모듈은 온도에 따라 전압이 변하므로, 최저/최고 기온에서의 전압을 예측하기 위해 사용합니다.
 * @param voltage 기준 온도(25°C)에서의 전압 (Voc 또는 Vmp)
 * @param tempCoeff 전압 온도 계수 (%/°C)
 * @param targetTemp 예측하고자 하는 대상 온도 (°C)
 * @returns 온도 보정된 전압 (V)
 */
export const calculateTempVoltage = (
    voltage: number,
    tempCoeff: number,
    targetTemp: number
): number => {
    return voltage * (1 + (tempCoeff / 100) * (targetTemp - 25));
};

/**
 * [전압 강하(Voltage Drop) 계산 함수 - 고도화]
 * 케이블의 저항으로 인해 발생하는 전압 손실을 계산합니다. 재질과 온도를 고려하여 정밀도를 높였습니다.
 * @param current 선로에 흐르는 전류 (A)
 * @param length 선로 편도 길이 (m)
 * @param crossSection 케이블 단면적 (mm²)
 * @param material 케이블 재질 ('copper' | 'aluminum')
 * @param temp 케이블 동작 온도 (°C)
 * @returns 발생 전압 강하 (V)
 */
export const calculateVoltageDrop = (
    current: number,
    length: number,
    crossSection: number,
    material: 'copper' | 'aluminum' = 'copper',
    temp: number = 70
): number => {
    if (crossSection <= 0) return 0;

    // 온도 보정된 저항률 계산: R = R0 * (1 + alpha * (T - T0))
    // T0는 기준 온도 20°C
    const baseResistivity = CABLE_RESISTIVITY[material];
    const correctedResistivity = baseResistivity * (1 + TEMP_COEFF_RESISTANCE * (temp - 20));

    // 전압 강하 (V) = (2 * L * I * rho) / A
    // DC 선로는 왕복(2배)을 고려하여 계산합니다.
    const voltageDropV = (2 * length * current * correctedResistivity) / crossSection;
    return voltageDropV;
};

/**
 * [BOM(자재명세서) 생성 함수]
 * 설계된 시스템 구성을 바탕으로 필요한 주요 자재 리스트와 상세 사양을 생성합니다.
 */
export const generateBOM = (
    module: PVModule,
    inverter: Inverter,
    config: SystemConfig,
    configuration: ArrayConfiguration,
    inverterCount: number,
    safety: SafetyCheck
): BOMItem[] => {
    const bom: BOMItem[] = [];

    // 1. 태양광 모듈 섹션
    const totalAreaM2 = (module.width * module.height * configuration.totalModules) / 1000000;
    bom.push({
        category: '주기기 (Main)',
        item: '태양광 모듈 (PV Module)',
        spec: `${module.manufacturer} ${module.model} (${module.pmax}W, 양면형 고려)`,
        qty: configuration.totalModules,
        unit: 'EA',
        remark: `총 용량 ${(configuration.totalCapacity).toFixed(2)}kW, 설치면적 약 ${Math.round(totalAreaM2)}m²`,
        details: {
            manufacturer: module.manufacturer,
            partNumber: module.model,
            dimension: `${module.width} x ${module.height} x 35 mm`,
            weight: `${module.weight} kg`,
            certification: "KS C 8561, IEC 61215, IEC 61730",
            material: "Monocrystalline PERC, Tempered Glass",
            description: "고효율 단결정 양면형 모듈. LID/PID 방지 기술 적용. 12년 제품 보증 및 25년 출력 보증."
        }
    });

    // 2. 인버터 섹션
    bom.push({
        category: '주기기 (Main)',
        item: '스트링 인버터 (Inverter)',
        spec: `${inverter.manufacturer} ${inverter.model} (${inverter.ratedOutputPower}kW, 3P ${inverter.ratedOutputVoltage}V)`,
        qty: inverterCount,
        unit: 'EA',
        remark: `효율 ${inverter.efficiency}%, MPPT ${inverter.minMpptVoltage}~${inverter.maxMpptVoltage}V`,
        details: {
            manufacturer: inverter.manufacturer,
            partNumber: inverter.model,
            dimension: "1100 x 650 x 300 mm (Approx)",
            ipRating: "IP66 (Outdoor)",
            certification: "KS C 8565, IEC 62109-1/2",
            description: "접속함 일체형 스트링 인버터. 자연 공랭식 냉각(Fanless option). RS485/Ethernet 통신 지원."
        }
    });

    // 3. 구조물 섹션
    const structWeight = Math.ceil(configuration.totalCapacity * 45); // kW당 45kg 가정
    bom.push({
        category: '구조물공사',
        item: '구조물 지지대 (Mounting Structure)',
        spec: 'PosMAC 3.0 (내식성합금도금강판), C형강/각관',
        qty: structWeight,
        unit: 'kg',
        remark: '단위중량 45kg/kW 적용 (기둥, 거더, 퍼린 포함)',
        details: {
            material: "PosMAC 3.0 (Mg-Al-Zn Alloy Coated Steel)",
            certification: "KS D 3030 (도금 부착량 K27 이상)",
            description: "내식성이 우수한 고내식 합금 도금 강판 사용. 설계 풍속 30m/s, 지진구역 I등급 기준 구조 계산 적용."
        }
    });

    bom.push({
        category: '구조물공사',
        item: '모듈 클램프 및 볼트류',
        spec: 'SUS304 Middle/End Clamp, M8 Bolt/Nut',
        qty: 1,
        unit: '식(Lot)',
        remark: '모듈 고정용 하드웨어 일체',
        details: {
            material: "Stainless Steel 304 (STS304)",
            description: "부식 방지를 위한 스테인리스 스틸 재질의 클램프, 볼트, 너트, 와셔 세트. 풀림 방지 스프링 와셔 포함."
        }
    });

    // 4. DC 전기 공사 섹션
    const totalDCCable = configuration.parallelStrings * config.cableLength * 2;
    bom.push({
        category: '전기공사 (DC)',
        item: 'DC 전용 케이블 (Solar Cable)',
        spec: `H1Z2Z2-K / F-CV ${config.cableCrossSection}mm² (1.5kV, TUV인증)`,
        qty: totalDCCable,
        unit: 'm',
        remark: `전압강하율 ${safety.voltageDrop.toFixed(2)}% 이내`,
        details: {
            certification: "TUV 2PfG 1169 / EN 50618",
            material: "Tinned Copper Conductor, XLPO Insulation",
            description: "자외선(UV) 및 오존 내성이 우수한 태양광 전용 케이블. 정격 전압 DC 1500V, 사용 온도 -40~90°C."
        }
    });

    const mc4Qty = Math.ceil(configuration.parallelStrings * 2 * 1.1); // 10% 여유
    bom.push({
        category: '전기공사 (DC)',
        item: 'DC 커넥터 (Connector)',
        spec: 'MC4 호환형 (IP68, 1500Vdc, 30A)',
        qty: mc4Qty,
        unit: 'Pair',
        remark: '스트링 양단 및 인버터 입력 결선용 (10% 여유)',
        details: {
            partNumber: "MC4-Evo2 or Equivalent",
            ipRating: "IP68 (Mated)",
            certification: "IEC 62852",
            description: "저항 손실을 최소화한 고품질 DC 커넥터. 스냅인 잠금 방식."
        }
    });

    bom.push({
        category: '전기공사 (DC)',
        item: 'DC 접속반/보호함 (Junction Box)',
        spec: 'PC/ABS 외함 (IP65), DC 개폐기 포함',
        qty: inverterCount,
        unit: '면(EA)',
        remark: '인버터 입력단 개별 차단 및 보호용',
        details: {
            ipRating: "IP65",
            dimension: "400 x 500 x 200 mm",
            description: "자외선 차단(UV Stable) PC/ABS 재질 외함. 내부 DC 개폐기 및 퓨즈 홀더 포함."
        }
    });

    // 5. 보호 계통 섹션
    bom.push({
        category: '보호설비',
        item: 'DC 서지보호기 (SPD)',
        spec: 'Type II, Imax 40kA, Up < 3.5kV (1500Vdc)',
        qty: inverterCount * 2,
        unit: 'Set',
        remark: '낙뢰 및 과전압 보호',
        details: {
            partNumber: "PV SPD Type II",
            certification: "IEC 61643-31",
            description: "Y결선 구조의 MOV 모듈 적용. 상태 표시창(Green/Red) 및 원격 신호 접점 포함."
        }
    });

    bom.push({
        category: '보호설비',
        item: 'DC 개폐기 (Switch-Disconnector)',
        spec: '1500Vdc, 250A급, 부하 개폐 가능',
        qty: inverterCount,
        unit: 'EA',
        remark: '유지보수 시 안전 확보용',
        details: {
            certification: "IEC 60947-3",
            description: "부하 개폐(Load Breaking)가 가능한 DC 스위치. 회전식 핸들 및 잠금장치(Lockable) 포함."
        }
    });

    // 6. AC 전기 공사 섹션
    bom.push({
        category: '전기공사 (AC)',
        item: '전력 케이블 (Power Cable)',
        spec: `TFR-CV 0.6/1kV 1C/3C (허용전류 계산 기반 선정)`,
        qty: inverterCount * 30, // 평균 30m 가정
        unit: 'm',
        remark: '난연성 트레이용 케이블',
        details: {
            certification: "KS C IEC 60502-1",
            material: "Annealed Copper / XLPE / PVC (Tray Flame Retardant)",
            description: "난연성 가교 폴리에틸렌 절연 비닐 시스 케이블. 트레이 포설 시 화재 확산 방지."
        }
    });

    bom.push({
        category: '전기공사 (AC)',
        item: '케이블 트레이 (Cable Tray)',
        spec: '용융아연도금 사다리형 (Ladder Type) W300~600',
        qty: Math.ceil((totalDCCable / 2 + inverterCount * 30) * 0.8),
        unit: 'm',
        remark: 'DC/AC 간선 포설용',
        details: {
            material: "Hot Dip Galvanized Steel",
            certification: "KS D 8308",
            description: "용융아연도금 처리되어 방청 성능이 우수한 사다리형 트레이. 커버 및 조인트 자재 포함."
        }
    });

    // 7. 접지 공사 섹션
    const gvLength = Math.ceil(
        (configuration.totalModules * 1.5) +
        (inverterCount * 15) +
        (inverterCount * config.cableLength)
    );

    bom.push({
        category: '접지공사',
        item: '접지선 (Earth Wire)',
        spec: 'GV 6sq (Green/Yellow) 및 GV 35sq 이상 간선',
        qty: gvLength,
        unit: 'm',
        remark: '등전위 본딩 및 기기 접지용',
        details: {
            certification: "KS C IEC 60227-3",
            description: "PVC 절연 접지용 전선. 구조물, 모듈 프레임, 인버터 외함 등전위 본딩용."
        }
    });

    bom.push({
        category: '접지공사',
        item: '접지봉 및 자재',
        spec: '동피복강봉 (14mm x 1000mm) 및 접지단자함',
        qty: Math.ceil(inverterCount * 2) + 5,
        unit: 'EA',
        remark: '통합접지 저항값 확보용',
        details: {
            description: "대지 저항 저감을 위한 접지봉 및 유지보수용 접지 단자함(Test Box). 접속 슬리브 포함."
        }
    });

    // 8. 배전반 및 계통 연계 섹션
    bom.push({
        category: '수배전반',
        item: '저압 배전반 (LV Switchgear)',
        spec: `MDB (Main Dist. Board), MCCB ${inverterCount}회로 내장`,
        qty: 1,
        unit: '면(EA)',
        remark: '옥외 자립형 (SUS/SS), 분체도장',
        details: {
            ipRating: "IP55 (Outdoor)",
            material: "Stainless Steel 304 (1.5t/2.0t)",
            description: "인버터 집합 패널. 메인 차단기(ACB/MCCB), 서지보호기, 디지털 메터, 버스바 포함. 강제 배기 팬 적용."
        }
    });

    bom.push({
        category: '수배전반',
        item: '몰드 변압기 (Transformer)',
        spec: `${Math.ceil(configuration.totalCapacity * 1.1)}kVA, 22.9kV / 380V (Dyn11)`,
        qty: 1,
        unit: '대',
        remark: '효율 관리기자재, 혼촉방지판 포함',
        details: {
            certification: "KS C 4311 (고효율)",
            description: "난연성, 자기소화성 몰드 변압기. 저손실형 코어 적용. 온도 감지 센서 포함."
        }
    });

    bom.push({
        category: '수배전반',
        item: '특고압 수배전반 (HV Panel)',
        spec: '22.9kV-y, VCB/LBS/MOF/PT/CT 포함',
        qty: 1,
        unit: '식(Set)',
        remark: '한전 연계 규정 준수',
        details: {
            description: "한전 22.9kV 계통 연계용 수배전반. 인입구 개폐기(LBS), 진공 차단기(VCB), 계량기함(MOF) 포함 3~4면 구성."
        }
    });

    bom.push({
        category: '계측/제어',
        item: '디지털 보호계전기 & 전력량계',
        spec: 'GIPAM (계통보호용), 0.5급 양방향 전력량계',
        qty: 1,
        unit: '식(Set)',
        remark: '과전압/부족전압/과전류/지락 보호',
        details: {
            partNumber: "GIPAM-2000 or equivalent",
            description: "OCR, OCGR, OVR, UVR, OVGR, POR 등 한전 연계 기술 기준에 부합하는 보호 기능 내장."
        }
    });

    // 9. 모니터링 및 통신 섹션
    bom.push({
        category: '통신/모니터링',
        item: 'RTU 및 모니터링 함체',
        spec: '산업용 PC/PLC, 일사계/온도계 포함',
        qty: 1,
        unit: '식(Set)',
        remark: 'RE100/KPX 데이터 전송 대응',
        details: {
            description: "발전 현황 로컬 저장 및 웹 서버 전송. 경사면 일사계, 모듈 온도계, 외기 온도계 센서 포함."
        }
    });

    // 10. 잡자재 및 예비품 섹션
    bom.push({
        category: '기타/잡자재',
        item: '시공 부자재 일체',
        spec: '방수 가요전선관(GW), 풀박스, 케이블 타이, 마킹 타이',
        qty: 1,
        unit: '식(Lot)',
        remark: '현장 시공 소모 자재'
    });

    bom.push({
        category: '운영 예비품',
        item: 'Spare Parts',
        spec: '예비 퓨즈, MC4 커넥터, 모듈(1%)',
        qty: Math.max(1, Math.floor(configuration.totalModules * 0.01)),
        unit: 'EA/Set',
        remark: 'O&M 필수 예비 자재',
        details: {
            description: "운영 중 파손 빈도가 높은 퓨즈, 커넥터 및 예비 모듈 확보."
        }
    });

    return bom;
};

/**
 * [입사각 수정 계수(IAM) 계산 함수]
 * 태양의 입사각에 따른 모듈 표면의 반사 손실을 계산합니다. (Ashrae 모델 기반)
 * @param angle 입사각 (degree)
 * @param b0 가중치 계수 (통상 0.05)
 * @returns IAM 보정 계수 (0~1)
 */
export const calculateIAM = (angle: number, b0: number = 0.05): number => {
    const rad = (angle * Math.PI) / 180;
    const cosTheta = Math.cos(rad);
    if (cosTheta <= 0) return 0;

    // IAM = 1 - b0 * (1/cos(theta) - 1)
    const iam = 1 - b0 * (1 / cosTheta - 1);
    return Math.max(0, Math.min(1, iam));
};

/**
 * [양면 이득(Bifacial Gain) 정밀 계산 함수]
 * 지면 반사율(Albedo)과 설치 높이를 고려하여 양면 모듈의 추가 발전량을 예측합니다.
 * @param albedo 지면 반사율 (0.1~0.9)
 * @param height 설치 높이 (m)
 * @returns 예상 양면 이득률 (%)
 */
export const calculateBifacialGain = (albedo: number = 0.2, height: number = 1.0): number => {
    // 단순화된 물리 모델: 높이가 높을수록, 알베도가 높을수록 이득 증가
    // 실제로는 뷰 팩터(View Factor) 계산이 필요함
    const heightFactor = Math.min(1.2, 0.5 + (height / 2));
    const gain = albedo * 100 * heightFactor * 0.7; // 0.7은 후면 효율 계수(Bifaciality Factor) 가정
    return parseFloat(gain.toFixed(2));
};

/**
 * [태양광 시스템 설계 메인 로직]
 * 입력된 모듈, 인버터, 설정 정보를 바탕으로 최적의 어레이 구성과 안전성 검토를 수행합니다.
 */
export const calculateSolarSystem = (
    module: PVModule,
    inverter: Inverter,
    config: SystemConfig
): CalculationResult => {

    // 1. 온도 보정 전압 산출 (최저/최고 기온 고려)
    const vocWinter = calculateTempVoltage(module.voc, module.tempCoefficients.voc, config.ambientTempWinter);
    const vocSummer = calculateTempVoltage(module.voc, module.tempCoefficients.voc, config.ambientTempSummer);
    const vmpWinterCorrected = calculateTempVoltage(module.vmp, module.tempCoefficients.voc, config.ambientTempWinter);
    const vmpSummer = calculateTempVoltage(module.vmp, module.tempCoefficients.voc, config.ambientTempSummer);

    const tempValues: TempCalculatedValues = {
        vocWinter,
        vocSummer,
        vmpSummer,
        vmpWinter: vmpWinterCorrected
    };

    // 2. 직렬 모듈 수 산정 (인버터 전압 범위 내 최적화)
    const maxSeriesByVoltage = vocWinter > 0 ? Math.floor(inverter.maxInputVoltage / vocWinter) : 0;
    const minSeriesByVoltage = vmpSummer > 0 ? Math.ceil(inverter.minMpptVoltage / vmpSummer) : 0;

    const totalModulesNeeded = module.pmax > 0 ? Math.ceil((config.targetCapacity * 1000) / module.pmax) : 0;

    let optimalSeries = maxSeriesByVoltage;
    if (optimalSeries < minSeriesByVoltage) {
        optimalSeries = 0; // 구성 불가능한 경우
    }

    // 3. 병렬 회로 수 및 시스템 용량 산정
    const parallelStrings = optimalSeries > 0 ? Math.ceil(totalModulesNeeded / optimalSeries) : 0;
    const actualTotalModules = parallelStrings * optimalSeries;

    const numInverters = inverter.ratedOutputPower > 0
        ? Math.ceil(config.targetCapacity / inverter.ratedOutputPower)
        : 0;

    // [New] 정밀 양면 이득 계산
    const calculatedBifacialGain = config.albedo !== undefined
        ? calculateBifacialGain(config.albedo, config.mountingHeight || 1.0)
        : (config.bifacialGain || 0);

    const bifacialFactor = 1 + (calculatedBifacialGain / 100);
    const totalDcCapacity = ((actualTotalModules * module.pmax) / 1000) * bifacialFactor;
    const totalAcCapacity = numInverters * inverter.ratedOutputPower;

    const dcAcRatio = totalAcCapacity > 0 ? totalDcCapacity / totalAcCapacity : 0;

    const configuration: ArrayConfiguration = {
        seriesModules: optimalSeries,
        parallelStrings: parallelStrings,
        totalModules: actualTotalModules,
        totalCapacity: totalDcCapacity
    };

    // 4. 안전성 검토 (전압 범위, 전류, 전압강하 등)
    const stringVoltageWinter = optimalSeries * vocWinter;
    const stringVoltageSummer = optimalSeries * vmpSummer;
    const stringVocSummer = optimalSeries * vocSummer;
    const stringMaxPowerVoltageWinter = optimalSeries * vmpWinterCorrected;
    const stringCurrent = module.imp;

    const vDrop = calculateVoltageDrop(
        stringCurrent,
        config.cableLength,
        config.cableCrossSection,
        config.cableMaterial || 'copper',
        config.cableTemp || 70
    );
    const stringOperatingVoltage = optimalSeries * module.vmp;
    const vDropPercent = stringOperatingVoltage > 0 ? (vDrop / stringOperatingVoltage) * 100 : 0;

    const safety: SafetyCheck = {
        isVocSafe: stringVoltageWinter < inverter.maxInputVoltage,
        isVmpMinSafe: (stringVoltageSummer - vDrop) > inverter.minMpptVoltage,
        isVmpMaxSafe: stringMaxPowerVoltageWinter < inverter.maxMpptVoltage,
        isCurrentSafe: module.isc < inverter.maxShortCircuitCurrent,
        isStartUpSafe: stringVocSummer > inverter.startUpVoltage,
        voltageDrop: vDropPercent,
        isVoltageDropSafe: vDropPercent < 3.0
    };

    // 5. BOM 생성 위임
    const bom = generateBOM(module, inverter, config, configuration, numInverters, safety);

    return {
        tempValues,
        configuration,
        safety,
        stringVoltageWinter,
        stringVoltageSummer,
        stringVocSummer,
        inverterCount: numInverters,
        dcAcRatio,
        bom
    };
};

/**
 * [설계 결과 요약 텍스트 생성기]
 * 사용자가 한눈에 설계를 이해할 수 있도록 자연어 요약을 제공합니다.
 */
export const generateConfigurationSummary = (
    module: PVModule,
    inverter: Inverter,
    configuration: ArrayConfiguration,
    inverterCount: number
): string => {
    if (configuration.seriesModules <= 0) {
        return "설정된 조건으로는 유효한 어레이를 구성할 수 없습니다. 모듈/인버터 사양 또는 목표 용량을 확인해주세요.";
    }
    return `본 시스템은 ${module.manufacturer} ${module.model} (${module.pmax}W) 모듈 ${configuration.seriesModules}매를 직렬(Series) 연결하고, 총 ${configuration.parallelStrings}개의 병렬(Parallel) 스트링으로 구성됩니다. 전체 어레이는 ${inverter.manufacturer} ${inverter.model} (${inverter.ratedOutputPower}kW) 인버터 ${inverterCount}대에 연결되어 최적의 발전 효율을 제공합니다. 모든 수익성 및 발전량 시뮬레이션은 목표 용량이 아닌, 실제 물리적 구성인 설계 용량(${configuration.totalCapacity.toFixed(2)}kW)을 기준으로 산정되었습니다.`;
}

/**
 * [인버터 그룹 배분 로직]
 * 전체 병렬 스트링을 인버터 대수에 맞춰 균등하게 배분합니다.
 */
export const calculateInverterGroups = (
    totalParallel: number,
    inverterCount: number,
    seriesModules: number,
    module: PVModule,
    inverter: Inverter,
    results: CalculationResult
): InverterGroup[] => {
    const groups: InverterGroup[] = [];

    if (inverterCount > 0 && totalParallel > 0) {
        const baseStrings = Math.floor(totalParallel / inverterCount);
        const remainder = totalParallel % inverterCount;

        // 나머지가 있는 경우 (일부 인버터에 스트링이 하나 더 연결됨)
        if (remainder > 0) {
            const gA_Strings = baseStrings + 1;
            const gA_Modules = gA_Strings * seriesModules;
            const gA_Capacity = (gA_Modules * module.pmax) / 1000;

            groups.push({
                idRange: remainder === 1 ? `Inv #1` : `Inv #1 ~ #${remainder}`,
                count: remainder,
                strings: gA_Strings,
                modules: gA_Modules,
                kw: gA_Capacity,
                current: gA_Strings * module.imp,
                dcAcRatio: (gA_Capacity / inverter.ratedOutputPower) * 100,
                voltageRange: `${results.stringVoltageSummer.toFixed(1)} ~ ${results.stringVoltageWinter.toFixed(1)}`,
                note: 'High Load'
            });
        }

        // 기본 스트링 수가 할당되는 인버터 그룹
        if (inverterCount - remainder > 0) {
            const gB_Strings = baseStrings;
            const gB_Modules = gB_Strings * seriesModules;
            const gB_Capacity = (gB_Modules * module.pmax) / 1000;

            groups.push({
                idRange: remainder > 0
                    ? (inverterCount - remainder === 1 ? `Inv #${inverterCount}` : `Inv #${remainder + 1} ~ #${inverterCount}`)
                    : (inverterCount === 1 ? `Inv #1` : `Inv #1 ~ #${inverterCount}`),
                count: inverterCount - remainder,
                strings: gB_Strings,
                modules: gB_Modules,
                kw: gB_Capacity,
                current: gB_Strings * module.imp,
                dcAcRatio: (gB_Capacity / inverter.ratedOutputPower) * 100,
                voltageRange: `${results.stringVoltageSummer.toFixed(1)} ~ ${results.stringVoltageWinter.toFixed(1)}`,
                note: remainder > 0 ? 'Normal Load' : 'Balanced'
            });
        }
    }
    return groups;
};
