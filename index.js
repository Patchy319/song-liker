const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const crypto = require('crypto');
const fs = require('fs');
const { uIOhook, UiohookKey } = require('uiohook-napi');
const { exec } = require('child_process');

// Load client ID and secret from JSON file
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

let accessToken; // this will be updated every hour
const clientId = config.clientId;
const clientSecret = config.clientSecret;
const redirectUri = 'http://localhost:8888/callback'; // replace with your redirect URI

const app = express();

app.get('/login', function(req, res) {
  const state = generateRandomString(16);
  const scope = 'user-read-private user-read-email playlist-modify-public playlist-modify-private user-library-modify user-library-read user-read-playback-state user-modify-playback-state user-read-currently-playing';

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: clientId,
      scope: scope,
      redirect_uri: redirectUri,
      state: state
    }));
});

app.get('/callback', function(req, res) {
  const code = req.query.code || null;
  const state = req.query.state || null;

  if (state === null) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      data: querystring.stringify({
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }),
      headers: {
        'Authorization': 'Basic ' + (new Buffer(clientId + ':' + clientSecret).toString('base64')),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    }).then(function(response) {
      if (response.status === 200) {
        accessToken = response.data.access_token;
        console.log('Access token: ' + accessToken);
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    }).catch(function(error) {
      console.log(error);
    });
  }
});

function generateRandomString(length) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex') // convert to hexadecimal format
    .slice(0, length); // return required number of characters
}

function getCurrentTrack() {
  return axios({
    method: 'get',
    url: 'https://api.spotify.com/v1/me/player/currently-playing',
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });
}

function checkIfLiked(trackId) {
  return axios({
    method: 'get',
    url: `https://api.spotify.com/v1/me/tracks/contains?ids=${trackId}`,
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });
}

function likeSong(trackId) {
  return axios({
    method: 'put',
    url: `https://api.spotify.com/v1/me/tracks?ids=${trackId}`,
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });
}

function removeLikedSong(trackId) {
  return axios({
    method: 'delete',
    url: `https://api.spotify.com/v1/me/tracks?ids=${trackId}`,
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });
}

uIOhook.on('keydown', event => {
  if(event.keycode === UiohookKey.F13) { 
    getCurrentTrack()      .then(function(response) {
      const trackId = response.data.item.id;
      checkIfLiked(trackId)
        .then(function(response) {
          if (response.data[0]) {
            // Track is already liked, remove it
            removeLikedSong(trackId)
              .then(() => {
                console.log('Track removed from likes');
                exec("powershell.exe [console]::beep(500,600)");
              })
              .catch(console.error);
          } else {
            // Track is not liked, like it
            likeSong(trackId)
              .then(() => {
                console.log('Track added to likes');
                exec("powershell.exe [console]::beep(800,600)");
              })
              .catch(console.error);
          }
        })
        .catch(console.error);
    })
    .catch(console.error);
}
});

app.listen(8888, function() {
console.log('Listening on port 8888');
});

/*
// Fetch a new access token every hour
setInterval(fetchAccessToken, 1000 * 60 * 60);

// Fetch the initial access token
fetchAccessToken();
*/

uIOhook.start();
