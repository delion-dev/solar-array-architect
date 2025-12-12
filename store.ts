
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

export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
        const initialResults = calculateSolarSystem(DEFAULT_MODULE, DEFAULT_INVERTER, DEFAULT_CONFIG);
        const initialSim = calculateEconomics(initialResults.configuration.totalCapacity, initialResults.dcAcRatio, DEFAULT_ECONOMIC_CONFIG);

        return {
          module: DEFAULT_MODULE,
          inverter: DEFAULT_INVERTER,
          config: DEFAULT_CONFIG,
          economicConfig: DEFAULT_ECONOMIC_CONFIG,
          
          results: initialResults,
          simulationResults: initialSim,

          moduleList: [DEFAULT_MODULE],
          inverterList: [DEFAULT_INVERTER],
          configList: [DEFAULT_CONFIG],
          economicConfigList: [DEFAULT_ECONOMIC_CONFIG],

          setModule: (newModule) => set((state) => {
            const updated = { ...state.module, ...newModule };
            const { results, simulationResults } = recalculate(updated, state.inverter, state.config, state.economicConfig);
            return { module: updated, results, simulationResults };
          }),

          setInverter: (newInverter) => set((state) => {
            const updated = { ...state.inverter, ...newInverter };
            const { results, simulationResults } = recalculate(state.module, updated, state.config, state.economicConfig);
            return { inverter: updated, results, simulationResults };
          }),

          setConfig: (newConfig) => set((state) => {
            const updated = { ...state.config, ...newConfig };
            const { results, simulationResults } = recalculate(state.module, state.inverter, updated, state.economicConfig);
            return { config: updated, results, simulationResults };
          }),

          setEconomicConfig: (newEcon) => set((state) => {
             const updated = { ...state.economicConfig, ...newEcon };
             const { results, simulationResults } = recalculate(state.module, state.inverter, state.config, updated);
             return { economicConfig: updated, results, simulationResults };
          }),

          addModules: (list) => set((state) => ({ moduleList: [...state.moduleList, ...list] })),
          addInverters: (list) => set((state) => ({ inverterList: [...state.inverterList, ...list] })),
          addConfigs: (list) => set((state) => ({ configList: [...state.configList, ...list] })),
          addEconomicConfigs: (list) => set((state) => ({ economicConfigList: [...state.economicConfigList, ...list] })),

          loadGlobalConfig: (data) => set((state) => {
             const m = data.module || state.module;
             const i = data.inverter || state.inverter;
             const c = data.config || state.config;
             const e = data.economicConfig || state.economicConfig;
             const { results, simulationResults } = recalculate(m, i, c, e);
             return { module: m, inverter: i, config: c, economicConfig: e, results, simulationResults };
          }),
          
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

          // [New] 현재 입력값을 바탕으로 결과를 강제로 재계산 (Store Hydration 문제 해결용)
          recalculateResults: () => set((state) => {
            const { results, simulationResults } = recalculate(state.module, state.inverter, state.config, state.economicConfig);
            return { results, simulationResults };
          })
        };
    },
    {
      name: 'solar-architect-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
         module: state.module,
         inverter: state.inverter,
         config: state.config,
         economicConfig: state.economicConfig,
         results: state.results,
         simulationResults: state.simulationResults,
         moduleList: state.moduleList,
         inverterList: state.inverterList,
         configList: state.configList,
         economicConfigList: state.economicConfigList
      }),
    }
  )
);
