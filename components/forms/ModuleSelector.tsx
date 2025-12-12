import React from 'react';
import { useStore } from '../../store';
import { CollapsibleCard } from '../ui/CollapsibleCard';
import { PresetManager } from '../ui/PresetManager';
import { InputGroup } from '../ui/InputGroup';

export const ModuleSelector = () => {
    const { module, moduleList, setModule, addModules } = useStore();

    const handleModuleChange = (field: keyof typeof module, value: string) => {
        if (field === 'model' || field === 'imageUrl') {
            setModule({ [field]: value });
        } else {
            setModule({ [field]: parseFloat(value) || 0 });
        }
    };

    const handleCoeffChange = (field: 'voc' | 'pmax' | 'isc', value: string) => {
        setModule({
            tempCoefficients: {
                ...module.tempCoefficients,
                [field]: parseFloat(value) || 0
            }
        });
    };

    return (
        <CollapsibleCard title="태양광 모듈 (Module)">
            <PresetManager
                title="모듈 목록"
                items={moduleList}
                currentItem={module}
                onSelect={(m) => setModule(m)}
                onImport={addModules}
                onSave={(name) => {
                    const newModule = JSON.parse(JSON.stringify({ ...module, model: name }));
                    addModules([newModule]);
                    setModule(newModule);
                }}
                getLabel={(m) => `${m.model} (${m.manufacturer})`}
                getId={(m) => m.model}
            />
            <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">모델명</label>
                        <input
                            type="text"
                            value={module.model}
                            onChange={(e) => handleModuleChange('model', e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 ring-1 ring-slate-300 px-3 py-1.5 text-sm focus:ring-accent shadow-sm input-field"
                        />
                    </div>
                    <InputGroup label="제조사" value={module.manufacturer} type="text" onChange={(v) => handleModuleChange('manufacturer', v)} />
                    <InputGroup label="최대 출력 (Pmax)" value={module.pmax} unit="W" onChange={(v) => handleModuleChange('pmax', v)} />
                    <InputGroup label="개방 전압 (Voc)" value={module.voc} unit="V" onChange={(v) => handleModuleChange('voc', v)} />
                    <InputGroup label="단락 전류 (Isc)" value={module.isc} unit="A" onChange={(v) => handleModuleChange('isc', v)} />
                    <InputGroup label="동작 전압 (Vmp)" value={module.vmp} unit="V" onChange={(v) => handleModuleChange('vmp', v)} />
                    <InputGroup label="동작 전류 (Imp)" value={module.imp} unit="A" onChange={(v) => handleModuleChange('imp', v)} />

                    <div className="col-span-2 border-t border-slate-100 pt-2 mt-2">
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">온도 계수 (Temperature Coefficients)</label>
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="Voc 온도계수" value={module.tempCoefficients.voc} unit="%/°C" step="0.01" onChange={(v) => handleCoeffChange('voc', v)} />
                            <InputGroup label="Pmax 온도계수" value={module.tempCoefficients.pmax} unit="%/°C" step="0.01" onChange={(v) => handleCoeffChange('pmax', v)} />
                        </div>
                    </div>

                    <div className="col-span-2 border-t border-slate-100 pt-2 mt-2">
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">물리적 사양 (Physical)</label>
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="가로 폭 (Width)" value={module.width} unit="mm" onChange={(v) => handleModuleChange('width', v)} />
                            <InputGroup label="세로 높이 (Height)" value={module.height} unit="mm" onChange={(v) => handleModuleChange('height', v)} />
                            <InputGroup label="무게 (Weight)" value={module.weight} unit="kg" onChange={(v) => handleModuleChange('weight', v)} />
                        </div>
                    </div>
                </div>
            </div>
        </CollapsibleCard>
    );
};
