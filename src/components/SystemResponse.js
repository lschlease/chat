import React from 'react';
import { Card, Button } from 'antd';
import { SoundOutlined } from '@ant-design/icons';
import SpiderChart from './SpiderChart';
import EvaluationCard from './EvaluationCard';

const SystemResponse = ({ content, score, spiderData }) => {
  const handlePlayAudio = () => {
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = 'zh-CN';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <p style={{ margin: 0, flex: 1 }}>{content}</p>
        <Button 
          type="text" 
          icon={<SoundOutlined />} 
          onClick={handlePlayAudio}
          style={{ color: '#1890ff' }}
        />
      </div>
      {score && (
        <div style={{ marginTop: 16 }}>
          <h4>得分：{score}</h4>
        </div>
      )}
      {spiderData && (
        <div style={{ marginTop: 16 }}>
          <SpiderChart data={spiderData} />
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {spiderData.map((item, index) => (
              <EvaluationCard key={index} name={item.name} value={item.value} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default SystemResponse; 