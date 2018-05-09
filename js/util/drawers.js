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
        officialName: account.official_name
      });
    });
    return markup;
  }

  this.drawGroups = Store => {
    let markup = '';
    let groupTotal = 0;
    let groupTotalMarkup;

    Store.groups.forEach(group => {
      markup += `
        <div class="card">
        <div class="card-header">
          ${group.name}
        </div>
        <ul class="list-group list-group-flush">`;
      
      group.accounts.forEach(account => {
        let balance = Store.cleanBalance(account.balances);
        let contextClass;

        if(account.type !== 'credit') {
          groupTotal += balance;
          contextClass = 'badge-success';
        }
        else {
          groupTotal -= balance;
          balance = `(${balance})`;
          contextClass = 'badge-danger';
        }
        
        markup += `<li class="list-group-item"><h4>${account.name} <span class="badge ${contextClass} float-right">$${balance}</span></h4></li>`
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
    let markup = '<table class="table table-striped">';

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
        markup += `<tr>
          <td>${transactionObject.accounts.filter(a => a.account_id === transaction.account_id)[0].name}</td>
          <td>${transaction.name}</td>
          <td>$${transaction.amount}</td>
          <td>${transaction.date}</td>
          <td>${!transaction.pending ? '<span data-feather="check-square"></span>' : '<span data-feather="square"></span>'}</td>
        </tr>`;
      });
    });

    markup += '</tbody></table>';
    return markup;
  }

  const drawCard = ({title, subTitle, balance, positive, officialName, credit}) => {
    const signType = positive ? 'badge-success' : 'badge-danger';
    let additionalInfo = '';
    balance = helpers.round(balance, 2);
    balance = positive ? '$' + balance : '$(' + balance + ')';
    
    if(credit) {
      additionalInfo += `Credit limit: ${credit.limit !== 0 ? '$' + Math.ceil(credit.limit) : 'The institution did not provide this information.'}<br>`;
      additionalInfo += `Credit available: ${credit.available ? '$' + credit.available : 'The institution did not provide this information.'}<br>`;
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
