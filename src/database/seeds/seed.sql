-- ============================================================
-- GoberVial - Datos Semilla para Catálogos del Magdalena
-- ============================================================

-- ============================================
-- 1. Roles del sistema
-- ============================================
INSERT INTO roles (id, nombre, descripcion) VALUES
(1, 'Ciudadano', 'Usuario ciudadano que reporta daños viales'),
(2, 'Administrador', 'Usuario administrador que gestiona reportes y realiza triage');

-- ============================================
-- 2. Estados de Reporte (con colores para pines del mapa)
-- ============================================
INSERT INTO estados_reporte (id, nombre, color_hex, es_estado_final) VALUES
(1, 'Pendiente',   '#F59E0B', FALSE),
(2, 'En Revision', '#3B82F6', FALSE),
(3, 'En Proceso',  '#8B5CF6', FALSE),
(4, 'Resuelto',    '#10B981', TRUE),
(5, 'Rechazado',   '#EF4444', TRUE);

-- ============================================
-- 3. Categorias de Danio Vial
-- ============================================
INSERT INTO categorias_danio (id, nombre, descripcion, icono_marcador) VALUES
(1, 'Bache / Hueco',
    'Deterioro del pavimento que forma un hundimiento o agujero en la via',
    'marker-bache.svg'),
(2, 'Inundacion / Alcantarillado',
    'Acumulacion de agua por obstruccion del sistema de alcantarillado o drenaje',
    'marker-inundacion.svg'),
(3, 'Via Destapada',
    'Via sin pavimentar, con grava, tierra o material suelto que dificulta el transito',
    'marker-destapada.svg'),
(4, 'Hundimiento',
    'Depresion significativa en la superficie de la via por falla del terreno',
    'marker-hundimiento.svg'),
(5, 'Senalizacion Danada',
    'Senales de transito rotas, ausentes o en mal estado',
    'marker-senalizacion.svg'),
(6, 'Semaforo Danado',
    'Semaforo que no funciona o funciona de manera intermitente',
    'marker-semaforo.svg');

-- ============================================
-- 4. Municipios del Magdalena (30 municipios + Distrito Santa Marta)
-- ============================================
INSERT INTO municipios_magdalena (id, nombre, codigo_dane) VALUES
(1,  'Santa Marta',              '47001'),
(2,  'Algarrobo',                '47030'),
(3,  'Aracataca',                '47053'),
(4,  'Ariguani',                 '47058'),
(5,  'Cerro de San Antonio',     '47161'),
(6,  'Chibolo',                  '47170'),
(7,  'Chivolo',                  '47175'),
(8,  'Cienaga',                  '47189'),
(9,  'Concordia',                '47205'),
(10, 'El Banco',                 '47245'),
(11, 'El Pinon',                 '47258'),
(12, 'El Reten',                 '47268'),
(13, 'Fundacion',                '47288'),
(14, 'Guamal',                   '47318'),
(15, 'Nueva Granada',            '47460'),
(16, 'Pedraza',                  '47541'),
(17, 'Pijino del Carmen',        '47545'),
(18, 'Pivijay',                  '47551'),
(19, 'Plato',                    '47555'),
(20, 'Puebloviejo',              '47570'),
(21, 'Remolino',                 '47605'),
(22, 'Sabanas de San Angel',     '47660'),
(23, 'Salamina',                 '47675'),
(24, 'San Sebastian de Buenavista', '47692'),
(25, 'San Zenon',                '47703'),
(26, 'Santa Ana',                '47707'),
(27, 'Santa Barbara de Pinto',   '47720'),
(28, 'Sitionuevo',               '47745'),
(29, 'Tenerife',                 '47798'),
(30, 'Zapayan',                  '47960'),
(31, 'Zona Bananera',            '47980');
