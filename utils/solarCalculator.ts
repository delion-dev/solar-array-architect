
import { 
  PVModule, 
  Inverter, 
  SystemConfig, 
  CalculationResult, 
  TempCalculatedValues,
  ArrayConfiguration,
  SafetyCheck,
  EconomicConfig,
  SimulationResult,
  YearlyPrediction,
  TMYData,
  BOMItem,
  EnvironmentalImpact,
  LossFactors,
  LossChartData,
  SensitivityResult,
  InverterGroup
} from '../types';
import { DEFAULT_LOSS_FACTORS } from '../constants';

/**
 * [유틸리티: 텍스트 파일 읽기]
 */
export const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

/**
 * [온도 보정 전압 계산 함수]
 */
export const calculateTempVoltage = (
  voltage: number, 
  tempCoeff: number, 
  targetTemp: number
): number => {
  return voltage * (1 + (tempCoeff / 100) * (targetTemp - 25));
};

/**
 * [전압 강하(Voltage Drop) 계산 함수]
 */
export const calculateVoltageDrop = (
  current: number,
  length: number,
  crossSection: number
): number => {
  if (crossSection <= 0) return 0;
  const voltageDropV = (35.6 * length * current) / (1000 * crossSection);
  return voltageDropV;
};

/**
 * [BOM(자재명세서) 생성 함수]
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

  // 1. 태양광 모듈
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

  // 2. 인버터
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

  // 3. 구조물 (상세화)
  const structWeight = Math.ceil(configuration.totalCapacity * 45);
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

  // 4. DC 전기 공사
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

  const mc4Qty = Math.ceil(configuration.parallelStrings * 2 * 1.1);
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

  // 5. 보호 계통 (Protection)
  bom.push({
    category: '보호설비',
    item: 'DC 서지보호기 (SPD)',
    spec: 'Type II, Imax 40kA, Up < 3.5kV (1500Vdc)',
    qty: inverterCount * 2, // 인버터 당 입력부 2개소(예시) 보호 가정
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

  // 6. AC 전기 공사
  bom.push({
    category: '전기공사 (AC)',
    item: '전력 케이블 (Power Cable)',
    spec: `TFR-CV 0.6/1kV 1C/3C (허용전류 계산 기반 선정)`,
    qty: inverterCount * 30, 
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

  // 7. 접지 공사 (Earthing - 상세화)
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
    qty: Math.ceil(inverterCount * 2) + 5, // 인버터 개소 당 + 공통
    unit: 'EA',
    remark: '통합접지 저항값 확보용',
    details: {
      description: "대지 저항 저감을 위한 접지봉 및 유지보수용 접지 단자함(Test Box). 접속 슬리브 포함."
    }
  });

  // 8. 배전반 및 계통 연계
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

  // 9. 모니터링 및 통신
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

  // 10. 잡자재 및 예비품
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
 * [태양광 시스템 설계 메인 로직]
 */
