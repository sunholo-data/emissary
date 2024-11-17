// app/api/tts-stream/route.ts
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { NextResponse } from 'next/server';

const ttsClient = new TextToSpeechClient({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

const encoder = new TextEncoder();

export async function POST(request: Request) {
  const { text, voiceConfig } = await request.json();

  try {
    // Create bi-directional stream
    const stream = ttsClient.streamingSynthesize();
    const voiceMetadata = {
        audioConfig: {
          audioEncoding: 'LINEAR16',
          pitch: 0,
          speakingRate: 1.0
        },
        voice: voiceConfig || {
          languageCode: 'en-GB',
          name: 'en-GB-Journey-D', 
          ssmlGender: 'MALE'
        }
      };

    console.log(voiceMetadata);

    // First, write the config
    stream.write({
      streamingConfig: voiceMetadata
    });

    // Then, write the input separately
    console.log(text);
    stream.write({
      input: { text }
    });

    stream.end();
    console.log('Finished voice stream for + ', text);

    let isControllerClosed = false;

    const customReadable = new ReadableStream({
      start(controller) {
        stream.on('data', (response) => {
          try {
            if (!isControllerClosed) {
              controller.enqueue(encoder.encode(`data: ${Buffer.from(response.audioContent).toString('base64')}\n\n`));
            }
          } catch (error) {
            console.error('Error enqueueing data:', error);
          }
        });

        stream.on('end', () => {
          try {
            if (!isControllerClosed) {
              isControllerClosed = true;
              controller.close();
            }
          } catch (error) {
            console.error('Error closing controller:', error);
          }
        });

        stream.on('error', (error) => {
          try {
            if (!isControllerClosed) {
              isControllerClosed = true;
              controller.error(error);
              console.error('Stream error:', error);
            }
          } catch (err) {
            console.error('Error handling stream error:', err);
          }
        });
      },
      cancel() {
        try {
          stream.cancel();
        } catch (error) {
          console.error('Error canceling stream:', error);
        }
      }
    });

    return new NextResponse(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('TTS Stream Error:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'TTS Stream failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}