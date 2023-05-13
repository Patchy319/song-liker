# Spotify Song Liker
Welcome to this quick thing I wrote up with chatgpt help!
This will like a song on spotify when you press F13 and make a beep sound. May need to adjust for linux or other systems. This is made for windows.

## Install
Ensure you have NodeJS.
Download the code, run `npm install`, this should install the necessary libraries.

## Setup
Go to https://developer.spotify.com/dashboard and create an app.
Set redirect url to http://localhost:8888/callback
Copy client ID and client secret into config_example.json and rename it to config.json

Run the program with `node index.js` and then go to http://localhost:8888/login
this should ask you to approve the application.
After you have approved it, it should output the access token into the console- now you can try pressing F13 and it should toggle liking the current playing song!

I would love to somehow implement this into my car, maybe on an ESP32 or android auto app.
