from . import statistics_bp
from ...utils.response import success_response
from ...utils.auth import jwt_required

@statistics_bp.route('/statistics/overview', methods=['GET'])
@jwt_required
def get_statistics_overview():
    """
    统计模块占位函数 - 获取统计概览
    实际实现将在后续开发中完成
    """
    return success_response({}, "统计功能开发中") 