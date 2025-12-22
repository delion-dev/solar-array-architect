
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PVModule, Inverter, SystemConfig, CalculationResult, EconomicConfig, SimulationResult, LossFactors } from './types';
import { DEFAULT_MODULE, DEFAULT_INVERTER, DEFAULT_CONFIG, DEFAULT_ECONOMIC_CONFIG, DEFAULT_LOSS_FACTORS } from './constants';
import { calculateSolarSystem, calculateEconomics } from './utils/solarCalculator';

interface StoreState {
  module: PVModule;
  inverter: Inverter;
  config: SystemConfig;
  economicConfig: EconomicConfig;

  results: CalculationResult;
  simulationResults: SimulationResult;

  moduleList: PVModule[];
  inverterList: Inverter[];
  configList: SystemConfig[];
  economicConfigList: EconomicConfig[];

  setModule: (module: Partial<PVModule>) => void;
  setInverter: (inverter: Partial<Inverter>) => void;
  setConfig: (config: Partial<SystemConfig>) => void;
  setEconomicConfig: (config: Partial<EconomicConfig>) => void;

  addModules: (modules: PVModule[]) => void;
  addInverters: (inverters: Inverter[]) => void;
  addConfigs: (configs: SystemConfig[]) => void;
  addEconomicConfigs: (configs: EconomicConfig[]) => void;

  loadGlobalConfig: (data: any) => void;
  resetToFactoryDefault: () => void;

  // [New] 강제 재계산 액션
  recalculateResults: () => void;
}

const recalculate = (
  module: PVModule,
  inverter: Inverter,
  config: SystemConfig,
  economicConfig: EconomicConfig
): { results: CalculationResult, simulationResults: SimulationResult } => {
  const results = calculateSolarSystem(module, inverter, config);
  const simulationResults = calculateEconomics(results.configuration.totalCapacity, results.dcAcRatio, economicConfig);
  return { results, simulationResults };
};

/**
 * 전역 상태 관리 (Global State Management)
 * 
 * Zustand 라이브러리를 사용하여 애플리케이션의 전역 상태를 관리합니다.
 * 이 스토어는 PV 모듈, 인버터, 시스템 설정, 경제성 분석 설정 등의 입력 데이터를 저장하고,
 * 입력값이 변경될 때마다 자동으로 엔지니어링 및 경제성 계산을 수행하여 결과를 업데이트합니다.
 * 또한, `persist` 미들웨어를 사용하여 브라우저의 localStorage에 상태를 영구 저장합니다.
 */

