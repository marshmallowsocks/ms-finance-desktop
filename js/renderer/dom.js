const visualizations = require('./visualizations');

const api = require('../api');
const Store = require('../store');
const MarkupGenerator = require('../markup');
const constants = require('../constants');

const markup = new MarkupGenerator();

const activeDateRanges = {
  thisWeek: true,
  thisMonth: false,
  lastMonth: false,
  thisYear: false,
};

class DomHelpers {
  constructor() {
    if(!DomHelpers.instance) {
      DomHelpers.instance = this;
    }

    return DomHelpers.instance;
  }
  drawAll() {
    $('#overview').html(markup.drawOverview(Store));
    $('#accounts').html(markup.drawAccountCards(Store));
    $('#credit').html(markup.drawCreditCards(Store));
    $('#investments').html(markup.drawInvestmentCards(Store));
    $('#banks').html(markup.drawBankCards(Store));
    $('#crypto').html(markup.drawCryptoCards(Store));
    $('#groups').html(markup.drawGroups(Store));
    this.drawTransactions();
    this.drawCalendarTransactions();
    visualizations.drawTransactionBreakdown('thisWeek');
    visualizations.drawBudgetForYear();
    this.attachChartHandlers();
    this.attachGroupHandlers();
    this.drawNetBalance(Store.netBalance);
    this.drawContextBalance(Store.netBalance);
    this.hideLoader();
  }
  
  drawTransactions() {
    $('#transactions').html(markup.drawTransactions(Store));
    visualizations.initializeDataTable('transactionsTable', 'transactions');
    feather.replace();
  }
  
  drawNone() {
    Object.keys(constants.pages).forEach(page => {
      $(`#${page}`).html(markup.drawNoneCard());
    });
  
    this.drawNetBalance('-');
    this.hideLoader();
  }
  
  drawError() {
    //TODO: finish this function
    // $('#overview').html();
    // $('#accounts').html(markup.drawAccountCards(Store));
    // $('#credit').html(markup.drawCreditCards(Store));
    // $('#investments').html(markup.drawInvestmentCards(Store));
  
    // $('#netBalance').html(Store.netBalance);
    this.hideLoader();
  }
  
  drawNetBalance(balance) {
    //also replace all feather icons.
    feather.replace();
  
    const netBalanceMarkup = markup.drawNetBalance(balance);
    $('#netBalance').addClass(netBalanceMarkup.classStyle);
    $('#netBalance').html(netBalanceMarkup.balance);
  }
  
  drawContextBalance(balance) {
    $('#contextBalance').removeClass();
    const contextBalanceMarkup = markup.drawNetBalance(balance);
    $('#contextBalance').addClass(contextBalanceMarkup.classStyle);
    $('#contextBalance').html(contextBalanceMarkup.balance);
  }
  
  drawCalendarTransactions() {
    $('#calendarContainer').fullCalendar({
      defaultView: 'month',
      dayRender: (date, cell) => {
        if(date.isAfter(moment().format('YYYY-MM-DD'))) {
          return;
        }
        const transactionData = Store.getTransactionsSummaryForDate(date.format());
        $(cell).html(markup.drawTransactionForDate(transactionData));
      },
      dayClick: (date, jsEvent, view) => {
        const transactionData = Store.getTransactionsForDate(date.format());
        $('#transactionsByDate').html(
          `<h3>Charges on ${date.format('MMMM Do YYYY')}</h3>${markup.drawTransactionsByCategory(transactionData, 'Calendar')}`
        );
        visualizations.initializeDataTable('transactionsCategoryTableCalendar', '');
      }
    });
  }
  createAccountObject(crypto, holdings) {
    const storeObject = {};
    storeObject.crypto = [];
    storeObject.crypto.push({
      account_id: crypto.id,
      balances: {
        available: (crypto.holdings || holdings) * crypto.quotes.USD.price,
        current: null,
        limit: null,
      },
      institutionName: crypto.symbol,
      mask: `Holdings: ${crypto.holdings || holdings} ${crypto.symbol}`, // use the mask field to show holdings in card
      official_name: `Price as of ${moment.unix(crypto.last_updated).format('MMM Do YYYY HH:mm:ss')} : <span class="font-weight-bold">$${crypto.quotes.USD.price}</span>`, // use the official_name field to show current price.
      name: crypto.name,
      subtype: 'crypto',
      type: 'crypto'
    });

    return storeObject;
  }

  showLoader() {
    $('#app > div').addClass('d-none');
    $('#loading').removeClass('d-none');
  }

