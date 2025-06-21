"use client";
import React, { useState, useEffect } from 'react';
import RuleModal from './ruleModal';
import { Rule, RuleData } from './ruleModal';

const topStyle: React.CSSProperties = {
    height: '60px',
    display: 'flex',
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    padding: '0 24px'
};

const titleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
};

const createButtonStyle: React.CSSProperties = {
    marginLeft: 'auto',
    display: 'flex',
    gap: '16px',
};

const setStyle: React.CSSProperties = {
    padding: '10px 20px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#4169e1',
    color: 'white'
};

const ruleListContainerStyle: React.CSSProperties = {
    padding: '24px',
};

const ruleItemStyle: React.CSSProperties = {
    padding: '16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    marginBottom: '12px',
    backgroundColor: '#ffffff',
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
    color: '#333',
    lineHeight: 1.6
};

const ruleDeleteButtonStyle: React.CSSProperties = {
    padding: '8px 16px',
    border: '1px solid #ff4d4f',
    color: '#ff4d4f',
    backgroundColor: 'white',
    borderRadius: '5px',
    cursor: 'pointer',
    alignSelf: 'center',
    marginLeft: '16px'
};

const ruleActionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignSelf: 'center',
    marginLeft: '16px',
};
const ruleEditButtonStyle: React.CSSProperties = {
    padding: '8px 16px',
    border: '1px solid #007bff',
    color: '#007bff',
    backgroundColor: 'white',
    borderRadius: '5px',
    cursor: 'pointer',
};

function Page() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [rules, setRules] = useState<Rule[]>([]);
    const STORAGE_KEY = 'shopRules_v3';

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

    const handleSaveRule = (newRuleData: RuleData) => {
        if (!newRuleData.name.trim()){
            alert('ルール名を入力してください');
            return;
        } 

        if (editingRule) {
          const updatedRules = rules.map(rule =>
            rule.id === editingRule.id ? {...rule, ...newRuleData }: rule
          );
          setRules(updatedRules);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRules));
        } else {
            const newRule: Rule = {
                id: Date.now(),
                ...newRuleData,
            };
            const updatedRules = [...rules, newRule];
            setRules(updatedRules);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRules));
        }

        handleCloseModal();
    };

    const handleDeleteRule = (idToDelete: number) => {
        if (window.confirm('このルールを本当に削除しますか？')) {
            const updatedRules = rules.filter(rule => rule.id !== idToDelete);
            setRules(updatedRules);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRules));
        }
    };

    return (
        <div>
            <div style={topStyle}>
                <h1 style={titleStyle}>お店のルール</h1>
                <div style={createButtonStyle}>
                    <button style={setStyle} onClick={handleOpenModal}>新規作成</button>
                </div>
            </div>
            
            <div style={ruleListContainerStyle}>
                <h2>設定済ルール集</h2>
                {rules.length === 0 ? (
                    <p>現在、設定されているルールはありません。</p>
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
                                            • **最小人数:** {rule.minStaffCount}人
                                            {rule.maxStaffCount && ` / **最大人数:** ${rule.maxStaffCount}人`}
                                            <br/>
                                            • **最大連続勤務:** {rule.maxConsecutiveDays}日
                                            <br/>
                                            • **勤務時間:** {rule.workingHours.start} - {rule.workingHours.end}
                                            <br/>
                                            • **優先度:** {rule.priority} {rule.isActive ? '(有効)' : '(無効)'}
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