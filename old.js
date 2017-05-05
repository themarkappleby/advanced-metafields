// -----------------------------------------------------
// Make sure to delete DynamoDB entry to test end-to-end
// -----------------------------------------------------

// Libs
const AWS = require('aws-sdk')
const express = require('express')
const request = require('request')
const generateNonce = require('nonce')()
const _ = require('lodash')
const fs = require('fs')
const domain = 'https://14200e0e.ngrok.io'

// Constants
const app = express()
const DynamoTable = 'advanced-metafields'
const apiKey = process.env.apiKey
const sharedSecret = process.env.sharedSecret
const dynamodb = new AWS.DynamoDB({
  region: 'us-east-1'
})

app.get('/', function (req, res) {
  let shop = _.get(req, 'query.shop')
  shop = 'developmentsandbox.myshopify.com'
  if (!shop) res.send("error: invalid or missing 'shop' query parameter")
  // getToken(shop, function (token) {
    /*
    if (token) {
      proxy(req, token, function () {
        res.send(token)
      })
    } else {
      */
      requestAuth(shop, res)
      /*
    }
   })
   */
})

function requestAuth (shop, res) {
  saveNonce(shop, function (nonce) {
    const params = {
      scopes: 'write_content,write_products',
      redirectUri: domain + '/done'
    }
    res.redirect(`https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${params.scopes}&redirect_uri=${params.redirectUri}&state=${nonce}`)
  })
}

function saveNonce (shop, cb) {
  const nonce = generateNonce().toString()
  var params = {
    TableName: DynamoTable,
    Item: {
      Shop: { S: shop },
      Nonce: { S: nonce }
    }
  }
  dynamodb.putItem(params, function (err, data) {
    if (err) {
      console.log(err)
    } else {
      cb(nonce)
    }
  })
}

function getToken (shop, cb) {
  var params = {
    TableName: DynamoTable,
    Key: {
      Shop: { S: shop }
    }
  }
  dynamodb.getItem(params, function (err, data) {
    if (err) {
      console.log(err)
    } else {
      cb(_.get(data, 'Item.Token.S'))
    }
  })
}

function saveToken (shop, token, cb) {
  var params = {
    TableName: DynamoTable,
    Item: {
      Shop: { S: shop },
      Token: { S: token }
    }
  }
  dynamodb.putItem(params, function (err, data) {
    if (err) {
      console.log(err)
    } else {
      cb()
    }
  })
}

function proxy (req, token, cb) {
  cb()
}

app.get('/done', function (req, res) {
  if (validNonce() && validHmac() && validHostname()) {
    const shop = _.get(req, 'query.shop')
    const code = _.get(req, 'query.code')
    const options = {
      uri: `https://${shop}/admin/oauth/access_token`,
      method: 'POST',
      json: {
        client_id: apiKey,
        client_secret: sharedSecret,
        code
      }
    }
    request(options, function (err, response, body) {
      if (!err) {
        const token = body['access_token']
        if (token) {
          saveToken(shop, token, function () {
            testRequest(shop, token, res)
          })
        }
      }
    })
  }
})

function testRequest (shop, token, res) {
  request({
    uri: `https://${shop}/admin/products.json`,
    method: 'GET',
    headers: {
      'X-Shopify-Access-Token': token
    }
  }, function (err, response, body) {
    if (!err) {
      res.send(body)
    }
  })
}

app.get('/test', function (req, res) {
  fs.readFile('./public.html', 'utf8', function (err, data) {
    if (!err) {
      res.send(data)
    }
  })
})

function validNonce () {
  return true
}

function validHmac () {
  return true
}

function validHostname () {
  return true
}

app.listen(3000, function () {
  console.log('running on http://localhost:3000')
})
