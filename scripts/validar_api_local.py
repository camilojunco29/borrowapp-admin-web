import sys, os, json, secrets, argparse, tempfile
from pathlib import Path
from datetime import datetime, timedelta
sys.dont_write_bytecode=True
parser=argparse.ArgumentParser(description='Pruebas locales de la API BorrowApp; nunca usa un servidor remoto.')
parser.add_argument('--backend',required=True,help='Carpeta del backend existente que contiene app/main.py')
parser.add_argument('--output',help='Carpeta externa al backend para guardar evidencias')
args=parser.parse_args()
backend=Path(args.backend).resolve()
root=Path(args.output).resolve() if args.output else Path(tempfile.mkdtemp(prefix='borrowapp-evidencias-'))
if root==backend or backend in root.parents: raise SystemExit('Usa una carpeta de salida fuera del backend original.')
if not (backend/'app/main.py').is_file(): raise SystemExit('No se encontró app/main.py en --backend')
root.mkdir(parents=True,exist_ok=True)
sys.path.insert(0,str(backend))
os.environ['DATABASE_URL']='sqlite:///'+str(root/('validacion_'+secrets.token_hex(6)+'.db')).replace('\\','/')
os.environ['SECRET_KEY']=secrets.token_urlsafe(48)
os.environ['CLAVE_SECRETA']=os.environ['SECRET_KEY']
os.environ['CARGAR_DATOS_EJEMPLO']='false'
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base,engine
from app import models
client=TestClient(app)
checks=[]
def req(method,path,token=None,data=None,status=200):
    response=client.request(method,path,headers={'Authorization':'Bearer '+token} if token else {},json=data)
    if response.status_code!=status: raise AssertionError(f'{method} {path}: {response.status_code} != {status}; {response.text}')
    return response.json() if response.content else None
def check(name,ok):
    assert ok,name
    checks.append({'prueba':name,'resultado':'aprobada'})
def register(name):
    password=secrets.token_urlsafe(18)
    mail=name.lower().replace(' ','')+'@example.invalid'
    result=req('POST','/api/v1/auth/register',data={'nombre':name,'correo':mail,'contrasena':password},status=201)
    logged=req('POST','/api/v1/auth/login',data={'correo':mail,'contrasena':password})
    check('Registro e inicio de sesión local: '+name,logged['usuario']['id']==result['usuario']['id'])
    return result['access_token'], result['usuario']['id']
a,aid=register('Admin Prueba'); b,bid=register('Solicitante Prueba'); c,cid=register('Prestador Prueba'); d,did=register('Externo Prueba')
req('GET','/api/v1/auth/me',status=401); check('Perfil sin token rechazado',True)
org=req('POST','/api/v1/organizations',a,{'nombre':'Comunidad de prueba local','tipo':'UNIVERSIDAD','punto_central':'Biblioteca original','identificador_interno':'ADMIN-TEST'},201); oid=org['id']
check('Código único de cinco caracteres y creador administrador',len(org['codigo'])==5 and org['membresia']['rol']=='ADMINISTRADOR')
for token in [b,c]:
    preview=req('GET','/api/v1/organizations/by-code/'+org['codigo'],token)
    membership=req('POST',f'/api/v1/organizations/{oid}/join',token,{'identificador_interno':'TEST'},201)
    check('Unión mediante código local',preview['id']==oid and membership['organizacion_id']==oid)
req('GET',f'/api/v1/organizations/{oid}/needs',d,status=403);check('Aislamiento entre organizaciones para no miembros',True)
start=(datetime.now()+timedelta(days=1)).replace(microsecond=0);end=start+timedelta(days=2)
def need(token,obj='Taladro prueba'):
    return req('POST',f'/api/v1/organizations/{oid}/needs',token,{'organizacion_id':oid,'objeto':obj,'descripcion':'Necesidad ficticia exclusivamente local.','fecha_inicio':start.isoformat(),'fecha_fin':end.isoformat()},201)
