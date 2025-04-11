import { useEffect, useRef, useState } from 'react';

const SwapHistogram = ({ swapData, tokenASymbol, tokenBSymbol }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredBar, setHoveredBar] = useState(null);
  const [viewMode, setViewMode] = useState('count'); // 'count' or 'volume'
  
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
  
  // Render the histogram
  useEffect(() => {
    if (!canvasRef.current || !swapData || !swapData.length || dimensions.width === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = dimensions;
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Extract price data
    const prices = swapData.map(swap => parseFloat(swap.price)).filter(price => 
      price !== null && !isNaN(price) && isFinite(price)
    );
    
    // Check if we have valid prices
    if (prices.length === 0) {
      // Draw "No Data" message
      ctx.font = '16px Arial';
      ctx.fillStyle = '#999';
      ctx.textAlign = 'center';
      ctx.fillText('No valid price data available', width / 2, height / 2);
      return;
    }
    
    // Calculate histogram bins
    const binCount = Math.min(12, prices.length); // Number of bins, capped by data points
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const binWidth = (maxPrice - minPrice) / binCount;
    
    // Create histogram bins
    const bins = Array(binCount).fill(0);
    const volumeBins = Array(binCount).fill(0);
    const binRanges = Array(binCount).fill(0).map((_, i) => ({
      start: minPrice + i * binWidth,
      end: minPrice + (i + 1) * binWidth
    }));
    
    // Count items and volume in each bin
    swapData.forEach(swap => {
      const price = parseFloat(swap.price);
      const binIndex = Math.min(Math.floor((price - minPrice) / binWidth), binCount - 1);
      if (binIndex >= 0) {
        bins[binIndex]++;
        
        // Calculate volume based on the swap direction
        let volume = 0;
        if (swap.tradeDirection.includes('Sell')) {
          // When selling tokenA, use the amount of tokenA
          volume = swap.formattedAmount0In || swap.formattedAmount1In;
        } else {
          // When buying tokenA, use the amount of tokenA received
          volume = swap.formattedAmount0Out || swap.formattedAmount1Out;
        }
        
        volumeBins[binIndex] += volume;
      }
    });
    
    // Use either count or volume bins based on viewMode
    const displayBins = viewMode === 'count' ? bins : volumeBins;
    
    // Find the maximum value for scaling
    const maxValue = Math.max(...displayBins);
    
    // Set up coordinate system
    const padding = { top: 20, right: 40, bottom: 60, left: 60 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    
    // X-axis
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    
    // Y-axis
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(padding.left, padding.top);
    
    ctx.stroke();
    
    // Axes labels
    ctx.font = '12px Arial';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    
    // X-axis label
    ctx.fillText(`Price (${tokenBSymbol}/${tokenASymbol})`, width / 2, height - 10);
    
    // Y-axis label
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(viewMode === 'count' ? 'Number of Transactions' : `Volume (${tokenASymbol})`, 0, 0);
    ctx.restore();
    
    // Draw X-axis ticks and labels
    ctx.textAlign = 'center';
    binRanges.forEach((range, i) => {
      const x = padding.left + (i + 0.5) * (graphWidth / binCount);
      const tickHeight = 5;
      
      ctx.beginPath();
      ctx.moveTo(x, height - padding.bottom);
      ctx.lineTo(x, height - padding.bottom + tickHeight);
      ctx.stroke();
      
      // Draw tick labels (price ranges)
      ctx.save();
      ctx.translate(x, height - padding.bottom + 10);
      ctx.rotate(Math.PI / 4); // Rotate labels to prevent overlap
      ctx.textAlign = 'right';
      ctx.fillText(range.start.toFixed(2), 0, 0);
      ctx.restore();
    });
    
    // Draw Y-axis ticks and labels
    ctx.textAlign = 'right';
    const yTickCount = 5;
    for (let i = 0; i <= yTickCount; i++) {
      const y = height - padding.bottom - (i / yTickCount) * graphHeight;
      const value = Math.round((i / yTickCount) * maxValue);
      
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left - 5, y);
      ctx.stroke();
      
      ctx.fillText(value.toString(), padding.left - 10, y + 3);
    }
    
    // Draw histogram bars
    const barPadding = 2;
    const barWidth = (graphWidth / binCount) - barPadding;
    
    // Store bar positions for hover effects
    const barPositions = [];
    
    displayBins.forEach((value, i) => {
      const normalizedHeight = (value / maxValue) * graphHeight;
      const x = padding.left + i * (graphWidth / binCount) + barPadding / 2;
      const y = height - padding.bottom - normalizedHeight;
      
      // Save bar position for hover detection
      barPositions.push({
        x,
        y,
        width: barWidth,
        height: normalizedHeight,
        value,
        range: binRanges[i],
        count: bins[i],
        volume: volumeBins[i]
      });
      
      // Draw bar with gradient
      const gradient = ctx.createLinearGradient(x, y, x, height - padding.bottom);
      gradient.addColorStop(0, '#3B82F6'); // Blue at top
      gradient.addColorStop(1, '#1E40AF'); // Darker blue at bottom
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, normalizedHeight);
      
      // Add border
      ctx.strokeStyle = '#2563EB';
      ctx.strokeRect(x, y, barWidth, normalizedHeight);
    });
    
    // Add hover effects
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Check if mouse is over any bar
      let hover = null;
      
      for (let i = 0; i < barPositions.length; i++) {
        const bar = barPositions[i];
        if (
          mouseX >= bar.x && 
          mouseX <= bar.x + bar.width && 
          mouseY >= bar.y && 
          mouseY <= bar.y + bar.height
        ) {
          hover = {
            ...bar,
            index: i
          };
          break;
        }
      }
      
      if (hover !== hoveredBar) {
        setHoveredBar(hover);
        
        // Redraw with hover effect
        if (hover) {
          // Highlight the hovered bar
          const gradient = ctx.createLinearGradient(hover.x, hover.y, hover.x, height - padding.bottom);
          gradient.addColorStop(0, '#60A5FA'); // Lighter blue at top
          gradient.addColorStop(1, '#3B82F6'); // Blue at bottom
          
          ctx.fillStyle = gradient;
          ctx.fillRect(hover.x, hover.y, hover.width, hover.height);
          ctx.strokeStyle = '#2563EB';
          ctx.strokeRect(hover.x, hover.y, hover.width, hover.height);
          
          canvas.style.cursor = 'pointer';
        } else {
          canvas.style.cursor = 'default';
          
          // Redraw all bars if no hover
          barPositions.forEach((bar) => {
            const gradient = ctx.createLinearGradient(bar.x, bar.y, bar.x, height - padding.bottom);
            gradient.addColorStop(0, '#3B82F6'); // Blue at top
            gradient.addColorStop(1, '#1E40AF'); // Darker blue at bottom
            
            ctx.fillStyle = gradient;
            ctx.fillRect(bar.x, bar.y, bar.width, bar.height);
            ctx.strokeStyle = '#2563EB';
            ctx.strokeRect(bar.x, bar.y, bar.width, bar.height);
          });
        }
      }
    };
    
    const handleMouseLeave = () => {
      setHoveredBar(null);
      canvas.style.cursor = 'default';
      
      // Redraw all bars when mouse leaves
      barPositions.forEach((bar) => {
        const gradient = ctx.createLinearGradient(bar.x, bar.y, bar.x, height - padding.bottom);
        gradient.addColorStop(0, '#3B82F6'); // Blue at top
        gradient.addColorStop(1, '#1E40AF'); // Darker blue at bottom
        
        ctx.fillStyle = gradient;
        ctx.fillRect(bar.x, bar.y, bar.width, bar.height);
        ctx.strokeStyle = '#2563EB';
        ctx.strokeRect(bar.x, bar.y, bar.width, bar.height);
      });
    };
    
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [dimensions, swapData, tokenASymbol, tokenBSymbol, viewMode]);
  
  // Render tooltip for hovered bar
  const renderTooltip = () => {
    if (!hoveredBar) return null;
    
    return (
      <div 
        className="absolute bg-gray-800 border border-gray-600 rounded-md p-2 z-10 shadow-lg text-sm"
        style={{
          left: `${hoveredBar.x + hoveredBar.width / 2}px`,
          top: `${hoveredBar.y - 10}px`,
          transform: 'translate(-50%, -100%)'
        }}
      >
        <div className="font-medium mb-1">
          Price Range: {hoveredBar.range.start.toFixed(4)} - {hoveredBar.range.end.toFixed(4)} {tokenBSymbol}/{tokenASymbol}
        </div>
        <div>
          <span className="text-gray-400">Transactions:</span> {hoveredBar.count}
        </div>
        <div>
          <span className="text-gray-400">Volume:</span> {hoveredBar.volume.toFixed(4)} {tokenASymbol}
        </div>
      </div>
    );
  };
  
  return (
    <div>
      {/* View mode selector */}
      <div className="flex justify-end mb-2">
        <div className="bg-gray-700 rounded-lg p-1 inline-flex">
          <button
            onClick={() => setViewMode('count')}
            className={`px-3 py-1 text-xs rounded ${
              viewMode === 'count' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-600'
            }`}
          >
            Count
          </button>
          <button
            onClick={() => setViewMode('volume')}
            className={`px-3 py-1 text-xs rounded ${
              viewMode === 'volume' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-600'
            }`}
          >
            Volume
          </button>
        </div>
      </div>
      
      {/* Canvas container */}
      <div className="relative">
        <div ref={containerRef} className="w-full">
          <canvas 
            ref={canvasRef}
            className="w-full"
            style={{ height: dimensions.height ? `${dimensions.height}px` : 'auto' }}
          />
        </div>
        {hoveredBar && renderTooltip()}
      </div>
    </div>
  );
};

export default SwapHistogram;