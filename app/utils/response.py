# utils/response.py
from flask import jsonify

def json_response(data=None, error=None, status=200):
    return jsonify({"data": data, "error": error}), status