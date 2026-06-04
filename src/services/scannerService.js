import api from './api';

const scannerService = {
  getQrCode: async (employeeId) => {
    const response = await api.get(`/scanner/qr-code/${employeeId}`);
    return response.data;
  },

  verifyScan: async (scanData) => {
    const response = await api.post('/scanner/verify', { data: scanData });
    return response.data;
  },
};

export default scannerService;
