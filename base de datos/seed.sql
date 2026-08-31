-- ============================================================================
-- CRM Grupo Las Flores — datos de prueba (para verificar la conexión)
-- ============================================================================
-- Corre este archivo DESPUÉS de schema.sql. Son ~58 filas repartidas entre
-- las 3 sedes, con datos ficticios pero realistas (nombres y distritos de
-- Ayacucho) — alcanza para probar que la conexión funciona y para ver cada
-- pantalla del sistema con contenido real, sin depender de los generadores
-- aleatorios que tenía el prototipo en TypeScript.
--
-- Los IDs de clientes/campañas/festividades/seguimiento son UUIDs fijos y
-- legibles a propósito (a000...01, a000...02, ...) para que sea fácil ver
-- a simple vista qué fila referencia a cuál — en producción, una vez que la
-- app esté conectada, los IDs nuevos los genera Postgres solo
-- (gen_random_uuid(), ya definido como default en schema.sql).
--
-- Las fechas relativas ("hace 9 días", "en 4 días") están ancladas a
-- date '2026-08-25' — el mismo "hoy" fijo que usa el prototipo en
-- src/lib/mock/seed.ts (BASE_DATE) — a propósito, NO a current_date: si se
-- ancla a la fecha real del día en que se corre este archivo, se desalinea
-- con lo que la app considera "hoy" y el módulo de Cumpleaños deja de
-- mostrar nada relevante (nadie "cumple hoy", etc.).
-- ============================================================================

-- --- Negocios ----------------------------------------------------------------
insert into negocios (id, nombre, tipo, operando, color_acento, descripcion_estado) values
  ('las-flores', 'Restaurante Las Flores', 'restaurante', true, '#8c3a25', 'Web propia, en pruebas'),
  ('umaru',      'Hotel Umaru',            'hotel',       true, '#5c7c8c', 'Web gestionada por empresa externa en Lima'),
  ('mamina',     'Mamina Restobar',        'restobar',    true, '#a0522d', 'Restobar, coctelería y gastronomía nocturna');

-- --- Usuarios (las 5 cuentas reales del equipo) -------------------------------
insert into usuarios (id, nombre, nombre_real, cargo, rol_tipo, rol_label, iniciales, usuario, contrasena, negocio_id, creado_por) values
  ('11111111-1111-1111-1111-111111111111', 'Directorio', null, 'Dirección — Grupo Las Flores', 'direccion', 'Dirección', 'D', 'directorio', 'directorio2026', 'las-flores', null),
  ('22222222-2222-2222-2222-222222222222', 'Gerente General', 'Mijail Rodríguez', 'Gerente General — Grupo Las Flores', 'gerencial', 'Gerencial', 'MR', 'gerentegeneral', 'gerentegeneral2026', 'las-flores', null),
  ('33333333-3333-3333-3333-333333333333', 'Ventas Uno', null, 'Ventas — Restaurante Las Flores', 'ventas', 'Ventas', 'VU', 'ventasuno', 'ventasuno2026', 'las-flores', '22222222-2222-2222-2222-222222222222'),
  ('44444444-4444-4444-4444-444444444444', 'Ventas Dos', null, 'Ventas — Restaurante Las Flores', 'ventas', 'Ventas', 'VD', 'ventasdos', 'ventasdos2026', 'las-flores', '22222222-2222-2222-2222-222222222222'),
  ('55555555-5555-5555-5555-555555555555', 'Ventas Tres', null, 'Ventas — Hotel Umaru', 'ventas', 'Ventas', 'VT', 'ventastres', 'ventastres2026', 'umaru', '22222222-2222-2222-2222-222222222222');

