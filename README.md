# pubsub-stream

pubsub with [rpc-stream] and [EventEmitter2]

[rpc-stream]: https://github.com/dominictarr/rpc-stream
[EventEmitter2]: https://github.com/hij1nx/EventEmitter2

## example

```
var port = 10000+Math.random()*10000|0
var t = require('assert')
var net = require('net')
var EE2 = require('eventemitter2').EventEmitter2
// ee can be any require('events') compatible emitter
var ee = new EE2({wildcard:true})
var pubsub = require('pubsub')

var server = net.createServer(function(s){
  var ps = pubsub(ee) 
  s.pipe(ps).pipe(s)
  s.on('end',function(){ps.service.unsubscribeAll()})
})

server.listen(port, function(){
  var todo = 2
  var Aps = pubsub()
  var Bps = pubsub()
  var Aclient = net.connect(port)
  var Bclient = net.connect(port)
  Aclient.pipe(Aps).pipe(Aclient)
  Bclient.pipe(Bps).pipe(Bclient)
  Aps.emitter.on('a.*', function(msg){t.equal(msg, 'hello from B'); done()})
  Bps.emitter.on('b.*', function(msg){t.equal(msg, 'hello from A'); done()})
  Aps.subscribe('a.*', function(){Bps.publish('a.foo', 'hello from B')})
  Bps.subscribe('b.*', function(){Aps.publish('b.foo', 'hello from A')})
  function done(){
    if (--todo) return
    Aclient.end()
    Bclient.end()
    server.close()
  }
})
```

## api

```
var pubsub = require('pubsub')
```

### `var ps = pubsub([eeOrOpts])`

* `ps` is a [RpcStream](https://github.com/dominictarr/rpc-stream#rpcmethods-israw)
  with the remote api attached to it: 
  `w = ps.wrap(api); api.map(function(n){ps[n] = w[n]})`
  where the api is `['publish','subscribe','unsubscribe','unsubscribeAll']`
* `eeOrOpts` must be either a `require('events')`-compatible eventemitter or
  an object that gets passed to the [EventEmitter2]-constructor. this emitter
  will be used to publish events to all the subscribers.

### `ps.publish(event, data[, data, ..])`

publish data

### `ps.subscribe(event, cb)`

subscribe for remote events, an event-listener will be added to the remote
emitter

### `ps.unsubscribe(event, cb)`

delete all subscriptions for this event, ie. remove remote the event-listeners

### `ps.unsubscribeAll(cb)`

deletes all subscribtions

### `ps.emitter`

remote events you subscribed to will be emitted and the remote end can
subscribe to events from this emitter

### `ps.service`

the service provided to the remote end

### `ps.subscriptions`

```
ps.subscriptions = { 'some:event': [fn, ..], .. }
```

### `pubsub.emitterOptions`

gets passed to the constructor of `ps.emitter` ([EventEmitter2]) if
no arguments are passed to `pubsub()` and is
`{ delimiter: '.', wildcard: true, maxListeners: 1e12 }` by default

