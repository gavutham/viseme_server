const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const sdk = require("microsoft-cognitiveservices-speech-sdk");

const app = express();
dotenv.config();
const port = process.env.PORT;
app.use(express.json());
app.use(cors());

const speechConfig = sdk.SpeechConfig.fromSubscription(
  process.env.SPEECH_KEY,
  process.env.SPEECH_REGION
);

app.post("/tts", async (req, res) => {
  const inputText = req.body.text;
  const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);
  const ssml = `<speak version='1.0' xml:lang='en-US' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts'> \r\n \
  <voice name='ta-IN-PallaviNeural'> \r\n \
      <prosody rate='-100%' > \r\n \
          <mstts:viseme type='redlips_front'/> \r\n \
          ${inputText} \r\n \
      </prosody> \r\n \
  </voice> \r\n \
</speak>`;

  speechSynthesizer.speakSsmlAsync(
    ssml,
    (result) => {
      const { audioData } = result;
      speechSynthesizer.close();

      const wavBuffer = Buffer.from(audioData);
      console.log(wavBuffer.length);
      res.setHeader("Content-Type", "audio/wav");
      res.setHeader("Content-Disposition", 'attachment; filename="output.wav"');
      res.setHeader("Content-Length", wavBuffer.length);
      res.send(wavBuffer);
    },
    (error) => {
      console.log(error);
      speechSynthesizer.close();
      res.status(500).send("Error synthesizing speech");
    }
  );
});

app.post("/viseme", async (req, res) => {
  const inputText = req.body.text;
  console.log(inputText);
  let outputArray = [];

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

  synthesizer.visemeReceived = function (s, e) {
    outputArray.push(e);
  };

  synthesizer.speakTextAsync(
    inputText,
    () => {
      synthesizer.close();
      res.send(outputArray);
    },
    (error) => {
      console.log(error);
      speechSynthesizer.close();
      res.status(500).send("Error synthesizing speech");
    }
  );
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});