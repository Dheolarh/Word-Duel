interface ToggleProps {
  enabled: boolean;
  onToggle: () => void;
  label: string;
}

export function Toggle({ enabled, onToggle, label }: ToggleProps) {
  return (
    <div className="flex items-center justify-between w-full py-2">
      <span className="text-sm text-[#2d5016] font-medium">{label}</span>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#4a9b3c] focus:ring-offset-2 ${
          enabled ? 'bg-[#4a9b3c]' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
