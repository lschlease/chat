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
  audio: 'https://gapsk-plus-api.gapsk.org/scoring/paragraph_scoring/'
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
      // 文字类型
      if (responseData.messageType === 'text') {
        return [
          ...newMessages,
          ...(shouldAddUserMessage ? [userMessage] : []),
          {
            type: 'response',
            messageType: 'text',
            content: '文字完成评分',
            score: responseData.data?.data?.overall || 0,
            spiderData: [
              { name: '流利度得分', value: responseData.data?.data?.fluency?.overall || 0 },
              { name: '完整度得分', value: responseData.data?.data?.integrity || 0 },
              { name: '准确度得分', value: responseData.data?.data?.accuracy || 0 },
              { name: '声调得分', value: responseData.data?.data?.tone || 0 },
              { name: '无调发音得分', value: responseData.data?.data?.phn || 0 }
            ],
            imageUrl: null
          }
        ];
      }
      // 图片类型
      if (responseData.messageType === 'image') {
        // 安全地获取数据，避免undefined错误
        let depth_analysis_table = [];
        let good_words_sentences = [];
        let image_text_processing = [];
        
        try {
          // 检查是否存在数据并安全处理
          if (responseData.depth_analysis_table && Array.isArray(responseData.depth_analysis_table)) {
            depth_analysis_table = responseData.depth_analysis_table.map(item => {
              return {
                name: item.name || '',
                value: item.value || null,
                content: item.content || ''
              }
            });
          }
        } catch (error) {
          console.error("处理depth_analysis_table时出错:", error);
        }
        
        try {
          if (responseData.good_words_sentences && Array.isArray(responseData.good_words_sentences)) {
            good_words_sentences = responseData.good_words_sentences.map(item => {
              return {
                name: item.position || '',
                value: item.priority || null,
                content: item.sentence || ''
              }
            });
          }
        } catch (error) {
          console.error("处理good_words_sentences时出错:", error);
        }
        
        try {
          if (responseData.image_text_processing && 
              responseData.image_text_processing.paragraphs && 
              Array.isArray(responseData.image_text_processing.paragraphs)) {
            image_text_processing = responseData.image_text_processing.paragraphs.map(item => {
              return {
                name: item.paragraph_number || '',
                value: item.value || null,
                content: item.content || ''
              }
            });
          }
        } catch (error) {
          console.error("处理image_text_processing时出错:", error);
        }
        
        console.log("depth_analysis_table", depth_analysis_table);
        console.log("good_words_sentences", good_words_sentences);
        console.log("image_text_processing", image_text_processing);

        return [
          ...newMessages,
          ...(shouldAddUserMessage ? [userMessage] : []),
          {
            type: 'response',
            messageType: 'image',
            content: '图片评分完成',
            score: null,
            spiderData: [
              //总评
              { name: '整体语言风格', value: null, content: responseData?.overall_language_style || '暂无数据' },
              // 深度分析表
              { name: '情感传递', value: null, content: responseData?.depth_analysis_table?.[0]?.emotion_transmission || '暂无数据'},
              { name: '语言亮点', value: null, content: responseData?.depth_analysis_table?.[0]?.language_highlights || '暂无数据'},
              { name: '学习建议', value: null, content: responseData?.depth_analysis_table?.[0]?.learning_suggestions || '暂无数据' },
              { name: '句子', value: null, content: responseData?.depth_analysis_table?.[0]?.sentence || '暂无数据' },
              // 好词好句
              ...(good_words_sentences.length > 0 ? good_words_sentences : [{ name: '好词好句', value: null, content: '暂无数据' }]),
              // 图像文本处理
              ...(image_text_processing.length > 0 ? image_text_processing : [{ name: '图像文本', value: null, content: '暂无数据' }])
            ],
            imageUrl: responseData.imageUrl || null
          }
        ];
      }
      // 频频/音频类型
      if (responseData.messageType === 'audio') {
        console.log("responseData:3333", responseData?.data?.overall);
        return [
          ...newMessages,
          ...(shouldAddUserMessage ? [userMessage] : []),
          {
            type: 'response',
            messageType: 'audio',
            content: '语音评分完成',
            score: responseData?.data?.overall || null,
            spiderData: [
              { name: '流利度得分', value: responseData?.data?.fluency?.overall || '0' ,content: null},
              { name: '完整度得分', value: responseData?.data?.integrity || '0' ,content: null},
              { name: '准确度得分', value: responseData?.data?.accuracy || '0' ,content: null},
              { name: '声调得分', value: responseData?.data?.tone || '0' ,content: null},
              { name: '无调发音得分', value: responseData?.data?.phn || '0' ,content: null}
            ],
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

    // 准备请求数据
    if (audioBlob) {
      // 将MP3转换为WAV格式
      const wavFile = await convertToWav(audioBlob);
      
      formData.append('word', 'test');
      formData.append('audio_file', wavFile);
      userMessage = {
        type: 'user',
        content: '语音',
        audioUrl: URL.createObjectURL(audioBlob)
      };
      apiUrl = API_CONFIG.audio;
      setAudioBlob(null);
      messageType = 'audio';
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
        '题目': currentQuestion === 1 ? '第一题：说说你对人生的感悟 （2分钟）' : '第二题：朗读 : 人们说，时间是组成生命的特殊材料。花开花落，冰融水流，都是时间在流 逝。面对"铁面无私"的时间，每一个生命都是有限的。所以，要使自己的生命 变得更有价值，我们就应该争分夺秒地去实现既定目标，不断地完善自我、超越 自我。时间对于我们每个人来说，都是平等、公正的，关键在于你能否把握住时 间，并充分利用好它。如果你能做到与时间赛跑，有速度、有目标地学习和工作， 你的生活就会变得丰富多彩。时间的脚步匆匆，它不会因为我们有许多事情需要 处理而稍停片刻。要知道，光阴不等人，谁对时间吝啬，时间反而对谁更慷慨。只有学会了与时间赛跑，你才能成为时间的主人。 （2分钟）',
        "回答": inputValue,
        "type": currentQuestion === 1 ? "主观题" : "客观题"
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
      console.log("Response:", response);
      
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
    
    // 根据消息类型决定是否显示雷达图
    if (msg.messageType === 'text' || msg.messageType === 'image') {
      return <SystemResponse 
        content={msg.content} 
        score={msg.score} 
        spiderData={msg.spiderData} 
        showRadarChart={false} 
        error={msg.error || false} 
      />;
    }
    
    // 音频类型或其他类型显示雷达图
    return <SystemResponse 
      content={msg.content} 
      score={msg.score} 
      spiderData={msg.spiderData} 
      showRadarChart={true} 
      error={msg.error || false} 
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

                <h2 style={{ color: '#222', margin: '20px 0' }}>HSK高级考试</h2>

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
                    <h2 style={{ color: '#222', margin: '20px 0' }}>第二题：朗读 : 人们说，时间是组成生命的特殊材料。花开花落，冰融水流，都是时间在流 逝。面对"铁面无私"的时间，每一个生命都是有限的。所以，要使自己的生命 变得更有价值，我们就应该争分夺秒地去实现既定目标，不断地完善自我、超越 自我。时间对于我们每个人来说，都是平等、公正的，关键在于你能否把握住时 间，并充分利用好它。如果你能做到与时间赛跑，有速度、有目标地学习和工作， 你的生活就会变得丰富多彩。时间的脚步匆匆，它不会因为我们有许多事情需要 处理而稍停片刻。要知道，光阴不等人，谁对时间吝啬，时间反而对谁更慷慨。只有学会了与时间赛跑，你才能成为时间的主人。 （2分钟）</h2>
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