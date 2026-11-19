import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('.',import.meta.url);
const directory=new URL('../database/',root);
const db=new PGlite();
await db.exec(fs.readFileSync(new URL('01_creacion_tablas.sql',directory),'utf8'));
await db.exec(fs.readFileSync(new URL('02_datos_prueba.sql',directory),'utf8'));
const results=await db.exec(fs.readFileSync(new URL('03_consultas_verificacion.sql',directory),'utf8'));
const expected={usuarios:3,organizaciones:2,membresias:5,necesidades:2,ofertas:2,prestamos:1,reportes:1};
for(const {tabla,filas} of results[0].rows) assert.equal(Number(filas),expected[tabla]);
assert.equal(results[1].rows.length,0);assert.equal(results[2].rows.length,0);
const tests=[];
for(const [name,sql,code] of [
 ['Unicidad de membresía',"INSERT INTO membresias(id,usuario_id,organizacion_id,rol,estado,identificador_interno) VALUES(2000,1002,1001,'MIEMBRO','ACTIVO','REPETIDO')",'23505'],
 ['Una oferta aceptada por necesidad',"INSERT INTO ofertas(id,necesidad_id,prestador_id,modalidad,fecha_entrega,estado) VALUES(2000,1001,1001,'GRATIS',CURRENT_TIMESTAMP,'ACEPTADA')",'23505'],
 ['Integridad referencial',"INSERT INTO organizaciones(id,nombre,tipo,codigo,punto_central,creada_por) VALUES(2000,'Prueba','EMPRESA','Z9Y8X','Local',99999)",'23503']
]) {
 let observed;try{await db.query(sql);}catch(error){observed=error.code;}
 assert.equal(observed,code);tests.push({prueba:name,resultado:'aprobada',sqlstate:observed});
}
const record={fecha:'2026-11-19',entorno:'PostgreSQL embebido PGlite (WASM), memoria local, sin conexión remota',ejecucion_scripts:'correcta',conteos:expected,restricciones:tests,limite:'No sustituye una ejecución de despliegue en el servidor PostgreSQL de producción.'};
fs.writeFileSync(new URL('evidencias/validacion_postgresql_local.json',root),JSON.stringify(record,null,2));
await db.close();console.log(JSON.stringify(record));
