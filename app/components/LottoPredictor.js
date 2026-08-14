'use client';

import React, { useState } from 'react';
import { 
  getPredictionStats, 
  getOddEvenRatio, 
  getHighLowRatio, 
  getDigitStats, 
  getGlobalAccuracy,
  getTwinConsecutiveStats,
  getPeriodicityStats
} from '../data/lottoHistory';

export default function LottoPredictor({ lottoType = 'thai', lottoData = [] }) {
  const [tuningMode, setTuningMode] = useState('auto'); // 'auto', 'balanced', 'recency', 'markov', 'custom'
  const [customWeights, setCustomWeights] = useState({
    wRec: 0.12, wCo: 0.10, wOvd: 0.05, wMrk: 0.08, wMrk2: 0.06, 
    wPos: 0.06, wAr: 0.05, wMod: 0.05, wBay: 0.08, wFib: 0.04, 
    wMom: 0.06, wBen: 0.06, wEnt: 0.08, wFou: 0.08, wArm: 0.08 
  });
  const [activeCategory, setActiveCategory] = useState('gaps'); // 'gaps', 'markov', 'series', 'signal', 'math'

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optProgress, setOptProgress] = useState(0);
  const [optTrigger, setOptTrigger] = useState(0);

  // Synchronous calculations via useMemo
  const predictions = React.useMemo(() => {
    return getPredictionStats(lottoData, tuningMode, customWeights);
  }, [lottoData, tuningMode, customWeights, optTrigger]);

  const activeWeights = predictions.activeWeights || {
    wRec: 0.12, wCo: 0.10, wOvd: 0.05, wMrk: 0.08, wMrk2: 0.06, 
    wPos: 0.06, wAr: 0.05, wMod: 0.05, wBay: 0.08, wFib: 0.04, 
    wMom: 0.06, wBen: 0.06, wEnt: 0.08, wFou: 0.08, wArm: 0.08
  };

  const oddEven = React.useMemo(() => getOddEvenRatio(lottoData), [lottoData]);
  const highLow = React.useMemo(() => getHighLowRatio(lottoData), [lottoData]);
  const twinConsecutive = React.useMemo(() => getTwinConsecutiveStats(lottoData), [lottoData]);
  const periodicity = React.useMemo(() => getPeriodicityStats(lottoData).slice(0, 5), [lottoData]);
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
    `${topDigits[0]}${topDigits[2]}`
  ];
  
  const recommendedThreeDigits = [
    `${topDigits[0]}${topDigits[1]}${topDigits[2]}`,
    `${topDigits[3]}${topDigits[0]}${topDigits[1]}`
  ];

  const handleCopyNumbers = () => {
    const textToCopy = `🔮 [LottoOracle AI] เลขเด็ดวิเคราะห์งวดถัดไป (${lottoType === 'lao' ? 'หวยลาว' : lottoType === 'hanoi' ? 'หวยฮานอย' : 'หวยไทย'})
• วิ่ง/รูด: ${topDigits[0]}, ${topDigits[1]}
• เจาะ 2 ตัว: ${recommendedTwoDigits.join(', ')}
• ชุด 3 ตัว: ${recommendedThreeDigits.join(', ')}
${lottoType === 'lao' ? `• ชุด 4 ตัว: ${topDigits[0]}${topDigits[1]}${topDigits[2]}${predictions[3]?.digit || '9'}` : ''}
⚡ ประมวลผลและปรับแต่งด้วย AI Super v10 Genetic Optimizer (15-Layer Ensemble)`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    });
  };

  const handleOptimize = () => {
    setIsOptimizing(true);
    setOptProgress(0);
    const interval = setInterval(() => {
      setOptProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsOptimizing(false);
            setOptTrigger(t => t + 1);
          }, 400);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleWeightChange = (key, val) => {
    const numericVal = parseFloat(val);
    setCustomWeights(prev => {
      const updated = { ...prev, [key]: numericVal };
      const sum = Object.values(updated).reduce((a, b) => a + b, 0);
      // Normalize sum to 1
      const normalized = {};
      Object.keys(updated).forEach(k => {
        normalized[k] = parseFloat((updated[k] / (sum || 1)).toFixed(3));
      });
      return normalized;
    });
  };

  return (
    <div className="dashboard-grid">
      {/* Left panel - Main predictions & Tuning */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Probability recommendations card */}
        <div className="glass-card" style={{ borderLeft: theme.borderLeft }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: theme.primary }}>🔮</span> เลขเด่นแนะนำงวดถัดไป
            </h2>
            {lottoData && lottoData.length > 0 && (
              <span style={{ fontSize: '12px', color: theme.primary, background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
                ⚡ สถิติล่าสุดที่ประมวลผล: {lottoData[0]?.date}
              </span>
            )}
          </div>

          {/* Quick 1-Tap Copy Button */}
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
        </div>

        {/* AI AUTO-TUNING & WEIGHTS DASHBOARD */}
        <div className="glass-card" style={{ borderLeft: `5px solid #A855F7` }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#A855F7' }}>⚙️</span> แผงปรับจูนค่าน้ำหนักโมเดล AI Super v6
          </h2>

          {/* Mode Selector */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {[
              { id: 'auto', label: '🤖 Auto-Optimizer', icon: '⚡' },
              { id: 'balanced', label: '⚖️ Balanced', icon: '🤝' },
              { id: 'recency', label: '📅 Recency Heavy', icon: '⏱️' },
              { id: 'markov', label: '🔗 Markov Heavy', icon: '🔗' },
              { id: 'custom', label: '🎛️ Custom Sliders', icon: '🎛️' }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setTuningMode(mode.id)}
                style={{
                  background: tuningMode === mode.id ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${tuningMode === mode.id ? '#A855F7' : 'var(--border-card)'}`,
                  color: '#FFFFFF',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: tuningMode === mode.id ? '600' : '400',
                  transition: 'all 0.2s ease'
                }}
              >
                {mode.icon} {mode.label}
              </button>
            ))}
          </div>

          {/* Training / Auto Optimization Trigger Button */}
          {tuningMode === 'auto' && (
            <div style={{ marginBottom: '24px' }}>
              <button
                onClick={handleOptimize}
                disabled={isOptimizing}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isOptimizing ? '#4B5563' : 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                  cursor: isOptimizing ? 'default' : 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(168, 85, 247, 0.2)'
                }}
              >
                {isOptimizing ? '⚙️ กำลังประมวลผล Auto-Optimization...' : '🚀 รันโมเดลค้นหาค่าน้ำหนักที่ดีที่สุด (Run AI Optimization)'}
              </button>
              
              {isOptimizing && (
                <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${optProgress}%`, height: '100%', background: '#A855F7', transition: 'width 0.1s ease' }}></div>
                </div>
              )}
            </div>
          )}

          {/* Active Weights visualization */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              📊 ค่าน้ำหนักถ่วงสถิติที่ใช้งานอยู่ในปัจจุบัน (สัดส่วนรวม = 100%):
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
              {[
                { label: 'Recency (ล่าสุด)', value: activeWeights.wRec, color: '#FF5722' },
                { label: 'Co-Occurrence (คู่)', value: activeWeights.wCo, color: '#4CAF50' },
                { label: 'Overdue (ไม่มานาน)', value: activeWeights.wOvd, color: '#FFEB3B' },
                { label: 'Markov 1st (ย้อน 1)', value: activeWeights.wMrk, color: '#00BCD4' },
                { label: 'Markov 2nd (ย้อน 2)', value: activeWeights.wMrk2 || 0, color: '#009688' },
                { label: 'Positional (ตำแหน่ง)', value: activeWeights.wPos, color: '#9C27B0' },
                { label: 'Arithmetic (ผลรวม)', value: activeWeights.wAr, color: '#E91E63' },
                { label: 'Modulo (เศษห่าง)', value: activeWeights.wMod, color: '#3F51B5' },
                { label: 'Bayesian (เงื่อนไข)', value: activeWeights.wBay || 0, color: '#2196F3' },
                { label: 'Fibonacci (ฟีโบ)', value: activeWeights.wFib || 0, color: '#FF9800' },
                { label: 'Momentum (สั้น/ยาว)', value: activeWeights.wMom || 0, color: '#795548' },
                { label: 'Benford (เฉลี่ย)', value: activeWeights.wBen || 0, color: '#607D8B' },
                { label: 'Entropy (Shannon)', value: activeWeights.wEnt || 0, color: '#E040FB' },
                { label: 'Fourier (คาบไซน์)', value: activeWeights.wFou || 0, color: '#E040FB' },
                { label: 'AR(2) Autoreg', value: activeWeights.wArm || 0, color: '#00E676' }
              ].map((item, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }}></div>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF' }}>{Math.round((item.value || 0) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Sliders for manual tuning */}
          {tuningMode === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--border-card)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '13px', color: '#FFF', margin: '0 0 12px 0' }}>🎛️ ปรับแต่งแถบสไลเดอร์ค่าน้ำหนักสถิติแยกตามกลุ่มวิเคราะห์:</h4>
              
              {/* Category tabs */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '8px' }}>
                {[
                  { id: 'gaps', label: '⏳ รอบออก/ดึงดูด' },
                  { id: 'markov', label: '🔗 ความน่าจะเป็นต่อเนื่อง' },
                  { id: 'series', label: '📈 เทรนด์/อนุกรมเวลา' },
                  { id: 'signal', label: '🌀 สัญญาณคลื่น/ความโกลาหล' },
                  { id: 'math', label: '📐 มิติโครงสร้างเลข' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    style={{
                      background: activeCategory === tab.id ? 'var(--gold)' : 'rgba(255,255,255,0.03)',
                      color: activeCategory === tab.id ? '#000' : 'var(--text-muted)',
                      border: activeCategory === tab.id ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sliders for active category */}
              {[
                { 
                  cat: 'gaps',
                  sliders: [
                    { key: 'wRec', label: 'Recency (สถิติงวดล่าสุด)', val: customWeights.wRec },
                    { key: 'wCo', label: 'Co-Occurrence (เลขคู่เด่นมาคู่กัน)', val: customWeights.wCo },
                    { key: 'wOvd', label: 'Overdue (เลขค้างนานสุด)', val: customWeights.wOvd },
                    { key: 'wFib', label: 'Fibonacci Resonance (ความถี่วัฏจักรฟีโบนัชชี)', val: customWeights.wFib || 0 }
                  ]
                },
                {
                  cat: 'markov',
                  sliders: [
                    { key: 'wMrk', label: 'Markov 1st (ความเชื่อมโยงย้อนหลัง 1 งวด)', val: customWeights.wMrk },
                    { key: 'wMrk2', label: 'Markov 2nd (ความเชื่อมโยงย้อนหลัง 2 งวด)', val: customWeights.wMrk2 || 0 },
                    { key: 'wBay', label: 'Bayesian Conditional (ความน่าจะเป็นตามเงื่อนไข)', val: customWeights.wBay || 0 }
                  ]
                },
                {
                  cat: 'series',
                  sliders: [
                    { key: 'wMom', label: 'Momentum MACD (แนวโน้มโมเมนตัมระยะสั้น-ยาว)', val: customWeights.wMom || 0 },
                    { key: 'wArm', label: 'AR(2) Autoregressive (พยากรณ์อนุกรมเวลา)', val: customWeights.wArm || 0 }
                  ]
                },
                {
                  cat: 'signal',
                  sliders: [
                    { key: 'wEnt', label: 'Shannon Entropy (ความไม่เป็นระเบียบของการเว้นวรรค)', val: customWeights.wEnt || 0 },
                    { key: 'wFou', label: 'Fourier Spectral Density (คลื่นความถี่ฟูริเยร์)', val: customWeights.wFou || 0 },
                    { key: 'wBen', label: 'Benford Skewness (ความเบี่ยงเบนความถี่ตัวเลข)', val: customWeights.wBen || 0 }
                  ]
                },
                {
                  cat: 'math',
                  sliders: [
                    { key: 'wPos', label: 'Positional Tens/Ones (ความถี่ตำแหน่งหลักสิบ/หน่วย)', val: customWeights.wPos },
                    { key: 'wAr', label: 'Arithmetic Digit-Sum (ความถี่ผลรวมผลต่าง)', val: customWeights.wAr },
                    { key: 'wMod', label: 'Modulo Class Periodicity (คาบเศษเลข)', val: customWeights.wMod }
                  ]
                }
              ].find(group => group.cat === activeCategory)?.sliders.map(slider => (
                <div key={slider.key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 2, fontSize: '11px', color: 'var(--text-muted)' }}>{slider.label}</div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={slider.val || 0}
                    onChange={(e) => handleWeightChange(slider.key, e.target.value)}
                    style={{ flex: 3, accentColor: 'var(--gold)', height: '4px', background: 'rgba(255,255,255,0.1)' }}
                  />
                  <div style={{ flex: 1, fontSize: '12px', fontWeight: 'bold', textAlign: 'right', color: 'var(--gold)' }}>
                    {Math.round((slider.val || 0) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Probability Bars Chart */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', margin: 0 }}>
              📊 กราฟวิเคราะห์พลังความน่าจะเป็น AI Super v10 (0 - 9)
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
            🏆 อัตราแม่นยำย้อนหลังของ AI Super v6
          </h3>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: theme.primary, textShadow: `0 0 20px ${theme.primary}` }}>
            {globalAccuracy}%
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            ประเมินผล 10 งวดล่าสุด คำนวณย้อนหลัง (Backtesting) เช็คผลรางวัลออกจริงเทียบเลขเด่น Top 3
          </p>
        </div>

        {/* NEW LAYER: TWINS & CONSECUTIVE ANALYSIS */}
        <div className="glass-card" style={{ borderLeft: `5px solid #10B981` }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎯 ผลสถิติเลขเบิ้ล & เลขติดกันย้อนหลัง
          </h3>
          
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>โอกาสเกิดเลขเบิ้ล (เช่น 22, 55):</span>
              <span style={{ fontWeight: 'bold', color: '#10B981' }}>{twinConsecutive.twinProb}%</span>
            </div>
            <div style={{ fontSize: '12px', color: '#FFF', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
              📢 {twinConsecutive.twinAdvice}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>โอกาสเกิดเลขติดกัน (เช่น 45, 78):</span>
              <span style={{ fontWeight: 'bold', color: '#10B981' }}>{twinConsecutive.consecutiveProb}%</span>
            </div>
            <div style={{ fontSize: '12px', color: '#FFF', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
              📢 {twinConsecutive.consecutiveAdvice}
            </div>
          </div>
        </div>

        {/* NEW LAYER: PERIODICITY CYCLE MATRIX */}
        <div className="glass-card" style={{ borderLeft: `5px solid #FFA500` }}>
          <h3 style={{ fontSize: '16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⏳ ดัชนีรอบวัฏจักรตัวเลข (เลขตามรอบเด่น)
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
            วิเคราะห์รอบสถิติการออกซ้ำ เพื่อดูว่าตัวเลขไหนมีความต้องการเข้าสู่วัฏจักรรอบความถี่ของตัวเองสูงสุด
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {periodicity.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="numbers-font" style={{ background: theme.primary, color: '#000', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                    {item.digit}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', color: '#FFF', fontWeight: '500' }}>{item.status}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      ไม่ได้ออกมาแล้ว {item.lastSeen} งวด (รอบซ้ำปกติทุก {item.avgInterval} งวด)
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>ดัชนีค้าง</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: item.dueScore > 1.2 ? '#FF4500' : '#10B981' }}>
                    x{item.dueScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Odd/Even Ratio */}
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚖️ อัตราส่วน เลขคู่-คี่
          </h3>
          <div style={{ display: 'flex', justifyItems: 'space-between', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
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
          <div style={{ display: 'flex', justifyItems: 'space-between', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
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
