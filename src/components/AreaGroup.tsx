import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';

function AreaGroupComponent({ data }: NodeProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 12,
          fontSize: 14,
          fontWeight: 'bold',
          color: 'rgba(212, 165, 116, 0.8)',
          letterSpacing: '0.1em',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {(data as { label?: string }).label ?? ''}
      </div>
    </div>
  );
}

export const AreaGroup = memo(AreaGroupComponent);
