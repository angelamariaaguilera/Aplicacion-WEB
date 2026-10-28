# VetCare · Backend

API REST con FastAPI y PostgreSQL. SQL escrito a mano con **psycopg 3**, sin ORM.

## Configuración

```bash
cp .env.example .env
```

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vetcare_db
SECRET_KEY=una-clave-larga-y-aleatoria
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173
ALGORITHM=HS256
```

## Ejecución

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- API: <http://localhost:8000>
- Swagger: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>

## Estructura

```
app/
├── main.py            FastAPI + CORS + routers
├── core/
│   ├── config.py      Settings (pydantic-settings)
│   ├── security.py    hash bcrypt + creación/lectura de JWT
│   └── dependencies.py get_db, get_current_user, require_admin
├── database/
│   ├── connection.py  psycopg.connect(..., row_factory=dict_row)
│   └── helpers.py     404/409/400 + traducción de errores de PostgreSQL
├── schemas/           Modelos Pydantic Create / Update / Response
├── routers/           Endpoints HTTP agrupados por tag
└── services/          Lógica de negocio y SQL
```

**Regla de las capas:** los routers manejan HTTP, los services deciden, la capa
`database` conecta y traduce errores. Un router nunca escribe SQL.

## Autenticación

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vetcare.com","password":"admin123"}'
```

El resto de endpoints requiere:

```
Authorization: Bearer <access_token>
```

## Generar un hash de contraseña

```bash
source venv/bin/activate
python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('mi_clave'))"
```

## Comprobar la conexión

```bash
python -c "from app.database.connection import test_connection; print(test_connection())"
```

## Notas de seguridad

- Todo el SQL usa parámetros `%s`; no hay concatenación de datos en consultas.
- Las contraseñas se guardan hasheadas con bcrypt.
- `SECRET_KEY` y `.env` nunca se suben a Git (ver `.gitignore`).
- Los errores internos de PostgreSQL no llegan al frontend.