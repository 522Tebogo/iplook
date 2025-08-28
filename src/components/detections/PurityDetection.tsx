import React, { useState } from 'react';
import { PurityService, PurityResult } from '../../services/purityService';
import { Shield, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface PurityDetectionProps {
  ip: string;
}

export const PurityDetection: React.FC<PurityDetectionProps> = ({ ip }) => {
  const [result, setResult] = useState<PurityResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const purityResult = await PurityService.checkPurity(ip);
      setResult(purityResult);
    } catch (err) {
      setError('IP纯净度检测失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">IP纯净度检测</h3>
        <button
          onClick={handleDetection}
          disabled={loading}
          className="btn-primary flex items-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              检测中...
            </>
          ) : (
            '开始检测'
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className={`rounded-lg p-4 ${
            result.threatLevel === 'low' 
              ? 'bg-green-50 dark:bg-green-900/20' 
              : result.threatLevel === 'medium' 
                ? 'bg-yellow-50 dark:bg-yellow-900/20' 
                : 'bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className="flex items-center">
              {result.threatLevel === 'low' ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                  <h4 className="text-lg font-medium text-green-800 dark:text-green-200">IP纯净度良好</h4>
                </>
              ) : result.threatLevel === 'medium' ? (
                <>
                  <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
                  <h4 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">IP存在中等风险</h4>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-500 mr-2" />
                  <h4 className="text-lg font-medium text-red-800 dark:text-red-200">IP存在高风险</h4>
                </>
              )}
            </div>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              {result.explanation}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">风险评估</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">威胁等级</span>
                  </div>
                  <span className={`font-medium ${
                    result.threatLevel === 'low' 
                      ? 'text-green-600 dark:text-green-400' 
                      : result.threatLevel === 'medium' 
                        ? 'text-yellow-600 dark:text-yellow-400' 
                        : 'text-red-600 dark:text-red-400'
                  }`}>
                    {result.threatLevel === 'low' ? '低' : result.threatLevel === 'medium' ? '中' : '高'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                  <div className="flex items-center">
                    <Info className="h-5 w-5 text-purple-500 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">黑名单检查</span>
                  </div>
                  <span className={`font-medium ${result.isListed ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {result.isListed ? '已列入' : '未列入'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">滥用历史</span>
                  </div>
                  <span className={`font-medium ${result.hasAbuseHistory ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {result.hasAbuseHistory ? '有' : '无'}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">详细信息</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">检测IP:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">地理位置:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">ISP:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.isp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">检测时间:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">风险分数:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.riskScore}/100</span>
                </div>
              </div>
            </div>
          </div>

          {result.threats.length > 0 && (
            <div className="card">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">检测到的威胁</h5>
              <div className="space-y-2">
                {result.threats.map((threat, index) => (
                  <div key={index} className="flex items-start p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-red-800 dark:text-red-200">{threat.type}</div>
                      <div className="text-sm text-red-700 dark:text-red-300">{threat.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 添加详细解释信息 */}
          <div className="card">
            <div className="flex items-center mb-3">
              <Info className="h-5 w-5 text-blue-500 mr-2" />
              <h5 className="font-medium text-gray-900 dark:text-white">详细说明</h5>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <p>• IP纯净度检测基于IP地址特征、已知恶意IP段、黑名单数据库等因素</p>
              <p>• 内网IP地址通常被认为是安全的</p>
              <p>• Tor出口节点、数据中心IP等可能被标记为高风险</p>
              <p>• 建议定期检查IP纯净度，特别是使用动态IP的用户</p>
              <p>• 检测结果包含实时威胁情报数据，提供更准确的风险评估</p>
            </div>
          </div>

          {/* 数据源信息 */}
          <div className="card">
            <div className="flex items-center mb-3">
              <Info className="h-5 w-5 text-green-500 mr-2" />
              <h5 className="font-medium text-gray-900 dark:text-white">数据源信息</h5>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <p>• 地理位置数据: ipapi.co (免费API)</p>
              <p>• 威胁情报: AbuseIPDB (模拟数据)</p>
              <p>• 本地检测: 静态IP段 + 特征分析</p>
              <p>• 缓存时间: 5分钟</p>
              <p className="text-blue-600 dark:text-blue-400">
                💡 提示: 配置真实的API密钥可获得更准确的检测结果
              </p>
            </div>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-8">
          <div className="inline-block p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <Shield className="h-12 w-12 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">尚未进行IP纯净度检测</h4>
          <p className="text-gray-700 dark:text-gray-300 max-w-md mx-auto">
            点击"开始检测"按钮检查您的IP地址是否被列入黑名单、是否有滥用历史或其他安全风险。
          </p>
        </div>
      )}
    </div>
  );
};