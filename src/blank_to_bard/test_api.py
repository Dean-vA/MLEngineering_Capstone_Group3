# # main.py

# from fastapi import FastAPI

# app = FastAPI()

# @app.post("/reverse_string/")
# async def reverse_string(input_string: str):
#     return {"reversed_string": input_string[::-1]}

# main.py

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    input_string: str

@app.post("/reverse_string/")
async def reverse_string(item: Item):
    data = {
        'instances': [{'text': item.input_string}],
    }

    print('incoming request: ', data)
    return {"reversed_string": item.input_string[::-1]}

