# dropbox-demo

## Dropbox [(raw)](https://gist.github.com/CrabDude/040af9c1b93e350608ff/raw)

This is a basic Dropbox clone to sync files across multiple remote folders.

Time spent: 20 hours

### Features

#### Required

- [x] Walkthrough Gif embedded in README
- [x] README `Time spent:` includes the number of hours spent on the assignment
- [x] Client can make GET requests to get file or directory contents
- [ ] Client can download a directory as an archive
- [x] Client can make HEAD request to get just the GET headers 
- [x] Client can make PUT requests to create new directories and files with content
- [x] Client can make POST requests to update the contents of a file
- [x] Client can make DELETE requests to delete files and folders
- [x] client will serve from `--dir` or cwd as root
- [x] Server will serve from `--dir` or cwd as root
- [x] Server will sync `HTTP` modifications over TCP to the Client
- [x] Server will sync watched file modifications (e.g., `fs.watch`) over TCP to the Client


### Optional

### Walkthrough

Express VFS API Server Demo
![Video Walkthrough](dropbox-demo2.gif)

TCP Server/Client Sync Demo
![Video Walkthrough](dropbox-demo3.gif)

TCP Server/Client Watcher Demo
![Video Walkthrough](dropbox-demo6.gif)

