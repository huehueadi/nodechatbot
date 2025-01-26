import puppeteer from "puppeteer";
import { scrapeAndUpload } from "../services/scrapingService.js";

export const scrapeWebsiteController = async (req, res) => {
    const { url, choice, bucketName, keyPrefix } = req.body;
  
    if (!url) {
      return res.status(400).json({ error: "URL is required for scraping" });
    }
  
    if (choice !== "all" && choice !== "current") {
      return res.status(400).json({ error: 'Invalid choice. It must be "all" or "current".' });
    }
  
    if (!bucketName) {
      return res.status(400).json({ error: "S3 bucket name is required." });
    }
  
    const browser = await puppeteer.launch({ headless: true });
  
    try {
      const startTime = Date.now();
  
      console.log(
        choice === "all" ? "Scraping the entire site..." : "Scraping the current page..."
      );
  
      const result = await scrapeAndUpload(browser, url, bucketName, keyPrefix || "scraped-data");
  
      const endTime = Date.now();
      const timeTaken = (endTime - startTime) / 1000;
  
      console.log("\n--- Scraping Summary ---");
      console.log(`Total Pages Scraped: ${result.totalPages}`);
      console.log(`Total Links Found: ${result.totalLinks}`);
      console.log(`Total PDFs Found: ${result.totalPdfs}`);
      console.log(`S3 Location: ${result.s3Location}`);
      console.log(`UUID: ${result.uuid}`);
      console.log(`Time Taken: ${timeTaken.toFixed(2)} seconds`);
  
      res.status(200).json({
        message: "Scraping and upload successful",
        totalPages: result.totalPages,
        totalLinks: result.totalLinks,
        totalPdfs: result.totalPdfs,
        s3Location: result.s3Location,
        uuid: result.uuid,  // Include UUID in the response
        timeTaken: timeTaken.toFixed(2),
      });
    } catch (error) {
      console.error("Scraping error:", error);
      res.status(500).json({ error: "Scraping failed" });
    } finally {
      await browser.close();
    }
  };
  