import React from 'react';
import { Button } from 'antd';
import { SoundOutlined } from '@ant-design/icons';
import SpiderChart from './SpiderChart';
import EvaluationCard from './EvaluationCard';
import '../styles/chat.css';

const SystemResponse = ({ content, score, spiderData }) => {
  const handlePlayAudio = () => {
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = 'zh-CN';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="system-message">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <p style={{ margin: 0, flex: 1 }}>{content}</p>
        <Button 
          type="text" 
          icon={<SoundOutlined />} 
          onClick={handlePlayAudio}
          className="primary-button"
        />
      </div>
      {score && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ margin: 0 }}>得分：{score}</h4>
        </div>
      )}
      {spiderData && (
        <div style={{ marginTop: 16 }}>
          <div className="spider-chart">
            <SpiderChart data={spiderData} />
          </div>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {spiderData.map((item, index) => (
              <EvaluationCard key={index} name={item.name} value={item.value} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemResponse; 