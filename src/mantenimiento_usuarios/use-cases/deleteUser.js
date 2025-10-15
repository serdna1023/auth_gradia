/**
 * @param {object} dependencies 
 * @param {object} dependencies.authRepo 
 */
const deleteUser = ({ authRepo }) => async ({ userIdToDelete, adminId }) => {
  // 1. Validación de seguridad: Un admin no puede eliminarse a sí mismo.
  if (Number(userIdToDelete) === Number(adminId)) {
    const err = new Error('Un administrador no puede eliminarse a sí mismo.');
    err.status = 403; 
    throw err;
  }

  // 2. Buscamos al usuario que se va a eliminar.
  const user = await authRepo.findUsuarioById(userIdToDelete);
  if (!user) {
    const err = new Error('El usuario que intentas eliminar no existe.');
    err.status = 404;
    throw err;
  }

  await user.destroy();

  return { message: `Usuario con ID ${userIdToDelete} ha sido desactivado correctamente.` };
};

module.exports = { deleteUser };