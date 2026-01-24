import React from 'react';
import { NotionConfig } from '../types';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: NotionConfig;
  onSave: (config: NotionConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, config, onSave }) => {
  const [apiKey, setApiKey] = React.useState(config.apiKey);
  const [useProxy, setUseProxy] = React.useState(!!config.proxyUrl);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      apiKey,
      proxyUrl: useProxy ? 'https://corsproxy.io/?' : ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Notion Configuration</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notion API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
              placeholder="secret_..."
            />
            <p className="text-xs text-gray-500 mt-2">
              Get your Internal Integration Token from <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Notion Developers</a>.
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-start space-x-3">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  type="checkbox"
                  id="useProxy"
                  checked={useProxy}
                  onChange={(e) => setUseProxy(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="useProxy" className="text-sm font-semibold text-blue-900 cursor-pointer select-none">
                  Enable Browser Connection
                </label>
                <p className="text-blue-700 mt-1 text-xs leading-relaxed">
                  Required to access Notion directly from this browser. This routes traffic through a secure public proxy (corsproxy.io) to bypass CORS restrictions.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all text-sm"
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;