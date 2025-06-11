interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'warning' | 'sync' | 'conflict' | 'error' | 'active' | 'syncing';
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export function StatusIndicator({ status, size = 'md', animate = false }: StatusIndicatorProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'sync':
      case 'active':
        return 'bg-industrial-green';
      case 'warning':
      case 'conflict':
      case 'syncing':
        return 'bg-industrial-amber';
      case 'offline':
      case 'error':
        return 'bg-industrial-red';
      default:
        return 'bg-gray-500';
    }
  };

  const getSizeClass = (size: string) => {
    switch (size) {
      case 'sm':
        return 'w-2 h-2';
      case 'lg':
        return 'w-4 h-4';
      default:
        return 'w-3 h-3';
    }
  };

  const shouldBlink = (status: string) => {
    return status === 'conflict' || status === 'error';
  };

  return (
    <div className={`
      ${getSizeClass(size)}
      ${getStatusColor(status)}
      rounded-full
      relative
      ${animate ? 'animate-pulse-slow' : ''}
      ${shouldBlink(status) ? 'animate-blink' : ''}
    `}>
      <div className={`
        absolute inset-0 rounded-full border-2 border-current opacity-30
        ${animate ? 'animate-ping' : ''}
      `} />
    </div>
  );
}
