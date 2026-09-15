const ProductService = require('../services/product.service');
const asyncWrapper = require('../utils/asyncWrapper');

exports.getAllProducts = asyncWrapper(async (req, res) => {
  const products = await ProductService.getAll();
  res.status(200).json(products);
});

exports.getProductById = asyncWrapper(async (req, res) => {
  const product = await ProductService.getById(req.params.id);
  res.status(200).json(product);
});

exports.createProduct = asyncWrapper(async (req, res) => {
  const newProduct = await ProductService.create(req.body);
  res.status(201).json(newProduct);
});

exports.updateProduct = asyncWrapper(async (req, res) => {
  const updatedProduct = await ProductService.update(req.params.id, req.body);
  res.status(200).json(updatedProduct);
});

exports.deleteProduct = asyncWrapper(async (req, res) => {
  await ProductService.delete(req.params.id);
  res.status(200).json({ ok: true });
});
