Actúa como un Senior Full Stack Software Engineer especializado en React, Python, FastAPI y PostgreSQL.

Quiero que construyas desde cero un proyecto académico completo llamado:

VETCARE

Es un sistema web pequeño de gestión veterinaria. Debe ser funcional, bien organizado, fácil de entender, con arquitectura limpia y sin sobreingeniería.

IMPORTANTE:
- Frontend: ReactJS con JavaScript, NO TypeScript.
- Estilos: CSS nativo exclusivamente.
- Backend: Python + FastAPI.
- Base de datos: PostgreSQL.
- NO usar SQLAlchemy.
- La conexión a PostgreSQL debe hacerse con psycopg 3.
- La API debe seguir arquitectura REST.
- La aplicación debe quedar dividida en dos carpetas principales:
  /frontend
  /backend
- Debe incluir un README.md principal con instrucciones completas.
- Debe incluir archivos .env.example.
- No agregues tecnologías innecesarias.
- El proyecto debe ser académico, entendible y fácil de explicar en clase.

==================================================
1. OBJETIVO DEL SISTEMA
==================================================

VetCare será una aplicación web para una clínica veterinaria pequeña.

Debe permitir:

- Gestionar propietarios.
- Gestionar mascotas.
- Gestionar veterinarios.
- Gestionar servicios.
- Gestionar citas.
- Registrar historias clínicas.
- Consultar el historial médico de una mascota.
- Visualizar información resumida en un dashboard.
- Tener autenticación básica para administradores y recepcionistas.

El alcance debe mantenerse pequeño y controlado.

NO agregar:
- Inventario.
- Facturación electrónica.
- POS.
- WhatsApp.
- IA.
- Hospitalización.
- Grooming.
- Microservicios.
- Docker, salvo que se deje opcional y claramente separado.
- Redux.
- Tailwind.
- Bootstrap.
- Material UI.
- Shadcn.
- TypeScript.
- SQLAlchemy.

==================================================
2. STACK OBLIGATORIO
==================================================

Frontend:
- ReactJS
- JavaScript
- Vite
- React Router DOM
- CSS nativo
- Fetch API o Axios
- Lucide React puede usarse solo para iconos si es necesario

Backend:
- Python
- FastAPI
- Uvicorn
- psycopg 3
- Pydantic
- python-dotenv o pydantic-settings
- passlib/bcrypt o alternativa segura para contraseñas
- JWT para autenticación si se implementa login

Base de datos:
- PostgreSQL
- SQL escrito manualmente
- No usar ORM

==================================================
3. ESTRUCTURA GENERAL DEL PROYECTO
==================================================

Crear esta estructura base:

vetcare/
│
├── frontend/
│
├── backend/
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── .gitignore
└── README.md

==================================================
4. ESTRUCTURA DEL BACKEND
==================================================

Crear algo similar a:

backend/
│
├── app/
│   ├── main.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── dependencies.py
│   │
│   ├── database/
│   │   ├── connection.py
│   │   └── helpers.py
│   │
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── owner.py
│   │   ├── pet.py
│   │   ├── veterinarian.py
│   │   ├── service.py
│   │   ├── appointment.py
│   │   └── medical_record.py
│   │
│   ├── routers/
│   │   ├── auth.py
│   │   ├── owners.py
│   │   ├── pets.py
│   │   ├── veterinarians.py
│   │   ├── services.py
│   │   ├── appointments.py
│   │   ├── medical_records.py
│   │   └── dashboard.py
│   │
│   └── services/
│       ├── auth_service.py
│       ├── owner_service.py
│       ├── pet_service.py
│       ├── veterinarian_service.py
│       ├── appointment_service.py
│       └── medical_record_service.py
│
├── requirements.txt
├── .env.example
└── README.md

Evita arquitectura excesivamente compleja.

Los routers deben manejar HTTP.
Los services deben contener la lógica de negocio.
La capa database debe manejar conexión y utilidades.
Los schemas deben ser Pydantic.

==================================================
5. CONEXIÓN A POSTGRESQL
==================================================

Usar psycopg 3.

No usar SQLAlchemy.

La configuración debe depender de:

DATABASE_URL

Ejemplo:

DATABASE_URL=postgresql://postgres:password@localhost:5432/vetcare_db

Debe haber un archivo:

backend/.env.example

con:

DATABASE_URL=
SECRET_KEY=
ACCESS_TOKEN_EXPIRE_MINUTES=60

