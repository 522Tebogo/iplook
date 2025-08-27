// Ping检测结果类型
export interface PingResult {
  host: string;
  packets: number;
  received: number;
  lost: number;
  lossPercentage: number;
  minTime: number;
  maxTime: number;
  avgTime: number;
  times: number[];
  timestamp?: string;
}

// TCPing检测结果类型
export interface TCPingResult {
  host: string;
  port: number;
  status: 'open' | 'closed' | 'filtered';
  responseTime?: number;
  error?: string;
  serviceName?: string;
  timestamp?: string;
}