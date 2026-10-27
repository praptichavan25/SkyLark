/**
 * SkyLark — World Map Vector Landmass Data
 * Calibrated for equirectangular projection centered at 10°E.
 * Provides crisp, geographically accurate SVG paths for all continents,
 * major islands, and subtle boundary divisions.
 */

export interface ContinentPath {
  id: string
  name: string
  path: string
}

/**
 * World continent landmasses mapped to 1000 x 520 canvas.
 * Aligned with projectGeoToSvg(lng, lat):
 *   x = ((lng + 170) / 360) * 1000
 *   y = ((82 - lat) / 140) * 520
 */
export const WORLD_CONTINENT_PATHS: ContinentPath[] = [
  // ── NORTH AMERICA ──────────────────────────────────────────────────────────
  {
    id: 'north-america-main',
    name: 'North America',
    path: `
      M 60 78
      C 75 70, 95 65, 115 70
      C 135 60, 160 55, 195 58
      C 230 62, 260 55, 290 68
      C 320 80, 315 105, 300 118
      C 295 130, 280 142, 275 158
      C 285 175, 292 205, 285 235
      C 278 248, 268 252, 255 240
      C 245 232, 238 238, 230 255
      C 220 270, 210 285, 225 295
      C 240 305, 250 320, 242 328
      C 235 330, 222 315, 215 300
      C 200 275, 190 255, 175 240
      C 165 220, 162 195, 155 170
      C 148 145, 138 128, 120 115
      C 95 105, 75 100, 60 78
      Z
    `,
  },
  // Alaska Peninsula & Aleutian Arc
  {
    id: 'north-america-alaska',
    name: 'Alaska',
    path: `
      M 60 78
      C 45 88, 30 102, 20 118
      C 28 122, 45 110, 60 102
      C 75 115, 90 118, 98 108
      C 90 95, 75 88, 60 78
      Z
    `,
  },
  // Greenland
  {
    id: 'greenland',
    name: 'Greenland',
    path: `
      M 340 45
      C 365 40, 395 48, 405 65
      C 410 82, 395 105, 375 115
      C 355 120, 340 108, 335 88
      C 330 70, 332 52, 340 45
      Z
    `,
  },

  // ── SOUTH AMERICA ──────────────────────────────────────────────────────────
  {
    id: 'south-america',
    name: 'South America',
    path: `
      M 242 328
      C 260 318, 285 315, 310 322
      C 340 330, 375 342, 398 360
      C 415 378, 412 400, 395 422
      C 375 445, 355 470, 335 500
      C 328 512, 318 518, 312 505
      C 305 485, 300 455, 292 430
      C 285 400, 275 375, 260 355
      C 250 342, 242 335, 242 328
      Z
    `,
  },

  // ── EUROPE ─────────────────────────────────────────────────────────────────
  // Continental Europe & Scandinavia
  {
    id: 'europe-main',
    name: 'Europe',
    path: `
      M 435 158
      C 445 145, 460 138, 475 140
      C 485 130, 492 118, 502 112
      C 512 95, 525 80, 545 68
      C 560 62, 570 75, 565 95
      C 555 115, 540 128, 532 140
      C 525 155, 530 170, 545 178
      C 538 188, 520 195, 505 192
      C 488 188, 478 195, 465 200
      C 448 202, 432 195, 428 180
      C 425 168, 430 162, 435 158
      Z
    `,
  },
  // British Isles & Ireland
  {
    id: 'british-isles',
    name: 'United Kingdom & Ireland',
    path: `
      M 458 102
      C 468 98, 476 105, 478 118
      C 475 128, 465 132, 458 126
      C 452 120, 454 108, 458 102
      Z
      M 445 112
      C 452 108, 456 115, 454 122
      C 450 126, 444 122, 445 112
      Z
    `,
  },
  // Italy & Mediterranean Peninsulas
  {
    id: 'italy',
    name: 'Italy',
    path: `
      M 498 162
      C 506 168, 516 182, 522 194
      C 520 198, 510 195, 504 186
      C 498 178, 495 170, 498 162
      Z
    `,
  },

  // ── AFRICA ─────────────────────────────────────────────────────────────────
  {
    id: 'africa-main',
    name: 'Africa',
    path: `
      M 432 208
      C 465 202, 510 205, 560 215
      C 600 225, 628 245, 655 272
      C 665 288, 650 312, 630 338
      C 615 365, 595 400, 580 435
      C 565 460, 545 468, 532 455
      C 515 435, 505 405, 498 375
      C 490 345, 475 328, 455 318
      C 432 308, 410 295, 402 272
      C 395 248, 410 225, 432 208
      Z
    `,
  },
  // Madagascar
  {
    id: 'madagascar',
    name: 'Madagascar',
    path: `
      M 638 378
      C 645 372, 652 385, 655 408
      C 652 428, 642 438, 636 430
      C 630 420, 632 395, 638 378
      Z
    `,
  },

  // ── ASIA ───────────────────────────────────────────────────────────────────
  // Northern & Central Asia (Siberia, China, Mongolia)
  {
    id: 'asia-main',
    name: 'Asia',
    path: `
      M 565 95
      C 610 82, 680 75, 750 78
      C 820 82, 885 92, 920 115
      C 915 138, 885 155, 860 172
      C 840 185, 835 210, 815 235
      C 798 255, 785 278, 775 305
      C 768 312, 758 308, 755 292
      C 752 275, 742 258, 730 250
      C 715 240, 705 255, 695 275
      C 685 292, 670 295, 665 280
      C 655 255, 645 238, 625 228
      C 605 220, 580 215, 565 210
      C 552 195, 545 178, 540 155
      C 548 135, 555 115, 565 95
      Z
    `,
  },
  // Arabian Peninsula (UAE, Saudi, Qatar)
  {
    id: 'arabian-peninsula',
    name: 'Middle East',
    path: `
      M 585 218
      C 605 215, 628 220, 642 232
      C 652 245, 645 265, 630 272
      C 612 280, 595 270, 588 252
      C 582 238, 580 225, 585 218
      Z
    `,
  },
  // Indian Subcontinent (Mumbai, Delhi, Bengaluru)
  {
    id: 'india-subcontinent',
    name: 'India',
    path: `
      M 662 198
      C 682 188, 705 192, 725 208
      C 730 225, 720 248, 708 268
      C 695 285, 684 288, 672 272
      C 660 255, 654 235, 658 215
      C 658 205, 660 200, 662 198
      Z
    `,
  },
  // Japan (Honshu, Hokkaido, Kyushu)
  {
    id: 'japan-archipelago',
    name: 'Japan',
    path: `
      M 865 148
      C 875 142, 882 155, 878 172
      C 872 188, 858 198, 850 195
      C 845 188, 852 178, 860 165
      C 865 155, 862 150, 865 148
      Z
    `,
  },
  // Southeast Asia & Malay Peninsula (Singapore)
  {
    id: 'se-asia-islands',
    name: 'Southeast Asia',
    path: `
      M 758 290
      C 768 285, 778 295, 782 308
      C 785 320, 775 330, 764 325
      C 755 318, 754 300, 758 290
      Z
      M 770 332
      C 810 325, 845 335, 860 352
      C 850 362, 815 358, 785 350
      C 772 345, 765 338, 770 332
      Z
    `,
  },

  // ── AUSTRALIA & OCEANIA ───────────────────────────────────────────────────
  {
    id: 'australia-main',
    name: 'Australia',
    path: `
      M 808 370
      C 835 352, 875 358, 905 378
      C 920 398, 915 425, 902 445
      C 885 460, 850 458, 825 448
      C 802 438, 792 418, 795 395
      C 798 382, 802 375, 808 370
      Z
    `,
  },
  // New Zealand
  {
    id: 'new-zealand',
    name: 'New Zealand',
    path: `
      M 935 442
      C 942 435, 948 445, 942 460
      C 936 472, 928 478, 924 470
      C 922 462, 928 450, 935 442
      Z
    `,
  },
]

/**
 * Geographic grid coordinates (Meridians & Parallels)
 */
export const MAP_GRATICULES = [
  // Parallels (Equator, Tropics, Arctic/Antarctic)
  { y: 78, label: '60° N', type: 'subtle' },
  { y: 154, label: '40° N', type: 'subtle' },
  { y: 228, label: '20° N (Tropic of Cancer)', type: 'tropic' },
  { y: 304, label: '0° Equator', type: 'equator' },
  { y: 380, label: '20° S (Tropic of Capricorn)', type: 'tropic' },
  { y: 456, label: '40° S', type: 'subtle' },

  // Meridians
  { x: 139, label: '120° W' },
  { x: 305, label: '60° W' },
  { x: 472, label: '0° Prime Meridian' },
  { x: 639, label: '60° E' },
  { x: 805, label: '120° E' },
  { x: 972, label: '180°' },
]
