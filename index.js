const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const axios = require("axios");
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

app.get("/tts", async (req, res) => {
  const inputText = req.query.text;
  const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);
  const ssml = `<speak version='1.0' xml:lang='en-US' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts'> \r\n \
  <voice name='ta-IN-PallaviNeural'> \r\n \
      <prosody rate='-100%' > \r\n \
          <mstts:viseme type='redlips_front'/> \r\n \
          ${inputText}, \r\n \
      </prosody> \r\n \
  </voice> \r\n \
</speak>`;

  speechSynthesizer.speakSsmlAsync(
    ssml,
    (result) => {
      const { audioData } = result;
      speechSynthesizer.close();

      res.setHeader("Content-Disposition", 'attachment; filename="output.wav"');
      const base64Audio = Buffer.from(audioData).toString("base64");
      const base64String = `data:audio/wav;base64,${base64Audio}`;

      res.setHeader("Content-Type", "text/plain");
      res.send(base64String);
    },
    (error) => {
      console.log(error);
      speechSynthesizer.close();
      res.status(500).send("Error synthesizing speech");
    }
  );
});

app.get("/viseme", async (req, res) => {
  const inputText = req.query.text;

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

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const response = await axios.post(
      "https://asr.iitm.ac.in/api/accounts/login/",
      {
        email,
        password,
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      message: error.message,
      ...(error.response?.data && { error: error.response.data }),
    });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
