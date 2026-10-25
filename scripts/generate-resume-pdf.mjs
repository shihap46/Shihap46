import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const tempHtmlPath = path.join(rootDir, "temp-resume.html");
const outputPdfPath = path.join(publicDir, "resume.pdf");

const resumeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SHIHAPDEEN S. - Resume</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 20mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      line-height: 1.45;
      font-size: 10pt;
      -webkit-font-smoothing: antialiased;
    }
    .header {
      text-align: center;
      margin-bottom: 16px;
    }
    .header h1 {
      font-size: 20pt;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #000000;
      margin-bottom: 4px;
    }
    .header .subtitle {
      font-size: 9.5pt;
      font-weight: 600;
      letter-spacing: 1px;
      color: #374151;
      margin-bottom: 6px;
    }
    .header .contact-line {
      font-size: 9pt;
      color: #4b5563;
      margin-bottom: 3px;
    }
    .header .contact-line a {
      color: #2563eb;
      text-decoration: underline;
    }
    .header .github-link {
      font-size: 9pt;
    }
    .header .github-link a {
      color: #2563eb;
      text-decoration: underline;
    }
    .section {
      margin-bottom: 13px;
    }
    .section-title {
      font-size: 10pt;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #000000;
      border-bottom: 1.5px solid #000000;
      padding-bottom: 2px;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .summary-text {
      text-align: justify;
      color: #1f2937;
      font-size: 9.2pt;
      line-height: 1.42;
    }
    .skills-list {
      display: flex;
      flex-direction: column;
      gap: 3px;
      font-size: 9.2pt;
    }
    .skill-item {
      color: #1f2937;
    }
    .skill-item strong {
      color: #000000;
      font-weight: 600;
    }
    .experience-item {
      margin-bottom: 8px;
    }
    .row-between {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 9.3pt;
    }
    .item-title {
      font-weight: 600;
      color: #000000;
    }
    .item-date {
      color: #374151;
      font-style: italic;
      font-size: 8.8pt;
    }
    .item-company {
      font-size: 9pt;
      color: #374151;
      margin-top: 1px;
    }
    .project-item {
      margin-bottom: 8px;
    }
    .project-name {
      font-weight: 600;
      font-size: 9.3pt;
      color: #000000;
      margin-bottom: 2px;
    }
    ul.project-bullets {
      list-style-type: disc;
      padding-left: 18px;
      margin: 0;
    }
    ul.project-bullets li {
      font-size: 9pt;
      color: #1f2937;
      line-height: 1.4;
      margin-bottom: 2px;
    }
    .areas-text {
      font-size: 9.2pt;
      color: #1f2937;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>SHIHAPDEEN S.</h1>
    <div class="subtitle">SOFTWARE DEVELOPMENT &bull; AI APPLICATIONS &bull; DATA ANALYTICS</div>
    <div class="contact-line">
      Coimbatore, Tamil Nadu, India &nbsp;|&nbsp; 7845765418 &nbsp;|&nbsp; <a href="mailto:shihaps561@gmail.com">shihaps561@gmail.com</a>
    </div>
    <div class="github-link">
      <a href="https://github.com/shihap46/Shihap46" target="_blank">github.com/shihap46/Shihap46</a>
    </div>
  </div>

  <div class="section">
    <div class="section-title">PROFESSIONAL SUMMARY</div>
    <p class="summary-text">
      Second-year B.Tech Artificial Intelligence and Data Science student seeking a software development internship. Knowledge of C, C++, Python, Java, HTML and CSS, with completed internships in AI-driven software development and machine learning. Interested in building practical web applications and applying AI to real-world problems.
    </p>
  </div>

  <div class="section">
    <div class="section-title">TECHNICAL AND PROFESSIONAL SKILLS</div>
    <div class="skills-list">
      <div class="skill-item"><strong>Programming Languages:</strong> C, C++, Python, Java</div>
      <div class="skill-item"><strong>Web Technologies:</strong> HTML, CSS</div>
      <div class="skill-item"><strong>AI and Data:</strong> Fundamentals of artificial intelligence, machine learning and data analysis</div>
      <div class="skill-item"><strong>Tools:</strong> Git, GitHub, Microsoft Word, Microsoft PowerPoint</div>
      <div class="skill-item"><strong>Professional Skills:</strong> Problem-solving, teamwork, communication, presentation, research and analysis</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">INTERNSHIP EXPERIENCE</div>
    <div class="experience-item">
      <div class="row-between">
        <span class="item-title">AI Driven Software Development</span>
        <span class="item-date">1-30 May 2026</span>
      </div>
      <div class="item-company">Pantech Solutions India Pvt. Ltd.</div>
    </div>
    <div class="experience-item">
      <div class="row-between">
        <span class="item-title">AI and Machine Learning</span>
        <span class="item-date">Duration: 1 week</span>
      </div>
      <div class="item-company">Skillsync Pro Pvt. Ltd., Nagercoil</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">PROJECT CONCEPTS</div>
    <div class="project-item">
      <div class="project-name">Emergency Blood Donor Network</div>
      <ul class="project-bullets">
        <li>Outlined a platform to connect hospitals with nearby blood donors during urgent requests.</li>
        <li>Planned matching by blood group, donor eligibility, availability and distance, with notifications and verification features.</li>
      </ul>
    </div>
    <div class="project-item">
      <div class="project-name">SolarScope Rooftop Solar Potential Analyzer</div>
      <ul class="project-bullets">
        <li>Proposed analysis of roof conditions and shading to assess rooftop suitability and estimate solar potential.</li>
        <li>Explored payback estimates to help households evaluate solar installations.</li>
      </ul>
    </div>
    <div class="project-item">
      <div class="project-name">Smart Energy Waste Detection and Saving Platform</div>
      <ul class="project-bullets">
        <li>Explored an AI-assisted platform to identify potential energy waste in homes and small businesses and provide practical energy-saving insights.</li>
      </ul>
    </div>
  </div>

  <div class="section">
    <div class="section-title">EDUCATION</div>
    <div class="row-between">
      <span class="item-title">B.Tech in Artificial Intelligence and Data Science</span>
      <span class="item-date">II Year, currently pursuing</span>
    </div>
    <div class="item-company">Mohamed Sathak Engineering College</div>
  </div>

  <div class="section">
    <div class="section-title">AREAS OF INTEREST</div>
    <div class="areas-text">
      Software Development &bull; Full-Stack Web Development &bull; AI Applications<br>
      Machine Learning &bull; Data Analytics
    </div>
  </div>

  <div class="section" style="margin-bottom: 0;">
    <div class="section-title">LANGUAGES</div>
    <div class="areas-text">
      Tamil &bull; English
    </div>
  </div>
</body>
</html>
`;

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(tempHtmlPath, resumeHtml, "utf-8");
console.log("Written temp HTML at:", tempHtmlPath);

// Chrome executable path
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const chromeCmd = `"${chromePath}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${outputPdfPath}" "file:///${tempHtmlPath.replace(/\\/g, "/")}"`;

console.log("Generating PDF with Chrome...");
try {
  execSync(chromeCmd, { stdio: "inherit" });
  if (fs.existsSync(outputPdfPath)) {
    const stats = fs.statSync(outputPdfPath);
    console.log(`Successfully generated public/resume.pdf (${stats.size} bytes)!`);
  } else {
    console.error("PDF generation completed but output file not found!");
  }
} catch (err) {
  console.error("Error executing chrome command:", err);
} finally {
  if (fs.existsSync(tempHtmlPath)) {
    fs.unlinkSync(tempHtmlPath);
  }
}
