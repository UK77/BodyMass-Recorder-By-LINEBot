const ACCESS_TOKEN = "L/WbcRjdNs2bRpWGvgVSFae7kcpTw4vrtxtP9rBxWYgMZi7XQ9cxj9+gQYFREIP5DAWjldJCMQjR/wAtQvGKNPDZg+jO5Bs49eY3eJdyM17RVV3xIjXQKBodkOuiSiiE/z7nxMUlYQnHXRahGfM/LAdB04t89/1O/w1cDnyilFU=";
const spreadsheet = SpreadsheetApp.openById("1QYgIgRqD3vzJGyAZqm-wosCbM40gShRsZ_RLE3kuZ5M");
const sheet = spreadsheet.getSheetByName("体重管理");
const ssUrl = "https://docs.google.com/spreadsheets/d/1QYgIgRqD3vzJGyAZqm-wosCbM40gShRsZ_RLE3kuZ5M/edit#gid=0";

let lastRow = sheet.getLastRow();
let lastColumn = sheet.getLastColumn();
    
function setDate(){
  let today = new Date();
  today = Utilities.formatDate(today, "JST", "yyyy/MM/dd");
  sheet.getRange(lastRow+1, 1).setValue(today);
}


function doPost(e){
  let data = JSON.parse(e.postData.contents).events[0];
  // WebHookで受信した応答用Token
  let replyToken = data.replyToken;
  // 応答メッセージ用のAPI URL
  const url = 'https://api.line.me/v2/bot/message/reply';
  
  let eventType = data.type;
  let userId = data.source.userId;
  let text = "";
  
  //初回登録時にuserIDを追加
  if(eventType == 'follow'){
    //ユーザーIDの入力
    let filledColumn = sheet.getLastColumn();
    let thisColumn = filledColumn + 1;
    sheet.getRange(3, thisColumn).setValue(userId);
    text = "体重を数値だけで入力してください（例：72.5）";
    setDisplayName(thisColumn, userId);
  }//通常体重入力時の処理
  else if(eventType == 'message'){ 
    let userMessage = data.message.text;
    
    if (userMessage == "今日の体重"){
      text = "数値を入力してください";
    }else if (userMessage == "過去のデータを修正・追加する"){
      text = "下記URLから修正してください\n" + ssUrl;
    }else if (parseInt(userMessage, 10) || parseFloat(userMessage)){
      for (let i = 1; i <= lastColumn; i++){
        let cell = sheet.getRange(3, i);
        if (cell.getValue() == userId){
          sheet.getRange(lastRow, i).setValue(userMessage);
          text = "記録が完了しました";
          break
        }else{
          continue
        };
      };
    }else {
      text = "数値のみで入力してください";
    };
  };
  
  const payload = JSON.stringify({
          'replyToken': replyToken,
          'messages': [{
            "type": "text", 
            "text": text,
            "quickReply": {
              "items": [
                {
                  "type": "action", 
                  "action": {
                    "type": "message",
                    "label": "今日の体重を入力",
                    "text": "今日の体重"
                  }
                },
                {
                  "type": "action",
                  "action": {
                    "type": "message",
                    "label": "過去のデータを修正・追加する",
                    "text": "過去のデータを修正・追加する"
                  }
                }
              ]
            }
          }],
        });
  
  UrlFetchApp.fetch(url, {
        'headers': {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer ' + ACCESS_TOKEN,
        },
        'method': 'post',
        'payload': payload, 
      });
  
  return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'})).setMimeType(ContentService.MimeType.JSON);
};


function setDisplayName(column, userId){
  let profileRequestUrl  = "https://api.line.me/v2/bot/profile/" + userId;
  let responce = UrlFetchApp.fetch(profileRequestUrl, {
        'headers': {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer ' + ACCESS_TOKEN,
        },
        'method': 'get'
      });
  responce = JSON.parse(responce);
  const displayName = responce.displayName;
  const displayNameCell = sheet.getRange(2, column).setValue(displayName);
  return 
};
