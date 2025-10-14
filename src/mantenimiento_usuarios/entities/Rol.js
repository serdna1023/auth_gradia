class Rol {
  constructor({ id = null, nombre_rol, estado = 'activo' }) {
    if (!nombre_rol || nombre_rol.trim().length < 2) throw error('NOMBRE_ROL_INVALIDO', 400);
    const estadosPermitidos = ['activo', 'inactivo'];
    if (!estadosPermitidos.includes(estado)) throw error('ESTADO_ROL_INVALIDO', 400);

    this.id = id;
    this.nombre_rol = nombre_rol.trim().toUpperCase();
    this.estado = estado;
  }
}
function error(message, status) { const e = new Error(message); e.status = status; return e; }
module.exports = { Rol };
