import React, { useRef, useState } from 'react';
import { readTextFile } from '../../utils/solarCalculator';

/**
 * [프리셋 관리자 컴포넌트]
 * 모듈, 인버터, 설정값 등의 JSON 데이터를 파일로 저장하거나 불러오는 기능을 담당합니다.
 * 제네릭(Generic) 타입을 사용하여 다양한 데이터 구조에 재사용 가능합니다.
 */
interface PresetManagerProps<T> {
    title: string;
    items: T[];
    currentItem: T;
    onSelect: (item: T) => void;
    onImport: (items: T[]) => void;
    onSave?: (name: string) => void;
    getLabel: (item: T) => string;
    getId: (item: T) => string;
}

export const PresetManager = <T extends object>({
    title,
    items,
    currentItem,
    onSelect,
    onImport,
    onSave,
    getLabel,
    getId
}: PresetManagerProps<T>) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const currentId = getId(currentItem);
    const isCustom = !items.some(i => getId(i) === currentId);
    const [saveMsg, setSaveMsg] = useState<string>('');

    // 파일 선택 시 처리 로직
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await readTextFile(file);
            const json = JSON.parse(text);
            const list = Array.isArray(json) ? json : [json];
            onImport(list);
            if (list.length > 0) {
                onSelect(list[0]);
            }
        } catch (err) {
            console.error("파일 불러오기 실패:", err);
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // 현재 설정을 JSON 파일로 내보내기
    const handleExport = () => {
        const dataStr = JSON.stringify(currentItem, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const safeName = getId(currentItem).replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'preset';
        link.download = `${safeName}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 현재 설정을 리스트에 저장하기
    const handleSaveToList = () => {
        if (!onSave) return;
        const defaultName = getLabel(currentItem);
        const name = window.prompt("새 프리셋 이름을 입력하세요:", defaultName);
        if (name && name.trim()) {
            onSave(name.trim());
            setSaveMsg('저장 완료!');
            setTimeout(() => setSaveMsg(''), 2000);
        }
    };

    return (
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                    {title}
                    <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px]">{items.length}</span>
                </label>
                <div className="flex items-center space-x-1">
                    {onSave && (
                        <div className="flex items-center">
                            {saveMsg && <span className="text-[10px] text-green-600 font-bold mr-2 animate-pulse transition-opacity">{saveMsg}</span>}
                            <button
                                onClick={handleSaveToList}
                                className="text-[10px] flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 px-2 py-1 rounded transition-colors shadow-sm"
                                title="현재 설정을 브라우저 저장소에 추가합니다"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                목록 저장
                            </button>
                        </div>
                    )}
                    <input
                        type="file"
                        accept=".json"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[10px] flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 px-2 py-1 rounded transition-colors shadow-sm"
                        title="JSON 파일 불러오기"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        불러오기
                    </button>
                    <button
                        onClick={handleExport}
                        className="text-[10px] flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 px-2 py-1 rounded transition-colors shadow-sm"
                        title="JSON 파일로 내보내기"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        내보내기
                    </button>
                </div>
            </div>

            <select
                className={`block w-full rounded-md border-slate-300 py-1.5 pl-3 pr-10 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-accent ${isCustom ? 'text-blue-700 font-bold bg-blue-50' : 'text-slate-900'}`}
                value={isCustom ? "custom" : currentId}
                onChange={(e) => {
                    if (e.target.value === "custom") return;
                    const selected = items.find(i => getId(i) === e.target.value);
                    if (selected) onSelect(selected);
                }}
            >
                <option value="custom" disabled>
                    {isCustom ? `✅ ${getLabel(currentItem)} (현재 적용)` : "목록에서 선택하세요..."}
                </option>
                {items.map((item, idx) => {
                    const id = getId(item);
                    return (
                        <option key={`${id}-${idx}`} value={id}>
                            {getLabel(item)}
                        </option>
                    );
                })}
            </select>
        </div>
    );
};
