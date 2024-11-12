function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    const swapSheet = sheet.getSheetByName('Swaps');
    const liquiditySheet = sheet.getSheetByName('LiquidityPool');
    
    const data = JSON.parse(e.postData.contents);
    
    if (data.type === 'verify') {
      // Handle verification
      const verifyRow = [
        data.timestamp,
        data.transactionId,
        data.walletAddress,
        data.tokenFrom,
        data.tokenTo,
        data.amount
      ];
      swapSheet.appendRow(verifyRow);
    } else {
      // Handle swap
      const swapRow = [
        data.timestamp,
        data.tokenFrom,
        data.tokenTo,
        data.amount,
        data.receivingAmount,
        data.walletAddress
      ];
      swapSheet.appendRow(swapRow);
      
      // Update liquidity pool
      updateLiquidityPool(liquiditySheet, data.tokenFrom, data.amount, true);
      updateLiquidityPool(liquiditySheet, data.tokenTo, data.receivingAmount, false);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function updateLiquidityPool(sheet, token, amount, isAdd) {
  const data = sheet.getDataRange().getValues();
  let found = false;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === token) {
      const currentAmount = parseFloat(data[i][1]);
      const newAmount = isAdd ? currentAmount + parseFloat(amount) : currentAmount - parseFloat(amount);
      sheet.getRange(i + 1, 2).setValue(newAmount);
      found = true;
      break;
    }
  }
  
  if (!found && isAdd) {
    sheet.appendRow([token, amount]);
  }
}

function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LiquidityPool');
  const data = sheet.getDataRange().getValues();
  const liquidityPool = {};
  
  for (let i = 1; i < data.length; i++) {
    liquidityPool[data[i][0]] = parseFloat(data[i][1]);
  }
  
  return ContentService.createTextOutput(JSON.stringify(liquidityPool))
    .setMimeType(ContentService.MimeType.JSON);
}