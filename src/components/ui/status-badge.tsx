import { Badge } from '@/components/ui/badge';
import { DataStatus } from '@/types/finka-core';

interface StatusBadgeProps {
  status: DataStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = (status: DataStatus) => {
    switch (status) {
      case 'draft':
        return {
          variant: 'secondary' as const,
          label: 'Черновик',
          className: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        };
      case 'submitted':
        return {
          variant: 'default' as const,
          label: 'Отправлено',
          className: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        };
      case 'approved':
        return {
          variant: 'default' as const,
          label: 'Утверждено',
          className: 'bg-green-100 text-green-700 hover:bg-green-200'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} ${className || ''}`}
    >
      {config.label}
    </Badge>
  );
}