-- --- Clientes individuales (15: 8 Las Flores, 5 Umaru, 2 Mamina) --------------
insert into clientes_individuales (id, negocio_id, numero, fecha_registro, nombres, apellidos, fecha_nacimiento, celular, pais, departamento, provincia, distrito, origen, registrado_por) values
  ('a0000000-0000-0000-0000-000000000001', 'las-flores', 1, date '2026-08-25' - 180, 'Rómulo', 'Tinco Vargas', '1988-08-16', '904424820', 'Perú', 'Ayacucho', 'Huamanga', 'San Juan Bautista', 'crm', '33333333-3333-3333-3333-333333333333'),
  ('a0000000-0000-0000-0000-000000000002', 'las-flores', 2, date '2026-08-25' - 165, 'Carmen', 'Ochoa Berrocal', '1990-03-02', '943459580', 'Perú', 'Ayacucho', 'Huamanga', 'Andrés Avelino Cáceres', 'web', null),
  ('a0000000-0000-0000-0000-000000000003', 'las-flores', 3, date '2026-08-25' - 140, 'Wilmer', 'Cárdenas Palomino', '1985-08-24', '979940707', 'Perú', 'Ayacucho', 'Huamanga', 'Carmen Alto', 'crm', '44444444-4444-4444-4444-444444444444'),
  ('a0000000-0000-0000-0000-000000000004', 'las-flores', 4, date '2026-08-25' - 120, 'Rocío', 'Retamozo Valenzuela', '1992-11-30', '976374892', 'Perú', 'Ayacucho', 'Huamanga', 'Huamanga', 'crm', '33333333-3333-3333-3333-333333333333'),
  ('a0000000-0000-0000-0000-000000000005', 'las-flores', 5, date '2026-08-25' - 95, 'Silvia', 'Aguirre Valenzuela', '1979-08-29', '990783543', 'Perú', 'Ayacucho', 'Huamanga', 'Socos', 'web', null),
  ('a0000000-0000-0000-0000-000000000006', 'las-flores', 6, date '2026-08-25' - 70, 'Yolanda', 'Vargas Prado', '1995-01-19', '925889205', 'Perú', 'Ayacucho', 'Huamanga', 'Acocro', 'crm', '44444444-4444-4444-4444-444444444444'),
  ('a0000000-0000-0000-0000-000000000007', 'las-flores', 7, date '2026-08-25' - 40, 'Katherine', 'Sulca Berrocal', '1998-09-06', '972602321', 'Perú', 'Ayacucho', 'Huamanga', 'Jesús Nazareno', 'crm', '33333333-3333-3333-3333-333333333333'),
  ('a0000000-0000-0000-0000-000000000008', 'las-flores', 8, date '2026-08-25' - 10, 'Luis', 'Cárdenas Curi', '1983-08-25', '922048649', 'Perú', 'Ayacucho', 'Huamanga', 'Huamanga', 'web', null),
  ('a0000000-0000-0000-0000-000000000009', 'umaru', 1, date '2026-08-25' - 200, 'Marisol', 'Tinco Rojas', '1991-08-20', '994833408', 'Perú', 'Ayacucho', 'Huamanga', 'Huamanga', 'crm', '55555555-5555-5555-5555-555555555555'),
  ('a0000000-0000-0000-0000-000000000010', 'umaru', 2, date '2026-08-25' - 150, 'Flor', 'Bautista Curi', '1987-04-14', '903104363', 'Perú', 'Ayacucho', 'Huamanga', 'San Juan Bautista', 'web', null),
  ('a0000000-0000-0000-0000-000000000011', 'umaru', 3, date '2026-08-25' - 100, 'Franklin', 'Rojas Vargas', '1994-08-20', '999029412', 'Perú', 'Ayacucho', 'Huamanga', 'Socos', 'crm', '55555555-5555-5555-5555-555555555555'),
  ('a0000000-0000-0000-0000-000000000012', 'umaru', 4, date '2026-08-25' - 60, 'Rómulo', 'Vargas Cárdenas', '1989-08-26', '986300477', 'Perú', 'Ayacucho', 'Huamanga', 'Andrés Avelino Cáceres', 'web', null),
  ('a0000000-0000-0000-0000-000000000013', 'umaru', 5, date '2026-08-25' - 20, 'Estefanía', 'Cconislla Chávez', '1996-09-02', '938106226', 'Perú', 'Ayacucho', 'Huamanga', 'Carmen Alto', 'crm', '55555555-5555-5555-5555-555555555555'),
  ('a0000000-0000-0000-0000-000000000014', 'mamina', 1, date '2026-08-25' - 45, 'Percy', 'Escobar Bautista', '1993-09-12', '914892146', 'Perú', 'Ayacucho', 'Huamanga', 'Jesús Nazareno', 'web', null),
  ('a0000000-0000-0000-0000-000000000015', 'mamina', 2, date '2026-08-25' - 15, 'Milagros', 'Cárdenas Ccanto', '1997-08-30', '926000986', 'Perú', 'Ayacucho', 'Huamanga', 'Acocro', 'crm', '22222222-2222-2222-2222-222222222222');

