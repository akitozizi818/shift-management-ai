"use client";
import React, { useState, useEffect } from 'react';
import RuleModal from './ruleModal';

interface RuleBase {
    id: number;
    name: string;
    ruleType: 'staffing' | 'schedule' | 'constraint';
    isActive: boolean;
    priority: number;
}

export interface StaffingRule extends RuleBase {
    ruleType: 'staffing';
    minStaffCount: number;
    maxStaffCount?: number;
}

export interface ScheduleRule extends RuleBase {
    ruleType: 'schedule';
    workingHours: {
        start: string;
        end: string;
    };
    weeklyMaxHours?: number;
    monthlyMaxHours?: number;
}

export interface ConstraintRule extends RuleBase {
    ruleType: 'constraint';
    maxConsecutiveDays: number;
    breakRules?: {
        minWorkHoursForBreak: number;
        breakDuration: number;
    };
}

export type Rule = StaffingRule | ScheduleRule | ConstraintRule;

export type RuleFormData = {
    name: string;
    ruleType: 'staffing' | 'schedule' | 'constraint';
    minStaffCount: number;
    maxStaffCount?: number;
    maxConsecutiveDays: number;
    workingHours: {
        start: string;
        end: string;
    };
    weeklyMaxHours?: number;
    monthlyMaxHours?: number;
    breakRules?: {
        minWorkHoursForBreak: number;
        breakDuration: number;
    };
    isActive: boolean;
    priority: number;
};

const createButtonStyle: React.CSSProperties = {
    marginLeft: 'auto',
    display: 'flex',
    height: '50px',
    alignItems: 'center',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    backgroundColor: '#1EAF7A',
    color: 'white',
    border: 'none',
};
const ruleListContainerStyle: React.CSSProperties = {
    color: 'white',
};
const ruleBook: React.CSSProperties = {
    color: '#FFFFFF',
    fontSize:'18px', 
    fontWeight:'bold',
    paddingBottom: '24px',
};
const ruleItemStyle: React.CSSProperties = {
    padding: '16px',
    border: '3px solid #4a5568',
    borderRadius: '8px',
    marginBottom: '12px',
    backgroundColor: '#4a5568',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
};
const ruleItemContentStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
};
const ruleHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '10px',
};
const ruleNameStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0
};
const ruleTypeBadgeStyle: React.CSSProperties = {
    backgroundColor: '#6c757d',
    color: 'white',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    textTransform: 'uppercase'
};
const ruleDetailsStyle: React.CSSProperties = {
    fontSize: '14px',
    color: 'white',
    lineHeight: 1.6
};
const ruleDeleteButtonStyle: React.CSSProperties = {
    padding: '8px 16px',
    color: 'white',
    backgroundColor: '#ff4d4f',
    borderRadius: '5px',
    cursor: 'pointer',
    alignSelf: 'center',
    marginLeft: '16px'
};
const ruleEditButtonStyle: React.CSSProperties = {
    padding: '8px 16px',
    color: 'white',
    backgroundColor: '#4285f4',
    borderRadius: '5px',
    cursor: 'pointer',
};
const mainContainerStyle: React.CSSProperties = {
    backgroundColor: '#374151', 
    padding: '24px',
};
const headerSectionStyle: React.CSSProperties = {
    display: 'flex',
    marginBottom: '24px',
};

