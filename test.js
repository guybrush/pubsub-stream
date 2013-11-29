var test = require('tape')
var net = require('net')
var EE2 = require('eventemitter2').EventEmitter2
var pubsub = require('./.')

/* */

test('simple', function(t){
  t.plan(2)
  var port = 10000+Math.random()*10000|0
  var ee = new EE2(pubsub.emitterOptions)
  var server = net.createServer(function(s){s.pipe(pubsub(ee)).pipe(s)})
  var Aclient, Bclient
  server.listen(port, function(){
    var Aps = pubsub()
    var Bps = pubsub()
    Aclient = net.connect(port)
    Bclient = net.connect(port)
    Aclient.pipe(Aps).pipe(Aclient)
    Bclient.pipe(Bps).pipe(Bclient)
    Aps.emitter.on('a.*', function(a){t.equal(a,'hello from B')})
    Bps.emitter.on('b.*', function(a){t.equal(a,'hello from A')})
    Aps.subscribe('a.*', function(){Bps.publish('a.foo', 'hello from B')})
    Bps.subscribe('b.*', function(){Aps.publish('b.foo', 'hello from A')})
  })
  t.on('end', function(){
    Aclient.end()
    Bclient.end()
    server.close()
  })
})

/* */

test('multiple arguments',function(t){
  var port = 10000+Math.random()*10000|0
  var server = net.createServer(function(s){s.pipe(pubsub()).pipe(s)})
  var client
  server.listen(port, function(){
    client = net.connect(port)
    var ps = pubsub()
    client.pipe(ps).pipe(client)
    ps.emitter.on('foo',function(a,b){
      t.equal(a,'a')
      t.equal(b.b,'c')
      client.end()
      server.close()
      t.end()
    })
    ps.subscribe('foo',function(){
      ps.publish('foo','a',{b:'c'})
    })
  })
})

/* */

test('unsubscribe',function(t){
  t.plan(2)
  var port = 10000+Math.random()*10000|0
  var serverPs
  var server = net.createServer(function(s){
    serverPs = pubsub()
    s.pipe(serverPs).pipe(s)
  })
  var client
  server.listen(port, function(){
    client = net.connect(port)
    var ps = pubsub()
    client.pipe(ps).pipe(client)
    ps.emitter.on('foo',function(msg){
      t.equal(Object.keys(serverPs.subscriptions).length,1)
      ps.unsubscribe('foo',function(){
        t.equal(Object.keys(serverPs.subscriptions).length,0)
        ps.publish('foo','bar',function(){
          client.end()
          server.close()
          t.end()
        })
      })
    })
    ps.subscribe('foo',function(){
      ps.publish('foo','bar')
    })
  })
})

test('unsubscribeAll',function(t){
  var port = 10000+Math.random()*10000|0
  var serverPs
  var server = net.createServer(function(s){
    serverPs = pubsub()
    s.pipe(serverPs).pipe(s)
  })
  var client
  server.listen(port, function(){
    client = net.connect(port)
    var ps = pubsub()
    client.pipe(ps).pipe(client)
    var x = 0
    ps.emitter.on('a',function(){x++})
    ps.emitter.on('b',function(){x++})
    ps.subscribe('a',function(){
      ps.subscribe('b',function(){
        t.equal(Object.keys(serverPs.subscriptions).length,2)
        ps.publish('a','a')
        ps.publish('b','b')
        ps.unsubscribeAll(function(){
          t.equal(Object.keys(serverPs.subscriptions).length,0)
          ps.publish('a','a')
          ps.publish('b','b')
          setTimeout(function(){
            t.equal(x,2)
            client.end()
            server.close()
            t.end()
          },50)
        })
      })
    })
  })
})

/* */

