import { PingResult } from '../types';

// 使用fetch API进行真实的ping检测
export const performPingDetection = async (host: string, count: number = 4): Promise<PingResult> => {
  const times: number[] = [];
  let received = 0;
  let lost = 0;
  
  // 确保host有协议前缀
  const url = host.startsWith('http') ? host : `https://${host}`;
  
  for (let i = 0; i < count; i++) {
    try {
      const startTime = performance.now();
      
      // 使用fetch进行ping检测
      const response = await fetch(url, {
        method: 'HEAD', // 只获取头部信息，减少数据传输
        mode: 'no-cors', // 避免CORS问题
        cache: 'no-cache', // 避免缓存
        signal: AbortSignal.timeout(5000) // 5秒超时
      });
      
      const endTime = performance.now();
      const pingTime = endTime - startTime;
      
      times.push(pingTime);
      received++;
    } catch (error) {
      console.warn(`Ping attempt ${i + 1} failed:`, error);
      lost++;
      times.push(0); // 失败时记录0
    }
    
    // 在每次ping之间添加短暂延迟
    if (i < count - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const validTimes = times.filter(time => time > 0);
  const minTime = validTimes.length > 0 ? Math.min(...validTimes) : 0;
  const maxTime = validTimes.length > 0 ? Math.max(...validTimes) : 0;
  const avgTime = validTimes.length > 0 ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length : 0;
  const lossPercentage = (lost / count) * 100;
  
  return {
    host,
    packets: count,
    received,
    lost,
    lossPercentage,
    minTime,
    maxTime,
    avgTime,
    times: validTimes,
    timestamp: new Date().toISOString()
  };
};

// 备用模拟Ping检测（当真实检测失败时使用）
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
