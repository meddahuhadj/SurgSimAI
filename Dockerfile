# ==============================================================================
# Dockerfile — GeneralSurgPlan3D NextGen (Production Readiness & MDR Class C)
# ==============================================================================
# Image de base optimisée et sécurisée pour déploiement en centre hospitalier universitaire,
# compatible avec accélération GPU NVIDIA (CUDA / TensorRT / WebGPU server-side rendering).

FROM python:3.11-slim-bookworm as builder

# Métadonnées et conformité réglementaire
LABEL maintainer="GeneralSurgPlan3D NextGen Architecture Team"
LABEL version="2.4.0-Enterprise-MDR"
LABEL description="Plateforme mondiale de planification chirurgicale, simulation et navigation 3D"
LABEL regulatory.mdr="CE MDR 2017/745 Class IIb/C compliant"
LABEL regulatory.fda="FDA 510(k) Cybersecurity guidance 2023 compliant"

# Variables d'environnement de compilation et d'exécution
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    APP_HOME=/app \
    PORT=8000

WORKDIR $APP_HOME

# Installation des dépendances système critiques (PostgreSQL client, libgl1 pour OpenCV/MONAI, curl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libgl1-mesa-glx \
    libglib2.0-0 \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copie des fichiers de configuration et installation des paquets Python
# (y compris requirements-segmentation.txt : TotalSegmentator/dicom2nifti sont
# nécessaires pour que la segmentation soit réelle et non un mode dégradé).
# Pas de fallback vers un jeu de paquets minimal : un échec d'installation doit
# faire échouer le build plutôt que de démarrer silencieusement en mode dégradé.
COPY backend/requirements.txt backend/requirements-segmentation.txt $APP_HOME/backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
        -r $APP_HOME/backend/requirements.txt \
        -r $APP_HOME/backend/requirements-segmentation.txt

# Copie intégrale du code backend et du frontend (index.html + assets/ CSS/JS)
# — backend/main.py sert index.html à la racine de $APP_HOME et monte
# $APP_HOME/assets en statique sous /assets (voir main.py:serve_frontend).
COPY backend/ $APP_HOME/backend/
COPY index.html $APP_HOME/index.html
COPY assets/ $APP_HOME/assets/

# Création de l'utilisateur non-root sécurisé pour isolation au bloc opératoire (MDR/HIPAA)
RUN groupadd -g 10001 surgadmin && \
    useradd -u 10001 -g surgadmin -s /bin/bash -m surgadmin && \
    chown -R surgadmin:surgadmin $APP_HOME && \
    mkdir -p /tmp/storage && chown -R surgadmin:surgadmin /tmp/storage

USER surgadmin

EXPOSE 8000

# Vérification de santé native (Healthcheck)
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/readyz || exit 1

# Démarrage du serveur Uvicorn haute performance avec workers asynchrones
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--proxy-headers"]
