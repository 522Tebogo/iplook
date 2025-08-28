/// <reference types="vite/client" />

// API配置文件
// 在实际使用中，请将这些密钥存储在环境变量中

export const API_CONFIG = {
  // AbuseIPDB API配置
  // 注册地址: https://www.abuseipdb.com/
  // 获取API密钥后，可以取消注释下面的配置
  abuseIPDB: {
    apiKey: import.meta.env.VITE_ABUSEIPDB_API_KEY || '',
    baseUrl: 'https://api.abuseipdb.com/api/v2',
    enabled: true // 设置为true启用真实的AbuseIPDB API
  },

  // VirusTotal API配置
  // 注册地址: https://www.virustotal.com/
  virusTotal: {
    apiKey: import.meta.env.VITE_VIRUSTOTAL_API_KEY || '',
    baseUrl: 'https://www.virustotal.com/vtapi/v2',
    enabled: false // 设置为true启用真实的VirusTotal API
  },

  // IP地理位置API配置
  ipGeolocation: {
    // 免费API，无需密钥
    baseUrl: 'https://ipapi.co',
    enabled: true
  },

  // 其他威胁情报服务
  threatIntelligence: {
    // AlienVault OTX (免费)
    alienVault: {
      baseUrl: 'https://otx.alienvault.com/api/v1',
      enabled: false
    },
    
    // ThreatFox (免费)
    threatFox: {
      baseUrl: 'https://threatfox-api.abuse.ch/api/v1',
      enabled: false
    }
  },

  // DNS泄露检测API
  dnsLeak: {
    // DNS泄露检测API (免费)
    dnsLeakTest: {
      baseUrl: 'https://www.dnsleaktest.com',
      enabled: true
    },
    
    // 公共DNS检测API
    publicDns: {
      baseUrl: 'https://dns.google.com/resolve',
      enabled: true
    },

    // Cloudflare DNS API
    cloudflareDns: {
      baseUrl: 'https://cloudflare-dns.com/dns-query',
      enabled: true
    },

    // OpenDNS API
    openDns: {
      baseUrl: 'https://dns.opendns.com/resolve',
      enabled: true
    },

    // Quad9 DNS API
    quad9Dns: {
      baseUrl: 'https://dns.quad9.net:5053/dns-query',
      enabled: true
    },

    // 国内DNS API
    chineseDns: {
      // 114 DNS
      dns114: {
        baseUrl: 'https://dns.114dns.com/resolve',
        enabled: true
      },
      // AliDNS
      aliDns: {
        baseUrl: 'https://dns.alidns.com/resolve',
        enabled: true
      },
      // DNSPod
      dnsPod: {
        baseUrl: 'https://doh.pub/dns-query',
        enabled: true
      }
    }
  },

  // Whoer隐私检测API
  whoer: {
    // Whoer API (需要密钥)
    whoerApi: {
      apiKey: import.meta.env.VITE_WHOER_API_KEY || '',
      baseUrl: 'https://whoer.net/api/v2',
      enabled: false
    },
    
    // IP地理位置API (免费)
    ipApi: {
      baseUrl: 'https://ipapi.co',
      enabled: true
    },
    
    // IP2Location API (免费)
    ip2Location: {
      baseUrl: 'https://api.ip2location.io',
      apiKey: import.meta.env.VITE_IP2LOCATION_API_KEY || '',
      enabled: true
    },
    
    // IP2Location免费API端点
    ip2LocationFree: {
      baseUrl: 'https://api.ip2location.io',
      enabled: true
    },

    // IP-API (免费)
    ipApiCom: {
      baseUrl: 'http://ip-api.com/json',
      enabled: true
    },

    // IPGeolocation API (免费)
    ipGeolocation: {
      baseUrl: 'https://api.ipgeolocation.io',
      apiKey: import.meta.env.VITE_IPGEOLOCATION_API_KEY || '',
      enabled: false
    },

    // IPInfo API (免费，有限制)
    ipInfo: {
      baseUrl: 'https://ipinfo.io',
      apiKey: import.meta.env.VITE_IPINFO_API_KEY || '',
      enabled: false
    },

    // IPStack API (需要密钥)
    ipStack: {
      baseUrl: 'http://api.ipstack.com',
      apiKey: import.meta.env.VITE_IPSTACK_API_KEY || '',
      enabled: false
    }
  }
};

// 检查API配置是否有效
export const validateAPIConfig = () => {
  const issues: string[] = [];
  
  if (API_CONFIG.abuseIPDB.enabled && !API_CONFIG.abuseIPDB.apiKey) {
    issues.push('AbuseIPDB API密钥未配置');
  }
  
  if (API_CONFIG.virusTotal.enabled && !API_CONFIG.virusTotal.apiKey) {
    issues.push('VirusTotal API密钥未配置');
  }

  if (API_CONFIG.whoer.whoerApi.enabled && !API_CONFIG.whoer.whoerApi.apiKey) {
    issues.push('Whoer API密钥未配置');
  }

  if (API_CONFIG.whoer.ipGeolocation.enabled && !API_CONFIG.whoer.ipGeolocation.apiKey) {
    issues.push('IPGeolocation API密钥未配置');
  }

  if (API_CONFIG.whoer.ipInfo.enabled && !API_CONFIG.whoer.ipInfo.apiKey) {
    issues.push('IPInfo API密钥未配置');
  }

  if (API_CONFIG.whoer.ipStack.enabled && !API_CONFIG.whoer.ipStack.apiKey) {
    issues.push('IPStack API密钥未配置');
  }

  if (API_CONFIG.whoer.ip2Location.enabled && !API_CONFIG.whoer.ip2Location.apiKey) {
    issues.push('IP2Location API密钥未配置');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};
