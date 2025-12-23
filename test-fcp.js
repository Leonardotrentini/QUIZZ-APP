// Script para medir First Contentful Paint
// Execute com: node test-fcp.js

const puppeteer = require('puppeteer');

async function measureFCP() {
  console.log('🚀 Iniciando teste de First Contentful Paint...\n');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Monitora métricas de performance
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Obtém métricas de performance
  const metrics = await page.evaluate(() => {
    const perfData = window.performance.getEntriesByType('paint');
    const fcp = perfData.find(entry => entry.name === 'first-contentful-paint');
    const fp = perfData.find(entry => entry.name === 'first-paint');
    
    const navigation = performance.getEntriesByType('navigation')[0];
    const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
    const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
    
    return {
      firstPaint: fp ? Math.round(fp.startTime) : null,
      firstContentfulPaint: fcp ? Math.round(fcp.startTime) : null,
      domContentLoaded: Math.round(domContentLoaded),
      loadTime: Math.round(loadTime),
      totalTime: Math.round(navigation.loadEventEnd - navigation.fetchStart)
    };
  });
  
  console.log('📊 Resultados:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (metrics.firstPaint) {
    console.log(`🎨 First Paint:           ${metrics.firstPaint}ms`);
  }
  if (metrics.firstContentfulPaint) {
    console.log(`✨ First Contentful Paint: ${metrics.firstContentfulPaint}ms`);
  }
  console.log(`⚡ DOM Content Loaded:    ${metrics.domContentLoaded}ms`);
  console.log(`📦 Load Time:             ${metrics.loadTime}ms`);
  console.log(`⏱️  Total Time:            ${metrics.totalTime}ms`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Avaliação
  if (metrics.firstContentfulPaint) {
    if (metrics.firstContentfulPaint < 1800) {
      console.log('✅ EXCELENTE! FCP < 1.8s (Boa experiência)');
    } else if (metrics.firstContentfulPaint < 3000) {
      console.log('✅ BOM! FCP < 3s (Aceitável)');
    } else {
      console.log('⚠️  PODE MELHORAR! FCP > 3s');
    }
  }
  
  await browser.close();
}

measureFCP().catch(console.error);

