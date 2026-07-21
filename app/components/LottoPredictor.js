'use client';

import React, { useState } from 'react';
import { getPredictionStats, getOddEvenRatio, getHighLowRatio, getDigitStats, getGlobalAccuracy } from '../data/lottoHistory';

export default function LottoPredictor({ lottoType = 'thai', lottoData = [] }) {
  // Synchronous calculation via useMemo - Zero delay, 100% reactive to prop updates
  const predictions = React.useMemo(() => getPredictionStats(lottoData), [lottoData]);
  const oddEven = React.useMemo(() => getOddEvenRatio(lottoData), [lottoData]);
  const highLow = React.useMemo(() => getHighLowRatio(lottoData), [lottoData]);
  const digitStats = React.useMemo(() => getDigitStats(lottoData).sort((a, b) => b.count - a.count), [lottoData]);
  const globalAccuracy = React.useMemo(() => getGlobalAccuracy(lottoData), [lottoData]);

  const [copySuccess, setCopySuccess] = useState(false);

  // Theme configuration based on active lottery type
  const getThemeColors = () => {
    switch (lottoType) {
      case 'lao':
        return {
          primary: '#00E5FF',
          accentBall: 'cyan-ball',
          accentText: '#00B0FF',
          borderLeft: '5px solid #00E5FF',
          explanation: 'วิเคราะห์สถิติหวยลาว (ออกรางวัลตามเวลาทางการ)'
        };
      case 'hanoi':
        return {
          primary: '#FF007F',
          accentBall: 'magenta-ball',
          accentText: '#FF3366',
          borderLeft: '5px solid #FF007F',
          explanation: 'วิเคราะห์สถิติหวยฮานอย (ออกรางวัลทุกวัน)'
        };
      case 'thai':
      default:
        return {
          primary: 'var(--gold)',
          accentBall: 'gold-ball',
          accentText: 'var(--gold)',
          borderLeft: '5px solid var(--gold)',
          explanation: 'วิเคราะห์สถิติสลากกินแบ่งรัฐบาลไทย (ออกรางวัลวันที่ 1 และ 16 ของทุกเดือน)'
        };
    }
  };

  const theme = getThemeColors();

  // Get recommended numbers
  const topDigits = predictions.slice(0, 5).map(p => p.digit);
  const recommendedTwoDigits = [
    `${topDigits[0]}${topDigits[1]}`,
    `${topDigits[0]}${topDigits[2]}`,
    `${topDigits[1]}${topDigits[2]}`,
    `${topDigits[0]}${topDigits[3]}`
  ];
  
  const recommendedThreeDigits = [
    `${topDigits[0]}${topDigits[1]}${topDigits[2]}`,
    `${topDigits[3]}${topDigits[0]}${topDigits[1]}`,
    `${topDigits[4]}${topDigits[0]}${topDigits[2]}`
  ];

  const handleCopyNumbers = () => {
    const textToCopy = `🔮 [LottoOracle AI] เลขเด็ดวิเคราะห์งวดถัดไป (${lottoType === 'lao' ? 'หวยลาว' : lottoType === 'hanoi' ? 'หวยฮานอย' : 'หวยไทย'})
• วิ่ง/รูด: ${topDigits[0]}, ${topDigits[1]}
• เจาะ 2 ตัว: ${recommendedTwoDigits.join(', ')}
• ชุด 3 ตัว: ${recommendedThreeDigits.join(', ')}
${lottoType === 'lao' ? `• ชุด 4 ตัว: ${topDigits[0]}${topDigits[1]}${topDigits[2]}${predictions[3]?.digit || '9'}` : ''}
⚡ ประมวลผลสดใหม่จากสถิติตัวจริง 100%`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    });
  };

  return (
    <div className="dashboard-grid">
      {/* Left panel - Main predictions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Probability recommendations card */}
        <div className="glass-card" style={{ borderLeft: theme.borderLeft }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: theme.primary }}>★</span> เลขเด่นแนะนำงวดถัดไป
            </h2>
            {lottoData && lottoData.length > 0 && (
              <span style={{ fontSize: '12px', color: theme.primary, background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
                ⚡ สถิติล่าสุดที่ประมวลผล: {lottoData[0]?.date}
              </span>
            )}
          </div>

          {/* Quick 1-Tap Copy Button for Easy User Experience */}
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={handleCopyNumbers}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '14px',
                border: 'none',
                background: copySuccess ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #00E5FF 0%, #0077FF 100%)',
                color: '#FFFFFF',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(0, 229, 255, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              {copySuccess ? '✅ คัดลอกแล้ว! นำไปวางส่งในแชทได้ทันที' : '📋 กดคัดลอกชุดเลขเด็ดนี้ไปใช้งาน (1-Tap Copy)'}
            </button>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', margin: '24px 0', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>🔵 เลขเด่นวิ่งรูด (วิ่ง บน-ล่าง)</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span className={`number-ball ${theme.accentBall} predictor-ball-lg`}>{topDigits[0]}</span>
                <span className="number-ball magenta-ball predictor-ball-lg">{topDigits[1]}</span>
              </div>
            </div>
            
            <div style={{ flex: 2, minWidth: '220px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>🟣 เจาะเลขท้าย 2 ตัวแนะนำ</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {recommendedTwoDigits.map((num, i) => (
                  <span key={i} className="number-ball cyan-ball predictor-ball-md" style={{ margin: 0 }}>
                    {num}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>🟢 ชุดเลขท้าย 3 ตัวเต็ง-โต๊ด</div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {recommendedThreeDigits.map((num, i) => (
                <span key={i} className={`number-ball ${theme.accentBall} predictor-ball-3d`} style={{ margin: 0 }}>
                  {num}
                </span>
              ))}
            </div>
          </div>

          {lottoType === 'lao' && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>🟡 ชุดเลขท้าย 4 ตัวพัฒนาแนะนำ</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span className="numbers-font" style={{ background: 'rgba(0,229,255,0.1)', border: '1px dashed #00E5FF', color: '#00E5FF', padding: '8px 16px', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>
                  {topDigits[0]}{topDigits[1]}{topDigits[2]}{predictions[3]?.digit || '9'}
                </span>
              </div>
            </div>
          )}

          {/* Easy Beginner Guide Card */}
          <div style={{
            marginTop: '20px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '14px 18px'
          }}>
            <h4 style={{ fontSize: '13px', color: theme.primary, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              💡 วิธีนำเลขเด็ดไปใช้งานง่ายๆ สำหรับมือใหม่:
            </h4>
            <ul style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, paddingLeft: '18px', lineHeight: '1.8' }}>
              <li><strong>วิ่ง-รูด:</strong> ใช้ลูกบอล 2 ลูกแรก ({topDigits[0]} และ {topDigits[1]}) เหมาะกับสายแทงวิ่งบน-ล่าง</li>
              <li><strong>2 ตัวเน้น:</strong> นำชุด 2 ตัว ({recommendedTwoDigits[0]}, {recommendedTwoDigits[1]}) ไปเลือกเสี่ยงโชค 2 ตัวบน-ล่าง</li>
              <li><strong>3 ตัวเต็งโต๊ด:</strong> นำชุด 3 ตัวไปแทง 3 ตัวบนหรือโต๊ดได้ทันที</li>
            </ul>
          </div>
        </div>

        {/* Probability Bars Chart */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', margin: 0 }}>
              📊 กราฟวิเคราะห์พลังความน่าจะเป็น AI Super v4 (0 - 9)
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
              ประมวลผลสดใหม่ 100%
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {predictions.map((item, index) => {
              const barColor = lottoType === 'lao' 
                ? index < 3 ? 'linear-gradient(90deg, #00E5FF, #0077FF)' : 'rgba(0, 229, 255, 0.2)'
                : lottoType === 'hanoi'
                ? index < 3 ? 'linear-gradient(90deg, #FF007F, #FF0000)' : 'rgba(255, 0, 127, 0.2)'
                : index < 3 ? 'linear-gradient(90deg, var(--gold), #FFA500)' : 'rgba(255, 215, 0, 0.2)';
                
              return (
                <div key={item.digit} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '30px', fontWeight: 'bold', fontSize: '16px', color: index < 3 ? theme.primary : 'inherit' }}>
                    #{item.digit}
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '10px', height: '24px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ 
                      width: `${Math.max(item.probability, 5)}%`, 
                      background: barColor, 
                      height: '100%', 
                      borderRadius: '10px',
                      transition: 'width 1s ease-in-out'
                    }}></div>
                  </div>
                  <div style={{ width: '45px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>
                    {item.probability}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right panel - Extra Analytics & Widgets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Global Accuracy Gauge */}
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            🏆 อัตราแม่นยำย้อนหลังของ AI Super v4
          </h3>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: theme.primary, textShadow: `0 0 20px ${theme.primary}` }}>
            {globalAccuracy}%
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            ประเมินผล 10 งวดล่าสุด คำนวณย้อนหลัง (Backtesting) เช็คผลรางวัลออกจริงเทียบเลขเด่น Top 3
          </p>
        </div>

        {/* Odd/Even Ratio */}
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚖️ อัตราส่วน เลขคู่-คี่
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
            <span style={{ color: '#00E5FF' }}>เลขคี่: {oddEven.odd}%</span>
            <span style={{ color: '#FF007F' }}>เลขคู่: {oddEven.even}%</span>
          </div>
          <div style={{ display: 'flex', height: '16px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ width: `${oddEven.odd}%`, background: '#00E5FF', transition: 'width 1s ease' }}></div>
            <div style={{ width: `${oddEven.even}%`, background: '#FF007F', transition: 'width 1s ease' }}></div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
            สัดส่วนการออกสลับระหว่างเลขคู่และเลขคี่ในรางวัลท้ายของประเภทหวยนี้
          </p>
        </div>

        {/* High/Low Ratio */}
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 อัตราส่วน เลขสูง-ต่ำ (0-4 / 5-9)
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
            <span style={{ color: 'var(--gold)' }}>เลขสูง (5-9): {highLow.high}%</span>
            <span style={{ color: '#A855F7' }}>เลขต่ำ (0-4): {highLow.low}%</span>
          </div>
          <div style={{ display: 'flex', height: '16px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ width: `${highLow.high}%`, background: 'var(--gold)', transition: 'width 1s ease' }}></div>
            <div style={{ width: `${highLow.low}%`, background: '#A855F7', transition: 'width 1s ease' }}></div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
            สัดส่วนการออกระหว่างเลขช่วงสูง (5-9) และเลขช่วงต่ำ (0-4)
          </p>
        </div>
      </div>
    </div>
  );
}
