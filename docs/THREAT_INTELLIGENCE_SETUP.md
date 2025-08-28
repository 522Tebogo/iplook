# 威胁情报API配置指南

## 概述

IP纯净度检测功能现在支持从多个外部威胁情报服务获取实时数据，提供更准确的IP风险评估。

## 支持的威胁情报服务

### 1. AbuseIPDB (推荐)
- **服务描述**: 全球最大的IP黑名单数据库
- **注册地址**: https://www.abuseipdb.com/
- **免费额度**: 每天1000次API调用
- **功能**: IP滥用检测、置信度评分、详细报告

#### 配置步骤:
1. 访问 https://www.abuseipdb.com/ 注册账户
2. 在账户设置中获取API密钥
3. 在环境变量中设置: `REACT_APP_ABUSEIPDB_API_KEY=your_api_key`
4. 在 `src/config/api.ts` 中将 `abuseIPDB.enabled` 设置为 `true`

### 2. VirusTotal
- **服务描述**: 全面的恶意软件和威胁检测服务
- **注册地址**: https://www.virustotal.com/
- **免费额度**: 每天500次API调用
- **功能**: 恶意软件检测、网络行为分析

#### 配置步骤:
1. 访问 https://www.virustotal.com/ 注册账户
2. 获取API密钥
3. 设置环境变量: `REACT_APP_VIRUSTOTAL_API_KEY=your_api_key`
4. 在配置中启用VirusTotal

### 3. AlienVault OTX (免费)
- **服务描述**: 开源威胁情报平台
- **注册地址**: https://otx.alienvault.com/
- **免费额度**: 无限制
- **功能**: 威胁指标、恶意IP检测

### 4. ThreatFox (免费)
- **服务描述**: 恶意软件威胁情报
- **API地址**: https://threatfox-api.abuse.ch/
- **免费额度**: 无限制
- **功能**: 恶意软件C&C服务器检测

## 环境变量配置

创建 `.env.local` 文件（如果不存在）:

```bash
# AbuseIPDB API密钥
REACT_APP_ABUSEIPDB_API_KEY=your_abuseipdb_api_key_here

# VirusTotal API密钥
REACT_APP_VIRUSTOTAL_API_KEY=your_virustotal_api_key_here

# 其他配置
REACT_APP_ENABLE_THREAT_INTELLIGENCE=true
```

## 配置文件说明

`src/config/api.ts` 文件包含所有API配置:

```typescript
export const API_CONFIG = {
  abuseIPDB: {
    apiKey: process.env.REACT_APP_ABUSEIPDB_API_KEY || '',
    baseUrl: 'https://api.abuseipdb.com/api/v2',
    enabled: false // 设置为true启用
  },
  // ... 其他配置
};
```

## 检测逻辑改进

### 1. 多源数据融合
- 优先使用外部威胁情报数据
- 如果外部API失败，回退到本地检测
- 结合多个数据源提高准确性

### 2. 动态风险评估
- 基于滥用置信度评分
- 考虑报告数量和频率
- 分析IP使用类型（VPN、数据中心等）

### 3. 实时更新
- 每次检测都会查询最新数据
- 不再依赖静态IP段列表
- 支持实时威胁情报更新

## 使用建议

### 开发环境
1. 使用模拟数据进行开发和测试
2. 配置免费API服务进行功能验证
3. 注意API调用限制

### 生产环境
1. 配置付费API服务以获得更高额度
2. 实现API调用缓存机制
3. 监控API使用情况和错误率

## 故障排除

### 常见问题

1. **API调用失败**
   - 检查API密钥是否正确
   - 确认网络连接正常
   - 查看API服务状态

2. **超出调用限制**
   - 检查当前使用量
   - 考虑升级API计划
   - 实现请求缓存

3. **检测结果不准确**
   - 确认API配置正确
   - 检查数据源是否启用
   - 查看控制台错误信息

### 调试模式

在开发环境中启用详细日志:

```typescript
// 在 src/services/purityService.ts 中
const DEBUG_MODE = process.env.NODE_ENV === 'development';

if (DEBUG_MODE) {
  console.log('威胁情报数据:', threatIntelligence);
}
```

## 性能优化

### 1. 缓存机制
```typescript
// 实现简单的内存缓存
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

function getCachedResult(ip: string) {
  const cached = cache.get(ip);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}
```

### 2. 并发控制
```typescript
// 限制同时进行的API调用数量
const MAX_CONCURRENT_REQUESTS = 3;
let activeRequests = 0;

async function throttledRequest(url: string) {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  activeRequests++;
  try {
    return await fetch(url);
  } finally {
    activeRequests--;
  }
}
```

## 安全注意事项

1. **API密钥安全**
   - 不要在代码中硬编码API密钥
   - 使用环境变量存储敏感信息
   - 定期轮换API密钥

2. **数据隐私**
   - 确保只查询必要的IP信息
   - 遵守API服务的使用条款
   - 保护用户隐私数据

3. **错误处理**
   - 实现优雅的错误处理机制
   - 避免暴露敏感的错误信息
   - 记录必要的调试信息

## 更新日志

### v2.0.0
- 添加外部威胁情报API支持
- 改进风险评估算法
- 支持多数据源融合
- 添加配置管理功能

### v1.0.0
- 基础IP纯净度检测
- 静态威胁IP段检测
- 本地风险评估
