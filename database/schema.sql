-- ============================================================
-- GoberVial - Esquema de Base de Datos
-- Plataforma de Auditoría Ciudadana Vial - Magdalena
-- Motor: MySQL 8.0+ | InnoDB | utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS gobervial
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE gobervial;

-- -----------------------------------------------------------
-- 1. Roles del sistema (Ciudadano, Administrador)
-- -----------------------------------------------------------
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 2. Usuarios (Ciudadanos y Administradores)
-- -----------------------------------------------------------
CREATE TABLE usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rol_id INT NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    estado_biometria ENUM('Pendiente', 'Verificada', 'Rechazada') DEFAULT 'Pendiente',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultimo_login DATETIME,
    estado_cuenta BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices de rendimiento
CREATE INDEX idx_usuarios_numero_documento ON usuarios(numero_documento);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol_id ON usuarios(rol_id);
CREATE INDEX idx_usuarios_estado_biometria ON usuarios(estado_biometria);

-- -----------------------------------------------------------
-- 3. Catálogo de Categorías de Daño
-- -----------------------------------------------------------
CREATE TABLE categorias_danio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    icono_marcador VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 4. Catálogo de Estados de Reporte
-- -----------------------------------------------------------
CREATE TABLE estados_reporte (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    color_hex VARCHAR(7) NOT NULL,
    es_estado_final BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 5. Catálogo de Municipios del Magdalena
-- -----------------------------------------------------------
CREATE TABLE municipios_magdalena (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo_dane VARCHAR(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_municipios_codigo_dane ON municipios_magdalena(codigo_dane);

-- -----------------------------------------------------------
-- 6. Reportes de Daños Viales
-- -----------------------------------------------------------
CREATE TABLE reportes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ciudadano_id BIGINT NOT NULL,
    admin_id BIGINT NULL,
    categoria_id INT NOT NULL,
    estado_id INT NOT NULL,
    municipio_id INT NOT NULL,
    nivel_peligro ENUM('Bajo', 'Medio', 'Alto', 'Critico') NOT NULL,
    prioridad_asignada ENUM('Baja', 'Preventiva', 'Urgente') NULL,
    latitud DECIMAL(10,8) NOT NULL,
    longitud DECIMAL(11,8) NOT NULL,
    evidencia_foto_url VARCHAR(255) NOT NULL,
    motivo_rechazo TEXT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ciudadano_id) REFERENCES usuarios(id),
    FOREIGN KEY (admin_id) REFERENCES usuarios(id),
    FOREIGN KEY (categoria_id) REFERENCES categorias_danio(id),
    FOREIGN KEY (estado_id) REFERENCES estados_reporte(id),
    FOREIGN KEY (municipio_id) REFERENCES municipios_magdalena(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices de rendimiento sobre llaves foráneas y filtros comunes
CREATE INDEX idx_reportes_ciudadano_id ON reportes(ciudadano_id);
CREATE INDEX idx_reportes_admin_id ON reportes(admin_id);
CREATE INDEX idx_reportes_categoria_id ON reportes(categoria_id);
CREATE INDEX idx_reportes_estado_id ON reportes(estado_id);
CREATE INDEX idx_reportes_municipio_id ON reportes(municipio_id);
CREATE INDEX idx_reportes_fecha_creacion ON reportes(fecha_creacion);
CREATE INDEX idx_reportes_nivel_peligro ON reportes(nivel_peligro);
CREATE INDEX idx_reportes_prioridad ON reportes(prioridad_asignada);

-- Índice espacial compuesto para consultas de mapa y clustering
CREATE INDEX idx_reportes_coordenadas ON reportes(latitud, longitud);

-- -----------------------------------------------------------
-- 7. Trazabilidad de Cambios de Estado (Auditoría Inmutable)
-- -----------------------------------------------------------
CREATE TABLE trazabilidad_reportes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reporte_id BIGINT NOT NULL,
    estado_anterior_id INT NOT NULL,
    estado_nuevo_id INT NOT NULL,
    usuario_accion_id BIGINT NOT NULL,
    comentario_tecnico TEXT NOT NULL,
    fecha_cambio DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporte_id) REFERENCES reportes(id),
    FOREIGN KEY (estado_anterior_id) REFERENCES estados_reporte(id),
    FOREIGN KEY (estado_nuevo_id) REFERENCES estados_reporte(id),
    FOREIGN KEY (usuario_accion_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices de rendimiento sobre llaves foráneas
CREATE INDEX idx_trazabilidad_reporte_id ON trazabilidad_reportes(reporte_id);
CREATE INDEX idx_trazabilidad_estado_anterior ON trazabilidad_reportes(estado_anterior_id);
CREATE INDEX idx_trazabilidad_estado_nuevo ON trazabilidad_reportes(estado_nuevo_id);
CREATE INDEX idx_trazabilidad_usuario_accion ON trazabilidad_reportes(usuario_accion_id);
CREATE INDEX idx_trazabilidad_fecha_cambio ON trazabilidad_reportes(fecha_cambio);
