const helpers = require('./helpers');

function drawers() {
  this.drawOverview = (Store) => { // eslint-disable-line arrow-body-style
    return `${this.drawAccountCards(Store)}<hr>${this.drawCreditCards(Store)}<hr>${this.drawInvestmentCards(Store)}<hr>${this.drawCryptoCards(Store)}`;
  },
  this.drawAccountCards = (Store) => {
    let markup = '';
    const accountData = Store.accounts.depository || [];

    if(!accountData.length) {
      markup = '<div class="alert alert-info"><span data-feather="info"></span> Link an account to get started.</div>';
    }

    accountData.forEach(account => {
      markup += drawCard({
        title: account.name,
        subTitle: account.mask,
        balance: Store.cleanBalance(account.balances),
        positive: true,
        officialName: account.official_name
      });
    });
    return markup;
  }
  
  this.drawCreditCards = (Store) => {
    let markup = '';
    const accountData = Store.accounts.credit || [];

    if (!accountData.length) {
      markup = '<div class="alert alert-info"><span data-feather="info"></span> Link a credit card to get started.</div>';
    }

    accountData.forEach((account) => {
      markup += drawCard({
        title: account.name,
        subTitle: account.mask,
        balance: Store.cleanBalance(account.balances),
        credit: account.balances,
        positive: false,
        officialName: account.official_name
      });
    });
    return markup;
  }
  
  this.drawInvestmentCards = (Store) => {
    let markup = '';
    const accountData = Store.accounts.brokerage || [];
    
    if(!accountData.length) {
      markup = '<div class="alert alert-info"><span data-feather="info"></span> Link an investment account to get started.</div>';
    }

    accountData.forEach(account => {
      markup += drawCard({
        title: account.name,
        subTitle: account.mask,
        balance: Store.cleanBalance(account.balances),
        positive: true,
        officialName: account.official_name
      });
    });
    return markup;
  }

  this.drawBankCards = (Store) => {
    let markup = '';
    const accountData = helpers.groupBy(Store.allAccounts, 'institutionName');
    
    Object.keys(accountData).forEach(bank => {
      markup += `<h3>${bank}</h3>`;
      accountData[bank].forEach(account => {
        markup += drawCard({
          title: account.name,
          subTitle: account.mask,
          balance: Store.cleanBalance(account.balances),
          positive: !(account.type === 'credit'),
          officialName: account.official_name
        });
      });
      markup += '<hr>';
    }); 
    return markup;
  }
  
  this.drawNoneCard = () => {
    return '<div class="alert alert-info"><span data-feather="info"></span> Link an account to get started!</div>'
  }

  this.drawNetBalance = (balance) => {
    let markup = {
      classStyle: '',
      balance: 0
    };

    if(balance === '-') {
      markup.classStyle = 'text-success font-weight-bold';
      markup.balance = '$-';
    }
    else if(balance < 0) {
      markup.classStyle = 'text-danger font-weight-bold';
      balance = helpers.round(balance, 2);
      markup.balance = '$(' + (-1 * balance) + ')'; 
    }
    else {
      markup.classStyle = 'text-success font-weight-bold';
      balance = helpers.round(balance, 2);
      markup.balance = '$' + balance;
    }

    return markup;
  } 

  this.drawCryptoCards = (Store) => {
    let markup = '';
    const accountData = Store.accounts.crypto || [];
    
    if(!accountData.length) {
      markup = '<div class="alert alert-info"><span data-feather="info"></span> Add a crypto holding to get started.</div>';
    }

    accountData.forEach(account => {
      markup += drawCard({
        title: account.name,
        subTitle: account.mask,
        balance: Store.cleanBalance(account.balances),
        positive: true,
        officialName: account.official_name,
        type: 'crypto'
      });
    });
    return markup;
  }

  this.drawGroups = Store => {
    let markup = '';
    let groupTotal = 0;
    let groupTotalMarkup;
    if(Store.groups.length === 0) {
      return '<div class="alert alert-info">Create a group to get started!</div>';
    }
    Store.groups.forEach(group => {
      markup += `
        <div class="card">
        <div class="card-header">
          <h4>${group.name} <button class="btn btn-danger float-right" id="group${group.id}">Delete group</button></h4>
        </div>
        <ul class="list-group list-group-flush">`;
      
      group.accounts.forEach(account => {
        let balance = Store.cleanBalance(account.balances);
        let contextClass;

        if(balance === -Infinity) {
          contextClass = 'badge-danger';
          balance = '<span class="alert-octagon"></span>';
        }
        else if(account.type !== 'credit') {
          groupTotal += balance;
          balance = `$${balance}`;
          contextClass = 'badge-success';
        }
        else {
          groupTotal -= balance;
          balance = `$(${balance})`;
          contextClass = 'badge-danger';
        }
        
        markup += `<li class="list-group-item"><h5>${account.name} <span class="badge ${contextClass} float-right">${balance}</span></h5></li>`
      });

      groupTotalMarkup = this.drawNetBalance(groupTotal);

      markup += `</ul>
        <div class="card-footer">
          Group total: <span class="${groupTotalMarkup.classStyle} float-right">${groupTotalMarkup.balance}</span>
        </div></div>`;
    });

    return markup;
  };

  this.drawTransactions = Store => {
    const transactionData = [];
    console.log(helpers.groupBy(Store.allTransactions, 'mainCategory'));
    let markup = '<table class="table table-striped" style="width:100%" id="transactionsTable">';

    if(Store.transactions.length === 0) {
      return '<div class="alert alert-info"><span data-feather="info"></span> Link an account to get started!</div>'
    }

    markup += `
      <thead>
        <tr>
          <td>Account</td>
          <td>Name</td>
          <td>Amount</td>
          <td>Date</td>
          <td>Posted</td>
        </tr>
      </thead>
      <tbody>
    `;
    Store.transactions.forEach(transactionObject => {
      transactionObject.transactions.forEach(transaction => {
        let contextClass;
        let transactionAmount = 0;
        if(transaction.amount < 0) {
          contextClass = 'text-success';
          transactionAmount = -transaction.amount;
        }
        else {
          contextClass = 'text-danger';
          transactionAmount = transaction.amount;
        }
        markup += `<tr>
          <td>${transactionObject.accounts.filter(a => a.account_id === transaction.account_id)[0].name}</td>
          <td>${transaction.name}</td>
          <td><span class="${contextClass}">$${transactionAmount}</span></td>
          <td>${transaction.date}</td>
          <td>${!transaction.pending ? '<i class="fa fa-check-square"></i>' : '<i class="fa fa-square"></i>'}</td>
        </tr>`;
      });
    });

    markup += '</tbody></table>';
    return markup;
  }

  this.drawTransactionForDate = transactionData => {
    let markup = '';
    
    markup += `<span class="text-danger">${helpers.round(transactionData.debit, 2)}</span><br>`;
    markup += `<span class="text-success">${helpers.round(transactionData.credit, 2)}</span>`;
    return markup;
  }

  const drawCard = ({title, subTitle, balance, positive, officialName, credit, type}) => {
    const signType = positive ? 'badge-success' : 'badge-danger';
    let additionalInfo = '';
    if(balance === -Infinity) {
      // could not fetch balance correctly.
      balance = '<span data-feather="alert-octagon"></span>';
    }
    else {
      balance = helpers.round(balance, 2);
      balance = positive ? '$' + balance : '$(' + balance + ')';
    }
    if(credit) {
      let creditUsed = 'Could not calculate usage.';
      if(Number.isFinite(credit.limit) && Number.isFinite(credit.available) && credit.limit !== 0) {
        let creditAvailable = (credit.available/Math.ceil(credit.limit)) * 100;
        creditUsed = ((Math.ceil(credit.limit) - credit.available)/Math.ceil(credit.limit)) * 100;

        additionalInfo += `<div class="progress" style="height:25px;">
          <div class="progress-bar progress-bar-striped bg-success" role="progressbar" style="width: ${creditAvailable}%">$${credit.available}</div>
          <div class="progress-bar progress-bar-striped bg-danger" role="progressbar" style="width: ${creditUsed}%">$${helpers.round(Math.ceil(credit.limit) - credit.available, 2)}</div>
        </div>`;
        additionalInfo += `<div class="progress" style="height:25px;">
          <div class="progress-bar bg-warning" role="progressbar" style="width: 100%">$${credit.limit}</div>
        </div>`;
      }
      else {
        additionalInfo += `Credit limit: ${Number.isFinite(credit.limit) ? '$' + Math.ceil(credit.limit) : 'The institution did not provide this information.'}<br>`;
        additionalInfo += `Credit available: ${Number.isFinite(credit.available) ? '$' + credit.available : 'The institution did not provide this information.'}<br>`;
        additionalInfo += `Credit used: ${creditUsed}`;
      }
    }
    
    return `
    <div class="card" style="margin-top:5px;margin-bottom:5px;">
    <div class="card-body">
      <h5 class="card-title">${title} <span class="badge ${signType} float-right">${balance}</span></h5>
      <h6 class="card-subtitle mb-2 text-muted">${subTitle}</h6>
      <p class="card-text">
        ${officialName ? officialName : ''}
        <br>
        ${additionalInfo}
      </p>
    </div>
    </div>`;
  }
}

module.exports = drawers;
