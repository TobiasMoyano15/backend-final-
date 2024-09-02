import { userService } from '../Service/service.js';
import nodemailer from 'nodemailer';
import moment from 'moment';

// Configura tu transportador de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tu_email@gmail.com',
    pass: 'tu_contraseña'
  }
});

class UserController {
    constructor() {
        this.userService = userService;
    }

    getUsers = async (req, res) => {
        try {
            const users = await this.userService.getUsers();
            res.send({ status: 'success', payload: users.docs });
        } catch (error) {
            res.status(500).send({ status: 'error', error: error.message });
        }
    };

    getUserBy = async (req, res) => {
        const { uid } = req.params;
        try {
            const userFound = await this.userService.getUser({ _id: uid });
            if (!userFound) {
                return res.status(404).send({ status: 'error', message: 'User not found' });
            }
            res.send({ status: 'success', payload: userFound });
        } catch (error) {
            res.status(500).send({ status: 'error', error: error.message });
        }
    };

    createUser = async (req, res) => {
        const { body } = req;
        try {
            const result = await this.userService.createUser(body);
            res.send({ status: 'success', payload: result });
        } catch (error) {
            res.status(500).send({ status: 'error', error: error.message });
        }
    };

    updateUser = async (req, res) => {
        const { uid } = req.params;
        const { first_name, last_name, password } = req.body;

        try {
            const userFound = await this.userService.getUser({ _id: uid });
            if (!userFound) {
                return res.status(404).send({ status: 'error', message: 'User not found' });
            }

            const updatedUser = {};
            if (first_name) updatedUser.first_name = first_name;
            if (last_name) updatedUser.last_name = last_name;
            if (password) updatedUser.password = password;

            if (Object.keys(updatedUser).length === 0) {
                return res.status(400).send({ status: 'error', message: 'No hay nada para actualizar' });
            }

            const result = await this.userService.updateUser({ _id: uid }, updatedUser);

            if (result.nModified === 0) {
                return res.status(400).send({ status: 'error', message: 'No se hicieron cambios en el usuario' });
            }

            res.status(200).send({ status: 'success', message: `Usuario actualizado ${result}` });
        } catch (error) {
            res.status(500).send({ status: 'error', message: error.message });
        }
    };

    updateRole = async (req, res) => {
        const { uid } = req.params;
        const { role } = req.body;

        const validRoles = ['user', 'premium'];
        if (!validRoles.includes(role)) {
            return res.status(400).send({ status: 'error', error: 'El rol a cambiar no es válido, debe ser user o premium' });
        }

        try {
            const userFound = await this.userService.getUser({ _id: uid });
            if (!userFound || userFound.role === 'admin') {
                return res.status(404).send({ status: 'error', message: 'No existe el usuario, o no está autorizado a cambiar este usuario' });
            }

            await this.userService.updateUser({ _id: uid }, { role: role });
            res.status(200).send({ status: 'success', message: `Usuario actualizado con el nuevo rol ${role}` });
        } catch (error) {
            res.status(500).send({ status: 'error', message: error.message });
        }
    };

    removeUser = async (req, res) => {
        const { userEmail } = req.params;
        try {
            const userFound = await this.userService.removeUser({ email: userEmail });
            if (!userFound) {
                return res.status(404).send({ status: 'error', message: 'User not found' });
            }
            res.send({ status: 'success', payload: `User: ${userFound} deleted` });
        } catch (error) {
            res.status(500).send({ status: 'error', message: error.message });
        }
    };

    // Nuevo método para subir documentos del usuario
    uploadUserDocument = async (req, res) => {
        const { uid } = req.params;
        try {
            const userFound = await this.userService.getUser({ _id: uid });
            if (!userFound) {
                return res.status(404).send({ status: 'error', message: 'User not found' });
            }

            // Suponiendo que req.files contiene los documentos subidos
            const { files } = req;
            const documentType = req.body.suffix;

            if (!files || !documentType) {
                return res.status(400).send({ status: 'error', message: 'Faltan documentos o tipo de documento' });
            }

            // Lógica para manejar la carga de documentos
            const result = await this.userService.uploadDocument(uid, documentType, files);
            res.status(200).send({ status: 'success', message: 'Documento subido correctamente', payload: result });
        } catch (error) {
            res.status(500).send({ status: 'error', message: error.message });
        }
    };

    // Nuevo método para verificar si el usuario puede ser premium
    checkPremiumStatus = async (req, res) => {
        const { uid } = req.params;
        try {
            const userFound = await this.userService.getUser({ _id: uid });
            if (!userFound) {
                return res.status(404).send({ status: 'error', message: 'User not found' });
            }

            const needsUpgrade = await this.userService.checkPremiumEligibility(uid);
            res.status(200).send({ status: 'success', needsUpgrade });
        } catch (error) {
            res.status(500).send({ status: 'error', message: error.message });
        }
    };

    // Nuevo método para actualizar el usuario a premium
    upgradeToPremium = async (req, res) => {
        const { userId } = req.body;
        try {
            const userFound = await this.userService.getUser({ _id: userId });
            if (!userFound) {
                return res.status(404).send({ status: 'error', message: 'User not found' });
            }

            await this.userService.updateUser({ _id: userId }, { role: 'premium' });
            res.status(200).send({ status: 'success', message: 'Usuario actualizado a premium' });
        } catch (error) {
            res.status(500).send({ status: 'error', message: error.message });
        }
    };

    // Nuevo método para eliminar usuarios inactivos
    deleteInactiveUsers = async (req, res) => {
        try {
            const cutoffDate = moment().subtract(2, 'days').toDate();
            const inactiveUsers = await this.userService.getUsers({ lastLogin: { $lt: cutoffDate } });

            // Elimina los usuarios inactivos
            await this.userService.deleteUsers({ lastLogin: { $lt: cutoffDate } });

            // Enviar correos a los usuarios eliminados
            inactiveUsers.forEach(user => {
                const mailOptions = {
                    from: 'tu_email@gmail.com',
                    to: user.email,
                    subject: 'Cuenta eliminada',
                    text: 'Tu cuenta ha sido eliminada por inactividad.'
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log('Error al enviar correo: ', error);
                    }
                });
            });

            res.json({ status: 'success', message: 'Usuarios inactivos eliminados' });
        } catch (error) {
            res.status(500).send({ status: 'error', message: error.message });
        }
    };
}

export default UserController;
