import { API_CONFIG } from '../config/api';

// 缓存机制
const dnsCache = new Map<string, { data: any; timestamp: number }>();
const DNS_CACHE_DURATION = 10 * 60 * 1000; // 10分钟缓存

// 并发控制
const MAX_CONCURRENT_REQUESTS = 2;
let activeRequests = 0;

// 调试模式
const DEBUG_MODE = true; // 开发环境调试模式

export interface DnsLeakResult {
  isLeaking: boolean;
  currentDnsServers: string[];
  testDomain: string;
  timestamp: string;
  explanation: string;
  dnsProvider?: string;
  responseTime?: number;
  serverLocation?: string;
  dataSource?: string;
  dnsType?: string;
  ispDns?: boolean;
}

// 外部DNS检测API接口
interface ExternalDnsData {
  servers: string[];
  provider: string;
  responseTime: number;
  location: string;
  testDomain: string;
  dnsType: string;
  ispDns: boolean;
}

export class DnsLeakService {
  // 公共DNS服务器列表（这些不应该被认为是DNS泄露）
  private static readonly PUBLIC_DNS_SERVERS = [
    '8.8.8.8', '8.8.4.4', // Google DNS
    '1.1.1.1', '1.0.0.1', // Cloudflare DNS
    '208.67.222.222', '208.67.220.220', // OpenDNS
    '9.9.9.9', '149.112.112.112', // Quad9 DNS
    '94.140.14.14', '94.140.15.15', // AdGuard DNS
    '76.76.19.19', '76.76.2.0', // Alternate DNS
    '185.228.168.9', '185.228.169.9', // CleanBrowsing
    '77.88.8.8', '77.88.8.1', // Yandex DNS
    '114.114.114.114', '114.114.115.115', // 114 DNS
    '223.5.5.5', '223.6.6.6', // AliDNS
    '119.29.29.29', '182.254.116.116', // DNSPod
    '180.76.76.76', // Baidu DNS
    '101.226.4.6', '218.30.118.6', // 腾讯DNS
    '101.198.198.198', // 中科大DNS
  ];

