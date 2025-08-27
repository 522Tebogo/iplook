import { PingResult } from '../types';

// 模拟Ping检测
export const performMockPingDetection = async (host: string, count: number = 4): Promise<PingResult> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 生成模拟数据
  const times: number[] = [];
  for (let i = 0; i < count; i++) {
    times.push(Math.random() * 100 + 10); // 10-110ms的随机延迟
  }
  
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  
  return {
    host,
    packets: count,
    received: count,
    lost: 0,
    lossPercentage: 0,
    minTime,
    maxTime,
    avgTime,
    times,
    timestamp: new Date().toISOString()
  };
};

// 执行实际的Ping检测（在浏览器环境中受限）
export const performPingDetection = async (host: string, count: number = 4): Promise<PingResult> => {
  // 在浏览器中无法直接执行ping命令，这里提供一个模拟实现
  console.warn('浏览器环境中无法执行真实的ping命令，返回模拟数据');
  return performMockPingDetection(host, count);
};