La conexión debe estar centralizada.

Preferiblemente usar:

from psycopg.rows import dict_row

para obtener resultados como diccionarios.

Ejemplo conceptual:

with psycopg.connect(
    settings.database_url,
    row_factory=dict_row
) as conn:
    ...

Manejar correctamente:
- apertura
- commit
- rollback
- cierre

Usar parámetros SQL seguros.

NUNCA concatenar variables directamente en consultas SQL.

Correcto:

cursor.execute(
    "SELECT * FROM pets WHERE id = %s",
    (pet_id,)
)

Incorrecto:

cursor.execute(f"SELECT * FROM pets WHERE id = {pet_id}")

==================================================
6. BASE DE DATOS
==================================================

Crear exactamente estas 7 tablas principales:

1. users
2. owners
3. pets
4. veterinarians
5. services
6. appointments
7. medical_records

Crear database/schema.sql.

Usar PostgreSQL.

----------------------------------------
users
----------------------------------------

Campos:

id SERIAL PRIMARY KEY
full_name VARCHAR(120) NOT NULL
email VARCHAR(150) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL
role VARCHAR(30) NOT NULL DEFAULT 'admin'
is_active BOOLEAN NOT NULL DEFAULT TRUE
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

role debe aceptar solamente:

admin
receptionist

----------------------------------------
owners
----------------------------------------

id SERIAL PRIMARY KEY
first_name VARCHAR(80) NOT NULL
last_name VARCHAR(80) NOT NULL
document_number VARCHAR(30) UNIQUE
phone VARCHAR(30) NOT NULL
email VARCHAR(150)
address VARCHAR(200)
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

----------------------------------------
pets
----------------------------------------

id SERIAL PRIMARY KEY
owner_id INTEGER NOT NULL
name VARCHAR(80) NOT NULL
species VARCHAR(50) NOT NULL
breed VARCHAR(80)
sex VARCHAR(10)
birth_date DATE
weight NUMERIC(6,2)
color VARCHAR(50)
notes TEXT
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

Foreign key:
owner_id -> owners.id

sex:
male
female

----------------------------------------
veterinarians
----------------------------------------

id SERIAL PRIMARY KEY
first_name VARCHAR(80) NOT NULL
last_name VARCHAR(80) NOT NULL
license_number VARCHAR(50) UNIQUE NOT NULL
specialty VARCHAR(100)
phone VARCHAR(30)
email VARCHAR(150) UNIQUE
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

----------------------------------------
services
----------------------------------------

id SERIAL PRIMARY KEY
name VARCHAR(100) UNIQUE NOT NULL
description TEXT
price NUMERIC(12,2) NOT NULL
duration_minutes INTEGER NOT NULL DEFAULT 30
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

----------------------------------------
appointments
----------------------------------------

id SERIAL PRIMARY KEY
pet_id INTEGER NOT NULL
veterinarian_id INTEGER NOT NULL
service_id INTEGER NOT NULL
appointment_date DATE NOT NULL
appointment_time TIME NOT NULL
status VARCHAR(30) NOT NULL DEFAULT 'scheduled'
reason TEXT
notes TEXT
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

FK:
pet_id -> pets.id
veterinarian_id -> veterinarians.id
service_id -> services.id

Estados permitidos:

scheduled
confirmed
completed
cancelled

----------------------------------------
medical_records
----------------------------------------

id SERIAL PRIMARY KEY
pet_id INTEGER NOT NULL
veterinarian_id INTEGER NOT NULL
appointment_id INTEGER
consultation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
symptoms TEXT
diagnosis TEXT
treatment TEXT
observations TEXT
weight NUMERIC(6,2)
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

FK:
pet_id -> pets.id
veterinarian_id -> veterinarians.id
appointment_id -> appointments.id

==================================================
7. CONSTRAINTS E ÍNDICES
==================================================

Implementar constraints apropiados.

Ejemplos:

CHECK price >= 0
CHECK weight > 0 cuando no sea NULL
CHECK duration_minutes > 0

Crear índices al menos para:

pets.owner_id
appointments.pet_id
appointments.veterinarian_id
appointments.appointment_date
medical_records.pet_id

==================================================
8. SEED
==================================================

Crear:

database/seed.sql

Insertar datos demo:

- 1 usuario administrador
- 3 propietarios
- 4 mascotas
- 2 veterinarios
- 5 servicios
- varias citas
- algunas historias clínicas

