
/**
 * Solar PV Domain Types
 * 태양광 발전 시스템 도메인 타입 정의
 */

/**
 * 온도 계수 (Temperature Coefficients)
 * 온도가 1°C 변할 때마다 모듈의 전기적 특성이 얼마나 변하는지를 나타냄.
 */
export interface TempCoefficients {
  voc: number; // 개방 전압 온도 계수 (%/°C) - 통상 음수 (온도 상승 시 전압 하강)
  pmax: number; // 최대 출력 온도 계수 (%/°C) - 통상 음수 (온도 상승 시 출력 저하)
  isc: number; // 단락 전류 온도 계수 (%/°C) - 통상 양수 (온도 상승 시 전류 미세 상승)
}

/**
 * 태양광 모듈 (PV Module) 사양
 * 제조사 데이터시트(Datasheet)에 기재된 표준 시험 조건(STC) 기준 데이터
 */
export interface PVModule {
  manufacturer: string; // 제조사 (예: Hanwha Q CELLS)
  model: string; // 모델명
  pmax: number; // 최대 출력 (W) - STC 기준
  voc: number; // 개방 전압 (V) - Open Circuit Voltage
  isc: number; // 단락 전류 (A) - Short Circuit Current
  vmp: number; // 최대 출력 동작 전압 (V) - Voltage at Max Power
  imp: number; // 최대 출력 동작 전류 (A) - Current at Max Power
  efficiency: number; // 모듈 효율 (%)
  tempCoefficients: TempCoefficients; // 온도 계수 객체
  width: number; // 모듈 가로 폭 (mm)
  height: number; // 모듈 세로 높이 (mm)
  weight: number; // 모듈 무게 (kg)
  imageUrl?: string; // 모듈 이미지 URL (보고서용)
}

/**
 * 인버터 (Inverter) 사양
 * DC 전력을 AC 전력으로 변환하는 장치의 스펙
 */
export interface Inverter {
  manufacturer: string; // 제조사
  model: string; // 모델명
  maxInputVoltage: number; // 최대 입력 허용 전압 (V) - 초과 시 장비 파손 위험
  minMpptVoltage: number; // MPPT 제어 최저 전압 (V) - 이 전압 이하에서는 효율 저하 또는 발전 정지
  maxMpptVoltage: number; // MPPT 제어 최고 전압 (V)
  startUpVoltage: number; // 기동 전압 (V) - 아침에 발전이 시작되기 위한 최소 전압
  maxInputCurrent: number; // MPPT 당 최대 입력 전류 (A)
  maxShortCircuitCurrent: number; // 최대 단락 전류 (A) - 안전 허용 한계
  ratedOutputPower: number; // 정격 출력 (kW) - AC 측 기준
  maxOutputPower: number; // 최대 출력 (kW)
  ratedOutputVoltage: number; // 정격 출력 전압 (V) - AC 3상 380V 등
  efficiency: number; // 변환 효율 (%)
  mpptCount: number; // MPPT 트래커 개수
  imageUrl?: string; // 인버터 이미지 URL (보고서용)
}

/**
 * [New] BESS (Battery Energy Storage System) 설정
 */
export interface BessConfig {
  enabled: boolean;
  capacityKwh: number; // 배터리 용량 (kWh)
  powerKw: number; // 충방전 출력 (kW)
  efficiency: number; // 충방전 효율 (%) - 통상 85~95%
  dod: number; // 방전 심도 (Depth of Discharge, %) - 통상 80~95%
  costPerKwh: number; // kWh당 배터리 설치 단가 (원)
  cyclesPerYear: number; // 연간 충방전 횟수 (기본 350회)
}

/**
 * [New] BESS 시뮬레이션 결과
 */
export interface BessResult {
  storedEnergyTotal20y: number; // 20년간 총 충전량 (MWh)
  dischargedEnergyTotal20y: number; // 20년간 총 방전량 (MWh)
  selfConsumptionIncrease: number; // 자가소비율 증가분 (%)
  peakShavingBenefit: number; // 피크 컷 편익 (원)
  bessCapex: number; // 배터리 투자비 (원)
}

/**
 * 시스템 설계 설정 (System Configuration)
 * 사용자가 입력하는 설치 환경 및 설계 목표값
 */
