/* global describe, it */
const expect = require('chai').expect

function getReq () {
  const req = {
    headers: {
      origin: 'http://website.com'
    },
    connection: {
      remoteAddress: '127.0.0.1'
    },
    method: 'GET',
    user: {
      email: 'k@gmail.com',
      roles: ['admin', 'user']
    },
    getPath () {
      return '/test'
    },
    isSecure () {
      return false
    }
  }

  return req
}

function getRes () {
  const res = {}

  return res
}

describe('Restify Integration', () => {
  it('ACCEPT all', function (done) {
    const middleware = require('../index')({
      defaultAction: 'ACCEPT',
      populationStrategy: 'restify',
      rules: []
    })

    middleware(getReq(), getRes(), (err) => {
      if (err) return done(err)

      done()
    })
  })

  it('DROP all / overwrite populationStrategy', function (done) {
    const middleware = require('../index')({
      defaultAction: 'DROP',
      populationStrategy: {
        getMethod: (req, res) => {
          return req.method
        },
        getPath: (req, res) => {
          return req.getPath()
        },
        isSecure: (req, res) => {
          return req.isSecure()
        },
        getOrigin: (req, res) => {
          return req.headers.origin || ''
        },
        getIpAddress: (req, res) => {
          return req.headers['x-forwarded-for'] || req.connection.remoteAddress
        }
      },
      rules: []
    })

    middleware(getReq(), getRes(), (err) => {
      expect(err.message).to.equals('Forbidden')

      done()
    })
  })

  it('ACCEPT GET /test', function (done) {
    const middleware = require('../index')({
      defaultAction: 'DROP',
      rules: [{
        paths: ['/test'],
        methods: ['GET'],
        action: 'ACCEPT'
      }]
    })

    middleware(getReq(), getRes(), (err) => {
      expect(err).to.equals(undefined)

      done()
    })
  })

  it('ACCEPT GET /test by RegExp', function (done) {
    const middleware = require('../index')({
      defaultAction: 'DROP',
      rules: [{
        paths: [/\/test/],
        methods: ['GET'],
        action: 'ACCEPT'
      }]
    })

    middleware(getReq(), getRes(), (err) => {
      expect(err).to.equals(undefined)

      done()
    })
  })

  it('ACCEPT GET /*', function (done) {
    const middleware = require('../index')({
      defaultAction: 'DROP',
      rules: [{
        paths: ['/*'],
        methods: ['GET'],
        action: 'ACCEPT'
      }]
    })

    middleware(getReq(), getRes(), (err) => {
      expect(err).to.equals(undefined)

      done()
    })
  })

  it('DROP GET /*', function (done) {
    const middleware = require('../index')({
      defaultAction: 'ACCEPT',
      rules: [{
        paths: ['/*'],
        methods: ['GET'],
        action: 'DROP'
      }]
    })

    middleware(getReq(), getRes(), (err) => {
      expect(err.message).to.equals('Forbidden')

      done()
    })
  })

  it('ACCEPT k@gmail.com user /*', function (done) {
    const middleware = require('../index')({
      defaultAction: 'DROP',
      rules: [{
        paths: ['/*'],
        action: 'ACCEPT',
        users: ['k@gmail.com']
      }]
    })

    middleware(getReq(), getRes(), (err) => {
      expect(err).to.equals(undefined)

      done()
    })
  })

  it('DROP k@gmail.com user /*', function (done) {
    const middleware = require('../index')({
      rules: [{
        paths: ['/*'],
        action: 'DROP',
        users: ['k@gmail.com']
      }]
    })

    middleware(getReq(), getRes(), (err) => {
      expect(err.message).to.equals('Forbidden')

      done()
    })
  })

  it('DROP user roles', function (done) {
    const middleware = require('../index')({
      rules: [{
        paths: ['/*'],
        action: 'DROP',
        roles: ['user']
      }]
    })

    middleware(getReq(), getRes(), (err) => {
      expect(err.message).to.equals('Forbidden')

      done()
    })
  })

  it('ACCEPT admin roles', function (done) {
    const middleware = require('../index')({
      rules: [{
        paths: ['/*'],
        action: 'ACCEPT',
        roles: ['admin']
      }]
    })

    middleware(getReq(), getRes(), (err) => {
      expect(err).to.equals(undefined)

      done()
    })
  })

  it('ACCEPT x* roles', function (done) {
    const middleware = require('../index')({
      rules: [{
        paths: ['/*'],
        action: 'ACCEPT',
        roles: ['x*']
      }]
    })

    middleware(getReq(), getRes(), (err) => {
      expect(err.message).to.equals('Forbidden')

      done()
    })
  })

  it('ACCEPT 127.0.0.1', function (done) {
    const middleware = require('../index')({
      rules: [{
        paths: ['/*'],
        action: 'ACCEPT',
        roles: ['admin'],
        ipAddresses: [
          '127.*'
        ]
      }]
    })

    middleware(getReq(), getRes(), (err) => {
      expect(err).to.equals(undefined)

      done()
    })
  })
})
