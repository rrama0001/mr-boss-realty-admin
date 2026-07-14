export default {
    methods: {
      formatPrice(value) {
        if (value === null || value === undefined || value === '') return '0.00';
  
        const number = Number(value);
        if (isNaN(number)) return '0.00';
  
        return number.toLocaleString('en-US', {
        //   minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }
    }
  };