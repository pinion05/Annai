import { useState } from 'react';
import { RECOMMENDED_MODELS, DEFAULT_MODEL, type RecommendedModel } from '../lib/models';

interface ModelSelectorProps {
  value?: string;
  onChange: (modelId: string) => void;
}

export default function ModelSelector({ value = DEFAULT_MODEL, onChange }: ModelSelectorProps) {
  const [isCustom, setIsCustom] = useState(!RECOMMENDED_MODELS.some((m) => m.id === value));
  const [customModel, setCustomModel] = useState(isCustom ? value : '');

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue === 'custom') {
      setIsCustom(true);
      onChange(customModel || DEFAULT_MODEL);
    } else {
      setIsCustom(false);
      onChange(selectedValue);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCustomModel(newValue);
    if (newValue.trim()) {
      onChange(newValue.trim());
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-300">Model</label>
      <select
        value={isCustom ? 'custom' : value}
        onChange={handleSelectChange}
        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-gray-600"
      >
        {RECOMMENDED_MODELS.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
        <option value="custom">Custom model ID...</option>
      </select>

      {isCustom && (
        <input
          type="text"
          value={customModel}
          onChange={handleCustomInputChange}
          placeholder="e.g., openai/gpt-4"
          className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-gray-600 placeholder:text-gray-500"
        />
      )}

      {value && (
        <p className="text-[11px] text-gray-500">
          Current: <span className="font-mono text-gray-400">{value}</span>
        </p>
      )}
    </div>
  );
}
