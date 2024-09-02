import { Router } from "express";
import { passportCall } from "../util/passportCall.js";
import { authorizationJwt } from "../util/authorizationJwt.js";
import { productService, cartService, userService, ticketService } from "../Service/service.js";
import UserDto from "../dtos/usersDto.js";
import UserSecureDto from "../dtos/userSecureDto.js";
import generateProductsMock from "../util/generateProductsMock.js";
import { logger } from "../util/logger.js";
import jwt from 'jsonwebtoken';
import { objectConfig } from "../Config/db.js";

const { jwt_private_key } = objectConfig;
const router = Router();

router.get('/', async (req, res) => {
    res.redirect('/login');
});

router.get('/login', (req, res) => {
    res.render('login'); // Solo el nombre del archivo
});

router.get('/register', (req, res) => {
    res.render('register'); // Solo el nombre del archivo
});

router.get('/password-recovery', async (req, res) => {
    res.render('password-recovery'); // Solo el nombre del archivo
});

router.get('/reset-password', async (req, res) => {
    const token = req.query.token;
    
    if (!token) {
        return res.render('password-recovery'); // Solo el nombre del archivo
    }

    try {
        const tokenCheck = jwt.verify(token, jwt_private_key);
        logger.info('Token: ', tokenCheck);
        res.render('reset-password', { token }); // Solo el nombre del archivo
    } catch (error) {
        logger.error('Token Inválido o expirado:', error);
        res.render('password-recovery'); // Solo el nombre del archivo
    }
});

router.get('/users', passportCall('jwt'), authorizationJwt('admin', 'premium', 'user'), async (req, res) => {
    const { numPage, limit } = req.query;
    try {
        const { docs, page, hasPrevPage, hasNextPage, prevPage, nextPage } = await userService.getUsers({ limit, numPage });
        res.render('users', {
            users: docs,
            page,
            hasNextPage,
            hasPrevPage,
            nextPage,
            prevPage
        });
    } catch (error) {
        logger.error('Error obteniendo usuarios:', error);
        res.status(500).send('Error interno del servidor');
    }
});

router.get('/current', passportCall('jwt'), authorizationJwt('user'), async (req, res) => {
    const { id } = req.user;
    try {
        const user = await userService.getUser({ _id: id });
        const secureUser = new UserSecureDto(user);
        res.render('user', { user: secureUser }); // Solo el nombre del archivo
    } catch (error) {
        logger.error('Error obteniendo usuario actual:', error);
        res.status(500).send('Error interno del servidor');
    }
});

router.get('/products', passportCall('jwt'), authorizationJwt('admin', 'premium', 'user'), async (req, res) => {
    const { limit = 10, pageNum = 1, category, status, product: title, sortByPrice } = req.query;
    try {
        const { docs, page, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages } = await productService.getProducts({ limit, pageNum, category, status, title, sortByPrice });
        let prevLink = null;
        let nextLink = null;

        if (hasPrevPage) {
            prevLink = `/products?pageNum=${prevPage}`;
            if (limit) prevLink += `&limit=${limit}`;
            if (title) prevLink += `&title=${title}`;
            if (category) prevLink += `&category=${category}`;
            if (status) prevLink += `&status=${status}`;
            if (sortByPrice) prevLink += `&sortByPrice=${sortByPrice}`;
        }

        if (hasNextPage) {
            nextLink = `/products?pageNum=${nextPage}`;
            if (limit) nextLink += `&limit=${limit}`;
            if (title) nextLink += `&product=${title}`;
            if (category) nextLink += `&category=${category}`;
            if (status) nextLink += `&status=${status}`;
            if (sortByPrice) nextLink += `&sortByPrice=${sortByPrice}`;
        }

        return res.render('index', {
            products: docs,
            totalPages,
            prevPage,
            nextPage,
            page,
            hasPrevPage,
            hasNextPage,
            prevLink,
            nextLink,
            category,
            sortByPrice,
            availability: status,
            email: req.user.email,
            role: req.user.role,
            cart: req.user.cart
        });
    } catch (error) {
        logger.error('Error obteniendo productos:', error);
        res.status(500).send('Error interno del servidor');
    }
});

router.get('/product/:pid', passportCall('jwt'), authorizationJwt('admin', 'premium', 'user'), async (req, res) => {
    const { pid } = req.params;
    try {
        const product = await productService.getProduct({ _id: pid });
        res.render('product', { product, cart: req.user.cart }); // Solo el nombre del archivo
    } catch (error) {
        res.status(500).send({ status: "error", error: error.message });
    }
});

router.get('/cart/:cid', passportCall('jwt'), authorizationJwt('admin', 'premium', 'user'), async (req, res) => {
    const { cid } = req.params;
    try {
        const cart = await cartService.getCart({ _id: cid });
        res.render('cart', { cart }); // Solo el nombre del archivo
    } catch (error) {
        res.status(500).send({ status: "error", error: error.message });
    }
});

router.get('/tickets', passportCall('jwt'), async (req, res) => {
    const { email } = req.user;
    try {
        const ticket = await ticketService.getTickets({ purchaser: email });
        res.render('tickets', { ticket, email }); // Solo el nombre del archivo
    } catch (error) {
        res.status(500).send({ status: "error", error: error.message });
    }
});

router.get('/create-products', passportCall('jwt'), authorizationJwt('premium', 'admin'), (req, res) => {
    res.render('createproducts'); // Solo el nombre del archivo
});

router.get('/realtimeproducts', passportCall('jwt'), (req, res) => {
    res.render('realtimeproducts'); // Solo el nombre del archivo
});

router.get('/chat', passportCall('jwt'), authorizationJwt('user'), (req, res) => {
    res.render('chat'); // Solo el nombre del archivo
});

router.get('/mockingproducts', (req, res) => {
    let products = [];
    for (let i = 0; i < 100; i++) {
        products.push(generateProductsMock());
    }
    res.send({ status: 'success', payload: products });
});

export default router;
