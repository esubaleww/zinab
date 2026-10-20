"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/Icon";
import { useConditions } from "@/lib/hooks/useConditions";
import { usePlaceName } from "@/lib/hooks/usePlaceName";
import { usePlaceSearch, SearchResult } from "@/lib/hooks/usePlaceSearch";
import { computeFacts, pickDayIcon, formatDayShort } from "@/lib/facts";
import { PRESETS, DEFAULT_PRESET } from "@/lib/presets";
import EthiopiaMap from "@/components/EthiopiaMapDynamic";
import { useAIExplanation } from "@/lib/hooks/useAIExplanation";
import { useSpeakText } from "@/lib/hooks/useSpeakText";
import VoiceAssistant from "@/components/VoiceAssistantDynamic";

export default function Home() {
  const [crop, setCrop] = useState("Teff");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(DEFAULT_PRESET);
  const [searchInput, setSearchInput] = useState(DEFAULT_PRESET.name);
  const [pickedCoords, setPickedCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "asking" | "granted" | "denied"
  >("idle");

  // Search & Listen states
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [userPickedFromSearch, setUserPickedFromSearch] = useState(false);
  const [selectedSearchName, setSelectedSearchName] = useState<string | null>(
    null,
  );

  const { results: searchResults, loading: searchLoading } =
    usePlaceSearch(searchInput);
  const [listenLang, setListenLang] = useState<"am-ET" | "om-ET" | "en-US">(
    "am-ET",
  );
  const { speak, isSpeaking } = useSpeakText();

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("denied");
      return;
    }
    setGeoStatus("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        setGeoStatus("granted");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  }, []);

  const activeLat =
    pickedCoords?.lat ?? userLocation?.lat ?? selectedPreset.lat;
  const activeLon =
    pickedCoords?.lon ?? userLocation?.lon ?? selectedPreset.lon;

  // Pass the skip flag to usePlaceName
  const placeName = usePlaceName(activeLat, activeLon, userPickedFromSearch);
  const { data: cond, loading, error } = useConditions(activeLat, activeLon);

  const facts = useMemo(() => (cond ? computeFacts(cond) : null), [cond]);

  const searchResultLabel = selectedSearchName
    ? selectedSearchName.split(",")[0].trim()
    : null;

  const placeLabel =
    userPickedFromSearch && searchResultLabel
      ? searchResultLabel
      : (placeName?.short ??
        (pickedCoords
          ? "Selected point"
          : userLocation
            ? "Your location"
            : selectedPreset.name));

  const {
    text: aiText,
    loading: aiLoading,
    error: aiError,
  } = useAIExplanation(facts, crop, placeLabel);

  const placeFull =
    userPickedFromSearch && selectedSearchName
      ? selectedSearchName
      : (placeName?.full ?? `${activeLat.toFixed(3)}, ${activeLon.toFixed(3)}`);

  useEffect(() => {
    if (userPickedFromSearch) return; // <-- don't override user's choice
    if (placeName?.short) {
      setSearchInput(placeName.short);
    }
  }, [placeName?.short, userPickedFromSearch]);

  const fiveDays = cond?.forecast.slice(0, 5) ?? [];
  const maxRain = cond
    ? Math.max(0.1, ...cond.forecast.map((d) => d.rainMm))
    : 1;
  const barHeights =
    cond?.forecast.map((d) => Math.round((d.rainMm / maxRain) * 85)) ?? [];
  const soilPct = facts?.todaySoilMoisturePct ?? 0;
  const soilAvailable = cond?.soil.ph != null || cond?.soil.clayPct != null;

  // Unified function to handle selecting a place from the search dropdown
  function handleSelectSearchResult(result: SearchResult) {
    const fullName = `${result.shortName}${result.zone ? `, ${result.zone}` : result.region ? `, ${result.region}` : ""}`;

    setPickedCoords({ lat: result.lat, lon: result.lon });
    setSearchInput(fullName);
    setSelectedSearchName(fullName);
    setUserPickedFromSearch(true);
    setShowSearchResults(false); // Close dropdown immediately
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleSelectSearchResult(searchResults[0]);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f5ed] text-[#18352a]">
      <header className="absolute inset-x-0 top-0 z-40">
        <div className="mx-auto flex h-20 max-w-345 items-center justify-between px-5 sm:px-8 lg:px-12">
          <a
            href="#"
            className="flex items-center gap-2.5 text-white"
            aria-label="Zinab home"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e1f06a] text-[#173d2d]">
              <Icon name="leaf" size={22} />
            </span>
            <span className="text-[25px] font-semibold tracking-[-0.04em]">
              zinab
            </span>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium text-white/85 lg:flex">
            <a href="#overview" className="text-white">
              Overview
            </a>
            <a href="#forecast" className="transition hover:text-white">
              Forecast
            </a>
            <a href="#soil" className="transition hover:text-white">
              Soil health
            </a>
            <a href="#reports" className="transition hover:text-white">
              Field reports
            </a>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <button className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md">
              English <Icon name="chevron" size={16} />
            </button>
            <button className="rounded-full bg-[#e1f06a] px-5 py-2.5 text-sm font-semibold text-[#173d2d] transition hover:bg-[#edfa8b]">
              My locations
            </button>
          </div>

          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/25 text-white sm:hidden"
            aria-label="Toggle navigation"
          >
            <Icon name="menu" />
          </button>
        </div>
        {mobileMenu && (
          <div className="mx-5 rounded-2xl border border-white/15 bg-[#153b2d]/95 p-5 text-white shadow-xl backdrop-blur-lg sm:hidden">
            <div className="grid gap-4 text-sm">
              <a href="#overview">Overview</a>
              <a href="#forecast">Forecast</a>
              <a href="#soil">Soil health</a>
              <a href="#reports">Field reports</a>
            </div>
          </div>
        )}
      </header>

      <main>
        <section
          id="overview"
          className="relative min-h-205 overflow-hidden bg-[#143c2d] pt-20 text-white"
        >
          <Image
            src="/hero.avif"
            alt="Aerial view of vibrant green agricultural fields"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-65"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,43,31,.95)_0%,rgba(12,43,31,.72)_45%,rgba(12,43,31,.18)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-linear-to-t from-[#143c2d]/65 to-transparent" />

          <div className="relative mx-auto grid max-w-345 items-start gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:px-12 lg:py-20">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-[#e1f06a]" />
                Live agricultural intelligence
              </div>
              <h1 className="max-w-170 text-4xl font-medium leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-[64px]">
                Know your land.
                <br />
                <span className="text-[#e1f06a]">Grow with confidence.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/75">
                Click your field on the map or search your town — Zinab explains
                live weather, forecast and soil data in your language.
              </p>

              <form
                onSubmit={handleSearchSubmit}
                className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
              >
                <label className="relative flex flex-1 items-center gap-3 rounded-full bg-white px-5 py-4 text-[#456055] shadow-2xl shadow-black/10">
                  <Icon name="search" size={20} />
                  <div className="relative min-w-0 flex-1">
                    <input
                      value={searchInput}
                      onChange={(e) => {
                        setSearchInput(e.target.value);
                        setUserPickedFromSearch(false);
                        setSelectedSearchName(null);
                        setShowSearchResults(true);
                      }}
                      onFocus={() => setShowSearchResults(true)}
                      onBlur={() =>
                        setTimeout(() => setShowSearchResults(false), 200)
                      }
                      className="w-full bg-transparent text-sm font-medium text-[#18352a] outline-none"
                      aria-label="Search a location"
                      placeholder="Search any village, town, or woreda..."
                    />
                    {showSearchResults &&
                      (searchLoading || searchResults.length > 0) && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-xl bg-white shadow-2xl">
                          {searchLoading && (
                            <div className="px-4 py-3 text-xs text-gray-500">
                              Searching…
                            </div>
                          )}
                          {searchResults.map((result, i) => (
                            <button
                              key={i}
                              type="button"
                              // FIX 1: Use onMouseDown to fire before onBlur
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevent input blur
                                handleSelectSearchResult(result);
                              }}
                              className="block w-full border-b border-gray-100 px-4 py-3 text-left text-sm text-[#18352a] hover:bg-[#e7eadc]"
                            >
                              <span className="font-medium">
                                {result.shortName}
                              </span>
                              <span className="block text-xs text-gray-500 truncate">
                                {result.zone ? `${result.zone}, ` : ""}
                                {result.region}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                </label>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-full bg-[#e1f06a] px-6 py-4 text-sm font-semibold text-[#173d2d] transition hover:bg-[#edfa8b]"
                >
                  <Icon name="location" size={18} /> Search
                </button>
              </form>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-white/65">
                <span className="flex items-center gap-2">
                  <Icon name="shield" size={16} /> Verified data sources
                </span>
                <span className="flex items-center gap-2">
                  <Icon name="cloud" size={16} /> Updated every 6 hours
                </span>
                <span className="flex items-center gap-2">
                  <Icon name="mic" size={16} /> Voice in 3 languages
                </span>
              </div>

              <div className="mt-8 grid gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e1f06a] text-[#173d2d]">
                    <Icon name="rain" size={18} />
                  </span>
                  <div>
                    <strong className="block text-lg leading-tight">
                      {facts?.rain7DaysMm ?? "—"} mm
                    </strong>
                    <span className="text-xs text-white/60">Rain / 7 days</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e1f06a] text-[#173d2d]">
                    <Icon name="thermometer" size={18} />
                  </span>
                  <div>
                    <strong className="block text-lg leading-tight">
                      {facts?.todayTemp ?? "—"}°C
                    </strong>
                    <span className="text-xs text-white/60">Today</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e1f06a] text-[#173d2d]">
                    <Icon name="droplet" size={18} />
                  </span>
                  <div>
                    <strong className="block text-lg leading-tight">
                      {facts?.todaySoilMoisturePct ?? "—"}%
                    </strong>
                    <span className="text-xs text-white/60">Soil moisture</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[30px] border border-white/20 bg-[#f9faf4]/95 p-4 text-[#18352a] shadow-2xl shadow-black/25 backdrop-blur-xl">
                <div className="flex items-start justify-between px-2 pt-1">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6c7c73]">
                      Today in {placeLabel}
                    </p>
                    <p className="mt-1.5 text-xl font-semibold tracking-[-0.035em]">
                      {loading
                        ? "Loading…"
                        : error
                          ? "Data unavailable"
                          : (facts?.verdict.label ?? "—")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${facts?.verdict.badgeColor ?? "bg-[#dfe8ad] text-[#3d5928]"}`}
                  >
                    {facts?.verdict.badge ?? "—"}
                  </span>
                </div>

                <div className="mt-3 h-100 overflow-hidden rounded-[22px]">
                  <EthiopiaMap
                    lat={activeLat}
                    lon={activeLon}
                    onPick={(lat, lon) => {
                      setPickedCoords({ lat, lon });
                      setUserPickedFromSearch(false); // <-- unlock
                      setSelectedSearchName(null);
                    }}
                  />
                </div>

                <div className="px-2 pt-3">
                  <p className="text-[11px] text-[#748077]">
                    {placeFull} ·{" "}
                    {geoStatus === "asking"
                      ? "Locating you…"
                      : "Tap the map to change"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-[#173d2d]/90 p-4 text-white backdrop-blur-md">
                <div className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e1f06a] text-[#173d2d]">
                    <Icon name="leaf" size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      Zinab&apos;s guidance
                    </p>
                    <p className="mt-1.5 text-sm leading-5 text-white/70">
                      {aiLoading
                        ? "Zinab is thinking…"
                        : aiError
                          ? "AI unavailable. Discuss with your local Development Agent."
                          : aiText ||
                            `${facts?.rainNext16Mm} mm expected over the next 16 days. Discuss with your local Development Agent.`}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <select
                    value={listenLang}
                    onChange={(e) => setListenLang(e.target.value as any)}
                    className="rounded-full bg-[#173d2d] border border-white/20 px-2 py-1 text-xs text-[#e1f06a] outline-none"
                  >
                    <option value="am-ET">Amharic</option>
                    <option value="om-ET">Afaan Oromo</option>
                    <option value="en-US">English</option>
                  </select>
                  <button
                    onClick={() => {
                      if (aiText) {
                        speak(aiText, listenLang);
                      }
                    }}
                    disabled={isSpeaking || aiLoading || !aiText}
                    className="flex items-center gap-2 text-xs font-semibold text-[#e1f06a] transition hover:opacity-80 disabled:opacity-40"
                  >
                    <Icon name="play" size={17} />
                    {isSpeaking ? "Speaking…" : "Listen"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="forecast"
          className="mx-auto max-w-345 px-5 py-20 sm:px-8 lg:px-12 lg:py-28"
        >
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="section-label">Your field today</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                A clearer view of what&apos;s ahead.
              </h2>
            </div>
            <button className="flex w-fit items-center gap-2 rounded-full border border-[#cad0c5] bg-white px-4 py-2.5 text-sm font-semibold">
              <Icon name="location" size={17} /> {placeFull}{" "}
              <Icon name="chevron" size={16} />
            </button>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
            <article className="rounded-[28px] bg-white p-5 shadow-[0_20px_50px_rgba(35,54,43,.06)] sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">5-day forecast</p>
                  <p className="mt-1 text-sm text-[#748077]">
                    {loading ? "Loading…" : "Live from Open-Meteo"}
                  </p>
                </div>
                <span className="hidden rounded-full bg-[#f2f4ee] px-3 py-1.5 text-xs text-[#6d796f] sm:block">
                  Source: Open-Meteo
                </span>
              </div>
              <div className="mt-7 grid grid-cols-5 divide-x divide-[#e3e7df]">
                {(fiveDays.length > 0 ? fiveDays : Array(5).fill(null)).map(
                  (day, index) => (
                    <div
                      key={index}
                      className={`px-2 text-center sm:px-4 ${index === 0 ? "text-[#245a43]" : ""}`}
                    >
                      <p className="text-xs font-semibold sm:text-sm">
                        {day ? formatDayShort(day.date, index) : "—"}
                      </p>
                      <div className="mx-auto my-4 grid h-10 w-10 place-items-center rounded-full bg-[#eef1e8]">
                        <Icon
                          name={day ? pickDayIcon(day) : "cloud"}
                          size={21}
                        />
                      </div>
                      <p className="text-base font-semibold sm:text-lg">
                        {day?.tMax != null ? `${Math.round(day.tMax)}°` : "—"}{" "}
                        <span className="text-[#a0aaa2]">
                          {day?.tMin != null ? `${Math.round(day.tMin)}°` : ""}
                        </span>
                      </p>
                      <p className="mt-2 text-xs text-[#4d8c75]">
                        {day?.rainProb != null ? `${day.rainProb}%` : "—"}
                      </p>
                    </div>
                  ),
                )}
              </div>
              <div className="mt-8 rounded-2xl bg-[#f4f5ed] p-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">Expected rainfall</span>
                  <span className="text-[#748077]">
                    Next 16 days · {facts?.rainNext16Mm ?? "—"} mm total
                  </span>
                </div>
                <div className="mt-6 flex h-24 items-end gap-2">
                  {barHeights.length > 0
                    ? barHeights.map((h, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-t-sm ${i > 9 ? "bg-[#a9b9ae]" : "bg-[#4d8c75]"}`}
                          style={{ height: `${Math.max(4, h)}%` }}
                          title={
                            cond
                              ? `${cond.forecast[i].date}: ${cond.forecast[i].rainMm} mm`
                              : ""
                          }
                        />
                      ))
                    : Array(16)
                        .fill(0)
                        .map((_, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t-sm bg-[#e3e7df]"
                            style={{ height: "4%" }}
                          />
                        ))}
                </div>
                <div className="mt-3 flex justify-between text-[10px] uppercase tracking-wider text-[#919c94]">
                  <span>Today</span>
                  <span>Day 8</span>
                  <span>Day 16</span>
                </div>
              </div>
            </article>

            <article
              id="soil"
              className="relative overflow-hidden rounded-[28px] bg-[#173d2d] p-7 text-white shadow-[0_20px_50px_rgba(35,54,43,.12)]"
            >
              <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full border-35 border-white/5" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e1f06a]">
                Soil health
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">
                {soilPct >= 60
                  ? "Your soil is holding water well."
                  : soilPct >= 30
                    ? "Soil moisture is moderate."
                    : "Soil is drying out."}
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Moisture is{" "}
                {soilPct >= 60 ? "stable" : soilPct >= 30 ? "adequate" : "low"}{" "}
                for current crop growth.
              </p>
              <div className="my-7 grid place-items-center">
                <div
                  className="relative grid h-40 w-40 place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(#e1f06a 0 ${soilPct}%, rgba(255,255,255,.09) ${soilPct}%)`,
                  }}
                >
                  <div className="grid h-28 w-28 place-items-center rounded-full bg-[#173d2d] text-center">
                    <div>
                      <strong className="text-4xl">{soilPct}%</strong>
                      <span className="block text-xs text-white/55">
                        moisture
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/8 p-4">
                  <span className="text-xs text-white/50">Soil pH</span>
                  <strong className="mt-1 block text-xl">
                    {cond?.soil.ph != null ? (
                      <>
                        {cond.soil.ph.toFixed(1)}{" "}
                        <small
                          className={`text-xs font-normal ${facts?.phLabelColor ?? ""}`}
                        >
                          {facts?.phLabel ?? ""}
                        </small>
                      </>
                    ) : (
                      <span className="text-sm font-normal text-white/55">
                        Unavailable here
                      </span>
                    )}
                  </strong>
                </div>
                <div className="rounded-2xl bg-white/8 p-4">
                  <span className="text-xs text-white/50">Texture</span>
                  <strong className="mt-1 block text-xl">
                    {soilAvailable ? (
                      (facts?.soilTexture ?? "—")
                    ) : (
                      <span className="text-sm font-normal text-white/55">
                        Unavailable here
                      </span>
                    )}
                  </strong>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section id="reports" className="bg-[#e7eadc]">
          <div className="mx-auto grid max-w-345 gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:px-12 lg:py-28">
            <div>
              <p className="section-label">Grounded, practical guidance</p>
              <h2 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-5xl">
                Ask Zinab before your next move.
              </h2>
              <p className="mt-5 max-w-lg leading-7 text-[#68776d]">
                Choose your crop and ask a question by voice. Every answer is
                based on your location&apos;s latest verified conditions—not
                guesses.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {["Teff", "Maize", "Wheat", "Sorghum", "Barley"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setCrop(item)}
                    className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${crop === item ? "bg-[#173d2d] text-white" : "border border-[#c6ccc0] bg-white/60 text-[#526259] hover:bg-white"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-4xl bg-[#fbfcf7] p-5 shadow-[0_24px_60px_rgba(35,54,43,.1)] sm:p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e1f06a]">
                    <Icon name="leaf" size={19} />
                  </span>
                  <div>
                    <p className="font-semibold">Ask Zinab</p>
                    <p className="text-xs text-[#7b887f]">
                      Guidance for {crop} · {placeLabel}
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-medium text-[#5d6d63]">
                  <span className="h-2 w-2 rounded-full bg-[#68a750]" /> Online
                </span>
              </div>

              <VoiceAssistant
                facts={facts}
                crop={crop}
                placeLabel={placeLabel}
              />

              <div className="flex items-center gap-3 rounded-full border border-[#d9ded4] bg-white px-5 py-3.5">
                <input
                  placeholder="Or type your question here..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9aa39d]"
                />
                <button
                  className="grid h-9 w-9 place-items-center rounded-full bg-[#e1f06a] text-[#173d2d]"
                  aria-label="Send question"
                >
                  <Icon name="arrow" size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#102f23] text-white">
        <div className="mx-auto flex max-w-345 flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <Icon name="leaf" size={22} /> zinab
          </div>
          <p className="text-xs text-white/45">
            Real data. Local knowledge. Better farming decisions.
          </p>
          <div className="flex gap-5 text-xs text-white/55">
            <a href="#">Data sources</a>
            <a href="#">Privacy</a>
            <a href="#">Help</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