export interface SystemConfig {
  name?: string; // 설정 이름 (프리셋 저장용)
  targetCapacity: number; // 목표 설치 용량 (kW)
  cableLength: number; // DC 케이블 길이 (m) - 전압 강하 계산용
  cableCrossSection: number; // 케이블 단면적 (mm2) - 전압 강하 계산용
  cableMaterial?: 'copper' | 'aluminum'; // [New] 케이블 재질 (기본: copper)
  cableTemp?: number; // [New] 케이블 동작 온도 (°C) - 전압 강하 보정용 (기본 70°C)
  ambientTempWinter: number; // 겨울철 최저 주변 온도 (°C) - Voc 상승 계산용 (기본 -10°C)
  ambientTempSummer: number; // 여름철 모듈 표면 온도 (°C) - 전압 강하 및 기동 전압 체크용 (기본 70°C)
  bifacialGain?: number; // 양면 모듈 이득률 (%) - 기본 0%
  albedo?: number; // [New] 지면 반사율 (Albedo) - 0.1~0.9 (기본 0.2)
  mountingHeight?: number; // [New] 설치 높이 (m) - 양면 이득 계산용 (기본 1.0m)
  bess?: BessConfig; // [New] 배터리 저장 장치 설정
}

/**
 * 온도 보정 계산 값 (Temperature Calculated Values)
 * 설계 온도 조건에 따라 변환된 전압 값들
 */
export interface TempCalculatedValues {
  vocWinter: number; // 겨울철 최저 온도에서의 개방 전압 (인버터 파손 방지용)
  vocSummer: number; // 여름철 최고 온도에서의 개방 전압 (인버터 기동 전압 체크용)
  vmpSummer: number; // 여름철 최고 온도에서의 동작 전압 (MPPT 최저 범위 체크용)
  vmpWinter: number; // 겨울철 최저 온도에서의 동작 전압 (MPPT 최고 범위 체크용)
}

/**
 * 어레이 구성 정보 (Array Configuration)
 * 계산된 직/병렬 설계 결과
 */
export interface ArrayConfiguration {
  seriesModules: number; // 스트링 당 직렬 모듈 수
  parallelStrings: number; // 총 병렬 스트링 수
  totalModules: number; // 총 모듈 수량 (직렬 x 병렬)
  totalCapacity: number; // 총 설비 용량 (kW) - DC 기준 (양면 이득 미반영 명목 용량)
}

/**
 * 안전성 검토 결과 (Safety Check)
 * 전기설비기술기준 및 인버터 매칭 적합성 여부
 */
export interface SafetyCheck {
  isVocSafe: boolean; // 겨울철 Voc가 인버터 최대 입력 전압보다 낮은가?
  isVmpMinSafe: boolean; // 여름철 Vmp(전압강하 포함)가 인버터 최저 MPPT 전압보다 높은가?
  isVmpMaxSafe: boolean; // 겨울철 Vmp가 인버터 최대 MPPT 전압보다 낮은가?
  isCurrentSafe: boolean; // 모듈 단락 전류가 인버터 허용 전류 이내인가?
  isStartUpSafe: boolean; // 여름철 Voc가 인버터 기동 전압보다 높은가?
  voltageDrop: number; // DC 케이블 전압 강하율 (%)
  isVoltageDropSafe: boolean; // 전압 강하율이 허용치(통상 3%) 이내인가?
}

/**
 * 인버터 그룹 정보 (Inverter Group Schedule)
 * 인버터별 부하 분배(Load Balancing) 계산 결과
 */
export interface InverterGroup {
  idRange: string; // 인버터 ID 범위 (예: "Inv #1 ~ #5")
  count: number; // 해당 그룹의 인버터 수량
  strings: number; // 인버터 당 연결된 스트링 수 (Parallel)
  modules: number; // 인버터 당 총 모듈 수
  kw: number; // 인버터 당 DC 용량 (kW)
  current: number; // 인버터 당 입력 전류 (A)
  dcAcRatio: number; // DC/AC 비율 (%)
  voltageRange: string; // 입력 전압 범위 (Min ~ Max V)
  note: string; // 비고 (High Load / Normal Load)
}

/**
 * 자재 상세 스펙 (BOM Detail Specification)
 * 클릭 시 모달에서 보여줄 상세 정보
 */
export interface BOMDetail {
  partNumber?: string; // 구체적인 파트 넘버
  manufacturer?: string; // 제조사
  certification?: string; // 인증 정보 (KS, TUV, UL 등)
  dimension?: string; // 크기/치수
  material?: string; // 재질
  weight?: string; // 중량
  ipRating?: string; // 방수/방진 등급
  description?: string; // 상세 설명
}

/**
 * 자재명세서 아이템 (Bill of Materials Item)
 * 기술적 검토 결과를 바탕으로 산출된 주요 기자재 내역
 */
export interface BOMItem {
  category: string; // 분류 (모듈, 인버터, 전선, 수배전반 등)
  item: string; // 품목명
  spec: string; // 규격/사양
  qty: number | string; // 수량
  unit: string; // 단위 (EA, Set, m, Lot)
  remark?: string; // 비고
  details?: BOMDetail; // 상세 스펙 (Modal용)
}

/**
 * 최종 계산 결과 통합 객체
 */
