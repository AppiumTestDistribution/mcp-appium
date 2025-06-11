// Standalone Node.js script to generate locators for all elements from sourceXML
// Using existing functions from src/locators directory

import { getSuggestedLocators } from './locator-generation.js';
import { xmlToJSON, JSONElement } from './source-parsing.js';
import * as fs from 'fs';

interface FilterOptions {
  includeTagNames?: string[];
  excludeTagNames?: string[];
  requireAttributes?: string[];
  minAttributeCount?: number;
  fetchableOnly?: boolean;
  clickableOnly?: boolean;
}

interface ElementWithLocators {
  tagName: string;
  locators: Record<string, string>;
  text: string;
  contentDesc: string;
  resourceId: string;
  clickable: boolean;
  enabled: boolean;
  displayed: boolean;
}

// Main function to generate locators for all elements
function generateAllElementLocators(
  sourceXML: string,
  isNative: boolean = true,
  automationName: string = 'uiautomator2',
  filters: FilterOptions = {}
): ElementWithLocators[] {
  const {
    includeTagNames = [],
    excludeTagNames = ["hierarchy"],
    requireAttributes = [],
    minAttributeCount = 0,
    fetchableOnly = false,
    clickableOnly = false,
  } = filters;

  const sourceJSON = xmlToJSON(sourceXML);
  const allElementsWithLocators: ElementWithLocators[] = [];

  function shouldIncludeElement(element: JSONElement): boolean {
    // Apply filtering logic
    if (
      includeTagNames.length > 0 &&
      !includeTagNames.includes(element.tagName)
    ) {
      return false;
    }

    if (excludeTagNames.includes(element.tagName)) {
      return false;
    }

    if (requireAttributes.length > 0) {
      const hasRequiredAttr = requireAttributes.some(
        (attr) => element.attributes && element.attributes[attr]
      );
      if (!hasRequiredAttr) return false;
    }

    if (
      element.attributes &&
      Object.keys(element.attributes).length < minAttributeCount
    ) {
      return false;
    }

    if (clickableOnly && element.attributes?.clickable !== 'true') {
      return false;
    }

    if (fetchableOnly) {
      const interactableTags = [
        "EditText",
        "Button",
        "ImageButton",
        "CheckBox",
        "RadioButton",
        "Switch",
        "ToggleButton",
        "TextView",
      ];
      const isInteractable =
        interactableTags.some((tag) => element.tagName.includes(tag)) ||
        element.attributes?.clickable === "true" ||
        element.attributes?.focusable === "true";

      if (!isInteractable) return false;
    }

    return true;
  }

  function traverseElements(element: JSONElement): void {
    if (!element || !shouldIncludeElement(element)) {
      // Still traverse children even if parent is filtered out
      if (element && element.children) {
        element.children.forEach((child) => traverseElements(child));
      }
      return;
    }

    try {
      // Generate locators for current element
      const strategyMap = getSuggestedLocators(
        element,
        sourceXML,
        isNative,
        automationName
      );

      // Store element with its locators and path
      allElementsWithLocators.push({
        tagName: element.tagName,
        locators: Object.fromEntries(strategyMap),
        text: element.attributes.text || '',
        contentDesc: element.attributes['content-desc'] || '',
        resourceId: element.attributes['resource-id'] || '',
        clickable: element.attributes.clickable === 'true',
        enabled: element.attributes.enabled === 'true',
        displayed: element.attributes.displayed === 'true',
      });
    } catch (error) {
      console.error(
        `Error generating locators for element at path ${element.path}:`,
        error
      );
    }

    // Recursively process children
    if (element.children && element.children.length > 0) {
      element.children.forEach((child) => traverseElements(child));
    }
  }

  // Start traversal from root
  if (sourceJSON) {
    traverseElements(sourceJSON);
  }

  return allElementsWithLocators;
}

// Export results to different formats
function exportResults(results: ElementWithLocators[], format: string = 'json', filename: string = 'all-locators'): string {
  let content: string;
  let extension: string;

  switch (format.toLowerCase()) {
    case 'json':
      content = JSON.stringify(results, null, 2);
      extension = 'json';
      break;
    case 'csv':
      const headers = [
        'Path',
        'TagName',
        'Text',
        'ContentDesc',
        'ResourceId',
        'Bounds',
        'Clickable',
        'XPath',
        'ID',
        'ClassName',
        'AccessibilityId',
        'UiAutomator',
      ];
      const rows = results.map((item) => [
        item.tagName,
        item.text,
        item.contentDesc,
        item.resourceId,
        item.clickable.toString(),
        item.locators.xpath || '',
        item.locators.id || '',
        item.locators['class name'] || '',
        item.locators['accessibility id'] || '',
        item.locators['-android uiautomator'] || '',
      ]);
      content = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');
      extension = 'csv';
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  const outputFile = `${filename}.${extension}`;
  fs.writeFileSync(outputFile, content, 'utf8');
  console.log(`Results exported to ${outputFile}`);
  return outputFile;
}

// Export functions for use as module
export {
  generateAllElementLocators,
  exportResults,
  type FilterOptions,
  type ElementWithLocators
};
