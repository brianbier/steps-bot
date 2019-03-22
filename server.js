require('dotenv').config();
const jwt = require('express-jwt');
const { expressJwtSecret } = require('jwks-rsa');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { trackMediaClicked } = require('./src/tracker');

// Auth0 Config
const { AUTH0_AUDIENCE, AUTH0_DOMAIN } = process.env;
const AUTH0_ISSUER = `https://${AUTH0_DOMAIN}/`;

// Authentication middleware. Please see:
// https://auth0.com/docs/quickstart/backend/nodejs
// for implementation details
const checkJwt = jwt({
  // Retrieve the signing key from the server
  secret: expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${AUTH0_ISSUER}.well-known/jwks.json`,
    handleSigningKeyError: (error, callback) => {
      return callback(error);
    },
  }),

  // Validate the audience of the issuer
  audience: AUTH0_AUDIENCE || 'http://steps-admin.herokuapp.com',
  issuer: AUTH0_ISSUER,
  algorithms: ['RS256'],
  complete: true,
  requestProperty: 'token',
});

module.exports = function server(
  fbEndpoint,
  twilioController,
  getCoachResponse
) {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use('/static', express.static(path.join(__dirname, 'static')));
  app.listen(process.env.PORT || 3002, null, () => {});

  // sets up webhook routes for Twilio and Facebook
  routes(app, fbEndpoint, twilioController, getCoachResponse);

  twilioController.webserver = app;
  return app;
};

function routes(app, fbEndpoint, twilioController, getCoachResponse) {
  app.get('/helpresponse', checkJwt, getCoachResponse);
  app.post('/facebook/receive', fbEndpoint);

  // Perform the FB webhook verification handshake with your verify token. This is solely so FB can verify that you are the same person
  app.get('/facebook/receive', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe') {
      if (req.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
      } else {
        res.send('OK');
      }
    }
  });

  app.get('/redirect', (req, res) => {
    trackMediaClicked(req);
    res.redirect(req.query.contentUrl);
  });

  twilioController.createWebhookEndpoints(
    app,
    twilioController.spawn({}),
    () => {}
  );
}
