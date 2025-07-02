const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 创建图片存储目录
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const CRATES_DIR = path.join(IMAGES_DIR, 'crates');
const SKINS_DIR = path.join(IMAGES_DIR, 'skins');
const COLLECTIONS_DIR = path.join(IMAGES_DIR, 'collections');

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 下载图片函数
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`✅ Downloaded: ${path.basename(filepath)}`);
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => {}); // 删除不完整的文件
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// 从URL中提取文件名
function getFilenameFromUrl(url) {
  const urlParts = url.split('/');
  return urlParts[urlParts.length - 1];
}

// 处理JSON文件中的图片
async function processJsonFile(jsonPath, outputDir, type) {
  console.log(`\n📁 Processing ${type} from: ${jsonPath}`);
  
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const imageUrls = new Set();
  
  // 递归查找所有image字段
  function extractImageUrls(obj) {
    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'image' && typeof value === 'string' && value.startsWith('http')) {
          imageUrls.add(value);
        } else if (typeof value === 'object') {
          extractImageUrls(value);
        }
      }
    } else if (Array.isArray(obj)) {
      obj.forEach(item => extractImageUrls(item));
    }
  }
  
  extractImageUrls(data);
  
  console.log(`Found ${imageUrls.size} unique images in ${type}`);
  
  // 下载图片
  const downloadPromises = Array.from(imageUrls).map(async (url) => {
    try {
      const filename = getFilenameFromUrl(url);
      const filepath = path.join(outputDir, filename);
      
      // 如果文件已存在，跳过下载
      if (fs.existsSync(filepath)) {
        console.log(`⏭️  Skipped (already exists): ${filename}`);
        return;
      }
      
      await downloadImage(url, filepath);
    } catch (error) {
      console.error(`❌ Failed to download ${url}:`, error.message);
    }
  });
  
  await Promise.all(downloadPromises);
  console.log(`✅ Completed processing ${type}`);
}

// 主函数
async function main() {
  console.log('🚀 Starting image download process...');
  
  // 创建目录
  ensureDir(IMAGES_DIR);
  ensureDir(CRATES_DIR);
  ensureDir(SKINS_DIR);
  ensureDir(COLLECTIONS_DIR);
  
  const publicDir = path.join(__dirname, '..', 'public');
  
  try {
    // 处理各个JSON文件
    await processJsonFile(
      path.join(publicDir, 'crates.json'),
      CRATES_DIR,
      'crates'
    );
    
    await processJsonFile(
      path.join(publicDir, 'skins.json'),
      SKINS_DIR,
      'skins'
    );
    
    await processJsonFile(
      path.join(publicDir, 'collections.json'),
      COLLECTIONS_DIR,
      'collections'
    );
    
    console.log('\n🎉 All images downloaded successfully!');
    console.log(`📁 Images saved to: ${IMAGES_DIR}`);
    
  } catch (error) {
    console.error('❌ Error during download process:', error);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { downloadImage, processJsonFile };