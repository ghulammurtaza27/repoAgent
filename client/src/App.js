import React, { useState } from 'react';
import axios from 'axios';
import './index.css';



function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const uploadRepo = () => {
    setIsLoading(true);
    axios.post('http://localhost:3001/api/upload-repo', { repoUrl })
      .then(response => {
        setAnswer('Repository uploaded and parsed successfully');
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setAnswer('Error uploading repository');
        setIsLoading(false);
      });
  };

  const askQuestion = () => {
    setIsLoading(true);
    axios.post('http://localhost:3001/api/ask', { question })
      .then(response => {
        setAnswer(response.data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setAnswer('No Answer, sorry');
        setIsLoading(false);
      });
  };

  return (
    <div className="App">
      <h1>Ask Question About GitHub Repository</h1>
      <div>
        <input
          type="text"
          value={repoUrl}
          onChange={e => setRepoUrl(e.target.value)}
          placeholder="Enter GitHub repository URL..."
        />
        <button onClick={uploadRepo} disabled={isLoading}>
          {isLoading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      <div>
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Type your question here..."
        />
      </div>
      <button onClick={askQuestion} disabled={isLoading}>
        {isLoading ? 'Asking...' : 'Ask'}
      </button>
      {answer && (
        <div className="answer">{answer}</div>
      )}
    </div>
  );
}

export default App;
