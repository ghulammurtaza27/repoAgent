import React, { useState } from 'react';
import axios from 'axios';
import './index.css';

function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  const uploadRepo = () => {
    setIsUploading(true);
    axios.post('http://localhost:3001/api/upload-repo', { repoUrl })
      .then(response => {
        setSessionId(response.data.sessionId);
        setUploadMessage('Repository uploaded and parsed successfully');
        setIsUploading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setUploadMessage('Error uploading repository');
        setIsUploading(false);
      });
  };

  const askQuestion = () => {
    setIsAsking(true);
    axios.post('http://localhost:3001/api/ask', { sessionId, question })
      .then(response => {
        setAnswer(response.data);
        setIsAsking(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setAnswer('No Answer, sorry');
        setIsAsking(false);
      });
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <header className="flex justify-between items-center p-5 bg-blue-500 text-white">
        <div className="text-2xl font-bold">RepoQA</div>
        <nav>
          <ul className="flex space-x-4">
            <li><a href="#upload" className="hover:underline">Upload Repo</a></li>
            <li><a href="#ask" className="hover:underline">Ask Question</a></li>
          </ul>
        </nav>
        <button onClick={toggleDarkMode} className="bg-gray-800 text-white px-4 py-2 rounded">
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </header>

      <main className="flex flex-col items-center justify-center p-10">
        <section className="text-center my-10">
          <h1 className="text-4xl font-bold mb-5">Welcome to RepoQA</h1>
          <p className="text-lg mb-5">Upload your GitHub repository and get answers to your questions about the code.</p>
          <button onClick={() => document.getElementById('upload').scrollIntoView({ behavior: 'smooth' })} className="bg-blue-500 text-white px-6 py-3 rounded-full text-lg font-bold hover:bg-blue-600 transition duration-300">
            Get Started
          </button>
        </section>

        <section id="upload" className="w-full max-w-xl my-10">
          <h2 className="text-3xl font-bold mb-5 text-center">Upload Your Repository</h2>
          <input
            type="text"
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            placeholder="Enter GitHub repository URL..."
            className="w-full p-3 border rounded mb-5"
          />
          <button onClick={uploadRepo} disabled={isUploading} className="w-full bg-blue-500 text-white px-4 py-3 rounded-full font-bold hover:bg-blue-600 transition duration-300">
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
          {uploadMessage && (
            <div className="mt-5 p-4 border rounded bg-gray-100">
              {uploadMessage}
            </div>
          )}
        </section>

        <section id="ask" className="w-full max-w-xl my-10">
          <h2 className="text-3xl font-bold mb-5 text-center">Ask a Question</h2>
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Type your question here..."
            className="w-full p-3 border rounded mb-5"
          />
          <button onClick={askQuestion} disabled={isAsking} className="w-full bg-blue-500 text-white px-4 py-3 rounded-full font-bold hover:bg-blue-600 transition duration-300">
            {isAsking ? 'Asking...' : 'Ask'}
          </button>
          {answer && (
            <div className="mt-5 p-4 border rounded bg-gray-100">
              {answer}
            </div>
          )}
        </section>
      </main>

      <footer className="w-full p-5 bg-blue-500 text-white text-center">
        © 2024 RepoQA. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
