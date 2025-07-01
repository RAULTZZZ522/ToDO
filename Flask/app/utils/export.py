import pandas as pd
import io
from flask import send_file
from datetime import datetime

def export_to_csv(data, filename=None):
    """
    将数据导出为CSV文件
    
    Args:
        data: 要导出的数据，通常是字典列表
        filename: 导出文件名，不含扩展名，默认为当前时间戳
        
    Returns:
        flask的send_file响应，包含CSV文件
    """
    # 如果未指定文件名，使用当前时间戳
    if not filename:
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        filename = f"export_{timestamp}"
    
    # 确保文件名以.csv结尾
    if not filename.endswith('.csv'):
        filename = f"{filename}.csv"
    
    # 转换为DataFrame并导出为CSV
    df = pd.DataFrame(data)
    output = io.BytesIO()
    df.to_csv(output, index=False, encoding='utf-8-sig')  # 使用带BOM的UTF-8编码，解决Excel中文乱码问题
    output.seek(0)
    
    return send_file(
        output,
        mimetype='text/csv',
        as_attachment=True,
        download_name=filename
    )

def export_to_excel(data, filename=None, sheet_name='Sheet1'):
    """
    将数据导出为Excel文件
    
    Args:
        data: 要导出的数据，通常是字典列表
        filename: 导出文件名，不含扩展名，默认为当前时间戳
        sheet_name: Excel表格的sheet名称，默认为'Sheet1'
        
    Returns:
        flask的send_file响应，包含Excel文件
    """
    # 如果未指定文件名，使用当前时间戳
    if not filename:
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        filename = f"export_{timestamp}"
    
    # 确保文件名以.xlsx结尾
    if not filename.endswith('.xlsx'):
        filename = f"{filename}.xlsx"
    
    # 转换为DataFrame并导出为Excel
    df = pd.DataFrame(data)
    output = io.BytesIO()
    df.to_excel(output, index=False, sheet_name=sheet_name)
    output.seek(0)
    
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=filename
    ) 