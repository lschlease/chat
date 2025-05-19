import React from 'react';
import { Card } from 'antd';

const EvaluationCard = ({ name, value }) => {
  const getEvaluation = (value) => {
    if (value >= 80) {
      return {
        level: '优秀',
        color: '#52c41a',
        text: '表现突出，具有很高的专业水平'
      };
    } else if (value >= 60) {
      return {
        level: '良好',
        color: '#1890ff',
        text: '表现稳定，具备基本能力'
      };
    } else {
      return {
        level: '待提升',
        color: '#ff4d4f',
        text: '需要加强学习和实践'
      };
    }
  };

  const evaluation = getEvaluation(value);

  return (
    <Card 
      size="small" 
      style={{ 
        width: '100%', 
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, color: '#1890ff' }}>{name}</h4>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '14px' }}>
            等级：<span style={{ color: evaluation.color, fontWeight: 'bold' }}>{evaluation.level}</span>
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
            {evaluation.text}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default EvaluationCard; 