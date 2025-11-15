const { Rol, Persona } = require('../../SequelizeModels');

const getMyProfile = ({ authRepo }) => async (userId) => {
    // 🔧 IMPORTANTE: Incluir tanto Persona como Roles explícitamente
    const user = await authRepo.findUsuarioById(userId, {
        include: [
            {
                model: Persona,
                as: 'Persona',
                attributes: ['nombre', 'apellido'],
            },
            {
                model: Rol,
                as: 'Rols',
                attributes: ['nombre_rol'],
                through: { attributes: [] },
            },
        ],
    });

    if (!user) {
        const err = new Error('Usuario no encontrado.');
        err.status = 404;
        throw err;
    }

    // FORMATEAR LA RESPUESTA
    return {
        id_usuario: user.id_usuario,
        correo_institucional: user.correo_institucional,
        
        // Campos de la tabla Persona para el frontend
        nombre: user.Persona?.nombre,
        apellido: user.Persona?.apellido,

        // Roles
        roles: user.Rols ? user.Rols.map(rol => rol.nombre_rol) : [],
    };
};

module.exports = { getMyProfile };