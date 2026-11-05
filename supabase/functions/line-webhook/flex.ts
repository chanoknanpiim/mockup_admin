// ============================================================================
// Plod-Ploi (ปลดปล่อย) — Minimalist Fashion-Card Style LINE Flex Message Builder
// Central Theme Constants (Change `PRIMARY` in one place to update entire system)
// ============================================================================

export const PRIMARY = '#000066';
export const HEADER_MUTED_TEXT = '#C7D2FE';
export const TEXT_DARK = '#0F172A';
export const TEXT_MUTED = '#64748B';
export const BORDER_LIGHT = '#E2E8F0';
export const TEST_BADGE_BG = '#F1F5F9';
export const STAR_GOLD = '#FFD700';
export const STAR_DARK_GREY = '#475569';

export interface NearbyToiletRow {
  toilet_id: number;
  name: string;
  description?: string | null;
  building_id?: number | null;
  building_name?: string | null;
  floor?: number | null;
  location_lat: number;
  location_lng: number;
  location_text?: string | null;
  address?: string | null;
  toilet_type?: string | null;
  status: string;
  has_bidet?: boolean | null;
  has_disabled_access?: boolean | null;
  has_disabled?: boolean | null;
  facilities?: string[] | null;
  cover_image_url?: string | null;
  avg_rating?: number | string | null;
  review_count?: number | string | null;
  distance_m: number;
}

export interface FlexBuilderConfig {
  appBaseUrl: string;
  liffId: string;
  activeRadiusM: number;
  activeFilterLabel?: string | null;
}

const TEST_PREFIX_REGEX = /^\s*\[ข้อมูลทดสอบ\]\s*/;

export function extractTestPrefix(rawText: string | null | undefined): {
  cleanText: string;
  isTestData: boolean;
} {
  const str = String(rawText || '').trim();
  if (TEST_PREFIX_REGEX.test(str)) {
    return {
      cleanText: str.replace(TEST_PREFIX_REGEX, '').trim(),
      isTestData: true,
    };
  }
  return {
    cleanText: str,
    isTestData: false,
  };
}

export function formatDistanceHeadline(distanceM: number): string {
  if (distanceM < 1000) {
    return `ห่าง ${Math.round(distanceM)} ม.`;
  }
  return `ห่าง ${(distanceM / 1000).toFixed(2)} กม.`;
}

export function isCurrentlyOpenInThailand(now?: Date): boolean {
  const date = now || new Date();
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Bangkok',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value || 0);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0);
    const totalMinutes = hour * 60 + minute;
    // Operating hours: 08:30 - 19:00
    return totalMinutes >= 510 && totalMinutes < 1140;
  } catch {
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();
    const bkkHours = (utcHours + 7) % 24;
    const totalMinutes = bkkHours * 60 + utcMinutes;
    return totalMinutes >= 510 && totalMinutes < 1140;
  }
}

export function formatHeaderStatus(toilet: NearbyToiletRow): string {
  if (toilet.status && toilet.status !== 'ใช้งานได้') {
    return toilet.status;
  }
  return isCurrentlyOpenInThailand() ? 'เปิด' : 'ปิด';
}

export function formatBuildingAndFloor(
  toilet: NearbyToiletRow,
  fallbackTitle: string
): string {
  const baseBuilding = (toilet.building_name || fallbackTitle || 'มธ. ท่าพระจันทร์').trim();
  if (toilet.floor !== null && toilet.floor !== undefined) {
    return `${baseBuilding} F${toilet.floor}`;
  }
  return baseBuilding;
}

export function formatDisabledAccessValue(toilet: NearbyToiletRow): string {
  const hasDisabled = Boolean(toilet.has_disabled_access ?? toilet.has_disabled);
  return hasDisabled ? 'มีให้บริการ' : 'ไม่มีให้บริการ';
}

export function buildRatingSpans(
  avgRating: number | string | null | undefined,
  reviewCount: number | string | null | undefined
) {
  const count = Number(reviewCount || 0);
  const rawRating = Number(avgRating || 0);
  const effectiveRating = count <= 0 ? 5.0 : rawRating;
  const isGoldStar = count <= 0 || Math.abs(effectiveRating - 5.0) < 0.001 || effectiveRating >= 5.0;

  return [
    {
      type: 'span',
      text: '★ ',
      color: isGoldStar ? STAR_GOLD : STAR_DARK_GREY,
      weight: 'bold',
    },
    {
      type: 'span',
      text: `${effectiveRating.toFixed(1)} (${count} รีวิว)`,
      color: TEXT_DARK,
      weight: 'bold',
    },
  ];
}

