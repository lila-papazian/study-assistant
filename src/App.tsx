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

  return (
    <section className="upload-panel">
      <label className="text-input-label">
        <span>Select PDF</span>

        <input
          type="file"
          accept=".pdf"
          className="file-input"
          onChange={handleFileUpload}
        />
      </label>

      {selectedFile && (
        <p>
          Selected file: {selectedFile.name}
        </p>
      )}

      <button
        className="convert-button"
        type="button"
        disabled={isConvertDisabled}
        onClick={handleConvert}
      >
        {buttonLabel}
      </button>

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      {summary && (
        <section
          className="summary-result"
          aria-label="Summary"
        >
          <h2>Summary</h2>

          <SummaryMarkdown content={summary} />
        </section>
      )}
    </section>
  );
}

export default App;