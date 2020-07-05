const ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty("ACCESS_TOKEN");
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
const sheet = spreadsheet.getSheetByName("体重管理");
const SPREADSHEET_URL = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_URL");

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
      text = "下記URLから修正してください\n" + SPREADSHEET_URL;
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


function checkDatasOfToday(){
  let DatasOfToday = sheet.getRange(lastRow, 2, 1, lastColumn-2).getValues();
  DatasOfToday = DatasOfToday[0];
  let userIds = [];
    
  for (let [index, data] of DatasOfToday.entries()){
    if (data == ""){
      userIds.push(sheet.getRange(3, index+2).getValues()[0][0]);
    };
  };
  return userIds
};



function mentionEmptyPlayers(){
  const url = "https://api.line.me/v2/bot/message/multicast";
  let userIds = checkDatasOfToday();
  
  //送信するbody
  let payload = {
    "to": userIds,
    "messages":[
        {
            "type":"text",
            "text":"昨日の体重が記入漏れでした\n(入れてたら上井にLINEして)\n今日は体重を入力しましょう"
        }
    ]
  };
  payload = JSON.stringify(payload);
  
  UrlFetchApp.fetch(url, {
        'headers': {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer ' + ACCESS_TOKEN,
        },
        'method': 'post',
        'payload': payload
      });
};
