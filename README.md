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

Modelo definido por Mijael junto a Arturo y Luis (reunión de diseño de su propio CRM),
reemplaza el modelo anterior de Dirección/Administración/Ventas.

| Rol | Cómo trabaja | Qué NO hace |
|---|---|---|
| **Dirección** (socios en Lima) | **Un solo panel** de crecimiento del grupo — clientes totales, ingresos consolidados, % de crecimiento, negocios activos, gráfico de tendencia y comparativo por negocio. Nada por módulo (no hay Clientes, Reservas, Delivery, etc. en su menú). | Cero acciones — no registra, no responde, no autoriza, no entra a ningún módulo operativo. |
| **Gerencial** (Mijael) | Control operativo total de los 3 negocios: hace todo lo que hace Ventas (registra clientes, crea reservas/delivery, sigue cumpleaños, chatea) **más** crea/edita/elimina campañas, gestiona Días Festivos, crea cuentas de Ventas para cualquiera de los 3 negocios, autoriza reservas grandes, aprueba el mes de cumpleaños, y compara la actividad de su equipo (módulo Usuarios). Puede cambiar de negocio y operar en cualquiera de los tres. Tiene acceso a **Estrategias**. | — |
| **Ventas** (el equipo de cada negocio) | Registra clientes, crea reservas y pedidos de delivery (quedan marcados "enviado a la web"), lleva el seguimiento y el chat de cumpleaños, y **ve** las campañas de su negocio (no las crea ni edita). | No ve montos agregados, no entra a Usuarios/Estrategias/Días Festivos, no autoriza nada — todo eso es de Gerencial. Cada cuenta queda fija a un solo negocio. |

Cuando un negocio nuevo necesita su primer empleado, **Mijael entra a Usuarios y crea la
cuenta de Ventas** para ese negocio (selector de negocio + cargos sugeridos según el tipo:
Vendedor/a, Mesero/a, Anfitrión/a, Cajero/a para restaurante; Recepcionista, Conserje,
Botones para hotel), con opción "Otro" para casos puntuales.

La matriz completa de permisos está en `src/lib/permissions.ts`.

### Cuentas de prueba

| Usuario | Contraseña | Rol |
|---|---|---|
| `socios` | `direccion2026` | Dirección (Lima) |
| `mijael` | `gerencial2026` | Gerencial |
| `betsy` | `ventas2026` | Ventas — Restaurante Las Flores |
| `melisa` | `ventas2026` | Ventas — Restaurante Las Flores |
| `carla` | `umaru2026` | Ventas — Hotel Umaru |

Mijael (Gerencial) puede crear cuentas de Ventas nuevas desde el módulo **Usuarios** —
quedan disponibles para iniciar sesión de inmediato, en la misma pantalla de login.

## Módulos

