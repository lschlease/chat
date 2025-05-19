import React from 'react';
import { Card } from 'antd';

const UserMessage = ({ content, imageUrl, audioUrl }) => (
  <Card style={{ marginBottom: 16, backgroundColor: '#e6f7ff' }}>
    {imageUrl ? (
      <img src={imageUrl} alt="用户上传" style={{ maxWidth: '200px', borderRadius: '4px' }} />
    ) : audioUrl ? (
      <audio controls src={audioUrl} style={{ width: '100%' }} />
    ) : (
      <p>{content}</p>
    )}
  </Card>
);

export default UserMessage; 