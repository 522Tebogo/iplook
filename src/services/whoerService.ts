import { API_CONFIG } from '../config/api';

// 缓存机制
const whoerCache = new Map<string, { data: any; timestamp: number }>();
const WHOER_CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 并发控制
const MAX_CONCURRENT_REQUESTS = 2;
let activeRequests = 0;

// 调试模式
const DEBUG_MODE = true; // 开发环境调试模式

export interface WhoerResult {
  ip: string;
  privacyScore: number;
  location: string;
  isp: string;
  timezone: string;
  usingProxy: boolean;
  usingVpn: boolean;
  usingTor: boolean;
  browserFingerprint: string;
  httpHeaders: string;
  timestamp: string;
  explanation: string;
  dataSource?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  proxyType?: string;
  vpnProvider?: string;
}

// 外部隐私检测API接口
interface ExternalPrivacyData {
  ip: string;
  privacyScore: number;
  location: string;
  isp: string;
  timezone: string;
  usingProxy: boolean;
  usingVpn: boolean;
  usingTor: boolean;
  countryCode: string;
  city: string;
  region: string;
  proxyType: string;
  vpnProvider: string;
  dataSource: string;
}

export class WhoerService {
  /**
   * 进行Whoer查询
   * @param ip IP地址
   */
  static async checkWhoer(ip: string): Promise<WhoerResult> {
    try {
      // 检查缓存
      const cached = whoerCache.get(ip);
      if (cached && Date.now() - cached.timestamp < WHOER_CACHE_DURATION) {
        if (DEBUG_MODE) {
          console.log('使用缓存的Whoer检测结果:', ip);
        }
        return cached.data;
      }

      // 模拟检测过程
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // 首先尝试从外部API获取隐私检测数据
      let externalData: ExternalPrivacyData | null = null;
      try {
        externalData = await this.getExternalPrivacyData(ip);
      } catch (error) {
        console.warn('外部隐私检测API调用失败，使用本地检测:', error);
      }
      
      // 基于IP地址进行检测
      const analysis = this.analyzePrivacy(ip, externalData);
      
      const result = {
        ip,
        privacyScore: analysis.privacyScore,
        location: analysis.location,
        isp: analysis.isp,
        timezone: analysis.timezone,
        usingProxy: analysis.usingProxy,
        usingVpn: analysis.usingVpn,
        usingTor: analysis.usingTor,
        browserFingerprint: this.generateBrowserFingerprint(),
        httpHeaders: this.generateHttpHeaders(),
        timestamp: new Date().toLocaleString('zh-CN'),
        explanation: analysis.explanation,
        dataSource: externalData?.dataSource || 'Local Detection',
        countryCode: externalData?.countryCode,
        city: externalData?.city,
        region: externalData?.region,
        proxyType: externalData?.proxyType,
        vpnProvider: externalData?.vpnProvider
      };

      // 缓存结果
      whoerCache.set(ip, { data: result, timestamp: Date.now() });
      
      return result;
    } catch (error) {
      console.error('Whoer检测失败:', error);
      return this.getFallbackResult(ip);
    }
  }

  /**
   * 获取外部隐私检测数据
   */
  private static async getExternalPrivacyData(ip: string): Promise<ExternalPrivacyData | null> {
    try {
      // 并发控制
      if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      activeRequests++;

      try {
        // 尝试多个隐私检测API
        const apis = [
          this.getWhoerApiData.bind(this),
          this.getIpApiData.bind(this),
          this.getIp2LocationData.bind(this),
          this.getIpApiComData.bind(this),
          this.getIpGeolocationData.bind(this),
          this.getIpInfoData.bind(this),
          this.getIpStackData.bind(this)
        ];

        for (const api of apis) {
          try {
            const result = await api(ip);
            if (result) {
              if (DEBUG_MODE) {
                console.log('隐私检测API成功:', result);
              }
              return result;
            }
          } catch (error) {
            console.warn('隐私检测API失败:', error);
            continue;
          }
        }

        return null;
      } finally {
        activeRequests--;
      }
    } catch (error) {
      console.error('获取外部隐私数据失败:', error);
      return null;
    }
  }

