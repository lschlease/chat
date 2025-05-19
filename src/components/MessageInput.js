import React from 'react';
import { Input, Button, Space, Upload, Image } from 'antd';
import { SendOutlined, ClearOutlined, AudioOutlined, PictureOutlined } from '@ant-design/icons';

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
  <div>
    {imageFile && (
      <div style={{ marginBottom: '12px' }}>
        <Image
          src={URL.createObjectURL(imageFile)}
          alt="预览图片"
          style={{ maxHeight: '200px', borderRadius: '4px' }}
          preview={false}
        />
      </div>
    )}
    {audioBlob && (
      <div style={{ marginBottom: '12px' }}>
        <audio 
          controls 
          src={URL.createObjectURL(audioBlob)}
          style={{ width: '100%' }}
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
        style={{ color: isRecording ? '#fff' : '#1890ff' }}
      />
      <Upload
        accept="image/*"
        showUploadList={false}
        beforeUpload={() => false}
        onChange={onImageSelect}
      >
        <Button 
          icon={<PictureOutlined />} 
          style={{ color: imageFile ? '#1890ff' : undefined }}
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