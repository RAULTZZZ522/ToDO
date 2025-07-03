/*
 * charts for WeChat small app v1.0
 * 简化版，仅实现柱状图
 */

function findMinMax(series, opt) {
  let minData = opt.min || 0;
  let maxData = opt.max || 0;
  
  if (series && series.length > 0) {
    for (let i = 0; i < series.length; i++) {
      const data = series[i].data;
      for (let j = 0; j < data.length; j++) {
        if (data[j] > maxData) maxData = data[j];
        if (data[j] < minData) minData = data[j];
      }
    }
  }
  
  return { minData, maxData };
}

function calYAxis(series, opts) {
  const minMaxData = findMinMax(series, opts.yAxis);
  const minData = minMaxData.minData;
  const maxData = minMaxData.maxData;
  
  const yAxisWidth = opts.yAxis.titleWidth || 15;
  const spacingValid = opts.height - 2 * opts.padding - opts.xAxis.height;
  
  const range = maxData - minData;
  const gridCount = 5;
  const avgValPerGrid = range / gridCount;
  
  const yAxisTicks = [];
  for (let i = 0; i <= gridCount; i++) {
    yAxisTicks.push(minData + avgValPerGrid * i);
  }
  
  return { yAxisTicks, yAxisWidth };
}

function getDataPoints(series, xPoints, eachSpacing, opts) {
  const points = [];
  
  for (let i = 0; i < series.length; i++) {
    const data = series[i].data;
    const yAxisTicks = opts.yAxis.ticks;
    const minData = yAxisTicks[0];
    const maxData = yAxisTicks[yAxisTicks.length - 1];
    const spacingValid = opts.height - 2 * opts.padding - opts.xAxis.height;
    
    for (let j = 0; j < data.length; j++) {
      const item = data[j];
      const point = {};
      point.x = xPoints[j] + eachSpacing / 2;
      const height = (spacingValid * (item - minData)) / (maxData - minData);
      point.y = opts.height - opts.padding - height - opts.xAxis.height;
      point.value = item;
      points.push(point);
    }
  }
  
  return points;
}

function drawXAxis(series, opts, config, context) {
  const xAxisHeight = opts.xAxis.height || 30;
  const padding = opts.padding;
  const xAxisLineHeight = 2;
  
  // X轴线
  context.beginPath();
  context.setStrokeStyle(opts.xAxis.lineColor || '#cccccc');
  context.setLineWidth(xAxisLineHeight);
  context.moveTo(padding, opts.height - padding - xAxisHeight);
  context.lineTo(opts.width - padding, opts.height - padding - xAxisHeight);
  context.stroke();
  
  // X轴标签
  const categories = opts.categories || [];
  const eachSpacing = (opts.width - 2 * padding) / categories.length;
  const xPoints = [];
  
  for (let i = 0; i < categories.length; i++) {
    xPoints.push(padding + i * eachSpacing);
  }
  
  if (opts.xAxis.showLabels !== false) {
    context.beginPath();
    context.setFontSize(opts.xAxis.fontSize || 10);
    context.setFillStyle(opts.xAxis.fontColor || '#666666');
    
    for (let i = 0; i < categories.length; i++) {
      const item = categories[i];
      let xpt = xPoints[i];
      
      // 根据标签宽度调整位置
      const textWidth = context.measureText(item).width;
      
      // 如果文字太长，旋转显示
      if (textWidth > eachSpacing) {
        context.save();
        context.translate(xpt + eachSpacing / 2, opts.height - padding - 5);
        context.rotate(-Math.PI / 4);
        context.fillText(item, 0, 0);
        context.restore();
      } else {
        xpt = xpt + eachSpacing / 2 - textWidth / 2;
        context.fillText(item, xpt, opts.height - padding - 5);
      }
    }
    
    context.closePath();
  }
  
  return { xPoints, eachSpacing };
}

