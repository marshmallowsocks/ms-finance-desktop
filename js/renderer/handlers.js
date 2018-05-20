const Store = require('../store');
const api = require('../api');
const constants = require('../constants');
const dom = require('./dom');

$('#link-btn').on('click', e => {
  dom.showLoader();
  handler.open();
});

$('#databaseExport').on('click', e => {
  api.exportDatabase().then(res => {
    if(!res.error) {
      $('#modalMessage').html('Successfully exported database to <code>exportedDB.json</code>');
      $('#messageModal').modal('show');
    }
  });
});

$('#databaseImport').on('click', e => {
  $('#importDatabase').click();
})

$('#importDatabase').on('change', e => {
  if(e.target.files.length === 0) {
    $('#modalMessage').html('No file selected.');
    $('#messageModal').modal('show');
  }
  else {
    const reader = new FileReader();
    reader.readAsText(e.target.files[0]);
    reader.onload = event => {
      const jsonString = event.target.result;
      api.importDatabase(jsonString).then(res => {
        if(!res.error) {
          $('#modalMessage').html('Successfully imported database!<br>Page will reload in 5 seconds.');
          $('#messageModal').modal('show');
          setTimeout(() => {
            dom.triggerRefresh({type: 'all'});
          }, 5000);
        }
        else {
          $('#modalMessage').html('Could not import database.')
          $('#messageModal').modal('show');
        }
      });
    }
    reader.onerror = event => {
      $('#modalMessage').html('Could not read file.');
      $('#messageModal').modal('show');
    }
  }
});

$('#createGroupButton').on('click', e => {
  $('#createGroupModal').modal({ show: false });
  let tableMarkup = '';
  Store.allAccounts.forEach(account => {
    tableMarkup += `<tr>
                <td>${account.name}</td>
                <td>${account.institutionName}</td>
                <td>
                <div class="form-check">
                  <input class="form-check-input" name="createGroupCheckbox" type="checkbox" value="${account.account_id}" id="${account.account_id}">
                </div>
                </td>
               </tr>`
  });
  $('#createGroupTableBody').html(tableMarkup);
  $('#createGroupModal').modal('show');
});

$('#createGroupSubmit').on('click', e => {
  const accounts = $('input:checkbox:checked').map(function() {
    return this.value;
  }).get();
  const name = $('#createGroupField').val();
  if(name === '' || name === null || name === undefined) {
    name = 'Default group';
  }
  api.createGroup(name, accounts).then(res => {
    dom.triggerRefresh({type: 'groups'});
  });
});

$('#cryptoSubmit').on('click', e => {
  const symbol = $('#addCryptoField').val();
  const holdings = $('#addHoldingField').val();
  if(isNaN(parseInt(holdings, 10))) {
    holdings = 0;
  }
  const crypto = Store.getCryptoInformation(symbol);
  api.saveCryptoHolding({
    crypto_id: crypto.id,
    name: crypto.name,
    symbol,
    holdings,
  }).then(res => {
    if(!res.exists) {
      Store.addAccount(dom.createAccountObject(crypto, holdings));
    }
    dom.triggerRefresh({ type: 'crypto' });
  });
});

$('ul.nav.flex-column li > a').each(function() {
  $(this).on('click', () => {
    let current = $(this).attr('data-goto');

    $('ul.nav.flex-column li > a').removeClass('active');
    $(this).addClass('active');

    $('#app > div').addClass('d-none');
    $(`#${current}`).removeClass('d-none');

    $('#title').html(constants.pages[current]);

    switch(current) {
      case 'overview':
        dom.drawContextBalance(Store.netBalance);
        break;
      case 'accounts':
        dom.drawContextBalance(Store.cashBalance);
        break;
      case 'credit':
        dom.drawContextBalance(-Store.creditDebt);
        break;
      case 'investments':
        dom.drawContextBalance(Store.investmentBalance);
        break;
      case 'crypto':
        dom.drawContextBalance(Store.cryptoBalance);
        break;
      default:
        dom.drawContextBalance('-');
        break;
    }
  });
});