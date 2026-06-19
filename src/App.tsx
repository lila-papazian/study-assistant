import { useState } from 'react';
import './App.css';

import { uploadPdf, summarizeStream } from './services/api';
import SummaryMarkdown from './components/SummaryMarkdown';

type ConversionStatus =
  | 'idle'
  | 'uploading'
  | 'summarizing'
  | 'success'
  | 'error';

function App() {
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');

  const [conversionStatus, setConversionStatus] =
    useState<ConversionStatus>('idle');

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);
    setSummary('');
    setError('');
    setConversionStatus('idle');
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      return;
    }

    try {
      setError('');
      setSummary('');

      setConversionStatus('uploading');

      const uploadData = await uploadPdf(
        selectedFile
      );

      setConversionStatus('summarizing');

      await summarizeStream(
        uploadData.text,
        (token: string) => {
          setSummary(
            previous => previous + token
          );
        }
      );

      setConversionStatus('success');
    } catch (error) {
      console.error(error);

      setConversionStatus('error');

      setError(
        'Failed to process PDF. Please try again.'
      );
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([summary], {
      type: "text/markdown",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedFile?.name.split('.')[0] || 'study'}-notes.md`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const isBusy =
    conversionStatus === 'uploading' ||
    conversionStatus === 'summarizing';

  const isConvertDisabled =
    isBusy || !selectedFile;

  const buttonLabel = (() => {
    switch (conversionStatus) {
      case 'uploading':
        return 'Uploading PDF...';

      case 'summarizing':
        return 'Generating summary...';

      case 'success':
        return 'Summary generated';

      case 'error':
        return 'Try again';

      default:
        return 'Generate summary';
    }
  })();

  const getStatusMessage = (): string => {
    switch (conversionStatus) {
      case 'uploading':
        return 'Uploading your material...';
      case 'summarizing':
        return 'Generating study notes...';
      case 'success':
        return 'Study notes generated successfully.';
      case 'error':
        return error || 'An error occurred. Please try again.';
      default:
        return '';
    }
  };

  return (
    <>
      <header className="app-header">
        <p>Folio</p>
        <p className="tagline">Tame the unread stack.</p>
        <p className="header-description">
          Transform course material into focused study notes.
        </p>
      </header>

      <section className="supported-materials">
        <p>Supported Materials</p>
        <ul className="materials-list">
          <li>Lecture notes</li>
          <li>Course PDFs</li>
          <li>Slide decks</li>
          <li>Study guides</li>
        </ul>
      </section>

      <section className="trust-statement">
        <p className="trust-item">
          <strong>Local-first by design.</strong>
        </p>
        <p className="trust-item">
          Your study material remains under your control.
        </p>
      </section>

      <main className="workspace">
        <section className="upload-section">
          <p className="upload-title">Upload Study Material</p>

          <label className="file-input-wrapper">
            <span className="file-input-label">Choose file or drag and drop</span>

            <input
              type="file"
              accept=".pdf"
              className="file-input"
              onChange={handleFileUpload}
              aria-label="Upload PDF study material"
            />
          </label>

          {selectedFile && (
            <div className="file-metadata">
              <p className="metadata-label">Material:</p>
              <p className="metadata-value">{selectedFile.name}</p>
              <p className="metadata-hint">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          <div className="workflow-steps">
            <div className={`step ${selectedFile ? 'active' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Upload material</span>
            </div>
            <div className={`step ${conversionStatus === 'summarizing' || conversionStatus === 'success' ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Generate summary</span>
            </div>
            <div className={`step ${conversionStatus === 'success' ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Review notes</span>
            </div>
          </div>

          <div className="action-area">
            <button
              className="convert-button"
              type="button"
              disabled={isConvertDisabled}
              onClick={handleConvert}
            >
              {buttonLabel}
            </button>

            {conversionStatus !== 'idle' && conversionStatus !== 'success' && (
              <div className="status-message" role="status" aria-live="polite">
                {getStatusMessage()}
              </div>
            )}

            {conversionStatus === 'error' && error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}
          </div>
        </section>

        {summary && (
          <section className="study-notes-result" aria-label="Generated Study Notes">
            <button
              type="button"
              className="download-button"
              onClick={handleDownloadMarkdown}
            >
              Download notes
            </button>
            <p>Generated Study Notes</p>

            <SummaryMarkdown content={summary} />
          </section>
        )}
      </main>
    </>
  );
}

export default App;