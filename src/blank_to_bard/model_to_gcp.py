from google.cloud import aiplatform

# Provide your bucket name and file name
bucket_name = 'blank-to-bard-models'
model_path = 'binary_classifier'

# Define your project ID and model name
project_id = 'nodal-magnet-392617'
model_name = 'blank-to-bard-classifier'
container_image_uri = 'europe-west4-docker.pkg.dev/nodal-magnet-392617/deanis/blanktobard-classifier:latest'
location = 'europe-west4'   
artifact_uri = f'gs://{bucket_name}/{model_path}' 

def import_model(project_id, location, model_display_name, serving_container_image_uri, artifact_uri):
    client = aiplatform.gapic.ModelServiceClient(client_options={"api_endpoint": f"{location}-aiplatform.googleapis.com"})

    model = {
        "display_name": model_display_name,
        #"metadata_schema_uri": "gs://google-cloud-aiplatform/schema/trainingjob/definition/custom_task_1.0.0.yaml",
        "artifact_uri": artifact_uri,
        "container_spec": {
            "image_uri": serving_container_image_uri,
            "command": [],
            "args": [],
            "env": [],
            "ports": [{"container_port": 8080}],
            "predict_route": "/predict",
            "health_route": "/health",
        },
    }

    parent = f"projects/{project_id}/locations/{location}"
    response = client.upload_model(parent=parent, model=model)
    model_id = response.result().model.name.split('/')[-1]

    return model_id

import_model(
    project_id=project_id, 
    location=location, 
    model_display_name=model_name, 
    serving_container_image_uri=container_image_uri, 
    artifact_uri=artifact_uri
)


