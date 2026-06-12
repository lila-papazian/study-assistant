import { useState } from 'react'
import './App.css'

type ConversionStatus = 'idle' | 'loading' | 'success'

function App() {
  const [text, setText] = useState('')
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')
  const [conversionStatus, setConversionStatus] =
    useState<ConversionStatus>('idle')

  const handleConvert = async () => {
    const textToSummarize = text.trim()

    if (!textToSummarize) {
      return 
    }

    setConversionStatus('loading')
    setSummary('')
    setError('')

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textToSummarize }),
      })

      if (!response.ok) {
        throw new Error('Request failed')
      }

      const data = (await response.json()) as { summary?: string }

      setSummary(data.summary ?? '')
      setConversionStatus('success')
    } catch {
      setError('Unable to summarize. Please try again.')
      setConversionStatus('idle')
    }
  }

  const isConverting = conversionStatus === 'loading'
  const isConvertDisabled = isConverting || text.trim().length === 0

  return (
    <>
      <section className="upload-panel">
        <label className="text-input-label">
          <span>Text to summarize</span>
          <textarea
            className="summary-input"
            placeholder="Paste text here..."
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              setConversionStatus('idle')
              setSummary('')
              setError('')
            }}
          />
        </label>

        <button
          className="convert-button"
          type="button"
          disabled={isConvertDisabled}
          onClick={handleConvert}
        >
          {isConverting
            ? 'Converting...'
            : conversionStatus === 'success'
              ? 'Converted'
              : 'Convert'}
        </button>

        {error && <p className="error-message">{error}</p>}

        {summary && (
          <section className="summary-result" aria-label="Summary">
            <h2>Summary</h2>
            <p>{summary}</p>
          </section>
        )}
      </section>
    </>
  )
}

export default App
