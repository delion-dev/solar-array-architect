import React from 'react';
import { BOMItem } from '../../types';

export const BOMDetailModal = ({ item, onClose }: { item: BOMItem, onClose: () => void }) => {
    if (!item.details) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-white/20" onClick={e => e.stopPropagation()}>
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">{item.item}</h3>
                        <p className="text-sm text-slate-500 font-mono">{item.spec}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1 hover:bg-slate-100">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                        {[
                            ['Manufacturer', item.details.manufacturer], ['Part Number', item.details.partNumber],
                            ['Dimensions', item.details.dimension], ['Weight', item.details.weight],
                            ['Material', item.details.material], ['IP Rating', item.details.ipRating]
                        ].map(([k, v]) => (
                            <div key={k}>
                                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">{k}</span>
                                <span className="text-sm font-medium text-slate-800">{v || '-'}</span>
                            </div>
                        ))}
                        <div className="md:col-span-2">
                            <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Certification</span>
                            <span className="text-sm text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded inline-block">{item.details.certification || '-'}</span>
                        </div>
                        <div className="md:col-span-2 border-t border-slate-100 pt-4">
                            <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Description</span>
                            <p className="text-sm text-slate-600 leading-relaxed">{item.details.description || '상세 설명이 없습니다.'}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-right">
                    <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">닫기</button>
                </div>
            </div>
        </div>
    );
};
