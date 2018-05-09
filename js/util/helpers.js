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
};

module.exports = helpers;