export interface CalculationResult {
  tempValues: TempCalculatedValues; // 온도 보정 전압 데이터
  configuration: ArrayConfiguration; // 어레이 구성 데이터
  safety: SafetyCheck; // 안전성 판정 데이터
  stringVoltageWinter: number; // 겨울철 스트링 최고 전압 (V)
  stringVoltageSummer: number; // 여름철 스트링 최저 동작 전압 (V)
  stringVocSummer: number; // 여름철 스트링 개방 전압 (V) - 기동 체크용
  inverterCount: number; // 필요 인버터 수량
  dcAcRatio: number; // DC/AC 비율 (과부하율) - 통상 105~120% 설계
  bom: BOMItem[]; // 주요 자재 명세서 (BOM)
}

// --- 경제성 분석 관련 타입 (Economic Analysis Types) ---

/**
 * TMY (Typical Meteorological Year) 시간별 데이터 구조
 */
export interface TMYData {
  year: number;
  month: number;
  day: number;
  hour: number;
  windSpeed: number; // m/s
  windSpeedUncertainty?: number; // m/s (풍속 불확도)
  ghi: number; // Global Horizontal Irradiance (Wh/m2 or W/m2)
  ghiUncertainty?: number; // Wh/m2 (전일사량 불확도)
}

/**
 * [New] 상세 손실 계수 (Detailed Loss Factors)
 * 시스템 종합 효율(PR)을 구성하는 세부 손실 인자들 (%)
 */
export interface LossFactors {
  soiling: number; // 오염 손실 (먼지, 눈 등) - 통상 1~2%
  shading: number; // 음영 손실 (주변 지형지물) - 통상 0.5~3%
  iamLoss: number; // [New] 입사각 수정 계수(IAM) 손실 - 통상 1.5~3%
  mismatch: number; // 모듈 특성 불일치 손실 - 통상 1~2%
  lid: number; // 초기 광열화 (LID) - 통상 0.5~1.5%
  dcWiring: number; // DC 배선 저항 손실 - 통상 1~1.5%
  acWiring: number; // AC 배선 저항 손실 - 통상 0.5~1%
  inverterEfficiency: number; // 인버터 변환 손실 (100 - 효율) - 자동 계산됨
  availability: number; // 시스템 가동률 손실 (고장, 정전) - 통상 0.5~1%
  systemEfficiency?: number; // (계산됨) 최종 종합 효율
}

/**
 * 경제성 분석 설정 값
 */
export interface EconomicConfig {
  name?: string; // 설정 이름
  analysisMode: 'basic' | 'detailed'; // 분석 모드: 기본(연평균) vs 상세(월별/TMY)
  dailyInsolation: number; // 일평균 발전 시간 (시간/일) - 기본 모드용
  monthlyInsolation: number[]; // 월별 일평균 발전 시간 (1월~12월) - 상세 모드(수기)용
  tmyData?: TMYData[]; // TMY 시간별 데이터 (CSV 업로드) - 상세 모드(자동)용

  systemEfficiency: number; // 종합 시스템 효율 (PR) - 기존 단순 입력값 (Legacy)
  lossFactors?: LossFactors; // [New] 상세 손실 계수 (고도화)
  clippingLoss?: number; // [New] 과설계(Peak Cut) 손실률 (%) - 기본 0%

  annualDegradation: number; // 연간 모듈 효율 감소율 (%)
  smp: number; // 계통 한계 가격 (SMP) - 원/kWh
  recPrice: number; // 신재생 에너지 공급 인증서 가격 (REC) - 원/REC
  recWeight: number; // REC 가중치 (예: 건축물 1.5, 일반부지 1.0)

  // [New] 글로벌 재무 모델
  ppaEnabled?: boolean; // PPA(전력판매계약) 사용 여부
  ppaRate?: number; // PPA 단가 (원/kWh)
  ppaEscalation?: number; // PPA 단가 연간 상승률 (%)
  itcPercent?: number; // [New] 투자 세액 공제 (Investment Tax Credit, %) - 예: 미국 30%

  // 비용 요소 (Cost Factors)
  installationCostPerKw: number; // kW당 시공 단가 (원) - CAPEX
  maintenanceCostPerKw: number; // kW당 연간 유지보수비 (원) - OPEX
  leaseCostPerKw: number; // kW당 연간 부지 임대료 (원) - OPEX
  inflationRate?: number; // 물가상승률 (%) - 매년 비용 인상분 반영 (New)
  vatIncluded: boolean; // 부가세 포함 여부 (사업성 검토 시 보통 별도)

  // 금융 요소 (Financial Factors)
  equityPercent?: number; // 자기자본비율 (%) - 기본 100%
  loanInterestRate?: number; // 대출 이자율 (%)
  loanTerm?: number; // 대출 기간 (년)
  loanGracePeriod?: number; // 대출 거치 기간 (년) - 이자만 납부하는 기간
  discountRate?: number; // [New] 할인율 (%) - NPV 계산용 (기본 4.5%)

