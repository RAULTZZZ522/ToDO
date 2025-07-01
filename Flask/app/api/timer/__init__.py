from flask import Blueprint

timer_bp = Blueprint('timer', __name__)

from . import routes 