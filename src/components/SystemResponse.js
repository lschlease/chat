import React, { useState } from 'react';
import { Button, Divider, Alert } from 'antd';
import { SoundOutlined, PauseOutlined } from '@ant-design/icons';
import SpiderChart from './SpiderChart';
import EvaluationCard from './EvaluationCard';
import '../styles/chat.css';

const SystemResponse = ({ content, score, chishengscore,spiderData, showRadarChart = true, error, inputAnalysis, problemAnalysis, messageType }) => {
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

  // 根据messageType判断是否显示雷达图，图片类型不显示
  const shouldShowRadarChart = messageType !== 'image';

  // 将数据分组
  const groupData = (data) => {
    if (!data || data.length === 0) return {};

    // 根据数据特征判断类型
    const isAudioType = data.some(item => item.name === '流利度得分' || item.name === '完整度得分');
    const isTextType = data.some(item => item.name === '内容丰富度' || item.name === '内容相关性');
    
    if (isAudioType) {
      // 音频评分数据，不分组
      return { audioData: data };
    } else if (isTextType) {
      // 文字评分数据，为文字类型专门处理
      const dimensions = data.filter(item => 
        ['内容丰富度', '内容相关性', '表达流畅性', '语法结构', '词汇用法'].includes(item.name)
      );
      
      return { textData: dimensions };
    } else {
      // 图片评分数据，分为四组
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
      {!error ? (
        <>
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
        </>
      ) : (
        <Alert
          message="错误"
          description={content}
          type="error"
          showIcon
        />
      )}
      
      {score ? (
        <div className="score-container">
          <div className="score-title">AI 评分</div>
          <div className="score-value">{score}</div>

          <div className="score-title">声音 评分</div>
          <div className="score-value">{chishengscore}</div>
        </div>
      ):''}
      
      {/* 只有在非错误状态且有数据时才显示图表和数据 */}
      {!error && spiderData && (
        <div style={{ marginTop: 16 }}>
          {/* 只有非图片类型时才显示雷达图 */}
          {shouldShowRadarChart && (
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
          
          {/* 文字类型的内容 */}
          {groupedData.textData && (
            <div style={{ marginTop: 20 }}>
              {/* 如果有音频数据，显示音频评分信息 */}
              {inputAnalysis && inputAnalysis.audioScore && (
                <div className="audio-score-info" style={{ marginBottom: 20, padding: 15, backgroundColor: '#f0f8ff', borderRadius: 8, border: '1px solid #d9e8ff' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#1890ff' }}>音频评分信息</h3>
                  <div style={{ fontSize: '14px', lineHeight: 1.5 }}>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontWeight: 'bold' }}>总体评分: </span>
                      <span>{inputAnalysis.audioScore}</span>
                    </div>
                    <div>该评分基于您的语音输入，同时我们已将您的语音转换为文字进行文本分析。</div>
                  </div>
                </div>
              )}
              
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '15px 0 10px 0', color: '#ff4d4f' }}>量纲分析</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {groupedData.textData.map((item, index) => (
                  <EvaluationCard key={index} name={item.name} value={item.value} content={item.content} />
                ))}
              </div>
              
              <Divider style={{ margin: '20px 0' }} />
              
              {/* 输入分析模块 - 简化为纯文本显示 */}
              {inputAnalysis && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#ff4d4f' }}>输入分析</h3>
                  <p>{typeof inputAnalysis === 'string' ? inputAnalysis : (inputAnalysis.text || '')}</p>
                </div>
              )}
              
              {/* 问题分析模块 - 简化为纯文本显示 */}
              {problemAnalysis && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#ff4d4f' }}>问题分析</h3>
                  <p>{typeof problemAnalysis === 'string' ? problemAnalysis : (problemAnalysis.summary || '')}</p>
                </div>
              )}
            </div>
          )}
          
          {/* 图片类型的分组内容 */}
          {!groupedData.audioData && !groupedData.textData && (
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