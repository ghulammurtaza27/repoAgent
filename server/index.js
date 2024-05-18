const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const simpleGit = require('simple-git');
const glob = require('glob');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI('process.env.API_KEY');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const REPOS_DIR = path.join(__dirname, 'repos');
const SESSIONS_DIR = path.join(__dirname, 'sessions');

// Ensure directories exist
fs.ensureDirSync(REPOS_DIR);
fs.ensureDirSync(SESSIONS_DIR);

// Load sessions from disk
const loadSessions = () => {
  const sessions = {};
  const sessionFiles = glob.sync(`${SESSIONS_DIR}/*.json`);
  sessionFiles.forEach((file) => {
    const sessionId = path.basename(file, '.json');
    sessions[sessionId] = fs.readJsonSync(file);
  });
  return sessions;
};

// Store parsed repositories in memory (for simplicity)
const repositories = loadSessions();

const saveSession = (sessionId, data) => {
  const sessionPath = path.join(SESSIONS_DIR, `${sessionId}.json`);
  fs.writeJsonSync(sessionPath, data, { spaces: 2 });
};

app.post('/api/upload-repo', async (req, res) => {
  const { repoUrl } = req.body;
  const sessionId = uuidv4(); // Generate a unique session ID

  // Extract repo name from URL
  const repoName = path.basename(repoUrl, '.git');
  const localPath = path.join(REPOS_DIR, sessionId);

  try {
    // Clone the repository
    await simpleGit().clone(repoUrl, localPath);

    // Parse the repository files, excluding node_modules, public, and package-lock.json
    const files = glob.sync('**/*.js', {
      cwd: localPath,
      ignore: ['**/node_modules/**', '**/public/**', '**/package-lock.json']
    });

    const codeFiles = files.map(file => ({
      filePath: file,
      content: fs.readFileSync(path.join(localPath, file), 'utf-8')
    }));

    // Store the parsed code files in memory and on disk with the session ID
    repositories[sessionId] = codeFiles;
    saveSession(sessionId, { repoUrl, repoName, codeFiles });

    res.json({ message: 'Repository uploaded and parsed successfully', sessionId, repoName }); // Return session ID and repo name
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Failed to upload and parse repository' });
  }
});

