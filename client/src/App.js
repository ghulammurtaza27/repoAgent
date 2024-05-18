import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark, coy } from 'react-syntax-highlighter/dist/esm/styles/prism';
import styled, { ThemeProvider } from 'styled-components';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const darkTheme = {
  background: '#121212',
  color: '#ffffff',
};

const lightTheme = {
  background: '#ffffff',
  color: '#000000',
};

const Container = styled.div`
  min-height: 100vh;
  background-color: ${(props) => props.theme.background};
  color: ${(props) => props.theme.color};
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #007bff;
  color: white;
`;

const Main = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const Section = styled.section`
  width: 100%;
  max-width: 600px;
  margin: 2rem 0;
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: ${(props) => (props.darkMode ? '#333' : '#fff')};
  color: ${(props) => (props.darkMode ? '#fff' : '#000')};
`;

const StyledCodeBlock = styled.div`
  max-width: 100%;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  position: relative;
  margin-top: 1rem;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  background-color: ${(props) => (props.darkMode ? '#555' : '#ddd')};
  color: ${(props) => (props.darkMode ? '#fff' : '#000')};
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 0 4px 0 4px;
  z-index: 1;
`;

const CopiedMessage = styled.div`
  position: absolute;
  top: -30px;
  right: 0;
  background-color: #28a745;
  color: white;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
`;

