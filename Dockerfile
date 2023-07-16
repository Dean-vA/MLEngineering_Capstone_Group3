FROM nvidia/cuda:11.2.2-base-ubuntu20.04

WORKDIR /app

# Install dependencies
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    python3.9 \
    python3-pip

# Create a symbolic link for Python
RUN ln -s /usr/bin/python3.9 /usr/bin/python

# Install poetry and dependencies
RUN pip install poetry
RUN poetry config virtualenvs.create false

COPY . /app

RUN poetry install --no-dev
RUN pip install -U openai-whisper

ENV PYTHONUNBUFFERED=TRUE

CMD ["poetry", "run", "uvicorn", "blank-to-bard.stt:app", "--host", "0.0.0.0", "--port", "8000"]
