'use client';

import React, { useState, useEffect } from 'react';

export default function FamousNumbers({ lottoType = 'thai' }) {
  // Set up local state for likes/votes categorized by lottery type
  const [sources, setSources] = useState({
    thai: [
      { id: 1, source: "เจ๊ฟองเบียร์ 888", description: "เน้นวิ่งรูดฟันขาด เม็ดเดียวงวดนี้ปล่อยใบจริงออกมาเน้นๆ", digit: "8", twoDigits: ["81", "85", "87"], threeDigit: "485", trendStrength: 95, votes: 1420 },
      { id: 2, source: "แม่น้ำหนึ่ง (ของแท้)", description: "ปล่อยเลขธูปปู่ และตารางนำโชคเพื่อสายแนวทางงวดล่าสุด", digit: "4", twoDigits: ["41", "49", "40"], threeDigit: "940", trendStrength: 90, votes: 1105 },
      { id: 3, source: "เลขม้าสีหมอก", description: "สำนักคลาสสิกที่คอหวยไทยตามทุกงวด วิ่งบนวิ่งล่างแม่นยำ", digit: "2", twoDigits: ["23", "28", "62"], threeDigit: "328", trendStrength: 82, votes: 843 },
      { id: 4, source: "ศาลปู่คำชะโนด", description: "เลขขันน้ำมนต์และเลขอายุปู่พญานาคประจำงวด แฟนคลับแน่นหนา", digit: "7", twoDigits: ["72", "70", "75"], threeDigit: "740", trendStrength: 88, votes: 954 },
      { id: 5, source: "ทะเบียนรถมงคลข่าวดัง", description: "เลขป้ายแดงรถหรูดาราดัง และป้ายทะเบียนผู้นำประเทศ", digit: "3", twoDigits: ["23", "30", "53"], threeDigit: "523", trendStrength: 75, votes: 612 },
      { id: 6, source: "เลขตารางไทยรัฐ / เดลินิวส์", description: "ตัวเลขตารางสอดประสานยอดนิยม สรุปจากหนังสือพิมพ์รายวัน", digit: "0", twoDigits: ["40", "70", "90"], threeDigit: "910", trendStrength: 78, votes: 529 }
    ],
    lao: [
      { id: 11, source: "ตำราฝันพัฒนา (ลาว)", description: "วิเคราะห์จากสัญลักษณ์สัตว์นำโชคตามตำราฝันสปป.ลาวที่เป็นสากล", digit: "5", twoDigits: ["52 (ม้า)", "59 (แมว)", "56 (เสือ)"], threeDigit: "752", trendStrength: 92, votes: 820 },
      { id: 12, source: "เจ๊ฟองเบียร์ แนวทางลาว", description: "วิเคราะห์ฟันตัวเดียวเน้นๆ สำหรับสู้ศึกหวยลาวพัฒนางวดนี้", digit: "9", twoDigits: ["91", "95", "96"], threeDigit: "395", trendStrength: 87, votes: 710 },
      { id: 13, source: "สูตรคำนวณกำลังวันลาว", description: "คัดกรองตามสถิติเลขออกบ่อยประจำวันจันทร์/พุธ/ศุกร์ตามศาสตร์วิชา", digit: "1", twoDigits: ["10", "14", "18"], threeDigit: "418", trendStrength: 80, votes: 412 },
      { id: 14, source: "แม่น้ำหนึ่ง เจาะแนวทางลาว", description: "ฟันเลขเด่นสองตัวหน้า-หลัง วิเคราะห์จากสูตรเลขนำโชคพญานาค", digit: "0", twoDigits: ["01", "08", "09"], threeDigit: "901", trendStrength: 85, votes: 635 }
    ],
    hanoi: [
      { id: 21, source: "เจ๊นุช บารมีมหาเฮง (ฮานอย)", description: "เจาะเลขฮานอยปกติรายวัน รูดบน-ล่าง มั่นใจเข้าเป้าเกือบทุกวัน", digit: "6", twoDigits: ["61", "64", "69"], threeDigit: "864", trendStrength: 94, votes: 980 },
      { id: 22, source: "สูตรฮานอยเจาะพิกัด VIP", description: "คำนวณด้วยสูตรคณิตศาสตร์เฉลี่ยผลรางวัลย้อนหลัง 5 วันล่าสุด", digit: "3", twoDigits: ["32", "37", "39"], threeDigit: "732", trendStrength: 89, votes: 742 },
      { id: 23, source: "แม่น้ำหนึ่ง แนวทางฮานอยรายวัน", description: "คัดเลขท้ายนำโชค ปล่อยเป็นแนวทางรายวันรอบค่ำ 18:30 น.", digit: "2", twoDigits: ["20", "28", "29"], threeDigit: "928", trendStrength: 83, votes: 531 },
      { id: 24, source: "กลุ่มนำโชคฮานอยฟันขาด", description: "กระแสเลขวิ่งฮานอยยอดนิยม มีคอหวยตามกดหัวใจโหวตล้นหลาม", digit: "7", twoDigits: ["71", "73", "78"], threeDigit: "473", trendStrength: 81, votes: 498 }
    ]
  });

  const handleVote = (id) => {
    setSources(prev => {
      const updated = { ...prev };
      // Find and increment vote in the matching category
      const keys = ['thai', 'lao', 'hanoi'];
      for (const k of keys) {
        const itemIdx = updated[k].findIndex(src => src.id === id);
        if (itemIdx !== -1) {
          const items = [...updated[k]];
          items[itemIdx] = { ...items[itemIdx], votes: items[itemIdx].votes + 1 };
          updated[k] = items;
          break;
        }
      }
      return updated;
    });
  };

  const currentSources = sources[lottoType] || sources.thai;

  const getThemeText = () => {
    switch (lottoType) {
      case 'lao':
        return {
          title: "🇱🇦 รวมเลขเด็ดหวยลาวพัฒนา",
          desc: "รวบรวมแนวทางตัวเลขยอดนิยมและตำราฝันสัตว์ลาวยอดนิยมสำหรับหวยลาวพัฒนา",
          color: '#00E5FF',
          btnBg: 'rgba(0, 229, 255, 0.1)',
          btnBorder: '1px solid #00E5FF'
        };
      case 'hanoi':
        return {
          title: "🇻🇳 รวมเลขเด็ดหวยฮานอยรายวัน",
          desc: "อัปเดตแนวทางหวยฮานอยสูตรเจาะรายวันรอบปกติ 18:30 น. จากกูรูชั้นนำ",
          color: '#FF007F',
          btnBg: 'rgba(255, 0, 127, 0.1)',
          btnBorder: '1px solid #FF007F'
        };
      case 'thai':
      default:
        return {
          title: "🇹🇭 รวมเลขเด็ดหวยรัฐบาลไทย",
          desc: "รวบรวมแนวทางตัวเลขยอดนิยมและเลขธูปเลขป้ายแดงจากทุกสำนักดังในไทย",
          color: 'var(--primary)',
          btnBg: 'rgba(189, 0, 255, 0.1)',
          btnBorder: '1px solid var(--primary)'
        };
    }
  };

  const theme = getThemeText();

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>{theme.title}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          {theme.desc}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {currentSources.map(src => (
          <div key={src.id} className="glass-card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px', 
            borderTop: `4px solid ${lottoType === 'lao' ? '#00E5FF' : lottoType === 'hanoi' ? '#FF007F' : 'var(--primary)'}` 
          }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', justifycontent: 'space-between', alignitems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', color: 'var(--gold)', fontWeight: 'bold' }}>{src.source}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {lottoType === 'lao' ? 'แนวทางสปป.ลาว' : lottoType === 'hanoi' ? 'แนวทางเวียดนามรายวัน' : 'แนวทางสลากกินแบ่งไทย'}
                </span>
              </div>
              <div 
                className="numbers-font" 
                style={{ 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  border: '1px solid var(--success)', 
                  color: 'var(--success)', 
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '3px 8px',
                  borderRadius: '30px',
                  whiteSpace: 'nowrap'
                }}
              >
                กระแสแรง {src.trendStrength}%
              </div>
            </div>

            {/* Description */}
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', minHeight: '40px' }}>
              {src.description}
            </p>

            {/* Number Recommendations */}
            <div style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-card)', paddingRight: '16px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>เด่นวิ่ง</span>
                <span className={`number-ball ${lottoType === 'lao' ? 'cyan-ball' : lottoType === 'hanoi' ? 'magenta-ball' : 'gold-ball'}`} style={{ width: '38px', height: '38px', fontSize: '16px', margin: 0, color: lottoType === 'thai' ? '#000' : '#FFF' }}>
                  {src.digit}
                </span>
              </div>

              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>เลขแนะนำ 2 ตัว / 3 ตัว</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {src.twoDigits.map((num, i) => (
                    <span key={i} className="numbers-font" style={{ background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                      {num}
                    </span>
                  ))}
                  <span className="numbers-font" style={{ 
                    background: lottoType === 'lao' ? 'rgba(0, 229, 255, 0.1)' : lottoType === 'hanoi' ? 'rgba(255, 0, 127, 0.1)' : 'rgba(0, 240, 255, 0.1)', 
                    border: `1px dashed ${lottoType === 'lao' ? '#00E5FF' : lottoType === 'hanoi' ? '#FF007F' : 'var(--secondary)'}`, 
                    color: lottoType === 'lao' ? '#00E5FF' : lottoType === 'hanoi' ? '#FF007F' : 'var(--secondary)', 
                    padding: '4px 8px', 
                    borderRadius: '6px', 
                    fontSize: '13px', 
                    fontWeight: 'bold' 
                  }}>
                    {src.threeDigit}
                  </span>
                </div>
              </div>

            </div>

            {/* Interactive voting section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                👍 โหวตแล้ว <strong className="numbers-font" style={{ color: '#FFFFFF' }}>{src.votes}</strong> คน
              </span>
              
              <button
                onClick={() => handleVote(src.id)}
                style={{
                  background: theme.btnBg,
                  border: theme.btnBorder,
                  color: '#FFFFFF',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = lottoType === 'lao' ? '#00E5FF' : lottoType === 'hanoi' ? '#FF007F' : 'var(--primary)'; if (lottoType === 'lao') e.currentTarget.style.color = '#000'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = theme.btnBg; e.currentTarget.style.color = '#FFFFFF'; }}
              >
                💚 โหวตเลขนี้
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