function drawYAxis(series, opts, config, context) {
  const yAxis = calYAxis(series, opts);
  const yAxisTicks = yAxis.yAxisTicks;
  const padding = opts.padding;
  const yAxisWidth = yAxis.yAxisWidth;
  
  // Y轴线
  context.beginPath();
  context.setStrokeStyle(opts.yAxis.lineColor || '#cccccc');
  context.setLineWidth(1);
  context.moveTo(padding, padding);
  context.lineTo(padding, opts.height - padding - opts.xAxis.height);
  context.stroke();
  
  // Y轴网格线和标签
  context.beginPath();
  context.setFontSize(opts.yAxis.fontSize || 10);
  context.setFillStyle(opts.yAxis.fontColor || '#666666');
  
  for (let i = 0; i < yAxisTicks.length; i++) {
    const y = opts.height - opts.padding - opts.xAxis.height - 
              (opts.height - 2 * opts.padding - opts.xAxis.height) * i / (yAxisTicks.length - 1);
    
    // 网格线
    context.setStrokeStyle(opts.yAxis.gridColor || '#cccccc');
    context.setLineWidth(1);
    context.moveTo(padding, y);
    context.lineTo(opts.width - padding, y);
    
    // 标签
    context.fillText(yAxisTicks[i].toFixed(0), padding - yAxisWidth, y + 5);
  }
  
  context.stroke();
  context.closePath();
  
  // Y轴标题
  if (opts.yAxis.title) {
    context.save();
    context.beginPath();
    context.setFontSize(opts.yAxis.titleFontSize || 10);
    context.setFillStyle(opts.yAxis.titleFontColor || '#666666');
    context.translate(10, (opts.height + opts.padding - opts.xAxis.height) / 2);
    context.rotate(-Math.PI / 2);
    context.fillText(opts.yAxis.title, 0, 0);
    context.stroke();
    context.closePath();
    context.restore();
  }
  
  return { yAxisTicks };
}

function drawColumnChart(series, opts, config, context) {
  const xAxis = drawXAxis(series, opts, config, context);
  const xPoints = xAxis.xPoints;
  const eachSpacing = xAxis.eachSpacing;
  
  opts.yAxis.ticks = drawYAxis(series, opts, config, context).yAxisTicks;
  
  // 柱状图
  const points = getDataPoints(series, xPoints, eachSpacing, opts);
  const columnWidth = Math.min(eachSpacing - 2 * config.columnPadding, 30);
  
  // 绘制柱状图
  for (let i = 0, j = 0; i < points.length; i++, j++) {
    context.beginPath();
    const point = points[i];
    
    // 计算高度和宽度
    const height = opts.height - opts.padding - opts.xAxis.height - point.y;
    const x = point.x - columnWidth / 2;
    
    context.setFillStyle(series[0].color || '#1890FF');
    context.fillRect(x, point.y, columnWidth, height);
    context.closePath();
  }
}

function drawCharts(type, opts, config, context) {
  if (type === 'column') {
    drawColumnChart(opts.series, opts, config, context);
  }
}

// 主类定义
class WxCharts {
  constructor(opts) {
    this.opts = opts;
    this.config = {
      yAxisWidth: 15,
      yAxisSplit: 5,
      xAxisHeight: 15,
      xAxisLineHeight: 15,
      legendHeight: 15,
      yAxisTitleWidth: 15,
      padding: 12,
      columePadding: 3,
      fontSize: 10,
      dataPointShape: ['circle', 'diamond', 'triangle', 'rect'],
      colors: ['#1890FF', '#2FC25B', '#FACC14', '#223273', '#8543E0', '#13C2C2'],
      pieChartLinePadding: 15,
      pieChartTextPadding: 5,
      xAxisTextPadding: 3,
      titleColor: '#333333',
      titleFontSize: 20,
      subtitleColor: '#999999',
      subtitleFontSize: 15,
      toolTipPadding: 3,
      toolTipBackground: '#000000',
      toolTipOpacity: 0.7,
      toolTipLineHeight: 14,
      radarGridCount: 3,
      radarLabelTextMargin: 15
    };
    
    // 合并配置
    this.opts = Object.assign({}, {
      padding: 10,
      legend: {
        show: true,
        position: 'bottom',
        lineHeight: 25
      },
      animation: true,
      dataLabel: true
    }, this.opts);
    
    // 处理图表高度和宽度
    this.opts.width = this.opts.width || 320;
    this.opts.height = this.opts.height || 200;
    this.opts.padding = this.opts.padding || 10;
    
    // 处理X轴高度
    if (!this.opts.xAxis) {
      this.opts.xAxis = {};
    }
    
    this.opts.xAxis.height = this.opts.xAxis.height || 30;
    
    // 处理Y轴配置
    if (!this.opts.yAxis) {
      this.opts.yAxis = {};
    }
    
    // 渲染图表
    this.context = wx.createCanvasContext(opts.canvasId);
    drawCharts(opts.type, this.opts, this.config, this.context);
    
    // 绘制到画布
    if (this.opts.animation) {
      this.context.draw();
    } else {
      this.context.draw(true);
    }
  }
}

module.exports = WxCharts; 