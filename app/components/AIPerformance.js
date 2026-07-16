'use client';

import React, { useState, useEffect } from 'react';
import { backtestDraw } from '../data/lottoHistory';

export default function AIPerformance({ lottoType = 'thai', lottoData = [] }) {
  const [performanceList, setPerformanceList] = useState([]);
  const [stats, setStats] = useState({ total: 0, fullHits: 0, partialHits: 0, accuracy: 0 });
  const [activeSubFilter, setActiveSubFilter] = useState('all'); // 'all', 'dev'/'normal', 'star'/'special', 'samakkee'/'vip'

  useEffect(() => {
    // Generate validation reports for all draws in lottoData
    const reports = [];
    let totalEvaluated = 0;
    let fullHitsCount = 0;
    let partialHitsCount = 0;
    let sumAccuracy = 0;

    lottoData.forEach((draw, parentIdx) => {
      // Oldest draw cannot be backtested since it has no prior history to predict on
      const isOldest = parentIdx >= lottoData.length - 1;
      if (isOldest) return;

      if (lottoType === 'thai') {
        const backtest = backtestDraw(lottoData, parentIdx);
        reports.push({
          date: draw.date,
          drawName: "หวยรัฐบาลไทย",
          time: "16:00 น.",
          lottoKey: "thai",
          aiDigits: backtest.topDigits,
          actualResult: draw.twoDigitBack,
          accuracy: backtest.accuracy,
          matched: backtest.matched
        });

        totalEvaluated++;
        sumAccuracy += backtest.accuracy;
        if (backtest.accuracy === 100) fullHitsCount++;
        else if (backtest.accuracy === 50) partialHitsCount++;
      } else {
        // Nested sub-draws (Lao / Hanoi)
        const subDrawKeys = lottoType === 'lao' 
          ? [
              { key: 'star', name: 'ลาวสตาร์', time: '15:45 น.' },
              { key: 'development', name: 'หวยลาวพัฒนา', time: '20:30 น.' },
              { key: 'samakkee', name: 'ลาวสามัคคี', time: '21:30 น.' }
            ]
          : [
              { key: 'special', name: 'ฮานอยพิเศษ', time: '17:30 น.' },
              { key: 'normal', name: 'ฮานอยปกติ', time: '18:30 น.' },
              { key: 'vip', name: 'ฮานอย VIP', time: '19:30 น.' }
            ];

        subDrawKeys.forEach(sub => {
          if (!draw[sub.key]) return;
          
          // Extract the flat list of all draws of this key type (across all dates) to run backtest
          const flatSubHistory = lottoData.map(item => item[sub.key]).filter(Boolean);
          
          // Backtest this specific sub-draw
          const backtest = backtestDraw(flatSubHistory, parentIdx);

          reports.push({
            date: draw.date,
            drawName: sub.name,
            time: sub.time,
            lottoKey: sub.key,
            aiDigits: backtest.topDigits,
            actualResult: draw[sub.key].twoDigitBack,
            accuracy: backtest.accuracy,
            matched: backtest.matched
          });

          totalEvaluated++;
          sumAccuracy += backtest.accuracy;
          if (backtest.accuracy === 100) fullHitsCount++;
          else if (backtest.accuracy === 50) partialHitsCount++;
        });
      }
    });

    setPerformanceList(reports);
    setStats({
      total: totalEvaluated,
      fullHits: fullHitsCount,
      partialHits: partialHitsCount,
      accuracy: totalEvaluated > 0 ? Math.round(sumAccuracy / totalEvaluated) : 0
    });
  }, [lottoType, lottoData]);

  // Filter sub-draws based on selected sub-filter
  const filteredReports = performanceList.filter(rep => {
    if (activeSubFilter === 'all') return true;
    if (activeSubFilter === 'primary') {
      return rep.lottoKey === 'development' || rep.lottoKey === 'normal' || rep.lottoKey === 'thai';
    }
    if (activeSubFilter === 'secondary') {
      return rep.lottoKey === 'star' || rep.lottoKey === 'special';
    }
    if (activeSubFilter === 'vip') {
      return rep.lottoKey === 'samakkee' || rep.lottoKey === 'vip';
    }
    return true;
  });

  const getSubFilterButtons = () => {
    if (lottoType === 'thai') return null;
    return (
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: '⚡ ทุกรอบย่อย' },
          { id: 'primary', label: lottoType === 'lao' ? '🟡 หวยลาวพัฒนา (20:30)' : '🟡 ฮานอยปกติ (18:30)' },
          { id: 'secondary', label: lottoType === 'lao' ? '🟠 ลาวสตาร์ (15:45)' : '🟠 ฮานอยพิเศษ (17:30)' },
          { id: 'vip', label: lottoType === 'lao' ? '🟣 ลาวสามัคคี (21:30)' : '🟣 ฮานอย VIP (19:30)' }
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => setActiveSubFilter(btn.id)}
            style={{
              background: activeSubFilter === btn.id ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.01)',
              border: `1px solid ${activeSubFilter === btn.id ? (lottoType === 'lao' ? '#00E5FF' : '#FF007F') : 'var(--border-card)'}`,
              color: '#FFFFFF',
              padding: '6px 14px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.3s ease'
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Performance Summary Dashboard */}
      <div className="glass-card" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        borderLeft: `5px solid ${lottoType === 'lao' ? '#00E5FF' : lottoType === 'hanoi' ? '#FF007F' : 'var(--primary)'}`
      }}>
        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ประสิทธิภาพระบบ AI โดยรวม</span>
          <div className="numbers-font" style={{ fontSize: '42px', fontWeight: 'bold', color: 'var(--success)', textShadow: '0 0 10px rgba(16, 185, 129, 0.2)' }}>
            {stats.accuracy}%
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ตรงเลขเด่น Top 3 สะสม</span>
        </div>

        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>จำนวนรอบสลากที่ตรวจสอบ</span>
          <div className="numbers-font" style={{ fontSize: '42px', fontWeight: 'bold', color: '#FFF' }}>
            {stats.total} <span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>งวด</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ประเมินย้อนหลังจากดาต้าเบส</span>
        </div>

        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ตรงเป้าแบบคู่ 2 ตัว (100% Hit)</span>
          <div className="numbers-font" style={{ fontSize: '42px', fontWeight: 'bold', color: '#10B981' }}>
            {stats.fullHits} <span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>รอบ</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>เลขออกอยู่ใน Top 3 ทั้งสองหลัก</span>
        </div>

        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ตรงหลักสิบ/หน่วย (50% Hit)</span>
          <div className="numbers-font" style={{ fontSize: '42px', fontWeight: 'bold', color: 'var(--gold)' }}>
            {stats.partialHits} <span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>รอบ</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>เลขออกอยู่ใน Top 3 หนึ่งตำแหน่ง</span>
        </div>
      </div>

      {/* Sub-draw filter selectors */}
      {getSubFilterButtons()}

      {/* Accuracy Ledger Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredReports.length > 0 ? (
          filteredReports.map((rep, idx) => {
            const isFullHit = rep.accuracy === 100;
            const isPartialHit = rep.accuracy === 50;
            
            const cardBorder = isFullHit 
              ? '1px solid rgba(16, 185, 129, 0.4)' 
              : isPartialHit 
              ? '1px solid rgba(255, 215, 0, 0.3)' 
              : '1px solid var(--border-card)';
              
            const cardBg = isFullHit 
              ? 'rgba(16, 185, 129, 0.03)' 
              : isPartialHit 
              ? 'rgba(255, 215, 0, 0.02)' 
              : 'rgba(255, 255, 255, 0.01)';

            return (
              <div key={idx} className="glass-card" style={{
                border: cardBorder,
                background: cardBg,
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                transition: 'all 0.3s ease'
              }}>
                {/* Draw Info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#FFF', fontSize: '16px' }}>{rep.date}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>⏰ {rep.time}</span>
                  </div>
                  <div style={{ marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{
                      color: rep.lottoKey === 'development' || rep.lottoKey === 'normal' || rep.lottoKey === 'thai' ? 'var(--gold)' : rep.lottoKey === 'star' || rep.lottoKey === 'special' ? '#FF8C00' : '#FF00FF',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}>
                      • {rep.drawName}
                    </span>
                  </div>
                </div>

                {/* AI Recommendations vs Actual */}
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* AI Recommendations */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>AI วิเคราะห์เด่น Top 3</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {rep.aiDigits.map((digit, dIdx) => (
                        <span key={dIdx} className="numbers-font" style={{
                          background: 'rgba(255,255,255,0.06)',
                          color: '#FFFFFF',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          border: rep.matched.includes(digit) ? `1px solid ${isFullHit ? '#10B981' : 'var(--gold)'}` : '1px solid transparent',
                          boxShadow: rep.matched.includes(digit) ? `0 0 10px ${isFullHit ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 215, 0, 0.2)'}` : 'none'
                        }}>
                          {digit}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* VS symbol */}
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 'bold' }}>VS</div>

                  {/* Actual Winning digits */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>เลขท้ายที่ออกจริง</div>
                    <span className={`number-ball ${
                      isFullHit ? 'cyan-ball' : isPartialHit ? 'gold-ball' : 'cyan-ball'
                    }`} style={{ 
                      width: '38px', 
                      height: '38px', 
                      fontSize: '16px', 
                      margin: 0,
                      color: isPartialHit ? '#000' : '#FFF',
                      background: isFullHit ? 'radial-gradient(circle at 30% 30%, #E8F5E9 0%, #10B981 40%, #064E3B 100%)' : undefined
                    }}>
                      {rep.actualResult}
                    </span>
                  </div>
                </div>

                {/* Validation outcome report */}
                <div style={{ minWidth: '150px', textAlign: 'right' }}>
                  {isFullHit ? (
                    <div style={{ color: '#10B981', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '16px' }}>🎯 ตรงเต็ม 2 ตัว</span>
                      <span className="numbers-font" style={{ fontSize: '12px' }}>แม่นยำ 100%</span>
                    </div>
                  ) : isPartialHit ? (
                    <div style={{ color: 'var(--gold)', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '16px' }}>⭐ ตรง 1 ตัว</span>
                      <span className="numbers-font" style={{ fontSize: '12px' }}>แม่นยำ 50%</span>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '15px' }}>✕ ไม่ตรง</span>
                      <span className="numbers-font" style={{ fontSize: '12px' }}>แม่นยำ 0%</span>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        ) : (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            🔍 ไม่พบข้อมูลสลากเพื่อเปรียบเทียบความตรงกันของรอบนี้
          </div>
        )}
      </div>

    </div>
  );
}