Servicios sugeridos:

Consulta general
Vacunación
Desparasitación
Control médico
Curación

IMPORTANTE:
Si el usuario demo requiere contraseña hasheada, documentar cómo generarla o incluir una estrategia correcta desde Python.

==================================================
9. AUTENTICACIÓN
==================================================

Crear login básico.

Endpoint:

POST /api/auth/login

Debe recibir:

email
password

Retornar:

access_token
token_type
user

Usar JWT.

Las contraseñas deben estar hasheadas.

No guardar contraseñas en texto plano.

Crear endpoint opcional:

GET /api/auth/me

Debe retornar información del usuario autenticado.

No necesitamos registro público de usuarios.

==================================================
10. ENDPOINTS REST
==================================================

Usar prefijo:

/api

----------------------------------------
AUTH
----------------------------------------

POST /api/auth/login
GET /api/auth/me

----------------------------------------
OWNERS
----------------------------------------

GET /api/owners
GET /api/owners/{id}
POST /api/owners
PUT /api/owners/{id}
DELETE /api/owners/{id}

Agregar búsqueda opcional:

GET /api/owners?search=

Debe buscar por:
- nombre
- apellido
- documento
- teléfono

----------------------------------------
PETS
----------------------------------------

GET /api/pets
GET /api/pets/{id}
POST /api/pets
PUT /api/pets/{id}
DELETE /api/pets/{id}

GET /api/pets/{id}/medical-records

Permitir filtro:

GET /api/pets?owner_id=

----------------------------------------
VETERINARIANS
----------------------------------------

GET /api/veterinarians
GET /api/veterinarians/{id}
POST /api/veterinarians
PUT /api/veterinarians/{id}

No es obligatorio eliminar veterinarios físicamente.
Puede usarse is_active.

----------------------------------------
SERVICES
----------------------------------------

GET /api/services
GET /api/services/{id}
POST /api/services
PUT /api/services/{id}

----------------------------------------
APPOINTMENTS
----------------------------------------

GET /api/appointments
GET /api/appointments/{id}
POST /api/appointments
PUT /api/appointments/{id}
DELETE /api/appointments/{id}

Permitir filtros:

?date=
?status=
?veterinarian_id=

Crear endpoint:

PATCH /api/appointments/{id}/status

body:

{
  "status": "completed"
}

----------------------------------------
MEDICAL RECORDS
----------------------------------------

GET /api/medical-records
GET /api/medical-records/{id}
POST /api/medical-records
PUT /api/medical-records/{id}

Permitir:

GET /api/medical-records?pet_id=

==================================================
11. LÓGICA DE NEGOCIO
==================================================

Implementar algunas reglas básicas:

1. No permitir citas para mascotas inexistentes.
2. No permitir citas con veterinarios inexistentes o inactivos.
3. No permitir servicios inexistentes o inactivos.
4. No permitir pesos <= 0.
5. No permitir precios negativos.
6. No permitir estados de cita distintos a:
   scheduled
   confirmed
   completed
   cancelled
7. No permitir crear dos citas para el mismo veterinario en la misma fecha y hora.
8. Al crear una historia clínica vinculada a una cita, permitir marcar la cita como completed.
9. Evitar eliminar propietarios que tengan mascotas si eso provoca pérdida accidental de información, o manejarlo explícitamente.
10. Usar códigos HTTP apropiados:
    200
    201
    204
    400
    401
    404
    409
    422

==================================================
12. CONSULTAS SQL
==================================================

Como NO se usará ORM, demostrar SQL relacional real.

Usar JOIN donde tenga sentido.

Por ejemplo, las citas deben retornar información útil:

{
  "id": 1,
  "appointment_date": "2026-10-10",
  "appointment_time": "10:30:00",
  "status": "scheduled",
  "pet": {
    "id": 1,
    "name": "Mango"
  },
  "owner": {
    "id": 1,
    "full_name": "Carlos Ramirez"
  },
  "veterinarian": {
    "id": 1,
    "full_name": "Laura Gomez"
  },
  "service": {
    "id": 1,
    "name": "Consulta general",
    "price": 50000
  }
}

Utilizar SQL JOIN real para obtener esos datos.

==================================================
13. FRONTEND
==================================================

Crear frontend con:

ReactJS
JavaScript
Vite
CSS nativo

Estructura aproximada:

