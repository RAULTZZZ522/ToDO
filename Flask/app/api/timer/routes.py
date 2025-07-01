from . import timer_bp
from ...utils.response import success_response
from ...utils.auth import jwt_required

@timer_bp.route('/timer/start', methods=['POST'])
@jwt_required
def start_timer():
    """
    番茄钟模块占位函数 - 开始计时
    实际实现将在后续开发中完成
    """
    return success_response({}, "番茄钟功能开发中") 