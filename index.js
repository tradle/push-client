
const crypto = require('crypto')
const request = require('superagent')
const protocol = require('@tradle/protocol')
// const constants = require('@tradle/engine').constants
// const TYPE = constants.TYPE

module.exports = function (opts) {
  const serverUrl = opts.url
  const key = opts.key
  const identity = opts.identity
  const link = protocol.linkString(identity)
  return {
    register: function (cb) {
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
    },
    // silent notifications only
    push: function (userLink, cb) {
      request.post(`${serverUrl}/silent/${userLink}/${link}`)
        .send(opts)
        .end(function (err, res) {
          if (err || !res.ok) return cb(err || new Error('push failed'))

          cb()
        })
    }
  }
}

function sha256 (data) {
  return crypto.createHash('sha256').update(data).digest('base64')
}