-- --- Clientes corporativos (7: 4 Las Flores, 2 Umaru, 1 Mamina) ---------------
insert into clientes_corporativos (id, negocio_id, numero, fecha_registro, razon_social, ruc, direccion, celular, fecha_aniversario, nombre_representante, cargo_representante, pais, departamento, provincia, distrito, registrado_por) values
  ('b0000000-0000-0000-0000-000000000001', 'las-flores', 1, date '2026-08-25' - 300, 'Constructora Wari S.A.C.', '20964940491', 'Jr. Berrocal 245, Huamanga, Ayacucho', '909130634', '2010-05-14', 'Franklin', 'Gerente General', 'Perú', 'Ayacucho', 'Huamanga', 'Huamanga', '33333333-3333-3333-3333-333333333333'),
  ('b0000000-0000-0000-0000-000000000002', 'las-flores', 2, date '2026-08-25' - 260, 'Colegio Particular Santa Rosa', '20235637072', 'Jr. Cárdenas 118, San Juan Bautista, Ayacucho', '943547116', '1998-03-20', 'Rómulo', 'Administrador', 'Perú', 'Ayacucho', 'Huamanga', 'San Juan Bautista', null),
  ('b0000000-0000-0000-0000-000000000003', 'las-flores', 3, date '2026-08-25' - 200, 'Textiles Huamanga S.A.C.', '20632263817', 'Jr. Retamozo 530, Carmen Alto, Ayacucho', '985594326', '2015-11-02', 'Yesenia', 'Jefe de Recursos Humanos', 'Perú', 'Ayacucho', 'Huamanga', 'Carmen Alto', '44444444-4444-4444-4444-444444444444'),
  ('b0000000-0000-0000-0000-000000000004', 'las-flores', 4, date '2026-08-25' - 90, 'Panificadora Ayacuchana S.A.C.', '20599190535', 'Jr. Espinoza 402, Andrés Avelino Cáceres, Ayacucho', '940881535', '2005-07-19', 'Julio César', 'Gerente General', 'Perú', 'Ayacucho', 'Huamanga', 'Andrés Avelino Cáceres', null),
  ('b0000000-0000-0000-0000-000000000005', 'umaru', 1, date '2026-08-25' - 220, 'Minera Sur del Perú S.A.C.', '20240779610', 'Av. Cáceres 890, Jesús Nazareno, Ayacucho', '921119101', '2012-09-08', 'Estefanía', 'Asistente de Gerencia', 'Perú', 'Ayacucho', 'Huamanga', 'Jesús Nazareno', '55555555-5555-5555-5555-555555555555'),
  ('b0000000-0000-0000-0000-000000000006', 'umaru', 2, date '2026-08-25' - 130, 'Distribuidora Central del Sur S.A.C.', '20236506583', 'Jr. Loayza 275, Huamanga, Ayacucho', '992953216', '2008-01-25', 'Alberto', 'Gerente General', 'Perú', 'Ayacucho', 'Huamanga', 'Huamanga', null),
  ('b0000000-0000-0000-0000-000000000007', 'mamina', 1, date '2026-08-25' - 50, 'Municipalidad Distrital de Jesús Nazareno', '20753876894', 'Plaza Principal s/n, Jesús Nazareno, Ayacucho', '990151085', '1985-12-01', 'Carmen', 'Administrador', 'Perú', 'Ayacucho', 'Huamanga', 'Jesús Nazareno', null);

