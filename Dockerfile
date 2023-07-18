#tensorflow gpu image
FROM tensorflow/tensorflow:latest-gpu

RUN pip install fastapi
RUN pip install uvicorn
RUN pip install python-multipart
RUN pip install transformers google-cloud-storage google-cloud-aiplatform docker
RUN pip install numpy


ENV PYTHONUNBUFFERED=TRUE

EXPOSE 8080

COPY ./src /app
WORKDIR /app

CMD ["uvicorn", "blank_to_bard.classifier_app:app", "--host", "0.0.0.0", "--port", "8080"]