- **Panel Ejecutivo** (Dirección) — el único ítem de menú que ve este rol: crecimiento del grupo en un solo panel (clientes totales, ingresos consolidados, % de crecimiento, negocios activos), filtros Diario/Semanal/Mensual/Anual, gráfico de tendencia, comparativo por negocio y **"Exportar reporte (PDF)"**. Sin tablas, sin módulos por separado — así lo pidió Mijael explícitamente ("ya no por módulos como delivery o reserva, más general").
- **Panel Principal** (Gerencial) — reestructurado como un CRM, no como un reporte de punto de venta: primero lo accionable, después el dinero, después los clientes, y la relación con el cliente (retención, origen) antes que los patrones de largo plazo, no después. Orden real: (1) aviso de reservas pendientes de autorización; (2) **"Pulso financiero del periodo"** — filtro Diario/Semanal/Mensual/Anual con 4 tarjetas (ingresos totales, ingresos delivery u hospedaje según el negocio, reservas del periodo, **ticket promedio — ahora sí filtrado por periodo**, antes era el único de los 4 que no respondía al filtro); (3) **"Tu base de clientes"** — Clientes totales, Clientes corporativos, Próximos cumpleaños, Días festivos; (4) "Clientes por tienda" (el único cuadro que compara los 3 negocios a la vez) y "Próximas festividades"; (5) **"Relación con el cliente"** — de dónde vienen los clientes y qué tan seguido vuelven (reusa la clasificación de `lib/frecuencia.ts`) — es la sección más "CRM" del panel, por eso va antes de los patrones de 12 meses, no como cierre; (6) **"Mejores y peores momentos"** — mejor/peor mes, mejor/peor día, siempre por ingresos, sin filtro (criterio estándar de "mejor día de ventas" en cualquier restaurante — que el mismo dato no cambie de significado según una pestaña es lo que le da confianza al número); (7) una sola tarjeta de actividad con switch **"Esta semana" / "Patrón por día (12 meses)"** — antes eran dos gráficos separados que se veían como el mismo dato duplicado; en "Esta semana" se ve la tendencia de fechas reales (con leyenda, cambia a "Reservas y hospedaje" en vez de delivery para Umaru, que no lo tiene), en "Patrón por día" aparece el selector Ingresos/Reservas/Delivery-u-Hospedaje/Clientes nuevos. Los datos simulados tienen 13 meses de historial con estacionalidad real de Ayacucho (Semana Santa y Carnavales son los meses fuertes, no diciembre — coinciden con las fechas ya cargadas en `mock/festividades.ts`). "Exportar PDF" vive en la barra superior, no dentro del panel. Para Ventas, ese mismo ítem se llama "Tablero" y es la vista operativa de su propio negocio (gráfico de reservas y delivery, conversión, actividad reciente).
- **Clientes** — ficha 360° (individuales y corporativos), con botón **"Nuevo cliente"** (selector Natural/Corporativo, campos investigados sobre el estándar del Excel, **validación real**: nombres/apellidos/representante solo letras, RUC de 11 dígitos que empieza con 1 o 2, celular de 9 dígitos que empieza con 9, y **no permite registrar un celular que ya pertenece a otro cliente de cualquiera de los 3 negocios**); botón de **WhatsApp directo** (`wa.me`) junto a cada cliente.
- **Reservas** — flujo de **autorización** (los eventos grandes quedan "Pendiente de Gerencial" hasta que Mijael los autoriza); botón **"Nueva reserva"** para Ventas/Gerencial — al guardar queda marcada "Enviada a la web" (simula la sincronización con el CRM real de la web de Las Flores).
- **Delivery** — solo Restaurante Las Flores; en cualquier otro negocio el módulo **no aparece en el menú** (redirección silenciosa). Botón **"Nuevo pedido"**, también marcado "Enviado a la web" al crearse.
- **Hospedaje** — solo Hotel Umaru, mismo criterio de ocultamiento silencioso.
- **Cumpleaños** — saludo **automático de verdad** (plantilla y hora general editable, con `{nombre}`/`{negocio}`, personalizable por cliente); cuando llega la hora programada y el cliente cumple años hoy, el sistema le escribe el saludo solo y queda visible en Mensajería. **Calendario mensual** — al elegir un día se ve quién cumple, a qué hora se le escribe y con qué mensaje, editable ahí mismo. Un cliente nuevo entra automáticamente a este seguimiento. Gerencial supervisa y aprueba el mes (ve los montos).
- **Mensajería** — chat simulado por cliente con toggle **Manual / Automático (API)**, más **Mensajes programados** con la plantilla de cumpleaños personalizada y su estado. Algunos clientes ya traen una conversación "sembrada" para mostrar un caso avanzado.
- **Campañas** — **control total para Gerencial** (crear, editar, eliminar; público objetivo natural/corporativo/todos, canal, mensaje — "enviar" es simulado, marca la campaña como enviada a toda la base elegida); Ventas ve la lista, no la edita. KPIs (campañas del año, envíos, alcance promedio), gráfico de envíos por mes y dona de canal más usado.
- **Días Festivos** (solo Gerencial) — fechas comerciales/religiosas/cívicas del grupo (Carnavales, Semana Santa, Día de la Madre, Día del Padre, Fiestas Patrias, aniversario por negocio, 9 de diciembre, Navidad, Año Nuevo), con **CRUD completo** y un botón **"Crear campaña para esta fecha"** que abre el formulario de Campañas ya prellenado con el nombre.
- **Usuarios** (solo Gerencial) — gestión de cuentas: crea, **edita y elimina** cuentas de Ventas para cualquiera de los 3 negocios. Solo las cuentas creadas desde aquí son editables/eliminables — las 5 cuentas base del prototipo se muestran como "Cuenta base", de solo lectura.
- **Mi Equipo** (solo Gerencial) — el detalle de actividad que antes vivía en Usuarios: clientes naturales/corporativos registrados, reservas y pedidos gestionados por cada persona de Ventas (usa el campo `registradoPor` que ya se guarda al crear un cliente, reserva o pedido), comparativo visual de participación y trofeo para quien esté más activo, negocio por negocio.
- **Estrategias** (solo Gerencial) — chat estilo asistente para pedir ideas de campaña, revisar cumpleaños, ticket promedio, reservas, delivery o de dónde vienen los clientes, con chips de sugerencia. Respuestas generadas con los datos reales del negocio activo (`lib/estrategias.ts`), pero **simuladas** — sin API de IA real conectada. Ícono de engranaje para "conectar" un proveedor (OpenAI/Anthropic/Otro); la clave solo se guarda en `localStorage`.

