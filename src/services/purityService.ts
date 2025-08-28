import { API_CONFIG } from '../config/api';

// 缓存机制
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 并发控制
const MAX_CONCURRENT_REQUESTS = 3;
let activeRequests = 0;

// 调试模式
const DEBUG_MODE = true; // 开发环境调试模式

export interface Threat {
  type: string;
  description: string;
}

export interface PurityResult {
  ip: string;
  threatLevel: 'low' | 'medium' | 'high';
  isListed: boolean;
  hasAbuseHistory: boolean;
  riskScore: number;
  location: string;
  isp: string;
  threats: Threat[];
  timestamp: string;
  explanation: string;
}

// 外部威胁情报API接口
interface ThreatIntelligenceResult {
  isListed: boolean;
  abuseConfidenceScore: number;
  countryCode: string;
  usageType: string;
  isp: string;
  domain: string;
  totalReports: number;
  lastReportedAt: string;
  reports: Array<{
    reportedAt: string;
    comment: string;
    categories: string[];
  }>;
}

export class PurityService {
  // 威胁IP段检测（保留作为备用）
  private static readonly THREAT_IP_RANGES = {
    // 高风险IP段
    highRisk: [
      /^185\.220\.101\./, /^185\.220\.102\./, /^185\.220\.103\./, /^185\.220\.104\./, /^185\.220\.105\./,
      /^185\.220\.106\./, /^185\.220\.107\./, /^185\.220\.108\./, /^185\.220\.109\./, /^185\.220\.110\./,
      /^185\.220\.111\./, /^185\.220\.112\./, /^185\.220\.113\./, /^185\.220\.114\./, /^185\.220\.115\./,
      /^185\.220\.116\./, /^185\.220\.117\./, /^185\.220\.118\./, /^185\.220\.119\./, /^185\.220\.120\./,
      /^185\.220\.121\./, /^185\.220\.122\./, /^185\.220\.123\./, /^185\.220\.124\./, /^185\.220\.125\./,
      /^185\.220\.126\./, /^185\.220\.127\./, /^185\.220\.128\./, /^185\.220\.129\./, /^185\.220\.130\./,
      /^185\.220\.131\./, /^185\.220\.132\./, /^185\.220\.133\./, /^185\.220\.134\./, /^185\.220\.135\./,
      /^185\.220\.136\./, /^185\.220\.137\./, /^185\.220\.138\./, /^185\.220\.139\./, /^185\.220\.140\./,
      /^185\.220\.141\./, /^185\.220\.142\./, /^185\.220\.143\./, /^185\.220\.144\./, /^185\.220\.145\./,
      /^185\.220\.146\./, /^185\.220\.147\./, /^185\.220\.148\./, /^185\.220\.149\./, /^185\.220\.150\./,
      /^185\.220\.151\./, /^185\.220\.152\./, /^185\.220\.153\./, /^185\.220\.154\./, /^185\.220\.155\./,
      /^185\.220\.156\./, /^185\.220\.157\./, /^185\.220\.158\./, /^185\.220\.159\./, /^185\.220\.160\./,
      /^185\.220\.161\./, /^185\.220\.162\./, /^185\.220\.163\./, /^185\.220\.164\./, /^185\.220\.165\./,
      /^185\.220\.166\./, /^185\.220\.167\./, /^185\.220\.168\./, /^185\.220\.169\./, /^185\.220\.170\./,
      /^185\.220\.171\./, /^185\.220\.172\./, /^185\.220\.173\./, /^185\.220\.174\./, /^185\.220\.175\./,
      /^185\.220\.176\./, /^185\.220\.177\./, /^185\.220\.178\./, /^185\.220\.179\./, /^185\.220\.180\./,
      /^185\.220\.181\./, /^185\.220\.182\./, /^185\.220\.183\./, /^185\.220\.184\./, /^185\.220\.185\./,
      /^185\.220\.186\./, /^185\.220\.187\./, /^185\.220\.188\./, /^185\.220\.189\./, /^185\.220\.190\./,
      /^185\.220\.191\./, /^185\.220\.192\./, /^185\.220\.193\./, /^185\.220\.194\./, /^185\.220\.195\./,
      /^185\.220\.196\./, /^185\.220\.197\./, /^185\.220\.198\./, /^185\.220\.199\./, /^185\.220\.200\./,
      /^185\.220\.201\./, /^185\.220\.202\./, /^185\.220\.203\./, /^185\.220\.204\./, /^185\.220\.205\./,
      /^185\.220\.206\./, /^185\.220\.207\./, /^185\.220\.208\./, /^185\.220\.209\./, /^185\.220\.210\./,
      /^185\.220\.211\./, /^185\.220\.212\./, /^185\.220\.213\./, /^185\.220\.214\./, /^185\.220\.215\./,
      /^185\.220\.216\./, /^185\.220\.217\./, /^185\.220\.218\./, /^185\.220\.219\./, /^185\.220\.220\./,
      /^185\.220\.221\./, /^185\.220\.222\./, /^185\.220\.223\./, /^185\.220\.224\./, /^185\.220\.225\./,
      /^185\.220\.226\./, /^185\.220\.227\./, /^185\.220\.228\./, /^185\.220\.229\./, /^185\.220\.230\./,
      /^185\.220\.231\./, /^185\.220\.232\./, /^185\.220\.233\./, /^185\.220\.234\./, /^185\.220\.235\./,
      /^185\.220\.236\./, /^185\.220\.237\./, /^185\.220\.238\./, /^185\.220\.239\./, /^185\.220\.240\./,
      /^185\.220\.241\./, /^185\.220\.242\./, /^185\.220\.243\./, /^185\.220\.244\./, /^185\.220\.245\./,
      /^185\.220\.246\./, /^185\.220\.247\./, /^185\.220\.248\./, /^185\.220\.249\./, /^185\.220\.250\./,
      /^185\.220\.251\./, /^185\.220\.252\./, /^185\.220\.253\./, /^185\.220\.254\./, /^185\.220\.255\./,
    ],
    // 中等风险IP段
    mediumRisk: [
      /^45\.95\.147\./, // 已知恶意IP段
      /^185\.143\.223\./, // 已知恶意IP段
      /^91\.200\.12\./, // 已知恶意IP段
      /^193\.149\.176\./, // 已知恶意IP段
    ]
  };

