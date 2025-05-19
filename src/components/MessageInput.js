import React from 'react';
import { Input, Button, Space, Upload } from 'antd';
import { SendOutlined, ClearOutlined, AudioOutlined, PictureOutlined } from '@ant-design/icons';

const MessageInput = ({ 
  inputValue, 
  setInputValue, 
  isRecording, 
  imageFile,
  onSend, 
  onClear, 
  onStartRecording, 
  onStopRecording, 
  onImageSelect 
}) => (
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
);

export default MessageInput; 