-- --- Días festivos y fechas comerciales (11, fijas para todo el año) ---------
insert into festividades (id, nombre, mes_dia, tipo, alcanza_todas, negocio_ids, descripcion) values
  ('d0000000-0000-0000-0000-000000000001', 'Año Nuevo', '01-01', 'civico', true, null, null),
  ('d0000000-0000-0000-0000-000000000002', 'Día del Amor y la Amistad', '02-14', 'comercial', true, null, null),
  ('d0000000-0000-0000-0000-000000000003', 'Carnaval', '03-05', 'comercial', true, null, null),
  ('d0000000-0000-0000-0000-000000000004', 'Semana Santa', '04-02', 'religioso', true, null, 'Fecha aproximada — se mueve cada año.'),
  ('d0000000-0000-0000-0000-000000000005', 'Día de la Madre', '05-10', 'comercial', true, null, null),
  ('d0000000-0000-0000-0000-000000000006', 'Día del Padre', '06-21', 'comercial', true, null, null),
  ('d0000000-0000-0000-0000-000000000007', 'Fiestas Patrias', '07-28', 'civico', true, null, null),
  ('d0000000-0000-0000-0000-000000000008', 'Aniversario Hotel Umaru', '10-05', 'comercial', false, array['umaru'], null),
  ('d0000000-0000-0000-0000-000000000009', 'Aniversario Restaurante Las Flores', '10-05', 'comercial', false, array['las-flores'], null),
  ('d0000000-0000-0000-0000-000000000010', '9 de diciembre — Batalla de Ayacucho', '12-09', 'civico', true, null, null),
  ('d0000000-0000-0000-0000-000000000011', 'Navidad', '12-25', 'religioso', true, null, null);

-- --- Campañas (5: histórico ya enviado + un borrador nuevo) -------------------
insert into campanas (id, alcanza_todas, negocio_ids, nombre, publico, mensaje, estado, creada_en, aprobada_en, clientes_objetivo, contactados, registrado_por) values
  ('c0000000-0000-0000-0000-000000000001', false, array['las-flores'], 'Bienvenida a nuevos clientes', 'natural',
   '¡Bienvenido/a a la familia! Como agradecimiento por registrarte, tienes un postre de cortesía en tu próxima visita 🌸',
   'aprobada', date '2026-08-25' - 153, date '2026-08-25' - 150,
   array['a0000000-0000-0000-0000-000000000001'::uuid,'a0000000-0000-0000-0000-000000000002'::uuid,'a0000000-0000-0000-0000-000000000003'::uuid,'a0000000-0000-0000-0000-000000000004'::uuid],
   array['a0000000-0000-0000-0000-000000000001'::uuid,'a0000000-0000-0000-0000-000000000002'::uuid,'a0000000-0000-0000-0000-000000000003'::uuid],
   null),
  ('c0000000-0000-0000-0000-000000000002', false, array['las-flores'], 'Reactivación fin de semana', 'natural',
   'Te extrañamos por acá — este fin de semana tenemos una carta especial. ¿Nos visitas?',
   'aprobada', date '2026-08-25' - 23, date '2026-08-25' - 20,
   array['a0000000-0000-0000-0000-000000000005'::uuid,'a0000000-0000-0000-0000-000000000006'::uuid,'a0000000-0000-0000-0000-000000000007'::uuid,'a0000000-0000-0000-0000-000000000008'::uuid],
   array['a0000000-0000-0000-0000-000000000005'::uuid,'a0000000-0000-0000-0000-000000000006'::uuid],
   '33333333-3333-3333-3333-333333333333'),
  ('c0000000-0000-0000-0000-000000000003', false, array['las-flores'], 'Promoción de temporada', 'todos',
   'Este mes tenemos una promoción especial — 2x1 en platos seleccionados de lunes a jueves. ¡Te esperamos!',
   'borrador', date '2026-08-25' - 2, null, null, '{}', '44444444-4444-4444-4444-444444444444'),
  ('c0000000-0000-0000-0000-000000000004', false, array['umaru'], 'Oferta para empresas', 'corporativo',
   'Para tu próximo evento corporativo tenemos un paquete especial con descuento por volumen. Escríbenos y te armamos una propuesta.',
   'aprobada', date '2026-08-25' - 63, date '2026-08-25' - 60,
   array['b0000000-0000-0000-0000-000000000005'::uuid,'b0000000-0000-0000-0000-000000000006'::uuid],
   array['b0000000-0000-0000-0000-000000000005'::uuid],
   '55555555-5555-5555-5555-555555555555'),
  ('c0000000-0000-0000-0000-000000000005', true, null, 'Aniversario del grupo', 'todos',
   '¡Estamos de aniversario! Ven a celebrar con nosotros y aprovecha los descuentos especiales de la semana.',
   'borrador', date '2026-08-25' - 1, null, null, '{}', '22222222-2222-2222-2222-222222222222');

