'use client';

import React, { useState, useEffect } from 'react';
import { getPredictionStats } from '../data/lottoHistory';

export default function AIPerformance({ lottoType = 'thai', lottoData = [], activeSubLotto = 'default' }) {
  const [digitMode, setDigitMode] = useState('2digit'); // '2digit', '3digit'
  const [performanceList, setPerformanceList] = useState([]);
  const [stats, setStats] = useState({ total: 0, fullHits: 0, partialHits: 0, accuracy: 0 });
  const [activeSubFilter, setActiveSubFilter] = useState('all');

  // Synchronize local sub-filter with the globally selected sub-lotto round
  useEffect(() => {
    if (activeSubLotto === 'development' || activeSubLotto === 'normal' || activeSubLotto === 'thai') {
      setActiveSubFilter('primary');
    } else if (activeSubLotto === 'star' || activeSubLotto === 'special') {
      setActiveSubFilter('secondary');
    } else if (activeSubLotto === 'samakkee' || activeSubLotto === 'vip') {
      setActiveSubFilter('vip');
    } else {
      setActiveSubFilter('all');
    }
  }, [activeSubLotto, lottoType]);

  useEffect(() => {
    const reports = [];
    let totalEvaluated = 0;
    let fullHitsCount = 0;
    let partialHitsCount = 0;
    let sumAccuracy = 0;

    lottoData.forEach((draw, parentIdx) => {
      // Oldest draw cannot be backtested since it has no prior history to predict on
      const isOldest = parentIdx >= lottoData.length - 1;
      if (isOldest) return;

      const pastData = lottoData.slice(parentIdx + 1);
      const predictions = getPredictionStats(pastData);
      const topDigits = predictions.slice(0, 3).map(p => p.digit);

      // Helper to generate 2-digit recommendations
      const getTwoDigitRecs = (top, preds) => {
        const nextDigit = preds[3]?.digit !== undefined ? preds[3].digit : '9';
        return [
          `${top[0]}${top[1]}`,
          `${top[0]}${top[2]}`,
          `${top[1]}${top[2]}`,
          `${top[0]}${nextDigit}`
        ];
      };

      // Helper to generate 3-digit recommendations
      const getThreeDigitRecs = (top) => {
        return [
          `${top[0]}${top[1]}${top[2]}`,
          `9${top[0]}${top[1]}`,
          `5${top[0]}${top[2]}`
        ];
      };

      if (digitMode === '2digit') {
        // --- 2 DIGIT BACKTEST ---
        if (lottoType === 'thai') {
          const recs = getTwoDigitRecs(topDigits, predictions);
          const actual = draw.twoDigitBack;
          if (!actual || actual.length !== 2) return;
          
          const reversedActual = actual.split("").reverse().join("");

          const isDirectHit = recs.includes(actual);
          const isReversedHit = recs.includes(reversedActual);
          const isExactHit = isDirectHit || isReversedHit;

          const actD1 = parseInt(actual[0]);
          const actD2 = parseInt(actual[1]);
          const matchedDigits = [];
          if (topDigits.includes(actD1)) matchedDigits.push(actD1);
          if (topDigits.includes(actD2) && actD1 !== actD2) matchedDigits.push(actD2);

          let accuracy = 0;
          if (isExactHit) accuracy = 100;
          else if (matchedDigits.length === 2) accuracy = 75;
          else if (matchedDigits.length === 1) accuracy = 50;

          // Full details template
          const fullDetails = `รางวัลที่ 1: ${draw.firstPrize} | เลขท้าย 2 ตัว: ${draw.twoDigitBack} | เลขหน้า 3 ตัว: ${draw.threeDigitFront?.join(', ') || 'ไม่มี'} | เลขท้าย 3 ตัว: ${draw.threeDigitBack?.join(', ') || 'ไม่มี'}`;

          reports.push({
            date: draw.date,
            drawName: "หวยรัฐบาลไทย",
            time: "16:00 น.",
            lottoKey: "thai",
            aiDigits: topDigits,
            aiRecSets: recs,
            actualResult: actual,
            accuracy,
            matchedDigits,
            exactHit: isExactHit,
            hitType: isDirectHit ? 'direct' : isReversedHit ? 'reversed' : 'none',
            fullDetails
          });

          totalEvaluated++;
          sumAccuracy += accuracy;
          if (isExactHit || accuracy === 75) fullHitsCount++;
          else if (accuracy === 50) partialHitsCount++;
        } else {
          // Nested draws (Lao / Hanoi)
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
            const flatSubHistory = lottoData.map(item => item[sub.key]).filter(Boolean);
            const subPastData = flatSubHistory.slice(parentIdx + 1);
            const subPredictions = getPredictionStats(subPastData);
            const subTopDigits = subPredictions.slice(0, 3).map(p => p.digit);
            const recs = getTwoDigitRecs(subTopDigits, subPredictions);

            const actual = draw[sub.key].twoDigitBack;
            if (!actual || actual.length !== 2) return;
            const reversedActual = actual.split("").reverse().join("");

            const isDirectHit = recs.includes(actual);
            const isReversedHit = recs.includes(reversedActual);
            const isExactHit = isDirectHit || isReversedHit;

            const actD1 = parseInt(actual[0]);
            const actD2 = parseInt(actual[1]);
            const matchedDigits = [];
            if (subTopDigits.includes(actD1)) matchedDigits.push(actD1);
            if (subTopDigits.includes(actD2) && actD1 !== actD2) matchedDigits.push(actD2);

            let accuracy = 0;
            if (isExactHit) accuracy = 100;
            else if (matchedDigits.length === 2) accuracy = 75;
            else if (matchedDigits.length === 1) accuracy = 50;

            const fullDetails = `ผลรางวัลเต็ม: ${draw[sub.key].firstPrize} | เลขท้าย 3 ตัว: ${draw[sub.key].threeDigitBack} | เลขท้าย 2 ตัว: ${draw[sub.key].twoDigitBack}`;

            reports.push({
              date: draw.date,
              drawName: sub.name,
              time: sub.time,
              lottoKey: sub.key,
              aiDigits: subTopDigits,
              aiRecSets: recs,
              actualResult: actual,
              accuracy,
              matchedDigits,
              exactHit: isExactHit,
              hitType: isDirectHit ? 'direct' : isReversedHit ? 'reversed' : 'none',
              fullDetails
            });

            totalEvaluated++;
            sumAccuracy += accuracy;
            if (isExactHit || accuracy === 75) fullHitsCount++;
            else if (accuracy === 50) partialHitsCount++;
          });
        }
      } else {
        // --- 3 DIGIT BACKTEST ---
        if (lottoType === 'thai') {
          const recs = getThreeDigitRecs(topDigits);
          const actualBacks = draw.threeDigitBack || [];
          
          if (actualBacks.length === 0) return;

          let bestAccuracy = 0;
          let bestMatchedDigits = [];
          let exactHitMatch = false;
          let displayWinningNum = actualBacks[0];

          actualBacks.forEach(actStr => {
            if (actStr.length !== 3) return;
            
            const isExact = recs.includes(actStr);
            const actNums = actStr.split("").map(Number);
            const currentMatched = [];
            actNums.forEach(digit => {
              if (topDigits.includes(digit) && !currentMatched.includes(digit)) {
                currentMatched.push(digit);
              }
            });

            const currentAcc = Math.round((currentMatched.length / 3) * 100);
            if (currentAcc > bestAccuracy || (currentAcc === bestAccuracy && isExact)) {
              bestAccuracy = currentAcc;
              bestMatchedDigits = currentMatched;
              exactHitMatch = isExact;
              displayWinningNum = actStr;
            }
          });

          const fullDetails = `รางวัลที่ 1: ${draw.firstPrize} | เลขท้าย 2 ตัว: ${draw.twoDigitBack} | เลขหน้า 3 ตัว: ${draw.threeDigitFront?.join(', ') || 'ไม่มี'} | เลขท้าย 3 ตัว: ${draw.threeDigitBack?.join(', ') || 'ไม่มี'}`;

          reports.push({
            date: draw.date,
            drawName: "หวยรัฐบาลไทย",
            time: "16:00 น.",
            lottoKey: "thai",
            aiDigits: topDigits,
            aiRecSets: recs,
            actualResult: displayWinningNum,
            accuracy: bestAccuracy,
            matchedDigits: bestMatchedDigits,
            exactHit: exactHitMatch,
            fullDetails
          });

          totalEvaluated++;
          sumAccuracy += bestAccuracy;
          if (bestAccuracy >= 66) fullHitsCount++;
          else if (bestAccuracy >= 33) partialHitsCount++;
        } else {
          // Nested draws (Lao / Hanoi)
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
            const flatSubHistory = lottoData.map(item => item[sub.key]).filter(Boolean);
            const subPastData = flatSubHistory.slice(parentIdx + 1);
            const subPredictions = getPredictionStats(subPastData);
            const subTopDigits = subPredictions.slice(0, 3).map(p => p.digit);
            const recs = getThreeDigitRecs(subTopDigits);

            const actual = draw[sub.key].threeDigitBack;
            if (!actual || actual.length !== 3) return;

            const isExact = recs.includes(actual);
            const actNums = actual.split("").map(Number);
            const matched = [];
            actNums.forEach(digit => {
              if (subTopDigits.includes(digit) && !matched.includes(digit)) {
                matched.push(digit);
              }
            });

            const accuracy = Math.round((matched.length / 3) * 100);

            const fullDetails = `ผลรางวัลเต็ม: ${draw[sub.key].firstPrize} | เลขท้าย 3 ตัว: ${draw[sub.key].threeDigitBack} | เลขท้าย 2 ตัว: ${draw[sub.key].twoDigitBack}`;

            reports.push({
              date: draw.date,
              drawName: sub.name,
              time: sub.time,
              lottoKey: sub.key,
              aiDigits: subTopDigits,
              aiRecSets: recs,
              actualResult: actual,
              accuracy,
              matchedDigits: matched,
              exactHit: isExact,
              fullDetails
            });

            totalEvaluated++;
            sumAccuracy += accuracy;
            if (accuracy >= 66) fullHitsCount++;
            else if (accuracy >= 33) partialHitsCount++;
          });
        }
      }
    });

    setPerformanceList(reports);
    setStats({
      total: totalEvaluated,
      fullHits: fullHitsCount,
      partialHits: partialHitsCount,
      accuracy: totalEvaluated > 0 ? Math.round(sumAccuracy / totalEvaluated) : 0
    });
  }, [lottoType, lottoData, digitMode]);

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
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
      
      {/* 2-Digit / 3-Digit Mode Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
          {[
            { id: '2digit', label: '🟢 ตรวจผลเลขท้าย 2 ตัว' },
            { id: '3digit', label: '🔵 ตรวจผลเลขท้าย 3 ตัว' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setDigitMode(mode.id)}
              style={{
                background: digitMode === mode.id 
                  ? (lottoType === 'lao' ? 'linear-gradient(135deg, #0077FF 0%, #00E5FF 100%)' : lottoType === 'hanoi' ? 'linear-gradient(135deg, #FF007F 0%, #FF5500 100%)' : 'linear-gradient(135deg, var(--primary) 0%, #D000FF 100%)') 
                  : 'transparent',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          โหมดการตรวจ: <strong style={{ color: '#FFF' }}>{digitMode === '2digit' ? 'เลขท้าย 2 ตัว (ชุดแนะนำตรง/กลับ)' : 'เลขท้าย 3 ตัว (กลุ่มเด่น/สามตรง)'}</strong>
        </div>
      </div>

      {/* Performance Summary Dashboard */}
      <div className="glass-card" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        borderLeft: `5px solid ${lottoType === 'lao' ? '#00E5FF' : lottoType === 'hanoi' ? '#FF007F' : 'var(--primary)'}`
      }}>
        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ประสิทธิภาพการทำนายสะสม</span>
          <div className="numbers-font" style={{ fontSize: '42px', fontWeight: 'bold', color: 'var(--success)', textShadow: '0 0 10px rgba(16, 185, 129, 0.2)' }}>
            {stats.accuracy}%
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {digitMode === '2digit' ? 'เก็งตรงชุดสองตัวตรง/กลับ' : 'เก็งสัดส่วนหลัก 3 ตัว'}
          </span>
        </div>

        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>จำนวนรอบสลากที่ตรวจสอบ</span>
          <div className="numbers-font" style={{ fontSize: '42px', fontWeight: 'bold', color: '#FFF' }}>
            {stats.total} <span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>งวด</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>วิเคราะห์ย้อนหลังจากฐานข้อมูล</span>
        </div>

        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {digitMode === '2digit' ? 'ตรงชุด 2 ตัว (100% Hit)' : 'ตรงกลุ่มเด่น 2-3 ตัว (High Hit)'}
          </span>
          <div className="numbers-font" style={{ fontSize: '42px', fontWeight: 'bold', color: '#10B981' }}>
            {stats.fullHits} <span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>รอบ</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {digitMode === '2digit' ? 'เลขออกตรงชุดเด่นที่ AI แนะนำ' : 'เลขรางวัลมีเลขเด่น 2 ตัวขึ้นไป'}
          </span>
        </div>

        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {digitMode === '2digit' ? 'ตรงเด่น 1 ตัว (50% Hit)' : 'ตรงกลุ่มเด่น 1 ตัว (Low Hit)'}
          </span>
          <div className="numbers-font" style={{ fontSize: '42px', fontWeight: 'bold', color: 'var(--gold)' }}>
            {stats.partialHits} <span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>รอบ</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {digitMode === '2digit' ? 'มีเลขเด่นตรงในผลรางวัล 1 ตัว' : 'มีเลขเด่นตรงในรางวัล 1 ตัว'}
          </span>
        </div>
      </div>

      {/* Sub-draw filter selectors */}
      {getSubFilterButtons()}

      {/* Accuracy Ledger Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredReports.length > 0 ? (
          filteredReports.map((rep, idx) => {
            let borderStyle = '1px solid var(--border-card)';
            let bgStyle = 'rgba(255, 255, 255, 0.01)';
            let hitText = '';
            let hitColor = 'var(--text-muted)';

            if (digitMode === '2digit') {
              if (rep.exactHit) {
                borderStyle = '1px solid rgba(16, 185, 129, 0.4)';
                bgStyle = 'rgba(16, 185, 129, 0.03)';
                hitText = rep.hitType === 'direct' ? '🎯 ตรงชุด 2 ตัวตรง (100%)' : '🔄 ตรงชุด 2 ตัวกลับ (100%)';
                hitColor = '#10B981';
              } else if (rep.accuracy === 75) {
                borderStyle = '1px solid rgba(255, 215, 0, 0.3)';
                bgStyle = 'rgba(255, 215, 0, 0.02)';
                hitText = '⭐ ตรงเลขเด่นทั้ง 2 ตัว (75%)';
                hitColor = 'var(--gold)';
              } else if (rep.accuracy === 50) {
                borderStyle = '1px solid rgba(255, 140, 0, 0.3)';
                bgStyle = 'rgba(255, 140, 0, 0.02)';
                hitText = '🟠 ตรงเลขเด่น 1 ตัว (50%)';
                hitColor = '#FF8C00';
              } else {
                hitText = '✕ ไม่ตรง (0%)';
              }
            } else {
              // 3-digit display styling
              if (rep.exactHit) {
                borderStyle = '1px solid rgba(255, 0, 255, 0.5)';
                bgStyle = 'rgba(255, 0, 255, 0.04)';
                hitText = '🔥 สามตัวตรง! (100%)';
                hitColor = '#FF00FF';
              } else if (rep.accuracy === 100) {
                borderStyle = '1px solid rgba(16, 185, 129, 0.4)';
                bgStyle = 'rgba(16, 185, 129, 0.03)';
                hitText = '🎯 ตรงเด่นครบ 3 ตัว (100%)';
                hitColor = '#10B981';
              } else if (rep.accuracy === 67) {
                borderStyle = '1px solid rgba(255, 215, 0, 0.3)';
                bgStyle = 'rgba(255, 215, 0, 0.02)';
                hitText = '⭐ ตรงเด่น 2 ตัว (66%)';
                hitColor = 'var(--gold)';
              } else if (rep.accuracy === 33) {
                borderStyle = '1px solid rgba(255, 140, 0, 0.3)';
                bgStyle = 'rgba(255, 140, 0, 0.02)';
                hitText = '🟠 ตรงเด่น 1 ตัว (33%)';
                hitColor = '#FF8C00';
              } else {
                hitText = '✕ ไม่ตรง (0%)';
              }
            }

            return (
              <div key={idx} className="glass-card" style={{
                border: borderStyle,
                background: bgStyle,
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                transition: 'all 0.3s ease'
              }}>
                {/* Draw Info & Full Winning Output */}
                <div style={{ flex: '1 1 250px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#FFF', fontSize: '16px' }}>{rep.date}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>⏰ {rep.time}</span>
                  </div>
                  
                  <div style={{ marginTop: '4px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{
                      color: rep.lottoKey === 'development' || rep.lottoKey === 'normal' || rep.lottoKey === 'thai' ? 'var(--gold)' : rep.lottoKey === 'star' || rep.lottoKey === 'special' ? '#FF8C00' : '#FF00FF',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}>
                      • {rep.drawName}
                    </span>
                    {rep.exactHit && (
                      <span style={{
                        background: digitMode === '2digit' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #FF00FF 0%, #FF0055 100%)',
                        color: '#FFF',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        animation: 'pulse 1.5s infinite'
                      }}>
                        {digitMode === '2digit' ? 'เข้าชุดสองตัว!' : 'ตรง 3 ตรง!'}
                      </span>
                    )}
                  </div>

                  {/* Expanded Full Results details box */}
                  <div style={{ 
                    marginTop: '10px', 
                    fontSize: '12px', 
                    color: '#FFF', 
                    background: 'rgba(255,255,255,0.02)', 
                    padding: '8px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(255,255,255,0.04)',
                    lineHeight: '1.4'
                  }}>
                    📋 <strong>ผลรางวัลที่ออก:</strong> {rep.fullDetails}
                  </div>
                </div>

                {/* AI Predictions vs Actual Results */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* AI Predictions */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {digitMode === '2digit' ? 'ชุดเลขท้าย 2 ตัวที่ AI คาดการณ์' : 'เลข 3 ตัวคาดการณ์หลัก'}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {rep.aiRecSets?.map((set, sIdx) => {
                        const reversedSet = set.split("").reverse().join("");
                        const isThisSetHit = rep.actualResult === set;
                        const isThisSetReversedHit = rep.actualResult === reversedSet;
                        const isHit = isThisSetHit || (digitMode === '2digit' && isThisSetReversedHit);

                        return (
                          <span key={sIdx} className="numbers-font" style={{
                            background: isHit 
                              ? (digitMode === '2digit' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 0, 255, 0.15)') 
                              : 'rgba(255,255,255,0.04)',
                            color: isHit 
                              ? (digitMode === '2digit' ? '#10B981' : '#FF00FF') 
                              : '#FFFFFF',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            fontSize: '13px',
                            border: isHit 
                              ? `1px solid ${digitMode === '2digit' ? '#10B981' : '#FF00FF'}` 
                              : '1px solid rgba(255,255,255,0.06)'
                          }}>
                            {set}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 'bold' }}>VS</div>

                  {/* Actual Results */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {digitMode === '2digit' ? 'เลขท้ายที่ออกจริง' : 'เลขท้าย 3 ตัวจริง'}
                    </div>
                    <span className={`number-ball ${
                      digitMode === '2digit' 
                        ? (rep.exactHit ? 'cyan-ball' : rep.accuracy === 75 ? 'gold-ball' : 'cyan-ball')
                        : (rep.exactHit ? 'magenta-ball' : rep.accuracy === 100 ? 'cyan-ball' : 'gold-ball')
                    }`} style={{ 
                      width: digitMode === '2digit' ? '38px' : '52px', 
                      height: '38px', 
                      fontSize: '15px', 
                      margin: 0,
                      borderRadius: digitMode === '2digit' ? '50%' : '8px',
                      color: (digitMode === '2digit' && !rep.exactHit && rep.accuracy > 0) ? '#000' : '#FFF',
                      background: (digitMode === '2digit' && rep.exactHit) 
                        ? 'radial-gradient(circle at 30% 30%, #E8F5E9 0%, #10B981 40%, #064E3B 100%)'
                        : rep.exactHit 
                        ? 'radial-gradient(circle at 30% 30%, #FFD2FF 0%, #FF00FF 40%, #800080 100%)' 
                        : undefined
                    }}>
                      {rep.actualResult}
                    </span>
                  </div>
                </div>

                {/* Validation Outcome Report */}
                <div style={{ minWidth: '180px', textAlign: 'right' }}>
                  <div style={{ color: hitColor, fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '16px' }}>{hitText}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal', marginTop: '2px' }}>
                      {digitMode === '2digit' ? (
                        `ตรงหลักวิ่งเดี่ยว: ${rep.matchedDigits?.length || 0} ตัว (${rep.matchedDigits?.join(', ') || 'ไม่มี'})`
                      ) : (
                        `ตรงหลักวิ่งเดี่ยว: ${rep.matchedDigits?.length || 0} ตัว (${rep.matchedDigits?.join(', ') || 'ไม่มี'})`
                      )}
                    </span>
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            🔍 ไม่พบข้อมูลการเปรียบเทียบในโหมดนี้
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
