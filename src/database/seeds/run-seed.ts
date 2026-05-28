import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function runSeeds(): Promise<void> {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gobervial',
    multipleStatements: true,
  });

  console.log('Connected to MySQL database.');

  const seedPath = path.resolve(__dirname, 'seed.sql');
  const seedSql = fs.readFileSync(seedPath, 'utf-8');

  console.log('Executing seed data...');
  await connection.query(seedSql);
  console.log('Seed data inserted successfully.');

  console.log('\nSummary:');
  console.log('  2 roles (Ciudadano, Administrador)');
  console.log('  5 estados de reporte (Pendiente, En Revision, En Proceso, Resuelto, Rechazado)');
  console.log('  6 categorias de danio (Bache, Inundacion, Via Destapada, Hundimiento, Senalizacion, Semaforo)');
  console.log('  31 municipios del Magdalena');

  await connection.end();
  console.log('\nSeed completed.');
}

runSeeds().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
