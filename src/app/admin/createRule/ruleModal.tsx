import React, { useState, useEffect } from 'react';
import { Rule, RuleFormData } from './page'; 

interface RuleModalProps {
    isOpen: boolean;
    onClose: () => void; 
    onSave: (ruleData: RuleFormData) => void;
    existingRule: Rule | null;
}

const initialRuleData: RuleFormData = {
    name: '',
    ruleType: 'staffing',
    minStaffCount: 1,
    maxStaffCount: undefined,
    maxConsecutiveDays: 5,
    workingHours: {
        start: '09:00',
        end: '18:00'
    },
    weeklyMaxHours: 40,
    monthlyMaxHours: 160,
    breakRules: {
        minWorkHoursForBreak: 6,
        breakDuration: 60
    },
    isActive: true,
    priority: 5,
};

const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
};
const modalContentStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    width: '600px',
    maxWidth: '95%',
};
const modalTitleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '24px',
    maxHeight: '90vh',
    overflowY: 'auto',
};
const formGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '16px'
};
const formGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
};
const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
};
const modalActionsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #eee'
};
const cancelButton: React.CSSProperties = {
    padding: '10px 20px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: 'white'
};
const saveButton: React.CSSProperties = {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#4169e1',
    color: 'white'
};
const sectionTitleStyle: React.CSSProperties = {
    fontWeight: 'bold',
    fontSize: '16px',
    marginTop: '20px',
    marginBottom: '10px',
    borderBottom: '2px solid #eee',
    paddingBottom: '5px',
    gridColumn: '1 / -1'
};

