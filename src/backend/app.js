const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const apiRouter = require('./routes/api.routes');
const globalErrorHandler = require('./middleware/error.middleware');
const AppError = require('./utils/appError');

const app = express();

// 1) Global Security & Utility Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false // Allows loading external images and inline scripts smoothly for local store
  })
);
app.use(cors());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 2) Serve Static Web Assets
const rootDir = path.join(__dirname, '../../');
const publicDir = path.join(rootDir, 'public');
const frontendDir = path.join(rootDir, 'src/frontend');
const imagesDir = path.join(rootDir, 'images');

app.use(express.static(publicDir));
app.use('/src/frontend', express.static(frontendDir));
app.use('/images', express.static(imagesDir));


// 3) API Routes
app.use('/api', apiRouter);

// 4) 404 Handler for Unknown API Routes
app.all('/api/{*splat}', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});


// 5) Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