## Estructura del proyecto

```
src/
  app/
    login/               → usuario y contraseña (sesión simulada)
    (app)/                → páginas internas, protegidas por sesión
      dashboard/ clientes/ clientes/[id]/ reservas/ delivery/ hospedaje/
      cumpleanos/ mensajeria/ usuarios/ equipo/ campanas/
      estrategias/ dias-festivos/
  components/
    layout/                → Sidebar (agrupa los módulos por prioridad — Principal /
                              Operación diaria / Relación con el cliente / Gestión —
                              y los oculta según rol y negocio), Topbar (selector de
                              negocio + slot de acción, ej. "Exportar PDF")
    ui/                     → Card, Badge, Table, StatTile, ExportarPDFBoton, Paginacion…
    dashboard/               → PanelEjecutivo (Dirección), PanelGerencial (Gerencial),
                                DashboardNegocio (Ventas), PeriodoSelector
    charts/                   → BarChartSerie, BarChartMensual y DonutChart
                                 (recharts, reutilizables entre módulos)
  lib/
    types.ts                 → modelo de datos (clientes, reservas, usuarios, mensajes,
                                festividades…)
    permissions.ts            → quién ve, edita o autoriza cada módulo — matriz por
                                 RolTipo ("direccion" | "gerencial" | "ventas")
    store.ts                   → acciones simuladas en localStorage (crear/editar/eliminar
                                  usuario, registrar cliente, crear reserva/pedido/campaña,
                                  autorizar reserva, chatear, festividades…)
    frecuencia.ts                → cálculo de "cliente nuevo / ocasional / frecuente /
                                    inactivo" y su distribución agregada por negocio
    metrics.ts                    → KPIs y series para los tableros (Panel Ejecutivo, Panel
                                     Principal), filtrables por periodo o por métrica
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

Reservas, delivery y hospedaje cubren **~13 meses de historial** (antes solo 1-3 meses,
insuficiente para ver patrones por mes) con una **estacionalidad intencional** en
`lib/mock/seed.ts` (`randDiaConPeso`): diciembre es el mes fuerte (fiestas), febrero el más
flojo, y viernes/sábado superan claramente a los días de semana. La semilla del generador
es fija (`mulberry32(20260825)`), así que estos patrones son siempre los mismos — no
cambian entre sesiones ni entre builds.

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

## Feedback de Mijael (documento "Retroalimentación CRM – SFIDA") — completo

Las validaciones de RUC/celular/duplicados, la clasificación Natural/Corporativo, el
enlace directo a WhatsApp, las campañas masivas (segmento + público objetivo + envío
simulado, módulo Campañas) y el calendario de fechas comerciales (módulo Días Festivos,
con botón directo a "crear campaña para esta fecha") ya están implementados.

## Próximo paso

Cuando se conecte Supabase, el punto de entrada es reemplazar `src/lib/mock/*.ts` y los
hooks de `src/lib/store.ts` por las consultas/escrituras equivalentes a la base de datos
real — los componentes y páginas no necesitan cambiar.
