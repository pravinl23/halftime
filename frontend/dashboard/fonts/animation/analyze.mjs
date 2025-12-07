import fs from 'fs';

// Load and execute the frames.js file
const content = fs.readFileSync('./frames.js', 'utf8');

// Create a simple eval context
const frames = eval(content.replace('const frames = ', ''));

console.log('Total array elements:', frames.length);

if (frames.length === 1) {
  const allLines = frames[0].split('\n');
  console.log('Total lines in the single string:', allLines.length);
  
  // Check if there's a pattern - like every N lines is a frame
  // Let's assume typical ASCII art is about 50 lines tall
  const possibleHeights = [40, 45, 50, 55, 60];
  
  console.log('\nChecking different frame heights:');
  possibleHeights.forEach(height => {
    const numFrames = Math.floor(allLines.length / height);
    console.log(`  Height ${height}: ${numFrames} frames`);
  });
  
  // Let's check if there are blank line separators
  const blankLineIndices = [];
  allLines.forEach((line, idx) => {
    if (line.trim() === '') {
      blankLineIndices.push(idx);
    }
  });
  console.log(`\nBlank lines found: ${blankLineIndices.length}`);
  
  // Sample first 60 lines
  console.log('\nFirst 60 lines (potential first frame):');
  for (let i = 0; i < Math.min(60, allLines.length); i++) {
    if (allLines[i].includes('#') || allLines[i].includes(' ') && !allLines[i].match(/^\*+$/)) {
      console.log(`Line ${i}: ${allLines[i].substring(0, 80)}${allLines[i].length > 80 ? '...' : ''}`);
    }
  }
}

