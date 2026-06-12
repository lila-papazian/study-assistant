import { useState } from 'react'
import './App.css'
import { getHealth } from './api/health'

type ConversionStatus = 'idle' | 'loading' | 'success'

function App() {
  const [files, setFiles] = useState<File[]>([])
  const [conversionStatus, setConversionStatus] =
    useState<ConversionStatus>('idle')

  const addFiles = (fileList: FileList | null) => {
    if (!fileList?.length) {
      return
    }

    setFiles((currentFiles) => [...currentFiles, ...Array.from(fileList)])
    setConversionStatus('idle')
  }

  const handleConvert = async () => {
    setConversionStatus('loading')

    window.setTimeout(() => {
      setConversionStatus('success')
    }, 1200)

    const data = await getHealth();

    console.log(data);
  }

  const isConverting = conversionStatus === 'loading'

  return (
    <>
      <section className="upload-panel">
        <label
          className="drop-area"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            addFiles(event.dataTransfer.files)
          }}
        >
          <span>Drop files here or choose files</span>
          <input
            type="file"
            multiple
            onChange={(event) => addFiles(event.target.files)}
          />
        </label>

        {files.length > 0 && (
          <ul className="file-list" aria-label="Uploaded files">
            {files.map((file, index) => (
              <li key={`${file.name}-${file.lastModified}-${index}`}>
                {file.name}
              </li>
            ))}
          </ul>
        )}

        <button
          className="convert-button"
          type="button"
          disabled={files.length === 0 || isConverting}
          onClick={handleConvert}
        >
          {isConverting
            ? 'Converting...'
            : conversionStatus === 'success'
              ? 'Converted'
              : 'Convert'}
        </button>
      </section>
    </>
  )
}

export default App
