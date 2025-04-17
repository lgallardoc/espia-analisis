# Espía Análisis

Este proyecto tiene como objetivo analizar la estructura de los archivos que representan tablas de distintos esquemas y comparar la información entre diferentes países.

## Características
- Análisis de estructuras de tablas.
- Comparación de esquemas de datos por país.

## Requisitos
- Node.js (v14 o superior)
- Visual Studio Code (para modo debug)

## Instalación
1. Clona el repositorio:
   ```bash
   git clone https://github.com/lgallardoc/espia-analisis.git
   cd espia-analisis
   ```

2. Instala las dependencias usando npm:
   ```bash
   npm install
   ```

## Ejecución en modo Debug con Visual Studio Code
1. Abre Visual Studio Code y carga la carpeta del proyecto.
2. Asegúrate de tener configurado el archivo `launch.json` para depuración. Un ejemplo común es:
   ```json
   {
       "version": "0.2.0",
       "configurations": [
           {
               "type": "node",
               "request": "launch",
               "name": "Iniciar programa",
               "skipFiles": ["<node_internals>/**"],
               "program": "${workspaceFolder}/index.js" // Ajusta esto al punto de entrada de tu proyecto.
           }
       ]
   }
   ```
3. Presiona `F5` para iniciar la depuración.

## Contribución
Si deseas contribuir, crea un fork de este repositorio, realiza tus cambios en una rama y envía un Pull Request.

## Licencia
[Especificar la licencia, si corresponde]