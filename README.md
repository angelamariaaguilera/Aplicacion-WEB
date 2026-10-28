# VetCare

Sistema web de gestión para una clínica veterinaria pequeña.

VetCare permite gestionar propietarios, mascotas, veterinarios, servicios, citas
e historias clínicas, con autenticación básica para administradores y
recepcionistas, y un dashboard con el resumen de la actividad de la clínica.

---

## 1. ¿Qué es VetCare?

Es un sistema CRUD completo con dos capas separadas:

- **Backend REST** con FastAPI y PostgreSQL (SQL escrito a mano, sin ORM).
- **Frontend SPA** con React y CSS nativo.

El flujo principal que se puede demostrar es:

```
Usuario inicia sesión
        ↓
Registra propietario → registra mascota
        ↓
Registra veterinario → elige servicio
        ↓
Agenda cita
        ↓
Veterinario atiende la mascota
        ↓
Registra historia clínica
        ↓
La cita queda completada y aparece en el historial de la mascota
```

---

## 2. Tecnologías

### Frontend

| Tecnología | Uso |
|---|---|
| React 18 + JavaScript | Interfaz (sin TypeScript) |
| Vite 6 | Bundler y servidor de desarrollo |
| React Router DOM 6 | Navegación y rutas protegidas |
| CSS nativo | Estilos (sin Tailwind, Bootstrap ni librerías UI) |
| Lucide React | Íconos |
| Context API | Autenticación (sin Redux) |

### Backend

| Tecnología | Uso |
|---|---|
| Python 3.10+ | Lenguaje |
| FastAPI | Framework REST + documentación OpenAPI |
| Uvicorn | Servidor ASGI |
| psycopg 3 | Driver de PostgreSQL (sin SQLAlchemy) |
| Pydantic v2 | Validación de datos |
| pydantic-settings | Configuración por variables de entorno |
| python-jose | Tokens JWT |
| passlib + bcrypt | Hash de contraseñas |

### Base de datos

- PostgreSQL
- SQL escrito manualmente, con JOINs, índices, constraints y una función
  `set_updated_at()` que actualiza `updated_at` automáticamente.

---

## 3. Arquitectura

El backend sigue una separación simple en tres capas:

```
Routers   -> manejan HTTP (rutas, códigos de estado, parámetros)
Services  -> contienen la lógica de negocio y el SQL
Database  -> conexión y utilidades reutilizables
```

Las dependencias siempre apuntan hacia adentro:

```
HTTP request
     ↓
app/routers/          # validación de entrada con Pydantic
     ↓
app/services/         # reglas de negocio + SQL con parámetros seguros
     ↓
app/database/         # conexión psycopg (dict_row), helpers de errores
     ↓
PostgreSQL
```

En el frontend no hay capa de estado global: `useState` + `useEffect` en cada
página, Context API sólo para la autenticación, y dos hooks reutilizables
(`useApiResource`, `useDebouncedValue`) para evitar duplicación.

---

## 4. Requisitos

- Python 3.10 o superior
- Node.js 18 o superior
- PostgreSQL 13 o superior

---

## 5. Crear la base de datos PostgreSQL

### Opción recomendada — Supabase (sin instalar PostgreSQL)

