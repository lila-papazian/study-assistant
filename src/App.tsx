import { useState } from 'react'
import './App.css'

type ConversionStatus = 'idle' | 'loading' | 'success'

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')
  const [conversionStatus, setConversionStatus] =
    useState<ConversionStatus>('idle')

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    if (!file) return

    setSelectedFile(file)
  }

  const handleConvert = async () => {
    if (!selectedFile) return;
    setConversionStatus('loading')
    setError('')
    setSummary('')
  }

  const isConverting = conversionStatus === 'loading'
  const isConvertDisabled = isConverting || !selectedFile

  return (
    <>
      <section className="upload-panel">
        <label className="text-input-label">
          <span>Drop file here</span>
          <input
            type="file"
            className="file-input"
            onChange={handleFileUpload}
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