export function buildQuickReplyFilterItems() {
  return {
    items: [
      {
        type: 'action',
        action: {
          type: 'location',
          label: 'ส่งตำแหน่งใหม่',
        },
      },
      {
        type: 'action',
        action: {
          type: 'postback',
          label: 'ทั้งหมด',
          data: 'action=filter&filter=all',
          displayText: 'กรองห้องน้ำ: ทั้งหมด',
        },
      },
      {
        type: 'action',
        action: {
          type: 'postback',
          label: 'ห้องน้ำผู้พิการ',
          data: 'action=filter&filter=has_disabled_access',
          displayText: 'กรองห้องน้ำ: ห้องน้ำผู้พิการ',
        },
      },
      {
        type: 'action',
        action: {
          type: 'postback',
          label: 'ผ้าอนามัย',
          data: 'action=filter&filter=sanitary',
          displayText: 'กรองห้องน้ำ: ผ้าอนามัย',
        },
      },
    ],
  };
}

export function buildToiletBubble(
  toilet: NearbyToiletRow,
  index: number,
  config: FlexBuilderConfig
) {
  const liffIdOrPlaceholder = config.liffId || 'YOUR_LIFF_ID';
  const detailUrl = `https://liff.line.me/${liffIdOrPlaceholder}?toilet_id=${toilet.toilet_id}`;
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${toilet.location_lat},${toilet.location_lng}&travelmode=walking`;

  const rawName = toilet.name || toilet.location_text || `ห้องน้ำ #${toilet.toilet_id}`;
  const rawDescription = toilet.description || toilet.location_text || rawName;
  const { cleanText: cleanName, isTestData: isNameTest } = extractTestPrefix(rawName);
  const { cleanText: cleanDesc, isTestData: isDescTest } = extractTestPrefix(rawDescription);
  const isTestData = isNameTest || isDescTest;
  const spotLandmarkText = cleanDesc || cleanName || 'มธ. ท่าพระจันทร์';
  const buildingFloorTitle = formatBuildingAndFloor(toilet, cleanName || spotLandmarkText);

  const bodyContents: Record<string, unknown>[] = [
    // 1. Small grey rank line
    {
      type: 'text',
      text: `ห้องน้ำใกล้คุณ ลำดับที่ ${index + 1}`,
      size: 'xs',
      color: TEXT_MUTED,
      weight: 'bold',
    },
    // 2. Building Name + Floor (e.g. "วิทยาลัยนวัตกรรม F4")
    {
      type: 'text',
      text: buildingFloorTitle,
      size: 'xl',
      weight: 'bold',
      color: PRIMARY,
      wrap: true,
      maxLines: 2,
      margin: 'xs',
    },
    // 3. Prominent Distance (xxl, bold, PRIMARY)
    {
      type: 'text',
      text: formatDistanceHeadline(toilet.distance_m),
      size: 'xxl',
      weight: 'bold',
      color: PRIMARY,
      margin: 'sm',
    },
    // 4. Spot Landmark Note (with "[ข้อมูลทดสอบ]" stripped)
    {
      type: 'text',
      text: spotLandmarkText,
      size: 'xs',
      color: TEXT_MUTED,
      wrap: true,
      margin: 'xs',
    },
    // 5. Thin separator
    {
      type: 'separator',
      margin: 'lg',
      color: BORDER_LIGHT,
    },
    // 6. Key-Value Table (2 rows: คะแนน & ห้องน้ำผู้พิการ)
    {
      type: 'box',
      layout: 'vertical',
      margin: 'lg',
      spacing: 'md',
      contents: [
        // Row 1: คะแนน
        {
          type: 'box',
          layout: 'horizontal',
          alignItems: 'center',
          contents: [
            {
              type: 'text',
              text: 'คะแนน',
              size: 'sm',
              color: TEXT_MUTED,
              flex: 4,
            },
            {
              type: 'text',
              size: 'sm',
              align: 'end',
              flex: 6,
              contents: buildRatingSpans(toilet.avg_rating, toilet.review_count),
            },
          ],
        },
        {
          type: 'separator',
          color: BORDER_LIGHT,
        },
        // Row 2: ห้องน้ำผู้พิการ
        {
          type: 'box',
          layout: 'horizontal',
          alignItems: 'flex-start',
          contents: [
            {
              type: 'text',
              text: 'ห้องน้ำผู้พิการ',
              size: 'sm',
              color: TEXT_MUTED,
              flex: 5,
            },
            {
              type: 'text',
              text: formatDisabledAccessValue(toilet),
              size: 'sm',
              color: TEXT_DARK,
              weight: 'bold',
              align: 'end',
              wrap: true,
              flex: 7,
            },
          ],
        },
      ],
    },
  ];

  // 7. Conditional test-data badge at bottom of body ONLY if name/location_text started with [ข้อมูลทดสอบ]
  if (isTestData) {
    bodyContents.push({
      type: 'box',
      layout: 'horizontal',
      margin: 'lg',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          backgroundColor: TEST_BADGE_BG,
          cornerRadius: '4px',
          paddingAll: '4px',
          paddingStart: '8px',
          paddingEnd: '8px',
          flex: 0,
          contents: [
            {
              type: 'text',
              text: 'ข้อมูลทดสอบ',
              size: 'xs',
              color: TEXT_MUTED,
            },
          ],
        },
      ],
    });
  }

  return {
    type: 'bubble',
    size: 'mega',
    header: {
      type: 'box',
      layout: 'horizontal',
      backgroundColor: PRIMARY,
      paddingAll: '18px',
      paddingStart: '22px',
      paddingEnd: '22px',
      alignItems: 'center',
      contents: [
        {
          type: 'text',
          text: 'PLODPLOI',
          color: '#FFFFFF',
          size: 'sm',
          weight: 'bold',
          flex: 1,
        },
        {
          type: 'text',
          text: formatHeaderStatus(toilet),
          color: HEADER_MUTED_TEXT,
          size: 'xs',
          weight: 'bold',
          align: 'end',
          flex: 0,
        },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#FFFFFF',
      paddingAll: '22px',
      contents: bodyContents,
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#FFFFFF',
      paddingAll: '20px',
      paddingTop: '4px',
      spacing: 'sm',
      contents: [
        // Primary Button: solid PRIMARY (#000066), white text, rounded corners
        {
          type: 'box',
          layout: 'vertical',
          backgroundColor: PRIMARY,
          cornerRadius: '8px',
          paddingAll: '12px',
          alignItems: 'center',
          justifyContent: 'center',
          action: {
            type: 'uri',
            label: 'นำทาง',
            uri: googleMapsUrl,
          },
          contents: [
            {
              type: 'text',
              text: 'นำทาง',
              color: '#FFFFFF',
              size: 'sm',
              weight: 'bold',
              align: 'center',
            },
          ],
        },
        // Secondary Button: white background, 1px PRIMARY (#000066) border, PRIMARY text
        {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#FFFFFF',
          borderColor: PRIMARY,
          borderWidth: '1px',
          cornerRadius: '8px',
          paddingAll: '12px',
          alignItems: 'center',
          justifyContent: 'center',
          action: {
            type: 'uri',
            label: 'ดูรายละเอียด / รีวิว',
            uri: detailUrl,
          },
          contents: [
            {
              type: 'text',
              text: 'ดูรายละเอียด / รีวิว',
              color: PRIMARY,
              size: 'sm',
              weight: 'bold',
              align: 'center',
            },
          ],
        },
      ],
    },
  };
}

