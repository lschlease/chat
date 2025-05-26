import React, { useState, useEffect, useRef } from 'react';
import { List, message, Button } from 'antd';
import UserMessage from './UserMessage';
import SystemResponse from './SystemResponse';
import MessageInput from './MessageInput';
import '../styles/chat.css';
import welcomeIcon from '../assets/語文推廣委員會_有字.png';

// API配置
const API_CONFIG = {
  text: 'http://117.50.192.174:8000/ovis_chat',
  image: 'http://117.50.192.174:8000/ovis_chat',
  audio: 'https://gapsk-plus-api.gapsk.org/asr/asr_processor/'
};

// 默认响应数据
const DEFAULT_RESPONSE = {
  text: '很高兴为您服务',
  score: 80,
  spiderData: [
    { name: '流利度得分', value: 80 },
    { name: '完整度得分', value: 85 },
    { name: '准确度得分', value: 75 },
    { name: '声调得分', value: 90 },
    { name: '无调发音得分', value: 85 }
  ]
};

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const audioChunks = useRef([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];

      recorder.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/wav' });
        setAudioBlob(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setInputValue('正在录音...');
    } catch (err) {
      message.error('无法访问麦克风');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setInputValue('录音完成，点击发送');
    }
  };

  const handleImageSelect = (info) => {
    if (info.file) {
      setImageFile(info.file);
      setInputValue('图片已选择，点击发送');
    }
  };

  // 将audioBlob转换为WAV格式，但不自动下载
  const convertToWav = async (audioBlob) => {
    try {
      // 创建音频上下文
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // 解码音频数据
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // 创建一个离线音频上下文以生成WAV
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      // 创建音频源
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start(0);

      // 渲染音频数据
      const renderedBuffer = await offlineContext.startRendering();

      // 将AudioBuffer转换为WAV格式
      const wavBlob = audioBufferToWav(renderedBuffer);

      // 创建WAV文件
      const wavFile = new File([wavBlob], 'recording.wav', { type: 'audio/wav' });
      console.log("WAV文件创建成功:", wavFile);

      return wavFile;
    } catch (error) {
      console.error("转换WAV失败:", error);
      // 如果转换失败，使用原始音频文件
      return new File([audioBlob], 'recording.mp3', { type: 'audio/mp3' });
    }
  };

  // AudioBuffer转换为WAV格式
  function audioBufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2;
    const sampleRate = buffer.sampleRate;

    // 创建WAV文件头
    const wav = new ArrayBuffer(44 + length);
    const view = new DataView(wav);

    // RIFF标识
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, 'WAVE');

    // fmt数据块
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // 数据块大小
    view.setUint16(20, 1, true); // PCM格式
    view.setUint16(22, numOfChan, true); // 通道数
    view.setUint32(24, sampleRate, true); // 采样率
    view.setUint32(28, sampleRate * numOfChan * 2, true); // 每秒字节数
    view.setUint16(32, numOfChan * 2, true); // 数据块对齐
    view.setUint16(34, 16, true); // 位深度

    // 数据块
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);

    // 写入PCM采样数据
    const offset = 44;
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      const channel = buffer.getChannelData(i);
      for (let j = 0; j < channel.length; j++) {
        const index = offset + (j * numOfChan + i) * 2;
        const sample = Math.max(-1, Math.min(1, channel[j]));
        view.setInt16(index, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      }
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  // 写入字符串到DataView
  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // 统一的请求处理函数
  const request = async (url, formData) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        console.error('网络请求失败, 状态码:', response.status);
        // 返回带有错误信息的对象，保持与其他返回格式一致
        return {
          isJson: false,
          text: `请求失败，状态码: ${response.status}`,
          error: true
        };
      }

      // 先获取原始响应文本
      const rawText = await response.text();
      console.log("Raw response:", rawText);

      try {
        // 尝试解析JSON
        const data = JSON.parse(rawText);
        // 如果是JSON格式，直接返回
        return {
          isJson: true,
          data: data
        };
      } catch (parseError) {
        console.log("Response is not JSON, using raw text");
        // 如果不是JSON，返回原始文本
        return {
          isJson: false,
          text: rawText
        };
      }
    } catch (error) {
      console.error('Request error:', error);
      return {
        isJson: false,
        text: '请求失败，请稍后重试',
        error: true
      };
    }
  };

  // 添加消息到列表
  const addMessage = (userMessage, responseData) => {
    setMessages(prev => {
      // 移除loading消息，保留之前的消息
      const newMessages = prev.filter(msg => msg.type !== 'loading');
      // 如果最后一条消息不是用户消息，才添加用户消息
      const lastMessage = newMessages[newMessages.length - 1];
      const shouldAddUserMessage = !lastMessage || lastMessage.type !== 'user';

      console.log("ResponseData:999", responseData);

      // 检查是否有错误
      if (responseData.error) {
        return [
          ...newMessages,
          ...(shouldAddUserMessage ? [userMessage] : []),
          {
            type: 'response',
            messageType: responseData.messageType || 'unknown',
            content: responseData.text || '请求失败，请稍后重试',
            score: null,
            spiderData: null,
            imageUrl: null,
            error: true
          }
        ];
      }

      // 根据messageType判断类型，保持与发送时的判断一致
      // 音频转换为文字的情况
      if (responseData.messageType === 'text' && responseData.audioData) {
        const data = JSON.parse(responseData.data)
        console.log("data666",data)
        // 处理维度分析数据
        const processDimensionData = (dimension, name) => {
          if (!dimension) return { name, value: 0, content: '暂无数据' };

          const reason = dimension.scoring_reason || '';
          const performance = dimension.text_performance || '';
          const content = [reason, performance].filter(Boolean).join('\n\n') || '暂无详细数据';

          return {
            name,
            value: dimension.score || 0,
            content
          };
        };

        // 获取维度分析数据
        const dimensionAnalysis = data?.dimension_analysis || {};

        // 准备输入分析和问题分析数据
        const inputAnalysis = [
          data?.input_analysis?.content_relevance,
          data?.input_analysis?.response_text,
          data?.input_analysis?.subjective_question
        ].filter(Boolean).join('\n') || '暂无输入分析数据';

        const problemAnalysis = [
          data?.question_analysis?.question_type,
          data?.question_analysis?.expected_content
        ].filter(Boolean).join('\n') || '暂无问题分析数据';

        // 准备雷达图数据
        const spiderData = [
          { dimension: dimensionAnalysis?.content_abundance, name: '内容丰富度' },
          { dimension: dimensionAnalysis?.content_relevance, name: '内容相关性' },
          { dimension: dimensionAnalysis?.expression_fluidity, name: '表达流畅性' },
          { dimension: dimensionAnalysis?.grammatical_structure, name: '语法结构' },
          { dimension: dimensionAnalysis?.vocabulary_usage, name: '词汇用法' }
        ].map(item => processDimensionData(item.dimension, item.name));

        return [
          ...newMessages,
          ...(shouldAddUserMessage ? [userMessage] : []),
          {
            type: 'response',
            messageType: 'text',
            content: '主观题完成评分',
            score: data?.overall_score,
            // inputAnalysis,
            // problemAnalysis,
            spiderData,
            imageUrl: null
          }
        ];
  
      }
      // 文字类型
      if (responseData.messageType === 'text') {
        // 处理维度分析数据
        const processDimensionData = (dimension, name) => {
          if (!dimension) return { name, value: 0, content: '暂无数据' };

          const reason = dimension.scoring_reason || '';
          const performance = dimension.text_performance || '';
          const content = [reason, performance].filter(Boolean).join('\n\n') || '暂无详细数据';

          return {
            name,
            value: dimension.score || 0,
            content
          };
        };

        // 获取维度分析数据
        const dimensionAnalysis = responseData?.dimension_analysis || {};

        // 准备输入分析和问题分析数据
        const inputAnalysis = [
          responseData?.input_analysis?.content_relevance,
          responseData?.input_analysis?.response_text,
          responseData?.input_analysis?.subjective_question
        ].filter(Boolean).join('\n') || '暂无输入分析数据';

        const problemAnalysis = [
          responseData?.question_analysis?.question_type,
          responseData?.question_analysis?.expected_content
        ].filter(Boolean).join('\n') || '暂无问题分析数据';

        // 准备雷达图数据
        const spiderData = [
          { dimension: dimensionAnalysis?.content_abundance, name: '内容丰富度' },
          { dimension: dimensionAnalysis?.content_relevance, name: '内容相关性' },
          { dimension: dimensionAnalysis?.expression_fluidity, name: '表达流畅性' },
          { dimension: dimensionAnalysis?.grammatical_structure, name: '语法结构' },
          { dimension: dimensionAnalysis?.vocabulary_usage, name: '词汇用法' }
        ].map(item => processDimensionData(item.dimension, item.name));

        return [
          ...newMessages,
          ...(shouldAddUserMessage ? [userMessage] : []),
          {
            type: 'response',
            messageType: 'text',
            content: '文字完成评分',
            score: responseData?.overall_score,
            inputAnalysis,
            problemAnalysis,
            spiderData,
            imageUrl: null
          }
        ];
      }
      // 图片类型
      if (responseData.messageType === 'image') {
        // 安全地获取数据，避免undefined错误
        const processImageData = () => {
          let overview = [];
          let deepAnalysis = [];
          let goodWordsAndSentences = [];
          let imageTextProcessing = [];

          try {
            // 处理总评数据
            overview.push({
              name: '整体语言风格',
              value: null,
              content: responseData?.overall_language_style || '暂无数据'
            });

            // 处理深度分析数据
            if (responseData.depth_analysis_table && responseData.depth_analysis_table[0]) {
              const analysis = responseData.depth_analysis_table[0];
              deepAnalysis = [
                { name: '情感传递', value: null, content: analysis.emotion_transmission || '暂无数据' },
                { name: '语言亮点', value: null, content: analysis.language_highlights || '暂无数据' },
                { name: '学习建议', value: null, content: analysis.learning_suggestions || '暂无数据' },
                { name: '句子', value: null, content: analysis.sentence || '暂无数据' }
              ];
            }

            // 处理好词好句
            if (responseData.good_words_sentences && Array.isArray(responseData.good_words_sentences)) {
              goodWordsAndSentences = responseData.good_words_sentences.map(item => ({
                name: item.position || '好词好句',
                value: item.priority || null,
                content: item.sentence || '暂无数据'
              }));
            }

            // 处理图像文本
            if (responseData.image_text_processing &&
              responseData.image_text_processing.paragraphs &&
              Array.isArray(responseData.image_text_processing.paragraphs)) {
              imageTextProcessing = responseData.image_text_processing.paragraphs.map(item => ({
                name: item.paragraph_number || '段落',
                value: item.value || null,
                content: item.content || '暂无数据'
              }));
            }
          } catch (error) {
            console.error("处理图片数据时出错:", error);
          }

          // 确保每个类别至少有一个项目
          if (deepAnalysis.length === 0) {
            deepAnalysis.push({ name: '深度分析', value: null, content: '暂无数据' });
          }
          if (goodWordsAndSentences.length === 0) {
            goodWordsAndSentences.push({ name: '好词好句', value: null, content: '暂无数据' });
          }
          if (imageTextProcessing.length === 0) {
            imageTextProcessing.push({ name: '图像文本', value: null, content: '暂无数据' });
          }

          return [...overview, ...deepAnalysis, ...goodWordsAndSentences, ...imageTextProcessing];
        };

        return [
          ...newMessages,
          ...(shouldAddUserMessage ? [userMessage] : []),
          {
            type: 'response',
            messageType: 'image',
            content: '图片评分完成',
            score: null,
            spiderData: processImageData(),
            imageUrl: responseData.imageUrl || null
          }
        ];
      }
      // 音频类型
      if (responseData.messageType === 'audio') {
        
        // 处理维度分析数据
        const processDimensionData = (dimension, name) => {
          if (!dimension) return { name, value: 0, content: '暂无数据' };

          const reason = dimension.scoring_reason || '';
          const performance = dimension.text_performance || '';
          const content = [reason, performance].filter(Boolean).join('\n\n') || '暂无详细数据';

          return {
            name,
            value: dimension.score || 0,
            content
          };
        };

        // 获取维度分析数据
        const dimensionAnalysis = responseData?.dimension_analysis || {};

        // 准备输入分析和问题分析数据
        const inputAnalysis = [
          responseData?.input_analysis?.content_relevance,
          responseData?.input_analysis?.response_text,
          responseData?.input_analysis?.subjective_question
        ].filter(Boolean).join('\n') || '暂无输入分析数据';

        const problemAnalysis = [
          responseData?.question_analysis?.question_type,
          responseData?.question_analysis?.expected_content
        ].filter(Boolean).join('\n') || '暂无问题分析数据';

        // 准备雷达图数据
        const spiderData = [
          { dimension: dimensionAnalysis?.content_abundance, name: '内容丰富度' },
          { dimension: dimensionAnalysis?.content_relevance, name: '内容相关性' },
          { dimension: dimensionAnalysis?.expression_fluidity, name: '表达流畅性' },
          { dimension: dimensionAnalysis?.grammatical_structure, name: '语法结构' },
          { dimension: dimensionAnalysis?.vocabulary_usage, name: '词汇用法' }
        ].map(item => processDimensionData(item.dimension, item.name));

        return [
          ...newMessages,
          ...(shouldAddUserMessage ? [userMessage] : []),
          {
            type: 'response',
            messageType: 'text',
            content: '文字完成评分',
            score: responseData?.overall_score,
            inputAnalysis,
            problemAnalysis,
            spiderData,
            imageUrl: null
          }
        ];

      }
      // 兜底
      return [
        ...newMessages,
        ...(shouldAddUserMessage ? [userMessage] : []),
        {
          type: 'response',
          messageType: 'unknown',
          content: responseData.text || '未知类型数据',
          score: null,
          spiderData: null,
          imageUrl: null
        }
      ];
    });
  };

  // 添加loading消息
  const addLoadingMessage = (userMessage) => {
    setMessages(prev => [...prev, userMessage, { type: 'loading' }]);
  };

  // 添加音频转文字函数
  const convertSpeechToText = async (audioBlob) => {
    // 这里可以集成实际的语音识别API，目前使用模拟数据
    return new Promise((resolve) => {
      console.log("正在将音频转换为文字...");
      // 模拟语音识别延迟
      setTimeout(() => {
        // 这里可以替换为实际的语音识别API调用
        const recognizedText = "这是从音频识别出的文字内容。实际使用时请集成语音识别API。";
        console.log("音频转文字完成:", recognizedText);
        resolve(recognizedText);
      }, 500);
    });
  };

  const handleSend = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (!inputValue.trim() && !audioBlob && !imageFile) return;

    let formData = new FormData();
    let userMessage = null;
    let apiUrl = '';
    // 记录消息类型，与接收时判断保持一致
    let messageType = '';
    let localAudioBlob = null;

    // 准备请求数据
    if (audioBlob) {
      // 将MP3转换为WAV格式
      const wavFile = await convertToWav(audioBlob);
      localAudioBlob = wavFile; // 保存一份引用

      // 创建用户消息（包含音频链接）
      userMessage = {
        type: 'user',
        content: '语音',
        audioUrl: URL.createObjectURL(audioBlob)
      };

      // 显示loading
      addLoadingMessage(userMessage);
      setIsLoading(true);

      try {
        // 首先发送到音频接口获取评分
        const audioFormData = new FormData();
        audioFormData.append('word', 'test');
        audioFormData.append('audio_file', wavFile);

        const audioResponse = await request(API_CONFIG.audio, audioFormData);
        console.log("Audio Response:", audioResponse);

        // 然后将音频转换为文字
        const recognizedText = await convertSpeechToText(audioBlob);

        // 发送文字到文字接口
        const textFormData = new FormData();
        const parms = {
          quesstion: currentQuestion === 1 ? '第一题：说说你对人生的感悟 （2分钟）' : '第一题：说说你对人生的感悟 （2分钟）',
          text: audioResponse?.data?.data?.text || '',
          type: currentQuestion === 1 ? "主观题" : "主观题",
          // 添加音频评分信息，方便展示在文字结果中
          // audioScore: audioResponse.data?.overall || 0,
          // audioAnalysis: audioResponse.data || {}
        };
        textFormData.append('text', JSON.stringify(parms));
        // textFormData.append('image', wavFile);

        const textResponse = await request(API_CONFIG.text, textFormData);
        console.log("Text Response:", textResponse);

        // 合并音频和文字的响应
        const combinedResponse = {
          ...textResponse,
          messageType: 'text', // 按文字类型处理
          audioData: audioResponse.data // 保存音频评分数据
        };

        // 更新消息列表
        addMessage(userMessage, combinedResponse);
      } catch (error) {
        console.error('处理音频失败:', error);
        message.error('处理音频失败，请稍后重试');
        addMessage(userMessage, {
          isJson: false,
          text: '处理音频失败，请稍后重试',
          messageType: 'text',
          error: true
        });
      } finally {
        setAudioBlob(null);
        setIsLoading(false);
      }
      return; // 提前返回，避免执行后面的代码
    } else if (imageFile) {
      formData.append('image', imageFile);
      userMessage = {
        type: 'user',
        content: '图片',
        imageUrl: URL.createObjectURL(imageFile)
      };
      apiUrl = API_CONFIG.image;
      setImageFile(null);
      messageType = 'image';
    } else {
      const parms = {
        quesstion: currentQuestion === 1 ? '第一题：说说你对人生的感悟 （2分钟）' : '第一题：说说你对人生的感悟 （2分钟）',
        text: currentQuestion === 1 ? inputValue : inputValue,
        type: currentQuestion === 1 ? "主观题" : "主观题"
      }
      formData.append('text', JSON.stringify(parms));
      userMessage = {
        type: 'user',
        content: inputValue
      };
      apiUrl = API_CONFIG.text;
      messageType = 'text';
    }

    // 清除输入
    setInputValue('');

    // 显示loading
    addLoadingMessage(userMessage);
    setIsLoading(true);

    try {
      // 发送请求
      const response = await request(apiUrl, formData);
      console.log("Response:text", response);

      // 确保响应数据包含消息类型信息
      let responseWithType = response;

      // 检查响应是否包含错误
      if (response.error) {
        // 返回错误信息
        addMessage(userMessage, {
          isJson: false,
          text: response.text || '请求失败，请稍后重试',
          messageType,
          error: true
        });
      } else {
        // 正常处理响应
        if (response.isJson) {
          try {
            let parsedData;
            if (typeof response.data === 'string') {
              parsedData = JSON.parse(response.data);
            } else {
              parsedData = response.data;
            }
            responseWithType = { ...parsedData, messageType };
          } catch (parseError) {
            console.error("解析数据失败:", parseError);
            responseWithType = { ...response, messageType, error: true };
          }
        } else {
          responseWithType = { ...response, messageType };
        }

        // 更新消息列表
        addMessage(userMessage, responseWithType);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      message.error('发送消息失败，请稍后重试');
      addMessage(userMessage, {
        isJson: false,
        text: '请求失败，请稍后重试',
        messageType,
        error: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setAudioBlob(null);
    setImageFile(null);
    setInputValue('');
  };

  const renderMessage = (msg, index) => {
    if (msg.type === 'user') {
      return <UserMessage content={msg.content} imageUrl={msg.imageUrl} audioUrl={msg.audioUrl} />;
    }
    if (msg.type === 'loading') {
      return (
        <div className="system-message" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ color: '#1890ff', fontSize: '15px', fontWeight: 500 }}>
            AI正在分析
          </div>
          <div className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      );
    }
    
    // 新增：图片类型渲染
    if (msg.imageUrl) {
      return (
        <div className="system-message">
          <div>图片已返回：</div>
          <img src={msg.imageUrl} alt="返回图片" style={{ maxWidth: '300px', marginTop: '8px' }} />
        </div>
      );
    }
    
    // 所有类型都显示雷达图
    return <SystemResponse
      content={msg.content}
      score={msg.score}
      spiderData={msg.spiderData}
      showRadarChart={true}
      error={msg.error || false}
      inputAnalysis={msg.inputAnalysis}
      problemAnalysis={msg.problemAnalysis}
      messageType={msg.messageType || 'text'}
    />;
  };

  return (
    <div className="chat-container">
      <List
        dataSource={messages.length === 0 ? [{
          type: 'system',
          content: '很高兴为您服务',
          isWelcome: true
        }] : messages}
        renderItem={(item) => {
          if (item.isWelcome) {
            return (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <img
                  src={welcomeIcon}
                  alt="欢迎图标"
                  style={{ width: '248px', height: 'auto', marginBottom: '16px' }}
                />
                {/* <h2 style={{ color: '#1890ff', margin: 0 }}>很高兴为您服务</h2> */}

                <h2 style={{ color: '#222', margin: '20px 0' }}>{currentQuestion === 1 ? 'HSK高级考试' : '文章点评'}</h2>

                {currentQuestion === 1 ? (
                  <div>
                    <h2 style={{ color: '#222', margin: '20px 0' }}>第一题：说说你对人生的感悟 （2分钟）</h2>
                    <div style={{ marginBottom: '20px' }}>
                      <Button
                        type="primary"
                        onClick={() => setCurrentQuestion(2)}
                        style={{ marginRight: '10px' }}
                      >
                        下一题
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 style={{ color: '#222', margin: '20px 0' }}>第二题：请输入文章内容或者上传图片</h2>
                    <div style={{ marginBottom: '20px' }}>
                      <Button
                        type="primary"
                        onClick={() => setCurrentQuestion(1)}
                        style={{ marginRight: '10px' }}
                      >
                        上一题
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          }
          return renderMessage(item);
        }}
        className="message-list"
      />
      <div ref={messagesEndRef} />
      <MessageInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        isRecording={isRecording}
        imageFile={imageFile}
        audioBlob={audioBlob}
        onSend={handleSend}
        onClear={handleClear}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onImageSelect={handleImageSelect}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ChatInterface; 