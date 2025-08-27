import { TCPingResult } from '../types'

// TCPing检测服务 - 改进版本
export const performTCPingDetection = async (host: string, port: number): Promise<TCPingResult> => {
  try {
    const startTime = performance.now()
    
    // 尝试建立TCP连接
    const result = await testTCPConnection(host, port)
    const endTime = performance.now()
    
    if (result.success) {
      return {
        host,
        port,
        status: 'open',
        responseTime: endTime - startTime,
        serviceName: getPortServiceName(port),
        timestamp: new Date().toLocaleString('zh-CN')
      }
    } else {
      return {
        host,
        port,
        status: result.status || 'closed',
        error: result.error,
        serviceName: getPortServiceName(port),
        timestamp: new Date().toLocaleString('zh-CN')
      }
    }
  } catch (error) {
    console.error('TCPing检测失败:', error)
    return {
      host,
      port,
      status: 'filtered',
      error: error instanceof Error ? error.message : '连接失败',
      serviceName: getPortServiceName(port),
      timestamp: new Date().toLocaleString('zh-CN')
    }
  }
}

// 测试TCP连接
const testTCPConnection = async (host: string, port: number): Promise<{ success: boolean; status?: 'open' | 'closed' | 'filtered'; error?: string }> => {
  try {
    // 使用fetch API测试TCP连接
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(`https://${host}:${port}`, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    // 如果请求成功发送（即使被阻止），则端口可能是开放的
    if (response.type === 'opaque') {
      return { success: true, status: 'open' }
    } else {
      return { success: false, status: 'closed', error: '连接被拒绝' }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, status: 'filtered', error: '连接超时' }
    }
    return { success: false, status: 'filtered', error: '连接失败' }
  }
}

// 批量TCPing检测
export const performBatchTCPingDetection = async (host: string, ports: number[]): Promise<TCPingResult[]> => {
  const results: TCPingResult[] = []
  
  for (const port of ports) {
    try {
      const result = await performTCPingDetection(host, port)
      results.push(result)
      
      // 添加延迟避免过于频繁的请求
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      results.push({
        host,
        port,
        status: 'filtered',
        error: error instanceof Error ? error.message : '检测失败',
        serviceName: getPortServiceName(port),
        timestamp: new Date().toLocaleString('zh-CN')
      })
    }
  }
  
  return results
}

// 常用端口检测
export const performCommonPortsDetection = async (host: string): Promise<TCPingResult[]> => {
  const commonPorts = [
    21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 1433, 1521, 3306, 3389, 5432, 5900, 6379, 8080, 8443
  ]
  
  return await performBatchTCPingDetection(host, commonPorts)
}

// 获取端口服务名称
export const getPortServiceName = (port: number): string => {
  const portServices: { [key: number]: string } = {
    21: 'FTP',
    22: 'SSH',
    23: 'Telnet',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    110: 'POP3',
    143: 'IMAP',
    443: 'HTTPS',
    993: 'IMAPS',
    995: 'POP3S',
    1433: 'MSSQL',
    1521: 'Oracle',
    3306: 'MySQL',
    3389: 'RDP',
    5432: 'PostgreSQL',
    5900: 'VNC',
    6379: 'Redis',
    8080: 'HTTP-Alt',
    8443: 'HTTPS-Alt'
  }
  
  return portServices[port] || 'Unknown'
}

// 获取端口状态描述
export const getPortStatusDescription = (status: 'open' | 'closed' | 'filtered'): string => {
  switch (status) {
    case 'open':
      return '端口开放，服务正在运行'
    case 'closed':
      return '端口关闭，服务未运行'
    case 'filtered':
      return '端口被过滤，可能被防火墙阻止'
    default:
      return '未知状态'
  }
}

// 模拟TCPing检测（用于演示）
export const performMockTCPingDetection = async (host: string, port: number): Promise<TCPingResult> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
  
  // 模拟不同的端口状态
  const random = Math.random()
  if (random > 0.7) {
    return {
      host,
      port,
      status: 'open',
      responseTime: 50 + Math.random() * 100,
      serviceName: getPortServiceName(port),
      timestamp: new Date().toLocaleString('zh-CN')
    }
  } else if (random > 0.4) {
    return {
      host,
      port,
      status: 'closed',
      error: '连接被拒绝',
      serviceName: getPortServiceName(port),
      timestamp: new Date().toLocaleString('zh-CN')
    }
  } else {
    return {
      host,
      port,
      status: 'filtered',
      error: '连接超时',
      serviceName: getPortServiceName(port),
      timestamp: new Date().toLocaleString('zh-CN')
    }
  }
}