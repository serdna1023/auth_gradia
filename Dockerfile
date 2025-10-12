# -----------------------------------------------------------------
# ETAPA 1: Construcción (Build Stage)
# -----------------------------------------------------------------
# Usamos una imagen oficial de Node.js. La versión 18-alpine es ligera y segura.
FROM node:18-alpine AS base

# Establecemos el directorio de trabajo DENTRO del contenedor
WORKDIR /usr/src/app

# Copiamos package.json y package-lock.json ANTES que el resto del código.
# Esto aprovecha la caché de Docker y acelera futuras construcciones.
COPY package*.json ./

# -----------------------------------------------------------------
# ETAPA 2: Dependencias de Producción
# -----------------------------------------------------------------
# Instalamos solo las dependencias necesarias para producción
RUN npm ci --only=production

# -----------------------------------------------------------------
# ETAPA 3: Aplicación Final
# -----------------------------------------------------------------
# Copiamos el resto del código de nuestra aplicación
COPY . .

# Exponemos el puerto que usa nuestro servidor Express (ajústalo si es diferente)
EXPOSE 8080

# El comando que se ejecutará para iniciar la aplicación
# Basado en tu estructura, el archivo principal es server.js
CMD [ "node", "server.js" ]