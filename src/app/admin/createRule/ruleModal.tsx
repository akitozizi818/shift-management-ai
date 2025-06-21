"use client";

import React from 'react';

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void; 
  onSave: (ruleText: string) => void; 
  ruleText: string;
  setRuleText: (text: string) => void;
}

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
  width: '500px',
  maxWidth: '90%',
};

const modalTitleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '16px',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '120px',
  padding: '8px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '16px',
  resize: 'vertical',
  boxSizing: 'border-box',
}

const modalActionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  marginTop: '20px',
}

const cancelButton: React.CSSProperties = {
  padding: '10px 20px',
  border: '1px solid #ccc',
  borderRadius: '5px',
  cursor: 'pointer',
}

const saveButton: React.CSSProperties = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  backgroundColor: '#4169e1',
  color: 'white'
}


const RuleModal: React.FC<RuleModalProps> = ({ isOpen, onClose, onSave, ruleText, setRuleText }) => {
  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave(ruleText);
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={modalTitleStyle}>新しいルールの作成</h2>
        <textarea
          style={textareaStyle}
          value={ruleText}
          onChange={(e) => setRuleText(e.target.value)}
        />
        <div style={modalActionsStyle}>
          <button style={cancelButton} onClick={onClose}>キャンセル</button>
          <button style={saveButton} onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  );
};

export default RuleModal;