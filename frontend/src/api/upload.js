/**
 * Upload API - 七牛云文件上传相关接口
 */

import { API_BASE_URL } from './config';

/**
 * 获取七牛云上传凭证
 * @param {string} fileName - 文件名
 * @param {string} folder - 文件夹名称: products | avatars | logos | carousels
 * @param {string} token - JWT 认证 token
 * @returns {Promise<{token: string, key: string, upload_url: string, file_url: string}>}
 */
export async function getUploadToken(fileName, folder, token) {
  if (!token) throw new Error('缺少认证 token');

  const response = await fetch(`${API_BASE_URL}/api/upload/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      file_name: fileName,
      file_type: 'image/*',
      folder: folder,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `获取上传凭证失败 (${response.status})`);
  }

  return response.json();
}

/**
 * 直接上传文件到七牛云
 * @param {File} file - 要上传的文件
 * @param {string} folder - 文件夹名称
 * @param {string} token - JWT 认证 token
 * @param {function} onProgress - 进度回调 (0-100)
 * @returns {Promise<{file_url: string, key: string}>}
 */
export async function uploadToQiniu(file, folder, token, onProgress) {
  // 1. 获取上传凭证
  const uploadCred = await getUploadToken(file.name, folder, token);

  // 2. 使用 FormData 直接上传到七牛云
  const formData = new FormData();
  formData.append('token', uploadCred.token);
  formData.append('key', uploadCred.key);
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve({
            file_url: uploadCred.file_url,
            key: result.key || uploadCred.key,
          });
        } catch {
          resolve({
            file_url: uploadCred.file_url,
            key: uploadCred.key,
          });
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || `上传失败 (${xhr.status})`));
        } catch {
          reject(new Error(`上传失败 (${xhr.status})`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('网络错误，上传失败'));
    });

    xhr.open('POST', uploadCred.upload_url);
    xhr.send(formData);
  });
}

/**
 * 获取用户端上传凭证（使用 CUSTOMER_API_BASE_URL）
 */
import { CUSTOMER_API_BASE_URL } from './config';

export async function getCustomerUploadToken(fileName, folder, token) {
  if (!token) throw new Error('缺少认证 token');

  const response = await fetch(`${CUSTOMER_API_BASE_URL}/api/upload/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      file_name: fileName,
      file_type: 'image/*',
      folder: folder,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `获取上传凭证失败 (${response.status})`);
  }

  return response.json();
}

/**
 * 用户端直接上传文件到七牛云
 */
export async function uploadToQiniuCustomer(file, folder, token, onProgress) {
  const uploadCred = await getCustomerUploadToken(file.name, folder, token);

  const formData = new FormData();
  formData.append('token', uploadCred.token);
  formData.append('key', uploadCred.key);
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve({
            file_url: uploadCred.file_url,
            key: result.key || uploadCred.key,
          });
        } catch {
          resolve({
            file_url: uploadCred.file_url,
            key: uploadCred.key,
          });
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || `上传失败 (${xhr.status})`));
        } catch {
          reject(new Error(`上传失败 (${xhr.status})`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('网络错误，上传失败'));
    });

    xhr.open('POST', uploadCred.upload_url);
    xhr.send(formData);
  });
}
