# CRM Grupo Las Flores — Prototipo

Prototipo funcional del CRM propio del grupo (Restaurante Las Flores, Hotel Umaru y
Mamina Restobar), construido a partir del **Plan de CRM del Grupo Las Flores** y ajustado
a cómo trabaja realmente el equipo. No es una maqueta estática: cada módulo funciona de
verdad sobre datos simulados — búsqueda, filtros, cálculo de frecuencia, exportación a
Excel, registro de clientes, creación de usuarios, autorización de reservas y un chat
integrado con modo automático/manual.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Se ingresa con **usuario y
contraseña** (cuentas de prueba visibles en la pantalla de login). La sesión y los datos
que se van creando quedan guardados en `localStorage` del navegador — no hay backend
todavía.

## Desplegarlo en Vercel

El proyecto es **100% frontend** — no hay ninguna variable de entorno que configurar ni
ninguna credencial que pedir. Basta con conectar el repositorio de GitHub en Vercel y
darle "Deploy": detecta Next.js solo, no necesita build command ni variables especiales.

`src/lib/supabase.ts` es un placeholder completamente comentado (no importa
`@supabase/supabase-js`, no lee ninguna variable de entorno) — está ahí solo como guía de
para cuándo se conecte la base de datos real; hoy no lo usa ningún archivo del proyecto,
así que no puede romper el build ni pedir credenciales en Vercel. Se puede confirmar con
`npm run build` en local: compila y prerenderiza todas las rutas como contenido estático,
sin tocar variables de entorno.

## Cómo está dividido el trabajo entre los tres roles

Esto es lo central del ajuste que se le hizo al prototipo: cada rol tiene un trabajo
distinto, no solo una pantalla distinta.

| Rol | Cómo trabaja | Qué NO hace |
|---|---|---|
| **Dirección** (Mijael) | Solo números y estadísticas para decidir: cada módulo que ve (Tablero, Clientes, Reservas, Delivery, Hospedaje, Cumpleaños, Campañas) tiene sus propios **filtros Diario/Semanal/Mensual/Anual** (que sí recalculan cada número, incluidos los que antes quedaban fijos), gráficos (barras y donas) y botón **"Exportar reporte (PDF)"**. Tiene **dos tableros**: "Tablero general" (los tres negocios juntos) y "Tablero — [negocio activo]" (el mismo tipo de resumen pero de un solo negocio, el que tenga seleccionado arriba). Es el único rol que ve y compara los tres negocios, **crea el primer administrador** de un negocio nuevo (Umaru, Mamina) cuando todavía no tiene a quién delegarle esa tarea, y puede usar **Estrategias** para pedir ideas de campaña. | No registra clientes, no responde chats, no autoriza nada, y no arma el resto de un equipo — eso lo hace el administrador que él mismo crea. |
| **Administración** (Betsy) | Hace la mayor parte de la gestión de Restaurante Las Flores: acceso completo a todos los módulos, **autoriza** las reservas de evento que pide Ventas, **aprueba** el seguimiento de cumpleaños del mes, **crea las cuentas** del equipo (módulo Usuarios), y también puede usar **Estrategias** para armar campañas. | No gestiona Hotel Umaru — es un negocio grande e independiente, con personal propio. |
| **Ventas** (Melisa) | Es quien más módulos usa día a día: registra clientes nuevos directo en el sistema (ya no en Excel), gestiona reservas y delivery, y lleva el seguimiento y el chat de cumpleaños. | No ve montos ni cifras de dinero en Cumpleaños (eso es de Administración/Dirección), y no puede autorizar reservas de evento grandes — solo pedirlas. |

Betsy y Melisa trabajan **solo para Restaurante Las Flores** — por eso no tienen selector
de negocio: el sistema las deja fijas en Las Flores. Solo Dirección puede cambiar entre
Las Flores, Hotel Umaru y Mamina Restobar. Cuando Umaru o Mamina necesiten su propio
equipo, **Mijael entra a Usuarios y crea el primer Administración de ese negocio**
(el formulario ya viene con ese negocio y ese rol preseleccionados); de ahí en adelante,
ese administrador arma el resto de su equipo (Ventas y otros administradores) — igual
que Betsy hoy, cada uno queda limitado a crear cuentas para su propio negocio, con una
lista de **cargos sugeridos según el tipo de negocio** (Vendedor/a, Mesero/a, Anfitrión/a,
Cajero/a para restaurante; Recepcionista, Conserje, Botones para hotel; Administrador/a
de sede, Gerente de sede, Supervisor/a para Administración), con opción "Otro" para casos
puntuales.

