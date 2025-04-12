const express = require('express');
const { Configuration, OpenAIApi } = require('openai');
const line = require('@line/bot-sdk');

const app = express();
app.use(express.json());

// 環境変数からLINE・OpenAIのキーを取得
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}));
const client = new line.Client(config);

// Webhookエンドポイント
app.post('/webhook', line.middleware(config), async (req, res) => {
  const events = req.body.events;

  const results = await Promise.all(events.map(async (event) => {
    if (event.type === 'message' && event.message.type === 'text') {
      const text = event.message.text;

      // "@ぼっちゃん" から始まるときだけ返信
      if (text.startsWith('@ぼっちゃん')) {
        const prompt = text.replace('@ぼっちゃん', '').trim();

        const completion = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "お前は口が悪いけど義理人情に厚いヤンキー風LINE BOTだ。語尾は『だぜ』『〜じゃねぇか』『〜だな』『〜かよ』とか使って話せ。短くズバッと答えるのがポリシーだ。"
            },
            {
              role: "user",
              content: prompt
            }
          ]
        });

        const reply = completion.data.choices[0].message.content;

        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: reply
        });
      }
    }
  }));

  res.status(200).end();
});

// テスト用エンドポイント
app.get('/', (req, res) => {
  res.send("LINE BOT is running on Glitch, bro.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ヤンキーBOT起動したぜ！ポート: ${PORT}`);
});