import React from 'react';
import { Input, Button, Space, Upload, Image, Spin } from 'antd';
import { SendOutlined, ClearOutlined, AudioOutlined, PictureOutlined, LoadingOutlined } from '@ant-design/icons';
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
  onImageSelect,
  isLoading 
}) => (
  <div className="message-input-container">
    {imageFile && (
      <div className="preview-container" style={{ position: 'relative' }}>
        <Image
          src={URL.createObjectURL(imageFile)}
          alt="预览图片"
          className="preview-image"
          preview={false}
        />
        {isLoading && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '8px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            <span>正在发送...</span>
          </div>
        )}
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
        disabled={isRecording || isLoading}
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
        disabled={isLoading}
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
        disabled={isLoading}
      >
        <Button 
          icon={<PictureOutlined style={{ fontSize: '20px' }} />} 
          className={imageFile ? "primary-button" : undefined}
          disabled={isLoading}
          style={{ 
            height: '50px',
            width: '60px',
            fontSize: '16px'
          }}
        />
      </Upload>
      <Button 
        type="primary" 
        icon={isLoading ? <LoadingOutlined style={{ fontSize: '20px' }} /> : <SendOutlined style={{ fontSize: '20px' }} />} 
        onClick={onSend}
        loading={isLoading}
        style={{ 
          height: '50px',
          width: '100px',
          fontSize: '16px'
        }}
      >
        {isLoading ? '发送中' : '发送'}
      </Button>
      <Button 
        icon={<ClearOutlined style={{ fontSize: '20px' }} />} 
        onClick={onClear}
        disabled={isLoading}
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