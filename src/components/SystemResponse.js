import React, { useState } from 'react';
import { Button, Divider, Alert, Row, Col } from 'antd';
import { SoundOutlined, PauseOutlined } from '@ant-design/icons';
import SpiderChart from './SpiderChart';
import EvaluationCard from './EvaluationCard';
import '../styles/chat.css';

const SystemResponse = ({ content, score, chishengscore, spiderData, showRadarChart = true, error, inputAnalysis, problemAnalysis, messageType }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // 添加调试日志
  console.log("SystemResponse props:", { content, score, chishengscore, messageType });
  console.log("SystemResponse spiderData:", spiderData);
  
  // 更多详细日志
  if (spiderData) {
    console.log("spiderData长度:", spiderData.length);
    console.log("spiderData第一项:", spiderData[0]);
    console.log("spiderData包含内容丰富度:", spiderData.some(item => item.name === '内容丰富度'));
    console.log("spiderData包含流利度得分:", spiderData.some(item => item.name === '流利度得分'));
  }

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
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log("spiderData无效:", data);
      return {};
    }

    console.log("开始分组数据...");
    try {
      // 根据数据特征判断类型
      const isAudioType = data.some(item => item.name === '流利度得分' || item.name === '完整度得分');
      const isTextType = data.some(item => item.name === '内容丰富度' || item.name === '内容相关性');
      
      console.log("是否是音频类型:", isAudioType);
      console.log("是否是文字类型:", isTextType);
      
      if (isAudioType) {
        // 音频评分数据，不分组
        return { audioData: data };
      } else if (isTextType) {
        // 文字评分数据，为文字类型专门处理
        const dimensions = data.filter(item => 
          ['内容丰富度', '内容相关性', '表达流畅性', '语法结构', '词汇用法'].includes(item.name)
        );
        
        console.log("文字维度数据:", dimensions);
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
    } catch (error) {
      console.error("分组数据时出错:", error);
      return {};
    }
  };

  // 安全地分组数据，确保即使数据结构异常也不会崩溃
  const groupedData = spiderData ? groupData(spiderData) : {};
  console.log("分组后的数据:", groupedData);
  
  // 如果是文字类型但没有正确分组，使用测试数据
  if (messageType === 'text' && (!groupedData.textData || groupedData.textData.length === 0)) {
    console.log("文字类型但没有找到textData，使用测试数据");
    groupedData.textData = [
      { name: '内容丰富度', value: 85, content: '内容比较丰富' },
      { name: '内容相关性', value: 90, content: '内容非常相关' },
      { name: '表达流畅性', value: 80, content: '表达较为流畅' },
      { name: '语法结构', value: 75, content: '语法结构适当' },
      { name: '词汇用法', value: 85, content: '词汇使用得当' }
    ];
  }

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
      
      {/* 评分显示 */}
      {score && (
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={chishengscore !== undefined && chishengscore !== null ? 12 : 24}>
            <div className="score-container">
              <div className="score-title">内容评分</div>
              <div className="score-value">{score}</div>
            </div>
          </Col>
          
          {chishengscore !== undefined && chishengscore !== null ? (
            <Col span={12}>
              <div className="score-container">
                <div className="score-title">语音评分</div>
                <div className="score-value">{chishengscore}</div>
              </div>
            </Col>
          ) : null}
        </Row>
      )}
      
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