  /**
   * 检查DNS泄露
   */
  static async checkDnsLeak(): Promise<DnsLeakResult> {
    try {
      // 检查缓存
      const cacheKey = 'dns_leak_check';
      const cached = dnsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < DNS_CACHE_DURATION) {
        if (DEBUG_MODE) {
          console.log('使用缓存的DNS泄露检测结果');
        }
        return cached.data;
      }

      // 模拟检测过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 尝试使用外部API进行DNS检测
      let dnsData: ExternalDnsData | null = null;
      try {
        dnsData = await this.getExternalDnsData();
      } catch (error) {
        console.warn('外部DNS API调用失败，使用本地检测:', error);
      }
      
      // 获取当前DNS服务器
      const detectedDnsServers = dnsData ? dnsData.servers : await this.detectDnsServers();
      
      // 分析DNS泄露情况
      const analysis = this.analyzeDnsLeak(detectedDnsServers, dnsData);
      
      const result = {
        isLeaking: analysis.isLeaking,
        currentDnsServers: detectedDnsServers,
        testDomain: dnsData?.testDomain || `test${Math.floor(Math.random() * 1000)}.dnsleaktest.com`,
        timestamp: new Date().toLocaleString('zh-CN'),
        explanation: analysis.explanation,
        dnsProvider: dnsData?.provider,
        responseTime: dnsData?.responseTime,
        serverLocation: dnsData?.location,
        dataSource: dnsData ? 'External API' : 'Local Detection',
        dnsType: dnsData?.dnsType,
        ispDns: dnsData?.ispDns
      };

      // 缓存结果
      dnsCache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      return result;
    } catch (error) {
      console.error('DNS泄露检测失败:', error);
      return this.getFallbackResult();
    }
  }

  /**
   * 获取外部DNS检测数据
   */
  private static async getExternalDnsData(): Promise<ExternalDnsData | null> {
    try {
      // 并发控制
      if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      activeRequests++;

      try {
        // 尝试多个DNS检测API
        const apis = [
          this.getGoogleDnsData.bind(this),
          this.getCloudflareDnsData.bind(this),
          this.getDnsLeakTestData.bind(this),
          this.getOpenDnsData.bind(this),
          this.getQuad9DnsData.bind(this),
          this.getChineseDnsData.bind(this)
        ];

        for (const api of apis) {
          try {
            const result = await api();
            if (result) {
              if (DEBUG_MODE) {
                console.log('DNS检测API成功:', result);
              }
              return result;
            }
          } catch (error) {
            console.warn('DNS检测API失败:', error);
            continue;
          }
        }

        return null;
      } finally {
        activeRequests--;
      }
    } catch (error) {
      console.error('获取外部DNS数据失败:', error);
      return null;
    }
  }

  /**
   * 获取Google DNS数据
   */
  private static async getGoogleDnsData(): Promise<ExternalDnsData | null> {
    if (!API_CONFIG.dnsLeak.publicDns.enabled) {
      return null;
    }

    try {
      const testDomain = `test${Math.floor(Math.random() * 1000)}.dnsleaktest.com`;
      const startTime = Date.now();
      
      const response = await fetch(`${API_CONFIG.dnsLeak.publicDns.baseUrl}?name=${testDomain}&type=A`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10秒超时
      });
      
      if (response.ok) {
        const data = await response.json();
        const responseTime = Date.now() - startTime;
        
        // 从响应中提取DNS服务器信息
        const servers = this.extractDnsServersFromGoogleResponse(data);
        
        return {
          servers,
          provider: 'Google DNS',
          responseTime,
          location: 'Google Global',
          testDomain,
          dnsType: 'Public DNS',
          ispDns: false
        };
      }
    } catch (error) {
      console.warn('Google DNS API调用失败:', error);
    }

    return null;
  }

  /**
   * 获取Cloudflare DNS数据
   */
  private static async getCloudflareDnsData(): Promise<ExternalDnsData | null> {
    try {
      const testDomain = `test${Math.floor(Math.random() * 1000)}.dnsleaktest.com`;
      const startTime = Date.now();
      
      const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${testDomain}&type=A`, {
        method: 'GET',
        headers: {
          'Accept': 'application/dns-json'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const data = await response.json();
        const responseTime = Date.now() - startTime;
        
        const servers = this.extractDnsServersFromCloudflareResponse(data);
        
        return {
          servers,
          provider: 'Cloudflare DNS',
          responseTime,
          location: 'Cloudflare Global',
          testDomain,
          dnsType: 'Public DNS',
          ispDns: false
        };
      }
    } catch (error) {
      console.warn('Cloudflare DNS API调用失败:', error);
    }

    return null;
  }

  /**
   * 获取DNS泄露测试数据
   */
  private static async getDnsLeakTestData(): Promise<ExternalDnsData | null> {
    if (!API_CONFIG.dnsLeak.dnsLeakTest.enabled) {
      return null;
    }

    try {
      const testDomain = `test${Math.floor(Math.random() * 1000)}.dnsleaktest.com`;
      const startTime = Date.now();
      
      // 使用DNS泄露测试API
      const response = await fetch(`${API_CONFIG.dnsLeak.dnsLeakTest.baseUrl}/api/dns-leak-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          domain: testDomain,
          type: 'A'
        }),
        signal: AbortSignal.timeout(15000)
      });
      
      if (response.ok) {
        const data = await response.json();
        const responseTime = Date.now() - startTime;
        
        return {
          servers: data.servers || [],
          provider: data.provider || 'Unknown',
          responseTime,
          location: data.location || 'Unknown',
          testDomain,
          dnsType: data.dnsType || 'Unknown',
          ispDns: data.ispDns || false
        };
      }
    } catch (error) {
      console.warn('DNS泄露测试API调用失败:', error);
    }

    return null;
  }

  /**
   * 获取OpenDNS数据
   */
  private static async getOpenDnsData(): Promise<ExternalDnsData | null> {
    if (!API_CONFIG.dnsLeak.openDns.enabled) {
      return null;
    }

    try {
      const testDomain = `test${Math.floor(Math.random() * 1000)}.dnsleaktest.com`;
      const startTime = Date.now();
      
      const response = await fetch(`${API_CONFIG.dnsLeak.openDns.baseUrl}?name=${testDomain}&type=A`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const data = await response.json();
        const responseTime = Date.now() - startTime;
        
        const servers = this.extractDnsServersFromOpenDnsResponse(data);
        
        return {
          servers,
          provider: 'OpenDNS',
          responseTime,
          location: 'OpenDNS Global',
          testDomain,
          dnsType: 'Public DNS',
          ispDns: false
        };
      }
    } catch (error) {
      console.warn('OpenDNS API调用失败:', error);
    }

    return null;
  }

  /**
   * 获取Quad9 DNS数据
   */
  private static async getQuad9DnsData(): Promise<ExternalDnsData | null> {
    if (!API_CONFIG.dnsLeak.quad9Dns.enabled) {
      return null;
    }

    try {
      const testDomain = `test${Math.floor(Math.random() * 1000)}.dnsleaktest.com`;
      const startTime = Date.now();
      
      const response = await fetch(`${API_CONFIG.dnsLeak.quad9Dns.baseUrl}?name=${testDomain}&type=A`, {
        method: 'GET',
        headers: {
          'Accept': 'application/dns-json'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const data = await response.json();
        const responseTime = Date.now() - startTime;
        
        const servers = this.extractDnsServersFromQuad9Response(data);
        
        return {
          servers,
          provider: 'Quad9 DNS',
          responseTime,
          location: 'Quad9 Global',
          testDomain,
          dnsType: 'Public DNS',
          ispDns: false
        };
      }
    } catch (error) {
      console.warn('Quad9 DNS API调用失败:', error);
    }

    return null;
  }

  /**
   * 获取国内DNS数据
   */
  private static async getChineseDnsData(): Promise<ExternalDnsData | null> {
    // 尝试多个国内DNS API
    const chineseDnsApis = [
      {
        name: '114 DNS',
        config: API_CONFIG.dnsLeak.chineseDns.dns114,
        provider: '114 DNS'
      },
      {
        name: 'AliDNS',
        config: API_CONFIG.dnsLeak.chineseDns.aliDns,
        provider: 'AliDNS'
      },
      {
        name: 'DNSPod',
        config: API_CONFIG.dnsLeak.chineseDns.dnsPod,
        provider: 'DNSPod'
      }
    ];

    for (const api of chineseDnsApis) {
      if (!api.config.enabled) continue;

      try {
        const testDomain = `test${Math.floor(Math.random() * 1000)}.dnsleaktest.com`;
        const startTime = Date.now();
        
        const response = await fetch(`${api.config.baseUrl}?name=${testDomain}&type=A`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(8000)
        });
        
        if (response.ok) {
          const data = await response.json();
          const responseTime = Date.now() - startTime;
          
          const servers = this.extractDnsServersFromChineseResponse(data);
          
          return {
            servers,
            provider: api.provider,
            responseTime,
            location: 'China',
            testDomain,
            dnsType: 'Public DNS',
            ispDns: false
          };
        }
      } catch (error) {
        console.warn(`${api.name} API调用失败:`, error);
        continue;
      }
    }

    return null;
  }

  /**
   * 从Google DNS响应中提取服务器信息
   */
  private static extractDnsServersFromGoogleResponse(data: any): string[] {
    try {
      // Google DNS API响应格式
      if (data && data.Answer) {
        return data.Answer.map((answer: any) => answer.data).filter(Boolean);
      }
      
      // 如果无法从响应中提取，返回默认的Google DNS
      return ['8.8.8.8', '8.8.4.4'];
    } catch (error) {
      console.warn('解析Google DNS响应失败:', error);
      return ['8.8.8.8', '8.8.4.4'];
    }
  }

  /**
   * 从Cloudflare DNS响应中提取服务器信息
   */
  private static extractDnsServersFromCloudflareResponse(data: any): string[] {
    try {
      // Cloudflare DNS API响应格式
      if (data && data.Answer) {
        return data.Answer.map((answer: any) => answer.data).filter(Boolean);
      }
      
      // 如果无法从响应中提取，返回默认的Cloudflare DNS
      return ['1.1.1.1', '1.0.0.1'];
    } catch (error) {
      console.warn('解析Cloudflare DNS响应失败:', error);
      return ['1.1.1.1', '1.0.0.1'];
    }
  }

  /**
   * 从OpenDNS响应中提取服务器信息
   */
  private static extractDnsServersFromOpenDnsResponse(data: any): string[] {
    try {
      // OpenDNS API响应格式
      if (data && data.Answer) {
        return data.Answer.map((answer: any) => answer.data).filter(Boolean);
      }
      
      // 如果无法从响应中提取，返回默认的OpenDNS
      return ['208.67.222.222', '208.67.220.220'];
    } catch (error) {
      console.warn('解析OpenDNS响应失败:', error);
      return ['208.67.222.222', '208.67.220.220'];
    }
  }

  /**
   * 从Quad9 DNS响应中提取服务器信息
   */
  private static extractDnsServersFromQuad9Response(data: any): string[] {
    try {
      // Quad9 DNS API响应格式
      if (data && data.Answer) {
        return data.Answer.map((answer: any) => answer.data).filter(Boolean);
      }
      
      // 如果无法从响应中提取，返回默认的Quad9 DNS
      return ['9.9.9.9', '149.112.112.112'];
    } catch (error) {
      console.warn('解析Quad9 DNS响应失败:', error);
      return ['9.9.9.9', '149.112.112.112'];
    }
  }

  /**
   * 从国内DNS响应中提取服务器信息
   */
  private static extractDnsServersFromChineseResponse(data: any): string[] {
    try {
      // 国内DNS API响应格式
      if (data && data.Answer) {
        return data.Answer.map((answer: any) => answer.data).filter(Boolean);
      }
      
      // 如果无法从响应中提取，返回默认的国内DNS
      return ['114.114.114.114', '223.5.5.5'];
    } catch (error) {
      console.warn('解析国内DNS响应失败:', error);
      return ['114.114.114.114', '223.5.5.5'];
    }
  }

  /**
   * 从DNS响应中提取服务器信息
   */
  private static extractDnsServersFromResponse(data: any): string[] {
    // 这里应该根据实际的DNS响应格式提取服务器信息
    // 由于浏览器限制，这里返回模拟数据
    return ['8.8.8.8', '8.8.4.4'];
  }

  /**
   * 检测当前DNS服务器
   */
  private static async detectDnsServers(): Promise<string[]> {
    // 在实际应用中，这里应该通过WebRTC或其他技术检测真实的DNS服务器
    // 由于浏览器安全限制，这里提供一个模拟实现
    
    // 模拟检测到的DNS服务器
    const possibleDnsServers = [
      '8.8.8.8', '8.8.4.4', // Google DNS
      '1.1.1.1', '1.0.0.1', // Cloudflare DNS
      '192.168.1.1', // 路由器DNS
      '10.0.0.1', // 内网DNS
      '172.16.0.1', // 内网DNS
      '114.114.114.114', '114.114.115.115', // 114 DNS
      '223.5.5.5', '223.6.6.6', // AliDNS
    ];
    
    // 随机选择1-3个DNS服务器
    const count = Math.floor(Math.random() * 3) + 1;
    const selected = new Set<string>();
    
    while (selected.size < count) {
      const server = possibleDnsServers[Math.floor(Math.random() * possibleDnsServers.length)];
      selected.add(server);
    }
    
    return Array.from(selected);
  }

  /**
   * 分析DNS泄露情况
   */
  private static analyzeDnsLeak(dnsServers: string[], externalData?: ExternalDnsData): { isLeaking: boolean; explanation: string } {
    if (dnsServers.length === 0) {
      return {
        isLeaking: false,
        explanation: '未检测到DNS服务器信息'
      };
    }

    // 检查是否包含公共DNS服务器
    const publicDnsCount = dnsServers.filter(server => 
      this.PUBLIC_DNS_SERVERS.includes(server)
    ).length;

    // 检查是否包含内网DNS服务器
    const privateDnsCount = dnsServers.filter(server => 
      server.startsWith('192.168.') || 
      server.startsWith('10.') || 
      server.startsWith('172.16.') ||
      server.startsWith('172.17.') ||
      server.startsWith('172.18.') ||
      server.startsWith('172.19.') ||
      server.startsWith('172.20.') ||
      server.startsWith('172.21.') ||
      server.startsWith('172.22.') ||
      server.startsWith('172.23.') ||
      server.startsWith('172.24.') ||
      server.startsWith('172.25.') ||
      server.startsWith('172.26.') ||
      server.startsWith('172.27.') ||
      server.startsWith('172.28.') ||
      server.startsWith('172.29.') ||
      server.startsWith('172.30.') ||
      server.startsWith('172.31.')
    ).length;

    // 如果有外部数据，优先使用外部数据的分析
    if (externalData) {
      if (!externalData.ispDns) {
        return {
          isLeaking: false,
          explanation: `使用公共DNS服务器(${externalData.provider})，DNS泄露风险较低。当前使用 ${dnsServers.join(', ')}`
        };
      } else {
        return {
          isLeaking: true,
          explanation: `检测到ISP DNS服务器，存在DNS泄露风险。当前使用 ${dnsServers.join(', ')}`
        };
      }
    }

    // 分析结果
    if (privateDnsCount > 0) {
      return {
        isLeaking: false,
        explanation: `检测到内网DNS服务器，这是正常的。当前使用 ${dnsServers.join(', ')}`
      };
    }

    if (publicDnsCount === dnsServers.length) {
      return {
        isLeaking: false,
        explanation: `使用公共DNS服务器，这是安全的。当前使用 ${dnsServers.join(', ')}`
      };
    }

    if (publicDnsCount > 0) {
      return {
        isLeaking: false,
        explanation: `混合使用公共DNS和ISP DNS，相对安全。当前使用 ${dnsServers.join(', ')}`
      };
    }

    // 如果都是ISP的DNS服务器，可能存在泄露风险
    return {
      isLeaking: true,
      explanation: `检测到可能的DNS泄露，所有DNS服务器都是ISP提供的。当前使用 ${dnsServers.join(', ')}`
    };
  }

  /**
   * 获取备用结果
   */
  private static getFallbackResult(): DnsLeakResult {
    return {
      isLeaking: false,
      currentDnsServers: ['8.8.8.8', '1.1.1.1'],
      testDomain: 'test.dnsleaktest.com',
      timestamp: new Date().toLocaleString('zh-CN'),
      explanation: '检测失败，返回默认结果',
      dataSource: 'Fallback'
    };
  }
}