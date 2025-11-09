const express = require('express');
const router = express.Router();
const upload = require('../Middlewares/upload'); 
const productController = require('../Controllers/product');
const { isAuthenticated } = require('../middlewares/auth');

router.get('/', productController.listProducts);
router.get('/:id', productController.getProduct);

router.post('/', isAuthenticated, upload.single('image'), productController.addProduct);
router.put('/:id', isAuthenticated, upload.single('image'), productController.updateProduct);
router.delete('/:id', isAuthenticated, productController.deleteProduct);
router.put('/:id/stock', isAuthenticated, productController.updateStock);

router.post('/:id/optimize', isAuthenticated, productController.optimizePrice);

module.exports = router;
