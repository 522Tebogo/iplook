# API 设置指南

本文档介绍如何配置和使用 IPLook 项目中的各种 API 功能，特别是 DNS 泄露检测和 Whoer 隐私检测功能。

## 目录

- [环境变量配置](#环境变量配置)
- [DNS 泄露检测 API](#dns-泄露检测-api)
- [Whoer 隐私检测 API](#whoer-隐私检测-api)
- [威胁情报 API](#威胁情报-api)
- [API 配置说明](#api-配置说明)
- [故障排除](#故障排除)

## 环境变量配置

在项目根目录创建 `.env` 文件，添加以下环境变量：

```bash
# AbuseIPDB API (威胁情报)
VITE_ABUSEIPDB_API_KEY=your_abuseipdb_api_key_here

# VirusTotal API (威胁情报)
VITE_VIRUSTOTAL_API_KEY=your_virustotal_api_key_here

# Whoer API (隐私检测)
VITE_WHOER_API_KEY=your_whoer_api_key_here

# IPGeolocation API (地理位置)
VITE_IPGEOLOCATION_API_KEY=your_ipgeolocation_api_key_here

# IPInfo API (地理位置)
VITE_IPINFO_API_KEY=your_ipinfo_api_key_here

# IPStack API (地理位置)
VITE_IPSTACK_API_KEY=your_ipstack_api_key_here
```

## DNS 泄露检测 API

### 免费 API (无需密钥)

#### 1. Google DNS API
- **状态**: 默认启用
- **URL**: `https://dns.google.com/resolve`
- **特点**: 免费，无限制，响应速度快
- **配置**: 在 `src/config/api.ts` 中已启用

#### 2. Cloudflare DNS API
- **状态**: 默认启用
- **URL**: `https://cloudflare-dns.com/dns-query`
- **特点**: 免费，无限制，隐私友好
- **配置**: 在 `src/config/api.ts` 中已启用

#### 3. OpenDNS API
- **状态**: 默认禁用
- **URL**: `https://dns.opendns.com/resolve`
- **特点**: 免费，无限制
- **启用方法**: 在 `src/config/api.ts` 中设置 `enabled: true`

#### 4. Quad9 DNS API
- **状态**: 默认禁用
- **URL**: `https://dns.quad9.net:5053/dns-query`
- **特点**: 免费，无限制，安全防护
- **启用方法**: 在 `src/config/api.ts` 中设置 `enabled: true`

#### 5. 国内 DNS API
- **114 DNS**: `https://dns.114dns.com/resolve`
- **AliDNS**: `https://dns.alidns.com/resolve`
- **DNSPod**: `https://doh.pub/dns-query`
- **特点**: 针对国内用户优化
- **启用方法**: 在 `src/config/api.ts` 中设置相应 `enabled: true`

### 付费 API

#### DNS Leak Test API
- **状态**: 默认启用
- **URL**: `https://www.dnsleaktest.com/api/dns-leak-test`
- **特点**: 专业的 DNS 泄露检测服务
- **配置**: 在 `src/config/api.ts` 中已启用

## Whoer 隐私检测 API

### 免费 API (无需密钥)

#### 1. IP-API.com
- **状态**: 默认启用
- **URL**: `http://ip-api.com/json`
- **特点**: 免费，每分钟 45 次请求限制
- **配置**: 在 `src/config/api.ts` 中已启用

#### 2. IP2Location
- **状态**: 默认禁用
- **URL**: `https://api.ip2location.io`
- **特点**: 免费，每日 1000 次请求限制
- **启用方法**: 在 `src/config/api.ts` 中设置 `enabled: true`

### 付费 API (需要密钥)

#### 1. Whoer API
- **注册地址**: https://whoer.net/
- **特点**: 专业的隐私检测服务
- **配置**: 设置 `VITE_WHOER_API_KEY` 环境变量

#### 2. IPGeolocation API
- **注册地址**: https://ipgeolocation.io/
- **特点**: 高精度的地理位置和代理检测
- **配置**: 设置 `VITE_IPGEOLOCATION_API_KEY` 环境变量

#### 3. IPInfo API
- **注册地址**: https://ipinfo.io/
- **特点**: 免费版本有限制，付费版本功能更全
- **配置**: 设置 `VITE_IPINFO_API_KEY` 环境变量

#### 4. IPStack API
- **注册地址**: https://ipstack.com/
- **特点**: 提供安全威胁检测功能
- **配置**: 设置 `VITE_IPSTACK_API_KEY` 环境变量

## 威胁情报 API

### AbuseIPDB API
- **注册地址**: https://www.abuseipdb.com/
- **特点**: 免费的 IP 威胁情报服务
- **配置**: 设置 `VITE_ABUSEIPDB_API_KEY` 环境变量

### VirusTotal API
- **注册地址**: https://www.virustotal.com/
- **特点**: 多引擎恶意软件检测
- **配置**: 设置 `VITE_VIRUSTOTAL_API_KEY` 环境变量

## API 配置说明

### 启用/禁用 API

在 `src/config/api.ts` 文件中，可以通过修改 `enabled` 属性来启用或禁用特定的 API：

```typescript
// 启用 API
enabled: true

// 禁用 API
enabled: false
```

### 添加新的 API

要添加新的 API，请在 `src/config/api.ts` 中添加配置：

```typescript
// 在相应的配置对象中添加
newApi: {
  baseUrl: 'https://api.example.com',
  apiKey: import.meta.env.VITE_NEW_API_KEY || '',
  enabled: false
}
```

然后在相应的服务文件中添加实现方法。

### API 优先级

系统会按照以下优先级尝试 API：

1. **DNS 泄露检测**: Google DNS → Cloudflare DNS → OpenDNS → Quad9 → 国内 DNS
2. **Whoer 隐私检测**: Whoer API → IP-API.com → IP2Location → IPGeolocation → IPInfo → IPStack

如果某个 API 失败，系统会自动尝试下一个可用的 API。

## 故障排除

### 常见问题

#### 1. API 调用失败
- **原因**: API 密钥无效或网络问题
- **解决**: 检查 API 密钥是否正确，检查网络连接

#### 2. 请求限制
- **原因**: 免费 API 有请求频率限制
- **解决**: 升级到付费版本或使用其他 API

#### 3. CORS 错误
- **原因**: 浏览器跨域限制
- **解决**: 使用代理服务器或配置 CORS

#### 4. 响应超时
- **原因**: API 服务器响应慢
- **解决**: 增加超时时间或使用备用 API

### 调试模式

在开发环境中，可以启用调试模式来查看详细的 API 调用信息：

```typescript
// 在服务文件中设置
const DEBUG_MODE = true;
```

### 缓存机制

系统使用缓存机制来提高性能：

- **DNS 泄露检测**: 10 分钟缓存
- **Whoer 隐私检测**: 5 分钟缓存
- **威胁情报**: 5 分钟缓存

### 并发控制

为了防止 API 限制，系统实现了并发控制：

- **最大并发请求数**: 2-3 个
- **请求间隔**: 1 秒
- **超时时间**: 10-15 秒

## 性能优化建议

1. **合理配置 API**: 只启用必要的 API
2. **使用缓存**: 避免重复请求
3. **错误处理**: 实现优雅的降级机制
4. **监控使用量**: 定期检查 API 使用情况

## 安全注意事项

1. **保护 API 密钥**: 不要将 API 密钥提交到版本控制系统
2. **环境变量**: 使用环境变量存储敏感信息
3. **HTTPS**: 优先使用 HTTPS 协议的 API
4. **请求限制**: 遵守 API 提供商的请求限制

## 更新日志

- **v1.0.0**: 初始版本，支持基本的 DNS 泄露和 Whoer 检测
- **v1.1.0**: 添加多个免费 API 支持
- **v1.2.0**: 改进错误处理和缓存机制
- **v1.3.0**: 添加并发控制和性能优化

## 支持

如果您在使用过程中遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查 API 提供商的官方文档
3. 提交 Issue 到项目仓库

---

**注意**: 本文档会随着项目更新而更新，请定期查看最新版本。
