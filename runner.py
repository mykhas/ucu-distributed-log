import requests
import json
import time

CHILDREN = ['http://localhost:9001', 'http://localhost:9002']

def post_primary(data):    
    start = time.time()
    response = requests.post(
        'http://localhost:9000',
        data=json.dumps(data),
        headers={
            'Content-Type': 'application/json'
        }
    )
    print([response, time.time() - start])

def switch_secondary(index, off = False):
    start = time.time()
    response = requests.patch(
        CHILDREN[index],
        data=json.dumps({ 'off': off }),
        headers={
            'Content-Type': 'application/json'
        }
    )
    print([response, time.time() - start])


switch_secondary(1, True)
post_primary({ 'message': 'Hello', 'w': 2 })
switch_secondary(1, False)
post_primary({ 'message': 'World', 'w': 3 })

