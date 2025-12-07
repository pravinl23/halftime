import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { recordInterest } from '../api'
import styles from './Home.module.css'

interface HomeProps {
  userId: string
}

const INTEREST_TILES = [
  { id: 'xbox', label: 'Watch Xbox Highlight', emoji: '🎮', category: 'Gaming' },
  { id: 'computer_science', label: 'Watch CS Tutorial', emoji: '💻', category: 'Tech' },
  { id: 'dolls', label: 'Watch Doll Unboxing', emoji: '🎀', category: 'Lifestyle' },
  { id: 'anime', label: 'Watch Anime Clip', emoji: '⛩️', category: 'Entertainment' },
  { id: 'cooking', label: 'Watch Cooking Video', emoji: '🍳', category: 'Lifestyle' },
  { id: 'esports', label: 'Watch Esports Match', emoji: '🏆', category: 'Gaming' },
  { id: 'ai', label: 'Watch AI Demo', emoji: '🤖', category: 'Tech' },
  { id: 'music', label: 'Watch Music Video', emoji: '🎵', category: 'Entertainment' },
]

export default function Home({ userId }: HomeProps) {
  const navigate = useNavigate()
  const [clickedTiles, setClickedTiles] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<string | null>(null)

  const handleTileClick = async (tileId: string) => {
    setLoading(tileId)
    try {
      await recordInterest(userId, tileId, 5)
      setClickedTiles(prev => new Set([...prev, tileId]))
    } catch (err) {
      console.error('Failed to record interest:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◉</span>
          <span>halftime</span>
        </div>
        <button className={styles.profileBtn} onClick={() => navigate('/profile')}>
          View My Profile →
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Simulate On-Site Behavior</h1>
          <p>
            Click on tiles below to simulate watching content. Each click records an interest event 
            that will be reflected in your profile.
          </p>
        </div>

        <div className={styles.grid}>
          {INTEREST_TILES.map(tile => (
            <button
              key={tile.id}
              className={`${styles.tile} ${clickedTiles.has(tile.id) ? styles.clicked : ''}`}
              onClick={() => handleTileClick(tile.id)}
              disabled={loading === tile.id}
            >
              <span className={styles.tileEmoji}>{tile.emoji}</span>
              <span className={styles.tileLabel}>{tile.label}</span>
              <span className={styles.tileCategory}>{tile.category}</span>
              {clickedTiles.has(tile.id) && (
                <span className={styles.tileBadge}>+5</span>
              )}
              {loading === tile.id && (
                <span className={styles.tileLoading}>...</span>
              )}
            </button>
          ))}
        </div>

        <div className={styles.cta}>
          <p>Done interacting?</p>
          <button className={styles.viewProfileBtn} onClick={() => navigate('/profile')}>
            View Inferred Profile
          </button>
        </div>
      </main>
    </div>
  )
}

