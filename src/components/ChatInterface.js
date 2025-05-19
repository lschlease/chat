import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, List, Card, Space } from 'antd';
import { SendOutlined, ClearOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import io from 'socket.io-client';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage = {
      type: 'user',
      content: inputValue
    };

    setMessages(prev => [...prev, newMessage]);
    socket?.emit('message', { text: inputValue });
    setInputValue('');
  };

  const handleClear = () => {
    setMessages([]);
  };

  const renderMessage = (msg, index) => {
    if (msg.type === 'user') {
      return (
        <Card style={{ marginBottom: 16, backgroundColor: '#e6f7ff' }}>
          <p>{msg.content}</p>
        </Card>
      );
    }

    return (
      <Card style={{ marginBottom: 16 }}>
        <p>{msg.content}</p>
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
          placeholder="请输入消息..."
        />
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