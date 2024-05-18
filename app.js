const sql = require("mssql");
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const hbs = require("hbs");
const bodyParser = require("body-parser");
const cors = require('cors');
const methodOverride = require('method-override');
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');
const https = require('https');
const fs = require('fs');

const app = express();

dotenv.config({
    path: './.env',
});

app.use(cors());

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        enableArithAbort: true,
    },
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

const location = path.join(__dirname, "./public");
app.use(express.static(location));

app.set("view engine", "hbs");
const partialspath = path.join(__dirname, "./views/partials");
hbs.registerPartials(partialspath);

app.get('/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

app.use("/", (req, res, next) => {
    if (req.url !== '/favicon.ico') {
        console.log(`Middleware for / route: ${req.url}`);
    }
    next();
}, require("./routes/pages"));

app.use("/auth", (req, res, next) => {
    if (req.url !== '/favicon.ico') {
        console.log(`Middleware for /auth route: ${req.url}`);
    }
    next();
}, require("./routes/auth"));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

const privateKey = fs.readFileSync(path.join(__dirname, 'ssl', 'server.key'), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, 'ssl', 'server.crt'), 'utf8');
const credentials = { key: privateKey, cert: certificate };

const PORT = process.env.PORT || 5000;

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(PORT, () => {
    console.log(`HTTPS Server started @ port ${PORT} 🚀`);
});

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

poolConnect
    .then(() => {
        console.log('Connected to SQL Server 🚁');
    })
    .catch((err) => {
        console.error('Error connecting to SQL Server:', err);
    });

module.exports = config;
