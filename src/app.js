import express from 'express';
import productsRouter from './routes/ProductRouter.js';
import cartRouter from './routes/CartRouter.js';
import viewsRouter from './routes/ViewRouter.js';
import path from 'path';
import multer from 'multer'; 
import { engine } from 'express-handlebars';
import { createServer } from 'http'; 
import { Server } from 'socket.io';
import { swaggerUi, swaggerDocs } from './swagger.js'; // Corrección de la ruta

const app = express();
const httpServer = createServer(app); 
const io = new Server(httpServer); 

// Obtener la ruta del directorio actual de forma compatible con ES Modules
const __dirname = path.resolve(path.dirname(''));

// Configuración del motor de plantillas
app.engine('hbs', engine({ 
    extname: '.hbs',
    defaultLayout: 'main', // Nombre del layout predeterminado
    layoutsDir: path.join(__dirname, 'views/layouts') // Directorio para layouts
}));

app.set('views', path.join(__dirname, 'views')); // Ruta para las vistas
app.set('view engine', 'hbs');

// Verificación de la ruta del directorio de vistas
console.log('Views directory:', path.join(__dirname, 'views'));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads')); // Ruta para los archivos subidos
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const uploader = multer({ storage: storage });

app.use('/upload-file', uploader.single('myFile'), (req, res) => {
    if (!req.file) {
        return res.send('No se pudo subir el archivo');
    }
    res.status(200).send('Archivo subido con éxito');
});

app.use('/', viewsRouter); // Asegúrate de que las rutas en `ViewRouter` sean correctas
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);

// Documentación de Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

let messages = [];
io.on('connection', socket => {
    console.log('Cliente conectado');

    socket.on('message', data => {
        messages.push(data);
        io.emit('messageLogs', messages);
    });
});

const PORT = 8080;
httpServer.listen(PORT, () => {
    console.log(`Server escuchando en puerto ${PORT}`);
    console.log('API Docs available at http://localhost:8080/api-docs');
});

export default app;
