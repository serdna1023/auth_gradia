class Permiso {
  constructor({ id = null, nombre_permiso, descripcion_permiso = '' }) {
    if (!nombre_permiso || nombre_permiso.trim().length < 2) {
      throw error('NOMBRE_PERMISO_INVALIDO', 400);
    }
    this.id = id;
    this.nombre_permiso = nombre_permiso.trim().toUpperCase();
    this.descripcion_permiso = descripcion_permiso?.trim?.() || '';
  }
}
function error(message, status) { const e = new Error(message); e.status = status; return e; }
module.exports = { Permiso };