-- --- Seguimiento de cumpleaños (8: 5 Las Flores, 3 Umaru) --------------------
-- fecha_cumple coincide con el mes-día de fecha_nacimiento del cliente
-- correspondiente (arriba) — una de ellas cae justo hoy (2026-08-25), para
-- que apenas se conecte la app ya haya "alguien de cumpleaños hoy" con quien
-- probar el envío automático (ver AutoEnvioCumpleanos).
insert into seguimiento_cumpleanos (id, negocio_id, cliente_id, cliente_tipo, nombre, fecha_cumple, celular, saludo_enviado, reservacion) values
  ('e0000000-0000-0000-0000-000000000001', 'las-flores', 'a0000000-0000-0000-0000-000000000001', 'individual', 'Rómulo Tinco Vargas', date '2026-08-25' - 9, '904424820', true, 'si'),
  ('e0000000-0000-0000-0000-000000000002', 'las-flores', 'a0000000-0000-0000-0000-000000000003', 'individual', 'Wilmer Cárdenas Palomino', date '2026-08-25' - 1, '979940707', true, 'no'),
  ('e0000000-0000-0000-0000-000000000003', 'las-flores', 'a0000000-0000-0000-0000-000000000005', 'individual', 'Silvia Aguirre Valenzuela', date '2026-08-25' + 4, '990783543', false, 'pendiente'),
  ('e0000000-0000-0000-0000-000000000004', 'las-flores', 'a0000000-0000-0000-0000-000000000007', 'individual', 'Katherine Sulca Berrocal', date '2026-08-25' + 12, '972602321', false, 'pendiente'),
  ('e0000000-0000-0000-0000-000000000005', 'las-flores', 'a0000000-0000-0000-0000-000000000008', 'individual', 'Luis Cárdenas Curi', date '2026-08-25', '922048649', false, 'pendiente'),
  ('e0000000-0000-0000-0000-000000000006', 'umaru', 'a0000000-0000-0000-0000-000000000009', 'individual', 'Marisol Tinco Rojas', date '2026-08-25' - 5, '994833408', true, 'si'),
  ('e0000000-0000-0000-0000-000000000007', 'umaru', 'a0000000-0000-0000-0000-000000000012', 'individual', 'Rómulo Vargas Cárdenas', date '2026-08-25' + 1, '986300477', false, 'pendiente'),
  ('e0000000-0000-0000-0000-000000000008', 'umaru', 'a0000000-0000-0000-0000-000000000013', 'individual', 'Estefanía Cconislla Chávez', date '2026-08-25' + 8, '938106226', false, 'pendiente');

-- --- Aprobación del mes en curso (las-flores aprobado, umaru pendiente) ------
-- Mamina no tiene el saludo automático operando todavía (no tiene cuenta de
-- Ventas propia asignada), por eso no lleva fila acá.
insert into aprobacion_cumpleanos_mes (negocio_id, anio, mes, aprobado, aprobado_en) values
  ('las-flores', extract(year from date '2026-08-25')::int, extract(month from date '2026-08-25')::int, true, now()),
  ('umaru', extract(year from date '2026-08-25')::int, extract(month from date '2026-08-25')::int, false, null);

-- --- Configuración general del saludo automático ------------------------------
insert into config_saludo_cumpleanos (negocio_id, mensaje, hora) values
  ('las-flores', '¡Feliz cumpleaños, {nombre}! 🌸 De parte de todo el equipo de {negocio} te deseamos un día increíble. Tienes un 20% de descuento esperándote en tu próxima visita — cuéntanos si quieres reservar y te ayudamos con gusto.', '09:00'),
  ('umaru', '¡Feliz cumpleaños, {nombre}! 🌸 De parte de todo el equipo de {negocio} te deseamos un día increíble. Tienes un 20% de descuento esperándote en tu próxima visita — cuéntanos si quieres reservar y te ayudamos con gusto.', '09:00');
