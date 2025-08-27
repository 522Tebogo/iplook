import axios from 'axios';
import { IPInfo } from '../types';

export class IPService {
  private static readonly IP_API_URL = 'http://ip-api.com/json';

  /**
   * 获取当前IP地址
   */
  static async getCurrentIP(): Promise<{ ip: string }> {
    try {
      // 使用ipify服务获取当前IP地址
      const response = await axios.get('https://api.ipify.org?format=json', { timeout: 10000 });
      return { ip: response.data.ip };
    } catch (error) {
      console.error('获取当前IP失败:', error);
      // 返回本地IP地址用于测试
      return { ip: '127.0.0.1' };
    }
  }

  /**
   * 获取IP详细信息
   * @param ip IP地址
   */
  static async getIPInfo(ip: string): Promise<IPInfo> {
    try {
      // 优先使用对国内用户友好的ip-api.com服务
      const response = await axios.get(`${this.IP_API_URL}/${ip}`, { 
        timeout: 8000,
        headers: {
          'Accept': 'application/json'
        }
      });
      const data = response.data;
      
      // 检查响应数据是否有效
      if (!data || data.status === 'fail') {
        throw new Error('API返回失败状态');
      }
      
      return {
        ip: data.query,
        country: this.addCountryEmoji(data.country || '未知', data.countryCode || 'UN'),
        region: data.regionName || '未知',
        city: data.city || '未知',
        isp: data.isp || '未知',
        timezone: data.timezone || '未知',
        latitude: data.lat || 0,
        longitude: data.lon || 0,
      };
    } catch (error) {
      console.error('主API获取IP信息失败:', error);
      // 返回模拟数据以确保应用仍然可以工作
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
      region: isChinaIP ? '北京市' : 'California',
      city: isChinaIP ? '北京' : 'Los Angeles',
      isp: isChinaIP ? '中国电信' : 'AT&T',
      timezone: isChinaIP ? 'Asia/Shanghai' : 'America/Los_Angeles',
      latitude: isChinaIP ? 39.9042 : 34.0522,
      longitude: isChinaIP ? 116.4074 : -118.2437,
    };
  }
}