export const calculateSolarSystem = (
  module: PVModule,
  inverter: Inverter,
  config: SystemConfig
): CalculationResult => {
  
  // 1. 온도 보정 전압 산출
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

  // 2. 직렬 모듈 수 산정
  const maxSeriesByVoltage = vocWinter > 0 ? Math.floor(inverter.maxInputVoltage / vocWinter) : 0;
  const minSeriesByVoltage = vmpSummer > 0 ? Math.ceil(inverter.minMpptVoltage / vmpSummer) : 0;
  
  const totalModulesNeeded = module.pmax > 0 ? Math.ceil((config.targetCapacity * 1000) / module.pmax) : 0;
  
  let optimalSeries = maxSeriesByVoltage;
  if (optimalSeries < minSeriesByVoltage) {
    optimalSeries = 0; 
  }

  // 3. 병렬 회로 수 및 시스템 용량 산정
  const parallelStrings = optimalSeries > 0 ? Math.ceil(totalModulesNeeded / optimalSeries) : 0;
  const actualTotalModules = parallelStrings * optimalSeries;

  const numInverters = inverter.ratedOutputPower > 0 
    ? Math.ceil(config.targetCapacity / inverter.ratedOutputPower) 
    : 0;

  const bifacialFactor = 1 + ((config.bifacialGain || 0) / 100);
  const totalDcCapacity = ((actualTotalModules * module.pmax) / 1000) * bifacialFactor;
  const totalAcCapacity = numInverters * inverter.ratedOutputPower;
  
  const dcAcRatio = totalAcCapacity > 0 ? totalDcCapacity / totalAcCapacity : 0;

  const configuration: ArrayConfiguration = {
    seriesModules: optimalSeries,
    parallelStrings: parallelStrings,
    totalModules: actualTotalModules,
    totalCapacity: totalDcCapacity
  };

  // 4. 안전성 검토
  const stringVoltageWinter = optimalSeries * vocWinter;
  const stringVoltageSummer = optimalSeries * vmpSummer;
  const stringVocSummer = optimalSeries * vocSummer;
  const stringMaxPowerVoltageWinter = optimalSeries * vmpWinterCorrected; 
  const stringCurrent = module.imp; 
  
  const vDrop = calculateVoltageDrop(stringCurrent, config.cableLength, config.cableCrossSection);
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

  // 5. BOM 생성
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
 * [TMY CSV 파싱 함수]
 */
export const parseTMYCSV = (csvText: string): TMYData[] => {
  const lines = csvText.split(/\r?\n/);
  const data: TMYData[] = [];
  
  let headerIndex = -1;
  let headers: string[] = [];
  
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const line = lines[i].trim();
    if (line.includes('년') && line.includes('월') && line.includes('일') && line.includes('시간')) {
      headerIndex = i;
      headers = line.split(',').map(h => h.trim());
      break;
    }
  }

  if (headerIndex === -1) return [];

  const idxYear = headers.findIndex(h => h.includes('년'));
  const idxMonth = headers.findIndex(h => h.includes('월'));
  const idxDay = headers.findIndex(h => h.includes('일'));
  const idxHour = headers.findIndex(h => h.includes('시간'));
  
  const idxWind = headers.findIndex(h => h.includes('풍속') && !h.includes('불확도'));
  const idxGHI = headers.findIndex(h => h.includes('전일사량') && !h.includes('불확도'));

  const idxWindUnc = headers.findIndex(h => h.includes('풍속') && h.includes('불확도'));
  const idxGHIUnc = headers.findIndex(h => h.includes('전일사량') && h.includes('불확도'));

  if (idxYear < 0 || idxMonth < 0 || idxDay < 0 || idxHour < 0 || idxGHI < 0) {
    console.error("CSV 필수 컬럼 누락");
    return [];
  }

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(',');
    
    if (cols.length < headers.length) continue;

    const tmy: TMYData = {
      year: parseInt(cols[idxYear]) || 0,
      month: parseInt(cols[idxMonth]) || 0,
      day: parseInt(cols[idxDay]) || 0,
      hour: parseInt(cols[idxHour]) || 0,
      windSpeed: parseFloat(cols[idxWind]) || 0,
      windSpeedUncertainty: idxWindUnc > -1 ? parseFloat(cols[idxWindUnc]) || 0 : 0,
      ghi: parseFloat(cols[idxGHI]) || 0,
      ghiUncertainty: idxGHIUnc > -1 ? parseFloat(cols[idxGHIUnc]) || 0 : 0
    };
    
    if (tmy.month >= 1 && tmy.month <= 12) {
      data.push(tmy);
    }
  }

  return data;
};

// 월별 일수 (평년 기준)
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * [환경적 기대효과 계산]
 */
