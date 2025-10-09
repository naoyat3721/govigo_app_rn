import 'dotenv/config';

export default {
  expo: {
    name: process.env.APP_NAME || 'GovigolfExpo',
    slug: 'GovigolfExpo',
    scheme: 'GovigolfExpo', 
    version: '1.0.0',
    extra: {
      apiUrl: process.env.API_URL,
      webUrl: process.env.WEB_URL,
      downloadUrlMessage: process.env.DOWNLOAD_URL_MESSAGE,
      socketUrl: process.env.SOCKET_URL,
    },
  },
};