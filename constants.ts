
import { PVModule, Inverter, SystemConfig, EconomicConfig, LossFactors } from './types';

// Hanwha Q CELLS Module Data
// 참고: 큐셀 Q.PEAK DUO XL-G11.7 / BFG 585W (양면형 모듈 데이터 예시)
export const HANWHA_MODULE: PVModule = {
  manufacturer: "Hanwha Q CELLS",
  model: "Q.PEAK DUO XL-G11.7 585",
  pmax: 585, // 최대 출력 585W
  voc: 53.68, // 개방 전압
  isc: 13.95, // 단락 전류
  vmp: 44.88, // 동작 전압
  imp: 13.04, // 동작 전류
  efficiency: 21.7, // 효율
  tempCoefficients: {
    voc: -0.26, // 온도가 1도 오를 때마다 전압이 0.26% 감소
    pmax: -0.34, // 온도가 1도 오를 때마다 출력이 0.34% 감소
    isc: 0.04   // 온도가 1도 오를 때마다 전류가 0.04% 증가
  },
  width: 1134,
  height: 2416,
  weight: 30.7,
  imageUrl: "https://placehold.co/150x240/e2e8f0/1e293b?text=Q.PEAK+DUO"
};

export const DEFAULT_MODULE = HANWHA_MODULE;

// Hanwha Q.VOLT Inverter Data
// 참고: 상업용 100kW급 스트링 인버터 예시
export const HANWHA_INVERTER: Inverter = {
  manufacturer: "Hanwha Q CELLS",
  model: "Q.VOLT P100K",
  maxInputVoltage: 1100, // 최대 입력 1100V
  minMpptVoltage: 200,   // MPPT 동작 범위 최소
  maxMpptVoltage: 1000,  // MPPT 동작 범위 최대
  startUpVoltage: 250,   // 기동 시작 전압
  maxInputCurrent: 26, // MPPT 당 최대 입력 전류
  maxShortCircuitCurrent: 40, // MPPT 당 최대 단락 전류
  ratedOutputPower: 100, // 정격 출력 100kW
  maxOutputPower: 110,   // 최대 출력 110kW
  ratedOutputVoltage: 380, // AC 출력 전압 (3상)
  efficiency: 98.7, // 최대 효율
  mpptCount: 10, // MPPT 트래커 수 (보통 100kW급은 9~10개)
  imageUrl: "https://placehold.co/200x200/f1f5f9/334155?text=Q.VOLT+Inverter"
};

export const DEFAULT_INVERTER = HANWHA_INVERTER;

// 기본 시스템 설계 설정 (Default System Config)
export const DEFAULT_CONFIG: SystemConfig = {
  name: "표준 상업용 설정 (500kW)",
  targetCapacity: 500, // 500kW 발전소 기준
  cableLength: 50, // 인버터~모듈 간 케이블 길이 50m 가정
  cableCrossSection: 6, // 케이블 굵기 6sq (mm2)
  ambientTempWinter: -10, // 한국 겨울철 최저 기온 가정 (-10도)
  ambientTempSummer: 70, // 한국 여름철 모듈 표면 온도 가정 (70도 - 대기온도보다 높음)
  bifacialGain: 0, // 양면 모듈 이득 없음
  albedo: 0.2, // [New] 일반 대지 반사율
  mountingHeight: 1.0 // [New] 표준 설치 높이
};

// 월별 TMY 일사량 기본값 (한국 평균 근사치)
// 1월~12월 순서
export const DEFAULT_MONTHLY_INSOLATION = [
  2.8, // 1월
  3.2, // 2월
  3.8, // 3월
  4.2, // 4월
  4.5, // 5월
  4.2, // 6월 (장마 영향)
  3.5, // 7월 (장마 영향)
  3.8, // 8월
  3.6, // 9월
  3.5, // 10월
  2.9, // 11월
  2.7  // 12월
];

// [New] 기본 상세 손실 계수 (Default Loss Factors)
export const DEFAULT_LOSS_FACTORS: LossFactors = {
  soiling: 2.0, // 오염 손실
  shading: 1.0, // 음영 손실
  iamLoss: 2.0, // [New] 입사각 수정 계수 손실
  mismatch: 1.5, // 모듈 불일치
  lid: 1.0, // 초기 광열화
  dcWiring: 1.5, // DC 배선
  acWiring: 0.8, // AC 배선
  inverterEfficiency: 1.3, // 인버터 효율 (98.7% 기준 잔여)
  availability: 0.5, // 가동률 손실
  systemEfficiency: 80 // 기본값 (계산 후 덮어씌워짐)
};

// 기본 경제성 분석 설정 (Default Economic Config)
export const DEFAULT_ECONOMIC_CONFIG: EconomicConfig = {
  name: "기본 수익성 분석 (일반)",
  analysisMode: 'basic', // 기본값: 간편(연평균) 분석
  dailyInsolation: 3.51, // 한국 평균 일조 시간 (3.51시간)
  monthlyInsolation: DEFAULT_MONTHLY_INSOLATION, // 상세 분석용 기본값
  tmyData: [], // TMY 데이터 초기값 (빈 배열)

  systemEfficiency: 80, // 종합 시스템 효율 (PR)
  lossFactors: DEFAULT_LOSS_FACTORS, // 상세 손실 계수 기본값 연결

  annualDegradation: 0.33, // 연간 모듈 효율 저하율 (N타입 기준 0.33% 적용)
  smp: 130, // 예상 SMP (계통한계가격) 130원/kWh
  recPrice: 60000, // 예상 REC 가격 60,000원
  recWeight: 1.0, // REC 가중치 (일반 부지 1.0, 건축물 1.5)

  // [New] 글로벌 재무 및 BESS
  ppaEnabled: false,
  ppaRate: 150,
  ppaEscalation: 1.0,
  itcPercent: 0,
  discountRate: 4.5,
  bess: {
    enabled: false,
    capacityKwh: 0,
    powerKw: 0,
    efficiency: 90,
    dod: 90,
    costPerKwh: 500000,
    cyclesPerYear: 350
  },

  // 비용 설정 (Cost Factors)
  installationCostPerKw: 1200000, // 시공비: kW당 120만원
  maintenanceCostPerKw: 25000, // 유지보수비: kW당 연 25,000원
  leaseCostPerKw: 40000, // 임대료: kW당 연 40,000원
  inflationRate: 2.5, // 물가상승률 2.5% 가정 (New)
  vatIncluded: false, // 부가세 별도

  // 금융 설정 (Financial Factors)
  equityPercent: 20, // 자기자본 20% (대출 80% 가정)
  loanInterestRate: 1.75, // 대출 이자율 1.75%
  loanTerm: 15, // 총 대출 기간 15년
  loanGracePeriod: 5, // 거치 기간 5년 (이자만 납부)

  // 세무 설정 (Tax & Depreciation)
  corporateTaxRate: 10, // 법인세율 10% (소규모 태양광)
  depreciationPeriod: 20 // 감가상각 20년
};

// 케이블 단면적 옵션 (SQ) - 드롭다운 메뉴용
export const CABLE_OPTIONS = [4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150];
