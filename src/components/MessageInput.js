import React from 'react';
import { Input, Button, Space, Upload, Image } from 'antd';
import { SendOutlined, ClearOutlined, AudioOutlined, PictureOutlined } from '@ant-design/icons';
import '../styles/chat.css';

const MessageInput = ({ 
  inputValue, 
  setInputValue, 
  isRecording, 
  imageFile,
  audioBlob,
  onSend, 
  onClear, 
  onStartRecording, 
  onStopRecording, 
  onImageSelect 
}) => (
  <div className="message-input-container">
    {imageFile && (
      <div className="preview-container">
        <Image
          src={URL.createObjectURL(imageFile)}
          alt="预览图片"
          className="preview-image"
          preview={false}
        />
      </div>
    )}
    {audioBlob && (
      <div className="preview-container">
        <audio 
          controls 
          src={URL.createObjectURL(audioBlob)}
          className="audio-player"
        />
      </div>
    )}
    <Space.Compact style={{ width: '100%' }}>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onPressEnter={onSend}
        placeholder={isRecording ? "正在录音..." : "请输入消息..."}
        disabled={isRecording}
        style={{ 
          height: '50px', 
          fontSize: '16px',
          padding: '0 15px'
        }}
      />
      <Button 
        type={isRecording ? "primary" : "default"}
        icon={<AudioOutlined style={{ fontSize: '20px' }} />} 
        onClick={isRecording ? onStopRecording : onStartRecording}
        className={isRecording ? "recording-button" : "primary-button"}
        style={{ 
          height: '50px',
          width: '60px',
          fontSize: '16px'
        }}
      />
      <Upload
        accept="image/*"
        showUploadList={false}
        beforeUpload={() => false}
        onChange={onImageSelect}
      >
        <Button 
          icon={<PictureOutlined style={{ fontSize: '20px' }} />} 
          className={imageFile ? "primary-button" : undefined}
          style={{ 
            height: '50px',
            width: '60px',
            fontSize: '16px'
          }}
        />
      </Upload>
      <Button 
        type="primary" 
        icon={<SendOutlined style={{ fontSize: '20px' }} />} 
        onClick={onSend}
        style={{ 
          height: '50px',
          width: '100px',
          fontSize: '16px'
        }}
      >
        发送
      </Button>
      <Button 
        icon={<ClearOutlined style={{ fontSize: '20px' }} />} 
        onClick={onClear}
        style={{ 
          height: '50px',
          width: '80px',
          fontSize: '16px'
        }}
      >
        清空
      </Button>
    </Space.Compact>
  </div>
);

export default MessageInput; 