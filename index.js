var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var Rx = require('Rx');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var $ = require('jquery');
const fetch = require('node-fetch');

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
    console.log('startup msg came from html, sending data..');
    io.emit('update', pointsArray, numberOfPoints);
    socket.on('disconnect', () => {
        console.log('user disconnected');
    })
})

server.listen(3000, () => {
    console.log('listening on *: 3000');
});

var localVersionNumber = "null";
console.log("local version number: " + localVersionNumber);

const urlToFetchVersion = "https://petrel-collaboration-dev.appspot.com/api/v1/Syncer/GetVersionNumber/PointSet/893131b8-ae9c-4500-b0fb-4d3970f504b4";
const urlToFetchVersionNewPoint = "https://petrel-collaboration-dev.appspot.com/api/v1/Syncer/GetVersionNumber/PointSet/newPointGuid";


// NEW OBSERVABLE TESTING STUFF
let observable = Rx.Observable.create((o) => {

});

let obs = Rx.Observable.interval(500)
    .take(15);

// obs.subscribe(value => console.log('observer fired..' + value));

// varan iki
const createUrl = (i) => `http://jsonplaceholder.typicode.com/posts/${i}`;
const log = (data) => {
    console.log('polling..' + data.id);
}

const pollingStuff = Rx.Observable.interval(1000)
    .concatMap((i) => Rx.Observable.defer(() => {
        return fetch(createUrl(i + 1)).then(res => res.json())
    }))
    .do(log)
    .filter(data => data.id > 2)
    .take(1);

// pollingStuff.subscribe(
//     (data) => console.log(data),
//     (error) => console.log(error),
//     () => console.log('done doing magic..')
// );

const urlToGetData = "https://petrel-collaboration-dev.appspot.com/api/v1/Syncer/GetObjectsOnDemand/PointSet.Points/893131b8-ae9c-4500-b0fb-4d3970f504b4/Point";
const urlToGetDataNewPoint = "https://petrel-collaboration-dev.appspot.com/api/v1/Syncer/GetObjectsOnDemand/PointSet.Points/newPointGuid/Point";
var pointsArray = [];
var numberOfPoints;

const pollingPetrelStuff = Rx.Observable.interval(200)
    .concatMap(() => {
        return fetch(urlToFetchVersion).then(res => res.text())
    })
    .do(versionNumberAtServer => {
        // console.log(versionNumberAtServer);
        if (versionNumberAtServer != localVersionNumber) {
            console.log("something changed! fetching data from the new Rx!..");
            // fetch the point data here
            fetch(urlToGetData)
                .then(response => response.json())
                .then(pointsData => {
                    console.log(pointsData);

                    numberOfPoints = pointsData.size;
                    console.log("numberOfPoints: " + numberOfPoints);

                    for (var i = 0; i < numberOfPoints * 3; i++) {
                        pointsArray[i] = pointsData.data[i];
                    }

                    console.log("fetching complete");
                    io.emit('update', pointsArray, numberOfPoints);
                })
            console.log('setting localVersionNumber to Server..');
            localVersionNumber = versionNumberAtServer;
        }
    })
    .filter(data => data == 'something')
    .take(1);


pollingPetrelStuff.subscribe(
    (data) => console.log(data),
    (error) => console.log(error),
    () => console.log('doneeee')
)

io.on('fetch', function () {
    console.log('startup msg came from html, sending data..');
    io.emit('update', pointsArray, numberOfPoints);
    console.log('emitted' + numberOfPoints);
})

// concatMap example:
//emit 'Hello' and 'Goodbye'
const source = Rx.Observable.of('Hello', 'Goodbye');
// map value from source into inner observable, when complete emit result and move to next
const example = source.concatMap(val => Rx.Observable.of(`${val} World!`));
//output: 'Example One: 'Hello World', Example One: 'Goodbye World'
const subscribe = example
    .subscribe(val => console.log('Example One:', val));

// WEEE

var myNewObservable = Rx.Observable.interval(1000).do();
// myNewObservable.subscribe(
//     () => checkServerForUpdates(),
//     (err) => console.log('error: ' + err)
// );



function checkForUpdatesWithJquery() {
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
        if (versionNumberAtServer != localVersionNumber) {
            console.log("something changed! fetch data!..");
            io.emit('update', 'loadObjects');
            localVersionNumber = versionNumberAtServer;
        }
    }

    xhr.onerror = function (err) {
        alert('poop happened', err);
    }

    xhr.send();
}