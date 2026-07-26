# -*- coding: utf-8 -*-
"""ai_config.py — Configuration des fournisseurs IA (Gemini/Groq), partagée
entre main.py (endpoint /health) et routers/chat.py."""

import os

GEMINI_KEY = os.getenv("GEMINI_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
GROQ_KEY = os.getenv("GROQ_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
