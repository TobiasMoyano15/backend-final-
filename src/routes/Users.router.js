import { Router } from 'express';
import UserController from '../Controllers/users.controller.js';

const router = Router();
const {
    createUser,
    getUsers,
    getUserBy,
    updateUser,
    removeUser,
    uploadUserDocument,
    checkPremiumStatus,
    upgradeToPremium,
    deleteInactiveUsers
} = new UserController();

// Rutas para usuarios
router.post('/', createUser);
router.get('/', getUsers);
router.get('/:uid', getUserBy);
router.put('/:uid', updateUser);
router.delete('/:uid', removeUser);

// Nuevo endpoint para subir documentos del usuario
router.post('/:uid/documents', uploadUserDocument);

// Nuevo endpoint para verificar si el usuario puede ser premium
router.get('/:uid/check-premium-status', checkPremiumStatus);

// Nuevo endpoint para actualizar el usuario a premium
router.post('/upgrade-to-premium', upgradeToPremium);

// Nuevo endpoint para eliminar usuarios inactivos
router.delete('/inactive', deleteInactiveUsers);

export default router;
