import React from 'react';
import { useStore } from '../../store';
import { CollapsibleCard } from '../ui/CollapsibleCard';
import { PresetManager } from '../ui/PresetManager';
import { ApplyButton } from '../ui/ApplyButton';
import { InputGroup } from '../ui/InputGroup';
import { Tooltip } from '../ui/Tooltip';
import { CABLE_OPTIONS, DEFAULT_CONFIG } from '../../constants';

export const SystemConfigForm = () => {
    const { config, configList, setConfig, addConfigs } = useStore();

    const handleConfigChange = (field: keyof typeof config, value: string) => {
        if (field === 'name') {
            setConfig({ name: value });
        } else {
            setConfig({ [field]: parseFloat(value) || 0 });
        }
    };

    return (
        <CollapsibleCard title="시스템 설계 조건 (Config)" defaultOpen={true}>
            <div className="flex justify-end mb-2">
                <ApplyButton onClick={() => setConfig(DEFAULT_CONFIG)} label="초기화" />
            </div>
            <PresetManager
                title="설계 조건 목록"
                items={configList}
                currentItem={config}
                onSelect={(c) => setConfig(c)}
                onImport={addConfigs}
                onSave={(name) => {
                    const newConfig = JSON.parse(JSON.stringify({ ...config, name }));
                    addConfigs([newConfig]);
                    setConfig(newConfig);
                }}
                getLabel={(c) => c.name || '이름 없음'}
                getId={(c) => c.name || 'unnamed'}
            />
            <div className="mb-4">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">설정 이름 (식별용)</label>
                <input
                    type="text"
                    value={config.name || ''}
                    onChange={(e) => handleConfigChange('name', e.target.value)}
                    placeholder="예: A공장 지붕형 (500kW)"
                    className="mt-1 block w-full rounded-md border-slate-300 ring-1 ring-slate-300 px-3 py-1.5 text-sm focus:ring-accent placeholder:text-slate-300 input-field"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <InputGroup
                    label="목표 용량"
                    value={config.targetCapacity}
                    unit="kW"
                    onChange={(v) => handleConfigChange('targetCapacity', v)}
                    tooltip="목표 DC 용량입니다. (예: 500kW - 일반적인 공장 지붕형 규모)"
                />
                <div className="flex flex-col space-y-1">
                    <div className="flex items-center">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">케이블 단면적</label>
                        <Tooltip content="DC 케이블 굵기입니다. (예: 6mm² - 소규모, 10~16mm² - 중대규모) 굵을수록 전압 강하가 줄어듭니다." />
                    </div>
                    <select
                        className="block w-full rounded-md border-slate-300 py-2 pl-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-accent sm:text-sm input-field"
                        value={config.cableCrossSection}
                        onChange={(e) => handleConfigChange('cableCrossSection', e.target.value)}
                    >
                        {CABLE_OPTIONS.map(c => <option key={c} value={c}>{c} mm²</option>)}
                    </select>
                </div>
                <InputGroup
                    label="DC 케이블 길이"
                    value={config.cableLength}
                    unit="m"
                    onChange={(v) => handleConfigChange('cableLength', v)}
                    tooltip="모듈에서 인버터까지의 편도 길이입니다. (예: 50m) 길수록 전압 강하가 커지므로 최단 거리 설계가 권장됩니다."
                />
                <InputGroup
                    label="겨울철 최저온도"
                    value={config.ambientTempWinter}
                    unit="°C"
                    onChange={(v) => handleConfigChange('ambientTempWinter', v)}
                    tooltip="지역별 역대 최저 기온입니다. (예: -15°C) 겨울철 전압 상승에 따른 인버터 보호 설계의 기준이 됩니다."
                />
                <InputGroup
                    label="여름철 모듈 표면 온도"
                    value={config.ambientTempSummer}
                    unit="°C"
                    onChange={(v) => handleConfigChange('ambientTempSummer', v)}
                    tooltip="여름철 모듈의 최대 예상 온도입니다. (예: 65°C) 기온보다 약 20~30°C 높게 설정하며, 효율 계산에 쓰입니다."
                />
                <InputGroup
                    label="양면 모듈 이득"
                    value={config.bifacialGain || 0}
                    unit="%"
                    onChange={(v) => handleConfigChange('bifacialGain', v)}
                    placeholder="0"
                    tooltip="후면 반사광을 통한 추가 발전 이득입니다. (예: 10%) 지면 상태와 설치 높이에 따라 보통 5~15% 사이로 발생합니다."
                />
                <div className="flex flex-col space-y-1">
                    <div className="flex items-center">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">지면 반사율 (Albedo)</label>
                        <Tooltip content="지면의 빛 반사 정도입니다. (예: 0.2 - 일반 토양, 0.8 - 눈) 값이 높을수록 양면 모듈의 후면 발전량이 증가합니다." />
                    </div>
                    <select
                        className="block w-full rounded-md border-slate-300 py-2 pl-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-accent sm:text-sm input-field"
                        value={config.albedo || 0.2}
                        onChange={(e) => handleConfigChange('albedo', e.target.value)}
                    >
                        <option value="0.2">일반 대지 (0.2)</option>
                        <option value="0.25">잔디/녹지 (0.25)</option>
                        <option value="0.15">아스팔트 (0.15)</option>
                        <option value="0.3">콘크리트 (0.3)</option>
                        <option value="0.8">눈 (0.8)</option>
                        <option value="0.4">모래 (0.4)</option>
                    </select>
                </div>
                <InputGroup
                    label="설치 높이"
                    value={config.mountingHeight || 1.0}
                    unit="m"
                    onChange={(v) => handleConfigChange('mountingHeight', v)}
                    placeholder="1.0"
                    tooltip="지면에서 모듈 하단까지의 높이입니다. (예: 1.0m) 높을수록 후면으로 들어오는 반사광이 고르게 퍼져 이득이 좋아집니다."
                />
            </div>
        </CollapsibleCard>
    );
};
