let fs = require('fs')
let path = require('path')
let express = require('express')
let morgan = require('morgan')
let nodeify = require('bluebird-nodeify')
let mime = require('mime-types')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')
let jot = require('json-over-tcp')
let serverPort = 8001
let archiver = require('archiver')


let argv = require('yargs').argv

require('songbird')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
const ROOT_DIR = argv.dir || path.resolve(process.cwd())

let app = express()

app.use(morgan('dev'))

app.listen(PORT, ()=> console.log(`Listening @ http://127.0.0.1:${PORT}`))

let tcpServer = jot.createServer(serverPort)

let clientSocket = []

let chokidar = require('chokidar')

// start listening for TCP connections
tcpServer.listen(serverPort, ()=> console.log(`TCP Server listerning on ${serverPort}`))

tcpServer.on('connection', newConnectionHandler);

// One-liner for current directory, ignores .dotfiles 
chokidar.watch('.', {ignored: /[\/\\]\./})
.on('all', (event, relPath) => {
    //console.log("Event: " + event, "Path:" + relPath)
    let hasExtn = path.extname(relPath) !== ''
	let endsWithSlash = relPath.charAt(relPath.length-1)  === path.separator
	let isDir = endsWithSlash || !hasExtn
    if (event === 'add' || event === 'addDir') {
    	if (clientSocket[0]) {
    		console.log("Valid Event: " + event +", path: "  + relPath)
    		if (isDir) {
    			console.log("Adding a dir")
    			clientSocket[0].write({ "action": "write",                          
    			"path": relPath,
    			"type": "dir",                               
    			"updated": 1427851834642 })
    		}
    		else {
    			console.log("Adding a file")
    			clientSocket[0].write({ "action": "write",                          
    			"path": relPath,
    			"type": "file",                               
    			"updated": 1427851834642 })
    		}	
		}
    }
    if (event == 'unlink') {
    	if (clientSocket[0]) {
    		console.log("Valid Event: " + event +", path: "  + relPath)
    		if (isDir) {
    			console.log("Deleting a dir")
    			clientSocket[0].write({ "action": "delete",                          
    			"path": relPath,
    			"type": "dir",                               
    			"updated": 1427851834642 })
    		}
    		else {
    			console.log("Deleting a file")
    			clientSocket[0].write({ "action": "delete",                          
    			"path": relPath,
    			"type": "file",                               
    			"updated": 1427851834642 })
    		}	
		}
    }
})


app.get('*', setFileMetadata, sendHeaders, (req,res) => {

	console.log("Received a GET request")

	// Incoming request is for a directory
	if (res.body) {
		res.json(res.body)

		// console.log("Request is for directory")
		// //let output = fs.createWriteStream('target6.tar.gz');


		// let archive = archiver('tar')

		// archive.on('error', function(err) {
		// 	console.log("Erroring out: " + err.message)
  //   		res.status(500).send({error: err.message});
  // 		});

  // 		// //on stream closed we can end the request
  // 		// res.on('close', function() {
  //   // 		console.log('Archive wrote %d bytes', archive.pointer());
  //   // 		return;
  // 		// });

  // 		//set the archive name
  // 		res.attachment('archive-name.tar');

  //   	archive.pipe(res);

  //   	archive.bulk([
  //       	 {expand: true, cwd: '/Users/vramac1/dev/tryout/', 
  //       	 src: ['**/*'], dest: '/Users/vramac1/dev/'} ])

  //   	archive.finalize()
		return
	}
	else {
		fs.createReadStream(req.filePath).pipe(res)
		//return
	}
	//res.end()
})

app.head('*', setFileMetadata, sendHeaders, (req,res) => res.end())

app.delete('*', setFileMetadata,(req, res, next) => {
	async () => {
		if (! req.stat) {
			return res.send('400', 'Invalid File')
		}
		if (req.stat.isDirectory()) {
			await rimraf.promise(req.filePath)
		}
		else {
			await fs.promise.unlink(req.filePath)
		}

		if (clientSocket[0]) {
			let relPath = path.relative(ROOT_DIR,req.filePath)

			if (req.stat.isDirectory()) {
				clientSocket[0].write({ "action": "delete",                          
    			"path": relPath,
    			"type": "dir",                               
    			"updated": 1427851834642 })
			}
			else {
				clientSocket[0].write({ "action": "delete",                          
    			"path": relPath,
    			"type": "file",                               
    			"updated": 1427851834642 })
			}
		}

		res.end()
	}().catch(next)
})

app.put('*',setFileMetadata, setDirDetails, (req, res, next) => {
	console.log("ROOT_DIR: " + ROOT_DIR)
	if (req.stat) {
		return res.send('405','File exists')
	}
	async () => {
		await mkdirp.promise(req.dirPath)
		if (!req.isDir) {
			req.pipe(fs.createWriteStream(req.filePath))
		}

		if (clientSocket[0]) {
			let relPath = path.relative(ROOT_DIR,req.filePath)
			if (!req.isDir) {
				clientSocket[0].write({ "action": "write",                          
    			"path": relPath,
    			"type": "file",                               
    			"updated": 1427851834642 })
			}
			else {
				clientSocket[0].write({ "action": "write",                          
    			"path": relPath,
    			"type": "dir",                               
    			"updated": 1427851834642 })
			}	
		}
 		
		res.end()
	}().catch(next)
})

app.post('*',setFileMetadata, setDirDetails, (req, res, next) => {
	if (!req.stat) {
		return res.send('405','File does not exists')
	}
	if (req.isDir) {
		return res.send('405','Path is a directory')
	}
	async () => {
		await fs.promise.truncate(req.filePath,0)
		req.pipe(fs.createWriteStream(req.filePath))

		if (clientSocket[0]) {
			let relPath = path.relative(ROOT_DIR,req.filePath)
			clientSocket[0].write({ "action": "write",                          
    			"path": relPath,
    			"type": "file",                               
    			"updated": 1427851834642 })
		}

		res.end()
	}().catch(next)
})

function newConnectionHandler(socket) {

		clientSocket[0] = socket

 	 // Whenever a connection sends us an object... 
  	socket.on('data', function(data){
    
    	// Output the question property of the client's message to the console 
    	console.log("Client's question: " + data.question)

    	socket.write({action: "success"})
  	})
}

function setDirDetails(req,res,next) {
	let filePath = req.filePath
	let hasExtn = path.extname(filePath) !== ''
	let endsWithSlash = filePath.charAt(filePath.length-1)  === path.separator
	req.isDir = endsWithSlash || !hasExtn
	req.dirPath = req.isDir ? filePath : path.dirname(filePath)
	next()
}

function setFileMetadata(req, res, next) {
	req.filePath = path.resolve(path.join(ROOT_DIR,req.url))
	if (req.filePath.indexOf(ROOT_DIR) !== 0) {
		res.send(400,'Invalid Path')
		return
	}
	fs.promise.stat(req.filePath)
		.then(stat => req.stat = stat, ()=> req.stat = null)
		.nodeify(next)
}

function sendHeaders(req,res,next) {
	nodeify(async () => {
		if (req.stat && req.stat.isDirectory()) {
			let files = await fs.promise.readdir(req.filePath)	
			res.body = JSON.stringify(files)
			res.setHeader('Content-Length',res.body.length)
			res.setHeader('Content-Type','application/x-gtar')
			return
		}	
		res.setHeader('Content-Length',req.stat.size)
		let contentType = mime.contentType(path.extname(req.filePath))
		res.setHeader('Content-Type',contentType)
	}(),next)
}