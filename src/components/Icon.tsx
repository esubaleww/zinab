"use client";

export type IconName =
  | "arrow"
  | "chevron"
  | "cloud"
  | "droplet"
  | "leaf"
  | "location"
  | "menu"
  | "mic"
  | "play"
  | "rain"
  | "search"
  | "shield"
  | "sun"
  | "thermometer"
  | "wind";

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    chevron: <path d="m8 10 4 4 4-4" />,
    cloud: <path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9Z" />,
    droplet: (
      <path d="M12 22a7 7 0 0 0 7-7c0-5-7-13-7-13S5 10 5 15a7 7 0 0 0 7 7Z" />
    ),
    leaf: (
      <>
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 19 2 19 2c1 7-1.8 14.4-8 16.5" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6.94C9.34 12.96 12 12 16 12" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    mic: (
      <>
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8" />
      </>
    ),
    play: <path d="m9 7 8 5-8 5V7Z" />,
    rain: (
      <>
        <path d="M16 16.5h1a4 4 0 0 0 .3-8A6 6 0 0 0 6 10.5a3 3 0 0 0 0 6h1" />
        <path d="m8 19-1 2m5-2-1 2m5-2-1 2" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </>
    ),
    thermometer: (
      <>
        <path d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0Z" />
        <path d="M12 9v7" />
      </>
    ),
    wind: (
      <>
        <path d="M3 8h11a2 2 0 1 0-2-2M3 12h16a2 2 0 1 1-2 2M3 16h8" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
