import React from 'react';
import { Card } from 'antd';

const UserMessage = ({ content, imageUrl }) => (
  <Card style={{ marginBottom: 16, backgroundColor: '#e6f7ff' }}>
    {imageUrl ? (
      <img src={imageUrl} alt="用户上传" style={{ maxWidth: '200px', borderRadius: '4px' }} />
    ) : (
      <p>{content}</p>
    )}
  </Card>
);

export default UserMessage; 