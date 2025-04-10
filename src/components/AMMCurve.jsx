import { useEffect, useRef, useState } from 'react';

const AMMCurve = ({ reserveA, reserveB, tokenASymbol, tokenBSymbol, scale = 1.5, simulatedReserveA, simulatedReserveB, expectedPointA, expectedPointB }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
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
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []);
  
  // Render the curve
  useEffect(() => {
    if (!canvasRef.current || !reserveA || !reserveB || dimensions.width === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
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
    
    // Check for expected point (for swaps)
    const hasExpectedPoint = expectedPointA && expectedPointB;
    const expectedPointANum = hasExpectedPoint ? parseFloat(expectedPointA) : 0;
    const expectedPointBNum = hasExpectedPoint ? parseFloat(expectedPointB) : 0;
    
    // Determine range for the curve (extend beyond current point)
    const maxReserveA = Math.max(
      reserveANum, 
      simulatedReserveANum || 0,
      expectedPointANum || 0
    ) * scale;
    
    const maxReserveB = Math.max(
      reserveBNum, 
      simulatedReserveBNum || 0,
      expectedPointBNum || 0
    ) * scale;
    
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
    
    // Draw expected point (for swaps) if values provided
    if (hasExpectedPoint) {
      const expectedX = toCanvasX(expectedPointANum);
      const expectedY = toCanvasY(expectedPointBNum);
      
      ctx.beginPath();
      ctx.arc(expectedX, expectedY, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFCD1E'; // Golden yellow
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw a label for the expected position
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('E', expectedX, expectedY - 10);
      
      // Draw dotted lines between current and expected position
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = '#FFCD1E';
      ctx.lineWidth = 1;
      ctx.moveTo(currentX, currentY);
      ctx.lineTo(expectedX, expectedY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
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
      
      // Check distance to expected point if it exists
      let distanceToExpectedPoint = Infinity;
      if (hasExpectedPoint) {
        const expectedX = toCanvasX(expectedPointANum);
        const expectedY = toCanvasY(expectedPointBNum);
        
        distanceToExpectedPoint = Math.sqrt(
          Math.pow(mouseX - expectedX, 2) + Math.pow(mouseY - expectedY, 2)
        );
      }
      
      // Determine which point is being hovered (if any)
      if (distanceToCurrentPoint < 20 && 
          distanceToCurrentPoint <= distanceToSimulatedPoint && 
          distanceToCurrentPoint <= distanceToExpectedPoint) {
        setHoveredPoint({
          x: currentX,
          y: currentY,
          reserveA: reserveANum.toFixed(4),
          reserveB: reserveBNum.toFixed(4),
          isSimulated: false,
          isExpected: false
        });
        canvas.style.cursor = 'pointer';
      } else if (hasSimulation && 
                distanceToSimulatedPoint < 20 && 
                distanceToSimulatedPoint <= distanceToExpectedPoint) {
        setHoveredPoint({
          x: toCanvasX(simulatedReserveANum),
          y: toCanvasY(simulatedReserveBNum),
          reserveA: simulatedReserveANum.toFixed(4),
          reserveB: simulatedReserveBNum.toFixed(4),
          isSimulated: true,
          isExpected: false
        });
        canvas.style.cursor = 'pointer';
      } else if (hasExpectedPoint && distanceToExpectedPoint < 20) {
        setHoveredPoint({
          x: toCanvasX(expectedPointANum),
          y: toCanvasY(expectedPointBNum),
          reserveA: expectedPointANum.toFixed(4),
          reserveB: expectedPointBNum.toFixed(4),
          isSimulated: false,
          isExpected: true
        });
        canvas.style.cursor = 'pointer';
      } else {
        setHoveredPoint(null);
        canvas.style.cursor = 'default';
      }
    };
    
    const handleMouseLeave = () => {
      setHoveredPoint(null);
      canvas.style.cursor = 'default';
    };
    
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [dimensions, reserveA, reserveB, simulatedReserveA, simulatedReserveB, expectedPointA, expectedPointB, tokenASymbol, tokenBSymbol, scale]);
  
  // Render tooltip for hovered point
  const renderTooltip = () => {
    if (!hoveredPoint) return null;
    
    const { reserveA, reserveB, isSimulated, isExpected } = hoveredPoint;
    
    return (
      <div 
        className="absolute bg-gray-800 border border-gray-600 rounded-md p-2 z-10 shadow-lg text-sm"
        style={{
          left: `${hoveredPoint.x + 10}px`,
          top: `${hoveredPoint.y - 10}px`,
          transform: 'translate(-50%, -100%)'
        }}
      >
        <div className="font-medium mb-1">
          {isSimulated ? 'Simulated Position' : isExpected ? 'Expected Position' : 'Current Position'}
        </div>
        <div className="space-y-1">
          <div>
            <span className="text-gray-400">{tokenASymbol}:</span> {reserveA}
          </div>
          <div>
            <span className="text-gray-400">{tokenBSymbol}:</span> {reserveB}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="relative">
      <div ref={containerRef} className="w-full">
        <canvas 
          ref={canvasRef}
          className="w-full"
          style={{ height: dimensions.height ? `${dimensions.height}px` : 'auto' }}
        />
      </div>
      {hoveredPoint && renderTooltip()}
    </div>
  );
};

export default AMMCurve; 