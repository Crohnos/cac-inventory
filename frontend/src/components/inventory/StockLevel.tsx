import React from 'react';

interface StockLevelProps {
  current: number;
  threshold: number;
}

const StockLevel: React.FC<StockLevelProps> = ({ current, threshold }) => {
  const isLowStock = current < threshold;
  const ratio = Math.min(current / threshold, 2); // Cap at 200% for visualization
  
  const getStatusColor = () => {
    if (ratio <= 0.5) return 'var(--danger)'; // Critical - Red
    if (ratio <= 0.75) return 'var(--warning)'; // Warning - Orange/Yellow
    if (ratio < 1) return 'var(--warning)';    // Caution - Orange/Yellow
    return 'var(--success)';                   // Good - Green
  };
  
  const percentageFull = Math.min(ratio * 100, 100); // Percentage for progress bar
  
  return (
    <div style={{ width: '100%' }}>
      <div 
        style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          width: '100%'
        }}
      >
        <div 
          style={{ 
            position: 'relative',
            flex: '1',
            minWidth: '60px',
            height: '10px',
            backgroundColor: 'var(--muted-border-color, #e0e0e0)',
            borderRadius: '5px',
            overflow: 'hidden'
          }}
        >
          <div 
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${percentageFull}%`,
              backgroundColor: getStatusColor(),
              borderRadius: '5px',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
        <span style={{ 
            minWidth: '60px',
            textAlign: 'right',
            color: isLowStock ? 'var(--danger)' : 'inherit',
            fontWeight: isLowStock ? 'bold' : 'normal'
          }}>
          {current} / {threshold}
        </span>
      </div>
    </div>
  );
};

export default StockLevel;