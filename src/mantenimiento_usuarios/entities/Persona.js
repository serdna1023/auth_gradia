class Persona {
  constructor({ id = null, nombre, apellido, fecha_nacimiento = null }) {
    if (!nombre || nombre.trim().length < 2) throw error('NOMBRE_INVALIDO', 400);
    if (!apellido || apellido.trim().length < 2) throw error('APELLIDO_INVALIDO', 400);

    if (fecha_nacimiento && isNaN(Date.parse(fecha_nacimiento))) {
      throw error('FECHA_NACIMIENTO_INVALIDA', 400);
    }

    this.id = id;
    this.nombre = nombre.trim();
    this.apellido = apellido.trim();
    this.fecha_nacimiento = fecha_nacimiento ? new Date(fecha_nacimiento) : null;
  }
}

function error(message, status) { const e = new Error(message); e.status = status; return e; }
module.exports = { Persona };
