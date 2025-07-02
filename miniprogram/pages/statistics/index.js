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
    
    // 界面控制
    loading: true,
    chartLoading: false,
    canvasWidth: 320,
    canvasHeight: 200,
    tabIndex: 0
  },
  
  onLoad: function() {
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
          canvasWidth: res.windowWidth - 40,
        });
      }
    });
    
    // 加载统计数据
    this.loadStatisticsData();
  },
  
  onShow: function() {
    // 每次页面显示时刷新数据
    this.loadStatisticsData();
  },
  
  // 加载统计数据
  loadStatisticsData: async function() {
    this.setData({ loading: true });
    
    try {
      // 直接使用本地模拟数据
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
    this.setData({ distributionData });
    
    // 绘制图表
    setTimeout(() => {
      this.drawChartSimple();
    }, 300);
  },
  
  // 简化版图表绘制函数
  drawChartSimple: function() {
    const { distributionData } = this.data;
    const ctx = wx.createCanvasContext('columnCanvas');
    const width = this.data.canvasWidth;
    const height = this.data.canvasHeight;
    const padding = 30;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    if (!distributionData || distributionData.length === 0) {
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
    ctx.setStrokeStyle('#cccccc');
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding); // x轴
    ctx.stroke();
    
    // 绘制柱状图
    distributionData.forEach((item, index) => {
      const x = padding + index * barSpacing + (barSpacing - barWidth) / 2;
      const barHeight = (item.minutes / maxValue) * (height - 2 * padding - 20);
      const y = height - padding - barHeight;
      
      // 绘制柱子
      ctx.beginPath();
      ctx.setFillStyle('#ff6b6b');
      ctx.rect(x, y, barWidth, barHeight);
      ctx.fill();
      
      // 绘制文本标签（如果空间足够）
      if (barCount < 12 || distributionType === 'week') {
        ctx.setFontSize(10);
        ctx.setFillStyle('#666666');
        const label = item.label;
        const textWidth = ctx.measureText(label).width;
        ctx.fillText(label, x + (barWidth - textWidth) / 2, height - padding + 15);
      }
    });
    
    // 绘制
    ctx.draw();
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
    this.setData({ 
      distributionType: type,
      tabIndex: e.currentTarget.dataset.index
    });
    
    // 更新分布数据
    const distributionData = mockData.distribution[type] || [];
    this.setData({ distributionData });
    
    // 重新绘制图表
    setTimeout(() => {
      this.drawChartSimple();
    }, 100);
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
  }
}) 