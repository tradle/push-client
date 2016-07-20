#!/usr/bin/env node

const nkeyEC = require('nkey-ec')
const protocol = require('@tradle/protocol')
const identity = require('./identity')
const pub = identity.pubkeys.filter(k => {
  return k.type === 'ec' && k.purpose === 'sign'
})[0]

const keys = require('./keys')
const priv = keys.filter(k => {
  return k.pub === pub.pub
})[0]

const client = require('../')({
  identity: identity,
  key: nkeyEC.fromJSON(priv),
  url: 'http://localhost:48284'
})

client.register(function (err) {
  if (err) throw err

  // assumuing user with link 'e660c830b7d2c440785cdae99b9e6acbad59209f41f7feee406e4030e6d0806a'
  // subscribed to your push notifications
  client.push('e660c830b7d2c440785cdae99b9e6acbad59209f41f7feee406e4030e6d0806a', function (err) {
    if (err) throw err

    console.log('pushed!')
  })
})

console.log('link: ' + protocol.linkString(identity))
