Instructions to run this code

1) First of all move to directory code/backend and type nodemon index.js to start the backend
2) Open another terminal and type ngrok http 4444 ... 4444 here represents the port number of the backend
3) to run frontend download expo go app and then move to directory code/frontend/MyApp and type npm start and scan the qr code to launch app on your phone. Make sure to be on the same wifi in both laptop and mobile.
4) Don't forget to get env files and use in these files change the backend url to the url given by ngrok .. also we need to add the new url in google redirect uri for google login to work.

## redirection issues in anroid