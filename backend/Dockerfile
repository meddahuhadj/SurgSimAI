FROM python:3.11-slim-bookworm

WORKDIR /app

# libgl1-mesa-glx/libglib2.0-0 : requis par les dépendances OpenCV de
# TotalSegmentator/nnU-Net ; git/build-essential : requis pour compiler
# certaines roues de ces mêmes dépendances.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev gcc git \
    libgl1-mesa-glx libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# requirements-segmentation.txt : TotalSegmentator/dicom2nifti, installés sans
# fallback pour que la segmentation soit réelle par défaut (voir Dockerfile racine).
COPY requirements.txt requirements-segmentation.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r requirements-segmentation.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "alembic -c migrations/alembic.ini upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000"]
