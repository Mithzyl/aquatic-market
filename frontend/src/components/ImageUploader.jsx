import React, { useState, useRef, useCallback } from 'react';

/**
 * ImageUploader — 通用图片上传组件
 *
 * Props:
 *   value: string          - 当前图片 URL
 *   onChange: (url) => void - 图片 URL 变更回调
 *   folder: string         - 上传文件夹: products | avatars | logos | carousels
 *   token: string          - JWT 认证 token
 *   useCustomerApi: bool   - 使用用户端 API（默认使用商家端）
 *   placeholder: string    - 占位提示文字
 *   previewSize: string    - 预览尺寸样式类
 *   accept: string         - 接受的文件类型
 *   maxSizeMB: number      - 最大文件大小（MB），默认 5
 */
function ImageUploader({
  value = '',
  onChange,
  folder = 'products',
  token,
  useCustomerApi = false,
  placeholder = '点击或拖拽上传图片',
  previewSize = 'w-full aspect-square',
  accept = 'image/jpeg,image/png,image/gif,image/webp',
  maxSizeMB = 5,
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    // 校验文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    // 校验文件大小
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`图片大小不能超过 ${maxSizeMB}MB`);
      return;
    }

    setError('');
    setUploading(true);
    setProgress(0);

    try {
      // 动态导入上传函数（避免循环依赖）
      const { uploadToQiniu, uploadToQiniuCustomer } = await import('../api/upload');
      const uploadFn = useCustomerApi ? uploadToQiniuCustomer : uploadToQiniu;

      const result = await uploadFn(file, folder, token, (p) => setProgress(p));
      onChange(result.file_url);
    } catch (err) {
      setError(err.message || '上传失败，请重试');
      console.error('[ImageUploader] 上传失败:', err);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [folder, token, useCustomerApi, maxSizeMB, onChange]);

  const handleClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      {/* 拖拽上传区域 / 图片预览 */}
      {value ? (
        <div className={`relative group overflow-hidden rounded-2xl border border-[#eadfce] ${previewSize}`}>
          <img
            src={value}
            alt="预览"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f5f0e8" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%238b755d" font-size="12">图片加载失败</text></svg>';
            }}
          />
          {/* 悬浮层 */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleClick}
              className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-[#2f6b56] shadow-md hover:bg-white transition-colors"
              title="更换图片"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-red-500 shadow-md hover:bg-white transition-colors"
              title="删除图片"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`${previewSize} rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-2
            ${isDragOver ? 'border-[#2f6b56] bg-[#e8f5e9]' : 'border-[#d4c8b8] bg-[#faf7f2] hover:border-[#c9a87c] hover:bg-[#f5f0e8]'}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 px-4">
              <div className="w-10 h-10 border-3 border-[#e8d5c0] border-t-[#2f6b56] rounded-full animate-spin" />
              <span className="text-sm text-[#8b755d]">上传中 {progress}%</span>
              <div className="w-32 h-1.5 bg-[#e8d5c0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2f6b56] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <svg className="w-8 h-8 text-[#c9a87c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              <span className="text-sm text-[#b5a18a] px-2 text-center">{placeholder}</span>
              <span className="text-xs text-[#c9b896]">支持 JPG/PNG/GIF/WebP，最大 {maxSizeMB}MB</span>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

export default ImageUploader;
