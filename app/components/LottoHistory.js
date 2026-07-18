'use client';

import React, { useState, useEffect } from 'react';
import { backtestDraw, getPredictionStats } from '../data/lottoHistory';

export default function LottoHistory({ lottoType = 'thai', lottoData = [], onUpdateDraw }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('ทั้งหมด');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = lottoType === 'thai' ? 8 : 4; // Nested draws take more vertical space

  const [editingDraw, setEditingDraw] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const handleStartEdit = (draw) => {
    setEditingDraw(draw);
    if (lottoType === 'thai') {
      setEditFormData({
        firstPrize: draw.firstPrize || '',
        twoDigitBack: draw.twoDigitBack || '',
        threeDigitFront1: draw.threeDigitFront?.[0] || '',
        threeDigitFront2: draw.threeDigitFront?.[1] || '',
        threeDigitBack1: draw.threeDigitBack?.[0] || '',
        threeDigitBack2: draw.threeDigitBack?.[1] || ''
      });
    } else {
      const rounds = {};
      const keys = lottoType === 'lao' ? ['star', 'development', 'samakkee'] : ['special', 'normal', 'vip'];
      keys.forEach(k => {
        if (draw[k]) {
          rounds[k] = draw[k].firstPrize || '';
        }
      });
      setEditFormData(rounds);
    }
  };

  const parseThaiDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.trim().split(/\s+/);
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0]);
    const monthThai = parts[1];
    const yearThai = parseInt(parts[2]);
    
    const monthsThai = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    const monthIdx = monthsThai.indexOf(monthThai);
    if (monthIdx === -1) return null;
    
    const yearEng = yearThai - 543;
    return new Date(yearEng, monthIdx, day);
  };

  const handleSaveEdit = () => {
    let updatedData = {};
    if (lottoType === 'thai') {
      updatedData = {
        firstPrize: editFormData.firstPrize,
        twoDigitBack: editFormData.twoDigitBack,
        threeDigitFront: [editFormData.threeDigitFront1, editFormData.threeDigitFront2].filter(Boolean),
        threeDigitBack: [editFormData.threeDigitBack1, editFormData.threeDigitBack2].filter(Boolean),
        status: 'official'
      };
    } else {
      const keys = lottoType === 'lao' ? ['star', 'development', 'samakkee'] : ['special', 'normal', 'vip'];
      keys.forEach(k => {
        if (editingDraw[k]) {
          const val = editFormData[k] || '';
          updatedData[k] = {
            ...editingDraw[k],
            firstPrize: val,
            threeDigitBack: val.slice(-3),
            twoDigitBack: val.slice(-2),
            status: 'official'
          };
        }
      });
    }
    
    if (onUpdateDraw) {
      onUpdateDraw(editingDraw.date, updatedData);
    }
    setEditingDraw(null);
  };

  // Reset filter selections when lottoType changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedYear('ทั้งหมด');
    setSearchQuery('');
  }, [lottoType]);

  // Filter logic
  const filteredHistory = lottoData.filter(draw => {
    // 1. Filter by year
    if (selectedYear !== 'ทั้งหมด' && !draw.date.includes(selectedYear)) {
      return false;
    }
    
    // 2. Filter by search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim();
      const inDate = draw.date.includes(q);

      if (lottoType === 'thai') {
        const inFirst = draw.firstPrize && draw.firstPrize.includes(q);
        const inTwoDigit = draw.twoDigitBack && draw.twoDigitBack.includes(q);
        const inThreeFront = draw.threeDigitFront && draw.threeDigitFront.some(n => n.includes(q));
        const inThreeBack = draw.threeDigitBack && draw.threeDigitBack.some(n => n.includes(q));
        return inFirst || inTwoDigit || inThreeFront || inThreeBack || inDate;
      } else if (lottoType === 'lao') {
        const checkSubDraw = (sub) => {
          if (!sub) return false;
          return (sub.firstPrize && sub.firstPrize.includes(q)) || 
                 (sub.twoDigitBack && sub.twoDigitBack.includes(q)) || 
                 (sub.threeDigitBack && sub.threeDigitBack.includes(q));
        };
        return checkSubDraw(draw.star) || checkSubDraw(draw.development) || checkSubDraw(draw.samakkee) || inDate;
      } else if (lottoType === 'hanoi') {
        const checkSubDraw = (sub) => {
          if (!sub) return false;
          return (sub.firstPrize && sub.firstPrize.includes(q)) || 
                 (sub.twoDigitBack && sub.twoDigitBack.includes(q)) || 
                 (sub.threeDigitBack && sub.threeDigitBack.includes(q));
        };
        return checkSubDraw(draw.special) || checkSubDraw(draw.normal) || checkSubDraw(draw.vip) || inDate;
      }
    }

    return true;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);

  const getYearFilters = () => {
    if (lottoType === 'thai') {
      return ['ทั้งหมด', '2569', '2568', '2567'];
    }
    return ['ทั้งหมด', '2569'];
  };

  // Badge styler helper for sub-lotteries
  const getSubLottoBadge = (name) => {
    let color = 'var(--text-muted)';
    let border = 'rgba(255,255,255,0.08)';
    let bg = 'rgba(255,255,255,0.02)';

    if (name.includes('พิเศษ') || name.includes('สตาร์')) {
      color = '#FF8C00';
      border = '1px solid rgba(255, 140, 0, 0.3)';
      bg = 'rgba(255, 140, 0, 0.08)';
    } else if (name.includes('ปกติ') || name.includes('พัฒนา')) {
      color = 'var(--gold)';
      border = '1px solid rgba(255, 215, 0, 0.3)';
      bg = 'rgba(255, 215, 0, 0.08)';
    } else if (name.includes('VIP') || name.includes('สามัคคี')) {
      color = '#FF00FF';
      border = '1px solid rgba(255, 0, 255, 0.3)';
      bg = 'rgba(255, 0, 255, 0.08)';
    }

    return (
      <span style={{
        color,
        border,
        background: bg,
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 'bold',
        display: 'inline-block'
      }}>
        {name}
      </span>
    );
  };

  // Helper to render stacked 2-digit and 3-digit accuracy badges
  const renderStackedBadges = (backtest2, acc3, matched3) => {
    const render2 = () => {
      if (backtest2.accuracy === 100) {
        return <span style={{ color: '#10B981', fontSize: '11px', fontWeight: 'bold' }}>🟢 2 ตัว: ตรง (100%)</span>;
      } else if (backtest2.accuracy === 50) {
        return <span style={{ color: 'var(--gold)', fontSize: '11px', fontWeight: 'bold' }}>⭐ 2 ตัว: ตรง 1ตัว (50%)</span>;
      }
      return <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>✕ 2 ตัว: พลาด</span>;
    };

    const render3 = () => {
      if (acc3 === 100) {
        return <span style={{ color: '#10B981', fontSize: '11px', fontWeight: 'bold' }}>🟢 3 ตัว: ตรงครบ (100%)</span>;
      } else if (acc3 === 67) {
        return <span style={{ color: 'var(--gold)', fontSize: '11px', fontWeight: 'bold' }}>⭐ 3 ตัว: ตรง 2ตัว (66%)</span>;
      } else if (acc3 === 33) {
        return <span style={{ color: '#FF8C00', fontSize: '11px', fontWeight: 'bold' }}>🟠 3 ตัว: ตรง 1ตัว (33%)</span>;
      }
      return <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>✕ 3 ตัว: พลาด</span>;
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
        {render2()}
        {render3()}
      </div>
    );
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px' }}>
          📜 ประวัติผลรางวัล
          {lottoType === 'lao' ? 'หวยลาวย้อนหลัง' : lottoType === 'hanoi' ? 'หวยฮานอยย้อนหลัง' : 'สลากกินแบ่งรัฐบาลไทยย้อนหลัง'}
        </h2>
        
        {/* Year Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
          {getYearFilters().map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              style={{
                background: selectedYear === year 
                  ? (lottoType === 'lao' ? '#00E5FF' : lottoType === 'hanoi' ? '#FF007F' : 'var(--primary)') 
                  : 'transparent',
                color: selectedYear === year 
                  ? (lottoType === 'lao' ? '#000' : '#FFFFFF') 
                  : 'var(--text-muted)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="ค้นหาตัวเลขหรือวันที่ (เช่น 40, 523, กรกฎาคม)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          id="lotto-search-input"
          style={{
            borderColor: searchQuery && (lottoType === 'lao' ? '#00E5FF' : lottoType === 'hanoi' ? '#FF007F' : 'var(--secondary)')
          }}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-card)',
              color: '#FFFFFF',
              padding: '0 16px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ล้างค้นหา
          </button>
        )}
      </div>

      {/* Results Count */}
      <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
        พบวันออกรางวัลทั้งหมด <span style={{ color: lottoType === 'lao' ? '#00E5FF' : lottoType === 'hanoi' ? '#FF007F' : 'var(--secondary)', fontWeight: 'bold' }}>{filteredHistory.length}</span> วัน
      </div>

      {/* History Grid */}
      {currentItems.length > 0 ? (
        <div className="table-wrapper">
          {lottoType === 'thai' ? (
            // Thai government lottery standard table
            <table className="lotto-table">
              <thead>
                <tr>
                  <th>งวดวันที่</th>
                  <th style={{ textAlign: 'center' }}>รางวัลที่ 1</th>
                  <th style={{ textAlign: 'center' }}>เลขหน้า 3 ตัว</th>
                  <th style={{ textAlign: 'center' }}>เลขท้าย 3 ตัว</th>
                  <th style={{ textAlign: 'center' }}>เลขท้าย 2 ตัว</th>
                  <th style={{ textAlign: 'center' }}>ความตรงกัน AI (2ตัว/3ตัว)</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((draw, index) => {
                  const globalIdx = lottoData.findIndex(item => item.date === draw.date);
                  const isOldest = globalIdx >= lottoData.length - 1;

                  // 2-digit backtest
                  const backtest2 = backtestDraw(lottoData, globalIdx);

                  // 3-digit backtest
                  let acc3 = 0;
                  let matched3 = [];
                  if (!isOldest) {
                    const pastData = lottoData.slice(globalIdx + 1);
                    const predictions = getPredictionStats(pastData);
                    const topDigits = predictions.slice(0, 3).map(p => p.digit);
                    
                    (draw.threeDigitBack || []).forEach(actStr => {
                      const actNums = actStr.split("").map(Number);
                      const currentMatched = [];
                      actNums.forEach(digit => {
                        if (topDigits.includes(digit) && !currentMatched.includes(digit)) {
                          currentMatched.push(digit);
                        }
                      });
                      const currentAcc = Math.round((currentMatched.length / 3) * 100);
                      if (currentAcc > acc3) {
                        acc3 = currentAcc;
                        matched3 = currentMatched;
                      }
                    });
                  }

                  return (
                    <tr key={index}>
                      <td style={{ fontWeight: '500', minWidth: '150px' }}>
                        {draw.date}
                        {onUpdateDraw && (
                          <button 
                            onClick={() => handleStartEdit(draw)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: '12px', marginLeft: '6px' }}
                            title="แก้ไขผลรางวัล"
                          >
                            ✏️
                          </button>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="numbers-font" style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--gold)', letterSpacing: '2px', textShadow: '0 0 10px var(--gold-glow)' }}>
                          {draw.firstPrize}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          {draw.threeDigitFront.map((num, idx) => (
                            <span key={idx} className="numbers-font" style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-card)' }}>
                              {num}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          {draw.threeDigitBack.map((num, idx) => (
                            <span key={idx} className="numbers-font" style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-card)' }}>
                              {num}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="number-ball magenta-ball">
                          {draw.twoDigitBack}
                        </span>
                      </td>
                      {/* Thai accuracy column */}
                      <td style={{ textAlign: 'center' }}>
                        {isOldest ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>N/A (ฐานข้อมูลเริ่มต้น)</span>
                        ) : (
                          renderStackedBadges(backtest2, acc3, matched3)
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            // Lao / Hanoi nested draws table layout
            <table className="lotto-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '24px' }}>รอบเวลาที่ออก</th>
                  <th style={{ textAlign: 'center' }}>ประเภทรางวัลย่อย</th>
                  <th style={{ textAlign: 'center' }}>ผลสลาก (เต็ม)</th>
                  <th style={{ textAlign: 'center' }}>เลขท้าย 3 ตัว</th>
                  <th style={{ textAlign: 'center' }}>เลขท้าย 2 ตัว</th>
                  <th style={{ textAlign: 'center' }}>ความตรงกัน AI (2ตัว/3ตัว)</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((draw, parentIdx) => {
                  const globalIdx = lottoData.findIndex(item => item.date === draw.date);
                  const isOldest = globalIdx >= lottoData.length - 1;

                  // Extract available sub-draws
                  const subDraws = [];
                  if (lottoType === 'lao') {
                    if (draw.star) subDraws.push({ ...draw.star, key: 'star' });
                    if (draw.development) subDraws.push({ ...draw.development, key: 'development' });
                    if (draw.samakkee) subDraws.push({ ...draw.samakkee, key: 'samakkee' });
                  } else if (lottoType === 'hanoi') {
                    if (draw.special) subDraws.push({ ...draw.special, key: 'special' });
                    if (draw.normal) subDraws.push({ ...draw.normal, key: 'normal' });
                    if (draw.vip) subDraws.push({ ...draw.vip, key: 'vip' });
                  }

                  return (
                    <React.Fragment key={parentIdx}>
                      {/* Parent Date Row Header */}
                      <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                        <td colSpan="6" style={{ padding: '12px 24px', fontWeight: 'bold', color: '#FFFFFF', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <span>📅 ประจำงวดวันที่: <span style={{ color: lottoType === 'lao' ? '#00E5FF' : '#FF007F' }}>{draw.date}</span></span>
                            {onUpdateDraw && (
                              <button 
                                onClick={() => handleStartEdit(draw)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--gold)',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                ✏️ แก้ไขผลรางวัล
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Sub-draw Rows */}
                      {subDraws.map((sub, childIdx) => {
                        const flatSubHistory = lottoData.map(item => item[sub.key]).filter(Boolean);
                        
                        // 2-digit backtest
                        const backtest2 = backtestDraw(flatSubHistory, globalIdx);

                        // 3-digit backtest
                        let acc3 = 0;
                        let matched3 = [];
                        if (!isOldest) {
                          const subPastData = flatSubHistory.slice(globalIdx + 1);
                          const subPredictions = getPredictionStats(subPastData);
                          const subTopDigits = subPredictions.slice(0, 3).map(p => p.digit);
                          const actual3 = sub.threeDigitBack;

                          if (actual3 && actual3.length === 3) {
                            const actNums = actual3.split("").map(Number);
                            const currentMatched = [];
                            actNums.forEach(digit => {
                              if (subTopDigits.includes(digit) && !currentMatched.includes(digit)) {
                                currentMatched.push(digit);
                              }
                            });
                            acc3 = Math.round((currentMatched.length / 3) * 100);
                            matched3 = currentMatched;
                          }
                        }

                        return (
                          <tr key={childIdx} style={{
                            borderLeft: `2px solid ${
                              sub.key === 'development' || sub.key === 'normal' 
                                ? 'var(--gold)' 
                                : sub.key === 'star' || sub.key === 'special' 
                                ? '#FF8C00' 
                                : '#FF00FF'
                            }`
                          }}>
                            {/* Time Column */}
                            <td style={{ paddingLeft: '32px', color: '#FFFFFF', fontWeight: '500' }}>
                              ⏰ {sub.time}
                            </td>

                            {/* Sub-lotto Badge Column */}
                            <td style={{ textAlign: 'center' }}>
                              {getSubLottoBadge(sub.name)}
                            </td>

                            {/* Full Result Output */}
                            <td style={{ textAlign: 'center' }}>
                              <span className="numbers-font" style={{
                                fontWeight: 'bold',
                                fontSize: '18px',
                                letterSpacing: '2px',
                                color: sub.key === 'development' || sub.key === 'normal' ? 'var(--gold)' : '#FFFFFF'
                              }}>
                                {sub.firstPrize}
                              </span>
                              {(() => {
                                const drawDate = parseThaiDate(draw.date);
                                const cutoffDate = new Date(2026, 6, 16); // July 16, 2026
                                const isOfficial = sub.status === 'official' || (drawDate && drawDate <= cutoffDate);

                                return (
                                  <div style={{ marginTop: '4px' }}>
                                    {isOfficial ? (
                                      <span style={{ color: '#10B981', fontSize: '9px', fontWeight: 'bold', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                        ✅ ผลจริง
                                      </span>
                                    ) : (
                                      <span style={{ color: 'var(--text-muted)', fontSize: '9px', background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        ⚠️ ผลจำลอง
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>

                            {/* 3-Digit Out */}
                            <td style={{ textAlign: 'center' }}>
                              <span className="numbers-font" style={{ background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-card)' }}>
                                {sub.threeDigitBack}
                              </span>
                            </td>

                            {/* 2-Digit Out Ball */}
                            <td style={{ textAlign: 'center' }}>
                              <span className={`number-ball ${
                                sub.key === 'development' || sub.key === 'normal' 
                                  ? (lottoType === 'lao' ? 'cyan-ball' : 'magenta-ball')
                                  : sub.key === 'star' || sub.key === 'special'
                                  ? 'gold-ball'
                                  : 'cyan-ball'
                              }`} style={{
                                width: '32px',
                                height: '32px',
                                fontSize: '14px',
                                margin: 0,
                                color: (sub.key === 'star' || sub.key === 'special' || (sub.key === 'development' && lottoType === 'lao')) ? '#000' : '#FFF'
                              }}>
                                {sub.twoDigitBack}
                              </span>
                            </td>

                            {/* AI Accuracy Column */}
                            <td style={{ textAlign: 'center' }}>
                              {isOldest ? (
                                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>N/A (ฐานข้อมูลเริ่มต้น)</span>
                              ) : (
                                renderStackedBadges(backtest2, acc3, matched3)
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          🔍 ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-card)' }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              background: currentPage === 1 ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.05)',
              color: currentPage === 1 ? 'var(--text-muted)' : '#FFFFFF',
              border: '1px solid var(--border-card)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.3s ease'
            }}
          >
            ← ก่อนหน้า
          </button>
          
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            หน้า <strong style={{ color: '#FFFFFF' }}>{currentPage}</strong> จากทั้งหมด {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{
              background: currentPage === totalPages ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.05)',
              color: currentPage === totalPages ? 'var(--text-muted)' : '#FFFFFF',
              border: '1px solid var(--border-card)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.3s ease'
            }}
          >
            ถัดไป →
          </button>
        </div>
      )}

      {/* Edit Results Modal Overlay */}
      {editingDraw && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(7, 5, 20, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '500px',
            border: `1px solid ${lottoType === 'lao' ? '#00E5FF' : lottoType === 'hanoi' ? '#FF007F' : 'var(--gold)'}`,
            boxShadow: `0 0 20px ${lottoType === 'lao' ? 'rgba(0,229,255,0.2)' : lottoType === 'hanoi' ? 'rgba(255,0,127,0.2)' : 'var(--gold-glow)'}`
          }}>
            <h3 style={{ fontSize: '20px', marginBottom: '16px', borderBottom: '1px solid var(--border-card)', paddingBottom: '10px' }}>
              ✏️ แก้ไขผลรางวัล ({editingDraw.date})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {lottoType === 'thai' ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>รางวัลที่ 1 (6 หลัก)</label>
                    <input 
                      type="text" 
                      value={editFormData.firstPrize}
                      onChange={(e) => setEditFormData({ ...editFormData, firstPrize: e.target.value })}
                      className="search-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>เลขหน้า 3 ตัว (ชุด 1)</label>
                      <input 
                        type="text" 
                        value={editFormData.threeDigitFront1}
                        onChange={(e) => setEditFormData({ ...editFormData, threeDigitFront1: e.target.value })}
                        className="search-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>เลขหน้า 3 ตัว (ชุด 2)</label>
                      <input 
                        type="text" 
                        value={editFormData.threeDigitFront2}
                        onChange={(e) => setEditFormData({ ...editFormData, threeDigitFront2: e.target.value })}
                        className="search-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>เลขท้าย 3 ตัว (ชุด 1)</label>
                      <input 
                        type="text" 
                        value={editFormData.threeDigitBack1}
                        onChange={(e) => setEditFormData({ ...editFormData, threeDigitBack1: e.target.value })}
                        className="search-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>เลขท้าย 3 ตัว (ชุด 2)</label>
                      <input 
                        type="text" 
                        value={editFormData.threeDigitBack2}
                        onChange={(e) => setEditFormData({ ...editFormData, threeDigitBack2: e.target.value })}
                        className="search-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>เลขท้าย 2 ตัว</label>
                    <input 
                      type="text" 
                      value={editFormData.twoDigitBack}
                      onChange={(e) => setEditFormData({ ...editFormData, twoDigitBack: e.target.value })}
                      className="search-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </>
              ) : (
                Object.keys(editFormData).map(key => {
                  const labelName = key === 'star' ? 'ลาวสตาร์ (4 หลัก)' 
                    : key === 'development' ? 'หวยลาวพัฒนา (4 หลัก)'
                    : key === 'samakkee' ? 'ลาวสามัคคี (4 หลัก)'
                    : key === 'special' ? 'ฮานอยพิเศษ (5 หลัก)'
                    : key === 'normal' ? 'ฮานอยปกติ (5 หลัก)'
                    : 'ฮานอย VIP (5 หลัก)';

                  return (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>{labelName}</label>
                      <input 
                        type="text" 
                        value={editFormData[key]}
                        onChange={(e) => setEditFormData({ ...editFormData, [key]: e.target.value })}
                        className="search-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setEditingDraw(null)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-card)',
                  color: '#FFFFFF',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px'
                }}
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleSaveEdit}
                style={{
                  background: lottoType === 'lao' ? 'linear-gradient(135deg, #0077FF 0%, #00E5FF 100%)' : lottoType === 'hanoi' ? 'linear-gradient(135deg, #FF007F 0%, #FF5500 100%)' : 'linear-gradient(135deg, var(--gold) 0%, #FFA500 100%)',
                  border: 'none',
                  color: lottoType === 'thai' ? '#000' : '#FFF',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px'
                }}
              >
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
