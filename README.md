# IP检测工具

一个专业的网络检测平台，提供全面的IP信息查询和网络检测功能。

![项目截图](public/asset/screenshot.png)

## 功能特性

### 🔍 IP信息查询
- 实时获取当前IP地址
- 详细的地理位置信息（国家、地区、城市）
- 网络服务商信息
- 时区信息
- 经纬度坐标

### 🛡️ Whoer检测
- IP真实性和安全性评分
- 代理检测
- VPN检测
- Tor网络检测
- 托管服务检测

### 🌐 DNS泄露检测
- DNS服务器检测
- DNS泄露风险评估
- 第三方DNS服务器识别

### 📡 Ping检测
- 网络连通性测试
- 延迟统计
- 丢包率分析
- 连接质量评估

### 🎯 纯净度检测
- IP威胁等级评估
- 黑名单检查
- 地理位置异常检测
- 僵尸网络检测

### 🔌 TCPing检测
- TCP端口连通性测试
- 端口扫描
- 服务可用性检测

### 🌍 ANS检测
- Anycast网络检测
- 多节点路由分析

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式框架**: Tailwind CSS
- **图标库**: Lucide React
- **HTTP客户端**: Axios

## 安装和运行

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## 项目结构

```
src/
├── components/          # React组件
│   ├── detections/     # 检测功能组件
│   ├── Header.tsx      # 页面头部
│   ├── IPInfo.tsx      # IP信息显示
│   └── DetectionTabs.tsx # 检测标签页
├── services/           # API服务
│   ├── ipService.ts    # IP相关服务
│   ├── pingService.ts  # Ping检测服务
│   ├── dnsLeakService.ts # DNS泄露检测
│   ├── whoerService.ts # Whoer检测服务
│   └── ...
├── types/              # TypeScript类型定义
└── App.tsx            # 主应用组件
```

## 功能测试

项目包含一个内置的测试页面，可以验证所有功能是否正常工作：

1. 启动开发服务器
2. 点击页面右上角的"功能测试"按钮
3. 点击"运行所有测试"来验证各项功能

## API服务

项目使用多个第三方API来提供检测服务：

- **IP信息**: ip-api.com
- **当前IP获取**: api.ipify.org

## 注意事项

1. 某些API可能有请求限制，建议合理使用
2. 网络检测功能需要网络连接
3. 部分功能可能受到浏览器安全策略限制

## 故障排除

### 常见问题

1. **构建失败**: 检查Node.js版本和依赖安装
2. **API请求失败**: 检查网络连接和API可用性
3. **功能异常**: 查看浏览器控制台错误信息

### 调试模式

在浏览器开发者工具中查看控制台输出，项目包含详细的日志信息。

## 贡献

欢迎提交Issue和Pull Request来改进项目。

## 许可证

MIT License