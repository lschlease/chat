import React from 'react';
import '../styles/chat.css';

const UserMessage = ({ content, imageUrl, audioUrl }) => (
  <div className="user-message">
    {imageUrl ? (
      <img src={imageUrl} alt="用户上传" className="preview-image" />
    ) : audioUrl ? (
      <audio controls src={audioUrl} className="audio-player" />
    ) : (
      <p style={{ margin: 0 }}>{content}</p>
    )}
  </div>
);

export default UserMessage; 