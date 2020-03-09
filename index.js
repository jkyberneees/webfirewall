'use strict'

const wildcard = require('wildcard')

const E403 = new Error('Forbidden')
E403.status = 403

const PopulationStrategies = {
  express: {
    getMethod: (req, res) => {
      return req.method
    },
    getPath: (req, res) => {
      return req.path
    },
    isSecure: (req, res) => {
      return req.secure
    },
    getOrigin: (req, res) => {
      return req.get('origin') || ''
    },
    getIpAddress: (req, res) => {
      return req.ip
    }
  },
  restify: {
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
  }
}

function compare (pattern, str) {
  if (typeof (str) !== 'string') return false

  if (pattern instanceof RegExp) {
    return str.match(pattern)
  }

  return wildcard(pattern, str)
}

function roleschk (userRoles, ruleRoles) {
  if (userRoles.length === 0) return ruleRoles.indexOf('*') >= 0

  for (let i = 0; i < ruleRoles.length; i++) {
    for (let j = 0; j < userRoles.length; j++) {
      if (compare(ruleRoles[i], userRoles[j])) return true
    }
  }

  return false
}

function emptyfn () {
  return Promise.resolve(true)
}

module.exports = (config) => {
  config.defaultAction = (config.defaultAction || 'DROP').toUpperCase()

  for (const rule of config.rules) {
    rule.origin = rule.origin || ['*']
    rule.methods = rule.methods || ['*']
    rule.ipAddresses = rule.ipAddresses || ['*']
    rule.secure = (rule.secure === true)
    rule.handler = rule.handler || emptyfn
  }

  let strategy = PopulationStrategies.restify
  if (typeof config.populationStrategy === 'string') {
    strategy = PopulationStrategies[config.populationStrategy]
  } else if (typeof config.populationStrategy === 'object') {
    strategy = config.populationStrategy
  }
  if (!strategy) {
    throw new Error('Given population strategy is not supported!')
  }

  return async function (req, res, next) {
    try {
      const getUserEmail = config.getUserEmail || ((req) => Promise.resolve(req.user ? req.user.email : null))
      const getUserPhone = config.getUserPhone || ((req) => Promise.resolve(req.user ? req.user.phone : null))
      const getUserRoles = config.getUserRoles || ((req) => Promise.resolve(req.user ? req.user.roles : null))

      const method = strategy.getMethod(req, res)
      const path = strategy.getPath(req, res)
      const secure = strategy.isSecure(req, res)
      const origin = strategy.getOrigin(req, res)
      const ipAddress = strategy.getIpAddress(req, res)
      const email = await getUserEmail(req)
      const phone = await getUserPhone(req)
      const roles = await getUserRoles(req)

      for (const rule of config.rules) {
        if (rule.paths.find((e) => compare(e, path))) {
          if (
            rule.methods.find((e) => compare(e.toUpperCase(), method)) &&
            rule.origin.find((e) => compare(e, origin)) &&
            rule.ipAddresses.find((e) => compare(e, ipAddress)) &&
            (!rule.users || rule.users.find((e) => compare(e, email)) || rule.users.find((e) => compare(e, phone))) &&
            (!rule.roles || roleschk(roles, rule.roles)) &&
            (undefined === rule.secure || secure === rule.secure) &&
            (await rule.handler(req))
          ) {
            switch (rule.action.toUpperCase()) {
              case 'ACCEPT':
                return next()
              default: // case 'DROP':
                return next(E403)
            }
          }
        }
      }

      switch (config.defaultAction) {
        case 'ACCEPT':
          return next()
        default: // case 'DROP':
          return next(E403)
      }
    } catch (err) {
      return next(err)
    }
  }
}