export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      // 초기 로드 시 기본값으로 계산 수행
      const initialResults = calculateSolarSystem(DEFAULT_MODULE, DEFAULT_INVERTER, DEFAULT_CONFIG);
      const initialSim = calculateEconomics(initialResults.configuration.totalCapacity, initialResults.dcAcRatio, DEFAULT_ECONOMIC_CONFIG);

      return {
        // --- 초기 상태 값 설정 (Initial State) ---
        module: DEFAULT_MODULE,
        inverter: DEFAULT_INVERTER,
        config: DEFAULT_CONFIG,
        economicConfig: DEFAULT_ECONOMIC_CONFIG,

        results: initialResults,
        simulationResults: initialSim,

        // 프리셋 리스트 (사용자가 저장한 설정들)
        moduleList: [DEFAULT_MODULE],
        inverterList: [DEFAULT_INVERTER],
        configList: [DEFAULT_CONFIG],
        economicConfigList: [DEFAULT_ECONOMIC_CONFIG],

        // --- 액션 (Actions) ---

        /**
         * PV 모듈 설정 업데이트
         * 모듈 정보가 변경되면 전체 시스템 계산을 다시 수행합니다.
         */
        setModule: (newModule) => set((state) => {
          const updated = { ...state.module, ...newModule };
          const { results, simulationResults } = recalculate(updated, state.inverter, state.config, state.economicConfig);
          return { module: updated, results, simulationResults };
        }),

        /**
         * 인버터 설정 업데이트
         * 인버터 정보가 변경되면 전체 시스템 계산을 다시 수행합니다.
         */
        setInverter: (newInverter) => set((state) => {
          const updated = { ...state.inverter, ...newInverter };
          const { results, simulationResults } = recalculate(state.module, updated, state.config, state.economicConfig);
          return { inverter: updated, results, simulationResults };
        }),

        /**
         * 시스템 설계 설정 업데이트 (온도, 케이블 길이 등)
         * 설계 변수가 변경되면 전체 시스템 계산을 다시 수행합니다.
         */
        setConfig: (newConfig) => set((state) => {
          const updated = { ...state.config, ...newConfig };
          const { results, simulationResults } = recalculate(state.module, state.inverter, updated, state.economicConfig);
          return { config: updated, results, simulationResults };
        }),

        /**
         * 경제성 분석 설정 업데이트 (SMP, REC 가중치 등)
         * 경제성 변수가 변경되면 경제성 시뮬레이션만 다시 수행하면 되지만,
         * 구조적 단순함을 위해 전체 재계산 로직을 따릅니다.
         */
        setEconomicConfig: (newEcon) => set((state) => {
          const updated = { ...state.economicConfig, ...newEcon };
          const { results, simulationResults } = recalculate(state.module, state.inverter, state.config, updated);
          return { economicConfig: updated, results, simulationResults };
        }),

        // --- 리스트 관리 액션 (List Management) ---
        addModules: (list) => set((state) => ({ moduleList: [...state.moduleList, ...list] })),
        addInverters: (list) => set((state) => ({ inverterList: [...state.inverterList, ...list] })),
        addConfigs: (list) => set((state) => ({ configList: [...state.configList, ...list] })),
        addEconomicConfigs: (list) => set((state) => ({ economicConfigList: [...state.economicConfigList, ...list] })),

        /**
         * 전체 설정 로드 (JSON 파일 등에서 불러오기)
         */
        loadGlobalConfig: (data) => set((state) => {
          const m = data.module || state.module;
          const i = data.inverter || state.inverter;
          const c = data.config || state.config;
          const e = data.economicConfig || state.economicConfig;
          const { results, simulationResults } = recalculate(m, i, c, e);
          return { module: m, inverter: i, config: c, economicConfig: e, results, simulationResults };
        }),

        /**
         * 공장 초기화 (Factory Reset)
         * 모든 설정을 기본값으로 되돌립니다.
         */
        resetToFactoryDefault: () => set(() => {
          const { results, simulationResults } = recalculate(DEFAULT_MODULE, DEFAULT_INVERTER, DEFAULT_CONFIG, DEFAULT_ECONOMIC_CONFIG);
          return {
            module: DEFAULT_MODULE,
            inverter: DEFAULT_INVERTER,
            config: DEFAULT_CONFIG,
            economicConfig: DEFAULT_ECONOMIC_CONFIG,
            results,
            simulationResults,
            moduleList: [DEFAULT_MODULE],
            inverterList: [DEFAULT_INVERTER],
            configList: [DEFAULT_CONFIG],
            economicConfigList: [DEFAULT_ECONOMIC_CONFIG],
          };
        }),

        /**
         * 결과 강제 재계산
         * 스토어 복원 시(Hydration) 계산 결과가 누락되거나 불일치할 경우 사용합니다.
         */
        recalculateResults: () => set((state) => {
          const { results, simulationResults } = recalculate(state.module, state.inverter, state.config, state.economicConfig);
          return { results, simulationResults };
        })
      };
    },
    {
      name: 'solar-architect-storage', // localStorage 키 이름
      storage: createJSONStorage(() => localStorage),
      // 저장할 상태 필드 선택 (Partialization)
      // TMY 데이터는 용량이 크므로 localStorage 저장 대상에서 제외합니다.
      partialize: (state) => ({
        module: state.module,
        inverter: state.inverter,
        config: state.config,
        economicConfig: {
          ...state.economicConfig,
          tmyData: undefined // TMY 데이터 제외
        },
        results: state.results,
        simulationResults: {
          ...state.simulationResults,
          tmyData: undefined // 시뮬레이션 결과 내 TMY 데이터 제외 (필요 시)
        },
        moduleList: state.moduleList,
        inverterList: state.inverterList,
        configList: state.configList,
        economicConfigList: state.economicConfigList.map(ec => ({
          ...ec,
          tmyData: undefined // 리스트 내 모든 항목에서도 TMY 데이터 제외
        }))
      }),
    }
  )
);
