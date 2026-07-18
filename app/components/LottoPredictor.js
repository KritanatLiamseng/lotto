'use client';

import React, { useState, useEffect } from 'react';
import { getPredictionStats, getOddEvenRatio, getHighLowRatio, getDigitStats, getGlobalAccuracy } from '../data/lottoHistory';

export default function LottoPredictor({ lottoType = 'thai', lottoData = [] }) {
  const [predictions, setPredictions] = useState([]);
  const [oddEven, setOddEven] = useState({ odd: 50, even: 50 });
  const [highLow, setHighLow] = useState({ high: 50, low: 50 });
  const [digitStats, setDigitStats] = useState([]);
  const [globalAccuracy, setGlobalAccuracy] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Load stats dynamically using the passed prop data
    setPredictions(getPredictionStats(lottoData));
    setOddEven(getOddEvenRatio(lottoData));
    setHighLow(getHighLowRatio(lottoData));
    setDigitStats(getDigitStats(lottoData).sort((a, b) => b.count - a.count));
    setGlobalAccuracy(getGlobalAccuracy(lottoData));
    setLoading(false);
  }, [lottoData, lottoType]);

  if (loading) {
    return (
      <div style={{ color: 'var(--primary)', textAlign: 'center', padding: '50px' }}>
        กำลังประมวลผลระบบสถิติ AI ของ {lottoType === 'lao' ? 'หวยลาวพัฒนา' : lottoType === 'hanoi' ? 'หวยฮานอย' : 'หวยไทย'}...
      </div>
    );
  }

  // Theme configuration based on active lottery type
  const getThemeColors = () => {
    switch (lottoType) {
      case 'lao':
        return {
          primary: '#00E5FF',
          accentBall: 'cyan-ball',
          accentText: '#00B0FF',
          borderLeft: '5px solid #00E5FF',
          explanation: 'วิเคราะห์สถิติหวยลาวพัฒนา (ออกรางวัลวันจันทร์ - ศุกร์ เวลา 20:30 น.)'
        };
      case 'hanoi':
        return {
          primary: '#FF007F',
          accentBall: 'magenta-ball',
          accentText: '#FF3366',
          borderLeft: '5px solid #FF007F',
          explanation: 'วิเคราะห์สถิติหวยฮานอยปกติ (ออกรางวัลทุกวัน เวลา 18:30 น.)'
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
  const topDigits = predictions.slice(0, 3).map(p => p.digit);
  const recommendedTwoDigits = [
    `${topDigits[0]}${topDigits[1]}`,
    `${topDigits[0]}${topDigits[2]}`,
    `${topDigits[1]}${topDigits[2]}`,
    `${topDigits[0]}${predictions[3]?.digit || '9'}`
  ];
  
  const recommendedThreeDigits = [
    `${topDigits[0]}${topDigits[1]}${topDigits[2]}`,
    `9${topDigits[0]}${topDigits[1]}`,
    `5${topDigits[0]}${topDigits[2]}`
  ];

  return (
    <div className="dashboard-grid">
      {/* Left panel - Main predictions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Probability recommendations card */}
        <div className="glass-card" style={{ borderLeft: theme.borderLeft }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: theme.primary }}>★</span> เลขเด่นแนะนำงวดถัดไป
          </h2>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', margin: '24px 0', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>เลขเด่นวิ่งรูด (วิ่ง บน-ล่าง)</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span className={`number-ball ${theme.accentBall}`} style={{ width: '60px', height: '60px', fontSize: '26px' }}>{topDigits[0]}</span>
                <span className="number-ball magenta-ball" style={{ width: '60px', height: '60px', fontSize: '26px', background: lottoType === 'hanoi' ? 'radial-gradient(circle at 30% 30%, #FFF5CC 0%, var(--gold) 40%, #B8860B 100%)' : undefined, color: lottoType === 'hanoi' ? '#000' : undefined }}>{topDigits[1]}</span>
              </div>
            </div>
            
            <div style={{ flex: 2, minWidth: '250px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>เจาะเลขท้าย 2 ตัวแนะนำ</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {recommendedTwoDigits.map((num, i) => (
                  <span key={i} className="number-ball cyan-ball" style={{ width: '50px', height: '50px', fontSize: '18px', margin: 0, background: lottoType === 'lao' ? 'radial-gradient(circle at 30% 30%, #F5D0FF 0%, var(--primary) 40%, #7A00B0 100%)' : undefined, color: lottoType === 'lao' ? '#FFF' : undefined }}>
                    {num}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>ชุดเลขท้าย 3 ตัวเต็ง-โต๊ด</div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {recommendedThreeDigits.map((num, i) => (
                <span key={i} className={`number-ball ${theme.accentBall}`} style={{ borderRadius: '12px', width: '70px', height: '46px', fontSize: '18px', margin: 0 }}>
                  {num}
                </span>
              ))}
            </div>
          </div>

          {lottoType === 'lao' && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>ชุดเลขท้าย 4 ตัวพัฒนาแนะนำ</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span className="numbers-font" style={{ background: 'rgba(0,229,255,0.1)', border: '1px dashed #00E5FF', color: '#00E5FF', padding: '8px 16px', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>
                  {topDigits[0]}{topDigits[1]}{topDigits[2]}{predictions[3]?.digit || '9'}
                </span>
              </div>
            </div>
          )}

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', borderLeft: `3px solid ${theme.primary}` }}>
            ⚠️ <strong>หมายเหตุระบบทำนาย:</strong> คำนวณแบบถ่วงน้ำหนักสถิติความถี่การออกเลข (Frequency Weight 60%) และเวลาที่ตัวเลขนั้นไม่ได้ออกย้อนหลัง (Due Weight 40%) {theme.explanation}
          </div>
        </div>

        {/* Probability Bars Chart */}
        <div className="glass-card">
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>
            📊 เปอร์เซ็นต์ความน่าจะเป็นของเลขเด่น (0 - 9)
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {predictions.map((item, index) => {
              const barColor = lottoType === 'lao' 
                ? `hsl(${180 - (index * 6)}, 100%, 45%)` 
                : lottoType === 'hanoi' 
                ? `hsl(${340 - (index * 8)}, 100%, 50%)`
                : `hsl(${45 + (index * 15)}, 100%, 50%)`;
              return (
                <div key={item.digit} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="numbers-font" style={{ fontSize: '20px', fontWeight: 'bold', width: '20px', textAlign: 'center' }}>
                    {item.digit}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {item.lastSeen === 0 ? 'ออกในงวดล่าสุด' : `ยังไม่ออกมา ${item.lastSeen} งวด`}
                      </span>
                      <span className="numbers-font" style={{ fontWeight: 'bold', color: barColor }}>
                        {item.probability}%
                      </span>
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${item.probability * 4.5}%`,
                          maxWidth: '100%',
                          background: `linear-gradient(90deg, var(--bg-card), ${barColor})`
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right panel - Side stats widgets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* AI Accuracy Backtest Widget */}
        <div className="glass-card" style={{
          border: '1px solid rgba(16, 185, 129, 0.3)',
          background: 'rgba(16, 185, 129, 0.03)',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.05)'
        }}>
          <h3 style={{ fontSize: '18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏆 อัตราแม่นยำย้อนหลังของ AI
          </h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span className="numbers-font" style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--success)', textShadow: '0 0 15px rgba(16, 185, 129, 0.3)' }}>
              {globalAccuracy}%
            </span>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>ประเมินผล 10 งวดล่าสุด</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
            คำนวณย้อนกลับ (Backtesting) เพื่อเช็คว่าตัวเลขรางวัลที่ออกจริง ตรงกับที่ระบบทำนายเป็นเลขเด่น Top 3 หรือไม่
          </p>
        </div>

        {/* Odd vs Even widget */}
        <div className="glass-card">
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>⚖️ อัตราส่วน เลขคู่-คี่</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: lottoType === 'hanoi' ? '#FF007F' : '#BD00FF', fontWeight: 'bold' }}>เลขคี่: {oddEven.odd}%</span>
            <span style={{ color: lottoType === 'lao' ? '#00E5FF' : '#00F0FF', fontWeight: 'bold' }}>เลขคู่: {oddEven.even}%</span>
          </div>

          <div style={{ height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${oddEven.odd}%`, background: lottoType === 'lao' ? '#0077FF' : lottoType === 'hanoi' ? 'linear-gradient(135deg, #FF007F 0%, #FF0000 100%)' : 'linear-gradient(135deg, var(--primary) 0%, #D000FF 100%)' }} />
            <div style={{ width: `${oddEven.even}%`, background: lottoType === 'lao' ? 'linear-gradient(135deg, #00E5FF 0%, #00FFBB 100%)' : 'linear-gradient(135deg, var(--secondary) 0%, #009DFF 100%)' }} />
          </div>
          
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: '1.4' }}>
            สัดส่วนการออกสลับระหว่างเลขคู่และเลขคี่ในรางวัลเลขท้ายของประเภทหวยนี้
          </p>
        </div>

        {/* High vs Low widget */}
        <div className="glass-card">
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>📈 อัตราส่วน เลขสูง-ต่ำ</h3>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>เลขต่ำ (0-4) vs เลขสูง (5-9)</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#10B981', fontWeight: 'bold' }}>เลขต่ำ: {highLow.low}%</span>
            <span style={{ color: theme.accentText, fontWeight: 'bold' }}>เลขสูง: {highLow.high}%</span>
          </div>

          <div style={{ height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${highLow.low}%`, background: 'var(--success)' }} />
            <div style={{ width: `${highLow.high}%`, background: theme.primary }} />
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: '1.4' }}>
            เปรียบเทียบระหว่างเลขกลุ่มน้อยกว่า 5 และ กลุ่มมากกว่าหรือเท่ากับ 5 ในรางวัลเลขท้าย
          </p>
        </div>

        {/* Historic digit occurrences table */}
        <div className="glass-card">
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>🏆 ลำดับเลขออกบ่อยที่สุด</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {digitStats.slice(0, 5).map((stat, idx) => (
              <div key={stat.digit} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>#{idx+1}</span>
                  <span className={`number-ball ${lottoType === 'lao' ? 'cyan-ball' : lottoType === 'hanoi' ? 'magenta-ball' : 'gold-ball'}`} style={{ width: '28px', height: '28px', fontSize: '13px', margin: 0, color: lottoType === 'thai' ? '#000' : '#FFF' }}>{stat.digit}</span>
                </div>
                <div className="numbers-font" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  ออกทั้งหมด <span style={{ color: theme.primary }}>{stat.count}</span> ครั้ง
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
