// libs
const express = require('express')
const request = require('request')
const generateNonce = require('nonce')()

// constants
const app = express()
const apiKey = process.env.apiKey
const sharedSecret = process.env.sharedSecret
const UNAUTHORIZED_CODE = 401

// enable cors
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.get('/done', function (req, res) {
  const options = {
    uri: `https://${req.query.shop}/admin/oauth/access_token`,
    method: 'POST',
    json: {
      client_id: apiKey,
      client_secret: sharedSecret,
      code: req.query.code
    }
  }
  request(options, function (err, response, body) {
    if (!err) {
      const token = body['access_token']
      res.redirect(`http://localhost:8080?token=${token}`)
    }
  })
})

// catch all incoming requests
app.all('*', function (req, res) {
  if (req.url.includes('myshopify')) {
    const token = req.query.token
    res.setHeader('Content-Type', 'application/json')
    request({
      uri: prepURL(req.url),
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': token
      }
    }, function (err, response, body) {
      if (response.statusCode === UNAUTHORIZED_CODE) {
        redirectForAuth(body, res, response)
      } else if (!err) {
        res.send(body)
      }
    })
  } else {
    res.send('app')
  }
})

function redirectForAuth (body, res, response) {
  body = JSON.parse(body)
  body.statusCode = response.statusCode
  body.statusMessage = response.statusMessage
  body.redirect = getAuthURL()
  res.send(body)
}

// get Shopify authorization URL
function getAuthURL () {
  const scopes = 'write_content,write_products'
  const nonce = generateNonce().toString()

  return `https://developmentsandbox.myshopify.com/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=http://localhost:3000/done&state=${nonce}`
}

// produce shopify URL from request URL
function prepURL (url) {
  url = url.substring(1)
  url = 'https://' + url
  return url
}

// start Express server
app.listen(3000, function () {
  console.log('Lambda running @ http://localhost:3000')
})

