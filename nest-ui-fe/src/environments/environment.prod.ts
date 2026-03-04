export const environment = {
  production: true,

  paths: {
    windows: 'C:\\Production\\Base_Files',
    macos: '/Users/Production/Base_Files',
  },

  app: {
    name: 'NEST UI',
    version: '1.0.0',
    progressInterval: 500,
  },

  validFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],

  limits: {
    maxFileSize: 10 * 1024 * 1024, //10 MB
    maxFiles: 100,
  },
};
