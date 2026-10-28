"""Configuración de la aplicación FastAPI."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import all_routers

DESCRIPTION = """
API REST de **VetCare**, sistema de gestión para una clínica veterinaria pequeña.

### Autenticación
Casi todos los endpoints requieren un token JWT. Obténgalo en
`POST /api/auth/login` con un usuario del seed y envíalo como:

```
Authorization: Bearer <access_token>
```

### Roles
- `admin`: control total, incluida la desactivación de veterinarios.
- `receptionist`: operación diaria (citas, propietarios, mascotas, historias).
"""

app = FastAPI(
    title="VetCare API",
    description=DESCRIPTION,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in all_routers:
    app.include_router(router, prefix="/api")


@app.get("/", tags=["Health"], summary="Raíz de la API")
def root():
    return {"name": "VetCare API", "version": "1.0.0", "docs": "/docs"}


@app.get("/api/health", tags=["Health"], summary="Estado del servicio")
def health():
    return {"status": "ok"}