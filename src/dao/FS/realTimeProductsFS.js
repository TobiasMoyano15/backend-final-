import fs from 'node:fs';
import __dirname from '../../util/filenameUtils.js';
import { logger } from '../../util/logger.js';

const path = `${__dirname}/FS-Database/Products.json`;

class realTimeProductsDaoFS {
    constructor() {
        this.path = path;
    }

    readProductsJson = async () => {
        try {
            const productsJson = await fs.promises.readFile(this.path, 'utf-8');
            return JSON.parse(productsJson);
        } catch (error) {
            logger.error('Error al leer el archivo:', error);
            return [];
        }
    };

    writeProductJson = async (productsData) => {
        try {
            await fs.promises.writeFile(this.path, JSON.stringify(productsData, null, '\t'), 'utf-8');
        } catch (error) {
            logger.error('Error al escribir en el archivo:', error);
        }
    };

    create = async (title, description, code, price, status, stock, category, thumbnails = './images/IMG_placeholder.jpg') => {
        try {
            const product = {
                id: await this.getNextId(),
                title,
                description,
                code,
                price,
                status,
                stock,
                category,
                thumbnails
            };

            const productsData = await this.readProductsJson();
            const codeExistsCheck = productsData.find((prod) => prod.code === code);
            const completeProductCheck = [];

            for (const prop in product) {
                if (!product[prop]) {
                    completeProductCheck.push(prop);
                }
            }

            if (!product.title || !product.description || !product.code || !product.price || !product.stock || !product.category) {
                const errorMessage = `¡ERROR! debe llenar todos los campos del producto nuevo\nFaltaron agregar ${completeProductCheck.join(', ')}`;
                throw new Error(completeProductCheck.length > 1 ? errorMessage : errorMessage.replace('Faltaron agregar', 'Faltó agregar'));
            }

            if (typeof title !== 'string' || typeof description !== 'string' || typeof code !== 'string' || typeof category !== 'string' || typeof thumbnails !== 'string') {
                throw new Error("title, description, thumbnails, y code deben ser string");
            }

            if (typeof price !== 'number' || typeof stock !== 'number') {
                throw new Error("price y stock deben ser números");
            }

            if (typeof status !== 'boolean') {
                throw new Error("status debe ser booleano");
            }

            if (codeExistsCheck) {
                throw new Error(`¡ERROR! Producto ${product.title} no agregado\nEl código ${product.code} ya está siendo utilizado por el producto ${codeExistsCheck.title}, con el id ${codeExistsCheck.id}`);
            }

            productsData.push(product);
            await this.writeProductJson(productsData);
            return productsData;
        } catch (error) {
            logger.error('Error al agregar producto:', error);
            throw error;
        }
    };

    getAll = async () => {
        return await this.readProductsJson();
    };

    getBy = async (filter) => {
        try {
            const productsData = await this.readProductsJson();
            const foundProduct = productsData.find(prod => prod.filter === filter);
            if (!foundProduct) throw new Error(`No se encontró el producto con el filtro: ${filter}`);
            return foundProduct;
        } catch (error) {
            logger.error('Error al obtener producto por filtro:', error);
            throw error;
        }
    };

    update = async (productId, updatedProduct) => {
        try {
            const productsData = await this.readProductsJson();
            const productIndex = productsData.findIndex(product => product.id === productId);

            if (productIndex === -1) {
                throw new Error(`El Producto con el id: ${productId} no existe`);
            }

            const newUpdatedProduct = {
                ...productsData[productIndex],
                ...updatedProduct
            };

            productsData[productIndex] = newUpdatedProduct;
            await this.writeProductJson(productsData);
            return productsData;
        } catch (error) {
            logger.error('Error al actualizar producto:', error);
            throw error;
        }
    };

    remove = async (productId) => {
        try {
            const productsData = await this.readProductsJson();
            const productToDeleteIndex = productsData.findIndex(product => product.id === productId);

            if (productToDeleteIndex === -1) {
                throw new Error(`No existe el producto con id: ${productId}`);
            }

            logger.info(`El producto ${productsData[productToDeleteIndex].title} con el id ${productId} fue eliminado`);
            productsData.splice(productToDeleteIndex, 1);
            await this.writeProductJson(productsData);
        } catch (error) {
            logger.error('Error al eliminar producto:', error);
            throw error;
        }
    };

    getNextId = async () => {
        const productsData = await this.readProductsJson();
        if (productsData.length === 0) {
            return 1;
        }
        return productsData[productsData.length - 1].id + 1;
    };
}

export default realTimeProductsDaoFS;
