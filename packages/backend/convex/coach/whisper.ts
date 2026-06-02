import { ConvexError } from "convex/values";

const WHISPER_ENDPOINT = "https://api.openai.com/v1/audio/transcriptions";

/**
 * Transcribe an audio blob with OpenAI Whisper and return the raw text. Shared
 * by the coach chat voice flow (which deletes the audio afterwards) and the
 * post-session feedback flow (which RETAINS the audio for later qualitative
 * analysis). This helper only does the API call — retention/deletion is the
 * caller's decision.
 */
export async function callWhisper(
  apiKey: string,
  blob: Blob,
  locale: "en" | "fr",
): Promise<string> {
  const form = new FormData();
  form.append("file", blob, "audio.m4a");
  form.append("model", "whisper-1");
  form.append("language", locale);
  form.append("response_format", "json");

  const res = await fetch(WHISPER_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[coach.whisper] Whisper failed", res.status, errText);
    throw new ConvexError({
      code: "TRANSCRIPTION_FAILED",
      message: `Whisper API error (${res.status})`,
    });
  }

  const data = (await res.json()) as { text: string };
  return data.text;
}
