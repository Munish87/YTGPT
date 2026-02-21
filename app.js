const canvas = document.getElementById('thumbnailCanvas');
const ctx = canvas.getContext('2d');

const bgUpload = document.getElementById('bgUpload');
const faceUpload = document.getElementById('faceUpload');
const titleText = document.getElementById('titleText');
const textColor = document.getElementById('textColor');
const faceScale = document.getElementById('faceScale');
const faceX = document.getElementById('faceX');
const faceY = document.getElementById('faceY');
const aiPrompt = document.getElementById('aiPrompt');
const aiStatus = document.getElementById('aiStatus');
const generateAiBtn = document.getElementById('generateAiBtn');
const randomizeBtn = document.getElementById('randomizeBtn');
const downloadBtn = document.getElementById('downloadBtn');

const backgroundImage = new Image();
const faceImage = new Image();
backgroundImage.crossOrigin = 'anonymous';
faceImage.crossOrigin = 'anonymous';

let hasBackground = false;
let hasFace = false;
let sdk;
let model;

const conceptTitles = [
  'I TESTED 100 AI TOOLS',
  'MY EDITING SECRET REVEALED',
  'THIS STRATEGY WENT VIRAL',
  'I BUILT THIS IN 24 HOURS',
  'STOP DOING THIS ON YOUTUBE'
];

async function initBytez() {
  if (model) {
    return model;
  }

  /*
    npm i bytez.js || yarn add bytez.js
  */
  const { default: Bytez } = await import('https://esm.sh/bytez.js');

  const key = '345358a5851492a4da3404f76f4d4348';
  sdk = new Bytez(key);

  // choose imagen-4.0-generate-001
  model = sdk.model('google/imagen-4.0-generate-001');
  return model;
}

function setStatus(message, isError = false) {
  aiStatus.textContent = message;
  aiStatus.classList.toggle('error', isError);
}

function loadImageSource(src, targetImage, onDone) {
  targetImage.onload = onDone;
  targetImage.src = src;
}

function loadImage(file, targetImage, onDone) {
  const reader = new FileReader();
  reader.onload = (event) => {
    loadImageSource(event.target.result, targetImage, onDone);
  };
  reader.readAsDataURL(file);
}

function resolveOutputImage(output) {
  if (typeof output === 'string') {
    return output;
  }

  if (Array.isArray(output) && output.length > 0) {
    return resolveOutputImage(output[0]);
  }

  if (output?.url) {
    return output.url;
  }

  if (output?.image_url) {
    return output.image_url;
  }

  if (output?.image) {
    return output.image;
  }

  if (output?.data?.[0]?.url) {
    return output.data[0].url;
  }

  return null;
}

async function generateAiBackground() {
  const prompt = aiPrompt.value.trim() || 'A cat in a wizard hat';

  try {
    generateAiBtn.disabled = true;
    setStatus('Generating image with Imagen 4.0...');

    const selectedModel = await initBytez();

    // send input to model
    const { error, output } = await selectedModel.run(prompt);

    console.log({ error, output });

    if (error) {
      throw new Error(typeof error === 'string' ? error : JSON.stringify(error));
    }

    const imageSource = resolveOutputImage(output);
    if (!imageSource) {
      throw new Error('No image URL found in model output.');
    }

    loadImageSource(imageSource, backgroundImage, () => {
      hasBackground = true;
      renderThumbnail();
      setStatus('AI background generated successfully.');
    });
  } catch (err) {
    setStatus(`AI generation failed: ${err.message}`, true);
  } finally {
    generateAiBtn.disabled = false;
  }
}

function drawBackdrop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (hasBackground) {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1d2f7a');
    gradient.addColorStop(1, '#090f26');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < 8; i += 1) {
      ctx.fillRect(i * 170, 0, 80, canvas.height);
    }
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawTitle() {
  const text = titleText.value.trim() || 'YOUR TITLE HERE';
  ctx.font = '900 110px Impact, Arial Black, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 16;

  const x = 60;
  const y = 70;
  const maxWidth = canvas.width * 0.65;

  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  lines.push(currentLine);

  lines.slice(0, 3).forEach((line, i) => {
    const lineY = y + i * 115;
    ctx.strokeStyle = '#101010';
    ctx.strokeText(line, x, lineY);
    ctx.fillStyle = textColor.value;
    ctx.fillText(line, x, lineY);
  });
}

function drawFace() {
  if (!hasFace) {
    return;
  }

  const scale = Number(faceScale.value);
  const width = faceImage.width * scale;
  const height = faceImage.height * scale;
  const x = Number(faceX.value) - width / 2;
  const y = Number(faceY.value) - height / 2;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 40;
  ctx.drawImage(faceImage, x, y, width, height);
  ctx.shadowBlur = 0;
}

function renderThumbnail() {
  drawBackdrop();
  drawTitle();
  drawFace();
}

generateAiBtn.addEventListener('click', generateAiBackground);

bgUpload.addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (!file) {
    return;
  }

  loadImage(file, backgroundImage, () => {
    hasBackground = true;
    renderThumbnail();
    setStatus('Loaded custom background image.');
  });
});

faceUpload.addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (!file) {
    return;
  }

  loadImage(file, faceImage, () => {
    hasFace = true;
    renderThumbnail();
  });
});

[titleText, textColor, faceScale, faceX, faceY].forEach((control) => {
  control.addEventListener('input', renderThumbnail);
});

randomizeBtn.addEventListener('click', () => {
  const randomTitle = conceptTitles[Math.floor(Math.random() * conceptTitles.length)];
  titleText.value = randomTitle;
  textColor.value = ['#ffe600', '#00f0ff', '#ff8df6', '#ff7a17'][Math.floor(Math.random() * 4)];
  faceScale.value = (0.35 + Math.random() * 0.9).toFixed(2);
  faceX.value = String(760 + Math.round(Math.random() * 420));
  faceY.value = String(330 + Math.round(Math.random() * 280));
  renderThumbnail();
});

downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'ytgpt-thumbnail.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

renderThumbnail();
