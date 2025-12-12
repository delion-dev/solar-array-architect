import React from 'react';
import { useStore } from '../../store';
import { CollapsibleCard } from '../ui/CollapsibleCard';
import { PresetManager } from '../ui/PresetManager';
import { InputGroup } from '../ui/InputGroup';

export const InverterSelector = () => {
    const { inverter, inverterList, setInverter, addInverters } = useStore();

    const handleInverterChange = (field: keyof typeof inverter, value: string) => {
        if (field === 'model' || field === 'imageUrl') {
            setInverter({ [field]: value });
        } else {
            setInverter({ [field]: parseFloat(value) || 0 });
        }
    };

    return (
        <CollapsibleCard title="인버터 (Inverter)">
            <PresetManager
                title="인버터 목록"
                items={inverterList}
                currentItem={inverter}
                onSelect={(i) => setInverter(i)}
                onImport={addInverters}
                onSave={(name) => {
                    const newInverter = JSON.parse(JSON.stringify({ ...inverter, model: name }));
                    addInverters([newInverter]);
                    setInverter(newInverter);
                }}
                getLabel={(i) => `${i.model} (${i.manufacturer})`}
                getId={(i) => i.model}
            />
            <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">모델명</label>
                        <input
                            type="text"
                            value={inverter.model}
                            onChange={(e) => handleInverterChange('model', e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 ring-1 ring-slate-300 px-3 py-1.5 text-sm focus:ring-accent shadow-sm input-field"
                        />
                    </div>
                    <InputGroup label="제조사" value={inverter.manufacturer} type="text" onChange={(v) => handleInverterChange('manufacturer', v)} />
                    <InputGroup label="정격 출력" value={inverter.ratedOutputPower} unit="kW" onChange={(v) => handleInverterChange('ratedOutputPower', v)} />
                    <InputGroup label="최대 입력 전압" value={inverter.maxInputVoltage} unit="V" onChange={(v) => handleInverterChange('maxInputVoltage', v)} />
                    <InputGroup label="기동 전압" value={inverter.startUpVoltage} unit="V" onChange={(v) => handleInverterChange('startUpVoltage', v)} />
                    <InputGroup label="MPPT 최저 전압" value={inverter.minMpptVoltage} unit="V" onChange={(v) => handleInverterChange('minMpptVoltage', v)} />
                    <InputGroup label="MPPT 최고 전압" value={inverter.maxMpptVoltage} unit="V" onChange={(v) => handleInverterChange('maxMpptVoltage', v)} />
                    <InputGroup label="최대 입력 전류" value={inverter.maxInputCurrent} unit="A" onChange={(v) => handleInverterChange('maxInputCurrent', v)} />
                    <InputGroup label="최대 단락 전류" value={inverter.maxShortCircuitCurrent} unit="A" onChange={(v) => handleInverterChange('maxShortCircuitCurrent', v)} />
                    <InputGroup label="변환 효율" value={inverter.efficiency} unit="%" step="0.1" onChange={(v) => handleInverterChange('efficiency', v)} />
                </div>
            </div>
        </CollapsibleCard>
    );
};
