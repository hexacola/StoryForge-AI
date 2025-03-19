# Interactive Book Generator 📚

## Overview
The Interactive Book Generator is a web application that uses AI to create complete books based on your prompts. Simply enter a topic, and the application will generate a book with 20 chapters, professional cover art, and complete audio narration - all powered by the Pollinations.ai API.

![Interactive Book Generator](https://image.pollinations.ai/prompt/Interactive%20book%20generator%20web%20application%20with%20book%20cover%2C%20chapters%20and%20audio%20narration%20ui%20interface?width=800&height=400&nologo=true)

## ✨ Features

- **Complete Book Generation**: Creates full-length books with 20 detailed chapters
- **Cover Art**: Generates professional book covers based on your topic
- **Audio Narration**: Provides audio versions of each chapter with selectable voices
- **Different AI Models**: Choose from multiple text generation models for different writing styles
- **PDF Export**: Download your generated books as PDF files
- **Local Library**: Save your favorite books in your browser for later reading
- **Responsive Design**: Works on desktop and mobile devices

## 💰 Pricing Plans

StoryForge AI offers two subscription tiers:

### Free Plan: Storyteller
- Generate up to 3 books per month
- Access to 2 narrator voices (Nova and Alloy)
- Basic text generation models
- PDF download capability

### Premium Plan: Master Wordsmith - €9.99/month
- Unlimited book generation
- Access to all 6 narrator voices
- All AI models including premium models
- Priority generation
- Enhanced cover art
- Commercial use license

## 📄 Content License

All content generated with StoryForge AI is covered by our permissive license that allows:

- **Personal Use**: Unrestricted use for personal, non-commercial purposes
- **Commercial Use**: Use in commercial projects with attribution to "StoryForge AI by Tauris Gramauskas"
- **Derivative Works**: Creation of derivative works based on generated content
- **Distribution**: Distribution of generated content or derivative works

For full license details, see [LICENSE.md](LICENSE.md).

## 🚀 Quick Start

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/interactive-book-generator.git
   ```

2. Open the project folder:
   ```
   cd interactive-book-generator
   ```

3. Since this is a client-side application, you can simply open `index.html` in your browser, or use a local server:
   ```
   python -m http.server
   ```
   Then visit `http://localhost:8000` in your browser.

4. Alternatively, you can deploy it to any static web hosting service.

## 🔧 How It Works

1. **Enter a prompt**: Type any topic, genre, or specific story idea
2. **Choose options**: Select your preferred AI model and narrator voice
3. **Generate**: Click the "Generate Book" button and wait for the magic to happen
4. **Read & Listen**: Navigate through chapters and listen to audio narration
5. **Save or Export**: Save to your library or download as PDF

## 🧰 Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **AI Services**: [Pollinations.ai API](https://pollinations.ai)
  - Text Generation: OpenAI GPT-4o, GPT-4o-mini, Mistral, Llama, DeepSeek
  - Image Generation: Stable Diffusion models
  - Audio Generation: Text-to-speech models
- **Libraries**: Font Awesome (icons), html2pdf.js (PDF export)

## 📋 API Usage

This project uses the Pollinations.ai API for all AI generation tasks:

- **Image Generation**: `https://image.pollinations.ai/prompt/{prompt}`
- **Text Generation**: `https://text.pollinations.ai/{prompt}` or POST to `https://text.pollinations.ai/`
- **Audio Generation**: Uses the `openai-audio` model with different voice options

For more details on the API, see the [Pollinations.ai API Documentation](https://pollinations.ai/docs).

## 📈 Future Improvements

- Support for more languages
- Custom book styling options
- Character artwork generation
- Collaborative book editing
- Direct publishing to e-book platforms

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

Content generated with this application is covered by a separate [content license](LICENSE.md).

## 🙏 Acknowledgements

- [Pollinations.ai](https://pollinations.ai) for providing the AI API services
- [Font Awesome](https://fontawesome.com) for icons
- [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) for PDF export functionality
- [Google Fonts](https://fonts.google.com/) for beautiful typography 