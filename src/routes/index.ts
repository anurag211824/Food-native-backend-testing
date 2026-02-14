import express from 'express';
import * as auth from '../controllers/auth.js';
import * as restaurants from '../controllers/restaurants.js';
import * as menu from '../controllers/menu.js';
import * as search from '../controllers/search.js';
import * as orders from '../controllers/orders.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Auth
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', requireAuth, auth.me);

// Restaurants
router.get('/restaurants', restaurants.listRestaurants);
router.get('/restaurants/:id', restaurants.getRestaurant);
router.post('/restaurants', requireAuth, restaurants.createRestaurant);

// Menu
router.get('/menu/categories', menu.listCategories);
router.get('/menu/categories/:id/items', menu.getCategoryItems);

// Search
router.get('/search', search.search);

// Orders
router.post('/orders', requireAuth, orders.createOrder);
router.get('/orders', requireAuth, orders.listOrdersByRestaurant);

export default router;
