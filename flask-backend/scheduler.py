from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import atexit

from app import create_app, db
from app.models.todo import Todo

app = create_app('production')

def daily_reset():
    """每日重置任务，将所有已完成的待办重置为未完成，重置番茄钟计数"""
    with app.app_context():
        app.logger.info("开始执行每日重置任务")
        try:
            # 重置所有已完成的待办为未完成
            completed_count = Todo.query.filter_by(completed=True).update({'completed': False})
            
            # 重置所有待办的番茄钟计数
            tomato_count = Todo.query.update({'tomato_count': 0})
            
            db.session.commit()
            app.logger.info(f"每日重置任务完成: 重置了 {completed_count} 个已完成待办, {tomato_count} 个番茄钟计数")
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"每日重置任务失败: {str(e)}")

def init_scheduler():
    """初始化定时任务调度器"""
    scheduler = BackgroundScheduler()
    
    # 设置每天凌晨0点执行的任务
    scheduler.add_job(
        daily_reset,
        trigger=CronTrigger(hour=0, minute=0),
        id='daily_reset_job',
        replace_existing=True
    )
    
    # 启动调度器
    scheduler.start()
    app.logger.info("定时任务调度器已启动")
    
    # 确保在应用退出时关闭调度器
    atexit.register(lambda: scheduler.shutdown())

if __name__ == '__main__':
    init_scheduler()
    app.run() 