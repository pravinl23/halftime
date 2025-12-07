import { useState } from 'react'
import { login } from '../api'
import styles from './Login.module.css'

interface LoginProps {
  onLogin: (userId: string) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [loading, setLoading] = useState(false)

  const handleDemoLogin = async () => {
    setLoading(true)
    try {
      const res = await login('demo_user', {
        age: 21,
        country: 'US',
        tags: ['cs_student', 'gamer'],
      })
      if (res.success) {
        onLogin(res.user_id)
      }
    } catch (err) {
      console.error('Login failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.grid} />
      <div className={styles.content}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◉</span>
          <span className={styles.logoText}>halftime</span>
        </div>
        <h1 className={styles.title}>User Profile Service</h1>
        <p className={styles.subtitle}>
          Grok-powered interest harvesting and profile inference
        </p>
        <button
          className={styles.loginBtn}
          onClick={handleDemoLogin}
          disabled={loading}
        >
          {loading ? 'Initializing...' : 'Continue as Demo User'}
        </button>
        <p className={styles.hint}>
          This will create a user with demographics: 21yo, US, tags: cs_student, gamer
        </p>
      </div>
    </div>
  )
}

