export const environment = {
  production: false,

  //Rutas base segun OS
  paths: {
    windows: 'C:\\Projects\\NEST-UI-V2\\Base_Files',
    macos: '/Users/Production/Base_Files',
  },

  //Rutas base segun OS
  outpaths: {
    windows: 'C:\\Projects\\NEST-UI-V2\\Base_Files',
    macos: '/Users/Production/Base_Files',
  },

  //Configuraciones de la app
  app: {
    name: 'NEST UI',
    version: '1.0.0',
    progressInterval: 500,
  },

  //Tipos de archivos validos
  validFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],

  //Limites
  limits: {
    maxFileSize: 10 * 1024 * 1024, //10 MB
    maxFiles: 100,
  },
};
