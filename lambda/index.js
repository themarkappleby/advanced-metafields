const express = require('express')
const request = require('request')
const app = express()

// enable cors
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

// catch all incoming requests
app.all('*', function (req, res) {
  res.setHeader('Content-Type', 'application/json')
  request({
    uri: prepURL(req.url),
    method: 'GET',
    headers: {
      'X-Shopify-Access-Token': 'f63deb030a800c88c6efb01a2fdc7147'
    }
  }, function (err, response, body) {
    if (!err) res.send(body)
  })
})

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

