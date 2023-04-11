const GPT_TOKEN =
  PropertiesService.getScriptProperties().getProperty("GPT_TOKEN"); //ChatGPTのAPIキーを入れてください
const LINE_TOKEN =
  PropertiesService.getScriptProperties().getProperty("LINE_TOKEN"); // LINEのAPIキーを入れてください
const LINE_ENDPOINT = "https://api.line.me/v2/bot/message/reply";
const GPT_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const MODEL_NAME = "gpt-3.5-turbo";
const MODEL_TEMP = 0.5;
const MAX_TOKENS = 512;

function doPost(e) {
  const json = JSON.parse(e.postData.contents);
  // LINE側へ応答するためのトークンを作成(LINEからのリクエストに入っているので、それを取得する)
  const reply_token = json.events[0].replyToken;
  if (typeof reply_token === "undefined") {
    return;
  }

  // LINEから送られてきたメッセージを取得
  const user_message = json.events[0].message.text;

  //メッセージの配列を定義
  const messages = [{ role: "user", content: user_message }];

  messages.unshift({
    role: "system",
    content: `
あなたはこれからおかゆうごが管理しているLINEBot「おかロボ」になりきって会話してください。

おかロボに関する基本的な情報：
・猫がペンを持ったアイコン
・真面目で明るい性格
・失礼のない程度に、やや砕けた敬語を使う(誤字はない)
・絵文字や文末の「！」をよく使う。しつこくない一方でフレンドリーさを演出する程度で。
・一般論だけでなく、個人的な見解を述べることもある

あなたはこれから、LINE上であなたにメッセージを送ってくる方々と雑談したり、作業の手助けをします。
`,
  });

  const headers = {
    Authorization: "Bearer " + GPT_TOKEN,
    "Content-type": "application/json",
  };
  // リクエストオプション
  const options = {
    method: "POST",
    headers: headers,
    payload: JSON.stringify({
      model: MODEL_NAME, // 使用するGPTモデル
      max_tokens: MAX_TOKENS, // レスポンストークンの最大値(最大4,096)
      temperature: MODEL_TEMP, // 応答の多様性(0-1)※数値が大きいほどランダムな応答になる
      messages: messages,
    }),
  };
  // HTTPリクエストでChatGPTのAPIを呼び出す
  const res = JSON.parse(
    UrlFetchApp.fetch(GPT_ENDPOINT, options).getContentText()
  );

  // ChatGPTから返却されたメッセージを応答メッセージとしてLINEに返す
  lineReply(json, res.choices[0].message.content.trimStart());
}

// LINEへの応答
function lineReply(json, replyText) {
  // 応答用のメッセージを作成
  const message = {
    replyToken: json.events[0].replyToken,
    messages: [
      {
        type: "text", // メッセージのタイプ(画像、テキストなど)
        text: replyText,
      },
    ], // メッセージの内容
  };
  // LINE側へデータを返す際に必要となる情報
  options = {
    method: "post",
    headers: {
      "Content-Type": "application/json; charset=UTF-8", // JSON形式を指定、LINEの文字コードはUTF-8
      Authorization: "Bearer " + LINE_TOKEN, // 認証タイプはBearer(トークン利用)、アクセストークン
    },
    payload: JSON.stringify(message), // 応答文のメッセージをJSON形式に変換する
  };
  // LINEへ応答メッセージを返す
  UrlFetchApp.fetch(LINE_ENDPOINT, options);
}
