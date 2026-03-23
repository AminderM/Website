const fs = require('fs');
const filePath = 'c:\\Users\\Magic\\OneDrive\\Documents\\Integra AI\\Website\\Website\\src\\pages\\BOLGeneratorPage.tsx';

let content = fs.readFileSync(filePath, 'utf8');

// Inject the ResizeObserver hook to responsively scale the massive 2480x3508 wrapper into the web preview panel
const hookInjection = `const isDark = theme === 'dark';
  const previewRef = React.useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = React.useState(0.25);

  React.useEffect(() => {
    if (!previewRef.current) return;
    const ob = new ResizeObserver(entries => {
      setPreviewScale(entries[0].contentRect.width / 2480);
    });
    ob.observe(previewRef.current);
    return () => ob.disconnect();
  }, []);`;

content = content.replace(`const isDark = theme === 'dark';`, hookInjection);

const startIndex = content.indexOf('{/* BOL with watermark stripes */}');
const endIndex = content.indexOf('{/* Deleted secondary print styles');

if (startIndex === -1 || endIndex === -1) {
  console.log('Could not find injection boundaries.');
  process.exit(1);
}

let before = content.substring(0, startIndex);
let preview = content.substring(startIndex, endIndex);
let after = content.substring(endIndex);

// 2480 width / 712 native width = ~3.4831
const scaleFactor = 3.4831;
preview = preview.replace(/([0-9.]+)px/g, (match, p1) => {
  return Math.round(parseFloat(p1) * scaleFactor) + 'px';
});

// Replace the panel layout with the responsive scaler and attach the ref
before = before.replace(
  `style={{ aspectRatio: '2480 / 3508', height: 'auto', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>`,
  `ref={previewRef} style={{ width: '100%', aspectRatio: '2480 / 3508', position: 'relative', overflow: 'hidden' }}>`
);

// Wrap the preview code in the native 2480x3508 scaling div
preview = `\n            <div className="pdf-native-wrapper" style={{ width: '2480px', height: '3508px', transformOrigin: 'top left', transform: \`scale(\${previewScale})\`, backgroundColor: '#fff' }}>\n` + preview + `\n            </div>\n`;

content = before + preview + after;

// Update print styles to explicitly target a 2480x3508 output layout
content = content.replace(
  `@page { size: A4; margin: 0.25in; }`,
  `@page { size: 2480px 3508px; margin: 0; }`
);

content = content.replace(
  `width: 7.77in !important;
            height: 11.19in !important;`,
  `width: 2480px !important;
            height: 3508px !important;`
);

// We need to disable the React screen scale logic when printing, so the PDF generates natively at the full 2480x3508
const printScaleOverride = `
          .bol-preview-container .pdf-native-wrapper {
            transform: none !important;
          }`;
          
content = content.replace(`.print-reset {`, printScaleOverride + `\n          .print-reset {`);

fs.writeFileSync(filePath, content);
console.log('Script completed beautifully. BOL Generation refactored to native 2480x3508 rendering.');