La matriz completa de permisos está en `src/lib/permissions.ts`.

### Cuentas de prueba

| Usuario | Contraseña | Rol |
|---|---|---|
| `mijael` | `direccion2026` | Dirección |
| `betsy` | `admin2026` | Administración |
| `melisa` | `ventas2026` | Ventas |

Betsy (o el administrador de cada negocio) y Mijael pueden crear cuentas nuevas desde el
módulo **Usuarios** — quedan disponibles para iniciar sesión de inmediato, en la misma
pantalla de login.

## Módulos

- **Tablero general** — vista ejecutiva de Dirección con los **tres negocios juntos**: filtros Diario/Semanal/Mensual/Anual, comparación de cada KPI contra el periodo anterior (↑/↓ %), gráfico de tendencia, comparativo por negocio y **"Exportar reporte (PDF)"**. Para Administración/Ventas, ese mismo ítem del menú se llama solo "Tablero" y es la vista operativa completa de su negocio (gráfico de reservas y delivery, conversión, actividad reciente).
- **Tablero del negocio** — solo Dirección: el mismo tipo de resumen ejecutivo (filtros por periodo, KPIs con tendencia, gráfico, cumpleaños del mes) pero de **un solo negocio a la vez** — el que tenga seleccionado en el switcher de arriba. Útil para revisar Umaru o Las Flores por separado sin mezclar los números con el resto del grupo.
- **Clientes** — ficha 360° (individuales y corporativos) para Administración/Ventas, con botón **"Nuevo cliente"** (selector Natural/Corporativo, campos investigados sobre el estándar del Excel, **validación real**: nombres/apellidos/representante solo letras, RUC de 11 dígitos que empieza con 1 o 2, celular de 9 dígitos que empieza con 9, y **no permite registrar un celular que ya pertenece a otro cliente de cualquiera de los 3 negocios**); botón de **WhatsApp directo** (`wa.me`) junto a cada cliente para escribirle sin copiar el número. Para Dirección, resumen con filtros por periodo — clientes individuales y corporativos nuevos **de ese periodo** (0 si no hubo ninguno ese día/semana/mes), gráfico y dona de origen del cliente.
- **Reservas** — flujo de **autorización** (los eventos grandes que registra Ventas quedan "Pendiente de Administración" hasta que Betsy los autoriza) para Administración/Ventas; para Dirección, filtros por periodo — reservas, confirmadas/atendidas y tasa de conversión, las tres recalculadas según el periodo elegido — gráfico y dona de estado (confirmada/atendida/cancelada/no llegó).
- **Delivery** — solo Restaurante Las Flores; en cualquier otro negocio el módulo **no aparece en el menú y no muestra ninguna tarjeta** (redirección silenciosa al Tablero). Vista de Dirección con filtros por periodo, gráfico de pedidos y dona de estado.
- **Hospedaje** — solo Hotel Umaru, mismo criterio de ocultamiento silencioso. Vista de Dirección con filtros por periodo, KPIs (estadías, noches, ingreso) y gráfico.
- **Cumpleaños** — lo opera Ventas: saludo **automático de verdad** (una plantilla y hora general editable, con `{nombre}`/`{negocio}`, que se puede **personalizar por cliente**); cuando llega la hora programada y el cliente cumple años hoy, el sistema le escribe el saludo solo — sin que nadie tenga que abrir el chat — y queda visible en Mensajería como cualquier otro mensaje enviado. Un **calendario mensual** muestra cuántos cumpleaños hay cada día; al elegir un día se ve quién cumple, a qué hora se le escribe y con qué mensaje, editable ahí mismo. Un cliente nuevo que Ventas registra este mes entra automáticamente a este seguimiento, con el mensaje general ya "armado" sin configurar nada. Administración supervisa y aprueba (botón "Aprobar mes", ve los montos) pero no edita el saludo. Dirección ve los tres números que le importan (enviados, personas que reservaron, monto generado) más un **embudo** (reservaron / respondieron sin reservar / enviado sin respuesta / sin enviar).
- **Mensajería** — chat simulado por cliente con toggle **Manual / Automático (API)** (en automático, el sistema simula la respuesta del cliente), más una pestaña de **Mensajes programados**: la plantilla de cumpleaños ya personalizada por cliente (mismo patrón que una plantilla real aprobada de WhatsApp Business API) con su estado (Programado / Enviado / Respondido / Reserva confirmada). Algunos clientes ya traen una conversación completa "sembrada" — saludo enviado hace unos días, respuesta y hasta reserva confirmada — para mostrar cómo se ve un caso avanzado, no solo casilleros vacíos.
- **Usuarios** — Administración crea cuentas de Ventas o Administración **para su propio negocio**; Dirección (Mijael) crea el **primer Administración de cualquier negocio** del grupo (formulario con negocio y rol preseleccionados). El campo Cargo es un **selector con opciones según el rol y el tipo de negocio** (restaurante, hotel, o Administración), con "Otro" para casos puntuales.
- **Campañas** — catálogos y promociones mensuales; para Dirección, KPIs (campañas del año, envíos, alcance promedio), gráfico de envíos por mes y dona de canal más usado, con exportación a PDF.
- **Estrategias** — Dirección y Administración (no Ventas): un chat estilo asistente para pedir ideas de campaña, revisar cumpleaños, ticket promedio, reservas, delivery o de dónde vienen los clientes, con **chips de sugerencia** para empezar rápido. Las respuestas se generan con los datos reales del negocio activo (`lib/estrategias.ts`), pero siguen siendo **simuladas** — no hay una API de IA real conectada todavía. Tiene un ícono de engranaje discreto para "conectar" un proveedor (OpenAI/Anthropic/Otro); la clave se guarda solo en `localStorage` del navegador y nunca sale de ahí, como paso pendiente junto con Supabase.

