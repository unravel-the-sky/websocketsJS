var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var Rx = require('Rx');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var $ = require('jquery');

app.get('/', (req, res) => {
    // res.send('<h1> Hello </h1>');
    res.sendFile(__dirname + '/index.html')
});

app.get(/^(.+)$/, (req, res) => {
    res.sendFile(__dirname + req.params[0]);
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('something BROKE..');
})

io.on('connection', (socket) => {
    console.log('a user is connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    })
})

server.listen(3000, () => {
    console.log('listening on *: 3000');
});

var localVersionNumber = "null";
console.log("local version number: " + localVersionNumber);

var myNewObservable = Rx.Observable.interval(500).do();
myNewObservable.subscribe(
    () => checkServerForUpdates(),
    (err) => console.log('error: ' + err)
);

// var service = Rx.Observable.defer(checkServerForUpdates());
// service.subscribe();
// var pollInterval = Rx.Observable.empty().delay(2000);
// service
//     .concat(pollInterval)
//     .repeat()
//     .subscribe(success, failure);

var urlToFetchVersion = "https://petrel-collaboration-dev.appspot.com/api/v1/Syncer/GetVersionNumber/PointSet/893131b8-ae9c-4500-b0fb-4d3970f504b4";

function checkForUpdatesWithJquery(){
    var promise = $.ajax({
        url: urlToFetchVersion,
        dataType: 'string',
        type: 'GET'
    }).promise();

    return Rx.Observable.fromPromise(promise);
}

function checkServerForUpdates() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', urlToFetchVersion, true);
    xhr.onload = () => {
        var versionNumberAtServer = xhr.responseText;
        // console.log("version number at server: " + versionNumberAtServer);
        if (versionNumberAtServer != localVersionNumber){
            console.log("something changed! fetch data!..");
            io.emit('update');
            localVersionNumber = versionNumberAtServer;
        }
    }

    xhr.onerror = function (err) {
        alert('poop happened', err);
    }

    xhr.send();
}