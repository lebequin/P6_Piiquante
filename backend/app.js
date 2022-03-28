const express = require('express');
const helmet = require("helmet");
const cors = require("cors");
const app = express();
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const sauceRoutes = require('./routes/sauce');
const userRoutes = require('./routes/user');

const ID = process.env.DB_USER;
const PASSWORD = process.env.DB_PASSWORD;
const BDD_NAME = process.env.DB_NAME;
const CLUSTER = process.env.DB_CLUSTER;

var corsOptions = {
    origin: "http://127.0.0.1:5500"
};

app.use(cors(corsOptions));
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    }
));

mongoose.connect(`mongodb+srv://${ID}:${PASSWORD}${CLUSTER}.mongodb.net/${BDD_NAME}?retryWrites=true&w=majority`,
    { useNewUrlParser: true,
        useUnifiedTopology: true })
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(() => console.log('Connexion à MongoDB échouée !'));

app.use(bodyParser.json());

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/api/sauces', sauceRoutes);
app.use('/api/auth', userRoutes);

module.exports = app;