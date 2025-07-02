const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const config = require('./config');

// 配置
const CONFIG = {
  CONCURRENT_DOWNLOADS: config.download.concurrent,
  RETRY_ATTEMPTS: config.download.retryAttempts,
  RETRY_DELAY: config.download.retryDelay,
  TIMEOUT: config.download.timeout,
};

// 目录配置
const DIRS = {
  IMAGES: path.join(__dirname, '..', config.directories.images),
  CRATES: path.join(__dirname, '..', config.directories.crates),
  SKINS: path.join(__dirname, '..', config.directories.skins),
  COLLECTIONS: path.join(__dirname, '..', config.directories.collections),
};

// 统计信息
const stats = {
  total: 0,
  downloaded: 0,
  skipped: 0,
  failed: 0,
  startTime: Date.now(),
};

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 下载图片函数（带重试）
async function downloadImage(url, filepath, retryCount = 0) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const request = protocol.get(url, {
      timeout: CONFIG.TIMEOUT,
      headers: {
        'User-Agent': config.network.userAgent,
        ...config.network.headers
      }
    }, (response) => {
      if (response.statusCode !== 200) {
        const error = new Error(`HTTP ${response.statusCode}: ${url}`);
        if (retryCount < CONFIG.RETRY_ATTEMPTS) {
          if (config.logging.showDetails) {
            console.log(`⚠️  Retrying (${retryCount + 1}/${CONFIG.RETRY_ATTEMPTS}): ${path.basename(filepath)}`);
          }
          setTimeout(() => {
            downloadImage(url, filepath, retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, CONFIG.RETRY_DELAY);
          return;
        }
        reject(error);
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        stats.downloaded++;
        if (config.logging.showProgress) {
          updateProgress();
        }
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => {}); // 删除不完整的文件
        if (retryCount < CONFIG.RETRY_ATTEMPTS) {
          if (config.logging.showDetails) {
            console.log(`⚠️  Retrying (${retryCount + 1}/${CONFIG.RETRY_ATTEMPTS}): ${path.basename(filepath)}`);
          }
          setTimeout(() => {
            downloadImage(url, filepath, retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, CONFIG.RETRY_DELAY);
        } else {
          reject(err);
        }
      });
    });

    request.on('error', (err) => {
      if (retryCount < CONFIG.RETRY_ATTEMPTS) {
        if (config.logging.showDetails) {
          console.log(`⚠️  Retrying (${retryCount + 1}/${CONFIG.RETRY_ATTEMPTS}): ${path.basename(filepath)}`);
        }
        setTimeout(() => {
          downloadImage(url, filepath, retryCount + 1)
            .then(resolve)
            .catch(reject);
        }, CONFIG.RETRY_DELAY);
      } else {
        reject(err);
      }
    });

    request.on('timeout', () => {
      request.destroy();
      if (retryCount < CONFIG.RETRY_ATTEMPTS) {
        if (config.logging.showDetails) {
          console.log(`⚠️  Timeout, retrying (${retryCount + 1}/${CONFIG.RETRY_ATTEMPTS}): ${path.basename(filepath)}`);
        }
        setTimeout(() => {
          downloadImage(url, filepath, retryCount + 1)
            .then(resolve)
            .catch(reject);
        }, CONFIG.RETRY_DELAY);
      } else {
        reject(new Error(`Timeout: ${url}`));
      }
    });
  });
}

// 从URL中提取文件名
function getFilenameFromUrl(url) {
  const urlParts = url.split('/');
  return urlParts[urlParts.length - 1];
}

// 更新进度显示
function updateProgress() {
  const progress = ((stats.downloaded + stats.skipped) / stats.total * 100).toFixed(1);
  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  process.stdout.write(`\r📊 Progress: ${progress}% (${stats.downloaded + stats.skipped}/${stats.total}) | ⏱️  ${elapsed}s | ✅ ${stats.downloaded} | ⏭️  ${stats.skipped} | ❌ ${stats.failed}`);
}

