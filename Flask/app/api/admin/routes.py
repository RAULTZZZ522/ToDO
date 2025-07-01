from . import admin_bp
from ...utils.response import success_response
from ...utils.auth import admin_required

@admin_bp.route('/admin/users', methods=['GET'])
@admin_required
def get_users():
    """
    管理员模块占位函数 - 获取所有用户
    实际实现将在后续开发中完成
    """
    return success_response([], "管理员功能开发中") 