/**
 * 태양광 발전 계산에 사용되는 주요 상수 정의
 */

/**
 * 월별 일수 (평년 기준)
 */
export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * 환경 영향 평가 계수
 * - CO2_FACTOR: 발전량(MWh)당 이산화탄소 감축량 (tCO2/MWh)
 * - PINE_TREE_FACTOR: 이산화탄소 1톤당 소나무 식재 효과 (tCO2/tree)
 * - OIL_TOE_FACTOR: 발전량(MWh)당 석유 대체 효과 (TOE/MWh)
 */
export const ENVIRONMENTAL_FACTORS = {
    CO2_FACTOR: 0.4594,
    PINE_TREE_FACTOR: 0.0066,
    OIL_TOE_FACTOR: 0.215,
};

/**
 * 기본 사회적 할인율 (4.5%)
 * 경제성 분석(NPV) 시 미래 가치를 현재 가치로 환산할 때 사용
 */
export const DEFAULT_DISCOUNT_RATE = 0.045;

/**
 * 케이블 재질별 고유 저항 (20°C 기준, Ohm*mm²/m)
 * - copper: 구리
 * - aluminum: 알루미늄
 */
export const CABLE_RESISTIVITY = {
    copper: 0.0172,
    aluminum: 0.0282,
};

/**
 * 온도에 따른 저항 변화 계수 (Copper/Aluminum 근사치)
 * 저항률 변화 공식: R = R0 * (1 + alpha * (T - T0))
 */
export const TEMP_COEFF_RESISTANCE = 0.00393;