const calculateEnvironmentalImpact = (annualGenerationMWh: number): EnvironmentalImpact => {
  const CO2_FACTOR = 0.4594; 
  const PINE_TREE_FACTOR = 0.0066;
  const OIL_TOE_FACTOR = 0.215;

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
 * [New] 상세 손실 계수(PR) 계산 및 Waterfall 데이터 생성
 */
const calculateDetailedPR = (factors: LossFactors): { finalPR: number, lossData: LossChartData[] } => {
  // 기본 값 (100% 시작)
  let currentVal = 100;
  const data: LossChartData[] = [];

  // 초기값 차트 데이터
  data.push({ name: 'Nominal', value: 100, fill: '#cbd5e1' });

  // 각 손실 요인 적용 (순차적 감쇠)
  const applyLoss = (name: string, lossPercent: number) => {
    const lossAmount = currentVal * (lossPercent / 100);
    currentVal -= lossAmount;
    data.push({ name, value: lossAmount, fill: '#ef4444', stepLabel: `-${lossPercent}%` });
  };

  applyLoss('Soiling', factors.soiling);
  applyLoss('Shading', factors.shading);
  applyLoss('Mismatch', factors.mismatch);
  applyLoss('LID', factors.lid);
  applyLoss('DC Wiring', factors.dcWiring);
  applyLoss('Inverter', 100 - factors.inverterEfficiency); // 효율 -> 손실 변환
  applyLoss('AC Wiring', factors.acWiring);
  applyLoss('Availability', factors.availability);

  // 최종 PR
  data.push({ name: 'Final PR', value: currentVal, fill: '#22c55e' });

  return { finalPR: currentVal, lossData: data };
};

/**
 * [경제성 분석 시뮬레이션 함수]
 */
export const calculateEconomics = (
  systemCapacityKw: number,
  dcAcRatio: number,
  econConfig: EconomicConfig
): SimulationResult => {
  const years = 20;
  const yearlyData: YearlyPrediction[] = [];
  
  let totalGeneration = 0;
  let totalGrossRevenue = 0;
  let totalMaintenanceCost = 0;
  let totalLoanInterest = 0;
  let totalTax = 0;

  // 1. 초기 투자비 (CAPEX)
  const totalConstructionCost = systemCapacityKw * econConfig.installationCostPerKw;
  
  // 2. 자금 조달 계획
  const equityRatio = (econConfig.equityPercent ?? 100) / 100;
  const equityAmount = totalConstructionCost * equityRatio;
  const loanAmount = totalConstructionCost * (1 - equityRatio);
  const loanRate = (econConfig.loanInterestRate ?? 0) / 100;
  const loanTerm = econConfig.loanTerm ?? 0;
  const gracePeriod = econConfig.loanGracePeriod ?? 0;

  // 3. 세무 설정
  const taxRate = (econConfig.corporateTaxRate ?? 0) / 100;
  const depPeriod = econConfig.depreciationPeriod ?? 20;
  const annualDepreciation = depPeriod > 0 ? totalConstructionCost / depPeriod : 0;

  // 4. 물가상승률
  const inflation = (econConfig.inflationRate ?? 0) / 100;

  // 상환 기간 및 금액
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

  // [New] 상세 손실 계수 적용 로직
  const lossFactors = econConfig.lossFactors || DEFAULT_LOSS_FACTORS;
  const { lossData } = calculateDetailedPR(lossFactors);
  
  // IMPORTANT: 사용자 입력 종합 효율을 최우선 적용 (상세 손실 계수는 차트용으로만 사용)
  const systemEfficiencyFactor = econConfig.systemEfficiency / 100;

  // 운영비
  const baseAnnualMaintenanceCost = systemCapacityKw * econConfig.maintenanceCostPerKw;
  const baseAnnualLeaseCost = systemCapacityKw * econConfig.leaseCostPerKw;

  // 피크 컷 (Clipping Loss) - 완전 제거 (0% 손실 고정)
  const clippingLossPercent = 0;
  const clippingFactor = 1.0; 

  // --- 발전량 계산 전략 ---
  let baseAnnualGeneration = 0;
  const monthlyGeneration = new Array(12).fill(0);
  const hourlyGeneration = new Array(24).fill(0);
  let monthlyAvgInsolation = new Array(12).fill(0);

  if (econConfig.analysisMode === 'detailed' && econConfig.tmyData && econConfig.tmyData.length > 8000) {
    const tmy = econConfig.tmyData;
    let hourlyCount = new Array(24).fill(0);
    let monthlyGHISum = new Array(12).fill(0);

    tmy.forEach(record => {
      // ClippingFactor(1.0) 적용
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
    for(let h=0; h<24; h++) if (hourlyCount[h] > 0) hourlyGeneration[h] = hourlyGeneration[h] / 365;
    baseAnnualGeneration = monthlyGeneration.reduce((a, b) => a + b, 0);

  } else if (econConfig.analysisMode === 'detailed' && econConfig.monthlyInsolation.length === 12) {
    monthlyAvgInsolation = [...econConfig.monthlyInsolation];
    econConfig.monthlyInsolation.forEach((hours, idx) => {
       // ClippingFactor(1.0) 적용
       const monthlyGen = systemCapacityKw * hours * DAYS_IN_MONTH[idx] * systemEfficiencyFactor * clippingFactor;
       monthlyGeneration[idx] = monthlyGen;
    });
    baseAnnualGeneration = monthlyGeneration.reduce((a, b) => a + b, 0);
    for(let h=6; h<=19; h++) {
       const bellCurve = Math.sin(((h - 6) / 13) * Math.PI); 
       hourlyGeneration[h] = (baseAnnualGeneration / 365) * (bellCurve / 8); 
    }
  } else {
    monthlyAvgInsolation = new Array(12).fill(econConfig.dailyInsolation);
    // ClippingFactor(1.0) 적용
    baseAnnualGeneration = systemCapacityKw * econConfig.dailyInsolation * 365 * systemEfficiencyFactor * clippingFactor;
    monthlyGeneration.forEach((_, idx) => {
       monthlyGeneration[idx] = (baseAnnualGeneration / 365) * DAYS_IN_MONTH[idx];
    });
  }

  // --- 20년 현금 흐름 분석 루프 ---
  let remainingLoanBalance = loanAmount;
  
  // NPV 계산을 위한 할인율 (Discount Rate)
  // 대출 이자율을 할인율의 대용치로 사용하거나, 기본 4.5% 사회적 할인율 적용
  const discountRate = loanRate > 0 ? loanRate : 0.045;
  let totalNPV = -equityAmount; // 초기 투자비(자기자본)는 음수(-)로 시작

  for (let year = 1; year <= years; year++) {
    const degradationRate = (econConfig.annualDegradation / 100) * (year - 1);
    const efficiencyRate = 1 - degradationRate;

    // ClippingFactor는 위에서 이미 반영되었거나(월별/시간별), 여기서 적용 (연간 기본값)
    // baseAnnualGeneration에 이미 clippingFactor(1.0)이 포함되어 있다면 중복 적용 안함.
    // 하지만 위 로직상 baseAnnualGeneration 계산 시 clippingFactor를 곱했으므로, 
    // 여기서는 efficiencyRate만 곱하면 됨.
    const annualGen = baseAnnualGeneration * efficiencyRate; 
    const monthlyAvgGen = annualGen / 12;

    const revenueSMP = annualGen * econConfig.smp; 
    const revenueREC = (annualGen / 1000) * econConfig.recPrice * econConfig.recWeight; 
    const grossRev = revenueSMP + revenueREC;

    const inflationFactor = Math.pow(1 + inflation, year - 1);
    const maintenanceCost = (baseAnnualMaintenanceCost + baseAnnualLeaseCost) * inflationFactor;
    
    let loanPaymentThisYear = 0;
    let interestThisYear = 0;
    let principalPaymentThisYear = 0;

    if (loanAmount > 0 && remainingLoanBalance > 0 && year <= loanTerm) {
      if (year <= gracePeriod) {
        interestThisYear = remainingLoanBalance * loanRate;
        principalPaymentThisYear = 0;
        loanPaymentThisYear = interestThisYear;
      } else {
        interestThisYear = remainingLoanBalance * loanRate;
        let payment = amortizationPayment;
        if (remainingLoanBalance + interestThisYear < payment + 1) {
           payment = remainingLoanBalance + interestThisYear;
        }
        loanPaymentThisYear = payment;
        principalPaymentThisYear = loanPaymentThisYear - interestThisYear;
        remainingLoanBalance -= principalPaymentThisYear;
        if (remainingLoanBalance < 1) remainingLoanBalance = 0;
      }
    } else {
      loanPaymentThisYear = 0;
      interestThisYear = 0;
      principalPaymentThisYear = 0;
      if (year > loanTerm) remainingLoanBalance = 0;
    }

    const depreciationThisYear = year <= depPeriod ? annualDepreciation : 0;
    let taxableIncome = grossRev - maintenanceCost - interestThisYear - depreciationThisYear;
    if (taxableIncome < 0) taxableIncome = 0;

    const corporateTax = taxableIncome * taxRate;
    const netRev = grossRev - maintenanceCost - interestThisYear - principalPaymentThisYear - corporateTax;

    const prevCashFlow = cumulativeCashFlow;
    cumulativeCashFlow += netRev;

    // NPV 누적 계산 (현금흐름 / (1+r)^n)
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

  // ROI 계산
  const totalNetProfit = cumulativeCashFlow + equityAmount; 
  const investmentBase = equityAmount > 0 ? equityAmount : totalConstructionCost;
  const roi = investmentBase > 0 
    ? ((yearlyData[years-1].cumulativeCashFlow) / investmentBase) * 100 
    : 0;

  // LCOE 계산 (Levelized Cost of Energy)
  // LCOE = (초기투자비 + 20년 운영비 + 금융비용) / 20년 총 발전량
  // 단순화된 LCOE 모델 사용 (할인율 미적용 명목 LCOE)
  const totalLifeCycleCost = totalConstructionCost + totalMaintenanceCost + totalLoanInterest + totalTax;
  const lcoe = totalGeneration > 0 ? totalLifeCycleCost / totalGeneration : 0;

  const environmentalImpact = calculateEnvironmentalImpact(totalGeneration / 1000 / 20);

  // [New] 민감도 분석 (Sensitivity Analysis) Logic
  const calculateScenario = (smpMod: number, recMod: number, name: string): SensitivityResult => {
    let scenCumulative = -equityAmount;
    let scenLoanBal = loanAmount;
    
    for (let y = 1; y <= years; y++) {
       const deg = (econConfig.annualDegradation / 100) * (y - 1);
       const gen = baseAnnualGeneration * (1 - deg); // clippingFactor is 1.0
       
       const rev = (gen * econConfig.smp * smpMod) + ((gen/1000) * econConfig.recPrice * econConfig.recWeight * recMod);
       const inf = Math.pow(1 + inflation, y - 1);
       const cost = (baseAnnualMaintenanceCost + baseAnnualLeaseCost) * inf;
       
       let interest = 0; 
       let principal = 0;
       
       if (loanAmount > 0 && scenLoanBal > 0 && y <= loanTerm) {
          if (y <= gracePeriod) {
             interest = scenLoanBal * loanRate;
          } else {
             interest = scenLoanBal * loanRate;
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
    
    const scenProfit = scenCumulative + equityAmount;
    const scenRoi = investmentBase > 0 ? (scenCumulative / investmentBase) * 100 : 0;
    
    return {
       scenarioName: name,
       smpVariation: (smpMod - 1) * 100,
       netProfit: Math.round(scenProfit),
       roi: parseFloat(scenRoi.toFixed(1)),
       paybackPeriod: 0 
    };
  };

  const sensitivityAnalysis: SensitivityResult[] = [
    calculateScenario(0.9, 0.9, "Pessimistic (-10%)"),
    calculateScenario(1.0, 1.0, "Base Case"),
    calculateScenario(1.1, 1.1, "Optimistic (+10%)")
  ];

  return {
    yearlyData,
    totalGeneration20y: totalGeneration / 1000,
    totalGrossRevenue,
    totalNetProfit: yearlyData[years-1].cumulativeCashFlow,
    totalConstructionCost,
    totalLoanInterest,
    totalTax,
    roi,
    paybackPeriod: paybackFound ? paybackPeriod : 0,
    npv: totalNPV, // New Field
    lcoe: lcoe, // New Field
    clippingLossPercent: parseFloat(clippingLossPercent.toFixed(2)),
    monthlyGeneration: monthlyGeneration.map(v => Math.round(v)),
    monthlyAvgInsolation: monthlyAvgInsolation.map(v => parseFloat(v.toFixed(2))),
    hourlyGeneration: hourlyGeneration.map(v => parseFloat(v.toFixed(2))),
    environmentalImpact,
    sensitivityAnalysis,
    lossDiagramData: lossData
  };
};

/**
 * [설계 결과 요약 텍스트 생성기]
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
  return `본 시스템은 ${module.manufacturer} ${module.model} (${module.pmax}W) 모듈 ${configuration.seriesModules}매를 직렬(Series) 연결하고, 총 ${configuration.parallelStrings}개의 병렬(Parallel) 스트링으로 구성됩니다. 전체 어레이는 ${inverter.manufacturer} ${inverter.model} (${inverter.ratedOutputPower}kW) 인버터 ${inverterCount}대에 연결되어 최적의 발전 효율을 제공합니다.`;
}

/**
 * [NEW] 인버터 그룹 배분 로직 (Centralized Logic)
 * 총 스트링 수를 인버터 수로 나누어 정수로 할당 (나머지 처리)하여 실제 시공 가능한 그룹을 생성합니다.
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
    const baseStrings = Math.floor(totalParallel / inverterCount); // 몫
    const remainder = totalParallel % inverterCount; // 나머지

    // 1. Group A (나머지만큼의 인버터는 1스트링 더 받음 - High Load)
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

    // 2. Group B (나머지 인버터는 기본 스트링 받음 - Normal Load)
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
