# Introduction
Web firewall middleware compatible with Express/Restify frameworks.

# Install
```bash
npm install --save webfirewall
```

# Config params example
The values on the params 'paths', 'ipAddresses', 'roles', 'origin' and 'users', can be regular expressions (RegExp). If strings, the comparison is done using the [wildcard](https://www.npmjs.com/package/wildcard) module. 
```js
const config = {
  populationStrategy: 'restify', // supported values: express/restify or object
  defaultAction: 'DROP', // supported values: ACCEPT/DROP
  getUserPhone: (req) => Promise.resolve(req.user ? req.user.phone : null), // custom population strategy for user phone (optional)
  getUserEmail: (req) => Promise.resolve(req.user ? req.user.email : null), // custom population strategy for user email (optional)
  getUserRoles: (req) => Promise.resolve(req.user ? req.user.roles : null), // custom population strategy for user roles (optional)
  rules: [{
    methods: ['GET'],
    paths: ['/system/login'],
    ipAddresses: ['*'], // optional
    roles: ['*'], // optional
    origin: ['*'], // optional
    users: ['*'], // optional
    secure: true, // optional
    action: 'ACCEPT', // supported values: ACCEPT/DROP
    handler: (req) => Promise.resolve(true) // optional
  }, {
    methods: ['POST'],
    paths: ['/comments'],
    users: ['*'],
    secure: true,
    action: 'ACCEPT'
  }, {
    methods: ['POST'],
    paths: ['/system/restart'],
    roles: ['ADMIN'],
    secure: true,
    action: 'ACCEPT'
  }]
}
```

# Usage
```js
const restify = require('restify');
const server = restify.createServer({
    name: 'yourapp.com',
    version: ['1.0.0']
});
const firewall = require('webfirewall');

server.use(firewall({
    populationStrategy: 'restify',
    defaultAction: 'ACCEPT',
    rules: []
}));

```

# JWT authentication
JSON Web Token authentication is a great candidate to be used in collaboration with this module.
