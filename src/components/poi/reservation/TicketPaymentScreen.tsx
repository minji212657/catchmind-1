import { useMemo, useState } from 'react'

import cPayLogo from '@/assets/cpay logo.png'
import tossPayLogo from '@/assets/tosspay logo.png'

import './ReservationSelectScreen.css'

type ReceiveMethod = 'pickup' | 'mobile'

export interface TicketPaymentScreenProps {
  adult?: number
  youth?: number
  totalPrice?: number
  visitDate?: Date | null
  onBack: () => void
  onPay: () => void
}

export function TicketPaymentScreen({ adult = 0, youth = 0, totalPrice = 0, visitDate, onBack, onPay }: TicketPaymentScreenProps) {
  const [receiveMethod, setReceiveMethod] = useState<ReceiveMethod>('pickup')
  const [agreeThirdParty, setAgreeThirdParty] = useState(true)
  const [agreeRefund, setAgreeRefund] = useState(true)
  const [selectedCatchPayCard, setSelectedCatchPayCard] = useState('card-1')

  const totalTickets = adult + youth
  const breakdown = useMemo(() => {
    const rows: string[] = []
    if (adult > 0) {
      rows.push(`성인 · 24,000원 × ${adult}매`)
    }
    if (youth > 0) {
      rows.push(`어린이/청소년 · 17,000원 × ${youth}매`)
    }
    return rows
  }, [adult, youth])

  const allAgreed = agreeThirdParty && agreeRefund
  const handleAllAgree = () => {
    const next = !allAgreed
    setAgreeThirdParty(next)
    setAgreeRefund(next)
  }

  const catchPayCards = [
    {
      id: 'card-1',
      brandLogo: tossPayLogo,
      cardCompany: '토스 페이',
      cardType: '체크',
      cardNumber: '하나(외환) (140*)',
    },
  ]

  const formattedVisitDate = useMemo(() => {
    if (!visitDate) {
      return '미정'
    }
    const year = visitDate.getFullYear()
    const month = String(visitDate.getMonth() + 1).padStart(2, '0')
    const day = String(visitDate.getDate()).padStart(2, '0')
    return `${year}.${month}.${day}`
  }, [visitDate])

  return (
    <div className="reservation-screen payment-screen">
      <header className="rs-header">
        <button type="button" className="icon-btn" aria-label="뒤로가기" onClick={onBack}>
          ‹
        </button>
        <h1>티켓 결제</h1>
        <span className="icon-space" />
      </header>

      <main className="rs-content">
        <section className="payment-section">
          <h2 className="payment-title">주문 상세</h2>
          <div className="payment-main">바스키아 : 과거와 미래를 잇는 상징적 기호들</div>
          <div className="payment-subtitle">동대문 디자인플라자 전시 1관</div>

          <div className="payment-ticket">
            <div className="payment-highlight">입장권 {totalTickets}인</div>
            {breakdown.map(line => (
              <div key={line} className="payment-caption">
                {line}
              </div>
            ))}
          </div>
        </section>

        <section className="payment-section">
          <h2 className="payment-title">티켓 수령 방법</h2>
          <div className="chip-row">
            <button
              className={receiveMethod === 'pickup' ? 'chip active' : 'chip'}
              type="button"
              onClick={() => setReceiveMethod('pickup')}
            >
              현장 수령
            </button>
            <button
              className={receiveMethod === 'mobile' ? 'chip active' : 'chip'}
              type="button"
              onClick={() => setReceiveMethod('mobile')}
            >
              모바일 수령
            </button>
          </div>
        </section>

        <section className="payment-section">
          <h2 className="payment-title">예약자 정보</h2>
          <div className="info-list">
            <div className="info-field muted">홍길동</div>
            <div className="info-field muted">1997.08.09</div>
            <div className="info-field outline">email@email.com</div>
            <div className="info-field outline">010-1234-5678</div>
          </div>
        </section>

        <section className="payment-section">
          <h2 className="payment-title">결제 수단</h2>

          <div className="payment-methods">
            <div className="payment-group">
              <label className="payment-method inline payment-method--brand">
                <input type="radio" name="payment" defaultChecked className="payment-radio" />
                <div className="payment-brand">
                  <img src={cPayLogo} alt="캐치테이블 페이" />
                  <span>캐치테이블 페이</span>
                </div>
              </label>
              <div className="catchpay-card-scroll" role="list">
                {catchPayCards.map(card => (
                  <button
                    key={card.id}
                    type="button"
                    className={`catchpay-card ${selectedCatchPayCard === card.id ? 'catchpay-card--selected' : ''}`}
                    onClick={() => setSelectedCatchPayCard(card.id)}
                  >
                    <div className="catchpay-card-body">
                      <div className="catchpay-card-brand">
                        <img src={card.brandLogo} alt="catchtable pay logo" />
                        <span>{card.brandLabel}</span>
                      </div>
                      <div className="catchpay-card-info">
                        <div className="catchpay-card-company">{card.cardCompany}</div>
                        <div className="catchpay-card-meta">
                          <span className="catchpay-card-badge">{card.cardType}</span>
                          <span>{card.cardNumber}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                <button type="button" className="catchpay-card catchpay-card--add">
                  <div className="catchpay-card-body">
                    <div className="catchpay-card-title">새 카드 추가</div>
                    <div className="catchpay-card-meta">+ Add Card</div>
                  </div>
                </button>
              </div>
            </div>

            <label className="payment-method inline">
              <input type="radio" name="payment" className="payment-radio" />
              <span className="payment-method-label">일반 결제</span>
            </label>
          </div>
        </section>

        <section className="payment-section coupon-row">
          <div className="payment-title">% 할인 쿠폰</div>
          <span className="coupon-chevron">›</span>
        </section>

        <section className="payment-section">
          <h2 className="payment-title">결제 정보</h2>

          <div className="summary-list">
            <div className="summary-row">
              <span>티켓 금액</span>
              <span className="summary-plus">+ {totalPrice.toLocaleString()}원</span>
            </div>
            <div className="summary-row muted">
              <span>예매 수수료</span>
              <span className="summary-plus">+ 0원</span>
            </div>
            <div className="summary-row muted">
              <span>할인 수단</span>
              <span className="summary-minus">- 0원</span>
            </div>

            <div className="summary-row total">
              <span>최종 결제 금액</span>
              <span className="summary-total">{totalPrice.toLocaleString()}원</span>
            </div>
          </div>
        </section>

        <section className="payment-section">
          <h2 className="payment-title">약관 동의</h2>

          <label className="agree-all">
            <input type="checkbox" checked={allAgreed} onChange={handleAllAgree} />
            <span>모두 동의합니다.</span>
          </label>

          <div className="agree-list">
            <label className="agree-item">
              <input type="checkbox" checked={agreeThirdParty} onChange={() => setAgreeThirdParty(prev => !prev)} />
              <span>개인정보 제 3자 제공 동의</span>
              <span className="agree-chevron">›</span>
            </label>

            <label className="agree-item">
              <input type="checkbox" checked={agreeRefund} onChange={() => setAgreeRefund(prev => !prev)} />
              <span>예약 취소/변경에 대한 환불 정책 동의</span>
              <span className="agree-chevron">›</span>
            </label>
          </div>
        </section>
      </main>

      <footer className="rs-footer payment-footer">
        <div className="price-row">
          <span>방문 일자</span>
          <strong>{formattedVisitDate}</strong>
        </div>
        <div className="price-row">
          <span>최종 결제 금액</span>
          <strong>{totalPrice.toLocaleString()}원</strong>
        </div>
        <button className="cta-btn" type="button" onClick={onPay} disabled={!allAgreed || totalPrice <= 0}>
          결제하기 · {totalPrice.toLocaleString()}원
        </button>
      </footer>
    </div>
  )
}
