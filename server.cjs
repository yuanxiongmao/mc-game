const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const files=new Set(['index.html','style.css','data.js','version-groups.js','core.js','catalog.js','block-images.js','app.js']);
for(const file of fs.readdirSync(path.join(__dirname,'assets/blocks')))if(/^[a-z0-9_]+\.(png|gif|svg)$/.test(file))files.add('assets/blocks/'+file);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.gif':'image/gif','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');const file=url.pathname==='/'?'index.html':url.pathname.slice(1);if(!files.has(file)){res.writeHead(404);res.end('Not found');return;}fs.readFile(path.join(__dirname,file),(err,body)=>{if(err){res.writeHead(500);res.end('Unable to read file');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-cache'});res.end(body);});});
server.listen(4173,'127.0.0.1',()=>console.log('方块侦探：http://127.0.0.1:4173'));
server.on('error',err=>{console.error(err.code==='EADDRINUSE'?'4173 端口已被占用。请关闭占用程序，或直接双击 index.html 游玩。':err.message);process.exitCode=1;});
