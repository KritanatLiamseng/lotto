import { NextResponse } from 'next/server';

function parseAllHuayHistory(html) {
  const results = [];
  const rowRegex = /<tr><td[^>]*><span[^>]*title="([^"]*)">([^<]*)<\/span><\/td><td style="[^"]*">([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><\/tr>/g;
  
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const title = match[1];
    const displayDate = match[2];
    const firstPrize = match[3];
    const threeDigit = match[4];
    const twoDigitTop = match[5];
    
    const dateMatch = /วันที่\s+([^\d]*\d+.*)/.exec(title);
    const dateStr = dateMatch ? dateMatch[1].trim() : displayDate.replace("งวด", "").trim();

    results.push({
      date: dateStr,
      firstPrize,
      threeDigitBack: threeDigit,
      twoDigitBack: twoDigitTop,
      status: "official"
    });
  }
  return results;
}

const parseThaiDate = (dateStr) => {
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
  
  const yearEng = yearThai - 543;
  return new Date(yearEng, monthIdx, day);
};

export async function GET() {
  try {
    const urls = {
      star: 'https://allhuay.com/lotto/laostars',
      development: 'https://allhuay.com/lotto/laosdevelops',
      samakkee: 'https://allhuay.com/lotto/laounion',
      special: 'https://allhuay.com/lotto/xsthm',
      normal: 'https://allhuay.com/lotto/minhngoc',
      vip: 'https://allhuay.com/lotto/mlnhngo'
    };

    const scraped = {};
    const promises = Object.entries(urls).map(async ([key, url]) => {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          next: { revalidate: 900 } // Cache results for 15 minutes to prevent heavy load
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        scraped[key] = parseAllHuayHistory(html);
      } catch (e) {
        console.error(`Sync scraper failed for ${key}:`, e.message);
        scraped[key] = [];
      }
    });

    await Promise.all(promises);

    // Merge Lao categories by date
    const laoByDate = {};
    const addLao = (key, name, time) => {
      const list = scraped[key] || [];
      list.forEach(item => {
        if (!laoByDate[item.date]) laoByDate[item.date] = { date: item.date };
        laoByDate[item.date][key] = {
          name,
          time,
          firstPrize: item.firstPrize,
          twoDigitBack: item.twoDigitBack,
          threeDigitBack: item.threeDigitBack,
          status: "official"
        };
      });
    };

    addLao('star', 'ลาวสตาร์', '15:45 น.');
    addLao('development', 'หวยลาวพัฒนา', '20:30 น.');
    addLao('samakkee', 'ลาวสามัคคี', '21:30 น.');

    // Convert object to sorted array
    const laoList = Object.values(laoByDate).sort((a, b) => parseThaiDate(b.date) - parseThaiDate(a.date));

    // Merge Hanoi categories by date
    const hanoiByDate = {};
    const addHanoi = (key, name, time) => {
      const list = scraped[key] || [];
      list.forEach(item => {
        if (!hanoiByDate[item.date]) hanoiByDate[item.date] = { date: item.date };
        hanoiByDate[item.date][key] = {
          name,
          time,
          firstPrize: item.firstPrize,
          twoDigitBack: item.twoDigitBack,
          threeDigitBack: item.threeDigitBack,
          status: "official"
        };
      });
    };

    addHanoi('special', 'ฮานอยพิเศษ', '17:15 น.');
    addHanoi('normal', 'ฮานอยปกติ', '18:30 น.');
    addHanoi('vip', 'ฮานอย VIP', '19:15 น.');

    const hanoiList = Object.values(hanoiByDate).sort((a, b) => parseThaiDate(b.date) - parseThaiDate(a.date));

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
