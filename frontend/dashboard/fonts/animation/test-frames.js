const fs = require('fs');
const vm = require('vm');

const content = fs.readFileSync('./frames.js', 'utf8');
const context = {};
vm.runInNewContext(content, context);

const frames = context.frames;

console.log('=== FRAMES ANALYSIS ===');
console.log('Number of array elements:', frames.length);

if (frames.length > 0) {
  console.log('First element is a string:', typeof frames[0] === 'string');
  
  if (typeof frames[0] === 'string') {
    const lines = frames[0].split('\n');
    console.log('Total lines in first element:', lines.length);
    console.log('Sample line length:', lines[10] ? lines[10].length : 'N/A');
    
    // Try to detect frame height
    const uniqueLineLengths = [...new Set(lines.map(l => l.length))];
    console.log('Unique line lengths:', uniqueLineLengths.sort((a,b) => b-a).slice(0,5));
    
    // Sample some lines
    console.log('\nSample lines:');
    console.log('Line 1:', lines[1] ? lines[1].substring(0, 100) + '...' : 'N/A');
    console.log('Line 100:', lines[100] ? lines[100].substring(0, 100) + '...' : 'N/A');
    console.log('Line 200:', lines[200] ? lines[200].substring(0, 100) + '...' : 'N/A');
  }
}

if (frames.length > 1) {
  console.log('\n=== SECOND FRAME ===');
  const lines2 = frames[1].split('\n');
  console.log('Lines in second element:', lines2.length);
}

