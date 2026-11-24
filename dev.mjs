import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const base=path.dirname(fileURLToPath(import.meta.url));
// Bez papildus pakotnēm nolasām vienkāršu .env.local konfigurāciju.
try {
  const content=await fs.readFile(path.join(base,'.env.local'),'utf8');
  for(const raw of content.split(/\r?\n/)) {
    const line=raw.trim();
    if(!line||line.startsWith('#'))continue;
    const i=line.indexOf('=');if(i<1)continue;
    const name=line.slice(0,i).trim();let value=line.slice(i+1).trim();
    if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);
    if(!process.env[name])process.env[name]=value;
  }
} catch(e) {if(e.code!=='ENOENT')throw e;}
const {handler}=await import('./src/core.js');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer(async(req,res)=> {
  const pathName=new URL(req.url,'http://localhost').pathname;
  if(pathName==='/api/index'||pathName==='/api')return handler(req,res);
  const files={'/':'index.html','/index.html':'index.html','/styles.css':'styles.css','/app.js':'app.js'};
  const file=files[pathName];
  if(!file){res.writeHead(404);return res.end('Not Found');}
  try {const contents=await fs.readFile(path.join(base,'public',file));res.writeHead(200,{'Content-Type':mime[path.extname(file)],'Cache-Control':'no-store'});res.end(contents);}
  catch {res.writeHead(500);res.end('Failed to load');}
});
const PORT=Number(process.env.PORT||3000);
server.listen(PORT,'127.0.0.1',()=>console.log(`\nTicketLab → http://127.0.0.1:${PORT}\nLokālais skolotājs: ${process.env.ADMIN_USERNAME||'skolotajs'}\nLokālais klases PIN: ${process.env.CLASS_PIN||'DB2026'}\nTikai lokālai demonstrācijai, pirms publicēšanas nomaini visas paroles!\n`));
