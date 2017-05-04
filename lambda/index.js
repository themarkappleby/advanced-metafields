// libs
const express = require('express')
const request = require('request')
const generateNonce = require('nonce')()

// constants
const app = express()
const UNAUTHORIZED_CODE = 401
const apiKey = process.env.apiKey
const scopes = 'write_content,write_products'

// enable cors
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

// catch all incoming requests
app.all('*', function (req, res) {
  if (req.url === '/auth') {
    auth(res)
  } else {
    res.setHeader('Content-Type', 'application/json')
    request({
      uri: prepURL(req.url),
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': 'f63deb030a800c88c6efb01a2fdc7147'
      }
    }, function (err, response, body) {
      if (response.statusCode === UNAUTHORIZED_CODE) {
        body = JSON.parse(body)
        body.statusCode = response.statusCode
        body.statusMessage = response.statusMessage
        body.redirect = getAuthURL()
        res.send(body)
      } else if (!err) {
        res.send(body)
      }
    })
  }
})

function auth (res) {
  const nonce = generateNonce().toString()
  res.redirect(`https://developmentsandbox.myshopify.com/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=http://localhost:3000/done&state=${nonce}`)
}

// get Shopify authorization URL
function getAuthURL () {
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

