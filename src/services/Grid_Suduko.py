import json

with open('matrix_3x3.json', 'r') as f:
    data = json.load(f)

matrix = data['matrix']   # list of lists
size = data['size']