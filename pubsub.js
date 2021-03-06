module.exports = pubsub

// not sure about maxListeners..
pubsub.emitterOptions = { delimiter: '.', wildcard: true, maxListeners: 1e12 }

var rpc = require('rpc-stream')
var EE2 = require('eventemitter2').EventEmitter2

function pubsub(ee) {
  var self = this
  if (!ee)
    ee = new EE2(pubsub.emitterOptions)
  else if (typeof ee == 'object')
    new EE2(pubsub.emitterOptions)
  else if (!ee.emit || !ee.removeListener)
    throw new Error('invalid options')
  var subs = {}
  var service = {}
  service.publish = publish
  service.subscribe = subscribe
  service.unsubscribe = unsubscribe
  service.unsubscribeAll = unsubscribeAll
  var api = ['publish', 'subscribe', 'unsubscribe', 'unsubscribeAll']
  var remote = rpc(service)
  var wrapped = remote.wrap(api)
  api.map(function(name){remote[name] = wrapped[name]})
  remote.service = service
  remote.subs = remote.subscriptions = subs
  remote.ee = remote.emitter = ee
  function publish(d, cb) {
    ee.emit.apply(ee,d)
    cb()
  }
  function subscribe(d, cb) {
    var e = d[0] || '**' // not sure about this
    if (subs[e]) return cb()
    subs[e] = function(){
      var args = [].slice.call(arguments)
      args.unshift(this.event)
      remote.publish.apply(null, args)
    }
    ee.on(e, subs[e])
    cb && cb()
  }
  function unsubscribe(d, cb) {
    var e = d[0] || '**' // not sure about this
    if (!subs[e]) return cb()
    ee.removeListener(e, subs[e])
    delete subs[e]
    cb && cb()
  }
  function unsubscribeAll(cb){
    Object.keys(subs).forEach(function(e, i){
      ee.removeListener(e, subs[e])
      delete subs[e]
    })
    cb && cb()
  }
  return remote
}

