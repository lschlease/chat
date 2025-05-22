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
  text: '正在分析中，请稍候...',
  score: 80,
  spiderData: [
    { name: '能力A', value: 80 },
    { name: '能力B', value: 85 },
    { name: '能力C', value: 75 },
    { name: '能力D', value: 90 },
    { name: '能力E', value: 85 }
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
        throw new Error('网络请求失败');
      }

      // 先获取原始响应文本
      const rawText = await response.text();
      console.log("Raw response:", rawText);

      let data;
      try {
        // 尝试解析JSON
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.log("Response is not JSON, using raw text");
        // 如果不是JSON，使用原始文本作为响应
        data = {
          text: rawText || DEFAULT_RESPONSE.text,
          score: DEFAULT_RESPONSE.score,
          spiderData: DEFAULT_RESPONSE.spiderData
        };
      }

      console.log("Processed response data:", data);

      // 如果返回数据为空或未定义，使用默认数据
      if (!data || Object.keys(data).length === 0) {
        console.log("Empty response, using default");
        return DEFAULT_RESPONSE;
      }

      // 确保返回数据格式正确
      return {
        text: data.text || DEFAULT_RESPONSE.text,
        score: typeof data.score === 'number' ? data.score : DEFAULT_RESPONSE.score,
        spiderData: Array.isArray(data.spiderData) ? data.spiderData : DEFAULT_RESPONSE.spiderData
      };
    } catch (error) {
      console.error('Request error:', error);
      return DEFAULT_RESPONSE;
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

      return [
        ...newMessages,
        ...(shouldAddUserMessage ? [userMessage] : []),
        {
          type: 'response',
          content: responseData.text,
          score: responseData.score,
          spiderData: responseData.spiderData
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
    } else if (imageFile) {
      formData.append('image', imageFile);
      userMessage = {
        type: 'user',
        content: '图片',
        imageUrl: URL.createObjectURL(imageFile)
      };
      apiUrl = API_CONFIG.image;
      setImageFile(null);
    } else {
      formData.append('text', inputValue);
      userMessage = {
        type: 'user',
        content: inputValue
      };
      apiUrl = API_CONFIG.text;
    }

    // 清除输入
    setInputValue('');
    
    // 显示loading
    addLoadingMessage(userMessage);
    setIsLoading(true);

    try {
      // 发送请求
      const responseData = await request(apiUrl, formData);
      // 更新消息列表
      addMessage(userMessage, responseData);
    } catch (error) {
      message.error('发送消息失败，请稍后重试');
      // 发生错误时也使用默认数据显示
      addMessage(userMessage, DEFAULT_RESPONSE);
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
    return <SystemResponse content={msg.content} score={msg.score} spiderData={msg.spiderData} />;
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