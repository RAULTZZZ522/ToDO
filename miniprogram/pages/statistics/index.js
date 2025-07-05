const app = getApp();
// 移除wxCharts依赖，先使用本地数据
// const wxCharts = require('../../utils/wxcharts.js');
let columnChart = null;

// 本地模拟数据
const mockData = {
  // 累计专注数据
  totalStats: {
    totalCount: 87,
    totalMinutes: 2450,
    dailyAverage: 35
  },
  
  // 当日专注数据
  dailyStats: {
    '2025-07-01': {
      count: 4,
      minutes: 105
    }
  },
  
  // 分布数据
  distribution: {
    day: [
      { label: '0时', minutes: 0 },
      { label: '1时', minutes: 0 },
      { label: '2时', minutes: 0 },
      { label: '3时', minutes: 0 },
      { label: '4时', minutes: 0 },
      { label: '5时', minutes: 0 },
      { label: '6时', minutes: 0 },
      { label: '7时', minutes: 0 },
      { label: '8时', minutes: 25 },
      { label: '9时', minutes: 45 },
      { label: '10时', minutes: 30 },
      { label: '11时', minutes: 0 },
      { label: '12时', minutes: 0 },
      { label: '13时', minutes: 0 },
      { label: '14时', minutes: 35 },
      { label: '15时', minutes: 40 },
      { label: '16时', minutes: 25 },
      { label: '17时', minutes: 0 },
      { label: '18时', minutes: 0 },
      { label: '19时', minutes: 0 },
      { label: '20时', minutes: 15 },
      { label: '21时', minutes: 30 },
      { label: '22时', minutes: 20 },
      { label: '23时', minutes: 0 }
    ],
    week: [
      { label: '周一', minutes: 120 },
      { label: '周二', minutes: 90 },
      { label: '周三', minutes: 75 },
      { label: '周四', minutes: 110 },
      { label: '周五', minutes: 85 },
      { label: '周六', minutes: 45 },
      { label: '周日', minutes: 30 }
    ],
    month: [
      { label: '1日', minutes: 35 },
      { label: '2日', minutes: 45 },
      { label: '3日', minutes: 25 },
      { label: '4日', minutes: 0 },
      { label: '5日', minutes: 65 },
      { label: '6日', minutes: 55 },
      { label: '7日', minutes: 40 },
      { label: '8日', minutes: 30 },
      { label: '9日', minutes: 0 },
      { label: '10日', minutes: 25 },
      { label: '11日', minutes: 60 },
      { label: '12日', minutes: 45 },
      { label: '13日', minutes: 35 },
      { label: '14日', minutes: 40 },
      { label: '15日', minutes: 50 },
      { label: '16日', minutes: 30 },
      { label: '17日', minutes: 0 },
      { label: '18日', minutes: 45 },
      { label: '19日', minutes: 65 },
      { label: '20日', minutes: 55 },
      { label: '21日', minutes: 0 },
      { label: '22日', minutes: 35 },
      { label: '23日', minutes: 40 },
      { label: '24日', minutes: 50 },
      { label: '25日', minutes: 55 },
      { label: '26日', minutes: 45 },
      { label: '27日', minutes: 30 },
      { label: '28日', minutes: 0 },
      { label: '29日', minutes: 25 },
      { label: '30日', minutes: 35 }
    ]
  }
};

