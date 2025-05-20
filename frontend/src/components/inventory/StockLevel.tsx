import React from 'react';

interface StockLevelProps {
  current: number;
  threshold: number;
}

const StockLevel: React.FC<StockLevelProps> = ({ current, threshold }) => {
  // Status calculation
  const isZero = current === 0;
  const isCritical = current > 0 && current < threshold * 0.5;
  const isLow = current >= threshold * 0.5 && current < threshold;
  // const isGood = current >= threshold; // Calculate but unused
  
  // Calculate percentage for the progress bar
  let percentageFull = 0;
  
  if (isZero) {
    percentageFull = 0; // Empty bar for zero stock
  } else if (isCritical) {
    // For critical levels, show between 10-45% of the bar filled
    percentageFull = 10 + (current / (threshold * 0.5) * 35);
  } else if (isLow) {
    // For low levels, show between 50-95% of the bar filled
    const lowRatio = (current - threshold * 0.5) / (threshold * 0.5);
    percentageFull = 50 + (lowRatio * 45);
  } else {
    // For good levels, show 100% of the bar filled
    percentageFull = 100;
  }
  
  // Get the appropriate color based on stock level
  const getStatusColor = () => {
    if (isZero) return 'var(--danger)'; // Empty - Red
    if (isCritical) return 'var(--danger)'; // Critical - Red
    if (isLow) return 'var(--warning)'; // Warning - Yellow/Orange
    return 'var(--success)'; // Good - Green
  };
  
  // Get text color for the count
  const getTextColor = () => {
    if (isZero || isCritical) return 'var(--danger)';
    if (isLow) return 'var(--warning)';
    return 'inherit';
  };
  
  // Get text weight
  const getTextWeight = () => {
    return (isZero || isCritical || isLow) ? 'bold' : 'normal';
  };
  
  // Get status label
  const getStatusLabel = () => {
    if (isZero) return "Out of Stock";
    if (isCritical) return "Critical";
    if (isLow) return "Low";
    return "In Stock";
  };
  
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
            height: '12px', // Slightly taller for better visibility
            backgroundColor: 'var(--muted-border-color, #e0e0e0)',
            borderRadius: '6px',
            overflow: 'hidden',
            border: isZero ? '1px solid var(--danger)' : 'none' // Add border for empty bars
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
              borderRadius: '6px',
              transition: 'width 0.3s ease, background-color 0.3s ease'
            }}
          />
        </div>
        <div className="stock-level-text" style={{ 
            display: 'flex',
            flexDirection: 'column',
            minWidth: '90px', // Wider to accommodate status label
            alignItems: 'flex-end'
          }}>
          <span style={{ 
            color: getTextColor(),
            fontWeight: getTextWeight(),
            fontSize: '0.9rem'
          }}>
            {current} / {threshold}
          </span>
          <span style={{
            fontSize: '0.7rem',
            color: getTextColor(),
            opacity: 0.9,
            marginTop: '-2px'
          }}>
            {getStatusLabel()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StockLevel;