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

// IP信息类型
export interface IPInfo {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  isp: string;
  timezone: string;
  latitude: number;
  longitude: number;
}