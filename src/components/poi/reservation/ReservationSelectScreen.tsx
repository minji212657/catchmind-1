import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'

import './ReservationSelectScreen.css'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

export interface ReservationSelectionResult {
  selectedDate: Date
  adultCount: number
  youthCount: number
  totalPrice: number
}

interface TicketRowProps {
  title: string
  price: number
  count: number
  onChange?: Dispatch<SetStateAction<number>>
  note?: string
  badge?: string
  disabled?: boolean
  showDivider?: boolean
}

function TicketRow({ title, price, count, onChange, note, badge, disabled, showDivider }: TicketRowProps) {
  const decrease = () => {
    if (disabled || !onChange) return
    onChange(previous => Math.max(0, previous - 1))
  }
  const increase = () => {
    if (disabled || !onChange) return
    onChange(previous => previous + 1)
  }

  return (
    <>
      <div className="ticket">
        <div className="ticket-info">
          <div className="ticket-title">
            {badge && <span className="ticket-badge">{badge}</span>}
            {title}
          </div>
          <div className="ticket-price">{price.toLocaleString()}원</div>
          {note && <div className="ticket-note">{note}</div>}
        </div>
        <div className="ticket-counter">
          <button type="button" onClick={decrease} className="ticket-counter-btn" disabled={disabled}>
            −
          </button>
          <span className="ticket-counter-value">{count}</span>
          <button type="button" onClick={increase} className="ticket-counter-btn" disabled={disabled}>
            +
          </button>
        </div>
      </div>
      {showDivider && <div className="ticket-divider" />}
    </>
  )
}

export interface ReservationSelectScreenProps {
  selectedDate: Date | null
  setSelectedDate: Dispatch<SetStateAction<Date | null>>
  adultCount: number
  setAdultCount: Dispatch<SetStateAction<number>>
  youthCount: number
  setYouthCount: Dispatch<SetStateAction<number>>
  adultPrice?: number
  youthPrice?: number
  discountAdultPrice?: number
  onClose: () => void
  onProceedPayment: (result: ReservationSelectionResult) => void
}

