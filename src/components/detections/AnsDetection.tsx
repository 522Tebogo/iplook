import React, { useState } from 'react';
import { AnsService, AnsResult } from '../../services/ansService';
import { Globe, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface AnsDetectionProps {
  ip: string;
}

export const AnsDetection: React.FC<AnsDetectionProps> = ({ ip }) => {
  const [result, setResult] = useState<AnsResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const ansResult = await AnsService.checkAns(ip);
      setResult(ansResult);
    } catch (err) {
      setError('ANS检测失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Anycast网络检测</h3>
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
          <div className={`rounded-lg p-4 ${result.isAnycast ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
            <div className="flex items-center">
              {result.isAnycast ? (
                <>
                  <Globe className="h-6 w-6 text-green-500 mr-2" />
                  <h4 className="text-lg font-medium text-green-800 dark:text-green-200">检测到Anycast网络</h4>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
                  <h4 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">未检测到Anycast网络</h4>
                </>
              )}
            </div>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              {result.isAnycast 
                ? '您的IP地址属于Anycast网络，这意味着您的流量可能会被路由到最近的节点。' 
                : '您的IP地址不属于Anycast网络，这是一个传统的单播地址。'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">路由信息</h5>
              <div className="space-y-3">
                {result.routes.map((route, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{route.location}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{route.provider}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">{route.latency}ms</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{route.hops}跳</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">检测详情</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">检测IP:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Anycast状态:</span>
                  <span className={`font-medium ${result.isAnycast ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {result.isAnycast ? '是' : '否'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">检测节点:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.nodesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">检测时间:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-8">
          <div className="inline-block p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <Globe className="h-12 w-12 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">尚未进行Anycast网络检测</h4>
          <p className="text-gray-700 dark:text-gray-300 max-w-md mx-auto">
            点击"开始检测"按钮检测您的IP地址是否属于Anycast网络，以及在不同地理位置的路由情况。
          </p>
        </div>
      )}
    </div>
  );
};