frontend/
│
├── src/
│   ├── assets/
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── AppLayout.jsx
│   │   │
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ConfirmDialog.jsx
│   │   │
│   │   ├── pets/
│   │   ├── owners/
│   │   └── appointments/
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Owners.jsx
│   │   ├── Pets.jsx
│   │   ├── PetDetail.jsx
│   │   ├── Veterinarians.jsx
│   │   ├── Services.jsx
│   │   ├── Appointments.jsx
│   │   └── MedicalRecords.jsx
│   │
│   ├── services/
│   │   └── api.js
│   │
│   ├── context/
│   │   └── AuthContext.jsx
│   │
│   ├── hooks/
│   │
│   ├── styles/
│   │   ├── variables.css
│   │   ├── reset.css
│   │   ├── global.css
│   │   ├── layout.css
│   │   ├── components.css
│   │   ├── forms.css
│   │   └── tables.css
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── .env.example
├── package.json
└── README.md

==================================================
14. DISEÑO VISUAL
==================================================

El diseño debe ser:

- limpio
- moderno
- elegante
- cálido
- amigable
- profesional
- veterinario sin verse infantil
- fácil de usar
- con buen espacio visual
- responsive

Inspiración visual:

SaaS moderno
clínicas modernas
dashboards como Linear, Notion, Stripe y Apple Health

NO copiar ninguna interfaz.

Usar un lenguaje visual propio.

Paleta sugerida:

--color-primary: #2F7D6D;
--color-primary-dark: #245F54;
--color-primary-light: #E7F4F0;

--color-secondary: #D9A441;

--color-background: #F7F9F8;
--color-surface: #FFFFFF;

--color-text-primary: #1F2937;
--color-text-secondary: #6B7280;

--color-border: #E5E7EB;

--color-success: #2E7D32;
--color-warning: #C58A16;
--color-danger: #C94C4C;

La paleta puede ajustarse ligeramente si visualmente funciona mejor.

==================================================
15. TIPOGRAFÍA
==================================================

Usar tipografía limpia.

Preferencias:

Inter
Manrope
Nunito Sans

Si se usa Google Fonts, documentarlo.

No usar demasiadas fuentes.

==================================================
16. SIDEBAR
==================================================

Crear sidebar fija en desktop.

Items:

Dashboard
Propietarios
Mascotas
Citas
Veterinarios
Servicios
Historias clínicas

Parte inferior:

Usuario actual
Cerrar sesión

Usar iconos discretos.

==================================================
17. DASHBOARD
==================================================

Dashboard visualmente atractivo.

Mostrar cards:

Mascotas registradas
Propietarios
Citas de hoy
Veterinarios activos

Mostrar también:

Próximas citas
Actividad reciente
Distribución de citas por estado

No hace falta usar gráficas complejas.

Puede usarse CSS para barras simples.

==================================================
18. DISEÑO DE CARDS
==================================================

Cards:

- border-radius entre 14px y 18px
- borde suave
- sombra muy ligera
- mucho espacio interno
- no saturar colores

Ejemplo visual:

┌────────────────────────────┐
│ Mascotas registradas       │
│                            │
│ 24                         │
│                            │
│ +3 este mes                │
└────────────────────────────┘

==================================================
19. TABLAS
==================================================

Las tablas deben verse modernas.

Características:

- encabezados suaves
- hover por fila
- border inferior ligero
- acciones alineadas a la derecha
- buen padding
- responsive

Acciones:

Ver
Editar
Eliminar

Usar iconos si se desea.

==================================================
20. FORMULARIOS
==================================================

Los formularios deben:

- usar labels visibles
- inputs grandes y cómodos
- mostrar mensajes de error debajo
- usar botones claros
- separar secciones
- no meter 15 campos en una sola fila

Máximo 2 columnas en desktop.
1 columna en móvil.

==================================================
21. MODALES
==================================================

Usar modales para:

Crear propietario
Crear mascota
Crear veterinario
Crear servicio
Crear cita

También puede usarse página independiente para formularios complejos.

==================================================
22. MASCOTAS
==================================================

La pantalla Pets debe incluir:

- buscador
- botón Nueva mascota
- cards o tabla

Cada mascota debe mostrar:

nombre
especie
raza
propietario
edad aproximada
peso

Crear pantalla:

/pets/:id

Debe mostrar:

Información general
Propietario
Próximas citas
Historial médico

==================================================
23. CITAS
==================================================

Pantalla de citas:

Filtros:

fecha
estado
veterinario

Mostrar:

hora
mascota
propietario
veterinario
servicio
estado

Badges:

scheduled = azul suave
confirmed = verde
completed = gris/verde
cancelled = rojo suave

No saturar los colores.

==================================================
24. LOGIN
==================================================

Login limpio.

Layout centrado o dividido.

Debe incluir:

Logo/nombre VetCare
Texto breve
Email
Password
Botón Iniciar sesión

No agregar registro.

==================================================
25. RESPONSIVE
==================================================

Desktop:
sidebar fija.

Tablet:
sidebar colapsable.

Mobile:
sidebar tipo drawer o menú.

Tablas deben adaptarse.

No permitir overflow horizontal innecesario.

==================================================
26. API CLIENT
==================================================

Crear:

frontend/src/services/api.js

Usar variable:

VITE_API_URL=http://localhost:8000/api

Crear:

frontend/.env.example

con:

VITE_API_URL=http://localhost:8000/api

Centralizar las llamadas HTTP.

Agregar automáticamente JWT cuando exista.

==================================================
27. MANEJO DE ESTADO
==================================================

NO usar Redux.

Usar:

useState
useEffect
Context API solamente para autenticación

Mantenerlo sencillo.

==================================================
28. CORS
==================================================

Configurar FastAPI para aceptar el frontend:

http://localhost:5173

La configuración debe ser fácilmente modificable.

==================================================
29. VALIDACIONES PYDANTIC
==================================================

Crear schemas:

OwnerCreate
OwnerUpdate
OwnerResponse

PetCreate
PetUpdate
PetResponse

VeterinarianCreate
VeterinarianUpdate
VeterinarianResponse

ServiceCreate
ServiceUpdate
ServiceResponse

AppointmentCreate
AppointmentUpdate
AppointmentResponse

MedicalRecordCreate
MedicalRecordUpdate
MedicalRecordResponse

Validar:

emails
precios
peso
campos obligatorios
estados

==================================================
30. DOCUMENTACIÓN FASTAPI
==================================================

La API debe quedar correctamente documentada en:

/docs

Agregar:

title="VetCare API"

description adecuada.

Agrupar endpoints por tags.

==================================================
31. MANEJO DE ERRORES
==================================================

Crear respuestas comprensibles.

Ejemplos:

{
  "detail": "Pet not found"
}

{
  "detail": "Veterinarian already has an appointment at this time"
}

No devolver errores internos de PostgreSQL directamente al frontend.

==================================================
32. README PRINCIPAL
==================================================

Crear README.md raíz completo.

Debe explicar:

1. Qué es VetCare.
2. Tecnologías.
3. Arquitectura.
4. Requisitos.
5. Cómo crear PostgreSQL.
6. Cómo ejecutar schema.sql.
7. Cómo ejecutar seed.sql.
8. Cómo configurar backend.
9. Cómo crear virtualenv.
10. Cómo instalar dependencias.
11. Cómo ejecutar FastAPI.
12. Cómo configurar frontend.
13. Cómo ejecutar React.
14. Credenciales demo.
15. Rutas importantes.
16. Estructura del proyecto.

==================================================
33. COMANDOS ESPERADOS
==================================================

Backend:

cd backend

python3 -m venv venv

source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload

Frontend:

cd frontend

npm install

npm run dev

==================================================
34. REQUIREMENTS
==================================================

Crear requirements.txt apropiado.

Algo cercano a:

fastapi
uvicorn[standard]
psycopg[binary]
pydantic
pydantic-settings
python-dotenv
python-jose[cryptography]
passlib[bcrypt]
python-multipart
email-validator

Ajustar si alguna dependencia no es realmente necesaria.

==================================================
35. CALIDAD DE CÓDIGO
==================================================

Quiero código:

- claro
- legible
- modular
- fácil de explicar
- nombres descriptivos
- sin funciones gigantes
- sin archivos gigantes
- sin abstracciones innecesarias
- sin código duplicado innecesario

Agregar comentarios solamente donde aporten valor.

No comentar cada línea.

==================================================
36. SEGURIDAD
==================================================

Nunca:

- guardar passwords sin hash
- subir .env
- concatenar SQL
- exponer SECRET_KEY
- exponer DATABASE_URL al frontend

Agregar .env al .gitignore.

==================================================
37. GITIGNORE
==================================================

Crear .gitignore raíz incluyendo:

.env
backend/.env
frontend/.env

__pycache__/
*.pyc