const RuleModal: React.FC<RuleModalProps> = ({ isOpen, onClose, onSave, existingRule }) => {
    const [ruleData, setRuleData] = useState<RuleFormData>(initialRuleData);

    useEffect(() => {
        if (isOpen) {
            if (existingRule) {
                setRuleData({ ...initialRuleData, ...existingRule });
            } else {
                setRuleData(initialRuleData);
            }
        }
    }, [isOpen, existingRule]);

    const handleSave = () => onSave(ruleData);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        const keys = name.split('.');
        
        let finalValue: string | number | boolean | undefined = value;

        if (type === 'number') {
            finalValue = value === '' ? undefined : parseFloat(value);
        }
        if (type === 'checkbox') {
            finalValue = (e.target as HTMLInputElement).checked;
        }

        if (keys.length === 1) {
            setRuleData(prev => ({ ...prev, [name]: finalValue }));
        } else {
            const [parentKey, childKey] = keys;
            setRuleData(prev => {
                const parentObject = (prev as any)[parentKey] || {};
                return {
                    ...prev,
                    [parentKey]: {
                        ...parentObject,
                        [childKey]: finalValue,
                    },
                };
            });
        }
    };

    if (!isOpen) return null;
    
    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                <h2 style={modalTitleStyle}>
                    {existingRule ? 'ルール編集': '新しいルールを作成'}
                </h2>

                <div style={formGridStyle}>
                    <div style={{...formGroupStyle, gridColumn: '1 / -1'}}>
                        <label htmlFor="name">ルール名</label>
                        <input id="name" type="text" name="name" value={ruleData.name} onChange={handleChange} style={inputStyle} placeholder="例: 平日昼間の人員配置"/>
                    </div>
                    <div style={formGroupStyle}>
                        <label htmlFor="ruleType">ルールの種類</label>
                        <select id="ruleType" name="ruleType" value={ruleData.ruleType} onChange={handleChange} style={inputStyle}>
                            <option value="staffing">人員配置</option>
                            <option value="schedule">スケジュール</option>
                            <option value="constraint">制約</option>
                        </select>
                    </div>
                    <div style={formGroupStyle}>
                        <label htmlFor="priority">優先度 (数値が高いほど優先)</label>
                        <input id="priority" type="number" name="priority" value={ruleData.priority} onChange={handleChange} style={inputStyle} />
                    </div>
                    <div style={{...formGroupStyle, justifyContent: 'center', alignItems: 'flex-start'}}>
                        <label style={{ display: 'flex', alignItems: 'center', height: '100%'}}>
                            <input type="checkbox" name="isActive" checked={ruleData.isActive} onChange={handleChange} style={{marginRight: '8px', transform: 'scale(1.2)'}} />
                            このルールを有効にする
                        </label>
                    </div>
                </div>

                
                {ruleData.ruleType === 'staffing' && (
                    <div style={formGridStyle}>
                        <h3 style={sectionTitleStyle}>人員配置設定</h3>
                        <div style={formGroupStyle}>
                            <label htmlFor="minStaffCount">最小人数</label>
                            <input id="minStaffCount" type="number" name="minStaffCount" value={ruleData.minStaffCount} onChange={handleChange} style={inputStyle} />
                        </div>
                        <div style={formGroupStyle}>
                            <label htmlFor="maxStaffCount">最大人数 (任意)</label>
                            <input id="maxStaffCount" type="number" name="maxStaffCount" value={ruleData.maxStaffCount ?? ''} onChange={handleChange} style={inputStyle} />
                        </div>
                    </div>
                )}

                {ruleData.ruleType === 'schedule' && (
                    <div style={formGridStyle}>
                        <h3 style={sectionTitleStyle}>時間設定</h3>
                        <div style={formGroupStyle}>
                            <label htmlFor="workingHours.start">勤務開始時間</label>
                            <input id="workingHours.start" type="time" name="workingHours.start" value={ruleData.workingHours.start} onChange={handleChange} style={inputStyle} />
                        </div>
                        <div style={formGroupStyle}>
                            <label htmlFor="workingHours.end">勤務終了時間</label>
                            <input id="workingHours.end" type="time" name="workingHours.end" value={ruleData.workingHours.end} onChange={handleChange} style={inputStyle} />
                        </div>
                         <div style={formGroupStyle}>
                            <label htmlFor="weeklyMaxHours">週間最大労働時間 (任意)</label>
                            <input id="weeklyMaxHours" type="number" name="weeklyMaxHours" value={ruleData.weeklyMaxHours ?? ''} onChange={handleChange} style={inputStyle} />
                        </div>
                        <div style={formGroupStyle}>
                            <label htmlFor="monthlyMaxHours">月間最大労働時間 (任意)</label>
                            <input id="monthlyMaxHours" type="number" name="monthlyMaxHours" value={ruleData.monthlyMaxHours ?? ''} onChange={handleChange} style={inputStyle} />
                        </div>
                    </div>
                )}
                
                {ruleData.ruleType === 'constraint' && (
                    <div style={formGridStyle}>
                         <h3 style={sectionTitleStyle}>制約設定</h3>
                        <div style={formGroupStyle}>
                            <label htmlFor="maxConsecutiveDays">最大連続勤務日数</label>
                            <input id="maxConsecutiveDays" type="number" name="maxConsecutiveDays" value={ruleData.maxConsecutiveDays} onChange={handleChange} style={inputStyle} />
                        </div>
                        <div style={formGroupStyle}>
                            <label htmlFor="breakRules.minWorkHoursForBreak">休憩が必要な最低勤務時間(h)</label>
                            <input id="breakRules.minWorkHoursForBreak" type="number" name="breakRules.minWorkHoursForBreak" value={ruleData.breakRules?.minWorkHoursForBreak ?? ''} onChange={handleChange} style={inputStyle} />
                        </div>
                        <div style={formGroupStyle}>
                            <label htmlFor="breakRules.breakDuration">休憩時間 (分)</label>
                            <input id="breakRules.breakDuration" type="number" name="breakRules.breakDuration" value={ruleData.breakRules?.breakDuration ?? ''} onChange={handleChange} style={inputStyle} />
                        </div>
                    </div>
                )}

                <div style={modalActionsStyle}>
                    <button style={cancelButton} onClick={onClose}>キャンセル</button>
                    <button style={saveButton} onClick={handleSave}>保存</button>
                </div>
            </div>
        </div>
    );
};

export default RuleModal;