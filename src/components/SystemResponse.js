import React, { useState } from 'react';
import { Button } from 'antd';
import { SoundOutlined, PauseOutlined } from '@ant-design/icons';
import SpiderChart from './SpiderChart';
import EvaluationCard from './EvaluationCard';
import '../styles/chat.css';

const SystemResponse = ({ content, score, spiderData }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayAudio = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.lang = 'zh-CN';
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  return (
    <div className="system-message">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ margin: 0, flex: 1 }}>{content}</div>
        <Button 
          type="text" 
          icon={isPlaying ? <PauseOutlined /> : <SoundOutlined />} 
          onClick={handlePlayAudio}
          className="primary-button"
        />
      </div>
      {score && (
        <div className="score-container">
          <div className="score-title">AI 评分</div>
          <div className="score-value">{score}</div>
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