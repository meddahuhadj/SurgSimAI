# -*- coding: utf-8 -*-
"""
conftest.py — permet `from backend.main import app` de fonctionner depuis la racine du dépôt.

`backend/main.py` importe ses propres modules avec des chemins relatifs à `backend/`
(ex. `from db import get_db`, cohérent avec le mode d'exécution documenté
`cd backend && uvicorn main:app`). Pour que les tests situés dans `tests/` (à la racine,
hors de `backend/`) puissent importer `backend.main` sans dupliquer le serveur, on ajoute
`backend/` à `sys.path` avant la collecte des tests.
"""

import sys
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))