Page({
  data: {
    // 累计专注
    totalCount: 0,
    totalMinutes: 0,
    dailyAverage: 0,
    
    // 当日专注
    currentDate: '',
    dailyCount: 0,
    dailyMinutes: 0,
    
    // 专注分布
    distributionType: 'day', // 'day', 'week', 'month'
    distributionData: [],
    noValidData: false, // 是否没有有效数据
    
    // 界面控制
    loading: true,
    chartLoading: false,
    canvasWidth: 320,
    canvasHeight: 200,
    todayTodoCount: 0, // 新增字段：今日待办日程数
    pieChartData: [
      { label: '学习', value: 120, color: '#FF9F7F', highlight: false, percent: '33%' },  // 珊瑚色
      { label: '工作', value: 90, color: '#FFD666', highlight: false, percent: '25%' },   // 黄色
      { label: '生活', value: 60, color: '#FFAA85', highlight: false, percent: '16%' },   // 浅珊瑚色 
      { label: '运动', value: 45, color: '#FF7F7F', highlight: false, percent: '12%' },   // 浅红色
      { label: '爱好', value: 30, color: '#FFA07A', highlight: false, percent: '8%' },    // 浅鲑鱼色
      { label: '其他', value: 20, color: '#FADEC9', highlight: false, percent: '6%' }     // 浅杏仁色
    ],
  },
  
  onLoad: function() {
    console.log('统计页面加载');
    // 设置当前日期
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    this.setData({
      currentDate: `2025-07-01` // 使用固定测试日期
    });
    
    // 获取屏幕宽度，设置图表宽度
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          canvasWidth: res.windowWidth - 60,
          canvasHeight: 300
        });
      }
    });
    
    // 加载统计数据
    this.loadStatisticsData();
  },
  
  onReady: function() {
    this.drawPieChart();
  },
  
  onShow: function() {
    console.log('统计页面显示');
    // 每次页面显示时刷新数据
    this.loadStatisticsData();
    
    // 确保每次显示页面时重绘饼图
    setTimeout(() => {
      this.drawPieChart();
    }, 500);
  },
  
  // 添加页面滚动事件处理器
  onPageScroll: function() {
    // 页面滚动时可能需要重绘
    if (this._scrollTimer) {
      clearTimeout(this._scrollTimer);
    }
    this._scrollTimer = setTimeout(() => {
      this.drawPieChart();
    }, 200);
  },
  
  // 加载统计数据
  loadStatisticsData: async function() {
    console.log('加载统计数据');
    this.setData({ loading: true });
    try {
      // 获取今日待办日程数
      let todayTodoCount = 0;
      try {
        const res = await wx.cloud.callFunction({
          name: 'todoModel',
          data: {
            $url: 'getTodayTodoCount'
          }
        });
        if (res && res.result && res.result.code === 0) {
          todayTodoCount = res.result.count;
        }
      } catch (err) {
        console.warn('获取今日待办日程数失败', err);
      }
      // 设置今日待办日程数
      this.setData({ todayTodoCount });
      // 兼容原有本地模拟数据
      this.loadMockData();
    } catch (err) {
      console.error('加载统计数据失败', err);
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载本地模拟数据
  loadMockData: function() {
    console.log('加载模拟数据');
    // 设置累计专注数据
    const { totalCount, totalMinutes, dailyAverage } = mockData.totalStats;
    this.setData({ totalCount, totalMinutes, dailyAverage });
    
    // 设置当日专注数据
    const currentDate = this.data.currentDate;
    const dailyData = mockData.dailyStats[currentDate] || { count: 0, minutes: 0 };
    this.setData({
      dailyCount: dailyData.count,
      dailyMinutes: dailyData.minutes
    });
    
    // 设置分布数据
    const distributionType = this.data.distributionType;
    const distributionData = mockData.distribution[distributionType] || [];
    
    // 计算是否所有数据都为0
    const noValidData = distributionData.every(item => !item.minutes);
    
    this.setData({ 
      distributionData,
      noValidData
    });
    
    // 绘制图表
    setTimeout(() => {
      this.drawChartSimple();
    }, 300);
  },
  
  // 简化版图表绘制函数
  drawChartSimple: function() {
    console.log('绘制图表', this.data.distributionType);
    const { distributionData, distributionType, noValidData } = this.data;
    const width = this.data.canvasWidth;
    const height = this.data.canvasHeight;
    const padding = 30;
    
    // 使用Canvas 2D API
    const query = wx.createSelectorQuery();
    query.select('#columnCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res && res[0] && res[0].node) {
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          
          // 设置canvas实际大小
          const dpr = wx.getWindowInfo().pixelRatio;
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
          // 检查是否有数据
          if (!distributionData || distributionData.length === 0 || noValidData) {
            // 没有有效数据，不绘制图表
      return;
    }
    
    // 找出最大值，用于计算高度比例
    let maxValue = 0;
    distributionData.forEach(item => {
      if (item.minutes > maxValue) maxValue = item.minutes;
    });
    
    // 如果最大值为0，设置为10以避免除零错误
    maxValue = maxValue || 10;
    
    // 计算柱状图宽度和间距
    const barCount = distributionData.length;
    const availableWidth = width - 2 * padding;
    const barWidth = Math.min(availableWidth / barCount * 0.6, 30);
    const barSpacing = availableWidth / barCount;
    
    // 绘制坐标轴
    ctx.beginPath();
          ctx.strokeStyle = '#cccccc';
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding); // x轴
    ctx.stroke();
    
    // Y轴
    ctx.beginPath();
          ctx.strokeStyle = '#cccccc';
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();
    
    // 绘制柱状图
    distributionData.forEach((item, index) => {
      const x = padding + index * barSpacing + (barSpacing - barWidth) / 2;
      const barHeight = (item.minutes / maxValue) * (height - 2 * padding - 20);
      const y = height - padding - barHeight;
      
      // 绘制柱子
      ctx.beginPath();
            ctx.fillStyle = '#ff6b6b';
      ctx.rect(x, y, barWidth, barHeight);
      ctx.fill();
      
      // 绘制文本标签（根据不同类型调整显示策略）
      if (distributionType === 'week' || (distributionType === 'day' && barCount <= 12) || 
          (distributionType === 'month' && barCount <= 15)) {
              ctx.font = '10px sans-serif';
              ctx.fillStyle = '#666666';
        const label = item.label;
        const textWidth = ctx.measureText(label).width || 10;
        
        // 优化标签显示位置
        const labelX = Math.max(
          x + (barWidth - textWidth) / 2,
          padding  // 确保不会超出左边界
        );
        ctx.fillText(label, labelX, height - padding + 15);
      }
      
      // 显示数值
      if (item.minutes > 0) {
              ctx.font = '9px sans-serif';
              ctx.fillStyle = '#666666';
        const value = item.minutes.toString();
        const valueWidth = ctx.measureText(value).width || 10;
        const valueX = x + (barWidth - valueWidth) / 2;
        ctx.fillText(value, valueX, y - 5);
      }
    });
    
    // 添加Y轴最大值标签
          ctx.font = '10px sans-serif';
          ctx.fillStyle = '#666666';
    ctx.fillText(maxValue.toString(), padding - 15, padding + 10);
        } else {
          console.error('获取不到canvas节点');
        }
      });
  },
  
  // 获取累计专注统计（保留云函数调用代码，但不实际执行）
  getTotalStats: async function() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'todoModel',
        data: {
          type: 'getPomodoroStats'
        }
      });
      
      if (res && res.result && res.result.code === 0) {
        const { totalCount, totalMinutes, dailyAverage } = res.result.data;
        this.setData({
          totalCount,
          totalMinutes,
          dailyAverage
        });
      }
    } catch (err) {
      console.error('获取累计统计失败', err);
      throw err;
    }
  },
  
  // 获取当日专注统计（保留云函数调用代码，但不实际执行）
  getDailyStats: async function(date) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'todoModel',
        data: {
          type: 'getDailyPomodoroStats',
          date
        }
      });
      
      if (res && res.result && res.result.code === 0) {
        const { count, minutes } = res.result.data;
        this.setData({
          dailyCount: count,
          dailyMinutes: minutes
        });
      }
    } catch (err) {
      console.error('获取当日统计失败', err);
      throw err;
    }
  },
  
  // 获取专注分布（保留云函数调用代码，但不实际执行）
  getDistribution: async function(type) {
    this.setData({ chartLoading: true });
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'todoModel',
        data: {
          type: 'getPomodoroDistribution',
          type
        }
      });
      
      if (res && res.result && res.result.code === 0) {
        const distributionData = res.result.data;
        this.setData({ distributionData });
      }
    } catch (err) {
      console.error('获取分布数据失败', err);
      throw err;
    } finally {
      this.setData({ chartLoading: false });
    }
  },
  
  // 切换分布类型
  switchDistributionType: function(e) {
    const type = e.currentTarget.dataset.type;
    console.log('切换分布类型:', type);
    
    // 如果已经是当前选中的类型，不做处理
    if (type === this.data.distributionType) {
      return;
    }
    
    // 更新状态
    this.setData({ 
      distributionType: type,
      chartLoading: true
    });
    
    // 更新分布数据
    const distributionData = mockData.distribution[type] || [];
    
    // 计算是否所有数据都为0
    const noValidData = distributionData.every(item => !item.minutes);
    
    this.setData({ 
      distributionData,
      noValidData
    });
    
    // 重新绘制图表
    setTimeout(() => {
      this.drawChartSimple();
      this.setData({ chartLoading: false });
    }, 200);
  },
  
  // 切换日期
  changeDate: function(e) {
    const direction = e.currentTarget.dataset.direction;
    const currentDate = new Date(this.data.currentDate);
    
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (direction === 'next') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 不能选择未来日期
      if (currentDate.getTime() >= today.getTime()) {
        return;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    const dateString = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
    
    this.setData({ currentDate: dateString });
    
    // 使用本地模拟数据
    const dailyData = mockData.dailyStats[dateString] || { count: 0, minutes: 0 };
    this.setData({
      dailyCount: dailyData.count,
      dailyMinutes: dailyData.minutes
    });
  },
  
  // 分享功能
  shareFocusData: function() {
    wx.showToast({
      title: '分享功能暂未实现',
      icon: 'none'
    });
  },
  
  // 查看专注记录列表
  viewFocusRecords: function() {
    wx.showToast({
      title: '该功能暂未实现',
      icon: 'none'
    });
  },
  
  // 完全重写drawPieChart方法，兼容新版与旧版canvas
  drawPieChart: function() {
    const that = this;
    try {
      // 优化数据，将较小的值合并为"其他"类别，以避免图例过多
      const pieData = this.optimizePieData(this.data.pieChartData);
      this.setData({ pieChartData: pieData });
      
      // 原有的绘图逻辑
      const query = wx.createSelectorQuery();
      query.select('#pieCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res && res[0] && res[0].node) {
            // 新版canvas
            console.log('使用新版Canvas 2D API绘制饼图');
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            
            // 设置canvas实际大小为正方形
            const size = 300;
            const dpr = wx.getWindowInfo().pixelRatio;
            canvas.width = size * dpr;
            canvas.height = size * dpr;
            ctx.scale(dpr, dpr);
            
            // 绘制饼图
            that._drawPieChartWithContext(ctx, size, size);
          } else {
            // 尝试使用旧版接口
            console.log('使用旧版Canvas API绘制饼图');
            const ctx = wx.createCanvasContext('pieCanvas', that);
            that._drawPieChartWithLegacyContext(ctx);
          }
        });
    } catch (e) {
      console.error('绘制饼图失败：', e);
      // 最后的备选方案：使用旧接口
      try {
        const ctx = wx.createCanvasContext('pieCanvas', this);
        this._drawPieChartWithLegacyContext(ctx);
      } catch (err) {
        console.error('备选绘制饼图也失败了：', err);
        // 显示错误提示
        wx.showToast({
          title: '图表绘制失败',
          icon: 'none'
        });
      }
    }
  },

  // 点击图例突出显示对应扇区
  highlightPieSlice: function(e) {
    const index = e.currentTarget.dataset.index;
    let pieData = [...this.data.pieChartData];
    
    // 如果当前点击项已经是高亮，则取消高亮
    if (pieData[index].highlight) {
      pieData[index].highlight = false;
      this.setData({ pieChartData: pieData });
      setTimeout(() => {
        this.drawPieChart();
      }, 50);
      return;
    }
    
    // 重置所有高亮状态
    pieData = pieData.map(item => {
      return { ...item, highlight: false };
    });
    
    // 设置当前点击项的高亮状态
    pieData[index].highlight = true;
    
    this.setData({ pieChartData: pieData });
    
    // 重绘饼图
    setTimeout(() => {
      this.drawPieChart();
    }, 50);
  },
  
  // 使用新版context绘制饼图
  _drawPieChartWithContext: function(ctx, canvasWidth, canvasHeight) {
    const data = this.data.pieChartData;
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    // 调整为正方形区域
    const size = Math.min(canvasWidth, canvasHeight);
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4; // 调整饼图大小
    const innerRadius = radius * 0.5; // 增大内圈比例，使甜甜圈更窄
    
    // 计算每项的百分比
    data.forEach(item => {
      const percent = Math.round((item.value / total) * 100);
      item.percent = percent + '%';
    });
    
    // 清空整个画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // 绘制白色底圆
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2, false);
    ctx.fillStyle = '#f5f5f5'; // 非常淡的灰色作为底色
    ctx.fill();
    
    // 设置阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;
    
    let startAngle = -0.5 * Math.PI; // 从顶部开始绘制
    
    // 绘制饼图扇形
    data.forEach((item, index) => {
      if (!item.value) return; // 跳过数值为0的项
      
      const angle = (item.value / total) * 2 * Math.PI;
      const endAngle = startAngle + angle;
      const midAngle = startAngle + angle / 2;
      
      // 设置高亮偏移（减小偏移量）
      let offsetX = 0, offsetY = 0;
      if (item.highlight) {
        offsetX = Math.cos(midAngle) * 5;
        offsetY = Math.sin(midAngle) * 5;
      }
      
      // 开始绘制扇形
      ctx.beginPath();
      
      // 绘制圆环扇形（甜甜圈效果）
      ctx.arc(centerX + offsetX, centerY + offsetY, radius, startAngle, endAngle, false);
      ctx.arc(centerX + offsetX, centerY + offsetY, innerRadius, endAngle, startAngle, true);
      
      ctx.closePath();
      
      // 填充颜色
      ctx.fillStyle = item.color;
      ctx.fill();
      
      // 如果是高亮项，添加边缘描边
      if (item.highlight) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // 添加标签 - 放在圆环中间而不是扇形内部
      const labelRadius = (innerRadius + radius) / 2;
      const x = centerX + offsetX + labelRadius * Math.cos(midAngle);
      const y = centerY + offsetY + labelRadius * Math.sin(midAngle);
      
      // 添加百分比标签
      if (angle > 0.15) { // 只为较大的扇形添加标签
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.percent, x, y);
      }
      
      startAngle = endAngle;
    });
    
    // 绘制中心圆
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius - 1, 0, Math.PI * 2, false);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'transparent'; // 清除阴影
    ctx.fill();
    
    // 更新图例中的百分比
    this.setData({ pieChartData: data });
  },

  // 使用旧版context绘制饼图 - 保持一致的绘制方法和颜色
  _drawPieChartWithLegacyContext: function(ctx) {
    const data = this.data.pieChartData;
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const centerX = 150; 
    const centerY = 150;
    const radius = 110; // 增大半径，确保饼图更圆
    const innerRadius = radius * 0.5; // 内圆半径
    
    // 计算每项的百分比
    data.forEach(item => {
      const percent = Math.round((item.value / total) * 100);
      item.percent = percent + '%';
    });
    
    // 清空画布
    ctx.clearRect(0, 0, 300, 300);
    
    // 绘制白色底圆
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2, false);
    ctx.setFillStyle('#f5f5f5');
    ctx.fill();
    
    // 设置阴影
    ctx.setShadow(0, 3, 12, 'rgba(0, 0, 0, 0.08)');
    
    let startAngle = -0.5 * Math.PI; // 从顶部开始绘制
    
    // 绘制饼图扇形
    data.forEach((item, index) => {
      if (!item.value) return; // 跳过数值为0的项
      
      const angle = (item.value / total) * 2 * Math.PI;
      const endAngle = startAngle + angle;
      const midAngle = startAngle + angle / 2;
      
      // 设置高亮偏移（减小偏移量）
      let offsetX = 0, offsetY = 0;
      if (item.highlight) {
        offsetX = Math.cos(midAngle) * 5;
        offsetY = Math.sin(midAngle) * 5;
      }
      
      // 开始绘制外圆弧
      ctx.beginPath();
      ctx.arc(centerX + offsetX, centerY + offsetY, radius, startAngle, endAngle, false);
      // 绘制内圆弧
      ctx.arc(centerX + offsetX, centerY + offsetY, innerRadius, endAngle, startAngle, true);
      
      ctx.closePath();
      
      // 填充颜色
      ctx.setFillStyle(item.color);
      ctx.fill();
      
      // 如果是高亮项，添加边缘描边
      if (item.highlight) {
        ctx.setStrokeStyle('#fff');
        ctx.setLineWidth(1);
        ctx.stroke();
      }
      
      // 添加标签
      const labelRadius = (innerRadius + radius) / 2;
      const x = centerX + offsetX + labelRadius * Math.cos(midAngle);
      const y = centerY + offsetY + labelRadius * Math.sin(midAngle);
      
      // 添加百分比标签
      if (angle > 0.15) { // 只为较大的扇形添加标签
        ctx.setFillStyle('#fff');
        ctx.setFontSize(14);
        ctx.setTextAlign('center');
        ctx.setTextBaseline('middle');
        ctx.fillText(item.percent, x, y);
      }
      
      startAngle = endAngle;
    });
    
    // 绘制中心圆
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius - 1, 0, Math.PI * 2, false);
    ctx.setFillStyle('#ffffff');
    ctx.setShadow(0, 0, 0, 'transparent'); // 清除阴影
    ctx.fill();
    
    // 更新图例中的百分比
    this.setData({ pieChartData: data });
    
    // 绘制
    ctx.draw();
  },

  // 优化饼图数据，确保颜色和排序一致
  optimizePieData: function(originalData) {
    // 按值从大到小排序
    const sortedData = [...originalData].sort((a, b) => b.value - a.value);
    
    // 重新赋予预定义的颜色，确保一致性
    const colors = ['#FF9F7F', '#FFD666', '#FFAA85', '#FF7F7F', '#FFA07A', '#FADEC9'];
    
    sortedData.forEach((item, index) => {
      if (index < colors.length) {
        item.color = colors[index];
      }
    });
    
    return sortedData;
  },
}) 