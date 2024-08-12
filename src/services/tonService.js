const { Address } = require('ton-core');

class TonService {
  async validateAddress(address) {
    console.log('Attempting to validate address:', address);
    try {
      if (typeof address !== 'string' || address.length === 0) {
        throw new Error('Address must be a non-empty string');
      }

      // Базовая проверка формата адреса
      const addressRegex = /^[0-9a-zA-Z_-]{48}$/;
      if (!addressRegex.test(address)) {
        throw new Error('Address format is incorrect');
      }

      // Попытка создать объект адреса
      let parsedAddress;
      try {
        parsedAddress = new Address(address);
      } catch (error) {
        console.warn('Warning: Could not create Address object:', error.message);
        // Если не удалось создать объект Address, просто вернем исходный адрес
        return address;
      }

      console.log('Address parsed successfully:', parsedAddress.toString());
      return parsedAddress.toString();
    } catch (error) {
      console.error('Detailed error while validating address:', error);
      throw new Error(`Invalid TON address: ${error.message}`);
    }
  }

  async getBalance(address) {
    // Этот метод нужно будет реализовать позже
    throw new Error('Not implemented');
  }
}

module.exports = new TonService();