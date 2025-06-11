// Export all resources
import javaTemplatesResource from './java/template.js';

export default function registerResources(server: any) {
  javaTemplatesResource(server);
  console.log('All resources registered');
}