## Estructura del proyecto

```
src/
  app/
    login/               → usuario y contraseña (sesión simulada)
    (app)/                → páginas internas, protegidas por sesión
      dashboard/ tablero-negocio/ clientes/ clientes/[id]/ reservas/ delivery/
      hospedaje/ cumpleanos/ mensajeria/ usuarios/ campanas/ estrategias/
  components/
    layout/                → Sidebar (oculta Delivery/Hospedaje/Tablero-negocio según
                              rol y negocio, arma el label dinámico), Topbar
    ui/                     → Card, Badge, Table, StatTile, ExportarPDFBoton…
    dashboard/               → tablero ejecutivo, PeriodoSelector (filtro día/semana/mes/año)
    charts/                   → BarChartSerie y DonutChart (recharts, reutilizables)
  lib/
    types.ts                 → modelo de datos (clientes, reservas, usuarios, mensajes…)
    permissions.ts            → quién ve, edita o autoriza cada módulo
    store.ts                   → acciones simuladas en localStorage (crear usuario,
                                  registrar cliente, autorizar reserva, chatear,
                                  chat de Estrategias, config de la API de IA…)
    frecuencia.ts                → cálculo de "cliente nuevo / ocasional / frecuente / inactivo"
    metrics.ts                    → KPIs y series para los tableros, todos filtrables por periodo
    estrategias.ts                 → respuestas simuladas del asistente de Estrategias,
                                      armadas con los datos reales del negocio
    export-csv.ts                  → exportación real a CSV/Excel, sin backend
    app-context.tsx                 → sesión, negocio activo y alta de usuarios (Context)
    supabase.ts                      → cliente de Supabase — placeholder, sin conectar
    mock/                              → generadores de datos de ejemplo (ver abajo)
```

## De dónde salen los datos de ejemplo

Los campos de `src/lib/mock/clientes.ts` siguen la estructura del Excel real que armó
Meliza (`base de datos de clientes de las flores y umaru.xlsm`): nombres, apellidos,
fecha de nacimiento, celular, departamento/provincia/distrito para individuales, y razón
social, RUC, representante, CIIU y actividad económica para corporativos. **Los nombres y
teléfonos son ficticios** — no se usó ningún dato real de clientes.

Reservas, delivery, hospedaje y el seguimiento de cumpleaños (saludo, visto, respuesta,
reservación, adelanto, monto) son simulados, con algunos cumpleaños fijados a propósito
en "hoy" y en los próximos días para que la demo siempre tenga algo que mostrar.