function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');

  useEffect(() => {
    // Fetch the list of repositories on initial load
    axios.get('http://localhost:3001/api/repos')
      .then(response => {
        setRepositories(response.data);
      })
      .catch(error => {
        console.error('Error fetching repositories:', error);
      });
  }, []);

  const uploadRepo = () => {
    setIsUploading(true);
    axios.post('http://localhost:3001/api/upload-repo', { repoUrl })
      .then(response => {
        setSessionId(response.data.sessionId);
        setUploadMessage('Repository uploaded and parsed successfully');
        setRepositories(prevRepos => [...prevRepos, { sessionId: response.data.sessionId, repoName: response.data.repoName }]);
        setIsUploading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setUploadMessage('Error uploading repository');
        setIsUploading(false);
      });
  };

  const askQuestion = () => {
    if (!selectedRepo) {
      setAnswer('Please select a repository.');
      return;
    }

    setIsAsking(true);
    axios.post('http://localhost:3001/api/ask', { sessionId: selectedRepo, question })
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

  const deleteRepo = (sessionId) => {
    axios.delete(`http://localhost:3001/api/repos/${sessionId}`)
      .then(response => {
        setRepositories(prevRepos => prevRepos.filter(repo => repo.sessionId !== sessionId));
      })
      .catch(error => {
        console.error('Error deleting repository:', error);
      });
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Hide the copied message after 2 seconds
  };

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <Container>
        <Header>
          <div className="text-2xl font-bold">RepoQA</div>
          <nav>
            <ul className="flex space-x-4">
              <li><a href="#upload" className="hover:underline">Upload Repo</a></li>
              <li><a href="#ask" className="hover:underline">Ask Question</a></li>
              <li><a href="#repos" className="hover:underline">Repositories</a></li>
              <li><a href="#faq" className="hover:underline">FAQ</a></li>
            </ul>
          </nav>
          <button onClick={toggleDarkMode} 
            className={`px-4 py-2 rounded ${darkMode ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'}`}>
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </Header>

        <Main>
          <Section className="text-center my-10">
            <h1 className="text-4xl font-bold mb-5">Welcome to RepoQA</h1>
            <p className="text-lg mb-5">Upload your GitHub repository and get answers to your questions about the code.</p>
            <button onClick={() => document.getElementById('upload').scrollIntoView({ behavior: 'smooth' })} className="bg-blue-500 text-white px-6 py-3 rounded-full text-lg font-bold hover:bg-blue-600 transition duration-300">
              Get Started
            </button>
          </Section>

          <Section id="upload">
            <h2 className="text-3xl font-bold mb-5 text-center">Upload Your Repository</h2>
            <input
              type="text"
              value={repoUrl}
              onChange={e => setRepoUrl(e.target.value)}
              placeholder="Enter GitHub repository URL..."
              className={`w-full p-3 border rounded mb-5 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
            />
            <button onClick={uploadRepo} disabled={isUploading} className="w-full bg-blue-500 text-white px-4 py-3 rounded-full font-bold hover:bg-blue-600 transition duration-300">
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
            {uploadMessage && (
              <div className={`mt-5 p-4 border rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
                {uploadMessage}
              </div>
            )}
          </Section>

          <Section id="ask">
            <h2 className="text-3xl font-bold mb-5 text-center">Ask a Question</h2>
            <select
              value={selectedRepo}
              onChange={e => setSelectedRepo(e.target.value)}
              className={`w-full p-3 border rounded mb-5 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
            >
              <option value="">Select a repository</option>
              {repositories.map(repo => (
                <option key={repo.sessionId} value={repo.sessionId}>
                  {repo.repoName}
                </option>
              ))}
            </select>
            <Textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Type your question here..."
              darkMode={darkMode}
            />
            <button onClick={askQuestion} disabled={isAsking} className="w-full bg-blue-500 text-white px-4 py-3 rounded-full font-bold hover:bg-blue-600 transition duration-300">
              {isAsking ? 'Asking...' : 'Ask'}
            </button>
            {answer && (
              <div className={`mt-5 p-4 border rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <StyledCodeBlock darkMode={darkMode}>
                          <CopyToClipboard text={String(children).replace(/\n$/, '')} onCopy={handleCopy}>
                            <CopyButton darkMode={darkMode}>Copy</CopyButton>
                          </CopyToClipboard>
                          {copied && <CopiedMessage>Copied!</CopiedMessage>}
                          <SyntaxHighlighter
                            style={darkMode ? dark : coy}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        </StyledCodeBlock>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {answer}
                </ReactMarkdown>
              </div>
            )}
          </Section>

          <Section id="repos">
            <h2 className="text-3xl font-bold mb-5 text-center">Uploaded Repositories</h2>
            <ul>
              {repositories.map(repo => (
                <li key={repo.sessionId} className={`p-4 border rounded mb-3 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  <div className="flex justify-between items-center">
                    <span>{repo.repoName}</span>
                    <button onClick={() => deleteRepo(repo.sessionId)} className="bg-red-500 text-white px-4 py-2 rounded-full font-bold hover:bg-red-600 transition duration-300">
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          {/* FAQ Section */}
          <Section id="faq">
            <h2 className="text-3xl font-bold mb-5 text-center">Frequently Asked Questions</h2>
            <div className="px-5">
              <p><strong>Q: What is RepoQA?</strong></p>
              <p>A: RepoQA is a web application that allows you to upload GitHub repositories and ask questions about the code. It uses advanced AI models to analyze and provide answers.</p>

              <p><strong>Q: What can I do with RepoQA?</strong></p>
              <p>A: With RepoQA, you can:</p>
              <ul>
                <li>Upload your GitHub repositories and have them analyzed.</li>
                <li>Ask questions about the code within your uploaded repositories.</li>
                <li>Receive answers based on the analysis performed by RepoQA's AI models.</li>
                <li>Manage your uploaded repositories and delete them if needed.</li>
                <li>Toggle between light and dark mode for better readability.</li>
              </ul>

              <p><strong>Q: Is there any limit to the number of repositories I can upload?</strong></p>
              <p>A: No, there is no limit to the number of repositories you can upload.</p>

              <p><strong>Q: Can I ask questions about any code?</strong></p>
              <p>A: Yes, you can ask questions about any code within the uploaded repositories.</p>

              <p><strong>Q: How accurate are the answers provided by RepoQA?</strong></p>
              <p>A: RepoQA uses state-of-the-art natural language processing models to analyze code and provide answers. While it strives for accuracy, the quality of answers may vary depending on the complexity of the code and the nature of the question.</p>

              <p><strong>Q: Is my code safe and secure with RepoQA?</strong></p>
              <p>A: Yes, your code is safe and secure with RepoQA. We take data privacy and security seriously and ensure that your code remains confidential.</p>
            </div>
          </Section>

        </Main>

        <footer className="w-full p-5 bg-blue-500 text-white text-center">
          © 2024 RepoQA. All rights reserved.
        </footer>
      </Container>
    </ThemeProvider>
  );
}

export default App;

