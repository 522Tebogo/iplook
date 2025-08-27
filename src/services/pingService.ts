import { PingResult } from '../types'

// Ping检测服务
export const performPingDetection = async (host: string): Promise<PingResult> => {
  try {
    const packets = 10
    const times: number[] = []
    let received = 0
    let lost = 0
    
    // 执行多次ping测试
    for (let i = 0; i < packets; i++) {
      try {
        const startTime = performance.now()
        const response = await pingHost(host)
        const endTime = performance.now()
        
        if (response.success) {
          const latency = endTime - startTime
          times.push(latency)
          received++
        } else {
          lost++
        }
      } catch (error) {
        lost++
      }
      
      // 添加延迟避免过于频繁的请求
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // 计算统计信息
    const lossPercentage = (lost / packets) * 100
    const minTime = times.length > 0 ? Math.min(...times) : 0
    const maxTime = times.length > 0 ? Math.max(...times) : 0
    const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
    
    return {
      host,
      packets,
      received,
      lost,
      lossPercentage,
      minTime,
      maxTime,
      avgTime,
      times,
      timestamp: new Date().toLocaleString('zh-CN')
    }
  } catch (error) {
    console.error('Ping检测失败:', error)
    throw new Error('Ping检测失败，请稍后重试')
  }
}

// 单个ping测试
const pingHost = async (host: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // 使用fetch API进行ping测试
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const startTime = performance.now()
    const response = await fetch(`https://${host}`, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal
    })
    const endTime = performance.now()
    
    clearTimeout(timeoutId)
    
    if (response.ok || response.type === 'opaque') { // no-cors模式下type为opaque
      return { success: true }
    } else {
      return { success: false, error: `HTTP ${response.status}` }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: '超时' }
    }
    return { success: false, error: '连接失败' }
  }
}

// 模拟Ping检测（用于演示）
export const performMockPingDetection = async (host: string): Promise<PingResult> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  const packets = 10
  const times: number[] = []
  let received = Math.floor(Math.random() * 6) + 5 // 5-10个包
  let lost = packets - received
  
  // 生成随机延迟数据
  for (let i = 0; i < received; i++) {
    times.push(20 + Math.random() * 180) // 20-200ms
  }
  
  const minTime = times.length > 0 ? Math.min(...times) : 0
  const maxTime = times.length > 0 ? Math.max(...times) : 0
  const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
  
  return {
    host,
    packets,
    received,
    lost,
    lossPercentage: (lost / packets) * 100,
    minTime,
    maxTime,
    avgTime,
    times,
    timestamp: new Date().toLocaleString('zh-CN')
  }
}