n=need(b); nid=n['id'];check('Publicación con estado inicial correcto',n['estado']=='BUSCANDO_PRESTADOR')
o1=req('POST',f'/api/v1/needs/{nid}/offers',c,{'necesidad_id':nid,'modalidad':'GRATIS','fecha_entrega':start.isoformat()},201)
o2=req('POST',f'/api/v1/needs/{nid}/offers',a,{'necesidad_id':nid,'modalidad':'ALQUILER','precio':10000,'unidad_cobro':'DIA','fecha_entrega':start.isoformat()},201)
check('Ofertas gratuitas y alquiler por día',o1['total_calculado']==0 and o2['total_calculado']==20000)
req('POST',f"/api/v1/offers/{o1['id']}/accept",c,status=403);check('Solo solicitante acepta ofertas',True)
loan=req('POST',f"/api/v1/offers/{o1['id']}/accept",b);lid=loan['id']
offers=req('GET',f'/api/v1/needs/{nid}/offers',b)
check('Aceptación crea préstamo y cierra ofertas alternativas',loan['estado']=='CONFIRMADO' and sum(o['estado']=='ACEPTADA' for o in offers)==1 and any(o['estado']=='CERRADA' for o in offers))
req('POST',f'/api/v1/loans/{lid}/confirm-received',b,status=400);check('No se puede confirmar recepción antes de entrega',True)
req('POST',f'/api/v1/loans/{lid}/mark-delivered',b,status=403);check('Solo el prestador marca entrega',True)
p=req('POST',f'/api/v1/loans/{lid}/mark-delivered',c);check('Primera confirmación de entrega',p['estado']=='ENTREGA_PENDIENTE')
p=req('POST',f'/api/v1/loans/{lid}/confirm-received',b);check('Segunda confirmación activa préstamo',p['estado']=='ACTIVO')
report=req('POST',f'/api/v1/loans/{lid}/reports',c,{'tipo':'DANADO','descripcion':'Reporte ficticio para verificar el flujo local.'},201);rid=report['id']
check('Reporte en curso pendiente',report['estado']=='PENDIENTE')
req('POST',f'/api/v1/reports/{rid}/resolve',b,{'sancion':'ADVERTENCIA','nota_resolucion':'No autorizado'},403);check('Resolver reporte exige administrador',True)
resolved=req('POST',f'/api/v1/reports/{rid}/resolve',a,{'sancion':'SUSPENSION','sancion_hasta':(datetime.now()+timedelta(days=3)).isoformat(),'nota_resolucion':'Sanción ficticia de prueba.'})
check('Resolución de reporte aplica sanción',resolved['estado']=='RESUELTO')
req('POST',f'/api/v1/organizations/{oid}/needs',b,{'objeto':'Objeto bloqueado','descripcion':'Esta acción debe bloquearse.','fecha_inicio':start.isoformat(),'fecha_fin':end.isoformat()},403);check('Sancionado no publica nuevas necesidades',True)
p=req('POST',f'/api/v1/loans/{lid}/mark-returned',b);check('Sanción no impide devolver un préstamo previo',p['estado']=='DEVOLUCION_PENDIENTE')
p=req('POST',f'/api/v1/loans/{lid}/confirm-returned',c);check('Doble confirmación de devolución finaliza préstamo',p['estado']=='FINALIZADO')
reverted=req('POST',f'/api/v1/organizations/{oid}/members/{bid}/revert-sanction',a);check('Reversión restaura membresía',reverted['estado']=='ACTIVO')
updated=req('PATCH',f'/api/v1/organizations/{oid}/central-point',a,{'punto_central':'Biblioteca nueva'})
old=req('GET',f'/api/v1/loans/{lid}',a);check('Modificar punto central conserva acuerdo anterior',updated['punto_central']=='Biblioteca nueva' and old['punto_central']=='Biblioteca original')
n2=need(b,'Objeto para cancelar');offer=req('POST',f"/api/v1/needs/{n2['id']}/offers",c,{'modalidad':'GRATIS','fecha_entrega':start.isoformat()},201)
cancelled=req('POST',f"/api/v1/needs/{n2['id']}/cancel",b);closed=req('GET',f"/api/v1/needs/{n2['id']}/offers",b)
check('Cancelar necesidad cierra ofertas pendientes',cancelled['estado']=='CERRADA' and all(o['estado']=='CERRADA' for o in closed))
org2=req('POST','/api/v1/organizations',b,{'nombre':'Segunda comunidad','tipo':'EMPRESA','punto_central':'Recepción','identificador_interno':'ADM-2'},201)
check('Múltiples organizaciones con membresías independientes',len(req('GET','/api/v1/organizations/my-memberships',b))==2)
privacy=client.get(f'/api/v1/organizations/{oid}/reports',headers={'Authorization':'Bearer '+b}).status_code
sample=models.Necesidad(organizacion_id=oid,solicitante_id=bid,objeto='Precio',descripcion='Caso fracción de día',fecha_inicio=start,fecha_fin=start+timedelta(hours=36))
from app.api.routes.offers import calcular_total_oferta
actual=calcular_total_oferta(sample,models.Modalidad.ALQUILER,1000,models.UnidadCobro.HORA)
result={'fecha':'2026-11-19','entorno':'TestClient local + SQLite aislado; sin peticiones a producción','pruebas':checks,'total_aprobadas':len(checks),'hallazgos':[{'id':'H-01','detalle':'Listado de reportes admite miembro no administrador','codigo_observado':privacy},{'id':'H-02','detalle':'Tarifa por hora usa días enteros multiplicados por 24','horas_solicitadas':36,'total_esperado':36000,'total_observado':actual}],'limites':['No es una prueba de carga ni de concurrencia.','No ejecuta la interfaz Flutter.','No valida los scripts directamente en un servidor PostgreSQL.']}
(root/'validacion_api_local.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')

print(json.dumps({'pruebas_aprobadas':len(checks),'evidencia':str(root/'validacion_api_local.json'),'hallazgos':result['hallazgos']},ensure_ascii=False,indent=2))