backend/venv/
backend/.venv/

frontend/node_modules/
frontend/dist/

.DS_Store

==================================================
38. EXPERIENCIA DE USUARIO
==================================================

Agregar estados:

loading
empty
error
success

Ejemplo:

"Cargando mascotas..."

"No hay mascotas registradas."

"No fue posible cargar las mascotas."

Usar confirmación antes de eliminar.

==================================================
39. DATOS MONETARIOS
==================================================

Mostrar precios en pesos colombianos.

Ejemplo:

$50.000

Usar:

Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
})

==================================================
40. FORMATO DE FECHAS
==================================================

Mostrar fechas de manera amigable para Colombia.

Ejemplo:

10 oct 2026

Mantener ISO en comunicación con backend.

==================================================
41. ENTREGA FINAL
==================================================

No quiero solamente un ejemplo ni archivos parciales.

Construye el proyecto completo.

Debes:

1. Crear todas las carpetas.
2. Crear todos los archivos necesarios.
3. Implementar backend funcional.
4. Implementar frontend funcional.
5. Crear base de datos SQL.
6. Crear seeds.
7. Crear autenticación.
8. Crear CRUDs.
9. Crear dashboard.
10. Crear diseño responsive.
11. Crear README.
12. Crear .env.example.
13. Crear .gitignore.

==================================================
42. FORMA DE TRABAJO
==================================================

Trabaja directamente sobre los archivos del proyecto.

Antes de terminar:

- revisa imports
- revisa rutas
- revisa nombres de archivos
- revisa errores de sintaxis
- revisa configuración de CORS
- revisa llamadas frontend/backend
- revisa SQL
- revisa variables de entorno
- revisa dependencias

No dejes pseudocódigo cuando pueda implementarse realmente.

Si existe una decisión menor no especificada, toma una decisión técnica razonable y continúa.

No me detengas constantemente para pedir confirmaciones.

==================================================
43. ORDEN DE IMPLEMENTACIÓN
==================================================

Sigue este orden:

FASE 1
Crear estructura del proyecto.

FASE 2
Crear schema.sql y seed.sql.

FASE 3
Crear backend FastAPI y conexión PostgreSQL.

FASE 4
Crear autenticación.

FASE 5
Crear CRUD Owners.

FASE 6
Crear CRUD Pets.

FASE 7
Crear Veterinarians y Services.

FASE 8
Crear Appointments.

FASE 9
Crear Medical Records.

FASE 10
Crear endpoints Dashboard.

FASE 11
Crear frontend React.

FASE 12
Crear diseño visual.

FASE 13
Conectar frontend con API.

FASE 14
Probar flujos principales.

FASE 15
Completar README.

==================================================
44. RESULTADO ESPERADO
==================================================

El proyecto debe permitir demostrar este flujo completo:

Usuario inicia sesión

        ↓

Registra propietario

        ↓

Registra mascota

        ↓

Registra veterinario

        ↓

Selecciona servicio

        ↓

Agenda cita

        ↓

Veterinario atiende mascota

        ↓

Registra historia clínica

        ↓

Cita queda completada

        ↓

Historial médico aparece en perfil de mascota

==================================================
45. IMPORTANTE SOBRE EL DISEÑO
==================================================

No quiero que el proyecto parezca:

- un CRUD genérico de Bootstrap
- una tarea universitaria visualmente pobre
- una interfaz saturada
- una plantilla administrativa antigua

Quiero que visualmente parezca un pequeño producto SaaS veterinario moderno.

Debe sentirse:

premium
limpio
cálido
profesional
amigable

Pero seguir siendo sencillo de implementar y explicar.

Prioriza:

white space
jerarquía tipográfica
alineación
consistencia
cards limpias
formularios agradables
sidebar moderna
tablas cuidadas

sobre:

animaciones complejas
gradientes excesivos
efectos innecesarios

Puedes usar transiciones CSS muy sutiles:

transition: all 0.2s ease;

Evita animaciones exageradas.

==================================================
46. CRITERIO FINAL
==================================================

Cuando termines, el proyecto debe poder ejecutarse siguiendo únicamente el README.

No des por terminado el trabajo si quedan imports rotos, endpoints incompletos, páginas vacías o componentes sin implementar.

Al final, dame un resumen breve de:

- estructura creada
- funcionalidades implementadas
- variables de entorno necesarias
- comandos para levantar backend
- comandos para levantar frontend
- credenciales demo