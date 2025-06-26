"use client";
import React, { useState, useEffect } from 'react';

export interface Rule {
    id: string;
    name: string; //ルール名
    description: string; //ルール詳細（自由記述）
    minStaff: number; //最低人数
    maxStaff?: number; //最高人数
    isAllDay: boolean; //終日かどうか
    startTime: string; //開始時間
    endTime: string; //終了時間
}

export type RuleData = Omit<Rule, 'id'>;

interface RuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (ruleData: RuleData) => void;
    existingRule: Rule | null;
}

const initialRuleData: RuleData = {
    name: '',
    minStaff: 1,
    maxStaff: undefined,
    isAllDay: false,
    startTime: '09:00',
    endTime: '17:00',
    description: '',
};

const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const modalContentStyle: React.CSSProperties = {
    backgroundColor: '#1f2937', borderRadius: '8px', width: '600px',
    maxWidth: '95%', boxSizing: 'border-box', color: '#e5e7eb',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
};
const modalHeaderStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, #3B4F9D, #8A2BE2)', color: 'white',
    padding: '16px 24px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px',
};
const closeButtonStyle: React.CSSProperties = {
    background: 'none', border: 'none', color: 'white',
    fontSize: '24px', cursor: 'pointer',
};
const formContainerStyle: React.CSSProperties = {
    padding: '24px', maxHeight: '70vh', overflowY: 'auto'
};
const ruleSectionStyle: React.CSSProperties = {
    backgroundColor: '#374151', padding: '20px', borderRadius: '8px',
};
const formGroupStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px'
};
const labelStyle: React.CSSProperties = {
    fontSize: '14px', fontWeight: '500',
};
const inputStyle: React.CSSProperties = {
    padding: '12px', fontSize: '16px', border: '1px solid #4b5563',
    borderRadius: '6px', backgroundColor: '#4b5563', color: 'white',
    width: '100%', boxSizing: 'border-box',
};
const textareaStyle: React.CSSProperties = {
    ...inputStyle, minHeight: '120px', resize: 'vertical', fontFamily: 'inherit',
};
const flexRowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '16px'
};
const flexItemStyle: React.CSSProperties = {
    flex: 1
};
const modalActionsStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'flex-end', gap: '12px',
    padding: '20px 24px', backgroundColor: '#1f2937',
    borderTop: '1px solid #374151', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px',
};
const cancelButton: React.CSSProperties = {
    padding: '10px 20px', border: '1px solid #6b7280', borderRadius: '6px',
    cursor: 'pointer', backgroundColor: '#4b5563', color: 'white', fontWeight: 'bold',
};
const saveButton: React.CSSProperties = {
    padding: '10px 20px', border: 'none', borderRadius: '6px',
    cursor: 'pointer', backgroundColor: '#1EAF7A', color: 'white', fontWeight: 'bold',
};

const RuleModal: React.FC<RuleModalProps> = ({ isOpen, onClose, onSave, existingRule }) => {
    const [ruleData, setRuleData] = useState<RuleData>(initialRuleData);

    useEffect(() => {
        if (isOpen) {
            if (existingRule) {
                const dataToEdit = { ...initialRuleData, ...existingRule };
                if (existingRule.maxStaff === null || existingRule.maxStaff === 0) {
                    dataToEdit.maxStaff = undefined;
                }
                setRuleData(dataToEdit);
            } else {
                setRuleData(initialRuleData);
            }
        }
    }, [isOpen, existingRule]);

    const handleSave = () => {
        if (!ruleData.name.trim()) {
            alert('ルール名を入力してください。');
            return;
        }
        if (ruleData.minStaff < 1) {
            alert('最低人数は1人以上で設定してください。');
            return;
        }
        if (ruleData.maxStaff && ruleData.maxStaff < ruleData.minStaff) {
            alert('最高人数は最低人数以上で設定してください。');
            return;
        }
        onSave({
            ...ruleData,
            maxStaff: ruleData.maxStaff || undefined,
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setRuleData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'number') {
            const numValue = value === '' ? undefined : parseInt(value, 10);
            setRuleData(prev => ({...prev, [name]: numValue }));
        }
        else {
            setRuleData(prev => ({...prev, [name]: value,}));
        }
    };

    if (!isOpen) return null;

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                <div style={modalHeaderStyle}>
                    <span>{existingRule ? 'ルール編集' : '新しいルールを作成'}</span>
                    <button onClick={onClose} style={closeButtonStyle}>×</button>
                </div>

                <div style={formContainerStyle}>
                    <div style={ruleSectionStyle}>
                        {/* ルール名 */}
                        <div style={formGroupStyle}>
                            <label htmlFor="name" style={labelStyle}>ルール名</label>
                            <input id="name" type="text" name="name" value={ruleData.name} onChange={handleChange} style={inputStyle} placeholder="例: 基本勤務ルール"/>
                        </div>

                        {/* 時間設定 */}
                        <div style={formGroupStyle}>
                             <label style={labelStyle}>時間</label>
                             <div style={{...flexRowStyle, marginBottom: '10px'}}>
                                 <input type="checkbox" id="isAllDay" name="isAllDay" checked={ruleData.isAllDay} onChange={handleChange} />
                                 <label htmlFor="isAllDay" style={{...labelStyle, cursor: 'pointer'}}>終日</label>
                             </div>
                             {/* isAllDayがfalseの時だけ時間入力欄を表示 */}
                             {!ruleData.isAllDay && (
                                <div style={flexRowStyle}>
                                    <input id="startTime" type="time" name="startTime" value={ruleData.startTime} onChange={handleChange} style={inputStyle} />
                                    <span style={{color: 'white'}}>～</span>
                                    <input id="endTime" type="time" name="endTime" value={ruleData.endTime} onChange={handleChange} style={inputStyle} />
                                </div>
                             )}
                        </div>

                        {/* 人数設定 */}
                        <div style={formGroupStyle}>
                            <label style={labelStyle}>人数</label>
                            <div style={flexRowStyle}>
                                <div style={flexItemStyle}>
                                    <label htmlFor="minStaff" style={{...labelStyle, fontSize: '12px'}}>最低</label>
                                    <input id="minStaff" type="number" name="minStaff" value={ruleData.minStaff} onChange={handleChange} style={inputStyle} min="1"/>
                                </div>
                                <div style={flexItemStyle}>
                                    <label htmlFor="maxStaff" style={{...labelStyle, fontSize: '12px'}}>最高 (任意)</label>
                                    <input id="maxStaff" type="number" name="maxStaff" value={ruleData.maxStaff || ''} onChange={handleChange} style={inputStyle} placeholder="未入力可" min="1"/>
                                </div>
                            </div>
                        </div>

                        {/* ルール詳細 */}
                        <div style={formGroupStyle}>
                            <label htmlFor="description" style={labelStyle}>ルール詳細 (その他ルール)</label>
                            <textarea id="description" name="description" value={ruleData.description} onChange={handleChange} style={textareaStyle} placeholder="このルールの補足情報などを記述してください。"/>
                        </div>
                    </div>
                </div>

                <div style={modalActionsStyle}>
                    <button style={cancelButton} onClick={onClose}>キャンセル</button>
                    <button style={saveButton} onClick={handleSave}>保存</button>
                </div>
            </div>
        </div>
    );
};

export default RuleModal;