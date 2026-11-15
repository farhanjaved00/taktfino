/** Stroke icon paths (24×24 viewBox). Rendered by <Icon>. */
export const ICONS = {
  clock: 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18zM12 7v5l3 2',
  cal: 'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4',
  calAdd: 'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5',
  hour: 'M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9',
  cake: 'M4 21h16v-8H4zM4 16c3 2 5-2 8 0s5-2 8 0M12 13V9M12 6v.01',
  globe: 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  pct: 'M19 5L5 19M7 5a2 2 0 1 0 0 4a2 2 0 0 0 0-4zM17 15a2 2 0 1 0 0 4a2 2 0 0 0 0-4z',
  search: 'M11 4a7 7 0 1 0 0 14a7 7 0 0 0 0-14zM20 20l-3.5-3.5',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  home: 'M3 11l9-7l9 7v9H3zM9 20v-6h6v6',
  bookmark: 'M6 3h12v18l-6-4l-6 4z',
  share: 'M12 3v12M7 8l5-5l5 5M5 14v6h14v-6',
  download: 'M12 4v11M7 10l5 5l5-5M5 20h14',
  print: 'M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z',
  link: 'M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1',
  chevron: 'M9 5l7 7l-7 7',
  back: 'M15 5l-7 7l7 7',
  book: 'M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z',
  history: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2',
} as const;
export type IconName = keyof typeof ICONS;
