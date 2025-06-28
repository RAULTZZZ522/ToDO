// todo对象（日程）
// {
//   _id: String,           // 唯一标识
//   content: String,       // 日程内容
//   createTime: Date,      // 创建时间
//   completed: Boolean,    // 是否完成
//   completedCount: Number,// 完成次数
//   importance: Number,    // 重要性等级
//   collection: String,    // 所属分类
//   remindTime: Date,      // 提醒时间
//   type: String,          // 日程类型
//   aimId: String,         // 所属目标id（可选）
//   setTimeId: String      // 关联计时id（可选）
// }

// aim对象（目标）
// {
//   _id: String,           // 唯一标识
//   name: String,          // 目标名
//   todoIds: Array,        // 关联的todo id数组
//   createTime: Date,      // 创建时间
//   description: String    // 目标描述（可选）
// }

// settime对象（计时）
// {
//   _id: String,           // 唯一标识
//   todoId: String,        // 关联的todo id
//   startTime: Date,       // 开始时间
//   endTime: Date,         // 结束时间
//   duration: Number       // 持续时长（秒）
// } 