  hideLoader() {
    $('#app > div').addClass('d-none');
    $('#' + constants.titles[$('#title').text()]).removeClass('d-none');
  }

  attachGroupHandlers() {
    Store.groups.forEach(group => {
      $(`#group${group.id}`).on('click', e => {
        api.deleteGroup(group.id).then(res => {
          this.triggerRefresh({type: 'groups'});
        });
      });
    });
  }

  attachChartHandlers() {
    $('#chartTransactionThisWeek').on('click', function(e) {
      activeDateRanges.thisWeek = !activeDateRanges.thisWeek;
      $('#chartTransactionButtonBar > button.btn-primary').removeClass('btn-primary').addClass('btn-secondary');
      $(this).addClass('btn-primary').removeClass('btn-secondary');
      visualizations.drawTransactionBreakdown('thisWeek');
    });

    $('#chartTransactionThisMonth').on('click', function(e) {
      activeDateRanges.thisMonth = !activeDateRanges.thisMonth;
      $('#chartTransactionButtonBar > button.btn-primary').removeClass('btn-primary').addClass('btn-secondary');
      $(this).addClass('btn-primary').removeClass('btn-secondary');
      visualizations.drawTransactionBreakdown('thisMonth');
    });

    $('#chartTransactionLastMonth').on('click', function(e) {
      activeDateRanges.lastMonth = !activeDateRanges.lastMonth;
      $('#chartTransactionButtonBar > button.btn-primary').removeClass('btn-primary').addClass('btn-secondary');
      $(this).addClass('btn-primary').removeClass('btn-secondary');
      visualizations.drawTransactionBreakdown('lastMonth');
    });

    $('#chartTransactionThisYear').on('click', function(e) {
      activeDateRanges.thisYear = !activeDateRanges.thisYear;
      $('#chartTransactionButtonBar > button.btn-primary').removeClass('btn-primary').addClass('btn-secondary');
      $(this).addClass('btn-primary').removeClass('btn-secondary');
      visualizations.drawTransactionBreakdown('thisYear');
    });
  }

  setupCryptoSuggestions(crypto) {
    const source = [];
    let suggestions;
    Object.keys(crypto).forEach(key => {
      source.push(crypto[key]);
    });
    Store.addAllCrypto(source);
    
    suggestions = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.whitespace,
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      local: source.map(s => s.symbol)
    });

    $('#addCryptoField').typeahead({
      hint: true,
      highlight: true,
      minLength: 1,
    },
    {
      name: 'crypto',
      source: suggestions
    });

    $('#addCryptoField').bind('typeahead:selected', (obj, data, name) => {
      if(Store.getCryptoInformation(data)) {
        $('#cryptoSubmit').prop('disabled', false);
      }
      else {
        $('#cryptoSubmit').prop('disabled', true);
      }
    });
  }

  triggerRefresh(item) {
    const validateItem = () => {
      if(!(item.type || (item.multiple && (item.types || item.without)))) {
        throw Error({
          msg: 'TriggerRefresh item is invalid.'
        });
      } 
    }
    const allTypes = [
      'all',
      'overview',
      'accounts',
      'credit',
      'investments',
      'banks',
      'crypto',
      'groups',
      'transactions'
    ];

    if(!item.multiple) {
      item.types = [item.type];
    }
    else {
      if(item.without) {
        item.types = allTypes.filter(type => item.without.indexOf(type) === -1);
      }
    }
    item.types.forEach(type => {
      switch(type) {
        case 'all':
          this.drawAll();
          break;
        case 'overview':
          $('#overview').html(markup.drawOverview(Store));
          visualizations.drawBudgetForYear();
          break;
        case 'accounts':
          $('#accounts').html(markup.drawAccountCards(Store));
          break;
        case 'credit':
          $('#credit').html(markup.drawCreditCards(Store));
          break;
        case 'investments':
          $('#investments').html(markup.drawInvestmentCards(Store));
          break;
        case 'banks':
          $('#banks').html(markup.drawBankCards(Store));
          break;
        case 'crypto':
          $('#crypto').html(markup.drawCryptoCards(Store));
          break;
        case 'groups':
          $('#groups').html(markup.drawGroups(Store));
          this.attachGroupHandlers();
          break;
        case 'transactions':
          visualizations.drawTransactions();
          this.drawCalendarTransactions();
          visualizations.drawTransactionBreakdown('thisWeek');
          this.attachChartHandlers();
          break;
      }
    });
    this.drawNetBalance(Store.netBalance);
    this.drawContextBalance(Store.netBalance);
    this.hideLoader();
  }
}

const instance = new DomHelpers();
Object.freeze(instance);
module.exports = instance;
