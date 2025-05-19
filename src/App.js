import React from 'react';
import { Layout, Typography } from 'antd';
import ChatInterface from './components/ChatInterface';
import './App.css';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  return (
    <Layout className="app-container">
      <Header className="header">
        <Title level={3} style={{ color: 'white', margin: 0 }}>
          智能对话系统
        </Title>
      </Header>
      <Content className="content">
        <ChatInterface />
      </Content>
    </Layout>
  );
}

export default App;