export function buildViewAllOnMapBubble(
  totalFound: number,
  config: FlexBuilderConfig
) {
  const liffIdOrPlaceholder = config.liffId || 'YOUR_LIFF_ID';
  const mapUrl = `https://liff.line.me/${liffIdOrPlaceholder}`;

  return {
    type: 'bubble',
    size: 'mega',
    header: {
      type: 'box',
      layout: 'horizontal',
      backgroundColor: PRIMARY,
      paddingAll: '18px',
      paddingStart: '22px',
      paddingEnd: '22px',
      alignItems: 'center',
      contents: [
        {
          type: 'text',
          text: 'PLODPLOI',
          color: '#FFFFFF',
          size: 'sm',
          weight: 'bold',
          flex: 1,
        },
        {
          type: 'text',
          text: 'MAP VIEW',
          color: HEADER_MUTED_TEXT,
          size: 'xs',
          weight: 'bold',
          align: 'end',
          flex: 0,
        },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: PRIMARY,
      paddingAll: '24px',
      justifyContent: 'center',
      spacing: 'md',
      contents: [
        {
          type: 'text',
          text: 'ค้นหาเพิ่มเติม',
          size: 'xs',
          color: HEADER_MUTED_TEXT,
          weight: 'bold',
        },
        {
          type: 'text',
          text: 'ดูทั้งหมดบนแผนที่',
          size: 'xxl',
          weight: 'bold',
          color: '#FFFFFF',
          wrap: true,
        },
        {
          type: 'text',
          text: `พบห้องน้ำใกล้คุณ ${totalFound} แห่งในรัศมี ${config.activeRadiusM} เมตร`,
          size: 'sm',
          color: HEADER_MUTED_TEXT,
          wrap: true,
          margin: 'sm',
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: PRIMARY,
      paddingAll: '22px',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#FFFFFF',
          cornerRadius: '8px',
          paddingAll: '13px',
          alignItems: 'center',
          justifyContent: 'center',
          action: {
            type: 'uri',
            label: 'แผนที่',
            uri: mapUrl,
          },
          contents: [
            {
              type: 'text',
              text: 'แผนที่',
              color: PRIMARY,
              size: 'sm',
              weight: 'bold',
              align: 'center',
            },
          ],
        },
      ],
    },
  };
}

export function buildNearbyToiletsCarouselMessage(
  toilets: NearbyToiletRow[],
  config: FlexBuilderConfig
) {
  // LINE Carousel supports max 12 bubbles total: up to 11 toilet cards + 1 "ดูทั้งหมดบนแผนที่" card
  const limited = toilets.slice(0, 11);
  const bubbles = [
    ...limited.map((t, idx) => buildToiletBubble(t, idx, config)),
    buildViewAllOnMapBubble(toilets.length, config),
  ];

  return {
    type: 'flex',
    altText: `พบห้องน้ำใกล้คุณ ${toilets.length} แห่ง`,
    contents: {
      type: 'carousel',
      contents: bubbles,
    },
    quickReply: buildQuickReplyFilterItems(),
  };
}

export function buildFilterSelectionFlexMessage(liffId?: string) {
  const liffIdOrPlaceholder = liffId || 'YOUR_LIFF_ID';
  const mapUrl = `https://liff.line.me/${liffIdOrPlaceholder}`;

  return {
    type: 'flex',
    altText: 'ปลดปล่อย: เลือกตัวกรองห้องน้ำที่ต้องการ',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'horizontal',
        backgroundColor: PRIMARY,
        paddingAll: '18px',
        paddingStart: '22px',
        paddingEnd: '22px',
        alignItems: 'center',
        contents: [
          {
            type: 'text',
            text: 'PLODPLOI',
            color: '#FFFFFF',
            size: 'sm',
            weight: 'bold',
            flex: 1,
          },
          {
            type: 'text',
            text: 'FILTER',
            color: HEADER_MUTED_TEXT,
            size: 'xs',
            weight: 'bold',
            align: 'end',
            flex: 0,
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#FFFFFF',
        paddingAll: '22px',
        spacing: 'sm',
        contents: [
          {
            type: 'text',
            text: 'กรองห้องน้ำใกล้คุณ',
            size: 'xl',
            weight: 'bold',
            color: PRIMARY,
          },
          {
            type: 'text',
            text: 'เลือกเงื่อนไขจากปุ่มด้านล่าง แล้วส่งตำแหน่งของคุณ ระบบจะค้นหาห้องน้ำที่ตรงเงื่อนไขให้ทันที',
            size: 'sm',
            color: TEXT_MUTED,
            wrap: true,
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#FFFFFF',
        paddingAll: '20px',
        paddingTop: '4px',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            backgroundColor: PRIMARY,
            cornerRadius: '8px',
            paddingAll: '12px',
            alignItems: 'center',
            justifyContent: 'center',
            action: {
              type: 'uri',
              label: 'แผนที่',
              uri: mapUrl,
            },
            contents: [
              {
                type: 'text',
                text: 'แผนที่',
                color: '#FFFFFF',
                size: 'sm',
                weight: 'bold',
                align: 'center',
              },
            ],
          },
        ],
      },
    },
    quickReply: buildQuickReplyFilterItems(),
  };
}
