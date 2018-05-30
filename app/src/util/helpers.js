import moment from 'moment';
const helpers = {
  groupBy: (xs, key) => xs.reduce((rv, x) => {
    (rv[x[key]] = rv[x[key]] || []).push(x); // eslint-disable-line
    return rv;
  }, {}),
  round: (num, pre) => {
    const shift = (number, precision) => {
      const numArray = (`${number}`).split('e');
      return +(`${numArray[0]}e${(numArray[1] ? (+numArray[1] + precision) : precision)}`);
    };
    return shift(Math.round(shift(num, +pre)), -pre);
  },
  isInDateRange: (date, dateRange) => {
    switch(dateRange) {
      case 'thisWeek':
        return moment(date).isSame(moment(), 'week');
      case 'thisMonth':
        return moment(date).isSame(moment(), 'month');
      case 'lastMonth':
        return moment(date).isSame(moment().subtract(1, 'month'), 'month');
      case 'thisYear':
        return true; // all transactions are for the year
    }
  },
  intVal:  i => typeof i === 'string' ?
        i.replace(/[\$,]/g, '') * 1 :
        typeof i === 'number' ?
            i : 0,
};

export default helpers;
