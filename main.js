document.addEventListener('DOMContentLoaded', function() {
  // DOM elementų references
  const userPrompt = document.getElementById('userPrompt');
  const generateBtn = document.getElementById('generateBtn');
  const voiceSelect = document.getElementById('voiceSelect');
  const modelSelect = document.getElementById('modelSelect');
  const saveBtn = document.getElementById('saveBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const progressStatus = document.getElementById('progressStatus');
  const titleElem = document.getElementById('title');
  const coverElem = document.getElementById('cover');
  const contentElem = document.getElementById('content');
  const chapterAudiosElem = document.getElementById('chapterAudios');
  const tableOfContentsElem = document.getElementById('tableOfContents');
  const savedBooksElem = document.getElementById('savedBooks');
  
  // Page navigation handling
  const navLinks = document.querySelectorAll('.nav-link');
  const pages = document.querySelectorAll('.page');
  
  // Function to switch between application pages (generator, library, pricing, about)
  function switchPage(pageId) {
    const links = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    
    // Update active class on nav links
    links.forEach(link => {
      if (link.getAttribute('data-page') === pageId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    
    // Hide all pages and show the target page
    pages.forEach(page => {
      if (page.id === pageId) {
        page.classList.add('active');
      } else {
        page.classList.remove('active');
      }
    });
    
    // Update URL hash
    window.location.hash = pageId;
    
    // Scroll to top
    window.scrollTo(0, 0);
  }
  
  // Setup navigation events for the main tabs
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPage = link.getAttribute('data-page');
      switchPage(targetPage);
    });
  });
  
  // URL hash change handling
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (hash && ['generator', 'library', 'about', 'pricing'].includes(hash)) {
      switchPage(hash);
    }
  });
  
  // Check initial hash
  const initialHash = window.location.hash.slice(1);
  if (initialHash && ['generator', 'library', 'about', 'pricing'].includes(initialHash)) {
    switchPage(initialHash);
  } else {
    // Default to generator if no hash
    switchPage('generator');
  }
  
  // Knygų saugojimo vietinėje naršyklėje funkcija
  let savedBooks = JSON.parse(localStorage.getItem('savedBooks')) || [];
  
  // Atvaizduojame išsaugotas knygas, jei tokių yra
  renderSavedBooks();
  
  // Įvedimo laukelio "Enter" klavišo palaikymas
  userPrompt.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
      generateBook();
    }
  });
  
  // Generavimo mygtuko paspaudimo valdymas
  generateBtn.addEventListener('click', generateBook);
  
  // Išsaugojimo mygtuko paspaudimo valdymas
  saveBtn.addEventListener('click', saveCurrentBook);
  
  // Atsisiuntimo mygtuko paspaudimo valdymas
  downloadBtn.addEventListener('click', downloadAsPDF);
  
  // Track user generation count and subscription status
  let userPlan = {
    type: 'free', // 'free' or 'premium'
    booksGenerated: 0,
    maxBooks: 3, // Free plan limit
    resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(), // First day of next month
  };

  // Try to load user plan from localStorage
  try {
    const savedPlan = localStorage.getItem('userPlan');
    if (savedPlan) {
      userPlan = JSON.parse(savedPlan);
      
      // Check if we need to reset the counter (new month)
      const resetDate = new Date(userPlan.resetDate);
      const currentDate = new Date();
      if (currentDate > resetDate) {
        // It's a new month, reset counter
        userPlan.booksGenerated = 0;
        userPlan.resetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toISOString();
        savePlanToStorage();
      }
    }
  } catch (e) {
    console.error("Error loading user plan", e);
  }

  function savePlanToStorage() {
    if (googleUser) {
      localStorage.setItem(`userPlan_${googleUser.id}`, JSON.stringify(userPlan));
    } else {
      // Fallback to anonymous storage
      localStorage.setItem('userPlan', JSON.stringify(userPlan));
    }
  }

  // Handle FAQ toggling
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', () => {
      // Toggle current FAQ
      item.classList.toggle('active');
      
      // Close other FAQs
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
        }
      });
    });
  });

  // Handle plan button clicks
  const freePlanButton = document.querySelector('.free-plan .plan-button');
  const premiumPlanButton = document.querySelector('.premium-button');
  
  freePlanButton.addEventListener('click', () => {
    userPlan.type = 'free';
    userPlan.maxBooks = 3;
    savePlanToStorage();
    showAlert('You are now on the Free plan!');
    updateVoiceSelector();
    updatePlanButtons();
  });
  
  premiumPlanButton.addEventListener('click', () => {
    // In a real app, this would redirect to payment processing
    userPlan.type = 'premium';
    userPlan.maxBooks = Infinity;
    savePlanToStorage();
    showAlert('Thank you for upgrading to Premium!');
    updateVoiceSelector();
    updatePlanButtons();
  });
  
  function updatePlanButtons() {
    const freePlanButton = document.querySelector('.free-plan .plan-button');
    const premiumPlanButton = document.querySelector('.premium-button');
    
    if (!freePlanButton || !premiumPlanButton) return;
    
    // If we are on the pricing page
    if (userPlan.type === 'free') {
      freePlanButton.textContent = "Current Plan";
      freePlanButton.disabled = true;
      premiumPlanButton.textContent = "Upgrade Now";
      premiumPlanButton.disabled = false;
    } else {
      freePlanButton.textContent = "Downgrade to Free";
      freePlanButton.disabled = false;
      premiumPlanButton.textContent = "Current Plan";
      premiumPlanButton.disabled = true;
    }
    
    // Update the premium plan button to require sign-in if user is not logged in
    if (!googleUser && userPlan.type === 'free') {
      premiumPlanButton.textContent = "Sign in to Upgrade";
      premiumPlanButton.addEventListener('click', function() {
        if (!googleUser) {
          showAlert("Please sign in with Google to upgrade to Premium");
          // Scroll to top to make the sign-in button visible
          window.scrollTo({top: 0, behavior: 'smooth'});
        }
      });
    }
  }
  
  // Update voice selector based on plan
  function updateVoiceSelector() {
    const voiceSelect = document.getElementById('voiceSelect');
    const voices = Array.from(voiceSelect.options);
    
    if (userPlan.type === 'free') {
      // Free users can only use Nova and Alloy
      voices.forEach(option => {
        if (option.value !== 'nova' && option.value !== 'alloy') {
          option.disabled = true;
          if (!option.textContent.includes('(Premium)')) {
            option.textContent += ' (Premium)';
          }
        } else {
          option.disabled = false;
        }
      });
      
      // If a premium voice is selected, switch to Nova
      if (voiceSelect.value !== 'nova' && voiceSelect.value !== 'alloy') {
        voiceSelect.value = 'nova';
      }
    } else {
      // Premium users can use all voices
      voices.forEach(option => {
        option.disabled = false;
        option.textContent = option.textContent.replace(' (Premium)', '');
      });
    }
  }
  
  // Pagrindinė generavimo funkcija
  async function generateBook() {
    const promptText = document.getElementById('userPrompt').value.trim();
    
    if (!promptText) {
      showAlert('Please enter a prompt!');
      return;
    }
    
    // Check if user is on free plan and has reached the limit
    if (userPlan.type === 'free' && userPlan.booksGenerated >= userPlan.maxBooks) {
      const modalHtml = `
        <div class="limit-modal">
          <div class="limit-modal-content">
            <h3><i class="fas fa-exclamation-circle"></i> Monthly Limit Reached</h3>
            <p>You've reached your free plan limit of ${userPlan.maxBooks} books this month.</p>
            <p>Your limit will reset on ${new Date(userPlan.resetDate).toLocaleDateString()}.</p>
            <p>${googleUser ? 'Upgrade to Premium for unlimited books!' : 'Sign in and upgrade to Premium for unlimited books!'}</p>
            <div class="limit-modal-buttons">
              ${googleUser ? 
                `<button id="upgradeBtn" class="premium-button">Upgrade to Premium</button>` : 
                `<button id="signInForPremiumBtn" class="premium-button">Sign in with Google</button>`
              }
              <button id="cancelBtn">Maybe Later</button>
            </div>
          </div>
        </div>
      `;
      
      // Add modal to the page
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = modalHtml;
      document.body.appendChild(modalContainer);
      
      // Handle modal buttons
      if (googleUser) {
        document.getElementById('upgradeBtn').addEventListener('click', () => {
          // Switch to pricing page
          switchPage('pricing');
          document.body.removeChild(modalContainer);
        });
      } else {
        document.getElementById('signInForPremiumBtn').addEventListener('click', () => {
          // Scroll to top where the sign-in button is
          window.scrollTo({top: 0, behavior: 'smooth'});
          document.body.removeChild(modalContainer);
          
          // Show a hint for the user
          showAlert("Please sign in with Google to continue");
        });
      }
      
      document.getElementById('cancelBtn').addEventListener('click', () => {
        document.body.removeChild(modalContainer);
      });
      
      return;
    }
    
    resetUI();
    showProgressBar();
    
    const selectedModel = modelSelect ? modelSelect.value : 'openai-large';
    
    try {
      // Generate title first
      const bookTitle = await generateTitle(promptText, selectedModel);
      updateProgress(10, "Crafting your story...");
      
      // Generate cover based on the title
      await generateCover(bookTitle);
      updateProgress(15, "Designing the perfect cover...");
      
      // Generate content using the title
      updateProgress(20, "Writing your book (this may take a few minutes)...");
      const chapters = await generateContent(bookTitle, promptText, selectedModel);
      updateProgress(80, "Finalizing the content...");
      
      // Only start audio generation after content is fully ready
      if (chapters && chapters.length > 0) {
        updateProgress(85, "Creating audio narration...");
        await generateAudios(chapters);
        updateProgress(100, "Your book is ready!");
      }
      
      saveBtn.disabled = false;
      downloadBtn.disabled = false;
      
      setTimeout(() => {
        progressContainer.style.display = 'none';
      }, 1000);
      
      // Increment books generated counter
      userPlan.booksGenerated++;
      savePlanToStorage();
    } catch (error) {
      console.error("Error generating book:", error);
      updateProgress(0, "An error occurred. Please try again.");
    }
  }
  
  // Viršelio generavimo funkcija
  async function generateCover(bookTitle) {
    // Ensure we're using the clean title for the cover
    const coverPrompt = encodeURIComponent(`Create a professional book cover design for "${bookTitle}". Make it look like a bestseller cover with clear title placement and proper word placement avoid duplicate words.`);
    const coverURL = `https://image.pollinations.ai/prompt/${coverPrompt}?width=512&height=768&nologo=true&model=openjourney`;
    
    return new Promise((resolve) => {
      coverElem.onload = () => {
        // Update the book front title to match exactly
        const bookFrontTitle = document.querySelector('.book-front h2');
        if (bookFrontTitle) {
          bookFrontTitle.textContent = bookTitle;
        }
        resolve();
      };
      coverElem.src = coverURL;
    });
  }
  
  // Pavadinimo generavimo funkcija
  async function generateTitle(promptText, model = 'openai-large') {
    // Add timestamp and random seed to ensure uniqueness
    const uniquePrompt = `${promptText} (Timestamp: ${Date.now()}, Seed: ${Math.random()})`;
    const titlePrompt = encodeURIComponent(`Create a unique, creative, and captivating book title (different from any previous titles) for a book about: ${uniquePrompt}. 
      Make it original and memorable. Do not repeat previous titles. Generate only ONE title without numbering or listing options make it short and concise.`);
    const titleURL = `https://text.pollinations.ai/${titlePrompt}?model=${model}&temperature=0.9`;  // Increased temperature for more randomness
    
    try {
      const titleResponse = await fetch(titleURL);
      let bookTitle = await titleResponse.text();
      
      // Enhanced title cleaning
      let cleanTitle = cleanText(bookTitle)
        .replace(/^(title:|book title:|the title is:|suggested title:)/i, '')
        .replace(/["']/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Handle lists and multiple titles
      if (cleanTitle.includes("\n") || cleanTitle.includes("1.") || cleanTitle.includes("2.")) {
        cleanTitle = cleanTitle.split(/[\n\r]/)[0]
          .replace(/^\d+\.\s*/, '')
          .trim();
      }
      
      // Handle titles with colons
      if (cleanTitle.includes(":")) {
        const titleParts = cleanTitle.split(":");
        cleanTitle = titleParts.length > 1 
          ? `${titleParts[0].trim()}: ${titleParts[1].trim()}`
          : titleParts[0].trim();
      }
      
      // Final length check
      if (cleanTitle.length > 80) {
        cleanTitle = cleanTitle.substring(0, 77) + "...";
      }
      
      titleElem.innerHTML = `<h2 class="book-title">${cleanTitle}</h2>`;
      return cleanTitle;
      
    } catch (err) {
      console.error("Error generating title:", err);
      titleElem.textContent = "Error generating title";
      throw err;
    }
  }
  
  // Funkcija specialių simbolių išvalymui
  function cleanText(text) {
    return text
      .replace(/^#+\s+/gm, '') // Remove markdown headers
      .replace(/\*\*/g, '') // Remove bold markdown
      .replace(/\*/g, '') // Remove italic markdown
      .replace(/`/g, '') // Remove code markdown
      .replace(/\n\s*-\s+/g, '\n• ') // Replace list dashes with bullet points
      .replace(/^\d+\.\s*/gm, '') // Remove list numbering
      .trim();
  }
  
  // Turinio generavimo funkcija su ilgesniu ir detalesniu turiniu
  async function generateContent(bookTitle, originalPrompt, model = 'openai-large') {
    contentElem.innerHTML = '<div class="generation-message">Creating your unique story with natural, engaging language...</div>';
    
    const timestamp = Date.now();
    const randomSeed = Math.random();
    
    const systemPrompt = `You are a master storyteller who writes captivating, emotionally engaging stories with a natural, human touch. Your writing style:
INTRODUCTION GUIDELINES:
- Hook readers with an engaging opening
- Clearly state the book's purpose and value
- Preview main topics/themes
- Set expectations for what readers will learn/experience
- End with a compelling transition to Chapter 1

1. CHARACTER DEVELOPMENT:
- Create deeply developed main character(s) with clear motivations, flaws, and growth arcs
- Establish compelling supporting characters that challenge and support the protagonist
- Give each character a unique voice, personality, and background

2. PLOT STRUCTURE:
- Begin with a strong hook that introduces the main character and their world
- Build tension through escalating conflicts and challenges
- Include meaningful plot twists that arise naturally from character decisions
- Create emotional high points and low points
- Lead to a satisfying resolution that shows character growth

3. STORYTELLING TECHNIQUES:
- Show don't tell - use vivid sensory details and actions
- Mix dialogue, internal thoughts, and descriptions naturally
- Create atmospheric scenes that immerse readers
- Use varied pacing - mix action, reflection, and dialogue
- Include emotional moments that feel genuine

4. NARRATIVE FLOW:
- Maintain clear cause-and-effect relationships
- Build and release tension strategically
- Plant seeds early that pay off later
- Create chapter hooks and satisfying endings

Remember: Write as a human author would, with natural language, emotional depth, and creative flair. Each story should feel unique and personal.

Use timestamp: ${timestamp} and seed: ${randomSeed} to ensure uniqueness.`;

    const contentPromptText = `Create a compelling and emotionally engaging book titled "${bookTitle}" based on: ${originalPrompt}

STORY STRUCTURE:
1. INTRODUCTION (Chapter 1-3) ensure word count is 1000-2000 words per chapter:
- Introduce the main character(s) and their ordinary world
- Establish their desires, fears, and internal conflicts
- Present the inciting incident that disrupts their world

2. RISING ACTION (Chapter 4-10) ensure word count is 1000-2000 words per chapter:
- Escalate challenges and conflicts
- Develop relationships between characters
- Include plot twists and revelations
- Show character growth and changes

3. CLIMAX (Chapter 11-17) ensure word count is 1000-2000 words per chapter:
- Build to emotionally powerful confrontations
- Force the protagonist to make difficult choices
- Reveal character true nature under pressure
- Include major turning points in the story

4. RESOLUTION (Chapter 18-20) ensure word count is 1000-2000 words per chapter:
- Show how characters have changed
- Resolve main conflicts
- Provide emotional closure
- Leave readers with meaningful final thoughts

KEY ELEMENTS: ensure word count is 1000-2000 words per chapter:
- Main Character: Create a protagonist readers will care about
- Antagonist/Conflict: Develop meaningful opposition
- Supporting Cast: Include characters that enrich the story
- Plot Twists: Add surprising but logical turns
- Emotional Core: Focus on genuine human experiences
- Theme: Weave meaningful themes naturally

WRITING STYLE: ensure word count is 1000-2000 words per chapter:
- Write in a natural, flowing style
- Mix dialogue, action, and description
- Use sensory details to bring scenes alive
- Vary sentence structure and pacing
- Include emotional depth and nuance


**IMPORTANT**: CHAPTER STRUCTURE: ensure word count is 1000-2000 words per chapter:
- 20 chapters total
- Each chapter should advance plot and character development
- End chapters with hooks that pull readers forward
- Write only the necessary content without extra symbols include titles, subtitles, or specific dialogue formatting for book writing.
- Use "---CHAPTER BREAK---" between chapters
- Start each with "Chapter [Number]: [Engaging Title]"

Make this story feel like it was written by a skilled human author, with natural flow, emotional depth, and creative storytelling ensure every chapter is consistent with the story.`;

    // Helper function for delay between retries
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // Helper function to make API call with retries
    async function makeApiCall(chapterPrompt, retries = 3, baseDelay = 1500) {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

          const response = await fetch('https://text.pollinations.ai/openai', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: chapterPrompt }
              ],
              model: model,
              temperature: 0.85,
              max_tokens: 20000,
              private: true
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          
          if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid API response format');
          }

          return cleanText(data.choices[0].message.content);
        } catch (error) {
          if (error.name === 'AbortError') {
            console.log('Request timed out, retrying...');
          } else {
            console.error(`API call failed (attempt ${attempt + 1}):`, error);
          }

          if (attempt === retries - 1) {
            throw error;
          }

          // Exponential backoff
          await delay(baseDelay * Math.pow(2, attempt));
        }
      }
    }

    try {
      const chapters = [];
      const totalChapters = 20;

      // Generate chapters sequentially with progress updates
      for (let i = 0; i < totalChapters; i++) {
        updateProgress(
          30 + (i / totalChapters) * 50,
          `Crafting Chapter ${i + 1} of ${totalChapters}...`
        );

        let chapterPrompt;
        
        if (i === 0) {
          // First chapter - start of the story
          chapterPrompt = `${contentPromptText}\n\nWrite Chapter ${i + 1} of ${totalChapters}, focusing on:

CHAPTER 1 - OPENING:
- Introduce the main character(s) in an engaging way
- Show their normal world and what they want
- Plant seeds for future conflicts
- End with an incident that disrupts their life

Make this chapter feel natural and emotionally engaging, focusing on character development and plot progression.`;
        } else if (i < 3) {
          // Introduction chapters
          chapterPrompt = `${contentPromptText}\n\nWrite Chapter ${i + 1} of ${totalChapters}, focusing on:

INTRODUCTION CHAPTER:
- Continue developing main character(s) introduced in Chapter 1
- Deepen understanding of their world and motivations
- Build on the disruption introduced in Chapter 1
- End with a hook that pulls readers forward

Previous story context: ${chapters.map((ch, idx) => `Chapter ${idx + 1}: ${ch.substring(0, 200)}...`).join('\n')}

Make this chapter feel natural and emotionally engaging, focusing on character development and plot progression.`;
        } else if (i < 10) {
          // Rising action chapters
          chapterPrompt = `${contentPromptText}\n\nWrite Chapter ${i + 1} of ${totalChapters}, focusing on:

RISING ACTION CHAPTER:
- Escalate challenges and conflicts
- Develop relationships between characters
- Include ${i === 6 ? 'a major plot twist or revelation' : 'complications and obstacles'}
- Show character growth and changes
- End with a hook that pulls readers forward

Previous story context: ${chapters.slice(-3).map((ch, idx) => `Chapter ${i - 2 + idx}: ${ch.substring(0, 200)}...`).join('\n')}

Make this chapter feel natural and emotionally engaging, focusing on character development and plot progression.`;
        } else if (i < 17) {
          // Climax chapters
          chapterPrompt = `${contentPromptText}\n\nWrite Chapter ${i + 1} of ${totalChapters}, focusing on:

CLIMAX CHAPTER:
- Build to ${i === 14 ? 'the main emotional confrontation' : 'an emotionally powerful scene'}
- Force the protagonist to make difficult choices
- Reveal character true nature under pressure
- ${i === 16 ? 'Lead toward the final resolution' : 'Create tension and stakes'}
- End with a compelling hook

Previous story context: ${chapters.slice(-3).map((ch, idx) => `Chapter ${i - 2 + idx}: ${ch.substring(0, 200)}...`).join('\n')}

Make this chapter feel natural and emotionally engaging, focusing on character development and plot progression.`;
        } else {
          // Resolution chapters
          chapterPrompt = `${contentPromptText}\n\nWrite Chapter ${i + 1} of ${totalChapters}, focusing on:

${i === totalChapters - 1 ? 'FINAL CHAPTER:' : 'RESOLUTION CHAPTER:'}
- ${i === totalChapters - 1 ? 'Provide a satisfying conclusion to the story' : 'Begin resolving main conflicts'}
- Show how characters have grown/changed
- ${i === totalChapters - 1 ? 'Resolve remaining plot threads and provide closure' : 'Continue resolving conflicts while maintaining reader interest'}
- ${i === totalChapters - 1 ? 'Leave readers with a memorable ending' : 'Lead toward the final resolution'}

Previous story context: ${chapters.slice(-3).map((ch, idx) => `Chapter ${i - 2 + idx}: ${ch.substring(0, 200)}...`).join('\n')}

Make this chapter feel natural and emotionally engaging, focusing on ${i === totalChapters - 1 ? 'providing a satisfying conclusion' : 'character development and plot progression'}.`;
        }

        try {
          const chapterContent = await makeApiCall(chapterPrompt);
          chapters.push(chapterContent);

          // Update UI with progress
          const previewElem = document.createElement('div');
          previewElem.className = 'chapter-preview';
          previewElem.textContent = `✓ Chapter ${i + 1} completed (${Math.round(chapterContent.length / 6)} words)`;
          document.querySelector('.generation-message').appendChild(previewElem);

        } catch (error) {
          console.error(`Failed to generate chapter ${i + 1}:`, error);
          chapters.push(`Chapter ${i + 1}: [Generation failed - Please try regenerating this chapter]`);
        }

        // Add small delay between chapters to avoid rate limiting
        await delay(1000);
      }

      // Combine chapters and process
      const fullContent = chapters.join('\n\n---CHAPTER BREAK---\n\n');
      processChapters(fullContent.split('---CHAPTER BREAK---'));
      return chapters;

    } catch (err) {
      console.error("Error in content generation:", err);
      contentElem.innerHTML = `
        <div class="error-message">
          <h4>Error generating content</h4>
          <p>Please try again. If the problem persists, try:</p>
          <ul>
            <li>Using a shorter prompt</li>
            <li>Selecting a different model</li>
            <li>Checking your internet connection</li>
          </ul>
        </div>`;
      throw err;
    }
  }
  
  // Skyrių apdorojimo funkcija
  function processChapters(chapters) {
    tableOfContentsElem.innerHTML = "";
    contentElem.innerHTML = "";
    
    chapters.forEach((chapter, index) => {
      chapter = chapter.trim();
      if (!chapter) return;
      
      // Extract chapter title
      let chapterTitle = "";
      let chapterNumber = 0;
      const chapterMatch = chapter.match(/Chapter (\d+):?\s*(.*?)(\n|$)/);
      
      if (index === 0) {
        chapterTitle = "Introduction";
        chapterNumber = 0;
      } else {
        if (chapterMatch && chapterMatch[2]) {
          chapterTitle = chapterMatch[2].trim();
          chapterNumber = parseInt(chapterMatch[1], 10) || index;
        } else {
          chapterTitle = `Chapter ${index}`;
          chapterNumber = index;
        }
      }
      
      // Create table of contents item
      const tocItem = document.createElement('div');
      tocItem.className = 'toc-item';
      
      const tocNumber = index === 0 ? 
        '<i class="fas fa-book-open"></i>' : 
        `<span class="toc-number">${chapterNumber}</span>`;
      
      tocItem.innerHTML = `
        ${tocNumber}
        <span class="toc-title">${chapterTitle}</span>
        <span class="toc-indicator"><i class="fas fa-chevron-right"></i></span>
      `;
      
      // Format chapter content with styles
      let formattedChapterContent = chapter;
      
      // Remove "Chapter X:" from first line as it's shown in the header
      formattedChapterContent = formattedChapterContent.replace(/^Chapter \d+:.*?\n\n/, '');
      
      // Format section headings with centered alignment
      formattedChapterContent = formattedChapterContent.replace(/Section \d+: ([^\n]+)/g, 
        '<div class="section-heading">$1</div>');
      
      // Format subsections with centered alignment
      formattedChapterContent = formattedChapterContent.replace(/([^.\n]+):\s*([^\n]+)/g, (match, prefix, title) => {
        if (prefix.includes("Chapter") || prefix.includes("Section")) {
          return match;
        }
        return `<div class="subsection-heading">${prefix}: ${title}</div>`;
      });
      
      // Add spacing between paragraphs and highlight first words
      formattedChapterContent = formattedChapterContent.replace(/\n\n([^<\n]+)/g, (match, paragraph) => {
        if (paragraph.includes('class="')) {
          return match;
        }
        
        const words = paragraph.split(' ');
        const firstWords = words.slice(0, Math.min(3, words.length));
        const restOfParagraph = words.slice(Math.min(3, words.length)).join(' ');
        
        return `\n\n<p class="chapter-paragraph"><strong>${firstWords.join(' ')}</strong> ${restOfParagraph}</p>`;
      });
      
      // Split into pages (800 words per page)
      const pages = splitIntoPages(formattedChapterContent);
      
      // Create chapter container
      const chapterContainer = document.createElement('div');
      chapterContainer.className = 'chapter-container';
      chapterContainer.id = `chapter-${index}`;
      
      // Chapter header with decorative elements
      const chapterHeader = document.createElement('div');
      chapterHeader.className = 'chapter-header';
      chapterHeader.innerHTML = `
        <div class="chapter-decoration">
          <span class="decoration-line"></span>
          <i class="fas fa-book"></i>
          <span class="decoration-line"></span>
        </div>
        <h4 class="chapter-title">${index === 0 ? chapterTitle : `Chapter ${chapterNumber}: ${chapterTitle}`}</h4>
        <div class="chapter-decoration">
          <span class="decoration-line"></span>
          <i class="fas fa-feather"></i>
          <span class="decoration-line"></span>
        </div>
      `;
      chapterContainer.appendChild(chapterHeader);
      
      // Add pages with navigation
      pages.forEach((pageContent, pageIndex) => {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'chapter-page';
        pageDiv.id = `chapter-${index}-page-${pageIndex}`;
        pageDiv.style.display = pageIndex === 0 ? 'block' : 'none';
        
        pageDiv.innerHTML = `
          <div class="chapter-content">
            ${pageContent}
            <div class="page-number">Page ${pageIndex + 1} of ${pages.length}</div>
          </div>
        `;
        
        chapterContainer.appendChild(pageDiv);
      });
      
      // Add page navigation if multiple pages
      if (pages.length > 1) {
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'page-controls';
        
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn prev-page';
        prevBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Previous Page';
        prevBtn.disabled = true;
        
        const pageIndicator = document.createElement('span');
        pageIndicator.className = 'page-indicator';
        pageIndicator.textContent = `Page 1 of ${pages.length}`;
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn next-page';
        nextBtn.innerHTML = 'Next Page <i class="fas fa-arrow-right"></i>';
        
        paginationDiv.appendChild(prevBtn);
        paginationDiv.appendChild(pageIndicator);
        paginationDiv.appendChild(nextBtn);
        
        let currentPage = 0;
        
        // Navigation logic
        prevBtn.addEventListener('click', () => {
          document.getElementById(`chapter-${index}-page-${currentPage}`).style.display = 'none';
          currentPage--;
          document.getElementById(`chapter-${index}-page-${currentPage}`).style.display = 'block';
          
          nextBtn.disabled = false;
          prevBtn.disabled = currentPage === 0;
          pageIndicator.textContent = `Page ${currentPage + 1} of ${pages.length}`;
          
          chapterContainer.scrollIntoView({ behavior: 'smooth' });
        });
        
        nextBtn.addEventListener('click', () => {
          document.getElementById(`chapter-${index}-page-${currentPage}`).style.display = 'none';
          currentPage++;
          document.getElementById(`chapter-${index}-page-${currentPage}`).style.display = 'block';
          
          prevBtn.disabled = false;
          nextBtn.disabled = currentPage === pages.length - 1;
          pageIndicator.textContent = `Page ${currentPage + 2} iš ${pages.length}`;
          
          chapterContainer.scrollIntoView({ behavior: 'smooth' });
        });
        
        chapterContainer.appendChild(paginationDiv);
      }
      
      // Add chapter navigation
      tocItem.addEventListener('click', () => {
        document.querySelectorAll('.chapter-container').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.toc-item').forEach(t => t.classList.remove('active'));
        
        chapterContainer.classList.add('active');
        tocItem.classList.add('active');
        
        chapterContainer.scrollIntoView({ behavior: 'smooth' });
      });
      
      tableOfContentsElem.appendChild(tocItem);
      contentElem.appendChild(chapterContainer);
    });
    
    // Activate first chapter
    if (chapters.length > 0) {
      const firstChapter = document.getElementById('chapter-0');
      const firstTocItem = tableOfContentsElem.querySelector('.toc-item');
      
      if (firstChapter) {
        firstChapter.classList.add('active');
      }
      
      if (firstTocItem) {
        firstTocItem.classList.add('active');
      }
    }
  }
  
  // Funkcija, kuri padaliną ilgą tekstą į puslapius
  function splitIntoPages(text, wordsPerPage = 3000) {
    const words = text.split(/\s+/);
    const pages = [];
    
    for (let i = 0; i < words.length; i += wordsPerPage) {
      const pageWords = words.slice(i, i + wordsPerPage);
      pages.push(pageWords.join(' '));
    }
    
    return pages;
  }
  
  // Audio generavimo funkcija su pilnu tekstu
  async function generateAudios(chapters) {
    chapterAudiosElem.innerHTML = "";
    const voiceType = voiceSelect.value;
    
    // Audio section header
    const audioSectionHeader = document.createElement('h3');
    audioSectionHeader.className = 'section-header audio-section-header';
    audioSectionHeader.innerHTML = '<i class="fas fa-headphones"></i> Complete Audio Book';
    chapterAudiosElem.appendChild(audioSectionHeader);
    
    const audioContainersWrapper = document.createElement('div');
    audioContainersWrapper.className = 'audio-containers-wrapper';
    chapterAudiosElem.appendChild(audioContainersWrapper);

    // Helper function for delay
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // Helper function to generate audio with retries
    async function generateAudioForChunk(text, chapterTitle, partLabel, retries = 3) {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 45000);

          // Enhanced text preparation for more natural narration
          const cleanedText = text
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/[""]/g, '"')
            .replace(/['']/g, "'")
            .replace(/([.!?])\s+/g, '$1\n') // Add line breaks for better pacing
            .replace(/([,;])\s+/g, '$1 ') // Add slight pauses after punctuation
            .trim();

          // Create audio element
          const audioElem = document.createElement('audio');
          audioElem.controls = true;
          audioElem.className = 'chapter-audio-player';
          
          // Enhanced narration prompt for more natural delivery
          const narrationPrompt = `Read this passage with natural expression, emotion, and dynamic pacing. Adjust your tone to reflect the mood and intensity of the content. Utilize appropriate pauses for punctuation, dramatic effect, and natural speech flow. Distinguish each character with a unique voice, accent, and personality, ensuring consistency throughout. Infuse humor where appropriate—chuckle, smirk, or burst into laughter when the moment calls for it. Let wit and charm shine through to make the narration engaging and immersive. Bring the text to life with storytelling that captivates and entertains the listener from start to finish.:

${cleanedText}`;

          // Create the audio URL with enhanced parameters for more natural speech
          const audioURL = `https://text.pollinations.ai/${encodeURIComponent(narrationPrompt)}?model=openai-audio&voice=${voiceType}&speed=0.95&pitch=1.0&emphasis=1.2`;
          
          const response = await fetch(audioURL, {
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('audio')) {
            throw new Error('Invalid response type - expected audio');
          }

          const audioBlob = await response.blob();
          const audioBlobUrl = URL.createObjectURL(audioBlob);
          audioElem.src = audioBlobUrl;

          // Create segment container with enhanced styling
          const segmentContainer = document.createElement('div');
          segmentContainer.className = 'audio-segment';
          
          const segmentLabel = document.createElement('div');
          segmentLabel.className = 'segment-label';
          segmentLabel.innerHTML = `
            <span class="chapter-name">${chapterTitle}</span>
            ${partLabel ? `<span class="part-label">${partLabel}</span>` : ''}
            <span class="duration-label"></span>
          `;
          
          // Add duration once audio is loaded
          audioElem.addEventListener('loadedmetadata', () => {
            const duration = Math.round(audioElem.duration);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            const durationLabel = segmentLabel.querySelector('.duration-label');
            durationLabel.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          });
          
          segmentContainer.appendChild(segmentLabel);
          segmentContainer.appendChild(audioElem);
          
          // Add visualization
          addAudioVisualization(audioElem, segmentContainer);
          
          return segmentContainer;

        } catch (error) {
          if (error.name === 'AbortError') {
            console.log('Audio generation timed out, retrying...');
          } else {
            console.error(`Audio generation failed (attempt ${attempt + 1}):`, error);
          }

          if (attempt === retries - 1) {
            throw error;
          }

          // Exponential backoff with longer delays
          await delay(3000 * Math.pow(2, attempt));
        }
      }
    }

    // Process each chapter with improved chunking - only generate audio for 5 chapters at a time
    const chapterGroups = [];
    for (let i = 0; i < chapters.length; i += 5) {
      chapterGroups.push(chapters.slice(i, i + 5));
    }

    for (let groupIndex = 0; groupIndex < chapterGroups.length; groupIndex++) {
      const chapterGroup = chapterGroups[groupIndex];
      
      updateProgress(
        85 + (groupIndex / chapterGroups.length) * 15, 
        `Generating audio for chapters ${groupIndex * 5 + 1}-${Math.min((groupIndex + 1) * 5, chapters.length)}...`
      );
      
      // Generate audio for each chapter in the group
      await Promise.all(chapterGroup.map(async (chapter, localIndex) => {
        const chapterIndex = groupIndex * 5 + localIndex;
        if (!chapter.trim()) return;
        
        // Extract chapter title to match table of contents
        let chapterTitle;
        let chapterContent;
        
        if (chapterIndex === 0) {
          chapterTitle = "Introduction";
          chapterContent = chapter;
        } else {
          const chapterMatch = chapter.match(/Chapter \d+:?\s*(.*?)(\n|$)/);
          if (chapterMatch && chapterMatch[1]) {
            chapterTitle = `Chapter ${chapterIndex + 1}: ${chapterMatch[1].trim()}`;
            // Remove chapter title from content
            chapterContent = chapter.replace(/Chapter \d+:.*?\n/, '').trim();
          } else {
            chapterTitle = `Chapter ${chapterIndex + 1}`;
            chapterContent = chapter;
          }
        }
        
        // Create chapter audio container
        const chapterAudioContainer = document.createElement('div');
        chapterAudioContainer.className = 'chapter-audio slideIn';
        // After first 3 chapters, set them collapsed by default
        if (chapterIndex > 2) {
          chapterAudioContainer.classList.add('collapsed');
        }
        chapterAudioContainer.id = `audio-chapter-${chapterIndex}`;
        
        const audioHeader = document.createElement('h4');
        audioHeader.innerHTML = `<i class="fas fa-play-circle"></i> ${chapterTitle}`;
        audioHeader.addEventListener('click', () => {
          chapterAudioContainer.classList.toggle('collapsed');
        });
        chapterAudioContainer.appendChild(audioHeader);
        
        // Add loading animation
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'audio-generating';
        loadingDiv.innerHTML = `
          <div class="audio-wave">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <span>Generating chapter audio...</span>
        `;
        chapterAudioContainer.appendChild(loadingDiv);
        audioContainersWrapper.appendChild(chapterAudioContainer);
        
        try {
          // Split into sentences first
          const sentences = chapterContent.match(/[^.!?]+[.!?]+/g) || [chapterContent];
          
          // Combine sentences into chunks (1000 characters per chunk for faster processing)
          const chunks = [];
          let currentChunk = '';
          let currentSentences = [];
          
          for (const sentence of sentences) {
            if ((currentChunk + sentence).length > 1000 && currentChunk.length > 0) {
              chunks.push({
                text: currentChunk.trim(),
                sentences: currentSentences
              });
              currentChunk = sentence;
              currentSentences = [sentence];
            } else {
              currentChunk += ' ' + sentence;
              currentSentences.push(sentence);
            }
          }
          if (currentChunk.trim().length > 0) {
            chunks.push({
              text: currentChunk.trim(),
              sentences: currentSentences
            });
          }
          
          // Create container for audio segments
          const segmentsContainer = document.createElement('div');
          segmentsContainer.className = 'chapter-audio-segments';
          
          // Generate audio for each chunk sequentially
          for (let j = 0; j < chunks.length; j++) {
            const chunk = chunks[j];
            const partLabel = chunks.length > 1 ? `Part ${j + 1} of ${chunks.length} • ${chunk.sentences.length} sentences` : '';
            
            try {
              const segmentContainer = await generateAudioForChunk(chunk.text, chapterTitle, partLabel);
              segmentsContainer.appendChild(segmentContainer);
              
              // Add progress indicator
              const progressDiv = document.createElement('div');
              progressDiv.className = 'audio-progress';
              progressDiv.textContent = `✓ Generated ${j + 1} of ${chunks.length} audio segments`;
              loadingDiv.appendChild(progressDiv);
              
            } catch (error) {
              console.error(`Failed to generate audio for chunk ${j + 1}:`, error);
              const errorDiv = document.createElement('div');
              errorDiv.className = 'audio-error';
              errorDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                Failed to generate audio for part ${j + 1}. 
                <button class="retry-btn" data-chunk="${j}" data-chapter="${chapterIndex}">Retry</button>
              `;
              segmentsContainer.appendChild(errorDiv);
              
              // Add retry functionality
              const retryBtn = errorDiv.querySelector('.retry-btn');
              retryBtn.addEventListener('click', async () => {
                try {
                  errorDiv.innerHTML = '<div class="audio-generating">Retrying...</div>';
                  const newSegmentContainer = await generateAudioForChunk(chunk.text, chapterTitle, partLabel);
                  segmentsContainer.replaceChild(newSegmentContainer, errorDiv);
                } catch (retryError) {
                  console.error('Retry failed:', retryError);
                  errorDiv.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    Retry failed. Please try again later.
                    <button class="retry-btn" data-chunk="${j}" data-chapter="${chapterIndex}">Retry Again</button>
                  `;
                }
              });
            }
            
            // Add delay between chunks to avoid rate limiting
            await delay(1000);
          }
          
          // Replace loading animation with audio segments
          chapterAudioContainer.removeChild(loadingDiv);
          chapterAudioContainer.appendChild(segmentsContainer);
          
          // Add play all button if multiple segments
          if (chunks.length > 1) {
            const playAllBtn = document.createElement('button');
            playAllBtn.className = 'play-all-btn';
            playAllBtn.innerHTML = '<i class="fas fa-play"></i> Play All Segments';
            
            // Enhanced play all functionality
            playAllBtn.onclick = () => {
              const audioElements = segmentsContainer.querySelectorAll('audio');
              let currentIndex = 0;
              
              function playNext() {
                if (currentIndex < audioElements.length) {
                  const audio = audioElements[currentIndex];
                  audio.play();
                  
                  // Update button text while playing
                  playAllBtn.innerHTML = '<i class="fas fa-pause"></i> Playing Part ' + (currentIndex + 1);
                  
                  audio.onended = () => {
                    currentIndex++;
                    playNext();
                  };
                } else {
                  // Reset button when all segments are done
                  playAllBtn.innerHTML = '<i class="fas fa-play"></i> Play All Segments';
                }
              }
              
              playNext();
            };
            
            chapterAudioContainer.insertBefore(playAllBtn, segmentsContainer);
          }
          
        } catch (error) {
          console.error("Error generating audio for chapter:", error);
          chapterAudioContainer.removeChild(loadingDiv);
          chapterAudioContainer.innerHTML += `
            <div class="error-message">
              <h4>Error generating audio</h4>
              <p>Failed to generate audio for this chapter. This might be due to:</p>
              <ul>
                <li>Network connectivity issues</li>
                <li>Server timeout</li>
                <li>Content length restrictions</li>
              </ul>
              <button class="retry-chapter-btn" data-chapter="${chapterIndex}">Retry Chapter</button>
            </div>`;
        }
      }));
      
      // Add small delay between chapter groups
      await delay(2000);
    }
    
    // Add All Expand/Collapse button
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'audio-controls';
    controlsDiv.style.marginBottom = '1rem';
    controlsDiv.style.textAlign = 'right';
    
    const expandAllBtn = document.createElement('button');
    expandAllBtn.className = 'audio-control-btn';
    expandAllBtn.innerHTML = '<i class="fas fa-angle-double-down"></i> Expand All';
    expandAllBtn.addEventListener('click', () => {
      document.querySelectorAll('.chapter-audio').forEach(chapter => {
        chapter.classList.remove('collapsed');
      });
    });
    
    const collapseAllBtn = document.createElement('button');
    collapseAllBtn.className = 'audio-control-btn';
    collapseAllBtn.innerHTML = '<i class="fas fa-angle-double-up"></i> Collapse All';
    collapseAllBtn.addEventListener('click', () => {
      document.querySelectorAll('.chapter-audio').forEach(chapter => {
        chapter.classList.add('collapsed');
      });
    });
    
    controlsDiv.appendChild(expandAllBtn);
    controlsDiv.appendChild(collapseAllBtn);
    audioContainersWrapper.insertBefore(controlsDiv, audioContainersWrapper.firstChild);
    
    // Add click handlers to sync with table of contents
    document.querySelectorAll('.toc-item').forEach((tocItem, index) => {
      tocItem.addEventListener('click', () => {
        const audioChapter = document.getElementById(`audio-chapter-${index}`);
        if (audioChapter) {
          // Expand the chapter when clicked in TOC
          audioChapter.classList.remove('collapsed');
          audioChapter.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }
  
  // Audio vizualizacijos funkcija
  function addAudioVisualization(audioElement, container) {
    const visualizer = document.createElement('div');
    visualizer.className = 'audio-visualizer';
    
    // Sukuriame 20 bangų elementų
    for (let i = 0; i < 20; i++) {
      const bar = document.createElement('div');
      bar.className = 'visualizer-bar';
      bar.style.height = '2px';
      visualizer.appendChild(bar);
    }
    
    container.appendChild(visualizer);
    
    // Nustatome klausymo įvykius
    audioElement.addEventListener('play', function() {
      visualizer.classList.add('active');
      
      // Animuojame bangas
      const bars = visualizer.querySelectorAll('.visualizer-bar');
      bars.forEach(bar => {
        const randomHeight = 5 + Math.random() * 20;
        const animationDuration = 0.5 + Math.random() * 1;
        
        bar.style.height = `${randomHeight}px`;
        bar.style.animationDuration = `${animationDuration}s`;
      });
    });
    
    audioElement.addEventListener('pause', function() {
      visualizer.classList.remove('active');
      
      // Sustabdome animacijas
      const bars = visualizer.querySelectorAll('.visualizer-bar');
      bars.forEach(bar => {
        bar.style.height = '2px';
      });
    });
    
    audioElement.addEventListener('ended', function() {
      visualizer.classList.remove('active');
      
      // Grąžiname pradinį aukštį
      const bars = visualizer.querySelectorAll('.visualizer-bar');
      bars.forEach(bar => {
        bar.style.height = '2px';
      });
    });
  }
  
  // Progreso juostos atnaujinimo funkcija
  function updateProgress(percent, statusText) {
    progressBar.style.width = percent + '%';
    progressStatus.textContent = statusText;
  }
  
  // UI pradinė būsena
  function resetUI() {
    titleElem.textContent = "Laukiama...";
    contentElem.textContent = "Generuojamas turinys, prašome palaukti...";
    chapterAudiosElem.innerHTML = "";
    tableOfContentsElem.innerHTML = "";
  }
  
  // Progreso juostos rodymas
  function showProgressBar() {
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressStatus.textContent = "Inicijuojama...";
  }
  
  // Pranešimų rodymo funkcija
  function showAlert(message) {
    const alertElement = document.createElement('div');
    alertElement.className = 'custom-alert';
    
    const icon = message.toLowerCase().includes('error') || message.toLowerCase().includes('limit') ?
      '<i class="fas fa-exclamation-circle"></i>' :
      '<i class="fas fa-check-circle"></i>';
    
    alertElement.innerHTML = `
      <div class="alert-content">
        ${icon}
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(alertElement);
    
    // Fade in
    setTimeout(() => {
      alertElement.classList.add('show');
    }, 10);
    
    // Fade out and remove
    setTimeout(() => {
      alertElement.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(alertElement);
      }, 300);
    }, 3000);
  }
  
  // Pridėsime stilių alertui
  const alertStyle = document.createElement('style');
  alertStyle.textContent = `
    .custom-alert {
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border-radius: var(--radius);
      box-shadow: var(--shadow-strong);
      max-width: 400px;
      padding: 0;
      z-index: 1000;
      transform: translateY(-20px);
      opacity: 0;
      transition: all 0.3s ease;
    }
    
    .custom-alert.show {
      transform: translateY(0);
      opacity: 1;
    }
    
    .alert-content {
      display: flex;
      align-items: center;
      padding: 15px 20px;
      gap: 12px;
      border-left: 4px solid var(--primary-color);
    }
    
    .alert-content i {
      font-size: 1.5em;
      color: var(--accent-color);
    }
    
    .fa-exclamation-circle {
      color: var(--error-color) !important;
    }
    
    .fa-check-circle {
      color: var(--success-color) !important;
    }
  `;
  document.head.appendChild(alertStyle);
  
  // Išsaugoti esamą knygą
  function saveCurrentBook() {
    const title = titleElem.textContent;
    const coverSrc = coverElem.src;
    const content = contentElem.innerHTML;
    
    if (!title || title === "Laukiama..." || !coverSrc) {
      showAlert("Nėra ką išsaugoti. Pirmiausia sugeneruokite knygą.");
      return;
    }
    
    const book = {
      id: Date.now(),
      title: title,
      coverSrc: coverSrc,
      content: content,
      prompt: userPrompt.value,
      savedDate: new Date().toLocaleDateString()
    };
    
    savedBooks.push(book);
    localStorage.setItem('savedBooks', JSON.stringify(savedBooks));
    
    renderSavedBooks();
    showAlert("Knyga sėkmingai išsaugota!");
  }
  
  // Atvaizduoti išsaugotas knygas
  function renderSavedBooks() {
    savedBooksElem.innerHTML = "";
    
    if (savedBooks.length === 0) {
      savedBooksElem.innerHTML = '<p class="empty-library">Dar neturite išsaugotų knygų.</p>';
      return;
    }
    
    savedBooks.forEach(book => {
      const bookElem = document.createElement('div');
      bookElem.className = 'saved-book';
      bookElem.innerHTML = `
        <div class="saved-book-cover">
          <img src="${book.coverSrc}" alt="${book.title}">
        </div>
        <div class="saved-book-title">${book.title}</div>
      `;
      
      // Pridedame knygos įkėlimo funkciją
      bookElem.addEventListener('click', () => {
        loadSavedBook(book);
      });
      
      savedBooksElem.appendChild(bookElem);
    });
  }
  
  // Įkelti išsaugotą knygą
  function loadSavedBook(book) {
    userPrompt.value = book.prompt;
    titleElem.textContent = book.title;
    coverElem.src = book.coverSrc;
    contentElem.innerHTML = book.content;
    
    // Įjungiame mygtukus
    saveBtn.disabled = false;
    downloadBtn.disabled = false;
    
    // Slenkame prie knygos turinio
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
    
    // Atnaujiname puslapio mygtukų įvykius
    setupPageNavigationEvents();
  }
  
  // Atnaujiname puslapių navigacijos mygtukų įvykius po knygos užkrovimo
  function setupPageNavigationEvents() {
    document.querySelectorAll('.prev-page').forEach(btn => {
      const chapterId = btn.closest('.chapter-container').id;
      const chapter = document.getElementById(chapterId);
      const pages = chapter.querySelectorAll('.chapter-page');
      const indicator = btn.parentElement.querySelector('.page-indicator');
      const nextBtn = btn.parentElement.querySelector('.next-page');
      
      btn.onclick = function() {
        let currentPage = 0;
        for (let i = 0; i < pages.length; i++) {
          if (pages[i].style.display === 'block') {
            currentPage = i;
            break;
          }
        }
        
        if (currentPage > 0) {
          pages[currentPage].style.display = 'none';
          pages[currentPage - 1].style.display = 'block';
          
          // Atnaujiname mygtukų būseną
          nextBtn.disabled = false;
          btn.disabled = currentPage - 1 === 0;
          indicator.textContent = `Puslapis ${currentPage} iš ${pages.length}`;
        }
      };
    });
    
    document.querySelectorAll('.next-page').forEach(btn => {
      const chapterId = btn.closest('.chapter-container').id;
      const chapter = document.getElementById(chapterId);
      const pages = chapter.querySelectorAll('.chapter-page');
      const indicator = btn.parentElement.querySelector('.page-indicator');
      const prevBtn = btn.parentElement.querySelector('.prev-page');
      
      btn.onclick = function() {
        let currentPage = 0;
        for (let i = 0; i < pages.length; i++) {
          if (pages[i].style.display === 'block') {
            currentPage = i;
            break;
          }
        }
        
        if (currentPage < pages.length - 1) {
          pages[currentPage].style.display = 'none';
          pages[currentPage + 1].style.display = 'block';
          
          // Atnaujiname mygtukų būseną
          prevBtn.disabled = false;
          btn.disabled = currentPage + 1 === pages.length - 1;
          indicator.textContent = `Puslapis ${currentPage + 2} iš ${pages.length}`;
        }
      };
    });
  }
  
  // Atsisiųsti knygą PDF formatu
  function downloadAsPDF() {
    if (titleElem.textContent === "Laukiama..." || !coverElem.src) {
      showAlert("Nėra ką atsisiųsti. Pirmiausia sugeneruokite knygą.");
      return;
    }
    
    // Pradedame rodyti progreso juostą
    showProgressBar();
    updateProgress(10, "Ruošiamas PDF eksportas...");
    
    // Sukuriame elementą, kuris bus konvertuojamas į PDF
    const printContainer = document.createElement('div');
    printContainer.className = 'pdf-export';
    printContainer.style.padding = '20px';
    printContainer.style.maxWidth = '800px';
    printContainer.style.margin = '0 auto';
    printContainer.style.fontFamily = 'Playfair Display, serif';
    
    // Pridedame viršelį ir antraštę
    const bookTitle = titleElem.textContent || titleElem.innerText;
    printContainer.innerHTML = `
      <div style="text-align:center; margin-bottom:30px;">
        <h1 style="font-size:28px; margin-bottom:30px; color:#5D4954; font-weight:700;">${bookTitle}</h1>
        <img src="${coverElem.src}" style="max-width:400px; margin-bottom:30px; border-radius:5px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
        <p style="font-style:italic; margin-top:15px; color:#888;">Created ${new Date().toLocaleDateString()}</p>
      </div>
      <div style="page-break-after:always;"></div>
    `;
    
    updateProgress(20, "Formatuojamas turinys...");
    
    // Sukuriame turinį
    const tocDiv = document.createElement('div');
    tocDiv.style.marginBottom = '40px';
    tocDiv.style.pageBreakAfter = 'always';
    tocDiv.innerHTML = '<h2 style="font-size:24px; margin-bottom:20px; color:#5D4954;">Table of Contents</h2>';
    
    const tocList = document.createElement('ul');
    tocList.style.listStyle = 'none';
    tocList.style.padding = '0';
    
    // Gauname skyrių pavadinimus
    const chapters = [];
    let chapterCount = 0;
    const allChapters = document.querySelectorAll('.chapter-container');
    
    updateProgress(30, `Processing ${allChapters.length} chapters...`);
    
    allChapters.forEach((chapter, index) => {
      const chapterTitle = chapter.querySelector('.chapter-title').textContent;
      chapters.push({ title: chapterTitle, index: index + 1 });
      
      // Create table of contents with page number reference
      const tocItem = document.createElement('li');
      tocItem.style.padding = '10px 0';
      tocItem.style.borderBottom = '1px solid #eee';
      tocItem.style.fontSize = '16px';
      tocItem.style.display = 'flex';
      tocItem.style.justifyContent = 'space-between';
      tocItem.style.alignItems = 'center';
      tocItem.innerHTML = `
        <div><span style="font-weight:bold; color:#8F6D8C; margin-right:10px;">${index + 1}.</span> ${chapterTitle}</div>
        <div style="color:#888;">p. ${(index * 2) + 3}</div>
      `;
      
      tocList.appendChild(tocItem);
      chapterCount++;
    });
    
    tocDiv.appendChild(tocList);
    printContainer.appendChild(tocDiv);
    
    updateProgress(50, "Adding book content...");
    
    // Group chapters for more efficient processing
    const processChaptersInBatches = async () => {
      for (let i = 0; i < allChapters.length; i += 5) {
        const batchEnd = Math.min(i + 5, allChapters.length);
        updateProgress(
          50 + (i / allChapters.length) * 40,
          `Processing chapters ${i + 1} to ${batchEnd} of ${allChapters.length}...`
        );
        
        // Process batch of chapters
        for (let j = i; j < batchEnd; j++) {
          const chapter = allChapters[j];
          const chapterTitle = chapter.querySelector('.chapter-title').textContent;
          
          // Create chapter header
          const chapterDiv = document.createElement('div');
          chapterDiv.style.pageBreakBefore = 'always';
          
          const chapterHeader = document.createElement('h2');
          chapterHeader.textContent = `${j + 1}. ${chapterTitle}`;
          chapterHeader.style.fontSize = '24px';
          chapterHeader.style.marginTop = '30px';
          chapterHeader.style.marginBottom = '30px';
          chapterHeader.style.color = '#5D4954';
          chapterHeader.style.borderBottom = '2px solid #8F6D8C';
          chapterHeader.style.paddingBottom = '10px';
          chapterDiv.appendChild(chapterHeader);
          
          // Add all page content
          const pages = chapter.querySelectorAll('.chapter-page');
          pages.forEach(page => {
            const content = page.querySelector('.chapter-content').innerHTML;
            const contentDiv = document.createElement('div');
            contentDiv.innerHTML = content;
            contentDiv.style.textAlign = 'justify';
            contentDiv.style.lineHeight = '1.8';
            contentDiv.style.fontSize = '14px';
            contentDiv.style.marginBottom = '20px';
            chapterDiv.appendChild(contentDiv);
          });
          
          printContainer.appendChild(chapterDiv);
        }
        
        // Small pause to prevent UI freezing
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    };
    
    // Call the batched processing function, then continue with PDF generation
    processChaptersInBatches().then(() => {
      updateProgress(90, "Generating PDF...");
      
      // Add to body (invisible)
      printContainer.style.position = 'absolute';
      printContainer.style.left = '-9999px';
      document.body.appendChild(printContainer);
      
      // Use html2pdf to convert to PDF
      const pdfOptions = {
        margin: [20, 20, 20, 20],
        filename: `${bookTitle}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      
      // Start conversion
      html2pdf().from(printContainer).set(pdfOptions).save().then(() => {
        // Remove temporary element when PDF is generated
        document.body.removeChild(printContainer);
        
        // Hide progress bar
        updateProgress(100, "PDF successfully generated!");
        setTimeout(() => {
          progressContainer.style.display = 'none';
        }, 1000);
      }).catch(err => {
        console.error("Error generating PDF:", err);
        updateProgress(0, "Error generating PDF.");
        document.body.removeChild(printContainer);
      });
    });
  }
  
  // CSS stilių pridėjimas
  function addCustomStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      /* Audio vizualizatoriaus stiliai */
      .audio-visualizer {
        display: flex;
        align-items: flex-end;
        height: 30px;
        margin: 10px 0;
        justify-content: center;
        gap: 3px;
      }
      
      .visualizer-bar {
        width: 3px;
        background: linear-gradient(to top, #8F6D8C, #A4779D);
        border-radius: 2px;
        transition: height 0.1s ease;
      }
      
      .audio-visualizer.active .visualizer-bar {
        animation: sound-wave 0.8s infinite alternate;
      }
      
      @keyframes sound-wave {
        0% {
          height: var(--min-height, 2px);
        }
        100% {
          height: var(--max-height, 25px);
        }
      }
      
      .book-title {
        font-size: 32px;
        font-weight: 700;
        color: #5D4954;
        margin-bottom: 20px;
        text-align: center;
        padding-bottom: 10px;
        border-bottom: 2px solid #8F6D8C;
      }
      
      .audio-section-header {
        display: flex;
        align-items: center;
        font-size: 24px;
        margin: 30px 0 20px;
        color: #5D4954;
        border-bottom: 2px solid #8F6D8C;
        padding-bottom: 10px;
      }
      
      .audio-section-header i {
        margin-right: 10px;
        color: #8F6D8C;
      }
      
      .audio-player-container {
        background: #f9f6fa;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        margin-top: 10px;
      }
      
      .chapter-audio-player {
        width: 100%;
        margin-bottom: 5px;
      }
      
      .audio-description {
        font-size: 12px;
        color: #8F6D8C;
        margin: 5px 0 0;
        text-align: right;
      }
      
      .toc-number {
        display: inline-block;
        width: 25px;
        height: 25px;
        background: #8F6D8C;
        color: white;
        text-align: center;
        line-height: 25px;
        border-radius: 50%;
        margin-right: 10px;
        font-size: 14px;
      }
      
      .audio-control-btn {
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 12px;
        margin-left: 8px;
        cursor: pointer;
        font-size: 0.9em;
        transition: all 0.2s ease;
      }
      
      .audio-control-btn:hover {
        background: var(--primary-dark);
        transform: translateY(-2px);
      }
    `;
    document.head.appendChild(styleSheet);
  }
  
  // Inicializuojame papildomus stilius, kai puslapis užkraunamas
  addCustomStyles();
  
  // Initialize plan UI
  if (typeof updatePlanButtons === 'function') {
    updatePlanButtons();
  }
  
  if (typeof updateVoiceSelector === 'function') {
    updateVoiceSelector();
  }

  // Add the Google login functionality
  let googleUser = null;

  // Initialize Google Sign-In
  function initializeGoogleSignIn() {
    google.accounts.id.initialize({
      client_id: '377434162573-1fvt50m49lga2fmfqa7vfa2ijhkgc8b2.apps.googleusercontent.com',
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    });
    
    google.accounts.id.renderButton(
      document.getElementById("signInDiv"), 
      { 
        theme: "outline", 
        size: "medium",
        type: "standard",
        shape: "rectangular",
        text: "signin_with",
        logo_alignment: "left"
      }
    );
    
    // Also handle the case where user is already signed in
    google.accounts.id.prompt();
  }

  // Handle the sign-in response
  function handleCredentialResponse(response) {
    const credentials = parseJwt(response.credential);
    
    // Update user information
    googleUser = {
      id: credentials.sub,
      name: credentials.name,
      email: credentials.email,
      picture: credentials.picture,
      token: response.credential
    };
    
    // Hide Google Sign-In button and show user profile
    document.getElementById('signInDiv').style.display = 'none';
    document.getElementById('userProfile').style.display = 'flex';
    
    // Update user information in the UI
    document.getElementById('userName').textContent = googleUser.name.split(' ')[0];
    
    // Create avatar image
    const avatarContainer = document.getElementById('userAvatar');
    avatarContainer.innerHTML = `<img src="${googleUser.picture}" alt="${googleUser.name}">`;
    
    // Display a welcome message
    showAlert(`Welcome back, ${googleUser.name.split(' ')[0]}!`);
  }

  // Parse JWT token
  function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  }

  // Load user plan data from database
  function loadUserPlanData() {
    if (!googleUser) return;
    
    // For now, we'll try to get from localStorage first, 
    // but in a production app this would be stored in a database
    try {
      const userId = googleUser.id;
      const savedPlan = localStorage.getItem(`userPlan_${userId}`);
      
      if (savedPlan) {
        userPlan = JSON.parse(savedPlan);
      } else {
        // Create new plan for the user
        userPlan = {
          userId: userId,
          type: 'free',
          booksGenerated: 0,
          maxBooks: 3,
          resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
        };
        savePlanToStorage();
      }
      
      // Check if we need to reset the counter (new month)
      const resetDate = new Date(userPlan.resetDate);
      const currentDate = new Date();
      if (currentDate > resetDate) {
        // It's a new month, reset counter
        userPlan.booksGenerated = 0;
        userPlan.resetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toISOString();
        savePlanToStorage();
      }
      
      // Update UI to reflect plan
      updatePlanButtons();
      updateVoiceSelector();
    } catch (e) {
      console.error("Error loading user plan", e);
    }
  }

  // Update savePlanToStorage function to save with user ID
  function savePlanToStorage() {
    if (googleUser) {
      localStorage.setItem(`userPlan_${googleUser.id}`, JSON.stringify(userPlan));
    } else {
      // Fallback to anonymous storage
      localStorage.setItem('userPlan', JSON.stringify(userPlan));
    }
  }

  // Handle sign out
  function handleSignOut() {
    googleUser = null;
    document.getElementById('signInDiv').style.display = 'block';
    document.getElementById('userProfile').style.display = 'none';
    
    // Reset UI
    document.getElementById('userAvatar').innerHTML = '';
    document.getElementById('userName').textContent = 'User';
    
    // Load anonymous plan
    try {
      const savedPlan = localStorage.getItem('userPlan');
      if (savedPlan) {
        userPlan = JSON.parse(savedPlan);
      } else {
        userPlan = {
          type: 'free',
          booksGenerated: 0,
          maxBooks: 3,
          resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
        };
      }
      updatePlanButtons();
      updateVoiceSelector();
    } catch (e) {
      console.error("Error loading anonymous plan", e);
    }
    
    showAlert("You've been signed out");
  }

  // Show account settings modal
  function showAccountSettings() {
    if (!googleUser) return;
    
    const planType = userPlan.type === 'premium' ? 'Premium' : 'Free';
    const planClass = userPlan.type === 'premium' ? 'premium-plan' : 'free-plan';
    
    const modalHtml = `
      <div class="account-modal">
        <div class="account-modal-content">
          <div class="account-modal-header">
            <h3><i class="fas fa-user-circle"></i> Account Settings</h3>
            <button class="account-modal-close"><i class="fas fa-times"></i></button>
          </div>
          <div class="account-user-info">
            <div class="account-avatar">
              <img src="${googleUser.picture}" alt="${googleUser.name}">
            </div>
            <div class="account-details">
              <div class="account-name">${googleUser.name}</div>
              <div class="account-email">${googleUser.email}</div>
              <div class="account-status">
                <div class="status-indicator" style="background: ${planType === 'Premium' ? 'var(--accent-color)' : 'var(--primary-color)'}"></div>
                <span class="${planClass}">${planType} Plan</span>
              </div>
            </div>
          </div>
          <div class="account-usage">
            <h4>Usage Statistics</h4>
            <div class="usage-stat">
              <span>Books Generated This Month:</span>
              <span>${userPlan.booksGenerated} / ${userPlan.maxBooks === Infinity ? 'Unlimited' : userPlan.maxBooks}</span>
            </div>
            <div class="usage-stat">
              <span>Reset Date:</span>
              <span>${new Date(userPlan.resetDate).toLocaleDateString()}</span>
            </div>
          </div>
          <div class="account-modal-footer">
            <button class="close-btn">Close</button>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to the page
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
    
    // Handle close button and click outside
    const modal = modalContainer.querySelector('.account-modal');
    const closeBtn = modal.querySelector('.close-btn');
    const closeIcon = modal.querySelector('.account-modal-close');
    
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modalContainer);
    });
    
    closeIcon.addEventListener('click', () => {
      document.body.removeChild(modalContainer);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modalContainer);
      }
    });
  }

  // Show subscription status modal
  function showSubscriptionStatus() {
    if (!googleUser) return;
    
    const planType = userPlan.type === 'premium' ? 'Premium' : 'Free';
    
    const modalHtml = `
      <div class="account-modal">
        <div class="account-modal-content">
          <div class="account-modal-header">
            <h3><i class="fas fa-crown"></i> Your Subscription</h3>
            <button class="account-modal-close"><i class="fas fa-times"></i></button>
          </div>
          <div class="subscription-info">
            <div class="current-plan">
              <h4>Current Plan: ${planType}</h4>
              <p>${planType === 'Premium' ? 'You have unlimited access to all features' : 'You can generate up to 3 books per month'}</p>
            </div>
            ${planType === 'Free' ? `
            <div class="upgrade-section">
              <h4>Upgrade to Premium</h4>
              <p>Unlock unlimited books, all narrator voices, and premium features.</p>
              <button class="premium-button upgrade-btn">Upgrade Now (€9.99/month)</button>
            </div>
            ` : `
            <div class="manage-subscription">
              <h4>Manage Your Subscription</h4>
              <p>Your premium subscription renews automatically each month.</p>
              <button class="downgrade-btn">Cancel Subscription</button>
            </div>
            `}
          </div>
          <div class="account-modal-footer">
            <button class="close-btn">Close</button>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to the page
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
    
    // Handle close button and click outside
    const modal = modalContainer.querySelector('.account-modal');
    const closeBtn = modal.querySelector('.close-btn');
    const closeIcon = modal.querySelector('.account-modal-close');
    
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modalContainer);
    });
    
    closeIcon.addEventListener('click', () => {
      document.body.removeChild(modalContainer);
    });
    
    // Handle upgrade button
    const upgradeBtn = modal.querySelector('.upgrade-btn');
    if (upgradeBtn) {
      upgradeBtn.addEventListener('click', () => {
        userPlan.type = 'premium';
        userPlan.maxBooks = Infinity;
        savePlanToStorage();
        updatePlanButtons();
        updateVoiceSelector();
        document.body.removeChild(modalContainer);
        showAlert("You've been upgraded to Premium!");
      });
    }
    
    // Handle downgrade button
    const downgradeBtn = modal.querySelector('.downgrade-btn');
    if (downgradeBtn) {
      downgradeBtn.addEventListener('click', () => {
        userPlan.type = 'free';
        userPlan.maxBooks = 3;
        savePlanToStorage();
        updatePlanButtons();
        updateVoiceSelector();
        document.body.removeChild(modalContainer);
        showAlert("Your subscription has been canceled.");
      });
    }
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modalContainer);
      }
    });
  }

  // Add style for usage statistics
  const usageStatsStyle = document.createElement('style');
  usageStatsStyle.textContent = `
    .account-usage {
      margin-top: 1.5em;
    }
    
    .account-usage h4 {
      font-family: 'Playfair Display', serif;
      color: var(--primary-dark);
      margin-bottom: 0.8em;
    }
    
    .usage-stat {
      display: flex;
      justify-content: space-between;
      padding: 0.8em;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .usage-stat:last-child {
      border-bottom: none;
    }
    
    .subscription-info {
      margin: 1.5em 0;
    }
    
    .current-plan {
      padding: 1em;
      border-radius: var(--radius);
      background: #f9f9f9;
      margin-bottom: 1.5em;
    }
    
    .current-plan h4 {
      color: var(--primary-dark);
      margin-bottom: 0.5em;
      font-family: 'Playfair Display', serif;
    }
    
    .upgrade-section, .manage-subscription {
      padding: 1em;
      border-radius: var(--radius);
      border: 1px solid #eee;
      margin-top: 1.5em;
    }
    
    .upgrade-section h4, .manage-subscription h4 {
      color: var(--primary-dark);
      margin-bottom: 0.5em;
      font-family: 'Playfair Display', serif;
    }
    
    .upgrade-btn {
      margin-top: 1em;
      width: 100%;
    }
    
    .downgrade-btn {
      margin-top: 1em;
      width: 100%;
      background: #f44336;
      color: white;
      padding: 0.7em 1.5em;
      border: none;
      border-radius: var(--radius);
      cursor: pointer;
      transition: var(--transition);
    }
    
    .downgrade-btn:hover {
      background: #d32f2f;
    }
    
    .free-plan {
      color: var(--primary-color);
    }
    
    .premium-plan {
      color: var(--accent-color);
    }
  `;
  document.head.appendChild(usageStatsStyle);

  // Inicializuojame papildomus stilius, kai puslapis užkraunamas
  addCustomStyles();
  
  // Initialize Google Sign-In functionality
  if (typeof google !== 'undefined' && google.accounts) {
    initializeGoogleSignIn();
  } else {
    // If Google Sign-In script hasn't loaded yet, wait for it
    window.onload = function() {
      if (typeof google !== 'undefined' && google.accounts) {
        initializeGoogleSignIn();
      } else {
        console.error('Google Sign-In failed to load');
      }
    };
  }
  
  // Add event listeners for user account buttons (only if elements exist)
  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', handleSignOut);
  }
  
  const accountSettingsBtn = document.getElementById('accountSettings');
  if (accountSettingsBtn) {
    accountSettingsBtn.addEventListener('click', showAccountSettings);
  }
  
  const subscriptionStatusBtn = document.getElementById('subscriptionStatus');
  if (subscriptionStatusBtn) {
    subscriptionStatusBtn.addEventListener('click', showSubscriptionStatus);
  }
  
  // Initialize plan UI
  if (typeof updatePlanButtons === 'function') {
    updatePlanButtons();
  }
  
  if (typeof updateVoiceSelector === 'function') {
    updateVoiceSelector();
  }
}); 