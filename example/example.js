#!/usr/bin/env node

const level = require('level')
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
  db: level('./push.db', { valueEncoding: 'json' }),
  identity: identity,
  key: nkeyEC.fromJSON(priv),
  url: 'http://localhost:48284'
})

const hash = 'd851c4a5a82085e22b7e176a9632f30c1167e47981915cf22c7a95d632026099'
console.log('pushing to ' + hash)

// assumuing user with link 'e660c830b7d2c440785cdae99b9e6acbad59209f41f7feee406e4030e6d0806a'
// subscribed to your push notifications
// client.push('f6a8f59ddb94f02559f76212f9673ab9e3860518db9eeb4e5a0f602a409a6e9c', function (err) {
client.push(hash, function (err) {
// client.push("04825784527d1e7ff622810b76252abea1f208bd9bdd2b82db9a0b2aede51954", function (err) {
// client.push('e660c830b7d2c440785cdae99b9e6acbad59209f41f7feee406e4030e6d0806a', function (err) {
  if (err) throw err

  console.log('pushed!')
})

console.log('me: ' + protocol.linkString(identity))
