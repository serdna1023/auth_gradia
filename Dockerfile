# Usa la imagen base de Node.js v18 Alpine (ligera)
FROM node:18-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copia PRIMERO los archivos package.json y package-lock.json
# Esto aprovecha la caché de Docker: si no cambian, no reinstala todo
COPY package*.json ./

# Instala TODAS las dependencias (incluyendo devDependencies como nodemon)
# Usamos 'npm install' que es más estándar para desarrollo
RUN npm install

# Copia el RESTO del código de tu aplicación al directorio de trabajo
COPY . .

# Expone el puerto en el que corre tu aplicación
EXPOSE 8080

# Comando por defecto (será sobreescrito por docker-compose.yml)
CMD ["npm", "start"]