  /**
   * 获取Whoer API数据
   */
  private static async getWhoerApiData(ip: string): Promise<ExternalPrivacyData | null> {
    if (!API_CONFIG.whoer.whoerApi.enabled || !API_CONFIG.whoer.whoerApi.apiKey) {
      return null;
    }

    try {
      const response = await fetch(`${API_CONFIG.whoer.whoerApi.baseUrl}/ip/${ip}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.whoer.whoerApi.apiKey}`,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(15000)
      });

      if (response.ok) {
        const data = await response.json();
        
        return {
          ip: data.ip || ip,
          privacyScore: this.calculatePrivacyScore(data),
          location: data.location || 'Unknown',
          isp: data.isp || 'Unknown',
          timezone: data.timezone || 'UTC',
          usingProxy: data.proxy || false,
          usingVpn: data.vpn || false,
          usingTor: data.tor || false,
          countryCode: data.country_code || 'Unknown',
          city: data.city || 'Unknown',
          region: data.region || 'Unknown',
          proxyType: data.proxy_type || 'Unknown',
          vpnProvider: data.vpn_provider || 'Unknown',
          dataSource: 'Whoer API'
        };
      }
    } catch (error) {
      console.warn('Whoer API调用失败:', error);
    }

    return null;
  }

  /**
   * 获取IP API数据
   */
  private static async getIpApiData(ip: string): Promise<ExternalPrivacyData | null> {
    if (!API_CONFIG.whoer.ipApi.enabled) {
      return null;
    }

    try {
      const response = await fetch(`${API_CONFIG.whoer.ipApi.baseUrl}/${ip}/json/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        
        // 分析代理/VPN使用情况
        const proxyAnalysis = this.analyzeProxyFromIpApi(data);
        
        return {
          ip: data.ip || ip,
          privacyScore: this.calculatePrivacyScoreFromIpApi(data, proxyAnalysis),
          location: data.country_name || 'Unknown',
          isp: data.org || 'Unknown',
          timezone: data.timezone || 'UTC',
          usingProxy: proxyAnalysis.usingProxy,
          usingVpn: proxyAnalysis.usingVpn,
          usingTor: proxyAnalysis.usingTor,
          countryCode: data.country_code || 'Unknown',
          city: data.city || 'Unknown',
          region: data.region || 'Unknown',
          proxyType: proxyAnalysis.proxyType,
          vpnProvider: proxyAnalysis.vpnProvider,
          dataSource: 'IP API'
        };
      }
    } catch (error) {
      console.warn('IP API调用失败:', error);
    }

    return null;
  }

  /**
   * 获取IP2Location数据
   */
  private static async getIp2LocationData(ip: string): Promise<ExternalPrivacyData | null> {
    if (!API_CONFIG.whoer.ip2Location.enabled) {
      return null;
    }

    try {
      const response = await fetch(`${API_CONFIG.whoer.ip2Location.baseUrl}/ip/${ip}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        
        return {
          ip: data.ip || ip,
          privacyScore: this.calculatePrivacyScoreFromIp2Location(data),
          location: data.country_name || 'Unknown',
          isp: data.isp || 'Unknown',
          timezone: data.time_zone || 'UTC',
          usingProxy: data.proxy || false,
          usingVpn: data.vpn || false,
          usingTor: data.tor || false,
          countryCode: data.country_code || 'Unknown',
          city: data.city_name || 'Unknown',
          region: data.region_name || 'Unknown',
          proxyType: data.proxy_type || 'Unknown',
          vpnProvider: data.vpn_provider || 'Unknown',
          dataSource: 'IP2Location API'
        };
      }
    } catch (error) {
      console.warn('IP2Location API调用失败:', error);
    }

    return null;
  }

  /**
   * 获取IP-API.com数据
   */
  private static async getIpApiComData(ip: string): Promise<ExternalPrivacyData | null> {
    if (!API_CONFIG.whoer.ipApiCom.enabled) {
      return null;
    }

    try {
      const response = await fetch(`${API_CONFIG.whoer.ipApiCom.baseUrl}/${ip}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        
        // 分析代理/VPN使用情况
        const proxyAnalysis = this.analyzeProxyFromIpApiCom(data);
        
        return {
          ip: data.query || ip,
          privacyScore: this.calculatePrivacyScoreFromIpApiCom(data, proxyAnalysis),
          location: data.country || 'Unknown',
          isp: data.isp || 'Unknown',
          timezone: data.timezone || 'UTC',
          usingProxy: proxyAnalysis.usingProxy,
          usingVpn: proxyAnalysis.usingVpn,
          usingTor: proxyAnalysis.usingTor,
          countryCode: data.countryCode || 'Unknown',
          city: data.city || 'Unknown',
          region: data.regionName || 'Unknown',
          proxyType: proxyAnalysis.proxyType,
          vpnProvider: proxyAnalysis.vpnProvider,
          dataSource: 'IP-API.com'
        };
      }
    } catch (error) {
      console.warn('IP-API.com调用失败:', error);
    }

    return null;
  }

  /**
   * 获取IPGeolocation数据
   */
  private static async getIpGeolocationData(ip: string): Promise<ExternalPrivacyData | null> {
    if (!API_CONFIG.whoer.ipGeolocation.enabled || !API_CONFIG.whoer.ipGeolocation.apiKey) {
      return null;
    }

    try {
      const response = await fetch(`${API_CONFIG.whoer.ipGeolocation.baseUrl}/ipgeo?apiKey=${API_CONFIG.whoer.ipGeolocation.apiKey}&ip=${ip}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        
        return {
          ip: data.ip || ip,
          privacyScore: this.calculatePrivacyScoreFromIpGeolocation(data),
          location: data.country_name || 'Unknown',
          isp: data.isp || 'Unknown',
          timezone: data.time_zone?.name || 'UTC',
          usingProxy: data.proxy || false,
          usingVpn: data.vpn || false,
          usingTor: data.tor || false,
          countryCode: data.country_code2 || 'Unknown',
          city: data.city || 'Unknown',
          region: data.state_prov || 'Unknown',
          proxyType: data.proxy_type || 'Unknown',
          vpnProvider: data.vpn_provider || 'Unknown',
          dataSource: 'IPGeolocation API'
        };
      }
    } catch (error) {
      console.warn('IPGeolocation API调用失败:', error);
    }

    return null;
  }

  /**
   * 获取IPInfo数据
   */
  private static async getIpInfoData(ip: string): Promise<ExternalPrivacyData | null> {
    if (!API_CONFIG.whoer.ipInfo.enabled) {
      return null;
    }

    try {
      const url = API_CONFIG.whoer.ipInfo.apiKey 
        ? `${API_CONFIG.whoer.ipInfo.baseUrl}/${ip}?token=${API_CONFIG.whoer.ipInfo.apiKey}`
        : `${API_CONFIG.whoer.ipInfo.baseUrl}/${ip}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        
        return {
          ip: data.ip || ip,
          privacyScore: this.calculatePrivacyScoreFromIpInfo(data),
          location: data.country || 'Unknown',
          isp: data.org || 'Unknown',
          timezone: data.timezone || 'UTC',
          usingProxy: data.proxy || false,
          usingVpn: data.vpn || false,
          usingTor: data.tor || false,
          countryCode: data.country || 'Unknown',
          city: data.city || 'Unknown',
          region: data.region || 'Unknown',
          proxyType: data.proxy_type || 'Unknown',
          vpnProvider: data.vpn_provider || 'Unknown',
          dataSource: 'IPInfo API'
        };
      }
    } catch (error) {
      console.warn('IPInfo API调用失败:', error);
    }

    return null;
  }

  /**
   * 获取IPStack数据
   */
  private static async getIpStackData(ip: string): Promise<ExternalPrivacyData | null> {
    if (!API_CONFIG.whoer.ipStack.enabled || !API_CONFIG.whoer.ipStack.apiKey) {
      return null;
    }

    try {
      const response = await fetch(`${API_CONFIG.whoer.ipStack.baseUrl}/${ip}?access_key=${API_CONFIG.whoer.ipStack.apiKey}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        
        return {
          ip: data.ip || ip,
          privacyScore: this.calculatePrivacyScoreFromIpStack(data),
          location: data.country_name || 'Unknown',
          isp: data.connection?.isp || 'Unknown',
          timezone: data.time_zone?.id || 'UTC',
          usingProxy: data.security?.proxy || false,
          usingVpn: data.security?.vpn || false,
          usingTor: data.security?.tor || false,
          countryCode: data.country_code || 'Unknown',
          city: data.city || 'Unknown',
          region: data.region_name || 'Unknown',
          proxyType: data.security?.proxy_type || 'Unknown',
          vpnProvider: data.security?.vpn_provider || 'Unknown',
          dataSource: 'IPStack API'
        };
      }
    } catch (error) {
      console.warn('IPStack API调用失败:', error);
    }

    return null;
  }

  /**
   * 从IP API数据中分析代理使用情况
   */
  private static analyzeProxyFromIpApi(data: any): {
    usingProxy: boolean;
    usingVpn: boolean;
    usingTor: boolean;
    proxyType: string;
    vpnProvider: string;
  } {
    const org = (data.org || '').toLowerCase();
    const asn = (data.asn || '').toLowerCase();
    
    let usingProxy = false;
    let usingVpn = false;
    let usingTor = false;
    let proxyType = 'Unknown';
    let vpnProvider = 'Unknown';

    // 检查VPN提供商
    const vpnProviders = [
      'nordvpn', 'expressvpn', 'surfshark', 'cyberghost', 'protonvpn',
      'private internet access', 'pia', 'windscribe', 'tunnelbear',
      'hotspot shield', 'vyprvpn', 'ipvanish', 'purevpn'
    ];

    for (const provider of vpnProviders) {
      if (org.includes(provider) || asn.includes(provider)) {
        usingVpn = true;
        usingProxy = true;
        vpnProvider = provider;
        proxyType = 'VPN';
        break;
      }
    }

    // 检查代理服务
    const proxyKeywords = ['proxy', 'datacenter', 'hosting', 'cloud'];
    for (const keyword of proxyKeywords) {
      if (org.includes(keyword) || asn.includes(keyword)) {
        usingProxy = true;
        if (!usingVpn) {
          proxyType = 'Proxy';
        }
        break;
      }
    }

    // 检查Tor网络
    if (org.includes('tor') || asn.includes('tor')) {
      usingTor = true;
      usingProxy = true;
      proxyType = 'Tor';
    }

    return {
      usingProxy,
      usingVpn,
      usingTor,
      proxyType,
      vpnProvider
    };
  }

  /**
   * 计算Whoer API的隐私分数
   */
  private static calculatePrivacyScore(data: any): number {
    let score = 50; // 基础分数

    if (data.proxy) score += 20;
    if (data.vpn) score += 30;
    if (data.tor) score += 40;

    // 根据代理类型调整分数
    if (data.proxy_type === 'VPN') score += 10;
    if (data.proxy_type === 'Tor') score += 20;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 计算IP API的隐私分数
   */
  private static calculatePrivacyScoreFromIpApi(data: any, proxyAnalysis: any): number {
    let score = 50; // 基础分数

    if (proxyAnalysis.usingProxy) score += 20;
    if (proxyAnalysis.usingVpn) score += 30;
    if (proxyAnalysis.usingTor) score += 40;

    // 根据ISP类型调整分数
    const org = (data.org || '').toLowerCase();
    if (org.includes('datacenter') || org.includes('hosting')) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 计算IP2Location的隐私分数
   */
  private static calculatePrivacyScoreFromIp2Location(data: any): number {
    let score = 50; // 基础分数

    if (data.proxy) score += 20;
    if (data.vpn) score += 30;
    if (data.tor) score += 40;

    // 根据代理类型调整分数
    if (data.proxy_type === 'VPN') score += 10;
    if (data.proxy_type === 'Tor') score += 20;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 从IP-API.com数据中分析代理使用情况
   */
  private static analyzeProxyFromIpApiCom(data: any): {
    usingProxy: boolean;
    usingVpn: boolean;
    usingTor: boolean;
    proxyType: string;
    vpnProvider: string;
  } {
    const isp = (data.isp || '').toLowerCase();
    const org = (data.org || '').toLowerCase();
    const as = (data.as || '').toLowerCase();
    
    let usingProxy = false;
    let usingVpn = false;
    let usingTor = false;
    let proxyType = 'Unknown';
    let vpnProvider = 'Unknown';

    // 检查VPN提供商
    const vpnProviders = [
      'nordvpn', 'expressvpn', 'surfshark', 'cyberghost', 'protonvpn',
      'private internet access', 'pia', 'windscribe', 'tunnelbear',
      'hotspot shield', 'vyprvpn', 'ipvanish', 'purevpn'
    ];

    for (const provider of vpnProviders) {
      if (isp.includes(provider) || org.includes(provider) || as.includes(provider)) {
        usingVpn = true;
        usingProxy = true;
        vpnProvider = provider;
        proxyType = 'VPN';
        break;
      }
    }

    // 检查代理服务
    const proxyKeywords = ['proxy', 'datacenter', 'hosting', 'cloud'];
    for (const keyword of proxyKeywords) {
      if (isp.includes(keyword) || org.includes(keyword) || as.includes(keyword)) {
        usingProxy = true;
        if (!usingVpn) {
          proxyType = 'Proxy';
        }
        break;
      }
    }

    // 检查Tor网络
    if (isp.includes('tor') || org.includes('tor') || as.includes('tor')) {
      usingTor = true;
      usingProxy = true;
      proxyType = 'Tor';
    }

    return {
      usingProxy,
      usingVpn,
      usingTor,
      proxyType,
      vpnProvider
    };
  }

  /**
   * 计算IP-API.com的隐私分数
   */
  private static calculatePrivacyScoreFromIpApiCom(data: any, proxyAnalysis: any): number {
    let score = 50; // 基础分数

    if (proxyAnalysis.usingProxy) score += 20;
    if (proxyAnalysis.usingVpn) score += 30;
    if (proxyAnalysis.usingTor) score += 40;

    // 根据ISP类型调整分数
    const isp = (data.isp || '').toLowerCase();
    if (isp.includes('datacenter') || isp.includes('hosting')) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 计算IPGeolocation的隐私分数
   */
  private static calculatePrivacyScoreFromIpGeolocation(data: any): number {
    let score = 50; // 基础分数

    if (data.proxy) score += 20;
    if (data.vpn) score += 30;
    if (data.tor) score += 40;

    // 根据代理类型调整分数
    if (data.proxy_type === 'VPN') score += 10;
    if (data.proxy_type === 'Tor') score += 20;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 计算IPInfo的隐私分数
   */
  private static calculatePrivacyScoreFromIpInfo(data: any): number {
    let score = 50; // 基础分数

    if (data.proxy) score += 20;
    if (data.vpn) score += 30;
    if (data.tor) score += 40;

    // 根据代理类型调整分数
    if (data.proxy_type === 'VPN') score += 10;
    if (data.proxy_type === 'Tor') score += 20;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 计算IPStack的隐私分数
   */
  private static calculatePrivacyScoreFromIpStack(data: any): number {
    let score = 50; // 基础分数

    if (data.security?.proxy) score += 20;
    if (data.security?.vpn) score += 30;
    if (data.security?.tor) score += 40;

    // 根据代理类型调整分数
    if (data.security?.proxy_type === 'VPN') score += 10;
    if (data.security?.proxy_type === 'Tor') score += 20;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 分析隐私保护情况
   */
  private static analyzePrivacy(ip: string, externalData?: ExternalPrivacyData): {
    privacyScore: number;
    location: string;
    isp: string;
    timezone: string;
    usingProxy: boolean;
    usingVpn: boolean;
    usingTor: boolean;
    explanation: string;
  } {
    // 如果有外部数据，优先使用外部数据的分析
    if (externalData) {
      let explanation = '基于外部API检测结果';
      
      if (externalData.usingTor) {
        explanation = '检测到Tor网络出口节点，隐私保护级别很高';
      } else if (externalData.usingVpn) {
        explanation = `检测到VPN服务(${externalData.vpnProvider})，隐私保护良好`;
      } else if (externalData.usingProxy) {
        explanation = `检测到代理服务(${externalData.proxyType})，隐私保护一般`;
      } else {
        explanation = '未检测到代理或VPN服务，隐私保护较低';
      }

      return {
        privacyScore: externalData.privacyScore,
        location: externalData.location,
        isp: externalData.isp,
        timezone: externalData.timezone,
        usingProxy: externalData.usingProxy,
        usingVpn: externalData.usingVpn,
        usingTor: externalData.usingTor,
        explanation
      };
    }

    // 检查是否为内网IP
    const isPrivateIP = this.isPrivateIP(ip);
    
    if (isPrivateIP) {
      return {
        privacyScore: 100,
        location: '内网地址',
        isp: '内网',
        timezone: '本地时间',
        usingProxy: false,
        usingVpn: false,
        usingTor: false,
        explanation: '检测到内网IP地址，隐私保护良好'
      };
    }

    // 检查是否为已知的VPN/代理IP段
    const vpnAnalysis = this.checkVpnProxy(ip);
    
    // 基于IP段生成地理位置信息
    const locationInfo = this.getLocationByIP(ip);
    
    // 计算隐私分数
    let privacyScore = 50; // 基础分数
    
    if (vpnAnalysis.usingVpn) {
      privacyScore += 30;
    }
    if (vpnAnalysis.usingProxy) {
      privacyScore += 20;
    }
    if (vpnAnalysis.usingTor) {
      privacyScore += 40;
    }
    
    // 确保分数在0-100范围内
    privacyScore = Math.max(0, Math.min(100, privacyScore));
    
    return {
      privacyScore,
      location: locationInfo.location,
      isp: locationInfo.isp,
      timezone: locationInfo.timezone,
      usingProxy: vpnAnalysis.usingProxy,
      usingVpn: vpnAnalysis.usingVpn,
      usingTor: vpnAnalysis.usingTor,
      explanation: vpnAnalysis.explanation
    };
  }

  /**
   * 检查是否为内网IP
   */
  private static isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./, // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
      /^192\.168\./, // 192.168.0.0/16
      /^127\./, // 127.0.0.0/8
      /^169\.254\./, // 169.254.0.0/16 (链路本地)
      /^::1$/, // IPv6 本地回环
      /^fe80:/, // IPv6 链路本地
    ];
    
    return privateRanges.some(range => range.test(ip));
  }

  /**
   * 检查VPN/代理使用情况
   */
  private static checkVpnProxy(ip: string): {
    usingProxy: boolean;
    usingVpn: boolean;
    usingTor: boolean;
    explanation: string;
  } {
    // 已知的VPN/代理IP段（简化版）
    const vpnRanges = [
      /^103\.21\.244\./, // Cloudflare
      /^104\.16\./, // Cloudflare
      /^172\.64\./, // Cloudflare
      /^172\.65\./, // Cloudflare
      /^173\.245\.48\./, // Cloudflare
      /^188\.114\.96\./, // Cloudflare
      /^188\.114\.97\./, // Cloudflare
      /^188\.114\.98\./, // Cloudflare
      /^188\.114\.99\./, // Cloudflare
      /^190\.93\.240\./, // Cloudflare
      /^190\.93\.241\./, // Cloudflare
      /^190\.93\.242\./, // Cloudflare
      /^190\.93\.243\./, // Cloudflare
      /^197\.234\.240\./, // Cloudflare
      /^197\.234\.241\./, // Cloudflare
      /^197\.234\.242\./, // Cloudflare
      /^197\.234\.243\./, // Cloudflare
      /^198\.41\.128\./, // Cloudflare
      /^199\.27\.128\./, // Cloudflare
    ];

    const torRanges = [
      /^176\.10\.99\./, // Tor exit nodes
      /^185\.220\.101\./, // Tor exit nodes
      /^185\.220\.102\./, // Tor exit nodes
      /^185\.220\.103\./, // Tor exit nodes
      /^185\.220\.104\./, // Tor exit nodes
      /^185\.220\.105\./, // Tor exit nodes
      /^185\.220\.106\./, // Tor exit nodes
      /^185\.220\.107\./, // Tor exit nodes
      /^185\.220\.108\./, // Tor exit nodes
      /^185\.220\.109\./, // Tor exit nodes
      /^185\.220\.110\./, // Tor exit nodes
      /^185\.220\.111\./, // Tor exit nodes
      /^185\.220\.112\./, // Tor exit nodes
      /^185\.220\.113\./, // Tor exit nodes
      /^185\.220\.114\./, // Tor exit nodes
      /^185\.220\.115\./, // Tor exit nodes
      /^185\.220\.116\./, // Tor exit nodes
      /^185\.220\.117\./, // Tor exit nodes
      /^185\.220\.118\./, // Tor exit nodes
      /^185\.220\.119\./, // Tor exit nodes
      /^185\.220\.120\./, // Tor exit nodes
      /^185\.220\.121\./, // Tor exit nodes
      /^185\.220\.122\./, // Tor exit nodes
      /^185\.220\.123\./, // Tor exit nodes
      /^185\.220\.124\./, // Tor exit nodes
      /^185\.220\.125\./, // Tor exit nodes
      /^185\.220\.126\./, // Tor exit nodes
      /^185\.220\.127\./, // Tor exit nodes
      /^185\.220\.128\./, // Tor exit nodes
      /^185\.220\.129\./, // Tor exit nodes
      /^185\.220\.130\./, // Tor exit nodes
      /^185\.220\.131\./, // Tor exit nodes
      /^185\.220\.132\./, // Tor exit nodes
      /^185\.220\.133\./, // Tor exit nodes
      /^185\.220\.134\./, // Tor exit nodes
      /^185\.220\.135\./, // Tor exit nodes
      /^185\.220\.136\./, // Tor exit nodes
      /^185\.220\.137\./, // Tor exit nodes
      /^185\.220\.138\./, // Tor exit nodes
      /^185\.220\.139\./, // Tor exit nodes
      /^185\.220\.140\./, // Tor exit nodes
      /^185\.220\.141\./, // Tor exit nodes
      /^185\.220\.142\./, // Tor exit nodes
      /^185\.220\.143\./, // Tor exit nodes
      /^185\.220\.144\./, // Tor exit nodes
      /^185\.220\.145\./, // Tor exit nodes
      /^185\.220\.146\./, // Tor exit nodes
      /^185\.220\.147\./, // Tor exit nodes
      /^185\.220\.148\./, // Tor exit nodes
      /^185\.220\.149\./, // Tor exit nodes
      /^185\.220\.150\./, // Tor exit nodes
      /^185\.220\.151\./, // Tor exit nodes
      /^185\.220\.152\./, // Tor exit nodes
      /^185\.220\.153\./, // Tor exit nodes
      /^185\.220\.154\./, // Tor exit nodes
      /^185\.220\.155\./, // Tor exit nodes
      /^185\.220\.156\./, // Tor exit nodes
      /^185\.220\.157\./, // Tor exit nodes
      /^185\.220\.158\./, // Tor exit nodes
      /^185\.220\.159\./, // Tor exit nodes
      /^185\.220\.160\./, // Tor exit nodes
      /^185\.220\.161\./, // Tor exit nodes
      /^185\.220\.162\./, // Tor exit nodes
      /^185\.220\.163\./, // Tor exit nodes
      /^185\.220\.164\./, // Tor exit nodes
      /^185\.220\.165\./, // Tor exit nodes
      /^185\.220\.166\./, // Tor exit nodes
      /^185\.220\.167\./, // Tor exit nodes
      /^185\.220\.168\./, // Tor exit nodes
      /^185\.220\.169\./, // Tor exit nodes
      /^185\.220\.170\./, // Tor exit nodes
      /^185\.220\.171\./, // Tor exit nodes
      /^185\.220\.172\./, // Tor exit nodes
      /^185\.220\.173\./, // Tor exit nodes
      /^185\.220\.174\./, // Tor exit nodes
      /^185\.220\.175\./, // Tor exit nodes
      /^185\.220\.176\./, // Tor exit nodes
      /^185\.220\.177\./, // Tor exit nodes
      /^185\.220\.178\./, // Tor exit nodes
      /^185\.220\.179\./, // Tor exit nodes
      /^185\.220\.180\./, // Tor exit nodes
      /^185\.220\.181\./, // Tor exit nodes
      /^185\.220\.182\./, // Tor exit nodes
      /^185\.220\.183\./, // Tor exit nodes
      /^185\.220\.184\./, // Tor exit nodes
      /^185\.220\.185\./, // Tor exit nodes
      /^185\.220\.186\./, // Tor exit nodes
      /^185\.220\.187\./, // Tor exit nodes
      /^185\.220\.188\./, // Tor exit nodes
      /^185\.220\.189\./, // Tor exit nodes
      /^185\.220\.190\./, // Tor exit nodes
      /^185\.220\.191\./, // Tor exit nodes
      /^185\.220\.192\./, // Tor exit nodes
      /^185\.220\.193\./, // Tor exit nodes
      /^185\.220\.194\./, // Tor exit nodes
      /^185\.220\.195\./, // Tor exit nodes
      /^185\.220\.196\./, // Tor exit nodes
      /^185\.220\.197\./, // Tor exit nodes
      /^185\.220\.198\./, // Tor exit nodes
      /^185\.220\.199\./, // Tor exit nodes
      /^185\.220\.200\./, // Tor exit nodes
      /^185\.220\.201\./, // Tor exit nodes
      /^185\.220\.202\./, // Tor exit nodes
      /^185\.220\.203\./, // Tor exit nodes
      /^185\.220\.204\./, // Tor exit nodes
      /^185\.220\.205\./, // Tor exit nodes
      /^185\.220\.206\./, // Tor exit nodes
      /^185\.220\.207\./, // Tor exit nodes
      /^185\.220\.208\./, // Tor exit nodes
      /^185\.220\.209\./, // Tor exit nodes
      /^185\.220\.210\./, // Tor exit nodes
      /^185\.220\.211\./, // Tor exit nodes
      /^185\.220\.212\./, // Tor exit nodes
      /^185\.220\.213\./, // Tor exit nodes
      /^185\.220\.214\./, // Tor exit nodes
      /^185\.220\.215\./, // Tor exit nodes
      /^185\.220\.216\./, // Tor exit nodes
      /^185\.220\.217\./, // Tor exit nodes
      /^185\.220\.218\./, // Tor exit nodes
      /^185\.220\.219\./, // Tor exit nodes
      /^185\.220\.220\./, // Tor exit nodes
      /^185\.220\.221\./, // Tor exit nodes
      /^185\.220\.222\./, // Tor exit nodes
      /^185\.220\.223\./, // Tor exit nodes
      /^185\.220\.224\./, // Tor exit nodes
      /^185\.220\.225\./, // Tor exit nodes
      /^185\.220\.226\./, // Tor exit nodes
      /^185\.220\.227\./, // Tor exit nodes
      /^185\.220\.228\./, // Tor exit nodes
      /^185\.220\.229\./, // Tor exit nodes
      /^185\.220\.230\./, // Tor exit nodes
      /^185\.220\.231\./, // Tor exit nodes
      /^185\.220\.232\./, // Tor exit nodes
      /^185\.220\.233\./, // Tor exit nodes
      /^185\.220\.234\./, // Tor exit nodes
      /^185\.220\.235\./, // Tor exit nodes
      /^185\.220\.236\./, // Tor exit nodes
      /^185\.220\.237\./, // Tor exit nodes
      /^185\.220\.238\./, // Tor exit nodes
      /^185\.220\.239\./, // Tor exit nodes
      /^185\.220\.240\./, // Tor exit nodes
      /^185\.220\.241\./, // Tor exit nodes
      /^185\.220\.242\./, // Tor exit nodes
      /^185\.220\.243\./, // Tor exit nodes
      /^185\.220\.244\./, // Tor exit nodes
      /^185\.220\.245\./, // Tor exit nodes
      /^185\.220\.246\./, // Tor exit nodes
      /^185\.220\.247\./, // Tor exit nodes
      /^185\.220\.248\./, // Tor exit nodes
      /^185\.220\.249\./, // Tor exit nodes
      /^185\.220\.250\./, // Tor exit nodes
      /^185\.220\.251\./, // Tor exit nodes
      /^185\.220\.252\./, // Tor exit nodes
      /^185\.220\.253\./, // Tor exit nodes
      /^185\.220\.254\./, // Tor exit nodes
      /^185\.220\.255\./, // Tor exit nodes
    ];

    const isVpn = vpnRanges.some(range => range.test(ip));
    const isTor = torRanges.some(range => range.test(ip));
    
    // 简单的代理检测（基于IP特征）
    const isProxy = isVpn || isTor || this.hasProxyCharacteristics(ip);

    let explanation = '检测到普通IP地址，未发现VPN或代理使用';
    
    if (isTor) {
      explanation = '检测到Tor网络出口节点，隐私保护级别很高';
    } else if (isVpn) {
      explanation = '检测到VPN服务IP段，可能正在使用VPN服务';
    } else if (isProxy) {
      explanation = '检测到代理服务器特征，可能正在使用代理服务';
    }

    return {
      usingProxy: isProxy,
      usingVpn: isVpn,
      usingTor: isTor,
      explanation
    };
  }

  /**
   * 检查IP是否具有代理特征
   */
  private static hasProxyCharacteristics(ip: string): boolean {
    // 简化的代理特征检测
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    
    // 检查是否为数据中心IP段
    const firstOctet = parseInt(parts[0]);
    const secondOctet = parseInt(parts[1]);
    
    // 一些常见的数据中心IP段
    const datacenterRanges = [
      [103, 21], [104, 16], [172, 64], [172, 65], [173, 245],
      [188, 114], [190, 93], [197, 234], [198, 41], [199, 27]
    ];
    
    return datacenterRanges.some(([first, second]) => 
      firstOctet === first && secondOctet === second
    );
  }

  /**
   * 根据IP获取地理位置信息
   */
  private static getLocationByIP(ip: string): {
    location: string;
    isp: string;
    timezone: string;
  } {
    const parts = ip.split('.');
    if (parts.length !== 4) {
      return {
        location: '未知',
        isp: '未知',
        timezone: '未知'
      };
    }

    const firstOctet = parseInt(parts[0]);
    const secondOctet = parseInt(parts[1]);

    // 简化的地理位置判断
    if (firstOctet >= 1 && firstOctet <= 126) {
      return {
        location: '美国',
        isp: '美国ISP',
        timezone: 'America/New_York'
      };
    } else if (firstOctet >= 128 && firstOctet <= 191) {
      return {
        location: '欧洲',
        isp: '欧洲ISP',
        timezone: 'Europe/London'
      };
    } else if (firstOctet >= 192 && firstOctet <= 223) {
      return {
        location: '亚洲',
        isp: '亚洲ISP',
        timezone: 'Asia/Shanghai'
      };
    } else {
      return {
        location: '其他地区',
        isp: '未知ISP',
        timezone: 'UTC'
      };
    }
  }

  /**
   * 生成浏览器指纹
   */
  private static generateBrowserFingerprint(): string {
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const platform = navigator.platform;
    const screenRes = `${screen.width}x${screen.height}`;
    const colorDepth = screen.colorDepth;
    
    return `${userAgent.substring(0, 20)}-${language}-${platform}-${screenRes}-${colorDepth}`;
  }

  /**
   * 生成HTTP头信息
   */
  private static generateHttpHeaders(): string {
    return `User-Agent: ${navigator.userAgent}\nAccept: text/html,application/xhtml+xml\nAccept-Language: ${navigator.language}\nAccept-Encoding: gzip, deflate\nConnection: keep-alive`;
  }

  /**
   * 获取备用结果
   */
  private static getFallbackResult(ip: string): WhoerResult {
    return {
      ip,
      privacyScore: 50,
      location: '未知',
      isp: '未知',
      timezone: 'UTC',
      usingProxy: false,
      usingVpn: false,
      usingTor: false,
      browserFingerprint: 'unknown',
      httpHeaders: 'Unknown',
      timestamp: new Date().toLocaleString('zh-CN'),
      explanation: '检测失败，返回默认结果'
    };
  }
}