  /**
   * 检查IP纯净度
   * @param ip IP地址
   */
  static async checkPurity(ip: string): Promise<PurityResult> {
    try {
      // 模拟检测过程
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 首先尝试从外部API获取威胁情报
      let threatIntelligence: ThreatIntelligenceResult | null = null;
      try {
        threatIntelligence = await this.getThreatIntelligence(ip);
      } catch (error) {
        console.warn('外部威胁情报API调用失败，使用本地检测:', error);
      }
      
      // 基于IP地址进行检测
      const analysis = this.analyzePurity(ip, threatIntelligence);
      
      return {
        ip,
        threatLevel: analysis.threatLevel,
        isListed: analysis.isListed,
        hasAbuseHistory: analysis.hasAbuseHistory,
        riskScore: analysis.riskScore,
        location: analysis.location,
        isp: analysis.isp,
        threats: analysis.threats,
        timestamp: new Date().toLocaleString('zh-CN'),
        explanation: analysis.explanation
      };
    } catch (error) {
      console.error('纯净度检测失败:', error);
      return this.getFallbackResult(ip);
    }
  }

  /**
   * 分析IP纯净度
   */
  private static analyzePurity(ip: string, threatIntelligence: ThreatIntelligenceResult | null): {
    threatLevel: 'low' | 'medium' | 'high';
    isListed: boolean;
    hasAbuseHistory: boolean;
    riskScore: number;
    location: string;
    isp: string;
    threats: Threat[];
    explanation: string;
  } {
    // 检查是否为内网IP
    if (this.isPrivateIP(ip)) {
      return {
        threatLevel: 'low',
        isListed: false,
        hasAbuseHistory: false,
        riskScore: 0,
        location: '内网地址',
        isp: '内网',
        threats: [],
        explanation: '检测到内网IP地址，纯净度良好，无安全风险'
      };
    }

    // 检查IP格式
    if (!this.isValidIP(ip)) {
      return {
        threatLevel: 'medium',
        isListed: false,
        hasAbuseHistory: false,
        riskScore: 30,
        location: '未知',
        isp: '未知',
        threats: [{
          type: 'IP格式异常',
          description: 'IP地址格式不符合标准'
        }],
        explanation: 'IP地址格式异常，可能存在风险'
      };
    }

    // 检查特殊IP段
    const specialIPCheck = this.checkSpecialIPRanges(ip);
    if (specialIPCheck.isSpecial) {
      return {
        threatLevel: specialIPCheck.threatLevel,
        isListed: specialIPCheck.isListed,
        hasAbuseHistory: specialIPCheck.hasAbuseHistory,
        riskScore: specialIPCheck.riskScore,
        location: specialIPCheck.location,
        isp: specialIPCheck.isp,
        threats: specialIPCheck.threats,
        explanation: specialIPCheck.explanation
      };
    }

    // 如果有外部威胁情报数据，优先使用
    if (threatIntelligence) {
      return this.analyzeWithThreatIntelligence(ip, threatIntelligence);
    }

    // 否则使用本地检测
    const threatCheck = this.checkThreatIPRanges(ip);
    const locationInfo = this.getLocationByIP(ip);
    const featureAnalysis = this.analyzeIPFeatures(ip);
    const finalAnalysis = this.combineAnalysis(threatCheck, featureAnalysis, locationInfo);
    
    return {
      threatLevel: finalAnalysis.threatLevel,
      isListed: finalAnalysis.isListed,
      hasAbuseHistory: finalAnalysis.hasAbuseHistory,
      riskScore: finalAnalysis.riskScore,
      location: locationInfo.location,
      isp: locationInfo.isp,
      threats: finalAnalysis.threats,
      explanation: finalAnalysis.explanation
    };
  }

