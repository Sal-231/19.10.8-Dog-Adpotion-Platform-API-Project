const express = require('express')
const connectToDb = require('./db')
const routes = require('./routes/authRoutes')
const dogRoutes = require('./routes/dogRoutes')
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { requireAuth, checkUser } = require('./middlewares/authMiddleware');

require('dotenv').config();

const user = require('./models/userModel');

app.use(cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000'
})); // Enable CORS for the specified origin
app.use(express.json()) // Takes JSON data from a request
app.use(cookieParser()) // Parses cookies from a request
app.set('view engine', 'ejs');


// Connects to mongodb and starts server on success
connectToDb();
app.listen(3000, () => {
    console.log("Server running on port 3000");
});


// Route handlers
app.get('/{*path}', checkUser); // Middleware to check if user is logged in for all routes
app.get('/', (req, res) => res.render('home'))  // Renders home.ejs
app.get('/dogs', requireAuth, (req, res) => res.render('dogs'))  // Renders dogs.ejs
app.use(routes);    // Route handlers
app.use(dogRoutes); // Route handlers for dog routes

if (require.main === module) {
    const PORT = process.env.PORT || 3000;

    connectToDb()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        })
        .catch(err => {
            console.error('Failed to connect to MongoDB:', err.message);
            process.exit(1);
        });
}

module.exports = app;
