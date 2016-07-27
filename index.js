
const crypto = require('crypto')
const request = require('superagent')
const subdown = require('subleveldown')
const thunky = require('thunky')
const protocol = require('@tradle/protocol')
// const constants = require('@tradle/engine').constants
// const TYPE = constants.TYPE

module.exports = function (opts) {
  const db = opts.db
  if (db.options.valueEncoding !== 'json') {
    throw new Error('expected db to have json encoding')
  }

  const subscribers = subdown(db, 'subscribers', { valueEncoding: 'json' })
  const registrar = subdown(db, 'registrar', { valueEncoding: 'json' })
  const serverUrl = opts.url
  const key = opts.key
  const identity = opts.identity
  const publisher = protocol.linkString(identity)

  const maybeRegister = thunky(function (cb) {
    if (opts.forceRegister) return register(cb)

    registrar.get(serverUrl, function (err) {
      if (!err) return cb()

      register(cb)
    })
  })

  return {
    // register: maybeRegister,
    // silent notifications only
    push: push
  }

  function push (subscriber, cb) {
    maybeRegister(function (err) {
      if (err) return cb(err)

      subscribers.get(subscriber, function (err, info) {
        if (err) {
          if (!err.notFound) return cb(err)
        }

        info = info || { seq: -1 }
        const seq = ++info.seq
        subscribers.put(subscriber, info, function (err) {
          if (err) console.log(err)
        })

        const nonce = crypto.randomBytes(8).toString('base64')
        key.sign(sha256(seq + nonce), function (err, sig) {
          if (err) return cb(err)

          const body = { publisher, subscriber, seq, nonce, sig }
          request.post(`${serverUrl}/notification`)
            .send(body)
            .end(function (err, res) {
              if (err || !res.ok) return cb(err || new Error('push failed'))

              registrar.put(serverUrl, {}, cb)
            })
        })
      })
    })
  }

  function register (cb) {
    request.post(`${serverUrl}/publisher`)
      .send({
        identity: identity,
        key: key.toJSON()
      })
      .end(function (err, res) {
        if (err || !res.ok) return cb(err || new Error('registration failed on step 1'))

        // challenge
        const nonce = res.text
        const salt = crypto.randomBytes(32).toString('base64')
        key.sign(sha256(nonce + salt), function (err, sig) {
          if (err) return cb(err)

          request
            .post(`${serverUrl}/publisher`)
            .send({ nonce, salt, sig })
            .end(function (err, res) {
              if (err || !res.ok) return cb(err || new Error('registration failed on step 2'))

              cb()
            })
        })
      })
  }
}

function sha256 (data) {
  return crypto.createHash('sha256').update(data).digest('base64')
}