## Qué está simulado y qué falta conectar

- **Supabase** — no conectado (`src/lib/supabase.ts` es un placeholder). Toda la data
  vive en `src/lib/mock/` (catálogo base) y en `localStorage` (lo que se va creando:
  clientes, usuarios, chats, autorizaciones). Migrar significa reemplazar esas dos
  fuentes por Supabase, sin tocar las páginas.
- **Camaleón (caja)** — sin integrar, pendiente de confirmar con el proveedor.
- **Web de Hotel Umaru** — gestionada por una empresa externa en Lima.
- **Web de Las Flores** (reservas y delivery) — el prototipo simula su forma de datos.
- **WhatsApp Business API real** — el chat de Mensajería ya simula el comportamiento
  (manual y automático) para poder mostrarlo y probarlo, pero el envío real de mensajes
  (Fase 4 del Plan de CRM) requiere contratar un proveedor (BSP) — no está conectado.
- **API de IA (Estrategias)** — el módulo ya arma respuestas útiles con los datos reales
  del negocio (`src/lib/estrategias.ts`), y tiene una pantalla para "conectar" un proveedor
  (OpenAI/Anthropic/Otro) desde el ícono de configuración, pero esa clave solo se guarda en
  `localStorage` — no hay ninguna llamada real a un modelo de IA todavía. Conectarla de
  verdad es otro paso pendiente, del mismo tipo que Supabase o el WhatsApp Business API.
- **Envío automático de cumpleaños** — el saludo se "envía" de verdad dentro del prototipo
  (queda escrito en el chat del cliente, con la hora real, y marca el seguimiento como
  enviado), pero como no hay conexión a la API de WhatsApp, ese envío no sale del navegador
  — el mismo límite que el resto de Mensajería.

## Por qué a veces se siente lento en `npm run dev` (y por qué en Vercel no)

`npm run dev` compila cada página **la primera vez que la visitas** en esa sesión — es
normal sentir un salto al entrar por primera vez a un módulo que no habías abierto
todavía. Eso es exclusivo del modo desarrollo: en producción (`npm run build` +
`npm run start`, o Vercel) **todas las páginas ya están compiladas de antemano**, así que
ese salto desaparece — no hay base de datos de por medio, así que no hay nada más que
esperar.

Aun así, se aplicaron mejoras reales que ayudan en ambos casos:

- **Paginación** en la tabla de Clientes (`src/components/ui/Paginacion.tsx`, 15 por
  página) — antes pintaba las ~80 filas de golpe; ahora solo las de la página actual.
  Exportar a Excel sigue exportando todos los resultados filtrados, no solo la página
  visible.
- **Carga perezosa de los gráficos** (`next/dynamic`) en Clientes, Reservas, Delivery,
  Hospedaje, Cumpleaños, Campañas, Tablero del negocio y Tablero — recharts (la librería
  de gráficos) ya no se descarga ni se procesa hasta que el componente realmente se monta,
  en vez de venir pegado al resto de la página.
- Un par de listas que se recalculaban en cada tecleo (el buscador de Mensajería) ahora
  usan `useMemo` para no rehacer el filtro/orden si nada relevante cambió.

## Pendiente del feedback de Mijael (documento "Retroalimentación CRM – SFIDA")

Ya están implementadas las validaciones de RUC, celular y duplicados, la clasificación
Natural/Corporativo, y el enlace directo a WhatsApp (ver sección Clientes arriba). Quedan
dos puntos del documento sin construir todavía:

- **Campañas masivas** — seleccionar un segmento de clientes (por tipo, origen, distrito,
  frecuencia) y armar una campaña para todo el grupo de una vez, en vez de ir cliente por
  cliente.
- **Calendario de campañas comerciales** — fechas fijas del año (Carnavales, Semana Santa,
  Día de la Madre, Día del Padre, Fiestas Patrias, aniversario, 9 de diciembre, Navidad,
  Año Nuevo) donde asociar una promoción, un público objetivo y enviarla.

## Próximo paso

Cuando se conecte Supabase, el punto de entrada es reemplazar `src/lib/mock/*.ts` y los
hooks de `src/lib/store.ts` por las consultas/escrituras equivalentes a la base de datos
real — los componentes y páginas no necesitan cambiar.
