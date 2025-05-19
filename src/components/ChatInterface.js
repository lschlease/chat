import React, { useState, useEffect, useRef } from 'react';
import { List, message } from 'antd';
import io from 'socket.io-client';
import UserMessage from './UserMessage';
import SystemResponse from './SystemResponse';
import MessageInput from './MessageInput';

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

  const handleSend = () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (!inputValue.trim() && !audioBlob && !imageFile) return;

    if (audioBlob) {
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
      return <UserMessage content={msg.content} imageUrl={msg.imageUrl} />;
    }
    return <SystemResponse content={msg.content} score={msg.score} spiderData={msg.spiderData} />;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <List
        dataSource={messages}
        renderItem={renderMessage}
        style={{ marginBottom: '20px', maxHeight: '60vh', overflow: 'auto' }}
      />
      <div ref={messagesEndRef} />
      <MessageInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        isRecording={isRecording}
        imageFile={imageFile}
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