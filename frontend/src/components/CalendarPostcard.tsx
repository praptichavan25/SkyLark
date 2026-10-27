import { useState, useEffect, useCallback, useMemo, type MouseEvent } from 'react';
import { getPostcardForMonth, type CalendarPostcardData } from '../data/calendarPostcards';
import '../styles/calendar-postcard.css';

export interface CalendarPostcardProps {
  selectedDateISO: string;
  minDateISO?: string;
  maxDateISO?: string;
  onSelectDate: (isoDate: string) => void;
  onClose?: () => void;
}

const WEEKDAYS = [
  { label: 'S', isWeekend: true },
  { label: 'M', isWeekend: false },
  { label: 'T', isWeekend: false },
  { label: 'W', isWeekend: false },
  { label: 'T', isWeekend: false },
  { label: 'F', isWeekend: false },
  { label: 'S', isWeekend: false },
];

export function CalendarPostcard({
  selectedDateISO,
  minDateISO,
  maxDateISO,
  onSelectDate,
  onClose,
}: CalendarPostcardProps) {
  // Parse initial year/month from selectedDateISO, or default to current / 2026
  const initialDate = useMemo(() => {
    if (selectedDateISO) {
      const d = new Date(selectedDateISO + 'T00:00:00');
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  }, [selectedDateISO]);

  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth()); // 0-11
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  // Sync if selectedDateISO changes externally
  useEffect(() => {
    if (selectedDateISO) {
      const d = new Date(selectedDateISO + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [selectedDateISO]);

  // Current postcard metadata
  const postcard: CalendarPostcardData = useMemo(() => {
    return getPostcardForMonth(viewMonth);
  }, [viewMonth]);

  // Month navigation handlers
  const handlePrevMonth = useCallback((e?: MouseEvent) => {
    e?.stopPropagation();
    setSlideDirection('left');
    setIsTransitioning(true);
    setTimeout(() => {
      setViewMonth(prevMonth => {
        if (prevMonth === 0) {
          setViewYear(prevYear => prevYear - 1);
          return 11;
        }
        return prevMonth - 1;
      });
      setIsTransitioning(false);
    }, 150);
  }, []);

  const handleNextMonth = useCallback((e?: MouseEvent) => {
    e?.stopPropagation();
    setSlideDirection('right');
    setIsTransitioning(true);
    setTimeout(() => {
      setViewMonth(prevMonth => {
        if (prevMonth === 11) {
          setViewYear(prevYear => prevYear + 1);
          return 0;
        }
        return prevMonth + 1;
      });
      setIsTransitioning(false);
    }, 150);
  }, []);

  // Keyboard navigation & Escape handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevMonth();
      } else if (e.key === 'ArrowRight') {
        handleNextMonth();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handlePrevMonth, handleNextMonth]);

  // Calendar Grid calculation for viewYear and viewMonth
  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  const firstDayWeekday = useMemo(() => {
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    return new Date(viewYear, viewMonth, 1).getDay();
  }, [viewYear, viewMonth]);

  // Generate day items
  const calendarDays = useMemo(() => {
    const days: Array<{
      dayNumber: number;
      isoDate: string;
      isCurrentMonth: boolean;
      isDisabled: boolean;
      isSelected: boolean;
      isToday: boolean;
      isSunday: boolean;
    }> = [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const monthPadded = String(viewMonth + 1).padStart(2, '0');
      const dayPadded = String(day).padStart(2, '0');
      const iso = `${viewYear}-${monthPadded}-${dayPadded}`;
      const weekday = new Date(viewYear, viewMonth, day).getDay();

      let disabled = false;
      if (minDateISO && iso < minDateISO) disabled = true;
      if (maxDateISO && iso > maxDateISO) disabled = true;

      days.push({
        dayNumber: day,
        isoDate: iso,
        isCurrentMonth: true,
        isDisabled: disabled,
        isSelected: selectedDateISO === iso,
        isToday: iso === todayStr,
        isSunday: weekday === 0,
      });
    }

    return days;
  }, [viewYear, viewMonth, daysInMonth, selectedDateISO, minDateISO, maxDateISO]);

  const handleSelectDay = (isoDate: string, isDisabled: boolean) => {
    if (isDisabled) return;
    onSelectDate(isoDate);
    if (onClose) {
      setTimeout(() => onClose(), 180);
    }
  };

  return (
    <div
      className="postcard-calendar-card"
      onClick={e => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label={`Travel Calendar for ${postcard.name} ${viewYear}`}
    >
      {/* ── CARD HEADER PHOTO / ARTWORK (Changes per month) ───────────────── */}
      <div className="postcard-photo-frame">
        <div
          className={`postcard-image-wrapper ${isTransitioning ? `postcard-slide-${slideDirection}` : 'postcard-image-active'}`}
        >
          <img
            src={postcard.image}
            alt={postcard.imageAlt}
            className="postcard-img"
            loading="eager"
          />
          <div className="postcard-photo-overlay" />
          <div className="postcard-photo-shine" />
        </div>

        {/* Vintage Postcard Stamp badge in corner */}
        <div className="postcard-postage-stamp" aria-hidden="true">
          <span className="postcard-stamp-icon">✈</span>
          <span className="postcard-stamp-label">AIR MAIL</span>
        </div>

        {/* Month navigation overlay controls */}
        <div className="postcard-nav-overlay">
          <button
            type="button"
            className="postcard-nav-btn postcard-nav-btn--prev"
            onClick={handlePrevMonth}
            aria-label="Previous Month"
            title="Previous Month (Left Arrow)"
          >
            ‹
          </button>
          <button
            type="button"
            className="postcard-nav-btn postcard-nav-btn--next"
            onClick={handleNextMonth}
            aria-label="Next Month"
            title="Next Month (Right Arrow)"
          >
            ›
          </button>
        </div>
      </div>

      {/* ── CARD BODY: MONTH TITLE & CALENDAR GRID ───────────────────────── */}
      <div className="postcard-body">
        {/* Month & Year Title Row */}
        <div className="postcard-month-row">
          <div className="postcard-month-left">
            <h3 className="postcard-month-title">
              {postcard.shortName}
            </h3>
            <span className="postcard-month-full">{postcard.name}</span>
          </div>
          <span className="postcard-year-title">{viewYear}</span>
        </div>

        {/* Weekday Header (S M T W T F S) with Sunday highlighted in terracotta */}
        <div className="postcard-weekday-header">
          {WEEKDAYS.map((wd, i) => (
            <span
              key={i}
              className={`postcard-weekday-col ${wd.isWeekend ? 'postcard-weekday--sunday' : ''}`}
            >
              {wd.label}
            </span>
          ))}
        </div>

        {/* Date Numbers Grid */}
        <div className="postcard-date-grid">
          {/* Empty offset padding cells for first day of month */}
          {Array.from({ length: firstDayWeekday }).map((_, idx) => (
            <div key={`empty-${idx}`} className="postcard-day-cell postcard-day-cell--empty" />
          ))}

          {/* Actual days */}
          {calendarDays.map(item => (
            <button
              key={item.isoDate}
              type="button"
              className={`postcard-day-cell${item.isSunday ? ' postcard-day-cell--sunday' : ''}${item.isSelected ? ' postcard-day-cell--selected' : ''}${item.isToday ? ' postcard-day-cell--today' : ''}${item.isDisabled ? ' postcard-day-cell--disabled' : ''}`}
              onClick={() => handleSelectDay(item.isoDate, item.isDisabled)}
              disabled={item.isDisabled}
              aria-label={`${item.dayNumber} ${postcard.name} ${viewYear}${item.isSelected ? ', Selected Date' : ''}`}
              aria-pressed={item.isSelected}
            >
              <span className="postcard-day-number">{item.dayNumber}</span>
              {item.isToday && !item.isSelected && <span className="postcard-today-dot" />}
            </button>
          ))}
        </div>

        {/* Handwritten Travel Quote / Doodle at bottom right (from reference) */}
        <div className="postcard-footer">
          <div className="postcard-doodle" aria-hidden="true">
            <span className="postcard-star-doodle">✦</span>
          </div>
          <span className="postcard-quote" title={postcard.quote}>
            {postcard.quote}
          </span>
        </div>
      </div>
    </div>
  );
}