function Page() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [rules, setRules] = useState<Rule[]>([]);
    const STORAGE_KEY = 'shopRules_v4';
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        try {
            const savedRules = localStorage.getItem(STORAGE_KEY);
            if (savedRules) {
                setRules(JSON.parse(savedRules));
            }
        } catch (error) {
            console.error("Failed to parse rules from localStorage", error);
        }
    }, []);

    const handleOpenModal = () => {
      setEditingRule(null);
      setIsModalOpen(true);
    };

    const handleEditClick = (ruleToEdit: Rule)  => {
      setEditingRule(ruleToEdit);
      setIsModalOpen(true);
    };

    const handleCloseModal = () => {
      setEditingRule(null);
      setIsModalOpen(false);
    };

    const handleSaveRule = (formData: RuleFormData) => {
        if (!formData.name.trim()){
            alert('ルール名を入力してください');
            return;
        } 

        let cleanRule: Rule;
        const baseData = {
            id: editingRule ? editingRule.id : Date.now(),
            name: formData.name,
            ruleType: formData.ruleType,
            isActive: formData.isActive,
            priority: formData.priority,
        };

        switch (formData.ruleType) {
            case 'staffing':
                cleanRule = {
                    ...baseData,
                    ruleType: 'staffing',
                    minStaffCount: formData.minStaffCount,
                    maxStaffCount: formData.maxStaffCount,
                };
                break;
            case 'schedule':
                cleanRule = {
                    ...baseData,
                    ruleType: 'schedule',
                    workingHours: formData.workingHours,
                    weeklyMaxHours: formData.weeklyMaxHours,
                    monthlyMaxHours: formData.monthlyMaxHours,
                };
                break;
            case 'constraint':
                cleanRule = {
                    ...baseData,
                    ruleType: 'constraint',
                    maxConsecutiveDays: formData.maxConsecutiveDays,
                    breakRules: formData.breakRules,
                };
                break;
        }

        const updatedRules = editingRule
            ? rules.map(r => r.id === editingRule.id ? cleanRule : r)
            : [...rules, cleanRule];
        
        setRules(updatedRules);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRules));

        handleCloseModal();
    };

    const handleDeleteRule = (idToDelete: number) => {
        if (window.confirm('このルールを本当に削除しますか？')) {
            const updatedRules = rules.filter(rule => rule.id !== idToDelete);
            setRules(updatedRules);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRules));
        }
    };

    const buttonStyle = {
        ...createButtonStyle,
        ...(isHovered ? {
            backgroundColor: '#189366', 
            transform: 'scale(1.05)',
        } : {})
    };

    return (
        <div>
            <div style={headerSectionStyle}>
                <button
                    style={buttonStyle} 
                    onClick={handleOpenModal}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    新規作成
                </button>
            </div>
            <div style={mainContainerStyle}>    
                <div style={ruleListContainerStyle}>
                    <h2 style={ruleBook}>設定済ルール集</h2>
                    {rules.length === 0 ? (
                        <p>最初のルールを作成しましょう。</p>
                    ) : (
                        <div>
                            {rules.map(rule => (
                                <div key={rule.id} style={ruleItemStyle}>
                                    <div style={ruleItemContentStyle}>
                                        <div>
                                            <div style={ruleHeaderStyle}>
                                                <span style={ruleTypeBadgeStyle}>{rule.ruleType}</span>
                                                <h3 style={ruleNameStyle}>{rule.name}</h3>
                                            </div>
                                            <div style={ruleDetailsStyle}>
                                                {rule.ruleType === 'staffing' && (
                                                    <>
                                                        • 最小人数: {rule.minStaffCount}人
                                                        {rule.maxStaffCount && ` / 最大人数: ${rule.maxStaffCount}人`}
                                                    </>
                                                )}
                                                {rule.ruleType === 'schedule' && (
                                                    <>
                                                        • 勤務時間: {rule.workingHours.start} - {rule.workingHours.end}
                                                        {rule.weeklyMaxHours && <div>• 週間最大労働時間: {rule.weeklyMaxHours}時間</div>}
                                                        {rule.monthlyMaxHours && <div>• 月間最大労働時間: {rule.monthlyMaxHours}時間</div>}
                                                    </>
                                                )}
                                                {rule.ruleType === 'constraint' && (
                                                    <>
                                                        • 最大連続勤務: {rule.maxConsecutiveDays}日
                                                        {rule.breakRules?.minWorkHoursForBreak && (
                                                            <div>
                                                                • 休憩: {rule.breakRules.minWorkHoursForBreak}時間勤務で{rule.breakRules.breakDuration}分
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                <div style={{marginTop: '4px'}}>
                                                    • 優先度: {rule.priority} {rule.isActive ? '(有効)' : '(無効)'}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <button 
                                                style={ruleEditButtonStyle} 
                                                onClick={() => handleEditClick(rule)}
                                            >
                                                編集
                                            </button>
                                            <button 
                                                style={ruleDeleteButtonStyle} 
                                                onClick={() => handleDeleteRule(rule.id)}
                                            >
                                                削除
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <RuleModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveRule}
                existingRule={editingRule}
            />
        </div>
    ) 
}

export default Page;