export function ReservationSelectScreen({
  selectedDate,
  setSelectedDate,
  adultCount,
  setAdultCount,
  youthCount,
  setYouthCount,
  adultPrice = 24000,
  youthPrice = 17000,
  discountAdultPrice = 17000,
  onClose,
  onProceedPayment,
}: ReservationSelectScreenProps) {
  const today = useMemo(() => {
    const current = new Date()
    current.setHours(0, 0, 0, 0)
    return current
  }, [])
  const [calendarYear, setCalendarYear] = useState<number>(() => selectedDate?.getFullYear() ?? today.getFullYear())
  const [calendarMonth, setCalendarMonth] = useState<number>(() => selectedDate?.getMonth() ?? today.getMonth())

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(new Date(today))
      setCalendarYear(today.getFullYear())
      setCalendarMonth(today.getMonth())
    }
  }, [selectedDate, setSelectedDate, today])

  const totalDays = useMemo(() => new Date(calendarYear, calendarMonth + 1, 0).getDate(), [calendarYear, calendarMonth])
  const firstWeekday = useMemo(() => new Date(calendarYear, calendarMonth, 1).getDay(), [calendarYear, calendarMonth])

  const updateMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(previous => {
      if (!previous) return previous
      const nextYear = direction === 'prev' ? calendarYear - (calendarMonth === 0 ? 1 : 0) : calendarYear + (calendarMonth === 11 ? 1 : 0)
      const nextMonth = direction === 'prev' ? (calendarMonth + 11) % 12 : (calendarMonth + 1) % 12
      return previous.getFullYear() === nextYear && previous.getMonth() === nextMonth ? previous : null
    })

    if (direction === 'prev') {
      if (calendarMonth === 0) {
        setCalendarYear(year => year - 1)
        setCalendarMonth(11)
      } else {
        setCalendarMonth(month => month - 1)
      }
    } else if (calendarMonth === 11) {
      setCalendarYear(year => year + 1)
      setCalendarMonth(0)
    } else {
      setCalendarMonth(month => month + 1)
    }
  }

  const handlePrevMonth = () => updateMonth('prev')
  const handleNextMonth = () => updateMonth('next')

  const handleSelectDate = (day: number) => {
    const nextDate = new Date(calendarYear, calendarMonth, day)
    if (nextDate < today) {
      return
    }
    setSelectedDate(nextDate)
  }

  const totalPrice = Math.max(
    0,
    adultCount * (Number.isFinite(adultPrice) ? adultPrice : 0) +
      youthCount * (Number.isFinite(youthPrice) ? youthPrice : 0),
  )
  const ctaDisabled = !selectedDate || totalPrice === 0
  const ticketRows: Omit<TicketRowProps, 'showDivider'>[] = [
    { title: '성인 입장권', price: adultPrice, count: adultCount, onChange: setAdultCount },
    { title: '어린이/청소년 입장권', price: youthPrice, count: youthCount, onChange: setYouthCount },
    { title: 'BC 카드 할인-성인', price: discountAdultPrice, count: 0, badge: '[신용카드 할인]', disabled: true },
    { title: 'BC 카드 할인-청소년', price: youthPrice, count: 0, badge: '[신용카드 할인]', disabled: true },
  ]

  return (
    <div className="reservation-screen-overlay">
      <section className="reservation-screen" role="dialog" aria-modal="true" aria-label="매수 선택">
        <header className="rs-header">
          <button type="button" className="icon-btn" aria-label="이전" onClick={onClose}>
            ‹
          </button>
          <h1>매수 선택</h1>
          <span className="icon-space" />
        </header>

        <main className="rs-content">
          <section className="calendar">
            <div className="section-label">방문 날짜 선택</div>

            <div className="calendar-nav">
              <button type="button" className="icon-btn" aria-label="이전 달" onClick={handlePrevMonth}>
                ‹
              </button>
              <h2>
                {calendarYear}.{String(calendarMonth + 1).padStart(2, '0')}
              </h2>
              <button type="button" className="icon-btn rotate" aria-label="다음 달" onClick={handleNextMonth}>
                ‹
              </button>
            </div>

            <div className="calendar-grid">
              {DAY_LABELS.map(day => (
                <div key={day} className="calendar-day-label">
                  {day}
                </div>
              ))}

              {Array.from({ length: firstWeekday }).map((_, idx) => (
                <div key={`empty-${idx}`} className="calendar-cell calendar-cell--empty" aria-hidden="true" />
              ))}

              {Array.from({ length: totalDays }, (_, index) => {
                const day = index + 1
                const cellDate = new Date(calendarYear, calendarMonth, day)
                const isSelected =
                  !!selectedDate &&
                  selectedDate.getFullYear() === calendarYear &&
                  selectedDate.getMonth() === calendarMonth &&
                  selectedDate.getDate() === day
                const isPast = cellDate < today
                const isToday =
                  calendarYear === today.getFullYear() &&
                  calendarMonth === today.getMonth() &&
                  day === today.getDate()

                return (
                  <button
                    key={day}
                    type="button"
                    disabled={isPast}
                    onClick={() => handleSelectDate(day)}
                    className={[
                      'calendar-cell',
                      isSelected ? 'selected' : '',
                      isPast ? 'disabled' : '',
                      isToday ? 'today' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="ticket-section">
            <h2>매수 선택</h2>
            <div className="ticket-card">
              {ticketRows.map((ticket, index) => (
                <TicketRow key={ticket.title} {...ticket} showDivider={index < ticketRows.length - 1} />
              ))}
            </div>
          </section>
        </main>

        <footer className="rs-footer horizontal">
          <div className="price-row horizontal">
            <span className="price-label">티켓 금액</span>
            <strong className="price-value">{totalPrice.toLocaleString()}원</strong>
          </div>

          <button
            type="button"
            className="cta-btn compact"
            onClick={() => {
              if (!selectedDate || ctaDisabled) return
              onProceedPayment({
                selectedDate,
                adultCount,
                youthCount,
                totalPrice,
              })
            }}
            disabled={ctaDisabled}
          >
            예매하기
          </button>
        </footer>
      </section>
    </div>
  )
}
