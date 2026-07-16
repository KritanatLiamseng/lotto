'use client';

import React, { useState, useEffect } from 'react';

export default function LottoHistory({ lottoType = 'thai', lottoData = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('ทั้งหมด');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = lottoType === 'thai' ? 8 : 4; // Nested draws take more vertical space, so show fewer parent dates per page for Lao/Hanoi

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
                </tr>
              </thead>
              <tbody>
                {currentItems.map((draw, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: '500', minWidth: '150px' }}>{draw.date}</td>
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
                  </tr>
                ))}
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
                </tr>
              </thead>
              <tbody>
                {currentItems.map((draw, parentIdx) => {
                  // Extract available sub-draws
                  const subDraws = [];
                  if (lottoType === 'lao') {
                    if (draw.star) subDraws.push({ ...draw.star, key: 'star' });
                    if (draw.development) subDraws.push({ ...draw.development, key: 'dev' });
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
                        <td colSpan="5" style={{ padding: '12px 24px', fontWeight: 'bold', color: '#FFFFFF', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          📅 ประจำงวดวันที่: <span style={{ color: lottoType === 'lao' ? '#00E5FF' : '#FF007F' }}>{draw.date}</span>
                        </td>
                      </tr>

                      {/* Sub-draw Rows */}
                      {subDraws.map((sub, childIdx) => (
                        <tr key={childIdx} style={{
                          borderLeft: `2px solid ${
                            sub.key === 'dev' || sub.key === 'normal' 
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
                              color: sub.key === 'dev' || sub.key === 'normal' ? 'var(--gold)' : '#FFFFFF'
                            }}>
                              {sub.firstPrize}
                            </span>
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
                              sub.key === 'dev' || sub.key === 'normal' 
                                ? (lottoType === 'lao' ? 'cyan-ball' : 'magenta-ball')
                                : sub.key === 'star' || sub.key === 'special'
                                ? 'gold-ball'
                                : 'cyan-ball'
                            }`} style={{
                              width: '32px',
                              height: '32px',
                              fontSize: '14px',
                              margin: 0,
                              color: (sub.key === 'star' || sub.key === 'special' || (sub.key === 'dev' && lottoType === 'lao')) ? '#000' : '#FFF'
                            }}>
                              {sub.twoDigitBack}
                            </span>
                          </td>
                        </tr>
                      ))}
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
    </div>
  );
}
