# VetCare · Frontend

Interfaz con React 18 + Vite y **CSS nativo** (sin frameworks de estilos).

## Configuración

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:8000/api
```

## Ejecución

```bash
npm install
npm run dev      # http://localhost:5173
```

Otros comandos:

```bash
npm run build    # compila a dist/
npm run preview  # sirve dist/
```

## Estructura

```
src/
├── components/
│   ├── layout/        Sidebar, Header, AppLayout
│   ├── common/        Button, Input, Select, Modal, ConfirmDialog,
│   │                  Badge, Alert, LoadingSpinner, EmptyState, Toast,
│   │                  VeterinarianForm, ServiceForm
│   ├── owners/        OwnerForm
│   ├── pets/          PetForm, PetAvatar
│   └── appointments/  AppointmentForm
├── pages/             Login, Dashboard, Owners, Pets, PetDetail,
│                      Appointments, Veterinarians, Services, MedicalRecords
├── services/          api.js (cliente HTTP), formatters.js (COP y fechas es-CO)
├── context/           AuthContext (Context API, sin Redux)
├── hooks/             useApiResource, useDebouncedValue
└── styles/            variables, reset, global, layout, components, forms, tables
```

## Decisiones

- **Sin Redux.** `useState` + `useEffect` en cada página y Context API sólo para
  la autenticación.
- **CSS nativo.** Los archivos de `styles/` se importan en `main.jsx`. Los
  colores, radios, sombras y espaciados salen de las variables de
  `variables.css`, así que la identidad visual se cambia desde un solo lugar.
- **Cliente HTTP centralizado** en `services/api.js`: antepone la URL base,
  adjunta el JWT y convierte los errores de FastAPI en mensajes legibles.
- **Estados visibles** de carga, vacío y error en cada listado.
- **Tipografía:** Inter, cargada desde Google Fonts en `index.html`.

## Formato

`Intl.NumberFormat('es-CO', { currency: 'COP' })` para precios (`$50.000`) e
`Intl.DateTimeFormat('es-CO')` para fechas (`10 oct 2026`). El backend siempre
recibe y devuelve fechas en ISO.