class Usuario {
  constructor({
    id = null,
    correo_institucional,
    password_hash,      // ya debe venir hasheado desde el use-case
    estado = 'activo',
    id_persona,
  }) {
    if (!correo_institucional || !correo_institucional.includes('@')) {
      throw error('EMAIL_INVALIDO', 400);
    }
    if (!password_hash || typeof password_hash !== 'string' || password_hash.length < 50) {
      // bcrypt rounds típicos generan ~60 chars
      throw error('PASSWORD_HASH_INVALIDO', 400);
    }
    const estadosPermitidos = ['activo', 'inactivo', 'bloqueado'];
    if (!estadosPermitidos.includes(estado)) throw error('ESTADO_INVALIDO', 400);

    if (!id_persona) throw error('PERSONA_REQUERIDA', 400);

    this.id = id;
    this.correo_institucional = correo_institucional.toLowerCase().trim();
    this.password_hash = password_hash;
    this.estado = estado;
    this.id_persona = id_persona;
  }
}

function error(message, status) { const e = new Error(message); e.status = status; return e; }
module.exports = { Usuario };