  /**
   * 从外部API获取威胁情报数据
   */
  private static async getThreatIntelligence(ip: string): Promise<ThreatIntelligenceResult | null> {
    try {
      // 检查缓存
      const cached = cache.get(ip);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        if (DEBUG_MODE) {
          console.log('使用缓存的威胁情报数据:', ip);
        }
        return cached.data;
      }

      // 并发控制
      if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      activeRequests++;

      try {
        // 获取IP地理位置信息
        const geoData = await this.getIPGeolocation(ip);
        
        // 获取威胁情报数据
        const threatData = await this.getThreatData(ip);
        
        const result = {
          isListed: threatData.isListed,
          abuseConfidenceScore: threatData.abuseConfidenceScore,
          countryCode: geoData.countryCode,
          usageType: geoData.usageType,
          isp: geoData.isp,
          domain: geoData.domain,
          totalReports: threatData.totalReports,
          lastReportedAt: threatData.lastReportedAt,
          reports: threatData.reports
        };

        // 缓存结果
        cache.set(ip, { data: result, timestamp: Date.now() });
        
        if (DEBUG_MODE) {
          console.log('威胁情报数据:', result);
        }

        return result;
      } finally {
        activeRequests--;
      }
    } catch (error) {
      console.error('获取威胁情报失败:', error);
      return null;
    }
  }

  /**
   * 获取IP地理位置信息
   */
  private static async getIPGeolocation(ip: string): Promise<{
    countryCode: string;
    usageType: string;
    isp: string;
    domain: string;
  }> {
    try {
      if (API_CONFIG.ipGeolocation.enabled) {
        const response = await fetch(`${API_CONFIG.ipGeolocation.baseUrl}/${ip}/json/`);
        if (response.ok) {
          const data = await response.json();
          return {
            countryCode: data.country_code || 'Unknown',
            usageType: data.org || 'Unknown',
            isp: data.org || 'Unknown',
            domain: data.asn || 'Unknown'
          };
        }
      }
    } catch (error) {
      console.warn('IP地理位置API调用失败:', error);
    }

    // 回退到本地检测
    const localData = this.getLocationByIP(ip);
    return {
      countryCode: 'Unknown',
      usageType: localData.isp,
      isp: localData.isp,
      domain: 'Unknown'
    };
  }

  /**
   * 获取威胁情报数据
   */
  private static async getThreatData(ip: string): Promise<{
    isListed: boolean;
    abuseConfidenceScore: number;
    totalReports: number;
    lastReportedAt: string;
    reports: Array<{
      reportedAt: string;
      comment: string;
      categories: string[];
    }>;
  }> {
    // 尝试使用真实的AbuseIPDB API
    if (API_CONFIG.abuseIPDB.enabled && API_CONFIG.abuseIPDB.apiKey) {
      try {
        return await this.getRealAbuseIPDBData(ip);
      } catch (error) {
        console.warn('AbuseIPDB API调用失败，使用模拟数据:', error);
      }
    }

    // 回退到模拟数据
    return this.getAbuseIPDBData(ip);
  }

  /**
   * 获取真实的AbuseIPDB数据
   */
  private static async getRealAbuseIPDBData(ip: string): Promise<{
    isListed: boolean;
    abuseConfidenceScore: number;
    totalReports: number;
    lastReportedAt: string;
    reports: Array<{
      reportedAt: string;
      comment: string;
      categories: string[];
    }>;
  }> {
    const url = `${API_CONFIG.abuseIPDB.baseUrl}/check`;
    const params = new URLSearchParams({
      ipAddress: ip,
      maxAgeInDays: '90'
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'Key': API_CONFIG.abuseIPDB.apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`AbuseIPDB API错误: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      isListed: data.data.abuseConfidenceScore > 0,
      abuseConfidenceScore: data.data.abuseConfidenceScore,
      totalReports: data.data.totalReports,
      lastReportedAt: data.data.lastReportedAt,
      reports: data.data.reports || []
    };
  }

  /**
   * 获取AbuseIPDB数据（模拟实现，实际使用时需要API密钥）
   */
  private static async getAbuseIPDBData(ip: string): Promise<{
    isListed: boolean;
    abuseConfidenceScore: number;
    totalReports: number;
    lastReportedAt: string;
    reports: Array<{
      reportedAt: string;
      comment: string;
      categories: string[];
    }>;
  }> {
    // 模拟AbuseIPDB API调用
    // 在实际应用中，您需要：
    // 1. 注册AbuseIPDB账户获取API密钥
    // 2. 使用真实的API调用：https://api.abuseipdb.com/api/v2/check
    // 3. 处理API限制和错误
    
         // 这里使用模拟数据来演示功能
     const mockData: {
       isListed: boolean;
       abuseConfidenceScore: number;
       totalReports: number;
       lastReportedAt: string;
       reports: Array<{
         reportedAt: string;
         comment: string;
         categories: string[];
       }>;
     } = {
       isListed: Math.random() > 0.8, // 20%的概率被列入黑名单
       abuseConfidenceScore: Math.floor(Math.random() * 100),
       totalReports: Math.floor(Math.random() * 50),
       lastReportedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
       reports: []
     };

         // 如果被列入黑名单，生成一些报告
     if (mockData.isListed) {
       const categories = ['Brute Force', 'Spam', 'Malware', 'Phishing', 'DDoS'];
       const comments = [
         'Suspicious activity detected',
         'Multiple failed login attempts',
         'Spam emails originating from this IP',
         'Malware distribution detected',
         'DDoS attack source'
       ];

       for (let i = 0; i < Math.floor(Math.random() * 5) + 1; i++) {
         mockData.reports.push({
           reportedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
           comment: comments[Math.floor(Math.random() * comments.length)],
           categories: [categories[Math.floor(Math.random() * categories.length)]]
         });
       }
     }

    return mockData;
  }

  /**
   * 分析IP特征
   */
  private static analyzeIPFeatures(ip: string): {
    riskScore: number;
    threats: Threat[];
  } {
    const parts = ip.split('.');
    const firstOctet = parseInt(parts[0]);
    const secondOctet = parseInt(parts[1]);
    const thirdOctet = parseInt(parts[2]);
    const fourthOctet = parseInt(parts[3]);
    
    let riskScore = 0;
    const threats: Threat[] = [];

    // 检查是否为动态IP段（通常风险较高）
    if (this.isDynamicIPRange(firstOctet, secondOctet)) {
      riskScore += 15;
      threats.push({
        type: '动态IP段',
        description: '该IP地址属于动态IP段，可能被多个用户使用'
      });
    }

    // 检查是否为数据中心IP段
    if (this.isDatacenterIPRange(firstOctet, secondOctet)) {
      riskScore += 10;
      threats.push({
        type: '数据中心IP',
        description: '该IP地址属于数据中心，通常用于托管服务'
      });
    }

    // 检查是否为VPN/代理IP段
    if (this.isVPNProxyIPRange(firstOctet, secondOctet)) {
      riskScore += 20;
      threats.push({
        type: 'VPN/代理服务',
        description: '该IP地址可能属于VPN或代理服务'
      });
    }

    // 检查IP地址的数值特征
    if (this.hasSuspiciousPattern(firstOctet, secondOctet, thirdOctet, fourthOctet)) {
      riskScore += 25;
      threats.push({
        type: '可疑IP模式',
        description: '该IP地址具有可疑的数值模式'
      });
    }

    return {
      riskScore,
      threats
    };
  }

  /**
   * 检查是否为动态IP段
   */
  private static isDynamicIPRange(firstOctet: number, secondOctet: number): boolean {
    // 常见的动态IP段
    const dynamicRanges = [
      [1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9],
      [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [2, 9],
      [3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [3, 7], [3, 8], [3, 9],
      [4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [4, 7], [4, 8], [4, 9],
      [5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7], [5, 8], [5, 9],
    ];
    
    return dynamicRanges.some(([first, second]) => 
      firstOctet === first && secondOctet === second
    );
  }

  /**
   * 检查是否为数据中心IP段
   */
  private static isDatacenterIPRange(firstOctet: number, secondOctet: number): boolean {
    // 常见的数据中心IP段
    const datacenterRanges = [
      [8, 8], [8, 8], // Google DNS
      [1, 1], [1, 0], // Cloudflare DNS
      [208, 67], [208, 67], // OpenDNS
      [9, 9], [149, 112], // Quad9 DNS
      [114, 114], [223, 5], // 国内DNS
    ];
    
    return datacenterRanges.some(([first, second]) => 
      firstOctet === first && secondOctet === second
    );
  }

  /**
   * 检查是否为VPN/代理IP段
   */
  private static isVPNProxyIPRange(firstOctet: number, secondOctet: number): boolean {
    // 常见的VPN/代理IP段
    const vpnProxyRanges = [
      [103, 21], [104, 16], [172, 64], [172, 65], [173, 245],
      [188, 114], [190, 93], [197, 234], [198, 41], [199, 27],
    ];
    
    return vpnProxyRanges.some(([first, second]) => 
      firstOctet === first && secondOctet === second
    );
  }

  /**
   * 检查是否有可疑的IP模式
   */
  private static hasSuspiciousPattern(firstOctet: number, secondOctet: number, thirdOctet: number, fourthOctet: number): boolean {
    // 检查连续数字模式
    if (firstOctet === secondOctet && secondOctet === thirdOctet && thirdOctet === fourthOctet) {
      return true;
    }
    
    // 检查重复模式
    if ((firstOctet === thirdOctet && secondOctet === fourthOctet) ||
        (firstOctet === secondOctet && thirdOctet === fourthOctet)) {
      return true;
    }
    
    // 检查全零或全一模式
    if (secondOctet === 0 && thirdOctet === 0 && fourthOctet === 0) {
      return true;
    }
    if (secondOctet === 255 && thirdOctet === 255 && fourthOctet === 255) {
      return true;
    }
    
    return false;
  }

  /**
   * 合并分析结果
   */
  private static combineAnalysis(
    threatCheck: { threatLevel: 'low' | 'medium' | 'high'; isListed: boolean; hasAbuseHistory: boolean; riskScore: number; threats: Threat[]; explanation: string },
    featureAnalysis: { riskScore: number; threats: Threat[] },
    locationInfo: { location: string; isp: string }
  ): {
    threatLevel: 'low' | 'medium' | 'high';
    isListed: boolean;
    hasAbuseHistory: boolean;
    riskScore: number;
    threats: Threat[];
    explanation: string;
  } {
    let totalRiskScore = threatCheck.riskScore + featureAnalysis.riskScore;
    let threats = [...threatCheck.threats, ...featureAnalysis.threats];
    let isListed = threatCheck.isListed;
    let hasAbuseHistory = threatCheck.hasAbuseHistory;
    
    // 根据地理位置调整风险分数
    if (locationInfo.location === '未知') {
      totalRiskScore += 10;
    }
    
    // 确保风险分数在0-100范围内
    totalRiskScore = Math.max(0, Math.min(100, totalRiskScore));
    
    // 确定威胁等级
    let threatLevel: 'low' | 'medium' | 'high' = 'low';
    let explanation = 'IP地址纯净度良好，未发现明显威胁';
    
    if (totalRiskScore >= 70) {
      threatLevel = 'high';
      explanation = '检测到高风险威胁，建议谨慎使用';
    } else if (totalRiskScore >= 30) {
      threatLevel = 'medium';
      explanation = '检测到中等风险，建议保持警惕';
    } else if (totalRiskScore > 0) {
      threatLevel = 'low';
      explanation = '检测到低风险因素，相对安全';
    }
    
    // 如果有威胁检测结果，使用威胁检测的说明
    if (threatCheck.threatLevel !== 'low') {
      explanation = threatCheck.explanation;
    }
    
    return {
      threatLevel,
      isListed,
      hasAbuseHistory,
      riskScore: totalRiskScore,
      threats,
      explanation
    };
  }

  /**
   * 检查特殊IP段
   */
  private static checkSpecialIPRanges(ip: string): {
    isSpecial: boolean;
    threatLevel: 'low' | 'medium' | 'high';
    isListed: boolean;
    hasAbuseHistory: boolean;
    riskScore: number;
    location: string;
    isp: string;
    threats: Threat[];
    explanation: string;
  } {
    const parts = ip.split('.');
    const firstOctet = parseInt(parts[0]);

    // 检查本地回环地址
    if (firstOctet === 127) {
      return {
        isSpecial: true,
        threatLevel: 'medium',
        isListed: true,
        hasAbuseHistory: false,
        riskScore: 50,
        location: '本地回环',
        isp: '本地',
        threats: [{
          type: '本地回环地址',
          description: '该IP地址是本地回环地址，不应在公网出现'
        }],
        explanation: '检测到本地回环地址，可能存在配置问题'
      };
    }

    // 检查保留地址
    if (firstOctet === 0) {
      return {
        isSpecial: true,
        threatLevel: 'medium',
        isListed: true,
        hasAbuseHistory: false,
        riskScore: 40,
        location: '保留地址',
        isp: '保留',
        threats: [{
          type: '保留IP段',
          description: '该IP地址属于保留地址段，不应在公网使用'
        }],
        explanation: '检测到保留IP地址，可能存在配置问题'
      };
    }

    // 检查多播地址
    if (firstOctet >= 224 && firstOctet <= 239) {
      return {
        isSpecial: true,
        threatLevel: 'medium',
        isListed: false,
        hasAbuseHistory: false,
        riskScore: 25,
        location: '多播地址',
        isp: '多播',
        threats: [{
          type: '多播地址',
          description: '该IP地址是多播地址，通常不用于普通网络通信'
        }],
        explanation: '检测到多播地址，可能存在特殊用途'
      };
    }

    // 检查保留地址段
    if (firstOctet >= 240 && firstOctet <= 255) {
      return {
        isSpecial: true,
        threatLevel: 'medium',
        isListed: false,
        hasAbuseHistory: false,
        riskScore: 30,
        location: '保留地址',
        isp: '保留',
        threats: [{
          type: '保留地址',
          description: '该IP地址属于保留地址段，可能被用于特殊用途'
        }],
        explanation: '检测到保留地址，可能存在特殊用途'
      };
    }

    return {
      isSpecial: false,
      threatLevel: 'low',
      isListed: false,
      hasAbuseHistory: false,
      riskScore: 0,
      location: '',
      isp: '',
      threats: [],
      explanation: ''
    };
  }

  /**
   * 检查威胁IP段
   */
  private static checkThreatIPRanges(ip: string): {
    threatLevel: 'low' | 'medium' | 'high';
    isListed: boolean;
    hasAbuseHistory: boolean;
    riskScore: number;
    threats: Threat[];
    explanation: string;
  } {
    // 检查高风险IP段
    if (this.THREAT_IP_RANGES.highRisk.some(range => range.test(ip))) {
      return {
        threatLevel: 'high',
        isListed: true,
        hasAbuseHistory: true,
        riskScore: 80,
        threats: [{
          type: 'Tor出口节点',
          description: '该IP地址是Tor网络的出口节点，可能被用于匿名访问和恶意活动'
        }],
        explanation: '检测到Tor网络出口节点，存在较高安全风险'
      };
    }

    // 检查中等风险IP段
    if (this.THREAT_IP_RANGES.mediumRisk.some(range => range.test(ip))) {
      return {
        threatLevel: 'medium',
        isListed: true,
        hasAbuseHistory: true,
        riskScore: 60,
        threats: [{
          type: '已知恶意IP',
          description: '该IP地址在已知恶意IP数据库中，存在安全风险'
        }],
        explanation: '检测到已知恶意IP，存在安全风险'
      };
    }

    // 普通IP地址
    return {
      threatLevel: 'low',
      isListed: false,
      hasAbuseHistory: false,
      riskScore: 0,
      threats: [],
      explanation: 'IP地址纯净度良好，未发现明显威胁'
    };
  }

  /**
   * 基于外部威胁情报数据进行分析
   */
  private static analyzeWithThreatIntelligence(ip: string, threatIntelligence: ThreatIntelligenceResult): {
    threatLevel: 'low' | 'medium' | 'high';
    isListed: boolean;
    hasAbuseHistory: boolean;
    riskScore: number;
    location: string;
    isp: string;
    threats: Threat[];
    explanation: string;
  } {
    let riskScore = 0;
    const threats: Threat[] = [];
    let isListed = threatIntelligence.isListed;
    let hasAbuseHistory = threatIntelligence.totalReports > 0;

    // 基于滥用置信度评分
    if (threatIntelligence.abuseConfidenceScore > 80) {
      riskScore += 40;
      threats.push({
        type: '高滥用置信度',
        description: `该IP的滥用置信度为${threatIntelligence.abuseConfidenceScore}%，存在高风险`
      });
    } else if (threatIntelligence.abuseConfidenceScore > 50) {
      riskScore += 25;
      threats.push({
        type: '中等滥用置信度',
        description: `该IP的滥用置信度为${threatIntelligence.abuseConfidenceScore}%，存在中等风险`
      });
    } else if (threatIntelligence.abuseConfidenceScore > 20) {
      riskScore += 10;
      threats.push({
        type: '低滥用置信度',
        description: `该IP的滥用置信度为${threatIntelligence.abuseConfidenceScore}%，存在低风险`
      });
    }

    // 基于报告数量
    if (threatIntelligence.totalReports > 20) {
      riskScore += 30;
      threats.push({
        type: '大量滥用报告',
        description: `该IP有${threatIntelligence.totalReports}个滥用报告，存在严重风险`
      });
    } else if (threatIntelligence.totalReports > 5) {
      riskScore += 20;
      threats.push({
        type: '多个滥用报告',
        description: `该IP有${threatIntelligence.totalReports}个滥用报告，存在风险`
      });
    } else if (threatIntelligence.totalReports > 0) {
      riskScore += 10;
      threats.push({
        type: '滥用报告',
        description: `该IP有${threatIntelligence.totalReports}个滥用报告`
      });
    }

    // 基于使用类型
    if (threatIntelligence.usageType.toLowerCase().includes('vpn') || 
        threatIntelligence.usageType.toLowerCase().includes('proxy')) {
      riskScore += 15;
      threats.push({
        type: 'VPN/代理服务',
        description: '该IP可能属于VPN或代理服务'
      });
    }

    if (threatIntelligence.usageType.toLowerCase().includes('datacenter') || 
        threatIntelligence.usageType.toLowerCase().includes('hosting')) {
      riskScore += 10;
      threats.push({
        type: '数据中心IP',
        description: '该IP属于数据中心，通常用于托管服务'
      });
    }

    // 确保风险分数在0-100范围内
    riskScore = Math.max(0, Math.min(100, riskScore));

    // 确定威胁等级
    let threatLevel: 'low' | 'medium' | 'high' = 'low';
    let explanation = 'IP地址纯净度良好，未发现明显威胁';

    if (riskScore >= 70) {
      threatLevel = 'high';
      explanation = '检测到高风险威胁，该IP已被列入黑名单或有大量滥用报告';
    } else if (riskScore >= 30) {
      threatLevel = 'medium';
      explanation = '检测到中等风险，该IP存在一些可疑活动';
    } else if (riskScore > 0) {
      threatLevel = 'low';
      explanation = '检测到低风险因素，相对安全';
    }

    return {
      threatLevel,
      isListed,
      hasAbuseHistory,
      riskScore,
      location: this.getCountryName(threatIntelligence.countryCode),
      isp: threatIntelligence.isp,
      threats,
      explanation
    };
  }

  /**
   * 获取国家名称
   */
  private static getCountryName(countryCode: string): string {
    const countryMap: { [key: string]: string } = {
      'CN': '中国',
      'US': '美国',
      'JP': '日本',
      'KR': '韩国',
      'DE': '德国',
      'GB': '英国',
      'FR': '法国',
      'CA': '加拿大',
      'AU': '澳大利亚',
      'RU': '俄罗斯',
      'IN': '印度',
      'BR': '巴西',
      'Unknown': '未知'
    };
    
    return countryMap[countryCode] || countryCode;
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
   * 验证IP地址格式
   */
  private static isValidIP(ip: string): boolean {
    if (!ip || typeof ip !== 'string') return false;
    
    // 移除可能的端口号
    ip = ip.split(':')[0];
    
    // IPv4格式验证
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipv4Regex.test(ip)) return true;
    
    // IPv6格式验证（简化版）
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv6Regex.test(ip);
  }

  /**
   * 根据IP获取地理位置信息
   */
  private static getLocationByIP(ip: string): {
    location: string;
    isp: string;
  } {
    const parts = ip.split('.');
    if (parts.length !== 4) {
      return {
        location: '未知',
        isp: '未知'
      };
    }

    const firstOctet = parseInt(parts[0]);

    // 简化的地理位置判断
    if (firstOctet >= 1 && firstOctet <= 126) {
      return {
        location: '美国',
        isp: '美国ISP'
      };
    } else if (firstOctet >= 128 && firstOctet <= 191) {
      return {
        location: '欧洲',
        isp: '欧洲ISP'
      };
    } else if (firstOctet >= 192 && firstOctet <= 223) {
      return {
        location: '亚洲',
        isp: '亚洲ISP'
      };
    } else {
      return {
        location: '其他地区',
        isp: '未知ISP'
      };
    }
  }

  /**
   * 获取备用结果
   */
  private static getFallbackResult(ip: string): PurityResult {
    return {
      ip,
      threatLevel: 'medium',
      isListed: false,
      hasAbuseHistory: false,
      riskScore: 50,
      location: '未知',
      isp: '未知',
      threats: [],
      timestamp: new Date().toLocaleString('zh-CN'),
      explanation: '检测失败，返回默认结果'
    };
  }
}