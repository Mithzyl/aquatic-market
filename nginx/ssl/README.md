# SSL 证书目录

生产环境部署前，请将以下文件放入本目录：

- `cert.pem` — SSL 证书（公钥）
- `key.pem`  — SSL 私钥

## 生成自签名证书（仅用于测试）

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem \
  -out cert.pem \
  -subj "/CN=localhost"
```

⚠️ 自签名证书仅用于开发/测试，生产环境必须使用受信任 CA 签发的正式证书。
