import React from 'react';
import { Layout } from 'antd';
import ChatInterface from './components/ChatInterface';
import './App.css';

const { Content } = Layout;

function App() {
  return (
    <Layout className="layout">
      <Content>
        <ChatInterface />
      </Content>
    </Layout>
  );
}

export default App;
