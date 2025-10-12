class LogAuditoria {
  constructor({ id = null, id_usuario, tipo_evento, ip_direccion = null, descripcion_evento = '', fecha_evento = new Date() }) {
    if (!id_usuario) throw error('USER_ID_REQUERIDO', 400);
    if (!tipo_evento || tipo_evento.trim().length < 3) throw error('TIPO_EVENTO_INVALIDO', 400);

    this.id = id;
    this.id_usuario = id_usuario;
    this.tipo_evento = tipo_evento.trim().toUpperCase();
    this.ip_direccion = ip_direccion;
    this.descripcion_evento = descripcion_evento?.trim?.() || '';
    this.fecha_evento = new Date(fecha_evento);
  }
}
function error(message, status) { const e = new Error(message); e.status = status; return e; }
module.exports = { LogAuditoria };