  // 세무 요소 (Tax & Depreciation)
  corporateTaxRate?: number; // 법인세율 (%) - 지방세 포함 (예: 11%, 22%)
  depreciationPeriod?: number; // 감가상각 기간 (년) - 통상 15~20년
  bess?: BessConfig; // [New] 배터리 저장 장치 설정 (경제성 분석용)
}

/**
 * 연도별 예상 데이터 (Yearly Prediction)
 */
export interface YearlyPrediction {
  year: number; // 연차 (1~20년)
  efficiencyRate: number; // 해당 연도 모듈 효율 유지율 (%)
  annualGeneration: number; // 연간 발전량 (kWh)
  monthlyAvgGeneration: number; // 월 평균 발전량 (kWh)
  grossRevenue: number; // 총 매출 (SMP + REC 수익)
  maintenanceCost: number; // 총 운영비 (유지보수비 + 임대료)

  // 금융
  loanPayment?: number; // 대출 원리금 상환액 (금융비용 + 원금)
  interestPayment?: number; // 대출 이자 비용 (원)
  principalPayment?: number; // 대출 원금 상환액 (원)
  remainingPrincipal?: number; // 기말 대출 잔액 (원)

  // 세무
  depreciation?: number; // 감가상각비 (비현금성 비용)
  taxableIncome?: number; // 과세표준 (매출 - 운영비 - 이자 - 감가상각)
  corporateTax?: number; // 법인세 (원)

  netRevenue: number; // 세후 순이익 (Net Cash Flow after Tax & Debt Service)
  cumulativeCashFlow: number; // 누적 현금 흐름 (초기 투자비 회수 추적용)
}

/**
 * 환경적 기대효과 (Environmental Impact)
 */
export interface EnvironmentalImpact {
  co2Reduction: number; // 온실가스 감축량 (tCO2/년)
  pineTreesPlanted: number; // 소나무 식재 효과 (그루)
  oilSubstitution: number; // 원유 대체 효과 (TOE)
}

/**
 * [New] 민감도 분석 결과 (Sensitivity Analysis Result)
 * SMP/REC 가격 변동에 따른 경제성 지표 변화
 */
export interface SensitivityResult {
  scenarioName: string; // 시나리오명 (Base, Optimistic, Pessimistic)
  smpVariation: number; // SMP 변동률 (%)
  netProfit: number; // 총 순이익
  roi: number; // 투자수익률
  paybackPeriod: number; // 회수기간
}

/**
 * [New] 상세 손실 차트 데이터 (Waterfall Chart Data)
 */
export interface LossChartData {
  name: string;
  value: number; // kWh 또는 %
  fill: string;
  stepLabel?: string;
}

/**
 * 경제성 시뮬레이션 최종 결과
 */
export interface SimulationResult {
  systemCapacityKw: number; // 설계 용량 (kW) - 실제 물리적 구성 기반
  yearlyData: YearlyPrediction[]; // 20년치 상세 데이터 배열
  totalGeneration20y: number; // 20년 총 발전량 (MWh)
  totalGrossRevenue: number; // 20년 총 매출 (원)
  totalNetProfit: number; // 20년 총 순이익 (원)
  totalConstructionCost: number; // 초기 총 공사비 (원) - 자기자본 + 대출금
  totalLoanInterest?: number; // 총 대출 이자 비용 (원)
  totalTax?: number; // 총 납부 세금 (원)
  roi: number; // 투자 수익률 (%) - Return on Investment (or ROE)
  paybackPeriod: number; // 자본 회수 기간 (년) - Payback Period

  // [New] 고급 재무 지표 (Advanced Financial Metrics)
  npv: number; // 순현재가치 (Net Present Value)
  lcoe: number; // 균등화 발전원가 (Levelized Cost of Energy)

  clippingLossPercent: number; // 과설계(Peak Cut)로 인한 손실율 (%)
  iamLossPercent: number; // [New] 입사각 수정 계수(IAM)로 인한 손실율 (%)

  // 상세 분석 결과
  monthlyGeneration?: number[]; // [상세모드] 1월~12월 발전량 합계 (kWh)
  monthlyAvgInsolation?: number[]; // [상세모드] 1월~12월 일평균 일사량 (hr/day)
  hourlyGeneration?: number[]; // [상세모드] 0시~23시 평균 발전 패턴 (kWh)

  // 환경 분석 결과 (ESG)
  environmentalImpact: EnvironmentalImpact;

  // [New] 고도화 분석 결과
  sensitivityAnalysis: SensitivityResult[]; // 민감도 분석 결과 배열
  lossDiagramData: LossChartData[]; // 손실 다이어그램 데이터
  bessResult?: BessResult; // [New] 배터리 시뮬레이션 결과
}
