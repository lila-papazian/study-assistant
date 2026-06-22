import { useState, useRef, lazy, Suspense, useEffect } from 'react';
import './App.css';

import { uploadPdf, summarizeStream } from './services/api';

const SummaryMarkdown = lazy(() => import('./components/SummaryMarkdown'));

type ConversionStatus =
  | 'idle'
  | 'uploading'
  | 'summarizing'
  | 'success'
  | 'error';

const loadingMessages = [
  'Distilling key concepts...',
  'Organizing your study notes...',
  'Pulling out the important bits...',
  'Structuring the material...',
];

function App() {
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const abortOnLeave = () => {
      abortControllerRef.current?.abort();
    };

    window.addEventListener('beforeunload', abortOnLeave);
    window.addEventListener('pagehide', abortOnLeave);

    return () => {
      window.removeEventListener('beforeunload', abortOnLeave);
      window.removeEventListener('pagehide', abortOnLeave);
    };
  }, []);

  const loadingMessage =
    useRef(
      loadingMessages[
      Math.floor(
        Math.random() *
        loadingMessages.length
      )
      ]
    );

  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');

  const [isDragging, setIsDragging] =
    useState(false);

  const [conversionStatus, setConversionStatus] =
    useState<ConversionStatus>('idle');

  const resetWorkflow = () => {
    setSummary('');
    setError('');
    setConversionStatus('idle');
  };

  const MAX_FILE_SIZE = 50 * 1024 * 1024;

  const handleSelectedFile = (
    file: File
  ) => {
    resetWorkflow();

    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setError(
        'Please select a PDF file.'
      );

      return;
    }

    if (file.size === 0) {
      setError(
        'The selected file is empty.'
      );

      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(
        'File is too large. Maximum size is 50 MB.'
      );

      return;
    }

    setSelectedFile(file);
  };
  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    handleSelectedFile(file);
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLLabelElement>
  ) => {
    event.preventDefault();

    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (
    event: React.DragEvent<HTMLLabelElement>
  ) => {
    if (
      event.currentTarget.contains(
        event.relatedTarget as Node
      )
    ) {
      return;
    }

    setIsDragging(false);
  };

  const handleDrop = (
    event: React.DragEvent<HTMLLabelElement>
  ) => {
    event.preventDefault();

    setIsDragging(false);

    const file =
      event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    handleSelectedFile(file);
  };

const handleConvert = async () => {
    if (!selectedFile) {
      return;
    }

    if (conversionStatus === 'success') {
      resetWorkflow();
      return;
    }

    loadingMessage.current =
      loadingMessages[
        Math.floor(Math.random() * loadingMessages.length)
      ];

    setError('');
    setSummary('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setConversionStatus('uploading');

      const uploadData = await uploadPdf(selectedFile, controller.signal);

      setConversionStatus('summarizing');

      try {
        await summarizeStream(
          uploadData.text,
          (token: string) => {
            setSummary(previous => previous + token);
          },
          controller.signal
        );
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }

        setConversionStatus('error');
        setError('Failed to generate summary. Please try again.');
        return;
      }

      setConversionStatus('success');
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }

      setConversionStatus('error');
      setError('Failed to upload PDF. The file may be too large or corrupted.');
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    resetWorkflow();
  };

  const handleDownloadMarkdown = () => {
    const markdownContent = `
# Study Notes

Source: ${selectedFile?.name.split('.')[0]}
Generated: ${new Date().toLocaleDateString()}

---

${summary}
`;

    const blob = new Blob(
      [markdownContent],
      {
        type: 'text/markdown',
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;

    link.download = `${selectedFile?.name.split('.')[0] ??
      'study'
      }-notes.md`;

    link.click();

    URL.revokeObjectURL(url);
  };

  const isBusy =
    conversionStatus === 'uploading' ||
    conversionStatus === 'summarizing';

  const isConvertDisabled =
    isBusy || (!selectedFile && conversionStatus !== 'error');


  const buttonLabel = (() => {
    switch (conversionStatus) {
      case 'uploading':
        return 'Uploading PDF...';

      case 'summarizing':
        return 'Generating summary...';

      case 'success':
        return 'Convert another';

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
        return loadingMessage.current;

      case 'success':
        return 'Study notes generated successfully.';

      case 'error':
        return (
          error ??
          'An error occurred. Please try again.'
        );

      default:
        return '';
    }
  };

  return (
    <>
      <header className="app-header">
        <h1>Folio</h1>

        <p className="tagline">
          Tame the unread stack.
        </p>

        <p className="header-description">
          Transform course material into
          focused study notes.
        </p>
      </header>

      <section className="supported-materials">
        <h2>Supported Materials</h2>

        <ul className="materials-list">
          <li>Lecture notes</li>
          <li>Course PDFs</li>
          <li>Slide decks</li>
          <li>Study guides</li>
        </ul>
      </section>

      <section className="trust-statement">
        <p className="trust-item">
          <strong>
            Local-first by design.
          </strong>
        </p>

        <p className="trust-item">
          Your study material remains under
          your control.
        </p>
      </section>

      <main className="workspace">
        <section className="upload-section">
          <h2 className="upload-title">
            Upload Study Material
          </h2>

          <label
            className={`file-input-wrapper ${isDragging
              ? 'drag-active'
              : ''
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <span className="file-input-label">
              Drop a PDF here or click to
              browse
            </span>

            <p className="file-input-hint">
              Lecture notes, course PDFs,
              slide decks and study guides
            </p>

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
              <p className="metadata-label">
                Material:
              </p>

              <p className="metadata-value">
                {selectedFile.name}
              </p>

              <p className="metadata-hint">
                {(
                  selectedFile.size /
                  1024 /
                  1024
                ).toFixed(2)}{' '}
                MB
              </p>
            </div>
          )}

          <div className="workflow-steps">
            <div
              className={`step ${selectedFile
                ? 'active'
                : ''
                }`}
            >
              <span className="step-number">
                1
              </span>

              <span className="step-label">
                Upload material
              </span>
            </div>

            <div
              className={`step ${conversionStatus ===
                'summarizing' ||
                conversionStatus ===
                'success'
                ? 'active'
                : ''
                }`}
            >
              <span className="step-number">
                2
              </span>

              <span className="step-label">
                Generate summary
              </span>
            </div>

            <div
              className={`step ${conversionStatus ===
                'success'
                ? 'active completed'
                : ''
                }`}
            >
              <span className="step-number">
                {conversionStatus ===
                  'success'
                  ? '\u2713'
                  : '3'}
              </span>

              <span className="step-label">
                Review notes
              </span>
            </div>
          </div>

          <div className="action-area">
            <div className="action-buttons">
              <button
                className="convert-button"
                type="button"
                disabled={isConvertDisabled}
                onClick={handleConvert}
              >
                {buttonLabel}
              </button>

              {isBusy && (
                <button
                  className="cancel-button"
                  type="button"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              )}
            </div>

            {conversionStatus !== 'idle' && conversionStatus !== 'success' && (
              <div className="status-message" role="status" aria-live="polite">
                {getStatusMessage()}
              </div>
            )}

          </div>
        </section>

        {summary && (
          <section
            className="study-notes-result"
            aria-label="Generated Study Notes"
          >
            <button
              type="button"
              className="download-button"
              onClick={
                handleDownloadMarkdown
              }
            >
              Download notes
            </button>

            <h2>
              Generated Study Notes
            </h2>

            <Suspense
              fallback={
                <p className="status-message">
                  Loading renderer...
                </p>
              }
            >
              <SummaryMarkdown
                content={summary}
              />
            </Suspense>
          </section>
        )}
      </main>
    </>
  );
}

export default App;