const helpers = require('../util/helpers');
const Store = require('../store');
const constants = require('../constants');
const MarkupGenerator = require('../markup');

const markup = new MarkupGenerator();

let colors = constants.colors;

class Visualizations {
  constructor() {
    if(!Visualizations.instance) {
      this.transactionBreakdown = null;
      Visualizations.instance = this;
    }
    
    return Visualizations.instance;
  }
  drawBudgetForYear() {
    const ctx = document.getElementById('budgetCanvas').getContext('2d');  
    const transactions = [];
    const week = Store.getTransactionsSummaryForWeek(moment());
    const performance = {
      lastMonth: [],
      thisMonth: [],
      allMonths: {}
    };
  
    for(let i = 0; i <= moment().get('month'); i++) {
      transactions.push(Store.getTransactionsSummaryForMonth(moment().set('month', i)));
    }
    
    const total = transactions.reduce((runningSum, transaction) => {
      return runningSum + transaction.debit - transaction.credit; 
    }, 0);
  
    const sum = total/moment().get('month');
  
    for(let i = moment().startOf('year'); moment().subtract(1, 'month').endOf('month').isAfter(i); i.add(1, 'day')) {
      if(!performance.allMonths[i.date()]) {
        performance.allMonths[i.date()] = [];      
      }
      performance.allMonths[i.date()].push(
        Store.getTransactionsSummaryForDate(i.format('YYYY-MM-DD'))
      );
    }
    for(let i = 1; i <= moment().subtract(1, 'month').startOf('month').daysInMonth(); i++) {
      performance.lastMonth.push(
        Store.getTransactionsSummaryForDate(
          moment([moment().year(), moment().subtract(1, 'month').month(), i]).format('YYYY-MM-DD')
        )
      );
    }
  
    for(let i = 1; i <= moment().startOf('month').daysInMonth(); i++) {
      performance.thisMonth.push(
        Store.getTransactionsSummaryForDate(
          moment([moment().year(), moment().month(), i]).format('YYYY-MM-DD')
        )
      );
    }
    
    $('#budgetForMonth').html(`$${helpers.round(sum, 2)}`);
    $('#thisWeekOverview').html(`$${helpers.round(week.debit, 2)}`);
    const budgetChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Net Expenses',
          data: transactions.map(t => t.debit - t.credit),
          borderColor: 'rgba(255,99,132,1)',
        }]
      },
      options: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Net expenses per month'
        }
      }
    });
  
    new Chart(document.getElementById("yearSpendCanvas"), {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Expense',
            backgroundColor: 'rgba(255,99,132,1)',
            data: transactions.map(t => t.debit)
          },
          {
            label: 'Income',
            backgroundColor: 'rgba(75, 192, 192, 1)',
            data: transactions.map(t => t.credit)
          }
        ],
      },
      options: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Net Expense/Income'
        }
      }
    });
    const performanceLabels = [];
    const performanceThisMonth = [];
    const performanceLastMonth = [];
    const performanceYearAverage = [];
    performanceThisMonth.push(performance.thisMonth[0].debit - performance.thisMonth[0].credit);
    performanceLastMonth.push(performance.lastMonth[0].debit - performance.lastMonth[0].credit);
    
    for(let i = 1; i <= 31; i++) {
      performanceLabels.push(i.toString())
    }
    for(let i = 1; i < performance.thisMonth.length; i++) {
      performanceThisMonth.push(
        performance.thisMonth[i].debit - performance.thisMonth[i].credit + performanceThisMonth[i - 1]
      );
    }
    for(let i = 1; i < performance.lastMonth.length; i++) {
      performanceLastMonth.push(
        performance.lastMonth[i].debit - performance.lastMonth[i].credit + performanceLastMonth[i - 1]
      );
    }
  
    Object.keys(performance.allMonths).forEach(i => {
      performanceYearAverage.push(
        performance.allMonths[i].reduce((running, day) => {
          return running + day.debit - day.credit;
        }, 0)
      );
    });
    new Chart(document.getElementById("monthComparisonChart"), {
      type: 'line',
      data: {
        labels: performanceLabels,
        datasets: [{
          label: moment().format('MMMM'),
          data: performanceThisMonth,
          borderColor: 'rgba(255,99,132,1)',
        },
        {
          label: moment().subtract(1, 'month').format('MMMM'),
          data: performanceLastMonth,
          borderColor: 'rgba(75, 192, 192, 1)',
        }]
      },
      options: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Spending Differential'
        }
      }
    });
    new Chart(document.getElementById("averageMonthlySpendCanvas"), {
      type: 'line',
      data: {
        labels: performanceLabels,
        datasets: [{
          label: moment().format('MMMM'),
          data: performanceThisMonth,
          borderColor: 'rgba(255,99,132,1)',
        },
        {
          label: 'Average',
          data: performanceYearAverage,
          borderColor: 'rgba(75, 192, 192, 1)',
        }]
      },
      options: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Average Monthly Spend'
        }
      }
    });
  }
  
  drawTransactionBreakdown(dateRange) {
    const ctx = document.getElementById('chartCanvas').getContext('2d');
    const transactionDataset = [];
    const transactionDataLabels = [];
    const groupedTransactions = helpers.groupBy(Store.allTransactions, 'mainCategory');
    let data;
    let options = {
      onClick: (e, data) => {
        if(!data || data.length === 0) {
          return; // a misclick.
        }
        const key = data[0]._model.label === 'Uncategorized' ? 'undefined' : data[0]._model.label;
        
        $('#chartTransactions').html(
          markup.drawTransactionsByCategory(
            groupedTransactions[key].filter(transaction => {
              return helpers.isInDateRange(transaction.date, dateRange)  
            }),
            'Chart'
          )
        );
  
        this.initializeDataTable('transactionsCategoryTableChart', 'categories');
      }
    };
    
    Object.keys(groupedTransactions)
          .forEach(key => {
            let total = 0;
            if(key === 'undefined') {
              transactionDataLabels.push('Uncategorized');  
            }
            else {
              transactionDataLabels.push(key);
            }
            groupedTransactions[key].forEach(transaction => {
              if(helpers.isInDateRange(transaction.date, dateRange)) {
                total += transaction.amount;
              }
            });
  
            transactionDataset.push(Math.abs(total));
          });
  
    while(colors.length < transactionDataLabels.length) {
      colors = [...colors, ...colors];
    }
    while(colors.length !== transactionDataLabels.length) {
      colors.pop();
    }
  
    data = {
      datasets: [{
        data: transactionDataset,
        backgroundColor: colors,
      }],
      labels: transactionDataLabels
    };
    
    if(transactionDataset.length === 0) {
  
    }
    else if(!this.transactionBreakdown) {
      this.transactionBreakdown = new Chart(ctx, {
        type: 'doughnut',
        data,
        options,
      });
    }
    else {
      setTimeout(() => {
        this.transactionBreakdown.options = options;
        this.transactionBreakdown.data = data;
        this.transactionBreakdown.data.labels = transactionDataLabels;
        this.transactionBreakdown.update();
      }, 0);
    }
  }
  
  initializeDataTable(id, type) {
    if($.fn.dataTable.isDataTable(`#${id}`)) {
      return;
    }
    $(`#${id}`).DataTable({
      'footerCallback': function (row, data, start, end, display) {
          var api = this.api(), data;
          const columnIndex = type === 'transactions' ? 2 : 1;
          // Total credit over this page
          let pageTotalCredits = api
            .column(columnIndex, { page: 'current'} )
            .data()
            .reduce((a, b) => {
                if($(b).attr('class') !== 'text-success') {
                  return a;
                }
                let value = $(b).text().substr(1);
                return a + helpers.intVal(value);
            }, 0);
          
          let pageTotalDebits = api
            .column(columnIndex, { page: 'current'} )
            .data()
            .reduce((a, b) => {
                if($(b).attr('class') !== 'text-danger') {
                  return a;
                }
                let value = $(b).text().substr(1);
                return a + helpers.intVal(value);
            }, 0);
  
          // Update footer
          $(api.column(2).footer()).html(
              `Credit: $${helpers.round(pageTotalCredits, 2)} Debit: ($${helpers.round(pageTotalDebits, 2)})`
          );
      }
    });
  
    $('.dataTables_filter').addClass('float-right');
    $('.dataTables_paginate').addClass('float-right');
  }
}

const instance = new Visualizations();
module.exports = instance;