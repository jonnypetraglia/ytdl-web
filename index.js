const http = require('http');
const { exec } = require("child_process");
const path = require('path');


const PORT = 5000;
const DOWNLOADS_PATH = process.env.YOUTUBE_DL_PATH || '~/Downloads/ytdl';

var server = http.createServer(function (req, res) {
    try{
        if(!require('fs').existsSync(DOWNLOADS_PATH)){
            console.log(`${DOWNLOADS_PATH} does not exist`);
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); 
            res.write("Ain't there");
            res.end();
            return;
        }

        const queryParams = require('url').parse(req.url, true).query;
        if (req.url == '/') {
            console.log(__dirname)
            let contents = require('fs').readFileSync(`${__dirname}/index.html`, 'UTF-8');
            contents = template(contents, {downloads: getDownloadList()});
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); 
            res.write(contents);
            res.end();
        }
        else if (req.url.startsWith("/download?") && req.method == 'GET') {
            if(!queryParams.id){
                console.log(queryParams);
                res.end('Wat');
            }else {
                const sanitizedYtId = queryParams.id.replace(/(["\s'$`\\])/g,'\\$1');
                download(sanitizedYtId, queryParams.audio);
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.write('<p>okay ' + queryParams.id + '</p><p><a href="/">Home</a>');
                res.end();
            }
        
        }
        else{
            res.end('No');
        }
    }catch(error){
        res.writeHead(500);
        res.end(error);
    }
});
server.listen(PORT);
console.log(`Node.js web server at port ${PORT} is running`);
console.log(`Download path: ${DOWNLOADS_PATH}`);

function getDownloadList(){
    return require('fs').readdirSync(DOWNLOADS_PATH).
        filter(_ => _.endsWith('.part')).
        map(filename => path.basename(filename, '.part')).
        map(filename => path.basename(filename, path.extname(filename))).
        map(filename => {
            if(/\.f[0-9]{3}$/.test(filename)){
                return path.basename(filename, path.extname(filename));
            }
            return filename;
        }).
        map(filename => {
            console.log(filename);
            const id = filename.substring(filename.length - 11);
            const name = filename.substring(0, filename.length - 12);
            return {
                name: name,
                id: id
            };
        })
}
function validateYtId(ytId){
    // if(!/^[A-Za-z0-9_-]{11}$/.test(ytId)){
    //     throw 'Nah dude';
    // }
}
function download(ytId, audioOnly){
    validateYtId(ytId);
    let cmd = `cd ${DOWNLOADS_PATH} && youtube-dl "https://www.youtube.com/watch?v=${ytId}"`;
    if(audioOnly){
        cmd = cmd + ' --extract-audio --audio-format mp3'
        console.log('okay downloading audio for' + ytId)
    }else{
        console.log('okay download video for ' + ytId);
    }
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`Finished downloading ${ytId}`);
    })
}
// All glory to John Resig and his fantastic Micro-Templating function.
// https://johnresig.com/blog/javascript-micro-templating/
function template(str, data){
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    var fn = !/\W/.test(str) ?
    cache[str] = cache[str] ||
    template(document.getElementById(str).innerHTML) :
        
    // Generate a reusable function that will serve as a template
    // generator (and which will be cached).
    new Function("obj",
        "var p=[],print=function(){p.push.apply(p,arguments);};" +
        
        // Introduce the data as local variables using with(){}
        "with(obj){p.push('" +
        
        // Convert the template into pure JavaScript
        str
        .replace(/[\r\t\n]/g, " ")
        .split("<%").join("\t")
        .replace(/((^|%>)[^\t]*)'/g, "$1\r")
        .replace(/\t=(.*?)%>/g, "',$1,'")
        .split("\t").join("');")
        .split("%>").join("p.push('")
        .split("\r").join("\\'")
    + "');}return p.join('');");
    
    // Provide some basic currying to the user
    return data ? fn( data ) : fn;
};