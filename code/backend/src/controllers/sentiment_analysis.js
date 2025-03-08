import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import dotenv from "dotenv"
dotenv.config();

export const textToSpeech = async (req, res) => {
    try {
        const { text, language } = req.body;
        if (!text) {
        return res.status(400).json({ message: "No text provided" });
        }

        // Set up the SpeechConfig using your subscription key and region
        const subscriptionKey = process.env.AZURE_SPEECH_KEY;
        const serviceRegion = process.env.AZURE_SPEECH_REGION;
        const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);

        // Map the language to a voice name; you can extend this mapping as needed
        const voiceMap = {
        "en-US": "en-US-JennyNeural",
        "en-GB": "en-GB-LibbyNeural",
        "es-ES": "es-ES-ElviraNeural",
        };
        speechConfig.speechSynthesisVoiceName = voiceMap[language] || voiceMap["en-US"];

        // Create a synthesizer (no audio config is needed for output to memory)
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

        // Wrap speakTextAsync in a promise to use async/await
        const audioData = await new Promise((resolve, reject) => {
        synthesizer.speakTextAsync(
            text,
            (result) => {
            synthesizer.close();
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                resolve(result.audioData);
            } else {
                reject(new Error("Speech synthesis failed: " + result.errorDetails));
            }
            },
            (err) => {
            synthesizer.close();
            reject(err);
            }
        );
        });

        // Convert the audio data (Uint8Array) to a Buffer and then to a Base64 string
        const audioBase64 = Buffer.from(audioData).toString("base64");
        res.status(200).json({ message: "Text synthesized successfully", audio: audioBase64 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const speechToText = async (req, res) => {
    try {
        const { audio, language } = req.body;
        if (!audio) {
        return res.status(400).json({ message: "No audio provided" });
        }

        // Set up the SpeechConfig with your subscription key, region, and recognition language
        const subscriptionKey = process.env.AZURE_SPEECH_KEY;
        const serviceRegion = process.env.AZURE_SPEECH_REGION;
        const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
        speechConfig.speechRecognitionLanguage = language || "en-US";

        // Convert the Base64 audio string to a Buffer
        const audioBuffer = Buffer.from(audio, "base64");

        // Create a push stream and write the audio buffer into it
        const pushStream = sdk.AudioInputStream.createPushStream();
        pushStream.write(audioBuffer);
        pushStream.close();

        // Create an AudioConfig object from the stream
        const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

        // Create a SpeechRecognizer using the speech config and audio config
        const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

        // Wrap the recognizeOnceAsync call in a promise to use async/await
        const result = await new Promise((resolve, reject) => {
        recognizer.recognizeOnceAsync(
            (result) => {
            recognizer.close();
            if (result.reason === sdk.ResultReason.RecognizedSpeech) {
                resolve(result);
            } else {
                reject(new Error("Speech recognition failed: " + result.errorDetails));
            }
            },
            (err) => {
            recognizer.close();
            reject(err);
            }
        );
        });

        res.status(200).json({ message: "Speech recognized successfully", text: result.text });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};