// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const Chart  = require('chart.js');

const constants = require('./js/constants');
const api = require('./js/api');
const helpers = require('./js/util/helpers');

require('./js/renderer/handlers');
const pageInit = require('./js/renderer/init');

let transactionBreakdown;
let handler;

// starting point
pageInit();
