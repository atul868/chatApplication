// require the express module
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const config = require('./config/index');
const connect = require('./dbconnect');
const socketIO = require('socket.io');
const sockets =require('./src/modules/sockets/socket');
const userRoute = require("./src/modules/Users/router")
const groupRoute = require("./src/modules/Groups/router")
const chatRoute = require("./src/modules/Chat/routes")
const reportUserRoute = require("./src/modules/ReportUser/router")
const reportGroupRoute = require("./src/modules/ReportGroup/router")
app.get("/", (req, res) => {
  res.send("App started...");
});

connect.then(() => {
  console.log(`Connected to MongoDB`);
}).catch((e) => {
  console.error(`Could not init db\n${e.trace}`);
});

app.use(cors());

// bodyparser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


// Module Routes
userRoute(app)
groupRoute(app)
chatRoute(app)
reportUserRoute(app)
reportGroupRoute(app)

const server = express()
  .use(app)
  .listen(config.port, () => console.log(`Listening on Port: ${config.port}`));

const socket = socketIO(server);
sockets(socket);

global.globalSocket = socket;
