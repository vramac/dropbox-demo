let jot = require('json-over-tcp')
let tarStream = require('tar-stream')
let request = require('request')
let path = require('path')
let rimraf = require('rimraf')
let fs = require('fs')
let mkdirp = require('mkdirp')
let serverPort = 8001
let argv = require('yargs').argv
require('songbird')

const ROOT_DIR = argv.dir || path.resolve(process.cwd())

let socket = jot.connect(serverPort)

socket.on('connect', function() { 
	console.log("Client Connected")

	//Don't send until we're connected
    socket.write({question: "Hello, world?"})
})

let options = {
    url: 'http://127.0.0.1:8000/',
    headers: {'Accept': 'application/x-gtar'}
}

let extract = tarStream.extract()

request(options).pipe(extract)
 
extract.on('finish', function() {
    console.log("Finished extracting...")
  // all entries read 
})


socket.on('data', function(data) {

    console.log("Getting data from server..." )

    // Output the answer property of the server's message to the console 
    console.log("Data action: " + data.action)
    
    if (data.action === 'write') {
        console.log("Data path: " + data.path)
        console.log("Data type: " + data.type)
        
        let url = 'http://127.0.0.1:8000/' + data.path
        console.log("URL: " + url)

        //Lets define a write stream for our destination file
        let filePath = path.join(ROOT_DIR,data.path)

        async () => {
            
            if (data.type === 'dir') {
                console.log("dir path: " + filePath)
                await mkdirp.promise(filePath)
            }
            else {
                let destination = fs.createWriteStream(filePath);
                console.log("file path: " + filePath)
                fs.promise.truncate(filePath,0)
                request(url).pipe(destination)
            } 
        }().catch()

        // if (data.Type === 'dir') {

        // }
        // else {
        //     let destination = fs.createWriteStream(filePath);
        //     console.log("filePath: " + filePath)

        //     fs.promise.truncate(filePath,0)
        //     request(url).pipe(destination)
        // }
    }

    if (data.action === 'delete') {
        console.log("Data path: " + data.path)
        console.log("Data type: " + data.type)
        let filePath = path.join(ROOT_DIR,data.path)
        async () => {
            if (data.type === 'dir') {
                await rimraf.promise(filePath)
            }
            else {
                await fs.promise.unlink(filePath)
            }
        }().catch()
    }
})