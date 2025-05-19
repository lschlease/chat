import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, List, Card, Space, message, Upload } from 'antd';
import { SendOutlined, ClearOutlined, SoundOutlined, AudioOutlined, PictureOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import io from 'socket.io-client';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [socket, setSocket] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const messagesEndRef = useRef(null);
  const audioChunks = useRef([]);

  useEffect(() => {
    // 连接WebSocket服务器
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('message', (data) => {
      setMessages(prev => [...prev, {
        type: 'response',
        content: data.text,
        score: data.score,
        spiderData: data.spiderData
      }]);
    });

    return () => newSocket.close();
  }, []);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (info) => {
    if (info.file) {
      setImageFile(info.file);
      setInputValue('图片已选择，点击发送');
    }
  };

  const handleSend = () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (!inputValue.trim() && !audioBlob && !imageFile) return;

    if (audioBlob) {
      // 发送语音消息
      const formData = new FormData();
      formData.append('audio', audioBlob);
      socket?.emit('message', formData);
      
      setMessages(prev => [...prev, {
        type: 'user',
        content: '语音消息'
      }]);
      
      setAudioBlob(null);
      setInputValue('');
    } else if (imageFile) {
      // 发送图片消息
      const formData = new FormData();
      formData.append('image', imageFile);
      socket?.emit('message', formData);
      
      setMessages(prev => [...prev, {
        type: 'user',
        content: '图片消息',
        imageUrl: URL.createObjectURL(imageFile)
      }]);
      
      setImageFile(null);
      setInputValue('');
    } else {
      // 发送文字消息
      const newMessage = {
        type: 'user',
        content: inputValue
      };

      setMessages(prev => [...prev, newMessage]);
      socket?.emit('message', { text: inputValue });
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
      return (
        <Card style={{ marginBottom: 16, backgroundColor: '#e6f7ff' }}>
          {msg.imageUrl ? (
            <img src={msg.imageUrl} alt="用户上传" style={{ maxWidth: '200px', borderRadius: '4px' }} />
          ) : (
            <p>{msg.content}</p>
          )}
        </Card>
      );
    }

    const handlePlayAudio = () => {
      const utterance = new SpeechSynthesisUtterance(msg.content);
      utterance.lang = 'zh-CN';
      window.speechSynthesis.speak(utterance);
    };

    return (
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <p style={{ margin: 0, flex: 1 }}>{msg.content}</p>
          <Button 
            type="text" 
            icon={<SoundOutlined />} 
            onClick={handlePlayAudio}
            style={{ color: '#1890ff' }}
          />
        </div>
        {msg.score && (
          <div style={{ marginTop: 16 }}>
            <h4>得分：{msg.score}</h4>
          </div>
        )}
        {msg.spiderData && (
          <div style={{ marginTop: 16 }}>
            <ReactECharts
              option={{
                radar: {
                  indicator: msg.spiderData.map(item => ({
                    name: item.name,
                    max: 100
                  }))
                },
                series: [{
                  type: 'radar',
                  data: [{
                    value: msg.spiderData.map(item => item.value),
                    name: '能力评估'
                  }]
                }]
              }}
              style={{ height: '300px' }}
            />
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {msg.spiderData.map((item, index) => {
                const getEvaluation = (value) => {
                  if (value >= 80) {
                    return {
                      level: '优秀',
                      color: '#52c41a',
                      text: '表现突出，具有很高的专业水平'
                    };
                  } else if (value >= 60) {
                    return {
                      level: '良好',
                      color: '#1890ff',
                      text: '表现稳定，具备基本能力'
                    };
                  } else {
                    return {
                      level: '待提升',
                      color: '#ff4d4f',
                      text: '需要加强学习和实践'
                    };
                  }
                };

                const evaluation = getEvaluation(item.value);

                return (
                  <Card 
                    key={index} 
                    size="small" 
                    style={{ 
                      width: '100%', 
                      backgroundColor: '#f5f5f5',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, color: '#1890ff' }}>{item.name}</h4>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '14px' }}>
                          等级：<span style={{ color: evaluation.color, fontWeight: 'bold' }}>{evaluation.level}</span>
                        </p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                          {evaluation.text}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <List
        dataSource={messages}
        renderItem={renderMessage}
        style={{ marginBottom: '20px', maxHeight: '60vh', overflow: 'auto' }}
      />
      <div ref={messagesEndRef} />
      <Space.Compact style={{ width: '100%' }}>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={handleSend}
          placeholder={isRecording ? "正在录音..." : "请输入消息..."}
          disabled={isRecording}
        />
        <Button 
          type={isRecording ? "primary" : "default"}
          icon={<AudioOutlined />} 
          onClick={isRecording ? stopRecording : startRecording}
          style={{ color: isRecording ? '#fff' : '#1890ff' }}
        />
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={() => false}
          onChange={handleImageSelect}
        >
          <Button 
            icon={<PictureOutlined />} 
            style={{ color: imageFile ? '#1890ff' : undefined }}
          />
        </Upload>
        <Button type="primary" icon={<SendOutlined />} onClick={handleSend}>
          发送
        </Button>
        <Button icon={<ClearOutlined />} onClick={handleClear}>
          清空
        </Button>
      </Space.Compact>
    </div>
  );
};

export default ChatInterface; 