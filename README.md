# Zinab (ዝናብ)

> **Zinab** (Amharic: _rain_) is a voice AI web app that collects real satellite, weather forecast, and soil data for any location in Ethiopia and explains it to farmers in spoken and written **Amharic**, **Afaan Oromo**, and **English**.

**Status:** 🚧 MVP in progress.

---

## What it does

- **Pick a location** — click the map, use your phone's GPS, or search any village, town, or woreda in Ethiopia.
- **See real conditions** — rain, forecast, soil moisture, temperature, and soil pH, pulled from Open-Meteo and ISRIC SoilGrids.
- **Ask Zinab** — speak your question in Amharic or English. Zinab answers using only the computed facts and speaks the answer back.
- **Grounded AI** — every number in the AI's reply is checked against the real data before it's shown. No hallucinated rain or temperature.

---

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **Leaflet** + OpenStreetMap
- **Groq** (LLM reasoning) + **Google Gemini** (speech-to-text, translation, text-to-speech)
- **Open-Meteo** and **ISRIC SoilGrids** for free, keyless data

---

## Run it locally

```bash
# 1. Install
npm install

# 2. Add your API keys
# Create .env.local and add:
#   GROQ_API_KEY=...
#   GEMINI_API_KEY_1=...
#   GEMINI_API_KEY_2=...   (optional fallback)

# 3. Start
npm run dev
```
