import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://www.glo.or.th/api/lottery/getLatestLottery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!res.ok) {
      throw new Error(`GLO API returned status ${res.status}`);
    }

    const data = await res.json();
    if (data && data.status && data.response) {
      const resp = data.response;
      const displayDate = resp.displayDate;
      const day = parseInt(displayDate.date, 10);
      const monthsThai = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
      ];
      const month = monthsThai[parseInt(displayDate.month, 10) - 1];
      const year = parseInt(displayDate.year, 10) + 543;
      const dateStr = `${day} ${month} ${year}`;

      const lottoData = resp.data;
      const firstPrize = lottoData.first.number[0].value;
      const twoDigitBack = lottoData.last2.number[0].value;
      
      // GLO API returns array of numbers, sort by round to ensure consistency
      const threeDigitFront = lottoData.last3f.number
        .sort((a, b) => a.round - b.round)
        .map(n => n.value);
      
      const threeDigitBack = lottoData.last3b.number
        .sort((a, b) => a.round - b.round)
        .map(n => n.value);

      return NextResponse.json({
        success: true,
        data: {
          date: dateStr,
          firstPrize,
          twoDigitBack,
          threeDigitFront,
          threeDigitBack,
          status: "official"
        }
      });
    }
    
    return NextResponse.json({ success: false, error: "Invalid GLO response structure" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
