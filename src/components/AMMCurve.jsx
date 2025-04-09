import { useEffect, useRef, useState } from 'react';

const AMMCurve = ({ reserveA, reserveB, tokenASymbol, tokenBSymbol, scale = 1.5, simulatedReserveA, simulatedReserveB }) => {
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  // Set up canvas dimensions
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.width * 0.6, // Maintain aspect ratio
        });
      }
    });
    
    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current.parentElement);
    }
    
    return () => resizeObserver.disconnect();
  }, []);
  
  // Render the curve
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !reserveA || !reserveB) return;
    
    const ctx = canvas.getContext('2d');
    const { width, height } = dimensions;
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate K (constant product)
    const reserveANum = parseFloat(reserveA);
    const reserveBNum = parseFloat(reserveB);
    const k = reserveANum * reserveBNum;
    
    // Calculate simulated K if provided
    const hasSimulation = simulatedReserveA && simulatedReserveB;
    const simulatedReserveANum = hasSimulation ? parseFloat(simulatedReserveA) : 0;
    const simulatedReserveBNum = hasSimulation ? parseFloat(simulatedReserveB) : 0;
    const simulatedK = hasSimulation ? simulatedReserveANum * simulatedReserveBNum : 0;
    
    // Determine range for the curve (extend beyond current point)
    const maxReserveA = Math.max(reserveANum, simulatedReserveANum || 0) * scale;
    const maxReserveB = Math.max(reserveBNum, simulatedReserveBNum || 0) * scale;
    
    // Set up coordinate system transformation
    const padding = 40;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;
    
    // Coordinate transformation functions
    const toCanvasX = x => (x / maxReserveA) * graphWidth + padding;
    const toCanvasY = y => height - ((y / maxReserveB) * graphHeight + padding);
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    
    // X-axis
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    
    // Y-axis
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(padding, padding);
    
    // Axes labels
    ctx.font = '12px Arial';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    
    // X-axis label
    ctx.fillText(tokenASymbol || 'Token A', width / 2, height - 10);
    
    // Y-axis label
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(tokenBSymbol || 'Token B', 0, 0);
    ctx.restore();
    
    // Draw tick marks and values
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const x = padding + (i / 5) * graphWidth;
      const y = height - padding - (i / 5) * graphHeight;
      const xValue = (i / 5 * maxReserveA).toFixed(i === 0 ? 0 : 1);
      const yValue = (i / 5 * maxReserveB).toFixed(i === 0 ? 0 : 1);
      
      // X-axis ticks
      ctx.beginPath();
      ctx.moveTo(x, height - padding);
      ctx.lineTo(x, height - padding + 5);
      ctx.stroke();
      ctx.fillText(xValue, x, height - padding + 20);
      
      // Y-axis ticks
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding - 5, y);
      ctx.stroke();
      ctx.fillText(yValue, padding - 10, y + 5);
    }
    
    ctx.stroke();
    
    // Draw the constant product curve (x * y = k)
    const drawCurve = (constantK, color, lineWidth) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      
      const numPoints = 200;
      const step = maxReserveA / numPoints;
      
      for (let i = 0; i <= numPoints; i++) {
        const x = step * i;
        if (x > 0) {
          const y = constantK / x;
          
          if (y <= maxReserveB) {
            const canvasX = toCanvasX(x);
            const canvasY = toCanvasY(y);
            
            if (i === 0) {
              ctx.moveTo(canvasX, canvasY);
            } else {
              ctx.lineTo(canvasX, canvasY);
            }
          }
        }
      }
      
      ctx.stroke();
    };
    
    // Draw current curve
    drawCurve(k, '#3B82F6', 2);  // Blue
    
    // Draw simulated curve if values provided
    if (hasSimulation) {
      drawCurve(simulatedK, '#10B981', 2);  // Green
    }
    
    // Draw the current position on the curve
    const currentX = toCanvasX(reserveANum);
    const currentY = toCanvasY(reserveBNum);
    
    ctx.beginPath();
    ctx.arc(currentX, currentY, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#EF4444'; // Red
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw a label for the current position
    ctx.font = '12px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('P', currentX, currentY - 10);
    
    // Draw simulated position if values provided
    if (hasSimulation) {
      const simulatedX = toCanvasX(simulatedReserveANum);
      const simulatedY = toCanvasY(simulatedReserveBNum);
      
      ctx.beginPath();
      ctx.arc(simulatedX, simulatedY, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#10B981'; // Green
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw a label for the simulated position
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('P\'', simulatedX, simulatedY - 10);
      
      // Draw dotted lines between current and simulated position
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 1;
      ctx.moveTo(currentX, currentY);
      ctx.lineTo(simulatedX, simulatedY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw dotted lines to axes for the current position
    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    
    // Vertical line to x-axis
    ctx.moveTo(currentX, currentY);
    ctx.lineTo(currentX, height - padding);
    
    // Horizontal line to y-axis
    ctx.moveTo(currentX, currentY);
    ctx.lineTo(padding, currentY);
    
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Add hover detection
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Check distance to current point
      const distanceToCurrentPoint = Math.sqrt(
        Math.pow(mouseX - currentX, 2) + Math.pow(mouseY - currentY, 2)
      );
      
      // Check distance to simulated point if it exists
      let distanceToSimulatedPoint = Infinity;
      if (hasSimulation) {
        const simulatedX = toCanvasX(simulatedReserveANum);
        const simulatedY = toCanvasY(simulatedReserveBNum);
        
        distanceToSimulatedPoint = Math.sqrt(
          Math.pow(mouseX - simulatedX, 2) + Math.pow(mouseY - simulatedY, 2)
        );
      }
      
      // Determine which point is being hovered (if any)
      if (distanceToCurrentPoint < 20 && distanceToCurrentPoint <= distanceToSimulatedPoint) {
        setHoveredPoint({
          x: currentX,
          y: currentY,
          reserveA: reserveANum.toFixed(4),
          reserveB: reserveBNum.toFixed(4),
          isSimulated: false
        });
        canvas.style.cursor = 'pointer';
      } else if (hasSimulation && distanceToSimulatedPoint < 20) {
        const simulatedX = toCanvasX(simulatedReserveANum);
        const simulatedY = toCanvasY(simulatedReserveBNum);
        
        setHoveredPoint({
          x: simulatedX,
          y: simulatedY,
          reserveA: simulatedReserveANum.toFixed(4),
          reserveB: simulatedReserveBNum.toFixed(4),
          isSimulated: true
        });
        canvas.style.cursor = 'pointer';
      } else {
        setHoveredPoint(null);
        canvas.style.cursor = 'default';
      }
    };
    
    canvas.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [dimensions, reserveA, reserveB, tokenASymbol, tokenBSymbol, scale, simulatedReserveA, simulatedReserveB]);
  
  return (
    <div className="relative">
      <h3 className="text-xl font-medium mb-2">AMM Constant Product Curve</h3>
      <p className="text-gray-400 text-sm mb-4">
        x * y = k, where k = {parseFloat(reserveA) * parseFloat(reserveB)}
        {simulatedReserveA && simulatedReserveB && (
          <span>
            {' '}→ k' = {parseFloat(simulatedReserveA) * parseFloat(simulatedReserveB)}
          </span>
        )}
      </p>
      
      {simulatedReserveA && simulatedReserveB && (
        <div className="mb-4 flex items-center text-xs text-gray-400">
          <div className="flex items-center mr-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            <span>Current Pool</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span>Simulated Pool</span>
          </div>
        </div>
      )}
      
      <div className="w-full bg-gray-800 rounded-lg p-4">
        <canvas 
          ref={canvasRef}
          style={{ width: '100%', height: `${dimensions.height}px` }}
        />
        
        {hoveredPoint && (
          <div 
            className={`absolute bg-gray-700 p-2 rounded shadow-lg text-sm ${hoveredPoint.isSimulated ? 'border border-green-500' : ''}`}
            style={{ 
              left: hoveredPoint.x + 10, 
              top: hoveredPoint.y - 10,
              transform: 'translateY(-100%)',
              zIndex: 10 
            }}
          >
            <p>{hoveredPoint.isSimulated ? 'Simulated Position:' : 'Current Position:'}</p>
            <p>{tokenASymbol || 'Token A'}: {hoveredPoint.reserveA}</p>
            <p>{tokenBSymbol || 'Token B'}: {hoveredPoint.reserveB}</p>
          </div>
        )}
      </div>
      <div className="mt-4 text-sm text-gray-400">
        <p>• On every swap, point P moves along the curve.</p>
        <p>• On liquidity addition/removal, the curve shifts up/down.</p>
      </div>
    </div>
  );
};

export default AMMCurve; 