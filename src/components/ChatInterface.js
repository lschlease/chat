import React, { useState, useEffect, useRef } from 'react';
import { List, message, Button } from 'antd';
import UserMessage from './UserMessage';
import SystemResponse from './SystemResponse';
import MessageInput from './MessageInput';
import '../styles/chat.css';
import welcomeIcon from '../assets/語文推廣委員會_有字.png';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
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

  const sendMessage = async (formData) => {
    try {
      const response = await fetch('http://117.50.192.174:8000/ovis_chat', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('网络请求失败');
      }
      
      const data = await response.json();
      setMessages(prev => [...prev, {
        type: 'response',
        content: data.text,
        score: data.score,
        spiderData: data.spiderData
      }]);
    } catch (error) {
      message.error('发送消息失败');
      console.error('Error:', error);
    }
  };

  const sendAudioMessage = async (formData) => {
    try {
      const response = await fetch('https://gapsk-plus-api.gapsk.org/scoring/paragraph_scoring/', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('网络请求失败');
      }
      
      const data = await response.json();
      setMessages(prev => [...prev, {
        type: 'response',
        content: data.text,
        score: data.score,
        spiderData: data.spiderData
      }]);
    } catch (error) {
      message.error('发送语音消息失败');
      console.error('Error:', error);
    }
  };

  const handleSend = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (!inputValue.trim() && !audioBlob && !imageFile) return;

    if (audioBlob) {
      // 将 Blob 转换为 MP3 文件
      const audioFile = new File([audioBlob], 'recording.mp3', {
        type: 'audio/mp3'
      });
      console.log("audioFile", audioFile);
      const formData = new FormData();
      formData.append('word', 'test');
      formData.append('audio_file', audioFile);
      
      setMessages(prev => [...prev, {
        type: 'user',
        content: '语音',
        audioUrl: URL.createObjectURL(audioBlob)
      }]);
      
      await sendAudioMessage(formData);
      setAudioBlob(null);
      setInputValue('');
    } else if (imageFile) {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      setMessages(prev => [...prev, {
        type: 'user',
        content: '图片',
        imageUrl: URL.createObjectURL(imageFile)
      }]);
      
      await sendMessage(formData);
      setImageFile(null);
      setInputValue('');
    } else {
      const formData = new FormData();
      formData.append('text', inputValue);
      
      setMessages(prev => [...prev, {
        type: 'user',
        content: inputValue
      }]);
      
      await sendMessage(formData);
      setInputValue('');
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
                    <h2 style={{ color: '#222', margin: '20px 0' }}>第二题：朗读 : 人们说，时间是组成生命的特殊材料。花开花落，冰融水流，都是时间在流 逝。面对“铁面无私”的时间，每一个生命都是有限的。所以，要使自己的生命 变得更有价值，我们就应该争分夺秒地去实现既定目标，不断地完善自我、超越 自我。时间对于我们每个人来说，都是平等、公正的，关键在于你能否把握住时 间，并充分利用好它。如果你能做到与时间赛跑，有速度、有目标地学习和工作， 你的生活就会变得丰富多彩。时间的脚步匆匆，它不会因为我们有许多事情需要 处理而稍停片刻。要知道，光阴不等人，谁对时间吝啬，时间反而对谁更慷慨。只有学会了与时间赛跑，你才能成为时间的主人。 （2分钟）</h2>
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
      />
    </div>
  );
};

export default ChatInterface; 