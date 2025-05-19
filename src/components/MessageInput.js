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
      />
      <Button 
        type={isRecording ? "primary" : "default"}
        icon={<AudioOutlined />} 
        onClick={isRecording ? onStopRecording : onStartRecording}
        className={isRecording ? "recording-button" : "primary-button"}
      />
      <Upload
        accept="image/*"
        showUploadList={false}
        beforeUpload={() => false}
        onChange={onImageSelect}
      >
        <Button 
          icon={<PictureOutlined />} 
          className={imageFile ? "primary-button" : undefined}
        />
      </Upload>
      <Button type="primary" icon={<SendOutlined />} onClick={onSend}>
        发送
      </Button>
      <Button icon={<ClearOutlined />} onClick={onClear}>
        清空
      </Button>
    </Space.Compact>
  </div>
);

export default MessageInput; 