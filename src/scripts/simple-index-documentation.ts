#!/usr/bin/env node
/**
 * Simple Documentation Indexing Script
 *
 * This script is a simplified version for indexing Markdown documents into an in-memory vector store
 * using LangChain's RecursiveCharacterTextSplitter and MemoryVectorStore.
 *
 * Usage:
 * - Index a single Markdown file: npm run simple-index-docs [markdownPath] [chunkSize] [overlap]
 * - Index all Markdown files in a directory: npm run simple-index-docs [dirPath] [chunkSize] [overlap]
 *
 * Examples:
 * - npm run simple-index-docs ./my-doc.md 1000 200
 * - npm run simple-index-docs ./src/resources 1000 200
 *
 * If no path is provided, it defaults to indexing all Markdown files in the src/resources directory.
 * If a file path is provided, it will index that specific file.
 * If a directory path is provided, it will index all Markdown files in that directory.
 */

import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import {
  indexMarkdown,
  indexAllMarkdownFiles,
} from '../tools/documentation/simple-pdf-indexer.js';

// Parse command line arguments
const args = process.argv.slice(2);
let markdownPath: string;
let chunkSize = 1000; // Default chunk size
let chunkOverlap = 200; // Default overlap
let indexSingleFile = false;

// Get Markdown path or directory path
if (args.length > 0 && args[0]) {
  // Use provided path
  markdownPath = path.resolve(process.cwd(), args[0]);

  // Check if the provided path is a file or directory
  if (fs.existsSync(markdownPath) && fs.statSync(markdownPath).isFile()) {
    indexSingleFile = true;
    console.log(`Using provided file path: ${markdownPath}`);
  } else {
    console.log(`Using provided directory path: ${markdownPath}`);
  }
} else {
  // Use default path to resources directory
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  markdownPath = path.resolve(__dirname, '../resources');
  console.log(`Using default resources directory: ${markdownPath}`);
}

// Get chunk size if provided
if (args.length > 1 && !isNaN(Number(args[1]))) {
  chunkSize = Number(args[1]);
  console.log(`Using chunk size: ${chunkSize}`);
}

// Get overlap if provided
if (args.length > 2 && !isNaN(Number(args[2]))) {
  chunkOverlap = Number(args[2]);
  console.log(`Using overlap: ${chunkOverlap}`);
}

// Log embeddings provider that will be used
console.log('Using sentence-transformers embeddings (no API key required)');

// Run the indexing process
console.log(
  'Starting simplified documentation indexing process with in-memory vector store...'
);

if (indexSingleFile) {
  // Index a single Markdown file
  console.log(`Indexing single Markdown file: ${markdownPath}`);
  indexMarkdown(markdownPath, chunkSize, chunkOverlap)
    .then(() => {
      console.log('Documentation indexing completed successfully');
      process.exit(0);
    })
    .catch((error: any) => {
      console.error('Documentation indexing failed:', error);
      process.exit(1);
    });
} else {
  // Index all Markdown files in the directory
  console.log(`Indexing all Markdown files in directory: ${markdownPath}`);
  indexAllMarkdownFiles(markdownPath, chunkSize, chunkOverlap)
    .then((indexedFiles: string[]) => {
      console.log(
        `Documentation indexing completed successfully for ${indexedFiles.length} Markdown files`
      );
      process.exit(0);
    })
    .catch((error: any) => {
      console.error('Documentation indexing failed:', error);
      process.exit(1);
    });
}