app.post('/api/ask', async (req, res) => {
  const { sessionId, question } = req.body;

  if (!sessionId || !repositories[sessionId]) {
    return res.status(400).json({ error: 'No repository found for the provided session ID' });
  }

  const codeFiles = repositories[sessionId];
  const codeSnippet = codeFiles.map(file => `Filename: ${file.filePath}\n\n${file.content}`).join('\n\n');

  try {
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Prompt construction with guidelines
    const prompt = `
    Here is the relevant code context:
    ${codeSnippet}

    Question: ${question}

    Please provide a detailed and specific response. If there are any bugs, explain the cause and suggest a fix. If the code can be improved, provide optimization suggestions. Ensure the response is clear and actionable.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log(text);

    // Process response from Google Gemini API

    // Return answer to client
    res.json(text);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing with Google Gemini API' });
  }
});

// New API to list all repositories
app.get('/api/repos', (req, res) => {
  const repoList = Object.keys(repositories).map(sessionId => ({
    sessionId,
    repoName: repositories[sessionId][0].repoName
  }));
  res.json(repoList);
});

// New API to delete a repository
app.delete('/api/repos/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  if (repositories[sessionId]) {
    delete repositories[sessionId];
    fs.removeSync(path.join(REPOS_DIR, sessionId));
    fs.removeSync(path.join(SESSIONS_DIR, `${sessionId}.json`));
    res.json({ message: 'Repository deleted successfully' });
  } else {
    res.status(404).json({ error: 'Repository not found' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));





// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const simpleGit = require('simple-git');
// const glob = require('glob');
// const fs = require('fs-extra');
// const path = require('path');
// const { v4: uuidv4 } = require('uuid');
// const { GoogleGenerativeAI } = require("@google/generative-ai");


// const genAI = new GoogleGenerativeAI('AIzaSyAjxWscUGdmejD6WMf3lN1yYjYFije4Bns');

// const app = express();
// app.use(bodyParser.json());
// app.use(cors());

// const repositories = {}; // Store parsed repositories in memory (for simplicity)

// app.post('/api/upload-repo', async (req, res) => {
//   const { repoUrl } = req.body;
//   const sessionId = uuidv4(); // Generate a unique session ID

//   // Extract repo name from URL
//   const repoName = path.basename(repoUrl, '.git');
//   const localPath = path.join(__dirname, 'repos', sessionId);

//   try {
//     // Clone the repository
//     await simpleGit().clone(repoUrl, localPath);

//     // Parse the repository files
//     const files = glob.sync('**/*.js', { cwd: localPath });
//     const codeFiles = files.map(file => ({
//       filePath: file,
//       content: fs.readFileSync(path.join(localPath, file), 'utf-8')
//     }));

//     // Store the parsed code files in memory with the session ID
//     repositories[sessionId] = codeFiles;

//     res.json({ message: 'Repository uploaded and parsed successfully', sessionId }); // Return session ID
//   } catch (error) {
//     console.error('Error:', error.message);
//     res.status(500).json({ error: 'Failed to upload and parse repository' });
//   }
// });

// app.post('/api/ask', async (req, res) => {
//   const { sessionId, question } = req.body;

//   if (!sessionId || !repositories[sessionId]) {
//     return res.status(400).json({ error: 'No repository found for the provided session ID' });
//   }

//   const codeFiles = repositories[sessionId];
//   const codeSnippet = codeFiles.map(file => file.content).join('\n');


//   try {
//     // For text-only input, use the gemini-pro model
//     const model = genAI.getGenerativeModel({ model: "gemini-pro"});

//     const prompt = codeSnippet + ' ' + question;

   

//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();

//     console.log(text);

//     // Process response from Google Gemini API
    

//     // Return answer to client
//     res.json(text);
//   }
//   catch (error) {
//         console.error('Error:', error);
//         res.status(500).json({ error: 'An error occurred while processing with Google Gemini API' });
//       }

// });

// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));









// const express = require('express');
// const bodyParser = require('body-parser');
// const axios = require('axios');
// const app = express();
// const { GoogleGenerativeAI } = require("@google/generative-ai");
// var cors = require('cors')

// app.use(cors()) // Use this after the variable declaration


// const genAI = new GoogleGenerativeAI('AIzaSyBmaijcaMAv9qqBcRGhUL4PW62ol466NRg');

// app.use(bodyParser.json());

// // const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?AIzaSyBmaijcaMAv9qqBcRGhUL4PW62ol466NRg`;


// app.post('/api/ask', async (req, res) => {
//   const { codeSnippet, question } = req.body;





//   try {
//     // For text-only input, use the gemini-pro model
//     const model = genAI.getGenerativeModel({ model: "gemini-pro"});

//     const prompt = codeSnippet + ' ' + question;

//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();
//     console.log(text);
//     // Process response from Google Gemini API
    

//     // Return answer to client
//     res.json(text);
//   }
//   catch (error) {
//         console.error('Error:', error);
//         res.status(500).json({ error: 'An error occurred while processing with Google Gemini API' });
//       }

// });

// //   try {
// //     // Make request to Google Gemini API
// //     const response = await axios.post(apiUrl, codeSnippet + ' ' + question , {
// //       // Include required parameters and authentication credentials
// //       headers: {
// //         'Content-Type': 'application/json'
// //     }
// //       // Add any other parameters required by the Gemini API
// //     }, {

// //     });

// //     // Process response from Google Gemini API
// //     const answer = response.data.answer;

// //     // Return answer to client
// //     res.json({ answer });
// //   } catch (error) {
// //     console.error('Error:', error);
// //     res.status(500).json({ error: 'An error occurred while processing with Google Gemini API' });
// //   }
// // });

// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));




// // Access your API key as an environment variable (see "Set up your API key" above)

