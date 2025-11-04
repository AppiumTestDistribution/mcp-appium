/**
 * Documentation tools for Appium
 *
 * This module provides tools for answering queries about Appium
 * by retrieving relevant information from indexed documentation.
 */

import {
  queryVectorStore,
  indexAllMarkdownFiles,
} from './simple-pdf-indexer.js';
import * as path from 'path';

/**
 * Interface for the query response
 */
interface QueryResponse {
  answer: string;
  sources?: string[];
  chunks?: string[];
}

/**
 * Initialize the Appium documentation index
 * @param resourcesPath Path to the resources directory containing markdown files
 */
export async function initializeAppiumDocumentation(
  resourcesPath?: string
): Promise<void> {
  try {
    // Default to submodules directory if not specified
    const docsPath =
      resourcesPath || path.resolve(__dirname, '../../resources/submodules');
    console.log(`Initializing Appium documentation from: ${docsPath}`);
    await indexAllMarkdownFiles(docsPath);
    console.log('Appium documentation indexing completed');
  } catch (error) {
    console.error('Error initializing Appium documentation:', error);
    throw error;
  }
}

/**
 * Answer a query about Appium using indexed documentation
 * @param options Query options
 * @returns Response with relevant chunks for the client LLM to process
 */
export async function answerAppiumQuery(options: {
  query: string;
}): Promise<QueryResponse> {
  try {
    const { query } = options;
    console.log(`Querying vector store for: "${query}"`);
    const results = await queryVectorStore(query); // Get relevant chunks

    if (!results || results.length === 0) {
      return {
        answer:
          'No relevant information found in the Appium documentation. Please try rephrasing your query.',
        chunks: [],
      };
    }

    // Extract the content from all retrieved documents
    const chunks = results.map((doc: any) => doc.pageContent);
    const sources = results
      .map(
        (doc: any) =>
          doc.metadata?.relativePath ||
          doc.metadata?.filename ||
          doc.metadata?.source
      )
      .filter(
        (source: any, index: number, arr: any[]) =>
          source && arr.indexOf(source) === index
      ); // Remove duplicates

    console.log(
      `Found ${results.length} relevant chunks from ${sources.length} sources`
    );

    // Return the chunks for the client LLM to process
    // The client will use its own LLM to generate the final answer
    return {
      answer: `Found ${
        results.length
      } relevant documentation chunks. Here are the relevant sections:\n\n${chunks.join(
        '\n\n---\n\n'
      )}`,
      sources,
      chunks,
    };
  } catch (error) {
    console.error('Error querying Appium documentation:', error);
    throw error;
  }
}
