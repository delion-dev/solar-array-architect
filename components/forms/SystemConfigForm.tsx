import React from 'react';
import { useStore } from '../../store';
import { CollapsibleCard } from '../ui/CollapsibleCard';
import { PresetManager } from '../ui/PresetManager';
import { ApplyButton } from '../ui/ApplyButton';
import { InputGroup } from '../ui/InputGroup';
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
                <InputGroup label="목표 용량" value={config.targetCapacity} unit="kW" onChange={(v) => handleConfigChange('targetCapacity', v)} />
                <div className="flex flex-col space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">케이블 단면적</label>
                    <select
                        className="block w-full rounded-md border-slate-300 py-2 pl-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-accent sm:text-sm input-field"
                        value={config.cableCrossSection}
                        onChange={(e) => handleConfigChange('cableCrossSection', e.target.value)}
                    >
                        {CABLE_OPTIONS.map(c => <option key={c} value={c}>{c} mm²</option>)}
                    </select>
                </div>
                <InputGroup label="DC 케이블 길이" value={config.cableLength} unit="m" onChange={(v) => handleConfigChange('cableLength', v)} />
                <InputGroup label="겨울철 최저온도" value={config.ambientTempWinter} unit="°C" onChange={(v) => handleConfigChange('ambientTempWinter', v)} />
                <InputGroup label="여름철 모듈 표면 온도" value={config.ambientTempSummer} unit="°C" onChange={(v) => handleConfigChange('ambientTempSummer', v)} />
                <InputGroup
                    label="양면 모듈 이득"
                    value={config.bifacialGain || 0}
                    unit="%"
                    onChange={(v) => handleConfigChange('bifacialGain', v)}
                    placeholder="0"
                />
            </div>
        </CollapsibleCard>
    );
};
