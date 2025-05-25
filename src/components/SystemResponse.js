import React, { useState } from 'react';
import { Button, Divider, Alert } from 'antd';
import { SoundOutlined, PauseOutlined } from '@ant-design/icons';
import SpiderChart from './SpiderChart';
import EvaluationCard from './EvaluationCard';
import '../styles/chat.css';

const SystemResponse = ({ content, score, spiderData, showRadarChart = true, error }) => {
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

  // 将数据分组
  const groupData = (data) => {
    if (!data || data.length === 0) return {};

    // 根据数据特征判断类型
    const isAudioType = data.some(item => item.name === '流利度得分' || item.name === '完整度得分');
    
    if (isAudioType) {
      // 音频评分数据，不分组
      return { audioData: data };
    } else {
      // 图片和文字评分数据，分为四组
      const overview = data.filter(item => 
        item.name === '整体语言风格'
      );
      
      const deepAnalysis = data.filter(item => 
        item.name === '情感传递' || 
        item.name === '语言亮点' || 
        item.name === '学习建议' || 
        item.name === '句子'
      );
      
      const goodWordsAndSentences = data.filter(item => 
        !item.name.includes('整体') && 
        !['情感传递', '语言亮点', '学习建议', '句子'].includes(item.name) &&
        !item.name.includes('paragraph')
      );
      
      const imageTextProcessing = data.filter(item => 
        item.name.includes('paragraph') || typeof item.name === 'number'
      );
      
      return {
        overview,
        deepAnalysis,
        goodWordsAndSentences,
        imageTextProcessing
      };
    }
  };

  const renderModuleContent = (title, items) => {
    if (!items || items.length === 0) return null;
    
    return (
      <div className="response-module">
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '15px 0 10px 0', color: '#ff4d4f' }}>{title}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((item, index) => (
            <EvaluationCard key={index} name={item.name} value={item.value} content={item.content} />
          ))}
        </div>
      </div>
    );
  };

  // 安全地分组数据，确保即使数据结构异常也不会崩溃
  const groupedData = spiderData ? groupData(spiderData) : {};

  return (
    <div className="system-message">
      {/* 错误提示 */}
      {error && (
        <Alert
          message="请求异常"
          description={content || "服务器暂时无法响应，请稍后再试"}
          type="error"
          showIcon
          style={{ marginBottom: '15px' }}
        />
      )}
      
      {/* 正常内容 */}
      {!error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ margin: 0, flex: 1 }}>{content}</div>
          {/* 语音播放按钮已隐藏
          <Button 
            type="text" 
            icon={isPlaying ? <PauseOutlined /> : <SoundOutlined />} 
            onClick={handlePlayAudio}
            className="primary-button"
          />
          */}
        </div>
      )}
      
      {score ?  (
        <div className="score-container">
          <div className="score-title">AI 评分</div>
          <div className="score-value">{score}</div>
        </div>
      ):''}
      
      {/* 只有在非错误状态且有数据时才显示图表和数据 */}
      {!error && spiderData && (
        <div style={{ marginTop: 16 }}>
          {showRadarChart && groupedData.audioData && (
            <div className="spider-chart">
              <SpiderChart data={spiderData} />
            </div>
          )}
          
          {/* 音频类型的内容 */}
          {groupedData.audioData && (
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {groupedData.audioData.map((item, index) => (
                <EvaluationCard key={index} name={item.name} value={item.value} content={item.content} />
              ))}
            </div>
          )}
          
          {/* 图片和文字类型的分组内容 */}
          {!groupedData.audioData && (
            <div style={{ marginTop: 20 }}>
              {renderModuleContent('总评', groupedData.overview)}
              
              {groupedData.deepAnalysis && groupedData.deepAnalysis.length > 0 && <Divider style={{ margin: '15px 0' }} />}
              {renderModuleContent('深度分析', groupedData.deepAnalysis)}
              
              {groupedData.goodWordsAndSentences && groupedData.goodWordsAndSentences.length > 0 && <Divider style={{ margin: '15px 0' }} />}
              {renderModuleContent('好词好句', groupedData.goodWordsAndSentences)}
              
              {groupedData.imageTextProcessing && groupedData.imageTextProcessing.length > 0 && <Divider style={{ margin: '15px 0' }} />}
              {renderModuleContent('图像文本', groupedData.imageTextProcessing)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemResponse; 