"use client";
import Link from 'next/link';
import React, { useState, useEffect } from 'react'; // useEffect をインポート
import RuleModal from './ruleModal';


interface Rule {
  id: number;
  text: string;
}

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
}

const buttonStyle: React.CSSProperties = {
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
}

const ruleListContainerStyle: React.CSSProperties = {
  padding: '24px',
}

const ruleItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  marginBottom: '12px',
  backgroundColor: '#ffffff',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
}

const ruleTextStyle: React.CSSProperties = {
  fontSize: '16px',
  whiteSpace: 'pre-wrap', 
}

const ruleDeleteButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  border: '1px solid #ff4d4f',
  color: '#ff4d4f',
  backgroundColor: 'white',
  borderRadius: '5px',
  cursor: 'pointer',
}

const ruleExample: React.CSSProperties = {
    backgroundColor: '#4169e1',
    color: 'white',
    border: '1px solid #ccc',
    margin: '20px',
    padding: '20px',
    aspectRatio: '1/1',
    borderRadius: '50%',
    position: 'fixed',
    bottom: '0',
    right: '0',
}

function Page() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRuleText, setNewRuleText] = useState('');
    const [rules, setRules] = useState<Rule[]>([]);
    const STORAGE_KEY = 'shopRules';

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
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setNewRuleText('');
    };

    const handleSaveRule = (ruleText: string) => {
        if (!ruleText.trim()) return;

        const newRule: Rule = {
            id: Date.now(),
            text: ruleText,
        };
        
        const updatedRules = [...rules, newRule];
        setRules(updatedRules);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRules));
        
        handleCloseModal();
    };

    const handleDeleteRule = (idToDelete: number) => {
        const updatedRules = rules.filter(rule => rule.id !== idToDelete);
        setRules(updatedRules);

        if (updatedRules.length === 0) {
            localStorage.removeItem(STORAGE_KEY);
        } else {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRules));
        }
    };

    return (
        <div>
            <div style={topStyle}>
                <h1 style={titleStyle}>お店のルール</h1>
                <div style={buttonStyle}>
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
                      <p style={ruleTextStyle}>{rule.text}</p>
                      <button 
                        style={ruleDeleteButtonStyle} 
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Link href="./example">
                <button style={ruleExample}>
                    例えば
                </button>
            </Link>

            <RuleModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveRule}
                ruleText={newRuleText}
                setRuleText={setNewRuleText}
            />
        </div>
    ) 
}

export default Page;
