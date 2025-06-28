"use client";
import React, { useState, useEffect } from 'react';
import RuleModal, { Rule, RuleData } from './ruleModal';
import { db } from '@/lib/firebase/firebase';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';


const createButtonStyle: React.CSSProperties = {
    marginLeft: 'auto', display: 'flex', height: '50px', alignItems: 'center',
    padding: '10px 20px', borderRadius: '6px', cursor: 'pointer',
    backgroundColor: '#1EAF7A', color: 'white', border: 'none',
};
const ruleListContainerStyle: React.CSSProperties = { color: 'white' };
const ruleBook: React.CSSProperties = {
    color: '#FFFFFF', fontSize:'18px', fontWeight:'bold', paddingBottom: '24px',
};
const ruleItemStyle: React.CSSProperties = {
    // transitionプロパティは動的に設定するため、ここからは削除または上書きします
    padding: '16px', border: '3px solid #4a5568', borderRadius: '8px',
    marginBottom: '12px', backgroundColor: '#4a5568',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
};
const ruleItemContentStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', gap: '16px',
};
const ruleHeaderStyle: React.CSSProperties = { marginBottom: '10px' };
const ruleNameStyle: React.CSSProperties = {
    fontSize: '18px', fontWeight: 'bold', margin: 0
};
const ruleDetailsStyle: React.CSSProperties = {
    fontSize: '14px', color: 'white', lineHeight: 1.6,
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
};
const ruleActionsStyle: React.CSSProperties = {
    display: 'flex', gap: '12px', alignItems: 'center',
};
const ruleDeleteButtonStyle: React.CSSProperties = {
    padding: '8px 16px', color: 'white', backgroundColor: '#ff4d4f',
    borderRadius: '5px', cursor: 'pointer', border: 'none',
};
const ruleEditButtonStyle: React.CSSProperties = {
    padding: '8px 16px', color: 'white', backgroundColor: '#4285f4',
    borderRadius: '5px', cursor: 'pointer', border: 'none',
};
const mainContainerStyle: React.CSSProperties = {
    backgroundColor: '#374151', padding: '24px',
};
const headerSectionStyle: React.CSSProperties = {
    display: 'flex', marginBottom: '24px',
    padding: '0 24px',
};

function Page() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [rules, setRules] = useState<Rule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    // ▼▼▼【追加】アニメーションのトリガー用State ▼▼▼
    const [isAnimated, setIsAnimated] = useState(false);

    // --- Firestoreからデータをリアルタイムで取得 ---
    useEffect(() => {
        const rulesCollectionRef = collection(db, "rules");
        const q = query(rulesCollectionRef, orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const rulesFromFirestore: Rule[] = [];
            querySnapshot.forEach((doc) => {
                rulesFromFirestore.push({
                    id: doc.id,
                    ...(doc.data() as Omit<Rule, 'id'>)
                });
            });
            setRules(rulesFromFirestore);
            setIsLoading(false);
        }, (error) => {
            console.error("データの取得に失敗しました:", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsAnimated(true);
        }, 100);

        return () => clearTimeout(timer);
    }, []); 


    const handleOpenModal = () => {
        setEditingRule(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (ruleToEdit: Rule) => {
        setEditingRule(ruleToEdit);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingRule(null);
        setIsModalOpen(false);
    };

    const handleSaveRule = async (newRuleData: RuleData) => {
        if (!newRuleData.name.trim()){
            alert('ルール名を入力してください');
            return;
        }
        try {
            if (editingRule) {
                const ruleDocRef = doc(db, 'rules', editingRule.id);
                await updateDoc(ruleDocRef, newRuleData);
            } else {
                await addDoc(collection(db, 'rules'), {
                    ...newRuleData,
                    createdAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error("ルールの保存に失敗しました:", error);
            alert("エラーが発生しました。コンソールを確認してください。");
        }
        handleCloseModal();
    };

    const handleDeleteRule = async (idToDelete: string) => {
        if (window.confirm('このルールを本当に削除しますか？')) {
            try {
                const ruleDocRef = doc(db, 'rules', idToDelete);
                await deleteDoc(ruleDocRef);
            } catch (error) {
                console.error("ルールの削除に失敗しました:", error);
                alert("エラーが発生しました。コンソールを確認してください。");
            }
        }
    };

    const formatRuleDetails = (rule: Rule): string => {
        const details: string[] = [];
        const time = rule.isAllDay ? '終日' : `${rule.startTime} - ${rule.endTime}`;
        details.push(`時間: ${time}`);
        let staff = `最低 ${rule.minStaff}人`;
        if (rule.maxStaff) {
            staff += ` / 最高 ${rule.maxStaff}人`;
        }
        details.push(`人数: ${staff}`);
        if (rule.description) {
            details.push(`\n詳細\n${rule.description}`);
        }
        return details.join('\n');
    }

    const buttonStyle = {
        ...createButtonStyle,
        ...(isHovered ? {
            backgroundColor: '#189366', transform: 'scale(1.05)',
            transition: 'all 0.2s ease-in-out',
        } : { transition: 'all 0.2s ease-in-out' })
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
                    {isLoading ? (
                        <p>読み込み中...</p>
                    ) : rules.length === 0 ? (
                        <p>最初のルールを作成しましょう。</p>
                    ) : (
                        <div>
                            {rules.map((rule, index) => {
                                const itemAnimationStyle: React.CSSProperties = {
                                    ...ruleItemStyle,
                                    transition: `opacity 0.5s ease-out, transform 0.5s ease-out`,
                                    transitionDelay: `${index * 100}ms`,
                                    opacity: isAnimated ? 1 : 0,
                                    transform: isAnimated ? 'translateY(0)' : 'translateY(20px)',
                                };

                                return (
                                    <div key={rule.id} style={itemAnimationStyle}>
                                        <div style={ruleItemContentStyle}>
                                            <div style={{ flex: 1 }}>
                                                <div style={ruleHeaderStyle}>
                                                    <h3 style={ruleNameStyle}>{rule.name}</h3>
                                                </div>
                                                <p style={ruleDetailsStyle}>
                                                    {formatRuleDetails(rule)}
                                                </p>
                                            </div>
                                            <div style={ruleActionsStyle}>
                                                <button style={ruleEditButtonStyle} onClick={() => handleEditClick(rule)}>
                                                    編集
                                                </button>
                                                <button style={ruleDeleteButtonStyle} onClick={() => handleDeleteRule(rule.id)}>
                                                    削除
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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
    );
}

export default Page;