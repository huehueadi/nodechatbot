import AWS from 'aws-sdk';
import ScrapedData from '../models/scrappedDataModel.js';
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3({
  accessKeyId: 'AKIAVA5YKWJQASXNWYFI',
  secretAccessKey: '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',
  region: 'ap-south-1',
});

const BUCKET_NAME = 'webscrappedjsondata';

export const crawlWebsite = async (url, browser, visitedUrls = new Set()) => {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a'));
    return anchors
      .map(anchor => anchor.href)
      .filter(href => href.startsWith(window.location.origin));
  });

  await page.close();
  visitedUrls.add(url);

  const newLinks = links.filter(link => !visitedUrls.has(link));
  newLinks.forEach(link => visitedUrls.add(link));

  return { links: newLinks, visitedUrls };
};

export const scrapeBodyContent = async (browser, url) => {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'load' });

  await page.waitForSelector('body');
  const content = await page.evaluate(() => {
    const body = document.querySelector('body');
    const paragraphs = Array.from(body.querySelectorAll('p')).map(p => p.innerText) || [];
    const links = Array.from(body.querySelectorAll('a')).map(a => a.href) || [];
    return { paragraphs, links };
  });

  await page.close();
  return content;
};

const uploadToS3 = async (data, fileName) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: JSON.stringify(data, null, 2),
    ContentType: 'application/json',
  };

  try {
    const s3Response = await s3.upload(params).promise();
    return s3Response.Location;
  } catch (error) {
    console.error('Error uploading to S3:', error.message);
    throw new Error('Failed to upload to S3');
  }
};

export const scrapeAllPages = async (browser, links) => {
  const allParagraphs = new Set();
  const allLinks = new Set();
  const allUrls = new Set();

  const promises = links.map(async (link) => {
    try {
      const content = await scrapeBodyContent(browser, link);

      content.paragraphs.forEach(paragraph => allParagraphs.add(paragraph));
      content.links.forEach(link => allLinks.add(link));

      allUrls.add(link);
    } catch (error) {
      console.error(`Error scraping ${link}: ${error.message}`);
    }
  });

  await Promise.all(promises);

  const uniqueParagraphs = Array.from(allParagraphs);
  const uniqueLinks = Array.from(allLinks);
  const uniqueUrls = Array.from(allUrls);

  const data = {
    paragraphs: uniqueParagraphs,
    links: uniqueLinks,
    urls: uniqueUrls
  };

  const fileName = `scraped_data_${uuidv4()}.json`;

  const s3Url = await uploadToS3(data, fileName);

  const scrapedData = new ScrapedData({
    uuid: uuidv4(),
    s3Url: s3Url,
  });

  await scrapedData.save();
  console.log(`Scraped data saved to MongoDB with S3 URL: ${s3Url}`);

  return s3Url;
};





// import puppeteer from 'puppeteer';
// import { v4 as uuidv4 } from 'uuid';
// import AWS from 'aws-sdk';
// import ScrapedData from '../models/scrappedDataModel.js';

// // Configure AWS S3
// const s3 = new AWS.S3({
//   accessKeyId: 'AKIAVA5YKWJQASXNWYFI',
//   secretAccessKey: 'n5SRUXU3IhATCkpeoA8uThI2D74ei8AvDQCrttVV',
//   region: 'ap-south-1',
// });

// // Helper functions for scraping
// const sanitizeText = (text) => text.replace(/[^\x00-\x7F]/g, '').trim();

// const normalizeUrl = (baseUrl, relativeUrl) => {
//   return new URL(relativeUrl, baseUrl).href;
// };

// const scrapePage = async (page, url) => {
//   await page.goto(url, { waitUntil: 'domcontentloaded' });

//   const data = await page.evaluate(() => {
//     const titles = Array.from(document.querySelectorAll('h1, h2, h3')).map(el => el.innerText.trim());
//     const paragraphs = Array.from(document.querySelectorAll('p')).map(el => el.innerText.trim());
//     const spans = Array.from(document.querySelectorAll('span')).map(el => el.innerText.trim());
//     const divs = Array.from(document.querySelectorAll('div')).map(el => el.innerText.trim());
//     const allParagraphs = [...paragraphs, ...spans, ...divs];
//     const links = Array.from(document.querySelectorAll('a[href]')).map(el => ({
//       text: el.innerText.trim(),
//       url: el.href,
//     }));
//     const pdfLinks = Array.from(document.querySelectorAll('a[href]'))
//       .filter(el => el.href.toLowerCase().endsWith('.pdf'))
//       .map(el => el.href);

//     return {
//       url: window.location.href,
//       titles,
//       paragraphs: allParagraphs,
//       links,
//       pdfLinks,
//     };
//   });

//   return data;
// };

// const scrapeWebsite = async (browser, startingUrl) => {
//   const page = await browser.newPage();
//   const visited = new Set();
//   const toVisit = [startingUrl];
//   const allData = [];
//   let totalLinks = 0;
//   let totalPdfs = 0;

//   while (toVisit.length) {
//     const currentUrl = toVisit.pop();
//     if (visited.has(currentUrl)) continue;
//     visited.add(currentUrl);

//     console.log(`Scraping: ${currentUrl}`);
//     const data = await scrapePage(page, currentUrl);

//     if (data) {
//       allData.push(data);
//       totalLinks += data.links.length;
//       totalPdfs += data.pdfLinks.length;
//     }

//     const internalLinks = data.links
//       .map(link => normalizeUrl(currentUrl, link.url))
//       .filter(link => link.startsWith(startingUrl));
//     internalLinks.forEach(link => {
//       if (!visited.has(link)) toVisit.push(link);
//     });
//   }

//   await page.close();
//   return { allData, totalLinks, totalPdfs };
// };

// // Function to generate plain-text summary
// const generatePlainTextSummary = (data) => {
//   return data
//     .map(page => {
//       const sanitizedParagraphs = page.paragraphs.map(sanitizeText).join('\n- ');
//       const links = page.links
//         .map(link => `- ${sanitizeText(link.text)}: ${link.url}`)
//         .join('\n');
//       return `\n\nURL: ${page.url}\n\nParagraphs:\n- ${sanitizedParagraphs}\n\nLinks:\n${links}`;
//     })
//     .join('\n\n---\n\n');
// };

// // Function to upload plain-text data to S3
// const uploadToS3 = async (data, bucketName, key) => {
//   const plainTextData = generatePlainTextSummary(data);

//   try {
//     const params = {
//       Bucket: bucketName,
//       Key: key,
//       Body: plainTextData,
//       ContentType: 'text/plain',
//     };

//     const result = await s3.upload(params).promise();
//     console.log(`Data uploaded to S3: ${result.Location}`);
//     return result.Location;
//   } catch (error) {
//     console.error('Error uploading to S3:', error);
//     throw error;
//   }
// };

// // Main function to scrape and upload
// export const scrapeAndUpload = async (browser, startingUrl, bucketName, keyPrefix) => {
//   const { allData, totalLinks, totalPdfs } = await scrapeWebsite(browser, startingUrl);

//   const key = `${keyPrefix}/scraped_data_${Date.now()}.txt`; // Save as .txt
//   const location = await uploadToS3(allData, bucketName, key);

//   // Generate a UUID for this scrape session
//   const uuid = uuidv4();
//   const scrapedDataRecord = new ScrapedData({
//     uuid,
//     s3Url: location,
    
//   });

//   await scrapedDataRecord.save(); // Save to DB


//   console.log('Data stored in S3:', location);

//   return {
//     s3Location: location,
//     totalPages: allData.length,
//     totalLinks,
//     totalPdfs,
//     uuid,
//   };
// };