1. Crea un proyecto en [supabase.com](https://supabase.com) y guarda la
   *Database Password*.
2. En el panel: **Connect → Connection string → URI → Session pooler** y copia
   la URI.
3. Configura `backend/.env` (ver sección 8) con esa URI en `DATABASE_URL` y
   `DATABASE_SSLMODE=require`.
4. Con el venv activo (sección 9), crea las tablas y los datos demo:

   ```bash
   cd backend
   python -m scripts.init_db --check   # prueba la conexión
   python -m scripts.init_db           # schema.sql + seed.sql
   ```

   Esto reemplaza las secciones 6 y 7. Alternativa: pegar `schema.sql` y luego
   `seed.sql` en el **SQL Editor** de Supabase.

`schema.sql` activa Row Level Security en todas las tablas para que la API REST
pública de Supabase (anon key) no pueda leerlas; el backend no se ve afectado.

### Opción A — con psql

```bash
# Entrar como superusuario
psql -U postgres

# Crear la base de datos
CREATE DATABASE vetcare_db;
```

### Opción B — desde la terminal de macOS (Homebrew)

```bash
brew services start postgresql@14
createdb -U postgres vetcare_db
```

---

## 6. Ejecutar `schema.sql`

Desde la raíz del proyecto:

```bash
psql -U postgres -d vetcare_db -f database/schema.sql
```

Crea las 7 tablas, la función `set_updated_at()`, los triggers, los CHECK, los
índices y el índice único que impide duplicar el horario de un veterinario.

> El script hace `DROP TABLE IF EXISTS ... CASCADE` al inicio, así que
> **borra los datos existentes** si lo ejecutas de nuevo.

---

## 7. Ejecutar `seed.sql`

```bash
psql -U postgres -d vetcare_db -f database/seed.sql
```

Inserta datos demo: 2 usuarios, 3 propietarios, 4 mascotas, 2 veterinarios,
5 servicios, 9 citas y 5 historias clínicas.

Las citas del seed usan `CURRENT_DATE`, así que siempre habrá citas "hoy" y
"próximas" sin importar cuándo ejecutes el proyecto.

---

## 8. Configurar el backend

```bash
cd backend
cp .env.example .env
```

Edita `backend/.env` con tus credenciales reales:

```env
# Supabase (Session pooler)
DATABASE_URL=postgresql://postgres.TU_PROJECT_REF:TU_PASSWORD@aws-0-TU_REGION.pooler.supabase.com:5432/postgres
DATABASE_SSLMODE=require
# PostgreSQL local:
# DATABASE_URL=postgresql://postgres:tu_clave@localhost:5432/vetcare_db
SECRET_KEY=una-clave-larga-y-aleatoria-cambia-esto
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ALGORITHM=HS256
```

Para generar una `SECRET_KEY` aleatoria:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 9. Entorno virtual e instalación

```bash
cd backend

python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

---

## 10. Ejecutar FastAPI

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

Queda disponible en:

- API: <http://localhost:8000>
- Documentación Swagger: <http://localhost:8000/docs>
- Documentación ReDoc: <http://localhost:8000/redoc>

---

## 11. Configurar el frontend

```bash
cd frontend
cp .env.example .env
```

Contenido de `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

---

## 12. Ejecutar React

```bash
cd frontend
npm install
npm run dev
```

Queda disponible en <http://localhost:5173>.

---

## 13. Credenciales de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@vetcare.com` | `admin123` |
| Recepcionista | `recepcion@vetcare.com` | `recepcion123` |

Las contraseñas están almacenadas como hashes bcrypt. Para generar el hash de
una contraseña nueva:

```bash
cd backend
source venv/bin/activate
python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('mi_clave'))"
```

---

## 14. Rutas importantes

### Frontend

| Ruta | Descripción |
|---|---|
| `/login` | Inicio de sesión |
| `/` | Dashboard con métricas, próximas citas y actividad reciente |
| `/owners` | Listado, búsqueda, alta y edición de propietarios |
| `/pets` | Mascotas en tarjetas, con filtro por propietario |
| `/pets/:id` | Ficha de la mascota: datos, propietario, próximas citas e historial médico |
| `/appointments` | Agenda con filtros por fecha, estado y veterinario |
| `/veterinarians` | Equipo médico (activar/desactivar) |
| `/services` | Catálogo de servicios y precios |
| `/medical-records` | Historial clínico de la clínica |

### Backend

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Iniciar sesión (devuelve JWT) |
| `GET` | `/api/auth/me` | Perfil del usuario autenticado |
| `GET` `POST` | `/api/owners` | Listar (con `?search=`) y crear |
| `GET` `PUT` `DELETE` | `/api/owners/{id}` | Ver, actualizar y eliminar |
| `GET` `POST` | `/api/pets` | Listar (con `?owner_id=` y `?search=`) y crear |
| `GET` `PUT` `DELETE` | `/api/pets/{id}` | Ver, actualizar y eliminar |
| `GET` | `/api/pets/{id}/medical-records` | Historial médico de la mascota |
| `GET` `POST` | `/api/veterinarians` | Listar (con `?only_active=`) y crear |
| `GET` `PUT` | `/api/veterinarians/{id}` | Ver y actualizar |
| `DELETE` | `/api/veterinarians/{id}` | Desactivar (`is_active = false`) |
| `GET` `POST` | `/api/services` | Listar y crear |
| `GET` `PUT` | `/api/services/{id}` | Ver y actualizar |
| `GET` `POST` | `/api/appointments` | Listar (filtros `?date=`, `?status=`, `?veterinarian_id=`) y crear |
| `GET` `PUT` `DELETE` | `/api/appointments/{id}` | Ver, actualizar y eliminar |
| `PATCH` | `/api/appointments/{id}/status` | Cambiar sólo el estado |
| `GET` `POST` | `/api/medical-records` | Listar (con `?pet_id=`) y crear |
| `GET` `PUT` | `/api/medical-records/{id}` | Ver y actualizar |
| `GET` | `/api/dashboard` | Resumen para la pantalla de inicio |

Todos los endpoints salvo `login`, `/` y `/api/health` requieren el header:

```
Authorization: Bearer <access_token>
```

---

## 15. Estructura del proyecto

```
proyecto_angela/
│
├── database/
│   ├── schema.sql                # tablas, constraints, índices y triggers
│   └── seed.sql                  # datos de demostración
│
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI, CORS y registro de routers
│   │   ├── core/
│   │   │   ├── config.py         # settings desde .env
│   │   │   ├── security.py       # bcrypt + JWT
│   │   │   └── dependencies.py   # get_db, get_current_user, require_admin
│   │   ├── database/
│   │   │   ├── connection.py     # psycopg 3 con dict_row
│   │   │   └── helpers.py        # 404/409/400 y traducción de errores
│   │   ├── schemas/              # Pydantic (auth, owner, pet, ...)
│   │   ├── routers/              # endpoints por recurso
│   │   └── services/             # lógica de negocio y SQL
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/           # Sidebar, Header, AppLayout
│   │   │   ├── common/           # Button, Input, Select, Modal, Badge, ...
│   │   │   ├── owners/           # OwnerForm
│   │   │   ├── pets/             # PetForm, PetAvatar
│   │   │   └── appointments/     # AppointmentForm
│   │   ├── pages/                # Login, Dashboard, Owners, Pets, PetDetail, ...
│   │   ├── services/             # api.js, formatters.js
│   │   ├── context/              # AuthContext
│   │   ├── hooks/                # useApiResource, useDebouncedValue
│   │   ├── styles/               # variables, reset, global, layout, ...
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── .gitignore
└── README.md                      # este archivo
```

---

## 16. Variables de entorno

### Backend (`backend/.env`)

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí | Cadena de conexión a PostgreSQL (local o Supabase) |
| `DATABASE_SSLMODE` | No | Modo SSL de libpq; `require` para Supabase |
| `SECRET_KEY` | Sí | Clave para firmar los JWT. **No la subas a Git.** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Vigencia del token (por defecto 60) |
| `CORS_ORIGINS` | No | Orígenes permitidos, separados por coma |
| `ALGORITHM` | No | Algoritmo de firma JWT (por defecto `HS256`) |

### Frontend (`frontend/.env`)

| Variable | Obligatoria | Descripción |
|---|---|---|
| `VITE_API_URL` | Sí | URL base de la API |

### Despliegue en Render + Supabase

`render.yaml` define dos servicios: `vetcare-api` (FastAPI) y `vetcare-web`
(sitio estático de React). Al arrancar, el backend ejecuta
`python -m scripts.init_db --if-empty`, que crea las tablas y los datos demo en
Supabase **solo la primera vez**; los despliegues siguientes no tocan los datos.

1. En Render: **New → Blueprint** y elige este repositorio de GitHub.
2. Completa las variables que pide el panel:
   - `DATABASE_URL`: URI del **Session pooler** de Supabase (Render no
     soporta IPv6, la conexión directa no funciona).
   - `CORS_ORIGINS`: `https://vetcare-web.onrender.com`
   - `VITE_API_URL`: `https://vetcare-api.onrender.com/api`
3. Si Render asignó otras URLs (nombre ocupado), corrige `CORS_ORIGINS` y
   `VITE_API_URL` en **Environment** y vuelve a desplegar. `VITE_API_URL` se
   incrusta en el build, así que el frontend debe reconstruirse tras cambiarla.

Cada `git push` a `main` vuelve a desplegar ambos servicios. El plan gratuito
duerme el backend tras 15 min sin uso; la primera petición tarda ~1 min.

---

## 17. Decisiones técnicas

- **SQL parametrizado siempre.** Nunca se concatena una variable en la cadena
  SQL. Los únicos `f-string` en el backend son sobre listas de columnas
  escritas en el propio código, nunca sobre datos del usuario.
- **Errores legibles.** Los errores de PostgreSQL se traducen en la capa
  `helpers.py`; el frontend nunca ve un error crudo de la base de datos.
- **Sin borrado físico de veterinarios.** Se desactivan con `is_active = FALSE`
  para no perder el historial clínico.
- **Propietarios con mascotas no se pueden eliminar** (409): se evita perder
  datos accidentalmente.
- **Índice único parcial** sobre `(veterinarian_id, appointment_date,
  appointment_time)` para las citas no canceladas: la regla "un veterinario,
  una cita por horario" la garantiza la propia base de datos, además de la
  validación en Python.
- **Tipografía:** Inter, cargada desde Google Fonts en `index.html`.
- **Moneda y fechas:** `Intl.NumberFormat('es-CO')` y
  `Intl.DateTimeFormat('es-CO')` en `services/formatters.js`. El backend siempre
  habla ISO.

---

## 18. Problemas frecuentes

**`password authentication failed for user "postgres"`**
La clave de `DATABASE_URL` no coincide con la del servidor. Verifica con
`psql -U postgres` y ajusta `backend/.env`.

**`could not translate host name "localhost"`**
Levanta el servicio de PostgreSQL: `brew services start postgresql@14`.

**El frontend carga pero no muestra datos**
Comprueba que `frontend/.env` apunte a `http://localhost:8000/api` y que el
backend esté corriendo en el puerto 8000. Si cambiaste el puerto, ajusta también
`CORS_ORIGINS`.

**`ModuleNotFoundError: No module named 'app'`**
Ejecuta uvicorn desde dentro de `backend/`.

**CORS bloqueado en el navegador**
El origen del frontend debe estar exactamente en `CORS_ORIGINS`, con el mismo
protocolo y puerto.

**Supabase: `could not translate host name` o timeout**
Estás usando la conexión directa (`db.<ref>.supabase.co`), que solo funciona por
IPv6. Usa la URI del **Session pooler**.

**Supabase: `password authentication failed`**
El usuario del pooler es `postgres.<PROJECT_REF>`. Si la clave tiene caracteres
especiales, codifícalos en la URL (`@` → `%40`, `#` → `%23`).

**Quiero reiniciar los datos desde cero**

```bash
cd backend && python -m scripts.init_db
# o con psql:
psql -U postgres -d vetcare_db -f database/schema.sql
psql -U postgres -d vetcare_db -f database/seed.sql
```