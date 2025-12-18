import { useState } from 'react'

import './ReservationSelectScreen.css'

export interface SuccessSummary {
  title: string
  dateText: string
  timeText: string
  peopleText: string
}

export interface SuccessRecommendation {
  id: string
  name: string
  rating: string
  meta: string
}

interface SuccessScreenProps {
  summary: SuccessSummary
  recommendations: SuccessRecommendation[]
  onClose: () => void
  onSelectRecommendation: (id: string) => void
}

export function ReservationSuccessScreen({ summary, recommendations, onClose, onSelectRecommendation }: SuccessScreenProps) {
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({})

  const toggleSave = (id: string) => {
    setSavedIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const { title, dateText, timeText, peopleText } = summary

  return (
    <div className="reservation-screen success-screen">
      <header className="success-header">
        <button className="ghost" type="button" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </header>

      <main className="success-content">
        <h1 className="success-title">예매를 완료했습니다.</h1>

        <div className="success-card">
          <div className="success-thumb" />
          <p className="success-meta-title">{title}</p>
          <p className="success-meta-sub">
            {dateText} · {timeText} · {peopleText}
          </p>
        </div>

        <section className="recommend-section">
          <div className="recommend-header">
            <p className="recommend-title">식사는 이런 곳 어때요?</p>
            <button className="recommend-see-all" type="button">
              전체 보기 <span className="chevron">›</span>
            </button>
          </div>

          <div className="poi-detail__experience-list success-recommend-list">
            {recommendations.map(item => (
              <article
                key={item.id}
                className="poi-detail__experience-card"
                role="button"
                tabIndex={0}
                onClick={() => onSelectRecommendation(item.id)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelectRecommendation(item.id)
                  }
                }}
              >
                <div className="poi-detail__experience-media" />
                <div className="poi-detail__experience-body">
                  <div className="poi-detail__experience-title-row">
                    <span className="poi-detail__experience-title">{item.name}</span>
                    <button
                      className={`bookmark-btn ${savedIds[item.id] ? 'active' : ''}`}
                      onClick={event => {
                        event.stopPropagation()
                        toggleSave(item.id)
                      }}
                      type="button"
                      aria-label="저장"
                    >
                      🔖
                    </button>
                  </div>
                  <div className="poi-detail__experience-meta">
                    <span>⭐ {item.rating}</span>
                    <span>{item.meta}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
