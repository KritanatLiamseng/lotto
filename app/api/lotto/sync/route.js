import { NextResponse } from 'next/server';

function parseDailyResults(html, dateStr) {
  const results = {
    date: dateStr,
    star: null,
    development: null,
    samakkee: null,
    special: null,
    normal: null,
    vip: null
  };

  const targetSlugs = {
    'laostars': { key: 'star', name: 'ลาวสตาร์', time: '15:45 น.' },
    'laosdevelops': { key: 'development', name: 'หวยลาวพัฒนา', time: '20:30 น.' },
    'laounion': { key: 'samakkee', name: 'ลาวสามัคคี', time: '21:30 น.' },
    'xsthm': { key: 'special', name: 'ฮานอยพิเศษ', time: '17:15 น.' },
    'minhngoc': { key: 'normal', name: 'ฮานอยปกติ', time: '18:30 น.' },
    'mlnhngo': { key: 'vip', name: 'ฮานอย VIP', time: '19:15 น.' }
  };

  const rows = html.split(/<tr/g);
  
  rows.forEach(row => {
    const linkMatch = /href="\/lotto\/([^"]+)"/.exec(row);
    if (!linkMatch) return;
    const slug = linkMatch[1];
    
    if (targetSlugs[slug]) {
      const config = targetSlugs[slug];
      const topMatch = /today-cell-num--top3"[^>]*>[\s\S]*?class="today-cell-num-value">(\d+)<\/span>/.exec(row);
      const bottomMatch = /today-cell-num--bottom2"[^>]*>[\s\S]*?class="today-cell-num-value">(\d+)<\/span>/.exec(row);
      
      if (topMatch && bottomMatch) {
        const top3 = topMatch[1];
        results[config.key] = {
          name: config.name,
          time: config.time,
          firstPrize: top3.length === 3 ? "0" + top3 : top3,
          twoDigitBack: top3.slice(-2),
          threeDigitBack: top3,
          status: "official"
        };
      }
    }
  });

  // Clean empty keys
  const hasData = Object.keys(targetSlugs).some(slug => {
    const key = targetSlugs[slug].key;
    return results[key] !== null;
  });

  return hasData ? results : null;
}

const formatDateParam = (date) => {
  const tzOffset = 7 * 60; // Indochina time offset in minutes
  const localDate = new Date(date.getTime() + tzOffset * 60 * 1000);
  const yyyy = localDate.getUTCFullYear();
  const mm = String(localDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(localDate.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatThaiDate = (date) => {
  const tzOffset = 7 * 60;
  const localDate = new Date(date.getTime() + tzOffset * 60 * 1000);
  const day = localDate.getUTCDate();
  const monthsThai = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const month = monthsThai[localDate.getUTCMonth()];
  const year = localDate.getUTCFullYear() + 543;
  return `${day} ${month} ${year}`;
};

export async function GET() {
  try {
    const datesToSync = [];
    const now = new Date();
    
    // We fetch the last 3 days
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      datesToSync.push({
        param: formatDateParam(d),
        thaiStr: formatThaiDate(d)
      });
    }

    const scrapedList = [];

    const promises = datesToSync.map(async ({ param, thaiStr }) => {
      try {
        const url = `https://allhuay.com/result?date=${param}`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          next: { revalidate: 300 } // Cache for 5 minutes
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        const dailyObj = parseDailyResults(html, thaiStr);
        if (dailyObj) {
          scrapedList.push(dailyObj);
        }
      } catch (e) {
        console.error(`Sync daily scraper failed for date ${param}:`, e.message);
      }
    });

    await Promise.all(promises);

    // Split scrapedList into Lao and Hanoi structures
    const laoList = [];
    const hanoiList = [];

    scrapedList.forEach(dayObj => {
      if (dayObj.star || dayObj.development || dayObj.samakkee) {
        const laoEntry = { date: dayObj.date };
        if (dayObj.star) laoEntry.star = dayObj.star;
        if (dayObj.development) laoEntry.development = dayObj.development;
        if (dayObj.samakkee) laoEntry.samakkee = dayObj.samakkee;
        laoList.push(laoEntry);
      }

      if (dayObj.special || dayObj.normal || dayObj.vip) {
        const hanoiEntry = { date: dayObj.date };
        if (dayObj.special) hanoiEntry.special = dayObj.special;
        if (dayObj.normal) hanoiEntry.normal = dayObj.normal;
        if (dayObj.vip) hanoiEntry.vip = dayObj.vip;
        hanoiList.push(hanoiEntry);
      }
    });

    const parseThaiDateLocal = (dateStr) => {
      if (!dateStr) return new Date(0);
      const parts = dateStr.trim().split(/\s+/);
      if (parts.length !== 3) return new Date(0);
      const day = parseInt(parts[0], 10);
      const monthThai = parts[1];
      const yearThai = parseInt(parts[2], 10);
      const monthsThai = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
      ];
      const monthIdx = monthsThai.indexOf(monthThai);
      if (monthIdx === -1) return new Date(0);
      return new Date(yearThai - 543, monthIdx, day);
    };

    laoList.sort((a, b) => parseThaiDateLocal(b.date) - parseThaiDateLocal(a.date));
    hanoiList.sort((a, b) => parseThaiDateLocal(b.date) - parseThaiDateLocal(a.date));

    return NextResponse.json({
      success: true,
      data: {
        lao: laoList,
        hanoi: hanoiList
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