// 并发下载队列
class DownloadQueue {
  constructor(concurrency) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  async add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { task, resolve, reject } = this.queue.shift();

    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }
}

// 处理JSON文件中的图片
async function processJsonFile(jsonPath, outputDir, type) {
  console.log(`\n📁 Processing ${type} from: ${path.basename(jsonPath)}`);
  
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
  
  // 创建下载队列
  const downloadQueue = new DownloadQueue(CONFIG.CONCURRENT_DOWNLOADS);
  const downloadPromises = [];
  
  // 准备下载任务
  for (const url of imageUrls) {
    const filename = getFilenameFromUrl(url);
    const filepath = path.join(outputDir, filename);
    
    // 如果文件已存在，跳过下载
    if (fs.existsSync(filepath)) {
      stats.skipped++;
      if (config.logging.showProgress) {
        updateProgress();
      }
      continue;
    }
    
    const downloadTask = async () => {
      try {
        await downloadImage(url, filepath);
        if (config.logging.showDetails) {
          console.log(`\n✅ Downloaded: ${filename}`);
        }
      } catch (error) {
        stats.failed++;
        if (config.logging.showProgress) {
          updateProgress();
        }
        if (config.logging.showDetails) {
          console.error(`\n❌ Failed to download ${filename}:`, error.message);
        }
        throw error;
      }
    };
    
    downloadPromises.push(downloadQueue.add(downloadTask));
  }
  
  // 等待所有下载完成
  await Promise.allSettled(downloadPromises);
  console.log(`\n✅ Completed processing ${type}`);
}

// 显示最终统计信息
function showFinalStats() {
  const totalTime = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  console.log('\n' + '='.repeat(60));
  console.log('📊 DOWNLOAD STATISTICS');
  console.log('='.repeat(60));
  console.log(`Total images found: ${stats.total}`);
  console.log(`Successfully downloaded: ${stats.downloaded}`);
  console.log(`Skipped (already exists): ${stats.skipped}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Total time: ${totalTime} seconds`);
  console.log(`Average speed: ${(stats.downloaded / totalTime).toFixed(2)} images/second`);
  console.log(`Images saved to: ${DIRS.IMAGES}`);
  console.log('='.repeat(60));
}

// 主函数
async function main() {
  console.log('🚀 Starting advanced image download process...');
  console.log(`⚙️  Configuration: ${CONFIG.CONCURRENT_DOWNLOADS} concurrent downloads, ${CONFIG.RETRY_ATTEMPTS} retry attempts`);
  
  // 创建目录
  Object.values(DIRS).forEach(ensureDir);
  
  const publicDir = path.join(__dirname, '..', 'public');
  
  try {
    // 首先统计总图片数量
    const files = ['crates.json', 'skins.json', 'collections.json'];
    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(path.join(publicDir, file), 'utf8'));
      const imageUrls = new Set();
      
      function countImages(obj) {
        if (typeof obj === 'object' && obj !== null) {
          for (const [key, value] of Object.entries(obj)) {
            if (key === 'image' && typeof value === 'string' && value.startsWith('http')) {
              imageUrls.add(value);
            } else if (typeof value === 'object') {
              countImages(value);
            }
          }
        } else if (Array.isArray(obj)) {
          obj.forEach(item => countImages(item));
        }
      }
      
      countImages(data);
      stats.total += imageUrls.size;
    }
    
    console.log(`📊 Total unique images to process: ${stats.total}`);
    
    // 处理各个JSON文件
    await processJsonFile(
      path.join(publicDir, 'crates.json'),
      DIRS.CRATES,
      'crates'
    );
    
    await processJsonFile(
      path.join(publicDir, 'skins.json'),
      DIRS.SKINS,
      'skins'
    );
    
    await processJsonFile(
      path.join(publicDir, 'collections.json'),
      DIRS.COLLECTIONS,
      'collections'
    );
    
    showFinalStats();
    
  } catch (error) {
    console.error('\n❌ Error during download process:', error);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { downloadImage, processJsonFile, DownloadQueue };