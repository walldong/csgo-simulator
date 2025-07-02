// 图片下载脚本配置文件
module.exports = {
    // 下载配置
    download: {
      concurrent: 10,        // 并发下载数量
      retryAttempts: 3,      // 重试次数
      retryDelay: 1000,      // 重试延迟（毫秒）
      timeout: 30000,        // 请求超时时间（毫秒）
    },
    
    // 目录配置
    directories: {
      images: 'public/images',
      crates: 'public/images/crates',
      skins: 'public/images/skins',
      collections: 'public/images/collections',
    },
    
    // 数据源文件
    dataFiles: {
      crates: 'public/crates.json',
      skins: 'public/skins.json',
      collections: 'public/collections.json',
    },
    
    // 网络配置
    network: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      headers: {
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      }
    },
    
    // 日志配置
    logging: {
      showProgress: true,    // 显示进度
      showDetails: true,     // 显示详细信息
      logLevel: 'info',      // 日志级别: 'error', 'warn', 'info', 'debug'
    }
  };