import axios from 'axios';
import { IPInfo } from '../types';

// 获取IP信息
export const getIPInfo = async (): Promise<IPInfo> => {
  try {
    // 使用 ipapi.co 服务获取IP信息
    const response = await axios.get('https://ipapi.co/json/');
    
    return {
      ip: response.data.ip,
      country: response.data.country_name,
      countryCode: response.data.country_code || '未知',
      region: response.data.region,
      city: response.data.city,
      isp: response.data.org,
      timezone: response.data.timezone,
      latitude: response.data.latitude,
      longitude: response.data.longitude
    };
  } catch (error) {
    console.error('获取IP信息失败:', error);
    // 返回默认值
    return {
      ip: '未知',
      country: '未知',
      countryCode: '未知',
      region: '未知',
      city: '未知',
      isp: '未知',
      timezone: '未知',
      latitude: 0,
      longitude: 0
    };
  }
};

// 模拟获取IP信息（用于开发环境）
export const getMockIPInfo = async (): Promise<IPInfo> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 返回模拟数据
  return {
    ip: '111.111.111.111',
    country: '中国',
    countryCode: 'CN',
    region: '北京市',
    city: '北京市',
    isp: '中国联通',
    timezone: 'Asia/Shanghai',
    latitude: 39.9042,
    longitude: 116.4074
  };
};

export class IPService {
  private static readonly IP_APIS = [
    'https://api.ipify.org?format=json',
    'https://api.myip.com',
    'https://ipapi.co/json/',
    'https://httpbin.org/ip',
    'https://api.ip.sb/ip'
  ];

  /**
   * 获取当前IP地址
   */
  static async getCurrentIP(): Promise<{ ip: string }> {
    // 首先尝试从 Cloudflare 头部获取真实IP（如果在 Cloudflare 环境中）
    const cfConnectingIP = this.getCFConnectingIP();
    if (cfConnectingIP) {
      return { ip: cfConnectingIP };
    }

    for (const apiUrl of this.IP_APIS) {
      try {
        const response = await axios.get(apiUrl, { 
          timeout: 5000,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        let ip: string;
        
        // 根据不同API的响应格式提取IP
        if (apiUrl.includes('ipify')) {
          ip = response.data.ip;
        } else if (apiUrl.includes('myip')) {
          ip = response.data.ip;
        } else if (apiUrl.includes('ipapi')) {
          ip = response.data.ip;
        } else if (apiUrl.includes('httpbin')) {
          ip = response.data.origin;
        } else if (apiUrl.includes('ip.sb')) {
          ip = response.data.trim();
        } else {
          ip = response.data.ip || response.data;
        }
        
        // 验证IP格式
        if (this.isValidIP(ip)) {
          return { ip };
        }
      } catch (error) {
        console.warn(`API ${apiUrl} 获取IP失败:`, error);
        continue;
      }
    }
    
    console.error('所有IP API都失败了');
    throw new Error('无法获取当前IP地址');
  }

  /**
   * 从 Cloudflare 请求头获取真实IP
   */
  private static getCFConnectingIP(): string | null {
    // 在浏览器环境中无法直接访问请求头，但在部署环境中可能需要通过其他方式传递
    // 这里仅作示意，实际部署时可能需要后端支持
    if (typeof window !== 'undefined') {
      // 尝试从全局变量或自定义属性中获取（需要后端配合设置）
      const cfIP = (window as any).CF_IP;
      if (cfIP && this.isValidIP(cfIP)) {
        return cfIP;
      }
    }
    return null;
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
   * 获取IP详细信息
   * @param ip IP地址
   */
  static async getIPInfo(ip: string): Promise<IPInfo> {
    try {
      // 使用 ipapi.co 获取详细信息（支持 CORS）
      const response = await axios.get(`https://ipapi.co/${ip}/json/`, { 
        timeout: 8000,
        headers: {
          'Accept': 'application/json'
        }
      });
      const data = response.data;

      return {
        ip: data.ip,
        country: this.addCountryEmoji(data.country_name || '未知', data.country_code || 'UN'),
        countryCode: data.country_code || '未知',
        region: data.region_name || '未知',
        city: data.city || '未知',
        isp: data.org || '未知',
        timezone: data.timezone || '未知',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
      };
    } catch (error) {
      console.error('主API获取IP信息失败:', error);
      return this.getMockIPInfo(ip);
    }
  }
  
  /**
   * 为国家名称添加emoji
   */
  private static addCountryEmoji(countryName: string, countryCode: string): string {
    const countryEmojis: { [key: string]: string } = {
      'CN': '🇨🇳',
      'US': '🇺🇸',
      'JP': '🇯🇵',
      'KR': '🇰🇷',
      'GB': '🇬🇧',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'RU': '🇷🇺',
      'IN': '🇮🇳',
      'CA': '🇨🇦',
      'AU': '🇦🇺',
      'BR': '🇧🇷',
      'IT': '🇮🇹',
      'SG': '🇸🇬',
      'MY': '🇲🇾',
      'TH': '🇹🇭',
      'VN': '🇻🇳',
      'PH': '🇵🇭',
      'ID': '🇮🇩',
      'TR': '🇹🇷',
      'MX': '🇲🇽',
      'AR': '🇦🇷',
      'CL': '🇨🇱',
      'ZA': '🇿🇦',
      'EG': '🇪🇬',
      'NG': '🇳🇬',
      'BE': '🇧🇪',
      'NL': '🇳🇱',
      'SE': '🇸🇪',
      'NO': '🇳🇴',
      'DK': '🇩🇰',
      'FI': '🇫🇮',
      'PL': '🇵🇱',
      'CZ': '🇨🇿',
      'HU': '🇭🇺',
      'AT': '🇦🇹',
      'CH': '🇨🇭',
      'PT': '🇵🇹',
      'IE': '🇮🇪',
      'IL': '🇮🇱',
      'SA': '🇸🇦',
      'AE': '🇦🇪',
      'HK': '🇭🇰',
      'TW': '🇹🇼'
    };
    
    const emoji = countryEmojis[countryCode] || '🏳';
    return `${emoji} ${countryName}`;
  }
  
  /**
   * 获取模拟IP信息（用于API失败时的备用方案）
   * @param ip IP地址
   */
  private static getMockIPInfo(ip: string): IPInfo {
    // 根据IP地址生成一些模拟数据
    const isChinaIP = ip.startsWith('192.168') || ip.startsWith('10.') || ip.startsWith('172.') || ip.startsWith('127.');
    
    return {
      ip,
      country: isChinaIP ? '🇨🇳 中国' : '🇺🇸 美国',
      countryCode: isChinaIP ? 'CN' : 'US',
      region: isChinaIP ? '北京市' : 'California',
      city: isChinaIP ? '北京' : 'Los Angeles',
      isp: isChinaIP ? '中国电信' : 'AT&T',
      timezone: isChinaIP ? 'Asia/Shanghai' : 'America/Los_Angeles',
      latitude: isChinaIP ? 39.9042 : 34.0522,
      longitude: isChinaIP ? 116.4074 : -118.2437,
    };
  }
}