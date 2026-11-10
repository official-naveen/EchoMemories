const PATHS = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  space: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  rooms: <><circle cx="9.5" cy="8" r="3.5" /><path d="M3 20v-1.5A3.5 3.5 0 0 1 6.5 15h6a3.5 3.5 0 0 1 3.5 3.5V20M16 4.7a3.5 3.5 0 0 1 0 6.6M21 20v-1.5a3.5 3.5 0 0 0-2.5-3.3" /></>,
  pulse: <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />,
  bell: <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9zM10 20a2 2 0 0 0 4 0" />,
  bookmark: <path d="M6 3h12v18l-6-4.5L6 21z" />,
  comment: <path d="M4 5h16v11H9l-5 4z" />,
  ripple: <><circle cx="12" cy="12" r="2" /><circle cx="12" cy="12" r="5.5" opacity=".7" /><circle cx="12" cy="12" r="9" opacity=".4" /></>,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  reply: <path d="M10 8 4 13l6 5v-3.5c5 0 8 1 10 4-.5-5-3.5-8.5-10-8.5z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  logout: <path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9" />,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  flame: <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <path d="M3 3l18 18M10.6 5.1A9.8 9.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 4.4-1M9.9 9.9a3 3 0 0 0 4.2 4.2" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  userPlus: <><circle cx="10" cy="8" r="4" /><path d="M2.5 21a7.5 7.5 0 0 1 15 0M19 8v6M16 11h6" /></>,
  link: <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 6.8l2.1 2.1M17.7 15.1l2.1 2.1M2 12h3M19 12h3M4.2 17.2l2.1-2.1M17.7 8.9l2.1-2.1" /></>,
  crown: <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" />,
}

export default function Icon({ name, className = "", ...rest }) {
  return (
    <svg
      className={`icon ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name] || null}
    </svg>
  )
}
