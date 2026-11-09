import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {request} from './game.js';
const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css'};
http.createServer(async(req,res)=>{
  try {
    const path=req.url.split('?')[0];
    if(path==='/api' && req.method==='POST') {
      let body='';
      for await(const chunk of req) {body+=chunk;if(body.length>4096) throw Error('size');}
      const result=request(JSON.parse(body));
      res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(result));return;
    }
    if(!Object.hasOwn(files,path)){res.writeHead(404);res.end();return;}
    const file=await readFile(new URL('./public/'+files[path],import.meta.url));
    res.setHeader('Content-Type',({'/':'text/html','/app.js':'text/javascript','/style.css':'text/css'})[path]+'; charset=utf-8');res.end(file);
  } catch(e){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.message}));}
}).listen(Number(process.env.PORT||3000),'0.0.0.0');
