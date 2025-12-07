import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfile, UserProfile } from '../api'
import styles from './Profile.module.css'

interface ProfileProps {
  userId: string
}

export default function Profile({ userId }: ProfileProps) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile(userId)
        setProfile(data)
      } catch (err) {
        setError('Failed to load profile')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [userId])

  const refreshProfile = async () => {
    setLoading(true)
    try {
      const data = await getProfile(userId)
      setProfile(data)
    } catch (err) {
      setError('Failed to refresh profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◉</span>
          <span>halftime</span>
        </div>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.titleRow}>
          <div>
            <h1>Data Transparency</h1>
            <p>Here's what we've inferred about you</p>
          </div>
          <button className={styles.refreshBtn} onClick={refreshProfile} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {loading && !profile && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Computing profile...</p>
          </div>
        )}

        {profile && (
          <div className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>{ }</span>
              <span>User Profile JSON</span>
            </div>
            <pre className={styles.json}>
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>
        )}

        <div className={styles.explanation}>
          <h2>How this works</h2>
          <div className={styles.explanationGrid}>
            <div className={styles.explanationItem}>
              <span className={styles.stepNum}>1</span>
              <div>
                <h3>On-site Behavior</h3>
                <p>Each tile you clicked added points to that topic's on-site score</p>
              </div>
            </div>
            <div className={styles.explanationItem}>
              <span className={styles.stepNum}>2</span>
              <div>
                <h3>X/Grok Segment Priors</h3>
                <p>Based on your demographics (cs_student, gamer), we inferred baseline interests</p>
              </div>
            </div>
            <div className={styles.explanationItem}>
              <span className={styles.stepNum}>3</span>
              <div>
                <h3>Score Aggregation</h3>
                <p>Combined scores are mapped to low/medium/high interest levels</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

